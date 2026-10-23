"use client";
import React, { useState } from "react";
import Link from "next/link";
import { COMPANY } from "@/lib/company";

type ServiceFilter = "all" | "commercial" | "residential" | "partners";

const TAYCO_SHOWCASE_CARDS: Array<{
  id: string;
  category: Exclude<ServiceFilter, "all">;
  eyebrow: string;
  title: string;
  serifEm: string;
  subtitle: string;
  summary: string;
  metric: string;
  metricLabel: string;
  href: string;
  cta: string;
  sparkPath: string;
  stroke: string;
  badgeColor: string;
}> = [
  {
    "id": "service-1",
    "category": "commercial",
    "eyebrow": "01 / PLANNING",
    "title": "Clear scope.",
    "serifEm": "Better starts.",
    "subtitle": "Planning & estimates",
    "summary": "Share your plans, location and priorities. We help define the work before construction begins.",
    "metric": "Scope",
    "metricLabel": "Start with your project details",
    "href": "/estimate",
    "cta": "Request a free estimate",
    "sparkPath": "M2,30 L18,22 L34,25 L50,14 L66,16 L82,8 L98,10 L114,4",
    "stroke": "#F97316",
    "badgeColor": "#C9A84C"
  },
  {
    "id": "service-2",
    "category": "commercial",
    "eyebrow": "02 / COMMERCIAL",
    "title": "Spaces built for",
    "serifEm": "your business.",
    "subtitle": "Construction & renovation",
    "summary": "Ground-up construction, design-build, tenant improvements and construction management.",
    "metric": "Build",
    "metricLabel": "Commercial & industrial",
    "href": "/commercial",
    "cta": "Explore commercial services",
    "sparkPath": "M2,30 L18,22 L34,25 L50,14 L66,16 L82,8 L98,10 L114,4",
    "stroke": "#1B3A6B",
    "badgeColor": "#C9A84C"
  },
  {
    "id": "service-3",
    "category": "residential",
    "eyebrow": "03 / RESIDENTIAL",
    "title": "More life in",
    "serifEm": "every room.",
    "subtitle": "Renovation & additions",
    "summary": "Kitchens, bathrooms, additions and basement finishing designed around the way you use your home.",
    "metric": "Home",
    "metricLabel": "Renovation & remodeling",
    "href": "/residential",
    "cta": "Explore residential services",
    "sparkPath": "M2,30 L18,22 L34,25 L50,14 L66,16 L82,8 L98,10 L114,4",
    "stroke": "#0F2040",
    "badgeColor": "#C9A84C"
  },
  {
    "id": "service-4",
    "category": "residential",
    "eyebrow": "04 / RESTORATION",
    "title": "A clear route to",
    "serifEm": "recovery.",
    "subtitle": "Fire & water restoration",
    "summary": "Coordinate the repair scope, documentation and reconstruction after damage to your property.",
    "metric": "Restore",
    "metricLabel": "Fire, water & property repairs",
    "href": "/residential#restoration",
    "cta": "Discuss your restoration",
    "sparkPath": "M2,30 L18,22 L34,25 L50,14 L66,16 L82,8 L98,10 L114,4",
    "stroke": "#C9A84C",
    "badgeColor": "#C9A84C"
  },
  {
    "id": "service-5",
    "category": "partners",
    "eyebrow": "05 / PROPERTY OWNERS",
    "title": "One property or",
    "serifEm": "a portfolio.",
    "subtitle": "Owners & property managers",
    "summary": "Plan repairs, turnovers and renovations with a clear scope and priorities for each property.",
    "metric": "Plan",
    "metricLabel": "Property improvement programs",
    "href": "/investor",
    "cta": "Tell us about your properties",
    "sparkPath": "M2,30 L18,22 L34,25 L50,14 L66,16 L82,8 L98,10 L114,4",
    "stroke": "#1B3A6B",
    "badgeColor": "#C9A84C"
  },
  {
    "id": "service-6",
    "category": "partners",
    "eyebrow": "06 / TRADE PARTNERS",
    "title": "Good work starts with",
    "serifEm": "good people.",
    "subtitle": "Suppliers & subcontractors",
    "summary": "Tell us your trade, service area and availability so our team can review the right project opportunities.",
    "metric": "Partner",
    "metricLabel": "Trades & service coverage",
    "href": "/vendor-application",
    "cta": "Apply as a trade partner",
    "sparkPath": "M2,30 L18,22 L34,25 L50,14 L66,16 L82,8 L98,10 L114,4",
    "stroke": "#F97316",
    "badgeColor": "#C9A84C"
  }
];

const LIGHT_STUDIES = [
  {
    "index": 0,
    "code": "MATERIAL STUDY 01 · SURFACE",
    "buttonTitle": "01 / Concrete & surface texture",
    "label": "CONCRETE / SURFACE",
    "note": "Explore how changing light reveals texture. Final material selections and finish samples are reviewed for your project.",
    "color": "#C9A84C",
    "specMetric": "Concrete · Texture"
  },
  {
    "index": 1,
    "code": "MATERIAL STUDY 02 · STRUCTURE",
    "buttonTitle": "02 / Timber & structure",
    "label": "TIMBER / STRUCTURE",
    "note": "Light and shadow give form to structural rhythm. Discuss framing, detailing and finishes with the team for your space.",
    "color": "#4A90D9",
    "specMetric": "Timber · Structure"
  },
  {
    "index": 2,
    "code": "MATERIAL STUDY 03 · DETAIL",
    "buttonTitle": "03 / Shape & detail",
    "label": "DETAIL / CRAFT",
    "note": "Small details shape how a space feels. This interactive material study is a visual illustration, not an inspection or construction specification.",
    "color": "#F97316",
    "specMetric": "Shape · Detail"
  }
];

const PROJECT_STEPS = [
  {
    "code": "01",
    "name": "Tell us what matters",
    "location": "Project goals",
    "division": "Location, scope & priorities",
    "sqft": "Start a conversation",
    "headline": "Share your project",
    "phase": "Initial inquiry",
    "status": "Initial inquiry",
    "requestHref": "/estimate",
    "loginHref": "/login",
    "accent": "#C9A84C"
  },
  {
    "code": "02",
    "name": "Define the work",
    "location": "Scope & site review",
    "division": "Plans, photos & existing conditions",
    "sqft": "Review requirements",
    "headline": "Agree on the scope",
    "phase": "Planning",
    "status": "Planning",
    "requestHref": "/estimate",
    "loginHref": "/login",
    "accent": "#4A90D9"
  },
  {
    "code": "03",
    "name": "Make informed choices",
    "location": "Materials & budget",
    "division": "Selections, allowances & exclusions",
    "sqft": "Review your proposal",
    "headline": "Written proposal",
    "phase": "Estimate review",
    "status": "Estimate review",
    "requestHref": "/estimate",
    "loginHref": "/login",
    "accent": "#C9A84C"
  },
  {
    "code": "04",
    "name": "Coordinate the build",
    "location": "Construction & communication",
    "division": "Schedule, milestones & changes",
    "sqft": "Keep the work connected",
    "headline": "Project delivery",
    "phase": "Construction",
    "status": "Construction",
    "requestHref": "/estimate",
    "loginHref": "/login",
    "accent": "#10B981"
  },
  {
    "code": "05",
    "name": "Finish with clarity",
    "location": "Review & handover",
    "division": "Walk-through, final details & records",
    "sqft": "Confirm completion",
    "headline": "Finished space",
    "phase": "Closeout",
    "status": "Closeout",
    "requestHref": "/estimate",
    "loginHref": "/login",
    "accent": "#F97316"
  }
];

export default function Home() {
  const [hovered, setHovered] = useState<"commercial" | "residential" | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<ServiceFilter>("all");
  const [activeStudy, setActiveStudy] = useState<number>(0);
  const [lightAngle, setLightAngle] = useState<number>(45);

  const commercialFlex =
    hovered === "residential"
      ? "0 0 38%"
      : hovered === "commercial"
        ? "0 0 62%"
        : "0 0 50%";
  const residentialFlex =
    hovered === "commercial"
      ? "0 0 38%"
      : hovered === "residential"
        ? "0 0 62%"
        : "0 0 50%";

  const filteredCards =
    activeFilter === "all"
      ? TAYCO_SHOWCASE_CARDS
      : TAYCO_SHOWCASE_CARDS.filter((c) => c.category === activeFilter);

  const currentStudy = LIGHT_STUDIES[activeStudy] ?? LIGHT_STUDIES[0];
  const lightX = Math.round(18 + (lightAngle / 90) * 68);
  const lightY = Math.round(62 - Math.sin((lightAngle * Math.PI) / 180) * 38);
  const beamX = Math.round(20 + (lightAngle / 90) * 60);

  return (
    <main
      className="relative flex flex-col"
      style={
        {
          minHeight: "calc(100svh - 64px)",
          marginTop: "64px",
          background: "#070E1A",
          "--light-angle": `${lightAngle}deg`,
        } as React.CSSProperties
      }
    >
      <h1 className="sr-only">{COMPANY.name} · Construction, renovation &amp; restoration</h1>
      {/* ── SPLIT HERO 50/50 WITH ORBITAL EDITORIAL STAMP ── */}
      <div
        className="relative flex-1 flex flex-col md:flex-row overflow-hidden"
        style={{ minHeight: "76svh" }}
      >
        {/* ── COMMERCIAL (LEFT / TOP) ── */}
        <Link
          href="/commercial"
          className="relative flex flex-col items-center justify-center overflow-hidden group py-12"
          style={{
            flex: commercialFlex,
            background:
              "linear-gradient(145deg, #070E1A 0%, #0F2040 55%, #1B3A6B 100%)",
            transition: "flex 0.45s cubic-bezier(0.4,0,0.2,1)",
            minHeight: "50%",
          }}
          onMouseEnter={() => setHovered("commercial")}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          {/* Blueprint grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Gold accent line */}
          <div
            className="absolute left-0 top-0 bottom-0 hidden md:block w-1.5"
            style={{ background: "#C9A84C" }}
          />
          <div
            className="absolute left-0 right-0 top-0 md:hidden h-1.5"
            style={{ background: "#C9A84C" }}
          />

          <div className="relative z-10 text-center px-6 sm:px-12 max-w-md">
            <div
              className="tayco-eyebrow mb-4 mx-auto justify-center"
              style={{ color: "#F3D37A" }}
            >
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              ★ Primary Service · Commercial Construction
            </div>

            <div className="text-5xl mb-3">🏢</div>

            <h2
              className="font-black tracking-tight text-white mb-2"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                lineHeight: 1.05,
              }}
            >
              COMMERCIAL
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: "#C9A84C" }}
            >
              Ground-Up, Turnkey &amp;{" "}
              <em
                className="tayco-serif-em text-sm"
                style={{ color: "#F3D37A" }}
              >
                Tenant Improvements
              </em>
            </p>

            <p className="text-slate-200 text-sm leading-relaxed mb-7 max-w-[320px] mx-auto">
              Ground-Up Construction · Design-Build Services
              <br />
              General Contracting · Construction Management
              <br />
              Tenant Improvements · Mixed-Use · Industrial
            </p>

            <div
              data-magnetic
              className="inline-flex items-center gap-2 font-black px-7 py-3 rounded-xl text-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              View Commercial Services <span>→</span>
            </div>
          </div>
        </Link>

        {/* Divider */}
        <div
          className="hidden md:block w-px shrink-0"
          style={{ background: "rgba(201,168,76,0.35)" }}
        />
        <div
          className="md:hidden h-px shrink-0"
          style={{ background: "rgba(201,168,76,0.35)" }}
        />

        {/* ── ROTATING ORBITAL EDITORIAL STAMP (CENTER / TOP-RIGHT) ── */}
        <div
          className="hidden md:flex position-absolute items-center justify-center pointer-events-none"
          style={{
            position: "absolute",
            top: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 25,
          }}
          aria-hidden="true"
        >
          <div className="orbital-caption rounded-full bg-slate-950/75 backdrop-blur-md border border-amber-400/35 shadow-2xl p-1">
            <svg viewBox="0 0 120 120">
              <defs>
                <path
                  id="tayco-orbit-path"
                  d="M 60, 60 m -44, 0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
                />
              </defs>
              <text>
                <textPath href="#tayco-orbit-path" startOffset="0%">
                  TAYCO LLC · CONSTRUCTION &amp; RENOVATION · 8 STATES ·
                </textPath>
              </text>
            </svg>
            <span>✳</span>
          </div>
        </div>

        {/* ── RESIDENTIAL (RIGHT / BOTTOM) ── */}
        <Link
          href="/residential"
          className="relative flex flex-col items-center justify-center overflow-hidden group py-12"
          style={{
            flex: residentialFlex,
            background:
              "linear-gradient(145deg, #0F2040 0%, #1B3A6B 60%, #234B88 100%)",
            transition: "flex 0.45s cubic-bezier(0.4,0,0.2,1)",
            minHeight: "50%",
          }}
          onMouseEnter={() => setHovered("residential")}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          {/* Right Orange Safety Accent Line */}
          <div
            className="absolute right-0 top-0 bottom-0 hidden md:block w-1.5"
            style={{ background: "#F97316" }}
          />
          <div className="relative z-10 text-center px-6 sm:px-12 max-w-md">
            <div
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-4"
              style={{
                background: "rgba(249, 115, 22, 0.16)",
                color: "#FDBA74",
                border: "1px solid rgba(249, 115, 22, 0.45)",
              }}
            >
              <span className="tayco-live-dot" style={{ color: "#F97316" }} />
              Residential Division · Fire & Water Restoration
            </div>

            <div className="text-5xl mb-3">🏠</div>

            <h2
              className="font-black tracking-tight text-white mb-2"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                lineHeight: 1.05,
              }}
            >
              RESIDENTIAL
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: "#F3D37A" }}
            >
              Renovation &amp;{" "}
              <em
                className="tayco-serif-em text-sm"
                style={{ color: "#F97316" }}
              >
                Rapid Recovery
              </em>
            </p>

            <p className="text-slate-200 text-sm leading-relaxed mb-7 max-w-[320px] mx-auto">
              Full-scale home renovations · Kitchen &amp; bath remodels ·
              Structural additions · Certified fire &amp; water damage
              restoration
            </p>

            <div
              data-magnetic
              className="inline-flex items-center gap-2 font-black px-7 py-3 rounded-xl text-sm transition-all duration-200 group-hover:scale-105 shadow-lg"
              style={{
                background: "#F97316",
                color: "#ffffff",
              }}
            >
              View Residential Services <span>→</span>
            </div>
          </div>
        </Link>

        {/* Project services and resources */}
        <div
          className="hidden xl:flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-md shadow-2xl absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
          style={{
            background: "rgba(15, 32, 64, 0.92)",
            borderColor: "rgba(201, 168, 76, 0.5)",
          }}
        >
          <span className="tayco-live-dot" style={{ color: "#F97316" }} />
          <span className="text-[11px] font-mono text-slate-200 font-semibold">
            YOUR NEXT PROJECT STARTS HERE
          </span>
          <Link
            href="/login"
            className="text-[11px] font-mono font-bold hover:text-white underline"
            style={{ color: "#F3D37A" }}
          >
            Client sign in
          </Link>
          <span className="text-slate-500">·</span>
          <Link
            href="/login"
            className="text-[11px] font-mono font-bold hover:text-white underline"
            style={{ color: "#F97316" }}
          >
            Team & supplier sign in
          </Link>
          <span className="text-slate-500">·</span>
          <Link
            href="/estimate"
            className="text-[11px] font-mono font-bold text-white hover:text-amber-300 underline"
          >
            Request an estimate
          </Link>
        </div>
      </div>

      {/* ── EDITORIAL ITALIC KINETIC MARQUEE TICKER ── */}
      <div
        className="tayco-editorial-ticker"
        aria-label="TAYCO Operational Highlights"
      >
        <div>
          <span className="gold">Precision Commercial Execution</span>
          <i aria-hidden="true">✳</i>
          <span>Commercial & Residential</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Clear scopes. Thoughtful construction.</span>
          <i aria-hidden="true">✳</i>
          <span>Fire & Water Restoration</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Precision Commercial Execution</span>
          <i aria-hidden="true">✳</i>
          <span>Commercial & Residential</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Clear scopes. Thoughtful construction.</span>
          <i aria-hidden="true">✳</i>
          <span>Fire & Water Restoration</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
        </div>
      </div>

      {/* Project services and resources */}
      <section
        id="home-erp-suite-ribbon"
        className="border-b px-4 sm:px-8 py-5 relative z-10"
        style={{
          background:
            "linear-gradient(90deg, #070E1A 0%, #0F2040 50%, #1B3A6B 100%)",
          borderColor: "rgba(201,168,76,0.35)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-1">
              <span className="tayco-eyebrow" style={{ color: "#F3D37A" }}>
                <span className="tayco-live-dot" style={{ color: "#F97316" }} />
                TAYCO LLC · FULL-SERVICE CONSTRUCTION
              </span>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  background: "rgba(201, 168, 76, 0.16)",
                  color: "#F3D37A",
                }}
              >
                {COMPANY.coverage}
              </span>
            </div>
            <p className="text-white font-bold text-sm sm:text-base">
              Commercial construction, home renovations and restoration.
              Tell us what you need and where you need it.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/login"
              data-magnetic
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-transform hover:scale-105 shadow-md"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              Project portal sign in →
            </Link>
            <Link
              href="/estimate"
              data-magnetic
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white border transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(201,168,76,0.55)" }}
            >
              Request a free estimate
            </Link>
            <Link
              href="/login"
              data-magnetic
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-white border transition-colors"
              style={{
                background: "rgba(249, 115, 22, 0.2)",
                borderColor: "rgba(249, 115, 22, 0.55)",
              }}
            >
              Trade partner sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ── SVG CHROMATIC HORIZON WAVE INTO WARM EDITORIAL IVORY ── */}
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

      {/* ── 01 / WARM EDITORIAL IVORY CAPABILITY COLLECTION ── */}
      <section
        id="tayco-operations-showcase"
        className="section-editorial-ivory py-16 sm:py-20 px-4 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Editorial Top Row */}
          <div
            className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-8 border-b"
            style={{ borderColor: "rgba(27, 58, 107, 0.16)" }}
          >
            <span
              className="tayco-eyebrow font-bold"
              style={{ color: "#1B3A6B" }}
            >
              <span className="tayco-live-dot" style={{ color: "#F97316" }} />
              01 / WHAT WE CAN BUILD TOGETHER
            </span>
            <span
              className="text-[11px] font-mono uppercase tracking-widest"
              style={{ color: "#1B3A6B" }}
            >
              CONSTRUCTION · RENOVATION · RESTORATION
            </span>
          </div>

          {/* Editorial Heading + Filter Pills */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
            <div>
              <h2
                className="font-black tracking-tight"
                style={{
                  color: "#0F2040",
                  fontSize: "clamp(2.2rem, 4.5vw, 3.75rem)",
                  lineHeight: 1.02,
                }}
              >
                Blueprints that take{" "}
                <em
                  className="tayco-serif-em font-normal"
                  style={{ color: "#1B3A6B" }}
                >
                  physical form.
                </em>
              </h2>
              <p
                className="text-sm sm:text-base mt-3 max-w-2xl leading-relaxed"
                style={{ color: "#334155" }}
              >
                From a single room to a commercial property, find the right team for the work.
                Explore our services or tell us about your project.
              </p>
            </div>

            {/* Interactive Filter Pills */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter TAYCO services"
            >
              {[
                { id: "all", label: "All services", count: "06" },
                {
                  id: "commercial",
                  label: "Commercial",
                  count: "02",
                },
                {
                  id: "residential",
                  label: "Home & restoration",
                  count: "02",
                },
                { id: "partners", label: "Property & partners", count: "02" },
              ].map((pill) => {
                const active = activeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    data-magnetic
                    aria-pressed={active}
                    onClick={() => setActiveFilter(pill.id as ServiceFilter)}
                    className="px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer border"
                    style={{
                      background: active ? "#0F2040" : "rgba(255,255,255,0.75)",
                      color: active ? "#F3D37A" : "#0F2040",
                      borderColor: active
                        ? "#0F2040"
                        : "rgba(27, 58, 107, 0.28)",
                      boxShadow: active
                        ? "0 10px 24px -10px rgba(15, 32, 64, 0.55)"
                        : "none",
                    }}
                  >
                    {pill.label}
                    <sup className="ml-1 text-[10px] opacity-80">
                      ({pill.count})
                    </sup>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project services and resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div
                key={card.id}
                data-response-kind="surface"
                className="tayco-living-card editorial-ivory-card p-6 flex flex-col justify-between group"
              >
                <div className="preview-orbits" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div
                      className="tayco-eyebrow font-bold"
                      style={{ color: "#1B3A6B" }}
                    >
                      <span
                        className="tayco-live-dot"
                        style={{ color: card.badgeColor }}
                      />
                      {card.eyebrow}
                    </div>
                    <Link
                      href={card.href}
                      aria-label={card.cta}
                      className="project-open"
                    >
                      ↗
                    </Link>
                  </div>

                  <h3
                    className="text-xl font-black leading-snug"
                    style={{ color: "#0F2040" }}
                  >
                    {card.title}{" "}
                    <em
                      className="tayco-serif-em font-normal"
                      style={{ color: "#1B3A6B" }}
                    >
                      {card.serifEm}
                    </em>
                  </h3>
                  <div
                    className="text-[11px] font-mono font-bold uppercase tracking-wider mt-1"
                    style={{ color: "#C9A84C" }}
                  >
                    {card.subtitle}
                  </div>
                  <p
                    className="text-xs mt-2.5 leading-relaxed font-medium"
                    style={{ color: "#334155" }}
                  >
                    {card.summary}
                  </p>
                </div>

                <div
                  className="relative z-10 mt-6 pt-4 border-t"
                  style={{ borderColor: "rgba(27, 58, 107, 0.14)" }}
                >
                  <div className="flex items-end justify-between gap-2 mb-4">
                    <div>
                      <div
                        className="text-xl font-black font-mono"
                        style={{ color: card.stroke }}
                      >
                        {card.metric}
                      </div>
                      <div
                        className="text-[10px] font-mono uppercase tracking-wider font-semibold"
                        style={{ color: "#475569" }}
                      >
                        {card.metricLabel}
                      </div>
                    </div>
                    <svg
                      width="116"
                      height="34"
                      viewBox="0 0 116 34"
                      fill="none"
                      aria-hidden="true"
                      className="shrink-0"
                    >
                      <path
                        d={card.sparkPath}
                        stroke={card.stroke}
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <Link
                    href={card.href}
                    data-magnetic
                    className="inline-flex items-center justify-between w-full text-xs font-extrabold px-4 py-2.5 rounded-xl border transition-all"
                    style={{
                      background: "#0F2040",
                      color: "#F3D37A",
                      borderColor: "#1B3A6B",
                    }}
                  >
                    <span>{card.cta}</span>
                    <span style={{ color: "#F97316" }}>→</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVERSE SVG CHROMATIC HORIZON WAVE BACK INTO DEEP STRUCTURAL NAVY ── */}
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

      {/* ── 02 / INTERACTIVE ARCHITECTURAL LIGHT & SURFACE INSPECTOR ── */}
      <section
        id="tayco-light-studio"
        data-light-table
        data-study={activeStudy}
        className="py-16 sm:py-24 px-4 sm:px-8 relative z-10"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, rgba(201, 168, 76, 0.14), transparent 55%), radial-gradient(circle at 85% 80%, rgba(27, 58, 107, 0.45), transparent 60%), #070E1A",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-10 border-b border-white/10">
            <span className="tayco-eyebrow" style={{ color: "#F3D37A" }}>
              <span className="tayco-live-dot" style={{ color: "#F97316" }} />
              02 / MATERIALS IN A DIFFERENT LIGHT
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
              AN INTERACTIVE MATERIAL STUDY
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Controls Column */}
            <div className="lg:col-span-5">
              <h2
                className="font-black text-white tracking-tight"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.3rem)",
                  lineHeight: 1.05,
                }}
              >
                Every slab &amp; finish changes{" "}
                <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                  under raking light.
                </em>
              </h2>
              <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                Choose a material study and move the light from{" "}
                <span className="font-mono text-amber-300">0°</span> to{" "}
                <span className="font-mono text-amber-300">90°</span> to inspect
                texture, form and shadow. Use this illustration to start a conversation about your finishes.
              </p>

              {/* 3 Study Switcher Buttons */}
              <div
                className="flex flex-col gap-2.5 my-7"
                role="group"
                aria-label="Choose Architectural Light Study"
              >
                {LIGHT_STUDIES.map((study) => {
                  const selected = activeStudy === study.index;
                  return (
                    <button
                      key={study.index}
                      type="button"
                      data-magnetic
                      aria-pressed={selected}
                      onClick={() => setActiveStudy(study.index)}
                      className="w-full text-left px-4 py-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer"
                      style={{
                        background: selected
                          ? "rgba(27, 58, 107, 0.75)"
                          : "rgba(15, 32, 64, 0.55)",
                        borderColor: selected
                          ? study.color
                          : "rgba(255, 255, 255, 0.12)",
                        boxShadow: selected
                          ? `0 12px 28px -14px ${study.color}66`
                          : "none",
                      }}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            background: study.color,
                            boxShadow: selected
                              ? `0 0 12px ${study.color}`
                              : "none",
                          }}
                        />
                        <span
                          className="text-xs font-mono font-bold leading-snug"
                          style={{
                            color: selected ? "#ffffff" : "#CBD5E1",
                          }}
                        >
                          {study.buttonTitle}
                        </span>
                      </span>
                      <span
                        className="font-mono text-xs shrink-0"
                        style={{ color: study.color }}
                      >
                        ↗
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Light Incidence Angle Slider */}
              <div
                className="p-4 rounded-2xl border"
                style={{
                  background: "rgba(15, 32, 64, 0.72)",
                  borderColor: "rgba(201, 168, 76, 0.35)",
                }}
              >
                <label
                  htmlFor="tayco-light-angle-slider"
                  className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-200 mb-2"
                >
                  <span>☀️ Raking Light Angle: {lightAngle}°</span>
                  <output
                    htmlFor="tayco-light-angle-slider"
                    className="font-black text-sm px-2.5 py-0.5 rounded"
                    style={{
                      background: "rgba(201, 168, 76, 0.18)",
                      color: "#F3D37A",
                    }}
                  >
                    {lightAngle}°
                  </output>
                </label>
                <input
                  id="tayco-light-angle-slider"
                  type="range"
                  min={0}
                  max={90}
                  value={lightAngle}
                  onChange={(e) => setLightAngle(Number(e.target.value))}
                  className="w-full h-2 rounded-lg cursor-ew-resize accent-amber-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                  <span>0° Low Horizon Grazing</span>
                  <span>45° Oblique Inspection</span>
                  <span>90° Zenith Overhead</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Surface Stage */}
            <div className="lg:col-span-7">
              <div
                data-response-kind="surface"
                className="tayco-living-card light-experiment"
                style={
                  {
                    "--study-color": currentStudy.color,
                    "--incidence": `${lightAngle}deg`,
                    "--light-x": `${lightX}%`,
                    "--light-y": `${lightY}%`,
                    "--beam-x": `${beamX}%`,
                  } as React.CSSProperties
                }
              >
                <div className="light-surface" aria-hidden="true">
                  <div
                    className="light-disc"
                    style={{
                      borderRadius:
                        activeStudy === 1
                          ? "16%"
                          : activeStudy === 2
                            ? "42% 56% 38% 58%"
                            : "50%",
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <i
                        key={i}
                        style={{ "--i": i } as React.CSSProperties}
                      />
                    ))}
                  </div>
                  <div className="light-beam" />
                  <span className="absolute top-4 left-5 font-mono text-sm text-white/40">
                    +
                  </span>
                  <span className="absolute bottom-4 right-5 font-mono text-sm text-white/40">
                    +
                  </span>
                  <span
                    className="absolute top-4 right-5 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full border"
                    style={{
                      background: "rgba(7, 14, 26, 0.78)",
                      borderColor: currentStudy.color,
                      color: currentStudy.color,
                    }}
                  >
                    {currentStudy.specMetric} · {lightAngle}°
                  </span>
                  <span className="absolute bottom-4 left-5 font-mono text-[10px] tracking-widest text-slate-300 uppercase">
                    {currentStudy.code}
                  </span>
                </div>

                <div
                  className="pt-5 px-2 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  aria-live="polite"
                >
                  <div>
                    <div
                      className="tayco-eyebrow"
                      style={{ color: currentStudy.color }}
                    >
                      {currentStudy.label}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed max-w-2xl">
                      {currentStudy.note}
                    </p>
                  </div>
                  <Link
                    href="/estimate"
                    data-magnetic
                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-transform hover:scale-105 text-center"
                    style={{ background: "#C9A84C", color: "#070E1A" }}
                  >
                    Discuss your project →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project services and resources */}
      <section
        id="tayco-verified-track-record"
        className="py-16 sm:py-24 px-4 sm:px-8 border-t relative z-10"
        style={{
          background:
            "linear-gradient(180deg, #070E1A 0%, #0F2040 55%, #070E1A 100%)",
          borderColor: "rgba(201, 168, 76, 0.28)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-10 border-b border-white/10">
            <span className="tayco-eyebrow" style={{ color: "#F3D37A" }}>
              <span className="tayco-live-dot" style={{ color: "#10B981" }} />
              03 / FROM FIRST CONVERSATION TO FINISHED SPACE
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-200">
              A CLEAR PATH FOR YOUR PROJECT
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
            <div>
              <h2
                className="font-black text-white tracking-tight"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  lineHeight: 1.05,
                }}
              >
                Good projects begin with{" "}
                <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
                  a shared plan.
                </em>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
                Here is how we approach a project. The specific scope, schedule and responsibilities
                are agreed with you before work begins.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/estimate"
                data-magnetic
                className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-transform hover:scale-105"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                Start a project conversation →
              </Link>
              <Link
                href="/login"
                data-magnetic
                className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white border hover:bg-white/10 transition-colors"
                style={{ borderColor: "rgba(201, 168, 76, 0.5)" }}
              >
                Existing client sign in →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROJECT_STEPS.map((contract) => (
              <div
                key={contract.code}
                data-response-kind="surface"
                className="tayco-living-card p-6 rounded-2xl flex flex-col justify-between group"
                style={{
                  background:
                    "linear-gradient(155deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.96) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.3)",
                }}
              >
                <div className="preview-orbits" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className="font-mono text-xs font-black px-2.5 py-1 rounded-full border"
                      style={{
                        background: "rgba(201, 168, 76, 0.14)",
                        borderColor: contract.accent,
                        color: "#F3D37A",
                      }}
                    >
                      {contract.code}
                    </span>
                    <Link
                      href={contract.requestHref}
                      aria-label={`Discuss ${contract.name.toLowerCase()}`}
                      className="project-open"
                    >
                      ↗
                    </Link>
                  </div>

                  <h3 className="text-lg font-black text-white leading-snug">
                    {contract.code} · {contract.name}
                  </h3>
                  <div className="text-xs font-mono text-amber-300 mt-1">
                    {contract.location} · {contract.sqft}
                  </div>
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    {contract.division} — {contract.phase}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-baseline justify-between gap-2 mb-3">
                    <div>
                      <div
                        className="text-2xl font-black font-mono"
                        style={{ color: "#F3D37A" }}
                      >
                        {contract.headline}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                        {contract.status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={contract.requestHref}
                      data-magnetic
                      className="px-3 py-2 rounded-xl text-[11px] font-black text-center transition-transform hover:scale-105"
                      style={{ background: "#C9A84C", color: "#070E1A" }}
                    >
                      Request an estimate →
                    </Link>
                    <Link
                      href={contract.loginHref}
                      data-magnetic
                      className="px-3 py-2 rounded-xl text-[11px] font-bold text-center text-white border hover:bg-white/10 transition-colors"
                      style={{ borderColor: "rgba(201, 168, 76, 0.45)" }}
                    >
                      Client sign in →
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* 6th Summary Card: Multi-State Dispatch & Instant Estimate */}
            <div
              data-response-kind="surface"
              className="tayco-living-card p-6 rounded-2xl flex flex-col justify-between group"
              style={{
                background:
                  "linear-gradient(145deg, rgba(27, 58, 107, 0.92) 0%, rgba(15, 32, 64, 0.98) 100%)",
                borderColor: "rgba(249, 115, 22, 0.5)",
              }}
            >
              <div className="preview-orbits" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>

              <div className="relative z-10">
                <div className="tayco-eyebrow mb-3" style={{ color: "#FDBA74" }}>
                  <span className="tayco-live-dot" style={{ color: "#F97316" }} />
                  SERVING EIGHT STATES
                </div>
                <h3 className="text-xl font-black text-white leading-snug">
                   Your next project{" "}
                  <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
                    Across 8 States
                  </em>
                </h3>
                <p className="text-xs text-slate-200 mt-2.5 leading-relaxed">
                  We serve WI, IL, IA, IN, MN, MI, MO and TX.
                  Contact us to confirm your location, project scope and scheduling.
                </p>
              </div>

              <div className="relative z-10 mt-6 pt-4 border-t border-white/15 space-y-2">
                <Link
                  href="/commercial"
                  data-magnetic
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-black"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  <span>Explore Commercial Division</span>
                  <span>→</span>
                </Link>
                <Link
                  href="/residential"
                  data-magnetic
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-black text-white"
                  style={{ background: "#F97316" }}
                >
                  <span>Explore Residential Services</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
