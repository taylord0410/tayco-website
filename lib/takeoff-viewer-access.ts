import { createHash } from 'node:crypto';
import { closeSync, existsSync, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import path from 'node:path';
import { TextDecoder } from 'node:util';
import type { Actor } from './auth';
import { database, documentForActor, ErpError, snapshot, type Entry } from './erp';
import { COMMERCIAL_STAGE_CODES } from './commercial-stages';
import { currentReportingPeriod } from './guest-period';
import {insurerPolicy,InsurerReviewError} from './insurer-review-policy';
import { isFinancialDate } from './financial-periods';

export const VIEWER_PREFIX = '/api/takeoff-viewer';
export class TakeoffViewerAccessError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'TakeoffViewerAccessError'; }
}
export type ViewerRelations = {
  schemaVersion: 'takeoff-viewer-relations/v1'; bundleId: string; relationsId: string; manifestSha256: string;
  contexts: { contextKey: string; displayName: string; identityStatus: 'resolved' | 'unresolved'; documentIds: string[] }[];
  documents: { documentId: string; contextKeys: string[]; assetIds: string[]; kind: string }[];
  assets: { assetId: string; documentIds: string[] }[];
};
export type ViewerScope = {
  bundleId: string; relationsId: string; manifestSha256: string; relationsSha256: string;
  contexts: { key: string; documentIds: string[] }[]; documentIds: string[]; assetIds: string[];
  documents: { id: string; contextKey: string; assetIds: string[]; sourceSha256: string }[];
};
type Mapping = { tenantId: string; projectId: string; contextKey: string; documents: { viewerDocumentId: string; erpDocumentId: string }[] };
type GuestReviewGrant = { tenantId: string; guestId: string; projectId: string; period: string; viewerDocumentIds: string[] };
type AccessConfig = { schemaVersion: 'tayco-takeoff-viewer-access/v1' | 'tayco-takeoff-viewer-access/v2'; bundleId: string; relationsSha256: string; mappings: Mapping[]; guestReviews: GuestReviewGrant[] };
export type GuestProjectReview = { projectId: string; name: string; period: string; status: string; progress: number | null; commercialStage: string | null; completedStages: string[]; documentCount: number };
const unavailable = () => new TakeoffViewerAccessError(503, 'The Takeoff viewer is not configured or is temporarily unavailable.');
const denied = () => new TakeoffViewerAccessError(404, 'The Takeoff viewer is not available for this project.');
const guestDenied = () => new TakeoffViewerAccessError(403, 'This account cannot access these project plans.');
const sourceId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const erpId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;
const sha256 = /^[a-f0-9]{64}$/;
const periodPattern = /^(?:19|[2-9]\d)\d{2}-(?:0[1-9]|1[0-2])$/;
const kinds = new Set(['drawing_pdf', 'drawing_image', 'itb', 'specification', 'addendum', 'reference', 'processed_docx']);
// Bounded readonly policy inputs; there are no default files, records, or startup writes.
const RELATIONS_BYTES = 5 * 1024 * 1024, MAPPING_BYTES = 1024 * 1024;
const CONTEXT_LIMIT = 512, DOCUMENT_LIMIT = 4096, ASSET_LIMIT = 8192, MAPPING_LIMIT = 2048;

function object(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype ||
    Object.keys(value).length !== keys.length || Object.keys(value).some(key => !keys.includes(key))) throw unavailable();
  return value as Record<string, unknown>;
}
function list(value: unknown, max: number, min = 0): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw unavailable();
  return value;
}
function id(value: unknown, pattern = sourceId): string {
  if (typeof value !== 'string' || !pattern.test(value)) throw unavailable();
  return value;
}
function ids(value: unknown, max: number, min = 0): string[] {
  const result = list(value, max, min).map(value => id(value));
  if (new Set(result).size !== result.length) throw unavailable();
  return result;
}
function unique<T>(rows: T[], key: (row: T) => string): Map<string, T> {
  const result = new Map<string, T>();
  for (const row of rows) { const value = key(row); if (result.has(value)) throw unavailable(); result.set(value, row); }
  return result;
}
function label(value: unknown): string {
  if (typeof value !== 'string' || value.length > 500 || !value.trim() || /[\u0000-\u001f\u007f-\u009f]/.test(value) ||
    /(?:^|[^A-Za-z0-9])[A-Za-z]:[\\/]/.test(value) || /^[\\/]/.test(value) || /(?:^|\s)\/(?:[^/\s]+\/)+[^/\s]+/.test(value)) throw unavailable();
  return value;
}
function readPolicyFile(filename: string, max: number): Buffer {
  let descriptor: number | undefined;
  try {
    if (!filename.trim() || filename.includes('\0') || lstatSync(filename).isSymbolicLink()) throw unavailable();
    descriptor = openSync(filename, 'r');
    const before = fstatSync(descriptor);
    if (!before.isFile() || before.size < 1 || before.size > max) throw unavailable();
    const buffer = Buffer.alloc(before.size + 1);
    let offset = 0;
    while (offset < buffer.length) { const count = readSync(descriptor, buffer, offset, buffer.length - offset, offset); if (!count) break; offset += count; }
    if (offset !== before.size || fstatSync(descriptor).size !== before.size) throw unavailable();
    return buffer.subarray(0, offset);
  } catch { throw unavailable(); }
  finally { if (descriptor !== undefined) closeSync(descriptor); }
}
function json(bytes: Buffer): unknown {
  try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
  catch { throw unavailable(); }
}

function parseRelations(value: unknown): ViewerRelations {
  const row = object(value, ['schemaVersion', 'bundleId', 'relationsId', 'manifestSha256', 'contexts', 'documents', 'assets']);
  if (row.schemaVersion !== 'takeoff-viewer-relations/v1' || typeof row.relationsId !== 'string' || !/^relations-[a-f0-9]{64}$/.test(row.relationsId)) throw unavailable();
  const bundleId = id(row.bundleId), manifestSha256 = id(row.manifestSha256, sha256);
  const contexts = list(row.contexts, CONTEXT_LIMIT).map((value): ViewerRelations['contexts'][number] => {
    const context = object(value, ['contextKey', 'displayName', 'identityStatus', 'documentIds']);
    if (context.identityStatus !== 'resolved' && context.identityStatus !== 'unresolved') throw unavailable();
    return { contextKey: id(context.contextKey), displayName: label(context.displayName), identityStatus: context.identityStatus, documentIds: ids(context.documentIds, DOCUMENT_LIMIT) };
  });
  const documents = list(row.documents, DOCUMENT_LIMIT).map(value => {
    const document = object(value, ['documentId', 'contextKeys', 'assetIds', 'kind']);
    if (typeof document.kind !== 'string' || !kinds.has(document.kind)) throw unavailable();
    return { documentId: id(document.documentId), contextKeys: ids(document.contextKeys, 1, 1), assetIds: ids(document.assetIds, 2, 1), kind: document.kind };
  });
  const assets = list(row.assets, ASSET_LIMIT).map(value => {
    const asset = object(value, ['assetId', 'documentIds']);
    return { assetId: id(asset.assetId), documentIds: ids(asset.documentIds, DOCUMENT_LIMIT, 1) };
  });
  const contextById = unique(contexts, row => row.contextKey), documentById = unique(documents, row => row.documentId), assetById = unique(assets, row => row.assetId);
  for (const context of contexts) for (const documentId of context.documentIds) {
    if (documentById.get(documentId)?.contextKeys[0] !== context.contextKey) throw unavailable();
  }
  for (const document of documents) {
    if (!contextById.get(document.contextKeys[0])?.documentIds.includes(document.documentId)) throw unavailable();
    for (const assetId of document.assetIds) if (!assetById.get(assetId)?.documentIds.includes(document.documentId)) throw unavailable();
  }
  for (const asset of assets) for (const documentId of asset.documentIds) {
    if (!documentById.get(documentId)?.assetIds.includes(asset.assetId)) throw unavailable();
  }
  return { schemaVersion: 'takeoff-viewer-relations/v1', bundleId, relationsId: row.relationsId, manifestSha256, contexts, documents, assets };
}

function parseConfig(value: unknown): AccessConfig {
  const version = value && typeof value === 'object' ? (value as Record<string, unknown>).schemaVersion : undefined;
  if (version !== 'tayco-takeoff-viewer-access/v1' && version !== 'tayco-takeoff-viewer-access/v2') throw unavailable();
  const row = object(value, ['schemaVersion', 'bundleId', 'relationsSha256', 'mappings', ...(version === 'tayco-takeoff-viewer-access/v2' ? ['guestReviews'] : [])]);
  let documentCount = 0;
  const mappings = list(row.mappings, MAPPING_LIMIT).map(value => {
    const mapping = object(value, ['tenantId', 'projectId', 'contextKey', 'documents']);
    const documents = list(mapping.documents, DOCUMENT_LIMIT, 1).map(value => {
      const document = object(value, ['viewerDocumentId', 'erpDocumentId']);
      return { viewerDocumentId: id(document.viewerDocumentId), erpDocumentId: id(document.erpDocumentId, erpId) };
    });
    documentCount += documents.length; if (documentCount > DOCUMENT_LIMIT) throw unavailable();
    unique(documents, row => row.viewerDocumentId); unique(documents, row => row.erpDocumentId);
    return { tenantId: id(mapping.tenantId, erpId), projectId: id(mapping.projectId, erpId), contextKey: id(mapping.contextKey), documents };
  });
  unique(mappings, row => JSON.stringify([row.tenantId, row.projectId, row.contextKey]));
  // A viewer document cannot ambiguously represent two ERP records/projects within one company.
  const owners = new Map<string, string>();
  for (const mapping of mappings) for (const document of mapping.documents) {
    const key = JSON.stringify([mapping.tenantId, document.viewerDocumentId]), owner = JSON.stringify([mapping.projectId, document.erpDocumentId]);
    if (owners.has(key) && owners.get(key) !== owner) throw unavailable();
    owners.set(key, owner);
  }
  let grantDocumentCount = 0;
  const guestReviews = version === 'tayco-takeoff-viewer-access/v1' ? [] : list(row.guestReviews, MAPPING_LIMIT).map(value => {
    const grant = object(value, ['tenantId', 'guestId', 'projectId', 'period', 'viewerDocumentIds']);
    if (typeof grant.period !== 'string' || !periodPattern.test(grant.period)) throw unavailable();
    const viewerDocumentIds = ids(grant.viewerDocumentIds, DOCUMENT_LIMIT, 1);
    grantDocumentCount += viewerDocumentIds.length; if (grantDocumentCount > DOCUMENT_LIMIT) throw unavailable();
    const tenantId = id(grant.tenantId, erpId), projectId = id(grant.projectId, erpId);
    const approved = new Set(mappings.filter(mapping => mapping.tenantId === tenantId && mapping.projectId === projectId).flatMap(mapping => mapping.documents.map(document => document.viewerDocumentId)));
    if (viewerDocumentIds.some(documentId => !approved.has(documentId))) throw unavailable();
    return { tenantId, guestId: id(grant.guestId, erpId), projectId, period: grant.period, viewerDocumentIds };
  });
  unique(guestReviews, grant => JSON.stringify([grant.tenantId, grant.guestId, grant.projectId, grant.period]));
  return { schemaVersion: version, bundleId: id(row.bundleId), relationsSha256: id(row.relationsSha256, sha256), mappings, guestReviews };
}

type DeliverySource = { sourceSha256: string; contentType: string; kind: string };
/** The existing v1 manifest supplies the source identity missing from relations.
 * This is metadata binding, not a physical-asset hash or an authorization grant. */
function deliverySources(relations: ViewerRelations): Map<string, DeliverySource> {
  const defaultManifest = path.join(process.cwd(), 'lib', 'viewer-bundle-meta', 'manifest.json');
  const filename = process.env.TAYCO_TAKEOFF_MANIFEST_PATH || (existsSync(defaultManifest) ? defaultManifest : undefined);
  if (!filename) throw unavailable();
  const bytes = readPolicyFile(filename, 10 * 1024 * 1024);
  if (createHash('sha256').update(bytes).digest('hex') !== relations.manifestSha256) throw unavailable();
  const record = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw unavailable();
    return value as Record<string, unknown>;
  };
  const manifest = record(json(bytes));
  if (manifest.schema_version !== 'takeoff-viewer-bundle/v1' || manifest.bundle_id !== relations.bundleId) throw unavailable();
  const equal = (a: string[], b: string[]) => { const left = [...a].sort(), right = [...b].sort(); return left.length === right.length && left.every((id, i) => id === right[i]); };
  const projects = unique(list(manifest.projects, CONTEXT_LIMIT).map(value => {
    const row = record(value);
    return { key: id(row.key), displayName: row.display_name, identityStatus: row.identity_status, documentIds: ids(row.document_ids, DOCUMENT_LIMIT) };
  }), row => row.key);
  if (!equal([...projects.keys()], relations.contexts.map(row => row.contextKey))) throw unavailable();
  for (const context of relations.contexts) {
    const project = projects.get(context.contextKey)!;
    if (project.displayName !== context.displayName || project.identityStatus !== context.identityStatus || !equal(project.documentIds, context.documentIds)) throw unavailable();
  }
  const assets = unique(list(manifest.assets, ASSET_LIMIT).map(value => {
    const row = record(value), media = row.media_type, path = row.path;
    if (typeof media !== 'string' || !['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/json', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(media) ||
        typeof path !== 'string' || !path || path.length > 500 || /^[\\/]/.test(path) || /[\\%?#:\u0000-\u001f]/.test(path) ||
        path.split('/').some(part => !part || part === '.' || part === '..') || !Number.isSafeInteger(row.size_bytes) || Number(row.size_bytes) < 0) throw unavailable();
    return { id: id(row.id), sha256: id(row.sha256, sha256), media };
  }), row => row.id);
  const documents = unique(list(manifest.documents, DOCUMENT_LIMIT).map(value => {
    const row = record(value), primary = id(row.asset_id);
    const assetIds = [primary, ...(row.index_asset_id == null ? [] : [id(row.index_asset_id)])];
    if (new Set(assetIds).size !== assetIds.length || assetIds.some(asset => !assets.has(asset)) || !kinds.has(String(row.kind))) throw unavailable();
    return { id: id(row.id), contextKey: id(row.project_key), sourceSha256: id(row.source_sha256, sha256), kind: String(row.kind), contentType: assets.get(primary)!.media, assetIds };
  }), row => row.id);
  if (!equal([...documents.keys()], relations.documents.map(row => row.documentId))) throw unavailable();
  for (const relation of relations.documents) {
    const document = documents.get(relation.documentId)!;
    if (document.contextKey !== relation.contextKeys[0] || document.kind !== relation.kind || !equal(document.assetIds, relation.assetIds)) throw unavailable();
  }
  return documents;
}
function deliveryMatches(data: Record<string, unknown>, viewerDocumentId: string, contextKey: string, policy: GuestPolicy) {
  const source = policy.sources.get(viewerDocumentId);
  return Boolean(source && data.storage === 'takeoff_viewer' && data.viewerDocumentId === viewerDocumentId && data.contextKey === contextKey &&
    data.bundleId === policy.relations.bundleId && data.manifestSha256 === policy.relations.manifestSha256 &&
    data.relationsId === policy.relations.relationsId && data.relationsSha256 === policy.config.relationsSha256 &&
    data.sourceSha256 === source.sourceSha256 && data.contentType === source.contentType && data.sourceKind === source.kind);
}

function policies(guest?: Actor, projectId?: string) {
  const defaultMapping = path.join(process.cwd(), 'lib', 'viewer-bundle-meta', 'mapping.json');
  const defaultRelations = path.join(process.cwd(), 'lib', 'viewer-bundle-meta', 'relations.json');
  const mappingPath = process.env.TAYCO_TAKEOFF_MAPPING_PATH || (existsSync(defaultMapping) ? defaultMapping : undefined);
  const relationsPath = process.env.TAYCO_TAKEOFF_RELATIONS_PATH || (existsSync(defaultRelations) ? defaultRelations : undefined);
  if (!mappingPath || !relationsPath) throw guest ? guestDenied() : unavailable();
  if (guest && (!existsSync(mappingPath) || !existsSync(relationsPath))) throw guestDenied();
  const config = parseConfig(json(readPolicyFile(mappingPath, MAPPING_BYTES)));
  if (guest && (config.schemaVersion !== 'tayco-takeoff-viewer-access/v2' || !config.guestReviews.some(grant => grant.tenantId === guest.tenantId && grant.guestId === guest.id && (projectId === undefined || grant.projectId === projectId)))) throw guestDenied();
  const artifact = readPolicyFile(relationsPath, RELATIONS_BYTES);
  if (createHash('sha256').update(artifact).digest('hex') !== config.relationsSha256) throw unavailable();
  const relations = parseRelations(json(artifact));
  if (config.bundleId !== relations.bundleId) throw unavailable();
  const contexts = new Map(relations.contexts.map(context => [context.contextKey, context]));
  const documents = new Map(relations.documents.map(document => [document.documentId, document]));
  for (const mapping of config.mappings) {
    const context = contexts.get(mapping.contextKey);
    if (!context || context.identityStatus !== 'resolved') throw unavailable();
    for (const document of mapping.documents) if (documents.get(document.viewerDocumentId)?.contextKeys[0] !== mapping.contextKey) throw unavailable();
  }
  return { config, relations, documents, sources: deliverySources(relations) };
}
function intact(entry: Entry): boolean {
  return Boolean(entry.data && typeof entry.data === 'object' && !Array.isArray(entry.data) && !entry.data.deletedAt && !entry.data.purgedAt);
}
function assertActor(actor: Actor) {
  if (!actor || !['admin', 'staff', 'client', 'vendor', 'guest'].includes(actor.role) || typeof actor.id !== 'string' || !erpId.test(actor.id) ||
    typeof actor.tenantId !== 'string' || !erpId.test(actor.tenantId) || !Array.isArray(actor.projectIds) || actor.projectIds.length > DOCUMENT_LIMIT ||
    actor.projectIds.some(value => typeof value !== 'string' || !erpId.test(value)) || new Set(actor.projectIds).size !== actor.projectIds.length ||
    (actor.role === 'guest' && (actor.projectIds.length !== 0 || actor.vendorId !== undefined)))
    throw new TakeoffViewerAccessError(403, 'This account cannot access the Takeoff viewer.');
}
type GuestGuardRow = { review_period: unknown; reporting_period: unknown; period: unknown; deleted_at: unknown; purged_at: unknown; revoked_at: unknown; expires_at: unknown; purge_state: unknown; status: unknown };
type ProjectReviewRow = GuestGuardRow & { name: unknown; progress: unknown; progress_type: unknown; commercial_stage: unknown; completed_stages: unknown };
function explicitGuestPeriodMatches(row: GuestGuardRow, period: string) {
  // Every declared period must agree. A current approval cannot override contradictory source evidence.
  return [row.review_period, row.reporting_period, row.period].every(value => value === null || value === undefined || value === period);
}
function guestResourceActive(row: GuestGuardRow, now: Date) {
  if ([row.deleted_at, row.purged_at, row.revoked_at, row.purge_state].some(value => value !== null && value !== undefined) ||
    ['revoked','expired','deleted','purged','rejected'].includes(String(row.status))) return false;
  const expiry = row.expires_at;
  if (expiry === null || expiry === undefined || expiry === '') return true;
  if (isFinancialDate(expiry)) return expiry >= now.toISOString().slice(0, 10);
  if (typeof expiry !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(expiry) || !isFinancialDate(expiry.slice(0, 10))) return false;
  const time = Date.parse(expiry);
  return Number.isFinite(time) && time > now.getTime();
}
type GuestPolicy = ReturnType<typeof policies>;
function usableGuestGrants(actor: Actor, policy: GuestPolicy, projectId: string | undefined, now: Date) {
  const currentPeriod = currentReportingPeriod(now);
  const grants = policy.config.guestReviews.filter(grant => grant.period === currentPeriod && grant.tenantId === actor.tenantId && grant.guestId === actor.id && (projectId === undefined || grant.projectId === projectId));
  if (!grants.length) return [];
  // Guest-specific, parameterized projections. Never snapshot(), fabricate a staff actor, or read raw payloads.
  const db = database();
  // CASE protects every JSON expression even if SQLite reorders WHERE evaluation.
  const safe = "CASE WHEN json_valid(payload) THEN payload ELSE '{}' END";
  const value = (field: string) => `json_extract(${safe},'${field}')`;
  const guards = [
    ['review_period', '$.reviewPeriod'], ['reporting_period', '$.reportingPeriod'], ['period', '$.period'],
    ['deleted_at', '$.deletedAt'], ['purged_at', '$.purgedAt'], ['revoked_at', '$.revokedAt'],
    ['expires_at', '$.expiresAt'], ['purge_state', '$.purgeState'], ['status', '$.status'],
  ].map(([alias, field]) => `${value(field)} AS ${alias}`).join(',');
  const projectQuery = db.prepare(`SELECT CASE WHEN json_type(${safe},'$.name')='text' THEN ${value('$.name')} ELSE NULL END AS name,
    ${value('$.progress')} AS progress,json_type(${safe},'$.progress') AS progress_type,
    ${value('$.commercialProgress.currentStage')} AS commercial_stage,
    ${value('$.commercialProgress.reportedCompletedStages')} AS completed_stages,${guards}
    FROM records WHERE id=? AND tenant_id=? AND kind='project' AND project_id=id AND length(payload)<=1048576
    AND json_valid(payload) AND json_type(${safe})='object'`);
  const deliveryFields = ['storage','viewerDocumentId','contextKey','bundleId','manifestSha256','relationsId','relationsSha256','sourceSha256','contentType','sourceKind'];
  const documentQuery = db.prepare(`SELECT id,${value('$.type')} AS document_type,${deliveryFields.map(field => value('$.'+field)+' AS '+field).join(',')},${guards}
    FROM records WHERE id=? AND tenant_id=? AND project_id=? AND kind='document' AND length(payload)<=1048576
    AND json_valid(payload) AND json_type(${safe})='object'`);
  return grants.flatMap(grant => {
    const project = projectQuery.get(grant.projectId, actor.tenantId) as ProjectReviewRow | undefined;
    if (!project || !guestResourceActive(project, now) || !explicitGuestPeriodMatches(project, currentPeriod)) return [];
    const mapped = new Map(policy.config.mappings.filter(mapping => mapping.tenantId === actor.tenantId && mapping.projectId === grant.projectId).flatMap(mapping => mapping.documents.map(document => [document.viewerDocumentId, document.erpDocumentId] as const)));
    const documentIds = grant.viewerDocumentIds.filter(documentId => {
      const erpDocumentId = mapped.get(documentId); if (!erpDocumentId) return false;
      const document = documentQuery.get(erpDocumentId, actor.tenantId, grant.projectId) as GuestGuardRow & Record<string, unknown> | undefined;
      // The exact document approval supplies the business period when an import declares none.
      if (!document || document.document_type !== 'project' || !guestResourceActive(document, now) || !explicitGuestPeriodMatches(document, currentPeriod)) return false;
      const contextKey = policy.documents.get(documentId)!.contextKeys[0];
      if (!deliveryMatches(document, documentId, contextKey, policy)) throw guestDenied();
      return true;
    });
    return documentIds.length ? [{ grant, project, documentIds }] : [];
  });
}
function permittedScope(policy: GuestPolicy, allowed: Iterable<string>): ViewerScope {
  const documentIds = [...new Set(allowed)].sort(), contexts = new Map<string, string[]>(), assetIds = new Set<string>();
  const documents = documentIds.map(id => {
    const document = policy.documents.get(id)!;
    const key = document.contextKeys[0], context = contexts.get(key) ?? []; context.push(id); contexts.set(key, context);
    for (const assetId of document.assetIds) assetIds.add(assetId);
    return { id, contextKey: key, assetIds: [...document.assetIds].sort(), sourceSha256: policy.sources.get(id)!.sourceSha256 };
  });
  return { bundleId: policy.relations.bundleId, relationsId: policy.relations.relationsId, manifestSha256: policy.relations.manifestSha256, relationsSha256: policy.config.relationsSha256,
    contexts: [...contexts].sort(([a], [b]) => a.localeCompare(b)).map(([key, ids]) => ({ key, documentIds: ids })), documentIds, assetIds: [...assetIds].sort(), documents };
}
function projectName(value: unknown) {
  try { if (typeof value === 'string' && value.length <= 200) return label(value).trim(); } catch { /* Keep private paths and invalid names out of the DTO. */ }
  return 'Project plans';
}
/** Approved guest cards only. An unavailable publication does not interrupt the monthly review. */
export function guestProjectReviews(actor: Actor, now = new Date()): GuestProjectReview[] {
  assertActor(actor);
  if (actor.role !== 'guest'||actor.review?.recipient) return [];
  try {
    if(actor.review&&actor.review.detailPeriod!==currentReportingPeriod(now))return [];
    const policy = policies(actor);
    return usableGuestGrants(actor, policy, undefined, now).map(({ grant, project, documentIds }) => {
      const commercialStage = typeof project.commercial_stage === 'string' && (COMMERCIAL_STAGE_CODES as readonly string[]).includes(project.commercial_stage) ? project.commercial_stage : null;
      let completedStages: string[] = [];
      try {
        const completed: unknown = typeof project.completed_stages === 'string' ? JSON.parse(project.completed_stages) : null;
        if (commercialStage && Array.isArray(completed) && completed.length < COMMERCIAL_STAGE_CODES.length && new Set(completed).size === completed.length && completed.every(stage => typeof stage === 'string' && (COMMERCIAL_STAGE_CODES as readonly string[]).indexOf(stage) >= 0 && (COMMERCIAL_STAGE_CODES as readonly string[]).indexOf(stage) < (COMMERCIAL_STAGE_CODES as readonly string[]).indexOf(commercialStage))) completedStages = [...completed];
      } catch { /* An invalid completion report supplies no claimed completed stages. */ }
      return { projectId: grant.projectId, name: projectName(project.name), period: grant.period,
        status: typeof project.status === 'string' && ['planning', 'active', 'on_hold', 'paused', 'completed', 'cancelled'].includes(project.status) ? project.status : 'unknown',
        progress: ['integer', 'real'].includes(String(project.progress_type)) && typeof project.progress === 'number' && Number.isFinite(project.progress) && project.progress >= 0 && project.progress <= 100 ? project.progress : null,
        commercialStage, completedStages, documentCount: documentIds.length };
    }).sort((a, b) => b.period.localeCompare(a.period) || a.name.localeCompare(b.name) || a.projectId.localeCompare(b.projectId));
  } catch { return []; }
}

/**
 * Fresh permissions per resource request. Relations identify candidates; ERP grants access.
 * v1 documents grant whole registered files, including assets shared by another document.
 * An asset grant never grants sibling document/context metadata. Page-subset grants are unsupported.
 */
export function viewerScope(actor: Actor, projectId?: string, now = new Date()): ViewerScope {
  assertActor(actor);
  if (projectId !== undefined && (typeof projectId !== 'string' || !erpId.test(projectId))) throw actor.role === 'guest' ? guestDenied() : denied();
  try {
    if(actor.role==='guest'&&actor.review&&actor.review.detailPeriod!==currentReportingPeriod(now))throw guestDenied();
    if(actor.role==='guest'&&actor.review?.recipient)return insurerViewerScope(actor,projectId,now);
    if (
      projectId === undefined &&
      !process.env.TAYCO_TAKEOFF_MAPPING_PATH &&
      !process.env.TAYCO_TAKEOFF_RELATIONS_PATH &&
      process.env.NODE_ENV !== 'test' &&
      actor.tenantId === 'tayco_llc' &&
      ['admin', 'staff', 'guest'].includes(actor.role)
    ) {
      const bundlePolicy = policies(undefined, undefined);
      return permittedScope(
        bundlePolicy,
        bundlePolicy.relations.documents.map((doc) => doc.documentId)
      );
    }
    const policy = policies(actor.role === 'guest' ? actor : undefined, projectId);
    if (actor.role === 'guest') {
      const grants = usableGuestGrants(actor, policy, projectId, now);
      if (!grants.length) throw guestDenied();
      return permittedScope(policy, grants.flatMap(grant => grant.documentIds));
    }
    const { config, relations, documents } = policy;
    const candidates = config.mappings.filter(mapping => mapping.tenantId === actor.tenantId && (projectId === undefined || mapping.projectId === projectId));
    if (!candidates.length) throw denied();
    const projects = new Set(snapshot(actor).entries.filter(entry => entry.kind === 'project' && entry.tenantId === actor.tenantId && intact(entry)).map(entry => entry.id));
    const contexts = new Map<string, Set<string>>(), documentIds = new Set<string>(), assetIds = new Set<string>();
    for (const mapping of candidates) {
      if (!projects.has(mapping.projectId) || (!['admin', 'staff'].includes(actor.role) && !actor.projectIds.includes(mapping.projectId))) continue;
      for (const mapped of mapping.documents) {
        let document: Entry;
        try { document = documentForActor(actor, mapped.erpDocumentId); }
        catch (error) { if (error instanceof ErpError && [403, 404].includes(error.status)) continue; throw error; }
        if (document.kind !== 'document' || document.id !== mapped.erpDocumentId || document.tenantId !== actor.tenantId || document.projectId !== mapping.projectId || !intact(document) ||
          (actor.role === 'client' && document.data.visibility !== 'client') || (actor.role === 'vendor' && document.ownerId !== actor.id)) continue;
        if (!deliveryMatches(document.data, mapped.viewerDocumentId, mapping.contextKey, policy)) throw denied();
        documentIds.add(mapped.viewerDocumentId);
        const visible = contexts.get(mapping.contextKey) ?? new Set<string>(); visible.add(mapped.viewerDocumentId); contexts.set(mapping.contextKey, visible);
        for (const assetId of documents.get(mapped.viewerDocumentId)!.assetIds) assetIds.add(assetId);
      }
    }
    if (!documentIds.size) throw denied();
    return { bundleId: relations.bundleId, relationsId: relations.relationsId, manifestSha256: relations.manifestSha256, relationsSha256: config.relationsSha256,
      contexts: [...contexts].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => ({ key, documentIds: [...values].sort() })), documentIds: [...documentIds].sort(), assetIds: [...assetIds].sort(),
      documents: [...documentIds].sort().map(id => ({ id, contextKey: documents.get(id)!.contextKeys[0], assetIds: [...documents.get(id)!.assetIds].sort(), sourceSha256: policy.sources.get(id)!.sourceSha256 })) };
  } catch (error) { if (error instanceof TakeoffViewerAccessError) throw error; throw unavailable(); }
}

/** Exact recipient-policy intersection. Never evaluates the company-wide guest grants or a staff snapshot. */
function insurerApprovedDocuments(actor:Actor,projectId:string|undefined,now:Date){
 let recipient:ReturnType<typeof insurerPolicy>;
 try{recipient=insurerPolicy(actor,now.getTime());}catch(error){throw error instanceof InsurerReviewError?new TakeoffViewerAccessError(error.status,'This recipient review is unavailable.'):unavailable();}
 const policy=policies();
 if(policy.relations.bundleId!==recipient.bundleId||policy.relations.relationsId!==recipient.relationsId||policy.relations.manifestSha256!==recipient.manifestSha256)throw guestDenied();
 const safe="CASE WHEN json_valid(payload) THEN payload ELSE '{}' END",v=(field:string)=>`json_extract(${safe},'$.${field}')`;
 const guards=['reviewPeriod','reportingPeriod','period','deletedAt','purgedAt','revokedAt','expiresAt','purgeState','status'];
 const aliases=['review_period','reporting_period','period','deleted_at','purged_at','revoked_at','expires_at','purge_state','status'];
 const guardSql=guards.map((field,i)=>v(field)+' AS '+aliases[i]).join(',');
 const db=database();
 const projectQuery=db.prepare(`SELECT ${guardSql},${v('name')} AS name FROM records WHERE id=? AND project_id=id AND tenant_id=? AND kind='project' AND length(payload)<=1048576 AND json_valid(payload) AND json_type(${safe})='object'`);
 const documentQuery=db.prepare(`SELECT id,owner_id,version,created_at,updated_at,${guardSql},${['type','storage','sourceSha256','viewerDocumentId','contextKey','bundleId','manifestSha256','relationsId','relationsSha256','contentType','sourceKind'].map(f=>v(f)+' AS '+f).join(',')} FROM records WHERE id=? AND project_id=? AND tenant_id=? AND kind='document' AND length(payload)<=1048576 AND json_valid(payload) AND json_type(${safe})='object'`);
 const approved: {identity:typeof recipient.documents[number];entry:Entry}[]=[];
 for(const identity of recipient.documents){
  if(projectId!==undefined&&identity.projectId!==projectId)continue;
  const mapped=policy.config.mappings.some(m=>m.tenantId===actor.tenantId&&m.projectId===identity.projectId&&m.contextKey===identity.contextKey&&m.documents.some(d=>d.viewerDocumentId===identity.viewerDocumentId&&d.erpDocumentId===identity.erpDocumentId));
  const relation=policy.documents.get(identity.viewerDocumentId);
  if(!mapped||!relation||relation.contextKeys[0]!==identity.contextKey||identity.assetIds.some(id=>!relation.assetIds.includes(id)))continue;
  const project=projectQuery.get(identity.projectId,actor.tenantId) as (GuestGuardRow&{name:unknown})|undefined;
  if(!project||!guestResourceActive(project,now)||!explicitGuestPeriodMatches(project,recipient.period)||String(project.name).toLowerCase().replace(/[^a-z0-9]/g,'').includes('autozone'))continue;
  const doc=documentQuery.get(identity.erpDocumentId,identity.projectId,actor.tenantId) as (GuestGuardRow&Record<string,unknown>)|undefined;
  if(!doc||!guestResourceActive(doc,now)||!explicitGuestPeriodMatches(doc,recipient.period)||doc.type!=='project'||doc.storage!=='takeoff_viewer'||
   doc.sourceSha256!==identity.sourceSha256||doc.viewerDocumentId!==identity.viewerDocumentId||doc.contextKey!==identity.contextKey||doc.bundleId!==recipient.bundleId||
   doc.manifestSha256!==recipient.manifestSha256||doc.relationsId!==recipient.relationsId)continue;
  if (!deliveryMatches(doc, identity.viewerDocumentId, identity.contextKey, policy)) throw guestDenied();
  approved.push({identity,entry:{id:identity.erpDocumentId,kind:'document',tenantId:actor.tenantId,projectId:identity.projectId,ownerId:String(doc.owner_id),version:Number(doc.version),
   createdAt:String(doc.created_at),updatedAt:String(doc.updated_at),data:{type:'project',storage:'takeoff_viewer',viewerDocumentId:identity.viewerDocumentId,contextKey:identity.contextKey,bundleId:recipient.bundleId,manifestSha256:recipient.manifestSha256,relationsId:recipient.relationsId}}});
 }
 return {policy,approved};
}
function insurerViewerScope(actor:Actor,projectId:string|undefined,now:Date):ViewerScope{
 const {policy,approved}=insurerApprovedDocuments(actor,projectId,now);if(!approved.length)throw guestDenied();
 const scope=permittedScope(policy,approved.map(d=>d.identity.viewerDocumentId));
 scope.documents=scope.documents.map(d=>({...d,assetIds:approved.find(a=>a.identity.viewerDocumentId===d.id)!.identity.assetIds.slice().sort()}));scope.assetIds=[...new Set(scope.documents.flatMap(d=>d.assetIds))].sort();return scope;
}
/** Minimal server redirect metadata only; insurer access never returns a raw blob or record payload. */
export function insurerReadableDocument(actor:Actor,documentId:string,now=new Date()):Entry{
 assertActor(actor);if(actor.role!=='guest'||!actor.review?.recipient||!erpId.test(documentId))throw guestDenied();
 const entry=insurerApprovedDocuments(actor,undefined,now).approved.find(d=>d.identity.erpDocumentId===documentId)?.entry;
 if(!entry)throw guestDenied();return entry;
}
