# Local insurer recipient review

The insurer profile uses the same portal shell and four-hour review lifecycle as the company guest, with a narrower immutable recipient policy. It never adopts the company guest's financial summaries or project catalog. Local verification does not authorize publication or an invitation to a real recipient.

The grant records its recipient type and policy SHA-256 at creation. Those fields cannot be updated. A later login, another grant for the same account, a retry or a missing policy does not change that binding or widen access. Existing company reviews keep their original scope.

A fixed server path supplies a bounded, hash-locked policy. It selects source opportunity IDs, a separately pinned closed source DTO, exact ERP/viewer/context/document identities, source checksums, delivery bundle/manifest/relations pins and explicit asset IDs. Missing, malformed or changed policy/source files fail closed. No request supplies a file path or a new policy. The ordinary HTTP invitation endpoint cannot issue this profile; private operator preparation remains separate from release approval.

The source DTO contains summary counts, reported chronology, opportunity labels and document availability. It excludes financial fields, free-form internal payloads, transport paths and AutoZone. Only selected records reach the recipient. A pending or revoked document remains unavailable rather than becoming a guessed link.

Every document read intersects the policy with the current tenant, mapping, resolved context and active ERP records. Delivery pins and source checksum must still match. Company APIs, financial summaries, direct blob downloads, unrelated projects and sibling document metadata are denied. An explicitly approved shared asset grants that file's bytes, never sibling metadata. Page-level subsets are unsupported.

The protected viewer returns minimal PDF descriptors for this profile. Upstream labels, OCR text, indexes, measurements and BOQ/APU values do not enter its recipient JSON. Explicitly selected PDF assets remain available through guarded GET, HEAD and Range requests; an unexpected content type or source identity is rejected.

The entire displayed projection, including opportunity labels and iframe, retires at the immutable deadline. Server guards enforce expiry, revocation and policy changes on subsequent requests and pending streams. Already delivered bytes cannot be recalled.

Privacy preferences and bounded interaction queues are shared with the existing review contract. Selected sections and opportunities have closed semantic identifiers; only authorized opportunity/document IDs can enter optional activity. Unknown or rejected consent emits no optional events. Essential server audit remains separate.

Verification uses synthetic accounts and sources, canaries in unselected and internal records, negative API/gateway paths, immutable binding and tamper cases, consent controls and native desktop/mobile PDF rendering. Runtime fixtures and screenshots stay outside Git. The actual insurer recipient, approved production document set, deployment and external delivery still require their separate review.

## Receipt and recipient availability

Source receipt remains `received` or `pending`. The recipient DTO reports a separate closed access state: `available`, `not_selected`, `authorization_unavailable`, or `source_pending`. A received file withheld by policy is not called unregistered; a selected file whose current record or delivery authorization fails remains received with access unavailable. The response does not inspect unselected records to invent registration counts or disclose their internal identities.

Coverage counts partition the selected source document slots by these states and include a server observation time. They do not count registrations. Only current authorized viewer links are returned. A refreshed projection removes an older open reader when its availability observation or permitted link changes. Administrative preview wording remains a connection observation, without inferring a registration failure from a missing link. These labels do not grant access or change the immutable deadline.
