import Link from "next/link";

const EMAIL = "info@taycoturnkey.com";

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-16"
      style={{ background: "linear-gradient(135deg, #0F2040 0%, #1B3A6B 60%, #0F2040 100%)" }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: "#C9A84C" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest mb-4" style={{ color: "#C9A84C" }}>
          Wisconsin · Illinois · Iowa · Indiana · Minnesota · Michigan · Missouri · Texas
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
          One Call.{" "}
          <span style={{ color: "#C9A84C" }}>Every Trade.</span>
          <br />
          Project Done.
        </h1>
        <p className="text-xl text-gray-300 mb-2">Full-Service General Contractor</p>
        <p className="text-gray-400 mb-8 text-lg">
          Residential &amp; Commercial &nbsp;|&nbsp; Turnkey &amp; Turnover Projects
          <br />
          Water &amp; Fire Damage Restoration &nbsp;|&nbsp; Licensed &amp; Insured
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/estimate"
            className="text-white font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
            style={{ background: "#C9A84C" }}
          >
            Request a Free Estimate
          </Link>
          <a
            href={`mailto:${EMAIL}`}
            className="font-bold px-8 py-4 rounded-xl text-lg border-2 border-white text-white hover:bg-white/10 transition-colors"
          >
            📧 Email Us
          </a>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { number: "2,800+", label: "Projects Completed" },
            { number: "8", label: "States Served" },
            { number: "12+", label: "Trades In-House" },
            { number: "24h", label: "Response Time" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="text-3xl font-bold" style={{ color: "#C9A84C" }}>{s.number}</div>
              <div className="text-gray-300 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9A84C" }}>
            Most contractors subcontract everything. We don&apos;t.
          </p>
          <p className="text-gray-400 text-sm mt-1">
            12+ trades performed by our own in-house crews — no middlemen, no delays, no excuses.
          </p>
        </div>

      </div>
    </section>
  );
}

// ── ABOUT ─────────────────────────────────────────────────────────────────────
function About() {
  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
              Who We Are
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: "#0F2040" }}>
              One Team. Every Trade. Complete Projects.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>TAYCO LLC</strong> is a full-service General Contractor proudly serving{" "}
              <strong>Wisconsin and Illinois</strong>. We handle every trade under one roof — from the first
              demolition to the final coat of paint — delivering complete, ready-to-use projects on time and
              within budget.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              We work with <strong>homeowners, property managers, real estate investors, banks, and commercial
              building owners</strong> who need a reliable contractor they can call once and trust completely.
            </p>
            <p className="font-bold text-xl mt-2" style={{ color: "#1B3A6B" }}>
              No coordinating multiple companies. No surprises.
              <br />Just one team, one point of contact, and one finished project.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🏗️", title: "General Contractor", desc: "Complete builds & renovations" },
              { icon: "🔑", title: "Turnkey Specialist", desc: "Start to finish delivery" },
              { icon: "💧", title: "Water Restoration", desc: "Certified & responsive" },
              { icon: "🔥", title: "Fire Restoration", desc: "Full rebuild capability" },
              { icon: "🏦", title: "REO & Bank Work", desc: "Compliant & on-time" },
              { icon: "⚡", title: "Licensed & Insured", desc: "WI & IL coverage" },
            ].map((item) => (
              <div key={item.title} className="rounded-xl p-4 border-2" style={{ borderColor: "#E2E8F0" }}>
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-sm" style={{ color: "#0F2040" }}>{item.title}</div>
                <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── SERVICES ──────────────────────────────────────────────────────────────────
const SERVICES = [
  {
    icon: "🔨",
    title: "Construction & Renovation",
    desc: "Complete interior and exterior renovations for residential and commercial properties. We self-perform core trades with in-house crews.",
    items: ["Framing — Wood & Steel Stud", "Drywall & Finishing", "Carpentry & Millwork", "Demolition & Cleanout", "Interior & Exterior Painting"],
    highlight: false,
  },
  {
    icon: "🏠",
    title: "Roofing & Exterior",
    desc: "Residential and commercial roofing installations, repairs, and replacements. Asphalt shingles, flat systems, and commercial membranes.",
    items: ["Roof Installation & Replacement", "Roof Repair", "Commercial Flat Roofing", "Gutters & Drainage"],
    highlight: false,
  },
  {
    icon: "🪵",
    title: "Flooring",
    desc: "Full flooring installation for any room, property type, or budget. All materials, professional finishes every time.",
    items: ["Luxury Vinyl Plank (LVP)", "Hardwood Flooring", "Ceramic & Porcelain Tile", "Carpet", "Subfloor Repair & Preparation"],
    highlight: false,
  },
  {
    icon: "⚡",
    title: "Electrical & Plumbing",
    desc: "Licensed electrical and plumbing work for residential and commercial projects. Rough-in, finish work, panel upgrades, and more.",
    items: ["Electrical Rough-In & Finish", "Panel Upgrades", "Plumbing Rough-In & Finish", "Fixture Installation", "Water Heater Installation"],
    highlight: false,
  },
  {
    icon: "🔑",
    title: "Turnkey & Turnover Projects",
    desc: "We take a property from any condition and deliver it completely finished — ready to rent, sell, or occupy. This is our specialty.",
    items: ["Full Property Rehab", "Rental Unit Turnovers", "REO & Bank-Owned Property Renovations", "Pre-Sale Renovations", "Vacant Property Restoration"],
    highlight: true,
  },
  {
    icon: "💧",
    title: "Water & Fire Damage Restoration",
    desc: "Licensed and certified for emergency and planned restoration. We respond quickly and restore the property to its original condition — or better.",
    items: ["Water Damage Assessment & Restoration", "Flood & Leak Damage Repair", "Mold Remediation Coordination", "Fire & Smoke Damage Restoration", "Full Interior Rebuild Post-Disaster"],
    highlight: false,
  },
];

function Services() {
  return (
    <section id="services" className="py-20" style={{ background: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            What We Do
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "#0F2040" }}>
            Every Trade. One Team.
          </h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl p-6 bg-white shadow-sm border-2 hover:shadow-md transition-shadow"
              style={{ borderColor: s.highlight ? "#C9A84C" : "#E2E8F0" }}
            >
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0F2040" }}>
                {s.highlight && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full mr-2 text-white" style={{ background: "#C9A84C" }}>
                    Our Specialty
                  </span>
                )}
                {s.title}
              </h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">{s.desc}</p>
              <ul className="space-y-1">
                {s.items.map((item) => (
                  <li key={item} className="text-sm text-gray-700 flex items-start gap-2">
                    <span style={{ color: "#C9A84C" }}>✔</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CERTIFICATIONS ────────────────────────────────────────────────────────────
function Certifications() {
  return (
    <section className="py-24" style={{ background: "#0F2040" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            Official Certifications
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            We Are{" "}
            <span style={{ color: "#C9A84C" }}>Certified.</span>
          </h2>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            TAYCO LLC completed the official professional training and holds active certifications in
            both Water &amp; Fire Damage Restoration — a specialized qualification that most general
            contractors do not have.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {/* Fire Damage Restoration */}
          <div className="rounded-2xl p-8 border-2 text-left" style={{ borderColor: "#C9A84C", background: "rgba(201,168,76,0.07)" }}>
            <div className="text-6xl mb-4">🔥</div>
            <div className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 uppercase tracking-wider" style={{ background: "#C9A84C", color: "#0F2040" }}>
              Certified Contractor
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Fire Damage Restoration
            </h3>
            <p className="text-gray-300 leading-relaxed mb-5">
              TAYCO LLC completed the required professional Fire Damage Restoration certification course.
              Our team is trained and qualified to assess, remediate, and fully restore properties affected
              by fire and smoke damage — from the first emergency call to the final finish.
            </p>
            <ul className="space-y-2">
              {[
                "Fire & smoke damage assessment",
                "Structural damage evaluation",
                "Smoke & soot remediation",
                "Full interior rebuild post-fire",
                "Insurance documentation support",
              ].map((item) => (
                <li key={item} className="text-sm text-gray-300 flex items-start gap-2">
                  <span style={{ color: "#C9A84C" }}>✔</span> {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Water Damage Restoration */}
          <div className="rounded-2xl p-8 border-2 text-left" style={{ borderColor: "#C9A84C", background: "rgba(201,168,76,0.07)" }}>
            <div className="text-6xl mb-4">💧</div>
            <div className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 uppercase tracking-wider" style={{ background: "#C9A84C", color: "#0F2040" }}>
              Certified Contractor
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Water Damage Restoration
            </h3>
            <p className="text-gray-300 leading-relaxed mb-5">
              TAYCO LLC completed the official Water Damage Restoration certification course. We are
              qualified to respond to floods, leaks, and water intrusion events — performing a full
              and proper restoration that meets professional standards.
            </p>
            <ul className="space-y-2">
              {[
                "Water damage inspection & assessment",
                "Flood & leak damage repair",
                "Moisture detection & structural drying",
                "Mold remediation coordination",
                "Full property restoration to pre-loss condition",
              ].map((item) => (
                <li key={item} className="text-sm text-gray-300 flex items-start gap-2">
                  <span style={{ color: "#C9A84C" }}>✔</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl p-7 text-center" style={{ background: "rgba(201,168,76,0.12)", border: "2px solid rgba(201,168,76,0.4)" }}>
          <p className="text-white font-bold text-xl mb-2">
            🏅 Not every contractor is certified in restoration.
          </p>
          <p className="text-gray-300">
            Our certifications mean we follow the correct restoration process, meet safety and industry
            standards, and properly document everything for insurance — so you are protected from start to finish.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── WHO WE WORK WITH ──────────────────────────────────────────────────────────
const CLIENTS = [
  { icon: "🏦", title: "Banks & Lenders", desc: "REO property repairs, cleanouts, and full rehabs. We understand your timelines and compliance requirements." },
  { icon: "💼", title: "Real Estate Investors", desc: "Turnkey rehabs for flips and rentals. We maximize your ROI with quality finishes delivered on schedule." },
  { icon: "🏘️", title: "Property Managers", desc: "Fast, reliable unit turnovers and capital improvement projects. One call covers every trade." },
  { icon: "🏢", title: "Commercial Owners", desc: "Tenant improvements, office buildouts, retail remodels, and commercial renovations." },
  { icon: "🏠", title: "Homeowners", desc: "Full home renovations, room additions, kitchen and bathroom remodels, and restoration work." },
  { icon: "📈", title: "Private Investors", desc: "Ground-up builds and complete property renovations tailored to your investment strategy." },
];

function WhoWeWorkWith() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            Our Clients
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "#0F2040" }}>
            We Serve Clients Who Need It Done Right — The First Time.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CLIENTS.map((c) => (
            <div key={c.title} className="rounded-2xl p-6 border-2 hover:shadow-md transition-shadow" style={{ borderColor: "#E2E8F0" }}>
              <div className="text-4xl mb-3">{c.icon}</div>
              <h3 className="text-lg font-bold mb-2" style={{ color: "#0F2040" }}>{c.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── WHY TAYCO ─────────────────────────────────────────────────────────────────
const WHY = [
  { icon: "📞", title: "ONE Point of Contact", desc: "You call one number. We handle every trade. No confusion, no delays, no finger-pointing between contractors." },
  { icon: "✅", title: "Licensed & Insured", desc: "Fully licensed and insured in Wisconsin and Illinois. You are protected on every project." },
  { icon: "🏅", title: "Certified Restoration Contractor", desc: "Licensed for water and fire damage restoration — a capability most general contractors do not have." },
  { icon: "👷", title: "12+ Trades — All In-House", desc: "Most contractors subcontract almost everything. We self-perform 12+ trades with our own crews — drywall, flooring, painting, framing, roofing, electrical, plumbing, HVAC, siding, carpentry, concrete, and demolition. One team, zero hand-offs." },
  { icon: "🏗️", title: "Residential AND Commercial", desc: "From a single-family rehab to a full commercial buildout — we have the experience and capacity to deliver both." },
  { icon: "🧠", title: "We Know Your Business", desc: "We work with investors, banks, and property managers every day. We understand your deadlines, budgets, and expectations." },
  { icon: "📅", title: "On Time. On Budget. No Surprises.", desc: "We communicate throughout every phase of the project so you always know where things stand." },
];

function WhyTayco() {
  return (
    <section className="py-20" style={{ background: "#0F2040" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            Why Choose Us
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            The Simplest Decision You Will Make on Your Next Project.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WHY.map((w) => (
            <div key={w.title} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="text-3xl mb-3">{w.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{w.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{w.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────
const PROJECT_TYPES: { type: string; before?: string; after?: string }[] = [
  { type: "Full Home Renovation — Residential", before: "/renovation-before.png", after: "/renovation-after.png" },
  { type: "Turnkey Rehab — Real Estate Investor", before: "/turnkey-before.png", after: "/turnkey-after.png" },
  { type: "REO Property Restoration — Bank Owned" },
  { type: "Water Damage Restoration" },
  { type: "Fire Damage Restoration", before: "/fire-damage-before.png", after: "/fire-damage-after.png" },
  { type: "Commercial Renovation / Tenant Improvement" },
];

function Projects() {
  return (
    <section id="projects" className="py-20" style={{ background: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            Our Work
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "#0F2040" }}>
            See What We Build.
          </h2>
          <p className="text-gray-500 mt-2">Before &amp; After — Real Projects, Real Results</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PROJECT_TYPES.map(({ type, before, after }) => (
            <div key={type} className="rounded-2xl overflow-hidden bg-white shadow-sm border-2" style={{ borderColor: "#E2E8F0" }}>
              <div className="grid grid-cols-2 h-48">
                <div className="relative border-r overflow-hidden" style={{ borderColor: "#CBD5E1" }}>
                  {before ? (
                    <>
                      <img src={before} alt="Before" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded">BEFORE</span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 h-full" style={{ background: "#E2E8F0" }}>
                      <span className="text-3xl">📷</span>
                      <span className="text-xs font-semibold text-gray-500">BEFORE</span>
                    </div>
                  )}
                </div>
                <div className="relative overflow-hidden">
                  {after ? (
                    <>
                      <img src={after} alt="After" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#C9A84C", color: "#0F2040" }}>AFTER</span>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 h-full" style={{ background: "#DBEAFE" }}>
                      <span className="text-3xl">🏠</span>
                      <span className="text-xs font-semibold" style={{ color: "#1B3A6B" }}>AFTER</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm" style={{ color: "#0F2040" }}>{type}</p>
                <p className="text-xs text-gray-400 mt-1">Wisconsin / Illinois</p>
                <p className="text-xs mt-2 font-semibold" style={{ color: "#16A34A" }}>✅ Delivered on time &amp; within budget</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-8 italic">
          Photos coming soon. Contact us to request a portfolio.
        </p>
      </div>
    </section>
  );
}

// ── TESTIMONIALS ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "TAYCO LLC completed a full renovation on one of our rental units in under 3 weeks. Drywall, flooring, painting, electrical — everything. One call, one team. We will be using them on every property going forward.",
    name: "Property Manager",
    location: "Milwaukee, WI",
  },
  {
    quote: "They handled a complete REO rehab for us — tight timeline, strict bank requirements. TAYCO delivered on budget and passed inspection the first time. Highly recommend.",
    name: "Real Estate Investor",
    location: "Chicago, IL",
  },
  {
    quote: "After a significant water damage event, TAYCO responded quickly, assessed everything, and had the property fully restored better than before. Professional and reliable.",
    name: "Commercial Property Owner",
    location: "Kenosha, WI",
  },
];

function Testimonials() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            Client Reviews
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "#0F2040" }}>
            What Our Clients Say.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl p-6 border-2" style={{ borderColor: "#E2E8F0" }}>
              <div className="text-4xl mb-3" style={{ color: "#C9A84C" }}>&ldquo;</div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">{t.quote}</p>
              <div className="border-t pt-4" style={{ borderColor: "#E2E8F0" }}>
                <p className="font-semibold text-sm" style={{ color: "#0F2040" }}>— {t.name}</p>
                <p className="text-xs text-gray-400">{t.location}</p>
                <p className="text-yellow-400 mt-1 text-sm">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── SERVICE AREA ──────────────────────────────────────────────────────────────
const SERVICE_STATES = [
  { state: "Wisconsin", cities: ["Milwaukee", "Madison", "Kenosha", "Racine", "Green Bay", "Waukesha", "Oshkosh", "Surrounding areas"] },
  { state: "Illinois", cities: ["Chicago", "Rockford", "Aurora", "Naperville", "Joliet", "Elgin", "Waukegan", "Surrounding areas"] },
  { state: "Iowa", cities: ["Des Moines", "Cedar Rapids", "Davenport", "Iowa City", "Surrounding areas"] },
  { state: "Indiana", cities: ["Indianapolis", "Fort Wayne", "South Bend", "Evansville", "Surrounding areas"] },
  { state: "Minnesota", cities: ["Minneapolis", "St. Paul", "Bloomington", "Rochester", "Surrounding areas"] },
  { state: "Michigan", cities: ["Detroit", "Grand Rapids", "Lansing", "Ann Arbor", "Surrounding areas"] },
  { state: "Missouri", cities: ["St. Louis", "Kansas City", "Springfield", "Columbia", "Surrounding areas"] },
  { state: "Texas", cities: ["Dallas", "Houston", "San Antonio", "Austin", "Fort Worth", "Surrounding areas"] },
];

function ServiceArea() {
  return (
    <section id="service-area" className="py-20" style={{ background: "#1B3A6B" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
          Where We Work
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          We Work Where You Need Us.
        </h2>
        <p className="text-gray-300 mb-10">
          TAYCO LLC serves clients across <strong className="text-white">8 states</strong> — including major metros and surrounding communities.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SERVICE_STATES.map(({ state, cities }) => (
            <div key={state} className="rounded-2xl p-5 text-left" style={{ background: "rgba(255,255,255,0.1)" }}>
              <h3 className="text-lg font-bold text-white mb-3">📍 {state}</h3>
              <ul className="space-y-1">
                {cities.map((c) => (
                  <li key={c} className="text-gray-300 text-sm">{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-gray-400 mt-8 text-sm">
          <strong className="text-white">Not sure if we cover your area?</strong> Submit a request — chances are we do.
        </p>
      </div>
    </section>
  );
}

// ── CONTACT CTA ───────────────────────────────────────────────────────────────
function ContactCTA() {
  return (
    <section id="contact" className="py-20" style={{ background: "#C9A84C" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Start? Let&apos;s Talk.
        </h2>
        <p className="text-orange-100 mb-2">
          Contact us today for a <strong>free estimate</strong> on your next project.
        </p>
        <p className="text-orange-100 mb-8">We respond within <strong>24 hours.</strong></p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/estimate"
            className="bg-white font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
            style={{ color: "#C9A84C" }}
          >
            Request a Free Estimate
          </Link>
          <a
            href={`mailto:${EMAIL}`}
            className="border-2 border-white text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-colors"
          >
            📧 Email Us
          </a>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center text-white text-sm">
          <span>📧 {EMAIL}</span>
          <span className="hidden sm:inline">·</span>
          <span>📍 Wisconsin &amp; Illinois</span>
          <span className="hidden sm:inline">·</span>
          <span>🕐 Mon–Fri 7am–6pm</span>
        </div>
      </div>
    </section>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main>
      <Hero />
      <About />
      <Services />
      <Certifications />
      <WhoWeWorkWith />
      <WhyTayco />
      <Projects />
      <Testimonials />
      <ServiceArea />
      <ContactCTA />
    </main>
  );
}
