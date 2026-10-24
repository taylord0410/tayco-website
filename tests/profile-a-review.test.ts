import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildProfileAReview, ProfileAReviewError } from '../lib/profile-a-review';

const actor = { role: 'admin' as const, tenantId: 'synthetic-tenant' };
const docSha = 'a'.repeat(64);
const source = () => ({ schemaVersion: 'tayco-profile-a-review/v1', tenantId: actor.tenantId, period: '2026-10',
  rows: [{ id: 'reported-1', name: 'Synthetic source opportunity', location: null, contractor: null, section: 'dated',
    reportedDeadline: '2026-10-09', documents: [{ name: 'Synthetic source.pdf', state: 'received', sha256: docSha }] },
    { id: 'reported-2', name: 'Synthetic undated opportunity', location: 'Fixture City', contractor: null, section: 'undated',
      reportedDeadline: null, documents: [{ name: 'Pending file.pdf', state: 'pending', sha256: null }] }] });
function build(value: unknown, links: Parameters<typeof buildProfileAReview>[3] = []) {
  const bytes = Buffer.from(JSON.stringify(value));
  return buildProfileAReview(actor, bytes, createHash('sha256').update(bytes).digest('hex'), links);
}
test('reported opportunities stay separate from source files and viewer registration', () => {
  const result = build(source(), [{ sha256: docSha, contextKey: 'context-fixture', viewerDocumentId: 'document-fixture' }]);
  assert.equal(result.opportunityCount, 2); assert.equal(result.reportedDatedCount, 1);
  assert.equal(result.undatedCount, 1); assert.equal(result.documentCount, 2);
  assert.equal(result.receivedDocumentCount, 1); assert.equal(result.linkedDocumentCount, 1);
  assert.equal(result.rows[0].documents[0].viewerHref, '/api/takeoff-viewer/viewer?embed=1&project=context-fixture&document=document-fixture');
  assert.equal(result.rows[1].documents[0].viewerHref, null);
  assert.equal(JSON.stringify(result).includes(docSha), false);
});
test('unmapped and ambiguous checksums never create guessed viewer links', () => {
  assert.equal(build(source()).linkedDocumentCount, 0);
  assert.equal(build(source(), [
    { sha256: docSha, contextKey: 'context-a', viewerDocumentId: 'document-a' },
    { sha256: docSha, contextKey: 'context-b', viewerDocumentId: 'document-b' },
  ]).linkedDocumentCount, 0);
});
test('all non-administrative roles are denied before source parsing', () => {
  for (const role of ['guest', 'staff', 'client', 'vendor'] as const)
    assert.throws(() => buildProfileAReview({ role, tenantId: actor.tenantId }, Buffer.from('private malformed data'), ''), (e: unknown) => e instanceof ProfileAReviewError && e.status === 403);
});
test('other tenants, modified source bytes and oversized input fail closed', () => {
  const value = source(); value.tenantId = 'other-tenant'; assert.throws(() => build(value));
  const bytes = Buffer.from(JSON.stringify(source()));
  assert.throws(() => buildProfileAReview(actor, bytes, 'b'.repeat(64)));
  assert.throws(() => buildProfileAReview(actor, Buffer.alloc(1024 * 1024 + 1), 'a'.repeat(64)));
});
test('financial and internal fields cannot reach the client projection', () => {
  for (const field of ['amountUsd', 'precio_bajo_usd', 'internalContact', 'sourcePath', 'viewerHref']) {
    const value = source(); Object.assign(value.rows[0], { [field]: 'private-value' });
    assert.throws(() => build(value));
  }
  const value = source(); Object.assign(value.rows[0].documents[0], { sourcePath: 'private-file' });
  assert.throws(() => build(value));
});
test('excluded brand, false dates, duplicate identities and false receipt state reject', () => {
  const brand = source(); brand.rows[0].name = 'Auto Zone fixture'; assert.throws(() => build(brand));
  const dated = source(); dated.rows[0].reportedDeadline = '2026-02-30'; assert.throws(() => build(dated));
  const duplicate = source(); duplicate.rows[1].id = duplicate.rows[0].id; assert.throws(() => build(duplicate));
  const pending = source(); pending.rows[1].documents[0].sha256 = docSha; assert.throws(() => build(pending));
});
