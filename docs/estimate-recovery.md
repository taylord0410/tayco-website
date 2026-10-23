# Recover estimating projects without losing their business phase

A stored estimate is real project information when its provenance is established. Its amount may be displayed, compared and broken down without a live integration. It must remain distinct from approved contract value, execution progress, invoices, payments and certified payroll.

## Private operator recovery

`scripts/import-takeoff-estimate.ts` reads the Takeoff active-scenario JSON, executive BOQ's inert JSON/table payload, and APU JSON. It never executes the HTML report or contacts an external service.

Set these privately for the operator process:

| Setting | Purpose |
| --- | --- |
| TAYCO_ESTIMATE_SOURCE_ROOT | Absolute private Takeoff project root |
| TAYCO_ESTIMATE_ARCHIVE_DIR | Absolute private byte-archive destination |
| TAYCO_ESTIMATE_ADMIN_EMAIL / TAYCO_ESTIMATE_ADMIN_PASSWORD | Existing active administrator; never put these in commands, Git or chat |
| TAYCO_SESSION_SECRET | The deployment's existing session secret |
| TAYCO_AUTH_DB_PATH / TAYCO_ERP_DB_PATH | Intended persistent company account and ERP databases |

```text
node --import tsx scripts/import-takeoff-estimate.ts --project=<source_slug>
node --import tsx scripts/import-takeoff-estimate.ts --project=<source_slug> --apply
```

The first command inspects. The second authenticates an administrator, archives and hashes the exact source bytes, recovers the project and records each estimate revision. Files are size-bounded before allocation; project, schema, currency, calendar dates and cents are validated. Re-running preserves existing revisions and rejects rewriting the same source identity with different amounts. A partial interruption can be recovered by re-running; success is emitted only after all requested source revisions are recorded.

The source types remain separate:

- Scenario: selected estimating parameters and its own total/date.
- BOQ: exported cost divisions and its own total/date.
- APU: source cost packages plus independently reconciled material, labor and equipment tiers.

Different totals are preserved and explained in the interface. No automatic contractual winner is chosen. A breakdown is graphed as reconciled only when its explicit cent sum equals that revision's declared direct or bid basis. Empty or malformed monetary cells never become zero; explicit zero remains valid.

The import creates no invoice, payment, tax filing, project completion or approved budget. Recovered execution progress is unknown until a team member records it. Estimate records are currently team-only; project assignment alone does not expose internal estimating data to a client or provider. The client-facing dossier remains conservative and separate.

## Local review and verification

Real recovered estimating data use a separate ignored `.data/review-*` directory, not a certification fixture. `scripts/serve-private-review.cjs` accepts `TAYCO_REVIEW_CONFIG`, requires confined database paths and an explicit local HTTP port, keeps genuine authentication enabled and clears external delivery credentials. It prints no credentials. It is a local review launcher, not production provisioning.

The synthetic GUI and domain suites use isolated `.data/certification-*` databases and invented fixture amounts. Real customer source bytes, account secrets, cookies and imported estimates never belong in Git, screenshots committed for public documentation or public marketing. Source metadata and business-phase labels are retained in the authenticated workspace.
