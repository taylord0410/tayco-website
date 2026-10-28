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

export const PROPERTY_CATEGORIES: readonly PropertyCategoryMeta[] = [
  {
    slug: "single-family",
    order: "01",
    label: "Single-Family Homes",
    shortLabel: "Single-Family",
    eyebrow: "CATEGORY 01 · DETACHED RESIDENCES",
    headline: "Single-Family",
    serifAccent: "Homes.",
    subtitle: "Available detached houses, custom residences & whole-home turnkey renovations",
    description:
      "Explore all available single-family houses delivered by TAYCO across our 8-state footprint. Every residence features complete structural framing, architectural roofing and siding, custom chef's kitchens, white-oak millwork and move-in-ready turnkey finishes.",
    heroImage: "/curated/hero/res-farmhouse-metal.jpg",
    secondaryImages: [
      "/curated/hero/res-cedar-deck-home.jpg",
      "/curated/hero/res-navy-kitchen.jpg",
    ],
    totalAvailableBadge: "6 Available Houses",
    typicalSqftRange: "2,960 – 4,120 Sq. Ft.",
    typicalConfigLabel: "4–5 Beds · 2.5–4 Baths",
    csiDivisions: "CSI DIV 03 · 06 · 07 · 08 · 09",
    accentColor: "#C9A84C",
    ctaLabel: "View all Single-Family Homes",
  },
  {
    slug: "duplexes",
    order: "02",
    label: "Duplexes",
    shortLabel: "Duplexes",
    eyebrow: "CATEGORY 02 · DUAL-UNIT RESIDENCES",
    headline: "Turnkey",
    serifAccent: "Duplexes.",
    subtitle: "Stepped-volume, L-plan & corner two-flat duplex properties built for owner-occupants and investors",
    description:
      "Browse all available duplex properties featuring authentic stepped and L-shaped architectural massing, independent utilities, sound-isolated demising walls, dual quartz kitchens, private covered entries and low-maintenance masonry and cedar envelopes.",
    heroImage: "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg",
    secondaryImages: [
      "/curated/properties/duplex-02-limestone-stucco-asymmetric.jpg",
      "/curated/properties/duplex-03-columbus-lplan-brick.jpg",
    ],
    totalAvailableBadge: "6 Available Duplexes",
    typicalSqftRange: "3,380 – 4,080 Sq. Ft.",
    typicalConfigLabel: "2 Units · 3–4 Beds / Unit",
    csiDivisions: "CSI DIV 04 · 06 · 07 · 08 · 09 · 26",
    accentColor: "#E2C675",
    ctaLabel: "View all Duplex Properties",
  },
  {
    slug: "townhouses",
    order: "03",
    label: "Townhouses",
    shortLabel: "Townhouses",
    eyebrow: "CATEGORY 03 · ATTACHED MULTI-STORY HOMES",
    headline: "Architectural",
    serifAccent: "Townhouses.",
    subtitle: "Multi-story attached rowhouses & corner townhome communities with private garages and terraces",
    description:
      "View all available townhouses and multi-unit rowhome residences. Engineered with fire-rated party walls, stepped masonry and cedar facades, three-story oak staircases, parlor-level chef's kitchens and private outdoor decks.",
    heroImage: "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg",
    secondaryImages: [
      "/curated/properties/townhouse-01-brick-limestone-row.jpg",
      "/curated/properties/townhouse-03-brownstone-mansard-row.jpg",
    ],
    totalAvailableBadge: "6 Available Townhouses",
    typicalSqftRange: "2,490 – 2,940 Sq. Ft.",
    typicalConfigLabel: "3 Stories · 3–4 Beds",
    csiDivisions: "CSI DIV 04 · 06 · 07 · 09 · 22",
    accentColor: "#F3D37A",
    ctaLabel: "View all Townhouses",
  },
  {
    slug: "commercial",
    order: "04",
    label: "Commercial Properties",
    shortLabel: "Commercial",
    eyebrow: "CATEGORY 04 · CORPORATE, RETAIL & INDUSTRIAL",
    headline: "Commercial",
    serifAccent: "Properties.",
    subtitle: "Class-A offices, retail plazas, mixed-use buildings & high-bay industrial facilities",
    description:
      "Explore all available commercial properties constructed and renovated by TAYCO. Includes limestone and curtain-wall office headquarters, multi-tenant retail plazas, clinical suites and heavy-duty industrial logistics centers.",
    heroImage: "/curated/hero/com-hq-sunset.jpg",
    secondaryImages: [
      "/curated/hero/com-dusk-steel.jpg",
      "/curated/hero/com-plaza-stone.jpg",
    ],
    totalAvailableBadge: "6 Available Commercial Assets",
    typicalSqftRange: "22,600 – 64,000 Sq. Ft.",
    typicalConfigLabel: "Office · Retail · Mixed-Use · Industrial",
    csiDivisions: "CSI DIV 03 · 04 · 05 · 07 · 08 · 09",
    accentColor: "#C9A84C",
    ctaLabel: "View all Commercial Properties",
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
        src: "/curated/commercial/cx_x3.jpg",
        label: "High-Bay Structural Steel Warehouse & Mezzanine Office",
      },
      {
        src: "/curated/commercial/com_04_2.jpg",
        label: "Insulated White TPO Roof System & High-Efficiency RTUs",
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

export function getPropertyCategoryBySlug(
  slug: string
): PropertyCategoryMeta | undefined {
  return PROPERTY_CATEGORIES.find((cat) => cat.slug === slug);
}

export function getPropertiesByCategory(
  slug: PropertyCategorySlug
): PropertyListing[] {
  return PROPERTY_LISTINGS.filter((item) => item.category === slug);
}
