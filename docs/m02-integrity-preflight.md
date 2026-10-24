# M02 integrity preflight

The local operator can inspect an inert M02 package before the T69 receiver accepts it:

    python -B scripts/inspect_m02.py --package <private-package.json> --contract-root <reviewed-M02-integration-folder> --bundle-root <original-source-bundle> --manifest-sha256 <trusted-original-manifest-SHA256>

Python 3.10+, jsonschema and pypdf are required. This command reads files and prints one JSON receipt. It does not open an auth or ERP database, create projects, persist measurements, issue invitations or change recipient policies. Keep receipts and source evidence private.

The contract installation is explicit. The command checks the reviewed handoff, validator, schema and normative README hashes before executing the captured validator bytes. It reuses the agreed producer canonicalization, including the distinction between JSON numbers and decimal strings. A changed contract fails closed until reviewed; there is no latest-version download or dependency installation. The schema validator uses the already captured, hash-checked schema, with only local references.

The caller supplies the original source-manifest digest from trusted source provenance. Copying a manifest pin from the incoming package is insufficient. Active delivery pins can differ after an intentional bundle extension; this check proves original source identity, not current ERP membership or access. The receiving transaction must separately resolve the exact existing project/document mapping and recheck active records.

Preflight verifies:

- Original JSON size, duplicate keys and finite numbers; producer schema and semantic checks.
- Confined artifact paths, no symbolic links, exact artifact sizes and SHA-256. Individual artifacts are capped at 256 MiB and their sum at 512 MiB.
- Exact source context/document/PDF binding in the hash-locked manifest, PDF media type, actual bytes/hash and page count.
- Actual one-based PDF pages, crop-local unrotated dimensions, crop box, separate original rotation and native-to-crop translation. Geometry is already normalized; its transform is not applied twice. Non-unit PDF UserUnit is rejected pending an explicitly reviewed conversion.
- At most 64 document entries, 512 MiB per PDF and 1 GiB total PDF bytes. These receiver limits are intentionally narrower than the general M02 structural maximum.

The receipt's measurement and BOQ states are explicitly **producer reported**. Matching PDF metadata and artifact hashes does not establish that an image represents its claimed region, that dimension labels were read correctly, or that quantities, scope, procurement responsibility or prices are approved. It is not an overlay rendering test. An included producer BOQ line does not create an approved TAYCO estimate.

A receipt is an observation of the captured input bytes. It is not a durable archive or replay receipt. Before importing, T69 must archive/revalidate those bytes and artifacts, resolve existing project identities, enforce administrator/tenant authorization, and exercise transaction rollback, revision conflict, replay and console projection. No HTTP receiver is enabled by this command.

Run independent probes with the reviewed contract installed:

    TAYCO_M02_CONTRACT_ROOT=<reviewed-M02-integration-folder> python -B -m unittest discover -s tests -p test_m02_preflight.py -v

Set that environment variable using the host's normal environment mechanism. Probes generate their own PDFs and source manifest, and check numeric digest preservation, negative crop origin, wrong transform/rotation/dimensions/page, artifact changes/path escapes, contract tampering, source binding, pending quantities, nominal calibration and redacted CLI errors. The real symbolic-link probe reports an explicit skip on hosts that cannot create links; a separate guard probe still exercises the rejection branch. No private PDF or real source metadata is stored in these test fixtures.

## Private preparation for the receiver

A separate local operator command can retain the verified package and its evidence:

    python -B scripts/prepare_m02.py --package <private-package.json> --contract-root <reviewed-M02-integration-folder> --bundle-root <original-source-bundle> --manifest-sha256 <trusted-original-manifest-SHA256> --archive-root <private-absolute-directory>

This archive root must be an operator-controlled private directory, outside publicly served files. The command does not authenticate a TAYCO user; it is a local file operation, not an HTTP import endpoint. T69 must authenticate an administrator before invoking it and revalidate that exact session before committing ERP reception.

Preparation checks the source, captures its original JSON bytes, copies only referenced evidence into a new staging directory, flushes each file and revalidates the staged package before renaming it to its original-file SHA-256. It does not copy source PDFs, databases or secrets. Existing content is verified rather than overwritten or repaired. Concurrent cooperating writers converge on one verified directory. Caught pre-publication faults clean up only the newly owned staging directory; a process crash can leave staging debris, which is never treated as a complete archive. Filesystem power-loss recovery has not been certified. A failure after rename can leave a valid archive; retry verifies it and returns the existing result.

The archive keeps `received-package.json` byte-for-byte, with evidence at its original relative references. That filename is reserved; conflicting or case-fold-colliding references fail closed. A projection converts quantity and rate numbers to strings after validating the original digest. Large integer counts therefore do not round through JavaScript Number. Candidate quantities and separate provisional price evidence retain their producer states; no total or approval is calculated. This internal projection does not replace or redefine the M02 producer format.

The resulting archive key and receipt are preparation evidence. They do not create ERP receipts or measurements and do not prove transaction replay, an existing-project binding, current authorization, visual measurement review or distribution rights. All actual R3/TMAD packages remain unimported until the receiving transaction and console are separately exercised.
