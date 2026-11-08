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

export const COMMERCIAL_CSI_TRADES: CommercialTradeSpec[] = [
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
      { "src": "/curated/commercial/com-cfs-stud-framing-3story.jpg", "label": "Multi-Story Cold-Formed Steel Stud Framing" },
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
      { "src": "/curated/commercial/com-lobby-porcelain-tile.jpg", "label": "Large-Format Commercial Lobby Porcelain Tile" },
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
      { "src": "/curated/commercial/cx_i1.jpg", "label": "Walnut Slat Ceiling & Terrazzo Lobby Finish" }
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
      { "src": "/curated/commercial/com-retail-fitout-shelving.jpg", "label": "Retail White-Box & Custom Shelving Fit-Out" },
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
      { "src": "/curated/commercial/com-slab-stem-walls.jpg", "label": "Poured Commercial Slab & Stem Walls" },
      { "src": "/curated/commercial/com-foundation-pad-rebar.jpg", "label": "Reinforced Concrete Foundation Pad" },
      { "src": "/curated/commercial/com-warehouse-industrial-floor.jpg", "label": "High-Load Industrial Warehouse Concrete Floor" }
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
      { "src": "/curated/commercial/com-office-park-exterior-program.jpg", "label": "Office Building Exterior Maintenance Program" },
      { "src": "/curated/commercial/com-retail-strip-envelope-rehab.jpg", "label": "Retail Center Portfolio Exterior & Envelope Rehab" },
      { "src": "/curated/commercial/com-office-corridor-turnover.jpg", "label": "Commercial Corridor & Common-Area Turnover" }
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
      { "src": "/curated/capabilities/fire-steel-ibeam.jpg", "label": "Structural Steel Frame Rebuild After Loss" },
      { "src": "/curated/pairs/div04_03_antes.jpg", "label": "Commercial Roof & Storm Damage Assessment" },
      { "src": "/curated/commercial/com-water-mitigation-office.jpg", "label": "Commercial Office Water Mitigation & Drywall Removal" }
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
      {/* ── MARQUEE EDITORIAL CINÉTICO (.tayco-editorial-ticker) ── */}
      <div
        className="tayco-editorial-ticker"
        aria-label="TAYCO specialties"
      >
        <div>
          <span className="gold">Concrete, Foundations &amp; Site Preparation</span>
          <i aria-hidden="true">✳</i>
          <span>Framing &amp; Structural Coordination</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Roofing, Siding &amp; Exterior Envelope</span>
          <i aria-hidden="true">✳</i>
          <span>Drywall, Flooring &amp; Interior Finishes</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Concrete, Foundations &amp; Site Preparation</span>
          <i aria-hidden="true">✳</i>
          <span>Framing &amp; Structural Coordination</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Roofing, Siding &amp; Exterior Envelope</span>
          <i aria-hidden="true">✳</i>
          <span>Drywall, Flooring &amp; Interior Finishes</span>
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

      {/* Services Gallery */}
      <section
        id="services"
        className="section-editorial-ivory py-14 sm:py-20 px-4 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <h2
                className="font-black tracking-tight"
                style={{
                  color: "#0F2040",
                  fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
                  lineHeight: 1.06,
                }}
              >
                Services
              </h2>
            </div>

            {/* Interactive Category Filter */}
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter services"
            >
              {[
                {
                  id: "all",
                  label: "All",
                },
                {
                  id: "structural_envelope",
                  label: "Structural & Envelope",
                },
                {
                  id: "interior_ti",
                  label: "Interiors & Fit-Outs",
                },
                {
                  id: "site_restoration",
                  label: "Site & Restoration",
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

          {/* 10 Multi-Photo Service Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredTrades.map((card) => (
              <div
                key={card.num}
                data-response-kind="surface"
                className="tayco-living-card editorial-ivory-card p-5 sm:p-6 flex flex-col justify-between group"
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
                    badge={card.csiCode}
                    accentColor={card.accent}
                  />
                </div>

                <div
                  className="relative z-10 pt-3 border-t flex flex-wrap items-center justify-between gap-3"
                  style={{ borderColor: "rgba(27, 58, 107, 0.16)" }}
                >
                  <h3
                    className="text-lg sm:text-xl font-black tracking-tight leading-snug"
                    style={{ color: "#0F2040" }}
                  >
                    {card.titleNode}
                  </h3>
                  <Link
                    href={`/estimate?trade=${encodeURIComponent(card.csiCode)}`}
                    data-magnetic
                    className="px-4 py-2 rounded-xl text-xs font-black transition-transform hover:scale-105"
                    style={{ background: "#0F2040", color: "#F3D37A" }}
                  >
                    Request Estimate →
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

      {/* ── INTERACTIVE BEFORE & AFTER TRANSFORMATION STUDIO ── */}
      <TransformationBeforeAfterStudio
        siteDivision="commercial"
        initialDivision="div03"
        initialPairId="div03_01"
        eyebrowLabel="Before & After"
      />

      {/* ── DUAL-TRACK ARCHITECTURAL FILMSTRIP MARQUEE ── */}
      <DualTrackArchitecturalMarquee siteDivision="commercial" />

      {/* Trade Gallery */}
      <section
        id="projects"
        className="py-14 sm:py-20 px-4 sm:px-8 relative z-10"
        style={{ background: "#070E1A" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="pt-2">
            <div className="text-center mb-8">
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Trade Gallery
              </h3>
            </div>
            <TradeGallery />
          </div>
        </div>
      </section>

      <section id="service-area" className="section-editorial-ivory px-4 sm:px-8 py-14">
        <div className="max-w-7xl mx-auto">
          <p className="tayco-eyebrow mb-2 text-[#1B3A6B]">Service Area</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F2040]">Regional Coverage</h2>
          <p className="max-w-2xl text-sm text-slate-600 mt-2 mb-6">Projects outside these service areas are evaluated by scope and schedule.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {COMPANY_SERVICE_AREAS.map(area => <div key={area.code} className="tayco-living-card editorial-ivory-card p-5"><p className="tayco-eyebrow text-[#1B3A6B]">{area.code}</p><h3 className="font-bold text-[#0F2040] mt-2">{area.state}</h3><p className="text-sm text-slate-600 mt-2 leading-relaxed">{area.cities}</p></div>)}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-6">
            <a href={COMPANY.phoneHref} className="inline-flex font-bold text-[#0F2040] underline underline-offset-4">Call {COMPANY.phoneDisplay}</a>
            <Link href="/estimate" className="inline-flex font-bold text-[#1B3A6B] underline underline-offset-4">Request Estimate →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
