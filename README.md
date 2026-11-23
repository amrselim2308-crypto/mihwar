# Mihwar — Self-hosted learning marketplace

Mihwar is a React + TypeScript frontend with an Express + tRPC backend and MySQL/Drizzle persistence. This repository includes a self-hosted deployment path using Docker Compose, MySQL, MinIO (S3-compatible private object storage), and an email/password authentication service.

## Local / server deployment

1. Install Docker Engine and Docker Compose v2.
2. Run `bash scripts/bootstrap.sh`; enter the main domain, storage subdomain, and first administrator email. The script creates unique secrets and a private `.env` file.
3. Point both domain DNS A records to the VPS public IP and allow inbound TCP ports 80 and 443.
4. Run `node scripts/deployment-preflight.mjs` to check the configuration.
5. Run `docker compose up -d --build`.
6. Caddy obtains and renews HTTPS certificates automatically. Open `https://YOUR_DOMAIN` and create the account using the bootstrap administrator email and the one-time setup token printed by the bootstrap script.

The compose file keeps MySQL, MinIO, and the app on a private Docker network. Only Caddy publishes ports 80/443; its reverse proxy forwards traffic to the app. MySQL and MinIO management ports are not published to the public internet. The app health endpoint is `/api/health`.

## Development

- `pnpm install --frozen-lockfile`
- `pnpm db:migrate` (requires `DATABASE_URL`)
- `pnpm dev`
- `pnpm check`
- `pnpm test`
- `pnpm build && pnpm start`

## Self-hosted ownership

- Source code: put this repository in an organization/repository owned by Mihwar.
- Runtime: VPS / Docker host owned and billed by Mihwar; Caddy handles HTTPS and certificate renewal.
- Database: MySQL volume and scheduled encrypted backups.
- Files: S3-compatible private storage. MinIO is included for a single-server start and is exposed only through the TLS-protected `STORAGE_DOMAIN`; signed object URLs use `S3_PUBLIC_ENDPOINT`. For production scale, use separately backed-up S3-compatible object storage such as Cloudflare R2 or managed object storage.
- Domain: register it in an account controlled by Mihwar and use DNS to route to the VPS.
- Secrets: `.env` is excluded from Git and must be backed up securely outside the repository.

## Authentication

Standalone email/password authentication is implemented in `/api/auth/register`, `/api/auth/login`, and `/api/auth/logout`. Passwords are stored as scrypt hashes in the separate `auth_credentials` table. Sessions are signed with `SESSION_SECRET` and bound to `MIHWAR_APP_ID`. New accounts receive the regular user role unless the email matches `BOOTSTRAP_ADMIN_EMAIL` and the registration request also supplies the secret `BOOTSTRAP_ADMIN_TOKEN`.

Existing accounts are not automatically converted to email/password accounts. The ZIP does not contain a production database dump or the old managed-storage objects. Before migration, export and reconcile user identities and files from the previous host, then issue password setup / reset invitations through a verified email workflow. Do not copy old session cookies into the self-hosted deployment. The homepage hero image still references an old managed-storage object and must be copied into the new bucket or replaced before production launch.

## Optional integrations and remaining work

- AI features use an OpenAI-compatible endpoint configured with `AI_API_BASE_URL`, `AI_API_KEY`, and `AI_MODEL`.
- Google Maps server calls use `GOOGLE_MAPS_API_KEY`; the browser map key `GOOGLE_MAPS_BROWSER_KEY` must be restricted by HTTP referrer in Google Cloud.
- Private files use S3-compatible storage configured by `S3_*` values.
- Some legacy scheduled-task, notification, voice, image-generation, and data-service helpers still use the optional legacy Manus service contract. They are not required for core site startup, but must be replaced or disabled before claiming every feature is fully independent.
- Payment gateway connections, multi-country settlement/payouts, live classroom/video, email verification, password reset, and production-grade distributed audit/rate-limit infrastructure still require implementation and provider credentials. The approved 30% platform / 70% teacher split and EGP/AED/SAR currency model are documented in `docs/financial-architecture.md`; this is a specification, not an active payment integration. No live payment credentials or video provider account are included in this source archive.

## Database migrations

The standalone auth migration is `drizzle/0007_standalone_auth.sql`. The container runs `pnpm db:migrate` before starting the app. Always back up MySQL before applying migrations to an existing production database.


## First administrator account

The first administrator registration requires both `BOOTSTRAP_ADMIN_EMAIL` and the secret `BOOTSTRAP_ADMIN_TOKEN`. The bootstrap script generates a random token and prints it once; keep it private and enter it in the optional administrator setup section on the registration page. Matching the email alone never grants administrator privileges. Regular account registration does not require this token.


## Paymob checkout setup (Sandbox first)

1. Apply database migrations: `pnpm db:migrate`.
2. In the Paymob dashboard, obtain the Secret Key, Public Key, HMAC Secret, and the numeric Integration ID(s) for the same region, currency, and Test/Live mode.
3. Set the `PAYMOB_*` variables from `.env.example` on the server, including the merchant-confirmed regional `PAYMOB_CHECKOUT_BASE_URL`. Never put `PAYMOB_SECRET_KEY` or `PAYMOB_HMAC_SECRET` in frontend config.
4. Set `PAYMOB_NOTIFICATION_URL` to the public HTTPS URL `https://<your-domain>/api/payments/paymob/webhook` and configure the same transaction callback URL in the Paymob integration if required by the dashboard.
5. Confirm a booking in the admin/teacher workflow. The parent portal then offers a Paymob checkout action and asks for the payer's international phone number.
6. Treat only the verified server callback as payment confirmation. The browser redirect is informational only.

The adapter uses a single configured currency per deployment because the current teacher price table has no currency column. Do not activate cross-currency pricing until the price model and merchant routing are expanded. No Paymob credentials or real transaction are included in this source archive. Paid or unresolved bookings cannot be cancelled from the teacher/admin workflow; refunds and manual reconciliation must be handled through a separately approved process until those workflows are implemented.

### Paymob payment integration
The server-side checkout and transaction webhook are implemented in `server/_core/paymob.ts`. Configure the Paymob variables from `.env.example` on the server only. The webhook is the source of truth for captured payment; browser redirection does not mark a booking paid. The current deployment configuration supports one currency/Paymob region per deployment. See `docs/financial-architecture.md` and `DEPLOYMENT_STATUS.md` for the ledger, reconciliation rules, and validation limitations.

## Payment integration status

- Paymob checkout and payment ledger are implemented in the server source; merchant configuration and Sandbox verification are required before production use. The admin dashboard includes a read-only payment monitor.
