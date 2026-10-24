# Private guest review audit

The private console records server authorization decisions separately from optional interface selections. Both are scoped to the authenticated company and immutable review. An administrator can inspect retained observations in the account report and select one review.

## What an observation means

| Observation | Meaning |
| --- | --- |
| Permission or denial | The authenticated server handler or guard observed that decision. A later check may deny publication. |
| Transfer started | An authorized document or asset response stream was created. |
| Transfer EOF | The server response pipe reached EOF. A Range response covers only that segment. |
| Cancelled or failed | The stream did not establish a successful EOF. Recorded bytes cover only chunks already released to the pipe. |
| Optional selection | A known interface control reported an action while the current notice was accepted. |

None of these establishes browser receipt, PDF rendering or human reading. Prefetches and server projections are not interface visits. A shared asset is identified as an asset; it is never attributed to an unauthorized sibling document.

## Authorization and failure boundaries

- Server request context comes from the persisted, authenticated session binding. Invalid or unknown cookies are not assigned to a review.
- Auth lifecycle audit appends share the mutation transaction. Required audit failure rolls back generation or revocation.
- Read responses and RSC projections recheck the same review after a potentially blocking audit write. A prepared private response is cancelled when the final guard fails.
- Document guards run before and after pending reads, after span creation, and before headers are released. HEAD and redirects do not complete a transfer.
- Optional writes require a memory-only capability for the exact server session, current consent and resource scope. Checks repeat after acquiring the SQL lock and before committing or acknowledging.
- Denials never retain an unauthorized resource ID. Audit payloads exclude URLs, cookies, tokens, passwords, free-form text and document contents.
- Expiration retires the entire displayed project projection, including its heading and iframe. This does not undo previously delivered bytes.

## Optional controls

The closed interaction contract has an explicit version. Current controls cover module, reporting month, project and document selections, refresh, account and sign-out controls, display settings, and the reader's actual document/page/zoom/catalog/information controls. Bounded requested page numbers are disclosed by the current privacy notice.

The client queue uses memory only: at most 20 pending events, three attempts, an eight-second attempt timeout and a 30-second event lifetime. Retries keep the same UUID and require a matching explicit acknowledgement. Authorization denial, withdrawal, expiry or unmount discards pending activity and aborts dispatch. Offline or rate-limited activity may be missing; no delivery guarantee is implied.

The reader bridge stays disabled until its exact parent enables it for the remaining consent lease. Parent and frame both validate origin and window identity. The parent validates the closed message shape and generates the event UUID; the server independently checks document scope. No external script origin or inline execution is added to the protected viewer shell.

A new notice version starts with optional analytics off. Earlier monthly activity remains a separate legacy report; historical records are not given invented review identities.

## Retention and coverage

Essential and optional reports retain up to the configured window (90 days by default, maximum 365), subject to 10,000 events per company. Each recent list is bounded to 200 rows. Company pruning counters and retained starts without terminals make gaps visible. Optional insertion is limited per actor and company. Recent retry identities survive display pruning within the rate window.

The report is administrator-only and tenant-scoped. Its event counts are not unique people, documents, or confirmed reads. Unattributed attempts, unimplemented controls and closed/offline tabs are not silently treated as complete coverage.

## Local verification

The regression suite exercises lifecycle rollback, session/tenant/review isolation, retained-span matching, Range and HEAD semantics, delayed revocation/expiry, cancellation and upstream faults, closed metadata, lost acknowledgements, bounded retries, rate limits, consent withdrawal and forged frame messages.

Local browser checks use isolated synthetic accounts and source documents. Screenshots, runtime fixtures and private proof files remain outside Git. Passing these checks does not publish an insurer allowlist, deploy a service or invite a real recipient.
