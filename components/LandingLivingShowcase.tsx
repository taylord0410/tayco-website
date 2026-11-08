"use client";
import { ImageReferenceButton } from "@/components/EstimateReferences";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TaycoModalOverlay, TaycoSectionHeader, TaycoPillDock } from "@/components/ui/TaycoDesignSystem";
import ProtectedImage, {
  preloadProtectedImages,
  waitForDecodedSurfaces,
  useSynchronizedScene,
} from "@/components/ProtectedImage";

export interface HeroSceneItem {
  id: string;
  chip: string;
  title: string;
  csiCode: string;
  specTag: string;
  image: string;
  accent: string;
}

export const COMMERCIAL_HERO_SCENES: HeroSceneItem[] = [
  {
    id: "com-hq",
    chip: "Corporate HQ & Facades",
    title: "3-Story Limestone & Glass Corporate Envelope",
    csiCode: "CSI DIV 04 / 08 · CURTAIN WALL & MASONRY",
    specTag: "Commercial Ground-Up & Envelope",
    image: "/curated/hero/com-hq-sunset.jpg",
    accent: "#C9A84C",
  },
  {
    id: "com-steel",
    chip: "Retail & Mixed-Use",
    title: "Structural Brick, Steel & Illuminated Soffit Fit-Out",
    csiCode: "CSI DIV 05 / 07 · STRUCTURAL STEEL & CLADDING",
    specTag: "Mixed-Use Commercial Delivery",
    image: "/curated/hero/com-dusk-steel.jpg",
    accent: "#F3D37A",
  },
  {
    id: "com-lobby",
    chip: "Executive Lobbies",
    title: "Double-Height Limestone & Walnut Corporate Atrium",
    csiCode: "CSI DIV 06 / 09 · ARCHITECTURAL MILLWORK",
    specTag: "Class-A Tenant Improvement",
    image: "/curated/hero/com-lobby-limestone.jpg",
    accent: "#C9A84C",
  },
  {
    id: "com-reception",
    chip: "Office Build-Outs",
    title: "Acoustic Walnut Slat Reception & Herringbone Oak",
    csiCode: "CSI DIV 09 · ACOUSTIC & FLOORING SYSTEMS",
    specTag: "Turnkey Corporate Interior",
    image: "/curated/hero/com-reception-walnut.jpg",
    accent: "#E2C675",
  },
  {
    id: "com-framing",
    chip: "Cold-Formed Steel Framing",
    title: "Multi-Level Architectural Steel Stud & Atrium Framing",
    csiCode: "CSI DIV 05 40 00 · COLD-FORMED METAL FRAMING",
    specTag: "Core & Shell Structural Execution",
    image: "/curated/hero/com-framing-atrium.jpg",
    accent: "#C9A84C",
  },
  {
    id: "com-plaza",
    chip: "Commercial Centers",
    title: "Stone & Charcoal Architectural Metal Retail Plaza",
    csiCode: "CSI DIV 04 / 07 · EXTERIOR ENVELOPE SYSTEMS",
    specTag: "Multi-Tenant Commercial Build",
    image: "/curated/hero/com-plaza-stone.jpg",
    accent: "#F3D37A",
  },
];

export const RESIDENTIAL_HERO_SCENES: HeroSceneItem[] = [
  {
    id: "res-kitchen",
    chip: "Custom Kitchens",
    title: "Navy Shaker Chef's Kitchen, Marble Island & Oak",
    csiCode: "RES DIV 06 / 09 · CUSTOM CABINETRY & STONE",
    specTag: "Full-Gut Kitchen Modernization",
    image: "/curated/hero/res-navy-kitchen.jpg",
    accent: "#F3D37A",
  },
  {
    id: "res-farmhouse",
    chip: "Standing-Seam Roofing",
    title: "Board-and-Batten Residence with Matte Metal Roof",
    csiCode: "RES DIV 07 · STANDING-SEAM METAL & SIDING",
    specTag: "Complete Exterior Envelope",
    image: "/curated/hero/res-farmhouse-metal.jpg",
    accent: "#E2C675",
  },
  {
    id: "res-cedar",
    chip: "Siding & Timber Decks",
    title: "Natural Cedar & Charcoal Custom Home with Wrap Deck",
    csiCode: "RES DIV 06 / 07 · CEDAR CLADDING & DECKING",
    specTag: "Architectural Exterior Remodel",
    image: "/curated/hero/res-cedar-deck-home.jpg",
    accent: "#C9A84C",
  },
  {
    id: "res-hearth",
    chip: "Built-Ins & Millwork",
    title: "Coffered Living Room Ceiling, Stone Hearth & Cabinetry",
    csiCode: "RES DIV 06 20 00 · FINISH CARPENTRY",
    specTag: "Interior Turnkey Transformation",
    image: "/curated/hero/res-coffered-hearth.jpg",
    accent: "#F3D37A",
  },
  {
    id: "res-deck",
    chip: "Outdoor Living Structures",
    title: "Multi-Tier Golden Cedar Deck & Exterior Staircase",
    csiCode: "RES DIV 06 · STRUCTURAL TIMBER DECKS",
    specTag: "Custom Outdoor Construction",
    image: "/curated/hero/res-multitier-deck.jpg",
    accent: "#E2C675",
  },
  {
    id: "res-estate",
    chip: "Roofing & Storm Recovery",
    title: "Architectural Shingle Roof & Masonry Chimney Restoration",
    csiCode: "RES DIV 07 31 00 · ARCHITECTURAL SHINGLES",
    specTag: "Certified Storm & Property Recovery",
    image: "/curated/hero/res-estate-roofing.jpg",
    accent: "#C9A84C",
  },
];

export type TransformationDivision = "all" | "div01" | "div02" | "div03" | "div04";

export type SiteDivisionSlug =
  | "single-family"
  | "multifamily"
  | "townhomes"
  | "commercial";

export function resolveSiteDivisionFromPathname(
  pathname?: string | null
): SiteDivisionSlug | "all" {
  if (!pathname) return "all";
  if (pathname.startsWith("/single-family")) return "single-family";
  if (pathname.startsWith("/multifamily")) return "multifamily";
  if (pathname.startsWith("/townhomes")) return "townhomes";
  if (pathname.startsWith("/commercial")) return "commercial";
  return "all";
}

export interface TransformationPair {
  id: string;
  division: Exclude<TransformationDivision, "all">;
  divisionLabel: string;
  siteDivision: SiteDivisionSlug;
  code: string;
  title: string;
  subtitle: string;
  csiSpec: string;
  beforeImg: string;
  afterImg: string;
  beforeTag: string;
  afterTag: string;
  summary: string;
  highlights: string[];
}

export const TRANSFORMATION_PAIRS: TransformationPair[] = [
  {
    id: "div01_01",
    division: "div01",
    divisionLabel: "Structural & Millwork",
    siteDivision: "single-family",
    code: "TR-01",
    title: "Two-Story Wood Framing & Roof Trusses",
    subtitle: "Foundation slab to complete structural shell",
    csiSpec: "Framing",
    beforeImg: "/curated/pairs/div01_01_antes.jpg",
    afterImg: "/curated/pairs/div01_01_despues.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Structural framing from foundation sill plates to wall sheathing and roof trusses.",
    highlights: ["Engineered roof trusses", "Structural wall sheathing", "Timber wood framing"],
  },
  {
    id: "div04_03",
    division: "div04",
    divisionLabel: "Roofing",
    siteDivision: "commercial",
    code: "TR-02",
    title: "Flat Roof Heat-Welded TPO System",
    subtitle: "Aged membrane to high-reflectivity white TPO",
    csiSpec: "Roofing",
    beforeImg: "/curated/pairs/div04_03_antes.jpg",
    afterImg: "/curated/pairs/div04_03_despues.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Low-slope roof recovery with tapered insulation, parapet terminations, and heat-welded TPO seams.",
    highlights: ["Tapered drainage slope", "Heat-welded TPO membrane", "Parapet & curb flashing"],
  },
  {
    id: "div03_02",
    division: "div03",
    divisionLabel: "Interiors & Fit-Outs",
    siteDivision: "single-family",
    code: "TR-03",
    title: "Kitchen Remodel & Quartz Island",
    subtitle: "Custom white shaker cabinetry and quartz surfaces",
    csiSpec: "Remodeling",
    beforeImg: "/curated/pairs/div03_02_antes.jpg",
    afterImg: "/curated/pairs/tr03-after-white-shaker-kitchen.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Interior layout transformation with custom shaker cabinetry, quartz countertops, and hardwood flooring.",
    highlights: ["Custom shaker cabinetry", "Veined quartz island", "Hardwood flooring & lighting"],
  },
  {
    id: "div02_02",
    division: "div02",
    divisionLabel: "Exterior & Masonry",
    siteDivision: "single-family",
    code: "TR-04",
    title: "Board-and-Batten Siding & Exterior Trim",
    subtitle: "Vertical cladding and matte-black window trim",
    csiSpec: "Siding",
    beforeImg: "/curated/pairs/div02_02_antes.jpg",
    afterImg: "/curated/pairs/div02_02_despues.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Exterior envelope upgrade with weather barrier, vertical board-and-batten siding, and custom window casings.",
    highlights: ["Weather-resistive barrier", "Board-and-batten siding", "Custom window & fascia trim"],
  },
  {
    id: "div04_02",
    division: "div04",
    divisionLabel: "Roofing",
    siteDivision: "single-family",
    code: "TR-05",
    title: "Standing-Seam Metal Roof",
    subtitle: "Matte-black architectural metal roof system",
    csiSpec: "Roofing",
    beforeImg: "/curated/pairs/div04_02_antes.jpg",
    afterImg: "/curated/pairs/div04_02_despues.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Architectural standing-seam metal roof with concealed clips, synthetic underlayment, and custom ridge flashing.",
    highlights: ["Concealed-fastener seams", "Synthetic ice & water shield", "Custom ridge & valley flashing"],
  },
  {
    id: "div01_03",
    division: "div01",
    divisionLabel: "Structural & Millwork",
    siteDivision: "single-family",
    code: "TR-06",
    title: "Built-In Millwork, Coffered Ceiling & Stone Hearth",
    subtitle: "Custom cabinetry, ceiling beams, and stone fireplace",
    csiSpec: "Carpentry",
    beforeImg: "/curated/pairs/div01_03_antes.jpg",
    afterImg: "/curated/pairs/tr06-after-built-in-fireplace.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Finish carpentry combining built-in bookcases, stacked-stone hearth with timber mantel, and coffered ceiling grid.",
    highlights: ["Floor-to-ceiling bookcases", "Stacked-stone fireplace", "Coffered ceiling beams"],
  },
  {
    id: "div03_01",
    division: "div03",
    divisionLabel: "Interiors & Fit-Outs",
    siteDivision: "commercial",
    code: "TR-07",
    title: "Steel-Stud Framing to Smooth Drywall",
    subtitle: "Metal stud partitions to taped and primed drywall",
    csiSpec: "Drywall",
    beforeImg: "/curated/pairs/div03_01_antes.jpg",
    afterImg: "/curated/pairs/div03_01_despues.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Interior progression from cold-formed steel stud layout to acoustic insulation and smooth gypsum board finish.",
    highlights: ["Fire-rated gypsum assemblies", "Laser-aligned rough openings", "Smooth joint finish"],
  },
  {
    id: "div02_03",
    division: "div02",
    divisionLabel: "Exterior & Masonry",
    siteDivision: "single-family",
    code: "TR-08",
    title: "Stacked-Stone Veneer & Column Pedestals",
    subtitle: "Natural ledger-stone facade and cast-stone sills",
    csiSpec: "Masonry",
    beforeImg: "/curated/pairs/div02_03_antes.jpg",
    afterImg: "/curated/pairs/div02_03_despues.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Masonry upgrade with dry-stacked stone veneer wainscoting, cast-stone sills, and tapered column bases.",
    highlights: ["Cast-stone water table", "Dry-stack stone veneer", "Craftsman column bases"],
  },
  {
    id: "div01_02",
    division: "div01",
    divisionLabel: "Structural & Millwork",
    siteDivision: "single-family",
    code: "TR-09",
    title: "Timber Deck & Staircase Reconstruction",
    subtitle: "Concrete pier footings and cedar deck structure",
    csiSpec: "Carpentry",
    beforeImg: "/curated/pairs/div01_02_antes.jpg",
    afterImg: "/curated/pairs/tr09-after-cedar-deck.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Deck reconstruction with concrete pier footings, structural framing, flashed ledger board, and cedar decking.",
    highlights: ["Flashed structural ledger", "Stair stringers & guardrails", "Cedar deck boards"],
  },
  {
    id: "div04_04",
    division: "div04",
    divisionLabel: "Roofing",
    siteDivision: "commercial",
    code: "TR-10",
    title: "Storefront Charcoal Standing-Seam Roof",
    subtitle: "Kynar-coated standing-seam metal roof and box gutters",
    csiSpec: "Roofing",
    beforeImg: "/curated/pairs/div04_04_antes.jpg",
    afterImg: "/curated/pairs/div04_04_despues.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Facade and hip-roof replacement with charcoal standing-seam metal panels and seamless box gutters.",
    highlights: ["Charcoal architectural metal", "Seamless box gutters", "Precision trim & coping"],
  },
  {
    id: "div02_04",
    division: "div02",
    divisionLabel: "Exterior & Masonry",
    siteDivision: "single-family",
    code: "TR-11",
    title: "Cedar Privacy Fence & Concrete Footings",
    subtitle: "Laser-leveled cedar panels and continuous top rail",
    csiSpec: "Carpentry",
    beforeImg: "/curated/pairs/div02_04_antes.jpg",
    afterImg: "/curated/pairs/div02_04_despues.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Perimeter boundary upgrade with set-in-concrete posts, western red cedar privacy boards, and top cap trim.",
    highlights: ["Concrete post footings", "Western red cedar boards", "Continuous top cap rail"],
  },
  {
    id: "div03_04",
    division: "div03",
    divisionLabel: "Interiors & Fit-Outs",
    siteDivision: "single-family",
    code: "TR-12",
    title: "Lower-Level Living Suite & LVP Flooring",
    subtitle: "Insulated walls, recessed lighting, and wide-plank flooring",
    csiSpec: "Remodeling",
    beforeImg: "/curated/pairs/div03_04_antes.jpg",
    afterImg: "/curated/pairs/tr12-after-finished-basement.jpg",
    beforeTag: "Before",
    afterTag: "After",
    summary: "Lower-level finish with insulated perimeter framing, smooth drywall ceiling, recessed LEDs, and LVP flooring.",
    highlights: ["Insulated perimeter framing", "Recessed LED ceiling grid", "Wide-plank LVP flooring"],
  },
];

/**
 * Filters the Before & After transformation pairs by site division (`single-family`,
 * `multifamily`, `townhomes`, `commercial`). On the home page (`all`), all 12 pairs are returned.
 * When a division (`multifamily` or `townhomes`) does not yet have dedicated pairs in
 * `TRANSFORMATION_PAIRS`, it returns `[]` so the Before/After studio hides cleanly on those pages
 * until division-specific pairs are added.
 */
export function getTransformationPairsForSiteDivision(
  siteDivision: SiteDivisionSlug | "all" = "all"
): TransformationPair[] {
  if (!siteDivision || siteDivision === "all") {
    return TRANSFORMATION_PAIRS;
  }
  return TRANSFORMATION_PAIRS.filter((p) => p.siteDivision === siteDivision);
}

export interface MarqueeShot {
  id: string;
  title: string;
  trade: string;
  csi: string;
  sector: string;
  image: string;
}

export const MARQUEE_TRACK_TOP: MarqueeShot[] = [
  {
    id: "m-top-1",
    title: "Mass Excavation & Foundation Trenching",
    trade: "Foundations",
    csi: "DIV 31",
    sector: "Commercial",
    image: "/curated/magazine/revista_ex_ex_mass.jpg",
  },
  {
    id: "m-top-2",
    title: "Two-Story Cold-Formed Steel Framing",
    trade: "Framing",
    csi: "DIV 05",
    sector: "Commercial",
    image: "/curated/magazine/revista_fr_metal_04.jpg",
  },
  {
    id: "m-top-3",
    title: "Rooftop Timber Framing & Decking",
    trade: "Framing",
    csi: "DIV 06",
    sector: "Townhomes",
    image: "/curated/properties/mkt-twn-framing-rooftop.jpg",
  },
  {
    id: "m-top-4",
    title: "Standing-Seam Metal Roof System",
    trade: "Roofing",
    csi: "DIV 07",
    sector: "Commercial & Res",
    image: "/curated/magazine/revista_ro_metal_a.jpg",
  },
  {
    id: "m-top-5",
    title: "Natural Slate Gable & Copper Flashing",
    trade: "Roofing",
    csi: "DIV 07",
    sector: "Residential",
    image: "/curated/residential/sf-slate-roof-cottage.jpg",
  },
  {
    id: "m-top-6",
    title: "Rainscreen Siding & Trim Envelope",
    trade: "Siding",
    csi: "DIV 07",
    sector: "Commercial",
    image: "/curated/magazine/revista_si_05_a.jpg",
  },
  {
    id: "m-top-7",
    title: "Natural Ashlar Stone Masonry Facade",
    trade: "Masonry",
    csi: "DIV 04",
    sector: "Commercial",
    image: "/curated/magazine/revista_st_nat_a.jpg",
  },
  {
    id: "m-top-8",
    title: "Double-Height Curtain-Wall Glazing",
    trade: "Windows & Doors",
    csi: "DIV 08",
    sector: "Commercial",
    image: "/curated/magazine/revista_wi_com.jpg",
  },
];

export const MARQUEE_TRACK_BOTTOM: MarqueeShot[] = [
  {
    id: "m-bot-1",
    title: "Custom Millwork & Suspended Ceiling",
    trade: "Carpentry",
    csi: "DIV 09",
    sector: "Commercial",
    image: "/curated/commercial/cx_x1.jpg",
  },
  {
    id: "m-bot-2",
    title: "Exterior Wall Framing & Ceiling Joists",
    trade: "Framing",
    csi: "DIV 06",
    sector: "Residential",
    image: "/curated/magazine/revista_fr_wood_05.jpg",
  },
  {
    id: "m-bot-3",
    title: "Curved Soffit & Gypsum Board Assembly",
    trade: "Drywall",
    csi: "DIV 09",
    sector: "Commercial",
    image: "/work/drywall_commercial.jpg",
  },
  {
    id: "m-bot-4",
    title: "Painted Staircase & Oak Handrail",
    trade: "Carpentry",
    csi: "DIV 06",
    sector: "Commercial & Res",
    image: "/curated/magazine/revista_ca_finish_1.jpg",
  },
  {
    id: "m-bot-5",
    title: "Walnut Acoustic Ceiling & Wall Fit-Out",
    trade: "Carpentry",
    csi: "DIV 06",
    sector: "Commercial",
    image: "/work/carpentry_commercial.jpg",
  },
  {
    id: "m-bot-6",
    title: "Coffered Ceiling & Recessed Lighting",
    trade: "Carpentry",
    csi: "DIV 09",
    sector: "Residential",
    image: "/curated/magazine/revista_in_05_a.jpg",
  },
  {
    id: "m-bot-7",
    title: "Exposed Timber & Steel Loft Coatings",
    trade: "Painting",
    csi: "DIV 09",
    sector: "Commercial",
    image: "/curated/magazine/revista_pa_04_a.jpg",
  },
  {
    id: "m-bot-8",
    title: "Diamond-Honed Terrazzo & Concrete Slab",
    trade: "Flooring",
    csi: "DIV 03",
    sector: "Commercial",
    image: "/curated/properties/mkt-mf-flooring-concrete.jpg",
  },
];

export const REGIONAL_STATE_HUBS: Array<{
  state: string;
  name: string;
  corridor: string;
  primaryFocus: string;
  mobilization: string;
  sampleImage: string;
}> = [
  {
    state: "WI",
    name: "Wisconsin",
    corridor: "Milwaukee · Madison · Green Bay",
    primaryFocus: "Architectural Fit-Outs, Roofing, Siding & Full-Scale Renovations",
    mobilization: "Primary HQ Dispatch",
    sampleImage: "/curated/properties/mkt-com-roofing-greenroof.jpg",
  },
  {
    state: "IL",
    name: "Illinois",
    corridor: "Chicagoland · Rockford · Naperville",
    primaryFocus: "Architectural Tenant Improvements, Multi-Suite CapEx & Restoration",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/properties/townhouse-04-chicago-endunit-brick.jpg",
  },
  {
    state: "IA",
    name: "Iowa",
    corridor: "Des Moines · Cedar Rapids · Davenport",
    primaryFocus: "Storm Recovery, Standing-Seam Roofing & Turnkey Remodeling",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/properties/mkt-twn-framing-partywall.jpg",
  },
  {
    state: "IN",
    name: "Indiana",
    corridor: "Indianapolis · Fort Wayne · NW Corridor",
    primaryFocus: "Industrial Envelopes, TPO Flat Roofing & Interior Build-Outs",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/properties/mkt-com-concrete-tiltup.jpg",
  },
  {
    state: "MN",
    name: "Minnesota",
    corridor: "Twin Cities Metro · Rochester · Duluth",
    primaryFocus: "Cold-Climate Building Envelopes, Siding & Fire/Water Recovery",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/properties/duplex-05-minneapolis-buffbrick-dormer.jpg",
  },
  {
    state: "MI",
    name: "Michigan",
    corridor: "Grand Rapids · Detroit Metro · Lansing",
    primaryFocus: "Multi-Suite Renovations, Carpentry & Masonry Restoration",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/properties/mkt-mf-roofing.jpg",
  },
  {
    state: "MO",
    name: "Missouri",
    corridor: "St. Louis · Kansas City · Columbia",
    primaryFocus: "Architectural Plazas, REO Asset Preservation & Structural Framing",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/properties/mkt-com-stone-masonry.jpg",
  },
  {
    state: "TX",
    name: "Texas",
    corridor: "Dallas–Fort Worth · Houston · Austin",
    primaryFocus: "Ground-Up Architectural, Multi-Suite Turnovers & Large-Loss Recovery",
    mobilization: "South Central Hub",
    sampleImage: "/curated/properties/duplex-06-austin-limestone-infill.jpg",
  },
];

/* ─────────────────────────────────────────────────────────────
 * 1. INTERACTIVE BEFORE / AFTER & STRUCTURAL X-RAY STUDIO
 * ───────────────────────────────────────────────────────────── */
export function TransformationBeforeAfterStudio({
  initialDivision = "all",
  initialPairId = TRANSFORMATION_PAIRS[0].id,
  eyebrowLabel = "Before & After",
  siteDivision,
}: {
  initialDivision?: TransformationDivision;
  initialPairId?: string;
  eyebrowLabel?: string;
  siteDivision?: SiteDivisionSlug | "all";
} = {}) {
  const pathname = usePathname();
  const effectiveSiteDivision =
    siteDivision ?? resolveSiteDivisionFromPathname(pathname);
  const scopedPairs = getTransformationPairsForSiteDivision(
    effectiveSiteDivision
  );
  const resolvedInitialPairId = scopedPairs.some((p) => p.id === initialPairId)
    ? initialPairId
    : scopedPairs[0]?.id ?? TRANSFORMATION_PAIRS[0].id;
  const resolvedInitialDivision =
    initialDivision === "all" ||
    scopedPairs.some((p) => p.division === initialDivision)
      ? initialDivision
      : "all";

  const [activeDivision, setActiveDivision] = useState<TransformationDivision>(
    resolvedInitialDivision
  );
  const [selectedId, setSelectedId] = useState<string>(resolvedInitialPairId);
  const [pendingPairId, setPendingPairId] = useState<string>(
    resolvedInitialPairId
  );
  const [pairSyncPulse, setPairSyncPulse] = useState<number>(0);

  const selectPairHarmonized = (nextId: string) => {
    setPendingPairId(nextId);
    const target = scopedPairs.find((p) => p.id === nextId);
    if (!target) {
      setSelectedId(nextId);
      return;
    }
    waitForDecodedSurfaces([target.afterImg, target.beforeImg]).then(() => {
      setSelectedId((prev) => {
        if (prev !== nextId) setPairSyncPulse((p) => p + 1);
        return nextId;
      });
    });
  };
  const [inspectMode, setInspectMode] = useState<"split" | "xray">("split");
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [xrayPos, setXrayPos] = useState<{ x: number; y: number }>({ x: 52, y: 48 });
  const stageRef = useRef<HTMLDivElement | null>(null);

  const visiblePairs =
    activeDivision === "all"
      ? scopedPairs
      : scopedPairs.filter((p) => p.division === activeDivision);

  if (scopedPairs.length === 0) {
    return null;
  }

  const activePair =
    visiblePairs.find((p) => p.id === selectedId) ??
    visiblePairs[0] ??
    scopedPairs[0] ??
    TRANSFORMATION_PAIRS[0];

  const divisionTabDefs = [
    { id: "all" as const, label: "All", count: scopedPairs.length },
    {
      id: "div01" as const,
      label: "Structural & Millwork",
      count: scopedPairs.filter((p) => p.division === "div01").length,
    },
    {
      id: "div02" as const,
      label: "Exterior & Masonry",
      count: scopedPairs.filter((p) => p.division === "div02").length,
    },
    {
      id: "div03" as const,
      label: "Interiors & Fit-Outs",
      count: scopedPairs.filter((p) => p.division === "div03").length,
    },
    {
      id: "div04" as const,
      label: "Roofing",
      count: scopedPairs.filter((p) => p.division === "div04").length,
    },
  ].filter((tab) => tab.id === "all" || tab.count > 0);

  const handleStagePointer = (clientX: number, clientY: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const pctX = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    const pctY = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100));
    if (inspectMode === "split") {
      setSplitPercent(Math.round(pctX));
    } else {
      setXrayPos({ x: Math.round(pctX), y: Math.round(pctY) });
    }
  };

  return (
    <section
      id="tayco-transformation-studio"
      className="py-10 sm:py-20 px-4 sm:px-8 relative z-10 border-t"
      style={{
        background:
          "radial-gradient(circle at 82% 16%, rgba(201, 168, 76, 0.14), transparent 50%), radial-gradient(circle at 14% 85%, rgba(27, 58, 107, 0.48), transparent 58%), #070E1A",
        borderColor: "rgba(201, 168, 76, 0.28)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <TaycoSectionHeader
          eyebrow={eyebrowLabel.replace(/^01B\s*\/\s*/i, "")}
          title={<>Before &amp; <em className="tayco-serif-em text-[#F3D37A]">After</em></>}
          className="mb-6"
        />
        <div className="flex flex-col items-center gap-6 mb-8">
          {/* Division Tabs */}
          <TaycoPillDock ariaLabel="Filter transformations">
            {divisionTabDefs.map((tab) => {
              const active = activeDivision === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-magnetic
                  data-active={active ? "true" : "false"}
                  aria-pressed={active}
                  onClick={() => {
                    const nextDiv = tab.id as TransformationDivision;
                    setActiveDivision(nextDiv);
                    const nextList =
                      nextDiv === "all"
                        ? scopedPairs
                        : scopedPairs.filter((p) => p.division === nextDiv);
                    if (nextList.length > 0 && !nextList.some((p) => p.id === selectedId)) {
                      selectPairHarmonized(nextList[0].id);
                    }
                  }}
                  className="tayco-atelier-pill cursor-pointer"
                >
                  {tab.label}
                </button>
              );
            })}
          </TaycoPillDock>
        </div>

        {/* Main Interactive Stage + Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 8 Columns: Interactive Curtain / X-Ray Stage */}
          <div className="lg:col-span-8 flex flex-col">
            <div
              ref={stageRef}
              onPointerDown={(e) => {
                setIsDragging(true);
                handleStagePointer(e.clientX, e.clientY);
              }}
              onPointerMove={(e) => {
                if (inspectMode === "xray" || isDragging) {
                  handleStagePointer(e.clientX, e.clientY);
                }
              }}
              onPointerUp={() => setIsDragging(false)}
              onPointerLeave={() => setIsDragging(false)}
              className="relative w-full overflow-hidden rounded-2xl border select-none shadow-2xl group"
              style={{
                aspectRatio: "16 / 10",
                minHeight: "340px",
                borderColor: "rgba(201, 168, 76, 0.45)",
                background: "#050B14",
                cursor: inspectMode === "split" ? "ew-resize" : "crosshair",
                touchAction: "pan-y",
              }}
            >
              {/* Base Layer: AFTER */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={activePair.afterImg}
                alt={`${activePair.title} — After`}
                syncUrls={[activePair.afterImg, activePair.beforeImg]}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
              />

              {/* Overlay Layer: BEFORE */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={activePair.beforeImg}
                alt={`${activePair.title} — Before`}
                syncUrls={[activePair.afterImg, activePair.beforeImg]}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
                style={{
                  clipPath:
                    inspectMode === "split"
                      ? `inset(0 ${100 - splitPercent}% 0 0)`
                      : `circle(135px at ${xrayPos.x}% ${xrayPos.y}%)`,
                  transition: isDragging ? "none" : "clip-path 80ms ease-out",
                }}
              />

              {/* Mode A: 50/50 Split Curtain Divider Line & Handle */}
              {inspectMode === "split" && (
                <div
                  className="absolute top-0 bottom-0 z-20 pointer-events-none"
                  style={{
                    left: `${splitPercent}%`,
                    transform: "translateX(-50%)",
                    transition: isDragging ? "none" : "left 80ms ease-out",
                  }}
                >
                  <div
                    className="w-0.5 h-full"
                    style={{
                      background:
                        "linear-gradient(180deg, #F3D37A 0%, #C9A84C 50%, #F3D37A 100%)",
                      boxShadow: "0 0 18px rgba(201, 168, 76, 0.9)",
                    }}
                  />
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-2xl"
                    style={{
                      background: "rgba(7, 14, 26, 0.92)",
                      borderColor: "#F3D37A",
                      color: "#F3D37A",
                      boxShadow: "0 0 24px rgba(201, 168, 76, 0.65)",
                    }}
                  >
                    <span className="font-mono text-xs font-black tracking-tighter">
                      ↔
                    </span>
                  </div>
                </div>
              )}

              {/* Mode B: X-Ray Circular Reticle Ring */}
              {inspectMode === "xray" && (
                <div
                  className="absolute z-20 pointer-events-none rounded-full border-2 flex items-start justify-center"
                  style={{
                    width: "270px",
                    height: "270px",
                    left: `${xrayPos.x}%`,
                    top: `${xrayPos.y}%`,
                    transform: "translate(-50%, -50%)",
                    borderColor: "#F3D37A",
                    boxShadow:
                      "0 0 30px rgba(201, 168, 76, 0.55), inset 0 0 24px rgba(201, 168, 76, 0.35)",
                  }}
                >
                  <span
                    className=" -mt-3 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest"
                    style={{ background: "#C9A84C", color: "#070E1A" }}
                  >
                    X-RAY
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Control Strip Under Stage */}
            <div
              className="mt-2.5 p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3"
              style={{
                background: "rgba(15, 32, 64, 0.78)",
                borderColor: "rgba(201, 168, 76, 0.32)",
              }}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectMode("split")}
                  className="home-compact-control px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer"
                  style={{
                    background: inspectMode === "split" ? "#C9A84C" : "rgba(7, 14, 26, 0.65)",
                    color: inspectMode === "split" ? "#070E1A" : "#E2E8F0",
                    borderColor: inspectMode === "split" ? "#F3D37A" : "rgba(201, 168, 76, 0.35)",
                  }}
                >
                  ↔ Compare
                </button>
                <button
                  type="button"
                  onClick={() => setInspectMode("xray")}
                  className="home-compact-control px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer"
                  style={{
                    background: inspectMode === "xray" ? "#C9A84C" : "rgba(7, 14, 26, 0.65)",
                    color: inspectMode === "xray" ? "#070E1A" : "#E2E8F0",
                    borderColor: inspectMode === "xray" ? "#F3D37A" : "rgba(201, 168, 76, 0.35)",
                  }}
                >
                  ◎ X-ray
                </button>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {[
                  { label: "Before", val: 96 },
                  { label: "50 / 50", val: 50 },
                  { label: "After", val: 4 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setInspectMode("split");
                      setSplitPercent(preset.val);
                    }}
                    className="home-compact-control px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition-colors cursor-pointer hover:text-white"
                    style={{
                      background:
                        inspectMode === "split" && Math.abs(splitPercent - preset.val) <= 5
                          ? "rgba(201, 168, 76, 0.25)"
                          : "rgba(7, 14, 26, 0.5)",
                      borderColor: "rgba(201, 168, 76, 0.35)",
                      color: "#F3D37A",
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4 Columns: Active Transformation Card */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div
              className="tayco-living-card p-6 rounded-2xl border h-full flex flex-col justify-between items-center text-center relative overflow-hidden"
              data-response-kind="surface"
              data-magnetic
              style={{
                background:
                  "linear-gradient(155deg, rgba(15, 32, 64, 0.9) 0%, rgba(7, 14, 26, 0.96) 100%)",
                borderColor: "rgba(201, 168, 76, 0.38)",
              }}
            >
              <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
              <div className="w-full flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span
                    className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border"
                    style={{
                      background: "rgba(201, 168, 76, 0.15)",
                      borderColor: "rgba(201, 168, 76, 0.45)",
                      color: "#F3D37A",
                    }}
                  >
                    {activePair.divisionLabel}
                  </span>
                </div>

                <h3 className="tayco-card-title text-xl sm:text-2xl text-white leading-snug text-center">
                  {activePair.title}
                </h3>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5 w-full">
                <ImageReferenceButton src={activePair.afterImg} label="Save Reference" />
                <Link
                  href="/estimate"
                  data-magnetic
                  className="tayco-atelier-btn-gold w-full text-center py-3 text-xs tracking-wider"
                >
                  <span>Request Estimate →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Thumbnail Filmstrip Selector */}
        <div className="mt-6">
          <div className="flex flex-wrap justify-center gap-3 tayco-no-scrollbar">
            {visiblePairs.map((pair) => {
              const selected = pair.id === pendingPairId || pair.id === activePair.id;
              const widthClass =
                visiblePairs.length === 1
                  ? "w-full max-w-xs sm:max-w-sm"
                  : visiblePairs.length === 2
                    ? "w-[calc(50%-0.375rem)] sm:w-64"
                    : "w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.6rem)] lg:w-[calc(16.666%-0.65rem)]";
              return (
                <button
                  key={pair.id}
                  type="button"
                  data-magnetic
                  onClick={() => selectPairHarmonized(pair.id)}
                  className={`group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer flex flex-col ${widthClass}`}
                  style={{
                    background: "#0B172A",
                    borderColor: selected ? "#F3D37A" : "rgba(201, 168, 76, 0.25)",
                    boxShadow: selected
                      ? "0 0 0 2px #C9A84C, 0 12px 24px -10px rgba(201, 168, 76, 0.55)"
                      : "none",
                    transform: selected ? "translateY(-2px)" : "none",
                  }}
                >
                  <div className="relative h-20 w-full overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <ProtectedImage
                      src={pair.afterImg}
                      auditIgnore={true}
                      alt={pair.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <ProtectedImage
                      src={pair.beforeImg}
                      auditIgnore={true}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ clipPath: "inset(0 50% 0 0)" }}
                    />
                    <div
                      className="absolute top-0 bottom-0 left-1/2 w-0.5"
                      style={{ background: "#F3D37A" }}
                    />
                  </div>
                  <div className="p-2.5 flex-1 flex items-center">
                    <div className="text-[11px] font-bold text-white leading-snug">
                      {pair.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 2. DUAL-TRACK ARCHITECTURAL FILMSTRIP MARQUEE (16 SHOTS)
 * ───────────────────────────────────────────────────────────── */
export const DIVISION_MARQUEE_SHOTS_BY_CATEGORY: Readonly<
  Record<SiteDivisionSlug, readonly MarqueeShot[]>
> = {
  "single-family": [
    {
      id: "m-sf-1",
      title: "Insulated Fiber-Cement Lap Siding & Craftsman Trim",
      trade: "Siding",
      csi: "DIV 07",
      sector: "Residential",
      image: "/work/siding_residential.jpg",
    },
    {
      id: "m-sf-2",
      title: "Dimensional Shingle & Gable Roof",
      trade: "Roofing",
      csi: "DIV 07",
      sector: "Residential",
      image: "/work/roofing_residential.jpg",
    },
    {
      id: "m-sf-3",
      title: "Two-Story Wood Stud Framing & Roof Trusses",
      trade: "Framing",
      csi: "DIV 06",
      sector: "Residential",
      image: "/work/framing_residential.jpg",
    },
    {
      id: "m-sf-4",
      title: "Smooth Level-5 Drywall & Interior Wall Board",
      trade: "Drywall",
      csi: "DIV 09",
      sector: "Residential",
      image: "/work/drywall_residential.jpg",
    },
    {
      id: "m-sf-5",
      title: "Wide-Plank Hardwood Flooring Installation",
      trade: "Flooring",
      csi: "DIV 09",
      sector: "Residential",
      image: "/work/flooring_residential.jpg",
    },
    {
      id: "m-sf-6",
      title: "Painted Staircase & Oak Handrail",
      trade: "Carpentry",
      csi: "DIV 06",
      sector: "Residential",
      image: "/work/carpentry_residential.jpg",
    },
    {
      id: "m-sf-7",
      title: "Natural Stone Veneer & Custom Hearth",
      trade: "Masonry",
      csi: "DIV 04",
      sector: "Residential",
      image: "/work/stone_residential.jpg",
    },
    {
      id: "m-sf-8",
      title: "Exterior Porch, Siding & Dormer Renovation",
      trade: "Remodeling",
      csi: "DIV 07",
      sector: "Residential",
      image: "/curated/residential/div02_01_despues.jpg",
    },
  ],
  multifamily: [
    {
      id: "m-mf-1",
      title: "Architectural Roof Phasing & Replacement",
      trade: "Roofing",
      csi: "DIV 07",
      sector: "Multi-Family",
      image: "/curated/capabilities/reo-roof-3phase.jpg",
    },
    {
      id: "m-mf-2",
      title: "Custom Cabinetry & Common-Area Millwork",
      trade: "Carpentry",
      csi: "DIV 06",
      sector: "Multi-Family",
      image: "/work/carpentry_multifamily.jpg",
    },
    {
      id: "m-mf-3",
      title: "Acoustic Corridor & Interior Drywall",
      trade: "Drywall",
      csi: "DIV 09",
      sector: "Multi-Family",
      image: "/curated/magazine/revista_dw_hang.jpg",
    },
    {
      id: "m-mf-4",
      title: "Masonry Entry Piers & Stone Envelope",
      trade: "Masonry",
      csi: "DIV 04",
      sector: "Multi-Family",
      image: "/work/stone_multifamily.jpg",
    },
    {
      id: "m-mf-5",
      title: "Acoustic Underlayment & Hardwood Flooring",
      trade: "Flooring",
      csi: "DIV 09",
      sector: "Multi-Family",
      image: "/work/flooring_multifamily.jpg",
    },
    {
      id: "m-mf-6",
      title: "Two-Tone Navy Lap & Board-and-Batten Coating",
      trade: "Painting",
      csi: "DIV 09",
      sector: "Multi-Family",
      image: "/work/painting_multifamily.jpg",
    },
    {
      id: "m-mf-7",
      title: "Interior Wall Preparation & Finish Coat",
      trade: "Painting",
      csi: "DIV 09",
      sector: "Multi-Family",
      image: "/curated/magazine/revista_pa_04_a.jpg",
    },
    {
      id: "m-mf-8",
      title: "Taped & Mudded Corridor Gypsum Board",
      trade: "Drywall",
      csi: "DIV 09",
      sector: "Multi-Family",
      image: "/curated/magazine/revista_dw_fin.jpg",
    },
  ],
  townhomes: [
    {
      id: "m-twn-1",
      title: "Party-Wall & Three-Story Wood Framing",
      trade: "Framing",
      csi: "DIV 06",
      sector: "Townhomes",
      image: "/work/framing_townhomes.jpg",
    },
    {
      id: "m-twn-2",
      title: "Party-Wall & Parlor Smooth Drywall",
      trade: "Drywall",
      csi: "DIV 09",
      sector: "Townhomes",
      image: "/work/drywall_townhomes.jpg",
    },
    {
      id: "m-twn-3",
      title: "Parlor & Upper-Level Hardwood Flooring",
      trade: "Flooring",
      csi: "DIV 09",
      sector: "Townhomes",
      image: "/work/flooring_townhomes.jpg",
    },
    {
      id: "m-twn-4",
      title: "Custom Millwork, Trim & Staircase Carpentry",
      trade: "Carpentry",
      csi: "DIV 06",
      sector: "Townhomes",
      image: "/work/carpentry_townhomes.jpg",
    },
    {
      id: "m-twn-5",
      title: "Brick & Stone Veneer, Lintels & Entry Stoops",
      trade: "Masonry",
      csi: "DIV 04",
      sector: "Townhomes",
      image: "/work/stone_townhomes.jpg",
    },
    {
      id: "m-twn-6",
      title: "Primary Suite Custom Oak Vanity & Walk-In Closet Millwork",
      trade: "Carpentry",
      csi: "DIV 06",
      sector: "Townhomes",
      image: "/curated/properties/interior-primary-spa-bath-walkin.jpg",
    },
    {
      id: "m-twn-7",
      title: "Multi-Level Interior Trim & Finish Paint",
      trade: "Painting",
      csi: "DIV 09",
      sector: "Townhomes",
      image: "/curated/magazine/revista_in_01_a.jpg",
    },
    {
      id: "m-twn-8",
      title: "Architectural Shingle Roof, Gable Dormers & Gutters",
      trade: "Roofing",
      csi: "DIV 07",
      sector: "Townhomes",
      image: "/work/roofing_townhomes.jpg",
    },
  ],
  commercial: [
    {
      id: "m-com-1",
      title: "White TPO Membrane Roof & Metal Parapet",
      trade: "Roofing",
      csi: "DIV 07",
      sector: "Commercial",
      image: "/work/roofing_commercial.jpg",
    },
    {
      id: "m-com-2",
      title: "Limestone & Stacked Stone Veneer Envelope",
      trade: "Masonry",
      csi: "DIV 04",
      sector: "Commercial",
      image: "/work/stone_commercial.jpg",
    },
    {
      id: "m-com-3",
      title: "Rainscreen Siding & Trim Envelope",
      trade: "Siding",
      csi: "DIV 07",
      sector: "Commercial",
      image: "/curated/magazine/revista_si_05_a.jpg",
    },
    {
      id: "m-com-4",
      title: "Natural Ashlar Stone Masonry Facade",
      trade: "Masonry",
      csi: "DIV 04",
      sector: "Commercial",
      image: "/curated/magazine/revista_st_nat_a.jpg",
    },
    {
      id: "m-com-5",
      title: "Double-Height Curtain-Wall Glazing",
      trade: "Windows & Doors",
      csi: "DIV 08",
      sector: "Commercial",
      image: "/curated/magazine/revista_wi_com.jpg",
    },
    {
      id: "m-com-6",
      title: "Painted Open-Deck Ceiling & Polished Concrete",
      trade: "Painting",
      csi: "DIV 09",
      sector: "Commercial",
      image: "/work/painting_commercial.jpg",
    },
    {
      id: "m-com-7",
      title: "Walnut Acoustic Ceiling & Wall Fit-Out",
      trade: "Carpentry",
      csi: "DIV 06",
      sector: "Commercial",
      image: "/work/carpentry_commercial.jpg",
    },
    {
      id: "m-com-8",
      title: "Architectural Metal Panel & Storefront Envelope",
      trade: "Siding",
      csi: "DIV 07",
      sector: "Commercial",
      image: "/work/siding_commercial.jpg",
    },
  ],
};

export function getMarqueeTracksForSiteDivision(
  siteDivision: SiteDivisionSlug | "all" = "all"
): {
  topTrack: readonly MarqueeShot[];
  bottomTrack: readonly MarqueeShot[];
  allShots: readonly MarqueeShot[];
} {
  if (!siteDivision || siteDivision === "all") {
    return {
      topTrack: MARQUEE_TRACK_TOP,
      bottomTrack: MARQUEE_TRACK_BOTTOM,
      allShots: [...MARQUEE_TRACK_TOP, ...MARQUEE_TRACK_BOTTOM],
    };
  }
  const divisionShots = DIVISION_MARQUEE_SHOTS_BY_CATEGORY[siteDivision];
  const half = Math.ceil(divisionShots.length / 2);
  return {
    topTrack: divisionShots.slice(0, half),
    bottomTrack: divisionShots.slice(half),
    allShots: divisionShots,
  };
}

export function DualTrackArchitecturalMarquee({
  siteDivision,
}: {
  siteDivision?: SiteDivisionSlug | "all";
} = {}) {
  const pathname = usePathname();
  const effectiveSiteDivision =
    siteDivision ?? resolveSiteDivisionFromPathname(pathname);
  const { topTrack, bottomTrack, allShots } = getMarqueeTracksForSiteDivision(
    effectiveSiteDivision
  );
  const [selectedShot, setSelectedShot] = useState<MarqueeShot | null>(null);

  return (
    <div className="py-10 border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6 flex flex-col items-center justify-center text-center gap-2">
        <h3 className="tayco-display-title text-xl sm:text-2xl text-white text-center">
          Field Gallery
        </h3>
      </div>

      {/* Selected Shot Quick Inspector Drawer */}
      <TaycoModalOverlay
        isOpen={Boolean(selectedShot)}
        onClose={() => setSelectedShot(null)}
        onStepPrev={() => {
          if (!selectedShot) return;
          const idx = allShots.findIndex((s) => s.id === selectedShot.id);
          if (idx !== -1) {
            const nextIdx = (idx - 1 + allShots.length) % allShots.length;
            setSelectedShot(allShots[nextIdx] ?? null);
          }
        }}
        onStepNext={() => {
          if (!selectedShot) return;
          const idx = allShots.findIndex((s) => s.id === selectedShot.id);
          if (idx !== -1) {
            const nextIdx = (idx + 1) % allShots.length;
            setSelectedShot(allShots[nextIdx] ?? null);
          }
        }}
        ariaLabel={selectedShot?.title ?? "Photograph"}
      >
        {({ stageGestureHandlers }) => (
          <div
            className="max-w-4xl w-full max-h-[calc(100dvh-32px)] flex flex-col rounded-[26px] border overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)]"
            style={{
              background: "rgba(11, 22, 42, 0.98)",
              borderColor: "#C9A84C",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {selectedShot && (
              <>
                <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2">
                  <p className="text-xs text-slate-300">{selectedShot.trade}</p>
                  <button type="button" autoFocus onClick={() => setSelectedShot(null)} aria-label="Close photograph" className="min-h-11 rounded-xl border border-amber-200/30 px-3 text-sm text-amber-100 cursor-pointer">Close ✕</button>
                </header>
                <div {...stageGestureHandlers} className="relative h-[min(45dvh,460px)] shrink-0 w-full bg-[#040811]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <ProtectedImage
                    src={selectedShot.image}
                    auditIgnore={true}
                    alt={selectedShot.title}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div tabIndex={0} className="min-h-0 overflow-y-auto overscroll-contain p-4 border-t border-white/10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-mono text-amber-200">
                        {selectedShot.trade}
                      </span>
                      <div className="text-lg font-black text-white mt-0.5">
                        {selectedShot.title}
                      </div>
                    </div>
                    <ImageReferenceButton compact src={selectedShot.image} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </TaycoModalOverlay>

      {/* Track 1 */}
      <div className="tayco-filmstrip-wrapper mb-4">
        <div className="tayco-filmstrip-track track-left">
          {[...topTrack, ...topTrack].map((shot, idx) => (
            <button
              key={`${shot.id}-${idx}`}
              type="button"
              onClick={() => setSelectedShot(shot)}
              className="tayco-filmstrip-card group text-left cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={shot.image}
                auditIgnore={idx >= topTrack.length}
                alt={shot.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Track 2 */}
      <div className="tayco-filmstrip-wrapper">
        <div className="tayco-filmstrip-track track-right">
          {[...bottomTrack, ...bottomTrack].map((shot, idx) => (
            <button
              key={`${shot.id}-${idx}`}
              type="button"
              onClick={() => setSelectedShot(shot)}
              className="tayco-filmstrip-card group text-left cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={shot.image}
                auditIgnore={idx >= bottomTrack.length}
                alt={shot.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 3. INTERACTIVE 8-STATE REGIONAL FOOTPRINT BAR
 * ───────────────────────────────────────────────────────────── */
export function RegionalStateFootprintStrip() {
  const {
    displayIdx: hubIdx,
    targetIdx: selectedHubIdx,
    selectScene: selectHubIdx,
  } = useSynchronizedScene(
    REGIONAL_STATE_HUBS.length,
    (idx) => [REGIONAL_STATE_HUBS[idx]?.sampleImage ?? REGIONAL_STATE_HUBS[0].sampleImage],
    6000
  );
  const currentHub = REGIONAL_STATE_HUBS[hubIdx] ?? REGIONAL_STATE_HUBS[0];

  useEffect(() => {
    preloadProtectedImages(REGIONAL_STATE_HUBS.map((h) => h.sampleImage));
  }, []);

  return (
    <div
      className="mt-5 pt-4 border-t border-white/15 flex flex-col lg:flex-row items-center justify-between gap-4"
      aria-label="Interactive 8-State Service Footprint"
    >
      <TaycoPillDock ariaLabel="Choose a service state">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-200/90 max-sm:w-full max-sm:text-center sm:mr-1.5">
          8-State Dispatch:
        </span>
        {REGIONAL_STATE_HUBS.map((hub, hIdx) => {
          const selected = hIdx === selectedHubIdx;
          return (
            <button
              key={hub.state}
              type="button"
              aria-pressed={selected}
              onClick={() => selectHubIdx(hIdx)}
              onPointerEnter={() => selectHubIdx(hIdx)}
              className="max-sm:min-h-9 max-sm:min-w-9 max-sm:px-2 max-sm:py-1.5 min-h-11 min-w-11 px-2.5 py-2 rounded-full text-xs font-mono font-black transition-colors cursor-pointer border"
              style={{
                background: selected ? "#C9A84C" : "rgba(7, 14, 26, 0.65)",
                color: selected ? "#070E1A" : "#F3D37A",
                borderColor: selected ? "#F3D37A" : "rgba(201, 168, 76, 0.35)",
              }}
            >
              {hub.state}
            </button>
          );
        })}
      </TaycoPillDock>

      <div
        className="flex items-center gap-3 px-3.5 py-2 rounded-xl border w-full lg:w-auto justify-between lg:justify-end"
        style={{
          background: "rgba(7, 14, 26, 0.72)",
          borderColor: "rgba(201, 168, 76, 0.35)",
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <ProtectedImage
            src={currentHub.sampleImage}
            alt={currentHub.name}
            className="w-11 h-9 rounded-lg object-cover border shrink-0"
            style={{ borderColor: "rgba(201, 168, 76, 0.55)" }}
          />
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">
                {currentHub.name} ({currentHub.state})
              </span>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(201, 168, 76, 0.2)", color: "#F3D37A" }}
              >
                {currentHub.mobilization}
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-300 truncate">
              {currentHub.corridor}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
 * 5. INTERACTIVE 3-PHOTO SERVICE CARD TRIPTYCH
 * ───────────────────────────────────────────────────────────── */
export const RegionalFootprintStrip = RegionalStateFootprintStrip;
export interface TriptychFrame {
  src: string;
  label: string;
}

function sanitizeGalleryLabel(label: string): string {
  return label
    .replace(/\b(?:Single-Family|Detached\s+Homes?|Multi-Family|Multifamily|Multi-Unit|Multi-Stor(?:e?y|ies)|Duplex(?:es)?|Two-Flats?|Triplex(?:es)?|Quadplex(?:es)?|Townhomes?|Townhouses?|Row\s*(?:home|house)s?|Commercial|Residential)\s*/gi, "")
    .replace(/^\d+\s*[·/]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function ServiceCardTriptych({
  frames,
  badge,
  accentColor = "#C9A84C",
}: {
  frames: TriptychFrame[];
  badge: string;
  accentColor?: string;
}) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [triptychPulse, setTriptychPulse] = useState<number>(0);
  const [expandedOpen, setExpandedOpen] = useState<boolean>(false);
  const safeFrames = frames.length > 0 ? frames : [{ src: "/curated/commercial/com_02_2.jpg", label: "Field Execution" }];
  const triptychUrls = safeFrames.map((f) => f.src);
  const current = safeFrames[activeIdx] ?? safeFrames[0];
  const cleanCurrentLabel = sanitizeGalleryLabel(current.label);
  const cleanBadge = sanitizeGalleryLabel(badge);

  const selectTriptychFrame = (idx: number) => {
    const target = safeFrames[idx];
    if (!target) return;
    waitForDecodedSurfaces([target.src]).then(() => {
      setActiveIdx((prev) => {
        if (prev !== idx) setTriptychPulse((p) => p + 1);
        return idx;
      });
    });
  };

  return (
    <div className="mb-4">
      {/* Main Triptych Viewport — Unobstructed Large Photo */}
      <div
        role="button"
        tabIndex={0}
        data-response-kind="surface"
        data-magnetic
        onClick={() => setExpandedOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpandedOpen(true);
          }
        }}
        className="tayco-living-card relative w-full overflow-hidden rounded-xl border shadow-md group cursor-pointer"
        style={{
          aspectRatio: "16 / 9",
          borderColor: "rgba(15, 32, 64, 0.16)",
          background: "#070E1A",
        }}
      >
        <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <ProtectedImage
          src={current.src}
          auditIgnore={safeFrames.length > 1}
          alt={cleanCurrentLabel}
          syncUrls={triptychUrls}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* 3-Photo Simultaneous Thumbnail Gallery Grid */}
      {safeFrames.length > 1 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {safeFrames.map((frame, i) => {
            const isSel = i === activeIdx;
            const cleanLbl = sanitizeGalleryLabel(frame.label);
            return (
              <button
                key={`${frame.src}-${i}`}
                type="button"
                data-magnetic
                onClick={() => selectTriptychFrame(i)}
                onPointerEnter={() => selectTriptychFrame(i)}
                className={`group/thumb relative h-16 sm:h-20 rounded-lg overflow-hidden border transition-all cursor-pointer text-left ${
                  isSel
                    ? "border-[#F3D37A] ring-1 ring-[#F3D37A]"
                    : "border-white/15 opacity-80 hover:opacity-100"
                }`}
                aria-label={cleanLbl}
                title={cleanLbl}
              >
                <ProtectedImage
                  src={frame.src}
                  alt={cleanLbl}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Full-Screen Triptych Lightbox Modal */}
      {expandedOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-xl"
          onClick={() => setExpandedOpen(false)}
        >
          <div
            className="max-w-4xl w-full rounded-2xl border overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)]"
            style={{
              background: "rgba(11, 22, 42, 0.98)",
              borderColor: accentColor,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-[460px] w-full bg-[#040811]">
              <ProtectedImage
                src={current.src}
                auditIgnore={true}
                alt={cleanCurrentLabel}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F3D37A]">
                  {cleanBadge}
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {cleanCurrentLabel}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {safeFrames.map((f, i) => {
                  const cleanLbl = sanitizeGalleryLabel(f.label);
                  return (
                    <button
                      key={f.src}
                      type="button"
                      onClick={() => selectTriptychFrame(i)}
                      className="px-3 py-1.5 rounded-full text-xs font-mono font-bold border cursor-pointer"
                      style={
                        i === activeIdx
                          ? {
                              background: "#C9A84C",
                              color: "#050A14",
                              borderColor: "#F3D37A",
                            }
                          : {
                              background: "rgba(15, 32, 64, 0.8)",
                              color: "#E2E8F0",
                              borderColor: "rgba(255,255,255,0.15)",
                            }
                      }
                    >
                      {cleanLbl}
                    </button>
                  );
                })}
                <button
                  type="button"
                  data-magnetic
                  onClick={() => setExpandedOpen(false)}
                  className="tayco-atelier-btn-gold px-4 py-1.5 text-xs tracking-wider cursor-pointer"
                >
                  Close ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const CuratedTriptychShowcaseSection = ServiceCardTriptych;
