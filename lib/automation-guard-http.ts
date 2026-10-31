import { NextResponse } from 'next/server';
import { ensureVisitor, flagVisitor, guardCookie, guardMode, guardOrigin, guardStatus, labEnabled, readGuardCookie, type GuardState } from './automation-guard';

export const GUARD_PATH = '/api/automation-guard';
export function guardPage(state: GuardState, error = '') {
  const blocked = state.state === 'blocked';
  const title = blocked ? 'Access temporarily paused' : 'Browser verification';
  const message = blocked ? 'Repeated verification attempts were detected. Access is paused for 15 minutes.' : 'This browser requires verification before continuing. Authorized investigators can use a temporary access token.';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TAYCO · Browser verification</title><style>
  *{box-sizing:border-box}body{margin:0;background:#070e1a;color:#edf0f6;font:15px/1.6 system-ui,sans-serif}.overlay{min-height:100dvh;display:grid;place-items:center;padding:20px;background:radial-gradient(ellipse at top,#24304480,transparent 65%)}.card{width:min(100%,520px);padding:clamp(22px,5vw,36px);border:1px solid #c9a84c80;border-radius:22px;background:#101a2bee;box-shadow:0 24px 90px #0009}.eyebrow{font-size:11px;letter-spacing:.16em;color:#d4b961}h1{font:500 clamp(27px,6vw,36px)/1.1 Georgia,serif;margin:18px 0}p{color:#b9c4d4}.details{padding:14px;background:#ffffff06;border:1px solid #ffffff12;border-radius:12px;margin:20px 0;font-size:13px;overflow-wrap:anywhere}button,a.button{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:9px;padding:10px 16px;background:#c9a84c;color:#0a1120;font:600 13px system-ui;border:1px solid #c9a84c;cursor:pointer;text-decoration:none}input{width:100%;min-height:44px;background:#070e1a;border:1px solid #ffffff30;border-radius:8px;color:white;font-size:16px;padding:10px;margin:8px 0 12px}label{font-size:13px}form{margin:18px 0}.secondary{background:transparent;color:#dcc779}summary{cursor:pointer;font-size:13px;color:#dcc779;min-height:44px;display:flex;align-items:center}.error{color:#ffb4a9}:focus-visible{outline:2px solid #f4d875;outline-offset:4px}small{color:#99a6ba}footer{border-top:1px solid #ffffff15;margin-top:24px;padding-top:16px}
  </style></head><body><main class="overlay"><section class="card" role="dialog" aria-modal="true" aria-labelledby="guard-title">
  <div class="eyebrow">TAYCO GROUP · SECURITY</div><h1 id="guard-title">${title}</h1><p>${message}</p>
  <div class="details"><div>Retries used: ${Math.min(state.retries, 3)} / 3</div><div>Incident: ${state.incidentId || 'verification'}</div>${blocked ? '<div>Please wait before trying again, or contact TAYCO for a review.</div>' : '<div>Refreshing does not reset this verification.</div>'}</div>
  ${error ? '<p class="error" role="alert">Invalid or expired authorization. Please check your token.</p>' : ''}
  ${!blocked ? '<a class="button" href="' + (state.lab ? '/security-lab' : '/') + '">Retry verification</a>' : ''}
  <details><summary>Authorized investigation</summary><form method="post" action="${GUARD_PATH}"><input type="hidden" name="op" value="exchange"><label for="guard-token">Temporary authorization token</label><input id="guard-token" name="token" type="password" required maxlength="128" autocomplete="off"><button type="submit">Authorize this browser</button></form></details>
  ${state.lab ? '<footer><small>LOCAL TEST · Simulation controls are unavailable in production.</small><form method="post" action="' + GUARD_PATH + '"><input type="hidden" name="op" value="authorize-test"><button type="submit">Test temporary authorization</button></form><form method="post" action="' + GUARD_PATH + '"><input type="hidden" name="op" value="reset-test"><button class="secondary" type="submit">Reset local test</button></form></footer>' : ''}
  <p id="guard-error" class="error" role="alert"></p></section></main><script>
  document.querySelectorAll('form').forEach(function(form){form.addEventListener('submit',async function(event){
    event.preventDefault();var data=new FormData(form);if(event.submitter&&event.submitter.name)data.set(event.submitter.name,event.submitter.value);
    try{var response=await fetch('/api/automation-guard',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(Object.fromEntries(data))});
      if(!response.ok){var failure=await response.json();throw new Error(failure.error||'Authorization could not be verified. Please check your token.');}
      form.reset();window.location.assign(${state.lab ? "'/security-lab'" : "'/'"});
    }catch(error){document.getElementById('guard-error').textContent=error.message;}
  });});
  </script></body></html>`;
}
export function securityResponse(state: GuardState, error = '') {
  const retry = Math.max(1, Math.ceil((state.blockedUntil - Date.now()) / 1000));
  return new NextResponse(guardPage(state, error), { status: state.state === 'blocked' ? 429 : 403, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Robots-Tag': 'noindex, nofollow', ...(state.state === 'blocked' ? {'Retry-After': String(retry)} : {}) } });
}
/** Additional abuse gate only. This never authenticates access to private application data. */
export function inspectAutomationRequest(request: Request): { response?: NextResponse; cookie?: string } {
  if (guardMode() === 'off') return {};
  const url = new URL(request.url), pathname = url.pathname;
  // Explicit scope: public browsing/assets and private APIs never depend on the risk store.
  // Private APIs retain their own session/role/resource checks.
  const guardedApi = request.method === 'POST' && ['/api/estimate', '/api/vendor', '/api/investor'].includes(pathname);
  const labPage = pathname === '/security-lab' && labEnabled(request.url);
  if (!guardedApi && !labPage) return {};
  const documentRequest = request.method === 'GET' && request.headers.get('accept')?.includes('text/html') && !request.headers.has('rsc') && !request.headers.has('next-router-prefetch') && (!request.headers.get('sec-fetch-dest') || request.headers.get('sec-fetch-dest') === 'document');
  if (guardedApi && guardMode() === 'observe') return {};
  let visitor = readGuardCookie(request, 'visitor'), cookie: string | undefined;
  const debug = readGuardCookie(request, 'debug'), origin = guardOrigin(request), lab = labEnabled(request.url);
  const headlessSignal = /HeadlessChrome|PhantomJS/i.test(request.headers.get('user-agent') || '');
  let apiState: GuardState | undefined;
  if (guardedApi) {
    if(request.headers.get('origin')!==origin)return {response:NextResponse.json({error:'Use the configured website origin.'},{status:403})};
    if(!request.headers.get('content-type')?.startsWith('application/json'))return {response:NextResponse.json({error:'Send JSON.'},{status:415})};
    if(Number(request.headers.get('content-length')||0)>20_000)return {response:NextResponse.json({error:'Request too large.'},{status:413})};
    apiState=guardStatus(visitor,debug,origin,lab);
    if(apiState.mode!=='enforce')return {};
    const checked=ensureVisitor(visitor);
    if(checked.fresh)return {cookie:guardCookie('visitor',checked.token),response:NextResponse.json({error:'Browser session started. Your form is kept. Please submit again.',code:'automation_verification'},{status:428,headers:{'Cache-Control':'private, no-store'}})};
  }
  if (!visitor && documentRequest && headlessSignal) {
    const created = ensureVisitor(); visitor = created.token; cookie = guardCookie('visitor', visitor);
    flagVisitor(visitor, 'browser_automation');
  } else if (visitor && documentRequest) {
    // Reload, prefetch and navigation never consume a verification attempt.
    if (headlessSignal) flagVisitor(visitor, 'browser_automation');
  }
  if (!visitor) return {};
  const state = apiState || guardStatus(visitor, debug, origin, lab);
  if (state.mode !== 'enforce' || state.state === 'authorized' || state.state === 'clear') return { cookie };
  // Headers classify retries, but never authorize access: alternate Accept/RSC headers cannot bypass the page gate.
  const pageRequest = ['GET','HEAD'].includes(request.method) && !pathname.startsWith('/api/');
  if (pageRequest) return { response: securityResponse(state), cookie };

  if (guardedApi) return { response: NextResponse.json({error:'Browser verification required.',code:'automation_verification',incidentId:state.incidentId}, {status:state.state === 'blocked' ? 429 : 403,headers:{'Cache-Control':'private, no-store',...(state.state==='blocked'?{'Retry-After':String(Math.max(1,Math.ceil((state.blockedUntil-Date.now())/1000)))}:{})}}), cookie };
  return { cookie };
}
