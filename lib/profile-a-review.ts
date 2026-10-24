import { createHash } from 'node:crypto';
import type { Actor } from './auth';
import type {RecipientDocumentAccess,RecipientDocumentCoverage} from './profile-a-document-availability';

export class ProfileAReviewError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'ProfileAReviewError'; }
}
export type ReviewDocumentLink = { sha256: string; contextKey: string; viewerDocumentId: string };
export type ProfileAReview = {
  period: string; sourceLabel: string; opportunityCount: number; reportedDatedCount: number; undatedCount: number;
  liveCount: number; documentCount: number; receivedDocumentCount: number; linkedDocumentCount: number;recipientCoverage?:RecipientDocumentCoverage;
  rows: { id: string; name: string; location: string | null; contractor: string | null;
    section: 'dated' | 'undated' | 'live'; reportedDeadline: string | null;
    documents: { name: string; state: 'received' | 'pending'; viewerHref: string | null;recipientAccess?:RecipientDocumentAccess }[] }[];
};
const bad = () => new ProfileAReviewError(503, 'The review source is not available.');
export function assertProfileAAdministrator(actor: Pick<Actor, 'role' | 'tenantId'>) {
  if (actor.role !== 'admin' || !actor.tenantId) throw new ProfileAReviewError(403, 'Not authorized.');
}
function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).length !== keys.length || Object.keys(value).some(key => !keys.includes(key))) throw bad();
  return value as Record<string, unknown>;
}
function text(value: unknown, max = 200): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value)) throw bad();
  return value.trim();
}
function optionalText(value: unknown) { return value === null ? null : text(value); }
function list(value: unknown, max: number): unknown[] { if (!Array.isArray(value) || value.length > max) throw bad(); return value; }
const id = /^[A-Za-z0-9_-]{1,200}$/;
const sha = /^[a-f0-9]{64}$/;
function date(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw bad();
  const parsed = new Date(value + 'T12:00:00Z');
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) throw bad();
  return value;
}
/** Administrative source preview only. No grant, invitation, mutation or financial projection. */
export function buildProfileAReview(actor: Pick<Actor, 'role' | 'tenantId'>, bytes: Buffer,
  expectedSha256: string, links: readonly ReviewDocumentLink[] = []): ProfileAReview {
  assertProfileAAdministrator(actor);
  return parseProfileAReviewSource(actor.tenantId,bytes,expectedSha256,links);
}
/** Pure closed source parser. Does not authorize any account or resource. */
export function parseProfileAReviewSource(tenantId:string,bytes:Buffer,expectedSha256:string,links:readonly ReviewDocumentLink[]=[]):ProfileAReview {
  if (bytes.length < 1 || bytes.length > 1024 * 1024 || !sha.test(expectedSha256) ||
      createHash('sha256').update(bytes).digest('hex') !== expectedSha256) throw bad();
  let decoded: unknown;
  try { decoded = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { throw bad(); }
  const source = object(decoded, ['schemaVersion', 'tenantId', 'period', 'rows']);
  if (source.schemaVersion !== 'tayco-profile-a-review/v1' || source.tenantId !== tenantId ||
      typeof source.period !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(source.period)) throw bad();
  const bySha = new Map<string, ReviewDocumentLink[]>();
  for (const link of links) {
    if (!sha.test(link.sha256) || !id.test(link.contextKey) || !id.test(link.viewerDocumentId)) throw bad();
    const matches = bySha.get(link.sha256) ?? []; matches.push(link); bySha.set(link.sha256, matches);
  }
  const seen = new Set<string>(); let documentCount = 0;
  const rows = list(source.rows, 128).map(value => {
    const row = object(value, ['id', 'name', 'location', 'contractor', 'section', 'reportedDeadline', 'documents']);
    const rowId = text(row.id); if (!id.test(rowId) || seen.has(rowId)) throw bad(); seen.add(rowId);
    const name = text(row.name);
    if (name.toLowerCase().replace(/[^a-z0-9]/g, '').includes('autozone')) throw bad();
    if (!['dated', 'undated', 'live'].includes(row.section as string)) throw bad();
    const deadline = date(row.reportedDeadline);
    if ((row.section === 'dated' && deadline === null) || (row.section === 'undated' && deadline !== null)) throw bad();
    const docSeen = new Set<string>();
    const documents = list(row.documents, 8).map(value => {
      if (++documentCount > 512) throw bad();
      const doc = object(value, ['name', 'state', 'sha256']);
      const docName = text(doc.name, 300);
      if (!['received', 'pending'].includes(doc.state as string)) throw bad();
      if ((doc.state === 'received' && (typeof doc.sha256 !== 'string' || !sha.test(doc.sha256))) ||
          (doc.state === 'pending' && doc.sha256 !== null)) throw bad();
      const key = doc.sha256 === null ? docName : doc.sha256 as string;
      if (docSeen.has(key)) throw bad(); docSeen.add(key);
      const matches = typeof doc.sha256 === 'string' ? bySha.get(doc.sha256) ?? [] : [];
      const link = matches.length === 1 ? matches[0] : null;
      return { name: docName, state: doc.state as 'received' | 'pending',
        viewerHref: link ? '/api/takeoff-viewer/viewer?embed=1&project=' +
          encodeURIComponent(link.contextKey) + '&document=' + encodeURIComponent(link.viewerDocumentId) : null };
    });
    return { id: rowId, name, location: optionalText(row.location), contractor: optionalText(row.contractor),
      section: row.section as 'dated' | 'undated' | 'live', reportedDeadline: deadline, documents };
  });
  if (!rows.length) throw bad();
  return { period: source.period, sourceLabel: 'Reported source records — pending business verification',
    opportunityCount: rows.length, reportedDatedCount: rows.filter(r => r.section === 'dated').length,
    undatedCount: rows.filter(r => r.section === 'undated').length, liveCount: rows.filter(r => r.section === 'live').length,
    documentCount, receivedDocumentCount: rows.flatMap(r => r.documents).filter(d => d.state === 'received').length,
    linkedDocumentCount: rows.flatMap(r => r.documents).filter(d => d.viewerHref !== null).length, rows };
}
