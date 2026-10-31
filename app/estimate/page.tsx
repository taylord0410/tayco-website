"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EstimateReferencePanel, useEstimateReferences, removeSubmittedReferences } from "@/components/EstimateReferences";
import { COMPANY } from "@/lib/company";

const PROJECT_TYPES = [
  "Commercial Project",
  "Commercial Tenant Improvement (TI)",
  "Residential Renovation",
  "Turnkey / Turnover",
  "Water Damage Restoration",
  "Fire Damage Restoration",
  "REO / Bank-Owned Property",
  "Roofing",
  "Flooring",
  "Other",
];

/** Query context is reviewed explicitly; it never overwrites a visitor's draft. */
function RequestedService({ onApply }: { onApply: (description: string, projectType: string) => void }) {
  const searchParams = useSearchParams();
  const trade = (searchParams.get("trade") || "").trim().slice(0, 120);
  const division = searchParams.get("division") === "residential" ? "Residential" : "";
  const rawSector = searchParams.get("sector");
  const sector = rawSector === "residential" ? "Residential" : rawSector === "multifamily" ? "Multifamily" : rawSector === "commercial" ? "Commercial" : "";
  if (!trade && !division && !sector) return null;
  const description = [trade, division || sector].filter(Boolean).join(" · ");
  const projectType = division === "Residential" || sector === "Residential" ? "Residential Renovation" : sector === "Commercial" ? "Commercial Project" : "";
  return <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-slate-700">
    <p className="font-semibold text-[#0F2040]">Your selected service: {description}</p>
    <p className="text-xs mt-1">Review the selection, then add it to your request. Your existing notes and project choice are kept.</p>
    <button type="button" onClick={() => onApply(`Service requested: ${description}.`, projectType)} className="mt-3 px-4 py-2.5 rounded-lg text-xs font-bold bg-[#0F2040] text-white">Use selected service in my request →</button>
  </aside>;
}

export default function EstimatePage() {
  const [lightAngle, setLightAngle] = useState(42);
  const selectedImages = useEstimateReferences();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    projectType: "",
    projectLocation: "",
    projectDetails: "",
    website: "", // honeypot
  });
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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const payload = JSON.stringify({ ...form, referenceImageIds: selectedImages.map(image => image.id), _loadedAt: loadedAt.current });
      if (requestRef.current?.payload !== payload) requestRef.current = { key: crypto.randomUUID(), payload };
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": requestRef.current.key },
        body: payload,
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.success || !data.referenceId) throw new Error("Receipt unavailable");
        setReferenceId(data.referenceId);
        setNotificationStatus(data.notificationStatus || "pending");
        requestRef.current = null;
        removeSubmittedReferences(selectedImages.map(image => image.id));
        setStatus("success");
        setForm({
          fullName: "",
          phone: "",
          email: "",
          projectType: "",
          projectLocation: "",
          projectDetails: "",
          website: "",
        });
      } else {
        const data = await res.json().catch(() => ({}));
        if(data.code === "automation_verification") window.dispatchEvent(new Event("tayco-guard-update"));
        setErrorMsg(data.error || data.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main
      className="min-h-screen pt-16 section-editorial-ivory"
      style={
        {
          "--light-angle": `${lightAngle}deg`,
          background: "#F7F6F1",
        } as React.CSSProperties
      }
    >
      {/* Project services and resources */}
      <div
        className="py-12 border-b  relative overflow-hidden"
        style={{
          background: `linear-gradient(${115 + lightAngle * 0.45}deg, #070E1A 0%, #0F2040 55%, #1B3A6B 100%)`,
          borderColor: "rgba(201,168,76,0.38)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-3xl">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 mb-3">
                <span className="tayco-eyebrow">
                  <span className="tayco-live-dot" />
                  BUILD · RENOVATE · RESTORE
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/35">
                  FREE ESTIMATE REQUEST
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white mt-2 mb-3 tracking-tight">
                Let’s plan your{" "}
                <em className="tayco-serif-em">next project.</em>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Tell us what you want to build, renovate or restore. Share the location,
                scope and priorities so our team can review your request.
                Serving <strong className="text-white">{COMPANY.coverage}</strong>.
              </p>

              {/* Raking Light Interactive Control */}
              <div className="mt-5 inline-flex flex-wrap items-center gap-3 px-4 py-2 rounded-xl bg-slate-950/65 border border-amber-400/35 text-xs font-mono text-amber-200">
                <span>☀️ Raking Light Angle: {lightAngle}°</span>
                <input
                  id="estimate-raking-light-slider"
                  type="range"
                  min={0}
                  max={90}
                  value={lightAngle}
                  onChange={(e) => setLightAngle(Number(e.target.value))}
                  className="w-28 accent-amber-400 cursor-pointer"
                  aria-label="Raking Light Angle"
                />
                <span className="text-[11px] text-slate-400">
                  {COMPANY.phoneDisplay}
                </span>
              </div>
            </div>

            {/* Rotating Orbital Seal */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-36 h-36 flex items-center justify-center rounded-full border border-amber-400/40 bg-slate-950/60 shadow-2xl">
                <svg
                  viewBox="0 0 160 160"
                  className="w-32 h-32 orbital-caption"
                  aria-label="TAYCO construction seal"
                >
                  <defs>
                    <path
                      id="estimateOrbitalPath"
                      d="M 80, 80 m -60, 0 a 60,60 0 1,1 120,0 a 60,60 0 1,1 -120,0"
                    />
                  </defs>
                  <text
                    fill="#F3D37A"
                    fontSize="9.2"
                    fontWeight="700"
                    letterSpacing="2.1"
                  >
                    <textPath href="#estimateOrbitalPath">
                      • TAYCO LLC • CONSTRUCTION • RENOVATION •
                    </textPath>
                  </text>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                    Project
                  </span>
                  <span className="text-sm font-black text-white font-mono">
                    TAYCO
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300">
                    Your next step
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editorial Ticker */}
      <div className="tayco-telemetry-ribbon bg-slate-950 text-amber-300/90 text-[11px] font-mono py-2 px-4 border-b border-amber-400/25">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            Commercial construction · Residential renovations · Property restoration
          </span>
          <span>
            Clear scope · Coordinated trades · Thoughtful finishes
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div data-surface-mode="crystal" className="tayco-living-card bg-gradient-to-br from-[#070E1A] via-[#0F2040] to-[#1B3A6B] text-white shadow-xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div><p className="tayco-eyebrow text-amber-300 mb-2">Start with what you know</p><p className="text-sm text-slate-200 max-w-3xl">Have drawings, photos or a target timeline? Describe them below. A written proposal follows a review of your scope, conditions, selections and scheduling.</p></div>
          <a href={COMPANY.phoneHref} className="shrink-0 px-5 py-3 rounded-xl bg-[#C9A84C] text-[#070E1A] text-sm font-bold">{COMPANY.phoneDisplay}</a>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* ── ESTIMATE REQUEST FORM ── */}
        <div className="w-full">
          {status === "success" ? (
            <div
              data-surface-mode="mineral"
              className="tayco-living-card editorial-ivory-card text-center py-14 px-6 bg-white"
            >
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>
                Estimate request received
              </h2>
              <p className="text-slate-600 mb-3 max-w-xl mx-auto">
                Your request has been saved for team review. Keep the reference below.
                For questions, call <a href={COMPANY.phoneHref} className="font-semibold underline">{COMPANY.phoneDisplay}</a>.
                A project estimate is confirmed only after a scope review.
              </p>
              {referenceId && (
                <div className="mb-6">
                  <p className="text-xs font-mono text-emerald-800 bg-emerald-50 inline-block px-4 py-1.5 rounded-full border border-emerald-300 font-bold">
                    Request reference: {referenceId}
                  </p>
                </div>
              )}
              <p className="text-xs text-slate-600 mb-5" role="status">{notificationStatus === "pending" ? "Saved. Team notification is pending; your reference remains valid." : "Saved for team review."}</p>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Link
                  href="/login"
                  data-magnetic
                  className="text-xs sm:text-sm font-bold px-5 py-3 rounded-xl"
                  style={{ background: "#0F2040", color: "#C9A84C" }}
                >
                  Existing client sign in →
                </Link>
                <Link
                  href="/login"
                  data-magnetic
                  className="text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  Team &amp; partner sign in →
                </Link>
                <Link
                  href="/"
                  className="text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              data-surface-mode="mineral"
              className="estimate-request-form tayco-living-card editorial-ivory-card p-5 sm:p-8 space-y-5 bg-white"
            >
              <div className="preview-orbits" aria-hidden="true" />
              <div className="relative z-10 space-y-5">
                <Suspense fallback={null}>
                  <RequestedService onApply={(description, projectType) => setForm(prev => ({ ...prev, projectType: prev.projectType || projectType, projectDetails: prev.projectDetails.includes(description) ? prev.projectDetails : [prev.projectDetails.trim(), description].filter(Boolean).join("\n\n") }))} />
                </Suspense>
                <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                      TELL US ABOUT YOUR PROJECT
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Project &amp; contact details
                    </h3>
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    <div>{COMPANY.phoneDisplay}</div>
                    <div>{COMPANY.email}</div>
                  </div>
                </div>

                <EstimateReferencePanel />

                {/* Honeypot field */}
                <div style={{ display: "none" }} aria-hidden="true">
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="estimate-fullName"
                      className="block text-sm font-semibold mb-1"
                      style={{ color: "#0F2040" }}
                    >
                      Full Name <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                    id="estimate-fullName"
                    name="fullName" autoComplete="name"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Your name"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                  <div>
                    <label htmlFor="estimate-phone"
                      className="block text-sm font-semibold mb-1"
                      style={{ color: "#0F2040" }}
                    >
                      Direct Phone Number <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                    id="estimate-phone"
                    name="phone" autoComplete="tel" inputMode="tel"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="Your phone number"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="estimate-email"
                    className="block text-sm font-semibold mb-1"
                    style={{ color: "#0F2040" }}
                  >
                    Email Address <span style={{ color: "#C9A84C" }}>*</span>
                  </label>
                  <input
                    id="estimate-email"
                    name="email" autoComplete="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@company.com"
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>

                <div>
                  <label htmlFor="estimate-projectType"
                    className="block text-sm font-semibold mb-1"
                    style={{ color: "#0F2040" }}
                  >
                    Project Type <span style={{ color: "#C9A84C" }}>*</span>
                  </label>
                  <select
                    id="estimate-projectType"
                    name="projectType"
                    value={form.projectType}
                    onChange={handleChange}
                    required
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                    style={{ borderColor: "#E2E8F0" }}
                  >
                    <option value="">Select a project type...</option>
                    {PROJECT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="estimate-projectLocation"
                    className="block text-sm font-semibold mb-1"
                    style={{ color: "#0F2040" }}
                  >
                    Project Location (8 States: WI · IL · IA · IN · MN · MI · MO · TX){" "}
                    <span style={{ color: "#C9A84C" }}>*</span>
                  </label>
                  <input
                    id="estimate-projectLocation"
                    name="projectLocation"
                    value={form.projectLocation}
                    onChange={handleChange}
                    required
                    placeholder="City and state (e.g. Milwaukee, WI)"
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>

                <div>
                  <label htmlFor="estimate-projectDetails"
                    className="block text-sm font-semibold mb-1"
                    style={{ color: "#0F2040" }}
                  >
                    Project details &amp; priorities
                  </label>
                  <textarea
                    id="estimate-projectDetails"
                    name="projectDetails"
                    value={form.projectDetails}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Describe your project — scope of work, target timeline, blueprint availability, or special requirements..."
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none bg-white"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>

                {status === "error" && (
                  <div role="alert" className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                    {errorMsg}
                  </div>
                )}

                <p className="text-xs text-slate-600">We use these details to review your project and contact you. <Link href="/privacy" className="underline">Privacy &amp; data protection</Link>. Do not include payment or identity documents.</p>
                <button
                  type="submit"
                  data-magnetic
                  disabled={status === "sending"}
                  className="w-full font-black py-3.5 rounded-xl text-base transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  {status === "sending"
                    ? "Sending your request..."
                    : "Send estimate request →"}
                </button>

                <p className="text-center text-xs text-slate-500">
                  We will review your request and contact you using the details provided. A request is not a construction agreement.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
