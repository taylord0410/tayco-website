import { parseReviewInteraction,type ReviewInteractionInput } from './review-interaction-contract';
export const VIEWER_REVIEW_BRIDGE_PATH='/api/takeoff-viewer/static/viewer-review-events.js';

const TAYCO_CAD_IFRAME_CSS = [
  '.actions a.button.primary,a[href*="/assets/"],#openPdfLink{display:none!important;pointer-events:none!important}',
  'html,body{background:#06101e!important;color:#e2e8f0!important;margin:0!important;padding:0!important;height:100%!important;overflow:hidden!important;font-family:Inter,system-ui,-apple-system,sans-serif!important}',
  '.brand-bar,.site-footer,#catalog,.page-heading{display:none!important}',
  '#infoPanel:not(.tayco-sheet-index-open){display:none!important}',
  '#infoPanel.tayco-sheet-index-open{display:block!important;position:fixed!important;z-index:40!important;top:46px!important;right:0!important;bottom:0!important;width:min(90vw,340px)!important;max-height:none!important;background:#081629!important;color:#f8fafc!important;border-left:1px solid rgba(212,175,55,0.35)!important;box-shadow:-12px 0 36px rgba(0,0,0,0.65)!important;padding:1rem!important;overflow-y:auto!important}',
  '#infoPanel.tayco-sheet-index-open h2,#infoPanel.tayco-sheet-index-open h3{color:#f3d37a!important;font-size:0.9rem!important;margin-top:0!important}',
  '#infoPanel.tayco-sheet-index-open p{color:#94a3b8!important;font-size:0.76rem!important}',
  '#infoPanel.tayco-sheet-index-open button{background:#0d2038!important;color:#e2e8f0!important;border:1px solid rgba(212,175,55,0.25)!important;border-radius:6px!important;padding:0.45rem 0.65rem!important;margin-bottom:0.35rem!important;width:100%!important;text-align:left!important;font-size:0.78rem!important;cursor:pointer!important}',
  '#infoPanel.tayco-sheet-index-open button:hover{background:rgba(212,175,55,0.18)!important;color:#f3d37a!important;border-color:rgba(212,175,55,0.5)!important}',
  '#infoPanel.tayco-sheet-index-open #closeInfo{width:auto!important;padding:0.2rem 0.55rem!important;color:#f3d37a!important}',
  '.app-shell{display:block!important;height:100dvh!important;width:100%!important;max-width:none!important;padding:0!important;margin:0!important;background:#06101e!important}',
  '.main-content,.main-content.document-open{height:100dvh!important;max-height:none!important;width:100%!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:#06101e!important;box-shadow:none!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}',
  '#documentView{display:flex!important;flex-direction:column!important;flex:1 1 auto!important;min-height:0!important;height:100%!important;margin:0!important;padding:0!important}',
  '.reader-toolbar{background:#09182c!important;border:0!important;border-bottom:1px solid rgba(212,175,55,0.22)!important;border-radius:0!important;padding:0.45rem 0.9rem!important;margin:0!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:0.75rem!important;color:#e2e8f0!important;flex-shrink:0!important}',
  '.reader-toolbar .page-control{display:flex!important;align-items:center!important;gap:0.45rem!important;font-size:0.8rem!important;color:#cbd5e1!important}',
  '.reader-toolbar button{background:rgba(15,31,56,0.95)!important;color:#f3d37a!important;border:1px solid rgba(212,175,55,0.38)!important;border-radius:6px!important;padding:0.32rem 0.75rem!important;font-weight:600!important;font-size:0.76rem!important;cursor:pointer!important;transition:all 0.15s ease!important}',
  '.reader-toolbar button:hover:not(:disabled){background:rgba(212,175,55,0.22)!important;border-color:#f3d37a!important}',
  '.reader-toolbar button:disabled{opacity:0.38!important;cursor:not-allowed!important}',
  '.reader-toolbar input#pageNumber{background:#050d1a!important;color:#f8fafc!important;border:1px solid rgba(212,175,55,0.42)!important;border-radius:6px!important;padding:0.24rem 0.4rem!important;width:3.5rem!important;text-align:center!important;font-weight:700!important;font-size:0.8rem!important}',
  '.reader-toolbar input[type="range"]{accent-color:#d4af37!important;width:150px!important;cursor:pointer!important}',
  '.reader-frame{flex:1 1 auto!important;height:calc(100dvh - 46px)!important;min-height:0!important;width:100%!important;background:radial-gradient(circle at 50% 30%,#0e223d 0%,#06101e 100%)!important;border:0!important;border-radius:0!important;padding:1.25rem!important;margin:0!important;overflow:auto!important;display:flex!important;justify-content:center!important;align-items:flex-start!important;outline:none!important}',
  '.pdf-page-canvas{box-shadow:0 20px 55px rgba(0,0,0,0.8),0 0 0 1px rgba(212,175,55,0.3)!important;border-radius:4px!important;background:#ffffff!important}',
  '.reader-placeholder,.status-card{background:#0a192f!important;color:#f3d37a!important;border:1px solid rgba(212,175,55,0.3)!important;border-radius:10px!important;padding:1rem 1.25rem!important;margin:2rem auto!important;max-width:420px!important;text-align:center!important}',
].join('');

export const VIEWER_REVIEW_BRIDGE_JS=`/* Closed, consent-gated control bridge. No document text or arbitrary selectors leave the frame. */
(()=>{
 if(window.parent===window)return;
 let until=0;
 const allowedId=v=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(v);
 const hideDownload=()=>{try{if(document.head&&!document.querySelector('#tayco-no-dl')){const s=document.createElement('style');s.id='tayco-no-dl';s.textContent=${JSON.stringify(TAYCO_CAD_IFRAME_CSS)};document.head.appendChild(s);}const link=document.querySelector('#openPdfLink');if(link){link.removeAttribute('href');link.style.display='none';}for(const a of document.querySelectorAll('.actions a.button.primary,a[href*="/assets/"]')){a.removeAttribute('href');a.style.display='none';}}catch{}};
 hideDownload();
 window.addEventListener('message',event=>{
  hideDownload();
  const x=event.data;
  if(event.origin!==location.origin||event.source!==window.parent||!x||typeof x!=='object'||Array.isArray(x)||
   Object.keys(x).some(k=>!['type','taxonomyVersion','enabled','remainingMs'].includes(k))||
   x.type!=='tayco-review-viewer-control'||x.taxonomyVersion!==2||typeof x.enabled!=='boolean'||
   !Number.isFinite(x.remainingMs)||x.remainingMs<0||x.remainingMs>43200000)return;
  until=x.enabled?performance.now()+x.remainingMs:0;
 });
 const documentId=()=>new URL(location.href).searchParams.get('document');
 function send(elementId,extra={},selected=documentId()){
  if(performance.now()>=until||!allowedId(selected))return;
  window.parent.postMessage({type:'tayco-review-viewer-interaction',taxonomyVersion:2,elementId,documentId:selected,...extra},location.origin);
 }
 function page(delta){
  const input=document.querySelector('#pageNumber'),current=Number(input?.value),max=Number(input?.max)||1000000;
  const number=Math.max(1,Math.min(max,current+delta));
  return Number.isInteger(number)&&number<=1000000?number:null;
 }
 document.addEventListener('contextmenu',event=>{if(event.preventDefault)event.preventDefault();try{if(typeof fetch==='function')fetch('/api/guest-security',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify({eventType:'security.context_menu',surface:'viewer',targetId:documentId()||'viewer',detail:'Right-click in CAD/PDF viewer'})}).catch(()=>{});}catch{}},true);
 document.addEventListener('click',event=>{
  hideDownload();
  if(!event.isTrusted||!(event.target instanceof Element))return;
  const target=event.target.closest('button,a');
  if(!target||target.disabled)return;
  if(target.id==='openPdfLink'||(typeof target.getAttribute==='function'&&String(target.getAttribute('href')||'').includes('/assets/'))){if(event.preventDefault)event.preventDefault();return;}
  const selected=target.dataset.documentId;
  if(allowedId(selected)){send('viewer.document.select',{},selected);return;}
  const controls=[...document.querySelectorAll('.page-control button')];
  if(target===controls[0]||target===controls[1]){
   const next=target===controls[0]?-1:1,number=page(next);if(number!==null)send(next<0?'viewer.page.previous':'viewer.page.next',{pageNumber:number});return;
  }
  if(target.id==='mobileInfo'||target.id==='closeInfo')send('viewer.info.toggle');
  else if(target.id==='mobileProjects')send('viewer.catalog.toggle');
  else if(target.id==='backToProjects')send('viewer.catalog.open');
 },true);
 document.addEventListener('change',event=>{
  if(!event.isTrusted||!(event.target instanceof Element))return;
  const input=event.target;
  if(input.id==='pageNumber'){
   const number=Number(input.value);if(Number.isInteger(number)&&number>0&&number<=1000000)send('viewer.page.go',{pageNumber:number});
  }else if(input.matches('.reader-toolbar input[type="range"]'))send('viewer.zoom.change');
 },true);
 document.addEventListener('keydown',event=>{
  if(event.key==='PrintScreen'||event.code==='PrintScreen'){try{if(typeof fetch==='function')fetch('/api/guest-security',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify({eventType:'security.print_screen',surface:'viewer',targetId:documentId()||'viewer',detail:'PrintScreen in CAD/PDF viewer'})}).catch(()=>{});}catch{}}
  if((event.ctrlKey||event.metaKey)&&['s','S','p','P'].includes(event.key)){if(event.preventDefault)event.preventDefault();try{if(typeof fetch==='function')fetch('/api/guest-security',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',keepalive:true,body:JSON.stringify({eventType:event.key.toLowerCase()==='p'?'security.print_attempt':'security.save_attempt',surface:'viewer',targetId:documentId()||'viewer',detail:'Save/Print shortcut in CAD/PDF viewer'})}).catch(()=>{});}catch{}return;}
  if(!event.isTrusted||!(event.target instanceof Element)||!event.target.closest('.reader-frame')||!['ArrowLeft','ArrowRight'].includes(event.key))return;
  const delta=event.key==='ArrowLeft'?-1:1,number=page(delta);if(number!==null)send(delta<0?'viewer.page.previous':'viewer.page.next',{pageNumber:number});
 },true);
})();`;
const frameElements=new Set(['viewer.document.select','viewer.page.previous','viewer.page.next','viewer.page.go','viewer.zoom.change','viewer.info.toggle','viewer.catalog.toggle','viewer.catalog.open']);
/** Exact origin AND the mounted frame's WindowProxy are required. Identity/UUID are minted in the parent/server, never accepted from the frame. */
export function readViewerInteraction(event:Pick<MessageEvent,'origin'|'source'|'data'>,expected:{origin:string;source:unknown}):Omit<ReviewInteractionInput,'taxonomyVersion'|'eventId'>|undefined{
 if(!expected.source||event.origin!==expected.origin||event.source!==expected.source||!event.data||typeof event.data!=='object'||Array.isArray(event.data))return;
 const {type,...data}=event.data as Record<string,unknown>;
 if(Object.keys(data).some(k=>!['taxonomyVersion','elementId','documentId','pageNumber'].includes(k)))return;
 if(type!=='tayco-review-viewer-interaction'||typeof data.elementId!=='string'||!frameElements.has(data.elementId))return;
 try{
  const {taxonomyVersion:_version,eventId:_id,...input}=parseReviewInteraction({...data,eventId:'00000000-0000-0000-0000-000000000000'});
  void _version;void _id;return input;
 }catch{return;}
}
export function injectViewerReviewBridge(html:string){
 const cleaned=html.replace(/<a\b[^>]*\bid=["']openPdfLink["'][^>]*>[\s\S]*?<\/a>/gi,'');
 const script='<script src="'+VIEWER_REVIEW_BRIDGE_PATH+'" defer></script>';
 if(cleaned.includes(script))return cleaned;
 if(/<\/head\s*>/i.test(cleaned))return cleaned.replace(/<\/head\s*>/i,script+'$&');
 if(/<\/body\s*>/i.test(cleaned))return cleaned.replace(/<\/body\s*>/i,script+'$&');
 throw new Error('The viewer shell is unavailable.');
}
