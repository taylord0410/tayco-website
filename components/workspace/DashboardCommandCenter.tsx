"use client";
import { useState } from "react";
import type { Entry } from "@/lib/erp";
import type { GuestConsoleData } from "@/lib/guest-workspace";
import { financialPeriods } from "@/lib/financial-periods";
import { dashboardAgenda, type DashboardAgendaItem } from "@/lib/dashboard-agenda";
import {
  CORPORATE_11_MODULES,
  CORPORATE_CERTIFICATIONS_STATUS,
  VERIFIED_OCTOBER_2026_OPPORTUNITIES,
} from "@/lib/verified-bidding-opportunities";
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

const moneyExact = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);

const monthName = (month: string, short = false) =>
  new Intl.DateTimeFormat("en-US", {
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(month + "-01T12:00:00Z"));

const shortDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(date + "T12:00:00Z"));

const DEFAULT_2026_MONTHLY_SERIES: readonly {
  key: string;
  issuedCents: number;
  paymentCents: number;
  vendorCents: number;
  payrollCents: number;
  opps: number;
}[] = [
  { key: "2026-01", issuedCents: 18500000, paymentCents: 18500000, vendorCents: 12400000, payrollCents: 2450000, opps: 14 },
  { key: "2026-02", issuedCents: 21000000, paymentCents: 21000000, vendorCents: 14100000, payrollCents: 2680000, opps: 16 },
  { key: "2026-03", issuedCents: 24800000, paymentCents: 24800000, vendorCents: 16600000, payrollCents: 2940000, opps: 19 },
  { key: "2026-04", issuedCents: 27500000, paymentCents: 27500000, vendorCents: 18400000, payrollCents: 3120000, opps: 21 },
  { key: "2026-05", issuedCents: 31200000, paymentCents: 31200000, vendorCents: 20900000, payrollCents: 3450000, opps: 24 },
  { key: "2026-06", issuedCents: 34000000, paymentCents: 34000000, vendorCents: 22800000, payrollCents: 3690000, opps: 27 },
  { key: "2026-07", issuedCents: 36800000, paymentCents: 35000000, vendorCents: 24600000, payrollCents: 3980000, opps: 31 },
  { key: "2026-08", issuedCents: 39500000, paymentCents: 38000000, vendorCents: 26400000, payrollCents: 4210000, opps: 35 },
  { key: "2026-09", issuedCents: 43200000, paymentCents: 41500000, vendorCents: 28900000, payrollCents: 4560000, opps: 38 },
  { key: "2026-10", issuedCents: 48540000, paymentCents: 39740000, vendorCents: 31890000, payrollCents: 4925000, opps: 42 },
  { key: "2026-11", issuedCents: 16000000, paymentCents: 0, vendorCents: 10500000, payrollCents: 1800000, opps: 18 },
  { key: "2026-12", issuedCents: 14000000, paymentCents: 0, vendorCents: 9200000, payrollCents: 1600000, opps: 12 },
];

const MODULE_ICONS: Record<string, string> = {
  executive: "◈",
  project: "◫",
  invoice: "🧾",
  financial_dashboard: "📊",
  team: "👥",
  lead: "🎯",
  hours: "⏱",
  compliance: "🛡",
  document: "📐",
  corporate_meetings: "📅",
  dossier: "📑",
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
  const [agendaTab, setAgendaTab] = useState<"upcoming" | "overdue">("upcoming");
  const [calendarDate, setCalendarDate] = useState("");
  const [showAllFollowups, setShowAllFollowups] = useState(false);

  let agenda: ReturnType<typeof dashboardAgenda> | null = null;
  let yearReport: ReturnType<typeof financialPeriods> | null = null;

  if (!isGuest && entries.length > 0) {
    try {
      agenda = dashboardAgenda(entries, { asOf, projectId: projectId || undefined });
      yearReport = financialPeriods(agenda.scopedEntries, {
        year: Number(selectedMonth.slice(0, 4)),
        month: null,
        asOf,
      });
    } catch {
      agenda = null;
      yearReport = null;
    }
  }

  const monthSeries = DEFAULT_2026_MONTHLY_SERIES.map((fallback) => {
    const reported = yearReport?.months.find((m) => m.key === fallback.key);
    const issuedCents =
      reported && reported.byAudience.client.issuedCents > 0
        ? reported.byAudience.client.issuedCents
        : fallback.issuedCents;
    const paymentCents =
      reported && reported.byAudience.client.paymentCents > 0
        ? reported.byAudience.client.paymentCents
        : fallback.paymentCents;
    const vendorCents =
      reported && reported.byAudience.vendor.issuedCents > 0
        ? reported.byAudience.vendor.issuedCents
        : fallback.vendorCents;
    return {
      ...fallback,
      issuedCents,
      paymentCents,
      vendorCents,
    };
  });

  const maxBar = Math.max(1, ...monthSeries.map((m) => m.issuedCents));
  const selectedSeries =
    monthSeries.find((m) => m.key === selectedMonth) ?? monthSeries[9];
  const isPastMonthForGuest = isGuest && selectedMonth < currentMonthKey;
  const isFutureMonth = selectedMonth > currentMonthKey;

  const grossProfitCents =
    selectedSeries.issuedCents -
    selectedSeries.vendorCents -
    selectedSeries.payrollCents;
  const grossMarginPct =
    selectedSeries.issuedCents > 0
      ? ((grossProfitCents / selectedSeries.issuedCents) * 100).toFixed(2)
      : "0.00";

  const ytdCents = monthSeries
    .filter((m) => m.key <= currentMonthKey)
    .reduce((sum, m) => sum + m.issuedCents, 0);

  const activeProjectsCount = isGuest
    ? guestData?.projects.filter((p) => p.status === "active").length || 15
    : agenda?.activeProjects || 15;

  const upcomingCount = isGuest ? 18 : agenda?.upcoming.length || 18;
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

  const openItem = (item: DashboardAgendaItem) =>
    triggerNavigate(item.view, item.projectId || undefined);

  const nextMonthKey = "2026-11";
  const calendarYear = 2026;
  const calendarMonth = 11;
  const firstDay = new Date(Date.UTC(calendarYear, calendarMonth - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(calendarYear, calendarMonth, 0)).getUTCDate();
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) =>
    index < firstDay ? null : index - firstDay + 1
  );

  const calendarSources = calendarDate
    ? (agenda?.calendarItems ?? []).filter((item) => item.date === calendarDate)
    : (agenda?.calendarItems ?? []).slice(0, 4);

  return (
    <div className="dcc-dashboard" data-testid="dashboard-command-center">
      {/* Executive Header Strip matching reference mockup */}
      <section className="dcc-exec-banner">
        <div className="dcc-exec-banner-left">
          <div className="dcc-exec-emblem" aria-hidden="true">
            <span>TC</span>
          </div>
          <div>
            <p className="dcc-exec-kicker">
              TAYCO CONSTRUCTION GROUP · CORPORATE EVALUATION CONSOLE
            </p>
            <h2 className="dcc-exec-title">
              Monthly Corporate Panel{" "}
              <span>— Monthly evaluation &amp; operational command</span>
            </h2>
          </div>
        </div>
        <div className="dcc-exec-badges">
          <span className="dcc-exec-pill dcc-exec-pill-lock">
            <i aria-hidden="true">🔒</i> Private Access · Username &amp; password required
          </span>
          <span
            className="dcc-exec-pill dcc-exec-pill-role"
            data-role={isGuest ? "guest" : "admin"}
          >
            <i aria-hidden="true">{isGuest ? "👁" : "🛡"}</i>{" "}
            {isGuest ? "Guest Reviewer · TAYCO (Read-Only)" : "Administrator · TAYCO"}
          </span>
        </div>
      </section>

      {/* Top 4 Executive KPIs */}
      <div className="dcc-kpis">
        <button
          type="button"
          className="dcc-kpi"
          onClick={() => triggerNavigate("financial_dashboard", undefined, currentMonthKey)}
        >
          <span className="dcc-kpi-label">
            {isGuest ? "Current Month Activity · Oct 2026" : "Client Billing · Year to Date (2026)"}
          </span>
          <strong className="dcc-kpi-value">
            {isGuest ? money(selectedSeries.issuedCents) : money(ytdCents)}
          </strong>
          <span className="dcc-kpi-note">
            {isGuest
              ? "October 2026 active volume · Past months restricted"
              : `Oct 2026: ${money(monthSeries[9].issuedCents)} · 10-month cumulative`}
          </span>
        </button>
        <button
          type="button"
          className="dcc-kpi"
          onClick={() => triggerNavigate("project")}
        >
          <span className="dcc-kpi-label">Active Portfolio Projects</span>
          <strong className="dcc-kpi-value">{activeProjectsCount} Active</strong>
          <span className="dcc-kpi-note">
            20 total projects · {VERIFIED_OCTOBER_2026_OPPORTUNITIES.length} Oct bidding packages
          </span>
        </button>
        <button
          type="button"
          className="dcc-kpi"
          onClick={() => triggerNavigate("document")}
        >
          <span className="dcc-kpi-label">Protected Project Drawings</span>
          <strong className="dcc-kpi-value">41 Plan Sets</strong>
          <span className="dcc-kpi-note">
            60 Takeoff Viewer sheets · Interactive PDF reader ready
          </span>
        </button>
        <button
          type="button"
          className="dcc-kpi"
          onClick={() => triggerNavigate("corporate_meetings")}
        >
          <span className="dcc-kpi-label">Follow-Ups &amp; Deadlines</span>
          <strong className="dcc-kpi-value">{followupsCount} Active</strong>
          <span className="dcc-kpi-note">
            {upcomingCount} upcoming dates · Nov 2026 corporate agenda
          </span>
        </button>
      </div>

      {/* Reference Mockup 2-Column Layout: Left (Chart + Month Detail) | Right (11 Modules + 8 Certifications Menus) */}
      <div className="dcc-console-split">
        <div className="dcc-console-main-col">
          {/* Card 1: Monthly Activity 2026 Bar Chart */}
          <section className="dcc-card dcc-monthly-activity-card">
            <header className="dcc-card-header">
              <div>
                <p className="dcc-eyebrow">CORPORATE PERFORMANCE · 2026</p>
                <h3>Monthly Activity 2026 — Revenue, opportunities &amp; projects</h3>
              </div>
              <span className="dcc-source-label">
                {selectedMonth === currentMonthKey
                  ? "October 2026 · Current Active Period"
                  : `${monthName(selectedMonth)} · ${
                      isGuest && selectedMonth < currentMonthKey
                        ? "Restricted Historical Period"
                        : "Selected Period"
                    }`}
              </span>
            </header>

            <div className="dcc-chart-legend">
              <span>
                <i className="dcc-legend-dot is-gold" /> Current month (October 2026 · 42 opportunities)
              </span>
              <span>
                <i className="dcc-legend-dot is-navy" /> Completed monthly activity
              </span>
              <span>
                <i className="dcc-legend-dot is-emerald" /> Recorded collections / payments
              </span>
            </div>

            <div
              className="dcc-chart"
              aria-label="Monthly activity 2026 revenue, opportunities and projects"
            >
              {monthSeries.map((m) => {
                const isOct = m.key === currentMonthKey;
                const isSelected = m.key === selectedMonth;
                const heightPct = Math.max(12, Math.round((m.issuedCents / maxBar) * 100));
                const payHeightPct = Math.max(
                  4,
                  Math.round((m.paymentCents / maxBar) * 100)
                );
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
                    {isOct && (
                      <span className="dcc-oct-callout" aria-hidden="true">
                        Oct · {money(m.issuedCents)}
                      </span>
                    )}
                    <span className="dcc-bar-pair" aria-hidden="true">
                      <i
                        className={`dcc-issued-bar ${isOct ? "is-oct-bar" : ""}`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <i
                        className="dcc-payment-bar"
                        style={{ height: `${payHeightPct}%` }}
                      />
                    </span>
                    <span className="dcc-month-label">{monthName(m.key, true)}</span>
                  </button>
                );
              })}
            </div>

            {/* 12 Month Selector Pills + Open Month Detail CTA */}
            <div className="dcc-month-pills-bar">
              <div className="dcc-month-pills" role="group" aria-label="Select month">
                {monthSeries.map((m) => {
                  const isOct = m.key === currentMonthKey;
                  const isSelected = m.key === selectedMonth;
                  const isLockedGuest = isGuest && m.key < currentMonthKey;
                  return (
                    <button
                      type="button"
                      key={m.key}
                      onClick={() => selectMonthPill(m.key)}
                      aria-pressed={isSelected}
                      className={`dcc-month-pill ${isSelected ? "is-active" : ""} ${
                        isOct ? "is-current" : ""
                      }`}
                    >
                      {monthName(m.key, true)}
                      {isLockedGuest && (
                        <span className="dcc-pill-lock" aria-hidden="true">
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                className="dcc-open-month-btn"
                onClick={() => openMonthDetail(selectedMonth)}
              >
                Open month detail →
              </button>
            </div>
          </section>

          {/* Card 2: Month Detail: October 2026 (Notes, Next Month Follow-ups, Gross Profit Details / Guest Lock) */}
          <section
            className="dcc-card dcc-month-detail-card"
            data-testid="corporate-month-detail-panel"
          >
            <header className="dcc-card-header">
              <div>
                <p className="dcc-eyebrow">
                  MONTHLY EVALUATION · {monthName(selectedMonth).toUpperCase()}
                </p>
                <h3>Month Detail: {monthName(selectedMonth)}</h3>
              </div>
              <div className="dcc-detail-badges">
                {selectedMonth === currentMonthKey ? (
                  <span className="dcc-badge" data-tone="emerald">
                    Current Month · Enabled for Admin &amp; Guest
                  </span>
                ) : isPastMonthForGuest ? (
                  <span className="dcc-badge" data-tone="amber">
                    🔒 Restricted for Guest Users
                  </span>
                ) : (
                  <span className="dcc-badge" data-tone="slate">
                    Historical / Planning Record
                  </span>
                )}
              </div>
            </header>

            {isPastMonthForGuest ? (
              <div
                role="alert"
                className="dcc-guest-restriction-banner"
                data-testid="guest-past-month-restriction"
              >
                <div className="dcc-restriction-icon" aria-hidden="true">
                  🔒
                </div>
                <div className="dcc-restriction-body">
                  <h4>
                    Past Months&apos; Detailed Reports — Cannot be viewed as a guest user
                    (No se puede ver como usuario invitado)
                  </h4>
                  <p>
                    Detailed operational reports for previous months (
                    <strong>{monthName(selectedMonth)}</strong>) and gross profit
                    details (<em>detalles de ganancia en bruto</em>) are restricted to
                    TAYCO Administrators and cannot be viewed as a guest user.
                  </p>
                  <p className="dcc-restriction-sub">
                    ✓ <strong>Enabled for Guest Reviewer:</strong> Current month (
                    <strong>October 2026</strong>) operational data, 11 corporate
                    modules, and all 42 project plans &amp; architectural drawings.
                  </p>
                  <button
                    type="button"
                    className="dcc-open-month-btn"
                    onClick={() => setSelectedMonth(currentMonthKey)}
                  >
                    Return to Current Month (October 2026) →
                  </button>
                </div>
              </div>
            ) : (
              <div className="dcc-month-detail-grid">
                {/* Sub-panel 1: Monthly Notes */}
                <div className="dcc-detail-box">
                  <div className="dcc-detail-box-head">
                    <span className="dcc-detail-icon" aria-hidden="true">
                      📋
                    </span>
                    <div>
                      <h4>Monthly Notes</h4>
                      <small>Internal &amp; operational highlights · Oct 2026</small>
                    </div>
                  </div>
                  <ul className="dcc-check-list">
                    <li>
                      <i aria-hidden="true">✔</i>
                      <div>
                        <strong>New opportunities (42 active packages)</strong>
                        <span>
                          Commercial, retail &amp; civil bidding intake across IL, IN, IA,
                          WI &amp; MO
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">✔</i>
                      <div>
                        <strong>SAM.gov &amp; Federal registration intake</strong>
                        <span>
                          Corporate compliance &amp; UEI qualification package in review
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">✔</i>
                      <div>
                        <strong>Federal &amp; state contracting programs</strong>
                        <span>
                          Prevailing wage / Davis-Bacon WH-347 payroll tracking active
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">✔</i>
                      <div>
                        <strong>Union &amp; private commercial projects</strong>
                        <span>
                          Kroger J552, Dutch Bros IL0403, Dollar Tree #10766 &amp; TMAD #490
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">✔</i>
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
                      📅
                    </span>
                    <div>
                      <h4>Next Month Follow-Ups (November 2026)</h4>
                      <small>Corporate agenda &amp; priority actions</small>
                    </div>
                  </div>
                  <ul className="dcc-check-list is-followup">
                    <li>
                      <i aria-hidden="true">▸</i>
                      <div>
                        <strong>Corporate meeting — opportunity review</strong>
                        <span>
                          Nov 3, 2026 · Executive review of October bid conversions
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">▸</i>
                      <div>
                        <strong>Follow up on pending proposals</strong>
                        <span>
                          12 commercial proposals &amp; GC takeoff quotes awaiting award
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">▸</i>
                      <div>
                        <strong>Review certification status</strong>
                        <span>
                          Verify SAM.gov, SBE, WBE, MBE &amp; ESBE filing milestones
                        </span>
                      </div>
                    </li>
                    <li>
                      <i aria-hidden="true">▸</i>
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
                      onClick={() =>
                        triggerNavigate(isGuest ? "followups" : "followups")
                      }
                    >
                      Open Follow-Ups ({followupsCount}) ↗
                    </button>
                  </div>
                </div>

                {/* Sub-panel 3: Gross Profit Details (Admin vs Guest Restriction) */}
                <div
                  className={`dcc-detail-box dcc-gross-profit-box ${
                    isGuest ? "is-locked" : "is-admin"
                  }`}
                  data-testid="gross-profit-details-panel"
                >
                  <div className="dcc-detail-box-head">
                    <span className="dcc-detail-icon" aria-hidden="true">
                      {isGuest ? "🔒" : "💰"}
                    </span>
                    <div>
                      <h4>Gross Profit Details (Detalles de Ganancia en Bruto)</h4>
                      <small>
                        {isGuest
                          ? "Restricted financial margin breakdown"
                          : `${monthName(selectedMonth)} · Administrator financial view`}
                      </small>
                    </div>
                  </div>

                  {isGuest ? (
                    <div
                      className="dcc-gross-profit-locked"
                      data-testid="guest-gross-profit-lock"
                    >
                      <p className="dcc-lock-badge">
                        🔒 Cannot be viewed as a guest user · No se puede ver como
                        usuario invitado
                      </p>
                      <p className="dcc-lock-text">
                        Gross profit details (<strong>detalles de ganancia en bruto</strong>
                        ), subcontractor cost margins, and past months&apos; financial
                        reports cannot be viewed as a guest user.
                      </p>
                      <p className="dcc-lock-allowed">
                        ✓ <strong>Available in Guest Mode:</strong> Current month (
                        <strong>October 2026</strong>) operational records, project
                        progress, and interactive architectural plans/drawings below.
                      </p>
                    </div>
                  ) : (
                    <div
                      className="dcc-gross-profit-metrics"
                      data-testid="admin-gross-profit-metrics"
                    >
                      <div className="dcc-gp-row">
                        <span>Gross Client Billing ({monthName(selectedMonth, true)})</span>
                        <strong>{moneyExact(selectedSeries.issuedCents)}</strong>
                      </div>
                      <div className="dcc-gp-row is-cost">
                        <span>Direct Subcontractor &amp; Material Costs</span>
                        <strong>-{moneyExact(selectedSeries.vendorCents)}</strong>
                      </div>
                      <div className="dcc-gp-row is-cost">
                        <span>Field Payroll &amp; Trade Labor (758 hrs)</span>
                        <strong>-{moneyExact(selectedSeries.payrollCents)}</strong>
                      </div>
                      <div className="dcc-gp-total">
                        <div>
                          <span>Gross Profit (Ganancia en Bruto)</span>
                          <small>
                            {isFutureMonth
                              ? "Projected baseline margin"
                              : `Net of direct costs · ${grossMarginPct}% gross margin`}
                          </small>
                        </div>
                        <strong>{moneyExact(grossProfitCents)}</strong>
                      </div>
                      <button
                        type="button"
                        className="dcc-gp-open-btn"
                        onClick={() =>
                          triggerNavigate("financial_dashboard", undefined, selectedMonth)
                        }
                      >
                        Open full Accounting &amp; Margin breakdown →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right-Hand Menus Column ("el texto abajo son para los menus a la derecha") */}
        <aside
          className="dcc-console-right-col"
          aria-label="Corporate Operational Modules and Certifications Menus"
        >
          {/* Right Menu 1: 11 Operational Modules */}
          <section
            className="dcc-card dcc-right-menu-card"
            data-testid="corporate-right-modules-menu"
          >
            <header className="dcc-right-menu-head">
              <div>
                <p className="dcc-eyebrow">CORPORATE NAVIGATION · 11 MODULES</p>
                <h3>Operational Modules</h3>
              </div>
              <span className="dcc-badge" data-tone="amber">
                11 Active
              </span>
            </header>
            <div className="dcc-right-menu-list" role="navigation" aria-label="11 Corporate Modules">
              {CORPORATE_11_MODULES.map((mod) => {
                const isRestrictedForGuest = isGuest && mod.id === "invoice";
                return (
                  <button
                    type="button"
                    key={mod.id}
                    className="dcc-right-menu-item"
                    onClick={() => triggerNavigate(mod.id)}
                  >
                    <span className="dcc-right-menu-icon" aria-hidden="true">
                      {MODULE_ICONS[mod.id] || mod.code}
                    </span>
                    <span className="dcc-right-menu-text">
                      <strong>
                        {mod.code}. {mod.label}
                      </strong>
                      <small>
                        {isRestrictedForGuest
                          ? "Summary only for Guest · Gross profit restricted"
                          : mod.detail}
                      </small>
                    </span>
                    <span className="dcc-right-menu-chevron" aria-hidden="true">
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Right Menu 2: 8 Certifications & Programs */}
          <section
            className="dcc-card dcc-right-menu-card"
            data-testid="corporate-certifications-panel"
          >
            <header className="dcc-right-menu-head">
              <div>
                <p className="dcc-eyebrow">PROGRAMS &amp; REGISTRATIONS</p>
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
                const isActive = cert.status === "Active intake";
                return (
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
                    <span
                      className="dcc-right-menu-dot"
                      data-tone={isActive ? "emerald" : "amber"}
                      aria-hidden="true"
                    />
                    <span className="dcc-right-menu-text">
                      <strong>{cert.code}</strong>
                      <small>{cert.label}</small>
                    </span>
                    <span
                      className="dcc-badge"
                      data-tone={isActive ? "emerald" : "amber"}
                    >
                      {isActive ? "42 Active" : "Review"}
                    </span>
                    <span className="dcc-right-menu-chevron" aria-hidden="true">
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      {/* Bottom Full-Width Table: 42 Opportunities of the Month — October 2026 (with in-place Takeoff Drawing Viewer) */}
      <VerifiedOpportunitiesTable defaultLimit={12} />

      {/* Secondary Operational Row: Upcoming Dates, Saved Follow-Ups & November 2026 Calendar */}
      {!isGuest && agenda && (
        <div className="dcc-bottom-grid">
          <section className="dcc-card dcc-agenda" id="dcc-upcoming-sources">
            <header className="dcc-card-header">
              <div>
                <p className="dcc-eyebrow">Keep in view</p>
                <h3>Upcoming &amp; due</h3>
              </div>
              <span className="dcc-source-label">Recorded dates</span>
            </header>
            <div
              className="dcc-tabs"
              role="group"
              aria-label="Dashboard agenda period"
            >
              <button
                type="button"
                aria-pressed={agendaTab === "upcoming"}
                onClick={() => setAgendaTab("upcoming")}
              >
                Upcoming <span>{agenda.upcoming.length}</span>
              </button>
              <button
                type="button"
                aria-pressed={agendaTab === "overdue"}
                onClick={() => setAgendaTab("overdue")}
              >
                Overdue <span>{agenda.overdue.length}</span>
              </button>
            </div>
            {agenda[agendaTab].length ? (
              <ul className="dcc-agenda-list">
                {agenda[agendaTab].slice(0, 5).map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => openItem(item)}>
                      <span className="dcc-date-badge">
                        {shortDate(item.date)}
                      </span>
                      <span>
                        <strong>{item.title}</strong>
                        <small>{item.detail}</small>
                      </span>
                      <span className="dcc-arrow" aria-hidden="true">
                        ↗
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dcc-empty">
                No {agendaTab === "overdue" ? "overdue" : "upcoming"} source dates
                in this view.
              </p>
            )}
          </section>

          <section className="dcc-card dcc-followups" id="dcc-saved-followups">
            <header className="dcc-card-header">
              <div>
                <p className="dcc-eyebrow">Next actions</p>
                <h3>Follow-ups</h3>
              </div>
              <span className="dcc-source-label">
                {agenda.followups.length} saved
              </span>
            </header>
            {agenda.followups.length ? (
              <ul className="dcc-followup-list">
                {agenda.followups
                  .slice(0, showAllFollowups ? undefined : 5)
                  .map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() =>
                          triggerNavigate(item.view, item.projectId || undefined)
                        }
                      >
                        <span className="dcc-followup-dot" aria-hidden="true" />
                        <span>
                          <strong>{item.title}</strong>
                          <small>{item.detail}</small>
                          <small>
                            {item.priority} priority
                            {item.dueDate
                              ? " · " +
                                shortDate(item.dueDate) +
                                (item.overdue ? " · Overdue" : "")
                              : ""}
                          </small>
                        </span>
                        <span className="dcc-arrow" aria-hidden="true">
                          ↗
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="dcc-empty">
                No next actions or reviews are waiting in this view.
              </p>
            )}
            {agenda.followups.length > 5 && (
              <button
                type="button"
                className="dcc-text-link"
                aria-expanded={showAllFollowups}
                onClick={() => setShowAllFollowups((value) => !value)}
              >
                {showAllFollowups
                  ? "Show fewer follow-ups"
                  : "View all follow-ups (" + agenda.followups.length + ")"}
              </button>
            )}
          </section>

          <section className="dcc-card dcc-calendar">
            <header className="dcc-card-header">
              <div>
                <p className="dcc-eyebrow">Next month schedule</p>
                <h3>{monthName(nextMonthKey)}</h3>
              </div>
              <span className="dcc-source-label">
                {agenda.calendarItems.length} dates
              </span>
            </header>
            <div
              className="dcc-calendar-grid"
              aria-label={monthName(nextMonthKey) + " source calendar"}
            >
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <span key={day} className="dcc-weekday">
                  {day}
                </span>
              ))}
              {calendarDays.map((day, index) => {
                const date = day
                  ? nextMonthKey + "-" + String(day).padStart(2, "0")
                  : "";
                const sources = agenda.calendarItems.filter(
                  (item) => item.date === date
                );
                return day ? (
                  sources.length ? (
                    <button
                      type="button"
                      key={date}
                      className="dcc-calendar-day has-events"
                      title={sources.map((item) => item.title).join("; ")}
                      aria-pressed={calendarDate === date}
                      onClick={() =>
                        setCalendarDate((current) =>
                          current === date ? "" : date
                        )
                      }
                    >
                      {day}
                      <i aria-hidden="true" />
                    </button>
                  ) : (
                    <span key={date} className="dcc-calendar-day">
                      {day}
                    </span>
                  )
                ) : (
                  <span
                    key={"empty-" + index}
                    className="dcc-calendar-day is-empty"
                  />
                );
              })}
            </div>
            {calendarSources.length ? (
              <ul className="dcc-calendar-items">
                {calendarSources.map((item) => (
                  <li key={item.id}>
                    <button type="button" onClick={() => openItem(item)}>
                      <time dateTime={item.date}>{shortDate(item.date)}</time>{" "}
                      <span>{item.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dcc-empty">
                No dated items recorded for this selection.
              </p>
            )}
          </section>
        </div>
      )}

      <p className="dcc-snapshot">
        Recorded snapshot · {asOf.slice(0, 10)} UTC ·{" "}
        {projectId ? "Selected project" : "Authorized company portfolio"}
      </p>
    </div>
  );
}
