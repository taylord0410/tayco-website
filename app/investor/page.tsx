"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const WORK_TYPES = [
  "Roofing", "Water Damage Restoration", "Fire Damage Restoration",
  "General Repairs", "Full Rehab", "Siding", "Gutters", "Windows & Doors", "Other",
];

const STATES_LIST = [
  "Wisconsin (WI)", "Illinois (IL)", "Iowa (IA)", "Indiana (IN)",
  "Minnesota (MN)", "Michigan (MI)", "Missouri (MO)", "Texas (TX)", "Other",
];

export default function InvestorPage() {
  const [form, setForm] = useState({
    fullName: "", company: "", email: "", phone: "",
    preferredContact: "", properties: "", states: "",
    activeProjects: "", notes: "", website: "",
  });
  const [selectedWork, setSelectedWork] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const loadedAt = useRef<number | null>(null);
  useEffect(() => { loadedAt.current = Date.now(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleWork(w: string) {
    setSelectedWork(prev => prev.includes(w) ? prev.filter(x => x !== w) : [...prev, w]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedWork.length === 0) { alert("Please select at least one type of work."); return; }
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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg,#0F2040 0%,#1a3560 100%)" }}>
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#C9A84C" }}>
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: "#0F2040" }}>Thank you!</h2>
          <p className="text-gray-600 mb-6">We received your information. Our team will reach out within <strong>24–48 hours</strong> to discuss how we can work together.</p>
          <Link href="/" className="inline-block px-6 py-3 rounded-xl font-semibold text-white text-sm" style={{ background: "#0F2040" }}>
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg,#0F2040 0%,#1a3560 100%)" }}>
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-10 pb-6 text-center text-white">
        <span className="inline-block px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-widest mb-4" style={{ background: "#C9A84C", color: "#0F2040" }}>
          Partner With Us
        </span>
        <h1 className="text-3xl font-bold mb-3">Work With TAYCO LLC</h1>
        <p className="text-blue-200 text-base">
          We provide roofing, restoration, and construction services for real estate investors and property managers across 8 states. Let's build a long-term partnership.
        </p>
      </div>

      {/* Stats bar */}
      <div className="max-w-2xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { n: "2,800+", l: "Projects Completed" },
            { n: "8", l: "States Served" },
            { n: "12+", l: "Trades In-House" },
          ].map(s => (
            <div key={s.l} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.08)" }}>
              <p className="text-2xl font-bold" style={{ color: "#C9A84C" }}>{s.n}</p>
              <p className="text-xs text-blue-200 mt-1">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Honeypot */}
            <input type="text" name="website" value={form.website} onChange={handleChange} className="hidden" tabIndex={-1} autoComplete="off" />

            {/* Contact Info */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Your Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} required
                    placeholder="John Smith"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ "--tw-ring-color": "#C9A84C" } as React.CSSProperties} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Company / LLC</label>
                  <input name="company" value={form.company} onChange={handleChange}
                    placeholder="Smith Investments LLC"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required
                    placeholder="john@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} required
                    placeholder="(414) 000-0000"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2" />
                </div>
              </div>
            </div>

            {/* Preferred Contact */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred way to contact you</label>
              <div className="flex gap-3 flex-wrap">
                {["Call", "WhatsApp", "Email"].map(opt => (
                  <button key={opt} type="button"
                    onClick={() => setForm(p => ({ ...p, preferredContact: opt }))}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${form.preferredContact === opt ? "text-white border-transparent" : "border-gray-200 text-gray-600"}`}
                    style={form.preferredContact === opt ? { background: "#0F2040" } : {}}>
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Your Portfolio</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Properties you manage</label>
                  <select name="properties" value={form.properties} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white">
                    <option value="">Select...</option>
                    <option>1–5 properties</option>
                    <option>6–20 properties</option>
                    <option>20+ properties</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Active projects right now?</label>
                  <select name="activeProjects" value={form.activeProjects} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">States where you have properties</label>
              <div className="flex flex-wrap gap-2">
                {STATES_LIST.map(s => (
                  <button key={s} type="button"
                    onClick={() => {
                      const current = form.states.split(",").map(x => x.trim()).filter(Boolean);
                      const updated = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                      setForm(p => ({ ...p, states: updated.join(", ") }));
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${form.states.includes(s) ? "text-white border-transparent" : "border-gray-200 text-gray-600"}`}
                    style={form.states.includes(s) ? { background: "#C9A84C", color: "#0F2040" } : {}}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Work Needed */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">What type of work do you need? <span className="text-gray-400 font-normal">(select all that apply)</span></label>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map(w => {
                  const on = selectedWork.includes(w);
                  return (
                    <button key={w} type="button" onClick={() => toggleWork(w)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${on ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                      style={on ? { background: "#0F2040" } : {}}>
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Anything else we should know? <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                placeholder="Tell us about your portfolio, typical project size, timelines, etc."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none" />
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">{errorMsg}</div>
            )}

            <button type="submit" disabled={status === "sending"}
              className="w-full py-4 rounded-xl font-bold text-white text-base transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#C9A84C,#b8913e)" }}>
              {status === "sending" ? "Sending..." : "Submit — Let's Work Together"}
            </button>

            <p className="text-center text-xs text-gray-400">We respond within 24–48 hours. No spam, no pressure.</p>
          </form>
        </div>
      </div>
    </div>
  );
}
