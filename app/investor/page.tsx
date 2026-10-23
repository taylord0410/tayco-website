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
  "Iowa (IA)",
  "Indiana (IN)",
  "Minnesota (MN)",
  "Michigan (MI)",
  "Missouri (MO)",
  "Texas (TX)",
  "Other",
];

export default function InvestorPage() {
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
          className="umbra-bento-card p-10 max-w-md w-full text-center"
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
            <strong>Commercial CRM &amp; REIT Turnkey Pipeline</strong>. Our executive team will reach out within{" "}
            <strong>24–48 hours</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/portal?invite=INV-INVESTOR-PORTFOLIO"
              className="inline-block px-5 py-3 rounded-xl font-bold text-xs"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              📊 Open REIT Investor Demo →
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
      className="min-h-screen pt-16"
      style={{
        background:
          "radial-gradient(circle at 20% 0%, rgba(201,168,76,0.12), transparent 50%), linear-gradient(135deg,#070E1A 0%,#0F2040 55%,#142B54 100%)",
      }}
    >
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 pt-10 pb-6 text-center text-white">
        <span className="umbra-eyebrow mb-4">
          <span className="umbra-live-dot" />
          Institutional Real Estate · REITs · Multi-State Asset Managers
        </span>
        <h1 className="text-3xl sm:text-4xl font-black mt-2 mb-3 tracking-tight">
          Partner With TAYCO LLC{" "}
          <em className="umbra-serif-em">Turnkey Capital Programs</em>
        </h1>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
          We deliver cap-ex renovations, commercial tenant improvements, roofing, and certified restoration for institutional investors and property managers across 8 states.
        </p>
      </div>

      {/* Live Command Center Connection Banner */}
      <div className="max-w-3xl mx-auto px-4 mb-6">
        <div
          data-surface-mode="crystal"
          className="umbra-bento-card p-5 text-white flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="preview-orbits" aria-hidden="true" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="umbra-live-dot" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                LIVE COMMAND CENTER CONNECTION · COMMERCIAL CRM &amp; TAKEOFF PRO BRIDGE
              </span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              Submitting this form registers your multi-property portfolio in{" "}
              <strong className="text-white">Module 1 (Commercial CRM &amp; Bid Pipeline)</strong>, links unit-level scopes to{" "}
              <strong className="text-amber-300">Takeoff Pro v5.0</strong>, and provisions{" "}
              <strong className="text-emerald-300">Module 6 (REIT Portfolio IRR &amp; AIA G702/G703 Draw Tracking)</strong>.
            </p>
          </div>
          <Link
            href="/portal?invite=INV-INVESTOR-PORTFOLIO"
            className="relative z-10 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider shrink-0 transition-transform hover:scale-105"
            style={{ background: "#C9A84C", color: "#070E1A" }}
          >
            📊 Launch REIT Board Demo →
          </Link>
        </div>
      </div>

      {/* Stats bar */}
      <div className="max-w-3xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: "2,800+", l: "Projects Completed" },
            { n: "8 States", l: "WI · IL · IA · IN · MN · MI · MO · TX" },
            { n: "29 CSI", l: "Trades & Divisions" },
          ].map((s) => (
            <div
              key={s.l}
              data-surface-mode="crystal"
              className="umbra-bento-card p-4 text-center"
            >
              <p className="text-xl sm:text-2xl font-black font-mono" style={{ color: "#C9A84C" }}>
                {s.n}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div data-surface-mode="mineral" className="umbra-bento-card p-8">
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
                    placeholder="John Smith"
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
                    placeholder="Smith Capital Investments LLC"
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
                    placeholder="john@smithcapital.com"
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
                    placeholder="(414) 000-0000"
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
                States Where You Hold Assets
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
                placeholder="Tell us about your portfolio, typical unit turn / cap-ex budget, draw schedule requirements, or target timelines..."
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
              disabled={status === "sending"}
              className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-60 cursor-pointer"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              {status === "sending"
                ? "Syncing Portfolio to TAYCO Command Center..."
                : "Submit Portfolio Profile — Sync With TAYCO CRM →"}
            </button>

            <p className="text-center text-xs text-slate-500">
              We respond within 24–48 hours. Directly integrated with TAYCO Commercial CRM &amp; REIT Portfolio Portal.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
