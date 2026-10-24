import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getActor } from "@/lib/auth";
import { profileAReviewSource } from "@/lib/profile-a-review-source";
import { ProfileAReviewError } from "@/lib/profile-a-review";
import ProfileAReviewConsole from "@/components/workspace/ProfileAReviewConsole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Opportunity review | TAYCO", robots: { index: false, follow: false } };
export default async function AdministrativeReviewPage() {
  const actor = await getActor(new Request("http://tayco.local/portal/review", { headers: await headers() }));
  if (!actor) redirect("/login?next=/portal/review");
  if (actor.role !== "admin") notFound();
  let data: ReturnType<typeof profileAReviewSource> | undefined;
  try { data = profileAReviewSource(actor); }
  catch (error) { if (!(error instanceof ProfileAReviewError)) throw error; }
  if (!data) return <main className="min-h-screen bg-[#070e1a] p-8 text-slate-100"><h1 className="text-2xl font-bold">Review source unavailable</h1><p role="alert" className="mt-4">The source package is not configured or needs administrator review.</p><a href="/portal" className="mt-5 inline-block underline">Return to administration</a></main>;
  return <ProfileAReviewConsole data={data} />;
}
