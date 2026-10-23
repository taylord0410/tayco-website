import {snapshot,ErpError} from './erp';
import type {Actor} from './auth';
import {isValidUsdAmount} from './financial-values';
import {financialPeriods,parseFinancialPeriod,isFinancialDate,type FinancialPeriod} from './financial-periods';
export function csvCell(value:unknown){
 const raw=value==null?'':String(value),safe=/^[\s]*[=+@-]/.test(raw)||/^[\t\r\n]/.test(raw)?"'"+raw:raw;
 return '"'+safe.replaceAll('"','""')+'"';
}
export function financeExport(actor:Actor,projectId?:string,period:FinancialPeriod={year:null,month:null}){
 if(!['admin','staff'].includes(actor.role))throw new ErpError(403,'Financial export requires a TAYCO team member.');
 const data=snapshot(actor),projects=data.entries.filter(e=>e.kind==='project'),selection=parseFinancialPeriod(period.year,period.month);
 if(projectId&&!projects.some(e=>e.id===projectId))throw new ErpError(404,'Project not found.');
 const names=new Map(projects.map(e=>[e.id,String(e.data.name||'')])),report=financialPeriods(data.entries,{...selection,projectId,asOf:data.updatedAt});
 const rows:unknown[][]=[['project_id','project_name','record_type','reference','status','amount_usd','hours','source','recorded_at','validation','audience','effective_date','date_source']];
 if(selection.year===null&&selection.month===null)for(const e of projects.filter(e=>!projectId||e.id===projectId)){
  rows.push([e.id,names.get(e.id),'budget_record',e.id,e.data.status,isValidUsdAmount(e.data.budgetUsd)?e.data.budgetUsd:'','',e.data.budgetSource||e.data.source||'Team record',e.updatedAt,e.data.budgetUsd==null?'not_recorded':!isValidUsdAmount(e.data.budgetUsd)?'review_required':e.data.budgetSource&&e.data.budgetApprovedOn?'approval_recorded':'approval_not_recorded','project',e.data.budgetApprovedOn||'','approval_date']);
 }
 for(const item of report.invoices){const e=item.entry;rows.push([e.projectId,names.get(e.projectId),'invoice',e.data.reference,e.data.status,item.amountCents===null?'':item.amountCents/100,'',String(e.data.source||'Recorded invoice')+'; not a payment transfer',e.createdAt,item.amountCents===null?'review_required':'valid',item.audience,item.date||'',item.dateSource]);}
 for(const payment of report.payments)rows.push([payment.projectId,names.get(payment.projectId),'recorded_payment',payment.reference,'recorded',payment.amountCents/100,'','Recorded payment metadata; not a bank transfer',payment.recordedAt,'valid',payment.audience,payment.occurredOn,'payment_occurred']);
 for(const e of data.entries.filter(e=>e.kind==='hours'&&(!projectId||e.projectId===projectId))){
  const date=e.data.date,matches=isFinancialDate(date)&&(selection.year===null||+date.slice(0,4)===selection.year)&&(selection.month===null||+date.slice(5,7)===selection.month);
  if(!matches&&(selection.year!==null||selection.month!==null))continue;
  rows.push([e.projectId,names.get(e.projectId),'work_hours',e.id,e.data.status,'',e.data.hours??'','Submitted work record; not payroll',e.updatedAt,matches?'recorded':'review_required','not_recorded',date||'','work_date']);
 }
 return '\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n')+'\r\n';
}
