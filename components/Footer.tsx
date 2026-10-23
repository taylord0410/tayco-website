import Link from "next/link";
import Image from "next/image";
import { COMPANY, COMPANY_SERVICES } from "@/lib/company";

export default function Footer() {
  return (
    <footer className="text-slate-300" style={{ background: "linear-gradient(180deg, #070E1A 0%, #050A14 100%)", borderTop: "1px solid rgba(201,168,76,.25)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-9">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 mb-4" aria-label="TAYCO home">
              <Image src="/logo.jpeg" alt="" width={48} height={48} className="rounded-full ring-1 ring-amber-400/40" />
              <span><span className="font-bold text-xl tracking-tight block text-[#C9A84C]">{COMPANY.name}</span><span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Construction Company</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">Commercial construction, residential renovation and restoration. One team to help take your project from a clear scope to a finished space.</p>
            <p className="mt-4 text-xs text-amber-200 leading-relaxed">{COMPANY.coverage}</p>
            <p className="mt-3 text-xs text-slate-400">Licensed &amp; Insured · Certified Restoration Contractor</p>
          </div>
          <nav aria-label="Footer services">
            <h2 className="tayco-eyebrow mb-4">Our services</h2>
            <ul className="space-y-2 text-sm">{COMPANY_SERVICES.map(service => <li key={service.label}><Link href={service.href} className="inline-block py-1 text-slate-400 hover:text-white transition-colors">{service.label}</Link></li>)}</ul>
          </nav>
          <nav aria-label="Footer project resources">
            <h2 className="tayco-eyebrow mb-4">Build with TAYCO</h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/estimate" className="inline-block py-1 text-amber-200 hover:text-white">Request a free estimate</Link></li>
              <li><Link href="/investor" className="inline-block py-1 text-slate-400 hover:text-white">Owners &amp; property managers</Link></li>
              <li><Link href="/vendor-application" className="inline-block py-1 text-slate-400 hover:text-white">Become a trade partner</Link></li>
              <li><Link href="/login" className="inline-block py-1 text-slate-400 hover:text-white">Team, client &amp; supplier sign in</Link></li>
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
            <Link href="/estimate" data-magnetic className="mt-5 inline-flex justify-center px-5 py-3 rounded-xl text-sm font-bold bg-[#C9A84C] text-[#070E1A]">Tell us what you’re planning →</Link>
          </div>
        </div>
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>
          <Link href="/privacy" className="text-slate-400 hover:text-white">Privacy &amp; data protection</Link>
        </div>
      </div>
    </footer>
  );
}
