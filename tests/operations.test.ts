import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync} from 'node:fs';import path from 'node:path';import os from 'node:os';import {randomUUID} from 'node:crypto';
import type {Actor} from '../lib/auth';import {execute,snapshot,submitWebsite,ErpError,database,financialSummary} from '../lib/erp';import {financialPeriods} from '../lib/financial-periods';import {financeExport} from '../lib/finance-export';import {projectDossier} from '../lib/project-dossier';
const folder=mkdtempSync(path.join(os.tmpdir(),'tayco-operations-'));process.env.TAYCO_ERP_DB_PATH=path.join(folder,'erp.sqlite');process.env.TAYCO_AUTH_DB_PATH=path.join(folder,'auth.sqlite');
const a={id:'admin',email:'admin@example.test',role:'admin',tenantId:'tayco_llc',projectIds:[]} as Actor;
const run=(actor:Actor,input:Record<string,unknown>)=>execute(actor,randomUUID(),input),status=(code:number)=>(e:unknown)=>e instanceof ErpError&&e.status===code;
const p=run(a,{action:'create_project',name:'Scoped fixture',budgetUsd:0,budgetSource:'Synthetic approval',budgetApprovedOn:new Date().toISOString().slice(0,10)}),foreign=run({...a,tenantId:'other'},{action:'create_project',name:'Foreign fixture'});
const vprofile=submitWebsite('vendor',{businessName:'Fixture provider'},randomUUID());
const v={...a,id:'vendor',role:'vendor',vendorId:vprofile.id,projectIds:[p.id]} as Actor,c1={...a,id:'client',role:'client',projectIds:[p.id]} as Actor;
test('bids and purchase orders preserve supplier/project scope and legal stage transitions',()=>{
 const bid=run(v,{action:'create_bid',projectId:p.id,supplierName:'Fixture provider',scope:'Framing',amountUsd:80,issuedOn:'2026-01-01',source:'Supplied quote'});
 assert.throws(()=>run(v,{action:'review_bid',id:bid.id,version:1,status:'accepted'}),status(403));
 assert.throws(()=>run(v,{action:'create_bid',projectId:foreign.id,supplierName:'Other',scope:'Framing',amountUsd:80,issuedOn:'2026-01-01',source:'Quote'}),status(404));
 const accepted=run(a,{action:'review_bid',id:bid.id,version:1,status:'accepted'});
 const order={action:'create_purchase_order',projectId:p.id,reference:'PO-FIXTURE',supplierName:'Fixture provider',description:'Agreed framing',amountUsd:80,issuedOn:'2026-01-02',source:'Reviewed quote',bidId:accepted.id};
 assert.throws(()=>run(a,{...order,amountUsd:81}),status(422));
 assert.throws(()=>run(a,{...order,supplierName:'Different supplier'}),status(422));
 let po=run(a,order);assert.equal(po.data.vendorId,vprofile.id);
 assert.throws(()=>run(a,{...order,reference:'po-fixture',bidId:undefined}),status(409));
 assert.throws(()=>run(a,{...order,reference:'PO-DUPLICATE-BID'}),status(409));
 assert.throws(()=>run(a,{action:'update_purchase_order',id:po.id,version:po.version,status:'received'}),status(409));
 assert.throws(()=>run(v,{action:'update_purchase_order',id:po.id,version:po.version,status:'acknowledged'}),status(403));
 for(const next of ['issued','acknowledged','received','closed'])po=run(a,{action:'update_purchase_order',id:po.id,version:po.version,status:next});
 assert.throws(()=>run(a,{action:'update_purchase_order',id:po.id,version:po.version,status:'issued'}),status(409));
 assert.ok(snapshot(v).entries.some(e=>e.id===po.id));assert.ok(!snapshot(c1).entries.some(e=>e.id===po.id||e.id===bid.id));
 assert.ok(!snapshot({...v,id:'unrelated',vendorId:'unrelated'}).entries.some(e=>e.id===po.id||e.id===bid.id));
});
test('compliance remains manual evidence with internal authority and calendar validation',()=>{
 const item=run(a,{action:'create_compliance',projectId:p.id,jurisdiction:'Project location',topic:'Review supplied insurance',source:'Project requirement',dueDate:'2026-12-01'});
 assert.throws(()=>run(a,{action:'review_compliance',id:item.id,version:1,status:'complete',evidence:'',reviewedOn:'2026-01-01'}),status(422));
 assert.throws(()=>run(a,{action:'review_compliance',id:item.id,version:1,status:'complete',evidence:'Recorded review',reviewedOn:'2026-02-30'}),status(422));
 const reviewed=run(a,{action:'review_compliance',id:item.id,version:1,status:'complete',evidence:'Reviewed supplied document',reviewedOn:'2026-01-01'});
 assert.equal(reviewed.data.status,'complete');assert.ok(!snapshot(c1).entries.some(e=>e.id===item.id));assert.ok(!snapshot(v).entries.some(e=>e.id===item.id));
});
test('dated partial payments, correction and monthly CSV do not infer history from status',()=>{
 let invoice=run(a,{action:'record_invoice',projectId:p.id,reference:'INV-MONTH',amountUsd:100,issuedOn:'2026-01-01',source:'Reviewed invoice',audience:'client'});
 invoice=run(a,{action:'update_invoice',id:invoice.id,version:invoice.version,status:'approved'});
 const pay={action:'record_invoice_payment',invoiceId:invoice.id,version:invoice.version,amountUsd:40,occurredOn:'2026-01-15',reference:'Receipt January'};
 assert.throws(()=>run({...a,role:'staff'},pay),status(403));assert.throws(()=>run(c1,pay),status(403));
 invoice=run(a,pay);assert.equal(financialSummary(a,p.id).approvedOutstandingUsd,60);
 assert.throws(()=>run(a,{...pay,version:invoice.version,amountUsd:1}),status(409));
 assert.throws(()=>run(a,{...pay,version:invoice.version,amountUsd:61,reference:'Overpayment'}),status(422));
 assert.throws(()=>run(a,{...pay,version:invoice.version,amountUsd:1,reference:'Before invoice',occurredOn:'2025-12-31'}),status(422));
 const second={...pay,version:invoice.version,amountUsd:60,occurredOn:'2026-02-01',reference:'Receipt February'};
 invoice=run(a,second);assert.equal(invoice.data.status,'paid');assert.equal(financialSummary(a,p.id).approvedOutstandingUsd,0);
 const jan=financialPeriods(snapshot(c1).entries,{year:2026,month:1,asOf:new Date().toISOString()}),feb=financialPeriods(snapshot(c1).entries,{year:2026,month:2,asOf:new Date().toISOString()});
 assert.equal(jan.selected.byAudience.client.issuedCents,10000);assert.equal(jan.selected.byAudience.client.paymentCents,4000);assert.equal(feb.selected.byAudience.client.issuedCount,0);assert.equal(feb.selected.byAudience.client.paymentCents,6000);
 const csv=financeExport(a,p.id,{year:2026,month:2});assert.match(csv,/Receipt February/);assert.doesNotMatch(csv,/Receipt January|INV-MONTH/);
 const first=(invoice.data.payments as {id:string}[])[0];invoice=run(a,{action:'void_invoice_payment',invoiceId:invoice.id,version:invoice.version,paymentId:first.id,reason:'Duplicate receipt corrected'});
 assert.equal(invoice.data.status,'approved');assert.equal(financialSummary(a,p.id).approvedOutstandingUsd,40);assert.equal(financialPeriods(snapshot(c1).entries,{year:2026,month:1,asOf:new Date().toISOString()}).selected.byAudience.client.paymentCents,0);
 assert.throws(()=>run(a,{...second,version:invoice.version-1}),status(409));
 assert.throws(()=>run(a,{action:'update_invoice',id:invoice.id,version:invoice.version,status:'paid'}),status(422));
});
test('project dossier uses the authorized snapshot and rejects other scopes',()=>{
 const report=projectDossier(c1,p.id);assert.equal(report.project.id,p.id);assert.equal(report.procurement.length,0);
 assert.throws(()=>projectDossier(c1,foreign.id),status(404));assert.throws(()=>projectDossier(v,p.id),status(403));
 assert.equal(projectDossier(a,p.id).procurement.length,0);assert.doesNotMatch(JSON.stringify(report),/blobPath|Foreign fixture/);
});


test('zero settlements and malformed imported payment histories cannot create false balances',()=>{
 const zero=run(a,{action:'record_invoice',projectId:p.id,reference:'ZERO-DATE',amountUsd:0,issuedOn:'2026-02-01',audience:'client'});
 assert.throws(()=>run(a,{action:'update_invoice',id:zero.id,version:zero.version,status:'paid',paidOn:'2026-01-01'}),status(422));
 let invoice=run(a,{action:'record_invoice',projectId:p.id,reference:'MALFORMED-HISTORY',amountUsd:5,issuedOn:'2026-01-01',audience:'client'});
 invoice=run(a,{action:'update_invoice',id:invoice.id,version:invoice.version,status:'approved'});
 const history={id:'duplicate',amountUsd:1,occurredOn:'2026-01-02',reference:'Import',recordedAt:new Date().toISOString()};
 for(const payments of [null,[{...history,occurredOn:'2026-02-30'}],[history,history]]){
   database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({...invoice.data,payments}),invoice.id);
   assert.throws(()=>run(a,{action:'record_invoice_payment',invoiceId:invoice.id,version:invoice.version,amountUsd:1,occurredOn:'2026-02-01',reference:'Next'}),status(409));
   assert.equal(financialSummary(a,p.id).approvedOutstandingNeedsReviewCount,1);
 }
 database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify(invoice.data),invoice.id);
});
