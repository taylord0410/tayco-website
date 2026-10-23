# Verification record · 2026-10-23

Scope: local repair branch, Node24.14.1, Next16.4.2, production build on Windows. Account and ERP databases used by runtime tests were isolated synthetic fixtures. External Blob/Resend credentials were explicitly disabled in the local certification server. No client account, email, payment or production data was changed.

## Executed evidence

| Mechanism | Observation |
| --- | --- |
| Unit/integration/boundary suites | 44 tests, 44 passed, no skipped cases |
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

The720×450 navigation case represents available layout space equivalent to zoom, not an assertion that physical browser zoom or a real device was certified. Mobile/touch is Chromium emulation; iOS/WebKit and hardware-specific behavior require separate testing.

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
```

Portal/HTTP scripts require TAYCO_CERT_CONFIG pointing to a private synthetic fixture config. tests/seed-certification.ts refuses an unmarked operational path and provisions synthetic accounts/projects only into that private directory. tests/serve-certification.cjs reads secrets from the fixture file without printing them and clears external delivery settings. Do not point these scripts at an operational database.

The public-content test can write its computed runtime report to the configured private evidence directory. Reports are produced after assertions, rather than copied into a hand-authored passing certificate.

## Evidence locations

Raw executor receipt for the final44test run: JOB_20261023_054846_3900. Production build receipt: JOB_20261023_054238_9900. The executor retains actual command output independently of this summary.

Generated private evidence is intentionally excluded from Git:

- .data/certification/public-identity/public-content-contract-runtime.json
- .data/certification/public-identity/screenshots.json and gallery-assets.json
- Per-run certification-*/http-report.json and restore-report.json
- Workspace analysis evidence/navigation-accessibility.json and portal-workflows.json

Selected screenshots included in docs/screenshots show synthetic records or public pages, not production customer data.

## Remaining release gates

- Docker source was updated to Node24, private-volume directories and executable operator tooling. The Docker daemon was unavailable; an actual container build/run was not certified.
- Provision the real administrator privately, configure HTTPS/session secret and persistent volume, and verify backup restoration on that target environment.
- Verify approved real Blob upload/download/retention and Resend delivery/receipt. Mocked SDK success is not a real provider certificate.
- No automated notification schedule is installed. Operator/manual delivery is available; agree and configure unattended operation before promising immediate alerts.
- Takeoff and accounting adapters remain not configured. Their previous static numbers are archived, not presented as synchronized facts.
- Confirm final company facts, project-photo permissions, privacy wording and retention periods with TAYCO before publication. Existing Git history containing legacy state was not rewritten.
- MFA, SSO, automated mailbox-verified recovery, malware scanning and multi-replica storage are not enabled.

The live work/approval authority remains Soul Ledger project tayco-product-atlas7. This record describes measured local behavior and boundaries; it is not an overall production or legal compliance certificate.
