import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer style={{ background: "#0F2040" }} className="text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-3">
              <Image src="/logo.jpeg" alt="TAYCO LLC" width={48} height={48} className="rounded-full" />
              <span className="font-bold text-xl tracking-tight" style={{ color: "#C9A84C" }}>TAYCO LLC</span>
            </div>
            <p className="text-sm text-gray-400 mb-2">Full-Service Construction Company</p>
            <p className="text-sm text-gray-400">WI · IL · IA · IN · MN · MI · MO · TX</p>
            <p className="text-sm text-gray-400 mt-1">Licensed &amp; Insured</p>
            <p className="text-sm text-gray-400">Certified Restoration Contractor</p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#services" className="text-gray-400 hover:text-white transition-colors">General Construction &amp; Remodeling</Link></li>
              <li><Link href="#services" className="text-gray-400 hover:text-white transition-colors">Fire Restoration</Link></li>
              <li><Link href="#services" className="text-gray-400 hover:text-white transition-colors">Water Restoration</Link></li>
              <li><Link href="#services" className="text-gray-400 hover:text-white transition-colors">Construction &amp; Renovation</Link></li>
              <li><Link href="#services" className="text-gray-400 hover:text-white transition-colors">Roofing &amp; Exterior</Link></li>
              <li><Link href="#services" className="text-gray-400 hover:text-white transition-colors">Flooring</Link></li>
              <li><Link href="#services" className="text-gray-400 hover:text-white transition-colors">Electrical &amp; Plumbing</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Clients We Serve</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Banks &amp; Lenders</li>
              <li className="text-gray-400">Real Estate Investors</li>
              <li className="text-gray-400">Property Managers</li>
              <li className="text-gray-400">Commercial Owners</li>
              <li className="text-gray-400">Homeowners</li>
              <li className="text-gray-400">Private Investors</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">📍 WI · IL · IA · IN · MN · MI · MO · TX</li>
              <li className="text-gray-400">🕐 Mon–Fri 7am–6pm</li>
              <li className="text-gray-400">Sat by appointment</li>
            </ul>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/estimate" className="text-white text-sm font-semibold px-4 py-2 rounded-lg text-center transition-colors" style={{ background: "#C9A84C" }}>
                Get Free Estimate
              </Link>
              <Link href="/vendor-application" className="text-sm px-4 py-2 rounded-lg text-center border border-gray-500 text-gray-300 hover:border-white hover:text-white transition-colors">
                Vendor Application
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} TAYCO LLC — All Rights Reserved.</p>
          <p>Licensed &amp; Insured | Water &amp; Fire Damage Restoration Certified</p>
        </div>
      </div>
    </footer>
  );
}
