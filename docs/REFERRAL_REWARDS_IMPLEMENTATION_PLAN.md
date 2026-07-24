# Referral Rewards Implementation Plan

**Decision date:** July 24, 2026

**Default Fapshi fee:** 3%

**Default referral reward:** 30% of the gross settled subscription payment

## Objectives

1. Preserve trustworthy first-touch referral attribution.
2. Record gross payment, provider fee, revenue, referral expense, and retained platform revenue.
3. Reward a referrer only while their own paid subscription is active.
4. Make payment retries, duplicate callbacks, and refunds financially safe.
5. Give students and administrators useful, privacy-conscious reporting.
6. Keep reward accrual separate from cash payout until payout identity and approval rules are
   defined.

## Phase 1 — Configuration and accounting (implemented)

- Add the payment-accounting group to the global Settings subscription tab.
- Default provider fee to 3%, referral reward to 30%, and program enablement to on.
- Allow only administrators to update settings.
- Prefer provider-reported revenue; apply the configured fee only as a fallback.
- Snapshot provider fee amount and basis points on successful transactions and immutable payment
  settlements.
- Expose gross payment, provider fees, revenue after fees, referral expense, and retained platform
  revenue in admin analytics.

## Phase 2 — Trustworthy attribution (implemented)

- Sign referral cookies with HMAC using a dedicated secret or `PAYLOAD_SECRET`.
- Store only a code, issue timestamp, and random token identifier in the signed token.
- Resolve the referrer server-side and reject invalid, expired, or self-referral attribution.
- Preserve first-touch attribution for the cookie lifetime.
- Create one immutable `referral-attributions` record in the registration transaction.
- Restrict admin link generation and remove referred-student email addresses from referrer-facing
  statistics.

## Phase 3 — Reward ledger (implemented)

- Create one immutable, uniquely keyed reward record per settled payment.
- Verify the referred user's referrer and the referrer's paid subscription at settlement time.
- Calculate the reward from the gross payment using the snapshotted configured percentage.
- Store ineligible decisions with an explicit reason instead of silently discarding them.
- Reverse the reward record when the associated transaction is refunded.
- Keep reward records readable by administrators and the owning referrer, but deny public
  mutations.

## Phase 4 — Product and reporting (implemented)

- Show program rate, eligibility, earnings, referrals, and reward history on the student dashboard.
- Notify a referrer of the calculated bonus they missed when their subscription is inactive and
  direct them to renew for future qualifying payments.
- Add Referral Rewards and Referral Attributions to admin quick links.
- Add payment-fee and referral metrics to the admin dashboard.
- Add provider-fee columns and a Referral Rewards sheet to Excel exports.
- Retain applied percentage and amount snapshots so later setting changes do not rewrite history.

## Phase 5 — Historical reconciliation (deployment task)

1. Backfill immutable attributions for legacy users that have `referredBy`.
2. Backfill fee fields for historical successful transactions from provider revenue where
   available, otherwise use the configured fallback and label the record as estimated.
3. Compare total transaction gross and revenue with Fapshi settlement exports.
4. Do not create retroactive rewards until the business confirms the effective start date.
5. Store the reconciliation report and reviewer identity with the deployment record.

## Phase 6 — Controlled payout (future implementation)

This phase requires business decisions and provider configuration that are intentionally not
assumed by the accrual implementation.

1. Add verified payout destinations and prevent the referrer from changing a destination during a
   pending payout.
2. Define minimum balance, payout cadence, KYC status, and tax/compliance handling.
3. Create payout batches from `available` rewards with a database reservation step.
4. Require administrator review and approval before calling the payout provider.
5. Store provider payout IDs and status events in an immutable payout ledger.
6. Mark rewards `paid` only after provider confirmation; release reservations after definitive
   failure.
7. Add payout reconciliation, exception handling, alerts, and an administrator export.

## Acceptance criteria

- Reprocessing one provider success creates one subscription settlement and at most one reward.
- A 10,000 XAF payment at the default rates records 300 XAF fee, 9,700 XAF revenue, 3,000 XAF
  reward, and 6,700 XAF retained platform revenue.
- An inactive referrer receives an `ineligible` record with a zero reward.
- A refund reverses an available reward and preserves the original amounts.
- Changing the global rate does not alter historical reward records.
- A normal student cannot read another referrer's ledger or mutate any financial record.
- Admin dashboard totals reconcile with the detailed Excel sheets for the selected period.
