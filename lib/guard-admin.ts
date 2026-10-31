import {AuthError,requireActor,requireRole,revalidateRequestActor} from './auth';
export async function requireSecurityAdmin(request:Request){
 const actor=await requireActor(request);requireRole(actor,['admin']);
 if(actor.tenantId!==(process.env.TAYCO_PUBLIC_TENANT_ID||'tayco_llc'))throw new AuthError('Not authorized for website security.',403);
 revalidateRequestActor(actor);return actor;
}
