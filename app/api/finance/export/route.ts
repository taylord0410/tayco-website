import {withGuestRequestAudit} from '@/lib/review-request-audit';
import {NextRequest,NextResponse} from 'next/server';
import {AuthError,requireActor} from '@/lib/auth';
import {ErpError} from '@/lib/erp';
import {financeExport} from '@/lib/finance-export';
import {parseFinancialPeriod} from '@/lib/financial-periods';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handleGET(request:NextRequest) {
 try {
  const actor=await requireActor(request);
  const csv=financeExport(actor,request.nextUrl.searchParams.get('projectId')||undefined,parseFinancialPeriod(request.nextUrl.searchParams.get('year'),request.nextUrl.searchParams.get('month')));
  return new NextResponse(csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="tayco-recorded-finances.csv"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(error){
  if(error instanceof AuthError||error instanceof ErpError)return NextResponse.json({success:false,error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});
  if(error instanceof RangeError)return NextResponse.json({success:false,error:error.message},{status:422,headers:{'Cache-Control':'no-store'}});
  return NextResponse.json({success:false,error:'Export is unavailable. Try again later.'},{status:503,headers:{'Cache-Control':'no-store'}});
 }
}


export const GET=withGuestRequestAudit('workspace',handleGET);
