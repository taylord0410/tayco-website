import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProjectEstimate, groupProjectEstimates, type ProjectEstimate } from '../lib/project-estimates';

const sample = (): ProjectEstimate => ({
  id: 'estimate-fixture-v1', projectId: 'fixture-project', projectName: 'Private estimate fixture', sourceProjectSlug: 'fixture',
  status: 'estimate', currency: 'USD', version: 'scenario.v1', estimatedOn: '2026-10-01', dateBasis: 'source_snapshot', amountUsd: 100.1, directCostUsd: 80,
  sourceName: 'Archived estimator snapshot', sourceRef: 'private-estimates/fixture/scenario.json', sourceSha256: 'a'.repeat(64), capturedAt: '2026-10-23T10:00:00Z',
  sourceAvailability: 'archived', breakdown: [{ code: '01', label: 'General', amountUsd: 40.05 }, { code: '03', label: 'Concrete', amountUsd: 60.05 }],
  breakdownBasis: 'bid', breakdownReconciled: true, costTiers: [], costTiersReconciled: false, rawCostLineCount: 4, sourceFacts: ['Estimate only; no payment or progress history inferred.'],
});
test('estimate snapshot keeps cents, provenance and no operational payload', () => {
  const input = { ...sample(), payments: [{ amountUsd: 100 }], privateContact: 'not exported', statusActual: 'paid' };
  const parsed = parseProjectEstimate(input);
  assert.equal(parsed.amountUsd, 100.1); assert.equal(parsed.status, 'estimate'); assert.equal(parsed.capturedAt, '2026-10-23T10:00:00.000Z');
  assert.ok(!Object.hasOwn(parsed, 'payments')); assert.ok(!Object.hasOwn(parsed, 'privateContact')); assert.equal(input.sourceSha256, 'a'.repeat(64));
});
test('unknown and zero amounts/dates stay distinct without inferred totals', () => {
  const parsed = parseProjectEstimate({ ...sample(), amountUsd: null, directCostUsd: 0, estimatedOn: null, dateBasis: 'unknown', breakdown: [], breakdownReconciled: false });
  assert.equal(parsed.amountUsd, null); assert.equal(parsed.directCostUsd, 0); assert.equal(parsed.estimatedOn, null);
  assert.throws(() => parseProjectEstimate({ ...sample(), amountUsd: undefined }));
  assert.throws(() => parseProjectEstimate({ ...sample(), estimatedOn: null }));
});
test('invalid dates and timestamps fail without normalizing impossible calendar values', () => {
  assert.equal(parseProjectEstimate({ ...sample(), estimatedOn: '2026-10-01T22:30:00-04:00' }).estimatedOn, '2026-10-01T22:30:00-04:00');
  for (const estimatedOn of ['2026-02-30', '2026-13-01', '26-01-01']) assert.throws(() => parseProjectEstimate({ ...sample(), estimatedOn }));
  for (const capturedAt of ['2026-02-30T10:00:00Z', '2026-10-23T24:00:00Z', '2026-10-23T10:00:00', 'yesterday']) assert.throws(() => parseProjectEstimate({ ...sample(), capturedAt }));
});
test('relative private provenance excludes URLs, traversal and invalid digests', () => {
  for (const sourceRef of ['../file', 'files/../file', '/absolute/file', 'C:/secret/file', 'https://example.test/file', 'files\\secret', 'files/%2e%2e/x', 'file?token=x', 'file#key']) assert.throws(() => parseProjectEstimate({ ...sample(), sourceRef }));
  assert.throws(() => parseProjectEstimate({ ...sample(), sourceSha256: 'bad' }));
  assert.throws(() => parseProjectEstimate({ ...sample(), sourceAvailability: 'verified_contract' }));
});
test('nonnegative cents and explicit reconciliation prevent misleading decomposition', () => {
  for (const amountUsd of [-1, 0.001, Infinity, '100', NaN]) assert.throws(() => parseProjectEstimate({ ...sample(), amountUsd }));
  assert.throws(() => parseProjectEstimate({ ...sample(), amountUsd: 101 }));
  assert.throws(() => parseProjectEstimate({ ...sample(), breakdown: [] }));
  assert.throws(() => parseProjectEstimate({ ...sample(), breakdown: [sample().breakdown[0], sample().breakdown[0]] }));
  assert.equal(parseProjectEstimate({ ...sample(), amountUsd: 101, breakdownReconciled: false }).breakdownReconciled, false);
  assert.equal(parseProjectEstimate({ ...sample(), amountUsd: 101, directCostUsd: 100.1, breakdownBasis: 'direct_cost' }).breakdownReconciled, true);
  assert.throws(() => parseProjectEstimate({ ...sample(), breakdownBasis: undefined }));
});
test('revisions remain separate and project selection never merges conflicting totals', () => {
  const first = sample(), second = { ...sample(), id: 'estimate-fixture-v2', version: 'raw-boq.v1', amountUsd: 150, breakdownReconciled: false };
  const foreign = { ...sample(), id: 'other-estimate', projectId: 'other-project' };
  const result = groupProjectEstimates([first, second, foreign], first.projectId);
  assert.equal(result.estimates.length, 2); assert.equal(result.invalidCount, 0); assert.deepEqual(result.estimates.map(row => row.amountUsd).sort(), [100.1, 150]);
});
test('duplicate snapshot IDs and malformed records fail visibly instead of choosing a winner', () => {
  const result = groupProjectEstimates([sample(), { ...sample(), amountUsd: 900, breakdownReconciled: false }, null]);
  assert.equal(result.estimates.length, 0); assert.equal(result.invalidCount, 3);
  assert.throws(() => parseProjectEstimate(Object.create({ ...sample() })));
  assert.throws(() => parseProjectEstimate({ ...sample(), status: 'paid' }));
  assert.throws(() => parseProjectEstimate({ ...sample(), currency: 'EUR' }));
});
test('optional cost tiers are canonical and reconcile only against direct cost in exact cents', () => {
  const legacy = { ...sample() } as Partial<ProjectEstimate>; delete legacy.costTiers; delete legacy.costTiersReconciled;
  const normalized = parseProjectEstimate(legacy); assert.deepEqual(normalized.costTiers, []); assert.equal(normalized.costTiersReconciled, false);
  const tiers = [{ code: 'materials', label: 'Estimated materials', amountUsd: 40.05 }, { code: 'labor', label: 'Estimated labor', amountUsd: 20 }, { code: 'equipment', label: 'Estimated equipment', amountUsd: 19.95 }];
  const parsed = parseProjectEstimate({ ...sample(), costTiers: tiers, costTiersReconciled: true }); assert.deepEqual(parsed.costTiers, tiers); assert.equal(parsed.costTiersReconciled, true);
  assert.throws(() => parseProjectEstimate({ ...sample(), costTiers: tiers, costTiersReconciled: true, directCostUsd: 80.01 }));
  assert.throws(() => parseProjectEstimate({ ...sample(), costTiers: tiers, costTiersReconciled: true, directCostUsd: null }));
  assert.throws(() => parseProjectEstimate({ ...sample(), costTiers: [], costTiersReconciled: true }));
  assert.throws(() => parseProjectEstimate({ ...sample(), costTiers: [tiers[0], tiers[0]] }));
  assert.throws(() => parseProjectEstimate({ ...sample(), costTiers: [{ ...tiers[0], amountUsd: -1 }] }));
  assert.throws(() => parseProjectEstimate({ ...sample(), costTiers: null }));
  assert.throws(() => parseProjectEstimate({ ...sample(), costTiersReconciled: null }));
});
