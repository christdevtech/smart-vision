# Fapshi Payment System Implementation Guide

This guide provides comprehensive instructions for implementing and deploying the robust Fapshi payment confirmation system.

## Overview

The payment system implements a **three-layer confirmation architecture** to ensure no payment confirmations are missed:

1. **Primary Layer: Real-time Webhooks** - Immediate notifications from Fapshi
2. **Secondary Layer: Automated Polling** - Regular status checks for pending transactions
3. **Tertiary Layer: Reconciliation** - Daily comparison with Fapshi records

## Quick Start

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
# Fapshi API Configuration
FAPSHI_API_USER=your_fapshi_api_user
FAPSHI_API_KEY=your_fapshi_api_key
FAPSHI_WEBHOOK_URL=/api/custom/payments/webhook/fapshi

# Security
CRON_SECRET=your_secure_random_string

# Application URLs
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

### 2. Database Migration

The enhanced `Transactions` collection is already configured. When you deploy, Payload CMS will automatically create the necessary database schema.

### 3. Webhook Configuration

Configure Fapshi to send webhooks to:

```
https://yourdomain.com/api/custom/payments/webhook/fapshi
```

### 4. Automated Tasks Setup

**✅ AUTOMATIC EXECUTION** - The payment system now runs automatically within your Payload CMS application using Payload's built-in Jobs Queue!

The following jobs are configured to run automatically using Payload's `autoRun` feature:

- **Payment Status Check Workflow**: Every 5 minutes (`*/5 * * * *`)
  - Checks all pending/initiated transactions
  - Updates status based on Fapshi API responses
  - Updates related subscriptions when payments are confirmed
- **Payment Reconciliation Workflow**: Every 6 hours (`0 */6 * * *`)
  - Reconciles transactions from the last 24 hours
  - Identifies and corrects discrepancies
  - Marks transactions as reconciled

**Key Features:**

- **Built-in Scheduling**: Uses Payload's native cron scheduling
- **Task Management**: Proper task/workflow separation following Payload best practices
- **Error Handling**: Built-in retry mechanisms and failure callbacks
- **Queue Management**: Separate queues for different job types
- **No External Dependencies**: No need for external cron services

**Job Structure:**

```
src/jobs/
├── tasks/
│   ├── paymentStatusCheck.ts     # Status check task handler
│   ├── paymentReconciliation.ts  # Reconciliation task handler
│   └── index.ts                  # Task exports
└── workflows/
    ├── paymentStatusWorkflow.ts      # Status check workflow
    ├── paymentReconciliationWorkflow.ts # Reconciliation workflow
    └── index.ts                      # Workflow exports
```

#### Optional: External Cron (for redundancy)

If you want additional redundancy, you can still set up external cron jobs that call the legacy endpoints:

```bash
# Status checks every 5 minutes (backup)
*/5 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/custom/payments/cron

# Daily reconciliation at 2 AM (backup)
0 2 * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/custom/payments/cron
```

## API Endpoints

### Payment Initiation

**POST** `/api/custom/payments/initiate`

```typescript
const response = await fetch('/api/custom/payments/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    plan: 'monthly', // "monthly" or "annual"
    phone: '677123456', // Cameroon phone number
    medium: 'mobile money', // Payment method
  }),
})

const result = await response.json()
// Returns: { success: true, transactionId, status, message, dateInitiated }
```

This route requires an authenticated Payload session. The server derives the user, account
identity, subscription, message, and configured plan price; caller-supplied values for those
fields are rejected. Initiation is limited to five attempts per user in ten minutes.

**GET** `/api/custom/payments/initiate?transactionId=xxx`

Read the authenticated user's transaction details by transaction ID. A transaction owned by a
different user is returned as not found.

### Webhook Handler

**POST** `/api/custom/payments/webhook/fapshi`

Fapshi does not currently document a webhook signature. The application therefore treats the
callback only as a status-change signal: it looks up a transaction that the platform initiated,
re-queries `/payment-status/{transId}` using server-held Fapshi credentials, and rejects any
provider response whose transaction ID, external ID, user ID, or amount differs from the local
record. Callback fields never directly activate a subscription.

A verified successful payment must create a unique `payment-settlements` ledger entry before it
can change subscription dates. The ledger creation, subscription update, and transaction update
share the Payload request transaction. Duplicate webhooks, browser polls, and concurrent workers
therefore resolve to the existing settlement without extending the subscription again.

Before the first deployment of this schema, back up the database and confirm that existing
non-empty `transactionId`, `fapshiTransId`, and `externalId` values contain no duplicates. The new
unique indexes intentionally fail deployment if historical transaction identifiers conflict.

### Status Checking

**POST** `/api/custom/payments/status-check`

Batch check all pending transactions:

```typescript
const response = await fetch('/api/custom/payments/status-check', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${CRON_SECRET}`,
  },
})
// Returns: { success: true, processed: 15, updated: 3 }
```

Batch status processing is restricted to administrators or callers presenting `CRON_SECRET`.

**GET** `/api/custom/payments/status-check?transactionId=xxx`

Manual status check for a transaction owned by the authenticated user. Provider polling is
rate-limited and provider-only transaction fields are not returned to the browser.

### Reconciliation

**POST** `/api/custom/payments/reconcile-user`

Run reconciliation process:

```typescript
const response = await fetch('/api/custom/payments/reconcile-user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CRON_SECRET}`,
  },
  body: JSON.stringify({
    userId: 'user_id_here',
  }),
})
```

**GET** `/api/custom/payments/reconcile-user?userId=xxx&days=7`

Run or read user reconciliation through the administrative proxy. Both methods require an
administrator session or `CRON_SECRET`; reconciliation is not a student self-service route.

### Automated Tasks

**GET** `/api/custom/payments/cron`

Automated endpoint for cron jobs (requires `CRON_SECRET` authorization).

## System Architecture

### Data Flow

1. **Payment Initiation**

   ```
   Client → /api/custom/payments/initiate → Fapshi API → Database
   ```

2. **Webhook Processing**

   ```
   Fapshi webhook signal → authenticated Fapshi status query → identity/amount match
   → unique settlement ledger → atomic subscription + transaction update
   ```

3. **Status Polling**

   ```
   Browser or authorized batch route → Fapshi status query → shared payment state machine
   ```

4. **Reconciliation**
   ```
   Payload Jobs → payment-reconciliation-workflow → payment-reconciliation task → Fapshi API → Database
   ```

### Error Handling

- **Retry Mechanism**: Automatic retries with exponential backoff
- **Idempotency**: Duplicate webhook protection
- **Fallback**: Multiple confirmation layers ensure reliability
- **Logging**: Comprehensive error logging and tracking

### Security Features

- **Webhook Validation**: Verifies Fapshi webhook authenticity
- **Authorization**: Cron endpoints require secret token
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Built-in protection against abuse

## Deployment Checklist

### Pre-deployment

- [ ] Configure environment variables
- [ ] Set up Fapshi webhook URL
- [ ] Test API credentials
- [ ] Verify database connectivity

### Post-deployment

- [ ] Test payment initiation endpoint
- [ ] Verify webhook reception
- [ ] ✅ **Automated jobs start automatically** (no setup needed)
- [ ] Monitor logs for job execution
- [ ] Run initial reconciliation test
- [ ] Optional: Set up external backup cron jobs

### Monitoring

- [ ] Set up alerts for failed payments
- [ ] Monitor webhook delivery rates
- [ ] Track reconciliation discrepancies
- [ ] Monitor API response times

## Troubleshooting

### Common Issues

1. **Webhooks Not Received**
   - Check webhook URL configuration in Fapshi dashboard
   - Verify endpoint is publicly accessible
   - Check server logs for errors

2. **Payment Status Not Updating**
   - Verify cron jobs are running
   - Check Fapshi API credentials
   - Review status check logs

3. **Reconciliation Discrepancies**
   - Run manual reconciliation
   - Check for network issues during payment processing
   - Verify transaction date ranges

### Debug Endpoints

Use these for debugging:

```bash
# Check specific transaction
GET /api/custom/payments/status-check?transactionId=xxx

# Get reconciliation report
GET /api/custom/payments/reconcile?days=1

# Manual status check
POST /api/custom/payments/status-check
```

## Performance Considerations

### Optimization Tips

1. **Batch Processing**: Status checks process multiple transactions
2. **Caching**: Implement Redis for frequently accessed data
3. **Database Indexing**: Index transaction fields for faster queries
4. **Rate Limiting**: Respect Fapshi API rate limits

### Scaling

- **Horizontal Scaling**: Stateless design supports multiple instances
- **Queue System**: Consider adding job queues for high volume
- **Database Optimization**: Use read replicas for reporting

## Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS Only**: All communication must use HTTPS
3. **Input Validation**: Validate all inputs thoroughly
4. **Access Control**: Implement proper authentication
5. **Audit Logging**: Log all payment-related activities

## Maintenance

### Regular Tasks

- **Weekly**: Review reconciliation reports
- **Monthly**: Analyze payment success rates
- **Quarterly**: Update API credentials if needed
- **Annually**: Review and update security measures

### Monitoring Metrics

- Payment success rate
- Webhook delivery rate
- Average confirmation time
- Reconciliation accuracy
- API response times

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review server logs
3. Test individual endpoints
4. Contact Fapshi support if API issues persist

## Version History

- **v1.0**: Initial implementation with three-layer confirmation
- **v1.1**: Enhanced error handling and retry mechanisms
- **v1.2**: Added comprehensive reconciliation system

---

This payment system is designed to be robust, scalable, and maintainable. The three-layer confirmation architecture ensures maximum reliability while providing comprehensive monitoring and debugging capabilities.
