"use client";
import { useState } from "react";
import Link from "next/link";

const PROJECT_TYPES = [
  "Residential Renovation",
  "Commercial Project",
  "Turnkey / Turnover",
  "Water Damage Restoration",
  "Fire Damage Restoration",
  "REO / Bank-Owned Property",
  "Roofing",
  "Flooring",
  "Other",
];

export default function EstimatePage() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    projectType: "",
    projectLocation: "",
    projectDetails: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ fullName: "", phone: "", email: "", projectType: "", projectLocation: "", projectDetails: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen pt-20" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <div className="py-12" style={{ background: "#0F2040" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>
            Free Estimate
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Request a Free Estimate
          </h1>
          <p className="text-gray-300">
            Fill out the form below and we will get back to you within <strong className="text-white">24 hours.</strong>
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {status === "success" ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border-2" style={{ borderColor: "#16A34A" }}>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>Request Received!</h2>
            <p className="text-gray-500 mb-6">We will contact you within 24 hours to discuss your project.</p>
            <Link href="/" className="text-white font-semibold px-6 py-3 rounded-xl" style={{ background: "#C9A84C" }}>
              Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border-2 p-8 space-y-5" style={{ borderColor: "#E2E8F0" }}>
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                  Full Name <span style={{ color: "#C9A84C" }}>*</span>
                </label>
                <input
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                  placeholder="John Smith"
                  className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                  style={{ borderColor: "#E2E8F0" }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                  Phone Number <span style={{ color: "#C9A84C" }}>*</span>
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
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                Email Address <span style={{ color: "#C9A84C" }}>*</span>
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

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                Project Type <span style={{ color: "#C9A84C" }}>*</span>
              </label>
              <select
                name="projectType"
                value={form.projectType}
                onChange={handleChange}
                required
                className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                style={{ borderColor: "#E2E8F0" }}
              >
                <option value="">Select a project type...</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                Project Location <span style={{ color: "#C9A84C" }}>*</span>
              </label>
              <input
                name="projectLocation"
                value={form.projectLocation}
                onChange={handleChange}
                required
                placeholder="City, State (e.g. Milwaukee, WI)"
                className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none"
                style={{ borderColor: "#E2E8F0" }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                Project Details
              </label>
              <textarea
                name="projectDetails"
                value={form.projectDetails}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your project — scope of work, timeline, any special requirements..."
                className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none"
                style={{ borderColor: "#E2E8F0" }}
              />
            </div>

            {status === "error" && (
              <p className="text-red-500 text-sm text-center">Something went wrong. Please try again or call us directly.</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full text-white font-bold py-3 rounded-xl text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#C9A84C" }}
            >
              {status === "sending" ? "Sending..." : "Send Estimate Request"}
            </button>

            <p className="text-center text-xs text-gray-400">
              We respond within 24 hours. Your information is kept confidential.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
