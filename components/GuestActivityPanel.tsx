"use client";

import ReviewAuditPanel from "./ReviewAuditPanel";
import { useEffect, useId, useRef, useState } from "react";
import type { GuestActivityElement, GuestActivityReport } from "../lib/guest-activity";

const ELEMENT_LABELS: Record<GuestActivityElement, string> = {
  "review.visit": "Review opened",
  "account.open": "Account settings opened",
  "session.signout": "Sign out selected",
  "year.select": "Year selected",
  "month.select": "Month selected",
  "summary.retry": "Summary retry selected",
  "project.open": "Project reader selected",
};
const button = "min-h-11 rounded-xl border border-[#173252]/20 bg-white px-4 py-2 text-sm font-semibold text-[#173252] transition hover:bg-[#f6f3ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a66a20] disabled:cursor-wait disabled:opacity-60";
const number = new Intl.NumberFormat("en-US");
const date = new Intl.DateTimeFormat("en-US", {
  year: "numeric", month: "short", day: "numeric",
  hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC",
});

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function validDate(value: unknown): value is string {
  return typeof value === "string" && value.length <= 40 && Number.isFinite(Date.parse(value));
}
function validCount(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}
function knownElement(value: unknown): value is GuestActivityElement {
  return typeof value === "string" && Object.hasOwn(ELEMENT_LABELS, value);
}
function isReport(value: unknown): value is GuestActivityReport & { success: true } {
  if (!object(value) || value.success !== true || !validCount(value.totalEvents)
    || !Number.isInteger(value.retentionDays) || Number(value.retentionDays) < 1
    || Number(value.retentionDays) > 365 || !validDate(value.windowStart)
    || !validDate(value.generatedAt) || !Array.isArray(value.counts)
    || value.counts.length > Object.keys(ELEMENT_LABELS).length || !Array.isArray(value.events) || value.events.length > 200) return false;
  return value.counts.every(row => object(row) && knownElement(row.elementId) && validCount(row.count))
    && value.events.every(event => object(event) && knownElement(event.elementId)
      && typeof event.eventId === "string" && event.eventId.length > 0 && event.eventId.length <= 100
      && typeof event.actorId === "string" && event.actorId.length > 0 && event.actorId.length <= 200
      && event.page === "portal" && validDate(event.createdAt)
      && (event.elementId === "project.open"
        ? typeof event.projectId === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(event.projectId) && event.period === undefined && event.year === undefined
        : event.projectId === undefined)
      && (event.period === undefined || (typeof event.period === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(event.period)))
      && (event.year === undefined || (typeof event.year === "number" && Number.isSafeInteger(event.year))));
}

async function fetchReport(signal: AbortSignal): Promise<GuestActivityReport> {
  const response = await fetch("/api/guest-activity", {
    cache: "no-store", credentials: "same-origin", signal,
  });
  if (response.status === 401) throw new Error("Your session has expired. Sign in again to view guest activity.");
  if (response.status === 403) throw new Error("Administrator access is required to view guest activity.");
  if (!response.ok) throw new Error("Guest activity could not be loaded. Please try again.");
  const data: unknown = await response.json();
  if (!isReport(data)) throw new Error("The activity report could not be read. Please try again.");
  return data;
}
function accountLabel(actorId: string) {
  return "Account " + (actorId.length > 18 ? actorId.slice(0, 9) + "…" + actorId.slice(-6) : actorId);
}
function projectLabel(projectId: string) {
  return "Project " + (projectId.length > 18 ? projectId.slice(0, 9) + "…" + projectId.slice(-6) : projectId);
}
function timestamp(value: string) {
  return date.format(new Date(value)) + " UTC";
}

/** Mount only in the administrator account view; the report API enforces access. */
export default function GuestActivityPanel() {
  const headingId = useId();
  const [report, setReport] = useState<GuestActivityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    void fetchReport(controller.signal).then(data => {
      if (!controller.signal.aborted) setReport(data);
    }).catch((failure: unknown) => {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Guest activity could not be loaded.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => { request.current?.abort(); };
  }, []);

  async function refresh() {
    if (loading) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      const data = await fetchReport(controller.signal);
      if (!controller.signal.aborted) setReport(data);
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Guest activity could not be loaded.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  const visits = report?.counts.filter(row => row.elementId === "review.visit")
    .reduce((sum, row) => sum + row.count, 0) ?? 0;
  const clicks = report?.counts.filter(row => row.elementId !== "review.visit")
    .reduce((sum, row) => sum + row.count, 0) ?? 0;

  return <><ReviewAuditPanel/><section aria-labelledby={headingId} className="min-w-0 space-y-5 border-t border-[#173252]/10 pt-6 text-[#173252]">
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
      <div className="min-w-0 flex-1 basis-52">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#946020]">Administrator review</p>
        <h2 id={headingId} className="text-xl font-semibold">Earlier monthly review controls</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">This earlier monthly control report is separate from the review-specific audit above.</p>
      </div>
      <button type="button" className={button} disabled={loading} onClick={() => void refresh()}>
        {loading && report ? "Refreshing…" : "Refresh report"}
      </button>
    </div>

    <p className="rounded-xl border border-[#d9bd8e]/40 bg-[#faf7f0] p-3 text-sm leading-relaxed text-slate-600">
      Activity collection is best effort. These records may miss visits or clicks and do not prove that a guest read a summary.
      Only the identified review controls are included.
    </p>

    {loading && <p role="status" className="text-sm text-slate-600">{report ? "Refreshing guest review activity…" : "Loading guest review activity…"}</p>}
    {error && <div role="alert" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{error}</p>
      {report && <p>The previously loaded report remains below. Its update time has not changed.</p>}
      <button type="button" className={button} disabled={loading} onClick={() => void refresh()}>Retry activity report</button>
    </div>}

    {report && <div aria-busy={loading} className="min-w-0 space-y-4">
      <dl className="grid min-w-0 gap-3 sm:grid-cols-3">
        {[
          ["Recorded visits", visits],
          ["Recorded control clicks", clicks],
          ["Total recorded events", report.totalEvents],
        ].map(([label, count]) => <div key={label} className="min-w-0 rounded-xl border border-[#173252]/10 bg-white p-4">
          <dt className="text-xs leading-relaxed text-slate-600">{label}</dt>
          <dd className="mt-2 break-words text-2xl font-semibold tabular-nums">{number.format(Number(count))}</dd>
        </div>)}
      </dl>

      <div className="space-y-1 text-xs leading-relaxed text-slate-600">
        <p>Retention: up to {report.retentionDays} days, subject to the 10,000-event company limit. Older records are removed.</p>
        <p>Reporting window begins {timestamp(report.windowStart)}.</p>
        <p>Report updated <time dateTime={report.generatedAt}>{timestamp(report.generatedAt)}</time>. Refresh manually for newer activity.</p>
      </div>

      {report.totalEvents === 0 ? <p className="rounded-xl border border-dashed border-[#173252]/20 bg-white p-4 text-sm leading-relaxed text-slate-600">
        No guest review activity is recorded in this retention window.
      </p> : <>
        <div>
          <h3 className="text-sm font-semibold">Recorded controls</h3>
          <dl className="mt-2 grid min-w-0 gap-x-5 gap-y-2 sm:grid-cols-2">
            {(Object.keys(ELEMENT_LABELS) as GuestActivityElement[]).map(elementId => <div key={elementId} className="flex min-w-0 items-start justify-between gap-3 border-b border-[#173252]/5 py-2 text-sm">
              <dt className="min-w-0 break-words text-slate-600">{ELEMENT_LABELS[elementId]}</dt>
              <dd className="shrink-0 font-semibold tabular-nums">{number.format(report.counts.filter(row => row.elementId === elementId).reduce((sum, row) => sum + row.count, 0))}</dd>
            </div>)}
          </dl>
        </div>
        <details className="min-w-0 rounded-xl border border-[#173252]/15 bg-white">
          <summary className="min-h-11 cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a66a20]">
            Recent events · {number.format(report.events.length)} shown
          </summary>
          <div className="min-w-0 border-t border-[#173252]/10 px-4 pb-4">
            <p className="py-3 text-xs leading-relaxed text-slate-600">Most recent events first; up to 200 are shown. The totals above cover all retained events.</p>
            {report.events.length === 0 ? <p className="text-sm text-slate-600">No individual event rows are available in this report. Refresh to try again.</p>
              : <ol className="max-h-[28rem] min-w-0 space-y-2 overflow-y-auto overscroll-contain">
                {report.events.slice(0, 200).map(event => <li key={event.actorId + ":" + event.eventId} className="grid min-w-0 gap-2 rounded-lg bg-[#faf8f4] p-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto]">
                  <div className="min-w-0">
                    <p className="break-words font-medium">{ELEMENT_LABELS[event.elementId]}</p>
                    <p className="mt-1 break-all text-xs text-slate-600">{accountLabel(event.actorId)}</p>
                    {event.projectId && <p className="mt-1 break-all text-xs text-slate-600">{projectLabel(event.projectId)}</p>}
                    {(event.period || event.year !== undefined) && <p className="mt-1 text-xs text-slate-600">
                      {event.period ? "Month " + event.period : "Year " + event.year}
                    </p>}
                  </div>
                  <time dateTime={event.createdAt} className="text-xs leading-relaxed text-slate-600">{timestamp(event.createdAt)}</time>
                </li>)}
              </ol>}
          </div>
        </details>
      </>}
    </div>}
  </section></>;
}
