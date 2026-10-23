"use client";
import { useState } from "react";
import Link from "next/link";

const UMBRA_SHOWCASE_CARDS = [
  {
    eyebrow: "01 · COMMERCIAL & INDUSTRIAL",
    title: "Multi-State Construction",
    serifEm: "Execution",
    summary:
      "$5.88M Active Bid Pipeline · 29 CSI Trades · Ground-Up & Tenant Improvements across 8 States",
    metric: "$5.88M",
    metricLabel: "Active Commercial GMP Pipeline",
    href: "/commercial",
    cta: "Explore Commercial Division →",
    sparkPath: "M2,28 L18,24 L34,26 L50,18 L66,19 L82,11 L98,13 L114,5",
    stroke: "#C9A84C",
  },
  {
    eyebrow: "02 · TAKEOFF PRO v5.0 BRIDGE",
    title: "Parametric Blueprint",
    serifEm: "Precision",
    summary:
      "21 Rust C-ABI Kernels · AI Blueprint OCR · Live CSI-32 Sync & Monte Carlo P80",
    metric: "21 Kernels",
    metricLabel: "Sub-Millisecond CSI-32 Quantity Takeoff",
    href: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
    cta: "Launch Takeoff Pro Bridge →",
    sparkPath: "M2,30 L18,22 L34,25 L50,14 L66,16 L82,8 L98,10 L114,4",
    stroke: "#38BDF8",
  },
  {
    eyebrow: "03 · FINANCIAL & TAX ENGINE",
    title: "Audit-Ready Job Costing &",
    serifEm: "Compliance",
    summary:
      "QuickBooks .IIF/.QBO · AIA G702/G703 · Davis-Bacon WH-347 · 9-State Sales/Use Tax & 1099-NEC",
    metric: "9 States",
    metricLabel: "WI · IL · IA · IN · MN · MI · MO · TX · ND",
    href: "/portal?invite=INV-CPA-FINANCE-TAX",
    cta: "Inspect CPA & Tax Suite →",
    sparkPath: "M2,26 L18,25 L34,20 L50,21 L66,13 L82,12 L98,7 L114,6",
    stroke: "#10B981",
  },
  {
    eyebrow: "04 · MODULE-SCOPED CLIENT PORTAL",
    title: "Granular Multi-Tenant",
    serifEm: "Governance",
    summary:
      "Invite Clients, Investors, or CPAs to Specific Modules with 1-Click Live Preview",
    metric: "6 Modules",
    metricLabel: "Zero-Friction Scoped B2B Invitations",
    href: "/portal?builder=1",
    cta: "Open Module Invitation Builder →",
    sparkPath: "M2,29 L18,26 L34,21 L50,15 L66,17 L82,9 L98,8 L114,3",
    stroke: "#F3D37A",
  },
];

export default function Home() {
  const [hovered, setHovered] = useState<"commercial" | "residential" | null>(null);

  const commercialFlex =
    hovered === "residential" ? "0 0 38%" : hovered === "commercial" ? "0 0 62%" : "0 0 50%";
  const residentialFlex =
    hovered === "commercial" ? "0 0 38%" : hovered === "residential" ? "0 0 62%" : "0 0 50%";

  return (
    <main
      className="relative flex flex-col"
      style={{ minHeight: "calc(100svh - 64px)", marginTop: "64px", background: "#070E1A" }}
    >
      {/* ── SPLIT HERO 50/50 ── */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden" style={{ minHeight: "76svh" }}>
        {/* ── COMMERCIAL (LEFT / TOP) ── */}
        <Link
          href="/commercial"
          className="relative flex flex-col items-center justify-center overflow-hidden group py-12"
          style={{
            flex: commercialFlex,
            background: "linear-gradient(145deg, #070E1A 0%, #0F2040 55%, #142B54 100%)",
            transition: "flex 0.45s cubic-bezier(0.4,0,0.2,1)",
            minHeight: "50%",
          }}
          onMouseEnter={() => setHovered("commercial")}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="preview-orbits" aria-hidden="true" />
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
            <div className="umbra-eyebrow mb-4 mx-auto">
              <span className="umbra-live-dot" />
              ★ Primary Division · CSI-32 &amp; Takeoff Pro
            </div>

            <div className="text-5xl mb-3">🏢</div>

            <h2
              className="font-black tracking-tight text-white mb-2"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", lineHeight: 1.05 }}
            >
              COMMERCIAL
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: "#C9A84C" }}
            >
              Ground-Up, Turnkey &amp;{" "}
              <em className="umbra-serif-em text-sm">Executive TI</em>
            </p>

            <p className="text-slate-300 text-sm leading-relaxed mb-7 max-w-[310px] mx-auto">
              Ground-Up Construction · Design-Build Services
              <br />
              General Contracting · Construction Management
              <br />
              Tenant Improvements · Mixed-Use · Industrial
            </p>

            <div
              className="inline-flex items-center gap-2 font-black px-7 py-3 rounded-xl text-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg"
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              View Commercial Services <span>→</span>
            </div>
          </div>
        </Link>

        {/* Divider */}
        <div className="hidden md:block w-px shrink-0" style={{ background: "rgba(201,168,76,0.28)" }} />
        <div className="md:hidden h-px shrink-0" style={{ background: "rgba(201,168,76,0.28)" }} />

        {/* ── RESIDENTIAL (RIGHT / BOTTOM) ── */}
        <Link
          href="/residential"
          className="relative flex flex-col items-center justify-center overflow-hidden group py-12"
          style={{
            flex: residentialFlex,
            background: "linear-gradient(145deg, #102447 0%, #1B3A6B 55%, #1E4070 100%)",
            transition: "flex 0.45s cubic-bezier(0.4,0,0.2,1)",
            minHeight: "50%",
          }}
          onMouseEnter={() => setHovered("residential")}
          onMouseLeave={() => setHovered(null)}
        >
          <div className="preview-orbits" aria-hidden="true" />
          <div className="relative z-10 text-center px-6 sm:px-12 max-w-md">
            <div
              className="inline-block px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              Residential Division · 24/7 IICRC Restoration
            </div>

            <div className="text-5xl mb-3">🏠</div>

            <h2
              className="font-black tracking-tight text-white mb-2"
              style={{ fontSize: "clamp(2.2rem, 5vw, 3.8rem)", lineHeight: 1.05 }}
            >
              RESIDENTIAL
            </h2>
            <p
              className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4"
              style={{ color: "rgba(243,211,122,0.9)" }}
            >
              Renovation &amp;{" "}
              <em className="umbra-serif-em text-sm">Rapid Recovery</em>
            </p>

            <p className="text-slate-300 text-sm leading-relaxed mb-7 max-w-[310px] mx-auto">
              Full-scale home renovations · Kitchen &amp; bath remodels · Structural additions · Certified fire &amp; water damage restoration
            </p>

            <div
              className="inline-flex items-center gap-2 font-bold px-7 py-3 rounded-xl text-sm border transition-all duration-200 group-hover:scale-105"
              style={{
                background: "rgba(255,255,255,0.09)",
                color: "#fff",
                borderColor: "rgba(255,255,255,0.28)",
              }}
            >
              View Residential Services <span>→</span>
            </div>
          </div>
        </Link>

        {/* Floating Umbra Dock */}
        <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-full border border-amber-400/35 bg-slate-950/85 backdrop-blur-md shadow-2xl absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
          <span className="umbra-live-dot" />
          <span className="text-[11px] font-mono text-slate-300">
            UMBRA COMMAND DOCK · 8-State Operations + ND Tax Engine
          </span>
          <Link
            href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
            className="text-[11px] font-mono font-bold text-amber-300 hover:text-white underline"
          >
            Client Demo
          </Link>
          <span className="text-slate-600">·</span>
          <Link
            href="/portal?invite=INV-CPA-FINANCE-TAX"
            className="text-[11px] font-mono font-bold text-emerald-300 hover:text-white underline"
          >
            CPA Audit Demo
          </Link>
          <span className="text-slate-600">·</span>
          <Link
            href="/estimate"
            className="text-[11px] font-mono font-bold text-sky-300 hover:text-white underline"
          >
            CSI-32 Calculator
          </Link>
        </div>
      </div>

      {/* ── EXECUTIVE ERP & MULTI-TENANT PORTAL RIBBON ── */}
      <section
        id="home-erp-suite-ribbon"
        className="border-t border-b px-4 sm:px-8 py-5"
        style={{
          background: "linear-gradient(90deg, #060E1A 0%, #0F2040 50%, #0A1931 100%)",
          borderColor: "rgba(201,168,76,0.35)",
        }}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-1">
              <span className="umbra-eyebrow">
                <span className="umbra-live-dot" />
                ★ TAYCO ENTERPRISE SUITE &amp; TAKEOFF PRO v5.0
              </span>
              <span className="text-xs text-emerald-300 font-mono font-semibold">
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
              style={{ background: "#C9A84C", color: "#070E1A" }}
            >
              🏛️ Open Multi-Tenant Command Center →
            </Link>
            <Link
              href="/estimate"
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white border transition-colors hover:bg-white/10"
              style={{ borderColor: "rgba(201,168,76,0.5)" }}
            >
              🧮 Instant Cost Estimator
            </Link>
            <Link
              href="/portal?builder=1"
              className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/10 transition-colors"
            >
              🎟️ Module Invite Builder
            </Link>
          </div>
        </div>
      </section>

      {/* ── TAYCO DIGITAL COMMAND & MULTI-STATE OPERATIONS SHOWCASE (4 UMBRA BENTO CARDS) ── */}
      <section
        id="umbra-operations-showcase"
        className="py-16 px-4 sm:px-8"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, rgba(201,168,76,0.12), transparent 55%), radial-gradient(circle at 80% 100%, rgba(56,189,248,0.1), transparent 50%), #070E1A",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="umbra-eyebrow">
                <span className="umbra-live-dot" />
                TAYCO Digital Command &amp; Multi-State Operations Showcase
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-3 tracking-tight">
                Institutional Construction{" "}
                <em className="umbra-serif-em">Meets Real-Time ERP</em>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              Every field estimate, subcontractor W-9/COI onboarding, and REIT draw schedule synchronizes directly with our 6-module Digital Command Center.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {UMBRA_SHOWCASE_CARDS.map((card) => (
              <div
                key={card.eyebrow}
                data-surface-mode="crystal"
                className="umbra-bento-card p-6 flex flex-col justify-between text-white group"
              >
                <div className="preview-orbits" aria-hidden="true" />

                <div className="relative z-10">
                  <div className="umbra-eyebrow mb-3">{card.eyebrow}</div>
                  <h3 className="text-lg font-extrabold text-white leading-snug">
                    {card.title}{" "}
                    <em className="umbra-serif-em">{card.serifEm}</em>
                  </h3>
                  <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                    {card.summary}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-4 border-t border-white/10">
                  <div className="flex items-end justify-between gap-2 mb-3">
                    <div>
                      <div className="text-xl font-black font-mono" style={{ color: card.stroke }}>
                        {card.metric}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        {card.metricLabel}
                      </div>
                    </div>
                    <svg
                      width="116"
                      height="34"
                      viewBox="0 0 116 34"
                      fill="none"
                      aria-hidden="true"
                      className="shrink-0"
                    >
                      <path
                        d={card.sparkPath}
                        stroke={card.stroke}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  <Link
                    href={card.href}
                    className="inline-flex items-center justify-between w-full text-xs font-extrabold px-3.5 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-amber-400 hover:text-slate-950 hover:border-amber-400 transition-all"
                  >
                    <span>{card.cta}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
