"use client";

import React, { useEffect, useRef, useState } from "react";

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
}

const decodedSurfaceCache = new Map<string, Promise<HTMLCanvasElement>>();
let canvasPrototypesLocked = false;

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
  const existing = decodedSurfaceCache.get(src);
  if (existing) return existing;

  const promise = fetch(`/api/visual-stream?p=${encodeURIComponent(src)}`, {
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

      // Cap offscreen decoded surface at 1280px max dimension to keep GPU/RAM footprint lean
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
      return offscreen;
    })
    .catch((err) => {
      decodedSurfaceCache.delete(src);
      throw err;
    });

  decodedSurfaceCache.set(src, promise);
  return promise;
}

/** Gently preloads and decodes an array of image URLs sequentially during idle/background time */
export function preloadProtectedImages(urls: string[]): void {
  if (typeof window === "undefined") return;
  const unique = Array.from(new Set(urls.filter(Boolean)));
  let idx = 0;
  const step = () => {
    if (idx >= unique.length) return;
    const nextUrl = unique[idx++];
    fetchDecodedSurface(nextUrl)
      .catch(() => {})
      .finally(() => {
        window.setTimeout(step, 45);
      });
  };
  window.setTimeout(step, 120);
}

function computeTargetDimensions(
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement
): { w: number; h: number } {
  const aspect = source.width / Math.max(1, source.height);
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.65);

  if (rect.width > 16 && rect.height > 16) {
    // Size backing buffer proportional to actual on-screen display box while preserving source aspect ratio
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

    fetchDecodedSurface(src)
      .then((nextSurface) => {
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (rafRef.current) {
          window.cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }

        const { w: targetW, h: targetH } = computeTargetDimensions(canvas, nextSurface);
        const prevSurface = prevSurfaceRef.current;

        // Only resize backing buffer if dimensions changed; immediately repaint prevSurface so zero blank frame occurs
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

        // Smooth 420ms GPU crossfade when transitioning between two images on the same canvas
        if (prevSurface && prevSurface !== nextSurface && !motionReduced) {
          const durationMs = 420;
          const startTime = performance.now();

          const animateBlend = (now: number) => {
            if (cancelled) return;
            const elapsed = now - startTime;
            const progress = Math.min(1, Math.max(0, elapsed / durationMs));
            // Cubic ease-out
            const eased = 1 - Math.pow(1 - progress, 3);

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
      })
      .catch(() => {
        // Ignore aborted or failed loads
      });

    return () => {
      cancelled = true;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [src, shouldLoad]);

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
