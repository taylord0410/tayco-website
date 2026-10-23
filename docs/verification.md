# Verification record · 2026-10-23

Scope: local repair branch, Node24.14.1, Next16.4.2, production build on Windows and a real local Linux Docker image. Account and ERP databases used by runtime tests were isolated synthetic fixtures. External Blob/Resend credentials were explicitly disabled in the local certification server. No client account, email, payment or production data was changed.

## Executed evidence

| Mechanism | Observation |
| --- | --- |
| Unit/integration/boundary suites | 69 tests, 69 passed, no skipped cases |
| Actual local HTTP server | 9 scenario groups passed: anonymous/legacy denial, Origin/tenant, project isolation, duplicate intent, stale edit, vendor privacy, durable public receipt, fail-closed providers |
| Navigation | Eight viewports, no horizontal page overflow;44px targets; keyboard/Escape/focus, outside dismissal, skip target and reduced motion |
| Public content and intake | Six routes at390 and1440,12 route/viewport cases without overflow; explicit query context; raw calculator edit and invalid range; three mocked503→retry→receipt cycles with same request key |
| Portal GUI | Five roles; authenticated SSR; eight viewports; server-committed response loss/retry creates one project; version409 retains input and requires review |
| Business GUI flows | Request create/review; client update; requested→proposed→accepted scope change; provider hours→internal approval; provider invoice→admin paid metadata; unconfigured upload/notification errors |
| Account GUI | Actual login, account and logout; logged-out request401 while a separate existing session remains valid |
| Document boundary | Actual upload/download handlers and SDK with network-disabled transport mocks: pending receipt, exact attachment bytes, owner/client sharing and other-client/provider denial before provider access |
| Backup/restore | WAL snapshot integrity and zero/empty values; separate restoration of actual synthetic account+ERP schemas recovered a valid session and only its assigned project |
| Build and static checks | Production build, TypeScript, whole-project ESLint and git diff whitespace checks passed |
| Dependencies | npm audit --omit=dev reported0 findings. Full audit retains5 high development-only ESLint-chain advisories; no forced breaking downgrade applied |
| Existing gallery assets | All54JPEGs present and valid:8 trades×3 sectors plus15 floor types×2 photos |
| Screenshots |32 public captures desktop/mobile/tablet/landscape without overflow; portal captures at390×844,844×390 and1440×900 |

The earlier720×450 navigation case represented equivalent layout space only. The completion suite additionally exercised native Chromium tab zoom at100/200/400% with constant outer1440px width and DPR1/2/4 on estimate, provider application and portal:9 measurements, no horizontal overflow. CDP captures without a clip preserve the full physical surface. Mobile/touch is Chromium emulation; iOS/WebKit and hardware-specific behavior remain separate tests.

## Reproducing the local suites

```text
node --import tsx --test tests/*.test.ts
npm run lint
npx tsc --noEmit
npm run build -- --webpack
npm audit --omit=dev
```

Browser scripts require Playwright available to Node. Set TAYCO_PLAYWRIGHT_MODULE to its installed module path if it is not a dependency of this checkout. TAYCO_BASE_URL must point to an isolated local server.

```text
node tests/navigation-accessibility.mjs
node tests/public-content-contract.mjs
node tests/portal-workflows.mjs
node tests/http-certification.mjs
node tests/product-completion.mjs
```

Portal/HTTP scripts require TAYCO_CERT_CONFIG pointing to a private synthetic fixture config. tests/seed-certification.ts refuses an unmarked operational path and provisions synthetic accounts/projects only into that private directory. tests/serve-certification.cjs reads secrets from the fixture file without printing them and clears external delivery settings. Do not point these scripts at an operational database.

The public-content test can write its computed runtime report to the configured private evidence directory. Reports are produced after assertions, rather than copied into a hand-authored passing certificate.

## Evidence locations

Raw executor receipt for the final69test run: JOB_20261023_090417_6800. Final Windows production build: JOB_20261023_084946_3600. Real Docker build: JOB_20261023_085741_3000. Local container smoke/persistence/operator test: JOB_20261023_090351_3100. The executor retains actual command output independently of this summary.

Generated private evidence is intentionally excluded from Git:

- .data/certification/public-identity/public-content-contract-runtime.json
- .data/certification/public-identity/screenshots.json and gallery-assets.json
- Per-run certification-*/http-report.json and restore-report.json
- Workspace analysis evidence/navigation-accessibility.json and portal-workflows.json

Selected screenshots included in docs/screenshots show synthetic records or public pages, not production customer data.

## Remaining release gates

- Docker now builds and runs locally: non-root UID1001, named private volume, session/project persistence across restart, protected CSV and operator backup/hash manifest all passed. This is local Linux verification; verify HTTPS and the chosen production volume on the actual deployment target.
- Provision the real administrator privately, configure HTTPS/session secret and persistent volume, and verify backup restoration on that target environment.
- Verify approved real Blob upload/download/retention and Resend delivery/receipt. Mocked SDK success is not a real provider certificate.
- The notification worker now supports explicit --send --watch operation, resolves an active administrator every pass and defaults to dry-run. No automatic service/schedule has been installed; verify sender, destination and provider acceptance in the target environment before promising alerts.
- Takeoff and accounting adapters remain not configured. Their previous static numbers are archived, not presented as synchronized facts.
- Confirm final company facts, project-photo permissions, privacy wording and retention periods with TAYCO before publication. Existing Git history containing legacy state was not rewritten.
- MFA, SSO, automated mailbox-verified recovery, malware scanning and multi-replica storage are not enabled.

The live work/approval authority remains Soul Ledger project tayco-product-atlas7. This record describes measured local behavior and boundaries; it is not an overall production or legal compliance certificate.

## Completion round · CRM, projects, documents and finance

The extension suite tests six groups against the real isolated production server: coordinator assignment/rejection, zero/null budget and approval provenance, calendar/milestone rules, contact and provider privacy, protected GUI CSV download, document removal/restore/hold/retention, keyboard access and native zoom. Eighteen portal layouts (six sizes across three sections) and nine native zoom measurements passed with zero horizontal page overflow. Final receipt: JOB_20261023_085855_8100. Report: .data/certification/product-completion-final-v4/runtime-report.json, SHA2561502aaa2d6de8199a475471fb492d642e257d86a94256a29a07a6f7305f34ede.

The eight-size navigation/portal regression was also repeated on the final build, including five roles, actual login/logout, same-key retry after a committed but lost response, retained409drafts and approved hours/invoice ledger records. Evidence: workspace analysis evidence/completion-regression/.

The completion browser test uses TAYCO_TEST_CONFIG for its marked private fixture file and TAYCO_EVIDENCE_DIR for generated reports. The script rejects non-local targets, unconfined database paths and non-synthetic identities. No secret appears in its runtime report.

The container script tests an already-created isolated local container named tayco-atlas7-cert-20261023, with a private synthetic TAYCO_CONTAINER_ENV file, the local image tayco-product:atlas7-local-cert and a dedicated volume. It verifies public HTTP, secure-cookie attributes, transaction/idempotency, UID1001, persisted session and zero budget after restart, protected CSV, dry-run worker and SQLite backup/hash manifest:8groups passed. Container report is beside the private fixture file. The temporary container and volume were removed after the test; the local image remains available. It does not certify real TLS or remote providers.

Two verification-only corrections were required: a keyboard selector initially targeted an intentionally hidden honeypot; it now selects visible controls. Playwright screenshots under native browser zoom cropped the physical surface; final zoom images use unclipped CDP capture. The first container check expected wording rather than the actual backup JSON contract; it now asserts verified=true, the two database files and real manifest hashes. These were not product fixes or fabricated passing reports.
