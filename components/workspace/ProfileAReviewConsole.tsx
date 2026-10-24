"use client";

import Image from "next/image";
import Link from "next/link";
import { useState,useEffect,useRef } from "react";
import GuestPrivacyNotice from "../GuestPrivacyNotice";
import TakeoffProjectReader from "./TakeoffProjectReader";
import {useReviewInteractions} from "@/lib/use-review-interactions";
import type { ProfileAReview } from "@/lib/profile-a-review";
import PortalShell from "./PortalShell";
import "./workspace.css";

const control = "min-h-11 rounded-lg border border-amber-200/30 px-4 py-3 text-left text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200";
const card = "rounded-2xl border border-amber-200/20 bg-[#10223c] p-5 sm:p-7";
const labelDate = (value: string) => new Date(value + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const sectionLabel = (value: "dated" | "undated" | "live") => value === "live" ? "Reported as still open" : value === "undated" ? "Deadline not documented" : "Reported bid opportunity";
export default function ProfileAReviewConsole({ data,review }: { data: ProfileAReview;review?:{id:string;expiresAt:number;asOf:number} }) {
  const record=useReviewInteractions(review?.id),[ready,setReady]=useState<string|null>(null),visit=useRef<string|null>(null);
  useEffect(()=>{if(ready){visit.current||=crypto.randomUUID();record("review.visit",{},visit.current);}},[ready,record]);
  const [section, setSection] = useState<"summary" | "timeline" | "projects">("summary");
  const [selected, setSelected] = useState(data.rows[0].id);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const project = data.rows.find(row => row.id === selected) ?? data.rows[0];
  const dated = data.rows.filter(row => row.reportedDeadline).sort((a, b) => a.reportedDeadline!.localeCompare(b.reportedDeadline!));
  const open = (id: string) => { record("opportunity.open",{opportunityId:id});setSelected(id); setSection("projects"); setDocumentUrl(null); };
  return <PortalShell className="min-h-screen bg-[#070e1a] text-slate-100" data-testid="profile-a-review"
    sidebar={<><Image src="/logo.jpeg" alt="TAYCO" width={196} height={62} priority className="h-14 w-auto max-w-full lg:h-auto lg:w-[196px]" />
      <p className="mt-4 text-xs uppercase tracking-[.2em] text-amber-200 lg:mt-7">Review workspace</p>
      <nav aria-label="Review sections" className="mt-3 grid grid-cols-3 gap-2 lg:mt-4 lg:grid-cols-1 lg:gap-3">{(["summary", "timeline", "projects"] as const).map(key => <button key={key} type="button" className={control + (section === key ? " bg-amber-200/15" : "")} aria-current={section === key ? "page" : undefined} onClick={() => { record("review.section.select",{reviewSection:key});setSection(key); setDocumentUrl(null); }}>{key === "summary" ? "Executive summary" : key === "timeline" ? "Reported chronology" : "Opportunity files"}</button>)}</nav>
      <Link className={control + " mt-4 block lg:mt-7"} href={review?"/account":"/portal"} onClick={()=>record("account.open")}>{review?"Account and access":"Return to administration"}</Link></>}
    header={<><div><p className="text-xs uppercase tracking-[.2em] text-amber-200">TAYCO · {data.period}</p><h1 className="mt-2 text-3xl font-bold">Opportunity review</h1><p className="mt-2 text-sm text-slate-300">{data.sourceLabel}</p></div><span className="rounded-lg border border-amber-200/30 px-4 py-3 text-sm text-amber-100">{review?"Recipient review · read only":"Administrative preview · read only"}</span></>}>
    {review&&<><GuestPrivacyNotice onReady={setReady}/><p className="my-3 text-sm text-amber-100">Access ends {new Date(review.expiresAt).toISOString()} UTC. Signing in or refreshing does not extend this review.</p></>}
    <p className="my-5 rounded-xl border border-slate-600 bg-[#0b1b31] p-4 text-sm leading-relaxed text-slate-300">This local review organizes reported opportunities and source documents. Reported deadlines remain unconfirmed. Receipt dates have not been supplied. No invitation or recipient access is created by this preview.</p>
    {section === "summary" && <section aria-label="Executive summary" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
        ["Reported opportunities", data.opportunityCount], ["Dated source records", data.reportedDatedCount],
        ["Deadlines not documented", data.undatedCount], ["Source files received", data.receivedDocumentCount],
      ].map(([label, value]) => <article key={label} className={card}><p className="text-sm text-slate-300">{label}</p><strong className="mt-3 block text-4xl text-white">{value}</strong></article>)}</div>
      <article className={card}><h2 className="text-xl font-bold">Source coverage</h2><p className="mt-3 leading-relaxed text-slate-300">{data.linkedDocumentCount} received files are connected to the authenticated viewer. {data.receivedDocumentCount - data.linkedDocumentCount} received files await viewer registration; {data.documentCount - data.receivedDocumentCount} listed files remain pending at source.</p><p className="mt-3 leading-relaxed text-slate-300">{data.liveCount} opportunity is reported as still open. These records do not establish awarded work, completed projects or financial results.</p><button className={control + " mt-5"} type="button" onClick={() => {record("review.section.select",{reviewSection:"projects"});setSection("projects");}}>Review opportunity files</button></article>
    </section>}
    {section === "timeline" && <section className={card} aria-label="Reported chronology"><h2 className="text-xl font-bold">Reported chronology</h2><p className="mt-2 text-sm text-slate-300">Dates reported with the source messages; not confirmed bid deadlines or receipt dates.</p><ol className="mt-5 space-y-3">{dated.map(row => <li key={row.id}><button type="button" className={control + " flex w-full flex-wrap items-center justify-between gap-3"} onClick={() => open(row.id)}><span>{row.name}</span><span>{labelDate(row.reportedDeadline!)} · unconfirmed</span></button></li>)}</ol><h3 className="mt-7 font-bold">No documented deadline</h3><ul className="mt-3 space-y-2">{data.rows.filter(row => !row.reportedDeadline).map(row => <li key={row.id}><button type="button" className={control + " w-full"} onClick={() => open(row.id)}>{row.name} · {sectionLabel(row.section)}</button></li>)}</ul></section>}
    {section === "projects" && <section aria-label="Opportunity files" className="space-y-5">
      <div className={card}><label htmlFor="review-opportunity" className="block text-sm font-semibold text-amber-100">Opportunity</label><select id="review-opportunity" className="mt-3 min-h-12 w-full min-w-0 rounded-lg border border-slate-500 bg-[#10223c] p-3 text-white" value={selected} onChange={event => open(event.target.value)}>{data.rows.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></div>
      <article className={card}><p className="text-xs uppercase tracking-widest text-amber-200">{sectionLabel(project.section)}</p><h2 className="mt-3 text-2xl font-bold">{project.name}</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-slate-400">Location reported</dt><dd className="mt-1">{project.location ?? "Not provided"}</dd></div><div><dt className="text-sm text-slate-400">Contractor reported</dt><dd className="mt-1">{project.contractor ?? "Not provided"}</dd></div><div><dt className="text-sm text-slate-400">Reported deadline</dt><dd className="mt-1">{project.reportedDeadline ? labelDate(project.reportedDeadline) + " · unconfirmed" : "Not documented"}</dd></div><div><dt className="text-sm text-slate-400">Receipt date</dt><dd className="mt-1">Not recorded</dd></div></dl>
        <h3 className="mt-7 text-lg font-bold">Source documents</h3><ul className="mt-4 space-y-3">{project.documents.map((doc, index) => <li key={index} className="min-w-0 rounded-xl border border-slate-600 p-4"><p className="break-words font-semibold">{doc.name}</p><p className="mt-2 text-sm text-slate-300">{doc.state === "pending" ? "Pending at source" : doc.viewerHref ? "Authenticated viewer available" : "Received · viewer registration pending"}</p>{doc.viewerHref && <button type="button" className={control + " mt-3"} onClick={() => {const documentId=new URL(doc.viewerHref!,"http://tayco.local").searchParams.get("document");if(documentId)record("viewer.document.select",{documentId});setDocumentUrl(doc.viewerHref);}}>Open protected document</button>}</li>)}</ul>
      </article>{documentUrl && <section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Protected drawing viewer</h3><button type="button" className={control} onClick={() => {const documentId=documentUrl?new URL(documentUrl,"http://tayco.local").searchParams.get("document"):null;if(documentId)record("viewer.close",{documentId});setDocumentUrl(null);}}>Close viewer</button></div><TakeoffProjectReader source={documentUrl} projectName={project.name} review={review} privacyNotice={false}/></section>}
    </section>}
  </PortalShell>;
}
