"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const TRADES = [
  "Framing", "Drywall", "Flooring", "Painting", "Roofing", "Siding",
  "Electrical", "Plumbing", "Carpentry", "Concrete", "Demolition",
  "Solar Panels", "Cleaning", "HVAC", "Insulation", "Windows & Doors",
  "Gutters & Drainage", "Interior", "Exterior",
  "Water Damage Restoration", "Fire Damage Restoration", "Other",
];

const STATES = ["Wisconsin", "Illinois", "Both (WI & IL)"];

const T = {
  en: {
    badge: "Join Our Team",
    title: "Vendor / Subcontractor Application",
    subtitle: "We are always looking for qualified trades to join our network. Fill out the form below and our team will review your application.",
    successTitle: "Application Submitted!",
    successMsg: "Thank you for applying. Our team will review your application and contact you within 2-3 business days.",
    backHome: "Back to Home",
    sectionBusiness: "Business Information",
    businessName: "Business Name",
    contactName: "Contact Name",
    phone: "Phone",
    email: "Email",
    licenseNumber: "License Number",
    licensePlaceholder: "State license # (if applicable)",
    yearsInBusiness: "Years in Business",
    yearsPlaceholder: "e.g. 5",
    crewSize: "Crew Size",
    crewPlaceholder: "e.g. 4 people",
    insured: "Insured?",
    insuredSelect: "Select...",
    insuredYes: "Yes — I have liability insurance",
    insuredNo: "No",
    sectionArea: "Service Area",
    statesServed: "States You Serve",
    statesSelect: "Select...",
    citiesServed: "Cities / Areas You Cover",
    citiesPlaceholder: "e.g. Milwaukee, Kenosha, Racine",
    sectionTrades: "Trades / Services Offered",
    tradesNote: "(select all that apply)",
    tradesAlert: "Please select at least one trade.",
    notes: "Additional Notes",
    notesPlaceholder: "Any additional information about your business, certifications, equipment, etc.",
    submit: "Submit Application",
    submitting: "Submitting...",
    footer: "We review all applications and respond within 2-3 business days.",
    errorFallback: "Something went wrong. Please try again.",
  },
  es: {
    badge: "Únete a Nuestro Equipo",
    title: "Aplicación de Vendedor / Subcontratista",
    subtitle: "Siempre estamos buscando contratistas calificados para unirse a nuestra red. Llena el formulario y nuestro equipo revisará tu aplicación.",
    successTitle: "¡Aplicación Enviada!",
    successMsg: "Gracias por aplicar. Nuestro equipo revisará tu aplicación y se comunicará contigo en 2-3 días hábiles.",
    backHome: "Volver al Inicio",
    sectionBusiness: "Información del Negocio",
    businessName: "Nombre del Negocio",
    contactName: "Nombre de Contacto",
    phone: "Teléfono",
    email: "Correo Electrónico",
    licenseNumber: "Número de Licencia",
    licensePlaceholder: "Licencia estatal (si aplica)",
    yearsInBusiness: "Años en el Negocio",
    yearsPlaceholder: "ej. 5",
    crewSize: "Tamaño del Equipo",
    crewPlaceholder: "ej. 4 personas",
    insured: "¿Tienes Seguro?",
    insuredSelect: "Seleccionar...",
    insuredYes: "Sí — Tengo seguro de responsabilidad",
    insuredNo: "No",
    sectionArea: "Área de Servicio",
    statesServed: "Estados en los que Trabajas",
    statesSelect: "Seleccionar...",
    citiesServed: "Ciudades / Áreas que Cubres",
    citiesPlaceholder: "ej. Milwaukee, Kenosha, Racine",
    sectionTrades: "Oficios / Servicios que Ofreces",
    tradesNote: "(selecciona todos los que apliquen)",
    tradesAlert: "Por favor selecciona al menos un oficio.",
    notes: "Notas Adicionales",
    notesPlaceholder: "Cualquier información adicional sobre tu negocio, certificaciones, equipo, etc.",
    submit: "Enviar Aplicación",
    submitting: "Enviando...",
    footer: "Revisamos todas las aplicaciones y respondemos en 2-3 días hábiles.",
    errorFallback: "Algo salió mal. Por favor intenta de nuevo.",
  },
};

export default function VendorApplicationPage() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const t = T[lang];

  const [form, setForm] = useState({
    businessName: "", contactName: "", phone: "", email: "",
    licenseNumber: "", yearsInBusiness: "", crewSize: "",
    citiesServed: "", stateServed: "", insured: "", notes: "",
    website: "", // honeypot
  });
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const loadedAt = useRef<number | null>(null);
  useEffect(() => { loadedAt.current = Date.now(); }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function toggleTrade(trade: string) {
    setSelectedTrades((prev) =>
      prev.includes(trade) ? prev.filter((x) => x !== trade) : [...prev, trade]
    );
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (selectedTrades.length === 0) {
      alert(t.tradesAlert);
      return;
    }
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, trades: selectedTrades.join(", "), _loadedAt: loadedAt.current }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.message || t.errorFallback);
        setStatus("error");
      }
    } catch {
      setErrorMsg(t.errorFallback);
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen pt-20" style={{ background: "#F8FAFC" }}>
      {/* Header */}
      <div className="py-12" style={{ background: "#0F2040" }}>
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>
            {t.badge}
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{t.title}</h1>
          <p className="text-gray-300">{t.subtitle}</p>

          {/* Language toggle */}
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setLang("en")}
              className="px-5 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: lang === "en" ? "#C9A84C" : "rgba(255,255,255,0.1)",
                color: lang === "en" ? "#0F2040" : "white",
                border: lang === "en" ? "2px solid #C9A84C" : "2px solid rgba(255,255,255,0.3)",
              }}
            >
              🇺🇸 English
            </button>
            <button
              onClick={() => setLang("es")}
              className="px-5 py-2 rounded-lg font-semibold text-sm transition-all"
              style={{
                background: lang === "es" ? "#C9A84C" : "rgba(255,255,255,0.1)",
                color: lang === "es" ? "#0F2040" : "white",
                border: lang === "es" ? "2px solid #C9A84C" : "2px solid rgba(255,255,255,0.3)",
              }}
            >
              🇲🇽 Español
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {status === "success" ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border-2" style={{ borderColor: "#16A34A" }}>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>{t.successTitle}</h2>
            <p className="text-gray-500 mb-6">{t.successMsg}</p>
            <Link href="/" className="text-white font-semibold px-6 py-3 rounded-xl" style={{ background: "#C9A84C" }}>
              {t.backHome}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border-2 p-8 space-y-6" style={{ borderColor: "#E2E8F0" }}>
            {/* Honeypot */}
            <div style={{ display: "none" }} aria-hidden="true">
              <input name="website" value={form.website} onChange={handleChange} tabIndex={-1} autoComplete="off" />
            </div>

            {/* Business Info */}
            <div>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>
                {t.sectionBusiness}
              </h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      {t.businessName} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input name="businessName" value={form.businessName} onChange={handleChange} required
                      placeholder="Your Company LLC" className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      {t.contactName} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input name="contactName" value={form.contactName} onChange={handleChange} required
                      placeholder="John Smith" className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      {t.phone} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input name="phone" value={form.phone} onChange={handleChange} required
                      placeholder="(414) 000-0000" className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      {t.email} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required
                      placeholder="you@email.com" className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.licenseNumber}</label>
                    <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange}
                      placeholder={t.licensePlaceholder} className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      {t.yearsInBusiness} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input name="yearsInBusiness" value={form.yearsInBusiness} onChange={handleChange} required
                      placeholder={t.yearsPlaceholder} className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      {t.crewSize} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <input name="crewSize" value={form.crewSize} onChange={handleChange} required
                      placeholder={t.crewPlaceholder} className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                      {t.insured} <span style={{ color: "#C9A84C" }}>*</span>
                    </label>
                    <select name="insured" value={form.insured} onChange={handleChange} required
                      className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                      <option value="">{t.insuredSelect}</option>
                      <option value="Yes">{t.insuredYes}</option>
                      <option value="No">{t.insuredNo}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Area */}
            <div>
              <h2 className="text-lg font-bold mb-4 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>
                {t.sectionArea}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                    {t.statesServed} <span style={{ color: "#C9A84C" }}>*</span>
                  </label>
                  <select name="stateServed" value={form.stateServed} onChange={handleChange} required
                    className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">{t.statesSelect}</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>
                    {t.citiesServed} <span style={{ color: "#C9A84C" }}>*</span>
                  </label>
                  <input name="citiesServed" value={form.citiesServed} onChange={handleChange} required
                    placeholder={t.citiesPlaceholder} className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                </div>
              </div>
            </div>

            {/* Trades */}
            <div>
              <h2 className="text-lg font-bold mb-2 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>
                {t.sectionTrades} <span className="text-sm font-normal text-gray-400">{t.tradesNote}</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                {TRADES.map((trade) => (
                  <button key={trade} type="button" onClick={() => toggleTrade(trade)}
                    className="text-left text-xs px-3 py-2 rounded-lg border-2 font-medium transition-colors"
                    style={{
                      borderColor: selectedTrades.includes(trade) ? "#C9A84C" : "#E2E8F0",
                      background: selectedTrades.includes(trade) ? "#FFF7ED" : "white",
                      color: selectedTrades.includes(trade) ? "#C9A84C" : "#374151",
                    }}>
                    {selectedTrades.includes(trade) ? "✔ " : ""}{trade}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.notes}</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                placeholder={t.notesPlaceholder}
                className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none" style={{ borderColor: "#E2E8F0" }} />
            </div>

            {status === "error" && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
                {errorMsg}
              </div>
            )}

            <button type="submit" disabled={status === "sending"}
              className="w-full text-white font-bold py-3 rounded-xl text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#C9A84C" }}>
              {status === "sending" ? t.submitting : t.submit}
            </button>

            <p className="text-center text-xs text-gray-400">{t.footer}</p>
          </form>
        )}
      </div>
    </main>
  );
}
