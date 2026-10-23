import type { Data, Entry } from './erp';
import { isFinancialDate } from './financial-periods';
import { nextFinancialMonth } from './financial-forecast';

export type DashboardAgendaItem = { id: string; recordId: string; projectId: string; date: string; title: string; detail: string; kind: 'milestone' | 'invoice' | 'compliance' | 'document' | 'proposal' | 'meeting' | 'followup'; view: string };
export type DashboardFollowup = { id: string; projectId: string; title: string; detail: string; kind: 'project' | 'lead' | 'document' | 'hours' | 'followup'; view: string; priority: 'low' | 'normal' | 'high' | 'urgent'; dueDate: string | null; overdue: boolean };
const text = (data: Data, key: string) => typeof data[key] === 'string' ? String(data[key]).trim() : '';
const title = (entry: Entry) => text(entry.data, 'name') || text(entry.data, 'title') || text(entry.data, 'reference') || text(entry.data, 'topic') || 'Source record';
const current = (entry: Entry) => !entry.data.deletedAt && !entry.data.purgedAt;
const rows = (value: unknown): Data[] => Array.isArray(value) ? value.filter((row): row is Data => Boolean(row) && typeof row === 'object' && !Array.isArray(row)) : [];

/** Exact duplicates collapse. Conflicting identities are excluded, rather than choosing a source. */
export function uniqueDashboardEntries(entries: Entry[]): Entry[] {
  const unique = new Map<string, Entry>(), conflicts = new Set<string>();
  for (const entry of entries) {
    if (!entry.id) continue;
    const previous = unique.get(entry.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(entry)) conflicts.add(entry.id);
    else unique.set(entry.id, entry);
  }
  return [...unique.values()].filter(entry => !conflicts.has(entry.id));
}

export function dashboardAgenda(entries: Entry[], options: { asOf: string; projectId?: string }) {
  const today = options.asOf.slice(0, 10);
  if (!isFinancialDate(today) || !Number.isFinite(Date.parse(options.asOf))) throw new RangeError('A valid recorded snapshot date is required.');
  const nextMonth = nextFinancialMonth(today.slice(0, 7));
  const scopedEntries = uniqueDashboardEntries(entries).filter(entry => !options.projectId || entry.projectId === options.projectId);
  const projects = scopedEntries.filter(entry => entry.kind === 'project');
  const projectNames = new Map(projects.map(project => [project.id, title(project)]));
  const items: DashboardAgendaItem[] = [], followups: DashboardFollowup[] = [];
  function addFollowup(entry: Entry, kind: DashboardFollowup['kind'], itemTitle: string, detail: string, view: string, priority: DashboardFollowup['priority'] = 'normal', dueDate: string | null = null) {
    followups.push({ id: entry.id, projectId: entry.projectId, title: itemTitle, detail, kind, view, priority, dueDate, overdue: Boolean(dueDate && dueDate < today) });
  }
  function add(entry: Entry, kind: DashboardAgendaItem['kind'], date: unknown, itemTitle: string, detail: string, view: string, suffix = '') {
    if (!isFinancialDate(date)) return;
    items.push({ id: kind + ':' + entry.id + (suffix ? ':' + suffix : ''), recordId: entry.id, projectId: entry.projectId, date, title: itemTitle, detail, kind, view });
  }
  for (const entry of scopedEntries) {
    const d = entry.data, state = text(d, 'status'), projectName = projectNames.get(entry.projectId) || 'Project source';
    if (!current(entry)) continue;
    if (entry.kind === 'project') {
      if (state !== 'closed' && text(d, 'nextAction')) addFollowup(entry, 'project', title(entry), text(d, 'nextAction'), 'project');
      if (state === 'closed') continue;
      const milestones = rows(d.milestones), counts = new Map<string, number>();
      for (const milestone of milestones) { const id = text(milestone, 'id'); if (id) counts.set(id, (counts.get(id) || 0) + 1); }
      for (const milestone of milestones) {
        const id = text(milestone, 'id');
        if (!id || counts.get(id) !== 1 || !['planned', 'active'].includes(text(milestone, 'status')) || !text(milestone, 'title')) continue;
        add(entry, 'milestone', milestone.dueDate, text(milestone, 'title'), title(entry) + ' · Milestone', 'project', id);
      }
    } else if (String(entry.kind) === 'corporate_meeting' && state === 'scheduled') {
      add(entry, 'meeting', d.date, title(entry), 'Meeting' + (text(d, 'time') ? ' · ' + text(d, 'time') + ' local' : '') + (text(d, 'location') ? ' · ' + text(d, 'location') : ''), 'corporate_meetings');
    } else if (String(entry.kind) === 'followup' && ['open', 'in_progress'].includes(state)) {
      add(entry, 'followup', d.dueDate, title(entry), 'Follow-up · ' + (text(d, 'priority') || 'normal') + ' priority', 'followups');
      const priority = ['low', 'normal', 'high', 'urgent'].includes(text(d, 'priority')) ? text(d, 'priority') as DashboardFollowup['priority'] : 'normal';
      addFollowup(entry, 'followup', title(entry), text(d, 'notes') || 'Review saved follow-up', 'followups', priority, isFinancialDate(d.dueDate) ? d.dueDate : null);
    } else if (entry.kind === 'invoice' && ['submitted', 'approved'].includes(state)) {
      add(entry, 'invoice', d.dueDate, title(entry), projectName + ' · Invoice due', 'invoice');
    } else if (entry.kind === 'compliance' && ['pending', 'in_review', 'expired'].includes(state)) {
      add(entry, 'compliance', d.dueDate, title(entry), projectName + ' · Compliance review', 'compliance');
    } else if (entry.kind === 'document') {
      if (state === 'pending_review') addFollowup(entry, 'document', title(entry), 'Document awaiting review', 'document');
      if (state === 'approved' && isFinancialDate(d.expiresAt)) add(entry, 'document', d.expiresAt, title(entry), projectName + ' · Document renewal', 'document');
    } else if (entry.kind === 'proposal' && state === 'sent') {
      if (isFinancialDate(d.validUntil)) add(entry, 'proposal', d.validUntil, title(entry), projectName + ' · Proposal validity', 'proposal');
    } else if (entry.kind === 'lead' && ['new', 'reviewing', 'waiting', 'quoted'].includes(state) && text(d, 'nextAction')) {
      addFollowup(entry, 'lead', title(entry), text(d, 'nextAction'), 'lead');
    } else if (entry.kind === 'hours' && state === 'submitted') {
      addFollowup(entry, 'hours', text(d, 'trade') || projectName, 'Work hours awaiting review', 'hours');
    }
  }
  items.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
  followups.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || Number(b.overdue) - Number(a.overdue) || (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99') || a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  return { today, nextMonth, scopedEntries, activeProjects: projects.filter(project => current(project) && project.data.status === 'active').length, items, upcoming: items.filter(item => item.date >= today), overdue: items.filter(item => item.date < today), calendarItems: items.filter(item => item.date.slice(0, 7) === nextMonth), followups };
}
