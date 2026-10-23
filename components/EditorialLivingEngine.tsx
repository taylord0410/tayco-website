"use client";
import { useEffect } from "react";

const SURFACE_SELECTOR =
  '[data-response-kind="surface"], .tayco-living-card, [data-living-card]';
const MAGNETIC_SELECTOR = "[data-magnetic]";

export default function EditorialLivingEngine() {
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    let paused = false;
    try {
      paused = localStorage.getItem("tayco-motion-paused") === "1";
    } catch {
      paused = false;
    }

    const applyMotionState = (isPaused: boolean) => {
      paused = isPaused;
      if (isPaused) {
        document.body.dataset.motion = "reduced";
      } else {
        delete document.body.dataset.motion;
      }
      try {
        localStorage.setItem("tayco-motion-paused", isPaused ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      window.dispatchEvent(
        new CustomEvent("tayco:motion-state", { detail: { paused: isPaused } })
      );
    };

    applyMotionState(paused);

    let rafId = 0;
    let pointerX = 0;
    let pointerY = 0;
    let hoveredSurface: HTMLElement | null = null;
    let hoveredMagnetic: HTMLElement | null = null;

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
      el.style.setProperty("--response-rx", "0deg");
      el.style.setProperty("--response-ry", "0deg");
      delete el.dataset.responseHover;
    };

    const resetMagnetic = (el: HTMLElement | null) => {
      if (!el) return;
      el.style.setProperty("--mag-x", "0px");
      el.style.setProperty("--mag-y", "0px");
    };

    const updateFrame = () => {
      rafId = 0;
      const field = document.querySelector<HTMLElement>("[data-atmosphere-field]");
      const thread = document.querySelector<HTMLElement>("[data-reading-thread]");

      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));

      if (thread) {
        thread.style.setProperty("--reading-progress", progress.toFixed(4));
        thread.style.transform = `scaleX(${progress.toFixed(4)})`;
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
        ensureWashLayer(hoveredSurface);
        const rect = hoveredSurface.getBoundingClientRect();
        const relX = Math.max(
          -0.5,
          Math.min(0.5, (pointerX - rect.left) / Math.max(1, rect.width) - 0.5)
        );
        const relY = Math.max(
          -0.5,
          Math.min(0.5, (pointerY - rect.top) / Math.max(1, rect.height) - 0.5)
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
        const rect = hoveredMagnetic.getBoundingClientRect();
        const relX = Math.max(
          -0.5,
          Math.min(0.5, (pointerX - rect.left) / Math.max(1, rect.width) - 0.5)
        );
        const relY = Math.max(
          -0.5,
          Math.min(0.5, (pointerY - rect.top) / Math.max(1, rect.height) - 0.5)
        );
        hoveredMagnetic.style.setProperty("--mag-x", `${(relX * 7).toFixed(2)}px`);
        hoveredMagnetic.style.setProperty("--mag-y", `${(relY * 7).toFixed(2)}px`);
      }
    };

    const scheduleFrame = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(updateFrame);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      pointerX = e.clientX;
      pointerY = e.clientY;

      const target = e.target instanceof Element ? e.target : null;
      const nextSurface = target
        ? target.closest<HTMLElement>(SURFACE_SELECTOR)
        : null;
      const nextMagnetic = target
        ? target.closest<HTMLElement>(MAGNETIC_SELECTOR)
        : null;

      if (nextSurface !== hoveredSurface) {
        resetSurface(hoveredSurface);
        hoveredSurface = nextSurface;
        if (hoveredSurface && !paused) {
          hoveredSurface.dataset.responseHover = "true";
          ensureWashLayer(hoveredSurface);
        }
      }

      if (nextMagnetic !== hoveredMagnetic) {
        resetMagnetic(hoveredMagnetic);
        hoveredMagnetic = nextMagnetic;
      }

      scheduleFrame();
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (paused || e.button !== 0) return;
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;

      const surface = target.closest<HTMLElement>(SURFACE_SELECTOR);
      if (!surface) return;

      const wash = ensureWashLayer(surface);
      const rect = surface.getBoundingClientRect();
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
      resetSurface(hoveredSurface);
      resetMagnetic(hoveredMagnetic);
      hoveredSurface = null;
      hoveredMagnetic = null;
    };

    const handleToggleMotion = (e: Event) => {
      const custom = e as CustomEvent<{ paused?: boolean }>;
      const nextPaused =
        typeof custom.detail?.paused === "boolean"
          ? custom.detail.paused
          : !paused;
      applyMotionState(nextPaused);
      if (nextPaused) {
        resetSurface(hoveredSurface);
        resetMagnetic(hoveredMagnetic);
      }
      scheduleFrame();
    };

    window.addEventListener("scroll", scheduleFrame, { signal, passive: true });
    window.addEventListener("resize", scheduleFrame, { signal, passive: true });
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
    };
  }, []);

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
