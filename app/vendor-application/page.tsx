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

const STATES = ["Wisconsin", "Illinois", "Both (WI & IL)"];

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
    website: "", // honeypot — never shown to user
  });
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const loadedAt = useRef<number | null>(null);
  useEffect(() => { loadedAt.current = Date.now(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleTrade(trade: string) {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((t) => t !== trade) : [...prev, trade]
    );
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTrades.length === 0) {
      alert("Please select at least one trade.");
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, trades: selectedTrades.join(", "), _loadedAt: loadedAt.current }),
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

  return (
    <main className="min-h-screen pt-20" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <div className="py-12" style={{ background: "#0F2040" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>
            Join Our Team
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Vendor / Subcontractor Application
          </h1>
          <p className="text-gray-300">
            We are always looking for qualified trades to join our network in Wisconsin and Illinois.
            Fill out the form below and our team will review your application.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {status === "success" ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border-2" style={{ borderColor: "#16A34A" }}>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>Application Submitted!</h2>
            <p className="text-gray-500 mb-6">
              Thank you for applying. Our team will review your application and contact you within 2-3 business days.
            </p>
            <Link href="/" className="text-white font-semibold px-6 py-3 rounded-xl" style={{ background: "#C9A84C" }}>
              Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border-2 p-8 space-y-6" style={{ borderColor: "#E2E8F0" }}>
            {/* Honeypot field — hidden from real users, catches bots */}
            <div style={{ display: "none" }} aria-hidden="true">
              <input name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
            </div>
            {/* Business Info */}
            <div>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>
                Business Information
              </h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      Business Name <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="businessName"
                      value={form.businessName}
                      onChange={handleChange}
                      required
                      placeholder="Your Company LLC"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      Contact Name <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="contactName"
                      value={form.contactName}
                      onChange={handleChange}
                      required
                      placeholder="John Smith"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      Phone <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="(414) 000-0000"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      Email <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@email.com"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      License Number
                    </label>
                    <input
                      name="licenseNumber"
                      value={form.licenseNumber}
                      onChange={handleChange}
                      placeholder="State license # (if applicable)"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      Years in Business <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="yearsInBusiness"
                      value={form.yearsInBusiness}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 5"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      Crew Size <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="crewSize"
                      value={form.crewSize}
                      onChange={handleChange}
                      required
                      placeholder="e.g. 4 people"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      Insured? <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <select
                      name="insured"
                      value={form.insured}
                      onChange={handleChange}
                      required
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                      style={{ borderColor: "#E2E8F0" }}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes — I have liability insurance</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Area */}
            <div>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>
                Service Area
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                    States You Serve <span style={{ color: "#C9A84C" }}>*</span>
                  </label>
                  <select
                    name="stateServed"
                    value={form.stateServed}
                    onChange={handleChange}
                    required
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    <option value="">Select...</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                    Cities / Areas You Cover <span style={{ color: "#C9A84C" }}>*</span>
                  </label>
                  <input
                    name="citiesServed"
                    value={form.citiesServed}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Milwaukee, Kenosha, Racine"
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>
              </div>
            </div>

            {/* Trades */}
            <div>
              <h2 className="text-lg font-bold mb-2 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>
                Trades / Services Offered <span className="text-sm font-normal text-gray-400">(select all that apply)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {TRADES.map((trade) => (
                  <button
                    key={trade}
                    type="button"
                    onClick={() => toggleTrade(trade)}
                    className="text-left text-xs px-3 py-2 rounded-lg border-2 font-medium transition-colors"
                    style={{
                      borderColor: selectedTrades.includes(trade) ? "#C9A84C" : "#E2E8F0",
                      background: selectedTrades.includes(trade) ? "#FFF7ED" : "white",
                      color: selectedTrades.includes(trade) ? "#C9A84C" : "#374151",
                    }}
                  >
                    {selectedTrades.includes(trade) ? "✔ " : ""}{trade}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional information about your business, certifications, equipment, etc."
                className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none"
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
              disabled={status === "sending"}
              className="w-full text-white font-bold py-3 rounded-xl text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#C9A84C" }}
            >
              {status === "sending" ? "Submitting..." : "Submit Application"}
            </button>

            <p className="text-center text-xs text-gray-400">
              We review all applications and respond within 2-3 business days.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
