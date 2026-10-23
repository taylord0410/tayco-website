# Railway review deployment

The review lives in the existing TAYCO Railway project, in a separate `product-review` environment and `tayco-review` service. The existing production service remains unchanged. Its public URL is https://tayco-review-product-review.up.railway.app ; operational records remain behind invitation-only account access.

- One replica; a private Railway volume at `/app/.data` holds both auth and ERP SQLite databases. Do not scale to separate replicas without replacing the database adapter.
- Exact HTTPS TAYCO_APP_URL and a fresh random session secret are service variables. Credentials never belong in this document or Git.
- `railway.json` chooses Docker and `/api/health`. Readiness checks configuration and database accessibility, returns only a generic ready/unavailable result, and is not a backup/restore certificate or an authentication check.
- Railway volumes are mounted root-owned. Following [Railway's volume permissions documentation](https://docs.railway.com/volumes#permissions), RAILWAY_RUN_UID=0 permits the small startup launcher to assign the private mount to UID1001. The launcher then drops groups/GID/UID before loading Next; the web server itself runs unprivileged.
- The source package is an explicit allowlist of application source/configuration and public company assets. Local .data, .env, SQLite files, test fixtures, certification screenshots, legacy Astro archives and operational client records are not uploaded with source. Docker also excludes these development archives.
- No existing customer database is copied automatically. Missing data remains empty/unknown. Administrators require explicit private operator provisioning; preparing a local login file or setting bootstrap variables does not create an account. Login details stay in the operator's private local directory until actual provisioning and access verification.
- Blob uploads, external notifications, accounting and Takeoff remain unavailable until separately configured. No email provider or notification worker is enabled by deploying this review.

Use [account operations](auth-operations.md) to provision or recover the administrator through the private operator environment. Clear bootstrap variables after provisioning. Never write a bootstrap password into a command argument, image layer, build log or README.

Release evidence must identify source commit/package manifest, deployment and image, health and anonymous guards, authorized account navigation, and a saved session surviving a restart on the same volume. A successful build/upload alone is not a healthy deployment. Before using the review for customer operations, set the final operator accounts, retention/backups and provider contracts and exercise restore on an isolated volume; this preview does not certify those operations.

The launcher ownership step is intentionally limited to the new default private mount directory. It does not recursively chown restored DB/WAL files or arbitrary configured paths. Restore or custom-path operations must validate ownership as UID1001 before starting the application. The readiness query does not establish schema completeness, data validity, durable persistence or a successful business write; the restart/session observation supplies only its own bounded persistence evidence.

The installed Railway CLI warns that `railway.json`/TOML config-as-code is deprecated and remains supported until2026-12-01. This release keeps its explicit Docker/readiness settings, with named service settings verified independently. Migrate to the documented `.railway/railway.ts` IaC workflow before that deadline; no migration is claimed by this deployment.
