# TAYCO public identity restoration

Updated 2026-10-23. Scope: public pages, inquiry forms, trade gallery and footer. The existing navy/gold/orange palette, typography, split commercial/residential hero, material-light interaction, animated editorial cards and photographic assets are retained.

## Source and facts

The client identified https://www.taycoturnkey.com/ as the original identity. Its home, commercial and residential pages were reviewed directly. Public contact facts are centralized in `lib/company.ts`:

- TAYCO LLC, full-service construction company.
- Phone 857-230-1452; email general@taycoturnkey.com.
- Monday–Friday 7am–6pm, Saturday by appointment. The source does not establish a timezone; none is invented here.
- Service coverage WI, IL, IA, IN, MN, MI, MO and TX. The commercial page also invites review of work outside its usual territory; the new copy retains this as a discussion, not guaranteed availability.
- Commercial construction, tenant improvements, residential renovation, fire/water restoration, roofing/exteriors, flooring, electrical and plumbing.
- Client audiences include property and business owners, investors, property managers, lenders and general contractors.

The original site's licensed/insured and restoration-certified description is retained without adding a specific certifying institution, standards edition, address, license number or bond status. Before publication, the company must verify current credentials and any legal wording. Existing service-area cities are restored as representative locations, subject to project review.

## Changes by surface

| Surface | Restoration / improvement | Retained |
| --- | --- | --- |
| Home | Service discovery and a five-step project journey replace fabricated active contracts and financial totals. | Split hero, filterable six-card collection, material studies, animated detail. |
| Commercial | Ten service categories, planning points and estimate preparation replace invented project ledgers and unit-rate claims. | Filters, editorial layout, gallery and motion. |
| Residential | Eight practical service groups, restoration scope, eight-state city coverage. | Cards, interactive light, gallery and finish exploration. |
| Property-owner inquiry | Property needs, scope, coordination and closeout replace performance/IRR promises and technical implementation copy. | Portfolio intake fields and visual presentation. |
| Estimate | Free estimate request and optional, explicitly illustrative calculator. Calculator does not certify price, tax or schedule. User notes survive repeated prefill. Service/sector query context is shown for explicit review and application without silently replacing an existing draft. The request form precedes the optional calculator on mobile. | Calculator, form, material/labor/equipment visualization. |
| Trade application | Application → review → invited account. No public tax-document uploads or automatic compliance approval. | Business, crew, territory, trades and notes fields. |
| Footer | Original contact, opening hours, coverage, service/audience paths and login/privacy links. | Logo and palette. |
| Gallery | Existing photos and all fifteen flooring types with two images each retained. Native modal supplies Escape, focus containment and focus return; responsive image sizes limit unnecessary transfers. | Sector views, zoom and gallery navigation. |

## Removed claims and exposed shortcuts

- Localhost ports, Rust kernel names, internal module IDs and unsupported live-sync language.
- Public master/client/CPA demo invite links. Portal entry uses `/login`; permission enforcement belongs to the server.
- Unverified North Dakota office/coverage expansion, invented office phone numbers/addresses and fabricated contract names/totals.
- Guaranteed return/saving language, fake audited or certified financial performance, and assertions that a public form automatically provisions account access.
- Upload-as-verification wording and requests to email W-9/tax records.

## Intake behavior

All three forms retain a stable `Idempotency-Key` for retrying the same payload. A changed payload receives a new key. Success is displayed only when the API returns `success: true` and a `referenceId`; pending team notification is described separately from durable receipt. The key is held in component memory; persistence over reload is not claimed. Server idempotency and delivery/outbox behavior are separately verified by backend tests.

Public vendor applications contain no document paths. Documents follow an authenticated, invited workflow; submission itself does not approve a vendor or award work. Privacy links accompany collection. Sensitive tax, banking and identity details are not requested in public notes.

## Evidence and publication limits

- Scoped ESLint is run on all changed public pages/components and company data.
- `tests/public-content-contract.mjs` checks identity, mobile overflow, field labels, preserved galleries, modal focus and simulated submit/retry receipts. Its write requests are fulfilled in the browser; it does not contact real intake, email or storage services.
- The calculator preserves raw area edits, validates 250–250,000 whole sq ft, disables applying invalid values, and submits numeric illustration metadata only for a valid, explicitly applied current illustration. The calculator still uses inherited illustrative assumptions; they require company-approved pricing before being presented as actual TAYCO rates. No approved operational data has been invented.
- Original portfolio photos are retained as provided; no new claim that a depicted image is a verified completed contract is made.
- Client review remains necessary for publication, actual response targets, credentials, geographic availability and privacy retention/legal details.
