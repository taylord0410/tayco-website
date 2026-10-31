'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';

import type { GuardState } from '@/lib/automation-guard';
import './automation-guard.css';
import { COMPANY } from '@/lib/company';
import VerificationChallenge from './VerificationChallenge';

export default function AutomationGuard() {

  const [state,setState]=useState<(GuardState & {siteKey?:string|null})|null>(null);
  const panel=useRef<HTMLElement>(null);
  const [formError,setFormError]=useState('');
  const [dismissed,setDismissed]=useState<string|null>(null);
  const refresh=()=>window.dispatchEvent(new Event('tayco-guard-update'));
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setFormError('');
    const form=event.currentTarget,data=new FormData(form);
    const button=(event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement|null;
    if(button?.name)data.set(button.name,button.value);
    try{
      const response=await fetch('/api/automation-guard',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'same-origin',body:JSON.stringify(Object.fromEntries(data))});
      if(!response.ok){const failure=await response.json();throw new Error(failure.error||'Authorization could not be verified. Please check your token.');}
      form.reset();refresh();
    }catch(error){setFormError(error instanceof Error?error.message:'Verification unavailable.');}
  }
  useEffect(()=>{
    const controller=new AbortController();
    const check=async(bootstrap=false)=>{
      try {
        const response=await fetch('/api/automation-guard',bootstrap?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op:'bootstrap',automation:navigator.webdriver===true || /HeadlessChrome|PhantomJS/i.test(navigator.userAgent)}),signal:controller.signal,cache:'no-store'}:{signal:controller.signal,cache:'no-store'});
        if(response.ok)setState(await response.json());
      }catch{/* The server still enforces restrictions if this UI request fails. */}
    };
    void (async()=>{
      try {
        const response=await fetch('/api/automation-guard',{signal:controller.signal,cache:'no-store'});
        if(!response.ok)return;
        const current=await response.json();
        if(current.mode!=='off')await check(true);
      }catch{/* Security decisions remain server-side. */}
    })();
    const update=()=>{setDismissed(null);void check();};
    window.addEventListener('tayco-guard-update',update);
    return()=>{controller.abort();window.removeEventListener('tayco-guard-update',update);};
  },[]);
  const visible=state?.mode==='enforce'&&(state.state==='challenge'||state.state==='blocked')&&dismissed!==state.incidentId;
  useEffect(()=>{
    if(!visible)return;
    const before=document.activeElement instanceof HTMLElement?document.activeElement:null;
    const overflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    panel.current?.focus();
    const onKey=(event:KeyboardEvent)=>{
      if(event.key!=='Tab')return;
      const items=Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href],button,input,summary,[tabindex="0"]')||[]).filter(e=>e.getClientRects().length>0);
      const first=items[0],last=items[items.length-1];
      if(!first){event.preventDefault();return;}
      if(!panel.current?.contains(document.activeElement)||(event.shiftKey&&document.activeElement===first)){event.preventDefault();(event.shiftKey?last:first).focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    };
    window.addEventListener('keydown',onKey);
    return()=>{document.body.style.overflow=overflow;window.removeEventListener('keydown',onKey);before?.focus();};
  },[visible]);
  if(!visible||!state)return null;
  return <div className="tayco-guard-overlay"><section ref={panel} tabIndex={-1} className="tayco-guard-card" role="dialog" aria-modal="true" aria-labelledby="tayco-guard-title">
    <div className="tayco-guard-eyebrow">TAYCO GROUP · SECURITY</div>
    <h1 id="tayco-guard-title">{state.state==='blocked'?'Access temporarily paused':'Browser verification'}</h1>
    <p>This browser requires verification before continuing. Authorized investigators can use a temporary access token.</p>
    <div className="tayco-guard-details"><div>Retries used: {Math.min(3,state.retries)} / 3</div><div>Incident: {state.incidentId}</div><div>Refreshing does not reset this verification.</div></div>
    {state.state==='challenge'&&state.incidentId&&<VerificationChallenge incidentId={state.incidentId} siteKey={state.siteKey} onVerified={refresh}/>}
    <button type="button" className="secondary" onClick={()=>setDismissed(state.incidentId||null)}>Keep editing my form</button>
    <form onSubmit={submit}><input type="hidden" name="op" value="review"/><button type="submit">Request a review</button></form>
    {state.reviewCode&&<button type="button" onClick={refresh}>Check review status</button>}
    {state.reviewCode&&<p className="tayco-guard-details" role="status">Review reference: <span>{state.reviewCode}</span></p>}
    <p><a href={"mailto:"+COMPANY.email}>Contact TAYCO for a review</a></p>
    <details><summary>Authorized investigation</summary><form method="post" action="/api/automation-guard" onSubmit={submit}><input type="hidden" name="op" value="exchange"/><label htmlFor="tayco-guard-token">Temporary authorization token</label><input id="tayco-guard-token" type="password" name="token" required maxLength={128} autoComplete="off"/><button type="submit">Authorize this browser</button></form></details>
    {state.lab&&<footer><small>LOCAL TEST · Simulation controls are unavailable in production.</small><form method="post" action="/api/automation-guard" onSubmit={submit}><input type="hidden" name="op" value="authorize-test"/><button type="submit">Test temporary authorization</button></form><form method="post" action="/api/automation-guard" onSubmit={submit}><input type="hidden" name="op" value="reset-test"/><button className="secondary" type="submit">Reset local test</button></form></footer>}
    {formError&&<p role="alert">{formError}</p>}
  </section></div>;
}
