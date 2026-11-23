# Mihwar self-hosting work status

## Implemented in this source package

- Replaced the active Manus OAuth route with local email/password registration and login.
- Password hashes use Node.js scrypt and are stored separately in `auth_credentials`.
- Signed sessions use `SESSION_SECRET` and `MIHWAR_APP_ID`.
- Added first-admin bootstrap requiring both `BOOTSTRAP_ADMIN_EMAIL` and a high-entropy `BOOTSTRAP_ADMIN_TOKEN`; email matching alone cannot grant admin role. The bootstrap script generates and displays the token once.
- Added migration `0007_standalone_auth.sql` and the matching Drizzle journal/snapshot entries.
- Moved active object storage to S3-compatible storage and added separate internal/public S3 endpoints for MinIO behind Caddy.
- Added Docker Compose services for MySQL, MinIO, the app, and Caddy automatic HTTPS.
- Moved Google Maps to direct Google Maps APIs and restricted public config to the browser key.
- Moved LLM requests to an OpenAI-compatible endpoint configured through `AI_API_*`.
- Removed the active Manus OAuth SDK implementation and unused Manus starter/debug files.

## Not yet completed / requires owner accounts or provider access

- Hardened the in-memory auth throttle against unbounded key growth; it remains single-process and is not a substitute for distributed rate limiting.
- Added the payment architecture specification and the Paymob server-side checkout adapter described below.
- No production database export was included in `code (3).zip`; existing users, bookings, and other live records have not been migrated.
- No previous managed-storage object export was included. The existing homepage hero image still points to a legacy object and must be migrated or replaced.
- Existing users need a secure password setup / account-linking flow; old OAuth identities are not automatically converted.
- Paymob Unified Checkout server adapter is implemented in source: server-side pricing, Intention API, hosted checkout URL, SHA-512 transaction callback verification, atomic MySQL payment/booking/ledger writes, escrow-to-payable release on lesson completion, and idempotency constraints. It is not connected to a merchant account or tested against live/Sandbox callbacks.
- Refund/chargeback workflows, automated teacher payouts, payout KYC, and an admin reconciliation screen for `requires_review` payments are not implemented. Cancellation is blocked for captured or unresolved payments to avoid losing track of collected funds.
- Live classroom/video provider integration and attendance verification are not complete.
- Email verification, password reset, production email delivery, and stronger distributed rate limiting are not complete.
- Optional legacy helper modules for scheduled tasks, image generation, voice transcription, notifications, and generic data APIs still use the old provider contract or are not wired into the core standalone runtime.

## Paymob implementation details and remaining gates

- Added migration `0008_paymob_payments.sql` and Drizzle schema/snapshot entries for payment attempts, provider webhook events, and append-only financial ledger entries.
- Payment can be initiated only for a confirmed booking. A captured payment is now required before teacher/admin completion.
- The teacher price model has no per-teacher currency field; this implementation intentionally uses one `PAYMOB_CURRENCY` per deployment. Do not mix EGP/AED/SAR prices in the same deployment until currency-aware price storage and region routing are implemented.
- The user profile currently does not contain a phone field; checkout therefore requests the phone number at the payment step. Billing address fields not collected by Mihwar are sent as `NA` placeholders; verify with the merchant account's required billing-data policy before production.
- Apply migration 0008 before deploying. Configure all PAYMOB_* values only as server environment secrets. The webhook must be reachable over public HTTPS.
- No credentials were supplied, so no Paymob API call, Sandbox payment, callback, refund, or settlement was executed.

## Validation performed in this workspace

- 136 TypeScript/TSX source files transpiled with zero syntax diagnostics after Paymob integration.
- `docker-compose.yml` parsed successfully as YAML.
- Targeted TypeScript syntax transpilation, migration metadata JSON parsing, `node --check` for deployment preflight, and `bash -n` for bootstrap completed. Full TypeScript typecheck, Vitest suite, Docker image build, MySQL migration execution, and live/Sandbox Paymob callbacks were not run because project dependencies/database/provider credentials are not available in this environment.
- `bash -n scripts/bootstrap.sh`, a temporary bootstrap run, and the deployment preflight with dummy valid settings completed successfully.

## Paymob hardening update — 23 November 2026

- HMAC input now requires exactly 128 hexadecimal characters before decoding; uppercase/lowercase hex is accepted and comparison remains timing-safe.
- A captured payment attempt is immutable during callback processing. A repeat of the same transaction is idempotent; a different transaction ID for the same order is flagged for reconciliation without downgrading the captured payment or rewriting its ledger.
- Webhook integration-ID validation is decoupled from checkout-only API key and redirect URL validation, so callback processing does not unnecessarily depend on the public key or checkout URL configuration.
- Added unit coverage for HMAC encoding/tampering and captured-payment duplicate/conflict classification. These tests are authored but have not been executed in this environment because the dependency installation is incomplete.

## Admin payment monitoring update — 23 November 2026

- Added an administrator-only, no-store read endpoint for the latest 50 payment attempts. It exposes operational identifiers and split amounts only; it deliberately excludes checkout secrets, billing details, and raw provider payloads.
- Added a read-only payment monitor to the admin dashboard, including status, order/transaction IDs, booking reference, and the platform/teacher allocation. `requires_review` attempts are visibly flagged for manual comparison against the Paymob merchant dashboard.
- Updated public booking guidance and the admin integration status so the UI no longer incorrectly says that payment processing is wholly disconnected. The UI clearly distinguishes implemented source code from the still-unverified merchant/Sandbox state.
- No manual capture/release control was added: an administrator must not be able to mark a payment paid from the dashboard without verified provider evidence. Refunds and payout execution remain unimplemented.
