"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import TradeGallery from "@/components/TradeGallery";
import {
  TransformationBeforeAfterStudio,
  DualTrackArchitecturalMarquee,
  ServiceCardTriptych,
  type TriptychFrame,
} from "@/components/LandingLivingShowcase";
import { StudioActionIcon } from "@/components/PropertyWalkthroughStudio";
import { COMPANY, COMPANY_SERVICE_AREAS } from "@/lib/company";

export type ResidentialDivisionSlug =
  | "single-family"
  | "multifamily"
  | "townhomes";

export function resolveResidentialDivisionSlug(
  pathname?: string | null,
  explicitDivision?: ResidentialDivisionSlug
): ResidentialDivisionSlug {
  if (explicitDivision) return explicitDivision;
  const normalized = (pathname || "").toLowerCase();
  if (normalized.includes("multifamily") || normalized.includes("duplex")) {
    return "multifamily";
  }
  if (normalized.includes("townhome") || normalized.includes("townhouse")) {
    return "townhomes";
  }
  return "single-family";
}

type ResidentialCategory =
  | "all"
  | "envelope_structural"
  | "interiors_carpentry"
  | "restoration_turnkey";

export interface ResidentialTradeCard {
  num: string;
  csiCode: string;
  title: string;
  category: Exclude<ResidentialCategory, "all">;
  unitRate: string;
  planningNote: string;
  accent: string;
  summary: string;
  items: string[];
  triptych: TriptychFrame[];
  triptychByDivision?: Record<ResidentialDivisionSlug, TriptychFrame[]>;
}

const RESIDENTIAL_CSI_TRADES: ResidentialTradeCard[] = [
  {
    "num": "01",
    "csiCode": "Roofing",
    "title": "Roofing",
    "category": "envelope_structural",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#C9A84C",
    "summary": "Repair or replace the roof with materials and details suited to your home.",
    "items": [
      "Shingles, metal and other roof options",
      "Soffit and fascia",
      "Gutters and downspouts",
      "Leak and storm damage repairs",
      "Ventilation and flashing review",
      "Roof condition assessment"
    ],
    "triptych": [
      { "src": "/curated/residential/r4.jpg", "label": "Standing-Seam Farmhouse Metal Roof" },
      { "src": "/curated/pairs/div02_02_despues.jpg", "label": "Architectural Shingle Roof & Gable Dormers" },
      { "src": "/curated/residential/div04_06_despues.jpg", "label": "Chimney Step & Counter Flashing on Architectural Shingles" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/residential/r4.jpg", "label": "Standing-Seam Farmhouse Metal Roof" },
        { "src": "/curated/pairs/div02_02_despues.jpg", "label": "Architectural Shingle Roof & Gable Dormers" },
        { "src": "/curated/residential/div04_06_despues.jpg", "label": "Chimney Step & Counter Flashing on Architectural Shingles" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-roofing.jpg", "label": "Multifamily Gable Shingle & Standing-Seam Roof System" },
        { "src": "/curated/capabilities/mf-tpo-capex.jpg", "label": "Multi-Unit Flat Roof & Parapet CapEx Replacement" },
        { "src": "/work/roofing_multifamily.jpg", "label": "Duplex & Two-Flat Architectural Shingle Re-Roof" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-roofing-siding.jpg", "label": "Rowhouse Slate Mansard, Copper Flashing & Parapet Cap" },
        { "src": "/curated/properties/townhouse-03-brownstone-mansard-row.jpg", "label": "Attached Brownstone Mansard & Dormer Roofline" },
        { "src": "/curated/properties/townhouse-05-stepped-grade-rowhouses.jpg", "label": "Stepped-Grade Rowhouse Roofs & Party-Wall Parapet Flashing" }
      ]
    }
  },
  {
    "num": "02",
    "csiCode": "Exterior",
    "title": "Siding, windows & doors",
    "category": "envelope_structural",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Refresh the exterior while addressing weather protection and existing conditions.",
    "items": [
      "Vinyl and fiber-cement siding",
      "Engineered wood and cedar",
      "Exterior trim",
      "Window and door coordination",
      "Soffit and fascia",
      "Repair and replacement planning"
    ],
    "triptych": [
      { "src": "/curated/residential/s1.jpg", "label": "Fiber-Cement & Vinyl Lap Siding" },
      { "src": "/curated/residential/div01_04_despues.jpg", "label": "Black-Frame Window & Exterior Trim Package" },
      { "src": "/curated/residential/div02_06_despues.jpg", "label": "Porch Columns, Entry Door & Soffit Wrap" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/residential/s1.jpg", "label": "Fiber-Cement & Vinyl Lap Siding" },
        { "src": "/curated/residential/div01_04_despues.jpg", "label": "Black-Frame Window & Exterior Trim Package" },
        { "src": "/curated/residential/div02_06_despues.jpg", "label": "Porch Columns, Entry Door & Soffit Wrap" }
      ],
      "multifamily": [
        { "src": "/curated/properties/duplex-01-brick-cedar-asymmetric.jpg", "label": "Duplex Brick Veneer, Cedar Cladding & Entry Doors" },
        { "src": "/curated/properties/duplex-05-minneapolis-buffbrick-dormer.jpg", "label": "Two-Flat Buff Brick, Dormer Siding & Casement Windows" },
        { "src": "/work/siding_multifamily.jpg", "label": "Multifamily Fiber-Cement Cladding & Trim Package" }
      ],
      "townhomes": [
        { "src": "/curated/properties/townhouse-01-brick-limestone-row.jpg", "label": "Townhome Brick Facade, Limestone Lintels & Bay Windows" },
        { "src": "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg", "label": "Corner Rowhouse Masonry & Cedar Rainscreen Siding" },
        { "src": "/work/siding_townhomes.jpg", "label": "Attached Townhome Siding, Trim & Stoop Entry Doors" }
      ]
    }
  },
  {
    "num": "03",
    "csiCode": "Framing",
    "title": "Framing & additions",
    "category": "envelope_structural",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Create more usable space with framing and additions coordinated around your home.",
    "items": [
      "Home additions",
      "Wall and roof framing",
      "Floor systems",
      "Structural headers",
      "Porches and decks",
      "Engineering review where required"
    ],
    "triptych": [
      { "src": "/curated/pairs/div01_01_despues.jpg", "label": "2-Story Wood Framing & Roof Trusses" },
      { "src": "/curated/residential/div01_06_despues.jpg", "label": "Home Addition Structural Framing" },
      { "src": "/curated/magazine/revista_fr_wood_05.jpg", "label": "Exterior Wall Framing, Window Headers & Ceiling Joists" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/pairs/div01_01_despues.jpg", "label": "2-Story Wood Framing & Roof Trusses" },
        { "src": "/curated/residential/div01_06_despues.jpg", "label": "Home Addition Structural Framing" },
        { "src": "/curated/magazine/revista_fr_wood_05.jpg", "label": "Exterior Wall Framing, Window Headers & Ceiling Joists" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-framing.jpg", "label": "2-Unit Structural Wood Framing & Demising Wall Assembly" },
        { "src": "/curated/properties/mkt-mf-framing-trusses.jpg", "label": "Multifamily Engineered Floor & Roof Truss Framing" },
        { "src": "/work/framing_multifamily.jpg", "label": "Multi-Unit Wood Framing & Structural Floor Joists" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-framing-row.jpg", "label": "3-Story Attached Townhome Row Wood Framing" },
        { "src": "/curated/properties/mkt-twn-framing-partywall.jpg", "label": "2-Hour Fire-Rated Party-Wall & Floor Joist Framing" },
        { "src": "/curated/properties/mkt-twn-framing-rooftop.jpg", "label": "Townhome Rooftop Penthouse & Terrace Framing" }
      ]
    }
  },
  {
    "num": "04",
    "csiCode": "Interiors",
    "title": "Drywall & interior finishes",
    "category": "interiors_carpentry",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#C9A84C",
    "summary": "Finish new spaces and restore existing rooms with coordinated drywall and painting.",
    "items": [
      "Drywall installation",
      "Moisture-resistant board",
      "Smooth and textured finishes",
      "Repair and patching",
      "Ceiling details",
      "Painting and final touch-ups"
    ],
    "triptych": [
      { "src": "/curated/residential/sf-drywall-level5-living.jpg", "label": "Smooth Level-5 Drywall Finishing" },
      { "src": "/curated/magazine/revista_in_05_a.jpg", "label": "Coffered Ceiling & Painted Trim Package" },
      { "src": "/curated/residential/sf-interior-painting-bedroom.jpg", "label": "Interior Wall Preparation & Finish Coat" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/residential/sf-drywall-level5-living.jpg", "label": "Smooth Level-5 Drywall Finishing" },
        { "src": "/curated/magazine/revista_in_05_a.jpg", "label": "Coffered Ceiling & Painted Trim Package" },
        { "src": "/curated/residential/sf-interior-painting-bedroom.jpg", "label": "Interior Wall Preparation & Finish Coat" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-drywall.jpg", "label": "STC-Rated Acoustic Demising Wall & Drywall Assembly" },
        { "src": "/curated/properties/interior-duplex-brick-living.jpg", "label": "Duplex Living Room Drywall, Brick Accent & Recessed Lighting" },
        { "src": "/work/drywall_multifamily.jpg", "label": "Corridor Drywall Taping, Joint Compound & Soffit Framing" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-drywall-gallery.jpg", "label": "3-Story Townhome Stairwell Level-5 Gallery Drywall" },
        { "src": "/curated/properties/mkt-twn-framing-drywall.jpg", "label": "Party-Wall Fire-Rated Drywall & Shaftliner Board" },
        { "src": "/work/painting_townhomes.jpg", "label": "Parlor-Level Smooth Drywall, Crown & Interior Paint" }
      ]
    }
  },
  {
    "num": "05",
    "csiCode": "Carpentry",
    "title": "Kitchens, baths & carpentry",
    "category": "interiors_carpentry",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Bring storage, fixtures and finishes together around the way your household lives.",
    "items": [
      "Kitchen cabinetry",
      "Bathroom vanities",
      "Trim and molding",
      "Built-in storage",
      "Countertop coordination",
      "Stairs and finish carpentry"
    ],
    "triptych": [
      { "src": "/curated/pairs/div03_02_despues.jpg", "label": "Walnut Butler's Pantry with Glass-Front Cabinetry" },
      { "src": "/curated/pairs/div01_03_despues.jpg", "label": "Built-In Library Bookcases & Coffered Ceiling" },
      { "src": "/curated/residential/div01_05_despues.jpg", "label": "Finished Oak Stair Treads & Balustrade" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/pairs/div03_02_despues.jpg", "label": "Walnut Butler's Pantry with Glass-Front Cabinetry" },
        { "src": "/curated/pairs/div01_03_despues.jpg", "label": "Built-In Library Bookcases & Coffered Ceiling" },
        { "src": "/curated/residential/div01_05_despues.jpg", "label": "Finished Oak Stair Treads & Balustrade" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-carpentry-lounge.jpg", "label": "Multifamily Custom Millwork, Built-Ins & Unit Entry Trim" },
        { "src": "/curated/properties/interior-duplex-brick-kitchen.jpg", "label": "Duplex Open-Concept Kitchen Cabinetry & Quartz Island" },
        { "src": "/curated/properties/interior-limestone-modern-kitchen.jpg", "label": "Two-Flat Waterfall Quartz Kitchen & Custom Walnut Millwork" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-carpentry-library.jpg", "label": "Townhome Parlor Built-In Library & Custom Wainscoting" },
        { "src": "/curated/properties/interior-townhouse-parlor-kitchen.jpg", "label": "Townhome Parlor Chef's Kitchen & Custom Island Millwork" },
        { "src": "/curated/properties/mkt-twn-flooring-stairtreads.jpg", "label": "3-Story Townhome White-Oak Stair Treads & Balustrade" }
      ]
    }
  },
  {
    "num": "06",
    "csiCode": "Concrete",
    "title": "Concrete & foundations",
    "category": "envelope_structural",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Plan practical concrete improvements from foundations to outdoor living areas.",
    "items": [
      "Foundations and basement slabs",
      "Driveways and garage slabs",
      "Patios and walkways",
      "Steps and stoops",
      "Decorative concrete options",
      "Concrete repair"
    ],
    "triptych": [
      { "src": "/curated/residential/div01_07_despues.jpg", "label": "Broom-Finished Concrete Patio & Walkway" },
      { "src": "/curated/pairs/div02_03_despues.jpg", "label": "Foundation Stone Veneer & Column Pedestals" },
      { "src": "/curated/residential/sf-concrete-driveway-front-walk.jpg", "label": "Residential Driveway, Porch & Foundation Apron" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/residential/div01_07_despues.jpg", "label": "Broom-Finished Concrete Patio & Walkway" },
        { "src": "/curated/pairs/div02_03_despues.jpg", "label": "Foundation Stone Veneer & Column Pedestals" },
        { "src": "/curated/residential/sf-concrete-driveway-front-walk.jpg", "label": "Residential Driveway, Porch & Foundation Apron" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-concrete-podium.jpg", "label": "Multifamily Poured Concrete Foundation & Parking Apron" },
        { "src": "/curated/properties/mkt-mf-stone-courtyard.jpg", "label": "Shared Duplex Courtyard Walkways & Stone Retaining Seat" },
        { "src": "/curated/properties/mkt-mf-flooring-concrete.jpg", "label": "Ground-Level Concrete Slab Flooring & Courtyard Walkout" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-concrete-stone.jpg", "label": "Rowhouse Bluestone Stoop, Limestone Treads & Areaway Wall" },
        { "src": "/curated/properties/mkt-twn-concrete-drive.jpg", "label": "Townhome Rear Alley Garage Apron & Permeable Paver Court" },
        { "src": "/curated/properties/mkt-twn-stone-gardenwall.jpg", "label": "Attached Townhome Stepped Foundation & Entry Stoop" }
      ]
    }
  },
  {
    "num": "07",
    "csiCode": "Restoration",
    "title": "Fire & water restoration",
    "category": "restoration_turnkey",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#F97316",
    "summary": "Coordinate damage assessment, repairs and rebuilding after a loss.",
    "items": [
      "Fire and smoke damage assessment",
      "Water extraction and structural drying",
      "Flood and pipe-burst damage",
      "Soot and smoke repairs",
      "Insurance documentation support",
      "Home reconstruction"
    ],
    "triptych": [
      { "src": "/curated/capabilities/fire-wood-framing.jpg", "label": "Fire & Smoke Structural Wood Reconstruction" },
      { "src": "/curated/residential/sf-drywall-water-repair-bedroom.jpg", "label": "Post-Water-Mitigation Drywall Rebuild" },
      { "src": "/curated/residential/div04_06_despues.jpg", "label": "Storm Roof & Chimney Flashing Recovery" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/capabilities/fire-wood-framing.jpg", "label": "Fire & Smoke Structural Wood Reconstruction" },
        { "src": "/curated/residential/sf-drywall-water-repair-bedroom.jpg", "label": "Post-Water-Mitigation Drywall Rebuild" },
        { "src": "/curated/residential/div04_06_despues.jpg", "label": "Storm Roof & Chimney Flashing Recovery" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-framing-trusses.jpg", "label": "Engineered Floor & Roof Truss Structural Framing" },
        { "src": "/curated/capabilities/mit-taped-drywall.jpg", "label": "Stacked-Unit Water-Loss Drywall & Acoustic Assembly Rebuild" },
        { "src": "/curated/capabilities/mf-tpo-capex.jpg", "label": "Multifamily Storm Roof & Membrane Emergency Recovery" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-framing-partywall.jpg", "label": "Party-Wall Fire-Stop & Structural Framing Reconstruction" },
        { "src": "/curated/properties/mkt-twn-framing-drywall.jpg", "label": "Multi-Floor Townhome Water-Loss Drywall & Shaft Rebuild" },
        { "src": "/curated/properties/mkt-twn-roofing-siding.jpg", "label": "Rowhouse Roof, Mansard & Box-Gutter Storm Recovery" }
      ]
    }
  },
  {
    "num": "08",
    "csiCode": "Renovation",
    "title": "Whole-home renovation",
    "category": "restoration_turnkey",
    "unitRate": "Estimate by project",
    "planningNote": "Scope, selections and schedule reviewed with you",
    "accent": "#1B3A6B",
    "summary": "Coordinate rooms, trades and priorities within one renovation plan.",
    "items": [
      "Kitchen and bathroom remodeling",
      "Home additions",
      "Basement finishing",
      "Property rehabilitation",
      "Rental unit turnovers",
      "Bank-owned property repairs"
    ],
    "triptych": [
      { "src": "/curated/residential/sf-finished-basement-lounge.jpg", "label": "Finished Basement Living Suite & LVP" },
      { "src": "/curated/residential/div03_03_despues.jpg", "label": "Main-Floor Hardwood & Interior Remodel" },
      { "src": "/curated/residential/div01_08_despues.jpg", "label": "Open-Concept Kitchen Remodel & Hardwood Floors" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/residential/sf-finished-basement-lounge.jpg", "label": "Finished Basement Living Suite & LVP" },
        { "src": "/curated/residential/div03_03_despues.jpg", "label": "Main-Floor Hardwood & Interior Remodel" },
        { "src": "/curated/residential/div01_08_despues.jpg", "label": "Open-Concept Kitchen Remodel & Hardwood Floors" }
      ],
      "multifamily": [
        { "src": "/curated/properties/duplex-04-evanston-corner-twoflat.jpg", "label": "Full Two-Flat Exterior & Multi-Unit Value-Add Repositioning" },
        { "src": "/curated/properties/interior-limestone-modern-living.jpg", "label": "Unit A/B Open-Concept Living & Acoustic Flooring Turnover" },
        { "src": "/curated/properties/interior-duplex-rear-patio-courtyard.jpg", "label": "Shared Duplex Rear Courtyard & Lower-Unit Garden Suite" }
      ],
      "townhomes": [
        { "src": "/curated/properties/townhouse-04-chicago-endunit-brick.jpg", "label": "End-Unit Rowhouse Full-Gut Masonry & Window Rehabilitation" },
        { "src": "/curated/properties/interior-townhouse-living-bay.jpg", "label": "Parlor-Floor Living Bay, Herringbone Oak & Hearth Remodel" },
        { "src": "/curated/properties/interior-townhouse-rooftop-terrace.jpg", "label": "Rooftop Terrace Deck, Pergola & Upper-Floor Suite Addition" }
      ]
    }
  }
];

export const RESIDENTIAL_RESTORATION_TRIPTYCHS_BY_DIVISION: Record<
  ResidentialDivisionSlug,
  {
    fire: TriptychFrame[];
    water: TriptychFrame[];
  }
> = {
  "single-family": {
    fire: [
      { src: "/curated/capabilities/fire-wood-framing.jpg", label: "Structural Wood Framing Reconstruction" },
      { src: "/curated/magazine/revista_fr_wood_05.jpg", label: "Exterior Wall Framing, Window Headers & Ceiling Joists" },
      { src: "/curated/pairs/div01_03_despues.jpg", label: "Restored Study, Built-In Bookcases & Coffered Ceiling" },
    ],
    water: [
      { src: "/curated/pairs/div03_04_antes.jpg", label: "Lower-Level Strip-Out & Structural Drying" },
      { src: "/curated/residential/sf-drywall-flood-basement.jpg", label: "Post-Mitigation Drywall & Insulation" },
      { src: "/curated/residential/sf-finished-basement-office.jpg", label: "Rebuilt Lower-Level Living Suite & LVP" },
    ],
  },
  multifamily: {
    fire: [
      { src: "/curated/properties/mkt-mf-framing-trusses.jpg", label: "Engineered Floor & Roof Truss Structural Framing" },
      { src: "/curated/properties/mkt-mf-framing.jpg", label: "Demising Wall & Structural Framing Reconstruction" },
      { src: "/curated/properties/interior-duplex-brick-kitchen.jpg", label: "Restored Duplex Kitchen, Cabinetry & Millwork" },
    ],
    water: [
      { src: "/curated/capabilities/mit-taped-drywall.jpg", label: "Stacked-Unit Pipe-Burst Strip-Out & Taped Drywall" },
      { src: "/curated/properties/mkt-mf-drywall.jpg", label: "STC-Rated Acoustic Drywall & Insulation Rebuild" },
      { src: "/curated/properties/interior-limestone-modern-living.jpg", label: "Rebuilt Multi-Unit Living Space & LVP Flooring" },
    ],
  },
  townhomes: {
    fire: [
      { src: "/curated/properties/mkt-twn-framing-partywall.jpg", label: "2-Hour Party-Wall Fire-Stop & Framing Rebuild" },
      { src: "/curated/properties/mkt-twn-framing-row.jpg", label: "Multi-Story Rowhouse Roof & Floor Truss Recovery" },
      { src: "/curated/properties/interior-townhouse-parlor-kitchen.jpg", label: "Restored Townhome Parlor Kitchen & Custom Millwork" },
    ],
    water: [
      { src: "/curated/properties/mkt-twn-framing-drywall.jpg", label: "Multi-Story Vertical Chase Drying & Drywall Hang" },
      { src: "/curated/capabilities/mit-hardwood-underlay.jpg", label: "Subfloor Moisture Barrier & Hardwood Underlayment" },
      { src: "/curated/properties/interior-townhouse-living-bay.jpg", label: "Restored Parlor Bay Window & Herringbone Oak Flooring" },
    ],
  },
};

export function getResidentialTradesByDivision(
  division: ResidentialDivisionSlug
): ResidentialTradeCard[] {
  return RESIDENTIAL_CSI_TRADES.map((card) => ({
    ...card,
    triptych: card.triptychByDivision?.[division] ?? card.triptych,
  }));
}

export function getResidentialRestorationByDivision(
  division: ResidentialDivisionSlug
): { fire: TriptychFrame[]; water: TriptychFrame[] } {
  return (
    RESIDENTIAL_RESTORATION_TRIPTYCHS_BY_DIVISION[division] ??
    RESIDENTIAL_RESTORATION_TRIPTYCHS_BY_DIVISION["single-family"]
  );
}

export default function ResidentialDivisionContent({
  division,
}: {
  division?: ResidentialDivisionSlug;
} = {}) {
  const pathname = usePathname();
  const resolvedDivision = resolveResidentialDivisionSlug(pathname, division);
  const divisionTrades = getResidentialTradesByDivision(resolvedDivision);
  const restorationTriptychs =
    getResidentialRestorationByDivision(resolvedDivision);

  // Fixed light angle for the response surfaces; the interactive hero moved to the division view.
  const lightAngle = 48;
  const [activeCategory, setActiveCategory] =
    useState<ResidentialCategory>("all");

  const filteredTrades =
    activeCategory === "all"
      ? divisionTrades
      : divisionTrades.filter((t) => t.category === activeCategory);

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
          <span className="gold">Roofing &amp; Siding</span>
          <i aria-hidden="true">✳</i>
          <span>Framing &amp; Foundations</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Drywall, Flooring &amp; Painting</span>
          <i aria-hidden="true">✳</i>
          <span>Carpentry, Masonry &amp; Restoration</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Roofing &amp; Siding</span>
          <i aria-hidden="true">✳</i>
          <span>Framing &amp; Foundations</span>
          <i className="gold-star" aria-hidden="true">
            ✳
          </i>
          <span className="gold">Drywall, Flooring &amp; Painting</span>
          <i aria-hidden="true">✳</i>
          <span>Carpentry, Masonry &amp; Restoration</span>
        </div>
      </div>

      {/* ── CHROMATIC HORIZON WAVE INTO WARM EDITORIAL IVORY ── */}
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

            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filter services"
            >
              {[
                { id: "all", label: "All" },
                {
                  id: "envelope_structural",
                  label: "Roofing, Siding, Framing & Concrete",
                },
                {
                  id: "interiors_carpentry",
                  label: "Drywall & Carpentry",
                },
                {
                  id: "restoration_turnkey",
                  label: "Restoration & Remodeling",
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
                      setActiveCategory(tab.id as ResidentialCategory)
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

          {/* 8 Multi-Photo Service Cards */}
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
                    {card.title}
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

      {/* ── REVERSE CHROMATIC HORIZON BACK INTO DEEP STRUCTURAL NAVY ── */}
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
        siteDivision={resolvedDivision}
        initialDivision="div01"
        initialPairId="div01_03"
        eyebrowLabel="Before & After"
      />

      {/* ── DUAL-TRACK ARCHITECTURAL FILMSTRIP MARQUEE ── */}
      <DualTrackArchitecturalMarquee siteDivision={resolvedDivision} />

      {/* ── RESTORATION & TRADE GALLERY ── */}
      <section
        id="restoration"
        className="py-14 sm:py-20 px-4 sm:px-8 relative z-10"
        style={{ background: "#070E1A" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-8 border-b border-white/10">
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Restoration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Fire Restoration Card */}
            <div
              data-response-kind="surface"
              className="tayco-living-card p-6 rounded-2xl border flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(145deg, rgba(15, 32, 64, 0.92), rgba(7, 14, 26, 0.96))",
                borderColor: "rgba(249, 115, 22, 0.5)",
              }}
            >
              <ServiceCardTriptych
                frames={restorationTriptychs.fire}
                badge="Fire Restoration"
                accentColor="#F97316"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <h3 className="text-xl font-black text-white">
                  Fire &amp; Smoke Restoration
                </h3>
                <Link
                  href="/estimate?trade=FIRE-RESTORATION"
                  data-magnetic
                  className="px-4 py-2 rounded-xl text-xs font-black text-white"
                  style={{ background: "#F97316" }}
                >
                  Request Estimate →
                </Link>
              </div>
            </div>

            {/* Water Restoration Card */}
            <div
              data-response-kind="surface"
              className="tayco-living-card p-6 rounded-2xl border flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(145deg, rgba(15, 32, 64, 0.92), rgba(7, 14, 26, 0.96))",
                borderColor: "rgba(201, 168, 76, 0.5)",
              }}
            >
              <ServiceCardTriptych
                frames={restorationTriptychs.water}
                badge="Water Mitigation"
                accentColor="#C9A84C"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <h3 className="text-xl font-black text-white">
                  Water &amp; Storm Recovery
                </h3>
                <Link
                  href="/estimate?trade=WATER-RESTORATION"
                  data-magnetic
                  className="px-4 py-2 rounded-xl text-xs font-black"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  Request Estimate →
                </Link>
              </div>
            </div>
          </div>

          {/* TradeGallery Integration */}
          <div id="trade-catalog" className="pt-4">
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
