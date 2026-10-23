# Administration product flow map

Revision: 2026-10-23. Purpose: let an authorized coordinator move a real request through project work, evidence, review and reporting, then return to the next actionable source without confusing estimates, approvals, payments or external delivery.

This is a source-derived product contract and coverage review. It is **not a certification that the entire administration was exercised**. The 22 module destinations were navigated at six viewport sizes in a prior isolated build; the four recent suites contain 24 bounded workflow groups. Those facts do not establish every button, state, role, error branch, integration or business handoff.

Progress authority remains Soul Ledger. This document owns the behavior map, evidence interpretation and next verification contract; it is not a parallel completion ledger.

## Scope, method and provenance

Sources inspected: [PortalClient](../app/portal/PortalClient.tsx), [ERP](../lib/erp.ts), workspace components, account/document HTTP routes, [existing flow contracts](product-flows.md), [module parity](module-parity.md), [business workspace](business-workspace.md), [financial dashboard](financial-dashboard.md), and the four recent test sources/reports recorded below.

Method: [complete-flow design](../../../../.soul-core/harness/references/flow-design.md), [VMOF](../../../../.agents/skills/vmof/SKILL.md) and [Aerospace](../../../../.agents/skills/pipeline-aerospace/SKILL.md). Diagrams are manually maintained behavioral models, not generated execution traces. VMOF classifications and priorities below are engineering judgments; a score is not evidence.

Evidence states used here:

| Mark | Meaning |
| --- | --- |
| S | Implemented behavior inspected in source. No implied browser execution. |
| G | Specific GUI interaction covered by one of the 24 recent groups on its recorded build. |
| D | Relevant domain/API test exists; it does not prove the GUI interaction. |
| H | Older, scoped GUI/HTTP evidence exists in verification history; not re-certified by the latest 24 groups. |
| U | Interaction/branch not established by those 24 groups; verify before claiming complete administration coverage. |
| M | Deliberately manual handoff or separately recorded fact; no automatic transition is implemented. |
| X | External/data-dependent capability remains outside current operational contract. |

The recent reference build is **p3t0jYA_w_P7NAWDDGISL**, build receipt JOB_20261023_124336_5400, domain suite 160/160. The public-header removal is a subsequent shell change owned separately; the 24-group evidence predates that change. Rebuild and verify its affected navigation, spacing, focus and account-return paths before calling the new shell verified.

## Actors and scope

| Actor | Authority and practical boundary |
| --- | --- |
| Administrator | Company operational records, account invitations/access administration, invoice approval and dated payment/void controls, document policy/purge authority. The role does not prove a real accounting connection or regulatory authority. |
| Internal staff | Company operational records and reviews; no administrator payment controls or account-management authority. |
| Assigned client | Assigned projects, allowed project documents/updates/change decisions and client-visible invoice evidence. Internal proposals, estimates, rosters, corporate agenda, vendor negotiations and planning assumptions are excluded server-side. |
| Assigned provider | Own/company-linked vendor records and own authorized documents/hours/invoices/offers/POs. Competitors and client scope-change conversations are excluded. |
| Public prospect/provider | Bounded public request/application intake only. Submission never confers workspace access or creates an operating project. |
| Operator | Private account provisioning, source import, storage reconciliation, backup/restore and configured external workers. These are separate CLI/operations surfaces, not hidden admin buttons. |

The server resolves tenant and role from the current session. A project selector narrows authorized data; it never grants access. Internal staff can access company projects by role; project-team responsibilities do not independently grant login/project permissions. Vendor account linkage and project assignments are account administration decisions.

Reporting has distinct clocks:

- Company/project status is a **current snapshot**.
- Invoice issuance uses explicit issue date or a labeled recorded-date fallback; dated payment entries use their effective date.
- Weekly financial detail clips Monday–Sunday intervals to the chosen month. Its cash result is client receipts minus provider payments, with internal/unclassified movements separate.
- Hours use work dates and ISO week/year, not record creation dates.
- Completion requires a closed project, explicit actual date and evidence.
- A next-month scenario uses current source states and balances for the calendar month following the selected month. It does not reconstruct a historical forecast.
- Corporate meetings/follow-ups are company-wide modules. Their own date/month/priority/state/owner filters apply; inherited project scope is cleared and the project selector is not promised there.

## A. Whole-business flow and honest handoffs

Solid arrows below represent implemented data movement or reporting consumption. Dashed arrows identify a human decision/separate record, not automatic conversion.

~~~mermaid
flowchart TD
  Public["Public estimate / vendor / investor request"] --> Intake["Validated durable request or application + outbox"]
  Intake --> CRM["Requests: ownership, stage, next action, sourced opportunity value"]
  CRM -. "M: create and relate by operator judgment; no leadId conversion" .-> Project["Project: identity, unknown progress/budget until recorded"]
  Source["Private Takeoff bytes"] --> Archive["Operator inspection, hash archive, typed estimate revisions"]
  Archive -. "M: choose approval independently" .-> Budget["Approved budget + source + approval date"]
  Project --> Scope["Schedule, milestones, contacts, team responsibilities"]
  Project --> Proposal["Client proposal: draft → sent → recorded decision"]
  Proposal -. "M: acceptance does not create contract/budget/invoice" .-> Budget
  Project --> Bids["Equal-scope supplier offers and explicit review"]
  Bids --> PO["Optional validated accepted-offer link → purchase order"]
  PO -. "M: order does not issue supplier invoice or payment" .-> Invoice["Invoice submitted → approval / return"]
  Scope --> Hours["Dated submitted hours → approval / return"]
  Scope --> Docs["Private upload → pending review → approval / rejection"]
  Docs -. "manual evidence review and separate compliance record" .-> Compliance["Separate source-backed jurisdiction / compliance review"]
  Invoice --> Payments["Admin dated payment entries / explicit void correction"]
  Payments --> Reports["Month + week + audience + project source reports"]
  Proposal --> Forecast["Explicit billing date, allocation, probability and source"]
  Budget --> Dossier["Allowlisted project dossier"]
  Reports --> Dashboard["Executive widgets, source drilldowns, next-month scenario"]
  Forecast --> Dashboard
  Scope --> Agenda["Milestones / expiry / dates / saved next actions"]
  Docs --> Agenda
  Invoice --> Agenda
  Meetings["Company meeting and priority follow-up records"] --> Agenda
  Agenda --> Return["Open owning module, review source, make next explicit decision"]
  Return --> Scope
~~~

No implemented automatic chain currently turns approved hours into payroll, accepted proposal into contract, accepted scope change into revised contract amount, PO receipt into supplier invoice, invoice approval into bank transfer, or a compliance review into a filing. Those are separate business facts. The interface must preserve that distinction even when a manual handoff is inconvenient.

## B. Workspace shell and common mutation contract

There are **22 module buttons** plus the administrator's separate **B2B access & invitations** link to /account. Refresh, display controls, project scope, account access and global retained-request recovery are cross-module controls.

~~~mermaid
flowchart LR
  Login["Login / accepted invitation"] --> Session{"Valid current session"}
  Session -->|No| Signin["/login with safe return"]
  Session -->|Yes| Snapshot["GET /api/erp-suite: authorized snapshot"]
  Snapshot --> Shell["Administration shell: module + permitted scope"]
  Shell --> Read["Filter / drilldown / source / export"]
  Shell --> Draft["CommandForm: field values + original version"]
  Draft --> Save["POST /api/erp-suite + stable idempotency key"]
  Save --> Guard{"Current authority, input, version and replay"}
  Guard -->|422| Correct["Explain invalid input; preserve draft"]
  Guard -->|401 / 403 / 404| Deny["Sign in / explain unavailable record; no widened scope"]
  Guard -->|409| Conflict["Refresh; preserve dirty draft; explicit discard/load current"]
  Guard -->|Valid| Commit["Atomic record + audit + saved receipt"]
  Commit --> Received{"Receipt received"}
  Received -->|Yes| Return["Update snapshot, show outcome, remain in module"]
  Received -->|No / 5xx| Journal["Parent in-memory retained key/body; hold other ERP saves"]
  Journal --> Retry["Retry retained request even after module/project change"]
  Retry --> Guard
~~~

| Transition | Observable success | Error/return contract |
| --- | --- | --- |
| B01 Read/refresh | New permitted snapshot date and source rows. | Failed refresh keeps previous data with a stale-data message. Out-of-order reads must not replace a newer mutation snapshot. |
| B02 New ERP command | Exactly one saved result, audit and refreshed relevant records. | Field validation preserves inputs. Busy/uncertain intent holds other ERP saves. |
| B03 Known 409 | Current record displayed alongside preserved draft. | Saving a stale dirty draft waits for explicit “Discard draft and load current values”; no silent rebase. |
| B04 Uncertain ERP reply | Same body/key replay returns original receipt; separate read retrieves current version. | Journal survives conditional module/project unmount within this mounted workspace. Browser close/reload/navigation to another route is outside this in-memory guarantee. |
| B05 Download | Authorized server export/download, source/period matching current selection. | HTTP 401/403/404 must not download private error payload as a success file; failure UX needs separate exercising. |
| B06 Leave/change module | Correct destination and focus; source scope/month passed where explicitly supported. | Ordinary unsaved drafts can be unmounted. No universal draft persistence/leave warning is established. /account navigation is also a full route change. |

## C. Complete destination and option inventory

The table traces section → interface → state/effect → return/error. All ERP command names below are payload actions of **POST /api/erp-suite** unless another route is stated. All module reads originate from its authorized GET snapshot unless separately stated. Shared B01–B06 recovery applies only where CommandForm is actually used.

| ID / destination | Options and commands | State and observable effect / return | Scope and evidence limit |
| --- | --- | --- | --- |
| A01 Executive overview — executive | Twelve monthly source bars; selected month handoff; project-state ring; estimate revision / CSI vs cost-tier selection; source KPIs; upcoming/overdue; follow-up expansion; calendar day/source links; quick access; Calm/Deep, density, light direction. No direct financial mutation. | Pure derived counts/charts and navigation to source modules. Chart month passes financial reporting period. Agenda entries open the owning module; a source reference is not always a record anchor. | Role-shaped view, authorized project scope; current inventories separated from dated activity. G F02/F08/F10, U06 navigation; H estimate widgets. Every widget/error state is not covered by 24 groups. |
| A02 Financial dashboard — financial_dashboard | Reporting year/month/arrows; client/provider/internal audience; 12 bars; source disclosures; weekly detail; monthly project source links; planning-project choice; record_project_forecast, cancel_project_forecast, set_proposal_forecast, clear_proposal_forecast, record_project_completion. | Source-backed base and separate weighted proposal billing; cancel/clear retain history; closed project completion contributes dated history without creating invoices/payments. Successful commands keep report month; malformed summary boundary retains month controls/invoice escape. | Internal only; project + month + audience, with next-month current-snapshot semantics. G F01–F10; R01–R03 recovery; U malformed-source overflow GUI and every filter combination. |
| A03 Projects — project | create_project; update_project; update_project_details; set_project_schedule; add_milestone / update_milestone; save_project_contact (create/edit/archive); add_note; request_change; scoped document downloads and source views. | New independent planning project; progress/budget unknown and next action blank unless supplied. Explicit budget requires approval source/date including zero. Schedule is paired/ordered; milestone completion needs actual date; contact visibility is explicit. Source state returns to same project card. | Internal creates/edits; assigned external actors see allowed fields and submit permitted notes/changes. G U01 blank/zero create; D project/reuse tests; H broader project workflows. U full GUI schedule/milestone/contact/visibility lifecycle. |
| A04 Corporate meetings — corporate_meetings | Create, edit details, change state; date selection all/month/upcoming/past scheduled; month, priority, state, responsible-account filters; history disclosure. Actions create_corporate_meeting, update_corporate_meeting, set_corporate_meeting_state. | scheduled / completed / cancelled, explicit accountable internal person, date, optional local-as-entered time/location, notes and state reason/history. No invitation/calendar message is sent. | Internal company scope, separate from project dropdown. G C01/C03/C04/C05. U every reopening/cancellation/permutation and full history correction display. |
| A05 Follow-ups & priorities — followups | Create/edit/change state; all/month/upcoming/overdue; month, priority, state and owner filters; history. Actions create_followup, update_followup, set_followup_state. | open / in_progress / completed / cancelled, explicit due date, person, priority and notes. Dashboard prioritizes saved urgency and exposes full list. | Internal company scope. G C02–C05/F08. U every state pair, deleted/disabled owner recovery and combined filter interaction. |
| A06 Documents — document | Upload PDF/JPEG/PNG ≤10MB with type/project; review_document; private download. Maintenance: GET/POST /api/document-maintenance actions delete, restore, hold, retention, purge, scan_expiry; permanent purge has explicit confirmation. | Upload receipt is pending_review, never certification. Review approved/rejected + reason/expiry/visibility. Availability is independent: removed/recoverable, held/retention-protected, purging/purged/uncertain. Maintenance refreshes its state and parent. | Internal/provider upload; client upload denied. Owner/project/visibility restrictions apply. Admin policy capabilities returned per record. S/D/H; recent 24 groups only navigate/read relevant sources, not the complete upload/review/maintenance GUI. X real blob delivery in this local fixture. |
| A07 Updates — note | Read scoped updates. Creation is reached from the relevant Project card via add_note, including explicit internal/client visibility for staff. | Durable titled update; client/provider-authorized visibility. No automatic email send is implied. Return to project or Updates. | Actor/project/visibility allowlist. S/D/H; U fresh 24-group post/update-visibility/drilldown sequence. |
| A08 Changes — change | Request from Project via request_change; team review_change; client decide_change only after proposed. | requested → reviewing/proposed/declined; assigned client may accept/decline proposed change. Decision is scope discussion, not costed approved CO/revised budget. | Team + assigned clients; provider excluded. S/D/H; U end-to-end latest GUI request→proposal→client decision and stale/error branches. |
| A09 Requests — lead | create_lead; stage/owner/unassigned/search filters; update_lead workflow; update_lead_details location and optional sourced estimate including zero. | Company request persists with accountable person, stage and next action. new/reviewing/waiting/quoted/accepted/closed are recorded states; no automatic project creation. Missing estimate stays unknown. | Internal company-wide; no inherited project filter. G U02. U every stage pair and request-to-project provenance handoff. |
| A10 Client proposals — proposal | Current-state filter; create_proposal; send_proposal; decide_proposal; source and forecast/history disclosures; View proposal project. | draft → sent → accepted/declined/withdrawn with dates and decision evidence. Accepted does not approve budget or issue invoice. Changed decided offer needs distinct record/reference. Forecast assumptions managed in A02. | Internal, project; current pipeline separate from monthly cohorts. D/H; G F04 assumption GUI only. U full proposal create/send/all decisions GUI on final build. |
| A11 Trade partners — vendor | Company/vendor details/application fields and available document context; provider labels this My company. No vendor approval/prequalification/edit action exists in the inspected module. | Public application saved separately; account invitation/project/vendor linkage is manual through /account. Read-only registry is not supplier certification or YTD payment evidence. | Internal company directory; external provider only own/company-linked record. S/D/H; U full register/document/account-link return path. |
| A12 Bid leveling — bid | create_bid; equal-scope offer matrix; offer notes; review_bid reviewing/shortlisted/accepted/declined; commercial-request link. | Received offers grouped by project + exact recorded scope; explicit review/award. Accepted-offer ID may feed PO creation. It does not contact/contract/pay supplier. | Internal sees competitors; provider only own offers. S/D/H (earlier three-offer lifecycle); 24 groups navigation only. U latest full review decision/competition/isolation GUI. |
| A13 Team hours — hours | log_hours; review_hours; report from/to/project/status filters; ISO-week/project/trade/submitter grouping; reveal more records; GET /api/hours/export CSV or JSON preserving filters. | submitted → approved/returned; exact dated hours, distinct submitters/review states. Approval is work-log review, not wage/payroll payment. Return remains in same report with sources. | Internal company logs; provider own logs; client denied. G U03/U05. U returned-log correction/resubmission: no edit/resubmit command was found; record a corrected new log requires an explicit product contract. |
| A14 Purchase orders — purchase_order | create_purchase_order with optional accepted bid; update_purchase_order; update_purchase_order_details source document/sheet, quote date, lead-time days, expected delivery, source; source history; financial overview link. | draft → issued → acknowledged → received → closed; cancellation before received. Duplicate references and inconsistent accepted-offer links rejected. Details editable only draft/issued/acknowledged. No supplier transmission or invoice/payment creation. | Internal writes; provider permitted own/company PO reads. G U04/U05 numeric sourcing/CAS/create; H complete five-state lifecycle; U latest cancellation/terminal-state GUI/review across parties. |
| A15 Project teams — team | add_project_team_member / remove_project_team_member; available active internal accounts; responsibility/date, current and prior assignment history; project link. | Explicit nonoverlapping responsibility intervals; ending assignment retains history. Assignment is distinct from access permissions and employee/payroll classification. | Internal, project. S/D/H; 24-group navigation only. U full GUI add/end/reassign/disabled-member/stale-source branches. |
| A16 Project requirements & certifications — compliance | create_compliance; review_compliance pending/in_review/complete/not_applicable/expired; due/review dates; evidence/rationale; project context. | Evidence-backed manual review register. complete/not_applicable require dated evidence. No tax calculator, exemption grant, TERO assessment or filing executed. | Internal project records only. S/D/H; 24-group navigation only. X approved jurisdiction/rate/payroll/filing sources; U latest full review/date/evidence GUI. |
| A17 Financial overview — finance | Year/month/all-period selection, audience/status source cohorts, source drilldowns, unknown/fallback coverage, invoice shortcut; Client-side period model over the authorized ERP snapshot; GET /api/finance/export for the internal CSV download. The separate GET /api/finance/periods contract exists but this component does not fetch it. | Reconciled recorded-source aggregates/CSV with actor, project and period semantics. Current status is not a historical balance; CSV is not IIF/QBO sync. Return to invoice ledger/project. | Internal broad; assigned clients/providers narrower existing evidence. S/D/H; G financial_dashboard is a different module. U latest exhaustive A17 controls/exports and failure UX. |
| A18 Invoices — invoice | record_invoice; admin update_invoice approved/returned; record_invoice_payment; void_invoice_payment + reason; date/reference/source/audience fields; payment history. | submitted → approved/returned; dated partial payments preserve entries; fully paid status from complete recorded payments; void excludes entry from active totals while retaining correction history. Approval is not bank settlement. | Internal/provider invoice intake; admin only decision/payment controls exposed here; clients read assigned client audience; providers own invoices. D/H; F01/F06/F09 use API-seeded sources plus report observation. U actual invoice form→admin approval→partial payment→void GUI on current build. |
| A19 Investor & lender dossier — dossier | Seven source/availability sections; GET /api/project-dossier?projectId=… JSON; Review project source records. | Allowlisted current snapshot: project, approved budget/source, milestones, permitted document/change/finance evidence as available. No valuation, ROI, certification or invented unit economics. Download remains a recorded pack, not audited financial statements. | Internal and assigned client; provider module absent. S/D/H prior download/isolation; recent 24-group navigation only. U newest complete dossier content/download/error sequence. |
| A20 Estimates & scenarios — estimate | Revision comparison, source/hash/date/availability disclosure, CSI/APU rows; dashboard provides revision/tier selection. No browser import/edit/promote-to-budget command. | Immutable typed estimate revisions; different totals stay separate; invalid sources excluded. Private operator importer is the entry surface. No operational invoices, progress or approved budget are generated. | Internal only. S/D/H five earlier estimate GUI groups; 24-group navigation only. U new archive import from ordinary manually created project; sourceSlug matching limitation persists. |
| A21 Takeoff Pro bridge — takeoff | Configured/disconnected context; source documents and supplier-offer shortcuts. No live sync/probe/remote CAD control button implemented. | Honest source-context view; archived estimate ≠ live remote connection. Useful manual route into plans/documents and procurement. | Internal. S/D/H, 24-group navigation. X live authorized project mapping, provider probe/sync and run provenance. |
| A22 Activity — activity | Current audit records, delivery status counts; admin Send queued notifications → POST /api/notifications. | Local audit event display; configured outbox processing may be accepted by provider, retryable or needs_attention. “Delivered” display means provider acceptance, not recipient reading. Source requests remain saved when delivery unavailable. | Internal company scope; admin processing. S/D/H, 24-group navigation only. U final GUI configured/unconfigured/timeout/expired delivery-age branches. X live provider delivery. |

### Adjacent account surface (not a 23rd module)

The B2B sidebar link and Account & access header link open /account. GET /api/auth/session resolves actor; administrator GET/POST/DELETE /api/auth/invitations lists, creates recipient-bound invitation paths and revokes them. GET/PATCH /api/auth/accounts reads and changes staff/client/vendor role, project/vendor linkage or suspension using accessVersion. Changes revoke existing sessions. POST /api/auth/change-password and /api/auth/logout return to login. Public /login plus /api/auth/accept-invite completes recipient activation.

No invitation message is sent by creating a link. Administrator provisioning/recovery is operator-only. These forms do not use the ERP retained-command journal. Source/API tests and prior scoped account evidence exist; the latest 24 groups **do not** certify invitation creation/revocation/acceptance, account reassignment, suspension, password change, logout, stale accessVersion or lost-reply recovery through the account GUI. A return from /account remounts the portal; neither current tab nor pending in-memory ERP intent is promised across that route change.

## D. State and evidence contracts

~~~mermaid
stateDiagram-v2
  [*] --> Planning: create_project / progress unknown
  Planning --> Active: explicit status update
  Active --> Blocked: explicit status update
  Blocked --> Active: explicit status update
  Active --> Handover: explicit status update
  Handover --> Closed: explicit status update
  Planning --> Closed: allowed recorded state
  Closed --> DatedCompletion: record_project_completion + actual date + evidence
  DatedCompletion --> Active: reopen clears current completion; history retained
  note right of Planning
    Budget approval, schedule and progress
    are separate recorded facts.
    Diagram illustrates common routes;
    allowed project state selection is broader.
  end note
~~~

~~~mermaid
flowchart LR
  Draft["Proposal draft"] -->|actual sent date| Sent["Sent"]
  Sent -->|decision date + evidence| Accepted["Accepted"]
  Sent -->|decision date + evidence| Declined["Declined / withdrawn"]
  Accepted -. "M: new separate approval" .-> Contract["Contract / approved budget source"]
  Offer["Recorded supplier offer"] --> Review["Review / shortlist / accept / decline"]
  Review -->|accepted ID + matching scope/vendor/amount| PODraft["PO draft"]
  PODraft --> Issued["Issued"]
  Issued --> Acknowledged["Acknowledged"]
  Acknowledged --> Received["Received"]
  Received --> Closed["Closed"]
  PODraft --> Cancel["Cancelled"]
  Issued --> Cancel
  Acknowledged --> Cancel
  Closed -. "M: separate supplier source" .-> Invoice["Invoice ledger"]
~~~

Offer review is a recorded choice, not an enforced multi-stage award workflow. PO lifecycle is an enforced transition graph. Proposal decisions are terminal through the current commands. A sourced target/saving is not automatically a committed commercial outcome.

~~~mermaid
flowchart TD
  Invoice["Recorded invoice + source + issue date"] --> Submitted["Submitted"]
  Submitted --> Approved["Admin approves"]
  Submitted --> Returned["Admin returns"]
  Approved --> Payment["Admin records dated partial/full payment"]
  Payment --> History["Immutable source entry + current invoice status"]
  History --> Period["Effective payment date → month / clipped week"]
  History --> Void["Admin voids specific entry with reason"]
  Void --> Retained["Entry retained; active totals corrected"]
  Approved --> Outstanding["Current valid outstanding balance + due date"]
  Outstanding --> Base["Next-month obligation base"]
  Plan["Explicit standalone dated project plan"] --> Base
  Linked["Plan linked to invoice"] --> OnlyInvoice["Invoice authoritative; suppress extra plan total"]
  OnlyInvoice --> Base
  Sent["Sent proposal + explicit timing/allocation/probability/source"] --> Upside["Separate conditional billing scenario"]
  Base --> Screen["Dashboard + source drilldown"]
  Upside --> Screen
  Period --> Screen
~~~

Approval does not record cash. A payment entry does not independently verify bank settlement. The weekly cash result excludes unrecorded overhead/payroll/taxes/accrual adjustments. No diagram edge converts that result into accounting profit.

~~~mermaid
flowchart TD
  File["Authorized file + bounded type/project"] --> Storage["Private storage upload + operator intent journal"]
  Storage --> Registered["Document registered pending_review"]
  Registered --> Review["Manual approval / rejection + expiry / visibility"]
  Registered --> Remove["Remove access; retain recoverable record"]
  Review --> Expiry["Expiry / renewal review source"]
  Remove --> Restore{"Allowed to restore?"}
  Restore -->|Yes| Available["Available again; original review state retained"]
  Remove --> Retention["Explicit elapsed retention; no hold"]
  Retention --> Confirm["User confirms permanent purge"]
  Confirm --> Purging["Unavailable while storage deletion attempted"]
  Purging --> Confirmed["Confirmed purge"]
  Purging --> Unknown["Deletion not confirmed; remains unavailable"]
  Storage --> Lost["Browser reply lost or registration/storage failure"]
  Lost --> Reconcile["Refresh sources + private operator reconciliation"]
  Reconcile -. "manual proof; no ERP key reuse" .-> Registered
~~~

File receipt, content approval, sharing visibility, renewal and storage availability are separate state axes. Permanent deletion does not remove earlier copies from separately managed backups.

## E. Manual handoffs versus broken or ambiguous links

| Handoff | Current contract | Product implication |
| --- | --- | --- |
| Public request → assigned owner/stage | Implemented durable intake, outbox and CRM review. | A request reference is usable; delivery remains separate. |
| Accepted request → project | M: coordinator creates a new project. No leadId→project conversion/link field is established. | Intentional manual creation, but source traceability/copying is a friction gap. Do not draw an automatic solid edge. |
| Project → proposal | Implemented: proposal requires existing authorized project. | Project/client/source choices must remain explicit. |
| Accepted proposal → approved budget/contract | M: separate budget approval requires source/date. | Prevents false conversion; a convenient reviewed handoff could reduce re-entry without removing evidence. |
| Estimate import → ordinary existing project | Operator importer matches recovered sourceProjectSlug, not arbitrary ordinary project identity. | Same real project manually created first can be duplicated by recovery. Add reviewed matching before generalizing imports. |
| Accepted bid → PO | Implemented optional validated bidId link. | Independent PO source is also allowed; scope/vendor/amount constraints protect linked path. |
| Received PO → supplier invoice/payment | M: separate recorded source; no automatic accounting transaction. | Useful future traceability link; current UI must explain where the operator goes next. |
| Approved hours → payroll | X: wage/employee/fringe/deduction/period evidence absent. | Work logs are usable input, not certified payroll. |
| Returned hours → corrected submission | No edit/resubmit/link-to-correction command was found. | P2 ambiguous recovery workflow: clarify append-only correction linkage versus explicit resubmit design. |
| Accepted scope change → revised contract/budget | M/X: recorded scope decision only. | Costed CO and revised-contract chain remain a parity block. |
| Document expiry → review | Source appears in dashboard overdue; maintenance can save renewal notices. | Neither saves nor notices prove recipient delivery or renewed coverage. |
| Agenda item → exact source | Owning module/project generally opens; recordId is not passed as a focus anchor. | P2: large same-project ledgers can force searching after a source click. |
| Corporate module → project filter | Explicit company-wide contract; inherited scope cleared. | Avoid reintroducing a selector that is ignored. |
| Unknown ERP command → module switch → replay | G: parent retained intent, exact same key/body, one record. | Full route/reload/close remains outside guarantee; do not promise durable browser recovery. |
| Unknown upload → resume work | Manual Refresh/operator guidance, local disable; server storage intent journal exists. | P1 recovery gap to exercise and resolve: no browser retained upload receipt/key and no positive “checked, safe to continue” transition. |

## F. What the 24 recent groups actually establish

Reports are ignored local evidence, not public customer data. Their paths/hashes identify the bounded earlier executions; they are not portable proof that a newly rebuilt binary was exercised.

| Evidence | Suite / group names | Established boundary |
| --- | --- | --- |
| F01 | Financial: dated-source-cohorts-and-twelve-month-chart | Source cohorts and 12 native month buttons; separate audience totals. Sources include API fixture setup. |
| F02 | executive-widgets-and-interactive-month-handoff | Compact KPIs, month handoff, source calendar/day selection and quick access. |
| F03 | source-backed-planning-and-linked-invoice-deduplication | GUI plan creation/cancellation; linked invoice contributes once; period retained. |
| F04 | conditional-proposal-assumptions-and-version-conflict | GUI percentages/timing/removal, exact cents, separate scenario; preserved draft and explicit load-current. Proposal creation/sending decisions are not thereby GUI-certified. |
| F05 | explicit-completion-does-not-create-financial-records | GUI completion evidence/date; no new invoices/payments. Closing project is separately prepared. |
| F06 | provider-effective-date-and-obligation-delta | Provider-authorized synthetic invoice/source delta and report separation; not every invoice-entry control. |
| F07 | external-role-boundaries | Internal navigation/data absent, planning/completion actions denied to external roles in exercised cases. |
| F08 | urgent-followups-complete-list-and-overdue-expiry | Urgent item precedes low-priority titles, full list reachable, unresolved expiry retained. |
| F09 | weekly-cash-detail-and-evidenced-monthly-projects | Exact synthetic effective-date/week result and project inclusion reasons; changing month changes report. |
| F10 | touch-keyboard-and-six-responsive-sizes | Dashboard/financial controls at exercised widths, touch/keyboard browser emulation; no physical-device claim. |
| U01 | Utility: blank-project-gui-preserves-unknowns-and-requires-budget-approval | Blank new project, empty action/unknown progress/budget; missing evidence 422; sourced approved zero accepted. |
| U02 | crm-companywide-stage-owner-search-zero-estimate | Request create/edit workflow, search, assignment and sourced zero value. |
| U03 | hours-gui-review-iso-week-exact-exports | Dated work entry/review, exact grouping and CSV/JSON outputs. |
| U04 | purchase-order-numeric-persistence-and-cas | PO create, zero/seven sourcing fields, persisted source/document/sheet/lead time and dirty-draft conflict recovery. Not full PO lifecycle/cancellation. |
| U05 | role-privacy-and-private-work-log-exports | Selected client/provider forbidden/allowed paths and own work export. |
| U06 | all-module-navigation-six-viewport-sizes | 132 module/viewport pairs: 22 destinations × six sizes, no page overflow. This is destination/layout coverage, not mutation coverage. |
| C01 | Corporate: corporate-meeting-create-update-state-reload | Meeting create/edit/completed state with owner/notes and reload. |
| C02 | followup-priority-dates-notes-state-and-filters | Follow-up creation/edit, in_progress/completed and exercised filters. |
| C03 | corporate-agenda-clears-inherited-project-scope | Company-wide module scope after project-selected navigation. |
| C04 | corporate-agenda-internal-only-and-responsive | External-role exclusion, twelve expanded layouts and exercised filter recovery. |
| C05 | unauthorized-state-action-control | Rejected unauthorized corporate state action. |
| R01 | Recovery: lost-response-unmount-global-replay | Real synthetic server commit, abort browser reply, change module/project, same body/key replay once; original receipt version 2 and fresh version 3. |
| R02 | mounted-form-local-retry-notification | Existing form receives confirmed replay, clears uncertainty and unlocks input. |
| R03 | definitive-409-releases-journal | Actual stale CAS returns 409; journal released, draft held until explicit discard. |

Receipt index, relative to .data/certification/:

| Suite | Receipt / artifact | SHA-256 |
| --- | --- | --- |
| Financial 10 | JOB_20261023_124534_3700; financial-dashboard-final-1792759532124/runtime-report.json | 8b106e5918c758c244adaa7988c1f8e2463c5ca395803722fc4ab6957f1a9330 |
| Utility 6 | JOB_20261023_124930_9800; module-utility-final3-20261023T1250/runtime-report.json | 4c4dc9fd02c36496c34d36d443b5aec425fa5d18c71633cdb3d9687eba72d374 |
| Corporate 5 | JOB_20261023_124931_1000; corporate-agenda-final3-20261023T1250/runtime-report.json | 7e3ca20d7ad606cfc1220e4995ec6816996c14359919edba44bb17e18e8ae62c |
| Recovery 3 | JOB_20261023_124552_4900; command-retry-production-final-20261023T1248/report.json | 6bb4dad8d43c15a559895b6c6d41f93ad5100578a112d6408c24fc5c8aa19870 |

Sources: [financial GUI](../tests/financial-dashboard-ui.mjs), [module utility GUI](../tests/module-utility-ui.mjs), [corporate agenda GUI](../tests/corporate-agenda-ui.mjs), [request recovery GUI](../tests/command-retry-ui.mjs). The four reports had empty recorded browser/runtime error arrays. “No errors recorded” applies to their exercised paths, not to all source branches.

Older evidence remains useful for its own build: account security, public intake, private document access/lifecycle, three-offer bidding and PO states, dossier downloads, financial exports, estimates, hydration and public/navigation accessibility. See [verification history](verification.md). This review does not relabel those older receipts as current full-admin verification.

## G. Missing interaction coverage and product priorities

The following are **actual available interactions without fresh complete-path evidence in the 24 groups**, not unsupported declarations that their implementation is broken.

| Priority / gap | Repro or required observation | Next bounded proof |
| --- | --- | --- |
| P1 — New admin shell parity | Public topnav removal changes entry/return/navigation layout after the reference build. | Fresh/reload /portal and /account with admin/staff/client/provider; logo/home intent, account return, mobile sidebar, Escape/focus, keyboard, reduced motion, 200% zoom; no overlap/hidden controls/hydration regressions. Root owns implementation. |
| P1 — Upload unknown-result recovery | Abort browser response after real storage/registration; local unknown flag disables upload. A successful Refresh does not itself clear that flag. Server storage intent journal is separate from ERP journal. 503 paths also need explicit uncertain-versus-rejected treatment. | Use authorized isolated storage adapter/fixture. Prove registered/not-registered/orphan outcomes, one source identity, operator reconciliation and a visible safe continuation. No live customer upload needed. |
| P1 — Account/route leave while ERP intent unknown | R01 proves module changes, not leaving /portal. Account link/reload closes the in-memory owner. | Make the boundary visible and test safe leave/return/reconciliation. Do not persist private payload into localStorage merely to hide the gap. |
| P1 — Account authority changes through GUI | Assign/revoke project access, change partner role/link, suspend/reactivate, invitation accept/revoke, stale accessVersion, old-session replay. | Exercise each through /account against isolated genuine auth, observe immediate server denial/session revocation, then re-login/recover. Include lost response and no privilege escalation. |
| P1 — Document maintenance cockpit | Every delete/restore/hold/release/retention/purge branch, expiry scan and unavailable-file download is user-visible. | Full GUI + storage state + audit proof including hold conflicts, purge uncertainty and reason/version errors. Current unit/API coverage is a supporting layer, not this proof. |
| P2 — Blank next action versus status edit | New project allows empty nextAction; update_project and its current form require a nonempty next action. Status-only edit forces task text. | Decide whether next action is optional throughout or must be added deliberately at that stage; test unchanged blank, explicit clearing and dashboard follow-up consequences. |
| P2 — Source drilldown precision | Agenda passes owning view/project, not exact record anchor. Six same-project invoices or tasks can require searching again. | Define recordId focus/filter contract and prove source click→exact row→back to same date/month/scope. |
| P2 — Returned work-log correction | Returned source remains visible, but no edit/resubmit command exists. | Define append-only corrected record with previous source link, or versioned resubmit; prove weekly totals do not double count an ambiguous correction. |
| P2 — Commercial provenance handoffs | Accepted request/project creation, accepted proposal/budget approval and recovered estimate/existing project matching require re-entry/no durable join. | Add minimal explicit reviewed source links; unknown values remain unknown; never copy acceptance into approval or cash. |
| P2 — Full project work cycle | Schedule/milestone/contact/visibility, notes, client change decision, proposal lifecycle, bid award/PO cancellation and invoice payment/void each have available controls beyond recent groups. | One bounded group per meaningful outcome, same source→UI→server→downstream report→return; role and stale/invalid branches included. |
| P2 — Export and summary failure cockpit | Download links and malformed aggregate boundaries have server contracts but incomplete final GUI error interaction. | Wrong/expired actor, missing project, invalid period, malformed source, aggregate overflow; visible correction path with no fake zero or misleading success filename. |
| P2 — Presentation semantics | Team hours/Project requirements & certifications/Takeoff titles can be read as payroll/tax/live integration promises. Boundaries exist in copy, but comprehension was not measured with the actual user. | Task-based user review: identify what is a recorded fact, estimate, decision, obligation, transfer and unavailable capability before starting costly integrations. |

Unconfirmed external blocks are X, not bugs to fill with dummy data: actual QuickBooks Online/Desktop choice, approved account mappings, signed contract/SOV/retainage/prior certified applications, real payroll/rates/fringe/deductions, tax/TERO eligibility and rates, bank reconciliation, real email/blob/cloud delivery, live Takeoff/CAD/run provenance.

## H. VMOF product review

Classification: existing stateful operations product; decision is how to close the admin experience without turning attractive module navigation into an unsupported completeness claim. Critical flow: **source intent → allowed mutation → observed state → meaningful downstream report → recover/return**.

| Connection | VMOF state / rapid diagnosis | Effect on value |
| --- | --- | --- |
| Authorized ERP record → chart/source → module | FLUIDO within exercised scope; protect evidence and labels. | User can explain reported values and act. |
| Request → project → approval provenance | RESISTENCIA, R5 alignment risk from manual re-entry. | Work exists but source traceability costs effort; not grounds for automatic financial conversion. |
| Upload unknown outcome → safe continuation | CUELLO / potential LOOP, R1 blocked user + R6 storage dependency. | Needs a usable receipt/reconciliation path rather than repeated upload or permanent local disable. |
| Retained ERP intent → full-route account/reload | CUELLO, R2 single mounted owner. | Module change is safe; leaving its owner needs explicit recovery design. |
| Work-log returned → corrected reviewed source | ROTO for a distinct resubmission interaction, R1 product contract missing. | A real correction cannot be represented as an automatic state transition today. |
| User asks “administration fully evaluated” → 22 navigation checks | FUGA/R5 if used as completion evidence. | Counts hide unexercised writes and failures; map per transition instead. |
| Live accounting/payroll/tax requests | R6 dependency with legitimate unavailable inputs. | Keep source registers useful while separating external contracts. |

Compact alternatives (heuristic 0–5 per column, not measured product scores):

| Option | Impact | Feasibility | Flow unlock | Integration / recovery | Total /20 | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Remove header and call all administration tested | 2 | 5 | 1 | 1 | 9 | Reject: changes chrome while leaving flow/evidence gaps. |
| Map actual contracts, verify shell and close P1 recovery/authority paths first | 5 | 4 | 5 | 5 | 19 | Recommended bounded sequence. |
| Build all advanced payroll/tax/accounting functions immediately | 4 | 1 | 2 | 1 | 8 | Defer until source/input/integration contracts exist. |

First step after the shell change: exercise the affected shell and account return paths on a frozen build; then implement/test the upload uncertainty cockpit. This unlocks source intake without replacing evidence boundaries with defaults. Discovery: cross-module recovery and cross-route recovery have different owners and must not share one blanket success statement.

## I. Aerospace review: defenses and required observations

This applies proportional failure analysis to a business application. It is not an aviation/regulatory certification.

~~~mermaid
flowchart LR
  L1["1 Preflight: actor, tenant, source, dates, cents, storage config"] --> L2["2 Operation: allowed transition, version, transaction, idempotency"]
  L2 --> L3["3 Detect and isolate: 4xx vs unknown, no widened scope, source warning"]
  L3 --> L4["4 Recover: same intent, explicit correction, storage receipt/operator path"]
  L4 --> L5["5 Observe: saved record, audit, download, downstream totals, return context"]
  L5 --> Gap{"Observed effect matches contract?"}
  Gap -->|No| Repair["Retain evidence; fix or revise contract"]
  Repair --> L1
  Gap -->|Yes in scope| Record["Attribute exact build, actor, fixture, test and limits"]
~~~

| Failure | Detector / isolation | Recovery | Evidence still needed |
| --- | --- | --- | --- |
| Invalid source/date/cents | Server rejects or report excludes with warning. | Preserve input; correct actual source, do not infer zero/date. | Representative invalid GUI paths for every high-value mutation. |
| Tenant/role changed | Current session authority checked at read/write/replay. | Deny; re-authenticate/reassign via authorized admin. | End-to-end account GUI changes plus affected old tabs/devices. |
| Stale record | Version mismatch, 409, updated snapshot. | Preserve draft; explicit discard/load-current. | R03 establishes representative ERP path; account/maintenance forms differ. |
| Reply lost after commit | ERP key/body retained above module subtrees. | Same intent replay and fresh snapshot. | R01/R02 establish mounted path; route/reload/upload surfaces remain separate. |
| Storage partial effect | Private server upload intent or unconfirmed purge receipt; file stays private/unavailable. | Operator reconciliation; no blind repeat/purge success claim. | Real mechanism under isolated storage and GUI recovery. |
| Provider unavailable | Explicit not_configured/503, bounded worker retries/age. | Keep durable source; expose needs_attention and inspect receipt. | Local failure controls, plus external environment only when authorized/configured. |
| Summary cannot be trusted | Financial boundary/warning rather than guessed totals. | Choose period/source review; open ledger. | Failed aggregate GUI, report/date recovery and exact download behavior. |
| User leaves the task | Component/route lifecycle, current context loss. | Explicit navigation contract and recoverable receipt where promised. | Fresh shell/back/account/reload/close behavior per role. |

Eight assurance states are not all checked by a passing build:

| State | Current assessment for whole administration |
| --- | --- |
| Repaired | Individual corrected defects have scoped proofs; open P1/P2 items remain. |
| Optimized | No complete workload/performance benchmark or production capacity claim in this review. |
| Documented | This map inventories all 22 destinations and manual/error boundaries; keep it synchronized with new commands. |
| Tested | 160 domain tests and 24 recent groups exist for their build; numerous explicit GUI branches remain U. |
| Executed | Selected real local HTTP/DB/browser operations observed; not a complete production workflow. |
| Supervised | Record audit and local receipts exist; provider operations/alerts/on-call expectations are not comprehensively exercised. |
| Secured | Source authorization and scoped negative tests exist; this is not a new full security certification. |
| Final state | Whole-admin completion is withheld; only named bounded flows may close after attributed evidence. |

## J. Next verification contract and return criteria

For each bounded group preserve **transition ID → input/source → role/project/month → actual control/API → before/after state → audit/receipt → downstream effect → return/error observation**. API fixture setup must be marked as setup; it is not GUI command coverage.

1. Freeze source/build and identify the host/fixture. Use fresh synthetic project/reference IDs and existing isolated accounts; do not mutate the customer's estimating archive to fill empty states.
2. Validate successful visible action and a relevant rejected action. Confirm both HTTP outcome and persisted/source state.
3. Exercise uncertain/partial outcome for an effectful boundary; cancellation of waiting is not rollback.
4. Verify the next module/report consumes the same source with its correct business meaning.
5. Return to the originating scope/month/record where promised; test keyboard/mobile/focus and readable empty/error states.
6. Record exact test/build/report hash and limits; mark affected prior evidence stale when contracts change.

Surface parity: GUI and HTTP are required for interactive admin commands; CLI is required for documented operator import/reconciliation/backup tasks. This product exposes no supported public MCP administration surface, so MCP parity is not claimed. Human comprehension of business phases and error recovery remains an explicit UX review with the intended operator.

The desired finish is an administration where a user can complete and recover the actual business task. A complete diagram or a count of destinations is a design artifact; only observed transitions and effects close the corresponding product promise.

## K. Subsequent shell evidence and planned repairs

After the reference business build, T38's shell-only production build `h_xlMVeTRUaefu04rKTke` passed the five bounded read-only groups recorded in [verification](verification.md#administration-shell-and-product-flow-review--2026-10-23). They cover server-rendered private/error chrome, public-page chrome, client transitions, 132 module navigation/focus checks and role/layout guards. Root separately observed the 22 module destinations with Daedalus and repeated a final-build private/mobile smoke. This closes the specific header/gap defect; it does not close every P1 shell scenario listed above (for example 200% zoom), account writes, storage mutations or business handoffs.

Planned repairs are tracked in Soul Ledger: **T39 / 25121** context/period/exact-record navigation; **T40 / 25122** explicit reviewed commercial provenance; **T41 / 25123** financial hierarchy and recovery boundaries, requiring atomic subdivision before implementation. These blocks are planned, not implemented by this analysis. The broader untested groups in G remain visible; this is not a replacement for their required evidence.
