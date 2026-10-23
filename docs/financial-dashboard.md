# Financial dashboard and next-period planning

The internal Finance dashboard is a direct workspace destination. It provides twelve-month invoice/payment evidence, selected-month sources, dated project completion and the next-period planning scenario. It does not replace the external client's narrower Financial overview.

```mermaid
flowchart TD
  Session[Individual authenticated internal account] --> Scope[Authorized company and selected project records]
  Scope --> Month[Choose reporting year, month and financial audience]
  Month --> Actual[Monthly invoice cohorts and dated payment evidence]
  Month --> Completion[Projects with an explicit actual completion date]
  Month --> Next[Next calendar month; current snapshot date displayed]
  Next --> Due[Approved invoices: validated outstanding amount and due date]
  Next --> Plan[Source-backed dated project plans]
  Due --> Dedup[Linked invoice plans excluded from additional plan totals]
  Plan --> Dedup
  Next --> Pending[Sent proposals with explicit billing date and assumptions]
  Pending --> Weight[Amount times allocation times probability; round exact cents once]
  Dedup --> Base[Planned client collections, supplier payments and internal costs]
  Weight --> Opportunity[Separate conditional proposal opportunity]
  Next --> Missing[Missing dates, unsupported history and assumptions remain visible]
```

## Meaning and boundaries

1. The monthly chart uses the existing canonical invoice/payment model. Client, supplier and internal directions remain separate. An invoice's current approval status is not a bank transaction.
2. A project's completion month requires a recorded completion date and evidence. Closing its status or setting progress to 100% does not invent a date, invoice or collection.
3. Approved invoice balances due next month can inform planning only when their amount and payment history are valid. Paid flags without usable history, undated sources and malformed histories require review.
4. A project plan has an explicit direction, amount, due date and source. Plans linked to an invoice are not added a second time. Unlinked plans can describe distinct planned work; their source and potential overlap remain an operator responsibility.
5. Proposal opportunity requires explicit expected billing date, allocation percentage, probability percentage and assumption source. Drafts, declined/withdrawn/accepted decisions and unconfigured assumptions do not silently become forecast cash. No automatic probability is inferred from a sales stage.
6. The next-month view uses the current authorized snapshot. Selecting a past reporting month does not reconstruct an old forecast or an old month-end balance.

## Durable edits

```mermaid
flowchart LR
  Form[Planning or assumption form] --> Request[Retained request reference]
  Request --> Guard[Internal role, company/project, valid dates, cents and version]
  Guard -->|valid| Save[Atomic record and audit]
  Save --> Refresh[Refresh existing workspace data and retain selected month]
  Guard -->|invalid or stale| Correct[Preserve form; explain conflict or missing evidence]
  Save --> Cancel[Cancel plan or clear pending-proposal assumptions with reason]
```

No planning edit initiates a payment, sends a proposal, contacts a provider, modifies the estimate archive or posts an accounting transaction. Completion evidence, plan sources and assumption history remain internal; externally assigned users receive only their existing authorized project fields.

## Review of the design

The useful flow is month → direction → source → next-period assumption → correction. The primary failure modes are double counting, missing payment timing, inferred completion, uncertain proposals masquerading as committed receipts, and external users receiving internal cost assumptions. Validation rejects invalid inputs; the report excludes ambiguous sources with visible coverage notes; source drilldowns and versioned edits provide recovery. Model tests and authenticated GUI checks must verify these behaviors before this capability is marked complete.

## Client dashboard hierarchy and interactive months

The executive dashboard follows the client reference: current TAYCO logo, four source-backed indicators, a twelve-month chart, dated agenda, quick access, follow-ups and a next-month calendar. Invoice issuance is labelled as invoice records rather than assumed bank revenue. Each month opens the financial dashboard with that exact year and month.

The monthly detail groups dated client payment receipts and provider payment entries into Monday–Sunday weeks clipped to month boundaries. Their difference is a recorded cash movement result, not accrual profit: unknown payroll, overhead, taxes and unclassified internal entries are not silently treated as zero costs. Issued invoices remain separate from cash movement. Voided, duplicate and future payment sources follow the canonical reporting validation.

Projects belong to the month only through recorded schedule overlap, dated milestones, work logs, invoice issuance/payment, proposal activity or evidenced completion. Current active status and creation timestamp do not reconstruct historical project activity. Each card states its inclusion evidence and opens the project.

## Corporate meetings and next-month follow-ups

Corporate meetings and follow-ups are company-wide internal operational records. Their modules explicitly display company scope and do not offer a project filter that would leave the list unchanged. Their dates, optional local meeting time, location, responsible internal account, notes and priority are stored with version checks and idempotent request references. Meeting states (scheduled/completed/cancelled) and task states (open/in progress/completed/cancelled) are explicit; state changes retain a reason. These records do not send invitations, reminders or calendar notifications.

```mermaid
flowchart TD
  Executive[Executive overview] --> Month[Choose any of twelve months]
  Month --> Financial[Exact selected year and month]
  Financial --> Weeks[Weekly receipts / provider payments / recorded cash result]
  Financial --> Projects[Project cards with dated inclusion evidence]
  Executive --> Agenda[Corporate meetings and follow-up priorities]
  Agenda --> Edit[Date, responsible account, notes, priority]
  Edit --> Guard[Internal role / source validation / record version]
  Guard --> Save[Atomic record, audit and request receipt]
  Save --> Next[Next-month calendar and follow-ups]
  Edit --> Unknown[Response lost or server outcome unknown]
  Unknown --> Retain[Workspace retains exact body and idempotency key]
  Retain --> Retry[One retained request; other writes held]
  Retry --> Receipt[Original receipt plus refreshed observed snapshot]
```

Pending request recovery survives changing modules or project selection inside the mounted authenticated workspace. It intentionally does not place private mutation payloads in browser storage; closing/reloading the workspace is a separate recovery limitation, not a durable offline queue.
