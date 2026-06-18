"use client";
import { useState } from "react";

const PROJECT_TYPES: { type: string; before?: string; after?: string; split?: string }[] = [
  { type: "Full Home Renovation — Residential", before: "/renovation-before.png", after: "/renovation-after.png" },
  { type: "Turnkey Rehab — Real Estate Investor", before: "/turnkey-before.png", after: "/turnkey-after.png" },
  { type: "REO Property Restoration — Bank Owned", split: "/reo.png" },
  { type: "Water Damage Restoration", split: "/water-damage.png" },
  { type: "Fire Damage Restoration", before: "/fire-damage-before.png", after: "/fire-damage-after.png" },
  { type: "Commercial Renovation / Tenant Improvement", split: "/commercial.png" },
];

export default function ProjectsGallery() {
  const [lightbox, setLightbox] = useState<{ src: string; label: string } | null>(null);

  const open = (src: string, label: string) => setLightbox({ src, label });
  const close = () => setLightbox(null);

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PROJECT_TYPES.map(({ type, before, after, split }) => (
          <div key={type} className="rounded-2xl overflow-hidden bg-white shadow-sm border-2" style={{ borderColor: "#E2E8F0" }}>
            <div className="relative h-48">
              {split ? (
                <img
                  src={split}
                  alt={type}
                  className="w-full h-full object-cover cursor-zoom-in"
                  onClick={() => open(split, type)}
                />
              ) : (
                <div className="grid grid-cols-2 h-full">
                  <div className="relative border-r overflow-hidden" style={{ borderColor: "#CBD5E1" }}>
                    {before ? (
                      <>
                        <img
                          src={before}
                          alt="Before"
                          className="w-full h-full object-cover cursor-zoom-in"
                          onClick={() => open(before, `${type} — Before`)}
                        />
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded pointer-events-none">BEFORE</span>
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
                        <img
                          src={after}
                          alt="After"
                          className="w-full h-full object-cover cursor-zoom-in"
                          onClick={() => open(after, `${type} — After`)}
                        />
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded pointer-events-none" style={{ background: "#C9A84C", color: "#0F2040" }}>AFTER</span>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-1 h-full" style={{ background: "#DBEAFE" }}>
                        <span className="text-3xl">🏠</span>
                        <span className="text-xs font-semibold" style={{ color: "#1B3A6B" }}>AFTER</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="font-semibold text-sm" style={{ color: "#0F2040" }}>{type}</p>
              <p className="text-xs text-gray-400 mt-1">WI · IL · IA · IN · MN · MI · MO · TX</p>
              <p className="text-xs mt-2 font-semibold" style={{ color: "#16A34A" }}>✅ Delivered on time &amp; within budget</p>
            </div>
          </div>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={close}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={close}
              className="absolute -top-10 right-0 text-white text-3xl font-bold leading-none"
              aria-label="Close"
            >
              ×
            </button>
            <img
              src={lightbox.src}
              alt={lightbox.label}
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            <p className="text-center text-white text-sm mt-3 font-semibold">{lightbox.label}</p>
          </div>
        </div>
      )}
    </>
  );
}
