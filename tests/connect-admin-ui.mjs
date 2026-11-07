import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.TAYCO_PLAYWRIGHT_MODULE||'playwright');
const base=process.env.BASE_URL||'http://127.0.0.1:5392';
assert.match(base,/^http:\/\/127\.0\.0\.1:5392$/);
const out=process.env.TAYCO_EVIDENCE_DIR;
assert.ok(out);
const browser=await chromium.launch({headless:true});
const results=[],errors=[];
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept());
  let signed=false,accounts=[{email:'member@example.test',username:'fixturemember',role:'member',active:true,version:0}],invitations=[];
  await page.route('**/api/auth/session',r=>r.fulfill({json:{actor:{role:'admin'}}}));
  await page.route('**/api/admin/connect',async r=>{
   const body=r.request().method()==='POST'?r.request().postDataJSON():null;
   if(body?.action==='login'){signed=true;return r.fulfill({json:{ok:true}});}
   if(!signed)return r.fulfill({status:401,json:{error:'Sign in with your Connect administrator account.'}});
   if(body?.action==='invite'){invitations=[{email:body.email,username:body.username,role:body.role,expiresAt:Date.now()+172800000,version:'a'.repeat(64)}];return r.fulfill({status:201,json:{origin:'https://connect.example.test',token:'x'.repeat(43)}});}
   if(body?.action==='update'){accounts=[{...accounts[0],active:body.active,role:body.role,version:1}];return r.fulfill({json:{ok:true}});}
   if(body?.action==='cancel'){invitations=[];return r.fulfill({json:{ok:true}});}
   if(body?.action==='logout'){signed=false;return r.fulfill({json:{ok:true}});}
   return r.fulfill({json:{accounts,invitations,origin:'https://connect.example.test'}});
  });
  await page.goto(base+'/admin/connect',{waitUntil:'networkidle'});
  await page.getByLabel('Connect email').fill('admin@example.test');
  await page.getByLabel('Password',{exact:true}).fill('Synthetic account password');
  await page.getByLabel('Authenticator code').fill('123456');
  await page.getByRole('button',{name:'Open Connect administration',exact:true}).click();
  await page.getByRole('heading',{name:'Invite a team member'}).waitFor();
  const form=page.locator('form').first();
  await form.getByLabel('Email',{exact:true}).fill('new@example.test');
  await form.getByLabel('Username',{exact:true}).fill('newfixture');
  await form.getByRole('button',{name:'Create invitation'}).click();
  await page.getByLabel('Private activation link').waitFor();
  assert.match(await page.getByLabel('Private activation link').inputValue(),/#invite=/);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const account=page.locator('form').filter({hasText:'fixturemember'});
  await account.getByLabel('Enable access').uncheck();
  await account.getByRole('button',{name:'Save access'}).click();
  await page.getByText('Suspended',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Cancel invitation',exact:true}).click();
  await page.getByText('No pending activations.').waitFor();
  assert.ok(await page.locator('.tayco-skip-link').evaluate(el=>el.getBoundingClientRect().bottom<0));
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.screenshot({path:out+'/'+width+'.png',fullPage:true});
  await page.getByRole('button',{name:'Lock Connect administration'}).click();
  await page.getByLabel('Connect email').waitFor();
  results.push({width,login:true,invitation:true,suspension:true,cancellation:true,logout:true,noOverflow:true});
  await context.close();
 }
 assert.equal(errors.length,0);
}finally{await browser.close();await writeFile(out+'/ui.json',JSON.stringify({results,errors,scope:'UI against synthetic browser route fixtures; backend exercised by separate identity/proxy tests'},null,2));}
console.log(JSON.stringify({results,errors}));
