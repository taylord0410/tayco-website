# Product flow contracts · repair revision2

Purpose: preserve TAYCO's identity while connecting information to a user's actual task and authority. Actor types: public prospect, internal staff, administrator, assigned client and assigned provider. Scope is company, project and resource. The progress authority is Soul Ledger project tayco-product-atlas7; this document describes contracts, not live completion status.

## FA · Account lifecycle

```mermaid
flowchart LR
 A[FA01 Private admin provisioning] --> B[FA02 Login or recipient-bound invitation]
 B --> C{Identity and invitation valid}
 C -->|No| D[Generic failure or operator recovery]
 C -->|Yes| E[FA03 Revocable session]
 E --> F[FA04 Server resolves role and assignments]
 F --> G{Company and resource allowed}
 G -->|No| H[Deny without data]
 G -->|Yes| I[FA05 Perform validated action]
 I --> J[Version and transaction]
 J --> K[Audit and result]
 E --> L[FA06 Logout, expiry, suspension or changed access]
 L --> M[Revoke server sessions; sign in again]
```

Access is invitation-only. An invitation never grants administrator authority or another company. Assignment edits are versioned and revoke existing sessions. Recovery is operator assisted until a verified recovery channel is configured.

## FS · Public intake to project

```mermaid
flowchart LR
 A[FS01 Service or gallery] --> B[FS02 Explicit service context and request]
 B --> C{Allowlisted fields, origin and limits}
 C -->|Invalid| D[Keep input and show correction]
 C -->|Valid| E[FS03 Transaction: request and outbox]
 E -->|Failure| F[No confirmed receipt; retry same intent]
 E -->|Commit| G[FS04 Durable reference]
 G --> H[FS05 Team reviews scope]
 H --> I[Create project and assignments]
 I --> J[FS06 Updates, files and change requests]
```

The form preserves original contact fields and calculator assumptions. The budget illustration is not an agreed quote. Public requests are not linked to a demonstration project. Saving and email delivery are separate; worker configuration and retry age are explicit.

## FP · Provider documents and work

```mermaid
flowchart TD
 A[FP01 Public application] --> B[Team review]
 B --> C[FP02 Private account invitation]
 C --> D[Assigned work and own records]
 D --> E[FP03 Bounded private upload]
 E --> F{Confirmed registration}
 F -->|Yes| G[Pending review receipt]
 F -->|Uncertain| H[Retain private upload intent]
 G --> I[FP04 Authorized review]
 I --> J[Approved, rejected or renewal needed]
 D --> K[FP05 Submit own hours and invoices]
 K --> L[Internal review; explicit approval]
```

Tax/insurance documents are not client-facing project documents. Provider views do not contain client scope-change conversations or unrelated private team notes. Uploading does not certify the contents.

## FE · Modification and recovery

```mermaid
flowchart LR
 A[FE01 Explicit form intent] --> B[Stable request key and current record version]
 B --> C[Authenticate and authorize now]
 C --> D{Previously committed}
 D -->|Yes| E[Recheck current scope and visibility]
 E --> F[Return sanitized prior result]
 D -->|No| G[Validate; transactional write and audit]
 G --> H{Revision conflict}
 H -->|Yes| I[Refresh, retain input, review new version]
 H -->|No| F
 F --> J{Browser received reply}
 J -->|No| K[Freeze unknown intent; retry same key]
 K --> B
```

## Traceability and evidence seams

| Flow | GUI / HTTP | Persistent contract | Required evidence |
| --- | --- | --- | --- |
| FA01–FA06 | login, account, auth APIs, private CLI | users, hashed tokens, revocable sessions, assignments | invalid/expired/revoked/single-use, logout, access edit, stale version |
| FS01–FS04 | service query context, three public forms | allowlisted request + durable notification | retry after503/response loss, exact payload, one reference, no fabricated project |
| FS05–FS06 | project workspace / ERP API | project-scoped records and versioned changes | two clients, cross-company denial, provider isolation |
| FP01–FP04 | provider application, upload and download | private object path + owner/project visibility + receipt/review | oversized stream, unauthorized project before put, pending review, authorized download |
| FP05 | hours/invoices / ERP action | finite values, real dates, submitted versus approved | self-approval denied; stale updates conflict |
| FE01–FE01 retry | all mutation forms | actor-scoped request hashes, transaction, CAS and audit | demotion/revocation cannot recover cached data; current visibility rechecked |
| Delivery | Activity / notifications API | leased outbox with fenced finalization | missing configuration, rejection, stale lease and invalid retry age |
| Recovery | operator backup/reconciliation | snapshots, hashes, private intents | restore synthetic WAL state; dry-run does not delete objects |

Local fixture and mocked-provider results are not evidence of a real Blob/Resend/accounting/Takeoff connection, physical mobile hardware or production compliance. Those seams remain separate.

## FT · Coordinator and project schedule

```mermaid
flowchart LR
 A[FT01 Team reviews saved request] --> B{Active coordinator in same company}
 B -->|Invalid| C[Keep input; no assignment]
 B -->|Valid| D[FT02 Save stage, owner and next action with version]
 D --> E[FT03 Assigned project and approved budget source/date]
 E --> F[FT04 Date-ordered schedule and milestones]
 F --> G{Role and visibility}
 G -->|Client| H[Assigned timeline, shared contact, updates and files]
 G -->|Provider| I[Assigned work without client budget/private contacts]
 G -->|Team| J[Internal contacts, scope and financial records]
 F --> K{Stale or invalid calendar range}
 K -->|Yes| L[Conflict/correction; preserve draft]
```

An assignment names an existing active team account, not arbitrary free text. Milestones represent explicitly reported work; a status change does not fabricate a completion event or percentage. Approved budget, invoice status and recorded payment remain different facts.

## FD · Document lifetime

```mermaid
flowchart TD
 A[FD01 Private uploaded receipt] --> B[Authorized content review]
 B --> C[Approved or rejected; optional real expiry]
 C --> D[FD02 Approaching or expired notice]
 D --> E[Durable deduplication per document and expiry]
 E --> F[Portal attention; separately configured email]
 C --> G[FD03 Authorized soft delete]
 G --> H[Download blocked immediately]
 H --> I{Hold or no retention configured}
 I -->|Yes| J[Retain private object]
 I -->|No; retention elapsed| K[FD04 Explicit administrator purge]
 K --> L{Storage result confirmed}
 L -->|No| M[Preserve uncertain intent; retry same object]
 L -->|Yes| N[Keep audit/tombstone; remove object path]
 G --> O[Restore only before irreversible purge begins]
```

An expiry never deletes an object. A receipt never approves its contents. Retention is an operator decision and is disabled unless configured. Hold and purge decisions are versioned; bytes already downloaded cannot be recalled.

## FF · Recorded finance and export

```mermaid
flowchart LR
 A[FF01 Assigned work hours or invoice] --> B[Authorized review with revision]
 B --> C[Submitted / approved / returned / recorded paid]
 C --> D[FF02 Disjoint totals by status and permitted project]
 D --> E[Source and time visible]
 E --> F{Team export requested}
 F -->|Yes| G[Server authenticates company and project]
 G --> H[FF03 Allowlisted CSV; spreadsheet operators neutralized]
 F -->|Other actor| I[Deny export]
```

Financial exports are generated files from stored records. They do not contact a bank, run payroll, certify tax treatment or imply accounting synchronization. A returned invoice is never included in approved outstanding totals.

## Extension evidence seams

| IDs | Required observation |
| --- | --- |
| FT01–FT04 | Team assignment denies other companies/disabled users; calendar range and impossible dates reject; stale milestone update conflicts; assigned client/provider see only permitted fields |
| FD01–FD04 | Upload review separate; deleted download denied; hold prevents purge; default dry-run has no deletion; expired/renewed notice deduplicates; uncertain purge safely retried |
| FF01–FF03 | Status totals disjoint; unknown budget distinct from zero; client/provider cannot export; CSV formula injection neutralized |
| Delivery worker | Explicit send opt-in; dry-run cannot invoke transport; current active administrator resolved each pass; positive provider receipt required; stale attempt cannot replace newer receipt |
