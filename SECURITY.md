# Security and operational boundaries

Private ERP data requires a server-validated session and company/project/resource authorization. Query-string invite codes and tenant names do not authenticate users. No seed master account exists. See docs/auth-operations.md for provisioning, recovery, suspension and assignment changes.

## Data protection

- Private databases, backups, upload intents and legacy files remain outside public assets and Git. Deploy with a persistent volume restricted to the application/operator identity.
- Project scope is checked on every request. Client responses omit team hours, unrelated suppliers, invitations and other clients' records. Provider responses omit client changes, other users' private notes and client project budgets.
- SQLite transactions, version conflicts and actor-scoped idempotency prevent normal duplicate actions and lost updates. A cached response is reauthorized under current account permissions and current record visibility.
- Passwords are salted with Node scrypt. Maintained iron-session seals HttpOnly cookies; durable database sessions are separately revocable. Production requires HTTPS and a private random session secret.
- Mutations require the configured Origin; JSON and document bodies are size bounded. Authentication and public submission limits persist across server restarts.
- Document receipt, review, approval and expiration are separate concepts. Private downloads check ownership/project visibility. W9/insurance documents cannot be shared with client project viewers through the project-document option.
- Upload intent journals support uncertain remote writes. Reconciliation checks for a registered document before any deletion, defers recent intents and is dry-run by default. Inspect and back up before --apply.
- Notification work is durable and leased. Finalization is fenced by attempt/lease. Provider idempotency uses a stable request key; jobs outside the safe retry age require attention.
- Audit logs contain actor/resource/action IDs and timestamps, not passwords, sealed cookies or full document contents.

## Known deployment requirements

Single-instance local SQLite is not a multi-replica/shared database. Backups of account and ERP databases require confirmed maintenance for consistency between them. Blob objects require their own retention/recovery policy. At-rest encryption, malware scanning, verified email delivery, MFA/SSO, retention periods and legal policy approval are not automatically provided.

Do not run synthetic certification against an operational database. The isolated test server explicitly clears external delivery credentials. Never paste credentials, private documents or .data contents into issues, build logs or chat.

Production dependency audit and local tests are evidence for their recorded scope only. Review remaining development-tool advisories independently; do not force dependency downgrades to obtain a misleading green audit.
