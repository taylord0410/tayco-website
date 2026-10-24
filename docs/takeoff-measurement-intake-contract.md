# Takeoff measurements → TAYCO: consumer contract

Status: M02 producer/consumer format agreed and independently probed on 2026-10-24. This is not an implemented endpoint. Raw calibration/measurement/BOQ reception still needs an adapter, persistence tests and UI projection.

## Existing receiving path

- `lib/takeoff-estimate-source.ts:takeoffEstimateSnapshots` parses inert source bytes for an active scenario, structured executive BOQ export and optional APU.
- `scripts/import-takeoff-estimate.ts` inspects by default; apply requires an active administrator and a private source archive.
- The existing source schemas are `takeoff_active_scenario.v1` and `takeoff_apu_procurement.v1`, plus the report's structured financial payload and CSI table.
- ERP actions `restore_estimate_project` and `import_project_estimate` preserve versioned aggregate estimates. They are not a raw geometry, calibration or measured-quantity API.
- Estimate and source-document registration remain different operations. The imported Takeoff bundle is already pinned; a new measurement package must reference it rather than mutate it.
- The legacy estimate recovery matches `sourceProjectSlug`; document registration instead records `sourceContextKey` and exact bundle pins. Running legacy recovery blindly against a document-registered project can create a separate container. The adapter must resolve the existing TAYCO project through the exact source mapping and reject ambiguous bindings; it must not call project recovery merely because a measurement arrived.

Atlas12 owns producer extraction/calibration artifacts and its M02 schema. Atlas7 owns the TAYCO adapter, authorization, idempotent persistence and console projection. Agree the schema before creating another competing format.

## Minimum information required in the producer package

Field names may be mapped by the adapter; semantics must be explicit.

| Area | Required information |
| --- | --- |
| Envelope | Versioned schema, package ID/revision, UTC generation time, producer, exact source bundle/manifest digest, artifact manifest with SHA-256 and bytes |
| Identity | Source context key, viewer document ID, original PDF SHA-256; TAYCO project ID comes from the existing exact mapping, never a guessed name |
| Page | Explicit one-based PDF page number, sheet label when available, page dimensions, crop box and rotation; document revision must remain distinct from package revision |
| View region | Stable viewport/region ID and bounds; one sheet can contain multiple scales or details |
| Coordinate system | Explicit PDF points or normalized coordinates, origin, axis direction, page transform; DPI alone is not calibration |
| Calibration | Stable ID/revision, status, axis/method, anchors and dimension evidence, declared real length/unit, computed transform/scale, authority and review evidence |
| Measurement | Stable ID/revision, method (length/area/count/volume), source geometry, calibration reference where required, quantity/unit or explicit null, assumptions and review status |
| Deduplication | Physical scope/element identity, revision lineage, superseded/alias references, whether a measurement is additive or reference-only |
| BOQ line | Stable line ID/revision, project/scope/CSI description, unit, linked measurement revisions and aggregation rule, explicit inclusion status |
| Pricing | Separate price-source ID/SHA/revision, unit/currency/effective date/geography/scope; materials/labor/equipment and assumptions kept separate |
| Review | Pending reasons, evidence references and reviewer decisions; measurement approval is distinct from commercial approval |

No local absolute paths, secrets, document binaries or private customer details are embedded in repository fixtures. Evidence files travel privately and use relative, confined references.

## States and arithmetic

- A printed scale is a candidate until its dimension/evidence and applicable region are checked. A calibration copied from another page or region does not become confirmed automatically.
- Preserve pending, conflicting, rejected and superseded evidence for review. Pending/conflicting measurement quantity is null, never zero. A candidate may retain a provisional quantity with an explicit reason, but cannot contribute to an included BOQ line. A separately sourced candidate price is provisional and cannot produce a final total.
- Counts may not require a length calibration, but still need a traceable object/geometry selection and deduplication scope.
- Length requires a matching regional calibration; area and volume require dimensionally valid transforms and explicit additional dimensions.
- Preserve source and normalized units with a declared conversion. Do not add unlike dimensions or currencies.
- Deductions/openings and waste factors are explicit signed operations or named factors; do not silently take an absolute value.
- Do not add alternate revisions, drawing aliases, elevations and details as separate physical quantities.
- A measured quantity, its priced estimate and an approved contract are different records. Missing pricing does not prevent receiving measured quantities.
- The supplied bundle's two reference collections are not automatically measurable projects.

## Receiving sequence

```mermaid
flowchart TD
  A[Private versioned producer package] --> B[Read bounded inert bytes and verify digest]
  B --> C[Validate source bundle and exact document/page/region mapping]
  C --> D[Validate units geometry lineage and evidence]
  D --> E[Authenticated administrator dry-run]
  E --> F{Conflicts or malformed references?}
  F -- Yes --> G[Reject with bounded diagnostics; no writes]
  F -- No --> H[Archive exact source and commit transaction]
  H --> I[Stable identity plus content digest gives replay receipt]
  I --> J[Console: quantities, evidence and pending review]
  J --> K[Separately sourced pricing / estimate revision]
```

Same identity/revision and same digest returns the existing receipt. A changed payload under that identity conflicts; an explicit new revision must declare supersession. Replay after lost acknowledgment cannot create duplicate BOQ lines. Importing a later package cannot erase review decisions, replace source PDFs or silently expand guest grants.

## Required probes before claiming reception complete

1. Exact mapping and synthetic calibrated quantity persist; replay creates nothing new.
2. Changed same-revision bytes conflict and a failed transaction leaves no partial records.
3. Wrong PDF hash, unknown page/region, out-of-bounds geometry and wrong units reject.
4. Nominal-only calibration cannot yield a confirmed length or area.
5. Aliases/superseded revisions do not double count; reference-only source stays excluded from additive quantities.
6. Quantity-only lines remain usable with missing prices; unverified or incompatible prices never become a final total.
7. Administrator import and authorized console reading work; anonymous, other tenant/project and ungranted guest cannot retrieve source details.
8. Console visibly separates pending measurements, verified quantities, price evidence and independent estimate revisions.

## Agreed producer handoff

The received contract is `takeoff_measurement_package.m02`. The producer supplies a closed JSON Schema, an offline Python semantic validator, two synthetic examples and tests. Actual source measurements arrive as a separate pinned package. Synthetic examples must never be imported as real project evidence.

| Reviewed artifact | SHA-256 |
| --- | --- |
| Handoff manifest | `76949bde5fe03f999d3f9b4ffb1a496a75bb4732fd8da73d9bce1652c5cd3dab` |
| Semantic validator | `c02eb07c1f3cacdfdc9d38a770bc83c5076a7c03ef1c48a28bc877055d1c7be8` |
| JSON Schema | `4076bee8feea286cd953f21d4d8f06dcb57811494854e882f145f0033131c57f` |

All seven manifest entries were checked for SHA-256 and byte length. Source was inspected before offline execution; schema references are internal. Seven independent synthetic probes passed: baseline accepted; pending/conflicting non-null quantities rejected; candidate provisional quantity accepted with a reason; invalid generation time rejected; numeric quantity accepted without changing its payload identity; candidate measurement excluded from included BOQ quantities. The producer separately reports 34 passing tests; those are not represented here as an independently rerun suite.

Generation time must be a valid RFC3339 timestamp with a timezone. The payload digest is SHA-256 of the original JSON object without `payloadDigest`, serialized with the producer's sorted-key compact UTF-8 canonicalization; numbers and decimal strings remain distinct. Decimal arithmetic must not mutate the source object and invalidate its digest. The adapter must reuse that implementation or establish byte-compatible behavior with probes rather than assume JavaScript serialization is interchangeable.

Structural limits include 25 MiB canonical payload, 64 contexts, 128 documents per context and 1,024 pages per document, with bounded nested lists and strings in the pinned schema. The receiver must also bound the original input bytes before parsing and verify actual artifact containment, bytes and hashes. Successful semantic validation alone does not verify an artifact exists, authorize publication, approve pricing, establish real-world measurements or grant guest access.

TAYCO will adapt this agreed format rather than require raw geometry to masquerade as an aggregate estimate snapshot. Receipt replay/conflict handling, transaction rollback, exact existing-project mapping and authorized console projection remain implementation work under T69.

This contract does not authorize a Railway deployment, publish real quantities or supply a general TAYCO rate card.
