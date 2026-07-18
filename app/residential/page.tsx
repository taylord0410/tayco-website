import Link from "next/link";
import ProjectsGallery from "@/components/ProjectsGallery";

function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-16"
      style={{ background: "linear-gradient(135deg, #1B3A6B 0%, #0F2040 60%, #1B3A6B 100%)" }}
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
          Residential Division
        </p>
        <p className="text-xs uppercase tracking-widest mb-6 text-gray-400">
          Wisconsin · Illinois · Iowa · Indiana · Minnesota · Michigan · Missouri · Texas
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
          Your Home.{" "}
          <span style={{ color: "#C9A84C" }}>Our Priority.</span>
        </h1>
        <p className="text-xl text-gray-300 mb-2">Full-Service Residential General Contractor</p>
        <p className="text-gray-400 mb-8 text-lg">
          Home Renovations &nbsp;|&nbsp; Kitchen & Bath Remodels &nbsp;|&nbsp; Additions
          <br />
          Basement Finishing &nbsp;|&nbsp; Fire & Water Restoration &nbsp;|&nbsp; Property Rehab
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
            href="/commercial"
            className="font-bold px-8 py-4 rounded-xl text-lg border-2 text-white hover:opacity-80 transition-opacity"
            style={{ borderColor: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.07)" }}
          >
            View Commercial →
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { number: "2,300+", label: "Homes Renovated" },
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

const RESIDENTIAL_SERVICES = [
  {
    num: "01",
    title: "Roofing",
    accent: "#1B3A6B",
    items: ["Asphalt Shingles", "Metal Roofing", "Cedar Shake", "Slate & Tile", "Soffit & Fascia", "Gutters & Downspouts", "Roof Repair", "Storm Damage"],
  },
  {
    num: "02",
    title: "Siding",
    accent: "#1B3A6B",
    items: ["Vinyl Siding", "Fiber Cement", "James Hardie", "Engineered Wood", "Cedar Siding", "Aluminum Siding", "Composite", "Soffit & Fascia"],
  },
  {
    num: "03",
    title: "Framing",
    accent: "#1B3A6B",
    items: ["Platform Framing", "Balloon Framing", "Timber / Post & Beam", "Roof Framing", "Floor Systems", "Wall Framing", "Stair Framing", "Structural Headers"],
  },
  {
    num: "04",
    title: "Drywall",
    accent: "#1B3A6B",
    items: ["Standard Drywall", "Moisture-Resistant", "Soundboard", "Fire-Rated Type X", "Textured Finish", "Smooth Finish", "Repair & Patching", "Level 4 Finish"],
  },
  {
    num: "05",
    title: "Carpentry",
    accent: "#C9A84C",
    items: ["Kitchen Cabinetry", "Bathroom Vanities", "Trim & Molding", "Crown Molding", "Wainscoting", "Built-In Shelving", "Custom Millwork", "Stair Finishing"],
  },
  {
    num: "06",
    title: "Concrete",
    accent: "#1B3A6B",
    items: ["Foundations", "Basement Slabs", "Driveways", "Patios & Walkways", "Decorative Concrete", "Garage Slabs", "Steps & Stoops", "Concrete Repair"],
  },
  {
    num: "07",
    title: "Fire & Water Restoration",
    accent: "#DC2626",
    items: ["Water Extraction", "Structural Drying", "Flood Damage", "Pipe Burst Repair", "Fire & Smoke Damage", "Soot Removal", "Mold Remediation", "Full Home Rebuild"],
  },
  {
    num: "08",
    title: "General Renovation",
    accent: "#C9A84C",
    items: ["Kitchen Remodeling", "Bathroom Remodeling", "Home Additions", "Basement Finishing", "Full Home Renovation", "Property Rehab", "Unit Turnovers", "REO Cleanout & Repair"],
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
            Every Trade for Your Home.
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            12+ trades performed by our own in-house crews — no middlemen, no delays.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {RESIDENTIAL_SERVICES.map((card) => (
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
            TAYCO LLC is professionally certified in both Water &amp; Fire Damage Restoration — protecting your home and your family from start to finish.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div className="rounded-2xl p-8 border-2 text-left" style={{ borderColor: "#C9A84C", background: "rgba(201,168,76,0.07)" }}>
            <div className="text-6xl mb-4">🔥</div>
            <div className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 uppercase tracking-wider" style={{ background: "#C9A84C", color: "#0F2040" }}>
              Certified Contractor
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Fire Damage Restoration</h3>
            <ul className="space-y-2">
              {["Fire & smoke damage assessment", "Structural damage evaluation", "Smoke & soot remediation", "Full interior rebuild post-fire", "Insurance documentation support"].map((item) => (
                <li key={item} className="text-sm text-gray-300 flex items-start gap-2">
                  <span style={{ color: "#C9A84C" }}>✔</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-8 border-2 text-left" style={{ borderColor: "#C9A84C", background: "rgba(201,168,76,0.07)" }}>
            <div className="text-6xl mb-4">💧</div>
            <div className="inline-block px-4 py-1 rounded-full text-sm font-bold mb-4 uppercase tracking-wider" style={{ background: "#C9A84C", color: "#0F2040" }}>
              Certified Contractor
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Water Damage Restoration</h3>
            <ul className="space-y-2">
              {["Water damage inspection & assessment", "Flood & leak damage repair", "Moisture detection & structural drying", "Mold remediation coordination", "Full home restoration to pre-loss condition"].map((item) => (
                <li key={item} className="text-sm text-gray-300 flex items-start gap-2">
                  <span style={{ color: "#C9A84C" }}>✔</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const CLIENTS = [
  { icon: "🏠", title: "Homeowners", desc: "Full home renovations, room additions, kitchen and bathroom remodels, and restoration work — all under one roof." },
  { icon: "💼", title: "Real Estate Investors", desc: "Turnkey rehabs for flips and rentals. We maximize your ROI with quality finishes delivered on schedule." },
  { icon: "🏘️", title: "Property Managers", desc: "Fast, reliable unit turnovers and capital improvement projects. One call covers every trade." },
  { icon: "🏦", title: "Banks & Lenders", desc: "REO residential property repairs, cleanouts, and full rehabs. We meet your timelines and compliance requirements." },
  { icon: "📈", title: "Private Investors", desc: "Complete residential renovations tailored to your investment strategy — from small rehabs to full rebuilds." },
  { icon: "🔥", title: "Insurance Claims", desc: "Certified restoration contractors who work directly with insurance adjusters to document and restore your property." },
];

function WhoWeWorkWith() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
            Our Residential Clients
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

const WHY = [
  { icon: "📞", title: "ONE Point of Contact", desc: "You call one number. We handle every trade. No confusion, no delays, no finger-pointing between contractors." },
  { icon: "✅", title: "Licensed & Insured", desc: "Fully licensed and insured across 8 states. You are protected on every project." },
  { icon: "🏅", title: "Certified Restoration", desc: "Licensed for water and fire damage restoration — protecting your home from day one to final walkthrough." },
  { icon: "👷", title: "12+ Trades In-House", desc: "We self-perform 12+ trades with our own crews — drywall, flooring, painting, framing, roofing, electrical, plumbing, and more." },
  { icon: "🏠", title: "Your Home, Our Priority", desc: "We treat every home like our own — with respect, cleanliness, and craftsmanship on every project." },
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
            The Easiest Decision You Will Make for Your Home.
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
          <p className="text-gray-500 mt-2">Before &amp; After — Real Residential Projects</p>
        </div>
        <ProjectsGallery />
        <p className="text-center text-sm text-gray-400 mt-8 italic">
          Photos coming soon. Contact us to request a residential portfolio.
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
          TAYCO LLC serves homeowners and investors across <strong className="text-white">8 states</strong>.
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
          Ready to Start Your Home Project?
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
            href="/commercial"
            className="font-bold px-8 py-4 rounded-xl text-lg border-2 border-white text-white hover:opacity-80 transition-opacity"
          >
            View Commercial Services
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

export default function ResidentialPage() {
  return (
    <main>
      <Hero />
      <Services />
      <Certifications />
      <WhoWeWorkWith />
      <WhyTayco />
      <Projects />
      <ServiceArea />
      <ContactCTA />
    </main>
  );
}
