"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/company";

const WORK_TYPES = [
  "Roofing",
  "Water Damage Restoration",
  "Fire Damage Restoration",
  "General Repairs",
  "Full Rehab",
  "Siding",
  "Gutters",
  "Windows & Doors",
  "Other",
];

const STATES_LIST = [
  "Wisconsin (WI)",
  "Illinois (IL)",
  "Iowa (IA)",
  "Indiana (IN)",
  "Minnesota (MN)",
  "Michigan (MI)",
  "Missouri (MO)",
  "Texas (TX)",
  "Other",
];

const PORTFOLIO_METRICS = [
  {
    "value": "Plan",
    "title": "Define each property’s needs",
    "detail": "Share condition, location and the work you want to prioritize.",
    "badge": "SCOPE"
  },
  {
    "value": "Coordinate",
    "title": "Bring trades together",
    "detail": "Discuss repairs, renovation and turnovers with one team.",
    "badge": "DELIVERY"
  },
  {
    "value": "Track",
    "title": "Keep decisions clear",
    "detail": "Agree on scope, milestones and how changes will be reviewed.",
    "badge": "COMMUNICATION"
  },
  {
    "value": "Review",
    "title": "Prepare for handover",
    "detail": "Identify completion details and the records your project needs.",
    "badge": "CLOSEOUT"
  }
];

export default function InvestorPage() {
  const [lightAngle, setLightAngle] = useState(38);
  const [form, setForm] = useState({
    fullName: "",
    company: "",
    email: "",
    phone: "",
    preferredContact: "",
    properties: "",
    states: "",
    activeProjects: "",
    notes: "",
    website: "",
  });
  const [selectedWork, setSelectedWork] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
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

  function toggleWork(w: string) {
    setSelectedWork((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedWork.length === 0) {
      setErrorMsg("Please select at least one type of work.");
      return;
    }
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const payload = JSON.stringify({ ...form, workNeeded: selectedWork.join(", "), _loadedAt: loadedAt.current });
      if (requestRef.current?.payload !== payload) requestRef.current = { key: crypto.randomUUID(), payload };
      const res = await fetch("/api/investor", {
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
        setErrorMsg(data.error || data.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 pt-16"
        style={{ background: "linear-gradient(135deg,#070E1A 0%,#0F2040 100%)" }}
      >
        <div
          data-surface-mode="mineral"
          className="tayco-living-card editorial-ivory-card p-10 max-w-lg w-full text-center bg-white"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: "#C9A84C" }}
          >
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0F2040" }}>
            Property inquiry received
          </h2>
          <p className="text-slate-600 mb-6 text-sm">
            Your property inquiry has been saved for review. Keep your reference number below.
            For questions, contact <a href={COMPANY.phoneHref} className="font-semibold underline">{COMPANY.phoneDisplay}</a>.
            Submitting an inquiry does not create an account or a construction agreement.
          </p>
          <p className="text-xs text-slate-600 mb-5 break-all" role="status">Reference: <strong>{referenceId}</strong><br />{notificationStatus === "pending" ? "Saved. Team notification is pending; your reference remains valid." : "Saved for team review."}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              data-magnetic
              className="inline-block px-5 py-3 rounded-xl font-bold text-xs"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              Existing client sign in →
            </Link>
            <Link
              href="/"
              className="inline-block px-5 py-3 rounded-xl font-semibold text-white text-xs"
              style={{ background: "#0F2040" }}
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pt-16 "
      style={{
        background: `radial-gradient(circle at ${20 + lightAngle * 0.5}% 0%, rgba(201,168,76,0.16), transparent 55%), linear-gradient(${125 + lightAngle * 0.35}deg,#070E1A 0%,#0F2040 55%,#142B54 100%)`,
      }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-6 text-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left max-w-3xl">
            <span className="tayco-eyebrow mb-4">
              <span className="tayco-live-dot" />
              PROPERTY OWNERS · INVESTORS · MANAGERS
            </span>
            <h1 className="text-3xl sm:text-5xl font-black mt-2 mb-3 tracking-tight">
              Partner With TAYCO LLC{" "}
              <em className="tayco-serif-em">Property Improvement</em>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              Plan commercial construction, property renovations, tenant improvements, roofing and restoration across{" "}
              <strong className="text-white">
                {COMPANY.coverage}
              </strong>
              .
            </p>
          </div>

          {/* Raking Light Control */}
          <div className="shrink-0 flex flex-col items-center lg:items-end gap-2">
            <div className="px-4 py-2.5 rounded-xl bg-slate-950/70 border border-amber-400/40 text-xs font-mono text-amber-200 flex items-center gap-3">
              <span>☀️ Raking Light Angle: {lightAngle}°</span>
              <input
                id="investor-raking-light-slider"
                type="range"
                min={0}
                max={90}
                value={lightAngle}
                onChange={(e) => setLightAngle(Number(e.target.value))}
                className="w-28 accent-amber-400 cursor-pointer"
                aria-label="Raking Light Angle"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-300">
              {COMPANY.phoneDisplay}
            </span>
          </div>
        </div>
      </div>

      {/* Project services and resources */}
      <div className="max-w-6xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PORTFOLIO_METRICS.map((m) => (
            <div
              key={m.value}
              data-surface-mode="crystal"
              className="tayco-living-card p-5 text-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/35">
                    {m.badge}
                  </span>
                  <span className="tayco-live-dot" />
                </div>
                <p
                  className="text-xl sm:text-2xl font-black font-mono tracking-tight"
                  style={{ color: "#C9A84C" }}
                >
                  {m.value}
                </p>
                <p className="text-xs font-bold text-white mt-1">{m.title}</p>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 pt-2 border-t border-white/10 font-mono">
                {m.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Project services and resources */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <div
          data-surface-mode="crystal"
          className="tayco-living-card bg-gradient-to-br from-[#070E1A] via-[#0F2040] to-[#1B3A6B] text-white shadow-2xl p-6 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
        >
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="relative z-10 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="tayco-live-dot" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                A PRACTICAL START FOR YOUR PROPERTY PROGRAM
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Tell us about your properties, repair priorities and target timing.
              Our team will review your request and discuss the next steps with you.
              Existing clients can sign in to their invited project workspace.
            </p>
          </div>
          <Link
            href="/login"
            data-magnetic
            className="relative z-10 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-transform hover:scale-105"
            style={{ background: "#C9A84C", color: "#070E1A" }}
          >
            Existing client sign in →
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div
          data-surface-mode="mineral"
          className="tayco-living-card editorial-ivory-card p-5 sm:p-8 bg-white"
        >
          <div className="preview-orbits" aria-hidden="true" />
          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-5">
            {/* Honeypot */}
            <input
              type="text"
              name="website"
              value={form.website}
              onChange={handleChange}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            {/* Contact Info */}
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-700 mb-3">
                01 · Your contact details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="property-fullName" className="block text-sm font-semibold text-slate-800 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="property-fullName"
                    name="fullName" autoComplete="name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label htmlFor="property-company" className="block text-sm font-semibold text-slate-800 mb-1">
                    Company or organization
                  </label>
                  <input
                    id="property-company"
                    name="company" autoComplete="organization"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Your company or organization"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label htmlFor="property-email" className="block text-sm font-semibold text-slate-800 mb-1">
                    Email *
                  </label>
                  <input
                    id="property-email"
                    name="email" autoComplete="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@company.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label htmlFor="property-phone" className="block text-sm font-semibold text-slate-800 mb-1">
                    Direct Phone *
                  </label>
                  <input
                    id="property-phone"
                    name="phone" autoComplete="tel" inputMode="tel"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="Your phone number"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Contact */}
            <div>
              <p className="block text-sm font-semibold text-slate-800 mb-2">
                Preferred contact method
              </p>
              <div className="flex gap-3 flex-wrap">
                {["Call", "WhatsApp", "Email"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={form.preferredContact === opt}
                    onClick={() => setForm((p) => ({ ...p, preferredContact: opt }))}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer ${
                      form.preferredContact === opt
                        ? "text-white border-transparent"
                        : "border-slate-200 text-slate-700 bg-white"
                    }`}
                    style={form.preferredContact === opt ? { background: "#0F2040" } : {}}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-amber-700 mb-3">
                02 · Your properties &amp; priorities
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="property-properties" className="block text-sm font-semibold text-slate-800 mb-1">
                    Properties Under Management
                  </label>
                  <select
                    id="property-properties"
                    name="properties"
                    value={form.properties}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
                  >
                    <option value="">Select...</option>
                    <option>1–5 properties</option>
                    <option>6–20 properties</option>
                    <option>20+ properties</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="property-activeProjects" className="block text-sm font-semibold text-slate-800 mb-1">
                    Are you planning work now?
                  </label>
                  <select
                    id="property-activeProjects"
                    name="activeProjects"
                    value={form.activeProjects}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
                  >
                    <option value="">Select...</option>
                    <option>Yes, right now</option>
                    <option>Coming soon</option>
                    <option>Not yet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* States */}
            <div>
              <p className="block text-sm font-semibold text-slate-800 mb-2">
                Where are your properties?
              </p>
              <div className="flex flex-wrap gap-2">
                {STATES_LIST.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={form.states.split(",").map(x => x.trim()).includes(s)}
                    onClick={() => {
                      const current = form.states
                        .split(",")
                        .map((x) => x.trim())
                        .filter(Boolean);
                      const updated = current.includes(s)
                        ? current.filter((x) => x !== s)
                        : [...current, s];
                      setForm((p) => ({ ...p, states: updated.join(", ") }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all cursor-pointer ${
                      form.states.includes(s)
                        ? "border-transparent"
                        : "border-slate-200 text-slate-700 bg-white"
                    }`}
                    style={
                      form.states.includes(s)
                        ? { background: "#C9A84C", color: "#070E1A" }
                        : {}
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Needed */}
            <div>
              <p className="block text-sm font-semibold text-slate-800 mb-2">
                What work do you need?{" "}
                <span className="text-slate-400 font-normal">(select all that apply)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((w) => {
                  const on = selectedWork.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleWork(w)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer ${
                        on
                          ? "text-white border-transparent"
                          : "border-slate-200 text-slate-700 bg-white hover:border-slate-300"
                      }`}
                      style={on ? { background: "#0F2040" } : {}}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="property-notes" className="block text-sm font-semibold text-slate-800 mb-1">
                Project details &amp; timing{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                    id="property-notes"
                    name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Tell us about the properties, work needed, priorities and target timing. Please do not include financial account details."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 resize-none"
              />
            </div>

            {errorMsg && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            <p className="text-xs text-slate-600">We use these details to respond to your inquiry. <Link href="/privacy" className="underline">Privacy &amp; data protection</Link>. Please do not include payment or identity documents.</p>
            <button
              type="submit"
              data-magnetic
              disabled={status === "sending"}
              className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-60 cursor-pointer"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              {status === "sending"
                ? "Sending your inquiry..."
                : "Send property inquiry →"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Your inquiry is reviewed by our team. We will contact you using the details you provide.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
