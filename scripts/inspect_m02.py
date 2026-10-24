"""Read-only M02 preflight. Does not import records, approve quantities or grant access."""
from __future__ import annotations

import argparse
import hashlib
import io
import json
import math
import re
import sys
import types
from collections import Counter
from decimal import Decimal
from pathlib import Path, PurePosixPath, PureWindowsPath

CONTRACT_MANIFEST_SHA = "a7587f0e3b737ed28d96162dd1133f89a136bceb0cf2f96562de935fb0912e4b"
VALIDATOR_SHA = "c02eb07c1f3cacdfdc9d38a770bc83c5076a7c03ef1c48a28bc877055d1c7be8"
SCHEMA_SHA = "4076bee8feea286cd953f21d4d8f06dcb57811494854e882f145f0033131c57f"
README_SHA = "d34b12f979304cab8df53efeb857b606b3fd8dcde66a512be0bc22c65219eb95"
MAX_JSON = 25 * 1024 * 1024
MAX_PDF = 512 * 1024 * 1024
MAX_ARTIFACT = 256 * 1024 * 1024


class PreflightError(ValueError):
    """Closed diagnostic codes; never echo source paths, customer text or documents."""


def fail(code):
    raise PreflightError(code)


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def bounded_bytes(path, limit):
    with Path(path).open("rb") as stream:
        raw = stream.read(limit + 1)
    if len(raw) > limit:
        fail("input_limit")
    return raw


def strict_json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                fail("duplicate_json_key")
            result[key] = value
        return result

    def invalid(_):
        fail("nonfinite_json_number")

    try:
        result = json.loads(raw.decode("utf-8"), object_pairs_hook=pairs, parse_constant=invalid)
        def finite(node):
            if isinstance(node, float) and not math.isfinite(node):
                fail("nonfinite_json_number")
            if isinstance(node, dict):
                for value in node.values():
                    finite(value)
            elif isinstance(node, list):
                for value in node:
                    finite(value)
        finite(result)
        return result
    except (UnicodeError, json.JSONDecodeError, RecursionError):
        fail("invalid_json")


def confined(root, reference):
    if not isinstance(reference, str) or not reference or "\x00" in reference or ":" in reference:
        fail("artifact_path")
    posix = PurePosixPath(reference.replace("\\", "/"))
    if posix.is_absolute() or PureWindowsPath(reference).drive or any(p in {"..", "."} for p in reference.replace("\\", "/").split("/")):
        fail("artifact_path")
    base = Path(root).resolve(strict=True)
    candidate = base.joinpath(*posix.parts)
    walk = base
    for part in posix.parts:
        walk /= part
        if walk.is_symlink():
            fail("artifact_symlink")
    resolved = candidate.resolve(strict=True)
    if not resolved.is_relative_to(base) or not resolved.is_file():
        fail("artifact_path")
    return resolved


def hashed_file(path, expected_sha, expected_bytes, limit):
    if not isinstance(expected_bytes, int) or isinstance(expected_bytes, bool) or not 0 <= expected_bytes <= limit:
        fail("artifact_limit")
    if not isinstance(expected_sha, str) or not re.fullmatch("[0-9a-f]{64}", expected_sha):
        fail("artifact_digest")
    digest = hashlib.sha256()
    count = 0
    with Path(path).open("rb") as stream:
        while block := stream.read(1024 * 1024):
            count += len(block)
            if count > expected_bytes or count > limit:
                fail("artifact_bytes")
            digest.update(block)
    if count != expected_bytes:
        fail("artifact_bytes")
    if digest.hexdigest() != expected_sha:
        fail("artifact_digest")
    return count


def load_contract(root):
    """Execute inspected, pinned bytes only; schema validation uses the same captured bytes."""
    from jsonschema import Draft202012Validator, FormatChecker
    root = Path(root)
    manifest_raw = bounded_bytes(root / "handoff_manifest.json", 64 * 1024)
    code = bounded_bytes(root / "calibration_boq.py", 128 * 1024)
    schema_raw = bounded_bytes(root / "schema/calibration_boq_v1.schema.json", 128 * 1024)
    readme = bounded_bytes(root / "README.md", 64 * 1024)
    if (sha(manifest_raw), sha(code), sha(schema_raw), sha(readme)) != (
        CONTRACT_MANIFEST_SHA, VALIDATOR_SHA, SCHEMA_SHA, README_SHA
    ):
        fail("contract_pin")
    schema = strict_json(schema_raw)
    def local_refs(node):
        if isinstance(node, dict):
            if "$ref" in node and not node["$ref"].startswith("#/"):
                fail("schema_external_reference")
            for value in node.values():
                local_refs(value)
        elif isinstance(node, list):
            for value in node:
                local_refs(value)
    local_refs(schema)
    validator = Draft202012Validator(schema, format_checker=FormatChecker())
    module = types.ModuleType("pinned_m02")
    module.__file__ = str(root / "calibration_boq.py")
    exec(compile(code, "<pinned-m02-validator>", "exec"), module.__dict__)
    module._schema_validator = lambda: validator
    return module


def check_pdf_frame(page, source_page):
    """M02 uses unrotated crop-local coordinates; rotation remains separate."""
    def dec(value):
        return Decimal(str(value))
    if dec(source_page.get("/UserUnit", 1)) != 1:
        fail("pdf_user_unit")
    crop = source_page.cropbox
    media = source_page.mediabox
    if crop.left < media.left or crop.bottom < media.bottom or crop.right > media.right or crop.top > media.top:
        fail("pdf_crop_outside_media")
    width, height = dec(crop.right) - dec(crop.left), dec(crop.top) - dec(crop.bottom)
    tolerance = Decimal("0.01")  # PDF metadata rounding only; never measurement tolerance.
    def near(a, b):
        return abs(dec(a) - b) <= tolerance
    dims = page["pageDimensions"]
    if not near(dims["width"], width) or not near(dims["height"], height):
        fail("pdf_dimensions")
    box = page["cropBox"]
    if not all(near(box[key], value) for key, value in zip(
        ("xMin", "yMin", "xMax", "yMax"), (Decimal(0), Decimal(0), width, height)
    )):
        fail("pdf_crop_frame")
    native_rotation = dec(source_page.get("/Rotate", 0))
    if native_rotation % 90 != 0:
        fail("pdf_rotation")
    rotation = int(native_rotation) % 360
    if rotation not in {0, 90, 180, 270} or page["rotation"] != rotation:
        fail("pdf_rotation")
    expected = [[1, 0, -dec(crop.left)], [0, 1, -dec(crop.bottom)], [0, 0, 1]]
    for region in page["regions"]:
        matrix = region["coordinateSpace"]["pageTransform"]["matrix"]
        # No tolerance on linear terms: an arbitrary scaling/rotation is not crop translation.
        for row in range(3):
            for col in range(3):
                allowed = tolerance if col == 2 and row < 2 else Decimal(0)
                if abs(dec(matrix[row][col]) - dec(expected[row][col])) > allowed:
                    fail("pdf_transform")


def inspect_package(package_path, contract_root, bundle_root, manifest_sha):
    """Caller supplies a trusted source-manifest pin, never one copied from the package."""
    from pypdf import PdfReader
    raw = bounded_bytes(package_path, MAX_JSON)
    package = strict_json(raw)
    if not isinstance(package, dict):
        fail("package_shape")
    module = load_contract(contract_root)
    manifest_raw = bounded_bytes(Path(bundle_root) / "manifest.json", 8 * 1024 * 1024)
    if sha(manifest_raw) != manifest_sha:
        fail("source_manifest_pin")
    manifest = strict_json(manifest_raw)
    if manifest.get("schema_version") != "takeoff-viewer-bundle/v1":
        fail("source_manifest_format")
    def unique(rows, key):
        if not isinstance(rows, list) or len(rows) > 20000:
            fail("source_manifest_shape")
        result = {row[key]: row for row in rows}
        if len(result) != len(rows):
            fail("source_manifest_duplicate")
        return result
    docs = unique(manifest["documents"], "id")
    assets = unique(manifest["assets"], "id")
    allowed = {}
    for doc in docs.values():
        allowed.setdefault(doc["project_key"], {})[doc["id"]] = doc["source_sha256"]
    try:
        module.validate_package(
            package, expected_bundle_id=manifest["bundle_id"],
            expected_manifest_sha256=manifest_sha, expected_context_documents=allowed)
    except module.ContractError:
        fail("semantic_invalid")

    artifact_total = 0
    for artifact in package["artifactManifest"]:
        artifact_total += hashed_file(
            confined(Path(package_path).parent, artifact["relativePath"]),
            artifact["sha256"], artifact["bytes"], MAX_ARTIFACT)
        if artifact_total > 512 * 1024 * 1024:
            fail("artifact_total_limit")
    count = pages = pdf_total = 0
    statuses, inclusion = Counter(), Counter()
    for context in package["contexts"]:
        for doc in context["documents"]:
            count += 1
            if count > 64:
                fail("document_limit")
            registered = docs[doc["documentId"]]
            asset = assets.get(registered["asset_id"])
            if not asset or asset["media_type"] != "application/pdf" or asset["sha256"] != doc["pdfSha256"]:
                fail("pdf_source_binding")
            pdf_path = confined(bundle_root, asset["path"])
            pdf = bounded_bytes(pdf_path, MAX_PDF)
            pdf_total += len(pdf)
            if pdf_total > 1024 * 1024 * 1024:
                fail("pdf_total_limit")
            if len(pdf) != asset["size_bytes"] or sha(pdf) != doc["pdfSha256"] or not pdf.startswith(b"%PDF-"):
                fail("pdf_integrity")
            reader = PdfReader(io.BytesIO(pdf), strict=True)
            if reader.is_encrypted:
                fail("pdf_encrypted")
            if len(reader.pages) != registered["page_count"]:
                fail("pdf_page_count")
            page_numbers = set()
            for page in doc["pages"]:
                page_number = page["pageNumber"]
                if page_number in page_numbers or not 1 <= page_number <= len(reader.pages):
                    fail("pdf_page_number")
                page_numbers.add(page_number)
                check_pdf_frame(page, reader.pages[page_number - 1])
                pages += 1
                for region in page["regions"]:
                    statuses.update(m["reviewStatus"] for m in region["measurements"])
    inclusion.update(line["inclusionStatus"] for line in package["boqLines"])
    return {
        "schemaVersion": "tayco-m02-preflight/v1",
        "packageSha256": sha(raw), "payloadDigest": package["payloadDigest"],
        "packageId": package["packageId"], "revision": package["revision"],
        "contractManifestSha256": CONTRACT_MANIFEST_SHA,
        "sourceBundleId": manifest["bundle_id"], "sourceManifestSha256": manifest_sha,
        "artifactCount": len(package["artifactManifest"]), "artifactBytes": artifact_total,
        "documentCount": count, "pageCount": pages,
        "producerReportedMeasurementStates": dict(statuses),
        "producerReportedBoqStates": dict(inclusion),
        "result": "integrity_and_pdf_frame_verified",
        "quantityReview": "not_independently_approved",
        "erpRecordsCreated": 0, "grantsCreated": 0,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--package", required=True)
    parser.add_argument("--contract-root", required=True)
    parser.add_argument("--bundle-root", required=True)
    parser.add_argument("--manifest-sha256", required=True)
    args = parser.parse_args()
    try:
        result = inspect_package(args.package, args.contract_root, args.bundle_root, args.manifest_sha256)
        print(json.dumps(result, ensure_ascii=False, sort_keys=True))
        return 0
    except PreflightError as error:
        print(json.dumps({"result": "rejected", "code": str(error)}))
    except Exception:
        # Never leak arbitrary source contents/paths through third-party parser errors.
        print(json.dumps({"result": "rejected", "code": "inspection_failed"}))
    return 1


if __name__ == "__main__":
    sys.exit(main())
