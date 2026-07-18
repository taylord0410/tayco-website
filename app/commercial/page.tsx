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
          Wisconsin · Illinois · Iowa · Indiana · Minnesota · Michigan · Missouri · Texas
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
          Commercial Construction.{" "}
          <span style={{ color: "#C9A84C" }}>Done Right.</span>
        </h1>
        <p className="text-xl text-gray-300 mb-2">Full-Service Commercial General Contractor</p>
        <p className="text-gray-400 mb-8 text-lg">
          Tenant Improvements &nbsp;|&nbsp; Office Buildouts &nbsp;|&nbsp; Retail Remodels
          <br />
          Restaurant Conversions &nbsp;|&nbsp; REO Rehabs &nbsp;|&nbsp; Ground-Up Construction
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            { number: "500+", label: "Commercial Projects" },
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
      </div>
    </section>
  );
}

const COMMERCIAL_SERVICES = [
  {
    num: "01",
    title: "Commercial Roofing",
    accent: "#1B3A6B",
    items: ["TPO Roofing", "EPDM Systems", "PVC Membrane", "Modified Bitumen", "Roof Coatings", "Metal Roofing", "Roof Replacement", "Storm Damage Repair"],
  },
  {
    num: "02",
    title: "Exterior Cladding & Siding",
    accent: "#1B3A6B",
    items: ["Metal Panels", "ACM Panels", "Steel Panels", "Fiber Cement", "Insulated Panels", "Storefront Cladding", "EIFS / Stucco", "Curtain Wall Support"],
  },
  {
    num: "03",
    title: "Steel Framing",
    accent: "#1B3A6B",
    items: ["Metal Stud Framing", "Light Gauge Steel", "Structural Steel", "Load-Bearing Steel", "Interior Partitions", "Exterior Framing", "Soffit Framing", "Specialty Headers"],
  },
  {
    num: "04",
    title: "Drywall Systems",
    accent: "#1B3A6B",
    items: ["Fire-Rated Assemblies", "Shaft Liner Systems", "Acoustic Panels", "Abuse-Resistant Board", "Suspended Ceilings", "Large-Format Systems", "Level 4 & 5 Finish", "GWB Repair"],
  },
  {
    num: "05",
    title: "Concrete",
    accent: "#1B3A6B",
    items: ["Structural Concrete", "Grade Beams", "Tilt-Up Construction", "Flatwork & Slabs", "Parking Lots", "Curb & Gutter", "Site Concrete", "Concrete Repair"],
  },
  {
    num: "06",
    title: "General Construction",
    accent: "#C9A84C",
    items: ["Tenant Improvements", "Office Buildouts", "Retail Remodels", "Restaurant Conversions", "REO & Bank Rehab", "Commercial Renovations", "Unit Turnovers", "Ground-Up Builds"],
  },
  {
    num: "07",
    title: "Fire & Water Restoration",
    accent: "#DC2626",
    items: ["Emergency Board-Up", "Fire & Smoke Damage", "Structural Drying", "Water Extraction", "Mold Remediation", "Full Commercial Rebuild", "Soot Removal", "Insurance Documentation"],
  },
  {
    num: "08",
    title: "Carpentry & Millwork",
    accent: "#C9A84C",
    items: ["Rough Carpentry", "Blocking & Backing", "Structural Carpentry", "Cabinet Installation", "Custom Millwork", "Trim & Molding", "Built-In Casework", "Specialty Finishes"],
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
            12+ trades performed by our own in-house crews — no middlemen, no delays.
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
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: card.accent, opacity: 0.5 }}>
                      {card.num}
                    </span>
                    <h3 className="text-xl font-black mt-0.5 tracking-tight" style={{ color: "#0F2040" }}>
                      {card.title}
                    </h3>
                  </div>
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
    <section className="py-20 bg-white">
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

const WHY = [
  { icon: "📞", title: "ONE Point of Contact", desc: "You call one number. We handle every trade. No confusion, no delays, no finger-pointing between contractors." },
  { icon: "✅", title: "Licensed & Insured", desc: "Fully licensed and insured across 8 states. You are protected on every project." },
  { icon: "👷", title: "12+ Trades — All In-House", desc: "We self-perform 12+ trades with our own crews — drywall, framing, roofing, electrical, plumbing, HVAC, siding, carpentry, concrete, and demolition." },
  { icon: "🏗️", title: "Commercial Experience", desc: "From tenant improvements to ground-up commercial builds — we have the experience and capacity to deliver on time." },
  { icon: "🧠", title: "We Know Your Business", desc: "We work with investors, banks, and property managers every day. We understand your deadlines, budgets, and expectations." },
  { icon: "📅", title: "On Time. On Budget.", desc: "We communicate throughout every phase so you always know where things stand. No surprises." },
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
          TAYCO LLC serves commercial clients across <strong className="text-white">8 states</strong>.
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
          <span>📍 WI · IL · IA · IN · MN · MI · MO · TX</span>
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
      <WhoWeWorkWith />
      <WhyTayco />
      <Projects />
      <ServiceArea />
      <ContactCTA />
    </main>
  );
}
