"use client";
import React, { useState } from "react";
import Link from "next/link";
import TradeGallery from "@/components/TradeGallery";
import {
  TransformationBeforeAfterStudio,
  DualTrackArchitecturalMarquee,
  ServiceCardTriptych,
  type TriptychFrame,
} from "@/components/LandingLivingShowcase";
import { COMPANY, COMPANY_SERVICE_AREAS } from "@/lib/company";

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
  scheduleNote: string;
  planningNote: string;
  accent: string;
  summary: string;
  deliverables: string[];
  triptych: TriptychFrame[];
}

const COMMERCIAL_CSI_TRADES: CommercialTradeSpec[] = [
  {
    "num": "01",
    "csiCode": "Roofing",
    "titleNode": "Roofing",
    "titlePlain": "Roofing",
    "category": "structural_envelope",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#C9A84C",
    "summary": "Roof repair and replacement planned around building use, condition and access.",
    "deliverables": [
      "Roof condition and leak review",
      "Membrane, shingle and metal options",
      "Drainage and flashing details",
      "Insulation and ventilation review",
      "Repair or replacement scope",
      "Site access and protection"
    ],
    "triptych": [
      { "src": "/curated/commercial/com_04_2.jpg", "label": "White TPO Flat Roof & Rooftop HVAC Curbs" },
      { "src": "/curated/commercial/cx_r1.jpg", "label": "Aerial TPO Membrane & Standing-Seam Wing" },
      { "src": "/curated/commercial/com_04_1.jpg", "label": "Industrial Standing-Seam Metal Roof System" }
    ]
  },
  {
    "num": "02",
    "csiCode": "Exterior",
    "titleNode": "Siding, windows & exterior",
    "titlePlain": "Siding, windows & exterior",
    "category": "structural_envelope",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#1B3A6B",
    "summary": "Improve the exterior with coordinated siding, window, door and weatherproofing work.",
    "deliverables": [
      "Siding repair and replacement",
      "Window and door openings",
      "Trim, soffit and fascia",
      "Water-management detailing",
      "Exterior finish selections",
      "Coordination with occupied areas"
    ],
    "triptych": [
      { "src": "/curated/commercial/com_02_2.jpg", "label": "Stone Veneer & Commercial Storefront Glazing" },
      { "src": "/curated/commercial/cx_o3.jpg", "label": "2-Story Curtain-Wall & Metal Panel Envelope" },
      { "src": "/curated/hero/com-plaza-stone.jpg", "label": "Masonry Facade, Canopy & Architectural Fascia" }
    ]
  },
  {
    "num": "03",
    "csiCode": "Framing",
    "titleNode": "Framing & structural coordination",
    "titlePlain": "Framing & structural coordination",
    "category": "structural_envelope",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#1B3A6B",
    "summary": "Coordinate the structure and layout for new construction, additions and interior changes.",
    "deliverables": [
      "Framing layout review",
      "Wall and floor systems",
      "Roof framing coordination",
      "Openings and headers",
      "Engineer coordination where required",
      "Inspections and sequencing"
    ],
    "triptych": [
      { "src": "/curated/commercial/cx_x3.jpg", "label": "Multi-Story Cold-Formed Steel Stud Framing" },
      { "src": "/curated/magazine/revista_fr_metal_04.jpg", "label": "Commercial Structural Steel Superstructure" },
      { "src": "/curated/hero/com-dusk-steel.jpg", "label": "Multi-Story Structural Envelope & Steel Framing" }
    ]
  },
  {
    "num": "04",
    "csiCode": "Flooring",
    "titleNode": "Flooring",
    "titlePlain": "Flooring",
    "category": "interior_ti",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#C9A84C",
    "summary": "Choose flooring suited to traffic, maintenance and the needs of your space.",
    "deliverables": [
      "Existing floor removal",
      "Subfloor condition review",
      "Tile, vinyl and wood options",
      "Concrete and specialty finishes",
      "Transitions and base details",
      "Installation sequencing"
    ],
    "triptych": [
      { "src": "/curated/commercial/cx_i2.jpg", "label": "Large-Format Commercial Lobby Porcelain Tile" },
      { "src": "/work/flooring_commercial.jpg", "label": "Diamond-Polished Commercial Concrete Slab" },
      { "src": "/curated/commercial/com_03_2.jpg", "label": "Commercial Corridor & High-Traffic Flooring" }
    ]
  },
  {
    "num": "05",
    "csiCode": "Interiors",
    "titleNode": "Drywall, ceilings & painting",
    "titlePlain": "Drywall, ceilings & painting",
    "category": "interior_ti",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#1B3A6B",
    "summary": "Bring interior spaces together with coordinated walls, ceilings and finishes.",
    "deliverables": [
      "Partition layout",
      "Drywall repair and installation",
      "Ceiling systems",
      "Surface preparation",
      "Paint and finish selection",
      "Final touch-ups and review"
    ],
    "triptych": [
      { "src": "/work/drywall_commercial.jpg", "label": "Curved Commercial Soffit & Gypsum Assembly" },
      { "src": "/curated/commercial/com_03_1.jpg", "label": "Acoustic Drop-Ceiling Grid & Partitions" },
      { "src": "/curated/commercial/cx_i1.jpg", "label": "Suspended Acoustic Clouds & Interior Finish" }
    ]
  },
  {
    "num": "06",
    "csiCode": "Tenant improvements",
    "titleNode": "Tenant improvements",
    "titlePlain": "Tenant improvements",
    "category": "interior_ti",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#1B3A6B",
    "summary": "Adapt an office, retail or business space to the needs of its next occupants.",
    "deliverables": [
      "Existing conditions and scope",
      "Interior layout and finishes",
      "Carpentry and cabinetry",
      "Electrical and plumbing coordination",
      "Occupied-space access planning",
      "Walk-through and closeout"
    ],
    "triptych": [
      { "src": "/curated/commercial/com_01_1.jpg", "label": "Restaurant & Hospitality Tenant Build-Out" },
      { "src": "/curated/commercial/cx_x1.jpg", "label": "Retail White-Box & Custom Shelving Fit-Out" },
      { "src": "/curated/commercial/cx_y3.jpg", "label": "Corporate Cafe & Breakroom Millwork TI" }
    ]
  },
  {
    "num": "07",
    "csiCode": "Site preparation",
    "titleNode": "Demolition & site preparation",
    "titlePlain": "Demolition & site preparation",
    "category": "site_restoration",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#C9A84C",
    "summary": "Define removal and preparation work before the next phase of construction.",
    "deliverables": [
      "Removal scope review",
      "Utility coordination",
      "Protection of retained areas",
      "Debris handling",
      "Site access and logistics",
      "Readiness for the next trade"
    ],
    "triptych": [
      { "src": "/curated/magazine/revista_ex_sp_demo.jpg", "label": "Selective Demolition & Site Clearing" },
      { "src": "/curated/magazine/revista_ex_ex_mass.jpg", "label": "Mass Excavation & Earthwork Grading" },
      { "src": "/curated/magazine/revista_ex_ex_found.jpg", "label": "Foundation Trenching & Utility Prep" }
    ]
  },
  {
    "num": "08",
    "csiCode": "Concrete",
    "titleNode": "Concrete & foundations",
    "titlePlain": "Concrete & foundations",
    "category": "structural_envelope",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#1B3A6B",
    "summary": "Coordinate foundations, slabs and exterior concrete within the overall project.",
    "deliverables": [
      "Foundation and slab scope",
      "Site conditions and access",
      "Forms and reinforcement coordination",
      "Walkways, steps and patios",
      "Concrete repair options",
      "Finishing and curing plan"
    ],
    "triptych": [
      { "src": "/curated/pairs/div02_02_antes.jpg", "label": "Poured Commercial Slab & Stem Walls" },
      { "src": "/curated/pairs/div01_01_antes.jpg", "label": "Reinforced Concrete Foundation Pad" },
      { "src": "/work/flooring_commercial.jpg", "label": "High-Load Industrial Warehouse Concrete Floor" }
    ]
  },
  {
    "num": "09",
    "csiCode": "Property programs",
    "titleNode": "Property renovation programs",
    "titlePlain": "Property renovation programs",
    "category": "interior_ti",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#1B3A6B",
    "summary": "Plan turnovers and improvements across one property or a portfolio.",
    "deliverables": [
      "Property-by-property scope",
      "Priority and budget review",
      "Trade and material coordination",
      "Site scheduling",
      "Change documentation",
      "Handover and outstanding items"
    ],
    "triptych": [
      { "src": "/curated/commercial/com_02_1.jpg", "label": "Multi-Family Apartment Exterior Program" },
      { "src": "/curated/capabilities/mf-townhomes-row.jpg", "label": "Townhome Portfolio Exterior & Envelope Rehab" },
      { "src": "/curated/properties/townhouse-04-chicago-endunit-brick.jpg", "label": "Multi-Unit Corridor & Common-Area Turnover" }
    ]
  },
  {
    "num": "10",
    "csiCode": "Restoration",
    "titleNode": "Fire & water reconstruction",
    "titlePlain": "Fire & water reconstruction",
    "category": "site_restoration",
    "unitRate": "Estimate by project",
    "scheduleNote": "Schedule agreed with you",
    "planningNote": "Scope-specific planning",
    "accent": "#F97316",
    "summary": "Bring damage assessment, restoration planning and rebuilding into a coordinated scope.",
    "deliverables": [
      "Damage assessment",
      "Fire, smoke and soot repairs",
      "Water damage and drying coordination",
      "Insurance documentation support",
      "Reconstruction planning",
      "Completion review"
    ],
    "triptych": [
      { "src": "/curated/capabilities/fire-steel-ibeam.jpg", "label": "Fire-Damaged Structural Steel Remediation" },
      { "src": "/curated/pairs/div04_03_antes.jpg", "label": "Commercial Roof & Storm Damage Assessment" },
      { "src": "/curated/pairs/div04_02_antes.jpg", "label": "Water Mitigation & Structural Deck Rebuild" }
    ]
  }
];

const COMMERCIAL_PROJECT_STARTERS = [
  {
    "code": "01",
    "name": "New construction",
    "location": "Ground-up & additions",
    "status": "Planning",
    "sqft": "Site & intended use",
    "helpfulDetails": "Plans & requirements",
    "discussion": "Share available drawings and site details",
    "portalHref": "/login",
    "estimateHref": "/estimate",
    "badgeColor": "#C9A84C"
  },
  {
    "code": "02",
    "name": "Tenant improvements",
    "location": "Office, retail & business",
    "status": "Renovation",
    "sqft": "Layout & operating hours",
    "helpfulDetails": "Current conditions",
    "discussion": "Tell us about occupancy and target use",
    "portalHref": "/login",
    "estimateHref": "/estimate",
    "badgeColor": "#C9A84C"
  },
  {
    "code": "03",
    "name": "Property turnover",
    "location": "Owners & property managers",
    "status": "Property programs",
    "sqft": "Unit count & priorities",
    "helpfulDetails": "Repair scope",
    "discussion": "Identify urgent repairs and access needs",
    "portalHref": "/login",
    "estimateHref": "/estimate",
    "badgeColor": "#C9A84C"
  },
  {
    "code": "04",
    "name": "Restoration",
    "location": "Fire & water damage",
    "status": "Recovery",
    "sqft": "Damage & safe access",
    "helpfulDetails": "Photos & documentation",
    "discussion": "Discuss assessment and reconstruction",
    "portalHref": "/login",
    "estimateHref": "/estimate",
    "badgeColor": "#C9A84C"
  },
  {
    "code": "05",
    "name": "Exterior improvements",
    "location": "Roofing, siding & concrete",
    "status": "Building envelope",
    "sqft": "Condition & access",
    "helpfulDetails": "Repair or replace",
    "discussion": "Describe known issues and priorities",
    "portalHref": "/login",
    "estimateHref": "/estimate",
    "badgeColor": "#C9A84C"
  }
];

export default function CommercialDivisionContent() {
  // Fixed light angle for the response surfaces; the interactive hero moved to the division view.
  const lightAngle = 42;
  const [activeCategory, setActiveCategory] =
    useState<CommercialTradeCategory>("all");

  const filteredTrades =
    activeCategory === "all"
      ? COMMERCIAL_CSI_TRADES
      : COMMERCIAL_CSI_TRADES.filter((t) => t.category === activeCategory);

  const normalizedLightPx = `${Math.round(20 + (lightAngle / 90) * 65)}%`;

  return (
    <div
      className="min-h-screen"
      style={
        {
          "--light-angle": `${lightAngle}deg`,
          "--response-px": normalizedLightPx,
          background: "#070E1A",
        } as React.CSSProperties
      }
    >
      {/* The division hero lives in PropertyCategoryPageView (see app/<division>/page.tsx). */}

      {/* ── MARQUEE EDITORIAL CINÉTICO (.tayco-editorial-ticker) ── */}
      <div
        className="tayco-editorial-ticker"
        aria-label="TAYCO commercial services"
      >
        <div>
          <span className="gold">Concrete, foundations &amp; site improvements</span>
          <i aria-hidden="true">✳</i>
          <span>Framing, additions &amp; structural coordination</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Roofing, exterior &amp; building improvements</span>
          <i aria-hidden="true">✳</i>
          <span>Drywall, painting &amp; interior finishes</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Site preparation &amp; restoration planning</span>
          <i aria-hidden="true">✳</i>
          <span>Concrete, foundations &amp; site improvements</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Framing, additions &amp; structural coordination</span>
          <i aria-hidden="true">✳</i>
          <span>Roofing, exterior &amp; building improvements</span>
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
              01 / COMMERCIAL SERVICES
            </span>
            <span
              className="text-[11px] font-mono uppercase tracking-widest"
              style={{ color: "#1B3A6B" }}
            >
              THE RIGHT SCOPE FOR YOUR SPACE
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
                Every trade, coordinated.{" "}
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
                Explore the work your project may need. Each service includes practical planning points
                to help you prepare for a conversation with our team.
              </p>
            </div>

            {/* Interactive Category Filter */}
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter commercial services"
            >
              {[
                {
                  id: "all",
                  label: "All services",
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
                      Site &amp; restoration
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
                  <ServiceCardTriptych
                    frames={card.triptych}
                    badge={`0${card.num} · ${card.csiCode}`}
                    accentColor={card.accent}
                  />

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
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-amber-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" />
                      </svg>
                      <span>{card.scheduleNote}</span>
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 21h18L3 3v18Z" />
                        <path d="M7 17h4v-4" />
                      </svg>
                      <span>{card.planningNote}</span>
                    </span>
                  </div>
                  <Link
                    href={`/estimate?trade=${encodeURIComponent(card.csiCode)}`}
                    data-magnetic
                    className="px-4 py-2 rounded-xl text-xs font-black transition-transform hover:scale-105"
                    style={{ background: "#0F2040", color: "#F3D37A" }}
                  >
                    Discuss this service →
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

      {/* ── 01B / INTERACTIVE COMMERCIAL BEFORE & AFTER TRANSFORMATION STUDIO ── */}
      <TransformationBeforeAfterStudio
        initialDivision="div03"
        initialPairId="div03_01"
        eyebrowLabel="01B / COMMERCIAL BEFORE & AFTER TRANSFORMATION STUDIO"
      />

      {/* ── 01C / DUAL-TRACK ARCHITECTURAL FILMSTRIP MARQUEE ── */}
      <DualTrackArchitecturalMarquee />

      {/* Project services and resources */}
      <section
        id="projects"
        className="py-16 sm:py-24 px-4 sm:px-8 relative z-10"
        style={{ background: "#070E1A" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-10 border-b border-white/10">
            <span className="tayco-eyebrow" style={{ color: "#F3D37A" }}>
              <span className="tayco-live-dot" style={{ color: "#10B981" }} />
              02 / PLAN YOUR PROJECT
            </span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-amber-200">
              WHAT TO PREPARE FOR AN ESTIMATE
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
                Different projects,{" "}
                <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                  a clear starting point.
                </em>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-2xl">
                Gather what you have: location, photos, plans and your priorities.
                We will help identify what else is needed to define the work.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                data-magnetic
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                Existing project sign in →
              </Link>
              <Link
                href="/estimate"
                data-magnetic
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white border border-amber-400/50 hover:bg-white/10"
              >
                Request an estimate →
              </Link>
            </div>
          </div>

          {/* Project services and resources */}
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
                    <th className="py-3.5 px-4">Step</th>
                    <th className="py-3.5 px-4">Project type &amp; focus</th>
                    <th className="py-3.5 px-4">Service</th>
                    <th className="py-3.5 px-4">Starting information</th>
                    <th className="py-3.5 px-4">Helpful details</th>
                    <th className="py-3.5 px-4">To discuss</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-xs sm:text-sm">
                  {COMMERCIAL_PROJECT_STARTERS.map((proj) => (
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
                        {proj.helpfulDetails}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-sky-300">
                        {proj.discussion}
                      </td>
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={proj.portalHref}
                            className="px-3 py-1.5 rounded-lg text-xs font-black"
                            style={{ background: "#C9A84C", color: "#070E1A" }}
                          >
                            Sign in ↗
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

          {/* Project services and resources */}
          <div className="pt-6">
            <div className="text-center mb-10">
              <div
                className="tayco-eyebrow justify-center mb-2"
                style={{ color: "#F3D37A" }}
              >
                <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                SERVICE CATALOG · COMMERCIAL TRADE EXECUTION
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Types of work we perform across{" "}
                <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                  Every Sector.
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
    </div>
  );
}
