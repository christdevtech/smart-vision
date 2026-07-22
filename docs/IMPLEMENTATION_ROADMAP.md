# SmartVision Gap Remediation and Implementation Roadmap

**Audit date:** July 21, 2026
**Scope:** Current `smart-vision` repository, checked against `README.md`, `docs/SRS.md`, and the implemented Payload/Next.js application.
**Purpose:** Convert the current feature-rich prototype into a secure, reliable, testable production service and define the work still required by the product specification.

## Executive assessment

SmartVision already has a broad web implementation: authentication screens, onboarding, learning and content pages, a study planner, MCQ practice, subscriptions and Fapshi integration, referrals, notifications, progress views, account management, Payload administration, and Cloud Run packaging.

It is **not production-ready yet**. The most urgent gaps are trust-boundary failures rather than missing UI:

1. Production credentials are committed in deployment configuration and must be rotated.
2. Public registration and profile update paths can be used for role escalation.
3. Ownership rules for user data are inconsistent or incorrect, allowing cross-user writes in several collections.
4. Payment confirmation can activate or extend subscriptions more than once and sensitive payment endpoints are not consistently authenticated.
5. Premium files are stored as public media, so UI subscription checks do not protect the underlying content.
6. MCQ answers and scoring are controlled by the browser, so results and achievements are not trustworthy.

These issues are release blockers. New visual features should wait until Phase 0 through Phase 2 are complete.

## Audit method and validation status

The audit covered:

- Payload configuration, collections, access functions, hooks, and Local API calls.
- Authentication, account, payment, referral, study-plan, notification, and protected-media routes.
- Dashboard pages and representative client components.
- Docker/Cloud Build configuration, environment documentation, storage, and scheduled work.
- Automated tests, linting, TypeScript compilation, accessibility hooks, offline support, and operational controls.

Validation performed:

- `tsc --noEmit --incremental false`: **passes**.
- Lint: **blocked** because the installed configuration cannot resolve `eslint-plugin-react-hooks`; the package script also relies on the legacy `next lint` workflow.
- Integration/E2E tests were inspected but not executed against the ambient database because the integration suite creates and deletes users through the configured application database rather than an isolated test database.
- No CI workflow exists under `.github/workflows`.

## Remediation status

- **G-01 — accepted scope:** `cloudbuild.yaml` is present only as an ignored local deployment file and is not tracked in the current repository. Per the repository owner's decision, no credential rotation or history rewrite is included.
- **G-02 — implemented:** public registrations are forced to the `user` role with server-owned defaults; privileged user fields reject public create/update input; ordinary authenticated users cannot create additional accounts; and the profile endpoint accepts only validated profile fields rather than forwarding arbitrary objects to Payload.
- **G-03 — implemented:** user-owned collections now enforce relationship-aware row policies; authenticated creates bind ownership server-side; owner fields are immutable to ordinary users; content-access session metadata is hidden; user-facing Local API calls enforce access control; and nested user-data hooks retain request transaction context.
- **G-04 — implemented:** payment initiation now requires an authenticated session and accepts only a plan, phone number, and supported payment medium; user identity, contact identity, subscription ownership, messages, and prices are derived server-side. Transaction reads enforce Payload owner access, initiation and provider polling are rate-limited, provider responses are sanitized, and batch status/reconciliation routes require an administrator session or a fail-closed cron bearer secret.
- **G-05 — implemented:** Fapshi callbacks are treated only as status-change signals and are re-queried with server credentials before financial state changes. Provider ID, external ID, user, and amount must match the local transaction; successful payments create an immutable ledger entry with unique transaction/provider/external identifiers, and its transaction-scoped hook applies the subscription exactly once. Polling and webhooks use the same monotonic state machine, legacy successes cannot be re-applied, and transaction identifiers are uniquely indexed.

- **G-06 — implemented:** media is classified as public, owner-only, or protected; ordinary users can mutate only owner-bound uploads; protected file relationships are hidden from user API responses; and lesson delivery uses one entitlement service for books, exam papers, and videos. Five-minute grants are bound to the user, content, field, media document, and filename, after which Payload redirects eligible video requests to a short-lived R2 `GetObject` URL. PDF requests re-check the current subscription and content relationship before retrieving bytes. Legacy unclassified images remain readable to avoid breaking existing covers and profile pictures, while unclassified PDFs and videos are private.

- **G-07 — implemented:** practice tests now start through an authenticated, subscription-gated server endpoint that validates the student’s academic level, subject, topic, difficulty, and requested count before persisting an owner-bound two-hour session. Browser responses contain question and option IDs/text only; MCQ correctness and explanations are field-protected. Submissions contain only the session ID and selected option IDs, while the server derives correctness, totals, score, grade, elapsed time, attempt number, topic strengths/weaknesses, user, and content scope. Each immutable result is uniquely tied to one session, making retry and concurrent submission idempotent; ordinary users cannot create or update results directly.

## What is already implemented

The following capabilities are useful foundations and should be retained while hardening them:

- Payload 3 collections for users, content, subscriptions, transactions, study plans, progress, test results, notifications, content access, and activity logs.
- Responsive dashboard navigation and server-rendered pages with per-page authentication checks.
- Email/password registration, login, password recovery, password change, and account deletion screens.
- Fapshi initiation, webhook, polling, and subscription models.
- AI-assisted study-plan generation plus deterministic sanitization and timetable unrolling.
- Book, exam-paper, video, and MCQ browsing by academic level and subject.
- Notification center, reminder cron route, and audit-log schema.
- Docker multi-stage build and Cloud Run deployment configuration.
- Type-safe Payload models and a TypeScript-clean codebase.

## Prioritized gap register

### P0 — release blockers

| ID   | Gap                                                          | Evidence in current code                                                                                                                                                                                                                                                                            | Impact                                                                                                                    | Required outcome                                                                                                                                                                                                    |
| ---- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 | Committed production secrets                                 | `cloudbuild.yaml` contains database and Payload credentials as substitutions and passes secrets as Docker build arguments.                                                                                                                                                                          | Database/application compromise; credentials may also remain in repository history and build metadata.                    | Rotate every exposed secret, remove values from Git and build arguments, move runtime secrets to Secret Manager, and scan history and images.                                                                       |
| G-02 | Privilege escalation and mass assignment                     | `Users` permits public create; the `role` field permits create; `/api/custom/account/update-profile` forwards an arbitrary object to the Local API, which bypasses access control by default.                                                                                                       | Any user may be able to become admin/super-admin or modify protected fields.                                              | Force `role: user` on public registration, allowlist profile fields, make role/isActive/referral counters server-managed, and test rejected escalation attempts.                                                    |
| G-03 | Broken row-level ownership                                   | `selfOrAdmin` and `userAccess` compare `data.id` with the user ID even for documents owned through `user` or `recipient`; `StudyPlans`, `UserProgress`, and `TestResults` accept authenticated creates/updates without binding the owner. `ContentAccess` is readable by every authenticated user.  | Cross-user data creation/update, privacy leakage, unreliable user APIs, and disclosure of access/session metadata.        | Add relationship-aware ownership policies, bind owner fields from `req.user`, make owner fields immutable, hide sensitive fields, and use `overrideAccess: false` for Local API calls performed on behalf of users. |
| G-04 | Payment endpoints lack a coherent trust boundary             | Payment initiation accepts caller-supplied `userId` and amount without authentication; status endpoints expose/process transactions without consistent authorization; reconciliation reads `request.user` without authenticating it.                                                                | Payment abuse, transaction disclosure, unauthorized external API usage, and account/subscription manipulation.            | Authenticate every user route, derive user and plan price on the server, reserve batch/status reconciliation for cron/admin callers, and rate-limit initiation and polling.                                         |
| G-05 | Payment confirmation is not reliably authentic or idempotent | Webhook validation checks only payload shape; success is trusted without cryptographic verification or a provider status re-check. Status changes trigger `updateSubscriptions`, then webhook/status handlers call subscription activation again. Transaction identifiers are not uniquely indexed. | Forged confirmations, duplicate subscription extensions, races, and financial reconciliation errors.                      | Implement one transactional, idempotent payment state machine keyed by unique provider/external IDs; verify callbacks per Fapshi guidance or re-query Fapshi; activate a transaction exactly once.                  |
| G-06 | Premium media is publicly retrievable                        | Media now uploads directly to private R2 storage, but `Media.read` remains `anyone` and any authenticated user may create/update/delete media. The secure PDF route checks login but not entitlement; book/video/exam collection reads require only authentication.                                 | Subscription checks can be bypassed; users can delete or replace other users' media; content-protection claims are false. | Split public assets from protected assets, authorize each protected request against content and subscription, issue short-lived signed delivery URLs/tokens, and restrict media mutation to owners/admins.          |
| G-07 | Assessment answers and results are client-controlled         | MCQ REST responses include `options.isCorrect`; `TestingCenterClient` scores in the browser and posts correct answers, scores, user ID, and achievements inputs; `TestResults.create` trusts authenticated clients.                                                                                 | Users can inspect answers before submitting and forge perfect results, analytics, notifications, and achievements.        | Create server-side test sessions, return questions without answer flags, score submissions on the server, derive all metrics server-side, and make submitted results immutable.                                     |

### P1 — required for a dependable beta

| ID   | Gap                                                              | Evidence in current code                                                                                                                                                                                                                                                                               | Impact                                                                                                                                                     | Required outcome                                                                                                                                                                             |
| ---- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-08 | Unauthenticated or ineffective administrative routes             | Seed and study-plan routes read `(request as any).user`; the study-plan `my` route does not call `payload.auth`; the cron reminder route becomes public if `CRON_SECRET` is absent.                                                                                                                    | Routes fail unexpectedly or become reachable by unintended callers; seed and batch operations are unsafe.                                                  | Use a shared authentication/authorization helper, fail closed when secrets are absent, remove the example route, and disable seed routes in production builds.                               |
| G-09 | Progress tracking floods the API and trusts the client           | Video/book trackers include `seconds` in an effect dependency, so cleanup posts repeatedly as time changes. They create instead of upserting despite a unique index, and accept caller-supplied user/time.                                                                                             | Request storms, duplicate-key errors, inflated time/progress, noisy hooks and notifications.                                                               | Use throttled heartbeats plus `sendBeacon` on exit, derive user server-side, atomic upsert/delta validation, deduplicate events, and test multi-tab behavior.                                |
| G-10 | Authentication/session hardening is incomplete                   | Registration accepts six-character passwords while password change requires stronger rules; no email verification, login throttling/lockout, session inventory/revocation, or explicit 30-day inactivity policy is configured.                                                                         | Account takeover risk and mismatch with the SRS.                                                                                                           | Apply one server-side password policy, rate limits, optional CAPTCHA after abuse, verified email flow, inactive-account enforcement, secure cookie review, and session revocation controls.  |
| G-11 | Referral attribution and rewards are not trustworthy or complete | Referral cookies are unsigned; the hook trusts a cookie-supplied referrer ID and increments on registration outside a transaction. The SRS reward is tied to a paid subscription but no idempotent reward ledger exists.                                                                               | Referral fraud, self-referrals, lost increments under concurrency, and unpaid/duplicated rewards.                                                          | Sign attribution tokens, prevent self/duplicate referrals, record immutable referral events, qualify only on first settled payment, and grant rewards idempotently.                          |
| G-12 | Account privacy and data lifecycle are incomplete                | Account deletion hard-deletes the user immediately, without a dependency-retention policy; data export is absent; privacy policy, terms, consent/version records, and retention rules are absent.                                                                                                      | Orphaned records, loss of required finance/audit data, unfulfilled privacy obligations, and unclear treatment of minors.                                   | Define retention/legal requirements, implement verified export and scheduled deletion/anonymization, preserve finance/audit integrity, publish legal pages, and version consent.             |
| G-13 | Storage migration and production media delivery are incomplete   | Payload now presigns direct browser uploads to Cloudflare R2, bypassing Cloud Run's request limit, with fail-closed runtime configuration and documented CORS. Existing-file migration, deployed CORS verification, lifecycle rules, resilient multipart ingest, and CDN delivery are not implemented. | Existing media can be stranded; large uploads remain vulnerable to connection loss; playback and downloads may still load the app or origin inefficiently. | Apply and verify R2 CORS, migrate existing files, add lifecycle/backup policies, implement multipart ingest where needed, and deliver protected media through an entitlement-aware CDN path. |
| G-14 | Observability, recovery, and operational readiness are missing   | No health/readiness routes, error aggregation, tracing, alert definitions, SLO dashboards, backup automation, restore test, or runbooks are present. Logging is primarily `console.*`; the activity log can be forged by authenticated clients.                                                        | Failures are hard to detect/diagnose; audit records are untrusted; recovery objectives are unknown.                                                        | Add structured logs with correlation IDs, error monitoring, metrics/traces, health probes, alerts, protected append-only audit events, automated backups, and quarterly restore tests.       |
| G-15 | CI and automated coverage are insufficient                       | There is one integration file centered on referrals and one stale E2E test that still expects the Payload blank template. No tests cover access control, payments, protected content, assessment integrity, or critical user journeys. Lint currently fails.                                           | Regressions in high-risk flows will reach production.                                                                                                      | Repair ESLint, isolate test infrastructure, add unit/integration/contract/E2E/security tests, and require them in CI before deploy.                                                          |
| G-16 | API validation and abuse protection are inconsistent             | Most routes manually parse unbounded JSON; there is no shared schema validation, request-size policy, rate limiter, or per-user AI/payment quota. Media has a 2 GB limit and bypasses the app process through direct R2 uploads, but route-level protections remain inconsistent.                      | Denial of service, unexpected payloads, excessive AI/provider cost, and oversized uploads.                                                                 | Add runtime schemas, bounded inputs, per-route body/file limits, rate and concurrency limits, timeouts, circuit breakers, and quota telemetry.                                               |

### P2 — product and scale gaps

| ID   | Gap                                                        | Evidence in current code                                                                                                                                                                                                                                                           | Impact                                                                                          | Required outcome                                                                                                                                                                                                           |
| ---- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-17 | Offline/mobile scope is not implemented                    | The repository is a Next.js web app with no native mobile client, service worker, web manifest, IndexedDB download store, sync queue, conflict handling, encrypted offline package, or storage manager. The Downloads page is a static empty state.                                | The core SRS promise of iOS/Android offline use is unmet.                                       | Make an explicit product decision: PWA-first or native client. Implement authenticated downloads, encrypted local storage, offline catalog, queued progress, conflict resolution, expiry/revocation, and storage controls. |
| G-18 | Video delivery lacks the specified media pipeline          | Videos are raw Payload uploads rendered directly by the browser; no transcoding, adaptive HLS/DASH, resolutions, CDN tokens, captions, or resumable downloads are implemented.                                                                                                     | Poor playback on mobile networks, high origin load, and unmet video requirements.               | Add asynchronous ingest/transcode jobs, manifests and renditions, private CDN delivery, captions, resume/progress telemetry, and offline package support.                                                                  |
| G-19 | PDF experience and protection are incomplete               | The proxy reads the entire PDF, base64-encodes it, and returns JSON; the client decodes the whole file and creates a Blob URL. Search, bookmarks/annotations integration, watermarking, range requests, and offline encryption are absent; the PDF worker loads from a public CDN. | High memory/latency for large files, no true DRM, offline failure, and missing reader features. | Stream/range-deliver protected PDFs, self-host the worker, add per-user watermarking, search/bookmarks/annotations, persist reading position, and document the limits of browser content protection.                       |
| G-20 | Notification delivery is incomplete                        | Push delivery is a TODO; settings say notification preferences are coming soon; reminders scan up to 500 plans and update whole arrays one reminder at a time. `mark-all-read` queries `user` instead of `recipient`.                                                              | No mobile push, incorrect notification actions, and reminder scaling/reliability issues.        | Model user preferences/device tokens, add a queue and push provider, make sends idempotent, repair ownership/query fields, and schedule indexed reminder jobs.                                                             |
| G-21 | Admin analytics do not meet the SRS                        | The custom admin component is a welcome banner; there is no financial/product analytics dashboard, reconciliation summary, funnel, cohort, content, or operational reporting.                                                                                                      | Administrators cannot operate the business from the promised dashboard.                         | Define governed KPIs and build role-scoped financial, subscription, content, learner, referral, and system dashboards with export and reconciliation drill-down.                                                           |
| G-22 | Accessibility/performance controls are incomplete          | Motion wrappers do not respect `prefers-reduced-motion`; no automated accessibility, keyboard, screen-reader, Core Web Vitals, bundle, load, or 10,000-user tests exist. The PDF path copies entire large files through server and browser memory.                                 | Motion sensitivity, inaccessible journeys, and unverified performance targets.                  | Add reduced-motion behavior, semantic/live feedback, keyboard/focus QA, axe/Lighthouse gates, Web Vitals telemetry, bundle budgets, media benchmarks, and load tests.                                                      |
| G-23 | Requirements and implementation documentation have drifted | `docs/DEVELOPMENT_ROADMAP.md` still presents implemented pages as future work, while the README promises native/offline/DRM behavior not present in this repository. Environment and deployment docs omit several runtime variables.                                               | Planning, stakeholder expectations, onboarding, and release claims are unreliable.              | Maintain a requirements traceability matrix, architecture/data-flow diagrams, API contracts, environment catalog, operational runbooks, and honest platform capability statements.                                         |

## Delivery roadmap

The schedule below assumes one backend/full-stack engineer, one frontend/mobile engineer, and shared QA/DevOps support. A single engineer should expect roughly double the elapsed time. Security phases intentionally precede feature phases.

### Phase 0 — incident containment and release freeze

**Target:** 0–48 hours
**Goal:** Remove immediate compromise paths and preserve evidence.

Work:

- Rotate the database password, Payload secret, and any other credential that has been committed or included in build configuration.
- Review database access logs, Cloud Build logs, Artifact Registry images, and admin users for suspicious activity.
- Replace Cloud Build secret substitutions/build arguments with runtime Secret Manager bindings.
- Purge secrets from repository history using an approved history-rewrite procedure; coordinate this because every clone will need to rebase or reclone.
- Temporarily disable or firewall unauthenticated payment status/batch routes, seed routes, and other administrative endpoints.
- Back up the production database before schema/access changes and perform a restore smoke test in an isolated project.
- Add a temporary release gate: no production deployment until P0 security tests pass.

Exit criteria:

- No live credential appears in the current tree, Git history scan, image history, or build substitutions.
- All exposed credentials are invalidated and replaced through runtime secret injection.
- A clean backup can be restored.
- Sensitive endpoints reject anonymous requests.

### Phase 1 — identity, authorization, and protected content boundary

**Target:** Week 1–2
**Goal:** Establish one enforceable security model across Payload REST, Local API, pages, and files.

Work:

- Introduce tested access helpers such as `adminOnly`, `ownerOrAdmin('user')`, and `ownerOrAdmin('recipient')` that return row-level queries.
- Force public registrations to `role: user`; reject protected fields on create and update.
- Add field-level access for role, active state, referral counters, subscription state, audit fields, answer flags, encryption/session fields, and ownership fields.
- Replace arbitrary profile update payloads with a strict allowlist and runtime schema.
- Bind `user`, `recipient`, and similar ownership fields from the authenticated request in hooks/endpoints and make them immutable for ordinary users.
- Audit every Local API call. Pass `req` through nested hook operations for transaction consistency; use `overrideAccess: false` plus `user` for operations made on a user's behalf; explicitly document system-level bypasses.
- Restrict media mutation, split public branding/profile assets from premium content, complete the R2 migration, and add entitlement-aware delivery.
- Create a single `authorizeContent(user, contentType, contentId)` service and use it in content metadata, PDF, video, exam, and download delivery.
- Remove sensitive MCQ and content-access fields from public/user responses.

Tests/gates:

- Anonymous registration with `role: super-admin` is rejected or normalized to `user`.
- A normal user cannot update role/isActive, another user's profile, study plan, progress, result, notification, media, subscription, transaction, or content-access record.
- An admin can perform only the operations assigned to that role; content manager and support permissions are separately tested.
- Direct protected-file URLs return 401/403 without valid entitlement, including after subscription expiry.

### Phase 2 — financial and learning-data integrity

**Target:** Week 3–4
**Goal:** Make payments, tests, progress, referrals, and achievements authoritative and replay-safe.

Payment work:

- Replace caller-supplied `userId`, amount, and plan with authenticated user plus server-side plan lookup.
- Add unique indexes for `externalId`, `fapshiTransId`, and the internal transaction ID; write a migration/deduplication check first.
- Implement a payment state machine with allowed transitions and an immutable event/history record.
- Route webhook, manual check, and reconciliation results through one `settleTransactionOnce` service inside a database transaction.
- Verify webhook authenticity according to Fapshi's supported mechanism; if signatures are unavailable, fetch the provider transaction and compare provider ID, external ID, user, amount, and final state before settlement.
- Make retries return the original result and add a reconciliation report for discrepancies rather than silently swallowing failures.
- Generate payment/subscription notifications only after committed settlement.

Learning-data work:

- Add a server-created test session containing question IDs, mode, owner, expiry, and attempt number.
- Return randomized options without correctness flags; accept selected option IDs only; score against server data.
- Derive score, grade, weak/strong areas, times, achievements, and notifications on the server.
- Make completed test results append-only; expose only the owner's result.
- Replace progress POST-on-render with validated heartbeat/delta upserts and idempotency keys.
- Create a referral event/ledger that qualifies a reward on the first settled subscription and prevents self/duplicate rewards.

Tests/gates:

- Replaying the same successful webhook/status response 100 times extends a subscription once.
- Concurrent settlement attempts produce one activation and one notification.
- Mismatched amount/user/provider IDs do not settle and create an alertable discrepancy.
- The browser never receives `isCorrect` before submission and cannot submit a score directly.
- Forged user IDs, time values, achievements, and referral cookies do not alter another account or trusted metrics.

### Phase 3 — deployment, reliability, and engineering gates

**Target:** Week 5–6
**Goal:** Make builds reproducible and production behavior observable and recoverable.

Work:

- Add validated environment configuration that fails fast for required production variables (`DATABASE_URI`, `PAYLOAD_SECRET`, server URL, email, payment, AI, storage, cron, and monitoring credentials).
- Pin and document Node/pnpm versions; repair ESLint dependencies and replace the legacy lint command with ESLint's supported CLI.
- Add CI for formatting, lint, type generation drift, typecheck, unit/integration tests, production build, dependency/secret scanning, and container scanning.
- Provision an isolated test database with per-run names and reliable teardown; never point tests at ambient production configuration.
- Add health/readiness endpoints that verify process and critical dependency state without leaking secrets.
- Add structured application logs, request/correlation IDs, error monitoring, payment and job metrics, traces, and alerts.
- Move cron/batch work into Payload jobs or a queue with retries, leases, dead-letter handling, and idempotency.
- Define SLOs and alerts for availability, latency, error rate, payment settlement lag, reminder lag, queue depth, and media failures.
- Automate database and object-store backups, retention, encryption, and restore drills.

Minimum automated suite:

- Access-control matrix for every collection/global and representative Local API call.
- Payment initiation, callback validation, idempotency, state transitions, and reconciliation.
- Registration/login/password reset/profile update/account lifecycle.
- Content entitlement and expired-subscription denial.
- Test session/scoring/result ownership.
- Planner generation sanitization, session logging, and reminder idempotency.
- Referral qualification/reward idempotency.
- E2E smoke flows for anonymous, free, paid, content manager, support, admin, and super-admin roles.

Exit criteria:

- A clean clone can install, lint, typecheck, test, build, scan, and deploy without manual state.
- Production deploys are blocked on failed gates and support rollback.
- Alerts and restore procedures have been exercised, not merely documented.

### Phase 4 — complete the production web product

**Target:** Week 7–10
**Goal:** Close the remaining web, administration, and compliance requirements.

Workstreams:

1. **Account and compliance**
   - Email verification, session/device management, notification preferences, data export, staged deletion/anonymization, privacy policy, terms, consent versioning, support/contact flow.
2. **Notifications**
   - Device tokens, push provider, preference-aware queue, scheduled delivery, retry/dead-letter handling, expiry, read-state fixes, and subscription-expiry reminders.
3. **Admin operations and analytics**
   - Role-scoped dashboards for gross/reconciled revenue, payment success, active/expiring subscriptions, conversion, learner engagement, test performance, content usage, referrals/rewards, job health, and exports.
4. **Content operations**
   - Draft/publish workflow, content validation, safe preview, bulk import with dry run, duplicate detection, media processing status, audit history, and archival rules.
5. **Reader/player experience**
   - PDF search, bookmarks, annotations, persisted position, range delivery, self-hosted worker, watermarking; video captions, playback speed, resume, adaptive streaming, and progress accuracy.
6. **Accessibility and performance**
   - Reduced motion, focus management, live status/error feedback, keyboard and screen-reader coverage, image/media semantics, Web Vitals instrumentation, bundle budgets, and low-end/mobile network testing.

Exit criteria:

- All web-scoped SRS requirements have a passing acceptance test or an explicitly approved deferral.
- Admin financial figures reconcile to provider/database reports for a defined period.
- Accessibility and performance budgets pass on representative low-end mobile hardware/network profiles.

### Phase 5 — mobile and offline platform

**Target:** Week 11–18+
**Goal:** Deliver the iOS/Android and offline capabilities promised by the SRS.

Decision gate first:

- Choose **PWA-first** if browser limitations are acceptable, or a **native/cross-platform client** if screenshot controls, background downloads, protected offline media, push, and OS storage integration are mandatory.
- Document which content-protection claims are technically enforceable on each platform. No client can guarantee absolute prevention once decrypted content is displayed.

Core work:

- Authenticated, resumable download manifests with entitlement and device binding.
- Encrypted local content keys protected by platform keystore/keychain.
- Offline catalog, storage quotas/usage UI, eviction, integrity checks, and version updates.
- Offline progress/test/annotation queue with idempotency keys, conflict policy, clock-skew handling, and sync status UI.
- Periodic entitlement refresh, grace policy, expiry revocation, and remote device/session revocation.
- Platform push notifications, deep links, background tasks, and download recovery.
- Android/iOS screen-capture controls where supported, personalized watermarking, and clear residual-risk documentation.
- Compatibility/device matrix covering the supported OS, RAM, storage, orientation, interruption, and network profiles.

Exit criteria:

- A paid user can download, go offline, consume content, take an allowed test, annotate, restart the app, and later sync without loss or duplication.
- Expired/revoked users lose protected offline access according to the approved grace policy.
- Storage, corruption, low-space, partial-download, multi-device, and conflict cases pass automated/manual tests.

### Phase 6 — release hardening and launch

**Target:** Week 19–20
**Goal:** Prove production readiness and hand over an operable service.

Work:

- Threat model and independent penetration test focused on authorization, payments, files, admin roles, offline keys, and APIs.
- Load tests for expected traffic plus spike/failure scenarios; media tests use realistic file sizes and mobile networks.
- Disaster-recovery exercise against stated RPO/RTO.
- Full UAT traceability against approved SRS requirements.
- App-store/privacy disclosures, support procedures, incident response, on-call ownership, and rollback rehearsal.
- Gradual rollout with feature flags, canary cohort, dashboards, and go/no-go review.

Release gates:

- Zero open P0/P1 security findings.
- No known cross-user access, duplicate settlement, or protected-file bypass.
- CI, backup/restore, alerting, rollback, privacy, and support procedures are operational.
- Product claims match measured and demonstrated behavior.

## Recommended work packages

These packages can become epics. Ordering reflects dependencies.

| Epic                                              | Depends on           | Primary owner    | Indicative effort |
| ------------------------------------------------- | -------------------- | ---------------- | ----------------- |
| E0 Secret incident response                       | None                 | DevOps/Security  | 1–2 days          |
| E1 Authorization model and escalation fixes       | E0                   | Backend          | 5–8 days          |
| E2 Private media storage and entitlement delivery | E1                   | Backend/DevOps   | 7–12 days         |
| E3 Idempotent payment settlement                  | E0, E1               | Backend          | 7–10 days         |
| E4 Server-authoritative tests/progress/referrals  | E1                   | Backend/Frontend | 8–12 days         |
| E5 CI, isolated tests, lint/build gates           | E1, E3               | QA/DevOps        | 7–10 days         |
| E6 Observability, jobs, backup/recovery           | E0                   | DevOps/Backend   | 7–10 days         |
| E7 Compliance and account lifecycle               | E1, E6               | Backend/Product  | 5–8 days          |
| E8 Notifications and expiry automation            | E1, E6               | Backend/Mobile   | 5–8 days          |
| E9 Admin analytics and reconciliation             | E3, E6               | Full stack/Data  | 8–12 days         |
| E10 PDF/video production pipeline                 | E2, E6               | Backend/Frontend | 10–15 days        |
| E11 Mobile/offline client                         | E1, E2, E4, E8, E10  | Mobile/Backend   | 30–50+ days       |
| E12 Accessibility, performance, security release  | All applicable epics | QA/Security      | 8–12 days         |

## Definition of done for every implementation item

An item is not complete until:

- Acceptance criteria and misuse/negative cases are documented.
- Authorization is enforced server-side and covered by tests.
- Runtime input is schema-validated and bounded.
- Sensitive data is neither logged nor returned unnecessarily.
- Writes that can retry are idempotent; related writes use a transaction where required.
- Logs/metrics make success and failure observable without exposing secrets or personal data.
- Unit/integration tests pass in isolated infrastructure; critical UI paths have E2E coverage.
- Accessibility, responsive behavior, loading/error/empty states, and reduced motion are verified where relevant.
- Documentation, environment variables, migrations, rollback, and operational ownership are updated.

## First implementation slice

The safest first pull-request sequence is:

1. Rotate/remove committed secrets and bind Secret Manager at runtime.
2. Add regression tests that demonstrate role escalation, cross-user writes, anonymous payment/status access, duplicate settlement, and direct premium-media access.
3. Fix public registration/profile allowlists and collection ownership/field access.
4. Authenticate and scope payment/admin routes.
5. Consolidate payment settlement into one idempotent transactional service.
6. Move protected media to private durable storage and enforce entitlement at delivery.
7. Move MCQ scoring and result derivation to the server.

This sequence reduces the largest risks quickly while producing tests that prevent the same classes of defect from returning.
