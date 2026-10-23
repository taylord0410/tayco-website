import test from 'node:test';
import assert from 'node:assert/strict';
import type { Entry } from '../lib/erp';
import { dashboardAgenda, uniqueDashboardEntries } from '../lib/dashboard-agenda';

const options = { asOf: '2026-10-23T12:00:00.000Z' };
const entry = (id: string, kind: Entry['kind'], data: Entry['data'] = {}, projectId = 'p'): Entry => ({ id, kind, data, projectId, ownerId: 'fixture', tenantId: 'fixture', version: 1, createdAt: options.asOf, updatedAt: options.asOf });
const project = (extra: Entry['data'] = {}, id = 'p') => entry(id, 'project', { name: id, status: 'active', ...extra }, id);
test('agenda uses explicit dates, validates calendar dates and separates upcoming, overdue and next month', () => {
  const report = dashboardAgenda([project({ milestones: [
    { id: 'future', title: 'Site review', status: 'planned', dueDate: '2026-11-05' },
    { id: 'overdue', title: 'Late milestone', status: 'active', dueDate: '2026-10-20' },
    { id: 'invalid', title: 'Invalid', status: 'planned', dueDate: '2026-02-30' },
    { id: 'done', title: 'Done', status: 'completed', dueDate: '2026-11-10' },
    { id: 'cancelled', title: 'Cancelled', status: 'cancelled', dueDate: '2026-11-10' },
  ] }), entry('invoice', 'invoice', { status: 'approved', dueDate: '2026-11-01', reference: 'Invoice' }), entry('today', 'compliance', { status: 'pending', dueDate: '2026-10-23', topic: 'Review' })], options);
  assert.equal(report.activeProjects, 1); assert.deepEqual(report.items.map(item => item.date), ['2026-10-20', '2026-10-23', '2026-11-01', '2026-11-05']);
  assert.equal(report.upcoming.length, 3); assert.equal(report.overdue.length, 1); assert.equal(report.calendarItems.length, 2);
  assert.equal(report.items[3].recordId, 'p'); assert.equal(report.items[3].view, 'project');
});
test('terminal, deleted and malformed source states never invent pending calendar events', () => {
  const entries = [project({ status: 'closed', milestones: [{ id: 'm', title: 'Closed project', status: 'planned', dueDate: '2026-11-01' }] }),
    entry('paid', 'invoice', { status: 'paid', dueDate: '2026-11-01' }), entry('returned', 'invoice', { status: 'returned', dueDate: '2026-11-01' }),
    entry('complete', 'compliance', { status: 'complete', dueDate: '2026-11-01' }), entry('na', 'compliance', { status: 'not_applicable', dueDate: '2026-11-01' }),
    entry('deleted', 'document', { status: 'approved', expiresAt: '2026-11-01', deletedAt: options.asOf }),
    entry('purged', 'document', { status: 'pending_review', expiresAt: '2026-11-01', purgedAt: options.asOf }),
    entry('accepted', 'proposal', { status: 'accepted', validUntil: '2026-11-01' }),
    entry('missing', 'invoice', { status: 'approved' }), entry('bad-date', 'compliance', { status: 'pending', dueDate: '2026-11-31' })];
  const report = dashboardAgenda(entries, options); assert.equal(report.items.length, 0); assert.equal(report.followups.length, 0); assert.equal(report.activeProjects, 0);
});
test('source directions and navigation remain explicit for invoice, compliance, document and sent proposal dates', () => {
  const report = dashboardAgenda([project(), entry('i', 'invoice', { status: 'submitted', dueDate: '2026-11-01' }), entry('c', 'compliance', { status: 'in_review', dueDate: '2026-11-02' }), entry('d', 'document', { status: 'approved', expiresAt: '2026-11-03' }), entry('s', 'proposal', { status: 'sent', validUntil: '2026-11-04' })], options);
  assert.deepEqual(report.items.map(item => item.view), ['invoice', 'compliance', 'document', 'proposal']);
  assert.ok(report.items.every(item => item.projectId === 'p' && item.recordId));
});
test('followups use saved next actions and pending reviews, without inferring dates or completing records', () => {
  const report = dashboardAgenda([project({ nextAction: 'Confirm scope' }), entry('lead', 'lead', { name: 'Request', status: 'waiting', nextAction: 'Call requester' }, ''), entry('doc', 'document', { title: 'Drawing', status: 'pending_review' }), entry('hours', 'hours', { trade: 'Framing', status: 'submitted', date: '2026-10-20' }), entry('closed-lead', 'lead', { status: 'closed', nextAction: 'Old action' }, '')], options);
  assert.equal(report.followups.length, 4); assert.equal(report.items.length, 0); assert.ok(report.followups.every(item => !('date' in item)));
  assert.deepEqual(report.followups.map(item => item.view).sort(), ['document', 'hours', 'lead', 'project']);
});
test('selected project filters out company requests and other project records; exact and conflicting duplicates are handled deterministically', () => {
  const p = project(), i = entry('i', 'invoice', { status: 'approved', dueDate: '2026-11-01' });
  const report = dashboardAgenda([p, p, i, structuredClone(i), project({}, 'other'), entry('other-i', 'invoice', { status: 'approved', dueDate: '2026-11-02' }, 'other'), entry('lead', 'lead', { status: 'new', nextAction: 'Company action' }, '')], { ...options, projectId: 'p' });
  assert.equal(report.activeProjects, 1); assert.equal(report.items.length, 1); assert.equal(report.followups.length, 0); assert.equal(report.scopedEntries.length, 2);
  assert.equal(uniqueDashboardEntries([i, { ...i, data: { ...i.data, dueDate: '2026-11-10' } }]).length, 0);
});
test('duplicate milestone IDs are excluded and next month handles year boundaries and leap dates', () => {
  const report = dashboardAgenda([project({ milestones: [{ id: 'duplicate', title: 'A', status: 'planned', dueDate: '2026-11-01' }, { id: 'duplicate', title: 'B', status: 'planned', dueDate: '2026-11-02' }] })], options);
  assert.equal(report.items.length, 0); assert.equal(dashboardAgenda([], { asOf: '2026-12-31T23:59:00Z' }).nextMonth, '2027-01');
  assert.equal(dashboardAgenda([entry('leap', 'invoice', { status: 'approved', dueDate: '2028-02-29' })], { asOf: '2028-01-31T12:00:00Z' }).calendarItems.length, 1);
  for (const asOf of ['2026-02-30T12:00:00Z', 'invalid', '2026-10-23T99:00:00Z']) assert.throws(() => dashboardAgenda([], { asOf }), RangeError);
});

test('corporate meetings and followups use explicit dates, terminal states, priority and project scope', () => {
  const meeting = entry('meeting', 'corporate_meeting' as Entry['kind'], { title: 'Scope review', status: 'scheduled', date: '2026-11-05', time: '09:30', location: 'Office' }, '');
  const followup = entry('followup', 'followup' as Entry['kind'], { title: 'Confirm supplier', status: 'in_progress', dueDate: '2026-11-06', priority: 'high', notes: 'Check lead time' }, 'p');
  const completed = entry('completed-followup', 'followup' as Entry['kind'], { title: 'Done', status: 'completed', dueDate: '2026-11-07' }, '');
  const cancelled = entry('cancelled-meeting', 'corporate_meeting' as Entry['kind'], { title: 'Cancelled', status: 'cancelled', date: '2026-11-08' }, '');
  const report = dashboardAgenda([project(), meeting, followup, completed, cancelled], options);
  assert.equal(report.items.length, 2); assert.equal(report.calendarItems.length, 2); assert.equal(report.followups.length, 1);
  assert.equal(report.items[0].view, 'corporate_meetings'); assert.match(report.items[0].detail, /09:30 local/); assert.equal(report.items[1].view, 'followups');
  assert.equal(report.followups[0].detail, 'Check lead time'); assert.equal(report.followups[0].priority, 'high'); assert.equal(report.followups[0].dueDate, '2026-11-06'); assert.equal(report.followups[0].overdue, false);
  const selected = dashboardAgenda([project(), meeting, followup], { ...options, projectId: 'p' }); assert.equal(selected.items.length, 1); assert.equal(selected.items[0].recordId, 'followup');
});

test('unresolved document and sent proposal expiries remain visible in overdue after yesterday', () => {
  const report = dashboardAgenda([project(), entry('renew', 'document', { title: 'Renewal', status: 'approved', expiresAt: '2026-10-22' }), entry('sent', 'proposal', { title: 'Decision', status: 'sent', validUntil: '2026-10-22' }), entry('rejected', 'document', { status: 'rejected', expiresAt: '2026-10-22' }), entry('declined', 'proposal', { status: 'declined', validUntil: '2026-10-22' })], options);
  assert.equal(report.upcoming.length, 0); assert.equal(report.overdue.length, 2);
  assert.deepEqual(report.overdue.map(item => item.view).sort(), ['document', 'proposal']);
  assert.ok(report.overdue.every(item => item.date === '2026-10-22'));
});
test('urgent overdue Z survives a five-item preview ahead of low priority A through E, with all sources retained', () => {
  const low = ['A', 'B', 'C', 'D', 'E'].map((title, index) => entry('low-' + title, 'followup' as Entry['kind'], { title, status: 'open', dueDate: '2026-11-' + String(index + 1).padStart(2, '0'), priority: 'low', notes: 'Low priority source' }));
  const urgent = entry('urgent-z', 'followup' as Entry['kind'], { title: 'Z urgent', status: 'in_progress', dueDate: '2026-10-22', priority: 'urgent', notes: 'Action required' });
  const report = dashboardAgenda([project(), ...low, urgent], options);
  assert.equal(report.followups.length, 6); assert.equal(report.followups[0].id, 'urgent-z'); assert.equal(report.followups.slice(0, 5).some(item => item.id === 'urgent-z'), true);
  assert.equal(report.followups[0].overdue, true); assert.equal(report.followups[0].dueDate, '2026-10-22'); assert.equal(report.followups[0].priority, 'urgent');
  assert.deepEqual(report.followups.slice(1).map(item => item.title), ['A', 'B', 'C', 'D', 'E']);
});
