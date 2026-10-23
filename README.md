# TAYCO · Construction and project portal

TAYCO's commercial and residential website, with private project spaces for its team, clients and providers. The navy, gold and orange editorial design, service galleries and motion are preserved. Public pages explain services and contact; operational information belongs behind account access.

## Local development

Use Node.js 24 and npm.

```text
npm ci
npm run dev -- -p 3005
npm run build -- --webpack
npm start -- -p 3006
```

Public pages work without an account. Private access has no built-in credentials. Follow [account setup and recovery](docs/auth-operations.md) to create the first administrator privately and configure a random session secret.

## Product areas

- Commercial and residential services, projects/material galleries, coverage and contact.
- Preliminary budget planning and estimate requests; illustrations are not approved quotes.
- Provider applications with secure document follow-up after invitation.
- Team workspace for requests, projects, hours, invoices, documentation and project history.
- Client workspace for assigned projects, updates, documents and scope-change decisions.
- Provider workspace for assigned work, own hours, invoices and private documentation.
- Administrator account assignments, suspension, invitations and notification delivery.
- Requests assigned to active TAYCO coordinators, with stage, next action and history.
- Dated project schedules and milestones, approved budget source/date, selectively shared contacts and project files.
- Executive console and grouped responsive navigation, bid comparison, purchase orders and evidence-based compliance tracking.
- Monthly invoice/payment reporting, partial-payment records, corrections, twelve-month charts and protected CSV; no payment is initiated.
- Scoped client-facing dossier export and explicit Takeoff/accounting integration availability.
- Document renewal notices, preservation holds and reversible removal before an explicitly approved storage purge.

The database starts empty. Unknown values stay unknown; a received document is pending review. No simulated payroll, tax certification, investment return or accounting synchronization is presented as live.

See [workspace modules and reporting](docs/workspace-modules.md) and [the original module inventory](docs/module-parity.md) for restored functionality and the advanced data-dependent work that remains.

## Private deployment configuration

Set these in the deployment's secret/configuration store, never in Git:

| Variable | Purpose |
| --- | --- |
| TAYCO_SESSION_SECRET | At least 32 random characters; seals session cookies |
| TAYCO_APP_URL | Exact public HTTPS origin |
| TAYCO_AUTH_DB_PATH | Absolute path to persistent account SQLite database |
| TAYCO_ERP_DB_PATH | Absolute path to persistent ERP SQLite database |
| TAYCO_PUBLIC_TENANT_ID | Intake company; defaults to tayco_llc |
| BLOB_READ_WRITE_TOKEN | Private Vercel Blob storage; optional until documents are enabled |
| RESEND_API_KEY | Optional notification provider credential |
| TAYCO_NOTIFY_EMAIL | Approved internal recipient for request alerts |
| TAYCO_EMAIL_FROM | Verified sender for request alerts |
| TAYCO_NOTIFICATION_ADMIN_EMAIL | Existing active administrator for the private notification worker |
| TAYCO_NOTIFICATION_TENANT_ID | Company authorized for that notification recipient |
| TAYCO_NOTIFICATION_INTERVAL_SECONDS | Optional worker interval; defaults to60 |
| TAYCO_DOCUMENT_NOTICE_DAYS | Renewal lead time; defaults to30 calendar days |
| TAYCO_DOCUMENT_RETENTION_DAYS | Optional physical-retention policy after removal; disabled when absent |
| TAYCO_DOCUMENT_MAINTENANCE_TENANT_ID | Explicit company scope for private document-maintenance CLI |
| ALLOWED_ORIGINS | Additional explicitly approved public form origins |

This version targets **one application instance with a persistent private volume**. Ephemeral/serverless filesystems and separate replicas require a shared database adapter before deployment. Docker uses Node24 and includes private operator scripts. Mount the private volume at /app/.data or set both database paths to the mounted volume. Container restart must preserve that volume.

Account invitation and recovery are operator/admin assisted. No automatic invitation email, MFA, SSO or automatic mailbox-verified recovery is claimed. An administrator shares an invitation link privately with the verified recipient.

## Requests, storage and delivery

All successful public submissions return a durable reference. They atomically queue an internal notification; saved and provider-accepted are different states. An administrator can process pending delivery from Activity. The private notification worker supports explicit unattended operation; see [notification operations](docs/notification-operations.md). It defaults to inspection without sending. No service or schedule is installed automatically. Missing provider settings preserve requests and report delivery unavailable.

Private file upload requires an assigned account. PDF/JPEG/PNG signatures and bounded multipart bytes are checked. A receipt does not certify contents or insurance validity. Documents are private attachments available through authorized downloads, not public URLs. Malware scanning is not configured.

Takeoff and accounting integrations remain **not configured**, rather than reporting a simulated connection. The reviewed legacy implementation's static numbers and local machine links are not used as operational integrations.

## Protect and recover data

Read [data operations](docs/data-operations.md). Legacy JSON and the old static portal are preserved privately for review; they are excluded from Git and Docker. Existing Git history was not rewritten, so deleting tracking does not erase historical content.

```text
node --import tsx scripts/migrate-legacy.ts
node --import tsx scripts/backup-data.ts --maintenance-confirmed
node --import tsx scripts/reconcile-uploads.ts
```

Migration archives original bytes without inventing project assignments. Set TAYCO_BACKUP_DIR to a new private directory and stop writes before a cross-database backup. Upload reconciliation is dry-run by default; --apply must be an intentional operator action after inspecting counts and retaining backups.

## Verification

```text
node --import tsx --test tests/*.test.ts
npm run lint
npx tsc --noEmit
npm run build -- --webpack
npm audit --omit=dev
```

[Flow contracts](docs/product-flows.md) link actors, states, authorization and failure recovery. Browser tests and isolated local-server certification are documented in [verification](docs/verification.md). Tests use synthetic private fixture databases; external email/blob delivery is disabled in the certification server. A local test or successful build does not certify a production provider, real device or legal compliance.

Commercial identity reference: [taycoturnkey.com](https://www.taycoturnkey.com/). Confirm business contacts, coverage, license/certification claims, portfolio permissions and the final privacy notice with TAYCO before publication.
