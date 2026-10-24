"use client";

import { useState,useRef,useEffect,useCallback } from "react";
import GuestPrivacyNotice from "../GuestPrivacyNotice";
import {useReviewInteractions} from "@/lib/use-review-interactions";
import {guestAnalyticsAllowed,guestAnalyticsRemainingMs,subscribeGuestPrivacy} from "@/lib/guest-privacy-client";
import {readViewerInteraction} from "@/lib/viewer-interaction-bridge";

type Props = { source: string; projectName: string;review?:{id:string;expiresAt:number;asOf:number} };
const button = "inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200";
export default function TakeoffProjectReader({ source, projectName,review }: Props) {
  const [reload, setReload] = useState(0);
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expired,setExpired]=useState(false),[ready,setReady]=useState<string|null>(null);
  const frame=useRef<HTMLIFrameElement>(null),visit=useRef<string|null>(null);
  const record=useReviewInteractions(review?.id);
  const selectedDocument=new URL(source,"http://tayco.local").searchParams.get("document");
  const publish=useCallback((reader=true)=>{
    const remaining=guestAnalyticsRemainingMs(review?.id),enabled=reader&&!expired&&remaining>0&&guestAnalyticsAllowed(review?.id);
    frame.current?.contentWindow?.postMessage({type:"tayco-review-viewer-control",taxonomyVersion:2,enabled,remainingMs:enabled?Math.min(remaining,14400000):0},window.location.origin);
  },[review?.id,expired]);
  useEffect(()=>{
    if(!review||expired)return;
    const timer=setTimeout(()=>{publish(false);setExpired(true);},Math.max(0,review.expiresAt-Math.max(review.asOf,Date.now())));
    return()=>clearTimeout(timer);
  },[review,publish,expired]);
  useEffect(()=>{
    const receive=(event:MessageEvent)=>{
      if(expired)return;
      const input=readViewerInteraction(event,{origin:window.location.origin,source:frame.current?.contentWindow});
      if(input){const{elementId,...metadata}=input;record(elementId,metadata);}
    };
    window.addEventListener("message",receive);
    const unsubscribe=subscribeGuestPrivacy(()=>publish());
    return()=>{window.removeEventListener("message",receive);unsubscribe();publish(false);};
  },[record,publish,expired]);
  useEffect(()=>{if(!ready)return;visit.current||=crypto.randomUUID();record("review.visit",{},visit.current);},[ready,record]);
  if(expired)return <section role="alert" className="rounded-xl border border-amber-200/30 p-6 text-slate-100"><h2 className="text-xl font-bold">Review access has ended</h2><p className="mt-3">The private reader has been removed. Signing in or refreshing does not renew this review.</p><a href="/account" className={button+" mt-4"}>Account and access</a></section>;
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-amber-200/20 bg-[#0b192e]" aria-label="Protected project reader">
    {review&&<div className="px-4"><GuestPrivacyNotice onReady={setReady}/></div>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/15 p-4"><div className="min-w-0"><h2 className="font-bold text-white">Project reader</h2><p role="status" className="mt-1 text-xs leading-relaxed text-slate-400">{failed ? "The reader window could not be opened. Retry or return to the workspace." : opened ? "Reader window opened. Document loading and available content are shown inside the reader." : "Opening the private reader…"}</p></div><div className="flex flex-wrap gap-2"><button className={button} type="button" onClick={() => { if(selectedDocument)record("viewer.reload",{documentId:selectedDocument});publish(false);setOpened(false); setFailed(false); setReload(value => value + 1); }}>Reload reader</button><a className={button} href={source} onClick={()=>{if(selectedDocument)record("viewer.new_tab",{documentId:selectedDocument});}} target="_blank" rel="noopener noreferrer">Open reader in a new tab ↗</a></div></div>
    {failed && <div role="alert" className="m-4 rounded-xl border border-amber-200/25 bg-amber-200/5 p-5 text-sm leading-relaxed text-slate-200">The private reader is unavailable or your document access changed. Reload the reader to try again, or return to the workspace. No alternative public document link is used.</div>}
    <iframe ref={frame} key={reload} title={projectName + " · approved project plans"} src={source} loading="eager" referrerPolicy="same-origin" className={(failed ? "hidden" : "block") + " h-[78svh] min-h-[32rem] w-full border-0 bg-[#0b192e] sm:h-[82svh]"} onLoad={event => {
      try {
        const document = event.currentTarget.contentDocument;
        const isReader = document?.contentType === "text/html" && Boolean(document.querySelector("#mainContent"));
        setOpened(isReader); setFailed(!isReader);publish(isReader);
      } catch { setOpened(false); setFailed(true); }
    }} onError={() => { setFailed(true); setOpened(false); }} />
    <p className="border-t border-amber-200/15 px-4 py-3 text-xs leading-relaxed text-slate-400">Read-only access. Each document request is authorized separately. Source availability, OCR, calibration and quantities are reported by the reader; opening this window does not certify that processing is complete.</p>
  </section>;
}
