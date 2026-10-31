const runtimeEnv: Record<string,string|undefined> = process.env;
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { trustedClientIp, normalizedClientIp } from '../lib/client-network';
import { requiredSecret, SUBMISSION_SECRET_NAMES, SECURITY_LOG_SECRET_NAMES, SecurityConfigurationError } from '../lib/required-secret';
import { encryptSecurityField, decryptSecurityField, extractRequestNetworkMetadata, recordGuestSecurityByContext, guestSecurityReport } from '../lib/guest-security-log';
import { evaluateSiteShield, isLocalhostIp, resetShieldStateForTests } from '../lib/site-shield';
import { GET as visualStream } from '../app/api/visual-stream/route';
import { GET as readiness } from '../app/api/health/route';
import { database, listWebsiteSubmissions, submitWebsite } from '../lib/erp';
import type { Actor } from '../lib/auth';

const human = 'Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36';
test('SG B1: trusted ingress, mandatory secrets and compatibility', async t => {
  const folder = mkdtempSync(path.join(tmpdir(), 'tayco-security-foundation-'));
  const secretNames = [...new Set([...SUBMISSION_SECRET_NAMES, ...SECURITY_LOG_SECRET_NAMES])];
  const names = [...secretNames, 'NODE_ENV', 'TAYCO_TRUSTED_INGRESS', 'RAILWAY_ENVIRONMENT', 'TAYCO_AUTH_DB_PATH', 'TAYCO_ERP_DB_PATH', 'TAYCO_APP_URL'];
  const old = Object.fromEntries(names.map(n => [n, runtimeEnv[n]]));
  const clearSecrets = () => { for (const name of secretNames) delete runtimeEnv[name]; };
  const configured = () => { clearSecrets(); const secret = randomBytes(48).toString('hex'); runtimeEnv.TAYCO_SESSION_SECRET = secret; return secret; };
  runtimeEnv.TAYCO_AUTH_DB_PATH = path.join(folder, 'auth.sqlite');
  runtimeEnv.TAYCO_ERP_DB_PATH = path.join(folder, 'erp.sqlite');
  runtimeEnv.TAYCO_APP_URL = 'https://tayco.test';
  const admin: Actor = {id:'fixture-admin',email:'admin@example.test',role:'admin',tenantId:'tayco_llc',projectIds:[]};
  const shield = (ip:string, pathname='/', ua=human, host='tayco.test') => evaluateSiteShield({
    method:'GET',pathname,clientIp:ip,userAgent:ua,host,referer:null,secFetchDest:'document',secFetchMode:'navigate',secFetchSite:'none',accept:'text/html',
  });
  try {
    await t.test('forwarding headers and platform labels confer no trust by default', () => {
      delete runtimeEnv.TAYCO_TRUSTED_INGRESS;
      runtimeEnv.RAILWAY_ENVIRONMENT='fixture-not-attestation';
      const headers = new Headers({'x-forwarded-for':'127.0.0.1, 198.51.100.10','x-real-ip':'203.0.113.10','cf-connecting-ip':'127.0.0.1','x-railway-edge':'fixture'});
      assert.equal(trustedClientIp(headers),'unknown');
      assert.equal(extractRequestNetworkMetadata(headers).clientIp,'unknown');
      assert.equal(trustedClientIp(null),'unknown');
      runtimeEnv.TAYCO_TRUSTED_INGRESS='unsupported';
      assert.equal(trustedClientIp(headers),'unknown');
    });
    await t.test('explicit public-edge mode accepts one valid X-Real-IP, never XFF positions or fallback headers', () => {
      runtimeEnv.TAYCO_TRUSTED_INGRESS='railway-public-edge';
      assert.equal(trustedClientIp({'X-Real-IP':'203.0.113.10','x-forwarded-for':'127.0.0.1, 10.0.0.2'}),'203.0.113.10');
      assert.equal(trustedClientIp({'x-forwarded-for':'203.0.113.10','cf-connecting-ip':'203.0.113.10'}),'unknown');
      for (const value of ['', 'not-an-ip','203.0.113.10, 127.0.0.1','127.0.0.1:443','x'.repeat(4096)]) assert.equal(trustedClientIp({'x-real-ip':value}),'unknown');
      assert.equal(normalizedClientIp('::ffff:203.0.113.10'),'203.0.113.10');
      assert.equal(normalizedClientIp('2001:DB8::A'),'2001:db8::a');
      assert.equal(extractRequestNetworkMetadata({'x-real-ip':'203.0.113.10'}).clientIp,'203.0.113.10');
    });
    await t.test('production never exempts Host or loopback; unknown clients cannot share an IP penalty', async () => {
      runtimeEnv.NODE_ENV='production';
      resetShieldStateForTests();
      assert.equal(isLocalhostIp('127.0.0.1','localhost:3102'),false);
      assert.equal(isLocalhostIp('198.51.100.10','localhost'),false);
      assert.equal(shield('127.0.0.1','/','curl/8.5.0','localhost').action,'block');
      assert.equal(shield('unknown','/.env').action,'block');
      assert.equal(shield('unknown').action,'allow');
      assert.equal(shield('unknown','/','curl/8.5.0','localhost').action,'block');
      const response = await visualStream(new NextRequest('https://tayco.test/api/visual-stream?p=/logo.png',{headers:{host:'localhost','user-agent':'curl/8.5.0','x-forwarded-for':'127.0.0.1','x-real-ip':'127.0.0.1','x-tayco-stream':'v39'}}));
      assert.equal(response.status,403);
      runtimeEnv.NODE_ENV='development';
      assert.equal(isLocalhostIp('unknown','localhost'),false);
      assert.equal(isLocalhostIp('127.0.0.1','tayco.test'),false);
      assert.equal(isLocalhostIp('127.0.0.1','127.0.0.1:3102'),true);
    });
    await t.test('missing, short or blank explicit secrets reject without disclosing configuration', () => {
      clearSecrets();
      assert.throws(()=>requiredSecret(SUBMISSION_SECRET_NAMES),SecurityConfigurationError);
      assert.throws(()=>encryptSecurityField('fixture-data'),SecurityConfigurationError);
      assert.throws(()=>decryptSecurityField('legacy plaintext'),SecurityConfigurationError);
      runtimeEnv.TAYCO_SESSION_SECRET=randomBytes(48).toString('hex');
      for (const value of ['', 'short', ' '.repeat(40)]) {
        runtimeEnv.TAYCO_DATA_ENCRYPTION_KEY=value;
        assert.throws(()=>requiredSecret(SUBMISSION_SECRET_NAMES),e=>e instanceof SecurityConfigurationError&&e.status===503&&!e.message.includes(value||'TAYCO_'));
      }
      delete runtimeEnv.TAYCO_DATA_ENCRYPTION_KEY;
      assert.equal(requiredSecret(SUBMISSION_SECRET_NAMES),runtimeEnv.TAYCO_SESSION_SECRET);
    });
    await t.test('valid guest log keys preserve the old cipher format and key derivation', () => {
      const secret=configured(),key=createHash('sha256').update('tayco-guest-security-log-v1:'+secret).digest();
      const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
      const bytes=Buffer.concat([cipher.update('old-format fixture','utf8'),cipher.final()]);
      const stored='enc:v1:'+iv.toString('base64')+':'+cipher.getAuthTag().toString('base64')+':'+bytes.toString('base64');
      assert.equal(decryptSecurityField(stored),'old-format fixture');
      const current=encryptSecurityField('current fixture'),parts=current.slice('enc:v1:'.length).split(':');
      const reader=createDecipheriv('aes-256-gcm',key,Buffer.from(parts[0],'base64'));reader.setAuthTag(Buffer.from(parts[1],'base64'));
      assert.equal(Buffer.concat([reader.update(Buffer.from(parts[2],'base64')),reader.final()]).toString('utf8'),'current fixture');
      clearSecrets(); assert.throws(()=>decryptSecurityField(stored),SecurityConfigurationError);
    });
    await t.test('unknown IP is not an identified address and missing keys never masquerade as zero events', () => {
      configured();delete runtimeEnv.TAYCO_TRUSTED_INGRESS;
      const context={tenantId:'tayco_llc',reviewId:'fixture-review',actorId:'fixture-guest',actorRole:'guest' as const};
      recordGuestSecurityByContext(context,{'x-forwarded-for':'203.0.113.99'},{eventType:'portal.open',surface:'portal'});
      runtimeEnv.TAYCO_TRUSTED_INGRESS='railway-public-edge';
      recordGuestSecurityByContext(context,{'x-real-ip':'198.51.100.22'},{eventType:'portal.open',surface:'portal'});
      const report=guestSecurityReport(admin);
      assert.equal(report.totalEvents,2);
      assert.equal(report.actors[0].distinctIpCount,1);
      assert.deepEqual(report.actors[0].distinctIps,['198.51.100.22']);
      clearSecrets();
      assert.throws(()=>guestSecurityReport(admin),SecurityConfigurationError);
      assert.throws(()=>recordGuestSecurityByContext(context,null,{eventType:'portal.open',surface:'portal'}),SecurityConfigurationError);
    });
    await t.test('website intake fails before side effects without keys and preserves existing configured ciphertext', () => {
      clearSecrets();
      const payload={fullName:'Security fixture',email:'security@example.test',phone:'555-0100'},intent=randomUUID();
      assert.throws(()=>submitWebsite('estimate',payload,intent),SecurityConfigurationError);
      assert.equal((database().prepare('SELECT count(*) AS n FROM website_submissions').get() as {n:number}).n,0);
      assert.equal((database().prepare('SELECT count(*) AS n FROM outbox').get() as {n:number}).n,0);
      const secret=configured(),receipt=submitWebsite('estimate',payload,intent);
      const key=createHash('sha256').update(secret).digest(),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
      const bytes=Buffer.concat([cipher.update(JSON.stringify(payload),'utf8'),cipher.final()]);
      const legacy=iv.toString('hex')+':'+cipher.getAuthTag().toString('hex')+':'+bytes.toString('hex');
      database().prepare('UPDATE website_submissions SET payload_encrypted=? WHERE id=?').run(legacy,receipt.id);
      assert.deepEqual(listWebsiteSubmissions(admin)[0].payload,payload);
      assert.throws(()=>listWebsiteSubmissions({...admin,role:'client'}),/administrator/);
      clearSecrets();
      assert.throws(()=>listWebsiteSubmissions(admin),SecurityConfigurationError);
      assert.throws(()=>submitWebsite('estimate',payload,intent),SecurityConfigurationError);
      assert.equal((database().prepare('SELECT count(*) AS n FROM website_submissions').get() as {n:number}).n,1);
    });
    await t.test('readiness rejects invalid dedicated keys with a generic response', async () => {
      configured();
      assert.equal(readiness().status,200);
      runtimeEnv.NODE_ENV='production';delete runtimeEnv.TAYCO_TRUSTED_INGRESS;
      assert.equal(readiness().status,503,'Production readiness requires an explicit ingress contract.');
      runtimeEnv.TAYCO_TRUSTED_INGRESS='railway-public-edge';
      assert.equal(readiness().status,200);
      runtimeEnv.NODE_ENV='development';
      runtimeEnv.TAYCO_SUBMISSIONS_KEY='short';
      const result=readiness();
      assert.equal(result.status,503);
      assert.deepEqual(await result.json(),{status:'unavailable'});
      assert.match(result.headers.get('cache-control')!,/no-store/);
      delete runtimeEnv.TAYCO_SUBMISSIONS_KEY;
      runtimeEnv.TAYCO_DATA_ENCRYPTION_KEY='short';
      assert.equal(readiness().status,503);
    });
  } finally {
    try { database().close(); } catch {}
    resetShieldStateForTests();
    for (const name of names) { if(old[name]===undefined)delete runtimeEnv[name];else runtimeEnv[name]=old[name]; }
    if(path.dirname(path.resolve(folder))!==path.resolve(tmpdir()))throw new Error('Unexpected fixture cleanup target.');
    rmSync(folder,{recursive:true,force:true});
  }
});
