"use client";
import { useState } from "react";
import Link from "next/link";

export default function Home() {
  const [hovered, setHovered] = useState<"commercial" | "residential" | null>(null);

  const commercialFlex =
    hovered === "residential" ? "0 0 38%" : hovered === "commercial" ? "0 0 62%" : "0 0 50%";
  const residentialFlex =
    hovered === "commercial" ? "0 0 38%" : hovered === "residential" ? "0 0 62%" : "0 0 50%";

  return (
    <main
      className="relative flex flex-col"
      style={{ minHeight: "calc(100svh - 64px)", marginTop: "64px", background: "#08121F" }}
    >
      {/* ── SPLIT HERO 50/50 ── */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden" style={{ minHeight: "76svh" }}>
        {/* ── COMMERCIAL (LEFT / TOP) ── */}
        <Link
          href="/commercial"
          className="relative flex flex-col items-center justify-center overflow-hidden group py-12"
          style={{
            flex: commercialFlex,
            background: "linear-gradient(145deg, #08121F 0%, #0F2040 55%, #142B54 100%)",
            transition: "flex 0.45s cubic-bezier(0.4,0,0.2,1)",
            minHeight: "50%",
          }}
          onMouseEnter={() => setHovered("commercial")}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Blueprint grid */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(201,168,76,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.06) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          {/* Gold accent line */}
          <div className="absolute left-0 top-0 bottom-0 hidden md:block w-1" style={{ background: "#C9A84C" }} />
          <div className="absolute left-0 right-0 top-0 md:hidden h-1" style={{ background: "#C9A84C" }} />

          <div className="relative z-10 text-center px-6 sm:px-12 max-w-md">
            <div
              className="inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-5"
              style={{
                background: "rgba(201,168,76,0.15)",
                color: "#C9A84C",
                border: "1px solid rgba(201,168,76,0.35)",
              }}
            >
              ★ Primary Service · CSI-32 &amp; Takeoff Pro
            </div>

            <div className="text-5xl mb-4">🏢</div>

            <h2
              className="font-black tracking-tight text-white mb-2"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", lineHeight: 1.05 }}
            >
              COMMERCIAL
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-5"
              style={{ color: "#C9A84C" }}
            >
              Construction, Turnkey &amp; Renovation
            </p>

            <p className="text-gray-300 text-sm leading-relaxed mb-7 max-w-[290px] mx-auto">
              Ground-Up Construction · Design-Build Services
              <br />
              General Contracting · Construction Management
              <br />
              Tenant Improvements · Mixed-Use · Industrial
            </p>

            <div
              className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-xl text-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg"
              style={{ background: "#C9A84C", color: "#0F2040" }}
            >
              View Commercial Services <span>→</span>
            </div>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden md:block w-px shrink-0" style={{ background: "rgba(201,168,76,0.25)" }} />
        <div className="md:hidden h-px shrink-0" style={{ background: "rgba(201,168,76,0.25)" }} />

        {/* ── RESIDENTIAL (RIGHT / BOTTOM) ── */}
        <Link
          href="/residential"
          className="relative flex flex-col items-center justify-center overflow-hidden group py-12"
          style={{
            flex: residentialFlex,
            background: "linear-gradient(145deg, #152E5A 0%, #1B3A6B 55%, #1E4070 100%)",
            transition: "flex 0.45s cubic-bezier(0.4,0,0.2,1)",
            minHeight: "50%",
          }}
          onMouseEnter={() => setHovered("residential")}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="relative z-10 text-center px-6 sm:px-12 max-w-md">
            <div
              className="inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-5"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.7)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              Residential Services · 24/7 Restoration
            </div>

            <div className="text-5xl mb-4">🏠</div>

            <h2
              className="font-black tracking-tight text-white mb-2"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", lineHeight: 1.05 }}
            >
              RESIDENTIAL
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-5"
              style={{ color: "rgba(201,168,76,0.85)" }}
            >
              Renovation &amp; Restoration
            </p>

            <p className="text-gray-300 text-sm leading-relaxed mb-7 max-w-[290px] mx-auto">
              Home renovations · Kitchen &amp; bath remodels · Additions · Basement finishing · Certified fire &amp; water restoration
            </p>

            <div
              className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-xl text-sm border transition-all duration-200 group-hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              View Residential Services <span>→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── EXECUTIVE ERP & MULTI-TENANT PORTAL RIBBON ── */}
      <section
        id="home-erp-suite-ribbon"
        className="border-t px-4 sm:px-8 py-5"
        style={{
          background: "linear-gradient(90deg, #060E1A 0%, #0F2040 50%, #0A1931 100%)",
          borderColor: "rgba(201,168,76,0.35)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-1">
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest"
                style={{ background: "rgba(201,168,76,0.2)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)" }}
              >
                ★ TAYCO ENTERPRISE SUITE &amp; TAKEOFF PRO v5.0
              </span>
              <span className="text-xs text-emerald-300 font-semibold">
                WI · IL · IA · IN · MN · MI · MO · TX · ND
              </span>
            </div>
            <p className="text-white font-bold text-sm sm:text-base">
              Multi-Tenant Client Portal · Module-Scoped Invitations · CRM · Davis-Bacon Payroll · QuickBooks · 9-State Tax Engine
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/portal"
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-transform hover:scale-105 shadow-md"
              style={{ background: "#C9A84C", color: "#0F2040" }}
            >
              🔐 Open Multi-Tenant Portal →
            </Link>
            <Link
              href="/estimate"
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white border transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(201,168,76,0.5)" }}
            >
              🧮 Instant Cost Estimator
            </Link>
            <a
              href="/astro-preview/index.html"
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/10 transition-colors"
            >
              ⚡ Astro 5 Static Build
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
