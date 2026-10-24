import {withGuestRequestAudit} from '@/lib/review-request-audit';
import {NextRequest,NextResponse} from 'next/server';
import {requireActor,AuthError} from '@/lib/auth';
import {snapshot,ErpError} from '@/lib/erp';
import {financialPeriods,parseFinancialPeriod} from '@/lib/financial-periods';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handleGET(request:NextRequest){
 try{
  const actor=await requireActor(request),data=snapshot(actor),projectId=request.nextUrl.searchParams.get('projectId')||undefined;
  if(projectId&&!data.entries.some(e=>e.kind==='project'&&e.id===projectId))throw new ErpError(404,'Project not found.');
  const selection=parseFinancialPeriod(request.nextUrl.searchParams.get('year'),request.nextUrl.searchParams.get('month'));
  return NextResponse.json({success:true,report:financialPeriods(data.entries,{...selection,projectId,asOf:new Date().toISOString()})},{headers:{'Cache-Control':'private, no-store'}});
 }catch(error){const status=error instanceof AuthError||error instanceof ErpError?error.status:error instanceof RangeError?422:503;return NextResponse.json({success:false,error:status===503?'Monthly reporting is unavailable.':error instanceof Error?error.message:'Unable to load reporting.'},{status,headers:{'Cache-Control':'no-store'}});}
}

export const GET=withGuestRequestAudit('workspace',handleGET);
