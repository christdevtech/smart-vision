# Fapshi Payment Gateway API Documentation

## Table of Contents

1. [API Overview](#api-overview)
2. [Getting Started](#getting-started)
3. [Environment Configuration](#environment-configuration)
4. [Authentication](#authentication)
5. [Payment Endpoints](#payment-endpoints)
6. [Transaction Management](#transaction-management)
7. [Webhook Integration](#webhook-integration)
8. [Payout Services](#payout-services)
9. [Error Handling](#error-handling)

---

## API Overview

Fapshi is a payment gateway that enables businesses to accept payments through mobile money services in Cameroon. The API supports both collection and payout operations with real-time webhook notifications.

### Key Features

- Direct payment initiation
- Real-time payment status updates via webhooks
- Transaction search and filtering
- Payout services to mobile money accounts
- Sandbox environment for testing

---

## Getting Started

### Creating a Service

To use Fapshi's API, you need to create a service on the Fapshi dashboard. Each service has:

- Unique API credentials (apiuser and apikey)
- Configurable webhook URL
- Service-specific settings

### Base URLs

- **Sandbox**: `https://sandbox.fapshi.com`
- **Production**: `https://api.fapshi.com`

---

## Environment Configuration

### Live vs Sandbox Environment

| Environment | Purpose                 | Base URL                     |
| ----------- | ----------------------- | ---------------------------- |
| Sandbox     | Testing and development | `https://sandbox.fapshi.com` |
| Live        | Production transactions | `https://api.fapshi.com`     |

**Important Notes:**

- Sandbox environment uses test credentials and simulated transactions
- Balance in sandbox is randomly generated on each request
- Always test thoroughly in sandbox before going live

---

## Authentication

All API requests require authentication using headers:

```javascript
headers: {
  'apiuser': '<your-api-user>',
  'apikey': '<your-api-key>',
  'Content-Type': 'application/json'
}
```

---

## Payment Endpoints

### 1. Initiate Direct Payment

**Endpoint:** `POST /direct-pay`

Send a payment request directly to a user's mobile device. You are responsible for building your own checkout and verifying payment status.

> **Note:** Direct payment is disabled by default on live environment; contact support to enable. Handle this endpoint with care; misuse can result in account suspension.

#### Request Parameters

| Parameter    | Type    | Required | Description                                                                 |
| ------------ | ------- | -------- | --------------------------------------------------------------------------- |
| `amount`     | integer | Yes      | Amount to be paid (minimum 100 XAF)                                         |
| `phone`      | string  | Yes      | Phone number to request payment from (e.g., 67XXXXXXX)                      |
| `medium`     | string  | No       | "mobile money" or "orange money". Omit to auto-detect                       |
| `name`       | string  | No       | Payer's name                                                                |
| `email`      | string  | No       | Payer's email to receive receipt                                            |
| `userId`     | string  | No       | Your system's user ID (1–100 chars; a–z, A–Z, 0–9, -, \_)                   |
| `externalId` | string  | No       | Transaction/order ID for reconciliation (1–100 chars; a–z, A–Z, 0–9, -, \_) |
| `message`    | string  | No       | Reason for payment                                                          |

#### Authorization Headers

| Header    | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `apiuser` | string | Yes      | API user    |
| `apikey`  | string | Yes      | API key     |

#### Sample Request

```javascript
const options = {
  method: 'POST',
  headers: {
    apiuser: '<api-key>',
    apikey: '<api-key>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 101,
    phone: '67XXXXXXX',
    medium: 'mobile money',
    name: 'John Smith',
    email: 'jsmith@example.com',
    userId: 'user123',
    externalId: 'order456',
    message: 'Subscription payment',
  }),
}

fetch('https://sandbox.fapshi.com/direct-pay', options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err))
```

#### Response (200 - Success)

```json
{
  "message": "Payment initiated successfully",
  "transId": "fp_1234567890",
  "dateInitiated": "2023-12-25"
}
```

#### Response (4XX - Error)

```json
{
  "message": "Error message describing the issue"
}
```

---

### 2. Get Payment Transaction Status

**Endpoint:** `GET /payment-status/:transId`

Retrieve the status of a payment transaction using its transaction ID.

#### Path Parameters

| Parameter | Type   | Required | Description                    |
| --------- | ------ | -------- | ------------------------------ |
| `transId` | string | Yes      | Transaction ID of the payment  |

#### Authorization Headers

| Header    | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `apiuser` | string | Yes      | API user    |
| `apikey`  | string | Yes      | API key     |

#### Transaction Status Values

| Status       | Description                                                                                                                                                                                                    |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CREATED`    | Payment not yet attempted                                                                                                                                                                                      |
| `PENDING`    | User is in process of payment                                                                                                                                                                                  |
| `SUCCESSFUL` | Payment completed successfully                                                                                                                                                                                 |
| `FAILED`     | Payment failed                                                                                                                                                                                                 |
| `EXPIRED`    | This means 24 hours have passed since the payment link was generated and no successful payment attempt was made in that time interval OR the link got manually expired to prevent payment                   |

> **Note:** No payments can be made after the status is SUCCESSFUL or EXPIRED.

#### Sample Request

```javascript
const options = {
  method: 'GET',
  headers: {
    apiuser: '<api-key>',
    apikey: '<api-key>'
  }
}

fetch('https://sandbox.fapshi.com/payment-status/{transId}', options)
  .then(response => response.json())
  .then(response => console.log(response))
  .catch(err => console.error(err))
```

#### Response (200 - Success)

```json
[
  {
    "transId": "fp_1234567890",
    "status": "CREATED",
    "medium": "mobile money",
    "serviceName": "Your Service Name",
    "amount": 123,
    "revenue": 123,
    "payerName": "John Doe",
    "email": "jsmith@example.com",
    "redirectUrl": "https://yoursite.com/payment-success",
    "externalId": "order456",
    "userId": "user123",
    "webhook": "https://yoursite.com/webhook",
    "financialTransId": "mtn_789123456",
    "dateInitiated": "2023-12-25",
    "dateConfirmed": "2023-12-25"
  }
]
```

#### Response Fields

| Field               | Type   | Description                                           |
| ------------------- | ------ | ----------------------------------------------------- |
| `transId`           | string | Transaction ID of the payment                         |
| `status`            | string | Transaction status (CREATED, PENDING, SUCCESSFUL, FAILED, EXPIRED) |
| `medium`            | string | Payment method (mobile money, orange money)          |
| `serviceName`       | string | Name of the service in use                            |
| `amount`            | integer| Transaction amount                                    |
| `revenue`           | integer| Amount received when Fapshi fees have been deducted  |
| `payerName`         | string | Client name                                           |
| `email`             | string | Client email                                          |
| `redirectUrl`       | string | URL to redirect after payment                         |
| `externalId`        | string | The transaction ID on your application               |
| `userId`            | string | ID of the client on your application                 |
| `webhook`           | string | The webhook you defined for your service             |
| `financialTransId`  | string | Transaction ID with the payment operator             |
| `dateInitiated`     | string | Date when the payment was initiated                  |
| `dateConfirmed`     | string | Date when the payment was confirmed                  |

#### Response (4XX - Error)

```json
{
  "message": "Error message describing the issue"
}
```

---

### 3. Expire Payment

**Endpoint:** `POST /expire-pay`

Manually expires a payment transaction before its natural expiration.

#### Request Parameters

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `transId` | string | Yes      | Transaction ID to expire |

#### Sample Request

```javascript
const options = {
  method: 'POST',
  headers: {
    apiuser: '<api-key>',
    apikey: '<api-key>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    transId: 'fp_1234567890',
  }),
}

fetch('https://sandbox.fapshi.com/expire-pay', options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err))
```

#### Response (200 - Success)

```json
{
  "transId": "fp_1234567890",
  "status": "EXPIRED",
  "medium": "mobile money",
  "serviceName": "Your Service Name",
  "amount": 1000,
  "revenue": 970,
  "payerName": "John Doe",
  "email": "customer@example.com",
  "redirectUrl": "https://yoursite.com/payment-success",
  "externalId": "order456",
  "userId": "user123",
  "webhook": "https://yoursite.com/webhook",
  "financialTransId": "mtn_789123456",
  "dateInitiated": "2023-12-25T10:30:00Z",
  "dateConfirmed": "2023-12-25T10:35:00Z"
}
```

---

## Transaction Management

### 1. Get Transactions by User ID

**Endpoint:** `GET /transaction/{userId}`

Retrieves all transactions associated with a specific user ID.

#### Sample Request

```javascript
const options = {
  method: 'GET',
  headers: {
    apiuser: '<api-key>',
    apikey: '<api-key>',
  },
}

fetch('https://sandbox.fapshi.com/transaction/user123', options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err))
```

#### Response (200 - Success)

```json
[
  {
    "transId": "fp_1234567890",
    "status": "SUCCESSFUL",
    "medium": "mobile money",
    "serviceName": "Your Service Name",
    "amount": 1000,
    "revenue": 970,
    "payerName": "John Doe",
    "email": "customer@example.com",
    "redirectUrl": "https://yoursite.com/payment-success",
    "externalId": "order456",
    "userId": "user123",
    "webhook": "https://yoursite.com/webhook",
    "financialTransId": "mtn_789123456",
    "dateInitiated": "2023-12-25T10:30:00Z",
    "dateConfirmed": "2023-12-25T10:35:00Z"
  }
]
```

---

### 2. Search Transactions

**Endpoint:** `GET /search`

Search for transactions using various filter criteria.

#### Query Parameters

| Parameter | Type    | Description                   | Allowed Values                               |
| --------- | ------- | ----------------------------- | -------------------------------------------- |
| `status`  | string  | Filter by transaction status  | `created`, `successful`, `failed`, `expired` |
| `medium`  | string  | Filter by payment medium      | `mobile money`, `orange money`               |
| `start`   | string  | Start date (YYYY-MM-DD)       | Date format                                  |
| `end`     | string  | End date (YYYY-MM-DD)         | Date format                                  |
| `amt`     | integer | Exact amount to filter by     | Integer                                      |
| `limit`   | integer | Maximum results (default: 10) | 1-100                                        |
| `sort`    | string  | Sort order (default: desc)    | `asc`, `desc`                                |

#### Sample Request

```javascript
const options = {
  method: 'GET',
  headers: {
    apiuser: '<api-key>',
    apikey: '<api-key>',
  },
}

fetch('https://sandbox.fapshi.com/search?status=successful&limit=20&sort=desc', options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err))
```

---

### 3. Get Service Balance

**Endpoint:** `GET /balance`

Returns the current balance of the service account.

#### Sample Request

```javascript
const options = {
  method: 'GET',
  headers: {
    apiuser: '<api-key>',
    apikey: '<api-key>',
  },
}

fetch('https://sandbox.fapshi.com/balance', options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err))
```

#### Response (200 - Success)

```json
{
  "service": "Your Service Name",
  "balance": 50000,
  "currency": "XAF"
}
```

---

## Webhook Integration

### Overview

Webhooks allow your application to receive real-time notifications when payment status changes. Configure your webhook URL in the Fapshi dashboard for each service.

### Webhook Events

Fapshi sends webhook notifications for the following status changes:

- **SUCCESSFUL** - Payment completed successfully
- **FAILED** - Payment attempt failed
- **EXPIRED** - Payment link expired after 24 hours

### Webhook Request Format

When a payment status changes, Fapshi sends a POST request to your webhook URL with the transaction data:

```json
{
  "transId": "fp_1234567890",
  "status": "SUCCESSFUL",
  "medium": "mobile money",
  "serviceName": "Your Service Name",
  "amount": 1000,
  "revenue": 970,
  "payerName": "John Doe",
  "email": "customer@example.com",
  "redirectUrl": "https://yoursite.com/payment-success",
  "externalId": "order456",
  "userId": "user123",
  "webhook": "https://yoursite.com/webhook",
  "financialTransId": "mtn_789123456",
  "dateInitiated": "2023-12-25T10:30:00Z",
  "dateConfirmed": "2023-12-25T10:35:00Z"
}
```

### Webhook Implementation Guidelines

1. **Respond Quickly**: Your server should respond within a few seconds to avoid timeouts
2. **Return 200 Status**: Always return a 200 HTTP status code to acknowledge receipt
3. **Handle Duplicates**: Implement idempotency to handle potential duplicate webhooks
4. **Verify Authenticity**: Validate webhook requests to ensure they're from Fapshi
5. **Single Attempt**: Fapshi sends only one webhook request per event

### Sample Webhook Handler (Node.js/Express)

```javascript
app.post('/webhook/fapshi', (req, res) => {
  try {
    const transaction = req.body

    // Process the transaction based on status
    switch (transaction.status) {
      case 'SUCCESSFUL':
        // Handle successful payment
        console.log(`Payment successful: ${transaction.transId}`)
        break
      case 'FAILED':
        // Handle failed payment
        console.log(`Payment failed: ${transaction.transId}`)
        break
      case 'EXPIRED':
        // Handle expired payment
        console.log(`Payment expired: ${transaction.transId}`)
        break
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    res.status(200).json({ received: true }) // Still acknowledge to prevent retries
  }
})
```

---

## Payout Services

### Make a Payout

**Endpoint:** `POST /payout`

Send money to a user's mobile money account.

**Important**: After enabling payouts for a service, that service can no longer collect payments. Use separate services for collections and payouts.

#### Request Parameters

| Parameter    | Type    | Required | Description                                                 |
| ------------ | ------- | -------- | ----------------------------------------------------------- |
| `amount`     | integer | Yes      | Amount to send (minimum 100 XAF)                            |
| `phone`      | string  | Yes      | Recipient phone number (e.g., 67XXXXXXX)                    |
| `medium`     | string  | No       | "mobile money" or "orange money" (auto-detected if omitted) |
| `name`       | string  | No       | Recipient's name                                            |
| `email`      | string  | No       | Recipient's email for payout confirmation                   |
| `userId`     | string  | No       | Your system's user ID (1-100 chars)                         |
| `externalId` | string  | No       | Transaction/order ID for reconciliation (1-100 chars)       |
| `message`    | string  | No       | Description or reason for payout                            |

#### Sample Request

```javascript
const options = {
  method: 'POST',
  headers: {
    apiuser: '<api-key>',
    apikey: '<api-key>',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: 5000,
    phone: '677123456',
    medium: 'mobile money',
    name: 'John Doe',
    email: 'john@example.com',
    userId: 'user123',
    externalId: 'payout789',
    message: 'Commission payment',
  }),
}

fetch('https://sandbox.fapshi.com/payout', options)
  .then((response) => response.json())
  .then((response) => console.log(response))
  .catch((err) => console.error(err))
```

#### Response (200 - Success)

```json
{
  "message": "Payout initiated successfully",
  "transId": "po_1234567890",
  "dateInitiated": "2023-12-25T10:30:00Z"
}
```

---

## Error Handling

### Common Error Responses

#### 400 - Bad Request

```json
{
  "message": "Invalid request parameters"
}
```

#### 401 - Unauthorized

```json
{
  "message": "Invalid API credentials"
}
```

#### 404 - Not Found

```json
{
  "message": "Transaction not found"
}
```

#### 500 - Internal Server Error

```json
{
  "message": "Internal server error"
}
```

### Best Practices for Error Handling

1. **Always check response status codes**
2. **Implement retry logic for network failures**
3. **Log errors for debugging**
4. **Provide meaningful error messages to users**
5. **Handle rate limiting gracefully**

### Rate Limiting

- API requests are rate-limited to prevent abuse
- Implement exponential backoff for retry logic
- Monitor your API usage to stay within limits

---

## Integration Checklist

### Before Going Live

- [ ] Test all payment flows in sandbox environment
- [ ] Implement webhook handling
- [ ] Set up proper error handling and logging
- [ ] Configure production API credentials
- [ ] Test webhook endpoint accessibility
- [ ] Implement transaction reconciliation
- [ ] Set up monitoring and alerting
- [ ] Review security measures

### Security Considerations

1. **Secure API Credentials**: Store API keys securely, never in client-side code
2. **HTTPS Only**: Always use HTTPS for API requests and webhook endpoints
3. **Webhook Validation**: Verify webhook authenticity
4. **Input Validation**: Validate all input parameters
5. **Error Logging**: Log errors without exposing sensitive data

---

## Support and Resources

- **Documentation**: [Fapshi API Docs](https://docs.fapshi.com)
- **Dashboard**: [Fapshi Dashboard](https://dashboard.fapshi.com)
- **Support**: Contact Fapshi support for technical assistance

---

_Last Updated: December 2023_
