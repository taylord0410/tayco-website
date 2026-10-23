"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/company";

const TRADES = [
  "Framing",
  "Drywall",
  "Flooring",
  "Painting",
  "Roofing",
  "Siding",
  "Electrical",
  "Plumbing",
  "Carpentry",
  "Concrete",
  "Demolition",
  "Solar Panels",
  "Cleaning",
  "HVAC",
  "Insulation",
  "Windows & Doors",
  "Gutters & Drainage",
  "Interior",
  "Exterior",
  "Water Damage Restoration",
  "Fire Damage Restoration",
  "Other",
];

const STATES = [
  "Wisconsin (WI)",
  "Illinois (IL)",
  "Minnesota (MN)",
  "Texas (TX)",
  "Iowa (IA)",
  "Indiana (IN)",
  "Michigan (MI)",
  "Missouri (MO)",
  "All eight service states",
];

const COPY = {
  badge: "BUILD WITH TAYCO · TRADE PARTNERS",
  title: "Vendor & Subcontractor Qualification Application",
  subtitle:
    "Tell us about your business, trades, service area and crew availability. We review applications for commercial, residential and restoration work.",
  successTitle: "Application received",
  successMsg:
    "Thank you for introducing your business. Your application has been saved for team review. Submission does not confirm approval or a project award.",
  successPending:
    "If we need documents, we will provide the next steps through your invited account. Do not email tax or identity documents.",
  backHome: "Back to Home",
  uploadDocs: "Documents are requested after review",
  sectionBusiness: "01 · Legal Entity & Trade Qualifications",
  businessName: "Legal Business Name",
  contactName: "Primary Contact Name",
  phone: "Direct Phone",
  email: "Accounting & Dispatch Email",
  licenseNumber: "State Contractor License Number",
  licenseHint: "State license # (if applicable)",
  yearsInBusiness: "Years in Business",
  yearsHint: "e.g. 5",
  crewSize: "Active Field Crew Size",
  crewHint: "e.g. 6 trade technicians",
  insured: "Do you have general liability insurance?",
  insuredSelect: "Select...",
  insuredYes: "Yes",
  insuredNo: "No",
  sectionArea: "02 · Your service area",
  statesServed: "States you serve",
  statesSelect: "Select...",
  citiesServed: "Primary Metro Areas & Counties Covered",
  citiesHint: "e.g. Milwaukee, Madison or Chicago and surrounding counties",
  sectionTrades: "03 · Trades & services",
  tradesNote: "(select all trades performed in-house)",
  tradesAlert: "Please select at least one trade.",
  sectionDocs: "04 · Supporting documents",
  docsIntro:
    "You can apply without uploading documents. When required, W-9 and insurance records are requested through an invited account and reviewed separately.",

  notes: "Additional Equipment, Bonding & Trade Certifications",
  notesHint:
    "Tell us about relevant qualifications, equipment and availability. Do not include tax IDs, bank details or identity documents.",
  submit: "Send trade partner application →",
  submitting: "Sending your application...",
  footer:
    "We review your trade experience, service area and project fit. A team member will contact you about the next steps.",
  errorFallback: "Something went wrong. Please try again.",

};

export default function VendorApplicationPage() {
  const [form, setForm] = useState({
    businessName: "",
    contactName: "",
    phone: "",
    email: "",
    licenseNumber: "",
    yearsInBusiness: "",
    crewSize: "",
    citiesServed: "",
    stateServed: "",
    insured: "",
    notes: "",
    website: "",
  });
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const docsPending = true;
  const [errorMsg, setErrorMsg] = useState("");
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState("");
  const requestRef = useRef<{ key: string; payload: string } | null>(null);
  const loadedAt = useRef<number | null>(null);
  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleTrade(trade: string) {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((x) => x !== trade) : [...prev, trade]
    );
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTrades.length === 0) {
      setErrorMsg(COPY.tradesAlert);
      setStatus("error");
      return;
    }
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const payload = JSON.stringify({ ...form, trades: selectedTrades.join(", "), docsPending: true, _loadedAt: loadedAt.current });
      if (requestRef.current?.payload !== payload) requestRef.current = { key: crypto.randomUUID(), payload };
      const res = await fetch("/api/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestRef.current.key },
        body: payload,
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.success || !data.referenceId) throw new Error("Receipt unavailable");
        setReferenceId(data.referenceId);
        setNotificationStatus(data.notificationStatus || "pending");
        requestRef.current = null;
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || data.message || COPY.errorFallback);
        setStatus("error");
      }
    } catch {
      setErrorMsg(COPY.errorFallback);
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen pt-16 section-editorial-ivory" style={{ background: "#F7F6F1" }}>
      {/* Header */}
      <div
        className="py-12 border-b "
        style={{
          background: "linear-gradient(145deg, #070E1A 0%, #0F2040 60%, #142B54 100%)",
          borderColor: "rgba(201,168,76,0.35)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="tayco-eyebrow mb-3">
            <span className="tayco-live-dot" />
            {COPY.badge}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white mt-2 mb-3 tracking-tight">
            Vendor &amp; Subcontractor{" "}
            <em className="tayco-serif-em">Application</em>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            {COPY.subtitle}
          </p>
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-amber-300">
            <span>{COMPANY.phoneDisplay}</span>
            <span>·</span>
            <span>{COMPANY.email}</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div data-surface-mode="crystal" className="tayco-living-card bg-gradient-to-br from-[#070E1A] via-[#0F2040] to-[#1B3A6B] text-white shadow-2xl p-5 sm:p-6">
          <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
          <div className="relative z-10">
            <p className="tayco-eyebrow text-amber-300 mb-3">A clear path to working together</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div><h2 className="font-bold text-white">01 · Introduce your team</h2><p className="text-sm text-slate-300 mt-2">Share your trade experience, crew size and service area.</p></div>
              <div><h2 className="font-bold text-white">02 · Application review</h2><p className="text-sm text-slate-300 mt-2">We review project fit and contact you for any missing information.</p></div>
              <div><h2 className="font-bold text-white">03 · Invited account</h2><p className="text-sm text-slate-300 mt-2">If invited, sign in to exchange project information and requested documents.</p></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {status === "success" ? (
          <div
            data-surface-mode="mineral"
            className="tayco-living-card editorial-ivory-card text-center py-14 px-6 bg-white"
          >
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>
              {COPY.successTitle}
            </h2>
            <p className="text-slate-600 mb-4 max-w-xl mx-auto text-sm">{COPY.successMsg}</p>
            <p role="status" className="text-xs text-slate-600 mb-5 break-all">Reference: <strong>{referenceId}</strong><br />{notificationStatus === "pending" ? "Saved. Team notification is pending; your reference remains valid." : "Saved for team review."}</p>
            {docsPending && (
              <div
                className="mx-auto max-w-md rounded-xl px-5 py-4 mb-6 text-sm"
                style={{ background: "#FFF7ED", border: "2px solid #C9A84C" }}
              >
                <p className="font-semibold mb-1" style={{ color: "#C9A84C" }}>
                  📄 {COPY.uploadDocs}
                </p>
                <p className="text-slate-600 text-xs">{COPY.successPending}</p>
                <Link
                  href="/login"
                  className="block mt-3 text-xs font-semibold underline"
                  style={{ color: "#0F2040" }}
                >
                  Invited partner sign in →
                </Link>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/login"
                data-magnetic
                className="font-bold px-6 py-3 rounded-xl text-xs"
                style={{ background: "#0F2040", color: "#C9A84C" }}
              >
                Existing partner sign in →
              </Link>
              <Link
                href="/"
                className="font-semibold px-6 py-3 rounded-xl text-xs"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                {COPY.backHome}
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            data-surface-mode="mineral"
            className="tayco-living-card editorial-ivory-card p-5 sm:p-8 space-y-6 bg-white"
          >
            <div className="preview-orbits" aria-hidden="true" />
            <div className="relative z-10 space-y-6">
              {/* Honeypot */}
              <div style={{ display: "none" }} aria-hidden="true">
                <input
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Business Info */}
              <div>
                <h2
                  className="text-base font-mono font-bold uppercase tracking-wider mb-4 pb-2 border-b-2"
                  style={{ color: "#0F2040", borderColor: "#E2E8F0" }}
                >
                  {COPY.sectionBusiness}
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vendor-businessName"
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.businessName} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                    id="vendor-businessName"
                    name="businessName" autoComplete="organization"
                        value={form.businessName}
                        onChange={handleChange}
                        required
                        placeholder="Badger State Mechanical LLC"
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                    <div>
                      <label htmlFor="vendor-contactName"
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.contactName} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                    id="vendor-contactName"
                    name="contactName" autoComplete="name"
                        value={form.contactName}
                        onChange={handleChange}
                        required
                        placeholder="Robert Kowalski"
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vendor-phone"
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.phone} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                    id="vendor-phone"
                    name="phone" autoComplete="tel" inputMode="tel"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        placeholder="Your phone number"
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                    <div>
                      <label htmlFor="vendor-email"
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.email} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                    id="vendor-email"
                    name="email" autoComplete="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="dispatch@company.com"
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vendor-licenseNumber"
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.licenseNumber}
                      </label>
                      <input
                    id="vendor-licenseNumber"
                    name="licenseNumber"
                        value={form.licenseNumber}
                        onChange={handleChange}
                        placeholder={COPY.licenseHint}
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                    <div>
                      <label htmlFor="vendor-yearsInBusiness"
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.yearsInBusiness} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                    id="vendor-yearsInBusiness"
                    name="yearsInBusiness"
                        value={form.yearsInBusiness}
                        onChange={handleChange}
                        required
                        placeholder={COPY.yearsHint}
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="vendor-crewSize"
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.crewSize} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                    id="vendor-crewSize"
                    name="crewSize"
                        value={form.crewSize}
                        onChange={handleChange}
                        required
                        placeholder={COPY.crewHint}
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                    <div>
                      <label htmlFor="vendor-insured"
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.insured} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <select
                    id="vendor-insured"
                    name="insured"
                        value={form.insured}
                        onChange={handleChange}
                        required
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                        style={{ borderColor: "#E2E8F0" }}
                      >
                        <option value="">{COPY.insuredSelect}</option>
                        <option value="Yes">{COPY.insuredYes}</option>
                        <option value="No">{COPY.insuredNo}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Area */}
              <div>
                <h2
                  className="text-base font-mono font-bold uppercase tracking-wider mb-4 pb-2 border-b-2"
                  style={{ color: "#0F2040", borderColor: "#E2E8F0" }}
                >
                  {COPY.sectionArea}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="vendor-stateServed"
                      className="block text-sm font-semibold mb-1"
                      style={{ color: "#0F2040" }}
                    >
                      {COPY.statesServed} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <select
                    id="vendor-stateServed"
                    name="stateServed"
                      value={form.stateServed}
                      onChange={handleChange}
                      required
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                      style={{ borderColor: "#E2E8F0" }}
                    >
                      <option value="">{COPY.statesSelect}</option>
                      {STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="vendor-citiesServed"
                      className="block text-sm font-semibold mb-1"
                      style={{ color: "#0F2040" }}
                    >
                      {COPY.citiesServed} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                    id="vendor-citiesServed"
                    name="citiesServed"
                      value={form.citiesServed}
                      onChange={handleChange}
                      required
                      placeholder={COPY.citiesHint}
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                </div>
              </div>

              {/* Trades */}
              <div>
                <h2
                  className="text-base font-mono font-bold uppercase tracking-wider mb-2 pb-2 border-b-2"
                  style={{ color: "#0F2040", borderColor: "#E2E8F0" }}
                >
                  {COPY.sectionTrades}{" "}
                  <span className="text-xs font-sans font-normal text-slate-400">
                    {COPY.tradesNote}
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {TRADES.map((trade) => (
                    <button
                      key={trade}
                      type="button"
                      aria-pressed={selectedTrades.includes(trade)}
                      onClick={() => toggleTrade(trade)}
                      className="text-left text-xs px-3 py-2 rounded-lg border-2 font-semibold transition-colors cursor-pointer"
                      style={{
                        borderColor: selectedTrades.includes(trade) ? "#C9A84C" : "#E2E8F0",
                        background: selectedTrades.includes(trade) ? "#FFF7ED" : "white",
                        color: selectedTrades.includes(trade) ? "#0F2040" : "#374151",
                      }}
                    >
                      {selectedTrades.includes(trade) ? "✔ " : ""}
                      {trade}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h2
                  className="text-base font-mono font-bold uppercase tracking-wider mb-1 pb-2 border-b-2"
                  style={{ color: "#0F2040", borderColor: "#E2E8F0" }}
                >
                  {COPY.sectionDocs}
                </h2>
                <p className="text-xs text-slate-500 mb-4">{COPY.docsIntro}</p>

                <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-slate-700">
                  Do not include tax identification numbers or banking details in this form.
                  Already invited? <Link href="/login" className="font-semibold underline">Sign in to your partner account</Link>.
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="vendor-notes"
                  className="block text-sm font-semibold mb-1"
                  style={{ color: "#0F2040" }}
                >
                  {COPY.notes}
                </label>
                <textarea
                    id="vendor-notes"
                    name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder={COPY.notesHint}
                  className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none resize-none"
                  style={{ borderColor: "#E2E8F0" }}
                />
              </div>

              {status === "error" && (
                <div role="alert" className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                  {errorMsg}
                </div>
              )}

              <p className="text-xs text-slate-600">We use these details to review your application and contact you. <Link href="/privacy" className="underline">Privacy &amp; data protection</Link>.</p>
              <button
                type="submit"
                data-magnetic
                disabled={status === "sending"}
                className="w-full font-black py-3.5 rounded-xl text-base transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                {status === "sending" ? COPY.submitting : COPY.submit}
              </button>

              <p className="text-center text-xs text-slate-500">{COPY.footer}</p>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
