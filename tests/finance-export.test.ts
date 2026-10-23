import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync} from 'node:fs';import os from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';
import type {Actor} from '../lib/auth';
import {execute,database} from '../lib/erp';
import {csvCell,financeExport} from '../lib/finance-export';
process.env.TAYCO_ERP_DB_PATH=path.join(mkdtempSync(path.join(os.tmpdir(),'tayco-export-')),'test.sqlite');
process.env.TAYCO_AUTH_DB_PATH=process.env.TAYCO_ERP_DB_PATH+'.auth.sqlite';
const actor={id:'a',role:'admin',tenantId:'a',projectIds:[],email:'a@example.test'} as Actor;
test('CSV escapes spreadsheet formulas, quotes, linebreaks and unknowns',()=>{
 assert.equal(csvCell('  =HYPERLINK("x")'),'"\'  =HYPERLINK(""x"")"');
 assert.equal(csvCell('x\ny'),'"x\ny"');assert.equal(csvCell(null),'""');assert.equal(csvCell(0),'"0"');
});
test('export is tenant scoped and preserves zero without claiming synchronization',()=>{
 const p=execute(actor,randomUUID(),{action:'create_project',name:'=Danger',budgetUsd:0});
 execute({...actor,tenantId:'b'},randomUUID(),{action:'create_project',name:'Private B',budgetUsd:900});
 execute(actor,randomUUID(),{action:'record_invoice',projectId:p.id,reference:'@test',amountUsd:0});
 const csv=financeExport(actor,p.id);
 assert.match(csv,/'=Danger/);assert.match(csv,/'@test/);assert.doesNotMatch(csv,/Private B/);assert.match(csv,/"0"/);assert.match(csv,/not a payment transfer/);
 assert.throws(()=>financeExport({...actor,role:'client',projectIds:[p.id]}),/team member/);
 assert.throws(()=>financeExport(actor,'missing'),/not found/);
});
test('export identifies missing approvals and excludes malformed stored monetary values',()=>{
 const p=execute(actor,randomUUID(),{action:'create_project',name:'Legacy export fixture',budgetUsd:0});
 const i=execute(actor,randomUUID(),{action:'record_invoice',projectId:p.id,reference:'Invalid precision',amountUsd:1});
 database().prepare('UPDATE records SET payload=? WHERE id=?').run(JSON.stringify({...i.data,amountUsd:0.001}),i.id);
 const csv=financeExport(actor,p.id);
 assert.match(csv,/approval_not_recorded/);assert.match(csv,/review_required/);assert.doesNotMatch(csv,/0\.001|approved_budget/);
 const columns=csv.trim().split('\r\n').map(row=>row.match(/"(?:[^"]|"")*"/g)!.length);
 assert.equal(new Set(columns).size,1);
});

