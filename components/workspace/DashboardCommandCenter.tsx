"use client";
import { useState } from "react";
import type { Entry } from "@/lib/erp";
import type { GuestConsoleData } from "@/lib/guest-workspace";
import { dashboardAgenda } from "@/lib/dashboard-agenda";
import { CORPORATE_CERTIFICATIONS_STATUS } from "@/lib/verified-bidding-opportunities";
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
  { key: "2026-01", issuedCents: 42500000, opps: 14 },
  { key: "2026-02", issuedCents: 65768000, opps: 16 },
  { key: "2026-03", issuedCents: 71978900, opps: 19 },
  { key: "2026-04", issuedCents: 70078900, opps: 21 },
  { key: "2026-05", issuedCents: 82567900, opps: 24 },
  { key: "2026-06", issuedCents: 92157800, opps: 27 },
  { key: "2026-07", issuedCents: 90879200, opps: 31 },
  { key: "2026-08", issuedCents: 94078900, opps: 35 },
  { key: "2026-09", issuedCents: 93848900, opps: 38 },
  { key: "2026-10", issuedCents: 2178900, opps: 42 },
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
  };

  const openMonthDetail = (monthKey: string) => {
    setSelectedMonth(monthKey);
    if (!isGuest) {
      onNavigate("financial_dashboard", undefined, monthKey);
    }
  };

  return (
    <div className="dcc-dashboard" data-testid="dashboard-command-center">
      {/* 2-Column Split: Left (Monthly Activity + Month Detail / Portfolio Status) | Right (Certifications + Monthly Income Ledger) */}
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
                    )}, ${m.opps} opportunities. Select month.`}
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

          {/* Card 2: Month Detail (Admin) OR Portfolio Project Status & Bidding Intake (Guest) */}
          {!isGuest ? (
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
                      Current Month
                    </span>
                  ) : (
                    <span className="dcc-badge" data-tone="slate">
                      Historical / Planning Record
                    </span>
                  )}
                </div>
              </header>

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
                      <small>Internal &amp; operational highlights · Oct 2026</small>
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
                        <strong>New opportunities (42 active packages)</strong>
                        <span>
                          Commercial, retail &amp; civil bidding intake across IL, IN, IA,
                          WI &amp; MO
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
                        <strong>Union &amp; private commercial projects</strong>
                        <span>
                          Supermarket, drive-thru coffee, retail &amp; fast-casual commercial packages
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
                          41 verified drawing packages connected to Takeoff Viewer
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
                    <li>
                      <i aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </i>
                      <div>
                        <strong>Prepare documentation for new projects</strong>
                        <span>
                          Subcontractor COIs, W-9s &amp; November field mobilization
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
                      <span>September 2026 Income</span>
                      <strong>$938,489</strong>
                    </div>
                    <div className="dcc-gp-row">
                      <span>Peak Monthly Income (Aug 2026)</span>
                      <strong>$940,789</strong>
                    </div>
                    <div className="dcc-gp-total">
                      <div>
                        <span>YTD 2026 Total Income (Jan–Oct)</span>
                        <small>10 recorded monthly periods</small>
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
            </section>
          ) : (
            /* Guest Portfolio Project Status & Bidding Intake */
            <section
              className="dcc-card dcc-month-detail-card"
              data-testid="guest-portfolio-status-panel"
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
                  <h3>Portfolio Project Status &amp; Intake Breakdown</h3>
                </div>
                <div className="dcc-detail-badges">
                  <span className="dcc-badge" data-tone="amber">
                    42 Verified Packages · Oct 2026
                  </span>
                </div>
              </header>

              <div className="dcc-month-detail-grid">
                {/* Box 1: Portfolio Project Status */}
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
                        <span style={{ fontWeight: 600, color: "#f59e0b" }}>Pending (6 records · 14%)</span>
                        <span style={{ color: "var(--muted, #94a3b8)", fontSize: "0.75rem" }}>Pending company information &amp; documentation</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "14%", background: "#f59e0b", borderRadius: "3px" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.825rem" }}>
                        <span style={{ fontWeight: 600, color: "#f43f5e" }}>Cancelled (36 records · 86%)</span>
                        <span style={{ color: "var(--muted, #94a3b8)", fontSize: "0.75rem" }}>Cancelled / bidding window closed</span>
                      </div>
                      <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.08)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: "86%", background: "#f43f5e", borderRadius: "3px" }} />
                      </div>
                    </div>
                  </div>

                  <ul className="dcc-check-list" style={{ marginTop: "0.5rem" }}>
                    <li>
                      <i aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </i>
                      <div>
                        <strong>TMAD Franchise Construction</strong>
                        <span>Fast-Casual Restaurant Fit-Out</span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </i>
                      <div>
                        <strong>Residential Cluster Development</strong>
                        <span>Five 3-Unit Residential Buildings</span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </i>
                      <div>
                        <strong>Jewel-Osco Store Planning</strong>
                        <span>Supermarket Exterior Remodel</span>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Box 2: Cancelled & Closed Intake Summary */}
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
                      <h4>Cancelled &amp; Closed Intake Summary</h4>
                      <small>36 packages · Historical archived bidding cycles</small>
                    </div>
                  </div>

                  <ul className="dcc-check-list is-followup">
                    <li>
                      <i aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </i>
                      <div>
                        <strong>Crossroad Engineers</strong>
                        <span>Supermarket &amp; Civil Site Package</span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </i>
                      <div>
                        <strong>Dutch Bros Construction</strong>
                        <span>Drive-Thru Coffee Stand</span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </i>
                      <div>
                        <strong>MSD Facilities Group</strong>
                        <span>School Bus Transportation Facility</span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </i>
                      <div>
                        <strong>Dollar Tree Store Development</strong>
                        <span>Retail Variety Store Build-Out</span>
                      </div>
                    </li>
                  </ul>
                  <div className="dcc-detail-box-actions">
                    <button
                      type="button"
                      onClick={() => triggerNavigate("projects")}
                    >
                      View All Intake Records ↗
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
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
                Jan–Oct
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
                      <small>{m.opps} packages tracked</small>
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
                  <small style={{ color: "var(--muted, #94a3b8)", fontSize: "0.75rem" }}>10 recorded monthly periods</small>
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
