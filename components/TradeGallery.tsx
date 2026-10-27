"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

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

export default function TradeGallery() {
  const [active, setActive] = useState(TRADES[0].slug);
  const [zoom, setZoom] = useState<{
    src: string;
    alt: string;
    csi: string;
  } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!zoom || !dialogRef.current) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [zoom]);
  const trade = TRADES.find((t) => t.slug === active) ?? TRADES[0];

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
        className="flex flex-wrap justify-center gap-2.5"
        role="group"
        aria-label="Choose a trade"
      >
        {TRADES.map((t) => {
          const on = t.slug === active;
          return (
            <button
              key={t.slug}
              type="button"
              aria-pressed={active === t.slug}
              data-magnetic
              onClick={() => setActive(t.slug)}
              className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center gap-2"
              style={
                on
                  ? {
                      background:
                        "linear-gradient(135deg, #070E1A 0%, #0F2040 55%, #1B3A6B 100%)",
                      borderColor: "#C9A84C",
                      color: "#F3D37A",
                      boxShadow: "0 12px 26px -10px rgba(201, 168, 76, 0.58)",
                    }
                  : {
                      background: "rgba(11, 23, 42, 0.84)",
                      borderColor: "rgba(201, 168, 76, 0.3)",
                      color: "#F4F2EA",
                    }
              }
            >
              <span
                className="font-mono text-[10px] px-2 py-0.5 rounded font-black tracking-wider"
                style={{
                  background: on
                    ? "linear-gradient(135deg, #C9A84C 0%, #DFC06C 100%)"
                    : "rgba(201, 168, 76, 0.16)",
                  color: on ? "#070E1A" : "#F3D37A",
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
        className="tayco-living-card p-5 sm:p-6 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-2xl"
        style={{
          background:
            "linear-gradient(135deg, #070E1A 0%, #0F2040 58%, #1B3A6B 100%)",
          borderColor: "rgba(201, 168, 76, 0.48)",
        }}
      >
        <div>
          <div className="tayco-eyebrow mb-1.5" style={{ color: "#F3D37A" }}>
            <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
            {trade.csi} · {trade.name.toUpperCase()} ASSEMBLY · {trade.rate}
          </div>
          <p className="text-xs sm:text-sm font-medium" style={{ color: "#F4F2EA" }}>
            {trade.spec}. Explore residential, multifamily and commercial applications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href={`/estimate?trade=${encodeURIComponent(trade.csi)}`}
            data-magnetic
            className="px-4 py-2.5 rounded-xl text-xs font-black transition-transform hover:scale-105 border"
            style={{
              background:
                "linear-gradient(135deg, #C9A84C 0%, #DFC06C 55%, #F3D37A 100%)",
              borderColor: "rgba(243, 211, 122, 0.75)",
              color: "#070E1A",
            }}
          >
            Discuss {trade.name.toLowerCase()} →
          </Link>
          <Link
            href="/login"
            data-magnetic
            className="px-4 py-2.5 rounded-xl text-xs font-bold border hover:bg-white/10 transition-colors"
            style={{
              borderColor: "rgba(201, 168, 76, 0.52)",
              color: "#F3D37A",
            }}
          >
            Client sign in →
          </Link>
        </div>
      </div>

      {/* 3 Sector Photo Cards per Trade */}
      <div
        className="grid md:grid-cols-3 gap-6"
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
              className="tayco-living-card m-0 rounded-2xl overflow-hidden border p-4 flex flex-col justify-between group shadow-xl"
              style={{
                background:
                  "linear-gradient(155deg, #0B172A 0%, #0F2040 55%, #070E1A 100%)",
                borderColor: "rgba(201, 168, 76, 0.38)",
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-3 px-1">
                <div>
                  <figcaption
                    className="text-xs font-black uppercase tracking-[0.18em] flex items-center gap-1.5"
                    style={{ color: "#F3D37A" }}
                  >
                    <span className="font-mono text-[11px]" style={{ color: "#C9A84C" }}>
                      {sectorIndex}
                    </span>
                    <span>{s.label}</span>
                  </figcaption>
                  <div className="text-[10px] font-mono text-slate-300 mt-0.5">
                    {trade.csi} · {s.badge}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setZoom({ src, alt, csi: trade.csi })}
                  aria-label={`Zoom ${alt}`}
                  className="project-open cursor-pointer w-8 h-8 rounded-lg border flex items-center justify-center transition-colors"
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

              <button
                type="button"
                onClick={() => setZoom({ src, alt, csi: trade.csi })}
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
                  className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold backdrop-blur-md border inline-flex items-center gap-1.5"
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
                className="flex items-center justify-between gap-2 mt-3.5 pt-2.5 border-t text-[11px] font-mono"
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
              className="tayco-eyebrow justify-center mb-1.5"
              style={{ color: "#F3D37A" }}
            >
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              CSI 09 60 00 / 03 35 43 FLOORING MATERIAL MATRIX
            </div>
            <h3 className="text-xl sm:text-2xl font-black" style={{ color: "#F4F2EA" }}>
              Explore 15 flooring options
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FLOOR_TYPES.map((f) => (
              <figure
                key={f.slug}
                data-response-kind="surface"
                className="tayco-living-card m-0 p-4 rounded-2xl border shadow-lg"
                style={{
                  background:
                    "linear-gradient(145deg, rgba(11, 23, 42, 0.94) 0%, rgba(15, 32, 64, 0.9) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.35)",
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <figcaption
                    className="text-xs font-black uppercase tracking-wider"
                    style={{ color: "#F3D37A" }}
                  >
                    {f.name}
                  </figcaption>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded border font-bold"
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
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setZoom({ src, alt, csi: f.csi })}
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
              </figure>
            ))}
          </div>
        </div>
      )}

      {/* Architectural Lightbox Modal */}
      {zoom && (
        <dialog
          ref={dialogRef}
          aria-label={zoom.alt}
          onCancel={() => setZoom(null)}
          className="fixed inset-0 m-0 w-screen h-dvh max-w-none max-h-none flex items-center justify-center p-3 sm:p-4"
          style={{ background: "rgba(7, 14, 26, 0.94)" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) setZoom(null);
          }}
        >
          <div
            className="relative w-full max-w-5xl max-h-[94dvh] overflow-y-auto rounded-2xl border p-4 sm:p-5 shadow-2xl"
            style={{
              background:
                "linear-gradient(155deg, #070E1A 0%, #0B172A 55%, #0F2040 100%)",
              borderColor: "#C9A84C",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 mb-3.5">
              <div className="flex items-center gap-2.5">
                <span
                  className="px-2.5 py-0.5 rounded text-xs font-mono font-black"
                  style={{
                    background:
                      "linear-gradient(135deg, #C9A84C 0%, #DFC06C 100%)",
                    color: "#070E1A",
                  }}
                >
                  {zoom.csi}
                </span>
                <span
                  className="text-xs sm:text-sm font-bold"
                  style={{ color: "#F4F2EA" }}
                >
                  {zoom.alt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoom(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-black border hover:bg-white/10 cursor-pointer inline-flex items-center gap-1.5"
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
            <Image
              width={1440}
              height={960}
              sizes="95vw"
              src={zoom.src}
              alt={zoom.alt}
              className="w-full object-contain rounded-xl border"
              style={{
                maxHeight: "65dvh",
                borderColor: "rgba(201, 168, 76, 0.28)",
              }}
            />
            <div
              className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3.5 border-t"
              style={{ borderColor: "rgba(201, 168, 76, 0.25)" }}
            >
              <span className="text-xs font-mono text-slate-300">
                Trade gallery · Discuss materials and scope with TAYCO
              </span>
              <div className="flex items-center gap-2.5">
                <Link
                  href={`/estimate?trade=${encodeURIComponent(zoom.csi)}`}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-black border"
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
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold border hover:bg-white/10 transition-colors"
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
        </dialog>
      )}
    </div>
  );
}
