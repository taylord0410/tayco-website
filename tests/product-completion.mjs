/**
 * Isolated synthetic completion checks; no cloud uploads or physical deletion.
 * Native zoom uses automatic per-tab browser zoom, not viewport/pinch emulation.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
import {randomUUID,createHash} from "node:crypto";
import {DatabaseSync} from "node:sqlite";
const {chromium}=createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE||"playwright");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
if(!process.env.TAYCO_TEST_CONFIG)throw Error("A disposable private fixture config is required.");
const configFile=path.resolve(process.env.TAYCO_TEST_CONFIG),config=JSON.parse(fs.readFileSync(configFile,"utf8")),base=config.baseUrl;
assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1):(?:3008|3010)$/);
assert.ok(["certification-completion-","certification-modules-"].some(prefix=>path.dirname(configFile).startsWith(path.join(root,".data",prefix))));
for(const database of [config.authDb,config.erpDb]){const rel=path.relative(path.dirname(configFile),path.resolve(database));assert.ok(rel&&!rel.startsWith("..")&&!path.isAbsolute(rel));}
for(const a of Object.values(config.accounts))assert.ok(a.email.endsWith("@example.test"));
const evidence=path.resolve(process.env.TAYCO_EVIDENCE_DIR||path.join(root,".data","certification","product-completion-"+Date.now()));
assert.ok(evidence.startsWith(path.join(root,".data")+path.sep));fs.mkdirSync(evidence,{recursive:true});
const selected=(process.env.TAYCO_PRODUCT_GROUPS||"crm,projects,finance,documents,accessibility,zoom").split(",").map(s=>s.trim());
assert.ok(selected.length&&selected.every(name=>["crm","projects","finance","documents","accessibility","zoom"].includes(name)),"Unknown test group.");
const report={startedAt:new Date().toISOString(),base,sourceSha256:createHash("sha256").update(fs.readFileSync(fileURLToPath(import.meta.url))).digest("hex"),scope:selected,results:[],limits:["Synthetic isolated accounts only.","Document GUI lifecycle starts from seeded metadata; real cloud upload/download and physical deletion are excluded.","Mobile is browser emulation, not physical iOS/Android."]};
const browser=await chromium.launch({headless:true}),contexts=[],sessions=new Map(),nonce=Date.now().toString(36);
const today=new Date().toISOString().slice(0,10),day=n=>new Date(Date.parse(today+"T12:00:00Z")+n*86400000).toISOString().slice(0,10);
const exact=s=>new RegExp("^"+s.replace(/[.*+?^$()|[\]{}\\]/g,"\\$&")+"$");
async function secure(c){await c.route("**/*",r=>new URL(r.request().url()).origin===base?r.continue():r.abort("blockedbyclient"));}
async function session(role){if(sessions.has(role))return sessions.get(role);const context=await browser.newContext({reducedMotion:"reduce",viewport:{width:1440,height:1000}});contexts.push(context);await secure(context);await context.addCookies([{name:"tayco_session",value:encodeURIComponent(config.accounts[role].cookie),url:base,httpOnly:true,sameSite:"Lax",secure:true}]);const page=await context.newPage();await page.goto(base+"/portal",{waitUntil:"domcontentloaded"});await page.getByRole("heading",{name:/Your projects/}).waitFor();const s={page,context};sessions.set(role,s);return s;}
async function snapshot(s){const r=await s.context.request.get(base+"/api/erp-suite");assert.equal(r.status(),200);return r.json();}
async function api(s,data){return s.context.request.post(base+"/api/erp-suite",{headers:{Origin:base,"Idempotency-Key":randomUUID()},data});}
async function project(s){return(await snapshot(s)).entries.find(e=>e.id===config.projects[0]);}
async function tab(s,name){const nav=s.page.getByRole("navigation",{name:"Command Center Navigation",exact:true});if(!await nav.isVisible())await s.page.getByRole("button",{name:"Open modules",exact:true}).click();await nav.getByRole("button").filter({has:s.page.locator("span").filter({hasText:exact(name)})}).click();await s.page.getByRole("region",{name,exact:true}).waitFor();}
async function fresh(s){await s.page.reload({waitUntil:"domcontentloaded"});await s.page.getByTestId("executive-console").waitFor();await tab(s,"Projects");}
async function article(s){const p=await project(s);return s.page.locator("article").filter({has:s.page.getByRole("heading",{name:p.data.name,exact:true})});}
async function form(scope,title){const sum=scope.locator("summary").filter({hasText:exact(title)});assert.equal(await sum.count(),1,"Unique form "+title);const d=sum.locator("..");if(await d.getAttribute("open")===null)await sum.click();return d.locator("form");}
async function fill(f,fields){for(const [name,value]of Object.entries(fields)){const input=f.locator('[name="'+name+'"]');if(await input.evaluate(e=>e.tagName==="SELECT"))await input.selectOption(String(value));else await input.fill(String(value));}}
async function save(f){await f.getByRole("button",{name:"Save",exact:true}).click();await f.getByRole("status").waitFor();}
async function overflow(p){return p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);}
async function reject(s,data,status=422){const r=await api(s,data);assert.equal(r.status(),status,await r.text());}
async function run(name,fn){if(!selected.includes(name))return;const at=Date.now();try{const details=await fn();report.results.push({name,passed:true,elapsedMs:Date.now()-at,...details});console.log(name+": passed");}catch(e){report.results.push({name,passed:false,error:e.message});throw e;}}
try{
 await run("crm",async()=>{
  const s=await session("admin");await tab(s,"Requests");const staff=(await snapshot(s)).assignees.find(a=>a.email===config.accounts.staff.email);assert.ok(staff);
  const f=await form(s.page,"Add a request");await fill(f,{name:"Completion request "+nonce,email:"completion@example.test",details:"Synthetic workflow only.",assigneeId:staff.id});await save(f);
  let lead=(await snapshot(s)).entries.find(e=>e.kind==="lead"&&e.data.name==="Completion request "+nonce);assert.equal(lead.data.assigneeId,staff.id);
  await reject(s,{action:"update_lead",id:lead.id,version:lead.version,status:"reviewing",nextAction:"Fixture",assigneeId:randomUUID()});
  const card=s.page.locator("article").filter({has:s.page.getByRole("heading",{name:lead.data.name,exact:true})}),review=await form(card,"Review request");
  await fill(review,{assigneeId:"",status:"reviewing",nextAction:"Confirm synthetic scope"});await save(review);lead=(await snapshot(s)).entries.find(e=>e.id===lead.id);assert.ok(!lead.data.assigneeId);
  return {assignedAndCleared:true,invalidAssigneeRejected:true};
 });
 await run("projects",async()=>{
  const s=await session("admin");await tab(s,"Projects");const original=await project(s);
  let f=await form(await article(s),"Project details & approved budget");await fill(f,{name:original.data.name,location:"Fixture location",clientName:"Private synthetic client",budgetUsd:"0",budgetSource:"Synthetic approval source",budgetApprovedOn:today});await save(f);
  let p=await project(s);assert.equal(p.data.budgetUsd,0);
  await reject(s,{action:"update_project_details",id:p.id,version:p.version,name:p.data.name,budgetUsd:-1,budgetSource:"Fixture",budgetApprovedOn:today});
  await reject(s,{action:"update_project_details",id:p.id,version:p.version,name:p.data.name,budgetUsd:1,budgetSource:"Fixture",budgetApprovedOn:day(1)});
  f=await form(await article(s),"Project details & approved budget");await fill(f,{budgetUsd:""});await save(f);p=await project(s);assert.equal(p.data.budgetUsd,null);
  f=await form(await article(s),"Manage schedule");await fill(f,{plannedStart:day(-7),plannedEnd:day(30)});await save(f);p=await project(s);
  await reject(s,{action:"set_project_schedule",id:p.id,version:p.version,plannedStart:day(2),plannedEnd:day(1)});
  await reject(s,{action:"set_project_schedule",id:p.id,version:p.version,plannedStart:"2026-02-30",plannedEnd:day(30)});
  await reject(s,{action:"add_milestone",id:p.id,version:p.version,title:"Out of range",dueDate:day(31)});
  f=await form(await article(s),"Add a milestone");await fill(f,{title:"Completion milestone "+nonce,dueDate:today});await save(f);
  const li=(await article(s)).locator("li").filter({hasText:"Completion milestone "+nonce});f=await form(li,"Update milestone");await fill(f,{status:"completed",completedOn:today});await save(f);
  p=await project(s);const m=p.data.milestones.find(m=>m.title==="Completion milestone "+nonce);assert.equal(m.status,"completed");assert.equal(m.completedOn,today);
  await reject(s,{action:"update_milestone",id:p.id,version:p.version,milestoneId:m.id,title:m.title,dueDate:today,status:"completed",completedOn:day(1)});
  const names={internal:"Internal contact "+nonce,client:"Client contact "+nonce,project:"Project contact "+nonce};
  for(const visibility of ["internal","client","project"]){f=await form(await article(s),"Add a project contact");await fill(f,{name:names[visibility],contactRole:"Fixture responsibility",email:visibility+"@example.test",phone:"5550100",visibility});await save(f);}
  const access=[];
  for(const role of ["client","other","vendor"]){
   const target=await session(role),state=await snapshot(target),shared=state.entries.find(e=>e.id===config.projects[0]),body=JSON.stringify(state);
   assert.ok(!body.includes(names.internal));
   if(role==="other"){assert.ok(!shared);assert.ok(!body.includes(names.client));assert.ok(!body.includes(names.project));}
   else{assert.equal(shared.data.contacts.some(c=>c.name===names.project),true);assert.equal(shared.data.contacts.some(c=>c.name===names.client),role==="client");if(role==="vendor")for(const key of ["budgetUsd","budgetSource","budgetApprovedOn","budgetUpdatedAt","clientName","clientEmail","clientPhone"])assert.equal(shared.data[key],undefined,key+" leaked");await fresh(target);assert.equal(await target.page.locator("summary").filter({hasText:/^Manage schedule$/}).count(),0);}
   p=await project(s);await reject(target,{action:"set_project_schedule",id:p.id,version:p.version,plannedStart:day(-7),plannedEnd:day(30)},403);access.push({role,isolated:true});
  }
  return {zeroBudgetRetained:true,blankBudgetUnknown:true,dateAndMilestoneValidation:true,contactVisibility:access};
 });
 await run("finance",async()=>{
  const s=await session("admin");await tab(s,"Invoices");const f=await form(s.page,"Record an invoice"),reference="=CERT_"+nonce;
  await fill(f,{projectId:config.projects[0],reference,amountUsd:"12.34",audience:"client"});await save(f);
  await tab(s,"Financial overview");await s.page.locator("#portal-project-filter").selectOption(config.projects[0]);
  const waiting=s.page.waitForEvent("download");await s.page.getByRole("link",{name:"Download selected financial CSV",exact:true}).click();const download=await waiting,target=path.join(evidence,"financial-export.csv");await download.saveAs(target);
  const text=fs.readFileSync(target,"utf8");assert.ok(text.startsWith("\ufeff"));assert.ok(text.includes("'"+reference));assert.ok(!text.includes(config.projects[1]));
  const r=await s.context.request.get(base+"/api/finance/export?projectId="+config.projects[0]);assert.equal(r.status(),200);assert.match(r.headers()["cache-control"],/private.*no-store/);assert.match(r.headers()["content-type"],/text\/csv/);
  assert.equal((await s.context.request.get(base+"/api/finance/export?projectId="+randomUUID())).status(),404);
  for(const role of ["client","vendor"]){const target=await session(role);assert.equal((await target.context.request.get(base+"/api/finance/export")).status(),403);await tab(target,"Financial overview");assert.equal(await target.page.getByRole("link",{name:"Download selected financial CSV",exact:true}).count(),0);}
  return {guiDownload:true,scoped:true,spreadsheetFormulaGuard:true,privateNoStore:true,exportSha256:createHash("sha256").update(fs.readFileSync(target)).digest("hex"),exportBytes:fs.statSync(target).size};
 });
 await run("documents",async()=>{
  const s=await session("admin"),vendor=await session("vendor"),vendorState=await snapshot(vendor);
  const db=new DatabaseSync(config.erpDb),projectRow=db.prepare("SELECT tenant_id FROM records WHERE id=? AND kind='project'").get(config.projects[0]);assert.ok(projectRow);
  const id=randomUUID(),at=new Date().toISOString(),name="Seeded lifecycle "+nonce+".pdf";
  const payload={name,blobPath:"vendor-docs/project-"+id+".pdf",contentType:"application/pdf",type:"project",projectId:config.projects[0],status:"pending_review",visibility:"owner",expiresAt:null};
  db.prepare("INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)").run(id,"document",projectRow.tenant_id,config.projects[0],vendorState.actor.id,JSON.stringify(payload),at,at);db.close();
  await fresh(s);await tab(s,"Documents");
  const upload=await form(s.page,"Upload a document");
  await upload.locator('[name="file"]').setInputFiles({name:"synthetic-fixture.pdf",mimeType:"application/pdf",buffer:Buffer.from("%PDF-1.4\n%Synthetic fixture only\n%%EOF")});
  const failedUpload=s.page.waitForResponse(r=>r.url()===base+"/api/upload-doc"&&r.request().method()==="POST");
  await upload.getByRole("button",{name:"Submit for review",exact:true}).click();assert.equal((await failedUpload).status(),503);await upload.getByRole("alert").waitFor();
  assert.match(await upload.getByRole("alert").textContent(),/storage.*configured|configured.*storage/i);
  const advanced=s.page.locator("summary").filter({hasText:/^Document preservation and renewals$/});await advanced.click();
  await s.page.getByTestId("document-record-"+id).getByText(/Received · awaiting review/).waitFor();await advanced.click();
  const card=s.page.locator("article").filter({has:s.page.getByRole("heading",{name,exact:true})}),review=await form(card,"Review document");
  await fill(review,{status:"approved",response:"Synthetic project document reviewed.",visibility:"client",expiresAt:day(-1)});await save(review);
  await s.page.locator("summary").filter({hasText:/^Document preservation and renewals$/}).click();
  const record=s.page.getByTestId("document-record-"+id);await record.getByText(/project · Approved/).waitFor();await record.getByText("Expired",{exact:true}).waitFor();
  await record.getByRole("button",{name:"Remove access",exact:true}).click();await record.getByText("Access removed",{exact:true}).waitFor();
  assert.equal((await vendor.context.request.get(base+"/api/documents/"+id)).status(),410);
  await record.getByRole("button",{name:"Restore document",exact:true}).click();await record.getByText("Available",{exact:true}).waitFor();
  async function policy(){const summary=record.locator("summary").filter({hasText:/^Preservation and retention$/});if(await summary.locator("..").getAttribute("open")===null)await summary.click();}
  async function docAction(button){const response=s.page.waitForResponse(r=>r.url()===base+"/api/document-maintenance"&&r.request().method()==="POST");await record.getByRole("button",{name:button,exact:true}).click();assert.equal((await response).status(),200);await s.page.getByText("Document record updated.",{exact:true}).waitFor();}
  await policy();
  await record.getByLabel("Reason / preservation note").fill("Synthetic preservation hold");await docAction("Place hold");await record.getByText("Preservation hold",{exact:true}).waitFor();
  await policy();await docAction("Release hold");await policy();await record.getByRole("button",{name:"Place hold",exact:true}).waitFor();
  await record.getByLabel("Days to retain after access removal").fill("0");await docAction("Save retention");await policy();
  await record.getByLabel("Days to retain after access removal").fill("");await docAction("Save retention");
  const state=await(await s.context.request.get(base+"/api/document-maintenance")).json(),doc=state.documents.find(d=>d.id===id);assert.equal(doc.effectiveRetentionDays,null);assert.equal(doc.data.purgeAttemptedAt,undefined);assert.equal(doc.availability,"active");
  const client=await session("client");
  assert.equal((await client.context.request.post(base+"/api/document-maintenance",{headers:{Origin:base},data:{action:"delete",id,version:doc.version}})).status(),403);
  assert.equal((await vendor.context.request.post(base+"/api/document-maintenance",{headers:{Origin:base},data:{action:"retention",id,version:doc.version,retentionDays:0}})).status(),403);
  await s.page.getByRole("button",{name:"Check renewal notices",exact:true}).click();await s.page.getByText(/Renewal notices checked/).waitFor();
  return {seededMetadata:true,unconfiguredUpload503:true,receiptIsNotApproval:true,approvalIndependentFromExpiry:true,logicalRemovalBlocksDownload:true,restored:true,holdAndRetention:true,forbiddenMutationsRejected:true,physicalStorageNotExercised:true};
 });
 await run("accessibility",async()=>{
  const s=await session("admin"),measurements=[];
  for(const [width,height]of [[360,740],[390,844],[768,1024],[844,390],[720,450],[1440,900]]){
   await s.page.setViewportSize({width,height});await fresh(s);
   for(const title of ["Projects","Documents","Financial overview"]){await tab(s,title);const excess=await overflow(s.page);assert.ok(excess<=1,"Portal overflow "+width+" "+title);measurements.push({width,height,section:title,overflow:excess});}
   if([390,844,1440].includes(width))await s.page.screenshot({path:path.join(evidence,"portal-"+width+"x"+height+".png"),fullPage:true});
  }
  const publicPage=await s.context.newPage();
  for(const pathname of ["/estimate","/investor","/vendor-application"]){await publicPage.setViewportSize({width:390,height:844});await publicPage.goto(base+pathname,{waitUntil:"domcontentloaded"});const input=publicPage.locator("form input:not([type=hidden]):visible").first();await input.focus();assert.equal(await input.evaluate(e=>e===document.activeElement),true);await publicPage.keyboard.press("Tab");assert.equal(await publicPage.evaluate(()=>document.activeElement?.matches("input,textarea,select,button,a")||false),true);assert.ok(await overflow(publicPage)<=1);await publicPage.evaluate(()=>scrollTo(0,0));await publicPage.screenshot({path:path.join(evidence,pathname.slice(1)+"-mobile.png"),fullPage:true});}
  await s.page.setViewportSize({width:1440,height:1000});await tab(s,"Projects");const summary=(await article(s)).locator("summary").filter({hasText:/^Manage schedule$/});await summary.focus();await s.page.keyboard.press("Enter");assert.notEqual(await summary.locator("..").getAttribute("open"),null);
  return {measurements,keyboardFields:true,keyboardDisclosure:true,physicalDeviceTested:false};
 });
 await run("zoom",async()=>{
  const owned=path.join(evidence,"native-zoom"),ext=path.join(owned,"extension");fs.mkdirSync(ext,{recursive:true});
  fs.writeFileSync(path.join(ext,"manifest.json"),JSON.stringify({manifest_version:3,name:"TAYCO fixture native zoom",version:"1.0",background:{service_worker:"background.js"},host_permissions:[base+"/*"]}));
  fs.writeFileSync(path.join(ext,"background.js"),"chrome.runtime.onInstalled.addListener(()=>{});");
  const context=await chromium.launchPersistentContext(path.join(owned,"profile"),{channel:"chromium",headless:true,viewport:null,reducedMotion:"reduce",args:["--window-size=1440,1000","--disable-extensions-except="+ext,"--load-extension="+ext]});
  try{
   await secure(context);await context.addCookies([{name:"tayco_session",value:encodeURIComponent(config.accounts.admin.cookie),url:base,httpOnly:true,sameSite:"Lax",secure:true}]);
   const worker=context.serviceWorkers()[0]||await context.waitForEvent("serviceworker",{timeout:10000}),page=await context.newPage(),measurements=[];
   for(const pathname of ["/estimate","/vendor-application","/portal"]){
    await page.goto(base+pathname,{waitUntil:"domcontentloaded"});const baseline=await page.evaluate(()=>({outer:outerWidth,dpr:devicePixelRatio}));
    for(const factor of [1,2,4]){
     const applied=await worker.evaluate(async({base,factor})=>{const tabs=await chrome.tabs.query({url:base+"/*"}),tab=tabs.find(t=>t.active)||tabs[0];await chrome.tabs.setZoomSettings(tab.id,{mode:"automatic",scope:"per-tab"});await chrome.tabs.setZoom(tab.id,factor);return chrome.tabs.getZoom(tab.id);},{base,factor});
     assert.ok(Math.abs(applied-factor)<1e-8);await page.waitForFunction(({factor,dpr})=>Math.abs(devicePixelRatio/dpr-factor)<.05,{factor,dpr:baseline.dpr});
     const m=await page.evaluate(()=>({outer:outerWidth,inner:innerWidth,height:innerHeight,dpr:devicePixelRatio,pinchScale:visualViewport.scale,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}));
     assert.equal(m.outer,baseline.outer);assert.equal(m.pinchScale,1);assert.ok(m.overflow<=1,"Native zoom overflow "+pathname+" "+factor);
     const focusable=page.locator(pathname==="/portal"?"button:visible":"form input:not([type=hidden]):visible").first();await focusable.focus();assert.equal(await focusable.evaluate(e=>e===document.activeElement),true);
     await page.evaluate(()=>scrollTo(0,0));
     const cdp=await context.newCDPSession(page),captured=await cdp.send("Page.captureScreenshot",{format:"png",fromSurface:true,captureBeyondViewport:false});await cdp.detach();
     const png=Buffer.from(captured.data,"base64"),pixelWidth=png.readUInt32BE(16),pixelHeight=png.readUInt32BE(20);
     assert.ok(pixelWidth>baseline.outer-64,"Native viewport capture unexpectedly clipped.");
     fs.writeFileSync(path.join(evidence,"native-zoom-"+pathname.slice(1)+"-"+factor+"x-viewport.png"),png);measurements.push({pathname,factor,...m,pixelWidth,pixelHeight});
    }
    await worker.evaluate(async(base)=>{const [tab]=await chrome.tabs.query({url:base+"/*"});await chrome.tabs.setZoom(tab.id,1);},base);
   }
   return {method:"chrome.tabs.setZoom automatic per-tab; owned Chromium profile; no viewport emulation",measurements};
  }finally{await context.close();}
 });
 report.passed=true;
}catch(e){report.passed=false;report.failure={message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}
finally{for(const c of contexts)await c.close();await browser.close();report.completedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,"runtime-report.json"),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,groups:report.results.map(({name,passed})=>({name,passed})),evidence,limits:report.limits}));}
