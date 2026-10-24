import type {Actor} from './auth';
import {insurerPolicy,readInsurerSource} from './insurer-review-policy';
import {parseProfileAReviewSource,type ProfileAReview} from './profile-a-review';
import {viewerScope,TakeoffViewerAccessError} from './takeoff-viewer-access';
export function insurerReviewData(actor:Actor):ProfileAReview{
 const policy=insurerPolicy(actor),{bytes}=readInsurerSource(policy);
 let available=new Set<string>();try{available=new Set(viewerScope(actor).documentIds);}catch(error){if(!(error instanceof TakeoffViewerAccessError)||error.status!==403)throw error;}
 const data=parseProfileAReviewSource(actor.tenantId,bytes,policy.sourceSha256,policy.documents.filter(d=>available.has(d.viewerDocumentId)).map(d=>({sha256:d.sourceSha256,contextKey:d.contextKey,viewerDocumentId:d.viewerDocumentId})));
 const rows=data.rows.filter(r=>policy.opportunityIds.includes(r.id)),documents=rows.flatMap(r=>r.documents);
 return {...data,rows,opportunityCount:rows.length,reportedDatedCount:rows.filter(r=>r.section==='dated').length,undatedCount:rows.filter(r=>r.section==='undated').length,liveCount:rows.filter(r=>r.section==='live').length,
 documentCount:documents.length,receivedDocumentCount:documents.filter(d=>d.state==='received').length,linkedDocumentCount:documents.filter(d=>d.viewerHref).length};
}
