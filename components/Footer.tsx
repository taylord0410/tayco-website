import Link from "next/link";
import Image from "@/components/ProtectedImage";
import { COMPANY, COMPANY_SERVICES } from "@/lib/company";

export default function Footer() {
  return (
    <footer className="text-slate-300" style={{ background: "linear-gradient(180deg, #070E1A 0%, #050A14 100%)", borderTop: "1px solid rgba(201,168,76,.25)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-9">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-4" aria-label="TAYCO home">
              <Image
                src="/logo.png"
                alt=""
                width={48}
                height={48}
                className="w-12 h-12 rounded-full bg-[#070E1A] p-1 object-contain ring-1 ring-[#C9A84C]/50"
                auditIgnore={true}
              />
              <span>
                <span className="font-display font-bold text-2xl tracking-wide block text-[#F3D37A]">{COMPANY.name}</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Construction Company</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">Commercial construction, residential renovation and restoration. One team to help take your project from a clear scope to a finished space.</p>
            <p className="mt-4 text-xs text-amber-200 leading-relaxed">{COMPANY.coverage}</p>
            <p className="mt-3 text-xs text-slate-400">Licensed &amp; Insured · Certified Restoration Contractor</p>
          </div>
          <nav aria-label="Footer services">
            <h2 className="tayco-eyebrow mb-4">Property categories &amp; services</h2>
            <ul className="space-y-2 text-sm mb-4 pb-3 border-b border-white/10">
              <li><Link href="/properties/single-family" className="inline-block py-0.5 text-[#F3D37A] hover:text-white font-semibold transition-colors">Single-Family Homes →</Link></li>
              <li><Link href="/properties/duplexes" className="inline-block py-0.5 text-[#F3D37A] hover:text-white font-semibold transition-colors">Multifamily →</Link></li>
              <li><Link href="/properties/townhouses" className="inline-block py-0.5 text-[#F3D37A] hover:text-white font-semibold transition-colors">Townhomes →</Link></li>
              <li><Link href="/properties/commercial" className="inline-block py-0.5 text-[#F3D37A] hover:text-white font-semibold transition-colors">Commercial →</Link></li>
            </ul>
            <ul className="space-y-2 text-sm">{COMPANY_SERVICES.map(service => <li key={service.label}><Link href={service.href} className="inline-block py-1 text-slate-400 hover:text-white transition-colors">{service.label}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Footer project resources">
            <h2 className="tayco-eyebrow mb-4">Build with TAYCO</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/estimate" className="inline-block py-1 text-amber-200 hover:text-white">Request a free estimate</Link></li>
              <li><Link href="/investor" className="inline-block py-1 text-slate-400 hover:text-white">Owners &amp; property managers</Link></li>
              <li><Link href="/vendor-application" className="inline-block py-1 text-slate-400 hover:text-white">Become a trade partner</Link></li>
              <li><Link href="/login" className="inline-block py-1 text-slate-400 hover:text-white">Team, client &amp; supplier sign in</Link></li>
              <li><Link href="/privacy#project-photography-privacy" className="inline-block py-1 text-[#F3D37A] hover:text-white font-semibold">Privacy Policy &amp; Client Confidentiality</Link></li>
            </ul>
            <p className="text-xs text-slate-400 leading-relaxed mt-5">For property owners, investors, banks and lenders, general contractors, property managers and business owners.</p>
          </nav>
          <div id="contact">
            <h2 className="tayco-eyebrow mb-4">Let’s talk about your project</h2>
            <address className="not-italic text-sm space-y-3">
              <p><a href={COMPANY.phoneHref} className="inline-block py-1 text-white hover:text-amber-200">{COMPANY.phoneDisplay}</a></p>
              <p><a href={COMPANY.emailHref} className="inline-block py-1 break-all text-slate-300 hover:text-white">{COMPANY.email}</a></p>
              <p className="text-slate-400">{COMPANY.hours}<br />{COMPANY.saturday}</p>
            </address>
            <Link href="/estimate" data-magnetic className="tayco-atelier-btn-gold mt-5 inline-flex justify-center text-sm font-bold">Tell us what you’re planning →</Link>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>
          <Link href="/privacy#project-photography-privacy" className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/35 bg-[#0F2040]/70 px-3.5 py-1.5 font-semibold text-[#F3D37A] hover:border-[#C9A84C] hover:text-white transition-colors">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Privacy Policy &amp; Data Protection</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
