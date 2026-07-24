# SmartVision Referral and Reward System

## Business rules

- Every student receives a unique referral code.
- A referral link creates a signed, HTTP-only, 30-day first-touch attribution cookie.
- Registration resolves the referrer from the signed code and writes one immutable attribution.
- A reward is evaluated whenever a referred student's subscription payment settles.
- The referrer earns the configured percentage of the gross subscription payment only while the
  referrer's own paid monthly or annual subscription is active.
- The default reward rate is 30%. Administrators can change it in
  **Settings → Subscriptions → Payment accounting and referrals**.
- The default Fapshi fee is 3%. Provider-reported revenue is authoritative when present; otherwise
  the configured fee is used to derive revenue.
- Self-referrals, inactive referrers, duplicate settlement attempts, and disabled-program
  settlements do not create an available reward.
- When a referred payment would have earned a reward but the referrer's subscription is inactive,
  SmartVision records the ineligible reward and sends a high-priority notification showing the
  missed amount, configured percentage, and renewal link.
- Refunds reverse the corresponding reward rather than deleting its financial history.

## Accounting model

All monetary values are integer XAF amounts.

```text
gross payment       = amount paid by the referred student
Fapshi fee          = gross payment - provider revenue
revenue             = gross payment - Fapshi fee
referral reward     = gross payment × configured referral percentage
platform revenue    = revenue - referral reward
```

For the default settings, a 10,000 XAF payment records:

```text
gross payment       10,000 XAF
Fapshi fee             300 XAF
revenue              9,700 XAF
referral reward      3,000 XAF
platform revenue     6,700 XAF
```

The applicable percentages and calculated amounts are snapshotted on each settlement and reward.
Changing global settings affects future settlements only.

## Data model

### Users

- `referralCode`: unique, server-generated code.
- `referredBy`: legacy convenience relationship to the referrer.
- `totalReferrals`: legacy cached field; new reporting uses immutable attributions.

### Referral attributions

`referral-attributions` stores one immutable record per referred student. It contains the
referrer, referred user, code, signed token identifier, attribution source, status, and timestamp.
Only administrators and the owning referrer may read these records. Application code creates
them inside the registration request transaction.

### Referral rewards

`referral-rewards` is the financial reward ledger. Each payment settlement and transaction may
appear only once. A record snapshots:

- referrer and referred student;
- payment settlement, transaction, attribution, and referrer subscription;
- gross amount, provider fee, provider revenue, and fee basis points;
- reward rate, reward amount, and retained platform revenue;
- `available`, `ineligible`, `paid`, or `reversed` status;
- ineligibility or reversal reason and timestamps.

Collection API mutations are denied. Settlement and refund services write the ledger through
Payload's trusted Local API.

## Payment records

Successful `transactions` and immutable `payment-settlements` record:

- gross `amount`;
- `providerFeeAmount`;
- `providerFeeRateBasisPoints`;
- post-provider-fee `revenue`.

The admin dashboard and Excel export report gross payments, Fapshi fees, revenue after fees,
referral rewards, and platform revenue after rewards. The workbook includes transaction and
referral reward detail sheets.

## API and user experience

- `GET /api/custom/referral/redirect/[code]` validates the code and sets a signed first-touch
  cookie.
- `GET /api/custom/referral/generate` returns the authenticated student's referral link.
- `POST /api/custom/referral/generate` is restricted to administrators.
- `GET /api/custom/referral/stats` returns the authenticated student's eligibility, current
  program rates, privacy-limited referral list, reward history, and aggregate earnings.

The student dashboard shows available and lifetime earnings, total and qualified referrals,
subscription eligibility, the shareable link, and recent rewards. It never returns a referred
student's email address.

## Configuration

- `PAYLOAD_SECRET` signs referral cookies by default.
- `REFERRAL_SIGNING_SECRET` may be provided as a dedicated signing key.
- `NEXT_PUBLIC_SERVER_URL` is used to generate canonical referral links.
- The global Settings subscription tab controls program enablement, the fallback provider fee,
  and the referral reward percentage.

## Operational notes

- Reward creation is idempotent at the database and service layers.
- Historical users with `referredBy` continue to qualify for future rewards even if an attribution
  record has not yet been backfilled.
- Reward balances are accounting records, not cash disbursements. A reviewed payout workflow is a
  separate phase because it requires a verified destination, payout approvals, and provider payout
  credentials.
- Administrators should reconcile gross amount and provider revenue against the Fapshi settlement
  report before marking reward records paid.

See [REFERRAL_REWARDS_IMPLEMENTATION_PLAN.md](./REFERRAL_REWARDS_IMPLEMENTATION_PLAN.md) for the
implementation phases and remaining payout work.
