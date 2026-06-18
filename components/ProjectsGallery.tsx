"use client";
import { useState, useRef, useCallback } from "react";

const PROJECT_TYPES: { type: string; before?: string; after?: string; split?: string }[] = [
  { type: "Full Home Renovation — Residential", before: "/renovation-before.png", after: "/renovation-after.png" },
  { type: "Turnkey Rehab — Real Estate Investor", before: "/turnkey-before.png", after: "/turnkey-after.png" },
  { type: "REO Property Restoration — Bank Owned", split: "/reo.png" },
  { type: "Water Damage Restoration", split: "/water-damage.png" },
  { type: "Fire Damage Restoration", before: "/fire-damage-before.png", after: "/fire-damage-after.png" },
  { type: "Commercial Renovation / Tenant Improvement", split: "/commercial.png" },
];

function BeforeAfterSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePos = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden cursor-col-resize"
      onMouseDown={(e) => { dragging.current = true; updatePos(e.clientX); }}
      onMouseMove={(e) => { if (dragging.current) updatePos(e.clientX); }}
      onMouseUp={() => { dragging.current = false; }}
      onMouseLeave={() => { dragging.current = false; }}
      onTouchStart={(e) => { dragging.current = true; updatePos(e.touches[0].clientX); }}
      onTouchMove={(e) => { if (dragging.current) updatePos(e.touches[0].clientX); }}
      onTouchEnd={() => { dragging.current = false; }}
    >
      {/* AFTER — full background */}
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />

      {/* BEFORE — clipped to left side */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: containerRef.current?.offsetWidth ?? "100%" }} />
      </div>

      {/* Divider line */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${pos}%`, transform: "translateX(-50%)" }}>
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center" style={{ border: "2px solid #C9A84C" }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M5 8H1M1 8L3 6M1 8L3 10M11 8H15M15 8L13 6M15 8L13 10" stroke="#0F2040" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <span className="absolute bottom-2 left-2 text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded pointer-events-none">BEFORE</span>
      <span className="absolute bottom-2 right-2 text-xs font-bold px-2 py-0.5 rounded pointer-events-none" style={{ background: "#C9A84C", color: "#0F2040" }}>AFTER</span>
    </div>
  );
}

export default function ProjectsGallery() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {PROJECT_TYPES.map(({ type, before, after, split }) => (
        <div key={type} className="rounded-2xl overflow-hidden bg-white shadow-sm border-2" style={{ borderColor: "#E2E8F0" }}>
          <div className="relative h-48">
            {split ? (
              <img src={split} alt={type} className="w-full h-full object-cover" />
            ) : before && after ? (
              <BeforeAfterSlider before={before} after={after} />
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 h-full" style={{ background: "#E2E8F0" }}>
                <span className="text-3xl">📷</span>
                <span className="text-xs font-semibold text-gray-500">Coming Soon</span>
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
  );
}
