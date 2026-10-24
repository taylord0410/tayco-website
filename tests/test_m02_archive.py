"""Private archive probes using only newly generated synthetic files and PDFs."""
import concurrent.futures
import json
from pathlib import Path
import subprocess
import sys
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import prepare_m02 as prepare
import test_m02_preflight as fixtures
CONTRACT = fixtures.CONTRACT


class ArchiveProbes(unittest.TestCase):
    def setUp(self):
        self.fixture = fixtures.PreflightProbes(methodName="test_wrong_rotation")
        self.fixture.setUp()
        self.addCleanup(self.fixture.doCleanups)
        self.archive = self.fixture.root / "private-archive"

    def receive(self):
        f = self.fixture
        return prepare.archive_package(f.package, CONTRACT, f.bundle, f.manifest_sha, self.archive)

    def assert_no_published_package(self):
        if self.archive.exists():
            self.assertEqual(list(self.archive.iterdir()), [])

    def test_new_archive_keeps_exact_package_and_evidence(self):
        f = self.fixture
        original = f.package.read_bytes()
        evidence = (f.package_root / "evidence/plan-page-1.png").read_bytes()
        result = self.receive()
        self.assertEqual(result["archiveState"], "created_verified")
        target = self.archive / result["archiveKey"]
        self.assertEqual((target / prepare.PACKAGE_NAME).read_bytes(), original)
        self.assertEqual((target / "evidence/plan-page-1.png").read_bytes(), evidence)
        self.assertEqual(f.package.read_bytes(), original)
        self.assertEqual(result["receipt"]["erpRecordsCreated"], 0)

    def test_replay_verifies_without_overwriting(self):
        first = self.receive()
        target = self.archive / first["archiveKey"]
        before = {p.relative_to(target): (p.read_bytes(), p.stat().st_mtime_ns) for p in target.rglob("*") if p.is_file()}
        second = self.receive()
        self.assertEqual(second["archiveState"], "existing_verified")
        self.assertEqual(first["receipt"], second["receipt"])
        after = {p.relative_to(target): (p.read_bytes(), p.stat().st_mtime_ns) for p in target.rglob("*") if p.is_file()}
        self.assertEqual(before, after)
        self.assertEqual(len(list(self.archive.iterdir())), 1)

    def test_corrupt_existing_archive_fails_closed_without_repair(self):
        first = self.receive()
        target = self.archive / first["archiveKey"] / "evidence/plan-page-1.png"
        target.write_bytes(b"corrupted archive")
        with self.assertRaises(prepare.PreflightError):
            self.receive()
        self.assertEqual(target.read_bytes(), b"corrupted archive")

    def test_fault_after_copy_leaves_no_published_archive(self):
        original = prepare.copy_artifact
        def fail_after_copy(*args):
            original(*args)
            raise prepare.PreflightError("synthetic_write_fault")
        with patch.object(prepare, "copy_artifact", side_effect=fail_after_copy):
            with self.assertRaisesRegex(prepare.PreflightError, "^synthetic_write_fault$"):
                self.receive()
        self.assert_no_published_package()

    def test_corruption_before_final_verification_is_not_published(self):
        original = prepare.copy_artifact
        def corrupt(*args):
            original(*args)
            args[1].write_bytes(b"not verified evidence")
        with patch.object(prepare, "copy_artifact", side_effect=corrupt):
            with self.assertRaises(prepare.PreflightError):
                self.receive()
        self.assert_no_published_package()

    def test_source_change_after_initial_preflight_is_rejected(self):
        original = prepare.inspect_package
        def changed(*args):
            result = original(*args)
            self.fixture.package.write_bytes(self.fixture.package.read_bytes() + b" ")
            return result
        with patch.object(prepare, "inspect_package", side_effect=changed):
            with self.assertRaisesRegex(prepare.PreflightError, "^source_changed$"):
                self.receive()
        self.assert_no_published_package()

    def test_reserved_package_name_cannot_be_an_artifact(self):
        f = self.fixture
        (f.package_root / prepare.PACKAGE_NAME).write_bytes((f.package_root / "evidence/plan-page-1.png").read_bytes())
        f.data["artifactManifest"][0]["relativePath"] = prepare.PACKAGE_NAME
        f.seal()
        with self.assertRaisesRegex(prepare.PreflightError, "^archive_reserved_path$"):
            self.receive()
        self.assert_no_published_package()

    def test_casefold_collisions_do_not_depend_on_filesystem_case_rules(self):
        f = self.fixture
        original = f.package_root / "evidence/plan-page-1.png"
        different_case = f.package_root / "evidence/PLAN-PAGE-1.PNG"
        different_case.write_bytes(original.read_bytes())
        second = {**f.data["artifactManifest"][0], "artifactId": "case-alias",
                  "relativePath": "evidence/PLAN-PAGE-1.PNG"}
        f.data["artifactManifest"].append(second)
        f.seal()
        with self.assertRaisesRegex(prepare.PreflightError, "^archive_path_collision$"):
            self.receive()
        self.assert_no_published_package()

    def test_two_writers_publish_one_verified_directory(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.receive(), range(2)))
        self.assertEqual({x["archiveKey"] for x in results}, {results[0]["archiveKey"]})
        self.assertEqual(sum(x["archiveState"] == "created_verified" for x in results), 1)
        self.assertEqual(len(list(self.archive.iterdir())), 1)

    def test_lost_result_after_rename_recovers_existing_verified_archive(self):
        original = prepare.os.rename
        def lost_result(*args):
            original(*args)
            raise RuntimeError("synthetic lost result after publication")
        with patch.object(prepare.os, "rename", side_effect=lost_result):
            with self.assertRaisesRegex(RuntimeError, "synthetic lost result"):
                self.receive()
        self.assertEqual(len(list(self.archive.iterdir())), 1)
        result = self.receive()
        self.assertEqual(result["archiveState"], "existing_verified")
        self.assertEqual(len(list(self.archive.iterdir())), 1)

    def test_projection_preserves_large_integer_as_string_and_separates_prices(self):
        f = self.fixture
        measurement = f.page["regions"][0]["measurements"][0]
        measurement.update(method="schedule", geometry=None, calibrationRef=None,
                           quantity=9007199254740993, unit="each", reviewStatus="candidate",
                           pendingReason="Synthetic provisional count")
        measurement["sourceEvidence"][0]["kind"] = "schedule_row"
        line = f.data["boqLines"][0]
        line.update(inclusionStatus="pending", quantity=None, unit="each",
                    pricingState="candidate", rate=1.25, currency="USD",
                    priceSourceRef={"sourceId": "synthetic-price", "sha256": "a" * 64,
                                    "revision": "P1", "effectiveDate": "2026-10-01",
                                    "geography": "synthetic", "scope": "material only"})
        f.seal()
        before = f.package.read_bytes()
        result = self.receive()
        self.assertEqual(result["measurements"][0]["quantity"], "9007199254740993")
        self.assertEqual(result["measurements"][0]["reviewStatus"], "candidate")
        self.assertIsNone(result["boqLines"][0]["quantity"])
        self.assertEqual(result["boqLines"][0]["rate"], "1.25")
        self.assertNotIn("totalAmount", result)
        self.assertEqual(result["receipt"]["payloadDigest"], f.data["payloadDigest"])
        self.assertEqual(f.package.read_bytes(), before)

    def test_file_in_archive_namespace_is_never_overwritten(self):
        f = self.fixture
        self.archive.mkdir()
        key = prepare.sha(f.package.read_bytes())
        (self.archive / key).write_bytes(b"other owner")
        with self.assertRaisesRegex(prepare.PreflightError, "^archive_collision$"):
            self.receive()
        self.assertEqual((self.archive / key).read_bytes(), b"other owner")

    def test_cli_success_and_generic_errors_are_redacted(self):
        f = self.fixture
        command = [sys.executable, "-B", str(ROOT / "scripts/prepare_m02.py"),
                   "--package", str(f.package), "--contract-root", str(CONTRACT),
                   "--bundle-root", str(f.bundle), "--manifest-sha256", f.manifest_sha,
                   "--archive-root", str(self.archive)]
        result = subprocess.run(command, capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["archiveState"], "created_verified")
        f.package.write_text('{"privateCustomer":"DO-NOT-LEAK"}')
        result = subprocess.run(command, capture_output=True, text=True, timeout=20)
        self.assertEqual(result.returncode, 1)
        self.assertNotIn("DO-NOT-LEAK", result.stdout + result.stderr)
        self.assertNotIn(str(f.package), result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
