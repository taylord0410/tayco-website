"use client";
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { GUEST_PRIVACY_VERSION, type GuestPrivacy } from '@/lib/guest-privacy-contract';
import { clearGuestAnalytics, installGuestPrivacyChoice, validGuestPrivacy, externalPrivacyWithdrawal } from '@/lib/guest-privacy-client';

const control = 'min-h-10 rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-60 transition-colors';

export default function GuestPrivacyNotice({ onReady }: { onReady?: (id: string) => void }) {
  const [privacy, setPrivacy] = useState<GuestPrivacy | null>(null);
  const [opened, setOpened] = useState(false);
  const [custom, setCustom] = useState(false);
  const [optional, setOptional] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const focus = useRef<HTMLButtonElement>(null);
  const generation = useRef(0);
  const source = useRef<string | null>(null);

  useEffect(() => {
    clearGuestAnalytics();
    source.current ||= crypto.randomUUID();
    const started = generation.current;
    const controller = new AbortController();
    const listener = (event: MessageEvent) => {
      if (!externalPrivacyWithdrawal(event.data, source.current)) return;
      generation.current++;
      clearGuestAnalytics();
      setPrivacy(p => p ? { ...p, optionalAnalytics: null } : null);
      setOpened(true);
    };
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('tayco-privacy-withdrawal');
    if (channel) channel.onmessage = listener;
    fetch('/api/guest-privacy', { credentials: 'same-origin', cache: 'no-store', signal: controller.signal })
      .then(async r => {
        if (!r.ok) throw new Error('Privacy preferences are unavailable. Optional analytics remain off.');
        const data = await r.json();
        if (!validGuestPrivacy(data.privacy)) throw new Error('Privacy preferences could not be read. Optional analytics remain off.');
        if (!controller.signal.aborted && generation.current === started) {
          setPrivacy(data.privacy);
          setOptional(data.privacy.optionalAnalytics === true);
          installGuestPrivacyChoice(data.privacy);
          onReady?.(data.privacy.reviewId);
        }
      })
      .catch(e => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => {
      controller.abort();
      channel?.close();
      clearGuestAnalytics();
    };
  }, [onReady]);

  async function save(allowed: boolean) {
    const started = ++generation.current;
    clearGuestAnalytics();
    setPrivacy(p => p ? { ...p, optionalAnalytics: null } : p);
    setBusy(true);
    setError('');
    if (!allowed && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('tayco-privacy-withdrawal');
      channel.postMessage({ kind: 'withdraw', source: source.current });
      channel.close();
    }
    try {
      const r = await fetch('/api/guest-privacy', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: GUEST_PRIVACY_VERSION, optionalAnalytics: allowed })
      });
      if (!r.ok) throw new Error('Your preference was not saved. Optional analytics are off here; retry to save your choice.');
      const data = await r.json();
      if (!validGuestPrivacy(data.privacy)) throw new Error('Your preference could not be confirmed. Optional analytics remain off.');
      if (generation.current !== started) throw new Error('Preferences changed in another tab. Optional analytics remain off here; choose again to confirm.');
      setPrivacy(data.privacy);
      setOptional(data.privacy.optionalAnalytics === true);
      installGuestPrivacyChoice(data.privacy);
      onReady?.(data.privacy.reviewId);
      setOpened(false);
      setCustom(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const expanded = opened || privacy?.optionalAnalytics == null;

  if (!expanded) {
    return (
      <button
        type="button"
        data-testid="guest-privacy"
        aria-label="Cookie settings"
        onClick={() => { setOpened(true); setCustom(false); }}
        className="fixed bottom-3 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-[#eab869]/35 bg-[#081322]/90 px-3.5 py-1.5 text-xs font-semibold text-amber-100 shadow-lg backdrop-blur hover:border-[#eab869] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
      >
        <svg className="h-3.5 w-3.5 text-[#eab869]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 15.5v.01" />
          <path d="M12 12v.01" />
          <path d="M11 17v.01" />
          <path d="M7 13v.01" />
        </svg>
        <span>Cookie settings</span>
      </button>
    );
  }

  return (
    <section
      aria-labelledby={id}
      data-testid="guest-privacy"
      className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-3xl rounded-2xl border border-[#eab869]/45 bg-[#081322]/95 px-5 py-4 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <svg className="h-5 w-5 text-[#eab869] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
            <path d="M8.5 8.5v.01" />
            <path d="M16 15.5v.01" />
            <path d="M12 12v.01" />
            <path d="M11 17v.01" />
            <path d="M7 13v.01" />
          </svg>
          <h2 id={id} className="text-base font-semibold text-slate-100">Cookie Notice</h2>
        </div>
        {privacy?.optionalAnalytics != null && (
          <button
            type="button"
            onClick={() => setOpened(false)}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        We use standard cookies to ensure secure sign-in, session continuity, and optimal site performance.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          ref={focus}
          type="button"
          className="min-h-10 rounded-lg border border-[#eab869] bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-60 transition-colors"
          disabled={busy}
          onClick={() => void save(true)}
        >
          Accept cookies
        </button>
        <button
          type="button"
          className={control}
          disabled={busy}
          onClick={() => void save(false)}
          title="Reject optional analytics"
          aria-label="Essential only (Reject optional analytics)"
        >
          Essential only
        </button>
        <button
          type="button"
          className={control}
          aria-expanded={custom}
          onClick={() => setCustom(!custom)}
        >
          Preferences
        </button>
      </div>

      {custom && (
        <div className="mt-3 space-y-3 rounded-xl border border-slate-700/80 bg-[#060e1a]/90 p-3.5 text-xs text-slate-300">
          <label className="flex items-center gap-2.5">
            <input type="checkbox" checked disabled readOnly className="rounded border-slate-600 text-amber-500" />
            <span>Essential session and security · required</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={optional}
              onChange={e => setOptional(e.target.checked)}
              className="rounded border-slate-600 text-amber-500"
            />
            <span>Optional interaction analytics</span>
          </label>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              className="min-h-9 rounded-lg border border-[#eab869] bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-60 transition-colors"
              disabled={busy}
              onClick={() => void save(optional)}
            >
              Save preferences
            </button>
            <button
              type="button"
              className="min-h-9 rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 disabled:opacity-60 transition-colors"
              disabled={busy}
              onClick={() => void save(false)}
            >
              Reject optional analytics
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <Link className="underline hover:text-amber-200 transition-colors" href="/privacy">
          Cookie &amp; privacy policy
        </Link>
        <span className="text-[11px] text-slate-500">Notice {GUEST_PRIVACY_VERSION}</span>
      </div>

      {busy && <p role="status" className="mt-2 text-xs text-amber-200">Saving preference…</p>}
      {error && <p role="alert" className="mt-2 text-xs text-red-300">{error}</p>}
    </section>
  );
}
