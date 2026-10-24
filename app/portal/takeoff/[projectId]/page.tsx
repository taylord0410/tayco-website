import { withGuestRenderAudit,noteReviewAuditFailure } from "@/lib/review-request-audit";
import {reviewDisplayDeadline} from "@/lib/review-grants";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { AuthError, getActor } from "@/lib/auth";
import { snapshot } from "@/lib/erp";
import { TakeoffViewerAccessError, VIEWER_PREFIX, viewerScope, guestProjectReviews } from "@/lib/takeoff-viewer-access";
import TakeoffProjectReader from "@/components/workspace/TakeoffProjectReader";
import ReviewDeadlineBoundary from "@/components/workspace/ReviewDeadlineBoundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function ProjectViewerPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  let actor; let authenticationError="";
  try{actor=await getActor(new Request("http://tayco.local/portal/takeoff",{headers:await headers()}));}
  catch(error){if(error instanceof AuthError){noteReviewAuditFailure(error,error.status);authenticationError=error.message;}else throw error;}
  if(authenticationError)return <main className="min-h-screen bg-[#070e1a] p-7 text-slate-100"><h1 className="text-3xl font-bold">Review access unavailable</h1><p role="alert" className="mt-4">{authenticationError}</p><Link className="mt-6 inline-block underline" href="/account">Account and access</Link></main>;
  if (!actor) redirect("/login");
  let name = "", source = "", unavailable = false, denied = false;
  try {
    if (actor.role === "guest") {
      const project = guestProjectReviews(actor).find(entry => entry.projectId === projectId);
      if (!project) throw new TakeoffViewerAccessError(403, "Not authorized.");
      name = project.name;
    } else {
      const project = snapshot(actor).entries.find(entry => entry.kind === "project" && entry.id === projectId);
      if (!project) notFound();
      name = typeof project.data.name === "string" ? project.data.name : "Project plans";
    }
    const scope = viewerScope(actor, projectId);
    if (!process.env.TAYCO_TAKEOFF_VIEWER_INTERNAL_URL) {noteReviewAuditFailure(undefined,503);unavailable = true;}
    else {
      const context = scope.contexts[0];
      if (!context?.documentIds.length) {noteReviewAuditFailure(undefined,404);notFound();}
      source = VIEWER_PREFIX + "/viewer/?" + new URLSearchParams({ embed: "1", project: context.key, document: context.documentIds[0], page: "1" });
    }
  } catch (error) {
    source="";
    if(error instanceof TakeoffViewerAccessError||error instanceof AuthError)noteReviewAuditFailure(error,error.status);
    if (error instanceof TakeoffViewerAccessError) {
      if (error.status === 403 && actor.role === "guest") { denied = true; name = "Not authorized"; }
      else if (error.status === 503) unavailable = true;
      else notFound();
    } else if (error instanceof AuthError) notFound();
    else throw error;
  }
  const review=reviewDisplayDeadline(actor);
  return <ReviewDeadlineBoundary review={review}><main className="min-h-svh bg-[#070e1a] px-3 py-5 text-slate-100 sm:px-7 sm:py-8" data-testid="takeoff-project-page">
    <div className="mx-auto max-w-[1700px] space-y-5">
      <header className="flex min-w-0 flex-wrap items-start justify-between gap-4 rounded-2xl border border-amber-200/20 bg-gradient-to-br from-[#173252] to-[#0b192e] p-5 sm:p-7">
        <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[.18em] text-[#F3D37A]">TAYCO / Project plans</p><h1 className="mt-3 break-words text-2xl font-black sm:text-4xl">{name}</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Read approved plans and their available processed information. Access follows your current project and document permissions.</p></div>
        <Link className="inline-flex min-h-11 shrink-0 items-center rounded-xl border border-amber-200/30 px-4 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200" href="/portal">Back to workspace</Link>
      </header>
      {denied ? <section role="alert" className="rounded-2xl border border-amber-200/20 bg-[#10223d] p-6 sm:p-8"><h2 className="text-xl font-bold text-white">Not authorized</h2><p className="mt-3 max-w-2xl leading-relaxed text-slate-300">Your review access includes approved project details for the current month. Earlier months are available as general summaries only.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-amber-200 px-4 py-3 text-sm font-bold text-[#0f2040]" href="/portal">Return to current month</Link></section> : unavailable ? <section role="status" className="rounded-2xl border border-amber-200/20 bg-[#10223d] p-6 sm:p-8"><h2 className="text-xl font-bold text-white">The project reader is being prepared.</h2><p className="mt-3 max-w-2xl leading-relaxed text-slate-300">TAYCO must connect the private reader and approve the project sources before plans appear here. Your existing documents remain available in the workspace.</p><Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-amber-200 px-4 py-3 text-sm font-bold text-[#0f2040]" href="/portal">Return to project workspace</Link></section> : <TakeoffProjectReader source={source} projectName={name} review={review}/>}
    </div>
  </main></ReviewDeadlineBoundary>;
}
export default function AuditedProjectViewerPage(props:Parameters<typeof ProjectViewerPage>[0]){
  return withGuestRenderAudit("viewer",()=>ProjectViewerPage(props));
}
