"use client";
import { useState } from "react";
import type { Entry } from "@/lib/erp";
import type { GuestConsoleData } from "@/lib/guest-workspace";
import {
  CORPORATE_CERTIFICATIONS_STATUS,
  VERIFIED_OCTOBER_2026_OPPORTUNITIES,
} from "@/lib/verified-bidding-opportunities";
import { VerifiedOpportunitiesTable } from "./VerifiedOpportunitiesTable";
import MonthlyExcelWorkbookViewer from "./MonthlyExcelWorkbookViewer";

type Props = {
  entries?: Entry[];
  asOf: string;
  projectId?: string;
  isGuest?: boolean;
  guestData?: GuestConsoleData;
  onNavigate: (view: string, projectId?: string, reportingMonth?: string) => void;
};

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);

const usd = (dollars: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(dollars);

const monthName = (month: string, short = false) =>
  new Intl.DateTimeFormat("en-US", {
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(month + "-01T12:00:00Z"));

const DEFAULT_2026_MONTHLY_SERIES: readonly {
  key: string;
  issuedCents: number;
  opps: number;
}[] = [
  { key: "2026-01", issuedCents: 42500000, opps: 58 },
  { key: "2026-02", issuedCents: 65768000, opps: 72 },
  { key: "2026-03", issuedCents: 71978900, opps: 78 },
  { key: "2026-04", issuedCents: 70078900, opps: 76 },
  { key: "2026-05", issuedCents: 82567900, opps: 86 },
  { key: "2026-06", issuedCents: 92157800, opps: 94 },
  { key: "2026-07", issuedCents: 90879200, opps: 92 },
  { key: "2026-08", issuedCents: 94078900, opps: 98 },
  { key: "2026-09", issuedCents: 93848900, opps: 96 },
  { key: "2026-10", issuedCents: 4178900, opps: 1 },
  { key: "2026-11", issuedCents: 0, opps: 0 },
  { key: "2026-12", issuedCents: 0, opps: 0 },
];

const renderCertIcon = (certId: string) => {
  if (certId === "sam" || certId === "sam_gov" || certId === "federal_programs") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <line x1="3" y1="22" x2="21" y2="22" />
        <line x1="6" y1="18" x2="6" y2="11" />
        <line x1="10" y1="18" x2="10" y2="11" />
        <line x1="14" y1="18" x2="14" y2="11" />
        <line x1="18" y1="18" x2="18" y2="11" />
        <polygon points="12 2 2 7 22 7" />
      </svg>
    );
  }
  if (certId === "esbe") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="m9 15 2 2 4-4" />
      </svg>
    );
  }
  if (certId === "state_programs") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    );
  }
  if (certId === "union_private") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z" />
        <path d="M10 10V5a2 2 0 0 1 4 0v5" />
        <path d="M4 15v-3a8 8 0 0 1 16 0v3" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
};

const GUEST_SECTION_MAP: Record<string, string> = {
  executive: "summary",
  project: "projects",
  invoice: "financial_dashboard",
  financial_dashboard: "financial_dashboard",
  team: "team",
  lead: "lead",
  hours: "hours",
  compliance: "compliance",
  document: "plans",
  corporate_meetings: "corporate_meetings",
  dossier: "dossier",
};

export default function DashboardCommandCenter({
  asOf,
  projectId = "",
  isGuest = false,
  onNavigate,
}: Props) {
  const currentMonthKey = "2026-10";
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [excelWorkbookMonth, setExcelWorkbookMonth] = useState<string | null>(null);
  const [adminOnlyModalTitle, setAdminOnlyModalTitle] = useState<string | null>(null);

  const monthSeries = DEFAULT_2026_MONTHLY_SERIES;
  const maxBar = Math.max(1, ...monthSeries.map((m) => m.issuedCents));
  const selectedSeries =
    monthSeries.find((m) => m.key === selectedMonth) ?? monthSeries[9];

  const ytdCents = monthSeries
    .filter((m) => m.key <= currentMonthKey)
    .reduce((sum, m) => sum + m.issuedCents, 0);

  const parseOpportunityUsd = (item: {
    estimatedPrice?: string;
    estimatedValueUsd?: number;
  }): number => {
    if (
      typeof item.estimatedValueUsd === "number" &&
      Number.isFinite(item.estimatedValueUsd)
    ) {
      return item.estimatedValueUsd;
    }
    const parsed = Number(
      String(item.estimatedPrice ?? "").replace(/[^0-9.-]+/g, "")
    );
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const octoberCancelledProjects = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.status === "Overdue"
  );
  const octoberCancelledLossUsd = octoberCancelledProjects.reduce(
    (sum, item) => sum + (item.estimatedValueUsd ?? parseOpportunityUsd(item)),
    0
  );
  const octoberPendingProjects = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.status === "Pending company information"
  );
  const octoberPendingTotalUsd = octoberPendingProjects.reduce(
    (sum, item) => sum + (item.estimatedValueUsd ?? parseOpportunityUsd(item)),
    0
  );
  const octoberSeriesEntry =
    monthSeries.find((r) => r.key === "2026-10") ??
    monthSeries[monthSeries.length - 1];
  const octoberLedgerRow = {
    ...octoberSeriesEntry,
    grossIncomeUsd: Math.round(octoberSeriesEntry.issuedCents / 100),
  };

  const triggerNavigate = (view: string, projId?: string, month?: string) => {
    if (isGuest) {
      const mapped = GUEST_SECTION_MAP[view] || view;
      onNavigate(mapped, projId, month);
    } else {
      onNavigate(view, projId, month);
    }
  };

  const selectMonthPill = (monthKey: string) => {
    setSelectedMonth(monthKey);
    const target = monthSeries.find((m) => m.key === monthKey);
    if (target && target.issuedCents > 0) {
      setExcelWorkbookMonth(monthKey);
    }
  };

  const openMonthDetail = (monthKey: string) => {
    if (isGuest) {
      setAdminOnlyModalTitle(`Monthly Financial Ledger (${monthName(monthKey)})`);
      return;
    }
    setSelectedMonth(monthKey);
    onNavigate("financial_dashboard", undefined, monthKey);
  };

  return (
    <div className="dcc-dashboard" data-testid="dashboard-command-center">
      {adminOnlyModalTitle && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dcc-admin-only-modal-title"
          data-testid="guest-admin-only-modal"
          onClick={() => setAdminOnlyModalTitle(null)}
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
              maxWidth: "480px",
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
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <div>
                <p style={{ margin: 0, fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#eab869", fontWeight: 700 }}>
                  Restricted Corporate Module
                </p>
                <h4 id="dcc-admin-only-modal-title" style={{ margin: "0.15rem 0 0", fontSize: "1.08rem", fontWeight: 700, color: "#ffffff" }}>
                  Administrator Access Only
                </h4>
              </div>
            </div>
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.86rem", lineHeight: 1.55, color: "#cbd5e1" }}>
              <strong>{adminOnlyModalTitle}</strong> is restricted exclusively to authorized corporate administrators.
            </p>
            <p style={{ margin: "0 0 1.25rem", fontSize: "0.8rem", lineHeight: 1.5, color: "#94a3b8" }}>
              Guest review accounts have full access to current <strong>October 2026 Opportunities &amp; Projects</strong>, interactive <strong>Blueprints / Plans</strong>, and the <strong>2026 Monthly Excel Workbooks (Jan–Oct 2026)</strong>.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
              <button
                type="button"
                onClick={() => setAdminOnlyModalTitle(null)}
                style={{
                  padding: "0.5rem 1.15rem",
                  borderRadius: "8px",
                  border: "1px solid rgba(212, 175, 55, 0.55)",
                  background: "linear-gradient(135deg, #d4af37 0%, #b58922 100%)",
                  color: "#06101e",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                }}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Width Stack: 1) Monthly Activity 2026 Chart (100% wide) -> 2) New Opportunities Since October 2026 & Blueprints (100% wide) -> 3) Monthly Income Ledger (100% wide below projects) -> 4) Certifications & Programs (Admin only) */}
      <div className="dcc-console-fullwidth-stack">
        {/* Card 1: Monthly Activity 2026 Bar Chart (Full Width) */}
        <section className="dcc-card dcc-monthly-activity-card">
          <header className="dcc-card-header">
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
                <h3>Monthly Activity 2026</h3>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.2rem 0.55rem",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    borderRadius: "6px",
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.35)",
                    color: "#6ee7b7",
                    cursor: "pointer",
                  }}
                  data-testid="chart-excel-workbook-hint"
                  onClick={() => {
                    const target = selectedMonth <= "2026-10" ? selectedMonth : "2026-09";
                    setExcelWorkbookMonth(target);
                  }}
                  title="Click to open Excel Workbook"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                    <line x1="15" y1="3" x2="15" y2="21" />
                    <line x1="3" y1="9" x2="21" y2="9" />
                    <line x1="3" y1="15" x2="21" y2="15" />
                  </svg>
                  Click any month bar (Jan–Oct 2026) to open its Excel Workbook
                </span>
              </div>
              <p className="dcc-card-subtitle">
                Corporate Income · {monthName(selectedMonth)} (
                {money(selectedSeries.issuedCents)}) · YTD 2026: {money(ytdCents)}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              {excelWorkbookMonth && (
                <button
                  type="button"
                  onClick={() => setExcelWorkbookMonth(null)}
                  style={{
                    padding: "0.35rem 0.75rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    borderRadius: "6px",
                    border: "1px solid rgba(239, 68, 68, 0.45)",
                    background: "rgba(239, 68, 68, 0.12)",
                    color: "#fca5a5",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                  }}
                  data-testid="close-excel-workbook-btn"
                  aria-label="Close Excel Workbook"
                >
                  ✕ Close Excel ({monthName(excelWorkbookMonth, true)})
                </button>
              )}
              <button
                type="button"
                className="dcc-open-month-btn"
                onClick={() => {
                  const target = selectedMonth <= "2026-10" ? selectedMonth : "2026-09";
                  setExcelWorkbookMonth(target);
                }}
              >
                Open Excel ({monthName(selectedMonth <= "2026-10" ? selectedMonth : "2026-09", true)}) →
              </button>
              {!isGuest && (
                <button
                  type="button"
                  className="dcc-open-month-btn"
                  onClick={() => openMonthDetail(selectedMonth)}
                >
                  Open month detail →
                </button>
              )}
            </div>
          </header>

          <div
            className="dcc-chart"
            aria-label="Monthly activity 2026 revenue, opportunities and projects"
          >
            {monthSeries.map((m) => {
              const isOct = m.key === currentMonthKey;
              const isSelected = m.key === selectedMonth;
              const heightPct =
                m.issuedCents > 0
                  ? Math.max(14, Math.round((m.issuedCents / maxBar) * 100))
                  : 6;
              return (
                <button
                  type="button"
                  key={m.key}
                  className={`dcc-chart-month ${isOct ? "is-october" : ""} ${
                    isSelected ? "is-selected" : ""
                  }`}
                  aria-pressed={isSelected}
                  aria-label={`${monthName(m.key)}: ${money(
                    m.issuedCents
                  )}, ${m.opps} ${m.opps === 1 ? "consolidated record" : "micro-projects"}. Select month.`}
                  onClick={() => selectMonthPill(m.key)}
                >
                  {m.issuedCents > 0 && (
                    <span
                      className={`dcc-oct-callout dcc-month-income-callout ${
                        isOct ? "is-oct-callout" : ""
                      } ${isSelected ? "is-selected-callout" : ""}`}
                      data-testid={`chart-income-callout-${m.key}`}
                      aria-hidden="true"
                    >
                      {money(m.issuedCents)}
                    </span>
                  )}
                  <span className="dcc-bar-pair" aria-hidden="true">
                    <i
                      className={`dcc-issued-bar ${isOct ? "is-oct-bar" : ""}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </span>
                  <span className="dcc-month-label">
                    {monthName(m.key, true)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 12 Month Segmented Selector Strip (Jan..Dec) */}
          <div className="dcc-month-pills-bar">
            <div
              className="dcc-month-pills"
              role="group"
              aria-label="Select month"
            >
              {monthSeries.map((m) => {
                const isOct = m.key === currentMonthKey;
                const isSelected = m.key === selectedMonth;
                return (
                  <button
                    type="button"
                    key={m.key}
                    onClick={() => selectMonthPill(m.key)}
                    aria-pressed={isSelected}
                    className={`dcc-month-pill ${
                      isSelected ? "is-active" : ""
                    } ${isOct ? "is-current" : ""}`}
                  >
                    {monthName(m.key, true)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {excelWorkbookMonth && (
          <MonthlyExcelWorkbookViewer
            selectedMonth={excelWorkbookMonth}
            onSelectMonth={(m) => {
              setSelectedMonth(m);
              setExcelWorkbookMonth(m);
            }}
            onClose={() => setExcelWorkbookMonth(null)}
            isGuest={isGuest}
          />
        )}

        {/* Card 2 (Directly Below the Chart, Full Width): New Opportunities Since October 2026 Header + Opportunities & Large Projects Table */}
        <VerifiedOpportunitiesTable defaultLimit={48} isGuest={isGuest} />

        {/* Card 3 (Directly Below the Projects Table, Full Width): October 2026 Current Month Income & Cancelled Projects Loss Summary */}
        <section
          className="dcc-card dcc-income-ledger-wide-card"
          data-testid="corporate-income-ledger-panel"
        >
          <header className="dcc-right-menu-head">
            <div>
              <p className="dcc-eyebrow">
                CORPORATE RECORD · CURRENT MONTH (OCTOBER 2026)
              </p>
              <h4
                style={{
                  margin: "0.15rem 0 0",
                  fontSize: "1.06rem",
                  fontWeight: 700,
                  color: "#f8fafc",
                }}
              >
                October 2026 — Current Month Income &amp; Cancelled Projects Loss Summary
              </h4>
            </div>
            <span className="dcc-badge" data-tone="amber">
              Current Month · October 2026
            </span>
          </header>

          <div className="dcc-right-menu-list">
            <div
              data-testid="october-right-row-detail"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.9rem",
                padding: "1rem 1.1rem",
                borderRadius: "12px",
                border: "1px solid rgba(212, 175, 55, 0.42)",
                background:
                  "linear-gradient(180deg, rgba(15, 32, 56, 0.78) 0%, rgba(10, 22, 40, 0.9) 100%)",
              }}
            >
              {/* Top row / banner for Current Month (October 2026 · Current Month) */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "0.55rem",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "0.18rem 0.55rem",
                        borderRadius: "999px",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        background: "rgba(245, 158, 11, 0.16)",
                        border: "1px solid rgba(245, 158, 11, 0.45)",
                        color: "#fcd34d",
                      }}
                    >
                      CURRENT MONTH · OCT 2026
                    </span>
                    <strong style={{ fontSize: "0.96rem", color: "#f8fafc" }}>
                      October 2026 (Through Oct 3 Operational Cutoff)
                    </strong>
                  </div>
                  <small style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                    1 Completed Project (TPRJ-2610-751) · {octoberCancelledProjects.length} Cancelled Projects (Insurance Issues) · {octoberPendingProjects.length} Pending Projects
                  </small>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  <button
                    type="button"
                    data-testid="ledger-open-excel-2026-10"
                    onClick={() => {
                      setSelectedMonth("2026-10");
                      setExcelWorkbookMonth("2026-10");
                    }}
                    style={{
                      padding: "0.38rem 0.8rem",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      borderRadius: "7px",
                      border: "1px solid rgba(16, 185, 129, 0.45)",
                      background: "rgba(16, 185, 129, 0.14)",
                      color: "#6ee7b7",
                      cursor: "pointer",
                    }}
                  >
                    Open Oct Excel Workbook →
                  </button>
                  {!isGuest && (
                    <button
                      type="button"
                      onClick={() => openMonthDetail("2026-10")}
                      style={{
                        padding: "0.38rem 0.8rem",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        borderRadius: "7px",
                        border: "1px solid rgba(212, 175, 55, 0.42)",
                        background: "rgba(15, 31, 56, 0.88)",
                        color: "#f3d37a",
                        cursor: "pointer",
                      }}
                    >
                      Open October Ledger →
                    </button>
                  )}
                </div>
              </div>

              {/* 3-Column Executive Breakdown Grid inside the October Current Month card */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "0.85rem",
                }}
              >
                {/* Card 1 — Completed Work (Oct 1–3 Pre-Cutoff) */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.45rem",
                    padding: "0.9rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(16, 185, 129, 0.38)",
                    background: "rgba(6, 78, 59, 0.22)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "#6ee7b7",
                    }}
                  >
                    COMPLETED IN OCTOBER (PRE-CUTOFF)
                  </span>
                  <strong
                    style={{
                      fontSize: "1.45rem",
                      fontWeight: 800,
                      color: "#34d399",
                      lineHeight: 1.15,
                    }}
                  >
                    +{usd(octoberLedgerRow.grossIncomeUsd)}
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#a7f3d0",
                      }}
                    >
                      ● 1 Reconciled Project (TPRJ-2610-751)
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                      Commercial TPO &amp; Envelope Scope · Certified before Oct 3 insurance freeze
                    </span>
                  </div>
                </div>

                {/* Card 2 — Cancelled Projects Losses (Insurance Issues) */}
                <div
                  data-testid="october-cancelled-losses-summary"
                  className="border-rose-500/40 bg-rose-950/35"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.45rem",
                    padding: "0.9rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(244, 63, 94, 0.45)",
                    background: "rgba(76, 5, 25, 0.42)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "#fda4af",
                    }}
                  >
                    CANCELLED PROJECTS LOSSES · CURRENT MONTH
                  </span>
                  <strong
                    className="text-rose-300"
                    style={{
                      fontSize: "1.45rem",
                      fontWeight: 800,
                      color: "#fda4af",
                      lineHeight: 1.15,
                    }}
                  >
                    -${octoberCancelledLossUsd.toLocaleString("en-US")}
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#fecdd3",
                      }}
                    >
                      ✕ {octoberCancelledProjects.length} Cancelled Projects · Insurance Issues
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "#ffe4e6", lineHeight: 1.4 }}>
                      Total lost contracting volume from {octoberCancelledProjects.length} October 2026 opportunities cancelled due to insurance compliance hold
                    </span>
                  </div>
                </div>

                {/* Card 3 — Pending Opportunities & Net Current Month Impact */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "0.45rem",
                    padding: "0.9rem 1rem",
                    borderRadius: "10px",
                    border: "1px solid rgba(245, 158, 11, 0.38)",
                    background: "rgba(120, 53, 15, 0.22)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "#fcd34d",
                    }}
                  >
                    PENDING REVIEW &amp; NET OCTOBER BALANCE
                  </span>
                  <strong
                    className="text-amber-200"
                    style={{
                      fontSize: "1.45rem",
                      fontWeight: 800,
                      color: "#fde68a",
                      lineHeight: 1.15,
                    }}
                  >
                    ${octoberPendingTotalUsd.toLocaleString("en-US")}
                  </strong>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                    <span
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: "#fef08a",
                      }}
                    >
                      ⏳ {octoberPendingProjects.length} Pending Company Information
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "#e2e8f0", lineHeight: 1.4 }}>
                      Net Realized vs. Cancelled Volume:{" "}
                      <strong style={{ color: "#fda4af" }}>
                        -${(octoberCancelledLossUsd - octoberLedgerRow.grossIncomeUsd).toLocaleString("en-US")}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card 4 (Admin Only): 8 Active Certifications & Programs */}
        {!isGuest && (
          <section
            className="dcc-card dcc-right-menu-card"
            data-testid="corporate-certifications-panel"
          >
            <header className="dcc-right-menu-head">
              <div>
                <h3>Certifications &amp; Programs</h3>
              </div>
              <button
                type="button"
                className="dcc-mini-link"
                onClick={() => triggerNavigate("compliance")}
              >
                Open ↗
              </button>
            </header>
            <div className="dcc-right-menu-list">
              {CORPORATE_CERTIFICATIONS_STATUS.map((cert) => {
                const isUnionHighlight = cert.id === "union_private";
                return (
                  <button
                    type="button"
                    key={cert.id}
                    className={`dcc-right-menu-item is-cert ${
                      isUnionHighlight ? "is-union-highlight" : ""
                    }`}
                    onClick={() =>
                      triggerNavigate(
                        isUnionHighlight ? "lead" : "compliance"
                      )
                    }
                  >
                    <span className="dcc-right-menu-icon" aria-hidden="true">
                      {renderCertIcon(cert.id)}
                    </span>
                    <span className="dcc-right-menu-text">
                      <strong>
                        {cert.code}
                        {isUnionHighlight && (
                          <span className="dcc-union-inline-pill">
                            UNION &amp; ASSOC.
                          </span>
                        )}
                      </strong>
                      <small>{cert.label}</small>
                    </span>
                    <span
                      style={{
                        fontSize: "0.66rem",
                        fontWeight: 700,
                        padding: "0.16rem 0.48rem",
                        borderRadius: "999px",
                        background: "rgba(16, 185, 129, 0.16)",
                        border: "1px solid rgba(16, 185, 129, 0.42)",
                        color: "#6ee7b7",
                        whiteSpace: "nowrap",
                        marginRight: "0.25rem",
                      }}
                    >
                      ● Active
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>

      <p className="dcc-snapshot">
        Recorded snapshot · {asOf.slice(0, 10)} UTC ·{" "}
        {projectId ? "Selected project" : "Authorized company portfolio"}
      </p>
    </div>
  );
}
