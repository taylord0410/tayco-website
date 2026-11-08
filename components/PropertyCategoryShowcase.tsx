"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TaycoPillDock,
  TaycoCardMetaBar,
  TaycoDeliverableGrid,
  TaycoSpecGrid,
  TaycoCardFooterBar,
} from "@/components/ui/TaycoDesignSystem";
import ProtectedImage, {
  preloadProtectedImages,
  waitForDecodedSurfaces,
  VisualAssetIntegrityHud,
  computeVisualAssetId,
} from "@/components/ProtectedImage";
import {
  PropertyWalkthroughStudioModal,
  buildCoherentWalkthrough,
  DESIGNER_PALETTES,
  resolveNightImageSrc,
  SolarPhaseIcon,
  StudioActionIcon,
} from "@/components/PropertyWalkthroughStudio";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_LISTINGS,
  getPropertiesByCategory,
  getMarketSpecialtiesByCategory,
  type PropertyCategoryMeta,
  type PropertyCategorySlug,
  type PropertyListing,
  type MarketSpecialtyService,
  type MarketSpecialtyId,
  type MarketSpecialtyGroup,
} from "@/lib/property-catalog";
import { getResidentialTradesByDivision } from "@/components/division/ResidentialDivisionContent";
import { COMMERCIAL_CSI_TRADES } from "@/components/division/CommercialDivisionContent";
import { PHOTO_SPECIALTY } from "@/lib/photo-specialty";
import { COMPANY } from "@/lib/company";

function sanitizeExtraSpecialtyLabel(label: string): string {
  return label
    .replace(
      /\b(Single-Family|Residential|Multifamily|Multi-Family|Multi-Unit|Multi-Story|Duplex|Two-Flat|Triplex|Townhomes?|Townhouses?|Rowhouses?|Rowhomes?|Brownstones?|Commercial)\b/gi,
      ""
    )
    .replace(/^\s*[&·—–-]\s*/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function getDivisionExtraSpecialtyFrames(
  slug: PropertyCategorySlug
): Record<MarketSpecialtyId, { src: string; label: string }[]> {
  const result: Record<MarketSpecialtyId, { src: string; label: string }[]> = {
    roofing: [],
    siding: [],
    framing: [],
    drywall: [],
    flooring: [],
    concrete: [],
    stone: [],
    carpentry: [],
  };
  const seen = new Set<string>();
  const trades =
    slug === "commercial"
      ? COMMERCIAL_CSI_TRADES
      : getResidentialTradesByDivision(slug);
  for (const trade of trades) {
    for (const frame of trade.triptych) {
      if (seen.has(frame.src)) continue;
      const targetId = PHOTO_SPECIALTY[frame.src] ?? "carpentry";
      seen.add(frame.src);
      result[targetId].push({
        src: frame.src,
        label: sanitizeExtraSpecialtyLabel(frame.label) || trade.csiCode,
      });
    }
  }
  return result;
}

function SpecialtyVectorIcon({
  specialtyId,
  className = "w-4 h-4",
}: {
  specialtyId: MarketSpecialtyId;
  className?: string;
}) {
  switch (specialtyId) {
    case "roofing":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M3 13 12 4l9 9" />
          <path d="M6 10v10h12V10" />
          <path d="M9 14h6" />
        </svg>
      );
    case "siding":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18" />
          <path d="M3 14h18" />
        </svg>
      );
    case "framing":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M4 20V6l8-3 8 3v14" />
          <path d="M4 12h16" />
          <path d="M12 3v17" />
          <path d="m4 12 8-9 8 9" />
        </svg>
      );
    case "drywall":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <path d="M12 4v16" />
          <path d="M4 12h8" />
        </svg>
      );
    case "flooring":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
          <path d="M3 15h18" />
          <path d="M9 4v6" />
          <path d="M15 10v5" />
          <path d="M11 15v5" />
        </svg>
      );
    case "concrete":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <polygon points="12 3 21 8 12 13 3 8 12 3" />
          <polyline points="3 13 12 18 21 13" />
          <polyline points="3 17 12 22 21 17" />
        </svg>
      );
    case "stone":
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="14" rx="1.5" />
          <path d="M3 10h18" />
          <path d="M3 14h18" />
          <path d="M10 5v5" />
          <path d="M14 10v4" />
          <path d="M8 14v5" />
          <path d="M16 14v5" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
        >
          <path d="M4 6h16v12H4z" />
          <path d="M4 12h16" />
          <path d="M10 6v12" />
          <path d="M15 6v6" />
        </svg>
      );
  }
}

/**
 * Interactive 3-Photo Day/Sunset/Night Card for a Market-Specific Construction Specialty
 * (Roofing, Siding, Framing, Drywall, Flooring, Concrete, Stone, Carpentry/TI).
 */
function MarketSpecialtyInteractiveCard({
  service,
  extraFrames,
  marketLabel,
  onOpenSpecialtyStudio,
}: {
  service: MarketSpecialtyService;
  extraFrames?: { src: string; label: string }[];
  marketLabel: string;
  onOpenSpecialtyStudio?: (
    specialtyId: MarketSpecialtyId,
    stepIdx: number,
    solarHour: number
  ) => void;
}) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [mood, setMood] = useState<"day" | "sunset" | "night">("day");
  const [daylightMood, setDaylightMood] = useState<"day" | "sunset">("day");
  const [animateDaylight, setAnimateDaylight] = useState<boolean>(true);

  const handleSelectMood = (nextMood: "day" | "sunset" | "night") => {
    if (nextMood === mood) return;
    if (nextMood === "night") {
      setAnimateDaylight(false);
      setMood("night");
      return;
    }
    const comingFromNight = mood === "night";
    setAnimateDaylight(!comingFromNight);
    setDaylightMood(nextMood);
    setMood(nextMood);
  };

  const baseCount = service.triptych.length;
  const frames = React.useMemo(() => {
    const seen = new Set(service.triptych.map((f) => f.src));
    const dedupedExtras: { src: string; label: string }[] = [];
    for (const ef of extraFrames ?? []) {
      if (!seen.has(ef.src)) {
        seen.add(ef.src);
        dedupedExtras.push(ef);
      }
    }
    return [...service.triptych, ...dedupedExtras];
  }, [service.triptych, extraFrames]);
  const resolveFrameNightSrc = React.useCallback(
    (src: string, idx: number) =>
      idx < baseCount ? resolveNightImageSrc(src) : src,
    [baseCount]
  );
  const allUrls = React.useMemo(
    () =>
      frames.flatMap((f, idx) => [f.src, resolveFrameNightSrc(f.src, idx)]),
    [frames, resolveFrameNightSrc]
  );
  const currentFrame = frames[activeIdx] ?? frames[0];
  const currentNightSrc = resolveFrameNightSrc(currentFrame.src, activeIdx);
  const currentPairUrls = React.useMemo(
    () => [currentFrame.src, currentNightSrc],
    [currentFrame.src, currentNightSrc]
  );
  const currentAssetId = computeVisualAssetId(currentFrame.src);

  const selectFrame = (idx: number) => {
    const target = frames[idx] ?? frames[0];
    preloadProtectedImages(allUrls);
    waitForDecodedSurfaces([
      target.src,
      resolveFrameNightSrc(target.src, idx),
    ]).then(() => {
      setActiveIdx(idx);
    });
  };

  const cardFilter =
    daylightMood === "sunset"
      ? "brightness(0.96) contrast(1.12) saturate(1.28) sepia(0.20)"
      : "none";

  const moodSolarHour =
    mood === "night" ? 21.5 : mood === "sunset" ? 18.5 : 13.5;

  return (
    <article
      id={service.id}
      data-specialty-card={service.code}
      data-response-kind="surface"
      onPointerEnter={() => preloadProtectedImages(allUrls)}
      className="relative rounded-[24px] border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.72)]"
      style={{
        background:
          "linear-gradient(165deg, rgba(15, 32, 64, 0.95) 0%, rgba(7, 14, 26, 0.99) 100%)",
        borderColor: "rgba(201, 168, 76, 0.45)",
      }}
    >
      <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
      <div>
        {/* Clean Architectural Header Bar — Specialty Name + Day/Sunset/Night Switcher (Zero Badges on Photo) */}
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-[#050A14] border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <SpecialtyVectorIcon
              specialtyId={service.specialtyId}
              className="w-4 h-4 text-[#F3D37A] shrink-0"
            />
            <h3 className="tayco-card-title text-lg sm:text-xl text-white">
              {service.title}
            </h3>
          </div>

          <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#070E1A] border border-white/15 shrink-0">
            {(
              [
                { id: "day", label: "Day" },
                { id: "sunset", label: "Sunset" },
                { id: "night", label: "Night" },
              ] as const
            ).map((m) => {
              const active = mood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  data-magnetic
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectMood(m.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 min-h-[28px] whitespace-nowrap rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all duration-300"
                  style={{
                    background: active ? "#E5C97B" : "transparent",
                    color: active ? "#050A14" : "#CBD5E1",
                  }}
                  title={`Preview ${m.label} photography`}
                >
                  <SolarPhaseIcon phase={m.id} className="w-2.5 h-2.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary Unobstructed Photograph — Click to Expand Full-Screen Lightbox Studio */}
        <div
          role="button"
          tabIndex={0}
          data-visual-slot={service.id}
          onClick={() =>
            onOpenSpecialtyStudio?.(
              service.specialtyId,
              activeIdx,
              moodSolarHour
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenSpecialtyStudio?.(
                service.specialtyId,
                activeIdx,
                moodSolarHour
              );
            }
          }}
          aria-label={`Expand ${service.title} gallery`}
          className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#03060D] select-none cursor-pointer group/specphoto"
        >
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
            style={{
              filter: cardFilter,
              transition: animateDaylight
                ? "filter 480ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
            }}
          >
            <ProtectedImage
              src={currentFrame.src}
              syncUrls={currentPairUrls}
              loading="eager"
              alt={currentFrame.label}
              className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover/specphoto:scale-[1.02]"
            />
          </div>

          {/* Sunset Warmth Overlay */}
          <div
            className="absolute inset-0 pointer-events-none z-[2]"
            style={{
              opacity: daylightMood === "sunset" ? 1 : 0,
              transition: animateDaylight
                ? "opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)"
                : "none",
              background:
                "linear-gradient(155deg, rgba(251,146,60,0.34) 0%, rgba(217,119,6,0.22) 55%, rgba(30,27,75,0.35) 100%)",
              mixBlendMode: "soft-light",
            }}
          />

          {/* Real Nighttime Architectural Layer */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
            style={{
              opacity: mood === "night" ? 1 : 0,
              transition: "opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <ProtectedImage
              src={currentNightSrc}
              syncUrls={currentPairUrls}
              auditIgnore={true}
              loading="eager"
              alt={currentFrame.label}
              className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover/specphoto:scale-[1.02]"
            />
          </div>
        </div>

        {/* Simultaneous 3-Photo Gallery Grid — All 3 Specialty Photographs Visible at Once */}
        <div
          className="grid grid-cols-3 gap-2 p-2 bg-[#040811] border-t border-white/10"
          role="group"
          aria-label={`${service.title} gallery`}
        >
          {frames.map((f, idx) => {
            const isSelected = idx === activeIdx;
            const thumbSrc =
              mood === "night" ? resolveFrameNightSrc(f.src, idx) : f.src;
            return (
              <button
                key={f.src}
                type="button"
                data-magnetic
                onClick={() => {
                  selectFrame(idx);
                  if (idx < baseCount) {
                    onOpenSpecialtyStudio?.(
                      service.specialtyId,
                      idx,
                      moodSolarHour
                    );
                  }
                }}
                onPointerEnter={() => selectFrame(idx)}
                className="relative h-20 sm:h-24 rounded-xl overflow-hidden border transition-all cursor-pointer group/thumb"
                style={{
                  borderColor: isSelected
                    ? "#F3D37A"
                    : "rgba(255, 255, 255, 0.12)",
                  boxShadow: isSelected
                    ? "0 0 0 1px rgba(243, 211, 122, 0.45)"
                    : "none",
                }}
                title={f.label}
              >
                <ProtectedImage
                  src={thumbSrc}
                  auditIgnore={true}
                  loading="lazy"
                  alt={f.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-105"
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimalist Architectural Footer Bar */}
      <div className="px-4 sm:px-5 py-3.5 bg-[#050A14]/90 border-t border-white/10">
        <TaycoCardFooterBar
          leftMeta={
            <span className="text-xs text-slate-300 truncate">
              {currentFrame.label}
            </span>
          }
        >
          <button
            type="button"
            data-magnetic
            data-specialty-studio-trigger={service.code}
            onClick={() =>
              onOpenSpecialtyStudio?.(
                service.specialtyId,
                activeIdx,
                moodSolarHour
              )
            }
            title={`Expand ${service.title} gallery`}
            className="tayco-atelier-btn-gold !min-h-[38px] !py-1.5 !px-3.5 whitespace-nowrap shrink-0 group/btn"
          >
            <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5 shrink-0" />
            <span>View Gallery</span>
            <StudioActionIcon
              kind="arrow-right"
              className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-0.5"
            />
          </button>
        </TaycoCardFooterBar>
      </div>
    </article>
  );
}

/**
 * Interactive 5-Room Card Header used on `/properties/[category]` and `/properties`.
 * - Displays main photograph + all 5 room photographs simultaneously in a clean gallery strip.
 * - Clicking any photo immediately launches the full 5-Room Walkthrough, Day/Night Lighting & Color Studio.
 */
function PropertyCardInteractiveStage({
  property,
  onOpenStudio,
}: {
  property: PropertyListing;
  onOpenStudio: (stepIdx: number, solarHour?: number) => void;
}) {
  const stops = React.useMemo(
    () => buildCoherentWalkthrough(property),
    [property]
  );
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [cardMood, setCardMood] = useState<"day" | "sunset" | "night">("day");
  const [daylightMood, setDaylightMood] = useState<"day" | "sunset">("day");
  const [animateDaylight, setAnimateDaylight] = useState<boolean>(true);

  const handleSelectCardMood = (nextMood: "day" | "sunset" | "night") => {
    if (nextMood === cardMood) return;
    if (nextMood === "night") {
      setAnimateDaylight(false);
      setCardMood("night");
      return;
    }
    const comingFromNight = cardMood === "night";
    setAnimateDaylight(!comingFromNight);
    setDaylightMood(nextMood);
    setCardMood(nextMood);
  };

  const allUrls = React.useMemo(
    () => stops.flatMap((s) => [s.src, s.nightSrc]),
    [stops]
  );
  const currentStop = stops[activeIdx] ?? stops[0];
  const currentPairUrls = React.useMemo(
    () => [currentStop.src, currentStop.nightSrc],
    [currentStop.src, currentStop.nightSrc]
  );

  const selectRoomPreview = (idx: number) => {
    const target = stops[idx] ?? stops[0];
    preloadProtectedImages(allUrls);
    waitForDecodedSurfaces([target.src, target.nightSrc]).then(() => {
      setActiveIdx(idx);
    });
  };

  const cardFilter =
    daylightMood === "sunset"
      ? "brightness(0.96) contrast(1.12) saturate(1.28) sepia(0.20)"
      : "none";

  const moodSolarHour =
    cardMood === "night" ? 21.5 : cardMood === "sunset" ? 18.5 : 12.5;

  return (
    <div
      className="bg-[#040811] border-b border-white/8"
      onPointerEnter={() => preloadProtectedImages(allUrls)}
    >
      {/* Top Bar Outside Photo — Room Name + Day/Sunset/Night Switcher (Zero Badges on Photo) */}
      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between px-3.5 py-2.5 bg-[#050A14] border-b border-white/10">
        <span className="text-xs font-semibold text-slate-200">
          {currentStop.shortRoomName}
        </span>

        <div
          className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#070E1A] border border-white/15 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {(
            [
              { id: "day", label: "Day" },
              { id: "sunset", label: "Sunset" },
              { id: "night", label: "Night" },
            ] as const
          ).map((m) => {
            const active = cardMood === m.id;
            return (
              <button
                key={m.id}
                type="button"
                data-magnetic
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectCardMood(m.id);
                }}
                className="inline-flex items-center gap-1 px-2.5 min-h-[28px] whitespace-nowrap rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all duration-300"
                style={{
                  background: active ? "#E5C97B" : "transparent",
                  color: active ? "#050A14" : "#CBD5E1",
                }}
                title={`Preview ${m.label} lighting`}
              >
                <SolarPhaseIcon phase={m.id} className="w-2.5 h-2.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Unobstructed Clickable Photo Stage */}
      <div
        role="button"
        tabIndex={0}
        data-visual-slot={property.id}
        onClick={() => onOpenStudio(activeIdx, moodSolarHour)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenStudio(activeIdx, moodSolarHour);
          }
        }}
        aria-label={`Open gallery for ${property.title}`}
        className="relative h-64 sm:h-72 w-full overflow-hidden cursor-pointer group/photo select-none bg-[#03060D]"
      >
        <div
          className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
          style={{
            filter: cardFilter,
            transition: animateDaylight
              ? "filter 480ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
          }}
        >
          <ProtectedImage
            src={currentStop.src}
            syncUrls={currentPairUrls}
            loading="eager"
            alt={currentStop.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover/photo:scale-[1.02]"
          />
        </div>

        {/* Sunset Overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-[2]"
          style={{
            opacity: daylightMood === "sunset" ? 1 : 0,
            transition: animateDaylight
              ? "opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)"
              : "none",
            background:
              "linear-gradient(155deg, rgba(251,146,60,0.34) 0%, rgba(217,119,6,0.22) 55%, rgba(30,27,75,0.35) 100%)",
            mixBlendMode: "soft-light",
          }}
        />

        {/* Real Nighttime Photograph */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
          style={{
            opacity: cardMood === "night" ? 1 : 0,
            transition: "opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <ProtectedImage
            src={currentStop.nightSrc}
            syncUrls={currentPairUrls}
            auditIgnore={true}
            loading="eager"
            alt={currentStop.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover/photo:scale-[1.02]"
          />
        </div>
      </div>

      {/* 5-Photo Simultaneous Room Thumbnail Gallery Strip */}
      <div
        className="grid grid-cols-5 gap-1.5 p-2 bg-[#050A14] border-t border-white/10"
        role="group"
        aria-label={`Preview spaces of ${property.title}`}
      >
        {stops.map((st, idx) => {
          const isCurrent = idx === activeIdx;
          const thumbSrc = cardMood === "night" ? st.nightSrc : st.src;
          return (
            <button
              key={st.stepNumber}
              type="button"
              data-magnetic
              onClick={() => {
                selectRoomPreview(idx);
                onOpenStudio(idx, moodSolarHour);
              }}
              onPointerEnter={() => selectRoomPreview(idx)}
              className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer border bg-[#070E1A] flex flex-col"
              style={{
                borderColor: isCurrent
                  ? "#E5C97B"
                  : "rgba(255, 255, 255, 0.1)",
              }}
              title={st.shortRoomName}
            >
              <div className="relative h-12 sm:h-14 w-full overflow-hidden">
                <ProtectedImage
                  src={thumbSrc}
                  auditIgnore={true}
                  loading="lazy"
                  alt={st.shortRoomName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="px-1 py-1 text-[10px] font-medium text-slate-200 truncate text-center w-full">
                {st.shortRoomName}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Prominent 4-Category Property Showcase Section for the Landing Page (`/`),
 * `/single-family`, `/multifamily`, `/townhomes` and `/commercial`.
 * - Clicking a category opens `/properties/[category]`.
 * - Clicking "✦ Interactive Tour, Day/Night & Colors" or any featured property chip
 *   immediately launches the 5-Room Walkthrough & Lighting/Color Studio right on the page!
 */
export function LandingPropertyCategoriesSection() {
  const [activeThumbMap, setActiveThumbMap] = useState<Record<string, number>>(
    {}
  );
  const [categoryMoodMap, setCategoryMoodMap] = useState<
    Record<string, "day" | "sunset" | "night">
  >({});
  const [categoryDaylightMoodMap, setCategoryDaylightMoodMap] = useState<
    Record<string, "day" | "sunset">
  >({});
  const [categoryAnimateDaylightMap, setCategoryAnimateDaylightMap] = useState<
    Record<string, boolean>
  >({});

  const handleSelectCategoryMood = (
    slug: string,
    nextMood: "day" | "sunset" | "night"
  ) => {
    const prevMood = categoryMoodMap[slug] ?? "day";
    if (nextMood === prevMood) return;
    if (nextMood === "night") {
      setCategoryAnimateDaylightMap((prev) => ({ ...prev, [slug]: false }));
      setCategoryMoodMap((prev) => ({ ...prev, [slug]: "night" }));
      return;
    }
    const comingFromNight = prevMood === "night";
    setCategoryAnimateDaylightMap((prev) => ({
      ...prev,
      [slug]: !comingFromNight,
    }));
    setCategoryDaylightMoodMap((prev) => ({ ...prev, [slug]: nextMood }));
    setCategoryMoodMap((prev) => ({ ...prev, [slug]: nextMood }));
  };
  const [studioProperty, setStudioProperty] = useState<PropertyListing | null>(
    null
  );
  const [studioSpecialtyId, setStudioSpecialtyId] = useState<
    string | undefined
  >(undefined);
  const [studioSolarHour, setStudioSolarHour] = useState<number>(12.5);
  const [mobileMarketSlug, setMobileMarketSlug] = useState<string>(
    PROPERTY_CATEGORIES[0].slug
  );

  useEffect(() => {
    const allPreviewUrls: string[] = [];
    for (const cat of PROPERTY_CATEGORIES) {
      for (const u of [cat.heroImage, ...cat.secondaryImages]) {
        allPreviewUrls.push(u, resolveNightImageSrc(u));
      }
    }
    const timer = window.setTimeout(
      () => preloadProtectedImages(allPreviewUrls),
      1400
    );
    return () => window.clearTimeout(timer);
  }, []);

  const handleSelectPreview = (slug: string, idx: number, urls: string[]) => {
    const targetUrl = urls[idx] ?? urls[0];
    waitForDecodedSurfaces([
      targetUrl,
      resolveNightImageSrc(targetUrl),
    ]).then(() => {
      setActiveThumbMap((prev) => ({ ...prev, [slug]: idx }));
    });
  };

  const openCategoryStudio = (
    prop: PropertyListing,
    mood: "day" | "sunset" | "night" = "day",
    specialtyId?: string
  ) => {
    const hour = mood === "night" ? 21.5 : mood === "sunset" ? 18.5 : 12.5;
    setStudioSolarHour(hour);
    setStudioSpecialtyId(specialtyId);
    setStudioProperty(prop);
  };

  return (
    <section
      id="tayco-property-categories"
      aria-labelledby="property-categories-heading"
      className="relative py-10 sm:py-22 px-4 sm:px-8 border-b overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #070E1A 0%, #0B172A 52%, #070E1A 100%)",
        borderColor: "rgba(201, 168, 76, 0.32)",
      }}
    >
      {/* Subtle architectural blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Executive Header */}
        <div className="flex flex-col items-center text-center max-w-6xl mx-auto pb-6 mb-6 border-b border-[#C9A84C]/25">
          <h2
            id="property-categories-heading"
            className="tayco-display-title text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.08]"
          >
            Architectural{" "}
            <em
              className="tayco-serif-em font-normal"
              style={{ color: "#F3D37A" }}
            >
              Portfolio.
            </em>
          </h2>

          {/* Mobile market switcher — one market at a time */}
          <div
            role="tablist"
            aria-label="Choose your construction market"
            className="mt-5 grid w-full max-w-md grid-cols-2 gap-2 md:hidden"
          >
            {PROPERTY_CATEGORIES.map((cat) => {
              const active = cat.slug === mobileMarketSlug;
              return (
                <button
                  key={cat.slug}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMobileMarketSlug(cat.slug)}
                  className={`min-h-[44px] rounded-xl border px-3 text-xs font-semibold transition-all ${
                    active
                      ? "border-[#F3D37A] bg-gradient-to-br from-[#f6e29c] via-[#d9b14a] to-[#b58928] text-slate-950"
                      : "border-[#C9A84C]/35 bg-[#0F2040]/80 text-[#F3D37A]"
                  }`}
                >
                  {cat.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Direct 4-Category Quick-Links */}
          <TaycoPillDock ariaLabel="Choose your construction market" className="mt-5 max-md:hidden">
            {PROPERTY_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/${cat.slug}`}
                data-magnetic
                className="tayco-atelier-btn-obsidian !px-4 !py-2 !text-[11px] !tracking-[0.08em]"
              >
                <span>{cat.shortLabel}</span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </TaycoPillDock>
        </div>

        {/* 4-Market Architectural Grid (2x2 on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {PROPERTY_CATEGORIES.map((cat) => {
            const categoryListings = getPropertiesByCategory(cat.slug);
            const marketSpecialties = getMarketSpecialtiesByCategory(cat.slug);
            const flagshipProperty = categoryListings[0];
            const galleryUrls = [cat.heroImage, ...cat.secondaryImages];
            const activeIdx = activeThumbMap[cat.slug] ?? 0;
            const currentUrl = galleryUrls[activeIdx] ?? galleryUrls[0];
            const currentNightUrl = resolveNightImageSrc(currentUrl);
            const currentPairUrls = [currentUrl, currentNightUrl];
            const catMood = categoryMoodMap[cat.slug] ?? "day";
            const catDaylightMood = categoryDaylightMoodMap[cat.slug] ?? "day";
            const catAnimateDaylight =
              categoryAnimateDaylightMap[cat.slug] ?? true;
            const catFilter =
              catDaylightMood === "sunset"
                ? "brightness(0.96) contrast(1.12) saturate(1.28) sepia(0.20)"
                : "none";

            return (
              <article
                key={cat.slug}
                data-category-card={cat.slug}
                data-response-kind="surface"
                className={`group relative rounded-[24px] border overflow-hidden flex-col justify-between transition-all duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.65)] ${
                  cat.slug === mobileMarketSlug ? "flex" : "hidden md:flex"
                }`}
                style={{
                  background:
                    "linear-gradient(165deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.98) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.42)",
                }}
              >
                <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>

                {/* Clean Header Bar — Category Name + Day/Sunset/Night Switcher (Zero Badges on Photo) */}
                <div className="bg-[#050A14] border-b border-white/10 px-4 py-3 flex items-center justify-between gap-3">
                  <Link
                    href={`/${cat.slug}`}
                    className="min-w-0 group/title text-left"
                  >
                    <h3 className="tayco-card-title text-xl sm:text-2xl text-white group-hover/title:text-[#F3D37A] transition-colors truncate">
                      {cat.shortLabel}
                    </h3>
                  </Link>

                  <div
                    className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#070E1A] border border-white/15 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {(
                      [
                        { id: "day", label: "Day" },
                        { id: "sunset", label: "Sunset" },
                        { id: "night", label: "Night" },
                      ] as const
                    ).map((m) => {
                      const active = catMood === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          data-magnetic
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSelectCategoryMood(cat.slug, m.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 min-h-[28px] whitespace-nowrap rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all duration-300"
                          style={{
                            background: active ? "#E5C97B" : "transparent",
                            color: active ? "#050A14" : "#CBD5E1",
                          }}
                        >
                          <SolarPhaseIcon
                            phase={m.id}
                            className="w-2.5 h-2.5"
                          />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Unobstructed Hero Photograph */}
                <div
                  data-visual-slot={`cat-${cat.slug}`}
                  className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#040811]"
                >
                  <Link
                    href={`/${cat.slug}`}
                    aria-label={`Open ${cat.shortLabel}`}
                    className="block w-full h-full relative"
                  >
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
                      style={{
                        filter: catFilter,
                        transition: catAnimateDaylight
                          ? "filter 480ms cubic-bezier(0.22, 1, 0.36, 1)"
                          : "none",
                      }}
                    >
                      <ProtectedImage
                        src={currentUrl}
                        syncUrls={currentPairUrls}
                        loading="eager"
                        alt={cat.shortLabel}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-[1.02]"
                      />
                    </div>
                    <div
                      className="absolute inset-0 pointer-events-none z-[2]"
                      style={{
                        opacity: catDaylightMood === "sunset" ? 1 : 0,
                        transition: catAnimateDaylight
                          ? "opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)"
                          : "none",
                        background:
                          "linear-gradient(155deg, rgba(251,146,60,0.34) 0%, rgba(217,119,6,0.22) 55%, rgba(30,27,75,0.35) 100%)",
                        mixBlendMode: "soft-light",
                      }}
                    />
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
                      style={{
                        opacity: catMood === "night" ? 1 : 0,
                        transition:
                          "opacity 480ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      <ProtectedImage
                        src={currentNightUrl}
                        syncUrls={currentPairUrls}
                        loading="eager"
                        auditIgnore={true}
                        alt={cat.shortLabel}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out md:group-hover:scale-[1.02]"
                      />
                    </div>
                  </Link>
                </div>

                {/* Simultaneous 3-Photo Category Gallery Strip */}
                <div
                  className="grid grid-cols-3 gap-2 p-2 bg-[#040811] border-y border-white/10"
                  role="group"
                  aria-label={`${cat.shortLabel} gallery`}
                >
                  {galleryUrls.map((url, idx) => {
                    const isSelected = idx === activeIdx;
                    const thumbSrc = catMood === "night" ? resolveNightImageSrc(url) : url;
                    return (
                      <button
                        key={url}
                        type="button"
                        data-magnetic
                        onClick={(e) => {
                          e.preventDefault();
                          handleSelectPreview(cat.slug, idx, galleryUrls);
                        }}
                        onPointerEnter={() =>
                          handleSelectPreview(cat.slug, idx, galleryUrls)
                        }
                        className="relative h-20 sm:h-24 rounded-xl overflow-hidden border transition-all cursor-pointer"
                        style={{
                          borderColor: isSelected
                            ? "#C9A84C"
                            : "rgba(255, 255, 255, 0.12)",
                        }}
                      >
                        <ProtectedImage
                          src={thumbSrc}
                          auditIgnore={true}
                          loading="lazy"
                          alt={`${cat.shortLabel} view ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Clean Specialties Pills + Footer */}
                <div className="home-market-panel p-4 sm:p-5 flex-1 flex flex-col justify-between gap-4 text-left">
                  <div className="flex flex-wrap gap-1.5">
                    {marketSpecialties.map((spec) => (
                      <button
                        key={spec.id}
                        type="button"
                        data-magnetic
                        onClick={() => {
                          if (flagshipProperty) {
                            openCategoryStudio(
                              flagshipProperty,
                              catMood,
                              spec.specialtyId
                            );
                          }
                        }}
                        className="inline-flex shrink-0 whitespace-nowrap min-h-[34px] items-center gap-1.5 px-3 py-1 rounded-full bg-[#070E1A]/90 border border-[#C9A84C]/40 hover:border-[#F3D37A] hover:bg-[#0F2040] text-[11px] font-semibold text-slate-100 transition-all cursor-pointer"
                      >
                        <SpecialtyVectorIcon
                          specialtyId={spec.specialtyId}
                          className="w-3 h-3 text-[#F3D37A]"
                        />
                        <span>{spec.specialtyLabel}</span>
                      </button>
                    ))}
                  </div>

                  <TaycoCardFooterBar
                    leftMeta={
                      flagshipProperty ? (
                        <button
                          type="button"
                          data-magnetic
                          onClick={() =>
                            openCategoryStudio(
                              flagshipProperty,
                              catMood,
                              undefined
                            )
                          }
                          className="home-text-action"
                        >
                          <StudioActionIcon
                            kind="sparkle"
                            className="w-3.5 h-3.5 text-[#F3D37A]"
                          />
                          <span>Open gallery</span>
                        </button>
                      ) : undefined
                    }
                  >
                    <Link
                      href={`/${cat.slug}`}
                      data-magnetic
                      className="home-text-action"
                    >
                      <span>Explore</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </TaycoCardFooterBar>
                </div>
              </article>
            );
          })}
        </div>

        {/* Live Image Identifier & Duplicate Detector HUD */}
        <div className="mt-4">
          <VisualAssetIntegrityHud scopeLabel="PORTFOLIO" />
        </div>
      </div>

      {/* Interactive Walkthrough Studio Modal when triggered from Landing Page */}
      {studioProperty && (
        <PropertyWalkthroughStudioModal
          property={studioProperty}
          initialStepIndex={0}
          initialSolarHour={studioSolarHour}
          initialSpecialtyId={studioSpecialtyId}
          onClose={() => {
            setStudioProperty(null);
            setStudioSpecialtyId(undefined);
          }}
        />
      )}
    </section>
  );
}

/**
 * Division-Scoped Interactive Property Walkthrough, Real Day/Night Lighting & 6-Palette Color Studio
 * available for division="residential" and division="commercial" layouts.
 */
export function DivisionInteractivePropertyAtelier({
  division,
}: {
  division: "residential" | "commercial";
}) {
  const isResidential = division === "residential";
  const [resFilter, setResFilter] = useState<
    "featured" | "all" | "single-family" | "multifamily" | "townhomes"
  >("featured");
  const [comFilter, setComFilter] = useState<
    "all" | "office" | "retail" | "industrial"
  >("all");
  const [inspectedProperty, setInspectedProperty] =
    useState<PropertyListing | null>(null);
  const [modalFrameIdx, setModalFrameIdx] = useState<number>(0);
  const [modalSolarHour, setModalSolarHour] = useState<number>(12.5);

  const residentialListings = React.useMemo(
    () => PROPERTY_LISTINGS.filter((p) => p.category !== "commercial"),
    []
  );
  const commercialListings = React.useMemo(
    () => PROPERTY_LISTINGS.filter((p) => p.category === "commercial"),
    []
  );

  const visibleListings = React.useMemo(() => {
    if (isResidential) {
      if (resFilter === "featured") {
        // Show 2 Single-Family + 2 Multifamily + 2 Townhomes (6 flagship residential properties)
        return [
          ...getPropertiesByCategory("single-family").slice(0, 2),
          ...getPropertiesByCategory("multifamily").slice(0, 2),
          ...getPropertiesByCategory("townhomes").slice(0, 2),
        ];
      }
      if (resFilter === "all") return residentialListings;
      return getPropertiesByCategory(resFilter);
    }

    if (comFilter === "office") {
      return commercialListings.filter((p) =>
        ["COM-401", "COM-404"].includes(p.code)
      );
    }
    if (comFilter === "retail") {
      return commercialListings.filter((p) =>
        ["COM-402", "COM-406"].includes(p.code)
      );
    }
    if (comFilter === "industrial") {
      return commercialListings.filter((p) =>
        ["COM-403", "COM-405"].includes(p.code)
      );
    }
    return commercialListings;
  }, [
    isResidential,
    resFilter,
    comFilter,
    residentialListings,
    commercialListings,
  ]);

  const openModal = (
    prop: PropertyListing,
    stepIdx = 0,
    solarHour = 12.5
  ) => {
    const stops = buildCoherentWalkthrough(prop);
    const urls = stops.flatMap((f) => [f.src, f.nightSrc]);
    const target = stops[stepIdx] ?? stops[0];
    preloadProtectedImages(urls);
    waitForDecodedSurfaces([target.src, target.nightSrc]).then(() => {
      setModalFrameIdx(stepIdx);
      setModalSolarHour(solarHour);
      setInspectedProperty(prop);
    });
  };

  return (
    <section
      id={
        isResidential
          ? "residential-interactive-property-atelier"
          : "commercial-interactive-property-atelier"
      }
      aria-label={
        isResidential
          ? "Interactive Residential Properties Walkthrough & Day/Night Lighting Studio"
          : "Interactive Commercial Properties Walkthrough & Day/Night Lighting Studio"
      }
      className="relative py-10 sm:py-22 px-4 sm:px-8 border-b overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #050A14 0%, #0B172A 50%, #070E1A 100%)",
        borderColor: "rgba(201, 168, 76, 0.35)",
      }}
    >
      {/* Subtle architectural grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto pb-6 mb-8 border-b border-[#C9A84C]/25">
          <h2 className="tayco-display-title text-3xl sm:text-4xl text-white leading-[1.06]">
            {isResidential ? "Properties" : "Projects"}
          </h2>
        </div>

        {/* Interactive Property Cards Grid */}
        <div className="flex flex-wrap justify-center gap-7">
          {visibleListings.map((prop) => {
            return (
              <article
                key={prop.id}
                data-division-property-card={prop.code}
                data-response-kind="surface"
                className="w-full md:w-[calc(50%-0.875rem)] lg:w-[calc(33.333%-1.25rem)] rounded-[24px] border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.65)] relative"
                style={{
                  background:
                    "linear-gradient(165deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.98) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.38)",
                }}
              >
                <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
                <div>
                  <PropertyCardInteractiveStage
                    property={prop}
                    onOpenStudio={(stepIdx, solarHour) =>
                      openModal(prop, stepIdx, solarHour)
                    }
                  />

                  <div className="px-4 py-3 text-left flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="tayco-card-title text-base sm:text-lg text-white leading-snug truncate">
                        {prop.title}
                      </h3>
                      <p className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                        {prop.location} · {prop.sqft} · {prop.configuration}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-4 pb-4 pt-0">
                  <TaycoCardFooterBar
                    leftMeta={
                      <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap truncate">
                        5 Photos
                      </span>
                    }
                  >
                    <button
                      type="button"
                      data-magnetic
                      data-division-walkthrough-trigger={prop.code}
                      onClick={() => openModal(prop, 0)}
                      className="tayco-atelier-btn-gold !min-h-[38px] !px-3.5 !py-1.5 !text-[11px] whitespace-nowrap shrink-0 group/btn"
                    >
                      <span>View Gallery</span>
                      <StudioActionIcon
                        kind="arrow-right"
                        className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-0.5"
                      />
                    </button>
                  </TaycoCardFooterBar>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {inspectedProperty && (
        <PropertyWalkthroughStudioModal
          property={inspectedProperty}
          initialStepIndex={modalFrameIdx}
          initialSolarHour={modalSolarHour}
          onClose={() => setInspectedProperty(null)}
        />
      )}
    </section>
  );
}

/**
 * Dedicated Category Page Viewer (`/properties/[category]` and `/properties`).
 */
export function PropertyCategoryPageView({
  activeCategory,
  children,
}: {
  activeCategory?: PropertyCategoryMeta;
  /** Division content rendered before the "other markets" explorer (see app/<division>/page.tsx). */
  children?: React.ReactNode;
}) {
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedAvailability, setSelectedAvailability] =
    useState<string>("ALL");
  const [specialtyGroupFilter, setSpecialtyGroupFilter] = useState<string>("all");
  const [experienceMode, setExperienceMode] = useState<
    "specialties" | "projects"
  >("specialties");
  const [inspectedProperty, setInspectedProperty] =
    useState<PropertyListing | null>(null);
  const [modalFrameIdx, setModalFrameIdx] = useState<number>(0);
  const [modalSolarHour, setModalSolarHour] = useState<number>(12.5);
  const [modalSpecialtyId, setModalSpecialtyId] = useState<
    string | undefined
  >(undefined);

  const [mobileListingsExpanded, setMobileListingsExpanded] = useState(false);
  const baseListings = activeCategory
    ? getPropertiesByCategory(activeCategory.slug)
    : PROPERTY_LISTINGS;

  const marketSpecialties = React.useMemo(
    () =>
      activeCategory
        ? getMarketSpecialtiesByCategory(activeCategory.slug)
        : [],
    [activeCategory]
  );

  const filteredSpecialties = React.useMemo(
    () =>
      specialtyGroupFilter === "all"
        ? marketSpecialties
        : marketSpecialties.filter(
            (s) => s.specialtyId === specialtyGroupFilter || s.specialtyGroup === specialtyGroupFilter
          ),
    [marketSpecialties, specialtyGroupFilter]
  );

  const availableStates = Array.from(
    new Set(baseListings.map((item) => item.stateCode))
  );

  const filteredListings = baseListings.filter((item) => {
    const matchesState =
      selectedState === "ALL" || item.stateCode === selectedState;
    const matchesAvail =
      selectedAvailability === "ALL" ||
      item.availability === selectedAvailability;
    return matchesState && matchesAvail;
  });

  useEffect(() => {
    const urls: string[] = [];
    for (const item of baseListings) {
      for (const frame of item.triptych) {
        urls.push(frame.src);
      }
    }
    for (const spec of marketSpecialties) {
      for (const frame of spec.triptych) {
        urls.push(frame.src, resolveNightImageSrc(frame.src));
      }
    }
    preloadProtectedImages(urls);
  }, [baseListings, marketSpecialties]);

  // If navigated with #property-id or #market-projects hash, automatically route & open
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "").trim().toLowerCase();
    if (!hash) return;
    if (hash === "market-projects") {
      setExperienceMode("projects");
      return;
    }
    if (hash === "market-services") {
      setExperienceMode("specialties");
      return;
    }
    const foundSpec = marketSpecialties.find(
      (s) => s.id.toLowerCase() === hash || s.specialtyId.toLowerCase() === hash
    );
    if (foundSpec) {
      setExperienceMode("specialties");
      return;
    }
    const found = baseListings.find((p) => p.id.toLowerCase() === hash);
    if (found) {
      setExperienceMode("projects");
      setModalFrameIdx(0);
      setModalSpecialtyId(undefined);
      setInspectedProperty(found);
    }
  }, [baseListings, marketSpecialties]);

  const openModal = (
    prop: PropertyListing,
    stepIdx = 0,
    solarHour = 12.5,
    specialtyId?: string
  ) => {
    const stops = buildCoherentWalkthrough(prop);
    const urls = stops.flatMap((f) => [f.src, f.nightSrc]);
    const target = stops[stepIdx] ?? stops[0];
    preloadProtectedImages(urls);
    waitForDecodedSurfaces([target.src, target.nightSrc]).then(() => {
      setModalFrameIdx(stepIdx);
      setModalSolarHour(solarHour);
      setModalSpecialtyId(specialtyId);
      setInspectedProperty(prop);
    });
  };

  return (
    <main
      className="min-h-svh pt-20 pb-24"
      style={{
        background:
          "linear-gradient(180deg, #070E1A 0%, #0B172A 40%, #070E1A 100%)",
      }}
    >
      {/* ── HERO BANNER FOR CATEGORY OR ALL PROPERTIES ── */}
      <section className="relative overflow-hidden border-b border-[#C9A84C]/30 py-14 sm:py-20 px-4 sm:px-8">
        <div
          className="absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <ProtectedImage
            src={
              activeCategory?.heroImage ?? "/curated/hero/res-farmhouse-metal.jpg"
            }
            auditIgnore={true}
            alt=""
            loading="eager"
            className="w-full h-full object-cover opacity-35 tayco-hero-kenburns"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(155deg, rgba(7,14,26,0.92) 0%, rgba(15,32,64,0.78) 50%, rgba(7,14,26,0.96) 100%)",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center justify-center gap-2 text-xs font-mono text-slate-300 mb-6 mx-auto"
          >
            <Link href="/" className="hover:text-[#F3D37A] transition-colors">
              Home
            </Link>
            <span className="text-slate-500">/</span>
            <Link
              href="/properties"
              className="hover:text-[#F3D37A] transition-colors"
            >
              Portfolio
            </Link>
            {activeCategory && (
              <>
                <span className="text-slate-500">/</span>
                <span className="text-[#F3D37A] font-bold">
                  {activeCategory.shortLabel}
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="tayco-display-title text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.05]">
              {activeCategory ? (
                activeCategory.shortLabel
              ) : (
                <>
                  Construction{" "}
                  <em
                    className="tayco-serif-em font-normal"
                    style={{ color: "#F3D37A" }}
                  >
                    Portfolio.
                  </em>
                </>
              )}
            </h1>
          </div>

          {/* ── 4-CATEGORY NAVIGATION BAR ── */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/15 flex justify-center">
            <TaycoPillDock ariaLabel="Primary construction categories">
              {PROPERTY_CATEGORIES.map((cat) => {
                const isCurrent = activeCategory?.slug === cat.slug;
                return (
                  <Link
                    key={cat.slug}
                    href={`/${cat.slug}`}
                    aria-current={isCurrent ? "page" : undefined}
                    data-active={isCurrent ? "true" : "false"}
                    data-magnetic
                    className="tayco-atelier-pill inline-flex items-center gap-2 py-2 px-4"
                  >
                    <span className="text-xs sm:text-[13px] font-bold tracking-wide">
                      {cat.shortLabel}
                    </span>
                  </Link>
                );
              })}
            </TaycoPillDock>
          </div>
        </div>
      </section>

      {/* ── EXPERIENCE MODE SWITCHER ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
        {activeCategory && marketSpecialties.length > 0 && (
          <div
            data-testid="market-experience-mode-switcher"
            className="mt-2 p-2 rounded-2xl lg:rounded-full border flex flex-col lg:flex-row items-stretch lg:items-center justify-center gap-2 backdrop-blur-md max-w-3xl mx-auto"
            style={{
              background:
                "linear-gradient(135deg, rgba(11, 20, 38, 0.94) 0%, rgba(6, 11, 22, 0.98) 100%)",
              borderColor: "rgba(201, 168, 76, 0.42)",
              boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
              <button
                type="button"
                data-magnetic
                onClick={() => setExperienceMode("specialties")}
                className="tayco-atelier-pill !min-h-[44px] !px-4 !py-2 flex items-center justify-center gap-2 whitespace-nowrap"
                data-active={experienceMode === "specialties" ? "true" : "false"}
              >
                <span className="text-xs sm:text-[13px] font-bold tracking-tight">
                  Specialties ({marketSpecialties.length})
                </span>
              </button>

              <button
                type="button"
                data-magnetic
                onClick={() => setExperienceMode("projects")}
                className="tayco-atelier-pill !min-h-[44px] !px-4 !py-2 flex items-center justify-center gap-2 whitespace-nowrap"
                data-active={experienceMode === "projects" ? "true" : "false"}
              >
                <span className="text-xs sm:text-[13px] font-bold tracking-tight">
                  Projects ({baseListings.length})
                </span>
              </button>
            </div>

            {baseListings[0] && (
              <button
                type="button"
                data-magnetic
                onClick={() =>
                  openModal(
                    baseListings[0],
                    0,
                    12.5,
                    experienceMode === "specialties"
                      ? marketSpecialties[0]?.specialtyId
                      : undefined
                  )
                }
                className="tayco-atelier-btn-gold !min-h-[44px] !px-5 !py-2 whitespace-nowrap shrink-0"
              >
                <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5 shrink-0" />
                <span>Open Studio</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── SECTION 1: SPECIALTIES GALLERY ── */}
      {activeCategory &&
        marketSpecialties.length > 0 &&
        experienceMode === "specialties" && (
          <section
            id="market-services"
            aria-labelledby="market-services-heading"
            className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-12"
          >
            <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-8">
              <h2
                id="market-services-heading"
                className="tayco-display-title text-2xl sm:text-4xl text-white tracking-tight"
              >
                Specialties
              </h2>

              {/* Single Specialty Filter Strip */}
              <div
                className="flex flex-wrap items-center justify-center gap-2 mt-5"
                role="group"
                aria-label="Filter specialties"
              >
                <button
                  type="button"
                  data-magnetic
                  onClick={() => setSpecialtyGroupFilter("all")}
                  className="tayco-atelier-pill !min-h-[38px] !px-4 !py-1.5 text-xs font-semibold whitespace-nowrap"
                  data-active={specialtyGroupFilter === "all" ? "true" : "false"}
                >
                  All ({marketSpecialties.length})
                </button>
                {marketSpecialties.map((spec) => {
                  const isSelected = specialtyGroupFilter === spec.specialtyId;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      data-magnetic
                      onClick={() => setSpecialtyGroupFilter(spec.specialtyId)}
                      className="tayco-atelier-pill !min-h-[38px] !px-3.5 !py-1.5 inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
                      data-active={isSelected ? "true" : "false"}
                    >
                      <SpecialtyVectorIcon
                        specialtyId={spec.specialtyId}
                        className="w-3.5 h-3.5 text-[#F3D37A]"
                      />
                      <span>{spec.specialtyLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8 Specialty Multi-Photo Gallery Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {filteredSpecialties.map((spec) => {
                const divisionExtraFrames = activeCategory
                  ? getDivisionExtraSpecialtyFrames(activeCategory.slug)[
                      spec.specialtyId
                    ]
                  : undefined;
                return (
                  <MarketSpecialtyInteractiveCard
                    key={spec.id}
                    service={spec}
                    extraFrames={divisionExtraFrames}
                    marketLabel={activeCategory.shortLabel}
                    onOpenSpecialtyStudio={(specialtyId, stepIdx, solarHour) => {
                      if (baseListings[0]) {
                        openModal(
                          baseListings[0],
                          Math.min(stepIdx, spec.triptych.length - 1),
                          solarHour,
                          specialtyId
                        );
                      }
                    }}
                  />
                );
              })}
            </div>
          </section>
        )}

      {/* ── SECTION 2: PROJECT GALLERY (WHEN IN PROJECTS MODE OR ALL MARKETS) ── */}
      {(!activeCategory || experienceMode === "projects") && (
        <>
          <section
            id="market-projects"
            className="max-w-7xl mx-auto px-4 sm:px-8 pt-10"
          >
            {activeCategory && (
              <div className="mb-6 flex flex-col items-center text-center max-w-3xl mx-auto">
                <h2 className="tayco-display-title text-2xl sm:text-4xl text-white tracking-tight">
                  Projects
                </h2>
              </div>
            )}
            <div
              className="p-4 rounded-2xl border flex flex-wrap items-center justify-center gap-2 text-center max-w-4xl mx-auto"
              style={{
                background: "rgba(15, 32, 64, 0.72)",
                borderColor: "rgba(201, 168, 76, 0.3)",
              }}
            >
              <button
                type="button"
                data-magnetic
                onClick={() => setSelectedState("ALL")}
                className="tayco-atelier-pill"
                data-active={selectedState === "ALL" ? "true" : "false"}
              >
                All States ({baseListings.length})
              </button>
              {availableStates.map((st) => (
                <button
                  key={st}
                  type="button"
                  data-magnetic
                  onClick={() => setSelectedState(st)}
                  className="tayco-atelier-pill"
                  data-active={selectedState === st ? "true" : "false"}
                >
                  {st}
                </button>
              ))}
            </div>
          </section>

          {/* ── PROPERTY LISTINGS GRID ── */}
          <section
            aria-label="Project gallery"
            className="max-w-7xl mx-auto px-4 sm:px-8 pt-8"
          >
            <div className="flex flex-wrap justify-center gap-7">
              {filteredListings.map((prop, listingIdx) => {
                const catMeta = PROPERTY_CATEGORIES.find(
                  (c) => c.slug === prop.category
                );
                return (
                  <article
                    key={prop.id}
                    id={prop.id}
                    data-property-card={prop.code}
                    data-response-kind="surface"
                    className={`${
                      !mobileListingsExpanded && listingIdx >= 6 ? "max-md:hidden" : ""
                    } w-full md:w-[calc(50%-0.875rem)] lg:w-[calc(33.333%-1.25rem)] rounded-[24px] border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.65)] relative`}
                    style={{
                      background:
                        "linear-gradient(165deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.98) 100%)",
                      borderColor: "rgba(201, 168, 76, 0.38)",
                    }}
                  >
                    <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
                    <div>
                      <PropertyCardInteractiveStage
                        property={prop}
                        onOpenStudio={(stepIdx, solarHour) =>
                          openModal(prop, stepIdx, solarHour, undefined)
                        }
                      />

                      <div className="p-4 sm:p-5 text-left flex flex-col">
                        {!activeCategory && catMeta && (
                          <div className="mb-1.5 text-left">
                            <Link
                              href={`/${catMeta.slug}`}
                              className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:underline"
                            >
                              {catMeta.shortLabel} →
                            </Link>
                          </div>
                        )}

                        <h2 className="tayco-card-title text-xl text-white leading-snug">
                          {prop.title}
                        </h2>
                        <p className="text-xs font-mono text-slate-300 mt-1.5">
                          {prop.location} · {prop.sqft} · {prop.configuration}
                        </p>
                      </div>
                    </div>

                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0">
                      <TaycoCardFooterBar
                        leftMeta={
                          <span className="text-xs text-slate-400 whitespace-nowrap truncate">
                            5 Photos
                          </span>
                        }
                      >
                        <button
                          type="button"
                          data-magnetic
                          data-walkthrough-trigger={prop.code}
                          onClick={() => openModal(prop, 0, 12.5, undefined)}
                          className="tayco-atelier-btn-gold !min-h-[38px] !px-3.5 !py-1.5 !text-[11px] whitespace-nowrap shrink-0 group/btn"
                        >
                          <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5 shrink-0" />
                          <span>View Gallery</span>
                          <StudioActionIcon
                            kind="arrow-right"
                            className="w-3.5 h-3.5 shrink-0 transition-transform duration-300 group-hover/btn:translate-x-0.5"
                          />
                        </button>
                      </TaycoCardFooterBar>
                    </div>
                  </article>
                );
              })}
            </div>
            {filteredListings.length > 6 && !mobileListingsExpanded && (
              <div className="mt-6 flex justify-center md:hidden">
                <button
                  type="button"
                  onClick={() => setMobileListingsExpanded(true)}
                  className="tayco-atelier-btn-obsidian min-h-[44px]"
                >
                  <span>View All {filteredListings.length} Projects</span>
                </button>
              </div>
            )}
            <div className="mt-4">
              <VisualAssetIntegrityHud scopeLabel="PORTFOLIO" />
            </div>
          </section>
        </>
      )}

      {/* ── DIVISION CONTENT ── */}
      {children}

      {/* ── INTERACTIVE ARCHITECTURAL WALKTHROUGH & COLOR STUDIO MODAL ── */}
      {inspectedProperty && (
        <PropertyWalkthroughStudioModal
          property={inspectedProperty}
          initialStepIndex={modalFrameIdx}
          initialSolarHour={modalSolarHour}
          initialSpecialtyId={modalSpecialtyId}
          onClose={() => {
            setInspectedProperty(null);
            setModalSpecialtyId(undefined);
          }}
        />
      )}
    </main>
  );
}
