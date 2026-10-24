import { isGuestSection,type GuestSection } from './guest-sections';
export const REVIEW_INTERACTION_VERSION=2 as const;
export const REVIEW_INTERACTION_LABELS={
 'review.visit':'Review interface opened','account.open':'Account link selected','session.signout':'Sign out selected',
 'module.select':'Module selected','month.select':'Month selected','year.select':'Year selected','review.refresh':'Refresh selected',
 'project.open':'Project selected','document.open':'Document link selected','menu.toggle':'Module menu toggled',
 'display.theme':'Theme control selected','display.density':'Density control selected','display.light':'Light direction control selected',
 'viewer.reload':'Reader reload selected','viewer.new_tab':'Reader new tab selected',
 'viewer.document.select':'Reader document selected','viewer.page.previous':'Previous page selected','viewer.page.next':'Next page selected',
 'viewer.page.go':'Page number submitted','viewer.zoom.change':'Reader zoom control changed','viewer.info.toggle':'Reader information toggled',
 'viewer.catalog.toggle':'Reader catalog toggled','viewer.catalog.open':'Reader catalog selected',
} as const;
export type ReviewInteractionElement=keyof typeof REVIEW_INTERACTION_LABELS;
export type ReviewInteractionInput={taxonomyVersion:2;eventId:string;elementId:ReviewInteractionElement;section?:GuestSection;period?:string;year?:number;projectId?:string;documentId?:string;pageNumber?:number};
export class ReviewInteractionError extends Error{constructor(message:string,public status=400){super(message);}}
const opaque=(v:unknown):v is string=>typeof v==='string'&&/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(v);
export function parseReviewInteraction(value:unknown,now=Date.now()):ReviewInteractionInput{
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ReviewInteractionError('Choose a known review interaction.');
 const x=value as Record<string,unknown>;
 if(x.taxonomyVersion!==REVIEW_INTERACTION_VERSION||typeof x.eventId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x.eventId)
  ||typeof x.elementId!=='string'||!Object.hasOwn(REVIEW_INTERACTION_LABELS,x.elementId))throw new ReviewInteractionError('Use the current interaction contract and event reference.');
 const out:ReviewInteractionInput={taxonomyVersion:2,eventId:x.eventId.toLowerCase(),elementId:x.elementId as ReviewInteractionElement};
 const fields=['taxonomyVersion','eventId','elementId'];
 const need=(key:string,valid:boolean)=>{if(!valid)throw new ReviewInteractionError('This interaction needs valid, permitted metadata.');fields.push(key);};
 if(out.elementId==='module.select'){need('section',isGuestSection(x.section));out.section=x.section as GuestSection;}
 if(out.elementId==='month.select'){
  need('period',typeof x.period==='string'&&/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(x.period)&&x.period<=new Date(now).toISOString().slice(0,7));out.period=x.period as string;
 }
 if(out.elementId==='year.select'){need('year',Number.isInteger(x.year)&&Number(x.year)>0&&Number(x.year)<=new Date(now).getUTCFullYear());out.year=x.year as number;}
 if(out.elementId==='project.open'){need('projectId',opaque(x.projectId));out.projectId=x.projectId as string;}
 if(out.elementId==='document.open'||out.elementId.startsWith('viewer.')){need('documentId',opaque(x.documentId));out.documentId=x.documentId as string;}
 if(out.elementId.startsWith('viewer.page.')){need('pageNumber',Number.isInteger(x.pageNumber)&&Number(x.pageNumber)>0&&Number(x.pageNumber)<=1_000_000);out.pageNumber=x.pageNumber as number;}
 if(Object.keys(x).some(k=>!fields.includes(k)))throw new ReviewInteractionError('Unsupported interaction metadata.');
 return out;
}
