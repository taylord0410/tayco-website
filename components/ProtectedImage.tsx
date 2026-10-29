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
}

const decodedSurfaceCache = new Map<string, Promise<HTMLCanvasElement>>();
const resolvedSurfaceMap = new Map<string, HTMLCanvasElement>();
let canvasPrototypesLocked = false;

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
      offscreen.width = w;
      offscreen.height = h;
      const ctx = offscreen.getContext("2d", { alpha: lower.endsWith(".png") });
      if (ctx) {
        ctx.drawImage(bitmap, 0, 0, w, h);
      }
      bitmap.close();
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
}: ProtectedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevSurfaceRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const [shouldLoad, setShouldLoad] = useState<boolean>(loading !== "lazy");

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

  return (
    <canvas
      ref={canvasRef}
      width={typeof width === "number" ? width : 16}
      height={typeof height === "number" ? height : 10}
      data-protected-canvas="v39"
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
