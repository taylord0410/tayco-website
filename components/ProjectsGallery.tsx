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

type Project = { type: string; before?: string; after?: string; split?: string };

export default function ProjectsGallery() {
  const [selected, setSelected] = useState<Project | null>(null);

  return (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {PROJECT_TYPES.map((project) => {
          const { type, before, after, split } = project;
          return (
            <div
              key={type}
              className="rounded-2xl overflow-hidden bg-white shadow-sm border-2 cursor-pointer hover:shadow-md transition-shadow"
              style={{ borderColor: "#E2E8F0" }}
              onClick={() => setSelected(project)}
            >
              <div className="relative h-48">
                {split ? (
                  <img src={split} alt={type} className="w-full h-full object-cover" />
                ) : (
                  <div className="grid grid-cols-2 h-full">
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
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold text-sm" style={{ color: "#0F2040" }}>{type}</p>
                <p className="text-xs text-gray-400 mt-1">WI · IL · IA · IN · MN · MI · MO · TX</p>
                <p className="text-xs mt-2 font-semibold" style={{ color: "#16A34A" }}>✅ Delivered on time &amp; within budget</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.9)" }}
          onClick={() => setSelected(null)}
        >
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* Close button */}
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white text-4xl font-bold leading-none hover:text-yellow-400"
            >
              ×
            </button>

            {/* Title */}
            <p className="text-center text-white font-bold text-lg mb-4">{selected.type}</p>

            {/* Images */}
            {selected.split ? (
              <img src={selected.split} alt={selected.type} className="w-full object-contain rounded-xl" style={{ maxHeight: "80vh" }} />
            ) : (
              <div className="flex gap-3" style={{ height: "78vh" }}>
                {/* BEFORE */}
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded self-center">BEFORE</span>
                  {selected.before ? (
                    <img src={selected.before} alt="Before" className="w-full flex-1 object-cover rounded-xl min-h-0" />
                  ) : (
                    <div className="flex-1 flex items-center justify-center rounded-xl" style={{ background: "#E2E8F0" }}>
                      <span className="text-gray-500 text-sm">No image yet</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-0.5 self-stretch" style={{ background: "#C9A84C" }} />

                {/* AFTER */}
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <span className="text-xs font-bold px-3 py-1 rounded self-center" style={{ background: "#C9A84C", color: "#0F2040" }}>AFTER</span>
                  {selected.after ? (
                    <img src={selected.after} alt="After" className="w-full flex-1 object-cover rounded-xl min-h-0" />
                  ) : (
                    <div className="flex-1 flex items-center justify-center rounded-xl" style={{ background: "#DBEAFE" }}>
                      <span className="text-sm font-semibold" style={{ color: "#1B3A6B" }}>No image yet</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
