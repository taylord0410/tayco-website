import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import type {Actor} from '../lib/auth';
import {database,execute,snapshot,submitWebsite,registerDocument,documentForActor,validateInvitationAssignments} from '../lib/erp';
process.env.TAYCO_ERP_DB_PATH=path.join(mkdtempSync(path.join(os.tmpdir(),'tayco-erp-')),'test.sqlite');
process.env.TAYCO_AUTH_DB_PATH=process.env.TAYCO_ERP_DB_PATH+'.auth.sqlite';
const admin={id:'admin-test',email:'admin@example.test',role:'admin',tenantId:'tayco_llc',projectIds:[]} as Actor;
const run=(actor:Actor,body:Record<string,unknown>,key:string=randomUUID())=>execute(actor,key,body);
test('empty store never manufactures projects or payroll/financial metrics',()=>{
 const isolated={...admin,tenantId:'empty'};assert.deepEqual(snapshot(isolated).entries,[]);assert.equal(snapshot(isolated).integrations.takeoff,'not_configured');
});
const created=run(admin,{action:'create_project',name:'Synthetic project',location:'Test',budgetUsd:0,budgetSource:'Synthetic approval',budgetApprovedOn:new Date().toISOString().slice(0,10)});
const client={...admin,id:'client-a',role:'client',projectIds:[created.id]} as Actor;
const other={...client,id:'client-b',projectIds:[]} as Actor;
const tenantB={...admin,id:'other-tenant',tenantId:'tenant-b'};
test('project and tenant boundaries apply to reads and writes',()=>{
 assert.equal(snapshot(client).entries.filter(e=>e.kind==='project').length,1);assert.equal(snapshot(other).entries.length,0);assert.equal(snapshot(tenantB).entries.length,0);
 assert.throws(()=>run(other,{action:'add_note',projectId:created.id,title:'x',details:'x'}),/not found/);
 assert.throws(()=>run(tenantB,{action:'update_project',id:created.id,status:'active',progress:1,nextAction:'x',version:1}),/not found/);
 assert.throws(()=>run(client,{action:'create_project',name:'x'}),/team member/);
});
test('idempotency prevents duplicate commands and rejects changed intent',()=>{
 const key=randomUUID(),body={action:'add_note',projectId:created.id,title:'Progress',details:'Synthetic update'};
 const a=run(admin,body,key),b=run(admin,body,key);assert.equal(a.id,b.id);
 assert.throws(()=>run(admin,{...body,details:'different'},key),/different data/);
});
test('revision conflict rejects stale writes; zero values survive',()=>{
 assert.equal(created.data.budgetUsd,0);
 const a=run(admin,{action:'update_project',id:created.id,status:'active',progress:0,nextAction:'Inspect scope',version:1});assert.equal(a.version,2);assert.equal(a.data.progress,0);
 assert.throws(()=>run(admin,{action:'update_project',id:created.id,status:'closed',progress:100,nextAction:'x',version:1}),/changed/);
});
test('invalid input rolls back without consuming the request key',()=>{
 const key=randomUUID();assert.throws(()=>run(admin,{action:'log_hours',projectId:created.id,date:'2026-10-23',hours:-1,trade:'Test'},key),/hours/);
 const a=run(admin,{action:'log_hours',projectId:created.id,date:'2026-10-23',hours:1,trade:'Test'},key);assert.equal(a.data.status,'submitted');
 assert.equal(snapshot(client).entries.some(e=>e.kind==='hours'),false);
});
test('vendor only sees own hours/invoices and project budget is excluded',()=>{
 const v={...client,id:'vendor-test',role:'vendor'} as Actor;
 const invoice=run(v,{action:'record_invoice',projectId:created.id,reference:'TEST-1',amountUsd:0});
 assert.equal(invoice.data.status,'submitted');assert.equal(snapshot(client).entries.some(e=>e.id===invoice.id),false);
 assert.equal('budgetUsd' in snapshot(v).entries.find(e=>e.id===created.id)!.data,false);
 assert.throws(()=>run(v,{action:'update_invoice',id:invoice.id,version:1,status:'paid'}),/administrator/);
});
test('document receipt is not approval; paths hidden; download ownership enforced',()=>{
 const v={...client,id:'vendor-doc',role:'vendor'} as Actor;
 const d=registerDocument(v,{blobPath:'private-synthetic.pdf',name:'test.pdf',contentType:'application/pdf',type:'w9'});
 assert.equal(d.data.status,'pending_review');assert.equal(snapshot(v).entries.find(e=>e.id===d.id)?.data.blobPath,undefined);
 assert.throws(()=>documentForActor(other,d.id),/not found/);assert.equal(documentForActor(v,d.id).id,d.id);
 assert.throws(()=>run(v,{action:'review_document',id:d.id,status:'approved',version:1,response:'self approval'}),/team member/);
});
test('public submissions preserve values and enqueue one notification atomically',()=>{
 const key=randomUUID(),payload={fullName:"O'Connor",phone:'555-000-0000',email:'synthetic@example.test',projectDetails:'Synthetic only'};
 const a=submitWebsite('estimate',payload,key),b=submitWebsite('estimate',payload,key);assert.equal(a.id,b.id);assert.equal(a.data.phone,payload.phone);assert.equal(a.data.estimatedValueUsd,null);assert.equal(a.data.takeoffProjectSlug,null);
 assert.equal(database().prepare('SELECT count(*) AS n FROM outbox').get()!.n,1);
 assert.equal(snapshot(client).entries.some(e=>e.id===a.id),false);
});
test('change acceptance requires proposed version and assigned client',()=>{
 const a=run(client,{action:'request_change',projectId:created.id,title:'Change',details:'Review scope'});
 assert.throws(()=>run(client,{action:'decide_change',id:a.id,status:'accepted',version:1}),/Only a proposed/);
 const proposed=run(admin,{action:'review_change',id:a.id,status:'proposed',response:'Scope review ready',version:1});
 assert.throws(()=>run(other,{action:'decide_change',id:a.id,status:'accepted',version:2}),/not found/);
 assert.equal(run(client,{action:'decide_change',id:a.id,status:'accepted',version:proposed.version}).data.status,'accepted');
});
test('admin invitations cannot reference another tenant or nonexistent project',()=>{
 validateInvitationAssignments(admin,[created.id]);assert.throws(()=>validateInvitationAssignments(tenantB,[created.id]),/not found/);
 assert.throws(()=>validateInvitationAssignments(admin,['nonexistent']),/not found/);assert.throws(()=>validateInvitationAssignments(client,[created.id]),/administrator/);
});
