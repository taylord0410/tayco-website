import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {ensureVisitor,flagVisitor,guardStatus,countGuardRetry,issueDebugGrant,exchangeDebugGrant,revokeDebugGrant,guardCookie,guardCookieName,labEnabled,guardMode} from '../lib/automation-guard';
import {inspectAutomationRequest} from '../lib/automation-guard-http';
import {GET,POST} from '../app/api/automation-guard/route';
import { requireActor } from '../lib/auth';

test('automation guard: persisted counters, bounded exceptions and HTTP boundaries',async t=>{
  const folder=mkdtempSync(path.join(tmpdir(),'tayco-guard-'));
  const keys=['TAYCO_GUARD_DB_PATH','TAYCO_AUTOMATION_GUARD','TAYCO_SECURITY_LAB','NODE_ENV','TAYCO_APP_URL'] as const;
  const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  process.env.TAYCO_GUARD_DB_PATH=path.join(folder,'guard.sqlite');
  process.env.TAYCO_AUTOMATION_GUARD='enforce';
  process.env.TAYCO_SECURITY_LAB='1';
  process.env.NODE_ENV='development';
  process.env.TAYCO_APP_URL='http://127.0.0.1:3102';
  const origin='http://127.0.0.1:3102';
  const cookie=(visitor:string,debug?:string)=>guardCookieName('visitor')+'='+visitor+(debug?'; '+guardCookieName('debug')+'='+debug:'');
  const document=(visitor:string,debug?:string,extra:Record<string,string>={})=>new Request(origin+'/security-lab',{headers:{accept:'text/html','sec-fetch-dest':'document',cookie:cookie(visitor,debug),...extra}});
  const post=(body:unknown,visitor?:string,opts:{origin?:string;url?:string}={})=>new Request((opts.url||origin)+'/api/automation-guard',{method:'POST',headers:{'content-type':'application/json',origin:opts.origin||origin,...(visitor?{cookie:cookie(visitor)}:{})},body:JSON.stringify(body)});
  try{
    await t.test('ordinary refreshes, assets, APIs and prefetch do not count as suspicious retries',()=>{
      const v=ensureVisitor().token;
      for(let i=0;i<8;i++)assert.equal(inspectAutomationRequest(document(v)).response,undefined);
      assert.equal(guardStatus(v,undefined,origin).state,'clear');
      flagVisitor(v,'lab_simulation');
      for(const url of ['/favicon.ico','/_next/static/test.js','/api/health'])inspectAutomationRequest(new Request(origin+url,{headers:{cookie:cookie(v)}}));
      inspectAutomationRequest(document(v,undefined,{'next-router-prefetch':'1'}));
      inspectAutomationRequest(document(v,undefined,{rsc:'1'}));
      const denied=inspectAutomationRequest(new Request(origin+'/api/estimate',{method:'POST',headers:{cookie:cookie(v)}})).response;
      assert.equal(denied?.status,403);
      assert.equal(guardStatus(v,undefined,origin).retries,0);
      assert.equal(inspectAutomationRequest(new Request(origin+'/estimate',{headers:{accept:'*/*',cookie:cookie(v)}})).response,undefined);
      assert.equal(inspectAutomationRequest(document(v,undefined,{rsc:'1'})).response?.status,403);
      assert.equal(guardStatus(v,undefined,origin).retries,0);
    });
    await t.test('notice, three retries, fourth rejected; state survives new DB connections and expires',()=>{
      const now=Date.now(),v=ensureVisitor(undefined,now).token;
      flagVisitor(v,'lab_simulation',now);
      assert.equal(guardStatus(v,undefined,origin,false,now).retries,0);
      for(let i=1;i<=3;i++){
        const result=inspectAutomationRequest(document(v));
        assert.equal(result.response?.status,403);
        assert.equal(guardStatus(v,undefined,origin).retries,i);
      }
      const result=inspectAutomationRequest(document(v));
      assert.equal(result.response?.status,429);
      assert.ok(Number(result.response?.headers.get('retry-after'))>0);
      const db=new DatabaseSync(process.env.TAYCO_GUARD_DB_PATH!);
      try{assert.equal((db.prepare('SELECT retries FROM guard_visitors WHERE retries=4').get() as {retries:number}).retries,4);}finally{db.close();}
      const state=guardStatus(v,undefined,origin);
      assert.equal(state.state,'blocked');
      assert.equal(guardStatus(v,undefined,origin,false,state.blockedUntil+1).state,'clear');
    });
    await t.test('single-use debug authorization is browser/origin bound, expires and can be revoked',()=>{
      const now=Date.now(),v=ensureVisitor(undefined,now).token,other=ensureVisitor(undefined,now).token;
      flagVisitor(v,'lab_simulation',now);
      for(let i=0;i<4;i++)countGuardRetry(v,undefined,origin,now+1);
      const grant=issueDebugGrant(v,origin,'fixture-admin','Responsive audit',now+2);
      assert.throws(()=>exchangeDebugGrant(grant.token,other,origin,now+3));
      assert.throws(()=>exchangeDebugGrant(grant.token,v,'https://other.test',now+3));
      const auth=exchangeDebugGrant(grant.token,v,origin,now+3);
      assert.throws(()=>exchangeDebugGrant(grant.token,v,origin,now+4));
      assert.equal(guardStatus(v,auth.session,origin,false,now+4).state,'authorized');
      assert.equal(inspectAutomationRequest(document(v,auth.session)).response,undefined);
      revokeDebugGrant(grant.id,now+5);
      assert.equal(guardStatus(v,auth.session,origin,false,now+6).state,'blocked');
      const expired=issueDebugGrant(v,origin,'fixture-admin','Expiry audit',now+10);
      assert.throws(()=>exchangeDebugGrant(expired.token,v,origin,expired.expiresAt+1));
      const sessionGrant=issueDebugGrant(v,origin,'fixture-admin','Session expiry',now+10);
      const session=exchangeDebugGrant(sessionGrant.token,v,origin,now+11);
      assert.notEqual(guardStatus(v,session.session,origin,false,session.expiresAt+1).state,'authorized');
      const bytes=readFileSync(process.env.TAYCO_GUARD_DB_PATH!);
      assert.equal(bytes.includes(Buffer.from(grant.token)),false);
      assert.equal(bytes.includes(Buffer.from(auth.session)),false);
    });
    await t.test('bootstrap is private/no-store, mutation is same-origin and grant issuance requires admin',async()=>{
      const bootstrap=await POST(post({op:'bootstrap',automation:false}));
      assert.equal(bootstrap.status,200);
      assert.match(bootstrap.headers.get('set-cookie')!,/HttpOnly.*SameSite=Strict/);
      assert.match(bootstrap.headers.get('cache-control')!,/no-store/);
      const v=ensureVisitor().token;
      assert.equal((await POST(post({op:'simulate'},v,{origin:'https://attacker.test'}))).status,403);
      assert.equal((await POST(post({op:'issue',purpose:'Audit'},v))).status,401);
      assert.equal((await POST(post({op:'simulate'},v))).status,200);
      const state=await (await GET(new Request(origin+'/api/automation-guard',{headers:{cookie:cookie(v)}}))).json();
      assert.equal(state.state,'challenge');
      assert.equal((await POST(post({op:'exchange',token:'invalid'},v))).status,403);
    });
    await t.test('a guard authorization never authenticates a private account',async()=>{
      const v=ensureVisitor().token;
      const grant=issueDebugGrant(v,origin,'fixture-admin','Private access negative control');
      const session=exchangeDebugGrant(grant.token,v,origin);
      await assert.rejects(()=>requireActor(new Request(origin+'/api/auth/session',{headers:{cookie:cookie(v,session.session)}})),e=>e instanceof Error&&'status' in e&&e.status===401);
    });
    await t.test('production forbids lab actions even when flag is set; production cookies are Secure',async()=>{
      process.env.NODE_ENV='production';
      process.env.TAYCO_APP_URL='https://127.0.0.1:3102';
      assert.equal(labEnabled(origin),false);
      assert.match(guardCookie('debug','fixture'),/^__Host-.*; Secure$/);
      const response=await POST(post({op:'authorize-test'},undefined,{url:'https://127.0.0.1:3102',origin:'https://127.0.0.1:3102'}));
      assert.equal(response.status,404);
      process.env.NODE_ENV='development';
      process.env.TAYCO_APP_URL=origin;
      assert.equal(labEnabled('http://remote.test'),false);
    });
    await t.test('observe records without blocking and feature is off unless explicitly enabled',async()=>{
      process.env.TAYCO_AUTOMATION_GUARD='observe';
      const v=ensureVisitor().token;flagVisitor(v,'lab_simulation');
      for(let i=0;i<5;i++)assert.equal(inspectAutomationRequest(document(v)).response,undefined);
      assert.equal(guardStatus(v,undefined,origin).state,'blocked');
      delete process.env.TAYCO_AUTOMATION_GUARD;
      assert.equal(guardMode(),'off');
      assert.equal(inspectAutomationRequest(document(v)).response,undefined);
      assert.equal((await POST(post({op:'authorize-test'},v))).status,404);
      assert.equal((await (await GET(new Request(origin+'/api/automation-guard'))).json()).mode,'off');
    });
  }finally{
    for(const key of keys){if(old[key]===undefined)delete process.env[key];else process.env[key]=old[key];}
    rmSync(folder,{recursive:true,force:true});
  }
});
