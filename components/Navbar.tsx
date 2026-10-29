"use client";

import { useEffect, useRef, useState } from "react";
import Image from "@/components/ProtectedImage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COMPANY } from "@/lib/company";
import { useTaycoGalleryLock } from "@/components/ui/TaycoDesignSystem";

const primaryLinks = [
  { href: "/properties/single-family", label: "Single-Family", mobileLabel: "Single-Family Homes" },
  { href: "/properties/duplexes", label: "Multifamily", mobileLabel: "Multifamily" },
  { href: "/properties/townhouses", label: "Townhomes", mobileLabel: "Townhomes" },
  { href: "/properties/commercial", label: "Commercial", mobileLabel: "Commercial" },
  { href: "/properties", label: "All Markets", mobileLabel: "All 4 Markets" },
] as const;

const secondaryLinks = [
  { href: "/investor", label: "Investors", mobileLabel: "Investors & Owners" },
  { href: "/vendor-application", label: "Trade Partners", mobileLabel: "Trade Partners" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const workspace = authenticated || pathname === "/portal" || pathname === "/account";
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useTaycoGalleryLock({
    isOpen: open,
    onClose: () => setOpen(false),
    enableStageWheelStep: false,
    enableStageSwipe: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/auth/session", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!controller.signal.aborted) setAuthenticated(response.ok);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAuthenticated(false);
      });
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
    const desktop = window.matchMedia("(min-width: 1080px)");
    const onResize = () => {
      if (desktop.matches) {
        const focusedInPanel = document.activeElement?.closest("#tayco-mobile-navigation");
        setOpen(false);
        if (focusedInPanel) headerRef.current?.querySelector<HTMLAnchorElement>(".tayco-brand")?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    desktop.addEventListener("change", onResize);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      desktop.removeEventListener("change", onResize);
    };
  }, [open]);

  function toggleMotion() {
    window.dispatchEvent(new CustomEvent("tayco:toggle-motion", { detail: { paused: !motionPaused } }));
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
          <Image
            src="/logo.png"
            alt=""
            width={42}
            height={42}
            className="tayco-brand-mark"
            auditIgnore={true}
          />
          <span className="tayco-brand-name" translate="no">
            <strong>{COMPANY.name}</strong>
            <span>Construction &amp; restoration</span>
          </span>
        </Link>
        <nav className="tayco-desktop-navigation" aria-label="Main navigation">
          <div className="tayco-nav-pill-dock">
            {primaryLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="tayco-nav-link"
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : undefined}
                >
                  {label}
                </Link>
              );
            })}
            <span className="tayco-nav-dock-divider" aria-hidden="true" />
            {secondaryLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="tayco-nav-link"
                  aria-current={active ? "page" : undefined}
                  data-active={active ? "true" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="tayco-nav-actions">
            <button
              type="button"
              className="tayco-motion-control"
              data-magnetic
              aria-pressed={motionPaused}
              onClick={toggleMotion}
              title={motionPaused ? "Enable live motion" : "Pause decorative animations"}
            >
              <span aria-hidden="true" className="inline-flex items-center">
                {motionPaused ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="6" y="4" width="3.5" height="16" rx="1" />
                    <rect x="14.5" y="4" width="3.5" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
                  </svg>
                )}
              </span>
              <span className="tayco-motion-label">{motionPaused ? "Motion Off" : "Live Motion"}</span>
            </button>
            <Link
              href={workspace ? "/portal" : "/login"}
              data-magnetic
              className="tayco-nav-signin"
            >
              {workspace ? "Workspace" : "Sign in"}
            </Link>
            <Link
              href="/estimate"
              data-magnetic
              className="tayco-nav-estimate"
            >
              Get an Estimate <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </nav>
        <div className="tayco-mobile-actions">
          <Link
            href="/estimate"
            className="tayco-nav-estimate hidden sm:inline-flex"
            onClick={() => setOpen(false)}
          >
            Estimate ↗
          </Link>
          <Link
            href={workspace ? "/portal" : "/login"}
            className="tayco-nav-signin"
            translate="no"
            onClick={() => setOpen(false)}
          >
            {workspace ? "Workspace" : "Sign in"}
          </Link>
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
      <nav
        id="tayco-mobile-navigation"
        data-tayco-modal-root="true"
        className="tayco-mobile-navigation"
        aria-label="Mobile navigation"
        hidden={!open}
      >
        <div className="tayco-mobile-links">
          {[...primaryLinks, ...secondaryLinks].map(({ href, mobileLabel }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="tayco-nav-link"
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : undefined}
                onClick={() => setOpen(false)}
              >
                <span>{mobileLabel}</span>
                <span aria-hidden="true">→</span>
              </Link>
            );
          })}
        </div>
        <Link href="/estimate" className="tayco-nav-estimate" onClick={() => setOpen(false)}>
          Tell Us About Your Project <span aria-hidden="true">↗</span>
        </Link>
        <div className="tayco-mobile-menu-footer">
          <a href={COMPANY.phoneHref} className="tayco-nav-phone">{COMPANY.phoneDisplay}</a>
          <button
            type="button"
            className="tayco-motion-control"
            data-magnetic
            aria-pressed={motionPaused}
            onClick={toggleMotion}
            title={motionPaused ? "Enable live motion" : "Pause decorative animations"}
          >
            <span aria-hidden="true" className="inline-flex items-center">
              {motionPaused ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="3.5" height="16" rx="1" />
                  <rect x="14.5" y="4" width="3.5" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" />
                </svg>
              )}
            </span>
            <span className="tayco-motion-label">{motionPaused ? "Motion Off" : "Live Motion"}</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
