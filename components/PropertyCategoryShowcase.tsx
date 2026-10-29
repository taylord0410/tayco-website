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
  type PropertyListing,
  type MarketSpecialtyService,
  type MarketSpecialtyId,
  type MarketSpecialtyGroup,
} from "@/lib/property-catalog";
import { COMPANY } from "@/lib/company";

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
  marketLabel,
  onOpenSpecialtyStudio,
}: {
  service: MarketSpecialtyService;
  marketLabel: string;
  onOpenSpecialtyStudio?: (
    specialtyId: MarketSpecialtyId,
    stepIdx: number,
    solarHour: number
  ) => void;
}) {
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [mood, setMood] = useState<"day" | "sunset" | "night">("day");

  const frames = service.triptych;
  const allUrls = React.useMemo(
    () =>
      frames.flatMap((f) => [f.src, resolveNightImageSrc(f.src)]),
    [frames]
  );
  const currentFrame = frames[activeIdx] ?? frames[0];
  const currentNightSrc = resolveNightImageSrc(currentFrame.src);
  const currentAssetId = computeVisualAssetId(currentFrame.src);

  const selectFrame = (idx: number) => {
    const target = frames[idx] ?? frames[0];
    preloadProtectedImages(allUrls);
    waitForDecodedSurfaces([target.src, resolveNightImageSrc(target.src)]).then(
      () => {
        setActiveIdx(idx);
      }
    );
  };

  const cardFilter =
    mood === "sunset"
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
        {/* Clickable 3-Photo Day / Sunset / Night Interactive Triptych Stage */}
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
          aria-label={`Expand full-screen ${service.title} studio at ${currentFrame.label}`}
          className="relative h-60 sm:h-64 w-full overflow-hidden bg-[#03060D] select-none cursor-pointer group/specphoto"
        >
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              filter: cardFilter,
              transition: "filter 650ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <ProtectedImage
              src={currentFrame.src}
              syncUrls={allUrls}
              loading="eager"
              alt={`${service.title} — ${currentFrame.label}`}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/specphoto:scale-105"
            />
            <div
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                opacity: mood === "night" ? 1 : 0,
                transition: "opacity 650ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <ProtectedImage
                src={currentNightSrc}
                syncUrls={allUrls}
                auditIgnore={true}
                loading="lazy"
                alt={`${service.title} — ${currentFrame.label} (Night)`}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/specphoto:scale-105"
              />
            </div>
          </div>

          {/* Sunset Warmth Overlay */}
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-700"
            style={{
              opacity: mood === "sunset" ? 1 : 0,
              background:
                "linear-gradient(155deg, rgba(251,146,60,0.34) 0%, rgba(217,119,6,0.22) 55%, rgba(30,27,75,0.35) 100%)",
              mixBlendMode: "soft-light",
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(4,8,17,0.62) 0%, transparent 45%, rgba(4,8,17,0.92) 100%)",
            }}
          />

          {/* Top Bar: Specialty Badge + Day/Sunset/Night Lighting Switcher */}
          <div
            className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border backdrop-blur-sm"
              style={{
                background: "rgba(5, 10, 20, 0.84)",
                borderColor: "rgba(201, 168, 76, 0.55)",
                color: "#F3D37A",
              }}
            >
              <SpecialtyVectorIcon
                specialtyId={service.specialtyId}
                className="w-3.5 h-3.5 text-[#F3D37A]"
              />
              <span>
                {service.specialtyLabel === "Siding"
                  ? "Exterior Siding"
                  : service.specialtyLabel === "Framing"
                    ? "Structural Framing"
                    : service.specialtyLabel}
              </span>
            </span>

            <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#050A14]/85 backdrop-blur-sm border border-white/15">
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
                      setMood(m.id);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 min-h-[32px] whitespace-nowrap rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all duration-300"
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

          {/* Center Hover Expand Pill */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover/specphoto:opacity-100 transition-opacity duration-300 z-10">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-mono font-black uppercase tracking-wider shadow-[0_12px_32px_rgba(0,0,0,0.75)] border"
              style={{
                background:
                  "linear-gradient(135deg, rgba(246, 226, 156, 0.96) 0%, rgba(201, 168, 76, 0.96) 100%)",
                borderColor: "#FFF3C4",
                color: "#050A14",
              }}
            >
              <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5" />
              <span>Click to Expand Full-Screen Studio</span>
              <StudioActionIcon kind="arrow-right" className="w-3.5 h-3.5" />
            </span>
          </div>

          {/* Sleek Centered Bottom Control Bar */}
          <div
            className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 z-10 bg-[#050A14]/85 px-3 py-1.5 rounded-xl border border-[#C9A84C]/40 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="min-w-0 flex items-center gap-2">
              <span translate="no" className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#F3D37A]">
                <span className="hidden sm:inline">#{currentAssetId} · </span>0{activeIdx + 1}/03
              </span>
              <span className="text-white/40 text-[10px] hidden sm:inline" aria-hidden="true">·</span>
              <span className="text-xs font-semibold text-white drop-shadow truncate max-w-[150px] sm:max-w-xs">
                {currentFrame.label}
              </span>
            </div>
            <div
              className="flex items-center gap-1 shrink-0"
              role="group"
              aria-label={`Switch ${service.title} photographs`}
            >
              {frames.map((f, idx) => {
                const isSelected = idx === activeIdx;
                return (
                  <button
                    key={f.label}
                    type="button"
                    data-magnetic
                    onClick={(e) => {
                      e.stopPropagation();
                      selectFrame(idx);
                    }}
                    onPointerEnter={() => selectFrame(idx)}
                    className="min-w-[34px] min-h-[34px] shrink-0 whitespace-nowrap leading-none rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center"
                    style={{
                      background: isSelected
                        ? "linear-gradient(135deg, #F6E29C 0%, #C9A84C 100%)"
                        : "rgba(15, 32, 64, 0.9)",
                      color: isSelected ? "#070E1A" : "#E2E8F0",
                    }}
                    title={f.label}
                  >
                    <span translate="no">0{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* V46 Balanced Space-Utilizing Interior Body */}
        <div className="p-4 sm:p-6 flex flex-col text-left">
          <TaycoCardMetaBar
            leftBadge={
              <span
                className="px-3 py-1 rounded-full text-[10px] font-mono font-bold"
                style={{
                  background: "rgba(201, 168, 76, 0.18)",
                  color: "#F3D37A",
                  border: "1px solid rgba(201, 168, 76, 0.42)",
                }}
              >
                {service.code}
              </span>
            }
            rightMeta={<span translate="no">{service.csiDivision}</span>}
          />

          <h3 className="tayco-card-title text-xl sm:text-[1.65rem] text-white leading-snug mt-3">
            {service.title}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-[#F3D37A] mt-1 line-clamp-2 sm:line-clamp-none">
            {service.subtitle}
          </p>

          <p className="hidden sm:block text-sm text-slate-300 leading-relaxed my-3.5">
            {service.summary}
          </p>

          <TaycoDeliverableGrid items={service.deliverables} columns={2} className="mt-3 sm:mt-1" />
        </div>
      </div>

      {/* V46 Horizontal Space-Utilizing Footer */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
        <TaycoCardFooterBar
          leftMeta={
            <span className="text-[10px] font-mono text-[#F3D37A]/85 tracking-wider" translate="no">
              3 Views · 24h Solar<span className="hidden sm:inline"> · #{currentAssetId}</span>
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
            className="tayco-atelier-btn-gold group/btn"
          >
            <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5" />
            <span>Expand {service.specialtyLabel === "Siding" ? "Exterior Siding" : service.specialtyLabel === "Framing" ? "Structural Framing" : service.specialtyLabel} Studio</span>
            <StudioActionIcon
              kind="arrow-right"
              className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5"
            />
          </button>
        </TaycoCardFooterBar>
      </div>
    </article>
  );
}

/**
 * Interactive 5-Room Card Header used on `/properties/[category]` and `/properties`.
 * - Hovering or clicking the 5 room pills (`01`..`05`) previews all 5 coherent spaces right on the card.
 * - Clicking the main photo immediately launches the full 5-Room Walkthrough, Day/Night Lighting & Color Studio at that room.
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
  const allUrls = React.useMemo(
    () => stops.flatMap((s) => [s.src, s.nightSrc]),
    [stops]
  );
  const currentStop = stops[activeIdx] ?? stops[0];
  const currentAssetId = computeVisualAssetId(currentStop.src);

  const selectRoomPreview = (idx: number) => {
    const target = stops[idx] ?? stops[0];
    preloadProtectedImages(allUrls);
    waitForDecodedSurfaces([target.src, target.nightSrc]).then(() => {
      setActiveIdx(idx);
    });
  };

  const cardFilter =
    cardMood === "sunset"
      ? "brightness(0.96) contrast(1.12) saturate(1.28) sepia(0.20)"
      : "none";

  const moodSolarHour =
    cardMood === "night" ? 21.5 : cardMood === "sunset" ? 18.5 : 12.5;

  return (
    <div
      className="bg-[#040811] border-b border-white/8"
      onPointerEnter={() => preloadProtectedImages(allUrls)}
    >
      {/* Main Clickable Photo Stage with Active Stop + Real Night Silky Crossfade */}
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
        aria-label={`Open 5-room interactive tour, day/night lighting, and color studio for ${property.title}`}
        className="relative h-60 sm:h-64 w-full overflow-hidden cursor-pointer group/photo select-none bg-[#03060D]"
      >
        <div
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{
            filter: cardFilter,
            transition: "filter 650ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <ProtectedImage
            src={currentStop.src}
            syncUrls={allUrls}
            loading="eager"
            alt={`${property.title} — ${currentStop.title}`}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/photo:scale-105"
          />
          {/* True AI-Generated Nighttime Photograph (`nightSrc`) with Logical 2700K Interior Illumination */}
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              opacity: cardMood === "night" ? 1 : 0,
              transition: "opacity 650ms cubic-bezier(0.22, 1, 0.36, 1)",
            }}
          >
            <ProtectedImage
              src={currentStop.nightSrc}
              syncUrls={allUrls}
              auditIgnore={true}
              loading="lazy"
              alt={`${property.title} — ${currentStop.title} (Night)`}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/photo:scale-105"
            />
          </div>
        </div>

        {/* Ambient Golden Sunset Card Preview Overlay (Only for Sunset; Night uses real generated Night photo) */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-700"
          style={{
            opacity: cardMood === "sunset" ? 1 : 0,
            background:
              "linear-gradient(155deg, rgba(251,146,60,0.34) 0%, rgba(217,119,6,0.22) 55%, rgba(30,27,75,0.35) 100%)",
            mixBlendMode: "soft-light",
          }}
        />

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(4,8,17,0.58) 0%, transparent 42%, rgba(4,8,17,0.92) 100%)",
          }}
        />

        {/* Top Badge: Room Number + Quick Day/Sunset/Night Switcher */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border backdrop-blur-sm pointer-events-none"
            style={{
              background: "rgba(5, 10, 20, 0.78)",
              borderColor: "rgba(255, 255, 255, 0.16)",
              color: "#F3D37A",
            }}
          >
            {currentStop.zoneLabel}
          </span>

          {/* Quick Day/Sunset/Night Preview Pill right on the Card */}
          <div
            className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#050A14]/80 backdrop-blur-sm border border-white/15"
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
                    setCardMood(m.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 min-h-[32px] whitespace-nowrap rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all duration-300"
                  style={{
                    background: active ? "#E5C97B" : "transparent",
                    color: active ? "#050A14" : "#CBD5E1",
                  }}
                  title={`Preview ${m.label} lighting on card`}
                >
                  <SolarPhaseIcon phase={m.id} className="w-2.5 h-2.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Caption + Hover Glass Pill inside Photo */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 pointer-events-none">
          <div className="min-w-0">
            <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#F3D37A]/90">
              #{currentAssetId} · CONNECTED PROJECT TOUR
            </div>
            <div className="text-xs font-bold text-white drop-shadow truncate">
              {currentStop.title}
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider shrink-0 transition-transform duration-300 group-hover/photo:scale-105 shadow-lg border"
            style={{
              background:
                "linear-gradient(135deg, #F6E29C 0%, #D9B14A 52%, #B58928 100%)",
              borderColor: "#FFF3C4",
              color: "#050A14",
            }}
          >
            <StudioActionIcon kind="sparkle" className="w-3 h-3" />
            <span>Expand Studio</span>
            <StudioActionIcon kind="arrow-right" className="w-3 h-3" />
          </span>
        </div>
      </div>

      {/* 5-Room Quick Switcher Strip directly below the photo */}
      <div
        className="grid grid-cols-5 gap-1 p-1.5 bg-[#050A14]"
        role="group"
        aria-label={`Preview 5 spaces of ${property.title}`}
      >
        {stops.map((st, idx) => {
          const isCurrent = idx === activeIdx;
          return (
            <button
              key={st.stepNumber}
              type="button"
              data-magnetic
              onClick={() => selectRoomPreview(idx)}
              onPointerEnter={() => selectRoomPreview(idx)}
              className="px-1.5 py-1.5 rounded-xl text-center transition-all duration-300 cursor-pointer border"
              style={{
                background: isCurrent
                  ? "rgba(201, 168, 76, 0.20)"
                  : "rgba(12, 24, 46, 0.45)",
                borderColor: isCurrent
                  ? "#E5C97B"
                  : "rgba(255, 255, 255, 0.06)",
              }}
              title={`Preview ${st.zoneLabel} (Click photo above to open full studio)`}
            >
              <div className="text-[9px] font-mono font-bold text-[#C9A84C]">
                {st.stepNumber}
              </div>
              <div className="text-[10px] font-semibold text-white truncate">
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
 * `/residential`, and `/commercial`.
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
    preloadProtectedImages(allPreviewUrls);
  }, []);

  const handleSelectPreview = (slug: string, idx: number, urls: string[]) => {
    waitForDecodedSurfaces(urls).then(() => {
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
      className="relative py-16 sm:py-22 px-4 sm:px-8 border-b overflow-hidden"
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
        <div className="flex flex-col items-center text-center max-w-6xl mx-auto pb-8 mb-6 border-b border-[#C9A84C]/25">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#C9A84C]/45 bg-[#0F2040]/80 mb-4 tayco-atelier-eyebrow">
            <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F3D37A]">
              FOUR PRIMARY CONSTRUCTION MARKETS · 8 STATES
            </span>
          </div>
          <h2
            id="property-categories-heading"
            className="tayco-display-title text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.08]"
          >
            Choose Your{" "}
            <em
              className="tayco-serif-em font-normal"
              style={{ color: "#F3D37A" }}
            >
              Construction Market.
            </em>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto line-clamp-3 sm:line-clamp-none">
            Pick a market to explore{" "}
            <strong className="text-[#F3D37A]">eight specialties</strong>, curated project
            galleries and{" "}
            <strong className="text-[#F3D37A]">day/night solar walkthroughs</strong>.
          </p>

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
                  {cat.label.replace(" Homes", "")}
                </button>
              );
            })}
          </div>

          {/* Direct Market Quick-Links + View All */}
          <TaycoPillDock ariaLabel="Choose your construction market" className="mt-6 max-md:hidden">
            <Link
              href="/properties"
              data-magnetic
              className="tayco-atelier-btn-gold !px-4 !py-2 !text-[11px] !tracking-[0.08em]"
              title="All 4 Markets (24 Projects)"
            >
              <span>All 4 Markets</span>
              <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-mono font-bold">24</span>
              <span aria-hidden="true">↗</span>
            </Link>
            {PROPERTY_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/properties/${cat.slug}`}
                data-magnetic
                className="tayco-atelier-btn-obsidian !px-4 !py-2 !text-[11px] !tracking-[0.08em]"
                title={`${cat.label} (8 Specialties · 6 Projects)`}
              >
                <span>{cat.label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#F3D37A]">8 · 6</span>
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
            const currentAssetId = computeVisualAssetId(currentUrl);
            const catMood = categoryMoodMap[cat.slug] ?? "day";
            const catFilter =
              catMood === "sunset"
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
                {/* Top Visual Stage — Clickable to Category Page with Active Slot + Real Night */}
                <div
                  data-visual-slot={`cat-${cat.slug}`}
                  className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#040811]"
                >
                  <Link
                    href={`/properties/${cat.slug}`}
                    aria-label={`Open ${cat.label} page`}
                    className="block w-full h-full relative"
                  >
                    <div
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        filter: catFilter,
                        transition:
                          "filter 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                      }}
                    >
                      <ProtectedImage
                        src={currentUrl}
                        syncUrls={galleryUrls}
                        alt={cat.label}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{
                          opacity: catMood === "night" ? 1 : 0,
                          transition:
                            "opacity 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                        }}
                      >
                        <ProtectedImage
                          src={currentNightUrl}
                          syncUrls={galleryUrls}
                          auditIgnore={true}
                          alt={`${cat.label} (Night)`}
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </div>
                    </div>
                    {/* Sunset golden ambient wash */}
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity duration-700"
                      style={{
                        opacity: catMood === "sunset" ? 1 : 0,
                        background:
                          "linear-gradient(155deg, rgba(251,146,60,0.34) 0%, rgba(217,119,6,0.22) 55%, rgba(30,27,75,0.35) 100%)",
                        mixBlendMode: "soft-light",
                      }}
                    />
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(4,8,17,0.55) 0%, rgba(4,8,17,0.16) 45%, rgba(4,8,17,0.92) 100%)",
                      }}
                    />
                  </Link>

                  {/* Top-Left Category Order + Top-Right Day/Sunset/Night Switcher */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between gap-2">
                    <span
                      className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border backdrop-blur-sm pointer-events-none whitespace-nowrap truncate max-w-[55%]"
                      style={{
                        background: "rgba(7, 14, 26, 0.84)",
                        borderColor: "rgba(201, 168, 76, 0.55)",
                        color: "#F3D37A",
                      }}
                    >
                      {cat.eyebrow.split("·")[0]?.trim() || cat.eyebrow}<span translate="no" className="hidden sm:inline"> · #{currentAssetId}</span>
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#050A14]/85 backdrop-blur-sm border border-white/15"
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
                                setCategoryMoodMap((prev) => ({
                                  ...prev,
                                  [cat.slug]: m.id,
                                }));
                              }}
                              className="inline-flex items-center gap-1 px-2.5 min-h-[32px] whitespace-nowrap rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all duration-300"
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
                  </div>

                  {/* Headline Overlay + 3-Photo Switcher */}
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-3">
                    <Link
                      href={`/properties/${cat.slug}`}
                      className="min-w-0 group/title text-left"
                    >
                      <h3 className="tayco-card-title text-2xl sm:text-3xl text-white drop-shadow-md group-hover/title:text-[#F3D37A] transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-slate-200 font-medium truncate">
                        {cat.subtitle}
                      </p>
                    </Link>

                    {/* 3-Photo Synchronized Preview Switcher */}
                    <div
                      className="flex items-center gap-1.5 bg-[#070E1A]/85 p-1.5 rounded-xl border border-[#C9A84C]/40 backdrop-blur-sm shrink-0"
                      role="group"
                      aria-label={`Preview ${cat.label} photography`}
                    >
                      {galleryUrls.map((url, idx) => {
                        const isSelected = idx === activeIdx;
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
                            className="min-w-[34px] min-h-[34px] shrink-0 whitespace-nowrap leading-none rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center"
                            style={{
                              background: isSelected
                                ? "#C9A84C"
                                : "rgba(15, 32, 64, 0.9)",
                              color: isSelected ? "#070E1A" : "#E2E8F0",
                            }}
                            title={`View ${cat.label} photo ${idx + 1}`}
                          >
                            <span translate="no">0{idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* V46 Balanced Interior Body */}
                <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between gap-4 sm:gap-5 text-left">
                  <div className="flex flex-col">
                    <TaycoCardMetaBar
                      leftBadge={
                        <span
                          className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                          style={{
                            background: "rgba(201, 168, 76, 0.18)",
                            color: "#F3D37A",
                            border: "1px solid rgba(201, 168, 76, 0.42)",
                          }}
                        >
                          {cat.eyebrow}
                        </span>
                      }
                      rightMeta={<span translate="no">8 Specialties · 6 Projects</span>}
                      className="mb-3 sm:mb-4"
                    />

                    <p className="text-slate-300 text-sm leading-relaxed mb-4 text-left line-clamp-2 sm:line-clamp-none">
                      {cat.description}
                    </p>

                    {/* Specs Grid */}
                    <div className="hidden sm:block">
                    <TaycoSpecGrid
                      columns={3}
                      className="mb-4"
                      items={[
                        { label: "Typical Footprint", value: cat.typicalSqftRange },
                        { label: "Configuration", value: cat.typicalConfigLabel },
                        { label: "Scope Divisions", value: cat.csiDivisions },
                      ]}
                    />
                    </div>

                    {/* Market Specialties Strip — Click any specialty to launch its Full-Screen Specialty Studio! */}
                    <div className="mb-4 w-full flex flex-col">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#F3D37A] mb-2 text-left">
                        <StudioActionIcon
                          kind="sparkle"
                          className="w-3 h-3 text-[#F3D37A]"
                        />
                        <span>
                          {cat.label} Specialties:
                        </span>
                      </div>
                      <div className="flex gap-1.5 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:pb-1 tayco-no-scrollbar sm:flex-wrap">
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
                            className="inline-flex shrink-0 whitespace-nowrap min-h-[36px] items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#070E1A]/90 border border-[#C9A84C]/45 hover:border-[#F3D37A] hover:bg-[#0F2040] text-[11px] font-semibold text-slate-100 transition-all cursor-pointer shadow-sm"
                          >
                            <SpecialtyVectorIcon
                              specialtyId={spec.specialtyId}
                              className="w-3 h-3 text-[#F3D37A]"
                            />
                            <span>
                              {spec.specialtyLabel === "Siding"
                                ? "Exterior Siding"
                                : spec.specialtyLabel === "Framing"
                                  ? "Structural Framing"
                                  : spec.specialtyLabel}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clickable Properties — Click any chip to launch its 5-Room Walkthrough & Day/Night Studio! */}
                    <div className="w-full flex flex-col">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#F3D37A] mb-2 text-left">
                        <StudioActionIcon
                          kind="sparkle"
                          className="w-3 h-3 text-[#F3D37A]"
                        />
                        <span>
                          {cat.label} Project Gallery (5-Room Connected Tour):
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full">
                        {categoryListings.slice(0, 4).map((prop, propIdx) => (
                          <button
                            key={prop.id}
                            type="button"
                            data-magnetic
                            onClick={() =>
                              openCategoryStudio(prop, catMood, undefined)
                            }
                            className={`${propIdx >= 2 ? "hidden sm:flex" : "flex"} min-h-[40px] items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#070E1A]/85 border border-[#C9A84C]/35 hover:border-[#F3D37A] hover:bg-[#0F2040] text-xs transition-all cursor-pointer text-left`}
                          >
                            <span className="font-semibold text-slate-100 truncate">
                              <strong translate="no" className="font-mono text-[#F3D37A] mr-1.5">
                                {prop.code}
                              </strong>
                              {prop.title}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#C9A84C] shrink-0">
                              <span>Tour</span>
                              <StudioActionIcon
                                kind="arrow-right"
                                className="w-2.5 h-2.5"
                              />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* V46 Balanced Horizontal Footer */}
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
                          className="tayco-atelier-btn-obsidian"
                        >
                          <StudioActionIcon
                            kind="sparkle"
                            className="w-3.5 h-3.5 text-[#F3D37A]"
                          />
                          <span>Launch Interactive Studio</span>
                        </button>
                      ) : undefined
                    }
                  >
                    <Link
                      href={`/properties/${cat.slug}`}
                      data-magnetic
                      className="tayco-atelier-btn-gold"
                    >
                      <span>Explore {cat.label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </TaycoCardFooterBar>
                </div>
              </article>
            );
          })}
        </div>

        {/* Live Image Identifier & Duplicate Detector HUD */}
        <div className="mt-8">
          <VisualAssetIntegrityHud scopeLabel="4 PRIMARY MARKETS · LIVE VIEWPORT" />
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
 * embedded directly inside `/residential` (`division="residential"`) and `/commercial` (`division="commercial"`).
 */
export function DivisionInteractivePropertyAtelier({
  division,
}: {
  division: "residential" | "commercial";
}) {
  const isResidential = division === "residential";
  const [resFilter, setResFilter] = useState<
    "featured" | "all" | "single-family" | "duplexes" | "townhouses"
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
        // Show 2 Single-Family + 2 Duplexes + 2 Townhouses (6 flagship residential properties)
        return [
          ...getPropertiesByCategory("single-family").slice(0, 2),
          ...getPropertiesByCategory("duplexes").slice(0, 2),
          ...getPropertiesByCategory("townhouses").slice(0, 2),
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
      className="relative py-16 sm:py-22 px-4 sm:px-8 border-b overflow-hidden"
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
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto pb-8 mb-8 border-b border-[#C9A84C]/25">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#C9A84C]/45 bg-[#0F2040]/85 mb-4 tayco-atelier-eyebrow">
            <span
              className="tayco-live-dot"
              style={{ color: isResidential ? "#F97316" : "#10B981" }}
            />
            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[#F3D37A]">
              {isResidential
                ? "01A / RESIDENTIAL WALKTHROUGH · REAL DAY/NIGHT 2700K & 6 FINISH PALETTES"
                : "01A / COMMERCIAL WALKTHROUGH · REAL DAY/NIGHT 2700K & 6 FINISH PALETTES"}
            </span>
          </div>

          <h2 className="tayco-display-title text-3xl sm:text-4xl lg:text-5xl text-white leading-[1.06]">
            {isResidential ? (
              <>
                Step Inside Our Homes.{" "}
                <em
                  className="tayco-serif-em font-normal"
                  style={{ color: "#F3D37A" }}
                >
                  Day, Sunset &amp; Real 2700K Night.
                </em>
              </>
            ) : (
              <>
                Step Inside Our Commercial Assets.{" "}
                <em
                  className="tayco-serif-em font-normal"
                  style={{ color: "#F3D37A" }}
                >
                  Day, Sunset &amp; Real 2700K Night.
                </em>
              </>
            )}
          </h2>

          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            {isResidential
              ? "Toggle Day, Sunset, and Night right on any Single-Family Home, Duplex, or Townhouse card to see its real 2700K nighttime architectural illumination, preview all 5 connected rooms (01 Exterior → 05 Patio/Terrace), or launch the full-screen Walkthrough & 6-Palette Color Studio."
              : "Toggle Day, Sunset, and Night right on any Corporate HQ, Retail Plaza, Medical Suite, or High-Bay Industrial facility to inspect its real 2700K nighttime illumination, preview all 5 connected spaces (01 Street Facade → 05 Executive Terrace), or launch the full-screen Walkthrough & Finish Studio."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6">
            <Link
              href={
                isResidential ? "/properties/single-family" : "/properties/commercial"
              }
              data-magnetic
              className="tayco-atelier-btn-gold"
            >
              <span>
                {isResidential
                  ? "Open Full Residential Portfolio (18)"
                  : "Open Dedicated Commercial Portfolio (6)"}
              </span>
              <StudioActionIcon kind="arrow-up-right" className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Category / Sector Filter Tabs */}
        <div className="flex flex-col items-center justify-center gap-4 mb-8 text-center max-w-5xl mx-auto">
          {isResidential ? (
            <TaycoPillDock ariaLabel="Filter residential properties">
              {[
                {
                  id: "featured" as const,
                  label: "Featured Flagships (6)",
                },
                {
                  id: "single-family" as const,
                  label: "Single-Family Homes (6)",
                },
                {
                  id: "duplexes" as const,
                  label: "Duplexes (6)",
                },
                {
                  id: "townhouses" as const,
                  label: "Townhouses (6)",
                },
                {
                  id: "all" as const,
                  label: "All 18 Residential Properties",
                },
              ].map((tab) => {
                const active = resFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-magnetic
                    onClick={() => setResFilter(tab.id)}
                    className="tayco-atelier-pill"
                    data-active={active ? "true" : "false"}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </TaycoPillDock>
          ) : (
            <TaycoPillDock ariaLabel="Filter commercial properties">
              {[
                {
                  id: "all" as const,
                  label: "All Commercial Properties (6)",
                },
                {
                  id: "office" as const,
                  label: "Corporate HQ & Class-A Office (2)",
                },
                {
                  id: "retail" as const,
                  label: "Retail & Mixed-Use Plazas (2)",
                },
                {
                  id: "industrial" as const,
                  label: "Industrial & Medical Facilities (2)",
                },
              ].map((tab) => {
                const active = comFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-magnetic
                    onClick={() => setComFilter(tab.id)}
                    className="tayco-atelier-pill"
                    data-active={active ? "true" : "false"}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </TaycoPillDock>
          )}

          <div className="text-xs font-mono text-slate-300">
            <span className="text-[#F3D37A] font-bold">
              ● 100% People-Free Architectural Photography
            </span>{" "}
            · Real 2700K Night + 6 Palettes
          </div>
        </div>

        {/* Interactive Property Cards Grid */}
        <div className="flex flex-wrap justify-center gap-7">
          {visibleListings.map((prop) => {
            const catMeta = PROPERTY_CATEGORIES.find(
              (c) => c.slug === prop.category
            );
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

                  <div className="p-4 sm:p-6 text-left flex flex-col">
                    <TaycoCardMetaBar
                      leftBadge={
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black"
                            style={{
                              background: "rgba(201, 168, 76, 0.2)",
                              color: "#F3D37A",
                              border: "1px solid rgba(201, 168, 76, 0.45)",
                            }}
                          >
                            {prop.code}
                          </span>
                          <span className="text-xs font-mono font-semibold text-slate-300">
                            {prop.location}
                          </span>
                        </div>
                      }
                      rightMeta={
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
                          style={{
                            background: "rgba(16, 185, 129, 0.16)",
                            color: "#6EE7B7",
                            border: "1px solid rgba(16, 185, 129, 0.4)",
                          }}
                        >
                          ● {prop.availability}
                        </span>
                      }
                      className="mb-3"
                    />

                    {catMeta && (
                      <div className="mb-1.5 text-left">
                        <Link
                          href={`/properties/${catMeta.slug}`}
                          className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:underline"
                        >
                          {catMeta.label} →
                        </Link>
                      </div>
                    )}

                    <h3 className="tayco-card-title text-xl text-white leading-snug">
                      {prop.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#F3D37A] mt-1">
                      {prop.subtitle}
                    </p>

                    <TaycoSpecGrid
                      columns={2}
                      className="my-3.5"
                      items={[
                        { label: "Total Area", value: prop.sqft },
                        { label: "Layout / Specs", value: prop.configuration },
                      ]}
                    />

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 text-left">
                      {prop.summary}
                    </p>

                    <div
                      onClick={() => openModal(prop, 0)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openModal(prop, 0);
                        }
                      }}
                      className="hidden sm:flex p-3 rounded-2xl border cursor-pointer transition-all hover:border-[#F3D37A] bg-[#070E1A]/90 border-[#C9A84C]/35 flex-col sm:flex-row items-center justify-between gap-2.5 w-full text-left"
                    >
                      <div className="min-w-0 text-left">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F3D37A]">
                          <StudioActionIcon
                            kind="sparkle"
                            className="w-3 h-3 text-[#F3D37A]"
                          />
                          <span>5-SPACE TOUR · REAL NIGHT · 6 PALETTES</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-start gap-2 text-[11px] text-slate-300 truncate mt-1">
                          <span className="inline-flex items-center gap-1">
                            <SolarPhaseIcon
                              phase="morning"
                              className="w-3 h-3 text-[#F3D37A]"
                            />
                            Morning
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1">
                            <SolarPhaseIcon
                              phase="midday"
                              className="w-3 h-3 text-[#F3D37A]"
                            />
                            Noon
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1">
                            <SolarPhaseIcon
                              phase="sunset"
                              className="w-3 h-3 text-[#F3D37A]"
                            />
                            Sunset
                          </span>
                          <span className="text-slate-600">·</span>
                          <span className="inline-flex items-center gap-1">
                            <SolarPhaseIcon
                              phase="night"
                              className="w-3 h-3 text-[#F3D37A]"
                            />
                            2700K Night
                          </span>
                        </div>
                      </div>
                      <div
                        className="flex items-center -space-x-1.5 shrink-0 justify-center"
                        title="6 Interactive Designer Finish Palettes"
                      >
                        {DESIGNER_PALETTES.map((pal) => (
                          <span
                            key={pal.id}
                            className="w-4 h-4 rounded-full border border-white/70 shadow-sm"
                            style={{ background: pal.swatches[0] }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                  <TaycoCardFooterBar
                    leftMeta={
                      <span className="text-[10px] font-mono text-slate-400">
                        5 Connected Rooms · 24h Solar
                      </span>
                    }
                  >
                    <button
                      type="button"
                      data-magnetic
                      data-division-walkthrough-trigger={prop.code}
                      onClick={() => openModal(prop, 0)}
                      className="tayco-atelier-btn-gold group/btn"
                    >
                      <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5" />
                      <span>Step Inside · 5-Room Studio</span>
                      <StudioActionIcon
                        kind="arrow-right"
                        className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5"
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
}: {
  activeCategory?: PropertyCategoryMeta;
}) {
  const [selectedState, setSelectedState] = useState<string>("ALL");
  const [selectedAvailability, setSelectedAvailability] =
    useState<string>("ALL");
  const [specialtyGroupFilter, setSpecialtyGroupFilter] = useState<
    "all" | MarketSpecialtyGroup
  >("all");
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
            (s) => s.specialtyGroup === specialtyGroupFilter
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
              Properties
            </Link>
            {activeCategory && (
              <>
                <span className="text-slate-500">/</span>
                <span className="text-[#F3D37A] font-bold">
                  {activeCategory.label}
                </span>
              </>
            )}
          </nav>

          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#C9A84C]/50 bg-[#070E1A]/80 mb-4 tayco-atelier-eyebrow">
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[#F3D37A]">
                {activeCategory
                  ? activeCategory.eyebrow
                  : "TAYCO PROPERTY PORTFOLIO · ALL 4 CATEGORIES"}
              </span>
            </div>

            <h1 className="tayco-display-title text-3xl sm:text-5xl lg:text-6xl text-white leading-[1.05]">
              {activeCategory ? (
                <>
                  {activeCategory.headline}{" "}
                  <em
                    className="tayco-serif-em font-normal"
                    style={{ color: "#F3D37A" }}
                  >
                    {activeCategory.serifAccent}
                  </em>
                </>
              ) : (
                <>
                  All Property{" "}
                  <em
                    className="tayco-serif-em font-normal"
                    style={{ color: "#F3D37A" }}
                  >
                    Categories.
                  </em>
                </>
              )}
            </h1>

            <p className="mt-3 sm:mt-4 text-slate-200 text-sm sm:text-lg leading-relaxed max-w-2xl mx-auto line-clamp-3 sm:line-clamp-none">
              {activeCategory
                ? activeCategory.description
                : "Browse all available Single-Family Homes, Duplexes, Townhouses, and Commercial Properties constructed, renovated, and delivered turnkey across our 8-state footprint."}
            </p>

            {/* Category Summary Telemetry Card */}
            <div
              className="mt-5 sm:mt-8 p-4 sm:p-5 rounded-2xl border backdrop-blur-sm shrink-0 w-full max-w-2xl mx-auto text-center"
              style={{
                background: "rgba(7, 14, 26, 0.88)",
                borderColor: "rgba(201, 168, 76, 0.48)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.55)",
              }}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F3D37A] mb-1">
                {activeCategory ? activeCategory.label : "All 4 Primary Markets"}
              </div>
              <div className="text-2xl font-black text-white mb-3">
                {activeCategory
                  ? `${marketSpecialties.length} Specialties · ${baseListings.length} Projects`
                  : `4 Markets · ${PROPERTY_LISTINGS.length} Projects`}
              </div>
              <div className="hidden sm:flex flex-wrap items-center justify-around gap-3 text-xs text-slate-300 border-t border-white/10 pt-3">
                <div className="text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Market Services</span>
                  <span className="font-mono font-bold text-[#F3D37A]">
                    Roofing · Siding · Framing · Drywall
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Core Trades</span>
                  <span className="font-bold text-white">
                    Flooring · Concrete · Stone · Millwork
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Interactive Studio</span>
                  <span className="font-mono text-slate-200">
                    Click Any Photo to Expand
                  </span>
                </div>
              </div>
              {activeCategory && (
                <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 max-w-md mx-auto">
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => setExperienceMode("specialties")}
                    className="tayco-atelier-pill text-center justify-center"
                    data-active={experienceMode === "specialties" ? "true" : "false"}
                  >
                    <span>01 · Specialties ({marketSpecialties.length})</span>
                  </button>
                  <button
                    type="button"
                    data-magnetic
                    onClick={() => setExperienceMode("projects")}
                    className="tayco-atelier-pill text-center justify-center"
                    data-active={experienceMode === "projects" ? "true" : "false"}
                  >
                    <span>02 · 5-Room Tours ({baseListings.length})</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── 5-MARKET NAVIGATION BAR (CENTERED SYMMETRIC LAYOUT) ── */}
          <div className="mt-6 sm:mt-10 pt-4 sm:pt-6 border-t border-white/15 flex justify-center">
            <TaycoPillDock ariaLabel="Primary construction markets navigation">
              <Link
                href="/properties"
                aria-current={!activeCategory ? "page" : undefined}
                data-active={!activeCategory ? "true" : "false"}
                data-magnetic
                className="tayco-atelier-pill inline-flex items-center gap-2 py-2 px-3.5"
                title="All 4 Markets (24 Turnkey Projects)"
              >
                <span className="text-xs sm:text-[13px] font-bold tracking-wide">
                  All 4 Markets
                </span>
                <span translate="no" className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-mono font-bold">
                  24
                </span>
              </Link>
              {PROPERTY_CATEGORIES.map((cat) => {
                const isCurrent = activeCategory?.slug === cat.slug;
                const count = getPropertiesByCategory(cat.slug).length;
                return (
                  <Link
                    key={cat.slug}
                    href={`/properties/${cat.slug}`}
                    aria-current={isCurrent ? "page" : undefined}
                    data-active={isCurrent ? "true" : "false"}
                    data-magnetic
                    className="tayco-atelier-pill inline-flex items-center gap-2 py-2 px-3.5"
                    title={`${cat.label} (8 Specialties · ${count} Projects)`}
                  >
                    <span className="text-xs sm:text-[13px] font-bold tracking-wide">
                      {cat.label}
                    </span>
                    <span translate="no" className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#F3D37A]">
                      8 · {count}
                    </span>
                  </Link>
                );
              })}
            </TaycoPillDock>
          </div>
        </div>
      </section>

      {/* ── LIVE IMAGE IDENTIFIER & DUPLICATE DETECTOR + EXPERIENCE MODE SWITCHER ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8">
        {activeCategory && marketSpecialties.length > 0 && (
          <div
            data-testid="market-experience-mode-switcher"
            className="mt-5 p-2.5 rounded-2xl border flex flex-col md:flex-row items-stretch md:items-center justify-center gap-3 backdrop-blur-md max-w-4xl mx-auto"
            style={{
              background:
                "linear-gradient(135deg, rgba(11, 20, 38, 0.94) 0%, rgba(6, 11, 22, 0.98) 100%)",
              borderColor: "rgba(201, 168, 76, 0.42)",
              boxShadow: "0 18px 44px rgba(0,0,0,0.5)",
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
              <button
                type="button"
                data-magnetic
                onClick={() => setExperienceMode("specialties")}
                className="tayco-atelier-pill flex items-center justify-center text-center gap-3 px-4 py-3 min-h-[56px]"
                data-active={experienceMode === "specialties" ? "true" : "false"}
              >
                <div className="text-center">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">
                    MODE 01 · SERVICES BY SPECIALTY
                  </div>
                  <div className="text-sm font-bold tracking-tight mt-0.5">
                    {activeCategory.label} 8 Construction Specialties
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/25">
                  24 Photos
                </span>
              </button>

              <button
                type="button"
                data-magnetic
                onClick={() => setExperienceMode("projects")}
                className="tayco-atelier-pill flex items-center justify-center text-center gap-3 px-4 py-3 min-h-[56px]"
                data-active={experienceMode === "projects" ? "true" : "false"}
              >
                <div className="text-center">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-80">
                    MODE 02 · CONNECTED 5-ROOM WALKTHROUGHS
                  </div>
                  <div className="text-sm font-bold tracking-tight mt-0.5">
                    {activeCategory.label} Completed Project Tours ({baseListings.length})
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/25">
                  5 Rooms Each
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
                className="tayco-atelier-btn-gold shrink-0"
              >
                <StudioActionIcon kind="sparkle" className="w-4 h-4" />
                <span>Launch Full-Screen Studio</span>
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── SECTION 1: MARKET-SPECIFIC SERVICES BY SPECIALTY (WHEN IN SPECIALTIES MODE) ── */}
      {activeCategory &&
        marketSpecialties.length > 0 &&
        experienceMode === "specialties" && (
          <section
            id="market-services"
            aria-labelledby="market-services-heading"
            className="max-w-7xl mx-auto px-4 sm:px-8 pt-10 pb-12"
          >
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A84C]/45 bg-[#0F2040]/80 mb-3 tayco-atelier-eyebrow">
                <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#F3D37A]">
                  MODE 01 · {activeCategory.label.toUpperCase()} SERVICES BY SPECIALTY
                </span>
              </div>
              <h2
                id="market-services-heading"
                className="tayco-display-title text-2xl sm:text-4xl text-white tracking-tight"
              >
                {activeCategory.label} Construction{" "}
                <em
                  className="tayco-serif-em font-normal"
                  style={{ color: "#F3D37A" }}
                >
                  Specialties.
                </em>
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl mx-auto">
                Click any photograph or{" "}
                <strong className="text-[#F3D37A]">Expand Studio</strong> button
                below to inspect all 3 market angles at full screen with our{" "}
                <strong className="text-white">24-Hour Solar Lighting</strong>{" "}
                and{" "}
                <strong className="text-white">6 Designer Finish Palettes</strong>.
              </p>

              {/* Specialty Group Filter Tabs */}
              <div
                className="flex flex-wrap items-center justify-center gap-2 mt-6"
                role="group"
                aria-label="Filter specialties by trade group"
              >
                {(
                  [
                    { id: "all", label: `All Specialties (${marketSpecialties.length})` },
                    { id: "envelope", label: "Roofing & Siding" },
                    { id: "structural", label: "Framing, Concrete & Stone" },
                    { id: "interiors", label: "Drywall, Flooring & Interiors" },
                  ] as const
                ).map((tab) => {
                  const isSelected = specialtyGroupFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      data-magnetic
                      onClick={() => setSpecialtyGroupFilter(tab.id)}
                      className="tayco-atelier-pill"
                      data-active={isSelected ? "true" : "false"}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick-Jump Specialty Anchor Strip */}
            <div className="flex flex-wrap items-center justify-center gap-2 p-3.5 rounded-2xl bg-[#0F2040]/70 border border-[#C9A84C]/30 mb-8 max-w-5xl mx-auto text-center">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mr-1">
                Expand Specialty in Studio:
              </span>
              {marketSpecialties.map((spec) => (
                <button
                  key={spec.id}
                  type="button"
                  data-magnetic
                  onClick={() => {
                    if (baseListings[0]) {
                      openModal(baseListings[0], 0, 13.5, spec.specialtyId);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#070E1A]/90 border border-[#C9A84C]/40 hover:border-[#F3D37A] text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  <SpecialtyVectorIcon
                    specialtyId={spec.specialtyId}
                    className="w-3.5 h-3.5 text-[#F3D37A]"
                  />
                  <span>{spec.specialtyLabel}</span>
                </button>
              ))}
            </div>

            {/* 8 Market-Specific Specialty Cards Grid — 2 columns: 4x2 = 8, 2x2 = 4 (zero holes ever!) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
              {filteredSpecialties.map((spec) => (
                <MarketSpecialtyInteractiveCard
                  key={spec.id}
                  service={spec}
                  marketLabel={activeCategory.label}
                  onOpenSpecialtyStudio={(specialtyId, stepIdx, solarHour) => {
                    if (baseListings[0]) {
                      openModal(baseListings[0], stepIdx, solarHour, specialtyId);
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}

      {/* ── SECTION 2: PROJECT GALLERY & FILTER BAR (WHEN IN PROJECTS MODE OR ALL MARKETS) ── */}
      {(!activeCategory || experienceMode === "projects") && (
        <>
          <section
            id="market-projects"
            className="max-w-7xl mx-auto px-4 sm:px-8 pt-10"
          >
            {activeCategory && (
              <div className="mb-6 flex flex-col items-center text-center max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C9A84C]/45 bg-[#0F2040]/80 mb-3 tayco-atelier-eyebrow">
                  <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#F3D37A]">
                    MODE 02 · {activeCategory.label.toUpperCase()} PROJECT GALLERY &amp; 5-ROOM TOURS
                  </span>
                </div>
                <h2 className="tayco-display-title text-2xl sm:text-4xl text-white tracking-tight">
                  {activeCategory.label} Completed{" "}
                  <em
                    className="tayco-serif-em font-normal"
                    style={{ color: "#F3D37A" }}
                  >
                    Project Gallery.
                  </em>
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
                  Explore {baseListings.length} turnkey{" "}
                  <strong className="text-white">{activeCategory.label}</strong>{" "}
                  projects with interactive 5-Room Connected Walkthroughs,
                  Day/Night Solar Lighting and 6 Designer Palettes.
                </p>
              </div>
            )}
            <div
              className="p-4 sm:p-5 rounded-2xl border flex flex-col items-center justify-center gap-4 text-center max-w-5xl mx-auto"
              style={{
                background: "rgba(15, 32, 64, 0.72)",
                borderColor: "rgba(201, 168, 76, 0.3)",
              }}
            >
              {/* State Filter */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mr-2">
                  Filter by State:
                </span>
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

              {/* Availability Filter */}
              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mr-2">
                  Delivery Status:
                </span>
                {[
                  { id: "ALL", label: "All Available" },
                  { id: "Available · Move-In Ready", label: "Move-In Ready" },
                  {
                    id: "Available · Turnkey Delivery",
                    label: "Turnkey Delivery",
                  },
                  { id: "Available · Multiple Units", label: "Multiple Units" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    data-magnetic
                    onClick={() => setSelectedAvailability(opt.id)}
                    className="tayco-atelier-pill"
                    data-active={selectedAvailability === opt.id ? "true" : "false"}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── PROPERTY LISTINGS GRID ── */}
          <section
            aria-label={
              activeCategory
                ? `${activeCategory.label} listings`
                : "All property listings"
            }
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
                      {/* Clickable 5-Room Preview Header + 5-Room Switcher Strip */}
                      <PropertyCardInteractiveStage
                        property={prop}
                        onOpenStudio={(stepIdx, solarHour) =>
                          openModal(prop, stepIdx, solarHour, undefined)
                        }
                      />

                      <div className="p-4 sm:p-6 text-left flex flex-col">
                        {/* Top Badges: Code + Availability + State */}
                        <TaycoCardMetaBar
                          leftBadge={
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black"
                                style={{
                                  background: "rgba(201, 168, 76, 0.2)",
                                  color: "#F3D37A",
                                  border: "1px solid rgba(201, 168, 76, 0.45)",
                                }}
                              >
                                {prop.code}
                              </span>
                              <span translate="no" className="text-xs font-mono font-semibold text-slate-300">
                                {prop.location}
                              </span>
                            </div>
                          }
                          rightMeta={
                            <span
                              className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold"
                              style={{
                                background: "rgba(16, 185, 129, 0.16)",
                                color: "#6EE7B7",
                                border: "1px solid rgba(16, 185, 129, 0.4)",
                              }}
                            >
                              ● {prop.availability}
                            </span>
                          }
                          className="mb-3"
                        />

                        {/* Category Pill when viewing All */}
                        {!activeCategory && catMeta && (
                          <div className="mb-2 text-left">
                            <Link
                              href={`/properties/${catMeta.slug}`}
                              className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:underline"
                            >
                              {catMeta.label} →
                            </Link>
                          </div>
                        )}

                        {/* Title & Subtitle */}
                        <h2 className="tayco-card-title text-xl text-white leading-snug">
                          {prop.title}
                        </h2>
                        <p className="text-xs font-semibold text-[#F3D37A] mt-1">
                          {prop.subtitle}
                        </p>

                        {/* Specs Strip */}
                        <TaycoSpecGrid
                          columns={2}
                          className="my-3.5"
                          items={[
                            { label: "Total Area", value: prop.sqft },
                            { label: "Layout / Specs", value: prop.configuration },
                          ]}
                        />

                        {/* Summary */}
                        <p className="hidden sm:block text-sm text-slate-300 leading-relaxed mb-4 text-left">
                          {prop.summary}
                        </p>

                        {/* 3 Highlights */}
                        <div className="hidden sm:flex flex-wrap gap-2 text-xs text-slate-200 mb-4">
                          {prop.highlights.map((hl) => (
                            <span
                              key={hl}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#050A14]/70 border border-[#C9A84C]/25 text-[11px] text-slate-200"
                            >
                              <span
                                className="text-[#C9A84C] font-bold"
                                aria-hidden="true"
                              >
                                ◆
                              </span>
                              <span>{hl}</span>
                            </span>
                          ))}
                        </div>

                        {/* Interactive Continuity, Day/Night & Color Studio Bar */}
                        <div
                          onClick={() => openModal(prop, 0, 12.5, undefined)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openModal(prop, 0, 12.5, undefined);
                            }
                          }}
                          className="hidden sm:flex p-3 rounded-2xl border cursor-pointer transition-all hover:border-[#F3D37A] bg-[#070E1A]/90 border-[#C9A84C]/35 flex-col sm:flex-row items-center justify-between gap-2.5 w-full text-left"
                        >
                          <div className="min-w-0 text-left">
                            <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F3D37A]">
                              <StudioActionIcon
                                kind="sparkle"
                                className="w-3 h-3 text-[#F3D37A]"
                              />
                              <span>
                                5-ROOM TOUR · DAY/NIGHT LIGHT · 6 COLORS
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-start gap-2 text-[11px] text-slate-300 truncate mt-1">
                              <span className="inline-flex items-center gap-1">
                                <SolarPhaseIcon
                                  phase="morning"
                                  className="w-3 h-3 text-[#F3D37A]"
                                />
                                Morning
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="inline-flex items-center gap-1">
                                <SolarPhaseIcon
                                  phase="midday"
                                  className="w-3 h-3 text-[#F3D37A]"
                                />
                                Noon
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="inline-flex items-center gap-1">
                                <SolarPhaseIcon
                                  phase="sunset"
                                  className="w-3 h-3 text-[#F3D37A]"
                                />
                                Sunset
                              </span>
                              <span className="text-slate-600">·</span>
                              <span className="inline-flex items-center gap-1">
                                <SolarPhaseIcon
                                  phase="night"
                                  className="w-3 h-3 text-[#F3D37A]"
                                />
                                Night Lamps
                              </span>
                            </div>
                          </div>
                          <div
                            className="flex items-center -space-x-1.5 shrink-0 justify-center"
                            title="6 Interactive Designer Finish Palettes"
                          >
                            {DESIGNER_PALETTES.map((pal) => (
                              <span
                                key={pal.id}
                                className="w-4 h-4 rounded-full border border-white/70 shadow-sm"
                                style={{ background: pal.swatches[0] }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer — Bespoke Burnished Champagne-Gold Capsule Button */}
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-0">
                      <TaycoCardFooterBar
                        leftMeta={
                          <span className="text-[10px] font-mono text-slate-400">
                            5 Connected Rooms · 24h Solar
                          </span>
                        }
                      >
                        <button
                          type="button"
                          data-magnetic
                          data-walkthrough-trigger={prop.code}
                          onClick={() => openModal(prop, 0, 12.5, undefined)}
                          className="tayco-atelier-btn-gold group/btn"
                        >
                          <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5" />
                          <span>Step Inside · 5-Room Studio</span>
                          <StudioActionIcon
                            kind="arrow-right"
                            className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5"
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
            <div className="mt-8">
              <VisualAssetIntegrityHud
                scopeLabel={
                  activeCategory
                    ? activeCategory.label.toUpperCase()
                    : "ALL 4 MARKETS PORTFOLIO"
                }
              />
            </div>
          </section>
        </>
      )}

      {/* ── OTHER CATEGORIES EXPLORER AT BOTTOM OF PAGE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-20">
        <div
          className="p-6 sm:p-8 rounded-2xl border text-center"
          style={{
            background: "rgba(15, 32, 64, 0.65)",
            borderColor: "rgba(201, 168, 76, 0.35)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="text-center sm:text-left">
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#F3D37A]">
                EXPLORE ALL 4 PROPERTY CATEGORIES
              </div>
              <h2 className="tayco-card-title text-2xl text-white mt-1">
                Switch to Another Property Category
              </h2>
            </div>
            <Link
              href="/"
              data-magnetic
              className="tayco-atelier-btn-obsidian inline-flex items-center gap-1.5 self-center"
            >
              <span>← Return to Main Landing Page</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROPERTY_CATEGORIES.map((cat) => {
              const isCurrent = activeCategory?.slug === cat.slug;
              return (
                <article
                  key={cat.slug}
                  data-response-kind="surface"
                  className="relative p-5 rounded-xl border flex flex-col justify-between overflow-hidden text-center items-center"
                  style={{
                    background: isCurrent
                      ? "rgba(201, 168, 76, 0.18)"
                      : "rgba(7, 14, 26, 0.85)",
                    borderColor: isCurrent
                      ? "#F3D37A"
                      : "rgba(201, 168, 76, 0.3)",
                  }}
                >
                  <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
                  <div className="w-full flex flex-col items-center">
                    <div className="text-[10px] font-mono font-bold text-[#C9A84C]">
                      CATEGORY {cat.order}
                    </div>
                    <div className="text-base font-black text-white mt-1">
                      {cat.label}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {cat.typicalConfigLabel}
                    </div>
                  </div>
                  <Link
                    href={`/properties/${cat.slug}`}
                    data-magnetic
                    className="mt-4 w-full"
                  >
                    <span className="tayco-atelier-pill w-full block text-center" data-active={isCurrent ? "true" : "false"}>
                      {isCurrent ? "● Currently Viewing" : `${cat.ctaLabel} →`}
                    </span>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

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
