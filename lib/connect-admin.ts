import { createHash } from 'node:crypto';
import { sealData, unsealData } from 'iron-session';
import { assertSameOrigin, AuthError, requireActor, requireRole, SESSION_COOKIE } from './auth';
import { authFailure, authJson, readAuthBody } from './auth-http';
import { requiredSecret } from './required-secret';

const cookieName = 'tayco_connect_admin';
const ttl = 8 * 60 * 60;
function cookie(request: Request, name: string) {
 const values=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).filter(s=>s.startsWith(name+'='));
 return values.length===1 ? values[0].slice(name.length+1) : '';
}
function binding(request: Request) { return createHash('sha256').update(cookie(request,SESSION_COOKIE)).digest('hex'); }
function upstream() {
 const value=process.env.TAYCO_CONNECT_ORIGIN;
 if(!value) throw new AuthError('Connect administration has not been connected yet.',503);
 const url=new URL(value);
 if(url.protocol!=='https:' || url.origin!==value || url.username || url.password) throw new AuthError('Connect administration is not configured.',503);
 return value;
}
async function exchange(origin:string, path:string, token:string, body?:unknown) {
 const response=await fetch(origin+'/api/connect/auth/'+path,{method:body===undefined?'GET':'POST',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(12000),headers:{Origin:origin,...(token?{Cookie:'__Host-tayco_connect='+token}:{}),...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const reader=response.body?.getReader();const chunks:Uint8Array[]=[];let size=0;
 if(reader)for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>128000){await reader.cancel();throw new Error('Oversized upstream');}chunks.push(value);}
 const data=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 return {response,data};
}
export async function connectAdmin(request:Request) {
 try {
  if(!['GET','POST'].includes(request.method))throw new AuthError('Method not allowed',405);
  if(request.method==='POST')assertSameOrigin(request);
  if(request.headers.get('sec-fetch-site')==='cross-site')throw new AuthError('Forbidden',403);
  const actor=await requireActor(request);requireRole(actor,['admin']);
  const origin=upstream();const password=requiredSecret(['TAYCO_SESSION_SECRET']);
  const body=request.method==='POST'?await readAuthBody(request):undefined;
  const action=body?.action;
  const sealed=cookie(request,cookieName);
  const grant=sealed?await unsealData<{purpose?:string;actor?:string;binding?:string;token?:string}>(sealed,{password,ttl}):{};
  const token=grant.purpose==='connect-admin'&&grant.actor===actor.id&&grant.binding===binding(request)&&/^[A-Za-z0-9_-]{43}$/.test(grant.token||'')?grant.token!:'';
  const cookieHeader=(value:string,age:number)=>cookieName+'='+value+'; Path=/api/admin/connect; HttpOnly; SameSite=Strict; Max-Age='+age+(process.env.NODE_ENV==='production'?'; Secure':'');
  if(action==='login') {
   if(Object.keys(body!).some(k=>!['action','email','password','code'].includes(k)))throw new AuthError('Invalid login fields',400);
   const result=await exchange(origin,'login','',{email:body!.email,password:body!.password,code:body!.code});
   if(!result.response.ok) return authJson({error:'Connect credentials or authentication code were not accepted.'},result.response.status);
   const issued=result.response.headers.get('set-cookie')?.match(/^__Host-tayco_connect=([A-Za-z0-9_-]{43});/)?.[1];
   if(!issued || result.data.role!=='admin') {
    if(issued)await exchange(origin,'logout',issued,{});
    throw new AuthError('A Connect administrator account is required.',403);
   }
   const fresh=await requireActor(request);requireRole(fresh,['admin']);
   if(fresh.id!==actor.id)throw new AuthError('Sign in again.',401);
   const value=await sealData({purpose:'connect-admin',actor:actor.id,binding:binding(request),token:issued},{password,ttl});
   const response=authJson({ok:true});response.headers.set('Set-Cookie',cookieHeader(value,ttl));return response;
  }
  if(action==='logout') {
   if(token)await exchange(origin,'logout',token,{});
   const response=authJson({ok:true});response.headers.set('Set-Cookie',cookieHeader('',0));return response;
  }
  if(!token)throw new AuthError('Sign in with your Connect administrator account.',401);
  if(body && !['invite','cancel','update','revoke'].includes(String(action)))throw new AuthError('Invalid operation',400);
  const fresh=await requireActor(request);requireRole(fresh,['admin']);
  const result=await exchange(origin,body?'admin/manage':'admin/directory',token,body);
  if(!result.response.ok)return authJson({error:typeof result.data.error==='string'?result.data.error:'Connect is unavailable.'},result.response.status);
  const after=await requireActor(request);requireRole(after,['admin']);
  const data=result.data;
  if(body?.action==='invite') {
   if(!/^[A-Za-z0-9_-]{43}$/.test(data.token))throw new Error('Invalid invitation response');
   return authJson({expiresAt:data.expiresAt,token:data.token,origin},201);
  }
  return authJson({...data,origin});
 }catch(error){return authFailure(error);}
}
