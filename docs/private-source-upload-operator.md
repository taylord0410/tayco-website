# Private source upload operator (PU-1)

This operator uses the existing Next application and authenticated upload routes. A successful receipt means **stored quarantine bytes / not_registered**. It does not create a document, source, project, grant, measurement, estimate, publication or distribution right. Ordinary document upload remains a separate flow.

## Run

Use an existing persisted administrator account and a trusted application origin. Supply TAYCO_APP_URL, TAYCO_UPLOAD_EMAIL and TAYCO_UPLOAD_PASSWORD through the operator's private process environment. Passwords and cookies never belong in command arguments, journal files or logs. The server must separately configure its absolute private TAYCO_SOURCE_UPLOAD_ROOT.

Examples below contain only paths and public CLI options. Use an absolute source and a private absolute journal path outside public, .next, node_modules and .git.

~~~text
node --import tsx scripts/upload-private-source.ts --file=C:/private/sample.bin --journal=C:/private/upload.progress.json
node --import tsx scripts/upload-private-source.ts --journal=C:/private/upload.progress.json --status
node --import tsx scripts/upload-private-source.ts --file=C:/private/sample.bin --journal=C:/private/upload.progress.json
node --import tsx scripts/upload-private-source.ts --journal=C:/private/upload.progress.json --cancel
~~~

--max-chunks=N pauses after at most N acknowledged chunk operations during this invocation. Resume using the same source and journal. A new upload requires a new journal/request key. --base-url is optional and must exactly match the trusted TAYCO_APP_URL origin. HTTPS is required except for explicit numeric 127.0.0.1 loopback. Redirects are rejected; credentials and the in-memory cookie are sent only to that origin's fixed auth/upload paths.

The CLI prints a closed JSON result or a redacted error code. On interruption or an unconfirmed network result, inspect status before retrying. A failed or unconfirmed logout is reported as sessionCleanup:not_confirmed; it is not evidence of session deletion. SIGINT/SIGTERM requests abort and best-effort bounded logout. No new browser, bearer secret, HTML page or second service is introduced.

## Journal and recovery

The identity journal binds origin, administrator/tenant, request UUID, source byte count and SHA256. It contains no source path, source name, password, email or cookie. Reservation, stored-receipt and cancelled-receipt sidecars are immutable and published without replacement from a private fsynced temporary file. Existing malformed or different records fail closed rather than being repaired.

Committed offset is never cached as authority. Each invocation observes server status; the server compares duplicate chunk bytes and enforces creator, tenant, current persisted session, immutable four-hour upload deadline, lease and quota. Losing reservation ACK can retry the same UUID. A status/cancel invocation with no confirmed reservation sidecar reports reservation_unconfirmed and does not create an upload.

Each operation uses bounded retries. After a chunk error, the client checks the current server offset and cannot reset it backwards. Losing finish ACK retries finish on the same upload; the server rehashes stored bytes and returns the immutable receipt. A new process or server restart does not create a second upload. A changed source, origin, account, binding or stored receipt requires investigation; the client does not overwrite the old journal.

Atomic local publication assumes a cooperating local filesystem. A crash may leave an unpublished private temporary file; it is not a confirmed journal. External mutation of directories/files by another OS principal, network filesystems, host-wide locking and power-loss durability are not certified. A transient unexpected link count fails closed; retry after inspecting the owned journal. The backend separately documents its shared-filesystem/metadata-DB topology assumption.

## Bounds and interpretation

Source size is 1 byte through 1 GiB. Initial full SHA uses a 64 KiB read buffer and fixed open-file identity/size/timestamps. Each request uses at most one 1 MiB source chunk plus one 1 MiB request copy. JSON responses are capped at 128 KiB and journal records at 16 KiB. These explicit buffer observations are not a bound on all V8, HTTP, TLS or operating-system memory. The source is not read into one whole-file buffer.

Authentication cookies remain in process memory and preserve the server's Secure/HttpOnly policy. The explicit numeric loopback transport sends its own cookie header without weakening server cookie settings; browser cookie behavior is a separate concern. There is no claim of heap zeroization.

Server status is a metadata/size observation. A stored finish confirms size and full SHA256 only, not PDF validity, third-party rights, quantities or approval. Known SHA or upload ID does not enable binary download or source admission. Expired/private orphan bytes and quota recovery follow the backend reconciliation contract; the operator does not erase them silently.

## Verification

Client parser tests use a synthetic protocol peer and are not proof of server authentication. The opt-in socket test launches the existing production Next standalone build with newly generated synthetic databases, accounts and bytes. It checks its own child PID, parent, command, cwd and selected port owner before terminating/restarting that child.

~~~text
TAYCO_PRIVATE_UPLOAD_E2E=1
node --import tsx --test tests/private-source-upload-e2e.test.ts
~~~

The test exercises a 64 MiB generated source, pause/server restart/new-process resume, exact final bytes/SHA, a physical TCP disconnect during a partial chunk, discarded real chunk/finish response bodies, concurrent CLI processes, aged synthetic upload expiry and quota exhaustion. The lost-ACK response test deliberately discards response bodies after real headers; it does not claim all response packets were lost. The expiry probe ages only its own synthetic row/journal, never the OS clock or a real grant. It removes only its own synthetic temporary fixture after stopping verified owned children.

Private proof files and logs belong under .data/private-upload-operator-20261024 and stay outside Git. Final results must be read from that directory's ready-checks.json; this document does not substitute for a successful run. Railway/proxy limits, TLS, persistent cloud volume, replica consistency and real private source transfer remain T60 and require their separate release review.
