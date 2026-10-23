"use client";
import React, { useState } from "react";
import Link from "next/link";

type ModuleFilter = "all" | "commercial" | "financial" | "tax_investor";

const TAYCO_SHOWCASE_CARDS: Array<{
  id: string;
  category: Exclude<ModuleFilter, "all">;
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
    id: "mod-00-takeoff-pro",
    category: "commercial",
    eyebrow: "MOD-00 · TAKEOFF PRO v5.0 BRIDGE",
    title: "Parametric 2D/3D Blueprint",
    serifEm: "Precision",
    subtitle: "Parametric 2D/3D Blueprint Precision",
    summary:
      "21 Rust 1.95 Kernels · 32 ARCH-D Sheets · 87 Sub-Views · $855,525.23 Son of a Star GMP",
    metric: "21 Kernels",
    metricLabel: "32 ARCH-D Sheets · 87 Sub-Views (:8085)",
    href: "/portal?invite=INV-TAYCO-MASTER",
    cta: "Launch Takeoff Pro (:8085) Bridge",
    sparkPath: "M2,30 L18,22 L34,25 L50,14 L66,16 L82,8 L98,10 L114,4",
    stroke: "#F97316",
    badgeColor: "#F97316",
  },
  {
    id: "mod-01-commercial-crm",
    category: "commercial",
    eyebrow: "MOD-01 · COMMERCIAL CRM & 3-BID LEVELING",
    title: "Multi-State Bid Pipeline &",
    serifEm: "Leveling",
    subtitle: "Multi-State Bid Pipeline & Leveling",
    summary:
      "$5.88M Active Commercial Pipeline · 15 Subcontractor Bids Leveled to $824,875.23 (-$30,650 Savings)",
    metric: "$5.88M",
    metricLabel: "15 Sub-Bids Leveled (-$30,650 Savings)",
    href: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
    cta: "Open Commercial CRM & Bid Matrix",
    sparkPath: "M2,28 L18,24 L34,26 L50,18 L66,19 L82,11 L98,13 L114,5",
    stroke: "#1B3A6B",
    badgeColor: "#C9A84C",
  },
  {
    id: "mod-02-wh347-payroll",
    category: "financial",
    eyebrow: "MOD-02 · DAVIS-BACON WH-347 PAYROLL",
    title: "Certified Field Crew",
    serifEm: "Labor Engine",
    subtitle: "Certified Field Crew Labor Engine",
    summary:
      "6,536.0 Total Man-Hours · 103.1 Crew-Days · $213,299.26 Loaded Labor across 7 CSI Crews",
    metric: "6,536.0 MH",
    metricLabel: "103.1 Crew-Days · $213,299.26 Loaded",
    href: "/portal?invite=INV-CPA-FINANCE-TAX",
    cta: "Inspect WH-347 Certified Payroll",
    sparkPath: "M2,27 L18,23 L34,19 L50,17 L66,14 L82,10 L98,8 L114,4",
    stroke: "#0F2040",
    badgeColor: "#C9A84C",
  },
  {
    id: "mod-03-quickbooks-aia",
    category: "financial",
    eyebrow: "MOD-03 · QUICKBOOKS & AIA G702/G703",
    title: "Committed POs & Progress",
    serifEm: "Billing",
    subtitle: "Committed POs & Progress Billing",
    summary:
      "8 Long-Lead Material POs ($375,012.51) · Pay App #3 $184,892.70 Net Due · .IIF & .QBO Export",
    metric: "$375,012.51",
    metricLabel: "8 Material POs · Pay App #3 $184,892.70",
    href: "/portal?invite=INV-CPA-FINANCE-TAX",
    cta: "Open AIA G702/G703 & QuickBooks Sync",
    sparkPath: "M2,26 L18,25 L34,20 L50,21 L66,13 L82,12 L98,7 L114,6",
    stroke: "#C9A84C",
    badgeColor: "#1B3A6B",
  },
  {
    id: "mod-04-tax-tero",
    category: "tax_investor",
    eyebrow: "MOD-04 · 9-STATE TAX & TRIBAL TERO",
    title: "Material vs. Labor Tax",
    serifEm: "Separation",
    subtitle: "Material vs. Labor Tax Separation",
    summary:
      "WI · IL · IA · IN · MN · MI · MO · TX · ND + MHA Nation 2.5% TERO ($21,388.13) & 1099-NEC",
    metric: "$21,388.13",
    metricLabel: "9-State Tax Engine + MHA 2.5% TERO",
    href: "/portal?invite=INV-CPA-FINANCE-TAX",
    cta: "Verify 9-State Tax & TERO Compliance",
    sparkPath: "M2,29 L18,24 L34,22 L50,16 L66,15 L82,11 L98,9 L114,5",
    stroke: "#1B3A6B",
    badgeColor: "#F97316",
  },
  {
    id: "mod-05-investor-dossier",
    category: "tax_investor",
    eyebrow: "MOD-05 · INSTITUTIONAL INVESTOR DOSSIER",
    title: "REIT Portfolio & 7/7 Pre-Flight",
    serifEm: "Audit",
    subtitle: "REIT Portfolio & 7/7 Pre-Flight Audit",
    summary:
      "24-Week S-Curve EVM (CPI 1.04) · 10% Escrow Retainage ($51,501.13) · 369 SHA-256 Line Items",
    metric: "CPI 1.04",
    metricLabel: "369 SHA-256 Items · $51,501.13 Escrow",
    href: "/portal?invite=INV-INVESTOR-PORTFOLIO",
    cta: "Open Institutional Investor Dossier",
    sparkPath: "M2,29 L18,26 L34,21 L50,15 L66,17 L82,9 L98,8 L114,3",
    stroke: "#F97316",
    badgeColor: "#0F2040",
  },
];

const LIGHT_STUDIES = [
  {
    index: 0,
    code: "STUDY 001 · SHEET A-101 (1/A101) · CSI 03 30 00 CAST-IN-PLACE 4000 PSI SLAB ($145,180.00)",
    buttonTitle:
      "STUDY 001 · SHEET A-101 (1/A101) · CSI 03 30 00 CAST-IN-PLACE 4000 PSI SLAB ($145,180.00)",
    label: "01 / SHEET A-101 (1/A101) · FF 50 / FL 35 TOLERANCE · $145,180.00",
    note: "Low-angle raking illumination across Sheet A-101 (1/A101) 4000 PSI power-troweled concrete slabs and monolithic footings ($145,180.00 CSI 03 30 00 allocation) verifies sub-millimeter flatness, control-joint geometry, and vapor-barrier curing uniformity before framing mobilization.",
    color: "#C9A84C",
    specMetric: "Sheet A-101 · 4,000 PSI · $145,180.00",
  },
  {
    index: 1,
    code: "STUDY 002 · SHEET S-201 & A-103 · CSI 06 18 00 16× LVL RIDGE BEAMS & R-56 SPRAY FOAM ($241,200.00)",
    buttonTitle:
      "STUDY 002 · SHEET S-201 & A-103 · CSI 06 18 00 16× LVL RIDGE BEAMS & R-56 SPRAY FOAM ($241,200.00)",
    label: "02 / SHEET S-201 & A-103 · 16× LVL RIDGE BEAMS & R-56 ENVELOPE · $241,200.00",
    note: "Oblique inspection across Sheets S-201 & A-103 engineered 1-3/4\"×14\" LVL structural ridge beams, Simpson HDU8 hold-downs, and closed-cell R-56 spray foam envelope verifies thermal-bridge isolation across Wisconsin, Minnesota, and North Dakota winter loads.",
    color: "#4A90D9",
    specMetric: "Sheets S-201 & A-103 · R-56 · $241,200.00",
  },
  {
    index: 2,
    code: "STUDY 003 · SHEET C-500 & PR-5 · CSI 31 23 16 8.5-FT ARCTIC FROST-BURY & GAZEBOS ($208,800.00)",
    buttonTitle:
      "STUDY 003 · SHEET C-500 & PR-5 · CSI 31 23 16 8.5-FT ARCTIC FROST-BURY & GAZEBOS ($208,800.00)",
    label: "03 / SHEET C-500 & PR-5 · 8.5-FT ARCTIC FROST-BURY & GAZEBOS · $208,800.00",
    note: "High-visibility OSHA field telemetry across Civil Sheets C-500 & PR-5 tracks 8.5-ft North Dakota sub-zero frost-bury utility trenching, E-One grinder pump stations, and heavy timber octagon gazebos ($208,800.00 verified in Takeoff Pro :8085).",
    color: "#F97316",
    specMetric: "Sheets C-500 & PR-5 · 8.5' Bury · $208,800.00",
  },
];

const VERIFIED_CONTRACTS = [
  {
    code: "PRJ-ND-001",
    name: "Son of a Star 8-Cabin Casino Resort",
    location: "New Town, ND · MHA Nation",
    division: "Commercial & Hospitality Ground-Up",
    sqft: "5,640 sq.ft. (8 Cabins + 2 Gazebos)",
    gmp: "$855,525.23",
    takeoffSpec: "32 ARCH-D Sheets · 87 Sub-Views (:8085)",
    status: "Active Field Execution · CPI 1.04",
    portalHref: "/portal?invite=INV-TAYCO-MASTER",
    estimateHref: "/estimate?project=PRJ-ND-001",
    accent: "#C9A84C",
  },
  {
    code: "PRJ-WI-002",
    name: "Park Tower Mixed-Use Structural & TI",
    location: "Milwaukee, WI",
    division: "Commercial Structural & Interior TI",
    sqft: "14,200 sq.ft.",
    gmp: "$389,192.50",
    takeoffSpec: "CSI 03 / 05 / 09 Core & Acoustic Assembly",
    status: "Active Execution · Pay App #2 Certified",
    portalHref: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
    estimateHref: "/estimate?project=PRJ-WI-002",
    accent: "#4A90D9",
  },
  {
    code: "PRJ-WI-003",
    name: "Wisconsin Ave Medical TI",
    location: "Madison, WI",
    division: "Clinical & Surgical Tenant Improvement",
    sqft: "11,800 sq.ft.",
    gmp: "$1,240,000.00",
    takeoffSpec: "CSI 09 / 10 / 22 / 26 Medical-Grade TI",
    status: "GMP Locked · 3-Bid Leveling Complete",
    portalHref: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
    estimateHref: "/estimate?project=PRJ-WI-003",
    accent: "#C9A84C",
  },
  {
    code: "PRJ-IL-004",
    name: "Chicago O'Hare Cold-Storage",
    location: "Des Plaines, IL",
    division: "Industrial Thermal Envelope & FF50 Slab",
    sqft: "42,500 sq.ft.",
    gmp: "$2,480,000.00",
    takeoffSpec: "CSI 03 30 00 Laser Slab & CSI 07 R-49 IMP",
    status: "Committed Long-Lead Steel & IMP POs",
    portalHref: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
    estimateHref: "/estimate?project=PRJ-IL-004",
    accent: "#10B981",
  },
  {
    code: "PRJ-TX-005",
    name: "Dallas 48-Unit Multi-Family Rehab",
    location: "Dallas, TX",
    division: "Multi-Family CapEx & IICRC Envelope",
    sqft: "38,400 sq.ft.",
    gmp: "$920,000.00",
    takeoffSpec: "CSI 06 / 07 / 08 / 09 Turnkey Unit Matrix",
    status: "Phase II Mobilization · 9-State Tax Synced",
    portalHref: "/portal?invite=INV-INVESTOR-PORTFOLIO",
    estimateHref: "/estimate?project=PRJ-TX-005",
    accent: "#F97316",
  },
];

export default function Home() {
  const [hovered, setHovered] = useState<"commercial" | "residential" | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<ModuleFilter>("all");
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
              ★ Primary Division · CSI-32 &amp; Takeoff Pro (:8085)
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
                Executive TI
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
                  TAYCO CONCRETE &amp; CONSTRUCTION · EST. 1995 · 9 STATES ·
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
              Residential Division · 24/7 IICRC Restoration
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

        {/* Floating TAYCO Executive Dock */}
        <div
          className="hidden xl:flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-md shadow-2xl absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
          style={{
            background: "rgba(15, 32, 64, 0.92)",
            borderColor: "rgba(201, 168, 76, 0.5)",
          }}
        >
          <span className="tayco-live-dot" style={{ color: "#F97316" }} />
          <span className="text-[11px] font-mono text-slate-200 font-semibold">
            TAYCO EXECUTIVE DOCK · 9-State Operations + Takeoff Pro (:8085)
          </span>
          <Link
            href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
            className="text-[11px] font-mono font-bold hover:text-white underline"
            style={{ color: "#F3D37A" }}
          >
            Commercial Bid Pipeline
          </Link>
          <span className="text-slate-500">·</span>
          <Link
            href="/portal?invite=INV-CPA-FINANCE-TAX"
            className="text-[11px] font-mono font-bold hover:text-white underline"
            style={{ color: "#F97316" }}
          >
            WH-347 &amp; Tax Suite
          </Link>
          <span className="text-slate-500">·</span>
          <Link
            href="/estimate"
            className="text-[11px] font-mono font-bold text-white hover:text-amber-300 underline"
          >
            CSI-32 Calculator
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
          <span>Multi-State Field Governance</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Real-Time Takeoff Pro (:8085) CSI-32 Telemetry</span>
          <i aria-hidden="true">✳</i>
          <span>24/7 IICRC Certified Restoration</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Precision Commercial Execution</span>
          <i aria-hidden="true">✳</i>
          <span>Multi-State Field Governance</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Real-Time Takeoff Pro (:8085) CSI-32 Telemetry</span>
          <i aria-hidden="true">✳</i>
          <span>24/7 IICRC Certified Restoration</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
        </div>
      </div>

      {/* ── EXECUTIVE ERP & MULTI-TENANT PORTAL RIBBON ── */}
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
                ★ TAYCO ENTERPRISE SUITE &amp; TAKEOFF PRO v5.0 (:8085)
              </span>
              <span
                className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                style={{
                  background: "rgba(201, 168, 76, 0.16)",
                  color: "#F3D37A",
                }}
              >
                WI · IL · IA · IN · MN · MI · MO · TX · ND
              </span>
            </div>
            <p className="text-white font-bold text-sm sm:text-base">
              Multi-Tenant Client Portal · Module-Scoped Invitations · CRM ·
              Davis-Bacon WH-347 Payroll · QuickBooks · 9-State Tax Engine
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/portal"
              data-magnetic
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-transform hover:scale-105 shadow-md"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              🏛️ Open Multi-Tenant Command Center →
            </Link>
            <Link
              href="/estimate"
              data-magnetic
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white border transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(201,168,76,0.55)" }}
            >
              🧮 Instant Cost Estimator
            </Link>
            <Link
              href="/portal?builder=1"
              data-magnetic
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-white border transition-colors"
              style={{
                background: "rgba(249, 115, 22, 0.2)",
                borderColor: "rgba(249, 115, 22, 0.55)",
              }}
            >
              🎟️ Module Invite Builder
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
              01 / OPEN CAPABILITY COLLECTION
            </span>
            <span
              className="text-[11px] font-mono uppercase tracking-widest"
              style={{ color: "#1B3A6B" }}
            >
              TAYCO EXECUTIVE COMMAND · LIVE TAKEOFF PRO (:8085) TELEMETRY
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
                Every field estimate, subcontractor 3-bid leveling matrix,
                Davis-Bacon WH-347 payroll log, and REIT draw schedule
                synchronizes directly with our 6-module TAYCO Executive Command
                Center and Takeoff Pro (:8085).
              </p>
            </div>

            {/* Interactive Filter Pills */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter TAYCO Executive Command Modules"
            >
              {[
                { id: "all", label: "All Modules", count: "06" },
                {
                  id: "commercial",
                  label: "Commercial & Takeoff",
                  count: "02",
                },
                {
                  id: "financial",
                  label: "Financial & Payroll",
                  count: "02",
                },
                { id: "tax_investor", label: "Tax & Investor", count: "02" },
              ].map((pill) => {
                const active = activeFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    data-magnetic
                    aria-pressed={active}
                    onClick={() => setActiveFilter(pill.id as ModuleFilter)}
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

          {/* 6 Real Executive Command Module Cards */}
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
              02 / ARCHITECTURAL LIGHT &amp; SURFACE INSPECTOR
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
              TAKEOFF PRO (:8085) ARCH-D BLUEPRINT SHEET VERIFICATION
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
                Select an audited ARCH-D sheet study from{" "}
                <span className="font-mono text-amber-300">Takeoff Pro (:8085)</span>{" "}
                and sweep the raking light incidence angle from{" "}
                <span className="font-mono text-amber-300">0°</span> to{" "}
                <span className="font-mono text-amber-300">90°</span> to inspect
                surface relief, thermal envelope continuity, and OSHA field
                telemetry.
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
                    Run CSI-32 Takeoff →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 03 / VERIFIED MULTI-STATE COMMERCIAL & RESIDENTIAL TRACK RECORD ── */}
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
              03 / VERIFIED MULTI-STATE COMMERCIAL &amp; RESIDENTIAL TRACK RECORD
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-200">
              $5,884,717.73 ACTIVE GMP PORTFOLIO · 5 AUDITED CONTRACTS
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
                Five active contracts anchored in{" "}
                <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
                  Takeoff Pro (:8085).
                </em>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
                Every contract below is backed by SHA-256 CSI-32 line items,
                certified WH-347 field labor logs, and AIA G702/G703 progress
                billing inside the TAYCO Multi-Tenant Command Center.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/portal?invite=INV-TAYCO-MASTER"
                data-magnetic
                className="px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-transform hover:scale-105"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                Open Full Portfolio Ledger →
              </Link>
              <Link
                href="/estimate"
                data-magnetic
                className="px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-white border hover:bg-white/10 transition-colors"
                style={{ borderColor: "rgba(201, 168, 76, 0.5)" }}
              >
                Launch CSI-32 Estimator →
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VERIFIED_CONTRACTS.map((contract) => (
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
                      href={contract.portalHref}
                      aria-label={`Inspect ${contract.code} in Command Center`}
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
                    {contract.division} — {contract.takeoffSpec}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-baseline justify-between gap-2 mb-3">
                    <div>
                      <div
                        className="text-2xl font-black font-mono"
                        style={{ color: "#F3D37A" }}
                      >
                        {contract.gmp}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                        {contract.status}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={contract.portalHref}
                      data-magnetic
                      className="px-3 py-2 rounded-xl text-[11px] font-black text-center transition-transform hover:scale-105"
                      style={{ background: "#C9A84C", color: "#070E1A" }}
                    >
                      Command Portal →
                    </Link>
                    <Link
                      href={contract.estimateHref}
                      data-magnetic
                      className="px-3 py-2 rounded-xl text-[11px] font-bold text-center text-white border hover:bg-white/10 transition-colors"
                      style={{ borderColor: "rgba(201, 168, 76, 0.45)" }}
                    >
                      CSI-32 Takeoff →
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
                  9-STATE RAPID MOBILIZATION
                </div>
                <h3 className="text-xl font-black text-white leading-snug">
                   $5,884,717.73 Active Pipeline{" "}
                  <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
                    Across 9 States
                  </em>
                </h3>
                <p className="text-xs text-slate-200 mt-2.5 leading-relaxed">
                  Headquartered in the Midwest with active commercial and
                  residential crews deployed across WI, IL, IA, IN, MN, MI, MO,
                  TX, and ND (MHA Nation Tribal TERO).
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
                  <span>Explore Residential &amp; 24/7 IICRC</span>
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
