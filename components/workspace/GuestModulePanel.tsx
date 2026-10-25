"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { GuestConsoleData } from "@/lib/guest-workspace";
import { guestModuleDefinitions, type GuestSection } from "@/lib/guest-sections";
import { VERIFIED_OCTOBER_2026_OPPORTUNITIES } from "@/lib/verified-bidding-opportunities";

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
  if (section === "projects" || section === "lead") return VERIFIED_OCTOBER_2026_OPPORTUNITIES.length;
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

export default function GuestModulePanel({ data, section, projectId, onNavigate, onMonthSelect }: {
  data: GuestConsoleData; section: GuestSection; projectId: string; onNavigate: (section: GuestSection, projectId?: string) => void; onMonthSelect: (period: string) => void;
}) {
  const [summaryFilter, setSummaryFilter] = useState<"all" | "pending" | "cancelled">("all");
  const [showAllSummary, setShowAllSummary] = useState(false);
  const [projectsFilter, setProjectsFilter] = useState<"all" | "pending" | "cancelled">("all");
  const [leadFilter, setLeadFilter] = useState<"all" | "pending" | "cancelled">("all");

  const pendingOpps = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.status === "Pending company information"
  );
  const cancelledOpps = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.status === "Overdue"
  );

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
      { label: "Portfolio records", value: VERIFIED_OCTOBER_2026_OPPORTUNITIES.length, note: "Pending & Cancelled only", section: "projects" },
      { label: "Estimates available", value: data.estimates.length, note: "Source-dated revisions · not contract value", section: "estimates" },
      { label: "Plans & documents", value: data.documents.length, note: data.documents.filter(document => document.available).length + " available to open", section: "plans" },
      { label: "Operational records", value: allRecords.length, note: "Current reporting period", section: "followups" },
    ];

    let summaryItems = VERIFIED_OCTOBER_2026_OPPORTUNITIES;
    if (summaryFilter === "pending") summaryItems = pendingOpps;
    else if (summaryFilter === "cancelled") summaryItems = cancelledOpps;
    const displayedSummary = (!showAllSummary && summaryFilter === "all") ? summaryItems.slice(0, 12) : summaryItems;

    return <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(stat => <button key={stat.label} type="button" onClick={() => onNavigate(stat.section)} className={card + " text-left transition hover:border-amber-200/60 focus-visible:outline-2 focus-visible:outline-amber-200"}><span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{stat.label}</span><strong className="mt-3 block break-words font-mono text-2xl font-medium text-amber-100">{stat.value}</strong><span className="mt-3 block text-[11px] text-slate-400">{stat.note} ↗</span></button>)}</div>
      {["financial_dashboard", "finance"].includes(section) && (
        <div role="alert" data-testid="guest-finance-gross-profit-lock" className="rounded-2xl border border-amber-300/40 bg-amber-950/35 p-5 text-sm text-amber-100">
          <p className="font-bold text-amber-200">🔒 Gross Profit Details — Cannot be viewed as a guest user (No se puede ver como usuario invitado)</p>
          <p className="mt-2 leading-relaxed text-slate-200">Detailed gross profit margins (<em>detalles de ganancia en bruto</em>), subcontractor cost spreads, and past months&apos; detailed accounting reports are restricted to TAYCO Administrators and cannot be viewed as a guest user. Current month (<strong>October 2026</strong>) operational records and all 42 project plans remain enabled.</p>
        </div>
      )}
      
      <div className="grid gap-5 xl:grid-cols-2">
        <Surface title="Portfolio project status" eyebrow="Guest view — Pending and Cancelled records only">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <span className="text-xs font-medium text-slate-300">Intake Portfolio Status</span>
              <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-2.5 py-0.5 text-xs font-semibold text-amber-100">
                42 records
              </span>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden="true" />
                  <strong className="font-semibold text-amber-200">Pending</strong>
                  <span className="text-slate-400">({pendingOpps.length} records)</span>
                </div>
                <span className="font-mono font-bold text-amber-300">14%</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-amber-400" style={{ width: "14%" }} />
              </div>
              <p className="mt-2 text-[11px] text-amber-200/80">
                Pending company information &amp; documentation
              </p>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" aria-hidden="true" />
                  <strong className="font-semibold text-rose-200">Cancelled</strong>
                  <span className="text-slate-400">({cancelledOpps.length} records)</span>
                </div>
                <span className="font-mono font-bold text-rose-300">86%</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-rose-500" style={{ width: "86%" }} />
              </div>
              <p className="mt-2 text-[11px] text-rose-200/80">
                Cancelled / bidding window closed
              </p>
            </div>
          </div>
        </Surface>

        <Surface title="Pending & Cancelled Status Summary" eyebrow="Scope review · Zero execution addresses">
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/20 bg-[#0b1c33] p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-200">
                    Pending Projects ({pendingOpps.length})
                  </h4>
                </div>
                <span className="rounded bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                  Awaiting Packet
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Awaiting company qualification packet / proposal follow-up
              </p>
              <div className="mt-3 divide-y divide-slate-800/80 text-xs">
                {pendingOpps.slice(0, 3).map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0">
                    <span className="font-semibold text-white">{item.contractor}</span>
                    <span className="mx-1.5 text-slate-500">—</span>
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-rose-500/20 bg-[#0b1c33] p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-rose-400" aria-hidden="true" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-200">
                    Cancelled Projects ({cancelledOpps.length})
                  </h4>
                </div>
                <span className="rounded bg-rose-400/10 px-2 py-0.5 text-[10px] font-medium text-rose-300">
                  Closed Intake
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Closed or cancelled bidding windows for October 2026
              </p>
              <div className="mt-3 divide-y divide-slate-800/80 text-xs">
                {cancelledOpps.slice(0, 3).map((item) => (
                  <div key={item.id} className="py-2 first:pt-0 last:pb-0">
                    <span className="font-semibold text-white">{item.contractor}</span>
                    <span className="mx-1.5 text-slate-500">—</span>
                    <span className="text-slate-300">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Surface>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Surface title={section === "summary" ? "Pending & Cancelled Projects" : "Current financial records"} eyebrow={month(data.currentPeriod) + " · Read only"}>
          {section === "summary" ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSummaryFilter("all")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      summaryFilter === "all"
                        ? "border border-amber-200/50 bg-amber-200/15 text-amber-100"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    All ({VERIFIED_OCTOBER_2026_OPPORTUNITIES.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilter("pending")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      summaryFilter === "pending"
                        ? "border border-amber-400/50 bg-amber-400/15 text-amber-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    Pending ({pendingOpps.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSummaryFilter("cancelled")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      summaryFilter === "cancelled"
                        ? "border border-rose-400/50 bg-rose-400/15 text-rose-300"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    }`}
                  >
                    Cancelled ({cancelledOpps.length})
                  </button>
                </div>
                {summaryFilter === "all" && (
                  <button
                    type="button"
                    onClick={() => setShowAllSummary(!showAllSummary)}
                    className="text-xs font-medium text-amber-200 underline decoration-amber-200/40 underline-offset-4 hover:text-white"
                  >
                    {showAllSummary ? "Show top 12" : `Show all ${VERIFIED_OCTOBER_2026_OPPORTUNITIES.length}`}
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-left text-xs">
                  <thead className="border-b border-slate-600 text-[10px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="pb-3 font-medium">General Contractor</th>
                      <th className="pb-3 font-medium">Project</th>
                      <th className="pb-3 font-medium">Deadline</th>
                      <th className="pb-3 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {displayedSummary.map((item) => {
                      const isPending = item.status === "Pending company information";
                      return (
                        <tr key={item.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 pr-3 font-medium text-slate-200">
                            <span className="mr-1.5 font-mono text-amber-200/80">#{item.number}</span>
                            <strong className="text-white">{item.contractor}</strong>
                          </td>
                          <td className="py-3 pr-3 text-slate-300">{item.name}</td>
                          <td className="whitespace-nowrap py-3 pr-3 font-mono text-slate-300">
                            {item.reportedDeadline || "Pending"}
                          </td>
                          <td className="whitespace-nowrap py-3 text-right">
                            {isPending ? (
                              <span className="inline-flex whitespace-nowrap items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                                Pending
                              </span>
                            ) : (
                              <span className="inline-flex whitespace-nowrap items-center rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
                                Cancelled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              <p className="mb-5 text-xs leading-relaxed text-slate-400">Recorded management estimates, hours and project scope changes. Amounts retain their source labels and do not imply income or profit.</p>
              {recordCards(records)}
            </>
          )}
        </Surface>
        <GuestMonthlyTotals data={data} selectedPeriod={data.period} onMonthSelect={onMonthSelect}/>
      </div>

      <Surface title="Command center" eyebrow="All workspace modules"><div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[...new Set(guestModuleDefinitions.map(item => item.group))].map(group => <div key={group}><h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[.16em] text-amber-200/70">{group}</h3><div className="space-y-1">{guestModuleDefinitions.filter(item => item.group === group && item.id !== "summary").map(item => <button key={item.id} type="button" onClick={() => onNavigate(item.id)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs text-slate-200 transition hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200"><span>{item.label}</span><span className="font-mono text-amber-200">{item.id === "access" ? "↗" : guestModuleCount(data, item.id)}</span></button>)}</div></div>)}</div></Surface>
    </div>;
  }

  if (section === "projects") {
    let projectItems = VERIFIED_OCTOBER_2026_OPPORTUNITIES;
    if (projectsFilter === "pending") projectItems = pendingOpps;
    else if (projectsFilter === "cancelled") projectItems = cancelledOpps;

    return (
      <Surface title="Pending & Cancelled Portfolio" eyebrow="Guest view · October 2026 Opportunities">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-relaxed text-slate-300">
            Showing verified bidding opportunities for October 2026. Only Pending and Cancelled records are displayed for guest accounts. Project addresses and execution percentages are restricted.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setProjectsFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                projectsFilter === "all"
                  ? "border border-amber-200/50 bg-amber-200/15 text-amber-100"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              All ({VERIFIED_OCTOBER_2026_OPPORTUNITIES.length})
            </button>
            <button
              type="button"
              onClick={() => setProjectsFilter("pending")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                projectsFilter === "pending"
                  ? "border border-amber-400/50 bg-amber-400/15 text-amber-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              Pending ({pendingOpps.length})
            </button>
            <button
              type="button"
              onClick={() => setProjectsFilter("cancelled")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                projectsFilter === "cancelled"
                  ? "border border-rose-400/50 bg-rose-400/15 text-rose-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              Cancelled ({cancelledOpps.length})
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead className="border-b border-slate-600 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3 font-medium">General Contractor</th>
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Deadline</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {projectItems.map((item) => {
                const isPending = item.status === "Pending company information";
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 pr-3 font-medium text-slate-200">
                      <span className="mr-1.5 font-mono text-amber-200/80">#{item.number}</span>
                      <strong className="text-white">{item.contractor}</strong>
                    </td>
                    <td className="py-3 pr-3 text-slate-300">{item.name}</td>
                    <td className="whitespace-nowrap py-3 pr-3 font-mono text-slate-300">
                      {item.reportedDeadline || "Pending"}
                    </td>
                    <td className="whitespace-nowrap py-3 text-right">
                      {isPending ? (
                        <span className="inline-flex whitespace-nowrap items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex whitespace-nowrap items-center rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>
    );
  }

  if (section === "lead") {
    let leadItems = VERIFIED_OCTOBER_2026_OPPORTUNITIES;
    if (leadFilter === "pending") leadItems = pendingOpps;
    else if (leadFilter === "cancelled") leadItems = cancelledOpps;

    return (
      <Surface title="Verified Bidding Intake (Leads)" eyebrow="Guest view · October 2026 Opportunities">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-relaxed text-slate-300">
            Intake opportunities awaiting company information or closed for the current period. Project scopes are displayed without physical addresses.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLeadFilter("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                leadFilter === "all"
                  ? "border border-amber-200/50 bg-amber-200/15 text-amber-100"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              All ({VERIFIED_OCTOBER_2026_OPPORTUNITIES.length})
            </button>
            <button
              type="button"
              onClick={() => setLeadFilter("pending")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                leadFilter === "pending"
                  ? "border border-amber-400/50 bg-amber-400/15 text-amber-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              Pending ({pendingOpps.length})
            </button>
            <button
              type="button"
              onClick={() => setLeadFilter("cancelled")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                leadFilter === "cancelled"
                  ? "border border-rose-400/50 bg-rose-400/15 text-rose-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              Cancelled ({cancelledOpps.length})
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-left text-xs">
            <thead className="border-b border-slate-600 text-[10px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="pb-3 font-medium">General Contractor</th>
                <th className="pb-3 font-medium">Project</th>
                <th className="pb-3 font-medium">Deadline</th>
                <th className="pb-3 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {leadItems.map((item) => {
                const isPending = item.status === "Pending company information";
                return (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 pr-3 font-medium text-white">
                      {item.contractor}
                    </td>
                    <td className="py-3 pr-3 text-slate-300">{item.name}</td>
                    <td className="whitespace-nowrap py-3 pr-3 font-mono text-slate-300">
                      {item.reportedDeadline || "Pending"}
                    </td>
                    <td className="whitespace-nowrap py-3 text-right">
                      {isPending ? (
                        <span className="inline-flex whitespace-nowrap items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex whitespace-nowrap items-center rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
                          Cancelled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>
    );
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
