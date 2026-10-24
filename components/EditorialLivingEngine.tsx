"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SURFACE_SELECTOR =
  '[data-response-kind="surface"], .tayco-living-card, [data-living-card], [data-tilt]';
const MAGNETIC_SELECTOR = "[data-magnetic]";

export default function EditorialLivingEngine() {
  const pathname = usePathname();
  const isExcludedRoute = Boolean(
    pathname && (pathname.startsWith("/portal") || pathname.startsWith("/account"))
  );

  useEffect(() => {
    if (isExcludedRoute) return;

    const controller = new AbortController();
    const { signal } = controller;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let userPaused = false;
    try {
      userPaused = localStorage.getItem("tayco-motion-paused") === "1";
    } catch {
      // Motion remains available when preference storage is unavailable.
    }
    let paused = userPaused || motionPreference.matches;

    const applyMotionState = () => {
      paused = userPaused || motionPreference.matches;
      document.body.dataset.motion = paused ? "reduced" : "full";
      window.dispatchEvent(
        new CustomEvent("tayco:motion-state", { detail: { paused } })
      );
    };

    applyMotionState();

    let rafId = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pendingPointerX = 0;
    let pendingPointerY = 0;
    let pendingTarget: Element | null = null;
    let hasPendingPointer = false;

    let hoveredSurface: HTMLElement | null = null;
    let hoveredMagnetic: HTMLElement | null = null;

    let surfaceRect: { left: number; top: number; width: number; height: number } | null = null;
    let magneticRect: { left: number; top: number; width: number; height: number } | null = null;

    const ensureWashLayer = (surface: HTMLElement) => {
      let wash = surface.querySelector<HTMLElement>(":scope > .response-wash");
      if (!wash) {
        wash = document.createElement("span");
        wash.className = "response-wash";
        wash.setAttribute("aria-hidden", "true");
        surface.appendChild(wash);
      }
      return wash;
    };

    const resetSurface = (el: HTMLElement | null) => {
      if (!el) return;
      // Re-enable smooth transition for return to neutral position
      el.style.transition =
        "transform 0.55s cubic-bezier(0.2, 0.7, 0.2, 1), box-shadow 0.35s, border-color 0.35s";
      el.style.setProperty("--response-rx", "0deg");
      el.style.setProperty("--response-ry", "0deg");
      delete el.dataset.responseHover;
      surfaceRect = null;
    };

    const resetMagnetic = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.transition =
        "translate 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.3s, border-color 0.3s";
      el.style.setProperty("--mag-x", "0px");
      el.style.setProperty("--mag-y", "0px");
      delete el.dataset.magneticActive;
      magneticRect = null;
    };

    const invalidateRects = () => {
      surfaceRect = null;
      magneticRect = null;
    };

    const updateFrame = () => {
      rafId = 0;
      if (document.hidden || document.visibilityState === "hidden") return;

      if (hasPendingPointer) {
        pointerX = pendingPointerX;
        pointerY = pendingPointerY;
        const target = pendingTarget;
        hasPendingPointer = false;

        // Operational records and forms keep fixed hit targets.
        const nextSurface = target && !target.closest(".workspace-shell")
          ? target.closest<HTMLElement>(SURFACE_SELECTOR)
          : null;
        const nextMagnetic = target
          ? target.closest<HTMLElement>(MAGNETIC_SELECTOR)
          : null;

        if (nextSurface !== hoveredSurface) {
          resetSurface(hoveredSurface);
          hoveredSurface = nextSurface;
          surfaceRect = null;
          if (hoveredSurface && !paused) {
            hoveredSurface.dataset.responseHover = "true";
            // Disable transform transition while tracking to avoid fighting JS updates
            hoveredSurface.style.transition = "box-shadow 0.35s, border-color 0.35s";
            ensureWashLayer(hoveredSurface);
            const r = hoveredSurface.getBoundingClientRect();
            surfaceRect = { left: r.left, top: r.top, width: r.width, height: r.height };
          }
        }

        if (nextMagnetic !== hoveredMagnetic) {
          resetMagnetic(hoveredMagnetic);
          hoveredMagnetic = nextMagnetic;
          magneticRect = null;
          if (hoveredMagnetic && !paused) {
            hoveredMagnetic.dataset.magneticActive = "true";
            hoveredMagnetic.style.transition = "box-shadow 0.3s, border-color 0.3s";
            const r = hoveredMagnetic.getBoundingClientRect();
            magneticRect = { left: r.left, top: r.top, width: r.width, height: r.height };
          }
        }
      }

      const field = document.querySelector<HTMLElement>("[data-atmosphere-field]");
      const thread = document.querySelector<HTMLElement>("[data-reading-thread]");

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));

      if (thread) {
        thread.style.setProperty("--reading-progress", progress.toFixed(4));
      }

      if (paused) {
        if (field) {
          field.style.setProperty("--pointer-x", "0%");
          field.style.setProperty("--pointer-y", "0%");
          field.style.setProperty("--scroll-drift", "0%");
        }
        return;
      }

      if (field) {
        const normX = (pointerX / Math.max(1, window.innerWidth)) * 2 - 1;
        const normY = (pointerY / Math.max(1, window.innerHeight)) * 2 - 1;
        const drift = Math.sin(progress * Math.PI * 2) * 6;
        field.style.setProperty("--pointer-x", `${(normX * 2.8).toFixed(2)}%`);
        field.style.setProperty("--pointer-y", `${(normY * 2.8).toFixed(2)}%`);
        field.style.setProperty("--scroll-drift", `${drift.toFixed(2)}%`);
      }

      if (hoveredSurface) {
        if (!surfaceRect) {
          const r = hoveredSurface.getBoundingClientRect();
          surfaceRect = { left: r.left, top: r.top, width: r.width, height: r.height };
        }
        const relX = Math.max(
          -0.5,
          Math.min(0.5, (pointerX - surfaceRect.left) / Math.max(1, surfaceRect.width) - 0.5)
        );
        const relY = Math.max(
          -0.5,
          Math.min(0.5, (pointerY - surfaceRect.top) / Math.max(1, surfaceRect.height) - 0.5)
        );
        const px = (relX * 100 + 50).toFixed(1) + "%";
        const py = (relY * 100 + 50).toFixed(1) + "%";
        const rx = (-relY * 4).toFixed(2) + "deg";
        const ry = (relX * 4).toFixed(2) + "deg";

        hoveredSurface.style.setProperty("--response-px", px);
        hoveredSurface.style.setProperty("--response-py", py);
        hoveredSurface.style.setProperty("--response-rx", rx);
        hoveredSurface.style.setProperty("--response-ry", ry);
      }

      if (hoveredMagnetic) {
        if (!magneticRect) {
          const r = hoveredMagnetic.getBoundingClientRect();
          magneticRect = { left: r.left, top: r.top, width: r.width, height: r.height };
        }
        const relX = Math.max(
          -0.5,
          Math.min(0.5, (pointerX - magneticRect.left) / Math.max(1, magneticRect.width) - 0.5)
        );
        const relY = Math.max(
          -0.5,
          Math.min(0.5, (pointerY - magneticRect.top) / Math.max(1, magneticRect.height) - 0.5)
        );
        hoveredMagnetic.style.setProperty("--mag-x", `${(relX * 7).toFixed(2)}px`);
        hoveredMagnetic.style.setProperty("--mag-y", `${(relY * 7).toFixed(2)}px`);
      }
    };

    const scheduleFrame = () => {
      if (!rafId && !document.hidden && document.visibilityState !== "hidden") {
        rafId = window.requestAnimationFrame(updateFrame);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (
        paused ||
        document.hidden ||
        document.visibilityState === "hidden" ||
        e.pointerType === "touch"
      ) {
        return;
      }
      pendingPointerX = e.clientX;
      pendingPointerY = e.clientY;
      pendingTarget = e.target instanceof Element ? e.target : null;
      hasPendingPointer = true;
      scheduleFrame();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (
        paused ||
        document.hidden ||
        document.visibilityState === "hidden" ||
        e.button !== 0
      ) {
        return;
      }
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (target.closest(".workspace-shell")) return;

      const surface = target.closest<HTMLElement>(SURFACE_SELECTOR);
      if (!surface) return;

      const wash = ensureWashLayer(surface);
      if (!surfaceRect || hoveredSurface !== surface) {
        const r = surface.getBoundingClientRect();
        surfaceRect = { left: r.left, top: r.top, width: r.width, height: r.height };
      }
      const rect = surfaceRect;
      const px = Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / Math.max(1, rect.width)) * 100)
      );
      const py = Math.max(
        0,
        Math.min(100, ((e.clientY - rect.top) / Math.max(1, rect.height)) * 100)
      );
      surface.style.setProperty("--response-px", `${px.toFixed(1)}%`);
      surface.style.setProperty("--response-py", `${py.toFixed(1)}%`);

      try {
        surface.animate(
          [
            { scale: "1" },
            { scale: "0.992", offset: 0.22 },
            { scale: "1.006", offset: 0.62 },
            { scale: "1" },
          ],
          { duration: 460, easing: "cubic-bezier(0.2, 0.7, 0.2, 1)" }
        );
        wash.animate(
          [
            { opacity: 0.15, scale: "0.97" },
            { opacity: 0.9, scale: "1", offset: 0.28 },
            { opacity: 0.22, scale: "1.03" },
          ],
          { duration: 540, easing: "ease-out" }
        );
      } catch {
        // Fallback if Web Animations API is unavailable
      }
    };

    const handlePointerLeaveDocument = () => {
      hasPendingPointer = false;
      pendingTarget = null;
      resetSurface(hoveredSurface);
      resetMagnetic(hoveredMagnetic);
      hoveredSurface = null;
      hoveredMagnetic = null;
      surfaceRect = null;
      magneticRect = null;
    };

    const handleToggleMotion = (e: Event) => {
      const custom = e as CustomEvent<{ paused?: boolean }>;
      const nextPaused =
        typeof custom.detail?.paused === "boolean"
          ? custom.detail.paused
          : !paused;
      userPaused = nextPaused;
      try {
        localStorage.setItem("tayco-motion-paused", userPaused ? "1" : "0");
      } catch {
        // The in-memory preference still works without local storage.
      }
      applyMotionState();
      if (paused) {
        resetSurface(hoveredSurface);
        resetMagnetic(hoveredMagnetic);
      }
      scheduleFrame();
    };

    const handleSystemMotion = () => {
      applyMotionState();
      if (paused) {
        resetSurface(hoveredSurface);
        resetMagnetic(hoveredMagnetic);
      }
      scheduleFrame();
    };

    const handleVisibility = () => {
      const isHidden = document.hidden || document.visibilityState === "hidden";
      document.body.dataset.visibility = isHidden ? "hidden" : "visible";
      if (isHidden) {
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
        handlePointerLeaveDocument();
      } else {
        scheduleFrame();
      }
    };

    const handleScrollOrResize = () => {
      invalidateRects();
      scheduleFrame();
    };

    document.body.dataset.visibility =
      document.hidden || document.visibilityState === "hidden" ? "hidden" : "visible";
    motionPreference.addEventListener("change", handleSystemMotion);
    document.addEventListener("visibilitychange", handleVisibility, { signal });

    window.addEventListener("scroll", handleScrollOrResize, { signal, passive: true });
    window.addEventListener("resize", handleScrollOrResize, { signal, passive: true });
    document.addEventListener("pointermove", handlePointerMove, {
      signal,
      passive: true,
    });
    document.addEventListener("pointerdown", handlePointerDown, { signal });
    document.documentElement.addEventListener(
      "pointerleave",
      handlePointerLeaveDocument,
      { signal }
    );
    window.addEventListener("tayco:toggle-motion", handleToggleMotion, {
      signal,
    });

    scheduleFrame();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      controller.abort();
      motionPreference.removeEventListener("change", handleSystemMotion);
      resetSurface(hoveredSurface);
      resetMagnetic(hoveredMagnetic);
    };
  }, [isExcludedRoute]);

  if (isExcludedRoute) {
    return null;
  }

  return (
    <>
      <div
        className="tayco-atmosphere"
        aria-hidden="true"
        data-atmosphere-field
      >
        <div className="atmosphere-parallax">
          <div className="ambient-lobe a" />
          <div className="ambient-lobe b" />
          <div className="ambient-contours" />
        </div>
        <div className="ambient-grain" />
      </div>
      <div className="reading-thread" aria-hidden="true">
        <i data-reading-thread />
      </div>
    </>
  );
}
