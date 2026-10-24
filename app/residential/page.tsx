"use client";
import React, { useState } from "react";
import Link from "next/link";
import TradeGallery from "@/components/TradeGallery";
import { COMPANY, COMPANY_SERVICE_AREAS } from "@/lib/company";

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
  planningNote: string;
  accent: string;
  summary: string;
  items: string[];
}

const RESIDENTIAL_CSI_TRADES: ResidentialTradeCard[] = [
  {
    "num": "01",
    "csiCode": "Roofing",
    "title": "Roofing",
    "category": "envelope_structural",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#C9A84C",
    "summary": "Repair or replace the roof with materials and details suited to your home.",
    "items": [
      "Shingles, metal and other roof options",
      "Soffit and fascia",
      "Gutters and downspouts",
      "Leak and storm damage repairs",
      "Ventilation and flashing review",
      "Roof condition assessment"
    ]
  },
  {
    "num": "02",
    "csiCode": "Exterior",
    "title": "Siding, windows & doors",
    "category": "envelope_structural",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Refresh the exterior while addressing weather protection and existing conditions.",
    "items": [
      "Vinyl and fiber-cement siding",
      "Engineered wood and cedar",
      "Exterior trim",
      "Window and door coordination",
      "Soffit and fascia",
      "Repair and replacement planning"
    ]
  },
  {
    "num": "03",
    "csiCode": "Framing",
    "title": "Framing & additions",
    "category": "envelope_structural",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Create more usable space with framing and additions coordinated around your home.",
    "items": [
      "Home additions",
      "Wall and roof framing",
      "Floor systems",
      "Structural headers",
      "Porches and decks",
      "Engineering review where required"
    ]
  },
  {
    "num": "04",
    "csiCode": "Interiors",
    "title": "Drywall & interior finishes",
    "category": "interiors_carpentry",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#C9A84C",
    "summary": "Finish new spaces and restore existing rooms with coordinated drywall and painting.",
    "items": [
      "Drywall installation",
      "Moisture-resistant board",
      "Smooth and textured finishes",
      "Repair and patching",
      "Ceiling details",
      "Painting and final touch-ups"
    ]
  },
  {
    "num": "05",
    "csiCode": "Carpentry",
    "title": "Kitchens, baths & carpentry",
    "category": "interiors_carpentry",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Bring storage, fixtures and finishes together around the way your household lives.",
    "items": [
      "Kitchen cabinetry",
      "Bathroom vanities",
      "Trim and molding",
      "Built-in storage",
      "Countertop coordination",
      "Stairs and finish carpentry"
    ]
  },
  {
    "num": "06",
    "csiCode": "Concrete",
    "title": "Concrete & foundations",
    "category": "envelope_structural",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Plan practical concrete improvements from foundations to outdoor living areas.",
    "items": [
      "Foundations and basement slabs",
      "Driveways and garage slabs",
      "Patios and walkways",
      "Steps and stoops",
      "Decorative concrete options",
      "Concrete repair"
    ]
  },
  {
    "num": "07",
    "csiCode": "Restoration",
    "title": "Fire & water restoration",
    "category": "restoration_turnkey",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#F97316",
    "summary": "Coordinate damage assessment, repairs and rebuilding after a loss.",
    "items": [
      "Fire and smoke damage assessment",
      "Water extraction and structural drying",
      "Flood and pipe-burst damage",
      "Soot and smoke repairs",
      "Insurance documentation support",
      "Home reconstruction"
    ]
  },
  {
    "num": "08",
    "csiCode": "Renovation",
    "title": "Whole-home renovation",
    "category": "restoration_turnkey",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Coordinate rooms, trades and priorities within one renovation plan.",
    "items": [
      "Kitchen and bathroom remodeling",
      "Home additions",
      "Basement finishing",
      "Property rehabilitation",
      "Rental unit turnovers",
      "Bank-owned property repairs"
    ]
  }
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
      {/* Project services and resources */}
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
                      TAYCO RESIDENTIAL · YOUR HOME · OUR PRIORITY ·
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
                  RESIDENTIAL RENOVATION &amp; RESTORATION
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
                    Our Priority.
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

          {/* Project services and resources */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
            <div className="lg:col-span-7">
              <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                From kitchens and bathrooms to additions, basement finishing and restoration,
                TAYCO helps make your next step clear. Tell us about your home, your priorities and the work you have in mind.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/estimate"
                  data-magnetic
                  className="px-6 py-3.5 rounded-xl font-black text-sm text-white transition-transform hover:scale-105 shadow-lg"
                  style={{ background: "#F97316" }}
                >
                  Request a home project estimate →
                </Link>
                <Link
                  href="/login"
                  data-magnetic
                  className="px-6 py-3.5 rounded-xl font-black text-sm transition-transform hover:scale-105"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  Client project sign in →
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
                  <span>A HOME THAT WORKS FOR YOU</span>
                  <span>YOUR SPACE · YOUR PRIORITIES</span>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  Thoughtful renovation{" "}
                  <span className="text-xs font-normal text-emerald-300">
                    from room to whole home
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Start with your goals and existing conditions. We help coordinate scope, finishes and trades, with the details agreed before work begins.
                </p>
              </div>
            </div>
          </div>

          {/* Project services and resources */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
  {
    "metric": "Renovate",
    "label": "Kitchens & bathrooms",
    "sub": "Make everyday spaces work better",
    "accent": "#C9A84C"
  },
  {
    "metric": "Expand",
    "label": "Additions & basements",
    "sub": "Plan the space you need",
    "accent": "#10B981"
  },
  {
    "metric": "Restore",
    "label": "Fire & water damage",
    "sub": "Bring repair and rebuilding together",
    "accent": "#4A90D9"
  },
  {
    "metric": "8 States",
    "label": "Service coverage",
    "sub": "WI · IL · IA · IN · MN · MI · MO · TX",
    "accent": "#F3D37A"
  },
  {
    "metric": "One team",
    "label": "Coordinated trades",
    "sub": "Talk through scope and schedule",
    "accent": "#F97316"
  }
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
        aria-label="TAYCO residential services"
      >
        <div>
          <span className="gold">Home renovation across eight states</span>
          <i aria-hidden="true">✳</i>
          <span>Planning, construction &amp; the finishing details</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Fire &amp; Water Restoration</span>
          <i aria-hidden="true">✳</i>
          <span>Custom Kitchens, Baths &amp; Structural Additions</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Home renovation across eight states</span>
          <i aria-hidden="true">✳</i>
          <span>Planning, construction &amp; the finishing details</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Fire &amp; Water Restoration</span>
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

      {/* Project services and resources */}
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
              01 / SERVICES FOR YOUR HOME
            </span>
            <span
              className="text-[11px] font-mono uppercase tracking-widest"
              style={{ color: "#1B3A6B" }}
            >
              RENOVATION · REPAIRS · RESTORATION
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
                Explore services and options for your home. Your estimate is based on the agreed scope,
                site conditions and material selections.
              </p>
            </div>

            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter residential services"
            >
              {[
                { id: "all", label: "All services" },
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
                  label: "Restoration & remodeling",
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
                    {card.planningNote}
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
        id="restoration"
        className="py-16 sm:py-24 px-4 sm:px-8 relative z-10"
        style={{ background: "#070E1A" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-10 border-b border-white/10">
            <span className="tayco-eyebrow" style={{ color: "#FDBA74" }}>
              <span className="tayco-live-dot" style={{ color: "#F97316" }} />
              02 / FIRE &amp; WATER RESTORATION
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-200">
              ASSESSMENT · REPAIRS · RECONSTRUCTION
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
                  🔥 Fire &amp; smoke restoration
                </span>
                <span className="font-mono text-xs text-amber-300">
                  CSI 02 41 00 / 06 11 00
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                Fire damage repair &amp; reconstruction
              </h3>
              <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                Review fire and smoke damage, define repairs and coordinate the rebuilding plan.
                We can help organize documentation for your insurance conversation.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Damage assessment and repair planning",
                  "Structural damage evaluation",
                  "Smoke and soot remediation",
                  "Insurance documentation and repair scope",
                  "Interior repairs and home reconstruction",
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
                  Discuss fire restoration →
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-200 border border-amber-400/40 hover:bg-white/10"
                >
                  Client project sign in →
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
                  💧 Water damage restoration
                </span>
                <span className="font-mono text-xs text-sky-300">
                  Assessment &amp; drying
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mb-3">
                Water damage repairs &amp; recovery
              </h3>
              <p className="text-sm text-slate-300 mb-5 leading-relaxed">
                From flood and leak damage to affected walls, floors and cabinetry,
                bring drying, repairs and reconstruction into one coordinated scope.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  "Water damage inspection and assessment",
                  "Moisture detection and structural drying",
                  "Mold remediation coordination",
                  "Flood and leak damage repair",
                  "Cabinetry, flooring and drywall repairs",
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
                  href="/login"
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-200 border border-amber-400/40 hover:bg-white/10"
                >
                  Client project sign in →
                </Link>
              </div>
            </div>
          </div>

          {/* TradeGallery Integration */}
          <div id="trade-catalog" className="pt-4">
            <div className="text-center mb-10">
              <div
                className="tayco-eyebrow justify-center mb-2"
                style={{ color: "#F3D37A" }}
              >
                <span className="tayco-live-dot" style={{ color: "#F97316" }} />
                SERVICE CATALOG · ILLUSTRATIVE TRADE REFERENCE
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Types of work we perform by{" "}
                <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                  Trade.
                </em>
              </h3>
            </div>
            <TradeGallery />
          </div>
        </div>
      </section>
      <section id="service-area" className="section-editorial-ivory px-4 sm:px-8 py-16">
        <div className="max-w-7xl mx-auto">
          <p className="tayco-eyebrow mb-3 text-[#1B3A6B]">Where we work</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#0F2040]">A local conversation. <em className="tayco-serif-em font-normal">A coordinated team.</em></h2>
          <p className="max-w-2xl text-sm sm:text-base text-slate-600 mt-4 mb-8">Tell us where your property is located. We will review the work, access and scheduling with you. Commercial projects outside these service areas can be discussed with our team.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANY_SERVICE_AREAS.map(area => <div key={area.code} className="tayco-living-card editorial-ivory-card p-5"><p className="tayco-eyebrow text-[#1B3A6B]">{area.code}</p><h3 className="font-bold text-[#0F2040] mt-2">{area.state}</h3><p className="text-sm text-slate-600 mt-2 leading-relaxed">{area.cities}</p></div>)}
          </div>
          <a href={COMPANY.phoneHref} className="inline-flex mt-7 font-bold text-[#0F2040] underline underline-offset-4">Discuss your location: {COMPANY.phoneDisplay}</a>
        </div>
      </section>
    </main>
  );
}
