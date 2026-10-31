"use client";
import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
    label: "🔥 Fire & Water Restoration",
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
  { id: "executive", label: "Hospitality Finish Grade (1.18x)", multiplier: 1.18 },
  { id: "industrial", label: "Heavy Industrial / Cold-Storage Spec (1.28x)", multiplier: 1.28 },
];

const STATE_MODIFIERS: Record<
  string,
  { name: string; costFactor: number; salesTaxPct: number; defaultCity: string }
> = {
  WI: { name: "Wisconsin", costFactor: 1.0, salesTaxPct: 5.5, defaultCity: "Milwaukee, WI" },
  IL: { name: "Illinois", costFactor: 1.12, salesTaxPct: 8.5, defaultCity: "Chicago, IL" },
  IA: { name: "Iowa", costFactor: 0.94, salesTaxPct: 7.0, defaultCity: "Des Moines, IA" },
  IN: { name: "Indiana", costFactor: 0.96, salesTaxPct: 7.0, defaultCity: "Indianapolis, IN" },
  MN: { name: "Minnesota", costFactor: 1.05, salesTaxPct: 7.375, defaultCity: "Minneapolis, MN" },
  MI: { name: "Michigan", costFactor: 0.98, salesTaxPct: 6.0, defaultCity: "Detroit, MI" },
  MO: { name: "Missouri", costFactor: 0.95, salesTaxPct: 7.5, defaultCity: "St. Louis, MO" },
  TX: { name: "Texas", costFactor: 0.93, salesTaxPct: 8.25, defaultCity: "Dallas, TX" },
};

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
  const [calcDivision, setCalcDivision] = useState(CALCULATOR_DIVISIONS[0].id);
  const [calcState, setCalcState] = useState("WI");
  const [calcArea, setCalcArea] = useState("2000");
  const parsedArea = Number(calcArea);
  const isAreaValid = calcArea.trim() !== "" && Number.isFinite(parsedArea) && Number.isInteger(parsedArea) && parsedArea >= 250 && parsedArea <= 250000;
  const calcSqft = isAreaValid ? parsedArea : 0;
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
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState("");
  const requestRef = useRef<{ key: string; payload: string } | null>(null);
  const previousIllustration = useRef("");
  const loadedAt = useRef<number | null>(null);
  useEffect(() => {
    loadedAt.current = Date.now();
  }, []);

  const budgetSummaryText = isAreaValid ? `Budget planning illustration only — not a quote or agreed scope. ${selectedDiv.id}, ${selectedTierObj.label}, ${calcSqft.toLocaleString()} sq ft in ${calcState}. Illustrative range $${lowEstimateUsd.toLocaleString()}–$${highEstimateUsd.toLocaleString()}; assumptions require project review.` : "";

  function applyCalculatorToForm() {
    if (!isAreaValid) return;
    const summaryText = budgetSummaryText;
    const previousSummary = previousIllustration.current;
    previousIllustration.current = summaryText;
    setForm((prev) => ({
      ...prev,
      projectType: selectedDiv.projectTypeMatch,
      projectLocation: prev.projectLocation || selectedStateInfo.defaultCity,
      projectDetails: [previousSummary ? prev.projectDetails.replace(previousSummary, "").trim() : prev.projectDetails.trim(), summaryText].filter(Boolean).join("\n\n"),
    }));
  }


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
      const includedIllustration = isAreaValid && budgetSummaryText !== "" && form.projectDetails.includes(budgetSummaryText);
      const payload = JSON.stringify({ ...form, ...(includedIllustration ? { sqft: calcSqft, budgetIllustrationUsd: midpointUsd } : {}), _loadedAt: loadedAt.current });
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

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-12 gap-8 items-start">
        {/* ── INSTANT PARAMETRIC ESTIMATOR (#tayco-instant-estimator) ── */}
        <section
          id="tayco-instant-estimator"
          data-surface-mode="crystal"
          className="tayco-living-card order-2 lg:order-1 lg:col-span-5 p-6 sm:p-7 text-white"
        >
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="tayco-eyebrow">Optional budget illustration</span>
              <span className="text-xs text-emerald-300 font-mono font-semibold">
                PLANNING ONLY
              </span>
            </div>

            <h2 className="text-xl font-extrabold mb-1">
              Explore an illustrative{" "}
              <em className="tayco-serif-em">Estimator</em>
            </h2>
            <p className="text-xs text-slate-300 mb-5">
              This illustration uses general assumptions, not TAYCO project pricing. It is not a quote, tax calculation or schedule commitment. Site conditions, permits, local requirements and selections can change the outcome. Request a reviewed estimate below.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="calc-select-division" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
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
                  <label htmlFor="calc-select-state" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Target state
                  </label>
                  <select
                    id="calc-select-state"
                    value={calcState}
                    onChange={(e) => setCalcState(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-900 bg-white focus:outline-none"
                  >
                    {Object.entries(STATE_MODIFIERS).map(([code, info]) => (
                      <option key={code} value={code}>
                        {code} — {info.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="calc-input-sqft" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Approximate Area (Sq Ft)
                  </label>
                  <input
                    id="calc-input-sqft"
                    type="number"
                    min={250}
                    max={250000}
                    step={1}
                    value={calcArea}
                    onChange={(e) => setCalcArea(e.target.value)}
                    aria-invalid={!isAreaValid}
                    aria-describedby={!isAreaValid ? "calc-area-error" : undefined}
                    className="w-full rounded-lg px-3 py-2.5 text-sm font-bold text-slate-900 bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="calc-select-tier" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
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

              {isAreaValid ? (
              <div
                className="rounded-xl p-4 mt-4 border"
                style={{
                  background: "rgba(7, 14, 26, 0.82)",
                  borderColor: "rgba(201,168,76,0.38)",
                }}
              >
                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Illustrative budget range ({calcState} — {selectedStateInfo.defaultCity})
                </div>
                <div
                  className="text-2xl sm:text-3xl font-black mt-1 font-mono"
                  style={{ color: "#C9A84C" }}
                >
                  ${lowEstimateUsd.toLocaleString()} – ${highEstimateUsd.toLocaleString()}
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Illustrative midpoint:{" "}
                  <strong className="text-white font-mono">
                    ${midpointUsd.toLocaleString()} USD
                  </strong>
                </div>

                {/* Visual Cost Breakdown Bar (54.8% Materials · 31.2% Field Labor · 14.0% Equipment) */}
                <div className="mt-4 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1.5">
                    <span>Illustrative cost allocation</span>
                    <span className="text-amber-300">
                      Assumed allowance: {selectedStateInfo.salesTaxPct}%
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
                      title="Illustrative labor share 31.2%"
                    />
                    <div
                      className="h-full rounded-r-full transition-all duration-300"
                      style={{ width: "14%", background: "#10B981" }}
                      title="Equipment 14.0%"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 mt-2 text-[10px] font-mono">
                    <div className="p-2 rounded-xl bg-white/5 border border-amber-400/25">
                      <span className="text-amber-300 block font-bold">Material 54.8%</span>
                      <span className="text-white">${estMaterialsUsd.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-sky-400/25">
                      <span className="text-sky-300 block font-bold">Labor 31.2%</span>
                      <span className="text-white">${estLaborUsd.toLocaleString()}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 border border-emerald-400/25">
                      <span className="text-emerald-300 block font-bold">Equip 14.0%</span>
                      <span className="text-white">${estEquipmentUsd.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-slate-400 block">Illustrative labor hours</span>
                    <strong className="text-white font-mono">
                      {estManHours.toLocaleString()} MH
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">
                      Assumed allowance ({selectedStateInfo.salesTaxPct}%)
                    </span>
                    <strong className="text-amber-300 font-mono">
                      ${estStateMaterialsTaxUsd.toLocaleString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Illustrative duration</span>
                    <strong className="text-emerald-300 font-mono">~{estWeeks} weeks</strong>
                  </div>
                </div>
              </div>

              ) : <p id="calc-area-error" role="status" className="rounded-xl border border-amber-300/50 bg-amber-100/10 p-4 text-sm text-amber-100">Enter a whole area between 250 and 250,000 sq ft to see an illustration. You can request an estimate without using this optional calculator.</p>}

              <button
                type="button"
                id="btn-preload-estimate-form"
                disabled={!isAreaValid}
                data-magnetic
                onClick={applyCalculatorToForm}
                className="w-full py-3 rounded-xl font-extrabold text-sm transition-transform hover:scale-[1.01] shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                Add this illustration to my request →
              </button>

              <div className="pt-1 text-center">
                <Link
                  href="/login"
                  className="text-xs font-bold underline hover:text-white"
                  style={{ color: "#C9A84C" }}
                >
                  Existing client project sign in →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── ESTIMATE REQUEST FORM ── */}
        <div className="order-1 lg:order-2 lg:col-span-7">
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
              className="tayco-living-card editorial-ivory-card p-5 sm:p-8 space-y-5 bg-white"
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
