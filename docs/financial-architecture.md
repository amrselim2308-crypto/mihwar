# Mihwar financial architecture — implementation specification

## Approved commercial rules

- Supported currencies in the product model: EGP, AED, SAR.
- Platform commission: 30% of the lesson share amount.
- Teacher share: 70% of the lesson share amount, before payment-provider charges and any legally required taxes or withholding.
- Teacher settlement becomes eligible only after the lesson is marked completed and the completion is accepted by the platform's operational rules.
- A booking request is not a paid booking. A payment is not a completed lesson. A completed lesson is not automatically a paid-out teacher balance.

## Required payment lifecycle

1. `created`: an internal payment attempt exists; no money is assumed collected.
2. `pending_provider`: checkout was initiated with the configured provider.
3. `authorized` or `captured`: use the exact provider state and distinguish authorization from capture.
4. `failed` / `cancelled` / `expired`: terminal non-success states; no teacher balance is created.
5. `refunded` / `partially_refunded`: append compensating ledger entries; never rewrite historical entries.
6. `lesson_completed`: the booking is completed through the lesson workflow.
7. `teacher_earning_available`: 70% becomes eligible according to the agreed settlement rule.
8. `payout_pending` / `payout_paid` / `payout_failed`: payout provider state is recorded independently from lesson completion.

## Ledger invariants

- Store money as integer minor units (for example, piasters/fils/halalas) plus an ISO currency code. Never use floating-point values for financial calculations.
- Freeze the currency, gross lesson amount, commission rate, platform amount, teacher amount, and provider fee snapshot on each successful capture. Later changes to a teacher's price or platform commission must not mutate historical records.
- Compute the split from the lesson amount using deterministic integer rounding. Persist the exact remainder allocation rule and test it for all currencies.
- Use an append-only ledger with unique references to provider events, payment attempts, bookings, refunds, and payouts. Enforce idempotency at both checkout creation and webhook ingestion.
- Verify webhook signatures using the provider's official verification method. Reject stale/replayed events and store provider event IDs uniquely.
- Never accept a browser callback as proof of payment. Only verified server-to-server provider events can confirm a capture or refund.
- Do not store raw card numbers, CVV, or payment credentials. Use provider-hosted checkout/tokenization.
- A refund, chargeback, or payout reversal creates new compensating entries; it never edits the original transaction.
- Teacher payout eligibility is a liability calculation, not a direct bank transfer. Payouts require verified beneficiary details, compliance checks, reconciliation, and an auditable operator approval flow.

## Minimum entities before enabling real payments

- `payment_attempts`: booking, amount/currency snapshot, provider, provider reference, idempotency key, status, timestamps.
- `provider_webhook_events`: provider event ID, signature verification result, payload hash, processing status, received/processed timestamps.
- `financial_ledger_entries`: immutable debit/credit entries, account, currency, amount in minor units, source reference, reversal reference.
- `teacher_payouts`: teacher, amount/currency, beneficiary reference held by the payout provider, status, provider transfer reference, operator audit fields.
- `refunds` and `disputes`: provider references, reason, amount, status, and links to compensating ledger entries.

## Launch gate

Do not enable checkout or show a payment-success state until a merchant account is approved for the operating legal entity and target countries, the provider supports the required settlement currencies/cross-border flow, webhook verification and idempotency tests pass, refunds and chargebacks are reconciled, teacher payout/KYC procedures are approved, and production secrets are configured. Provider selection must be made against the actual company registration, settlement bank account, country coverage, and commercial terms; this source package does not assume a provider or claim a live integration.


## Paymob Unified Checkout adapter (source implementation)

- The server creates a payment attempt only for a booking already in `confirmed` state. The server loads the approved teacher's current hourly rate and calculates the amount; the browser cannot supply or override a price or currency.
- `hourlyRate` is interpreted as a whole major-currency unit per hour. The configured `PAYMOB_CURRENCY` determines the one currency for the selected merchant integration. Amounts are converted to integer minor units using nearest-minor-unit rounding; the platform's 30% is rounded to the nearest minor unit and the teacher receives the exact remainder.
- The backend calls `POST /v1/intention/` with `Authorization: Token ...`, an internal special reference, a public HTTPS notification URL, and the merchant's integration IDs. The browser receives only the hosted Unified Checkout URL.
- A verified transaction callback is correlated using Paymob's `order.id`, then checked against the exact amount, currency, integration ID, booking state and expected payment-attempt state.
- Ambiguous network/response failures while creating an intention put the attempt in `requires_review` and block a second checkout, avoiding duplicate charges. Explicit 4xx provider rejections can be retried.
- Callback ingestion, payment capture, booking/payment state checks, and three double-entry ledger postings (`paymob_clearing` debit, `platform_revenue` credit, `teacher_escrow` credit) run in one MySQL transaction. Unique provider-event, transaction, and ledger source/account keys make retries idempotent.
- The standard Transaction Processed callback HMAC uses HMAC-SHA512 and Paymob's documented field order. Browser redirection is not a payment authority.
- A captured payment is required before a teacher or administrator can mark the lesson completed. Capture credits `teacher_escrow`; lesson completion atomically debits `teacher_escrow` and credits `teacher_payable`, making the 70% share eligible for settlement. This adapter does not transfer money to a teacher.
- Configure `PAYMOB_BASE_URL`, `PAYMOB_CHECKOUT_BASE_URL`, `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_PAYMENT_METHODS`, `PAYMOB_CURRENCY`, `PAYMOB_NOTIFICATION_URL`, and `PAYMOB_REDIRECTION_URL` only in the server environment. The API base is allow-listed to Egypt, KSA, and UAE origins and must match the configured currency. The checkout origin is separately configured and restricted to a Paymob checkout subdomain.
- The price model currently stores `teacherProfiles.hourlyRate` as an integer without a per-teacher currency. Therefore this adapter uses one deployment-level currency and one matching Paymob merchant integration configuration at a time. Multi-currency pricing and multi-country merchant routing require a currency field on teacher prices and region-specific integration selection before launch.
- The source code is not a live payment service until the migration is applied, the merchant account and matching integration IDs are approved, public HTTPS callbacks are configured, and real Sandbox callbacks pass end-to-end tests.
