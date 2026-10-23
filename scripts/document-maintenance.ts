import { documentMaintenance, purgeDocument, scanDocumentExpiry } from '../lib/document-lifecycle';
import type { Actor } from '../lib/auth';

async function main() {
  const tenantId = process.env.TAYCO_DOCUMENT_MAINTENANCE_TENANT_ID;
  if (!tenantId || !/^[a-zA-Z0-9_-]{1,100}$/.test(tenantId)) throw new Error('Set TAYCO_DOCUMENT_MAINTENANCE_TENANT_ID to the company being maintained.');
  const actor: Actor = { id: 'document-maintenance-operator', email: '', role: 'admin', tenantId, projectIds: [] };
  const command = process.argv[2] || 'list';
  if (command === 'list') {
    const state = documentMaintenance(actor);
    console.log(JSON.stringify({ policy: state.policy, documents: state.documents.map(doc => ({ id: doc.id, version: doc.version, availability: doc.availability, expiry: doc.expiry.state, hold: Boolean(doc.data.hold), retentionDays: doc.effectiveRetentionDays })), notices: state.notices.length }));
  } else if (command === 'scan') {
    const result = scanDocumentExpiry(actor); console.log(JSON.stringify({ created: result.created, notices: result.notices.length, externalDeliveryAttempted: false }));
  } else if (command === 'purge') {
    const id = process.argv[process.argv.indexOf('--id') + 1]; const version = Number(process.argv[process.argv.indexOf('--version') + 1]);
    if (!process.argv.includes('--id') || !process.argv.includes('--version') || !id || !Number.isInteger(version)) throw new Error('Usage: document-maintenance.ts purge --id <document ID> --version <current version> [--apply]');
    const result = await purgeDocument(actor, { id, version, apply: process.argv.includes('--apply') });
    console.log(JSON.stringify({ applied: result.applied, confirmed: 'confirmed' in result ? result.confirmed : undefined, eligible: 'eligible' in result ? result.eligible : undefined, documentId: result.document.id, version: result.document.version, availability: result.document.availability }));
  } else throw new Error('Usage: node --import tsx scripts/document-maintenance.ts list|scan|purge');
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Document maintenance did not complete.'); process.exitCode = 1; });
