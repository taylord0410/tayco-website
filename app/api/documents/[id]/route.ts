import {get} from '@vercel/blob';
import {NextRequest,NextResponse} from 'next/server';
import {requireActor,AuthError} from '@/lib/auth';
import {ErpError} from '@/lib/erp';
import {getReadableDocument} from '@/lib/document-lifecycle';
import {VIEWER_PREFIX,TakeoffViewerAccessError,viewerScope} from '@/lib/takeoff-viewer-access';
export const runtime='nodejs';
const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
const sourceId=(value:unknown):value is string=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(value);
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 try{
  const actor=await requireActor(request),{id}=await context.params,entry=getReadableDocument(actor,id);
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
    getReadableDocument(actor,id);
    const query=new URLSearchParams({embed:'1',project:contextKey,document:viewerDocumentId,page:'1'});
    return new NextResponse(null,{status:307,headers:{...privateHeaders,Location:VIEWER_PREFIX+'/viewer/?'+query.toString()}});
   }
   if(typeof entry.data.blobPath!=='string'||!entry.data.blobPath)throw new ErpError(404,'Document unavailable. Contact TAYCO.');
   const result=await get(entry.data.blobPath,{access:'private'});
  if(!result||result.statusCode!==200)throw new ErpError(404,'Document unavailable. Contact TAYCO.');
  try{getReadableDocument(actor,id);}catch(error){await result.stream.cancel().catch(()=>{});throw error;}
  const reader=result.stream.getReader();
  const guarded=new ReadableStream<Uint8Array>({async pull(controller){try{getReadableDocument(actor,id);const chunk=await reader.read();getReadableDocument(actor,id);if(chunk.done)controller.close();else controller.enqueue(chunk.value);}catch(error){await reader.cancel().catch(()=>{});controller.error(error);}},cancel(reason){return reader.cancel(reason);}});
  return new Response(guarded,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="tayco-document"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){
  if(error instanceof TakeoffViewerAccessError){
   const status=[403,404,503].includes(error.status)?error.status:503;
   return NextResponse.json({error:status===503?'The protected document reader is unavailable.':'Document unavailable. Contact TAYCO.'},{status,headers:privateHeaders});
  }
  if(error instanceof AuthError||error instanceof ErpError)return NextResponse.json({error:error.message},{status:error.status,headers:privateHeaders});
  return NextResponse.json({error:'Unable to retrieve the document.'},{status:503,headers:privateHeaders});
 }
}
