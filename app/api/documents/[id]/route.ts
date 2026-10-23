import {get} from '@vercel/blob';
import {NextRequest,NextResponse} from 'next/server';
import {requireActor,AuthError} from '@/lib/auth';
import {documentForActor,ErpError} from '@/lib/erp';
export const runtime='nodejs';
export async function GET(request:NextRequest,context:{params:Promise<{id:string}>}){
 try{
  const actor=await requireActor(request),{id}=await context.params,entry=documentForActor(actor,id);
  const result=await get(String(entry.data.blobPath),{access:'private'});
  if(!result||result.statusCode!==200)throw new ErpError(404,'Document unavailable. Contact TAYCO.');
  return new Response(result.stream,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="tayco-document"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){if(error instanceof AuthError||error instanceof ErpError)return NextResponse.json({error:error.message},{status:error.status});return NextResponse.json({error:'Unable to retrieve the document.'},{status:503});}
}
