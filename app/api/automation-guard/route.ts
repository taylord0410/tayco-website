import { NextResponse } from 'next/server';
import { assertSameOrigin, AuthError, requireActor, requireRole, revalidateRequestActor, rateLimit } from '@/lib/auth';
import { readAuthBody } from '@/lib/auth-http';
import { countGuardRetry, ensureVisitor, exchangeDebugGrant, flagVisitor, GuardError, guardCookie, guardMode, guardOrigin, guardStatus, issueDebugGrant, labEnabled, listGuardEvents, readGuardCookie, resetLabVisitor, revokeDebugGrant } from '@/lib/automation-guard';
import { challengeSiteKey, verifyChallenge } from '@/lib/guard-verification';
import { admitGuardRequest } from '@/lib/guard-budget';
import { securityResponse } from '@/lib/automation-guard-http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const json = (body: unknown, status = 200) => NextResponse.json(body, {status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'}});
export async function GET(request: Request) {
  if (guardMode() === 'off') return json({mode:'off',state:'clear',retries:0,remaining:3,blockedUntil:0,lab:false});
  try { admitGuardRequest(request); return json({...guardStatus(readGuardCookie(request,'visitor'),readGuardCookie(request,'debug'),guardOrigin(request),labEnabled(request.url)),siteKey:challengeSiteKey()}); }
  catch { return json({error:'Security verification is temporarily unavailable.'},503); }
}
export async function POST(request: Request) {
  if (guardMode() === 'off') return json({error:'Not found.'},404);
  const form = request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded');
  try {
    admitGuardRequest(request);
    // Exact-origin check also prevents sibling origins from exchanging a browser-bound grant.
    assertSameOrigin(request);
    if (request.headers.get('origin') !== guardOrigin(request)) throw new GuardError('Reload this page and try again.',403);
    let body: Record<string, unknown>;
    if (form) {
      const reader = request.body?.getReader(); let text = ''; let bytes = 0;
      if (!reader) throw new GuardError('Send a valid form.');
      const parts: Uint8Array[]=[];
      for (;;) { const item=await reader.read(); if(item.done)break;bytes+=item.value.byteLength;if(bytes>1024){await reader.cancel();throw new GuardError('Form too large.',413);}parts.push(item.value); }
      text=Buffer.concat(parts).toString('utf8'); body=Object.fromEntries(new URLSearchParams(text));
    } else body = await readAuthBody(request);
    const op = body.op, origin = guardOrigin(request), lab = labEnabled(request.url);
    const visitor = ensureVisitor(readGuardCookie(request,'visitor'));
    let response: NextResponse;
    if (op === 'bootstrap') {
      if (body.automation === true) flagVisitor(visitor.token,'browser_automation');
      response=json({...guardStatus(visitor.token,readGuardCookie(request,'debug'),origin,lab),siteKey:challengeSiteKey()});
    } else if (op === 'verify') {
      const verified=await verifyChallenge(request,visitor.token,body);
      const state=guardStatus(visitor.token,readGuardCookie(request,'debug'),origin,lab);
      response=json({verified,...state},verified?200:state.state==='blocked'?429:422);
      if(state.state==='blocked')response.headers.set('Retry-After',String(Math.max(1,Math.ceil((state.blockedUntil-Date.now())/1000))));
    } else if (op === 'exchange' || op === 'authorize-test') {
      let token=body.token;
      if(op === 'authorize-test') {
        if(!lab)throw new GuardError('Not found.',404);
        token=issueDebugGrant(visitor.token,origin,'local-test','Local security trial').token;
      }
      const result=exchangeDebugGrant(token,visitor.token,origin);
      response=form ? NextResponse.redirect(new URL(lab?'/security-lab':'/',origin),303) : json({authorized:true,expiresAt:result.expiresAt});
      response.headers.append('Set-Cookie',guardCookie('debug',result.session));
    } else if (op === 'invalid-test') {
      if(!lab)throw new GuardError('Not found.',404);
      countGuardRetry(visitor.token,undefined,origin,Date.now(),typeof body.attemptId==='string'?body.attemptId:undefined);
      response=json(guardStatus(visitor.token,readGuardCookie(request,'debug'),origin,lab));
    } else if (op === 'simulate' || op === 'reset-test') {
      if(!lab)throw new GuardError('Not found.',404);
      if(op === 'simulate')flagVisitor(visitor.token,'lab_simulation'); else resetLabVisitor(visitor.token);
      response=form ? NextResponse.redirect(new URL('/security-lab',origin),303) : json(guardStatus(visitor.token,readGuardCookie(request,'debug'),origin,lab));
    } else if (op === 'issue' || op === 'revoke' || op === 'events') {
      const actor=await requireActor(request); requireRole(actor,['admin']); rateLimit('automation-grant:'+actor.id,20,60_000);revalidateRequestActor(actor);
      if(op==='issue')response=json(issueDebugGrant(visitor.token,origin,actor.id,typeof body.purpose==='string'?body.purpose:''),201);
      else if(op==='revoke'){if(typeof body.id!=='string')throw new GuardError('Choose an authorization.');revokeDebugGrant(body.id);response=json({revoked:true});}
      else response=json({events:listGuardEvents()});
    } else throw new GuardError('Choose a valid operation.');
    response.headers.set('Cache-Control','private, no-store');
    if(visitor.fresh)response.headers.append('Set-Cookie',guardCookie('visitor',visitor.token));
    return response;
  } catch(error) {
    const status=error instanceof GuardError||error instanceof AuthError?error.status:503;
    if(form && status===403 && request.headers.get('origin')===guardOrigin(request)) {
      const state=guardStatus(readGuardCookie(request,'visitor'),readGuardCookie(request,'debug'),guardOrigin(request),labEnabled(request.url));
      return securityResponse(state,true.toString());
    }
    return json({error:status===503?'Security verification is temporarily unavailable.':error instanceof Error?error.message:'Verification failed.'},status);
  }
}
