import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";
import type { ViewerRelations } from "../lib/takeoff-viewer-access";

/** Explicit SYNTHETIC metadata only. No ERP writes, grants, runtime or source copies. */
export function syntheticViewerCohort(folder: string, relations: Omit<ViewerRelations, 'schemaVersion' | 'contexts'> & {contexts: {contextKey: string; displayName: string; identityStatus: string; documentIds: string[]}[]}, sourceHashes: Record<string, string> = {}) {
  const hash = (value: string) => createHash("sha256").update(value).digest("hex");
  const manifest = {
    schema_version: "takeoff-viewer-bundle/v1", bundle_id: relations.bundleId,
    projects: relations.contexts.map(context => ({ key: context.contextKey, display_name: context.displayName,
      identity_status: context.identityStatus, document_ids: context.documentIds })),
    documents: relations.documents.map(document => ({ id: document.documentId, project_key: document.contextKeys[0],
      kind: document.kind, source_sha256: sourceHashes[document.documentId] ?? "c".repeat(64),
      asset_id: document.assetIds[0], ...(document.assetIds[1] ? { index_asset_id: document.assetIds[1] } : {}) })),
    assets: relations.assets.map(asset => ({ id: asset.assetId, path: "assets/" + asset.assetId + ".pdf",
      media_type: relations.documents.some(document => document.assetIds[0] === asset.assetId) ? "application/pdf" : "application/json",
      size_bytes: 1, sha256: "c".repeat(64) })),
  };
  const rawManifest = JSON.stringify(manifest) + "\n";
  const manifestPath = path.join(folder, "manifest.json");
  writeFileSync(manifestPath, rawManifest);
  relations.manifestSha256 = hash(rawManifest);
  const rawRelations = JSON.stringify(relations) + "\n";
  const relationsSha256 = hash(rawRelations);
  return { manifestPath, manifest, rawRelations, relationsSha256,
    delivery(viewerDocumentId: string) {
      const source = manifest.documents.find(document => document.id === viewerDocumentId);
      if (!source) throw new Error("Unknown synthetic document");
      return { storage: "takeoff_viewer", viewerDocumentId, contextKey: source.project_key, bundleId: relations.bundleId,
        manifestSha256: relations.manifestSha256, relationsId: relations.relationsId, relationsSha256,
        sourceSha256: source.source_sha256, sourceKind: source.kind, contentType: "application/pdf" };
    },
  };
}
