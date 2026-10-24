"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPANY } from "@/lib/company";

const links = [
  { href: "/commercial", label: "Commercial" },
  { href: "/residential", label: "Residential" },
  { href: "/investor", label: "Investors" },
  { href: "/vendor-application", label: "Trade partners" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const workspace = authenticated || pathname === '/portal' || pathname === '/account';
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/auth/session', { cache: 'no-store', signal: controller.signal })
      .then(response => { if (!controller.signal.aborted) setAuthenticated(response.ok); })
      .catch(() => { if (!controller.signal.aborted) setAuthenticated(false); });
    return () => controller.abort();
  }, [pathname]);

  useEffect(() => {
    const readMotion = () => {
      try {
        setMotionPaused(localStorage.getItem("tayco-motion-paused") === "1");
      } catch {
        setMotionPaused(false);
      }
    };
    readMotion();
    const onState = (event: Event) => {
      const paused = (event as CustomEvent<{ paused?: boolean }>).detail?.paused;
      if (typeof paused === "boolean") setMotionPaused(paused);
    };
    window.addEventListener("tayco:motion-state", onState);
    return () => window.removeEventListener("tayco:motion-state", onState);
  }, []);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      toggleRef.current?.focus();
    };
    const desktop = window.matchMedia("(min-width: 1200px)");
    const onResize = () => {
      if (desktop.matches) {
        const focusedInPanel = document.activeElement?.closest("#tayco-mobile-navigation");
        setOpen(false);
        if (focusedInPanel) headerRef.current?.querySelector<HTMLAnchorElement>(".tayco-brand")?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  function toggleMotion() {
    window.dispatchEvent(new CustomEvent("tayco:toggle-motion", { detail: { paused: !motionPaused } }));
  }

  function renderLinks() {
    return links.map(({ href, label }) => (
      <Link key={href} href={href} className="tayco-nav-link" aria-current={pathname === href ? "page" : undefined} onClick={() => setOpen(false)}>
        {label}
      </Link>
    ));
  }

  return (
    <header
      ref={headerRef}
      className="tayco-site-header"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <a className="tayco-skip-link" href="#main-content">Skip to content</a>
      <div className="tayco-nav-bar">
        <Link href="/" className="tayco-brand" aria-label="TAYCO home" onClick={() => setOpen(false)}>
          <Image src="/logo.jpeg" alt="" width={40} height={40} className="tayco-brand-mark" />
          <span className="tayco-brand-name">
            <strong>{COMPANY.name}</strong>
            <span>Construction &amp; restoration</span>
          </span>
        </Link>
        <nav className="tayco-desktop-navigation" aria-label="Main navigation">
          {renderLinks()}
          <button type="button" className="tayco-motion-control" aria-pressed={motionPaused} onClick={toggleMotion} title="Pause decorative animations">
            <span aria-hidden="true">{motionPaused ? "Ⅱ" : "✦"}</span>
            {motionPaused ? "Motion paused" : "Pause motion"}
          </button>
          <Link href={workspace ? '/portal' : '/login'} className="tayco-nav-signin">{workspace ? 'Workspace' : 'Sign in'}</Link>
          <Link href="/estimate" className="tayco-nav-estimate">Get an estimate <span aria-hidden="true">↗</span></Link>
        </nav>
        <div className="tayco-mobile-actions">
          <Link href={workspace ? '/portal' : '/login'} className="tayco-nav-signin" onClick={() => setOpen(false)}>{workspace ? 'Workspace' : 'Sign in'}</Link>
          <button
            ref={toggleRef}
            type="button"
            className="tayco-menu-toggle"
            aria-expanded={open}
            aria-controls="tayco-mobile-navigation"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
              {open ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>
      <nav id="tayco-mobile-navigation" className="tayco-mobile-navigation" aria-label="Mobile navigation" hidden={!open}>
        <div className="tayco-mobile-links">{renderLinks()}</div>
        <Link href="/estimate" className="tayco-nav-estimate" onClick={() => setOpen(false)}>Tell us about your project <span aria-hidden="true">↗</span></Link>
        <div className="tayco-mobile-menu-footer">
          <a href={COMPANY.phoneHref} className="tayco-nav-phone">{COMPANY.phoneDisplay}</a>
          <button type="button" className="tayco-motion-control" aria-pressed={motionPaused} onClick={toggleMotion}>
            <span aria-hidden="true">{motionPaused ? "Ⅱ" : "✦"}</span>
            {motionPaused ? "Motion paused" : "Pause motion"}
          </button>
        </div>
      </nav>
    </header>
  );
}
