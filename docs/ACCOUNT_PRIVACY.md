# Account privacy and data lifecycle

SmartVision provides a verified personal-data export and a staged account-deletion process. This document describes the implemented technical behavior; legal retention periods must still be reviewed for every production jurisdiction.

## Personal-data export

Students can open **Dashboard → Account Management → Privacy**, enter their current password, and download a JSON export.

The export includes:

- profile and onboarding information;
- subscriptions, payments, and payment settlements;
- study plans, progress, test sessions, and results;
- content-access and notification records;
- referral attributions and rewards; and
- account-linked activity history.

Passwords, password-reset and email-verification tokens, active sessions, signed content-access tokens, and encryption keys are recursively excluded. The response uses `Cache-Control: no-store, private` and is delivered as an attachment.

## Deletion lifecycle

1. The student confirms the request with two explicit acknowledgements and their current password.
2. SmartVision sets `isActive` to `false`, revokes all sessions, records the request, and schedules anonymization for 30 days later.
3. During the 30-day grace period an administrator can review the request and restore the account by clearing the deletion lifecycle fields and reactivating it. The student must contact support because deactivated accounts cannot sign in.
4. Cloud Scheduler calls `POST /api/internal/users/process-deletions` with `Authorization: Bearer <CRON_SECRET>` at least daily.
5. The processor removes volatile profile/learning records and owner-only media, replaces direct account identifiers with a deterministic anonymous identity, and leaves the account disabled.

The processor handles at most 50 due accounts per call, continues after an individual failure, and returns anonymized/error counts for alerting.

## Retained records

Transactions, payment settlements, subscriptions, referral ledgers, and activity/audit records remain linked to the anonymized account. They are retained to preserve financial reconciliation, reward integrity, fraud investigation, and audit history. These records must not be repopulated with deleted profile details.

Before launch, the owner should approve:

- the legally required retention period for financial and security records;
- the support procedure and identity checks for restoring a pending account;
- the operational owner for failed anonymization alerts; and
- a periodic review confirming that deleted-user exports contain no authentication or delivery secrets.

## Scheduler example

Configure a daily Cloud Scheduler request to:

`POST https://smartvisioncm.com/api/internal/users/process-deletions`

with the same `CRON_SECRET` bearer authorization used by other protected scheduled routes. Never place the secret in the URL or application logs.
