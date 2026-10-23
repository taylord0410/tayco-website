"use client";
import { useMemo, useState } from "react";
import type { Entry } from "@/lib/erp";
import { buildWorkLogReport, parseWorkLogSelection, type WorkLogStatus } from "@/lib/work-log-report";

const control = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-amber-200/25 bg-[#09182f] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-200";
const action = "inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200/35 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200";
const statusLabels: Record<WorkLogStatus, string> = { submitted: "Awaiting review", approved: "Approved work logs", returned: "Returned for correction" };
function timestamp(value: string) { return Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }) + " UTC" : "Snapshot date not available"; }

export default function HoursReport({ entries, projectId, asOf, internal, vendor }: { entries: Entry[]; projectId: string; asOf: string; internal: boolean; vendor: boolean }) {
  const [from, setFrom] = useState(""), [to, setTo] = useState(""), [status, setStatus] = useState<"all" | WorkLogStatus>("all"), [selectedProject, setSelectedProject] = useState("");
  const [limit, setLimit] = useState(20);
  const effectiveProject = projectId || selectedProject;
  const result = useMemo(() => {
    try { return { report: buildWorkLogReport(entries, { ...parseWorkLogSelection({ from, to, status, projectId: effectiveProject }), asOf }), error: "" }; }
    catch (error) { return { report: null, error: error instanceof Error ? error.message : "Check the reporting filters." }; }
  }, [entries, from, to, status, effectiveProject, asOf]);
  if (!internal && !vendor) return null;
  const projects = entries.filter(entry => entry.kind === "project" && (!projectId || entry.id === projectId));
  const report = result.report;
  const query = new URLSearchParams();
  if (from) query.set("from", from); if (to) query.set("to", to); if (effectiveProject) query.set("projectId", effectiveProject); if (status !== "all") query.set("status", status);
  const href = (format: "csv" | "json") => { const params = new URLSearchParams(query); params.set("format", format); return "/api/hours/export?" + params; };
  return <section data-testid="hours-report" className="min-w-0 space-y-4 border-t border-amber-200/20 pt-6 text-slate-100" aria-labelledby="hours-report-heading">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-amber-200">Operations / recorded work</p><h3 id="hours-report-heading" className="mt-2 text-xl font-black text-white">Weekly work-log report</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{internal ? "Team-visible records" : "Your submitted records only"} · Snapshot {timestamp(asOf)}</p></div>{report && <div className="flex flex-wrap gap-2"><a href={href("csv")} className={action}>Download hours CSV</a><a href={href("json")} className={action}>Download hours JSON</a></div>}</header>
    <div className="grid min-w-0 gap-3 rounded-xl border border-amber-200/20 bg-[#0c1c33] p-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Work-log reporting filters">
      <label className="min-w-0 text-xs font-semibold text-amber-100">Work date from<input aria-label="Work date from" className={control} type="date" value={from} max={to || undefined} onChange={event => { setFrom(event.target.value); setLimit(20); }} /></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">Work date through<input aria-label="Work date through" className={control} type="date" value={to} min={from || undefined} onChange={event => { setTo(event.target.value); setLimit(20); }} /></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">Work-log review<select aria-label="Work-log review" className={control} value={status} onChange={event => { setStatus(event.target.value as "all" | WorkLogStatus); setLimit(20); }}><option value="all">All review states</option>{Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">Work-log project<select aria-label="Work-log project" className={control} value={effectiveProject} disabled={Boolean(projectId)} onChange={event => { setSelectedProject(event.target.value); setLimit(20); }}><option value="">All accessible projects</option>{projects.map(project => <option key={project.id} value={project.id}>{typeof project.data.name === "string" ? project.data.name : "Project"}</option>)}</select></label>
    </div>
    {result.error && <p role="alert" className="rounded-xl border border-orange-300/30 bg-orange-400/10 p-3 text-sm text-orange-100">{result.error}</p>}
    {report && <>
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Recorded work-log totals"><article className="min-w-0 rounded-xl border border-amber-200/30 bg-gradient-to-br from-[#1a3656] to-[#0c1b30] p-4"><h4 className="text-xs text-slate-300">Recorded hours in this selection</h4><p data-testid="hours-exact-total" className="mt-3 break-all font-mono text-2xl font-black text-amber-100">{report.totals.exactHours}<span className="ml-1 text-xs font-normal">h</span></p><p className="mt-2 text-xs text-slate-400">{report.totals.count} work logs · work-date basis</p></article>{Object.entries(statusLabels).map(([key, label]) => { const totals = report.totals.byStatus[key as WorkLogStatus]; return <article key={key} className="min-w-0 rounded-xl border border-slate-600/50 bg-[#0c1b30] p-4"><h4 className="text-xs text-slate-300">{label}</h4><p className="mt-3 break-all font-mono text-xl font-bold text-white">{totals.exactHours}<span className="ml-1 text-xs font-normal">h</span></p><p className="mt-2 text-xs text-slate-400">{totals.count} work logs</p></article>; })}</div>
      <p className="text-xs leading-relaxed text-slate-400">Weeks follow ISO Monday–Sunday and may cross calendar years. Review status is the current status of the source log. These are recorded hours, not wage calculations, paid payroll or a WH-347 certification.</p>
      {report.warnings.length > 0 && <details className="rounded-xl border border-orange-200/25 bg-orange-400/[.06] px-3 text-xs text-orange-100"><summary className="min-h-11 cursor-pointer py-3 font-semibold">Source coverage · {report.excludedRecordCount} invalid or duplicated records excluded · {report.warnings.length} notices</summary><ul className="mb-3 space-y-2 break-words">{report.warnings.map((warning, index) => <li key={warning.recordId + warning.code + index}><span className="font-mono">{warning.recordId}</span> · {warning.code.replaceAll("_", " ")}{warning.code === "future_work_date" ? "; included as entered, future work is not verified" : ""}</li>)}</ul></details>}
      <div data-testid="hours-weekly-groups" className="min-w-0 space-y-2" aria-label="Weekly groups and source records">
        {report.groups.length === 0 && <p role="status" className="rounded-xl border border-dashed border-slate-600 p-5 text-sm text-slate-400">No valid work logs match this selection.</p>}
        {report.groups.slice(0, limit).map(group => <details key={JSON.stringify([group.projectId, group.isoWeek, group.trade, group.ownerId, group.status])} className="min-w-0 rounded-xl border border-slate-600/50 bg-[#0a192e] px-3 sm:px-4"><summary className="min-h-14 cursor-pointer py-3 text-sm"><span className="inline-flex max-w-full flex-wrap items-baseline gap-x-3 gap-y-1 align-middle"><span className="font-mono font-bold text-amber-100">{group.isoWeek}</span><span className="break-words font-semibold text-white">{group.trade}</span><span className="break-all font-mono text-amber-100">{group.exactHours} h</span><span className="text-[11px] text-slate-400">{group.count} logs · {statusLabels[group.status]}</span></span></summary>
          <div className="min-w-0 space-y-3 border-t border-slate-700 pb-4 pt-3"><p className="break-words text-xs text-slate-300">{group.projectName}</p><p className="break-all text-[11px] text-slate-400">Submitter account reference: {group.ownerId || "Not recorded"}</p><ul className="space-y-2">{group.recordIds.map(id => { const row = report.rows.find(source => source.id === id)!; return <li key={id} className="grid min-w-0 gap-1 rounded-lg border border-slate-700/60 p-3 text-xs sm:grid-cols-[7rem_1fr_auto]"><time dateTime={row.date} className="font-mono text-slate-300">{row.date}</time><span className="break-all text-[10px] text-slate-500">Source {row.id}</span><span className="break-all font-mono font-bold text-amber-100">{row.exactHours} h</span></li>; })}</ul></div>
        </details>)}
        {report.groups.length > limit && <button className={action + " w-full"} type="button" onClick={() => setLimit(value => value + 20)}>Show more weekly groups ({report.groups.length - limit} remaining)</button>}
      </div>
    </>}
  </section>;
}
