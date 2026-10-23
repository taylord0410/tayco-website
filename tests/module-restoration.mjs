/**
 * Restoration regression suite: actual local GUI + authorized API, synthetic data.
 * Requires a NEW disposable certification-modules-* fixture on localhost:3010.
 * No customer accounts, old :3008 review fixture, email, cloud, or external writes.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createRequire} from "node:module";
import {randomUUID,createHash} from "node:crypto";
const {chromium}=createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE||"playwright");
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
assert.ok(process.env.TAYCO_TEST_CONFIG,"A disposable module fixture configuration is required.");
const configFile=path.resolve(process.env.TAYCO_TEST_CONFIG),config=JSON.parse(fs.readFileSync(configFile,"utf8")),base=config.baseUrl;
assert.match(base,/^http:\/\/(?:localhost|127\.0\.0\.1):3010$/);
assert.ok(path.dirname(configFile).startsWith(path.join(root,".data","certification-modules-")));
for(const database of [config.authDb,config.erpDb]){const rel=path.relative(path.dirname(configFile),path.resolve(database));assert.ok(rel&&!rel.startsWith("..")&&!path.isAbsolute(rel));}
for(const actor of Object.values(config.accounts))assert.ok(actor.email.endsWith("@example.test"));
const evidence=path.resolve(process.env.TAYCO_EVIDENCE_DIR||path.join(root,".data","certification","module-restoration-"+Date.now()));
assert.ok(evidence.startsWith(path.join(root,".data")+path.sep));fs.mkdirSync(evidence,{recursive:true});
const groups=(process.env.TAYCO_MODULE_GROUPS||"operations,monthly,roles,responsive").split(",").map(s=>s.trim());
assert.ok(groups.length&&groups.every(g=>["operations","monthly","roles","responsive"].includes(g)));
const report={startedAt:new Date().toISOString(),base,groups,sourceSha256:createHash("sha256").update(fs.readFileSync(fileURLToPath(import.meta.url))).digest("hex"),results:[],limits:["Synthetic isolated accounts and recorded amounts only; no external settlement or accounting sync.","Advanced EVM, G702/G703, IIF, certified WH-347, legal tax filings and live Takeoff remain data-dependent blocks in docs/module-parity.md.","Responsive browser emulation does not certify physical mobile hardware."]};
const browser=await chromium.launch({headless:true}),contexts=[],sessions=new Map(),nonce=Date.now().toString(36),year=2026;
const money=cents=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(cents/100);
const exact=s=>new RegExp("^"+s.replace(/[.*+?^$()|[\]{}\\]/g,"\\$&")+"$");
async function session(role){
 if(sessions.has(role))return sessions.get(role);
 const context=await browser.newContext({reducedMotion:"reduce",viewport:{width:1440,height:1000}});contexts.push(context);
 await context.route("**/*",r=>new URL(r.request().url()).origin===base?r.continue():r.abort("blockedbyclient"));
 await context.addCookies([{name:"tayco_session",value:encodeURIComponent(config.accounts[role].cookie),url:base,httpOnly:true,sameSite:"Lax",secure:true}]);
 const page=await context.newPage();await page.goto(base+"/portal",{waitUntil:"domcontentloaded"});await page.getByTestId("executive-console").waitFor();
 const s={context,page};sessions.set(role,s);return s;
}
async function snapshot(s){const r=await s.context.request.get(base+"/api/erp-suite");assert.equal(r.status(),200);return r.json();}
async function api(s,data){return s.context.request.post(base+"/api/erp-suite",{headers:{Origin:base,"Idempotency-Key":randomUUID()},data});}
async function good(s,data){const r=await api(s,data);assert.equal(r.status(),200,await r.text());return r.json();}
async function denied(s,data,status){const r=await api(s,data);assert.equal(r.status(),status,await r.text());}
async function reload(s){await s.page.reload({waitUntil:"domcontentloaded"});}
async function nav(s,label){
 const toggle=s.page.getByRole("button",{name:"Open modules",exact:true});if(await toggle.isVisible())await toggle.click();
 const navigation=s.page.getByRole("navigation",{name:"Command Center Navigation",exact:true});
 await navigation.getByRole("button",{name:new RegExp(label,"i")}).click();
}
async function form(scope,title){const summary=scope.locator("summary").filter({hasText:exact(title)});assert.equal(await summary.count(),1,"Unique form "+title);const d=summary.locator("..");if(await d.getAttribute("open")===null)await summary.click();return d.locator("form");}
async function fill(f,fields){for(const [name,value]of Object.entries(fields)){const input=f.locator('[name="'+name+'"]');if(await input.evaluate(e=>e.tagName==="SELECT"))await input.selectOption(String(value));else await input.fill(String(value));}}
async function save(f,label="Save"){const reply=f.page().waitForResponse(r=>r.url()===base+"/api/erp-suite"&&r.request().method()==="POST");await f.getByRole("button",{name:label,exact:true}).click();const response=await reply;assert.equal(response.status(),200,await response.text());await Promise.race([f.getByRole("status").waitFor(),f.waitFor({state:"detached"})]);}
async function record(s,id){return(await snapshot(s)).entries.find(e=>e.id===id);}
async function period(s,month,projectId=config.projects[0]){
 const r=await s.context.request.get(base+"/api/finance/periods?year="+year+"&month="+month+"&projectId="+projectId);assert.equal(r.status(),200,await r.text());assert.match(r.headers()["cache-control"],/private.*no-store/);return(await r.json()).report;
}
async function run(name,fn){if(!groups.includes(name))return;const start=Date.now();try{const details=await fn();report.results.push({name,passed:true,elapsedMs:Date.now()-start,...details});console.log(name+": passed");}catch(e){report.results.push({name,passed:false,error:e.message});throw e;}}
const created={};
try{
 await run("operations",async()=>{
  const vendor=await session("vendor"),admin=await session("admin");
  await nav(vendor,"Bid leveling");let f=await form(vendor.page,"Record a supplier offer");
  const supplier="Synthetic supplier "+nonce,scope="Identical synthetic finish scope "+nonce;
  await fill(f,{projectId:config.projects[0],supplierName:supplier,scope,amountUsd:"35.25",issuedOn:"2026-01-05",source:"Synthetic quote "+nonce});await save(f);
  let offer=(await snapshot(admin)).entries.find(e=>e.kind==="bid"&&e.data.supplierName===supplier);assert.ok(offer);created.offer=offer.id;
  await denied(vendor,{action:"review_bid",id:offer.id,version:offer.version,status:"accepted",response:"Not authorized"},403);
  const client=await session("client");await denied(client,{action:"create_bid",projectId:config.projects[0],supplierName:"Forbidden",scope,amountUsd:1,issuedOn:"2026-01-05",source:"Synthetic"},403);
  await reload(admin);await nav(admin,"Bid leveling");
  for(const [suffix,amount] of [["B","36.50"],["C","40.00"]]){f=await form(admin.page,"Record a supplier offer");await fill(f,{projectId:config.projects[0],supplierName:supplier+" "+suffix,scope,amountUsd:amount,issuedOn:"2026-01-05",source:"Synthetic equal-scope alternative "+suffix});await save(f);}
  const scopeGroup=admin.page.getByText(scope,{exact:true}).locator("..");
  await scopeGroup.getByText("3 recorded offers in this scope. Compare inclusions before selecting an offer.",{exact:true}).waitFor();assert.equal(await scopeGroup.getByRole("article").count(),3);
  const offerCard=admin.page.locator("article").filter({has:admin.page.getByRole("heading",{name:supplier,exact:true})});f=await form(offerCard,"Review offer");
  await fill(f,{status:"accepted",response:"Equal synthetic scope reviewed."});await save(f);offer=await record(admin,offer.id);assert.equal(offer.data.status,"accepted");
  await nav(admin,"Purchase orders");f=await form(admin.page,"Create a purchase order");const poRef="PO-CERT-"+nonce;
  await fill(f,{projectId:config.projects[0],reference:poRef,supplierName:supplier,description:scope,amountUsd:"35.25",issuedOn:"2026-01-06",source:"Reviewed synthetic offer",vendorId:config.vendorId,bidId:offer.id});await save(f);
  let po=(await snapshot(admin)).entries.find(e=>e.kind==="purchase_order"&&e.data.reference===poRef);assert.ok(po);assert.equal(po.data.bidId,offer.id);created.order=po.id;
  await denied(admin,{action:"update_purchase_order",id:po.id,version:po.version,status:"received"},409);
  await denied(admin,{action:"create_purchase_order",projectId:po.projectId,reference:poRef,supplierName:supplier,description:scope,amountUsd:35.25,issuedOn:"2026-01-06",source:"Duplicate"},409);
  await denied(admin,{action:"create_purchase_order",projectId:po.projectId,reference:poRef+"-MISMATCH",supplierName:supplier,description:scope,amountUsd:36,issuedOn:"2026-01-06",source:"Mismatch",vendorId:config.vendorId,bidId:offer.id},422);
  const orderCard=admin.page.locator("article").filter({has:admin.page.getByRole("heading",{name:poRef,exact:true})});
  for(const status of ["issued","acknowledged","received","closed"]){f=await form(orderCard,"Update purchase order");await fill(f,{status});await save(f);po=await record(admin,po.id);assert.equal(po.data.status,status);}
  await denied(vendor,{action:"update_purchase_order",id:po.id,version:po.version,status:"cancelled"},403);
  await reload(vendor);await nav(vendor,"Bid leveling");
  for(const suffix of ["B","C"])assert.equal(await vendor.page.getByRole("heading",{name:supplier+" "+suffix,exact:true}).count(),0,"A competing supplier offer leaked.");
  await nav(vendor,"Purchase orders");assert.equal(await vendor.page.getByRole("heading",{name:poRef,exact:true}).isVisible(),true);assert.equal(await vendor.page.locator("summary").filter({hasText:/^Update purchase order$/}).count(),0);
  await nav(admin,"Project requirements & certifications");f=await form(admin.page,"Add a compliance review");const topic="Synthetic compliance review "+nonce;
  await fill(f,{projectId:config.projects[0],jurisdiction:"Synthetic project jurisdiction",topic,dueDate:"2026-02-01",source:"Synthetic review requirement"});await save(f);
  let item=(await snapshot(admin)).entries.find(e=>e.kind==="compliance"&&e.data.topic===topic);created.compliance=item.id;
  await denied(admin,{action:"review_compliance",id:item.id,version:item.version,status:"complete",evidence:"",reviewedOn:"2026-01-10"},422);
  const check=admin.page.locator("article").filter({has:admin.page.getByRole("heading",{name:topic,exact:true})});f=await form(check,"Review compliance item");
  await fill(f,{status:"complete",evidence:"Synthetic evidence reviewed; not a legal certification.",reviewedOn:"2026-01-10"});await save(f);item=await record(admin,item.id);assert.equal(item.data.status,"complete");
  return {vendorOfferGui:true,threeEqualScopeOffersCompared:true,competingOffersPrivateFromVendor:true,acceptedOfferLinkedToOrder:true,poStates:["draft","issued","acknowledged","received","closed"],invalidTransitionAndMismatchRejected:true,complianceRequiresEvidence:true};
 });
 await run("monthly",async()=>{
  const admin=await session("admin"),vendor=await session("vendor");
  const janBefore=await period(admin,1),febBefore=await period(admin,2);
  await nav(admin,"Invoices");let f=await form(admin.page,"Record an invoice");const reference="ISSUE-JAN-"+nonce;
  await fill(f,{projectId:config.projects[0],reference,amountUsd:"100",issuedOn:"2026-01-31",source:"Synthetic client invoice",audience:"client"});await save(f);
  let invoice=(await snapshot(admin)).entries.find(e=>e.kind==="invoice"&&e.data.reference===reference);assert.ok(invoice);created.invoice=invoice.id;
  await good(admin,{action:"update_invoice",id:invoice.id,version:invoice.version,status:"approved"});invoice=await record(admin,invoice.id);
  await denied(admin,{action:"record_invoice_payment",invoiceId:invoice.id,version:invoice.version,amountUsd:1,occurredOn:"2026-01-30",reference:"Before issue"},422);
  await denied(admin,{action:"record_invoice_payment",invoiceId:invoice.id,version:invoice.version,amountUsd:101,occurredOn:"2026-02-01",reference:"Overpayment"},422);
  await reload(admin);await nav(admin,"Invoices");
  const paymentHistory=admin.page.getByTestId("invoice-payments-"+invoice.id);
  f=await form(paymentHistory,"Record a dated payment");await fill(f,{amountUsd:"40",occurredOn:"2026-01-31",reference:"PAY-JAN-"+nonce});await save(f,"Save payment record");invoice=await record(admin,invoice.id);
  f=await form(paymentHistory,"Record a dated payment");await fill(f,{amountUsd:"60",occurredOn:"2026-02-01",reference:"PAY-FEB-"+nonce});await save(f,"Save payment record");invoice=await record(admin,invoice.id);assert.equal(invoice.data.status,"paid");
  await good(vendor,{action:"record_invoice",projectId:config.projects[0],reference:"SUPPLIER-JAN-"+nonce,amountUsd:30,issuedOn:"2026-01-31",source:"Synthetic supplier invoice"});
  let supplier=(await snapshot(admin)).entries.find(e=>e.kind==="invoice"&&e.data.reference==="SUPPLIER-JAN-"+nonce);
  await good(admin,{action:"update_invoice",id:supplier.id,version:supplier.version,status:"approved"});supplier=await record(admin,supplier.id);
  await good(admin,{action:"record_invoice_payment",invoiceId:supplier.id,version:supplier.version,amountUsd:30,occurredOn:"2026-02-01",reference:"SUPPLIER-PAY-"+nonce});
  await good(admin,{action:"record_invoice",projectId:config.projects[1],reference:"OTHER-PROJECT-"+nonce,amountUsd:777,issuedOn:"2026-01-31",source:"Disjoint synthetic invoice",audience:"client"});
  const jan=await period(admin,1),feb=await period(admin,2);
  assert.equal(jan.selected.byAudience.client.issuedCents-janBefore.selected.byAudience.client.issuedCents,10000);
  assert.equal(jan.selected.byAudience.client.paymentCents-janBefore.selected.byAudience.client.paymentCents,4000);
  assert.equal(feb.selected.byAudience.client.issuedCents-febBefore.selected.byAudience.client.issuedCents,0);
  assert.equal(feb.selected.byAudience.client.paymentCents-febBefore.selected.byAudience.client.paymentCents,6000);
  assert.equal(feb.selected.byAudience.vendor.paymentCents-febBefore.selected.byAudience.vendor.paymentCents,3000);
  assert.ok(!JSON.stringify(jan).includes("OTHER-PROJECT-"+nonce));
  await reload(admin);await nav(admin,"Financial overview");await admin.page.locator("#portal-project-filter").selectOption(config.projects[0]);
  await admin.page.getByLabel("Financial year",{exact:true}).selectOption("2026");await admin.page.getByLabel("Financial month",{exact:true}).selectOption("1");
  await admin.page.getByTestId("finance-periods").getByRole("status").filter({hasText:/^January 2026$/}).waitFor();
  assert.equal((await admin.page.getByTestId("issued-client").textContent()).trim(),money(jan.selected.byAudience.client.issuedCents));
  assert.equal((await admin.page.getByTestId("payments-client").textContent()).trim(),money(jan.selected.byAudience.client.paymentCents));
  assert.equal(await admin.page.getByTestId("monthly-finance-table").locator("tbody tr").count(),12);
  assert.equal(await admin.page.getByTestId("monthly-finance-chart").getAttribute("role"),"img");
  const janRow=admin.page.getByTestId("monthly-finance-table").locator('[data-month="2026-01"]');assert.ok((await janRow.textContent()).includes(money(jan.selected.byAudience.client.issuedCents)));
  await admin.page.getByLabel("Financial month",{exact:true}).selectOption("2");
  assert.equal((await admin.page.getByTestId("issued-client").textContent()).trim(),money(feb.selected.byAudience.client.issuedCents));
  assert.equal((await admin.page.getByTestId("payments-client").textContent()).trim(),money(feb.selected.byAudience.client.paymentCents));
  assert.equal((await admin.page.getByTestId("payments-vendor").textContent()).trim(),money(feb.selected.byAudience.vendor.paymentCents));
  await admin.page.getByLabel("Chart audience",{exact:true}).selectOption("vendor");
  assert.equal((await admin.page.getByTestId("monthly-finance-table").locator('[data-month="2026-02"] td').last().textContent()).trim(),money(feb.selected.byAudience.vendor.paymentCents));
  await admin.page.getByLabel("Chart audience",{exact:true}).selectOption("client");
  const waiting=admin.page.waitForEvent("download");await admin.page.getByRole("link",{name:"Download selected financial CSV",exact:true}).click();const file=await waiting;await file.saveAs(path.join(evidence,"february-financial-export.csv"));
  const csv=fs.readFileSync(path.join(evidence,"february-financial-export.csv"),"utf8");assert.ok(csv.includes("PAY-FEB-"+nonce));assert.ok(!csv.includes("PAY-JAN-"+nonce));assert.ok(!csv.includes("OTHER-PROJECT-"+nonce));
  const payment=invoice.data.payments.find(p=>p.reference==="PAY-FEB-"+nonce);
  await denied(admin,{action:"void_invoice_payment",invoiceId:invoice.id,version:invoice.version,paymentId:payment.id,reason:""},422);
  await nav(admin,"Invoices");
  const paymentRow=admin.page.getByTestId("invoice-payments-"+invoice.id).locator("li").filter({hasText:"PAY-FEB-"+nonce});
  f=await form(paymentRow,"Void this payment record");await fill(f,{reason:"Synthetic duplicate-entry correction"});await save(f,"Void recorded payment");
  const corrected=await period(admin,2);assert.equal(corrected.selected.byAudience.client.paymentCents,feb.selected.byAudience.client.paymentCents-6000);
  const retained=await record(admin,invoice.id);assert.ok(retained.data.payments.find(p=>p.id===payment.id).voidedAt);assert.equal(retained.data.status,"approved");
  await nav(admin,"Financial overview");await admin.page.locator("#portal-project-filter").selectOption(config.projects[0]);
  await admin.page.getByLabel("Financial year",{exact:true}).selectOption("2026");await admin.page.getByLabel("Financial month",{exact:true}).selectOption("2");
  assert.equal((await admin.page.getByTestId("payments-client").textContent()).trim(),money(corrected.selected.byAudience.client.paymentCents));
  await admin.page.getByLabel("Financial year",{exact:true}).selectOption("all");assert.equal(await admin.page.getByLabel("Financial month",{exact:true}).isDisabled(),true);
  for(const query of ["year=2026&month=13","month=1","year=oops&month=1"]){assert.equal((await admin.context.request.get(base+"/api/finance/periods?"+query)).status(),422);}
  assert.equal((await admin.context.request.get(base+"/api/finance/periods?year=2026&month=1&projectId="+randomUUID())).status(),404);
  for(const role of ["staff","client","vendor"]){const s=await session(role);await denied(s,{action:"record_invoice_payment",invoiceId:retained.id,version:retained.version,amountUsd:1,occurredOn:"2026-02-02",reference:"Unauthorized"},403);}
  return {issuedAndEffectivePaymentMonthsSeparated:true,partialPaymentsGui:true,supplierDirectionSeparate:true,chartHasTwelveAccessibleRows:true,selectedCsvGuiDownload:true,correctionPreservesAuditEntry:true,invalidPeriodsRejected:true};
 });
 await run("roles",async()=>{
  const expected={admin:["Bid leveling","Purchase orders","Project requirements & certifications","Investor & lender dossier","Takeoff Pro bridge"],staff:["Bid leveling","Purchase orders","Project requirements & certifications","Investor & lender dossier","Takeoff Pro bridge"],client:["Investor & lender dossier"],other:["Investor & lender dossier"],vendor:["Bid leveling","Purchase orders"]};
  const states=[];
  for(const role of ["admin","staff","client","other","vendor"]){
   const s=await session(role);await reload(s);const state=await snapshot(s);const navElement=s.page.getByRole("navigation",{name:"Command Center Navigation",exact:true});
   for(const label of ["Bid leveling","Purchase orders","Project requirements & certifications","Investor & lender dossier","Takeoff Pro bridge"]){assert.equal(await navElement.getByRole("button",{name:new RegExp(label,"i")}).count(),expected[role].includes(label)?1:0,role+" nav "+label);}
   if(["client","other","vendor"].includes(role)){
    assert.equal(state.entries.some(e=>e.kind==="compliance"),false);
    if(role!=="vendor")assert.equal(state.entries.some(e=>e.kind==="bid"||e.kind==="purchase_order"),false);
    if(role==="other")assert.equal(state.entries.some(e=>e.projectId===config.projects[0]),false);
   }
   const dossier=await s.context.request.get(base+"/api/project-dossier?projectId="+config.projects[0]);
   if(role==="vendor")assert.equal(dossier.status(),403);
   else if(role==="other")assert.equal(dossier.status(),404);
   else{assert.equal(dossier.status(),200);assert.match(dossier.headers()["cache-control"],/private.*no-store/);const text=await dossier.text();assert.ok(!text.includes("blobPath"));}
   if(["client","vendor"].includes(role))assert.equal((await s.context.request.get(base+"/api/finance/export?year=2026&month=2")).status(),403);
   states.push({role,scoped:true});
  }
  const unauth=await browser.newContext();contexts.push(unauth);
  for(const route of ["/api/finance/periods?year=2026&month=1","/api/project-dossier?projectId="+config.projects[0]])assert.equal((await unauth.request.get(base+route)).status(),401);
  const admin=await session("admin");await nav(admin,"Investor & lender dossier");await admin.page.locator("#portal-project-filter").selectOption(config.projects[0]);
  const download=admin.page.waitForEvent("download");await admin.page.getByRole("link",{name:"Download project dossier",exact:true}).click();const received=await download;await received.saveAs(path.join(evidence,"project-dossier.json"));const payload=JSON.parse(fs.readFileSync(path.join(evidence,"project-dossier.json"),"utf8"));assert.ok(payload);assert.ok(!JSON.stringify(payload).includes("blobPath"));
  return {states,unauthenticatedRejected:true,dossierGuiDownload:true};
 });
 await run("responsive",async()=>{
  const s=await session("admin"),measurements=[];
  for(const [width,height]of [[360,740],[390,844],[768,1024],[844,390],[1024,768],[1440,900]]){
   await s.page.setViewportSize({width,height});
   for(const label of ["Executive overview","Bid leveling","Purchase orders","Project requirements & certifications","Financial overview","Investor & lender dossier","Takeoff Pro bridge"]){
    await nav(s,label);const excess=await s.page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert.ok(excess<=1,"Overflow "+width+" "+label);measurements.push({width,height,view:label,overflow:excess});
   }
   await nav(s,"Executive overview");await s.page.evaluate(()=>scrollTo(0,0));await s.page.screenshot({path:path.join(evidence,"console-"+width+"x"+height+".png"),fullPage:true});
   await nav(s,"Financial overview");await s.page.getByLabel("Financial year",{exact:true}).selectOption("2026");await s.page.getByLabel("Financial month",{exact:true}).selectOption("1");await s.page.evaluate(()=>scrollTo(0,0));await s.page.screenshot({path:path.join(evidence,"monthly-"+width+"x"+height+".png"),fullPage:true});
  }
  await s.page.setViewportSize({width:390,height:844});const toggle=s.page.getByRole("button",{name:"Open modules",exact:true});await toggle.focus();await s.page.keyboard.press("Enter");await s.page.getByRole("button",{name:"Close modules",exact:true}).waitFor();await s.page.keyboard.press("Escape");assert.equal(await toggle.evaluate(e=>e===document.activeElement),true);
  return {measurements,mobileMenuKeyboard:true,physicalHardwareTested:false};
 });
 report.passed=true;
}catch(e){report.passed=false;report.failure={message:e.message,stack:e.stack};console.error(e.stack);process.exitCode=1;}
finally{for(const c of contexts)await c.close();await browser.close();report.completedAt=new Date().toISOString();fs.writeFileSync(path.join(evidence,"runtime-report.json"),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,groups:report.results.map(({name,passed})=>({name,passed})),evidence,limits:report.limits}));}
