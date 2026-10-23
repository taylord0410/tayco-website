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
- Private guest review of completed-month management estimate ranges; no project, document or accounting drilldown.
- Versioned monthly gross projections, distinct from invoice/payment totals, with administrator-only guest visit/control activity review.
- Explicit commercial milestones, including awaiting insurance information, without changing execution or proposal decisions.
- Requests assigned to active TAYCO coordinators, with stage, next action and history.
- Dated project schedules and milestones, approved budget source/date, selectively shared contacts and project files.
- Refined executive console with interactive cost/status graphics, persisted atmosphere/density/lighting controls, grouped responsive navigation, bid comparison, purchase orders and evidence-based compliance tracking.
- Private estimating archive with source versions, exact CSI/APU breakdowns and separate material/labor/equipment tiers.
- Monthly executive business report, explicit project teams and client proposals with draft/sent/decision history; accepted proposals do not create revenue or payments.
- Interactive executive dashboard with the current TAYCO identity, source-backed indicators, twelve-month charts, agenda, quick access and next-month calendar.
- Click any month for weekly client receipts, provider payments, recorded cash result and projects linked through explicit dates/activity; accounting profit is not inferred from incomplete costs.
- Internal corporate meetings and follow-ups with dates, responsible staff, notes, priorities, state history and versioned edits.
- Monthly invoice/payment reporting, partial-payment records, corrections, protected CSV, dated next-period plans and separately weighted proposal billing scenarios; no payment is initiated.
- Dated work-hour reporting by ISO week, project, trade, submitter and review state, with protected CSV/JSON exports; no wages or statutory payroll are inferred.
- Scoped client-facing dossier export and explicit Takeoff/accounting integration availability.
- Document renewal notices, preservation holds and reversible removal before an explicitly approved storage purge.

The database starts empty. Unknown values stay unknown; a received document is pending review. No simulated payroll, tax certification, investment return or accounting synchronization is presented as live.

See [data sources and reusable project setup](docs/data-sources.md), [the financial dashboard, interactive months and corporate agenda](docs/financial-dashboard.md), [business reports and operational flows](docs/business-workspace.md), [workspace modules and reporting](docs/workspace-modules.md), [source-backed estimate recovery](docs/estimate-recovery.md) and [the original module inventory](docs/module-parity.md) for restored functionality and the advanced data-dependent work that remains.

Projects have independent contracting, funding and labor classifications with source-backed review history and manual, project-scoped requirement categories. See [project classification](docs/project-classification.md) and [Railway review operations](docs/railway-review.md).

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

Accounting remains **not configured** until a real provider is connected. Takeoff provides an authenticated project-plan reader when its private source mappings and upstream are configured; configuration alone is not a successful document-delivery claim. See [protected viewer and explicit guest approvals](docs/takeoff-viewer-integration.md). Source-backed project estimates can be recovered into the private workspace as versioned snapshots, independently of live integration. An estimate is not an approved contract, executed cost or payment; failed remote connections never report success. See [estimate recovery](docs/estimate-recovery.md).

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

[Flow contracts](docs/product-flows.md) link actors, states, authorization and failure recovery. The [administration flow map](docs/admin-product-flow-map.md) connects all 22 destinations, manual handoffs and recovery boundaries; the [product engineering review](docs/admin-product-review.md) distinguishes observed behavior from incomplete integration and untested branches. Public navigation belongs to known marketing pages; workspace, account, login and error pages use a separate focused shell. Browser tests and isolated local-server certification are documented in [verification](docs/verification.md). Tests use synthetic private fixture databases; external email/blob delivery is disabled in the certification server. A local test or successful build does not certify a production provider, real device or legal compliance.

Commercial identity reference: [taycoturnkey.com](https://www.taycoturnkey.com/). Confirm business contacts, coverage, license/certification claims, portfolio permissions and the final privacy notice with TAYCO before publication.

## Private review and planning

See [guest review contracts](docs/guest-review-flow.md) for the restricted role, completed-month calendar, projection sources and bounded first-party activity. Administrators create a private guest invitation in Account & access; there is no public guest registration or emailed password. Financial dashboard → Estimated monthly gross lets internal staff save/revise company ranges with a source. Account & access → Guest review activity is administrator-only.

Approved October project groups and plans can be shared with a specific guest through explicit company/project/document approvals, while financial access remains restricted to historical month summaries. Unidentified drawing sets stay unassociated. Source-backed documents are registered as external Takeoff references, not fictitious Blob uploads; removing a reference does not delete the shared source package. Approximate management ranges never create invoices, payments or assumed profit.

The private reader keeps all document requests under the TAYCO session and same-origin gateway. No public reader domain or anonymous plan URL is needed. A disabled-by-default, temporary administrator-only source-registration API previews pinned metadata before committing records; it never accepts arbitrary file paths, upstream URLs or guest grants. Optional deployment-only operator inputs are kept outside public assets and ignored by Git.
