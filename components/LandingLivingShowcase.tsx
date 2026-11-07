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
    title: "Multi-Level Commercial Steel Stud & Atrium Framing",
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
    divisionLabel: "Div 01 · Structural & Millwork",
    siteDivision: "single-family",
    code: "TR-01",
    title: "Ground-Up Two-Story Wood Framing & Roof Trusses",
    subtitle: "Bare concrete foundation slab to complete structural shell",
    csiSpec: "CSI 06 10 00 · ROUGH CARPENTRY & TRUSSES",
    beforeImg: "/curated/pairs/div01_01_antes.jpg",
    afterImg: "/curated/pairs/div01_01_despues.jpg",
    beforeTag: "01 / Bare Poured Foundation Slab",
    afterTag: "02 / Framed 2-Story Structure & Trusses",
    summary:
      "Complete structural framing package from anchor-bolted sill plates on bare concrete to two-story wall sheathing, window rough openings and engineered roof trusses.",
    highlights: ["Engineered roof truss package", "OSB structural shear sheathing", "Plumb & level multi-story framing"],
  },
  {
    id: "div04_03",
    division: "div04",
    divisionLabel: "Div 04 · Roofing Systems",
    siteDivision: "commercial",
    code: "TR-02",
    title: "Commercial Flat Roof Heat-Welded TPO Retrofit",
    subtitle: "Ponding aged membrane to high-reflectivity white TPO system",
    csiSpec: "CSI 07 54 23 · THERMOPLASTIC POLYOLEFIN (TPO)",
    beforeImg: "/curated/pairs/div04_03_antes.jpg",
    afterImg: "/curated/pairs/div04_03_despues.jpg",
    beforeTag: "01 / Aged Ponding Black Roof",
    afterTag: "02 / Heat-Welded White TPO Membrane",
    summary:
      "Full commercial low-slope roof recovery featuring tapered insulation drainage correction, parapet termination bars, HVAC curb flashings and robotic hot-air welded TPO seams.",
    highlights: ["Tapered polyiso drainage slope", "Robotic heat-welded seams", "Parapet & RTU curb flashing"],
  },
  {
    id: "div03_02",
    division: "div03",
    divisionLabel: "Div 03 · Interior & Commercial",
    siteDivision: "single-family",
    code: "TR-03",
    title: "Full-Gut Kitchen Modernization & Quartz Island",
    subtitle: "Dated 1990s oak layout to custom white shaker & quartz centerpiece",
    csiSpec: "CSI 06 41 00 / 12 36 00 · CABINETRY & COUNTERTOPS",
    beforeImg: "/curated/pairs/div03_02_antes.jpg",
    afterImg: "/curated/pairs/tr03-after-white-shaker-kitchen.jpg",
    beforeTag: "01 / Dated 1990s Oak Kitchen",
    afterTag: "02 / Custom Shaker, Quartz & Pendants",
    summary:
      "Complete interior gut and layout transformation featuring custom full-overlay shaker cabinetry, waterfall-edge quartz surfaces, architectural pendant lighting and wide-plank hardwood.",
    highlights: ["Custom shaker cabinetry & island", "Veined quartz countertops", "Upgraded MEP & task lighting"],
  },
  {
    id: "div02_02",
    division: "div02",
    divisionLabel: "Div 02 · Exterior & Masonry",
    siteDivision: "single-family",
    code: "TR-04",
    title: "Board-and-Batten Farmhouse Exterior Envelope",
    subtitle: "Weathered wood siding to crisp white vertical cladding & black trim",
    csiSpec: "CSI 07 46 00 · SIDING & EXTERIOR TRIM",
    beforeImg: "/curated/pairs/div02_02_antes.jpg",
    afterImg: "/curated/pairs/div02_02_despues.jpg",
    beforeTag: "01 / Weathered Dark Wood Cladding",
    afterTag: "02 / Crisp Board-and-Batten Envelope",
    summary:
      "Full exterior envelope overhaul with continuous weather-resistive barrier, vertical board-and-batten siding, matte-black architectural window casings and rebuilt porch columns.",
    highlights: ["Weather-resistive housewrap plane", "Board-and-batten vertical profile", "Custom black window & fascia trim"],
  },
  {
    id: "div04_02",
    division: "div04",
    divisionLabel: "Div 04 · Roofing Systems",
    siteDivision: "single-family",
    code: "TR-05",
    title: "Standing-Seam Architectural Metal Roof Upgrade",
    subtitle: "Moss-damaged shingle roof to matte-black standing-seam metal",
    csiSpec: "CSI 07 41 13 · STANDING-SEAM METAL ROOFING",
    beforeImg: "/curated/pairs/div04_02_antes.jpg",
    afterImg: "/curated/pairs/div04_02_despues.jpg",
    beforeTag: "01 / Moss-Damaged Shingle Roof",
    afterTag: "02 / Matte-Black Standing-Seam Metal",
    summary:
      "High-durability architectural metal roof installation with concealed fastener clips, high-temp ice and water shield underlayment, and custom-fabricated ridge and valley flashings.",
    highlights: ["Concealed-fastener standing seams", "High-temp synthetic underlayment", "Precision ridge & valley metalwork"],
  },
  {
    id: "div01_03",
    division: "div01",
    divisionLabel: "Div 01 · Structural & Millwork",
    siteDivision: "single-family",
    code: "TR-06",
    title: "Custom Built-In Millwork, Coffered Ceiling & Stone Hearth",
    subtitle: "Blank builder-grade wall to architectural living room centerpiece",
    csiSpec: "CSI 06 20 00 / 04 43 00 · MILLWORK & STONE",
    beforeImg: "/curated/pairs/div01_03_antes.jpg",
    afterImg: "/curated/pairs/tr06-after-built-in-fireplace.jpg",
    beforeTag: "01 / Bare Drywall Living Room",
    afterTag: "02 / Custom Bookcases, Coffered Beams & Hearth",
    summary:
      "Bespoke finish carpentry combining floor-to-ceiling built-in cabinetry, a full-height stacked-stone fireplace surround with solid timber mantel, and a recessed coffered ceiling grid.",
    highlights: ["Floor-to-ceiling custom bookcases", "Stacked-stone fireplace & timber mantel", "Coffered ceiling beam grid"],
  },
  {
    id: "div03_01",
    division: "div03",
    divisionLabel: "Div 03 · Interior & Commercial",
    siteDivision: "commercial",
    code: "TR-07",
    title: "Commercial Steel-Stud Framing to Level-4 Drywall Finish",
    subtitle: "Open metal stud bays to taped, mudded and primed commercial suite",
    csiSpec: "CSI 09 29 00 · GYPSUM BOARD & INTERIOR PARTITIONS",
    beforeImg: "/curated/pairs/div03_01_antes.jpg",
    afterImg: "/curated/pairs/div03_01_despues.jpg",
    beforeTag: "01 / Raw Commercial Metal Studs",
    afterTag: "02 / Taped, Skimmed & Primed Partitions",
    summary:
      "Commercial tenant interior progression from cold-formed steel stud layout and rough-in inspection to acoustic insulation, fire-rated Type X gypsum board and smooth Level-4 finish.",
    highlights: ["Fire-rated Type X gypsum assemblies", "Laser-aligned door & glazing rough-ins", "Clean Level-4 joint compound finish"],
  },
  {
    id: "div02_03",
    division: "div02",
    divisionLabel: "Div 02 · Exterior & Masonry",
    siteDivision: "single-family",
    code: "TR-08",
    title: "Stacked-Stone Masonry Veneer & Column Pedestals",
    subtitle: "Exposed concrete foundation to natural ledger-stone facade",
    csiSpec: "CSI 04 73 00 · MANUFACTURED & NATURAL STONE VENEER",
    beforeImg: "/curated/pairs/div02_03_antes.jpg",
    afterImg: "/curated/pairs/div02_03_despues.jpg",
    beforeTag: "01 / Bare Concrete Foundation Wall",
    afterTag: "02 / Stacked-Stone Wainscoting & Columns",
    summary:
      "Exterior masonry upgrade featuring metal lath, polymer-modified scratch coat, dry-stacked stone veneer wainscoting, cast-stone water table sills and tapered porch column wraps.",
    highlights: ["Chiseled cast-stone water table", "Dry-stack stone veneer coursing", "Wrapped craftsman porch columns"],
  },
  {
    id: "div01_02",
    division: "div01",
    divisionLabel: "Div 01 · Structural & Millwork",
    siteDivision: "single-family",
    code: "TR-09",
    title: "Structural Timber Deck & Staircase Reconstruction",
    subtitle: "Rotted unsafe backyard deck to code-compliant cedar deck system",
    csiSpec: "CSI 06 15 00 · WOOD DECKING & STRUCTURAL FRAMING",
    beforeImg: "/curated/pairs/div01_02_antes.jpg",
    afterImg: "/curated/pairs/tr09-after-cedar-deck.jpg",
    beforeTag: "01 / Weathered & Rotted Timber Deck",
    afterTag: "02 / Rebuilt Cedar Deck, Guardrails & Stairs",
    summary:
      "Full demolition of deteriorated decking and joists followed by deep concrete pier footings, pressure-treated structural framing, flashed ledger board and premium cedar decking.",
    highlights: ["Flashed structural ledger attachment", "Heavy-duty stringers & guardrails", "Precision-gapped timber deck boards"],
  },
  {
    id: "div04_04",
    division: "div04",
    divisionLabel: "Div 04 · Roofing Systems",
    siteDivision: "commercial",
    code: "TR-10",
    title: "Commercial Storefront Hip-Roof Charcoal Standing-Seam Re-Roof",
    subtitle: "Corroded metal hip roof & failing gutters to charcoal standing-seam panels",
    csiSpec: "CSI 07 41 13 / 07 71 00 · METAL ROOF & COPING",
    beforeImg: "/curated/pairs/div04_04_antes.jpg",
    afterImg: "/curated/pairs/div04_04_despues.jpg",
    beforeTag: "01 / Rusted Commercial Hip-Roof Facade",
    afterTag: "02 / Charcoal Standing-Seam Hip Roof & Trim",
    summary:
      "High-visibility commercial facade rehabilitation replacing corroded hip-roof panels and sagging gutters with Kynar-finished charcoal standing-seam panels and commercial box gutters.",
    highlights: ["Kynar-coated charcoal architectural metal", "Seamless commercial gutter & downspouts", "Boom-lift staged zero-disruption execution"],
  },
  {
    id: "div02_04",
    division: "div02",
    divisionLabel: "Div 02 · Exterior & Masonry",
    siteDivision: "single-family",
    code: "TR-11",
    title: "Perimeter Cedar Privacy Fence & Concrete Footings",
    subtitle: "Damaged chain-link enclosure to custom 6-foot cedar privacy line",
    csiSpec: "CSI 32 31 00 · FENCES, GATES & SITE IMPROVEMENTS",
    beforeImg: "/curated/pairs/div02_04_antes.jpg",
    afterImg: "/curated/pairs/div02_04_despues.jpg",
    beforeTag: "01 / Bent Chain-Link Perimeter",
    afterTag: "02 / Custom Cedar Privacy Fence Line",
    summary:
      "Complete site boundary upgrade replacing rusted chain-link fabric with laser-leveled cedar privacy panels, post-in-concrete footings and continuous top cap trim.",
    highlights: ["Deep-set concrete post footings", "Tight-knot western red cedar boards", "Continuous weather-shedding top rail"],
  },
  {
    id: "div03_04",
    division: "div03",
    divisionLabel: "Div 03 · Interior & Commercial",
    siteDivision: "single-family",
    code: "TR-12",
    title: "Raw CMU Basement to Finished Living Suite & LVP",
    subtitle: "Unfinished concrete block lower level to warm turnkey living space",
    csiSpec: "CSI 09 29 00 / 09 65 00 · BASEMENT TURNKEY BUILD",
    beforeImg: "/curated/pairs/div03_04_antes.jpg",
    afterImg: "/curated/pairs/tr12-after-finished-basement.jpg",
    beforeTag: "01 / Unfinished CMU Block Basement",
    afterTag: "02 / Insulated Walls, Recessed LEDs & LVP",
    summary:
      "Full lower-level conversion featuring moisture-mitigated perimeter framing, closed-cell insulation, smooth drywall ceiling with recessed LED lighting and waterproof luxury vinyl plank.",
    highlights: ["Perimeter moisture barrier & framing", "Low-profile recessed LED grid", "Waterproof wide-plank LVP flooring"],
  },
];

/**
 * Filters the Before & After transformation pairs by site division (`single-family`,
 * `multifamily`, `townhomes`, `commercial`). On the home page (`all`), all 12 pairs are returned.
 * When a residential division (`multifamily` or `townhomes`) does not yet have dedicated pairs in
 * `TRANSFORMATION_PAIRS`, it falls back to residential-only pairs (never commercial pairs).
 */
export function getTransformationPairsForSiteDivision(
  siteDivision: SiteDivisionSlug | "all" = "all"
): TransformationPair[] {
  if (!siteDivision || siteDivision === "all") {
    return TRANSFORMATION_PAIRS;
  }
  const directMatches = TRANSFORMATION_PAIRS.filter(
    (p) => p.siteDivision === siteDivision
  );
  if (directMatches.length > 0) {
    return directMatches;
  }
  if (siteDivision === "multifamily") {
    return TRANSFORMATION_PAIRS.filter((p) =>
      ["div01_01", "div02_03", "div03_04"].includes(p.id)
    );
  }
  if (siteDivision === "townhomes") {
    return TRANSFORMATION_PAIRS.filter((p) =>
      ["div01_03", "div02_03", "div04_02"].includes(p.id)
    );
  }
  return TRANSFORMATION_PAIRS.filter((p) => p.siteDivision !== "commercial");
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
    trade: "Site Prep & Earthwork",
    csi: "DIV 31",
    sector: "Commercial",
    image: "/curated/magazine/revista_ex_ex_mass.jpg",
  },
  {
    id: "m-top-2",
    title: "Two-Story Cold-Formed Steel Structural Framing",
    trade: "Structural Framing",
    csi: "DIV 05",
    sector: "Commercial",
    image: "/curated/magazine/revista_fr_metal_04.jpg",
  },
  {
    id: "m-top-3",
    title: "Townhome Rooftop Timber Framing & Decking",
    trade: "Wood Framing",
    csi: "DIV 06",
    sector: "Townhomes",
    image: "/curated/properties/mkt-twn-framing-rooftop.jpg",
  },
  {
    id: "m-top-4",
    title: "Standing-Seam Architectural Metal Roof System",
    trade: "Roofing Systems",
    csi: "DIV 07",
    sector: "Commercial & Res",
    image: "/curated/magazine/revista_ro_metal_a.jpg",
  },
  {
    id: "m-top-5",
    title: "Natural Slate Gable & Copper Valley Flashing",
    trade: "Specialty Roofing",
    csi: "DIV 07",
    sector: "Residential",
    image: "/curated/residential/sf-slate-roof-cottage.jpg",
  },
  {
    id: "m-top-6",
    title: "Architectural Rainscreen Siding & Trim Envelope",
    trade: "Siding & Cladding",
    csi: "DIV 07",
    sector: "Commercial",
    image: "/curated/magazine/revista_si_05_a.jpg",
  },
  {
    id: "m-top-7",
    title: "Natural Ashlar Stone Masonry Facade",
    trade: "Stone & Masonry",
    csi: "DIV 04",
    sector: "Commercial",
    image: "/curated/magazine/revista_st_nat_a.jpg",
  },
  {
    id: "m-top-8",
    title: "Double-Height Commercial Curtain-Wall Glazing",
    trade: "Glazing & Storefront",
    csi: "DIV 08",
    sector: "Commercial",
    image: "/curated/magazine/revista_wi_com.jpg",
  },
];

export const MARQUEE_TRACK_BOTTOM: MarqueeShot[] = [
  {
    id: "m-bot-1",
    title: "Commercial Retail Millwork & Suspended Ceiling Fit-Out",
    trade: "Interior Fit-Out",
    csi: "DIV 09",
    sector: "Commercial",
    image: "/curated/commercial/cx_x1.jpg",
  },
  {
    id: "m-bot-2",
    title: "Exterior Wall Framing, Window Headers & Ceiling Joists",
    trade: "Rough Carpentry",
    csi: "DIV 06",
    sector: "Residential",
    image: "/curated/magazine/revista_fr_wood_05.jpg",
  },
  {
    id: "m-bot-3",
    title: "Curved Commercial Soffit & Gypsum Board Assembly",
    trade: "Drywall Systems",
    csi: "DIV 09",
    sector: "Commercial",
    image: "/work/drywall_commercial.jpg",
  },
  {
    id: "m-bot-4",
    title: "Painted Staircase, Oak Handrail & Finish Carpentry",
    trade: "Finish Carpentry",
    csi: "DIV 06",
    sector: "Commercial & Res",
    image: "/curated/magazine/revista_ca_finish_1.jpg",
  },
  {
    id: "m-bot-5",
    title: "Executive Walnut Acoustic Ceiling & Wall Fit-Out",
    trade: "Architectural Millwork",
    csi: "DIV 06",
    sector: "Commercial",
    image: "/work/carpentry_commercial.jpg",
  },
  {
    id: "m-bot-6",
    title: "Coffered Architectural Ceiling & Recessed Lighting",
    trade: "Interior Finishes",
    csi: "DIV 09",
    sector: "Residential",
    image: "/curated/magazine/revista_in_05_a.jpg",
  },
  {
    id: "m-bot-7",
    title: "Exposed Timber & Structural Steel Loft Coatings",
    trade: "Commercial Painting",
    csi: "DIV 09",
    sector: "Commercial",
    image: "/curated/magazine/revista_pa_04_a.jpg",
  },
  {
    id: "m-bot-8",
    title: "Diamond-Honed Terrazzo & Polished Concrete Slab",
    trade: "Concrete & Flooring",
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
    primaryFocus: "Commercial Fit-Outs, Roofing, Siding & Full-Scale Renovations",
    mobilization: "Primary HQ Dispatch",
    sampleImage: "/curated/properties/mkt-com-roofing-greenroof.jpg",
  },
  {
    state: "IL",
    name: "Illinois",
    corridor: "Chicagoland · Rockford · Naperville",
    primaryFocus: "Commercial Tenant Improvements, Multi-Family CapEx & Restoration",
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
    primaryFocus: "Multi-Family Renovations, Carpentry & Masonry Restoration",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/properties/mkt-mf-roofing.jpg",
  },
  {
    state: "MO",
    name: "Missouri",
    corridor: "St. Louis · Kansas City · Columbia",
    primaryFocus: "Commercial Plazas, REO Asset Preservation & Structural Framing",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/properties/mkt-com-stone-masonry.jpg",
  },
  {
    state: "TX",
    name: "Texas",
    corridor: "Dallas–Fort Worth · Houston · Austin",
    primaryFocus: "Ground-Up Commercial, Multi-Family Turnovers & Large-Loss Recovery",
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
  eyebrowLabel = "01B / INTERACTIVE BEFORE & AFTER TRANSFORMATION STUDIO",
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

  const activePair =
    visiblePairs.find((p) => p.id === selectedId) ??
    visiblePairs[0] ??
    scopedPairs[0] ??
    TRANSFORMATION_PAIRS[0];

  const divisionTabDefs = [
    { id: "all" as const, label: "All Divisions", count: scopedPairs.length },
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
      label: "Interior & Commercial",
      count: scopedPairs.filter((p) => p.division === "div03").length,
    },
    {
      id: "div04" as const,
      label: "Roofing Systems",
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
      className="py-10 sm:py-24 px-4 sm:px-8 relative z-10 border-t"
      style={{
        background:
          "radial-gradient(circle at 82% 16%, rgba(201, 168, 76, 0.14), transparent 50%), radial-gradient(circle at 14% 85%, rgba(27, 58, 107, 0.48), transparent 58%), #070E1A",
        borderColor: "rgba(201, 168, 76, 0.28)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <TaycoSectionHeader
          eyebrow={eyebrowLabel}
          title={<>From raw condition to <em className="tayco-serif-em text-[#F3D37A]">finished execution.</em></>}
          subtitle="Compare transformations with the before-and-after curtain or structural X-ray lens. Choose a trade group to explore its field execution."
          className="mb-6"
        />
        <div className="flex flex-col items-center gap-6 mb-10">
          {/* Division Tabs */}
          <TaycoPillDock ariaLabel="Filter transformations by division">
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
                  {tab.label}{" "}
                  <span className="opacity-75 text-[10px]">({tab.count})</span>
                </button>
              );
            })}
          </TaycoPillDock>
        </div>

        {/* Main Interactive Stage + Telemetry Panel */}
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
              {/* Base Layer: AFTER (Finished Turnkey Execution) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={activePair.afterImg}
                alt={`${activePair.title} — After`}
                syncUrls={[activePair.afterImg, activePair.beforeImg]}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
              />

              {/* Overlay Layer: BEFORE (Initial / Raw Structural Condition) */}
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
                    X-RAY · SUBSTRATE VIEW
                  </span>
                </div>
              )}

              {/* Top-Left & Top-Right Condition Badges */}
              <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2 pointer-events-none">
                <span
                  className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-black uppercase tracking-wider border backdrop-blur-md"
                  style={{
                    background: "rgba(7, 14, 26, 0.84)",
                    borderColor: "rgba(243, 211, 122, 0.45)",
                    color: "#F3D37A",
                  }}
                >
                  {activePair.beforeTag}
                </span>
              </div>

              <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-2 pointer-events-none">
                <span
                  className="px-3 py-1.5 rounded-lg text-[11px] font-mono font-black uppercase tracking-wider border backdrop-blur-md"
                  style={{
                    background: "rgba(201, 168, 76, 0.92)",
                    borderColor: "#F3D37A",
                    color: "#070E1A",
                  }}
                >
                  {activePair.afterTag}
                </span>
              </div>
            </div>

            {/* Sub-Photo Telemetry & Interactive Control Strip Under Stage (outside photo canvas) */}
            <div
              className="mt-2.5 p-3 rounded-xl border flex flex-col gap-2.5"
              style={{
                background: "rgba(15, 32, 64, 0.78)",
                borderColor: "rgba(201, 168, 76, 0.32)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black"
                    style={{ background: "#C9A84C", color: "#070E1A" }}
                  >
                    {activePair.code}
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {activePair.csiSpec}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-amber-200/90">
                  {inspectMode === "split"
                    ? `CURTAIN: ${splitPercent}% BEFORE / ${100 - splitPercent}% AFTER`
                    : `X-RAY LOUPE: X=${xrayPos.x}% · Y=${xrayPos.y}%`}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Mode Switcher: 50/50 Curtain vs Structural X-Ray Lens */}
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

              {/* Quick Curtain Presets */}
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                  Quick Snap:
                </span>
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
          </div>

          {/* Right 4 Columns: Active Transformation Specification & Highlights */}
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
                  <span className="text-xs font-mono text-slate-400">
                    {activePair.code} / 12
                  </span>
                </div>

                <h3 className="tayco-card-title text-xl sm:text-2xl text-white leading-snug text-center">
                  {activePair.title}
                </h3>
                <p className="home-study-summary text-sm text-slate-300 mt-4 leading-relaxed text-left">
                  {activePair.subtitle}
                </p>

                <details open className="home-reading-details mt-4 w-full">
                  <summary>Scope details <span aria-hidden="true">＋</span></summary>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{activePair.summary}</p>
                  <ul className="space-y-2 inline-flex flex-col items-start mx-auto">
                    {activePair.highlights.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2.5 text-xs text-slate-200 font-medium"
                      >
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: "#C9A84C" }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5 w-full">
                <ImageReferenceButton src={activePair.afterImg} label="Save finished reference" />
                <Link
                  href="/estimate"
                  data-magnetic
                  className="tayco-atelier-btn-gold w-full text-center py-3 text-xs tracking-wider"
                >
                  <span>Discuss this project →</span>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/commercial"
                    data-magnetic
                    className="home-text-action"
                  >
                    Commercial →
                  </Link>
                  <Link
                    href="/single-family"
                    data-magnetic
                    className="home-text-action"
                  >
                    Residential →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 12-Pair Thumbnail Filmstrip Selector */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Select a transformation case study ({visiblePairs.length} available in current filter):
            </span>
            <span className="text-[11px] font-mono" style={{ color: "#F3D37A" }}>
              Click any card to load Before ↔ After pair
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-sm:flex-nowrap max-sm:justify-start max-sm:overflow-x-auto max-sm:snap-x max-sm:pb-2 tayco-no-scrollbar">
              {visiblePairs.map((pair) => {
              const selected = pair.id === pendingPairId || pair.id === activePair.id;
              return (
                <button
                  key={pair.id}
                  type="button"
                  data-magnetic
                  onClick={() => selectPairHarmonized(pair.id)}
                  className="group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer max-sm:w-[40vw] max-sm:shrink-0 max-sm:snap-start w-[calc(50%-0.375rem)] sm:w-[calc(33.333%-0.5rem)] md:w-[calc(25%-0.6rem)] lg:w-[calc(16.666%-0.65rem)]"
                  style={{
                    background: "#0B172A",
                    borderColor: selected ? "#F3D37A" : "rgba(201, 168, 76, 0.25)",
                    boxShadow: selected
                      ? "0 0 0 2px #C9A84C, 0 12px 24px -10px rgba(201, 168, 76, 0.55)"
                      : "none",
                    transform: selected ? "translateY(-2px)" : "none",
                  }}
                >
                  <div className="relative h-20 w-full overflow-hidden">
                    {/* Split thumbnail preview: left half before, right half after */}
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
                    <span
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black"
                      style={{
                        background: selected ? "#C9A84C" : "rgba(7,14,26,0.85)",
                        color: selected ? "#070E1A" : "#F3D37A",
                      }}
                    >
                      {pair.code}
                    </span>
                  </div>
                  <div className="p-2">
                    <div className="text-[11px] font-bold text-white line-clamp-1">
                      {pair.title}
                    </div>
                    <div
                      className="text-[9px] font-mono uppercase tracking-wider mt-0.5 truncate"
                      style={{ color: "#C9A84C" }}
                    >
                      {pair.divisionLabel.replace(/^Div \d+ · /, "")}
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
      title: "Natural Slate Gable & Copper Valley Flashing",
      trade: "Specialty Roofing",
      csi: "DIV 07",
      sector: "Residential",
      image: "/curated/magazine/revista_ro_slate_a.jpg",
    },
    {
      id: "m-sf-2",
      title: "Standing-Seam Architectural Metal Roof System",
      trade: "Roofing Systems",
      csi: "DIV 07",
      sector: "Residential",
      image: "/curated/magazine/revista_ro_metal_a.jpg",
    },
    {
      id: "m-sf-3",
      title: "Insulated Fiber-Cement Lap Siding & Craftsman Trim",
      trade: "Siding & Cladding",
      csi: "DIV 07",
      sector: "Residential",
      image: "/work/siding_residential.jpg",
    },
    {
      id: "m-sf-4",
      title: "Architectural Dimensional Shingle & Gable Roof",
      trade: "Roofing Systems",
      csi: "DIV 07",
      sector: "Residential",
      image: "/work/roofing_residential.jpg",
    },
    {
      id: "m-sf-5",
      title: "Exterior Wall Framing, Window Headers & Ceiling Joists",
      trade: "Rough Carpentry",
      csi: "DIV 06",
      sector: "Residential",
      image: "/curated/magazine/revista_fr_wood_05.jpg",
    },
    {
      id: "m-sf-6",
      title: "Coffered Architectural Ceiling & Recessed Lighting",
      trade: "Interior Finishes",
      csi: "DIV 09",
      sector: "Residential",
      image: "/curated/magazine/revista_in_05_a.jpg",
    },
    {
      id: "m-sf-7",
      title: "Painted Staircase, Oak Handrail & Finish Carpentry",
      trade: "Finish Carpentry",
      csi: "DIV 06",
      sector: "Residential",
      image: "/curated/magazine/revista_ca_finish_1.jpg",
    },
    {
      id: "m-sf-8",
      title: "Natural Stone Veneer & Custom Hearth Masonry",
      trade: "Stone & Masonry",
      csi: "DIV 04",
      sector: "Residential",
      image: "/work/stone_residential.jpg",
    },
  ],
  multifamily: [
    {
      id: "m-mf-1",
      title: "Multi-Unit Architectural Shingle & Dormer Roof System",
      trade: "Roofing Systems",
      csi: "DIV 07",
      sector: "Multi-Family",
      image: "/curated/properties/mkt-mf-roofing.jpg",
    },
    {
      id: "m-mf-2",
      title: "Multi-Story Structural Wood Framing & Floor Trusses",
      trade: "Structural Framing",
      csi: "DIV 06",
      sector: "Multi-Family",
      image: "/curated/properties/mkt-mf-framing-trusses.jpg",
    },
    {
      id: "m-mf-3",
      title: "Reinforced Concrete Podium & Courtyard Hardscape",
      trade: "Concrete & Site",
      csi: "DIV 03",
      sector: "Multi-Family",
      image: "/curated/properties/mkt-mf-concrete-podium.jpg",
    },
    {
      id: "m-mf-4",
      title: "Masonry Entry Piers & Multi-Unit Stone Envelope",
      trade: "Stone & Masonry",
      csi: "DIV 04",
      sector: "Multi-Family",
      image: "/curated/properties/mkt-mf-stone-entry.jpg",
    },
    {
      id: "m-mf-5",
      title: "Fire-Rated Corridor Drywall & Acoustic Assemblies",
      trade: "Drywall Systems",
      csi: "DIV 09",
      sector: "Multi-Family",
      image: "/curated/properties/mkt-mf-drywall.jpg",
    },
    {
      id: "m-mf-6",
      title: "Acoustic Underlayment & Multi-Unit Flooring Package",
      trade: "Flooring Systems",
      csi: "DIV 09",
      sector: "Multi-Family",
      image: "/work/flooring_multifamily.jpg",
    },
    {
      id: "m-mf-7",
      title: "Resident Lounge Millwork & Custom Common-Area Trim",
      trade: "Finish Carpentry",
      csi: "DIV 06",
      sector: "Multi-Family",
      image: "/curated/properties/mkt-mf-carpentry-lounge.jpg",
    },
    {
      id: "m-mf-8",
      title: "Courtyard Stonework & Multi-Unit Landscape Masonry",
      trade: "Stone & Masonry",
      csi: "DIV 04",
      sector: "Multi-Family",
      image: "/curated/properties/mkt-mf-stone-courtyard.jpg",
    },
  ],
  townhomes: [
    {
      id: "m-twn-1",
      title: "Townhome Rooftop Timber Framing & Decking",
      trade: "Wood Framing",
      csi: "DIV 06",
      sector: "Townhomes",
      image: "/curated/properties/mkt-twn-framing-rooftop.jpg",
    },
    {
      id: "m-twn-2",
      title: "Stepped Rowhouse Roofing, Parapets & Siding Envelope",
      trade: "Roofing & Siding",
      csi: "DIV 07",
      sector: "Townhomes",
      image: "/curated/properties/mkt-twn-roofing-siding.jpg",
    },
    {
      id: "m-twn-3",
      title: "2-Hour Fire-Rated Party-Wall & Rowhouse Framing",
      trade: "Structural Framing",
      csi: "DIV 06",
      sector: "Townhomes",
      image: "/curated/properties/mkt-twn-framing-partywall.jpg",
    },
    {
      id: "m-twn-4",
      title: "Brownstone & Cut-Limestone Rowhouse Entry Stoops",
      trade: "Stone & Masonry",
      csi: "DIV 04",
      sector: "Townhomes",
      image: "/curated/properties/mkt-twn-stone-brownstone.jpg",
    },
    {
      id: "m-twn-5",
      title: "Three-Story White-Oak Stair Treads & Balustrade",
      trade: "Finish Carpentry",
      csi: "DIV 06",
      sector: "Townhomes",
      image: "/curated/properties/mkt-twn-flooring-stairtreads.jpg",
    },
    {
      id: "m-twn-6",
      title: "Parlor Herringbone White-Oak Flooring & Trim",
      trade: "Hardwood Flooring",
      csi: "DIV 09",
      sector: "Townhomes",
      image: "/curated/properties/mkt-twn-flooring-herringbone.jpg",
    },
    {
      id: "m-twn-7",
      title: "Townhome Gallery Level-5 Drywall & Revealed Trim",
      trade: "Drywall & Finishes",
      csi: "DIV 09",
      sector: "Townhomes",
      image: "/curated/properties/mkt-twn-drywall-gallery.jpg",
    },
    {
      id: "m-twn-8",
      title: "Rooftop Cedar Pergola & Parlor Library Millwork",
      trade: "Custom Carpentry",
      csi: "DIV 06",
      sector: "Townhomes",
      image: "/curated/properties/mkt-twn-carpentry-pergola.jpg",
    },
  ],
  commercial: [
    ...MARQUEE_TRACK_TOP.filter((s) => s.sector === "Commercial"),
    ...MARQUEE_TRACK_BOTTOM.filter((s) => s.sector === "Commercial"),
  ].slice(0, 8),
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
    <div className="py-12 border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6 flex flex-col items-center justify-center text-center gap-3">
        <div>
          <div className="tayco-atelier-eyebrow justify-center mb-1.5" style={{ color: "#F3D37A" }}>
            <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
            FIELD EXECUTION ARCHIVE · {allShots.length} CURATED DISCIPLINES IN MOTION
          </div>
          <h3 className="tayco-display-title text-xl sm:text-2xl text-white text-center">
            From excavation &amp; steel framing to{" "}
            <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
              architectural millwork.
            </em>
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400 text-center">
          Hover any frame to pause · Click to inspect specification
        </span>
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
        ariaLabel={selectedShot?.title ?? "Architectural Discipline Photograph"}
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
                  <p className="text-xs text-slate-300">Photograph · {selectedShot.csi}</p>
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
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black"
                          style={{ background: "#C9A84C", color: "#070E1A" }}
                        >
                          {selectedShot.csi}
                        </span>
                        <span className="text-xs font-mono text-amber-200">
                          {selectedShot.trade} · {selectedShot.sector}
                        </span>
                      </div>
                      <div className="text-lg font-black text-white mt-1">
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

      {/* Track 1: Exterior / Structural / Envelope */}
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
              <div className="tayco-filmstrip-overlay">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black"
                    style={{ background: "#C9A84C", color: "#070E1A" }}
                  >
                    {shot.csi}
                  </span>
                  <span className="text-[10px] font-mono text-amber-200">
                    {shot.sector}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-snug line-clamp-1">
                    {shot.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-300">
                    {shot.trade} · Click to Expand
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Track 2: Interior Craft / Commercial / Finishes */}
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
              <div className="tayco-filmstrip-overlay">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black"
                    style={{ background: "#F3D37A", color: "#070E1A" }}
                  >
                    {shot.csi}
                  </span>
                  <span className="text-[10px] font-mono text-amber-200">
                    {shot.sector}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-black text-white leading-snug line-clamp-1">
                    {shot.title}
                  </div>
                  <div className="text-[10px] font-mono text-slate-300">
                    {shot.trade} · Click to Expand
                  </div>
                </div>
              </div>
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
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-200/90 mr-1.5">
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
              className="min-h-11 min-w-11 px-2.5 py-2 rounded-full text-xs font-mono font-black transition-colors cursor-pointer border"
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
              {currentHub.corridor} · {currentHub.primaryFocus}
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
    <div className="mb-5">
      {/* Main Triptych Viewport — Clickable to Expand Full-Screen View */}
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
          alt={current.label}
          syncUrls={triptychUrls}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,14,26,0.38) 0%, rgba(7,14,26,0.06) 45%, rgba(7,14,26,0.86) 100%)",
          }}
        />
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span
            className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
            style={{
              background: "rgba(7, 14, 26, 0.84)",
              color: "#F3D37A",
              border: "1px solid rgba(201, 168, 76, 0.45)",
            }}
          >
            {badge}
          </span>
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
            style={{
              background: "rgba(7, 14, 26, 0.8)",
              color: "#E2E8F0",
            }}
          >
            0{activeIdx + 1} / 0{safeFrames.length} · Expand ↗
          </span>
        </div>
        <div
          key={`triptych-label-${triptychPulse}`}
          className="tayco-harmonic-sync absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2"
        >
          <span className="text-xs font-bold text-white truncate">
            {current.label}
          </span>
        </div>
      </div>

      {/* 3-Photo Caption Selector Strip — Centered Capsule Switcher */}
      {safeFrames.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {safeFrames.map((frame, i) => {
            const isSel = i === activeIdx;
            return (
              <button
                key={`${frame.src}-${i}`}
                type="button"
                data-magnetic
                onClick={() => selectTriptychFrame(i)}
                onPointerEnter={() => selectTriptychFrame(i)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono font-bold transition-all cursor-pointer border ${
                  isSel
                    ? "bg-[#C9A84C] text-[#070E1A] border-[#F3D37A] shadow-[0_0_12px_rgba(201,168,76,0.35)]"
                    : "bg-[#070E1A]/80 text-slate-300 border-white/10 hover:border-[#C9A84C]/50 hover:text-white"
                }`}
                aria-label={`Show ${frame.label}`}
              >
                0{i + 1} · {frame.label}
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
              borderColor: "#C9A84C",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72 sm:h-[460px] w-full bg-[#040811]">
              <ProtectedImage
                src={current.src}
                auditIgnore={true}
                alt={current.label}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F3D37A]">
                  {badge} · PHOTO 0{activeIdx + 1} OF 0{safeFrames.length}
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  {current.label}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {safeFrames.map((f, i) => (
                  <button
                    key={f.label}
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
                    0{i + 1} · {f.label}
                  </button>
                ))}
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
