"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

const CALCULATOR_DIVISIONS = [
  {
    id: "Commercial Ground-Up",
    label: "🏢 Commercial Ground-Up Construction",
    projectTypeMatch: "Commercial Project",
    baseLowSqft: 165,
    baseHighSqft: 245,
    materialsShare: 0.55,
    laborShare: 0.31,
    equipmentShare: 0.14,
  },
  {
    id: "Commercial Tenant Improvement",
    label: "🏬 Commercial Tenant Improvement (TI)",
    projectTypeMatch: "Commercial Tenant Improvement (TI)",
    baseLowSqft: 85,
    baseHighSqft: 145,
    materialsShare: 0.55,
    laborShare: 0.31,
    equipmentShare: 0.14,
  },
  {
    id: "Residential Remodel",
    label: "🏠 Residential Remodel & Additions",
    projectTypeMatch: "Residential Renovation",
    baseLowSqft: 110,
    baseHighSqft: 175,
    materialsShare: 0.55,
    laborShare: 0.31,
    equipmentShare: 0.14,
  },
  {
    id: "Fire/Water Restoration",
    label: "🔥 Certified Fire & Water Restoration",
    projectTypeMatch: "Fire Damage Restoration",
    baseLowSqft: 70,
    baseHighSqft: 130,
    materialsShare: 0.55,
    laborShare: 0.31,
    equipmentShare: 0.14,
  },
];

const FINISH_TIERS = [
  { id: "standard", label: "Standard Commercial / Turnkey Grade (1.00x)", multiplier: 1.0 },
  { id: "executive", label: "Executive / Hospitality Spec Grade (1.18x)", multiplier: 1.18 },
  { id: "industrial", label: "Heavy Industrial / Cold-Storage Spec (1.28x)", multiplier: 1.28 },
];

const STATE_MODIFIERS: Record<
  string,
  { name: string; costFactor: number; salesTaxPct: number; defaultCity: string }
> = {
  WI: { name: "Wisconsin (HQ)", costFactor: 1.0, salesTaxPct: 5.5, defaultCity: "Milwaukee, WI" },
  IL: { name: "Illinois", costFactor: 1.12, salesTaxPct: 8.5, defaultCity: "Chicago, IL" },
  IA: { name: "Iowa", costFactor: 0.94, salesTaxPct: 7.0, defaultCity: "Des Moines, IA" },
  IN: { name: "Indiana", costFactor: 0.96, salesTaxPct: 7.0, defaultCity: "Indianapolis, IN" },
  MN: { name: "Minnesota", costFactor: 1.05, salesTaxPct: 7.375, defaultCity: "Minneapolis, MN" },
  MI: { name: "Michigan", costFactor: 0.98, salesTaxPct: 6.0, defaultCity: "Detroit, MI" },
  MO: { name: "Missouri", costFactor: 0.95, salesTaxPct: 7.5, defaultCity: "St. Louis, MO" },
  TX: { name: "Texas", costFactor: 0.93, salesTaxPct: 8.25, defaultCity: "Dallas, TX" },
};

export default function EstimatePage() {
  // Instant Calculator state
  const [calcDivision, setCalcDivision] = useState(CALCULATOR_DIVISIONS[0].id);
  const [calcState, setCalcState] = useState("WI");
  const [calcSqft, setCalcSqft] = useState(6500);
  const [calcTier, setCalcTier] = useState("standard");

  const selectedDiv =
    CALCULATOR_DIVISIONS.find((d) => d.id === calcDivision) || CALCULATOR_DIVISIONS[0];
  const selectedStateInfo = STATE_MODIFIERS[calcState] || STATE_MODIFIERS.WI;
  const selectedTierObj = FINISH_TIERS.find((t) => t.id === calcTier) || FINISH_TIERS[0];

  const lowEstimateUsd = Math.round(
    calcSqft * selectedDiv.baseLowSqft * selectedStateInfo.costFactor * selectedTierObj.multiplier
  );
  const highEstimateUsd = Math.round(
    calcSqft * selectedDiv.baseHighSqft * selectedStateInfo.costFactor * selectedTierObj.multiplier
  );
  const midpointUsd = Math.round((lowEstimateUsd + highEstimateUsd) / 2);
  const estMaterialsUsd = Math.round(midpointUsd * selectedDiv.materialsShare);
  const estLaborUsd = Math.round(midpointUsd * selectedDiv.laborShare);
  const estEquipmentUsd = Math.round(midpointUsd * selectedDiv.equipmentShare);
  const estStateMaterialsTaxUsd = Math.round(
    (estMaterialsUsd * selectedStateInfo.salesTaxPct) / 100
  );
  const estManHours = Math.max(80, Math.round(estLaborUsd / 32.63));
  const estWeeks = Math.max(3, Math.min(52, Math.round(calcSqft / 650) + 4));

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    projectType: "",
    projectLocation: "",
    projectDetails: "",
    website: "", // honeypot — never shown to user
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedCrmId, setSavedCrmId] = useState<string | null>(null);
  const loadedAt = useRef<number | null>(null);
  useEffect(() => {
    loadedAt.current = Date.now() - 4000;
  }, []);

  function applyCalculatorToForm() {
    const summaryText = `Preliminary CSI-32 Estimate (${selectedDiv.id} · ${selectedTierObj.label}) — ${calcSqft.toLocaleString()} sq ft in ${selectedStateInfo.defaultCity}. Estimated Turnkey Range: $${lowEstimateUsd.toLocaleString()} – $${highEstimateUsd.toLocaleString()} (GMP Target $${midpointUsd.toLocaleString()} | Material $${estMaterialsUsd.toLocaleString()} · Field Labor $${estLaborUsd.toLocaleString()} · Equipment $${estEquipmentUsd.toLocaleString()} + ${selectedStateInfo.salesTaxPct}% State Tax $${estStateMaterialsTaxUsd.toLocaleString()} | Est. ${estManHours.toLocaleString()} Man-Hours | ~${estWeeks} weeks).`;
    setForm((prev) => ({
      ...prev,
      projectType: selectedDiv.projectTypeMatch,
      projectLocation: prev.projectLocation || selectedStateInfo.defaultCity,
      projectDetails: summaryText,
    }));
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sqft: calcSqft,
          estimatedValueUsd: midpointUsd,
          _loadedAt: loadedAt.current,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setSavedCrmId(data.crmOpportunityId || "CRM-SYNCED");
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
        setErrorMsg(data.message || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen pt-16" style={{ background: "#F7F6F1" }}>
      {/* Header */}
      <div
        className="py-12 border-b"
        style={{
          background: "linear-gradient(145deg, #070E1A 0%, #0F2040 60%, #142B54 100%)",
          borderColor: "rgba(201,168,76,0.35)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="umbra-eyebrow mb-3">
            <span className="umbra-live-dot" />
            ★ Free Estimate &amp; Instant CSI-32 Parametric Calculator
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-2 mb-3 tracking-tight">
            Calculate &amp; Request Your{" "}
            <em className="umbra-serif-em">Turnkey Project Estimate</em>
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
            Simulate your project investment across{" "}
            <strong className="text-white">WI · IL · IA · IN · MN · MI · MO · TX</strong> powered by our{" "}
            <strong style={{ color: "#C9A84C" }}>Takeoff Pro v5.0 Engine</strong>, then submit for a formal 24-hour GMP proposal.
          </p>
        </div>
      </div>

      {/* Live Command Center Connection Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div
          data-surface-mode="crystal"
          className="umbra-bento-card p-5 text-white flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="preview-orbits" aria-hidden="true" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="umbra-live-dot" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                LIVE COMMAND CENTER CONNECTION · COMMERCIAL CRM &amp; TAKEOFF PRO BRIDGE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200">
              Every estimate submitted on this page is automatically registered as an active opportunity in{" "}
              <strong className="text-white">Module 1 (Commercial CRM &amp; Bid Pipeline)</strong> and pre-staged for{" "}
              <strong className="text-amber-300">Module 2 (Takeoff Pro v5.0 CSI-32 Blueprint Engine)</strong>.
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-2 shrink-0">
            <Link
              href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
              className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-transform hover:scale-105"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              📐 Preview Client CRM + Takeoff →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8 items-start">
        {/* ── INSTANT PARAMETRIC ESTIMATOR (#tayco-instant-estimator) ── */}
        <section
          id="tayco-instant-estimator"
          data-surface-mode="crystal"
          className="umbra-bento-card lg:col-span-5 p-6 sm:p-7 text-white"
        >
          <div className="preview-orbits" aria-hidden="true" />
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="umbra-eyebrow">📐 Takeoff Pro Parametric Engine</span>
              <span className="text-xs text-emerald-300 font-mono font-semibold">Live CSI-32 Rates</span>
            </div>

            <h2 className="text-xl font-extrabold mb-1">
              Instant Parametric Pre-Construction{" "}
              <em className="umbra-serif-em">Estimator</em>
            </h2>
            <p className="text-xs text-slate-300 mb-5">
              Select project division, state, square footage, and finish tier to estimate turnkey budget, WH-347 man-hours, and state material tax.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Project Division &amp; Scope
                </label>
                <select
                  id="calc-select-division"
                  value={calcDivision}
                  onChange={(e) => setCalcDivision(e.target.value)}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white focus:outline-none"
                >
                  {CALCULATOR_DIVISIONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Target State (8 TAYCO States)
                  </label>
                  <select
                    id="calc-select-state"
                    value={calcState}
                    onChange={(e) => setCalcState(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 bg-white focus:outline-none"
                  >
                    {Object.entries(STATE_MODIFIERS).map(([code, info]) => (
                      <option key={code} value={code}>
                        {code} — {info.name} ({info.salesTaxPct}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Approximate Area (Sq Ft)
                  </label>
                  <input
                    id="calc-input-sqft"
                    type="number"
                    min={250}
                    max={250000}
                    step={250}
                    value={calcSqft}
                    onChange={(e) => setCalcSqft(Math.max(250, Number(e.target.value) || 1000))}
                    className="w-full rounded-lg px-3 py-2.5 text-sm font-bold text-slate-900 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Quality &amp; Finish Tier
                </label>
                <select
                  id="calc-select-tier"
                  value={calcTier}
                  onChange={(e) => setCalcTier(e.target.value)}
                  className="w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white focus:outline-none"
                >
                  {FINISH_TIERS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div
                className="rounded-xl p-4 mt-4 border"
                style={{
                  background: "rgba(7, 14, 26, 0.82)",
                  borderColor: "rgba(201,168,76,0.38)",
                }}
              >
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Estimated Turnkey Investment ({calcState})
                </div>
                <div className="text-2xl sm:text-3xl font-black mt-1 font-mono" style={{ color: "#C9A84C" }}>
                  ${lowEstimateUsd.toLocaleString()} – ${highEstimateUsd.toLocaleString()}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Target GMP Midpoint:{" "}
                  <strong className="text-white font-mono">${midpointUsd.toLocaleString()} USD</strong>
                </div>

                {/* Visual Cost Breakdown Bar (Material 55% · Field Labor 31% · Equipment 14% + State Tax) */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1.5">
                    <span>CSI-32 Direct Cost Allocation</span>
                    <span className="text-amber-300">+{selectedStateInfo.salesTaxPct}% {calcState} Tax</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900 p-0.5 gap-0.5 border border-white/10">
                    <div
                      className="h-full rounded-l-full transition-all duration-300"
                      style={{ width: "55%", background: "#C9A84C" }}
                      title="Material 55%"
                    />
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: "31%", background: "#38BDF8" }}
                      title="Field Labor 31%"
                    />
                    <div
                      className="h-full rounded-r-full transition-all duration-300"
                      style={{ width: "14%", background: "#10B981" }}
                      title="Equipment 14%"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-white/5 border border-amber-400/25">
                      <span className="text-amber-300 block font-bold">Material 55%</span>
                      <span className="text-white">${estMaterialsUsd.toLocaleString()}</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/5 border border-sky-400/25">
                      <span className="text-sky-300 block font-bold">Field Labor 31%</span>
                      <span className="text-white">${estLaborUsd.toLocaleString()}</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/5 border border-emerald-400/25">
                      <span className="text-emerald-300 block font-bold">Equipment 14%</span>
                      <span className="text-white">${estEquipmentUsd.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block">Field Man-Hours</span>
                    <strong className="text-white font-mono">{estManHours.toLocaleString()} MH</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sales Tax ({selectedStateInfo.salesTaxPct}%)</span>
                    <strong className="text-amber-300 font-mono">${estStateMaterialsTaxUsd.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Estimated Schedule</span>
                    <strong className="text-emerald-300 font-mono">~{estWeeks} weeks</strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                id="btn-preload-estimate-form"
                onClick={applyCalculatorToForm}
                className="w-full py-3 rounded-xl font-extrabold text-sm transition-transform hover:scale-[1.01] shadow-md cursor-pointer"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                ⚡ Pre-Fill Estimate Form With CSI-32 Breakdown →
              </button>

              <div className="pt-1 text-center">
                <Link
                  href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
                  className="text-xs font-bold underline hover:text-white"
                  style={{ color: "#C9A84C" }}
                >
                  Open in Multi-Tenant Portal &amp; Takeoff Pro →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── ESTIMATE REQUEST FORM ── */}
        <div className="lg:col-span-7">
          {status === "success" ? (
            <div
              data-surface-mode="mineral"
              className="umbra-bento-card text-center py-14 px-6 bg-white"
            >
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>
                Estimate Request Registered in TAYCO CRM!
              </h2>
              <p className="text-slate-600 mb-3">
                Our Pre-Construction &amp; Estimating team will contact you within 24 hours to review your scope and Takeoff Pro budget.
              </p>
              {savedCrmId && (
                <p className="text-xs font-mono text-emerald-700 bg-emerald-50 inline-block px-3 py-1 rounded-full mb-6 border border-emerald-200">
                  CRM Opportunity ID: {savedCrmId}
                </p>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Link
                  href="/portal?tab=MOD_CRM_BIDS"
                  className="text-sm font-bold px-6 py-3 rounded-xl"
                  style={{ background: "#0F2040", color: "#C9A84C" }}
                >
                  🏛️ View My Request in the CRM Command Center →
                </Link>
                <Link
                  href="/"
                  className="text-sm font-semibold px-6 py-3 rounded-xl"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              data-surface-mode="mineral"
              className="umbra-bento-card p-8 space-y-5"
            >
              <div className="preview-orbits" aria-hidden="true" />
              <div className="relative z-10 space-y-5">
                <div className="border-b border-slate-200 pb-3">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                    FORMAL PRE-CONSTRUCTION &amp; GMP PROPOSAL REQUEST
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    Project Scope &amp; Contact Information
                  </h3>
                </div>

                {/* Honeypot field — hidden from real users, catches bots */}
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
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      Full Name <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      placeholder="John Smith"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
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
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
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
                    placeholder="you@company.com"
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
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
                      <option key={t} value={t}>
                        {t}
                      </option>
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
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                    Project Details &amp; CSI-32 Scope Notes
                  </label>
                  <textarea
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
                  <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full font-black py-3.5 rounded-xl text-base transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  {status === "sending"
                    ? "Syncing Estimate to TAYCO Command Center..."
                    : "Submit Estimate Request & Sync to CRM →"}
                </button>

                <p className="text-center text-xs text-slate-500">
                  We respond within 24 hours. Automatically synced with TAYCO LLC Commercial CRM &amp; Takeoff Pro v5.0.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
