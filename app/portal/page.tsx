import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError, getActor } from "@/lib/auth";
import { snapshot } from "@/lib/erp";
import { COMPANY } from "@/lib/company";
import PortalClient, { type DashboardData } from "./PortalClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  let initial: DashboardData;
  try {
    if (!process.env.TAYCO_SESSION_SECRET || process.env.TAYCO_SESSION_SECRET.length < 32) throw new AuthError("Account access is being prepared. Please contact TAYCO for assistance.", 503);
    const request = new Request("http://tayco.local/portal", { headers: await headers() });
    const actor = await getActor(request);
    if (!actor) redirect("/login?next=/portal");
    const current = snapshot(actor);
    // SQLite rows have a null prototype; send ordinary records across the RSC boundary.
    initial = { ...current, audit: current.audit.map((entry) => ({ ...entry })), delivery: current.delivery.map((entry) => ({ ...entry })) } as DashboardData;
  } catch (error) {
    // Preserve Next navigation control flow instead of swallowing a redirect.
    if (!(error instanceof AuthError)) throw error;
    return (
      <main className="min-h-screen bg-[#070e1a] px-5 pb-20 pt-32 text-slate-100">
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-300/30 bg-[#0f2040] p-7">
          <p className="text-xs uppercase tracking-widest text-amber-200">TAYCO workspace</p>
          <h1 className="mt-3 text-3xl font-bold">Account access is temporarily unavailable.</h1>
          <p className="mt-4 leading-relaxed text-slate-300">Your project information is protected. Please contact your TAYCO coordinator while account access is being prepared.</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a className="rounded-lg bg-amber-300 px-4 py-3 font-bold text-[#0f2040]" href={COMPANY.emailHref}>Contact TAYCO</a>
            <Link className="rounded-lg border border-slate-500 px-4 py-3" href="/">Back to website</Link>
          </div>
        </div>
      </main>
    );
  }
  return <PortalClient initial={initial} />;
}
