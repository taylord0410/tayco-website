import { NextRequest, NextResponse } from 'next/server';
import { AuthError, requireActor, assertSameOrigin } from '@/lib/auth';
import { ErpError, execute, snapshot } from '@/lib/erp';
import { readJson } from '../submission';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function failure(error:unknown) {
 if(error instanceof AuthError || error instanceof ErpError)return NextResponse.json({success:false,error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});
 console.error('TAYCO operation failed',{type:error instanceof Error?error.name:'unknown'});
 return NextResponse.json({success:false,error:'Unable to complete this request. Your information has not been confirmed as saved.'},{status:503});
}
export async function GET(request:NextRequest) {
 try {
  const actor=await requireActor(request);
  if(request.nextUrl.searchParams.has('invite')||request.nextUrl.searchParams.has('tenant'))throw new ErpError(400,'Use your assigned account and project access.');
  return NextResponse.json({success:true,...snapshot(actor)},{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){return failure(error);}
}
export async function POST(request:NextRequest) {
 try {
  const actor=await requireActor(request);assertSameOrigin(request);
  const body=await readJson(request);
  const result=execute(actor,request.headers.get('Idempotency-Key')||'',body);
  return NextResponse.json({success:true,result,...snapshot(actor)},{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){return failure(error);}
}
