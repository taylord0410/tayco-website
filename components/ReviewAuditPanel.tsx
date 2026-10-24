"use client";
import { useEffect,useRef,useState } from 'react';
import type { reviewAuditReport } from '@/lib/review-audit';
import type { reviewInteractionReport } from '@/lib/review-interactions';
import { REVIEW_INTERACTION_LABELS } from '@/lib/review-interaction-contract';
type Bundle={audit:ReturnType<typeof reviewAuditReport>;interactions:ReturnType<typeof reviewInteractionReport>};
const kinds:Record<string,string>={
 'review.created':'Review generated','review.token_rotated':'Review link replaced','review.claimed':'Review accepted',
 'auth.session_started':'Session started','auth.signout':'Session signed out','review.revoked':'Review revoked',
 'review.expired_observed':'Expiry observed','access.allowed':'Server permission observed','access.denied':'Server denial observed',
 'document.started':'Transfer started','document.completed':'Server transfer reached EOF','document.cancelled':'Transfer cancelled','upstream.failed':'Transfer failed',
};
const reasons:Record<string,string>={none:'',unauthenticated:'Session unavailable',expired:'Expired',revoked:'Revoked',not_authorized:'Not authorized',month_closed:'Month closed',invalid_request:'Invalid request',unavailable:'Unavailable',cancelled:'Cancelled'};
const button="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#173252]/20 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#a66a20]";
const object=(x:unknown):x is Record<string,unknown>=>!!x&&typeof x==='object'&&!Array.isArray(x);
const count=(x:unknown)=>Number.isSafeInteger(x)&&Number(x)>=0;
const id=(x:unknown):x is string=>typeof x==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(x);
const date=(x:unknown):x is string=>typeof x==='string'&&x.endsWith('Z')&&Number.isFinite(Date.parse(x));
function valid(x:unknown):x is Bundle{
 if(!object(x)||!object(x.audit)||!object(x.interactions))return false;
 const a=x.audit,c=x.interactions;
 for(const r of[a,c])if(!count(r.totalEvents)||!Array.isArray(r.events)||r.events.length>200||!Array.isArray(r.counts)||r.counts.length>30||!date(r.generatedAt)||!date(r.windowStart)||!Number.isInteger(r.retentionDays)||Number(r.retentionDays)<1||Number(r.retentionDays)>365||!object(r.coverage)||r.coverage.provesHumanReading!==false||!count(r.coverage.prunedByRetention)||!count(r.coverage.prunedByCap))return false;
 if(!object(a.coverage)||!count(a.coverage.incompleteRetainedTransports)||!object(c.coverage)||c.coverage.requiresConsent!==true||c.coverage.provesDelivery!==false||c.taxonomyVersion!==2)return false;
 const events=(r:Record<string,unknown>,client:boolean)=>(r.events as unknown[]).every(e=>object(e)&&id(e.eventId)&&id(e.reviewId)&&id(e.actorId)&&date(e.createdAt)&&
  (client?typeof e.elementId==='string'&&Object.hasOwn(REVIEW_INTERACTION_LABELS,e.elementId):
   typeof e.kind==='string'&&Object.hasOwn(kinds,e.kind)&&typeof e.reason==='string'&&Object.hasOwn(reasons,e.reason)&&
   (e.resourceId===undefined||id(e.resourceId))&&(e.bytesSent===undefined||count(e.bytesSent))));
 return events(a,false)&&events(c,true)&&(a.counts as unknown[]).every(v=>object(v)&&typeof v.kind==='string'&&Object.hasOwn(kinds,v.kind)&&count(v.count))&&
  (c.counts as unknown[]).every(v=>object(v)&&typeof v.elementId==='string'&&Object.hasOwn(REVIEW_INTERACTION_LABELS,v.elementId)&&count(v.count));
}
async function read(scope:string,signal:AbortSignal):Promise<Bundle>{
 const response=await fetch('/api/review-audit'+(scope?'?'+new URLSearchParams({reviewId:scope}):''),{credentials:'same-origin',cache:'no-store',signal});
 if(!response.ok)throw new Error(response.status===403?'Administrator access is required.':response.status===401?'Sign in again to view review activity.':'The review report is unavailable. Try again.');
 const data:unknown=await response.json();if(!valid(data))throw new Error('The review report could not be verified. Try again.');return data;
}
const short=(s:string)=>s.length>22?s.slice(0,10)+'…'+s.slice(-6):s;
const when=(s:string)=>new Date(s).toLocaleString('en-US',{timeZone:'UTC',dateStyle:'medium',timeStyle:'short'})+' UTC';
export default function ReviewAuditPanel(){
 const[report,setReport]=useState<Bundle|null>(null),[scope,setScope]=useState(''),[reviews,setReviews]=useState<string[]>([]),[busy,setBusy]=useState(true),[error,setError]=useState('');
 const pending=useRef<AbortController|null>(null);
 function install(data:Bundle){setReport(data);setReviews(previous=>[...new Set([...previous,...data.audit.events.map(e=>e.reviewId),...data.interactions.events.map(e=>e.reviewId)])].sort());}
 useEffect(()=>{const controller=new AbortController();pending.current=controller;
  void read('',controller.signal).then(data=>{if(!controller.signal.aborted)install(data);}).catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Report unavailable.');}).finally(()=>{if(!controller.signal.aborted)setBusy(false);});
  return()=>pending.current?.abort();
 },[]);
 async function load(next=scope,reset=false){
  pending.current?.abort();const controller=new AbortController();pending.current=controller;setBusy(true);setError('');if(reset)setReport(null);
  try{const data=await read(next,controller.signal);if(!controller.signal.aborted)install(data);}
  catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Report unavailable.');}
  finally{if(!controller.signal.aborted)setBusy(false);}
 }
 return <section className="min-w-0 space-y-4 border-t border-[#173252]/15 pt-6 text-[#173252]" aria-labelledby="review-audit-heading">
  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 id="review-audit-heading" className="text-xl font-semibold">Review access &amp; selected controls</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">Server permission decisions and transfers are separate from optional interface selections. Neither proves that a person read a document.</p></div><button className={button} disabled={busy} onClick={()=>void load()}>{busy?'Loading…':'Refresh review report'}</button></div>
  <label className="block text-sm font-medium">Review<select className="mt-2 block min-h-11 max-w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" value={scope} onChange={e=>{const next=e.target.value;if(next&&!id(next))return;setScope(next);void load(next,true);}}><option value="">All company reviews</option>{reviews.map(v=><option key={v} value={v}>Review {short(v)}</option>)}</select></label>
  {busy&&<p role="status" className="text-sm text-slate-600">Loading retained observations…</p>}
  {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}{report&&<p className="mt-2">The earlier report below has not been updated.</p>}</div>}
  {report&&<div className="min-w-0 space-y-4" aria-busy={busy}>
   <dl className="grid min-w-0 gap-3 sm:grid-cols-3">{[['Server observations',report.audit.totalEvents],['Optional control selections',report.interactions.totalEvents],['Transfers without retained terminal',report.audit.coverage.incompleteRetainedTransports]].map(([label,n])=><div key={label} className="min-w-0 rounded-xl border border-[#173252]/15 bg-white p-4"><dt className="text-xs text-slate-600">{label}</dt><dd className="mt-2 break-words text-2xl font-semibold">{Number(n).toLocaleString('en-US')}</dd></div>)}</dl>
   <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-slate-700">Coverage is partial. A permitted handler decision may be followed by a denial before its response is released. EOF records bytes placed in the server response pipe; a Range completion covers only that requested segment. It does not prove browser receipt, PDF rendering or human reading. Optional selections require consent and may be missing after a closed tab, offline period or retry limit. Unknown or invalid sessions are not assigned to a review.</p>
   <div className="space-y-2 text-xs leading-relaxed text-slate-600"><p>Essential observations: up to {report.audit.retentionDays} days and 10,000 events per company. Retention removals {report.audit.coverage.prunedByRetention}; capacity removals {report.audit.coverage.prunedByCap}.</p><p>Optional selections: up to {report.interactions.retentionDays} days and 10,000 events per company. Retention removals {report.interactions.coverage.prunedByRetention}; capacity removals {report.interactions.coverage.prunedByCap}. Removal counters cover the company, including when one review is selected.</p><p>Server report updated {when(report.audit.generatedAt)}. Optional report updated {when(report.interactions.generatedAt)}. Each list shows at most 200 retained events. These are event counts, not unique people or documents.</p></div>
   <details className="min-w-0 rounded-xl border border-slate-200 bg-white"><summary className="min-h-11 cursor-pointer p-4 text-sm font-semibold">Essential server observations · {report.audit.events.length} shown</summary><ol className="max-h-96 min-w-0 space-y-2 overflow-y-auto p-4">{report.audit.events.map(e=><li key={e.eventId} className="min-w-0 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-medium">{kinds[e.kind]}{e.responseKind==='range'?' · Range segment':e.responseKind==='head'?' · Metadata only':''}</p><p className="mt-1 break-all text-xs text-slate-600">Review {short(e.reviewId)} · Account {short(e.actorId)}{e.statusCode? ' · Status '+e.statusCode:''}{e.reason!=='none'?' · '+reasons[e.reason]:''}</p>{e.resourceId&&<p className="mt-1 break-all text-xs text-slate-600">{e.resourceKind==='asset'?'Asset':'Document'} {short(e.resourceId)}{e.bytesSent!==undefined?' · '+e.bytesSent.toLocaleString('en-US')+' bytes placed in response pipe':''}</p>}<time dateTime={e.createdAt} className="mt-1 block text-xs text-slate-600">{when(e.createdAt)}</time></li>)}</ol>{!report.audit.events.length&&<p className="p-4 text-sm text-slate-600">No retained server observations in this selection.</p>}</details>
   <details className="min-w-0 rounded-xl border border-slate-200 bg-white"><summary className="min-h-11 cursor-pointer p-4 text-sm font-semibold">Optional interface selections · {report.interactions.events.length} shown</summary><p className="px-4 text-xs text-slate-600">Reported by the identified interface controls with consent. Earlier monthly controls are listed separately below.</p><ol className="max-h-96 min-w-0 space-y-2 overflow-y-auto p-4">{report.interactions.events.map(e=><li key={e.reviewId+e.eventId} className="min-w-0 rounded-lg bg-slate-50 p-3 text-sm"><p className="font-medium">{REVIEW_INTERACTION_LABELS[e.elementId]}</p><p className="mt-1 break-all text-xs text-slate-600">Review {short(e.reviewId)} · Account {short(e.actorId)}{e.section?' · Module '+e.section:''}{e.period?' · Month '+e.period:''}{e.year?' · Year '+e.year:''}{e.pageNumber?' · Requested page '+e.pageNumber:''}</p><time dateTime={e.createdAt} className="mt-1 block text-xs text-slate-600">{when(e.createdAt)}</time></li>)}</ol>{!report.interactions.events.length&&<p className="p-4 text-sm text-slate-600">No optional selections recorded for this review and retention window. This does not establish that the review was unopened.</p>}</details>
  </div>}
 </section>;
}
