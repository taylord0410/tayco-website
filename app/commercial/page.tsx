"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import TradeGallery from "@/components/TradeGallery";
import ProtectedImage, { preloadProtectedImages } from "@/components/ProtectedImage";
import {
  TransformationBeforeAfterStudio,
  DualTrackArchitecturalMarquee,
  RegionalFootprintStrip,
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

const COMMERCIAL_HERO_SCENES = [
  {
    id: "com-hero-1",
    sector: "Corporate HQ & Lobby",
    title: "Double-Height Limestone Atrium & Reception Millwork",
    csi: "DIV 04 · 06 · 09",
    image: "/curated/hero/com-lobby-limestone.jpg",
    gallery: ["/curated/commercial/cx_i2.jpg", "/curated/commercial/com_03_2.jpg", "/curated/commercial/cx_y1.jpg"],
    summary: "Turnkey commercial lobby, reception millwork, stone cladding and porcelain tile flooring.",
  },
  {
    id: "com-hero-2",
    sector: "Class-A Office & TI",
    title: "Executive Glass Partition Suite & Open-Plan Tenant Fit-Out",
    csi: "DIV 08 · 09 · 26",
    image: "/curated/hero/com-reception-walnut.jpg",
    gallery: ["/curated/commercial/cx_i1.jpg", "/curated/commercial/com_03_1.jpg", "/curated/commercial/cx_i3.jpg"],
    summary: "Acoustic glass demising walls, custom conference millwork and occupied-building phasing.",
  },
  {
    id: "com-hero-3",
    sector: "Retail & Plaza Envelope",
    title: "Commercial Stone & Glass Storefront Plaza Envelope",
    csi: "DIV 04 · 07 · 08",
    image: "/curated/hero/com-plaza-stone.jpg",
    gallery: ["/curated/commercial/com_02_2.jpg", "/curated/commercial/cx_o1.jpg", "/curated/commercial/cx_o2.jpg"],
    summary: "Masonry facade piers, storefront glazing, commercial canopy systems and pedestrian plaza concrete.",
  },
  {
    id: "com-hero-4",
    sector: "Medical & Institutional",
    title: "Clinical Corridor, Institutional Classrooms & Hygienic Fit-Outs",
    csi: "DIV 09 · 22 · 26",
    image: "/curated/commercial/cx_h3.jpg",
    gallery: ["/curated/commercial/cx_h2.jpg", "/curated/commercial/com_03_1.jpg", "/curated/commercial/cx_r2.jpg"],
    summary: "Healthcare and institutional tenant build-outs with acoustic control and infection-control surfaces.",
  },
  {
    id: "com-hero-5",
    sector: "Industrial & Structural",
    title: "High-Bay Warehouse Mezzanine, Steel Framing & Concrete Slab",
    csi: "DIV 03 · 05 · 07",
    image: "/curated/commercial/cx_x3.jpg",
    gallery: ["/curated/commercial/cx_x4.jpg", "/curated/commercial/cx_f1.jpg", "/curated/commercial/cx_f3.jpg"],
    summary: "Heavy-duty reinforced slabs, cold-formed & structural steel framing, and warehouse mezzanine offices.",
  },
  {
    id: "com-hero-6",
    sector: "Multi-Family & Mixed-Use",
    title: "Multi-Story Residential Communities, Exteriors & Portfolio Turnovers",
    csi: "DIV 06 · 07 · 09",
    image: "/curated/commercial/com_02_1.jpg",
    gallery: ["/curated/commercial/cx_m1.jpg", "/curated/commercial/cx_m2.jpg", "/curated/commercial/cx_m3.jpg"],
    summary: "Multi-unit exterior envelopes, common-area amenities and multi-property renovation programs.",
  },
] as const;

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
      { "src": "/curated/commercial/cx_o2.jpg", "label": "Masonry Facade, Canopy & Architectural Fascia" }
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
      { "src": "/curated/commercial/cx_f1.jpg", "label": "Multi-Story Cold-Formed Steel Stud Framing" },
      { "src": "/curated/magazine/revista_fr_metal_04.jpg", "label": "Commercial Structural Steel Superstructure" },
      { "src": "/curated/commercial/cx_f2.jpg", "label": "3-Story Multi-Family Structural Wood Framing" }
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
      { "src": "/curated/commercial/cx_h3.jpg", "label": "Hygienic Commercial Sheet-Vinyl Corridor" }
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
      { "src": "/curated/commercial/cx_i3.jpg", "label": "Suspended Acoustic Clouds & Interior Finish" }
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
      { "src": "/curated/commercial/cx_f3.jpg", "label": "Poured Commercial Slab & Stem Walls" },
      { "src": "/curated/pairs/div01_01_antes.jpg", "label": "Reinforced Concrete Foundation Pad" },
      { "src": "/curated/commercial/cx_x4.jpg", "label": "High-Load Industrial Warehouse Concrete Floor" }
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
      { "src": "/curated/commercial/cx_m3.jpg", "label": "Townhome Portfolio Exterior & Envelope Rehab" },
      { "src": "/curated/commercial/cx_y2.jpg", "label": "Multi-Unit Corridor & Common-Area Turnover" }
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
      { "src": "/curated/capabilities/fire-subfloor-joists.jpg", "label": "Water Mitigation & Structural Deck Rebuild" }
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

export default function CommercialPage() {
  const [lightAngle, setLightAngle] = useState<number>(42);
  const [activeCategory, setActiveCategory] =
    useState<CommercialTradeCategory>("all");
  const [heroIdx, setHeroIdx] = useState<number>(0);

  useEffect(() => {
    preloadProtectedImages(COMMERCIAL_HERO_SCENES.flatMap((s) => [s.image, ...s.gallery]));
    const timer = window.setInterval(() => {
      setHeroIdx((prev) => (prev + 1) % COMMERCIAL_HERO_SCENES.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, []);

  const currentHeroScene =
    COMMERCIAL_HERO_SCENES[heroIdx] ?? COMMERCIAL_HERO_SCENES[0];

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
      {/* Project services and resources */}
      <section
        id="commercial-executive-hero"
        className="relative overflow-hidden py-16 sm:py-24 px-4 sm:px-8 border-b"
        style={{
          background: `radial-gradient(circle at ${18 + lightAngle * 0.65}% 18%, rgba(201, 168, 76, 0.2), transparent 45%), linear-gradient(${115 + lightAngle * 0.35}deg, #070E1A 0%, #0F2040 55%, #1B3A6B 100%)`,
          borderColor: "rgba(201, 168, 76, 0.35)",
        }}
      >
        {/* Live 6-Scene Commercial Backdrop Cycler */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <ProtectedImage
            data-hero-backdrop="commercial"
            src={currentHeroScene.image}
            alt=""
            className="w-full h-full object-cover opacity-25 scale-105 transition-all duration-1000"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(108deg, rgba(7,14,26,0.95) 0%, rgba(11,23,42,0.86) 52%, rgba(7,14,26,0.93) 100%)",
            }}
          />
        </div>

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
          {/* Project services and resources */}
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
                      TAYCO COMMERCIAL DIVISION · CONSTRUCTION &amp; RENOVATION ·
                    </textPath>
                  </text>
                </svg>
                <span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <ProtectedImage
                    src="/logo.png"
                    alt="TAYCO LLC"
                    className="w-11 h-11 object-contain drop-shadow-[0_0_10px_rgba(201,168,76,0.45)]"
                  />
                </span>
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
                  COMMERCIAL CONSTRUCTION · ONE POINT OF CONTACT
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

          {/* Split Executive Hero: Left Copy + Sector Pills | Right Live Commercial Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mb-12">
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <p className="text-slate-200 text-base sm:text-lg leading-relaxed">
                  TAYCO LLC coordinates ground-up construction, commercial renovations and tenant improvements.
                  Talk to one team about the scope, schedule, trades and decisions that move your project forward.
                </p>

                {/* Interactive 6-Sector Commercial Scene Selector */}
                <div className="mt-6">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-amber-300 mb-2.5">
                    EXPLORE COMMERCIAL SECTORS (0{heroIdx + 1} / 0{COMMERCIAL_HERO_SCENES.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMMERCIAL_HERO_SCENES.map((scene, idx) => {
                      const active = idx === heroIdx;
                      return (
                        <button
                          key={scene.id}
                          type="button"
                          onClick={() => setHeroIdx(idx)}
                          className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer"
                          style={{
                            background: active ? "#C9A84C" : "rgba(15, 32, 64, 0.78)",
                            color: active ? "#070E1A" : "#E2E8F0",
                            borderColor: active ? "#F3D37A" : "rgba(201, 168, 76, 0.34)",
                          }}
                        >
                          0{idx + 1} · {scene.sector}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mt-7">
                  <Link
                    href="/estimate"
                    data-magnetic
                    className="px-6 py-3.5 rounded-xl font-black text-sm transition-transform hover:scale-105 shadow-lg"
                    style={{ background: "#C9A84C", color: "#070E1A" }}
                  >
                    Request a commercial estimate →
                  </Link>
                  <Link
                    href="/login"
                    data-magnetic
                    className="px-6 py-3.5 rounded-xl font-bold text-sm text-white border transition-colors hover:bg-white/10"
                    style={{
                      borderColor: "rgba(201, 168, 76, 0.55)",
                      background: "rgba(15, 32, 64, 0.7)",
                    }}
                  >
                    Client project sign in →
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

              <div
                data-response-kind="surface"
                className="tayco-living-card p-5 rounded-2xl border mt-6"
                style={{
                  background: `linear-gradient(${lightAngle}deg, rgba(15, 32, 64, 0.92), rgba(7, 14, 26, 0.96))`,
                  borderColor: "rgba(201, 168, 76, 0.45)",
                }}
              >
                <div className="flex items-center justify-between text-xs font-mono text-emerald-300 font-bold mb-1.5">
                  <span>YOUR PROJECT, COORDINATED</span>
                  <span>PLANNING TO DELIVERY</span>
                </div>
                <div className="text-xl font-black font-mono text-white">
                  One team{" "}
                  <span className="text-xs font-normal text-amber-300">
                    for the work ahead
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  From the first review through the final walk-through, bring your trades, requirements and next steps into one clear plan.
                </p>
              </div>
            </div>

            {/* Right 5 Columns: Interactive Commercial Sector Stage Card */}
            <div className="lg:col-span-5 flex flex-col">
              <div
                data-response-kind="surface"
                className="tayco-living-card rounded-2xl border overflow-hidden shadow-2xl flex-1 flex flex-col justify-between"
                style={{
                  background: "rgba(7, 14, 26, 0.92)",
                  borderColor: "rgba(201, 168, 76, 0.52)",
                }}
              >
                <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <ProtectedImage
                    src={currentHeroScene.image}
                    alt={currentHeroScene.title}
                    className="w-full h-full object-cover transition-all duration-700"
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(7,14,26,0.45) 0%, rgba(7,14,26,0.08) 45%, rgba(7,14,26,0.92) 100%)",
                    }}
                  />
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                      style={{
                        background: "rgba(7, 14, 26, 0.85)",
                        color: "#F3D37A",
                        border: "1px solid rgba(201, 168, 76, 0.55)",
                      }}
                    >
                      {currentHeroScene.sector}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold"
                      style={{
                        background: "rgba(16, 185, 129, 0.2)",
                        color: "#6EE7B7",
                        border: "1px solid rgba(16, 185, 129, 0.45)",
                      }}
                    >
                      {currentHeroScene.csi}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3.5 right-3.5">
                    <div className="text-sm sm:text-base font-black text-white leading-snug">
                      {currentHeroScene.title}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {currentHeroScene.summary}
                    </p>
                  </div>
                </div>

                {/* 3 Curated Sector Detail Thumbnails */}
                <div className="p-3.5 border-t border-white/10">
                  <div className="grid grid-cols-3 gap-2">
                    {currentHeroScene.gallery.map((thumb, tIdx) => (
                      <div
                        key={`com-hero-thumb-${tIdx}`}
                        className="relative overflow-hidden rounded-lg border aspect-[16/10]"
                        style={{ borderColor: "rgba(201, 168, 76, 0.35)" }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <ProtectedImage
                          src={thumb}
                          alt={`${currentHeroScene.sector} detail ${tIdx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 5 Commercial KPI Cards with Thumbnail Previews */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                metric: "Plan",
                label: "Scope & priorities",
                sub: "Start with drawings, photos or an idea",
                accent: "#C9A84C",
                img: "/curated/commercial/cx_o1.jpg",
              },
              {
                metric: "Build",
                label: "Ground-up construction",
                sub: "Site, structure and coordinated trades",
                accent: "#10B981",
                img: "/curated/commercial/cx_f1.jpg",
              },
              {
                metric: "Adapt",
                label: "Tenant improvements",
                sub: "Fit the space to your business",
                accent: "#4A90D9",
                img: "/curated/commercial/cx_i1.jpg",
              },
              {
                metric: "Restore",
                label: "Property recovery",
                sub: "Fire & water reconstruction",
                accent: "#F97316",
                img: "/curated/capabilities/fire-steel-ibeam.jpg",
              },
              {
                metric: "8 States",
                label: "Service coverage",
                sub: "Contact us about your location",
                accent: "#F3D37A",
                img: "/curated/hero/com-plaza-stone.jpg",
              },
            ].map((item) => (
              <div
                key={item.label}
                data-response-kind="surface"
                className="tayco-living-card p-3.5 rounded-2xl border flex items-center gap-3"
                style={{
                  background: `linear-gradient(${lightAngle}deg, rgba(15, 32, 64, 0.88) 0%, rgba(7, 14, 26, 0.94) 100%)`,
                  borderColor: "rgba(201, 168, 76, 0.32)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <ProtectedImage
                  src={item.img}
                  alt={item.label}
                  className="w-12 h-12 rounded-xl object-cover border shrink-0"
                  style={{ borderColor: "rgba(201, 168, 76, 0.45)" }}
                  loading="lazy"
                />
                <div className="min-w-0">
                  <div
                    className="text-lg sm:text-xl font-black font-mono leading-tight"
                    style={{ color: item.accent }}
                  >
                    {item.metric}
                  </div>
                  <div className="text-xs font-bold text-white truncate">
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {item.sub}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <RegionalFootprintStrip />
        </div>
      </section>

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
                    <span>⏱️ {card.scheduleNote}</span>
                    <span>·</span>
                    <span>📐 {card.planningNote}</span>
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
    </main>
  );
}
