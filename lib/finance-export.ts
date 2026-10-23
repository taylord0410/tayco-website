import {snapshot,ErpError} from './erp';
import type {Actor} from './auth';
import {isValidUsdAmount} from './financial-values';

export function csvCell(value: unknown) {
 const raw=value==null?'':String(value);
 // Spreadsheet applications interpret leading operators even inside quoted cells.
 const safe=/^[\s]*[=+@-]/.test(raw)||/^[\t\r\n]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function financeExport(actor:Actor,projectId?:string) {
 if(!['admin','staff'].includes(actor.role))throw new ErpError(403,'Financial export requires a TAYCO team member.');
 const data=snapshot(actor),projects=data.entries.filter(e=>e.kind==='project');
 if(projectId&&!projects.some(e=>e.id===projectId))throw new ErpError(404,'Project not found.');
 const names=new Map(projects.map(e=>[e.id,String(e.data.name||'')]));
 const rows:unknown[][]=[['project_id','project_name','record_type','reference','status','amount_usd','hours','source','recorded_at','validation','audience']];
 for(const e of data.entries) {
  if(projectId&&e.projectId!==projectId)continue;
  if(e.kind==='project') rows.push([e.id,names.get(e.id),'budget_record',e.id,e.data.status,isValidUsdAmount(e.data.budgetUsd)?e.data.budgetUsd:'', '',e.data.budgetSource||e.data.source||'Team record',e.updatedAt,e.data.budgetUsd==null?'not_recorded':!isValidUsdAmount(e.data.budgetUsd)?'review_required':e.data.budgetSource&&e.data.budgetApprovedOn?'approval_recorded':'approval_not_recorded','project']);
  if(e.kind==='invoice') rows.push([e.projectId,names.get(e.projectId),'invoice',e.data.reference,e.data.status,isValidUsdAmount(e.data.amountUsd)?e.data.amountUsd:'','', 'Recorded invoice; not a payment transfer',e.updatedAt,isValidUsdAmount(e.data.amountUsd)?'valid':'review_required',e.data.audience]);
  if(e.kind==='hours') rows.push([e.projectId,names.get(e.projectId),'work_hours',e.id,e.data.status,'',e.data.hours??'', 'Submitted work record; not payroll',e.updatedAt,'recorded','not_recorded']);
 }
 return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}

