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
        setIsOpen(false);
      }
    };
    window.addEventListener(PUBLIC_COOKIE_EVENT, onExternalUpdate);
    return () =>
      window.removeEventListener(PUBLIC_COOKIE_EVENT, onExternalUpdate);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (hydrated && isOpen) {
      document.body.style.paddingBottom = customizeOpen ? "260px" : "68px";
    } else {
      document.body.style.paddingBottom = "";
    }
    return () => {
      document.body.style.paddingBottom = "";
    };
  }, [hydrated, isOpen, customizeOpen]);

  if (!hydrated || !isOpen) return null;

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

  return (
    <aside
      aria-label="Cookie and privacy consent notice"
      data-testid="public-cookie-banner"
      className="fixed bottom-0 inset-x-0 z-50 border-t-2 border-[#C9A84C] bg-[#060D19] px-4 py-2.5 sm:px-6 text-slate-100 shadow-[0_-12px_36px_rgba(0,0,0,0.92)] print:hidden"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F3D37A] shrink-0">
              <svg
                className="h-3.5 w-3.5 text-[#C9A84C] shrink-0"
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
              <span>Cookies</span>
            </span>
            <p className="text-xs text-slate-100 leading-snug">
              Essential cookies secure your session; optional analytics help improve site performance.
            </p>
            <Link
              href="/privacy"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-[#F3D37A] underline-offset-2 hover:underline shrink-0"
            >
              Privacy Policy
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              data-testid="cookie-accept-all"
              onClick={handleAcceptAll}
              className="min-h-[36px] rounded-lg bg-[#C9A84C] px-3.5 py-1.5 text-xs font-black text-[#070E1A] transition-colors hover:bg-[#F3D37A] cursor-pointer"
            >
              Accept All
            </button>
            <button
              type="button"
              data-testid="cookie-essential-only"
              onClick={handleEssentialOnly}
              className="min-h-[36px] rounded-lg border border-[#C9A84C]/65 bg-[#0F2040] px-3.5 py-1.5 text-xs font-bold text-[#F3D37A] transition-colors hover:border-[#F3D37A] hover:text-white cursor-pointer"
            >
              Essential Only
            </button>
            {customizeOpen ? (
              <button
                type="button"
                data-testid="cookie-save-custom"
                onClick={handleSaveCustom}
                className="min-h-[36px] rounded-lg border border-white/35 bg-[#162B52] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#1E3A6D] cursor-pointer"
              >
                Save Choices
              </button>
            ) : (
              <button
                type="button"
                data-testid="cookie-customize"
                onClick={() => setCustomizeOpen(true)}
                className="min-h-[36px] rounded-lg border border-white/25 bg-[#0B172A] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:border-white/50 hover:text-white cursor-pointer"
              >
                Customize
              </button>
            )}
            {consent && (
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close cookie preferences"
                className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
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
        </div>

        {customizeOpen && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-xl border border-[#C9A84C]/40 bg-[#0B172A] p-3 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-white">Strictly Necessary</p>
                <p className="text-[11px] text-slate-300">
                  Session integrity, CSRF protection &amp; secure form submission.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#C9A84C]/25 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F3D37A]">
                Always Active
              </span>
            </div>

            <label className="flex items-start justify-between gap-2 pt-2 sm:pt-0 sm:pl-3 border-t sm:border-t-0 sm:border-l border-white/15 cursor-pointer">
              <div>
                <p className="font-bold text-white">Functional Preferences</p>
                <p className="text-[11px] text-slate-300">
                  Remembers display atmosphere &amp; consent settings.
                </p>
              </div>
              <input
                type="checkbox"
                checked={functional}
                onChange={(e) => setFunctional(e.target.checked)}
                aria-label="Functional and display preferences"
                className="mt-1 h-4 w-4 rounded-md border-slate-400 accent-[#C9A84C] cursor-pointer"
              />
            </label>

            <label className="flex items-start justify-between gap-2 pt-2 sm:pt-0 sm:pl-3 border-t sm:border-t-0 sm:border-l border-white/15 cursor-pointer">
              <div>
                <p className="font-bold text-white">Interaction Analytics</p>
                <p className="text-[11px] text-slate-300">
                  Helps improve navigation and showcase performance.
                </p>
              </div>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
                aria-label="Optional interaction analytics"
                className="mt-1 h-4 w-4 rounded-md border-slate-400 accent-[#C9A84C] cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>
    </aside>
  );
}
