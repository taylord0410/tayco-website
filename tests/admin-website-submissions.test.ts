import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomUUID, randomBytes } from "node:crypto";
const securityEnvNames = ['TAYCO_DATA_ENCRYPTION_KEY','TAYCO_SUBMISSIONS_KEY','TAYCO_SESSION_SECRET','SESSION_SECRET','TAYCO_TRUSTED_INGRESS'] as const;
let securityEnvBefore: Record<string,string|undefined>;
beforeEach(() => {
  securityEnvBefore=Object.fromEntries(securityEnvNames.map(name=>[name,process.env[name]]));
  for(const name of securityEnvNames)delete process.env[name];
  process.env.TAYCO_SESSION_SECRET=randomBytes(48).toString('hex');
  process.env.TAYCO_TRUSTED_INGRESS='railway-public-edge'; // Simulated attested ingress fixture.
});
afterEach(() => {
  for(const name of securityEnvNames){if(securityEnvBefore[name]===undefined)delete process.env[name];else process.env[name]=securityEnvBefore[name];}
});
import type { Actor } from "../lib/auth";
import {
  database,
  snapshot,
  submitWebsite,
  listWebsiteSubmissions,
  updateWebsiteSubmissionStatus,
  ErpError,
} from "../lib/erp";

const admin: Actor = {
  id: "admin-1",
  email: "admin@tayco.llc",
  role: "admin",
  tenantId: "tayco_llc",
  projectIds: [],
};

const staff: Actor = {
  id: "staff-1",
  email: "staff@tayco.llc",
  role: "staff",
  tenantId: "tayco_llc",
  projectIds: [],
};

const client: Actor = {
  id: "client-1",
  email: "client@tayco.llc",
  role: "client",
  tenantId: "tayco_llc",
  projectIds: [],
};

test("website form submissions are AES-256-GCM encrypted at rest and strictly restricted to admin", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "tayco-submissions-"));
  const prevDb = process.env.TAYCO_ERP_DB_PATH;
  process.env.TAYCO_ERP_DB_PATH = path.join(dir, "erp.sqlite");
  try {
    const est = submitWebsite(
      "estimate",
      {
        fullName: "Marcus Vance",
        phone: "414-555-0192",
        email: "mvance@midwestretail.test",
        projectType: "Commercial Tenant Improvement (TI)",
        projectLocation: "Milwaukee, WI",
        projectDetails: "Confidential 14,500 sq ft medical office buildout.",
        sqft: 14500,
        budgetIllustrationUsd: 1650000,
      },
      randomUUID()
    );

    const inv = submitWebsite(
      "investor",
      {
        fullName: "Elena Rostova",
        company: "Lakefront Asset Partners",
        phone: "312-555-0148",
        email: "erostova@lakefront.test",
        states: "Illinois (IL)",
        properties: "12",
        workNeeded: "Full Rehab, Roofing",
        notes: "Portfolio turnover across 12 multifamily units in Chicago.",
      },
      randomUUID()
    );

    const ven = submitWebsite(
      "vendor",
      {
        businessName: "Badger Mechanical LLC",
        contactName: "Robert Kowalski",
        phone: "608-555-0177",
        email: "dispatch@badgermech.test",
        stateServed: "Wisconsin (WI)",
        citiesServed: "Madison & Milwaukee",
        trades: "HVAC, Plumbing",
        crewSize: "14 technicians",
        yearsInBusiness: "11",
        insured: "Yes",
        licenseNumber: "WI-MECH-90210",
      },
      randomUUID()
    );

    // 1. Verify raw SQLite storage is AES-256-GCM encrypted (iv:tag:ciphertext)
    const rawRow = database()
      .prepare("SELECT payload_encrypted, status FROM website_submissions WHERE id=?")
      .get(est.id) as { payload_encrypted: string; status: string };
    assert.ok(rawRow);
    assert.equal(rawRow.status, "unread");
    assert.equal(rawRow.payload_encrypted.split(":").length, 3);
    assert.equal(
      rawRow.payload_encrypted.includes("Confidential 14,500 sq ft"),
      false,
      "Plaintext project details must not appear in payload_encrypted column"
    );

    // 2. Verify non-admin roles CANNOT access websiteSubmissions in snapshot or via functions
    assert.equal(snapshot(staff).websiteSubmissions, undefined);
    assert.equal(snapshot(client).websiteSubmissions, undefined);
    assert.throws(
      () => listWebsiteSubmissions(staff),
      (err: unknown) => err instanceof ErpError && err.status === 403
    );
    assert.throws(
      () => updateWebsiteSubmissionStatus(staff, { action: "mark_all_read" }),
      (err: unknown) => err instanceof ErpError && err.status === 403
    );

    // 3. Verify Admin receives decrypted websiteSubmissions in snapshot
    const adminSnap = snapshot(admin);
    assert.ok(Array.isArray(adminSnap.websiteSubmissions));
    assert.equal(adminSnap.websiteSubmissions.length, 3);
    const estSub = adminSnap.websiteSubmissions.find((s) => s.id === est.id)!;
    assert.equal(estSub.senderName, "Marcus Vance");
    assert.equal(estSub.formKind, "estimate");
    assert.equal(estSub.status, "unread");
    assert.equal(estSub.payload.sqft, 14500);
    assert.equal(estSub.payload.budgetIllustrationUsd, 1650000);

    // 4. Verify Admin can mark individual submission read and mark all read
    const afterOneRead = updateWebsiteSubmissionStatus(admin, {
      action: "mark_read",
      id: est.id,
    });
    const updatedEst = afterOneRead.find((s) => s.id === est.id)!;
    assert.equal(updatedEst.status, "read");
    assert.equal(updatedEst.readBy, "admin@tayco.llc");
    assert.ok(updatedEst.readAt);

    // Remaining unread count is 2 (inv + ven)
    assert.equal(afterOneRead.filter((s) => s.status === "unread").length, 2);

    // Mark all read
    const afterAllRead = updateWebsiteSubmissionStatus(admin, {
      action: "mark_all_read",
    });
    assert.equal(afterAllRead.filter((s) => s.status === "unread").length, 0);

    // Archive vendor submission
    const afterArchive = updateWebsiteSubmissionStatus(admin, {
      action: "archive",
      id: ven.id,
    });
    assert.equal(
      afterArchive.find((s) => s.id === ven.id)?.status,
      "archived"
    );
    assert.ok(inv.id);
  } finally {
    process.env.TAYCO_ERP_DB_PATH = prevDb;
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore Windows SQLite file lock cleanup in temp dir
    }
  }
});

test("Footer links prominently to /privacy#project-photography-privacy", () => {
  const footerSrc = readFileSync(
    path.join(process.cwd(), "components", "Footer.tsx"),
    "utf8"
  );
  assert.ok(footerSrc.includes("/privacy#project-photography-privacy"));
  assert.ok(footerSrc.includes("Privacy Policy &amp; Client Confidentiality"));
});

test("guest security logs encrypt client_ip, user_agent, and detail with AES-256-GCM at rest in SQLite", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const { recordGuestSecurityByContext, guestSecurityReport } = await import(
    "../lib/guest-security-log"
  );
  const dir = mkdtempSync(path.join(tmpdir(), "tayco-sec-log-test-"));
  const prevAuthDb = process.env.TAYCO_AUTH_DB_PATH;
  const dbFile = path.join(dir, "tayco-auth.sqlite");
  process.env.TAYCO_AUTH_DB_PATH = dbFile;

  try {
    recordGuestSecurityByContext(
      {
        tenantId: "tayco_llc",
        reviewId: "rev-test-1",
        actorId: "guest-test-1",
        actorRole: "guest",
      },
      {
        "x-real-ip": "198.51.100.42",
        "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
      },
      {
        eventType: "excel.open",
        surface: "excel",
        targetId: "excel:2026-09",
        detail: "September 2026 workbook",
        statusCode: 200,
      }
    );

    const db = new DatabaseSync(dbFile);
    try {
      const rawRow = db
        .prepare(
          "SELECT client_ip, user_agent, detail FROM guest_security_events LIMIT 1"
        )
        .get() as {
        client_ip: string;
        user_agent: string;
        detail: string;
      };
      assert.ok(rawRow.client_ip.startsWith("enc:v1:"));
      assert.ok(!rawRow.client_ip.includes("198.51.100.42"));
      assert.ok(rawRow.user_agent.startsWith("enc:v1:"));
      assert.ok(rawRow.detail.startsWith("enc:v1:"));
    } finally {
      db.close();
    }

    assert.throws(
      () => guestSecurityReport({ role: "guest", tenantId: "tayco_llc" }),
      /Administrator access is required/
    );

    const report = guestSecurityReport({
      role: "admin",
      tenantId: "tayco_llc",
    });
    assert.equal(report.totalEvents, 1);
    assert.equal(report.events[0]?.clientIp, "198.51.100.42");
    assert.equal(report.events[0]?.detail, "September 2026 workbook");
  } finally {
    process.env.TAYCO_AUTH_DB_PATH = prevAuthDb;
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore Windows temp file lock
    }
  }
});
