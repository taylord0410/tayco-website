import { syntheticViewerCohort } from './viewer-cohort-fixture';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,randomUUID} from 'node:crypto';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {NextRequest} from 'next/server';
import {provisionAdmin,signIn,createInsurerReviewInvitationPrivately,createInvitation,acceptInvitation,getActor,requireActor,revokeInvitation,createSession} from '../lib/auth';
import {database} from '../lib/erp';
import {insurerReviewData} from '../lib/insurer-review';
import {insurerPolicy,parseInsurerPolicy} from '../lib/insurer-review-policy';
import {viewerScope,guestProjectReviews} from '../lib/takeoff-viewer-access';
import {guestConsoleSnapshot,guestConsoleDocument} from '../lib/guest-workspace';
import {guestMonthlyEstimateSummary} from '../lib/monthly-management-estimates';
import {GET as reviewRoute} from '../app/api/insurer-review/route';
import {GET as workspaceRoute} from '../app/api/guest-workspace/route';
import {GET as summaryRoute} from '../app/api/guest-summary/route';
import {POST as loginRoute} from '../app/api/auth/login/route';
import {GET as sessionRoute} from '../app/api/auth/session/route';
import {GET as documentRoute} from '../app/api/documents/[id]/route';
import {GET as gatewayRoute} from '../app/api/takeoff-viewer/[[...path]]/route';
import {POST as activityRoute} from '../app/api/guest-activity/route';
import {GUEST_PRIVACY_VERSION} from '../lib/guest-privacy-contract';
import {saveGuestPrivacy} from '../lib/guest-privacy';
const password='Synthetic-recipient-review-2026!';
const hash=(bytes:string|Buffer)=>createHash('sha256').update(bytes).digest('hex');
const denied=(status:number)=>(error:unknown)=>error instanceof Error&&'status'in error&&error.status===status;
async function fixture(run:(f:Awaited<ReturnType<typeof makeFixture>>)=>Promise<void>){
 const f=await makeFixture();try{await run(f);}finally{f.cleanup();}
}
async function makeFixture(){
 const folder=mkdtempSync(path.join(tmpdir(),'tayco-recipient-')),old={...process.env},period=new Date().toISOString().slice(0,7);
 const env={TAYCO_AUTH_DB_PATH:path.join(folder,'auth.sqlite'),TAYCO_ERP_DB_PATH:path.join(folder,'erp.sqlite'),TAYCO_SESSION_SECRET:'synthetic-recipient-secret-'.repeat(3),
 TAYCO_TAKEOFF_MAPPING_PATH:path.join(folder,'mapping.json'),TAYCO_TAKEOFF_RELATIONS_PATH:path.join(folder,'relations.json'),TAYCO_TAKEOFF_VIEWER_INTERNAL_URL:'http://127.0.0.1:9998',TAYCO_APP_URL:'https://tayco.test',
 TAYCO_TAKEOFF_MANIFEST_PATH:path.join(folder,'manifest.json'),TAYCO_PROFILE_A_REVIEW_SOURCE:path.join(folder,'source.json'),TAYCO_INSURER_REVIEW_POLICY:path.join(folder,'recipient.json')};Object.assign(process.env,env);
 await provisionAdmin('admin@example.test',password);const admin=(await signIn('admin@example.test',password)).actor;
 const docSha=hash('synthetic approved drawing'),relations={schemaVersion:'takeoff-viewer-relations/v1',bundleId:'fixture-recipient-bundle',relationsId:'relations-'+'a'.repeat(64),manifestSha256:'b'.repeat(64),
 contexts:[{contextKey:'ctx-a',displayName:'Private context canary',identityStatus:'resolved',documentIds:['viewer-one','viewer-private']}],
 documents:[{documentId:'viewer-one',contextKeys:['ctx-a'],assetIds:['asset-one','shared-asset'],kind:'drawing_pdf'},{documentId:'viewer-private',contextKeys:['ctx-a'],assetIds:['asset-private','shared-asset'],kind:'drawing_pdf'}],
 assets:[{assetId:'asset-one',documentIds:['viewer-one']},{assetId:'asset-private',documentIds:['viewer-private']},{assetId:'shared-asset',documentIds:['viewer-one','viewer-private']}]};
 const cohort=syntheticViewerCohort(folder,relations,{'viewer-one':docSha,'viewer-private':hash('private')});
 const relBytes=cohort.rawRelations;writeFileSync(env.TAYCO_TAKEOFF_RELATIONS_PATH,relBytes);
 const mapping={schemaVersion:'tayco-takeoff-viewer-access/v2',bundleId:relations.bundleId,relationsSha256:hash(relBytes),mappings:[{tenantId:admin.tenantId,projectId:'project-one',contextKey:'ctx-a',documents:[{viewerDocumentId:'viewer-one',erpDocumentId:'erp-one'},{viewerDocumentId:'viewer-private',erpDocumentId:'erp-private'}]}],guestReviews:[] as unknown[]};writeFileSync(env.TAYCO_TAKEOFF_MAPPING_PATH,JSON.stringify(mapping));
 const source={schemaVersion:'tayco-profile-a-review/v1',tenantId:admin.tenantId,period,rows:[
 {id:'reported-one',name:'Synthetic approved opportunity',location:'Fixture City',contractor:null,section:'dated',reportedDeadline:period+'-09',documents:[{name:'Approved drawing.pdf',state:'received',sha256:docSha}]},
 {id:'unselected-opportunity',name:'UNSELECTED_SOURCE_CANARY',location:null,contractor:null,section:'undated',reportedDeadline:null,documents:[{name:'Pending source.pdf',state:'pending',sha256:null}]}]};
 writeFileSync(env.TAYCO_PROFILE_A_REVIEW_SOURCE,JSON.stringify(source));
 const policy={schemaVersion:'tayco-insurer-review-policy/v1',tenantId:admin.tenantId,period,sourceSha256:hash(JSON.stringify(source)),bundleId:relations.bundleId,manifestSha256:relations.manifestSha256,relationsId:relations.relationsId,
 opportunityIds:['reported-one'],documents:[{projectId:'project-one',erpDocumentId:'erp-one',viewerDocumentId:'viewer-one',contextKey:'ctx-a',sourceSha256:docSha,assetIds:['asset-one','shared-asset']}]};
 const pin=hash(JSON.stringify(policy));writeFileSync(env.TAYCO_INSURER_REVIEW_POLICY,JSON.stringify(policy));
 const put=(id:string,kind:string,project:string,data:Record<string,unknown>)=>database().prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(id,kind,admin.tenantId,project,admin.id,JSON.stringify(data),new Date().toISOString(),new Date().toISOString());
 const approved={...cohort.delivery('viewer-one'),name:'Private ERP label',type:'project',storage:'takeoff_viewer',viewerDocumentId:'viewer-one',contextKey:'ctx-a',sourceSha256:docSha,bundleId:relations.bundleId,manifestSha256:relations.manifestSha256,relationsId:relations.relationsId,amountUsd:89371,internalSecret:'FINANCIAL_INTERNAL_CANARY'};
 put('project-one','project','project-one',{name:'Private reference collection',reviewPeriod:period,status:'source_review',amountUsd:89371});put('erp-one','document','project-one',approved);
 put('erp-private','document','project-one',{...approved,name:'PRIVATE_DOCUMENT_CANARY',viewerDocumentId:'viewer-private',sourceSha256:hash('private')});
 put('erp-blob','document','project-one',{name:'PRIVATE_BLOB_CANARY',type:'project',blobPath:'private/blob-canary.pdf'});put('project-other','project','project-other',{name:'AutoZone OTHER_PROJECT_CANARY'});
 const invitation=createInsurerReviewInvitationPrivately(admin,'recipient@example.test','recipient-request-0001',pin);
 const accepted=await acceptInvitation(invitation.token!,'recipient@example.test',password);const cookie=accepted.cookie;
 const req=(pathname:string,init:NonNullable<ConstructorParameters<typeof NextRequest>[1]>={})=>{const headers=new Headers(init.headers);headers.set('cookie','tayco_session='+encodeURIComponent(cookie));headers.set('origin','https://tayco.test');return new NextRequest('https://tayco.test'+pathname,{...init,headers});};
 const actor=(await getActor(req('/api/insurer-review')))!;
 return{folder,env,admin,actor,invitation,cookie,req,policy,pin,source,mapping,relations,approved,put,
  update:(id:string,payload:unknown)=>database().prepare('UPDATE records SET payload=?,version=version+1 WHERE id=?').run(JSON.stringify(payload),id),
  cleanup(){database().close();for(const key of Object.keys(env)){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}rmSync(folder,{recursive:true,force:true});}};
}
test('real insurer session has immutable recipient origin, minimal DTO and exact document scope',async()=>fixture(async f=>{
 assert.equal(f.actor.role,'guest');assert.equal(f.actor.review?.recipient?.policySha256,f.pin);
 const data=insurerReviewData(f.actor),serialized=JSON.stringify(data);assert.equal(data.rows.length,1);assert.equal(data.linkedDocumentCount,1);
 for(const forbidden of ['UNSELECTED_SOURCE_CANARY','FINANCIAL_INTERNAL_CANARY','PRIVATE_DOCUMENT_CANARY','amountUsd','89371','sourceSha256',f.folder,f.pin])assert.ok(!serialized.includes(forbidden),forbidden);
 assert.deepEqual(viewerScope(f.actor).documentIds,['viewer-one']);assert.deepEqual(viewerScope(f.actor).assetIds,['asset-one','shared-asset']);assert.deepEqual(guestProjectReviews(f.actor),[]);
 const entry=guestConsoleDocument(f.actor,'erp-one');assert.equal(entry.data.viewerDocumentId,'viewer-one');assert.equal('internalSecret'in entry.data,false);
 const response=await reviewRoute(f.req('/api/insurer-review'));assert.equal(response.status,200);assert.equal((await response.json()).review.rows.length,1);
 const logged=await loginRoute(f.req('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:f.actor.email,password})}));assert.equal(logged.status,200);assert.equal(JSON.stringify(await logged.json()).includes(f.pin),false);
 const publicActor=await (await sessionRoute(f.req('/api/auth/session'))).json();assert.equal(JSON.stringify(publicActor).includes(f.pin),false);
 const db=new DatabaseSync(f.env.TAYCO_AUTH_DB_PATH);try{assert.throws(()=>db.prepare("UPDATE auth_review_grants SET recipient_profile='company' WHERE id=?").run(f.actor.review!.id),/immutable/);}finally{db.close();}
}));
test('company finance, direct blobs, other projects and generic recipient fallback remain denied',async()=>fixture(async f=>{
 assert.throws(()=>guestConsoleSnapshot(f.actor),denied(403));assert.throws(()=>guestMonthlyEstimateSummary(f.actor),denied(403));
 for(const pathname of ['/api/guest-summary','/api/guest-workspace','/api/erp-suite','/api/finance/export','/api/hours/export','/api/project-dossier','/api/auth/invitations'])await assert.rejects(requireActor(f.req(pathname)),denied(403),pathname);
 assert.equal((await workspaceRoute(f.req('/api/guest-workspace'))).status,403);assert.equal((await summaryRoute(f.req('/api/guest-summary'))).status,403);
 for(const id of ['erp-private','erp-blob','nonexistent'])assert.equal((await documentRoute(f.req('/api/documents/'+id),{params:Promise.resolve({id})})).status,403);
 assert.throws(()=>viewerScope(f.actor,'project-other'),denied(403));
 const broad=createInvitation(f.admin,{email:f.actor.email,role:'guest',tenantId:f.actor.tenantId,projectIds:[],creationRequestId:'company-review-request-0002'});
 await acceptInvitation(broad.token!,f.actor.email,password);
 const stillBound=(await getActor(f.req('/api/insurer-review')))!;assert.equal(stillBound.review!.id,f.actor.review!.id);assert.equal(stillBound.review!.recipient!.kind,'insurer-a');
 const genericCookie=await createSession(f.actor.id,'reviewGrantId'in broad?broad.reviewGrantId:undefined);const generic=(await getActor(new Request('https://tayco.test/api/guest-workspace',{headers:{cookie:'tayco_session='+encodeURIComponent(genericCookie)}})))!;assert.equal(generic.review?.recipient,undefined);
 assert.equal((await reviewRoute(new Request('https://tayco.test/api/insurer-review',{headers:{cookie:'tayco_session='+encodeURIComponent(genericCookie)}}))).status,403);
}));
test('source tamper, another tenant, removed policy and incompatible delivery identity fail closed',async()=>fixture(async f=>{
 writeFileSync(f.env.TAYCO_INSURER_REVIEW_POLICY,JSON.stringify({...f.policy,opportunityIds:['unselected-opportunity']}));
 await assert.rejects(requireActor(f.req('/api/insurer-review')),denied(503));assert.equal((await reviewRoute(f.req('/api/insurer-review'))).status,503);
 writeFileSync(f.env.TAYCO_INSURER_REVIEW_POLICY,JSON.stringify(f.policy));
 assert.throws(()=>parseInsurerPolicy(Buffer.from(JSON.stringify(f.policy)),f.pin,'another-company',f.policy.period),denied(503));
 writeFileSync(f.env.TAYCO_PROFILE_A_REVIEW_SOURCE,JSON.stringify({...f.source,rows:[]}));await assert.rejects(requireActor(f.req('/api/insurer-review')),denied(503));
 writeFileSync(f.env.TAYCO_PROFILE_A_REVIEW_SOURCE,JSON.stringify(f.source));
 f.update('erp-one',{...f.approved,bundleId:'different-delivery'});assert.throws(()=>viewerScope(f.actor),denied(403));assert.equal(insurerReviewData(f.actor).linkedDocumentCount,0);
 for(const change of [{revokedAt:new Date().toISOString()},{status:'rejected'},{sourceSha256:hash('changed')},{contextKey:'other-context'},{reviewPeriod:'2020-01'}]){
  f.update('erp-one',{...f.approved,...change});assert.throws(()=>viewerScope(f.actor),denied(403));
 }
 f.update('erp-one',f.approved);assert.equal(viewerScope(f.actor).documentIds.length,1);
 rmSync(f.env.TAYCO_INSURER_REVIEW_POLICY);await assert.rejects(requireActor(f.req('/api/insurer-review')),denied(503));
}));
test('gateway denies sibling metadata and private assets before upstream; allowed Range remains scoped',async()=>fixture(async f=>{
 const original=globalThis.fetch;const requested:string[]=[];globalThis.fetch=async(input)=>{
  requested.push(String(input));return new Response(new Uint8Array([1,2,3,4]),{status:206,headers:{'Content-Type':'application/pdf','Content-Range':'bytes 0-3/4','X-Takeoff-Bundle-Id':f.relations.bundleId,'X-Takeoff-Manifest-Sha256':f.relations.manifestSha256}});
 };
 try{
  for(const resource of ['/api/v1/documents/viewer-private','/api/v1/assets/asset-private','/api/v1/projects/ctx-other']){
   const response=await gatewayRoute(f.req('/api/takeoff-viewer'+resource));assert.equal(response.status,404);assert.equal(requested.length,0);
  }
  const response=await gatewayRoute(f.req('/api/takeoff-viewer/api/v1/assets/asset-one',{headers:{range:'bytes=0-3'}}));assert.equal(response.status,206);assert.equal((await response.arrayBuffer()).byteLength,4);assert.equal(requested.length,1);
 }finally{globalThis.fetch=original;}
}));
test('recipient activity accepts only its mounted controls/resources after current consent',async()=>fixture(async f=>{
 saveGuestPrivacy(f.actor,{version:GUEST_PRIVACY_VERSION,optionalAnalytics:true});
 const post=(elementId:string,metadata:object={})=>activityRoute(f.req('/api/guest-activity',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taxonomyVersion:2,eventId:randomUUID(),elementId,...metadata})}));
 assert.equal((await post('review.section.select',{reviewSection:'timeline'})).status,200);
 assert.equal((await post('opportunity.open',{opportunityId:'reported-one'})).status,200);
 assert.equal((await post('opportunity.open',{opportunityId:'unselected-opportunity'})).status,403);
 assert.equal((await post('module.select',{section:'finance'})).status,403);
 assert.equal((await post('viewer.document.select',{documentId:'viewer-private'})).status,403);
 saveGuestPrivacy(f.actor,{version:GUEST_PRIVACY_VERSION,optionalAnalytics:false});assert.equal((await post('review.visit')).status,403);
}));
test('revocation and deadline never fall back to company review or broader metadata',async()=>fixture(async f=>{
 const db=new DatabaseSync(f.env.TAYCO_AUTH_DB_PATH);try{db.prepare('UPDATE auth_sessions SET expires_at=? WHERE review_grant_id=?').run(Date.now()-1,f.actor.review!.id);}finally{db.close();}
 assert.equal((await reviewRoute(f.req('/api/insurer-review'))).status,401);
 assert.throws(()=>insurerPolicy({...f.actor,review:{...f.actor.review!,expiresAt:Date.now()-1}}),denied(403));
 const cookie=await createSession(f.actor.id,f.actor.review!.id);revokeInvitation(f.admin,f.invitation.id);
 assert.equal(await getActor(new Request('https://tayco.test/api/insurer-review',{headers:{cookie:'tayco_session='+encodeURIComponent(cookie)}})),null);
}));

test('upstream processing money and labels are excluded from recipient JSON; wrong file identity is rejected',async()=>fixture(async f=>{
 const original=globalThis.fetch;
 const raw={id:'viewer-one',title:'FINANCIAL_TITLE_CANARY',kind:'drawing_pdf',page_count:2,source_name:'PRIVATE_PATH_CANARY',project_key:'ctx-a',source_sha256:f.policy.documents[0].sourceSha256,
 asset_media_type:'application/pdf',asset_url:'/api/takeoff-viewer/api/v1/assets/asset-one',metadata:{amountUsd:772211},references:[],
 measurements:[{amount:772211}],boq:[{rate:772211}],paragraphs:[{text:'INTERNAL_OCR_CANARY'}],index:{text:'INTERNAL_INDEX_CANARY'}};
 const headers={'Content-Type':'application/json','X-Takeoff-Bundle-Id':f.relations.bundleId,'X-Takeoff-Manifest-Sha256':f.relations.manifestSha256};
 globalThis.fetch=async()=>new Response(JSON.stringify(raw),{headers});
 try{
  const response=await gatewayRoute(f.req('/api/takeoff-viewer/api/v1/documents/viewer-one'));assert.equal(response.status,200);
  const text=await response.text();for(const canary of ['FINANCIAL_TITLE_CANARY','PRIVATE_PATH_CANARY','INTERNAL_OCR_CANARY','INTERNAL_INDEX_CANARY','772211'])assert.ok(!text.includes(canary),canary);
  const value=JSON.parse(text);assert.deepEqual(value.boq,[]);assert.deepEqual(value.measurements,[]);assert.equal(value.index,null);
  raw.source_sha256='c'.repeat(64);assert.equal((await gatewayRoute(f.req('/api/takeoff-viewer/api/v1/documents/viewer-one'))).status,502);
 }finally{globalThis.fetch=original;}
}));
test('new issuance rejects financial labels, excluded brand and extra policy fields before a grant can be created',async()=>fixture(async f=>{
 const before=new DatabaseSync(f.env.TAYCO_AUTH_DB_PATH);const count=before.prepare('SELECT count(*) AS n FROM auth_review_grants').get()!.n;before.close();
 for(const bad of ['Auto Zone hidden','USD 1000','https://private.example.test/file','C:\\private\\file','owner@example.test']){
  const source=structuredClone(f.source);source.rows[0].documents[0].name=bad;const bytes=JSON.stringify(source);writeFileSync(f.env.TAYCO_PROFILE_A_REVIEW_SOURCE,bytes);
  const policy={...f.policy,sourceSha256:hash(bytes)};const policyBytes=JSON.stringify(policy);writeFileSync(f.env.TAYCO_INSURER_REVIEW_POLICY,policyBytes);
  assert.throws(()=>createInsurerReviewInvitationPrivately(f.admin,'another@example.test','another-request-'+randomUUID(),hash(policyBytes)));
 }
 const bytes=Buffer.from(JSON.stringify({...f.policy,grantAllDocuments:true}));assert.throws(()=>parseInsurerPolicy(bytes,hash(bytes),f.actor.tenantId,f.policy.period));
 const after=new DatabaseSync(f.env.TAYCO_AUTH_DB_PATH);try{assert.equal(after.prepare('SELECT count(*) AS n FROM auth_review_grants').get()!.n,count);}finally{after.close();}
}));

test('recipient source receipt, withholding and current authorization are independent states',async()=>fixture(async f=>{
 const source=structuredClone(f.source);
 const received=source.rows[0].documents as {name:string;state:string;sha256:string|null}[];
 received.push({name:'Received retained fixture.pdf',state:'received',sha256:hash('retained document not in policy')});
 // Select the metadata row carrying the already-pending source too. Never mutate a pending source into received.
 const sourceBytes=JSON.stringify(source);writeFileSync(f.env.TAYCO_PROFILE_A_REVIEW_SOURCE,sourceBytes);
 const policy={...f.policy,sourceSha256:hash(sourceBytes),opportunityIds:['reported-one','unselected-opportunity']};
 const policyBytes=JSON.stringify(policy);writeFileSync(f.env.TAYCO_INSURER_REVIEW_POLICY,policyBytes);
 const invitation=createInsurerReviewInvitationPrivately(f.admin,'states@example.test','recipient-states-request-0001',hash(policyBytes));
 const accepted=await acceptInvitation(invitation.token!,'states@example.test',password);
 const request=new NextRequest('https://tayco.test/api/insurer-review',{headers:{cookie:'tayco_session='+encodeURIComponent(accepted.cookie)}});
 const actor=(await getActor(request))!;let data=insurerReviewData(actor);
 assert.equal(data.receivedDocumentCount,2);assert.equal(data.documentCount,3);assert.equal(data.linkedDocumentCount,1);
 assert.deepEqual(data.rows.flatMap(r=>r.documents).map(d=>({state:d.state,recipientAccess:d.recipientAccess})),[
  {state:'received',recipientAccess:'available'},{state:'received',recipientAccess:'not_selected'},{state:'pending',recipientAccess:'source_pending'}]);
 assert.deepEqual({...data.recipientCoverage,asOf:'server-time'},{asOf:'server-time',availableDocumentCount:1,notSelectedDocumentCount:1,unavailableDocumentCount:0,pendingSourceDocumentCount:1});
 for(const value of [{...f.approved,revokedAt:new Date().toISOString()},{...f.approved,bundleId:'different-delivery'}]){
  f.update('erp-one',value);data=insurerReviewData(actor);
  assert.equal(data.rows[0].documents[0].state,'received');assert.equal(data.rows[0].documents[0].recipientAccess,'authorization_unavailable');assert.equal(data.rows[0].documents[0].viewerHref,null);
  assert.equal(data.recipientCoverage!.unavailableDocumentCount,1);assert.equal(data.recipientCoverage!.notSelectedDocumentCount,1);assert.equal(data.receivedDocumentCount,2);
 }
 database().prepare('DELETE FROM records WHERE id=?').run('erp-one');data=insurerReviewData(actor);
 assert.equal(data.rows[0].documents[0].recipientAccess,'authorization_unavailable');assert.equal(data.rows[0].documents[1].recipientAccess,'not_selected');
 const serialized=JSON.stringify(data);for(const forbidden of ['erp-one','viewer-one',f.folder,'sourceSha256',f.pin,'registered'])assert.ok(!serialized.includes(forbidden),forbidden);
 assert.equal(readFileSync(f.env.TAYCO_PROFILE_A_REVIEW_SOURCE,'utf8'),sourceBytes);
}));


test('recipient consumer requires current relation digest, kind and media independently of the immutable policy',async t=>fixture(async f=>{
 const originalFetch=globalThis.fetch;let requests=0;
 globalThis.fetch=async()=>{requests++;throw new Error('Forbidden provider call');};
 try{
  assert.deepEqual(viewerScope(f.actor).documentIds,['viewer-one']);
  for(const field of ['relationsSha256','sourceKind','contentType'])for(const missing of [false,true]){
   await t.test(field+(missing?' missing':' changed'),async()=>{
    const changed:Record<string,unknown>={...f.approved};
    if(missing)delete changed[field];else changed[field]=field==='relationsSha256'?'f'.repeat(64):'wrong-value';
    f.update('erp-one',changed);
    assert.equal((await gatewayRoute(f.req('/api/takeoff-viewer/api/v1/assets/asset-one'))).status,403);
    assert.equal(requests,0);
   });
  }
  f.update('erp-one',f.approved);assert.deepEqual(viewerScope(f.actor).documentIds,['viewer-one']);
 }finally{globalThis.fetch=originalFetch;}
}));
