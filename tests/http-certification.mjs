import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
const file=process.env.TAYCO_CERT_CONFIG;
if(!file||!path.resolve(file).includes(path.sep+'certification-'))throw new Error('Use isolated private certification fixtures only.');
const config=JSON.parse(readFileSync(file,'utf8')),base=config.baseUrl;
if(!['localhost','127.0.0.1'].includes(new URL(base).hostname))throw new Error('Local fixture server required.');
const results=[];
async function call(endpoint,{role,body,origin=base,key=randomUUID(),cookie}={}){
 const headers={};if(role)headers.Cookie='tayco_session='+encodeURIComponent(config.accounts[role].cookie);if(cookie)headers.Cookie=cookie;
 if(body!==undefined){headers['Content-Type']='application/json';headers.Origin=origin;headers['Idempotency-Key']=key;}
 const response=await fetch(base+endpoint,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),redirect:'manual'});
 const data=await response.json().catch(()=>({}));return {status:response.status,data,headers:response.headers};
}
async function check(name,fn){await fn();results.push({name,passed:true});}
await check('unauthenticated and legacy invitation queries deny access',async()=>{
 for(const q of ['', '?invite=INV-TAYCO-MASTER','?invite=invalid'])assert.equal((await call('/api/erp-suite'+q)).status,401);
 assert.equal((await call('/api/erp-suite',{cookie:'tayco_session=invalid'})).status,401);
});
await check('server rejects query-string tenant identity and cross-site writes',async()=>{
 assert.equal((await call('/api/erp-suite?tenant=other',{role:'admin'})).status,400);
 assert.equal((await call('/api/erp-suite',{role:'admin',body:{action:'create_project',name:'Never created'},origin:'https://foreign.example'})).status,403);
});
await check('client payload contains assigned projects only and no global payroll or invite tables',async()=>{
 const {status,data,headers}=await call('/api/erp-suite',{role:'client'});assert.equal(status,200);assert.match(headers.get('cache-control'),/no-store/);
 assert.equal(data.entries.filter(e=>e.kind==='project').length,1);assert.equal(data.entries.find(e=>e.kind==='project').id,config.projects[0]);
 assert.equal('invitations'in data,false);assert.equal('payroll'in data,false);assert.equal('quickbooks'in data,false);
});
await check('client mutations cannot create projects or modify another project',async()=>{
 assert.equal((await call('/api/erp-suite',{role:'client',body:{action:'create_project',name:'Forbidden'}})).status,403);
 assert.equal((await call('/api/erp-suite',{role:'other',body:{action:'add_note',projectId:config.projects[0],title:'Forbidden',details:'Forbidden'}})).status,404);
});
let created;
await check('actual HTTP duplicate request returns one committed project and changed intent conflicts',async()=>{
 const key=randomUUID(),body={action:'create_project',name:'HTTP synthetic project '+randomUUID(),budgetUsd:0};
 const a=await call('/api/erp-suite',{role:'admin',body,key}),b=await call('/api/erp-suite',{role:'admin',body,key});
 assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.data.result.id,b.data.result.id);assert.equal(a.data.result.data.budgetUsd,0);created=a.data.result;
 const changed=await call('/api/erp-suite',{role:'admin',body:{...body,name:'Different'},key});assert.equal(changed.status,409);
 const list=await call('/api/erp-suite',{role:'admin'});assert.equal(list.data.entries.filter(e=>e.kind==='project'&&e.data.name===body.name).length,1);
});
await check('stale edits conflict rather than overwrite latest version',async()=>{
 const body={action:'update_project',id:created.id,version:created.version,status:'active',progress:0,nextAction:'Inspect'};
 assert.equal((await call('/api/erp-suite',{role:'admin',body})).status,200);
 assert.equal((await call('/api/erp-suite',{role:'admin',body:{...body,status:'closed',progress:100}})).status,409);
});
await check('vendor cannot see client changes, team-only notes or project budgets',async()=>{
 const p=config.projects[0];await call('/api/erp-suite',{role:'admin',body:{action:'add_note',projectId:p,title:'Private test note',details:'Synthetic private',visibility:'internal'}});
 await call('/api/erp-suite',{role:'client',body:{action:'request_change',projectId:p,title:'Client test change',details:'Synthetic client request'}});
 const {data}=await call('/api/erp-suite',{role:'vendor'});assert.equal(data.entries.some(e=>e.kind==='change'),false);assert.equal(data.entries.some(e=>e.data.title==='Private test note'),false);assert.equal('budgetUsd'in data.entries.find(e=>e.kind==='project').data,false);
});
await check('public receipt is durable and idempotent; forged approval fields are rejected',async()=>{
 const body={fullName:'Synthetic HTTP',phone:'555-0100',email:'synthetic-http@example.test',projectType:'Residential',projectDetails:'Synthetic fixture only'};const key=randomUUID();
 const a=await call('/api/estimate',{body,key}),b=await call('/api/estimate',{body,key});assert.equal(a.status,201);assert.equal(b.status,201);assert.equal(a.data.referenceId,b.data.referenceId);assert.equal(a.data.notificationStatus,'pending');
 assert.equal((await call('/api/estimate',{body:{...body,w9Status:'VERIFIED'}})).status,422);
 assert.equal((await call('/api/estimate',{body:{...body,website:'bot'}})).status,422);
 const team=await call('/api/erp-suite',{role:'admin'});assert.ok(team.data.entries.some(e=>e.id===a.data.referenceId));
});
await check('document reads and unconfigured uploads fail closed without external services',async()=>{
 assert.equal((await call('/api/documents/nonexistent')).status,401);
 assert.equal((await call('/api/documents/nonexistent',{role:'client'})).status,404);
 assert.equal((await call('/api/upload-doc',{role:'vendor',body:{}})).status,503);
 assert.equal((await call('/api/notifications',{role:'admin',body:{}})).status,503);
});
const report={baseUrl:base,passed:results.length,results,scope:'real local production server; isolated synthetic databases; external email/blob disabled; no real client data'};
writeFileSync(path.join(path.dirname(file),'http-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
