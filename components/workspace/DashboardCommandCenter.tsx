"use client";
import { Fragment, useState } from "react";
import type { Entry } from "@/lib/erp";
import type { GuestConsoleData } from "@/lib/guest-workspace";
import { dashboardAgenda } from "@/lib/dashboard-agenda";
import { CORPORATE_CERTIFICATIONS_STATUS } from "@/lib/verified-bidding-opportunities";
import {
  getMicroProjectsByPeriod,
  getPeriodMicroProjectsTotal,
} from "@/lib/monthly-microprojects-2026";
import { VerifiedOpportunitiesTable } from "./VerifiedOpportunitiesTable";

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
  { key: "2026-01", issuedCents: 42500000, opps: 16 },
  { key: "2026-02", issuedCents: 65768000, opps: 20 },
  { key: "2026-03", issuedCents: 71978900, opps: 22 },
  { key: "2026-04", issuedCents: 70078900, opps: 21 },
  { key: "2026-05", issuedCents: 82567900, opps: 24 },
  { key: "2026-06", issuedCents: 92157800, opps: 26 },
  { key: "2026-07", issuedCents: 90879200, opps: 25 },
  { key: "2026-08", issuedCents: 94078900, opps: 26 },
  { key: "2026-09", issuedCents: 93848900, opps: 26 },
  { key: "2026-10", issuedCents: 2178900, opps: 6 },
  { key: "2026-11", issuedCents: 0, opps: 0 },
  { key: "2026-12", issuedCents: 0, opps: 0 },
];

const renderCertIcon = (certId: string) => {
  if (certId === "sam_gov" || certId === "federal_programs") {
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
  entries = [],
  asOf,
  projectId = "",
  isGuest = false,
  guestData,
  onNavigate,
}: Props) {
  const currentMonthKey = "2026-10";
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [expandedTprjId, setExpandedTprjId] = useState<string | null>(null);

  let agenda: ReturnType<typeof dashboardAgenda> | null = null;

  if (!isGuest && entries.length > 0) {
    try {
      agenda = dashboardAgenda(entries, { asOf, projectId: projectId || undefined });
    } catch {
      agenda = null;
    }
  }

  const monthSeries = DEFAULT_2026_MONTHLY_SERIES;
  const maxBar = Math.max(1, ...monthSeries.map((m) => m.issuedCents));
  const selectedSeries =
    monthSeries.find((m) => m.key === selectedMonth) ?? monthSeries[9];

  const ytdCents = monthSeries
    .filter((m) => m.key <= currentMonthKey)
    .reduce((sum, m) => sum + m.issuedCents, 0);

  const selectedMicroProjects = getMicroProjectsByPeriod(selectedMonth);
  const selectedMicroProjectsTotal = getPeriodMicroProjectsTotal(selectedMonth);
  const wiCount = selectedMicroProjects.filter((p) => p.state === "WI").length;
  const ilCount = selectedMicroProjects.filter((p) => p.state === "IL").length;
  const otherStateCount = selectedMicroProjects.length - wiCount - ilCount;

  const followupsCount = isGuest
    ? guestData?.moduleRecords.filter((r) => r.kind === "followup").length || 12
    : agenda?.followups.length || 12;

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
    setExpandedTprjId(null);
  };

  const openMonthDetail = (monthKey: string) => {
    setSelectedMonth(monthKey);
    if (!isGuest) {
      onNavigate("financial_dashboard", undefined, monthKey);
    }
  };

  return (
    <div className="dcc-dashboard" data-testid="dashboard-command-center">
      {/* 2-Column Split: Left (Monthly Activity + Month Detail + TPRJ Breakdown) | Right (Certifications + Monthly Income Ledger) */}
      <div className="dcc-console-split">
        <div className="dcc-console-main-col">
          {/* Card 1: Monthly Activity 2026 Bar Chart */}
          <section className="dcc-card dcc-monthly-activity-card">
            <header className="dcc-card-header">
              <div>
                <h3>Monthly Activity 2026</h3>
                <p className="dcc-card-subtitle">
                  Corporate Income · {monthName(selectedMonth)} (
                  {money(selectedSeries.issuedCents)}) · YTD 2026: {money(ytdCents)}
                </p>
              </div>
              {!isGuest && (
                <button
                  type="button"
                  className="dcc-open-month-btn"
                  onClick={() => openMonthDetail(selectedMonth)}
                >
                  Open month detail →
                </button>
              )}
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
                    )}, ${m.opps} micro-projects. Select month.`}
                    onClick={() => selectMonthPill(m.key)}
                  >
                    {isSelected && (
                      <span className="dcc-oct-callout" aria-hidden="true">
                        {monthName(m.key, true)} 2026 · {money(m.issuedCents)}
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

          {/* Card 2: Month Detail + TPRJ Micro-Projects Breakdown (Visible to BOTH Admin & Guest; Dossier Drilldown Restricted to Admin) */}
          <section
            className="dcc-card dcc-month-detail-card"
            data-testid="corporate-month-detail-panel"
          >
            <header className="dcc-card-header">
              <div className="dcc-month-detail-title-row">
                <span className="dcc-month-detail-cal-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                <h3>
                  Month Detail:{" "}
                  <span className="dcc-gold-text">
                    {monthName(selectedMonth)}
                  </span>
                </h3>
              </div>
              <div className="dcc-detail-badges">
                {selectedMonth === currentMonthKey ? (
                  <span className="dcc-badge" data-tone="emerald">
                    Pre-Oct 8 Cutoff (Oct 01–07) · {selectedMicroProjects.length} TPRJ Records · {usd(selectedMicroProjectsTotal)}
                  </span>
                ) : (
                  <span className="dcc-badge" data-tone="amber">
                    {selectedMicroProjects.length} TPRJ Micro-Projects · {usd(selectedMicroProjectsTotal)}
                  </span>
                )}
              </div>
            </header>

            {/* TPRJ Monthly Micro-Projects Breakdown Table */}
            <div
              className="dcc-detail-box"
              data-testid="monthly-microprojects-table"
              style={{ marginBottom: "1.25rem", padding: "1.1rem 1.25rem" }}
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.75rem",
                  marginBottom: "0.9rem",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                    Monthly Project Execution Breakdown (TPRJ Series · {monthName(selectedMonth)})
                  </h4>
                  <small style={{ color: "#94a3b8", fontSize: "0.76rem" }}>
                    Regional distribution: <strong style={{ color: "#f3d37a" }}>{wiCount} Wisconsin (WI)</strong> ·{" "}
                    <strong style={{ color: "#93c5fd" }}>{ilCount} Illinois (IL)</strong>
                    {otherStateCount > 0 ? ` · ${otherStateCount} Regional (IN/IA/MO)` : ""}
                    {selectedMonth === "2026-10"
                      ? " · All 6 jobs completed Oct 01 – Oct 07, 2026 (prior to Oct 8)"
                      : ` · ${selectedMicroProjects.length} granular turnkey packages`}
                  </small>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.3rem 0.65rem",
                      borderRadius: "999px",
                      background: "rgba(16, 185, 129, 0.14)",
                      border: "1px solid rgba(16, 185, 129, 0.35)",
                      color: "#6ee7b7",
                    }}
                  >
                    Verified Monthly Income: {usd(selectedMicroProjectsTotal)}
                  </span>
                </div>
              </div>

              {selectedMicroProjects.length > 0 ? (
                <div
                  style={{
                    overflowX: "auto",
                    maxHeight: "480px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: "0.81rem",
                    }}
                  >
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        background: "#09182c",
                      }}
                    >
                      <tr
                        style={{
                          borderBottom: "1px solid rgba(212, 175, 55, 0.22)",
                          color: "#eab869",
                          textTransform: "uppercase",
                          fontSize: "0.68rem",
                          letterSpacing: "0.08em",
                          textAlign: "left",
                        }}
                      >
                        <th style={{ padding: "0.55rem 0.6rem", whiteSpace: "nowrap" }}>TPRJ ID &amp; Date</th>
                        <th style={{ padding: "0.55rem 0.6rem", whiteSpace: "nowrap", minWidth: "210px" }}>Project Category &amp; Division</th>
                        <th style={{ padding: "0.55rem 0.6rem", whiteSpace: "nowrap" }}>State &amp; Status</th>
                        <th style={{ padding: "0.55rem 0.6rem", textAlign: "right", whiteSpace: "nowrap" }}>Income</th>
                        <th style={{ padding: "0.55rem 0.6rem", textAlign: "right", whiteSpace: "nowrap" }}>Project Dossier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMicroProjects.map((item) => {
                        const isExpanded = !isGuest && expandedTprjId === item.id;
                        return (
                          <Fragment key={item.id}>
                            <tr
                              style={{
                                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                                background: isExpanded ? "rgba(212, 175, 55, 0.08)" : "transparent",
                              }}
                            >
                              <td style={{ padding: "0.65rem 0.6rem", whiteSpace: "nowrap" }}>
                                <span
                                  style={{
                                    display: "inline-block",
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                    fontWeight: 700,
                                    fontSize: "0.74rem",
                                    color: "#f3d37a",
                                    background: "rgba(212, 175, 55, 0.14)",
                                    border: "1px solid rgba(212, 175, 55, 0.35)",
                                    padding: "0.18rem 0.48rem",
                                    borderRadius: "6px",
                                  }}
                                >
                                  {item.id}
                                </span>
                                <span
                                  style={{
                                    display: "block",
                                    marginTop: "0.24rem",
                                    fontSize: "0.71rem",
                                    fontWeight: 600,
                                    color: "#94a3b8",
                                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                  }}
                                >
                                  {item.dateLabel}
                                </span>
                              </td>
                              <td style={{ padding: "0.65rem 0.6rem", minWidth: "210px" }}>
                                <strong style={{ display: "block", color: "#f8fafc", fontSize: "0.82rem", lineHeight: 1.3 }}>
                                  {item.category}
                                </strong>
                                <span style={{ display: "block", marginTop: "0.15rem", color: "#94a3b8", fontSize: "0.71rem" }}>
                                  {item.csiDivision}
                                </span>
                              </td>
                              <td style={{ padding: "0.65rem 0.6rem", whiteSpace: "nowrap" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                                  <span
                                    style={{
                                      display: "inline-block",
                                      fontWeight: 700,
                                      fontSize: "0.7rem",
                                      padding: "0.15rem 0.48rem",
                                      borderRadius: "5px",
                                      background:
                                        item.state === "WI"
                                          ? "rgba(212, 175, 55, 0.18)"
                                          : item.state === "IL"
                                          ? "rgba(59, 130, 246, 0.18)"
                                          : "rgba(148, 163, 184, 0.14)",
                                      color:
                                        item.state === "WI"
                                          ? "#fde68a"
                                          : item.state === "IL"
                                          ? "#93c5fd"
                                          : "#cbd5e1",
                                      border:
                                        item.state === "WI"
                                          ? "1px solid rgba(212, 175, 55, 0.4)"
                                          : item.state === "IL"
                                          ? "1px solid rgba(59, 130, 246, 0.35)"
                                          : "1px solid rgba(148, 163, 184, 0.25)",
                                    }}
                                  >
                                    {item.state}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.71rem",
                                      fontWeight: 600,
                                      color: item.status === "Reconciled" ? "#6ee7b7" : "#fcd34d",
                                    }}
                                  >
                                    ● {item.status}
                                  </span>
                                </div>
                              </td>
                              <td
                                style={{
                                  padding: "0.65rem 0.6rem",
                                  textAlign: "right",
                                  fontWeight: 700,
                                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                                  color: "#f8fafc",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {usd(item.incomeUsd)}
                              </td>
                              <td style={{ padding: "0.65rem 0.6rem", textAlign: "right", whiteSpace: "nowrap" }}>
                                {!isGuest ? (
                                  <button
                                    type="button"
                                    data-testid={`tprj-dossier-btn-${item.id}`}
                                    onClick={() =>
                                      setExpandedTprjId(isExpanded ? null : item.id)
                                    }
                                    style={{
                                      fontSize: "0.72rem",
                                      fontWeight: 700,
                                      padding: "0.28rem 0.65rem",
                                      borderRadius: "6px",
                                      border: "1px solid rgba(212, 175, 55, 0.45)",
                                      background: isExpanded
                                        ? "rgba(212, 175, 55, 0.28)"
                                        : "rgba(15, 31, 56, 0.9)",
                                      color: "#f3d37a",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {isExpanded ? "Close Dossier ▴" : "Open Dossier ▾"}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    data-testid={`tprj-guest-summary-badge-${item.id}`}
                                    title="Internal micro-project technical dossier is restricted to administrators"
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "0.3rem",
                                      fontSize: "0.69rem",
                                      fontWeight: 600,
                                      padding: "0.24rem 0.55rem",
                                      borderRadius: "6px",
                                      border: "1px solid rgba(148, 163, 184, 0.22)",
                                      background: "rgba(15, 23, 42, 0.65)",
                                      color: "#94a3b8",
                                      cursor: "not-allowed",
                                      opacity: 0.85,
                                    }}
                                  >
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <span>Executive Summary Only</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr data-testid={`tprj-dossier-panel-${item.id}`}>
                                <td
                                  colSpan={5}
                                  style={{
                                    padding: "0.85rem 1rem",
                                    background: "rgba(8, 18, 34, 0.92)",
                                    borderBottom: "1px solid rgba(212, 175, 55, 0.3)",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                                      gap: "0.75rem",
                                      marginBottom: "0.6rem",
                                    }}
                                  >
                                    <div>
                                      <span style={{ fontSize: "0.66rem", textTransform: "uppercase", color: "#94a3b8", display: "block" }}>
                                        Technical Record ID
                                      </span>
                                      <strong style={{ color: "#f3d37a", fontSize: "0.8rem" }}>
                                        {item.id} · {item.invoiceRef}
                                      </strong>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: "0.66rem", textTransform: "uppercase", color: "#94a3b8", display: "block" }}>
                                        Completed Date
                                      </span>
                                      <strong style={{ color: "#e2e8f0", fontSize: "0.8rem" }}>
                                        {item.dateLabel}
                                      </strong>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: "0.66rem", textTransform: "uppercase", color: "#94a3b8", display: "block" }}>
                                        Field Operations Lead
                                      </span>
                                      <strong style={{ color: "#f8fafc", fontSize: "0.8rem" }}>
                                        {item.fieldLead}
                                      </strong>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: "0.66rem", textTransform: "uppercase", color: "#94a3b8", display: "block" }}>
                                        Jurisdiction &amp; Execution
                                      </span>
                                      <strong style={{ color: "#6ee7b7", fontSize: "0.8rem" }}>
                                        State of {item.state} · {item.completionPct}% Complete
                                      </strong>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: "0.66rem", textTransform: "uppercase", color: "#94a3b8", display: "block" }}>
                                        Recognized Income
                                      </span>
                                      <strong style={{ color: "#f3d37a", fontSize: "0.8rem" }}>
                                        {usd(item.incomeUsd)} USD
                                      </strong>
                                    </div>
                                  </div>
                                  <p style={{ margin: 0, fontSize: "0.77rem", color: "#cbd5e1", lineHeight: 1.5 }}>
                                    <strong style={{ color: "#eab869" }}>Scope of Work:</strong> {item.scopeSummary}
                                  </p>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr
                        style={{
                          borderTop: "2px solid rgba(212, 175, 55, 0.35)",
                          background: "rgba(212, 175, 55, 0.08)",
                        }}
                      >
                        <td colSpan={3} style={{ padding: "0.7rem 0.6rem", fontWeight: 700, color: "#f3d37a" }}>
                          Total {monthName(selectedMonth)} Income ({selectedMicroProjects.length} TPRJ Micro-Projects)
                        </td>
                        <td
                          style={{
                            padding: "0.7rem 0.6rem",
                            textAlign: "right",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                            color: "#6ee7b7",
                          }}
                        >
                          {usd(selectedMicroProjectsTotal)}
                        </td>
                        <td style={{ padding: "0.7rem 0.6rem", textAlign: "right", fontSize: "0.71rem", color: "#94a3b8" }}>
                          100% Reconciled Sum
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#94a3b8" }}>
                  Scheduled future reporting period ({monthName(selectedMonth)}). Active TPRJ records will populate upon mobilization.
                </p>
              )}
            </div>

            {!isGuest ? (
              <div className="dcc-month-detail-grid">
                {/* Sub-panel 1: Monthly Notes */}
                <div className="dcc-detail-box">
                  <div className="dcc-detail-box-head">
                    <span className="dcc-detail-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                        <path d="M9 12h6" />
                        <path d="M9 16h6" />
                      </svg>
                    </span>
                    <div>
                      <h4>Monthly Notes</h4>
                      <small>Internal &amp; operational highlights · {monthName(selectedMonth, true)} 2026</small>
                    </div>
                  </div>
                  <ul className="dcc-check-list">
                    <li>
                      <i aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </i>
                      <div>
                        <strong>New opportunities (48 active packages)</strong>
                        <span>
                          Commercial, public &amp; private infrastructure intake across WI, IL, IN, IA &amp; MO
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </i>
                      <div>
                        <strong>SAM.gov &amp; Federal registration intake</strong>
                        <span>
                          Corporate compliance &amp; UEI qualification package in review
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </i>
                      <div>
                        <strong>Federal &amp; state contracting programs</strong>
                        <span>
                          Prevailing wage / Davis-Bacon WH-347 payroll tracking active
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </i>
                      <div>
                        <strong>Approved certifications &amp; plan sets</strong>
                        <span>
                          47 verified drawing packages connected to Takeoff Viewer
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Sub-panel 2: Next Month Follow-Ups (November 2026) */}
                <div className="dcc-detail-box">
                  <div className="dcc-detail-box-head">
                    <span className="dcc-detail-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </span>
                    <div>
                      <h4>Next Month Follow-Ups (November 2026)</h4>
                      <small>Corporate agenda &amp; priority actions</small>
                    </div>
                  </div>
                  <ul className="dcc-check-list is-followup">
                    <li>
                      <i aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </i>
                      <div>
                        <strong>Corporate meeting — opportunity review</strong>
                        <span>
                          Nov 3, 2026 · Executive review of October bid conversions
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </i>
                      <div>
                        <strong>Follow up on pending proposals</strong>
                        <span>
                          12 commercial proposals &amp; GC takeoff quotes awaiting award
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </i>
                      <div>
                        <strong>Review certification status</strong>
                        <span>
                          Verify SAM.gov, SBE, WBE, MBE &amp; ESBE filing milestones
                        </span>
                      </div>
                    </li>
                  </ul>
                  <div className="dcc-detail-box-actions">
                    <button
                      type="button"
                      onClick={() => triggerNavigate("corporate_meetings")}
                    >
                      Open Meetings ↗
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerNavigate("followups")}
                    >
                      Open Follow-Ups ({followupsCount}) ↗
                    </button>
                  </div>
                </div>

                {/* Sub-panel 3: Monthly Income Summary (2026) */}
                <div
                  className="dcc-detail-box dcc-gross-profit-box is-admin"
                  data-testid="monthly-income-summary-panel"
                >
                  <div className="dcc-detail-box-head">
                    <span className="dcc-detail-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </span>
                    <div>
                      <h4>Monthly Income Summary</h4>
                      <small>
                        {monthName(selectedMonth)} · Verified corporate income
                      </small>
                    </div>
                  </div>

                  <div
                    className="dcc-gross-profit-metrics"
                    data-testid="admin-income-metrics"
                  >
                    <div className="dcc-gp-row">
                      <span>Selected Month Income ({monthName(selectedMonth, true)})</span>
                      <strong>{money(selectedSeries.issuedCents)}</strong>
                    </div>
                    <div className="dcc-gp-row">
                      <span>TPRJ Micro-Projects in {monthName(selectedMonth, true)}</span>
                      <strong>{selectedMicroProjects.length} records</strong>
                    </div>
                    <div className="dcc-gp-row">
                      <span>Primary Jurisdiction (Wisconsin)</span>
                      <strong>{wiCount} of {selectedMicroProjects.length} projects</strong>
                    </div>
                    <div className="dcc-gp-total">
                      <div>
                        <span>YTD 2026 Total Income (Jan–Oct)</span>
                        <small>212 TPRJ records across 10 periods</small>
                      </div>
                      <strong>{money(ytdCents)}</strong>
                    </div>
                    <button
                      type="button"
                      className="dcc-gp-open-btn"
                      onClick={() =>
                        triggerNavigate("financial_dashboard", undefined, selectedMonth)
                      }
                    >
                      Open full Accounting &amp; Revenue breakdown →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Guest Portfolio Project Status & Bidding Intake inside Month Detail */
              <div className="dcc-month-detail-grid" data-testid="guest-portfolio-status-panel">
                <div className="dcc-detail-box">
                  <div className="dcc-detail-box-head">
                    <span className="dcc-detail-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </span>
                    <div>
                      <h4>Portfolio Project Status</h4>
                      <small>October 2026 Verified Opportunities Distribution</small>
                    </div>
                  </div>

                  <div style={{ padding: "0.5rem 0", display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.825rem" }}>
                        <span style={{ fontWeight: 600, color: "#f59e0b" }}>Pending (7 records · 15%)</span>
                        <span style={{ color: "var(--muted, #94a3b8)", fontSize: "0.75rem" }}>Pending company information &amp; documentation</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "15%", background: "#f59e0b", borderRadius: "3px" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.825rem" }}>
                        <span style={{ fontWeight: 600, color: "#f43f5e" }}>Cancelled (41 records · 85%)</span>
                        <span style={{ color: "var(--muted, #94a3b8)", fontSize: "0.75rem" }}>Cancelled / bidding window closed</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "85%", background: "#f43f5e", borderRadius: "3px" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="dcc-detail-box">
                  <div className="dcc-detail-box-head">
                    <span className="dcc-detail-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <line x1="10" y1="9" x2="8" y2="9" />
                      </svg>
                    </span>
                    <div>
                      <h4>Annual TPRJ Portfolio Summary</h4>
                      <small>212 TPRJ Micro-Projects · WI Majority &amp; IL Secondary</small>
                    </div>
                  </div>

                  <div className="dcc-gross-profit-metrics">
                    <div className="dcc-gp-row">
                      <span>Selected Month ({monthName(selectedMonth, true)} 2026)</span>
                      <strong>{usd(selectedMicroProjectsTotal)} ({selectedMicroProjects.length} TPRJ)</strong>
                    </div>
                    <div className="dcc-gp-row">
                      <span>Wisconsin (WI) Primary Operations</span>
                      <strong>139 of 212 TPRJ Projects (65.6%)</strong>
                    </div>
                    <div className="dcc-gp-row">
                      <span>Illinois (IL) &amp; Regional Operations</span>
                      <strong>51 IL · 22 Regional (IN/IA/MO)</strong>
                    </div>
                    <div className="dcc-gp-total">
                      <div>
                        <span>YTD 2026 Total Income (Jan–Oct)</span>
                        <small>212 Reconciled &amp; Active TPRJ Records</small>
                      </div>
                      <strong>{money(ytdCents)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right-Hand Column: Top = 8 Certifications & Programs, Bottom = 2026 Monthly Income Ledger */}
        <aside
          className="dcc-console-right-col"
          aria-label="Corporate Certifications and Monthly Income Ledger"
        >
          {/* Right Menu 1: 8 Certifications & Programs */}
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
              {CORPORATE_CERTIFICATIONS_STATUS.map((cert) => (
                <button
                  type="button"
                  key={cert.id}
                  className="dcc-right-menu-item is-cert"
                  onClick={() =>
                    triggerNavigate(
                      cert.id === "union_private" ? "lead" : "compliance"
                    )
                  }
                >
                  <span className="dcc-right-menu-icon" aria-hidden="true">
                    {renderCertIcon(cert.id)}
                  </span>
                  <span className="dcc-right-menu-text">
                    <strong>{cert.code}</strong>
                    <small>{cert.label}</small>
                  </span>
                  <span className="dcc-right-menu-chevron" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Right Menu 2: 2026 Monthly Income Ledger (Jan–Oct) */}
          <section
            className="dcc-card dcc-right-menu-card"
            data-testid="corporate-income-ledger-panel"
          >
            <header className="dcc-right-menu-head">
              <div>
                <p className="dcc-eyebrow">CORPORATE RECORD · 2026</p>
                <h3>Monthly Income Ledger</h3>
              </div>
              <span className="dcc-badge" data-tone="emerald">
                212 TPRJ
              </span>
            </header>
            <div className="dcc-right-menu-list">
              {DEFAULT_2026_MONTHLY_SERIES.filter((m) => m.issuedCents > 0).map((m) => {
                const isSelected = m.key === selectedMonth;
                return (
                  <button
                    type="button"
                    key={m.key}
                    className={`dcc-right-menu-item ${isSelected ? "is-selected" : ""}`}
                    onClick={() => selectMonthPill(m.key)}
                  >
                    <span className="dcc-right-menu-text">
                      <strong>{monthName(m.key, true)} 2026</strong>
                      <small>{m.opps} TPRJ micro-projects</small>
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "0.85rem", color: isSelected ? "#f59e0b" : "inherit" }}>
                      {money(m.issuedCents)}
                    </span>
                  </button>
                );
              })}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.75rem",
                  marginTop: "0.25rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "6px",
                }}
              >
                <div>
                  <strong style={{ fontSize: "0.85rem", display: "block" }}>YTD Total Income</strong>
                  <small style={{ color: "var(--muted, #94a3b8)", fontSize: "0.75rem" }}>212 TPRJ projects · Jan–Oct</small>
                </div>
                <strong style={{ fontSize: "1rem", color: "#10b981" }}>
                  {money(ytdCents)}
                </strong>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Bottom Full-Width Table: 42 Opportunities of the Month — October 2026 (with in-place Takeoff Drawing Viewer) */}
      <VerifiedOpportunitiesTable defaultLimit={12} isGuest={isGuest} />

      <p className="dcc-snapshot">
        Recorded snapshot · {asOf.slice(0, 10)} UTC ·{" "}
        {projectId ? "Selected project" : "Authorized company portfolio"}
      </p>
    </div>
  );
}
