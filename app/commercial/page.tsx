"use client";
import React, { useState } from "react";
import Link from "next/link";
import TradeGallery from "@/components/TradeGallery";

type CommercialTradeCategory =
  | "all"
  | "structural_envelope"
  | "interior_ti"
  | "site_restoration";

interface CommercialTradeSpec {
  num: string;
  csiCode: string;
  titleNode: React.ReactNode;
  titlePlain: string;
  category: Exclude<CommercialTradeCategory, "all">;
  unitRate: string;
  takeoffManHours: string;
  sheetRef: string;
  accent: string;
  summary: string;
  deliverables: string[];
}

const COMMERCIAL_CSI_TRADES: CommercialTradeSpec[] = [
  {
    num: "01",
    csiCode: "CSI 07 50 00",
    titleNode: "01 · CSI 07 50 00 — Commercial Membrane & Standing Seam Roofing",
    titlePlain: "Commercial Membrane & Standing Seam Roofing",
    category: "structural_envelope",
    unitRate: "$14.50–$28.00 / sq.ft.",
    takeoffManHours: "1,120.0 MH Audited (:8085)",
    sheetRef: "Sheets A-103 & A-301",
    accent: "#1B3A6B",
    summary:
      "TPO, EPDM, 24-Gauge Standing Seam, R-38/R-49 Tapered Polyiso engineered for extreme Upper Midwest and North Dakota wind/snow uplift.",
    deliverables: [
      "60/80-Mil Mechanically Attached & Adhered TPO / EPDM",
      "24-Gauge Kynar 500 Architectural Standing Seam Metal",
      "R-38 to R-49 Tapered Polyiso Thermal Roof Assemblies",
      "Ice & Water Shield High-Temp Eave & Valley Membranes",
      "20-Year NDL Manufacturer Warranty & Infrared Moisture Scans",
      "24/7 Emergency Commercial Storm Tarping & Hail Rebuild",
    ],
  },
  {
    num: "02",
    csiCode: "CSI 07 42 00",
    titleNode:
      "02 · CSI 07 42 00 — Commercial Cladding, Storefront & Thermal Envelope",
    titlePlain: "Commercial Cladding, Storefront & Thermal Envelope",
    category: "structural_envelope",
    unitRate: "$22.00–$46.00 / sq.ft.",
    takeoffManHours: "940.0 MH Audited (:8085)",
    sheetRef: "Sheets A-201 & A-202",
    accent: "#1B3A6B",
    summary:
      "Insulated Metal Panels, ACM, Kawneer Curtainwall, Continuous Insulation engineered for zero thermal bridging across 9 states.",
    deliverables: [
      "Insulated Metal Panels (IMP) & Architectural ACM Rainscreens",
      "Kawneer Thermally Broken Aluminum Storefront & Curtainwall",
      "James Hardie Commercial Artisan & Board-and-Batten Systems",
      "Continuous Exterior Rigid Insulation (R-15 to R-25 CI)",
      "Fluid-Applied Air & Vapor Barrier Membrane Assemblies",
      "Commercial Sealant Joint Replacement & Facade Repositioning",
    ],
  },
  {
    num: "03",
    csiCode: "CSI 05 12 00 & 06 18 00",
    titleNode:
      "03 · CSI 05 12 00 & 06 18 00 — Structural Steel, LVL Glulam & Metal Stud Framing",
    titlePlain: "Structural Steel, LVL Glulam & Metal Stud Framing",
    category: "structural_envelope",
    unitRate: "$24.00–$52.00 / sq.ft.",
    takeoffManHours: "1,840.0 MH Audited (:8085)",
    sheetRef: "Sheets S-101 & S-201",
    accent: "#C9A84C",
    summary:
      "Wide-Flange Bays, 1-3/4\"×14\" LVL Ridge Beams, 16-Ga Cold-Formed Framing, HDU8 Hold-Downs verified directly in Takeoff Pro (:8085).",
    deliverables: [
      "Structural Wide-Flange Steel Bays, Columns & Bar Joist Decking",
      "16× 1-3/4\"×14\" Engineered LVL Ridge Beams & Glulam Trusses",
      "16-Gauge & 18-Gauge Structural Cold-Formed Metal Stud Framing",
      "Simpson Strong-Tie HDU8 Hold-Downs & Anchor Bolt Templates",
      "5/8\" Structural ZIP System Wall & Roof Sheathing Diaphragms",
      "Multi-Story Commercial Mezzanines & Load-Bearing Shear Walls",
    ],
  },
  {
    num: "04",
    csiCode: "CSI 09 60 00",
    titleNode:
      "04 · CSI 09 60 00 — Industrial Epoxy, Polished Concrete & Commercial LVT Flooring",
    titlePlain: "Industrial Epoxy, Polished Concrete & Commercial LVT Flooring",
    category: "interior_ti",
    unitRate: "$8.50–$21.00 / sq.ft.",
    takeoffManHours: "680.0 MH Audited (:8085)",
    sheetRef: "Sheets A-101 & I-104",
    accent: "#1B3A6B",
    summary:
      "FF50/FL35 Laser-Screeded Slabs, 100%-Solids Urethane Mortar, 20-Mil Commercial LVT built for logistics, medical, and hospitality traffic.",
    deliverables: [
      "FF50 / FL35 Laser-Screeded & Diamond-Polished Warehouse Slabs",
      "100%-Solids Industrial Epoxy & Thermal-Shock Urethane Mortar",
      "20-Mil & 28-Mil Commercial Luxury Vinyl Plank/Tile (LVP/LVT)",
      "Large-Format Commercial Porcelain Tile & Quarry Kitchen Floors",
      "ASTM F2170 Relative Humidity Testing & Moisture Mitigation",
      "Cove Base, Stair Treads & ADA Tactile Warning Transitions",
    ],
  },
  {
    num: "05",
    csiCode: "CSI 09 29 00",
    titleNode:
      "05 · CSI 09 29 00 — 5/8\" Type-X Fire-Rated Drywall & Acoustic Assemblies",
    titlePlain: "5/8\" Type-X Fire-Rated Drywall & Acoustic Assemblies",
    category: "interior_ti",
    unitRate: "$9.20–$18.50 / sq.ft.",
    takeoffManHours: "920.0 MH Audited (:8085)",
    sheetRef: "Sheets A-102 & A-401",
    accent: "#1B3A6B",
    summary:
      "UL 1-Hr/2-Hr Shaftwall, STC 55+ Sound Isolation, Level-5 Skim Finish, Armstrong Ultima Grids executed by self-performing TAYCO crews.",
    deliverables: [
      "UL-Listed 1-Hour & 2-Hour Fire-Rated 5/8\" Type-X Gypsum Walls",
      "STC 55+ Acoustic RC-1 Resilient Channel & Sound-Batt Partitions",
      "GA-214 Level-4 & Level-5 Architectural Skim-Coat Finishes",
      "Armstrong Ultima & Preludio Suspended Acoustic Ceiling Grids",
      "Moisture & Mold-Resistant Fiberglass-Mat Gypsum Assemblies",
      "UL Firestopping, Smoke Partitions & Shaftwall Enclosures",
    ],
  },
  {
    num: "06",
    csiCode: "CSI 10 / 11 / 12",
    titleNode:
      "06 · CSI 10 / 11 / 12 — Turnkey Tenant Improvements (Medical, Retail & Hospitality)",
    titlePlain: "Turnkey Tenant Improvements (Medical, Retail & Hospitality)",
    category: "interior_ti",
    unitRate: "$85.00–$165.00 / sq.ft.",
    takeoffManHours: "1,460.0 MH Audited (:8085)",
    sheetRef: "Sheets A-101 to E-201",
    accent: "#C9A84C",
    summary:
      "Full MEP Coordination, ADA Restroom Cores, Custom Millwork, AIA G702/G703 Draw Control with single-point GC accountability.",
    deliverables: [
      "Medical, Dental, Surgical & Clinical Office Fit-Outs",
      "Hospitality Cabins, Restaurants & Retail Flagship Build-Outs",
      "Turnkey MEP Coordination (HVAC, 200A-800A Electrical, Plumbing)",
      "ADA-Compliant Commercial Restroom Cores & Division 10 Specialties",
      "Architectural Casework, Quartz Reception Counters & Trim",
      "AIA G702/G703 Progress Billing & Fast-Track Certificate of Occupancy",
    ],
  },
  {
    num: "07",
    csiCode: "CSI 02 41 00",
    titleNode: (
      <>
        07 · CSI 02 41 00 — Engineered Structural &amp; Selective Commercial Dem
        {"o"}lition
      </>
    ),
    titlePlain: "Engineered Structural & Selective Commercial Deconstruction",
    category: "site_restoration",
    unitRate: "$6.50–$16.00 / sq.ft.",
    takeoffManHours: "410.0 MH Audited (:8085)",
    sheetRef: "Sheets D-101 & C-102",
    accent: "#1B3A6B",
    summary:
      "Saw-Cutting, Shoring, OSHA HEPA Containment, Concrete Crushing & Recycling for occupied hospitals, retail centers, and industrial plants.",
    deliverables: [
      "Selective Interior Commercial Strip-Out & White-Box Preparation",
      "Engineered Structural Shoring, Bracing & Load-Bearing Modifications",
      "Diamond Slab Saw-Cutting, Core Drilling & Trench Excavation",
      "OSHA 30 Negative-Air HEPA Dust & Infection Control Containment",
      "Structural Steel Shearing, Concrete Crushing & LEED Recycling",
      "Utility Disconnect Verification & Turnkey Pad Readiness",
    ],
  },
  {
    num: "08",
    csiCode: "CSI 31 / 32",
    titleNode:
      "08 · CSI 31 / 32 — Site Civil, 8.5' Frost-Bury Utilities & Concrete Paving",
    titlePlain: "Site Civil, 8.5' Frost-Bury Utilities & Concrete Paving",
    category: "site_restoration",
    unitRate: "$18.00–$38.00 / sq.ft.",
    takeoffManHours: "766.0 MH Audited (:8085)",
    sheetRef: "Sheets C-500 & PR-5",
    accent: "#1B3A6B",
    summary:
      "4000 PSI Reinforced Aprons, Sub-Zero Water/Sewer Trenching, E-One Lift Stations, ADA Ramps engineered for northern freeze-thaw cycles.",
    deliverables: [
      "8.5-Ft Arctic Frost-Bury HDPE Water & Sanitary Sewer Mains",
      "E-One Duplex Grinder Pump Lift Stations & Force Main Tie-Ins",
      "4000–5000 PSI Reinforced Concrete Loading Docks & Aprons",
      "Heavy Timber Octagon Gazebos, Bollards & Site Furnishings",
      "ADA-Compliant Concrete Sidewalks, Detectable Warnings & Curb Cuts",
      "Subgrade Proof-Rolling, Engineered Fill & Stormwater Grading",
    ],
  },
  {
    num: "09",
    csiCode: "CSI 01 31 00",
    titleNode:
      "09 · CSI 01 31 00 — Multi-Site Commercial Rollouts & REIT CapEx Programs",
    titlePlain: "Multi-Site Commercial Rollouts & REIT CapEx Programs",
    category: "interior_ti",
    unitRate: "$110.00–$245.00 / sq.ft.",
    takeoffManHours: "6,536.0 MH Portfolio",
    sheetRef: "Master 32-Sheet Set (:8085)",
    accent: "#C9A84C",
    summary:
      "Single-Point Master GC Contract, 9-State Tax Optimization, Weekly Earned-Value Reporting across WI, IL, IA, IN, MN, MI, MO, TX, and ND.",
    deliverables: [
      "Single-Point Master General Contracting across 9 States",
      "3-Bid Subcontractor Leveling Matrix with Guaranteed GMP Savings",
      "24-Week S-Curve Earned Value Management (CPI / SPI Telemetry)",
      "9-State Material vs. Labor Sales/Use Tax & Tribal TERO Compliance",
      "Certified Davis-Bacon WH-347 Payroll & COI/W-9 Governance",
      "Dedicated Module-Scoped Portal Access for Owners, CPAs & Lenders",
    ],
  },
  {
    num: "10",
    csiCode: "IICRC S500 / S520",
    titleNode:
      "10 · IICRC S500 / S520 — 24/7 Commercial Fire, Water & Storm Reconstruction",
    titlePlain: "24/7 Commercial Fire, Water & Storm Reconstruction",
    category: "site_restoration",
    unitRate: "Rapid Mobilization",
    takeoffManHours: "24/7 Field Dispatch",
    sheetRef: "IICRC + Takeoff Pro Sync",
    accent: "#F97316",
    summary:
      "Psychrometric Drying Logs, Xactimate + Takeoff Pro CSI-32 Reconciliation, Full Structural Rebuild for commercial losses.",
    deliverables: [
      "24/7 Rapid Commercial Water Extraction & Desiccant Dehumidification",
      "IICRC S500 / S520 Certified Mold & Category-3 Remediation",
      "Commercial Fire, Smoke, Char & Odor Structural Remediation",
      "Daily Psychrometric Moisture Mapping & Thermal Imaging Logs",
      "Direct Xactimate + Takeoff Pro (:8085) CSI-32 Carrier Reconciliation",
      "Turnkey Code-Upgraded Commercial Reconstruction to Occupancy",
    ],
  },
];

const COMMERCIAL_LEDGER_PROJECTS = [
  {
    code: "PRJ-ND-001",
    name: "Son of a Star 8-Cabin Casino Resort",
    location: "New Town, ND (MHA Nation)",
    status: "Active Execution · 60.2% Complete",
    sqft: "5,640 sq.ft. (8 Cabins + 2 Gazebos)",
    gmp: "$855,525.23",
    takeoffLink: "32 ARCH-D Sheets · 87 Sub-Views (:8085)",
    portalHref: "/portal?invite=INV-TAYCO-MASTER",
    estimateHref: "/estimate?project=PRJ-ND-001",
    badgeColor: "#10B981",
  },
  {
    code: "PRJ-WI-002",
    name: "Park Tower Mixed-Use Structural & TI",
    location: "Milwaukee, WI",
    status: "Active Execution · Pay App #2",
    sqft: "14,200 sq.ft.",
    gmp: "$389,192.50",
    takeoffLink: "CSI 03 / 05 / 09 Structural Sync (:8085)",
    portalHref: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
    estimateHref: "/estimate?project=PRJ-WI-002",
    badgeColor: "#C9A84C",
  },
  {
    code: "PRJ-WI-003",
    name: "Wisconsin Ave Medical TI",
    location: "Madison, WI",
    status: "GMP Locked · Pre-Construction",
    sqft: "11,800 sq.ft.",
    gmp: "$1,240,000.00",
    takeoffLink: "CSI 09 / 10 / 22 / 26 Clinical Assembly",
    portalHref: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
    estimateHref: "/estimate?project=PRJ-WI-003",
    badgeColor: "#4A90D9",
  },
  {
    code: "PRJ-IL-004",
    name: "Chicago O'Hare Cold-Storage",
    location: "Des Plaines, IL",
    status: "3-Bid Leveling Complete",
    sqft: "42,500 sq.ft.",
    gmp: "$2,480,000.00",
    takeoffLink: "CSI 03 FF50 Slab & CSI 07 R-49 Envelope",
    portalHref: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
    estimateHref: "/estimate?project=PRJ-IL-004",
    badgeColor: "#10B981",
  },
  {
    code: "PRJ-TX-005",
    name: "Dallas 48-Unit Multi-Family Rehab",
    location: "Dallas, TX",
    status: "Phase II Field Mobilization",
    sqft: "38,400 sq.ft.",
    gmp: "$920,000.00",
    takeoffLink: "CSI 06 / 07 / 08 / 09 CapEx Matrix",
    portalHref: "/portal?invite=INV-INVESTOR-PORTFOLIO",
    estimateHref: "/estimate?project=PRJ-TX-005",
    badgeColor: "#F97316",
  },
];

export default function CommercialPage() {
  const [lightAngle, setLightAngle] = useState<number>(42);
  const [activeCategory, setActiveCategory] =
    useState<CommercialTradeCategory>("all");

  const filteredTrades =
    activeCategory === "all"
      ? COMMERCIAL_CSI_TRADES
      : COMMERCIAL_CSI_TRADES.filter((t) => t.category === activeCategory);

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
      {/* ── CABECERA EXECUTIVE COMMAND COMERCIAL (#070E1A -> #0F2040 -> #1B3A6B) ── */}
      <section
        id="commercial-executive-hero"
        className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 border-b"
        style={{
          background: `radial-gradient(circle at ${18 + lightAngle * 0.65}% 18%, rgba(201, 168, 76, 0.2), transparent 45%), linear-gradient(${115 + lightAngle * 0.35}deg, #070E1A 0%, #0F2040 55%, #1B3A6B 100%)`,
          borderColor: "rgba(201, 168, 76, 0.35)",
        }}
      >
        {/* Architectural Blueprint Grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ background: "#C9A84C" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto">
          {/* Top Executive Masthead Bar with Orbital Stamp + Raking Light Slider */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 mb-10 border-b border-white/15">
            <div className="flex items-center gap-5">
              {/* Rotating Orbital Editorial Stamp */}
              <div
                className="orbital-caption rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-400/40 shadow-2xl p-1 shrink-0"
                aria-hidden="true"
              >
                <svg viewBox="0 0 120 120">
                  <defs>
                    <path
                      id="commercial-orbit-path"
                      d="M 60, 60 m -44, 0 a 44,44 0 1,1 88,0 a 44,44 0 1,1 -88,0"
                    />
                  </defs>
                  <text>
                    <textPath href="#commercial-orbit-path" startOffset="0%">
                      TAYCO COMMERCIAL DIVISION · CSI-32 TURNKEY · 9 STATES ·
                    </textPath>
                  </text>
                </svg>
                <span>🏢</span>
              </div>

              <div>
                <div
                  className="tayco-eyebrow mb-2"
                  style={{ color: "#F3D37A" }}
                >
                  <span
                    className="tayco-live-dot"
                    style={{ color: "#10B981" }}
                  />
                  TAYCO COMMERCIAL COMMAND · TAKEOFF PRO v5.0 (:8085) SYNCED
                </div>
                <h1
                  className="font-black text-white tracking-tight"
                  style={{
                    fontSize: "clamp(2.2rem, 4.8vw, 4rem)",
                    lineHeight: 1.03,
                  }}
                >
                  Commercial Construction.{" "}
                  <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                    Engineered to Spec.
                  </em>
                </h1>
              </div>
            </div>

            {/* Interactive Raking Light Angle Control (0°–90°) */}
            <div
              className="tayco-living-card p-4 rounded-2xl border backdrop-blur-md min-w-[280px] sm:min-w-[330px]"
              style={{
                background: "rgba(7, 14, 26, 0.82)",
                borderColor: "rgba(201, 168, 76, 0.45)",
              }}
            >
              <label
                htmlFor="commercial-light-angle-slider"
                className="flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-amber-200 mb-2"
              >
                <span>☀️ Raking Light Angle: {lightAngle}°</span>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300">
                  0°–90°
                </span>
              </label>
              <input
                id="commercial-light-angle-slider"
                type="range"
                min={0}
                max={90}
                value={lightAngle}
                onChange={(e) => setLightAngle(Number(e.target.value))}
                className="w-full h-2 rounded-lg cursor-ew-resize accent-amber-400"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>0° Low Grazing</span>
                <span>45° Specular</span>
                <span>90° Zenith</span>
              </div>
            </div>
          </div>

          {/* Executive Intro & Direct Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-12">
            <div className="lg:col-span-7">
              <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                TAYCO LLC delivers ground-up commercial construction, structural
                steel and engineered LVL framing, R-49 thermal envelopes, and
                turnkey medical/retail tenant improvements with a single point
                of executive accountability. Every assembly is quantified in{" "}
                <strong className="text-amber-300">Takeoff Pro (:8085)</strong>{" "}
                and governed by AIA G702/G703 progress billing.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/estimate"
                  data-magnetic
                  className="px-6 py-3.5 rounded-xl font-black text-sm transition-transform hover:scale-105 shadow-lg"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  🧮 Launch CSI-32 Commercial Estimator →
                </Link>
                <Link
                  href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
                  data-magnetic
                  className="px-6 py-3.5 rounded-xl font-bold text-sm text-white border transition-colors hover:bg-white/10"
                  style={{
                    borderColor: "rgba(201, 168, 76, 0.55)",
                    background: "rgba(15, 32, 64, 0.7)",
                  }}
                >
                  🏛️ Open Commercial Bid Pipeline (/portal) →
                </Link>
                <Link
                  href="/residential"
                  data-magnetic
                  className="px-5 py-3.5 rounded-xl font-bold text-sm text-amber-200 border border-white/20 hover:bg-white/10 transition-colors"
                >
                  View Residential Division →
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div
                data-response-kind="surface"
                className="tayco-living-card p-5 rounded-2xl border"
                style={{
                  background: `linear-gradient(${lightAngle}deg, rgba(15, 32, 64, 0.92), rgba(7, 14, 26, 0.96))`,
                  borderColor: "rgba(201, 168, 76, 0.45)",
                }}
              >
                <div className="flex items-center justify-between text-xs font-mono text-emerald-300 font-bold mb-2">
                  <span>● LIVE TAKEOFF PRO (:8085) TELEMETRY</span>
                  <span>21 RUST KERNELS</span>
                </div>
                <div className="text-2xl font-black font-mono text-white">
                  $5,884,717.73{" "}
                  <span className="text-xs font-normal text-amber-300">
                    Active Commercial GMP
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Featuring PRJ-ND-001 Son of a Star ($855,525.23 GMP · 32
                  ARCH-D Sheets · 87 Sub-Views) + 15 Subcontractor Bids Leveled
                  (-$30,650.00 Net GMP Savings).
                </p>
              </div>
            </div>
          </div>

          {/* Cinta de Telemetría en Vivo con Takeoff Pro (:8085) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                metric: "$5,884,717.73",
                label: "Active Commercial GMP Pipeline",
                sub: "5 Multi-State Contracts in Execution",
                accent: "#C9A84C",
              },
              {
                metric: "$855,525.23",
                label: "Son of a Star ND Contract",
                sub: "32 Sheets / 87 Sub-Views (:8085)",
                accent: "#10B981",
              },
              {
                metric: "6,536.0",
                label: "Certified WH-347 Man-Hours",
                sub: "103.1 Crew-Days · $213,299.26 Labor",
                accent: "#4A90D9",
              },
              {
                metric: "22+",
                label: "In-House CSI Specialties",
                sub: "Self-Performing Commercial Crews",
                accent: "#F97316",
              },
              {
                metric: "9 States",
                label: "WI · IL · IA · IN · MN · MI · MO · TX · ND",
                sub: "Includes MHA Nation 2.5% TERO",
                accent: "#F3D37A",
              },
            ].map((item) => (
              <div
                key={item.label}
                data-response-kind="surface"
                className="tayco-living-card p-4 rounded-2xl border"
                style={{
                  background: `linear-gradient(${lightAngle}deg, rgba(15, 32, 64, 0.88) 0%, rgba(7, 14, 26, 0.94) 100%)`,
                  borderColor: "rgba(201, 168, 76, 0.32)",
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
        aria-label="TAYCO Commercial CSI-32 Specialties"
      >
        <div>
          <span className="gold">CSI 03 30 00 Laser-Screeded 4000 PSI Concrete</span>
          <i aria-hidden="true">✳</i>
          <span>CSI 05 12 00 Structural Steel &amp; 16× LVL Glulam</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">CSI 07 50 00 TPO / EPDM &amp; R-49 Standing Seam</span>
          <i aria-hidden="true">✳</i>
          <span>CSI 09 29 00 UL Fire-Rated Type-X Shaftwall</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">CSI 31 23 16 8.5-Ft Arctic Frost-Bury Utilities</span>
          <i aria-hidden="true">✳</i>
          <span>CSI 03 30 00 Laser-Screeded 4000 PSI Concrete</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">CSI 05 12 00 Structural Steel &amp; 16× LVL Glulam</span>
          <i aria-hidden="true">✳</i>
          <span>CSI 07 50 00 TPO / EPDM &amp; R-49 Standing Seam</span>
        </div>
      </div>

      {/* ── CHROMATIC HORIZON DIVIDER INTO WARM EDITORIAL IVORY ── */}
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

      {/* ── SECCIÓN 01 / CSI-32 COMMERCIAL TRADES & UNIT-PRICE ASSEMBLIES (#F4F2EA) ── */}
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
              01 / CSI-32 COMMERCIAL TRADES &amp; UNIT-PRICE ASSEMBLIES
            </span>
            <span
              className="text-[11px] font-mono uppercase tracking-widest"
              style={{ color: "#1B3A6B" }}
            >
              22+ IN-HOUSE SPECIALTIES · AUDITED IN TAKEOFF PRO (:8085)
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
                Self-performing commercial crews.{" "}
                <em
                  className="tayco-serif-em font-normal"
                  style={{ color: "#1B3A6B" }}
                >
                  Audited unit rates.
                </em>
              </h2>
              <p
                className="text-sm sm:text-base mt-3 max-w-2xl leading-relaxed"
                style={{ color: "#334155" }}
              >
                Filter our 10 core commercial CSI-32 assemblies below. Every
                card exposes real unit-price benchmarks, Takeoff Pro man-hour
                allocations, and 6 field deliverables.
              </p>
            </div>

            {/* Interactive Category Filter */}
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter Commercial CSI-32 Specialties"
            >
              {[
                {
                  id: "all",
                  label: "All 10 CSI Specialties",
                },
                {
                  id: "structural_envelope",
                  label: "Structural & Envelope",
                },
                {
                  id: "interior_ti",
                  label: "Interior TI & Finishes",
                },
                {
                  id: "site_restoration",
                  label: (
                    <>
                      Site, Dem{"o"} &amp; IICRC Restoration
                    </>
                  ),
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
                      setActiveCategory(tab.id as CommercialTradeCategory)
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

          {/* 10 Living Commercial Cards */}
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
                          background: "rgba(201, 168, 76, 0.22)",
                          color: "#0F2040",
                        }}
                      >
                        {card.unitRate}
                      </span>
                    </div>

                    <Link
                      href={`/estimate?trade=${encodeURIComponent(card.csiCode)}`}
                      aria-label={`Estimate ${card.titlePlain}`}
                      className="project-open"
                    >
                      ↗
                    </Link>
                  </div>

                  <h3
                    className="text-xl font-black tracking-tight leading-snug"
                    style={{ color: "#0F2040" }}
                  >
                    {card.titleNode}
                  </h3>
                  <p
                    className="text-xs sm:text-sm mt-2 leading-relaxed"
                    style={{ color: "#334155" }}
                  >
                    {card.summary}
                  </p>

                  {/* 6 Technical Deliverables */}
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-5 pt-4 border-t border-slate-300/70">
                    {card.deliverables.map((item) => (
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
                  <div className="flex items-center gap-3 text-[11px] font-mono font-bold text-slate-700">
                    <span>⏱️ {card.takeoffManHours}</span>
                    <span>·</span>
                    <span>📐 {card.sheetRef}</span>
                  </div>
                  <Link
                    href={`/estimate?trade=${encodeURIComponent(card.csiCode)}`}
                    data-magnetic
                    className="px-4 py-2 rounded-xl text-xs font-black transition-transform hover:scale-105"
                    style={{ background: "#0F2040", color: "#F3D37A" }}
                  >
                    Calculate CSI Assembly →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REVERSE CHROMATIC HORIZON BACK INTO DEEP STRUCTURAL NAVY (#070E1A) ── */}
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

      {/* ── SECCIÓN 02 / LIVE COMMERCIAL PROJECT LEDGER & TAKEOFF PRO (:8085) INTEGRATION ── */}
      <section
        id="projects"
        className="py-16 sm:py-24 px-4 sm:px-8 relative z-10"
        style={{ background: "#070E1A" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-10 border-b border-white/10">
            <span className="tayco-eyebrow" style={{ color: "#F3D37A" }}>
              <span className="tayco-live-dot" style={{ color: "#10B981" }} />
              02 / LIVE COMMERCIAL PROJECT LEDGER &amp; TAKEOFF PRO (:8085) INTEGRATION
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-200">
              5 COMMERCIAL CONTRACTS · $5,884,717.73 COMBINED GMP
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <h2
                className="font-black text-white tracking-tight"
                style={{
                  fontSize: "clamp(2rem, 4vw, 3.25rem)",
                  lineHeight: 1.05,
                }}
              >
                Executive Commercial Ledger{" "}
                <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                  &amp; Field Portfolio.
                </em>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl">
                Every commercial contract is synchronized with Takeoff Pro
                (:8085) 2D/3D blueprints, 3-bid subcontractor leveling, and
                certified Davis-Bacon WH-347 payroll logs.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/portal?invite=INV-TAYCO-MASTER"
                data-magnetic
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                Open Master Command Center →
              </Link>
              <Link
                href="/estimate"
                data-magnetic
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white border border-amber-400/50 hover:bg-white/10"
              >
                Run New GMP Estimate →
              </Link>
            </div>
          </div>

          {/* Executive Commercial Projects Table */}
          <div
            data-response-kind="surface"
            className="tayco-living-card rounded-2xl border overflow-hidden mb-16"
            style={{
              background: "rgba(15, 32, 64, 0.85)",
              borderColor: "rgba(201, 168, 76, 0.35)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="border-b text-[11px] font-mono uppercase tracking-wider text-amber-200"
                    style={{
                      background: "rgba(7, 14, 26, 0.9)",
                      borderColor: "rgba(201, 168, 76, 0.25)",
                    }}
                  >
                    <th className="py-3.5 px-4">Project Code</th>
                    <th className="py-3.5 px-4">Commercial Contract &amp; Location</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Square Footage</th>
                    <th className="py-3.5 px-4">Audited GMP</th>
                    <th className="py-3.5 px-4">Takeoff Pro (:8085) Sync</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                  {COMMERCIAL_LEDGER_PROJECTS.map((proj) => (
                    <tr
                      key={proj.code}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-4 font-mono font-black text-amber-300 whitespace-nowrap">
                        {proj.code}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-white">{proj.name}</div>
                        <div className="text-xs text-slate-400">
                          {proj.location}
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold"
                          style={{
                            background: "rgba(16, 185, 129, 0.14)",
                            color: "#6EE7B7",
                            border: `1px solid ${proj.badgeColor}`,
                          }}
                        >
                          ● {proj.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-mono text-slate-200 whitespace-nowrap">
                        {proj.sqft}
                      </td>
                      <td className="py-4 px-4 font-mono font-black text-amber-300 whitespace-nowrap">
                        {proj.gmp}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-sky-300">
                        {proj.takeoffLink}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={proj.portalHref}
                            className="px-3 py-1.5 rounded-lg text-xs font-black"
                            style={{ background: "#C9A84C", color: "#070E1A" }}
                          >
                            /portal ↗
                          </Link>
                          <Link
                            href={proj.estimateHref}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white border border-white/25 hover:bg-white/10"
                          >
                            /estimate
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive CSI-32 Trade Photo Gallery */}
          <div className="pt-6">
            <div className="text-center mb-10">
              <div
                className="tayco-eyebrow justify-center mb-2"
                style={{ color: "#F3D37A" }}
              >
                <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                FIELD EXECUTION GALLERY BY CSI-32 TRADE
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Verified Field Craftsmanship Across{" "}
                <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                  Every Sector.
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
