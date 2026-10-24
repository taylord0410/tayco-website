"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type FormEvent, type ReactNode, type CSSProperties } from "react";
import Link from "next/link";
import type { Entry, Data } from "@/lib/erp";
import type { AuthRole } from "@/lib/auth";
import { COMPANY } from "@/lib/company";
import { isValidUsdAmount } from "@/lib/financial-values";
import ProjectOverview, { type WorkspaceField } from "@/components/workspace/ProjectOverview";
import ProjectClassification, { ProjectClassificationFilters, matchesProjectClassification, projectClassificationFields } from "@/components/workspace/ProjectClassification";
import FinanceOverview from "@/components/workspace/FinanceOverview";
import FinancialDashboard from "@/components/workspace/FinancialDashboard";
import ManagementEstimatesPanel from "@/components/workspace/ManagementEstimatesPanel";
import HoursReport from "@/components/workspace/HoursReport";
import CommercialRequests from "@/components/workspace/CommercialRequests";
import CorporateAgenda from "@/components/workspace/CorporateAgenda";
import Image from "next/image";
import DocumentMaintenance from "@/components/DocumentMaintenance";
import ExecutiveConsole from "@/components/workspace/ExecutiveConsole";
import OperationsModules from "@/components/workspace/OperationsModules";
import PortalShell from "@/components/workspace/PortalShell";
import { workspaceNavigation } from "@/lib/workspace-navigation";
import EstimateArchive from "@/components/workspace/EstimateArchive";
import WorkspaceDisplayControls, { useWorkspaceDisplay } from "@/components/workspace/WorkspaceDisplayControls";
import { groupProjectEstimates } from "@/lib/project-estimates";

import CommercialProgressPanel from "@/components/workspace/CommercialProgressPanel";
import type { CommercialStageInput } from "@/lib/commercial-stages";
import MeasurementReview from "@/components/workspace/MeasurementReview";
import GuestActivityPanel from "@/components/GuestActivityPanel";
import ReviewAuditPanel from "@/components/ReviewAuditPanel";
import InvoicePaymentControls from "@/components/workspace/InvoicePaymentControls";
import { CORPORATE_11_MODULES } from "@/lib/verified-bidding-opportunities";

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
type Command = (data: Data, key: string) => Promise<number>;
type CommandOutcome = { key: string; version?: number; error?: string };
type PendingCommand = { key: string; body: Data; actorId: string; phase: "busy" | "uncertain"; error?: string; flight?: Promise<number> };
type PendingCommandView = Pick<PendingCommand, "key" | "phase" | "error"> & { action: string };
type OutcomeListener = (outcome: CommandOutcome) => void;
const CommandRecovery = createContext<{ lockedKey: string | null; subscribe: (listener: OutcomeListener) => () => void }>({ lockedKey: null, subscribe: () => () => {} });
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

function CommercialRecordControl({entry,command,pending}:{entry:Entry;command:Command;pending:boolean}) {
  const retained=useRef<{fingerprint:string;key:string;body:Data}|null>(null);
  const recovery=useContext(CommandRecovery);
  const [ownKey,setOwnKey]=useState<string|null>(null);
  const subscribeOutcome=recovery.subscribe;
  const subscribeRecovery=useCallback((listener:(outcome:{version?:number;error?:string})=>void)=>subscribeOutcome(outcome=>{
    if(retained.current?.key!==outcome.key)return;
    retained.current=null;setOwnKey(null);listener(outcome);
  }),[subscribeOutcome]);
  async function record(input:CommercialStageInput) {
    const fingerprint=JSON.stringify(input);
    if(!retained.current||retained.current.fingerprint!==fingerprint)retained.current={fingerprint,key:crypto.randomUUID(),body:{action:"record_commercial_stage",id:entry.id,version:entry.version,...input}};
    const request=retained.current;setOwnKey(request.key);
    try {await command(request.body,request.key);retained.current=null;setOwnKey(null);}
    catch(error) {if(error instanceof RequestError&&error.status>=400&&error.status<500&&![408,423,429].includes(error.status)){retained.current=null;setOwnKey(null);}throw error;}
  }
  return <CommercialProgressPanel project={entry} pending={pending&&recovery.lockedKey!==ownKey} onRecord={record} subscribeRecovery={subscribeRecovery}/>;
}

function Panel({ title, subtitle, children, featured=false }: { title: string; subtitle?: string; children: ReactNode; featured?:boolean }) {
  return <section className={"workspace-panel rounded-2xl border border-amber-200/20 bg-[#0f2040] p-5 shadow-xl sm:p-7 "+(featured?"workspace-panel-canvas":"")}><h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>{subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-300">{subtitle}</p>}<div className="mt-5">{children}</div></section>;
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
  const recovery = useContext(CommandRecovery);
  const subscribeOutcome = recovery.subscribe;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [baseVersion, setBaseVersion] = useState<unknown>(()=>fixed.version);
  const [dirty,setDirty]=useState(false);
  const activeVersion=dirty?baseVersion:fixed.version;
  const stale=dirty&&Number.isInteger(baseVersion)&&Number.isInteger(fixed.version)&&baseVersion!==fixed.version;
  const formRef=useRef<HTMLFormElement>(null);
  const pending = useRef<{ key: string; body: Data } | null>(null);

  useEffect(()=>{
    const form=formRef.current;if(!form||dirty||busy||uncertain)return;
    for(const field of fields){const control=form.elements.namedItem(field.name);if(control instanceof HTMLInputElement||control instanceof HTMLSelectElement||control instanceof HTMLTextAreaElement)control.value=String(field.value??"");}
  },[fields,dirty,busy,uncertain]);

  function loadCurrent(form:HTMLFormElement) {
    if(busy||uncertain)return;
    for(const field of fields){const control=form.elements.namedItem(field.name);if(control instanceof HTMLInputElement||control instanceof HTMLSelectElement||control instanceof HTMLTextAreaElement)control.value=String(field.value??"");}
    setBaseVersion(fixed.version);setDirty(false);pending.current=null;setError("");setSuccess("Current values loaded. Review them before saving.");
  }

  useEffect(() => subscribeOutcome(outcome => {
    if (pending.current?.key !== outcome.key) return;
    pending.current = null; setUncertain(false);
    if (outcome.version !== undefined) {
      setBaseVersion(outcome.version); setDirty(false); setError("");
      setSuccess("Saved. The request was confirmed.");
      if (action.startsWith("create_") || ["add_note", "log_hours", "record_invoice", "request_change", "add_milestone", "record_invoice_payment", "record_project_forecast", "add_project_team_member"].includes(action) || (action === "save_project_contact" && !fixed.contactId)) formRef.current?.reset();
    } else setError(outcome.error || "The request was not saved. Review your entries.");
  }), [subscribeOutcome, action, fixed.contactId]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (busy || (stale&&!uncertain) || (recovery.lockedKey && recovery.lockedKey !== pending.current?.key)) return;
    if (!uncertain) {
      const submitted = new FormData(form);
      const body: Data = { action, ...fixed };
      if(Number.isInteger(activeVersion))body.version=activeVersion;
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
      const savedVersion=await command(pending.current.body, pending.current.key);
      if(Number.isInteger(baseVersion))setBaseVersion(savedVersion);
      setDirty(false);
      pending.current = null;
      setUncertain(false);
      setSuccess("Saved. The latest information is shown above.");
      if (action.startsWith("create_") || ["add_note", "log_hours", "record_invoice", "request_change", "add_milestone", "record_invoice_payment", "record_project_forecast", "add_project_team_member"].includes(action) || (action === "save_project_contact" && !fixed.contactId)) form.reset();
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
    <form ref={formRef} onSubmit={send} onInput={()=>{if(!dirty){setBaseVersion(fixed.version);setDirty(true);}}} onChange={()=>{if(!dirty){setBaseVersion(fixed.version);setDirty(true);}}} className="space-y-4 border-t border-slate-700 p-4" aria-busy={busy}>
      <fieldset disabled={busy || uncertain} className="grid min-w-0 gap-4 sm:grid-cols-2">
        {fields.map((field) => <label key={field.name} htmlFor={id + field.name} className={"min-w-0 text-sm font-medium text-slate-200 " + (field.type === "textarea" ? "sm:col-span-2" : "")}>
          {field.label}{field.required !== false && <span className="text-amber-200" aria-hidden="true"> *</span>}
          {field.type === "select" ?
            <select id={id + field.name} name={field.name} required={field.required !== false} defaultValue={field.value ?? ""} className={fieldClass}><option value="">{field.placeholder || (field.required === false ? "Not assigned" : "Choose an option")}</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> :
            field.type === "textarea" ? <textarea id={id + field.name} name={field.name} required={field.required !== false} defaultValue={field.value ?? ""} placeholder={field.placeholder} maxLength={4000} rows={4} className={fieldClass} /> :
              <input id={id + field.name} name={field.name} type={field.type ?? "text"} required={field.required !== false} defaultValue={field.value ?? ""} placeholder={field.placeholder} min={field.min} max={field.max} step={field.step} maxLength={field.type === "email" ? 254 : 500} className={fieldClass} />}
        </label>)}
      </fieldset>
      {error && <p role="alert" className="rounded-lg border border-red-300/30 bg-red-950/30 p-3 text-sm leading-relaxed text-red-100">{error}</p>}
      {stale&&!uncertain&&<div role="alert" data-testid="record-version-conflict" className="rounded-lg border border-amber-200/50 bg-amber-200/5 p-3 text-sm text-amber-100"><p>This record changed. Your draft is preserved. Load current values before saving.</p><button type="button" className={secondaryClass+" mt-3"} disabled={busy} onClick={event=>{const form=event.currentTarget.form;if(form)loadCurrent(form);}}>Discard draft and load current values</button></div>}
      {success && <p role="status" className="text-sm text-emerald-200">{success}</p>}
      {uncertain && <p className="text-xs leading-relaxed text-slate-300">Your inputs are held so retrying uses the same request reference and does not create a second record.</p>}
      <button className={buttonClass} disabled={busy||(stale&&!uncertain)||Boolean(recovery.lockedKey&&!uncertain)} type="submit">{busy ? "Saving…" : uncertain ? "Retry this request" : submit}</button>
    </form>
  </details>;
}

function DocumentUpload({ projects, refresh }: { projects: Entry[]; refresh: () => Promise<void> }) {
  const id = useId();
  const recovery = useContext(CommandRecovery);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [unknown, setUnknown] = useState(false);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || unknown || recovery.lockedKey) return;
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
      <fieldset disabled={busy || unknown || Boolean(recovery.lockedKey)} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="text-sm text-slate-200" htmlFor={id + "type"}>Document type<select className={fieldClass} id={id + "type"} name="type" required><option value="project">Project document</option><option value="w9">W-9</option><option value="insurance">Insurance certificate</option></select></label>
        <label className="text-sm text-slate-200" htmlFor={id + "project"}>Project (optional)<select className={fieldClass} id={id + "project"} name="projectId"><option value="">Not project-specific</option>{projects.map((project) => <option key={project.id} value={project.id}>{value(project.data, "name")}</option>)}</select></label>
        <label className="min-w-0 text-sm text-slate-200 sm:col-span-2" htmlFor={id + "file"}>PDF, JPEG or PNG · maximum 10 MB<input className={fieldClass + " file:mr-3 file:rounded file:border-0 file:bg-amber-200 file:px-2 file:py-1 file:text-xs file:text-[#0f2040]"} id={id + "file"} name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" required /></label>
      </fieldset>
      {message && <p role={failed ? "alert" : "status"} className={"text-sm leading-relaxed " + (failed ? "text-red-100" : "text-emerald-200")}>{message}</p>}
      <button type="submit" className={buttonClass} disabled={busy || unknown || Boolean(recovery.lockedKey)}>{busy ? "Uploading…" : "Submit for review"}</button>
      <p className="text-xs leading-relaxed text-slate-300">Documents are restricted to assigned accounts. Uploading a file does not verify its accuracy, insurance coverage or tax status.</p>
    </form>
  </details>;
}

const statusField = (values: string[], current?: unknown): Field => ({ name: "status", label: "Status", type: "select", value: typeof current === "string" ? current : "", options: values.map((item) => ({ value: item, label: label(item) })) });
const projectField = (projects: Entry[]): Field => ({ name: "projectId", label: "Project", type: "select", options: projects.map((item) => ({ value: item.id, label: value(item.data, "name") })) });
const responseField: Field = { name: "response", label: "Review note", type: "textarea" };

export default function PortalClient({ initial }: { initial: DashboardData }) {
  const [data, setData] = useState(initial);
  // Private intents belong to this mounted authenticated workspace, never browser storage.
  const actorId = useRef(initial.actor.id);
  const pendingCommand = useRef<PendingCommand | null>(null);
  const [pendingView, setPendingView] = useState<PendingCommandView | null>(null);
  const outcomeListeners = useRef(new Set<OutcomeListener>());
  const subscribeOutcome = useCallback((listener: OutcomeListener) => {
    outcomeListeners.current.add(listener);
    return () => { outcomeListeners.current.delete(listener); };
  }, []);
  function notifyOutcome(outcome: CommandOutcome) { for (const listener of outcomeListeners.current) listener(outcome); }
  const snapshotGeneration = useRef(0);
  const refreshSequence = useRef(0);
  const [display,setDisplay]=useWorkspaceDisplay();
  const [tab, setTab] = useState("executive");
  const [mobileModulesOpen,setMobileModulesOpen]=useState(false);
  const sidebarRef=useRef<HTMLElement>(null);
  const modulesToggleRef=useRef<HTMLButtonElement>(null);
  const currentModuleRef=useRef<HTMLDivElement>(null);
  const [projectId, setProjectId] = useState("");
  const [projectClassificationFilter, setProjectClassificationFilter] = useState({ contractType: "all", laborRegime: "all" });
  const [refreshing, setRefreshing] = useState(false);
  const [financePeriod, setFinancePeriod] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [sending, setSending] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const team = data.actor.role === "admin" || data.actor.role === "staff";
  const admin = data.actor.role === "admin";
  const vendor = data.actor.role === "vendor";
  const estimateReport=groupProjectEstimates(data.entries.filter(entry=>entry.kind==="estimate").map(entry=>entry.data),projectId||undefined);
  const projects = data.entries.filter((entry) => entry.kind === "project");
  const projectName = (id: string) => projects.find((project) => project.id === id)?.data.name;
  const roleName = { admin: "TAYCO administrator", staff: "TAYCO team", client: "Client workspace", vendor: "Trade partner workspace", guest: "Monthly review" }[data.actor.role];
  const tabs = workspaceNavigation(data.actor.role).filter(item => item.id !== "purchase_order");
  function navigate(view:string,selectedProject?:string,reportingMonth?:string) {
    if(["finance","financial_dashboard","corporate_meetings","followups"].includes(view))setFinancePeriod(reportingMonth&&/^\d{4}-(0[1-9]|1[0-2])$/.test(reportingMonth)?reportingMonth:null);
    if(view === "project" && selectedProject !== undefined)setProjectClassificationFilter({ contractType: "all", laborRegime: "all" });
    setTab(tabs.some(item=>item.id===view)?view:"project");
    if(selectedProject!==undefined)setProjectId(selectedProject);
    else if(["lead","vendor","activity","corporate_meetings","followups"].includes(view))setProjectId("");
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
  const scopedRecords = data.entries.filter((entry) => entry.kind === tab && (!projectId || entry.projectId === projectId));
  const visible = tab === "project" ? scopedRecords.filter(entry => matchesProjectClassification(entry, projectClassificationFilter)) : scopedRecords;
  const card = "rounded-xl border border-slate-600/70 bg-[#09172b]/70 p-4 sm:p-5";
  const assigneeField = (entry?:Entry):Field => {
    const currentId=entry?value(entry.data,"assigneeId"):"";
    const options=(data.assignees||[]).map(member=>({value:member.id,label:member.email}));
    if(currentId&&!options.some(option=>option.value===currentId))options.unshift({value:currentId,label:(entry?value(entry.data,"assigneeEmail"):"Former team member")+" (unavailable — reassign)"});
    return {name:"assigneeId",label:"Responsible team member",type:"select",required:false,placeholder:"Unassigned",value:currentId,options};
  };

  async function refresh() {
    const sequence = ++refreshSequence.current, generation = snapshotGeneration.current;
    setRefreshing(true); setError("");
    try {
      const response = await fetch("/api/erp-suite", { cache: "no-store" });
      const next = await response.json();
      if (!response.ok || next.success !== true) throw new RequestError(next.error || "Unable to refresh your workspace.", response.status);
      if (next.actor?.id !== actorId.current) { setExpired(true); throw new RequestError("This workspace belongs to another signed-in account. Reopen the original account before retrying.", 401); }
      if (sequence === refreshSequence.current && generation === snapshotGeneration.current) {
        setData(next); setExpired(false);
      }
    } catch (failure) {
      if (failure instanceof RequestError && failure.status === 401) setExpired(true);
      setError(failure instanceof RequestError ? failure.message : "Unable to refresh your workspace. Your previous information remains visible.");
      throw failure;
    } finally { if (sequence === refreshSequence.current) setRefreshing(false); }
  }
  async function deliverNotifications() {
    if (sending || pendingCommand.current) return;
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
  const command: Command = (body, key) => {
    const existing = pendingCommand.current;
    if (existing && existing.key !== key) return Promise.reject(new RequestError("Confirm the pending request before saving another record.", 423));
    if (existing?.flight) return existing.flight;
    const request: PendingCommand = existing || { key, body: structuredClone(body), actorId: actorId.current, phase: "busy" };
    request.phase = "busy"; request.error = undefined;
    pendingCommand.current = request;
    setPendingView({ key: request.key, phase: "busy", action: String(request.body.action || "Save record") });
    ++snapshotGeneration.current;
    const run = async () => {
      try {
        // Recheck the signed-in actor before replaying a retained private intent.
        if (existing) {
          try { await refresh(); } catch { throw new RequestError("Sign in to the original workspace and retry this retained request. Its outcome is still unconfirmed."); }
        }
        if (request.actorId !== actorId.current) throw new RequestError("The retained request belongs to another workspace.");
        let response: Response;
        try {
          response = await fetch("/api/erp-suite", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": request.key }, body: JSON.stringify(request.body) });
        } catch { throw new RequestError("The save could not be confirmed. Retry this same request before entering another."); }
        let result;
        try { result = await response.json(); } catch { throw new RequestError("The save could not be confirmed. Retry this same request."); }
        if (!response.ok || result.success !== true) {
          if (response.status === 401) setExpired(true);
          if (response.status === 409) { try { await refresh(); } catch { /* Preserve the mutation error. */ } }
          throw new RequestError(result.error || "The request could not be saved.", response.status);
        }
        if (!Number.isInteger(result.result?.version) || result.result.version < 1 || result.actor?.id !== request.actorId) throw new RequestError("The save receipt could not be confirmed. Retry this same request before entering another.", 502);
        const savedVersion = result.result.version;
        ++snapshotGeneration.current;
        setData(result); setError("");
        // Replayed receipts retain their original version; the current snapshot is a separate read.
        if (existing) { try { await refresh(); } catch { /* The write is confirmed even if the fresh read fails. */ } }
        pendingCommand.current = null; setPendingView(null);
        notifyOutcome({ key: request.key, version: savedVersion });
        return savedVersion;
      } catch (failure) {
        const issue = failure instanceof RequestError ? failure : new RequestError("The save could not be confirmed. Retry this same request.");
        if (issue.status === 0 || issue.status >= 500) {
          request.phase = "uncertain"; request.error = issue.message;
          setPendingView({ key: request.key, phase: "uncertain", error: issue.message, action: String(request.body.action || "Save record") });
        } else {
          pendingCommand.current = null; setPendingView(null);
          notifyOutcome({ key: request.key, error: issue.message });
        }
        throw issue;
      } finally { request.flight = undefined; }
    };
    request.flight = run();
    return request.flight;
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
      {team && <CommandForm title="Update project" action="update_project" command={command} fixed={fixed} fields={[statusField(["planning", "active", "blocked", "handover", "closed"], entry.data.status), { name: "progress", label: "Progress (%)", type: "number", value: typeof entry.data.progress==="number"?entry.data.progress:"", required:false, emptyValue:null, min: 0, max: 100, step: 1 }, { name: "nextAction", label: "Next action", type: "textarea", value: value(entry.data, "nextAction") }]} />}
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
      {entry.kind === "project" && (typeof d.progress==="number"?<div><div className="mb-2 flex justify-between text-xs text-slate-300"><span>Reported progress</span><span>{d.progress}%</span></div><progress className="h-2 w-full accent-amber-300" max={100} value={d.progress} aria-label="Reported project progress" /></div>:<p className="text-xs text-slate-400">Execution progress not recorded</p>)}
      {keys.map((key) => {
        const raw = d[key];
        const text = Array.isArray(raw) ? raw.filter((item) => typeof item === "string").join(", ") : value(d, key);
        if (!text) return null;
        const title = ({ nextAction: "Next action", clientName: "Client", contactName: "Contact", yearsInBusiness: "Years in business", expiresAt: "Expiry date", dueDate: "Due date" } as Record<string, string>)[key] || key;
        return <div key={key}><p className="text-xs capitalize text-slate-400">{title}</p><p className="whitespace-pre-wrap break-words text-slate-100">{text}</p></div>;
      })}
      {entry.kind === "lead" && team && <p><span className="text-slate-400">Responsible: </span>{value(d,"assigneeEmail")||"Unassigned — needs a team member"}{value(d,"assignedAt")&&<span className="mt-1 block text-xs text-slate-400">Assigned {timestamp(value(d,"assignedAt"))}</span>}</p>}
      {entry.kind === "project" && <ProjectClassification entry={entry} team={team} renderForm={renderOperationsForm} onOpenRequirements={() => navigate("compliance", entry.id)} />}
      {team && entry.kind === "project" && <CommercialRecordControl entry={entry} command={command} pending={Boolean(pendingView)}/>}
      {entry.kind === "project" && <ProjectOverview entry={entry} team={team} vendor={vendor} documents={data.entries.filter(document=>document.kind==="document"&&document.projectId===entry.id&&document.data.type==="project")} renderForm={(props)=><CommandForm key={props.action+String(props.fixed?.milestoneId||props.fixed?.contactId||"")} {...props} command={command}/>} />}
      {entry.kind === "project" && !vendor && <p><span className="text-slate-400">{value(d,"budgetSource")&&value(d,"budgetApprovedOn")?"Approved budget: ":"Budget on record: "}</span>{money(d.budgetUsd)}</p>}

      {entry.kind === "invoice" && <p className="text-xl font-bold text-white">{money(d.amountUsd)}</p>}
      {entry.kind === "hours" && <p className="text-lg font-bold text-white">{value(d, "hours")} hours</p>}
      {entry.kind === "document" && <a className={secondaryClass} href={"/api/documents/" + encodeURIComponent(entry.id)}>Download document</a>}
    </div>;
  }

  const renderOperationsForm=(props:import("@/components/workspace/ProjectOverview").WorkspaceForm)=><CommandForm key={props.action+String(props.fixed?.id||"")} {...props} command={command}/>;
  const moduleId:Record<string,string>={executive:"executive",financial_dashboard:"financial-dashboard",corporate_meetings:"corporate-meetings",followups:"followups",proposal:"proposals",team:"project-teams",lead:"crm",bid:"bids",hours:"payroll",finance:"accounting",compliance:"compliance",dossier:"dossier",takeoff:"takeoff"};
  return <CommandRecovery.Provider value={{ lockedKey: pendingView?.key || null, subscribe: subscribeOutcome }}><PortalShell className="workspace-shell min-h-screen bg-[#070e1a] text-slate-100" data-atmosphere={display.atmosphere} data-density={display.density} data-current-module={tab} style={{"--workspace-light-angle":display.lightAngle+"deg"} as CSSProperties} sidebarRef={sidebarRef} sidebar={<>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3"><Image src="/logo.jpeg" alt="TAYCO LLC · General Contractor" width={64} height={64} className="h-14 w-14 shrink-0 rounded-xl border border-amber-200/40 bg-[#f3efe2] object-cover shadow-lg" /><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-amber-100">Executive command</p><p className="mt-1 text-[11px] text-slate-400">{roleName}</p></div></div>
          <button ref={modulesToggleRef} type="button" className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-amber-200/40 px-3 text-xs font-semibold text-amber-100 lg:hidden" aria-expanded={mobileModulesOpen} aria-controls="tayco-portal-module-tabs" onClick={()=>setMobileModulesOpen(!mobileModulesOpen)}>{mobileModulesOpen?"Close modules":"Open modules"}</button>
        </div>
        <nav id="tayco-portal-module-tabs" aria-label="Command Center Navigation" className={(mobileModulesOpen?"block":"hidden")+" mt-6 space-y-5 lg:block"}>
          {[...new Set(tabs.map(item=>item.group))].map(group=><div key={group}><p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">{group}</p><div className="space-y-1">{tabs.filter(item=>item.group===group).map(item=><button type="button" key={item.id} onClick={()=>navigate(item.id)} aria-current={tab===item.id?"page":undefined} className={"flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-amber-200 "+(tab===item.id?"border-amber-200/55 bg-gradient-to-r from-amber-200/20 to-amber-200/5 text-amber-100":"border-transparent text-slate-300 hover:border-amber-200/20 hover:bg-white/5")}><span className="min-w-0">{item.label}</span>{["project","document","lead","hours","bid","compliance"].includes(item.id)&&<span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-amber-100">{data.entries.filter(entry=>String(entry.kind)===item.id).length}</span>}</button>)}</div></div>)}
          {admin&&<div className="border-t border-amber-200/20 pt-4"><Link data-testid="module-access" href="/account" className="flex min-h-11 items-center rounded-xl border border-amber-200/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-200/10">B2B access &amp; invitations ↗</Link></div>}
        </nav>
        {team&&<div className="mt-5 hidden rounded-xl border border-amber-200/25 bg-[#102541] p-4 lg:block"><p className="text-[10px] font-semibold uppercase tracking-widest text-amber-200">Estimating bridge</p><p className="mt-2 text-sm font-semibold text-white">{data.integrations.takeoff==="not_configured"?"Not connected":label(data.integrations.takeoff)}</p><p className="mt-2 text-xs leading-relaxed text-slate-400">Project source records remain available.</p><button className="mt-3 min-h-11 text-xs font-semibold text-[#fb923c] underline underline-offset-4" onClick={()=>navigate("takeoff")}>Open bridge context ↗</button></div>}
      </>} header={<>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">{roleName}</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{team&&tab==="executive"?"Executive dashboard":<>Your projects. <em className="font-serif font-normal text-amber-200">Connected.</em></>}</h1>
          <p className="workspace-page-description mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">{team ? "Manage project progress, incoming requests and reviews from one workspace." : "Follow assigned projects, review updates and keep your next steps in view."}</p>
          <p className="mt-2 break-all text-xs text-slate-400">Signed in as {data.actor.email} · {team ? "Company workspace" : "Only records assigned or shared with your account"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tab!=="executive"&&<WorkspaceDisplayControls value={display} onChange={setDisplay}/>}
          <button className={secondaryClass} type="button" onClick={() => void refresh().catch(() => {})} disabled={refreshing}>{refreshing ? "Refreshing…" : "Refresh"}</button>
          <Link className={buttonClass} href="/account">Account &amp; access</Link>
        </div>
      </>}>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/40 bg-red-950/40 p-4 text-sm text-red-100">{error} {expired && <Link className="underline" href="/login?next=/portal">Sign in again</Link>}<p className="mt-1 text-xs">Previously loaded information remains visible and may be out of date.</p></div>}
      {team && (
        <nav aria-label="Monthly Corporate Evaluation Modules" data-testid="corporate-11-modules-bar" className="mt-5 rounded-xl border border-amber-200/25 bg-[#0a192f]/90 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200">Monthly Corporate Evaluation · 11 Operational Modules</span>
            <span className="text-[11px] text-slate-400">October 2026 · 42 Verified Bidding Opportunities</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CORPORATE_11_MODULES.map((mod) => {
              const active = tab === mod.id;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => navigate(mod.id)}
                  aria-current={active ? "page" : undefined}
                  className={
                    "min-h-9 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition " +
                    (active
                      ? "border-amber-200/70 bg-amber-200/20 text-amber-100"
                      : "border-slate-700/80 bg-[#0f223d]/70 text-slate-300 hover:border-amber-200/35 hover:text-white")
                  }
                >
                  {mod.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {!["lead","vendor","activity","corporate_meetings","followups"].includes(tab)?<label className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-300" htmlFor="portal-project-filter">Project<select id="portal-project-filter" className="min-h-11 max-w-full rounded-lg border border-slate-600 bg-[#0f2040] px-3 text-sm text-white" value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">All assigned projects</option>{projects.map((entry) => <option key={entry.id} value={entry.id}>{value(entry.data, "name")}</option>)}</select></label>:<p className="text-xs text-slate-400">{team?"Company workspace":"Your linked company"} · no project filter</p>}
        <p role="status" className="text-xs text-slate-400">Last refreshed {timestamp(data.updatedAt)}</p>
      </div>
      {pendingView && <section data-testid="pending-command-recovery" className="mt-5 rounded-xl border border-amber-200/50 bg-[#142748] p-4" aria-busy={pendingView.phase === "busy"}>
        <h2 className="font-semibold text-amber-100">{pendingView.phase === "busy" ? "Saving request…" : "A saved request needs confirmation"}</h2>
        <p className="mt-2 text-sm text-slate-200">{label(pendingView.action)} · request {pendingView.key}</p>
        <p className="mt-2 text-sm text-slate-300">Other saves are held until this request is confirmed. You can change modules; keep this workspace open to retain its request reference.</p>
        {pendingView.error && <p role="alert" className="mt-2 text-sm text-red-100">{pendingView.error}</p>}
        {pendingView.phase === "uncertain" && <button type="button" className={buttonClass + " mt-3"} onClick={() => { const request = pendingCommand.current; if (request) void command(request.body, request.key).catch(() => {}); }}>Retry retained request</button>}
      </section>}
      <div ref={currentModuleRef} tabIndex={-1} role="region" aria-label={tabs.find(item=>item.id===tab)?.label||"Workspace module"} className="mt-5 min-w-0 outline-none" aria-busy={refreshing} data-testid={"module-"+(moduleId[tab]||tab)}>
        <Panel featured={tab==="executive"} title={tabs.find((item) => item.id === tab)?.label || "Workspace"} subtitle={tab === "invoice" ? "Track submitted invoices and recorded decisions. A paid status is a team record, not a payment transfer." : tab === "document" ? "Receipt and approval are separate steps. Review the status and any requested corrections." : tab === "hours" ? "Record work performed and follow its review. This workspace does not calculate wages or submit payroll." : tab === "project" ? "A shared view of progress, upcoming actions and project conversations." : undefined}>
          {tab === "project" && team && <CommandForm title="Add a project" action="create_project" command={command} fields={[{ name: "name", label: "Project name" }, { name: "location", label: "Location", required: false }, { name: "clientName", label: "Client name", required: false }, { name: "budgetUsd", label: "Approved budget (USD, optional)", type: "number", required: false, min: 0, max: 1e10, step: 0.01 }, { name: "budgetSource", label: "Approval source (required when budget is entered)", required: false }, { name: "budgetApprovedOn", label: "Approval date (required when budget is entered)", type: "date", required: false }, { name: "nextAction", label: "Next action (optional)", required: false, placeholder: "Record the actual next step for this project", type: "textarea" }, ...projectClassificationFields()]} />}
          {tab === "project" && <ProjectClassificationFilters projects={scopedRecords} value={projectClassificationFilter} onChange={setProjectClassificationFilter} />}
          {tab === "lead" && team && <CommandForm title="Add a request" action="create_lead" command={command} fields={[assigneeField(),{ name: "name", label: "Contact name" }, { name: "email", label: "Email address", type: "email" }, { name: "details", label: "Project details", type: "textarea" }]} />}
          {tab === "hours" && !(!team && !vendor) && projects.length > 0 && <CommandForm title="Submit work hours" action="log_hours" command={command} fields={[projectField(projects), { name: "date", label: "Work date", type: "date" }, { name: "hours", label: "Hours", type: "number", min: 0.1, max: 24, step: 0.1 }, { name: "trade", label: "Work performed" }]} />}
          {tab === "invoice" && (team || vendor) && projects.length > 0 && <CommandForm title="Record an invoice" action="record_invoice" command={command} fields={[projectField(projects), { name: "reference", label: "Invoice reference" }, { name: "amountUsd", label: "Amount (USD)", type: "number", min: 0, max: 1e10, step: 0.01 }, {name:"issuedOn",label:"Invoice issue date",type:"date",value:new Date().toISOString().slice(0,10)},{name:"source",label:"Invoice source",value:"Team record"},{ name: "dueDate", label: "Due date", type: "date", required: false }, ...(team ? [{ name: "audience", label: "Visible to", type: "select" as const, value: "client", options: [{ value: "client", label: "Assigned client" }, { value: "internal", label: "TAYCO team only" }] }] : [])]} />}
          {tab === "document" && (team || vendor) && <DocumentUpload projects={projects} refresh={refresh} />}
          {tab === "document" && <details className="mb-5 rounded-xl border border-slate-600 bg-[#09172b]/40"><summary className="flex min-h-11 cursor-pointer items-center px-4 py-3 text-sm font-semibold text-amber-100">Document preservation and renewals</summary><fieldset disabled={Boolean(pendingView)} className="min-w-0 p-3"><DocumentMaintenance projectId={projectId||undefined} refreshKey={data.updatedAt} onChanged={()=>void refresh().catch(()=>{})} /></fieldset></details>}
          {tab==="executive"?<div className="space-y-6"><ExecutiveConsole data={data} projectId={projectId} onNavigate={navigate} estimates={estimateReport.estimates}/>{team&&!projectId&&<ManagementEstimatesPanel compact onOpenMonth={period=>navigate("financial_dashboard",undefined,period)}/>}</div>:tab==="financial_dashboard"?<div className="space-y-6">{team&&!projectId&&<ManagementEstimatesPanel initialPeriod={financePeriod||undefined}/>}<FinancialDashboard entries={data.entries} projectId={projectId} asOf={data.updatedAt} initialMonth={financePeriod||undefined} onNavigate={navigate} renderForm={renderOperationsForm}/></div>: team&&["corporate_meetings","followups"].includes(tab)?<CorporateAgenda key={tab} view={tab==="corporate_meetings"?"meetings":"followups"} entries={data.entries} assignees={data.assignees||[]} asOf={data.updatedAt} month={financePeriod||undefined} renderForm={renderOperationsForm}/>: tab==="hours"?<div className="space-y-5"><HoursReport entries={data.entries} projectId={projectId} asOf={data.updatedAt} internal={team} vendor={vendor}/><details className="rounded-xl border border-amber-200/20 p-4"><summary className="min-h-11 cursor-pointer font-semibold text-amber-100">Work-log source records</summary><div className="mt-4 grid gap-4 lg:grid-cols-2">{visible.map(entry=><article key={entry.id} className={card}><h3 className="font-semibold text-white">{recordTitle(entry)}</h3><Status>{label(entry.data.status)}</Status>{metadata(entry)}{detail(entry)}{controls(entry)}</article>)}</div></details></div>: tab==="lead"&&team?<CommercialRequests entries={data.entries} projectId="" assignees={data.assignees||[]} renderForm={renderOperationsForm} renderProgress={entry=><CommercialRecordControl entry={entry} command={command} pending={Boolean(pendingView)}/>}/>: tab==="estimate"?<EstimateArchive estimates={estimateReport.estimates} invalidCount={estimateReport.invalidCount}/>: tab==="takeoff"&&team?<div className="space-y-5"><MeasurementReview projectId={projectId}/><OperationsModules view={tab} entries={data.entries} projectId={projectId} asOf={data.updatedAt} team={team} vendor={vendor} integrations={data.integrations} assignees={data.assignees||[]} renderForm={renderOperationsForm} onNavigate={navigate}/></div>: ["proposal","team","bid","compliance","dossier","takeoff"].includes(tab)?<OperationsModules view={tab} entries={data.entries} projectId={projectId} asOf={data.updatedAt} team={team} vendor={vendor} integrations={data.integrations} assignees={data.assignees||[]} renderForm={renderOperationsForm} onNavigate={navigate}/>:tab === "finance" ? <FinanceOverview entries={data.entries} projectId={projectId} asOf={data.updatedAt} internal={team} vendor={vendor} initialPeriod={financePeriod} onOpenInvoices={()=>setTab("invoice")}/> : tab === "activity" ? <div className="space-y-3">
            <div className={card}><h3 className="font-semibold text-amber-100">Request notifications</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">Request records are saved independently of email delivery. Acceptance by the email provider does not guarantee delivery to the recipient’s inbox.</p>
              <div className="mt-3 flex flex-wrap gap-2">{data.delivery.length ? data.delivery.map((item, index) => <Status key={index}>{item.status==="delivered"?"Accepted by email provider":label(item.status)}: {value(item, "count")}</Status>) : <p className="text-sm text-slate-400">No queued notifications.</p>}</div>
              {admin && <button type="button" className={secondaryClass + " mt-4"} disabled={sending || Boolean(pendingView)} onClick={() => void deliverNotifications()}>{sending ? "Processing…" : "Send queued notifications"}</button>}
              {deliveryMessage && <p role="status" className="mt-3 text-sm text-amber-100">{deliveryMessage}</p>}
            </div>
            {data.audit.length === 0 ? <Empty>No workspace activity has been recorded yet.</Empty> : data.audit.map((event, index) => <div key={index} className={card}><p className="text-sm font-semibold capitalize">{label(event.action)}</p><p className="mt-1 text-xs text-slate-400">{timestamp(value(event, "created_at"))}</p><p className="mt-1 break-all text-xs text-slate-400">Reference: {value(event, "resource_id")}</p></div>)}
            {admin && (
              <section className="mt-8 space-y-4 rounded-2xl border border-amber-200/30 bg-[#08182b] p-6">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">Surveillance &amp; audit</p>
                  <h3 className="mt-1 text-xl font-bold text-white">Guest 3-Hour Review &amp; Movement Log (Admin Only)</h3>
                  <p className="mt-1 text-xs text-slate-300">Audited activity log and telemetry recorded for private 3-hour client reviews.</p>
                </div>
                <div className="space-y-6 pt-2">
                  <ReviewAuditPanel />
                  <GuestActivityPanel />
                </div>
              </section>
            )}
          </div> :
            visible.length === 0 ? <div className="mt-4"><Empty>{tab === "project" && !team ? "No projects have been assigned to your account yet. Contact your TAYCO coordinator to confirm access." : "No records to show in this section" + (projectId ? " for the selected project." : " yet.")}</Empty></div> :
              <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">{visible.map((entry) => <article key={entry.id} data-project-id={entry.kind === "project" ? entry.id : undefined} className={card}>
                <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="min-w-0 break-words text-lg font-semibold text-white">{recordTitle(entry)}</h3><Status>{label(entry.data.status) || "Recorded"}</Status></div>
                {metadata(entry)}<p className="mt-1 break-all text-[11px] text-slate-400">Reference: {entry.id}</p>{detail(entry)}{controls(entry)}
              </article>)}</div>}
        </Panel>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-[#0f2040]/50 p-5"><h2 className="font-semibold text-amber-100">Need help with your project?</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Contact your TAYCO coordinator for assignments, documents or changes that need attention.</p><a className="mt-3 inline-flex min-h-11 items-center break-all text-sm font-semibold text-amber-200 underline underline-offset-4" href={COMPANY.emailHref}>{COMPANY.email}</a></div>
        {team && <div className="rounded-xl border border-slate-700 bg-[#0f2040]/50 p-5"><h2 className="font-semibold text-amber-100">Connected services</h2><p className="mt-2 text-sm leading-relaxed text-slate-300">Estimating: {data.integrations.takeoff === "not_configured" ? "Not connected" : label(data.integrations.takeoff)} · Accounting: {data.integrations.accounting === "not_configured" ? "Not connected" : label(data.integrations.accounting)}</p><p className="mt-2 text-xs text-slate-400">No financial or estimating system is shown as live until its connection has been verified.</p></div>}
      </div>
  </PortalShell></CommandRecovery.Provider>;
}
