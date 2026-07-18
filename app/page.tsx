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
      className="relative flex flex-col md:flex-row"
      style={{ height: "calc(100svh - 64px)", marginTop: "64px", overflow: "hidden" }}
    >
      {/* ── COMMERCIAL (LEFT / TOP) ── */}
      <Link
        href="/commercial"
        className="relative flex flex-col items-center justify-center overflow-hidden group"
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
            ★ Primary Service
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
            Construction & Renovation
          </p>

          <p className="text-gray-400 text-sm leading-relaxed mb-7 max-w-[260px] mx-auto">
            Ground-Up Construction · Tenant Improvements · Office Buildouts
            <br />
            Retail &amp; Restaurant Conversions · Mixed-Use · Design-Build · Industrial
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
        className="relative flex flex-col items-center justify-center overflow-hidden group"
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
              color: "rgba(255,255,255,0.55)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            Residential Services
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
            style={{ color: "rgba(201,168,76,0.8)" }}
          >
            Renovation & Restoration
          </p>

          <p className="text-gray-300 text-sm leading-relaxed mb-7 max-w-[260px] mx-auto">
            Home renovations · Kitchen & bath remodels · Additions · Basement finishing · Fire & water restoration
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

      {/* States tagline */}
      <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none z-20">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.25em]"
          style={{ color: "rgba(201,168,76,0.45)" }}
        >
          WI · IL · IA · IN · MN · MI · MO · TX
        </p>
      </div>
    </main>
  );
}
