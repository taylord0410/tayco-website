"use client";
import { useState } from "react";
import type { Entry } from "@/lib/erp";
import type { GuestConsoleData } from "@/lib/guest-workspace";
import { CORPORATE_CERTIFICATIONS_STATUS } from "@/lib/verified-bidding-opportunities";
import { getMicroProjectsByPeriod } from "@/lib/monthly-microprojects-2026";
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
  { key: "2026-10", issuedCents: 2178900, opps: 1 },
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
  const [adminOnlyModalTitle, setAdminOnlyModalTitle] = useState<string | null>(null);

  const monthSeries = DEFAULT_2026_MONTHLY_SERIES;
  const maxBar = Math.max(1, ...monthSeries.map((m) => m.issuedCents));
  const selectedSeries =
    monthSeries.find((m) => m.key === selectedMonth) ?? monthSeries[9];

  const ytdCents = monthSeries
    .filter((m) => m.key <= currentMonthKey)
    .reduce((sum, m) => sum + m.issuedCents, 0);

  const triggerNavigate = (view: string, projId?: string, month?: string) => {
    if (isGuest) {
      const mapped = GUEST_SECTION_MAP[view] || view;
      onNavigate(mapped, projId, month);
    } else {
      onNavigate(view, projId, month);
    }
  };

  const selectMonthPill = (monthKey: string) => {
    if (isGuest && monthKey !== currentMonthKey) {
      setAdminOnlyModalTitle(`Historical Monthly Breakdown (${monthName(monthKey)})`);
      return;
    }
    setSelectedMonth(monthKey);
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
              Guest review accounts have full access to current <strong>October 2026 Opportunities &amp; Projects</strong> and interactive <strong>Blueprints / Plans</strong>.
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
                  )}, ${m.opps} ${m.opps === 1 ? "consolidated record" : "micro-projects"}. Select month.`}
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

        {/* Card 2 (Directly Below the Chart, Full Width): New Opportunities Since October 2026 Header + Opportunities & Large Projects Table */}
        <VerifiedOpportunitiesTable defaultLimit={48} isGuest={isGuest} />

        {/* Card 3 (Directly Below the Projects Table, Full Width): 2026 Monthly Income Ledger (Jan–Oct) with October Details in its corresponding row */}
        <section
          className="dcc-card dcc-income-ledger-wide-card"
          data-testid="corporate-income-ledger-panel"
        >
          <header className="dcc-right-menu-head">
            <div>
              <p className="dcc-eyebrow">CORPORATE RECORD · 2026</p>
              <h3>Monthly Income Ledger</h3>
            </div>
            <span className="dcc-badge" data-tone="emerald">
              207 TPRJ
            </span>
          </header>
          <div className="dcc-right-menu-list">
            {DEFAULT_2026_MONTHLY_SERIES.filter((m) => m.issuedCents > 0).map((m) => {
              const isSelected = m.key === selectedMonth;
              const isOctRow = m.key === "2026-10";
              const rowMicroProjects = getMicroProjectsByPeriod(m.key);
              return (
                <div
                  key={m.key}
                  data-testid={isOctRow ? "october-right-row-detail" : undefined}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: "10px",
                    border: isSelected
                      ? "1px solid rgba(212, 175, 55, 0.45)"
                      : "1px solid rgba(148, 163, 184, 0.14)",
                    background: isSelected ? "rgba(212, 175, 55, 0.07)" : "rgba(15, 32, 56, 0.45)",
                  }}
                >
                  <button
                    type="button"
                    className={`dcc-right-menu-item ${isSelected ? "is-selected" : ""}`}
                    style={{ border: "none", background: "transparent" }}
                    onClick={() => {
                      if (isGuest && !isOctRow) {
                        setAdminOnlyModalTitle(`Monthly Income Detail (${monthName(m.key)})`);
                        return;
                      }
                      setSelectedMonth(m.key);
                    }}
                  >
                    <span className="dcc-right-menu-text">
                      <strong>{monthName(m.key, true)} 2026</strong>
                      <small>
                        {isOctRow
                          ? "1 consolidated record (TPRJ-2610-207)"
                          : `${m.opps} TPRJ micro-projects`}
                      </small>
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem", color: isSelected ? "#f59e0b" : "inherit" }}>
                      {money(m.issuedCents)}
                    </span>
                  </button>

                  {/* October Detail (or Selected Month Detail for Admin) stays exclusively in its corresponding row */}
                  {isSelected && (
                    <div
                      style={{
                        padding: "0.65rem 0.9rem 0.8rem",
                        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: "0.78rem",
                        color: "#cbd5e1",
                      }}
                    >
                      {isOctRow ? (
                        <div>
                          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                            <strong style={{ color: "#f3d37a", fontSize: "0.8rem" }}>
                              October 2026 Consolidated Record
                            </strong>
                            <span style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "0.74rem" }}>
                              ● Reconciled
                            </span>
                          </div>
                          <p style={{ margin: "0 0 0.35rem", fontSize: "0.76rem", color: "#94a3b8", lineHeight: 1.5 }}>
                            TPRJ-2610-207 · Pre-Oct 8 Cutoff (Oct 01–07, 2026) · Consolidated turnkey package total: <strong style={{ color: "#f8fafc" }}>{usd(21789)}</strong>
                          </p>
                          {!isGuest && (
                            <button
                              type="button"
                              onClick={() => openMonthDetail("2026-10")}
                              style={{
                                marginTop: "0.2rem",
                                padding: "0.28rem 0.65rem",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                borderRadius: "6px",
                                border: "1px solid rgba(212, 175, 55, 0.4)",
                                background: "rgba(15, 31, 56, 0.85)",
                                color: "#f3d37a",
                                cursor: "pointer",
                              }}
                            >
                              Open October Ledger →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "0.4rem", marginBottom: "0.3rem" }}>
                            <strong style={{ color: "#f3d37a", fontSize: "0.8rem" }}>
                              {monthName(m.key)} Breakdown
                            </strong>
                            <span style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "0.74rem" }}>
                              {rowMicroProjects.length} records
                            </span>
                          </div>
                          <p style={{ margin: "0 0 0.35rem", fontSize: "0.76rem", color: "#94a3b8", lineHeight: 1.5 }}>
                            {rowMicroProjects[0]?.id} – {rowMicroProjects[rowMicroProjects.length - 1]?.id} · Total: <strong style={{ color: "#f8fafc" }}>{money(m.issuedCents)}</strong>
                          </p>
                          {!isGuest && (
                            <button
                              type="button"
                              onClick={() => openMonthDetail(m.key)}
                              style={{
                                marginTop: "0.2rem",
                                padding: "0.28rem 0.65rem",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                borderRadius: "6px",
                                border: "1px solid rgba(212, 175, 55, 0.4)",
                                background: "rgba(15, 31, 56, 0.85)",
                                color: "#f3d37a",
                                cursor: "pointer",
                              }}
                            >
                              Open {monthName(m.key, true)} Ledger →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.85rem 1rem",
                marginTop: "0.35rem",
                borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: "8px",
              }}
            >
              <div>
                <strong style={{ fontSize: "0.9rem", display: "block" }}>YTD Total Income</strong>
                <small style={{ color: "var(--muted, #94a3b8)", fontSize: "0.76rem" }}>207 TPRJ records · Jan–Oct</small>
              </div>
              <strong style={{ fontSize: "1.08rem", color: "#10b981" }}>
                {money(ytdCents)}
              </strong>
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
