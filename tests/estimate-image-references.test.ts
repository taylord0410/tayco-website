import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { NextRequest } from 'next/server';
import { receive } from '../app/api/submission';
import catalog from '../lib/reference-image-catalog.json';
import { resolveReferenceImages, restoreReferenceDraft, referenceForSource } from '../lib/reference-images';
import { database, listWebsiteSubmissions } from '../lib/erp';
import type { Actor } from '../lib/auth';

test('catalog IDs are unique and resolve real images, including distinct day/night variants', () => {
  assert.equal(new Set(catalog.map(image => image.id)).size, catalog.length);
  for (const image of catalog) {
    assert.match(image.id, /^REF-[A-F0-9]{12}$/);
    assert.ok(existsSync(path.join(process.cwd(), 'public', image.src)));
    assert.equal(referenceForSource(image.src)?.id, image.id);
  }
  const day = catalog.find(image => image.src.endsWith('mkt-twn-framing-row.jpg'))!;
  const night = catalog.find(image => image.src.endsWith('mkt-twn-framing-row-night.jpg'))!;
  assert.notEqual(day.id, night.id);
  assert.deepEqual(resolveReferenceImages([day.id, day.id, night.id]), [day, night]);
  assert.throws(() => resolveReferenceImages(['https://attacker.example/image.jpg']));
  assert.throws(() => resolveReferenceImages(Array(13).fill(day.id)));
  assert.deepEqual(restoreReferenceDraft('{broken'), []);
  assert.deepEqual(restoreReferenceDraft(JSON.stringify(['unknown', day.id, day.id])), [day]);
});

test('HTTP estimate submission persists canonical references in the encrypted admin message, with validation and retry safety', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'tayco-image-references-'));
  const previous = process.env.TAYCO_ERP_DB_PATH;
  const previousKey = process.env.TAYCO_DATA_ENCRYPTION_KEY;
  process.env.TAYCO_DATA_ENCRYPTION_KEY = randomBytes(48).toString('hex');
  process.env.TAYCO_ERP_DB_PATH = path.join(dir, 'erp.sqlite');
  const admin: Actor = { id: 'ref-admin', email: 'admin@example.test', role: 'admin', tenantId: 'tayco_llc', projectIds: [] };
  const images = catalog.slice(0, 2);
  const payload = { fullName: 'Reference Test', email: 'reference@example.test', phone: '414-555-0100', projectType: 'Residential Renovation', projectLocation: 'Milwaukee, WI', projectDetails: 'Please review these selected finishes.', referenceImageIds: images.map(image => image.id) };
  const send = (body: unknown, key = 'reference-test-request') => receive(new NextRequest('http://localhost:3099/api/estimate', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:3099', 'Idempotency-Key': key }, body: JSON.stringify(body),
  }), 'estimate');
  try {
    const result = await send(payload);
    assert.equal(result.status, 201);
    const receipt = await result.json();
    assert.ok(receipt.referenceId);
    assert.equal((await send(payload)).status, 201);
    const messages = listWebsiteSubmissions(admin);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].id, receipt.referenceId);
    assert.equal(messages[0].status, 'unread');
    assert.deepEqual(messages[0].payload.referenceImages, images);
    assert.deepEqual(messages[0].payload.referenceImageIds, payload.referenceImageIds);
    const raw = database().prepare('SELECT payload_encrypted FROM website_submissions WHERE id=?').get(receipt.referenceId) as { payload_encrypted: string };
    assert.ok(!raw.payload_encrypted.includes(images[0].id));
    assert.throws(() => listWebsiteSubmissions({ ...admin, role: 'client' }));
    assert.equal((await send({ ...payload, referenceImageIds: ['REF-FAKE'] }, 'invalid')).status, 422);
    assert.equal((await send({ ...payload, referenceImageIds: Array(13).fill(images[0].id) }, 'overlimit')).status, 422);
    assert.equal((await send({ ...payload, referenceImages: [{ src: 'https://attacker.example/image.jpg' }] }, 'injected')).status, 422);
    assert.equal(listWebsiteSubmissions(admin).length, 1, 'Rejected references must never become admin messages');
    assert.equal((await send({ ...payload, email: 'no-refs@example.test', referenceImageIds: [] }, 'without-images-request')).status, 201);
    assert.equal(listWebsiteSubmissions(admin).length, 2, 'Images are optional; the estimate form remains required');
  } finally {
    database().close();
    if (previousKey === undefined) delete process.env.TAYCO_DATA_ENCRYPTION_KEY; else process.env.TAYCO_DATA_ENCRYPTION_KEY = previousKey;
    if (previous === undefined) delete process.env.TAYCO_ERP_DB_PATH; else process.env.TAYCO_ERP_DB_PATH = previous;
    rmSync(dir, { recursive: true, force: true });
  }
});
