import test, { before } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { provisionAdmin, createInvitation, acceptInvitation, getActor, type Actor } from "../lib/auth";
import { execute, snapshot, financialSummary, registerDocument, database } from "../lib/erp";
const folder=mkdtempSync(path.join(os.tmpdir(),"tayco-project-flows-"));
process.env.TAYCO_AUTH_DB_PATH=path.join(folder,"auth.sqlite");
process.env.TAYCO_ERP_DB_PATH=path.join(folder,"erp.sqlite");
process.env.TAYCO_SESSION_SECRET=randomUUID()+randomUUID();
const password=randomUUID()+"Aa1!";
let admin:Actor,staff:Actor,foreign:Actor,client:Actor,vendor:Actor,projectId:string;
const run=(actor:Actor,input:Record<string,unknown>,key=randomUUID())=>execute(actor,key,input);
const current=()=>snapshot(admin).entries.find(entry=>entry.id===projectId)!;
before(async()=>{
 const id=await provisionAdmin("owner@example.test",password);
 admin={id,email:"owner@example.test",role:"admin",tenantId:"tayco_llc",projectIds:[]};
 async function member(email:string,owner=admin) {
  const invitation=createInvitation(owner,{email,role:"staff",tenantId:owner.tenantId,projectIds:[]});
  const accepted=await acceptInvitation(invitation.token,email,password);
  return (await getActor(new Request("http://localhost",{headers:{cookie:"tayco_session="+encodeURIComponent(accepted.cookie)}})))!;
 }
 staff=await member("staff@example.test");foreign=await member("foreign@example.test",{...admin,tenantId:"other_company"});
 const created=run(admin,{action:"create_project",name:"Synthetic project",budgetUsd:0});
 projectId=created.id;
 client={id:"client-fixture",email:"client@example.test",role:"client",tenantId:"tayco_llc",projectIds:[projectId]};
 vendor={id:"vendor-fixture",email:"vendor@example.test",role:"vendor",tenantId:"tayco_llc",projectIds:[projectId]};
});
test("CRM owner is explicit, active, internal and same company; unknown assignment is never inferred",()=>{
 const unassigned=run(admin,{action:"create_lead",name:"Unassigned",email:"lead@example.test",details:"Synthetic"});
 assert.equal(unassigned.data.assigneeId,null);
 const lead=run(admin,{action:"create_lead",name:"Assigned",email:"lead@example.test",details:"Synthetic",assigneeId:staff.id});
 assert.equal(lead.data.assigneeId,staff.id);assert.equal(lead.data.assigneeEmail,staff.email);
 assert.throws(()=>run(admin,{action:"update_lead",id:lead.id,version:lead.version,status:"reviewing",assigneeId:foreign.id}),/active TAYCO team member/);
 assert.throws(()=>run(admin,{action:"update_lead",id:lead.id,version:lead.version,status:"reviewing",assigneeId:client.id}),/active TAYCO team member/);
 const auth=new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);auth.prepare("UPDATE auth_users SET disabled=1 WHERE id=?").run(staff.id);auth.close();
 assert.throws(()=>run(admin,{action:"update_lead",id:lead.id,version:lead.version,status:"reviewing",assigneeId:staff.id}),/active TAYCO team member/);
 assert.equal(snapshot(admin).assignees.some(member=>member.id===staff.id),false);
 assert.deepEqual(snapshot(client).assignees,[]);
 const cleared=run(admin,{action:"update_lead",id:lead.id,version:lead.version,status:"reviewing",assigneeId:""});
 assert.equal(cleared.data.assigneeId,null);
});
test("project dates are real calendar dates, paired and ordered",()=>{
 for(const [start,end]of [["2026-02-30","2026-03-01"],["2026-11-10","2026-11-01"],["2026-11-01",""]])assert.throws(()=>run(admin,{action:"set_project_schedule",id:projectId,version:current().version,plannedStart:start,plannedEnd:end}),/calendar date|on or after|both project/);
 const schedule=run(admin,{action:"set_project_schedule",id:projectId,version:current().version,plannedStart:"2026-10-01",plannedEnd:"2026-12-31"});
 assert.equal(schedule.data.plannedStart,"2026-10-01");
});
test("milestones stay within the schedule, retain history and require actual completion dates",()=>{
 assert.throws(()=>run(admin,{action:"add_milestone",id:projectId,version:current().version,title:"Outside",dueDate:"2027-01-01"}),/within/);
 const key=randomUUID(),body={action:"add_milestone",id:projectId,version:current().version,title:"Inspect",dueDate:"2026-10-20"};
 const added=run(admin,body,key);run(admin,body,key);
 const milestones=added.data.milestones as {id:string;status:string;completedOn:string|null}[];
 assert.equal(milestones.length,1);
 assert.throws(()=>run(admin,{action:"update_milestone",id:projectId,version:current().version,milestoneId:milestones[0].id,dueDate:"2026-10-20",status:"completed"}),/calendar date|actual completion/);
 const updated=run(admin,{action:"update_milestone",id:projectId,version:current().version,milestoneId:milestones[0].id,dueDate:"2026-10-20",status:"completed",completedOn:"2026-10-20"});
 assert.equal((updated.data.milestones as typeof milestones)[0].completedOn,"2026-10-20");
 assert.throws(()=>run(admin,{action:"set_project_schedule",id:projectId,version:current().version,plannedStart:"2026-11-01",plannedEnd:"2026-12-01"}),/milestone dates/);
 assert.throws(()=>run(client,{action:"add_milestone",id:projectId,version:current().version,title:"Unauthorized",dueDate:"2026-10-22"}),/team member/);
});
test("budget provenance and contacts remain scoped; zero is a valid approved amount",()=>{
 const details=run(admin,{action:"update_project_details",id:projectId,version:current().version,name:"Synthetic project",location:"Fixture site",clientName:"Private customer",budgetUsd:0,budgetSource:"Written client approval",budgetApprovedOn:"2026-10-20"});
 assert.equal(details.data.budgetUsd,0);
 for(const [visibility,email]of [["internal","private@example.test"],["client","client-shared@example.test"],["project","site-shared@example.test"]]){
  run(admin,{action:"save_project_contact",id:projectId,version:current().version,name:visibility+" contact",email,visibility});
 }
 const clientProject=snapshot(client).entries.find(entry=>entry.id===projectId)!;
 assert.equal((clientProject.data.contacts as unknown[]).length,2);
 const vendorProject=snapshot(vendor).entries.find(entry=>entry.id===projectId)!;
 assert.equal((vendorProject.data.contacts as {email:string}[]).length,1);
 assert.equal((vendorProject.data.contacts as {email:string}[])[0].email,"site-shared@example.test");
 for(const key of ["budgetUsd","budgetSource","budgetApprovedOn","budgetUpdatedAt","clientName"])assert.equal(key in vendorProject.data,false);
 const stale=details.version;
 assert.throws(()=>run(admin,{action:"set_project_schedule",id:projectId,version:stale,plannedStart:"",plannedEnd:""}),/changed/);
 assert.throws(()=>run(vendor,{action:"save_project_contact",id:projectId,version:current().version,name:"Bad",email:"bad@example.test"}),/team member/);
});
test("financial totals use disjoint source statuses with cents and preserve role isolation",()=>{
 const invoices=[["SUB",10.1,"submitted"],["APP",20.2,"approved"],["PAID",30.3,"paid"],["RETURN",40.4,"returned"]] as const;
 for(const [reference,amountUsd,status]of invoices){
  const invoice=run(admin,{action:"record_invoice",projectId,reference,amountUsd,audience:"client"});
  if(status!=="submitted")run(admin,{action:"update_invoice",id:invoice.id,version:invoice.version,status,...(status==="paid"?{paidOn:new Date().toISOString().slice(0,10),reference:"Fixture dated settlement"}:{})});
 }
 run(vendor,{action:"record_invoice",projectId,reference:"VENDOR",amountUsd:0.1});
 const report=financialSummary(admin,projectId);
 assert.equal(report.invoices.submitted.amountUsd,10.2);assert.equal(report.invoices.approved.amountUsd,20.2);
 assert.equal(report.invoices.paid.amountUsd,30.3);assert.equal(report.invoices.returned.amountUsd,40.4);
 assert.equal(report.approvedOutstandingUsd,20.2);assert.equal(report.paidRecordedUsd,30.3);
 assert.equal(report.projects[0].budgetUsd,0);assert.equal(report.projects[0].budgetSource,"Written client approval");
 assert.equal(report.source,"Recorded project budgets and invoices");assert.ok(report.asOf);
 const vendorReport=financialSummary(vendor,projectId);assert.deepEqual(vendorReport.projects,[]);assert.equal(vendorReport.recordCount,1);assert.equal(vendorReport.invoices.submitted.amountUsd,0.1);
 assert.equal(financialSummary(client,projectId).recordCount,4);
 assert.throws(()=>financialSummary({...client,projectIds:[]},projectId),/not found/);
});
test("deleted documents leave active views and cannot be reapproved; maintenance authorization survives",()=>{
 const document=registerDocument(admin,{blobPath:"synthetic-private.png",name:"Photo",contentType:"image/png",type:"project",projectId});
 const payload={...document.data,deletedAt:new Date().toISOString()};
 database().prepare("UPDATE records SET payload=? WHERE id=?").run(JSON.stringify(payload),document.id);
 assert.equal(snapshot(admin).entries.some(entry=>entry.id===document.id),false);
 assert.throws(()=>run(admin,{action:"review_document",id:document.id,version:document.version,status:"approved",response:"No"}),/deleted/);
});

 test("money never silently rounds fractions of a cent",()=>{
 assert.throws(()=>run(admin,{action:"create_project",name:"Fractional budget",budgetUsd:0.001}),/two decimal/);
 assert.throws(()=>run(admin,{action:"record_invoice",projectId,reference:"FRACTION",amountUsd:1.009}),/two decimal/);
 const invoice=run(admin,{action:"record_invoice",projectId,reference:"CENTS",amountUsd:0.29});
 assert.equal(invoice.data.amountUsd,0.29);
});
test("private document policy and actor metadata stay out of normal client/vendor payloads",()=>{
 const document=registerDocument(vendor,{blobPath:"synthetic.png",name:"Policy",contentType:"image/png",type:"project",projectId});
 const policy={...document.data,hold:true,holdReason:"Private legal reason",holdChangedBy:admin.id,deleteReason:"Internal",deletedBy:admin.id,purgeLastError:"Private provider error",retentionDays:90,purgeAttemptToken:"private-token"};
 database().prepare("UPDATE records SET payload=? WHERE id=?").run(JSON.stringify(policy),document.id);
 const exposed=snapshot(vendor).entries.find(entry=>entry.id===document.id)!;
 for(const key of ["holdReason","holdChangedBy","deleteReason","deletedBy","purgeLastError","retentionDays","purgeAttemptToken"])assert.equal(key in exposed.data,false);
 assert.equal(exposed.data.hold,true);
});

test("reports exclude invalid legacy cents and flag malformed budgets without mutating source records",()=>{
 const invoice=run(admin,{action:"record_invoice",projectId,reference:"LEGACY-PRECISION",amountUsd:1});
 database().prepare("UPDATE records SET payload=? WHERE id=?").run(JSON.stringify({...invoice.data,amountUsd:0.001}),invoice.id);
 const before=financialSummary(admin,projectId);
 assert.equal(before.excludedRecords,1);
 const item=current();
 database().prepare("UPDATE records SET payload=? WHERE id=?").run(JSON.stringify({...item.data,budgetUsd:"malformed"}),item.id);
 const report=financialSummary(admin,projectId);
 assert.equal(report.projects[0].budgetUsd,null);assert.equal(report.projects[0].budgetNeedsReview,true);
 assert.equal(current().data.budgetUsd,"malformed");
});
