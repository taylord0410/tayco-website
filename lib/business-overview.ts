import type { Entry } from './erp';
import { isFinancialDate } from './financial-periods';
import { isValidUsdAmount } from './financial-values';

type Assignee = { id: string; email: string; role: string };
type Person = { id: string; label: string; role: string; responsibilities: string[]; projectIds: string[]; submittedHours: number; approvedHours: number; returnedHours: number };
const projectStates = ['planning','active','blocked','handover','closed'];
const proposalStates = ['draft','sent','accepted','declined','withdrawn'];
const title = (s: string) => s.charAt(0).toUpperCase()+s.slice(1);
const date = (v: unknown) => typeof v==='string' && isFinancialDate(v) ? v : null;
const text = (v: unknown, fallback='') => typeof v==='string' ? v : fallback;
const objects = (v: unknown): Record<string,unknown>[] => Array.isArray(v) ? v.filter((x):x is Record<string,unknown> => !!x&&typeof x==='object'&&!Array.isArray(x)) : [];

/** Receives only authorized records. Current-state inventory is not a historical month-end balance. */
export function buildBusinessOverview(entries: Entry[], assignees: Assignee[], options: {month: string; asOf: string}) {
  if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(options.month))throw new Error('Choose a valid reporting month.');
  const asOf=date(options.asOf.slice(0,10));if(!asOf)throw new Error('A dated snapshot is required.');
  const month=options.month,start=month+'-01',end=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
  const inMonth=(v:unknown)=>{const d=date(v);return !!d&&d>=start&&d<=end&&d<=asOf;};
  const projectEntries=entries.filter(e=>e.kind==='project'),projectIds=new Set(projectEntries.map(e=>e.id));
  const scoped=entries.filter(e=>!e.projectId||projectIds.has(e.projectId));
  const proposals=scoped.filter(e=>e.kind==='proposal'),notes=new Set<string>();
  const cents=(rows:Entry[])=>rows.reduce((sum,e)=>{
    if(!isValidUsdAmount(e.data.amountUsd)){notes.add('Some proposals have invalid amounts and are excluded from monetary totals.');return sum;}
    const next=sum+Math.round(e.data.amountUsd*100);if(!Number.isSafeInteger(next))throw new Error('Proposal totals exceed the supported reporting range.');return next;
  },0)/100;
  const counts=proposalStates.map(status=>{const rows=proposals.filter(e=>e.data.status===status);return {status,label:title(status),count:rows.length,amountUsd:cents(rows)};});
  const issued=proposals.filter(e=>inMonth(e.data.issuedOn)&&e.data.status!=='draft');
  const accepted=proposals.filter(e=>e.data.status==='accepted'&&inMonth(e.data.decidedOn));
  const pending=proposals.filter(e=>e.data.status==='draft'||e.data.status==='sent');
  const undatedCount=proposals.filter(e=>!date(e.data.issuedOn)||(e.data.status==='accepted'&&!date(e.data.decidedOn))).length;
  if(undatedCount)notes.add('Undated proposals remain in current-state counts but are excluded from dated activity.');
  if(proposals.some(e=>!proposalStates.includes(text(e.data.status))))notes.add('Some proposal states need review and are excluded from the named state totals.');
  const people=new Map<string,Person>(),known=new Map(assignees.map(a=>[a.id,a]));
  function person(id:string) {
    const a=known.get(id);if(!a)return null;
    if(!people.has(id))people.set(id,{id,label:a.email,role:a.role,responsibilities:[],projectIds:[],submittedHours:0,approvedHours:0,returnedHours:0});
    return people.get(id)!;
  }
  const projects=projectEntries.map(e=>{
    const members=objects(e.data.teamMembers),active=members.filter(m=>date(m.assignedOn)&&text(m.assignedOn)<=asOf&&(!date(m.removedOn)||text(m.removedOn)>asOf));
    for(const m of members){
      const assigned=date(m.assignedOn),removed=date(m.removedOn);
      if(!assigned||assigned>end||assigned>asOf||(removed&&removed<start))continue;
      const p=person(text(m.memberId));if(!p){notes.add('Some assignments refer to accounts no longer available in the active staff directory.');continue;}
      if(!p.projectIds.includes(e.id))p.projectIds.push(e.id);
      const responsibility=text(m.responsibility);if(responsibility&&!p.responsibilities.includes(responsibility))p.responsibilities.push(responsibility);
    }
    return {id:e.id,name:text(e.data.name,'Project'),status:text(e.data.status,'unknown'),progress:typeof e.data.progress==='number'&&Number.isFinite(e.data.progress)&&e.data.progress>=0&&e.data.progress<=100?e.data.progress:null,nextAction:text(e.data.nextAction),plannedStart:date(e.data.plannedStart),plannedEnd:date(e.data.plannedEnd),teamMemberCount:new Set(active.map(m=>text(m.memberId)).filter(Boolean)).size};
  });
  const projectCounts=[...projectStates,'unknown'].map(status=>({status,label:title(status),count:projects.filter(p=>status==='unknown'?!projectStates.includes(p.status):p.status===status).length}));
  let workHours=0,unknownSubmitters=0,undatedWorkLogs=0;
  for(const e of scoped.filter(e=>e.kind==='hours')){
    if(!date(e.data.date)){undatedWorkLogs++;continue;}
    if(!inMonth(e.data.date))continue;
    const hours=e.data.hours;if(typeof hours!=='number'||!Number.isFinite(hours)||hours<=0||hours>24){notes.add('Invalid work-hour values are excluded from recorded hours.');continue;}
    workHours+=hours;const p=person(e.ownerId);if(!p){unknownSubmitters++;continue;}
    if(e.projectId&&!p.projectIds.includes(e.projectId))p.projectIds.push(e.projectId);
    if(e.data.status==='approved')p.approvedHours+=hours;else if(e.data.status==='returned')p.returnedHours+=hours;else if(e.data.status==='submitted')p.submittedHours+=hours;
  }
  if(unknownSubmitters)notes.add('Work logs from providers or unidentified submitters are included in total recorded hours, not inferred as staff headcount.');
  const leads=scoped.filter(e=>e.kind==='lead');
  return {month,asOf:options.asOf,projects,projectCounts,proposals:{counts,issuedCount:issued.length,issuedAmountUsd:cents(issued),acceptedCount:accepted.length,acceptedAmountUsd:cents(accepted),pendingCount:pending.length,pendingAmountUsd:cents(pending),undatedCount},team:[...people.values()].sort((a,b)=>a.label.localeCompare(b.label)),activity:{requestsReceived:leads.filter(e=>inMonth(e.createdAt.slice(0,10))).length,workHours:Math.round(workHours*100)/100,unassignedRequests:leads.filter(e=>e.data.status!=='closed'&&!e.data.assigneeId).length,unknownSubmitters,undatedWorkLogs},coverageNotes:[...notes]};
}
