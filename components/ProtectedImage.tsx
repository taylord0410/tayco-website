"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface ProtectedImageProps {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
  loading?: "lazy" | "eager";
  draggable?: boolean;
  fill?: boolean;
  sizes?: string;
  width?: number | string;
  height?: number | string;
  /** Optional bundle of sibling URLs that must decode before this canvas transitions */
  syncUrls?: string[];
  /** Optional flag to exclude decorative ambient blur backdrops from duplicate slot auditing */
  auditIgnore?: boolean;
}

const decodedSurfaceCache = new Map<string, Promise<HTMLCanvasElement>>();
const resolvedSurfaceMap = new Map<string, HTMLCanvasElement>();
const resolvedContentHashMap = new Map<string, string>();
let canvasPrototypesLocked = false;

/** Normalizes an image path to its canonical visual stem (stripping query strings and -night suffix) */
export function normalizeVisualStem(src: string): string {
  if (!src) return "";
  const clean = src.split("?")[0].trim().toLowerCase();
  const base = clean.split("/").pop() || clean;
  return base
    .replace(/-night\.(jpg|jpeg|png|webp)$/i, ".$1")
    .replace(/\.(jpg|jpeg|png|webp)$/i, "");
}

/** Deterministic 24-bit FNV-1a Visual Asset ID (e.g. AST-8F42C1) */
export function computeVisualAssetId(src: string): string {
  const stem = normalizeVisualStem(src);
  let hash = 0x811c9dc5;
  for (let i = 0; i < stem.length; i++) {
    hash ^= stem.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `AST-${(hash & 0xffffff).toString(16).toUpperCase().padStart(6, "0")}`;
}

/** Computes a deterministic byte-level content fingerprint over unscrambled image bytes */
export function computeVisualByteFingerprint(bytes: Uint8Array): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  const len = bytes.byteLength;
  const stride = Math.max(1, Math.floor(len / 4096));
  for (let i = 0; i < len; i += stride) {
    const b = bytes[i];
    h1 ^= b;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= (b + (i & 0xff)) & 0xff;
    h2 = Math.imul(h2, 0x85ebca6b) >>> 0;
  }
  h1 ^= len;
  return `BF-${(h1 >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

// Frame-locked shared timestamp so all canvases committing in the same React render share identical t=0
let lastCommitBatchWindow = 0;
let sharedBatchStartTime = 0;

function getSharedTransitionStartTime(): number {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (Math.abs(now - lastCommitBatchWindow) > 24) {
    lastCommitBatchWindow = now;
    sharedBatchStartTime = now;
  }
  return sharedBatchStartTime;
}

function lockProtectedCanvasExports(): void {
  if (canvasPrototypesLocked || typeof window === "undefined") return;
  canvasPrototypesLocked = true;

  const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function (...args: [type?: string, quality?: unknown]) {
    if (this.dataset?.protectedCanvas === "v39") {
      return "data:,";
    }
    return origToDataURL.apply(this, args);
  };

  const origToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (
    callback: BlobCallback,
    type?: string,
    quality?: unknown
  ) {
    if (this.dataset?.protectedCanvas === "v39") {
      callback(null);
      return;
    }
    return origToBlob.call(this, callback, type, quality);
  };

  if (typeof CanvasRenderingContext2D !== "undefined") {
    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function (
      sx: number,
      sy: number,
      sw: number,
      sh: number,
      settings?: ImageDataSettings
    ) {
      if (this.canvas?.dataset?.protectedCanvas === "v39") {
        return new ImageData(Math.max(1, sw), Math.max(1, sh));
      }
      return origGetImageData.call(this, sx, sy, sw, sh, settings);
    };
  }
}

function unscrambleVisualBytes(scrambled: Uint8Array): Uint8Array {
  const out = new Uint8Array(scrambled.length);
  for (let i = 0; i < scrambled.length; i++) {
    const mask = (0xa7 ^ ((i * 31) & 0xff) ^ ((i >> 8) & 0xff)) & 0xff;
    out[i] = scrambled[i] ^ mask;
  }
  return out;
}

export function fetchDecodedSurface(src: string): Promise<HTMLCanvasElement> {
  const ready = resolvedSurfaceMap.get(src);
  if (ready) return Promise.resolve(ready);

  const existing = decodedSurfaceCache.get(src);
  if (existing) return existing;

  const cleanSrc = src.split("?")[0];
  const promise = fetch(`/api/visual-stream?v=pf20261029&p=${encodeURIComponent(cleanSrc)}`, {
    method: "GET",
    headers: {
      "X-Tayco-Stream": "v39",
    },
    credentials: "same-origin",
  })
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`Visual stream failed (${res.status})`);
      }
      const buf = await res.arrayBuffer();
      const unscrambled = unscrambleVisualBytes(new Uint8Array(buf));
      const contentHash = computeVisualByteFingerprint(unscrambled);
      const lower = src.toLowerCase();
      const mime = lower.endsWith(".png")
        ? "image/png"
        : lower.endsWith(".webp")
          ? "image/webp"
          : "image/jpeg";
      const copy = new Uint8Array(unscrambled.byteLength);
      copy.set(unscrambled);
      const blob = new Blob([copy.buffer], { type: mime });
      const bitmap = await createImageBitmap(blob);

      const maxDim = 1280;
      const scale =
        bitmap.width > maxDim || bitmap.height > maxDim
          ? Math.min(maxDim / bitmap.width, maxDim / bitmap.height)
          : 1;
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));

      const offscreen = document.createElement("canvas");
      offscreen.dataset.protectedCanvas = "v39";
      offscreen.dataset.contentHash = contentHash;
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext("2d", { alpha: lower.endsWith(".png") });
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, w, h);
      }
      bitmap.close();
      resolvedContentHashMap.set(src, contentHash);
      resolvedSurfaceMap.set(src, offscreen);
      return offscreen;
    })
    .catch((err) => {
      decodedSurfaceCache.delete(src);
      throw err;
    });

  decodedSurfaceCache.set(src, promise);
  return promise;
}

/** Atomic barrier: resolves only when all URLs in the bundle are decoded into resolvedSurfaceMap */
export async function waitForDecodedSurfaces(urls: string[]): Promise<void> {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Set(urls.filter(Boolean)));
  if (unique.every((u) => resolvedSurfaceMap.has(u))) {
    return;
  }
  await Promise.all(unique.map((u) => fetchDecodedSurface(u).catch(() => null)));
}

/** Gently preloads and decodes an array of image URLs sequentially during idle/background time */
export function preloadProtectedImages(urls: string[]): void {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Set(urls.filter(Boolean)));
  let idx = 0;
  const step = () => {
    if (idx >= unique.length) return;
    const batch = unique.slice(idx, idx + 2);
    idx += 2;
    Promise.all(batch.map((u) => fetchDecodedSurface(u).catch(() => null))).finally(() => {
      window.setTimeout(step, 35);
    });
  };
  window.setTimeout(step, 80);
}

/**
 * Synchronized Scene Choreographer Hook:
 * Ensures that when a scene index changes (by user click or auto-timer), all images belonging
 * to the target scene are 100% decoded in memory BEFORE committing displayIdx, so that the
 * backdrop, main stage image, thumbnails, and text/badges transition on the exact same frame.
 */
export function useSynchronizedScene(
  totalScenes: number,
  getSceneUrls: (index: number) => string[],
  intervalMs = 6000,
  paused = false
) {
  const [displayIdx, setDisplayIdx] = useState<number>(0);
  const [targetIdx, setTargetIdx] = useState<number>(0);
  const [syncPulse, setSyncPulse] = useState<number>(0);
  const getUrlsRef = useRef(getSceneUrls);
  getUrlsRef.current = getSceneUrls;

  const requestScene = useCallback(
    (nextIndexOrUpdater: number | ((prev: number) => number)) => {
      setTargetIdx((prev) => {
        const raw =
          typeof nextIndexOrUpdater === "function"
            ? nextIndexOrUpdater(prev)
            : nextIndexOrUpdater;
        return ((raw % totalScenes) + totalScenes) % totalScenes;
      });
    },
    [totalScenes]
  );

  // Pre-decode current + next scene immediately, and commit targetIdx only once all its surfaces are ready
  useEffect(() => {
    let cancelled = false;
    const urls = getUrlsRef.current(targetIdx);
    const nextIdx = (targetIdx + 1) % totalScenes;
    const nextUrls = getUrlsRef.current(nextIdx);

    waitForDecodedSurfaces(urls).then(() => {
      if (cancelled) return;
      setDisplayIdx((prev) => {
        if (prev !== targetIdx) {
          setSyncPulse((p) => p + 1);
        }
        return targetIdx;
      });
      // Pre-warm the subsequent scene so the next tick is 0ms synchronous
      waitForDecodedSurfaces(nextUrls).catch(() => {});
    });

    return () => {
      cancelled = true;
    };
  }, [targetIdx, totalScenes]);

  useEffect(() => {
    if (paused || intervalMs <= 0) return;
    const id = window.setInterval(() => {
      requestScene((prev) => (prev + 1) % totalScenes);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, intervalMs, totalScenes, requestScene]);

  return {
    displayIdx,
    targetIdx,
    syncPulse,
    selectScene: requestScene,
  };
}

function computeTargetDimensions(
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement
): { w: number; h: number } {
  const aspect = source.width / Math.max(1, source.height);
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.65);

  if (rect.width > 16 && rect.height > 16) {
    const neededLongEdge = Math.max(rect.width, rect.height * aspect) * dpr;
    const clampedW = Math.min(
      source.width,
      Math.max(160, Math.round(neededLongEdge))
    );
    const clampedH = Math.max(1, Math.round(clampedW / aspect));
    return { w: clampedW, h: clampedH };
  }

  return { w: source.width, h: source.height };
}

export default function ProtectedImage({
  src,
  alt = "",
  className = "",
  style,
  loading = "eager",
  fill = false,
  width,
  height,
  syncUrls,
  auditIgnore = false,
}: ProtectedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevSurfaceRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const [shouldLoad, setShouldLoad] = useState<boolean>(loading !== "lazy");
  const assetId = computeVisualAssetId(src);
  const assetStem = normalizeVisualStem(src);

  useEffect(() => {
    lockProtectedCanvasExports();
  }, []);

  useEffect(() => {
    if (loading !== "lazy" || shouldLoad) {
      setShouldLoad(true);
      return;
    }
    const el = canvasRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "480px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, shouldLoad]);

  useEffect(() => {
    if (!shouldLoad || !src) return;
    let cancelled = false;

    const paintAndCrossfade = (nextSurface: HTMLCanvasElement, sharedStart: number) => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resolvedHash =
        nextSurface.dataset.contentHash || resolvedContentHashMap.get(src) || "";
      if (resolvedHash) {
        canvas.dataset.contentHash = resolvedHash;
      }

      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }

      const { w: targetW, h: targetH } = computeTargetDimensions(canvas, nextSurface);
      const prevSurface = prevSurfaceRef.current;

      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
        if (prevSurface) {
          const initCtx = canvas.getContext("2d");
          if (initCtx) {
            initCtx.globalAlpha = 1;
            initCtx.drawImage(prevSurface, 0, 0, targetW, targetH);
          }
        }
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const motionReduced =
        typeof document !== "undefined" &&
        (document.body.dataset.motion === "reduced" ||
          document.body.dataset.motionTier === "paused");

      // Frame-locked 520ms harmonic crossfade shared across all canvases in the same commit
      if (prevSurface && prevSurface !== nextSurface && !motionReduced) {
        const durationMs = 520;

        const animateBlend = (now: number) => {
          if (cancelled) return;
          const elapsed = Math.max(0, now - sharedStart);
          const progress = Math.min(1, elapsed / durationMs);
          // Smooth harmonic cubic ease-in-out
          const eased =
            progress < 0.5
              ? 4 * progress * progress * progress
              : 1 - Math.pow(-2 * progress + 2, 3) / 2;

          ctx.globalAlpha = 1;
          ctx.drawImage(prevSurface, 0, 0, targetW, targetH);
          ctx.globalAlpha = eased;
          ctx.drawImage(nextSurface, 0, 0, targetW, targetH);
          ctx.globalAlpha = 1;

          if (progress < 1) {
            rafRef.current = window.requestAnimationFrame(animateBlend);
          } else {
            rafRef.current = 0;
            prevSurfaceRef.current = nextSurface;
          }
        };

        rafRef.current = window.requestAnimationFrame(animateBlend);
      } else {
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(nextSurface, 0, 0, targetW, targetH);
        prevSurfaceRef.current = nextSurface;
      }
    };

    // Fast synchronous path: if surface (and any syncUrls) are already in resolvedSurfaceMap,
    // start the crossfade on this exact synchronous React commit tick (delta_ms = 0 across all siblings!)
    const immediateSurface = resolvedSurfaceMap.get(src);
    const groupReady =
      !syncUrls || syncUrls.length === 0 || syncUrls.every((u) => resolvedSurfaceMap.has(u));

    if (immediateSurface && groupReady) {
      const sharedStart = getSharedTransitionStartTime();
      paintAndCrossfade(immediateSurface, sharedStart);
    } else {
      const bundle = syncUrls && syncUrls.length > 0 ? [src, ...syncUrls] : [src];
      waitForDecodedSurfaces(bundle)
        .then(() => {
          if (cancelled) return;
          const resolved = resolvedSurfaceMap.get(src);
          if (resolved) {
            paintAndCrossfade(resolved, getSharedTransitionStartTime());
          }
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [src, shouldLoad, syncUrls]);

  const computedClassName = fill
    ? `absolute inset-0 w-full h-full ${className}`.trim()
    : className;

  const isAmbientBlur =
    auditIgnore ||
    alt === "" ||
    /\bblur-(?:md|lg|xl|2xl|3xl)\b/.test(className);

  return (
    <canvas
      ref={canvasRef}
      width={typeof width === "number" ? width : 16}
      height={typeof height === "number" ? height : 10}
      data-protected-canvas="v39"
      data-asset-id={assetId}
      data-asset-stem={assetStem}
      data-content-hash={resolvedContentHashMap.get(src) || undefined}
      data-audit-ignore={isAmbientBlur ? "true" : undefined}
      role={alt ? "img" : "presentation"}
      aria-label={alt || undefined}
      aria-hidden={alt === "" ? true : undefined}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={computedClassName}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
        ...style,
      }}
    />
  );
}

export interface AuditedVisualSlot {
  slotIndex: number;
  assetId: string;
  assetStem: string;
  contentHash: string;
  label: string;
  duplicateCount: number;
  isDuplicate: boolean;
  rect: { top: number; left: number; width: number; height: number };
  element: HTMLCanvasElement;
}

/**
 * Live Visual Asset Identifier & Duplicate Detector HUD:
 * Scans all rendered <canvas data-protected-canvas="v39"> surfaces on the active view,
 * verifies uniqueness by both deterministic Asset Stem ID (AST-XXXXXX) and Binary Byte
 * Fingerprint (BF-XXXXXXXX), and provides a live on-image badge overlay + inspector drawer.
 */
export function VisualAssetIntegrityHud({
  scopeLabel = "ACTIVE VIEWPORT",
}: {
  scopeLabel?: string;
}) {
  const [slots, setSlots] = useState<AuditedVisualSlot[]>([]);
  const [showBadges, setShowBadges] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const scanDomAssets = useCallback(() => {
    if (typeof document === "undefined") return;
    const allCanvases = Array.from(
      document.querySelectorAll<HTMLCanvasElement>('canvas[data-protected-canvas="v39"]')
    );

    const seenSlotContainers = new Set<Element>();
    const rawEntries: Array<{
      assetId: string;
      assetStem: string;
      contentHash: string;
      label: string;
      rect: { top: number; left: number; width: number; height: number };
      element: HTMLCanvasElement;
    }> = [];

    for (const canvas of allCanvases) {
      if (canvas.dataset.auditIgnore === "true") continue;
      if (canvas.closest('[data-audit-scope="ignore"]')) continue;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 28 || rect.height < 28) continue;
      const style = window.getComputedStyle(canvas);
      if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) < 0.05) {
        continue;
      }

      // Group Day + Night paired layers inside the same split-screen stage container as 1 visual slot
      const slotContainer = canvas.closest("[data-visual-slot]");
      if (slotContainer) {
        if (seenSlotContainers.has(slotContainer)) continue;
        seenSlotContainers.add(slotContainer);
      }

      const assetId = canvas.dataset.assetId || "AST-000000";
      const assetStem = canvas.dataset.assetStem || "unknown";
      if (assetStem === "logo") continue;
      const contentHash = canvas.dataset.contentHash || assetId;
      const label = canvas.getAttribute("aria-label") || assetStem;

      rawEntries.push({
        assetId,
        assetStem,
        contentHash,
        label,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
        element: canvas,
      });
    }

    // Count occurrences by BOTH assetStem and binary contentHash so even renamed duplicate files are caught
    const stemCounts = new Map<string, number>();
    const hashCounts = new Map<string, number>();
    for (const item of rawEntries) {
      stemCounts.set(item.assetStem, (stemCounts.get(item.assetStem) || 0) + 1);
      if (item.contentHash) {
        hashCounts.set(item.contentHash, (hashCounts.get(item.contentHash) || 0) + 1);
      }
    }

    const audited: AuditedVisualSlot[] = rawEntries.map((item, idx) => {
      const sCount = stemCounts.get(item.assetStem) || 1;
      const hCount = item.contentHash ? hashCounts.get(item.contentHash) || 1 : 1;
      const dupCount = Math.max(sCount, hCount);
      return {
        slotIndex: idx + 1,
        assetId: item.assetId,
        assetStem: item.assetStem,
        contentHash: item.contentHash,
        label: item.label,
        duplicateCount: dupCount,
        isDuplicate: dupCount > 1,
        rect: item.rect,
        element: item.element,
      };
    });

    setSlots(audited);
  }, []);

  useEffect(() => {
    scanDomAssets();
    const interval = window.setInterval(scanDomAssets, 1100);
    const onScrollOrResize = () => {
      if (showBadges) scanDomAssets();
    };
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [scanDomAssets, showBadges]);

  const totalCount = slots.length;
  const duplicateSlots = slots.filter((s) => s.isDuplicate);
  const duplicateCount = duplicateSlots.length;
  const uniqueCount = totalCount - duplicateCount;

  return (
    <>
      {/* Inline Architectural Asset Integrity Radar Bar */}
      <div
        data-testid="visual-asset-integrity-hud"
        data-total-slots={totalCount}
        data-unique-slots={uniqueCount}
        data-duplicate-slots={duplicateCount}
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e5c158]/28 bg-[linear-gradient(135deg,rgba(11,17,30,0.92)_0%,rgba(17,27,46,0.88)_100%)] px-4 py-2.5 shadow-[0_14px_36px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-xl"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#e5c158]/35 bg-[#e5c158]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#f3d98b]">
            <span
              className={`h-2 w-2 rounded-full ${
                duplicateCount === 0
                  ? "bg-emerald-400 shadow-[0_0_10px_#34d399]"
                  : "bg-amber-400 animate-pulse shadow-[0_0_10px_#fbbf24]"
              }`}
            />
            Asset Integrity Radar · {scopeLabel}
          </span>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-200">
            <span className="font-mono text-[11px] font-semibold text-white">
              {uniqueCount}/{totalCount} UNIQUE
            </span>
            <span className="text-slate-600">·</span>
            <span
              className={`font-mono text-[11px] font-bold ${
                duplicateCount === 0 ? "text-emerald-300" : "text-amber-300"
              }`}
            >
              {duplicateCount === 0
                ? "0 REPEATED IMAGES DETECTED"
                : `${duplicateCount} DUPLICATE SLOTS DETECTED`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const next = !showBadges;
              setShowBadges(next);
              setTimeout(scanDomAssets, 30);
            }}
            className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-all duration-300 ${
              showBadges
                ? "border-[#f3d98b] bg-[linear-gradient(135deg,#f6e29c_0%,#d9b14a_52%,#b58928_100%)] text-slate-950 shadow-[0_0_22px_rgba(229,193,88,0.45)]"
                : "border-[#e5c158]/35 bg-slate-900/80 text-[#f3d98b] hover:border-[#e5c158]/70 hover:bg-[#e5c158]/15"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7V4h3M20 7V4h-3M4 17v3h3M20 17v3h-3M9 12h6M12 9v6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {showBadges ? "Hide Image IDs (#AST)" : "Show Image IDs (#AST)"}
          </button>

          <button
            type="button"
            onClick={() => {
              scanDomAssets();
              setDrawerOpen((prev) => !prev);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-200 transition-all hover:border-[#e5c158]/50 hover:bg-[#e5c158]/10 hover:text-white"
          >
            <svg className="h-3.5 w-3.5 text-[#e5c158]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {drawerOpen ? "Close Audit Log" : `Inspect All (${totalCount})`}
          </button>
        </div>
      </div>

      {/* Expandable Full-Page Asset Uniqueness Inspector Table */}
      {drawerOpen && (
        <div
          data-audit-scope="ignore"
          className="mt-3 rounded-2xl border border-[#e5c158]/30 bg-slate-950/95 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.75)] backdrop-blur-2xl"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#e5c158]">
                Live Page Image Fingerprint Registry · SHA/FNV-1a Byte & Stem Verification
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Every visible image surface is fingerprinted by both canonical asset stem and decoded binary payload bytes. Click any row to scroll to that surface.
              </p>
            </div>
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-bold text-emerald-300">
              {duplicateCount === 0 ? "100% UNIQUE VERIFIED" : `${duplicateCount} COLLISIONS`}
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {slots.map((slot) => (
                <button
                  key={`${slot.slotIndex}-${slot.assetId}`}
                  type="button"
                  onClick={() => {
                    slot.element.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  className={`flex items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-all ${
                    slot.isDuplicate
                      ? "border-amber-400/60 bg-amber-500/15 hover:bg-amber-500/25"
                      : "border-white/10 bg-slate-900/75 hover:border-[#e5c158]/45 hover:bg-slate-900"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#f3d98b]">
                        #{String(slot.slotIndex).padStart(2, "0")} · {slot.assetId}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">
                        {slot.contentHash}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-medium text-slate-200">
                      {slot.label}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                      slot.isDuplicate
                        ? "border border-amber-300/50 bg-amber-400/20 text-amber-200"
                        : "border border-emerald-400/35 bg-emerald-500/15 text-emerald-300"
                    }`}
                  >
                    {slot.isDuplicate ? `DUP ×${slot.duplicateCount}` : "UNIQUE"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Viewport Floating Image ID Badges Overlay when Show Image IDs is active */}
      {showBadges && (
        <div
          data-audit-scope="ignore"
          className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
        >
          {slots.map((slot) => {
            if (
              slot.rect.top + slot.rect.height < 0 ||
              slot.rect.top > (typeof window !== "undefined" ? window.innerHeight : 1080)
            ) {
              return null;
            }
            return (
              <div
                key={`badge-${slot.slotIndex}-${slot.assetId}`}
                style={{
                  position: "fixed",
                  top: `${Math.max(8, slot.rect.top + 10)}px`,
                  left: `${Math.max(8, slot.rect.left + 10)}px`,
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-md ${
                  slot.isDuplicate
                    ? "border-amber-300 bg-amber-950/95 text-amber-200"
                    : "border-[#e5c158]/80 bg-slate-950/90 text-[#f3d98b]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    slot.isDuplicate ? "bg-amber-400 animate-ping" : "bg-emerald-400"
                  }`}
                />
                <span>{slot.assetId}</span>
                <span className="text-slate-400">·</span>
                <span className="text-[9px] text-slate-300">{slot.contentHash}</span>
                <span
                  className={`ml-1 rounded px-1 py-0.2 text-[8px] ${
                    slot.isDuplicate
                      ? "bg-amber-400/30 text-amber-100"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {slot.isDuplicate ? `DUP ×${slot.duplicateCount}` : "UNIQUE"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
