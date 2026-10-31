"use client";
import { useEffect, useRef, useState } from 'react';
type Widget={render:(el:HTMLElement,options:Record<string,unknown>)=>string;remove:(id:string)=>void;reset:(id:string)=>void};
declare global {interface Window {turnstile?:Widget}}
let loading:Promise<void>|undefined;
function loadWidget(){
 if(window.turnstile)return Promise.resolve();
 if(!loading)loading=new Promise<void>((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;
  const timer=window.setTimeout(()=>{loading=undefined;reject(new Error('Verification did not load. Please retry or request a review.'));},7000);
  script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);loading=undefined;script.remove();reject(new Error('Verification is unavailable. Your form is kept.'));};document.head.appendChild(script);
 });
 return loading;
}
export default function VerificationChallenge({incidentId,siteKey,onVerified}:{incidentId:string;siteKey?:string|null;onVerified:()=>void}){
 const host=useRef<HTMLDivElement>(null),complete=useRef(onVerified),intent=useRef<{token:string;id:string}|null>(null);
 const [error,setError]=useState(''),[busy,setBusy]=useState(false),[version,setVersion]=useState(0);
 useEffect(()=>{complete.current=onVerified;},[onVerified]);
 useEffect(()=>{
  if(!siteKey)return;
  let gone=false,id:string|undefined;
  void loadWidget().then(()=>{
   if(gone||!host.current||!window.turnstile)return;
   id=window.turnstile.render(host.current,{sitekey:siteKey,action:'tayco_verify',cData:incidentId,theme:'dark',size:'flexible',
    callback:async(token:string)=>{
     if(gone)return;setBusy(true);setError('');
     if(intent.current?.token!==token)intent.current={token,id:crypto.randomUUID()};
     try{
      const r=await fetch('/api/automation-guard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'verify',token,incidentId,attemptId:intent.current.id}),signal:AbortSignal.timeout(8000)});
      const data=await r.json();if(!r.ok||!data.verified)throw new Error(data.error||'Verification was not accepted. Please try again.');
      if(!gone)complete.current();
     }catch(e){if(!gone){setError(e instanceof Error?e.message:'Verification is unavailable.');window.dispatchEvent(new Event('tayco-guard-update'));}}
     finally{if(!gone)setBusy(false);}
    },'error-callback':()=>setError('Verification is unavailable. Your form is kept. Retry or request a review.'),'expired-callback':()=>setError('Verification expired. Please retry.')});
  }).catch(e=>{if(!gone)setError(e.message);});
  return()=>{gone=true;if(id)window.turnstile?.remove(id);};
 },[siteKey,incidentId,version]);
 return <div className="tayco-guard-details"><div ref={host}/>{!siteKey&&<p role="status">Automatic verification is unavailable. Your form is kept. Please request a review.</p>}{busy&&<p role="status">Checking verification…</p>}{error&&<p role="alert">{error}</p>}{siteKey&&<button type="button" disabled={busy} onClick={()=>{setError('');setVersion(v=>v+1);}}>Retry verification</button>}</div>;
}
