"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50" style={{ background: "#0F2040", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.jpeg" alt="TAYCO LLC" width={44} height={44} className="rounded-full" />
            <span className="flex flex-col leading-tight">
              <span className="font-bold text-xl tracking-tight" style={{ color: "#C9A84C" }}>TAYCO LLC</span>
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">Construction &amp; ERP Suite</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/commercial"
              className="text-sm font-bold transition-colors"
              style={{ color: "#C9A84C" }}
            >
              Commercial
            </Link>
            <Link href="/residential" className="text-gray-300 hover:text-white text-sm transition-colors">Residential</Link>
            <Link href="/investor" className="text-gray-300 hover:text-white text-sm transition-colors">Investors</Link>
            <Link href="/vendor-application" className="text-gray-300 hover:text-white text-sm transition-colors">Join Our Team</Link>
            <Link
              href="/portal"
              id="nav-portal-multitenant"
              className="text-xs font-extrabold px-3.5 py-2 rounded-lg border transition-all hover:scale-105 flex items-center gap-1.5"
              style={{
                background: "rgba(201,168,76,0.14)",
                borderColor: "rgba(201,168,76,0.55)",
                color: "#F3D37A",
              }}
            >
              <span>🔐 Client &amp; Partner Portal</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                4 ERP + Takeoff
              </span>
            </Link>
            <Link
              href="/estimate"
              className="text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: "#C9A84C", color: "#0F2040" }}
            >
              Get Free Estimate
            </Link>
          </div>

          <button className="md:hidden text-white text-2xl" onClick={() => setOpen(!open)} aria-label="Toggle Menu">
            {open ? "✕" : "☰"}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-3 border-t border-white/10 pt-4">
            <Link href="/commercial" className="text-sm font-bold" style={{ color: "#C9A84C" }} onClick={() => setOpen(false)}>Commercial</Link>
            <Link href="/residential" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>Residential</Link>
            <Link href="/investor" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>Investors</Link>
            <Link href="/vendor-application" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>Join Our Team (Subcontractors)</Link>
            <Link
              href="/portal"
              className="text-sm font-bold px-4 py-2 rounded-lg border w-fit"
              style={{
                background: "rgba(201,168,76,0.15)",
                borderColor: "#C9A84C",
                color: "#C9A84C",
              }}
              onClick={() => setOpen(false)}
            >
              🔐 Client &amp; Partner Portal — Multi-Tenant ERP + Takeoff
            </Link>
            <Link
              href="/estimate"
              className="text-sm font-bold px-5 py-2 rounded-lg w-fit"
              style={{ background: "#C9A84C", color: "#0F2040" }}
              onClick={() => setOpen(false)}
            >
              Get Free Estimate
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
