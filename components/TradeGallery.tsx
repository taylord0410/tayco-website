"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import Image from "@/components/ProtectedImage";
import { TaycoModalOverlay } from "@/components/ui/TaycoDesignSystem";

const SECTORS = [
  { key: "residential", label: "Residential", badge: "Single-Family & Cabin" },
  { key: "multifamily", label: "Multifamily", badge: "Multi-Unit & Hospitality" },
  { key: "commercial", label: "Commercial", badge: "Ground-Up & Tenant TI" },
] as const;

type SectorKey = (typeof SECTORS)[number]["key"];

const TRADES = [
  {
    slug: "framing",
    name: "Framing",
    csi: "CSI 06 11 00",
    rate: "Project-specific estimate",
    spec: "Wall, floor and roof framing for your project",
  },
  {
    slug: "carpentry",
    name: "Carpentry",
    csi: "CSI 06 41 00",
    rate: "Project-specific estimate",
    spec: "Cabinetry, trim, millwork and finishing details",
  },
  {
    slug: "roofing",
    name: "Roofing",
    csi: "CSI 07 50 00",
    rate: "Project-specific estimate",
    spec: "Roof repairs, replacements and material options",
  },
  {
    slug: "siding",
    name: "Siding",
    csi: "CSI 07 46 00",
    rate: "Project-specific estimate",
    spec: "Siding, exterior trim and weather protection",
  },
  {
    slug: "drywall",
    name: "Drywall",
    csi: "CSI 09 29 00",
    rate: "Project-specific estimate",
    spec: "Walls, ceilings, smooth finishes and repairs",
  },
  {
    slug: "painting",
    name: "Painting",
    csi: "CSI 09 91 00",
    rate: "Project-specific estimate",
    spec: "Interior and exterior preparation and coatings",
  },
  {
    slug: "flooring",
    name: "Flooring",
    csi: "CSI 09 60 00",
    rate: "Project-specific estimate",
    spec: "Wood, tile, vinyl, concrete and specialty finishes",
  },
  {
    slug: "stone",
    name: "Stone",
    csi: "CSI 04 43 00",
    rate: "Project-specific estimate",
    spec: "Stone finishes, masonry and surface details",
  },
];

const photo = (trade: string, sector: SectorKey) =>
  `/work/${trade}_${sector}.jpg`;

const FLOOR_TYPES = [
  { slug: "hardwood", name: "Hardwood", csi: "CSI 09 64 00" },
  {
    slug: "engineered-hardwood",
    name: "Engineered Hardwood",
    csi: "CSI 09 64 29",
  },
  { slug: "lvp", name: "Luxury Vinyl Plank", csi: "CSI 09 65 19" },
  { slug: "lvt", name: "Luxury Vinyl Tile", csi: "CSI 09 65 19" },
  { slug: "laminate", name: "Laminate", csi: "CSI 09 62 00" },
  { slug: "ceramic-tile", name: "Ceramic Tile", csi: "CSI 09 30 13" },
  { slug: "porcelain-tile", name: "Porcelain Tile", csi: "CSI 09 30 13" },
  { slug: "natural-stone", name: "Natural Stone", csi: "CSI 09 63 40" },
  { slug: "carpet", name: "Carpet", csi: "CSI 09 68 00" },
  { slug: "sheet-vinyl", name: "Sheet Vinyl", csi: "CSI 09 65 16" },
  { slug: "epoxy", name: "Epoxy", csi: "CSI 09 67 23" },
  {
    slug: "polished-concrete",
    name: "Polished Concrete",
    csi: "CSI 03 35 43",
  },
  { slug: "rubber", name: "Rubber", csi: "CSI 09 65 00" },
  { slug: "bamboo", name: "Bamboo", csi: "CSI 09 64 00" },
  { slug: "cork", name: "Cork", csi: "CSI 09 65 00" },
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
        alt: `${trade.name} (${trade.csi}) — ${s.label}`,
        csi: trade.csi,
      })),
    [trade.slug, trade.name, trade.csi]
  );

  const flooringPhotos = React.useMemo<GalleryZoomItem[]>(
    () =>
      FLOOR_TYPES.flatMap((f) =>
        [1, 2].map((n) => ({
          src: `/work/flooring/${f.slug}_${n}.jpg`,
          alt: `${f.name} (${f.csi}) flooring ${n}`,
          csi: f.csi,
        }))
      ),
    []
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <p
          className="text-xs font-mono uppercase tracking-[0.22em] inline-flex items-center gap-2"
          style={{ color: "#F3D37A" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C9A84C"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
          <span>Types of work we perform · Trade &amp; material execution catalog</span>
        </p>
      </div>

      {/* Interactive CSI Trade Selection Pills */}
      <div
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
        role="group"
        aria-label="Choose a trade"
      >
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
              className="tayco-atelier-pill flex-row gap-2 py-2 px-3.5 sm:px-4 text-xs font-sans font-bold"
            >
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full tracking-wider font-bold"
                style={{
                  background: on
                    ? "rgba(6, 13, 26, 0.22)"
                    : "rgba(201, 168, 76, 0.16)",
                  color: on ? "#060D1A" : "#F3D37A",
                }}
              >
                {t.csi}
              </span>
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active CSI Division Specification Banner */}
      <div
        data-response-kind="surface"
        className="tayco-living-card p-5 sm:p-6 rounded-2xl border flex flex-col lg:flex-row items-center justify-between text-center lg:text-left gap-4 shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, #070E1A 0%, #0F2040 58%, #1B3A6B 100%)",
          borderColor: "rgba(201, 168, 76, 0.48)",
        }}
      >
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="tayco-atelier-eyebrow mb-1.5" style={{ color: "#F3D37A" }}>
            <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
            {trade.csi} · {trade.name.toUpperCase()} ASSEMBLY · {trade.rate}
          </div>
          <p className="text-xs sm:text-sm font-sans font-medium" style={{ color: "#F4F2EA" }}>
            {trade.spec}. Explore residential, multifamily and commercial applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2.5 shrink-0">
          <Link
            href={`/estimate?trade=${encodeURIComponent(trade.csi)}`}
            data-magnetic
            className="tayco-atelier-btn-gold text-xs font-bold"
          >
            Discuss {trade.name.toLowerCase()} →
          </Link>
          <Link
            href="/login"
            data-magnetic
            className="tayco-atelier-btn-obsidian text-xs font-bold"
          >
            Client sign in →
          </Link>
        </div>
      </div>

      {/* 3 Sector Photo Cards per Trade */}
      <div
        className="grid md:grid-cols-3 gap-6 max-md:flex max-md:overflow-x-auto max-md:snap-x max-md:snap-mandatory max-md:pb-3 tayco-no-scrollbar"
        role="tabpanel"
        aria-label={trade.name}
      >
        {SECTORS.map((s, idx) => {
          const src = photo(trade.slug, s.key);
          const alt = `${trade.name} (${trade.csi}) — ${s.label}`;
          const sectorIndex = `0${idx + 1} /`;
          return (
            <figure
              key={s.key}
              data-response-kind="surface"
              className="tayco-living-card relative m-0 rounded-2xl overflow-hidden border p-4 sm:p-5 flex flex-col justify-between group shadow-xl max-md:w-[84vw] max-md:shrink-0 max-md:snap-center"
              style={{
                background:
                  "linear-gradient(155deg, #0B172A 0%, #0F2040 55%, #070E1A 100%)",
                borderColor: "rgba(201, 168, 76, 0.38)",
              }}
            >
              <div className="flex flex-col gap-1.5 mb-3 px-1">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold" style={{ color: "#C9A84C" }}>
                      {sectorIndex}
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold"
                      style={{
                        background: "rgba(201, 168, 76, 0.14)",
                        borderColor: "rgba(201, 168, 76, 0.38)",
                        color: "#F3D37A",
                      }}
                    >
                      {trade.csi}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300">
                      {s.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => openZoom(sectorPhotos, idx)}
                      aria-label={`Zoom ${alt}`}
                      className="project-open cursor-pointer w-8 h-8 rounded-full border flex items-center justify-center transition-all hover:scale-105"
                      style={{
                        background: "rgba(7, 14, 26, 0.72)",
                        borderColor: "rgba(201, 168, 76, 0.42)",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F3D37A"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="15 3 21 3 21 9" />
                        <polyline points="9 21 3 21 3 15" />
                        <line x1="21" y1="3" x2="14" y2="10" />
                        <line x1="3" y1="21" x2="10" y2="14" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-start text-left mt-1">
                  <figcaption className="tayco-card-title text-xl sm:text-2xl text-white tracking-tight">
                    {s.label}
                  </figcaption>
                  <div className="text-[11px] font-sans font-medium text-slate-300">
                    {s.badge}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => openZoom(sectorPhotos, idx)}
                className="relative block w-full rounded-xl overflow-hidden aspect-[3/2] border cursor-pointer"
                style={{ borderColor: "rgba(201, 168, 76, 0.32)" }}
              >
                <Image
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  src={src}
                  alt={alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span
                  className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold backdrop-blur-md border inline-flex items-center gap-1.5"
                  style={{
                    background: "rgba(7, 14, 26, 0.86)",
                    borderColor: "rgba(201, 168, 76, 0.55)",
                    color: "#F3D37A",
                  }}
                >
                  <span>Open photo</span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#F3D37A"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </span>
              </button>

              <div
                className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t text-xs font-sans"
                style={{ borderColor: "rgba(201, 168, 76, 0.2)" }}
              >
                <Link
                  href={`/estimate?sector=${s.key}&trade=${encodeURIComponent(trade.csi)}`}
                  className="font-bold hover:underline"
                  style={{ color: "#F3D37A" }}
                >
                  Discuss this service →
                </Link>
                <Link
                  href="/login"
                  className="hover:underline inline-flex items-center gap-1"
                  style={{ color: "#E2C675" }}
                >
                  <span>/portal</span>
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#C9A84C"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </Link>
              </div>
              <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
            </figure>
          );
        })}
      </div>

      {/* CSI 09 60 00 Flooring Material Matrix */}
      {trade.slug === "flooring" && (
        <div
          className="mt-12 pt-8 border-t"
          style={{ borderColor: "rgba(201, 168, 76, 0.25)" }}
        >
          <div className="text-center mb-8">
            <div
              className="tayco-atelier-eyebrow justify-center mb-1.5"
              style={{ color: "#F3D37A" }}
            >
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              CSI 09 60 00 / 03 35 43 FLOORING MATERIAL MATRIX
            </div>
            <h3 className="tayco-card-title text-xl sm:text-2xl font-bold text-center" style={{ color: "#F4F2EA" }}>
              Explore 15 flooring options
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
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold shrink-0"
                    style={{
                      background: "rgba(201, 168, 76, 0.14)",
                      borderColor: "rgba(201, 168, 76, 0.38)",
                      color: "#F3D37A",
                    }}
                  >
                    {f.csi}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((n) => {
                    const src = `/work/flooring/${f.slug}_${n}.jpg`;
                    const alt = `${f.name} (${f.csi}) flooring ${n}`;
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
              <div className="flex items-center justify-between gap-4 mb-3.5">
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
                  <button
                    type="button"
                    onClick={handleCloseZoom}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border hover:bg-white/10 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
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
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold border hover:bg-white/10 transition-colors"
                    style={{
                      borderColor: "rgba(201, 168, 76, 0.48)",
                      color: "#F3D37A",
                    }}
                  >
                    Client sign in →
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
