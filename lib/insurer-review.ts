import type {Actor} from './auth';
import type {RecipientDocumentAccess} from './profile-a-document-availability';
import {insurerPolicy,readInsurerSource} from './insurer-review-policy';
import {parseProfileAReviewSource,type ProfileAReview} from './profile-a-review';
import {viewerScope,TakeoffViewerAccessError} from './takeoff-viewer-access';
export function insurerReviewData(actor:Actor):ProfileAReview{
 const policy=insurerPolicy(actor),{bytes}=readInsurerSource(policy);
 let available=new Set<string>();try{available=new Set(viewerScope(actor).documentIds);}catch(error){if(!(error instanceof TakeoffViewerAccessError)||error.status!==403)throw error;}
 const data=parseProfileAReviewSource(actor.tenantId,bytes,policy.sourceSha256,policy.documents.filter(d=>available.has(d.viewerDocumentId)).map(d=>({sha256:d.sourceSha256,contextKey:d.contextKey,viewerDocumentId:d.viewerDocumentId})));
 const source=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as {rows:{id:string;documents:{sha256:string|null}[]}[]};
 const sourceRows=new Map(source.rows.map(r=>[r.id,r])),selectedHashes=new Set(policy.documents.map(d=>d.sourceSha256));
 const rows=data.rows.filter(r=>policy.opportunityIds.includes(r.id)).map(row=>({...row,documents:row.documents.map((doc,index)=>{
  const sha=sourceRows.get(row.id)!.documents[index].sha256;
  const recipientAccess:RecipientDocumentAccess=doc.state==='pending'?'source_pending':!selectedHashes.has(sha!)?'not_selected':doc.viewerHref?'available':'authorization_unavailable';
  return {...doc,recipientAccess};
 })})),documents=rows.flatMap(r=>r.documents);
 const recipientCoverage={asOf:new Date().toISOString(),availableDocumentCount:documents.filter(d=>d.recipientAccess==='available').length,
  notSelectedDocumentCount:documents.filter(d=>d.recipientAccess==='not_selected').length,unavailableDocumentCount:documents.filter(d=>d.recipientAccess==='authorization_unavailable').length,pendingSourceDocumentCount:documents.filter(d=>d.recipientAccess==='source_pending').length};
 return {...data,rows,recipientCoverage,opportunityCount:rows.length,reportedDatedCount:rows.filter(r=>r.section==='dated').length,undatedCount:rows.filter(r=>r.section==='undated').length,liveCount:rows.filter(r=>r.section==='live').length,
 documentCount:documents.length,receivedDocumentCount:documents.filter(d=>d.state==='received').length,linkedDocumentCount:documents.filter(d=>d.viewerHref).length};
}
