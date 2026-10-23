import {NextRequest,NextResponse} from 'next/server';
import {requireActor,assertSameOrigin,AuthError} from '@/lib/auth';
import {ErpError} from '@/lib/erp';
import {processNotifications} from '@/lib/notifications';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try{const actor=await requireActor(request);assertSameOrigin(request);return NextResponse.json({success:true,...await processNotifications(actor)},{headers:{'Cache-Control':'no-store'}});}
 catch(error){if(error instanceof AuthError||error instanceof ErpError)return NextResponse.json({success:false,error:error.message},{status:error.status});return NextResponse.json({success:false,error:'Delivery is unavailable. Your requests remain saved.'},{status:503});}
}
