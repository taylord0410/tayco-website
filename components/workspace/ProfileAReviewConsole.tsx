"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import GuestPrivacyNotice from "../GuestPrivacyNotice";
import TakeoffProjectReader from "./TakeoffProjectReader";
import { useReviewInteractions } from "@/lib/use-review-interactions";
import { profileDocumentAvailabilityLabel } from "@/lib/profile-a-document-availability";
import type { ProfileAReview } from "@/lib/profile-a-review";
import PortalShell from "./PortalShell";
import "./workspace.css";

const control = "min-h-11 rounded-lg border border-amber-200/30 px-4 py-3 text-left text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200";
const card = "rounded-2xl border border-amber-200/20 bg-[#10223c] p-5 sm:p-7";
const labelDate = (value: string) => new Date(value + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const sectionLabel = (value: "dated" | "undated" | "live") =>
  value === "live" ? "Reported as still open" : value === "undated" ? "Deadline not documented" : "Reported bid opportunity";
type Opportunity = ProfileAReview["rows"][number];
type SourceDocument = Opportunity["documents"][number];

/** Presentation only: accept a specific supplied link, never infer a document or grant. */
export function reviewDocumentHref(document: SourceDocument): string | null {
  if (document.state !== "received" || (document.recipientAccess !== undefined && document.recipientAccess !== "available") ||
      !document.viewerHref?.startsWith("/api/takeoff-viewer/viewer?")) return null;
  try {
    const url = new URL(document.viewerHref, "http://tayco.local");
    const id = /^[A-Za-z0-9_-]{1,200}$/;
    if (url.origin !== "http://tayco.local" || url.pathname !== "/api/takeoff-viewer/viewer" || url.hash ||
        !id.test(url.searchParams.get("project") ?? "") || !id.test(url.searchParams.get("document") ?? "") ||
        url.searchParams.getAll("project").length !== 1 || url.searchParams.getAll("document").length !== 1) return null;
    return document.viewerHref;
  } catch { return null; }
}

/** A changed availability snapshot, selection or access state withdraws the displayed source. */
export function selectedReviewDocumentUrl(project: Opportunity, url: string | null, openedAsOf: string | undefined, asOf: string | undefined) {
  return url && openedAsOf === asOf && project.documents.some(document => reviewDocumentHref(document) === url) ? url : null;
}


/** Choose only a supplied, available document; portfolio size never grants access. */
export function firstReviewDocumentHref(project: Opportunity): string | null {
  return project.documents.map(reviewDocumentHref).find((href): href is string => href !== null) ?? null;
}

export function ReviewOpportunityLauncher({ rows, onOpen }: {
  rows: Opportunity[]; onOpen: (id: string) => void;
}) {
  return <article className={card} aria-label="Opportunity drawing shortcuts">
    <h2 className="text-xl font-bold">Opportunity files</h2>
    <p className="mt-2 text-sm text-slate-300">Choose an opportunity to open its available drawing or review its reported source status.</p>
    <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map(row => <button key={row.id} type="button" className={control + " flex flex-col gap-2"} onClick={() => onOpen(row.id)}>
        <span className="font-semibold text-white">{row.name}</span>
        <span className="text-xs text-slate-300">{firstReviewDocumentHref(row) ? "View drawing →" : "Review source status →"}</span>
      </button>)}
    </div>
  </article>;
}

export function ReviewSourceDocuments({ project, visibleDocumentUrl, onOpen }: {
  project: Opportunity; visibleDocumentUrl: string | null; onOpen: (href: string) => void;
}) {
  return <article className={card}>
    <p className="text-xs uppercase tracking-widest text-amber-200">{sectionLabel(project.section)}</p>
    <h2 className="mt-3 text-2xl font-bold">{project.name}</h2>
    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
      <div><dt className="text-sm text-slate-400">Location reported</dt><dd className="mt-1">{project.location ?? "Not documented"}</dd></div>
      <div><dt className="text-sm text-slate-400">Contractor reported</dt><dd className="mt-1">{project.contractor ?? "Not documented"}</dd></div>
      <div><dt className="text-sm text-slate-400">Reported deadline</dt><dd className="mt-1">{project.reportedDeadline ? labelDate(project.reportedDeadline) : "Not documented"}</dd></div>
      <div><dt className="text-sm text-slate-400">Source classification</dt><dd className="mt-1">{sectionLabel(project.section)}</dd></div>
    </dl>
    <h3 className="mt-7 text-lg font-bold">Source documents ({project.documents.length} listed)</h3>
    <ul className="mt-4 space-y-3">{project.documents.map((document, index) => {
      const href = reviewDocumentHref(document);
      return <li key={index} className="min-w-0 rounded-xl border border-slate-600 p-4">
        <p className="break-words font-semibold">{document.name}</p>
        <p className="mt-2 text-sm text-slate-300">Source metadata: {document.state === "received" ? "Received" : "Pending"}</p>
        <p className="mt-2 text-sm text-slate-300">{profileDocumentAvailabilityLabel(document)}</p>
        {href && <button type="button" className={control + " mt-3"} onClick={() => onOpen(href)}>
          {visibleDocumentUrl === href ? "Viewing protected document" : "Open protected document"}
        </button>}
      </li>;
    })}</ul>
  </article>;
}

export default function ProfileAReviewConsole({ data, review }: {
  data: ProfileAReview; review?: { id: string; expiresAt: number; asOf: number };
}) {
  // The authorized DTO remains the sole source of counts, states, names and links.
  const record = useReviewInteractions(review?.id), [ready, setReady] = useState<string | null>(null), visit = useRef<string | null>(null);
  useEffect(() => { if (ready) { visit.current ||= crypto.randomUUID(); record("review.visit", {}, visit.current); } }, [ready, record]);
  const [section, setSection] = useState<"summary" | "timeline" | "projects">("summary");
  const [selected, setSelected] = useState(data.rows[0].id);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [openedAsOf, setOpenedAsOf] = useState<string | undefined>(undefined);
  const project = data.rows.find(row => row.id === selected) ?? data.rows[0];
  const visibleDocumentUrl = selectedReviewDocumentUrl(project, documentUrl, openedAsOf, data.recipientCoverage?.asOf);
  const dated = data.rows.filter(row => row.reportedDeadline).sort((a, b) => a.reportedDeadline!.localeCompare(b.reportedDeadline!));
  const open = (id: string) => {
    const row = data.rows.find(row => row.id === id);
    if (!row) return;
    record("opportunity.open", { opportunityId: id });
    setSelected(id); setSection("projects");
    const href = firstReviewDocumentHref(row);
    setOpenedAsOf(data.recipientCoverage?.asOf); setDocumentUrl(href);
    if (href) record("viewer.document.select", { documentId: new URL(href, "http://tayco.local").searchParams.get("document")! });
  };
  const openDocument = (href: string) => {
    if (!project.documents.some(document => reviewDocumentHref(document) === href)) return;
    const documentId = new URL(href, "http://tayco.local").searchParams.get("document");
    if (documentId) record("viewer.document.select", { documentId });
    setOpenedAsOf(data.recipientCoverage?.asOf);
    setDocumentUrl(href);
  };
  return <PortalShell className="min-h-screen bg-[#070e1a] text-slate-100" data-testid="profile-a-review"
    sidebar={<><Image src="/logo.jpeg" alt="TAYCO" width={196} height={62} priority className="h-14 w-auto max-w-full lg:h-auto lg:w-[196px]" />
      <p className="mt-4 text-xs uppercase tracking-[.2em] text-amber-200 lg:mt-7">Review workspace</p>
      <nav aria-label="Review sections" className="mt-3 grid grid-cols-3 gap-2 lg:mt-4 lg:grid-cols-1 lg:gap-3">{(["summary", "timeline", "projects"] as const).map(key =>
        <button key={key} type="button" className={control + (section === key ? " bg-amber-200/15" : "")} aria-current={section === key ? "page" : undefined}
          onClick={() => { record("review.section.select", { reviewSection: key }); setSection(key); if (key === "projects") open(project.id); else setDocumentUrl(null); }}>
          {key === "summary" ? "Executive summary" : key === "timeline" ? "Reported chronology" : "Opportunity files"}
        </button>)}</nav>
      <Link className={control + " mt-4 block lg:mt-7"} href={review ? "/account" : "/portal"} onClick={() => record("account.open")}>{review ? "Account and access" : "Return to administration"}</Link></>}
    header={<><div><p className="text-xs uppercase tracking-[.2em] text-amber-200">TAYCO · {data.period}</p><h1 className="mt-2 text-3xl font-bold">Opportunity review</h1><p className="mt-2 text-sm text-slate-300">{data.sourceLabel}</p></div>
      <span className="rounded-lg border border-amber-200/30 px-4 py-3 text-sm text-amber-100">{review ? "Recipient review · read only" : "Administrative preview · read only"}</span></>}>
    {review && <><GuestPrivacyNotice onReady={setReady} /><p className="my-3 text-sm text-amber-100">Access ends {new Date(review.expiresAt).toISOString()} UTC. Signing in or refreshing does not extend this review.</p></>}
    <p className="my-5 rounded-xl border border-slate-600 bg-[#0b1b31] p-4 text-sm leading-relaxed text-slate-300">This review organizes {data.opportunityCount} reported opportunities and {data.documentCount} listed source documents for {data.period}. Reported deadlines and business associations remain unconfirmed. Source receipt metadata and recipient access are separate. No invitation or recipient access is created by this preview.</p>
    {section === "summary" && <section aria-label="Executive summary" className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[
        ["Reported opportunities", data.opportunityCount], ["Dated source records", data.reportedDatedCount],
        ["Deadlines not documented", data.undatedCount], ["Source files reported received", data.receivedDocumentCount],
      ].map(([label, value]) => <article key={label} className={card}><p className="text-sm text-slate-300">{label}</p><strong className="mt-3 block text-4xl text-white">{value}</strong></article>)}</div>
      <article className={card}><h2 className="text-xl font-bold">Source coverage</h2>
        {data.recipientCoverage ? <p className="mt-3 leading-relaxed text-slate-300" data-testid="recipient-document-coverage">
          {data.receivedDocumentCount} files are reported received. {data.recipientCoverage.availableDocumentCount} are available for this review; {data.recipientCoverage.notSelectedDocumentCount} are not selected; {data.recipientCoverage.unavailableDocumentCount} have access currently unavailable. {data.recipientCoverage.pendingSourceDocumentCount} listed files remain pending in source metadata. Selection and access do not change source receipt status. Availability checked {data.recipientCoverage.asOf}.
        </p> : <p className="mt-3 leading-relaxed text-slate-300">
          {data.linkedDocumentCount} received files have links in this administrative preview. {data.receivedDocumentCount} of {data.documentCount} listed files are reported received; {data.documentCount - data.receivedDocumentCount} remain pending in source metadata. This metadata does not establish physical absence or recipient authorization.
        </p>}
        <p className="mt-3 leading-relaxed text-slate-300">{data.liveCount} opportunities are reported as still open. These records do not establish awarded work, completed projects or financial results.</p>
        <button className={control + " mt-5"} type="button" onClick={() => { record("review.section.select", { reviewSection: "projects" }); open(project.id); }}>Review opportunity files</button>
      </article>
      <ReviewOpportunityLauncher rows={data.rows} onOpen={open} />
    </section>}
    {section === "timeline" && <section className={card} aria-label="Reported chronology"><h2 className="text-xl font-bold">Reported chronology</h2>
      <p className="mt-2 text-sm text-slate-300">Source-reported dates are unconfirmed; no award or company-information state is inferred.</p>
      <h3 className="mt-5 text-sm font-bold uppercase tracking-wider text-amber-200">Reported deadlines ({dated.length} opportunities)</h3>
      <ol className="mt-3 space-y-3">{dated.map(row => <li key={row.id}><button type="button" className={control + " flex w-full flex-wrap items-center justify-between gap-3"} onClick={() => open(row.id)}>
        <span>{row.name} <span className="text-xs text-slate-400">({row.location ?? "Location not documented"})</span></span><span>{labelDate(row.reportedDeadline!)}</span>
      </button></li>)}</ol>
      <h3 className="mt-7 text-sm font-bold uppercase tracking-wider text-amber-200">Without a documented deadline ({data.rows.filter(row => !row.reportedDeadline).length} opportunities)</h3>
      <ul className="mt-3 space-y-2">{data.rows.filter(row => !row.reportedDeadline).map(row => <li key={row.id}><button type="button" className={control + " flex w-full flex-wrap items-center justify-between gap-3"} onClick={() => open(row.id)}>
        <span>{row.name} <span className="text-xs text-slate-400">({row.location ?? "Location not documented"})</span></span><span>{sectionLabel(row.section)}</span>
      </button></li>)}</ul>
    </section>}
    {section === "projects" && <section aria-label="Opportunity files" className="space-y-5">
      <div className={card}><label htmlFor="review-opportunity" className="block text-sm font-semibold text-amber-100">Opportunity ({data.rows.length} reported records)</label>
        <select id="review-opportunity" className="mt-3 min-h-12 w-full min-w-0 rounded-lg border border-slate-500 bg-[#10223c] p-3 text-white" value={selected} onChange={event => open(event.target.value)}>
          {data.rows.map(row => <option key={row.id} value={row.id}>{row.name} — {row.reportedDeadline ?? sectionLabel(row.section)}</option>)}
        </select>
      </div>
      <ReviewSourceDocuments project={project} visibleDocumentUrl={visibleDocumentUrl} onOpen={openDocument} />
      {visibleDocumentUrl && <section className={card}><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">Protected drawing viewer</h3>
        <button type="button" className={control} onClick={() => { const documentId = new URL(visibleDocumentUrl, "http://tayco.local").searchParams.get("document"); if (documentId) record("viewer.close", { documentId }); setDocumentUrl(null); }}>Close viewer</button>
      </div><TakeoffProjectReader source={visibleDocumentUrl} projectName={project.name} review={review} privacyNotice={false} /></section>}
    </section>}
  </PortalShell>;
}
