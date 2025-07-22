# Custom API Endpoints

This directory contains all custom API endpoints for the SmartVision application. All custom endpoints are organized under `/api/custom/` to avoid conflicts with Payload CMS default API endpoints.

## Directory Structure

```
/api/custom/
├── example/           # Example custom endpoint
│   └── route.ts
├── payments/          # Payment system endpoints
│   ├── initiate/      # Initiate payments
│   │   └── route.ts
│   ├── webhook/       # Payment webhooks
│   │   └── fapshi/
│   │       └── route.ts
│   ├── status-check/  # Payment status checking
│   │   └── route.ts
│   ├── reconcile/     # Payment reconciliation
│   │   └── route.ts
│   └── cron/          # Automated payment tasks
│       └── route.ts
└── referral/          # Referral system endpoints
    ├── generate/      # Generate referral links
    │   └── route.ts
    ├── redirect/      # Handle referral redirects
    │   └── [code]/
    │       └── route.ts
    └── stats/         # Referral statistics
        └── route.ts
```

## Available Endpoints

### Example Endpoint

- **GET** `/api/custom/example` - Example custom route demonstrating Payload integration

### Payment System

- **POST** `/api/custom/payments/initiate` - Initiate a new payment with Fapshi
- **GET** `/api/custom/payments/initiate?transactionId=xxx` - Get payment status by transaction ID
- **POST** `/api/custom/payments/webhook/fapshi` - Fapshi webhook handler for payment notifications
- **POST** `/api/custom/payments/status-check` - Batch status check for pending transactions
- **GET** `/api/custom/payments/status-check?transactionId=xxx` - Manual status check for specific transaction
- **POST** `/api/custom/payments/reconcile` - Run payment reconciliation process
- **GET** `/api/custom/payments/reconcile?days=7` - Get reconciliation report
- **GET** `/api/custom/payments/cron` - Automated cron job endpoint (requires authorization)
- **POST** `/api/custom/payments/cron` - Manual trigger for payment tasks

### Referral System

- **GET** `/api/custom/referral/generate` - Generate referral link for authenticated user
- **POST** `/api/custom/referral/generate` - Generate referral link by email (admin)
- **GET** `/api/custom/referral/redirect/[code]` - Handle referral link redirects and set tracking cookies
- **GET** `/api/custom/referral/stats` - Get referral statistics for authenticated user

## Payment System Architecture

### Multi-Layer Confirmation System

1. **Primary Layer: Webhooks**
   - Real-time notifications from Fapshi
   - Immediate database updates
   - Idempotency protection

2. **Secondary Layer: Polling**
   - Automated status checks every 5 minutes
   - Exponential backoff for failures
   - Batch processing of pending transactions

3. **Tertiary Layer: Reconciliation**
   - Daily reconciliation with Fapshi records
   - Discrepancy detection and resolution
   - Manual reconciliation capabilities

### Environment Variables Required

```env
# Fapshi Configuration
FAPSHI_API_USER=your_fapshi_api_user
FAPSHI_API_KEY=your_fapshi_api_key
FAPSHI_WEBHOOK_URL=/api/custom/payments/webhook/fapshi

# Cron Job Security
CRON_SECRET=your_secure_cron_secret

# Application URLs
NEXT_PUBLIC_SERVER_URL=https://yourdomain.com
```

## Guidelines for Adding New Custom Endpoints

1. **Always place custom endpoints under `/api/custom/`** to avoid conflicts with Payload CMS
2. **Use descriptive directory names** that clearly indicate the endpoint's purpose
3. **Follow RESTful conventions** for HTTP methods and URL structure
4. **Include proper error handling** and status codes
5. **Add authentication checks** where appropriate
6. **Document new endpoints** in this README file

## Example Custom Endpoint Structure

```typescript
// src/app/api/custom/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    // Your custom logic here

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in custom endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Payment Integration Usage

### Initiating a Payment

```typescript
const response = await fetch('/api/custom/payments/initiate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    userId: 'user_id',
    amount: 1000,
    phone: '677123456',
    medium: 'mobile money',
    message: 'Subscription payment',
  }),
})
```

### Setting Up Automated Tasks

Configure your deployment platform to call the cron endpoint:

```bash
# Every 5 minutes for status checks
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://yourdomain.com/api/custom/payments/cron

# Daily reconciliation can be done less frequently
```

## Notes

- Payload CMS uses `/api/` for its default endpoints (collections, auth, etc.)
- Custom endpoints under `/api/custom/` ensure no naming conflicts
- All endpoints have access to the Payload instance for database operations
- Follow the existing patterns for consistency and maintainability
- Payment system includes comprehensive error handling and retry mechanisms
- Webhook endpoint always returns 200 to prevent unnecessary retries from Fapshi
