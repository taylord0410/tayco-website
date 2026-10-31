import {insurerReviewData} from "@/lib/insurer-review";
import {reviewDisplayDeadline} from "@/lib/review-grants";
import ProfileAReviewConsole from "@/components/workspace/ProfileAReviewConsole";
import ReviewDeadlineBoundary from "@/components/workspace/ReviewDeadlineBoundary";
import { withGuestRenderAudit,noteReviewAuditFailure,noteReviewAuditResource } from "@/lib/review-request-audit";
import { recordGuestServerEvent } from "@/lib/guest-security-log";
import { auditGuestFailure } from "@/lib/review-access-audit";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError, getActor } from "@/lib/auth";
import { snapshot, ErpError } from "@/lib/erp";
import { COMPANY } from "@/lib/company";
import PortalClient, { type DashboardData } from "./PortalClient";
import GuestConsole, { type GuestConsoleSection } from "@/components/workspace/GuestConsole";
import { guestConsoleSnapshot, type GuestConsoleData } from "@/lib/guest-workspace";
import { currentReportingPeriod, isGuestReportingPeriod } from "@/lib/guest-period";
import { isGuestSection } from "@/lib/guest-sections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Workspace | TAYCO", robots: { index: false, follow: false } };
type Search = Record<string, string | string[] | undefined>;

async function PortalPage({ searchParams }: { searchParams?: Promise<Search> } = {}) {
  let recipientInitial:{data:ReturnType<typeof insurerReviewData>;review:ReturnType<typeof reviewDisplayDeadline>}|undefined;
  let initial: DashboardData | undefined;
  let guestInitial: GuestConsoleData | undefined;
  let guestSection: GuestConsoleSection = "summary";
  let accessError = "";
  try {
    if (!process.env.TAYCO_SESSION_SECRET || process.env.TAYCO_SESSION_SECRET.length < 32)
      throw new AuthError("Account access is being prepared. Please contact TAYCO for assistance.", 503);
    const reqHeaders = await headers();
    const actor = await getActor(new Request("http://tayco.local/portal", { headers: reqHeaders }));
    if (!actor) redirect("/login?next=/portal");
    if(actor.review?.recipient){recipientInitial={data:insurerReviewData(actor),review:reviewDisplayDeadline(actor)};}
    else if (actor.role === "guest") {
      const query = await searchParams ?? {};
      if (Object.keys(query).some(key => !["period", "section"].includes(key)) ||
          Array.isArray(query.period) || Array.isArray(query.section) ||
          (query.section !== undefined && !isGuestSection(query.section)))
        throw new ErpError(422, "Choose a valid review period and section.");
      guestSection = query.section as GuestConsoleSection || "summary";
      try {
        guestInitial = guestConsoleSnapshot(actor, { period: query.period, section: guestSection });
      } catch (error) {
        // Preserve the console and its denial panel on historical detail deep links.
        if (error instanceof ErpError && error.status === 403 && isGuestReportingPeriod(query.period) && query.period < currentReportingPeriod()) {
          const logged=auditGuestFailure(actor,"portal",error,403);if(logged!==error)throw logged;
          guestInitial = guestConsoleSnapshot(actor, { period: query.period, section: "summary" });
        }
        else throw error;
      }
      if (guestInitial) {
        noteReviewAuditResource("module", `portal_${guestSection}_${guestInitial.period}`);
        recordGuestServerEvent(actor, reqHeaders, {
          eventType: "portal.open",
          surface: "portal",
          targetId: `section:${guestSection}:${guestInitial.period}`,
          detail: `${guestSection} (${guestInitial.period})`,
          statusCode: 200,
        });
      }
    } else {
      const current = snapshot(actor);
      initial = { ...current, audit: current.audit.map(entry => ({ ...entry })), delivery: current.delivery.map(entry => ({ ...entry })) } as DashboardData;
    }
  } catch (error) {
    recipientInitial=undefined;initial=undefined;guestInitial=undefined;
    if(error instanceof ErpError||error instanceof AuthError)noteReviewAuditFailure(error,error.status);
    if (error instanceof ErpError && [403, 422].includes(error.status)) accessError = error.message;
    else if (!(error instanceof AuthError)) throw error;
    else accessError = error.reasonCode?.startsWith("review_") ? error.message : error.status === 403 ? "Not authorized." : "Account access is temporarily unavailable.";
  }
  if(recipientInitial)return <ReviewDeadlineBoundary review={recipientInitial.review}><ProfileAReviewConsole data={recipientInitial.data} review={recipientInitial.review}/></ReviewDeadlineBoundary>;
  if (guestInitial) return <GuestConsole initial={guestInitial} initialSection={guestSection} />;
  if (initial) return <PortalClient initial={initial} />;
  return <main className="min-h-screen bg-[#070e1a] px-5 py-16 text-slate-100">
    <div className="mx-auto max-w-xl rounded-2xl border border-amber-300/30 bg-[#0f2040] p-7">
      <p className="text-xs uppercase tracking-widest text-amber-200">TAYCO workspace</p>
      <h1 className="mt-3 text-3xl font-bold">{accessError.startsWith("Not authorized") ? "Not authorized" : "Workspace access"}</h1>
      <p role="alert" className="mt-4 leading-relaxed text-slate-300">{accessError || "Workspace information is unavailable."}</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-[#0f2040]" href="/portal">Open current month</Link>
        <a className="rounded-lg border border-slate-500 px-4 py-3" href={COMPANY.emailHref}>Contact TAYCO</a>
      </div>
    </div>
  </main>;
}
export default function AuditedPortalPage(props: { searchParams?: Promise<Search> }) {
  return withGuestRenderAudit("portal", () => PortalPage(props));
}
