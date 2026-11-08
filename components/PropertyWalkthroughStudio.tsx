"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import ProtectedImage, {
  preloadProtectedImages,
  waitForDecodedSurfaces,
} from "@/components/ProtectedImage";
import {
  getMarketSpecialtiesByCategory,
  type MarketSpecialtyService,
  type PropertyListing,
} from "@/lib/property-catalog";
import { TaycoModalOverlay } from "@/components/ui/TaycoDesignSystem";

export interface WalkthroughHotspot {
  id: string;
  xPercent: number;
  yPercent: number;
  title: string;
  csiDivision: string;
  materialSpec: string;
  detail: string;
}

export interface ArchitecturalLightFixture {
  xPercent: number;
  yPercent: number;
  radiusPx: number;
  intensity: number;
  label: string;
}

export interface WalkthroughStop {
  stepNumber: string;
  shortRoomName: string;
  zoneLabel: string;
  floorLevel: string;
  title: string;
  src: string;
  nightSrc: string;
  spatialNarrative: string;
  portalButtonLabel: string;
  sunDirectionX: number;
  sunDirectionY: number;
  lightFixtures: ArchitecturalLightFixture[];
  hotspots: [WalkthroughHotspot, WalkthroughHotspot, WalkthroughHotspot];
}

export interface DesignerPalette {
  id: string;
  name: string;
  shortLabel: string;
  tierBadge: string;
  subtitle: string;
  cabinetryAndTrim: string;
  countertopAndStone: string;
  flooringAndWood: string;
  hardwareAccent: string;
  swatches: [string, string, string, string];
  cssFilter: string;
  tintOverlay: string;
  tintBlendMode: React.CSSProperties["mixBlendMode"];
  tintOpacity: number;
  accentOverlay: string;
}

export interface TimeOfDayPreset {
  id: "morning" | "midday" | "sunset" | "night";
  label: string;
  timeDisplay: string;
  kelvinLabel: string;
  hourValue: number;
  description: string;
}

/**
 * Architectural Vector SVG Icon for Solar & Nighttime Lighting Phases (Zero Emoji).
 */
export function SolarPhaseIcon({
  phase,
  className = "w-3.5 h-3.5",
}: {
  phase: "morning" | "midday" | "day" | "sunset" | "night";
  className?: string;
}) {
  if (phase === "morning") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 4v3" />
        <path d="m5.6 7.6 2.1 2.1" />
        <path d="m18.4 7.6-2.1 2.1" />
        <path d="M4 16a8 8 0 0 1 16 0" />
        <path d="M2 19h20" />
      </svg>
    );
  }
  if (phase === "sunset") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 10V3" />
        <path d="m9 6 3 3 3-3" />
        <path d="M5 17a7 7 0 0 1 14 0" />
        <path d="M2 17h20" />
        <path d="M6 21h12" />
      </svg>
    );
  }
  if (phase === "night") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  // midday / day
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

/**
 * Architectural Vector SVG Icon for Studio Actions & Badges (Zero Emoji).
 */
export function StudioActionIcon({
  kind,
  className = "w-3.5 h-3.5",
}: {
  kind:
    | "sparkle"
    | "arrow-right"
    | "arrow-up-right"
    | "compare"
    | "check"
    | "cinema"
    | "exit-cinema"
    | "close"
    | "play"
    | "pause"
    | "reset";
  className?: string;
}) {
  if (kind === "sparkle") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 2.5 14.4 9.6 21.5 12 14.4 14.4 12 21.5 9.6 14.4 2.5 12 9.6 9.6 12 2.5Z" />
      </svg>
    );
  }
  if (kind === "arrow-up-right") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
    );
  }
  if (kind === "compare") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 3v18" />
        <path d="m8 9-4 3 4 3" />
        <path d="m16 9 4 3-4 3" />
      </svg>
    );
  }
  if (kind === "check") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (kind === "cinema") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M8 3H5a2 2 0 0 0-2 2v3" />
        <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
        <path d="M3 16v3a2 2 0 0 0 2 2h3" />
        <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
      </svg>
    );
  }
  if (kind === "exit-cinema") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M4 14h6v6" />
        <path d="M20 10h-6V4" />
        <path d="m14 10 7-7" />
        <path d="m3 21 7-7" />
      </svg>
    );
  }
  if (kind === "close") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }
  if (kind === "play") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
    );
  }
  if (kind === "pause") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
      >
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </svg>
    );
  }
  if (kind === "reset") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
      </svg>
    );
  }
  // arrow-right
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/**
 * Architectural Vector SVG Icon for the 4 Material Surfaces (Zero Emoji).
 */
export function SurfaceSpecIcon({
  surface,
  className = "w-3.5 h-3.5",
}: {
  surface: "cabinetry" | "stone" | "flooring" | "hardware";
  className?: string;
}) {
  if (surface === "cabinetry") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M12 4v16" />
        <path d="M9 11v2" />
        <path d="M15 11v2" />
      </svg>
    );
  }
  if (surface === "stone") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <polygon points="12 3 21 8.5 12 14 3 8.5 12 3" />
        <polyline points="3 14 12 19.5 21 14" />
      </svg>
    );
  }
  if (surface === "flooring") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <path d="M3 9.5h18M3 14.5h18M10 4v5.5M15 9.5v5M9 14.5V20" />
      </svg>
    );
  }
  // hardware
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
  );
}

export const TIME_OF_DAY_PRESETS: readonly TimeOfDayPreset[] = [
  {
    id: "morning",
    label: "Morning Sun",
    timeDisplay: "07:30 AM",
    kelvinLabel: "6200K Crisp East Sun",
    hourValue: 7.5,
    description: "Fresh morning light from the east with crisp sky reflections",
  },
  {
    id: "midday",
    label: "High Noon",
    timeDisplay: "12:30 PM",
    kelvinLabel: "5600K Natural Daylight",
    hourValue: 12.5,
    description: "True neutral midday daylight showing natural material colors",
  },
  {
    id: "sunset",
    label: "Golden Sunset",
    timeDisplay: "06:30 PM",
    kelvinLabel: "3200K Golden Hour",
    hourValue: 18.5,
    description: "Warm golden-amber sunset rays + soft interior accent glow",
  },
  {
    id: "night",
    label: "Night & Lamps",
    timeDisplay: "09:30 PM",
    kelvinLabel: "2700K Architectural Glow",
    hourValue: 21.5,
    description: "Deep twilight sky with warm 2700K interior & porch lights ON",
  },
] as const;

export const DESIGNER_PALETTES: readonly DesignerPalette[] = [
  {
    id: "as-built",
    name: "Original As-Built",
    shortLabel: "Original As-Built",
    tierBadge: "Included Turnkey",
    subtitle: "Factory Turnkey · 5600K",
    cabinetryAndTrim: "Factory Turnkey Spec · As Photographed",
    countertopAndStone: "Natural Quarry Stone & Honed Quartz",
    flooringAndWood: "Select-Grade Natural White Oak",
    hardwareAccent: "Matte Architectural Black & Satin Nickel",
    swatches: ["#E8E4DC", "#C89F72", "#8B4A3A", "#1E293B"],
    cssFilter: "none",
    tintOverlay: "transparent",
    tintBlendMode: "normal",
    tintOpacity: 0,
    accentOverlay: "transparent",
  },
  {
    id: "alabaster-oak",
    name: "Alabaster & Warm Honey Oak",
    shortLabel: "Alabaster & Honey Oak",
    tierBadge: "Signature Collection",
    subtitle: "SW 7008 Alabaster · Calacatta Quartz · Honey Oak",
    cabinetryAndTrim: "Sherwin-Williams Alabaster (SW 7008) Inset Millwork",
    countertopAndStone: "3cm Calacatta Gold Vein Waterfall Quartz",
    flooringAndWood: "Warm Honey-Stained 7\" Wide-Plank White Oak",
    hardwareAccent: "Brushed Champagne Bronze Pulls & Fixtures",
    swatches: ["#FBF7EE", "#DDA15E", "#E6D5B8", "#9C7A44"],
    cssFilter: "brightness(1.07) contrast(1.04) saturate(1.16) sepia(0.20)",
    tintOverlay:
      "linear-gradient(155deg, rgba(255,248,231,0.48) 0%, rgba(221,161,94,0.30) 55%, rgba(255,252,245,0.38) 100%)",
    tintBlendMode: "soft-light",
    tintOpacity: 0.88,
    accentOverlay:
      "radial-gradient(circle at 50% 45%, rgba(255,244,214,0.18) 0%, rgba(212,163,115,0.14) 100%)",
  },
  {
    id: "hale-navy",
    name: "Hale Navy & Brushed Brass",
    shortLabel: "Hale Navy & Brass",
    tierBadge: "Designer Bespoke",
    subtitle: "BM HC-154 Hale Navy · Carrara Marble · Brass",
    cabinetryAndTrim: "Benjamin Moore Hale Navy (HC-154) & Crisp White Trim",
    countertopAndStone: "Honed Carrara Marble & Buff Indiana Limestone",
    flooringAndWood: "Nordic Raw-Finish Quarter-Sawn White Oak",
    hardwareAccent: "Satin Aged Brass & Architectural Black Steel",
    swatches: ["#1B365D", "#D4AF37", "#F1F5F9", "#0F172A"],
    cssFilter: "contrast(1.12) saturate(1.22) hue-rotate(-18deg) brightness(0.97)",
    tintOverlay:
      "linear-gradient(145deg, rgba(20,46,84,0.62) 0%, rgba(29,68,116,0.42) 52%, rgba(212,175,55,0.28) 100%)",
    tintBlendMode: "color",
    tintOpacity: 0.48,
    accentOverlay:
      "linear-gradient(180deg, rgba(15,35,68,0.22) 0%, transparent 50%, rgba(201,168,76,0.14) 100%)",
  },
  {
    id: "charcoal-walnut",
    name: "Charcoal Slate & American Walnut",
    shortLabel: "Charcoal & Walnut",
    tierBadge: "Executive Reserve",
    subtitle: "SW 7069 Iron Ore · American Walnut · Black Granite",
    cabinetryAndTrim: "Iron Ore Graphite (SW 7069) & Rift-Cut Walnut Panels",
    countertopAndStone: "Leathered Nero Mist Granite & Pietra Grey Quartz",
    flooringAndWood: "Smoked American Walnut & Acoustic Underlayment",
    hardwareAccent: "Anodized Dark Bronze & Matte Black Mullions",
    swatches: ["#1F242D", "#6F4528", "#94A3B8", "#0B0F19"],
    cssFilter: "contrast(1.18) saturate(0.82) brightness(0.92) sepia(0.12)",
    tintOverlay:
      "linear-gradient(160deg, rgba(24,28,36,0.66) 0%, rgba(111,69,40,0.44) 58%, rgba(15,23,42,0.56) 100%)",
    tintBlendMode: "soft-light",
    tintOpacity: 0.88,
    accentOverlay:
      "radial-gradient(circle at 50% 50%, rgba(111,69,40,0.16) 0%, rgba(11,15,25,0.30) 100%)",
  },
  {
    id: "forest-sage",
    name: "Forest Sage & Honed Limestone",
    shortLabel: "Forest Sage & Stone",
    tierBadge: "Organic Luxury",
    subtitle: "SW 6208 Sage · Taj Mahal Quartzite · Limestone",
    cabinetryAndTrim: "Pewter Green (SW 6208) Millwork & Cream Stone Trim",
    countertopAndStone: "Honed Taj Mahal Quartzite & Quarry Limestone",
    flooringAndWood: "Natural Clear-Coat White Oak Plank",
    hardwareAccent: "Oil-Rubbed Bronze & Hand-Forged Iron",
    swatches: ["#2F5241", "#D8D0C1", "#9A7B56", "#1E352B"],
    cssFilter: "contrast(1.08) saturate(1.18) hue-rotate(32deg) brightness(0.98)",
    tintOverlay:
      "linear-gradient(150deg, rgba(40,78,58,0.56) 0%, rgba(186,180,162,0.30) 55%, rgba(47,82,65,0.44) 100%)",
    tintBlendMode: "color",
    tintOpacity: 0.44,
    accentOverlay:
      "linear-gradient(180deg, rgba(47,82,65,0.18) 0%, transparent 60%, rgba(216,208,193,0.15) 100%)",
  },
  {
    id: "terracotta-cedar",
    name: "Warm Terracotta & Western Red Cedar",
    shortLabel: "Terracotta & Cedar",
    tierBadge: "Artisan Estate",
    subtitle: "SW 6333 Terracotta · Natural Cedar · Warm Bronze",
    cabinetryAndTrim: "Cavern Clay Terracotta (SW 6333) & Clear Western Cedar",
    countertopAndStone: "Warm Breccia Capraia Marble & Honed Travertine",
    flooringAndWood: "Select Red-Oak & Warm Cedar Architectural Planks",
    hardwareAccent: "Hand-Rubbed Antique Copper & Warm Brass",
    swatches: ["#A84A32", "#C87D4B", "#EBDCCB", "#4A2518"],
    cssFilter: "contrast(1.10) saturate(1.28) sepia(0.24) hue-rotate(-12deg) brightness(0.98)",
    tintOverlay:
      "linear-gradient(150deg, rgba(168,74,50,0.48) 0%, rgba(200,125,75,0.34) 55%, rgba(235,220,203,0.24) 100%)",
    tintBlendMode: "soft-light",
    tintOpacity: 0.85,
    accentOverlay:
      "radial-gradient(circle at 45% 45%, rgba(200,125,75,0.18) 0%, rgba(74,37,24,0.20) 100%)",
  },
] as const;

/**
 * Computes continuous, physically plausible solar & interior lighting shaders
 * from `hour` (6.0 = 6:00 AM to 22.5 = 10:30 PM).
 */
const NIGHT_IMAGE_FALLBACK_MAP: Record<string, string> = {
  com_02_1: "com_02_2-night.jpg",
  com_03_1: "com_03_2-night.jpg",
  com_04_1: "com_04_2-night.jpg",
};

type RoomHotspotText = Pick<WalkthroughHotspot, "title" | "csiDivision" | "materialSpec" | "detail">;
type RoomText = { floorLevel: string; lights: string[]; hotspots: [RoomHotspotText, RoomHotspotText, RoomHotspotText] };
const spot = (title: string, csiDivision: string, materialSpec: string, detail: string): RoomHotspotText =>
  ({ title, csiDivision, materialSpec, detail });

/**
 * Commercial walkthroughs reuse the residential room layout (light and hotspot positions), so their room
 * text is swapped here. Each commercial project shows its own photos in every room, so these texts
 * describe the scope in general terms and never a fixture that one particular photo may not have.
 */
const COMMERCIAL_ROOM_TEXT: Record<string, RoomText> = {
  "01": {
    floorLevel: "Level 1 · Street Perspective (35° Oblique)",
    lights: ["Storefront Glazing Glow", "Entry Lighting", "Upper-Floor Office Windows", "Facade Wash Lighting"],
    hotspots: [
      spot("Commercial Facade & Envelope System", "CSI DIV 04 & 07 · ENVELOPE", "Masonry, Metal Panel or EIFS per Project", "Air/water barrier and flashing details coordinated with the facade system."),
      spot("Storefront & Curtain-Wall Glazing", "CSI DIV 08 · GLAZING", "Thermally Broken Aluminum Framing", "Insulated low-E units sized to the tenant's daylight and energy targets."),
      spot("Main Entry, Walks & Accessible Route", "CSI DIV 03 & 32 · SITE", "Concrete Walks, Curb Ramps & Entry Canopy", "Accessible route from parking to the main entry."),
    ],
  },
  "02": {
    floorLevel: "Level 1 · Main Entry & Lobby",
    lights: ["Lobby Ambient Downlights", "Reception Feature Lighting", "Daylight Through Entry Glazing"],
    hotspots: [
      spot("Lobby Daylight & Entry Sightline", "CSI DIV 08 · ENTRY GLAZING", "Vestibule & Storefront Glazing", "Connects the street facade with the lobby interior."),
      spot("High-Traffic Commercial Flooring", "CSI DIV 09 · FLOORING", "Porcelain Tile, LVT or Polished Concrete", "Selected for traffic, maintenance and slip resistance."),
      spot("Reception Millwork & Wall Finishes", "CSI DIV 06 & 09 · INTERIOR FINISH", "Custom Millwork, Gypsum Assemblies & Paint", "Built to the tenant's brand and finish standard."),
    ],
  },
  "03": {
    floorLevel: "Level 1 · Tenant Interior & MEP Core",
    lights: ["Architectural LED Downlights", "Feature & Accent Lighting", "Perimeter Daylight"],
    hotspots: [
      spot("Tenant Interior Finish Package", "CSI DIV 06 & 09 · TENANT FINISHES", "Millwork, Partitions & Wall Finishes", "Scope set by the tenant's program and finish schedule."),
      spot("Ceiling, Lighting & MEP Coordination", "CSI DIV 09 & 26 · CEILINGS & LIGHTING", "Acoustic Ceilings with Integrated LED Fixtures", "Ceiling layout coordinated with HVAC, sprinklers and electrical."),
      spot("Perimeter Glazing & Daylight", "CSI DIV 08 · NATURAL DAYLIGHT", "Exterior Windows or Storefront Glazing", "Brings daylight into the tenant space."),
    ],
  },
  "04": {
    floorLevel: "Structure, Assemblies & Systems",
    lights: ["Space Ambient Lighting", "Task & Feature Lighting", "Perimeter Daylight"],
    hotspots: [
      spot("Structural Frame & Floor Assembly", "CSI DIV 03 & 05 · STRUCTURE", "Steel or Concrete Frame per Project", "Frame, slab and deck checked against the project's loads."),
      spot("Acoustic & Fire-Rated Assemblies", "CSI DIV 07 & 09 · RATED ASSEMBLIES", "Rated Partitions, Sealants & Insulation", "Separation between tenants and between floors."),
      spot("Interior Finish & Fit-Out", "CSI DIV 09 · FINISHES", "Flooring, Ceilings & Wall Finishes", "Completed to the space's use and finish schedule."),
    ],
  },
  "05": {
    floorLevel: "Upper Level · Outdoor Terrace",
    lights: ["Terrace Downlights", "Interior Glow Through Glazing", "Paver & Railing Lighting"],
    hotspots: [
      spot("Indoor-Outdoor Glazing Connection", "CSI DIV 08 · GLAZING", "Sliding or Storefront Doors to the Terrace", "Connects the interior space with the outdoor area."),
      spot("Overhead Canopy & Soffit", "CSI DIV 05 & 07 · CANOPY", "Steel or Wood Canopy with Finished Soffit", "Shade and weather protection for the outdoor area."),
      spot("Pedestal Pavers & Glass Guardrail", "CSI DIV 05 & 32 · TERRACE", "Pedestal-Set Pavers over Waterproofing, Glass Guardrail", "Built for foot traffic, drainage and fall protection."),
    ],
  },
};


/**
 * Maps any daytime architectural photo path to its real generated nighttime (9:30 PM)
 * counterpart in `/curated/properties/*-night.jpg`.
 */
export function resolveNightImageSrc(daySrc: string): string {
  const fileName = daySrc.split("/").pop() ?? "";
  const base = fileName.replace(/\.jpg$/i, "");
  if (!base) return daySrc;
  const fallback = NIGHT_IMAGE_FALLBACK_MAP[base];
  if (fallback) {
    return `/curated/properties/${fallback}`;
  }
  return `/curated/properties/${base}-night.jpg`;
}

/**
 * Computes continuous, physically plausible solar & interior lighting shaders
 * from `hour` (6.0 = 6:00 AM to 22.5 = 10:30 PM).
 * - At Night (`hour >= 19.0`), instead of artificial CSS dark filters, `nightPhotoOpacity`
 *   smoothly crossfades to 1.0 so the viewport displays the true AI-generated Night
 *   photograph (`stop.nightSrc`) with logical internal 2700K illumination and natural night sky.
 */
export function computeSolarLightingState(hour: number) {
  // 1. Morning (6.0 to 10.5)
  if (hour < 10.5) {
    const t = Math.max(0, Math.min(1, (10.5 - hour) / 4.0));
    return {
      phaseId: "morning" as const,
      phaseBadge: "Morning Sun · East Light (6200K)",
      kelvin: `${Math.round(5600 + t * 650)}K`,
      baseFilter: `brightness(${(1 + t * 0.08).toFixed(2)}) contrast(${(
        1 +
        t * 0.06
      ).toFixed(2)}) saturate(${(1 + t * 0.14).toFixed(2)})`,
      ambientOverlay:
        "linear-gradient(125deg, rgba(254,240,138,0.34) 0%, rgba(186,230,253,0.22) 48%, rgba(255,255,255,0.06) 100%)",
      ambientBlendMode: "screen" as const,
      ambientOpacity: Number((t * 0.68).toFixed(2)),
      sunbeamColor: "rgba(254, 243, 199, 0.52)",
      sunbeamOpacity: Number((t * 0.72).toFixed(2)),
      lampGlowStrength: 0,
      nightPhotoOpacity: 0,
      isNight: false,
    };
  }

  // 2. High Noon (10.5 to 16.0)
    if (hour <= 16.0) {
    return {
      phaseId: "midday" as const,
      phaseBadge: "High Noon · Natural Daylight (5600K)",
      kelvin: "5600K",
      baseFilter: "brightness(1.02) contrast(1.02) saturate(1.04)",
      ambientOverlay:
        "linear-gradient(160deg, rgba(251,146,60,0.42) 0%, rgba(217,119,6,0.28) 48%, rgba(30,27,75,0.34) 100%)",
      ambientBlendMode: "soft-light" as const,
      ambientOpacity: 0,
      sunbeamColor: "rgba(255, 255, 255, 0.18)",
      sunbeamOpacity: 0.16,
      lampGlowStrength: 0,
      nightPhotoOpacity: 0,
      isNight: false,
    };
  }

  // 3. Golden Sunset (16.0 to 19.25)
  if (hour <= 19.25) {
    const t = Math.max(0, Math.min(1, (hour - 16.0) / 3.0));
    const duskToNightBlend =
      hour > 18.6 ? Number(Math.min(0.45, (hour - 18.6) * 0.65).toFixed(2)) : 0;
    return {
      phaseId: "sunset" as const,
      phaseBadge: "Golden Sunset · Warm West Rays (3200K)",
      kelvin: `${Math.round(5600 - t * 2400)}K`,
      baseFilter: `brightness(${(1 - t * 0.05).toFixed(2)}) contrast(${(
        1 +
        t * 0.12
      ).toFixed(2)}) saturate(${(1 + t * 0.32).toFixed(2)}) sepia(${(
        t * 0.22
      ).toFixed(2)})`,
      ambientOverlay:
        "linear-gradient(160deg, rgba(251,146,60,0.42) 0%, rgba(217,119,6,0.28) 48%, rgba(30,27,75,0.34) 100%)",
      ambientBlendMode: "soft-light" as const,
      ambientOpacity: Number((t * 0.82).toFixed(2)),
      sunbeamColor: "rgba(251, 191, 36, 0.58)",
      sunbeamOpacity: Number((t * 0.76).toFixed(2)),
      lampGlowStrength: 0,
      nightPhotoOpacity: duskToNightBlend,
      isNight: false,
    };
  }

  // 4. Night & Warm Architectural Lamps (19.25 to 23.0) — True Generated Night Photography (`nightSrc`)
  const nightBlend = Number(
    Math.min(1, Math.max(0.85, (hour - 18.8) / 1.2)).toFixed(2)
  );
  return {
    phaseId: "night" as const,
    phaseBadge: "Night & Lamps · Real 2700K Architectural Night View",
    kelvin: "2700K Lamps",
    baseFilter: "brightness(0.95) contrast(1.12) saturate(1.32) sepia(0.22)",
    ambientOverlay:
      "linear-gradient(160deg, rgba(251,146,60,0.42) 0%, rgba(217,119,6,0.28) 48%, rgba(30,27,75,0.34) 100%)",
    ambientBlendMode: "soft-light" as const,
    ambientOpacity: 0,
    sunbeamColor: "rgba(251, 191, 36, 0.58)",
    sunbeamOpacity: 0,
    lampGlowStrength: 0,
    nightPhotoOpacity: nightBlend,
    isNight: true,
  };
}

export interface ProjectWalkthroughRooms {
  foyerLiving: { src: string; label: string };
  kitchenCore: { src: string; label: string };
  upperSuite: { src: string; label: string };
  patioTerrace: { src: string; label: string };
}

/**
 * Per-project architectural rooms (Steps 02–05) keyed by PropertyListing.id.
 * Commercial projects use their own `triptych[1]` and `triptych[2]` in Steps 03–04
 * unless overridden via `prop.walkthroughRooms`.
 */
// Commercial kitchenCore/upperSuite (rooms 3 and 4) must equal the listing's triptych[1]/[2] in
// lib/property-catalog.ts: the room title comes from there. tests/division-routes.test.ts enforces it.
export const WALKTHROUGH_ROOMS_BY_PROJECT_ID: Readonly<
  Record<string, ProjectWalkthroughRooms>
> = {
  // ── 01 / SINGLE-FAMILY HOMES (SFH-101..106) ──
  "sfh-101": {
    foyerLiving: {
      src: "/curated/properties/interior-singlefamily-greatroom-stone.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/hero/res-navy-kitchen.jpg",
      label: "Custom Navy Shaker Kitchen, Marble Waterfall Island & Brass Hood",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "sfh-102": {
    foyerLiving: {
      src: "/curated/properties/interior-custom-foyer-oak-staircase.jpg",
      label: "Entry Foyer, White-Oak Staircase & Great Room Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-spa-bath-walkin.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "sfh-103": {
    foyerLiving: {
      src: "/curated/properties/interior-limestone-modern-living.jpg",
      label: "Entry Foyer, Honed Limestone Feature Pier & Great Room",
    },
    kitchenCore: {
      src: "/curated/properties/interior-limestone-modern-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "sfh-104": {
    foyerLiving: {
      src: "/curated/properties/interior-singlefamily-greatroom-stone.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/residential/div01_08_despues.jpg",
      label: "Open-Concept Kitchen, Hardwood Floors & Recessed Lighting",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "sfh-105": {
    foyerLiving: {
      src: "/curated/properties/interior-custom-foyer-oak-staircase.jpg",
      label: "Entry Foyer, White-Oak Staircase & Great Room Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-spa-bath-walkin.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "sfh-106": {
    foyerLiving: {
      src: "/curated/properties/interior-singlefamily-greatroom-stone.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },

  // ── 02 / MULTIFAMILY (DPX-201..206) ──
  "dpx-201": {
    foyerLiving: {
      src: "/curated/properties/interior-duplex-brick-living.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "dpx-202": {
    foyerLiving: {
      src: "/curated/properties/interior-limestone-modern-living.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-limestone-modern-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-spa-bath-walkin.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "dpx-203": {
    foyerLiving: {
      src: "/curated/properties/interior-duplex-brick-living.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "dpx-204": {
    foyerLiving: {
      src: "/curated/properties/interior-duplex-brick-living.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "dpx-205": {
    foyerLiving: {
      src: "/curated/properties/interior-duplex-brick-living.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },
  "dpx-206": {
    foyerLiving: {
      src: "/curated/properties/interior-limestone-modern-living.jpg",
      label: "Entry Foyer, Great Room & Exterior Porch Sightline",
    },
    kitchenCore: {
      src: "/curated/properties/interior-limestone-modern-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
      label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
    },
  },

  // ── 03 / TOWNHOMES (TWN-301..306) ──
  "twn-301": {
    foyerLiving: {
      src: "/curated/properties/interior-townhouse-living-bay.jpg",
      label: "Parlor Living Room & Polygonal 3-Window Street Bay",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
      label: "Private Cedar-Pergola Rooftop Terrace & Outdoor Kitchen",
    },
  },
  "twn-302": {
    foyerLiving: {
      src: "/curated/properties/interior-townhouse-living-bay.jpg",
      label: "Parlor Living Room & Polygonal 3-Window Street Bay",
    },
    kitchenCore: {
      src: "/curated/properties/interior-limestone-modern-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-spa-bath-walkin.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
      label: "Private Cedar-Pergola Rooftop Terrace & Outdoor Kitchen",
    },
  },
  "twn-303": {
    foyerLiving: {
      src: "/curated/properties/interior-townhouse-living-bay.jpg",
      label: "Parlor Living Room & Polygonal 3-Window Street Bay",
    },
    kitchenCore: {
      src: "/curated/properties/interior-townhouse-parlor-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
      label: "Private Cedar-Pergola Rooftop Terrace & Outdoor Kitchen",
    },
  },
  "twn-304": {
    foyerLiving: {
      src: "/curated/properties/interior-townhouse-living-bay.jpg",
      label: "Parlor Living Room & Polygonal 3-Window Street Bay",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
      label: "Private Cedar-Pergola Rooftop Terrace & Outdoor Kitchen",
    },
  },
  "twn-305": {
    foyerLiving: {
      src: "/curated/properties/interior-townhouse-living-bay.jpg",
      label: "Parlor Living Room & Polygonal 3-Window Street Bay",
    },
    kitchenCore: {
      src: "/curated/properties/interior-townhouse-parlor-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
      label: "Private Cedar-Pergola Rooftop Terrace & Outdoor Kitchen",
    },
  },
  "twn-306": {
    foyerLiving: {
      src: "/curated/properties/interior-townhouse-living-bay.jpg",
      label: "Parlor Living Room & Polygonal 3-Window Street Bay",
    },
    kitchenCore: {
      src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
      label: "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
    },
    upperSuite: {
      src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
      label: "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
    },
    patioTerrace: {
      src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
      label: "Private Cedar-Pergola Rooftop Terrace & Outdoor Kitchen",
    },
  },

  // ── 04 / COMMERCIAL PROPERTIES (COM-401..406) ──
  "com-401": {
    foyerLiving: {
      src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
      label: "Double-Height Limestone Atrium & Glass Boardroom",
    },
    kitchenCore: {
      src: "/curated/hero/com-lobby-limestone.jpg",
      label: "Double-Height Limestone Atrium & Reception Millwork",
    },
    upperSuite: {
      src: "/curated/capabilities/com-boardroom.jpg",
      label: "Executive Acoustic Wood-Slat Conference Suite",
    },
    patioTerrace: {
      src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
      label: "Executive Mezzanine Lounge & Covered Limestone Terrace",
    },
  },
  "com-402": {
    foyerLiving: {
      src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
      label: "Double-Height Limestone Atrium & Glass Boardroom",
    },
    kitchenCore: {
      src: "/curated/hero/com-reception-walnut.jpg",
      label: "Walnut & Glass Executive Reception & Tenant Suite",
    },
    upperSuite: {
      src: "/curated/capabilities/com-walnut-lounge.jpg",
      label: "Custom Walnut Architectural Tenant Lounge",
    },
    patioTerrace: {
      src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
      label: "Executive Mezzanine Lounge & Covered Limestone Terrace",
    },
  },
  "com-403": {
    foyerLiving: {
      src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
      label: "Double-Height Limestone Atrium & Glass Boardroom",
    },
    kitchenCore: {
      src: "/curated/capabilities/com-retail-led.jpg",
      label: "Flagship Retail Millwork & Suspended LED Clouds",
    },
    upperSuite: {
      src: "/curated/commercial/com_01_1.jpg",
      label: "Turnkey Restaurant & Hospitality Dining Build-Out",
    },
    patioTerrace: {
      src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
      label: "Executive Mezzanine Lounge & Covered Limestone Terrace",
    },
  },
  "com-404": {
    foyerLiving: {
      src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
      label: "Double-Height Limestone Atrium & Glass Boardroom",
    },
    kitchenCore: {
      src: "/curated/commercial/com-open-plan-office-fitout.jpg",
      label: "Open-Plan Glass-Partition Office & Tenant Fit-Out",
    },
    upperSuite: {
      src: "/curated/commercial/com-clinical-corridor.jpg",
      label: "Clinical & Medical Professional Corridor Suite",
    },
    patioTerrace: {
      src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
      label: "Executive Mezzanine Lounge & Covered Limestone Terrace",
    },
  },
  "com-405": {
    foyerLiving: {
      src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
      label: "Double-Height Limestone Atrium & Glass Boardroom",
    },
    kitchenCore: {
      src: "/curated/commercial/cx_x3.jpg",
      label: "32-Foot Clear Structural Steel Frame & Mezzanine Deck",
    },
    upperSuite: {
      src: "/curated/commercial/com-flex-logistics-slab-interior.jpg",
      label: "Heavy-Duty Diamond-Polished Reinforced Concrete Slab",
    },
    patioTerrace: {
      src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
      label: "Executive Mezzanine Lounge & Covered Limestone Terrace",
    },
  },
  "com-406": {
    foyerLiving: {
      src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
      label: "Double-Height Limestone Atrium & Glass Boardroom",
    },
    kitchenCore: {
      src: "/curated/commercial/com-tenant-space-stone-storefront.jpg",
      label: "Stone-Storefront Tenant Space, Porcelain Floor & Pendant Lighting",
    },
    upperSuite: {
      src: "/curated/commercial/cx_i2.jpg",
      label: "Large-Format Porcelain Lobby & Common Corridor",
    },
    patioTerrace: {
      src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
      label: "Executive Mezzanine Lounge & Covered Limestone Terrace",
    },
  },
};

export function resolveProjectWalkthroughRooms(
  prop: PropertyListing
): ProjectWalkthroughRooms {
  const mapped = WALKTHROUGH_ROOMS_BY_PROJECT_ID[prop.id];
  const isCommercial = prop.category === "commercial";
  const isTownhouse = prop.category === "townhomes";

  const defaultFoyer = isCommercial
    ? {
        src: "/curated/properties/interior-commercial-boardroom-atrium.jpg",
        label: "Double-Height Limestone Atrium & Glass Boardroom",
      }
    : isTownhouse
    ? {
        src: "/curated/properties/interior-townhouse-living-bay.jpg",
        label: "Parlor Living Room & Polygonal 3-Window Street Bay",
      }
    : {
        src: "/curated/properties/interior-singlefamily-greatroom-stone.jpg",
        label: "Entry Foyer, Great Room & Exterior Porch Sightline",
      };

  const defaultKitchen = isCommercial
    ? prop.triptych[1]
    : {
        src: "/curated/properties/interior-duplex-brick-kitchen.jpg",
        label:
          "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
      };

  const defaultUpper = isCommercial
    ? prop.triptych[2]
    : {
        src: "/curated/properties/interior-primary-suite-oak-bedroom.jpg",
        label:
          "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
      };

  const defaultPatio = isCommercial
    ? {
        src: "/curated/properties/interior-commercial-executive-lounge-terrace.jpg",
        label: "Executive Mezzanine Lounge & Covered Limestone Terrace",
      }
    : isTownhouse
    ? {
        src: "/curated/properties/interior-townhouse-rooftop-terrace.jpg",
        label: "Private Cedar-Pergola Rooftop Terrace & Outdoor Kitchen",
      }
    : {
        src: "/curated/properties/interior-duplex-rear-patio-courtyard.jpg",
        label: "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
      };

  return {
    foyerLiving:
      prop.walkthroughRooms?.foyerLiving ?? mapped?.foyerLiving ?? defaultFoyer,
    kitchenCore:
      prop.walkthroughRooms?.kitchenCore ??
      mapped?.kitchenCore ??
      defaultKitchen,
    upperSuite:
      prop.walkthroughRooms?.upperSuite ??
      mapped?.upperSuite ??
      defaultUpper,
    patioTerrace:
      prop.walkthroughRooms?.patioTerrace ??
      mapped?.patioTerrace ??
      defaultPatio,
  };
}

/**
 * Builds a 5-Space Coherent Indoor-Outdoor Architectural Walkthrough for every property.
 * - Step 01: Asymmetric 35° Curbside Exterior Facade
 * - Step 02: Main Arrival Foyer & Great Room / Parlor (looking back out at matching porch/street)
 * - Step 03: Open-Concept Chef's Kitchen & Waterfall Quartz Island
 * - Step 04: Upstairs Primary Suite, Walk-In Closet & Porcelain Spa Bath
 * - Step 05: Connected Outdoor Living (Rear Covered Brick/Cedar Patio or Rooftop Pergola Terrace)
 */
export function buildCoherentWalkthrough(
  prop: PropertyListing
): [
  WalkthroughStop,
  WalkthroughStop,
  WalkthroughStop,
  WalkthroughStop,
  WalkthroughStop
] {
  const exteriorFrame = prop.triptych[0];
  const isCommercial = prop.category === "commercial";
  const isTownhouse = prop.category === "townhomes";

  const projectRooms = resolveProjectWalkthroughRooms(prop);
  const foyerLivingSrc = projectRooms.foyerLiving.src;
  const kitchenCoreSrc = projectRooms.kitchenCore.src;
  const upperSuiteSrc = projectRooms.upperSuite.src;
  const patioTerraceSrc = projectRooms.patioTerrace.src;

  const stops: [
    WalkthroughStop,
    WalkthroughStop,
    WalkthroughStop,
    WalkthroughStop,
    WalkthroughStop
  ] = [
    {
      stepNumber: "01",
      shortRoomName: isCommercial ? "Street Facade" : "Exterior Facade",
      zoneLabel: isCommercial ? "01 · Street Elevation" : "01 · Curbside Exterior",
      floorLevel: "Level 1 · Street Perspective (35° Oblique)",
      title: exteriorFrame.label,
      src: exteriorFrame.src,
      nightSrc: resolveNightImageSrc(exteriorFrame.src),
      spatialNarrative: isCommercial
        ? `Oblique street view of ${prop.title}. Tap the portal over the entrance or a thumbnail below to walk into the main lobby.`
        : `A 35° exterior view of ${prop.title}. Change the time of day to see golden-hour light or the night photograph with its 2700K interior lighting on.`,
      portalButtonLabel: isCommercial
        ? "Step Inside · 02 Atrium & Boardroom →"
        : "Step Inside · 02 Foyer & Living Room →",
      sunDirectionX: 18,
      sunDirectionY: 14,
      lightFixtures: [
        { xPercent: 25, yPercent: 34, radiusPx: 75, intensity: 0.52, label: "Upper Casement Window Glow" },
        { xPercent: 28, yPercent: 56, radiusPx: 88, intensity: 0.62, label: "Porch Sconce & Entry Glazing" },
        { xPercent: 46, yPercent: 36, radiusPx: 72, intensity: 0.48, label: "Second-Story Dormer Window" },
        { xPercent: 48, yPercent: 55, radiusPx: 84, intensity: 0.56, label: "Main Living Street Window" },
      ],
      hotspots: [
        {
          id: "ext-envelope",
          xPercent: 26,
          yPercent: 36,
          title: "Structural Masonry & Siding Envelope",
          csiDivision: "CSI DIV 04 & 07 · EXTERIOR ENVELOPE",
          materialSpec: exteriorFrame.src.includes("limestone")
            ? "Cut Quarry Limestone & Architectural Fiber-Cement"
            : "Full-Bed Clay Brick Veneer & Natural Cedar Siding",
          detail:
            "Asymmetric massing with rain-screen drainage plane and continuous exterior thermal insulation.",
        },
        {
          id: "ext-windows",
          xPercent: 54,
          yPercent: 42,
          title: "Low-E Black-Frame Architectural Glazing",
          csiDivision: "CSI DIV 08 · FENESTRATION",
          materialSpec: "Argon-Filled Solar-Control Casement Windows",
          detail:
            "Switch to 'Night & Lamps (09:30 PM)' to see warm 2700K interior illumination glowing through these windows.",
        },
        {
          id: "ext-entry",
          xPercent: 38,
          yPercent: 60,
          title: "Main Arrival Porch & Concrete Walk",
          csiDivision: "CSI DIV 03 · CONCRETE & ENTRY",
          materialSpec: "4,500 PSI Brushed Concrete with Control Joints",
          detail:
            "Click 'Step Inside · 02 Foyer & Living Room' to glide smoothly through this front entrance.",
        },
      ],
    },
    {
      stepNumber: "02",
      shortRoomName: isCommercial ? "Atrium & Lobby" : "Foyer & Living",
      zoneLabel: isCommercial
        ? "02 · Atrium & Boardroom"
        : "02 · Foyer & Living",
      floorLevel: "Level 1 · Main Arrival & Living Core",
      title: projectRooms.foyerLiving.label,
      src: foyerLivingSrc,
      nightSrc: resolveNightImageSrc(foyerLivingSrc),
      spatialNarrative: isCommercial
        ? "You have just entered the main lobby, with daylight from the entry glazing and the finishes that set the tone for the rest of the building."
        : "Through the front door, the black-framed windows look back at the same brick or stone porch pier from Step 01, while the white-oak floor leads straight to the kitchen.",
      portalButtonLabel: isCommercial
        ? "Walk Ahead · 03 Tenant & MEP Core →"
        : "Walk into Kitchen · 03 Chef's Kitchen →",
      sunDirectionX: 12,
      sunDirectionY: 28,
      lightFixtures: [
        { xPercent: 18, yPercent: 44, radiusPx: 135, intensity: 0.72, label: "Table Lamp & Window Bounce" },
        { xPercent: 42, yPercent: 28, radiusPx: 145, intensity: 0.75, label: "Kitchen Island Pendants" },
        { xPercent: 55, yPercent: 52, radiusPx: 125, intensity: 0.68, label: "Stone Hearth Fireplace Glow" },
      ],
      hotspots: [
        {
          id: "foyer-window-continuity",
          xPercent: 18,
          yPercent: 34,
          title: "Indoor-Outdoor Visual Continuity",
          csiDivision: "CSI DIV 08 · SIGHTLINE CONTINUITY",
          materialSpec: "Exterior Masonry Pier & Street Trees Visible Outside",
          detail:
            "Through the interior window mullions you see the exact exterior porch column and street landscape from Step 01.",
        },
        {
          id: "foyer-flooring",
          xPercent: 42,
          yPercent: 72,
          title: "Continuous Wide-Plank White-Oak Flooring",
          csiDivision: "CSI DIV 09 · HARDWOOD FLOORING",
          materialSpec: "7\" Rift & Quartered White Oak · Matte Urethane",
          detail:
            "Runs continuously from the entry foyer through the great room and into the open-concept kitchen.",
        },
        {
          id: "foyer-millwork",
          xPercent: 64,
          yPercent: 46,
          title: "Custom White-Oak Millwork & Kitchen Sightline",
          csiDivision: "CSI DIV 06 · ARCHITECTURAL WOODWORK",
          materialSpec: "Floor-to-Ceiling Custom Trim & Open Sightline",
          detail:
            "Select any of the 6 Designer Finish Palettes on the right to re-tone walls, millwork, and stone in real time.",
        },
      ],
    },
    {
      stepNumber: "03",
      shortRoomName: isCommercial ? "Tenant Core" : "Chef's Kitchen",
      zoneLabel: isCommercial
        ? "03 · Tenant & MEP Core"
        : "03 · Chef's Kitchen",
      floorLevel: "Level 1 · Culinary & Open-Concept Dining Core",
      title: projectRooms.kitchenCore.label,
      src: kitchenCoreSrc,
      nightSrc: resolveNightImageSrc(kitchenCoreSrc),
      spatialNarrative: isCommercial
        ? `Moving into the tenant core of ${prop.title}: interior finishes, architectural LED lighting and integrated MEP systems.`
        : "From the living room into the open kitchen: the waterfall island, custom cabinetry and warm pendants share the same white-oak floor and the view to the exterior masonry.",
      portalButtonLabel: isCommercial
        ? "Take Elevator · 04 Structural & Bay →"
        : "Walk Upstairs · 04 Suite & Spa Bath →",
      sunDirectionX: 16,
      sunDirectionY: 32,
      lightFixtures: [
        { xPercent: 48, yPercent: 24, radiusPx: 145, intensity: 0.78, label: "Brushed Brass Island Pendants" },
        { xPercent: 72, yPercent: 38, radiusPx: 130, intensity: 0.68, label: "Under-Cabinet & Range Hood LEDs" },
        { xPercent: 25, yPercent: 46, radiusPx: 120, intensity: 0.62, label: "Dining & Window Warm Bounce" },
      ],
      hotspots: [
        {
          id: "kit-cabinetry",
          xPercent: 46,
          yPercent: 34,
          title: "Custom Full-Overlay Shaker / Rift-Oak Cabinetry",
          csiDivision: "CSI DIV 06 & 12 · CASEWORK",
          materialSpec: "Soft-Close Dovetail Drawers & Integrated Hood",
          detail:
            "Try 'Hale Navy & Brushed Brass' or 'Forest Sage & Stone' to preview custom cabinet paint & stain packages.",
        },
        {
          id: "kit-stone",
          xPercent: 62,
          yPercent: 58,
          title: "3cm Waterfall Quartz Island & Bar",
          csiDivision: "CSI DIV 09 & 12 · STONE COUNTERTOPS",
          materialSpec: "Book-Matched Mitered Waterfall Quartz",
          detail:
            "Includes undermount workstation sink, brass/matte-black faucet, and seating overhang.",
        },
        {
          id: "kit-window",
          xPercent: 18,
          yPercent: 46,
          title: "Exterior Masonry Pier Sightline Window",
          csiDivision: "CSI DIV 08 · NATURAL DAYLIGHT",
          materialSpec: "Full-Height Black Mullions Framing Exterior Brick/Stone",
          detail:
            "Maintains visual continuity with the exterior facade while flooding the island with natural light.",
        },
      ],
    },
    {
      stepNumber: "04",
      shortRoomName: isCommercial ? "Systems & Bay" : "Suite & Spa Bath",
      zoneLabel: isCommercial
        ? "04 · Structural & Bay"
        : "04 · Suite & Spa Bath",
      floorLevel: isCommercial
        ? "Level 2 · Structural Envelope & Systems"
        : "Level 2 · Upstairs Primary Bedroom, Walk-In & Spa Bath",
      title: projectRooms.upperSuite.label,
      src: upperSuiteSrc,
      nightSrc: resolveNightImageSrc(upperSuiteSrc),
      spatialNarrative: isCommercial
        ? `Inside ${prop.title}: the structural frame, rated assemblies and acoustic insulation behind the finished space.`
        : "Up the white-oak stair to the primary suite and its porcelain spa bath, with a frameless glass shower and a view of the tree canopy.",
      portalButtonLabel: isCommercial
        ? "Step Outside · 05 Executive Terrace →"
        : isTownhouse
        ? "Step Outside · 05 Rooftop Terrace →"
        : "Step Outside · 05 Rear Covered Patio →",
      sunDirectionX: 78,
      sunDirectionY: 28,
      lightFixtures: [
        { xPercent: 18, yPercent: 34, radiusPx: 130, intensity: 0.72, label: "Backlit Vanity LED Mirrors" },
        { xPercent: 38, yPercent: 36, radiusPx: 125, intensity: 0.68, label: "Walk-In Closet Millwork LEDs" },
        { xPercent: 62, yPercent: 26, radiusPx: 120, intensity: 0.64, label: "Spa Shower Warm Recessed Spot" },
      ],
      hotspots: [
        {
          id: "suite-windows",
          xPercent: 20,
          yPercent: 36,
          title: "Upper-Level Tree-Canopy Windows & Vanity",
          csiDivision: "CSI DIV 08 & 09 · UPPER SUITE",
          materialSpec: "Acoustic Laminated Black Windows & Floating Oak Vanity",
          detail:
            "Frames the upper neighborhood tree canopy while matching the exterior window grid.",
        },
        {
          id: "suite-bath",
          xPercent: 66,
          yPercent: 44,
          title: "Frameless Glass Rain Shower & Soaking Tub",
          csiDivision: "CSI DIV 09 & 22 · SPA BATHROOM",
          materialSpec: "Large-Format Porcelain Tile & Brushed Brass Fixtures",
          detail:
            "Waterproofed wet-room assembly with linear drain, backlit mirror, and freestanding tub.",
        },
        {
          id: "suite-closet",
          xPercent: 38,
          yPercent: 56,
          title: "Custom White-Oak Walk-In & STC-60 Floor",
          csiDivision: "CSI DIV 06 & 09 · MILLWORK & ACOUSTICS",
          materialSpec: "Built-In White-Oak Wardrobe with Integrated LEDs",
          detail:
            "Sound-isolated floor and wall assembly ensuring complete privacy.",
        },
      ],
    },
    {
      stepNumber: "05",
      shortRoomName: isCommercial
        ? "Plaza Terrace"
        : isTownhouse
        ? "Rooftop Terrace"
        : "Rear Patio",
      zoneLabel: isCommercial
        ? "05 · Outdoor Terrace"
        : isTownhouse
        ? "05 · Rooftop Terrace"
        : "05 · Rear Covered Patio",
      floorLevel: isTownhouse
        ? "Level 3 · Private Rooftop Lounge & Pergola"
        : "Level 1 Rear · Indoor-Outdoor Covered Courtyard",
      title: projectRooms.patioTerrace.label,
      src: patioTerraceSrc,
      nightSrc: resolveNightImageSrc(patioTerraceSrc),
      spatialNarrative: isCommercial
        ? "The tour ends on the outdoor terrace, connected directly to the interior lounge."
        : isTownhouse
        ? "On the top level, the private terrace with a cedar pergola, a stainless outdoor kitchen and a view across the neighborhood's stepped brick rooftops."
        : "Out to the covered brick-and-cedar rear patio: through the black sliding doors you see the same white-oak kitchen and living room from the tour, closing the indoor-outdoor loop.",
      portalButtonLabel: "↺ Return to 01 · Curbside Exterior",
      sunDirectionX: 75,
      sunDirectionY: 18,
      lightFixtures: [
        { xPercent: 32, yPercent: 20, radiusPx: 125, intensity: 0.72, label: "Cedar Soffit Can Lights" },
        { xPercent: 24, yPercent: 48, radiusPx: 155, intensity: 0.76, label: "Warm Interior Kitchen Glow" },
        { xPercent: 48, yPercent: 52, radiusPx: 140, intensity: 0.70, label: "Living Room Hearth & Lamp Glow" },
      ],
      hotspots: [
        {
          id: "patio-continuity",
          xPercent: 24,
          yPercent: 46,
          title: "Sliding Glass Sightline Back into Kitchen",
          csiDivision: "CSI DIV 08 · INDOOR-OUTDOOR SLIDERS",
          materialSpec: "Multi-Panel Black Aluminum Low-E Sliding Doors",
          detail:
            "Look directly through the glass back into the white-oak kitchen island and great room from Steps 02 & 03.",
        },
        {
          id: "patio-structure",
          xPercent: 48,
          yPercent: 26,
          title: "Clear Western Cedar Soffit & Pergola",
          csiDivision: "CSI DIV 06 · EXTERIOR TIMBER",
          materialSpec: "Tongue-and-Groove Cedar Ceiling & Recessed LEDs",
          detail:
            "Switch to 'Golden Sunset' or 'Night & Lamps' to see the warm soffit and interior lights illuminate the patio.",
        },
        {
          id: "patio-hardscape",
          xPercent: 58,
          yPercent: 60,
          title: "Architectural Pavers & Masonry Piers",
          csiDivision: "CSI DIV 03 & 04 · OUTDOOR HARDSCAPE",
          materialSpec: "Frost-Proof Porcelain Pavers & Clay Brick Columns",
          detail:
            "Matches the exact front exterior masonry envelope from Step 01.",
        },
      ],
    },
  ];

  if (!isCommercial) return stops;
  return stops.map((stop) => {
    const text = COMMERCIAL_ROOM_TEXT[stop.stepNumber];
    if (!text) return stop;
    return {
      ...stop,
      floorLevel: text.floorLevel,
      lightFixtures: stop.lightFixtures.map((fixture, i) => ({ ...fixture, label: text.lights[i] ?? fixture.label })),
      hotspots: stop.hotspots.map((hotspot, i) => ({ ...hotspot, ...text.hotspots[i] })) as WalkthroughStop["hotspots"],
    };
  }) as typeof stops;
}

export function buildSpecialtyWalkthroughStops(
  service: MarketSpecialtyService,
  extraFrames?: { src: string; label: string }[]
): WalkthroughStop[] {
  const isUncoveredFraming = service.specialtyId === "framing";
  const baseCount = service.triptych.length;
  const seen = new Set(service.triptych.map((f) => f.src));
  const combinedPhotos: { src: string; label: string; caption?: string; tag?: string }[] = [
    ...service.triptych,
  ];
  for (const ef of extraFrames ?? []) {
    if (!seen.has(ef.src)) {
      seen.add(ef.src);
      combinedPhotos.push(ef);
    }
  }
  return combinedPhotos.map((photo, idx) => {
    const stepNumber = String(idx + 1).padStart(2, "0");
    const shortWords = photo.label
      .replace(/—/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
    const cleanCaption = (photo as unknown as { caption?: string }).caption;
    return {
      stepNumber,
      shortRoomName: shortWords || `View ${stepNumber}`,
      zoneLabel: service.specialtyLabel,
      floorLevel: service.specialtyLabel,
      title: photo.label,
      src: photo.src,
      nightSrc: idx < baseCount ? resolveNightImageSrc(photo.src) : photo.src,
      spatialNarrative: cleanCaption
        ? `${service.summary} — ${cleanCaption}`
        : `${service.summary} — ${photo.label}.`,
      portalButtonLabel:
        idx < combinedPhotos.length - 1
          ? `Next ${service.specialtyLabel} View →`
          : `First ${service.specialtyLabel} View →`,
      sunDirectionX: idx === 0 ? 74 : idx === 1 ? 30 : 58,
      sunDirectionY: 22,
      lightFixtures: isUncoveredFraming
        ? []
        : [
            {
              xPercent: 32,
              yPercent: 44,
              radiusPx: 120,
              intensity: 0.72,
              label: `${service.specialtyLabel} Primary Illumination`,
            },
            {
              xPercent: 68,
              yPercent: 48,
              radiusPx: 115,
              intensity: 0.68,
              label: `${service.specialtyLabel} Architectural Wash`,
            },
          ],
      hotspots: [
        {
          id: `${service.id}-spec-${idx}-1`,
          xPercent: 30,
          yPercent: 38,
          title: service.deliverables[0] ?? service.title,
          csiDivision: `${service.specialtyLabel} · Primary Assembly`,
          materialSpec:
            (photo as unknown as { tag?: string }).tag ?? photo.label,
          detail:
            (photo as unknown as { caption?: string }).caption ??
            service.summary,
        },
        {
          id: `${service.id}-spec-${idx}-2`,
          xPercent: 56,
          yPercent: 52,
          title: service.deliverables[1] ?? service.specialtyLabel,
          csiDivision: `${service.specialtyLabel} · Field Execution`,
          materialSpec: service.subtitle,
          detail: service.summary,
        },
        {
          id: `${service.id}-spec-${idx}-3`,
          xPercent: 74,
          yPercent: 36,
          title: service.deliverables[2] ?? "Quality Assurance",
          csiDivision: `${service.specialtyLabel} · Quality Verified`,
          materialSpec: photo.label,
          detail: `Use the Solar & Twilight slider or Compare Before/After curtain to inspect surface details under 24-hour lighting.`,
        },
      ],
    };
  });
}

function toShortWorkName(title: string): string {
  let clean = title.replace(/\s+Accents\b.*$/i, "");
  clean = clean.split(/\s+(?:&|and|with|on|in|for|—|-)\s+/i)[0]?.trim() ?? title;
  clean = clean.replace(/,\s*[^,]+$/, "").trim();
  if (clean.length > 40) {
    const words = clean.split(/\s+/);
    let acc = "";
    for (const w of words) {
      if ((acc ? `${acc} ${w}` : w).length <= 40) {
        acc = acc ? `${acc} ${w}` : w;
      } else {
        break;
      }
    }
    clean = acc;
  }
  return clean || title.slice(0, 40).trim();
}

export function PropertyWalkthroughStudioModal({
  property,
  initialStepIndex = 0,
  initialSolarHour = 12.5,
  initialSpecialtyId,
  extraSpecialtyFrames,
  onClose,
}: {
  property: PropertyListing;
  initialStepIndex?: number;
  initialSolarHour?: number;
  initialSpecialtyId?: string;
  extraSpecialtyFrames?: Partial<
    Record<string, { src: string; label: string }[]>
  >;
  onClose: () => void;
}) {
  const marketSpecialties = React.useMemo(
    () => getMarketSpecialtiesByCategory(property.category),
    [property.category]
  );

  const studioMode = initialSpecialtyId ? "specialty" : "walkthrough";
  const selectedSpecialtyId =
    initialSpecialtyId ?? marketSpecialties[0]?.specialtyId ?? "roofing";

  const activeSpecialty = React.useMemo(
    () =>
      marketSpecialties.find(
        (s) =>
          s.specialtyId === selectedSpecialtyId || s.id === selectedSpecialtyId
      ) ?? marketSpecialties[0],
    [marketSpecialties, selectedSpecialtyId]
  );

  const walkthroughStops = React.useMemo(
    () => buildCoherentWalkthrough(property),
    [property]
  );

  const specialtyStops = React.useMemo(
    () =>
      activeSpecialty
        ? buildSpecialtyWalkthroughStops(
            activeSpecialty,
            extraSpecialtyFrames?.[activeSpecialty.specialtyId]
          )
        : [],
    [activeSpecialty, extraSpecialtyFrames]
  );

  const stops =
    studioMode === "specialty" && specialtyStops.length > 0
      ? specialtyStops
      : walkthroughStops;

  const [activeStopIdx, setActiveStopIdx] = useState<number>(
    Math.max(0, Math.min(stops.length - 1, initialStepIndex))
  );

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const activeStop = stops[activeStopIdx] ?? stops[0];
  const activePalette = DESIGNER_PALETTES[0];
  const lighting = computeSolarLightingState(initialSolarHour);

  const allWalkthroughUrls = React.useMemo(
    () => stops.flatMap((s) => [s.src, s.nightSrc]),
    [stops]
  );

  useEffect(() => {
    preloadProtectedImages(allWalkthroughUrls);
  }, [allWalkthroughUrls]);

  const handleStepChange = useCallback(
    (nextIdx: number) => {
      const wrapped = ((nextIdx % stops.length) + stops.length) % stops.length;
      if (wrapped === activeStopIdx) return;
      waitForDecodedSurfaces(allWalkthroughUrls).then(() => {
        setActiveStopIdx(wrapped);
      });
    },
    [activeStopIdx, stops.length, allWalkthroughUrls]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < stops.length) {
          handleStepChange(idx);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stops.length, handleStepChange]);

  const combinedFilter =
    [
      activePalette.cssFilter !== "none" ? activePalette.cssFilter : "",
      lighting.baseFilter !== "none" ? lighting.baseFilter : "",
    ]
      .filter(Boolean)
      .join(" ") || "none";

  const shortWorkName = toShortWorkName(activeStop.title);

  return (
    <TaycoModalOverlay
      isOpen={true}
      onClose={onClose}
      onStepPrev={() => handleStepChange(activeStopIdx - 1)}
      onStepNext={() => handleStepChange(activeStopIdx + 1)}
      enableStageWheelStep={true}
      enableStageSwipe={true}
      backdropClassName="bg-[#040913] backdrop-blur-xl"
      ariaLabel={
        studioMode === "specialty" && activeSpecialty
          ? `${activeSpecialty.title} — ${property.title}`
          : `${property.title} Interactive Architectural Studio`
      }
    >
      {({ stageGestureHandlers }) => (
        <div
          data-walkthrough-studio-modal
          className="relative w-full max-w-[1280px] rounded-[26px] border overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.95)] h-[94dvh] min-h-[94dvh] max-h-[94dvh] flex flex-col bg-[#050A14]"
          style={{
            borderColor: "rgba(201, 168, 76, 0.38)",
            boxShadow:
              "0 40px 120px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── MINIMAL TOP BAR: COUNTER + CLOSE ── */}
          <div
            className="px-4 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 shrink-0"
            style={{
              background: "#060C18",
              borderColor: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <span className="text-xs font-mono font-bold text-[#F3D37A]">
              {activeStopIdx + 1} / {stops.length}
            </span>
            <button
              type="button"
              data-magnetic
              onClick={onClose}
              aria-label="Close studio"
              className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 rounded-full text-sm font-sans font-semibold bg-white/5 text-slate-200 border border-white/15 cursor-pointer hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300"
            >
              ✕
            </button>
          </div>

          {/* ── MAIN PHOTO VIEWPORT ── */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col items-stretch">
            <div
              ref={viewportRef}
              data-tayco-wheel-stage="true"
              onWheel={stageGestureHandlers.onWheel}
              onPointerDown={stageGestureHandlers.onPointerDown}
              onPointerUp={stageGestureHandlers.onPointerUp}
              className="relative flex-1 min-h-0 w-full overflow-hidden select-none bg-[#03060D] cursor-grab active:cursor-grabbing"
              style={{ isolation: "isolate" }}
            >
              <ProtectedImage
                src={activeStop.src}
                alt=""
                auditIgnore={true}
                loading="eager"
                className="home-gallery-backdrop"
              />
              {stops.map((stop, idx) => {
                const isCurrent = idx === activeStopIdx;
                return (
                  <div
                    key={stop.stepNumber}
                    aria-hidden={!isCurrent}
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    style={{
                      opacity: isCurrent ? 1 : 0,
                      transition: "opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)",
                      zIndex: isCurrent ? 2 : 1,
                    }}
                  >
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        filter: combinedFilter,
                        transition:
                          "filter 480ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      <ProtectedImage
                        src={stop.src}
                        syncUrls={allWalkthroughUrls}
                        alt={`${property.title} — ${stop.title}`}
                        loading="eager"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Left / Right Sleek Glassmorphic Arrows (>= 40 px) */}
              <button
                type="button"
                onClick={() => handleStepChange(activeStopIdx - 1)}
                aria-label="Previous room in walkthrough"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#050A14] border border-white/25 text-white hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300 cursor-pointer flex items-center justify-center shadow-2xl z-20"
                title="Previous (←)"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => handleStepChange(activeStopIdx + 1)}
                aria-label="Next room in walkthrough"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#050A14] border border-white/25 text-white hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300 cursor-pointer flex items-center justify-center shadow-2xl z-20"
                title="Next (→)"
              >
                ›
              </button>
            </div>

            {/* ── EQUILIBRIUM BOTTOM BAR: ONE SHORT WORK NAME + ONE REQUEST ESTIMATE CTA ── */}
            <div className="px-4 sm:px-6 py-3 bg-[#050A14] border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0">
              <h3 className="tayco-card-title text-sm sm:text-lg text-white tracking-tight truncate text-center sm:text-left">
                {shortWorkName}
              </h3>
              <Link
                href={`/estimate?property=${encodeURIComponent(
                  `${property.code} - ${property.title}`
                )}&category=${encodeURIComponent(property.category)}`}
                data-magnetic
                className="tayco-atelier-btn-gold !min-h-[42px] !px-4 !py-2 text-xs font-bold whitespace-nowrap shrink-0 text-center justify-center"
              >
                Request Estimate
              </Link>
            </div>
          </div>
        </div>
      )}
    </TaycoModalOverlay>
  );
}
