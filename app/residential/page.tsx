"use client";
import React, { useState } from "react";
import Link from "next/link";
import TradeGallery from "@/components/TradeGallery";

type ResidentialCategory =
  | "all"
  | "envelope_structural"
  | "interiors_carpentry"
  | "restoration_turnkey";

interface ResidentialTradeCard {
  num: string;
  csiCode: string;
  title: string;
  category: Exclude<ResidentialCategory, "all">;
  unitRate: string;
  takeoffBenchmark: string;
  accent: string;
  summary: string;
  items: string[];
}

const RESIDENTIAL_CSI_TRADES: ResidentialTradeCard[] = [
  {
    num: "01",
    csiCode: "CSI 07 31 00",
    title:
      "01 · CSI 07 31 00 — Architectural Shingle, Cedar Shake & Standing Seam Roofing",
    category: "envelope_structural",
    unitRate: "$6.80–$16.50 / sq.ft.",
    takeoffBenchmark: "54.2 MH / Unit Audited (:8085)",
    accent: "#1B3A6B",
    summary:
      "Class-4 impact-resistant architectural shingles, 24-gauge standing seam metal roofs, high-temp ice & water shield, and seamless gutter assemblies.",
    items: [
      "Owens Corning & GAF Class-4 Impact Architectural Shingles",
      "24-Gauge Residential Standing Seam & Stone-Coated Steel",
      "Cedar Shake, Synthetic Slate & Copper Valley Flashing",
      "High-Temp Ice & Water Shield Eave & Valley Protection",
      "R-49 Attic Blown-In & Baffled Ridge-Ventilation Systems",
      "Seamless 6\" K-Style Aluminum Gutters & Storm Hail Rebuild",
    ],
  },
  {
    num: "02",
    csiCode: "CSI 07 46 00",
    title:
      "02 · CSI 07 46 00 — James Hardie Fiber Cement, Engineered Wood & Siding",
    category: "envelope_structural",
    unitRate: "$11.50–$24.00 / sq.ft.",
    takeoffBenchmark: "62.0 MH / Unit Audited (:8085)",
    accent: "#1B3A6B",
    summary:
      "ColorPlus James Hardie fiber-cement lap and board-and-batten siding, LP SmartSide engineered wood, and continuous R-10 exterior insulation.",
    items: [
      "James Hardie Plank Lap & Artisan Board-and-Batten Siding",
      "LP SmartSide Engineered Wood & Natural Western Red Cedar",
      "Insulated Vinyl Siding & Composite Architectural Trim",
      "Tyvek DrainWrap & Continuous Exterior Foam Sheathing",
      "Vented Aluminum & Fiber-Cement Soffit and Fascia Wraps",
      " Andersen / Pella Low-E Argon Window & Door Flashing Integration",
    ],
  },
  {
    num: "03",
    csiCode: "CSI 06 11 00",
    title:
      "03 · CSI 06 11 00 — Residential Platform Framing, LVL Headers & Additions",
    category: "envelope_structural",
    unitRate: "$18.00–$38.00 / sq.ft.",
    takeoffBenchmark: "118.4 MH / Unit Audited (:8085)",
    accent: "#C9A84C",
    summary:
      "2x6 structural platform framing, 1-3/4\"×14\" LVL structural ridge beams, open-concept load-bearing wall removals, and full home additions.",
    items: [
      "2x6 Exterior Cold-Climate Stud Walls & ZIP System Sheathing",
      "1-3/4\"×14\" Engineered LVL Ridge Beams & Open-Span Headers",
      "Engineered Floor Trusses, TJI Joists & Advantech Subfloors",
      "Simpson Strong-Tie Hurricane Clips & HDU8 Hold-Downs",
      "Second-Story Home Additions, Sunrooms & Dormer Expansions",
      "Custom Timber Frame Porches, Decks & Octagon Gazebos",
    ],
  },
  {
    num: "04",
    csiCode: "CSI 09 29 00",
    title:
      "04 · CSI 09 29 00 — Level-4/Level-5 Drywall, Moisture-Shield & Acoustic Ceilings",
    category: "interiors_carpentry",
    unitRate: "$4.20–$9.80 / sq.ft.",
    takeoffBenchmark: "48.5 MH / Unit Audited (:8085)",
    accent: "#1B3A6B",
    summary:
      "Smooth Level-4 and Level-5 residential drywall, mold/moisture-resistant bath and basement boards, and acoustic theater/bedroom isolation.",
    items: [
      "GA-214 Level-4 & Level-5 Smooth Architectural Wall Finishes",
      "Purple Mold & Moisture-Resistant Bathroom & Basement Board",
      "5/8\" Type-X Fire-Rated Garage-to-Living Separation Walls",
      "STC 52+ Sound-Dampening Home Office & Media Room Walls",
      "Custom Coffered, Tray & Vaulted Drywall Ceiling Framing",
      "Seamless Water-Damage Drywall Patching & Texture Matching",
    ],
  },
  {
    num: "05",
    csiCode: "CSI 06 41 00",
    title:
      "05 · CSI 06 41 00 — Custom Kitchen Cabinetry, Bath Vanities & Finish Carpentry",
    category: "interiors_carpentry",
    unitRate: "$145.00–$320.00 / lin.ft.",
    takeoffBenchmark: "52.0 MH / Unit Audited (:8085)",
    accent: "#C9A84C",
    summary:
      "Solid-wood dovetail kitchen cabinetry, quartz countertops, custom bath vanities, wainscoting, crown molding, and hardwood stair systems.",
    items: [
      "Solid-Wood Dovetail Soft-Close Kitchen & Pantry Cabinetry",
      "Custom Double-Sink Bathroom Vanities & Linen Towers",
      "3cm Quartz, Granite & Butcher-Block Countertop Fabrication",
      "Architectural Crown Molding, Wainscoting & Coffered Trim",
      "Solid-Core Interior Doors, Casing & Built-In Mudroom Lockers",
      "Red/White Oak Stair Treads, Risers & Wrought-Iron Balusters",
    ],
  },
  {
    num: "06",
    csiCode: "CSI 03 30 00",
    title:
      "06 · CSI 03 30 00 — Residential Foundations, 4000 PSI Driveways & Stamped Patios",
    category: "envelope_structural",
    unitRate: "$9.50–$22.00 / sq.ft.",
    takeoffBenchmark: "46.8 MH / Unit Audited (:8085)",
    accent: "#1B3A6B",
    summary:
      "Full-depth frost footings, 4000 PSI air-entrained concrete driveways, heated garage slabs, basement egress walls, and stamped patios.",
    items: [
      "Poured Concrete Basement Walls & 42\"–102\" Frost Footings",
      "4000 PSI Air-Entrained Reinforced Concrete Driveways",
      "Vapor-Barrier Basement & Heated Garage Monolithic Slabs",
      "Decorative Stamped, Colored & Exposed-Aggregate Patios",
      "Architectural Steps, Stoops & Retaining Wall Systems",
      "Epoxy Flake Garage Flooring & Polyurea Crack Injection",
    ],
  },
  {
    num: "07",
    csiCode: "IICRC S500 / S520",
    title:
      "07 · IICRC S500 / S520 — 24/7 Certified Fire, Water, Smoke & Mold Restoration",
    category: "restoration_turnkey",
    unitRate: "24/7 Rapid Dispatch",
    takeoffBenchmark: "IICRC + Takeoff Pro (:8085)",
    accent: "#F97316",
    summary:
      "Immediate emergency water extraction, structural psychrometric drying, fire/soot remediation, mold containment, and full insurance rebuild.",
    items: [
      "24/7 Emergency Water Extraction & Structural Dehumidification",
      "Burst Pipe, Sump Failure & Basement Flood Recovery",
      "Fire, Smoke, Soot & Thermal Odor Structural Remediation",
      "IICRC S520 HEPA Negative-Air Mold Remediation Protocols",
      "Direct Insurance Adjuster Xactimate + Takeoff Pro Documentation",
      "Complete Pre-Loss & Code-Upgraded Residential Reconstruction",
    ],
  },
  {
    num: "08",
    csiCode: "CSI 01 31 00",
    title:
      "08 · CSI 01 31 00 — Turnkey Whole-Home Remodeling, Basements & Multi-Unit Rehab",
    category: "restoration_turnkey",
    unitRate: "$95.00–$185.00 / sq.ft.",
    takeoffBenchmark: "$106,940.65 / Unit ($151.69/sf)",
    accent: "#C9A84C",
    summary:
      "Turnkey kitchen and bath transformations, legal egress basement finishing, and multi-cabin / multi-family investor CapEx rehabs.",
    items: [
      "Turnkey Luxury Kitchen & Spa Bathroom Transformations",
      "Finished Basements with Egress Windows, Wet Bars & Baths",
      "$106,940.65 Audited Cabin/Unit Benchmark ($151.69/sq.ft. :8085)",
      "436.3 Field Man-Hours per Turnkey Residential Unit",
      "Investor Flip, BRRRR & Multi-Family Unit Turnover Programs",
      "Single-Point Permitting, MEP Coordination & Final Walkthrough",
    ],
  },
];

export default function ResidentialPage() {
  const [lightAngle, setLightAngle] = useState<number>(48);
  const [activeCategory, setActiveCategory] =
    useState<ResidentialCategory>("all");

  const filteredTrades =
    activeCategory === "all"
      ? RESIDENTIAL_CSI_TRADES
      : RESIDENTIAL_CSI_TRADES.filter((t) => t.category === activeCategory);

  const normalizedLightPx = `${Math.round(20 + (lightAngle / 90) * 65)}%`;

  return (
    <main
      className="min-h-screen pt-16"
      style={
        {
          "--light-angle": `${lightAngle}deg`,
          "--response-px": normalizedLightPx,
          background: "#070E1A",
        } as React.CSSProperties
      }
    >
      {/* ── CABECERA EXECUTIVE COMMAND RESIDENCIAL (#0F2040 -> #1B3A6B) ── */}
      <section
        id="residential-executive-hero"
        className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 border-b"
        style={{
          background: `radial-gradient(circle at ${22 + lightAngle * 0.6}% 20%, rgba(249, 115, 22, 0.2), transparent 46%), radial-gradient(circle at 82% 28%, rgba(201, 168, 76, 0.22), transparent 48%), linear-gradient(${120 + lightAngle * 0.3}deg, #0F2040 0%, #1B3A6B 62%, #0F2040 100%)`,
          borderColor: "rgba(201, 168, 76, 0.38)",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5"
          style={{ background: "#F97316" }}
        />
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ background: "#C9A84C" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top Bar: Orbital Stamp + Raking Light Angle Control */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 mb-10 border-b border-white/15">
            <div className="flex items-center gap-5">
              {/* Rotating Orbital Editorial Stamp */}
              <div
                className="orbital-caption rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/45 shadow-2xl p-1 shrink-0"
                aria-hidden="true"
              >
                <svg viewBox="0 0 120 120">
                  <defs>
                    <path
                      id="residential-orbit-path"
                      d="M 60, 60 m -44, 0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
                    />
                  </defs>
                  <text>
                    <textPath href="#residential-orbit-path" startOffset="0%">
                      TAYCO RESIDENTIAL · 2,300+ HOMES · 24/7 IICRC ·
                    </textPath>
                  </text>
                </svg>
                <span>🏠</span>
              </div>

              <div>
                <div
                  className="tayco-eyebrow mb-2"
                  style={{ color: "#FDBA74" }}
                >
                  <span
                    className="tayco-live-dot"
                    style={{ color: "#F97316" }}
                  />
                  TAYCO RESIDENTIAL &amp; 24/7 IICRC RESTORATION COMMAND
                </div>
                <h1
                  className="font-black text-white tracking-tight"
                  style={{
                    fontSize: "clamp(2.2rem, 4.8vw, 4rem)",
                    lineHeight: 1.03,
                  }}
                >
                  Your Home.{" "}
                  <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
                    Engineered &amp; Restored.
                  </em>
                </h1>
              </div>
            </div>

            {/* Interactive Raking Light Angle Control (0°–90°) */}
            <div
              className="tayco-living-card p-4 rounded-2xl border backdrop-blur-md min-w-[280px] sm:min-w-[330px]"
              style={{
                background: "rgba(7, 14, 26, 0.82)",
                borderColor: "rgba(249, 115, 22, 0.5)",
              }}
            >
              <label
                htmlFor="residential-light-angle-slider"
                className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-amber-200 mb-2"
              >
                <span>☀️ Raking Light Angle: {lightAngle}°</span>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300">
                  0°–90°
                </span>
              </label>
              <input
                id="residential-light-angle-slider"
                type="range"
                min={0}
                max={90}
                value={lightAngle}
                onChange={(e) => setLightAngle(Number(e.target.value))}
                className="w-full h-2 rounded-lg cursor-ew-resize accent-orange-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>0° Low Grazing</span>
                <span>45° Specular</span>
                <span>90° Zenith</span>
              </div>
            </div>
          </div>

          {/* Executive Summary + Takeoff Pro Benchmark Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
            <div className="lg:col-span-7">
              <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                From whole-home renovations, luxury kitchens, and structural
                additions to{" "}
                <strong className="text-orange-300">
                  24/7 IICRC-certified fire &amp; water damage restoration
                </strong>
                , TAYCO LLC self-performs 12+ residential trades across 9 states
                with unit-cost precision audited in{" "}
                <strong className="text-amber-300">Takeoff Pro (:8085)</strong>.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/estimate"
                  data-magnetic
                  className="px-6 py-3.5 rounded-xl font-black text-sm text-white transition-transform hover:scale-105 shadow-lg"
                  style={{ background: "#F97316" }}
                >
                  🧮 Launch Residential CSI-32 Estimator →
                </Link>
                <Link
                  href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
                  data-magnetic
                  className="px-6 py-3.5 rounded-xl font-black text-sm transition-transform hover:scale-105"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  🏛️ Inspect Unit Takeoff in /portal →
                </Link>
                <Link
                  href="/commercial"
                  data-magnetic
                  className="px-5 py-3.5 rounded-xl font-bold text-sm text-white border border-white/25 hover:bg-white/10 transition-colors"
                >
                  View Commercial Division →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div
                data-response-kind="surface"
                className="tayco-living-card p-5 rounded-2xl border"
                style={{
                  background: `linear-gradient(${lightAngle}deg, rgba(15, 32, 64, 0.94), rgba(7, 14, 26, 0.96))`,
                  borderColor: "rgba(201, 168, 76, 0.48)",
                }}
              >
                <div className="flex items-center justify-between text-xs font-mono text-amber-300 font-bold mb-2">
                  <span>● TAKEOFF PRO (:8085) UNIT BENCHMARK</span>
                  <span>705 SQ.FT. / CABIN</span>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  $106,940.65{" "}
                  <span className="text-xs font-normal text-emerald-300">
                    ($151.69 / sq.ft.)
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Audited Turnkey Residential / Cabin Unit Benchmark across 32
                  ARCH-D Sheets: 436.3 Field Man-Hours per Unit, R-56 Spray Foam
                  Envelope, and 1-3/4&quot;×14&quot; LVL Ridge Framing.
                </p>
              </div>
            </div>
          </div>

          {/* Cinta de Telemetría Residencial & Takeoff Pro (:8085) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                metric: "2,300+",
                label: "Homes Renovated",
                sub: "Kitchens, Baths, Additions & Rehabs",
                accent: "#C9A84C",
              },
              {
                metric: "$106,940.65",
                label: "Turnkey Multi-Cabin Unit Benchmark",
                sub: "$151.69 / sq.ft. audited in Takeoff Pro",
                accent: "#10B981",
              },
              {
                metric: "436.3",
                label: "Field Man-Hours per Unit",
                sub: "Self-Performing 12+ Residential Trades",
                accent: "#4A90D9",
              },
              {
                metric: "9",
                label: "States Covered",
                sub: "WI · IL · IA · IN · MN · MI · MO · TX · ND",
                accent: "#F3D37A",
              },
              {
                metric: "24/7",
                label: "Emergency Fire & Water Dispatch",
                sub: "IICRC S500 / S520 Certified Crews",
                accent: "#F97316",
              },
            ].map((item) => (
              <div
                key={item.label}
                data-response-kind="surface"
                className="tayco-living-card p-4 rounded-2xl border"
                style={{
                  background: `linear-gradient(${lightAngle}deg, rgba(15, 32, 64, 0.88) 0%, rgba(7, 14, 26, 0.94) 100%)`,
                  borderColor: "rgba(201, 168, 76, 0.34)",
                }}
              >
                <div
                  className="text-xl sm:text-2xl font-black font-mono"
                  style={{ color: item.accent }}
                >
                  {item.metric}
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  {item.label}
                </div>
                <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                  {item.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MARQUEE EDITORIAL CINÉTICO (.tayco-editorial-ticker) ── */}
      <div
        className="tayco-editorial-ticker"
        aria-label="TAYCO Residential & IICRC Restoration Highlights"
      >
        <div>
          <span className="gold">2,300+ Homes Renovated Across 9 States</span>
          <i aria-hidden="true">✳</i>
          <span>$106,940.65 Turnkey Unit Benchmark ($151.69/sq.ft.)</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">24/7 IICRC S500/S520 Fire &amp; Water Restoration</span>
          <i aria-hidden="true">✳</i>
          <span>Custom Kitchens, Baths &amp; Structural Additions</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">2,300+ Homes Renovated Across 9 States</span>
          <i aria-hidden="true">✳</i>
          <span>$106,940.65 Turnkey Unit Benchmark ($151.69/sq.ft.)</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">24/7 IICRC S500/S520 Fire &amp; Water Restoration</span>
          <i aria-hidden="true">✳</i>
          <span>Custom Kitchens, Baths &amp; Structural Additions</span>
        </div>
      </div>

      {/* ── CHROMATIC HORIZON WAVE INTO WARM EDITORIAL IVORY ── */}
      <div className="chromatic-horizon" aria-hidden="true">
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none">
          <path
            className="horizon-land"
            d="M0 83 C260 8 390 133 720 70 S1140 10 1440 70 V140 H0Z"
          />
          <path
            className="horizon-trace a"
            d="M-80 60 C260 -30 390 122 720 50 S1140 -15 1520 50"
          />
          <path
            className="horizon-trace b"
            d="M-80 32 C260 -60 400 92 720 25 S1140 -40 1520 25"
          />
        </svg>
      </div>

      {/* ── SECCIÓN 01 / RESIDENTIAL CSI-32 TRADES & TURNKEY REMODELING ASSEMBLIES (#F4F2EA) ── */}
      <section
        id="services"
        className="section-editorial-ivory py-16 sm:py-24 px-4 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div
            className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-8 border-b"
            style={{ borderColor: "rgba(27, 58, 107, 0.16)" }}
          >
            <span
              className="tayco-eyebrow font-bold"
              style={{ color: "#1B3A6B" }}
            >
              <span className="tayco-live-dot" style={{ color: "#F97316" }} />
              01 / RESIDENTIAL CSI-32 TRADES &amp; TURNKEY REMODELING ASSEMBLIES
            </span>
            <span
              className="text-[11px] font-mono uppercase tracking-widest"
              style={{ color: "#1B3A6B" }}
            >
              8 CORE RESIDENTIAL ASSEMBLIES · TAKEOFF PRO (:8085) VERIFIED
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
            <div>
              <h2
                className="font-black tracking-tight"
                style={{
                  color: "#0F2040",
                  fontSize: "clamp(2rem, 4.2vw, 3.5rem)",
                  lineHeight: 1.04,
                }}
              >
                Every residential trade.{" "}
                <em
                  className="tayco-serif-em font-normal"
                  style={{ color: "#1B3A6B" }}
                >
                  One accountable team.
                </em>
              </h2>
              <p
                className="text-sm sm:text-base mt-3 max-w-2xl leading-relaxed"
                style={{ color: "#334155" }}
              >
                12+ residential specialties executed by TAYCO in-house crews
                with transparent CSI-32 unit pricing and zero subcontractor
                markups.
              </p>
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter Residential CSI-32 Trades"
            >
              {[
                { id: "all", label: "All 8 Residential Assemblies" },
                {
                  id: "envelope_structural",
                  label: "Roofing, Siding, Framing & Concrete",
                },
                {
                  id: "interiors_carpentry",
                  label: "Drywall & Custom Carpentry",
                },
                {
                  id: "restoration_turnkey",
                  label: "24/7 IICRC & Turnkey Remodeling",
                },
              ].map((tab) => {
                const active = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-magnetic
                    aria-pressed={active}
                    onClick={() =>
                      setActiveCategory(tab.id as ResidentialCategory)
                    }
                    className="px-4 py-2 rounded-full text-xs font-mono font-bold border transition-all cursor-pointer"
                    style={{
                      background: active ? "#0F2040" : "rgba(255,255,255,0.82)",
                      color: active ? "#F3D37A" : "#0F2040",
                      borderColor: active
                        ? "#0F2040"
                        : "rgba(27, 58, 107, 0.28)",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8 Living Residential Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTrades.map((card) => (
              <div
                key={card.num}
                data-response-kind="surface"
                className="tayco-living-card editorial-ivory-card p-6 sm:p-8 flex flex-col justify-between group"
                style={
                  {
                    "--light-angle": `${lightAngle}deg`,
                  } as React.CSSProperties
                }
              >
                <div className="preview-orbits" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-mono font-black uppercase tracking-wider"
                        style={{
                          background: "#0F2040",
                          color: "#F3D37A",
                        }}
                      >
                        {card.csiCode}
                      </span>
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold"
                        style={{
                          background: "rgba(249, 115, 22, 0.16)",
                          color: "#0F2040",
                        }}
                      >
                        {card.unitRate}
                      </span>
                    </div>

                    <Link
                      href={`/estimate?division=residential&trade=${encodeURIComponent(card.csiCode)}`}
                      aria-label={`Estimate ${card.title}`}
                      className="project-open"
                    >
                      ↗
                    </Link>
                  </div>

                  <h3
                    className="text-xl font-black tracking-tight leading-snug"
                    style={{ color: "#0F2040" }}
                  >
                    {card.title}
                  </h3>
                  <p
                    className="text-xs sm:text-sm mt-2 leading-relaxed"
                    style={{ color: "#334155" }}
                  >
                    {card.summary}
                  </p>

                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-5 pt-4 border-t border-slate-300/70">
                    {card.items.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs font-semibold"
                        style={{ color: "#1E293B" }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                          style={{ background: card.accent }}
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div
                  className="relative z-10 mt-6 pt-4 border-t flex flex-wrap items-center justify-between gap-3"
                  style={{ borderColor: "rgba(27, 58, 107, 0.16)" }}
                >
                  <span className="text-[11px] font-mono font-bold text-slate-700">
                    📐 Takeoff Pro: {card.takeoffBenchmark}
                  </span>
                  <Link
                    href={`/estimate?division=residential&trade=${encodeURIComponent(card.csiCode)}`}
                    data-magnetic
                    className="px-4 py-2 rounded-xl text-xs font-black transition-transform hover:scale-105"
                    style={{ background: "#0F2040", color: "#F3D37A" }}
                  >
                    Run Residential Estimate →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVERSE CHROMATIC HORIZON BACK INTO DEEP STRUCTURAL NAVY ── */}
      <div className="chromatic-horizon reverse" aria-hidden="true">
        <svg viewBox="0 0 1440 140" preserveAspectRatio="none">
          <path
            className="horizon-land"
            d="M0 83 C260 8 390 133 720 70 S1140 10 1440 70 V140 H0Z"
          />
          <path
            className="horizon-trace a"
            d="M-80 60 C260 -30 390 122 720 50 S1140 -15 1520 50"
          />
          <path
            className="horizon-trace b"
            d="M-80 32 C260 -60 400 92 720 25 S1140 -40 1520 25"
          />
        </svg>
      </div>

      {/* ── SECCIÓN 02 / 24/7 CERTIFIED FIRE, WATER & STORM RESTORATION COMMAND + TRADE GALLERY ── */}
      <section
        id="restoration-and-gallery"
        className="py-16 sm:py-24 px-4 sm:px-8 relative z-10"
        style={{ background: "#070E1A" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-10 border-b border-white/10">
            <span className="tayco-eyebrow" style={{ color: "#FDBA74" }}>
              <span className="tayco-live-dot" style={{ color: "#F97316" }} />
              02 / 24/7 CERTIFIED FIRE, WATER &amp; STORM RESTORATION COMMAND
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-200">
              IICRC S500 / S520 CERTIFIED · XACTIMATE + TAKEOFF PRO (:8085)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
            {/* Fire Damage Restoration Command Card */}
            <div
              data-response-kind="surface"
              className="tayco-living-card p-8 rounded-2xl border"
              style={{
                background:
                  "linear-gradient(145deg, rgba(15, 32, 64, 0.92), rgba(7, 14, 26, 0.96))",
                borderColor: "rgba(249, 115, 22, 0.5)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider"
                  style={{ background: "#F97316", color: "#ffffff" }}
                >
                  🔥 IICRC Fire &amp; Smoke Certified
                </span>
                <span className="font-mono text-xs text-amber-300">
                  CSI 02 41 00 / 06 11 00
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                24/7 Fire &amp; Structural Damage Reconstruction
              </h3>
              <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                Emergency board-up, structural char evaluation, thermal/hydroxyl
                odor neutralization, and full code-upgraded residential rebuild
                synchronized with your insurance carrier.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Immediate 24/7 Emergency Board-Up & Roof Tarping",
                  "Structural Framing & Engineered LVL Damage Assessment",
                  "HEPA Air Scrubbing, Soot & Smoke Odor Remediation",
                  "Xactimate + Takeoff Pro (:8085) Line-Item Insurance Scope",
                  "Complete Turnkey Home Reconstruction to Occupancy",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-xs sm:text-sm text-slate-200 flex items-start gap-2"
                  >
                    <span style={{ color: "#F97316" }}>✔</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/estimate?division=residential&trade=FIRE-RESTORATION"
                  data-magnetic
                  className="px-5 py-2.5 rounded-xl text-xs font-black text-white"
                  style={{ background: "#F97316" }}
                >
                  Dispatch Fire Restoration Scope →
                </Link>
                <Link
                  href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-200 border border-amber-400/40 hover:bg-white/10"
                >
                  Open Carrier Portal →
                </Link>
              </div>
            </div>

            {/* Water & Storm Restoration Command Card */}
            <div
              data-response-kind="surface"
              className="tayco-living-card p-8 rounded-2xl border"
              style={{
                background:
                  "linear-gradient(145deg, rgba(15, 32, 64, 0.92), rgba(7, 14, 26, 0.96))",
                borderColor: "rgba(201, 168, 76, 0.5)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span
                  className="px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  💧 IICRC S500 / S520 Water &amp; Mold
                </span>
                <span className="font-mono text-xs text-sky-300">
                  Psychrometric Telemetry
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                24/7 Water Extraction, Drying &amp; Mold Remediation
              </h3>
              <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                Rapid flood extraction, FLIR infrared moisture mapping, LGR
                dehumidification, and turnkey drywall, flooring, and cabinetry
                restoration across 9 states.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Submersible Extraction & LGR Structural Dehumidification",
                  "FLIR Thermal Camera & Deep-Probe Moisture Mapping",
                  "IICRC S520 Containment & Antimicrobial Mold Remediation",
                  "Burst Pipe, Ice-Dam & Finished Basement Flood Recovery",
                  "Turnkey Cabinetry, Flooring & Level-5 Drywall Replacement",
                ].map((item) => (
                  <li
                    key={item}
                    className="text-xs sm:text-sm text-slate-200 flex items-start gap-2"
                  >
                    <span style={{ color: "#C9A84C" }}>✔</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/estimate?division=residential&trade=WATER-RESTORATION"
                  data-magnetic
                  className="px-5 py-2.5 rounded-xl text-xs font-black"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  Request Water &amp; Storm Estimate →
                </Link>
                <Link
                  href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-200 border border-amber-400/40 hover:bg-white/10"
                >
                  Inspect Drying Telemetry →
                </Link>
              </div>
            </div>
          </div>

          {/* TradeGallery Integration */}
          <div id="projects" className="pt-4">
            <div className="text-center mb-10">
              <div
                className="tayco-eyebrow justify-center mb-2"
                style={{ color: "#F3D37A" }}
              >
                <span className="tayco-live-dot" style={{ color: "#F97316" }} />
                RESIDENTIAL, MULTIFAMILY &amp; COMMERCIAL FIELD PORTFOLIO
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Explore Our Work by{" "}
                <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                  CSI-32 Trade.
                </em>
              </h3>
            </div>
            <TradeGallery />
          </div>
        </div>
      </section>
    </main>
  );
}
