'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
type Account={email:string;username:string;role:'admin'|'member';active:boolean;version:number};
type Invitation={email:string;username:string;role:string;expiresAt:number;version:string};
type Directory={accounts:Account[];invitations:Invitation[];origin:string};
const field='mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900';
const button='min-h-11 rounded-xl bg-[#173252] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50';
export default function ConnectAdministration(){
 const [directory,setDirectory]=useState<Directory|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[link,setLink]=useState(''),[portalDenied,setPortalDenied]=useState(false);
 async function api(body?:unknown){
  const response=await fetch('/api/admin/connect',{cache:'no-store',...(body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
  const data=await response.json();
  if(!response.ok){if(response.status===401||response.status===403){setDirectory(null);setLink('');}throw new Error(data.error||'Connect administration is unavailable.');}
  return data;
 }
 async function refresh(){setDirectory(await api());}
 useEffect(()=>{let active=true;fetch('/api/auth/session',{cache:'no-store'}).then(r=>r.json()).then(async data=>{
  if(!active)return;
  if(data.actor?.role!=='admin'){setPortalDenied(true);return;}
  try{const value=await api();if(active)setDirectory(value);}catch(e){if(active)setError(e instanceof Error?e.message:'Please sign in.');}
 }).catch(()=>{if(active)setPortalDenied(true);}).finally(()=>{if(active)setReady(true);});return()=>{active=false;};},[]);
 async function run(body:Record<string,unknown>,message:string){
  setBusy(true);setError('');setNotice('');setLink('');
  try{const result=await api(body);if(body.action==='logout')setDirectory(null);else{if(body.action==='invite')setLink(result.origin+'/#invite='+result.token);await refresh();}setNotice(message);}
  catch(e){setError(e instanceof Error?e.message:'Please try again.');}finally{setBusy(false);}
 }
 function login(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget,data=new FormData(form);void run({action:'login',email:data.get('email'),password:data.get('password'),code:data.get('code')},'Connect administrator verified.');form.reset();}
 function invite(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget,data=new FormData(form);void run({action:'invite',email:data.get('email'),username:data.get('username'),role:data.get('role')},'Invitation created. Share the activation link privately; it expires in 48 hours.');}
 return <main className="mx-auto min-h-screen max-w-6xl bg-[#f4f6f8] px-5 py-10 text-[#173252]">
  <Link href="/account" className="inline-flex min-h-11 items-center text-sm underline">← TAYCO account administration</Link>
  <header className="my-6"><p className="text-sm font-semibold uppercase tracking-widest text-amber-700">TAYCO · Connected workspace</p><h1 className="mt-2 text-3xl font-bold">Connect administration</h1><p className="mt-3 max-w-2xl text-slate-600">Manage your communication team here. Connect keeps its own accounts, passwords and two-factor authentication.</p></header>
  {!ready?<p role="status">Checking administrator access…</p>:portalDenied?<section role="alert" className="rounded-2xl border p-6">Sign in to TAYCO with an administrator account. <Link href="/login" className="underline">Go to sign in</Link></section>:<>
   {error&&<p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
   {notice&&<p role="status" className="mb-4 rounded-xl bg-green-50 p-4 text-green-800">{notice}</p>}
   {!directory?<form onSubmit={login} className="max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Verify your Connect administrator account</h2>
    <label className="block">Connect email<input className={field} name="email" type="email" autoComplete="username" required/></label>
    <label className="block">Password<input className={field} name="password" type="password" autoComplete="current-password" required minLength={12}/></label>
    <label className="block">Authenticator code<input className={field} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required/></label>
    <button className={button} disabled={busy}>{busy?'Verifying…':'Open Connect administration'}</button>
    <p className="text-sm text-slate-500">Activate your existing invitation first if you have not set up your Connect account. Your TAYCO password is not shared with Connect.</p>
   </form>:<>
    <div className="mb-6 flex flex-wrap gap-3"><a href={directory.origin} className={button}>Open TAYCO Connect ↗</a><button disabled={busy} className={button} onClick={()=>void run({action:'logout'},'Connect administration locked. Your TAYCO session remains open.')}>Lock Connect administration</button><button disabled={busy} className={button} onClick={()=>{setError('');void refresh().catch(e=>setError(e.message));}}>Refresh</button></div>
    <form onSubmit={invite} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"><h2 className="text-xl font-semibold">Invite a team member</h2><div className="grid gap-4 md:grid-cols-3">
     <label>Email<input className={field} name="email" type="email" required/></label><label>Username<input className={field} name="username" pattern="[a-z][a-z0-9._-]{2,31}" required minLength={3} maxLength={32}/></label>
     <label>Role<select name="role" className={field}><option value="member">Member</option><option value="admin">Administrator</option></select></label></div>
     <p className="text-sm text-slate-600">Administrators can manage Connect accounts. Existing invitations are never replaced automatically.</p><button className={button} disabled={busy}>{busy?'Working…':'Create invitation'}</button>
    </form>
    {link&&<section className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4"><label className="block font-semibold">Private activation link<input aria-label="Private activation link" className={field} readOnly value={link} onFocus={e=>e.currentTarget.select()}/></label><p className="mt-2 text-sm">Visible only for this operation. Copy and share privately; it is not saved in the directory.</p></section>}
    <section className="mt-8"><h2 className="text-xl font-semibold">Accounts · {directory.accounts.length}</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{directory.accounts.map(account=><form key={account.email+account.version} onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);if(confirm('Update this account and sign it out on all devices?'))void run({action:'update',email:account.email,version:account.version,role:f.get('role'),active:f.get('active')==='on'},'Account updated and previous sessions revoked.');}} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5">
     <h3 className="font-bold">{account.username}</h3><p className="break-all text-sm text-slate-600">{account.email}</p><p className="my-2 text-sm">{account.active?'Active':'Suspended'}</p>
     <label className="block">Role<select name="role" defaultValue={account.role} className={field}><option value="member">Member</option><option value="admin">Administrator</option></select></label>
     <label className="my-3 flex min-h-11 items-center gap-3"><input type="checkbox" name="active" defaultChecked={account.active}/>Enable access</label>
     <div className="flex flex-wrap gap-2"><button className={button} disabled={busy}>Save access</button><button type="button" className={button} disabled={busy} onClick={()=>{if(confirm('Sign this account out on every device?'))void run({action:'revoke',email:account.email,version:account.version},'Sessions revoked.');}}>Sign out devices</button></div>
    </form>)}</div>{!directory.accounts.length&&<p className="mt-3">No activated accounts.</p>}</section>
    <section className="mt-8"><h2 className="text-xl font-semibold">Pending activations · {directory.invitations.length}</h2><ul className="mt-4 space-y-3">{directory.invitations.map(invitation=><li key={invitation.email} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"><div className="min-w-0"><p className="break-all font-semibold">{invitation.email}</p><p className="text-sm">{invitation.username} · {invitation.role} · {invitation.expiresAt <= Date.now()?'Expired':'Expires'} {new Date(invitation.expiresAt).toLocaleString()}</p></div><button className={button} disabled={busy} onClick={()=>{if(confirm('Cancel this invitation? Its activation link will stop working.'))void run({action:'cancel',email:invitation.email,version:invitation.version},'Invitation cancelled.');}}>Cancel invitation</button></li>)}</ul>{!directory.invitations.length&&<p className="mt-3">No pending activations.</p>}</section>
   </>}
  </>}
 </main>;
}
