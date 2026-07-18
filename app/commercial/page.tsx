import Link from "next/link";
import ProjectsGallery from "@/components/ProjectsGallery";

function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-16"
      style={{ background: "linear-gradient(135deg, #0F2040 0%, #1B3A6B 60%, #0F2040 100%)" }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute left-0 top-0 h-full w-1" style={{ background: "#C9A84C" }} />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>
          Commercial Division
        </p>
        <p className="text-xs uppercase tracking-widest mb-6 text-gray-400">
          Wisconsin · Illinois · Minnesota · Open to Any State
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
          Commercial Construction.{" "}
          <span style={{ color: "#C9A84C" }}>Done Right.</span>
        </h1>
        <p className="text-xl text-gray-300 mb-2">Full-Service Commercial General Contractor</p>
        <p className="text-gray-400 mb-3 text-base max-w-2xl mx-auto leading-relaxed">
          At TAYCO LLC we deliver complete commercial construction solutions with a single point of contact — coordinating every phase from planning to final delivery. Our approach simplifies project management, optimizes timelines, and ensures clear communication throughout.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link
            href="/estimate"
            className="text-white font-bold px-8 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
            style={{ background: "#C9A84C" }}
          >
            Request a Free Estimate
          </Link>
          <Link
            href="/residential"
            className="font-bold px-8 py-4 rounded-xl text-lg border-2 text-white hover:opacity-80 transition-opacity"
            style={{ borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.07)" }}
          >
            View Residential →
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { number: "22+", label: "Specialties In-House" },
            { number: "50+", label: "States — We Mobilize" },
            { number: "500+", label: "Commercial Projects" },
            { number: "24h", label: "Response Time" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="text-3xl font-bold" style={{ color: "#C9A84C" }}>{s.number}</div>
              <div className="text-gray-300 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const COMMERCIAL_SERVICES = [
  {
    num: "01",
    title: "Commercial Roofing",
    accent: "#1B3A6B",
    desc: "We install, replace, and rehabilitate commercial roofing systems using high-performance materials tailored to each building's needs. Our goal is to deliver durable, efficient systems designed to protect our clients' investment.",
    items: ["TPO Systems", "EPDM Roofing", "PVC Membrane", "Modified Bitumen", "Roof Coatings", "Metal Roofing", "Roof Replacement", "Storm Damage Repair"],
  },
  {
    num: "02",
    title: "Commercial Siding & Cladding",
    accent: "#1B3A6B",
    desc: "We install exterior cladding systems that improve the appearance, energy efficiency, and protection of commercial buildings. We work with different materials and finishes to adapt to each project.",
    items: ["Metal Panels", "ACM Panels", "Steel Panels", "Fiber Cement", "Insulated Panels", "Storefront Cladding", "EIFS / Stucco", "Curtain Wall Support"],
  },
  {
    num: "03",
    title: "Commercial Framing",
    accent: "#1B3A6B",
    desc: "We build metal and wood structures for commercial projects, ensuring precision, stability, and compliance with construction standards for offices, retail spaces, restaurants, warehouses, and other facilities.",
    items: ["Metal Stud Framing", "Light Gauge Steel", "Structural Steel", "Load-Bearing Systems", "Interior Partitions", "Exterior Framing", "Wood Framing", "Specialty Headers"],
  },
  {
    num: "04",
    title: "Commercial Flooring",
    accent: "#1B3A6B",
    desc: "We install commercial flooring solutions designed to withstand high traffic and meet the demands of each industry — delivering the right system for every space.",
    items: ["LVP / Luxury Vinyl", "Vinyl Tile", "Commercial Carpet", "Epoxy Flooring", "Polished Concrete", "Ceramic & Porcelain Tile", "Sheet Vinyl", "Specialty Systems"],
  },
  {
    num: "05",
    title: "Drywall Systems",
    accent: "#1B3A6B",
    desc: "We install, finish, and repair drywall systems for commercial spaces, delivering paint-ready surfaces with high quality and efficiency standards.",
    items: ["Fire-Rated Assemblies", "Shaft Liner Systems", "Acoustic Panels", "Abuse-Resistant Board", "Suspended Ceilings", "Large-Format Systems", "Level 4 & 5 Finish", "GWB Repair"],
  },
  {
    num: "06",
    title: "Interior Build-Outs",
    accent: "#C9A84C",
    desc: "We transform interior spaces to meet the operational needs of each business — delivering complete remodels, office fit-outs, retail spaces, restaurants, and corporate environments.",
    items: ["Tenant Improvements", "Office Buildouts", "Retail Remodels", "Restaurant Conversions", "Corporate Spaces", "Medical Offices", "Warehouse Fit-Outs", "Ground-Up Interiors"],
  },
  {
    num: "07",
    title: "Industrial Demolition",
    accent: "#1B3A6B",
    desc: "We perform interior demolition work safely, organized, and efficiently — preparing facilities for renovations, expansions, or new commercial developments.",
    items: ["Selective Demolition", "Interior Strip-Out", "Concrete Cutting", "Saw-Cut & Core Drill", "Debris Haul-Off", "Structural Demo", "MEP Removal", "Site Preparation"],
  },
  {
    num: "08",
    title: "Exterior Renovations",
    accent: "#1B3A6B",
    desc: "We modernize and rehabilitate facades and exterior elements to improve the image, functionality, and value of commercial properties.",
    items: ["Facade Renovation", "Storefront Upgrades", "Exterior Painting", "Awnings & Canopies", "Parking Lot Concrete", "Curb & Gutter", "Exterior Lighting Prep", "ADA Compliance Work"],
  },
  {
    num: "09",
    title: "General Commercial Remodeling",
    accent: "#C9A84C",
    desc: "We manage complete commercial remodeling projects, coordinating each phase of the work to ensure efficient, organized execution with the highest quality standards.",
    items: ["Full Commercial Renovations", "REO & Bank Rehab", "Property Repositioning", "Unit Turnovers", "Capital Improvements", "Multi-Site Programs", "Fast-Track Projects", "Design-Build"],
  },
  {
    num: "10",
    title: "Fire & Water Restoration",
    accent: "#DC2626",
    desc: "Emergency response for fire and water damage in commercial properties — from the first call to full rebuild.",
    items: ["Emergency Board-Up", "Water Extraction", "Structural Drying", "Fire & Smoke Damage", "Soot Removal", "Mold Remediation", "Full Commercial Rebuild", "Insurance Documentation"],
  },
];

function Services() {
  return (
    <section id="services" className="py-24" style={{ background: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: "#C9A84C" }}>
            What We Do
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold" style={{ color: "#0F2040" }}>
            Commercial Trades. One Team.
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            22+ specialties performed by our own in-house crews — no middlemen, no delays.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {COMMERCIAL_SERVICES.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300"
              style={{ border: "1px solid #E2E8F0" }}
            >
              <div className="h-1 w-full" style={{ background: card.accent }} />
              <div className="p-8">
                <div className="mb-4">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: card.accent, opacity: 0.5 }}>
                    {card.num}
                  </span>
                  <h3 className="text-xl font-black mt-0.5 tracking-tight" style={{ color: "#0F2040" }}>
                    {card.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed mt-2 mb-4">{card.desc}</p>
                </div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {card.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: card.accent }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OneCallSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: "#C9A84C" }}>
              One Contractor
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "#0F2040" }}>
              22+ Specialties.<br />One Call.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              With a single call, our clients gain access to coordination of more than 22 construction specialties. This eliminates the need to hire and manage multiple vendors — reducing timelines, simplifying communication, and improving project control.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our team manages each project with detailed planning, continuous tracking, and constant supervision to ensure every phase is executed on schedule, within budget, and to the quality standards established.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: "📞", title: "Single Point of Contact", desc: "One number. One team. Every trade covered." },
              { icon: "📋", title: "Professional Project Management", desc: "Detailed planning, continuous tracking, and constant on-site supervision." },
              { icon: "🗂️", title: "Permit & Documentation Management", desc: "We handle permits, inspections, and all project documentation on your behalf." },
              { icon: "🚚", title: "Nationwide Availability", desc: "Ready to mobilize for commercial projects anywhere in the United States." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 p-5 rounded-xl border" style={{ borderColor: "#E2E8F0" }}>
                <div className="text-2xl shrink-0">{item.icon}</div>
                <div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: "#0F2040" }}>{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const CLIENTS = [
  { icon: "🏦", title: "Banks & Lenders", desc: "REO property repairs, cleanouts, and full rehabs. We understand your timelines and compliance requirements." },
  { icon: "🏢", title: "Commercial Owners", desc: "Tenant improvements, office buildouts, retail remodels, and complete commercial renovations under one roof." },
  { icon: "💼", title: "Real Estate Investors", desc: "Turnkey commercial rehabs. We maximize your ROI with quality results delivered on schedule." },
  { icon: "🏘️", title: "Property Managers", desc: "Fast, reliable commercial turnovers and capital improvement projects across your entire portfolio." },
  { icon: "🍽️", title: "Restaurant & Retail", desc: "Full QSR and retail buildouts — from framing and concrete to finishes and MEP coordination." },
  { icon: "📈", title: "Private Investors", desc: "Ground-up commercial builds and complete property renovations tailored to your investment strategy." },
];

function WhoWeWorkWith() {
  return (
    <section className="py-20" style={{ background: "#F8FAFC" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            Our Commercial Clients
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: "#0F2040" }}>
            We Work With the People Who Need It Done Right.
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CLIENTS.map((c) => (
            <div key={c.title} className="rounded-2xl p-6 border-2 bg-white hover:shadow-md transition-shadow" style={{ borderColor: "#E2E8F0" }}>
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

const WHY = [
  { icon: "📞", title: "Single Point of Contact", desc: "One number for the entire project. We coordinate every trade, every phase, every detail." },
  { icon: "🔧", title: "22+ Specialties In-House", desc: "Access to more than 22 construction specialties — no subcontractor chaos, no delays between trades." },
  { icon: "📋", title: "Professional Project Management", desc: "Detailed scheduling, continuous tracking, and constant supervision to keep every project on time and on budget." },
  { icon: "🗂️", title: "Permits & Documentation", desc: "We manage permitting, inspections, and all project documentation so you don't have to." },
  { icon: "✅", title: "Quality Control", desc: "Direct oversight of every trade means higher quality standards and fewer mistakes — we own the work." },
  { icon: "🌎", title: "We Go to You", desc: "Based in Wisconsin, Illinois, and Minnesota — but open to mobilizing for commercial projects in any state where our clients need us." },
  { icon: "⚡", title: "Efficient Scheduling", desc: "Coordinating all trades under one roof allows us to compress timelines and reduce costly project delays." },
  { icon: "🤝", title: "Custom Solutions", desc: "Every client and project is different. We adapt our approach to the specific needs, budget, and timeline of each job." },
  { icon: "🏅", title: "Safety & Excellence", desc: "Full commitment to safety protocols, workmanship standards, and delivering results that exceed expectations." },
];

function WhyTayco() {
  return (
    <section className="py-20" style={{ background: "#0F2040" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            Why Choose TAYCO LLC
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
          <p className="text-gray-500 mt-2">Before &amp; After — Real Commercial Projects</p>
        </div>
        <ProjectsGallery />
        <p className="text-center text-sm text-gray-400 mt-8 italic">
          Photos coming soon. Contact us to request a commercial portfolio.
        </p>
      </div>
    </section>
  );
}

function ServiceArea() {
  return (
    <section id="service-area" className="py-20" style={{ background: "#1B3A6B" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
          Where We Work
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Based in the Midwest. Ready to Go to You.
        </h2>
        <p className="text-gray-300 mb-10 text-lg max-w-2xl mx-auto">
          TAYCO LLC is headquartered and primarily serves clients in <strong className="text-white">Wisconsin, Illinois, and Minnesota</strong> — but we are open to mobilizing for commercial projects in any state where our clients need us, bringing the same level of quality, organization, and commitment to every location.
        </p>

        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          {[
            {
              state: "Wisconsin",
              flag: "🏙️",
              cities: ["Milwaukee", "Madison", "Kenosha", "Racine", "Green Bay", "Waukesha", "Oshkosh", "Surrounding areas"],
            },
            {
              state: "Illinois",
              flag: "🌆",
              cities: ["Chicago", "Rockford", "Aurora", "Naperville", "Joliet", "Elgin", "Waukegan", "Surrounding areas"],
            },
            {
              state: "Minnesota",
              flag: "❄️",
              cities: ["Minneapolis", "St. Paul", "Bloomington", "Rochester", "Duluth", "St. Cloud", "Mankato", "Surrounding areas"],
            },
          ].map(({ state, flag, cities }) => (
            <div key={state} className="rounded-2xl p-6 text-left" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(201,168,76,0.3)" }}>
              <h3 className="text-lg font-bold text-white mb-4">{flag} {state}</h3>
              <ul className="space-y-1.5">
                {cities.map((c) => (
                  <li key={c} className="text-gray-300 text-sm">{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-6 max-w-2xl mx-auto"
          style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.35)" }}
        >
          <p className="text-white font-bold text-lg mb-2">📍 Outside these states?</p>
          <p className="text-gray-300 text-sm">
            We are open to mobilizing our team for commercial projects anywhere in the United States. Submit a request and we will review your project and respond within 24 hours.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section id="contact" className="py-20" style={{ background: "#C9A84C" }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to Start Your Commercial Project?
        </h2>
        <p className="text-orange-100 mb-2">
          Contact us today for a <strong>free estimate</strong>.
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
          <Link
            href="/residential"
            className="font-bold px-8 py-4 rounded-xl text-lg border-2 border-white text-white hover:opacity-80 transition-opacity"
          >
            View Residential Services
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center text-white text-sm">
          <span>📍 WI · IL · MN · Open to Any State</span>
          <span className="hidden sm:inline">·</span>
          <span>🕐 Mon–Fri 7am–6pm</span>
        </div>
      </div>
    </section>
  );
}

export default function CommercialPage() {
  return (
    <main>
      <Hero />
      <Services />
      <OneCallSection />
      <WhoWeWorkWith />
      <WhyTayco />
      <Projects />
      <ServiceArea />
      <ContactCTA />
    </main>
  );
}
