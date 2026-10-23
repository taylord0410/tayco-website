import {get} from '@vercel/blob';
import {NextRequest,NextResponse} from 'next/server';
import {requireActor,AuthError} from '@/lib/auth';
import {ErpError} from '@/lib/erp';
import {getReadableDocument} from '@/lib/document-lifecycle';
export const runtime='nodejs';
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 try{
  const actor=await requireActor(request),{id}=await context.params,entry=getReadableDocument(actor,id);
  const result=await get(String(entry.data.blobPath),{access:'private'});
  if(!result||result.statusCode!==200)throw new ErpError(404,'Document unavailable. Contact TAYCO.');
  try{getReadableDocument(actor,id);}catch(error){await result.stream.cancel().catch(()=>{});throw error;}
  const reader=result.stream.getReader();
  const guarded=new ReadableStream<Uint8Array>({async pull(controller){try{getReadableDocument(actor,id);const chunk=await reader.read();getReadableDocument(actor,id);if(chunk.done)controller.close();else controller.enqueue(chunk.value);}catch(error){await reader.cancel().catch(()=>{});controller.error(error);}},cancel(reason){return reader.cancel(reason);}});
  return new Response(guarded,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="tayco-document"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){if(error instanceof AuthError||error instanceof ErpError)return NextResponse.json({error:error.message},{status:error.status});return NextResponse.json({error:'Unable to retrieve the document.'},{status:503});}
}
