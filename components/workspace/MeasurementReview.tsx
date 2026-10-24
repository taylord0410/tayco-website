"use client";
import {useEffect,useRef,useState} from "react";
import type {measurementReview} from "@/lib/m02-intake";
import TakeoffProjectReader from "@/components/workspace/TakeoffProjectReader";
type Review=Awaited<ReturnType<typeof measurementReview>>;
export default function MeasurementReview({projectId}:{projectId:string}){
 const [loaded,setLoaded]=useState<{projectId:string;value:Review|null;error:string}|null>(null);
 const [revision,setRevision]=useState(0);
 const [reader,setReader]=useState<{projectId:string;asOf:string;href:string}|null>(null);
 const readerPanel=useRef<HTMLDivElement>(null);
 useEffect(()=>{readerPanel.current?.scrollIntoView({block:"start"});},[reader]);
 useEffect(()=>{
  if(!projectId)return;
  const controller=new AbortController();
  fetch("/api/measurements?projectId="+encodeURIComponent(projectId),{cache:"no-store",signal:controller.signal})
   .then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error||"Measurement review unavailable.");return body as Review;})
   .then(value=>setLoaded({projectId,value,error:""}))
   .catch(error=>{if(!controller.signal.aborted)setLoaded({projectId,value:null,error:error instanceof Error?error.message:"Measurement review unavailable."});});
  return()=>controller.abort();
 },[projectId,revision]);
 const state=loaded?.projectId===projectId?loaded:null;
 if(!projectId)return <p className="rounded-xl border border-slate-700 p-4 text-sm text-slate-300">Select one existing project to review received measurements.</p>;
 return <section className="min-w-0 space-y-4 rounded-xl border border-amber-200/20 bg-slate-950/40 p-4 sm:p-6" data-testid="measurement-review">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-amber-100">Received measurements</h2><p className="mt-1 max-w-3xl text-sm text-slate-300">Producer reported quantities and price evidence. Technical checks do not approve scope, quantities, prices or a contract.</p></div><button className="min-h-11 rounded-lg border border-slate-600 px-4 text-sm" onClick={()=>{setLoaded(null);setRevision(x=>x+1);}}>Refresh measurements</button></header>
  {!state?<p role="status">Loading measurement review…</p>:state.error?<p role="alert" className="text-sm text-amber-200">{state.error}</p>:state.value&&<>
   <p className="text-xs text-slate-400">Observed {state.value.asOf} · {state.value.name}</p>
   {state.value.receipts.length===0?<p className="text-sm text-slate-300">No measurement package has been received for this project. Missing quantities and prices are not zero.</p>:state.value.receipts.map(receipt=><details key={receipt.id} open={receipt.current} className="min-w-0 rounded-lg border border-slate-700 p-3">
    <summary className="min-h-11 cursor-pointer break-words text-sm font-semibold text-white">{receipt.packageId} · {receipt.revision} · {receipt.current?"Current received revision":"Earlier revision — retained for review"}</summary>
    <p className="my-3 text-xs text-slate-400">Received {receipt.receivedAt} · {receipt.measurementCount} measurements · {receipt.boqLineCount} source BOQ lines. No automatic sum across revisions.</p>
    <div className="grid min-w-0 gap-3 lg:grid-cols-2">{receipt.measurements.map(item=><article key={item.stableId} className="min-w-0 rounded-lg bg-slate-900 p-4">
     <h3 className="break-words text-sm font-semibold">{item.measurementId}</h3>
     <p className="mt-2 text-amber-200">Quantity: {item.quantity===null?"Pending — not zero":item.quantity+" "+item.unit}</p>
     <p className="mt-1 text-xs text-slate-300">Producer status: {item.reviewStatus} · {item.scopeRelation} · page {item.pageNumber} · {item.method}</p>
     {item.pendingReason&&<p className="mt-2 break-words text-sm text-slate-300">{item.pendingReason}</p>}
     <details className="mt-2"><summary className="min-h-11 cursor-pointer text-sm">Evidence and assumptions</summary><p className="break-words text-xs text-slate-400">Region {item.viewportId} · document revision {item.documentRevision}</p><ul className="mt-2 list-disc space-y-2 pl-5 text-xs text-slate-300">{item.assumptions.map((value,index)=><li key={index} className="break-words">{value}</li>)}</ul><ul className="mt-2 space-y-2 text-xs text-slate-400">{item.evidence.map((e,index)=><li key={index} className="break-words">{e.evidenceId} · {e.kind} · page {e.pageNumber} · evidence {e.artifactRef}</li>)}</ul></details>
     <button className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-amber-200 underline" onClick={()=>setReader({projectId,asOf:state.value!.asOf,href:item.documentHref})}>Open source PDF</button>
    </article>)}</div>
    <details className="mt-4"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Separate BOQ and price evidence</summary><div className="grid min-w-0 gap-3 lg:grid-cols-2">{receipt.boqLines.map(line=><article key={line.lineId+"-"+line.revision} className="min-w-0 rounded-lg bg-slate-900 p-4 text-sm">
     <h3 className="break-words font-semibold">{line.description}</h3><p className="mt-2">Producer inclusion: {line.inclusionStatus} · quantity {line.quantity??"Pending"} {line.unit}</p><p className="mt-2 text-amber-200">Price: {line.rate===null?"Pending — no approved rate":line.rate+" "+(line.currency??"currency pending")} · {line.pricingState}</p><p className="mt-2 break-words text-xs text-slate-400">{line.aggregationRule}</p>{line.priceSourceRef&&<p className="mt-2 break-words text-xs text-slate-400">Price source {String(line.priceSourceRef.sourceId??"")} · {String(line.priceSourceRef.effectiveDate??"")} · {String(line.priceSourceRef.scope??"")}. A material quote is not an installed APU.</p>}
    </article>)}</div></details>
    {receipt.partial&&<p className="mt-3 text-xs text-amber-200">Partial review: at most 200 measurements and 200 BOQ lines are displayed. The original package is retained privately.</p>}
   </details>)}
   {state.value.partial&&<p className="text-xs text-amber-200">Only the 20 most recent matching receipts are shown.</p>}
   {reader?.projectId===projectId&&reader.asOf===state.value.asOf&&<div ref={readerPanel} data-testid="measurement-source-reader"><button className="mb-3 min-h-11 rounded-lg border border-slate-600 px-4 text-sm" onClick={()=>setReader(null)}>Close source reader</button><TakeoffProjectReader key={reader.href+reader.asOf} source={reader.href} projectName={state.value.name} privacyNotice={false}/></div>}
  </>}
 </section>;
}
