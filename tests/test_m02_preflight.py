"""Independent receiver preflight probes; provide the reviewed M02 contract root explicitly."""
import copy
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("inspect_m02", ROOT / "scripts/inspect_m02.py")
preflight = importlib.util.module_from_spec(spec)
spec.loader.exec_module(preflight)
CONTRACT = Path(os.environ["TAYCO_M02_CONTRACT_ROOT"])
validator = preflight.load_contract(CONTRACT)


class PreflightProbes(unittest.TestCase):
    def setUp(self):
        from pypdf import PdfWriter
        from pypdf.generic import RectangleObject
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.package_root = self.root / "producer"
        self.bundle = self.root / "bundle"
        (self.package_root / "evidence").mkdir(parents=True)
        (self.bundle / "assets").mkdir(parents=True)
        writer = PdfWriter()
        page = writer.add_blank_page(width=100, height=100)
        # Native negative origin is not normalized geometry: translation must happen exactly once.
        page.mediabox = RectangleObject([-50, -20, 50, 80])
        page.cropbox = RectangleObject([-50, -20, 50, 80])
        stream = io.BytesIO()
        writer.write(stream)
        pdf = stream.getvalue()
        self.pdf_sha = preflight.sha(pdf)
        (self.bundle / "assets/plan.pdf").write_bytes(pdf)
        evidence = b"synthetic-local-evidence"
        (self.package_root / "evidence/plan-page-1.png").write_bytes(evidence)
        original = preflight.bounded_bytes(CONTRACT / "examples/confirmed_m02.json", 32768)
        self.assertEqual(preflight.sha(original), "8d67d1b6b702d3d26c56a00bfed7a76d1ac6fe29e1538850af83d29cb2eb9000")
        self.data = preflight.strict_json(original)
        self.manifest = {
            "schema_version": "takeoff-viewer-bundle/v1", "bundle_id": "synthetic-receiver-preflight",
            "documents": [{"id": "synthetic-doc", "project_key": "synthetic-context",
                           "source_sha256": self.pdf_sha, "asset_id": "synthetic-pdf", "page_count": 1}],
            "assets": [{"id": "synthetic-pdf", "path": "assets/plan.pdf", "media_type": "application/pdf",
                        "sha256": self.pdf_sha, "size_bytes": len(pdf)}],
        }
        self.write_manifest()
        self.data["source"] = {"bundleId": self.manifest["bundle_id"], "manifestSha256": self.manifest_sha}
        artifact = self.data["artifactManifest"][0]
        artifact.update(sha256=preflight.sha(evidence), bytes=len(evidence))
        doc = self.data["contexts"][0]["documents"][0]
        doc["pdfSha256"] = self.pdf_sha
        self.page = doc["pages"][0]
        self.page["regions"][0]["coordinateSpace"]["pageTransform"]["matrix"] = [[1, 0, 50], [0, 1, 20], [0, 0, 1]]
        for measurement in self.page["regions"][0]["measurements"]:
            measurement["sourceEvidence"][0]["pdfSha256"] = self.pdf_sha
        self.package = self.package_root / "package.json"
        self.seal()

    def write_manifest(self):
        raw = json.dumps(self.manifest).encode()
        (self.bundle / "manifest.json").write_bytes(raw)
        self.manifest_sha = preflight.sha(raw)

    def seal(self):
        ctx = self.data["contexts"][0]
        doc = ctx["documents"][0]
        for page in doc["pages"]:
            for region in page["regions"]:
                for measurement in region["measurements"]:
                    measurement["stableId"] = validator._record_id(self.data, ctx, doc, page, region, measurement)
        stable_id = doc["pages"][0]["regions"][0]["measurements"][0]["stableId"]
        self.data["boqLines"][0]["measurementRefs"][0]["stableId"] = stable_id
        self.data["payloadDigest"] = validator._digest({k: v for k, v in self.data.items() if k != "payloadDigest"})
        self.package.write_text(json.dumps(self.data), encoding="utf-8")

    def inspect(self):
        return preflight.inspect_package(self.package, CONTRACT, self.bundle, self.manifest_sha)

    def rejected(self, code):
        with self.assertRaises(preflight.PreflightError) as caught:
            self.inspect()
        self.assertEqual(str(caught.exception), code)

    def test_valid_negative_origin_and_original_numeric_identity(self):
        for numeric in ("2", 2, 2.0):
            self.data["contexts"][0]["documents"][0]["pages"][0]["regions"][0]["measurements"][0]["quantity"] = numeric
            self.seal()
            before = self.package.read_bytes()
            result = self.inspect()
            self.assertEqual(result["payloadDigest"], self.data["payloadDigest"])
            self.assertEqual(self.package.read_bytes(), before)
            self.assertEqual(result["result"], "integrity_and_pdf_frame_verified")
            self.assertEqual(result["erpRecordsCreated"], 0)
            self.assertEqual(result["quantityReview"], "not_independently_approved")

    def test_native_matrix_not_applied_twice_or_omitted(self):
        self.page["regions"][0]["coordinateSpace"]["pageTransform"]["matrix"][0][2] = 0
        self.seal()
        self.rejected("pdf_transform")

    def test_wrong_rotation(self):
        self.page["rotation"] = 90
        self.seal()
        self.rejected("pdf_rotation")

    def test_wrong_dimensions(self):
        self.page["pageDimensions"]["width"] = "101"
        self.seal()
        self.rejected("pdf_dimensions")

    def test_unknown_pdf_page(self):
        self.page["pageNumber"] = 2
        self.page["regions"][0]["measurements"][0]["sourceEvidence"][0]["pageNumber"] = 2
        self.seal()
        self.rejected("pdf_page_number")

    def test_duplicate_page_with_distinct_measurement_revision(self):
        second = copy.deepcopy(self.page)
        second["regions"][0]["measurements"][0]["revision"] = "M2"
        self.data["contexts"][0]["documents"][0]["pages"].append(second)
        self.seal()
        self.rejected("pdf_page_number")

    def test_artifact_modified_missing_or_declared_size_wrong(self):
        asset = self.package_root / "evidence/plan-page-1.png"
        asset.write_bytes(b"x" * asset.stat().st_size)
        self.rejected("artifact_digest")
        asset.write_bytes(b"synthetic-local-evidence")
        self.data["artifactManifest"][0]["bytes"] += 1
        self.seal()
        self.rejected("artifact_bytes")
        asset.unlink()
        with self.assertRaises(FileNotFoundError):
            self.inspect()

    def test_traversal_and_windows_absolute_artifacts(self):
        for path in ("../outside.png", r"C:\private\file.png", "/outside.png"):
            self.data["artifactManifest"][0]["relativePath"] = path
            self.seal()
            self.rejected("semantic_invalid")

    def test_symlink_guard_even_when_host_cannot_create_links(self):
        with patch.object(Path, "is_symlink", return_value=True):
            self.rejected("artifact_symlink")

    def test_user_unit_is_not_silently_treated_as_points(self):
        from pypdf import PdfReader
        from pypdf.generic import NameObject, NumberObject
        source = PdfReader(self.bundle / "assets/plan.pdf").pages[0]
        source[NameObject("/UserUnit")] = NumberObject(2)
        with self.assertRaisesRegex(preflight.PreflightError, "^pdf_user_unit$"):
            preflight.check_pdf_frame(self.page, source)

    def test_real_symlink_artifact_denied(self):
        target = self.package_root / "evidence/plan-page-1.png"
        outside = self.root / "outside.png"
        target.replace(outside)
        try:
            target.symlink_to(outside)
        except OSError as error:
            self.skipTest("Host cannot create a symlink: " + str(error.errno))
        self.rejected("artifact_symlink")

    def test_source_pdf_changed_and_manifest_pin_mismatch(self):
        pdf = self.bundle / "assets/plan.pdf"
        pdf.write_bytes(b"%PDF-" + b"x" * 50)
        self.rejected("pdf_integrity")
        (self.bundle / "manifest.json").write_bytes(b"{}")
        self.rejected("source_manifest_pin")

    def test_unknown_document_or_context_cannot_match_by_name(self):
        self.data["contexts"][0]["contextKey"] = "almost-synthetic-context"
        self.seal()
        self.rejected("semantic_invalid")

    def test_pending_quantity_rejected_even_with_new_digest(self):
        measurement = self.page["regions"][0]["measurements"][0]
        measurement.update(reviewStatus="pending", pendingReason="source not confirmed")
        self.seal()
        self.rejected("semantic_invalid")

    def test_nominal_calibration_cannot_verify_geometry(self):
        self.page["regions"][0]["calibration"]["anchors"][0]["referenceKind"] = "nominal_scale"
        self.seal()
        self.rejected("semantic_invalid")

    def test_duplicate_keys_nonfinite_and_byte_bound(self):
        for raw, code in [(b'{"a":1,"a":2}', "duplicate_json_key"),
                          (b'{"a":NaN}', "nonfinite_json_number"),
                          (b'{"a":1e999}', "nonfinite_json_number")]:
            self.package.write_bytes(raw)
            self.rejected(code)
        with self.package.open("wb") as stream:
            stream.truncate(preflight.MAX_JSON + 1)
        self.rejected("input_limit")

    def test_contract_pin_failure_before_execution(self):
        fake = self.root / "contract"
        (fake / "schema").mkdir(parents=True)
        for name in ("handoff_manifest.json", "calibration_boq.py", "README.md", "schema/calibration_boq_v1.schema.json"):
            (fake / name).write_bytes((CONTRACT / name).read_bytes())
        (fake / "calibration_boq.py").write_text("raise AssertionError('must not execute')")
        with self.assertRaisesRegex(preflight.PreflightError, "^contract_pin$"):
            preflight.load_contract(fake)

    def test_cli_success_and_private_error_redaction(self):
        command = [sys.executable, "-B", str(ROOT / "scripts/inspect_m02.py"),
                   "--package", str(self.package), "--contract-root", str(CONTRACT),
                   "--bundle-root", str(self.bundle), "--manifest-sha256", self.manifest_sha]
        result = subprocess.run(command, capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["erpRecordsCreated"], 0)
        self.package.write_text('{"privateCustomer":"DO-NOT-LEAK"}')
        result = subprocess.run(command, capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 1)
        self.assertNotIn("DO-NOT-LEAK", result.stdout + result.stderr)
        self.assertNotIn(str(self.package), result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
