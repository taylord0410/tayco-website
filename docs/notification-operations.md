# Notifications and unattended operation

The website saves intake and its outbox together. A confirmed request reference does not mean an email was received. The historic outbox status `delivered` means the provider returned an acceptance ID; it does **not** certify inbox delivery or a read receipt. Provider acceptance IDs are retained in `notification_receipts`.

## Private configuration

Use the same private persistent auth and ERP databases as the app. Configure:

- `TAYCO_NOTIFICATION_ADMIN_EMAIL`: an existing active administrator. The worker re-resolves the account every pass; disabling it stops processing.
- `TAYCO_NOTIFICATION_TENANT_ID`: company routed to this recipient. Defaults to `TAYCO_PUBLIC_TENANT_ID`, then `tayco_llc`. Another company's administrator cannot send through that destination.
- `RESEND_API_KEY`, `TAYCO_NOTIFY_EMAIL`, `TAYCO_EMAIL_FROM`: verified provider settings, never public browser environment variables.
- `TAYCO_NOTIFICATION_INTERVAL_SECONDS`: 15–3600, default60.

No credentials or recipient addresses are printed by the CLI. Do not pass secrets as shell arguments or commit a configured environment file.

## Inspect first

```text
node --import tsx scripts/notification-worker.ts --dry-run
```

Default is dry run. It reports configuration state and queue counts, without scanning new notices or calling a provider.

After an operator approves real delivery:

```text
node --import tsx scripts/notification-worker.ts --send
node --import tsx scripts/notification-worker.ts --send --watch
```

Run a single managed worker alongside the web service with a restart policy and the same private volume. No recurring job or service is installed merely by checking out this repository. Leases and attempt fencing handle an overlapping/restarted worker without allowing an old response to replace a newer attempt.

## Recovery and attention

- Provider rejection or a missing acceptance ID leaves the event retryable; it never confirms delivery.
- Retries use the same event key. Events outside the bounded retry window or with invalid dates require operator review; don't create a new key merely to bypass an unknown outcome.
- Before replaying an old uncertain event, inspect the provider receipt privately. The app does not infer non-delivery from a timeout.
- Renewed/deleted documents supersede unsent notices for the former expiry; no private document or attachment is included in email.
- Document scanning records approaching/expired notices in the portal. Email availability is separate from document review and current validity.
- A receipt from a network-disabled transport test proves this local contract only. Actual sender verification and provider delivery must be exercised in the intended environment before promising alerts.

Takeoff, Airtable and accounting remain separate adapters. An absent connector is `not_configured`; a CSV export is a file generated from recorded data, not synchronization with those services.

