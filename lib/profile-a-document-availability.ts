/** Presentation states, never authority. Source receipt and recipient access remain independent. */
export type RecipientDocumentAccess='available'|'not_selected'|'authorization_unavailable'|'source_pending';
export type RecipientDocumentCoverage={asOf:string;availableDocumentCount:number;notSelectedDocumentCount:number;unavailableDocumentCount:number;pendingSourceDocumentCount:number};
const labels:Record<RecipientDocumentAccess,string>={
 available:'Received · available for this review',
 not_selected:'Received · not selected for this review',
 authorization_unavailable:'Received · access currently unavailable',
 source_pending:'Pending at source',
};
export function profileDocumentAvailabilityLabel(document:{state:'received'|'pending';viewerHref:string|null;recipientAccess?:RecipientDocumentAccess}){
 if(document.recipientAccess)return labels[document.recipientAccess];
 return document.state==='pending'?'Pending at source':document.viewerHref?'Authenticated viewer available':'Received · viewer not connected in this preview';
}
