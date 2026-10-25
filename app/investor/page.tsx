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
    value: "Plan",
    title: "Define each property’s needs",
    detail: "Share condition, location and the work you want to prioritize.",
    badge: "SCOPE",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F3D37A"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h18M3 18h18M6 3v18M18 3v18" />
        <rect x="9" y="9" width="6" height="6" />
      </svg>
    ),
  },
  {
    value: "Coordinate",
    title: "Bring trades together",
    detail: "Discuss repairs, renovation and turnovers with one team.",
    badge: "DELIVERY",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F3D37A"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3L3 8l9 5 9-5-9-5z" />
        <path d="M3 13l9 5 9-5" />
        <path d="M3 18l9 5 9-5" />
      </svg>
    ),
  },
  {
    value: "Track",
    title: "Keep decisions clear",
    detail: "Agree on scope, milestones and how changes will be reviewed.",
    badge: "COMMUNICATION",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F3D37A"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 6h16M4 12h10M4 18h14" />
        <circle cx="17.5" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    value: "Review",
    title: "Prepare for handover",
    detail: "Identify completion details and the records your project needs.",
    badge: "CLOSEOUT",
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#F3D37A"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 3l8 4v5c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V7l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
];

const MEDALLION_STYLE: React.CSSProperties = {
  background: "rgba(7, 14, 26, 0.65)",
  border: "1px solid rgba(201, 168, 76, 0.42)",
  boxShadow: "inset 0 1px 0 rgba(243, 211, 122, 0.16)",
};

const INPUT_EXECUTIVE_CLASS =
  "w-full rounded-xl px-4 py-3 text-sm bg-[#FAF9F5] text-[#0F2040] placeholder:text-slate-400 border border-[#1B3A6B]/20 shadow-[inset_0_1px_2px_rgba(7,14,26,0.04)] transition-all duration-200 focus:bg-white focus:outline-none focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/35";

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
        style={{ background: "linear-gradient(135deg, #070E1A 0%, #0B172A 48%, #0F2040 100%)" }}
      >
        <div
          data-surface-mode="mineral"
          className="tayco-living-card editorial-ivory-card p-10 max-w-lg w-full text-center"
          style={{
            background: "linear-gradient(160deg, #FFFFFF 0%, #F4F2EA 100%)",
            borderColor: "rgba(201, 168, 76, 0.42)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={MEDALLION_STYLE}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="#F3D37A"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3l8 4v5c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V7l8-4z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.5 12.5l2.5 2.5 4.5-5"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0F2040" }}>
            Property inquiry received
          </h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            Your property inquiry has been saved for review. Keep your reference number below.
            For questions, contact{" "}
            <a
              href={COMPANY.phoneHref}
              className="font-semibold underline"
              style={{ color: "#0F2040" }}
            >
              {COMPANY.phoneDisplay}
            </a>
            . Submitting an inquiry does not create an account or a construction agreement.
          </p>
          <p
            className="text-xs mb-6 px-4 py-3 rounded-xl break-all font-mono"
            style={{
              background: "rgba(15, 32, 64, 0.05)",
              border: "1px solid rgba(201, 168, 76, 0.35)",
              color: "#0F2040",
            }}
            role="status"
          >
            Reference: <strong>{referenceId}</strong>
            <br />
            {notificationStatus === "pending"
              ? "Saved. Team notification is pending; your reference remains valid."
              : "Saved for team review."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              data-magnetic
              className="inline-block px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-md"
              style={{
                background: "linear-gradient(135deg, #E2C675 0%, #C9A84C 100%)",
                color: "#070E1A",
                border: "1px solid rgba(243, 211, 122, 0.6)",
              }}
            >
              Existing client sign in →
            </Link>
            <Link
              href="/"
              className="inline-block px-5 py-3 rounded-xl font-semibold text-white text-xs"
              style={{
                background: "linear-gradient(135deg, #0F2040 0%, #1B3A6B 100%)",
                border: "1px solid rgba(201, 168, 76, 0.35)",
              }}
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
      className="min-h-screen pt-16"
      style={{
        background: `radial-gradient(circle at ${20 + lightAngle * 0.5}% 0%, rgba(201, 168, 76, 0.16), transparent 55%), linear-gradient(${125 + lightAngle * 0.35}deg, #070E1A 0%, #0B172A 32%, #0F2040 68%, #1B3A6B 100%)`,
      }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-6 text-white">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left max-w-3xl">
            <span
              className="tayco-eyebrow mb-4 px-3 py-1 rounded-full"
              style={{
                color: "#F3D37A",
                background: "rgba(7, 14, 26, 0.65)",
                border: "1px solid rgba(201, 168, 76, 0.42)",
              }}
            >
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              PROPERTY OWNERS · INVESTORS · MANAGERS
            </span>
            <h1 className="text-3xl sm:text-5xl font-black mt-2 mb-3 tracking-tight text-white">
              Partner With TAYCO LLC{" "}
              <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
                Property Improvement
              </em>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
              Plan commercial construction, property renovations, tenant improvements, roofing and restoration across{" "}
              <strong className="text-white">{COMPANY.coverage}</strong>.
            </p>
          </div>

          {/* Raking Light Control */}
          <div className="shrink-0 flex flex-col items-center lg:items-end gap-2">
            <div
              className="px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-3 shadow-lg"
              style={{
                background: "rgba(7, 14, 26, 0.72)",
                border: "1px solid rgba(201, 168, 76, 0.42)",
                color: "#F3D37A",
              }}
            >
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={MEDALLION_STYLE}
                aria-hidden="true"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F3D37A"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              </span>
              <span>Raking Light Angle: {lightAngle}°</span>
              <input
                id="investor-raking-light-slider"
                type="range"
                min={0}
                max={90}
                value={lightAngle}
                onChange={(e) => setLightAngle(Number(e.target.value))}
                className="w-28 cursor-pointer"
                style={{ accentColor: "#C9A84C" }}
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
              data-response-kind="surface"
              className="tayco-living-card p-5 text-white flex flex-col justify-between"
            >
              <i className="response-wash" aria-hidden="true" />
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={MEDALLION_STYLE}
                    >
                      {m.icon}
                    </span>
                    <span
                      className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded"
                      style={{
                        background: "rgba(201, 168, 76, 0.14)",
                        color: "#F3D37A",
                        border: "1px solid rgba(201, 168, 76, 0.42)",
                      }}
                    >
                      {m.badge}
                    </span>
                  </div>
                  <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                </div>
                <p
                  className="text-xl sm:text-2xl font-black font-mono tracking-tight"
                  style={{ color: "#F3D37A" }}
                >
                  {m.value}
                </p>
                <p className="text-xs font-bold text-white mt-1">{m.title}</p>
              </div>
              <p
                className="relative z-10 text-[11px] text-slate-300 mt-3 pt-2.5 font-mono leading-relaxed"
                style={{ borderTop: "1px solid rgba(201, 168, 76, 0.2)" }}
              >
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
          data-response-kind="surface"
          className="tayco-living-card bg-gradient-to-br from-[#070E1A] via-[#0F2040] to-[#1B3A6B] text-white shadow-2xl p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
        >
          <i className="response-wash" aria-hidden="true" />
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="relative z-10 flex items-start gap-4 max-w-3xl">
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
              style={MEDALLION_STYLE}
              aria-hidden="true"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F3D37A"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V7l8-4v18" />
                <path d="M19 21V11l-6-4" />
                <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
              </svg>
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                <span
                  className="text-xs font-mono uppercase tracking-wider font-bold"
                  style={{ color: "#F3D37A" }}
                >
                  A PRACTICAL START FOR YOUR PROPERTY PROGRAM
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                Tell us about your properties, repair priorities and target timing.
                Our team will review your request and discuss the next steps with you.
                Existing clients can sign in to their invited project workspace.
              </p>
            </div>
          </div>
          <Link
            href="/login"
            data-magnetic
            className="relative z-10 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-transform hover:scale-105 shadow-md"
            style={{
              background: "linear-gradient(135deg, #E2C675 0%, #C9A84C 100%)",
              color: "#070E1A",
              border: "1px solid rgba(243, 211, 122, 0.6)",
            }}
          >
            Existing client sign in →
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div
          data-surface-mode="mineral"
          className="tayco-living-card editorial-ivory-card p-5 sm:p-8"
          style={{
            background: "linear-gradient(165deg, #FFFFFF 0%, #F4F2EA 100%)",
            borderColor: "rgba(201, 168, 76, 0.42)",
          }}
        >
          <div className="preview-orbits" aria-hidden="true" />
          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-6">
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
              <div className="flex items-center gap-3 pb-2.5 mb-4 border-b border-[#1B3A6B]/12">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={MEDALLION_STYLE}
                  aria-hidden="true"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F3D37A"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <p
                  className="text-xs font-mono font-bold uppercase tracking-widest"
                  style={{ color: "#0F2040" }}
                >
                  01 · Your contact details
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="property-fullName" className="block text-sm font-semibold text-[#0F2040] mb-1.5">
                    Full Name *
                  </label>
                  <input
                    id="property-fullName"
                    name="fullName"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className={INPUT_EXECUTIVE_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="property-company" className="block text-sm font-semibold text-[#0F2040] mb-1.5">
                    Company or organization
                  </label>
                  <input
                    id="property-company"
                    name="company"
                    autoComplete="organization"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Your company or organization"
                    className={INPUT_EXECUTIVE_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="property-email" className="block text-sm font-semibold text-[#0F2040] mb-1.5">
                    Email *
                  </label>
                  <input
                    id="property-email"
                    name="email"
                    autoComplete="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@company.com"
                    className={INPUT_EXECUTIVE_CLASS}
                  />
                </div>
                <div>
                  <label htmlFor="property-phone" className="block text-sm font-semibold text-[#0F2040] mb-1.5">
                    Direct Phone *
                  </label>
                  <input
                    id="property-phone"
                    name="phone"
                    autoComplete="tel"
                    inputMode="tel"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="Your phone number"
                    className={INPUT_EXECUTIVE_CLASS}
                  />
                </div>
              </div>
            </div>

            {/* Preferred Contact */}
            <div>
              <p className="block text-sm font-semibold text-[#0F2040] mb-2">
                Preferred contact method
              </p>
              <div className="flex gap-3 flex-wrap">
                {["Call", "WhatsApp", "Email"].map((opt) => {
                  const active = form.preferredContact === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setForm((p) => ({ ...p, preferredContact: opt }))}
                      className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                        active
                          ? "text-white shadow-sm"
                          : "border-[#1B3A6B]/20 text-[#0F2040] bg-[#FAF9F5] hover:border-[#C9A84C]"
                      }`}
                      style={
                        active
                          ? {
                              background: "linear-gradient(135deg, #0F2040 0%, #1B3A6B 100%)",
                              borderColor: "#C9A84C",
                            }
                          : {}
                      }
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <div className="flex items-center gap-3 pb-2.5 mb-4 border-b border-[#1B3A6B]/12">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={MEDALLION_STYLE}
                  aria-hidden="true"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F3D37A"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 21h18" />
                    <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
                    <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
                  </svg>
                </span>
                <p
                  className="text-xs font-mono font-bold uppercase tracking-widest"
                  style={{ color: "#0F2040" }}
                >
                  02 · Your properties &amp; priorities
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="property-properties" className="block text-sm font-semibold text-[#0F2040] mb-1.5">
                    Properties Under Management
                  </label>
                  <select
                    id="property-properties"
                    name="properties"
                    value={form.properties}
                    onChange={handleChange}
                    className={INPUT_EXECUTIVE_CLASS}
                  >
                    <option value="">Select...</option>
                    <option>1–5 properties</option>
                    <option>6–20 properties</option>
                    <option>20+ properties</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="property-activeProjects" className="block text-sm font-semibold text-[#0F2040] mb-1.5">
                    Are you planning work now?
                  </label>
                  <select
                    id="property-activeProjects"
                    name="activeProjects"
                    value={form.activeProjects}
                    onChange={handleChange}
                    className={INPUT_EXECUTIVE_CLASS}
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
              <p className="block text-sm font-semibold text-[#0F2040] mb-2">
                Where are your properties?
              </p>
              <div className="flex flex-wrap gap-2">
                {STATES_LIST.map((s) => {
                  const selected = form.states
                    .split(",")
                    .map((x) => x.trim())
                    .includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={selected}
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
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selected
                          ? "font-bold shadow-xs"
                          : "border-[#1B3A6B]/20 text-[#0F2040] bg-[#FAF9F5] hover:border-[#C9A84C]"
                      }`}
                      style={
                        selected
                          ? {
                              background: "linear-gradient(135deg, #E2C675 0%, #C9A84C 100%)",
                              color: "#070E1A",
                              borderColor: "rgba(201, 168, 76, 0.85)",
                            }
                          : {}
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Needed */}
            <div>
              <p className="block text-sm font-semibold text-[#0F2040] mb-2">
                What work do you need?{" "}
                <span className="text-slate-500 font-normal">(select all that apply)</span>
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
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        on
                          ? "text-white shadow-xs"
                          : "border-[#1B3A6B]/20 text-[#0F2040] bg-[#FAF9F5] hover:border-[#C9A84C]"
                      }`}
                      style={
                        on
                          ? {
                              background: "linear-gradient(135deg, #0F2040 0%, #1B3A6B 100%)",
                              borderColor: "#C9A84C",
                            }
                          : {}
                      }
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="property-notes" className="block text-sm font-semibold text-[#0F2040] mb-1.5">
                Project details &amp; timing{" "}
                <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                id="property-notes"
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Tell us about the properties, work needed, priorities and target timing. Please do not include financial account details."
                className={`${INPUT_EXECUTIVE_CLASS} resize-none`}
              />
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  background: "rgba(15, 32, 64, 0.06)",
                  border: "1px solid rgba(201, 168, 76, 0.55)",
                  color: "#0F2040",
                }}
              >
                {errorMsg}
              </div>
            )}

            <p className="text-xs text-slate-600">
              We use these details to respond to your inquiry.{" "}
              <Link href="/privacy" className="underline font-semibold" style={{ color: "#0F2040" }}>
                Privacy &amp; data protection
              </Link>
              . Please do not include payment or identity documents.
            </p>
            <button
              type="submit"
              data-magnetic
              disabled={status === "sending"}
              className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-60 cursor-pointer shadow-lg hover:brightness-105"
              style={{
                background: "linear-gradient(135deg, #E2C675 0%, #C9A84C 100%)",
                color: "#070E1A",
                border: "1px solid rgba(243, 211, 122, 0.65)",
                boxShadow: "0 12px 28px -8px rgba(201, 168, 76, 0.45)",
              }}
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
