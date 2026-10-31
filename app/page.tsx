"use client";
import { ImageReferenceButton } from "@/components/EstimateReferences";
import "@/components/home-editorial.css";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TaycoModalOverlay,
  TaycoSectionHeader,
  TaycoPillDock,
} from "@/components/ui/TaycoDesignSystem";
import { HomeEditorialCard, HomeEditorialGallery, type HomeGallerySelection } from "@/components/HomeEditorialCard";
import { COMPANY } from "@/lib/company";
import ContractingOpportunities from "@/components/ContractingOpportunities";
import TradeGallery from "@/components/TradeGallery";
import ProtectedImage, { preloadProtectedImages } from "@/components/ProtectedImage";
import {
  TransformationBeforeAfterStudio,
  DualTrackArchitecturalMarquee,
  RegionalStateFootprintStrip,
} from "@/components/LandingLivingShowcase";
import { LandingPropertyCategoriesSection } from "@/components/PropertyCategoryShowcase";

type ServiceFilter = "all" | "commercial" | "residential" | "partners";

interface ShowcaseCardFrame {
  src: string;
  caption: string;
  csi: string;
}

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
  frames: [ShowcaseCardFrame, ShowcaseCardFrame, ShowcaseCardFrame];
}> = [
  {
    id: "service-1",
    category: "commercial",
    eyebrow: "01 / PLANNING & PRE-CONSTRUCTION",
    title: "Clear scope.",
    serifEm: "Better starts.",
    subtitle: "Site survey, takeoffs & estimates",
    summary:
      "Share your drawings, site photos and priorities. We align structural requirements, material selections and trade schedules before mobilization.",
    metric: "CSI 01–33",
    metricLabel: "Full-scope pre-construction review",
    href: "/estimate",
    cta: "Request a free estimate",
    sparkPath: "M2,28 L18,24 L36,19 L54,21 L72,12 L94,9 L114,4",
    stroke: "#C9A84C",
    badgeColor: "#C9A84C",
    frames: [
      {
        src: "/curated/properties/mkt-sfh-concrete.jpg",
        caption: "Surveyed Foundation Grid & Site Layout",
        csi: "DIV 31 · SITE PREP",
      },
      {
        src: "/curated/properties/mkt-mf-framing-trusses.jpg",
        caption: "Engineered Timber Framing & Trusses",
        csi: "DIV 06 · FRAMING",
      },
      {
        src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
        caption: "Turnkey Executive Boardroom Delivery",
        csi: "DIV 09 · FINISHES",
      },
    ],
  },
  {
    id: "service-2",
    category: "commercial",
    eyebrow: "02 / COMMERCIAL CONSTRUCTION",
    title: "Spaces built for",
    serifEm: "your business.",
    subtitle: "Ground-up, fit-outs & envelopes",
    summary:
      "Ground-up commercial construction, Class-A office and retail tenant improvements, structural framing and exterior envelope systems.",
    metric: "Commercial",
    metricLabel: "Office, retail, hospitality & industrial",
    href: "/commercial",
    cta: "Explore commercial services",
    sparkPath: "M2,30 L22,18 L40,22 L58,10 L78,14 L96,6 L114,5",
    stroke: "#1B3A6B",
    badgeColor: "#C9A84C",
    frames: [
      {
        src: "/curated/capabilities/com-boardroom.jpg",
        caption: "Acoustic Wood-Slat Executive Conference Suite",
        csi: "DIV 06 / 09 · CORPORATE",
      },
      {
        src: "/curated/capabilities/com-retail-led.jpg",
        caption: "Boutique Retail Millwork & Suspended LED Clouds",
        csi: "DIV 06 / 26 · RETAIL",
      },
      {
        src: "/curated/capabilities/com-walnut-lounge.jpg",
        caption: "Custom Walnut Architectural Lounge & Library",
        csi: "DIV 06 40 00 · MILLWORK",
      },
    ],
  },
  {
    id: "service-3",
    category: "residential",
    eyebrow: "03 / RESIDENTIAL TURNKEY",
    title: "More life in",
    serifEm: "every room.",
    subtitle: "Full-home remodeling & additions",
    summary:
      "Chef's kitchens, custom millwork, lower-level living suites, structural timber decks and complete exterior envelope transformations.",
    metric: "Turnkey",
    metricLabel: "Kitchens, additions, decks & exteriors",
    href: "/residential",
    cta: "Explore residential services",
    sparkPath: "M2,26 L20,28 L38,16 L56,18 L74,9 L94,11 L114,3",
    stroke: "#0F2040",
    badgeColor: "#C9A84C",
    frames: [
      {
        src: "/curated/properties/interior-limestone-modern-kitchen.jpg",
        caption: "Navy Island Kitchen, Quartz & White Oak Flooring",
        csi: "RES · KITCHEN REMODEL",
      },
      {
        src: "/curated/capabilities/res-basement-media.jpg",
        caption: "Finished Lower-Level Media Suite & Custom Built-Ins",
        csi: "RES · BASEMENT SUITE",
      },
      {
        src: "/curated/properties/interior-singlefamily-greatroom-stone.jpg",
        caption: "Coffered Ceiling Grid, Stone Hearth & Cabinetry",
        csi: "RES · FINISH CARPENTRY",
      },
    ],
  },
  {
    id: "service-4",
    category: "residential",
    eyebrow: "04 / RESTORATION & RECONSTRUCTION",
    title: "A clear route to",
    serifEm: "recovery.",
    subtitle: "Fire, water & structural rebuild",
    summary:
      "From emergency mitigation and structural steel or timber framing to drywall, hardwood flooring and complete property reconstruction.",
    metric: "Restore",
    metricLabel: "Mitigation to full structural rebuild",
    href: "/residential#restoration",
    cta: "Discuss your restoration",
    sparkPath: "M2,31 L16,29 L34,20 L52,12 L70,15 L90,7 L114,4",
    stroke: "#C9A84C",
    badgeColor: "#C9A84C",
    frames: [
      {
        src: "/curated/capabilities/fire-wood-framing.jpg",
        caption: "Full Two-Story Structural Wood Framing & Trusses",
        csi: "DIV 06 · STRUCTURAL REBUILD",
      },
      {
        src: "/curated/capabilities/mit-taped-drywall.jpg",
        caption: "Post-Mitigation Drywall Taping & Interior Finish",
        csi: "DIV 09 · INTERIOR RECOVERY",
      },
      {
        src: "/curated/capabilities/fire-steel-ibeam.jpg",
        caption: "Two-Story Structural Steel I-Beam Skeleton",
        csi: "DIV 05 · STEEL RECONSTRUCTION",
      },
    ],
  },
  {
    id: "service-5",
    category: "partners",
    eyebrow: "05 / MULTI-FAMILY, REO & CAPEX",
    title: "One property or",
    serifEm: "a portfolio.",
    subtitle: "Asset preservation & multi-family CapEx",
    summary:
      "Multi-family exterior envelope upgrades, commercial TPO and shingle roofing programs, unit turnovers and REO asset preservation across 8 states.",
    metric: "Portfolio",
    metricLabel: "Multi-family, REO & institutional assets",
    href: "/investor",
    cta: "Tell us about your properties",
    sparkPath: "M2,29 L24,23 L44,17 L64,19 L82,11 L98,8 L114,4",
    stroke: "#1B3A6B",
    badgeColor: "#C9A84C",
    frames: [
      {
        src: "/curated/capabilities/mf-apartments-4story.jpg",
        caption: "Four-Story Multi-Family Apartment Envelope & CapEx",
        csi: "MULTI-FAMILY · EXTERIOR",
      },
      {
        src: "/curated/capabilities/mf-townhomes-row.jpg",
        caption: "Three-Story Cedar & Siding Townhome Community",
        csi: "PORTFOLIO · TOWNHOMES",
      },
      {
        src: "/curated/capabilities/reo-roof-3phase.jpg",
        caption: "Three-Phase Roof Deck, Underlayment & Shingle Recovery",
        csi: "REO · ASSET PRESERVATION",
      },
    ],
  },
  {
    id: "service-6",
    category: "partners",
    eyebrow: "06 / TRADE PARTNERS & FIELD CREWS",
    title: "Good work starts with",
    serifEm: "good people.",
    subtitle: "Suppliers & specialty subcontractors",
    summary:
      "Qualified carpentry, roofing, siding, drywall, masonry and flooring crews: connect with our project management team for active regional bids.",
    metric: "8 States",
    metricLabel: "WI · IL · IA · IN · MN · MI · MO · TX",
    href: "/vendor-application",
    cta: "Apply as a trade partner",
    sparkPath: "M2,27 L19,21 L37,24 L57,14 L77,11 L95,6 L114,4",
    stroke: "#1B3A6B",
    badgeColor: "#C9A84C",
    frames: [
      {
        src: "/curated/capabilities/reo-siding-wrap.jpg",
        caption: "Weather-Barrier Envelope & Lap Siding Execution",
        csi: "DIV 07 · ENVELOPE CREWS",
      },
      {
        src: "/curated/capabilities/mit-hardwood-underlay.jpg",
        caption: "Precision Hardwood Flooring & Acoustic Underlayment",
        csi: "DIV 09 · FLOORING CREWS",
      },
      {
        src: "/curated/properties/mkt-twn-framing-rooftop.jpg",
        caption: "Engineered Floor Joist & Foundation Framing",
        csi: "DIV 06 · FRAMING CREWS",
      },
    ],
  },
];

const LIGHT_STUDIES: Array<{
  index: number;
  code: string;
  buttonTitle: string;
  label: string;
  note: string;
  color: string;
  specMetric: string;
  image: string;
  csi: string;
  sheenProfile: string;
  grainDepth: string;
}> = [
  {
    index: 0,
    code: "MATERIAL STUDY 01 · POLISHED CONCRETE",
    buttonTitle: "01 / Diamond-honed terrazzo concrete",
    label: "CONCRETE / EXPOSED AGGREGATE",
    note: "Diamond-polished architectural concrete slab where low-angle grazing light reveals fine stone aggregate and long specular floor reflections.",
    color: "#C9A84C",
    specMetric: "Terrazzo · Specular",
    image: "/work/flooring/polished-concrete_2.jpg",
    csi: "CSI 03 35 43 · POLISHED CONCRETE FINISHING",
    sheenProfile: "High-Gloss Honed (82 GU)",
    grainDepth: "0.4 mm Micro-Aggregate",
  },
  {
    index: 1,
    code: "MATERIAL STUDY 02 · NATURAL CLEFT SLATE",
    buttonTitle: "02 / Natural cleft stone & masonry",
    label: "NATURAL STONE / CLEFT RELIEF",
    note: "Hand-split natural stone tile whose layered geological ridges cast dramatic micro-shadows under oblique raking illumination.",
    color: "#E2C675",
    specMetric: "Natural Slate · Relief",
    image: "/work/flooring/natural-stone_2.jpg",
    csi: "CSI 09 30 33 · NATURAL STONE TILING",
    sheenProfile: "Matte Mineral Cleft (18 GU)",
    grainDepth: "2.8 mm Split Topographic Relief",
  },
  {
    index: 2,
    code: "MATERIAL STUDY 03 · HERRINGBONE WHITE OAK",
    buttonTitle: "03 / Herringbone white-oak millwork",
    label: "ENGINEERED OAK / PARQUET",
    note: "Alternating 45-degree herringbone oak staves catch lateral daylight in opposite grain directions, creating a living checkerboard of warm gold and shadow.",
    color: "#F3D37A",
    specMetric: "Herringbone · Grain",
    image: "/work/flooring/engineered-hardwood_2.jpg",
    csi: "CSI 09 64 29 · WOOD PARQUET FLOORING",
    sheenProfile: "Satin Architectural Urethane (35 GU)",
    grainDepth: "1.2 mm Wire-Brushed Oak Grain",
  },
  {
    index: 3,
    code: "MATERIAL STUDY 04 · WIDE-PLANK EUROPEAN OAK",
    buttonTitle: "04 / Wide-plank timber under sunbeam",
    label: "SOLID HARDWOOD / WIDE PLANK",
    note: "Wide-plank cathedral-grain oak cut by a diagonal raking sunbeam, demonstrating how bevels and board flatness perform under direct window light.",
    color: "#C9A84C",
    specMetric: "Wide-Plank · Bevel",
    image: "/work/flooring/engineered-hardwood_1.jpg",
    csi: "CSI 09 64 00 · WOOD FLOORING ASSEMBLIES",
    sheenProfile: "Low-Luster Natural Oil (24 GU)",
    grainDepth: "1.5 mm Micro-Beveled Plank Edge",
  },
  {
    index: 4,
    code: "MATERIAL STUDY 05 · COMMERCIAL METALLIC EPOXY",
    buttonTitle: "05 / Seamless metallic commercial epoxy",
    label: "RESINOUS FLOORING / METALLIC",
    note: "High-build commercial metallic epoxy system with three-dimensional pigment swirl and seamless chemical/impact resistance under overhead lighting.",
    color: "#E2C675",
    specMetric: "Resinous · Metallic",
    image: "/curated/magazine/revista_ep_metal.jpg",
    csi: "CSI 09 67 23 · RESINOUS FLOORING SYSTEMS",
    sheenProfile: "Mirror-Grade High Build (94 GU)",
    grainDepth: "0.1 mm Seamless Monolithic Coat",
  },
  {
    index: 5,
    code: "MATERIAL STUDY 06 · ARCHITECTURAL PORCELAIN",
    buttonTitle: "06 / Large-format architectural porcelain",
    label: "PORCELAIN / RECTIFIED PLANK",
    note: "Rectified commercial-grade porcelain with crisp 1/16-inch grout joints engineered for high-traffic lobbies, corridors and wet-area durability.",
    color: "#F3D37A",
    specMetric: "Porcelain · Rectified",
    image: "/work/flooring/porcelain-tile_1.jpg",
    csi: "CSI 09 30 13 · CERAMIC & PORCELAIN TILING",
    sheenProfile: "Architectural Matte-Satin (28 GU)",
    grainDepth: "0.9 mm Kiln-Pressed Surface Texture",
  },
];

const PROJECT_STEPS = [
  {
    code: "01",
    name: "Site Survey & Scope Definition",
    location: "Project goals & site conditions",
    division: "Plans, site walk-through, measurements & priorities",
    sqft: "Phase 01 · Pre-Construction",
    headline: "Define the scope",
    phase: "Initial inquiry & site survey",
    status: "Step 01 · Site & Scope",
    requestHref: "/estimate",
    accent: "#C9A84C",
    image: "/curated/properties/mkt-twn-concrete-drive.jpg",
    csiTag: "CSI DIV 01 / 31 · SURVEY & SITE PREP",
    deliverables: [
      "Existing conditions & site verification",
      "Trade-by-trade scope boundary matrix",
      "Preliminary schedule & mobilization plan",
    ],
  },
  {
    code: "02",
    name: "Structural Framing & Core Shell",
    location: "Engineered wood & cold-formed steel",
    division: "Load-bearing framing, trusses, subfloors & shear sheathing",
    sqft: "Phase 02 · Structural Shell",
    headline: "Build the frame",
    phase: "Structural execution",
    status: "Step 02 · Framing & Structure",
    requestHref: "/estimate",
    accent: "#DFC06C",
    image: "/curated/properties/mkt-mf-framing.jpg",
    csiTag: "CSI DIV 05 / 06 · STEEL & WOOD FRAMING",
    deliverables: [
      "Cold-formed steel & structural timber framing",
      "Roof truss erection & OSB exterior sheathing",
      "Plumb, level & structural inspection sign-off",
    ],
  },
  {
    code: "03",
    name: "Rough-In, Insulation & Drywall",
    location: "Interior partitions & acoustic envelope",
    division: "MEP coordination, thermal insulation & Level-4 gypsum finish",
    sqft: "Phase 03 · Interior Envelope",
    headline: "Close the walls",
    phase: "Rough-in & drywall",
    status: "Step 03 · Drywall & Rough-In",
    requestHref: "/estimate",
    accent: "#C9A84C",
    image: "/curated/properties/mkt-twn-framing-drywall.jpg",
    csiTag: "CSI DIV 07 / 09 · INSULATION & GYPSUM",
    deliverables: [
      "In-wall rough-in & fire-rated assemblies",
      "Curved soffits, bulkheads & acoustic grids",
      "Taped, mudded & primed Level-4 surfaces",
    ],
  },
  {
    code: "04",
    name: "Architectural Millwork & Finishes",
    location: "Cabinetry, flooring, stone & coatings",
    division: "Custom carpentry, hardwood/tile installation & precision painting",
    sqft: "Phase 04 · Craft & Finishes",
    headline: "Elevate every detail",
    phase: "Interior finishes",
    status: "Step 04 · Millwork & Surfaces",
    requestHref: "/estimate",
    accent: "#E2C675",
    image: "/curated/properties/mkt-mf-carpentry-lounge.jpg",
    csiTag: "CSI DIV 06 / 09 · MILLWORK & FLOORING",
    deliverables: [
      "Custom cabinetry, feature walls & trim carpentry",
      "Hardwood, porcelain, stone & epoxy flooring",
      "Architectural coatings & fixture trim-out",
    ],
  },
  {
    code: "05",
    name: "Exterior Envelope & Final Handover",
    location: "Roofing, facades & closeout walk-through",
    division: "Standing-seam/TPO roofing, masonry, glazing & final punch-list",
    sqft: "Phase 05 · Turnkey Handover",
    headline: "Finished space",
    phase: "Closeout & warranty",
    status: "Step 05 · Final Handover",
    requestHref: "/estimate",
    accent: "#F3D37A",
    image: "/curated/properties/mkt-com-stone-colonnade.jpg",
    csiTag: "CSI DIV 04 / 07 / 08 · ENVELOPE & CLOSEOUT",
    deliverables: [
      "Complete roofing, siding & masonry envelope",
      "Room-by-room quality inspection walk-through",
      "Closeout documentation & client handover",
    ],
  },
];

const COLOR_TEMPERATURES: Array<{
  id: "daylight" | "gallery" | "dusk";
  label: string;
  kelvin: string;
  tint: string;
  beamBoost: string;
}> = [
  {
    id: "daylight",
    label: "Natural Daylight",
    kelvin: "5600K",
    tint: "rgba(219, 234, 254, 0.10)",
    beamBoost: "rgba(255, 255, 255, 0.34)",
  },
  {
    id: "gallery",
    label: "Architectural Warm",
    kelvin: "3500K",
    tint: "rgba(243, 211, 122, 0.16)",
    beamBoost: "rgba(243, 211, 122, 0.42)",
  },
  {
    id: "dusk",
    label: "Executive Dusk",
    kelvin: "2700K",
    tint: "rgba(201, 168, 76, 0.24)",
    beamBoost: "rgba(201, 168, 76, 0.50)",
  },
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<ServiceFilter>("all");
  const [gallery, setGallery] = useState<HomeGallerySelection | null>(null);
  const [activeStudy, setActiveStudy] = useState<number>(0);
  const [lightAngle, setLightAngle] = useState<number>(38);
  const [colorTemp, setColorTemp] = useState<"daylight" | "gallery" | "dusk">(
    "gallery"
  );
  const [expandedLightbox, setExpandedLightbox] = useState<{
    src: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Preload Light Studio + 5-Phase Spotlight in background
  useEffect(() => {
    preloadProtectedImages([
      ...LIGHT_STUDIES.map((s) => s.image),
      ...PROJECT_STEPS.map((s) => s.image),
    ]);
  }, []);

  const filteredCards =
    activeFilter === "all"
      ? TAYCO_SHOWCASE_CARDS
      : TAYCO_SHOWCASE_CARDS.filter((c) => c.category === activeFilter);

  const currentStudy = LIGHT_STUDIES[activeStudy] ?? LIGHT_STUDIES[0];
  const currentTemp =
    COLOR_TEMPERATURES.find((t) => t.id === colorTemp) ?? COLOR_TEMPERATURES[1];
  const lightX = Math.round(14 + (lightAngle / 90) * 72);
  const lightY = Math.round(66 - Math.sin((lightAngle * Math.PI) / 180) * 42);
  const beamX = Math.round(16 + (lightAngle / 90) * 68);
  const shadowContrast = (1.18 - (lightAngle / 90) * 0.22).toFixed(2);
  return (
    <main
      className="tayco-home relative flex flex-col"
      style={
        {
          minHeight: "calc(100svh - 64px)",
          marginTop: "64px",
          background: "#070E1A",
          "--light-angle": `${lightAngle}deg`,
        } as React.CSSProperties
      }
    >
      <h1 className="sr-only">
        {COMPANY.name} · Single-Family Homes, Multifamily, Townhomes &amp; Commercial Construction
      </h1>

      {/* ── 01 / FOUR PRIMARY CONSTRUCTION MARKETS FIRST (SINGLE-FAMILY HOMES, MULTIFAMILY, TOWNHOMES, COMMERCIAL) ── */}
      <LandingPropertyCategoriesSection />

      {/* ── EDITORIAL ITALIC KINETIC MARQUEE TICKER ── */}
      <div
        className="tayco-editorial-ticker"
        aria-label="TAYCO Operational Highlights"
      >
        <div>
          <span className="gold">Precision Commercial Execution</span>
          <i aria-hidden="true" style={{ color: "#C9A84C" }}>
            ◆
          </i>
          <span>Single-Family · Multifamily · Townhomes · Commercial</span>
          <i className="gold-star" aria-hidden="true" style={{ color: "#F3D37A" }}>
            ◆
          </i>
          <span className="gold">Clear scopes. Thoughtful construction.</span>
          <i aria-hidden="true" style={{ color: "#C9A84C" }}>
            ◆
          </i>
          <span>Roofing · Siding · Framing · Drywall · Flooring · Concrete · Stone</span>
          <i className="gold-star" aria-hidden="true" style={{ color: "#F3D37A" }}>
            ◆
          </i>
          <span className="gold">Precision Commercial Execution</span>
          <i aria-hidden="true" style={{ color: "#C9A84C" }}>
            ◆
          </i>
          <span>Single-Family · Multifamily · Townhomes · Commercial</span>
          <i className="gold-star" aria-hidden="true" style={{ color: "#F3D37A" }}>
            ◆
          </i>
          <span className="gold">Clear scopes. Thoughtful construction.</span>
          <i aria-hidden="true" style={{ color: "#C9A84C" }}>
            ◆
          </i>
          <span>Roofing · Siding · Framing · Drywall · Flooring · Concrete · Stone</span>
          <i className="gold-star" aria-hidden="true" style={{ color: "#F3D37A" }}>
            ◆
          </i>
        </div>
      </div>

      {/* Project services and resources + Interactive 8-State Footprint */}
      <section
        id="home-erp-suite-ribbon"
        className="border-b px-4 sm:px-8 py-5 relative z-10"
        style={{
          background:
            "linear-gradient(90deg, #070E1A 0%, #0F2040 50%, #1B3A6B 100%)",
          borderColor: "rgba(201,168,76,0.35)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center text-center gap-4">
            <div className="flex flex-col items-center text-center max-w-3xl">
              <div className="tayco-atelier-eyebrow flex flex-wrap items-center justify-center gap-2 mb-2" style={{ color: "#F3D37A" }}>
                <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                <span>TAYCO LLC · FULL-SERVICE CONSTRUCTION</span>
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(201, 168, 76, 0.16)",
                    color: "#F3D37A",
                  }}
                >
                  {COMPANY.coverage}
                </span>
              </div>
              <p className="text-white font-bold text-sm sm:text-base text-center">
                Commercial construction, home renovations and restoration. Tell us
                what you need and where you need it.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/estimate"
                data-magnetic
                className="tayco-atelier-btn-obsidian text-center"
              >
                Request a free estimate
              </Link>
            </div>
          </div>

          <RegionalStateFootprintStrip />
        </div>
      </section>

      <ContractingOpportunities />

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

      {/* ── 01 / ASTRALIS CAPABILITY COLLECTION WITH 3-PHOTO TRIPTYCHS ── */}
      <section
        id="tayco-operations-showcase"
        className="section-editorial-ivory py-10 sm:py-20 px-4 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 gap-6">
            <TaycoSectionHeader
              eyebrow="01 / Types of work we perform"
              title={<>Blueprints that take <em className="tayco-serif-em text-[#F3D37A]">physical form.</em></>}
              subtitle="From a single room to a commercial property, explore six services and their three-frame field galleries."
            />

            {/* Interactive Filter Pills */}
            <TaycoPillDock ariaLabel="Filter TAYCO services">
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
                    data-active={active}
                    aria-pressed={active}
                    onClick={() => setActiveFilter(pill.id as ServiceFilter)}
                    className="tayco-atelier-pill text-xs font-bold"
                    style={{
                      background: active ? "#0F2040" : "rgba(8,17,32,0.85)",
                      color: active ? "#F3D37A" : "#CBD5E1",
                      borderColor: active
                        ? "#0F2040"
                        : "rgba(201, 168, 76, 0.28)",
                      boxShadow: active
                        ? "0 10px 24px -10px rgba(15, 32, 64, 0.55)"
                        : "none",
                    }}
                  >
                    <span>
                      {pill.label}
                      <sup className="ml-1 text-[10px] opacity-80">
                        ({pill.count})
                      </sup>
                    </span>
                  </button>
                );
              })}
            </TaycoPillDock>
          </div>

          <div className="home-editorial-grid">
            {filteredCards.map((card) => {
              const frames = card.frames.map((frame) => ({
                src: frame.src, title: frame.caption, eyebrow: frame.csi,
              }));
              return (
                <HomeEditorialCard key={card.id}
                  number={card.eyebrow.slice(0, 2)}
                  eyebrow={card.eyebrow.replace(" / ", " · ")}
                  title={`${card.title} ${card.serifEm}`}
                  description={card.summary}
                  image={frames[0]} actionLabel={card.cta} href={card.href}
                  onOpen={() => setGallery({ title: card.subtitle, frames, index: 0 })}
                />
              );
            })}
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

      {/* ── 01B / INTERACTIVE 12-PAIR BEFORE & AFTER + X-RAY TRANSFORMATION STUDIO ── */}
      <TransformationBeforeAfterStudio />

      {/* ── 02 / INTERACTIVE ARCHITECTURAL LIGHT & SURFACE INSPECTOR (6 REAL TEXTURES) ── */}
      <section
        id="tayco-light-studio"
        data-light-table
        data-study={activeStudy}
        className="py-10 sm:py-24 px-4 sm:px-8 relative z-10 border-t"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, rgba(201, 168, 76, 0.14), transparent 55%), radial-gradient(circle at 85% 80%, rgba(27, 58, 107, 0.45), transparent 60%), #070E1A",
          borderColor: "rgba(201, 168, 76, 0.25)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <TaycoSectionHeader
            className="mb-10"
            eyebrow="02 / Materials in a different light"
            title={<>Every slab &amp; finish changes <em className="tayco-serif-em text-[#F3D37A]">under raking light.</em></>}
            subtitle="Explore six surfaces. Adjust the light angle and warmth to see the grain, texture and finish."
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Controls Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">

              {/* 6 Real Material Texture Switcher Buttons */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 my-6"
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
                      className="w-full text-left px-3.5 py-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer"
                      style={{
                        background: selected
                          ? "rgba(27, 58, 107, 0.82)"
                          : "rgba(15, 32, 64, 0.55)",
                        borderColor: selected
                          ? study.color
                          : "rgba(255, 255, 255, 0.12)",
                        boxShadow: selected
                          ? `0 12px 28px -14px ${study.color}66`
                          : "none",
                      }}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <span
                          className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 font-mono text-[10px] font-bold"
                          style={{
                            borderColor: study.color,
                            color: study.color,
                            background: selected ? `${study.color}33` : "rgba(7, 14, 26, 0.8)",
                          }}
                        >
                          0{study.index + 1}
                        </span>
                        <span
                          className="text-xs font-semibold leading-snug truncate"
                          style={{
                            color: selected ? "#ffffff" : "#CBD5E1",
                          }}
                        >
                          {study.buttonTitle.replace(/^\d+ \/ /, "")}
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

              {/* Light Incidence Angle Slider + Quick Angle Presets */}
              <div
                className="p-4 rounded-2xl border space-y-4"
                style={{
                  background: "rgba(15, 32, 64, 0.72)",
                  borderColor: "rgba(201, 168, 76, 0.35)",
                }}
              >
                <div>
                  <label
                    htmlFor="tayco-light-angle-slider"
                    className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-200 mb-2"
                  >
                    <span className="inline-flex items-center gap-2">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F3D37A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <circle cx="12" cy="12" r="5" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" />
                      </svg>
                      Raking Light Angle: {lightAngle}°
                    </span>
                    <output
                      htmlFor="tayco-light-angle-slider"
                      className="font-black text-sm px-2.5 py-0.5 rounded-full"
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
                    className="w-full h-2 rounded-lg cursor-ew-resize accent-[#C9A84C]"
                    style={{ accentColor: "#C9A84C" }}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setLightAngle(12)}
                      className="hover:text-amber-200 cursor-pointer"
                    >
                      12° Grazing
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightAngle(45)}
                      className="hover:text-amber-200 cursor-pointer"
                    >
                      45° Oblique
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightAngle(82)}
                      className="hover:text-amber-200 cursor-pointer"
                    >
                      82° Direct
                    </button>
                  </div>
                </div>

                {/* Color Temperature Switcher (5600K / 3500K / 2700K) */}
                <div className="pt-3 border-t border-white/10">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-slate-300 mb-2">
                    Ambient Color Temperature (Kelvin):
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_TEMPERATURES.map((temp) => {
                      const active = temp.id === colorTemp;
                      return (
                        <button
                          key={temp.id}
                          type="button"
                          onClick={() => setColorTemp(temp.id)}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer text-center"
                          style={{
                            background: active
                              ? "#C9A84C"
                              : "rgba(7, 14, 26, 0.65)",
                            color: active ? "#070E1A" : "#E2E8F0",
                            borderColor: active
                              ? "#F3D37A"
                              : "rgba(201, 168, 76, 0.3)",
                          }}
                        >
                          <div>{temp.kelvin}</div>
                          <div className="text-[9px] opacity-80 truncate">
                            {temp.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Interactive Surface Stage with Real Material Photograph */}
            <div className="lg:col-span-7 flex flex-col">
              <div
                data-response-kind="surface"
                className="tayco-living-card light-experiment h-full flex flex-col justify-between"
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
                <div
                  className="light-surface relative overflow-hidden flex-1 min-h-[380px]"
                >
                  {/* Real High-Relief Surface Photograph */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <ProtectedImage
                    src={currentStudy.image}
                    alt={currentStudy.label}
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-300"
                    style={{
                      filter: `contrast(${shadowContrast}) brightness(${
                        0.82 + (lightAngle / 90) * 0.24
                      })`,
                    }}
                  />

                  {/* Dynamic Directional Raking Light & Kelvin Overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-all duration-150"
                    style={{
                      background: `radial-gradient(circle at ${lightX}% ${lightY}%, ${currentTemp.beamBoost} 0%, ${currentTemp.tint} 38%, rgba(7, 14, 26, 0.72) 88%)`,
                    }}
                  />

                  {/* Moving Specular Grazing Line */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `linear-gradient(${
                        95 + lightAngle * 0.8
                      }deg, transparent ${Math.max(
                        0,
                        beamX - 24
                      )}%, rgba(243, 211, 122, 0.28) ${beamX}%, transparent ${Math.min(
                        100,
                        beamX + 24
                      )}%)`,
                    }}
                  />

                  {/* Optical Calibration Disc Reticle */}
                  <div
                    className="light-disc"
                    style={{
                      opacity: 0.42,
                      borderRadius:
                        activeStudy % 3 === 1
                          ? "16%"
                          : activeStudy % 3 === 2
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

                  <span className="absolute bottom-4 left-4 px-3 py-1.5 rounded-lg bg-[#070E1A]/85 text-xs text-amber-200 border border-white/15">
                    {currentStudy.specMetric} · {currentTemp.kelvin}
                  </span>
                </div>

                <div
                  className="home-surface-copy pt-5 px-2 pb-2 flex flex-col gap-4"
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
                    <ImageReferenceButton src={currentStudy.image} />
                    <details className="home-reading-details mt-4">
                      <summary>Material specifications <span aria-hidden="true">＋</span></summary>
                      <dl className="grid gap-3 text-sm text-slate-300">
                        <div><dt className="home-editorial-eyebrow">Division</dt><dd>{currentStudy.csi}</dd></div>
                        <div><dt className="home-editorial-eyebrow">Finish</dt><dd>{currentStudy.sheenProfile}</dd></div>
                        <div><dt className="home-editorial-eyebrow">Surface relief</dt><dd>{currentStudy.grainDepth}</dd></div>
                      </dl>
                    </details>
                  </div>
                  <Link
                    href="/estimate"
                    data-magnetic
                    className="tayco-atelier-btn-gold shrink-0 text-center"
                  >
                    Discuss your finishes →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 16-Shot Dual-Track Counter-Scrolling Architectural Filmstrip */}
          <div className="mt-16">
            <DualTrackArchitecturalMarquee />
          </div>

          <div id="types-of-work" className="mt-10 pt-12 border-t border-white/10">
            <div className="text-center mb-10">
              <div
                className="tayco-eyebrow justify-center mb-2"
                style={{ color: "#F3D37A" }}
              >
                <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                SERVICE CATALOG · TRADE &amp; MATERIAL EXECUTION
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Types of work we perform{" "}
                <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                  by Trade.
                </em>
              </h2>
            </div>
            <TradeGallery />
          </div>
        </div>
      </section>

      {/* ── 03 / INTERACTIVE 5-PHASE CONSTRUCTION TIMELINE & VERIFIED TRACK RECORD ── */}
      <section
        id="tayco-verified-track-record"
        className="py-10 sm:py-24 px-4 sm:px-8 border-t relative z-10"
        style={{
          background:
            "linear-gradient(180deg, #070E1A 0%, #0F2040 55%, #070E1A 100%)",
          borderColor: "rgba(201, 168, 76, 0.28)",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center text-center mb-10 gap-6">
            <TaycoSectionHeader
              eyebrow="03 / From first conversation to finished space"
              title={<>Good projects begin with <em className="tayco-serif-em text-[#F3D37A]">a shared plan.</em></>}
              subtitle="Follow five phases from site survey and structural framing to finishes and final handover."
            />

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/estimate"
                data-magnetic
                className="tayco-atelier-btn-gold text-center"
              >
                Start a project conversation →
              </Link>
            </div>
          </div>

          <div className="home-editorial-grid">
            {PROJECT_STEPS.map((phase, idx) => (
              <HomeEditorialCard key={phase.code} number={phase.code}
                eyebrow={phase.sqft.replace("Phase ", "")}
                title={phase.name} description={phase.division}
                image={{ src: phase.image, title: phase.name, eyebrow: phase.csiTag }}
                actionLabel="Explore this phase"
                onOpen={() => setGallery({
                  title: "From survey to handover", index: idx,
                  frames: PROJECT_STEPS.map((step) => ({
                    src: step.image, title: step.name, eyebrow: step.sqft,
                    description: step.division, details: step.deliverables,
                  })),
                })}
              />
            ))}
            <HomeEditorialCard number="06" eyebrow="Serving eight states"
              title="Your next project. Within reach."
              description="We serve WI, IL, IA, IN, MN, MI, MO and TX. Tell us your location, scope and priorities."
              image={{ src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg", title: "Executive lounge and terrace", eyebrow: COMPANY.coverage }}
              actionLabel="Request an estimate" href="/estimate"
              onOpen={() => setGallery({ title: "Spaces we help create", index: 0, frames: [{
                src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
                title: "Executive lounge and terrace", eyebrow: COMPANY.coverage,
              }] })}
            />
          </div>
        </div>
      </section>

      {gallery && <HomeEditorialGallery selection={gallery} onClose={() => setGallery(null)} />}

      {/* Full-Screen Architectural Image Lightbox */}
      <TaycoModalOverlay
        isOpen={Boolean(expandedLightbox)}
        onClose={() => setExpandedLightbox(null)}
        ariaLabel={expandedLightbox?.title ?? "Expanded Architectural Photograph"}
      >
        {({ stageGestureHandlers }) => (
          <div
            {...stageGestureHandlers}
            className="max-w-4xl w-full rounded-[26px] border overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)]"
            style={{
              background: "rgba(11, 22, 42, 0.98)",
              borderColor: "#C9A84C",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {expandedLightbox && (
              <>
                <div className="relative h-72 sm:h-[460px] w-full bg-[#040811]">
                  <ProtectedImage
                    src={expandedLightbox.src}
                    auditIgnore={true}
                    alt={expandedLightbox.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
                  <div>
                    {expandedLightbox.subtitle && (
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F3D37A]">
                        {expandedLightbox.subtitle}
                      </div>
                    )}
                    <div className="text-lg font-black text-white mt-0.5">
                      {expandedLightbox.title}
                    </div>
                    <ImageReferenceButton src={expandedLightbox.src} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedLightbox(null)}
                    className="px-5 py-2 rounded-full text-xs font-mono font-black uppercase tracking-wider border cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(135deg, #F6E29C 0%, #D9B14A 52%, #B58928 100%)",
                      borderColor: "#FFF3C4",
                      color: "#050A14",
                    }}
                  >
                    Close Full-Screen View ✕
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </TaycoModalOverlay>
    </main>
  );
}
