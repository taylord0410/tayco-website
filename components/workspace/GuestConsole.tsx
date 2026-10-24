"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { GuestConsoleData, GuestConsoleDocument } from "@/lib/guest-workspace";
import { guestModuleDefinitions, type GuestSection } from "@/lib/guest-sections";
import PortalShell from "./PortalShell";
import GuestModulePanel, { GuestMonthlyTotals, guestModuleCount } from "./GuestModulePanel";
import WorkspaceDisplayControls, { useWorkspaceDisplay } from "./WorkspaceDisplayControls";
import { EstimateCostRing } from "./WorkspaceVisuals";
import "./workspace.css";
import GuestPrivacyNotice from "../GuestPrivacyNotice";
import { useReviewInteractions } from "@/lib/use-review-interactions";

export type GuestConsoleSection = GuestSection;
const modules = guestModuleDefinitions.filter(item => item.id !== "purchase_order" && item.id !== "invoice");
const control = "inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-60";
const card = "rounded-xl border border-slate-600/70 bg-[#09172b]/70 p-4 sm:p-5";
const text = (value: string | null | undefined) => value?.trim() || "Not provided";
const money = (value: number | null) => value === null || !Number.isFinite(value) ? "Not provided" : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
function periodLabel(period: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) return "Not provided";
  return new Date(period + "-01T12:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}
function dateLabel(value: string | null) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Not provided" : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <section className="workspace-panel rounded-2xl border p-5 sm:p-7"><h2 className="text-xl font-bold text-white">{title}</h2><div className="mt-5">{children}</div></section>;
}
function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-600 px-5 py-7 text-sm leading-relaxed text-slate-300">{children}</p>;
}

/** Guest-only query surface. No ERP command or administrative module is mounted. */
export default function GuestConsole({ initial, initialSection = "summary" }: { initial: GuestConsoleData; initialSection?: GuestConsoleSection }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [privacyReady,setPrivacyReady]=useState<string|null>(null);
  const [history, setHistory] = useState(initial.historicalSummary.months);
  const [display, setDisplay] = useWorkspaceDisplay();
  const [period, setPeriod] = useState(initial.period);
  const [section, setSection] = useState<GuestConsoleSection>(initialSection);
  const [projectId, setProjectId] = useState("");
  const [selectedViewerDocId, setSelectedViewerDocId] = useState("");
  const [loading, setLoading] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [denied, setDenied] = useState(!initial.detailAllowed && initialSection !== "summary");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accessEnded,setAccessEnded]=useState(false);
  const [serverNow,setServerNow]=useState(Date.parse(initial.asOf));
  useEffect(()=>{if(!initial.review)return;const start=performance.now(),server=Date.parse(initial.asOf);const timer=setInterval(()=>setServerNow(server+performance.now()-start),1000);return()=>clearInterval(timer);},[initial]);
  const pending = useRef<AbortController | null>(null);
  const logoutPending = useRef<AbortController | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);
  const visitId = useRef<string | null>(null);
  const record=useReviewInteractions(initial.review?.id);

  useEffect(() => {
    visitId.current ||= crypto.randomUUID();
    void record("review.visit", {}, visitId.current);
  }, [record,privacyReady]);
  useEffect(()=>()=>{pending.current?.abort();logoutPending.current?.abort();},[]);
  useEffect(() => {
    if (!mobileOpen) return;
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setMobileOpen(false); toggleRef.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !sidebarRef.current?.contains(event.target)) setMobileOpen(false); };
    document.addEventListener("keydown", key); document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside); };
  }, [mobileOpen]);

  async function load(nextPeriod: string, nextSection: GuestConsoleSection, switching = false) {
    if(accessEnded||(data.review&&serverNow>=data.review.expiresAt)){setAccessEnded(true);return;}
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setLoading(true); setError("");
    if (switching) setDenied(false);
    try {
      const response = await fetch("/api/guest-workspace?" + new URLSearchParams({ period: nextPeriod, section: nextSection }), { credentials: "same-origin", cache: "no-store", signal: controller.signal });
      const result = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) {
        if(response.status===401||(response.status===403&&typeof result.reasonCode==="string"&&result.reasonCode.startsWith("review_"))){setAccessEnded(true);return;}
        if (response.status === 401 || response.status === 403) { setDenied(true); throw new Error(response.status === 401 ? "Please sign in again." : nextPeriod < data.currentPeriod && nextSection !== "summary" ? "Month closed" : "Not authorized"); }
        throw new Error(typeof result.error === "string" ? result.error : "The workspace could not be loaded. Please try again.");
      }
      const workspace = result.workspace as GuestConsoleData;
      setData(workspace); setDenied(false);
      setHistory(previous => {
        const retained = workspace.period === workspace.currentPeriod ? previous.filter(month => Number(month.period.slice(0, 4)) !== workspace.historicalSummary.year) : previous;
        return [...new Map([...retained, ...workspace.historicalSummary.months].map(month => [month.period, month])).values()].sort((a, b) => a.period.localeCompare(b.period));
      });
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "The workspace could not be loaded. Please try again.");
    } finally { if (pending.current === controller && !controller.signal.aborted) setLoading(false); }
  }
  function rememberView(nextPeriod: string, nextSection: GuestConsoleSection) {
    const url = new URL(window.location.href);
    url.searchParams.set("period", nextPeriod); url.searchParams.set("section", nextSection);
    window.history.replaceState(null, "", url);
  }
  function navigate(next: GuestConsoleSection, selectedProjectId = "") {
    record("module.select",{section:next});
    setSection(next); setProjectId(selectedProjectId); setMobileOpen(false);
    rememberView(period, next);
    void load(period, next, true);
    window.requestAnimationFrame(() => { moduleRef.current?.focus({ preventScroll: true }); moduleRef.current?.scrollIntoView({ block: "start", behavior: "auto" }); });
  }
  function selectPeriod(next: string) {
    setPeriod(next); setSection("summary"); setProjectId("");
    rememberView(next, "summary");
    void record("month.select", { period: next });
    void load(next, "summary", true);
  }
  async function logout() {
    record("session.signout");
    setSigningOut(true); setError("");
    const controller = new AbortController(); logoutPending.current = controller;
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", signal: controller.signal });
      if (!response.ok) throw new Error("Sign out was not confirmed. Please try again.");
      router.replace("/login"); router.refresh();
    } catch (failure) { if (!controller.signal.aborted) { setError(failure instanceof Error ? failure.message : "Sign out was not confirmed."); setSigningOut(false); } }
  }

  const current = period === data.currentPeriod;
  const matching = data.period === period;
  const details = current && matching && data.detailAllowed && !denied;
  const months = [...new Set([data.currentPeriod, period, ...history.map(month => month.period)])].filter(value => value <= (data.review?.detailPeriod??data.currentPeriod)).sort().reverse();
  const summary = history.find(month => month.period === period);
  const presentationData = { ...data, historicalSummary: { ...data.historicalSummary, months: history } };
  const closedMonth = period < data.currentPeriod && section !== "summary";
  const selectedProject = details ? data.projects.find(project => project.id === projectId) : undefined;
  const estimates = details ? data.estimates.filter(estimate => !projectId || estimate.projectId === projectId) : [];
  const documents = details ? data.documents.filter(document => !projectId || document.projectId === projectId) : [];
  function openProject(id: string) { setProjectId(id); void record("project.open", { projectId: id }); }
  function documentCard(document: GuestConsoleDocument) {
    return <article key={document.id} className={card}><p className="text-xs text-amber-200">{text(document.projectName)}</p><h3 className="mt-2 font-semibold text-white">{text(document.name)}</h3><p className="mt-2 text-xs text-slate-400">{text(document.contentType)}</p>
      {document.available && (document.viewerHref || document.downloadHref) ? <div className="mt-4 flex flex-wrap gap-2">{document.viewerHref && <button type="button" className={control} onClick={() => { setSelectedViewerDocId(document.id); record("document.open", { documentId: document.id }); }}>View in embedded reader</button>}{document.viewerHref && <Link className={control} href={document.viewerHref} onClick={()=>record("document.open",{documentId:document.id})}>Open viewer ↗</Link>}{document.downloadHref && <a className={control} href={document.downloadHref} onClick={()=>record("document.open",{documentId:document.id})}>Open document ↗</a>}</div> : <p className="mt-4 text-sm text-slate-300">Pending availability · TAYCO has not made this document available.</p>}
    </article>;
  }

  if(accessEnded||(data.review&&serverNow>=data.review.expiresAt))return <main className="min-h-screen bg-[#070e1a] p-7 text-slate-100"><h1 className="text-3xl font-bold">Review access has ended</h1><p className="mt-4">Request a new review from TAYCO. Signing in or refreshing does not renew this review.</p><Link className={control} href="/privacy">Privacy &amp; activity notice</Link><button className={control+" mt-6"} onClick={()=>void logout()} disabled={signingOut}>Sign out</button></main>;
  return <PortalShell data-guest-console data-guest-review data-role={data.actor.role} className="workspace-shell min-h-screen bg-[#070e1a] text-slate-100" data-current-module={section === "summary" ? "executive" : section} data-atmosphere={display.atmosphere} data-density={display.density} style={{ "--workspace-light-angle": display.lightAngle + "deg" } as CSSProperties} sidebarRef={sidebarRef} sidebar={<>
    <div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Image src="/logo.jpeg" alt="TAYCO LLC · General Contractor" width={64} height={64} className="h-14 w-14 shrink-0 rounded-xl border border-amber-200/40 bg-[#f3efe2] object-cover shadow-lg"/><div><p className="text-xs font-bold uppercase tracking-widest text-amber-100">Executive command</p><p className="mt-1 text-[11px] text-slate-400">Guest · Read only</p></div></div><button ref={toggleRef} type="button" className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-amber-200/40 px-3 text-xs font-semibold text-amber-100 lg:hidden" aria-controls="tayco-portal-module-tabs" aria-expanded={mobileOpen} onClick={() => {record("menu.toggle");setMobileOpen(!mobileOpen);}}>{mobileOpen ? "Close modules" : "Open modules"}</button></div>
    <nav id="tayco-portal-module-tabs" aria-label="Command Center Navigation" className={(mobileOpen ? "block" : "hidden") + " mt-6 space-y-5 lg:block"}>{[...new Set(modules.map(item => item.group))].map(group => <div key={group}><p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">{group}</p><div className="space-y-1">{modules.filter(item => item.group === group).map(item => <button key={item.id} type="button" onClick={() => navigate(item.id)} aria-current={section === item.id ? "page" : undefined} className={"flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-amber-200 " + (section === item.id ? "border-amber-200/55 bg-gradient-to-r from-amber-200/20 to-amber-200/5 text-amber-100" : "border-transparent text-slate-300 hover:border-amber-200/20 hover:bg-white/5")}><span>{item.label}</span>{details && item.id !== "access" && item.id !== "summary" && <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-amber-100">{guestModuleCount(data, item.id)}</span>}</button>)}</div></div>)}</nav>
    <div className="mt-5 hidden rounded-xl border border-amber-200/25 bg-[#102541] p-4 text-xs leading-relaxed text-slate-300 lg:block">All workspace modules · Read only.<br/>Current month: record details.<br/>Past months: general totals.</div>
  </>} header={<>
    <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Guest workspace · Read only</p><h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{section === "summary" ? "Executive dashboard" : modules.find(item => item.id === section)?.label}</h1><p className="mt-2 break-all text-xs text-slate-400">Signed in as {data.actor.email}</p></div>
    <div className="flex flex-wrap gap-2"><WorkspaceDisplayControls value={display} onChange={next=>{if(next.atmosphere!==display.atmosphere)record("display.theme");if(next.density!==display.density)record("display.density");if(next.lightAngle!==display.lightAngle)record("display.light");setDisplay(next);}}/><button type="button" className={control} onClick={() => {record("review.refresh");void load(period, section);}} disabled={loading || signingOut}>{loading ? "Refreshing…" : "Refresh"}</button><Link href="/account" className={control} onClick={()=>record("account.open")}>Account &amp; password</Link><button type="button" className={control} onClick={() => void logout()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button></div>
  </>}>
    <GuestPrivacyNotice onReady={setPrivacyReady}/>
    {data.review&&<p className="mt-4 rounded-xl border border-amber-200/30 p-3 text-sm text-amber-100">Review ends {new Date(data.review.expiresAt).toLocaleString('en-US',{timeZone:'UTC'})+' UTC'} · {Math.max(0,Math.ceil((data.review.expiresAt-serverNow)/60000))} min remaining. This deadline does not extend.</p>}
    <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><label className="text-xs font-semibold text-slate-300" htmlFor="guest-reporting-month">Reporting month<select id="guest-reporting-month" value={period} onChange={event => selectPeriod(event.target.value)} className="mt-2 block min-h-11 max-w-full rounded-lg border border-slate-500 bg-[#09172b] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-200">{months.map(month => <option key={month} value={month}>{periodLabel(month)}{month === data.currentPeriod ? " · Current" : ""}</option>)}</select></label><p className="text-xs text-slate-400">As of {dateLabel(data.asOf)} · UTC</p></div><p className="mt-3 max-w-3xl text-xs leading-relaxed text-slate-400">Optional review activity is collected only when enabled in your privacy preferences. Free-form text and document contents are not collected by this activity log.</p>
    {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/40 bg-red-950/40 p-4 text-sm text-red-100">{error}{!denied && <p className="mt-1 text-xs">Previously loaded information may be out of date. Use Refresh to try again.</p>}</div>}
    <div ref={moduleRef} tabIndex={-1} aria-busy={loading} className="mt-6 min-w-0 focus:outline-none" data-testid="guest-module">
      <p role="status" aria-live="polite" className="sr-only">{loading ? "Loading workspace" : modules.find(item => item.id === section)?.label}</p>
      {closedMonth ? <Panel title="Month closed"><p className="text-sm text-slate-300">This reporting month is closed. General monthly totals remain available; detailed records are restricted to the current month.</p><button className={control + " mt-5"} type="button" onClick={() => navigate("summary")}>Open general totals</button></Panel> : denied ? <Panel title="Not authorized"><p className="text-sm text-slate-300">{section === "access" ? "Managing users, invitations and assignments requires administrator access. You can manage your own account and password." : "This account cannot open the requested information."}</p>{section === "access" && <Link href="/account" className={control + " mt-5"}>Open your account &amp; password</Link>}</Panel> : section === "summary" ? current ? details ? <GuestModulePanel data={presentationData} section="summary" projectId={projectId} onNavigate={navigate} onMonthSelect={selectPeriod}/> : <Empty>{loading ? "Loading current month…" : "Current month information could not be loaded. Use Refresh to try again."}</Empty> : <div className="space-y-5"><Panel title={periodLabel(period)}>{summary ? <div className={card}><p className="text-xs uppercase tracking-widest text-slate-400">Approximate management estimate · USD</p><p className="mt-3 font-mono text-3xl font-semibold text-amber-100">{money(summary.lowUsd)} – {money(summary.highUsd)}</p><p className="mt-3 text-sm text-slate-300">General monthly totals</p></div> : <Empty>No general summary has been published for this month.</Empty>}<p className="mt-5 text-sm text-slate-300">This month is closed for detail. All modules remain in the navigation; opening a detailed module returns Month closed.</p></Panel><GuestMonthlyTotals data={presentationData} selectedPeriod={period} onMonthSelect={selectPeriod}/></div> : !details ? <Empty>{loading ? "Loading current month…" : "Current month information could not be loaded. Use Refresh to try again."}</Empty> : <>
        {section === "projects" && <Panel title="Projects">{data.projects.length ? <div className="grid gap-4 xl:grid-cols-2">{data.projects.map(project => <article key={project.id} className={card}><p className="text-xs capitalize text-amber-200">{text(project.status).replaceAll("_", " ")}</p><h3 className="mt-2 text-lg font-semibold text-white">{text(project.name)}</h3><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-400">Progress</dt><dd className="mt-1">{project.progress === null ? "Not provided" : project.progress + "%"}</dd></div><div><dt className="text-xs text-slate-400">Location</dt><dd className="mt-1">{text(project.location)}</dd></div><div><dt className="text-xs text-slate-400">Commercial stage</dt><dd className="mt-1 capitalize">{text(project.commercialStage).replaceAll("_", " ")}</dd></div><div><dt className="text-xs text-slate-400">Documents</dt><dd className="mt-1">{project.documentCount}</dd></div></dl><button type="button" className={control + " mt-5"} onClick={() => openProject(project.id)} aria-expanded={projectId === project.id}>Open project details</button></article>)}</div> : <Empty>No projects are available for this month.</Empty>}{selectedProject && <section className="mt-6 border-t border-amber-200/20 pt-5"><h3 className="text-lg font-semibold text-amber-100">{selectedProject.name}</h3><div className="mt-4 flex flex-wrap gap-2"><button className={control} type="button" onClick={() => navigate("estimates", selectedProject.id)}>Review estimates</button><button className={control} type="button" onClick={() => navigate("plans", selectedProject.id)}>Review plans</button></div></section>}</Panel>}
        {(section === "estimates" || section === "plans" || section === "takeoff") && <Panel title={modules.find(item => item.id === section)!.label}><label htmlFor="guest-project-filter" className="text-xs text-slate-300">Project<select id="guest-project-filter" value={projectId} onChange={event => { setProjectId(event.target.value); if (event.target.value) void record("project.open", { projectId: event.target.value }); }} className="mb-5 mt-2 block min-h-11 max-w-full rounded-lg border border-slate-500 bg-[#09172b] px-3 text-sm text-white"><option value="">All current projects</option>{data.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
          {section === "estimates" ? <>
            {estimates.length > 0 && (
              <div className="mb-6 rounded-2xl border border-amber-200/20 bg-[#09172b]/60 p-4 sm:p-6">
                <EstimateCostRing
                  items={estimates.filter(e => typeof e.amountUsd === "number" && e.amountUsd > 0).map((e, idx) => ({
                    code: e.sourceLabel || "EST-" + (idx + 1),
                    label: e.projectName + " · " + e.name,
                    amountUsd: e.amountUsd!,
                  }))}
                  total={estimates.reduce((acc, curr) => acc + (curr.amountUsd || 0), 0)}
                  basis="Current period revisions"
                  title="Estimates"
                />
              </div>
            )}
            {estimates.length ? <div className="grid gap-4 xl:grid-cols-2">{estimates.map(estimate => <article key={estimate.id} className={card}><p className="text-xs text-amber-200">{text(estimate.projectName)}</p><h3 className="mt-2 font-semibold text-white">{text(estimate.name)}</h3><p className="mt-3 text-2xl font-semibold text-amber-100">{money(estimate.amountUsd)}</p><dl className="mt-4 space-y-2 text-sm"><div><dt className="text-xs text-slate-400">Estimate date</dt><dd>{dateLabel(estimate.estimatedOn)}</dd></div><div><dt className="text-xs text-slate-400">Source</dt><dd>{text(estimate.sourceLabel)}</dd></div></dl></article>)}</div> : <Empty>No estimates are available for this selection.</Empty>}
          </> : <>
            {section === "takeoff" && <p className="mb-5 text-sm leading-relaxed text-slate-300">Open an available project plan in the protected Takeoff viewer. Viewer access is read only.</p>}
            {(() => {
              const activeViewerDoc = documents.find(d => d.id === selectedViewerDocId && Boolean(d.viewerHref)) || documents.find(d => Boolean(d.viewerHref));
              return activeViewerDoc?.viewerHref ? (
                <div className="mb-6 space-y-3 rounded-2xl border border-amber-200/30 bg-[#08172b] p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/20 pb-3">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-amber-200">{activeViewerDoc.projectName}</p>
                      <h3 className="mt-1 text-lg font-bold text-white">{activeViewerDoc.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link className={control} href={activeViewerDoc.viewerHref} onClick={() => record("document.open", { documentId: activeViewerDoc.id })}>
                        Open standalone reader ↗
                      </Link>
                    </div>
                  </div>
                  <iframe
                    title={activeViewerDoc.name + " · embedded project reader"}
                    src={activeViewerDoc.viewerHref}
                    className="h-[580px] w-full rounded-xl border border-amber-200/20 bg-[#0b192e]"
                    loading="eager"
                  />
                </div>
              ) : null;
            })()}
            {documents.length ? <div className="grid gap-4 xl:grid-cols-2">{documents.map(documentCard)}</div> : <Empty>No plans or documents are available for this selection.</Empty>}
          </>}
        </Panel>}
        {!["projects", "estimates", "plans", "takeoff"].includes(section) && <GuestModulePanel data={presentationData} section={section} projectId={projectId} onNavigate={navigate} onMonthSelect={selectPeriod}/>}
      </>}
    </div>
  </PortalShell>;
}
