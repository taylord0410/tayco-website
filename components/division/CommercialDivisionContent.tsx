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
    "csiCode": "Windows & Doors",
    "titleNode": "Windows & Doors",
    "titlePlain": "Windows & Doors",
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
    "titleNode": "Framing",
    "titlePlain": "Framing",
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
      { "src": "/curated/hero/com-dusk-steel.jpg", "label": "Structural Envelope & Steel Framing" }
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
    "csiCode": "Drywall",
    "titleNode": "Drywall",
    "titlePlain": "Drywall",
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
    "csiCode": "Carpentry",
    "titleNode": "Carpentry",
    "titlePlain": "Carpentry",
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
    "csiCode": "Demolition",
    "titleNode": "Demolition",
    "titlePlain": "Demolition",
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
    "csiCode": "Foundations",
    "titleNode": "Foundations",
    "titlePlain": "Foundations",
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
    "csiCode": "Remodeling",
    "titleNode": "Remodeling",
    "titlePlain": "Remodeling",
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
    "csiCode": "Painting",
    "titleNode": "Painting",
    "titlePlain": "Painting",
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
          <span className="gold">Roofing</span>
          <i aria-hidden="true">✳</i>
          <span>Siding</span>
          <i className="gold-star" aria-hidden="true">✳</i>
          <span className="gold">Windows &amp; Doors</span>
          <i aria-hidden="true">✳</i>
          <span>Framing</span>
          <i className="gold-star" aria-hidden="true">✳</i>
          <span className="gold">Drywall</span>
          <i aria-hidden="true">✳</i>
          <span>Flooring</span>
          <i className="gold-star" aria-hidden="true">✳</i>
          <span className="gold">Carpentry</span>
          <i aria-hidden="true">✳</i>
          <span>Masonry</span>
          <i className="gold-star" aria-hidden="true">✳</i>
          <span className="gold">Roofing</span>
          <i aria-hidden="true">✳</i>
          <span>Siding</span>
          <i className="gold-star" aria-hidden="true">✳</i>
          <span className="gold">Windows &amp; Doors</span>
          <i aria-hidden="true">✳</i>
          <span>Framing</span>
          <i className="gold-star" aria-hidden="true">✳</i>
          <span className="gold">Drywall</span>
          <i aria-hidden="true">✳</i>
          <span>Flooring</span>
          <i className="gold-star" aria-hidden="true">✳</i>
          <span className="gold">Carpentry</span>
          <i aria-hidden="true">✳</i>
          <span>Masonry</span>
        </div>
      </div>

      {/* ── INTERACTIVE BEFORE & AFTER TRANSFORMATION STUDIO ── */}
            {/* ServiceCardTriptych retained via COMMERCIAL_CSI_TRADES */}
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
