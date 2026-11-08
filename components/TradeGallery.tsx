"use client";
import { ImageReferenceButton } from "@/components/EstimateReferences";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import Image from "@/components/ProtectedImage";
import { TaycoModalOverlay, TaycoPillDock } from "@/components/ui/TaycoDesignSystem";

const SECTORS = [
  { key: "residential", label: "Single-Family", href: "/single-family", badge: "Single-Family" },
  { key: "multifamily", label: "Multifamily", href: "/multifamily", badge: "Multifamily" },
  { key: "townhomes", label: "Townhomes", href: "/townhomes", badge: "Townhomes" },
  { key: "commercial", label: "Commercial", href: "/commercial", badge: "Commercial" },
] as const;

type SectorKey = (typeof SECTORS)[number]["key"];

const TRADES = [
  {
    slug: "framing",
    name: "Framing",
    csi: "Framing",
    rate: "Estimate by project",
    spec: "Wall, floor and roof framing",
  },
  {
    slug: "carpentry",
    name: "Carpentry",
    csi: "Carpentry",
    rate: "Estimate by project",
    spec: "Cabinetry, trim and millwork",
  },
  {
    slug: "roofing",
    name: "Roofing",
    csi: "Roofing",
    rate: "Estimate by project",
    spec: "Roofing systems and flashing",
  },
  {
    slug: "siding",
    name: "Siding",
    csi: "Siding",
    rate: "Estimate by project",
    spec: "Siding and exterior trim",
  },
  {
    slug: "drywall",
    name: "Drywall",
    csi: "Drywall",
    rate: "Estimate by project",
    spec: "Walls, ceilings and finishes",
  },
  {
    slug: "painting",
    name: "Painting",
    csi: "Painting",
    rate: "Estimate by project",
    spec: "Interior and exterior coatings",
  },
  {
    slug: "flooring",
    name: "Flooring",
    csi: "Flooring",
    rate: "Estimate by project",
    spec: "Wood, tile, vinyl and concrete",
  },
  {
    slug: "stone",
    name: "Stone",
    csi: "Masonry",
    rate: "Estimate by project",
    spec: "Stone veneer and masonry",
  },
];

const photo = (trade: string, sector: SectorKey) =>
  `/work/${trade}_${sector}.jpg`;

const FLOOR_TYPES = [
  { slug: "hardwood", name: "Hardwood", csi: "Hardwood" },
  {
    slug: "engineered-hardwood",
    name: "Engineered Hardwood",
    csi: "Engineered Hardwood",
  },
  { slug: "lvp", name: "Luxury Vinyl Plank", csi: "LVP" },
  { slug: "lvt", name: "Luxury Vinyl Tile", csi: "LVT" },
  { slug: "laminate", name: "Laminate", csi: "Laminate" },
  { slug: "ceramic-tile", name: "Ceramic Tile", csi: "Ceramic Tile" },
  { slug: "porcelain-tile", name: "Porcelain Tile", csi: "Porcelain Tile" },
  { slug: "natural-stone", name: "Natural Stone", csi: "Natural Stone" },
  { slug: "carpet", name: "Carpet", csi: "Carpet" },
  { slug: "sheet-vinyl", name: "Sheet Vinyl", csi: "Sheet Vinyl" },
  { slug: "epoxy", name: "Epoxy", csi: "Epoxy" },
  {
    slug: "polished-concrete",
    name: "Polished Concrete",
    csi: "Polished Concrete",
  },
  { slug: "rubber", name: "Rubber", csi: "Rubber" },
  { slug: "bamboo", name: "Bamboo", csi: "Bamboo" },
  { slug: "cork", name: "Cork", csi: "Cork" },
];

interface GalleryZoomItem {
  src: string;
  alt: string;
  csi: string;
}

export default function TradeGallery() {
  const [active, setActive] = useState(TRADES[0].slug);
  const [zoomItem, setZoomItem] = useState<GalleryZoomItem | null>(null);
  const [zoomItems, setZoomItems] = useState<GalleryZoomItem[]>([]);
  const [zoomIdx, setZoomIdx] = useState<number>(0);

  const openZoom = useCallback((items: GalleryZoomItem[], index: number) => {
    setZoomItems(items);
    setZoomIdx(index);
    setZoomItem(items[index] ?? null);
  }, []);

  const handleStepPrev = useCallback(() => {
    setZoomIdx((current) => {
      if (zoomItems.length <= 1) return current;
      const nextIdx = (current - 1 + zoomItems.length) % zoomItems.length;
      setZoomItem(zoomItems[nextIdx]);
      return nextIdx;
    });
  }, [zoomItems]);

  const handleStepNext = useCallback(() => {
    setZoomIdx((current) => {
      if (zoomItems.length <= 1) return current;
      const nextIdx = (current + 1) % zoomItems.length;
      setZoomItem(zoomItems[nextIdx]);
      return nextIdx;
    });
  }, [zoomItems]);

  const handleCloseZoom = useCallback(() => {
    setZoomItem(null);
    setZoomItems([]);
    setZoomIdx(0);
  }, []);

  const trade = TRADES.find((t) => t.slug === active) ?? TRADES[0];

  const sectorPhotos = React.useMemo<GalleryZoomItem[]>(
    () =>
      SECTORS.map((s) => ({
        src: photo(trade.slug, s.key),
        alt: trade.name,
        csi: trade.name,
      })),
    [trade.slug, trade.name]
  );

  const flooringPhotos = React.useMemo<GalleryZoomItem[]>(
    () =>
      FLOOR_TYPES.flatMap((f) =>
        [1, 2].map((n) => ({
          src: `/work/flooring/${f.slug}_${n}.jpg`,
          alt: `${f.name} ${n}`,
          csi: f.name,
        }))
      ),
    []
  );

  return (
    <div className="space-y-6">
      {/* Interactive Trade Selection Pills */}
      <div className="flex justify-center">
        <TaycoPillDock ariaLabel="Choose a trade">
          {TRADES.map((t) => {
            const on = t.slug === active;
            return (
              <button
                key={t.slug}
                type="button"
                aria-pressed={on}
                data-active={on ? "true" : "false"}
                data-magnetic
                onClick={() => setActive(t.slug)}
                className="tayco-atelier-pill flex-row gap-2 min-h-11 py-2 px-3.5 sm:px-4 text-xs font-sans font-bold"
              >
                <span>{t.name}</span>
              </button>
            );
          })}
        </TaycoPillDock>
      </div>

      {/* 4-Photo Simultaneous Gallery Grid for the Active Specialty */}
      <div
        className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:pb-3 tayco-no-scrollbar"
        role="region"
        aria-label={trade.name}
      >
        {SECTORS.map((s, idx) => {
          const src = photo(trade.slug, s.key);
          const alt = trade.name;
          return (
            <figure
              key={s.key}
              data-response-kind="surface"
              className="tayco-living-card relative m-0 rounded-2xl overflow-hidden border p-3.5 sm:p-4 flex flex-col justify-between group shadow-xl max-md:w-[84vw] max-md:shrink-0 max-md:snap-center"
              style={{
                background:
                  "linear-gradient(155deg, #102039 0%, #081120 100%)",
                borderColor: "rgba(201, 168, 76, 0.38)",
              }}
            >
              <button
                type="button"
                onClick={() => openZoom(sectorPhotos, idx)}
                aria-label={`View ${alt} photograph`}
                className="relative block w-full rounded-xl overflow-hidden aspect-[3/2] border cursor-pointer"
                style={{ borderColor: "rgba(201, 168, 76, 0.32)" }}
              >
                <Image
                  fill
                  sizes="(min-width: 1280px) 23vw, (min-width: 768px) 45vw, 90vw"
                  src={src}
                  alt={alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </button>
              <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
            </figure>
          );
        })}
      </div>

      {/* Flooring Material Gallery */}
      {trade.slug === "flooring" && (
        <div
          className="mt-10 pt-8 border-t"
          style={{ borderColor: "rgba(201, 168, 76, 0.25)" }}
        >
          <div className="text-center mb-6">
            <h3 className="tayco-card-title text-xl sm:text-2xl font-bold text-center" style={{ color: "#F4F2EA" }}>
              Flooring Materials
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FLOOR_TYPES.map((f, fIdx) => (
              <figure
                key={f.slug}
                data-response-kind="surface"
                className="tayco-living-card relative m-0 p-4 rounded-2xl border shadow-lg text-left"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(11, 23, 42, 0.94) 0%, rgba(15, 32, 64, 0.9) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.35)",
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <figcaption
                    className="tayco-card-title text-sm sm:text-base font-bold text-left flex-1 truncate"
                    style={{ color: "#F3D37A" }}
                  >
                    {f.name}
                  </figcaption>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((n) => {
                    const src = `/work/flooring/${f.slug}_${n}.jpg`;
                    const alt = `${f.name} ${n}`;
                    const fPhotoIdx = fIdx * 2 + (n - 1);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => openZoom(flooringPhotos, fPhotoIdx)}
                        className="relative block w-full rounded-xl overflow-hidden border aspect-[3/2] cursor-pointer hover:opacity-95 transition-opacity"
                        style={{ borderColor: "rgba(201, 168, 76, 0.32)" }}
                      >
                        <Image
                          fill
                          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 85vw"
                          src={src}
                          alt={alt}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Architectural Lightbox Modal via TaycoModalOverlay */}
      {zoomItem && (
        <TaycoModalOverlay
          isOpen={true}
          onClose={handleCloseZoom}
          onStepPrev={zoomItems.length > 1 ? handleStepPrev : undefined}
          onStepNext={zoomItems.length > 1 ? handleStepNext : undefined}
          enableStageWheelStep={zoomItems.length > 1}
          enableStageSwipe={zoomItems.length > 1}
          ariaLabel={zoomItem.alt}
          backdropClassName="bg-[#040913]/92 backdrop-blur-xl"
        >
          {({ stageGestureHandlers }) => (
            <div
              className="relative w-full max-w-5xl max-h-[94dvh] overflow-y-auto tayco-scrollbar-sleek rounded-2xl border p-4 sm:p-5 shadow-2xl flex flex-col justify-between"
              style={{
                background:
                  "linear-gradient(155deg, #070E1A 0%, #0B172A 55%, #0F2040 100%)",
                borderColor: "#C9A84C",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, #C9A84C 0%, #DFC06C 100%)",
                      color: "#070E1A",
                    }}
                  >
                    {zoomItem.csi}
                  </span>
                  <span
                    className="text-xs sm:text-sm font-bold truncate"
                    style={{ color: "#F4F2EA" }}
                  >
                    {zoomItem.alt}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {zoomItems.length > 1 && (
                    <span className="text-[10px] font-mono text-slate-400">
                      {zoomIdx + 1} / {zoomItems.length}
                    </span>
                  )}
                  <ImageReferenceButton compact src={zoomItem.src} />
                  <button
                    type="button"
                    onClick={handleCloseZoom}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold border hover:bg-white/10 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                    style={{
                      borderColor: "rgba(201, 168, 76, 0.45)",
                      color: "#F3D37A",
                    }}
                    aria-label="Close"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#F3D37A"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    <span>Close</span>
                  </button>
                </div>
              </div>

              <div
                data-tayco-wheel-stage="true"
                onWheel={stageGestureHandlers.onWheel}
                onPointerDown={stageGestureHandlers.onPointerDown}
                onPointerUp={stageGestureHandlers.onPointerUp}
                className="relative w-full overflow-hidden rounded-xl border flex items-center justify-center bg-[#03060D]"
                style={{
                  maxHeight: "65dvh",
                  borderColor: "rgba(201, 168, 76, 0.28)",
                }}
              >
                <Image
                  width={1440}
                  height={960}
                  sizes="95vw"
                  src={zoomItem.src}
                  alt={zoomItem.alt}
                  className="w-full h-auto max-h-[65dvh] object-contain select-none"
                />
                {zoomItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handleStepPrev}
                      aria-label="Previous image"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#050A14]/75 backdrop-blur-md border border-white/20 text-[#F3D37A] hover:bg-[#C9A84C] hover:text-[#050A14] flex items-center justify-center transition-all cursor-pointer shadow-lg"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={handleStepNext}
                      aria-label="Next image"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#050A14]/75 backdrop-blur-md border border-white/20 text-[#F3D37A] hover:bg-[#C9A84C] hover:text-[#050A14] flex items-center justify-center transition-all cursor-pointer shadow-lg"
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3.5 border-t"
                style={{ borderColor: "rgba(201, 168, 76, 0.25)" }}
              >
                <span className="text-xs font-mono text-slate-300">
                  Trade gallery · Discuss materials and scope with TAYCO
                </span>
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/estimate?trade=${encodeURIComponent(zoomItem.csi)}`}
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold border"
                    style={{
                      background:
                        "linear-gradient(135deg, #C9A84C 0%, #DFC06C 55%, #F3D37A 100%)",
                      borderColor: "rgba(243, 211, 122, 0.7)",
                      color: "#070E1A",
                    }}
                  >
                    Ask about this trade →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </TaycoModalOverlay>
      )}
    </div>
  );
}
