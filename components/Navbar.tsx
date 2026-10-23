"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const VERIFIED_ROLE_PROFILES = [
  {
    code: "INV-TAYCO-MASTER",
    label: "🔑 Managing Director (6/6 Modules)",
    scope:
      "Full Enterprise Command: Takeoff Pro (:8085) + CRM + WH-347 Payroll + QuickBooks + 9-State Tax + Investor Dossier",
    href: "/portal?invite=INV-TAYCO-MASTER",
  },
  {
    code: "INV-CLIENT-CRM-TAKEOFF",
    label: "📐 Commercial Client & Estimator (2/6 Modules: Takeoff Pro + CRM)",
    scope:
      "Scoped B2B Client Access: CSI-32 Blueprint Takeoff Pro v5.0 + Commercial Bid Pipeline",
    href: "/portal?invite=INV-CLIENT-CRM-TAKEOFF",
  },
  {
    code: "INV-CPA-FINANCE-TAX",
    label: "📗 CPA & Tax Auditor (3/6 Modules: Payroll + QuickBooks + 9-State Tax)",
    scope:
      "Audit & Accounting Access: Davis-Bacon WH-347 + QuickBooks .IIF/.QBO + 9-State Tax & 1099-NEC",
    href: "/portal?invite=INV-CPA-FINANCE-TAX",
  },
  {
    code: "INV-INVESTOR-PORTFOLIO",
    label: "📊 REIT Investor & Lender Board (3/6 Modules: CRM + QuickBooks + Investor Dossier)",
    scope:
      "Institutional Capital Access: Turnkey Portfolio IRR, AIA G702/G703 Draw Schedules & Master Dossier",
    href: "/portal?invite=INV-INVESTOR-PORTFOLIO",
  },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("INV-CLIENT-CRM-TAKEOFF");
  const [motionPaused, setMotionPaused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      setMotionPaused(localStorage.getItem("tayco-motion-paused") === "1");
    } catch {
      // ignore
    }
    const handleState = (e: Event) => {
      const custom = e as CustomEvent<{ paused?: boolean }>;
      if (typeof custom.detail?.paused === "boolean") {
        setMotionPaused(custom.detail.paused);
      }
    };
    window.addEventListener("tayco:motion-state", handleState);
    return () => window.removeEventListener("tayco:motion-state", handleState);
  }, []);

  function toggleLivingMotion() {
    const next = !motionPaused;
    setMotionPaused(next);
    window.dispatchEvent(
      new CustomEvent("tayco:toggle-motion", { detail: { paused: next } })
    );
  }

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
          background: "rgba(15, 32, 64, 0.92)",
          borderColor: "rgba(201, 168, 76, 0.34)",
          boxShadow: "0 8px 32px rgba(7, 14, 26, 0.65)",
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
                className="rounded-full ring-1 ring-amber-400/50 group-hover:ring-amber-400 transition-all"
              />
              <span className="flex flex-col leading-tight">
                <span
                  className="font-bold text-lg sm:text-xl tracking-tight"
                  style={{ color: "#C9A84C" }}
                >
                  TAYCO LLC
                </span>
                <span className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">
                  Commercial GC &amp; Executive Command
                </span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-3.5">
              <Link
                href="/commercial"
                className="text-xs font-bold uppercase tracking-wider transition-colors hover:text-white"
                style={{ color: "#C9A84C" }}
              >
                Commercial
              </Link>
              <Link
                href="/residential"
                className="text-slate-200 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Residential
              </Link>
              <Link
                href="/investor"
                className="text-slate-200 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Investors
              </Link>
              <Link
                href="/vendor-application"
                className="text-slate-200 hover:text-white text-xs font-semibold uppercase tracking-wider transition-colors"
              >
                Subcontractors
              </Link>

              <button
                type="button"
                id="btn-toggle-living-motion"
                data-magnetic
                onClick={toggleLivingMotion}
                aria-pressed={motionPaused}
                className="text-[11px] font-mono font-bold px-2.5 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5"
                style={{
                  background: motionPaused
                    ? "rgba(27, 58, 107, 0.55)"
                    : "rgba(201, 168, 76, 0.14)",
                  borderColor: motionPaused
                    ? "rgba(148, 163, 184, 0.35)"
                    : "rgba(201, 168, 76, 0.5)",
                  color: motionPaused ? "#CBD5E1" : "#F3D37A",
                }}
                title="Toggle Living Editorial Physics & Ambient Motion"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: motionPaused ? "#94A3B8" : "#F97316",
                    boxShadow: motionPaused ? "none" : "0 0 8px #F97316",
                  }}
                />
                <span>{motionPaused ? "Ⅱ Motion Paused" : "✦ Live Editorial"}</span>
              </button>

              <Link
                href="/portal"
                id="nav-portal-multitenant"
                data-magnetic
                className="text-xs font-extrabold px-3.5 py-2 rounded-lg border transition-all hover:scale-[1.03] flex items-center gap-2"
                style={{
                  background: "rgba(27, 58, 107, 0.75)",
                  borderColor: "rgba(201, 168, 76, 0.65)",
                  color: "#F3D37A",
                }}
              >
                <span className="tayco-live-dot" style={{ color: "#F97316" }} />
                <span>🏛️ Command Center</span>
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border"
                  style={{
                    background: "rgba(201, 168, 76, 0.2)",
                    borderColor: "rgba(201, 168, 76, 0.45)",
                    color: "#F3D37A",
                  }}
                >
                  6 Modules
                </span>
              </Link>

              <button
                type="button"
                id="btn-open-quick-login-modal"
                data-magnetic
                onClick={() => setModalOpen(true)}
                className="text-xs font-extrabold px-3.5 py-2 rounded-lg border transition-all hover:bg-white/10 text-slate-100 cursor-pointer"
                style={{
                  background: "#1B3A6B",
                  borderColor: "rgba(201, 168, 76, 0.45)",
                }}
              >
                🔐 Sign In / Invite Code
              </button>

              <Link
                href="/estimate"
                data-magnetic
                className="text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg transition-transform hover:scale-[1.02] shadow-md"
                style={{ background: "#F97316", color: "#ffffff" }}
              >
                Get Free Estimate
              </Link>
            </div>

            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={toggleLivingMotion}
                className="text-[10px] font-mono font-bold px-2 py-1 rounded-full border"
                style={{
                  background: "rgba(201,168,76,0.14)",
                  borderColor: "rgba(201,168,76,0.45)",
                  color: "#F3D37A",
                }}
              >
                {motionPaused ? "Ⅱ Paused" : "✦ Live"}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border text-amber-300"
                style={{
                  background: "rgba(27, 58, 107, 0.8)",
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
                className="text-slate-200 text-sm"
                onClick={() => setOpen(false)}
              >
                Residential Renovation &amp; 24/7 Restoration
              </Link>
              <Link
                href="/investor"
                className="text-slate-200 text-sm"
                onClick={() => setOpen(false)}
              >
                Institutional Investors &amp; REITs
              </Link>
              <Link
                href="/vendor-application"
                className="text-slate-200 text-sm"
                onClick={() => setOpen(false)}
              >
                Subcontractor Registry (29 CSI Trades)
              </Link>
              <div className="flex flex-wrap gap-2 pt-1">
                <Link
                  href="/portal"
                  className="text-xs font-bold px-3.5 py-2 rounded-lg border"
                  style={{
                    background: "rgba(27, 58, 107, 0.85)",
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
                  className="text-xs font-bold px-3.5 py-2 rounded-lg border text-white"
                  style={{
                    background: "#1B3A6B",
                    borderColor: "rgba(201, 168, 76, 0.45)",
                  }}
                >
                  🔐 Sign In / Invite Code
                </button>
                <Link
                  href="/estimate"
                  className="text-xs font-black px-4 py-2 rounded-lg"
                  style={{ background: "#F97316", color: "#ffffff" }}
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
          style={{ background: "rgba(7, 14, 26, 0.84)", backdropFilter: "blur(10px)" }}
          onClick={() => setModalOpen(false)}
        >
          <div
            data-surface-mode="crystal"
            data-response-kind="surface"
            className="tayco-living-card relative w-full max-w-2xl p-6 sm:p-8 text-white rounded-2xl border"
            style={{
              background: "linear-gradient(150deg, #0F2040 0%, #1B3A6B 100%)",
              borderColor: "rgba(201, 168, 76, 0.45)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-orbits" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="tayco-eyebrow" style={{ color: "#F3D37A" }}>
                    <span className="tayco-live-dot" style={{ color: "#F97316" }} />
                    Multi-Tenant RBAC · Module-Scoped Access
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
                    TAYCO Digital Command{" "}
                    <em className="tayco-serif-em" style={{ color: "#C9A84C" }}>
                      Quick Sign-In
                    </em>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Enter a B2B Module Invitation Code or activate a verified role-scoped executive access credential.
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
                className="p-4 rounded-xl border border-amber-400/35 bg-slate-950/65 mb-5"
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
                    data-magnetic
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

              {/* Verified Multi-Tenant Role & Partner Credentials */}
              <div className="mb-5">
                <div className="text-[11px] font-mono uppercase tracking-widest text-slate-300 mb-2.5">
                  Verified Multi-Tenant Role &amp; Partner Credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VERIFIED_ROLE_PROFILES.map((profile) => (
                    <Link
                      key={profile.code}
                      href={profile.href}
                      onClick={() => setModalOpen(false)}
                      className="group p-3.5 rounded-xl border border-white/15 bg-slate-950/60 hover:border-amber-400/70 hover:bg-slate-950/85 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="text-xs font-extrabold text-white group-hover:text-amber-300 transition-colors">
                          {profile.label}
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                          {profile.scope}
                        </p>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono text-amber-300">
                        <span>{profile.code}</span>
                        <span
                          className="font-bold group-hover:translate-x-0.5 transition-transform"
                          style={{ color: "#F97316" }}
                        >
                          Enter →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Bottom Action Bar: B2B Invitation Builder */}
              <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs text-slate-200">
                  Need to invite an external GC client, CPA firm, or REIT partner to specific modules?
                </span>
                <Link
                  href="/portal?builder=1"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-extrabold border transition-colors whitespace-nowrap"
                  style={{
                    background: "rgba(249, 115, 22, 0.16)",
                    borderColor: "rgba(249, 115, 22, 0.55)",
                    color: "#FDBA74",
                  }}
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
