"use client";
import { GUEST_PRIVACY_VERSION, type GuestPrivacy } from './guest-privacy-contract';
let choice:GuestPrivacy|null=null;
let observedAt=0;
const listeners=new Set<()=>void>();
function changed(){for(const listener of listeners){try{listener();}catch{/* A failed observer must never block withdrawal. */}}}
export function subscribeGuestPrivacy(listener:()=>void){listeners.add(listener);return()=>{listeners.delete(listener);};}
export function clearGuestAnalytics(){choice=null;observedAt=0;changed();}
export function installGuestPrivacyChoice(value:GuestPrivacy){
  choice=value;observedAt=performance.now();changed();
}
export function guestAnalyticsAllowed(reviewId:string|null|undefined):boolean{
  return guestAnalyticsRemainingMs(reviewId)>0;
}
export function guestAnalyticsRemainingMs(reviewId:string|null|undefined):number{
  return !!reviewId&&choice?.reviewId===reviewId&&choice.version===GUEST_PRIVACY_VERSION&&choice.optionalAnalytics===true?Math.max(0,choice.expiresAt-choice.asOf-performance.now()+observedAt):0;
}
export function validGuestPrivacy(value:unknown):value is GuestPrivacy{
  if(!value||typeof value!=='object')return false;
  const p=value as GuestPrivacy;
  return p.version===GUEST_PRIVACY_VERSION&&typeof p.reviewId==='string'&&p.reviewId.length<=100&&p.reviewId.length>0&&
    (p.optionalAnalytics===null||typeof p.optionalAnalytics==='boolean')&&Number.isFinite(p.asOf)&&Number.isFinite(p.expiresAt)&&p.expiresAt>p.asOf;
}

export function externalPrivacyWithdrawal(value:unknown,source:string|null):boolean {
  if(!value||typeof value!=='object')return false;
  const signal=value as Record<string,unknown>;
  return signal.kind==='withdraw'&&typeof signal.source==='string'&&signal.source!==source;
}
