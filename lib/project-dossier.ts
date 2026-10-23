import type {Actor} from './auth';
import {snapshot,ErpError} from './erp';
export function projectDossier(actor:Actor,projectId:string){
 if(!['admin','staff','client'].includes(actor.role))throw new ErpError(403,'Project dossiers are available to the assigned client and TAYCO team.');
 const scoped=snapshot(actor),project=scoped.entries.find(e=>e.kind==='project'&&e.id===projectId);
 if(!project)throw new ErpError(404,'Project not found.');
 const related=scoped.entries.filter(e=>e.projectId===projectId&&e.kind!=='project');
 const pick=(data:Record<string,unknown>,keys:string[])=>Object.fromEntries(keys.filter(key=>Object.hasOwn(data,key)).map(key=>[key,data[key]]));
 const publicProject={...project,ownerId:'',data:pick(project.data,['name','location','status','progress','nextAction','plannedStart','plannedEnd','milestones','budgetUsd','budgetSource','budgetApprovedOn'])};
 if(Array.isArray(project.data.contacts))publicProject.data.contacts=project.data.contacts.filter(contact=>contact&&typeof contact==='object'&&['client','project'].includes(String(contact.visibility))&&contact.status!=='archived');
 const documents=related.filter(e=>e.kind==='document'&&e.data.type==='project'&&e.data.visibility==='client'&&e.data.status==='approved').map(e=>({...e,ownerId:'',data:pick(e.data,['name','contentType','type','status','visibility','expiresAt'])}));
 const invoices=related.filter(e=>e.kind==='invoice'&&e.data.audience==='client').map(e=>({...e,ownerId:'',data:pick(e.data,['reference','amountUsd','status','audience','issuedOn','dueDate'])}));
 return {title:'TAYCO client-facing project dossier',generatedAt:new Date().toISOString(),source:'Recorded client-facing project information',project:publicProject,
  updates:related.filter(e=>e.kind==='note'&&e.data.visibility==='client'),scopeChanges:related.filter(e=>e.kind==='change'),documents,
  invoices,procurement:[],
  limitations:['Budgets and recorded payment metadata do not certify a bank balance or investment return.','Files remain behind authorized download; no private storage path is exported.']};
}
