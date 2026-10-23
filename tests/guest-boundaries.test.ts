import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { provisionAdmin, signIn, createInvitation, acceptInvitation, sessionCookie, requireActor } from "../lib/auth";
import { database, execute, financialSummary, snapshot, registerDocument, documentForActor, ErpError } from "../lib/erp";
import { documentMaintenance } from "../lib/document-lifecycle";
import { projectDossier } from "../lib/project-dossier";
import { saveMonthlyManagementEstimate } from "../lib/monthly-management-estimates";
import * as erp from "../app/api/erp-suite/route";
import * as periods from "../app/api/finance/periods/route";
import * as financeExport from "../app/api/finance/export/route";
import * as hoursExport from "../app/api/hours/export/route";
import * as dossier from "../app/api/project-dossier/route";
import * as maintenance from "../app/api/document-maintenance/route";
import * as upload from "../app/api/upload-doc/route";
import * as documents from "../app/api/documents/[id]/route";
import * as notifications from "../app/api/notifications/route";
import * as accounts from "../app/api/auth/accounts/route";
import * as invitations from "../app/api/auth/invitations/route";
import * as guestSummary from "../app/api/guest-summary/route";
import * as estimates from "../app/api/monthly-estimates/route";

test("guest HTTP and domain boundaries reject private details even with forged assignments", async t => {
  const folder = mkdtempSync(path.join(tmpdir(), "tayco-guest-boundaries-"));
  const names = ["TAYCO_AUTH_DB_PATH", "TAYCO_ERP_DB_PATH", "TAYCO_APP_URL", "TAYCO_SESSION_SECRET", "BLOB_READ_WRITE_TOKEN"];
  const old = Object.fromEntries(names.map(key => [key, process.env[key]]));
  Object.assign(process.env, { TAYCO_AUTH_DB_PATH: path.join(folder, "auth.sqlite"), TAYCO_ERP_DB_PATH: path.join(folder, "erp.sqlite"), TAYCO_APP_URL: "https://tayco.test", TAYCO_SESSION_SECRET: randomBytes(48).toString("hex") });
  delete process.env.BLOB_READ_WRITE_TOKEN;
  let opened = false;
  try {
    const password = "Disposable-guest-boundary-fixture!234";
    await provisionAdmin("admin@example.test", password);
    const admin = (await signIn("admin@example.test", password)).actor;
    const project = execute(admin, randomUUID(), { action: "create_project", name: "PRIVATE PROJECT SENTINEL", location: "PRIVATE LOCATION SENTINEL" }); opened = true;
    database().prepare("UPDATE records SET payload=json_set(payload, '$.reviewPeriod', '2020-01') WHERE id=?").run(project.id);
    const document = registerDocument(admin, { projectId: project.id, type: "project", name: "PRIVATE FILE SENTINEL.pdf", blobPath: "private-fixture/not-a-real-blob.pdf", contentType: "application/pdf" });
    const invite = createInvitation(admin, { email: "guest@example.test", role: "guest", tenantId: admin.tenantId, projectIds: [] });
    const accepted = await acceptInvitation(invite.token, "guest@example.test", password);
    const cookie = sessionCookie(accepted.cookie).split(";")[0];
    const request = (pathname: string, method = "GET", body?: unknown) => new NextRequest("https://tayco.test" + pathname, { method, headers: { cookie, origin: "https://tayco.test", "Content-Type": "application/json", "Idempotency-Key": randomUUID() }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const actor = await requireActor(request("/api/auth/session"));
    const forged = { ...actor, projectIds: [project.id], vendorId: "forged-vendor" };

    await t.test("direct domain calls stop before records or provider access", () => {
      for (const operation of [
        () => snapshot(forged), () => financialSummary(forged),
        () => execute(forged, randomUUID(), { action: "create_note", projectId: project.id, body: "forbidden" }),
        () => documentForActor(forged, document.id), () => documentMaintenance(forged),
        () => projectDossier(forged, project.id),
        () => registerDocument(forged, { name: "forbidden", blobPath: "never-created", type: "project", contentType: "application/pdf" }),
      ]) assert.throws(operation, error => error instanceof ErpError && error.status === 403);
    });

    const cases: Array<[string, () => Promise<Response>]> = [
      ["ERP GET", () => erp.GET(request("/api/erp-suite"))],
      ["ERP POST", () => erp.POST(request("/api/erp-suite", "POST", { action: "create_project", name: "forbidden" }))],
      ["financial periods", () => periods.GET(request("/api/finance/periods?year=2020&month=1"))],
      ["financial export", () => financeExport.GET(request("/api/finance/export"))],
      ["hours export", () => hoursExport.GET(request("/api/hours/export"))],
      ["project dossier", () => dossier.GET(request("/api/project-dossier?projectId=" + project.id))],
      ["document maintenance GET", () => maintenance.GET(request("/api/document-maintenance"))],
      ["document maintenance POST", () => maintenance.POST(request("/api/document-maintenance", "POST", { action: "scan_expiry" }))],
      ["document upload before body or configuration", () => upload.POST(request("/api/upload-doc", "POST", {}))],
      ["document download before provider", () => documents.GET(request("/api/documents/" + document.id), { params: Promise.resolve({ id: document.id }) })],
      ["notifications", () => notifications.POST(request("/api/notifications", "POST", {}))],
      ["accounts GET", () => accounts.GET(request("/api/auth/accounts"))],
      ["accounts PATCH", () => accounts.PATCH(request("/api/auth/accounts", "PATCH", {}))],
      ["invitations GET", () => invitations.GET(request("/api/auth/invitations"))],
      ["invitations POST", () => invitations.POST(request("/api/auth/invitations", "POST", {}))],
      ["invitations DELETE", () => invitations.DELETE(request("/api/auth/invitations", "DELETE", {}))],
      ["management estimates source GET", () => estimates.GET(request("/api/monthly-estimates"))],
      ["management estimates POST", () => estimates.POST(request("/api/monthly-estimates", "POST", {}))],
    ];
    for (const [name, invoke] of cases) await t.test(name, async () => {
      const response = await invoke(); assert.equal(response.status, 403, name);
      const body = await response.text();
      for (const secret of [project.id, "PRIVATE PROJECT SENTINEL", "PRIVATE LOCATION SENTINEL", "PRIVATE FILE SENTINEL"]) assert.equal(body.includes(secret), false);
    });
    assert.equal(existsSync(path.join(folder, "upload-intents")), false);

    await t.test("guest receives only the historical management range DTO", async () => {
      saveMonthlyManagementEstimate(admin, randomUUID(), { period: "2020-01", lowUsd: 200000, highUsd: 500000, source: "PRIVATE SOURCE SENTINEL", expectedVersion: 0 });
      const response = await guestSummary.GET(request("/api/guest-summary?year=2020"));
      assert.equal(response.status, 200); assert.match(response.headers.get("cache-control")!, /no-store/);
      const body = await response.text(), result = JSON.parse(body);
      assert.equal(result.summary.months.length, 1); assert.equal(result.summary.months[0].lowUsd, 200000);
      for (const forbidden of ["PRIVATE SOURCE SENTINEL", project.id, "authorId", "tenantId", "projectIds", "entries", "PRIVATE FILE"]) assert.equal(body.includes(forbidden), false);
      assert.equal((await guestSummary.GET(request("/api/guest-summary?year=9999"))).status, 422);
      assert.equal((await guestSummary.GET(request("/api/guest-summary?year=2020&tenant=other"))).status, 422);
      assert.equal((await guestSummary.GET(request("/api/guest-summary?year=2020&year=2021"))).status, 422);
      assert.equal(snapshot(admin).entries.some(entry => entry.id === project.id), true);
    });
  } finally {
    if (opened) database().close();
    for (const [key, value] of Object.entries(old)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    rmSync(folder, { recursive: true, force: true });
  }
});
