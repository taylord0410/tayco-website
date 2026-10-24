import { NextResponse } from 'next/server';
import { AuthError } from './auth';

export async function readAuthBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new AuthError('Send a valid form.', 415);
  const reader = request.body?.getReader(); if (!reader) throw new AuthError('Send a valid form.', 400);
  let bytes = 0; const parts: Uint8Array[] = [];
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 10_000) { await reader.cancel(); throw new AuthError('This form is too large.', 413); } parts.push(value); } const text = Buffer.concat(parts).toString('utf8'); const body = JSON.parse(text); if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error(); return body; }
  catch (error) { if (error instanceof AuthError) throw error; throw new AuthError('Send a valid form.', 400); }
}
export function authJson(data: unknown, status = 200) { return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store, private', 'Pragma': 'no-cache' } }); }
export function authFailure(error: unknown) { return authJson({ error: error instanceof AuthError ? error.message : 'Account access is temporarily unavailable. Please try again.', ...(error instanceof AuthError && error.reasonCode ? {reasonCode:error.reasonCode}: {}) }, error instanceof AuthError ? error.status : 503); }
