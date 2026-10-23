"use client";
import { useState, type ReactNode } from "react";
import type { Data, Entry } from "@/lib/erp";
import type { WorkspaceField, WorkspaceForm } from "./ProjectOverview";

type Props = { entries: Entry[]; assignees: { id: string; email: string; role: string }[]; month?: string; asOf: string; view: "meetings" | "followups"; renderForm: (form: WorkspaceForm) => ReactNode };
const value = (data: Data, key: string) => typeof data[key] === "string" ? data[key] as string : "";
const readable = (text: string) => text.slice(0, 1).toUpperCase() + text.slice(1).replaceAll("_", " ");
const options = (values: string[]) => values.map(item => ({ value: item, label: readable(item) }));
const priorities = ["low", "normal", "high", "urgent"];
const control = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-amber-200/25 bg-[#09182f] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-200";

export default function CorporateAgenda({ entries, assignees, month, asOf, view, renderForm }: Props) {
  const meeting = view === "meetings", kind = meeting ? "corporate_meeting" : "followup", noun = meeting ? "meeting" : "follow-up";
  const states = meeting ? ["scheduled", "completed", "cancelled"] : ["open", "in_progress", "completed", "cancelled"];
  const dateKey = meeting ? "date" : "dueDate", today = /^\d{4}-\d{2}-\d{2}T/.test(asOf) ? asOf.slice(0, 10) : "";
  const validMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : "";
  const [dateScope, setDateScope] = useState(validMonth ? "month" : "all"), [selectedMonth, setMonth] = useState(validMonth || today.slice(0, 7));
  const [priority, setPriority] = useState("all"), [status, setStatus] = useState("all"), [owner, setOwner] = useState("all");
  const rows = entries.filter(entry => entry.kind === kind), active = (entry: Entry) => !["completed", "cancelled"].includes(value(entry.data, "status"));
  const matches = rows.filter(entry => {
    const date = value(entry.data, dateKey);
    return (priority === "all" || entry.data.priority === priority) && (status === "all" || entry.data.status === status) && (owner === "all" || entry.data.assigneeId === owner) &&
      (dateScope === "all" || dateScope === "month" && date.slice(0, 7) === selectedMonth || dateScope === "upcoming" && active(entry) && Boolean(today) && date >= today || dateScope === "overdue" && active(entry) && Boolean(today) && Boolean(date) && date < today);
  }).sort((a, b) => value(a.data, dateKey).localeCompare(value(b.data, dateKey)) || priorities.indexOf(value(b.data, "priority")) - priorities.indexOf(value(a.data, "priority")) || a.id.localeCompare(b.id));
  const internalAssignees = assignees.filter(member => ["admin", "staff"].includes(member.role));
  const memberOptions = internalAssignees.map(member => ({ value: member.id, label: member.email }));
  const names = new Map(internalAssignees.map(member => [member.id, member.email]));
  const projectNames = new Map(entries.filter(entry => entry.kind === "project").map(entry => [entry.id, value(entry.data, "name")]));
  function fields(data: Data = {}): WorkspaceField[] {
    const responsible = value(data, "assigneeId"), known = memberOptions.some(option => option.value === responsible);
    return [
      { name: "title", label: meeting ? "Meeting title" : "Follow-up title", value: value(data, "title") },
      { name: dateKey, label: meeting ? "Meeting date" : "Follow-up due date", type: "date", value: value(data, dateKey) },
      ...(meeting ? [{ name: "time", label: "Meeting time (HH:MM, as recorded)", required: false, value: value(data, "time"), placeholder: "Optional, for example 14:30" }, { name: "location", label: "Meeting location", required: false, value: value(data, "location") }] : []),
      { name: "assigneeId", label: "Responsible team member", type: "select", value: known ? responsible : "", options: memberOptions },
      { name: "priority", label: "Priority", type: "select", value: value(data, "priority") || "normal", options: options(priorities) },
      { name: "notes", label: meeting ? "Meeting notes" : "Follow-up notes", type: "textarea", required: false, value: value(data, "notes") },
    ];
  }
  return <section className="min-w-0 space-y-5 text-slate-100" data-testid={meeting ? "corporate-meetings" : "corporate-followups"}>
    <header><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-amber-200">Internal coordination</p><h3 className="mt-2 text-2xl font-black text-white">{meeting ? "Corporate meeting agenda" : "Priority follow-ups"}</h3><p className="mt-2 text-sm leading-relaxed text-slate-300">Company-wide records for your TAYCO team. Each {noun} has an accountable person and an explicit state.</p>{meeting && <p className="mt-2 text-xs leading-relaxed text-slate-400">Meeting times are local times as entered; a timezone is not inferred. Record the location or timezone context in your notes when needed.</p>}<p className="mt-2 text-xs text-slate-400">Snapshot date {today || "unavailable"} · Saving a record does not send invitations or calendar messages.</p></header>
    <div className="grid min-w-0 gap-3 sm:grid-cols-3" aria-label="Agenda source counts">{[["Active records", rows.filter(active).length], [meeting ? "Past scheduled dates" : "Overdue follow-ups", rows.filter(entry => active(entry) && today && value(entry.data, dateKey) && value(entry.data, dateKey) < today).length], ["High or urgent priority", rows.filter(entry => active(entry) && ["high", "urgent"].includes(value(entry.data, "priority"))).length]].map(([label, count]) => <div key={String(label)} className="rounded-xl border border-amber-200/20 bg-[#10243f] p-4"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 font-mono text-2xl font-black text-amber-100">{count}</p></div>)}</div>
    {internalAssignees.length ? renderForm({ title: meeting ? "Schedule a corporate meeting" : "Create a priority follow-up", action: "create_" + kind, fields: fields() }) : <p role="status" className="rounded-xl border border-amber-200/30 p-4 text-sm">No active internal accounts are available for responsibility. Review account access before creating a record.</p>}
    <div className="grid min-w-0 gap-3 rounded-xl border border-amber-200/20 bg-[#0c1c33] p-4 sm:grid-cols-2 xl:grid-cols-5" aria-label="Corporate agenda filters">
      <label className="min-w-0 text-xs font-semibold text-amber-100">Date selection<select aria-label="Agenda date selection" className={control} value={dateScope} onChange={event => setDateScope(event.target.value)}><option value="all">All dates</option><option value="month">Selected month</option><option value="upcoming">Upcoming or due today</option><option value="overdue">{meeting ? "Past scheduled dates" : "Overdue active records"}</option></select></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">Month<input aria-label="Agenda month" className={control} type="month" value={selectedMonth} onChange={event => { setMonth(event.target.value); setDateScope("month"); }} /></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">Priority<select aria-label="Agenda priority" className={control} value={priority} onChange={event => setPriority(event.target.value)}><option value="all">All priorities</option>{priorities.map(item => <option key={item} value={item}>{readable(item)}</option>)}</select></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">State<select aria-label="Agenda state" className={control} value={status} onChange={event => setStatus(event.target.value)}><option value="all">All states</option>{states.map(item => <option key={item} value={item}>{readable(item)}</option>)}</select></label>
      <label className="min-w-0 text-xs font-semibold text-amber-100">Responsible account<select aria-label="Agenda responsible account" className={control} value={owner} onChange={event => setOwner(event.target.value)}><option value="all">All responsible accounts</option>{[...new Set([...memberOptions.map(member => member.value), ...rows.map(entry => value(entry.data, "assigneeId")).filter(Boolean)])].map(id => <option key={id} value={id}>{names.get(id) || "Account reference: " + id}</option>)}</select></label>
    </div>
    <p role="status" className="text-xs text-slate-400">{matches.length} of {rows.length} internal {meeting ? "meetings" : "follow-ups"} match this selection.</p>
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">{matches.map(entry => {
      const data = entry.data, state = value(data, "status"), responsible = value(data, "assigneeId"), overdue = active(entry) && today && value(data, dateKey) < today;
      const history = Array.isArray(data.history) ? data.history.filter(item => item && typeof item === "object") as Data[] : [];
      return <article key={entry.id} data-agenda-id={entry.id} className="min-w-0 rounded-xl border border-slate-600/60 bg-gradient-to-br from-[#142e4d] to-[#0a192e] p-4 sm:p-5">
        <header className="flex min-w-0 flex-wrap items-start justify-between gap-3"><h4 className="min-w-0 break-words text-lg font-bold text-white">{value(data, "title")}</h4><span className={"rounded-md border px-2 py-1 text-[10px] font-bold uppercase " + (["high", "urgent"].includes(value(data, "priority")) ? "border-orange-300/50 text-orange-200" : "border-amber-200/25 text-amber-100")}>{value(data, "priority")} priority</span></header>
        <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-md border border-slate-600 px-2 py-1 capitalize text-slate-200">{readable(state)}</span>{overdue && <span className="rounded-md border border-orange-300/35 px-2 py-1 text-orange-200">{meeting ? "Past scheduled date" : "Overdue"}</span>}</div>
        <dl className="mt-4 grid min-w-0 gap-3 text-xs sm:grid-cols-2"><div><dt className="text-slate-400">{meeting ? "Meeting date" : "Due date"}</dt><dd className="mt-1 font-mono text-amber-100"><time dateTime={value(data, dateKey)}>{value(data, dateKey) || "Not recorded"}</time>{meeting && value(data, "time") ? " · " + value(data, "time") + " (as recorded)" : ""}</dd></div><div className="min-w-0"><dt className="text-slate-400">Responsible team member</dt><dd className="mt-1 break-all text-slate-100">{names.get(responsible) || value(data, "assigneeEmail") || responsible || "Not recorded"}</dd>{!names.has(responsible) && <p className="mt-1 text-orange-200">Review the responsible account before the next edit.</p>}</div>{meeting && <div className="min-w-0"><dt className="text-slate-400">Location</dt><dd className="mt-1 break-words">{value(data, "location") || "Not recorded"}</dd></div>}<div className="min-w-0"><dt className="text-slate-400">Scope</dt><dd className="mt-1 break-words">{entry.projectId ? projectNames.get(entry.projectId) || "Project reference: " + entry.projectId : "Company-wide"}</dd></div></dl>
        {value(data, "notes") && <p className="mt-4 whitespace-pre-wrap break-words border-t border-slate-600/50 pt-3 text-sm leading-relaxed text-slate-300">{value(data, "notes")}</p>}
        {renderForm({ title: "Edit " + noun + " details", action: "update_" + kind, fixed: { id: entry.id, version: entry.version }, fields: fields(data) })}
        {renderForm({ title: "Change " + noun + " state", action: "set_" + kind + "_state", fixed: { id: entry.id, version: entry.version }, fields: [{ name: "status", label: "New " + noun + " state", type: "select", options: options(states.filter(item => item !== state)) }, { name: "stateReason", label: "State change note", type: "textarea" }] })}
        <details className="mt-4 border-t border-slate-600/50 text-xs text-slate-400"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-amber-100">Record history · {history.length} changes</summary><ol className="space-y-2 pb-3">{history.slice().reverse().map((item, index) => <li key={index} className="rounded-lg border border-slate-700 p-3"><p className="break-all font-mono text-[10px]">{value(item, "recordedAt")}</p><p className="mt-1 capitalize">{readable(value(item, "action"))} · {readable(value(item, "status"))}</p>{value(item, "stateReason") && <p className="mt-1 whitespace-pre-wrap break-words">{value(item, "stateReason")}</p>}<p className="mt-1 break-all text-[10px]">Recorded by {value(item, "actorId")}</p></li>)}</ol></details>
        <p className="mt-3 break-all font-mono text-[10px] text-slate-500">Source {entry.id} · revision {entry.version}</p>
      </article>;
    })}</div>
    {!matches.length && <p className="rounded-xl border border-dashed border-slate-600 p-5 text-sm text-slate-400">No internal {meeting ? "meetings" : "follow-ups"} match these filters.</p>}
  </section>;
}
