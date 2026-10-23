"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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
  "North Dakota (ND)",
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
    value: "$5,884,717.73",
    title: "Active Multi-State Commercial & REIT Pipeline",
    detail: "5 Active Turnkey Contracts Across WI · IL · ND · MN · TX",
    badge: "MOD_CRM_BIDS",
  },
  {
    value: "1.04 CPI / 0.98 SPI",
    title: "Earned Value Performance",
    detail: "Audited across 24-Week S-Curve in Takeoff Pro (:8085)",
    badge: "EVM S-CURVE",
  },
  {
    value: "$184,892.70",
    title: "Current Net AIA G702 Pay App #3",
    detail: "$51,501.13 10% Statutory Retainage in Escrow",
    badge: "AIA G702/G703",
  },
  {
    value: "7/7 GO FOR BID",
    title: "Aerospace Pre-Flight Gate",
    detail: "369 SHA-256 Audited BOQ Line Items in Takeoff Pro v5.0",
    badge: "SHA-256 BOQ",
  },
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
      alert("Please select at least one type of work.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/investor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          workNeeded: selectedWork.join(", "),
          _loadedAt: loadedAt.current,
        }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || "Something went wrong. Please try again.");
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
            Portfolio Inquiry Registered!
          </h2>
          <p className="text-slate-600 mb-6 text-sm">
            We received your institutional portfolio profile and synced it with our{" "}
            <strong>Commercial CRM &amp; REIT Turnkey Pipeline (MOD_INVESTOR_PORTAL)</strong>. Our executive capital team at{" "}
            <strong>(414) 293-8400</strong> (Milwaukee HQ) &amp;{" "}
            <strong>(701) 839-2277</strong> (North Dakota Operations) will reach out within{" "}
            <strong>24–48 hours</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/portal?invite=INV-INVESTOR-PORTFOLIO"
              data-magnetic
              className="inline-block px-5 py-3 rounded-xl font-bold text-xs"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              📊 Open Institutional Investor &amp; Lender Dossier in Command Center →
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
              Institutional Real Estate · REITs · 9-State Capital &amp; Asset Managers
            </span>
            <h1 className="text-3xl sm:text-5xl font-black mt-2 mb-3 tracking-tight">
              Partner With TAYCO LLC{" "}
              <em className="tayco-serif-em">Turnkey Capital Programs</em>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              We deliver ground-up commercial builds, cap-ex renovations, tenant improvements, roofing, and certified restoration for institutional investors, REIT boards, and lenders across all{" "}
              <strong className="text-white">
                9 States (WI · IL · IA · IN · MN · MI · MO · TX · ND)
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
              📞 (414) 293-8400 Milwaukee HQ · 📞 (701) 839-2277 North Dakota Ops
            </span>
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE RIBBON OF REAL PORTFOLIO & TAKEOFF PRO (:8085) METRICS ── */}
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

      {/* ── DIRECT CONNECTION WITH MODULE 5 (MOD_INVESTOR_PORTAL) + TAKEOFF PRO MASTER DOSSIER ── */}
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
                DIRECT MODULE 5 (MOD_INVESTOR_PORTAL) &amp; TAKEOFF PRO (:8085) MASTER DOSSIER CONNECTION
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              Submitting this institutional profile registers your multi-property portfolio in{" "}
              <strong className="text-white">Module 1 (MOD_CRM_BIDS)</strong>, links unit-level CSI-32 scopes to{" "}
              <strong className="text-amber-300">Takeoff Pro v5.0 (:8085)</strong>, and provisions{" "}
              <strong className="text-emerald-300">
                Module 5 (MOD_INVESTOR_PORTAL — REIT Portfolio IRR, AIA G702/G703 Draw Schedules &amp; 14-Document Master Dossier)
              </strong>
              .
            </p>
          </div>
          <Link
            href="/portal?invite=INV-INVESTOR-PORTFOLIO"
            data-magnetic
            className="relative z-10 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-transform hover:scale-105"
            style={{ background: "#C9A84C", color: "#070E1A" }}
          >
            📊 Open Institutional Investor &amp; Lender Dossier in Command Center →
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div
          data-surface-mode="mineral"
          className="tayco-living-card editorial-ivory-card p-8 bg-white"
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
                01 · Institutional &amp; Executive Contact Information
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Full Name *
                  </label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Victoria Sterling"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Company / REIT / Fund Name
                  </label>
                  <input
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Midwest Institutional Capital REIT"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Executive Email *
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="vsterling@midwestreit.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Direct Phone *
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    required
                    placeholder="(414) 293-8400"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2"
                  />
                </div>
              </div>
            </div>

            {/* Preferred Contact */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Preferred Executive Communication Channel
              </label>
              <div className="flex gap-3 flex-wrap">
                {["Call", "WhatsApp", "Email"].map((opt) => (
                  <button
                    key={opt}
                    type="button"
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
                02 · Asset Portfolio &amp; Capital Deployment Velocity
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Properties Under Management
                  </label>
                  <select
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
                  <label className="block text-sm font-semibold text-slate-800 mb-1">
                    Active Cap-Ex / Rehab Projects Right Now?
                  </label>
                  <select
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
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                States Where You Hold Assets (All 9 TAYCO States Available)
              </label>
              <div className="flex flex-wrap gap-2">
                {STATES_LIST.map((s) => (
                  <button
                    key={s}
                    type="button"
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
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Construction &amp; Restoration Scopes Required{" "}
                <span className="text-slate-400 font-normal">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((w) => {
                  const on = selectedWork.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
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
              <label className="block text-sm font-semibold text-slate-800 mb-1">
                Portfolio Scope Notes &amp; Target Timelines{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Tell us about your portfolio, typical unit turn / cap-ex budget, AIA G702/G703 draw schedule requirements, or target timelines..."
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 resize-none"
              />
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              data-magnetic
              disabled={status === "sending"}
              className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-60 cursor-pointer"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              {status === "sending"
                ? "Syncing Portfolio to TAYCO Command Center..."
                : "Submit Portfolio Profile — Sync With TAYCO CRM →"}
            </button>

            <p className="text-center text-xs text-slate-500">
              We respond within 24–48 hours. Directly integrated with TAYCO Module 5 (MOD_INVESTOR_PORTAL) &amp; Takeoff Pro v5.0 (:8085).
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
