import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { provisionAdmin, signIn, createInvitation, acceptInvitation, requireActor, sessionCookie, revokeUserSessionsPrivately } from "../lib/auth";
import { database, execute, registerDocument } from "../lib/erp";
import { viewerScope, type ViewerRelations } from "../lib/takeoff-viewer-access";
import { GET as gateway } from "../app/api/takeoff-viewer/[[...path]]/route";
import { GET as documentRoute } from "../app/api/documents/[id]/route";
import { profileAReviewSource } from "../lib/profile-a-review-source";
import { syntheticViewerCohort } from "./viewer-cohort-fixture";

const sha = (value: string) => createHash("sha256").update(value).digest("hex");
const password = "SYNTHETIC-consumer-cohort-2026!";
const roles = ["admin", "staff", "client", "vendor", "guest"] as const;
type Role = typeof roles[number];
const prefix = "/api/takeoff-viewer";
function deferred() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve; }); return { promise, release }; }

async function fixture(run: (f: Awaited<ReturnType<typeof makeFixture>>) => Promise<void>) {
  const f = await makeFixture();
  try { await run(f); } finally { f.cleanup(); }
}
async function makeFixture() {
  const folder = mkdtempSync(path.join(tmpdir(), "tayco-consumer-cohort-")), old = { ...process.env }, originalFetch = globalThis.fetch;
  for (const key of Object.keys(process.env)) if (key.startsWith("TAYCO_")) delete process.env[key];
  Object.assign(process.env, { TAYCO_AUTH_DB_PATH: path.join(folder, "auth.sqlite"), TAYCO_ERP_DB_PATH: path.join(folder, "erp.sqlite"),
    TAYCO_SESSION_SECRET: "synthetic-cohort-secret-".repeat(4), TAYCO_APP_URL: "https://tayco.test",
    TAYCO_TAKEOFF_MANIFEST_PATH: path.join(folder, "manifest.json"), TAYCO_TAKEOFF_RELATIONS_PATH: path.join(folder, "relations.json"),
    TAYCO_TAKEOFF_MAPPING_PATH: path.join(folder, "mapping.json"), TAYCO_TAKEOFF_VIEWER_INTERNAL_URL: "http://127.0.0.1:9997" });
  await provisionAdmin("cohort-admin@example.test", password);
  const signed = await signIn("cohort-admin@example.test", password), admin = signed.actor;
  const project = execute(admin, randomUUID(), { action: "create_project", name: "SYNTHETIC cohort references" });
  const entries = [0, 1].map(i => registerDocument(admin, { projectId: project.id, type: "project",
    name: "SYNTHETIC " + i + ".pdf", blobPath: "synthetic/" + i + ".pdf", contentType: "application/pdf" }));
  const cookies = { admin: signed.cookie } as Record<Role, string>;
  for (const role of roles.filter(role => role !== "admin")) {
    const email = "cohort-" + role + "@example.test";
    const invite = createInvitation(admin, { email, role, tenantId: admin.tenantId,
      projectIds: role === "guest" ? [] : [project.id], ...(role === "vendor" ? { vendorId: "synthetic-vendor" } : {}) });
    cookies[role] = (await acceptInvitation(invite.token, email, password)).cookie;
  }
  const request = (role: Role, tail: string, init: NonNullable<ConstructorParameters<typeof NextRequest>[1]> = {}) => {
    const headers = new Headers(init.headers); headers.set("cookie", sessionCookie(cookies[role]).split(";")[0]); headers.set("origin", "https://tayco.test");
    return new NextRequest("https://tayco.test" + tail, { ...init, headers });
  };
  const actors = {} as Record<Role, Awaited<ReturnType<typeof requireActor>>>;
  for (const role of roles) actors[role] = await requireActor(request(role, "/portal"));
  const relations: ViewerRelations = { schemaVersion: "takeoff-viewer-relations/v1", bundleId: "synthetic-parent",
    manifestSha256: "b".repeat(64), relationsId: "relations-" + "a".repeat(64),
    contexts: ["a", "b"].map(key => ({ contextKey: "ctx-" + key, displayName: "SYNTHETIC " + key,
      identityStatus: "resolved", documentIds: ["doc-" + key] })),
    documents: ["a", "b"].map(key => ({ documentId: "doc-" + key, contextKeys: ["ctx-" + key], assetIds: ["asset-" + key], kind: "drawing_pdf" })),
    assets: ["a", "b"].map(key => ({ assetId: "asset-" + key, documentIds: ["doc-" + key] })) };
  let cohort = syntheticViewerCohort(folder, relations, { "doc-a": "a".repeat(64), "doc-b": "b".repeat(64) });
  const mapping = { schemaVersion: "tayco-takeoff-viewer-access/v2", bundleId: relations.bundleId, relationsSha256: cohort.relationsSha256,
    mappings: ["a", "b"].map((key, i) => ({ tenantId: admin.tenantId, projectId: project.id, contextKey: "ctx-" + key,
      documents: [{ viewerDocumentId: "doc-" + key, erpDocumentId: entries[i].id }] })),
    guestReviews: [{ tenantId: admin.tenantId, guestId: actors.guest.id, projectId: project.id,
      period: new Date().toISOString().slice(0, 7), viewerDocumentIds: ["doc-a"] }] };
  const publish = () => {
    writeFileSync(process.env.TAYCO_TAKEOFF_RELATIONS_PATH!, cohort.rawRelations);
    mapping.bundleId = relations.bundleId; mapping.relationsSha256 = cohort.relationsSha256;
    writeFileSync(process.env.TAYCO_TAKEOFF_MAPPING_PATH!, JSON.stringify(mapping));
  };
  publish();
  const origin = { bundleId: "synthetic-origin", manifestSha256: "1".repeat(64), relationsId: "relations-" + "2".repeat(64), relationsSha256: "3".repeat(64) };
  const data = (i = 0): Record<string, unknown> => JSON.parse(String(database().prepare("SELECT payload FROM records WHERE id=?").get(entries[i].id)!.payload));
  const setData = (value: Record<string, unknown>, i = 0) => database().prepare("UPDATE records SET payload=?,version=version+1 WHERE id=?").run(JSON.stringify(value), entries[i].id);
  for (const [i, entry] of entries.entries()) setData({ ...entry.data, ...cohort.delivery("doc-" + ["a", "b"][i]),
    visibility: i === 0 ? "client" : "owner", ...(i === 0 ? { registeredSourceIdentity: origin } : {}) }, i);
  database().prepare("UPDATE records SET owner_id=? WHERE id=?").run(actors.vendor.id, entries[0].id);
  const calls: string[] = [];
  const headers = () => ({ "Content-Type": "application/pdf", "X-Takeoff-Bundle-Id": relations.bundleId, "X-Takeoff-Manifest-Sha256": relations.manifestSha256 });
  globalThis.fetch = async input => { calls.push(String(input)); return new Response("%PDF-SYNTHETIC", { headers: headers() }); };
  const snapshot = () => database().prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(row =>
    ({ table: row.name, hash: sha(JSON.stringify(database().prepare('SELECT * FROM "' + String(row.name).replaceAll('"', '""') + '"').all())) }));
  return { folder, actors, cookies, request, relations, mapping, entries, project, calls, origin, data, setData, headers, publish, snapshot,
    advance() { relations.bundleId = "synthetic-candidate"; relations.relationsId = "relations-" + "d".repeat(64);
      cohort = syntheticViewerCohort(folder, relations, { "doc-a": "a".repeat(64), "doc-b": "b".repeat(64) }); publish();
      for (let i = 0; i < entries.length; i++) setData({ ...data(i), ...cohort.delivery("doc-" + ["a", "b"][i]) }, i);
    },
    cleanup() { globalThis.fetch = originalFetch; database().close();
      for (const key of Object.keys(process.env)) if (key.startsWith("TAYCO_")) delete process.env[key];
      for (const [key, value] of Object.entries(old)) if (key.startsWith("TAYCO_")) process.env[key] = value;
      rmSync(folder, { recursive: true, force: true }); },
  };
}

for (const role of roles) {
  test("consumer cohort: persisted " + role + " retains exact approved source, no endpoint widening", async () => fixture(async f => {
    const response = await gateway(f.request(role, prefix + "/api/v1/assets/asset-a"));
    assert.equal(response.status, 200); assert.equal(await response.text(), "%PDF-SYNTHETIC");
    const before = f.calls.length;
    assert.equal((await gateway(f.request(role, prefix + "/api/v1/assets/not-approved"))).status, 404);
    assert.equal(f.calls.length, before);
    assert.deepEqual(f.data().registeredSourceIdentity, f.origin);
    assert.ok(!Object.hasOwn(f.data(1), "registeredSourceIdentity"), "origin absence is retained, never invented");
  }));
  test("consumer cohort: " + role + " denies every current delivery drift before upstream", async t => fixture(async f => {
    const original = f.data(), originOnly = { ...original, bundleId: f.origin.bundleId, manifestSha256: f.origin.manifestSha256,
      relationsId: f.origin.relationsId, relationsSha256: f.origin.relationsSha256 };
    const faults = { bundleId: "wrong-bundle", manifestSha256: "f".repeat(64), relationsId: "relations-" + "f".repeat(64),
      relationsSha256: "f".repeat(64), sourceSha256: "f".repeat(64), contextKey: "ctx-b", viewerDocumentId: "doc-b",
      storage: "blob", sourceKind: "reference", contentType: "text/plain" };
    for (const [field, value] of Object.entries(faults)) await t.test(field, async () => {
      f.setData({ ...original, [field]: value }); const before = f.calls.length, tables = f.snapshot();
      const response = await gateway(f.request(role, prefix + "/api/v1/assets/asset-a"));
      assert.ok([403, 404].includes(response.status), field + ": " + response.status);
      assert.equal(f.calls.length, before); assert.deepEqual(f.snapshot(), tables);
    });
    const missing = { ...original }; delete missing.relationsSha256; f.setData(missing);
    assert.ok([403, 404].includes((await gateway(f.request(role, prefix + "/api/v1/assets/asset-a"))).status));
    f.setData(originOnly); assert.ok([403, 404].includes((await gateway(f.request(role, prefix + "/api/v1/assets/asset-a"))).status), "original pins cannot substitute for current delivery");
    f.setData(original);
    assert.equal((await gateway(f.request(role, prefix + "/api/v1/assets/asset-a", { method: "HEAD" }))).status, 200);
  }));
}

test("consumer cohort: complete synthetic transition is usable and retains both original identity classes", async () => fixture(async f => {
  const old = viewerScope(f.actors.admin), original = f.data().registeredSourceIdentity;
  f.advance(); const fresh = viewerScope(f.actors.admin);
  assert.notEqual(old.bundleId, fresh.bundleId); assert.notEqual(old.relationsSha256, fresh.relationsSha256);
  assert.deepEqual(fresh.documentIds, old.documentIds); assert.deepEqual(f.data().registeredSourceIdentity, original);
  assert.ok(!Object.hasOwn(f.data(1), "registeredSourceIdentity"));
  assert.equal((await gateway(f.request("guest", prefix + "/api/v1/assets/asset-a"))).status, 200);
}));

test("consumer cohort: manifest missing, raw pin drift, and same hash in another context never fall back", async () => fixture(async f => {
  const filename = process.env.TAYCO_TAKEOFF_MANIFEST_PATH!, raw = readFileSync(filename);
  delete process.env.TAYCO_TAKEOFF_MANIFEST_PATH;
  assert.equal((await gateway(f.request("admin", prefix + "/api/v1/assets/asset-a"))).status, 503);
  process.env.TAYCO_TAKEOFF_MANIFEST_PATH = filename; writeFileSync(filename, Buffer.concat([raw, Buffer.from(" ")]));
  assert.equal((await gateway(f.request("admin", prefix + "/api/v1/assets/asset-a"))).status, 503);
  writeFileSync(filename, raw);
  f.setData({ ...f.data(), contextKey: "ctx-b" }); // Source digest is untouched; context is independently required.
  assert.equal((await gateway(f.request("admin", prefix + "/api/v1/assets/asset-a"))).status, 404);
  assert.equal(f.calls.length, 0);
}));

test("consumer cohort: source changed while provider headers wait releases zero bytes", async () => fixture(async f => {
  let reads = 0;
  globalThis.fetch = async () => { f.setData({ ...f.data(), sourceSha256: "f".repeat(64) });
    return new Response(new ReadableStream({ pull(controller) { reads++; controller.enqueue(new Uint8Array([1])); controller.close(); } }, { highWaterMark: 0 }), { headers: f.headers() }); };
  const response = await gateway(f.request("admin", prefix + "/api/v1/assets/asset-a"));
  assert.equal(response.status, 404); assert.equal(reads, 0);
}));

test("consumer cohort: source changed during a pending stream read cannot release that chunk", async () => fixture(async f => {
  const started = deferred(), release = deferred();
  globalThis.fetch = async () => new Response(new ReadableStream<Uint8Array>({ async pull(controller) {
    started.release(); await release.promise; controller.enqueue(new Uint8Array([1, 2, 3])); controller.close();
  } }, { highWaterMark: 0 }), { headers: f.headers() });
  const response = await gateway(f.request("admin", prefix + "/api/v1/assets/asset-a")); assert.equal(response.status, 200);
  const reading = response.body!.getReader().read(); await started.promise;
  f.setData({ ...f.data(), relationsSha256: "f".repeat(64) }); release.release();
  await assert.rejects(reading);
}));

test("consumer cohort: even a coherent repin after IO cannot switch an in-flight relation artifact", async () => fixture(async f => {
  globalThis.fetch = async () => {
    const raw = readFileSync(process.env.TAYCO_TAKEOFF_RELATIONS_PATH!, "utf8") + "\n", pin = sha(raw);
    writeFileSync(process.env.TAYCO_TAKEOFF_RELATIONS_PATH!, raw);
    f.mapping.relationsSha256 = pin; writeFileSync(process.env.TAYCO_TAKEOFF_MAPPING_PATH!, JSON.stringify(f.mapping));
    for (let i = 0; i < f.entries.length; i++) f.setData({ ...f.data(i), relationsSha256: pin }, i);
    return new Response("%PDF-SYNTHETIC", { headers: f.headers() });
  };
  assert.equal((await gateway(f.request("admin", prefix + "/api/v1/assets/asset-a"))).status, 403);
}));

test("consumer cohort: actual redirect and profile-link projection withdraw on delivery mismatch", async () => fixture(async f => {
  const path = "/api/documents/" + f.entries[0].id;
  const good = await documentRoute(f.request("admin", path), { params: Promise.resolve({ id: f.entries[0].id }) });
  assert.equal(good.status, 307); assert.match(good.headers.get("location")!, /project=ctx-a&document=doc-a/);
  const source = { schemaVersion: "tayco-profile-a-review/v1", tenantId: f.actors.admin.tenantId, period: new Date().toISOString().slice(0, 7),
    rows: [{ id: "synthetic-opportunity", name: "SYNTHETIC source", location: null, contractor: null, section: "undated", reportedDeadline: null,
      documents: [{ name: "SYNTHETIC source.pdf", state: "received", sha256: "a".repeat(64) }] }] };
  const bytes = JSON.stringify(source); process.env.TAYCO_PROFILE_A_REVIEW_SOURCE = pathModule(f.folder, "source.json");
  process.env.TAYCO_PROFILE_A_REVIEW_SHA256 = sha(bytes); writeFileSync(process.env.TAYCO_PROFILE_A_REVIEW_SOURCE, bytes);
  assert.equal(profileAReviewSource(f.actors.admin).linkedDocumentCount, 1);
  f.setData({ ...f.data(), relationsSha256: "f".repeat(64) });
  const rejected = await documentRoute(f.request("admin", path), { params: Promise.resolve({ id: f.entries[0].id }) });
  assert.equal(rejected.status, 404); assert.equal(rejected.headers.get("location"), null);
  const data = profileAReviewSource(f.actors.admin); assert.equal(data.receivedDocumentCount, 1); assert.equal(data.linkedDocumentCount, 0);
  assert.equal(data.rows[0].documents[0].viewerHref, null);
}));
const pathModule = (folder: string, filename: string) => path.join(folder, filename);

test("consumer cohort: revocation while provider IO waits is checked using the persisted request", async () => fixture(async f => {
  globalThis.fetch = async () => { revokeUserSessionsPrivately(f.actors.admin.email, true); return new Response("%PDF-SYNTHETIC", { headers: f.headers() }); };
  assert.equal((await gateway(f.request("admin", prefix + "/api/v1/assets/asset-a"))).status, 401);
}));

test("consumer cohort: document redirect reauthenticates after its actual params await", async () => fixture(async f => {
  const entered = deferred(), release = deferred();
  const params = { then(resolve: (value: {id: string}) => void) {
    entered.release(); return release.promise.then(() => resolve({id: f.entries[0].id}));
  } } as unknown as Promise<{id: string}>;
  const pending = documentRoute(f.request("admin", "/api/documents/" + f.entries[0].id), { params });
  await entered.promise; revokeUserSessionsPrivately(f.actors.admin.email, true); release.release();
  const response = await pending; assert.equal(response.status, 401); assert.equal(response.headers.get("location"), null);
}));

test("consumer cohort: document JSON digest must match its pinned manifest, not only have valid hex syntax", async () => fixture(async f => {
  let digest = "a".repeat(64);
  globalThis.fetch = async () => new Response(JSON.stringify({ id: "doc-a", title: "SYNTHETIC source", kind: "drawing_pdf",
    page_count: 1, source_name: "SYNTHETIC.pdf", project_key: "ctx-a", source_sha256: digest, asset_media_type: "application/pdf",
    asset_url: prefix + "/api/v1/assets/asset-a", revisions: [], metadata: {}, references: [], measurements: [], boq: [], paragraphs: [],
    index: null, declared_scale: null, ocr_status: null, index_status: null, calibration_status: null }),
    { headers: {...f.headers(), "Content-Type": "application/json"} });
  const good = await gateway(f.request("admin", prefix + "/api/v1/documents/doc-a")); assert.equal(good.status, 200); await good.text();
  digest = "b".repeat(64);
  assert.equal((await gateway(f.request("admin", prefix + "/api/v1/documents/doc-a"))).status, 502);
}));

test("consumer cohort: persisted actor cannot use a document moved to another tenant during provider IO", async () => fixture(async f => {
  globalThis.fetch = async () => {
    database().prepare("UPDATE records SET tenant_id='synthetic-other-tenant' WHERE id=?").run(f.entries[0].id);
    return new Response("%PDF-SYNTHETIC", { headers: f.headers() });
  };
  const response = await gateway(f.request("admin", prefix + "/api/v1/assets/asset-a")); assert.equal(response.status, 404);
}));

test("consumer cohort: an in-flight response retains its complete authorized scope snapshot", async () => fixture(async f => {
  let reads = 0;
  globalThis.fetch = async () => {
    f.setData({...f.data(1), deletedAt: new Date().toISOString()},1);
    return new Response(new ReadableStream({pull(controller){reads++;controller.enqueue(new Uint8Array([1]));controller.close();}},{highWaterMark:0}),{headers:f.headers()});
  };
  assert.equal((await gateway(f.request("admin",prefix+"/api/v1/assets/asset-a"))).status,403);
  assert.equal(reads,0);
}));
