# TAYCO module parity and restoration inventory

Audit: 2026-10-23. Baseline Git commit **3bdd2b3**, app/portal/page.tsx (**3,847 lines**), lib/tayco_erp_suite_store.ts (**2,086 lines**) and the ERP API route. This source inventory is not runtime certification of the original integrations. The replacement workspace retained only part of the original modules: a regression against preserving the modules/design while improving content, security and usability.

Status: **Present** means current source exists, not that this new restoration suite exercised it; **Partial** means a narrower replacement; **Restore** means absent original behavior; **Needs inputs** means legitimate source data/contract is required before operational claims. Runtime completion must have its own actual evidence.

## Eight original views / six business modules

| View | Module | Baseline before restoration | Recovery |
| --- | --- | --- | --- |
| 01 Executive Overview | Cross-module console | Partial: project cards and financial overview; original console/charts absent. | Recover executive navigation, navy/gold bento presentation and source-backed charts. |
| 02 B2B Access & Invitations | Cross-module access | Partial: secure admin invitations/accounts; module summary absent. | Preserve server authorization; restore access/capability overview and secure invitation flow. |
| 03 CRM & Bid Leveling | CRM, three-bid comparison, subcontractor registry | Partial: requests, assignment/status, trade partners; bid leveling absent. | Recover opportunities, comparison, scope gaps, award recording and registry. |
| 04 Payroll & WH-347 | Crews, hours, labor costs, payroll report | Partial: dated hours/review; crew/burden/report absent. | Recover crew grouping and recorded labor; certified payroll requires more inputs. |
| 05 QuickBooks & POs | Procurement, changes, billing, accounting exchange | Partial: invoices/changes/CSV; POs/draw/IIF absent. | Recover POs and source breakdown; advanced pay applications/accounting are separate blocks. |
| 06 Multi-State Tax & TERO | Jurisdiction, exemption, compliance | Partial: authenticated documents/expiry; tax register absent. | Recover source-backed jurisdiction/compliance records, without invented rates/filing claims. |
| 07 Investor & Lender Dossier | Seven-section reporting, sheet-cost tracing | Partial: client updates/documents/budgets; dossier absent. | Recover seven-section project layout with source/availability per section. |
| 08 Takeoff Pro Bridge | CAD/estimating, cost and risk telemetry | Partial: honest disconnected status; bridge workflow absent. | Recover configured status/deep links; typed source ingestion precedes any sync claim. |

The requested monthly financial view is additional scope. The original 24-week EVM chart was not month-based invoice/cash accounting.

## All original subfunctions

| ID | Capability / original portal lines | Original implementation | Baseline / restoration requirement |
| --- | --- | --- | --- |
| X01 | Numbered eight-view navigation;765–842 | Invitation module flags filter eight views from six modules. | Restore navigation driven by server-derived capabilities/project scope. |
| X02 | Tenant/invite selectors;516–538,1198+ | Writes a globally selected context into JSON; query chooses another snapshot. | Do not restore impersonation. Use actor-authorized context display/switch only. |
| X03 | Invitation builder/presets/preview;540–567,1270+ | Share code, module list, expiry duration; original route unauthenticated. | Secure admin invitations present; restore useful capability/expiry preview with server enforcement. |
| X04 | Calm/deep density and table expand/collapse;401–459,1140+ | Local state controls information density. | Restore accessible responsive disclosure; essential actions remain discoverable. |
| X05 | Raking-light slider and pointer surface response;401–483,844–853 | Surface tilt/lighting visual treatment. | Preserve visual identity, controlled motion, touch and reduced-motion behavior. |
| E01 | KPI cards/sparklines;1470–1644 | Embedded monetary/time series and fallback values. | Restore from actual scoped records; unavailable history stays unavailable. |
| E02 | Interactive 24-week S-curve;1647–1848 | Select week; PV/EV/AC/net draw/CPI/SPI from embedded analytics/defaults. | Restore chart; operational EVM needs approved time-phased baseline, actual costs and progress method. |
| E03 | CSI donut, layer toggle, segment/crew detail;1850–1993 | Toggle divisions/cost tiers; amount/share/manhours/crew from embedded rows. | Restore coded categories and selection from actual records; unknown cost is not zero. |
| E04 | State pipeline/tax bars/drilldown;1995–2103 | Click bar changes global tax state; embedded projects/vendors/rates. | Restore scoped state grouping; clicking a bar must not certify jurisdiction/tax liability. |
| E05 | Crew radial gauges/ledger shortcut;2105–2200 | First four crew gauges, embedded hours/labor totals. | Recover grouping from recorded dated hours; payroll approval is separate. |
| E06 | Six module summary/navigation cards;2210–2385 | Hardcoded headline totals and project claims. | Recover module discovery with source-backed counts and useful empty states. |
| C01 | Quick opportunity creation;606–626,2580+ | Title/client/location/value with fabricated monetary/contact fallbacks. | Current requests exist; restore optional legitimate estimate/location/project details without invented defaults. |
| C02 | Stage filters/inline update;628–645,2540–2670 | Local filter and minimally validated persisted stage. | Preserve ownership; recover opportunity filters and validated durable transitions. |
| C03 | Three-subcontractor bid leveling;2437–2535 | Per-CSI engineer GMP, A/B/C bids/notes, award/savings from embedded rows. | Restore recorded equal-scope comparison, deliberate award and source references. |
| C04 | Scope gaps, VE/RFI credit/final target;2460–2530 | Embedded engineering note/gap/target credit. | Restore explicit review inputs; a target is not committed saving. |
| C05 | Subcontractor registry/expand;2680–2770 | Business, state/cities, trades, crew, W9/COI, YTD payments. | Vendor intake/documents partly present; restore structured registry with tax-data masking/role scope. |
| P01 | Crew select/additive manhours;647–667,2854–2933 | Undated delta recalculates crew days/wages/FICA/FUTA/SUTA/WC with fixed assumptions. | Dated reviewed hours present; recover grouping and explicit rates rather than an assumed statutory burden. |
| P02 | WH-347 labor ledger;2936–2980 | CSI/classification/workers/hours/wages/burden/loaded total from embedded data. | Recover recorded breakdown; full certified payroll needs employee/day/period/fringe/deduction data and review. |
| P03 | WH-347 export;2834–2852 | Button says JSON/CSV, but actual implementation downloads JSON only. | Honest recorded-hours CSV/JSON can return; incomplete export must not be called a certified filing. |
| Q01 | IIF/QBO preview;3038–3046 | Toggles hardcoded accounting sample text. | Restore source-backed export preview; preview is not a live accounting connection. |
| Q02 | IIF and QBO JSON downloads;3047–3076 | Text and JSON snapshot downloads; no QBO API or native bank file. | Correct format names, authorization and mapping/reconciliation before operational accounting export. |
| Q03 | AIA G702 simulator;411–414,3080–3158 | Progress/retainage sliders compute totals from fixed contract/prior certificates. | Explicit illustrative calculator possible; operational pay applications need approved inputs/reconciliation. |
| Q04 | Commit draw;669–686 | Persists sliders in JSON; claims QuickBooks ledger without remote posting. | Recover audited internal application record; remote sync/settlement must remain separate acknowledged states. |
| Q05 | Material POs;3160–3213 | Eight embedded rows: number/CSI/title/vendor/sheet/lead time/amount. | Restore scoped durable PO records, workflow, amounts/dates/vendor/source. |
| Q06 | Approved CO register;3215–3255 | Four embedded scope/engineering/sheet/net-impact rows. | Change request/review present; restore pricing/approval/source metadata, count only truly approved impacts. |
| Q07 | CSI/account mapping;3260–3298 | Embedded division/account/budget/commitment/billed totals. | Recover coded inputs and configurable mapping; mapped data does not mean acknowledged sync. |
| T01 | Jurisdiction selection;590–604,3350–3382 | Nine fixed state rates, globally selected jurisdiction. | Recover per-project jurisdiction/source/effective date; extra territory needs project evidence, not public identity expansion. |
| T02 | Exemption switch;3384–3405 | Toggle zeroes rate using embedded certificate string. | Recover evidence-backed certificate status/review; a toggle is not exemption proof. |
| T03 | Material/labor bases/tax/rule;3407–3458 | Fixed tax bases and broad labor-exemption statement. | Recover explicit input calculation and reviewed rule/source; no universal exempt-labor assertion. |
| T04 | TERO fee;3430+ | Fixed fee/rate shown with little project context. | Recover applicable contract/jurisdiction-specific recorded fee; no universal rate. |
| T05 | Quarterly Form941;3440+ | Fixed quarter/wages/withholding/tax/deposit totals. | Needs actual payroll/tax records; display missing source rather than invented filed status. |
| T06 | W9/COI/1099 register and verify;688–705,3465–3550 | Writes VERIFIED/ACTIVE, derives READY_TO_EFILE from W9+COI and fixed threshold. | Recover deliberate evidence review. Document status alone cannot establish filing eligibility or submission. |
| I01 | Project identity/unit economics;3600–3630 | Embedded project/location/units/area/GMP/VE/unit costs. | Restore identity and computed ratios only with legitimate unit/area/cost sources. |
| I02 | Dossier sections1–5;store dossier | Financials; APU/labor; long-lead procurement; AIA/COs; tax/TERO. | Restore section layout and real summaries; advanced upstream contracts remain prerequisites. |
| I03 | Dossier section6 audit/quality;store dossier | Embedded aerospace/AI agreement/kernel/line-item/sheet claims. | Keep real verification/source-audit section; no unsupported execution/certification claims. |
| I04 | Dossier section7/Pareto sheets;3670–3735 | Embedded sheet/budget/share/spec/deep links, fixed percentage. | Restore sheet-cost mapping; calculate top contributors from actually mapped records. |
| I05 | Dossier JSON;3614–3631 | Serializes embedded seven-section report labelled certified. | Restore scoped honest report export without unsupported certification label. |
| B01 | Bridge sync/probe;569–588,store1650–1740 | Three endpoints; both successful and unreachable fallback return online:true/fixed money values. | Recover genuine source/freshness/error/partial-failure contracts; no success on failed connection. |
| B02 | CAD/sheet deep links;3683–3730,3805+ | Local8085 and embedded sheet URLs. | Restore configured/validated project/sheet links and clear unavailable state; no hardcoded local endpoint for customer UI. |
| B03 | P50/P80/P95 risk telemetry;3820–3840 | Fixed amounts and claimed stochastic-run count. | Needs actual model/run/input/output provenance; restore visual availability, not invented confidence. |
| N01 | Monthly financial totals/chart | Additional user request; EVM timeline is not monthly bookkeeping. | Add month/date basis/project scope/source drilldown; test cross-month/project isolation and invalid periods. |

## All nine original ERP commands

| Original command | Original effect | Safe equivalent |
| --- | --- | --- |
| create_invitation | JSON module invitation/share code. | Administrator invitation with bounded capabilities/role/projects and enforced expiry. |
| switch_tenant_or_invite | Shared global context mutation. | Actor-authorized scope only; query/code never grants authority. |
| create_crm_lead | Lead with fallback identity/value. | Validated durable opportunity/request; unknown estimate stays unknown. |
| update_opportunity_stage | Minimally validated stage mutation. | Explicit transition, version check, audit/idempotency. |
| log_crew_payroll_hours | Undated delta/fixed burden assumptions. | Dated reviewed hours and explicit rates; payroll approval distinct. |
| verify_subcontractor_w9_coi | Supplied statuses without evidence check. | Reviewer/source/expiry-bound manual document/compliance review. |
| record_quickbooks_g702_draw | Local slider state, no QB post. | Internal pay-application record; external posting only after acknowledged integration. |
| calculate_state_tax | Global jurisdiction/exemption/fixed calculator. | Project-specific recorded inputs/rate/source; calculator distinct from filing. |
| sync_with_takeoff_pro | Always-online fallback. | Typed source ingestion/probe with actual freshness/failure/authorization. |

## Recoverable now from existing durable records

- Executive navigation, project/request/vendor/invoice/hour/document/change counts, status distribution and project scope.
- Invoice issuance grouped by explicit issue date (or labelled recorded-date fallback), payment movements grouped by their own occurrence date, approved budget sources, current-status cohorts, month filtering and source drilldown. Current status is not a historical balance; recorded payments are not independently verified bank settlement.
- Assignees, trade-partner applications, reviewed hours, project contacts/schedule/milestones, approved documents, expiry and availability.
- Rich tables, cards, charts, density, responsive navigation, controlled lighting and motion independent of whether a source value is a stored estimate or an operational record.
- Bids/procurement after explicitly entered durable new records; absent records require useful empty states, not injection of the original embedded project.

## Separate data-dependent completion blocks

These remain explicit product blocks; passing the restored core must not be described as completion of all advanced functions.

1. **Earned value/S-curve:** approved baseline budget, dated planned value, actual costs, period boundaries, progress method. Validate absent baseline, zero denominators, corrections, rebaselining and isolation.
2. **G702/G703:** contract/approved changes, line-item schedule of values, prior certified applications, stored materials, retainage rules and approval. Reconcile cumulative/gross/net; zero retainage remains zero. Draft/approval/posting/settlement are different states.
3. **IIF/accounting integration:** approved account/customer/vendor/class mappings, transaction dates/tax treatment, reversible references and reconciliation. JSON is not a native QBO file; text export is not synchronization.
4. **Certified payroll/WH-347:** employees/payroll week/daily hours/classification/wages/fringe/deductions/contractor identifiers and authorized review. Aggregated hours alone do not establish filing accuracy.
5. **Tax/exemption/TERO/941/1099:** current applicable project-specific inputs/supporting documents. Record, review, eligibility, submission and acceptance are distinct.
6. **Advanced seven-section dossier:** approved upstream data, sheet/cost mapping and authentic verification results. Recover layout/source availability now; populate advanced values only from legitimate inputs.
7. **Live Takeoff/Monte Carlo:** authorized service/project mapping, typed payload/version/time/source, deadline/partial failure and actual run provenance. Cached preview must not masquerade as remote live source.

## Verification policy

The tests/module-restoration.mjs exercise console/modules/monthly behavior on a newly seeded isolated fixture after contracts freeze. The previous 3008 user-review fixture must not be mutated by this suite. Require positive GUI operations, rejected mutations, actor/project isolation, month boundaries, source drilldown, responsive layouts and runtime-derived evidence.

This inventory does not mark restored features certified. Each row needs actual runtime evidence or an explicit pending/data-dependent state. Earlier passing tests did not establish parity for modules those tests never exercised.

## Observed restoration status after the core GUI run

Completed 2026-10-23T10:02:00.638Z against the final rebuilt isolated production fixture on localhost:3010 (build 2IGJcIWdVEMRkywr9PH65). Four runtime groups passed: operations, monthly, roles and responsive. The actual report and twelve screenshots are under ignored .data/certification/module-restoration-built-final-v2/. Test source SHA-256: 71bad852c2403624154aa8f2e791147c7bbc86e9d5495bcf20b0c52da057afd2. Runtime report SHA-256: 673571a674c1ae57a4702f23de6694e66026032cf56bbb0980dbe21a9eb285f3.

The GUI run records three equal-scope offers, accepts one, links it to a purchase order and follows all five normal PO states. It exercises invalid transitions, duplicate references, mismatched accepted bids, evidence-required compliance review, five actor roles and scoped dossiers. Supplier competitors are not returned to the vendor.

For monthly reporting a January31 invoice receives partial dated entries on January31 and February1; supplier payments remain separate, another project is excluded, the selected February CSV matches effective dates, and a GUI void correction preserves the historical payment entry while removing it from active monthly totals. Invalid month/year and unauthorized payment operations are rejected.

Responsive measurements: 42 module/viewport pairs, maximum horizontal overflow 0 px; keyboard opens/closes the mobile module menu and returns focus. This run uses browser emulation, not physical devices or a new native-zoom certification. A preceding network-idle wait timed out before mutation; explicit DOM/console readiness replaced that fragile test condition. A repeated fixture also exposed an ambiguous global three-offer test selector; the final test scopes the exact three-offer assertion to its unique new scope. The failed run remains separate from the passing evidence.

| ID | Current observed / source-inspected state |
| --- | --- |
| X01 | Restored: grouped command navigation and role-specific module entries; exercised at six sizes. |
| X02 | Secured replacement: actor-scoped snapshots; shared global impersonation is not restored. Role/project boundaries exercised. |
| X03 | Authenticated account/invitation flow retained from prior work. Old capability presets and invitation-preview presentation are not reproduced by this restoration suite. |
| X04 | Restored current controls: saved Calm/Deep atmosphere and comfortable/compact density, accessible disclosures and responsive presentation. Advanced original table-detail presets remain a separate parity item. |
| X05 | Restored lighting-direction slider and navy/gold material surfaces. Operational panels deliberately keep fixed targets instead of whole-panel tilt/click scaling; public editorial motion remains available. |
| E01 | Partial: actual counts/status cards restored. Historical sparklines require legitimate dated history and are absent. |
| E02 | Pending advanced EVM inputs and chart restoration; no invented time series. |
| E03 | Restored source-backed cost ring, CSI/APU package selection, material/labor/equipment toggle and exact-cent reconciliation. Estimated work quantities remain labeled estimates; no payroll execution is inferred. |
| E04 | Pending normalized geography/jurisdiction data and state-footprint drilldown. |
| E05 | Partial: recorded-hour source grouping restored; original radial gauges/crew cost data remain absent. |
| E06 | Restored core module discovery and sidebar access using authorized counts, with clear source and business-phase labels. |
| C01 | Partial: request intake/ownership retained; full opportunity location/estimated-value metadata is not yet restored. |
| C02 | Partial: validated request status/ownership exists; original CRM stage-filter presentation is not restored. |
| C03 | Restored core: three equal-scope offers recorded in GUI, explicit acceptance, accepted-offer/PO linkage and competitor isolation exercised. Engineer baseline/savings are not inferred. |
| C04 | Pending structured scope-gap and VE/RFI credit/target records. |
| C05 | Partial: real trade-partner intake and document workflows retained; no automatic prequalification or fabricated YTD payment data. |
| P01 | Partial: dated work-hour submission/review and grouping retained; fixed-rate undated payroll accumulation is not restored. |
| P02 | Pending employee/payroll-period/rate/fringe/deduction inputs and complete payroll ledger. |
| P03 | Pending dedicated honest hours/payroll export; no claim of certified WH-347 output. |
| Q01 | Pending approved accounting mappings and source-backed IIF preview. |
| Q02 | Pending actual accounting format/export contract; generic financial CSV does not substitute for IIF/QBO. |
| Q03 | Pending approved G702/G703 calculation inputs and application UI. |
| Q04 | Pending audited pay-application lifecycle and acknowledged accounting posting contract. |
| Q05 | Restored core PO record/lifecycle: draft, issued, acknowledged, received, closed plus invalid-transition/duplicate/mismatch rejection. Original sheet/lead-time detail is not yet recorded. |
| Q06 | Partial: scope-change request/review retained; costed approved CO/revised-contract accounting remains pending. |
| Q07 | Pending approved CSI-to-account mappings and reconciliation. |
| T01 | Partial: source-backed jurisdiction review register restored; state-rate calculation engine is not restored. |
| T02 | Pending explicit exemption-certificate state/evidence contract; no UI toggle can grant exemption. |
| T03 | Pending reviewed taxable-base/rate inputs and calculator; no universal labor exemption is asserted. |
| T04 | Pending applicable project-specific TERO record/calculation inputs. |
| T05 | Pending real quarterly payroll/tax inputs; no Form941 filing claim. |
| T06 | Partial: authenticated document review/expiry and evidence-backed compliance checklist exist; dedicated W9/COI/1099 register/filing lifecycle remains pending. |
| I01 | Restored basic scoped project dossier; unit economics remain unavailable without legitimate units/area/cost. |
| I02 | Partial: seven useful recorded-data sections restored, not all original advanced financial/payroll/tax contents. |
| I03 | Pending real verification results; unsupported certification/AI/kernel claims remain excluded. |
| I04 | Pending genuine blueprint-to-cost mappings and Pareto calculation. |
| I05 | Restored single authenticated JSON export; GUI download and 401/403/404/private-cache boundaries exercised. |
| B01 | Private typed Takeoff estimate ingestion, byte-hash archive and independent revision comparison restored. Automated live bridge synchronization/probe remains pending. |
| B02 | Project documents/offers remain accessible; configured external CAD/sheet deep links remain pending. |
| B03 | Pending actual risk-run provenance and telemetry. |
| N01 | Restored and exercised: issue cohorts, effective payment dates, partial payments, corrections, directions, project/month filters, accessible 12-month chart/table and period-scoped CSV. |

Passing this core restoration suite does not close the advanced/data-dependent rows above. These are explicit remaining product blocks, including missing presentation controls and procurement/CRM details as well as regulated/accounting calculations. No real money, external email, cloud file, QuickBooks transaction or tax filing was executed. Later source changes require appropriate checks again.


## Source and visual correction after client review

The client clarified that the named project in the original portal was a real estimating engagement. Its Takeoff scenario, APU and BOQ sources were recovered and hashed. The earlier broad classification of static project amounts as fabricated was incorrect. Their valid use is an **estimate snapshot**, with independent revisions and dates; that does not prove contract award, bank settlement, payroll execution or progress.

The new console restores the original rich bento hierarchy, gold/navy reactive surfaces, tabular figures, interactive project-state ring, source-backed cost ring, CSI/APU package versus material/labor/equipment views, saved Calm/Deep, density and light-direction controls. The offer matrix, purchase rows, seven dossier cards and monthly chart retain their workflows with refined presentation. The private source archive and generic recovery command restore real data without embedding customer amounts in source code or test fixtures. Execution progress and approved budget stay unknown when absent from the sources. Detailed current verification follows in docs/verification.md; these visual/source repairs do not certify unrelated advanced EVM or statutory forms.
