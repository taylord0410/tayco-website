"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/company";
import { GUEST_PRIVACY_VERSION } from "@/lib/guest-privacy-contract";
import {
  PUBLIC_COOKIE_EVENT,
  readPublicCookieConsent,
  savePublicCookieConsent,
  type PublicCookiePreferences,
} from "@/components/PublicCookieBanner";

const COOKIE_INVENTORY = [
  {
    name: "tayco_session",
    category: "Strictly Necessary · Security",
    duration: "Up to 12 hours (4 hours for guest reviews)",
    purpose:
      "HttpOnly, encrypted session credential securing authenticated client, vendor, insurer, and administrator access.",
  },
  {
    name: "tayco_cookie_consent",
    category: "Strictly Necessary · Governance",
    duration: "180 days",
    purpose:
      "Stores your public cookie and privacy consent selection (all, custom, or essential-only) across visits.",
  },
  {
    name: "Visual Stream & Site Shield",
    category: "Strictly Necessary · Asset Protection",
    duration: "Per-request / ephemeral memory",
    purpose:
      "Protects architectural visuals via encrypted canvas streaming and defends public forms against automated scrapers and hostile bots.",
  },
  {
    name: "Optional Interaction Telemetry",
    category: "Optional · Analytics & Review UX",
    duration: "90 days default (opt-in only)",
    purpose:
      "Records selected navigation and review control interactions only after explicit consent. Never captures passwords, keystrokes, or document contents.",
  },
];

export default function PrivacyPage() {
  const [consent, setConsent] = useState<PublicCookiePreferences | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    const sync = () => {
      setConsent(readPublicCookieConsent());
    };
    sync();
    window.addEventListener(PUBLIC_COOKIE_EVENT, sync);
    return () => window.removeEventListener(PUBLIC_COOKIE_EVENT, sync);
  }, []);

  const handleSetCookieMode = (mode: "all" | "essential") => {
    const updated = savePublicCookieConsent({
      functional: mode === "all",
      analytics: mode === "all",
    });
    setConsent(updated);
    setStatusMessage(
      mode === "all"
        ? "Preferences updated: All functional and optional analytics cookies enabled."
        : "Preferences updated: Strictly necessary security cookies only."
    );
  };

  const activeModeLabel = !consent
    ? "Default (Essential Security Only — Pending Selection)"
    : consent.functional && consent.analytics
      ? "All Cookies Accepted (Essential + Functional + Analytics)"
      : consent.functional || consent.analytics
        ? "Custom Preferences Active"
        : "Strictly Necessary Security Cookies Only";

  return (
    <main className="min-h-screen bg-[#F4F1E9] text-[#0F2040] pt-16">
      {/* ── EXECUTIVE DARK NAVY GOVERNANCE HERO ── */}
      <section
        className="relative overflow-hidden border-b border-[#C9A84C]/35 px-5 py-16 sm:py-20 text-white"
        style={{
          background:
            "linear-gradient(155deg, #070E1A 0%, #0F2040 55%, #070E1A 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.14) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-5xl">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-[#C9A84C]/45 bg-[#0F2040]/80 px-4 py-1.5 text-xs font-mono font-bold uppercase tracking-[0.18em] text-[#F3D37A]">
            <span className="h-2 w-2 rounded-full bg-[#C9A84C]" />
            TAYCO · Your information &amp; corporate governance
          </div>

          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight text-white">
            Privacy, Cookie Governance &amp; Project Confidentiality
          </h1>

          <p className="mt-4 max-w-3xl text-sm sm:text-base leading-relaxed text-slate-300">
            We collect the contact and project details you choose to submit so
            TAYCO can review your request, communicate with you and coordinate
            the requested services across our 8-state operational footprint (
            {COMPANY.states.join(", ")}). A website estimate is
            preliminary and requires a review of the actual scope.
          </p>

          {/* Governance telemetry badges */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs font-mono">
            <span className="rounded-lg border border-[#C9A84C]/40 bg-white/5 px-3 py-1.5 text-[#F3D37A]">
              Notice Version: {GUEST_PRIVACY_VERSION}
            </span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200">
              Intake Storage: AES-256-GCM Encrypted at Rest
            </span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200">
              Data Brokerage: Zero-Sale Guarantee
            </span>
            <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200">
              Visual Assets: Protected Canvas Stream
            </span>
          </div>

          {/* Section Quick-Jump Bar */}
          <nav
            aria-label="Privacy policy sections"
            className="mt-8 flex flex-wrap gap-2 border-t border-white/15 pt-5 text-xs font-semibold"
          >
            <a
              href="#overview"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200 hover:border-[#C9A84C] hover:text-[#F3D37A] transition-colors"
            >
              01 · Overview &amp; Project Space
            </a>
            <a
              href="#project-photography-privacy"
              className="rounded-lg border border-[#C9A84C]/45 bg-[#C9A84C]/15 px-3 py-1.5 text-[#F3D37A] hover:bg-[#C9A84C]/25 transition-colors"
            >
              02 · Client &amp; Photography Confidentiality
            </a>
            <a
              href="#cookies-and-security"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200 hover:border-[#C9A84C] hover:text-[#F3D37A] transition-colors"
            >
              03 · Cookies &amp; Consent Preferences
            </a>
            <a
              href="#form-encryption"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200 hover:border-[#C9A84C] hover:text-[#F3D37A] transition-colors"
            >
              04 · Documents &amp; Encrypted Intake
            </a>
            <a
              href="#guest-review-privacy"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200 hover:border-[#C9A84C] hover:text-[#F3D37A] transition-colors"
            >
              05 · Private Guest Reviews
            </a>
            <a
              href="#state-privacy-rights"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200 hover:border-[#C9A84C] hover:text-[#F3D37A] transition-colors"
            >
              06 · U.S. State Privacy Rights
            </a>
          </nav>
        </div>
      </section>

      {/* ── MAIN EDITORIAL GOVERNANCE CONTENT ── */}
      <article className="mx-auto max-w-5xl space-y-8 px-5 py-12 sm:py-16">
        {/* 4 Executive Assurance Pillars */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#0F2040]/15 bg-white p-5 shadow-sm">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6D23]">
              01 · No Data Selling
            </p>
            <h2 className="mt-1 text-base font-black text-[#0F2040]">
              Zero-Brokerage Policy
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#0F2040]/80">
              TAYCO LLC never sells, rents, or trades client contact records,
              property addresses, insurance scopes, or subcontractor details to
              third-party marketers.
            </p>
          </div>

          <div className="rounded-2xl border border-[#0F2040]/15 bg-white p-5 shadow-sm">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6D23]">
              02 · Intake Security
            </p>
            <h2 className="mt-1 text-base font-black text-[#0F2040]">
              AES-256-GCM at Rest
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#0F2040]/80">
              All website estimate, investor, and vendor prequalification
              submissions are encrypted at rest and accessible solely to
              verified TAYCO administrators.
            </p>
          </div>

          <div className="rounded-2xl border border-[#0F2040]/15 bg-white p-5 shadow-sm">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6D23]">
              03 · Property Discretion
            </p>
            <h2 className="mt-1 text-base font-black text-[#0F2040]">
              Protected Site Media
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#0F2040]/80">
              Public visuals use curated architectural recreations and encrypted
              canvas delivery so private residences and commercial tenants
              remain confidential.
            </p>
          </div>

          <div className="rounded-2xl border border-[#0F2040]/15 bg-white p-5 shadow-sm">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6D23]">
              04 · Access Control
            </p>
            <h2 className="mt-1 text-base font-black text-[#0F2040]">
              Invitation-Only Portal
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-[#0F2040]/80">
              Project workspaces, takeoff drawings, and insurer audit rooms
              enforce strict tenant isolation, role verification, and
              time-bounded session cookies.
            </p>
          </div>
        </div>

        {/* SECTION 01: OVERVIEW & YOUR PROJECT SPACE */}
        <section
          id="overview"
          className="rounded-2xl border border-[#0F2040]/15 bg-white p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0F2040]/10 pb-4">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#8A6D23]">
                Section 01 · Scope of Collection &amp; Portal Access
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#0F2040]">
                Your project space and information we collect
              </h2>
            </div>
            <span className="rounded-full bg-[#0F2040]/8 px-3 py-1 font-mono text-xs font-semibold text-[#0F2040]">
              8-State Operations
            </span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 text-sm leading-relaxed text-[#0F2040]/90">
            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#0F2040]">
                Project intake &amp; communication records
              </h3>
              <p>
                When you request a commercial or residential estimate, submit a
                property/investor inquiry, or apply to join our trade network,
                we collect your name, company name, telephone number, email
                address, city/state, trade discipline, and scope notes.
              </p>
              <p>
                We use these details exclusively to evaluate project
                feasibility, prepare preliminary estimates, verify trade
                compliance, and coordinate field inspections or emergency fire
                and water restoration dispatch.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-[#0F2040]">
                Invitation-only workspace governance
              </h3>
              <p>
                Account access is provided by invitation. Clients and providers
                can access the projects and records assigned to them. Keep your
                sign-in details and invitation links private. Contact TAYCO if
                access is no longer needed or appears incorrect.
              </p>
              <p>
                Every authenticated session is scoped to its assigned tenant and
                project authorization list. Unauthorized cross-project queries
                are rejected automatically at the server boundary.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 02: CLIENT CONFIDENTIALITY & PROJECT PHOTOGRAPHY */}
        <section
          id="project-photography-privacy"
          className="space-y-4 rounded-2xl border-2 border-[#C9A84C]/65 bg-gradient-to-br from-white via-[#FAF6EE] to-[#F4EFE2] p-6 sm:p-8 shadow-md"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#8A6D23]">
              Section 02 · Client confidentiality &amp; visual media
            </p>
            <span className="rounded-full border border-[#C9A84C]/55 bg-[#0F2040] px-3 py-1 font-mono text-[11px] font-bold text-[#F3D37A]">
              Protected Visual Stream Active
            </span>
          </div>

          <h2 className="text-2xl font-black text-[#0F2040]">
            Client privacy and project photography
          </h2>

          <p className="text-sm sm:text-base leading-relaxed text-[#0F2040]/90">
            To protect the privacy, security and confidentiality of our
            homeowners, commercial tenants, institutional facilities and private
            property owners, the photographs and architectural visuals presented
            across this website are curated architectural recreations based on
            real projects, field conditions and scopes of work performed by our
            teams.
          </p>

          <p className="text-sm leading-relaxed text-[#0F2040]/85">
            We do not publish identifiable private residences, proprietary
            commercial interiors, street addresses or confidential client floor
            plans on public pages without explicit written authorization. In
            addition, all public visual media is delivered through an encrypted
            binary stream into protected HTML5 canvas surfaces with right-click,
            drag, and bulk-extraction locks to prevent unauthorized scraping or
            redistribution.
          </p>
        </section>

        {/* SECTION 03: COOKIE POLICY & INTERACTIVE CONSENT CENTER */}
        <section
          id="cookies-and-security"
          className="rounded-2xl border border-[#0F2040]/15 bg-white p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#0F2040]/10 pb-4">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#8A6D23]">
                Section 03 · Cookies, Session Security &amp; Consent Controls
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#0F2040]">
                Cookie policy and live consent preferences
              </h2>
            </div>
            <span className="rounded-full border border-[#C9A84C]/50 bg-[#FAF6EE] px-3.5 py-1 font-mono text-xs font-bold text-[#8A6D23]">
              Notice {GUEST_PRIVACY_VERSION}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-[#0F2040]/90">
            TAYCO uses strictly necessary cookies and security tokens to
            maintain authenticated portal sessions, prevent cross-site request
            forgery (CSRF), enforce rate limits against automated scrapers, and
            remember your privacy preferences. We do not use third-party
            behavioral advertising pixels or cross-site tracking cookies.
          </p>

          {/* Interactive Consent Manager Card */}
          <div
            data-testid="privacy-page-cookie-control"
            className="rounded-2xl border border-[#C9A84C]/50 bg-[#070E1A] p-5 sm:p-6 text-white shadow-lg"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#C9A84C]">
                  Live Browser Consent Status
                </p>
                <p className="mt-1 text-sm sm:text-base font-bold text-white">
                  {activeModeLabel}
                </p>
                {consent?.updatedAt && (
                  <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                    Last updated: {new Date(consent.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSetCookieMode("all")}
                  className="rounded-xl bg-[#C9A84C] px-4 py-2 text-xs font-black text-[#070E1A] transition-all hover:bg-[#F3D37A] cursor-pointer"
                >
                  Accept All Cookies
                </button>
                <button
                  type="button"
                  onClick={() => handleSetCookieMode("essential")}
                  className="rounded-xl border border-[#C9A84C]/50 bg-[#0F2040] px-4 py-2 text-xs font-bold text-[#F3D37A] transition-all hover:border-[#F3D37A] hover:text-white cursor-pointer"
                >
                  Essential Only
                </button>
              </div>
            </div>

            {statusMessage && (
              <p
                role="status"
                className="mt-3 rounded-lg border border-[#C9A84C]/35 bg-[#0F2040]/90 px-3.5 py-2 text-xs font-medium text-[#F3D37A]"
              >
                {statusMessage}
              </p>
            )}
          </div>

          {/* Cookie Inventory Table */}
          <div className="overflow-x-auto rounded-xl border border-[#0F2040]/15">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#0F2040] text-white font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Cookie / Mechanism</th>
                  <th className="px-4 py-3">Classification</th>
                  <th className="px-4 py-3">Retention</th>
                  <th className="px-4 py-3">Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0F2040]/10 bg-white">
                {COOKIE_INVENTORY.map((item) => (
                  <tr key={item.name} className="align-top">
                    <td className="px-4 py-3 font-mono font-bold text-[#0F2040] whitespace-nowrap">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#8A6D23] whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="px-4 py-3 text-[#0F2040]/80 whitespace-nowrap">
                      {item.duration}
                    </td>
                    <td className="px-4 py-3 text-[#0F2040]/85 leading-relaxed">
                      {item.purpose}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 04: DOCUMENTS, SUBCONTRACTOR COMPLIANCE & ENCRYPTED INTAKE */}
        <section
          id="form-encryption"
          className="rounded-2xl border border-[#0F2040]/15 bg-white p-6 sm:p-8 shadow-sm space-y-4"
        >
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#8A6D23]">
            Section 04 · Document Security &amp; Compliance Records
          </p>
          <h2 className="text-2xl font-black text-[#0F2040]">
            Documents, tax records &amp; encrypted intake storage
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-[#0F2040]/90">
            Do not include tax identification numbers, payment card details or
            other sensitive information in public contact forms. Submit
            requested tax and insurance documents through your authorized
            account. Receipt of a document does not mean it has been reviewed or
            approved.
          </p>
          <p className="text-sm leading-relaxed text-[#0F2040]/85">
            All public form submissions (Commercial &amp; Residential Estimate
            Requests, Property/Investor Inquiries, and Trade Partner
            Applications) are immediately encrypted at rest using authenticated
            AES-256-GCM encryption inside our isolated database volume and
            surfaced only inside the authenticated TAYCO Administrator Command
            Center.
          </p>
        </section>

        {/* SECTION 05: PRIVATE GUEST REVIEWS (CONTRACTUAL EXACT DISCLOSURES PRESERVED) */}
        <section
          id="guest-review-privacy"
          className="rounded-2xl border border-[#0F2040]/15 bg-white p-6 sm:p-8 shadow-sm space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0F2040]/10 pb-3">
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#8A6D23]">
                Section 05 · Portal Audit &amp; Guest Review Governance
              </p>
              <h2 className="mt-1 text-2xl font-black text-[#0F2040]">
                Private guest reviews: cookies and activity
              </h2>
            </div>
            <span className="rounded-full bg-[#0F2040] px-3 py-1 font-mono text-xs font-bold text-[#F3D37A]">
              Notice {GUEST_PRIVACY_VERSION}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-[#0F2040]/90">
            Notice {GUEST_PRIVACY_VERSION}. An essential, protected session
            cookie secures review access. Security events are recorded
            independently of optional analytics. Guest reviews end four hours
            after generation; accepting analytics never extends access.
          </p>
          <p className="text-sm leading-relaxed text-[#0F2040]/90">
            Optional interaction analytics record selected review controls only
            after you accept. They do not collect passwords, typed text,
            document contents, screen recordings or continuous mouse and touch
            movement. Accept, reject or withdraw through Privacy &amp; activity
            in your review or guest account. Choices apply only to the current
            review and notice version; a new version or review requires a new
            choice.
          </p>
          <p className="text-sm leading-relaxed text-[#0F2040]/90">
            Withdrawing stops future optional collection. Previously recorded
            events remain within the retention policy: 90 days by default,
            configurable up to 365 days, with a 10,000-event company limit.
            Preference history is retained up to 90 days with a 10,000-entry
            company limit. Only authorized administrators can view activity
            reports.
          </p>
          <p className="text-sm leading-relaxed text-[#0F2040]/90">
            No optional activity queue is stored in browser storage. Withdrawing
            locally turns optional collection off on that page and signals other
            open review tabs. If saving fails, retry when connected to persist
            the choice. Review access and sign out continue independently. This
            notice stays accessible after a review ends and contains no customer
            records.
          </p>
        </section>

        {/* SECTION 06: U.S. STATE PRIVACY RIGHTS & QUESTIONS */}
        <section
          id="state-privacy-rights"
          className="rounded-2xl border border-[#0F2040]/15 bg-white p-6 sm:p-8 shadow-sm space-y-5"
        >
          <p className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-[#8A6D23]">
            Section 06 · Statutory Privacy Rights &amp; Data Requests
          </p>
          <h2 className="text-2xl font-black text-[#0F2040]">
            Your privacy rights, questions and requests
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-xs sm:text-sm">
            <div className="rounded-xl border border-[#0F2040]/10 bg-[#FAF6EE] p-4">
              <p className="font-bold text-[#0F2040]">
                Right to Access &amp; Know
              </p>
              <p className="mt-1 text-[#0F2040]/80 leading-relaxed">
                Request confirmation of whether we hold contact or project
                records associated with your email or business entity.
              </p>
            </div>
            <div className="rounded-xl border border-[#0F2040]/10 bg-[#FAF6EE] p-4">
              <p className="font-bold text-[#0F2040]">
                Right to Correction &amp; Deletion
              </p>
              <p className="mt-1 text-[#0F2040]/80 leading-relaxed">
                Request updates to inaccurate contact details or deletion of
                public inquiry submissions, subject to statutory construction,
                warranty, tax, and insurance retention requirements.
              </p>
            </div>
            <div className="rounded-xl border border-[#0F2040]/10 bg-[#FAF6EE] p-4">
              <p className="font-bold text-[#0F2040]">
                Right to Withdraw Consent
              </p>
              <p className="mt-1 text-[#0F2040]/80 leading-relaxed">
                Switch your cookie preferences to Essential Only at any time on
                this page or through the Privacy &amp; Cookies control without
                affecting service eligibility.
              </p>
            </div>
          </div>

          <p id="contact-dpo" className="text-sm sm:text-base leading-relaxed text-[#0F2040]/90">
            For questions about your information, corrections, access or
            deletion requests, contact{" "}
            <a
              className="font-bold underline text-[#0F2040] hover:text-[#8A6D23]"
              href="mailto:general@taycoturnkey.com"
            >
              general@taycoturnkey.com
            </a>{" "}
            or call{" "}
            <a
              className="font-bold underline text-[#0F2040] hover:text-[#8A6D23]"
              href={COMPANY.phoneHref}
            >
              {COMPANY.phoneDisplay}
            </a>{" "}
            ({COMPANY.coverage}). TAYCO will review requests in the context of
            the project and applicable recordkeeping obligations.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F2040] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1B3A6B]"
              href="/"
            >
              Return to TAYCO
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-xl border border-[#0F2040]/25 bg-[#FAF6EE] px-5 py-3 text-sm font-bold text-[#0F2040] transition-all hover:border-[#C9A84C]"
              href="/estimate"
            >
              Request Project Estimate →
            </Link>
          </div>
        </section>
      </article>
    </main>
  );
}
