# Private source upload adapter — design PU-1

Status: design only. No new upload route, store, operator command, document, grant or deployment is implemented by this document. The implementation belongs to T57; cloud transfer verification belongs to T60.

## Purpose and existing boundary

A TAYCO operator needs to transfer a large private source file in bounded chunks, recover a lost response and know whether the exact bytes were stored. The operator then submits that stored source to the existing source-admission process. A stored file is not a published document, approved drawing, registered project, approved measurement or guest grant.

Reuse the transport intent of PR7 head 7916089177d09f37272f89fd792734f43e77cc89, reviewed in pr7-integration-review.md. Extract it into the existing Next application. Do not mount its standalone server, HTML, invitation system, bearer-token authority, signing URLs or cookie policy.

Current integration points:

- lib/auth.ts: requireActor and the exact persisted-request capability revalidateRequestActor; administrator role only for this operator transport.
- lib/erp.ts: tenant-scoped durable operation metadata, transactions and essential audit.
- lib/document-lifecycle.ts and app/api/documents/[id]/route.ts: existing document access and removal semantics. This transport does not change them.
- The existing source-registration planner maps verified source identity to reviewed project/document bindings. Upload completion must not call legacy project restore, register a document or create a grant.
- The existing ordinary Blob upload remains a separate supported path. Do not silently replace it or treat a local quarantine receipt as a Blob pathname.

## Flow

Manual diagram, design revision PU-1; not generated runtime evidence.

~~~mermaid
flowchart TD
  A[PU01 Existing operator login] --> B[PU02 Reserve upload with stable request key]
  B --> C{Persisted admin, tenant, quota and metadata valid?}
  C -- No --> X[Private bounded error; no file publication]
  C -- Yes --> D[PU03 Status: committed offset and immutable deadline]
  D --> E{Stored receipt already exists?}
  E -- Yes --> R[Return the same receipt; zero new bytes or grants]
  E -- No --> F[PU04 Read one bounded chunk]
  F --> G[Revalidate same session, owner, deadline and lease]
  G --> H{Exact accepted offset already committed?}
  H -- Yes --> I[Verify identical stored range; ACK existing offset]
  H -- No --> J[Validate next offset and expected final size]
  J --> K[Recover only own uncommitted tail; write and fsync]
  K --> L[Commit chunk identity and offset; revalidate before COMMIT]
  L --> D
  I --> D
  D --> M[PU05 Explicit finish]
  M --> N[Lease; streaming full SHA and length verification]
  N --> O{Match exact declaration and fresh authority?}
  O -- No --> X
  O -- Yes --> P[Promote private bytes; commit immutable receipt and audit]
  P --> R
  D --> Q[PU06 Explicit cancellation or observed expiry]
  Q --> S[Stop accepting bytes; preserve outcome and cleanup policy]
  R --> T[PU07 Existing source review and admission remain separate]
~~~

No anonymous byte URL or alternate guest session is derived from the SHA. Knowing a checksum confers no access. PU07 must continue to use current project/document/recipient guards before any delivery, including GET, HEAD and Range.

## Flow contracts

| ID | Authority, input and result | Durable effect and recovery |
| --- | --- | --- |
| PU01 | Existing login, exact persisted administrator session and tenant; credentials only through private configuration or authenticated request body | Own session only. A cloned Actor is not an authorization capability. No global login or new operator token |
| PU02 | Closed metadata: stable request UUID, expected byte length, lowercase SHA-256 and bounded advisory media type | Tenant/creator/request-key identity. Same canonical metadata returns same upload/deadline; changed metadata conflicts. New upload requires a new explicit key |
| PU03 | Current administrator must own the upload in the same tenant | Read committed offset/status/expiry/receipt. Do not extend the deadline or silently overwrite/truncate a file during a status read |
| PU04 | One bounded raw chunk plus exact upload ID and offset; declared chunk hash must match actual bytes | Exact duplicate committed chunk verifies the stored range and returns the existing ACK. Different bytes, gap or unsupported overlap conflicts. Offset zero never resets an accepted upload |
| PU05 | Exact owned upload, full committed size, fresh session and lease | Stream the full file hash, never read the whole source into RAM. Only matching size/SHA can promote bytes. Persist one immutable receipt; repeated finish recovers it after an unknown response |
| PU06 | Same authenticated owner; cancellation is explicit. Expiry stops new mutation | Never remove a user original or another upload. No automatic deletion of stored/admitted sources. Private staging cleanup must be bounded and explicit; history remains |
| PU07 | Existing independent source review, exact mapping/pins and current access policy | Not invoked automatically by finish. No project, estimate, document approval or recipient grant is inferred |

Every operation revalidates the same persisted administrator identity after body/file reads, asynchronous waits and database locks. Mutations recheck immediately before file effects and SQL COMMIT. A valid old cookie is not a substitute for a current role/session. Cross-tenant or non-owner upload IDs return a private denial without file metadata or paths.

The upload ID and storage paths are server generated. Client filenames and labels are not filesystem paths or audit text. No raw path, credential, cookie, arbitrary URL or document content is returned in errors or recorded in audit metadata.

## Initial limits and states

These are proposed server limits for implementation and tests, not measured deployment capacity:

- Maximum file: 1 GiB; maximum raw chunk: 1 MiB. Reject oversized input while streaming, including requests without Content-Length.
- Maximum unfinished uploads: 8 per creator and 16 per tenant.
- Maximum accounted bytes per tenant: 2 GiB, including reserved unfinished bytes and stored quarantine bytes. Deduplicated bytes must not be double-reserved or lose accounting on retry.
- Upload mutation deadline: four hours from reservation, immutable on retry/status/login/finish. This is an upload lease, not a guest review grant.
- Status and existing stored receipt recovery can report an already committed outcome under current operator authority. They do not reopen an expired upload or authorize file delivery.
- States: reserved, uploading, finishing, stored, cancelled, expired and corrupt. An unknown client response is not a new server state or proof that the operation rolled back.
- Only one writer/finisher lease may mutate a given upload. Use durable version/lease checks; an in-memory mutex alone does not survive process restart.
- No background cleanup service or monitor is introduced. Quota bounds remain effective when an upload expires; expiry is not a claim that physical bytes were erased.

A content type is advisory transport metadata. Size/SHA verification does not validate a PDF, ZIP structure, drawing revision, commercial association or distribution rights. Parsing, containment and source admission remain their existing separate checks.

## Filesystem and SQL failure seams

| Observed failure | Required safe result |
| --- | --- |
| Response lost after committed chunk | Status shows committed offset; exact retry ACKs it without appending twice |
| File has an uncommitted tail after failed SQL update/crash | Status reports recovery needed. A fresh authorized mutation with an exclusive lease may truncate only its own uncommitted tail to the durable offset |
| File is shorter than a previously committed range or that range changed | Mark/reject corrupt; no success ACK or silent repair of committed data. A replacement is a new explicit upload |
| Finish response lost after receipt COMMIT | Same finish/status returns the same immutable stored receipt |
| Bytes promoted but receipt transaction failed | Unpublished prepared bytes may remain. Retry verifies exact identity before adopting them; an orphan is not a published document |
| Session/role/tenant/owner invalidated during body/hash/lock wait | Stop mutation/ACK; rollback SQL. Any prepared private bytes remain unreceived and inaccessible through guest/document delivery |
| Quota/start/receipt race from two processes | SQL uniqueness and durable leases select one outcome; no double accounting or conflicting offsets |
| Expired, cancelled or wrong-hash upload | No promotion or new document. Return a closed bounded status; preserve audit/history |
| Process or power loss | Recover only from observed metadata and verified bytes. fsync/rename tests do not establish power-loss certification |
| Symlink, reparse path, unexpected hard link or path escape | Reject before file mutation. Create/open only server-generated private paths; preserve host-specific test skips honestly |

Use a private absolute runtime root outside public, Git metadata and generated build output. Guard parent components and resolved containment; reject unexpected links and preexisting corrupt files. Do not claim protection against an administrator of the host who can replace the process, its private directory or its database. All temporary files, path errors and fixture data stay outside Git and production build traces.

Use bounded read/write buffers and streaming hash. Holding an ERP transaction across an asynchronous network read or full-file hash is forbidden. Revalidate after IO; use short synchronous commit sections and durable leases. Essential audit and offset/receipt metadata participate in their transaction. Never record a successful terminal event before its effect is durable.

## Reuse decision and antiflows

Two implementation paths exist: reuse the configured Blob provider for ordinary uploads, or add an operator-only quarantine transport on the existing application/private volume. PU-1 selects the latter for local private source intake; it does not replace the provider.

The choice supports offline synthetic failure tests, large-file preparation and existing administrator identity without enabling another service or invitation system. Its costs are explicit disk quotas, lease/crash recovery and volume/deployment verification. The provider path remains appropriate for existing ordinary document uploads; remote provider effects require their own integration evidence. This decision does not certify Railway volume size, request limits, replicas or throughput.

Flow review:

- A retry must reconnect to the same upload instead of starting another implicit operation.
- An ACK describes the committed range, not human receipt or publication.
- A stored receipt means exact bytes were preserved, not that they are admitted or visible in the console.
- A SHA is identity, not authority. No PR7 /go or /d route is carried into this transport.
- A new account/session must not inherit another creator's unfinished upload.
- A browser closing, offline timeout or aborted response cannot be presented as deletion or rollback.
- Resource pressure must produce an explicit quota/lease error, not a fallback to a public file or new service.

## Surface parity and verification plan

All surfaces below are planned, not implemented or verified by this design.

| Flow | Surface | Planned contract | Evidence required before claiming that surface |
| --- | --- | --- | --- |
| PU01–06 | Internal server module | Existing Request authentication, exact revalidation, quota/state/lease/streaming store | Real persisted synthetic accounts; role/tenant/owner denial; lost ACK, duplicate/different chunk, parallel writers, expiry, corruption, SQL/file faults and session invalidation during waits |
| PU02 | POST /api/source-uploads | Same-origin administrator reservation; closed JSON and idempotency key | HTTP auth/origin/body limits, conflict/duplicate/quota and unchanged deadline |
| PU03 | GET /api/source-uploads/[id] | Owned status/committed offset/receipt; private no-store, no paths | Restart/resume, foreign tenant/owner denial and no metadata leakage |
| PU04 | PATCH /api/source-uploads/[id] | One bounded raw chunk with exact offset/hash | Delayed/unbounded body, exact retry after lost ACK, gaps, overlap, revoked session and simultaneous writers |
| PU05 | POST /api/source-uploads/[id]/finish | Verified exact bytes and immutable stored receipt | Streaming large synthetic file, wrong size/hash, finish retry and promoted-bytes/SQL-fault recovery |
| PU06 | DELETE /api/source-uploads/[id] | Explicit cancel of own unfinished transport; no original/approved-source deletion | Lease race, already stored/expired status and only own staging touched |
| PU01–06 | scripts/upload-private-source.ts | Private operator client using existing auth; streaming bounded reads/status resume; credentials only environment | Actual CLI interruption/restart, lost ACK, exit codes/redacted errors and exact byte proof |
| PU07 | Existing source intake/console/document gateway | Unchanged separate planner/commit and delivery scope | No automatic registration/grant; unadmitted/hidden known-SHA bytes remain undeliverable |
| PU01–06 | MCP | Not exposed: use existing authenticated CLI/API tooling | No new MCP service or bypass authority |
| PU01–06 | GUI | No new GUI: operator transport only; existing console remains the single document/review interface | Do not claim a new browser uploader. Existing ordinary uploader remains unchanged |
| Remote transfer | T60 / deployment owner | Separate approved review deployment and real large-file verification | Exact deployed revision, private volume/replica limits, actual transfer/resume/hash and current authorization before any publication |

Implementation order: private store/recovery first; authenticated HTTP adapter second; operator client and local end-to-end transfer third. Each step closes its own failure probes before the next. T57 remains pending until its local transport contract is exercised; T60 remains the distinct cloud/deployment lane. No diagram or local test closes recipient selection, release approval or a Railway transfer.

## Deployment assumption

The proposed file/SQL protocol assumes that cooperating application processes share the same private filesystem and metadata database. It is not cross-host storage consensus. T60 must verify the actual volume and replica topology before deployment; separate replicas with independent disks cannot share an upload merely because their URLs match. Local process-concurrency tests do not certify that remote topology.

## T82 core implementation boundary

The internal store uses real Request authentication and an exact persisted administrator session. It adds no HTTP route, UI, CLI, source admission or download capability. `TAYCO_SOURCE_UPLOAD_ROOT` is an explicit private absolute operator path; its binding is retained in each reservation. Changing that path requires reconciliation rather than migrating an upload silently.

Cancellation commits a `cancelling` intent before deleting its own unfinished part. A later SQL failure therefore cannot reopen a file that has already been removed. The intent is recoverable after the durable lease expires; status never claims that a failed cancellation succeeded. Sealed prepared bytes left after a failed finish are held for verified finish recovery or operator reconciliation; cancellation cannot remove them. Expired retained bytes continue consuming accounted storage.

Chunk effects run synchronously within a short SQLite write transaction, which serializes writers sharing that database. Full hashing uses a renewable durable lease, 64 KiB reads and no open SQL transaction during asynchronous IO. Lease checks within a final SQL transaction do not start a nested renewal transaction. An expired lease cannot authorize the prior worker to commit.

A duplicate committed chunk is compared with both its recorded digest and actual bytes. A stored finish replay streams and verifies the sealed file before returning the original receipt. Status is a bounded metadata/size observation; it does not recompute the full digest. Unfinished states explicitly report `not_verified`. A stored receipt means size and SHA-256 verification only; source registration and release remain separate.

Focused tests use newly created synthetic auth/ERP databases and persisted sign-ins, including separate OS processes sharing the synthetic database and private directory. They do not copy production data, create real invitations, change the OS clock or certify power-loss recovery. HTTP delivery and operator CLI behavior remain T83/T84.

## T83 HTTP adapter contract

The existing Next Node runtime exposes only the PU-1 transport operations. Reservation accepts closed JSON (`requestKey`, `expectedBytes`, `sha256`, `mediaType`) up to 4096 bytes. PATCH accepts `application/octet-stream`, canonical decimal `Upload-Offset` and lowercase SHA-256 `Upload-Chunk-SHA256`, with at most 1 MiB of actual bytes. Query parameters are rejected. Finish and cancellation require an empty body. Status GET/HEAD return owned metadata only; there is no binary GET or admission operation.

Each supported request authenticates the current persisted administrator; mutations require the configured exact Origin and reject cross-site Fetch Metadata. Owner/tenant and persisted session guards remain in T82. A bounded internal Request carries the operation abort signal into core IO and final transaction checks. Response cancellation or a lost ACK does not assert rollback of a previously committed effect: inspect owned status before retrying.

The adapter counts actual bytes, checks any supplied Content-Length against both the limit and the completed body, and rejects non-identity Content-Encoding. It never waits indefinitely for an underlying stream's cancellation promise. A cooperative 60-second operation deadline and caller abort terminate pending reads; synchronous OS stalls are not preempted. Dynamic route-parameter rejection is observed immediately so an early private error cannot become an unhandled promise while authentication awaits.

Rate budgets use the existing persisted AUTH rate limiter's 15-minute window: control 600 per actor / 2400 per tenant, chunks 4096 / 16384. Retry-After is a bounded conservative interval. Local in-flight admission allows four requests per actor and eight per tenant and releases on every outcome; that memory bound is per application process, not distributed consensus. Durable storage quotas and leases continue sharing SQL across cooperating processes.

Success and failure use closed JSON and private/no-store, Cookie variance, nosniff and same-origin resource headers. Errors never echo exceptions, filesystem paths, cookies, payload bytes or Location; unknown faults become generic 503. Stored metadata does not enable the existing document reader to serve an unregistered upload, including when its SHA is known.

Handler probes use fresh synthetic persistent accounts/DBs and a four MiB synthetic transfer. These are not CLI/network, Railway/proxy, full file-limit throughput or power-loss certification. T84 owns the operator client and larger local end-to-end transfer; T60 owns deployment topology and actual remote transfer.
