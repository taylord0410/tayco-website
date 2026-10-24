"use client";
import { useState } from "react";
import type { Entry } from "@/lib/erp";
import { financialPeriods } from "@/lib/financial-periods";
import { dashboardAgenda, type DashboardAgendaItem } from "@/lib/dashboard-agenda";
import { CORPORATE_CERTIFICATIONS_STATUS } from "@/lib/verified-bidding-opportunities";
import { VerifiedOpportunitiesTable } from "./VerifiedOpportunitiesTable";

type Props = { entries: Entry[]; asOf: string; projectId: string; onNavigate: (view: string, projectId?: string, reportingMonth?: string) => void };
const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
const monthName = (month: string, short = false) => new Intl.DateTimeFormat("en-US", { month: short ? "short" : "long", ...(short ? {} : { year: "numeric" }), timeZone: "UTC" }).format(new Date(month + "-01T12:00:00Z"));
const shortDate = (date: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"));

export default function DashboardCommandCenter({ entries, asOf, projectId, onNavigate }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(asOf.slice(0, 7));
  const [agendaTab, setAgendaTab] = useState<"upcoming" | "overdue">("upcoming");
  const [calendarDate, setCalendarDate] = useState("");
  const [showAllFollowups, setShowAllFollowups] = useState(false);
  let agenda: ReturnType<typeof dashboardAgenda>, yearReport: ReturnType<typeof financialPeriods>, ytdReport: ReturnType<typeof financialPeriods>;
  try {
    agenda = dashboardAgenda(entries, { asOf, projectId: projectId || undefined });
    yearReport = financialPeriods(agenda.scopedEntries, { year: Number(selectedMonth.slice(0, 4)), month: null, asOf });
    ytdReport = financialPeriods(agenda.scopedEntries, { year: Number(asOf.slice(0, 4)), month: null, asOf });
  } catch {
    return <section className="dcc-dashboard dcc-card" data-testid="dashboard-command-center"><h3>Dashboard sources need review</h3><p>The recorded dates cannot be summarized reliably.</p><button type="button" onClick={() => onNavigate("financial_dashboard")}>Review financial sources</button></section>;
  }
  const ytdCents = ytdReport.months.filter(month => month.key <= asOf.slice(0, 7)).reduce((sum, month) => sum + month.byAudience.client.issuedCents, 0);
  const maxBar = Math.max(1, ...yearReport.months.flatMap(month => [month.byAudience.client.issuedCents, month.byAudience.client.paymentCents]));
  const visibleAgenda = agenda[agendaTab];
  const calendarYear = Number(agenda.nextMonth.slice(0, 4)), calendarMonth = Number(agenda.nextMonth.slice(5, 7));
  const firstDay = new Date(Date.UTC(calendarYear, calendarMonth - 1, 1)).getUTCDay(), daysInMonth = new Date(Date.UTC(calendarYear, calendarMonth, 0)).getUTCDate();
  const calendarDays = Array.from({ length: firstDay + daysInMonth }, (_, index) => index < firstDay ? null : index - firstDay + 1);
  const quickLinks = [{ label: "Projects", detail: "Schedules & project records", view: "project", icon: "01" }, { label: "Financials", detail: "Invoices & recorded payments", view: "financial_dashboard", icon: "02" }, { label: "Corporate meetings", detail: "Schedule & meeting notes", view: "corporate_meetings", icon: "03" }, { label: "Follow-ups", detail: "Plan next month’s priorities", view: "followups", icon: "04" }];
  const openMonth = (value: string) => { setSelectedMonth(value); onNavigate("financial_dashboard", undefined, value); };
  const openItem = (item: DashboardAgendaItem) => onNavigate(item.view, item.projectId || undefined);
  const calendarSources = calendarDate ? agenda.calendarItems.filter(item => item.date === calendarDate) : agenda.calendarItems.slice(0, 3);
  return <div className="dcc-dashboard" data-testid="dashboard-command-center">
    <div className="dcc-kpis">
      <button type="button" className="dcc-kpi" onClick={() => onNavigate("financial_dashboard", undefined, asOf.slice(0, 7))}><span className="dcc-kpi-label">Client invoices · year to date</span><strong className="dcc-kpi-value">{money(ytdCents)}</strong><span className="dcc-kpi-note">Issued records · {asOf.slice(0, 4)}</span></button>
      <button type="button" className="dcc-kpi" onClick={() => onNavigate("project")}><span className="dcc-kpi-label">Active projects</span><strong className="dcc-kpi-value">{agenda.activeProjects}</strong><span className="dcc-kpi-note">Current active state</span></button>
      <button type="button" className="dcc-kpi" onClick={() => { setAgendaTab("upcoming"); document.getElementById("dcc-upcoming-sources")?.scrollIntoView({ behavior: "auto", block: "nearest" }); }}><span className="dcc-kpi-label">Upcoming dates</span><strong className="dcc-kpi-value">{agenda.upcoming.length}</strong><span className="dcc-kpi-note">Milestones & source deadlines</span></button>
      <button type="button" className="dcc-kpi" onClick={() => document.getElementById("dcc-saved-followups")?.scrollIntoView({ behavior: "auto", block: "nearest" })}><span className="dcc-kpi-label">Follow-ups waiting</span><strong className="dcc-kpi-value">{agenda.followups.length}</strong><span className="dcc-kpi-note">Saved actions & pending reviews</span></button>
    </div>
    <div className="dcc-main-grid">
      <section className="dcc-card dcc-monthly">
        <header className="dcc-card-header"><div><p className="dcc-eyebrow">Financial overview</p><h3>Monthly activity</h3></div><span className="dcc-source-label">{selectedMonth.slice(0, 4)} · Client records</span></header>
        <div className="dcc-chart-legend"><span><i className="dcc-issued-key" />Invoice issuance</span><span><i className="dcc-payment-key" />Dated payments</span></div>
        <div className="dcc-chart" aria-label="Monthly client invoice and payment records">{yearReport.months.map(month => <button type="button" className="dcc-chart-month" key={month.key} aria-pressed={selectedMonth === month.key} aria-label={monthName(month.key) + ": invoices " + money(month.byAudience.client.issuedCents) + "; dated payments " + money(month.byAudience.client.paymentCents) + ". Open monthly detail."} onClick={() => openMonth(month.key)}><span className="dcc-bar-pair" aria-hidden="true"><i className="dcc-issued-bar" style={{ height: month.byAudience.client.issuedCents / maxBar * 100 + "%" }} /><i className="dcc-payment-bar" style={{ height: month.byAudience.client.paymentCents / maxBar * 100 + "%" }} /></span><span className="dcc-month-label">{monthName(month.key, true)}</span></button>)}</div>
        <footer className="dcc-card-footer"><p>Invoice issuance and dated payments remain separate.</p><button type="button" className="dcc-text-link" onClick={() => onNavigate("financial_dashboard", undefined, selectedMonth)}>Open {monthName(selectedMonth)} detail ↗</button></footer>
      </section>
      <section className="dcc-card dcc-agenda" id="dcc-upcoming-sources">
        <header className="dcc-card-header"><div><p className="dcc-eyebrow">Keep in view</p><h3>Upcoming & due</h3></div><span className="dcc-source-label">Recorded dates</span></header>
        <div className="dcc-tabs" role="group" aria-label="Dashboard agenda period"><button type="button" aria-pressed={agendaTab === "upcoming"} onClick={() => setAgendaTab("upcoming")}>Upcoming <span>{agenda.upcoming.length}</span></button><button type="button" aria-pressed={agendaTab === "overdue"} onClick={() => setAgendaTab("overdue")}>Overdue <span>{agenda.overdue.length}</span></button></div>
        {visibleAgenda.length ? <ul className="dcc-agenda-list">{visibleAgenda.slice(0, 5).map(item => <li key={item.id}><button type="button" onClick={() => openItem(item)}><span className="dcc-date-badge">{shortDate(item.date)}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><span className="dcc-arrow" aria-hidden="true">↗</span></button></li>)}</ul> : <p className="dcc-empty">No {agendaTab === "overdue" ? "overdue" : "upcoming"} source dates in this view.</p>}
        {visibleAgenda.length > 5 && <p className="dcc-note">Showing the next 5 of {visibleAgenda.length} dated items.</p>}
      </section>
    </div>
    <div className="dcc-bottom-grid">
      <section className="dcc-card dcc-quick-access"><header className="dcc-card-header"><div><p className="dcc-eyebrow">Workspace</p><h3>Quick access</h3></div></header><div className="dcc-quick-links">{quickLinks.map(link => <button type="button" key={link.view} onClick={() => onNavigate(link.view, undefined, link.view === "followups" ? agenda.nextMonth : undefined)}><span className="dcc-quick-icon" aria-hidden="true">{link.icon}</span><span><strong>{link.label}</strong><small>{link.detail}</small></span><span className="dcc-arrow" aria-hidden="true">↗</span></button>)}</div></section>
      <section className="dcc-card dcc-followups" id="dcc-saved-followups"><header className="dcc-card-header"><div><p className="dcc-eyebrow">Next actions</p><h3>Follow-ups</h3></div><span className="dcc-source-label">{agenda.followups.length} saved</span></header>{agenda.followups.length ? <ul className="dcc-followup-list">{agenda.followups.slice(0, showAllFollowups ? undefined : 5).map(item => <li key={item.id}><button type="button" onClick={() => onNavigate(item.view, item.projectId || undefined)}><span className="dcc-followup-dot" aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.detail}</small><small>{item.priority} priority{item.dueDate ? " · " + shortDate(item.dueDate) + (item.overdue ? " · Overdue" : "") : ""}</small></span><span className="dcc-arrow" aria-hidden="true">↗</span></button></li>)}</ul> : <p className="dcc-empty">No next actions or reviews are waiting in this view.</p>}{agenda.followups.length > 5 && <button type="button" className="dcc-text-link" aria-expanded={showAllFollowups} onClick={() => setShowAllFollowups(value => !value)}>{showAllFollowups ? "Show fewer follow-ups" : "View all follow-ups (" + agenda.followups.length + ")"}</button>}<p className="dcc-note">{agenda.followups.length > 5 && !showAllFollowups ? "Showing 5 of " + agenda.followups.length + ". " : ""}Open a source record to review or update its action.</p></section>
      <section className="dcc-card dcc-calendar"><header className="dcc-card-header"><div><p className="dcc-eyebrow">Next month</p><h3>{monthName(agenda.nextMonth)}</h3></div><span className="dcc-source-label">{agenda.calendarItems.length} dates</span></header><div className="dcc-calendar-grid" aria-label={monthName(agenda.nextMonth) + " source calendar"}>{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => <span key={day} className="dcc-weekday">{day}</span>)}{calendarDays.map((day, index) => { const date = day ? agenda.nextMonth + "-" + String(day).padStart(2, "0") : ""; const sources = agenda.calendarItems.filter(item => item.date === date); return day ? sources.length ? <button type="button" key={date} className="dcc-calendar-day has-events" title={sources.map(item => item.title).join("; ")} aria-pressed={calendarDate === date} aria-label={shortDate(date) + ": " + sources.length + " dated source" + (sources.length === 1 ? "" : "s") + ". Show all sources for this day."} onClick={() => setCalendarDate(current => current === date ? "" : date)}>{day}<i aria-hidden="true" /></button> : <span key={date} className="dcc-calendar-day">{day}</span> : <span key={"empty-" + index} className="dcc-calendar-day is-empty" />; })}</div>{calendarDate && <p className="dcc-note">Sources for {shortDate(calendarDate)} · select the date again to return to the month.</p>}{calendarSources.length ? <ul className="dcc-calendar-items">{calendarSources.map(item => <li key={item.id}><button type="button" onClick={() => openItem(item)}><time dateTime={item.date}>{shortDate(item.date)}</time><span>{item.title}</span></button></li>)}</ul> : <p className="dcc-empty">{calendarDate ? "No dated items remain for this selected day." : "No dated items recorded for next month."}</p>}</section>
    </div>
    <section className="dcc-card dcc-certifications-card" data-testid="corporate-certifications-panel">
      <header className="dcc-card-header">
        <div>
          <p className="dcc-eyebrow">Corporate standing · Pending company verification</p>
          <h3>Certifications &amp; Programs</h3>
        </div>
        <button type="button" onClick={() => onNavigate("compliance")}>Review compliance &amp; certifications ↗</button>
      </header>
      <div className="dcc-certifications-grid">
        {CORPORATE_CERTIFICATIONS_STATUS.map((cert) => {
          const isActive = cert.status === "Active intake";
          return (
            <div key={cert.id} className="dcc-cert-item" data-tone={isActive ? "emerald" : "amber"}>
              <div className="dcc-cert-top">
                <strong>{cert.code} · {cert.label}</strong>
                <span className="dcc-badge" data-tone={isActive ? "emerald" : "amber"}>
                  {cert.status}
                </span>
              </div>
              <p className="dcc-cert-category">{cert.category}</p>
              <p className="dcc-cert-status">{cert.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
    <VerifiedOpportunitiesTable defaultLimit={10} />
    <p className="dcc-snapshot">Recorded snapshot · {asOf.slice(0, 10)} UTC · {projectId ? "Selected project" : "Authorized company portfolio"}</p>
  </div>;
}
