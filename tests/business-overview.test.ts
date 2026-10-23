import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBusinessOverview } from '../lib/business-overview';
import type { Entry } from '../lib/erp';
const entry=(id:string,kind:Entry['kind'],data:Entry['data'],projectId='p'):Entry=>({id,kind,data,projectId,ownerId:'staff',tenantId:'fixture',createdAt:'2026-10-01T01:00:00Z',updatedAt:'2026-10-23T01:00:00Z',version:1});
const month={month:'2026-10',asOf:'2026-10-23T10:00:00Z'};
const staff=[{id:'staff',email:'staff@example.test',role:'staff'}];
test('monthly proposals use source dates; state inventory and cash remain separate',()=>{
 const rows=[entry('p','project',{name:'Synthetic',status:'planning',progress:null}),entry('a','proposal',{status:'accepted',amountUsd:40.05,issuedOn:'2026-09-01',decidedOn:'2026-10-01'}),entry('b','proposal',{status:'sent',amountUsd:59.95,issuedOn:'2026-10-02'}),entry('c','proposal',{status:'draft',amountUsd:10,issuedOn:'2026-10-01'}),entry('d','bid',{status:'accepted',amountUsd:999}),entry('e','lead',{status:'accepted'})];
 const report=buildBusinessOverview(rows,staff,month);
 assert.equal(report.proposals.acceptedAmountUsd,40.05);assert.equal(report.proposals.issuedAmountUsd,59.95);assert.equal(report.proposals.pendingAmountUsd,69.95);assert.equal(report.projects[0].progress,null);
 assert.equal(report.proposals.counts.reduce((n,x)=>n+x.count,0),3);assert.equal(report.activity.requestsReceived,1);
 const old=buildBusinessOverview(rows,staff,{...month,month:'2026-09'});assert.equal(old.proposals.acceptedCount,0);assert.equal(old.proposals.issuedAmountUsd,40.05);assert.equal(old.proposals.pendingAmountUsd,69.95);
});
test('project membership and work logs have separate dated provenance and unknown coverage',()=>{
 const rows=[entry('p','project',{name:'Synthetic',status:'active',progress:25,teamMembers:[{memberId:'staff',responsibility:'Superintendent',assignedOn:'2026-09-01',removedOn:null}]}),entry('h','hours',{date:'2026-10-03',hours:3.5,status:'approved'}),{...entry('u','hours',{date:'2026-10-04',hours:2,status:'submitted'}),ownerId:'external'},entry('bad','hours',{hours:4,status:'submitted'}),entry('past','hours',{date:'2026-09-01',hours:20,status:'approved'})];
 const report=buildBusinessOverview(rows,staff,month);assert.equal(report.projects[0].teamMemberCount,1);assert.equal(report.team.length,1);assert.equal(report.team[0].approvedHours,3.5);assert.deepEqual(report.team[0].responsibilities,['Superintendent']);assert.equal(report.activity.workHours,5.5);assert.equal(report.activity.unknownSubmitters,1);assert.equal(report.activity.undatedWorkLogs,1);
});
test('project scoping excludes orphan estimates/proposals; malformed dates and amounts cannot silently distort totals',()=>{
 const rows=[entry('p','project',{status:'legacy',progress:'60'}),entry('x','proposal',{status:'accepted',issuedOn:'2026-02-30',amountUsd:'100'}),entry('other','proposal',{status:'accepted',issuedOn:'2026-10-01',decidedOn:'2026-10-02',amountUsd:9999},'unauthorized')];
 const report=buildBusinessOverview(rows,staff,month);assert.equal(report.proposals.undatedCount,1);assert.equal(report.proposals.acceptedAmountUsd,0);assert.equal(report.projectCounts.find(x=>x.status==='unknown')?.count,1);assert.equal(report.projects[0].progress,null);assert.ok(report.coverageNotes.length>0);
 assert.throws(()=>buildBusinessOverview(rows,staff,{...month,month:'2026-13'}));
});
