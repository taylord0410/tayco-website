"use client";
import { useCallback,useEffect,useRef } from 'react';
import { createReviewInteractionQueue } from './review-interaction-queue';
import { guestAnalyticsAllowed,guestAnalyticsRemainingMs,subscribeGuestPrivacy } from './guest-privacy-client';
import type { ReviewInteractionElement,ReviewInteractionInput } from './review-interaction-contract';
export function useReviewInteractions(reviewId:string|null|undefined){
 const current=useRef<ReturnType<typeof createReviewInteractionQueue>|null>(null);
 useEffect(()=>{
  if(!reviewId)return;
  const queue=createReviewInteractionQueue({permitted:()=>guestAnalyticsAllowed(reviewId),remainingMs:()=>guestAnalyticsRemainingMs(reviewId),
   send:async(input,signal)=>{
    const response=await fetch('/api/guest-activity',{method:'POST',credentials:'same-origin',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal});
    return{status:response.status,...(response.ok?{body:await response.json()}:{} )};
   }});
  current.current=queue;
  const unsubscribe=subscribeGuestPrivacy(()=>{if(!guestAnalyticsAllowed(reviewId))queue.clear();});
  const leave=()=>queue.clear();window.addEventListener('pagehide',leave);
  return()=>{unsubscribe();window.removeEventListener('pagehide',leave);queue.dispose();if(current.current===queue)current.current=null;};
 },[reviewId]);
 return useCallback((elementId:ReviewInteractionElement,metadata:Omit<Partial<ReviewInteractionInput>,'elementId'|'eventId'|'taxonomyVersion'>={},eventId?:string)=>guestAnalyticsAllowed(reviewId)?current.current?.enqueue(elementId,metadata,eventId)??false:false,[reviewId]);
}
