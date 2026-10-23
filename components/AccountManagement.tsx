'use client';

import { useEffect, useState, type FormEvent } from 'react';

type Account = { id: string; email: string; role: string; projectIds: string[]; vendorId?: string; disabled: boolean; editable: boolean; accessVersion: string };
type Assignment = { id: string; kind: string; data: Record<string, unknown> };
const input = 'mt-2 w-full rounded-xl border border-[#173252]/20 bg-white px-3 py-3 text-[#173252] outline-none focus:border-[#db8f31] focus:ring-2 focus:ring-[#db8f31]/25';

function AccessForm({ account, assignments, saved }: { account: Account; assignments: Assignment[]; saved: (accounts: Account[]) => void }) {
  const [role, setRole] = useState(account.role); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage(''); const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: account.id, role, accessVersion: account.accessVersion, projectIds: form.getAll('projects').map(String), ...(role === 'vendor' ? { vendorId: form.get('vendor') } : {}), disabled: form.get('disabled') === 'on' }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Access could not be updated.');
      saved(data.accounts); setMessage('Access updated. This person must sign in again on every device.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Please try again.'); } finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="mt-5 space-y-4 border-t border-slate-100 pt-5">
    <label className="block text-sm text-slate-600">Role<select className={input} value={role} onChange={e => setRole(e.target.value)}><option value="client">Client</option><option value="vendor">Supplier / subcontractor</option><option value="staff">Internal team</option></select></label>
    {role === 'staff' && <p className="rounded-lg bg-amber-50 p-3 text-sm text-slate-700">Internal team members can access company projects and operational records. Only assign this role to authorized TAYCO staff.</p>}
    <fieldset><legend className="text-sm text-slate-600">Assigned projects</legend><div className="mt-2 space-y-1 rounded-xl border border-slate-200 p-2">{assignments.filter(a => a.kind === 'project').map(project => <label key={project.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-[#173252]"><input type="checkbox" name="projects" value={project.id} defaultChecked={account.projectIds.includes(project.id)} className="h-5 w-5 accent-[#173252]" /><span>{String(project.data.name || project.id)}</span></label>)}{!assignments.some(a => a.kind === 'project') && <p className="px-2 py-3 text-sm text-slate-500">Create a project in the workspace before assigning project access.</p>}</div></fieldset>
    {role === 'vendor' && <label className="block text-sm text-slate-600">Supplier record<select className={input} name="vendor" defaultValue={account.vendorId || ''} required><option value="">Choose a supplier</option>{assignments.filter(a => a.kind === 'vendor').map(vendor => <option key={vendor.id} value={vendor.id}>{String(vendor.data.businessName || vendor.data.companyName || vendor.data.name || vendor.id)}</option>)}</select></label>}
    <label className="flex min-h-11 items-center gap-3 text-sm text-slate-700"><input type="checkbox" name="disabled" defaultChecked={account.disabled} className="h-5 w-5 accent-[#173252]" />Suspend account access</label>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{message && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    <button className="min-h-12 rounded-xl bg-[#173252] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={busy}>{busy ? 'Saving…' : 'Save account access'}</button>
  </form>;
}

export default function AccountManagement({ assignments }: { assignments: Assignment[] }) {
  const [accounts, setAccounts] = useState<Account[]>([]); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; fetch('/api/auth/accounts', { cache: 'no-store' }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error || 'Accounts could not be loaded.'); if (active) setAccounts(data.accounts); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <section className="space-y-4 border-t border-slate-100 pt-6"><h2 className="text-xl font-semibold text-[#173252]">Manage account access</h2><p className="text-sm leading-relaxed text-slate-500">Update project assignments, change a partner&apos;s role or suspend access. Every change immediately revokes their sessions. Administrator access requires a verified operator.</p>{loading && <p role="status" className="text-sm text-slate-500">Loading accounts…</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<ul className="space-y-3">{accounts.map(account => <li key={account.id} className="rounded-xl border border-slate-200 p-4">{account.editable ? <details><summary className="min-h-11 cursor-pointer text-sm text-[#173252]"><span className="break-all font-semibold">{account.email}</span><span className="mt-1 block capitalize text-slate-500">{account.role} · {account.disabled ? 'Suspended' : 'Active'}</span></summary><AccessForm account={account} assignments={assignments} saved={setAccounts} /></details> : <div className="text-sm"><p className="break-all font-semibold text-[#173252]">{account.email}</p><p className="mt-1 text-slate-500">Administrator · Protected account</p></div>}</li>)}</ul></section>;
}
