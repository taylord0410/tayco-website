"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import type { Entry, Data } from "@/lib/erp";
import type { AuthRole } from "@/lib/auth";
import { COMPANY } from "@/lib/company";
import { isValidUsdAmount } from "@/lib/financial-values";
import ProjectOverview, { type WorkspaceField } from "@/components/workspace/ProjectOverview";
import FinanceOverview from "@/components/workspace/FinanceOverview";
import DocumentMaintenance from "@/components/DocumentMaintenance";
import ExecutiveConsole from "@/components/workspace/ExecutiveConsole";
import OperationsModules from "@/components/workspace/OperationsModules";
import InvoicePaymentControls from "@/components/workspace/InvoicePaymentControls";

export type DashboardData = {
  actor: { id: string; email: string; role: AuthRole };
  entries: Entry[];
  updatedAt: string;
  integrations: { takeoff: string; accounting: string };
  delivery: Data[];
  audit: Data[];
  assignees?: {id:string;email:string;role:AuthRole}[];
};
type Field = WorkspaceField;
type Command = (data: Data, key: string) => Promise<void>;
class RequestError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}
const fieldClass = "mt-1 min-h-11 w-full min-w-0 rounded-lg border border-slate-600 bg-[#09172b] px-3 py-2 text-sm text-slate-100 focus:border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-200/40";
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-[#0f2040] hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 disabled:cursor-wait disabled:opacity-60";
const secondaryClass = "inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-slate-100 hover:border-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200 disabled:opacity-60";
const label = (value: unknown) => typeof value === "string" ? value.replaceAll("_", " ") : "";
const value = (data: Data, key: string) => typeof data[key] === "string" || typeof data[key] === "number" ? String(data[key]) : "";
const money = (amount: unknown) => isValidUsdAmount(amount) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount) : "Not set";
function timestamp(raw: string) {
  const parsed = new Date(raw);
  return Number.isNaN(parsed.valueOf()) ? raw : parsed.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC";
}
function date(raw: string) { const parsed = new Date(raw); return Number.isNaN(parsed.valueOf()) ? raw : parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); }

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-amber-200/20 bg-[#0f2040] p-5 shadow-xl sm:p-7"><h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>{subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-300">{subtitle}</p>}<div className="mt-5">{children}</div></section>;
}
function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-600 bg-[#09172b]/60 px-5 py-7 text-sm leading-relaxed text-slate-300">{children}</p>;
}
function Status({ children }: { children: ReactNode }) {
  return <span className="inline-flex max-w-full items-center rounded-full border border-amber-200/25 bg-amber-200/10 px-3 py-1 text-xs font-semibold capitalize text-amber-100">{children}</span>;
}

/** Each submitted payload keeps its request reference across an uncertain retry. */
function CommandForm({ title, action, fields, fixed = {}, submit = "Save", command, expanded = false }: { title: string; action: string; fields: Field[]; fixed?: Data; submit?: string; command: Command; expanded?: boolean }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const pending = useRef<{ key: string; body: Data } | null>(null);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy) return;
    if (!uncertain) {
      const submitted = new FormData(form);
      const body: Data = { action, ...fixed };
      for (const field of fields) {
        const item = String(submitted.get(field.name) ?? "").trim();
        if (field.type === "number" && item === "" && field.required === false) {
          if ("emptyValue" in field) body[field.name] = field.emptyValue;
          continue;
        }
        body[field.name] = field.type === "number" && item !== "" ? Number(item) : item;
      }
      pending.current = { key: crypto.randomUUID(), body };
    }
    if (!pending.current) return;
    setBusy(true); setError(""); setSuccess("");
    try {
      await command(pending.current.body, pending.current.key);
      pending.current = null;
      setUncertain(false);
      setSuccess("Saved. The latest information is shown above.");
      if (action.startsWith("create_") || ["add_note", "log_hours", "record_invoice", "request_change", "add_milestone", "record_invoice_payment"].includes(action) || (action === "save_project_contact" && !fixed.contactId)) form.reset();
    } catch (failure) {
      const issue = failure instanceof RequestError ? failure : new RequestError("The save could not be confirmed. Retry this same request before entering another.");
      const unknown = issue.status === 0 || issue.status >= 500;
      setUncertain(unknown);
      if (!unknown) pending.current = null;
      setError(issue.status === 409 ? issue.message + " Your entries are preserved; review the refreshed record before saving again." : issue.message);
    } finally { setBusy(false); }
  }

  return <details open={expanded || undefined} className="mt-4 rounded-xl border border-slate-600/80 bg-[#09172b]/40">
    <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200">{title}</summary>
    <form onSubmit={send} className="space-y-4 border-t border-slate-700 p-4" aria-busy={busy}>
      <fieldset disabled={busy || uncertain} className="grid min-w-0 gap-4 sm:grid-cols-2">
        {fields.map((field) => <label key={field.name} htmlFor={id + field.name} className={"min-w-0 text-sm font-medium text-slate-200 " + (field.type === "textarea" ? "sm:col-span-2" : "")}>
          {field.label}{field.required !== false && <span className="text-amber-200" aria-hidden="true"> *</span>}
          {field.type === "select" ?
            <select id={id + field.name} name={field.name} required={field.required !== false} defaultValue={field.value ?? ""} className={fieldClass}><option value="">{field.placeholder || (field.required === false ? "Not assigned" : "Choose an option")}</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> :
            field.type === "textarea" ? <textarea id={id + field.name} name={field.name} required={field.required !== false} defaultValue={field.value ?? ""} maxLength={4000} rows={4} className={fieldClass} /> :
              <input id={id + field.name} name={field.name} type={field.type ?? "text"} required={field.required !== false} defaultValue={field.value ?? ""} min={field.min} max={field.max} step={field.step} maxLength={field.type === "email" ? 254 : 500} className={fieldClass} />}
        </label>)}
      </fieldset>
      {error && <p role="alert" className="rounded-lg border border-red-300/30 bg-red-950/30 p-3 text-sm leading-relaxed text-red-100">{error}</p>}
      {success && <p role="status" className="text-sm text-emerald-200">{success}</p>}
      {uncertain && <p className="text-xs leading-relaxed text-slate-300">Your inputs are held so retrying uses the same request reference and does not create a second record.</p>}
      <button className={buttonClass} disabled={busy} type="submit">{busy ? "Saving…" : uncertain ? "Retry this request" : submit}</button>
    </form>
  </details>;
}

function DocumentUpload({ projects, refresh }: { projects: Entry[]; refresh: () => Promise<void> }) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [unknown, setUnknown] = useState(false);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || unknown) return;
    const form = event.currentTarget, fields = new FormData(form);
    const file = fields.get("file");
    setMessage(""); setFailed(false);
    if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024) { setMessage("Choose a PDF, JPEG or PNG file smaller than 10 MB."); setFailed(true); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/upload-doc", { method: "POST", body: fields });
      const result = await response.json();
      if (!response.ok || result.success !== true) throw new RequestError(result.error || "The document was not confirmed as received.", response.status);
      setMessage("Received for review. A TAYCO team member must review it before approval.");
      form.reset();
      try { await refresh(); } catch { setMessage("Received for review. The document list could not be refreshed. Do not upload it again; use Refresh to check the receipt."); }
    } catch (failure) {
      const issue = failure instanceof RequestError ? failure : new RequestError("Upload receipt is uncertain. Refresh the document list and contact TAYCO before uploading it again.");
      setFailed(true); setMessage(issue.message);
      if (issue.status === 0) setUnknown(true);
    } finally { setBusy(false); }
  }
  return <details className="mb-5 rounded-xl border border-slate-600 bg-[#09172b]/50"><summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-amber-100">Upload a document</summary>
    <form onSubmit={upload} className="space-y-4 border-t border-slate-700 p-4" aria-busy={busy}>
      <fieldset disabled={busy || unknown} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-200" htmlFor={id + "type"}>Document type<select className={fieldClass} id={id + "type"} name="type" required><option value="project">Project document</option><option value="w9">W-9</option><option value="insurance">Insurance certificate</option></select></label>
        <label className="text-sm text-slate-200" htmlFor={id + "project"}>Project (optional)<select className={fieldClass} id={id + "project"} name="projectId"><option value="">Not project-specific</option>{projects.map((project) => <option key={project.id} value={project.id}>{value(project.data, "name")}</option>)}</select></label>
        <label className="min-w-0 text-sm text-slate-200 sm:col-span-2" htmlFor={id + "file"}>PDF, JPEG or PNG · maximum 10 MB<input className={fieldClass + " file:mr-3 file:rounded file:border-0 file:bg-amber-200 file:px-2 file:py-1 file:text-xs file:text-[#0f2040]"} id={id + "file"} name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required /></label>
      </fieldset>
      {message && <p role={failed ? "alert" : "status"} className={"text-sm leading-relaxed " + (failed ? "text-red-100" : "text-emerald-200")}>{message}</p>}
      <button type="submit" className={buttonClass} disabled={busy || unknown}>{busy ? "Uploading…" : "Submit for review"}</button>
      <p className="text-xs leading-relaxed text-slate-300">Documents are restricted to assigned accounts. Uploading a file does not verify its accuracy, insurance coverage or tax status.</p>
    </form>
  </details>;
}

const statusField = (values: string[], current?: unknown): Field => ({ name: "status", label: "Status", type: "select", value: typeof current === "string" ? current : "", options: values.map((item) => ({ value: item, label: label(item) })) });
const projectField = (projects: Entry[]): Field => ({ name: "projectId", label: "Project", type: "select", options: projects.map((item) => ({ value: item.id, label: value(item.data, "name") })) });
const responseField: Field = { name: "response", label: "Review note", type: "textarea" };

export default function PortalClient({ initial }: { initial: DashboardData }) {
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState("executive");
  const [mobileModulesOpen,setMobileModulesOpen]=useState(false);
  const sidebarRef=useRef<HTMLElement>(null);
  const modulesToggleRef=useRef<HTMLButtonElement>(null);
  const currentModuleRef=useRef<HTMLDivElement>(null);
  const [projectId, setProjectId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [sending, setSending] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const team = data.actor.role === "admin" || data.actor.role === "staff";
  const admin = data.actor.role === "admin";
  const vendor = data.actor.role === "vendor";
  const projects = data.entries.filter((entry) => entry.kind === "project");
  const projectName = (id: string) => projects.find((project) => project.id === id)?.data.name;
  const roleName = { admin: "TAYCO administrator", staff: "TAYCO team", client: "Client workspace", vendor: "Trade partner workspace" }[data.actor.role];
  const tabs = [
    {id:"executive",label:"Executive overview",group:"Command center"},
    {id:"project",label:"Projects",group:"Command center"},
    {id:"document",label:"Documents",group:"Command center"},
    {id:"note",label:"Updates",group:"Command center"},
    ...(!vendor?[{id:"change",label:"Changes",group:"Command center"}]:[]),
    ...(team?[{id:"lead",label:"Requests",group:"Commercial"},{id:"vendor",label:"Trade partners",group:"Commercial"}]:[]),
    ...(vendor?[{id:"vendor",label:"My company",group:"Commercial"}]:[]),
    ...(team||vendor?[{id:"bid",label:"Bid leveling",group:"Commercial"}]:[]),
    ...(team||vendor?[{id:"hours",label:"Team hours",group:"Field & procurement"},{id:"purchase_order",label:"Purchase orders",group:"Field & procurement"}]:[]),
    ...(team?[{id:"compliance",label:"Tax & TERO",group:"Field & procurement"}]:[]),
    {id:"finance",label:"Financial overview",group:"Accounting & capital"},
    {id:"invoice",label:"Invoices",group:"Accounting & capital"},
    ...(!vendor?[{id:"dossier",label:"Investor & lender dossier",group:"Accounting & capital"}]:[]),
    ...(team?[{id:"takeoff",label:"Takeoff Pro bridge",group:"Connections"},{id:"activity",label:"Activity",group:"Connections"}]:[]),
  ];
  function navigate(view:string,selectedProject?:string) {
    setTab(tabs.some(item=>item.id===view)?view:"project");
    if(selectedProject!==undefined)setProjectId(selectedProject);
    else if(["lead","vendor","activity"].includes(view))setProjectId("");
    setMobileModulesOpen(false);
    window.requestAnimationFrame(()=>{
      currentModuleRef.current?.focus({preventScroll:true});
      currentModuleRef.current?.scrollIntoView({block:"start",behavior:"auto"});
    });
  }
  useEffect(()=>{
    if(!mobileModulesOpen)return;
    const key=(event:KeyboardEvent)=>{if(event.key==="Escape"){setMobileModulesOpen(false);modulesToggleRef.current?.focus();}};
    const outside=(event:PointerEvent)=>{if(event.target instanceof Node&&!sidebarRef.current?.contains(event.target))setMobileModulesOpen(false);};
    document.addEventListener("keydown",key);document.addEventListener("pointerdown",outside);
    return()=>{document.removeEventListener("keydown",key);document.removeEventListener("pointerdown",outside);};
  },[mobileModulesOpen]);
  const visible = data.entries.filter((entry) => entry.kind === tab && (!projectId || entry.projectId === projectId));
  const card = "rounded-xl border border-slate-600/70 bg-[#09172b]/70 p-4 sm:p-5";
  const assigneeField = (entry?:Entry):Field => {
    const currentId=entry?value(entry.data,"assigneeId"):"";
    const options=(data.assignees||[]).map(member=>({value:member.id,label:member.email}));
    if(currentId&&!options.some(option=>option.value===currentId))options.unshift({value:currentId,label:(entry?value(entry.data,"assigneeEmail"):"Former team member")+" (unavailable — reassign)"});
    return {name:"assigneeId",label:"Responsible team member",type:"select",required:false,placeholder:"Unassigned",value:currentId,options};
  };

  async function refresh() {
    if (refreshing) return;
    setRefreshing(true); setError("");
    try {
      const response = await fetch("/api/erp-suite", { cache: "no-store" });
      const next = await response.json();
      if (!response.ok || next.success !== true) throw new RequestError(next.error || "Unable to refresh your workspace.", response.status);
      setData(next);
      setExpired(false);
    } catch (failure) {
      if (failure instanceof RequestError && failure.status === 401) setExpired(true);
      setError(failure instanceof RequestError ? failure.message : "Unable to refresh your workspace. Your previous information remains visible.");
      throw failure;
    } finally { setRefreshing(false); }
  }
  async function deliverNotifications() {
    if (sending) return;
    setSending(true); setDeliveryMessage("");
    try {
      const response = await fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new RequestError(result.error || "Delivery is unavailable. Saved requests remain in the workspace.", response.status);
      setDeliveryMessage("Notification processing completed. Review delivery status below; saved requests remain available.");
      try { await refresh(); } catch { /* Delivery and refresh are separate outcomes. */ }
    } catch (failure) { setDeliveryMessage(failure instanceof RequestError ? failure.message : "Delivery could not be confirmed. Saved requests remain available."); }
    finally { setSending(false); }
  }
  const command: Command = async (body, key) => {
    let response: Response;
    try {
      response = await fetch("/api/erp-suite", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": key }, body: JSON.stringify(body) });
    } catch { throw new RequestError("The save could not be confirmed. Retry this same request before entering another."); }
    let result;
    try { result = await response.json(); } catch { throw new RequestError("The save could not be confirmed. Retry this same request."); }
    if (!response.ok || result.success !== true) {
      if (response.status === 401) setExpired(true);
      if (response.status === 409) { try { await refresh(); } catch { /* Keep form error visible as well. */ } }
      throw new RequestError(result.error || "The request could not be saved.", response.status);
    }
    setData(result); setError("");
  };
  function recordTitle(entry: Entry) {
    return value(entry.data, "name") || value(entry.data, "title") || value(entry.data, "company") || value(entry.data, "companyName") || value(entry.data, "reference") || (entry.kind === "hours" ? value(entry.data, "trade") : "Record");
  }
  function metadata(entry: Entry) {
    const name = projectName(entry.projectId);
    return <p className="mt-2 text-xs leading-relaxed text-slate-400">{typeof name === "string" ? name + " · " : ""}Updated {date(entry.updatedAt)}{value(entry.data, "source") ? " · " + label(entry.data.source) : ""}</p>;
  }
  function controls(entry: Entry) {
    const fixed = { id: entry.id, version: entry.version };
    if (entry.kind === "project") return <>
      {team && <CommandForm title="Update project" action="update_project" command={command} fixed={fixed} fields={[statusField(["planning", "active", "blocked", "handover", "closed"], entry.data.status), { name: "progress", label: "Progress (%)", type: "number", value: Number(entry.data.progress || 0), min: 0, max: 100, step: 1 }, { name: "nextAction", label: "Next action", type: "textarea", value: value(entry.data, "nextAction") }]} />}
      <CommandForm title="Post a project update" action="add_note" fixed={{ projectId: entry.id }} command={command} fields={[{ name: "title", label: "Update title" }, { name: "details", label: "What changed?", type: "textarea" }, ...(team ? [{ name: "visibility", label: "Share with", type: "select" as const, value: "internal", options: [{ value: "internal", label: "TAYCO team only" }, { value: "client", label: "Assigned client" }] }] : [])]} />
      {!vendor && <CommandForm title="Request a scope change" action="request_change" fixed={{ projectId: entry.id }} command={command} fields={[{ name: "title", label: "Change title" }, { name: "details", label: "Describe the requested change", type: "textarea" }]} />}
    </>;
    if (entry.kind === "lead" && team) return <CommandForm title="Review request" action="update_lead" command={command} fixed={fixed} fields={[assigneeField(entry),statusField(["new", "reviewing", "waiting", "quoted", "accepted", "closed"], entry.data.status), { name: "nextAction", label: "Next action", type: "textarea", required: false, value: value(entry.data, "nextAction") }]} />;
    if (entry.kind === "hours" && team) return <CommandForm title="Review time submission" action="review_hours" command={command} fixed={fixed} fields={[statusField(["approved", "returned"]), { ...responseField, required: false }]} />;
    if (entry.kind === "invoice") return <>{admin&&<CommandForm title="Record invoice decision" action="update_invoice" command={command} fixed={fixed} fields={[statusField(["approved", "returned"])]} />}<InvoicePaymentControls entry={entry} admin={admin} renderForm={renderOperationsForm}/></>;
    if (entry.kind === "document" && team) return <CommandForm title="Review document" action="review_document" command={command} fixed={fixed} fields={[statusField(["approved", "rejected"]), responseField, { name: "expiresAt", label: "Expiry date (if applicable)", type: "date", required: false }, ...(entry.data.type === "project" && entry.projectId ? [{ name: "visibility", label: "Visible to", type: "select" as const, value: value(entry.data, "visibility") || "owner", options: [{ value: "owner", label: "Uploader and TAYCO team" }, { value: "client", label: "Assigned client" }] }] : [])]} />;
    if (entry.kind === "change") return <>
      {team && <CommandForm title="Review scope change" action="review_change" command={command} fixed={fixed} fields={[statusField(["reviewing", "proposed", "declined"]), { ...responseField, required: false }]} />}
      {data.actor.role === "client" && entry.data.status === "proposed" && <CommandForm title="Record your decision" action="decide_change" command={command} fixed={fixed} fields={[statusField(["accepted", "declined"])]} />}
    </>;
    return null;
  }
  function detail(entry: Entry) {
    const d = entry.data;
    const keys = entry.kind === "project" ? ["location", "clientName", "nextAction"] : entry.kind === "vendor" ? ["contact", "contactName", "email", "phone", "trade", "trades", "states", "experience", "yearsInBusiness"] : ["email", "details", "nextAction", "response", "type", "expiresAt", "date", "trade", "dueDate"];
    return <div className="mt-4 space-y-3 text-sm leading-relaxed">
      {entry.kind === "project" && <div><div className="mb-2 flex justify-between text-xs text-slate-300"><span>Reported progress</span><span>{Number(d.progress || 0)}%</span></div><progress className="h-2 w-full accent-amber-300" max={100} value={Number(d.progress || 0)} aria-label="Reported project progress" /></div>}
      {keys.map((key) => {
        const raw = d[key];
        const text = Array.isArray(raw) ? raw.filter((item) => typeof item === "string").join(", ") : value(d, key);
        if (!text) return null;
        const title = ({ nextAction: "Next action", clientName: "Client", contactName: "Contact", yearsInBusiness: "Years in business", expiresAt: "Expiry date", dueDate: "Due date" } as Record<string, string>)[key] || key;
        return <div key={key}><p className="text-xs capitalize text-slate-400">{title}</p><p className="whitespace-pre-wrap break-words text-slate-100">{text}</p></div>;
      })}
      {entry.kind === "lead" && team && <p><span className="text-slate-400">Responsible: </span>{value(d,"assigneeEmail")||"Unassigned — needs a team member"}{value(d,"assignedAt")&&<span className="mt-1 block text-xs text-slate-400">Assigned {timestamp(value(d,"assignedAt"))}</span>}</p>}
      {entry.kind === "project" && <ProjectOverview entry={entry} team={team} vendor={vendor} documents={data.entries.filter(document=>document.kind==="document"&&document.projectId===entry.id&&document.data.type==="project")} renderForm={(props)=><CommandForm key={props.action+String(props.fixed?.milestoneId||props.fixed?.contactId||"")} {...props} command={command}/>} />}
      {entry.kind === "project" && !vendor && <p><span className="text-slate-400">{value(d,"budgetSource")&&value(d,"budgetApprovedOn")?"Approved budget: ":"Budget on record: "}</span>{money(d.budgetUsd)}</p>}
      {entry.kind === "invoice" && <p className="text-xl font-bold text-white">{money(d.amountUsd)}</p>}
      {entry.kind === "hours" && <p className="text-lg font-bold text-white">{value(d, "hours")} hours</p>}
      {entry.kind === "document" && <a className={secondaryClass} href={"/api/documents/" + encodeURIComponent(entry.id)}>Download document</a>}
    </div>;
  }

  const renderOperationsForm=(props:import("@/components/workspace/ProjectOverview").WorkspaceForm)=><CommandForm key={props.action+String(props.fixed?.id||"")} {...props} command={command}/>;
  const moduleId:Record<string,string>={executive:"executive",lead:"crm",bid:"bids",hours:"payroll",finance:"accounting",purchase_order:"purchase-orders",compliance:"compliance",dossier:"dossier",takeoff:"takeoff"};
  return <main className="min-h-screen bg-[#070e1a] pt-16 text-slate-100">
    <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[270px_minmax(0,1fr)]">
      <aside ref={sidebarRef} id="tayco-command-sidebar" className="min-w-0 border-b border-amber-200/20 bg-gradient-to-b from-[#112748] to-[#09172b] p-4 sm:p-5 lg:sticky lg:top-16 lg:max-h-[calc(100dvh-4rem)] lg:overflow-y-auto lg:self-start lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-200 to-[#c9a84c] text-sm font-black text-[#0f2040]">TC</span><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-amber-100">Executive command</p><p className="mt-1 text-[11px] text-slate-400">{roleName}</p></div></div>
          <button ref={modulesToggleRef} type="button" className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-amber-200/40 px-3 text-xs font-semibold text-amber-100 lg:hidden" aria-expanded={mobileModulesOpen} aria-controls="tayco-portal-module-tabs" onClick={()=>setMobileModulesOpen(!mobileModulesOpen)}>{mobileModulesOpen?"Close modules":"Open modules"}</button>
        </div>
        <nav id="tayco-portal-module-tabs" aria-label="Command Center Navigation" className={(mobileModulesOpen?"block":"hidden")+" mt-6 space-y-5 lg:block"}>
          {[...new Set(tabs.map(item=>item.group))].map(group=><div key={group}><p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">{group}</p><div className="space-y-1">{tabs.filter(item=>item.group===group).map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)} aria-current={tab===item.id?"page":undefined} className={"flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-amber-200 "+(tab===item.id?"border-amber-200/55 bg-gradient-to-r from-amber-200/20 to-amber-200/5 text-amber-100":"border-transparent text-slate-300 hover:border-amber-200/20 hover:bg-white/5")}><span className="min-w-0">{item.label}</span>{["project","document","lead","hours","invoice","bid","purchase_order","compliance"].includes(item.id)&&<span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-amber-100">{data.entries.filter(entry=>String(entry.kind)===item.id).length}</span>}</button>)}</div></div>)}
          {admin&&<div className="border-t border-amber-200/20 pt-4"><Link data-testid="module-access" href="/account" className="flex min-h-11 items-center rounded-xl border border-amber-200/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-200/10">B2B access &amp; invitations ↗</Link></div>}
        </nav>
        {team&&<div className="mt-5 hidden rounded-xl border border-amber-200/25 bg-[#102541] p-4 lg:block"><p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200">Estimating bridge</p><p className="mt-2 text-sm font-semibold text-white">{data.integrations.takeoff==="not_configured"?"Not connected":label(data.integrations.takeoff)}</p><p className="mt-2 text-xs leading-relaxed text-slate-400">Project source records remain available.</p><button className="mt-3 min-h-11 text-xs font-semibold text-[#fb923c] underline underline-offset-4" onClick={()=>navigate("takeoff")}>Open bridge context ↗</button></div>}
      </aside>
      <div className="min-w-0 px-4 pb-16 pt-7 sm:px-6 lg:px-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{roleName}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">Your projects. <em className="font-serif font-normal text-amber-200">Connected.</em></h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{team ? "Manage project progress, incoming requests and reviews from one workspace." : "Follow assigned projects, review updates and keep your next steps in view."}</p>
          <p className="mt-2 break-all text-xs text-slate-400">Signed in as {data.actor.email} · {team ? "Company workspace" : "Only records assigned or shared with your account"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={secondaryClass} type="button" onClick={() => void refresh().catch(() => {})} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh"}</button>
          <Link className={buttonClass} href="/account">Account &amp; access</Link>
        </div>
      </div>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/40 bg-red-950/40 p-4 text-sm text-red-100">{error} {expired && <Link className="underline" href="/login?next=/portal">Sign in again</Link>}<p className="mt-1 text-xs">Previously loaded information remains visible and may be out of date.</p></div>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {!["lead","vendor","activity"].includes(tab)?<label className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-300" htmlFor="portal-project-filter">Project<select id="portal-project-filter" className="min-h-11 max-w-full rounded-lg border border-slate-600 bg-[#0f2040] px-3 text-sm text-white" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">All assigned projects</option>{projects.map((entry) => <option key={entry.id} value={entry.id}>{value(entry.data, "name")}</option>)}</select></label>:<p className="text-xs text-slate-400">{team?"Company workspace":"Your linked company"} · no project filter</p>}
        <p role="status" className="text-xs text-slate-400">Last refreshed {timestamp(data.updatedAt)}</p>
      </div>
      <div ref={currentModuleRef} tabIndex={-1} role="region" aria-label={tabs.find(item=>item.id===tab)?.label||"Workspace module"} className="mt-5 min-w-0 outline-none" aria-busy={refreshing} data-testid={"module-"+(moduleId[tab]||tab)}>
        <Panel title={tabs.find((item) => item.id === tab)?.label || "Workspace"} subtitle={tab === "document" ? "Receipt and approval are separate steps. Review the status and any requested corrections." : tab === "invoice" ? "Track submitted invoices and recorded decisions. A paid status is a team record, not a payment transfer." : tab === "hours" ? "Record work performed and follow its review. This workspace does not calculate wages or submit payroll." : tab === "project" ? "A shared view of progress, upcoming actions and project conversations." : undefined}>
          {tab==="hours"&&<OperationsModules view="hours" entries={data.entries} projectId={projectId} asOf={data.updatedAt} team={team} vendor={vendor} integrations={data.integrations} renderForm={renderOperationsForm} onNavigate={navigate}/>}
          {tab === "project" && team && <CommandForm title="Add a project" action="create_project" command={command} fields={[{ name: "name", label: "Project name" }, { name: "location", label: "Location", required: false }, { name: "clientName", label: "Client name", required: false }, { name: "budgetUsd", label: "Approved budget (USD, optional)", type: "number", required: false, min: 0, max: 1e10, step: 0.01 }, { name: "nextAction", label: "Next action", value: "Confirm scope and schedule", type: "textarea" }]} />}
          {tab === "lead" && team && <CommandForm title="Add a request" action="create_lead" command={command} fields={[assigneeField(),{ name: "name", label: "Contact name" }, { name: "email", label: "Email address", type: "email" }, { name: "details", label: "Project details", type: "textarea" }]} />}
          {tab === "hours" && !(!team && !vendor) && projects.length > 0 && <CommandForm title="Submit work hours" action="log_hours" command={command} fields={[projectField(projects), { name: "date", label: "Work date", type: "date" }, { name: "hours", label: "Hours", type: "number", min: 0.1, max: 24, step: 0.1 }, { name: "trade", label: "Work performed" }]} />}
          {tab === "invoice" && (team || vendor) && projects.length > 0 && <CommandForm title="Record an invoice" action="record_invoice" command={command} fields={[projectField(projects), { name: "reference", label: "Invoice reference" }, { name: "amountUsd", label: "Amount (USD)", type: "number", min: 0, max: 1e10, step: 0.01 }, {name:"issuedOn",label:"Invoice issue date",type:"date",value:new Date().toISOString().slice(0,10)},{name:"source",label:"Invoice source",value:"Team record"},{ name: "dueDate", label: "Due date", type: "date", required: false }, ...(team ? [{ name: "audience", label: "Visible to", type: "select" as const, value: "client", options: [{ value: "client", label: "Assigned client" }, { value: "internal", label: "TAYCO team only" }] }] : [])]} />}
          {tab === "document" && (team || vendor) && <DocumentUpload projects={projects} refresh={refresh} />}
          {tab === "document" && <details className="mb-5 rounded-xl border border-slate-600 bg-[#09172b]/40"><summary className="flex min-h-11 cursor-pointer items-center px-4 py-3 text-sm font-semibold text-amber-100">Document preservation and renewals</summary><div className="p-3"><DocumentMaintenance projectId={projectId||undefined} refreshKey={data.updatedAt} onChanged={()=>void refresh().catch(()=>{})} /></div></details>}
          {tab==="executive"?<ExecutiveConsole data={data} projectId={projectId} onNavigate={navigate}/>:["bid","purchase_order","compliance","dossier","takeoff"].includes(tab)?<OperationsModules view={tab} entries={data.entries} projectId={projectId} asOf={data.updatedAt} team={team} vendor={vendor} integrations={data.integrations} renderForm={renderOperationsForm} onNavigate={navigate}/>:tab === "finance" ? <FinanceOverview entries={data.entries} projectId={projectId} asOf={data.updatedAt} internal={team} vendor={vendor} onOpenInvoices={()=>setTab("invoice")}/> : tab === "activity" ? <div className="space-y-3">
            <div className={card}><h3 className="font-semibold text-amber-100">Request notifications</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">Request records are saved independently of email delivery. Acceptance by the email provider does not guarantee delivery to the recipient’s inbox.</p>
              <div className="mt-3 flex flex-wrap gap-2">{data.delivery.length ? data.delivery.map((item, index) => <Status key={index}>{item.status==="delivered"?"Accepted by email provider":label(item.status)}: {value(item, "count")}</Status>) : <p className="text-sm text-slate-400">No queued notifications.</p>}</div>
              {admin && <button type="button" className={secondaryClass + " mt-4"} disabled={sending} onClick={() => void deliverNotifications()}>{sending ? "Processing…" : "Send queued notifications"}</button>}
              {deliveryMessage && <p role="status" className="mt-3 text-sm text-amber-100">{deliveryMessage}</p>}
            </div>
            {data.audit.length === 0 ? <Empty>No workspace activity has been recorded yet.</Empty> : data.audit.map((event, index) => <div key={index} className={card}><p className="text-sm font-semibold capitalize">{label(event.action)}</p><p className="mt-1 text-xs text-slate-400">{timestamp(value(event, "created_at"))}</p><p className="mt-1 break-all text-xs text-slate-400">Reference: {value(event, "resource_id")}</p></div>)}</div> :
            visible.length === 0 ? <div className="mt-4"><Empty>{tab === "project" && !team ? "No projects have been assigned to your account yet. Contact your TAYCO coordinator to confirm access." : "No records to show in this section" + (projectId ? " for the selected project." : " yet.")}</Empty></div> :
              <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">{visible.map((entry) => <article key={entry.id} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="min-w-0 break-words text-lg font-semibold text-white">{recordTitle(entry)}</h3><Status>{label(entry.data.status) || "Recorded"}</Status></div>
                {metadata(entry)}<p className="mt-1 break-all text-[11px] text-slate-400">Reference: {entry.id}</p>{detail(entry)}{controls(entry)}
              </article>)}</div>}
        </Panel>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-[#0f2040]/50 p-5"><h2 className="font-semibold text-amber-100">Need help with your project?</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Contact your TAYCO coordinator for assignments, documents or changes that need attention.</p><a className="mt-3 inline-flex min-h-11 items-center break-all text-sm font-semibold text-amber-200 underline underline-offset-4" href={COMPANY.emailHref}>{COMPANY.email}</a></div>
        {team && <div className="rounded-xl border border-slate-700 bg-[#0f2040]/50 p-5"><h2 className="font-semibold text-amber-100">Connected services</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Estimating: {data.integrations.takeoff === "not_configured" ? "Not connected" : label(data.integrations.takeoff)} · Accounting: {data.integrations.accounting === "not_configured" ? "Not connected" : label(data.integrations.accounting)}</p><p className="mt-2 text-xs text-slate-400">No financial or estimating system is shown as live until its connection has been verified.</p></div>}
      </div>
      </div>
    </div>
  </main>;
}
