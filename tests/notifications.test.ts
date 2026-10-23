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
 const ok=(async(_u:unknown,init:RequestInit)=>{keys.push((init.headers as Record<string,string>)['Idempotency-Key']);return new Response('{}',{status:200});}) as typeof fetch;
 assert.equal((await processNotifications(actor,ok)).delivered,1);assert.equal(keys[0],keys[1]);assert.equal((await processNotifications(actor,ok)).processed,0);
 await assert.rejects(processNotifications({...actor,role:'client'},ok),/administrator/);
});
