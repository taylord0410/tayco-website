import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import {
  acceptInvitation, createInvitation, listAccounts, provisionAdmin, requireActor,
  revokeUserSessionsPrivately, sessionCookie, signIn, signOut, updateAccountAccess,
} from "../lib/auth";
import { database, execute, registerDocument, type Data } from "../lib/erp";
import { saveMonthlyManagementEstimate } from "../lib/monthly-management-estimates";
import * as guestWorkspace from "../app/api/guest-workspace/route";
import { guestSections } from "../lib/guest-sections";

test("guest workspace HTTP sessions enforce current detail and historical summaries", async t => {
  const folder = mkdtempSync(path.join(tmpdir(), "tayco-guest-workspace-route-"));
  const names = [
    "TAYCO_AUTH_DB_PATH", "TAYCO_ERP_DB_PATH", "TAYCO_APP_URL", "TAYCO_SESSION_SECRET",
    "TAYCO_TAKEOFF_RELATIONS_PATH", "TAYCO_TAKEOFF_MAPPING_PATH", "BLOB_READ_WRITE_TOKEN",
  ];
  const old = Object.fromEntries(names.map(name => [name, process.env[name]]));
  Object.assign(process.env, {
    TAYCO_AUTH_DB_PATH: path.join(folder, "auth.sqlite"),
    TAYCO_ERP_DB_PATH: path.join(folder, "erp.sqlite"),
    TAYCO_APP_URL: "https://tayco.test",
    TAYCO_SESSION_SECRET: randomBytes(48).toString("hex"),
    // These tests exercise manual records without a publication or external provider.
    TAYCO_TAKEOFF_RELATIONS_PATH: path.join(folder, "missing-relations.json"),
    TAYCO_TAKEOFF_MAPPING_PATH: path.join(folder, "missing-mapping.json"),
  });
  delete process.env.BLOB_READ_WRITE_TOKEN;
  let opened = false;
  try {
    const now = new Date();
    const period = now.toISOString().slice(0, 7);
    const periodAt = (delta: number) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + delta, 1)).toISOString().slice(0, 7);
    const past = periodAt(-1), future = periodAt(1);
    const currentDate = period + "-01", currentTimestamp = currentDate + "T12:00:00Z";
    const password = "Disposable-guest-workspace-fixture!234";
    const guestEmail = "reviewer@example.test";
    await provisionAdmin("admin@example.test", password);
    const signedAdmin = await signIn("admin@example.test", password);
    const admin = signedAdmin.actor;
    const adminCookie = sessionCookie(signedAdmin.cookie).split(";")[0];
    const current = execute(admin, randomUUID(), { action: "create_project", name: "Current project", location: "North site" });
    const db = database(); opened = true;
    db.prepare("UPDATE records SET payload=json_set(payload, '$.clientName', ?, '$.clientEmail', ?, '$.contacts', json(?), '$.nextAction', ?, '$.sourceRef', ?),created_at=?,updated_at=? WHERE id=?").run(
      "PRIVATE_CLIENT_SENTINEL", "PRIVATE_CONTACT_SENTINEL@example.test",
      JSON.stringify([{ email: "PRIVATE_NESTED_CONTACT_SENTINEL@example.test", phone: "PRIVATE_PHONE_SENTINEL" }]),
      "PRIVATE_ACTION_SENTINEL", "PRIVATE_PROJECT_SOURCE_SENTINEL", currentTimestamp, currentTimestamp, current.id,
    );
    const insert = (id: string, kind: string, projectId: string, payload: Data, created = currentTimestamp, tenant = admin.tenantId) =>
      db.prepare("INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)").run(id, kind, tenant, projectId, admin.id, JSON.stringify(payload), created, created);
    insert("explicit-past-project", "project", "explicit-past-project", { name: "PRIVATE_PAST_PROJECT_SENTINEL", source: "team", status: "active", reviewPeriod: past });
    insert("past-created-project", "project", "past-created-project", { name: "PRIVATE_OLDER_PROJECT_SENTINEL", source: "team", status: "active" }, past + "-01T12:00:00Z");
    insert("future-project", "project", "future-project", { name: "PRIVATE_FUTURE_PROJECT_SENTINEL", source: "team", status: "active", reviewPeriod: future });
    insert("other-tenant-project", "project", "other-tenant-project", { name: "PRIVATE_OTHER_TENANT_SENTINEL", source: "team", status: "active" }, currentTimestamp, "other-company");

    const document = registerDocument(admin, {
      projectId: current.id, type: "project", name: "Current plans.pdf",
      blobPath: "PRIVATE_BLOB_PATH_SENTINEL/current-plans.pdf", contentType: "application/pdf",
    });
    db.prepare("UPDATE records SET payload=json_set(payload, '$.internalNotes', ?),created_at=?,updated_at=? WHERE id=?").run(
      "PRIVATE_DOCUMENT_NOTE_SENTINEL", currentTimestamp, currentTimestamp, document.id,
    );
    insert("current-estimate", "estimate", current.id, {
      name: "Current estimate", currency: "USD", amountUsd: 1250, estimatedOn: currentDate,
      dateBasis: "source_date", sourceName: "Published estimate",
      sourceRef: "PRIVATE_ESTIMATE_SOURCE_SENTINEL", clientEmail: "PRIVATE_ESTIMATE_CONTACT_SENTINEL@example.test",
      internalFile: "C:\\PRIVATE_FILESYSTEM_SENTINEL\\estimate.json",
    });
    insert("past-estimate", "estimate", current.id, {
      name: "PRIVATE_PAST_ESTIMATE_SENTINEL", currency: "USD", amountUsd: 500, estimatedOn: past + "-01", dateBasis: "source_date",
    });
    insert("other-tenant-estimate", "estimate", current.id, {
      name: "PRIVATE_OTHER_ESTIMATE_SENTINEL", currency: "USD", amountUsd: 500, estimatedOn: currentDate,
    }, currentTimestamp, "other-company");
    insert("other-tenant-document", "document", current.id, {
      name: "PRIVATE_OTHER_DOCUMENT_SENTINEL.pdf", type: "project", contentType: "application/pdf", blobPath: "PRIVATE_OTHER_BLOB_SENTINEL",
    }, currentTimestamp, "other-company");
    const hiddenModuleData = {
      clientEmail: "PRIVATE_MODULE_CONTACT_SENTINEL@example.test",
      contacts: [{ email: "PRIVATE_MODULE_NESTED_CONTACT_SENTINEL@example.test" }],
      sourceRef: "PRIVATE_MODULE_SOURCE_SENTINEL",
      internalFile: "C:\\PRIVATE_MODULE_PATH_SENTINEL\\record.json",
      internalNotes: "PRIVATE_MODULE_NOTES_SENTINEL",
    };
    insert("current-client-note", "note", current.id, {
      ...hiddenModuleData, title: "Current shared update", details: "Current project update", visibility: "client",
    });
    insert("internal-note", "note", current.id, {
      title: "PRIVATE_INTERNAL_NOTE_SENTINEL", details: "PRIVATE_INTERNAL_CONTENT_SENTINEL", visibility: "internal",
    });
    insert("historical-note", "note", current.id, {
      title: "PRIVATE_HISTORICAL_NOTE_SENTINEL", visibility: "client", reviewPeriod: past,
    });
    insert("other-tenant-note", "note", current.id, {
      title: "PRIVATE_OTHER_NOTE_SENTINEL", visibility: "client",
    }, currentTimestamp, "other-company");
    insert("current-invoice", "invoice", current.id, {
      ...hiddenModuleData, reference: "INV-CURRENT", amountUsd: 1250, audience: "client",
      status: "submitted", issuedOn: currentDate, source: "PRIVATE_INVOICE_SOURCE_SENTINEL",
    });
    insert("current-lead", "lead", "", {
      ...hiddenModuleData, name: "Current inquiry", source: "website", status: "new",
    });
    saveMonthlyManagementEstimate(admin, randomUUID(), {
      period: past, lowUsd: 200000, highUsd: 500000, source: "PRIVATE_MANAGEMENT_SOURCE_SENTINEL", expectedVersion: 0,
    });
    saveMonthlyManagementEstimate(admin, randomUUID(), {
      period, lowUsd: 900000, highUsd: 1000000, source: "PRIVATE_CURRENT_SOURCE_SENTINEL", expectedVersion: 0,
    });

    const invitation = createInvitation(admin, { email: guestEmail, role: "guest", tenantId: admin.tenantId, projectIds: [] });
    const accepted = await acceptInvitation(invitation.token, guestEmail, password);
    const guestCookie = sessionCookie(accepted.cookie).split(";")[0];
    const request = (query = "", cookie: string | null = guestCookie) => new NextRequest("https://tayco.test/api/guest-workspace" + query, {
      headers: cookie === null ? {} : { cookie },
    });
    const guest = await requireActor(request());
    const read = async (query = "", cookie: string | null = guestCookie) => {
      const response = await guestWorkspace.GET(request(query, cookie));
      assert.match(response.headers.get("cache-control") || "", /private/);
      assert.match(response.headers.get("cache-control") || "", /no-store/);
      assert.match(response.headers.get("vary") || "", /Cookie/i);
      assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
      assert.match(response.headers.get("x-robots-tag") || "", /nofollow/);
      assert.equal(response.headers.get("x-content-type-options"), "nosniff");
      const text = await response.text();
      assert.doesNotMatch(text, /PRIVATE_|blobPath|sourceRef|internalFile|clientEmail|contacts|ownerId|tenantId|projectIds|password_hash/);
      const body = JSON.parse(text);
      if (body.workspace) {
        assert.ok(Array.isArray(body.workspace.moduleRecords));
        for (const record of body.workspace.moduleRecords) {
          assert.deepEqual(Object.keys(record).sort(), ["id", "kind", "projectId", "title", "status", "date", "fields"].sort());
          assert.equal(typeof record.id, "string");
          assert.equal(typeof record.kind, "string");
          assert.ok(record.projectId === null || typeof record.projectId === "string");
          assert.equal(typeof record.title, "string");
          assert.ok(record.status === null || typeof record.status === "string");
          assert.ok(record.date === null || typeof record.date === "string");
          assert.ok(Array.isArray(record.fields));
          for (const field of record.fields) {
            assert.deepEqual(Object.keys(field).sort(), ["label", "value"]);
            assert.equal(typeof field.label, "string");
            assert.ok(field.value === null || typeof field.value === "string" || typeof field.value === "number");
            if (typeof field.value === "number") assert.ok(Number.isFinite(field.value));
          }
        }
      }
      return { response, body, text };
    };

    await t.test("current manual records cross the real session boundary as whitelisted DTOs", async () => {
      const { response, body } = await read();
      assert.equal(response.status, 200);
      assert.deepEqual(Object.keys(body), ["workspace"]);
      const workspace = body.workspace;
      assert.deepEqual(Object.keys(workspace).sort(), ["actor", "currentPeriod", "period", "asOf", "detailAllowed", "historicalSummary", "projects", "estimates", "documents", "moduleRecords", "review"].sort());
      assert.deepEqual(Object.keys(workspace.review).sort(),["id","detailPeriod","createdAt","expiresAt"].sort());
      assert.equal(workspace.review.expiresAt-workspace.review.createdAt,12*3600_000);
      assert.ok(Array.isArray(workspace.moduleRecords));
      assert.deepEqual(workspace.actor, { id: guest.id, email: guestEmail, role: "guest" });
      assert.equal(workspace.currentPeriod, period);
      assert.equal(workspace.period, period);
      assert.equal(workspace.detailAllowed, true);
      assert.ok(Number.isFinite(Date.parse(workspace.asOf)));
      assert.deepEqual(workspace.projects.map((item: { id: string }) => item.id), [current.id]);
      assert.equal(workspace.projects[0].name, "Current project");
      assert.equal(workspace.projects[0].location, "North site");
      assert.equal(workspace.projects[0].documentCount, 1);
      assert.deepEqual(Object.keys(workspace.projects[0]).sort(), ["id", "name", "period", "status", "progress", "location", "commercialStage", "documentCount"].sort());
      assert.deepEqual(workspace.estimates.map((item: { id: string }) => item.id), ["current-estimate"]);
      assert.equal(workspace.estimates[0].amountUsd, 1250);
      assert.equal(workspace.estimates[0].sourceLabel, "Published estimate");
      assert.deepEqual(Object.keys(workspace.estimates[0]).sort(), ["id", "projectId", "projectName", "name", "amountUsd", "currency", "estimatedOn", "sourceLabel"].sort());
      assert.deepEqual(workspace.documents.map((item: { id: string }) => item.id), [document.id]);
      assert.equal(workspace.documents[0].name, "Current plans.pdf");
      assert.equal(workspace.documents[0].downloadHref, "/api/documents/" + document.id);
      assert.deepEqual(Object.keys(workspace.documents[0]).sort(), ["id", "projectId", "projectName", "name", "contentType", "available", "viewerHref", "downloadHref"].sort());
      assert.deepEqual(workspace.historicalSummary.months.map((month: { period: string }) => month.period), [past]);
    });

    for (const section of guestSections) await t.test("current " + section + " selection remains readable", async () => {
      const { response, body } = await read("?" + new URLSearchParams({ period, section }));
      assert.equal(response.status, 200);
      assert.equal(body.workspace.detailAllowed, true);
      assert.equal(body.workspace.period, period);
      assert.equal(body.workspace.actor.role, "guest");
      assert.equal("accounts" in body.workspace, false);
      assert.equal("assignees" in body.workspace, false);
    });

    await t.test("shared current module records cross HTTP without internal, historical or other-tenant rows", async () => {
      const notes = await read("?" + new URLSearchParams({ period, section: "note" }));
      assert.equal(notes.response.status, 200);
      assert.ok(notes.body.workspace.moduleRecords.some((record: { id: string; kind: string; title: string }) =>
        record.id === "current-client-note" && record.kind === "note" && record.title === "Current shared update"));
      for (const section of ["invoice", "lead"]) {
        const { response, body } = await read("?" + new URLSearchParams({ period, section }));
        assert.equal(response.status, 200);
        assert.ok(body.workspace.moduleRecords.some((record: { id: string }) => record.id === "current-" + section));
      }
      const access = await read("?" + new URLSearchParams({ period, section: "access" }));
      assert.equal(access.response.status, 200);
      assert.ok(access.body.workspace.moduleRecords.every((record: { kind: string }) => !["user", "account", "invitation", "audit"].includes(record.kind)));
      assert.equal(access.text.includes(admin.email), false);
      assert.equal("accounts" in access.body.workspace, false);
      assert.equal("invitations" in access.body.workspace, false);
    });

    await t.test("a historical selection publishes only its general summary", async () => {
      for (const section of ["", "&section=summary"]) {
        const { response, body, text } = await read("?period=" + past + section);
        assert.equal(response.status, 200);
        assert.equal(body.workspace.period, past);
        assert.equal(body.workspace.detailAllowed, false);
        assert.deepEqual(body.workspace.projects, []);
        assert.deepEqual(body.workspace.estimates, []);
        assert.deepEqual(body.workspace.documents, []);
        assert.deepEqual(body.workspace.moduleRecords, []);
        assert.equal(body.workspace.historicalSummary.months.length, 1);
        const month = body.workspace.historicalSummary.months[0];
        assert.deepEqual(Object.keys(month).sort(), ["period", "lowUsd", "highUsd", "basis", "updatedAt"].sort());
        assert.equal(month.period, past);
        assert.equal(month.lowUsd, 200000);
        assert.equal(month.highUsd, 500000);
        assert.equal(month.basis, "management_estimate");
        assert.ok(Number.isFinite(Date.parse(month.updatedAt)));
        for (const id of [current.id, document.id, "current-estimate", "explicit-past-project"]) assert.equal(text.includes(id), false);
      }
    });

    for (const section of guestSections.filter(section => section !== "summary")) await t.test("historical " + section + " detail is forbidden", async () => {
      const { response, body } = await read("?" + new URLSearchParams({ period: past, section }));
      assert.equal(response.status, 403);
      assert.match(body.error, /Month closed/);
      assert.deepEqual(Object.keys(body), ["error"]);
    });

    for (const section of guestSections) await t.test("future " + section + " access is forbidden", async () => {
      assert.equal((await read("?" + new URLSearchParams({ period: future, section }))).response.status, 403);
    });

    const invalidQueries = [
      "?period=", "?period=not-a-period", "?period=2026-1", "?period=2026-13", "?period=0000-01",
      "?period=" + encodeURIComponent("2026-10 OR 1=1"), "?period=" + period + "&period=" + past,
      "?section=summary&section=plans", "?section=", "?section=unknown_module", "?section=executive", "?section=project", "?section=document", "?section=estimate",
      "?tenantId=other-company", "?projectId=" + current.id, "?role=admin", "?now=" + future,
    ];
    for (const query of invalidQueries) await t.test("malformed or scope-widening query rejects " + query, async () => {
      const { response, body } = await read(query);
      assert.equal(response.status, 422);
      assert.deepEqual(Object.keys(body), ["error"]);
    });

    await t.test("missing, forged and administrator sessions receive no guest snapshot", async () => {
      assert.equal((await read("", null)).response.status, 401);
      assert.equal((await read("", "tayco_session=not-a-valid-session")).response.status, 401);
      const { response, body } = await read("", adminCookie);
      assert.equal(response.status, 403);
      assert.deepEqual(Object.keys(body), ["error"]);
    });

    await t.test("sign-out invalidates the same retained browser cookie", async () => {
      await signOut(request());
      assert.equal((await read()).response.status, 401);
    });

    await t.test("revoking all sessions invalidates an otherwise valid guest cookie", async () => {
      const signed = await signIn(guestEmail, password);
      const cookie = sessionCookie(signed.cookie).split(";")[0];
      assert.equal((await read("", cookie)).response.status, 200);
      revokeUserSessionsPrivately(guestEmail);
      assert.equal((await read("", cookie)).response.status, 401);
    });

    await t.test("disabling the real account revokes current and subsequent access", async () => {
      const signed = await signIn(guestEmail, password);
      const cookie = sessionCookie(signed.cookie).split(";")[0];
      assert.equal((await read("", cookie)).response.status, 200);
      const account = listAccounts(admin).find(item => item.id === guest.id)!;
      updateAccountAccess(admin, { id: guest.id, role: "guest", projectIds: [], disabled: true, accessVersion: account.accessVersion });
      assert.equal((await read("", cookie)).response.status, 401);
      await assert.rejects(signIn(guestEmail, password));
    });
  } finally {
    if (opened) database().close();
    for (const name of names) if (old[name] === undefined) delete process.env[name]; else process.env[name] = old[name];
    rmSync(folder, { recursive: true, force: true });
  }
});
