import type { TriptychFrame } from "@/components/LandingLivingShowcase";

export type PropertyCategorySlug =
  | "single-family"
  | "duplexes"
  | "townhouses"
  | "commercial";

export interface PropertyListing {
  id: string;
  code: string;
  category: PropertyCategorySlug;
  title: string;
  subtitle: string;
  location: string;
  stateCode: "WI" | "IL" | "IA" | "IN" | "MN" | "MI" | "MO" | "TX";
  sqft: string;
  configuration: string;
  availability: "Available · Move-In Ready" | "Available · Turnkey Delivery" | "Available · Multiple Units";
  yearDelivered: string;
  csiScope: string;
  summary: string;
  highlights: [string, string, string];
  triptych: [TriptychFrame, TriptychFrame, TriptychFrame];
}

export interface PropertyCategoryMeta {
  slug: PropertyCategorySlug;
  order: string;
  label: string;
  shortLabel: string;
  eyebrow: string;
  headline: string;
  serifAccent: string;
  subtitle: string;
  description: string;
  heroImage: string;
  secondaryImages: [string, string];
  totalAvailableBadge: string;
  typicalSqftRange: string;
  typicalConfigLabel: string;
  csiDivisions: string;
  accentColor: string;
  ctaLabel: string;
}

export type MarketSpecialtyId =
  | "roofing"
  | "siding"
  | "framing"
  | "drywall"
  | "flooring"
  | "concrete"
  | "stone"
  | "carpentry";

export type MarketSpecialtyGroup = "envelope" | "structural" | "interiors";

export interface MarketSpecialtyService {
  id: string;
  code: string;
  market: PropertyCategorySlug;
  specialtyId: MarketSpecialtyId;
  specialtyGroup: MarketSpecialtyGroup;
  specialtyLabel: string;
  title: string;
  subtitle: string;
  csiDivision: string;
  summary: string;
  deliverables: [string, string, string];
  triptych: [TriptychFrame, TriptychFrame, TriptychFrame];
}

export const PROPERTY_CATEGORIES: readonly PropertyCategoryMeta[] = [
  {
    slug: "single-family",
    order: "01",
    label: "Single-Family Homes",
    shortLabel: "Single-Family Homes",
    eyebrow: "MARKET 01 · DETACHED SINGLE-FAMILY HOMES",
    headline: "Single-Family Homes",
    serifAccent: "Services & Projects.",
    subtitle:
      "Roofing, Siding, Framing, Drywall, Flooring, Concrete, Stone & Custom Carpentry for Single-Family Residences.",
    description:
      "Explore every construction specialty TAYCO delivers for single-family homes—from architectural shingle and standing-seam metal roofing, fiber-cement and cedar siding, and structural framing to drywall, hardwood flooring, concrete patios, stone hearths and custom kitchens—followed by our gallery of completed single-family residences.",
    heroImage: "/curated/hero/res-farmhouse-metal.jpg",
    secondaryImages: [
      "/curated/properties/interior-singlefamily-greatroom-stone.jpg",
      "/curated/hero/res-estate-roofing.jpg",
    ],
    totalAvailableBadge: "8 Specialties · 6 Homes",
    typicalSqftRange: "2,650 – 4,400 Sq. Ft.",
    typicalConfigLabel: "Roofing · Siding · Framing · Drywall · Flooring · Concrete · Stone",
    csiDivisions: "CSI DIV 03 · 04 · 06 · 07 · 08 · 09",
    accentColor: "#B32B2B",
    ctaLabel: "Explore Single-Family Services & Projects",
  },
  {
    slug: "duplexes",
    order: "02",
    label: "Multifamily",
    shortLabel: "Multifamily",
    eyebrow: "MARKET 02 · MULTIFAMILY & MULTI-UNIT BUILDINGS",
    headline: "Multifamily",
    serifAccent: "Services & Projects.",
    subtitle:
      "Roofing, Siding, Framing, Drywall, Flooring, Concrete, Stone & Unit Finishes for Multifamily Developments.",
    description:
      "Explore TAYCO's full construction capabilities for multifamily buildings, duplexes and multi-unit residential complexes—including multi-ridge roofing systems, masonry and fiber-cement envelopes, multi-story timber framing, acoustic STC-rated corridor drywall, durable LVT and concrete flooring, courtyard flatwork and turnkey unit interiors.",
    heroImage: "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg",
    secondaryImages: [
      "/curated/properties/mkt-mf-roofing.jpg",
      "/curated/properties/mkt-mf-drywall.jpg",
    ],
    totalAvailableBadge: "8 Specialties · 6 Projects",
    typicalSqftRange: "3,600 – 45,000+ Sq. Ft.",
    typicalConfigLabel: "Roofing · Siding · Framing · Drywall · Flooring · Concrete · Stone",
    csiDivisions: "CSI DIV 03 · 04 · 06 · 07 · 08 · 09",
    accentColor: "#B32B2B",
    ctaLabel: "Explore Multifamily Services & Projects",
  },
  {
    slug: "townhouses",
    order: "03",
    label: "Townhomes",
    shortLabel: "Townhomes",
    eyebrow: "MARKET 03 · ATTACHED TOWNHOMES & ROWHOUSES",
    headline: "Townhomes",
    serifAccent: "Services & Projects.",
    subtitle:
      "Roofing, Siding, Framing, Drywall, Flooring, Concrete, Stone & Custom Millwork for Attached Townhome Communities.",
    description:
      "Browse TAYCO's dedicated townhome construction services—featuring mansard, flat-deck and multi-gable townhome roofing, brick and cedar bay-window facades, UL fire-rated party-wall framing and drywall, three-story white-oak stair and flooring packages, concrete stoops and rooftop terraces, and parlor-level kitchens.",
    heroImage: "/curated/capabilities/mf-townhomes-row.jpg",
    secondaryImages: [
      "/curated/properties/mkt-twn-roofing-siding.jpg",
      "/curated/properties/interior-townhouse-living-bay.jpg",
    ],
    totalAvailableBadge: "8 Specialties · 6 Row Developments",
    typicalSqftRange: "2,250 – 3,300 Sq. Ft. / Unit",
    typicalConfigLabel: "Roofing · Siding · Framing · Drywall · Flooring · Concrete · Stone",
    csiDivisions: "CSI DIV 03 · 04 · 06 · 07 · 08 · 09",
    accentColor: "#B32B2B",
    ctaLabel: "Explore Townhome Services & Projects",
  },
  {
    slug: "commercial",
    order: "04",
    label: "Commercial",
    shortLabel: "Commercial",
    eyebrow: "MARKET 04 · COMMERCIAL, OFFICE, RETAIL & INDUSTRIAL",
    headline: "Commercial",
    serifAccent: "Services & Projects.",
    subtitle:
      "Commercial Roofing, Cladding, Structural Steel Framing, Commercial Drywall, Flooring, Concrete, Stone & Tenant Buildouts.",
    description:
      "Discover all commercial construction specialties delivered by TAYCO—including commercial TPO and standing-seam roofing, aluminum curtain-wall and metal panel siding, structural steel and heavy-gauge metal stud framing, acoustical ceilings and commercial drywall, terrazzo and polished concrete flooring, structural plaza flatwork and stone masonry.",
    heroImage: "/curated/hero/com-hq-sunset.jpg",
    secondaryImages: [
      "/curated/properties/mkt-com-roofing-tpo.jpg",
      "/curated/properties/mkt-com-drywall-ceilings.jpg",
    ],
    totalAvailableBadge: "8 Specialties · 6 Facilities",
    typicalSqftRange: "14,500 – 64,000 Sq. Ft.",
    typicalConfigLabel: "Commercial Roofing · Framing · Drywall · Flooring · Concrete · Stone",
    csiDivisions: "CSI DIV 03 · 04 · 05 · 07 · 08 · 09 · 26",
    accentColor: "#B32B2B",
    ctaLabel: "Explore Commercial Services & Projects",
  },
] as const;

export const PROPERTY_LISTINGS: readonly PropertyListing[] = [
  // ── 01 / SINGLE-FAMILY HOMES (6 PROPERTIES) ──
  {
    id: "sfh-101",
    code: "SFH-101",
    category: "single-family",
    title: "The White Oak Modern Farmhouse",
    subtitle: "Detached Single-Family Residence · Board-and-Batten & Standing-Seam Metal Roof",
    location: "Madison, WI",
    stateCode: "WI",
    sqft: "3,480 Sq. Ft.",
    configuration: "4 Beds · 3.5 Baths · 2-Car Garage",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 06 · 07 · 09",
    summary:
      "Two-story detached modern farmhouse featuring vertical fiber-cement board-and-batten siding, black standing-seam metal roof accents, a navy-island chef's kitchen with quartz countertops and a coffered-ceiling great room with stone hearth.",
    highlights: [
      "Standing-seam metal & architectural shingle roof system",
      "Custom navy island kitchen with waterfall quartz & white-oak floors",
      "Coffered living room ceiling with built-in cabinetry & stone fireplace",
    ],
    triptych: [
      {
        src: "/curated/hero/res-farmhouse-metal.jpg",
        label: "Board-and-Batten Farmhouse & Standing-Seam Roof",
      },
      {
        src: "/curated/properties/interior-singlefamily-greatroom-stone.jpg",
        label: "Step Inside: Stone Hearth Great Room & Porch View",
      },
      {
        src: "/curated/hero/res-navy-kitchen.jpg",
        label: "Navy Island Chef's Kitchen & Quartz Countertops",
      },
    ],
  },
  {
    id: "sfh-102",
    code: "SFH-102",
    category: "single-family",
    title: "The Cedar Ridge Executive Residence",
    subtitle: "Custom Single-Family Home · Natural Cedar Siding & Finished Lower-Level Suite",
    location: "Naperville, IL",
    stateCode: "IL",
    sqft: "4,120 Sq. Ft.",
    configuration: "5 Beds · 4 Baths · Finished Basement",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 06 · 07 · 08 · 09",
    summary:
      "Executive single-family residence crafted with warm natural cedar and charcoal lap siding, expansive wrap-around timber decking, a white shaker chef's kitchen and a fully finished lower-level media and entertainment suite.",
    highlights: [
      "Natural cedar & charcoal architectural siding with wrap deck",
      "Custom white shaker kitchen with oversized quartz island",
      "Finished lower-level media lounge with custom built-in millwork",
    ],
    triptych: [
      {
        src: "/curated/hero/res-cedar-deck-home.jpg",
        label: "Natural Cedar & Charcoal Custom Single-Family Home",
      },
      {
        src: "/curated/pairs/div03_02_despues.jpg",
        label: "Custom White Shaker Kitchen & Waterfall Island",
      },
      {
        src: "/curated/capabilities/res-basement-media.jpg",
        label: "Finished Lower-Level Media & Entertainment Suite",
      },
    ],
  },
  {
    id: "sfh-103",
    code: "SFH-103",
    category: "single-family",
    title: "The Highland Gable Estate",
    subtitle: "Detached Single-Family Estate · Architectural Gable Roof & Custom Millwork",
    location: "Austin, TX",
    stateCode: "TX",
    sqft: "3,890 Sq. Ft.",
    configuration: "4 Beds · 4 Baths · Study & Covered Patio",
    availability: "Available · Turnkey Delivery",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09",
    summary:
      "Stately detached single-family residence with high-pitch architectural shingle gables, masonry chimney detailing, custom living-room bookcases and solid white-oak stair carpentry.",
    highlights: [
      "High-pitch storm-rated architectural shingle roof & copper flashing",
      "Floor-to-ceiling custom built-in bookcases & stone fireplace mantel",
      "Hand-finished white-oak stair treads, risers & balustrade",
    ],
    triptych: [
      {
        src: "/curated/hero/res-estate-roofing.jpg",
        label: "Architectural Gable Roof, Stone & Masonry Chimney",
      },
      {
        src: "/curated/pairs/div01_03_despues.jpg",
        label: "Built-In Bookcases, Fireplace Mantel & Oak Beams",
      },
      {
        src: "/curated/residential/div01_05_despues.jpg",
        label: "Custom White-Oak Staircase & Balustrade",
      },
    ],
  },
  {
    id: "sfh-104",
    code: "SFH-104",
    category: "single-family",
    title: "The Timberline Outdoor-Living House",
    subtitle: "Single-Family Home · Multi-Tier Timber Deck & Open-Concept Interior",
    location: "Minneapolis, MN",
    stateCode: "MN",
    sqft: "3,240 Sq. Ft.",
    configuration: "4 Beds · 3 Baths · Multi-Tier Deck",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 03 · 06 · 07 · 09",
    summary:
      "Designed for indoor-outdoor living, this detached single-family house combines a two-story multi-tier structural timber deck and broom-finished concrete patio with an open-concept hardwood kitchen and dining floor plan.",
    highlights: [
      "Engineered multi-tier timber deck with integrated stair lighting",
      "Open-concept kitchen, hardwood flooring & recessed LED grid",
      "Broom-finished concrete patio, walkways & landscaped perimeter",
    ],
    triptych: [
      {
        src: "/curated/hero/res-multitier-deck.jpg",
        label: "Two-Story Single-Family Home & Multi-Tier Timber Deck",
      },
      {
        src: "/curated/residential/div01_08_despues.jpg",
        label: "Open-Concept Kitchen, Hardwood Floors & Recessed Lighting",
      },
      {
        src: "/curated/residential/div01_07_despues.jpg",
        label: "Private Rear Concrete Patio & Landscaped Yard",
      },
    ],
  },
  {
    id: "sfh-105",
    code: "SFH-105",
    category: "single-family",
    title: "The Heritage Board-and-Batten House",
    subtitle: "Detached Single-Family Home · Crisp White Envelope & Inset Cabinetry",
    location: "Ann Arbor, MI",
    stateCode: "MI",
    sqft: "2,960 Sq. Ft.",
    configuration: "4 Beds · 2.5 Baths · Covered Front Porch",
    availability: "Available · Turnkey Delivery",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 06 · 07 · 08 · 09",
    summary:
      "Classic detached single-family home completely finished with crisp white board-and-batten siding, black-frame low-E windows, custom inset kitchen cabinetry and a new dimensional shingle roof.",
    highlights: [
      "Full exterior fiber-cement board-and-batten siding & trim package",
      "Bespoke inset kitchen cabinetry with stone countertops",
      "Complete ice-and-water shield & dimensional shingle roof system",
    ],
    triptych: [
      {
        src: "/curated/pairs/div02_02_despues.jpg",
        label: "Crisp White Board-and-Batten Single-Family Elevation",
      },
      {
        src: "/curated/magazine/revista_ca_cab_1.jpg",
        label: "Custom Inset Cabinetry & Stone Countertops",
      },
      {
        src: "/curated/residential/r3.jpg",
        label: "Architectural Dimensional Shingle Roof System",
      },
    ],
  },
  {
    id: "sfh-106",
    code: "SFH-106",
    category: "single-family",
    title: "The Lakefront Craftsman Residence",
    subtitle: "Single-Family Residence · Fiber-Cement Lap Siding & Wide-Plank Oak",
    location: "Milwaukee, WI",
    stateCode: "WI",
    sqft: "3,610 Sq. Ft.",
    configuration: "4 Beds · 3.5 Baths · Sunroom & mudroom",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 06 · 07 · 08 · 09",
    summary:
      "Turnkey single-family residence featuring weather-resistant fiber-cement lap siding, black architectural casement windows and wide-plank white-oak flooring across the main living and sunroom levels.",
    highlights: [
      "Insulated fiber-cement lap siding & custom craftsman exterior trim",
      "Energy-efficient black-frame architectural window package",
      "Wide-plank hardwood flooring & level-5 smooth drywall interiors",
    ],
    triptych: [
      {
        src: "/curated/residential/s1.jpg",
        label: "Fiber-Cement Lap Siding & Custom Trim Envelope",
      },
      {
        src: "/curated/residential/div01_04_despues.jpg",
        label: "Black-Frame Architectural Window & Trim Package",
      },
      {
        src: "/curated/pairs/div03_04_despues.jpg",
        label: "Refinished Wide-Plank Hardwood & Sunroom Suite",
      },
    ],
  },

  // ── 02 / DUPLEXES (6 PROPERTIES) ──
  {
    id: "dpx-201",
    code: "DPX-201",
    category: "duplexes",
    title: "The Harborview Brick & Cedar Stepped Duplex",
    subtitle: "Asymmetric Two-Wing Residence · 2-Story Brick Colonial + 1.5-Story Cedar Wing",
    location: "Milwaukee, WI",
    stateCode: "WI",
    sqft: "3,640 Sq. Ft. Total",
    configuration: "2 Units · 3 Beds / 2.5 Baths Each",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09 · 26",
    summary:
      "Turnkey stepped-volume duplex designed with a two-story red-brick primary wing and classical portico on the left, paired with a recessed 1.5-story natural cedar dormer residence and private driveway garage on the right.",
    highlights: [
      "Asymmetric two-wing massing: 2-story brick colonial + 1.5-story cedar wing",
      "Sound-isolated STC-60 party wall & independent 200A electrical panels",
      "Custom white shaker & quartz island kitchens in both residences",
    ],
    triptych: [
      {
        src: "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg",
        label: "Curbside 2-Story Brick & 1.5-Story Cedar Duplex",
      },
      {
        src: "/curated/properties/interior-duplex-brick-living.jpg",
        label: "Step Inside: Great Room & Brick Porch Sightline",
      },
      {
        src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
        label: "Chef's Kitchen, Waterfall Island & Brick Window View",
      },
    ],
  },
  {
    id: "dpx-202",
    code: "DPX-202",
    category: "duplexes",
    title: "The Oakwood Limestone & Stucco Offset Duplex",
    subtitle: "Contemporary Offset-Volume Duplex · Forward Limestone Cube + Recessed Garage Wing",
    location: "Madison, WI",
    stateCode: "WI",
    sqft: "3,880 Sq. Ft. Total",
    configuration: "2 Units · 3 Beds / 2.5 Baths Each",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 08 · 09",
    summary:
      "Contemporary asymmetric duplex pairing a forward-projecting two-story quarry limestone residence with a cantilevered steel entry awning on the left, and a set-back stucco-and-cedar residence with an integrated garage on the right.",
    highlights: [
      "Forward quarry limestone volume + recessed stucco & cedar garage wing",
      "Owner's unit chef's kitchen with navy island & brass fixtures",
      "Porcelain tile bathrooms, frameless glass showers & dual laundry",
    ],
    triptych: [
      {
        src: "/curated/properties/duplex-02-limestone-stucco-asymmetric.jpg",
        label: "Curbside Offset Limestone & Stucco-Cedar Duplex",
      },
      {
        src: "/curated/properties/interior-limestone-modern-living.jpg",
        label: "Step Inside: Limestone Pier Living & Kitchen",
      },
      {
        src: "/curated/properties/interior-limestone-modern-kitchen.jpg",
        label: "Rift-Oak & Slate Chef's Kitchen Looking at Limestone Courtyard",
      },
    ],
  },
  {
    id: "dpx-203",
    code: "DPX-203",
    category: "duplexes",
    title: "The Meridian L-Plan Brick & Siding Duplex",
    subtitle: "L-Shaped Dual Residence · Projecting Brick Gable + Stepped Side-Porch Wing",
    location: "Indianapolis, IN",
    stateCode: "IN",
    sqft: "3,380 Sq. Ft. Total",
    configuration: "2 Units · 3 Beds / 2 Baths Each",
    availability: "Available · Turnkey Delivery",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09",
    summary:
      "Authentic L-shaped neighborhood duplex featuring a two-story red-brick front gable with a corner covered stoop for Unit A, and a 14-foot stepped-back fiber-cement wing with its own covered porch and attached garage for Unit B.",
    highlights: [
      "Asymmetric L-plan layout with separate street and driveway entries",
      "Dual electric meters, independent HVAC & custom inset kitchen cabinetry",
      "Private concrete driveway apron, attached garage & corner stoop",
    ],
    triptych: [
      {
        src: "/curated/properties/duplex-03-columbus-lplan-brick.jpg",
        label: "Curbside L-Shaped Red Brick Gable & Siding Duplex",
      },
      {
        src: "/curated/properties/interior-custom-foyer-oak-staircase.jpg",
        label: "Step Inside: Entry Foyer, Oak Stair & Kitchen View",
      },
      {
        src: "/curated/magazine/revista_ca_cab_1.jpg",
        label: "Dual-Unit Custom Kitchen Cabinetry & Stone Counters",
      },
    ],
  },
  {
    id: "dpx-204",
    code: "DPX-204",
    category: "duplexes",
    title: "The Evanston Corner Masonry Two-Flat",
    subtitle: "Classic Corner Two-Flat Duplex · Angled Window Bay & Limestone Entry Arch",
    location: "Chicago / Evanston, IL",
    stateCode: "IL",
    sqft: "3,960 Sq. Ft. Total",
    configuration: "2 Units · 3 Beds / 2 Baths Each",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 08 · 09",
    summary:
      "Fully renovated corner-lot Chicago brick two-flat featuring an asymmetric three-window masonry bay on the left, a carved limestone arched entrance on the right, full-floor apartments and a detached brick alley garage.",
    highlights: [
      "Corner brick two-flat with off-center carved limestone entry arch",
      "Sunlit open-concept kitchen and dining rooms on both floors",
      "Detached masonry alley garage & private rear timber decks",
    ],
    triptych: [
      {
        src: "/curated/properties/duplex-04-evanston-corner-twoflat.jpg",
        label: "Corner Brick Two-Flat Duplex & Limestone Entry Arch",
      },
      {
        src: "/curated/residential/div01_08_despues.jpg",
        label: "Bright Open-Concept Dining & Kitchen Suite",
      },
      {
        src: "/curated/pairs/div01_02_despues.jpg",
        label: "Private Divided Rear Timber Decks & Outdoor Living",
      },
    ],
  },
  {
    id: "dpx-205",
    code: "DPX-205",
    category: "duplexes",
    title: "The Summit Buff-Brick & Dormer Duplex",
    subtitle: "Asymmetric Two-Unit Residence · Hip-Roof Buff Brick + Sage Dormer Wing",
    location: "Minneapolis, MN",
    stateCode: "MN",
    sqft: "3,720 Sq. Ft. Total",
    configuration: "2 Units · 3–4 Beds / 2.5 Baths Each",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09",
    summary:
      "Upper-Midwest asymmetric duplex combining a two-story buff-brick front residence with an off-center porch and a stepped-back dark-sage dormer wing with its own side driveway and covered mudroom entry.",
    highlights: [
      "2-story buff-brick front unit + stepped-back sage siding dormer unit",
      "Coffered ceilings, custom built-ins & stone hearth in primary unit",
      "Independent utility metering, 30-year architectural roof & side drive",
    ],
    triptych: [
      {
        src: "/curated/properties/duplex-05-minneapolis-buffbrick-dormer.jpg",
        label: "Buff-Brick Hip-Roof & Stepped Sage Dormer Duplex",
      },
      {
        src: "/curated/hero/res-coffered-hearth.jpg",
        label: "Primary Unit Coffered Living Room & Fireplace",
      },
      {
        src: "/curated/residential/r1.jpg",
        label: "30-Year Architectural Shingle Roof & Ridge Vent",
      },
    ],
  },
  {
    id: "dpx-206",
    code: "DPX-206",
    category: "duplexes",
    title: "The Oak Lawn Limestone & Cedar Infill Duplex",
    subtitle: "Modern Asymmetric Infill Duplex · Texas Limestone Cube + Shed-Roof Carport Wing",
    location: "Dallas / Austin, TX",
    stateCode: "TX",
    sqft: "3,760 Sq. Ft. Total",
    configuration: "2 Units · 3 Beds / 2.5 Baths Each",
    availability: "Available · Turnkey Delivery",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09",
    summary:
      "Modern Texas infill duplex designed with two distinct asymmetric volumes: a two-story flat-roof native limestone residence on the left and a recessed shed-roof charcoal stucco and cedar residence over a tucked carport on the right.",
    highlights: [
      "Asymmetric dual-volume design: limestone cube + shed-roof cedar wing",
      "Custom built-in bookcases & trim carpentry in both units",
      "Engineered hardwood over acoustic sound-deadening underlayment",
    ],
    triptych: [
      {
        src: "/curated/properties/duplex-06-austin-limestone-infill.jpg",
        label: "Curbside Texas Limestone & Cedar Infill Duplex",
      },
      {
        src: "/curated/properties/interior-limestone-modern-living.jpg",
        label: "Step Inside: Limestone Pier Living & Kitchen",
      },
      {
        src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
        label: "Upper Level: Primary Suite & En-Suite Spa Bath",
      },
    ],
  },

  // ── 03 / TOWNHOUSES (6 PROPERTIES) ──
  {
    id: "twn-301",
    code: "TWN-301",
    category: "townhouses",
    title: "The Lincoln Park Brick & Bay Rowhouses",
    subtitle: "Attached Masonry Townhouses · Stepped Parapets, Asymmetric Bays & Side Alley",
    location: "Chicago, IL",
    stateCode: "IL",
    sqft: "2,840 Sq. Ft. / Townhome",
    configuration: "3 Stories · 3 Beds · 3.5 Baths",
    availability: "Available · Multiple Units",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 08 · 09",
    summary:
      "Three-unit masonry rowhouse community built in alternating red clay and buff limestone brick with stepped parapet rooflines, asymmetric projecting bay windows, raised stone stoops and three-level white-oak staircases.",
    highlights: [
      "Alternating red-brick & buff-masonry facades with projecting bays",
      "Parlor-level navy & quartz island kitchen with dining terrace",
      "Solid white-oak staircase connecting all three residential levels",
    ],
    triptych: [
      {
        src: "/curated/properties/townhouse-01-brick-limestone-row.jpg",
        label: "Curbside Stepped Red & Buff Brick Rowhouses",
      },
      {
        src: "/curated/properties/interior-townhouse-living-bay.jpg",
        label: "Step Inside: Parlor Living Room & 3-Window Street Bay",
      },
      {
        src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
        label: "Top Level: Cedar Pergola Rooftop Terrace & Outdoor Kitchen",
      },
    ],
  },
  {
    id: "twn-302",
    code: "TWN-302",
    category: "townhouses",
    title: "The West Loop Corner Limestone & Cedar Townhomes",
    subtitle: "Corner 3-Unit Townhouse Row · Charcoal Brick, Limestone & Corner Balconies",
    location: "Naperville / Chicago, IL",
    stateCode: "IL",
    sqft: "2,940 Sq. Ft. / Townhome",
    configuration: "3 Stories · 4 Beds · 3.5 Baths",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09",
    summary:
      "Corner-lot three-story townhouse community featuring asymmetric stepped volumes in dark manganese brick, cut limestone and warm cedar panels, with cantilevered corner glass balconies and waterfall quartz kitchens.",
    highlights: [
      "Asymmetric corner townhouse massing in charcoal brick, stone & cedar",
      "Main-level custom shaker kitchen with waterfall quartz island",
      "Turnkey interior finishes, wide-plank oak & recessed lighting",
    ],
    triptych: [
      {
        src: "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg",
        label: "Corner Charcoal Brick, Limestone & Cedar Townhomes",
      },
      {
        src: "/curated/properties/interior-limestone-modern-living.jpg",
        label: "Step Inside: Limestone Living & Waterfall Kitchen",
      },
      {
        src: "/curated/pairs/div03_02_despues.jpg",
        label: "Main-Level Waterfall Quartz Kitchen & Custom Millwork",
      },
    ],
  },
  {
    id: "twn-303",
    code: "TWN-303",
    category: "townhouses",
    title: "The Gold Coast Mansard & Brownstone Rowhomes",
    subtitle: "Renovated Brick & Brownstone Townhouses · Slate Mansard Roofs & Side Walk",
    location: "Milwaukee, WI",
    stateCode: "WI",
    sqft: "2,760 Sq. Ft. / Townhome",
    configuration: "3 Stories · 3 Beds · 3 Baths",
    availability: "Available · Turnkey Delivery",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09 · 22",
    summary:
      "Classic three-story brick and brownstone rowhomes restored with slate mansard dormers, asymmetric parlor-level polygonal bay windows, off-center stone entry stoops and designer interior kitchens and baths.",
    highlights: [
      "Asymmetric brownstone bays, brick facades & slate mansard dormers",
      "Designer island kitchen with custom cabinetry & stone counters",
      "Top-floor primary bathroom with dual vanity & walk-in shower",
    ],
    triptych: [
      {
        src: "/curated/properties/townhouse-03-brownstone-mansard-row.jpg",
        label: "Curbside Brick & Brownstone Mansard Townhouses",
      },
      {
        src: "/curated/properties/interior-townhouse-parlor-kitchen.jpg",
        label: "Step Inside: Parlor Bay Window & Quartz Island",
      },
      {
        src: "/curated/residential/div04_05_despues.jpg",
        label: "Primary Suite Bathroom, Dual Vanity & Walk-In Shower",
      },
    ],
  },
  {
    id: "twn-304",
    code: "TWN-304",
    category: "townhouses",
    title: "The North Avenue End-Unit Brick Townhouses",
    subtitle: "Corner End-Unit Rowhouse Block · Exposed Chimney Breast & Stepped Parapets",
    location: "Minneapolis, MN",
    stateCode: "MN",
    sqft: "2,810 Sq. Ft. / Townhome",
    configuration: "3 Stories · 3 Beds · 3.5 Baths",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09",
    summary:
      "Corner end-unit masonry townhouses featuring an exposed brick side chimney breast, staggered side-elevation window openings, raised limestone stoops with wrought-iron railings and coffered parlor living rooms.",
    highlights: [
      "Corner end-unit brick rowhouse with exposed side chimney stack",
      "Parlor-level great room with coffered ceiling & stone hearth",
      "Engineered multi-story framing with 2-hour masonry fire separation",
    ],
    triptych: [
      {
        src: "/curated/properties/townhouse-04-chicago-endunit-brick.jpg",
        label: "Corner End-Unit Brick Rowhouses & Side Elevation",
      },
      {
        src: "/curated/hero/res-coffered-hearth.jpg",
        label: "Parlor-Level Living Room, Hearth & Built-In Shelving",
      },
      {
        src: "/curated/commercial/cx_f2.jpg",
        label: "Fire-Rated Party-Wall & Multi-Story Structural Framing",
      },
    ],
  },
  {
    id: "twn-305",
    code: "TWN-305",
    category: "townhouses",
    title: "The Highland Stepped-Grade Brick Rowhomes",
    subtitle: "Sloping-Street Attached Townhomes · Stepped Roofline & Off-Center Stoops",
    location: "St. Louis, MO",
    stateCode: "MO",
    sqft: "2,520 Sq. Ft. / Townhome",
    configuration: "2.5 Stories · 3 Beds · 2.5 Baths",
    availability: "Available · Turnkey Delivery",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 08 · 09",
    summary:
      "Attached brick rowhouses stepping naturally down a sloping residential street grade, with asymmetric two-bay facades, alternating red-brick and charcoal-slate masonry and sunlit open-concept interiors.",
    highlights: [
      "Stepped-grade rooflines following natural street topography",
      "Open-concept hardwood great room and island kitchen",
      "Three-phase continuous roof deck, underlayment & slate-shingle system",
    ],
    triptych: [
      {
        src: "/curated/properties/townhouse-05-stepped-grade-rowhouses.jpg",
        label: "Stepped-Grade Brick & Slate Rowhomes on Sloping Street",
      },
      {
        src: "/curated/residential/div01_08_despues.jpg",
        label: "Sunlit Townhome Kitchen & Hardwood Great Room",
      },
      {
        src: "/curated/capabilities/reo-roof-3phase.jpg",
        label: "Continuous Townhome Roof Deck & Architectural Shingles",
      },
    ],
  },
  {
    id: "twn-306",
    code: "TWN-306",
    category: "townhouses",
    title: "The Cedar & Stone Three-Story Townhome Row",
    subtitle: "Attached Multi-Unit Townhomes · Stone Base, Cedar Gables & Ground-Level Garages",
    location: "Grand Rapids, MI",
    stateCode: "MI",
    sqft: "2,680 Sq. Ft. / Townhome",
    configuration: "3 Stories · 3 Beds · 3.5 Baths · Garage",
    availability: "Available · Multiple Units",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 07 · 09",
    summary:
      "Three-story attached townhome community featuring natural stone ground-level masonry, alternating slate-blue board-and-batten and warm cedar gables, private driveways with garages and custom interior millwork.",
    highlights: [
      "3-story stone base, slate board-and-batten & cedar gable townhomes",
      "Custom interior casing, solid-core doors & finish carpentry",
      "Top-floor primary bedroom suite with refinished oak floors",
    ],
    triptych: [
      {
        src: "/curated/capabilities/mf-townhomes-row.jpg",
        label: "Three-Story Stone, Cedar & Board-and-Batten Townhome Row",
      },
      {
        src: "/curated/magazine/revista_ca_finish_1.jpg",
        label: "Custom Millwork, Trim Carpentry & Interior Doors",
      },
      {
        src: "/curated/pairs/div03_04_despues.jpg",
        label: "Top-Floor Primary Bedroom Suite & Hardwood Flooring",
      },
    ],
  },

  // ── 04 / COMMERCIAL PROPERTIES (6 PROPERTIES) ──
  {
    id: "com-401",
    code: "COM-401",
    category: "commercial",
    title: "The Limestone Atrium Corporate Center",
    subtitle: "Class-A Commercial Office Property · 3-Story Limestone & Curtain-Wall HQ",
    location: "Oak Brook / Chicago, IL",
    stateCode: "IL",
    sqft: "42,500 Sq. Ft.",
    configuration: "3 Stories · Class-A Corporate HQ & Suites",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 05 · 08 · 09",
    summary:
      "Three-story Class-A commercial office building featuring an architectural limestone and glass curtain-wall facade, a double-height atrium reception lobby and turnkey executive boardroom and tenant suites.",
    highlights: [
      "Limestone masonry piers & insulated low-E glass curtain wall",
      "Double-height limestone atrium lobby with custom reception desk",
      "Acoustic wood-slat executive conference suites & LED lighting",
    ],
    triptych: [
      {
        src: "/curated/hero/com-hq-sunset.jpg",
        label: "Three-Story Limestone & Curtain-Wall Corporate HQ",
      },
      {
        src: "/curated/hero/com-lobby-limestone.jpg",
        label: "Double-Height Limestone Atrium & Reception Millwork",
      },
      {
        src: "/curated/capabilities/com-boardroom.jpg",
        label: "Executive Acoustic Wood-Slat Conference Suite",
      },
    ],
  },
  {
    id: "com-402",
    code: "COM-402",
    category: "commercial",
    title: "The Ironworks Mixed-Use Commercial Building",
    subtitle: "Commercial Office & Retail Property · Structural Brick, Steel & Walnut Fit-Out",
    location: "Milwaukee, WI",
    stateCode: "WI",
    sqft: "36,800 Sq. Ft.",
    configuration: "4 Stories · Street Retail + 3 Office Floors",
    availability: "Available · Turnkey Delivery",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 05 · 06 · 08 · 09",
    summary:
      "Four-story brick and structural steel commercial property combining street-level storefront retail with three upper floors of turnkey walnut-and-glass executive office suites and client lounges.",
    highlights: [
      "Structural steel frame, masonry facade & thermally broken glazing",
      "Custom walnut reception millwork & acoustic glass office partitions",
      "Turnkey executive tenant lounge, library & hospitality bar",
    ],
    triptych: [
      {
        src: "/curated/hero/com-dusk-steel.jpg",
        label: "Architectural Brick, Steel & Glass Commercial Building",
      },
      {
        src: "/curated/hero/com-reception-walnut.jpg",
        label: "Walnut & Glass Executive Reception & Tenant Suite",
      },
      {
        src: "/curated/capabilities/com-walnut-lounge.jpg",
        label: "Custom Walnut Architectural Tenant Lounge",
      },
    ],
  },
  {
    id: "com-403",
    code: "COM-403",
    category: "commercial",
    title: "The Stonebridge Retail & Promenade Plaza",
    subtitle: "Multi-Tenant Commercial Plaza · Stone Masonry Envelope & Turnkey Retail Suites",
    location: "Plano / Dallas, TX",
    stateCode: "TX",
    sqft: "28,400 Sq. Ft.",
    configuration: "6 Commercial Suites · Retail & Hospitality",
    availability: "Available · Multiple Units",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 06 · 08 · 09 · 26",
    summary:
      "High-visibility commercial retail and dining plaza constructed with natural stone veneer piers, charcoal steel canopies, boutique LED retail fit-outs and turnkey restaurant/hospitality suites.",
    highlights: [
      "Stone masonry facade, storefront glazing & pedestrian plaza walkways",
      "Boutique retail suite with custom display millwork & LED clouds",
      "Turnkey restaurant & hospitality build-out with acoustic ceiling",
    ],
    triptych: [
      {
        src: "/curated/hero/com-plaza-stone.jpg",
        label: "Stone Masonry & Charcoal Storefront Commercial Plaza",
      },
      {
        src: "/curated/capabilities/com-retail-led.jpg",
        label: "Flagship Retail Millwork & Suspended LED Clouds",
      },
      {
        src: "/curated/commercial/com_01_1.jpg",
        label: "Turnkey Restaurant & Hospitality Dining Build-Out",
      },
    ],
  },
  {
    id: "com-404",
    code: "COM-404",
    category: "commercial",
    title: "The Northstar Curtain-Wall Office Pavilion",
    subtitle: "Commercial Medical & Professional Building · 2-Story Glass & Metal Envelope",
    location: "Minneapolis, MN",
    stateCode: "MN",
    sqft: "31,200 Sq. Ft.",
    configuration: "2 Stories · Professional & Medical Suites",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 05 · 07 · 08 · 09 · 22",
    summary:
      "Two-story commercial office and medical pavilion featuring a curtain-wall and architectural metal panel exterior, open-plan glass-partition offices and hygienic clinical corridor build-outs.",
    highlights: [
      "Two-story aluminum curtain-wall & insulated metal panel facade",
      "Glass-partition executive offices & open-plan collaborative workstations",
      "Healthcare-ready clinical corridors with hygienic sheet-vinyl flooring",
    ],
    triptych: [
      {
        src: "/curated/commercial/cx_o3.jpg",
        label: "Two-Story Curtain-Wall & Architectural Metal Panel Pavilion",
      },
      {
        src: "/curated/commercial/cx_i1.jpg",
        label: "Open-Plan Glass-Partition Office & Tenant Fit-Out",
      },
      {
        src: "/curated/commercial/com_03_2.jpg",
        label: "Clinical & Medical Professional Corridor Suite",
      },
    ],
  },
  {
    id: "com-405",
    code: "COM-405",
    category: "commercial",
    title: "The Commerce Park High-Bay Flex & Logistics Hub",
    subtitle: "Industrial & Commercial Facility · 32' Clear Structural Steel & Mezzanine Office",
    location: "Indianapolis, IN",
    stateCode: "IN",
    sqft: "64,000 Sq. Ft.",
    configuration: "High-Bay Warehouse + 8,500 Sq. Ft. Mezzanine Office",
    availability: "Available · Move-In Ready",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 03 · 05 · 07 · 09 · 26",
    summary:
      "Heavy-duty commercial and industrial flex property featuring a 32-foot clear structural steel warehouse bay, two-story interior mezzanine offices, an insulated white TPO roof system and diamond-polished concrete slabs.",
    highlights: [
      "High-bay structural steel framing with integrated mezzanine office",
      "Energy-star white TPO membrane roof & high-efficiency rooftop HVAC",
      "Heavy-load diamond-polished reinforced concrete floor slab",
    ],
    triptych: [
      {
        src: "/curated/commercial/com_04_2.jpg",
        label: "High-Bay Commercial Flex Facility & Mezzanine Office",
      },
      {
        src: "/curated/commercial/cx_x3.jpg",
        label: "32-Foot Clear Structural Steel Frame & Mezzanine Deck",
      },
      {
        src: "/work/flooring_commercial.jpg",
        label: "Heavy-Duty Diamond-Polished Reinforced Concrete Slab",
      },
    ],
  },
  {
    id: "com-406",
    code: "COM-406",
    category: "commercial",
    title: "The Gateway Masonry Commercial Center",
    subtitle: "Commercial Retail & Office Property · Stone Veneer Facade & Porcelain Atrium",
    location: "St. Louis, MO",
    stateCode: "MO",
    sqft: "22,600 Sq. Ft.",
    configuration: "2 Stories · Divisible Commercial Suites",
    availability: "Available · Turnkey Delivery",
    yearDelivered: "2026 Turnkey",
    csiScope: "CSI DIV 04 · 07 · 08 · 09",
    summary:
      "Turnkey two-story commercial building featuring natural stone veneer and brick masonry elevations, a covered steel entry canopy, insulated storefront glazing and large-format porcelain common lobbies.",
    highlights: [
      "Architectural stone veneer & commercial storefront glass envelope",
      "Covered structural steel canopy & illuminated fascia signage zone",
      "Large-format porcelain tile lobby, elevator core & tenant corridors",
    ],
    triptych: [
      {
        src: "/curated/commercial/com_02_2.jpg",
        label: "Architectural Stone Veneer & Insulated Storefront Glazing",
      },
      {
        src: "/curated/hero/com-plaza-stone.jpg",
        label: "Covered Commercial Entry Canopy & Masonry Facade",
      },
      {
        src: "/curated/commercial/cx_i2.jpg",
        label: "Large-Format Porcelain Lobby & Common Corridor",
      },
    ],
  },
] as const;

export const MARKET_SPECIALTIES_BY_CATEGORY: Readonly<
  Record<PropertyCategorySlug, readonly MarketSpecialtyService[]>
> = {
  "single-family": [
    {
      id: "sfh-spec-roofing",
      code: "SFH-ROOF",
      market: "single-family",
      specialtyId: "roofing",
      specialtyGroup: "envelope",
      specialtyLabel: "Roofing",
      title: "Single-Family Roofing Systems",
      subtitle: "Standing-Seam Metal, Architectural Shingles & Copper Ridge Detailing",
      csiDivision: "CSI DIV 07 · THERMAL & MOISTURE",
      summary:
        "High-pitch architectural shingle and standing-seam metal roofing engineered for detached single-family homes, complete with ice-and-water shield membranes, ridge ventilation and custom copper chimney flashing.",
      deliverables: [
        "Standing-seam metal & Class-4 impact-rated architectural shingles",
        "Ice-and-water eave membranes & balanced ridge ventilation",
        "Seamless aluminum gutters, downspouts & copper chimney flashing",
      ],
      triptych: [
        {
          src: "/curated/hero/res-estate-roofing.jpg",
          label: "High-Pitch Architectural Shingle Roof & Copper Flashing",
        },
        {
          src: "/curated/pairs/div02_02_despues.jpg",
          label: "Multi-Gable Single-Family Roof & Ridge Ventilation",
        },
        {
          src: "/curated/hero/res-farmhouse-metal.jpg",
          label: "Standing-Seam Metal Roof Accents & Board-and-Batten Gables",
        },
      ],
    },
    {
      id: "sfh-spec-siding",
      code: "SFH-SIDE",
      market: "single-family",
      specialtyId: "siding",
      specialtyGroup: "envelope",
      specialtyLabel: "Siding",
      title: "Single-Family Siding & Exterior Envelope",
      subtitle: "James Hardie Fiber-Cement, Board-and-Batten & Natural Cedar Cladding",
      csiDivision: "CSI DIV 07 · 08 · EXTERIOR CLADDING",
      summary:
        "Complete residential exterior envelope installations including fiber-cement lap and board-and-batten siding, clear-grade Western Red Cedar accents, housewrap moisture barriers and Low-E window integration.",
      deliverables: [
        "Fiber-cement lap, board-and-batten & natural cedar siding",
        "Vented soffits, PVC trim boards & weather-resistant barriers",
        "Energy-efficient casement windows & insulated entry door systems",
      ],
      triptych: [
        {
          src: "/curated/residential/s1.jpg",
          label: "Craftsman Fiber-Cement Lap Siding & Custom Trim",
        },
        {
          src: "/curated/capabilities/reo-siding-wrap.jpg",
          label: "Weather-Resistant Housewrap & Horizontal Lap Siding Installation",
        },
        {
          src: "/curated/hero/res-cedar-deck-home.jpg",
          label: "Natural Cedar & Charcoal Architectural Cladding",
        },
      ],
    },
    {
      id: "sfh-spec-framing",
      code: "SFH-FRAM",
      market: "single-family",
      specialtyId: "framing",
      specialtyGroup: "structural",
      specialtyLabel: "Framing",
      title: "Single-Family Custom Wood Framing",
      subtitle: "Dimensional Lumber, Engineered LVL/Glulam Beams & Vaulted Roof Trusses",
      csiDivision: "CSI DIV 06 · WOOD FRAMING",
      summary:
        "Precision residential wood framing for custom single-family homes—including open-span engineered LVL and glulam ridge beams, vaulted great-room roof trusses, ZIP System structural sheathing and architectural window openings.",
      deliverables: [
        "2x6 exterior stud walls & engineered LVL/glulam beam spans",
        "Vaulted scissor & gable roof truss packages with hurricane clips",
        "Taped structural wall & roof sheathing for airtight envelopes",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-sfh-framing.jpg",
          label: "Custom Single-Family Timber Framing, Trusses & Glulam Beams",
        },
        {
          src: "/curated/capabilities/fire-subfloor-joists.jpg",
          label: "Engineered Wood I-Joist Floor System & OSB Subfloor Framing",
        },
        {
          src: "/curated/capabilities/fire-wood-framing.jpg",
          label: "Dimensional 2x6 Interior & Exterior Stud Wall Framing",
        },
      ],
    },
    {
      id: "sfh-spec-drywall",
      code: "SFH-DRYW",
      market: "single-family",
      specialtyId: "drywall",
      specialtyGroup: "interiors",
      specialtyLabel: "Drywall",
      title: "Single-Family Drywall & Coffered Ceilings",
      subtitle: "Level-5 Smooth Gypsum Finishes, Vaulted Planes & Recessed Lighting Coves",
      csiDivision: "CSI DIV 09 · GYPSUM BOARD",
      summary:
        "Flawless Level-5 smooth drywall hanging, taping and finishing tailored for custom homes—featuring crisp vaulted ceiling intersections, architectural tray and coffered ceilings, and moisture-resistant bath substrates.",
      deliverables: [
        "Level-5 skim-coated drywall across sun-drenched great rooms",
        "Architectural coffered & tray ceilings with LED cove reveals",
        "Acoustic bedroom insulation & mold-resistant bathroom board",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-sfh-drywall-flooring.jpg",
          label: "Level-5 Smooth Drywall, Recessed Cove Ceiling & Oak Floors",
        },
        {
          src: "/curated/hero/res-coffered-hearth.jpg",
          label: "Coffered Drywall Ceiling & Custom Millwork Integration",
        },
        {
          src: "/curated/pairs/div01_03_despues.jpg",
          label: "Smooth Plaster-Grade Wall Finishes & Exposed Ceiling Beams",
        },
      ],
    },
    {
      id: "sfh-spec-flooring",
      code: "SFH-FLOR",
      market: "single-family",
      specialtyId: "flooring",
      specialtyGroup: "interiors",
      specialtyLabel: "Flooring",
      title: "Single-Family Hardwood & Tile Flooring",
      subtitle: "Wide-Plank White Oak, Custom Stair Treads & Heated Porcelain Spa Tile",
      csiDivision: "CSI DIV 09 · RESIDENTIAL FLOORING",
      summary:
        "Turnkey residential flooring installations including wide-plank European white oak hardwood, matching solid-oak stair treads and risers, sound-control underlayments and radiant-heated large-format bathroom porcelain.",
      deliverables: [
        "Wide-plank engineered & solid white oak hardwood flooring",
        "Custom flush floor vents, stair nosings & solid oak treads",
        "Heated large-format porcelain & natural marble bathroom tile",
      ],
      triptych: [
        {
          src: "/curated/properties/interior-custom-foyer-oak-staircase.jpg",
          label: "Wide-Plank White Oak Foyer Flooring & Solid Oak Stair Treads",
        },
        {
          src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
          label: "Primary Suite Hardwood Flooring & Acoustic Underlayment",
        },
        {
          src: "/curated/capabilities/mit-hardwood-underlay.jpg",
          label: "Engineered White Oak Plank Flooring & Vapor-Barrier Underlayment",
        },
      ],
    },
    {
      id: "sfh-spec-concrete",
      code: "SFH-CONC",
      market: "single-family",
      specialtyId: "concrete",
      specialtyGroup: "structural",
      specialtyLabel: "Concrete",
      title: "Single-Family Concrete Driveways, Patios & Foundations",
      subtitle: "Architectural Saw-Cut Driveways, Exposed-Aggregate Patios & Poured Walls",
      csiDivision: "CSI DIV 03 · RESIDENTIAL CONCRETE",
      summary:
        "Reinforced residential concrete construction from poured foundation walls and basement slabs to architectural saw-cut driveways, cantilevered entry steps and multi-tier outdoor living patios.",
      deliverables: [
        "Poured concrete foundation walls, footings & vapor-sealed slabs",
        "Architectural saw-cut driveways with brick-soldier borders",
        "Broom-finished & exposed-aggregate backyard entertaining patios",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-sfh-concrete.jpg",
          label: "Architectural Saw-Cut Concrete Driveway & Entry Walkway",
        },
        {
          src: "/curated/hero/res-multitier-deck.jpg",
          label: "Lower-Level Walkout Concrete Patio & Integrated Fire Bowl",
        },
        {
          src: "/curated/residential/c1.jpg",
          label: "Broom-Finished Residential Concrete Curb, Apron & Sidewalk",
        },
      ],
    },
    {
      id: "sfh-spec-stone",
      code: "SFH-STON",
      market: "single-family",
      specialtyId: "stone",
      specialtyGroup: "structural",
      specialtyLabel: "Stone",
      title: "Single-Family Stone Hearths & Exterior Masonry",
      subtitle: "Full-Height Ledgestone Fireplaces, Limestone Watertables & Brick Chimneys",
      csiDivision: "CSI DIV 04 · RESIDENTIAL MASONRY",
      summary:
        "Artisanal residential stone and masonry craftsmanship featuring floor-to-ceiling dry-stack stone fireplace hearths, carved limestone mantels, exterior stone wainscoting and masonry chimneys.",
      deliverables: [
        "Floor-to-ceiling natural stone hearths & custom limestone mantels",
        "Exterior stone veneer wainscoting, columns & entry arches",
        "Full-bed brick masonry chimneys & outdoor fireplace structures",
      ],
      triptych: [
        {
          src: "/curated/properties/interior-singlefamily-greatroom-stone.jpg",
          label: "Floor-to-Ceiling Natural Stone Hearth in Single-Family Great Room",
        },
        {
          src: "/curated/properties/mkt-sfh-stone-exterior.jpg",
          label: "Single-Family Cut Limestone Watertable, Stone Arch & Chimney Masonry",
        },
        {
          src: "/curated/properties/interior-limestone-modern-living.jpg",
          label: "Honed Limestone Fireplace Surround & Custom Hearth Bench",
        },
      ],
    },
    {
      id: "sfh-spec-carpentry",
      code: "SFH-CARP",
      market: "single-family",
      specialtyId: "carpentry",
      specialtyGroup: "interiors",
      specialtyLabel: "Kitchens & Carpentry",
      title: "Single-Family Kitchens, Baths & Custom Millwork",
      subtitle: "Waterfall Quartz Islands, Shaker Cabinetry & Spa Bathroom Remodels",
      csiDivision: "CSI DIV 06 · 09 · FINISH CARPENTRY",
      summary:
        "Turnkey interior finish carpentry, custom chef's kitchens and primary spa bathrooms for single-family homes—including waterfall quartz islands, custom built-in mudroom lockers and solid-core interior doors.",
      deliverables: [
        "Custom shaker & inset kitchen cabinetry with waterfall quartz islands",
        "Frameless glass walk-in showers, freestanding tubs & double vanities",
        "Built-in bookcases, fireplace mantels, crown molding & wainscot trim",
      ],
      triptych: [
        {
          src: "/curated/pairs/div03_02_despues.jpg",
          label: "Single-Family White Shaker Chef's Kitchen & Quartz Island",
        },
        {
          src: "/curated/properties/interior-primary-spa-bath-walkin.jpg",
          label: "Primary Suite Spa Bathroom, Freestanding Tub & Glass Shower",
        },
        {
          src: "/curated/hero/res-navy-kitchen.jpg",
          label: "Custom Navy Shaker Island, Brass Hardware & Coffered Kitchen Millwork",
        },
      ],
    },
  ],
  duplexes: [
    {
      id: "mf-spec-roofing",
      code: "MF-ROOF",
      market: "duplexes",
      specialtyId: "roofing",
      specialtyGroup: "envelope",
      specialtyLabel: "Roofing",
      title: "Multifamily Roofing Systems",
      subtitle: "Multi-Ridge Architectural Shingles, Standing-Seam Metal & Flat-Deck TPO",
      csiDivision: "CSI DIV 07 · MULTIFAMILY ROOFING",
      summary:
        "High-durability roofing systems engineered for multifamily buildings, duplexes and residential complexes—combining architectural shingle gable roofs, standing-seam metal dormers, commercial-grade gutters and flat-deck TPO membranes.",
      deliverables: [
        "Multi-ridge architectural shingle & standing-seam metal roof assemblies",
        "TPO flat-roof membranes with tapered insulation & scupper drainage",
        "20-year weather-warranted flashing, snow guards & oversized gutters",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-mf-roofing.jpg",
          label: "Multifamily Architectural Shingle & Standing-Seam Metal Roof",
        },
        {
          src: "/curated/properties/duplex-05-minneapolis-buffbrick-dormer.jpg",
          label: "Multi-Unit Dormer Roofline & Weatherproof Flashing System",
        },
        {
          src: "/curated/capabilities/mf-tpo-capex.jpg",
          label: "Multifamily Low-Slope White TPO Membrane & Parapet Roof System",
        },
      ],
    },
    {
      id: "mf-spec-siding",
      code: "MF-SIDE",
      market: "duplexes",
      specialtyId: "siding",
      specialtyGroup: "envelope",
      specialtyLabel: "Siding",
      title: "Multifamily Siding & Weather Envelope",
      subtitle: "Fiber-Cement Panels, Cedar Rain-Screen Accents & Multi-Unit Glazing",
      csiDivision: "CSI DIV 07 · 08 · MULTIFAMILY CLADDING",
      summary:
        "Low-maintenance, fire-resistant multifamily exterior cladding combining James Hardie fiber-cement panels, warm cedar rain-screen accents, continuous air/vapor barriers and acoustic multi-unit window packages.",
      deliverables: [
        "Non-combustible fiber-cement lap, panel & vertical siding systems",
        "Continuous commercial Tyvek/fluid-applied air & moisture barriers",
        "STC sound-rated multi-unit casement windows & balcony sliders",
      ],
      triptych: [
        {
          src: "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg",
          label: "Multifamily Cedar Rain-Screen, Brick & Fiber-Cement Envelope",
        },
        {
          src: "/curated/properties/duplex-03-columbus-lplan-brick.jpg",
          label: "L-Plan Multi-Unit Brick & Architectural Siding Facade",
        },
        {
          src: "/curated/capabilities/mf-apartments-4story.jpg",
          label: "Multi-Story Apartment Fiber-Cement Panel, Brick & Balcony Cladding",
        },
      ],
    },
    {
      id: "mf-spec-framing",
      code: "MF-FRAM",
      market: "duplexes",
      specialtyId: "framing",
      specialtyGroup: "structural",
      specialtyLabel: "Framing",
      title: "Multifamily Structural Wood & Podium Framing",
      subtitle: "Multi-Story Timber Framing, Open-Web Floor Trusses & Acoustic Separation",
      csiDivision: "CSI DIV 06 · MULTIFAMILY FRAMING",
      summary:
        "Fast-cycle multi-story wood framing for duplexes and multifamily buildings—utilizing engineered open-web floor trusses for MEP routing, double-stud acoustic demising walls and pre-engineered roof truss packages.",
      deliverables: [
        "Multi-story Type-V timber framing & concrete podium tie-downs",
        "Open-web floor trusses for rapid plumbing, HVAC & electrical runs",
        "Double-stud acoustic demising walls & UL fire-rated shaft framing",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-mf-framing.jpg",
          label: "Multi-Story Multifamily Timber Framing & Open-Web Floor Trusses",
        },
        {
          src: "/curated/commercial/cx_f2.jpg",
          label: "Multi-Story Wood-Frame Apartment Superstructure & OSB Sheathing",
        },
        {
          src: "/curated/properties/mkt-mf-framing-trusses.jpg",
          label: "Multifamily Open-Web Floor Trusses & Double-Stud Party-Wall Framing",
        },
      ],
    },
    {
      id: "mf-spec-drywall",
      code: "MF-DRYW",
      market: "duplexes",
      specialtyId: "drywall",
      specialtyGroup: "interiors",
      specialtyLabel: "Drywall",
      title: "Multifamily Fire-Rated & Acoustic Drywall",
      subtitle: "UL 2-Hour Party Assemblies, STC-60 Resilient Channels & Corridor Finishes",
      csiDivision: "CSI DIV 09 · MULTIFAMILY GYPSUM",
      summary:
        "Code-compliant multifamily drywall installations featuring UL-listed 1-hour and 2-hour Type-X fire assemblies, resilient sound channels between units, abuse-resistant corridor board and Level-4/5 residential unit finishes.",
      deliverables: [
        "UL fire-rated Type-X gypsum assemblies & fire-caulked penetrations",
        "STC-60 acoustic resilient channels & mineral wool sound attenuation",
        "High-impact common corridor drywall & recessed LED ceiling coves",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-mf-drywall.jpg",
          label: "Multifamily Corridor Drywall, Acoustic Ceiling & Unit Entry",
        },
        {
          src: "/curated/capabilities/mit-taped-drywall.jpg",
          label: "UL Fire-Rated Type-X Gypsum Hanging, Taping & Joint Finishing",
        },
        {
          src: "/curated/capabilities/res-basement-media.jpg",
          label: "Multi-Unit Amenity Lounge Acoustic Drywall & Recessed LED Soffits",
        },
      ],
    },
    {
      id: "mf-spec-flooring",
      code: "MF-FLOR",
      market: "duplexes",
      specialtyId: "flooring",
      specialtyGroup: "interiors",
      specialtyLabel: "Flooring",
      title: "Multifamily Acoustic LVT, Hardwood & Lobby Flooring",
      subtitle: "IIC-Rated Acoustic Underlayment, Waterproof Plank & Polished Concrete",
      csiDivision: "CSI DIV 09 · MULTIFAMILY FLOORING",
      summary:
        "High-traffic multifamily flooring engineered for tenant longevity and acoustic quietness—combining IIC-65 sound-mat underlayments, commercial-wear-layer white-oak LVT and hardwood in units, and polished concrete in lobbies.",
      deliverables: [
        "Waterproof white-oak LVT & engineered hardwood with IIC sound mats",
        "Gyp-Crete floor leveling & acoustic impact insulation between stories",
        "Polished concrete & large-format porcelain tile in lobbies & lounges",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-mf-flooring-concrete.jpg",
          label: "Multifamily Polished Concrete & Wide-Plank White Oak Flooring",
        },
        {
          src: "/curated/properties/interior-duplex-brick-living.jpg",
          label: "Acoustic-Mat White Oak Plank Flooring in Multifamily Residence",
        },
        {
          src: "/curated/properties/interior-limestone-modern-kitchen.jpg",
          label: "Waterproof Wide-Plank Oak Flooring Across Multi-Unit Kitchen & Dining",
        },
      ],
    },
    {
      id: "mf-spec-concrete",
      code: "MF-CONC",
      market: "duplexes",
      specialtyId: "concrete",
      specialtyGroup: "structural",
      specialtyLabel: "Concrete",
      title: "Multifamily Concrete Podiums, Courtyards & Flatwork",
      subtitle: "Post-Tensioned Slabs, Grade Parking Aprons & Amenity Courtyard Pavers",
      csiDivision: "CSI DIV 03 · MULTIFAMILY CONCRETE",
      summary:
        "Turnkey structural and architectural concrete for multifamily developments—including reinforced foundation slabs, garage parking aprons, ADA-compliant entry walks and landscaped courtyard patios with fire features.",
      deliverables: [
        "Reinforced slab-on-grade, podium decks & grade-beam foundations",
        "Architectural concrete courtyard patios, planters & seating walls",
        "Multi-car garage aprons, permeable walks & ADA ramp flatwork",
      ],
      triptych: [
        {
          src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
          label: "Multifamily Concrete Courtyard Patio, Privacy Divider & Fire Bowl",
        },
        {
          src: "/curated/properties/mkt-mf-concrete-podium.jpg",
          label: "Post-Tensioned Concrete Podium Deck, Columns & Parking Apron",
        },
        {
          src: "/curated/properties/duplex-06-austin-limestone-infill.jpg",
          label: "Multi-Unit Architectural Concrete Entry Walks & Carport Slab",
        },
      ],
    },
    {
      id: "mf-spec-stone",
      code: "MF-STON",
      market: "duplexes",
      specialtyId: "stone",
      specialtyGroup: "structural",
      specialtyLabel: "Stone",
      title: "Multifamily Stone & Architectural Brick Masonry",
      subtitle: "Cut Limestone Veneer, Full-Bed Brick Elevations & Courtyard Masonry",
      csiDivision: "CSI DIV 04 · MULTIFAMILY MASONRY",
      summary:
        "Enduring brick and natural stone masonry for multifamily facades—featuring cut Texas and Indiana limestone veneer, full-bed clay brick elevations, cast-stone window sills and masonry courtyard walls.",
      deliverables: [
        "Full-bed clay brick & cut architectural limestone facade masonry",
        "Cast-stone window sills, lintels, watertables & entry piers",
        "Masonry privacy walls, outdoor kitchen surrounds & fire pits",
      ],
      triptych: [
        {
          src: "/curated/properties/duplex-02-limestone-stucco-asymmetric.jpg",
          label: "Cut Limestone Masonry & Warm Stucco Multifamily Facade",
        },
        {
          src: "/curated/properties/duplex-04-evanston-corner-twoflat.jpg",
          label: "Two-Tone Architectural Brick & Limestone Watertable",
        },
        {
          src: "/curated/properties/mkt-mf-stone-courtyard.jpg",
          label: "Multifamily Courtyard Limestone Planter Walls & Outdoor Masonry Kitchen",
        },
      ],
    },
    {
      id: "mf-spec-carpentry",
      code: "MF-CARP",
      market: "duplexes",
      specialtyId: "carpentry",
      specialtyGroup: "interiors",
      specialtyLabel: "Unit Kitchens & Finishes",
      title: "Multifamily Unit Kitchens, Baths & Amenity Carpentry",
      subtitle: "Repeatable Quartz Kitchen Packages, Custom Millwork & Leasing Lounges",
      csiDivision: "CSI DIV 06 · 09 · MULTIFAMILY INTERIORS",
      summary:
        "Scalable, high-finish interior carpentry and kitchen/bath buildouts for multifamily units and common lounges—delivering quartz waterfall islands, European-hinge cabinetry and solid-core unit entry doors on schedule.",
      deliverables: [
        "Multi-unit quartz countertop & custom shaker/flat-panel kitchen packages",
        "Turnkey unit bathrooms with tiled walk-in showers & double vanities",
        "Common lobby millwork, package room cabinetry & solid-core doors",
      ],
      triptych: [
        {
          src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
          label: "Multifamily Unit Chef's Kitchen with Quartz Waterfall Island",
        },
        {
          src: "/curated/properties/mkt-mf-carpentry-lounge.jpg",
          label: "Multifamily Resident Co-Working Lounge & Custom White Oak Millwork",
        },
        {
          src: "/curated/properties/mkt-mf-stone-entry.jpg",
          label: "Multifamily Leasing Lobby Monumental Entry & Custom Millwork Canopy",
        },
      ],
    },
  ],
  townhouses: [
    {
      id: "twn-spec-roofing",
      code: "TWN-ROOF",
      market: "townhouses",
      specialtyId: "roofing",
      specialtyGroup: "envelope",
      specialtyLabel: "Roofing",
      title: "Townhome Mansard, Gable & Flat-Deck Roofing",
      subtitle: "Standing-Seam Metal Mansards, Party-Wall Parapet Flashing & Roof Decks",
      csiDivision: "CSI DIV 07 · TOWNHOME ROOFING",
      summary:
        "Specialized roofing systems for attached townhomes and urban rowhouses—integrating slate-profile and standing-seam metal mansard roofs, fire-rated parapet wall cap flashing and waterproofed rooftop terrace membranes.",
      deliverables: [
        "Standing-seam metal, architectural shingle & mansard roof systems",
        "Continuous sheet-metal parapet coping & party-wall fire flashing",
        "Waterproofed rooftop deck membranes ready for porcelain pedestal pavers",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-twn-roofing-siding.jpg",
          label: "Townhome Standing-Seam Metal Roof, Gables & Parapet Flashing",
        },
        {
          src: "/curated/properties/townhouse-03-brownstone-mansard-row.jpg",
          label: "Mansard Standing-Seam Roof & Dormer Windows on Townhome Row",
        },
        {
          src: "/curated/properties/townhouse-05-stepped-grade-rowhouses.jpg",
          label: "Stepped-Grade Townhome Roofline & Rooftop Terrace Waterproofing",
        },
      ],
    },
    {
      id: "twn-spec-siding",
      code: "TWN-SIDE",
      market: "townhouses",
      specialtyId: "siding",
      specialtyGroup: "envelope",
      specialtyLabel: "Siding",
      title: "Townhome Siding, Bay Windows & Facade Cladding",
      subtitle: "Cedar Rain-Screen Bays, Fiber-Cement Trim & Steel-Grille Townhome Glazing",
      csiDivision: "CSI DIV 07 · 08 · TOWNHOME ENVELOPE",
      summary:
        "Architectural facade envelopes for attached townhomes—combining vertical cedar rain-screen bays, dark bronze aluminum-clad bay windows, fiber-cement trim and insulated recessed entry alcoves.",
      deliverables: [
        "Vertical cedar rain-screen & fiber-cement townhome bay cladding",
        "Two- and three-story projected bay window framing & flashing",
        "Recessed townhome entry doors, transom glazing & custom soffits",
      ],
      triptych: [
        {
          src: "/curated/capabilities/mf-townhomes-row.jpg",
          label: "Attached Townhome Facades with Brick, Cedar Siding & Bay Windows",
        },
        {
          src: "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg",
          label: "Corner Townhome Cedar Rain-Screen & Steel-Mullion Glazing",
        },
        {
          src: "/curated/properties/townhouse-04-chicago-endunit-brick.jpg",
          label: "End-Unit Townhome Architectural Cladding, Bay Trim & Entry Canopy",
        },
      ],
    },
    {
      id: "twn-spec-framing",
      code: "TWN-FRAM",
      market: "townhouses",
      specialtyId: "framing",
      specialtyGroup: "structural",
      specialtyLabel: "Framing",
      title: "Townhome Multi-Level & Party-Wall Framing",
      subtitle: "3-Story Rowhouse Framing, 2-Hour Shaft Walls & Rooftop Penthouse Bulkheads",
      csiDivision: "CSI DIV 06 · TOWNHOME FRAMING",
      summary:
        "Precision three- and four-story townhome framing on tight urban lots—featuring continuous fire-rated party-wall separation, cantilevered bay-window framing, open stairwell rough openings and rooftop terrace bulkheads.",
      deliverables: [
        "3- and 4-story townhome structural framing & engineered floor joists",
        "UL 2-hour area-separation party walls between attached row units",
        "Multi-story stairwell openings & rooftop terrace bulkhead framing",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-twn-framing-row.jpg",
          label: "Three-Story Attached Townhome Row Wood Framing & Party-Wall Separation",
        },
        {
          src: "/curated/properties/mkt-twn-framing-partywall.jpg",
          label: "Townhome Double-Stud Acoustic Party Wall & Open-Web Floor Trusses",
        },
        {
          src: "/curated/properties/mkt-twn-framing-rooftop.jpg",
          label: "Townhome Top-Floor Penthouse Bulkhead & Rooftop Terrace Framing",
        },
      ],
    },
    {
      id: "twn-spec-drywall",
      code: "TWN-DRYW",
      market: "townhouses",
      specialtyId: "drywall",
      specialtyGroup: "interiors",
      specialtyLabel: "Drywall",
      title: "Townhome Party-Wall & Multi-Story Stairwell Drywall",
      subtitle: "STC-62 Acoustic Party Walls, 3-Story Stair Shafts & Level-5 Parlor Ceilings",
      csiDivision: "CSI DIV 09 · TOWNHOME GYPSUM",
      summary:
        "High-performance drywall systems engineered for attached townhomes—delivering whisper-quiet STC-62 acoustic isolation along shared party walls, seamless three-story stairwell shafts and architectural LED ceiling coves.",
      deliverables: [
        "Double-layer Type-X acoustic party-wall drywall with green-glue damping",
        "Seamless 3-story stairwell drywall hanging, taping & skim coating",
        "Parlor-level coffered ceilings & recessed linear lighting channels",
      ],
      triptych: [
        {
          src: "/curated/properties/interior-townhouse-living-bay.jpg",
          label: "Townhome Parlor Living Room with Level-5 Ceiling & Acoustic Party Wall",
        },
        {
          src: "/curated/properties/mkt-twn-framing-drywall.jpg",
          label: "Townhome Multi-Level Stairwell Drywall & Recessed Cove Lighting",
        },
        {
          src: "/curated/properties/mkt-twn-drywall-gallery.jpg",
          label: "Three-Story Townhome Stairwell Shaft Drywall & Linear LED Reveal",
        },
      ],
    },
    {
      id: "twn-spec-flooring",
      code: "TWN-FLOR",
      market: "townhouses",
      specialtyId: "flooring",
      specialtyGroup: "interiors",
      specialtyLabel: "Flooring",
      title: "Townhome Hardwood Flooring & 3-Story Stair Treads",
      subtitle: "Wide-Plank White Oak, Mitered Waterfall Stair Treads & Herringbone Foyers",
      csiDivision: "CSI DIV 09 · TOWNHOME FLOORING",
      summary:
        "Continuous hardwood and stone flooring across all three levels of attached townhomes—featuring wide-plank European white oak on parlor and bedroom floors, custom solid-oak stair treads across multi-flight stairs and marble entry foyers.",
      deliverables: [
        "Continuous wide-plank white oak flooring across parlor & bedroom levels",
        "Custom-milled solid white-oak stair treads, risers & landing nosings",
        "Herringbone marble entry foyers & heated primary bath porcelain tile",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-twn-flooring-herringbone.jpg",
          label: "Townhome Parlor European White Oak Herringbone Parquet Flooring",
        },
        {
          src: "/curated/properties/mkt-twn-flooring-stairtreads.jpg",
          label: "Custom Mitered White Oak Waterfall Stair Treads & Glass Balustrade",
        },
        {
          src: "/curated/properties/mkt-twn-stone-hearth.jpg",
          label: "Townhome Parlor Wide-Plank Oak Flooring & Honed Limestone Hearth",
        },
      ],
    },
    {
      id: "twn-spec-concrete",
      code: "TWN-CONC",
      market: "townhouses",
      specialtyId: "concrete",
      specialtyGroup: "structural",
      specialtyLabel: "Concrete",
      title: "Townhome Concrete Stoops, Stepped Foundations & Terraces",
      subtitle: "Architectural Entry Stoops, Rear Alley Drive Aprons & Rooftop Pedestal Pavers",
      csiDivision: "CSI DIV 03 · TOWNHOME CONCRETE",
      summary:
        "Urban concrete construction for townhome rows—including stepped-grade foundation walls, architectural precast and poured entry stoops, rear-load tuck-under garage slabs and porcelain rooftop terrace paver systems.",
      deliverables: [
        "Architectural concrete & limestone-tread front entry stoops",
        "Stepped-grade foundation walls & rear tuck-under garage slabs",
        "Large-format porcelain pedestal pavers on rooftop terraces",
      ],
      triptych: [
        {
          src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
          label: "Townhome Rooftop Terrace Porcelain Pavers & Concrete Fire Table",
        },
        {
          src: "/curated/properties/mkt-twn-concrete-stone.jpg",
          label: "Townhome Concrete Entry Stoops, Planter Walls & Sidewalk Apron",
        },
        {
          src: "/curated/properties/mkt-twn-concrete-drive.jpg",
          label: "Townhome Rear-Alley Saw-Cut Concrete Drive Apron & Tuck-Under Garages",
        },
      ],
    },
    {
      id: "twn-spec-stone",
      code: "TWN-STON",
      market: "townhouses",
      specialtyId: "stone",
      specialtyGroup: "structural",
      specialtyLabel: "Stone",
      title: "Townhome Brick, Brownstone & Limestone Masonry",
      subtitle: "Hand-Laid Face Brick, Cut Limestone Watertables & Carved Window Lintels",
      csiDivision: "CSI DIV 04 · TOWNHOME MASONRY",
      summary:
        "Timeless urban masonry for townhome developments—combining hand-laid red, charcoal and buff face brick with cut limestone bases, carved stone window lintels and sills, and parlor-level marble or stone fireplaces.",
      deliverables: [
        "Multi-story face brick & rusticated brownstone townhome facades",
        "Cut limestone watertable bases, stoop cheek walls & window lintels",
        "Interior stone & bookmatched slab fireplace surrounds",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-twn-stone-brownstone.jpg",
          label: "Rusticated Brownstone & Cut Limestone Stoop Masonry on Townhome Row",
        },
        {
          src: "/curated/properties/townhouse-01-brick-limestone-row.jpg",
          label: "Three-Story Brick & Limestone Townhome Row Elevation",
        },
        {
          src: "/curated/properties/mkt-twn-stone-gardenwall.jpg",
          label: "Townhome Courtyard Bluestone Patio, Brick Piers & Limestone Water Wall",
        },
      ],
    },
    {
      id: "twn-spec-carpentry",
      code: "TWN-CARP",
      market: "townhouses",
      specialtyId: "carpentry",
      specialtyGroup: "interiors",
      specialtyLabel: "Kitchens & Millwork",
      title: "Townhome Parlor Kitchens, Baths & Custom Millwork",
      subtitle: "Walnut & Quartz Galley Islands, Built-In Hearth Cabinetry & Rooftop Pergolas",
      csiDivision: "CSI DIV 06 · 09 · TOWNHOME CARPENTRY",
      summary:
        "Bespoke finish carpentry designed for vertical townhome living—including parlor-level chef's kitchens with waterfall quartz islands, custom living-room fireplace shelving, steel-and-oak stair balustrades and cedar rooftop pergolas.",
      deliverables: [
        "Parlor-level custom walnut & shaker kitchens with waterfall islands",
        "Floor-to-ceiling fireplace millwork, wet bars & dining banquettes",
        "Primary suite spa bathrooms & cedar rooftop terrace pergolas",
      ],
      triptych: [
        {
          src: "/curated/properties/interior-townhouse-parlor-kitchen.jpg",
          label: "Townhome Parlor Chef's Kitchen with Walnut Cabinetry & Quartz Island",
        },
        {
          src: "/curated/properties/mkt-twn-carpentry-library.jpg",
          label: "Townhome Parlor Study with Custom White Oak Bookcases & Coffered Ceiling",
        },
        {
          src: "/curated/properties/mkt-twn-carpentry-pergola.jpg",
          label: "Townhome Rooftop Cedar Louvered Pergola & Outdoor Kitchen Millwork",
        },
      ],
    },
  ],
  commercial: [
    {
      id: "com-spec-roofing",
      code: "COM-ROOF",
      market: "commercial",
      specialtyId: "roofing",
      specialtyGroup: "envelope",
      specialtyLabel: "Commercial Roofing",
      title: "Commercial Roofing Systems (TPO, EPDM & Standing-Seam)",
      subtitle: "60–80 Mil White TPO Membranes, Tapered Polyiso Insulation & Metal Roofs",
      csiDivision: "CSI DIV 07 · COMMERCIAL ROOFING",
      summary:
        "FM-Global and UL-rated commercial roofing installations for office headquarters, medical plazas, retail centers and industrial warehouses—featuring heat-welded TPO membranes, tapered insulation, RTU curbs and architectural standing-seam metal.",
      deliverables: [
        "60–80 mil Energy-Star white TPO & EPDM commercial membrane roofs",
        "Tapered polyiso roof insulation, RTU curbs & internal roof drains",
        "Heavy-gauge architectural standing-seam metal roofs & parapet copings",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-com-roofing-tpo.jpg",
          label: "Commercial White TPO Membrane Roof, Parapet Coping & RTU Curbs",
        },
        {
          src: "/curated/properties/mkt-com-roofing-greenroof.jpg",
          label: "Commercial Standing-Seam Metal Canopy, Parapet Roof & Terrace Deck",
        },
        {
          src: "/curated/commercial/com_02_2.jpg",
          label: "Commercial Retail & Office Parapet Roof & Canopy Overhang",
        },
      ],
    },
    {
      id: "com-spec-siding",
      code: "COM-SIDE",
      market: "commercial",
      specialtyId: "siding",
      specialtyGroup: "envelope",
      specialtyLabel: "Commercial Siding & Facade",
      title: "Commercial Curtain-Wall, Metal Panels & Exterior Cladding",
      subtitle: "Insulated ACM Metal Panels, Thermally Broken Storefront Glass & Rain-Screens",
      csiDivision: "CSI DIV 07 · 08 · COMMERCIAL ENVELOPE",
      summary:
        "High-performance commercial building envelopes combining architectural aluminum composite metal (ACM) panels, insulated metal siding, thermally broken curtain-wall glazing and continuous fluid-applied weather barriers.",
      deliverables: [
        "Architectural ACM metal panels, insulated metal siding & louvers",
        "Thermally broken aluminum curtain-wall & commercial storefront glazing",
        "Fluid-applied air/vapor barriers & structural steel entry canopies",
      ],
      triptych: [
        {
          src: "/curated/commercial/cx_o3.jpg",
          label: "Commercial Curtain-Wall Glazing & Architectural Metal Panel Cladding",
        },
        {
          src: "/curated/hero/com-dusk-steel.jpg",
          label: "Steel-and-Glass Commercial Envelope & Cantilevered Entry Canopy",
        },
        {
          src: "/curated/hero/com-hq-sunset.jpg",
          label: "Multi-Story Corporate Facade Cladding & Mullion Glazing System",
        },
      ],
    },
    {
      id: "com-spec-framing",
      code: "COM-FRAM",
      market: "commercial",
      specialtyId: "framing",
      specialtyGroup: "structural",
      specialtyLabel: "Commercial Framing",
      title: "Commercial Structural Steel & Heavy-Gauge Metal Framing",
      subtitle: "Clear-Span Steel Columns, Bar Joists, Mezzanine Decks & Cold-Formed Studs",
      csiDivision: "CSI DIV 05 · 09 · COMMERCIAL FRAMING",
      summary:
        "Turnkey commercial structural steel erection and cold-formed metal stud framing—delivering high-bay warehouse clear spans, composite steel mezzanine decks, exterior curtain-wall backup framing and interior tenant demising walls.",
      deliverables: [
        "Structural steel columns, wide-flange beams & open-web bar joists",
        "Exterior heavy-gauge cold-formed metal stud backup & parapet framing",
        "Interior 20- and 18-gauge metal stud framing & acoustic soffit grids",
      ],
      triptych: [
        {
          src: "/curated/commercial/cx_x3.jpg",
          label: "High-Bay Commercial Structural Steel Frame & Mezzanine Deck",
        },
        {
          src: "/curated/capabilities/fire-steel-ibeam.jpg",
          label: "Commercial Wide-Flange Steel I-Beams, Bar Joists & Metal Decking",
        },
        {
          src: "/curated/hero/com-framing-atrium.jpg",
          label: "Multi-Level Commercial Cold-Formed Steel Stud & Atrium Framing",
        },
      ],
    },
    {
      id: "com-spec-drywall",
      code: "COM-DRYW",
      market: "commercial",
      specialtyId: "drywall",
      specialtyGroup: "interiors",
      specialtyLabel: "Commercial Drywall",
      title: "Commercial Drywall, Shaft Walls & Acoustical Ceilings",
      subtitle: "UL Fire-Rated Partitions, Linear Wood Baffles & Suspended ACT Grids",
      csiDivision: "CSI DIV 09 · COMMERCIAL GYPSUM & CEILINGS",
      summary:
        "Large-scale commercial drywall and ceiling systems for corporate offices, medical clinics and retail suites—featuring UL fire-rated deck-to-deck partitions, elevator shaft walls, suspended acoustical tile (ACT) grids and architectural wood baffles.",
      deliverables: [
        "Deck-to-deck UL fire-rated & STC acoustic commercial drywall partitions",
        "Suspended acoustical ceiling tile (ACT) grids & linear wood baffles",
        "Architectural drywall light coves, bulkheads & glass-front framing",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-com-drywall-ceilings.jpg",
          label: "Commercial Drywall Partitions, Linear Wood Baffles & Recessed LEDs",
        },
        {
          src: "/curated/commercial/cx_i2.jpg",
          label: "Commercial Corridor UL Fire-Rated Drywall & Suspended ACT Grid",
        },
        {
          src: "/curated/capabilities/com-retail-led.jpg",
          label: "Commercial Showroom Drywall Bulkheads, Acoustic Clouds & Linear LEDs",
        },
      ],
    },
    {
      id: "com-spec-flooring",
      code: "COM-FLOR",
      market: "commercial",
      specialtyId: "flooring",
      specialtyGroup: "interiors",
      specialtyLabel: "Commercial Flooring",
      title: "Commercial Terrazzo, Porcelain, LVT & Polished Slabs",
      subtitle: "Large-Format Lobby Stone, Commercial Carpet Tile & Diamond-Polished Concrete",
      csiDivision: "CSI DIV 09 · COMMERCIAL FLOORING",
      summary:
        "Heavy-duty commercial flooring installations engineered for high foot traffic and industrial loads—from honed limestone and terrazzo corporate lobbies to commercial LVT, modular carpet tile and diamond-polished concrete slabs.",
      deliverables: [
        "Large-format porcelain, terrazzo & honed limestone lobby flooring",
        "Commercial-grade LVT, modular carpet tile & static-dissipative vinyl",
        "Diamond-polished & epoxy-coated industrial warehouse concrete slabs",
      ],
      triptych: [
        {
          src: "/curated/hero/com-lobby-limestone.jpg",
          label: "Commercial Honed Limestone & Terrazzo Corporate Atrium Flooring",
        },
        {
          src: "/curated/commercial/cx_i1.jpg",
          label: "Diamond-Polished Commercial Concrete & Epoxy Corridor Flooring",
        },
        {
          src: "/curated/hero/com-reception-walnut.jpg",
          label: "Commercial Herringbone White Oak & Stone Reception Flooring",
        },
      ],
    },
    {
      id: "com-spec-concrete",
      code: "COM-CONC",
      market: "commercial",
      specialtyId: "concrete",
      specialtyGroup: "structural",
      specialtyLabel: "Commercial Concrete",
      title: "Commercial Structural Slabs, Foundations & Entry Plazas",
      subtitle: "High-Load Warehouse Slabs, Grade Beams, Loading Docks & Architectural Plazas",
      csiDivision: "CSI DIV 03 · COMMERCIAL CONCRETE",
      summary:
        "Engineered commercial concrete construction—including laser-screeded high-load warehouse slabs, deep pier and grade-beam foundations, loading dock pits, site retaining walls and architectural entry plazas.",
      deliverables: [
        "Laser-screeded reinforced commercial & industrial floor slabs",
        "Deep foundation piers, grade beams, elevator pits & loading docks",
        "Architectural concrete entry plazas, bollards, curbs & ADA ramps",
      ],
      triptych: [
        {
          src: "/curated/properties/mkt-com-concrete-stone.jpg",
          label: "Commercial Architectural Concrete Entry Plaza & Retaining Planters",
        },
        {
          src: "/curated/properties/mkt-com-concrete-tiltup.jpg",
          label: "Architectural Tilt-Up Concrete Panels & Saw-Cut Commercial Plaza Slab",
        },
        {
          src: "/curated/commercial/com_03_2.jpg",
          label: "Commercial Reinforced Concrete Parking Apron, Curbs & ADA Walks",
        },
      ],
    },
    {
      id: "com-spec-stone",
      code: "COM-STON",
      market: "commercial",
      specialtyId: "stone",
      specialtyGroup: "structural",
      specialtyLabel: "Commercial Stone & Masonry",
      title: "Commercial Stone Veneer, CMU Block & Atrium Masonry",
      subtitle: "Cut Limestone Facades, Structural CMU Cores & Bookmatched Lobby Feature Walls",
      csiDivision: "CSI DIV 04 · COMMERCIAL MASONRY",
      summary:
        "Commercial-scale masonry and stone packages—including structural CMU elevator and stair cores, exterior cut limestone and brick veneer facades, and interior bookmatched stone reception and atrium walls.",
      deliverables: [
        "Exterior cut limestone, architectural stone veneer & commercial brick",
        "Reinforced structural CMU block elevator shafts, stairwells & firewalls",
        "Interior honed limestone atrium walls & reception stone monuments",
      ],
      triptych: [
        {
          src: "/curated/hero/com-plaza-stone.jpg",
          label: "Commercial Architectural Stone Veneer & Masonry Entry Elevation",
        },
        {
          src: "/curated/properties/mkt-com-stone-masonry.jpg",
          label: "Commercial Split-Face CMU Block, Brick Veneer & Cut Limestone Base",
        },
        {
          src: "/curated/properties/mkt-com-stone-colonnade.jpg",
          label: "Monumental Commercial Indiana Limestone Colonnade & Granite Plinths",
        },
      ],
    },
    {
      id: "com-spec-carpentry",
      code: "COM-CARP",
      market: "commercial",
      specialtyId: "carpentry",
      specialtyGroup: "interiors",
      specialtyLabel: "Tenant Buildouts (TI)",
      title: "Commercial Tenant Improvements (TI) & Architectural Millwork",
      subtitle: "Executive Boardrooms, Acoustic Glass Fronts, Reception Desks & Hospitality Suites",
      csiDivision: "CSI DIV 06 · 08 · 09 · TENANT BUILDOUTS",
      summary:
        "Turnkey commercial Tenant Improvements (TI) and architectural millwork—delivering glass-walled conference rooms, custom stone-and-walnut reception desks, breakroom cabinetry and indoor-outdoor hospitality terraces.",
      deliverables: [
        "Turnkey corporate, medical & retail Tenant Improvement (TI) buildouts",
        "Acoustic glass office fronts, conference suites & custom reception desks",
        "Architectural walnut wall paneling, breakrooms & rooftop amenity lounges",
      ],
      triptych: [
        {
          src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
          label: "Executive Boardroom Buildout with Acoustic Glass & Walnut Millwork",
        },
        {
          src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
          label: "Commercial Hospitality Lounge, Custom Bar & Rooftop Terrace Suite",
        },
        {
          src: "/curated/capabilities/com-boardroom.jpg",
          label: "Turnkey Corporate Conference Suite & Custom Architectural Millwork",
        },
      ],
    },
  ],
} as const;

export function normalizeMarketCategorySlug(
  slug: string
): PropertyCategorySlug | undefined {
  const clean = slug.trim().toLowerCase();
  if (clean === "single-family" || clean === "single-family-homes") {
    return "single-family";
  }
  if (clean === "duplexes" || clean === "multifamily" || clean === "multi-family") {
    return "duplexes";
  }
  if (clean === "townhouses" || clean === "townhomes") {
    return "townhouses";
  }
  if (clean === "commercial") {
    return "commercial";
  }
  return undefined;
}

export function getPropertyCategoryBySlug(
  slug: string
): PropertyCategoryMeta | undefined {
  const normalized = normalizeMarketCategorySlug(slug);
  if (!normalized) return undefined;
  return PROPERTY_CATEGORIES.find((cat) => cat.slug === normalized);
}

export function getPropertiesByCategory(
  slug: PropertyCategorySlug | string
): PropertyListing[] {
  const normalized = normalizeMarketCategorySlug(slug);
  if (!normalized) return [];
  return PROPERTY_LISTINGS.filter((item) => item.category === normalized);
}

export function getMarketSpecialtiesByCategory(
  slug: PropertyCategorySlug | string
): MarketSpecialtyService[] {
  const normalized = normalizeMarketCategorySlug(slug);
  if (!normalized) return [];
  return [...MARKET_SPECIALTIES_BY_CATEGORY[normalized]];
}
