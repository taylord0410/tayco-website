import { createHash, randomUUID } from 'node:crypto';
import { closeSync, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import type { Actor } from './auth';
import { database, type Entry } from './erp';
import type { DatabaseSync } from 'node:sqlite';

export class TakeoffSourceRegistrationError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'TakeoffSourceRegistrationError'; }
}
export type TakeoffSourceRegistrationInput = {
  expectedBundleId: string; expectedRelationsId: string; expectedRelationsSha256: string; expectedManifestSha256: string;
  contextKey: string; viewerDocumentIds: string[]; visibility: 'owner' | 'client';
  project: { mode: 'create' } | { mode: 'existing'; id: string; expectedVersion: number };
};
type SourceIdentity = { bundleId: string; relationsId: string; relationsSha256: string; manifestSha256: string; contextKey: string };
export type TakeoffSourceRegistrationPlan = {
  planHash: string; source: SourceIdentity;
  project: { id: string; name: string; action: 'create' | 'unchanged' | 'existing'; version: number };
  documents: { id: string; viewerDocumentId: string; name: string; contentType: string; sourceSha256: string; action: 'create' | 'unchanged'; version: number }[];
  mapping: { tenantId: string; projectId: string; contextKey: string; documents: { viewerDocumentId: string; erpDocumentId: string }[] };
};
export type TakeoffSourceRegistrationResult = { planHash: string; projectId: string; projectCreated: boolean; documents: { id: string; viewerDocumentId: string; created: boolean; version: number }[]; source: SourceIdentity };
export type TakeoffSourceRegistrationControl = { bundleId: string; relationsId: string; relationsSha256: string; manifestSha256: string; contexts: { contextKey: string; displayName: string; documents: { viewerDocumentId: string; title: string }[] }[] };
type SourceDocument = { id: string; context: string; title: string; sourceName: string; sourceSha256: string; kind: string; assetIds: string[]; contentType: string; pageCount: number | null };
type Source = { identity: SourceIdentity; name: string; documents: SourceDocument[] };
type Row = { id: string; kind: string; tenant_id: string; project_id: string; owner_id: string; payload: string; version: number; created_at: string; updated_at: string };
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/, ERP_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/, SHA = /^[a-f0-9]{64}$/;
const KINDS = ['drawing_pdf', 'drawing_image', 'itb', 'specification', 'addendum', 'reference', 'processed_docx'];
const MEDIA = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/json', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const error = (status: number, message: string): never => { throw new TakeoffSourceRegistrationError(status, message); };
const badInput = () => error(422, 'Check the explicit Takeoff source registration fields and pins.');
const badSource = () => error(503, 'The configured Takeoff registration source is unavailable or invalid.');
const conflict = () => error(409, 'The Takeoff registration source or destination changed. Refresh and review the import plan.');
const digest = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');
function admin(actor: Actor) {
  if (!actor || actor.role !== 'admin' || typeof actor.id !== 'string' || !ERP_ID.test(actor.id) || typeof actor.tenantId !== 'string' || !ERP_ID.test(actor.tenantId)) error(403, 'Only a TAYCO administrator can register Takeoff sources.');
}
function object(value: unknown, keys?: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError('Invalid object');
  const result = value as Record<string, unknown>;
  if (keys && (Reflect.ownKeys(result).length !== keys.length || Reflect.ownKeys(result).some(key => typeof key !== 'string' || !keys.includes(key)))) throw new TypeError('Invalid fields');
  return result;
}
function identifier(value: unknown, pattern = ID) { if (typeof value !== 'string' || !pattern.test(value)) throw new TypeError('Invalid identifier'); return value; }
function text(value: unknown, max = 500) {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f-\u009f]/.test(value) || /(?:^|[^A-Za-z0-9])[A-Za-z]:[\\/]/.test(value) || /^[\\/]/.test(value) || /(?:^|\s)\/(?:[^/\s]+\/)+[^/\s]+/.test(value)) throw new TypeError('Invalid label');
  return value.trim();
}
function list(value: unknown, max: number, min = 0) { if (!Array.isArray(value) || value.length < min || value.length > max) throw new TypeError('Invalid list'); return value as unknown[]; }
function identifiers(value: unknown, max: number, min = 0) {
  const values = list(value, max, min).map(value => identifier(value)); if (new Set(values).size !== values.length) throw new TypeError('Duplicate references'); return values;
}
function index<T>(values: T[], key: (value: T) => string) {
  const result = new Map<string, T>(); for (const value of values) { const id = key(value); if (result.has(id)) throw new TypeError('Duplicate identity'); result.set(id, value); } return result;
}
function equalIds(a: string[], b: string[]) { return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort()); }
function inputOf(value: unknown): TakeoffSourceRegistrationInput {
  try {
    const row = object(value, ['expectedBundleId', 'expectedRelationsId', 'expectedRelationsSha256', 'expectedManifestSha256', 'contextKey', 'viewerDocumentIds', 'visibility', 'project']);
    const project = object(row.project), mode = project.mode;
    let selection: TakeoffSourceRegistrationInput['project'];
    if (mode === 'create') { object(project, ['mode']); selection = { mode }; }
    else if (mode === 'existing') {
      object(project, ['mode', 'id', 'expectedVersion']);
      if (!Number.isSafeInteger(project.expectedVersion) || Number(project.expectedVersion) < 1) throw new TypeError('Invalid version');
      selection = { mode, id: identifier(project.id, ERP_ID), expectedVersion: project.expectedVersion as number };
    } else throw new TypeError('Invalid destination');
    if (!['owner', 'client'].includes(String(row.visibility))) throw new TypeError('Invalid visibility');
    return { expectedBundleId: identifier(row.expectedBundleId), expectedRelationsId: identifier(row.expectedRelationsId, /^relations-[a-f0-9]{64}$/), expectedRelationsSha256: identifier(row.expectedRelationsSha256, SHA), expectedManifestSha256: identifier(row.expectedManifestSha256, SHA), contextKey: identifier(row.contextKey), viewerDocumentIds: identifiers(row.viewerDocumentIds, 256, 1).sort(), visibility: row.visibility as 'owner' | 'client', project: selection };
  } catch { return badInput(); }
}
function bytes(filename: string | undefined, max: number) {
  let fd: number | undefined;
  try {
    if (!filename || lstatSync(filename).isSymbolicLink()) return badSource();
    fd = openSync(filename, 'r'); const stat = fstatSync(fd);
    if (!stat.isFile() || stat.size < 1 || stat.size > max) return badSource();
    const data = Buffer.alloc(stat.size + 1); let count = 0;
    while (count < data.length) { const n = readSync(fd, data, count, data.length - count, count); if (!n) break; count += n; }
    if (count !== stat.size || fstatSync(fd).size !== stat.size) return badSource();
    return data.subarray(0, count);
  } catch { return badSource(); } finally { if (fd !== undefined) closeSync(fd); }
}
function json(value: Buffer) { return object(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(value))); }
function sourceOf(input: TakeoffSourceRegistrationInput): Source {
  const relationBytes = bytes(process.env.TAYCO_TAKEOFF_RELATIONS_PATH, 5 * 1024 * 1024), manifestBytes = bytes(process.env.TAYCO_TAKEOFF_MANIFEST_PATH, 10 * 1024 * 1024);
  if (digest(relationBytes) !== input.expectedRelationsSha256 || digest(manifestBytes) !== input.expectedManifestSha256) return conflict();
  try {
    const relations = object(json(relationBytes), ['schemaVersion', 'bundleId', 'relationsId', 'manifestSha256', 'contexts', 'documents', 'assets']);
    const manifest = json(manifestBytes);
    if (relations.schemaVersion !== 'takeoff-viewer-relations/v1' || manifest.schema_version !== 'takeoff-viewer-bundle/v1') throw new TypeError('Unsupported schema');
    if (relations.bundleId !== input.expectedBundleId || manifest.bundle_id !== input.expectedBundleId || relations.relationsId !== input.expectedRelationsId || relations.manifestSha256 !== input.expectedManifestSha256) return conflict();
    const contexts = index(list(relations.contexts, 512).map(value => {
      const row = object(value, ['contextKey', 'displayName', 'identityStatus', 'documentIds']);
      if (row.identityStatus !== 'resolved' && row.identityStatus !== 'unresolved') throw new TypeError('Invalid identity');
      return { id: identifier(row.contextKey), name: text(row.displayName), status: row.identityStatus, documentIds: identifiers(row.documentIds, 4096) };
    }), row => row.id);
    const relatedDocuments = index(list(relations.documents, 4096).map(value => {
      const row = object(value, ['documentId', 'contextKeys', 'assetIds', 'kind']);
      if (!KINDS.includes(String(row.kind))) throw new TypeError('Invalid kind');
      return { id: identifier(row.documentId), context: identifiers(row.contextKeys, 1, 1)[0], assetIds: identifiers(row.assetIds, 2, 1), kind: row.kind };
    }), row => row.id);
    const relatedAssets = index(list(relations.assets, 8192).map(value => { const row = object(value, ['assetId', 'documentIds']); return { id: identifier(row.assetId), documentIds: identifiers(row.documentIds, 4096, 1) }; }), row => row.id);
    const projects = index(list(manifest.projects, 512).map(value => {
      const row = object(value); if (row.identity_status !== 'resolved' && row.identity_status !== 'unresolved') throw new TypeError('Invalid identity');
      return { id: identifier(row.key), name: text(row.display_name), status: row.identity_status, documentIds: identifiers(row.document_ids, 4096) };
    }), row => row.id);
    const assets = index(list(manifest.assets, 8192).map(value => {
      const row = object(value), assetPath = row.path;
      if (typeof assetPath !== 'string' || assetPath.length > 500 || !assetPath || /^[\\/]/.test(assetPath) || /[\\%?#:\u0000-\u001f]/.test(assetPath) || assetPath.split('/').some(part => !part || part === '.' || part === '..') || !MEDIA.includes(String(row.media_type)) || !Number.isSafeInteger(row.size_bytes) || Number(row.size_bytes) < 0) throw new TypeError('Invalid asset');
      return { id: identifier(row.id), media: row.media_type as string, sha: identifier(row.sha256, SHA) };
    }), row => row.id);
    const documents = index(list(manifest.documents, 4096).map((value): SourceDocument => {
      const row = object(value), primaryId = identifier(row.asset_id), primary = assets.get(primaryId), pageCount = row.page_count ?? null;
      if (!primary || !KINDS.includes(String(row.kind)) || (pageCount !== null && (!Number.isSafeInteger(pageCount) || Number(pageCount) < 0))) throw new TypeError('Invalid document');
      const assetIds = [primaryId, ...(row.index_asset_id === undefined || row.index_asset_id === null ? [] : [identifier(row.index_asset_id)])];
      if (assetIds.some(id => !assets.has(id)) || new Set(assetIds).size !== assetIds.length) throw new TypeError('Invalid document assets');
      return { id: identifier(row.id), context: identifier(row.project_key), title: text(row.title), sourceName: text(row.source_name), sourceSha256: identifier(row.source_sha256, SHA), kind: row.kind as string, assetIds, contentType: primary.media, pageCount: pageCount as number | null };
    }), row => row.id);
    if (!equalIds([...contexts.keys()], [...projects.keys()]) || !equalIds([...documents.keys()], [...relatedDocuments.keys()])) throw new TypeError('Inconsistent catalog');
    for (const context of contexts.values()) {
      const project = projects.get(context.id)!;
      if (project.name !== context.name || project.status !== context.status || !equalIds(project.documentIds, context.documentIds)) throw new TypeError('Inconsistent context');
      for (const id of context.documentIds) if (documents.get(id)?.context !== context.id || relatedDocuments.get(id)?.context !== context.id) throw new TypeError('Wrong document owner');
    }
    const linkedAssets = new Map<string, string[]>();
    for (const document of documents.values()) {
      const related = relatedDocuments.get(document.id)!;
      if (!contexts.get(document.context)?.documentIds.includes(document.id) || related.kind !== document.kind || related.context !== document.context || !equalIds(related.assetIds, document.assetIds)) throw new TypeError('Inconsistent document');
      for (const asset of document.assetIds) { const refs = linkedAssets.get(asset) ?? []; refs.push(document.id); linkedAssets.set(asset, refs); }
    }
    if (!equalIds([...linkedAssets.keys()], [...relatedAssets.keys()])) throw new TypeError('Inconsistent assets');
    for (const [asset, refs] of linkedAssets) if (!equalIds(refs, relatedAssets.get(asset)!.documentIds)) throw new TypeError('Inconsistent asset references');
    const selected = contexts.get(input.contextKey);
    if (!selected || selected.status !== 'resolved' || input.viewerDocumentIds.some(id => !selected.documentIds.includes(id))) return conflict();
    return { identity: { bundleId: input.expectedBundleId, relationsId: input.expectedRelationsId, relationsSha256: input.expectedRelationsSha256, manifestSha256: input.expectedManifestSha256, contextKey: input.contextKey }, name: text(selected.name, 200), documents: input.viewerDocumentIds.map(id => documents.get(id)!) };
  } catch (cause) { if (cause instanceof TakeoffSourceRegistrationError) throw cause; return badSource(); }
}
function entry(row: Row): Entry {
  const data = object(JSON.parse(row.payload));
  if (!Number.isSafeInteger(row.version) || row.version < 1) return conflict();
  return { id: row.id, kind: row.kind as Entry['kind'], tenantId: row.tenant_id, projectId: row.project_id, ownerId: row.owner_id, version: row.version, data, createdAt: row.created_at, updatedAt: row.updated_at };
}
function get(db: DatabaseSync, id: string, tenantId: string) {
  const row = db.prepare('SELECT * FROM records WHERE id=? AND tenant_id=?').get(id, tenantId) as Row | undefined;
  if (!row && db.prepare('SELECT 1 FROM records WHERE id=?').get(id)) return conflict();
  return row ? entry(row) : null;
}
const intact = (item: Entry) => !item.data.deletedAt && !item.data.purgedAt && !item.data.purgeState;
function projectData(source: Source) { return { name: source.name, status: 'planning', progress: null, budgetUsd: null, budgetSource: '', budgetApprovedOn: '', plannedStart: null, plannedEnd: null, source: 'takeoff_source_registration', sourceBundleId: source.identity.bundleId, sourceContextKey: source.identity.contextKey, sourceManifestSha256: source.identity.manifestSha256, sourceRelationsSha256: source.identity.relationsSha256, sourceRelationsId: source.identity.relationsId }; }
function documentData(source: Source, document: SourceDocument, input: TakeoffSourceRegistrationInput) {
  return { storage: 'takeoff_viewer', viewerDocumentId: document.id, ...source.identity, sourceSha256: document.sourceSha256, name: document.title, sourceName: document.sourceName, contentType: document.contentType, type: 'project', status: 'approved', visibility: input.visibility, expiresAt: null, pageCount: document.pageCount, sourceKind: document.kind, source: 'takeoff_source_registration' };
}
function sameFields(actual: Record<string, unknown>, desired: Record<string, unknown>) { return Object.entries(desired).every(([key, value]) => actual[key] === value); }
function buildPlan(actor: Actor, input: TakeoffSourceRegistrationInput, source: Source, db: DatabaseSync): TakeoffSourceRegistrationPlan {
  const projectId = input.project.mode === 'existing' ? input.project.id : 'takeoff-project-' + digest(JSON.stringify([actor.tenantId, source.identity.bundleId, source.identity.contextKey]));
  const project = get(db, projectId, actor.tenantId);
  if (input.project.mode === 'existing') {
    if (!project || project.kind !== 'project' || project.tenantId !== actor.tenantId || !intact(project) || project.version !== input.project.expectedVersion) return conflict();
  } else if (project && (project.kind !== 'project' || project.tenantId !== actor.tenantId || project.projectId !== projectId || !intact(project) || !sameFields(project.data, { source: 'takeoff_source_registration', sourceBundleId: source.identity.bundleId, sourceContextKey: source.identity.contextKey, sourceManifestSha256: source.identity.manifestSha256, sourceRelationsSha256: source.identity.relationsSha256, sourceRelationsId: source.identity.relationsId }))) return conflict();
  const documents = source.documents.map(document => {
    const id = 'takeoff-document-' + digest(JSON.stringify([actor.tenantId, projectId, source.identity.bundleId, document.id]));
    const current = get(db, id, actor.tenantId);
    const aliases = db.prepare("SELECT id FROM records WHERE tenant_id=? AND kind='document' AND json_valid(payload) AND json_extract(payload,'$.storage')='takeoff_viewer' AND json_extract(payload,'$.bundleId')=? AND json_extract(payload,'$.viewerDocumentId')=?").all(actor.tenantId, source.identity.bundleId, document.id) as { id: string }[];
    if (aliases.some(row => row.id !== id) || (current && (current.kind !== 'document' || current.tenantId !== actor.tenantId || current.projectId !== projectId || !intact(current) || Object.hasOwn(current.data, 'blobPath') || !sameFields(current.data, documentData(source, document, input))))) return conflict();
    return { id, viewerDocumentId: document.id, name: document.title, contentType: document.contentType, sourceSha256: document.sourceSha256, action: current ? 'unchanged' as const : 'create' as const, version: current?.version ?? 0 };
  });
  // Hash the approved desired state, so a completed identical import is a safe semantic no-op.
  const planHash = digest(JSON.stringify({ tenantId: actor.tenantId, input, projectId, documents: documents.map(({ id, viewerDocumentId, sourceSha256 }) => ({ id, viewerDocumentId, sourceSha256 })) }));
  return { planHash, source: { ...source.identity }, project: { id: projectId, name: project ? text(project.data.name, 200) : source.name, action: input.project.mode === 'existing' ? 'existing' : project ? 'unchanged' : 'create', version: project?.version ?? 0 }, documents,
    mapping: { tenantId: actor.tenantId, projectId, contextKey: source.identity.contextKey, documents: documents.map(document => ({ viewerDocumentId: document.viewerDocumentId, erpDocumentId: document.id })) } };
}
function protectedRun<T>(run: () => T): T { try { return run(); } catch (cause) { if (cause instanceof TakeoffSourceRegistrationError) throw cause; throw new TakeoffSourceRegistrationError(503, 'Takeoff source registration is temporarily unavailable.'); } }
/** Fixed configured control metadata only; no paths, raw JSON, private metadata or provider reads. */
export function takeoffSourceRegistrationControl(actor: Actor): TakeoffSourceRegistrationControl {
  admin(actor);
  return protectedRun(() => {
    const relationBytes = bytes(process.env.TAYCO_TAKEOFF_RELATIONS_PATH, 5 * 1024 * 1024), manifestBytes = bytes(process.env.TAYCO_TAKEOFF_MANIFEST_PATH, 10 * 1024 * 1024);
    const relations = json(relationBytes), manifest = json(manifestBytes);
    const candidates = list(relations.contexts, 512).map(value => object(value)).filter(row => row.identityStatus === 'resolved' && Array.isArray(row.documentIds) && row.documentIds.length > 0);
    if (!candidates.length) return badSource();
    const first = candidates[0];
    const input: TakeoffSourceRegistrationInput = { expectedBundleId: identifier(relations.bundleId), expectedRelationsId: identifier(relations.relationsId, /^relations-[a-f0-9]{64}$/), expectedRelationsSha256: digest(relationBytes), expectedManifestSha256: digest(manifestBytes), contextKey: identifier(first.contextKey), viewerDocumentIds: identifiers(first.documentIds, 4096, 1), visibility: 'owner', project: { mode: 'create' } };
    // Reuse complete graph/schema validation and exact raw-byte pins before projecting any source fields.
    sourceOf(input);
    const documents = new Map(list(manifest.documents, 4096).map(value => { const row = object(value); return [identifier(row.id), row] as const; }));
    return { bundleId: input.expectedBundleId, relationsId: input.expectedRelationsId, relationsSha256: input.expectedRelationsSha256, manifestSha256: input.expectedManifestSha256,
      contexts: candidates.map(context => ({ contextKey: identifier(context.contextKey), displayName: text(context.displayName, 200), documents: identifiers(context.documentIds, 4096, 1).sort().map(viewerDocumentId => ({ viewerDocumentId, title: text(documents.get(viewerDocumentId)!.title) })) })).sort((a, b) => a.contextKey.localeCompare(b.contextKey)) };
  });
}
/** Readonly record preview; no guest grant, customer asset access, or external operation. */
export function planTakeoffSourceRegistration(actor: Actor, value: unknown): TakeoffSourceRegistrationPlan {
  admin(actor); const input = inputOf(value); return protectedRun(() => buildPlan(actor, input, sourceOf(input), database()));
}
/** Explicit local operator commit: records, audit and idempotent receipt close in one transaction. */
export function commitTakeoffSourceRegistration(actor: Actor, key: string, value: unknown, expectedPlanHash: string): TakeoffSourceRegistrationResult {
  admin(actor); const input = inputOf(value);
  if (typeof key !== 'string' || !/^[\w-]{16,100}$/.test(key) || typeof expectedPlanHash !== 'string' || !SHA.test(expectedPlanHash)) return badInput();
  return protectedRun(() => {
    const source = sourceOf(input), db = database(), requestKey = 'takeoff-source:' + key, hash = digest(JSON.stringify({ input, expectedPlanHash }));
    db.exec('BEGIN IMMEDIATE');
    try {
      const previous = db.prepare('SELECT hash,result FROM commands WHERE tenant_id=? AND actor_id=? AND key=?').get(actor.tenantId, actor.id, requestKey) as { hash: string; result: string } | undefined;
      if (previous) {
        if (previous.hash !== hash) return conflict();
        const result = JSON.parse(previous.result) as TakeoffSourceRegistrationResult;
        if (result.planHash !== expectedPlanHash || result.source.bundleId !== input.expectedBundleId || result.source.manifestSha256 !== input.expectedManifestSha256) return conflict();
        db.exec('COMMIT'); return result;
      }
      const plan = buildPlan(actor, input, source, db);
      if (plan.planHash !== expectedPlanHash) return conflict();
      const at = new Date().toISOString();
      const insert = (id: string, kind: 'project' | 'document', data: Record<string, unknown>) => {
        db.prepare('INSERT INTO records VALUES(?,?,?,?,?,?,1,?,?)').run(id, kind, actor.tenantId, plan.project.id, actor.id, JSON.stringify(data), at, at);
        db.prepare('INSERT INTO audit VALUES(?,?,?,?,?,?)').run(randomUUID(), actor.tenantId, actor.id, `takeoff_source.${kind}_registered`, id, at);
      };
      if (plan.project.action === 'create') insert(plan.project.id, 'project', projectData(source));
      for (const document of plan.documents) if (document.action === 'create') insert(document.id, 'document', { ...documentData(source, source.documents.find(item => item.id === document.viewerDocumentId)!, input), registeredAt: at, registeredBy: actor.id });
      const result: TakeoffSourceRegistrationResult = { planHash: plan.planHash, projectId: plan.project.id, projectCreated: plan.project.action === 'create', documents: plan.documents.map(document => ({ id: document.id, viewerDocumentId: document.viewerDocumentId, created: document.action === 'create', version: document.action === 'create' ? 1 : document.version })), source: { ...source.identity } };
      db.prepare('INSERT INTO commands VALUES(?,?,?,?,?)').run(actor.tenantId, actor.id, requestKey, hash, JSON.stringify(result));
      db.exec('COMMIT'); return result;
    } catch (cause) { db.exec('ROLLBACK'); throw cause; }
  });
}
