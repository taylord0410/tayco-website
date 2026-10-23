# Account access and operator recovery

TAYCO uses invitation-only accounts. Public role codes and query-string tenant switches do not authenticate anyone. The server resolves the role, company, project assignments and optional supplier ID from the account database on every request. Administrators and internal staff are company scoped; clients and suppliers additionally require assigned project access. Supplier-specific records must also match the account's supplier ID in the ERP data layer.

## Private configuration

Use Node.js 24. The authentication database is `.data/tayco-auth.sqlite` by default. Set `TAYCO_AUTH_DB_PATH` to an absolute persistent-volume path in deployment. Keep the database, SQLite WAL/SHM companions and backups outside publicly served directories and Git. Limit filesystem access to the application/operator identity. This SQLite design supports a single application instance sharing that durable local volume; separate replicas or serverless ephemeral filesystems require a shared database adapter before deployment.

Set `TAYCO_SESSION_SECRET` to at least 32 random characters using a secret manager, and `TAYCO_APP_URL` to the exact HTTPS origin of the site (no path). There is no built-in secret or account. Missing session configuration fails closed. Production cookies are Secure, HttpOnly, SameSite=Lax and expire after eight hours; database expiry and revocation are independently checked. Rotating the secret invalidates existing cookies.

## First administrator

Privately set `TAYCO_BOOTSTRAP_EMAIL`, `TAYCO_BOOTSTRAP_PASSWORD` (12–128 characters), and optionally `TAYCO_BOOTSTRAP_TENANT` (default company ID `tayco_llc`). Run:

```text
node --import tsx scripts/auth-admin.ts bootstrap-admin
```

The command refuses to create a second bootstrap administrator. It never prints credentials. Clear provisioning variables afterwards. No customer or administrator account is automatically provisioned by installation or build.

## Invitations

An authenticated administrator uses `/account` to issue an invitation with the recipient's exact email, role, project IDs and supplier ID where applicable. The 256-bit random token is stored only as a SHA-256 digest. The invitation expires after 48 hours, is single use, and can be revoked before acceptance. The private link is shown only when created; copy it directly to the verified recipient through an approved private channel. **No invitation email is sent by this implementation.**

The URL carries the token in its fragment so it is not sent in HTTP request paths; the login screen removes it from browser history immediately. Email matching alone is not mailbox verification: delivery to the verified recipient is the administrator's responsibility until a verified email provider is configured. Invitations cannot grant an administrator role or another company's access. Existing accounts must use recovery rather than accepting a second invitation.

Administrators also manage existing non-administrator accounts at `/account`: change project assignments, switch between client/supplier/internal roles, suspend or restore access. Project and supplier IDs are checked against actual records in the same company. All access updates revoke every session of the affected person. Concurrent stale updates conflict rather than replacing newer access assignments. The UI/API cannot change administrator accounts, promote someone to administrator, or lock out the signed-in administrator; administrator recovery remains an operator responsibility.

## Password changes and recovery

Signed-in users change their password at `/account`; this revokes every session and requires signing in again. There is no fake self-service email reset. The login help directs users to their TAYCO representative for identity verification.

For an operator-mediated recovery, verify the person using the organization's approved process; then privately set `TAYCO_RESET_EMAIL` and `TAYCO_RESET_PASSWORD` and run:

```text
node --import tsx scripts/auth-admin.ts reset-password
```

All account sessions are revoked. Deliver the temporary password privately; ask the person to change it after signing in. Clear recovery variables afterwards. To revoke sessions without replacing the password, use `revoke-sessions`; to suspend access, use `disable-account`; to restore a suspended account after verification, use `enable-account`, with the same private `TAYCO_RESET_EMAIL`. These are local operator commands, not public HTTP endpoints.

## Safety boundaries and checks

- Mutating auth routes require the exact configured Origin. A missing Origin is rejected; do not disable this check for API consumers.
- Credentials and invitation bodies are size bounded. Failed account access uses generic errors. Rate limits persist in SQLite, with account/global limits to bound password work.
- Passwords use salted Node.js scrypt; session cookie sealing is provided by maintained `iron-session`. Database sessions provide revocation that a stateless cookie alone cannot provide.
- GET responses use `no-store, private`. Auth routes have no email delivery, public registration or seed master account.
- Auth audit rows record account/invitation lifecycle IDs and timestamps, never password/token values.
- Back up both account and ERP databases consistently, with restricted access, tested restoration and a retention policy agreed with TAYCO. This code does not itself encrypt database files at rest or certify legal compliance.
- MFA, verified-email reset delivery, SSO and multi-replica deployment remain separate production capabilities; do not claim them enabled.

Run isolated authentication and access regression tests with `node --import tsx --test tests/auth.test.ts tests/auth-http.test.ts tests/auth-accounts.test.ts tests/authorization-regression.test.ts`. Tests use temporary fixture databases and do not provision real accounts or contact an email service.

References: installed Next.js authentication guide (`node_modules/next/dist/docs/01-app/02-guides/authentication.md`), [iron-session](https://github.com/vvo/iron-session), [Node.js SQLite](https://nodejs.org/api/sqlite.html).

## Additional administrator through a private operator

`bootstrap-admin` still refuses a second bootstrap administrator. When another administrator is explicitly approved, privately set `TAYCO_ADDITIONAL_ADMIN_EMAIL`, `TAYCO_ADDITIONAL_ADMIN_PASSWORD` and **explicit** `TAYCO_ADDITIONAL_ADMIN_TENANT`, then run `node --import tsx scripts/auth-admin.ts add-admin` in the approved private operator environment. It requires an existing active administrator in that same company, rejects any normalized email collision without changing that account's role, and audits the operator action with no impersonated actor. No public HTTP route, invitation or GUI promotion grants this capability. Clear the provisioning variables afterwards and hand over the temporary password privately. This does not enable self-registration or automatic administrator invitations.

On the Railway review container the web server runs UID1001. A privileged SSH operator should drop to that same UID/GID before provisioning so the SQLite/WAL companions remain owned by the application. Do not provision root-owned database files into a running application volume or infer ownership recovery from a health200.
