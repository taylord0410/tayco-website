import { COMPANY, COMPANY_CONTRACTING_UPDATE as update } from "@/lib/company";

function ProgramIcon({ id }: { id: string }) {
  switch (id) {
    case "sam":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F3D37A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M4 10h16" />
          <path d="M12 3 3 10h18L12 3Z" />
          <path d="M6 10v11" />
          <path d="M10 10v11" />
          <path d="M14 10v11" />
          <path d="M18 10v11" />
        </svg>
      );
    case "certifications":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F3D37A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3 4 7v6c0 5 3.4 7.8 8 9 4.6-1.2 8-4 8-9V7l-8-4Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "programs":
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F3D37A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 8h10" />
          <path d="M7 12h10" />
          <path d="M7 16h6" />
        </svg>
      );
    default:
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F3D37A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 21h18" />
          <path d="M6 21V7a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v14" />
          <path d="M13 11h4a1 1 0 0 1 1 1v9" />
          <path d="M9 10h1" />
          <path d="M9 14h1" />
        </svg>
      );
  }
}

export default function ContractingOpportunities({ compact = false }: { compact?: boolean }) {
  const sectionId = compact ? "company-certifications" : "certifications";
  const Heading = compact ? "h4" : "h2";
  const Subheading = compact ? "h5" : "h3";
  return (
    <section
      id={sectionId}
      aria-labelledby={`${sectionId}-title`}
      className={compact
        ? "min-w-0 rounded-2xl border p-4 sm:p-6 shadow-[0_20px_48px_-20px_rgba(7,14,26,0.9)]"
        : "relative z-10 scroll-mt-24 border-y px-4 py-14 sm:px-8 sm:py-20 shadow-[0_24px_60px_-24px_rgba(7,14,26,0.95)]"}
      style={{
        background: "linear-gradient(125deg, #0F2040 0%, #0B172A 48%, #070E1A 100%)",
        borderColor: compact ? "rgba(201, 168, 76, 0.35)" : "rgba(201, 168, 76, 0.28)",
      }}
    >
      <div className={compact ? "grid min-w-0 gap-6" : "mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-stretch lg:gap-16"}>
        <div className={compact ? "min-w-0" : "min-w-0 flex flex-col justify-between"}>
          <div>
            <p className={compact ? "tayco-eyebrow" : "tayco-atelier-eyebrow text-[#F3D37A]"} style={{ color: "#F3D37A" }}>
              <span className="tayco-live-dot" style={{ color: "#C9A84C" }} />
              {compact ? "Company certifications & growth" : "Certifications & growth"}
            </p>
            <Heading id={`${sectionId}-title`} className={compact ? "mt-3 text-xl font-black leading-tight text-white" : "tayco-display-title mt-4 max-w-xl text-3xl sm:text-4xl leading-tight text-white"}>
              {update.title}
            </Heading>
            <dl className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#C9A84C]/35 bg-[#070E1A]/65 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-300">{update.milestone.label}</dt>
                <dd className="mt-1 text-lg font-bold text-white"><time dateTime={update.milestone.dateTime}>{update.milestone.period}</time></dd>
              </div>
              <div className="rounded-2xl border border-[#C9A84C]/35 bg-[#070E1A]/65 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-300">{update.expansion.label}</dt>
                <dd className="mt-1 text-lg font-bold" style={{ color: "#F3D37A" }}><time dateTime={update.expansion.dateTime}>{update.expansion.period}</time></dd>
              </div>
            </dl>
          </div>
          <div className="pt-2">
            <a
              href={COMPANY.emailHref}
              data-magnetic
              className={compact
                ? "mt-7 inline-flex min-h-11 items-center gap-3 rounded-full border px-5 py-3 text-sm font-bold transition-all duration-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4"
                : "tayco-atelier-btn-gold mt-7 inline-flex items-center gap-3 text-xs sm:text-sm font-bold"}
              style={compact ? {
                background: "rgba(201, 168, 76, 0.14)",
                borderColor: "rgba(201, 168, 76, 0.45)",
                color: "#F3D37A",
                outlineColor: "#F3D37A",
              } : undefined}
            >
              <span>Discuss contracting opportunities</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          </div>
        </div>
        <div className="min-w-0 flex flex-col justify-between">
          <Subheading className={compact ? "mb-4 text-sm font-bold uppercase tracking-wider text-slate-200" : "tayco-atelier-eyebrow mb-4 text-slate-200"}>
            Programs &amp; Certifications
          </Subheading>
          <ul className="grid gap-3.5 sm:grid-cols-2">
            {update.programs.map((program) => (
              <li
                key={program.id}
                data-response-kind="surface"
                className="relative min-w-0 rounded-[22px] border p-5 transition-all duration-200 hover:border-[#E2C675]/60 flex flex-col justify-between text-left"
                style={{
                  background: "linear-gradient(150deg, rgba(27, 58, 107, 0.28) 0%, rgba(7, 14, 26, 0.72) 100%)",
                  borderColor: "rgba(201, 168, 76, 0.32)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 w-full pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border shadow-sm"
                        style={{
                          background: "rgba(7, 14, 26, 0.75)",
                          borderColor: "rgba(201, 168, 76, 0.45)",
                        }}
                      >
                        <ProgramIcon id={program.id} />
                      </span>
                      <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#F3D37A]">
                        {program.category}
                      </span>
                    </div>
                    <span
                      className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 shrink-0"
                    >
                      ● Active
                    </span>
                  </div>
                  <p className="mt-3.5 text-base font-semibold leading-snug text-white">
                    {program.label}
                  </p>
                </div>
                <div className="preview-orbits" aria-hidden="true"><i /><i /><i /></div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
