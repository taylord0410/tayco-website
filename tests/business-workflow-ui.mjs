/**
 * Actual GUI workflow regression against an isolated local fixture.
 * Records synthetic proposals, team assignments and financial source entries only.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createHash,randomUUID} from "node:crypto";
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const configPath=path.resolve(process.env.TAYCO_TEST_CONFIG||"");
assert.ok(configPath.startsWith(path.join(root,".data","certification-modules-")));
const config=JSON.parse(fs.readFileSync(configPath,"utf8")),base=config.baseUrl;
assert.match(base,/^http:\/\/(?:localhost|127\.0\.0\.1):3010$/);
for(const database of[config.authDb,config.erpDb]){const relative=path.relative(fs.realpathSync(path.dirname(configPath)),fs.realpathSync(database));assert.ok(relative&&!relative.startsWith("..")&&!path.isAbsolute(relative),"Databases must belong to this disposable fixture.");}
for(const account of Object.values(config.accounts))assert.ok(account.email.endsWith("@example.test"));
const out=path.resolve(process.env.TAYCO_EVIDENCE_DIR||path.join(root,".data","certification","business-workflow-"+Date.now()));
assert.ok(out.startsWith(path.join(root,".data")+path.sep));fs.mkdirSync(out,{recursive:true});
const {chromium}=createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE||"playwright");
const browser=await chromium.launch({headless:true}),contexts=[],sessions=new Map(),nonce=Date.now().toString(36);
const today=new Date().toISOString().slice(0,10),year=Number(today.slice(0,4)),month=Number(today.slice(5,7));
const report={startedAt:new Date().toISOString(),base,sourceSha256:createHash("sha256").update(fs.readFileSync(fileURLToPath(import.meta.url))).digest("hex"),results:[],limits:["Disposable synthetic fixture only; no customer or external operations.","Sending a proposal records its sending date and does not send an email.","Bookkeeping entries are not settlement. Browser emulation does not certify physical mobile hardware."]};
async function session(role){
 if(sessions.has(role))return sessions.get(role);
 const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:"reduce"});contexts.push(context);
 await context.route("**/*",route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 await context.addCookies([{name:"tayco_session",value:encodeURIComponent(config.accounts[role].cookie),url:base,httpOnly:true,sameSite:"Lax",secure:true}]);
 const page=await context.newPage();page.on("pageerror",error=>runtimeErrors.push({role,message:error.message}));page.on("console",message=>{if(message.type()==="error"&&/hydration|Minified React error #(418|423|425)|server rendered HTML/i.test(message.text()))runtimeErrors.push({role,message:message.text()});});await page.goto(base+"/portal",{waitUntil:"domcontentloaded"});await page.getByTestId("executive-console").waitFor();
 const result={context,page};sessions.set(role,result);return result;
}
async function snapshot(s){const response=await s.context.request.get(base+"/api/erp-suite");assert.equal(response.status(),200);return response.json();}
async function post(s,data){return s.context.request.post(base+"/api/erp-suite",{headers:{Origin:base,"Idempotency-Key":randomUUID()},data});}
async function good(s,data){const response=await post(s,data);assert.equal(response.status(),200,await response.text());return response.json();}
async function find(s,predicate){return(await snapshot(s)).entries.find(predicate);}
async function nav(s,label){
 const toggle=s.page.getByRole("button",{name:"Open modules",exact:true});if(await toggle.isVisible())await toggle.click();
 await s.page.getByRole("navigation",{name:"Command Center Navigation",exact:true}).getByRole("button",{name:new RegExp(label,"i")}).click();
}
async function form(scope,title){
 const summary=scope.locator("summary").filter({hasText:new RegExp("^"+title.replace(/[.*+?^$()|[\]\\]/g,"\\$&")+"$")});assert.equal(await summary.count(),1,"Unique form "+title);
 const detail=summary.locator("..");if(await detail.getAttribute("open")===null)await summary.click();return detail.locator("form");
}
async function fill(f,data){for(const[name,value]of Object.entries(data)){const input=f.locator('[name="'+name+'"]');if(await input.evaluate(e=>e.tagName==="SELECT"))await input.selectOption(String(value));else await input.fill(String(value));}}
async function save(f){const response=f.page().waitForResponse(r=>r.url()===base+"/api/erp-suite"&&r.request().method()==="POST");await f.getByRole("button",{name:"Save",exact:true}).click();const reply=await response;assert.equal(reply.status(),200,await reply.text());await Promise.race([f.getByRole("status").waitFor(),f.waitFor({state:"detached"})]);}
async function reload(s){await s.page.reload({waitUntil:"domcontentloaded"});await s.page.getByTestId("executive-console").waitFor();}
async function run(name,fn){const started=Date.now();try{const details=await fn();report.results.push({name,passed:true,elapsedMs:Date.now()-started,...details});console.log(name+": passed");}catch(error){report.results.push({name,passed:false,error:error.message});throw error;}}
const runtimeErrors=[];
let projectId,acceptedProposalId,staffId;
try{
 const admin=await session("admin");
 await good(admin,{action:"create_project",name:"Business workflow synthetic "+nonce,location:"Isolated fixture",nextAction:"Review synthetic commercial scope"});
 const project=await find(admin,e=>e.kind==="project"&&e.data.name==="Business workflow synthetic "+nonce);assert.ok(project);projectId=project.id;
 staffId=(await snapshot(admin)).assignees.find(member=>member.email===config.accounts.staff.email)?.id;assert.ok(staffId);
 await reload(admin);
 await run("proposal-lifecycle",async()=>{
  await nav(admin,"Client proposals");await admin.page.locator("#portal-project-filter").selectOption(projectId);
  const refs=[];
  for(const state of["accepted","declined","withdrawn"]){
   await admin.page.getByRole("button",{name:/^All proposals/}).click();
   const reference="PROPOSAL-"+state+"-"+nonce;refs.push(reference);
   let f=await form(admin.page,"Create a client proposal");await fill(f,{projectId,reference,title:"Synthetic "+state+" proposal",clientName:"Synthetic customer",amountUsd:"125.50",issuedOn:state==="accepted"?"2026-09-01":today,validUntil:"2026-12-31",source:"Synthetic scope evidence "+nonce});await save(f);
   let proposal=await find(admin,e=>e.kind==="proposal"&&e.data.reference===reference);assert.ok(proposal);const record=admin.page.getByTestId("proposal-record-"+proposal.id);
   const premature=await post(admin,{action:"decide_proposal",id:proposal.id,version:proposal.version,status:state,decidedOn:today,evidence:"Synthetic decision"});assert.equal(premature.status(),409);
   f=await form(record,"Record proposal as sent");await fill(f,{sentOn:state==="accepted"?"2026-09-03":today});await save(f);
   proposal=await find(admin,e=>e.id===proposal.id);assert.equal(proposal.data.status,"sent");assert.equal(proposal.data.sentOn,state==="accepted"?"2026-09-03":today);
   const emptyEvidence=await post(admin,{action:"decide_proposal",id:proposal.id,version:proposal.version,status:state,decidedOn:today,evidence:""});assert.equal(emptyEvidence.status(),422);
   f=await form(record,"Record client proposal decision");await fill(f,{status:state,decidedOn:state==="accepted"?"2026-09-04":today,evidence:"Synthetic client decision evidence "+nonce});await save(f);
   proposal=await find(admin,e=>e.id===proposal.id);assert.equal(proposal.data.status,state);assert.ok(proposal.data.evidence);
   if(state==="accepted"){acceptedProposalId=proposal.id;assert.equal(proposal.data.decidedOn,"2026-09-04");}
   await record.getByText(state[0].toUpperCase()+state.slice(1),{exact:true}).waitFor();
   assert.equal(await record.locator("form").count(),0);
   const reopening=await post(admin,{action:"send_proposal",id:proposal.id,version:proposal.version,sentOn:today});assert.equal(reopening.status(),409);
  }
  await admin.page.getByRole("button",{name:/^Accepted/}).click();assert.equal(await admin.page.locator('[data-testid^="proposal-record-"]').count(),1);
  await admin.page.getByTestId("proposal-record-"+acceptedProposalId).waitFor();
  await admin.page.getByRole("button",{name:/^Pending/}).click();assert.equal(await admin.page.locator('[data-testid^="proposal-record-"]').count(),0);
  await admin.page.getByRole("button",{name:/^All proposals/}).click();assert.equal(await admin.page.locator('[data-testid^="proposal-record-"]').count(),3);
  assert.equal((await snapshot(admin)).entries.filter(e=>e.kind==="invoice"&&e.projectId===projectId).length,0);
  await admin.page.screenshot({path:path.join(out,"proposals-desktop.png"),fullPage:true});
  return {draftSentTerminalGui:true,threeDecisions:true,historicalAcceptedDates:true,missingEvidenceRejected:true,terminalReopenRejected:true,stateFilters:true,acceptanceCreatesNoInvoice:true};
 });
 await run("project-team",async()=>{
  await nav(admin,"Project teams");await admin.page.locator("#portal-project-filter").selectOption(projectId);
  const card=admin.page.getByTestId("project-team-"+projectId);
  let f=await form(card,"Assign a project team member");await fill(f,{memberId:staffId,responsibility:"Synthetic site coordination",assignedOn:today});await save(f);
  let project=await find(admin,e=>e.id===projectId);let members=project.data.teamMembers;assert.equal(members.filter(m=>!m.removedOn).length,1);
  assert.equal(members.find(m=>!m.removedOn).memberId,staffId);
  const duplicate=await post(admin,{action:"add_project_team_member",id:project.id,version:project.version,memberId:staffId,responsibility:"Duplicate",assignedOn:today});assert.equal(duplicate.status(),409);
  f=await form(card,"End project team assignment");await fill(f,{removedOn:today});await save(f);
  project=await find(admin,e=>e.id===projectId);members=project.data.teamMembers;assert.equal(members.filter(m=>!m.removedOn).length,0);assert.equal(members.filter(m=>m.removedOn).length,1);
  await card.locator("summary").filter({hasText:/^Previous assignments/}).click();await card.getByText("Synthetic site coordination",{exact:true}).waitFor();
  await admin.page.screenshot({path:path.join(out,"team-desktop.png"),fullPage:true});
  return {assignmentGui:true,duplicateRejected:true,endAssignmentGui:true,historyPreserved:true};
 });
 await run("finance-source-drilldown",async()=>{
  for(const[reference,amountUsd,audience]of[["PENDING",50,"client"],["APPROVED",100,"client"],["INTERNAL",30,"internal"]]){
   await good(admin,{action:"record_invoice",projectId,reference:reference+"-"+nonce,amountUsd,audience,issuedOn:today,source:"Synthetic source "+nonce});
  }
  let invoice=await find(admin,e=>e.kind==="invoice"&&e.data.reference==="APPROVED-"+nonce);
  await good(admin,{action:"update_invoice",id:invoice.id,version:invoice.version,status:"approved"});invoice=await find(admin,e=>e.id===invoice.id);
  await good(admin,{action:"record_invoice_payment",invoiceId:invoice.id,version:invoice.version,amountUsd:40,occurredOn:today,reference:"PAYMENT-"+nonce});
  await reload(admin);await nav(admin,"Financial overview");await admin.page.locator("#portal-project-filter").selectOption(projectId);
  await admin.page.getByLabel("Financial year",{exact:true}).selectOption(String(year));await admin.page.getByLabel("Financial month",{exact:true}).selectOption(String(month));
  assert.equal((await admin.page.getByTestId("issued-client").textContent()).trim(),"$150.00");
  assert.equal((await admin.page.getByTestId("payments-client").textContent()).trim(),"$40.00");
  await admin.page.getByRole("link",{name:"View awaiting review source invoices for client billing",exact:true}).click();
  assert.equal(await admin.page.getByLabel("Source record audience",{exact:true}).inputValue(),"client");assert.equal(await admin.page.getByLabel("Source invoice status",{exact:true}).inputValue(),"submitted");
  const sourceSection=admin.page.getByLabel("Source record audience",{exact:true}).locator("xpath=ancestor::section[1]");
  assert.equal(await sourceSection.locator("li").count(),1);await sourceSection.getByText("PENDING-"+nonce,{exact:true}).waitFor();
  await admin.page.getByLabel("Source invoice status",{exact:true}).selectOption("all");assert.equal(await sourceSection.locator("li").count(),2);
  await admin.page.getByLabel("Source record audience",{exact:true}).selectOption("internal");assert.equal(await sourceSection.locator("li").count(),1);await sourceSection.getByText("INTERNAL-"+nonce,{exact:true}).waitFor();
  assert.equal((await admin.page.getByTestId("issued-client").textContent()).trim(),"$150.00");
  const refresh=admin.page.waitForResponse(r=>r.url()===base+"/api/erp-suite"&&r.request().method()==="GET");await admin.page.getByRole("button",{name:"Refresh",exact:true}).click();await refresh;
  assert.equal(await admin.page.getByLabel("Source record audience",{exact:true}).inputValue(),"internal");assert.equal(await admin.page.getByLabel("Financial month",{exact:true}).inputValue(),String(month));
  const csv=new URL(await admin.page.getByRole("link",{name:"Download selected financial CSV",exact:true}).getAttribute("href"),base);assert.equal(csv.searchParams.get("projectId"),projectId);assert.equal(csv.searchParams.get("year"),String(year));assert.equal(csv.searchParams.get("month"),String(month));assert.equal(csv.searchParams.has("audience"),false);
  await admin.page.getByRole("navigation",{name:"Financial report sections",exact:true}).getByRole("link",{name:"Dated payment entries",exact:true}).click();assert.equal(await admin.page.getByLabel("Source record audience",{exact:true}).inputValue(),"all");await admin.page.getByText("PAYMENT-"+nonce,{exact:true}).waitFor();
  await admin.page.getByTestId("finance-audience-vendor").getByRole("link",{name:"View invoices",exact:true}).click();assert.equal(await sourceSection.locator("li").count(),0);
  return {audienceAndStatusDrilldownGui:true,independentTotals:true,csvPeriodUnchanged:true,paymentNavigationResetsFilters:true,emptyDirectionClear:true,manualRefreshPreservesLocalReportState:true};
 });
 await run("role-boundaries-and-layout",async()=>{
  for(const role of["client","vendor"]){
   const s=await session(role),navigation=s.page.getByRole("navigation",{name:"Command Center Navigation",exact:true});
   assert.equal(await navigation.getByRole("button",{name:/Client proposals/i}).count(),0);assert.equal(await navigation.getByRole("button",{name:/Project teams/i}).count(),0);
   for(const body of[{action:"create_proposal",projectId,title:"Denied",reference:"Denied",clientName:"Denied",amountUsd:1,source:"Denied",issuedOn:today},{action:"add_project_team_member",id:projectId,version:1,memberId:staffId,responsibility:"Denied",assignedOn:today}])assert.equal((await post(s,body)).status(),403);
  }
  const measurements=[];
  for(const[width,height]of[[360,740],[390,844],[768,1024],[844,390],[1440,900]]){
   await admin.page.setViewportSize({width,height});
   for(const[label,name]of[["Client proposals","proposal"],["Project teams","team"],["Financial overview","finance"]]){
    await nav(admin,label);await admin.page.locator("#portal-project-filter").selectOption(projectId);
    const overflow=await admin.page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert.ok(overflow<=1,width+" "+label);measurements.push({width,height,view:name,overflow});
    if(width===390){await admin.page.evaluate(()=>scrollTo(0,0));await admin.page.screenshot({path:path.join(out,name+"-mobile.png"),fullPage:true});}
   }
  }
  return {externalMutationForbidden:true,internalOnlyNavigation:true,measurements,physicalHardwareTested:false};
 });
 assert.equal(runtimeErrors.length,0,"No unhandled browser runtime or hydration errors");
 report.passed=true;
}catch(error){report.passed=false;report.failure={message:error.message,stack:error.stack};console.error(error.stack);process.exitCode=1;}
finally{for(const context of contexts)await context.close();await browser.close();report.completedAt=new Date().toISOString();report.browserRuntimeErrors=runtimeErrors;fs.writeFileSync(path.join(out,"runtime-report.json"),JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,groups:report.results.map(({name,passed})=>({name,passed})),evidence:out}));}
