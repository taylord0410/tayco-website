import { createHash } from 'node:crypto';
import { closeSync, fstatSync, lstatSync, openSync, readSync } from 'node:fs';
import { TextDecoder } from 'node:util';
import type { Actor } from './auth';
import { documentForActor, ErpError, snapshot, type Entry } from './erp';

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
  bundleId: string; relationsId: string; manifestSha256: string;
  contexts: { key: string; documentIds: string[] }[]; documentIds: string[]; assetIds: string[];
  documents: { id: string; contextKey: string; assetIds: string[] }[];
};
type Mapping = { tenantId: string; projectId: string; contextKey: string; documents: { viewerDocumentId: string; erpDocumentId: string }[] };
type AccessConfig = { schemaVersion: 'tayco-takeoff-viewer-access/v1'; bundleId: string; relationsSha256: string; mappings: Mapping[] };
const unavailable = () => new TakeoffViewerAccessError(503, 'The Takeoff viewer is not configured or is temporarily unavailable.');
const denied = () => new TakeoffViewerAccessError(404, 'The Takeoff viewer is not available for this project.');
const sourceId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
const erpId = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;
const sha256 = /^[a-f0-9]{64}$/;
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
  const row = object(value, ['schemaVersion', 'bundleId', 'relationsSha256', 'mappings']);
  if (row.schemaVersion !== 'tayco-takeoff-viewer-access/v1') throw unavailable();
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
  return { schemaVersion: 'tayco-takeoff-viewer-access/v1', bundleId: id(row.bundleId), relationsSha256: id(row.relationsSha256, sha256), mappings };
}
function policies() {
  const mappingPath = process.env.TAYCO_TAKEOFF_MAPPING_PATH, relationsPath = process.env.TAYCO_TAKEOFF_RELATIONS_PATH;
  if (!mappingPath || !relationsPath) throw unavailable();
  const config = parseConfig(json(readPolicyFile(mappingPath, MAPPING_BYTES)));
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
  return { config, relations, documents };
}
function intact(entry: Entry): boolean {
  return Boolean(entry.data && typeof entry.data === 'object' && !Array.isArray(entry.data) && !entry.data.deletedAt && !entry.data.purgedAt);
}

/**
 * Fresh permissions per resource request. Relations identify candidates; ERP grants access.
 * v1 documents grant whole registered files, including assets shared by another document.
 * An asset grant never grants sibling document/context metadata. Page-subset grants are unsupported.
 */
export function viewerScope(actor: Actor, projectId?: string): ViewerScope {
  // Precedes policy-file/provider reads, including for forged guest assignments.
  if (!actor || !['admin', 'staff', 'client', 'vendor'].includes(actor.role) || typeof actor.id !== 'string' || !erpId.test(actor.id) ||
    typeof actor.tenantId !== 'string' || !erpId.test(actor.tenantId) || !Array.isArray(actor.projectIds) || actor.projectIds.length > DOCUMENT_LIMIT ||
    actor.projectIds.some(value => typeof value !== 'string' || !erpId.test(value)) || new Set(actor.projectIds).size !== actor.projectIds.length)
    throw new TakeoffViewerAccessError(403, 'This account cannot access the Takeoff viewer.');
  if (projectId !== undefined && (typeof projectId !== 'string' || !erpId.test(projectId))) throw denied();
  try {
    const { config, relations, documents } = policies();
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
        documentIds.add(mapped.viewerDocumentId);
        const visible = contexts.get(mapping.contextKey) ?? new Set<string>(); visible.add(mapped.viewerDocumentId); contexts.set(mapping.contextKey, visible);
        for (const assetId of documents.get(mapped.viewerDocumentId)!.assetIds) assetIds.add(assetId);
      }
    }
    if (!documentIds.size) throw denied();
    return { bundleId: relations.bundleId, relationsId: relations.relationsId, manifestSha256: relations.manifestSha256,
      contexts: [...contexts].sort(([a], [b]) => a.localeCompare(b)).map(([key, values]) => ({ key, documentIds: [...values].sort() })), documentIds: [...documentIds].sort(), assetIds: [...assetIds].sort(),
      documents: [...documentIds].sort().map(id => ({ id, contextKey: documents.get(id)!.contextKeys[0], assetIds: [...documents.get(id)!.assetIds].sort() })) };
  } catch (error) { if (error instanceof TakeoffViewerAccessError) throw error; throw unavailable(); }
}
