"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  "North Dakota (ND)",
  "Minnesota (MN)",
  "Texas (TX)",
  "Iowa (IA)",
  "Indiana (IN)",
  "Michigan (MI)",
  "Missouri (MO)",
  "All 9 States — Multi-State Crew Mobilization",
];

const COPY = {
  badge: "29-Trade Subcontractor Registry & W-9 / COI Compliance Gate",
  title: "Vendor & Subcontractor Qualification Application",
  subtitle:
    "Join TAYCO LLC's pre-qualified commercial and residential trade network across all 9 states (WI · IL · IA · IN · MN · MI · MO · TX · ND). Approved subcontractors participate directly in Takeoff Pro v5.0 (:8085) 3-Bid Leveling matrices, Davis-Bacon WH-347 certified payroll, and automated IRS Form 1099-NEC reporting.",
  successTitle: "Subcontractor Application Registered!",
  successMsg:
    "Thank you for applying. Your trade profile and compliance status have been logged in the TAYCO Executive Command Center (/portal). Our procurement dispatch at (414) 293-8400 (Milwaukee HQ) and (701) 839-2277 (North Dakota Operations) will review your application within 2–3 business days.",
  successPending:
    "Your application was received. Your W-9 or COI documents are still marked as pending — you can upload them anytime by returning to this page or emailing general@taycoturnkey.com.",
  backHome: "Back to Home",
  uploadDocs: "W-9 / COI Compliance Gate Pending",
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
  insured: "Active General Liability Insurance?",
  insuredSelect: "Select...",
  insuredYes: "Yes — Active General Liability & Workers' Comp",
  insuredNo: "No",
  sectionArea: "02 · 9-State Service Territory",
  statesServed: "States You Serve (WI · IL · ND · MN · TX · IA · IN · MI · MO)",
  statesSelect: "Select...",
  citiesServed: "Primary Metro Areas & Counties Covered",
  citiesHint: "e.g. Milwaukee, Madison, Chicago Metro, New Town ND, Minot ND",
  sectionTrades: "03 · CSI Trade Divisions & Services Offered",
  tradesNote: "(select all trades performed in-house)",
  tradesAlert: "Please select at least one trade.",
  sectionDocs: "04 · IRS 1099-NEC W-9 & COI Compliance Gate",
  docsIntro:
    "Upload your signed IRS Form W-9 and Certificate of Insurance (COI). Subcontractors must pass the W-9 + COI Compliance Gate prior to Takeoff Pro bid award, dispatch, or AIA G702/G703 progress draw release.",
  w9Label: "IRS Form W-9 (TIN / EIN Verification)",
  w9Desc: "Required for automated IRS 1099-NEC year-end reporting in TAYCO Tax Engine (MOD_TAX_COMPLIANCE).",
  insuranceLabel: "Certificate of Insurance (COI — General Liability)",
  insuranceDesc:
    "Your insurance certificate must list TAYCO LLC as the Certificate Holder:",
  holderInfo: "TAYCO LLC\n2829 West Wisconsin Ave\nMilwaukee, WI 53208",
  insuranceReq1: "Commercial General Liability Insurance required",
  insuranceReq2: "TAYCO LLC must be listed as Certificate Holder",
  insuranceReq3: "Address: 2829 West Wisconsin Ave, Milwaukee, WI 53208",
  uploadBtn: "Choose Compliance File",
  uploaded: "Compliance document uploaded ✔",
  uploading: "Uploading to Compliance Vault...",
  uploadError:
    "Upload failed. You can still submit your application and email your W-9 / COI to general@taycoturnkey.com.",
  skipDocs:
    "I do not have my W-9 / COI files ready right now — register my trade profile in PENDING compliance status",
  notes: "Additional Equipment, Bonding & Trade Certifications",
  notesHint:
    "List OSHA certifications, commercial bonding capacity, specialized heavy equipment, or Davis-Bacon WH-347 prevailing-wage experience...",
  submit: "Submit Subcontractor Application & Sync to Registry →",
  submitting: "Registering Trade Profile in TAYCO ERP...",
  footer:
    "All subcontractor applications are reviewed within 2–3 business days and synced with TAYCO Module 1 (MOD_CRM_BIDS), Module 2 (MOD_PAYROLL_CREW WH-347) & Module 4 (MOD_TAX_COMPLIANCE 1099-NEC).",
  errorFallback: "Something went wrong. Please try again.",
  fileTypes: "PDF, JPG or PNG — max 10MB",
};

type UploadState = "idle" | "uploading" | "done" | "error";

function FileUploadField({
  label,
  desc,
  extra,
  docType,
  onUploaded,
}: {
  label: string;
  desc: string;
  extra?: React.ReactNode;
  docType: string;
  onUploaded: (url: string) => void;
}) {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("uploading");
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);
    try {
      const res = await fetch("/api/upload-doc", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setState("done");
        onUploaded(data.url);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div
      className="rounded-xl border-2 p-5"
      style={{
        borderColor: state === "done" ? "#16A34A" : "#E2E8F0",
        background: state === "done" ? "#F0FDF4" : "white",
      }}
    >
      <p className="font-semibold text-sm mb-1" style={{ color: "#0F2040" }}>
        {label}
      </p>
      <p className="text-xs text-slate-500 mb-2">{desc}</p>
      {extra}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={handleFile}
      />
      {state === "done" ? (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-green-700 text-sm font-semibold">{COPY.uploaded}</span>
          <span className="text-xs text-slate-400 truncate max-w-[180px]">{fileName}</span>
          <button
            type="button"
            onClick={() => {
              setState("idle");
              setFileName("");
              onUploaded("");
            }}
            className="text-xs text-slate-400 underline ml-auto"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={state === "uploading"}
            className="text-sm font-semibold px-4 py-2 rounded-lg border-2 transition-colors disabled:opacity-50 cursor-pointer"
            style={{ borderColor: "#C9A84C", color: "#0F2040", background: "#FEFCE8" }}
          >
            {state === "uploading" ? COPY.uploading : COPY.uploadBtn}
          </button>
          <span className="text-xs text-slate-400">{COPY.fileTypes}</span>
        </div>
      )}
      {state === "error" && <p className="text-red-500 text-xs mt-1">{COPY.uploadError}</p>}
    </div>
  );
}

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
  const [w9Url, setW9Url] = useState("");
  const [insuranceUrl, setInsuranceUrl] = useState("");
  const [skipDocs, setSkipDocs] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [docsPending, setDocsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
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
      alert(COPY.tradesAlert);
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    const pending = skipDocs || (!w9Url && !insuranceUrl);
    setDocsPending(pending);
    try {
      const res = await fetch("/api/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          trades: selectedTrades.join(", "),
          w9Url,
          insuranceUrl,
          docsPending: pending,
          _loadedAt: loadedAt.current,
        }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || COPY.errorFallback);
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
            <em className="tayco-serif-em">Qualification Portal</em>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
            {COPY.subtitle}
          </p>
          <div className="mt-4 inline-flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-amber-300">
            <span>📞 Milwaukee HQ: (414) 293-8400</span>
            <span>·</span>
            <span>📞 North Dakota Operations: (701) 839-2277</span>
          </div>
        </div>
      </div>

      {/* ── TAKEOFF PRO (:8085) 3-BID LEVELING, WH-347 & 1099-NEC INTEGRATION PANEL ── */}
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div
          data-surface-mode="crystal"
          className="tayco-living-card bg-gradient-to-br from-[#070E1A] via-[#0F2040] to-[#1B3A6B] text-white shadow-2xl p-6 text-white space-y-5"
        >
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="tayco-live-dot" />
                <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                  TAKEOFF PRO (:8085) 3-BID LEVELING · DAVIS-BACON WH-347 · IRS FORM 1099-NEC GATE
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Every pre-qualified subcontractor onboarded on this page participates directly in{" "}
                <strong className="text-amber-300">
                  Takeoff Pro (:8085) 3-Vendor Bid Leveling Matrices (MOD_CRM_BIDS)
                </strong>{" "}
                — calibrated on the{" "}
                <strong className="text-white">
                  $824,875.23 Leveled Bid on Son of a Star Phase 1
                </strong>{" "}
                — passes through the mandatory{" "}
                <strong className="text-emerald-300">
                  W-9 + COI Certificate Holder Gate (TAYCO LLC, 2829 West Wisconsin Ave, Milwaukee, WI 53208)
                </strong>
                , and is automatically synchronized into the Command Center (
                <code className="text-amber-200">/portal</code>) for{" "}
                <strong className="text-white">Davis-Bacon WH-347 (MOD_PAYROLL_CREW)</strong> and{" "}
                <strong className="text-white">IRS Form 1099-NEC (MOD_TAX_COMPLIANCE)</strong>.
              </p>
            </div>
            <Link
              href="/portal?invite=INV-CPA-FINANCE-TAX"
              data-magnetic
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-transform hover:scale-105"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              🏛️ Inspect 3-Bid &amp; Compliance Gate →
            </Link>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-white/10">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-amber-400/30">
              <div className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold">
                MOD_CRM_BIDS · 3-BID LEVELING
              </div>
              <div className="text-base font-black font-mono text-white mt-0.5">
                $824,875.23 Leveled Bid
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Son of a Star 3-Vendor CSI-32 matrix inside Takeoff Pro (:8085)
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-sky-400/30">
              <div className="text-[10px] font-mono uppercase tracking-wider text-sky-300 font-bold">
                MOD_PAYROLL_CREW · WH-347
              </div>
              <div className="text-base font-black font-mono text-white mt-0.5">
                $32.63/hr Loaded Rate
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                U.S. DOL Davis-Bacon WH-347 weekly certified payroll &amp; fringe audit
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-emerald-400/30">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold">
                MOD_TAX_COMPLIANCE · 1099-NEC
              </div>
              <div className="text-base font-black font-mono text-white mt-0.5">
                W-9 + COI Verified Gate
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                TAYCO LLC, 2829 West Wisconsin Ave, Milwaukee, WI 53208 Certificate Holder
              </p>
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
                  href="/vendor-application"
                  className="block mt-3 text-xs font-semibold underline"
                  style={{ color: "#0F2040" }}
                >
                  → Return here to upload W-9 &amp; COI documents
                </Link>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/portal?invite=INV-CPA-FINANCE-TAX"
                data-magnetic
                className="font-bold px-6 py-3 rounded-xl text-xs"
                style={{ background: "#0F2040", color: "#C9A84C" }}
              >
                🏛️ View Subcontractor &amp; 1099-NEC Registry in Command Center →
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
            className="tayco-living-card editorial-ivory-card p-8 space-y-6 bg-white"
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
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.businessName} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                        name="businessName"
                        value={form.businessName}
                        onChange={handleChange}
                        required
                        placeholder="Badger State Mechanical LLC"
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.contactName} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                        name="contactName"
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
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.phone} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        placeholder="(414) 293-8400"
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.email} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
                        name="email"
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
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.licenseNumber}
                      </label>
                      <input
                        name="licenseNumber"
                        value={form.licenseNumber}
                        onChange={handleChange}
                        placeholder={COPY.licenseHint}
                        className="w-full border-2 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none"
                        style={{ borderColor: "#E2E8F0" }}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.yearsInBusiness} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
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
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.crewSize} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <input
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
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: "#0F2040" }}
                      >
                        {COPY.insured} <span style={{ color: "#C9A84C" }}>*</span>
                      </label>
                      <select
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
                    <label
                      className="block text-sm font-semibold mb-1"
                      style={{ color: "#0F2040" }}
                    >
                      {COPY.statesServed} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <select
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
                    <label
                      className="block text-sm font-semibold mb-1"
                      style={{ color: "#0F2040" }}
                    >
                      {COPY.citiesServed} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
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

                {!skipDocs && (
                  <div className="space-y-4">
                    <FileUploadField
                      label={COPY.w9Label}
                      desc={COPY.w9Desc}
                      docType="w9"
                      onUploaded={setW9Url}
                    />

                    <FileUploadField
                      label={COPY.insuranceLabel}
                      desc={COPY.insuranceDesc}
                      docType="insurance"
                      onUploaded={setInsuranceUrl}
                      extra={
                        <div
                          className="rounded-lg px-4 py-3 mb-3 text-xs"
                          style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}
                        >
                          <p className="font-bold mb-1" style={{ color: "#0F2040" }}>
                            Required Certificate Holder Endorsement:
                          </p>
                          <pre
                            className="font-semibold whitespace-pre-wrap"
                            style={{ color: "#1B3A6B", fontFamily: "inherit" }}
                          >
                            {COPY.holderInfo}
                          </pre>
                          <ul className="mt-2 space-y-1 text-slate-600">
                            <li>✔ {COPY.insuranceReq1}</li>
                            <li>✔ {COPY.insuranceReq2}</li>
                            <li>✔ {COPY.insuranceReq3}</li>
                          </ul>
                        </div>
                      }
                    />
                  </div>
                )}

                <label className="flex items-start gap-3 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDocs}
                    onChange={(e) => setSkipDocs(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded accent-yellow-600"
                  />
                  <span className="text-xs text-slate-600">{COPY.skipDocs}</span>
                </label>
              </div>

              {/* Notes */}
              <div>
                <label
                  className="block text-sm font-semibold mb-1"
                  style={{ color: "#0F2040" }}
                >
                  {COPY.notes}
                </label>
                <textarea
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
                <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                  {errorMsg}
                </div>
              )}

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
