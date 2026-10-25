'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Actor } from '@/lib/auth';
import AccountManagement from './AccountManagement';
import GuestActivityPanel from './GuestActivityPanel';

const input =
  'w-full rounded-xl border border-[#173252]/20 bg-white px-4 py-3 text-[#173252] outline-none focus:border-[#db8f31] focus:ring-2 focus:ring-[#db8f31]/25';
const button =
  'inline-flex min-h-12 items-center justify-center rounded-xl bg-[#173252] px-5 py-3 font-semibold text-white transition hover:bg-[#254969] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d89935] disabled:opacity-50';

async function request(path: string, body?: unknown, method = 'POST') {
  const response = await fetch(`/api/auth/${path}`, {
    method,
    credentials: 'same-origin',
    cache: 'no-store',
    ...(body === undefined
      ? {}
      : {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Please try again.');
  return data;
}

function ExecutiveTopBar({ showConsoleLink = false }: { showConsoleLink?: boolean }) {
  return (
    <header className="relative z-20 border-b border-[#d4af37]/20 bg-[#050b16]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-8 lg:flex-nowrap">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3.5 text-left transition hover:opacity-95"
          aria-label="TAYCO Turnkey — Return to Landing Page"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#0b1629] p-1.5 shadow-[0_0_20px_rgba(212,175,55,0.12)]">
            <Image
              src="/logo.png"
              alt="TAYCO LLC Logo"
              width={36}
              height={36}
              className="h-8 w-8 object-contain"
              priority
            />
          </div>
          <div>
            <span className="block text-sm font-bold tracking-[0.18em] text-white group-hover:text-[#f3d37a]">
              TAYCO TURNKEY
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-[#d4af37]">
              Construction &amp; Restoration · Corporate System
            </span>
          </div>
        </Link>

        <nav
          aria-label="Public site navigation"
          className="hidden items-center gap-1 xl:flex"
        >
          <Link
            href="/"
            className=" whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-[#f3d37a]"
          >
            Landing
          </Link>
          <Link
            href="/commercial"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-[#f3d37a]"
          >
            Commercial
          </Link>
          <Link
            href="/residential"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-[#f3d37a]"
          >
            Residential
          </Link>
          <Link
            href="/investor"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-[#f3d37a]"
          >
            Investors
          </Link>
          <Link
            href="/vendor-application"
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 transition hover:bg-white/5 hover:text-[#f3d37a]"
          >
            Trade Partners
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {showConsoleLink && (
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#f3d37a] transition hover:bg-[#d4af37]/25"
            >
              <span>Corporate Console</span>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          <Link
            href="/"
            data-testid="login-return-landing-top"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-[#d4af37]/45 bg-[#0c182c] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#f3d37a] shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition hover:border-[#f3d37a] hover:bg-[#132542] hover:text-white"
          >
            <svg className="h-4 w-4 shrink-0 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span>Return to Landing Page</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Frame({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="min-h-svh bg-[#060c17] text-slate-100">
      <ExecutiveTopBar showConsoleLink />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/30 bg-[#0d192b] px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#f3d37a]">
          TAYCO Account &amp; Access Control
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="mb-8 mt-3 max-w-xl leading-relaxed text-slate-300">{description}</p>
        <div className="rounded-2xl border border-[#d4af37]/25 bg-[#f8f6f1] p-6 text-[#173252] shadow-[0_24px_60px_rgba(0,0,0,0.5)] sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export function LoginAccess() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [help, setHelp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const invitation = hash.get('invite');
    if (invitation) {
      queueMicrotask(() => setToken(invitation));
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      await request(token ? 'accept-invite' : 'login', {
        email: form.get('email'),
        password: form.get('password'),
        ...(token ? { token } : {}),
      });
      router.replace('/portal');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-[#060c17] text-slate-100 selection:bg-[#d4af37]/30 selection:text-[#f3d37a]">
      {/* Architectural ambient backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle at 16% 20%, rgba(212, 175, 55, 0.11), transparent 42%), radial-gradient(circle at 85% 78%, rgba(30, 64, 175, 0.16), transparent 48%), linear-gradient(180deg, #050a14 0%, #081223 55%, #050a14 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #d4af37 1px, transparent 1px), linear-gradient(to bottom, #d4af37 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <ExecutiveTopBar />

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-10 sm:px-8 lg:py-14">
        <div className="grid w-full gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* Left Column: Executive Brand Identity & Portal Overview */}
          <div className="space-y-8 lg:col-span-7">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#d4af37]/35 bg-[#0c182c]/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-[#f3d37a] shadow-sm">
              <svg className="h-3.5 w-3.5 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l8 4v5c0 5.25-3.4 9.74-8 11-4.6-1.26-8-5.75-8-11V7l8-4z" />
              </svg>
              <span>TAYCO Internal Corporate System · Private Gateway</span>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#0f1f38] to-[#081120] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.55)]">
                <Image
                  src="/logo.png"
                  alt="TAYCO Construction Group Crest"
                  width={80}
                  height={80}
                  className="h-18 w-18 object-contain"
                  priority
                />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d4af37]">
                  TAYCO LLC · General Contractor
                </p>
                <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-white sm:text-5xl">
                  {token ? 'Welcome to your TAYCO account.' : 'Your projects, in one place.'}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {token
                ? 'Use your invited corporate email to activate access. Enter your existing password or set a new passphrase to open the TAYCO Corporate Console.'
                : 'Sign in to view your assigned projects, interactive civil and architectural Takeoff blueprints, monthly corporate income records, and active commercial bidding packages.'}
            </p>

            {/* Executive Capability Highlights */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0b1628]/85 p-4 backdrop-blur-sm">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f3d37a]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 16v-5m5 5V8m5 8v-3" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-white">2026 Corporate Ledger</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Real-time monthly activity, billing &amp; executive portfolio tracking.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1628]/85 p-4 backdrop-blur-sm">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f3d37a]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-white">Takeoff Blueprint Reader</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  Interactive multi-sheet civil &amp; architectural plan sets in high resolution.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0b1628]/85 p-4 backdrop-blur-sm">
                <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-lg border border-[#d4af37]/30 bg-[#d4af37]/10 text-[#f3d37a]">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-white">42 Active Packages</h2>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  SAM.gov, SBE/WBE/MBE/ESBE compliance &amp; general contractor pipeline.
                </p>
              </div>
            </div>

            {/* Direct Connection Hub to Public Website */}
            <div className="rounded-2xl border border-[#d4af37]/25 bg-[#0a1425]/90 p-5 shadow-lg">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                    Public Website &amp; Partner Portals
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Looking for TAYCO public services, investor relations, or subcontractor prequalification?
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border border-[#d4af37]/40 bg-[#d4af37]/15 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#f3d37a] transition hover:bg-[#d4af37] hover:text-[#060c17]"
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span>Go to Landing Page</span>
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3.5">
                <Link
                  href="/"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-[#d4af37]/40 hover:text-[#f3d37a]"
                >
                  ← Return to TAYCO
                </Link>
                <Link
                  href="/investor"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-[#d4af37]/40 hover:text-[#f3d37a]"
                >
                  Investor Relations
                </Link>
                <Link
                  href="/vendor-application"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-[#d4af37]/40 hover:text-[#f3d37a]"
                >
                  Trade Partners
                </Link>
                <Link
                  href="/estimate"
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-[#d4af37]/40 hover:text-[#f3d37a]"
                >
                  Request an Estimate
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Executive Authentication Card */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/35 bg-[#0c182c]/95 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:p-9">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#b8860b] via-[#f3d37a] to-[#d4af37]" />

              <div className="mb-7 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#d4af37]">
                    {token ? 'Invitation Activation' : 'Authorized Access'}
                  </span>
                  <h2 className="mt-1 text-2xl font-bold text-white">
                    {token ? 'Activate Corporate Account' : 'Sign In to Workspace'}
                  </h2>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#d4af37]/35 bg-[#07101f] text-[#f3d37a]">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-200"
                    htmlFor="login-email"
                  >
                    Email address
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#07101e] px-4 py-3.5 transition focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/25">
                    <svg className="h-4 w-4 shrink-0 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder-slate-500 outline-none"
                      autoComplete="username"
                      name="email"
                      id="login-email"
                      type="email"
                      placeholder="name@taycoturnkey.com"
                      maxLength={254}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-200"
                    htmlFor="login-password"
                  >
                    {token ? 'Current password or new account password' : 'Password'}
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#07101e] px-4 py-3.5 transition focus-within:border-[#d4af37] focus-within:ring-2 focus-within:ring-[#d4af37]/25">
                    <svg className="h-4 w-4 shrink-0 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      className="w-full border-0 bg-transparent p-0 text-sm text-white placeholder-slate-500 outline-none"
                      autoComplete={token ? 'new-password' : 'current-password'}
                      name="password"
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      minLength={token ? 12 : undefined}
                      maxLength={128}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="shrink-0 text-xs font-semibold text-slate-400 transition hover:text-[#f3d37a]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {token && (
                    <p className="mt-2 text-xs text-slate-400">
                      Use at least 12 characters. A unique passphrase works well.
                    </p>
                  )}
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-xl border border-red-500/40 bg-red-950/60 p-3.5 text-sm font-medium text-red-200"
                  >
                    {error}
                  </p>
                )}

                <button
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e6c453] to-[#c59b27] px-5 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[#07101e] shadow-[0_10px_28px_rgba(212,175,55,0.28)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f3d37a] disabled:opacity-50"
                  disabled={busy}
                  type="submit"
                >
                  <span>{busy ? 'Please wait…' : token ? 'Activate account' : 'Sign in'}</span>
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
              </form>

              <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                <button
                  className="min-h-10 text-xs font-semibold text-slate-300 underline decoration-[#d4af37]/60 underline-offset-4 transition hover:text-[#f3d37a]"
                  onClick={() => setHelp(!help)}
                  aria-expanded={help}
                  type="button"
                >
                  Need help signing in?
                </button>
                <span className="text-[11px] font-medium text-slate-400">
                  256-Bit Encrypted Session
                </span>
              </div>

              {help && (
                <div className="mt-3 rounded-xl border border-[#d4af37]/25 bg-[#07101e] p-4 text-xs leading-relaxed text-slate-300">
                  Contact your TAYCO project representative to request access or recover your account. For your protection, password recovery requires identity verification.
                </div>
              )}

              <div className="mt-6 border-t border-white/10 pt-5">
                <Link
                  href="/"
                  data-testid="login-return-landing-card"
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-slate-200 transition hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 hover:text-[#f3d37a]"
                >
                  <svg className="h-4 w-4 text-[#d4af37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  <span>Return to TAYCO Landing Page</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  expiresAt: number;
  revokedAt: number | null;
  acceptedAt: number | null;
  reviewGrantId?: string | null;
}

export function AccountSettings() {
  const router = useRouter();
  const [inviteRole, setInviteRole] = useState('client');
  const inviteRequest = useRef<{ fingerprint: string; key: string } | null>(null);
  const [linkExpiresAt, setLinkExpiresAt] = useState<number | null>(null);
  const [invitationNotice, setInvitationNotice] = useState('');
  const [actor, setActor] = useState<Actor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [link, setLink] = useState('');
  const [loadedAt, setLoadedAt] = useState(0);
  const [assignments, setAssignments] = useState<Array<{ id: string; kind: string; data: Record<string, unknown> }>>([]);

  useEffect(() => {
    request('session', undefined, 'GET')
      .then(({ actor }) => setActor(actor))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (actor?.role === 'admin')
      request('invitations', undefined, 'GET')
        .then((data) => {
          setInvitations(data.invitations);
          setLoadedAt(Number.isFinite(data.asOf) ? data.asOf : Number.MAX_SAFE_INTEGER);
        })
        .catch((e) => setError(e.message));
  }, [actor]);

  useEffect(() => {
    if (actor?.role === 'admin')
      fetch('/api/erp-suite', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Project assignments could not be loaded.'))))
        .then((data) => setAssignments(data.entries || []))
        .catch((e) => setError(e.message));
  }, [actor]);

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await request('logout');
      router.replace('/login');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  async function password(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(event.currentTarget);
    try {
      await request('change-password', {
        currentPassword: f.get('currentPassword'),
        newPassword: f.get('newPassword'),
      });
      router.replace('/login');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  function newReviewRequest() {
    inviteRequest.current = null;
    try {
      sessionStorage.removeItem('tayco.review.request');
    } catch {
      /* The in-memory reference remains usable when browser storage is blocked. */
    }
    setLink('');
    setInvitationNotice('A new generation will create a separate invitation link.');
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setLink('');
    setInvitationNotice('');
    const f = new FormData(event.currentTarget);
    try {
      const body = {
        email: String(f.get('email') || '').trim().toLowerCase(),
        role: String(f.get('role')),
        projectIds: inviteRole === 'guest' ? [] : f.getAll('projects').map(String),
        ...(f.get('role') === 'vendor' ? { vendorId: f.get('vendor') } : {}),
      };
      let creationRequestId: string | undefined;
      if (inviteRole === 'guest') {
        const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(body)));
        const fingerprint = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
        try {
          inviteRequest.current ||= JSON.parse(sessionStorage.getItem('tayco.review.request') || 'null');
        } catch {
          inviteRequest.current = null;
        }
        if (inviteRequest.current?.fingerprint !== fingerprint || !inviteRequest.current?.key)
          inviteRequest.current = { fingerprint, key: crypto.randomUUID() };
        creationRequestId = inviteRequest.current.key;
        try {
          sessionStorage.setItem('tayco.review.request', JSON.stringify(inviteRequest.current));
        } catch {
          /* Keep retries bound to this in-memory request reference. */
        }
      }
      const data = await request('invitations', { ...body, ...(creationRequestId ? { creationRequestId } : {}) });
      setLinkExpiresAt(data.invitation.expiresAt);
      if (data.invitation.path) setLink(window.location.origin + data.invitation.path);
      else
        setInvitationNotice(
          data.invitation.linkState === 'link_not_recoverable'
            ? 'This request already created an invitation. The original link cannot be recovered. Use Replace link below to invalidate it and issue a replacement.'
            : 'This invitation is ' + data.invitation.linkState + '. Use New invitation request only when you intend to generate a separate invitation.'
        );
      const listing = await request('invitations', undefined, 'GET');
      setInvitations(listing.invitations);
      setLoadedAt(Number.isFinite(listing.asOf) ? listing.asOf : Number.MAX_SAFE_INTEGER);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function rotate(id: string) {
    setBusy(true);
    setError('');
    setLink('');
    try {
      const data = await request('invitations', { action: 'rotate', id, creationRequestId: crypto.randomUUID() });
      setLinkExpiresAt(data.invitation.expiresAt);
      if (data.invitation.path) setLink(window.location.origin + data.invitation.path);
      const listing = await request('invitations', undefined, 'GET');
      setInvitations(listing.invitations);
      setLoadedAt(Number.isFinite(listing.asOf) ? listing.asOf : Number.MAX_SAFE_INTEGER);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setBusy(true);
    setError('');
    try {
      await request('invitations', { id }, 'DELETE');
      const listing = await request('invitations', undefined, 'GET');
      setInvitations(listing.invitations);
      setLoadedAt(Number.isFinite(listing.asOf) ? listing.asOf : Number.MAX_SAFE_INTEGER);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Frame title="Your account." description="Manage your access and keep your account secure.">
      {loading ? (
        <p role="status">Loading your account…</p>
      ) : (
        actor && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="break-all font-semibold text-[#173252]">{actor.email}</p>
                <p className="mt-1 text-sm capitalize text-slate-500">{actor.role}</p>
              </div>
              <Link href="/portal" className="text-sm font-semibold text-[#173252] underline">
                Open Corporate Console
              </Link>
            </div>
            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                {error}
              </p>
            )}
            <form onSubmit={password} className="space-y-4 border-t border-slate-100 pt-6">
              <h2 className="text-xl font-semibold text-[#173252]">Change password</h2>
              <label className="block text-sm text-slate-600">
                Current password
                <input
                  className={`${input} mt-2`}
                  autoComplete="current-password"
                  name="currentPassword"
                  type="password"
                  required
                  maxLength={128}
                />
              </label>
              <label className="block text-sm text-slate-600">
                New password
                <input
                  className={`${input} mt-2`}
                  autoComplete="new-password"
                  name="newPassword"
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                />
              </label>
              <p className="text-sm text-slate-500">Changing your password signs you out on all devices.</p>
              <button className={button} disabled={busy}>
                Update password
              </button>
            </form>
            {actor.role === 'admin' && (
              <section className="space-y-5 border-t border-slate-100 pt-6">
                <h2 className="text-xl font-semibold text-[#173252]">Invite your team and partners</h2>
                <p className="text-sm leading-relaxed text-slate-500">
                  Each person receives their own account. Share the private invitation directly with its intended recipient. Access is limited to the assignments you choose.
                </p>
                <form onSubmit={invite} className="space-y-4">
                  <label className="block text-sm text-slate-600">
                    Email address
                    <input className={`${input} mt-2`} name="email" type="email" required maxLength={254} />
                  </label>
                  <label className="block text-sm text-slate-600">
                    Role
                    <select
                      className={`${input} mt-2`}
                      name="role"
                      value={inviteRole}
                      onChange={(event) => setInviteRole(event.target.value)}
                    >
                      <option value="client">Client</option>
                      <option value="vendor">Supplier / subcontractor</option>
                      <option value="staff">Internal team</option>
                      <option value="guest">Guest · Corporate console access</option>
                    </select>
                  </label>
                  {inviteRole !== 'guest' && (
                    <fieldset>
                      <legend className="text-sm text-slate-600">Assigned projects</legend>
                      <div className="mt-2 rounded-xl border border-slate-200 p-2">
                        {assignments
                          .filter((a) => a.kind === 'project')
                          .map((a) => (
                            <label key={a.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-[#173252]">
                              <input type="checkbox" name="projects" value={a.id} className="h-5 w-5 accent-[#173252]" />
                              <span>{String(a.data.name || a.data.title || a.id)}</span>
                            </label>
                          ))}
                        {!assignments.some((a) => a.kind === 'project') && (
                          <p className="px-2 py-3 text-sm text-slate-500">
                            Create a project in the workspace before assigning access.
                          </p>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Clients and suppliers only see their assigned projects. Internal staff can access company operational records.
                      </p>
                    </fieldset>
                  )}
                  {inviteRole === 'vendor' && (
                    <label className="block text-sm text-slate-600">
                      Supplier record (required for suppliers)
                      <select className={`${input} mt-2`} name="vendor" defaultValue="">
                        <option value="">Choose a supplier</option>
                        {assignments
                          .filter((a) => a.kind === 'vendor')
                          .map((a) => (
                            <option key={a.id} value={a.id}>
                              {String(a.data.businessName || a.data.companyName || a.data.company || a.data.name || a.id)}
                            </option>
                          ))}
                      </select>
                    </label>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button className={button} disabled={busy}>
                      Create private invitation
                    </button>
                    {inviteRole === 'guest' && (
                      <button type="button" className="min-h-11 px-3 text-sm underline" disabled={busy} onClick={newReviewRequest}>
                        New invitation request
                      </button>
                    )}
                  </div>
                </form>
                {invitationNotice && (
                  <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-slate-700">
                    {invitationNotice}
                  </p>
                )}
                {link && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 p-4">
                    <label className="block text-sm font-semibold text-[#173252]">
                      Private link — shown once
                      <input className={`${input} mt-2 text-xs`} readOnly value={link} onFocus={(e) => e.target.select()} />
                    </label>
                    <p className="mt-2 text-sm text-slate-600">
                      Expires {linkExpiresAt ? new Date(linkExpiresAt).toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC' : 'at the recorded deadline'}. Copy and share privately; no email has been sent.
                    </p>
                  </div>
                )}
                <ul className="divide-y divide-slate-100">
                  {invitations.map((i) => (
                    <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div className="min-w-0">
                        <p className="break-all text-sm font-medium text-[#173252]">{i.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {i.role} · {i.revokedAt ? 'Revoked' : i.expiresAt <= loadedAt ? 'Expired' : i.acceptedAt ? 'Accepted' : 'Pending'}
                        </p>
                      </div>
                      {(!i.acceptedAt || i.role === 'guest') && !i.revokedAt && i.expiresAt > loadedAt && (
                        <button className="min-h-11 px-3 text-sm text-red-700 underline" disabled={busy} onClick={() => revoke(i.id)}>
                          Revoke
                        </button>
                      )}
                      {i.role === 'guest' && i.reviewGrantId && !i.acceptedAt && !i.revokedAt && i.expiresAt > loadedAt && (
                        <button className="min-h-11 px-3 text-sm underline" disabled={busy} onClick={() => void rotate(i.id)}>
                          Replace link · same deadline
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {actor.role === 'admin' && <AccountManagement assignments={assignments} />}
            {actor.role === 'admin' && <GuestActivityPanel />}
            <div className="border-t border-slate-100 pt-6">
              <button className={button} disabled={busy} onClick={logout}>
                Sign out
              </button>
              <p className="mt-3 text-xs text-slate-500">
                For your security, sessions are encrypted and protected.
              </p>
            </div>
          </div>
        )
      )}
    </Frame>
  );
}
