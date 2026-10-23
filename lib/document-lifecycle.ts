import { createHash, randomUUID } from 'node:crypto';
import { del } from '@vercel/blob';
import type { Actor } from './auth';
import { database, documentForActor, ErpError, type Entry } from './erp';

const DAY = 86_400_000;
const internal = (actor: Actor) => actor.role === 'admin' || actor.role === 'staff';
const sourceManaged = (entry: Entry) => entry.data.storage === 'takeoff_viewer';
type PurgeState = 'processing' | 'retry' | 'purged';
type Mutation = { id: string; version: number; action: 'delete' | 'restore' | 'hold' | 'retention'; reason?: string; hold?: boolean; retentionDays?: number | null };
function transact<T>(fn: () => T) { const db = database(); db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } }
function event(actor: Actor, action: string, id: string) { database().prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(), actor.tenantId, actor.id, action, id, new Date().toISOString()); }
function configuredNumber(name: string, fallback: number | null) { const value = process.env[name]; if (!value?.trim()) return fallback; const number = Number(value); if (!Number.isInteger(number) || number < 0 || number > 36500) throw new ErpError(503, 'Document policy configuration requires operator review.'); return number; }
export function documentPolicy() { return { defaultRetentionDays: configuredNumber('TAYCO_DOCUMENT_RETENTION_DAYS', null), noticeDays: configuredNumber('TAYCO_DOCUMENT_NOTICE_DAYS', 30)!, automaticDeletion: false as const, dateBasis: 'UTC' }; }
function retentionDays(entry: Entry): number | null { const value = Object.hasOwn(entry.data, 'retentionDays') ? entry.data.retentionDays : documentPolicy().defaultRetentionDays; return value === null || (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 36500) ? value : null; }
function validDate(value: unknown): value is string { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const date = new Date(`${value}T00:00:00Z`); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
export function documentExpiry(entry: Entry, now = new Date()) {
  const value = entry.data.expiresAt;
  if (!value) return { state: 'no_expiry' as const, daysRemaining: null };
  if (!validDate(value)) return { state: 'invalid' as const, daysRemaining: null };
  const days = Math.round((Date.parse(`${value}T00:00:00Z`) - Date.parse(`${now.toISOString().slice(0, 10)}T00:00:00Z`)) / DAY);
  return { state: days < 0 ? 'expired' as const : days <= documentPolicy().noticeDays ? 'expiring' as const : 'valid' as const, daysRemaining: days };
}
function canManage(actor: Actor, entry: Entry) { if (!internal(actor) && entry.ownerId !== actor.id) throw new ErpError(403, 'Only the document owner or TAYCO team can manage this document.'); }
function checkVersion(entry: Entry, version: number) { if (!Number.isInteger(version) || version !== entry.version) throw new ErpError(409, 'This document changed. Refresh and review its current state.'); }
function save(actor: Actor, entry: Entry, data: Record<string, unknown>, action: string) {
  const at = new Date().toISOString();
  const result = database().prepare('UPDATE records SET payload=?,version=version+1,updated_at=? WHERE id=? AND tenant_id=? AND version=?').run(JSON.stringify(data), at, entry.id, actor.tenantId, entry.version);
  if (result.changes !== 1) throw new ErpError(409, 'This document changed. Refresh before retrying.');
  event(actor, action, entry.id); return { ...entry, data, version: entry.version + 1, updatedAt: at };
}
function availability(entry: Entry) { return entry.data.purgedAt ? 'purged' : entry.data.purgeState === 'processing' ? 'purging' : entry.data.purgeState === 'retry' ? 'purge_unconfirmed' : entry.data.deletedAt ? 'removed' : 'active'; }
function exposed(actor: Actor, entry: Entry, now = new Date()) {
  const data = { ...entry.data }; delete data.blobPath; delete data.purgeAttemptToken;
  if (!internal(actor)) for (const key of ['holdReason', 'holdChangedBy', 'deleteReason', 'deletedBy', 'purgeLastError', 'purgeAttempts', 'purgeLeaseUntil', 'purgeAttemptedAt', 'retentionDays']) delete data[key];
  const expiry = documentExpiry(entry, now);
  return { ...entry, data, expiry, availability: availability(entry), effectiveRetentionDays: internal(actor) && !sourceManaged(entry) ? retentionDays(entry) : null, canManage: internal(actor) || entry.ownerId === actor.id, canRestore: Boolean(entry.data.deletedAt && !entry.data.purgeAttemptedAt && !entry.data.purgedAt), canSetPolicy: internal(actor), canPurge: actor.role === 'admin' && !sourceManaged(entry) };
}
export function getReadableDocument(actor: Actor, id: string) { const entry = documentForActor(actor, id); if (entry.data.deletedAt || entry.data.purgedAt || entry.data.purgeState) throw new ErpError(410, 'This document is no longer available. Contact TAYCO if you need assistance.'); return entry; }
function authorizedDocuments(actor: Actor) {
  const rows = database().prepare("SELECT id FROM records WHERE kind='document' AND tenant_id=? ORDER BY updated_at DESC").all(actor.tenantId) as { id: string }[];
  return rows.flatMap(row => { try { const entry = documentForActor(actor, row.id); if (entry.data.deletedAt && !internal(actor) && entry.ownerId !== actor.id) return []; return [entry]; } catch (error) { if (error instanceof ErpError && error.status === 404) return []; throw error; } });
}
function noticesTable() { database().exec('CREATE TABLE IF NOT EXISTS document_notices(id TEXT PRIMARY KEY,tenant_id TEXT NOT NULL,document_id TEXT NOT NULL,expires_at TEXT NOT NULL,stage TEXT NOT NULL,created_at TEXT NOT NULL);'); }
export function documentMaintenance(actor: Actor, now = new Date()) {
  if (!['admin', 'staff', 'client', 'vendor'].includes(actor.role)) throw new ErpError(403, 'Document details are not available to this account.');
  noticesTable(); const documents = authorizedDocuments(actor); const permitted = new Map(documents.filter(d => !d.data.deletedAt).map(d => [d.id, d]));
  const notices = (database().prepare('SELECT id,document_id AS documentId,expires_at AS expiresAt,stage,created_at AS createdAt FROM document_notices WHERE tenant_id=? ORDER BY created_at DESC LIMIT 500').all(actor.tenantId) as { documentId: string; expiresAt: string; stage: string }[]).filter(notice => { const doc = permitted.get(notice.documentId); return doc && doc.data.status === 'approved' && doc.data.expiresAt === notice.expiresAt && documentExpiry(doc, now).state === notice.stage; });
  const policy = documentPolicy(); return { actor: { id: actor.id, role: actor.role }, documents: documents.map(entry => exposed(actor, entry, now)), notices, policy: { ...policy, defaultRetentionDays: internal(actor) ? policy.defaultRetentionDays : null } };
}
export function mutateDocumentLifecycle(actor: Actor, input: Mutation) {
  return transact(() => {
    const entry = documentForActor(actor, input.id); canManage(actor, entry); checkVersion(entry, input.version);
    if (entry.data.purgedAt) throw new ErpError(410, 'The stored file has been permanently removed. Its audit record is retained.');
    if (entry.data.purgeState === 'processing') throw new ErpError(409, 'Storage deletion is already in progress. A hold or restore cannot stop an operation that has started.');
    const data = { ...entry.data }; const reason = typeof input.reason === 'string' ? input.reason.trim().slice(0, 1000) : '';
    if (input.action === 'delete') {
      if (data.deletedAt) return exposed(actor, entry);
      data.deletedAt = new Date().toISOString(); data.deletedBy = actor.id; data.deleteReason = reason;
    } else if (input.action === 'restore') {
      if (!data.deletedAt) return exposed(actor, entry);
      if (data.purgeAttemptedAt) throw new ErpError(409, 'Storage deletion was attempted and its outcome may be uncertain. Restore is blocked; ask TAYCO to reconcile storage or upload a replacement.');
      delete data.deletedAt; delete data.deletedBy; delete data.deleteReason;
    } else if (input.action === 'hold') {
      if (!internal(actor)) throw new ErpError(403, 'Only the TAYCO team can change preservation holds.');
      if (typeof input.hold !== 'boolean' || (input.hold && !reason)) throw new ErpError(422, 'Provide a reason for the preservation hold.');
      data.hold = input.hold; data.holdReason = input.hold ? reason : ''; data.holdChangedBy = actor.id;
    } else if (input.action === 'retention') {
      if (!internal(actor)) throw new ErpError(403, 'Only the TAYCO team can set retention.');
      if (input.retentionDays !== null && (!Number.isInteger(input.retentionDays) || input.retentionDays! < 0 || input.retentionDays! > 36500)) throw new ErpError(422, 'Choose an explicit retention period or leave physical deletion disabled.');
      data.retentionDays = input.retentionDays;
    } else throw new ErpError(422, 'Choose a valid document action.');
    return exposed(actor, save(actor, entry, data, `document.${input.action}`));
  });
}
export function scanDocumentExpiry(actor: Actor, now = new Date()) {
  if (!internal(actor)) throw new ErpError(403, 'Only the TAYCO team can check company document renewals.');
  noticesTable();
  return transact(() => {
    let created = 0;
    for (const entry of authorizedDocuments(actor)) {
      if (entry.data.status !== 'approved' || entry.data.deletedAt || entry.data.purgedAt) continue;
      const { state } = documentExpiry(entry, now); if (state !== 'expiring' && state !== 'expired') continue;
      const expiry = String(entry.data.expiresAt); const key = createHash('sha256').update(`document:${entry.id}:${expiry}`).digest('hex'); const at = now.toISOString();
      const result = database().prepare('INSERT OR IGNORE INTO document_notices VALUES(?,?,?,?,?,?)').run(`${key}:${state}`, actor.tenantId, entry.id, expiry, state, at);
      if (result.changes) { created++; database().prepare('INSERT OR IGNORE INTO outbox(id,tenant_id,kind,payload,next_attempt_at,created_at) VALUES(?,?,?,?,?,?)').run(`document-expiry:${key}`, actor.tenantId, 'document_expiry', JSON.stringify({ referenceId: entry.id, expiresAt: expiry }), at, at); }
    }
    return { created, ...documentMaintenance(actor, now) };
  });
}
function eligible(entry: Entry, now: Date) {
  const retention = retentionDays(entry); const deleted = typeof entry.data.deletedAt === 'string' ? Date.parse(entry.data.deletedAt) : NaN;
  return Boolean(!sourceManaged(entry) && Number.isFinite(deleted) && retention !== null && Number.isInteger(retention) && retention >= 0 && !entry.data.hold && !entry.data.purgedAt && now.getTime() >= deleted + retention * DAY);
}
export type DeleteDocumentTransport = (pathname: string) => Promise<void>;
const defaultRemove: DeleteDocumentTransport = async pathname => { await del(pathname); };
export async function purgeDocument(actor: Actor, input: { id: string; version: number; apply?: boolean }, remove: DeleteDocumentTransport = defaultRemove) {
  if (actor.role !== 'admin') throw new ErpError(403, 'Only an administrator can permanently remove stored files.');
  if (!input.apply) { const entry = documentForActor(actor, input.id); checkVersion(entry, input.version); return { applied: false, eligible: eligible(entry, new Date()), document: exposed(actor, entry) }; }
  const candidate = documentForActor(actor, input.id); checkVersion(candidate, input.version);
  if (sourceManaged(candidate)) throw new ErpError(409, 'This source-managed document cannot be deleted from storage here. Remove its access record instead.');
  if (remove === defaultRemove && !process.env.BLOB_READ_WRITE_TOKEN) throw new ErpError(503, 'Secure storage is not configured. No storage deletion was attempted.');
  const claim = transact(() => {
    const entry = documentForActor(actor, input.id); checkVersion(entry, input.version); const now = new Date();
    if (sourceManaged(entry)) throw new ErpError(409, 'This source-managed document cannot be deleted from storage here. Remove its access record instead.');
    if (entry.data.purgedAt) return { entry, token: null };
    if (!eligible(entry, now)) throw new ErpError(409, 'Permanent deletion requires removal, an elapsed explicit retention period and no preservation hold.');
    if (entry.data.purgeState === 'processing' && typeof entry.data.purgeLeaseUntil === 'string' && Date.parse(entry.data.purgeLeaseUntil) > now.getTime()) throw new ErpError(409, 'Storage deletion is already in progress.');
    if (typeof entry.data.blobPath !== 'string' || !/^vendor-docs\/(w9|insurance|project)-[a-f0-9-]+\.(pdf|jpg|png)$/.test(entry.data.blobPath)) throw new ErpError(409, 'The private storage reference needs operator review.');
    const token = randomUUID(); const data = { ...entry.data, purgeState: 'processing' as PurgeState, purgeAttemptedAt: now.toISOString(), purgeAttemptToken: token, purgeLeaseUntil: new Date(now.getTime() + 300_000).toISOString(), purgeAttempts: Number(entry.data.purgeAttempts || 0) + 1 };
    return { entry: save(actor, entry, data, 'document.purge_started'), token };
  });
  if (!claim.token) return { applied: true, confirmed: true, document: exposed(actor, claim.entry) };
  let confirmed = false;
  try { await remove(String(claim.entry.data.blobPath)); confirmed = true; } catch { /* An uncertain result remains tombstoned and can only be retried/reconciled. */ }
  return transact(() => {
    const current = documentForActor(actor, input.id);
    if (current.data.purgeAttemptToken !== claim.token) return { applied: true, confirmed: false, superseded: true, document: exposed(actor, current) };
    const data: Record<string, unknown> = { ...current.data, purgeState: confirmed ? 'purged' : 'retry', purgeLastError: confirmed ? null : 'Storage deletion was not confirmed. The document remains unavailable.' };
    delete data.purgeAttemptToken; delete data.purgeLeaseUntil;
    if (confirmed) { data.purgedAt = new Date().toISOString(); delete data.blobPath; }
    return { applied: true, confirmed, document: exposed(actor, save(actor, current, data, confirmed ? 'document.purged' : 'document.purge_unconfirmed')) };
  });
}
