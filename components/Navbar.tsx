"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const QUICK_DEMO_PROFILES = [
  {
    code: "INV-TAYCO-MASTER",
    label: "🔑 Managing Director (6/6 Modules)",
    scope: "Full Enterprise Command: CRM + Takeoff Pro + WH-347 Payroll + QuickBooks + 9-State Tax + Investor ROI",
    href: "/portal?invite=INV-TAYCO-MASTER",
  },
  {
    code: "INV-CLIENT-CRM-TAKEOFF",
    label: "📐 Commercial Client & Estimator Demo (2/6 Modules: Takeoff + CRM)",
    scope: "Scoped B2B Client View: CSI-32 Blueprint Takeoff Pro v5.0 + Commercial Bid Pipeline",
    href: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
  },
  {
    code: "INV-CPA-FINANCE-TAX",
    label: "📗 CPA & Tax Auditor Demo (3/6 Modules: Payroll + QuickBooks + 9-State Tax)",
    scope: "Audit & Accounting View: Davis-Bacon WH-347 + QuickBooks .IIF/.QBO + 9-State Tax & 1099-NEC",
    href: "/portal?invite=INV-CPA-FINANCE-TAX",
  },
  {
    code: "INV-INVESTOR-PORTFOLIO",
    label: "📊 REIT Investor Board Demo (3/6 Modules: CRM + QuickBooks + Investor ROI)",
    scope: "Institutional Capital View: Turnkey Portfolio IRR, AIA G702/G703 Draw Schedules & Pipeline",
    href: "/portal?invite=INV-INVESTOR-PORTFOLIO",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("INV-CLIENT-CRM-TAKEOFF");
  const router = useRouter();

  function handleLaunchInvite(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = inviteCode.trim() || "INV-TAYCO-MASTER";
    setModalOpen(false);
    setOpen(false);
    router.push(`/portal?invite=${encodeURIComponent(cleaned)}`);
  }

  return (
    <>
      <nav
        className="fixed top-0 w-full z-50 backdrop-blur-md border-b"
        style={{
          background: "rgba(7, 14, 26, 0.88)",
          borderColor: "rgba(201, 168, 76, 0.28)",
          boxShadow: "0 8px 32px rgba(2, 6, 23, 0.55)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/logo.jpeg"
                alt="TAYCO LLC"
                width={42}
                height={42}
                className="rounded-full ring-1 ring-amber-400/40 group-hover:ring-amber-400 transition-all"
              />
              <span className="flex flex-col leading-tight">
                <span className="font-bold text-lg sm:text-xl tracking-tight" style={{ color: "#C9A84C" }}>
                  TAYCO LLC
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  Commercial GC &amp; Digital Command
                </span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/commercial"
                className="text-xs font-bold uppercase tracking-wider transition-colors hover:text-white"
                style={{ color: "#C9A84C" }}
              >
                Commercial
              </Link>
              <Link
                href="/residential"
                className="text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Residential
              </Link>
              <Link
                href="/investor"
                className="text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Investors
              </Link>
              <Link
                href="/vendor-application"
                className="text-slate-300 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Subcontractors
              </Link>

              <Link
                href="/portal"
                id="nav-portal-multitenant"
                className="text-xs font-extrabold px-3.5 py-2 rounded-lg border transition-all hover:scale-[1.03] flex items-center gap-2"
                style={{
                  background: "rgba(201, 168, 76, 0.14)",
                  borderColor: "rgba(201, 168, 76, 0.55)",
                  color: "#F3D37A",
                }}
              >
                <span className="umbra-live-dot" />
                <span>🏛️ Command Center</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                  6 Modules
                </span>
              </Link>

              <button
                type="button"
                id="btn-open-quick-login-modal"
                onClick={() => setModalOpen(true)}
                className="text-xs font-extrabold px-3.5 py-2 rounded-lg border transition-all hover:bg-white/10 text-slate-100 cursor-pointer"
                style={{
                  background: "rgba(15, 32, 64, 0.85)",
                  borderColor: "rgba(56, 189, 248, 0.45)",
                }}
              >
                🔐 Sign In / Invite Code
              </button>

              <Link
                href="/estimate"
                className="text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg transition-transform hover:scale-[1.02]"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                Get Free Estimate
              </Link>
            </div>

            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border text-amber-300"
                style={{
                  background: "rgba(201,168,76,0.14)",
                  borderColor: "rgba(201,168,76,0.45)",
                }}
              >
                🔐 Sign In
              </button>
              <button
                className="text-white text-2xl px-2"
                onClick={() => setOpen(!open)}
                aria-label="Toggle Menu"
              >
                {open ? "✕" : "☰"}
              </button>
            </div>
          </div>

          {open && (
            <div className="lg:hidden pb-5 flex flex-col gap-3 border-t border-white/10 pt-4">
              <Link
                href="/commercial"
                className="text-sm font-bold"
                style={{ color: "#C9A84C" }}
                onClick={() => setOpen(false)}
              >
                Commercial Construction &amp; TI
              </Link>
              <Link
                href="/residential"
                className="text-slate-300 text-sm"
                onClick={() => setOpen(false)}
              >
                Residential Renovation &amp; 24/7 Restoration
              </Link>
              <Link
                href="/investor"
                className="text-slate-300 text-sm"
                onClick={() => setOpen(false)}
              >
                Institutional Investors &amp; REITs
              </Link>
              <Link
                href="/vendor-application"
                className="text-slate-300 text-sm"
                onClick={() => setOpen(false)}
              >
                Subcontractor Registry (29 CSI Trades)
              </Link>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/portal"
                  className="text-xs font-bold px-3.5 py-2 rounded-lg border"
                  style={{
                    background: "rgba(201,168,76,0.15)",
                    borderColor: "#C9A84C",
                    color: "#F3D37A",
                  }}
                  onClick={() => setOpen(false)}
                >
                  🏛️ Command Center (6 Modules)
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setModalOpen(true);
                  }}
                  className="text-xs font-bold px-3.5 py-2 rounded-lg border text-sky-200"
                  style={{
                    background: "rgba(15, 32, 64, 0.9)",
                    borderColor: "rgba(56, 189, 248, 0.45)",
                  }}
                >
                  🔐 Sign In / Invite Code
                </button>
                <Link
                  href="/estimate"
                  className="text-xs font-black px-4 py-2 rounded-lg"
                  style={{ background: "#C9A84C", color: "#070E1A" }}
                  onClick={() => setOpen(false)}
                >
                  Get Free Estimate
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ── MULTI-TENANT QUICK LOGIN & MODULE INVITATION MODAL ── */}
      {modalOpen && (
        <div
          id="tayco-quick-login-modal"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: "rgba(4, 9, 18, 0.82)", backdropFilter: "blur(10px)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            data-surface-mode="crystal"
            className="umbra-bento-card relative w-full max-w-2xl p-6 sm:p-8 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-orbits" aria-hidden="true" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="umbra-eyebrow">
                    <span className="umbra-live-dot" />
                    Multi-Tenant RBAC · Module-Scoped Access
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                    TAYCO Digital Command{" "}
                    <em className="umbra-serif-em">Quick Sign-In</em>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Enter a B2B Module Invitation Code or launch an instant role-scoped executive demo session.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center text-sm"
                  aria-label="Close Quick Login Modal"
                >
                  ✕
                </button>
              </div>

              {/* Invite Code Input Form */}
              <form
                onSubmit={handleLaunchInvite}
                className="p-4 rounded-xl border border-amber-400/30 bg-slate-950/70 mb-5"
              >
                <label className="block text-[11px] font-mono uppercase tracking-wider text-amber-300 mb-2">
                  Paste Module Invitation Code (Grants Only Authorized ERP &amp; Takeoff Modules)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="quick-login-invite-input"
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="e.g. INV-CLIENT-CRM-TAKEOFF"
                    className="flex-1 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-white bg-slate-900 border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-black uppercase tracking-wider transition-transform hover:scale-[1.02] cursor-pointer"
                    style={{ background: "#C9A84C", color: "#070E1A" }}
                  >
                    Launch Scoped Session →
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2.5 text-[11px] font-mono text-slate-400">
                  <span>Quick fill:</span>
                  {[
                    "INV-TAYCO-MASTER",
                    "INV-CLIENT-CRM-TAKEOFF",
                    "INV-CPA-FINANCE-TAX",
                    "INV-INVESTOR-PORTFOLIO",
                  ].map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setInviteCode(code)}
                      className="px-2 py-0.5 rounded bg-white/5 hover:bg-amber-400/20 text-amber-300 border border-white/10 cursor-pointer"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </form>

              {/* 4 One-Click Demo Profiles */}
              <div className="mb-5">
                <div className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-2.5">
                  1-Click Role-Scoped Executive Demo Profiles
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {QUICK_DEMO_PROFILES.map((profile) => (
                    <Link
                      key={profile.code}
                      href={profile.href}
                      onClick={() => setModalOpen(false)}
                      className="group p-3.5 rounded-xl border border-white/10 bg-slate-900/75 hover:border-amber-400/60 hover:bg-slate-900 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">
                          {profile.label}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {profile.scope}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-emerald-300">
                        <span>{profile.code}</span>
                        <span className="text-amber-300 group-hover:translate-x-0.5 transition-transform">
                          Enter →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bottom Action Bar: B2B Invitation Builder */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-300">
                  Need to invite an external GC client, CPA firm, or REIT partner to specific modules?
                </span>
                <Link
                  href="/portal?builder=1"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-extrabold border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors whitespace-nowrap"
                >
                  🎟️ Open B2B Module Invitation Builder
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
