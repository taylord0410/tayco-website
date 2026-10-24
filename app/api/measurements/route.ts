import {NextResponse} from 'next/server';
import {AuthError} from '@/lib/auth';
import {M02IntakeError,measurementReview} from '@/lib/m02-intake';
import {withGuestRequestAudit} from '@/lib/review-request-audit';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handleGET(request:Request){
 try{
  const url=new URL(request.url);
  if([...url.searchParams.keys()].some(key=>key!=='projectId')||url.searchParams.getAll('projectId').length!==1)throw new M02IntakeError(422,'Select one existing project.');
  return NextResponse.json(await measurementReview(request,url.searchParams.get('projectId')??''),{headers:{'Cache-Control':'private, no-store','Pragma':'no-cache'}});
 }catch(error){
  const known=error instanceof AuthError||error instanceof M02IntakeError;
  return NextResponse.json({error:known?error.message:'Measurement review is temporarily unavailable.'},{status:known?error.status:503,headers:{'Cache-Control':'private, no-store','Pragma':'no-cache'}});
 }
}
export const GET=withGuestRequestAudit('workspace',handleGET);
