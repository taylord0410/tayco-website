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

// Flooring also shows two photos per type at /work/flooring/<slug>_<1|2>.jpg
const FLOOR_TYPES = [
  { slug: "hardwood", name: "Hardwood" },
  { slug: "engineered-hardwood", name: "Engineered Hardwood" },
  { slug: "lvp", name: "Luxury Vinyl Plank" },
  { slug: "lvt", name: "Luxury Vinyl Tile" },
  { slug: "laminate", name: "Laminate" },
  { slug: "ceramic-tile", name: "Ceramic Tile" },
  { slug: "porcelain-tile", name: "Porcelain Tile" },
  { slug: "natural-stone", name: "Natural Stone" },
  { slug: "carpet", name: "Carpet" },
  { slug: "sheet-vinyl", name: "Sheet Vinyl" },
  { slug: "epoxy", name: "Epoxy" },
  { slug: "polished-concrete", name: "Polished Concrete" },
  { slug: "rubber", name: "Rubber" },
  { slug: "bamboo", name: "Bamboo" },
  { slug: "cork", name: "Cork" },
];

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

      {/* Flooring: two photos per type */}
      {trade.slug === "flooring" && (
        <div className="mt-14">
          <h3 className="text-center text-xl font-bold mb-8" style={{ color: "#0F2040" }}>
            Types of Flooring
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FLOOR_TYPES.map((f) => (
              <figure key={f.slug} className="m-0">
                <figcaption className="text-xs font-bold uppercase tracking-[0.2em] mb-3 text-center" style={{ color: "#C9A84C" }}>
                  {f.name}
                </figcaption>
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2].map((n) => {
                    const src = `/work/flooring/${f.slug}_${n}.jpg`;
                    const alt = `${f.name} flooring ${n}`;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setZoom({ src, alt })}
                        className="block w-full rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-[3/2]"
                      >
                        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    );
                  })}
                </div>
              </figure>
            ))}
          </div>
        </div>
      )}

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
