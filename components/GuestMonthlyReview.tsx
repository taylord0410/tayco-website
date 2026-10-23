"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { COMPANY } from "@/lib/company";
import type { guestMonthlyEstimateSummary } from "@/lib/monthly-management-estimates";

type Summary = ReturnType<typeof guestMonthlyEstimateSummary>;
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
const periodLabel = (period: string) => new Date(period + "-01T12:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
const control = "inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200/30 px-4 py-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-50";

export default function GuestMonthlyReview({ initial }: { initial: Summary }) {
  const router = useRouter();
  const [summary, setSummary] = useState(initial);
  const [selected, setSelected] = useState(initial.months.at(-1)?.period || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);
  const chosen = summary.months.find(month => month.period === selected);
  const totalLow = summary.months.reduce((sum, month) => sum + month.lowUsd, 0);
  const totalHigh = summary.months.reduce((sum, month) => sum + month.highUsd, 0);

  async function changeYear(year: string) {
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/guest-summary?" + new URLSearchParams({ year }), { cache: "no-store", signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Monthly summaries could not be loaded.");
      if (!controller.signal.aborted) { setSummary(data.summary); setSelected(data.summary.months.at(-1)?.period || ""); }
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Please try again.");
    } finally { if (pending.current === controller) setBusy(false); }
  }
  async function logout() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!response.ok) throw new Error("Sign out was not confirmed. Please try again.");
      router.replace("/login"); router.refresh();
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }

  return (
    <main data-guest-review className="min-h-svh bg-[linear-gradient(145deg,#142e51_0%,#070e1a_70%)] px-4 py-6 text-slate-100 sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-5 border-b border-amber-200/20 pb-6">
          <div><p className="text-lg font-black tracking-wider text-[#F3D37A]">{COMPANY.name}</p><p className="mt-1 text-xs uppercase tracking-widest text-slate-400">Private monthly review</p></div>
          <nav aria-label="Review account" className="flex flex-wrap gap-2">
            <Link data-ui-event="account.open" href="/account" className={control}>Account &amp; password</Link>
            <button data-ui-event="session.signout" className={control} onClick={logout} disabled={busy}>Sign out</button>
          </nav>
        </header>
        <section className="py-8 sm:py-12" aria-labelledby="guest-review-title">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-amber-200">Completed months · summary access</p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl"><h1 id="guest-review-title" className="text-3xl font-black tracking-tight sm:text-5xl">The year, in perspective.</h1><p className="mt-4 leading-relaxed text-slate-300">Explore monthly gross revenue estimates. Approximate management projections are shown as a range.</p></div>
            <label className="text-sm font-semibold text-slate-300">Reporting year
              <select data-ui-event="year.select" className="ml-3 min-h-11 rounded-xl border border-amber-200/30 bg-[#0f2040] px-4 py-2 text-white" value={summary.year} disabled={busy} onChange={event => changeYear(event.target.value)}>
                {[...new Set([summary.year, ...summary.availableYears])].sort((a, b) => b - a).map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
          </div>
          <p className="mt-6 rounded-xl border border-amber-200/15 bg-amber-100/[0.04] p-4 text-sm leading-relaxed text-slate-300">For this private review, TAYCO records visits and selected controls to improve the experience. Typed form contents are not collected.</p>
        </section>
        {error && <div role="alert" className="mb-6 rounded-xl border border-red-300/30 bg-red-950/40 p-4 text-sm text-red-100">{error}<button className={control + " ml-3"} onClick={() => changeYear(String(summary.year))}>Try again</button></div>}
        <div aria-busy={busy} className="grid min-w-0 gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section aria-labelledby="completed-months-title" className="min-w-0 rounded-2xl border border-amber-200/20 bg-[#0b1a30]/80 p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="completed-months-title" className="text-xl font-bold">Monthly overview</h2><span className="text-xs text-slate-400">{summary.months.length} months recorded</span></div>
            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2" aria-label="Select a completed month">
              {summary.months.map(month => <button key={month.period} data-ui-event="month.select" data-ui-period={month.period} aria-pressed={selected === month.period} onClick={() => setSelected(month.period)} className={"min-w-0 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 " + (selected === month.period ? "border-amber-200/60 bg-amber-200/10" : "border-white/10 bg-white/[0.025] hover:bg-white/5")}>
                <span className="block text-sm font-semibold text-white">{periodLabel(month.period)}</span><span className="mt-2 block text-sm font-bold text-[#F3D37A]">{money(month.lowUsd)}–{money(month.highUsd)}</span><span className="mt-1 block text-xs text-slate-400">Estimated gross revenue</span>
              </button>)}
            </div>
            {!summary.months.length && <p className="mt-6 rounded-xl border border-white/10 p-5 text-sm leading-relaxed text-slate-400">No completed-month projections have been recorded for this year.</p>}
          </section>
          <section aria-labelledby="month-summary-title" className="min-w-0 space-y-5">
            <div className="rounded-2xl border border-amber-200/25 bg-gradient-to-br from-[#183a61] to-[#0b1a30] p-5 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Management projection</p>
              <h2 id="month-summary-title" className="mt-3 text-2xl font-black">{chosen ? periodLabel(chosen.period) : "Select a recorded month"}</h2>
              <p className="mt-6 text-sm text-slate-300">Estimated gross revenue range</p>
              <p className="mt-2 break-words text-3xl font-black leading-tight text-[#F3D37A]">{chosen ? money(chosen.lowUsd) + "–" + money(chosen.highUsd) : "Not recorded"}</p>
              <div className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-5"><div><p className="text-xs text-slate-400">Expenses</p><p className="mt-2 text-sm font-semibold">Not provided</p></div><div><p className="text-xs text-slate-400">Profit</p><p className="mt-2 text-sm font-semibold">Not provided</p></div></div>
              <p className="mt-5 text-xs leading-relaxed text-slate-400">These estimates do not represent confirmed receipts. Detailed project and financial records are outside this review.</p>
            </div>
            {!!summary.months.length && <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7"><h3 className="text-base font-bold">Recorded period outlook</h3><p className="mt-2 text-sm text-slate-400">{summary.months.length} completed months in {summary.year}</p><p className="mt-4 break-words text-2xl font-black text-amber-100">{money(totalLow)}–{money(totalHigh)}</p><p className="mt-2 text-xs leading-relaxed text-slate-400">Combined gross revenue estimate for the months displayed.</p></div>}
          </section>
        </div>
        <footer className="mt-10 border-t border-white/10 pt-6 text-xs leading-relaxed text-slate-400">Private review · Summary access only · {COMPANY.name}</footer>
      </div>
    </main>
  );
}
