"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ProtectedImage from "@/components/ProtectedImage";

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
    title: "Navy Island Chef's Kitchen, White Quartz & Oak",
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

export interface TransformationPair {
  id: string;
  division: Exclude<TransformationDivision, "all">;
  divisionLabel: string;
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
    code: "TR-03",
    title: "Full-Gut Kitchen Modernization & Quartz Island",
    subtitle: "Dated 1990s oak layout to custom white shaker & quartz centerpiece",
    csiSpec: "CSI 06 41 00 / 12 36 00 · CABINETRY & COUNTERTOPS",
    beforeImg: "/curated/pairs/div03_02_antes.jpg",
    afterImg: "/curated/pairs/div03_02_despues.jpg",
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
    code: "TR-06",
    title: "Custom Built-In Millwork, Coffered Ceiling & Stone Hearth",
    subtitle: "Blank builder-grade wall to architectural living room centerpiece",
    csiSpec: "CSI 06 20 00 / 04 43 00 · MILLWORK & STONE",
    beforeImg: "/curated/pairs/div01_03_antes.jpg",
    afterImg: "/curated/pairs/div01_03_despues.jpg",
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
    code: "TR-09",
    title: "Structural Timber Deck & Staircase Reconstruction",
    subtitle: "Rotted unsafe backyard deck to code-compliant cedar deck system",
    csiSpec: "CSI 06 15 00 · WOOD DECKING & STRUCTURAL FRAMING",
    beforeImg: "/curated/pairs/div01_02_antes.jpg",
    afterImg: "/curated/pairs/div01_02_despues.jpg",
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
    code: "TR-10",
    title: "Commercial Storefront Mansard Standing-Seam Re-Roof",
    subtitle: "Corroded metal mansard & failing gutters to architectural bronze panels",
    csiSpec: "CSI 07 41 13 / 07 71 00 · METAL ROOF & COPING",
    beforeImg: "/curated/pairs/div04_04_antes.jpg",
    afterImg: "/curated/pairs/div04_04_despues.jpg",
    beforeTag: "01 / Rusted Commercial Mansard Facade",
    afterTag: "02 / Bronze Standing-Seam Mansard & Trim",
    summary:
      "High-visibility commercial facade rehabilitation replacing corroded mansard panels and sagging gutters with Kynar-finished bronze standing-seam panels and commercial box gutters.",
    highlights: ["Kynar-coated architectural bronze metal", "Seamless commercial gutter & downspouts", "Boom-lift staged zero-disruption execution"],
  },
  {
    id: "div02_04",
    division: "div02",
    divisionLabel: "Div 02 · Exterior & Masonry",
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
    code: "TR-12",
    title: "Raw CMU Basement to Finished Living Suite & LVP",
    subtitle: "Unfinished concrete block lower level to warm turnkey living space",
    csiSpec: "CSI 09 29 00 / 09 65 00 · BASEMENT TURNKEY BUILD",
    beforeImg: "/curated/pairs/div03_04_antes.jpg",
    afterImg: "/curated/pairs/div03_04_despues.jpg",
    beforeTag: "01 / Unfinished CMU Block Basement",
    afterTag: "02 / Insulated Walls, Recessed LEDs & LVP",
    summary:
      "Full lower-level conversion featuring moisture-mitigated perimeter framing, closed-cell insulation, smooth drywall ceiling with recessed LED lighting and waterproof luxury vinyl plank.",
    highlights: ["Perimeter moisture barrier & framing", "Low-profile recessed LED grid", "Waterproof wide-plank LVP flooring"],
  },
];

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
    title: "Multi-Family Structural Timber & OSB Decking",
    trade: "Wood Framing",
    csi: "DIV 06",
    sector: "Multi-Family",
    image: "/work/framing_multifamily.jpg",
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
    image: "/curated/magazine/revista_ro_slate_a.jpg",
  },
  {
    id: "m-top-6",
    title: "Architectural Rainscreen Siding & Trim Envelope",
    trade: "Siding & Cladding",
    csi: "DIV 07",
    sector: "Multi-Family",
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
    title: "Commercial Interior Steel Stud Partition Layout",
    trade: "Interior Framing",
    csi: "DIV 09",
    sector: "Commercial",
    image: "/work/framing_commercial.jpg",
  },
  {
    id: "m-bot-2",
    title: "Custom Residential Timber Roof Rafters & Framing",
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
    title: "Geometric White-Oak Feature Wall & Millwork",
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
    image: "/work/flooring/polished-concrete_2.jpg",
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
    sampleImage: "/curated/hero/com-hq-sunset.jpg",
  },
  {
    state: "IL",
    name: "Illinois",
    corridor: "Chicagoland · Rockford · Naperville",
    primaryFocus: "Commercial Tenant Improvements, Multi-Family CapEx & Restoration",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/hero/com-dusk-steel.jpg",
  },
  {
    state: "IA",
    name: "Iowa",
    corridor: "Des Moines · Cedar Rapids · Davenport",
    primaryFocus: "Storm Recovery, Standing-Seam Roofing & Turnkey Remodeling",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/hero/res-farmhouse-metal.jpg",
  },
  {
    state: "IN",
    name: "Indiana",
    corridor: "Indianapolis · Fort Wayne · NW Corridor",
    primaryFocus: "Industrial Envelopes, TPO Flat Roofing & Interior Build-Outs",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/hero/com-framing-atrium.jpg",
  },
  {
    state: "MN",
    name: "Minnesota",
    corridor: "Twin Cities Metro · Rochester · Duluth",
    primaryFocus: "Cold-Climate Building Envelopes, Siding & Fire/Water Recovery",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/hero/res-cedar-deck-home.jpg",
  },
  {
    state: "MI",
    name: "Michigan",
    corridor: "Grand Rapids · Detroit Metro · Lansing",
    primaryFocus: "Multi-Family Renovations, Carpentry & Masonry Restoration",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/capabilities/mf-apartments-4story.jpg",
  },
  {
    state: "MO",
    name: "Missouri",
    corridor: "St. Louis · Kansas City · Columbia",
    primaryFocus: "Commercial Plazas, REO Asset Preservation & Structural Framing",
    mobilization: "Regional Crew Hub",
    sampleImage: "/curated/hero/com-plaza-stone.jpg",
  },
  {
    state: "TX",
    name: "Texas",
    corridor: "Dallas–Fort Worth · Houston · Austin",
    primaryFocus: "Ground-Up Commercial, Multi-Family Turnovers & Large-Loss Recovery",
    mobilization: "South Central Hub",
    sampleImage: "/curated/hero/com-lobby-limestone.jpg",
  },
];

/* ─────────────────────────────────────────────────────────────
 * 1. INTERACTIVE BEFORE / AFTER & STRUCTURAL X-RAY STUDIO
 * ───────────────────────────────────────────────────────────── */
export function TransformationBeforeAfterStudio({
  initialDivision = "all",
  initialPairId = TRANSFORMATION_PAIRS[0].id,
  eyebrowLabel = "01B / INTERACTIVE BEFORE & AFTER TRANSFORMATION STUDIO",
}: {
  initialDivision?: TransformationDivision;
  initialPairId?: string;
  eyebrowLabel?: string;
} = {}) {
  const [activeDivision, setActiveDivision] = useState<TransformationDivision>(initialDivision);
  const [selectedId, setSelectedId] = useState<string>(initialPairId);
  const [inspectMode, setInspectMode] = useState<"split" | "xray">("split");
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [xrayPos, setXrayPos] = useState<{ x: number; y: number }>({ x: 52, y: 48 });
  const stageRef = useRef<HTMLDivElement | null>(null);

  const visiblePairs =
    activeDivision === "all"
      ? TRANSFORMATION_PAIRS
      : TRANSFORMATION_PAIRS.filter((p) => p.division === activeDivision);

  const activePair =
    visiblePairs.find((p) => p.id === selectedId) ?? visiblePairs[0] ?? TRANSFORMATION_PAIRS[0];

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
      className="py-16 sm:py-24 px-4 sm:px-8 relative z-10 border-t"
      style={{
        background:
          "radial-gradient(circle at 82% 16%, rgba(201, 168, 76, 0.14), transparent 50%), radial-gradient(circle at 14% 85%, rgba(27, 58, 107, 0.48), transparent 58%), #070E1A",
        borderColor: "rgba(201, 168, 76, 0.28)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Top Eyebrow Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-8 border-b border-white/10">
          <span className="tayco-eyebrow" style={{ color: "#F3D37A" }}>
            <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
            {eyebrowLabel}
          </span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-300">
            12 PIXEL-LOCKED FIELD TRANSFORMATIONS · 50/50 CURTAIN + X-RAY LOUPE
          </span>
        </div>

        {/* Heading + Division Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <h2
              className="font-black text-white tracking-tight"
              style={{ fontSize: "clamp(2rem, 4.2vw, 3.4rem)", lineHeight: 1.04 }}
            >
              From raw condition to{" "}
              <em className="tayco-serif-em" style={{ color: "#F3D37A" }}>
                finished execution.
              </em>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-3 max-w-2xl leading-relaxed">
              Slide the 50/50 comparison curtain or switch to{" "}
              <span className="font-mono font-bold" style={{ color: "#F3D37A" }}>
                Structural X-Ray Lens
              </span>{" "}
              to inspect the underlying framing, substrate preparation and final turnkey finish across four core divisions.
            </p>
          </div>

          {/* Division Tabs */}
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Filter transformations by division"
          >
            {[
              { id: "all", label: "All Divisions", count: 12 },
              { id: "div01", label: "Structural & Millwork", count: 3 },
              { id: "div02", label: "Exterior & Masonry", count: 3 },
              { id: "div03", label: "Interior & Commercial", count: 3 },
              { id: "div04", label: "Roofing Systems", count: 3 },
            ].map((tab) => {
              const active = activeDivision === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    const nextDiv = tab.id as TransformationDivision;
                    setActiveDivision(nextDiv);
                    const nextList =
                      nextDiv === "all"
                        ? TRANSFORMATION_PAIRS
                        : TRANSFORMATION_PAIRS.filter((p) => p.division === nextDiv);
                    if (nextList.length > 0 && !nextList.some((p) => p.id === selectedId)) {
                      setSelectedId(nextList[0].id);
                    }
                  }}
                  className="px-3.5 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer border"
                  style={{
                    background: active ? "#C9A84C" : "rgba(15, 32, 64, 0.72)",
                    color: active ? "#070E1A" : "#E2E8F0",
                    borderColor: active ? "#F3D37A" : "rgba(201, 168, 76, 0.32)",
                  }}
                >
                  {tab.label}{" "}
                  <span className="opacity-75 text-[10px]">({tab.count})</span>
                </button>
              );
            })}
          </div>
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
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
              />

              {/* Overlay Layer: BEFORE (Initial / Raw Structural Condition) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={activePair.beforeImg}
                alt={`${activePair.title} — Before`}
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

              {/* Bottom Telemetry HUD Bar */}
              <div
                className="absolute bottom-0 inset-x-0 z-20 px-4 py-3 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md border-t"
                style={{
                  background: "linear-gradient(180deg, rgba(7,14,26,0.45) 0%, rgba(7,14,26,0.92) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.3)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-black"
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
                    ? `CURTAIN POSITION: ${splitPercent}% BEFORE / ${100 - splitPercent}% AFTER`
                    : `X-RAY LOUPE: X=${xrayPos.x}% · Y=${xrayPos.y}%`}
                </span>
              </div>
            </div>

            {/* Interactive Control Strip Under Stage */}
            <div
              className="mt-3 p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3"
              style={{
                background: "rgba(15, 32, 64, 0.72)",
                borderColor: "rgba(201, 168, 76, 0.32)",
              }}
            >
              {/* Mode Switcher: 50/50 Curtain vs Structural X-Ray Lens */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectMode("split")}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer"
                  style={{
                    background: inspectMode === "split" ? "#C9A84C" : "rgba(7, 14, 26, 0.65)",
                    color: inspectMode === "split" ? "#070E1A" : "#E2E8F0",
                    borderColor: inspectMode === "split" ? "#F3D37A" : "rgba(201, 168, 76, 0.35)",
                  }}
                >
                  ↔ 50/50 Drag Curtain
                </button>
                <button
                  type="button"
                  onClick={() => setInspectMode("xray")}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer"
                  style={{
                    background: inspectMode === "xray" ? "#C9A84C" : "rgba(7, 14, 26, 0.65)",
                    color: inspectMode === "xray" ? "#070E1A" : "#E2E8F0",
                    borderColor: inspectMode === "xray" ? "#F3D37A" : "rgba(201, 168, 76, 0.35)",
                  }}
                >
                  ◎ Structural X-Ray Loupe
                </button>
              </div>

              {/* Quick Curtain Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mr-1">
                  Quick Snap:
                </span>
                {[
                  { label: "Raw (100% Before)", val: 96 },
                  { label: "50 / 50 Split", val: 50 },
                  { label: "Finished (100% After)", val: 4 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setInspectMode("split");
                      setSplitPercent(preset.val);
                    }}
                    className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold border transition-colors cursor-pointer hover:text-white"
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

          {/* Right 4 Columns: Active Transformation Specification & Highlights */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <div
              className="p-6 rounded-2xl border h-full flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(155deg, rgba(15, 32, 64, 0.9) 0%, rgba(7, 14, 26, 0.96) 100%)",
                borderColor: "rgba(201, 168, 76, 0.38)",
              }}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
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

                <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {activePair.title}
                </h3>
                <p
                  className="text-xs font-mono font-bold uppercase tracking-wider mt-1.5"
                  style={{ color: "#C9A84C" }}
                >
                  {activePair.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
                  {activePair.summary}
                </p>

                <div className="mt-5 pt-4 border-t border-white/10">
                  <div
                    className="text-[10px] font-mono font-bold uppercase tracking-widest mb-2.5"
                    style={{ color: "#F3D37A" }}
                  >
                    Verified Field Execution Scope
                  </div>
                  <ul className="space-y-2">
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
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 space-y-2.5">
                <Link
                  href="/estimate"
                  data-magnetic
                  className="flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-transform hover:scale-[1.02]"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  <span>Request Estimate for Similar Scope</span>
                  <span>→</span>
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/commercial"
                    className="px-3 py-2 rounded-xl text-[11px] font-bold text-center text-white border hover:bg-white/10 transition-colors"
                    style={{ borderColor: "rgba(201, 168, 76, 0.4)" }}
                  >
                    Commercial Scope →
                  </Link>
                  <Link
                    href="/residential"
                    className="px-3 py-2 rounded-xl text-[11px] font-bold text-center text-white border hover:bg-white/10 transition-colors"
                    style={{ borderColor: "rgba(201, 168, 76, 0.4)" }}
                  >
                    Residential Scope →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 12-Pair Thumbnail Filmstrip Selector */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Select a transformation case study ({visiblePairs.length} available in current filter):
            </span>
            <span className="text-[11px] font-mono" style={{ color: "#F3D37A" }}>
              Click any card to load Before ↔ After pair
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visiblePairs.map((pair) => {
              const selected = pair.id === activePair.id;
              return (
                <button
                  key={pair.id}
                  type="button"
                  onClick={() => setSelectedId(pair.id)}
                  className="group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer"
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
                      alt={pair.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <ProtectedImage
                      src={pair.beforeImg}
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
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-black"
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
export function DualTrackArchitecturalMarquee() {
  const [selectedShot, setSelectedShot] = useState<MarqueeShot | null>(null);

  return (
    <div className="py-12 border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="tayco-eyebrow mb-1.5" style={{ color: "#F3D37A" }}>
            <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
            FIELD EXECUTION ARCHIVE · 16 CURATED DISCIPLINES IN MOTION
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">
            From excavation &amp; steel framing to{" "}
            <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
              architectural millwork.
            </em>
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Hover any frame to pause · Click to inspect specification
        </span>
      </div>

      {/* Selected Shot Quick Inspector Drawer */}
      {selectedShot && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mb-6">
          <div
            className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{
              background: "rgba(15, 32, 64, 0.92)",
              borderColor: "#C9A84C",
            }}
          >
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={selectedShot.image}
                alt={selectedShot.title}
                className="w-28 h-20 object-cover rounded-xl border"
                style={{ borderColor: "#F3D37A" }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-black"
                    style={{ background: "#C9A84C", color: "#070E1A" }}
                  >
                    {selectedShot.csi}
                  </span>
                  <span className="text-xs font-mono text-amber-200">
                    {selectedShot.trade} · {selectedShot.sector}
                  </span>
                </div>
                <div className="text-base font-black text-white mt-1">
                  {selectedShot.title}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/estimate"
                className="px-4 py-2 rounded-xl text-xs font-black"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                Request Trade Scope →
              </Link>
              <button
                type="button"
                onClick={() => setSelectedShot(null)}
                className="px-3 py-2 rounded-xl text-xs font-mono text-slate-300 border border-white/20 hover:text-white cursor-pointer"
              >
                Close ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Track 1: Exterior / Structural / Envelope */}
      <div className="tayco-filmstrip-wrapper mb-4">
        <div className="tayco-filmstrip-track track-left">
          {[...MARQUEE_TRACK_TOP, ...MARQUEE_TRACK_TOP].map((shot, idx) => (
            <button
              key={`${shot.id}-${idx}`}
              type="button"
              onClick={() => setSelectedShot(shot)}
              className="tayco-filmstrip-card group text-left cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={shot.image}
                alt={shot.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              />
              <div className="tayco-filmstrip-overlay">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-mono font-black"
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
                    {shot.trade}
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
          {[...MARQUEE_TRACK_BOTTOM, ...MARQUEE_TRACK_BOTTOM].map((shot, idx) => (
            <button
              key={`${shot.id}-${idx}`}
              type="button"
              onClick={() => setSelectedShot(shot)}
              className="tayco-filmstrip-card group text-left cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProtectedImage
                src={shot.image}
                alt={shot.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
              />
              <div className="tayco-filmstrip-overlay">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[9px] font-mono font-black"
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
                    {shot.trade}
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
  const [activeState, setActiveState] = useState<string>("WI");
  const currentHub =
    REGIONAL_STATE_HUBS.find((h) => h.state === activeState) ?? REGIONAL_STATE_HUBS[0];

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveState((prev) => {
        const idx = REGIONAL_STATE_HUBS.findIndex((h) => h.state === prev);
        return REGIONAL_STATE_HUBS[(idx + 1) % REGIONAL_STATE_HUBS.length].state;
      });
    }, 6500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className="mt-5 pt-4 border-t border-white/15 flex flex-col lg:flex-row items-center justify-between gap-4"
      aria-label="Interactive 8-State Service Footprint"
    >
      <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-200/90 mr-1.5">
          8-State Dispatch:
        </span>
        {REGIONAL_STATE_HUBS.map((hub) => {
          const selected = hub.state === activeState;
          return (
            <button
              key={hub.state}
              type="button"
              onClick={() => setActiveState(hub.state)}
              onPointerEnter={() => setActiveState(hub.state)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-black transition-all cursor-pointer border"
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
      </div>

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
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
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
  const safeFrames = frames.length > 0 ? frames : [{ src: "/curated/hero/com-lobby-limestone.jpg", label: "Field Execution" }];
  const current = safeFrames[activeIdx] ?? safeFrames[0];

  return (
    <div className="mb-5">
      {/* Main Triptych Viewport */}
      <div
        className="relative w-full overflow-hidden rounded-xl border shadow-md group"
        style={{
          aspectRatio: "16 / 9",
          borderColor: "rgba(15, 32, 64, 0.16)",
          background: "#070E1A",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <ProtectedImage
          src={current.src}
          alt={current.label}
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
            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
            style={{
              background: "rgba(7, 14, 26, 0.8)",
              color: "#E2E8F0",
            }}
          >
            0{activeIdx + 1} / 0{safeFrames.length}
          </span>
        </div>
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white truncate">
            {current.label}
          </span>
        </div>
      </div>

      {/* 3-Thumbnail Triptych Selector Strip */}
      {safeFrames.length > 1 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {safeFrames.map((frame, i) => {
            const isSel = i === activeIdx;
            return (
              <button
                key={`${frame.src}-${i}`}
                type="button"
                onClick={() => setActiveIdx(i)}
                className="relative overflow-hidden rounded-lg border text-left transition-all cursor-pointer group"
                style={{
                  height: "46px",
                  borderColor: isSel ? accentColor : "rgba(15, 32, 64, 0.16)",
                  boxShadow: isSel ? "0 0 0 1px rgba(201, 168, 76, 0.45)" : "none",
                }}
                aria-label={`Show ${frame.label}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <ProtectedImage
                  src={frame.src}
                  alt={frame.label}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 flex items-end p-1.5"
                  style={{
                    background: isSel
                      ? "linear-gradient(180deg, rgba(7,14,26,0.05) 0%, rgba(7,14,26,0.75) 100%)"
                      : "rgba(7, 14, 26, 0.35)",
                  }}
                >
                  <span className="text-[9px] font-mono font-bold text-white truncate">
                    0{i + 1} · {frame.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
