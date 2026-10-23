"use client";
import { useState, type ReactNode } from "react";
import type { Entry } from "@/lib/erp";
import { isValidUsdAmount } from "@/lib/financial-values";
import type { WorkspaceForm } from "./ProjectOverview";

const stages = ["new", "reviewing", "waiting", "quoted", "accepted", "closed"];
const title = (value: string) => value.slice(0, 1).toUpperCase() + value.slice(1).replaceAll("_", " ");
const text = (entry: Entry, key: string) => typeof entry.data[key] === "string" ? entry.data[key] as string : "";
const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
const control = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-amber-200/25 bg-[#09182f] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-200";

export default function CommercialRequests({ entries, projectId, assignees, renderForm, renderProgress }: { entries: Entry[]; projectId: string; assignees: { id: string; email: string; role: string }[]; renderForm: (form: WorkspaceForm) => ReactNode; renderProgress?: (entry: Entry) => ReactNode }) {
  const [stage, setStage] = useState("all"), [owner, setOwner] = useState("all"), [search, setSearch] = useState("");
  const leads = entries.filter(entry => entry.kind === "lead");
  const assignedIds = [...new Set(leads.map(entry => text(entry, "assigneeId")).filter(Boolean))];
  const names = new Map(assignees.map(person => [person.id, person.email]));
  const term = search.trim().toLocaleLowerCase("en-US");
  const rows = leads.filter(entry => (stage === "all" || entry.data.status === stage) && (owner === "all" || (owner === "unassigned" ? !text(entry, "assigneeId") : text(entry, "assigneeId") === owner)) && (!term || ["name", "email", "details", "location", "nextAction", "estimateSource"].some(key => text(entry, key).toLocaleLowerCase("en-US").includes(term))));
  const ownerOptions = [{ value: "", label: "Unassigned" }, ...assignees.map(person => ({ value: person.id, label: person.email }))];
  return <section data-testid="commercial-requests" className="min-w-0 space-y-4 border-t border-amber-200/20 pt-6 text-slate-100" aria-labelledby="commercial-requests-heading">
    <header><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-amber-200">Commercial / requests</p><h3 id="commercial-requests-heading" className="mt-2 text-xl font-black text-white">Commercial request pipeline</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{projectId ? "Requests are company-wide and are not narrowed by the project selector. " : "Company-wide requests. "}Opportunity values are estimates with their own source; they are not invoiced revenue or received payments.</p></header>
    <div className="grid min-w-0 gap-3 sm:grid-cols-3" aria-label="Commercial request filters">
      <label className="min-w-0 text-xs font-semibold text-amber-100">Request stage<select aria-label="Request stage" value={stage} className={control} onChange={event => setStage(event.target.value)}><option value="all">All stages</option>{stages.map(value => <option key={value} value={value}>{title(value)}</option>)}</select></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">Request owner<select aria-label="Request owner" value={owner} className={control} onChange={event => setOwner(event.target.value)}><option value="all">All responsible accounts</option><option value="unassigned">Unassigned</option>{[...new Set([...assignees.map(person => person.id), ...assignedIds])].map(id => <option key={id} value={id}>{names.get(id) || "Account reference: " + id}</option>)}</select></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">Find a request<input aria-label="Find a request" className={control} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, location or next action" /></label>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Request stage counts">{stages.map(value => <button key={value} type="button" aria-pressed={stage === value} onClick={() => setStage(current => current === value ? "all" : value)} className={"min-h-11 rounded-lg border px-3 py-2 text-xs focus-visible:outline-2 focus-visible:outline-amber-200 " + (stage === value ? "border-amber-200/50 bg-amber-200/15 text-amber-100" : "border-slate-600 text-slate-300 hover:border-amber-200/35")}>{title(value)} <span className="ml-2 font-mono">{leads.filter(entry => entry.data.status === value).length}</span></button>)}</div>
    <p role="status" className="text-xs text-slate-400">{rows.length} of {leads.length} accessible requests match the filters.</p>
    <div className="grid min-w-0 gap-3 xl:grid-cols-2">
      {rows.map(entry => {
        const name = text(entry, "name") || "Name not recorded", assigneeId = text(entry, "assigneeId"), amount = entry.data.estimatedValueUsd, hasAmount = isValidUsdAmount(amount), source = text(entry, "estimateSource"), currentStage = text(entry, "status"), knownStage = stages.includes(currentStage);
        const preservedOwner = assigneeId && !names.has(assigneeId) ? [{ value: assigneeId, label: "Current account reference: " + assigneeId }, ...ownerOptions] : ownerOptions;
        return <article key={entry.id} className="min-w-0 rounded-xl border border-slate-600/50 bg-gradient-to-br from-[#142e4d] to-[#0a192e] p-4" data-request-id={entry.id}>
          <header className="flex min-w-0 flex-wrap items-start justify-between gap-2"><div className="min-w-0"><h4 className="break-words font-bold text-white">{name}</h4><p className="mt-1 break-all text-xs text-slate-400">{text(entry, "email") || "Contact email not recorded"}</p></div><span className="rounded-md border border-amber-200/25 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-100">{knownStage ? title(currentStage) : "Stage needs review"}</span></header>
          <dl className="mt-4 grid min-w-0 gap-3 border-t border-slate-600/50 pt-3 text-xs sm:grid-cols-2"><div className="min-w-0"><dt className="text-slate-400">Location</dt><dd className="mt-1 break-words text-slate-100">{text(entry, "location") || "Not recorded"}</dd></div><div className="min-w-0"><dt className="text-slate-400">Responsible account</dt><dd className="mt-1 break-all text-slate-100">{assigneeId ? names.get(assigneeId) || "Account reference: " + assigneeId : "Unassigned"}</dd></div><div className="min-w-0"><dt className="text-slate-400">Indicative opportunity value</dt><dd className="mt-1 break-all font-mono font-bold text-amber-100">{hasAmount ? usd(amount) : amount === null || amount === undefined ? "Not estimated" : "Source value needs review"}</dd></div><div className="min-w-0"><dt className="text-slate-400">Estimate source</dt><dd className="mt-1 break-words text-slate-100">{source || (hasAmount ? "Missing · review before relying on this value" : "Not recorded")}</dd></div></dl>
          <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">{text(entry, "details") || "Project details not recorded."}</p>
          <div className="mt-4 rounded-lg border border-amber-200/15 bg-[#09182b] p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-amber-200">Next action</p><p className="mt-1 whitespace-pre-wrap break-words text-xs text-slate-300">{text(entry, "nextAction") || "No next action recorded."}</p></div>
          <details className="mt-4 border-t border-slate-600/50 pt-1"><summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold text-amber-100">Update responsibility and next action</summary>{renderForm({ title: "Update request workflow", action: "update_lead", fixed: { id: entry.id, version: entry.version }, fields: [{ name: "status", label: "Request stage", type: "select", value: knownStage ? currentStage : "", options: [...(knownStage ? [] : [{ value: "", label: "Choose a valid stage" }]), ...stages.map(value => ({ value, label: title(value) }))] }, { name: "assigneeId", label: "Responsible account", type: "select", required: false, value: assigneeId, options: preservedOwner }, { name: "nextAction", label: "Next action", type: "textarea", required: false, value: text(entry, "nextAction") }] })}</details>
          <details className="border-t border-slate-600/50 pt-1"><summary className="min-h-11 cursor-pointer py-3 text-xs font-semibold text-amber-100">Edit location and sourced estimate</summary>{renderForm({ title: "Update request details", action: "update_lead_details", fixed: { id: entry.id, version: entry.version }, fields: [{ name: "location", label: "Request location", required: false, value: text(entry, "location") }, { name: "estimatedValueUsd", label: "Indicative opportunity value (USD)", type: "number", required: false, min: 0, max: 1e10, step: .01, value: hasAmount ? amount : "", emptyValue: null }, { name: "estimateSource", label: "Value source (required when an amount is entered)", type: "textarea", required: false, value: source }] })}</details>
          {renderProgress?.(entry)}
          <p className="mt-3 break-all font-mono text-[10px] text-slate-500">Source request {entry.id} · revision {entry.version}</p>
        </article>;
      })}
      {rows.length === 0 && <p className="rounded-xl border border-dashed border-slate-600 p-5 text-sm text-slate-400">No accessible commercial requests match this selection.</p>}
    </div>
  </section>;
}
