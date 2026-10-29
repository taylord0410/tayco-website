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
import { COMPANY } from "@/lib/company";

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
    subtitle: "Acabado original de fábrica (5600K)",
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
    subtitle: "SW 7008 Alabaster · Cuarzo Calacatta · Roble Miel",
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
    subtitle: "BM HC-154 Azul Naval · Mármol Carrara · Latón",
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
    subtitle: "SW 7069 Iron Ore · Nogal Americano · Granito Negro",
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
    subtitle: "SW 6208 Verde Salvia · Cuarcita Taj Mahal · Piedra",
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
    subtitle: "SW 6333 Terracota · Cedro Natural · Bronce Cálido",
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
/**
 * Maps any daytime architectural photo path to its real generated nighttime (9:30 PM)
 * counterpart in `/curated/properties/*-night.jpg`.
 */
export function resolveNightImageSrc(daySrc: string): string {
  const fileName = daySrc.split("/").pop() ?? "";
  const base = fileName.replace(/\.jpg$/i, "");
  if (!base) return daySrc;
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
      ambientOverlay: "transparent",
      ambientBlendMode: "normal" as const,
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
    baseFilter: "none",
    ambientOverlay: "transparent",
    ambientBlendMode: "normal" as const,
    ambientOpacity: 0,
    sunbeamColor: "transparent",
    sunbeamOpacity: 0,
    lampGlowStrength: 0,
    nightPhotoOpacity: nightBlend,
    isNight: true,
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
  const isTownhouse = prop.category === "townhouses";

  const isLimestoneOrModern =
    prop.id === "dpx-202" ||
    prop.id === "dpx-206" ||
    prop.id === "sfh-103" ||
    prop.id === "twn-302" ||
    prop.id === "twn-305";

  // Step 02: Entry Foyer & Living Room
  const foyerLivingSrc = isCommercial
    ? "/curated/properties/interior-commercial-boardroom-atrium.jpg"
    : isTownhouse
    ? "/curated/properties/interior-townhouse-living-bay.jpg"
    : prop.category === "single-family" &&
      (prop.id === "sfh-101" || prop.id === "sfh-104" || prop.id === "sfh-106")
    ? "/curated/properties/interior-singlefamily-greatroom-stone.jpg"
    : isLimestoneOrModern
    ? "/curated/properties/interior-limestone-modern-living.jpg"
    : prop.category === "single-family"
    ? "/curated/properties/interior-custom-foyer-oak-staircase.jpg"
    : "/curated/properties/interior-duplex-brick-living.jpg";

  // Step 03: Chef's Kitchen & Dining Core (or Commercial Limestone Reception Core)
  const kitchenCoreSrc = isCommercial
    ? "/curated/hero/com-lobby-limestone.jpg"
    : isTownhouse && (prop.id === "twn-303" || prop.id === "twn-305")
    ? "/curated/properties/interior-townhouse-parlor-kitchen.jpg"
    : isLimestoneOrModern
    ? "/curated/properties/interior-limestone-modern-kitchen.jpg"
    : "/curated/properties/interior-duplex-brick-kitchen.jpg";

  // Step 04: Upper Primary Suite & Spa Bath (or Commercial Wood-Slat Boardroom)
  const upperSuiteSrc = isCommercial
    ? "/curated/capabilities/com-boardroom.jpg"
    : prop.id === "sfh-102" ||
      prop.id === "sfh-105" ||
      prop.id === "dpx-202" ||
      prop.id === "twn-302"
    ? "/curated/properties/interior-primary-spa-bath-walkin.jpg"
    : "/curated/properties/interior-primary-suite-oak-bedroom.jpg";

  // Step 05: Coherent Outdoor Living / Rear Covered Patio / Rooftop Terrace
  const patioTerraceSrc = isCommercial
    ? "/curated/properties/interior-commercial-executive-lounge-terrace.jpg"
    : isTownhouse
    ? "/curated/properties/interior-townhouse-rooftop-terrace.jpg"
    : "/curated/properties/interior-duplex-rear-patio-courtyard.jpg";

  return [
    {
      stepNumber: "01",
      shortRoomName: isCommercial ? "Street Facade" : "Exterior Facade",
      zoneLabel: isCommercial ? "01 · Street Elevation" : "01 · Curbside Exterior",
      floorLevel: "Level 1 · Street Perspective (35° Oblique)",
      title: exteriorFrame.label,
      src: exteriorFrame.src,
      nightSrc: resolveNightImageSrc(exteriorFrame.src),
      spatialNarrative: isCommercial
        ? `Vista exterior oblicua de ${prop.title}. Haz clic en el portal sobre la entrada o en las miniaturas inferiores para entrar al Atrio Principal con transición suave.`
        : `Vista exterior en ángulo real de 35° de ${prop.title}. Cambia la Fase del Día para ver el atardecer dorado o la fotografía nocturna real con su iluminación interior de 2700K encendida.`,
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
          materialSpec: isLimestoneOrModern
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
      title: isCommercial
        ? "Double-Height Limestone Atrium & Glass Boardroom"
        : isTownhouse
        ? "Parlor Living Room & Polygonal 3-Window Street Bay"
        : "Entry Foyer, Great Room & Exterior Porch Sightline",
      src: foyerLivingSrc,
      nightSrc: resolveNightImageSrc(foyerLivingSrc),
      spatialNarrative: isCommercial
        ? "Acabas de entrar al atrio principal: la misma piedra caliza de la fachada continúa en el interior mientras los ventanales miran hacia los árboles de la calle."
        : "Al cruzar la puerta principal, observa por los ventanales negros exactamente el mismo pilar de ladrillo/piedra del porche exterior del Paso 01, mientras el piso de roble blanco conduce directo a la cocina.",
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
      title: isCommercial
        ? prop.triptych[1].label
        : "Open-Concept Chef's Kitchen, Waterfall Quartz Island & Custom Millwork",
      src: kitchenCoreSrc,
      nightSrc: resolveNightImageSrc(kitchenCoreSrc),
      spatialNarrative: isCommercial
        ? `Avanzando hacia el núcleo operativo de ${prop.title}, inspecciona la distribución libre de columnas, iluminación arquitectónica LED y sistemas MEP integrados.`
        : "Avanzas desde la sala hacia la cocina abierta: la isla de cuarzo en cascada, los gabinetes a medida y los colgantes cálidos mantienen el mismo piso de roble blanco y vista a la mampostería exterior.",
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
      title: isCommercial
        ? prop.triptych[2].label
        : "Upstairs Primary Suite, Walk-In Dressing Room & Porcelain Spa Bath",
      src: upperSuiteSrc,
      nightSrc: resolveNightImageSrc(upperSuiteSrc),
      spatialNarrative: isCommercial
        ? `En el segundo nivel de ${prop.title}, revisa la estructura de acero/concreto y aislamiento acústico de alto desempeño.`
        : "Subiendo al segundo nivel por la escalera de roble blanco, encuentras la Suite Principal y el baño spa en porcelanato con ducha de cristal sin marco y vista a las copas de los árboles.",
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
      title: isCommercial
        ? "Executive Mezzanine Lounge & Covered Limestone Terrace"
        : isTownhouse
        ? "Private Cedar-Pergola Rooftop Terrace & Outdoor Kitchen"
        : "Asymmetric Rear Covered Brick & Cedar Patio Looking into Kitchen",
      src: patioTerraceSrc,
      nightSrc: resolveNightImageSrc(patioTerraceSrc),
      spatialNarrative: isCommercial
        ? "Finalizamos el recorrido en la terraza corporativa techada con vista a los árboles de la avenida y conexión directa al lounge interior."
        : isTownhouse
        ? "En el último nivel salimos a la terraza privada con pergolado de cedro, cocina exterior en acero inoxidable y vista real a los techos escalonados de ladrillo del vecindario."
        : "Salimos al patio trasero techado en ladrillo y cedro: a través de las puertas corredizas negras ves hacia adentro la misma cocina de roble blanco y sala del recorrido, cerrando el circuito interior-exterior.",
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
}

type FinishSurfaceKey = "cabinetry" | "stone" | "flooring" | "hardware";

export function buildSpecialtyWalkthroughStops(
  service: MarketSpecialtyService
): WalkthroughStop[] {
  const isUncoveredFraming = service.specialtyId === "framing";
  return service.triptych.map((photo, idx) => {
    const stepNumber = `0${idx + 1}`;
    const shortWords = photo.label
      .replace(/—/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
    return {
      stepNumber,
      shortRoomName: shortWords || `View ${stepNumber}`,
      zoneLabel: `${service.code} · ${service.specialtyLabel}`,
      floorLevel: `STEP ${stepNumber} OF 03 · ${service.csiDivision} · ${service.title.toUpperCase()}`,
      title: photo.label,
      src: photo.src,
      nightSrc: resolveNightImageSrc(photo.src),
      spatialNarrative: `${service.summary} (${photo.caption})`,
      portalButtonLabel:
        idx < service.triptych.length - 1
          ? `Next ${service.specialtyLabel} View (0${idx + 2}) →`
          : `Return to View 01 · ${service.specialtyLabel} →`,
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
          csiDivision: `${service.csiDivision} · PRIMARY ASSEMBLY`,
          materialSpec: photo.tag,
          detail: photo.caption,
        },
        {
          id: `${service.id}-spec-${idx}-2`,
          xPercent: 56,
          yPercent: 52,
          title: service.deliverables[1] ?? service.specialtyLabel,
          csiDivision: `${service.csiDivision} · FIELD EXECUTION`,
          materialSpec: service.subtitle,
          detail: service.summary,
        },
        {
          id: `${service.id}-spec-${idx}-3`,
          xPercent: 74,
          yPercent: 36,
          title: service.deliverables[2] ?? "Quality Assurance",
          csiDivision: `${service.csiDivision} · INSPECTION VERIFIED`,
          materialSpec: photo.label,
          detail: `Use the Solar & Twilight slider or Compare Before/After curtain to inspect surface details under 24-hour lighting.`,
        },
      ],
    };
  });
}

export function PropertyWalkthroughStudioModal({
  property,
  initialStepIndex = 0,
  initialSolarHour = 12.5,
  initialSpecialtyId,
  onClose,
}: {
  property: PropertyListing;
  initialStepIndex?: number;
  initialSolarHour?: number;
  initialSpecialtyId?: string;
  onClose: () => void;
}) {
  const marketSpecialties = React.useMemo(
    () => getMarketSpecialtiesByCategory(property.category),
    [property.category]
  );

  const [studioMode, setStudioMode] = useState<"walkthrough" | "specialty">(
    initialSpecialtyId ? "specialty" : "walkthrough"
  );
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(
    initialSpecialtyId ?? marketSpecialties[0]?.specialtyId ?? "roofing"
  );

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
      activeSpecialty ? buildSpecialtyWalkthroughStops(activeSpecialty) : [],
    [activeSpecialty]
  );

  const stops =
    studioMode === "specialty" && specialtyStops.length > 0
      ? specialtyStops
      : walkthroughStops;

  const [activeStopIdx, setActiveStopIdx] = useState<number>(
    Math.max(0, Math.min(stops.length - 1, initialStepIndex))
  );
  const [selectedPaletteId, setSelectedPaletteId] =
    useState<string>("as-built");
  const [solarHour, setSolarHour] = useState<number>(initialSolarHour);
  const [isAutoCyclingDay, setIsAutoCyclingDay] = useState<boolean>(false);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [splitCompareMode, setSplitCompareMode] = useState<boolean>(false);
  const [splitPercent, setSplitPercent] = useState<number>(50);
  const [cinemaMode, setCinemaMode] = useState<boolean>(false);
  const [activeSurfaceTab, setActiveSurfaceTab] =
    useState<FinishSurfaceKey>("cabinetry");
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);

  const activeStop = stops[activeStopIdx] ?? stops[0];
  const activePalette =
    DESIGNER_PALETTES.find((p) => p.id === selectedPaletteId) ??
    DESIGNER_PALETTES[0];
  const lighting = computeSolarLightingState(solarHour);

  const allWalkthroughUrls = React.useMemo(
    () => stops.flatMap((s) => [s.src, s.nightSrc]),
    [stops]
  );

  useEffect(() => {
    preloadProtectedImages(allWalkthroughUrls);
  }, [allWalkthroughUrls]);

  useEffect(() => {
    setActiveHotspotId(activeStop.hotspots[0]?.id ?? null);
  }, [activeStopIdx, activeStop]);

  // Smooth 60fps-style Solar Progression when user clicks "▶ Simulate 24h"
  useEffect(() => {
    if (!isAutoCyclingDay) return;
    const timer = window.setInterval(() => {
      setSolarHour((prev) => {
        const next = prev + 0.25;
        return next > 22.0 ? 6.5 : Number(next.toFixed(2));
      });
    }, 110);
    return () => window.clearInterval(timer);
  }, [isAutoCyclingDay]);

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

  // Keyboard navigation: Left/Right arrows, 1-5 keys, C for Compare, F for Cinema, Esc to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleStepChange(activeStopIdx + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleStepChange(activeStopIdx - 1);
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (idx < stops.length) {
          handleStepChange(idx);
        }
      } else if (e.key === "c" || e.key === "C") {
        setSplitCompareMode((v) => !v);
      } else if (e.key === "f" || e.key === "F") {
        setCinemaMode((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeStopIdx, stops.length, handleStepChange, onClose]);

  const selectTimePreset = (preset: TimeOfDayPreset) => {
    setIsAutoCyclingDay(false);
    setSolarHour(preset.hourValue);
  };

  // Drag directly on viewport when split-compare is active
  const updateSplitFromPointer = (clientX: number) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const rawPct = ((clientX - rect.left) / rect.width) * 100;
    setSplitPercent(Math.max(6, Math.min(94, Math.round(rawPct))));
  };

  // Combined CSS filter (Palette + Time-of-Day Solar Filter)
  const combinedFilter =
    [
      activePalette.cssFilter !== "none" ? activePalette.cssFilter : "",
      lighting.baseFilter !== "none" ? lighting.baseFilter : "",
    ]
      .filter(Boolean)
      .join(" ") || "none";

  const activeHotspot =
    activeStop.hotspots.find((h) => h.id === activeHotspotId) ??
    activeStop.hotspots[0];

  const formatSolarHourLabel = (hr: number) => {
    const whole = Math.floor(hr);
    const mins = Math.round((hr - whole) * 60);
    const period = whole >= 12 ? "PM" : "AM";
    const displayHour = whole > 12 ? whole - 12 : whole === 0 ? 12 : whole;
    return `${String(displayHour).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )} ${period}`;
  };

  const surfaceDetails: Record<
    FinishSurfaceKey,
    { label: string; value: string; swatchHex: string }
  > = {
    cabinetry: {
      label: "Walls & Millwork",
      value: activePalette.cabinetryAndTrim,
      swatchHex: activePalette.swatches[0],
    },
    stone: {
      label: "Stone & Countertops",
      value: activePalette.countertopAndStone,
      swatchHex: activePalette.swatches[1],
    },
    flooring: {
      label: "Hardwood Flooring",
      value: activePalette.flooringAndWood,
      swatchHex: activePalette.swatches[2],
    },
    hardware: {
      label: "Hardware & Glazing",
      value: activePalette.hardwareAccent,
      swatchHex: activePalette.swatches[3],
    },
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="walkthrough-studio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#02050B]/90 backdrop-blur-2xl animate-[fadeIn_280ms_cubic-bezier(0.16,1,0.3,1)]"
      onClick={onClose}
    >
      <div
        data-walkthrough-studio-modal
        className="relative w-full max-w-[1440px] rounded-3xl border overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.95)] max-h-[95svh] flex flex-col bg-[#050A14]"
        style={{
          borderColor: "rgba(201, 168, 76, 0.38)",
          boxShadow:
            "0 40px 120px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LUXURY EDITORIAL TOP HEADER BAR ── */}
        <div
          className="px-4 sm:px-6 py-4 border-b flex flex-col items-center text-center gap-3 shrink-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(6,12,24,0.98) 0%, rgba(12,25,48,0.94) 50%, rgba(6,12,24,0.98) 100%)",
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="flex flex-col items-center text-center gap-1.5 min-w-0">
            <div className="flex items-center justify-center gap-2 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-[#C9A84C]">
              <span
                className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black tracking-wider shrink-0 shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #FCEBA7 0%, #E2B95B 48%, #B68522 100%)",
                  color: "#050A14",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
                }}
              >
                {studioMode === "specialty" && activeSpecialty
                  ? activeSpecialty.code
                  : property.code}
              </span>
              <span>
                {studioMode === "specialty" && activeSpecialty
                  ? `${activeSpecialty.specialtyLabel.toUpperCase()} · MARKET SPECIALTY STUDIO`
                  : "ARCHITECTURAL 5-ROOM WALKTHROUGH & BESPOKE ATELIER"}
              </span>
              <span className="hidden sm:inline text-white/25">•</span>
              <span className="hidden sm:inline text-slate-300">
                {property.location}
              </span>
            </div>
            <h2
              id="walkthrough-studio-title"
              className="tayco-card-title text-xl sm:text-2xl text-white tracking-tight"
            >
              {studioMode === "specialty" && activeSpecialty
                ? `${activeSpecialty.title} (${property.title})`
                : property.title}
            </h2>
          </div>

          {/* Sleek Luxury Action Bar: Centered row with Plus Jakarta Sans and data-magnetic */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              data-compare-toggle
              data-magnetic
              onClick={() => setSplitCompareMode((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold border cursor-pointer transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: splitCompareMode
                  ? "linear-gradient(135deg, #FCEBA7 0%, #E2B95B 48%, #B68522 100%)"
                  : "linear-gradient(145deg, rgba(22, 43, 82, 0.85) 0%, rgba(7, 14, 28, 0.95) 100%)",
                color: splitCompareMode ? "#050A14" : "#F8FAFC",
                borderColor: splitCompareMode
                  ? "#F3D37A"
                  : "rgba(243, 211, 122, 0.38)",
                boxShadow: splitCompareMode
                  ? "0 6px 18px rgba(201,168,76,0.4), inset 0 1px 0 rgba(255,255,255,0.7)"
                  : "inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              <StudioActionIcon
                kind={splitCompareMode ? "check" : "compare"}
                className="w-3.5 h-3.5"
              />
              <span>
                {splitCompareMode
                  ? "Before / After Split Active"
                  : "Compare Before / After"}
              </span>
            </button>

            <button
              type="button"
              data-magnetic
              onClick={() => setShowHotspots((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-sans font-medium border cursor-pointer transition-all duration-300"
              style={{
                background: showHotspots
                  ? "rgba(201, 168, 76, 0.18)"
                  : "rgba(255, 255, 255, 0.04)",
                borderColor: showHotspots
                  ? "rgba(243, 211, 122, 0.52)"
                  : "rgba(255, 255, 255, 0.14)",
                color: showHotspots ? "#F3D37A" : "#94A3B8",
              }}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  showHotspots ? "bg-[#F3D37A]" : "border border-slate-400"
                }`}
              />
              <span>{showHotspots ? "Spec Beacons (3)" : "Beacons Hidden"}</span>
            </button>

            <button
              type="button"
              data-cinema-toggle
              data-magnetic
              onClick={() => setCinemaMode((v) => !v)}
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold border cursor-pointer transition-all duration-300"
              style={{
                background: cinemaMode
                  ? "linear-gradient(135deg, #FCEBA7 0%, #E2B95B 48%, #B68522 100%)"
                  : "linear-gradient(145deg, rgba(22, 43, 82, 0.85) 0%, rgba(7, 14, 28, 0.95) 100%)",
                borderColor: cinemaMode
                  ? "#F3D37A"
                  : "rgba(243, 211, 122, 0.38)",
                color: cinemaMode ? "#050A14" : "#F3D37A",
              }}
              title="Toggle Widescreen Cinema Canvas (Shortcut: F)"
            >
              <StudioActionIcon
                kind={cinemaMode ? "exit-cinema" : "cinema"}
                className="w-3.5 h-3.5"
              />
              <span>{cinemaMode ? "Exit Cinema" : "Expand Cinema View"}</span>
            </button>

            <button
              type="button"
              data-magnetic
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-sans font-semibold bg-white/5 text-slate-200 border border-white/15 cursor-pointer hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300"
            >
              <StudioActionIcon kind="close" className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        </div>

        {/* ── UNIFIED PROJECT WALKTHROUGH ↔ 8 MARKET SPECIALTIES NAVIGATION BAR (ZERO GETTING LOST) ── */}
        {marketSpecialties.length > 0 && (
          <div
            className="px-4 sm:px-6 py-3 border-b flex flex-col items-center justify-center gap-2.5 text-center shrink-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(4,9,18,0.98) 0%, rgba(10,20,38,0.96) 100%)",
              borderColor: "rgba(201, 168, 76, 0.2)",
            }}
          >
            {/* Centered 2-Mode Switcher */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-full bg-[#03060D] border border-white/12">
              <button
                type="button"
                data-studio-mode="walkthrough"
                data-magnetic
                onClick={() => {
                  setStudioMode("walkthrough");
                  setActiveStopIdx(0);
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                style={{
                  background:
                    studioMode === "walkthrough"
                      ? "linear-gradient(135deg, #FCEBA7 0%, #E2B95B 48%, #B68522 100%)"
                      : "transparent",
                  color: studioMode === "walkthrough" ? "#050A14" : "#CBD5E1",
                  boxShadow:
                    studioMode === "walkthrough"
                      ? "0 4px 14px rgba(201,168,76,0.4), inset 0 1px 0 rgba(255,255,255,0.75)"
                      : "none",
                }}
              >
                <span>01 · 5-Space Connected Project Tour</span>
              </button>

              <button
                type="button"
                data-studio-mode="specialty"
                data-magnetic
                onClick={() => {
                  setStudioMode("specialty");
                  setActiveStopIdx(0);
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-sans font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                style={{
                  background:
                    studioMode === "specialty"
                      ? "linear-gradient(135deg, #FCEBA7 0%, #E2B95B 48%, #B68522 100%)"
                      : "transparent",
                  color: studioMode === "specialty" ? "#050A14" : "#CBD5E1",
                  boxShadow:
                    studioMode === "specialty"
                      ? "0 4px 14px rgba(201,168,76,0.4), inset 0 1px 0 rgba(255,255,255,0.75)"
                      : "none",
                }}
              >
                <span>
                  02 · 8 Construction Specialties ({marketSpecialties.length})
                </span>
              </button>
            </div>

            {/* Centered 8 Specialty Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {marketSpecialties.map((spec) => {
                const isSelected =
                  studioMode === "specialty" &&
                  activeSpecialty?.specialtyId === spec.specialtyId;
                return (
                  <button
                    key={spec.id}
                    type="button"
                    data-studio-specialty-pill={spec.specialtyId}
                    data-magnetic
                    onClick={() => {
                      setSelectedSpecialtyId(spec.specialtyId);
                      setStudioMode("specialty");
                      setActiveStopIdx(0);
                    }}
                    className="px-3 py-1 rounded-full text-[11px] font-sans font-semibold border transition-all duration-200 cursor-pointer hover:scale-[1.03]"
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, #FCEBA7 0%, #E2B95B 48%, #B68522 100%)"
                        : "rgba(15, 30, 56, 0.65)",
                      borderColor: isSelected
                        ? "#F3D37A"
                        : "rgba(255, 255, 255, 0.14)",
                      color: isSelected ? "#050A14" : "#CBD5E1",
                      boxShadow: isSelected
                        ? "0 4px 12px rgba(201,168,76,0.35)"
                        : "none",
                    }}
                  >
                    {spec.specialtyLabel}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MAIN INTERACTIVE BODY (NO UGLY SCROLLBARS, LUXURY PROPORTIONS) ── */}
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(201,168,76,0.25)_transparent] grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* LEFT STAGE (8 COLS OR 12 COLS IN CINEMA MODE): SILKY CROSSFADE VIEWPORT + FILMSTRIP DOCK */}
          <div
            className={`${
              cinemaMode ? "lg:col-span-12" : "lg:col-span-8"
            } flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/8 bg-[#03060D] transition-all duration-500`}
          >
            {/* 1. CINEMATIC MULTI-LAYER VIEWPORT WITH 720ms CROSSFADE & DOLLY ZOOM */}
            <div
              ref={viewportRef}
              onPointerDown={(e) => {
                if (!splitCompareMode) return;
                setIsDraggingSplit(true);
                updateSplitFromPointer(e.clientX);
              }}
              onPointerMove={(e) => {
                if (!splitCompareMode || !isDraggingSplit) return;
                updateSplitFromPointer(e.clientX);
              }}
              onPointerUp={() => setIsDraggingSplit(false)}
              onPointerLeave={() => setIsDraggingSplit(false)}
              className={`relative flex-1 min-h-[360px] sm:min-h-[440px] ${
                cinemaMode
                  ? "h-[420px] sm:h-[580px]"
                  : "h-[360px] sm:h-[480px]"
              } w-full overflow-hidden select-none bg-[#03060D] transition-all duration-500 ${
                splitCompareMode ? "cursor-ew-resize" : ""
              }`}
              style={{ isolation: "isolate" }}
            >
              {/* STACKED 5-ROOM LAYERED PHOTOS (DAY + REAL AI-GENERATED NIGHT) FOR SILKY-SMOOTH 720ms CROSSFADE + CAMERA DOLLY */}
              {stops.map((stop, idx) => {
                const isCurrent = idx === activeStopIdx;
                const zoomScale = isCurrent
                  ? "scale(1.0)"
                  : idx < activeStopIdx
                  ? "scale(1.06)"
                  : "scale(1.035)";
                return (
                  <div
                    key={stop.stepNumber}
                    aria-hidden={!isCurrent}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                      opacity: isCurrent ? 1 : 0,
                      transform: zoomScale,
                      filter: combinedFilter,
                      transition:
                        "opacity 720ms cubic-bezier(0.16, 1, 0.3, 1), transform 950ms cubic-bezier(0.16, 1, 0.3, 1), filter 750ms cubic-bezier(0.22, 1, 0.36, 1)",
                      zIndex: isCurrent ? 2 : 1,
                    }}
                  >
                    {/* Base Daytime Architectural Photograph */}
                    <ProtectedImage
                      src={stop.src}
                      syncUrls={allWalkthroughUrls}
                      alt={`${property.title} — ${stop.title}`}
                      loading="eager"
                      className="w-full h-full object-cover"
                    />
                    {/* Real AI-Generated Nighttime (9:30 PM) Photograph with Logical 2700K Interior Illumination */}
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        opacity: lighting.nightPhotoOpacity,
                        transition:
                          "opacity 750ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      <ProtectedImage
                        src={stop.nightSrc}
                        syncUrls={allWalkthroughUrls}
                        alt={`${property.title} — ${stop.title} (Night 2700K View)`}
                        loading="eager"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                );
              })}

              {/* Layer 2: Designer Color & Material Tint Overlay (Smooth 750ms Morph) */}
              <div
                className="absolute inset-0 pointer-events-none z-[3]"
                style={{
                  background: activePalette.tintOverlay,
                  mixBlendMode: activePalette.tintBlendMode,
                  opacity: activePalette.tintOpacity,
                  transition:
                    "opacity 750ms cubic-bezier(0.22, 1, 0.36, 1), background 750ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
              <div
                className="absolute inset-0 pointer-events-none z-[3]"
                style={{
                  background: activePalette.accentOverlay,
                  opacity: activePalette.accentOverlay !== "transparent" ? 1 : 0,
                  transition: "opacity 750ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />

              {/* Layer 3: Time-of-Day Ambient Sky / Twilight Blanket (Smooth 750ms Morph) */}
              <div
                className="absolute inset-0 pointer-events-none z-[4]"
                style={{
                  background: lighting.ambientOverlay,
                  mixBlendMode: lighting.ambientBlendMode,
                  opacity: lighting.ambientOpacity,
                  transition: "opacity 750ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />

              {/* Layer 4: Directional Solar Rays (Morning East Sun / Golden Hour Sunset) */}
              <div
                className="absolute inset-0 pointer-events-none z-[5]"
                style={{
                  background: `radial-gradient(ellipse 88% 68% at ${activeStop.sunDirectionX}% ${activeStop.sunDirectionY}%, ${lighting.sunbeamColor} 0%, rgba(251,191,36,0.18) 48%, transparent 82%)`,
                  mixBlendMode: "screen",
                  opacity: lighting.sunbeamOpacity,
                  transition: "opacity 750ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />

              {/* Layer 5: Refined Warm 2700K Architectural Light Cones & Floor Bounce (Sunset & Night) */}
              <div
                className="absolute inset-0 pointer-events-none z-[6]"
                style={{
                  opacity: lighting.lampGlowStrength,
                  transition: "opacity 800ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                {/* Subtle warm architectural floor/ceiling ambient bounce at night */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(251,191,36,0.08) 0%, rgba(251,191,36,0.16) 55%, rgba(217,119,6,0.18) 100%)",
                    mixBlendMode: "soft-light",
                  }}
                />
                {activeStop.lightFixtures.map((lamp, idx) => (
                  <div
                    key={lamp.label + idx}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
                    style={{
                      left: `${lamp.xPercent}%`,
                      top: `${lamp.yPercent}%`,
                      width: `${lamp.radiusPx * 2.2}px`,
                      height: `${lamp.radiusPx * 1.85}px`,
                      background:
                        "radial-gradient(ellipse at center, rgba(255,243,199,0.52) 0%, rgba(251,191,36,0.24) 38%, rgba(217,119,6,0.08) 68%, transparent 100%)",
                      mixBlendMode: "screen",
                      opacity: lamp.intensity,
                      filter: "blur(6px)",
                      transition: "all 700ms cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                ))}
              </div>

              {/* Layer 6: Interactive Split-Screen Before/After Comparison Curtain */}
              {splitCompareMode && (
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none z-10"
                  style={{
                    clipPath: `inset(0 ${100 - splitPercent}% 0 0)`,
                  }}
                >
                  <ProtectedImage
                    src={activeStop.src}
                    syncUrls={stops.map((s) => s.src)}
                    alt="Original As-Built Comparison"
                    loading="eager"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-20 left-4 px-3 py-1 rounded-full bg-[#050A14]/88 backdrop-blur-md border border-white/20 text-[11px] font-mono font-semibold text-white shadow-lg">
                    ◀ ORIGINAL AS-BUILT (12:30 PM)
                  </div>
                </div>
              )}

              {splitCompareMode && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-[#F3D37A] to-transparent shadow-[0_0_20px_rgba(243,211,122,0.9)] pointer-events-none z-20"
                  style={{ left: `${splitPercent}%` }}
                >
                  <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#050A14]/90 backdrop-blur-md text-[#F3D37A] font-mono font-black text-xs flex items-center justify-center shadow-2xl border border-[#F3D37A]">
                    ⇄
                  </div>
                </div>
              )}

              {/* Top Glassmorphic Spatial Progress Bar & Active Lighting/Finish Badges */}
              <div className="absolute top-3.5 left-3.5 right-3.5 flex flex-wrap items-center justify-between gap-2 z-20 pointer-events-none">
                {/* Interactive 5-Node Spatial Mini-Path */}
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full border backdrop-blur-xl pointer-events-auto"
                  style={{
                    background: "rgba(5, 10, 20, 0.72)",
                    borderColor: "rgba(255, 255, 255, 0.14)",
                  }}
                >
                  {stops.map((st, idx) => {
                    const isCurrent = idx === activeStopIdx;
                    return (
                      <React.Fragment key={st.stepNumber}>
                        <button
                          type="button"
                          onClick={() => handleStepChange(idx)}
                          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold transition-all duration-300 cursor-pointer"
                          style={{
                            background: isCurrent
                              ? "rgba(201, 168, 76, 0.28)"
                              : "transparent",
                            color: isCurrent ? "#F3D37A" : "#94A3B8",
                          }}
                          title={`Jump to ${st.zoneLabel}`}
                        >
                          {st.stepNumber}
                          {isCurrent ? ` · ${st.shortRoomName}` : ""}
                        </button>
                        {idx < stops.length - 1 && (
                          <span className="text-white/20 text-[9px]">─</span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Active Solar & Palette Glass Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    data-active-lighting-badge={lighting.phaseId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border backdrop-blur-xl"
                    style={{
                      background: "rgba(5, 10, 20, 0.74)",
                      borderColor: "rgba(243, 211, 122, 0.38)",
                      color: "#FEF08A",
                    }}
                  >
                    <SolarPhaseIcon
                      phase={lighting.phaseId}
                      className="w-3.5 h-3.5 text-[#F3D37A]"
                    />
                    <span>{lighting.phaseBadge}</span>
                  </span>

                  <span
                    data-active-palette-badge={activePalette.id}
                    className="px-3 py-1 rounded-full text-[11px] font-medium border backdrop-blur-xl flex items-center gap-1.5"
                    style={{
                      background: "rgba(5, 10, 20, 0.74)",
                      borderColor: "rgba(255, 255, 255, 0.16)",
                      color: "#F8FAFC",
                    }}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/80"
                      style={{ background: activePalette.swatches[0] }}
                    />
                    <span>{activePalette.shortLabel}</span>
                  </span>
                </div>
              </div>

              {/* Left / Right Sleek Glassmorphic Arrows */}
              <button
                type="button"
                onClick={() => handleStepChange(activeStopIdx - 1)}
                aria-label="Previous room in walkthrough"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#050A14]/65 backdrop-blur-xl border border-white/20 text-white hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] hover:scale-110 transition-all duration-300 cursor-pointer flex items-center justify-center shadow-2xl z-20"
                title="Previous Space (Shortcut: ←)"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => handleStepChange(activeStopIdx + 1)}
                aria-label="Next room in walkthrough"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#050A14]/65 backdrop-blur-xl border border-white/20 text-white hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] hover:scale-110 transition-all duration-300 cursor-pointer flex items-center justify-center shadow-2xl z-20"
                title="Next Space (Shortcut: →)"
              >
                ›
              </button>

              {/* Minimal Luxury Glassmorphic Spec Beacons (Clean Canvas — Label Expands Only on Active/Hovered Beacon!) */}
              {showHotspots &&
                activeStop.hotspots.map((spot, idx) => {
                  const isSelected = activeHotspot?.id === spot.id;
                  const isHovered = hoveredHotspotId === spot.id;
                  const showLabelPill = isSelected || isHovered;
                  return (
                    <button
                      key={spot.id}
                      type="button"
                      data-hotspot-pin={spot.id}
                      onClick={() => setActiveHotspotId(spot.id)}
                      onPointerEnter={() => setHoveredHotspotId(spot.id)}
                      onPointerLeave={() => setHoveredHotspotId(null)}
                      style={{
                        left: `${spot.xPercent}%`,
                        top: `${spot.yPercent}%`,
                      }}
                      aria-label={`Inspect ${spot.title}`}
                      className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group cursor-pointer focus:outline-none"
                    >
                      <span className="relative flex items-center justify-center">
                        {/* Subtle pulsing luxury halo */}
                        <span
                          className={`absolute w-9 h-9 rounded-full transition-all duration-500 ${
                            isSelected
                              ? "bg-[#C9A84C]/35 scale-125 animate-ping"
                              : "bg-white/15 scale-100 group-hover:scale-125"
                          }`}
                          style={{ animationDuration: "2.6s" }}
                        />
                        <span
                          className={`relative w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-300 shadow-xl backdrop-blur-md border ${
                            isSelected
                              ? "bg-[#C9A84C] text-[#050A14] border-white scale-110"
                              : "bg-[#050A14]/75 text-white border-white/45 hover:border-[#F3D37A] hover:scale-110"
                          }`}
                        >
                          0{idx + 1}
                        </span>
                      </span>

                      {/* Floating Glass Label — Only shown for the active or hovered beacon so the photo stays clean! */}
                      <span
                        className={`hidden sm:flex items-center gap-1.5 absolute ${
                          spot.xPercent > 55 ? "right-9" : "left-9"
                        } top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-[#050A14]/85 backdrop-blur-xl border border-[#C9A84C]/45 text-[11px] font-medium text-white shadow-2xl pointer-events-none transition-all duration-300 ${
                          showLabelPill
                            ? "opacity-100 translate-y-[-50%] scale-100"
                            : "opacity-0 translate-y-[-40%] scale-95"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F3D37A]" />
                        <span>{spot.title}</span>
                      </span>
                    </button>
                  );
                })}

              {/* Bottom Editorial Overlay: Room Title + Sleek Floating Portal Pill */}
              <div
                className="absolute bottom-0 inset-x-0 p-4 sm:px-8 sm:py-5 flex flex-col items-center text-center gap-2.5 z-20"
                style={{
                  background:
                    "linear-gradient(180deg, transparent 0%, rgba(5, 10, 20, 0.72) 48%, rgba(5, 10, 20, 0.95) 100%)",
                }}
              >
                <div className="max-w-2xl flex flex-col items-center text-center">
                  <div className="text-[11px] font-sans font-bold uppercase tracking-[0.2em] text-[#F6E6B8] drop-shadow">
                    {activeStop.floorLevel}
                  </div>
                  <h3 className="tayco-card-title text-lg sm:text-2xl text-white tracking-tight leading-snug mt-0.5 drop-shadow">
                    {activeStop.title}
                  </h3>
                </div>

                <button
                  type="button"
                  data-portal-next-room
                  data-magnetic
                  onClick={() => handleStepChange(activeStopIdx + 1)}
                  className="tayco-atelier-btn-gold px-5 py-2 text-xs font-bold"
                >
                  <span>{activeStop.portalButtonLabel}</span>
                </button>
              </div>
            </div>

            {/* Split Compare Fine Scrubber Bar (Visible when Split Compare is enabled) */}
            {splitCompareMode && (
              <div className="px-5 py-2 bg-[#071022] border-t border-white/10 flex items-center gap-4">
                <span className="text-[11px] font-mono text-[#F3D37A] shrink-0">
                  ⇄ Drag Photo or Slider (Original vs. {activePalette.shortLabel} ·{" "}
                  {formatSolarHourLabel(solarHour)}):
                </span>
                <input
                  type="range"
                  min={6}
                  max={94}
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(Number(e.target.value))}
                  aria-label="Split comparison slider"
                  className="w-full accent-[#C9A84C] cursor-pointer"
                />
                <span className="text-[11px] font-mono text-slate-300 shrink-0">
                  {splitPercent}%
                </span>
              </div>
            )}

            {/* 2. LUXURY GLASSMORPHIC FILMSTRIP DOCK (5 ROOMS OR 3 SPECIALTY VIEWS) */}
            <div className="px-4 sm:px-6 py-3 bg-[#050A14] border-t border-white/8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A84C]">
                    {studioMode === "specialty" && activeSpecialty
                      ? `${activeSpecialty.csiDivision} · ${activeSpecialty.specialtyLabel.toUpperCase()} 3-VIEW GALLERY`
                      : "CONNECTED 5-SPACE PROJECT WALKTHROUGH"}
                  </span>
                  <span className="hidden sm:inline text-[11px] text-slate-400">
                    — Click any view or press ← / → arrows for smooth transition
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  View {activeStop.stepNumber} of 0{stops.length}
                </span>
              </div>

              <div
                className={`grid ${
                  stops.length === 3 ? "grid-cols-3" : "grid-cols-5"
                } gap-2.5`}
                role="tablist"
                aria-label="Visual walkthrough filmstrip"
              >
                {stops.map((stop, idx) => {
                  const isCurrent = idx === activeStopIdx;
                  return (
                    <button
                      key={stop.stepNumber}
                      type="button"
                      role="tab"
                      data-walkthrough-step-tab={stop.stepNumber}
                      aria-selected={isCurrent}
                      onClick={() => handleStepChange(idx)}
                      className="group relative rounded-2xl overflow-hidden border text-left transition-all duration-300 cursor-pointer flex flex-col"
                      style={{
                        borderColor: isCurrent
                          ? "#E5C97B"
                          : "rgba(255, 255, 255, 0.1)",
                        transform: isCurrent ? "translateY(-2px)" : "none",
                        boxShadow: isCurrent
                          ? "0 10px 25px rgba(0,0,0,0.6), 0 0 0 1px rgba(229,201,123,0.45)"
                          : "none",
                      }}
                    >
                      <div className="relative h-14 sm:h-16 w-full overflow-hidden bg-[#03060D]">
                        <ProtectedImage
                          src={stop.src}
                          syncUrls={allWalkthroughUrls}
                          alt={stop.shortRoomName}
                          auditIgnore={true}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            opacity: lighting.nightPhotoOpacity,
                            transition:
                              "opacity 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                          }}
                        >
                          <ProtectedImage
                            src={stop.nightSrc}
                            syncUrls={allWalkthroughUrls}
                            alt={`${stop.shortRoomName} (Night)`}
                            auditIgnore={true}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        </div>
                        <div
                          className="absolute inset-0 transition-opacity duration-300"
                          style={{
                            background: isCurrent
                              ? "linear-gradient(180deg, transparent 40%, rgba(5,10,20,0.75) 100%)"
                              : "rgba(5,10,20,0.32)",
                          }}
                        />
                        <span
                          className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold backdrop-blur-md"
                          style={{
                            background: isCurrent
                              ? "#E5C97B"
                              : "rgba(5, 10, 20, 0.78)",
                            color: isCurrent ? "#050A14" : "#E2E8F0",
                          }}
                        >
                          {stop.stepNumber}
                        </span>
                      </div>
                      <div
                        className="px-2.5 py-1.5 text-[10px] sm:text-[11px] font-semibold truncate w-full transition-colors duration-300"
                        style={{
                          background: isCurrent
                            ? "rgba(201, 168, 76, 0.16)"
                            : "rgba(10, 19, 36, 0.85)",
                          color: isCurrent ? "#F3D37A" : "#CBD5E1",
                        }}
                      >
                        {stop.shortRoomName}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. ARCHITECTURAL NARRATIVE & ACTIVE BEACON INSPECTOR */}
            <div className="px-4 sm:px-6 py-3.5 bg-[#040811] border-t border-white/8 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6">
                <div className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A84C] mb-1">
                  SPATIAL CONTINUITY NOTE
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeStop.spatialNarrative}
                </p>
              </div>

              {activeHotspot && (
                <div
                  className="md:col-span-6 p-3 rounded-2xl border transition-all duration-300"
                  style={{
                    background:
                      "linear-gradient(145deg, rgba(15, 32, 64, 0.55) 0%, rgba(7, 14, 26, 0.85) 100%)",
                    borderColor: "rgba(201, 168, 76, 0.32)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black bg-[#C9A84C]/20 text-[#F3D37A] border border-[#C9A84C]/40">
                      BEACON SPEC
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {activeHotspot.csiDivision}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-white mt-1">
                    {activeHotspot.title} —{" "}
                    <span className="text-[#F3D37A] font-medium">
                      {activeHotspot.materialSpec}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                    {activeHotspot.detail}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT ATELIER PANEL (4 COLS, HIDDEN WHEN CINEMA MODE IS ON) */}
          {!cinemaMode && (
            <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between gap-4 bg-[#060C18]">
              <div className="space-y-4">
                {/* ── SECTION A: NATURAL SOLAR & TWILIGHT LIGHTING ATELIER ── */}
                <div
                  className="p-3.5 rounded-2xl border space-y-3"
                  style={{
                    background:
                      "linear-gradient(165deg, rgba(13, 27, 52, 0.65) 0%, rgba(6, 12, 24, 0.92) 100%)",
                    borderColor: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="text-center">
                      <div className="tayco-atelier-eyebrow text-[#C9A84C] justify-center">
                        24H SOLAR LIGHTING
                      </div>
                      <div className="tayco-card-title text-sm sm:text-base text-white mt-0.5">
                        Natural Daylight &amp; 2700K Night Illumination
                      </div>
                    </div>
                    <button
                      type="button"
                      data-auto-day-cycle
                      data-magnetic
                      onClick={() => setIsAutoCyclingDay((v) => !v)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-sans font-bold border cursor-pointer transition-all duration-300 shrink-0"
                      style={{
                        background: isAutoCyclingDay
                          ? "#E5C97B"
                          : "rgba(255, 255, 255, 0.05)",
                        color: isAutoCyclingDay ? "#050A14" : "#F3D37A",
                        borderColor: isAutoCyclingDay
                          ? "#E5C97B"
                          : "rgba(201, 168, 76, 0.4)",
                      }}
                    >
                      <StudioActionIcon
                        kind={isAutoCyclingDay ? "pause" : "play"}
                        className="w-3 h-3"
                      />
                      <span>
                        {isAutoCyclingDay ? "Pause 24h" : "Simulate 24h"}
                      </span>
                    </button>
                  </div>

                  {/* 4 Luxury Phase Pills */}
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_OF_DAY_PRESETS.map((preset) => {
                      const isSelected = lighting.phaseId === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          data-lighting-preset={preset.id}
                          data-magnetic
                          onClick={() => selectTimePreset(preset)}
                          className="p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-300 flex items-center gap-2.5"
                          style={{
                            background: isSelected
                              ? "linear-gradient(135deg, rgba(229,201,123,0.24) 0%, rgba(201,168,76,0.14) 100%)"
                              : "rgba(5, 10, 20, 0.65)",
                            color: "#F8FAFC",
                            borderColor: isSelected
                              ? "#E5C97B"
                              : "rgba(255, 255, 255, 0.08)",
                            boxShadow: isSelected
                              ? "0 4px 16px rgba(201,168,76,0.2)"
                              : "none",
                          }}
                        >
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-[#E5C97B] text-[#050A14]"
                                : "bg-white/5 text-[#F3D37A]"
                            }`}
                          >
                            <SolarPhaseIcon
                              phase={preset.id}
                              className="w-4 h-4"
                            />
                          </span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold truncate">
                              {preset.label}
                            </div>
                            <div
                              className={`text-[10px] font-mono truncate ${
                                isSelected ? "text-[#F3D37A]" : "text-slate-400"
                              }`}
                            >
                              {preset.timeDisplay}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Celestial Gradient Horizon Slider */}
                  <div className="pt-0.5">
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                      <span className="text-slate-400">Solar Horizon Arc:</span>
                      <span className="font-semibold text-[#F3D37A]">
                        {formatSolarHourLabel(solarHour)} · {lighting.kelvin}
                      </span>
                    </div>
                    <div
                      className="relative h-2.5 rounded-full p-0.5 flex items-center"
                      style={{
                        background:
                          "linear-gradient(90deg, #FDE68A 0%, #BAE6FD 36%, #F59E0B 72%, #1E1B4B 100%)",
                      }}
                    >
                      <input
                        type="range"
                        min={6.5}
                        max={22.0}
                        step={0.25}
                        value={solarHour}
                        onChange={(e) => {
                          setIsAutoCyclingDay(false);
                          setSolarHour(Number(e.target.value));
                        }}
                        aria-label="Time of day lighting slider"
                        className="w-full accent-[#F3D37A] cursor-pointer bg-transparent"
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                      <span>06:30 AM</span>
                      <span>12:30 PM</span>
                      <span>06:30 PM</span>
                      <span>10:00 PM</span>
                    </div>
                  </div>
                </div>

                {/* ── SECTION B: BESPOKE ARCHITECTURAL FINISH & COLOR ATELIER ── */}
                <div className="space-y-2">
                  <div className="flex flex-col items-center text-center gap-1 mb-2">
                    <div className="tayco-atelier-eyebrow text-[#C9A84C] justify-center">
                      CURATED DESIGNER MATERIAL PACKAGES
                    </div>
                    <div className="tayco-card-title text-sm sm:text-base text-white">
                      Curated Designer Material Packages
                    </div>
                    {selectedPaletteId !== "as-built" && (
                      <button
                        type="button"
                        data-magnetic
                        onClick={() => setSelectedPaletteId("as-built")}
                        className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-[#F3D37A] hover:underline cursor-pointer mt-0.5"
                      >
                        <StudioActionIcon kind="reset" className="w-3 h-3" />
                        <span>Reset to As-Built</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    {DESIGNER_PALETTES.map((pal) => {
                      const isSelected = pal.id === selectedPaletteId;
                      return (
                        <button
                          key={pal.id}
                          type="button"
                          data-palette-option={pal.id}
                          data-magnetic
                          onClick={() => setSelectedPaletteId(pal.id)}
                          className="w-full px-3 py-2 rounded-xl border text-left transition-all duration-300 cursor-pointer flex items-center justify-between gap-2.5"
                          style={{
                            background: isSelected
                              ? "linear-gradient(135deg, rgba(201,168,76,0.20) 0%, rgba(15,32,64,0.75) 100%)"
                              : "rgba(10, 19, 36, 0.55)",
                            borderColor: isSelected
                              ? "#E5C97B"
                              : "rgba(255, 255, 255, 0.08)",
                          }}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white flex items-center gap-1.5">
                              <span className="truncate">{pal.name}</span>
                              <span
                                className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium shrink-0"
                                style={{
                                  background: isSelected
                                    ? "rgba(229,201,123,0.25)"
                                    : "rgba(255,255,255,0.06)",
                                  color: isSelected ? "#F3D37A" : "#94A3B8",
                                }}
                              >
                                {pal.tierBadge}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 truncate mt-0.5">
                              {pal.subtitle}
                            </div>
                          </div>

                          {/* 4 Tactile Material Spheres */}
                          <div className="flex items-center -space-x-1.5 shrink-0">
                            {pal.swatches.map((hex, i) => (
                              <span
                                key={hex + i}
                                className="w-5 h-5 rounded-full border border-white/70 shadow-md transition-transform group-hover:scale-105"
                                style={{
                                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), ${hex} 70%)`,
                                }}
                              />
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── SECTION C: INTERACTIVE 4-SURFACE MATERIAL LOUPE ── */}
                <div
                  className="p-3 rounded-2xl border space-y-2"
                  style={{
                    background: "rgba(4, 8, 17, 0.85)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      Object.keys(surfaceDetails) as Array<FinishSurfaceKey>
                    ).map((key) => {
                      const item = surfaceDetails[key];
                      const isCurrent = activeSurfaceTab === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          data-magnetic
                          onClick={() => setActiveSurfaceTab(key)}
                          className="px-1.5 py-1.5 rounded-lg text-center cursor-pointer transition-all duration-200 border flex flex-col items-center justify-center"
                          style={{
                            background: isCurrent
                              ? "rgba(201, 168, 76, 0.18)"
                              : "rgba(255, 255, 255, 0.03)",
                            borderColor: isCurrent
                              ? "rgba(229, 201, 123, 0.5)"
                              : "transparent",
                          }}
                        >
                          <SurfaceSpecIcon
                            surface={key}
                            className={`w-3.5 h-3.5 ${
                              isCurrent ? "text-[#F3D37A]" : "text-slate-400"
                            }`}
                          />
                          <div
                            className={`text-[9px] font-semibold truncate mt-0.5 ${
                              isCurrent ? "text-[#F3D37A]" : "text-slate-400"
                            }`}
                          >
                            {key === "cabinetry"
                              ? "Millwork"
                              : key === "stone"
                              ? "Stone"
                              : key === "flooring"
                              ? "Flooring"
                              : "Hardware"}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2.5 pt-1 border-t border-white/8">
                    <span
                      className="w-7 h-7 rounded-full border border-white/80 shrink-0 shadow-inner"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), ${surfaceDetails[activeSurfaceTab].swatchHex} 70%)`,
                      }}
                    />
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-[#C9A84C]">
                        {surfaceDetails[activeSurfaceTab].label}
                      </div>
                      <div className="text-xs font-semibold text-white truncate">
                        {surfaceDetails[activeSurfaceTab].value}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA: Send Property + Selected Palette + Lighting to Estimate */}
              <div className="pt-3 border-t border-white/8 space-y-2 flex flex-col items-center text-center">
                <Link
                  href={`/estimate?property=${encodeURIComponent(
                    `${property.code} - ${property.title}`
                  )}&category=${encodeURIComponent(
                    property.category
                  )}&palette=${encodeURIComponent(
                    activePalette.name
                  )}&lighting=${encodeURIComponent(
                    `${formatSolarHourLabel(solarHour)} (${lighting.phaseBadge})`
                  )}`}
                  data-magnetic
                  className="tayco-atelier-btn-gold w-full py-3 px-4 text-xs font-bold"
                >
                  <span>
                    Request Specification &amp; Estimate ({activePalette.shortLabel})
                  </span>
                  <span className="w-5 h-5 rounded-full bg-[#050A14]/90 text-[#F3D37A] text-[11px] flex items-center justify-center">
                    →
                  </span>
                </Link>
                <div className="text-[10px] font-mono text-center text-slate-400">
                  Private Architectural Desk · {COMPANY.phoneDisplay}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
