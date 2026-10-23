# Data sources and reusable project setup

## Operational data

The portal reads authorized company/project records from the private ERP database. Projects, proposals, invoice amounts, dated payments, work logs, teams, corporate meetings and follow-up priorities are not lists embedded into dashboard components. Reporting takes the authorized snapshot and its explicit timestamp; a month filter changes a view rather than inventing missing history.

A source-backed estimate archive is an import with its own source/version/hash. It is not a startup seed, approved project budget or accounting receipt. A new project does not inherit the Son of Star archive, financial totals, progress or assignments. Synthetic browser fixtures live only under ignored local certification paths.

## Configuration and rules

Public TAYCO identity, contact and coverage information is centralized in lib/company.ts. Branding assets and styles are presentation configuration; statuses, permissions, validation limits and arithmetic rules remain explicit code contracts. These are different from operational customer records. Never move authorization or arbitrary executable logic into editable project templates.

## Add a project without editing source

1. Open Projects and Add a project. Enter its name and, when known, its next action; location/client and a genuinely approved budget are optional. An unknown budget stays absent. Entering any budget, including an explicit zero, requires its approval source and date. New-project progress stays unrecorded until an operator records it. An omitted next action stays blank instead of generating a generic follow-up task.
2. Add explicit schedule/milestones, contacts and responsible staff in its project record.
3. Add only the proposal, invoice, dated payment, source-backed estimate and planning records that actually belong to that project. Creating a project creates none of these financial records automatically.
4. Select its project scope to inspect the resulting dashboards. Month membership comes from dated evidence/schedule, not its current active status alone.
5. Corporate meetings and follow-ups live in explicitly company-wide modules. Their notes, responsible account, dates and priorities can be changed from the GUI.

QuickBooks has been identified as the accounting system, but its Online/Desktop variant and authorized account mappings are still needed before choosing a real connector. Local records/exports remain useful independently of that connection.

## Verification boundary

Source inspection and synthetic independent-project tests verify reusable data paths. They do not certify arbitrary legacy imports, customer-entered accounting accuracy or live external synchronization. Current verification receipts are in verification.md.
