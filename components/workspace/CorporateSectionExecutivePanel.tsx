"use client";

import { useState } from "react";
import {
  CORPORATE_11_MODULES,
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

const GUEST_NAV_MAP: Record<string, string> = {
  executive: "summary",
  project: "projects",
  invoice: "invoice",
  financial_dashboard: "financial_dashboard",
  team: "team",
  lead: "lead",
  hours: "hours",
  compliance: "compliance",
  document: "plans",
  corporate_meetings: "corporate_meetings",
  dossier: "dossier",
};

export default function CorporateSectionExecutivePanel({
  activeTab,
  isGuest = false,
  period,
  onNavigate,
}: {
  activeTab: string;
  isGuest?: boolean;
  period?: string;
  onNavigate: (view: string, projectId?: string) => void;
}) {
  const [activeViewerId, setActiveViewerId] = useState<string | null>(null);
  const canonical = CANONICAL_SECTION_MAP[activeTab] || activeTab;

  const activeModuleMeta =
    CORPORATE_11_MODULES.find((m) => m.id === canonical) ||
    CORPORATE_11_MODULES[0];

  const handleModuleSwitch = (moduleId: string) => {
    if (isGuest) {
      onNavigate(GUEST_NAV_MAP[moduleId] || moduleId);
    } else {
      onNavigate(moduleId);
    }
  };

  const activeDrawingOpp = activeViewerId
    ? VERIFIED_OCTOBER_2026_OPPORTUNITIES.find((o) => o.id === activeViewerId) ??
      null
    : null;

  return (
    <div
      className="dcc-section-executive-wrap"
      data-testid={`corporate-section-executive-${canonical}`}
    >
      {/* 11-Section Quick Navigation Strip inside the Corporate Console */}
      <nav
        aria-label="Monthly Corporate Evaluation Modules"
        data-testid="corporate-11-modules-bar"
        className="dcc-card dcc-section-nav-strip"
      >
        <div className="dcc-section-nav-pills">
          {CORPORATE_11_MODULES.map((mod) => {
            const isCurrent = canonical === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => handleModuleSwitch(mod.id)}
                aria-current={isCurrent ? "page" : undefined}
                className={`dcc-section-nav-pill ${
                  isCurrent ? "is-active" : ""
                }`}
              >
                <span className="dcc-section-nav-code">{mod.code}</span>
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

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
                    {activeDrawingOpp.location} · Contractor:{" "}
                    {activeDrawingOpp.contractor}
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
                  <th>Project</th>
                  <th>Location &amp; General Contractor</th>
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
                            <p className="dcc-row-title">{item.name}</p>
                            <p className="dcc-row-meta">{item.documentName}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="dcc-row-title">{item.location}</p>
                        <p className="dcc-row-meta">{item.contractor}</p>
                      </td>
                      <td>
                        <span className="dcc-opp-deadline">
                          {item.reportedDeadline || "Oct 2026 Active"}
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
                        <span className="dcc-badge" data-tone="emerald">
                          Active Portfolio
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

      {canonical === "invoice" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 03 · CLIENT &amp; SUPPLIER INVOICES · OCTOBER 2026
              </p>
              <h3>Billing — Progress Applications &amp; Trade Invoices</h3>
            </div>
            <span className="dcc-badge" data-tone="amber">
              October 2026 · $485,400.00 Billed
            </span>
          </header>

          <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">October 2026 Client Billing</span>
              <strong className="dcc-kpi-value">$485,400.00</strong>
              <span className="dcc-kpi-note">
                AIA G702/G703 progress applications
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">October 2026 Collections</span>
              <strong className="dcc-kpi-value">$388,320.00</strong>
              <span className="dcc-kpi-note">
                Recorded client receipts · Oct 2026
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Retainage &amp; Open AR</span>
              <strong className="dcc-kpi-value">$97,080.00</strong>
              <span className="dcc-kpi-note">
                Scheduled 30-day commercial settlement
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Gross Profit Margin</span>
              <strong className="dcc-kpi-value">
                {isGuest ? <span className="inline-flex items-center gap-1"><CorporateIcon name="lock" className="h-4 w-4 text-amber-300" /> Restricted</span> : "$117,250.00"}
              </strong>
              <span className="dcc-kpi-note">
                {isGuest
                  ? "Cannot be viewed as a guest user"
                  : "24.15% net of direct vendor & payroll costs"}
              </span>
            </div>
          </div>

          {isGuest && (
            <div
              className="dcc-guest-restriction-banner"
              style={{ marginTop: "1rem" }}
            >
              <div className="dcc-restriction-icon" aria-hidden="true">
                <CorporateIcon name="lock" className="h-5 w-5 text-amber-300" />
              </div>
              <div className="dcc-restriction-body">
                <h4>
                  Gross Profit &amp; Supplier Margin Details — Cannot be viewed
                  as a guest user (No se puede ver como usuario invitado)
                </h4>
                <p>
                  Detailed subcontractor cost margins and gross profit
                  breakdowns (<em>detalles de ganancia en bruto</em>) are
                  restricted to TAYCO Administrators.
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {canonical === "financial_dashboard" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 04 · MONTHLY FINANCIAL DETAIL · OCTOBER 2026
              </p>
              <h3>
                Accounting — Revenue, Direct Costs &amp; Gross Profit Details
              </h3>
            </div>
            <span
              className="dcc-badge"
              data-tone={isGuest ? "amber" : "emerald"}
            >
              {isGuest ? <span className="inline-flex items-center gap-1"><CorporateIcon name="lock" className="h-3 w-3 text-amber-300" /> Gross Profit Restricted for Guest</span> : "Administrator Full Financial View"}
            </span>
          </header>

          {isGuest ? (
            <div
              className="dcc-guest-restriction-banner"
              style={{ marginTop: "0.75rem" }}
              data-testid="accounting-guest-gp-lock"
            >
              <div className="dcc-restriction-icon" aria-hidden="true">
                <CorporateIcon name="lock" className="h-5 w-5 text-amber-300" />
              </div>
              <div className="dcc-restriction-body">
                <h4>
                  Gross Profit Details (Detalles de Ganancia en Bruto) — Cannot
                  be viewed as a guest user (No se puede ver como usuario
                  invitado)
                </h4>
                <p>
                  Subcontractor cost margins, net profitability, and past
                  months&apos; accounting ledgers cannot be viewed as a guest
                  user. Current month (<strong>October 2026</strong>) top-line
                  activity and project drawings remain enabled.
                </p>
              </div>
            </div>
          ) : (
            <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
              <div className="dcc-kpi">
                <span className="dcc-kpi-label">Gross Client Billing (Oct)</span>
                <strong className="dcc-kpi-value">$485,400.00</strong>
                <span className="dcc-kpi-note">
                  YTD 2026: $3,250,400.00 across 10 months
                </span>
              </div>
              <div className="dcc-kpi">
                <span className="dcc-kpi-label">
                  Direct Subcontractor &amp; Material Costs
                </span>
                <strong className="dcc-kpi-value">-$318,900.00</strong>
                <span className="dcc-kpi-note">
                  Committed trade partner &amp; material buyouts
                </span>
              </div>
              <div className="dcc-kpi">
                <span className="dcc-kpi-label">Field Payroll &amp; Labor</span>
                <strong className="dcc-kpi-value">-$49,250.00</strong>
                <span className="dcc-kpi-note">
                  758.0 verified field hours · WH-347 compliant
                </span>
              </div>
              <div className="dcc-kpi">
                <span className="dcc-kpi-label">
                  Gross Profit (Ganancia en Bruto)
                </span>
                <strong className="dcc-kpi-value">$117,250.00</strong>
                <span className="dcc-kpi-note">
                  24.15% Verified Gross Margin · Oct 2026
                </span>
              </div>
            </div>
          )}
        </section>
      )}

      {canonical === "team" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 05 · WORK TEAMS &amp; B2B ACCESS · OCTOBER 2026
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
                All 12 months · Gross profit · 42 plan sets
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Guest Reviewer Policy</span>
              <strong className="dcc-kpi-value">3-Hour Window</strong>
              <span className="dcc-kpi-note">
                Oct 2026 + Plans enabled · Past months &amp; GP locked
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
                Read-only Takeoff canvas · Download controls hidden
              </span>
            </div>
          </div>
        </section>
      )}

      {canonical === "lead" && (
        <div style={{ display: "grid", gap: "1rem" }}>
          <VerifiedOpportunitiesTable defaultLimit={42} />
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
              <span className="dcc-kpi-label">October Field Payroll</span>
              <strong className="dcc-kpi-value">
                {isGuest ? <span className="inline-flex items-center gap-1"><CorporateIcon name="lock" className="h-4 w-4 text-amber-300" /> Restricted</span> : "$49,250.00"}
              </strong>
              <span className="dcc-kpi-note">
                {isGuest
                  ? "Labor cost margins restricted for Guest"
                  : "Reconciled against October project ledgers"}
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
          <VerifiedOpportunitiesTable defaultLimit={15} />
        </div>
      )}

      {canonical === "corporate_meetings" && (
        <section className="dcc-card dcc-section-hero-card">
          <header className="dcc-card-header">
            <div>
              <p className="dcc-eyebrow">
                MODULE 10 · CORPORATE AGENDA &amp; FOLLOW-UPS · OCT / NOV 2026
              </p>
              <h3>Meetings — Monthly Notes &amp; Next Month Follow-Up</h3>
            </div>
            <span className="dcc-badge" data-tone="amber">
              November 2026 Follow-Ups Scheduled
            </span>
          </header>

          <div className="dcc-month-detail-grid" style={{ marginTop: "0.85rem" }}>
            <div className="dcc-detail-box">
              <div className="dcc-detail-box-head">
                <span className="dcc-detail-icon" aria-hidden="true">
                  <CorporateIcon name="lock" className="h-4 w-4 text-amber-300" />
                </span>
                <div>
                  <h4>Monthly Notes (internal use)</h4>
                  <small>October 2026 executive highlights</small>
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
                    <strong>SAM.gov approval</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Federal and state programs</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Union and private projects</strong>
                  </div>
                </li>
                <li>
                  <i aria-hidden="true">•</i>
                  <div>
                    <strong>Approved certifications</strong>
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
                  <h4>Next Month Follow-Up (November 2026)</h4>
                  <small>Priority corporate actions</small>
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
              October 2026 Active ·{" "}
              {isGuest ? "Past Months Restricted" : "All 12 Months Enabled"}
            </span>
          </header>

          <div className="dcc-kpis" style={{ marginTop: "0.75rem" }}>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Active Evaluation Period</span>
              <strong className="dcc-kpi-value">October 2026</strong>
              <span className="dcc-kpi-note">
                42 verified opportunities · 20 active projects
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Historical Months (Jan–Sep)</span>
              <strong className="dcc-kpi-value">
                {isGuest ? <span className="inline-flex items-center gap-1"><CorporateIcon name="lock" className="h-4 w-4 text-amber-300" /> Locked</span> : "9 Months"}
              </strong>
              <span className="dcc-kpi-note">
                {isGuest
                  ? "Cannot be viewed as a guest user"
                  : "$2,765,000.00 cumulative Jan–Sep billing"}
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Gross Profit Report</span>
              <strong className="dcc-kpi-value">
                {isGuest ? <span className="inline-flex items-center gap-1"><CorporateIcon name="lock" className="h-4 w-4 text-amber-300" /> Locked</span> : "$117,250.00"}
              </strong>
              <span className="dcc-kpi-note">
                {isGuest
                  ? "Cannot be viewed as a guest user"
                  : "October 2026 verified gross profit (24.15%)"}
              </span>
            </div>
            <div className="dcc-kpi">
              <span className="dcc-kpi-label">Module Coverage</span>
              <strong className="dcc-kpi-value">
                {activeModuleMeta.code} / 11
              </strong>
              <span className="dcc-kpi-note">
                Full corporate evaluation dossier synchronized
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
