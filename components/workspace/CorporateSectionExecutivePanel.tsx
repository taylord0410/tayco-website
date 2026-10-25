"use client";

import { useState } from "react";
import {
  CORPORATE_CERTIFICATIONS_STATUS,
  VERIFIED_OCTOBER_2026_OPPORTUNITIES,
} from "@/lib/verified-bidding-opportunities";
import { VerifiedOpportunitiesTable } from "./VerifiedOpportunitiesTable";
import TakeoffProjectReader from "./TakeoffProjectReader";
import CorporateIcon from "./CorporateIcons";

export type CorporateSectionKey =
  | "executive"
  | "summary"
  | "project"
  | "projects"
  | "invoice"
  | "billing"
  | "financial_dashboard"
  | "finance"
  | "team"
  | "administration"
  | "lead"
  | "opportunities"
  | "hours"
  | "payroll"
  | "compliance"
  | "document"
  | "documents"
  | "plans"
  | "corporate_meetings"
  | "meetings"
  | "followups"
  | "dossier"
  | "reports";

const CANONICAL_SECTION_MAP: Record<string, string> = {
  executive: "executive",
  summary: "executive",
  project: "project",
  projects: "project",
  invoice: "invoice",
  billing: "invoice",
  financial_dashboard: "financial_dashboard",
  finance: "financial_dashboard",
  team: "team",
  administration: "team",
  lead: "lead",
  opportunities: "lead",
  hours: "hours",
  payroll: "hours",
  compliance: "compliance",
  document: "document",
  documents: "document",
  plans: "document",
  corporate_meetings: "corporate_meetings",
  meetings: "corporate_meetings",
  followups: "corporate_meetings",
  dossier: "dossier",
  reports: "dossier",
};

export const CORPORATE_2026_MONTHLY_INCOME = [
  { month: "January 2026", quarter: "Q1 2026", tprjRange: "TPRJ-2601-001 – TPRJ-2601-007 (7)", states: "5 WI · 1 IL · 1 IN", income: "$425,000", amount: 425000, status: "Reconciled" },
  { month: "February 2026", quarter: "Q1 2026", tprjRange: "TPRJ-2602-008 – TPRJ-2602-015 (8)", states: "5 WI · 2 IL · 1 IA", income: "$657,680", amount: 657680, status: "Reconciled" },
  { month: "March 2026", quarter: "Q1 2026", tprjRange: "TPRJ-2603-016 – TPRJ-2603-023 (8)", states: "5 WI · 2 IL · 1 IN", income: "$719,789", amount: 719789, status: "Reconciled" },
  { month: "April 2026", quarter: "Q2 2026", tprjRange: "TPRJ-2604-024 – TPRJ-2604-031 (8)", states: "5 WI · 2 IL · 1 MO", income: "$700,789", amount: 700789, status: "Reconciled" },
  { month: "May 2026", quarter: "Q2 2026", tprjRange: "TPRJ-2605-032 – TPRJ-2605-040 (9)", states: "6 WI · 2 IL · 1 IN", income: "$825,679", amount: 825679, status: "Reconciled" },
  { month: "June 2026", quarter: "Q2 2026", tprjRange: "TPRJ-2606-041 – TPRJ-2606-049 (9)", states: "6 WI · 2 IL · 1 IA", income: "$921,578", amount: 921578, status: "Reconciled" },
  { month: "July 2026", quarter: "Q3 2026", tprjRange: "TPRJ-2607-050 – TPRJ-2607-058 (9)", states: "5 WI · 3 IL · 1 MO", income: "$908,792", amount: 908792, status: "Reconciled" },
  { month: "August 2026", quarter: "Q3 2026", tprjRange: "TPRJ-2608-059 – TPRJ-2608-067 (9)", states: "6 WI · 2 IL · 1 IN", income: "$940,789", amount: 940789, status: "Reconciled" },
  { month: "September 2026", quarter: "Q3 2026", tprjRange: "TPRJ-2609-068 – TPRJ-2609-076 (9)", states: "6 WI · 2 IL · 1 IA", income: "$938,489", amount: 938489, status: "Reconciled" },
  { month: "October 2026", quarter: "Q4 2026", tprjRange: "TPRJ-2610-077 – TPRJ-2610-080 (4)", states: "3 WI · 1 IL", income: "$21,789", amount: 21789, status: "In Progress" },
] as const;

export const CORPORATE_2026_TOTAL_YTD_INCOME = "$7,060,374";

export default function CorporateSectionExecutivePanel({
  activeTab,
  isGuest = false,
}: {
  activeTab: string;
  isGuest?: boolean;
  period?: string;
  onNavigate?: (view: string, projectId?: string) => void;
}) {
  const [activeViewerId, setActiveViewerId] = useState<string | null>(null);
  const canonical = CANONICAL_SECTION_MAP[activeTab] || activeTab;

  const activeDrawingOpp = activeViewerId
    ? VERIFIED_OCTOBER_2026_OPPORTUNITIES.find((o) => o.id === activeViewerId) ??
      null
    : null;

  return (
    <div
      className="dcc-section-executive-wrap"
      data-testid={`corporate-section-executive-${canonical}`}
    >
      {/* Section-Specific Executive Content */}
      {canonical === "project" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 02 · ACTIVE PORTFOLIO &amp; SCHEDULES · OCTOBER 2026
              </p>
              <h3>Projects — Commercial, Institutional &amp; Civil Portfolio</h3>
            </div>
            <span className="dcc-badge" data-tone="emerald">
              20 Portfolio Projects · 41 Plan Sets
            </span>
          </header>

          <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Active Portfolio</span>
              <strong className="dcc-kpi-value">20 Projects</strong>
              <span className="dcc-kpi-note">
                15 active execution · 5 pre-construction
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Bidding Intake (Oct 2026)</span>
              <strong className="dcc-kpi-value">42 Packages</strong>
              <span className="dcc-kpi-note">
                IL, IN, IA, WI &amp; MO regional coverage
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Architectural Drawings</span>
              <strong className="dcc-kpi-value">41 Plan Sets</strong>
              <span className="dcc-kpi-note">
                Connected to interactive Takeoff Reader
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">On-Schedule Delivery</span>
              <strong className="dcc-kpi-value">94.8%</strong>
              <span className="dcc-kpi-note">
                October 2026 field milestone compliance
              </span>
            </div>
          </div>

          {activeDrawingOpp && activeDrawingOpp.viewerHref && (
            <div className="dcc-opportunities-viewer-drawer">
              <div className="dcc-opportunities-viewer-bar">
                <div>
                  <span className="dcc-badge" data-tone="amber">
                    Project Plan Set · #{activeDrawingOpp.number}
                  </span>
                  <h4 className="dcc-row-title" style={{ marginTop: "0.35rem" }}>
                    {activeDrawingOpp.name}
                  </h4>
                  <p className="dcc-row-meta">
                    General Contractor: {activeDrawingOpp.contractor}
                  </p>
                </div>
                <button
                  type="button"
                  className="dcc-action-btn"
                  onClick={() => setActiveViewerId(null)}
                >
                  Close plans ✕
                </button>
              </div>
              <TakeoffProjectReader
                source={activeDrawingOpp.viewerHref}
                projectName={activeDrawingOpp.name}
                privacyNotice={false}
              />
            </div>
          )}

          <div className="dcc-opportunities-table-wrap" style={{ marginTop: "1rem" }}>
            <table className="dcc-opportunities-table">
              <thead>
                <tr>
                  <th>General Contractor</th>
                  <th>Project</th>
                  <th>Schedule Deadline</th>
                  <th>Plans</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {VERIFIED_OCTOBER_2026_OPPORTUNITIES.slice(0, 8).map((item) => {
                  const isOpen = activeViewerId === item.id;
                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="dcc-opp-project-cell">
                          <span className="dcc-opp-id">#{item.number}</span>
                          <div>
                            <p className="dcc-row-title">{item.contractor}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="dcc-row-title">{item.name}</p>
                      </td>
                      <td>
                        <span className="dcc-opp-deadline">
                          {item.reportedDeadline || "Oct 2026"}
                        </span>
                      </td>
                      <td>
                        {item.viewerHref ? (
                          <button
                            type="button"
                            className={`dcc-opp-drawing-btn ${
                              isOpen ? "is-open" : ""
                            }`}
                            onClick={() =>
                              setActiveViewerId(isOpen ? null : item.id)
                            }
                          >
                            <CorporateIcon name="document" className="h-3.5 w-3.5 inline mr-1" /> {isOpen ? "Hide plans" : "View plans"}
                          </button>
                        ) : (
                          <span className="dcc-opp-no-drawing">Pending</span>
                        )}
                      </td>
                      <td>
                        {isGuest ? (
                          <span
                            className="dcc-badge"
                            data-tone={
                              item.status === "Pending company information"
                                ? "amber"
                                : "rose"
                            }
                          >
                            {item.status === "Pending company information"
                              ? "Pending"
                              : "Cancelled"}
                          </span>
                        ) : (
                          <span className="dcc-badge" data-tone="emerald">
                            Active Portfolio
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canonical === "invoice" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 03 · CORPORATE MONTHLY INCOME &amp; BILLING · OCTOBER 2026
              </p>
              <h3>Billing — Verified Monthly Income &amp; Applications</h3>
            </div>
            <span className="dcc-badge" data-tone="emerald">
              October 2026 · $21,789 Current Income
            </span>
          </header>

          <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">October 2026 Income</span>
              <strong className="dcc-kpi-value">$21,789</strong>
              <span className="dcc-kpi-note">
                Current month in progress
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">September 2026 Income</span>
              <strong className="dcc-kpi-value">$938,489</strong>
              <span className="dcc-kpi-note">
                Completed monthly period
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">August 2026 Income</span>
              <strong className="dcc-kpi-value">$940,789</strong>
              <span className="dcc-kpi-note">
                Peak 2026 monthly income
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">YTD 2026 Total Income</span>
              <strong className="dcc-kpi-value">$7,060,374</strong>
              <span className="dcc-kpi-note">
                Cumulative Jan–Oct 2026 income
              </span>
            </div>
          </div>
        </section>
      )}

      {canonical === "financial_dashboard" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 04 · MONTHLY FINANCIAL DETAIL · 2026 RECONCILED
              </p>
              <h3>
                Accounting — 2026 Corporate Monthly Income
              </h3>
            </div>
            <span className="dcc-badge" data-tone="emerald">
              YTD 2026 Income · $7,060,374
            </span>
          </header>

          <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">October 2026</span>
              <strong className="dcc-kpi-value">$21,789</strong>
              <span className="dcc-kpi-note">
                Current month in progress
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Q3 2026 (Jul–Sep)</span>
              <strong className="dcc-kpi-value">$2,788,070</strong>
              <span className="dcc-kpi-note">
                Q3 completed corporate income
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Q2 2026 (Apr–Jun)</span>
              <strong className="dcc-kpi-value">$2,448,046</strong>
              <span className="dcc-kpi-note">
                Q2 completed corporate income
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">YTD 2026 (Jan–Oct)</span>
              <strong className="dcc-kpi-value">$7,060,374</strong>
              <span className="dcc-kpi-note">
                10-month verified income
              </span>
            </div>
          </div>

          <div className="dcc-opportunities-table-wrap" style={{ marginTop: "1rem" }}>
            <table className="dcc-opportunities-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Quarter</th>
                  <th>TPRJ Micro-Projects Series</th>
                  <th>Jurisdictions (WI Majority)</th>
                  <th>Corporate Monthly Income</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {CORPORATE_2026_MONTHLY_INCOME.map((item) => (
                  <tr key={item.month}>
                    <td>
                      <strong className="dcc-row-title">{item.month}</strong>
                    </td>
                    <td>
                      <span className="dcc-row-meta">{item.quarter}</span>
                    </td>
                    <td>
                      <span
                        className="dcc-row-meta"
                        style={{ fontFamily: "var(--font-mono, monospace)", color: "#f3d37a" }}
                      >
                        {item.tprjRange}
                      </span>
                    </td>
                    <td>
                      <span className="dcc-row-meta">{item.states}</span>
                    </td>
                    <td>
                      <strong
                        className="dcc-row-title"
                        style={{ fontFamily: "var(--font-mono, monospace)" }}
                      >
                        {item.income}
                      </strong>
                    </td>
                    <td>
                      <span
                        className="dcc-badge"
                        data-tone={item.status === "In Progress" ? "amber" : "emerald"}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canonical === "team" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 05 · WORK TEAMS &amp; ACCESS · OCTOBER 2026
              </p>
              <h3>
                Administration — Corporate Governance, Project Teams &amp; Access
              </h3>
            </div>
            <span className="dcc-badge" data-tone="emerald">
              Internal System · Role-Based Access Active
            </span>
          </header>

          <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Administrator Accounts</span>
              <strong className="dcc-kpi-value">Full Command</strong>
              <span className="dcc-kpi-note">
                All 12 months · Governance &amp; project teams
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Corporate Governance</span>
              <strong className="dcc-kpi-value">Internal System</strong>
              <span className="dcc-kpi-note">
                Authorized personnel &amp; project leads
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Project Field Teams</span>
              <strong className="dcc-kpi-value">20 Assignments</strong>
              <span className="dcc-kpi-note">
                Superintendents, estimators &amp; compliance leads
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Document Protection</span>
              <strong className="dcc-kpi-value">Watermarked</strong>
              <span className="dcc-kpi-note">
                Read-only Takeoff canvas · Protected plan sets
              </span>
            </div>
          </div>
        </section>
      )}

      {canonical === "lead" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <VerifiedOpportunitiesTable defaultLimit={42} isGuest={isGuest} />
        </div>
      )}

      {canonical === "hours" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 07 · FIELD HOURS &amp; WH-347 LOGS · OCTOBER 2026
              </p>
              <h3>Payroll — Field Labor, Trades &amp; Prevailing Wage Logs</h3>
            </div>
            <span className="dcc-badge" data-tone="emerald">
              758.0 Verified Hours · Oct 2026
            </span>
          </header>

          <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">October 2026 Field Hours</span>
              <strong className="dcc-kpi-value">758.0 hrs</strong>
              <span className="dcc-kpi-note">
                Approved by site superintendents
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Prevailing Wage / WH-347</span>
              <strong className="dcc-kpi-value">100% Current</strong>
              <span className="dcc-kpi-note">
                Davis-Bacon &amp; state prevailing wage certified
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Active Field Trades</span>
              <strong className="dcc-kpi-value">8 Divisions</strong>
              <span className="dcc-kpi-note">
                Civil, concrete, framing, MEP &amp; interior finishes
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Certified Payroll Logs</span>
              <strong className="dcc-kpi-value">12 Active</strong>
              <span className="dcc-kpi-note">
                Reconciled against October field schedules
              </span>
            </div>
          </div>
        </section>
      )}

      {canonical === "compliance" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 08 · CERTIFICATIONS &amp; PROGRAMS · OCTOBER 2026
              </p>
              <h3>
                Compliance — SAM.gov, SBE, WBE, MBE, ESBE &amp; Contracting
                Programs
              </h3>
            </div>
            <span className="dcc-badge" data-tone="amber">
              8 Corporate Programs Tracked
            </span>
          </header>

          <div
            className="dcc-opportunities-table-wrap"
            style={{ marginTop: "0.9rem" }}
          >
            <table className="dcc-opportunities-table">
              <thead>
                <tr>
                  <th>Program / Certification</th>
                  <th>Classification</th>
                  <th>Operational Note (October 2026)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {CORPORATE_CERTIFICATIONS_STATUS.map((cert) => {
                  const isActive = cert.status === "Active intake";
                  return (
                    <tr key={cert.id}>
                      <td>
                        <strong className="dcc-row-title">{cert.code}</strong>
                      </td>
                      <td>
                        <span className="dcc-row-meta">{cert.label}</span>
                      </td>
                      <td>
                        <span className="dcc-row-meta">{cert.detail}</span>
                      </td>
                      <td>
                        <span
                          className="dcc-badge"
                          data-tone={isActive ? "emerald" : "amber"}
                        >
                          {cert.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {canonical === "document" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <section className="dcc-card dcc-section-hero-card">
            <header className="dcc-card-header">
              <div>
                <p className="dcc-eyebrow">
                  MODULE 09 · PROTECTED PLANS, W-9 &amp; COI FILES · OCTOBER 2026
                </p>
                <h3>
                  Documents — 41 Takeoff Plan Sets &amp; 60 Controlled Records
                </h3>
              </div>
              <span className="dcc-badge" data-tone="emerald">
                Takeoff Reader Connected · Read-Only
              </span>
            </header>
          </section>
          <VerifiedOpportunitiesTable defaultLimit={15} isGuest={isGuest} />
        </div>
      )}

      {canonical === "corporate_meetings" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 10 · CORPORATE AGENDA &amp; FOLLOW-UPS · OCT / NOV 2026
              </p>
              <h3>Meetings — Corporate Review Schedule &amp; Bidding Calendar</h3>
            </div>
            <span className="dcc-badge" data-tone="emerald">
              October &amp; November 2026 Scheduled
            </span>
          </header>

          <div className="dcc-month-detail-grid" style={{ marginTop: "0.85rem" }}>
            <div className="dcc-detail-box">
              <div className="dcc-detail-box-head">
                <span className="dcc-detail-icon" aria-hidden="true">
                  <CorporateIcon name="calendar" className="h-4 w-4 text-emerald-400" />
                </span>
                <div>
                  <h4>October 2026 Bid Package Reviews</h4>
                  <small>Active opportunity intake &amp; subcontractor reviews</small>
                </div>
              </div>
              <ul className="dcc-check-list">
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>New opportunities (42 active packages)</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>SAM.gov approval &amp; registration</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Federal and state contracting programs</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Union and private enterprise projects</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Approved certifications &amp; diversity compliance</strong>
                  </div>
                </li>
              </ul>
            </div>

            <div className="dcc-detail-box">
              <div className="dcc-detail-box-head">
                <span className="dcc-detail-icon" aria-hidden="true">
                  <CorporateIcon name="calendar" className="h-4 w-4 text-amber-300" />
                </span>
                <div>
                  <h4>Upcoming Subcontractor Coordination</h4>
                  <small>November 2026 priority corporate actions</small>
                </div>
              </div>
              <ul className="dcc-check-list is-followup">
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Corporate meeting – opportunity review</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Follow up on pending proposals</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Review certification status</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Prepare documentation for new projects</strong>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      {canonical === "dossier" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 11 · 7-SECTION EXECUTIVE DOSSIER · OCTOBER 2026
              </p>
              <h3>
                Corporate Reports — Monthly Corporate Evaluation &amp; Executive
                Dossier
              </h3>
            </div>
            <span className="dcc-badge" data-tone="emerald">
              October 2026 Active · 10 Months Verified
            </span>
          </header>

          <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Active Evaluation Period</span>
              <strong className="dcc-kpi-value">October 2026</strong>
              <span className="dcc-kpi-note">
                $21,789 current month income
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Historical Months (Jan–Sep)</span>
              <strong className="dcc-kpi-value">9 Months</strong>
              <span className="dcc-kpi-note">
                $7,038,595 cumulative Jan–Sep income
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">YTD 2026 Corporate Income</span>
              <strong className="dcc-kpi-value">$7,060,374</strong>
              <span className="dcc-kpi-note">
                Jan–Oct 2026 verified income
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Verified Plan Sets</span>
              <strong className="dcc-kpi-value">41 Drawings</strong>
              <span className="dcc-kpi-note">
                Connected to interactive Takeoff Reader
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
