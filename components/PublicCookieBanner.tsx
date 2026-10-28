"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GUEST_PRIVACY_VERSION } from "@/lib/guest-privacy-contract";

export const PUBLIC_COOKIE_CONSENT_KEY = "tayco_public_cookie_consent_v1";
export const PUBLIC_COOKIE_NAME = "tayco_cookie_consent";
export const PUBLIC_COOKIE_EVENT = "tayco-cookie-consent-updated";

export interface PublicCookiePreferences {
  version: string;
  essential: true;
  functional: boolean;
  analytics: boolean;
  updatedAt: string;
}

export function readPublicCookieConsent(): PublicCookiePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PUBLIC_COOKIE_CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PublicCookiePreferences>;
    if (
      parsed &&
      parsed.version === GUEST_PRIVACY_VERSION &&
      typeof parsed.functional === "boolean" &&
      typeof parsed.analytics === "boolean"
    ) {
      return {
        version: GUEST_PRIVACY_VERSION,
        essential: true,
        functional: parsed.functional,
        analytics: parsed.analytics,
        updatedAt:
          typeof parsed.updatedAt === "string"
            ? parsed.updatedAt
            : new Date().toISOString(),
      };
    }
  } catch {
    // Ignore storage read errors in restricted browsing modes
  }
  return null;
}

export function savePublicCookieConsent(
  prefs: Pick<PublicCookiePreferences, "functional" | "analytics">
): PublicCookiePreferences {
  const record: PublicCookiePreferences = {
    version: GUEST_PRIVACY_VERSION,
    essential: true,
    functional: Boolean(prefs.functional),
    analytics: Boolean(prefs.analytics),
    updatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        PUBLIC_COOKIE_CONSENT_KEY,
        JSON.stringify(record)
      );
    } catch {
      // Ignore storage quota/privacy mode errors
    }
    try {
      const mode =
        record.functional && record.analytics
          ? "all"
          : record.functional || record.analytics
            ? "custom"
            : "essential";
      const maxAge = 180 * 24 * 60 * 60; // 180 days
      document.cookie = `${PUBLIC_COOKIE_NAME}=${mode}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } catch {
      // Ignore cookie write errors
    }
    window.dispatchEvent(
      new CustomEvent(PUBLIC_COOKIE_EVENT, { detail: record })
    );
  }
  return record;
}

export default function PublicCookieBanner() {
  const [hydrated, setHydrated] = useState(false);
  const [consent, setConsent] = useState<PublicCookiePreferences | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => {
      const existing = readPublicCookieConsent();
      setConsent(existing);
      if (existing) {
        setFunctional(existing.functional);
        setAnalytics(existing.analytics);
      } else {
        setIsOpen(true);
      }
      setHydrated(true);
    };

    syncFromStorage();
    const onExternalUpdate = () => {
      const latest = readPublicCookieConsent();
      setConsent(latest);
      if (latest) {
        setFunctional(latest.functional);
        setAnalytics(latest.analytics);
      }
    };
    window.addEventListener(PUBLIC_COOKIE_EVENT, onExternalUpdate);
    return () =>
      window.removeEventListener(PUBLIC_COOKIE_EVENT, onExternalUpdate);
  }, []);

  if (!hydrated) return null;

  const handleAcceptAll = () => {
    const saved = savePublicCookieConsent({
      functional: true,
      analytics: true,
    });
    setConsent(saved);
    setFunctional(true);
    setAnalytics(true);
    setIsOpen(false);
    setCustomizeOpen(false);
  };

  const handleEssentialOnly = () => {
    const saved = savePublicCookieConsent({
      functional: false,
      analytics: false,
    });
    setConsent(saved);
    setFunctional(false);
    setAnalytics(false);
    setIsOpen(false);
    setCustomizeOpen(false);
  };

  const handleSaveCustom = () => {
    const saved = savePublicCookieConsent({
      functional,
      analytics,
    });
    setConsent(saved);
    setIsOpen(false);
    setCustomizeOpen(false);
  };

  if (!isOpen && consent) {
    return (
      <div className="fixed bottom-4 right-4 z-40 print:hidden">
        <button
          type="button"
          data-testid="public-cookie-trigger"
          onClick={() => {
            setIsOpen(true);
            setCustomizeOpen(false);
          }}
          aria-label="Open cookie and privacy preferences"
          className="group inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/45 bg-[#070E1A]/92 px-3.5 py-2 text-xs font-semibold text-[#F3D37A] shadow-[0_10px_30px_rgba(0,0,0,0.65)] backdrop-blur-xl transition-all hover:border-[#F3D37A] hover:bg-[#0F2040] hover:text-white cursor-pointer"
        >
          <svg
            className="h-3.5 w-3.5 text-[#C9A84C] transition-transform group-hover:rotate-12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Privacy &amp; Cookies</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Cookie and privacy consent notice"
      data-testid="public-cookie-banner"
      className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-5 z-50 sm:w-[430px] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#C9A84C]/55 bg-[#070E1A]/96 p-5 text-slate-100 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl print:hidden"
    >
      {/* Top gold accent bar */}
      <div
        className="absolute inset-x-6 top-0 h-[2px] rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, #C9A84C, #F3D37A, #C9A84C, transparent)",
        }}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#C9A84C]/45 bg-[#0F2040]/90 text-[#F3D37A]">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#C9A84C]">
              TAYCO LLC · Data &amp; Cookie Governance
            </p>
            <h2 className="text-sm font-black tracking-tight text-white">
              Privacy, Security &amp; Cookie Preferences
            </h2>
          </div>
        </div>

        {consent && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close cookie preferences"
            className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <p className="mt-2.5 text-xs leading-relaxed text-slate-300">
        We use essential security cookies to protect client sessions, encrypt
        project intake forms, and safeguard architectural visuals. With your
        consent, we also enable functional preferences and interaction
        analytics. We never sell or share personal or project data.
      </p>

      {customizeOpen && (
        <div className="mt-3.5 space-y-2.5 rounded-xl border border-[#C9A84C]/30 bg-[#0B172A]/95 p-3.5 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-bold text-white">
                Strictly Necessary &amp; Security Shield
              </p>
              <p className="text-[11px] text-slate-400">
                Session integrity, CSRF protection, encrypted form submission &amp;
                visual stream protection.
              </p>
            </div>
            <span className="shrink-0 rounded bg-[#C9A84C]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F3D37A]">
              Always Active
            </span>
          </div>

          <label className="flex items-start justify-between gap-3 pt-2 border-t border-white/10 cursor-pointer">
            <div>
              <p className="font-bold text-white">
                Functional &amp; Display Preferences
              </p>
              <p className="text-[11px] text-slate-400">
                Remembers division selections, display atmosphere &amp; consent
                settings.
              </p>
            </div>
            <input
              type="checkbox"
              checked={functional}
              onChange={(e) => setFunctional(e.target.checked)}
              aria-label="Functional and display preferences"
              className="mt-1 h-4 w-4 rounded border-slate-500 accent-[#C9A84C] cursor-pointer"
            />
          </label>

          <label className="flex items-start justify-between gap-3 pt-2 border-t border-white/10 cursor-pointer">
            <div>
              <p className="font-bold text-white">
                Optional Interaction Analytics
              </p>
              <p className="text-[11px] text-slate-400">
                Helps us improve navigation and project showcase performance.
                Off by default until accepted.
              </p>
            </div>
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              aria-label="Optional interaction analytics"
              className="mt-1 h-4 w-4 rounded border-slate-500 accent-[#C9A84C] cursor-pointer"
            />
          </label>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          data-testid="cookie-accept-all"
          onClick={handleAcceptAll}
          className="flex-1 min-w-[125px] rounded-xl bg-[#C9A84C] px-3.5 py-2 text-xs font-black text-[#070E1A] shadow-md transition-all hover:bg-[#F3D37A] cursor-pointer"
        >
          Accept All
        </button>
        <button
          type="button"
          data-testid="cookie-essential-only"
          onClick={handleEssentialOnly}
          className="flex-1 min-w-[120px] rounded-xl border border-[#C9A84C]/45 bg-[#0F2040]/85 px-3.5 py-2 text-xs font-bold text-[#F3D37A] transition-all hover:border-[#F3D37A] hover:text-white cursor-pointer"
        >
          Essential Only
        </button>
        {customizeOpen ? (
          <button
            type="button"
            data-testid="cookie-save-custom"
            onClick={handleSaveCustom}
            className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-white/20 cursor-pointer"
          >
            Save Choices
          </button>
        ) : (
          <button
            type="button"
            data-testid="cookie-customize"
            onClick={() => setCustomizeOpen(true)}
            className="rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-white/40 hover:text-white cursor-pointer"
          >
            Customize
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            onClick={() => setIsOpen(false)}
            className="font-semibold text-[#F3D37A] underline-offset-2 hover:underline"
          >
            Privacy &amp; Cookie Policy
          </Link>
          <span>·</span>
          <Link
            href="/privacy#project-photography-privacy"
            onClick={() => setIsOpen(false)}
            className="text-slate-300 underline-offset-2 hover:text-white hover:underline"
          >
            Client Confidentiality
          </Link>
        </div>
        <span className="font-mono text-[10px] text-slate-500">
          v{GUEST_PRIVACY_VERSION}
        </span>
      </div>
    </aside>
  );
}
