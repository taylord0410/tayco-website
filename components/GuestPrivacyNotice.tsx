"use client";
import Link from 'next/link';
import { useEffect,useId,useRef,useState } from 'react';
import { GUEST_PRIVACY_VERSION,type GuestPrivacy } from '@/lib/guest-privacy-contract';
import { clearGuestAnalytics,installGuestPrivacyChoice,validGuestPrivacy,externalPrivacyWithdrawal } from '@/lib/guest-privacy-client';
const control='min-h-11 rounded-lg border border-slate-500 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-60';
export default function GuestPrivacyNotice({onReady}:{onReady?:(id:string)=>void}){
  const [privacy,setPrivacy]=useState<GuestPrivacy|null>(null),[opened,setOpened]=useState(false),[custom,setCustom]=useState(false),[optional,setOptional]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const id=useId(),focus=useRef<HTMLButtonElement>(null),generation=useRef(0),source=useRef<string|null>(null);
  useEffect(()=>{
    clearGuestAnalytics();source.current ||= crypto.randomUUID();const started=generation.current;
    const controller=new AbortController();
    const listener=(event:MessageEvent)=>{if(!externalPrivacyWithdrawal(event.data,source.current))return;generation.current++;clearGuestAnalytics();setPrivacy(p=>p?{...p,optionalAnalytics:null}:null);setOpened(true);};
    const channel=typeof BroadcastChannel==='undefined'?null:new BroadcastChannel('tayco-privacy-withdrawal');
    if(channel)channel.onmessage=listener;
    fetch('/api/guest-privacy',{credentials:'same-origin',cache:'no-store',signal:controller.signal}).then(async r=>{
      if(!r.ok)throw new Error('Privacy preferences are unavailable. Optional analytics remain off.');
      const data=await r.json();if(!validGuestPrivacy(data.privacy))throw new Error('Privacy preferences could not be read. Optional analytics remain off.');
      if(!controller.signal.aborted&&generation.current===started){
        setPrivacy(data.privacy);
        setOptional(data.privacy.optionalAnalytics===true);
        installGuestPrivacyChoice(data.privacy);
        onReady?.(data.privacy.reviewId);
      }
    }).catch(e=>{if(!controller.signal.aborted)setError(e.message);});
    return()=>{controller.abort();channel?.close();clearGuestAnalytics();};
  },[onReady]);
  async function save(allowed:boolean){
    const started=++generation.current;clearGuestAnalytics();setPrivacy(p=>p?{...p,optionalAnalytics:null}:p);setBusy(true);setError('');
    if(!allowed&&typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('tayco-privacy-withdrawal');channel.postMessage({kind:'withdraw',source:source.current});channel.close();}
    try{
      const r=await fetch('/api/guest-privacy',{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({version:GUEST_PRIVACY_VERSION,optionalAnalytics:allowed})});
      if(!r.ok)throw new Error('Your preference was not saved. Optional analytics are off here; retry to save your choice.');
      const data=await r.json();if(!validGuestPrivacy(data.privacy))throw new Error('Your preference could not be confirmed. Optional analytics remain off.');
      if(generation.current!==started)throw new Error('Preferences changed in another tab. Optional analytics remain off here; choose again to confirm.');
      setPrivacy(data.privacy);setOptional(data.privacy.optionalAnalytics===true);installGuestPrivacyChoice(data.privacy);onReady?.(data.privacy.reviewId);setOpened(false);setCustom(false);
    }catch(e){setError((e as Error).message);}
    finally{setBusy(false);}
  }
  const expanded=opened||privacy?.optionalAnalytics==null;
  return <section aria-labelledby={id} data-testid="guest-privacy" className="my-4 min-w-0 rounded-xl border border-amber-200/30 bg-[#10213a] p-4 text-slate-100">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id={id} className="text-base font-semibold">Privacy &amp; activity</h2><button className={control} aria-expanded={expanded} onClick={()=>{setOpened(!opened);setCustom(true);}}>Preferences</button></div>
    {expanded?<div className="mt-3 space-y-3"><p className="text-sm leading-relaxed text-slate-200">TAYCO uses essential session cookies (3-hour validity) to secure this private three-hour review and maintain audit activity logs for client review. Security events and review audit activity are logged. Optional interaction analytics record selected menu, project, document and reader controls, including bounded requested page numbers, to improve the review. They do not collect free-form text, passwords, or document contents.</p>
      <p className="text-sm text-slate-300">Session cookies are strictly valid for 3 hours. Accepting cookies ensures uninterrupted review tracking and reader interactions.</p>
      <div className="flex flex-wrap gap-3"><button ref={focus} className={control + " border-amber-300 bg-amber-400 font-bold text-slate-950 hover:bg-amber-300"} disabled={busy} onClick={()=>void save(true)}>Accept cookies &amp; continue (3h session)</button><button className={control} disabled={busy} onClick={()=>void save(true)}>Accept optional analytics</button><button className={control} disabled={busy} onClick={()=>void save(false)}>Reject optional analytics</button></div>
      {custom&&<div className="space-y-3 rounded-lg border border-slate-500 p-3"><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked disabled readOnly/>Essential session and security · required</label><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={optional} onChange={e=>setOptional(e.target.checked)}/>Optional interaction analytics</label><div className="flex flex-wrap gap-3"><button className={control} disabled={busy} onClick={()=>void save(optional)}>Save preferences</button><button className={control} disabled={busy} onClick={()=>void save(false)}>Withdraw optional analytics</button></div></div>}
    </div>:<p className="mt-3 text-sm">Optional analytics {privacy?.optionalAnalytics?'on':'off'}. You can change or withdraw your choice at any time.</p>}
    <p className="mt-3 text-xs text-slate-300">Notice {GUEST_PRIVACY_VERSION}. <Link className="inline-flex min-h-11 items-center underline" href="/privacy">Privacy &amp; activity notice</Link></p>
    {busy&&<p role="status" className="mt-2 text-sm">Saving preference…</p>}{error&&<p role="alert" className="mt-2 text-sm text-amber-100">{error}</p>}
  </section>;
}
