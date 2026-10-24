# Administrative opportunity review — local preview

The authenticated administrative preview at `/portal/review` reuses `PortalShell` for an executive summary, reported chronology and opportunity files. It reads an explicitly configured, SHA-256-pinned private source. It creates no ERP records, publication grants or invitations.

## Source and disclosure

The source DTO contains only opaque opportunity IDs, names, reported location/contractor, source category, unconfirmed reported deadline, and document receipt state. Unknown fields, including money, internal contacts, local paths and supplied URLs, reject the package. The excluded brand rejects the source rather than being accidentally rendered. Document checksums stay server-side.

An administrator from the source tenant is required before reading source bytes. Other roles are denied. The configured file is bounded to 1 MiB, rejects a symbolic link at the configured path and is checked against an explicit digest. No request controls its path. Source failures return a generic unavailable panel.

The review distinguishes reported opportunities, source files received and documents connected to the viewer. It does not infer operating projects, receipt dates, awarded work or financial outcomes. Deadlines are marked unconfirmed. Provisional floor areas and estimated expiration dates are excluded from this preview.

## Protected document links

Links require an exact source SHA matched to a document in the existing authenticated viewer scope. Missing or ambiguous bindings create no guessed link. Each subsequent viewer request revalidates its normal actor/document scope. Received but unregistered files remain visibly pending for viewer access; source-missing files remain pending at source.

This is an administrator preview with administrative document permissions. It does not certify the disclosure scope of a future insurer account. Recipient-specific publication and the absolute four-hour review grant require their own implementation and verification.

## Verification

- Six focused synthetic tests cover source projection, unmapped/ambiguous documents, all non-administrator roles, other tenants, source tampering/size, forbidden fields, excluded-brand variants, invalid dates, duplicate identity and false receipt state.
- Combined focused source/access/gateway run: 43 passing tests, zero failures.
- TypeScript, targeted ESLint and production build pass.
- Local real source: 23 reported opportunities, 17 received PDFs, 11 viewer-linked files, six received files awaiting registration and seven files pending at source. No financial values are loaded into the DTO.
- Local administrative page returns 200; anonymous access redirects to login. Response is private/no-store.
- Native browser navigation exercises summary, chronology, selection and an actual PDF canvas on desktop and Chromium mobile emulation at 390 × 844, with no outer horizontal overflow. This is a sample document render, not all-page certification or a physical-device test.
- Private source, cookies, databases, HTTP proof and screenshots remain in ignored local review storage.

## Configuration and remaining delivery

Set `TAYCO_PROFILE_A_REVIEW_SOURCE` and `TAYCO_PROFILE_A_REVIEW_SHA256` only in the private review runtime. The existing session/auth/ERP and protected viewer settings remain required. No sample customer data or credentials are installed by this change.

Complete the six unregistered document bindings and recipient publication policy before a recipient release. The general administrative overview's reference-collection counts, private resumable upload, measurement receiver, four-hour grant, expanded audit and cookie preferences remain separate unfinished blocks. No Railway deployment is performed by this preview.
