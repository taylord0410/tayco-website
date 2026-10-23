# Private data operations

Use a persistent private volume and one application instance. Defaults are .data/tayco-auth.sqlite and .data/tayco-erp.sqlite. An overridden TAYCO_ERP_DB_PATH also places upload-intents beside that database.

## Legacy recovery

The original .tayco_erp_suite_state.json was backed up byte-for-byte before future tracking was removed. The verified original SHA-256 is ccee93a9123764398e3d4788ea2f1c681f5d1ecc042885647401c01424e0a007. The working source remains unchanged. The original preview files were moved into .data/legacy-astro-preview and verified against a private manifest; old public URLs now pass through authenticated access.

scripts/migrate-legacy.ts validates JSON, verifies a private backup and inserts the unmodified payload into legacy_archive, keyed by hash. It is repeatable and creates no operational project, phone, quote or approval. Review legacy records privately, identify their actual company/project/source and only then import validated values. The archive is preserved; this repair does not certify the truth of previous fixtures.

## Backup and restore

1. Put the service into maintenance and stop all account/ERP writes. Keep the volume mounted.
2. Set TAYCO_BACKUP_DIR to a new private directory, and run node --import tsx scripts/backup-data.ts --maintenance-confirmed.
3. The tool uses SQLite backup, checks both resulting files and writes a SHA-256 manifest. It refuses overwrite and missing databases.
4. Also retain upload intent journals, approved configuration/secret references and Blob objects according to the agreed policy. SQLite snapshots alone do not back up remote files.
5. Restore into a new isolated private directory first, verify hashes/integrity and exercise authorized project/session access before replacing an operational volume. Stop the service during replacement. Keep the previous volume until the restoration is accepted.

The local restore test validates committed WAL state, valid zero/empty values and rejection of partial/overwrite backup. It does not certify production volume recovery.

## Uncertain uploads

A private intent is durably written before a Blob request. On a confirmed registered receipt it can be removed. On uncertain network/storage results it remains.

Run node --import tsx scripts/reconcile-uploads.ts for counts only. Registered objects are kept; fresh intents are deferred; unregistered intents older than24hours are candidates. --apply performs deliberate cleanup. Never delete an intent by assumption after an uncertain remote write. The dry-run is tested; actual provider deletion must be exercised separately in an approved test store.

## Notifications and integrations

Public requests and notification outbox entries commit together. The administrator's Activity delivery action handles configured Resend alerts. It does not send private attachments. Jobs retain a reference if the provider fails; lease fencing prevents a delayed worker from overwriting a newer attempt. A stable provider idempotency key is reused only within the safe retry window. Review needs_attention jobs against provider receipts before resending manually.

No automated schedule is installed by this repository. Takeoff/accounting adapters remain not configured. Their credentials, scope, endpoint contract and real provider evidence must be agreed before enabling them.

## Document lifecycle operations

`TAYCO_DOCUMENT_RETENTION_DAYS` is absent by default: physical deletion is disabled. An explicit per-record policy can override it, including disabling deletion. `TAYCO_DOCUMENT_NOTICE_DAYS` defaults to30 UTC calendar days as a business reminder; this is not a prescribed legal retention period.

Review, expiry, access removal and physical deletion are independent states. Only approved active documents enter renewal scanning. Pending/rejected documents are never promoted to approved by a scan. A changed expiry supersedes older notices.

From the private operator environment, set `TAYCO_DOCUMENT_MAINTENANCE_TENANT_ID` explicitly:

```text
node --import tsx scripts/document-maintenance.ts list
node --import tsx scripts/document-maintenance.ts scan
node --import tsx scripts/document-maintenance.ts purge --id DOCUMENT_ID --version CURRENT_VERSION
```

The first command inspects policy/status. Scan records deduplicated portal notices and outbox events; it does not send email. Purge is dry-run unless `--apply` is explicitly added after review. The GUI requires administrator confirmation for permanent deletion.

A preservation hold prevents purge. Expiry alone never deletes a file. Removing access immediately denies new downloads and leaves a restorable tombstone until a physical deletion attempt starts. An uncertain storage result remains unavailable, with a durable attempt record; restoration is blocked because the object may already be gone. Retry/reconcile the same object or arrange a replacement. Bytes already received by a downloader cannot be recalled.

A confirmed purge removes the storage path but retains the audit/tombstone. Backups may retain previous copies under their separate agreed policy. This repository does not choose a legal retention period, erase historical Git content or certify deletion in a real provider merely by passing network-disabled SDK tests.

See [notification operations](notification-operations.md) for dry-run and managed background processing. No external delivery or recurring service is installed by these instructions.
