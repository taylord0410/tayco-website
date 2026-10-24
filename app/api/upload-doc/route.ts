import {withGuestRequestAudit} from '@/lib/review-request-audit';
import {put} from '@vercel/blob';
import {randomUUID} from 'node:crypto';
import {mkdirSync,writeFileSync,unlinkSync} from 'node:fs';
import path from 'node:path';
import {NextRequest,NextResponse} from 'next/server';
import {requireActor,assertSameOrigin,AuthError} from '@/lib/auth';
import {registerDocument,validateDocumentProject,ErpError} from '@/lib/erp';
export const runtime='nodejs';
const MAX=10*1024*1024;
async function handlePOST(request:NextRequest){
 let journal:string|undefined;
 try{
  const actor=await requireActor(request);assertSameOrigin(request);
  if(!['admin','staff','vendor'].includes(actor.role))throw new ErpError(403,'Upload is available to assigned providers and TAYCO team members.');
  if(!process.env.BLOB_READ_WRITE_TOKEN)throw new ErpError(503,'Secure storage is not configured. Contact your TAYCO coordinator.');
  if(Number(request.headers.get('content-length')||0)>MAX+128000)throw new ErpError(413,'Choose a file smaller than 10 MB.');
  const reader=request.body?.getReader();if(!reader)throw new ErpError(400,'Choose a document.');
  const chunks:Uint8Array[]=[];let total=0;while(true){const {done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX+128000){await reader.cancel();throw new ErpError(413,'Choose a file smaller than 10 MB.');}chunks.push(value);}
  const form=await new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('content-type')||''}}).formData(),file=form.get('file'),type=form.get('type');
  if(!(file instanceof File)||!file.size||file.size>MAX)throw new ErpError(422,'Choose a file between 1 byte and 10 MB.');
  if(!['w9','insurance','project'].includes(String(type)))throw new ErpError(422,'Choose a document type.');
  const bytes=Buffer.from(await file.arrayBuffer());
  const ext=bytes.subarray(0,5).toString()==='%PDF-'?'pdf':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'jpg':bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'png':null;
  if(!ext)throw new ErpError(422,'Use a PDF, JPEG or PNG document.');
  const contentType=ext==='pdf'?'application/pdf':ext==='jpg'?'image/jpeg':'image/png';
  const projectId=String(form.get('projectId')||'')||undefined;validateDocumentProject(actor,projectId);
  const blobPath='vendor-docs/'+String(type)+'-'+randomUUID()+'.'+ext;
  const journalDir=path.join(path.dirname(process.env.TAYCO_ERP_DB_PATH||path.join(process.cwd(),'.data','tayco-erp.sqlite')),'upload-intents');mkdirSync(journalDir,{recursive:true,mode:0o700});journal=path.join(journalDir,randomUUID()+'.json');
  writeFileSync(journal,JSON.stringify({blobPath,actorId:actor.id,createdAt:new Date().toISOString()}),{flag:'wx',mode:0o600});
  const blob=await put(blobPath,bytes,{access:'private',contentType,addRandomSuffix:false});
  const entry=registerDocument(actor,{blobPath:blob.pathname,name:file.name.slice(0,160),contentType,type:String(type),projectId:String(form.get('projectId')||'')||undefined});
  if(journal){try{unlinkSync(journal);}catch{console.error('TAYCO upload intent retained for reconciliation');}}
  return NextResponse.json({success:true,documentId:entry.id,status:'pending_review'},{headers:{'Cache-Control':'no-store'}});
 }catch(error){
  if(journal)console.error('TAYCO upload requires private intent reconciliation; receipt not confirmed');
  if(error instanceof AuthError||error instanceof ErpError)return NextResponse.json({success:false,error:error.message},{status:error.status});
  console.error('TAYCO document upload failed');return NextResponse.json({success:false,error:'The document was not confirmed as received. Please retry.'},{status:503});
 }
}

export const POST=withGuestRequestAudit('document',handlePOST);
