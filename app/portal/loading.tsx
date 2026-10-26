import Image from 'next/image';

export default function PortalLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="portal-route-loading"
      className="relative flex min-h-svh flex-col items-center justify-center bg-[#060c17] px-4 py-12 text-slate-100"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(212, 175, 55, 0.12), transparent 42%), radial-gradient(circle at 80% 78%, rgba(30, 64, 175, 0.16), transparent 48%), linear-gradient(180deg, #050a14 0%, #081223 55%, #050a14 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-[#d4af37]/40 bg-[#0c182c]/95 p-7 text-center shadow-[0_28px_80px_rgba(0,0,0,0.78)] backdrop-blur-xl sm:p-9">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#b8860b] via-[#f3d37a] to-[#d4af37]" />

        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-[#d4af37]/40 bg-gradient-to-b from-[#0f1f38] to-[#081120] p-3 shadow-lg">
          <Image
            src="/logo.png"
            alt="TAYCO Construction Group Crest"
            width={64}
            height={64}
            className="h-14 w-14 object-contain"
            priority
          />
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#f3d37a]">
          <svg className="h-3.5 w-3.5 animate-spin text-[#f3d37a]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-95" fill="currentColor" d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z" />
          </svg>
          <span>Authenticated Session</span>
        </div>

        <h1 className="mt-3 text-xl font-bold tracking-tight text-white sm:text-2xl">
          Opening TAYCO Corporate Console…
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
          Preparing 48 verified bidding packages, interactive Takeoff blueprint sets, and 2026 corporate records.
        </p>

        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[#07101e] p-0.5">
          <div className="h-full w-full animate-pulse rounded-full bg-gradient-to-r from-[#b8860b] via-[#f3d37a] to-[#d4af37]" />
        </div>

        <p className="mt-3 font-mono text-[11px] text-slate-400">
          256-Bit Encrypted Corporate Gateway · Read-Only &amp; Executive Access
        </p>
      </div>
    </div>
  );
}
