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
- Browser DOM control reports unavailable. Native Codex window exposes the current local lab, but host Computer Use permission is pending. No new multi-viewport visual acceptance, fieldLCP/INP/CLS or provider-in-browser certification is claimed.
- npm audit was rejected by automatic approval review because it would send dependency-tree metadata to an external registry outside the authorized local scope. No alternative egress was attempted. Dependency CVE audit needs explicit approval; local diff/license/secret regex scans do not replace it.
- CSP still permits inline scripts. When Turnstile is configured, CSP permits its exact script/frame domain and top-levelCOEP is disabled for compatibility; the private takeoff response keeps its own policy. That conditional browser behavior needs explicit integration review before enforcement.

Local suite:80files,803passed,4skipped,0failed after full run plus5affected reader reruns. Raw full-run failure receipts are preserved separately; the scoped correction does not add duplicates to the count. Manual recovery replay was separately exercised after the final assertion update. ScopedESLint25files exit0, and final added reader files are checked separately. HTTP local:Home/estimate/lab/admin-shell200,health200,auth-session/admin-security401anonymous,logo130850bytes. Final HTTP roundtrip with a separate local cookie jar verified weak signalclear,simulationchallenge,duplicateattemptcount1,fourthdistinctattemptblockedstateinobserve,temporarylabexception,private401andresetclear; it did not change the user browser session or save an estimate. Finalbuildexit0,TypeScriptrequired,283sourcefilesunchangedduringbuild. Evidence files in verification/ record local results. Do not mark B5released or globally certified while these gates remain unresolved.
