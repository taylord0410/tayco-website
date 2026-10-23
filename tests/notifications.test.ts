import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';import os from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';
import type {Actor} from '../lib/auth';
import {database,submitWebsite} from '../lib/erp';import {processNotifications} from '../lib/notifications';
process.env.TAYCO_ERP_DB_PATH=path.join(mkdtempSync(path.join(os.tmpdir(),'tayco-mail-')),'test.sqlite');
const actor={id:'test-admin',email:'test@example.test',role:'admin',tenantId:'tayco_llc',projectIds:[]} as Actor;
test('unconfigured transport never loses a saved request',async()=>{
 submitWebsite('estimate',{fullName:'Synthetic',email:'test@example.test'},randomUUID());
 delete process.env.RESEND_API_KEY;await assert.rejects(processNotifications(actor),/not configured/);
 assert.equal(database().prepare('SELECT status FROM outbox').get()!.status,'pending');
});
test('failed delivery is retained, retry uses stable provider key and confirms once',async()=>{
 process.env.RESEND_API_KEY='synthetic-not-a-secret';process.env.TAYCO_NOTIFY_EMAIL='example@example.test';process.env.TAYCO_EMAIL_FROM='example@example.test';
 const keys:string[]=[];const fail=(async(_u:unknown,init:RequestInit)=>{keys.push((init.headers as Record<string,string>)['Idempotency-Key']);return new Response('',{status:503});}) as typeof fetch;
 const a=await processNotifications(actor,fail);assert.equal(a.failed,1);assert.equal(database().prepare('SELECT status FROM outbox').get()!.status,'pending');
 database().prepare("UPDATE outbox SET next_attempt_at='2000-01-01'").run();
 const ok=(async(_u:unknown,init:RequestInit)=>{keys.push((init.headers as Record<string,string>)['Idempotency-Key']);return Response.json({id:'fixture-accepted'});}) as typeof fetch;
 assert.equal((await processNotifications(actor,ok)).delivered,1);assert.equal(keys[0],keys[1]);assert.equal((await processNotifications(actor,ok)).processed,0);
 await assert.rejects(processNotifications({...actor,role:'client'},ok),/administrator/);
});

test('renewal uses current document only and never attaches private object information',async()=>{
 const db=database();db.prepare("DELETE FROM outbox").run();
 const id=randomUUID(),at=new Date().toISOString();
 db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(id,'document',actor.tenantId,'','owner',JSON.stringify({name:'private.pdf',status:'approved',blobPath:'private/secret',expiresAt:'2026-11-01'}),at,at);
 const enqueue=(key:string,expiry:string)=>db.prepare('INSERT INTO outbox(id,tenant_id,kind,payload,next_attempt_at,created_at) VALUES(?,?,?,?,?,?)').run(key,actor.tenantId,'document_expiry',JSON.stringify({referenceId:id,expiresAt:expiry}),at,at);
 enqueue('old-notice','2026-10-01');enqueue('current-notice','2026-11-01');
 const bodies:string[]=[];
 const transport=(async(_u:unknown,init:RequestInit)=>{bodies.push(String(init.body));return Response.json({id:'fixture-renewal'});}) as typeof fetch;
 assert.equal((await processNotifications(actor,transport)).delivered,1);
 assert.equal(db.prepare("SELECT status FROM outbox WHERE id='old-notice'").get()!.status,'superseded');
 assert.equal(bodies.length,1);assert.match(bodies[0],/renewal/);assert.doesNotMatch(bodies[0],/private.pdf|private\/secret|attachments/);
 await assert.rejects(processNotifications({...actor,tenantId:'other'},transport),/destination/);
});

test('HTTP success without a provider receipt remains uncertain and retryable',async()=>{
 const db=database();db.prepare('DELETE FROM outbox').run();
 submitWebsite('estimate',{fullName:'Synthetic missing receipt',email:'test@example.test'},randomUUID());
 const result=await processNotifications(actor,(async()=>Response.json({})) as typeof fetch);
 assert.equal(result.delivered,0);assert.equal(result.failed,1);
 const row=db.prepare('SELECT id,status FROM outbox').get()!;
 assert.equal(row.status,'pending');assert.equal(db.prepare('SELECT job_id FROM notification_receipts WHERE job_id=?').get(String(row.id)),undefined);
});

test('graceful stop finishes one accepted attempt and leaves the next event available',async()=>{
 const db=database();db.prepare('DELETE FROM outbox').run();
 submitWebsite('estimate',{fullName:'Stop first',email:'a@example.test'},randomUUID());
 submitWebsite('estimate',{fullName:'Stop second',email:'b@example.test'},randomUUID());
 let calls=0;
 const transport=(async()=>{calls++;return Response.json({id:'fixture-stop-'+calls});}) as typeof fetch;
 assert.equal((await processNotifications(actor,transport,{shouldStop:()=>calls>0})).delivered,1);
 assert.equal(calls,1);assert.equal(db.prepare("SELECT COUNT(*) AS n FROM outbox WHERE status='pending'").get()!.n,1);
 assert.equal((await processNotifications(actor,transport)).delivered,1);assert.equal(calls,2);
 assert.equal((await processNotifications(actor,transport)).processed,0);
});
