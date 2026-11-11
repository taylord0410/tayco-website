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
  HTMLCanvasElement.prototype.toDataURL = function (...args: [type?: string, quality?: number]) {
    if (this.dataset?.protectedCanvas === "v39") {
      return "data:,";
    }
    return origToDataURL.apply(this, args);
  };

  const origToBlob = HTMLCanvasElement.prototype.toBlob;
  HTMLCanvasElement.prototype.toBlob = function (
    callback: BlobCallback,
    type?: string,
    quality?: number
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
  const promise = fetch(`/api/visual-stream?v=pf20261029&r=20261111w7d&p=${encodeURIComponent(cleanSrc)}`, {
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
  const layoutW = canvas.clientWidth || canvas.getBoundingClientRect().width;
  const layoutH = canvas.clientHeight || canvas.getBoundingClientRect().height;
  const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.65);

  if (layoutW > 16 && layoutH > 16) {
    const neededLongEdge = Math.max(layoutW, layoutH * aspect) * dpr;
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
  const syncUrlsRef = useRef<string[] | undefined>(syncUrls);
  syncUrlsRef.current = syncUrls;
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
    let resizeRaf = 0;
    let repaintCurrentSurface: ((now: number) => void) | null = null;

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

      let { w: targetW, h: targetH } = computeTargetDimensions(canvas, nextSurface);
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

        const paintBlendFrame = (now: number) => {
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
          return progress;
        };

        const animateBlend = (now: number) => {
          if (cancelled) return;
          const progress = paintBlendFrame(now);
          if (progress < 1) {
            rafRef.current = window.requestAnimationFrame(animateBlend);
          } else {
            rafRef.current = 0;
            prevSurfaceRef.current = nextSurface;
          }
        };

        repaintCurrentSurface = (now) => {
          const dimensions = computeTargetDimensions(canvas, nextSurface);
          if (canvas.width === dimensions.w && canvas.height === dimensions.h) return;
          targetW = dimensions.w;
          targetH = dimensions.h;
          canvas.width = targetW;
          canvas.height = targetH;
          // Resize clears the backing store; restore this exact blend within the
          // same animation frame, keeping its original shared start time.
          paintBlendFrame(now);
        };
        rafRef.current = window.requestAnimationFrame(animateBlend);
      } else {
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(nextSurface, 0, 0, targetW, targetH);
        prevSurfaceRef.current = nextSurface;
        repaintCurrentSurface = () => {
          const dimensions = computeTargetDimensions(canvas, nextSurface);
          if (canvas.width === dimensions.w && canvas.height === dimensions.h) return;
          targetW = dimensions.w;
          targetH = dimensions.h;
          canvas.width = targetW;
          canvas.height = targetH;
          ctx.globalAlpha = 1;
          ctx.drawImage(nextSurface, 0, 0, targetW, targetH);
        };
      }
    };

    const requestResizePaint = () => {
      if (cancelled || resizeRaf) return;
      resizeRaf = window.requestAnimationFrame((now) => {
        resizeRaf = 0;
        if (!cancelled) repaintCurrentSurface?.(now);
      });
    };
    const canvas = canvasRef.current;
    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(requestResizePaint)
      : null;
    if (canvas) resizeObserver?.observe(canvas);
    // Also covers DPR changes when moving between displays, and browsers without RO.
    window.addEventListener("resize", requestResizePaint);

    // Fast synchronous path: if surface (and any syncUrls) are already in resolvedSurfaceMap,
    // start the crossfade on this exact synchronous React commit tick (delta_ms = 0 across all siblings!)
    const activeSyncUrls = syncUrlsRef.current;
    const immediateSurface = resolvedSurfaceMap.get(src);
    const groupReady =
      !activeSyncUrls || activeSyncUrls.length === 0 || activeSyncUrls.every((u) => resolvedSurfaceMap.has(u));

    if (immediateSurface && groupReady) {
      const sharedStart = getSharedTransitionStartTime();
      paintAndCrossfade(immediateSurface, sharedStart);
    } else {
      const bundle = activeSyncUrls && activeSyncUrls.length > 0 ? [src, ...activeSyncUrls] : [src];
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
      resizeObserver?.disconnect();
      window.removeEventListener("resize", requestResizePaint);
      if (resizeRaf) window.cancelAnimationFrame(resizeRaf);
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [src, shouldLoad]);

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

    // Preserve the array identity when nothing visible in the inspector changed.
    setSlots((previous) => {
      const unchanged = previous.length === audited.length && previous.every((slot, index) => {
        const next = audited[index];
        return slot.element === next.element && slot.assetId === next.assetId &&
          slot.assetStem === next.assetStem && slot.contentHash === next.contentHash &&
          slot.label === next.label && slot.duplicateCount === next.duplicateCount &&
          (!showBadges || (slot.rect.top === next.rect.top && slot.rect.left === next.rect.left &&
            slot.rect.width === next.rect.width && slot.rect.height === next.rect.height));
      });
      return unchanged ? previous : audited;
    });
  }, [showBadges]);

  useEffect(() => {
    let frame = 0;
    const scheduleScan = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        scanDomAssets();
      });
    };
    const selector = 'canvas[data-protected-canvas="v39"]';
    const hasCanvas = (node: Node) => node instanceof Element &&
      (node.matches(selector) || Boolean(node.querySelector(selector)));
    const observer = new MutationObserver((records) => {
      if (records.some((record) => {
        const target = record.target;
        if (target instanceof Element &&
          target.closest('[data-audit-scope="ignore"], [data-testid="visual-asset-integrity-hud"]')) return false;
        return record.type === "childList"
          ? [...record.addedNodes, ...record.removedNodes].some(hasCanvas)
          : hasCanvas(target);
      })) scheduleScan();
    });
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-asset-id", "data-asset-stem", "data-content-hash",
        "data-audit-ignore", "data-audit-scope", "data-visual-slot", "aria-label",
        "class", "hidden", "aria-hidden"],
    });
    const onScroll = () => { if (showBadges) scheduleScan(); };
    const onTransitionEnd = (event: Event) => {
      if (event.target instanceof Node && hasCanvas(event.target)) scheduleScan();
    };
    scheduleScan();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleScan, { passive: true });
    document.addEventListener("transitionend", onTransitionEnd);
    document.addEventListener("animationend", onTransitionEnd);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleScan);
      document.removeEventListener("transitionend", onTransitionEnd);
      document.removeEventListener("animationend", onTransitionEnd);
    };
  }, [scanDomAssets, showBadges]);

  const totalCount = slots.length;
  const duplicateSlots = slots.filter((s) => s.isDuplicate);
  const duplicateCount = duplicateSlots.length;
  const uniqueCount = totalCount - duplicateCount;

  return (
    <div
      data-testid="visual-asset-integrity-hud"
      data-total-slots={totalCount}
      data-unique-slots={uniqueCount}
      data-duplicate-slots={duplicateCount}
      data-scope={scopeLabel ? "active" : "default"}
      translate="no"
      className="hidden"
      aria-hidden="true"
    />
  );
}
