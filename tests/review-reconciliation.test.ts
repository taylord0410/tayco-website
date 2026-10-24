import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { injectViewerReviewBridge } from "../lib/viewer-interaction-bridge";
import type { ProfileAReview } from "../lib/profile-a-review";

const require = createRequire(import.meta.url);
require.extensions[".css"] = () => undefined;
const load = () => import("../components/workspace/ProfileAReviewConsole");
type Row = ProfileAReview["rows"][number];
const href = "/api/takeoff-viewer/viewer?project=synthetic-context&document=synthetic-doc&embed=1";
const row = (): Row => ({id:"synthetic-row",name:"SYNTHETIC opportunity",location:null,contractor:null,
  section:"undated",reportedDeadline:null,documents:[{name:"SYNTHETIC.pdf",state:"received",recipientAccess:"available",viewerHref:href}]});

test("one-click selector skips unavailable, stale, generic and external links without changing DTO",async()=>{
  const {firstReviewDocumentHref}=await load();
  const value=row(), available=value.documents[0];
  value.documents=[
    {...available,state:"pending"}, {...available,recipientAccess:"not_selected"},
    {...available,recipientAccess:"authorization_unavailable"}, {...available,recipientAccess:"source_pending"},
    {...available,viewerHref:null},{...available,viewerHref:"/api/takeoff-viewer/viewer?embed=1"},
    {...available,viewerHref:"https://example.test/not-authorized"},available,
  ];
  const before=JSON.stringify(value);
  assert.equal(firstReviewDocumentHref(value),href);
  value.documents.pop();assert.equal(firstReviewDocumentHref(value),null);
  value.documents.push(available);assert.equal(JSON.stringify(value),before);
});

test("actual launcher renders mixed portfolio labels and its actual click handler selects only its own row id",async()=>{
  const {ReviewOpportunityLauncher,firstReviewDocumentHref}=await load();
  const available=row(),pending=row();pending.id="synthetic-pending";pending.documents[0].state="pending";
  const rows=Array.from({length:23},(_,i)=>i===0?available:{...pending,id:"synthetic-pending-"+i});
  const before=JSON.stringify(rows),selected:string[]=[];
  const tree=ReviewOpportunityLauncher({rows,onOpen:id=>selected.push(id)});
  const markup=renderToStaticMarkup(tree);
  assert.equal(markup.split("View drawing →").length-1,1);
  assert.equal(markup.split("Review source status →").length-1,22);
  assert.doesNotMatch(markup,/verified drawing set|all.*connected|Download disabled|Overdue|Mint Cannabis|Moorhead/);
  const grid=tree.props.children[2],buttons=grid.props.children;
  buttons[0].props.onClick();buttons[1].props.onClick();
  assert.deepEqual(selected,["synthetic-row","synthetic-pending-1"]);
  assert.equal(firstReviewDocumentHref(rows[1]),null);
  assert.equal(JSON.stringify(rows),before);
});

test("launcher supplied link remains subject to withdrawal when snapshot, selected row or access changes",async()=>{
  const {firstReviewDocumentHref,selectedReviewDocumentUrl}=await load();
  const value=row(),url=firstReviewDocumentHref(value),asOf="synthetic-snapshot";
  assert.equal(selectedReviewDocumentUrl(value,url,asOf,asOf),href);
  assert.equal(selectedReviewDocumentUrl(value,url,asOf,"new-snapshot"),null);
  value.documents[0].recipientAccess="not_selected";
  assert.equal(selectedReviewDocumentUrl(value,url,asOf,asOf),null);
  assert.equal(firstReviewDocumentHref(value),null);
});

test("actual reader markup keeps expand/reload and explicit source without a save-prevention, page-reading or fabricated-duration claim",async()=>{
  const {default:Reader}=await import("../components/workspace/TakeoffProjectReader");
  const markup=renderToStaticMarkup(createElement(Reader,{source:href,projectName:"SYNTHETIC drawing",privacyNotice:false}));
  assert.match(markup,/Expand reader/);assert.match(markup,/Reload reader/);
  assert.match(markup,/Download controls hidden/);
  assert.match(markup,/does not prevent saving displayed content/);
  assert.match(markup,/do not establish that a person read a page/);
  assert.match(markup,/synthetic-context/);assert.match(markup,/source document reader/);
  assert.doesNotMatch(markup,/3-hour|4-hour|external saving are disabled|each page inspection is logged|approved project plans|Open reader in a new tab/);
});

test("peer shell link suppression is idempotent and preserves source text and canvas controls",()=>{
  const raw='<html><head></head><body><a id="openPdfLink" href="/api/v1/assets/synthetic">Open PDF</a><canvas id="page"></canvas><input id="pageNumber" value="1"><p>SYNTHETIC source text</p></body></html>';
  const rewritten=injectViewerReviewBridge(raw);
  assert.doesNotMatch(rewritten,/<a[^>]+openPdfLink/);assert.match(rewritten,/<canvas id="page">/);
  assert.match(rewritten,/pageNumber/);assert.match(rewritten,/SYNTHETIC source text/);
  assert.equal(injectViewerReviewBridge(rewritten),rewritten);
});

for (const size of [23,33,34]) {
  test("actual console keeps exactly the supplied "+size+" rows without static batch enrichment",async()=>{
    const {default:Console}=await load();
    const rows=Array.from({length:size},(_,i)=>{
      const value=row();value.id="reported-opportunity-"+(i+1);
      value.name="SYNTHETIC supplied row "+i;value.documents[0].name="SYNTHETIC supplied source "+i;
      if(i%3===0){value.documents[0].state="pending";value.documents[0].viewerHref=null;}
      return value;
    });
    const received=rows.filter(r=>r.documents[0].state==="received").length;
    const data:ProfileAReview={period:"2026-10",sourceLabel:"SYNTHETIC explicit DTO",opportunityCount:size,
      reportedDatedCount:0,undatedCount:size,liveCount:0,documentCount:size,receivedDocumentCount:received,
      linkedDocumentCount:received,rows};
    const before=JSON.stringify(data);
    const markup=renderToStaticMarkup(createElement(Console,{data}));
    assert.match(markup,new RegExp(size+" reported opportunities and "+size+" listed source documents"));
    assert.equal(markup.split("View drawing →").length-1,received);
    assert.equal(markup.split("Review source status →").length-1,size-received);
    assert.match(markup,new RegExp("SYNTHETIC supplied row "+(size-1)));
    assert.doesNotMatch(markup,/US.Bank|Hamilton Main|Fairmont|LOTES_123|doc_lotes123_|IDOT Maintenance|Overdue|100%|3h window/);
    assert.equal(JSON.stringify(data),before);
  });
}
