import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{ background: "#0F2040" }} className="text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <Image src="/logo.jpeg" alt="TAYCO LLC" width={48} height={48} className="rounded-full" />
              <span className="font-bold text-xl tracking-tight" style={{ color: "#C9A84C" }}>TAYCO LLC</span>
            </div>
            <p className="text-sm text-gray-400 mb-2">Full-Service Construction Company</p>
            <p className="text-sm text-gray-400">WI · IL · IA · IN · MN · MI · MO · TX · ND</p>
            <p className="text-sm text-gray-400 mt-1">Licensed &amp; Insured</p>
            <p className="text-sm text-gray-400">Certified Restoration Contractor</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/commercial" className="text-gray-400 hover:text-white transition-colors">Commercial Ground-Up &amp; TI</Link></li>
              <li><Link href="/residential" className="text-gray-400 hover:text-white transition-colors">Residential Remodeling</Link></li>
              <li><Link href="/commercial#services" className="text-gray-400 hover:text-white transition-colors">Fire &amp; Water Restoration</Link></li>
              <li><Link href="/commercial#services" className="text-gray-400 hover:text-white transition-colors">Roofing, Glazing &amp; Exterior</Link></li>
              <li><Link href="/commercial#services" className="text-gray-400 hover:text-white transition-colors">MEP, HVAC, Electrical &amp; Plumbing</Link></li>
              <li><Link href="/investor" className="text-gray-400 hover:text-white transition-colors">Investor &amp; REIT Turnkey Programs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider" style={{ color: "#C9A84C" }}>
              Enterprise Suite &amp; Client Portal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/portal" className="text-amber-300 hover:text-white font-semibold transition-colors">
                  🔐 Multi-Tenant Portal &amp; Module Invitations
                </Link>
              </li>
              <li>
                <Link href="/portal?tab=MOD_CRM_BIDS" className="text-gray-400 hover:text-white transition-colors">
                  🤝 1. Commercial CRM &amp; Bid Pipeline
                </Link>
              </li>
              <li>
                <Link href="/portal?tab=MOD_PAYROLL_CREW" className="text-gray-400 hover:text-white transition-colors">
                  👷 2. Payroll &amp; Davis-Bacon WH-347
                </Link>
              </li>
              <li>
                <Link href="/portal?tab=MOD_QUICKBOOKS_ERP" className="text-gray-400 hover:text-white transition-colors">
                  📗 3. QuickBooks &amp; AIA G702/G703
                </Link>
              </li>
              <li>
                <Link href="/portal?tab=MOD_TAX_COMPLIANCE" className="text-gray-400 hover:text-white transition-colors">
                  🏛️ 4. Multi-State Tax &amp; 1099-NEC
                </Link>
              </li>
              <li>
                <a href="/astro-preview/index.html" className="text-emerald-300 hover:text-white transition-colors">
                  ⚡ Astro 5 Static Architecture Preview
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Clients We Serve</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Property Owners</li>
              <li className="text-gray-400">Institutional Investors &amp; REITs</li>
              <li className="text-gray-400">Banks &amp; Lenders</li>
              <li className="text-gray-400">General Contractors</li>
              <li className="text-gray-400">Property Managers</li>
              <li className="text-gray-400">Commercial Developers</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="tel:+18572301452" className="text-gray-300 hover:text-white transition-colors">📞 857-230-1452</a></li>
              <li><a href="mailto:general@taycoturnkey.com" className="text-gray-300 hover:text-white transition-colors">✉️ general@taycoturnkey.com</a></li>
              <li className="text-gray-400">📍 2829 W Wisconsin Ave, Milwaukee, WI</li>
              <li className="text-gray-400">🕐 Mon–Fri 7am–6pm · Sat by appt</li>
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/portal" className="text-sm font-bold px-4 py-2 rounded-lg text-center transition-colors" style={{ background: "#C9A84C", color: "#0F2040" }}>
                🔐 Open Enterprise Portal
              </Link>
              <Link href="/estimate" className="text-white text-sm font-semibold px-4 py-2 rounded-lg text-center border border-amber-400/50 hover:bg-white/5 transition-colors">
                Instant Calculator &amp; Estimate
              </Link>
              <Link href="/vendor-application" className="text-sm px-4 py-2 rounded-lg text-center border border-gray-500 text-gray-300 hover:border-white hover:text-white transition-colors">
                Vendor Application (29 Trades)
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} TAYCO LLC — All Rights Reserved. Connected to Takeoff Pro Engine v5.0.</p>
          <p>Licensed &amp; Insured | Water &amp; Fire Damage Restoration Certified | Astro 5 + Next.js Hybrid</p>
        </div>
      </div>
    </footer>
  );
}
