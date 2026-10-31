import {NextResponse} from 'next/server';
import {assertSameOrigin,AuthError,rateLimit,revalidateRequestActor} from '@/lib/auth';
import {readAuthBody} from '@/lib/auth-http';
import {requireSecurityAdmin} from '@/lib/guard-admin';
import {GuardError,guardAdminSnapshot,guardOrigin,issueReviewGrant,revokeDebugGrant,resolveGuardReview,setGuardMode} from '@/lib/automation-guard';
export const runtime='nodejs';export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer',...(status===429?{'Retry-After':'60'}:{})}});
const failure=(error:unknown)=>json({error:error instanceof AuthError||error instanceof GuardError?error.message:'Security administration is temporarily unavailable.'},error instanceof AuthError||error instanceof GuardError?error.status:503);
export async function GET(request:Request){try{await requireSecurityAdmin(request);return json(guardAdminSnapshot());}catch(e){return failure(e);}}
export async function POST(request:Request){try{
 const actor=await requireSecurityAdmin(request);assertSameOrigin(request);
 if(request.headers.get('origin')!==guardOrigin(request))throw new GuardError('Use the configured website origin.',403);
 rateLimit('security-admin:'+actor.id,20,60_000);const body=await readAuthBody(request);revalidateRequestActor(actor);
 if(body.op==='issue')return json(issueReviewGrant(typeof body.reviewId==='string'?body.reviewId:'',guardOrigin(request),actor.id,typeof body.purpose==='string'?body.purpose:''),201);
 if(body.op==='resolve')return json(resolveGuardReview(typeof body.reviewId==='string'?body.reviewId:'',guardOrigin(request),actor.id,typeof body.purpose==='string'?body.purpose:'',typeof body.incidentId==='string'?body.incidentId:null));
 if(body.op==='revoke'){if(typeof body.id!=='string')throw new GuardError('Choose an authorization.');revokeDebugGrant(body.id);return json({revoked:true});}
 if(body.op==='mode')return json(setGuardMode(body.mode,actor.id));
 throw new GuardError('Choose a valid operation.',422);
 }catch(e){return failure(e);}}
