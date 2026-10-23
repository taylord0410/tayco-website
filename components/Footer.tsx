import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer
      style={{
        background: "linear-gradient(180deg, #070E1A 0%, #050A14 100%)",
        borderTop: "1px solid rgba(201, 168, 76, 0.25)",
      }}
      className="text-slate-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <Image
                src="/logo.jpeg"
                alt="TAYCO LLC"
                width={48}
                height={48}
                className="rounded-full ring-1 ring-amber-400/40"
              />
              <div>
                <span className="font-bold text-xl tracking-tight block" style={{ color: "#C9A84C" }}>
                  TAYCO LLC
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                  General Contractor
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-2 leading-relaxed">
              Full-Service Commercial, Industrial &amp; Residential Construction Across 9 States.
            </p>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-[11px] font-mono text-emerald-300 mb-2">
              <span className="umbra-live-dot" />
              <span>WI · IL · IA · IN · MN · MI · MO · TX · ND</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Licensed, Bonded &amp; Insured · IICRC Certified Restoration Contractor
            </p>
          </div>

          <div>
            <div className="umbra-eyebrow mb-3">Construction Divisions</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/commercial" className="text-slate-400 hover:text-white transition-colors">
                  Commercial Ground-Up &amp; TI
                </Link>
              </li>
              <li>
                <Link href="/residential" className="text-slate-400 hover:text-white transition-colors">
                  Residential Remodeling &amp; Additions
                </Link>
              </li>
              <li>
                <Link href="/commercial#services" className="text-slate-400 hover:text-white transition-colors">
                  24/7 Fire &amp; Water Restoration
                </Link>
              </li>
              <li>
                <Link href="/commercial#services" className="text-slate-400 hover:text-white transition-colors">
                  Roofing, Glazing &amp; Building Envelope
                </Link>
              </li>
              <li>
                <Link href="/commercial#services" className="text-slate-400 hover:text-white transition-colors">
                  MEP, HVAC, Electrical &amp; Plumbing
                </Link>
              </li>
              <li>
                <Link href="/investor" className="text-slate-400 hover:text-white transition-colors">
                  REIT &amp; Institutional Turnkey Programs
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="umbra-eyebrow mb-3">Digital Command Center</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/portal" className="text-amber-300 hover:text-white font-semibold transition-colors">
                  🏛️ Multi-Tenant Command Center (6 Modules)
                </Link>
              </li>
              <li>
                <Link
                  href="/portal?invite=INV-CLIENT-CRM-TAKEOFF"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  📐 Client Demo: Takeoff Pro + CRM
                </Link>
              </li>
              <li>
                <Link
                  href="/portal?invite=INV-CPA-FINANCE-TAX"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  📗 CPA Demo: WH-347 + QuickBooks + Tax
                </Link>
              </li>
              <li>
                <Link
                  href="/portal?invite=INV-INVESTOR-PORTFOLIO"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  📊 REIT Demo: Portfolio IRR &amp; Draw Schedules
                </Link>
              </li>
              <li>
                <Link
                  href="/portal?builder=1"
                  className="text-emerald-300 hover:text-white transition-colors"
                >
                  🎟️ B2B Module Invitation Builder
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="umbra-eyebrow mb-3">Institutional Clients</div>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Commercial Property Owners</li>
              <li>Institutional Investors &amp; REITs</li>
              <li>Regional Banks &amp; Asset Lenders</li>
              <li>National General Contractors</li>
              <li>Multi-Family Property Managers</li>
              <li>Retail &amp; Industrial Developers</li>
            </ul>
          </div>

          <div>
            <div className="umbra-eyebrow mb-3">Executive Dispatch</div>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="tel:+18572301452" className="text-slate-300 hover:text-white transition-colors">
                  📞 (857) 230-1452
                </a>
              </li>
              <li>
                <a
                  href="mailto:general@taycoturnkey.com"
                  className="text-slate-300 hover:text-white transition-colors"
                >
                  ✉️ general@taycoturnkey.com
                </a>
              </li>
              <li className="text-slate-400">📍 2829 W Wisconsin Ave, Milwaukee, WI</li>
              <li className="text-slate-400">🕐 Mon–Fri 7:00 AM–6:00 PM CST</li>
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/portal"
                className="text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg text-center transition-colors"
                style={{ background: "#C9A84C", color: "#070E1A" }}
              >
                🏛️ Launch Command Center
              </Link>
              <Link
                href="/estimate"
                className="text-white text-xs font-bold px-4 py-2 rounded-lg text-center border border-amber-400/50 hover:bg-white/5 transition-colors"
              >
                🧮 CSI-32 Instant Estimator
              </Link>
              <Link
                href="/vendor-application"
                className="text-xs px-4 py-2 rounded-lg text-center border border-slate-600 text-slate-300 hover:border-white hover:text-white transition-colors"
              >
                🛠️ Subcontractor Onboarding (W-9/COI)
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-500 font-mono">
          <p>
            © {new Date().getFullYear()} TAYCO LLC — All Rights Reserved. Powered by Takeoff Pro Engine v5.0 &amp; TAYCO Executive Architecture.
          </p>
          <p>Licensed &amp; Insured · CSI-32 MasterFormat · Davis-Bacon WH-347 &amp; AIA G702/G703 Compliant</p>
        </div>
      </div>
    </footer>
  );
}
