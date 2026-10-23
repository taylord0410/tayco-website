import { COMPANY, COMPANY_CONTRACTING_UPDATE as update } from "@/lib/company";

export default function ContractingOpportunities() {
  return (
    <section
      id="certifications"
      aria-labelledby="contracting-title"
      className="relative z-10 scroll-mt-24 border-y border-amber-200/20 bg-[linear-gradient(125deg,#0F2040_0%,#070E1A_70%)] px-4 py-14 sm:px-8 sm:py-20"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <p className="tayco-eyebrow text-amber-200">Certifications &amp; growth</p>
          <h2 id="contracting-title" className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
            {update.title}
          </h2>
          <dl className="mt-7 grid gap-5 border-l-2 border-[#C9A84C] pl-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-300">{update.milestone.label}</dt>
              <dd className="mt-1 text-lg font-bold text-white"><time dateTime={update.milestone.dateTime}>{update.milestone.period}</time></dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-slate-300">{update.expansion.label}</dt>
              <dd className="mt-1 text-lg font-bold text-[#F3D37A]"><time dateTime={update.expansion.dateTime}>{update.expansion.period}</time></dd>
            </div>
          </dl>
          <a href={COMPANY.emailHref} className="mt-7 inline-flex min-h-11 items-center gap-3 rounded-lg border border-amber-200/40 px-4 py-3 text-sm font-bold text-amber-100 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-200">
            Discuss contracting opportunities <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="min-w-0">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-200">Programs &amp; Certifications</h3>
          <ul className="grid gap-3 sm:grid-cols-2">
            {update.programs.map((program) => (
              <li key={program.id} className="min-w-0 rounded-xl border border-white/10 bg-white/[0.035] p-5">
                <p className="text-xs font-medium text-[#F3D37A]">{program.category}</p>
                <p className="mt-2 text-base font-bold leading-relaxed text-white">{program.label}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
