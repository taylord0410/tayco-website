import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
import { acceptInvitation, createInvitation, getActor, provisionAdmin, sessionCookie, signIn, type Actor } from '../lib/auth';
import { database, documentForActor, execute, registerDocument, ErpError } from '../lib/erp';
import { documentExpiry, documentMaintenance, getReadableDocument, mutateDocumentLifecycle, purgeDocument, scanDocumentExpiry } from '../lib/document-lifecycle';
import { GET as maintenanceGet, POST as maintenancePost } from '../app/api/document-maintenance/route';
import { GET as download } from '../app/api/documents/[id]/route';
import { planTakeoffSourceRegistration, commitTakeoffSourceRegistration } from '../lib/takeoff-source-registration';
import { viewerScope, TakeoffViewerAccessError } from '../lib/takeoff-viewer-access';

test('document lifecycle preserves authorization, durable notices and uncertain storage boundaries', async t => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-doc-lifecycle-'));
  const names = ['TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_APP_URL', 'TAYCO_SESSION_SECRET', 'BLOB_READ_WRITE_TOKEN', 'VERCEL_BLOB_API_URL', 'TAYCO_DOCUMENT_RETENTION_DAYS', 'TAYCO_DOCUMENT_NOTICE_DAYS'];
  const previous = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const previousDispatcher = getGlobalDispatcher(); const agent = new MockAgent(); agent.disableNetConnect(); setGlobalDispatcher(agent);
  Object.assign(process.env, { TAYCO_AUTH_DB_PATH: path.join(folder, 'auth.sqlite'), TAYCO_ERP_DB_PATH: path.join(folder, 'erp.sqlite'), TAYCO_APP_URL: 'https://tayco.test', TAYCO_SESSION_SECRET: randomBytes(48).toString('hex'), VERCEL_BLOB_API_URL: 'https://blob-fixture.test' });
  delete process.env.BLOB_READ_WRITE_TOKEN; delete process.env.TAYCO_DOCUMENT_RETENTION_DAYS; delete process.env.TAYCO_DOCUMENT_NOTICE_DAYS;
  let opened = false;
  const denied = (status: number) => (error: unknown) => error instanceof ErpError && error.status === status;
  try {
    const password = 'Document-lifecycle-fixture-password-only!'; await provisionAdmin('admin@example.test', password); const admin = await signIn('admin@example.test', password);
    const project = execute(admin.actor, randomUUID(), { action: 'create_project', name: 'Lifecycle fixture project' }); opened = true;
    const ownerInvite = createInvitation(admin.actor, { email: 'owner@example.test', role: 'vendor', tenantId: admin.actor.tenantId, projectIds: [project.id], vendorId: 'fixture-supplier' });
    const ownerCookie = (await acceptInvitation(ownerInvite.token, 'owner@example.test', password)).cookie; const owner = (await signIn('owner@example.test', password)).actor;
    const client: Actor = { id: 'fixture-client', email: 'client@example.test', role: 'client', tenantId: admin.actor.tenantId, projectIds: [project.id] };
    const current = (id: string) => documentForActor(admin.actor, id);
    const fresh = () => registerDocument(owner, { blobPath: `vendor-docs/project-${randomUUID()}.pdf`, name: 'Lifecycle fixture.pdf', type: 'project', contentType: 'application/pdf', projectId: project.id });
    const mutate = (actor: Actor, id: string, action: 'delete' | 'restore' | 'hold' | 'retention', extra: Record<string, unknown> = {}) => mutateDocumentLifecycle(actor, { id, version: current(id).version, action, ...extra });
    const removed = () => { const entry = fresh(); mutate(owner, entry.id, 'delete'); return current(entry.id); };
    const retained = () => { const entry = removed(); mutate(admin.actor, entry.id, 'retention', { retentionDays: 0 }); return current(entry.id); };
    const api = (cookie: string, body?: unknown) => new Request('https://tayco.test/api/document-maintenance', { method: body ? 'POST' : 'GET', headers: { origin: 'https://tayco.test', 'Content-Type': 'application/json', ...(cookie ? { cookie: sessionCookie(cookie).split(';')[0] } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    await t.test('default policy disables physical deletion and received does not mean approved', async () => {
      const entry = fresh(); assert.equal(entry.data.status, 'pending_review'); assert.equal(documentMaintenance(owner).policy.automaticDeletion, false);
      mutate(owner, entry.id, 'delete'); const dryRun = await purgeDocument(admin.actor, { id: entry.id, version: current(entry.id).version }); assert.equal(dryRun.applied, false); assert.equal('eligible' in dryRun && dryRun.eligible, false);
      assert.equal(current(entry.id).data.purgeAttemptedAt, undefined);
    });
    await t.test('owner removal immediately blocks download, isolates other actors and can restore before an attempt', async () => {
      const entry = fresh(); const stale = entry.version; mutate(owner, entry.id, 'delete', { reason: 'Fixture removal' });
      assert.throws(() => getReadableDocument(owner, entry.id), denied(410));
      assert.throws(() => mutateDocumentLifecycle(owner, { id: entry.id, version: stale, action: 'restore' }), denied(409));
      assert.throws(() => mutateDocumentLifecycle({ ...owner, tenantId: 'other-tenant' }, { id: entry.id, version: current(entry.id).version, action: 'restore' }), denied(404));
      mutate(owner, entry.id, 'restore'); assert.equal(getReadableDocument(owner, entry.id).data.deletedAt, undefined);
      const reviewed = execute(admin.actor, randomUUID(), { action: 'review_document', id: entry.id, version: current(entry.id).version, status: 'approved', response: 'Fixture approval', visibility: 'client' });
      assert.throws(() => mutateDocumentLifecycle(client, { id: entry.id, version: reviewed.version, action: 'delete' }), denied(403));
      mutate(owner, entry.id, 'delete');
      const response = await download(new NextRequest(`https://tayco.test/api/documents/${entry.id}`, { headers: { cookie: sessionCookie(ownerCookie).split(';')[0] } }), { params: Promise.resolve({ id: entry.id }) }); assert.equal(response.status, 410);
    });
    await t.test('holds and retention require internal authority and malformed stored policy stays ineligible', async () => {
      const entry = retained(); mutate(admin.actor, entry.id, 'hold', { hold: true, reason: 'Private team preservation reason' });
      assert.throws(() => mutate(owner, entry.id, 'hold', { hold: false }), denied(403));
      assert.throws(() => mutate(owner, entry.id, 'retention', { retentionDays: 0 }), denied(403));
      await assert.rejects(purgeDocument(admin.actor, { id: entry.id, version: current(entry.id).version, apply: true }, async () => {}), denied(409));
      const publicEntry = documentMaintenance(owner).documents.find(doc => doc.id === entry.id)!;
      for (const key of ['holdReason', 'holdChangedBy', 'deletedBy', 'deleteReason', 'retentionDays', 'purgeAttemptToken', 'blobPath']) assert.equal(publicEntry.data[key], undefined);
      assert.equal(publicEntry.data.hold, true); assert.equal(publicEntry.effectiveRetentionDays, null);
      mutate(admin.actor, entry.id, 'hold', { hold: false }); const raw = current(entry.id); database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({ ...raw.data, retentionDays: '0' }), entry.id);
      const dry = await purgeDocument(admin.actor, { id: entry.id, version: current(entry.id).version }); assert.equal('eligible' in dry && dry.eligible, false);
    });
    await t.test('missing storage configuration fails before marking an attempt', async () => {
      const entry = retained(); await assert.rejects(purgeDocument(admin.actor, { id: entry.id, version: entry.version, apply: true }), denied(503)); assert.equal(current(entry.id).data.purgeAttemptedAt, undefined); mutate(owner, entry.id, 'restore');
    });
    await t.test('failed deletion is durable, blocks unsafe restore and supports an explicit retry', async () => {
      const entry = retained(); const failure = await purgeDocument(admin.actor, { id: entry.id, version: entry.version, apply: true }, async () => { throw new Error('Fixture uncertain network'); });
      assert.equal('confirmed' in failure && failure.confirmed, false); assert.equal(current(entry.id).data.purgeState, 'retry'); assert.throws(() => getReadableDocument(owner, entry.id), denied(410)); assert.throws(() => mutate(owner, entry.id, 'restore'), denied(409));
      let calls = 0; const retry = await purgeDocument(admin.actor, { id: entry.id, version: current(entry.id).version, apply: true }, async () => { calls++; }); assert.equal('confirmed' in retry && retry.confirmed, true); assert.equal(calls, 1); assert.equal(current(entry.id).data.blobPath, undefined); assert.ok(current(entry.id).data.purgedAt);
    });
    await t.test('in-flight purge rejects hold/restore and stale completion cannot overwrite a newer attempt', async () => {
      const entry = retained(); let finish!: () => void;
      const first = purgeDocument(admin.actor, { id: entry.id, version: entry.version, apply: true }, () => new Promise<void>(resolve => { finish = resolve; }));
      assert.equal(current(entry.id).data.purgeState, 'processing'); assert.throws(() => mutate(admin.actor, entry.id, 'hold', { hold: true, reason: 'Too late fixture hold' }), denied(409)); assert.throws(() => mutate(owner, entry.id, 'restore'), denied(409));
      await assert.rejects(purgeDocument(admin.actor, { id: entry.id, version: current(entry.id).version, apply: true }, async () => {}), denied(409));
      const raw = current(entry.id); database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({ ...raw.data, purgeLeaseUntil: '2000-01-01T00:00:00Z' }), entry.id);
      await purgeDocument(admin.actor, { id: entry.id, version: current(entry.id).version, apply: true }, async () => {}); finish(); const stale = await first; assert.equal('superseded' in stale && stale.superseded, true); assert.equal(current(entry.id).data.purgeState, 'purged');
    });
    await t.test('actual maintenance routes use session, CSRF, version and mocked SDK deletion boundaries', async () => {
      assert.equal((await maintenanceGet(api(''))).status, 401);
      const entry = retained(); const unauthorized = await maintenancePost(api(ownerCookie, { action: 'purge', id: entry.id, version: entry.version, apply: true })); assert.equal(unauthorized.status, 403);
      process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_fixture_fake-only'; let calls = 0;
      agent.get('https://blob-fixture.test').intercept({ path: /.*/, method: 'POST' }).reply(200, () => { calls++; return {}; }, { headers: { 'Content-Type': 'application/json' } });
      const response = await maintenancePost(api(admin.cookie, { action: 'purge', id: entry.id, version: entry.version, apply: true })); assert.equal(response.status, 200); assert.equal((await response.json()).result.confirmed, true); assert.equal(calls, 1);
      const csrf = new Request('https://tayco.test/api/document-maintenance', { method: 'POST', headers: { origin: 'https://other.test', cookie: sessionCookie(admin.cookie).split(';')[0], 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'scan_expiry' }) }); assert.equal((await maintenancePost(csrf)).status, 403);
      delete process.env.BLOB_READ_WRITE_TOKEN;
    });
    await t.test('expiry is independent from approval; approved renewals create durable deduplicated notices', () => {
      const now = new Date('2030-05-10T12:00:00Z');
      const approve = (date: string, status = 'approved') => { const entry = fresh(); return execute(admin.actor, randomUUID(), { action: 'review_document', id: entry.id, version: entry.version, status, response: 'Fixture review', expiresAt: date }); };
      const upcoming = approve('2030-05-11'); const expired = approve('2030-05-09'); const rejected = approve('2030-05-09', 'rejected');
      const pending = fresh(); database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({ ...pending.data, expiresAt: '2030-05-09' }), pending.id);
      assert.equal(documentExpiry(rejected, now).state, 'expired'); assert.equal(rejected.data.status, 'rejected'); assert.equal(documentExpiry(upcoming, new Date('2030-05-11T23:59:59Z')).state, 'expiring'); assert.equal(documentExpiry(upcoming, new Date('2030-05-12T00:00:00Z')).state, 'expired');
      scanDocumentExpiry(admin.actor, now); const second = scanDocumentExpiry(admin.actor, now); assert.equal(second.created, 0);
      const notices = documentMaintenance(admin.actor, now).notices; assert.ok(notices.some(n => n.documentId === upcoming.id)); assert.ok(notices.some(n => n.documentId === expired.id)); assert.equal(notices.some(n => n.documentId === rejected.id || n.documentId === pending.id), false);
      const jobs = () => (database().prepare("SELECT count(*) AS count FROM outbox WHERE kind='document_expiry' AND json_extract(payload,'$.referenceId')=?").get(upcoming.id) as { count: number }).count;
      assert.equal(jobs(), 1); scanDocumentExpiry(admin.actor, new Date('2030-05-12T12:00:00Z')); assert.equal(jobs(), 1);
      mutate(owner, upcoming.id, 'delete'); assert.equal(documentMaintenance(admin.actor, now).notices.some(n => n.documentId === upcoming.id), false);
    });
    await t.test('download rechecks a tombstone created while private storage is responding', async () => {
      process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_fixture_fake-only'; const entry = fresh();
      agent.get('https://fixture.private.blob.vercel-storage.com').intercept({ path: /.*/, method: 'GET' }).reply(200, () => { mutate(owner, entry.id, 'delete'); return Buffer.from('%PDF-fixture'); }, { headers: { 'Content-Type': 'application/pdf' } });
      const response = await download(new NextRequest(`https://tayco.test/api/documents/${entry.id}`, { headers: { cookie: sessionCookie(ownerCookie).split(';')[0] } }), { params: Promise.resolve({ id: entry.id }) }); assert.equal(response.status, 410);
    });
  } finally { if (opened) database().close(); for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } setGlobalDispatcher(previousDispatcher); await agent.close(); rmSync(folder, { recursive: true, force: true }); }
});

test('registered Takeoff sources use the protected reader and never enter Vercel storage deletion', async t => {
  const folder=mkdtempSync(path.join(tmpdir(),'tayco-source-document-lifecycle-'));
  const names=['TAYCO_AUTH_DB_PATH','TAYCO_ERP_DB_PATH','TAYCO_APP_URL','TAYCO_SESSION_SECRET','BLOB_READ_WRITE_TOKEN',
    'TAYCO_DOCUMENT_RETENTION_DAYS','TAYCO_TAKEOFF_MAPPING_PATH','TAYCO_TAKEOFF_RELATIONS_PATH',
    'TAYCO_TAKEOFF_MANIFEST_PATH','TAYCO_TAKEOFF_VIEWER_INTERNAL_URL'];
  const previous=Object.fromEntries(names.map(name=>[name,process.env[name]]));
  const previousDispatcher=getGlobalDispatcher(),agent=new MockAgent();
  agent.disableNetConnect();setGlobalDispatcher(agent);
  const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
  const filename=(name:string)=>path.join(folder,name);
  Object.assign(process.env,{
    TAYCO_AUTH_DB_PATH:filename('auth.sqlite'),TAYCO_ERP_DB_PATH:filename('erp.sqlite'),TAYCO_APP_URL:'https://tayco.test',
    TAYCO_SESSION_SECRET:randomBytes(48).toString('hex'),TAYCO_TAKEOFF_MAPPING_PATH:filename('mapping.json'),
    TAYCO_TAKEOFF_RELATIONS_PATH:filename('relations.json'),TAYCO_TAKEOFF_MANIFEST_PATH:filename('manifest.json'),
    TAYCO_TAKEOFF_VIEWER_INTERNAL_URL:'http://127.0.0.1:62661',
  });
  delete process.env.BLOB_READ_WRITE_TOKEN;delete process.env.TAYCO_DOCUMENT_RETENTION_DAYS;
  let opened=false;
  const fails=(status:number)=>(error:unknown)=>(error instanceof ErpError||error instanceof TakeoffViewerAccessError)&&error.status===status;
  try {
    const password='Source-document-fixture-password-only!';
    await provisionAdmin('source-admin@example.test',password);
    const admin=await signIn('source-admin@example.test',password);
    const manifest={
      schema_version:'takeoff-viewer-bundle/v1',bundle_id:'lifecycle-source-fixture',
      projects:[{key:'source-context',display_name:'Synthetic source project',identity_status:'resolved',document_ids:['source-document']}],
      documents:[{id:'source-document',project_key:'source-context',title:'Synthetic source plan',source_name:'synthetic.pdf',
        source_sha256:'c'.repeat(64),kind:'drawing_pdf',asset_id:'source-asset',page_count:1}],
      assets:[{id:'source-asset',path:'assets/synthetic.pdf',media_type:'application/pdf',size_bytes:12,sha256:'c'.repeat(64)}],
    };
    const manifestBytes=JSON.stringify(manifest)+'\n',manifestSha256=hash(manifestBytes);
    const relations={
      schemaVersion:'takeoff-viewer-relations/v1',bundleId:manifest.bundle_id,relationsId:'relations-'+'a'.repeat(64),manifestSha256,
      contexts:[{contextKey:'source-context',displayName:'Synthetic source project',identityStatus:'resolved',documentIds:['source-document']}],
      documents:[{documentId:'source-document',contextKeys:['source-context'],assetIds:['source-asset'],kind:'drawing_pdf'}],
      assets:[{assetId:'source-asset',documentIds:['source-document']}],
    };
    const relationsBytes=JSON.stringify(relations)+'\n',relationsSha256=hash(relationsBytes);
    writeFileSync(filename('manifest.json'),manifestBytes);writeFileSync(filename('relations.json'),relationsBytes);
    const input={
      expectedBundleId:manifest.bundle_id,expectedRelationsId:relations.relationsId,expectedRelationsSha256:relationsSha256,
      expectedManifestSha256:manifestSha256,contextKey:'source-context',viewerDocumentIds:['source-document'],
      visibility:'client',project:{mode:'create'},
    };
    const plan=planTakeoffSourceRegistration(admin.actor,input);
    const result=commitTakeoffSourceRegistration(admin.actor,randomUUID(),input,plan.planHash);
    opened=true;
    const id=result.documents[0].id,projectId=result.projectId;
    const current=()=>documentForActor(admin.actor,id);
    const sourceData={...current().data};
    assert.equal(sourceData.storage,'takeoff_viewer');
    assert.equal(Object.hasOwn(sourceData,'blobPath'),false);
    async function member(role:'client'|'guest'|'vendor') {
      const email='source-'+role+'@example.test';
      const invite=createInvitation(admin.actor,{email,role,tenantId:admin.actor.tenantId,projectIds:role==='guest'?[]:[projectId],...(role==='vendor'?{vendorId:'source-fixture-supplier'}:{})});
      const accepted=await acceptInvitation(invite.token,email,password);
      const actor=await getActor(new Request('https://tayco.test/portal',{headers:{cookie:sessionCookie(accepted.cookie).split(';')[0]}}));
      assert(actor);return {actor,cookie:accepted.cookie};
    }
    const client=await member('client'),guest=await member('guest'),vendor=await member('vendor');
    const mapping={
      schemaVersion:'tayco-takeoff-viewer-access/v2',bundleId:relations.bundleId,relationsSha256,
      mappings:[{tenantId:admin.actor.tenantId,projectId,contextKey:'source-context',documents:[{viewerDocumentId:'source-document',erpDocumentId:id}]}],
      guestReviews:[{tenantId:admin.actor.tenantId,guestId:guest.actor.id,projectId,period:'2026-10',viewerDocumentIds:['source-document']}],
    };
    const publish=(value:unknown=mapping)=>writeFileSync(filename('mapping.json'),JSON.stringify(value));
    publish();
    const request=(cookie:string,query='')=>new NextRequest('https://tayco.test/api/documents/'+id+query,{headers:{cookie:sessionCookie(cookie).split(';')[0]}});
    const read=(cookie:string,query='')=>download(request(cookie,query),{params:Promise.resolve({id})});
    const mutate=(action:'delete'|'restore'|'retention',extra:Record<string,unknown>={})=>mutateDocumentLifecycle(admin.actor,{id,version:current().version,action,...extra});
    const setData=(data:Record<string,unknown>)=>database().prepare('UPDATE records SET payload=?,version=version+1 WHERE id=?').run(JSON.stringify(data),id);

    await t.test('admin and assigned client redirect only to the current pinned same-origin reader; generic guest remains denied',async()=>{
      for(const cookie of [admin.cookie,client.cookie]) {
        const response=await read(cookie,'?redirect=https://attacker.test/');
        assert.equal(response.status,307);
        assert.equal(response.headers.get('Location'),'/api/takeoff-viewer/viewer/?embed=1&project=source-context&document=source-document&page=1');
        assert.equal(response.headers.get('Cache-Control'),'private, no-store');
      }
      assert.deepEqual(viewerScope(guest.actor,projectId).documentIds,['source-document']);
      assert.equal((await read(guest.cookie)).status,403);
      assert.equal((await read(vendor.cookie)).status,404);
      assert.throws(()=>getReadableDocument({...client.actor,tenantId:'other-company'},id),fails(404));
    });

    await t.test('missing configuration, source mismatch and publication revocation never redirect or call Blob',async()=>{
      delete process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL;
      assert.equal((await read(admin.cookie)).status,503);
      process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL='http://127.0.0.1:62661';
      delete process.env.TAYCO_TAKEOFF_MAPPING_PATH;
      assert.equal((await read(admin.cookie)).status,503);
      process.env.TAYCO_TAKEOFF_MAPPING_PATH=filename('mapping.json');
      for(const patch of [
        {bundleId:'different-bundle'},{contextKey:'different-context'},{viewerDocumentId:'different-document'},
        {viewerDocumentId:'../../private'},{manifestSha256:'d'.repeat(64)},{relationsId:'relations-'+'d'.repeat(64)},
      ]) {
        setData({...sourceData,...patch});
        const response=await read(admin.cookie);
        assert.equal(response.status,404);
        assert.equal(response.headers.get('Location'),null);
        assert.equal((await response.json()).error,'Document unavailable. Contact TAYCO.');
      }
      setData(sourceData);
      publish({...mapping,mappings:[],guestReviews:[]});
      assert.equal((await read(admin.cookie)).status,404);
      publish();
      assert.equal((await read(admin.cookie)).status,307);
    });

    await t.test('soft removal revokes direct and scoped reader access and restore preserves source identity',async()=>{
      mutate('delete',{reason:'Synthetic source access removal'});
      assert.equal((await read(admin.cookie)).status,410);
      assert.throws(()=>viewerScope(admin.actor,projectId),fails(404));
      assert.throws(()=>viewerScope(guest.actor,projectId),fails(403));
      mutate('restore');
      assert.equal((await read(admin.cookie)).status,307);
      assert.equal(current().data.viewerDocumentId,'source-document');
      assert.equal(Object.hasOwn(current().data,'blobPath'),false);
    });

    await t.test('retention preview and every physical purge path exclude the shared immutable source',async()=>{
      mutate('delete');mutate('retention',{retentionDays:0});
      const before=current();
      const preview=await purgeDocument(admin.actor,{id,version:before.version});
      assert.equal('eligible' in preview&&preview.eligible,false);
      assert.equal(preview.document.canPurge,false);
      assert.equal(preview.document.effectiveRetentionDays,null);
      let removals=0;
      await assert.rejects(purgeDocument(admin.actor,{id,version:current().version,apply:true}),fails(409));
      await assert.rejects(purgeDocument(admin.actor,{id,version:current().version,apply:true},async()=>{removals++;}),fails(409));
      process.env.BLOB_READ_WRITE_TOKEN='vercel_blob_rw_synthetic_should_not_be_used';
      await assert.rejects(purgeDocument(admin.actor,{id,version:current().version,apply:true}),fails(409));
      assert.equal(removals,0);
      assert.equal(current().version,before.version);
      for(const key of ['purgeAttemptedAt','purgeState','purgedAt'])assert.equal(current().data[key],undefined);
      // Even an invalid legacy mixed-storage field cannot override the external storage marker.
      setData({...current().data,blobPath:'vendor-docs/project-'+randomUUID()+'.pdf'});
      await assert.rejects(purgeDocument(admin.actor,{id,version:current().version,apply:true},async()=>{removals++;}),fails(409));
      assert.equal(removals,0);
      setData({...sourceData,deletedAt:new Date().toISOString(),retentionDays:0});
      mutate('restore');
      assert.equal((await read(admin.cookie)).status,307);
      const legacy={...sourceData};delete legacy.storage;
      setData(legacy);
      assert.equal((await read(admin.cookie)).status,404);
      setData(sourceData);
    });
  } finally {
    if(opened)database().close();
    for(const [key,value] of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}
    setGlobalDispatcher(previousDispatcher);await agent.close();rmSync(folder,{recursive:true,force:true});
  }
});
