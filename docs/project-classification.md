# Project classification and requirements

Classification describes recorded project facts; it does not issue a certification or decide which law applies.

| Axis | Values | Purpose |
| --- | --- | --- |
| Contracting type | Unknown, private, federal, state, local, tribal, mixed | Who contracts or owns the work |
| Funding | Unknown, private, federal, state/local, tribal, mixed | Funding reviewed independently of the contracting party |
| Labor arrangement | Unknown, union, non-union, mixed | Project labor conditions, independent of ownership and funding |
| Jurisdiction | Source-backed text | State, municipality, tribal or other jurisdiction relevant to the project |

A federal project may be union or non-union. A privately contracted project may receive federal assistance. The [Department of Labor DBRA overview](https://www.dol.gov/agencies/whd/government-contracts/construction) describes covered federally funded/assisted work; coverage depends on the actual program, contract and work. The [DOL coverage guide](https://www.dol.gov/agencies/whd/government-contracts/prevailing-wage-resource-book/dbra-coverage) documents exceptions and distinctions. This product stores the team's reviewed basis rather than encoding a universal legal rule from a project label.

## Recorded workflow

~~~mermaid
flowchart LR
  Source["Contract, funding documents and labor agreement"] --> Review["Team records independent axes, jurisdiction and source"]
  Review --> Project["Versioned project classification and review history"]
  Project --> Filter["Project portfolio filters by type and labor arrangement"]
  Project --> Register["Open requirements for this exact project"]
  Register --> Pending["Create manual requirement with category, authority and source"]
  Pending --> Decision["Review evidence and date: complete, not applicable or unresolved"]
  Decision --> Source
~~~

Create a project with Unknown defaults when its facts have not been reviewed. Existing projects remain unclassified; no migration guesses a classification from project names or estimating archives. Known axes or a jurisdiction require classificationSource. A dedicated update changes classification without forcing a status/progress/budget edit. Current version and the ordinary idempotency contract apply; server time and actor identify the review. History is bounded to100 reviews. Internal evidence, reviewer and history are withheld from external project payloads; assigned clients/providers may see classification axes and jurisdiction only.

The Projects view offers separate type/labor filters, result counts and a clear path. Select a project and open Project requirements & certifications to keep its project scope. Requirements are explicit records: general, contract, license, insurance, bond, prevailing wage, payroll, labor agreement, safety, tax or tribal, with optional authority. Older items without category remain General. Completed and not-applicable decisions require review evidence and a review date. A completed item means the team's recorded review, not legal approval by an agency.

There are no automatic wage determinations, union eligibility decisions, tax exemptions, government submissions, contract certifications or payroll filings in this feature. Sources and requirement records are editable business data. Enum labels/categories are shared interface metadata, not hardcoded project records or approved rules. Review actual obligations with the responsible contracting party and the source documents before marking a requirement complete.

## Verification boundaries

T42 adds domain coverage for independent axes, evidence validation, legacy defaults, role/tenant denial, version conflicts, replay and privacy. The project classification GUI suite exercises its enumerated controls using isolated synthetic records. See [verification](verification.md) for final receipts. Real private estimating data is not altered by this feature or by its tests.
