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
    successPending: "Your application was received. Your documents are still pending — you can upload them anytime by returning to this page.",
    backHome: "Back to Home",
    uploadDocs: "Upload Documents Later",
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
    sectionDocs: "Required Documents",
    docsIntro: "Please upload your W9 and Certificate of Insurance. If you do not have them ready, you can submit your application now and upload the documents later.",
    w9Label: "W9 Form",
    w9Desc: "Federal tax form required for all subcontractors.",
    insuranceLabel: "Certificate of Insurance (COI)",
    insuranceDesc: "Your insurance certificate must list TAYCO LLC as the Certificate Holder:",
    holderInfo: "TAYCO LLC\n2829 West Wisconsin Ave\nMilwaukee, WI 53208",
    insuranceReq1: "General Liability Insurance required",
    insuranceReq2: "TAYCO LLC must be listed as Certificate Holder",
    insuranceReq3: "Address: 2829 West Wisconsin Ave, Milwaukee, WI 53208",
    uploadBtn: "Choose File",
    uploaded: "File uploaded ✔",
    uploading: "Uploading...",
    uploadError: "Upload failed. Try again.",
    skipDocs: "I don't have my documents ready — I will upload them later",
    notes: "Additional Notes",
    notesPlaceholder: "Any additional information about your business, certifications, equipment, etc.",
    submit: "Submit Application",
    submitting: "Submitting...",
    footer: "We review all applications and respond within 2-3 business days.",
    errorFallback: "Something went wrong. Please try again.",
    fileTypes: "PDF, JPG or PNG — max 10MB",
  },
  es: {
    badge: "Únete a Nuestro Equipo",
    title: "Aplicación de Vendedor / Subcontratista",
    subtitle: "Siempre estamos buscando contratistas calificados para unirse a nuestra red. Llena el formulario y nuestro equipo revisará tu aplicación.",
    successTitle: "¡Aplicación Enviada!",
    successMsg: "Gracias por aplicar. Nuestro equipo revisará tu aplicación y se comunicará contigo en 2-3 días hábiles.",
    successPending: "Tu aplicación fue recibida. Tus documentos aún están pendientes — puedes subirlos en cualquier momento regresando a esta página.",
    backHome: "Volver al Inicio",
    uploadDocs: "Subir Documentos Después",
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
    sectionDocs: "Documentos Requeridos",
    docsIntro: "Por favor sube tu W9 y Certificado de Seguro. Si no los tienes listos, puedes enviar tu aplicación ahora y subir los documentos después.",
    w9Label: "Formulario W9",
    w9Desc: "Formulario federal de impuestos requerido para todos los subcontratistas.",
    insuranceLabel: "Certificado de Seguro (COI)",
    insuranceDesc: "Tu certificado de seguro debe indicar a TAYCO LLC como Certificate Holder (Titular del Certificado):",
    holderInfo: "TAYCO LLC\n2829 West Wisconsin Ave\nMilwaukee, WI 53208",
    insuranceReq1: "Se requiere Seguro de Responsabilidad General",
    insuranceReq2: "TAYCO LLC debe estar indicado como Certificate Holder",
    insuranceReq3: "Dirección: 2829 West Wisconsin Ave, Milwaukee, WI 53208",
    uploadBtn: "Elegir Archivo",
    uploaded: "Archivo subido ✔",
    uploading: "Subiendo...",
    uploadError: "Error al subir. Intenta de nuevo.",
    skipDocs: "No tengo mis documentos listos — los subiré después",
    notes: "Notas Adicionales",
    notesPlaceholder: "Cualquier información adicional sobre tu negocio, certificaciones, equipo, etc.",
    submit: "Enviar Aplicación",
    submitting: "Enviando...",
    footer: "Revisamos todas las aplicaciones y respondemos en 2-3 días hábiles.",
    errorFallback: "Algo salió mal. Por favor intenta de nuevo.",
    fileTypes: "PDF, JPG o PNG — máx 10MB",
  },
};

type UploadState = "idle" | "uploading" | "done" | "error";

function FileUploadField({
  label, desc, extra, docType, t,
  onUploaded,
}: {
  label: string; desc: string; extra?: React.ReactNode; docType: string;
  t: typeof T["en"]; onUploaded: (url: string) => void;
}) {
  const [state, setState] = useState<UploadState>("idle");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setState("uploading");
    setFileName(file.name);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);
    try {
      const res = await fetch("/api/upload-doc", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setState("done");
        onUploaded(data.url);
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-xl border-2 p-5" style={{ borderColor: state === "done" ? "#16A34A" : "#E2E8F0", background: state === "done" ? "#F0FDF4" : "white" }}>
      <p className="font-semibold text-sm mb-1" style={{ color: "#0F2040" }}>{label}</p>
      <p className="text-xs text-gray-500 mb-2">{desc}</p>
      {extra}
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
      {state === "done" ? (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-green-700 text-sm font-semibold">{t.uploaded}</span>
          <span className="text-xs text-gray-400 truncate max-w-[180px]">{fileName}</span>
          <button type="button" onClick={() => { setState("idle"); setFileName(""); onUploaded(""); }}
            className="text-xs text-gray-400 underline ml-auto">✕</button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mt-2">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={state === "uploading"}
            className="text-sm font-semibold px-4 py-2 rounded-lg border-2 transition-colors disabled:opacity-50"
            style={{ borderColor: "#C9A84C", color: "#C9A84C", background: "white" }}>
            {state === "uploading" ? t.uploading : t.uploadBtn}
          </button>
          <span className="text-xs text-gray-400">{t.fileTypes}</span>
        </div>
      )}
      {state === "error" && <p className="text-red-500 text-xs mt-1">{t.uploadError}</p>}
    </div>
  );
}

export default function VendorApplicationPage() {
  const [lang, setLang] = useState<"en" | "es">("en");
  const t = T[lang];

  const [form, setForm] = useState({
    businessName: "", contactName: "", phone: "", email: "",
    licenseNumber: "", yearsInBusiness: "", crewSize: "",
    citiesServed: "", stateServed: "", insured: "", notes: "",
    website: "",
  });
  const [selectedTrades, setSelectedTrades] = useState<string[]>([]);
  const [w9Url, setW9Url] = useState("");
  const [insuranceUrl, setInsuranceUrl] = useState("");
  const [skipDocs, setSkipDocs] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [docsPending, setDocsPending] = useState(false);
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
    if (selectedTrades.length === 0) { alert(t.tradesAlert); return; }
    setStatus("sending");
    setErrorMsg("");
    const pending = skipDocs || (!w9Url && !insuranceUrl);
    setDocsPending(pending);
    try {
      const res = await fetch("/api/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, trades: selectedTrades.join(", "),
          w9Url, insuranceUrl, docsPending: pending,
          _loadedAt: loadedAt.current,
        }),
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
          <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: "#C9A84C" }}>{t.badge}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{t.title}</h1>
          <p className="text-gray-300">{t.subtitle}</p>
          <div className="flex justify-center gap-3 mt-6">
            {(["en", "es"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className="px-5 py-2 rounded-lg font-semibold text-sm transition-all"
                style={{
                  background: lang === l ? "#C9A84C" : "rgba(255,255,255,0.1)",
                  color: lang === l ? "#0F2040" : "white",
                  border: lang === l ? "2px solid #C9A84C" : "2px solid rgba(255,255,255,0.3)",
                }}>
                {l === "en" ? "🇺🇸 English" : "🇲🇽 Español"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {status === "success" ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border-2" style={{ borderColor: "#16A34A" }}>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#0F2040" }}>{t.successTitle}</h2>
            <p className="text-gray-500 mb-4">{t.successMsg}</p>
            {docsPending && (
              <div className="mx-auto max-w-sm rounded-xl px-5 py-4 mb-6 text-sm" style={{ background: "#FFF7ED", border: "2px solid #C9A84C" }}>
                <p className="font-semibold mb-1" style={{ color: "#C9A84C" }}>📄 {t.uploadDocs}</p>
                <p className="text-gray-600 text-xs">{t.successPending}</p>
                <Link href="/vendor-application" className="block mt-3 text-xs font-semibold underline" style={{ color: "#C9A84C" }}>
                  → {lang === "en" ? "Return here to upload documents" : "Regresa aquí para subir tus documentos"}
                </Link>
              </div>
            )}
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
              <h2 className="text-lg font-bold mb-4 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>{t.sectionBusiness}</h2>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.businessName} <span style={{ color: "#C9A84C" }}>*</span></label>
                    <input name="businessName" value={form.businessName} onChange={handleChange} required placeholder="Your Company LLC" className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.contactName} <span style={{ color: "#C9A84C" }}>*</span></label>
                    <input name="contactName" value={form.contactName} onChange={handleChange} required placeholder="John Smith" className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.phone} <span style={{ color: "#C9A84C" }}>*</span></label>
                    <input name="phone" value={form.phone} onChange={handleChange} required placeholder="(414) 000-0000" className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.email} <span style={{ color: "#C9A84C" }}>*</span></label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="you@email.com" className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.licenseNumber}</label>
                    <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} placeholder={t.licensePlaceholder} className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.yearsInBusiness} <span style={{ color: "#C9A84C" }}>*</span></label>
                    <input name="yearsInBusiness" value={form.yearsInBusiness} onChange={handleChange} required placeholder={t.yearsPlaceholder} className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.crewSize} <span style={{ color: "#C9A84C" }}>*</span></label>
                    <input name="crewSize" value={form.crewSize} onChange={handleChange} required placeholder={t.crewPlaceholder} className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.insured} <span style={{ color: "#C9A84C" }}>*</span></label>
                    <select name="insured" value={form.insured} onChange={handleChange} required className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
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
              <h2 className="text-lg font-bold mb-4 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>{t.sectionArea}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.statesServed} <span style={{ color: "#C9A84C" }}>*</span></label>
                  <select name="stateServed" value={form.stateServed} onChange={handleChange} required className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-white" style={{ borderColor: "#E2E8F0" }}>
                    <option value="">{t.statesSelect}</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.citiesServed} <span style={{ color: "#C9A84C" }}>*</span></label>
                  <input name="citiesServed" value={form.citiesServed} onChange={handleChange} required placeholder={t.citiesPlaceholder} className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none" style={{ borderColor: "#E2E8F0" }} />
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

            {/* Documents */}
            <div>
              <h2 className="text-lg font-bold mb-1 pb-2 border-b-2" style={{ color: "#0F2040", borderColor: "#E2E8F0" }}>{t.sectionDocs}</h2>
              <p className="text-sm text-gray-500 mb-4">{t.docsIntro}</p>

              {!skipDocs && (
                <div className="space-y-4">
                  <FileUploadField label={t.w9Label} desc={t.w9Desc} docType="w9" t={t} onUploaded={setW9Url} />

                  <FileUploadField
                    label={t.insuranceLabel}
                    desc={t.insuranceDesc}
                    docType="insurance"
                    t={t}
                    onUploaded={setInsuranceUrl}
                    extra={
                      <div className="rounded-lg px-4 py-3 mb-3 text-xs" style={{ background: "#F0F9FF", border: "1px solid #BAE6FD" }}>
                        <p className="font-bold mb-1" style={{ color: "#0F2040" }}>Certificate Holder / Titular del Certificado:</p>
                        <pre className="font-semibold whitespace-pre-wrap" style={{ color: "#1B3A6B", fontFamily: "inherit" }}>{t.holderInfo}</pre>
                        <ul className="mt-2 space-y-1 text-gray-600">
                          <li>✔ {t.insuranceReq1}</li>
                          <li>✔ {t.insuranceReq2}</li>
                          <li>✔ {t.insuranceReq3}</li>
                        </ul>
                      </div>
                    }
                  />
                </div>
              )}

              <label className="flex items-start gap-3 mt-4 cursor-pointer">
                <input type="checkbox" checked={skipDocs} onChange={(e) => setSkipDocs(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-yellow-500" />
                <span className="text-sm text-gray-600">{t.skipDocs}</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold mb-1" style={{ color: "#0F2040" }}>{t.notes}</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                placeholder={t.notesPlaceholder}
                className="w-full border-2 rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none" style={{ borderColor: "#E2E8F0" }} />
            </div>

            {status === "error" && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">{errorMsg}</div>
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
