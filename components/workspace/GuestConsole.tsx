"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { GuestConsoleData, GuestConsoleDocument } from "@/lib/guest-workspace";
import { guestModuleDefinitions, type GuestSection } from "@/lib/guest-sections";
import PortalShell from "./PortalShell";
import GuestModulePanel, { guestModuleCount } from "./GuestModulePanel";
import WorkspaceDisplayControls, { useWorkspaceDisplay } from "./WorkspaceDisplayControls";
import { EstimateCostRing } from "./WorkspaceVisuals";
import "./workspace.css";
import "./dashboard-command-center.css";
import DashboardCommandCenter from "./DashboardCommandCenter";
import CorporateSectionExecutivePanel from "./CorporateSectionExecutivePanel";
import TakeoffProjectReader from "./TakeoffProjectReader";
import CorporateIcon from "./CorporateIcons";
import GuestPrivacyNotice from "../GuestPrivacyNotice";
import { useReviewInteractions } from "@/lib/use-review-interactions";

export type GuestConsoleSection = GuestSection;
const modules = guestModuleDefinitions.filter(item => item.id !== "purchase_order" && item.id !== "invoice" && item.id !== "plans" && item.id !== "takeoff");
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

const GUEST_ALLOWED_SECTIONS = new Set<string>([
  "summary",
  "projects",
  "lead",
]);

const GUEST_MODULE_LABELS: Record<string, string> = {
  summary: "Dashboard",
  projects: "Projects",
  invoice: "Billing",
  financial_dashboard: "Accounting",
  team: "Administration",
  lead: "New Opportunities",
  hours: "Payroll",
  compliance: "Compliance",
  plans: "Documents",
  takeoff: "Takeoff Plans",
  corporate_meetings: "Meetings",
  dossier: "Corporate Reports",
};

/** Guest-only query surface. No ERP command or administrative module is mounted. */
export default function GuestConsole({ initial, initialSection = "summary" }: { initial: GuestConsoleData; initialSection?: GuestConsoleSection }) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [privacyReady,setPrivacyReady]=useState<string|null>(null);
  const [history, setHistory] = useState(initial.historicalSummary.months);
  const [display, setDisplay] = useWorkspaceDisplay();
  const [period, setPeriod] = useState(initial.period);
  const [section, setSection] = useState<GuestConsoleSection>(
    GUEST_ALLOWED_SECTIONS.has(initialSection) ? initialSection : "summary"
  );
  const [adminOnlyModalLabel, setAdminOnlyModalLabel] = useState<string | null>(null);
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
    if (!GUEST_ALLOWED_SECTIONS.has(next)) {
      record("module.select", { section: next });
      const label =
        GUEST_MODULE_LABELS[next] ||
        modules.find((item) => item.id === next)?.label ||
        "Administrative Module";
      setAdminOnlyModalLabel(label);
      setMobileOpen(false);
      return;
    }
    record("module.select",{section:next});
    setSection(next); setProjectId(selectedProjectId); setMobileOpen(false);
    rememberView(period, next);
    void load(period, next, true);
    window.requestAnimationFrame(() => { moduleRef.current?.focus({ preventScroll: true }); moduleRef.current?.scrollIntoView({ block: "start", behavior: "auto" }); });
  }
  function selectPeriod(next: string) {
    if (next !== data.currentPeriod) {
      setAdminOnlyModalLabel(`Historical Period (${periodLabel(next)})`);
      return;
    }
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
    <div className="flex flex-col items-center border-b border-amber-200/20 pb-5 text-center">
      <div className="flex w-full items-center justify-end lg:hidden">
        <button ref={toggleRef} type="button" className="inline-flex min-h-9 shrink-0 items-center rounded-lg border border-amber-200/40 px-3 text-xs font-semibold text-amber-100" aria-controls="tayco-portal-module-tabs" aria-expanded={mobileOpen} onClick={() => {record("menu.toggle");setMobileOpen(!mobileOpen);}}>{mobileOpen ? "Close" : "Menu"}</button>
      </div>
      <div className="relative flex h-24 w-28 items-center justify-center rounded-2xl border border-[#C9A84C]/55 bg-gradient-to-b from-[#132847] to-[#081221] p-2 shadow-[0_10px_28px_rgba(0,0,0,0.65)]">
        <Image src="/logo.png" alt="TAYCO Construction Group" width={110} height={90} className="h-20 w-auto object-contain drop-shadow-[0_4px_12px_rgba(201,168,76,0.45)]"/>
      </div>
      <p className="mt-2.5 text-lg font-extrabold tracking-[0.14em] text-[#eab869]">TAYCO</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-100/80">Construction Group</p>
    </div>
    <nav id="tayco-portal-module-tabs" aria-label="Command Center Navigation" className={(mobileOpen ? "block" : "hidden") + " mt-4 space-y-1.5 lg:block"}>
      {[
        { id: "summary" as GuestConsoleSection, label: "Dashboard" },
        { id: "projects" as GuestConsoleSection, label: "Projects" },
        { id: "invoice" as GuestConsoleSection, label: "Billing" },
        { id: "financial_dashboard" as GuestConsoleSection, label: "Accounting" },
        { id: "team" as GuestConsoleSection, label: "Administration" },
        { id: "lead" as GuestConsoleSection, label: "New Opportunities" },
        { id: "hours" as GuestConsoleSection, label: "Payroll" },
        { id: "compliance" as GuestConsoleSection, label: "Compliance" },
        { id: "corporate_meetings" as GuestConsoleSection, label: "Meetings" },
        { id: "dossier" as GuestConsoleSection, label: "Corporate Reports" },
      ].map(item => {
        const isLocked = !GUEST_ALLOWED_SECTIONS.has(item.id);
        return (
          <button key={item.id} type="button" onClick={() => navigate(item.id)} aria-current={section === item.id ? "page" : undefined} className={"flex min-h-10 w-full items-center justify-between gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-amber-200 " + (section === item.id ? "border-l-[3px] border-amber-300/60 border-l-[#eab869] bg-gradient-to-r from-[#c9a84c]/30 via-[#c9a84c]/15 to-transparent text-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]" : "border-transparent text-slate-300 hover:border-amber-200/20 hover:bg-white/5")}>
            <span className="flex items-center gap-2.5 truncate">
              <CorporateIcon name={item.id} className="h-4 w-4 shrink-0 text-[#eab869]" />
              <span className="truncate">{item.label}</span>
            </span>
            {isLocked && (
              <CorporateIcon name="lock" className="h-3.5 w-3.5 shrink-0 text-amber-300/55" />
            )}
          </button>
        );
      })}
      <details className="mt-4 rounded-xl border border-slate-700/60 bg-[#07111f]/60 p-2">
        <summary className="cursor-pointer px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/75">Additional Modules</summary>
        <div className="mt-2 space-y-3">
          {[...new Set(modules.map(item => item.group))].map(group => <div key={group}><p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-amber-200/60">{group}</p><div className="space-y-1">{modules.filter(item => item.group === group).map(item => <button key={item.id} type="button" onClick={() => navigate(item.id)} aria-current={section === item.id ? "page" : undefined} className={"flex min-h-9 w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-semibold transition " + (section === item.id ? "border-amber-200/55 bg-amber-200/15 text-amber-100" : "border-transparent text-slate-300 hover:bg-white/5")}><span>{item.label}</span></button>)}</div></div>)}
        </div>
      </details>
    </nav>
    <div className={(mobileOpen ? "block" : "hidden") + " mt-6 rounded-xl border border-[#C9A84C]/35 bg-gradient-to-b from-[#0e2038] to-[#081322] p-3.5 text-center shadow-inner lg:block"}>
      <p className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#eab869]">
        <CorporateIcon name="lock" className="h-3.5 w-3.5 text-[#eab869]" /> INTERNAL SYSTEM
      </p>
      <p className="mt-1 text-[11px] leading-snug text-slate-300">Restricted access<br/>Authorized personnel only</p>
    </div>
  </>} header={<>
    <div className="min-w-0">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Monthly Corporate Panel</h1>
        <span className="text-xs font-medium text-slate-300 sm:text-sm">Monthly evaluation · <strong className="font-semibold text-amber-200">TAYCO Construction Group</strong></span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Active view: <span className="font-semibold text-amber-100">{section === "summary" ? "Dashboard" : modules.find(item => item.id === section)?.label}</span> · Signed in as {data.actor.email}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-amber-200/30 bg-[#0d1f38] px-3.5 py-2 text-xs shadow-sm">
        <CorporateIcon name="lock" className="h-4 w-4 shrink-0 text-amber-300" />
        <div className="leading-tight">
          <p className="font-bold text-white">Private Access</p>
          <p className="text-[10px] text-slate-300">Username &amp; password required</p>
        </div>
      </div>
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#eab869]/55 bg-gradient-to-r from-[#243b5a] to-[#152843] px-3.5 py-2 text-xs shadow-sm">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eab869]/25 text-amber-200" aria-hidden="true"><CorporateIcon name="user" className="h-3.5 w-3.5 text-amber-200" /></span>
        <div className="leading-tight">
          <p className="font-bold text-amber-100">Corporate Portal · TAYCO</p>
          <p className="text-[10px] text-amber-200/80">Internal Console · Active</p>
        </div>
      </div>
      <WorkspaceDisplayControls value={display} onChange={next=>{if(next.atmosphere!==display.atmosphere)record("display.theme");if(next.density!==display.density)record("display.density");if(next.lightAngle!==display.lightAngle)record("display.light");setDisplay(next);}}/>
      <button type="button" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-amber-200/30 bg-[#0c1d34] px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/10 disabled:opacity-60" onClick={() => {record("review.refresh");void load(period, section);}} disabled={loading || signingOut}>{loading ? "Refreshing…" : "Refresh"}</button>
      <Link href="/account" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-amber-200/30 bg-[#0c1d34] px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/10" onClick={()=>record("account.open")}>Account</Link>
      <button type="button" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-amber-200/30 bg-[#0c1d34] px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/10 disabled:opacity-60" onClick={() => void logout()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button>
    </div>
  </>}>
    <GuestPrivacyNotice onReady={setPrivacyReady}/>

    {adminOnlyModalLabel && (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-console-admin-only-title"
        data-testid="guest-admin-only-modal"
        onClick={() => setAdminOnlyModalLabel(null)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(3, 8, 18, 0.78)",
          backdropFilter: "blur(6px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.25rem",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "490px",
            width: "100%",
            background: "linear-gradient(180deg, #0d1f3a 0%, #071326 100%)",
            border: "1px solid rgba(212, 175, 55, 0.45)",
            borderRadius: "14px",
            padding: "1.6rem 1.75rem",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.65)",
            color: "#f8fafc",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.85rem" }}>
            <span
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "rgba(212, 175, 55, 0.16)",
                border: "1px solid rgba(212, 175, 55, 0.4)",
                color: "#f3d37a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <CorporateIcon name="lock" className="h-5 w-5 text-[#eab869]" />
            </span>
            <div>
              <p style={{ margin: 0, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#eab869", fontWeight: 700 }}>
                Restricted Corporate Module
              </p>
              <h4 id="guest-console-admin-only-title" style={{ margin: "0.15rem 0 0", fontSize: "1.08rem", fontWeight: 700, color: "#ffffff" }}>
                Administrator Access Only
              </h4>
            </div>
          </div>
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.86rem", lineHeight: 1.55, color: "#cbd5e1" }}>
            <strong>{adminOnlyModalLabel}</strong> can only be viewed by authorized corporate administrators.
          </p>
          <p style={{ margin: "0 0 1.25rem", fontSize: "0.8rem", lineHeight: 1.5, color: "#94a3b8" }}>
            Guest accounts have full access to the current month&apos;s <strong>Opportunities &amp; Projects</strong>, interactive <strong>Blueprints / Plans</strong>, and the <strong>2026 Monthly Excel Workbooks (Jan–Oct 2026)</strong>.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "0.55rem" }}>
            <button
              type="button"
              onClick={() => {
                setAdminOnlyModalLabel(null);
                navigate("lead");
              }}
              style={{
                padding: "0.48rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid rgba(212, 175, 55, 0.35)",
                background: "rgba(15, 31, 56, 0.85)",
                color: "#f3d37a",
                fontWeight: 600,
                fontSize: "0.78rem",
                cursor: "pointer",
              }}
            >
              Opportunities &amp; Plans
            </button>
            <button
              type="button"
              onClick={() => setAdminOnlyModalLabel(null)}
              style={{
                padding: "0.48rem 1.1rem",
                borderRadius: "8px",
                border: "1px solid rgba(212, 175, 55, 0.55)",
                background: "linear-gradient(135deg, #d4af37 0%, #b58922 100%)",
                color: "#06101e",
                fontWeight: 700,
                fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              Understood
            </button>
          </div>
        </div>
      </div>
    )}


    {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/40 bg-red-950/40 p-4 text-sm text-red-100">{error}{!denied && <p className="mt-1 text-xs">Previously loaded information may be out of date. Use Refresh to try again.</p>}</div>}
    <div ref={moduleRef} tabIndex={-1} aria-busy={loading} className="mt-6 min-w-0 focus:outline-none" data-testid="guest-module">
      <p role="status" aria-live="polite" className="sr-only">{loading ? "Loading workspace" : modules.find(item => item.id === section)?.label}</p>
      {closedMonth || denied || section === "summary" ? (
        <DashboardCommandCenter
          isGuest
          guestData={presentationData}
          asOf={data.asOf}
          projectId={projectId}
          onNavigate={(view, projId, month) => {
            if (month && month !== period) selectPeriod(month);
            else navigate(view as GuestConsoleSection, projId);
          }}
        />
      ) : <>
        <CorporateSectionExecutivePanel
          activeTab={section}
          isGuest
          period={period}
          onNavigate={(nextSection, projId) => navigate((nextSection === "executive" ? "summary" : nextSection) as GuestConsoleSection, projId)}
        />

        {(section === "estimates" || section === "takeoff") && <Panel title={modules.find(item => item.id === section)!.label}><label htmlFor="guest-project-filter" className="text-xs text-slate-300">Project<select id="guest-project-filter" value={projectId} onChange={event => { setProjectId(event.target.value); if (event.target.value) void record("project.open", { projectId: event.target.value }); }} className="mb-5 mt-2 block min-h-11 max-w-full rounded-lg border border-slate-500 bg-[#09172b] px-3 text-sm text-white"><option value="">All current projects</option>{data.projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
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
                  <TakeoffProjectReader
                    source={"/api/documents/" + encodeURIComponent(activeViewerDoc.id)}
                    projectName={activeViewerDoc.projectName + " · " + activeViewerDoc.name}
                    privacyNotice={false}
                  />
                </div>
              ) : null;
            })()}
            {documents.length ? <div className="grid gap-4 xl:grid-cols-2">{documents.map(documentCard)}</div> : <Empty>No plans or documents are available for this selection.</Empty>}
          </>}
        </Panel>}
      </>}
    </div>
  </PortalShell>;
}
