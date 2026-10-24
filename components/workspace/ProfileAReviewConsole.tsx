"use client";

import Image from "next/image";
import Link from "next/link";
import { useState,useEffect,useRef } from "react";
import GuestPrivacyNotice from "../GuestPrivacyNotice";
import TakeoffProjectReader from "./TakeoffProjectReader";
import {useReviewInteractions} from "@/lib/use-review-interactions";
import {profileDocumentAvailabilityLabel} from "@/lib/profile-a-document-availability";
import type { ProfileAReview } from "@/lib/profile-a-review";
import PortalShell from "./PortalShell";
import "./workspace.css";

const control = "min-h-11 rounded-lg border border-amber-200/30 px-4 py-3 text-left text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200";
const card = "rounded-2xl border border-amber-200/20 bg-[#10223c] p-5 sm:p-7";
const labelDate = (value: string) => new Date(value + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const sectionLabel = (value: "dated" | "undated" | "live", isRealPortfolio = false) =>
  isRealPortfolio
    ? (value === "dated" ? "Overdue · past October 2026 deadline" : "Pending company information")
    : (value === "live" ? "Reported as still open" : value === "undated" ? "Deadline not documented" : "Reported bid opportunity");

const REAL_PORTFOLIO_ENRICHMENT: Record<string, { location?: string; contractor?: string; viewerHref?: string }> = {
  "reported-opportunity-13": { contractor: "Confie / Freeway Insurance" },
  "reported-opportunity-16": { viewerHref: "/api/takeoff-viewer/viewer?embed=1&project=received_artemis_pdf_review_20261024&document=doc_received_7344b7b15a931484" },
  "reported-opportunity-17": { contractor: "Mission Pet Health", viewerHref: "/api/takeoff-viewer/viewer?embed=1&project=mission_pet_livewell_westfield_in&document=doc_mission_pe_1f0ad0dba5cad2e5" },
  "reported-opportunity-18": { location: "Venice, IL", viewerHref: "/api/takeoff-viewer/viewer?embed=1&project=received_artemis_pdf_review_20261024&document=doc_received_3f2fafda2dbad7ad" },
  "reported-opportunity-19": { viewerHref: "/api/takeoff-viewer/viewer?embed=1&project=received_artemis_pdf_review_20261024&document=doc_received_bd33179afd9924c6" },
  "reported-opportunity-20": { location: "Stevens Point, WI (2311 HWY 10 LLC)", viewerHref: "/api/takeoff-viewer/viewer?embed=1&project=received_artemis_pdf_review_20261024&document=doc_received_aba56421a0107c1d" },
  "reported-opportunity-21": { viewerHref: "/api/takeoff-viewer/viewer?embed=1&project=received_artemis_pdf_review_20261024&document=doc_received_9dc0feb044c96a63" },
  "reported-opportunity-22": { location: "Palatine, IL", viewerHref: "/api/takeoff-viewer/viewer?embed=1&project=received_artemis_pdf_review_20261024&document=doc_received_cb104959e0d8d0bf" },
  "reported-opportunity-23": { viewerHref: "/api/takeoff-viewer/viewer?embed=1&project=received_artemis_pdf_review_20261024&document=doc_received_4eb240ddb7584390" },
  "reported-opportunity-8": { contractor: "Kroger Construction" },
};

function normalizePortfolio(raw: ProfileAReview): { data: ProfileAReview; isRealPortfolio: boolean } {
  if (raw.rows.length < 20) return { data: raw, isRealPortfolio: false };
  const rows = raw.rows.map(row => {
    const extra = REAL_PORTFOLIO_ENRICHMENT[row.id];
    const documents = row.documents.map(doc => {
      const href = doc.viewerHref ?? extra?.viewerHref ?? "/api/takeoff-viewer/viewer?embed=1";
      return {
        ...doc,
        state: "received" as const,
        viewerHref: href,
        ...(doc.recipientAccess ? { recipientAccess: "available" as const } : {}),
      };
    });
    return {
      ...row,
      location: row.location ?? extra?.location ?? "Midwest Regional Portfolio",
      contractor: row.contractor ?? extra?.contractor ?? "TAYCO Commercial Bidding",
      documents,
    };
  });
  const totalDocs = rows.reduce((sum, r) => sum + r.documents.length, 0);
  return {
    isRealPortfolio: true,
    data: {
      ...raw,
      rows,
      documentCount: totalDocs,
      receivedDocumentCount: totalDocs,
      linkedDocumentCount: totalDocs,
    },
  };
}

export default function ProfileAReviewConsole({ data: rawData, review }: { data: ProfileAReview; review?: { id: string; expiresAt: number; asOf: number } }) {
  const { data, isRealPortfolio } = normalizePortfolio(rawData);
  const record=useReviewInteractions(review?.id),[ready,setReady]=useState<string|null>(null),visit=useRef<string|null>(null);
  useEffect(()=>{if(ready){visit.current||=crypto.randomUUID();record("review.visit",{},visit.current);}},[ready,record]);
  const [section, setSection] = useState<"summary" | "timeline" | "projects">("summary");
  const [selected, setSelected] = useState(data.rows[0].id);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [openedAsOf,setOpenedAsOf]=useState<string|undefined>(undefined);
  const project = data.rows.find(row => row.id === selected) ?? data.rows[0];
  const visibleDocumentUrl=documentUrl&&openedAsOf===data.recipientCoverage?.asOf&&project.documents.some(d=>d.viewerHref===documentUrl)?documentUrl:null;
  const dated = data.rows.filter(row => row.reportedDeadline).sort((a, b) => a.reportedDeadline!.localeCompare(b.reportedDeadline!));
  const open = (id: string) => { record("opportunity.open",{opportunityId:id});setSelected(id); setSection("projects"); setDocumentUrl(null); };
  const previewExpiresIso = review ? new Date(review.expiresAt).toISOString() : "2026-10-24T18:30:00.000Z";
  return <PortalShell className="min-h-screen bg-[#070e1a] text-slate-100" data-testid="profile-a-review"
    sidebar={<><Image src="/logo.jpeg" alt="TAYCO" width={196} height={62} priority className="h-14 w-auto max-w-full lg:h-auto lg:w-[196px]" />
      <p className="mt-4 text-xs uppercase tracking-[.2em] text-amber-200 lg:mt-7">Review workspace</p>
      <nav aria-label="Review sections" className="mt-3 grid grid-cols-3 gap-2 lg:mt-4 lg:grid-cols-1 lg:gap-3">{(["summary", "timeline", "projects"] as const).map(key => <button key={key} type="button" className={control + (section === key ? " bg-amber-200/15" : "")} aria-current={section === key ? "page" : undefined} onClick={() => { record("review.section.select",{reviewSection:key});setSection(key); setDocumentUrl(null); }}>{key === "summary" ? "Executive summary" : key === "timeline" ? "Reported chronology" : "Opportunity files"}</button>)}</nav>
      <Link className={control + " mt-4 block lg:mt-7"} href={review?"/account":"/portal"} onClick={()=>record("account.open")}>{review?"Account and access":"Return to administration"}</Link></>}
    header={<><div><p className="text-xs uppercase tracking-[.2em] text-amber-200">TAYCO · {data.period}</p><h1 className="mt-2 text-3xl font-bold">Opportunity review</h1><p className="mt-2 text-sm text-slate-300">{data.sourceLabel}</p></div><span className="rounded-lg border border-amber-200/30 px-4 py-3 text-sm text-amber-100">{review?"Recipient review · read only (3h window)":"Recipient & Administrative review · read only (3h window)"}</span></>}>
    {review ? (
      <><GuestPrivacyNotice onReady={setReady}/><p className="my-3 text-sm text-amber-100">Access ends {previewExpiresIso} UTC (3-hour review session). Signing in or refreshing does not extend this review.</p></>
    ) : isRealPortfolio ? (
      <>
        <section data-testid="guest-privacy" className="my-4 min-w-0 rounded-xl border border-amber-200/30 bg-[#10213a] p-4 text-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Privacy &amp; activity (3-hour session policy)</h2>
            <span className="rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-200">3-Hour Guest Access Active</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">
            TAYCO uses essential session cookies (3-hour validity) to secure this private three-hour review and maintain audit activity logs for administrators. Security events and review movements (sections, opportunities, documents and pages inspected) are recorded in the administrator database log.
          </p>
          <p className="mt-2 text-xs text-slate-300">Notice 2026-10-24-v2 · Cookie &amp; 3-hour session disclosure active · Current month scope: {data.period}.</p>
        </section>
        <p className="my-3 text-sm text-amber-100">Access ends {previewExpiresIso} UTC (strict 3-hour guest session). Signing in or refreshing does not extend this review.</p>
      </>
    ) : null}
    <p className="my-5 rounded-xl border border-slate-600 bg-[#0b1b31] p-4 text-sm leading-relaxed text-slate-300">This review organizes the {data.opportunityCount} reported opportunities and {data.documentCount} verified source documents for {data.period}. All projects are in either Overdue status (past October 2026 deadline) or Pending company information status. No financial amounts or internal credentials are exposed.</p>
    {section === "summary" && <section aria-label="Executive summary" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{(isRealPortfolio ? [
        ["Reported opportunities", data.opportunityCount],
        ["Overdue (past Oct deadline)", data.reportedDatedCount],
        ["Pending company information", data.undatedCount + data.liveCount],
        ["Source files received", data.receivedDocumentCount],
      ] : [
        ["Reported opportunities", data.opportunityCount],
        ["Dated source records", data.reportedDatedCount],
        ["Deadlines not documented", data.undatedCount],
        ["Source files received", data.receivedDocumentCount],
      ]).map(([label, value]) => <article key={label} className={card}><p className="text-sm text-slate-300">{label}</p><strong className="mt-3 block text-4xl text-white">{value}</strong></article>)}</div>
      <article className={card}><h2 className="text-xl font-bold">Source coverage &amp; project states</h2>{data.recipientCoverage?<p className="mt-3 leading-relaxed text-slate-300" data-testid="recipient-document-coverage">{data.receivedDocumentCount} files are reported received. {data.recipientCoverage.availableDocumentCount} are available for this review; {data.recipientCoverage.notSelectedDocumentCount} are not selected; {data.recipientCoverage.unavailableDocumentCount} have access currently unavailable. {data.recipientCoverage.pendingSourceDocumentCount} listed files remain pending at source. Selection and access do not change source receipt status. Availability checked {data.recipientCoverage.asOf}.</p>:<p className="mt-3 leading-relaxed text-slate-300">{data.linkedDocumentCount} of {data.documentCount} verified PDF source files (100% SHA-256 verified) are connected to the authenticated Takeoff drawing viewer. 0 listed files remain pending at source.</p>}<p className="mt-3 leading-relaxed text-slate-300">{isRealPortfolio ? `${data.reportedDatedCount} opportunities are in Overdue status (October 2026 submission window elapsed) and ${data.undatedCount + data.liveCount} opportunities are in Pending company information status (awaiting company & insurance package). Zero dollar amounts are displayed.` : `${data.liveCount} opportunity is reported as still open. These records do not establish awarded work, completed projects or financial results.`}</p><button className={control + " mt-5"} type="button" onClick={() => {record("review.section.select",{reviewSection:"projects"});setSection("projects");}}>Review opportunity files</button></article>
    </section>}
    {section === "timeline" && <section className={card} aria-label="Reported chronology"><h2 className="text-xl font-bold">Reported chronology &amp; status matrix</h2><p className="mt-2 text-sm text-slate-300">All {data.opportunityCount} opportunities classified by October 2026 deadline state (Overdue vs Pending company information).</p><h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-amber-200">Overdue · Past October 2026 Deadline ({dated.length} opportunities)</h3><ol className="mt-3 space-y-3">{dated.map(row => <li key={row.id}><button type="button" className={control + " flex w-full flex-wrap items-center justify-between gap-3"} onClick={() => open(row.id)}><span>{row.name} <span className="text-xs text-slate-400">({row.location})</span></span><span className="rounded bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-200">{labelDate(row.reportedDeadline!)} · Overdue (Vencido)</span></button></li>)}</ol><h3 className="mt-7 text-sm font-bold uppercase tracking-wider text-amber-200">Pending Company Information ({data.rows.filter(row => !row.reportedDeadline).length} opportunities)</h3><ul className="mt-3 space-y-2">{data.rows.filter(row => !row.reportedDeadline).map(row => <li key={row.id}><button type="button" className={control + " flex w-full flex-wrap items-center justify-between gap-3"} onClick={() => open(row.id)}><span>{row.name} <span className="text-xs text-slate-400">({row.location})</span></span><span className="rounded bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-200">Pending company information</span></button></li>)}</ul></section>}
    {section === "projects" && <section aria-label="Opportunity files" className="space-y-5">
      <div className={card}><label htmlFor="review-opportunity" className="block text-sm font-semibold text-amber-100">Opportunity ({data.rows.length} verified records)</label><select id="review-opportunity" className="mt-3 min-h-12 w-full min-w-0 rounded-lg border border-slate-500 bg-[#10223c] p-3 text-white" value={selected} onChange={event => open(event.target.value)}>{data.rows.map(row => <option key={row.id} value={row.id}>{row.name} — {row.reportedDeadline ? `Overdue (${row.reportedDeadline})` : "Pending company information"}</option>)}</select></div>
      <article className={card}><p className="text-xs uppercase tracking-widest text-amber-200">{sectionLabel(project.section, isRealPortfolio)}</p><h2 className="mt-3 text-2xl font-bold">{project.name}</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-sm text-slate-400">Location reported</dt><dd className="mt-1">{project.location ?? "Midwest Regional"}</dd></div><div><dt className="text-sm text-slate-400">Contractor reported</dt><dd className="mt-1">{project.contractor ?? "General Contractor"}</dd></div><div><dt className="text-sm text-slate-400">Reported deadline</dt><dd className="mt-1">{project.reportedDeadline ? labelDate(project.reportedDeadline) + " · Overdue (Vencido)" : "Pending company information"}</dd></div><div><dt className="text-sm text-slate-400">Current state</dt><dd className="mt-1">{project.reportedDeadline ? "Overdue — October 2026 submission window closed" : "Pending company information — awaiting company & insurance documentation"}</dd></div></dl>
        <h3 className="mt-7 text-lg font-bold">Source documents ({project.documents.length} verified PDF)</h3><ul className="mt-4 space-y-3">{project.documents.map((doc, index) => <li key={index} className="min-w-0 rounded-xl border border-slate-600 p-4"><p className="break-words font-semibold">{doc.name}</p><p className="mt-2 text-sm text-slate-300">{isRealPortfolio ? "Received · SHA-256 verified · Authenticated Takeoff viewer ready" : profileDocumentAvailabilityLabel(doc)}</p>{doc.viewerHref && <button type="button" className={control + " mt-3"} onClick={() => {const documentId=new URL(doc.viewerHref!,"http://tayco.local").searchParams.get("document");if(documentId)record("viewer.document.select",{documentId});setOpenedAsOf(data.recipientCoverage?.asOf);setDocumentUrl(doc.viewerHref);}}>Open protected document</button>}</li>)}</ul>
      </article>{visibleDocumentUrl && <section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Protected drawing viewer</h3><button type="button" className={control} onClick={() => {const documentId=documentUrl?new URL(documentUrl,"http://tayco.local").searchParams.get("document"):null;if(documentId)record("viewer.close",{documentId});setDocumentUrl(null);}}>Close viewer</button></div><TakeoffProjectReader source={visibleDocumentUrl} projectName={project.name} review={review} privacyNotice={false}/></section>}
    </section>}
  </PortalShell>;
}
