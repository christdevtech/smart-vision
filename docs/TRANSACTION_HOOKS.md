# Transaction Hooks Documentation

## Subscription Update Hook

A hook has been implemented in the Transactions collection to ensure that subscriptions are properly updated even if the webhook callback is missed after a transaction is completed successfully.

### Purpose

This hook serves as a safety mechanism to handle cases where:

1. The Fapshi webhook fails to reach our server
2. The webhook is received but encounters an error during processing
3. Manual verification of a transaction occurs through the status check API

### Implementation Details

The hook is implemented as an `afterChange` hook in the Transactions collection and triggers when:

1. A transaction's status is updated to `successful`
2. The transaction has a valid user reference

### Functionality

When triggered, the hook performs the following actions:

#### For Transactions Already Linked to a Subscription

1. Retrieves the subscription document
2. Checks if the transaction ID is already in the subscription's transactions array
3. If not, adds the transaction ID to the array and updates the subscription status to `paid`
4. This prevents duplicate subscription extensions while ensuring the transaction is properly recorded

#### For Transactions Without a Subscription Link

1. Determines the subscription plan (monthly/annual) based on the transaction amount
2. Uses the `findOrCreateUserSubscription` utility to either:
   - Create a new subscription if the user doesn't have one
   - Update an existing subscription with new dates
3. Updates the transaction with a reference to the subscription

### Duplicate Prevention

The hook includes several safeguards to prevent duplicate subscription extensions:

1. Only processes transactions that have just been marked as successful
2. Checks if the transaction is already linked to the subscription's transactions array
3. Uses the existing subscription utilities that handle proper date calculations

### Error Handling

All operations are wrapped in a try-catch block to prevent errors from affecting the transaction update process. Errors are logged to the console for debugging purposes.

## Usage

This hook works automatically and requires no manual intervention. It ensures that:

1. Every successful payment results in a valid subscription
2. Subscription dates are properly calculated
3. Transactions are correctly linked to subscriptions
4. No duplicate subscription extensions occur

## Example Scenarios

### Scenario 1: Webhook Missed, Manual Verification

1. User makes a payment
2. Webhook fails to reach the server
3. Admin manually verifies the transaction through the status check API
4. Transaction status changes to `successful`
5. Hook triggers and updates the subscription

### Scenario 2: Webhook Received, But Transaction Already Processed

1. User makes a payment
2. Transaction is manually verified and subscription updated
3. Webhook arrives later
4. Hook detects that the transaction is already linked to the subscription
5. No duplicate subscription extension occurs

## Maintenance

This hook should be monitored periodically to ensure it continues to function as expected. Consider adding additional logging or monitoring if issues are detected.