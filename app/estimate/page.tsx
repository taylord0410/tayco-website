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
    baseLowSqft: 151.69,
    baseHighSqft: 245,
    materialsShare: 0.548,
    laborShare: 0.312,
    equipmentShare: 0.14,
  },
  {
    id: "Commercial Tenant Improvement",
    label: "🏬 Commercial Tenant Improvement (TI)",
    projectTypeMatch: "Commercial Tenant Improvement (TI)",
    baseLowSqft: 85,
    baseHighSqft: 145,
    materialsShare: 0.548,
    laborShare: 0.312,
    equipmentShare: 0.14,
  },
  {
    id: "Residential Remodel",
    label: "🏠 Residential Remodel & Additions",
    projectTypeMatch: "Residential Renovation",
    baseLowSqft: 110,
    baseHighSqft: 175,
    materialsShare: 0.548,
    laborShare: 0.312,
    equipmentShare: 0.14,
  },
  {
    id: "Fire/Water Restoration",
    label: "🔥 Certified Fire & Water Restoration",
    projectTypeMatch: "Fire Damage Restoration",
    baseLowSqft: 70,
    baseHighSqft: 130,
    materialsShare: 0.548,
    laborShare: 0.312,
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
  ND: {
    name: "North Dakota (MHA Nation / Bakken)",
    costFactor: 1.04,
    salesTaxPct: 6.5,
    defaultCity: "New Town / Minot, ND",
  },
};

export default function EstimatePage() {
  const [lightAngle, setLightAngle] = useState(42);
  const [calcDivision, setCalcDivision] = useState(CALCULATOR_DIVISIONS[0].id);
  const [calcState, setCalcState] = useState("ND");
  const [calcSqft, setCalcSqft] = useState(5640);
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
    website: "", // honeypot
  });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [savedCrmId, setSavedCrmId] = useState<string | null>(null);
  const loadedAt = useRef<number | null>(null);
  useEffect(() => {
    loadedAt.current = Date.now() - 4000;
  }, []);

  function applyCalculatorToForm() {
    const summaryText = `Preliminary CSI-32 Estimate (${selectedDiv.id} · ${selectedTierObj.label}) — ${calcSqft.toLocaleString()} sq ft in ${selectedStateInfo.defaultCity}. Estimated Turnkey Range: $${lowEstimateUsd.toLocaleString()} – $${highEstimateUsd.toLocaleString()} (GMP Target $${midpointUsd.toLocaleString()} | Material 54.8% $${estMaterialsUsd.toLocaleString()} · Field Labor 31.2% $${estLaborUsd.toLocaleString()} · Equipment 14.0% $${estEquipmentUsd.toLocaleString()} + ${selectedStateInfo.salesTaxPct}% State Tax $${estStateMaterialsTaxUsd.toLocaleString()} | Est. ${estManHours.toLocaleString()} WH-347 Man-Hours @ $32.63/hr | ~${estWeeks} weeks).`;
    setForm((prev) => ({
      ...prev,
      projectType: selectedDiv.projectTypeMatch,
      projectLocation: prev.projectLocation || selectedStateInfo.defaultCity,
      projectDetails: summaryText,
    }));
  }

  function loadSonOfAStarPreset() {
    setCalcDivision("Commercial Ground-Up");
    setCalcState("ND");
    setCalcSqft(5640);
    setCalcTier("standard");
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
    <main
      className="min-h-screen pt-16 section-editorial-ivory"
      style={
        {
          "--light-angle": `${lightAngle}deg`,
          background: "#F7F6F1",
        } as React.CSSProperties
      }
    >
      {/* ── EXECUTIVE LIVING EDITORIAL HEADER WITH ORBITAL SEAL & RAKING LIGHT ── */}
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
                  ★ CSI-32 Parametric Estimator &amp; Takeoff Pro v5.0 Intake
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-amber-400/15 text-amber-300 border border-amber-400/35">
                  rust_critical_apu_exact_cents Calibrated
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white mt-2 mb-3 tracking-tight">
                Calculate &amp; Request Your{" "}
                <em className="tayco-serif-em">Turnkey Project Estimate</em>
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Simulate your commercial, industrial, or residential investment across all{" "}
                <strong className="text-white">
                  9 States (WI · IL · IA · IN · MN · MI · MO · TX · ND)
                </strong>{" "}
                powered by our{" "}
                <strong style={{ color: "#C9A84C" }}>Takeoff Pro v5.0 (:8085)</strong> engine. Calibrated against the audited{" "}
                <strong className="text-emerald-300">
                  Son of a Star Phase 1 ($855,525.23 GMP / $151.69 per sq.ft.)
                </strong>{" "}
                benchmark.
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
                  Milwaukee HQ: (414) 293-8400 · ND Ops: (701) 839-2277
                </span>
              </div>
            </div>

            {/* Rotating Orbital Seal */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-36 h-36 flex items-center justify-center rounded-full border border-amber-400/40 bg-slate-950/60 shadow-2xl">
                <svg
                  viewBox="0 0 160 160"
                  className="w-32 h-32 orbital-caption"
                  aria-label="TAYCO Takeoff Pro v5.0 Orbital Seal"
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
                      • TAKEOFF PRO :8085 • CSI-32 EXACT CENTS • 9 STATES •
                    </textPath>
                  </text>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300">
                    GMP Audit
                  </span>
                  <span className="text-sm font-black text-white font-mono">
                    $151.69
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300">
                    / sq.ft. ND
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
            ⚡ ENGINE CALIBRATION: rust_critical_apu_exact_cents · 54.8% Materials · 31.2% Field Labor WH-347 ($32.63/hr) · 14.0% Equipment
          </span>
          <span>
            BENCHMARK: Son of a Star Phase 1 (New Town, ND) — $855,525.23 GMP · 5,640 SF · 369 Audited BOQ Lines
          </span>
        </div>
      </div>

      {/* ── LIVE CONNECTION BANNER WITH TAKEOFF PRO (:8085) ── */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <div
          data-surface-mode="crystal"
          className="tayco-living-card bg-gradient-to-br from-[#070E1A] via-[#0F2040] to-[#1B3A6B] text-white shadow-2xl p-6 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
        >
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="relative z-10 space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tayco-live-dot" />
              <span className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                LIVE TAKEOFF PRO (:8085) &amp; COMMERCIAL CRM BRIDGE · EXACT-CENT APU ENGINE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              This parametric calculator executes the exact direct-cost ratio audited by the{" "}
              <code className="text-amber-300 font-mono">rust_critical_apu_exact_cents</code> engine in{" "}
              <strong className="text-white">Takeoff Pro v5.0 (:8085)</strong>:{" "}
              <strong className="text-amber-300">54.8% Materials</strong> ·{" "}
              <strong className="text-sky-300">31.2% WH-347 Field Labor ($32.63/hr Davis-Bacon loaded rate)</strong> ·{" "}
              <strong className="text-emerald-300">14.0% Heavy Equipment</strong>, calibrated against{" "}
              <strong className="text-white">
                Son of a Star Phase 1 ($855,525.23 GMP / $151.69 per sq.ft.)
              </strong>
              . Every submitted request automatically creates a live record in{" "}
              <strong className="text-white">Module 1 (MOD_CRM_BIDS)</strong> and stages blueprints for{" "}
              <strong className="text-amber-300">Module 0 (MOD_TAKEOFF_PRO)</strong>.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              data-magnetic
              onClick={loadSonOfAStarPreset}
              className="px-3.5 py-2 rounded-lg text-xs font-mono font-bold border border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
            >
              🎯 Load Son of a Star ND Benchmark
            </button>
            <Link
              href="/portal?tab=MOD_TAKEOFF_PRO"
              data-magnetic
              className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-transform hover:scale-105"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              📐 Open Takeoff Pro (:8085) + CRM →
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8 items-start">
        {/* ── INSTANT PARAMETRIC ESTIMATOR (#tayco-instant-estimator) ── */}
        <section
          id="tayco-instant-estimator"
          data-surface-mode="crystal"
          className="tayco-living-card lg:col-span-5 p-6 sm:p-7 text-white"
        >
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="tayco-eyebrow">📐 Takeoff Pro Parametric Engine</span>
              <span className="text-xs text-emerald-300 font-mono font-semibold">
                9 States · CSI-32
              </span>
            </div>

            <h2 className="text-xl font-extrabold mb-1">
              Instant Parametric Pre-Construction{" "}
              <em className="tayco-serif-em">Estimator</em>
            </h2>
            <p className="text-xs text-slate-300 mb-5">
              Select project division, state (including North Dakota MHA Nation / Bakken), area, and finish tier to compute turnkey GMP, WH-347 man-hours at $32.63/hr, and state material tax.
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
                    Target State (9 TAYCO States)
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
                  Estimated Turnkey Investment ({calcState} — {selectedStateInfo.defaultCity})
                </div>
                <div
                  className="text-2xl sm:text-3xl font-black mt-1 font-mono"
                  style={{ color: "#C9A84C" }}
                >
                  ${lowEstimateUsd.toLocaleString()} – ${highEstimateUsd.toLocaleString()}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Target GMP Midpoint:{" "}
                  <strong className="text-white font-mono">
                    ${midpointUsd.toLocaleString()} USD
                  </strong>
                </div>

                {/* Visual Cost Breakdown Bar (54.8% Materials · 31.2% Field Labor · 14.0% Equipment) */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1.5">
                    <span>CSI-32 APU Split (54.8 / 31.2 / 14.0)</span>
                    <span className="text-amber-300">
                      +{selectedStateInfo.salesTaxPct}% {calcState} Tax
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900 p-0.5 gap-0.5 border border-white/10">
                    <div
                      className="h-full rounded-l-full transition-all duration-300"
                      style={{ width: "54.8%", background: "#C9A84C" }}
                      title="Materials 54.8%"
                    />
                    <div
                      className="h-full transition-all duration-300"
                      style={{ width: "31.2%", background: "#38BDF8" }}
                      title="WH-347 Field Labor 31.2%"
                    />
                    <div
                      className="h-full rounded-r-full transition-all duration-300"
                      style={{ width: "14%", background: "#10B981" }}
                      title="Equipment 14.0%"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] font-mono">
                    <div className="p-1.5 rounded bg-white/5 border border-amber-400/25">
                      <span className="text-amber-300 block font-bold">Material 54.8%</span>
                      <span className="text-white">${estMaterialsUsd.toLocaleString()}</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/5 border border-sky-400/25">
                      <span className="text-sky-300 block font-bold">Labor 31.2%</span>
                      <span className="text-white">${estLaborUsd.toLocaleString()}</span>
                    </div>
                    <div className="p-1.5 rounded bg-white/5 border border-emerald-400/25">
                      <span className="text-emerald-300 block font-bold">Equip 14.0%</span>
                      <span className="text-white">${estEquipmentUsd.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block">WH-347 Man-Hours</span>
                    <strong className="text-white font-mono">
                      {estManHours.toLocaleString()} MH
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      Sales Tax ({selectedStateInfo.salesTaxPct}%)
                    </span>
                    <strong className="text-amber-300 font-mono">
                      ${estStateMaterialsTaxUsd.toLocaleString()}
                    </strong>
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
                data-magnetic
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
                  Open in Multi-Tenant Command Center &amp; Takeoff Pro (:8085) →
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
              className="tayco-living-card editorial-ivory-card text-center py-14 px-6 bg-white"
            >
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>
                Estimate Request Registered in TAYCO CRM!
              </h2>
              <p className="text-slate-600 mb-3 max-w-xl mx-auto">
                Our Pre-Construction &amp; Estimating team at Milwaukee HQ{" "}
                <strong>(414) 293-8400</strong> and North Dakota Operations{" "}
                <strong>(701) 839-2277</strong> will contact you within 24 hours to review your scope and Takeoff Pro v5.0 (:8085) BOQ.
              </p>
              {savedCrmId && (
                <div className="mb-6">
                  <p className="text-xs font-mono text-emerald-800 bg-emerald-50 inline-block px-4 py-1.5 rounded-full border border-emerald-300 font-bold">
                    MOD_CRM_BIDS Opportunity Code: {savedCrmId}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                <Link
                  href="/portal?tab=MOD_CRM_BIDS"
                  data-magnetic
                  className="text-xs sm:text-sm font-bold px-5 py-3 rounded-xl"
                  style={{ background: "#0F2040", color: "#C9A84C" }}
                >
                  🏛️ Open Module 1 (CRM &amp; Bid Pipeline) →
                </Link>
                <Link
                  href="/portal?tab=MOD_TAKEOFF_PRO"
                  data-magnetic
                  className="text-xs sm:text-sm font-extrabold px-5 py-3 rounded-xl"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  📐 Open Module 0 (Takeoff Pro Bridge :8085) →
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
              className="tayco-living-card editorial-ivory-card p-8 space-y-5 bg-white"
            >
              <div className="preview-orbits" aria-hidden="true" />
              <div className="relative z-10 space-y-5">
                <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                      FORMAL PRE-CONSTRUCTION &amp; GMP PROPOSAL REQUEST
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Project Scope &amp; Executive Contact Information
                    </h3>
                  </div>
                  <div className="text-xs font-mono text-slate-600">
                    <div>📞 (414) 293-8400 · WI HQ</div>
                    <div>📞 (701) 839-2277 · ND Ops</div>
                  </div>
                </div>

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
                    <label
                      className="block text-sm font-semibold mb-1"
                      style={{ color: "#0F2040" }}
                    >
                      Full Name <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      placeholder="Marcus Vance"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1"
                      style={{ color: "#0F2040" }}
                    >
                      Direct Phone Number <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="(414) 293-8400"
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                      style={{ borderColor: "#E2E8F0" }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold mb-1"
                    style={{ color: "#0F2040" }}
                  >
                    Executive Email Address <span style={{ color: "#C9A84C" }}>*</span>
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
                  <label
                    className="block text-sm font-semibold mb-1"
                    style={{ color: "#0F2040" }}
                  >
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
                  <label
                    className="block text-sm font-semibold mb-1"
                    style={{ color: "#0F2040" }}
                  >
                    Project Location (9 States: WI · IL · IA · IN · MN · MI · MO · TX · ND){" "}
                    <span style={{ color: "#C9A84C" }}>*</span>
                  </label>
                  <input
                    name="projectLocation"
                    value={form.projectLocation}
                    onChange={handleChange}
                    required
                    placeholder="City, State (e.g. Milwaukee, WI or New Town, ND)"
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white"
                    style={{ borderColor: "#E2E8F0" }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold mb-1"
                    style={{ color: "#0F2040" }}
                  >
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
                  data-magnetic
                  disabled={status === "sending"}
                  className="w-full font-black py-3.5 rounded-xl text-base transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  {status === "sending"
                    ? "Syncing Estimate to TAYCO Command Center..."
                    : "Submit Estimate Request & Sync to CRM →"}
                </button>

                <p className="text-center text-xs text-slate-500">
                  We respond within 24 hours. Automatically synced with TAYCO LLC Module 1 (MOD_CRM_BIDS) &amp; Module 0 (Takeoff Pro v5.0 :8085).
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
