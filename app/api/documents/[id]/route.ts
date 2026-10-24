import {auditedGuestDocumentStream} from '@/lib/review-access-audit';
import { withGuestRequestAudit,noteReviewAuditFailure } from '@/lib/review-request-audit';
import {get} from '@vercel/blob';
import {NextRequest,NextResponse} from 'next/server';
import {requireActor,AuthError} from '@/lib/auth';
import {ErpError} from '@/lib/erp';
import {getReadableDocument} from '@/lib/document-lifecycle';
import {guestConsoleDocument} from '@/lib/guest-workspace';
import {VIEWER_PREFIX,TakeoffViewerAccessError,viewerScope} from '@/lib/takeoff-viewer-access';
export const runtime='nodejs';
const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const sourceId=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value);
async function handleGET(request:NextRequest,context:{params:Promise<{id:string}>}){
 try{
  const actor=await requireActor(request),{id}=await context.params;
  const readable=async()=>{const fresh=await requireActor(request);if(fresh.id!==actor.id||fresh.tenantId!==actor.tenantId||fresh.role!==actor.role)throw new AuthError('Document access changed.',403);return fresh.role==='guest'?guestConsoleDocument(fresh,id):getReadableDocument(fresh,id);};
  const entry=await readable();
  if(entry.data.storage==='takeoff_viewer'){
    const {viewerDocumentId,bundleId,contextKey,manifestSha256,relationsId}=entry.data;
    if(!entry.projectId||!sourceId(viewerDocumentId)||!sourceId(bundleId)||!sourceId(contextKey)||
      typeof manifestSha256!=='string'||!/^[a-f0-9]{64}$/.test(manifestSha256)||
      typeof relationsId!=='string'||!/^relations-[a-f0-9]{64}$/.test(relationsId))throw new ErpError(404,'Document unavailable. Contact TAYCO.');
    if(!process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL)throw new ErpError(503,'The protected document reader is unavailable.');
    const scope=viewerScope(actor,entry.projectId);
    if(scope.bundleId!==bundleId||scope.manifestSha256!==manifestSha256||scope.relationsId!==relationsId||
      !scope.documentIds.includes(viewerDocumentId)||!scope.contexts.some(item=>item.key===contextKey&&item.documentIds.includes(viewerDocumentId)))
      throw new ErpError(404,'Document unavailable. Contact TAYCO.');
    const current=await readable();
    if(current.id!==entry.id||current.projectId!==entry.projectId||current.version!==entry.version||
      JSON.stringify(viewerScope(actor,entry.projectId))!==JSON.stringify(scope))throw new ErpError(404,'Document unavailable. Contact TAYCO.');
    const query=new URLSearchParams({embed:'1',project:contextKey,document:viewerDocumentId,page:'1'});
    return new NextResponse(null,{status:307,headers:{...privateHeaders,Location:VIEWER_PREFIX+'/viewer/?'+query.toString()}});
   }
   if(typeof entry.data.blobPath!=='string'||!entry.data.blobPath)throw new ErpError(404,'Document unavailable. Contact TAYCO.');
   const result=await get(entry.data.blobPath,{access:'private'});
  if(!result||result.statusCode!==200)throw new ErpError(404,'Document unavailable. Contact TAYCO.');
  try{await readable();}catch(error){await result.stream.cancel().catch(()=>{});throw error;}
  const guarded=auditedGuestDocumentStream(result.stream,actor,'document',{kind:'document',id},
   {statusCode:200,responseKind:'full',recheck:async()=>{await readable();},signal:request.signal});
  try{await readable();}catch(error){await guarded.cancel().catch(()=>{});throw error;}
  return new Response(guarded,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="tayco-document"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){
  noteReviewAuditFailure(error,error instanceof AuthError||error instanceof ErpError||error instanceof TakeoffViewerAccessError?error.status:503);
  if(error instanceof TakeoffViewerAccessError){
   const status=[403,404,503].includes(error.status)?error.status:503;
   return NextResponse.json({error:status===503?'The protected document reader is unavailable.':'Document unavailable. Contact TAYCO.'},{status,headers:privateHeaders});
  }
  if(error instanceof AuthError||error instanceof ErpError)return NextResponse.json({error:error.message},{status:error.status,headers:privateHeaders});
  return NextResponse.json({error:'Unable to retrieve the document.'},{status:503,headers:privateHeaders});
 }
}

export const GET=withGuestRequestAudit('document',handleGET);
