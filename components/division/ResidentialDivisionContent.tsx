"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TransformationBeforeAfterStudio,
  DualTrackArchitecturalMarquee,
  type TriptychFrame,
} from "@/components/LandingLivingShowcase";
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
      { "src": "/curated/pairs/div02_02_despues.jpg", "label": "Architectural Shingle Roof & Gable Dormers" },
      { "src": "/curated/residential/div04_06_despues.jpg", "label": "Chimney Step & Counter Flashing on Architectural Shingles" },
      { "src": "/curated/obra/single-family/sf-roofing-tearoff.jpg", "label": "Shingle Replacement in Progress" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/pairs/div02_02_despues.jpg", "label": "Architectural Shingle Roof & Gable Dormers" },
        { "src": "/curated/residential/div04_06_despues.jpg", "label": "Chimney Step & Counter Flashing on Architectural Shingles" },
        { "src": "/curated/obra/single-family/sf-roofing-tearoff.jpg", "label": "Shingle Replacement in Progress" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-roofing.jpg", "label": "Multifamily Gable Shingle & Standing-Seam Roof System" },
        { "src": "/curated/capabilities/mf-tpo-capex.jpg", "label": "Multi-Unit Flat Roof & Parapet CapEx Replacement" },
        { "src": "/work/roofing_multifamily.jpg", "label": "Duplex & Two-Flat Architectural Shingle Re-Roof" },
        { "src": "/curated/obra/multifamily/mf-roofing-tpo.jpg", "label": "TPO Membrane Going Down" },
        { "src": "/curated/obra/multifamily/roofing-1.jpg", "label": "Shingles Over Underlayment" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-roofing-siding.jpg", "label": "Slate Mansard, Copper Flashing & Parapet Cap" },
        { "src": "/curated/properties/townhouse-03-brownstone-mansard-row.jpg", "label": "Attached Brownstone Mansard & Dormer Roofline" },
        { "src": "/curated/properties/townhouse-05-stepped-grade-rowhouses.jpg", "label": "Stepped-Grade Roofs & Party-Wall Parapet Flashing" },
        { "src": "/curated/obra/townhomes/tw-roofing-standing-seam.jpg", "label": "Standing-Seam Mansard Install" },
        { "src": "/curated/obra/townhomes/roofing-1.jpg", "label": "Slate Mansard Install" }
      ]
    }
  },
  {
    "num": "02",
    "csiCode": "Windows & Doors",
    "title": "Windows & Doors",
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
        { "src": "/work/siding_multifamily.jpg", "label": "Multifamily Fiber-Cement Cladding & Trim Package" },
        { "src": "/curated/obra/multifamily/siding-1.jpg", "label": "Fiber-Cement Cladding Underway" },
        { "src": "/curated/obra/multifamily/siding-2.jpg", "label": "Balcony Siding in Progress" }
      ],
      "townhomes": [
        { "src": "/curated/properties/townhouse-01-brick-limestone-row.jpg", "label": "Townhome Brick Facade, Limestone Lintels & Bay Windows" },
        { "src": "/curated/properties/townhouse-02-corner-masonry-cedar-row.jpg", "label": "Corner Masonry & Cedar Rainscreen Siding" },
        { "src": "/work/siding_townhomes.jpg", "label": "Attached Townhome Siding, Trim & Stoop Entry Doors" },
        { "src": "/curated/obra/townhomes/siding-1.jpg", "label": "Lap Siding Over House Wrap" },
        { "src": "/curated/obra/townhomes/siding-2.jpg", "label": "Cedar Siding on Rear Bay" }
      ]
    }
  },
  {
    "num": "03",
    "csiCode": "Framing",
    "title": "Framing",
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
        { "src": "/curated/properties/mkt-mf-framing-trusses.jpg", "label": "Multifamily Engineered Floor & Roof Truss Framing" }
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
    "csiCode": "Drywall",
    "title": "Drywall",
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
        { "src": "/work/painting_townhomes.jpg", "label": "Parlor-Level Smooth Drywall, Crown & Interior Paint" },
        { "src": "/curated/obra/townhomes/drywall-1.jpg", "label": "Taped Drywall, First Coat" }
      ]
    }
  },
  {
    "num": "05",
    "csiCode": "Carpentry",
    "title": "Carpentry",
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
      { "src": "/curated/residential/div01_05_despues.jpg", "label": "Finished Oak Stair Treads & Balustrade" },
      { "src": "/curated/obra/single-family/carpentry-1.jpg", "label": "Kitchen Cabinets Being Set" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/pairs/div03_02_despues.jpg", "label": "Walnut Butler's Pantry with Glass-Front Cabinetry" },
        { "src": "/curated/pairs/div01_03_despues.jpg", "label": "Built-In Library Bookcases & Coffered Ceiling" },
        { "src": "/curated/residential/div01_05_despues.jpg", "label": "Finished Oak Stair Treads & Balustrade" },
        { "src": "/curated/obra/single-family/carpentry-1.jpg", "label": "Kitchen Cabinets Being Set" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-carpentry-lounge.jpg", "label": "Multifamily Custom Millwork, Built-Ins & Unit Entry Trim" },
        { "src": "/curated/properties/interior-duplex-brick-kitchen.jpg", "label": "Duplex Open-Concept Kitchen Cabinetry & Quartz Island" },
        { "src": "/curated/properties/interior-limestone-modern-kitchen.jpg", "label": "Two-Flat Waterfall Quartz Kitchen & Custom Walnut Millwork" },
        { "src": "/curated/obra/multifamily/carpentry-1.jpg", "label": "Unit Kitchen Cabinets Install" },
        { "src": "/curated/obra/multifamily/carpentry-2.jpg", "label": "Built-Ins and Trim Underway" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-carpentry-library.jpg", "label": "Townhome Parlor Built-In Library & Custom Wainscoting" },
        { "src": "/curated/properties/interior-townhouse-parlor-kitchen.jpg", "label": "Townhome Parlor Chef's Kitchen & Custom Island Millwork" },
        { "src": "/curated/properties/mkt-twn-flooring-stairtreads.jpg", "label": "3-Story Townhome White-Oak Stair Treads & Balustrade" },
        { "src": "/curated/obra/townhomes/carpentry-1.jpg", "label": "Kitchen Cabinets Being Hung" },
        { "src": "/curated/obra/townhomes/carpentry-2.jpg", "label": "Library Millwork Underway" }
      ]
    }
  },
  {
    "num": "06",
    "csiCode": "Foundations",
    "title": "Foundations",
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
      { "src": "/curated/residential/sf-concrete-driveway-front-walk.jpg", "label": "Residential Driveway, Porch & Foundation Apron" },
      { "src": "/curated/obra/single-family/concrete-1.jpg", "label": "Driveway Forms and Rebar" },
      { "src": "/curated/obra/single-family/stone-1.jpg", "label": "Stone Veneer Going Up" },
      { "src": "/curated/obra/single-family/stone-2.jpg", "label": "Stone Over Scratch Coat" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/residential/div01_07_despues.jpg", "label": "Broom-Finished Concrete Patio & Walkway" },
        { "src": "/curated/pairs/div02_03_despues.jpg", "label": "Foundation Stone Veneer & Column Pedestals" },
        { "src": "/curated/residential/sf-concrete-driveway-front-walk.jpg", "label": "Residential Driveway, Porch & Foundation Apron" },
        { "src": "/curated/obra/single-family/concrete-1.jpg", "label": "Driveway Forms and Rebar" },
        { "src": "/curated/obra/single-family/stone-1.jpg", "label": "Stone Veneer Going Up" },
        { "src": "/curated/obra/single-family/stone-2.jpg", "label": "Stone Over Scratch Coat" }
      ],
      "multifamily": [
        { "src": "/curated/properties/mkt-mf-concrete-podium.jpg", "label": "Multifamily Poured Concrete Foundation & Parking Apron" },
        { "src": "/curated/properties/mkt-mf-stone-courtyard.jpg", "label": "Shared Duplex Courtyard Walkways & Stone Retaining Seat" },
        { "src": "/curated/properties/mkt-mf-flooring-concrete.jpg", "label": "Ground-Level Concrete Slab Flooring & Courtyard Walkout" },
        { "src": "/curated/obra/multifamily/concrete-1.jpg", "label": "Courtyard Slab Forms" },
        { "src": "/curated/obra/multifamily/concrete-2.jpg", "label": "Fresh Slab Curing" },
        { "src": "/curated/obra/multifamily/stone-1.jpg", "label": "Lath and Scratch Coat for Stone" },
        { "src": "/curated/obra/multifamily/stone-2.jpg", "label": "Stone Veneer Over Scratch Coat" }
      ],
      "townhomes": [
        { "src": "/curated/properties/mkt-twn-concrete-stone.jpg", "label": "Bluestone Stoop, Limestone Treads & Areaway Wall" },
        { "src": "/curated/properties/mkt-twn-concrete-drive.jpg", "label": "Townhome Rear Alley Garage Apron & Permeable Paver Court" },
        { "src": "/curated/properties/mkt-twn-stone-gardenwall.jpg", "label": "Attached Townhome Stepped Foundation & Entry Stoop" },
        { "src": "/curated/obra/townhomes/concrete-1.jpg", "label": "Patio Pour in Progress" },
        { "src": "/curated/obra/townhomes/concrete-2.jpg", "label": "Fresh Slab Finishing" },
        { "src": "/curated/obra/townhomes/stone-1.jpg", "label": "Stone Infill Underway" },
        { "src": "/curated/obra/townhomes/stone-2.jpg", "label": "Stone Veneer Retrofit" }
      ]
    }
  },
  {
    "num": "07",
    "csiCode": "Painting",
    "title": "Painting",
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
        { "src": "/curated/properties/mkt-twn-roofing-siding.jpg", "label": "Roof, Mansard & Box-Gutter Storm Recovery" }
      ]
    }
  },
  {
    "num": "08",
    "csiCode": "Remodeling",
    "title": "Remodeling",
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
      { "src": "/curated/residential/div01_08_despues.jpg", "label": "Open-Concept Kitchen Remodel & Hardwood Floors" },
      { "src": "/curated/obra/single-family/flooring-1.jpg", "label": "Oak Flooring Install" }
    ],
    "triptychByDivision": {
      "single-family": [
        { "src": "/curated/residential/sf-finished-basement-lounge.jpg", "label": "Finished Basement Living Suite & LVP" },
        { "src": "/curated/residential/div03_03_despues.jpg", "label": "Main-Floor Hardwood & Interior Remodel" },
        { "src": "/curated/residential/div01_08_despues.jpg", "label": "Open-Concept Kitchen Remodel & Hardwood Floors" },
        { "src": "/curated/obra/single-family/flooring-1.jpg", "label": "Oak Flooring Install" }
      ],
      "multifamily": [
        { "src": "/curated/properties/duplex-04-evanston-corner-twoflat.jpg", "label": "Full Two-Flat Exterior & Multi-Unit Value-Add Repositioning" },
        { "src": "/curated/properties/interior-limestone-modern-living.jpg", "label": "Unit A/B Open-Concept Living & Acoustic Flooring Turnover" },
        { "src": "/curated/properties/interior-duplex-rear-patio-courtyard.jpg", "label": "Shared Duplex Rear Courtyard & Lower-Unit Garden Suite" },
        { "src": "/curated/obra/multifamily/flooring-1.jpg", "label": "Plank Flooring Install" },
        { "src": "/curated/obra/multifamily/flooring-2.jpg", "label": "Bathroom Tile Being Set" }
      ],
      "townhomes": [
        { "src": "/curated/properties/townhouse-04-chicago-endunit-brick.jpg", "label": "End-Unit Full-Gut Masonry & Window Rehabilitation" },
        { "src": "/curated/properties/interior-townhouse-living-bay.jpg", "label": "Parlor-Floor Living Bay, Herringbone Oak & Hearth Remodel" },
        { "src": "/curated/properties/interior-townhouse-rooftop-terrace.jpg", "label": "Rooftop Terrace Deck, Pergola & Upper-Floor Suite Addition" },
        { "src": "/curated/obra/townhomes/flooring-1.jpg", "label": "Herringbone Floor Install" },
        { "src": "/curated/obra/townhomes/flooring-2.jpg", "label": "New Oak Stair Treads" }
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
      { src: "/curated/properties/mkt-twn-framing-row.jpg", label: "Structural Roof & Floor Truss Recovery" },
      { src: "/curated/properties/interior-townhouse-parlor-kitchen.jpg", label: "Restored Parlor Kitchen & Custom Millwork" },
    ],
    water: [
      { src: "/curated/properties/mkt-twn-framing-drywall.jpg", label: "Vertical Chase Drying & Drywall Hang" },
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

  // Fixed light angle for the response surfaces; the interactive hero moved to the division view.
  const lightAngle = 48;
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
      {/* ServiceCardTriptych retained via getResidentialTradesByDivision */}
      <TransformationBeforeAfterStudio
        siteDivision={resolvedDivision}
        initialDivision="all"
        initialPairId="div01_03"
        eyebrowLabel="Before & After"
      />

      {/* ── DUAL-TRACK ARCHITECTURAL FILMSTRIP MARQUEE ── */}
      <DualTrackArchitecturalMarquee siteDivision={resolvedDivision} />

      {/* ── RESTORATION ── */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Fire Restoration Card */}
            <div
              data-response-kind="surface"
              className="tayco-living-card p-6 rounded-2xl border flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(145deg, rgba(15, 32, 64, 0.92), rgba(7, 14, 26, 0.96))",
                borderColor: "rgba(201, 168, 76, 0.5)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-white">
                  Fire &amp; Smoke Restoration
                </h3>
                <Link
                  href="/estimate?trade=FIRE-RESTORATION"
                  data-magnetic
                  className="px-4 py-2 rounded-xl text-xs font-black"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-black text-white">
                  Water Restoration
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
