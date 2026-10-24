import { AsyncLocalStorage } from 'node:async_hooks';
import { recordReviewAudit,type ReviewAuditContext,type ReviewAuditInput } from './review-audit';

type Frame={context?:ReviewAuditContext;reason?:NonNullable<ReviewAuditInput['reason']>;status?:number;reauthorize?:()=>Promise<void>};
const frames=new AsyncLocalStorage<Frame>();
/** Only auth.ts calls this after looking up a real active server session.
 * A known persisted review binding can be observed even if its grant subsequently denies access.
 * This metadata never authorizes the request. No client-supplied identity is accepted here. */
export function rememberReviewAuditContext(context:ReviewAuditContext,reauthorize:()=>Promise<void>){
 const frame=frames.getStore();
 if(frame&&!frame.context){frame.context=Object.freeze({...context});frame.reauthorize=reauthorize;}
}
function reason(error:unknown,status:number):NonNullable<ReviewAuditInput['reason']>{
 const code=error&&typeof error==='object'&&'reasonCode'in error?error.reasonCode:undefined;
 if(code==='review_expired')return 'expired';
 if(code==='review_revoked')return 'revoked';
 if(status===401)return 'unauthenticated';
 if(error instanceof Error&&error.message==='Month closed')return 'month_closed';
 if(status>=500)return 'unavailable';
 if([400,405,413,415,416,422,429].includes(status))return 'invalid_request';
 return 'not_authorized';
}
export function noteReviewAuditFailure(error:unknown,status:number){
 const frame=frames.getStore();if(frame){frame.reason=reason(error,status);frame.status=status;}
}
function unavailable(request:Request,original?:Response){
 if(original?.body)void original.body.cancel().catch(()=>{});
 const headers=new Headers({'Cache-Control':'private, no-store','Pragma':'no-cache','Vary':'Cookie','Content-Type':'application/json','X-Content-Type-Options':'nosniff'});
 for(const name of ['Cross-Origin-Embedder-Policy','Cross-Origin-Resource-Policy','X-Frame-Options','Content-Security-Policy','X-Robots-Tag']){
  const value=original?.headers.get(name);if(value)headers.set(name,value);
 }
 return new Response(request.method==='HEAD'?null:JSON.stringify({error:'The private review is temporarily unavailable. Please try again.'}),{status:503,headers});
}
async function recheckAfterAudit(frame:Frame,surface:ReviewAuditInput['surface']){
 try{await frame.reauthorize?.();}
 catch(error){
  const status=error&&typeof error==='object'&&'status'in error&&Number.isInteger(error.status)&&[401,403].includes(Number(error.status))?Number(error.status):503;
  if(frame.context)recordReviewAudit(frame.context,{kind:'access.denied',surface,statusCode:status,reason:reason(error,status)});
  throw error;
 }
}
function ended(request:Request,error:unknown,original:Response){
 const clean=unavailable(request,original);
 const status=error&&typeof error==='object'&&'status'in error&&[401,403].includes(Number(error.status))?Number(error.status):503;
 const code=error&&typeof error==='object'&&'reasonCode'in error&&['review_expired','review_revoked','review_required'].includes(String(error.reasonCode))?String(error.reasonCode):undefined;
 return new Response(request.method==='HEAD'?null:JSON.stringify({error:status===503?'The private review is temporarily unavailable.':'Review access has ended. Please sign in again.',...(code?{reasonCode:code}:{})}),{status,headers:clean.headers});
}
/** Observes a server component's permitted data projection or guard denial.
 * This is not proof of HTTP body completion, client hydration or a human visit.
 * A failed audit rejects the render before the private projection can be returned. */
export function withGuestRenderAudit<T>(surface:ReviewAuditInput['surface'],render:()=>Promise<T>):Promise<T>{
 return frames.run({},async()=>{
  const frame=frames.getStore()!;
  let result:T;
  try{result=await render();}
  catch(error){
   if(frame.context){
    const status=frame.status??(error&&typeof error==='object'&&'status'in error&&Number.isInteger(error.status)&&Number(error.status)>=400&&Number(error.status)<=599?Number(error.status):500);
    recordReviewAudit(frame.context,{kind:'access.denied',surface,statusCode:status,reason:frame.reason??reason(error,status)});
   }
   throw error;
  }
  if(frame.context){
   if(frame.status&&frame.status>=400)recordReviewAudit(frame.context,{kind:'access.denied',surface,statusCode:frame.status,reason:frame.reason??reason(undefined,frame.status)});
   else {recordReviewAudit(frame.context,{kind:'access.allowed',surface,statusCode:200});await recheckAfterAudit(frame,surface);}
  }
  return result;
 });
}
/** One event per observed HTTP result; it is neither a click nor proof of body delivery.
 * Args retain the original Next handler signature, including dynamic route context. */
export function withGuestRequestAudit<Args extends [Request,...unknown[]]>(
 surface:ReviewAuditInput['surface'],handler:(...args:Args)=>Response|Promise<Response>
):(...args:Args)=>Promise<Response>{
 return (...args:Args)=>frames.run({},async()=>{
  const frame=frames.getStore()!,request=args[0];
  let response:Response;
  try{response=await handler(...args);}
  catch(error){
   if(frame.context){
    try{recordReviewAudit(frame.context,{kind:'access.denied',surface,statusCode:500,reason:reason(error,500)});}
    catch{return unavailable(request);}
   }
   throw error;
  }
  if(!frame.context)return response;
  try{
   const statusCode=response.status;
   if(statusCode>=400)recordReviewAudit(frame.context,{kind:'access.denied',surface,statusCode,reason:frame.reason??reason(undefined,statusCode)});
   else recordReviewAudit(frame.context,{kind:'access.allowed',surface,statusCode,
    responseKind:request.method==='HEAD'?'head':statusCode===206?'range':statusCode===304?'not_modified':statusCode>=300?'redirect':'none'});
   if(statusCode<400&&['GET','HEAD'].includes(request.method)){try{await recheckAfterAudit(frame,surface);}catch(error){return ended(request,error,response);}}
   return response;
  }catch{return unavailable(request,response);}
 });
}
