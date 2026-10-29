"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TaycoModalOverlay,
  TaycoCardMetaBar,
  TaycoCardFooterBar,
} from "@/components/ui/TaycoDesignSystem";
import { COMPANY } from "@/lib/company";
import ContractingOpportunities from "@/components/ContractingOpportunities";
import TradeGallery from "@/components/TradeGallery";
import ProtectedImage, { preloadProtectedImages, waitForDecodedSurfaces } from "@/components/ProtectedImage";
import {
  COMMERCIAL_HERO_SCENES,
  RESIDENTIAL_HERO_SCENES,
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
        src: "/curated/properties/mkt-twn-framing-row.jpg",
        caption: "Surveyed Foundation Grid & Site Layout",
        csi: "DIV 31 · SITE PREP",
      },
      {
        src: "/curated/properties/mkt-mf-framing-trusses.jpg",
        caption: "Cold-Formed Structural Steel Engineering",
        csi: "DIV 05 · FRAMING",
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
    loginHref: "/login",
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
    loginHref: "/login",
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
    loginHref: "/login",
    accent: "#C9A84C",
    image: "/curated/properties/mkt-twn-drywall-gallery.jpg",
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
    loginHref: "/login",
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
    loginHref: "/login",
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
  const [hovered, setHovered] = useState<"commercial" | "residential" | null>(
    null
  );
  const [comSceneIdx, setComSceneIdx] = useState<number>(0);
  const [resSceneIdx, setResSceneIdx] = useState<number>(0);
  const [heroSyncPulse, setHeroSyncPulse] = useState<number>(0);
  const selectComScene = (idx: number) => {
    const target = COMMERCIAL_HERO_SCENES[idx] ?? COMMERCIAL_HERO_SCENES[0];
    waitForDecodedSurfaces([target.image]).then(() => {
      setComSceneIdx(idx);
      setHeroSyncPulse((p) => p + 1);
    });
  };
  const selectResScene = (idx: number) => {
    const target = RESIDENTIAL_HERO_SCENES[idx] ?? RESIDENTIAL_HERO_SCENES[0];
    waitForDecodedSurfaces([target.image]).then(() => {
      setResSceneIdx(idx);
      setHeroSyncPulse((p) => p + 1);
    });
  };
  const selectCardFrame = (cardId: string, fIdx: number, urls: string[]) => {
    waitForDecodedSurfaces(urls).then(() => {
      setCardFrameMap((prev) => ({ ...prev, [cardId]: fIdx }));
    });
  };
  const [activeFilter, setActiveFilter] = useState<ServiceFilter>("all");
  const [cardFrameMap, setCardFrameMap] = useState<Record<string, number>>({});
  const [activeStudy, setActiveStudy] = useState<number>(0);
  const [lightAngle, setLightAngle] = useState<number>(38);
  const [colorTemp, setColorTemp] = useState<"daylight" | "gallery" | "dusk">(
    "gallery"
  );
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [expandedLightbox, setExpandedLightbox] = useState<{
    src: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Preload Hero scenes + Light Studio + 5-Phase Spotlight in background
  useEffect(() => {
    preloadProtectedImages([
      ...COMMERCIAL_HERO_SCENES.map((s) => s.image),
      ...RESIDENTIAL_HERO_SCENES.map((s) => s.image),
      ...LIGHT_STUDIES.map((s) => s.image),
      ...PROJECT_STEPS.map((s) => s.image),
    ]);
  }, []);

  // Auto-cycle Hero Commercial & Residential scenes when not hovered
  useEffect(() => {
    const id = window.setInterval(() => {
      if (hovered !== "commercial" && hovered !== "residential") {
        const nextComIdx = (comSceneIdx + 1) % COMMERCIAL_HERO_SCENES.length;
        const nextResIdx = (resSceneIdx + 1) % RESIDENTIAL_HERO_SCENES.length;
        waitForDecodedSurfaces([
          COMMERCIAL_HERO_SCENES[nextComIdx]?.image ?? "",
          RESIDENTIAL_HERO_SCENES[nextResIdx]?.image ?? "",
        ]).then(() => {
          setComSceneIdx(nextComIdx);
          setResSceneIdx(nextResIdx);
          setHeroSyncPulse((p) => p + 1);
        });
      } else if (hovered === "residential") {
        selectComScene((comSceneIdx + 1) % COMMERCIAL_HERO_SCENES.length);
      } else if (hovered === "commercial") {
        selectResScene((resSceneIdx + 1) % RESIDENTIAL_HERO_SCENES.length);
      }
    }, 6000);
    return () => window.clearInterval(id);
  }, [hovered, comSceneIdx, resSceneIdx]);

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
  const currentTemp =
    COLOR_TEMPERATURES.find((t) => t.id === colorTemp) ?? COLOR_TEMPERATURES[1];
  const lightX = Math.round(14 + (lightAngle / 90) * 72);
  const lightY = Math.round(66 - Math.sin((lightAngle * Math.PI) / 180) * 42);
  const beamX = Math.round(16 + (lightAngle / 90) * 68);
  const shadowContrast = (1.18 - (lightAngle / 90) * 0.22).toFixed(2);
  const activeStep = PROJECT_STEPS[activeStepIdx] ?? PROJECT_STEPS[0];
  const activeComScene =
    COMMERCIAL_HERO_SCENES[comSceneIdx] ?? COMMERCIAL_HERO_SCENES[0];
  const activeResScene =
    RESIDENTIAL_HERO_SCENES[resSceneIdx] ?? RESIDENTIAL_HERO_SCENES[0];

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
      <h1 className="sr-only">
        {COMPANY.name} · Single-Family Homes, Multifamily, Townhomes &amp; Commercial Construction
      </h1>

      {/* ── 01 / FOUR PRIMARY CONSTRUCTION MARKETS FIRST (SINGLE-FAMILY HOMES, MULTIFAMILY, TOWNHOMES, COMMERCIAL) ── */}
      <LandingPropertyCategoriesSection />

      {/* ── SPLIT HERO 50/50 WITH CURATED 12-SCENE ARCHITECTURAL CYCLER ── */}
      <div
        className="relative flex-1 flex flex-col md:flex-row overflow-hidden"
        style={{ minHeight: "80svh" }}
        onPointerMove={(e) => {
          if (typeof window !== "undefined" && window.innerWidth >= 768) {
            const rect = e.currentTarget.getBoundingClientRect();
            if (rect.width > 0) {
              const ratio = (e.clientX - rect.left) / rect.width;
              if (ratio < 0.46) {
                if (hovered !== "commercial") setHovered("commercial");
              } else if (ratio > 0.54) {
                if (hovered !== "residential") setHovered("residential");
              }
            }
          }
        }}
        onPointerLeave={() => setHovered(null)}
      >
        {/* ── COMMERCIAL (LEFT / TOP) ── */}
        <div
          role="region"
          aria-label="Commercial Construction Division"
          className="relative flex flex-col items-center justify-center overflow-hidden group py-12 pb-20 min-w-0"
          style={{
            flex: commercialFlex,
            background: "#070E1A",
            transition: "flex 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
            minHeight: "50%",
            willChange: "flex",
          }}
          onFocus={() => setHovered("commercial")}
          onBlur={() => setHovered(null)}
        >
          {/* Curated 6-Scene Commercial Backdrop Cycler */}
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <ProtectedImage
              src={activeComScene.image}
              syncUrls={[activeComScene.image, activeResScene.image]}
              alt=""
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover tayco-hero-kenburns opacity-55"
            />
            {/* Calibrated Navy & Gold Architectural Vignette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(155deg, rgba(7, 14, 26, 0.88) 0%, rgba(15, 32, 64, 0.68) 48%, rgba(7, 14, 26, 0.92) 100%)",
              }}
            />
          </div>

          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          {/* Blueprint grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(201,168,76,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.07) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Gold accent line */}
          <div
            className="absolute left-0 top-0 bottom-0 hidden md:block w-1.5 rounded-full z-10"
            style={{ background: "#C9A84C" }}
          />
          <div
            className="absolute left-0 right-0 top-0 md:hidden h-1.5 rounded-full z-10"
            style={{ background: "#C9A84C" }}
          />

          <div className="relative z-10 text-center px-6 sm:px-10 w-full max-w-xl shrink-0">
            <div
              className="tayco-eyebrow mb-3 mx-auto justify-center"
              style={{ color: "#F3D37A" }}
            >
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F3D37A"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="inline-block shrink-0"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Primary Service · Commercial Construction
            </div>

            <div
              className="w-13 h-13 rounded-2xl border flex items-center justify-center mx-auto mb-4 shadow-inner backdrop-blur-md"
              style={{
                background: "rgba(7, 14, 26, 0.72)",
                borderColor: "rgba(201, 168, 76, 0.55)",
              }}
              aria-hidden="true"
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F3D37A"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
                <path d="M15 21V9h4a1 1 0 0 1 1 1v11" />
                <path d="M8 7h4" />
                <path d="M8 11h4" />
                <path d="M8 15h4" />
              </svg>
            </div>

            <Link href="/commercial" className="inline-block">
              <h2
                className="tayco-display-title font-black tracking-tight text-white mb-1.5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]"
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                  lineHeight: 1.04,
                }}
              >
                COMMERCIAL
              </h2>
            </Link>

            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
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

            <p className="text-slate-100 text-xs sm:text-sm leading-relaxed mb-5 max-w-[380px] mx-auto drop-shadow">
              Ground-Up Construction · Design-Build Services · General
              Contracting · Tenant Improvements · Multi-Family &amp; Industrial
            </p>

            {/* Interactive 6-Scene Commercial Discipline Selector Chips */}
            <div
              className="flex flex-wrap items-center justify-center gap-1.5 mb-5"
              role="group"
              aria-label="Preview commercial construction disciplines"
            >
              {COMMERCIAL_HERO_SCENES.map((scene, idx) => {
                const active = idx === comSceneIdx;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => selectComScene(idx)}
                    onPointerEnter={() => selectComScene(idx)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer border backdrop-blur-md"
                    style={{
                      background: active
                        ? "rgba(201, 168, 76, 0.92)"
                        : "rgba(7, 14, 26, 0.72)",
                      color: active ? "#070E1A" : "#E2E8F0",
                      borderColor: active
                        ? "#F3D37A"
                        : "rgba(201, 168, 76, 0.35)",
                    }}
                  >
                    {scene.chip}
                  </button>
                );
              })}
            </div>

            {/* Live Active Scene Telemetry HUD */}
            <div
              key={`com-hud-${comSceneIdx}-${heroSyncPulse}`}
              className="mb-5 px-3.5 py-2 rounded-xl border backdrop-blur-md text-left mx-auto max-w-md flex items-center justify-between gap-3 tayco-harmonic-sync"
              style={{
                background: "rgba(7, 14, 26, 0.78)",
                borderColor: "rgba(201, 168, 76, 0.42)",
              }}
            >
              <div className="min-w-0">
                <div
                  className="text-[9px] font-mono font-bold uppercase tracking-widest truncate"
                  style={{ color: "#F3D37A" }}
                >
                  {activeComScene.csiCode}
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {activeComScene.title}
                </div>
              </div>
              <span
                className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full shrink-0"
                style={{ background: "rgba(201,168,76,0.22)", color: "#F3D37A" }}
              >
                0{comSceneIdx + 1}/06
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/commercial"
                data-magnetic
                className="tayco-atelier-btn-gold text-center"
              >
                View Commercial Services <span>→</span>
              </Link>
              <Link
                href="/properties/commercial"
                data-magnetic
                className="tayco-atelier-btn-obsidian text-center"
              >
                Commercial Properties (6) <span>↗</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="hidden md:block w-px shrink-0 z-20"
          style={{ background: "rgba(201,168,76,0.45)" }}
        />
        <div
          className="md:hidden h-px shrink-0 z-20"
          style={{ background: "rgba(201,168,76,0.45)" }}
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
          <div
            className="orbital-caption rounded-full backdrop-blur-md border shadow-2xl p-1"
            style={{
              background: "rgba(7, 14, 26, 0.88)",
              borderColor: "rgba(201, 168, 76, 0.5)",
            }}
          >
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
            <span aria-hidden="true" style={{ color: "#F3D37A" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src="/logo.png"
                auditIgnore={true}
                alt="TAYCO LLC"
                className="w-11 h-11 object-contain drop-shadow-[0_0_10px_rgba(201,168,76,0.45)]"
              />
            </span>
          </div>
        </div>

        {/* ── RESIDENTIAL (RIGHT / BOTTOM) ── */}
        <div
          role="region"
          aria-label="Residential Renovation & Restoration Division"
          className="relative flex flex-col items-center justify-center overflow-hidden group py-12 pb-20 min-w-0"
          style={{
            flex: residentialFlex,
            background: "#0B172A",
            transition: "flex 0.45s cubic-bezier(0.2, 0.8, 0.2, 1)",
            minHeight: "50%",
            willChange: "flex",
          }}
          onFocus={() => setHovered("residential")}
          onBlur={() => setHovered(null)}
        >
          {/* Curated 6-Scene Residential Backdrop Cycler */}
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <ProtectedImage
              src={activeResScene.image}
              syncUrls={[activeComScene.image, activeResScene.image]}
              alt=""
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover tayco-hero-kenburns opacity-55"
            />
            {/* Calibrated Deep Navy & Warm Champagne Vignette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(155deg, rgba(11, 23, 42, 0.88) 0%, rgba(19, 39, 71, 0.66) 50%, rgba(7, 14, 26, 0.92) 100%)",
              }}
            />
          </div>

          <div className="preview-orbits" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>

          {/* Architectural grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(243,211,122,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(243,211,122,0.05) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Right Champagne Gold Accent Line */}
          <div
            className="absolute right-0 top-0 bottom-0 hidden md:block w-1.5 rounded-full z-10"
            style={{ background: "#E2C675" }}
          />

          <div className="relative z-10 text-center px-6 sm:px-10 w-full max-w-xl shrink-0">
            <div
              className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em] mb-3 backdrop-blur-md"
              style={{
                background: "rgba(201, 168, 76, 0.18)",
                color: "#F3D37A",
                border: "1px solid rgba(201, 168, 76, 0.48)",
              }}
            >
              <span className="tayco-live-dot" style={{ color: "#E2C675" }} />
              Residential Division · Fire &amp; Water Restoration
            </div>

            <div
              className="w-13 h-13 rounded-2xl border flex items-center justify-center mx-auto mb-4 shadow-inner backdrop-blur-md"
              style={{
                background: "rgba(7, 14, 26, 0.72)",
                borderColor: "rgba(226, 198, 117, 0.55)",
              }}
              aria-hidden="true"
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F3D37A"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h14V9.5" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </div>

            <Link href="/residential" className="inline-block">
              <h2
                className="tayco-display-title font-black tracking-tight text-white mb-1.5 drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)]"
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.8rem)",
                  lineHeight: 1.04,
                }}
              >
                RESIDENTIAL
              </h2>
            </Link>

            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3"
              style={{ color: "#C9A84C" }}
            >
              Renovation &amp;{" "}
              <em
                className="tayco-serif-em text-sm"
                style={{ color: "#F3D37A" }}
              >
                Rapid Recovery
              </em>
            </p>

            <p className="text-slate-100 text-xs sm:text-sm leading-relaxed mb-5 max-w-[380px] mx-auto drop-shadow">
              Full-scale home renovations · Kitchen &amp; bath remodels · Custom
              carpentry &amp; decks · Certified fire &amp; water damage restoration
            </p>

            {/* Interactive 6-Scene Residential Discipline Selector Chips */}
            <div
              className="flex flex-wrap items-center justify-center gap-1.5 mb-5"
              role="group"
              aria-label="Preview residential construction disciplines"
            >
              {RESIDENTIAL_HERO_SCENES.map((scene, idx) => {
                const active = idx === resSceneIdx;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => selectResScene(idx)}
                    onPointerEnter={() => selectResScene(idx)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer border backdrop-blur-md"
                    style={{
                      background: active
                        ? "rgba(243, 211, 122, 0.92)"
                        : "rgba(7, 14, 26, 0.72)",
                      color: active ? "#070E1A" : "#E2E8F0",
                      borderColor: active
                        ? "#F3D37A"
                        : "rgba(243, 211, 122, 0.35)",
                    }}
                  >
                    {scene.chip}
                  </button>
                );
              })}
            </div>

            {/* Live Active Scene Telemetry HUD */}
            <div
              key={`res-hud-${resSceneIdx}-${heroSyncPulse}`}
              className="mb-5 px-3.5 py-2 rounded-xl border backdrop-blur-md text-left mx-auto max-w-md flex items-center justify-between gap-3 tayco-harmonic-sync"
              style={{
                background: "rgba(7, 14, 26, 0.78)",
                borderColor: "rgba(243, 211, 122, 0.42)",
              }}
            >
              <div className="min-w-0">
                <div
                  className="text-[9px] font-mono font-bold uppercase tracking-widest truncate"
                  style={{ color: "#F3D37A" }}
                >
                  {activeResScene.csiCode}
                </div>
                <div className="text-xs font-bold text-white truncate">
                  {activeResScene.title}
                </div>
              </div>
              <span
                className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full shrink-0"
                style={{ background: "rgba(243,211,122,0.22)", color: "#F3D37A" }}
              >
                0{resSceneIdx + 1}/06
              </span>
            </div>

            <div className="flex flex-col items-center gap-2.5">
              <Link
                href="/residential"
                data-magnetic
                className="tayco-atelier-btn-gold text-center"
              >
                View Residential Services <span>→</span>
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/properties/single-family"
                  data-magnetic
                  className="tayco-atelier-btn-obsidian text-[11px] py-1.5 px-3"
                >
                  Single-Family Homes ↗
                </Link>
                <Link
                  href="/properties/duplexes"
                  data-magnetic
                  className="tayco-atelier-btn-obsidian text-[11px] py-1.5 px-3"
                >
                  Multifamily ↗
                </Link>
                <Link
                  href="/properties/townhouses"
                  data-magnetic
                  className="tayco-atelier-btn-obsidian text-[11px] py-1.5 px-3"
                >
                  Townhomes ↗
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Project services and resources */}
        <div
          className="hidden xl:flex items-center gap-3 px-5 py-2.5 rounded-full border backdrop-blur-md shadow-2xl absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
          style={{
            background: "rgba(15, 32, 64, 0.92)",
            borderColor: "rgba(201, 168, 76, 0.5)",
          }}
        >
          <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
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
            style={{ color: "#C9A84C" }}
          >
            Team &amp; supplier sign in
          </Link>
          <span className="text-slate-500">·</span>
          <Link
            href="/estimate"
            className="text-[11px] font-mono font-bold text-white hover:text-[#F3D37A] transition-colors underline"
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
                href="/login"
                data-magnetic
                className="tayco-atelier-btn-gold text-center"
              >
                Project portal sign in →
              </Link>
              <Link
                href="/estimate"
                data-magnetic
                className="tayco-atelier-btn-obsidian text-center"
              >
                Request a free estimate
              </Link>
              <Link
                href="/login"
                data-magnetic
                className="tayco-atelier-btn-obsidian text-center"
              >
                Trade partner sign in
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

      {/* ── 01 / WARM EDITORIAL IVORY CAPABILITY COLLECTION WITH 3-PHOTO TRIPTYCHS ── */}
      <section
        id="tayco-operations-showcase"
        className="section-editorial-ivory py-10 sm:py-20 px-4 sm:px-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Editorial Top Row */}
          <div
            className="flex flex-wrap items-center justify-center gap-4 pb-5 mb-8 border-b text-center"
            style={{ borderColor: "rgba(27, 58, 107, 0.16)" }}
          >
            <span
              className="tayco-atelier-eyebrow font-bold justify-center"
              style={{ color: "#1B3A6B" }}
            >
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              01 / TYPES OF WORK WE PERFORM
            </span>
            <span className="hidden sm:inline text-slate-400">·</span>
            <span
              className="text-[11px] font-mono uppercase tracking-widest text-center"
              style={{ color: "#1B3A6B" }}
            >
              18 CURATED FIELD PHOTOGRAPHS · 3 INTERACTIVE FRAMES PER SERVICE
            </span>
          </div>

          {/* Editorial Heading + Filter Pills */}
          <div className="flex flex-col items-center justify-center text-center mb-12 gap-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2
                className="tayco-display-title text-center mx-auto"
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
                className="text-sm sm:text-base mt-3 max-w-2xl mx-auto text-center leading-relaxed"
                style={{ color: "#334155" }}
              >
                From a single room to a commercial property, find the right team
                for the work. Hover or click the three photo frames inside each
                card to inspect representative field execution.
              </p>
            </div>

            {/* Interactive Filter Pills */}
            <div
              className="flex flex-wrap items-center justify-center gap-2.5"
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
                    data-active={active}
                    aria-pressed={active}
                    onClick={() => setActiveFilter(pill.id as ServiceFilter)}
                    className="tayco-atelier-pill text-xs font-bold"
                    style={{
                      background: active ? "#0F2040" : "rgba(255,255,255,0.85)",
                      color: active ? "#F3D37A" : "#0F2040",
                      borderColor: active
                        ? "#0F2040"
                        : "rgba(27, 58, 107, 0.28)",
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
            </div>
          </div>

          {/* 6 Interactive Ivory Triptych Cards */}
          <div className="flex flex-wrap justify-center gap-6 max-sm:flex-nowrap max-sm:justify-start max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory max-sm:-mx-4 max-sm:px-4 max-sm:pb-3 tayco-no-scrollbar">
            {filteredCards.map((card) => {
              const activeFrameIdx = cardFrameMap[card.id] ?? 0;
              const currentFrame = card.frames[activeFrameIdx] ?? card.frames[0];

              return (
                <div
                  key={card.id}
                  data-response-kind="surface"
                  className="tayco-living-card editorial-ivory-card w-full max-sm:w-[82vw] max-sm:shrink-0 max-sm:snap-center md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] p-5 flex flex-col justify-between items-center text-center group"
                >
                  <div className="preview-orbits" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>

                  <div className="relative z-10 w-full flex flex-col items-center text-center">
                    <div className="flex items-center justify-center gap-2 mb-3 w-full">
                      <div
                        className="tayco-atelier-eyebrow font-bold justify-center"
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

                    {/* Interactive 3-Photo Triptych Stage */}
                    <div className="mb-4 w-full">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setExpandedLightbox({
                            src: currentFrame.src,
                            title: currentFrame.caption,
                            subtitle: `${(card as any).code ?? card.id} · ${currentFrame.csi}`,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setExpandedLightbox({
                              src: currentFrame.src,
                              title: currentFrame.caption,
                              subtitle: `${(card as any).code ?? card.id} · ${currentFrame.csi}`,
                            });
                          }
                        }}
                        className="relative h-44 w-full rounded-xl overflow-hidden border shadow-md cursor-pointer"
                        style={{
                          borderColor: "rgba(15, 32, 64, 0.22)",
                          background: "#070E1A",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <ProtectedImage
                          src={currentFrame.src}
                          syncUrls={card.frames.map((f) => f.src)}
                          alt={currentFrame.caption}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(7,14,26,0.35) 0%, transparent 45%, rgba(7,14,26,0.88) 100%)",
                          }}
                        />
                        <span
                          className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider"
                          style={{
                            background: "rgba(7, 14, 26, 0.85)",
                            color: "#F3D37A",
                            border: "1px solid rgba(201, 168, 76, 0.45)",
                          }}
                        >
                          {currentFrame.csi}
                        </span>
                        <span
                          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold"
                          style={{
                            background: "#C9A84C",
                            color: "#070E1A",
                          }}
                        >
                          0{activeFrameIdx + 1}/03 · Expand ↗
                        </span>
                        <div className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-bold text-white text-center line-clamp-1 drop-shadow">
                          {currentFrame.caption}
                        </div>
                      </div>

                      {/* Sleek centered 01 · 02 · 03 capsule switcher */}
                      <div className="flex items-center justify-center gap-2 mt-2.5">
                        {card.frames.map((frame, fIdx) => {
                          const isSelected = fIdx === activeFrameIdx;
                          return (
                            <button
                              key={frame.src}
                              type="button"
                              data-magnetic
                              onClick={() =>
                                selectCardFrame(
                                  card.id,
                                  fIdx,
                                  card.frames.map((f) => f.src)
                                )
                              }
                              onPointerEnter={() =>
                                selectCardFrame(
                                  card.id,
                                  fIdx,
                                  card.frames.map((f) => f.src)
                                )
                              }
                              className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer border"
                              style={{
                                background: isSelected
                                  ? "#0F2040"
                                  : "rgba(15, 32, 64, 0.08)",
                                color: isSelected ? "#F3D37A" : "#1B3A6B",
                                borderColor: isSelected
                                  ? "#C9A84C"
                                  : "rgba(27, 58, 107, 0.2)",
                                boxShadow: isSelected
                                  ? "0 4px 12px -2px rgba(15, 32, 64, 0.35)"
                                  : "none",
                              }}
                              aria-label={`Preview frame 0${fIdx + 1}: ${frame.caption}`}
                            >
                              0{fIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <h3
                      className="tayco-card-title text-xl font-black leading-snug text-center mx-auto"
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
                      className="text-[11px] font-mono font-bold uppercase tracking-wider mt-1 text-center"
                      style={{ color: "#B8922F" }}
                    >
                      {card.subtitle}
                    </div>
                    <p
                      className="text-xs mt-2 leading-relaxed font-medium text-center max-w-sm mx-auto"
                      style={{ color: "#334155" }}
                    >
                      {card.summary}
                    </p>
                  </div>

                  <div
                    className="relative z-10 mt-5 pt-4 border-t w-full flex flex-col items-center text-center"
                    style={{ borderColor: "rgba(27, 58, 107, 0.14)" }}
                  >
                    <div className="flex flex-col items-center justify-center gap-1 mb-3.5 w-full text-center">
                      <div
                        className="text-lg font-black font-mono text-center"
                        style={{ color: card.stroke }}
                      >
                        {card.metric}
                      </div>
                      <div
                        className="text-[10px] font-mono uppercase tracking-wider font-semibold text-center"
                        style={{ color: "#475569" }}
                      >
                        {card.metricLabel}
                      </div>
                      <svg
                        width="116"
                        height="34"
                        viewBox="0 0 116 34"
                        fill="none"
                        aria-hidden="true"
                        className="mx-auto mt-1"
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
                      className="tayco-atelier-btn-obsidian w-full text-center justify-center text-xs"
                    >
                      <span>{card.cta}</span>
                      <span style={{ color: "#C9A84C" }}>→</span>
                    </Link>
                  </div>
                </div>
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
          <div className="flex flex-wrap items-center justify-center gap-4 pb-5 mb-10 border-b border-white/10 text-center">
            <span className="tayco-atelier-eyebrow justify-center" style={{ color: "#F3D37A" }}>
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              02 / MATERIALS IN A DIFFERENT LIGHT
            </span>
            <span className="hidden sm:inline text-slate-500">·</span>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400">
              6 REAL ARCHITECTURAL SURFACES · RAKING ANGLE (0°–90°) + KELVIN STUDIO
            </span>
          </div>

          <div className="text-center max-w-3xl mx-auto mb-10">
            <h2
              className="tayco-display-title font-black text-white tracking-tight text-center mx-auto"
              style={{
                fontSize: "clamp(2rem, 4vw, 3.2rem)",
                lineHeight: 1.05,
              }}
            >
              Every slab &amp; finish changes{" "}
              <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                under raking light.
              </em>
            </h2>
            <p className="text-sm text-slate-300 mt-3 leading-relaxed text-center mx-auto max-w-2xl">
              Select one of the{" "}
              <span className="font-mono font-bold" style={{ color: "#F3D37A" }}>
                6 architectural surface textures
              </span>
              , sweep the raking light from{" "}
              <span className="font-mono font-semibold" style={{ color: "#F3D37A" }}>
                0°
              </span>{" "}
              to{" "}
              <span className="font-mono font-semibold" style={{ color: "#F3D37A" }}>
                90°
              </span>{" "}
              and switch Kelvin color temperature to see how grain, relief and specular sheen respond.
            </p>
          </div>

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
                      12° Grazing Relief
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightAngle(45)}
                      className="hover:text-amber-200 cursor-pointer"
                    >
                      45° Oblique Studio
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightAngle(82)}
                      className="hover:text-amber-200 cursor-pointer"
                    >
                      82° Direct Specular
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

                  <span className="absolute top-4 left-5 font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#070E1A]/80 text-amber-200 border border-amber-400/30">
                    {currentStudy.csi}
                  </span>
                  <span
                    className="absolute top-4 right-5 font-mono text-[11px] font-bold px-2.5 py-1 rounded-full border"
                    style={{
                      background: "rgba(7, 14, 26, 0.85)",
                      borderColor: currentStudy.color,
                      color: currentStudy.color,
                    }}
                  >
                    {currentStudy.specMetric} · {lightAngle}° · {currentTemp.kelvin}
                  </span>

                  {/* Bottom Surface Telemetry Readout Bar */}
                  <div className="absolute bottom-3 left-4 right-4 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#070E1A]/85 border border-white/15 backdrop-blur-md">
                    <span className="font-mono text-[10px] tracking-widest text-slate-200 uppercase">
                      {currentStudy.code}
                    </span>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-amber-200">
                      <span>SHEEN: {currentStudy.sheenProfile}</span>
                      <span>·</span>
                      <span>RELIEF: {currentStudy.grainDepth}</span>
                    </div>
                  </div>
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
          <div className="flex flex-wrap items-center justify-center gap-4 pb-5 mb-10 border-b border-white/10 text-center">
            <span className="tayco-atelier-eyebrow justify-center" style={{ color: "#F3D37A" }}>
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              03 / FROM FIRST CONVERSATION TO FINISHED SPACE
            </span>
            <span className="hidden sm:inline text-slate-500">·</span>
            <span
              className="text-[11px] font-mono uppercase tracking-widest text-center"
              style={{ color: "#F3D37A" }}
            >
              5-PHASE FIELD PROGRESSION · SITE PREP TO FINAL HANDOVER
            </span>
          </div>

          <div className="flex flex-col items-center justify-center text-center mb-10 gap-6">
            <div className="text-center max-w-3xl mx-auto">
              <h2
                className="tayco-display-title font-black text-white tracking-tight text-center mx-auto"
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
              <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl mx-auto text-center leading-relaxed">
                Explore how a TAYCO project progresses from initial site survey
                and structural framing to rough-in, custom millwork and final
                turnkey handover.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/estimate"
                data-magnetic
                className="tayco-atelier-btn-gold text-center"
              >
                Start a project conversation →
              </Link>
              <Link
                href="/login"
                data-magnetic
                className="tayco-atelier-btn-obsidian text-center"
              >
                Existing client sign in →
              </Link>
            </div>
          </div>

          {/* Interactive 5-Phase Construction Progression Spotlight */}
          <div
            className="mb-10 p-5 sm:p-6 rounded-2xl border shadow-2xl"
            style={{
              background:
                "linear-gradient(145deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.96) 100%)",
              borderColor: "rgba(201, 168, 76, 0.42)",
            }}
          >
            {/* Phase Stepper Bar + Progress Line */}
            <div className="mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
                {PROJECT_STEPS.map((step, idx) => {
                  const selected = idx === activeStepIdx;
                  return (
                    <button
                      key={step.code}
                      type="button"
                      data-magnetic
                      onClick={() => setActiveStepIdx(idx)}
                      className="p-2.5 rounded-xl border text-center flex flex-col items-center justify-center transition-all cursor-pointer"
                      style={{
                        background: selected
                          ? "rgba(201, 168, 76, 0.22)"
                          : "rgba(7, 14, 26, 0.65)",
                        borderColor: selected
                          ? "#F3D37A"
                          : "rgba(201, 168, 76, 0.25)",
                      }}
                    >
                      <div className="flex items-center justify-center gap-1.5 w-full">
                        <span
                          className="font-mono text-xs font-black"
                          style={{ color: selected ? "#F3D37A" : "#C9A84C" }}
                        >
                          PHASE {step.code}
                        </span>
                        {selected && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#F3D37A" }}
                          />
                        )}
                      </div>
                      <div className="text-xs font-bold text-white truncate mt-0.5 text-center">
                        {step.name}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${((activeStepIdx + 1) / PROJECT_STEPS.length) * 100}%`,
                    background:
                      "linear-gradient(90deg, #C9A84C 0%, #F3D37A 100%)",
                  }}
                />
              </div>
            </div>

            {/* Active Phase Image + Deliverables */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              <div
                role="button"
                tabIndex={0}
                onClick={() =>
                  setExpandedLightbox({
                    src: activeStep.image,
                    title: `${activeStep.code} · ${activeStep.name}`,
                    subtitle: activeStep.division,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setExpandedLightbox({
                      src: activeStep.image,
                      title: `${activeStep.code} · ${activeStep.name}`,
                      subtitle: activeStep.division,
                    });
                  }
                }}
                className="lg:col-span-7 relative rounded-xl overflow-hidden border h-64 sm:h-80 cursor-pointer group"
                style={{ borderColor: "rgba(201, 168, 76, 0.45)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <ProtectedImage
                  src={activeStep.image}
                  auditIgnore={true}
                  alt={activeStep.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(7,14,26,0.35) 0%, transparent 45%, rgba(7,14,26,0.9) 100%)",
                  }}
                />
                <span
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono font-black"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  PHASE {activeStep.code} / 05 · {activeStep.csiTag}
                </span>
                <div className="absolute bottom-3 left-3.5 right-3.5">
                  <div className="text-lg sm:text-xl font-black text-white">
                    {activeStep.code} · {activeStep.name}
                  </div>
                  <div className="text-xs font-mono text-amber-200">
                    {activeStep.division}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div
                  className="text-xs font-mono font-bold uppercase tracking-widest"
                  style={{ color: "#F3D37A" }}
                >
                  {activeStep.sqft} · {activeStep.location}
                </div>
                <h3 className="text-2xl font-black text-white">
                  {activeStep.headline}
                </h3>
                <ul className="space-y-2.5">
                  {activeStep.deliverables.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-200"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: "#C9A84C" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="pt-2 flex flex-wrap gap-2">
                  <Link
                    href={activeStep.requestHref}
                    className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                    style={{ background: "#C9A84C", color: "#070E1A" }}
                  >
                    Start Phase {activeStep.code} Conversation →
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStepIdx(
                        (activeStepIdx + 1) % PROJECT_STEPS.length
                      )
                    }
                    className="px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-amber-200 border border-amber-400/40 hover:bg-white/5 cursor-pointer"
                  >
                    Next Phase 0{((activeStepIdx + 1) % PROJECT_STEPS.length) + 1} →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 max-sm:flex-nowrap max-sm:justify-start max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-mandatory max-sm:-mx-4 max-sm:px-4 max-sm:pb-3 tayco-no-scrollbar">
            {PROJECT_STEPS.map((contract, idx) => (
              <div
                key={contract.code}
                data-response-kind="surface"
                onClick={() => setActiveStepIdx(idx)}
                className="tayco-living-card w-full max-sm:w-[82vw] max-sm:shrink-0 max-sm:snap-center md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] p-5 rounded-[24px] flex flex-col justify-between group cursor-pointer"
                style={{
                  background:
                    "linear-gradient(155deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.96) 100%)",
                  borderColor:
                    idx === activeStepIdx
                      ? "#F3D37A"
                      : "rgba(201, 168, 76, 0.3)",
                }}
              >
                <div className="preview-orbits" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>

                <div className="relative z-10 w-full flex flex-col text-left">
                  {/* Phase Card Architectural Photo Header */}
                  <div
                    className="relative h-36 w-full rounded-xl overflow-hidden mb-4 border"
                    style={{ borderColor: "rgba(201, 168, 76, 0.32)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <ProtectedImage
                      src={contract.image}
                      alt={contract.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(7,14,26,0.35) 0%, transparent 50%, rgba(7,14,26,0.88) 100%)",
                      }}
                    />
                    <span
                      className="absolute top-2.5 left-2.5 font-mono text-xs font-black px-2.5 py-0.5 rounded-full border"
                      style={{
                        background: "rgba(7, 14, 26, 0.85)",
                        borderColor: contract.accent,
                        color: "#F3D37A",
                      }}
                    >
                      {contract.code}
                    </span>
                    <Link
                      href={contract.requestHref}
                      aria-label={`Discuss ${contract.name.toLowerCase()}`}
                      className="project-open absolute top-2.5 right-2.5"
                    >
                      ↗
                    </Link>
                    <span className="absolute bottom-2 left-2.5 right-2.5 text-[10px] font-mono text-amber-200 font-bold text-center">
                      {contract.csiTag}
                    </span>
                  </div>

                  <TaycoCardMetaBar
                    leftBadge={
                      <span className="text-xs font-mono font-bold text-[#F3D37A]">
                        {contract.location} · {contract.sqft}
                      </span>
                    }
                    rightMeta={<span>{contract.phase}</span>}
                    className="mb-2.5"
                  />

                  <h3 className="tayco-card-title text-lg font-black text-white leading-snug text-left">
                    {contract.code} · {contract.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed text-left">
                    {contract.division} — {contract.phase}
                  </p>
                </div>

                <div className="relative z-10 mt-5 pt-4 border-t border-white/10 w-full">
                  <TaycoCardFooterBar
                    leftMeta={
                      <div className="flex flex-col text-left">
                        <span
                          className="text-base font-black font-mono text-left"
                          style={{ color: "#F3D37A" }}
                        >
                          {contract.headline}
                        </span>
                        <span
                          className="text-[10px] font-mono uppercase tracking-wider text-left"
                          style={{ color: "#DFC06C" }}
                        >
                          {contract.status}
                        </span>
                      </div>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <Link
                        href={contract.requestHref}
                        data-magnetic
                        className="tayco-atelier-btn-gold text-[10px] py-1.5 px-3 text-center justify-center"
                      >
                        Request estimate →
                      </Link>
                      <Link
                        href={contract.loginHref}
                        data-magnetic
                        className="tayco-atelier-btn-obsidian text-[10px] py-1.5 px-3 text-center justify-center"
                      >
                        Sign in →
                      </Link>
                    </div>
                  </TaycoCardFooterBar>
                </div>
              </div>
            ))}

            {/* 6th Summary Card: Multi-State Dispatch & Instant Estimate */}
            <div
              data-response-kind="surface"
              className="tayco-living-card w-full max-sm:w-[82vw] max-sm:shrink-0 max-sm:snap-center md:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] p-5 rounded-[24px] flex flex-col justify-between group"
              style={{
                background:
                  "linear-gradient(145deg, rgba(27, 58, 107, 0.92) 0%, rgba(15, 32, 64, 0.98) 100%)",
                borderColor: "rgba(201, 168, 76, 0.48)",
              }}
            >
              <div className="preview-orbits" aria-hidden="true">
                <i />
                <i />
                <i />
              </div>

              <div className="relative z-10 w-full flex flex-col text-left">
                <div
                  className="relative h-36 w-full rounded-xl overflow-hidden mb-4 border"
                  style={{ borderColor: "rgba(201, 168, 76, 0.4)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <ProtectedImage
                    src="/curated/properties/interior-commercial-executive-lounge-terrace.jpg"
                    alt="TAYCO 8-State Operations"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(7,14,26,0.3) 0%, transparent 45%, rgba(7,14,26,0.88) 100%)",
                    }}
                  />
                  <span
                    className="absolute bottom-2 left-2.5 right-2.5 text-[10px] font-mono font-bold text-center"
                    style={{ color: "#F3D37A" }}
                  >
                    WI · IL · IA · IN · MN · MI · MO · TX
                  </span>
                </div>

                <TaycoCardMetaBar
                  leftBadge={
                    <div className="tayco-atelier-eyebrow" style={{ color: "#F3D37A" }}>
                      <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                      SERVING EIGHT STATES
                    </div>
                  }
                  rightMeta={<span>8 States Active</span>}
                  className="mb-2.5"
                />
                <h3 className="tayco-card-title text-xl font-black text-white leading-snug text-left">
                  Your next project{" "}
                  <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
                    Across 8 States
                  </em>
                </h3>
                <p className="text-xs text-slate-200 mt-2 leading-relaxed text-left">
                  We serve WI, IL, IA, IN, MN, MI, MO and TX. Contact us to
                  confirm your location, project scope and scheduling.
                </p>
              </div>

              <div className="relative z-10 mt-5 pt-4 border-t border-white/15 w-full">
                <TaycoCardFooterBar
                  leftMeta={
                    <span className="text-[10px] font-mono text-slate-300">
                      Turnkey Delivery
                    </span>
                  }
                >
                  <div className="flex items-center gap-2">
                    <Link
                      href="/commercial"
                      data-magnetic
                      className="tayco-atelier-btn-gold text-xs py-1.5 px-3 text-center justify-center"
                    >
                      <span>Commercial →</span>
                    </Link>
                    <Link
                      href="/residential"
                      data-magnetic
                      className="tayco-atelier-btn-obsidian text-xs py-1.5 px-3 text-center justify-center"
                    >
                      <span>Residential →</span>
                    </Link>
                  </div>
                </TaycoCardFooterBar>
              </div>
            </div>
          </div>
        </div>
      </section>

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
