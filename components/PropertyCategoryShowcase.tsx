"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedImage, {
  preloadProtectedImages,
  waitForDecodedSurfaces,
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
  type PropertyCategoryMeta,
  type PropertyListing,
} from "@/lib/property-catalog";
import { COMPANY } from "@/lib/company";

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
      {/* Main Clickable Photo Stage with Stacked 5-Room + Real Night Silky Crossfade */}
      <div
        role="button"
        tabIndex={0}
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
        {stops.map((st, idx) => {
          const isCurrent = idx === activeIdx;
          return (
            <div
              key={st.stepNumber}
              aria-hidden={!isCurrent}
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{
                opacity: isCurrent ? 1 : 0,
                transform: isCurrent ? "scale(1.0)" : "scale(1.05)",
                filter: cardFilter,
                transition:
                  "opacity 650ms cubic-bezier(0.16, 1, 0.3, 1), transform 850ms cubic-bezier(0.16, 1, 0.3, 1), filter 650ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <ProtectedImage
                src={st.src}
                loading={idx === 0 ? "eager" : "lazy"}
                alt={`${property.title} — ${st.title}`}
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
                  src={st.nightSrc}
                  loading={idx === 0 ? "eager" : "lazy"}
                  alt={`${property.title} — ${st.title} (Night)`}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/photo:scale-105"
                />
              </div>
            </div>
          );
        })}

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
            className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold border backdrop-blur-xl pointer-events-none"
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
            className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#050A14]/80 backdrop-blur-xl border border-white/15"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardMood(m.id);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all duration-300"
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
          <div className="text-xs font-bold text-white drop-shadow truncate">
            {currentStop.title}
          </div>
          <span
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 transition-transform duration-300 group-hover/photo:scale-105 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #E5C97B 0%, #C9A84C 100%)",
              color: "#050A14",
            }}
          >
            <StudioActionIcon kind="sparkle" className="w-2.5 h-2.5" />
            <span>Enter Studio</span>
            <StudioActionIcon kind="arrow-right" className="w-2.5 h-2.5" />
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
  const [studioSolarHour, setStudioSolarHour] = useState<number>(12.5);

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
    mood: "day" | "sunset" | "night" = "day"
  ) => {
    const hour = mood === "night" ? 21.5 : mood === "sunset" ? 18.5 : 12.5;
    setStudioSolarHour(hour);
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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-10 border-b border-[#C9A84C]/25">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#C9A84C]/45 bg-[#0F2040]/80 mb-4">
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-[#F3D37A]">
                PROPERTY PORTFOLIO BY CATEGORY · 8 STATES
              </span>
            </div>
            <h2
              id="property-categories-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.08]"
            >
              Browse Properties by{" "}
              <em
                className="tayco-serif-em font-normal"
                style={{ color: "#F3D37A" }}
              >
                Architectural Category.
              </em>
            </h2>
            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              Select a category below to open its dedicated page (
              <strong className="text-white">Single-Family Homes</strong>,{" "}
              <strong className="text-white">Duplexes</strong>,{" "}
              <strong className="text-white">Townhouses</strong>,{" "}
              <strong className="text-white">Commercial Properties</strong>) or
              launch the{" "}
              <strong className="text-[#F3D37A]">
                Interactive 5-Room Walkthrough, Day/Night Solar Lighting &amp;
                Color Studio
              </strong>{" "}
              on any residence.
            </p>
          </div>

          {/* Direct Category Quick-Links + View All */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {PROPERTY_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/properties/${cat.slug}`}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-all hover:scale-105"
                style={{
                  background: "rgba(15, 32, 64, 0.85)",
                  borderColor: "rgba(201, 168, 76, 0.45)",
                  color: "#F3D37A",
                }}
              >
                {cat.label} →
              </Link>
            ))}
            <Link
              href="/properties"
              className="px-4 py-2 rounded-xl text-xs font-mono font-black transition-all hover:scale-105 shadow-md"
              style={{
                background: "#C9A84C",
                color: "#070E1A",
              }}
            >
              All 24 Properties ↗
            </Link>
          </div>
        </div>

        {/* 4-Category Architectural Grid (2x2 on Desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {PROPERTY_CATEGORIES.map((cat) => {
            const categoryListings = getPropertiesByCategory(cat.slug);
            const flagshipProperty = categoryListings[0];
            const galleryUrls = [cat.heroImage, ...cat.secondaryImages];
            const activeIdx = activeThumbMap[cat.slug] ?? 0;
            const catMood = categoryMoodMap[cat.slug] ?? "day";
            const catFilter =
              catMood === "sunset"
                ? "brightness(0.96) contrast(1.12) saturate(1.28) sepia(0.20)"
                : "none";

            return (
              <article
                key={cat.slug}
                data-category-card={cat.slug}
                className="group relative rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.65)]"
                style={{
                  background:
                    "linear-gradient(165deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.98) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.42)",
                }}
              >
                {/* Top Visual Stage — Clickable to Category Page with Stacked 650ms Crossfade + Real Night */}
                <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-[#040811]">
                  <Link
                    href={`/properties/${cat.slug}`}
                    aria-label={`Open ${cat.label} page`}
                    className="block w-full h-full relative"
                  >
                    {galleryUrls.map((url, idx) => {
                      const isSelected = idx === activeIdx;
                      const nightUrl = resolveNightImageSrc(url);
                      return (
                        <div
                          key={url}
                          aria-hidden={!isSelected}
                          className="absolute inset-0 w-full h-full pointer-events-none"
                          style={{
                            opacity: isSelected ? 1 : 0,
                            transform: isSelected ? "scale(1.0)" : "scale(1.05)",
                            filter: catFilter,
                            transition:
                              "opacity 650ms cubic-bezier(0.16, 1, 0.3, 1), transform 850ms cubic-bezier(0.16, 1, 0.3, 1), filter 650ms cubic-bezier(0.22, 1, 0.36, 1)",
                          }}
                        >
                          <ProtectedImage
                            src={url}
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
                              src={nightUrl}
                              syncUrls={galleryUrls}
                              alt={`${cat.label} (Night)`}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          </div>
                        </div>
                      );
                    })}
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
                      className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border backdrop-blur-md pointer-events-none"
                      style={{
                        background: "rgba(7, 14, 26, 0.84)",
                        borderColor: "rgba(201, 168, 76, 0.55)",
                        color: "#F3D37A",
                      }}
                    >
                      {cat.eyebrow}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex items-center gap-0.5 p-0.5 rounded-full bg-[#050A14]/85 backdrop-blur-xl border border-white/15"
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setCategoryMoodMap((prev) => ({
                                  ...prev,
                                  [cat.slug]: m.id,
                                }));
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold cursor-pointer transition-all duration-300"
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
                      <span
                        className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider shadow-md pointer-events-none"
                        style={{
                          background: "#C9A84C",
                          color: "#070E1A",
                        }}
                      >
                        {cat.totalAvailableBadge}
                      </span>
                    </div>
                  </div>

                  {/* Bottom-Left Headline Overlay + Bottom-Right 3-Photo Switcher */}
                  <div className="absolute bottom-3.5 left-4 right-4 flex items-end justify-between gap-3">
                    <Link
                      href={`/properties/${cat.slug}`}
                      className="min-w-0 group/title"
                    >
                      <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md group-hover/title:text-[#F3D37A] transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-xs text-slate-200 font-medium truncate">
                        {cat.subtitle}
                      </p>
                    </Link>

                    {/* 3-Photo Synchronized Preview Switcher */}
                    <div
                      className="flex items-center gap-1.5 bg-[#070E1A]/85 p-1.5 rounded-xl border border-[#C9A84C]/40 backdrop-blur-md shrink-0"
                      role="group"
                      aria-label={`Preview ${cat.label} photography`}
                    >
                      {galleryUrls.map((url, idx) => {
                        const isSelected = idx === activeIdx;
                        return (
                          <button
                            key={url}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              handleSelectPreview(cat.slug, idx, galleryUrls);
                            }}
                            onPointerEnter={() =>
                              handleSelectPreview(cat.slug, idx, galleryUrls)
                            }
                            className="w-6 h-6 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center justify-center"
                            style={{
                              background: isSelected
                                ? "#C9A84C"
                                : "rgba(15, 32, 64, 0.9)",
                              color: isSelected ? "#070E1A" : "#E2E8F0",
                            }}
                            title={`View ${cat.label} photo ${idx + 1}`}
                          >
                            0{idx + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Body — Description, Specs & Clickable Property Tour Chips */}
                <div className="p-6 flex-1 flex flex-col justify-between gap-5">
                  <div>
                    <p className="text-slate-300 text-sm leading-relaxed mb-4">
                      {cat.description}
                    </p>

                    {/* Specs Strip */}
                    <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-[#070E1A]/80 border border-white/10 mb-4">
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Typical Footprint
                        </div>
                        <div className="text-xs font-bold text-[#F3D37A] mt-0.5">
                          {cat.typicalSqftRange}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Configuration
                        </div>
                        <div className="text-xs font-bold text-white mt-0.5">
                          {cat.typicalConfigLabel}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                          Scope Divisions
                        </div>
                        <div className="text-xs font-mono font-bold text-[#C9A84C] mt-0.5">
                          {cat.csiDivisions}
                        </div>
                      </div>
                    </div>

                    {/* Clickable Properties — Click any chip to launch its 5-Room Walkthrough & Day/Night Studio! */}
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-[#F3D37A] mb-2">
                        <StudioActionIcon
                          kind="sparkle"
                          className="w-3 h-3 text-[#F3D37A]"
                        />
                        <span>
                          Click Any Property for 5-Room Tour, Day/Night Light &amp; Colors:
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {categoryListings.slice(0, 4).map((prop) => (
                          <button
                            key={prop.id}
                            type="button"
                            onClick={() => openCategoryStudio(prop, catMood)}
                            className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#070E1A]/85 border border-[#C9A84C]/35 hover:border-[#F3D37A] hover:bg-[#0F2040] text-xs transition-all cursor-pointer text-left"
                          >
                            <span className="font-semibold text-slate-100 truncate">
                              <strong className="font-mono text-[#F3D37A] mr-1.5">
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

                  {/* Action Footer: Launch Interactive Studio OR Open Full Category Page */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
                    {flagshipProperty && (
                      <button
                        type="button"
                        onClick={() =>
                          openCategoryStudio(flagshipProperty, catMood)
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold border cursor-pointer transition-all hover:bg-white/10"
                        style={{
                          background: "rgba(7, 14, 26, 0.9)",
                          borderColor: "rgba(243, 211, 122, 0.55)",
                          color: "#F3D37A",
                        }}
                      >
                        <StudioActionIcon
                          kind="sparkle"
                          className="w-3.5 h-3.5 text-[#F3D37A]"
                        />
                        <span>5-Room Tour &amp; Day/Night Studio</span>
                      </button>
                    )}

                    <Link
                      href={`/properties/${cat.slug}`}
                      data-magnetic
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 hover:scale-105 shadow-lg"
                      style={{
                        background: "#C9A84C",
                        color: "#070E1A",
                      }}
                    >
                      {cat.ctaLabel} ({categoryListings.length}){" "}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Interactive Walkthrough Studio Modal when triggered from Landing Page */}
      {studioProperty && (
        <PropertyWalkthroughStudioModal
          property={studioProperty}
          initialStepIndex={0}
          initialSolarHour={studioSolarHour}
          onClose={() => setStudioProperty(null)}
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
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 mb-8 border-b border-[#C9A84C]/25">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#C9A84C]/45 bg-[#0F2040]/85 mb-4">
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

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.06]">
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

            <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
              {isResidential
                ? "Toggle Day, Sunset, and Night right on any Single-Family Home, Duplex, or Townhouse card to see its real 2700K nighttime architectural illumination, preview all 5 connected rooms (01 Exterior → 05 Patio/Terrace), or launch the full-screen Walkthrough & 6-Palette Color Studio."
                : "Toggle Day, Sunset, and Night right on any Corporate HQ, Retail Plaza, Medical Suite, or High-Bay Industrial facility to inspect its real 2700K nighttime illumination, preview all 5 connected spaces (01 Street Facade → 05 Executive Terrace), or launch the full-screen Walkthrough & Finish Studio."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link
              href={
                isResidential ? "/properties/single-family" : "/properties/commercial"
              }
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-black transition-all hover:scale-105 shadow-md"
              style={{
                background: "#C9A84C",
                color: "#070E1A",
              }}
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
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          {isResidential ? (
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter residential properties"
            >
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
                    onClick={() => setResFilter(tab.id)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer"
                    style={{
                      background: active
                        ? "#C9A84C"
                        : "rgba(15, 32, 64, 0.78)",
                      color: active ? "#070E1A" : "#F3D37A",
                      borderColor: active
                        ? "#F3D37A"
                        : "rgba(201, 168, 76, 0.35)",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="Filter commercial properties"
            >
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
                    onClick={() => setComFilter(tab.id)}
                    className="px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer"
                    style={{
                      background: active
                        ? "#C9A84C"
                        : "rgba(15, 32, 64, 0.78)",
                      color: active ? "#070E1A" : "#F3D37A",
                      borderColor: active
                        ? "#F3D37A"
                        : "rgba(201, 168, 76, 0.35)",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-xs font-mono text-slate-300">
            <span className="text-[#F3D37A] font-bold">
              ● 100% People-Free Architectural Photography
            </span>{" "}
            · Real 2700K Night + 6 Palettes
          </div>
        </div>

        {/* Interactive Property Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {visibleListings.map((prop) => {
            const catMeta = PROPERTY_CATEGORIES.find(
              (c) => c.slug === prop.category
            );
            return (
              <article
                key={prop.id}
                data-division-property-card={prop.code}
                className="rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
                style={{
                  background:
                    "linear-gradient(165deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.98) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.38)",
                }}
              >
                <div>
                  <PropertyCardInteractiveStage
                    property={prop}
                    onOpenStudio={(stepIdx, solarHour) =>
                      openModal(prop, stepIdx, solarHour)
                    }
                  />

                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded text-[11px] font-mono font-black"
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
                    </div>

                    {catMeta && (
                      <div className="mb-1.5">
                        <Link
                          href={`/properties/${catMeta.slug}`}
                          className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:underline"
                        >
                          {catMeta.label} →
                        </Link>
                      </div>
                    )}

                    <h3 className="text-xl font-black text-white tracking-tight leading-snug">
                      {prop.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#F3D37A] mt-1">
                      {prop.subtitle}
                    </p>

                    <div className="grid grid-cols-2 gap-2.5 my-4 p-3 rounded-xl bg-[#070E1A]/85 border border-white/10">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Total Area
                        </div>
                        <div className="text-xs font-mono font-bold text-white mt-0.5">
                          {prop.sqft}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Layout / Specs
                        </div>
                        <div className="text-xs font-bold text-[#F3D37A] mt-0.5">
                          {prop.configuration}
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
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
                      className="p-3 rounded-xl border cursor-pointer transition-all hover:border-[#F3D37A] bg-[#070E1A]/90 border-[#C9A84C]/35 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F3D37A]">
                          <StudioActionIcon
                            kind="sparkle"
                            className="w-3 h-3 text-[#F3D37A]"
                          />
                          <span>5-SPACE TOUR · REAL NIGHT · 6 PALETTES</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 truncate mt-1">
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
                        className="flex items-center -space-x-1.5 shrink-0"
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

                <div className="px-6 pb-6 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    data-division-walkthrough-trigger={prop.code}
                    onClick={() => openModal(prop, 0)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-black border cursor-pointer transition-all hover:scale-105 shadow-md"
                    style={{
                      background: "#C9A84C",
                      borderColor: "#F3D37A",
                      color: "#070E1A",
                    }}
                  >
                    <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5" />
                    <span>Step Inside · Tour, Light &amp; Colors</span>
                  </button>
                  <Link
                    href={`/estimate?property=${encodeURIComponent(
                      `${prop.code} - ${prop.title}`
                    )}&category=${encodeURIComponent(prop.category)}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-colors hover:bg-white/10"
                    style={{
                      borderColor: "rgba(201, 168, 76, 0.45)",
                      color: "#F3D37A",
                    }}
                  >
                    Estimate →
                  </Link>
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
  const [inspectedProperty, setInspectedProperty] =
    useState<PropertyListing | null>(null);
  const [modalFrameIdx, setModalFrameIdx] = useState<number>(0);
  const [modalSolarHour, setModalSolarHour] = useState<number>(12.5);

  const baseListings = activeCategory
    ? getPropertiesByCategory(activeCategory.slug)
    : PROPERTY_LISTINGS;

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
    preloadProtectedImages(urls);
  }, [baseListings]);

  // If navigated with #property-id hash, automatically open its Walkthrough Studio
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "").trim().toLowerCase();
    if (!hash) return;
    const found = baseListings.find((p) => p.id.toLowerCase() === hash);
    if (found) {
      setModalFrameIdx(0);
      setInspectedProperty(found);
    }
  }, [baseListings]);

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
            className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-300 mb-6"
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

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#C9A84C]/50 bg-[#070E1A]/80 mb-4">
                <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
                <span className="text-[11px] font-mono font-bold uppercase tracking-[0.18em] text-[#F3D37A]">
                  {activeCategory
                    ? activeCategory.eyebrow
                    : "TAYCO PROPERTY PORTFOLIO · ALL 4 CATEGORIES"}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05]">
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

              <p className="mt-4 text-slate-200 text-base sm:text-lg leading-relaxed">
                {activeCategory
                  ? activeCategory.description
                  : "Browse all available Single-Family Homes, Duplexes, Townhouses, and Commercial Properties constructed, renovated, and delivered turnkey across our 8-state footprint."}
              </p>
            </div>

            {/* Category Summary Telemetry Card */}
            <div
              className="p-5 rounded-2xl border backdrop-blur-md shrink-0 w-full lg:w-80"
              style={{
                background: "rgba(7, 14, 26, 0.84)",
                borderColor: "rgba(201, 168, 76, 0.45)",
              }}
            >
              <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#F3D37A] mb-1">
                {activeCategory ? activeCategory.label : "Full Portfolio"}
              </div>
              <div className="text-2xl font-black text-white mb-3">
                {baseListings.length} Available Properties
              </div>
              <div className="space-y-1.5 text-xs text-slate-300 border-t border-white/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Interactive Tour:</span>
                  <span className="font-mono font-bold text-[#F3D37A]">
                    5 Connected Spaces / Property
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Solar Lighting:</span>
                  <span className="font-bold text-white">
                    Morning · Noon · Sunset · Night
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Color Customizer:</span>
                  <span className="font-mono text-slate-200">
                    6 Palettes + 50/50 Compare
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 4-CATEGORY NAVIGATION BAR (SWITCH BETWEEN CATEGORIES) ── */}
          <div
            className="mt-10 pt-6 border-t border-white/15 flex flex-wrap items-center gap-2.5"
            role="navigation"
            aria-label="Property categories navigation"
          >
            <Link
              href="/properties"
              aria-current={!activeCategory ? "page" : undefined}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold border transition-all"
              style={{
                background: !activeCategory
                  ? "#C9A84C"
                  : "rgba(7, 14, 26, 0.78)",
                color: !activeCategory ? "#070E1A" : "#E2E8F0",
                borderColor: !activeCategory
                  ? "#F3D37A"
                  : "rgba(201, 168, 76, 0.35)",
              }}
            >
              All Categories ({PROPERTY_LISTINGS.length})
            </Link>
            {PROPERTY_CATEGORIES.map((cat) => {
              const isCurrent = activeCategory?.slug === cat.slug;
              const count = getPropertiesByCategory(cat.slug).length;
              return (
                <Link
                  key={cat.slug}
                  href={`/properties/${cat.slug}`}
                  aria-current={isCurrent ? "page" : undefined}
                  className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold border transition-all"
                  style={{
                    background: isCurrent
                      ? "#C9A84C"
                      : "rgba(7, 14, 26, 0.78)",
                    color: isCurrent ? "#070E1A" : "#F3D37A",
                    borderColor: isCurrent
                      ? "#F3D37A"
                      : "rgba(201, 168, 76, 0.4)",
                  }}
                >
                  {cat.label} ({count})
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FILTER BAR (STATE + AVAILABILITY) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 pt-8">
        <div
          className="p-4 sm:p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
          style={{
            background: "rgba(15, 32, 64, 0.72)",
            borderColor: "rgba(201, 168, 76, 0.3)",
          }}
        >
          {/* State Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mr-2">
              Filter by State:
            </span>
            <button
              type="button"
              onClick={() => setSelectedState("ALL")}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-colors"
              style={{
                background:
                  selectedState === "ALL" ? "#C9A84C" : "rgba(7, 14, 26, 0.8)",
                color: selectedState === "ALL" ? "#070E1A" : "#E2E8F0",
                borderColor:
                  selectedState === "ALL"
                    ? "#F3D37A"
                    : "rgba(201, 168, 76, 0.3)",
              }}
            >
              All States ({baseListings.length})
            </button>
            {availableStates.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedState(st)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-colors"
                style={{
                  background:
                    selectedState === st ? "#C9A84C" : "rgba(7, 14, 26, 0.8)",
                  color: selectedState === st ? "#070E1A" : "#F3D37A",
                  borderColor:
                    selectedState === st
                      ? "#F3D37A"
                      : "rgba(201, 168, 76, 0.3)",
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Availability Filter */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 mr-2">
              Delivery Status:
            </span>
            {[
              { id: "ALL", label: "All Available" },
              { id: "Available · Move-In Ready", label: "Move-In Ready" },
              { id: "Available · Turnkey Delivery", label: "Turnkey Delivery" },
              { id: "Available · Multiple Units", label: "Multiple Units" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedAvailability(opt.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold border cursor-pointer transition-colors"
                style={{
                  background:
                    selectedAvailability === opt.id
                      ? "#C9A84C"
                      : "rgba(7, 14, 26, 0.8)",
                  color:
                    selectedAvailability === opt.id ? "#070E1A" : "#E2E8F0",
                  borderColor:
                    selectedAvailability === opt.id
                      ? "#F3D37A"
                      : "rgba(201, 168, 76, 0.3)",
                }}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredListings.map((prop) => {
            const catMeta = PROPERTY_CATEGORIES.find(
              (c) => c.slug === prop.category
            );
            return (
              <article
                key={prop.id}
                id={prop.id}
                data-property-card={prop.code}
                className="rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
                style={{
                  background:
                    "linear-gradient(165deg, rgba(15, 32, 64, 0.92) 0%, rgba(7, 14, 26, 0.98) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.38)",
                }}
              >
                <div>
                  {/* Clickable 5-Room Preview Header + 5-Room Switcher Strip */}
                  <PropertyCardInteractiveStage
                    property={prop}
                    onOpenStudio={(stepIdx, solarHour) =>
                      openModal(prop, stepIdx, solarHour)
                    }
                  />

                  <div className="p-6">
                    {/* Top Badges: Code + Availability + State */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded text-[11px] font-mono font-black"
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
                    </div>

                    {/* Category Pill when viewing All */}
                    {!activeCategory && catMeta && (
                      <div className="mb-2">
                        <Link
                          href={`/properties/${catMeta.slug}`}
                          className="text-[10px] font-mono uppercase tracking-widest text-[#C9A84C] hover:underline"
                        >
                          {catMeta.label} →
                        </Link>
                      </div>
                    )}

                    {/* Title & Subtitle */}
                    <h2 className="text-xl font-black text-white tracking-tight leading-snug">
                      {prop.title}
                    </h2>
                    <p className="text-xs font-semibold text-[#F3D37A] mt-1">
                      {prop.subtitle}
                    </p>

                    {/* Specs Strip */}
                    <div className="grid grid-cols-2 gap-2.5 my-4 p-3 rounded-xl bg-[#070E1A]/85 border border-white/10">
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Total Area
                        </div>
                        <div className="text-xs font-mono font-bold text-white mt-0.5">
                          {prop.sqft}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono uppercase text-slate-400">
                          Layout / Specs
                        </div>
                        <div className="text-xs font-bold text-[#F3D37A] mt-0.5">
                          {prop.configuration}
                        </div>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                      {prop.summary}
                    </p>

                    {/* 3 Highlights */}
                    <ul className="space-y-1.5 text-xs text-slate-200 mb-4">
                      {prop.highlights.map((hl) => (
                        <li key={hl} className="flex items-start gap-2">
                          <span
                            className="text-[#C9A84C] font-bold mt-0.5"
                            aria-hidden="true"
                          >
                            ◆
                          </span>
                          <span>{hl}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Interactive Continuity, Day/Night & Color Studio Bar */}
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
                      className="p-3 rounded-xl border cursor-pointer transition-all hover:border-[#F3D37A] bg-[#070E1A]/90 border-[#C9A84C]/35 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#F3D37A]">
                          <StudioActionIcon
                            kind="sparkle"
                            className="w-3 h-3 text-[#F3D37A]"
                          />
                          <span>5-ROOM TOUR · DAY/NIGHT LIGHT · 6 COLORS</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-300 truncate mt-1">
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
                        className="flex items-center -space-x-1.5 shrink-0"
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

                {/* Action Footer */}
                <div className="px-6 pb-6 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    data-walkthrough-trigger={prop.code}
                    onClick={() => openModal(prop, 0)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-mono font-black border cursor-pointer transition-all hover:scale-105 shadow-md"
                    style={{
                      background: "#C9A84C",
                      borderColor: "#F3D37A",
                      color: "#070E1A",
                    }}
                  >
                    <StudioActionIcon kind="sparkle" className="w-3.5 h-3.5" />
                    <span>Step Inside · Tour, Light &amp; Colors</span>
                  </button>
                  <Link
                    href={`/estimate?property=${encodeURIComponent(
                      `${prop.code} - ${prop.title}`
                    )}&category=${encodeURIComponent(prop.category)}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold border transition-colors hover:bg-white/10"
                    style={{
                      borderColor: "rgba(201, 168, 76, 0.45)",
                      color: "#F3D37A",
                    }}
                  >
                    Estimate →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── OTHER CATEGORIES EXPLORER AT BOTTOM OF PAGE ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 mt-20">
        <div
          className="p-6 sm:p-8 rounded-2xl border"
          style={{
            background: "rgba(15, 32, 64, 0.65)",
            borderColor: "rgba(201, 168, 76, 0.35)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#F3D37A]">
                EXPLORE ALL 4 PROPERTY CATEGORIES
              </div>
              <h2 className="text-2xl font-black text-white mt-1">
                Switch to Another Property Category
              </h2>
            </div>
            <Link
              href="/"
              className="text-xs font-mono font-bold text-[#F3D37A] hover:underline"
            >
              ← Return to Main Landing Page
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PROPERTY_CATEGORIES.map((cat) => {
              const isCurrent = activeCategory?.slug === cat.slug;
              return (
                <Link
                  key={cat.slug}
                  href={`/properties/${cat.slug}`}
                  className="p-4 rounded-xl border transition-all hover:-translate-y-0.5 flex flex-col justify-between"
                  style={{
                    background: isCurrent
                      ? "rgba(201, 168, 76, 0.18)"
                      : "rgba(7, 14, 26, 0.85)",
                    borderColor: isCurrent
                      ? "#F3D37A"
                      : "rgba(201, 168, 76, 0.3)",
                  }}
                >
                  <div>
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
                  <div className="mt-4 text-xs font-mono font-bold text-[#F3D37A]">
                    {isCurrent ? "● Currently Viewing" : `${cat.ctaLabel} →`}
                  </div>
                </Link>
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
          onClose={() => setInspectedProperty(null)}
        />
      )}
    </main>
  );
}
