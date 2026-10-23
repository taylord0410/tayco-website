"use client";
import React, { useState } from "react";
import Link from "next/link";

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
    rate: "$18.00–$52.00 / sq.ft.",
    spec: "16× LVL Ridge Beams, 2x6 Platform & 16-Ga Structural Studs",
  },
  {
    slug: "carpentry",
    name: "Carpentry",
    csi: "CSI 06 41 00",
    rate: "$145.00–$320.00 / lin.ft.",
    spec: "Architectural Millwork, Cabinetry, Trim & Custom Gazebos",
  },
  {
    slug: "roofing",
    name: "Roofing",
    csi: "CSI 07 50 00",
    rate: "$6.80–$28.00 / sq.ft.",
    spec: "TPO / EPDM, 24-Ga Standing Seam & Class-4 Architectural Shingles",
  },
  {
    slug: "siding",
    name: "Siding",
    csi: "CSI 07 46 00",
    rate: "$11.50–$46.00 / sq.ft.",
    spec: "James Hardie Fiber Cement, IMP, ACM & Continuous Insulation",
  },
  {
    slug: "drywall",
    name: "Drywall",
    csi: "CSI 09 29 00",
    rate: "$4.20–$18.50 / sq.ft.",
    spec: "UL 1-Hr/2-Hr 5/8\" Type-X, STC 55+ Acoustic & Level-5 Finish",
  },
  {
    slug: "painting",
    name: "Painting",
    csi: "CSI 09 91 00",
    rate: "$3.40–$9.50 / sq.ft.",
    spec: "Sherwin-Williams Commercial Coatings, Elastomeric & Intumescent",
  },
  {
    slug: "flooring",
    name: "Flooring",
    csi: "CSI 09 60 00",
    rate: "$8.50–$21.00 / sq.ft.",
    spec: "100%-Solids Epoxy, FF50 Polished Concrete, 20-Mil LVT & Hardwood",
  },
  {
    slug: "stone",
    name: "Stone",
    csi: "CSI 04 43 00",
    rate: "$24.00–$68.00 / sq.ft.",
    spec: "Architectural Natural Stone Veneer, Masonry & Quartz Assemblies",
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
  const trade = TRADES.find((t) => t.slug === active) ?? TRADES[0];

  return (
    <div className="space-y-8">
      {/* Executive Command Trade Selector Tabs */}
      <div
        className="flex flex-wrap justify-center gap-2.5"
        role="tablist"
        aria-label="CSI-32 Trades"
      >
        {TRADES.map((t) => {
          const on = t.slug === active;
          return (
            <button
              key={t.slug}
              type="button"
              role="tab"
              data-magnetic
              aria-selected={on}
              onClick={() => setActive(t.slug)}
              className="px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center gap-2"
              style={
                on
                  ? {
                      background:
                        "linear-gradient(135deg, #0F2040 0%, #1B3A6B 100%)",
                      borderColor: "#C9A84C",
                      color: "#F3D37A",
                      boxShadow: "0 10px 24px -10px rgba(201, 168, 76, 0.55)",
                    }
                  : {
                      background: "rgba(15, 32, 64, 0.78)",
                      borderColor: "rgba(201, 168, 76, 0.28)",
                      color: "#E2E8F0",
                    }
              }
            >
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 rounded font-black"
                style={{
                  background: on
                    ? "#C9A84C"
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

      {/* Active Trade Executive Telemetry Banner */}
      <div
        data-response-kind="surface"
        className="tayco-living-card p-5 rounded-2xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        style={{
          background:
            "linear-gradient(135deg, rgba(15, 32, 64, 0.94) 0%, rgba(27, 58, 107, 0.9) 100%)",
          borderColor: "rgba(201, 168, 76, 0.45)",
        }}
      >
        <div>
          <div className="tayco-eyebrow mb-1" style={{ color: "#F3D37A" }}>
            <span className="tayco-live-dot" style={{ color: "#F97316" }} />
            {trade.csi} · {trade.name.toUpperCase()} ASSEMBLY · {trade.rate}
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-medium">
            {trade.spec} — Quantified in Takeoff Pro (:8085) across Residential,
            Multifamily, and Commercial sectors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href={`/estimate?trade=${encodeURIComponent(trade.csi)}`}
            data-magnetic
            className="px-4 py-2 rounded-xl text-xs font-black transition-transform hover:scale-105"
            style={{ background: "#C9A84C", color: "#070E1A" }}
          >
            🧮 Estimate {trade.name} (/estimate) →
          </Link>
          <Link
            href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
            data-magnetic
            className="px-4 py-2 rounded-xl text-xs font-bold text-white border hover:bg-white/10 transition-colors"
            style={{ borderColor: "rgba(201, 168, 76, 0.5)" }}
          >
            🏛️ Inspect in /portal →
          </Link>
        </div>
      </div>

      {/* 3 Sector Photo Cards per Trade */}
      <div
        className="grid md:grid-cols-3 gap-6"
        role="tabpanel"
        aria-label={trade.name}
      >
        {SECTORS.map((s) => {
          const src = photo(trade.slug, s.key);
          const alt = `${trade.name} (${trade.csi}) — ${s.label}`;
          return (
            <figure
              key={s.key}
              data-response-kind="surface"
              className="tayco-living-card m-0 rounded-2xl overflow-hidden border p-3.5 flex flex-col justify-between group"
              style={{
                background:
                  "linear-gradient(155deg, rgba(15, 32, 64, 0.92), rgba(7, 14, 26, 0.96))",
                borderColor: "rgba(201, 168, 76, 0.35)",
              }}
            >
              <div className="flex items-center justify-between gap-2 mb-3 px-1">
                <div>
                  <figcaption
                    className="text-xs font-black uppercase tracking-[0.18em]"
                    style={{ color: "#F3D37A" }}
                  >
                    {s.label}
                  </figcaption>
                  <div className="text-[10px] font-mono text-slate-400">
                    {trade.csi} · {s.badge}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setZoom({ src, alt, csi: trade.csi })}
                  aria-label={`Zoom ${alt}`}
                  className="project-open cursor-pointer"
                >
                  🔍
                </button>
              </div>

              <button
                type="button"
                onClick={() => setZoom({ src, alt, csi: trade.csi })}
                className="relative block w-full rounded-xl overflow-hidden aspect-[3/2] border cursor-pointer"
                style={{ borderColor: "rgba(201, 168, 76, 0.28)" }}
              >
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <span
                  className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold backdrop-blur-md border"
                  style={{
                    background: "rgba(7, 14, 26, 0.82)",
                    borderColor: "rgba(201, 168, 76, 0.5)",
                    color: "#F3D37A",
                  }}
                >
                  Click to Inspect ↗
                </span>
              </button>

              <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-white/10 text-[11px] font-mono">
                <Link
                  href={`/estimate?sector=${s.key}&trade=${encodeURIComponent(trade.csi)}`}
                  className="font-bold text-amber-300 hover:underline"
                >
                  Run {s.label} Takeoff →
                </Link>
                <Link
                  href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
                  className="text-slate-300 hover:text-white"
                >
                  /portal ↗
                </Link>
              </div>
            </figure>
          );
        })}
      </div>

      {/* Flooring: 15 Sub-Types with CSI-32 Badges */}
      {trade.slug === "flooring" && (
        <div className="mt-12 pt-8 border-t border-white/15">
          <div className="text-center mb-8">
            <div
              className="tayco-eyebrow justify-center mb-1"
              style={{ color: "#F3D37A" }}
            >
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              CSI 09 60 00 / 03 35 43 FLOORING MATERIAL MATRIX
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              15 Audited Commercial &amp; Residential Flooring Systems
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FLOOR_TYPES.map((f) => (
              <figure
                key={f.slug}
                data-response-kind="surface"
                className="tayco-living-card m-0 p-4 rounded-2xl border"
                style={{
                  background: "rgba(15, 32, 64, 0.88)",
                  borderColor: "rgba(201, 168, 76, 0.32)",
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <figcaption
                    className="text-xs font-black uppercase tracking-wider"
                    style={{ color: "#F3D37A" }}
                  >
                    {f.name}
                  </figcaption>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400/15 text-amber-200 border border-amber-400/30">
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
                        className="block w-full rounded-xl overflow-hidden border aspect-[3/2] cursor-pointer hover:opacity-95 transition-opacity"
                        style={{ borderColor: "rgba(201, 168, 76, 0.28)" }}
                      >
                        <img
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

      {/* Executive Lightbox Modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7, 14, 26, 0.94)" }}
          onClick={() => setZoom(null)}
        >
          <div
            className="relative w-full max-w-5xl rounded-2xl border p-4"
            style={{
              background: "#0F2040",
              borderColor: "#C9A84C",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded text-xs font-mono font-black"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  {zoom.csi}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  {zoom.alt}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setZoom(null)}
                className="px-3 py-1 rounded-lg text-xs font-black text-white border border-white/25 hover:bg-white/10 cursor-pointer"
                aria-label="Close"
              >
                ✕ Close
              </button>
            </div>
            <img
              src={zoom.src}
              alt={zoom.alt}
              className="w-full object-contain rounded-xl border border-white/10"
              style={{ maxHeight: "75vh" }}
            />
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-white/15">
              <span className="text-xs font-mono text-slate-300">
                TAYCO Executive Field Verification · Takeoff Pro (:8085) CSI-32
                Synced
              </span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/estimate?trade=${encodeURIComponent(zoom.csi)}`}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-black"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                >
                  Estimate This CSI Trade →
                </Link>
                <Link
                  href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white border border-amber-400/40"
                >
                  Open Command Portal →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
