import { claimChallenge, finishChallenge, GuardError, guardOrigin } from './automation-guard';
export function challengeSiteKey() {
 const key=process.env.TAYCO_TURNSTILE_SITE_KEY;
 return key && !(process.env.NODE_ENV==='production' && /^[123]x000000/.test(key)) ? key : null;
}
/** Network errors and provider/internal errors are unavailable, never invalid attempts. */
export async function verifyChallenge(request: Request, visitor: string, input: Record<string,unknown>, verifyFetch: typeof fetch=fetch) {
 const {incidentId,attemptId,token}=input;
 if(typeof token!=='string'||!token||token.length>2048||typeof incidentId!=='string'||typeof attemptId!=='string')throw new GuardError('Complete verification before retrying.',422);
 const secret=process.env.TAYCO_TURNSTILE_SECRET_KEY;
 if(!challengeSiteKey()||!secret || (process.env.NODE_ENV==='production' && /^[123]x000000/.test(secret)))throw new GuardError('Verification is unavailable. Your form is kept. Request a review or retry later.',503);
 const claimed=claimChallenge(visitor,incidentId,attemptId,token);
 if(claimed!=='pending')return claimed==='valid';
 let outcome:'valid'|'invalid'|'unavailable'='unavailable';
 try{
  const response=await verifyFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret,response:token,idempotency_key:attemptId}),signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error('provider');
  const result=await response.json() as {success?:boolean;hostname?:string;action?:string;cdata?:string;'error-codes'?:string[]};
  if(result.success===true){
   outcome=result.hostname===new URL(guardOrigin(request)).hostname && result.action==='tayco_verify' && result.cdata===incidentId?'valid':'invalid';
  }else if(result.success===false){
   const errors=result['error-codes']||[];
   if(errors.some(code=>['missing-input-secret','invalid-input-secret','internal-error','bad-request','timeout-or-duplicate'].includes(code)))throw new Error('provider');
   outcome=errors.includes('invalid-input-response')?'invalid':'unavailable';
  }
 }catch{/* Do not log tokens or provider payloads. */}
 finishChallenge(visitor,incidentId,attemptId,outcome);
 if(outcome==='unavailable')throw new GuardError('Verification is unavailable. Your form is kept. Retry or request a review.',503);
 return outcome==='valid';
}
