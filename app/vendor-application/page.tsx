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
  sectionBusiness: "01 / Legal Entity & Trade Qualifications",
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
  sectionArea: "02 / Your service area",
  statesServed: "States you serve",
  statesSelect: "Select...",
  citiesServed: "Primary Metro Areas & Counties Covered",
  citiesHint: "e.g. Milwaukee, Madison or Chicago and surrounding counties",
  sectionTrades: "03 / Trades & services",
  tradesNote: "(select all trades performed in-house)",
  tradesAlert: "Please select at least one trade.",
  sectionDocs: "04 / Supporting documents",
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

const INPUT_CLASS =
  "w-full border rounded-xl px-4 py-3 text-sm bg-[#FAF9F5] text-[#070E1A] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/35 transition-all";
const INPUT_STYLE = { borderColor: "rgba(201, 168, 76, 0.35)" };

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
      const payload = JSON.stringify({
        ...form,
        trades: selectedTrades.join(", "),
        docsPending: true,
        _loadedAt: loadedAt.current,
      });
      if (requestRef.current?.payload !== payload)
        requestRef.current = { key: crypto.randomUUID(), payload };
      const res = await fetch("/api/vendor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": requestRef.current.key,
        },
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
    <main
      className="min-h-screen pt-16 section-editorial-ivory"
      style={{ background: "#F4F2EA" }}
    >
      {/* Architectural Header */}
      <div
        className="py-14 border-b"
        style={{
          background:
            "linear-gradient(145deg, #070E1A 0%, #0B172A 45%, #0F2040 80%, #1B3A6B 100%)",
          borderColor: "rgba(201, 168, 76, 0.4)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="tayco-eyebrow mb-3" style={{ color: "#F3D37A" }}>
            <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
            {COPY.badge}
          </span>
          <h1
            className="text-3xl sm:text-5xl font-black mt-2 mb-3 tracking-tight"
            style={{ color: "#F4F2EA" }}
          >
            Vendor &amp; Subcontractor{" "}
            <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
              Application
            </em>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            {COPY.subtitle}
          </p>
          <div
            className="mt-5 inline-flex flex-wrap items-center justify-center gap-4 text-xs font-mono px-4 py-2 rounded-full border"
            style={{
              color: "#F3D37A",
              background: "rgba(7, 14, 26, 0.55)",
              borderColor: "rgba(201, 168, 76, 0.32)",
            }}
          >
            <span>{COMPANY.phoneDisplay}</span>
            <span style={{ color: "#C9A84C" }}>·</span>
            <span>{COMPANY.email}</span>
          </div>
        </div>
      </div>

      {/* 3-Step Onboarding Strip */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div
          data-surface-mode="crystal"
          className="tayco-living-card text-white shadow-2xl p-6 sm:p-7 rounded-2xl border"
          style={{
            background:
              "linear-gradient(135deg, #070E1A 0%, #0F2040 55%, #1B3A6B 100%)",
            borderColor: "rgba(201, 168, 76, 0.42)",
          }}
        >
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="relative z-10">
            <p className="tayco-eyebrow mb-4" style={{ color: "#F3D37A" }}>
              A clear path to working together
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(7, 14, 26, 0.48)",
                  borderColor: "rgba(201, 168, 76, 0.24)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F3D37A"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V7l7-4 7 4v14" />
                    <path d="M9 11h6" />
                    <path d="M9 15h6" />
                  </svg>
                  <h2 className="font-bold text-sm tracking-wide" style={{ color: "#F4F2EA" }}>
                    <span className="font-mono mr-1.5" style={{ color: "#C9A84C" }}>
                      01 /
                    </span>
                    Introduce your team
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Share your trade experience, crew size and service area.
                </p>
              </div>

              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(7, 14, 26, 0.48)",
                  borderColor: "rgba(201, 168, 76, 0.24)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F3D37A"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  <h2 className="font-bold text-sm tracking-wide" style={{ color: "#F4F2EA" }}>
                    <span className="font-mono mr-1.5" style={{ color: "#C9A84C" }}>
                      02 /
                    </span>
                    Application review
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  We review project fit and contact you for any missing information.
                </p>
              </div>

              <div
                className="p-4 rounded-xl border"
                style={{
                  background: "rgba(7, 14, 26, 0.48)",
                  borderColor: "rgba(201, 168, 76, 0.24)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F3D37A"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <h2 className="font-bold text-sm tracking-wide" style={{ color: "#F4F2EA" }}>
                    <span className="font-mono mr-1.5" style={{ color: "#C9A84C" }}>
                      03 /
                    </span>
                    Invited account
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  If invited, sign in to exchange project information and requested documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Application Container */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {status === "success" ? (
          <div
            data-surface-mode="mineral"
            className="tayco-living-card editorial-ivory-card text-center py-14 px-6 bg-white rounded-2xl border"
            style={{ borderColor: "rgba(201, 168, 76, 0.42)" }}
          >
            <div
              className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center border shadow-lg"
              style={{
                background: "linear-gradient(135deg, #070E1A 0%, #0F2040 100%)",
                borderColor: "#C9A84C",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F3D37A"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>
              {COPY.successTitle}
            </h2>
            <p className="text-slate-600 mb-4 max-w-xl mx-auto text-sm">
              {COPY.successMsg}
            </p>
            <p role="status" className="text-xs text-slate-600 mb-5 break-all">
              Reference: <strong>{referenceId}</strong>
              <br />
              {notificationStatus === "pending"
                ? "Saved. Team notification is pending; your reference remains valid."
                : "Saved for team review."}
            </p>
            {docsPending && (
              <div
                className="mx-auto max-w-md rounded-xl px-5 py-4 mb-6 text-sm border"
                style={{
                  background: "#F4F2EA",
                  borderColor: "#C9A84C",
                }}
              >
                <p
                  className="font-semibold mb-1.5 inline-flex items-center justify-center gap-2"
                  style={{ color: "#0F2040" }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="8" y1="13" x2="16" y2="13" />
                    <line x1="8" y1="17" x2="13" y2="17" />
                  </svg>
                  <span>{COPY.uploadDocs}</span>
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
                className="font-bold px-6 py-3 rounded-xl text-xs border"
                style={{
                  background: "linear-gradient(135deg, #070E1A 0%, #0F2040 100%)",
                  borderColor: "#C9A84C",
                  color: "#F3D37A",
                }}
              >
                Existing partner sign in →
              </Link>
              <Link
                href="/"
                className="font-semibold px-6 py-3 rounded-xl text-xs"
                style={{
                  background:
                    "linear-gradient(135deg, #C9A84C 0%, #DFC06C 55%, #F3D37A 100%)",
                  color: "#070E1A",
                }}
              >
                {COPY.backHome}
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            data-surface-mode="mineral"
            className="tayco-living-card editorial-ivory-card p-6 sm:p-9 space-y-8 bg-white rounded-2xl border shadow-xl"
            style={{ borderColor: "rgba(201, 168, 76, 0.38)" }}
          >
            <div className="preview-orbits" aria-hidden="true" />
            <div className="relative z-10 space-y-8">
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

              {/* 01 / Business Info */}
              <div>
                <h2
                  className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider mb-5 pb-3 border-b flex items-center gap-2.5"
                  style={{
                    color: "#0F2040",
                    borderColor: "rgba(201, 168, 76, 0.38)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 3v18" />
                    <path d="M13 8h4" />
                    <path d="M13 12h4" />
                  </svg>
                  <span>{COPY.sectionBusiness}</span>
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="vendor-businessName"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.businessName} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                        id="vendor-businessName"
                        name="businessName"
                        autoComplete="organization"
                        value={form.businessName}
                        onChange={handleChange}
                        required
                        placeholder="Badger State Mechanical LLC"
                        className={INPUT_CLASS}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="vendor-contactName"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.contactName} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                        id="vendor-contactName"
                        name="contactName"
                        autoComplete="name"
                        value={form.contactName}
                        onChange={handleChange}
                        required
                        placeholder="Robert Kowalski"
                        className={INPUT_CLASS}
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="vendor-phone"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.phone} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                        id="vendor-phone"
                        name="phone"
                        autoComplete="tel"
                        inputMode="tel"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        placeholder="Your phone number"
                        className={INPUT_CLASS}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="vendor-email"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.email} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                        id="vendor-email"
                        name="email"
                        autoComplete="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="dispatch@company.com"
                        className={INPUT_CLASS}
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="vendor-licenseNumber"
                        className="block text-sm font-semibold mb-1.5"
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
                        className={INPUT_CLASS}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="vendor-yearsInBusiness"
                        className="block text-sm font-semibold mb-1.5"
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
                        className={INPUT_CLASS}
                        style={INPUT_STYLE}
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="vendor-crewSize"
                        className="block text-sm font-semibold mb-1.5"
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
                        className={INPUT_CLASS}
                        style={INPUT_STYLE}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="vendor-insured"
                        className="block text-sm font-semibold mb-1.5"
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
                        className={INPUT_CLASS}
                        style={INPUT_STYLE}
                      >
                        <option value="">{COPY.insuredSelect}</option>
                        <option value="Yes">{COPY.insuredYes}</option>
                        <option value="No">{COPY.insuredNo}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 02 / Service Area */}
              <div>
                <h2
                  className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider mb-5 pb-3 border-b flex items-center gap-2.5"
                  style={{
                    color: "#0F2040",
                    borderColor: "rgba(201, 168, 76, 0.38)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 21s-7-5.7-7-11a7 7 0 1 1 14 0c0 5.3-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  <span>{COPY.sectionArea}</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="vendor-stateServed"
                      className="block text-sm font-semibold mb-1.5"
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
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
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
                    <label
                      htmlFor="vendor-citiesServed"
                      className="block text-sm font-semibold mb-1.5"
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
                      className={INPUT_CLASS}
                      style={INPUT_STYLE}
                    />
                  </div>
                </div>
              </div>

              {/* 03 / Trades */}
              <div>
                <h2
                  className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider mb-2 pb-3 border-b flex flex-wrap items-center gap-2.5"
                  style={{
                    color: "#0F2040",
                    borderColor: "rgba(201, 168, 76, 0.38)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <polygon points="12 2 2 7 12 12 22 7 12 2" />
                    <polyline points="2 17 12 22 22 17" />
                    <polyline points="2 12 12 17 22 12" />
                  </svg>
                  <span>{COPY.sectionTrades}</span>
                  <span className="text-xs font-sans font-normal text-slate-500">
                    {COPY.tradesNote}
                  </span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-4">
                  {TRADES.map((trade) => {
                    const isSelected = selectedTrades.includes(trade);
                    return (
                      <button
                        key={trade}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleTrade(trade)}
                        className="text-left text-xs px-3.5 py-2.5 rounded-xl border font-semibold transition-all cursor-pointer flex items-center gap-2"
                        style={
                          isSelected
                            ? {
                                background:
                                  "linear-gradient(135deg, #0F2040 0%, #1B3A6B 100%)",
                                borderColor: "#C9A84C",
                                color: "#F3D37A",
                                boxShadow:
                                  "0 8px 20px -8px rgba(201, 168, 76, 0.45)",
                              }
                            : {
                                background: "#FAF9F5",
                                borderColor: "rgba(201, 168, 76, 0.28)",
                                color: "#0F2040",
                              }
                        }
                      >
                        <span
                          className="w-4 h-4 rounded flex items-center justify-center shrink-0 border"
                          style={
                            isSelected
                              ? {
                                  background: "#C9A84C",
                                  borderColor: "#F3D37A",
                                }
                              : {
                                  background: "transparent",
                                  borderColor: "rgba(201, 168, 76, 0.45)",
                                }
                          }
                          aria-hidden="true"
                        >
                          {isSelected && (
                            <svg
                              width="11"
                              height="11"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#070E1A"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        <span className="truncate">{trade}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 04 / Supporting Documents */}
              <div>
                <h2
                  className="text-sm sm:text-base font-mono font-bold uppercase tracking-wider mb-2 pb-3 border-b flex items-center gap-2.5"
                  style={{
                    color: "#0F2040",
                    borderColor: "rgba(201, 168, 76, 0.38)",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>{COPY.sectionDocs}</span>
                </h2>
                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  {COPY.docsIntro}
                </p>

                <div
                  className="rounded-xl border p-4 text-sm flex items-start gap-3"
                  style={{
                    background: "#F4F2EA",
                    borderColor: "rgba(201, 168, 76, 0.45)",
                    color: "#0F2040",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    Do not include tax identification numbers or banking details in this form.{" "}
                    Already invited?{" "}
                    <Link
                      href="/login"
                      className="font-semibold underline"
                      style={{ color: "#0F2040" }}
                    >
                      Sign in to your partner account
                    </Link>
                    .
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label
                  htmlFor="vendor-notes"
                  className="block text-sm font-semibold mb-1.5"
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
                  className={`${INPUT_CLASS} resize-none`}
                  style={INPUT_STYLE}
                />
              </div>

              {status === "error" && (
                <div
                  role="alert"
                  className="rounded-xl border px-4 py-3 text-sm text-center font-medium"
                  style={{
                    background: "rgba(15, 32, 64, 0.06)",
                    borderColor: "#C9A84C",
                    color: "#0F2040",
                  }}
                >
                  {errorMsg}
                </div>
              )}

              <p className="text-xs text-slate-600">
                We use these details to review your application and contact you.{" "}
                <Link href="/privacy" className="underline" style={{ color: "#0F2040" }}>
                  Privacy &amp; data protection
                </Link>
                .
              </p>
              <button
                type="submit"
                data-magnetic
                disabled={status === "sending"}
                className="w-full font-black py-4 rounded-xl text-base transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer border"
                style={{
                  background:
                    "linear-gradient(135deg, #C9A84C 0%, #DFC06C 50%, #F3D37A 100%)",
                  borderColor: "rgba(243, 211, 122, 0.7)",
                  color: "#070E1A",
                  boxShadow: "0 12px 28px -10px rgba(201, 168, 76, 0.55)",
                }}
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
