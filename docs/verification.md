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


## Restoration round · executive console, modules and monthly payments

The earlier local certificate did not establish parity with modules it never exercised. The user correctly identified the missing executive console and original business surfaces. This round inventories the original 8 views, 6 modules, 41 subfunctions and 9 commands in [module parity](module-parity.md), with an observed restored/partial/pending status for every row. [Workspace modules](workspace-modules.md) describes the implemented contracts and flow.

- Final domain suite: **86/86 passed**, including dated partial payments, corrections, month boundaries, source/status distinctions, provider/project isolation, invalid imported histories and zero-value settlement dates. Receipt: JOB_20261023_094807_1100.
- Final production webpack build and TypeScript passed: JOB_20261023_095648_6800. ESLint app/components/lib/tests passed in JOB_20261023_095951_8600; the final test-only selector correction was checked separately.
- The final isolated production build passed all four module-restoration groups: operations, monthly reporting, roles and responsive layouts. Three equal-scope offers were compared, competitor offers hidden from the supplier, an accepted offer linked to the order, and the order progressed through its five states. Invalid transitions, mismatched offers, missing compliance evidence and unauthorized reads/writes were rejected.
- Monthly GUI/API/CSV tests separated a January invoice from January/February payment entries, exercised partial settlement and retained correction metadata, kept supplier amounts separate and excluded an unauthorized project. The chart has twelve accessible data rows. Dossier GUI download and 401/403/404 boundaries passed.
- **42 layouts** (seven modules by six screen sizes) had zero horizontal page overflow. Keyboard mobile navigation passed. Browser emulation does not certify physical mobile hardware.
- Final generated report: .data/certification/module-restoration-built-final-v2/runtime-report.json, SHA256 673571a674c1ae57a4702f23de6694e66026032cf56bbb0980dbe21a9eb285f3.
- The final production snapshot was independently checked against source invoices and active payments: approvedOutstandingUsd matched the remaining recorded amount; malformed-history exclusion count was zero. Report: .data/certification/final-api-hardening.json.
- The restored console was exercised read-only across five roles and eight sizes, with zero API mutations attempted. The previous portal workflow suite passed real GUI login/logout, retry with the same idempotency key, retained 409 drafts, CRM, shared notes, client change decisions, reviewed supplier hours and explicit dated invoice payments. Reports: .data/certification/console-readonly/result.json and portal-restoration-regression/result.json. Public navigation retained eight-size keyboard/motion checks.

Test diagnostics are retained rather than rewritten as product successes: initial network-idle waits timed out despite readable pages; tests now await loaded content. One read had a transient connection reset, so only read requests gained bounded retry. Restored navigation counts/required labels and the renamed period-specific CSV needed scoped test selectors. Reusing the synthetic fixture exposed an ambiguous global three-offer assertion; it now selects the actual scenario's scope. Mutations did not gain blind retries. An earlier product-completion run failed at the obsolete CSV selector; its original partial log and exit1 index remain in product-completion-restored.

These results certify the named local contracts, not total advanced-module parity. Presentation refinements, detailed procurement/CRM fields, EVM, G702/G703, certified payroll, tax filings, accounting synchronization and live Takeoff remain explicitly tracked in the parity matrix and Soul Ledger. The old local Docker image was not rebuilt for this restoration round; its earlier container certificate applies to its earlier source only. No remote deployment, payment transfer, external email, cloud file or accounting transaction occurred.


The completion regression's CRM and project groups were repeated cleanly against the final build: JOB_20261023_100215_8100, passed:true, .data/certification/product-completion-restored-final-crmprojects/runtime-report.json. Finance, document lifecycle, 18 accessibility layouts and nine native zoom measurements passed in JOB_20261023_095426_6900 on the unchanged UI; its report is product-completion-restored-remaining/runtime-report.json. The final new-module suite additionally re-exercised monthly finance, roles and layout after the backend hardening. Final module suite receipt: JOB_20261023_100101_4400, build ID 2IGJcIWdVEMRkywr9PH65. No test suite remains running.
## Estimate recovery and business workspace refinement — 2026-10-23

This round corrects a content and presentation regression: the original named estimating engagement had legitimate Takeoff sources. The estimating recovery model preserves their archived bytes, hashes, separate revisions and business phase instead of treating every static amount as fictional. Actual customer source files and the private review database remain untracked under `.data/review-*`; synthetic fixtures do not contain customer figures.

- Domain suite: **106/106 passed**, receipt `JOB_20261023_105848_5100`. The subsequent historical proposal sending/decision refinement passed its isolated business-operation regression in `JOB_20261023_110107_4700`.
- Full ESLint passed in `JOB_20261023_105850_0100`; later visual, test and drilldown changes passed scoped ESLint in `JOB_20261023_111238_9500` and `JOB_20261023_111442_7800` plus the test-owner receipts.
- Final integrated production webpack build and TypeScript passed in `JOB_20261023_111440_0500`. Earlier successful builds do not stand in for this final build.
- The persisted model verifies explicit proposal states/dates/evidence, cent precision, unique references, version conflicts, idempotency, role/tenant boundaries and project team membership history. Proposal acceptance creates no invoice, payment, budget or notification delivery.
- New business workflow GUI: **4/4 groups passed**, `JOB_20261023_110822_3600`, `.data/certification/business-workflow-final/runtime-report.json`, SHA-256 `d5e3298251ffe6fdd52146cb45cb35efe70b04c4dc5881427daf976b2ce8a5e2`. Covers three proposal outcomes, historical acceptance, mandatory evidence, terminal-state rejection, team assignment/removal/duplicate protection, financial source drilldown, refresh-state retention, external-role rejection and 15 layouts. Runtime errors: zero.

### Hydration regression and evidence

The first strict estimate GUI run failed because React error **418** rebuilt the executive console. The development component diff identified mixed JSX children inside SVG `title` elements. Single computed text children fix the actual discrepancy; errors are not suppressed. The affected title pattern was also corrected in the monthly finance chart.

The global editorial effect engine no longer appends unmanaged wash nodes, tilts or click-scales operational cards inside the workspace. Focus and CSS hover treatment remain. The production regression tests stable card hitboxes, no added wash layers or transform/scale animations, nonempty server-rendered SVG titles, first load, reload, actual refresh requests and interactive display state across administrator, client and provider roles.

The final CSS-build hydration suite passed **3/3 roles with zero page or console errors** in `JOB_20261023_111718_8000`, `.data/certification/hydration-css-final/report.json`. The prior failed network-idle readiness attempt is retained separately; a pending `/api/auth/session` request made network-idle unsuitable as the readiness oracle. The replacement waits for actual hydration/interactivity and refresh completion while keeping the complete error guard.

The final estimate GUI suite passed all **five workflow groups**, `JOB_20261023_111907_0700`, `.data/certification/estimate-ui-css-final-r2/report.json`: exact cents/revisions, source-tier selection, archive comparison, saved display controls, unknown progress, role isolation, keyboard/touch and reduced motion. Six viewport sizes (1920×1080, 1440×1000, 1280×720, 768×1024, 390×844 and 844×390) had zero page overflow. The `pageErrors` array was empty. This suite used synthetic estimates in the isolated certification database, not the actual customer archive.

Final read-only dashboard/context verification passed in `JOB_20261023_111946_9500`, `.data/certification/business-dashboard-built-final-v2/business-dashboard-report.json`, report SHA-256 `90bbf5f30ffae0a6a89c895a9039fa1f0b60c204bdc946065d46ad4fecead241`. It verifies September issue/decision cohorts, selected-project scope, separate invoice/payment evidence, the dashboard-to-finance September handoff and 17 layout measurements with zero overflow and zero browser errors. Latest test-only changes passed ESLint in `JOB_20261023_112014_3300`.

The actual private review database was checked read-only after GUI certification: one recovered estimating project and five archived estimates; no operational invoices or proposals were inserted, and unknown execution progress/approved budget remained null. Its desktop and mobile presentation was inspected separately in Daedalus. No real credentials or customer source bytes were committed.

These results certify the exercised local flows. They do not certify external provider delivery, real TLS/cloud deployment, bank reconciliation, statutory payroll/tax forms, historical project-state reconstruction, physical mobile devices or authenticity of client measurement inputs. Current project states and monthly dated activity are explicitly different reporting bases.

## Interactive client dashboard and reusable projects — 2026-10-23

Final integrated production build: `JOB_20261023_124336_5400`, exit0, build ID `p3t0jYA_w_P7NAWDDGISL`. Full ESLint passed in `JOB_20261023_124337_1500`. The final domain suite passed **160/160 tests** in `JOB_20261023_124436_5600`; the earlier legacy-export negative fixture was corrected to explicitly omit approval evidence after positive create-project calls gained required provenance. TypeScript also passed independently and as part of the final build. Domain changes are committed in `5b7b78a2cad5c95075999eed75d12d661dbcd3e0`.

Four authenticated GUI suites passed **24 groups** on this frozen build:

| Suite | Groups | Receipt | Local evidence under .data/certification | Report SHA-256 |
| --- | ---: | --- | --- | --- |
| Financial dashboard | 10 | JOB_20261023_124534_3700 | financial-dashboard-final-1792759532124/runtime-report.json | 8b106e5918c758c244adaa7988c1f8e2463c5ca395803722fc4ab6957f1a9330 |
| Module utility | 6 | JOB_20261023_124930_9800 | module-utility-final3-20261023T1250/runtime-report.json | 4c4dc9fd02c36496c34d36d443b5aec425fa5d18c71633cdb3d9687eba72d374 |
| Corporate agenda | 5 | JOB_20261023_124931_1000 | corporate-agenda-final3-20261023T1250/runtime-report.json | 7e3ca20d7ad606cfc1220e4995ec6816996c14359919edba44bb17e18e8ae62c |
| Request recovery | 3 | JOB_20261023_124552_4900 | command-retry-production-final-20261023T1248/report.json | 6bb4dad8d43c15a559895b6c6d41f93ad5100578a112d6408c24fc5c8aa19870 |

Every final suite has an empty browser/runtime error array. Module navigation measured **132 module/viewport pairs** (22 modules, six sizes), and agenda measured twelve expanded functional layouts; page overflow was zero. Financial tests separately measured executive and financial panels at widths320,360,390,768,844 and1440 with zero overflow, touch and keyboard navigation. Daedalus inspection of the private real-data review at1440×1000 and390×844 found no horizontal overflow; mobile month targets measured50×142px after the six-column adjustment. Browser emulation does not establish physical iOS/Android behavior.

The financial GUI verifies twelve interactive months, exact handoff to a historical reporting period, client/provider/internal separation, source-backed plan creation/cancellation, linked-invoice deduplication, explicit proposal percentages and cent rounding, expiry exclusion, evidenced completion without invented invoices and external-role denial. Weekly detail reconciles an actual synthetic dated receipt of2505cents into its exact September7–13 week and selected-month total. The project card states its invoice/payment/completion inclusion sources. Cash movement result is explicitly distinct from accounting profit.

Agenda checks persist meeting and follow-up dates, responsible accounts, notes, priorities and lifecycle history, including reload and negative actions. Corporate modules explicitly show company scope and clear an inherited project filter. The dashboard keeps unresolved expired documents/proposals in Overdue, puts urgent follow-ups before alphabetically earlier low-priority items and makes all six test follow-ups reachable. Calendar days expose their individual source links.

Utility checks preserve CRM sourced estimates including zero, exact ISO-week work-log totals and private CSV/JSON exports, and PO quote/drawing/lead-time fields including zero and seven. A draft with an older record version survives Refresh and a real409; saving waits for explicit discard/load-current. Two newly created independent projects do not inherit financial sources, estimates, progress or team. Blank GUI creation keeps progress/budget unknown and next action empty; budget without evidence fails422 and explicit approved zero with source/date succeeds.

The recovery suite commits a real synthetic mutation, loses its browser response, changes module/project, and replays the exact retained key/body. It observes one record, original receipt version2 and refreshed version3. Busy/uncertain requests hold other writes. Known409 releases the journal without erasing the draft. Private payloads are not stored in local/session storage; closing/reloading the entire workspace is outside this in-memory recovery guarantee.

Earlier failing harness receipts remain retained: detached cancellation form after a successful cancellation, stale fixture selection, API-created sources without GUI Refresh, and readiness based only on server-rendered content/network-idle. Final tests wait for the existing motion effect and an observable Calm/Deep state change before interacting. A weekly run was interrupted by the root intentionally stopping its owned preview to rebuild; it remains overallfailed despite its preceding weekly case passing. None of those attempts is represented as a passing final run.

The actual private review database remained one recovered estimating project plus five archived estimates, with no operational invoices/proposals inserted and unknown progress/budget preserved. Public company identity is centralized configuration; operational dashboard data comes from authorized records. QuickBooks Online/Desktop, real mappings, external delivery, bank reconciliation and the advanced data-dependent parity blocks remain open. This round performs no remote deployment, external email, accounting post or payment transfer.

## Administration shell and product-flow review · 2026-10-23

T38 removes public marketing navigation/footer from the private workspace, account and login surfaces, and from error pages. Known public marketing pages retain them. SiteFrame is presentation routing, not an authorization boundary; page/API authorization remains server-side. The portal no longer reserves the former 64px top gap and its desktop sidebar starts at the viewport top. The source-derived [administration flow map](admin-product-flow-map.md) contains seven diagrams and all 22 module destinations; the [product review](admin-product-review.md) separates useful implemented records from manual handoffs, context loss and unverified branches.

Final production build: `h_xlMVeTRUaefu04rKTke`, receipt `JOB_20261023_131823_7900`, exit 0. Scoped application lint `JOB_20261023_131826_6700` and the new test's lint passed. The shell-only change does not alter domain commands; the previous 160-domain-test evidence remains attributed to its previous source/build rather than being relabeled as a fresh run.

The isolated read-only `tests/admin-surface-ui.mjs` run `JOB_20261023_132628_8900` passed **five bounded groups**:

- JavaScript-disabled DOM at /portal, /account and /login, plus three nested 404 paths: no public header or public footer in the server-rendered document.
- Seven known public pages retain marketing chrome; portrait and landscape mobile menu keyboard open, Escape and focus return pass.
- Seven actual same-document client Link transitions switch public/private chrome in both directions, with a document witness confirming no full reload.
- All 22 internal destinations at six sizes: 132 navigation/focus checks, zero page overflow, zero main top padding/gap and desktop sticky top zero; six explicit GET Refresh receipts.
- Thirty-six account/login role/layout observations plus assigned client/provider navigation and anonymous guards. Account mutation and logout submission are not covered by this read-only test.

The request guard allowed GET/HEAD/OPTIONS only: report `mutationAttempts: []`, `runtimeErrors: []`, 500 observed GET requests. Report: `.data/certification/admin-surface-final2-20261023T1326/runtime-report.json`, SHA-256 `483c591f456570fb9e51a1ba2fba2f7dd279bd37406fa235632c98c3f100cee5`. Test source SHA-256 `c20e311e48663671c4ab368b9d10ec7ebda060480a1bb5ba555fa39dca6fcfe8`. Private fixture reports remain local and outside Git.

Earlier failed receipts are retained. A generic footer selector initially mistook legitimate internal source-card footers for public chrome; that assertion was narrowed to SiteFrame's direct public footer. More importantly, the initial private-prefix policy exposed a real SSR 404 defect: Next can render usePathname as /_not-found. A known-public-page allowlist corrected that behavior, and the final no-JavaScript 404 checks prove the affected document rather than only hydrated CSS. A later test expected an obsolete exact skip-link label; the accessible selector was corrected, without changing product behavior. Failed attempts are not counted as successful final runs.

Root also used **Daedalus instance atlas7** for native clicks through all 22 synthetic module destinations. The retained capture-phase report is `.data/certification/daedalus-admin-navigation-20261023T1316/report.json`; an earlier bubble-phase timing probe was invalid and excluded because React had already updated the state before it captured the click's source. Its warm DOM/frame timings are not API latency or a productivity benchmark. That 22-module pass used the earlier prefix-policy build. A separate final-build Daedalus smoke verified the actual private read-only review at /portal, no marketing links, top zero and no overflow, plus mobile native Open modules / Escape / focus return on the synthetic fixture: `.data/certification/daedalus-admin-surface-final-smoke-20261023T1328/report.json`.

The administration is **not certified as a completely exercised product**. The 24 prior workflow groups and this shell suite establish their enumerated cases only. The map explicitly marks untested effectful/error branches, upload/route-leave recovery boundaries and manual commercial handoffs. VMOF/Aerospace were applied proportionally to administrative record integrity, recovery and evidence; they do not confer aviation/regulatory certification or a production availability/security guarantee. Planned follow-ups are ledger T39 (period/project/record context), T40 (reviewed commercial provenance) and T41 (financial hierarchy/recovery, to split atomically before implementation). No external deployment, email, accounting post, customer-source mutation or payment occurred.

## Project classification and manual requirements · 2026-10-23

T42 adds independent contracting/funding/labor axes and source-backed versioned review history, not automatic regulatory determinations. Existing projects remain unclassified and unreviewed. Requirements retain manual applicability/evidence decisions, with additive category/authority fields; complete/not-applicable still require evidence/date. Public/external project payloads omit internal classification source, reviewer and history.

Domain receipt `JOB_20261023_134224_0400`:167/167, including seven classification groups; TypeScript `JOB_20261023_134221_4400` and scoped lint passed. The intended release also includes separate private additional-admin/readiness changes: combined domain173/173 `JOB_20261023_135318_7800`, full build `JOB_20261023_135603_8200` exit0, full lint `JOB_20261023_135605_2600` exit0. Production-local BUILD_ID `Md7IvZDMDbiTH8rPloU74` identifies that frozen combined tree, not an isolated domain-only build.

GUI `tests/project-classification-ui.mjs`, `JOB_20261023_135905_8700`, passed5/5 groups on that build. Report `.data/certification/project-classification-20261023T1359/runtime-report.json`, SHA256 `aa27af14dd70a06b9a40d7274ba6bda487e5e73cd04fec454da90b5f1e78e068`; test source SHA256 `1888c6e1625c353948de00c302f5fc7e4e60ee978aaebcb0c03710f43d62585f`. It exercised actual synthetic GUI create/edit/filter and persisted seven own records (four projects, one draft proposal for navigation, two requirement records), including one classification revision and an explicit requirement review. No existing customer/account/ACL records were changed; no notification/send action ran.

Cases include Unknown defaults, federal+union and private+federal-funding independence, source review without changing state/progress/budget/next-action, filter counts/clear/empty, and a regression from independent review: an explicit source link to a private project must reset earlier Federal/Union filters while ordinary manual module navigation preserves the user's filters. The project→requirements link retains the exact project, manual category/authority additions and dated evidence review work, and old requirement commands retain General defaults. Assigned external GUI checks cover legacy records and isolation from new unassigned projects; known assigned classification redaction is established by domain tests, not falsely attributed to this GUI branch. Four expanded390/1440layouts had zero overflow; browserRuntimeErrors[]; physical devices remain outside scope.

Root Daedalus also inspected the actual private review project as read-only on the new build: all three axes stayed Unknown, with no guessed classification, and the source-backed estimating archive remained intact. See [classification workflow](project-classification.md). These tests establish the named local mechanisms; they do not certify legal coverage, certification validity, payroll filing or production provider delivery.

## Railway review rollout · 2026-10-23 · access handover pending

Source commit `af87696a7a03634bc0d2bc2f6e18af7f26da31d6` follows classification commit `a636ed5`. The explicit allowlist package contains171 application/config/public-asset files,26723054bytes; its local manifest SHA256 is `d027fcd26fa4bed7363b6a91bb54bc731e88228237b67d57c03d765ddcd7bd7b`. Every packaged source hash was rechecked against the committed working tree. No .data/.env/SQLite/legacy Astro archive/test screenshots or operational customer records were uploaded with source.

Railway project `46647d6c-8b19-405c-bba3-527fbaecd6cd`, isolated environment `product-review`/`622e6931-10df-4287-87dc-9d2a497ee100`, service `tayco-review`/`fa1d78fd-000f-4e31-8da9-b7b962e0c7df`, volume `afc49498-d7aa-4302-be14-dfb126e6108a` mounted at /app/.data. Existing production service/deployment `1a1b8874-3c3f-44e5-b6c4-b2055eed7205` was not replaced. Readiness timeout120, path/api/health, replica1 and restart retries5 were independently set/read through four non-secret ServiceInstance API fields after CLI environment edit returned no changes.

First deployment `6bdf5b21-5042-4c45-9021-a0ff7b2fc77d` failed after repeated fetching-snapshot logs, before visible Docker compile steps. One subsequent upload of the same verified package produced deployment `2268aef8-4d60-48f0-9cd9-dcc63db7c340`, which reached SUCCESS with reported imageDigest `sha256:401c157425df3aea36a2f46bf1419fca80775a0bc433f5dfdd3af5338f32e022`. Build logs showed Next16.4.2 compilation, TypeScript,25static pages and completed runtime copy steps. Deployment logs showed attached volume and Next listening on0.0.0.0:3000. Railway's official status page carried an active incident during this window; this is context, not proof of the first failure's cause.

At https://tayco-review-product-review.up.railway.app HTTP readiness returned200 ready/no-store. Anonymous ERP/session requests returned401; /portal redirected to login. Daedalus atlas7 isolated tab3 observed the remote login form, workspace shell without public chrome and zero horizontal overflow. The local private review remains separately available and unchanged.

**Not yet verified/complete:** the two requested administrator accounts have NOT been provisioned, no authenticated remote admin GUI or post-redeployment session/record persistence has been claimed, and effective web-process UID has not been inspected. User approved those exact accounts/destination; the additional temporary SSH-key registration required by the prepared private operator route was rejected by automatic review pending separate human approval. The generated dedicated local key is not registered; no existing SSH key or profile was changed. No public provisioning endpoint was added. Bootstrap/additional-admin variables are private and will be removed after provisioning; they are not proof that an account exists. The scoped rollout ledger remains verifying until that handover and runtime checks actually finish.


## T43 completion — 2026-10-23

Supersedes earlier pending-access notes: both explicitly authorized review administrators were provisioned and tested by HTTPS (admin role, company scope, session and ERP HTTP200, separate identities). Six temporary provisioning variables were removed. Controlled redeployment a6511210-5770-40f5-beaf-397a6bff80c6 reached SUCCESS; both existing sessions and accounts persisted, application/database UID1001 and build ID remained unchanged, and all provisioning-variable presence checks were false. The unused second test session was logged out and subsequently returned401. The named temporary Railway SSH key was removed, the account key listing returned zero, and its two local files were deleted.

The review contains no copied client business database or fabricated financial records. Runtime evidence is kept locally in ignored .data/railway-review/completion-evidence.json; SHA256 73a3b1c03954fc6139adf368b77da9b53b7788bdce04f067623807caa8efa905. Private access handover files remain local and are not committed or emailed. This closes the review deployment/authentication scope, not certification of every business workflow.


## T44 — Company contracting update (2026-10-23)

The public landing now includes New Contracting Opportunities at /#certifications. Company-supplied information records certifications obtained in late September 2026 and Expansion Start: October 2026. Four centrally configured entries distinguish SAM.gov federal registration, SBE/WBE/MBE/ESBE certifications, federal/state programs and union/private opportunities. No certificate numbers, issuer, expiry, precise September day or project compliance completion were inferred. Corporate copy lives in lib/company.ts and does not seed the ERP.

Production build passed (JOB_20261023_144708_8300); Daedalus reviewed the rendered section at1440x1000 and390x844 with four items, month-level dates, the actual company email link, no horizontal overflow and no clipped section content. This is Chromium mobile emulation, not physical-device certification. Local evidence SHA256 f9e88a7e44e2ce3c62719df756850009c377ac385df7c7efd248222699033d11.


T44 workspace integration: the same central company update is displayed inside Project requirements & certifications (team access), with a compact responsive layout. It is corporate context and creates zero project compliance records. Final production rebuild JOB_20261023_150057_0200 and focused ESLint JOB_20261023_150055_4800 both exit0. Daedalus exercised native module selection and checked four company entries at1440x1000 and390x844; page/section overflowfalse and project-requirement cards0 in an empty isolated test company.


## T44 deployed verification — 2026-10-23

Final shared company update source4cc08b605fe12ec2a2022493a4a794d29429bc32 is deployed in product-review/tayco-review as5bbe5e7a-25f1-4c3e-89b0-2a8611fdcde4 (SUCCESS). Public HTTPS200 rendered all seven expected labels/date values and four program entries; health200 ready. Daedalus reused the original administrator cookie: session200, roleadmin, same actor ID, ERP-suite200 with zero business entries. Native module selection showed the company section with four entries and the two supplied dates. Desktop1440 and mobile390 had no page/section horizontal overflow; zero project requirements were created. The redundant private cookie file was removed, leaving the user preview session and the two private password handover files.

Runtime report .data/railway-review/contracting-deployment-verification.json SHA256 0314e65823c9481ea6c50359d294129371f65d5498a2cc5572f288dfcf5ec2f3. This verifies displayed company information and retained review access, not independent issuance of credentials or project compliance.


## T46 local guest-access verification — 2026-10-23

Dedicated guest SSR/API/component receives only historical management ranges before any ERP snapshot is serialized. Domain/provider and account-administration guards fail closed, including forged project assignments. New HTTP boundaries plus existing auth HTTP/accounts tests passed23/23 (JOB_20261023_154557_2100); production build JOB_20261023_154829_4400 passed. Daedalus exercised nine historical months at1440/390, native January/September selection, no horizontal overflow, absent detailed portal and private sentinels in raw server HTML/RSC. Browser fetches confirmed four protected endpoints403. Reporting periods use the existing UTC financial-calendar convention. Local evidence SHA256 b410dd252eb32078f24bd16b391242fe2bb0fe406bcbb2ed83738cf6a1276b9c.

Activity collection notice is prepared; event delivery/admin review is a separate pending block. This local guest access result is not a cloud certification.
