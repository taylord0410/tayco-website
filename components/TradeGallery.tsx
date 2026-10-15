"use client";
import { useState } from "react";

const SECTORS = [
  { key: "residential", label: "Residential" },
  { key: "multifamily", label: "Multifamily" },
  { key: "commercial", label: "Commercial" },
] as const;

type SectorKey = (typeof SECTORS)[number]["key"];

// Each trade has one photo per sector at /work/<slug>_<sector>.jpg
const TRADES = [
  { slug: "framing", name: "Framing" },
  { slug: "carpentry", name: "Carpentry" },
  { slug: "roofing", name: "Roofing" },
  { slug: "siding", name: "Siding" },
  { slug: "drywall", name: "Drywall" },
  { slug: "painting", name: "Painting" },
  { slug: "flooring", name: "Flooring" },
  { slug: "stone", name: "Stone" },
];

const photo = (trade: string, sector: SectorKey) => `/work/${trade}_${sector}.jpg`;

export default function TradeGallery() {
  const [active, setActive] = useState(TRADES[0].slug);
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const trade = TRADES.find((t) => t.slug === active) ?? TRADES[0];

  return (
    <>
      {/* Trade selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-10" role="tablist" aria-label="Trades">
        {TRADES.map((t) => {
          const on = t.slug === active;
          return (
            <button
              key={t.slug}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(t.slug)}
              className="px-5 py-2 rounded-full text-sm font-semibold border-2 transition-colors"
              style={on
                ? { background: "#0F2040", borderColor: "#0F2040", color: "#C9A84C" }
                : { background: "white", borderColor: "#E2E8F0", color: "#0F2040" }}
            >
              {t.name}
            </button>
          );
        })}
      </div>

      {/* One gallery per trade, grouped by sector */}
      <div className="grid md:grid-cols-3 gap-6" role="tabpanel" aria-label={trade.name}>
        {SECTORS.map((s) => {
          const src = photo(trade.slug, s.key);
          const alt = `${trade.name} — ${s.label}`;
          return (
            <figure key={s.key} className="m-0">
              <figcaption className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-center" style={{ color: "#C9A84C" }}>
                {s.label}
              </figcaption>
              <button
                type="button"
                onClick={() => setZoom({ src, alt })}
                className="block w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-[3/2]"
              >
                <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
              </button>
            </figure>
          );
        })}
      </div>

      {/* Lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setZoom(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoom(null)}
              className="absolute -top-10 right-0 text-white text-4xl font-bold leading-none hover:text-yellow-400"
              aria-label="Close"
            >
              ×
            </button>
            <img src={zoom.src} alt={zoom.alt} className="w-full object-contain rounded-xl" style={{ maxHeight: "80vh" }} />
          </div>
        </div>
      )}
    </>
  );
}
