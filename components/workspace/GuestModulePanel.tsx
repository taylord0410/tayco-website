"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { GuestConsoleData } from "@/lib/guest-workspace";
import { guestModuleDefinitions, type GuestSection } from "@/lib/guest-sections";
import { DistributionRing, SnapshotBars, EstimateCostRing } from "./WorkspaceVisuals";

type ModuleRecord = GuestConsoleData["moduleRecords"][number];
const card = "rounded-xl border border-slate-600/60 bg-[#09172b]/65 p-4 sm:p-5";
const button = "inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200";
const moduleKinds: Partial<Record<GuestSection, ModuleRecord["kind"][]>> = {
  corporate_meetings: ["corporate_meeting"], followups: ["followup"], note: ["note"], change: ["change"], lead: ["lead"],
  proposal: ["proposal"], vendor: ["vendor"], bid: ["bid"], hours: ["hours"],
  team: ["team"], compliance: ["compliance"],
  finance: ["hours", "change"], financial_dashboard: ["hours", "change"],
};
const label = (value: string | null) => value?.trim().replaceAll("_", " ") || "Not provided";
const money = (value: number | null) => value === null || !Number.isFinite(value) ? "Not provided" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const month = (period: string) => new Date(period + "-01T12:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
function date(value: string | null) {
  if (!value) return "Not provided";
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "Not provided";
}
function Surface({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return <section className="workspace-panel rounded-2xl border p-5 sm:p-6">{eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-amber-200/70">{eyebrow}</p>}<h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{title}</h2><div className="mt-5">{children}</div></section>;
}
function Empty() { return <p className="rounded-xl border border-dashed border-slate-600 px-5 py-7 text-sm leading-relaxed text-slate-300">No current-month records are available for this selection.</p>; }

export function guestModuleCount(data: GuestConsoleData, section: GuestSection) {
  if (section === "projects") return data.projects.length;
  if (section === "estimates") return data.estimates.length;
  if (section === "plans" || section === "takeoff") return data.documents.length;
  if (section === "dossier") return data.projects.length + data.estimates.length + data.documents.length;
  if (section === "activity") return data.estimates.length + (data.moduleRecords?.length ?? 0);
  return (data.moduleRecords ?? []).filter(record => moduleKinds[section]?.includes(record.kind)).length;
}

export function GuestMonthlyTotals({ data, selectedPeriod, onMonthSelect }: { data: GuestConsoleData; selectedPeriod: string; onMonthSelect: (period: string) => void }) {
  const rows = [...data.historicalSummary.months].sort((a, b) => a.period.localeCompare(b.period));
  const max = Math.max(1, ...rows.map(row => row.highUsd));
  return <Surface title="Monthly company totals" eyebrow="Published management estimates · USD">
    <p className="mb-5 text-xs leading-relaxed text-slate-400">Approximate monthly gross ranges. These management estimates do not report collected revenue or profit. Select a month to review its general totals.</p>
    {rows.length ? <div className="space-y-2">{rows.map(row => <button key={row.period} type="button" onClick={() => onMonthSelect(row.period)} aria-pressed={selectedPeriod === row.period} className={"grid min-h-16 w-full grid-cols-[minmax(74px,.6fr)_minmax(90px,1fr)] items-center gap-x-4 gap-y-2 rounded-lg border px-3 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-amber-200 sm:grid-cols-[100px_minmax(60px,1fr)_minmax(160px,auto)] " + (selectedPeriod === row.period ? "border-amber-200/50 bg-amber-200/10" : "border-transparent hover:border-amber-200/20 hover:bg-white/5")}><span className="text-xs font-medium text-slate-200">{month(row.period)}</span><span aria-hidden="true" className="relative hidden h-2 overflow-hidden rounded-full bg-slate-700/60 sm:block"><span className="absolute inset-y-0 left-0 rounded-full bg-amber-200/20" style={{ width: (row.highUsd / max * 100) + "%" }}/><span className="absolute inset-y-0 rounded-full bg-amber-200" style={{ left: (row.lowUsd / max * 100) + "%", width: Math.max(1, (row.highUsd - row.lowUsd) / max * 100) + "%" }}/></span><span className="text-right font-mono text-xs text-amber-100">{money(row.lowUsd)} – {money(row.highUsd)}</span></button>)}</div> : <Empty/>}
  </Surface>;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  planning: { label: "Planning", color: "#d6b969" },
  active: { label: "Active", color: "#80b6bd" },
  overdue: { label: "Overdue", color: "#e05252" },
  pending_company_info: { label: "Pending company info", color: "#f29050" },
  awaiting_company_info: { label: "Awaiting company info", color: "#f29050" },
  blocked: { label: "Blocked", color: "#f29050" },
  on_hold: { label: "On hold", color: "#d9a74a" },
  paused: { label: "Paused", color: "#a8b2c6" },
  completed: { label: "Completed", color: "#79b493" },
  cancelled: { label: "Cancelled", color: "#64748b" },
  waiting: { label: "Waiting", color: "#b3a1d3" },
  source_review: { label: "Source review", color: "#38bdf8" },
  reference_only: { label: "Reference only", color: "#94a3b8" },
};

export default function GuestModulePanel({ data, section, projectId, onNavigate, onMonthSelect }: {
  data: GuestConsoleData; section: GuestSection; projectId: string; onNavigate: (section: GuestSection, projectId?: string) => void; onMonthSelect: (period: string) => void;
}) {
  const [selectedStatus, setSelectedStatus] = useState("");
  const allRecords = data.moduleRecords ?? [];
  const records = allRecords.filter(record => (!projectId || record.projectId === projectId) && moduleKinds[section]?.includes(record.kind));
  const title = guestModuleDefinitions.find(item => item.id === section)?.label || "Workspace";
  const projectName = (id: string | null) => data.projects.find(project => project.id === id)?.name;
  const recordCards = (items: ModuleRecord[]) => items.length ? <div className="grid gap-4 xl:grid-cols-2">{items.map(record => <article key={record.kind + ":" + record.id} className={card}>
    <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-amber-200/70">{projectName(record.projectId) || "Company record"}</p><h3 className="mt-2 break-words font-semibold text-white">{label(record.title)}</h3></div><span className="rounded-full border border-amber-200/20 bg-amber-200/5 px-2.5 py-1 text-[10px] capitalize text-amber-100">{label(record.status)}</span></div>
    <dl className="mt-5 grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2"><div><dt className="text-[10px] uppercase tracking-wider text-slate-400">Record date</dt><dd className="mt-1 text-sm text-slate-200">{date(record.date)}</dd></div>{record.fields.map((field, index) => <div key={field.label + index}><dt className="text-[10px] uppercase tracking-wider text-slate-400">{field.label}</dt><dd className="mt-1 break-words text-sm text-slate-200">{field.value === null || field.value === "" ? "Not provided" : typeof field.value === "number" ? field.value.toLocaleString("en-US") : field.value}</dd></div>)}</dl>
  </article>)}</div> : <Empty/>;

  if (["summary", "financial_dashboard", "finance"].includes(section)) {
    const stats: { label: string; value: string | number; note: string; section: GuestSection }[] = [
      { label: "Current projects", value: data.projects.length, note: "Project status & progress", section: "projects" },
      { label: "Estimates available", value: data.estimates.length, note: "Source-dated revisions · not contract value", section: "estimates" },
      { label: "Plans & documents", value: data.documents.length, note: data.documents.filter(document => document.available).length + " available to open", section: "plans" },
      { label: "Operational records", value: allRecords.length, note: "Current reporting period", section: "followups" },
    ];

    const projectStatuses = [...new Set(data.projects.map(p => p.status))];
    const segments = projectStatuses.map(st => ({
      key: st,
      label: statusConfig[st]?.label || st.replaceAll("_", " "),
      color: statusConfig[st]?.color || "#a8b2c6",
      value: data.projects.filter(p => p.status === st).length,
    }));
    const progressItems = data.projects.filter(p => typeof p.progress === "number").slice(0, 6).map(p => ({
      id: p.id,
      label: p.name,
      value: p.progress!,
      onOpen: () => onNavigate("projects", p.id),
    }));
    const estimateItems = data.estimates.filter(e => typeof e.amountUsd === "number" && e.amountUsd > 0).map((e, idx) => ({
      code: e.sourceLabel || "EST-" + (idx + 1),
      label: e.projectName + " · " + e.name,
      amountUsd: e.amountUsd!,
    }));
    const estimateTotal = estimateItems.reduce((acc, curr) => acc + curr.amountUsd, 0);

    const visibleProjects = data.projects.filter(p => !selectedStatus || p.status === selectedStatus);

    return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(stat => <button key={stat.label} type="button" onClick={() => onNavigate(stat.section)} className={card + " text-left transition hover:border-amber-200/60 focus-visible:outline-2 focus-visible:outline-amber-200"}><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{stat.label}</span><strong className="mt-3 block break-words font-mono text-2xl font-medium text-amber-100">{stat.value}</strong><span className="mt-3 block text-[11px] text-slate-400">{stat.note} ↗</span></button>)}</div>
      
      <div className="grid gap-5 xl:grid-cols-2">
        <Surface title="Portfolio project status" eyebrow="Current position · Read only">
          <DistributionRing segments={segments} selected={selectedStatus} onSelect={setSelectedStatus} />
        </Surface>
        <Surface title="Execution progress" eyebrow="Reported field completion">
          <SnapshotBars items={progressItems} />
        </Surface>
      </div>

      {estimateItems.length > 0 && (
        <Surface title="Cost & estimate composition" eyebrow="Reconciled current estimates · USD">
          <EstimateCostRing items={estimateItems} total={estimateTotal} basis="Current period revisions" title="Estimates" />
        </Surface>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"><Surface title={section === "summary" ? "Current project portfolio" : "Current financial records"} eyebrow={month(data.currentPeriod) + " · Read only"}>
        {section === "summary" ? visibleProjects.length ? <div className="overflow-x-auto"><table className="w-full min-w-[360px] text-left text-xs"><thead className="border-b border-slate-600 text-[10px] uppercase tracking-wider text-slate-400"><tr><th className="pb-3 font-medium">Project</th><th className="pb-3 font-medium">Status</th><th className="pb-3 text-right font-medium">Progress</th></tr></thead><tbody>{visibleProjects.map(project => <tr key={project.id} className="border-b border-slate-700/60 last:border-0"><td className="py-3 pr-3"><button className="min-h-11 text-left font-semibold text-slate-100 underline decoration-amber-200/30 underline-offset-4 hover:text-amber-100 focus-visible:outline-2 focus-visible:outline-amber-200" onClick={() => onNavigate("projects", project.id)}>{project.name}</button></td><td className="py-3 capitalize text-slate-300">{label(project.status)}</td><td className="py-3 text-right font-mono text-amber-100">{project.progress === null ? "Not provided" : project.progress + "%"}</td></tr>)}</tbody></table></div> : <Empty/> : <><p className="mb-5 text-xs leading-relaxed text-slate-400">Recorded management estimates, hours and project scope changes. Amounts retain their source labels and do not imply income or profit.</p>{recordCards(records)}</>}
      </Surface><GuestMonthlyTotals data={data} selectedPeriod={data.period} onMonthSelect={onMonthSelect}/></div>
      <Surface title="Command center" eyebrow="All workspace modules"><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[...new Set(guestModuleDefinitions.map(item => item.group))].map(group => <div key={group}><h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-amber-200/70">{group}</h3><div className="space-y-1">{guestModuleDefinitions.filter(item => item.group === group && item.id !== "summary").map(item => <button key={item.id} type="button" onClick={() => onNavigate(item.id)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200"><span>{item.label}</span><span className="font-mono text-amber-200">{item.id === "access" ? "↗" : guestModuleCount(data, item.id)}</span></button>)}</div></div>)}</div></Surface>
    </div>;
  }
  if (section === "access") return <Surface title="Account & access" eyebrow="Guest permissions"><p className="text-sm leading-relaxed text-slate-300">Your account can review the console in read-only mode. Managing users, invitations and project assignments requires administrator access.</p><Link className={button + " mt-5"} href="/account">Open your account &amp; password</Link></Surface>;
  if (section === "dossier") return <Surface title={title} eyebrow="Current-month review"><p className="mb-5 text-sm text-slate-300">Review the current project portfolio, recorded estimates and published documents.</p><div className="space-y-3">{data.projects.map(project => <article key={project.id} className={card}><h3 className="font-semibold text-white">{project.name}</h3><p className="mt-2 text-xs capitalize text-slate-400">{label(project.status)} · {data.estimates.filter(estimate => estimate.projectId === project.id).length} estimates · {project.documentCount} documents</p><div className="mt-4 flex flex-wrap gap-2"><button className={button} type="button" onClick={() => onNavigate("projects", project.id)}>Project details</button><button className={button} type="button" onClick={() => onNavigate("estimates", project.id)}>Estimates</button><button className={button} type="button" onClick={() => onNavigate("plans", project.id)}>Documents</button></div></article>)}{!data.projects.length && <Empty/>}</div></Surface>;
  if (section === "activity") {
    const entries = [
      ...allRecords.map(record => ({ id: record.kind + ":" + record.id, kind: record.kind, date: record.date, status: record.status })),
      ...data.estimates.map(estimate => ({ id: "estimate:" + estimate.id, kind: "estimate", date: estimate.estimatedOn, status: null })),
    ].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return <Surface title="Activity" eyebrow="Current record dates"><p className="mb-5 text-xs leading-relaxed text-slate-400">A date index of the records available in this review.</p>{entries.length ? <ol className="divide-y divide-slate-700/60">{entries.map(entry => <li key={entry.id} className="grid gap-2 py-4 sm:grid-cols-[110px_minmax(0,1fr)_auto]"><time className="text-xs text-slate-400">{date(entry.date)}</time><p className="text-sm font-semibold capitalize text-slate-100">{label(entry.kind)} record</p>{entry.status && <p className="text-xs capitalize text-slate-400">{label(entry.status)}</p>}</li>)}</ol> : <Empty/>}</Surface>;
  }
  return <Surface title={title} eyebrow="Current-month records · Read only">{recordCards(records)}</Surface>;
}
