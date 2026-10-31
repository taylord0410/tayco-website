'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import type { GuardState } from '@/lib/automation-guard';
export default function SecurityLab(){
  const [status,setStatus]=useState<GuardState|null>(null),[error,setError]=useState('');
  async function update(){const r=await fetch('/api/automation-guard',{cache:'no-store'});if(r.ok)setStatus(await r.json());}
  useEffect(()=>{const controller=new AbortController();void fetch('/api/automation-guard',{cache:'no-store',signal:controller.signal}).then(async r=>{if(r.ok)setStatus(await r.json());}).catch(()=>{});return()=>controller.abort();},[]);
  async function run(op:string){
    setError('');
    try{
      const r=await fetch('/api/automation-guard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,attemptId:crypto.randomUUID()}),cache:'no-store'});
      if(!r.ok)throw new Error('The local test is unavailable. Check the test server configuration.');
      window.dispatchEvent(new Event('tayco-guard-update'));await update();
    }catch(e){setError(e instanceof Error?e.message:'Test unavailable.');}
  }
  return <main className="mx-auto max-w-2xl px-6 py-16 text-slate-200">
    <p className="text-xs tracking-widest text-[#d4b961]">TAYCO · LOCAL SECURITY TRIAL</p>
    <h1 className="my-5 font-serif text-4xl">Browser verification lab</h1>
    <p className="mb-6 text-sm leading-7 text-slate-400">Normal browsing stays available. Simulate a detection to see the notice, test three explicit failed verification attempts, then temporarily reject the fourth; refreshing alone does not count. Temporary authorization only exempts this abuse check; it grants no account permissions.</p>
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-sm" aria-live="polite">Mode: {status?.mode||'loading'} · State: {status?.state||'loading'} · Retries: {Math.min(3,status?.retries||0)} / 3</div>
    <div className="my-6 flex flex-wrap gap-3">
      <button onClick={()=>run('simulate')} className="min-h-11 rounded-lg bg-[#c9a84c] px-4 text-sm font-semibold text-slate-950">Simulate automation detection</button>
      <button onClick={()=>run('invalid-test')} className="min-h-11 rounded-lg border border-white/25 px-4 text-sm">Simulate one failed verification</button>
      <button onClick={()=>run('review')} className="min-h-11 rounded-lg border border-white/25 px-4 text-sm">Request an admin review</button>
      <button onClick={()=>run('reset-test')} className="min-h-11 rounded-lg border border-white/25 px-4 text-sm">Reset local test</button>
      <Link href="/" className="flex min-h-11 items-center rounded-lg border border-white/25 px-4 text-sm">Open Home</Link>
    </div>
    {status?.reviewCode&&<p className="my-4 break-all text-sm" role="status">Review reference: {status.reviewCode}</p>}
    <Link href="/admin/security" className="text-sm text-amber-200">Open security administration →</Link>
    {error&&<p role="alert">{error}</p>}
    <p className="text-xs leading-6 text-slate-400">This lab is disabled in production. A browser signal alone cannot prove abuse. Turnstile verification is optional and requires configured keys. This lab uses explicit local simulations, not proof of human verification or network-wide bot protection.</p>
  </main>;
}
