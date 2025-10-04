# Subscription Management System

## Overview

The subscription management system ensures that users receive valid subscriptions with proper start and end dates when payments are successfully processed. The system automatically handles subscription creation, updates, and date calculations based on the payment amount and plan type.

## Key Features

### 1. Automatic Subscription Creation
- When a payment is initiated for a subscription amount, the system automatically creates a subscription if one doesn't exist
- Subscription plan (monthly/annual) is determined based on the payment amount
- Proper start and end dates are calculated based on the plan type

### 2. Subscription Date Management
- **Start Date**: Set to current date for new subscriptions, or current end date for renewals
- **End Date**: Calculated based on plan type:
  - Monthly: +1 month from start date
  - Annual: +1 year from start date

### 3. Payment Amount Detection
- System compares payment amounts with configured subscription costs
- Allows 5% tolerance for amount variations
- Automatically determines if payment is for monthly or annual plan

## System Components

### 1. Subscription Utility (`src/utilities/subscription.ts`)

#### Key Functions:

- `determineSubscriptionPlan(amount, subscriptionCosts)`: Determines plan type based on payment amount
- `calculateSubscriptionEndDate(startDate, plan)`: Calculates end date based on plan
- `createSubscription(payload, params)`: Creates new subscription with proper dates
- `updateSubscriptionAfterPayment(payload, params)`: Updates existing subscription
- `findOrCreateUserSubscription(payload, userId, plan, amount, transactionId)`: Main function for subscription management
- `isSubscriptionActive(subscription)`: Checks if subscription is currently active
- `getSubscriptionCosts(payload)`: Retrieves subscription costs from settings

### 2. Payment Integration Points

#### Payment Initiation (`src/app/api/custom/payments/initiate/route.ts`)
- Automatically creates subscription when payment is initiated for subscription amounts
- Links transaction to subscription from the beginning

#### Webhook Handler (`src/app/api/custom/payments/webhook/fapshi/route.ts`)
- Processes successful payments and updates/creates subscriptions
- Sets proper subscription dates and status

#### Status Check (`src/app/api/custom/payments/status-check/route.ts`)
- Handles manual verification and updates subscriptions accordingly
- Ensures consistency between payment status and subscription validity

#### Transaction Hooks (`src/collections/Transactions/index.ts`)
- Provides a safety mechanism for missed webhook callbacks
- Automatically updates subscriptions when transactions are marked as successful
- Prevents duplicate subscription extensions
- See detailed documentation in `docs/TRANSACTION_HOOKS.md`

## Subscription Lifecycle

### 1. New User Payment Flow
```
1. User initiates payment for subscription
2. System determines plan type based on amount
3. New subscription created with:
   - startDate: current date
   - endDate: calculated based on plan
   - paymentStatus: 'pending'
4. Transaction linked to subscription
5. Payment processed with Fapshi
6. On success: subscription status updated to 'paid'
```

### 2. Existing User Renewal Flow
```
1. User initiates renewal payment
2. System finds existing subscription
3. Subscription updated with:
   - startDate: current endDate (if still active) or current date
   - endDate: calculated from new startDate
   - paymentStatus: 'paid'
4. Transaction added to subscription's transaction list
```

### 3. Subscription Extension Logic
- If current subscription is still active (endDate > now): extend from current endDate
- If current subscription has expired: start from current date
- This ensures no subscription time is lost during renewals

## Configuration

### Subscription Costs
Configured in `src/Settings/config.ts`:
```typescript
subscriptionCosts: {
  monthly: 3000,  // XAF
  yearly: 30000   // XAF
}
```

### Plan Detection Tolerance
- 5% tolerance for amount variations
- Accounts for potential fees or rounding differences

## Database Schema

### Subscriptions Collection
```typescript
{
  user: string,           // User ID (unique)
  plan: 'free' | 'monthly' | 'annual',
  startDate: string,      // ISO date string
  endDate: string,        // ISO date string
  paymentStatus: 'pending' | 'paid' | 'failed' | 'expired',
  transactions: string[]  // Array of transaction IDs
}
```

### Transactions Collection
```typescript
{
  user: string,           // User ID
  subscription: string,   // Subscription ID (optional)
  amount: number,         // Payment amount
  status: string,         // Transaction status
  // ... other transaction fields
}
```

## Error Handling

### Plan Detection Failures
- If amount doesn't match any plan, system logs warning
- Falls back to updating existing subscription status only
- Prevents system failures due to unexpected amounts

### Subscription Creation Errors
- Errors are logged but don't prevent payment processing
- System continues with transaction updates
- Manual intervention may be required for edge cases

## Monitoring and Logging

### Success Logs
- Subscription creation/update confirmations
- Plan type detection results
- User and subscription ID associations

### Warning Logs
- Unrecognized payment amounts
- Plan detection failures
- Missing subscription references

### Error Logs
- Subscription creation/update failures
- Database operation errors
- Utility function exceptions

## Testing Scenarios

### 1. New User Subscription
- Amount: 3000 XAF → Monthly plan
- Amount: 30000 XAF → Annual plan
- Verify proper start/end dates

### 2. Subscription Renewal
- Active subscription + payment → Extension from current endDate
- Expired subscription + payment → New period from current date

### 3. Edge Cases
- Multiple rapid payments
- Partial amount payments
- System downtime during payment processing

## Maintenance

### Regular Checks
- Monitor subscription expiry dates
- Verify payment-subscription linkages
- Check for orphaned transactions

### Configuration Updates
- Update subscription costs in settings
- Adjust tolerance levels if needed
- Monitor plan detection accuracy

## Future Enhancements

### Potential Improvements
- Prorated billing for mid-cycle upgrades
- Multiple subscription tiers
- Automatic renewal reminders
- Grace period handling
- Subscription pause/resume functionality