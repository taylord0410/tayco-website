"use client";
import type { ReactNode } from "react";
import type { Data, Entry, Milestone } from "@/lib/erp";
import { isValidUsdAmount } from "@/lib/financial-values";

export type WorkspaceField = { name: string; label: string; type?: "text" | "email" | "number" | "date" | "textarea" | "select"; required?: boolean; options?: { value: string; label: string }[]; value?: string | number; min?: number; max?: number; step?: number; emptyValue?: unknown; placeholder?: string };
export type WorkspaceForm = { title: string; action: string; fields: WorkspaceField[]; fixed?: Data; submit?: string };
const text = (data: Data, key: string) => typeof data[key] === "string" ? String(data[key]) : "";
function displayDate(raw: string) { const parsed=new Date(raw+"T00:00:00Z"); return Number.isNaN(parsed.valueOf()) ? raw : parsed.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"}); }
const options = (values: string[]) => values.map(value=>({value,label:value.replaceAll("_"," ")}));
const contactFields = (contact:Data={}): WorkspaceField[] => [
  {name:"name",label:"Contact name",value:text(contact,"name")},
  {name:"contactRole",label:"Contact responsibility",value:text(contact,"contactRole"),required:false},
  {name:"email",label:"Contact email",type:"email",required:false,value:text(contact,"email")},
  {name:"phone",label:"Contact phone",required:false,value:text(contact,"phone")},
  {name:"visibility",label:"Contact visibility",type:"select",value:text(contact,"visibility")||"internal",options:[{value:"internal",label:"TAYCO team only"},{value:"client",label:"Assigned client and TAYCO"},{value:"project",label:"All assigned project participants"}]},
];
export default function ProjectOverview({entry,team,vendor,documents=[],renderForm}:{entry:Entry;team:boolean;vendor:boolean;documents?:Entry[];renderForm:(props:WorkspaceForm)=>ReactNode}) {
 const d=entry.data,fixed={id:entry.id,version:entry.version};
 const milestones=(Array.isArray(d.milestones)?d.milestones:[]) as Milestone[];
 const contacts=(Array.isArray(d.contacts)?d.contacts:[]) as Data[];
 return <div className="mt-5 space-y-5 border-t border-slate-700 pt-5">
  <section aria-label="Project schedule">
   <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold text-amber-100">Schedule &amp; milestones</h4><span className="text-xs text-slate-400">Calendar dates</span></div>
   <p className="mt-2 text-sm text-slate-300">{text(d,"plannedStart")&&text(d,"plannedEnd")?displayDate(text(d,"plannedStart"))+" — "+displayDate(text(d,"plannedEnd")):"Project dates have not been set."}</p>
   {milestones.length?<ol className="mt-4 space-y-3 border-l border-amber-200/30 pl-4">{milestones.map(milestone=><li key={milestone.id} className="rounded-lg border border-slate-700 bg-[#0f2040]/70 p-3">
    <div className="flex flex-wrap justify-between gap-2"><p className="break-words text-sm font-semibold text-white">{milestone.title}</p><span className="text-xs capitalize text-amber-100">{milestone.status}</span></div>
    <p className="mt-1 text-xs text-slate-300">Due {displayDate(milestone.dueDate)}{milestone.completedOn?" · Completed "+displayDate(milestone.completedOn):""}</p>
    {team&&renderForm({title:"Update milestone",action:"update_milestone",fixed:{...fixed,milestoneId:milestone.id},fields:[{name:"title",label:"Milestone title",value:milestone.title},{name:"dueDate",label:"Milestone due date",type:"date",value:milestone.dueDate},{name:"status",label:"Milestone status",type:"select",value:milestone.status,options:options(["planned","active","completed","cancelled"])},{name:"completedOn",label:"Actual completion date (required when completed)",type:"date",required:false,value:milestone.completedOn||""}]})}
   </li>)}</ol>:<p className="mt-3 rounded-lg border border-dashed border-slate-600 p-3 text-sm text-slate-400">No milestones have been scheduled.</p>}
   {team&&renderForm({title:"Manage schedule",action:"set_project_schedule",fixed,fields:[{name:"plannedStart",label:"Planned start",type:"date",required:false,value:text(d,"plannedStart")},{name:"plannedEnd",label:"Planned completion",type:"date",required:false,value:text(d,"plannedEnd")}]})}
   {team&&renderForm({title:"Add a milestone",action:"add_milestone",fixed,fields:[{name:"title",label:"Milestone title"},{name:"dueDate",label:"Milestone due date",type:"date"}]})}
  </section>
  <section aria-label="Project contacts">
   <h4 className="font-semibold text-amber-100">Project contacts</h4>
   {contacts.filter(contact=>contact.status!=="archived"||team).length?<div className="mt-3 space-y-3">{contacts.filter(contact=>contact.status!=="archived"||team).map(contact=><div key={String(contact.id)} className="rounded-lg border border-slate-700 p-3">
    <p className="break-words text-sm font-semibold text-white">{text(contact,"name")}{contact.status==="archived"&&<span className="ml-2 text-xs text-slate-400">Archived</span>}</p>
    {text(contact,"contactRole")&&<p className="mt-1 text-xs text-slate-300">{text(contact,"contactRole")}</p>}
    <div className="mt-2 flex flex-wrap gap-x-4">{text(contact,"email")&&<a className="inline-flex min-h-11 max-w-full items-center break-all text-sm text-amber-100 underline underline-offset-4" href={"mailto:"+text(contact,"email")}>{text(contact,"email")}</a>}{text(contact,"phone")&&<a className="inline-flex min-h-11 items-center text-sm text-amber-100 underline underline-offset-4" href={"tel:"+text(contact,"phone").replace(/[^+0-9]/g,"")}>{text(contact,"phone")}</a>}</div>
    {team&&<><p className="text-xs text-slate-400">Shared with: {contact.visibility==="internal"?"TAYCO team":contact.visibility==="client"?"Assigned client":"All assigned participants"}</p>{renderForm({title:"Edit project contact",action:"save_project_contact",fixed:{...fixed,contactId:contact.id},fields:[...contactFields(contact),{name:"status",label:"Contact status",type:"select",value:text(contact,"status")||"active",options:options(["active","archived"])}]})}</>}
   </div>)}</div>:<p className="mt-3 text-sm text-slate-400">No contacts have been shared in this workspace.</p>}
   {team&&renderForm({title:"Add a project contact",action:"save_project_contact",fixed,fields:contactFields()})}
  </section>
  <section aria-label="Project photos and files"><h4 className="font-semibold text-amber-100">Photos and project files</h4>
   {documents.length?<div className="mt-3 grid gap-2 sm:grid-cols-2">{documents.map(document=><div key={document.id} className="min-w-0 rounded-lg border border-slate-700 p-3"><a href={"/api/documents/"+encodeURIComponent(document.id)} className="inline-flex min-h-11 max-w-full items-center break-words text-sm font-semibold text-amber-100 underline underline-offset-4">{String(document.data.name||"Project document")} ↗</a><p className="mt-1 text-xs leading-relaxed text-slate-400">{["image/jpeg","image/png"].includes(String(document.data.contentType))?"Project photo":"Project file"} · {String(document.data.status||"Received").replaceAll("_"," ")}<br/>{displayDate(document.updatedAt.slice(0,10))}{team?" · "+(document.data.visibility==="client"?"Shared with assigned client":"Uploader and TAYCO team"):""}</p></div>)}</div>:<p className="mt-3 text-sm text-slate-400">No project files or photos have been shared with this account.</p>}
  </section>
  {!vendor&&<section className="rounded-lg border border-amber-200/20 bg-amber-200/5 p-3" aria-label="Budget approval source"><h4 className="text-sm font-semibold text-amber-100">Budget record</h4><p className="mt-2 text-xs leading-relaxed text-slate-300">Source: {text(d,"budgetSource")||"Approval source has not been recorded."}<br/>Approval date: {text(d,"budgetApprovedOn")?displayDate(text(d,"budgetApprovedOn")):"Not recorded"}</p></section>}
  {team&&renderForm({title:"Project details & approved budget",action:"update_project_details",fixed,fields:[{name:"name",label:"Project name",value:text(d,"name")},{name:"location",label:"Project location",required:false,value:text(d,"location")},{name:"clientName",label:"Client name",required:false,value:text(d,"clientName")},{name:"budgetUsd",label:"Approved budget (USD, leave empty if unknown)",type:"number",required:false,min:0,max:1e10,step:0.01,value:isValidUsdAmount(d.budgetUsd)?d.budgetUsd:"",emptyValue:null},{name:"budgetSource",label:"Budget approval source (required with amount)",required:false,value:text(d,"budgetSource")},{name:"budgetApprovedOn",label:"Budget approval date (required with amount)",type:"date",required:false,value:text(d,"budgetApprovedOn")}]})}
  <p className="text-xs leading-relaxed text-slate-400">Project updates and photos are shared through Updates and approved project documents. Private contacts stay limited to their selected audience.</p>
 </div>;
}
