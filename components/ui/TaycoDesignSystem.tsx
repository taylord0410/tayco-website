"use client";

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";
import { createPortal } from "react-dom";

/**
 * TAYCO V46 — Unified Architectural Design System (Astralis + Umbra + TAYCO Atelier)
 *
 * Core Invariants:
 * 1. Geometry Law: Zero sharp/pointed corners anywhere. Every element follows the soft-rounded scale:
 *    - Micro tags / status chips: rounded-lg (10px) or rounded-full
 *    - Controls / spec tiles / thumbnails: rounded-xl (14px) or rounded-2xl (18px)
 *    - Cards / Architectural panels: rounded-[24px] (1.5rem) to rounded-[28px] (1.75rem)
 *    - Interactive primary actions & filter docks: rounded-full (9999px)
 * 2. Alignment Equilibrium Law:
 *    - Macro-level (Section headers, eyebrows, filter docks, multi-card flex-wrap grids): Centered & symmetric (0 orphan grid holes).
 *    - Micro-level (Inside cards & studio panels): Balanced horizontal space utilization — split top meta bars, full-width readable copy,
 *      2-column deliverable/spec matrices on wide cards, and split horizontal footers.
 * 3. Umbra Event & Scroll Ownership Law:
 *    - When any gallery/studio/lightbox/drawer is open, background document scroll is 100% locked with scrollbar width compensation.
 *    - Wheel, touch, pointer, and keyboard events belong exclusively to the active topmost modal layer (0% scroll bleed to background).
 */
export const TAYCO_DESIGN_SYSTEM_V46 = {
  version: "46.0.0",
  synthesizedFrom: ["Astralis Command Glass", "Umbra Input Ownership", "TAYCO V45 Architectural Atelier"],
  radiusScale: {
    xs: "10px",
    sm: "14px",
    md: "18px",
    lg: "24px",
    xl: "28px",
    pill: "9999px",
  },
  alignmentLaw: {
    macro: "centered-symmetric-flex-wrap",
    micro: "horizontal-space-utilizing-editorial",
  },
  eventOwnership: "strict-modal-isolation-with-boundary-guard",
} as const;

/* ─────────────────────────────────────────────────────────────
 * GLOBAL REFERENCE-COUNTED MODAL & SCROLL ISOLATION ENGINE
 * ───────────────────────────────────────────────────────────── */
let activeModalLockCount = 0;
const openModalStack: symbol[] = [];
let savedHtmlOverflow = "";
let savedBodyOverflow = "";
let savedBodyOverscroll = "";
let savedBodyPaddingRight = "";
let savedOpenerElement: HTMLElement | null = null;

function isScrollableVertically(el: HTMLElement): boolean {
  if (el.scrollHeight <= el.clientHeight + 1) return false;
  const style = window.getComputedStyle(el);
  return style.overflowY === "auto" || style.overflowY === "scroll" || style.overflowY === "overlay";
}

function isScrollableHorizontally(el: HTMLElement): boolean {
  if (el.scrollWidth <= el.clientWidth + 1) return false;
  const style = window.getComputedStyle(el);
  return style.overflowX === "auto" || style.overflowX === "scroll" || style.overflowX === "overlay";
}

function findScrollableModalAncestor(
  target: EventTarget | null,
  axis: "y" | "x"
): HTMLElement | null {
  const start = target instanceof HTMLElement ? target : null;
  if (!start || !start.closest('[data-tayco-modal-root="true"]')) {
    return null;
  }
  let node: HTMLElement | null = start;
  while (node && node !== document.body && node !== document.documentElement) {
    if (node.dataset.taycoModalRoot === "true") {
      if (axis === "y" && isScrollableVertically(node)) return node;
      if (axis === "x" && isScrollableHorizontally(node)) return node;
      return null;
    }
    if (axis === "y" && isScrollableVertically(node)) {
      return node;
    }
    if (axis === "x" && isScrollableHorizontally(node)) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export interface UseTaycoGalleryLockOptions {
  isOpen: boolean;
  onClose: () => void;
  onStepPrev?: () => void;
  onStepNext?: () => void;
  enableStageWheelStep?: boolean;
  enableStageSwipe?: boolean;
}

export interface TaycoStageGestureHandlers {
  "data-tayco-wheel-stage": "true";
  onWheel: (e: ReactWheelEvent<HTMLElement>) => void;
  onPointerDown: (e: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLElement>) => void;
}

export function useTaycoGalleryLock({
  isOpen,
  onClose,
  onStepPrev,
  onStepNext,
  enableStageWheelStep = true,
  enableStageSwipe = true,
}: UseTaycoGalleryLockOptions) {
  const modalIdRef = useRef<symbol | null>(null);
  if (!modalIdRef.current) {
    modalIdRef.current = Symbol("tayco-modal-layer");
  }

  const onCloseRef = useRef(onClose);
  const onPrevRef = useRef(onStepPrev);
  const onNextRef = useRef(onStepNext);
  onCloseRef.current = onClose;
  onPrevRef.current = onStepPrev;
  onNextRef.current = onStepNext;

  const lastWheelStepAtRef = useRef<number>(0);
  const pointerStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const myId = modalIdRef.current!;
    openModalStack.push(myId);

    if (activeModalLockCount === 0) {
      const html = document.documentElement;
      const body = document.body;
      const scrollbarComp = Math.max(0, window.innerWidth - html.clientWidth);

      savedHtmlOverflow = html.style.overflow;
      savedBodyOverflow = body.style.overflow;
      savedBodyOverscroll = body.style.overscrollBehavior;
      savedBodyPaddingRight = body.style.paddingRight;
      savedOpenerElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      html.dataset.modalOpen = "true";
      body.dataset.modalOpen = "true";
      html.style.setProperty("--tayco-scrollbar-comp", `${scrollbarComp}px`);
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.overscrollBehavior = "none";
      if (scrollbarComp > 0) {
        body.style.paddingRight = `${scrollbarComp}px`;
      }
    }
    activeModalLockCount += 1;

    const isTopmostModal = () =>
      openModalStack.length > 0 && openModalStack[openModalStack.length - 1] === myId;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isTopmostModal()) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      const activeTag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      const isFormControl =
        activeTag === "input" ||
        activeTag === "textarea" ||
        activeTag === "select" ||
        (e.target as HTMLElement | null)?.isContentEditable;
      if (isFormControl) return;

      if (e.key === "ArrowLeft" && onPrevRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onPrevRef.current();
      } else if (e.key === "ArrowRight" && onNextRef.current) {
        e.preventDefault();
        e.stopPropagation();
        onNextRef.current();
      }
    };

    const handleDocumentWheelGuard = (e: globalThis.WheelEvent) => {
      if (!isTopmostModal()) return;
      if (e.ctrlKey) return; // preserve accessibility browser zoom

      const targetEl = e.target instanceof HTMLElement ? e.target : null;
      // Stage wheel handler manages its own stepping
      if (targetEl?.closest('[data-tayco-wheel-stage="true"]')) {
        return;
      }

      const isHorizontalIntent = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (isHorizontalIntent) {
        const scrollX = findScrollableModalAncestor(e.target, "x");
        if (!scrollX) {
          e.preventDefault();
          return;
        }
        const atLeft = e.deltaX < 0 && scrollX.scrollLeft <= 0;
        const atRight =
          e.deltaX > 0 && scrollX.scrollLeft + scrollX.clientWidth >= scrollX.scrollWidth - 1;
        if (atLeft || atRight) {
          e.preventDefault();
        }
        return;
      }

      const scrollY = findScrollableModalAncestor(e.target, "y");
      if (!scrollY) {
        e.preventDefault();
        return;
      }

      const atTop = e.deltaY < 0 && scrollY.scrollTop <= 0;
      const atBottom =
        e.deltaY > 0 && scrollY.scrollTop + scrollY.clientHeight >= scrollY.scrollHeight - 1;
      if (atTop || atBottom) {
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    let touchStartX = 0;

    const handleTouchStartGuard = (e: globalThis.TouchEvent) => {
      if (!isTopmostModal() || e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMoveGuard = (e: globalThis.TouchEvent) => {
      if (!isTopmostModal() || e.touches.length !== 1) return;
      const targetEl = e.target instanceof HTMLElement ? e.target : null;
      if (targetEl?.closest('input[type="range"], [data-tayco-free-drag="true"]')) {
        return;
      }

      const dx = touchStartX - e.touches[0].clientX;
      const dy = touchStartY - e.touches[0].clientY;

      if (Math.abs(dx) > Math.abs(dy)) {
        if (targetEl?.closest('[data-tayco-wheel-stage="true"]')) return;
        const scrollX = findScrollableModalAncestor(e.target, "x");
        if (!scrollX) {
          e.preventDefault();
        }
        return;
      }

      const scrollY = findScrollableModalAncestor(e.target, "y");
      if (!scrollY) {
        e.preventDefault();
        return;
      }
      const atTop = dy < 0 && scrollY.scrollTop <= 0;
      const atBottom =
        dy > 0 && scrollY.scrollTop + scrollY.clientHeight >= scrollY.scrollHeight - 1;
      if (atTop || atBottom) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleDocumentWheelGuard, { passive: false });
    window.addEventListener("touchstart", handleTouchStartGuard, { passive: true });
    window.addEventListener("touchmove", handleTouchMoveGuard, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleDocumentWheelGuard);
      window.removeEventListener("touchstart", handleTouchStartGuard);
      window.removeEventListener("touchmove", handleTouchMoveGuard);

      const idx = openModalStack.lastIndexOf(myId);
      if (idx !== -1) openModalStack.splice(idx, 1);

      activeModalLockCount = Math.max(0, activeModalLockCount - 1);
      if (activeModalLockCount === 0) {
        const html = document.documentElement;
        const body = document.body;
        delete html.dataset.modalOpen;
        delete body.dataset.modalOpen;
        html.style.removeProperty("--tayco-scrollbar-comp");
        html.style.overflow = savedHtmlOverflow;
        body.style.overflow = savedBodyOverflow;
        body.style.overscrollBehavior = savedBodyOverscroll;
        body.style.paddingRight = savedBodyPaddingRight;

        const opener = savedOpenerElement;
        savedOpenerElement = null;
        if (opener && opener.isConnected && opener.getClientRects().length > 0) {
          try {
            opener.focus({ preventScroll: true });
          } catch {
            // Ignore focus error on detached or disabled controls
          }
        }
      }
    };
  }, [isOpen]);

  const handleStageWheel = useCallback(
    (e: ReactWheelEvent<HTMLElement>) => {
      if (e.ctrlKey) return;
      e.stopPropagation();
      if (!enableStageWheelStep || (!onPrevRef.current && !onNextRef.current)) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const dominantDelta =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(dominantDelta) < 16) return;

      const now = Date.now();
      if (now - lastWheelStepAtRef.current < 260) return;
      lastWheelStepAtRef.current = now;

      if (dominantDelta > 0) {
        onNextRef.current?.();
      } else {
        onPrevRef.current?.();
      }
    },
    [enableStageWheelStep]
  );

  const handleStagePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enableStageSwipe) return;
      const targetEl = e.target instanceof HTMLElement ? e.target : null;
      if (
        targetEl?.closest(
          'button, a, input, select, textarea, [data-no-stage-swipe="true"]'
        )
      ) {
        pointerStartRef.current = null;
        return;
      }
      pointerStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        pointerId: e.pointerId,
      };
    },
    [enableStageSwipe]
  );

  const handleStagePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enableStageSwipe || !pointerStartRef.current) return;
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (start.pointerId !== e.pointerId) return;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.abs(dx) < 44 || Math.abs(dx) < Math.abs(dy) * 1.3) return;

      if (dx < 0) {
        onNextRef.current?.();
      } else {
        onPrevRef.current?.();
      }
    },
    [enableStageSwipe]
  );

  const stageGestureHandlers: TaycoStageGestureHandlers = {
    "data-tayco-wheel-stage": "true",
    onWheel: handleStageWheel,
    onPointerDown: handleStagePointerDown,
    onPointerUp: handleStagePointerUp,
  };

  return { stageGestureHandlers };
}

/* ─────────────────────────────────────────────────────────────
 * PORTAL MODAL OVERLAY — IMMUNE TO 3D TRANSFORM STACKING CONTEXTS
 * ───────────────────────────────────────────────────────────── */
export interface TaycoModalOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onStepPrev?: () => void;
  onStepNext?: () => void;
  enableStageWheelStep?: boolean;
  enableStageSwipe?: boolean;
  ariaLabel: string;
  zIndexClassName?: string;
  backdropClassName?: string;
  containerClassName?: string;
  children:
    | ReactNode
    | ((controls: { stageGestureHandlers: TaycoStageGestureHandlers }) => ReactNode);
}

export function TaycoModalOverlay({
  isOpen,
  onClose,
  onStepPrev,
  onStepNext,
  enableStageWheelStep = true,
  enableStageSwipe = true,
  ariaLabel,
  zIndexClassName = "z-[120]",
  backdropClassName = "bg-[#040913]/92 backdrop-blur-xl",
  containerClassName = "flex items-center justify-center p-2 sm:p-4 lg:p-5",
  children,
}: TaycoModalOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lock = useTaycoGalleryLock({
    isOpen,
    onClose,
    onStepPrev,
    onStepNext,
    enableStageWheelStep,
    enableStageSwipe,
  });

  if (!isOpen || !mounted || typeof document === "undefined") {
    return null;
  }

  const content =
    typeof children === "function" ? children(lock) : children;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      data-tayco-modal-root="true"
      className={`fixed inset-0 ${zIndexClassName} ${backdropClassName} ${containerClassName} overscroll-contain`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {content}
    </div>,
    document.body
  );
}

/* ─────────────────────────────────────────────────────────────
 * V46 REUSABLE DESIGN SYSTEM OBJECTS & ALIGNMENT PRIMITIVES
 * ───────────────────────────────────────────────────────────── */

export function TaycoSectionHeader({
  eyebrow,
  title,
  subtitle,
  badge,
  actions,
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto flex max-w-4xl flex-col items-center text-center ${className}`}>
      {(eyebrow || badge) && (
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2.5">
          {eyebrow && (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#d4af5a]/35 bg-[#0a162b]/90 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#f3d98b] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e5c158]" />
              {eyebrow}
            </span>
          )}
          {badge}
        </div>
      )}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 line-clamp-3 sm:mt-3.5 sm:line-clamp-none sm:text-base">
          {subtitle}
        </p>
      )}
      {actions && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

export function TaycoPillDock({
  children,
  ariaLabel,
  className = "",
}: {
  children: ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <div
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
      className={`mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 max-sm:w-full max-sm:flex-nowrap max-sm:justify-start max-sm:overflow-x-auto tayco-no-scrollbar [&>*]:max-sm:shrink-0 [&>*]:max-sm:whitespace-nowrap rounded-[24px] border border-[#d4af5a]/30 bg-[#071020]/90 p-1.5 shadow-[0_16px_38px_-14px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.07)] xl:rounded-full ${className}`}
    >
      {children}
    </div>
  );
}

export function TaycoCardMetaBar({
  leftBadge,
  rightMeta,
  className = "",
}: {
  leftBadge: ReactNode;
  rightMeta?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">{leftBadge}</div>
      {rightMeta && (
        <div className="flex items-center gap-2 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-300">
          {rightMeta}
        </div>
      )}
    </div>
  );
}

export function TaycoSpecGrid({
  items,
  columns = 3,
  className = "",
}: {
  items: Array<{ label: string; value: ReactNode }>;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    columns === 2
      ? "grid-cols-2"
      : columns === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={`grid ${colClass} gap-1.5 sm:gap-2 ${className}`}>
      {items.map((item, idx) => (
        <div
          key={`${item.label}-${idx}`}
          className="rounded-2xl border border-white/[0.09] bg-[#070f1d]/80 px-2.5 py-2 sm:px-3 sm:py-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {item.label}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-100 sm:text-[13px]">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function TaycoDeliverableGrid({
  items,
  columns = 2,
  className = "",
}: {
  items: string[];
  columns?: 1 | 2;
  className?: string;
}) {
  const gridCols = columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1";
  return (
    <ul className={`grid ${gridCols} gap-2 text-left ${className}`}>
      {items.map((item, idx) => (
        <li
          key={item}
          className={`${idx >= 2 ? "hidden sm:flex" : "flex"} items-start gap-2.5 rounded-xl border border-white/[0.07] bg-[#081224]/70 px-3 py-2 text-xs leading-snug text-slate-200/95`}
        >
          <span
            aria-hidden="true"
            className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e5c158] shadow-[0_0_8px_rgba(229,193,88,0.65)]"
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TaycoCardFooterBar({
  leftMeta,
  children,
  className = "",
}: {
  leftMeta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mt-auto flex flex-col items-stretch justify-between gap-3 border-t border-white/[0.09] pt-4 sm:flex-row sm:items-center ${className}`}
    >
      {leftMeta && (
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300 sm:justify-start">
          {leftMeta}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:ml-auto sm:justify-end">
        {children}
      </div>
    </div>
  );
}
