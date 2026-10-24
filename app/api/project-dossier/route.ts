import {withGuestRequestAudit} from '@/lib/review-request-audit';
import {NextRequest,NextResponse} from 'next/server';
import {requireActor,requireRole,AuthError} from '@/lib/auth';
import {ErpError} from '@/lib/erp';
import {projectDossier} from '@/lib/project-dossier';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handleGET(request:NextRequest){
 try{const actor=await requireActor(request);requireRole(actor,['admin','staff','client']);const id=request.nextUrl.searchParams.get('projectId');if(!id)throw new ErpError(422,'Select an assigned project.');const result=projectDossier(actor,id);return new NextResponse(JSON.stringify(result,null,2),{headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="tayco-project-dossier.json"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
 catch(error){const status=error instanceof AuthError||error instanceof ErpError?error.status:503;return NextResponse.json({success:false,error:status===503?'Dossier is unavailable.':error instanceof Error?error.message:'Unable to load dossier.'},{status,headers:{'Cache-Control':'no-store'}});}
}

export const GET=withGuestRequestAudit('workspace',handleGET);
