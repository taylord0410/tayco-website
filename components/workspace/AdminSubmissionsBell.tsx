"use client";

import { useEffect, useRef, useState } from "react";
import { referencesFromPayload } from "@/lib/reference-images";
import { AdminReferenceImages } from "@/components/EstimateReferences";
import type { WebsiteSubmissionItem } from "@/lib/erp";

const FORM_BADGE: Record<
  WebsiteSubmissionItem["formKind"],
  { label: string; badgeClass: string; route: string }
> = {
  estimate: {
    label: "Estimate Request",
    badgeClass: "border-amber-300/45 bg-amber-300/15 text-amber-200",
    route: "/estimate",
  },
  investor: {
    label: "Investor / Property",
    badgeClass: "border-sky-300/45 bg-sky-400/15 text-sky-200",
    route: "/investor",
  },
  vendor: {
    label: "Vendor Application",
    badgeClass: "border-emerald-300/45 bg-emerald-400/15 text-emerald-200",
    route: "/vendor-application",
  },
};

function formatTime(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.valueOf())) return iso;
  return (
    parsed.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }) + " UTC"
  );
}

export function AdminSubmissionsBell({
  submissions,
  onUpdated,
  onOpenInbox,
}: {
  submissions: WebsiteSubmissionItem[];
  onUpdated: (next: WebsiteSubmissionItem[]) => void;
  onOpenInbox: (focusId?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const unread = submissions.filter((s) => s.status === "unread");
  const unreadCount = unread.length;
  const recent = submissions.filter((s) => s.status !== "archived").slice(0, 8);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointer(e: PointerEvent) {
      if (
        e.target instanceof Node &&
        !containerRef.current?.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  async function mutateStatus(
    action: "mark_read" | "mark_unread" | "archive" | "mark_all_read",
    id?: string
  ) {
    setBusyId(id || action);
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.websiteSubmissions)) {
        onUpdated(data.websiteSubmissions);
      }
    } catch {
      // Non-fatal UI error; state remains intact
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="admin-notifications-bell"
        aria-label={
          unreadCount > 0
            ? `Website form notifications: ${unreadCount} new unread messages`
            : "Website form notifications: no new messages"
        }
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={
          "relative inline-flex min-h-11 items-center gap-2.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-amber-200 cursor-pointer " +
          (unreadCount > 0
            ? "border-[#eab869] bg-gradient-to-r from-[#1d355d] to-[#0f2240] text-white shadow-[0_0_18px_rgba(234,184,105,0.28)]"
            : "border-slate-700/80 bg-[#0b1930]/90 text-slate-200 hover:border-amber-200/40")
        }
      >
        <span className="relative flex h-6 w-6 items-center justify-center rounded-lg bg-[#eab869]/15 text-[#eab869]">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              data-testid="admin-notifications-badge"
              className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-black text-white shadow"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
        <span className="text-left leading-tight">
          <span className="block text-[11px] font-bold text-white">
            Form Messages
          </span>
          <span
            className={
              "block text-[10px] font-semibold " +
              (unreadCount > 0 ? "text-amber-300" : "text-slate-400")
            }
          >
            {unreadCount > 0
              ? `${unreadCount} new unread`
              : `${submissions.length} saved · 0 new`}
          </span>
        </span>
      </button>

      {open && (
        <div
          data-testid="admin-notifications-popover"
          role="dialog"
          aria-label="Website form notifications"
          className="absolute left-0 z-50 mt-2.5 w-[360px] max-w-[92vw] sm:w-[430px] rounded-2xl border border-[#eab869]/45 bg-[#081528] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#eab869]">
                  Website Form Inbox
                </p>
                <span className="rounded-full border border-emerald-400/35 bg-emerald-400/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-300">
                  AES-256-GCM
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-300">
                {unreadCount > 0
                  ? `You have ${unreadCount} new form submission${unreadCount === 1 ? "" : "s"} waiting for review.`
                  : "All website form submissions have been reviewed."}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={busyId === "mark_all_read"}
                onClick={() => void mutateStatus("mark_all_read")}
                className="rounded-lg border border-amber-300/35 bg-amber-300/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-200 hover:bg-amber-300/20 disabled:opacity-50 cursor-pointer"
              >
                {busyId === "mark_all_read" ? "Updating…" : "Mark all read"}
              </button>
            )}
          </div>

          <div className="mt-3 max-h-[360px] space-y-2.5 overflow-y-auto pr-1">
            {recent.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 bg-[#0b1b33]/60 px-4 py-6 text-center text-xs text-slate-400">
                No website form messages received yet. Submissions from{" "}
                <code className="text-amber-200">/estimate</code>,{" "}
                <code className="text-amber-200">/investor</code> and{" "}
                <code className="text-amber-200">/vendor-application</code>{" "}
                appear here immediately.
              </p>
            ) : (
              recent.map((item) => {
                const meta = FORM_BADGE[item.formKind] || FORM_BADGE.estimate;
                const isUnread = item.status === "unread";
                return (
                  <article
                    key={item.id}
                    data-testid={`notification-item-${item.id}`}
                    className={
                      "rounded-xl border p-3 transition " +
                      (isUnread
                        ? "border-l-4 border-amber-300/45 border-l-[#eab869] bg-[#102342]"
                        : "border-slate-700/70 bg-[#0b182e]/80")
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={
                            "rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
                            meta.badgeClass
                          }
                        >
                          {meta.label}
                        </span>
                        {isUnread && (
                          <span className="rounded-full bg-rose-500 px-2 py-0.5 font-mono text-[9px] font-black uppercase text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {formatTime(item.createdAt)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-bold text-white">
                      {item.senderName}
                      {item.companyOrType ? (
                        <span className="font-normal text-amber-200">
                          {" "}
                          · {item.companyOrType}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-300">
                      {item.senderEmail}
                      {item.senderPhone ? ` · ${item.senderPhone}` : ""}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                    {referencesFromPayload(item.payload).length > 0 && <p className="mt-2 text-xs text-amber-200">{referencesFromPayload(item.payload).length} image references attached</p>}

                {item.summary && (
                      <p className="mt-1.5 line-clamp-2 text-xs text-slate-300/90">
                        {item.summary}
                      </p>
                    )}

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/60 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          onOpenInbox(item.id);
                          if (isUnread) void mutateStatus("mark_read", item.id);
                        }}
                        className="text-[11px] font-bold text-[#eab869] hover:underline cursor-pointer"
                      >
                        Open full submission →
                      </button>
                      {isUnread && (
                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => void mutateStatus("mark_read", item.id)}
                          className="rounded-md border border-slate-600 px-2 py-1 text-[10px] font-semibold text-slate-300 hover:border-amber-200 hover:text-white cursor-pointer"
                        >
                          {busyId === item.id ? "Saving…" : "Mark read"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-700/80 pt-3">
            <span className="text-[10px] text-slate-400">
              Admin-only encrypted store
            </span>
            <button
              type="button"
              data-testid="admin-open-full-inbox-btn"
              onClick={() => {
                setOpen(false);
                onOpenInbox();
              }}
              className="rounded-xl bg-[#eab869] px-3.5 py-2 text-xs font-extrabold text-[#070e1a] hover:bg-amber-200 cursor-pointer"
            >
              View All Form Messages ({submissions.length}) →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminSubmissionsInbox({
  submissions,
  focusId,
  onUpdated,
}: {
  submissions: WebsiteSubmissionItem[];
  focusId?: string | null;
  onUpdated: (next: WebsiteSubmissionItem[]) => void;
}) {
  const [filter, setFilter] = useState<
    "all" | "unread" | "estimate" | "investor" | "vendor" | "archived"
  >("all");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const unreadCount = submissions.filter((s) => s.status === "unread").length;
  const estimateCount = submissions.filter(
    (s) => s.formKind === "estimate" && s.status !== "archived"
  ).length;
  const investorCount = submissions.filter(
    (s) => s.formKind === "investor" && s.status !== "archived"
  ).length;
  const vendorCount = submissions.filter(
    (s) => s.formKind === "vendor" && s.status !== "archived"
  ).length;

  const term = search.trim().toLowerCase();
  const visible = submissions.filter((item) => {
    if (filter === "archived") {
      if (item.status !== "archived") return false;
    } else {
      if (item.status === "archived") return false;
      if (filter === "unread" && item.status !== "unread") return false;
      if (
        (filter === "estimate" ||
          filter === "investor" ||
          filter === "vendor") &&
        item.formKind !== filter
      ) {
        return false;
      }
    }
    if (!term) return true;
    return [
      item.senderName,
      item.senderEmail,
      item.senderPhone,
      item.companyOrType,
      item.location,
      item.summary,
      item.id,
    ].some((v) => v.toLowerCase().includes(term));
  });

  async function mutateStatus(
    action: "mark_read" | "mark_unread" | "archive" | "mark_all_read",
    id?: string
  ) {
    setBusyId(id || action);
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.websiteSubmissions)) {
        onUpdated(data.websiteSubmissions);
      }
    } catch {
      // Preserve existing state on network hiccup
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      data-testid="admin-website-inbox"
      className="space-y-6 text-slate-100"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#eab869]/35 bg-gradient-to-r from-[#0d1f3a] via-[#12294d] to-[#0a182e] p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[#eab869]/45 bg-[#eab869]/15 px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-[#eab869]">
              Admin-Only Secure Inbox
            </span>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              🔒 SQLite WAL + AES-256-GCM Encrypted Payload
            </span>
          </div>
          <h3 className="mt-2 text-xl font-black text-white">
            Website Form Submissions &amp; Direct Inquiries
          </h3>
          <p className="mt-1 text-xs text-slate-300">
            Every estimate request (<code className="text-amber-200">/estimate</code>),
            investor inquiry (<code className="text-amber-200">/investor</code>) and
            trade partner application (
            <code className="text-amber-200">/vendor-application</code>) is
            encrypted at rest and visible exclusively to Administrator accounts.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            disabled={busyId === "mark_all_read"}
            onClick={() => void mutateStatus("mark_all_read")}
            className="rounded-xl bg-[#eab869] px-4 py-2.5 text-xs font-extrabold text-[#070e1a] hover:bg-amber-200 disabled:opacity-50 cursor-pointer"
          >
            {busyId === "mark_all_read"
              ? "Updating…"
              : `Mark all ${unreadCount} unread as read`}
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-rose-400/35 bg-[#10223f] p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-300">
            New / Unread
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-white">
            {unreadCount}
          </p>
        </div>
        <div className="rounded-xl border border-amber-300/35 bg-[#10223f] p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
            Estimate Requests
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-white">
            {estimateCount}
          </p>
        </div>
        <div className="rounded-xl border border-sky-300/35 bg-[#10223f] p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-sky-200">
            Investor Inquiries
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-white">
            {investorCount}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-300/35 bg-[#10223f] p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-200">
            Vendor Applications
          </p>
          <p className="mt-1 font-mono text-2xl font-black text-white">
            {vendorCount}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "all", label: `All Active (${submissions.filter((s) => s.status !== "archived").length})` },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "estimate", label: `Estimates (${estimateCount})` },
              { id: "investor", label: `Investors (${investorCount})` },
              { id: "vendor", label: `Vendors (${vendorCount})` },
              {
                id: "archived",
                label: `Archived (${submissions.filter((s) => s.status === "archived").length})`,
              },
            ] as const
          ).map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => setFilter(tabItem.id)}
              className={
                "rounded-xl border px-3.5 py-2 text-xs font-bold transition cursor-pointer " +
                (filter === tabItem.id
                  ? "border-[#eab869] bg-[#eab869]/20 text-amber-100"
                  : "border-slate-700 bg-[#09172b] text-slate-300 hover:border-amber-200/40")
              }
            >
              {tabItem.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, email, phone, city or details…"
          aria-label="Search website form submissions"
          className="min-h-10 w-full sm:w-72 rounded-xl border border-slate-600 bg-[#09172b] px-3.5 py-2 text-xs text-white placeholder:text-slate-400 focus:border-amber-200 focus:outline-none"
        />
      </div>

      {/* Submissions List */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-[#09172b]/60 p-8 text-center text-sm text-slate-300">
          No website form submissions match the current filter.
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((item) => {
            const meta = FORM_BADGE[item.formKind] || FORM_BADGE.estimate;
            const isUnread = item.status === "unread";
            const isFocused = focusId === item.id;
            const p = item.payload || {};
            return (
              <article
                key={item.id}
                data-testid={`inbox-submission-${item.id}`}
                className={
                  "rounded-2xl border p-5 transition " +
                  (isFocused
                    ? "border-2 border-[#eab869] bg-[#112648] shadow-[0_0_25px_rgba(234,184,105,0.25)]"
                    : isUnread
                      ? "border-l-4 border-amber-300/45 border-l-[#eab869] bg-[#0e203d]"
                      : "border-slate-700/80 bg-[#09172b]/80")
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-700/70 pb-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={
                          "rounded-md border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider " +
                          meta.badgeClass
                        }
                      >
                        {meta.label} ({meta.route})
                      </span>
                      {isUnread ? (
                        <span className="rounded-full bg-rose-500 px-2.5 py-0.5 font-mono text-[10px] font-black uppercase text-white">
                          NEW · UNREAD
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-600 bg-slate-800 px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-slate-300">
                          {item.status}
                        </span>
                      )}
                      <span className="font-mono text-xs text-slate-400">
                        Received {formatTime(item.createdAt)}
                      </span>
                    </div>
                    <h4 className="mt-2 text-lg font-bold text-white">
                      {item.senderName}
                      {item.companyOrType ? (
                        <span className="text-sm font-medium text-amber-200">
                          {" "}
                          · {item.companyOrType}
                        </span>
                      ) : null}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {item.senderPhone && (
                      <a
                        href={`tel:${item.senderPhone}`}
                        className="rounded-lg border border-amber-300/35 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-300/20"
                      >
                        📞 {item.senderPhone}
                      </a>
                    )}
                    {item.senderEmail && (
                      <a
                        href={`mailto:${item.senderEmail}?subject=${encodeURIComponent(`TAYCO Response — ${meta.label} (${item.id.slice(0, 8)})`)}`}
                        className="rounded-lg border border-sky-300/35 bg-sky-400/10 px-3 py-1.5 text-xs font-bold text-sky-200 hover:bg-sky-400/20"
                      >
                        ✉️ Reply via Email
                      </a>
                    )}
                    {isUnread ? (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void mutateStatus("mark_read", item.id)}
                        className="rounded-lg bg-[#eab869] px-3 py-1.5 text-xs font-extrabold text-[#070e1a] hover:bg-amber-200 cursor-pointer"
                      >
                        Mark as Read
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void mutateStatus("mark_unread", item.id)}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-amber-200 cursor-pointer"
                      >
                        Mark Unread
                      </button>
                    )}
                    {item.status !== "archived" && (
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void mutateStatus("archive", item.id)}
                        className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-rose-300 hover:text-rose-200 cursor-pointer"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-slate-700/70 bg-[#071326] p-3">
                    <dt className="text-slate-400">Email Address</dt>
                    <dd className="mt-1 break-all font-semibold text-white">
                      {item.senderEmail || "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-700/70 bg-[#071326] p-3">
                    <dt className="text-slate-400">Direct Phone</dt>
                    <dd className="mt-1 font-semibold text-white">
                      {item.senderPhone || "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-700/70 bg-[#071326] p-3">
                    <dt className="text-slate-400">Location / States</dt>
                    <dd className="mt-1 font-semibold text-white">
                      {item.location || "—"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-slate-700/70 bg-[#071326] p-3">
                    <dt className="text-slate-400">
                      {item.formKind === "vendor"
                        ? "Trades & Crew"
                        : item.formKind === "investor"
                          ? "Portfolio / Work Needed"
                          : "Project Type"}
                    </dt>
                    <dd className="mt-1 font-semibold text-amber-200">
                      {item.formKind === "vendor"
                        ? `${String(p.trades || "—")} (${String(p.crewSize || "crew N/A")})`
                        : item.formKind === "investor"
                          ? `${String(p.workNeeded || "—")} ${p.properties ? `· ${String(p.properties)} props` : ""}`
                          : `${String(p.projectType || item.companyOrType || "General")}${typeof p.sqft === "number" ? ` · ${p.sqft.toLocaleString()} sq ft` : ""}${typeof p.budgetIllustrationUsd === "number" ? ` (~$${p.budgetIllustrationUsd.toLocaleString()})` : ""}`}
                    </dd>
                  </div>
                </dl>

<AdminReferenceImages payload={p} />

                {item.summary && (
                  <div className="mt-4 rounded-xl border border-amber-200/20 bg-[#071326] p-4">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-200">
                      Submitted Message / Scope Details
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-100">
                      {item.summary}
                    </p>
                  </div>
                )}

                {item.formKind === "vendor" && (
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
                    <span>
                      <strong>Years in Business:</strong>{" "}
                      {String(p.yearsInBusiness || "—")}
                    </span>
                    <span>·</span>
                    <span>
                      <strong>Insured:</strong> {String(p.insured || "—")}
                    </span>
                    <span>·</span>
                    <span>
                      <strong>License #:</strong>{" "}
                      {String(p.licenseNumber || "Not provided")}
                    </span>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="font-mono">Reference ID: {item.id}</span>
                  {item.readAt && (
                    <span>
                      Reviewed {formatTime(item.readAt)}
                      {item.readBy ? ` by ${item.readBy}` : ""}
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
