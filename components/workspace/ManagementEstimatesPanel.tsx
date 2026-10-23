"use client";

import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { MonthlyManagementEstimate, MonthlyManagementEstimateInput } from "@/lib/monthly-management-estimates";
import { isValidUsdAmount } from "@/lib/financial-values";

export type ManagementEstimatesPanelProps = { compact?: boolean; initialPeriod?: string; onOpenMonth?: (period: string) => void };
type Draft = { period: string; lowUsd: string; highUsd: string; source: string; expectedVersion: number };
const names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const periodPattern = /^(?:19|[2-9]\d)\d{2}-(?:0[1-9]|1[0-2])$/;
const usd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const shortUsd = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
const monthLabel = (period: string) => `${names[Number(period.slice(5, 7)) - 1]} ${period.slice(0, 4)}`;
const rangeLabel = (record: MonthlyManagementEstimate) => `${usd(record.lowUsd)} – ${usd(record.highUsd)}`;
const field = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-amber-200/25 bg-[#09182f] px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-200 disabled:opacity-50";
const action = "workspace-button inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200/40 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-50";
const surface = "workspace-surface min-w-0 rounded-2xl border border-amber-200/25 bg-gradient-to-br from-[#153154] via-[#0f2341] to-[#09172b]";

function isEstimate(value: unknown): value is MonthlyManagementEstimate {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<MonthlyManagementEstimate>;
  return typeof row.period === "string" && periodPattern.test(row.period) && isValidUsdAmount(row.lowUsd) && isValidUsdAmount(row.highUsd) && row.lowUsd <= row.highUsd &&
    typeof row.source === "string" && row.source.trim().length > 0 && typeof row.version === "number" && Number.isSafeInteger(row.version) && row.version > 0 &&
    typeof row.updatedAt === "string" && Number.isFinite(Date.parse(row.updatedAt));
}
function draftOf(period: string, record?: MonthlyManagementEstimate): Draft {
  return { period, lowUsd: record ? String(record.lowUsd) : "", highUsd: record ? String(record.highUsd) : "", source: record?.source ?? "", expectedVersion: record?.version ?? 0 };
}
async function fetchEstimates(signal?: AbortSignal) {
  const response = await fetch("/api/monthly-estimates", { cache: "no-store", credentials: "same-origin", signal });
  const data: { success?: boolean; estimates?: unknown; error?: string } = await response.json();
  if (!response.ok || data.success !== true || !Array.isArray(data.estimates) || !data.estimates.every(isEstimate))
    throw new Error(typeof data.error === "string" ? data.error : "Monthly projections could not be loaded. Please retry.");
  return [...data.estimates].sort((a, b) => b.period.localeCompare(a.period));
}

/** Internal company panel. The server endpoint must resolve and authorize admin/staff actors. */
export default function ManagementEstimatesPanel({ compact = false, initialPeriod, onOpenMonth }: ManagementEstimatesPanelProps) {
  const id = useId();
  const requestedPeriod = typeof initialPeriod === "string" && periodPattern.test(initialPeriod) ? initialPeriod : "";
  const [estimates, setEstimates] = useState<MonthlyManagementEstimate[]>([]);
  const [year, setYear] = useState(requestedPeriod.slice(0, 4));
  const [selectedPeriod, setSelectedPeriod] = useState(requestedPeriod);
  const [acknowledgedPeriod, setAcknowledgedPeriod] = useState(requestedPeriod);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState<Draft>(() => draftOf(requestedPeriod));
  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflict, setConflict] = useState(false);
  const [review, setReview] = useState<{ record: MonthlyManagementEstimate | null } | null>(null);
  const [pendingPeriod, setPendingPeriod] = useState<string | null>(null);
  const draftBaseline = useRef(JSON.stringify(draftOf(requestedPeriod)));
  const startingPeriod = useRef(requestedPeriod);
  const initializeDraft = useRef(true);
  const requestReceipt = useRef<{ fingerprint: string; key: string } | null>(null);
  const savingNow = useRef(false);
  const uncertainNow = useRef(false);
  const intentLocked = saving || uncertain || accessDenied;

  const receiveRows = useCallback((rows: MonthlyManagementEstimate[]) => {
    if (uncertainNow.current) return;
    setEstimates(rows); setLoaded(true); setLoadError(""); setYear(previous => previous || String(new Date().getUTCFullYear()));
    if (initializeDraft.current) {
      initializeDraft.current = false;
      if (startingPeriod.current) {
        const next = draftOf(startingPeriod.current, rows.find(record => record.period === startingPeriod.current));
        draftBaseline.current = JSON.stringify(next); setDraft(next);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchEstimates(controller.signal).then(rows => {
      if (!controller.signal.aborted) { receiveRows(rows); setLoading(false); }
    }, error => {
      if (!controller.signal.aborted) { setLoadError(error instanceof Error ? error.message : "Monthly projections could not be loaded. Please retry."); setLoading(false); }
    });
    return () => controller.abort();
  }, [receiveRows]);

  const reload = async () => {
    if (uncertainNow.current) return estimates;
    setLoading(true); setLoadError("");
    try { const rows = await fetchEstimates(); receiveRows(rows); return rows; }
    catch (error) { setLoadError(error instanceof Error ? error.message : "Monthly projections could not be loaded. Please retry."); throw error; }
    finally { setLoading(false); }
  };
  const retryLoad = () => { void reload().catch(() => { /* Keep existing data and the draft available. */ }); };
  const knownYears = [...new Set([year, ...estimates.map(record => record.period.slice(0, 4)), ...(periodPattern.test(draft.period) ? [draft.period.slice(0, 4)] : [])].filter(Boolean))].sort((a, b) => Number(b) - Number(a));
  const yearRows = estimates.filter(record => record.period.startsWith(`${year}-`));
  const activePeriod = selectedPeriod.startsWith(`${year}-`) ? selectedPeriod : yearRows[0]?.period ?? "";
  const selected = estimates.find(record => record.period === activePeriod);
  const peak = Math.max(1, ...yearRows.map(record => record.highUsd));
  const draftCurrent = estimates.find(record => record.period === draft.period);

  function openDraft(period: string, discard = false) {
    if (savingNow.current || uncertainNow.current || accessDenied) return;
    if (!discard && period === draft.period) return;
    if (!discard && draft.period && JSON.stringify(draft) !== draftBaseline.current) { setPendingPeriod(period); return; }
    const next = draftOf(period, estimates.find(record => record.period === period));
    draftBaseline.current = JSON.stringify(next); setPendingPeriod(null); setDraft(next);
    setSelectedPeriod(period); if (periodPattern.test(period)) setYear(period.slice(0, 4));
    setSaveError(""); setNotice(""); setConflict(false); setReview(null);
    // Do not reset the receipt on navigation: an unchanged, uncertain write can still retry safely.
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (savingNow.current || conflict || accessDenied || pendingPeriod !== null) return;
    setSaveError(""); setNotice("");
    const retry = uncertainNow.current ? requestReceipt.current : null;
    if (uncertainNow.current && !retry) { setSaveError("This projection still needs confirmation. Keep this page open and contact the TAYCO team."); return; }
    const lowUsd = draft.lowUsd.trim() === "" ? NaN : Number(draft.lowUsd), highUsd = draft.highUsd.trim() === "" ? NaN : Number(draft.highUsd);
    if (!periodPattern.test(draft.period) || !isValidUsdAmount(lowUsd) || !isValidUsdAmount(highUsd) || lowUsd > highUsd || !draft.source.trim() || draft.source.length > 1000 || /[\u0000-\u001f\u007f-\u009f]/.test(draft.source)) {
      setSaveError("Choose a month, a valid USD range and a single-line source of up to 1,000 characters."); return;
    }
    const input: MonthlyManagementEstimateInput = retry ? JSON.parse(retry.fingerprint) : { period: draft.period, lowUsd, highUsd, source: draft.source.trim(), expectedVersion: draft.expectedVersion };
    const fingerprint = retry?.fingerprint ?? JSON.stringify(input);
    if (requestReceipt.current?.fingerprint !== fingerprint) requestReceipt.current = { fingerprint, key: crypto.randomUUID() };
    savingNow.current = true; setSaving(true);
    try {
      const response = await fetch("/api/monthly-estimates", { method: "POST", cache: "no-store", credentials: "same-origin", headers: { "Content-Type": "application/json", "Idempotency-Key": requestReceipt.current!.key }, body: fingerprint });
      const data: { success?: boolean; result?: unknown; error?: string } | null = await response.json().catch(() => null);
      if (response.status === 409) {
        uncertainNow.current = false; setUncertain(false);
        setConflict(true); setReview(null); setSaveError("This projection changed. Refresh the current projection and review it before saving your draft."); return;
      }
      if (response.status >= 400 && response.status < 500 && ![408, 425].includes(response.status)) {
        uncertainNow.current = false; setUncertain(false);
        if (response.status === 401 || response.status === 403) {
          setAccessDenied(true); setSaveError("Your session no longer permits projection changes. Sign in again to continue.");
        } else setSaveError(typeof data?.error === "string" ? data.error : "The projection was not saved. Review your draft and try again.");
        return;
      }
      if (!response.ok || data?.success !== true || !isEstimate(data.result) || data.result.period !== input.period || data.result.lowUsd !== input.lowUsd || data.result.highUsd !== input.highUsd || data.result.source !== input.source)
        throw new Error("The save could not be confirmed. Retry the same projection to confirm its outcome.");
      const result = data.result;
      uncertainNow.current = false; setUncertain(false);
      setEstimates(previous => [...previous.filter(record => record.period !== result.period), result].sort((a, b) => b.period.localeCompare(a.period)));
      const confirmed = draftOf(result.period, result);
      draftBaseline.current = JSON.stringify(confirmed); setDraft(confirmed); setSelectedPeriod(result.period); setYear(result.period.slice(0, 4));
      requestReceipt.current = null; setNotice(`${monthLabel(result.period)} projection saved.`);
      try { await reload(); } catch { /* Confirmed save stays visible; the separate refresh warning offers retry. */ }
    } catch (error) {
      uncertainNow.current = true; setUncertain(true);
      setDraft({ period: input.period, lowUsd: String(input.lowUsd), highUsd: String(input.highUsd), source: input.source, expectedVersion: input.expectedVersion });
      setSaveError(error instanceof Error && !(error instanceof TypeError) && !(error instanceof SyntaxError) ? error.message : "The save could not be confirmed. Retry the same projection to confirm its outcome.");
    } finally { savingNow.current = false; setSaving(false); }
  }

  async function refreshForReview() {
    setReview(null);
    try { const rows = await reload(); setReview({ record: rows.find(record => record.period === draft.period) ?? null }); }
    catch { /* Saving remains blocked until the current projection can be reviewed. */ }
  }

  return <section className="min-w-0 space-y-4 text-slate-100" data-testid={compact ? "management-estimates-compact" : "management-estimates-panel"} aria-labelledby={`${id}-title`}>
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0"><p className="workspace-eyebrow text-[11px] font-semibold uppercase tracking-[.18em] text-amber-200">Management projection</p><h3 id={`${id}-title`} className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">Estimated monthly gross</h3><p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-400">Company planning ranges in USD. Actual invoice and payment reporting is available separately.</p></div>
      {loaded && <label className="block min-w-[7rem] text-xs font-semibold text-amber-100">Projection year<select className={field} disabled={intentLocked} value={year} onChange={event => { setYear(event.target.value); setSelectedPeriod(""); }}>{knownYears.map(value => <option value={value} key={value}>{value}</option>)}</select></label>}
    </header>
    {requestedPeriod && requestedPeriod !== acknowledgedPeriod && <aside role="status" className="space-y-3 rounded-xl border border-amber-200/30 bg-amber-200/10 p-4 text-sm text-amber-100"><p>{monthLabel(requestedPeriod)} was selected in the financial overview. Your current projection draft is retained.</p><div className="flex flex-wrap gap-3"><button type="button" className={action} disabled={!loaded || intentLocked || conflict} onClick={() => { setAcknowledgedPeriod(requestedPeriod); setSelectedPeriod(requestedPeriod); setYear(requestedPeriod.slice(0, 4)); if (!compact) openDraft(requestedPeriod); }}>Open requested month</button><button type="button" className={action} disabled={intentLocked} onClick={() => setAcknowledgedPeriod(requestedPeriod)}>Keep current month</button></div></aside>}
    {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/40 bg-amber-300/10 p-4 text-sm text-amber-100"><p className="min-w-0 flex-1 break-words">{loadError}</p><button type="button" className={action} disabled={loading || intentLocked} onClick={retryLoad}>{loading ? "Refreshing…" : "Retry loading"}</button></div>}
    {!loaded && loading && <p role="status" className={`${surface} p-5 text-sm text-slate-300`}>Loading monthly projections…</p>}
    {loaded && <div className={`${surface} p-4 sm:p-5`}><div className="workspace-surface-content">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-200/15 pb-4"><div><h4 className="font-bold text-white">{year} · projected gross ranges</h4><p className="mt-2 text-xs text-slate-400">{yearRows.length} {yearRows.length === 1 ? "month" : "months"} recorded · select a month to review its source</p></div><span className="font-mono text-[11px] text-amber-100">USD · estimate</span></div>
      {yearRows.length === 0 ? <div className="py-7 text-sm leading-relaxed text-slate-300"><p>No management projections have been recorded for {year}.</p>{!compact && <p className="mt-2 text-xs text-slate-400">Add an explicit monthly range and its source below.</p>}</div> : <>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400"><span className="inline-flex items-center gap-2"><i aria-hidden="true" className="h-2 w-6 rounded-full bg-gradient-to-r from-amber-600 to-amber-200" />Low–high management range</span><span>Shared scale: $0–{shortUsd(peak)}</span></div>
        <div className={`mt-3 grid min-w-0 gap-2 ${compact ? "grid-cols-3 sm:grid-cols-4 xl:grid-cols-6" : "xl:grid-cols-2 xl:gap-x-5"}`} role="group" aria-label={`Monthly estimated gross ranges for ${year}`}>
          {names.map((name, index) => {
            const period = `${year}-${String(index + 1).padStart(2, "0")}`, record = yearRows.find(row => row.period === period), active = activePeriod === period;
            return <button key={period} type="button" disabled={intentLocked} aria-pressed={active} aria-label={`${name} ${year}: ${record ? `estimated gross ${rangeLabel(record)}` : "no projection recorded"}`} onClick={() => setSelectedPeriod(period)} className={`min-h-[4.25rem] min-w-0 rounded-lg border px-3 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-amber-200 ${active ? "border-amber-200/60 bg-amber-200/10" : "border-white/5 bg-[#07172b]/40 hover:border-amber-200/25"}`}>
              <span className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><span className="text-xs font-semibold text-slate-200">{compact ? name.slice(0, 3) : name}</span><span className={`min-w-0 break-words font-mono ${compact ? "text-[10px]" : "text-xs"} tabular-nums ${record ? "text-amber-100" : "text-slate-500"}`}>{record ? compact ? `${shortUsd(record.lowUsd)}–${shortUsd(record.highUsd)}` : rangeLabel(record) : compact ? "No estimate" : "No projection recorded"}</span></span>
              <span aria-hidden="true" className="relative mt-2.5 block h-2 overflow-hidden rounded-full bg-slate-700/45">{record && <span className="absolute inset-y-0 rounded-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-100" style={{ left: `min(${record.lowUsd / peak * 100}%, calc(100% - 4px))`, width: `${Math.max(.8, (record.highUsd - record.lowUsd) / peak * 100)}%`, minWidth: 4 }} />}</span>
            </button>;
          })}
        </div>
      </>}
      {activePeriod && <aside className="mt-4 min-w-0 rounded-xl border border-amber-200/20 bg-[#07172b]/65 p-4" aria-label="Selected projection source"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold text-amber-100">{monthLabel(activePeriod)}</p><p className="mt-2 break-words font-mono text-lg font-bold text-white">{selected ? rangeLabel(selected) : "No projection recorded"}</p></div>{compact && onOpenMonth && <button type="button" className={action} disabled={intentLocked} onClick={() => onOpenMonth(activePeriod)}>Open month</button>}{!compact && <button type="button" className={action} disabled={intentLocked || conflict} onClick={() => { openDraft(activePeriod); document.getElementById(`${id}-editor`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }}>{selected ? "Edit projection" : "Add projection"}</button>}</div>{selected && <><p className="mt-3 whitespace-pre-wrap break-all text-xs leading-relaxed text-slate-300"><span className="font-semibold text-slate-400">Source: </span>{selected.source}</p><p className="mt-2 text-[11px] text-slate-500">Updated {new Date(selected.updatedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" })} UTC</p></>}</aside>}
    </div></div>}
    {!compact && loaded && <details id={`${id}-editor`} open={Boolean(draft.period)} className={`${surface} scroll-mt-24 p-4 sm:p-5`}><summary aria-disabled={intentLocked} onClick={event => { if (intentLocked) event.preventDefault(); }} className="min-h-11 cursor-pointer text-sm font-bold text-amber-100">Add or revise a monthly projection</summary><form onSubmit={submit} className="workspace-surface-content mt-4 min-w-0 space-y-4">
      <p className="text-xs leading-relaxed text-slate-400">Record the estimated gross range provided by company management, with its supporting source.</p>
      {pendingPeriod !== null && <div role="alert" className="space-y-3 rounded-xl border border-amber-200/35 bg-amber-200/10 p-4 text-sm text-amber-100"><p>Your {monthLabel(draft.period)} draft has unsaved changes. Loading {pendingPeriod ? monthLabel(pendingPeriod) : "another month"} will replace this draft.</p><div className="flex flex-wrap gap-3"><button type="button" className={action} disabled={intentLocked} onClick={() => setPendingPeriod(null)}>Keep this draft</button><button type="button" className={action} disabled={intentLocked} onClick={() => openDraft(pendingPeriod, true)}>Load selected month</button></div></div>}
      <fieldset disabled={intentLocked || conflict || pendingPeriod !== null} className="grid min-w-0 gap-4 disabled:opacity-65 sm:grid-cols-2">
        <label className="block min-w-0 text-xs font-semibold text-amber-100">Projection month<input type="month" min="1900-01" max="9999-12" required className={field + " [color-scheme:dark]"} value={draft.period} onChange={event => openDraft(event.target.value)} /></label>
        <div className="self-end rounded-lg border border-white/10 bg-[#07172b]/50 p-3 text-xs leading-relaxed text-slate-400">{draft.period ? <>{monthLabel(draft.period)}<span className="mt-1 block">{draft.expectedVersion ? `Editing version ${draft.expectedVersion}` : "New monthly projection"}</span></> : "Choose the month to add or revise."}</div>
        <label className="block min-w-0 text-xs font-semibold text-amber-100">Low estimate · USD<input type="number" min="0" max="10000000000" step="0.01" inputMode="decimal" required disabled={!draft.period} className={field} value={draft.lowUsd} onChange={event => setDraft(previous => ({ ...previous, lowUsd: event.target.value }))} /></label>
        <label className="block min-w-0 text-xs font-semibold text-amber-100">High estimate · USD<input type="number" min="0" max="10000000000" step="0.01" inputMode="decimal" required disabled={!draft.period} className={field} value={draft.highUsd} onChange={event => setDraft(previous => ({ ...previous, highUsd: event.target.value }))} /></label>
        <label className="block min-w-0 text-xs font-semibold text-amber-100 sm:col-span-2">Management source<input type="text" required maxLength={1000} disabled={!draft.period} placeholder="Company statement, date or supporting record" className={field} value={draft.source} onChange={event => setDraft(previous => ({ ...previous, source: event.target.value }))} /><span className="mt-2 block text-[11px] font-normal leading-relaxed text-slate-400">Use a short attribution that another team member can review.</span></label>
      </fieldset>
      {!conflict && draftCurrent && draftCurrent.version !== draft.expectedVersion && <p className="text-xs leading-relaxed text-amber-100">A newer version is available. Your draft keeps the version you opened; saving will ask you to review any conflict.</p>}
      {saveError && <p role="alert" className="rounded-lg border border-amber-300/35 bg-amber-300/10 p-3 text-sm leading-relaxed text-amber-100">{saveError}</p>}
      {conflict && <div className="space-y-3 rounded-xl border border-amber-200/35 bg-[#07172b]/70 p-4">
        <p className="text-xs leading-relaxed text-slate-300">Your draft is retained. Review the current projection before using its latest version.</p><button type="button" className={action} disabled={loading || intentLocked} onClick={() => { void refreshForReview(); }}>{loading ? "Refreshing…" : "Refresh current projection"}</button>
        {review && <div className="min-w-0 space-y-3 border-t border-amber-200/15 pt-3"><p className="text-xs font-bold text-amber-100">Current {monthLabel(draft.period)} projection{review.record ? ` · version ${review.record.version}` : ""}</p><p className="break-words font-mono text-sm text-white">{review.record ? rangeLabel(review.record) : "No monthly projection is currently recorded."}</p>{review.record && <p className="break-all text-xs leading-relaxed text-slate-300">Source: {review.record.source}</p>}<button type="button" className={action} disabled={loading || intentLocked} onClick={() => { setDraft(previous => ({ ...previous, expectedVersion: review.record?.version ?? 0 })); setConflict(false); setReview(null); setSaveError(""); requestReceipt.current = null; setNotice("Current version reviewed. Check your retained range and source, then save when ready."); }}>Use reviewed version</button></div>}
      </div>}
      {notice && <p role="status" className="rounded-lg border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm leading-relaxed text-emerald-100">{notice}</p>}
      {uncertain && <p role="status" className="text-xs leading-relaxed text-amber-100">This projection is awaiting confirmation. Its month, range and source are held until the same request is confirmed.</p>}
      <div className="flex flex-wrap items-center gap-3"><button type="submit" disabled={saving || conflict || accessDenied || pendingPeriod !== null || !draft.period} className={action + " bg-amber-200/10"}>{saving ? uncertain ? "Retrying projection…" : "Saving projection…" : uncertain ? "Retry same projection" : "Save projection"}</button><p className="text-[11px] leading-relaxed text-slate-400">Management estimate · USD range</p></div>
    </form></details>}
  </section>;
}
