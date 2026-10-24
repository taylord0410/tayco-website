"use client";
import {useEffect,useState,type ReactNode} from 'react';
import {clearGuestAnalytics} from '@/lib/guest-privacy-client';
/** Retires the entire displayed projection, including the RSC header, at its server deadline.
 * Server authorization remains authoritative; this is not an access grant. */
export default function ReviewDeadlineBoundary({review,children}:{review?:{id:string;expiresAt:number;asOf:number};children:ReactNode}){
 const[endedReview,setEndedReview]=useState<string|null>(null);
 const id=review?.id,expiresAt=review?.expiresAt,asOf=review?.asOf;
 useEffect(()=>{
  if(!id||expiresAt===undefined||asOf===undefined)return;
  const timer=setTimeout(()=>{clearGuestAnalytics();setEndedReview(id);},Math.max(0,expiresAt-Math.max(asOf,Date.now())));
  return()=>clearTimeout(timer);
 },[id,expiresAt,asOf]);
 if(id&&endedReview===id)return <main className="min-h-screen bg-[#070e1a] p-7 text-slate-100"><h1 className="text-3xl font-bold">Review access has ended</h1><p className="mt-4">The private project information and reader have been removed. Signing in or refreshing does not renew this review.</p><a href="/account" className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-amber-200/30 px-4 py-3 text-amber-100">Account and access</a></main>;
 return children;
}
