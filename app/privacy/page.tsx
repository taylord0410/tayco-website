import Link from "next/link";
import { GUEST_PRIVACY_VERSION } from "@/lib/guest-privacy-contract";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F4F1E9] px-5 pb-24 pt-28 text-[#0F2040]">
      <article className="mx-auto max-w-3xl space-y-7">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#8A6D23]">
          TAYCO · Your information
        </p>
        <h1 className="text-4xl font-bold">Privacy and project information</h1>
        <p>
          We collect the contact and project details you choose to submit so
          TAYCO can review your request, communicate with you and coordinate the
          requested services. A website estimate is preliminary and requires a
          review of the actual scope.
        </p>

        <h2 className="text-2xl font-semibold">Your project space</h2>
        <p>
          Account access is provided by invitation. Clients and providers can
          access the projects and records assigned to them. Keep your sign-in
          details and invitation links private. Contact TAYCO if access is no
          longer needed or appears incorrect.
        </p>

        <section
          id="project-photography-privacy"
          className="space-y-3 rounded-2xl border border-[#C9A84C]/45 bg-white/80 p-6 shadow-sm"
        >
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#8A6D23]">
            Client confidentiality &amp; visual media
          </p>
          <h2 className="text-2xl font-semibold">
            Client privacy and project photography
          </h2>
          <p>
            To protect the privacy, security and confidentiality of our
            homeowners, commercial tenants, institutional facilities and private
            property owners, the photographs and architectural visuals presented
            across this website are curated architectural recreations based on
            real projects, field conditions and scopes of work performed by our
            teams.
          </p>
          <p className="text-sm text-[#0F2040]/80">
            We do not publish identifiable private residences, proprietary
            commercial interiors, street addresses or confidential client floor
            plans on public pages without explicit written authorization.
          </p>
        </section>

        <h2 className="text-2xl font-semibold">Documents</h2>
        <p>
          Do not include tax identification numbers, payment card details or
          other sensitive information in public contact forms. Submit requested
          tax and insurance documents through your authorized account. Receipt
          of a document does not mean it has been reviewed or approved.
        </p>

        <section id="guest-review-privacy" className="space-y-4">
          <h2 className="text-2xl font-semibold">
            Private guest reviews: cookies and activity
          </h2>
          <p>
            Notice {GUEST_PRIVACY_VERSION}. An essential, protected session
            cookie secures review access. Security events are recorded
            independently of optional analytics. Guest reviews end four hours
            after generation; accepting analytics never extends access.
          </p>
          <p>
            Optional interaction analytics record selected review controls only
            after you accept. They do not collect passwords, typed text,
            document contents, screen recordings or continuous mouse and touch
            movement. Accept, reject or withdraw through Privacy &amp; activity
            in your review or guest account. Choices apply only to the current
            review and notice version; a new version or review requires a new
            choice.
          </p>
          <p>
            Withdrawing stops future optional collection. Previously recorded
            events remain within the retention policy: 90 days by default,
            configurable up to 365 days, with a 10,000-event company limit.
            Preference history is retained up to 90 days with a 10,000-entry
            company limit. Only authorized administrators can view activity
            reports.
          </p>
          <p>
            No optional activity queue is stored in browser storage. Withdrawing
            locally turns optional collection off on that page and signals other
            open review tabs. If saving fails, retry when connected to persist
            the choice. Review access and sign out continue independently. This
            notice stays accessible after a review ends and contains no customer
            records.
          </p>
        </section>

        <h2 className="text-2xl font-semibold">Questions and requests</h2>
        <p>
          For questions about your information, corrections, access or deletion
          requests, contact{" "}
          <a className="underline" href="mailto:general@taycoturnkey.com">
            general@taycoturnkey.com
          </a>
          . TAYCO will review requests in the context of the project and
          applicable recordkeeping obligations.
        </p>
        <Link
          className="inline-block rounded-xl bg-[#0F2040] px-6 py-3 font-semibold text-white"
          href="/"
        >
          Return to TAYCO
        </Link>
      </article>
    </main>
  );
}
