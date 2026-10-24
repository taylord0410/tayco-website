import { randomUUID } from 'node:crypto';
import { ErpError } from './erp';
import { TakeoffViewerAccessError } from './takeoff-viewer-access';
import { AuthError,type Actor } from './auth';
import { auditContextForGuest,recordReviewAudit,ReviewAuditError,type ReviewAuditInput } from './review-audit';

type Surface=ReviewAuditInput['surface'];
type Resource={kind:NonNullable<ReviewAuditInput['resourceKind']>;id:string};
export function auditFailureReason(error:unknown,status:number,actor?:Actor):NonNullable<ReviewAuditInput['reason']>{
 const code=error instanceof AuthError?error.reasonCode:undefined;
 if(code==='review_expired'||(status===401&&actor?.review&&actor.review.expiresAt<=Date.now()))return 'expired';
 if(code==='review_revoked')return 'revoked';
 if(status===401)return 'unauthenticated';
 if(error instanceof Error&&error.message==='Month closed')return 'month_closed';
 if(status>=500)return 'unavailable';
 if([400,405,413,415,416,422,429].includes(status))return 'invalid_request';
 return 'not_authorized';
}
/** Resource IDs may be supplied only after server-side scope validation. */
export function auditGuestRead(actor:Actor,surface:Surface,statusCode=200,resource?:Resource,responseKind:ReviewAuditInput['responseKind']='none'){
 if(actor.role!=='guest')return;
 return recordReviewAudit(auditContextForGuest(actor),{kind:'access.allowed',surface,statusCode,responseKind,
  ...(resource?{resourceKind:resource.kind,resourceId:resource.id}:{})});
}
/** Preserve denial when logging works; return logging failure for a generic503 when it does not.
 * No resource ID or raw error text enters a denial event. */
export function auditGuestFailure(actor:Actor|undefined,surface:Surface,error:unknown,status:number):unknown{
 if(!actor||actor.role!=='guest'||error instanceof ReviewAuditError)return error;
 try{
  recordReviewAudit(auditContextForGuest(actor),{kind:'access.denied',surface,statusCode:status,reason:auditFailureReason(error,status,actor)});
  return error;
 }catch(failure){return failure;}
}
/** Counts bytes released into the server response pipe, not recipient acknowledgements or human reading.
 * Existing scope guards must remain; recheck is run before AND after each pending source read. */
export function auditedGuestDocumentStream(source:ReadableStream<Uint8Array>,actor:Actor,surface:'document'|'viewer',resource:Resource,
 options:{statusCode:200|206;responseKind:'full'|'range';recheck:()=>Promise<void>;signal?:AbortSignal;onFinish?:()=>void}):ReadableStream<Uint8Array>{
 const ctx=actor.role==='guest'?auditContextForGuest(actor):undefined;
 const spanId=randomUUID(),reader=source.getReader();
 try{
  if(ctx)recordReviewAudit(ctx,{kind:'document.started',surface,spanId,statusCode:options.statusCode,
   responseKind:options.responseKind,resourceKind:resource.kind,resourceId:resource.id});
 }catch(error){options.onFinish?.();void reader.cancel().catch(()=>{});throw error;}
 let bytes=0,finished=false,controller:ReadableStreamDefaultController<Uint8Array>|undefined;
 function end(kind:'document.completed'|'document.cancelled'|'upstream.failed',status:number,reason:NonNullable<ReviewAuditInput['reason']>){
  if(finished)return;
  finished=true;options.signal?.removeEventListener('abort',abort);
  try{if(ctx)recordReviewAudit(ctx,{kind,surface,spanId,statusCode:status,reason,responseKind:options.responseKind,
   resourceKind:resource.kind,resourceId:resource.id,bytesSent:bytes});}finally{options.onFinish?.();}
 }
 function abort(){
  if(finished)return;
  try{end('document.cancelled',499,'cancelled');}
  catch{/* The stream errors and the retained start remains incomplete if the audit store is unavailable. */}
  void reader.cancel().catch(()=>{});
  try{controller?.error(new Error('The document transfer was interrupted.'));}catch{/* Consumer may already be closed. */}
 }
 return new ReadableStream<Uint8Array>({
  start(target){controller=target;options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();},
  async pull(target){
   if(finished)return;
   try{
    await options.recheck();if(finished)return;
    const chunk=await reader.read();if(finished)return;
    await options.recheck();if(finished)return;
    if(chunk.done){end('document.completed',options.statusCode,'none');target.close();}
    else{bytes+=chunk.value.byteLength;target.enqueue(chunk.value);}
   }catch(error){
    if(finished){try{target.error(new Error('The document transfer was interrupted.'));}catch{}return;}
    let cause=error;
    try{await options.recheck();}catch(current){cause=current;}
    const status=cause instanceof AuthError||cause instanceof ErpError||cause instanceof TakeoffViewerAccessError?cause.status:503;
    try{end(status<500?'document.cancelled':'upstream.failed',status,auditFailureReason(cause,status,actor));}catch{/* Never claim EOF when a terminal audit cannot be saved. */}
    await reader.cancel().catch(()=>{});
    target.error(new Error('The document transfer was interrupted.'));
   }
  },
  async cancel(){
   if(!finished){try{end('document.cancelled',499,'cancelled');}finally{await reader.cancel().catch(()=>{});}}
  },
 },{highWaterMark:0});
}
