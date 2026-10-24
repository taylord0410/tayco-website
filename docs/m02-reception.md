# M02 reception in the existing Takeoff console

The private operator first inspects a package, then explicitly applies its reviewed plan into an existing TAYCO project; the Takeoff tab shows its quantities, evidence, revision history and separate price evidence. It does not create another project, source document, guest grant, approved estimate or financial transaction.

## Flow and boundaries

    Authenticated administrator → pinned M02 preflight → private exact archive
      → revalidate same persisted session → ERP write lock
      → revalidate session + exact existing source bindings
      → insert receipt / bindings / essential audit
      → revalidate session + source bindings → COMMIT
      → existing Takeoff console, administrator/staff review

Preparation failures publish no ERP receipt. A SQL failure rolls back receipt, bindings and audit; an already verified private archive may remain for retry. Source records and grant policies are never rewritten. No public HTTP endpoint accepts paths, caller-authored preparation receipts or measurement writes.

An exact memory-only session capability rechecks the persisted account and session after IO and SQL waits. Cloned Actor objects do not carry it. No asynchronous yield occurs inside the ERP transaction. Guests, clients and vendors cannot read this new measurement projection; existing document and general guest-console permissions remain separate.

## Private operator command

Use the project's existing Node/tsx runtime:

    node --import tsx scripts/import-m02.ts --package=<private-absolute-package.json>

Inspection is the default: it creates neither an archive nor an ERP receipt. Review the exact source/project bindings and returned planHash, then apply that same plan:

    node --import tsx scripts/import-m02.ts --package=<private-absolute-package.json> --apply --plan-sha256=<reviewed-plan-hash>

A changed package or binding conflicts before receipt. For a new revision of an existing package, inspect with the exact current predecessor:

    node --import tsx scripts/import-m02.ts --package=<private-absolute-package.json> --supersedes=<receipt-id>

Configure these private server/operator environment values; do not place credentials in arguments or commit them:

- TAYCO_M02_ADMIN_EMAIL / TAYCO_M02_ADMIN_PASSWORD: persisted administrator credentials.
- TAYCO_M02_INTAKE_ROOT: allowed absolute parent of incoming packages.
- TAYCO_M02_CONTRACT_ROOT: reviewed pinned M02 integration folder.
- TAYCO_M02_BUNDLE_ROOT / TAYCO_M02_SOURCE_MANIFEST_SHA256: original source bundle and trusted original manifest digest.
- TAYCO_M02_ARCHIVE_ROOT: private absolute archive folder.
- TAYCO_M02_PYTHON: optional Python executable; Python, jsonschema and pypdf must already be installed.
- Existing auth/ERP database and Takeoff mapping/relations configuration.

See [integrity and private archive checks](m02-integrity-preflight.md). The helper signs in, requires a real administrator before inspection/preparation, and signs out afterward. Applying a revision also requires --apply and the matching --plan-sha256, with the same --supersedes decision. The plan is recomputed and checked again under the write lock. There is no production bypass or alternate identity.

## Source and receipt identity

Every context/document/PDF must resolve through the current trusted viewer mapping to one existing active project and document in the authenticated tenant. Drawing PDF type, source SHA, source context and approved/current document state are checked. The original bundle/manifest provenance is checked separately from the current delivery bundle/manifest/relations pins. A T72 delivery rebind therefore preserves the original source identity rather than making it disappear. Reference-only documents and lookalike names do not become measurable projects.

The ERP receipt is unique per tenant/package ID/revision. Same payload digest and lineage returns the first receipt with zero new measurements; changed payload or lineage conflicts. Different JSON whitespace may have another archived-file SHA while retaining the original canonical payload identity and receipt. An explicit new revision appends a receipt that supersedes the current predecessor; earlier revisions remain available and are not summed automatically. Producer format M02 is unchanged; predecessor selection is a consumer/operator decision.

Data is stored in dedicated measurement receipt/binding tables. Producer reported verified/candidate/pending/conflicting/rejected/superseded and BOQ inclusion states remain evidence labels, not independent TAYCO approval. Quantities and rates cross the Python/JavaScript boundary as strings. Missing values remain null, and no financial total or installed APU is inferred. Incoming revisions do not overwrite a prior receipt or its private archive.

## Read surfaces

GET /api/measurements?projectId=<existing-project-id> is private, no-store, administrator/staff only. It rechecks current source bindings and the same session before returning. It returns at most 20 receipt revisions, 200 measurements and 200 BOQ lines per receipt, with explicit partial-coverage indicators. It omits archive filesystem paths and credentials. Source PDF controls open the existing protected project reader inside the same console, using the authenticated document/gateway route. Refresh or a changed observation removes the previously opened reader.

The existing Takeoff tab mounts the review panel for team members. It shows receipt time, current/earlier revision labels, producer quantity state, pending reasons, evidence IDs/pages/regions, assumptions and separate price provenance. Refresh drops the prior panel data before reloading. This is not continuous recall of already delivered bytes or independent measurement approval.

## Verification

The receiver probes require the reviewed contract root in TAYCO_M02_CONTRACT_ROOT. Without it the Node intake test explicitly skips; a meaningful local certification run must set it. Tests create their own synthetic packages, PDF, original/delivery bundles, auth/ERP databases and accounts. No private database is copied. Tests exercise real preparation, exact-session capability, existing-project preservation, replay/lost ACK, conflicts, rollback, source changes after INSERT, lineage, role/tenant isolation and session revocation during a held ERP write lock.

Local verification exercises real synthetic reception and console rendering at desktop 1440 and mobile 390: verified/candidate/pending/conflicting producer states, null quantities, separate provisional price evidence, revision labels, evidence expansion and a protected source PDF canvas. A guest receives 403; revoking the synthetic source and refreshing returns 409 and removes quantities and the reader. This proves the local mechanism, not real R3/TMAD receipt, independent quantity review, recipient selection, distribution rights, deployment or publication.

Build artifact inspection found that default runtime database paths were being traced into the generated standalone output. The generated copies were removed without touching originals. The standalone configuration now excludes private .data contents for every route; final artifact checks require zero private trace references and zero private standalone files. Operator input filesystem access is explicitly runtime-only. These checks do not alter runtime database locations or copy a database for backup.

## UTF-8 boundary and source-text recovery

Python preparation explicitly runs in UTF-8 mode with UTF-8 strict stdout, regardless of the host locale. Node captures bytes and rejects invalid UTF-8 rather than silently replacing characters. This applies to inspection and new receipt preparation.

A private operator can inspect a historical text correction using node --import tsx scripts/correct-m02-text.ts --receipt=<exact-receipt-id> --package=<absolute-original-package>.

Use the existing private M02 environment and administrator credentials in environment variables. The default operation is inspection. Application additionally requires --apply --plan-sha256=<exact-reviewed-plan>. Do not put credentials in arguments or output.

Recovery requires the original hash-locked source and an already verified private archive, current document bindings, and the exact persisted administrator session after preparation and SQL locks. It permits only BOQ descriptions and measurement assumptions whose original bytes reproduce the witnessed legacy Windows-1252-to-UTF-8 loss. Any unrelated difference in quantities, prices, IDs, roles, evidence or structure conflicts. Unicode that could not have traversed that legacy encoding is not guessed.

The operator appends a bounded text overlay and measurement.text_corrected audit entry in one ERP transaction. It retains the original receipt row, raw archive, reception time and decisions. Repeating the identical correction returns the original correction timestamp and creates zero rows. A different correction conflicts. The team projection verifies the original projection hash, source identity, patch digest and original field hashes before applying the overlay; a corrupt overlay fails closed. The console identifies restored text. There is no public correction endpoint and no client-supplied patch API.

This recovery restores source text only. It does not approve quantities, physical scope, procurement models, prices, BOQ inclusion or distribution rights. The original producer states and pending prices remain in force.
