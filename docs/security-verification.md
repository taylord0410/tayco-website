# SG local verification and release gates

Ledger is authoritative:25663B1,25664B2,25665B3,25666B4,25667B5. B1commit1716331;B2ffa3e91;B3460f175;B40e54011. B5adds fault/release verification and fixes found by broad testing. This is a local candidate, not a production certification.

## Implemented

- Trusted ingress and mandatory keys; unknown identity has no localhost privilege or shared punitive bucket.
- Explicit public browsing/assets skip the risk database. Weak browser signals only observe. Optional state work has bounded retention/quotas and lock wait.
- Explicit challenge IDs deduplicate retries/concurrency. Provider errors do not increment failures. Durable form/outbox/quota transactions return the same receipt after response loss.
- Admin review codes bind to the visitor/origin. Investigation grants are single use/short lived/revocable and confer no private account. Ordinary manual recovery resolves only the reviewed incident and creates no debug grant. Old approvals cannot clear a later incident.
- Persisted observation rollback preserves authentication, origin/body checks and idempotency. Operator configuration is the ceiling for enforcement.
- Missing/forged visitor state in enforcement cannot bypass a mutation:428starts a valid browser session and retains the form for explicit retry. Bad origin/type/size reject before database work. Observation does not require risk storage for submissions.
- Removed old fixed-HMAC viewer session bypass and unspecified external upstream fallback. Viewer requests require current account authorization. No upstream/private fetch occurs for anonymous legacy-signature requests.
- Unknown account JSON is validated, canvas export signatures match DOM types, client telemetry does not claim server-authorized reads. Isolated monthly databases follow the existing ERP no-auto-seed contract. No existing guest access duration was changed.

## Reproduction

`node --import tsx scripts/verify-security.mts` runs each test file in a child process with disposable databases and random fixture keys. Raw fixture logs remain in the printed temporary directory; JSON summary contains counts and file outcomes. `node --import tsx scripts/security-preflight.mts` prints configuration booleans only. `--production` checks production requirements against local configuration; it does not inspect Railway.

Build uses a separate.next-security-release directory and isolated databases/keys, with ignoreBuildErrors=false. Source hashes cover the full local working tree, including earlier Home/reference changes preserved outside these security commits. A commit hash alone is not a release source archive for those earlier uncommitted changes.

## Gates requiring external state or human review

- Turnstile keys/domain are not configured or certified. Tests inject provider responses; no real human challenge was completed. Production enabled risk requires explicit absolute guard DB path and single-instance topology contract; enforcement also requires real provider configuration. This contract is not proof of volume persistence or actual replica count.
- Railway trusted-edge isolation/header behavior and real upstream viewer routing must be checked in the target environment before deployment. No production config/deploy/push was performed.
- Browser UI acceptance now exercised in the in-app Chromium browser under the explicit 2026-10-31 authorization. Physical devices, Safari/Firefox, field LCP/INP/CLS and real-provider browser verification remain outside this local acceptance.
- The user explicitly authorized npm audit on 2026-10-31. Registry audits completed: production dependencies have zero reported vulnerabilities. The complete development tree retains 15 moderate alerts, all connected to minimatch3.1.5 in ESLint tooling; no high/critical remain. Follow-up ledger25701 tracks the unresolved development finding. This is not a clean full-tree SCA certification.
- CSP still permits inline scripts. When Turnstile is configured, CSP permits its exact script/frame domain and top-levelCOEP is disabled for compatibility; the private takeoff response keeps its own policy. That conditional browser behavior needs explicit integration review before enforcement.

## Local acceptance exercised 2026-10-31

The current full suite ran from scratch: 80 files,807 tests,803 passed,4 opt-in skipped,0 failed,0 process failures. The skipped M02 intake/text and private-upload64MiB/1GiB probes retain their separate prerequisites; they are not claimed as passed. `security-suite.json` is the current run, not a merged rerun count.

Browser evidence is in `docs/screenshots/security-b5/`. Home was checked at320x568,360x800,390x844,844x390,768x1024,1024x768,1280x800,1440x900,1920x1080: no horizontal overflow, visible42px brand, no normal-browsing guard dialog. The compact guard and security admin were each measured at320x568,390x844,844x390,768x1024,1024x768,1440x900. Primary guard actions fit inside the viewport and stay44px high. These are CSS viewport checks in one browser, not physical-device certification. Files beginning challenge- are earlier pre-fix captures and are not final acceptance evidence.

The live browser exposed two issues: excessive dialog content hid useful actions, and the keyboard loop included descendants of closed details. Compact translucent groups now prioritize Keep editing/Request review; optional investigation and diagnostics collapse. Tab and reverse-Tab stay on visible controls; Escape dismisses the overlay and returns focus to the estimate submit control. The server-rendered notice follows the same spacing/actions. The existing smooth-scroll policy is declared to Next to avoid its route-transition warning. An earlier HMR dependency-array warning occurred while editing the effect; fresh page flows did not reproduce it.

Three document reloads retained zero failed verifications. Four explicit local failed-verification simulations produced challenge1,challenge2,challenge3,blocked4. The lab fraction caps at3/3; details show4 failed. Reset followed by reload returned clear0. This simulation did not complete or bypass a CAPTCHA.

An actual synthetic estimate selected referenceREF-21E21414A177, encountered verification on submit, retained name/scope/reference, requested review, and was resolved in the authenticated admin UI as a legitimate visitor without issuing an investigation grant. Check review status removed the overlay without automatically submitting. A subsequent explicit Send returned durable receipt b3633220-ecf0-450c-8a96-26a6de58da87. The authenticated Website Form Inbox showed exactly that request, image and ID; its reference preview opened. Anonymous security administration showed sign-in instead of incident data. The form values and accounts were created only in `.data/security-review/` isolated local databases. The portal also renders existing bundled corporate content; it is not all synthetic. No external notification delivery is claimed.

Current guard-only microbenchmark:200 samples/mode, offp95=.004ms,observep95=.013ms, observe max=.152ms. The earlier baseline remains in security-foundation-baseline.json. The regenerated security-fast-path.json replaces an obsolete copied baseline receipt. Public bypass is separately exercised against an unusable risk database. These timings exclude HTTP/rendering and do not certify Web Vitals or Railway latency.

## Dependency decisions and remaining limits

The first complete audit returned17 alerts (16moderate,1high), while production-only returned0. Updated zod4.4.3→4.6.7 and only typescript-estree's nested minimatch10.2.5→11.0.3. Scoped ESLint passes with this override. Root minimatch3.1.5 remains because ESLint plugins call its CommonJS export as a function; v11 exports an object. A global override or npm's suggested downgrade of ESLint/config would risk breaking lint. No audit suppression or forced downgrade was applied. The advisory's described optimizer symbols are absent in the installed v3 source, but this observation is not sufficient to dismiss the registry finding. Treat lint patterns/config as trusted local inputs; upstream-compatible remediation remains25701.

Sources: [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249), [zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Raw before/after and production audit responses are retained in verification/. Manifest license checks found no AGPL/GPL/SSPL identifiers; existing sharp LGPL binaries remain and carry their own distribution obligations. The diff secret-pattern check and license metadata check are bounded checks, not legal, SOC2, ISO or penetration-test certifications.

Railway/provider preflight remains a deployment gate: verified trusted ingress, real HTTPS origin, persistent absolute guard volume, actual single-instance topology, and real Turnstile keys/domain. CLI configuration checks/tests do not prove those external facts. Keep risk in observation until deployment acceptance; neither the local enforcement lab nor this acceptance authorizes deployment. This B5 delivery is a local review candidate. No production config, push or deployment was performed.

Final build JOB_20261031_081916_5500:exit0,142.71s,TypeScript enforced,304 source/config/test files unchanged during build. Build source manifest covers the current working tree, including earlier Home/reference changes outside this commit. Final scoped ESLint4files exit0. Diff secret-pattern scan27tracked changed files:0matches; manifestAGPL/GPL/SSPL0. This is a local technical acceptance, with human visual approval still to return through review.
