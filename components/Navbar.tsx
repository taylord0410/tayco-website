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
              <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider">General Contractor</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="#services" className="text-gray-300 hover:text-white text-sm transition-colors">Services</Link>
            <Link href="#about" className="text-gray-300 hover:text-white text-sm transition-colors">About</Link>
            <Link href="#projects" className="text-gray-300 hover:text-white text-sm transition-colors">Projects</Link>
            <Link href="#service-area" className="text-gray-300 hover:text-white text-sm transition-colors">Service Area</Link>
            <Link href="#contact" className="text-gray-300 hover:text-white text-sm transition-colors">Contact</Link>
            <Link href="/vendor-application" className="text-gray-300 hover:text-white text-sm transition-colors">Join Our Team</Link>
            <Link
              href="/estimate"
              className="text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
              style={{ background: "#C9A84C" }}
            >
              Get Free Estimate
            </Link>
          </div>

          <button className="md:hidden text-white text-2xl" onClick={() => setOpen(!open)}>
            {open ? "✕" : "☰"}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-4 border-t border-white/10 pt-4">
            <Link href="#services" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>Services</Link>
            <Link href="#about" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>About</Link>
            <Link href="#projects" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>Projects</Link>
            <Link href="#service-area" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>Service Area</Link>
            <Link href="#contact" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>Contact</Link>
            <Link href="/vendor-application" className="text-gray-300 text-sm" onClick={() => setOpen(false)}>Join Our Team</Link>
            <Link
              href="/estimate"
              className="text-white text-sm font-semibold px-5 py-2 rounded-lg w-fit"
              style={{ background: "#C9A84C" }}
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
