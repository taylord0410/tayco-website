"""Private M02 preparation: exact archive plus a precision-safe consumer projection. No ERP writes."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile

from inspect_m02 import (
    PreflightError, MAX_JSON, MAX_ARTIFACT, bounded_bytes, confined, fail,
    inspect_package, sha, strict_json,
)

PACKAGE_NAME = "received-package.json"


def projection(package):
    """Numeric values become display strings only after source digest validation."""
    measurements, documents = [], []
    for context in package["contexts"]:
        for doc in context["documents"]:
            identity = {"contextKey": context["contextKey"], "documentId": doc["documentId"],
                        "pdfSha256": doc["pdfSha256"], "documentRevision": doc["documentRevision"]}
            documents.append(identity)
            for page in doc["pages"]:
                for region in page["regions"]:
                    for measurement in region["measurements"]:
                        measurements.append({
                            **identity, "pageNumber": page["pageNumber"], "viewportId": region["viewportId"],
                            **{key: measurement[key] for key in (
                                "stableId", "measurementId", "revision", "method", "unit",
                                "reviewStatus", "physicalScopeId", "scopeRelation", "additive")},
                            "quantity": None if measurement["quantity"] is None else str(measurement["quantity"]),
                            "pendingReason": measurement.get("pendingReason"),
                            "assumptions": measurement.get("assumptions", []),
                            "evidence": [{key: ev[key] for key in (
                                "evidenceId", "kind", "pageNumber", "artifactRef")} for ev in measurement["sourceEvidence"]],
                        })
    if len(measurements) > 10000:
        fail("measurement_limit")
    lines = []
    for line in package["boqLines"]:
        lines.append({
            **{key: line[key] for key in (
                "lineId", "revision", "scope", "description", "unit", "measurementRefs",
                "aggregationRule", "inclusionStatus", "pricingState")},
            "quantity": None if line["quantity"] is None else str(line["quantity"]),
            "rate": None if line.get("rate") is None else str(line["rate"]),
            "currency": line.get("currency"), "priceSourceRef": line.get("priceSourceRef"),
        })
    if len(lines) > 10000:
        fail("boq_limit")
    return {"documents": documents, "measurements": measurements, "boqLines": lines,
            "reviewBasis": "producer_reported_not_independently_approved"}


def archive_root(path):
    candidate = Path(path)
    if not candidate.is_absolute():
        fail("archive_root")
    # Operator selects a private directory. Never follow a redirected archive root.
    for entry in (candidate, *candidate.parents):
        if entry.is_symlink():
            fail("archive_root")
    candidate.mkdir(parents=True, exist_ok=True, mode=0o700)
    if not candidate.is_dir():
        fail("archive_root")
    return candidate.resolve(strict=True)


def copy_artifact(source, destination, expected_sha, expected_bytes):
    digest = hashlib.sha256()
    count = 0
    destination.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
    with source.open("rb") as reader, destination.open("xb") as writer:
        os.chmod(destination, 0o600)
        while block := reader.read(1024 * 1024):
            count += len(block)
            if count > expected_bytes or count > MAX_ARTIFACT:
                fail("artifact_bytes")
            digest.update(block)
            writer.write(block)
        writer.flush()
        os.fsync(writer.fileno())
    if count != expected_bytes or digest.hexdigest() != expected_sha:
        fail("artifact_digest")


def archive_package(package_path, contract_root, bundle_root, manifest_sha, destination_root):
    first = inspect_package(package_path, contract_root, bundle_root, manifest_sha)
    raw = bounded_bytes(package_path, MAX_JSON)
    if sha(raw) != first["packageSha256"]:
        fail("source_changed")
    package = strict_json(raw)
    prepared = projection(package)
    if len(json.dumps(prepared, ensure_ascii=False).encode()) > 16 * 1024 * 1024:
        fail("projection_limit")
    root = archive_root(destination_root)
    key = first["packageSha256"]
    target = root / key

    def read_existing():
        if target.is_symlink() or not target.is_dir():
            fail("archive_collision")
        existing = confined(target, PACKAGE_NAME)
        receipt = inspect_package(existing, contract_root, bundle_root, manifest_sha)
        if receipt["packageSha256"] != key or receipt["payloadDigest"] != first["payloadDigest"]:
            fail("archive_integrity")
        return {"schemaVersion": "tayco-m02-prepared/v1", "archiveKey": key,
                "archiveState": "existing_verified", "receipt": receipt, **prepared}

    if target.exists() or target.is_symlink():
        return read_existing()
    # Only own newly created staging directories can be cleaned up.
    stage = Path(tempfile.mkdtemp(prefix=".m02-stage-", dir=root))
    if stage.resolve().parent != root:
        fail("archive_root")
    try:
        package_file = stage / PACKAGE_NAME
        with package_file.open("xb") as stream:
            os.chmod(package_file, 0o600)
            stream.write(raw)
            stream.flush()
            os.fsync(stream.fileno())
        refs = {}
        for artifact in package["artifactManifest"]:
            ref = artifact["relativePath"].replace("\\", "/")
            folded = ref.casefold()
            if folded == PACKAGE_NAME or folded.startswith(PACKAGE_NAME + "/"):
                fail("archive_reserved_path")
            if folded in refs:
                if refs[folded] != (ref, artifact["sha256"], artifact["bytes"]):
                    fail("archive_path_collision")
                continue
            refs[folded] = (ref, artifact["sha256"], artifact["bytes"])
            source = confined(Path(package_path).parent, ref)
            destination = stage.joinpath(*ref.split("/"))
            if not destination.resolve().is_relative_to(stage.resolve()):
                fail("artifact_path")
            copy_artifact(source, destination, artifact["sha256"], artifact["bytes"])
        final = inspect_package(package_file, contract_root, bundle_root, manifest_sha)
        if final["packageSha256"] != key or final["payloadDigest"] != first["payloadDigest"]:
            fail("archive_integrity")
        # Both checked absolute paths stay in the operator's chosen archive directory.
        if stage.resolve().parent != root or target.parent != root:
            fail("archive_root")
        try:
            os.rename(stage, target)
        except OSError:
            # A concurrent writer can win; never replace it, only verify its exact bytes.
            if target.exists():
                return read_existing()
            raise
        if os.name != "nt":
            directory = os.open(root, os.O_RDONLY)
            try:
                os.fsync(directory)
            finally:
                os.close(directory)
        return {"schemaVersion": "tayco-m02-prepared/v1", "archiveKey": key,
                "archiveState": "created_verified", "receipt": final, **prepared}
    finally:
        if stage.exists():
            resolved = stage.resolve()
            if resolved.parent != root or not stage.name.startswith(".m02-stage-") or stage.is_symlink():
                fail("archive_cleanup_boundary")
            shutil.rmtree(stage)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for key in ("package", "contract-root", "bundle-root", "manifest-sha256", "archive-root"):
        parser.add_argument("--" + key, required=True)
    args = parser.parse_args()
    try:
        result = archive_package(args.package, args.contract_root, args.bundle_root,
                                 args.manifest_sha256, args.archive_root)
        print(json.dumps(result, ensure_ascii=False, sort_keys=True))
        return 0
    except PreflightError as error:
        print(json.dumps({"result": "rejected", "code": str(error)}))
    except Exception:
        print(json.dumps({"result": "rejected", "code": "preparation_failed"}))
    return 1


if __name__ == "__main__":
    sys.exit(main())
