"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import GuestPrivacyNotice from "../GuestPrivacyNotice";
import { useReviewInteractions } from "@/lib/use-review-interactions";
import {
  guestAnalyticsAllowed,
  guestAnalyticsRemainingMs,
  subscribeGuestPrivacy,
} from "@/lib/guest-privacy-client";
import { readViewerInteraction } from "@/lib/viewer-interaction-bridge";

type Props = {
  source: string;
  projectName: string;
  privacyNotice?: boolean;
  review?: { id: string; expiresAt: number; asOf: number };
  badgeText?: string;
  subtitle?: string;
  onClose?: () => void;
  onPrevProject?: () => void;
  onNextProject?: () => void;
};

const TAYCO_INLINE_CAD_CSS = [
  '.actions a.button.primary,a[href*="/assets/"],#openPdfLink{display:none!important;pointer-events:none!important}',
  "html,body{background:#06101e!important;color:#e2e8f0!important;margin:0!important;padding:0!important;height:100%!important;overflow:hidden!important;font-family:Inter,system-ui,-apple-system,sans-serif!important}",
  ".brand-bar,.site-footer,#catalog,.page-heading{display:none!important}",
  "#infoPanel:not(.tayco-sheet-index-open){display:none!important}",
  "#infoPanel.tayco-sheet-index-open{display:block!important;position:fixed!important;z-index:40!important;top:0!important;right:0!important;bottom:0!important;width:min(90vw,340px)!important;max-height:none!important;background:#081629!important;color:#f8fafc!important;border-left:1px solid rgba(212,175,55,0.35)!important;box-shadow:-12px 0 36px rgba(0,0,0,0.65)!important;padding:1rem!important;overflow-y:auto!important}",
  "#infoPanel.tayco-sheet-index-open h2,#infoPanel.tayco-sheet-index-open h3{color:#f3d37a!important;font-size:0.9rem!important;margin-top:0!important}",
  "#infoPanel.tayco-sheet-index-open p{color:#94a3b8!important;font-size:0.76rem!important}",
  "#infoPanel.tayco-sheet-index-open button{background:#0d2038!important;color:#e2e8f0!important;border:1px solid rgba(212,175,55,0.25)!important;border-radius:6px!important;padding:0.45rem 0.65rem!important;margin-bottom:0.35rem!important;width:100%!important;text-align:left!important;font-size:0.78rem!important;cursor:pointer!important}",
  "#infoPanel.tayco-sheet-index-open button:hover{background:rgba(212,175,55,0.18)!important;color:#f3d37a!important;border-color:rgba(212,175,55,0.5)!important}",
  "#infoPanel.tayco-sheet-index-open #closeInfo{width:auto!important;padding:0.2rem 0.55rem!important;color:#f3d37a!important}",
  ".app-shell{display:block!important;height:100dvh!important;width:100%!important;max-width:none!important;padding:0!important;margin:0!important;background:#06101e!important}",
  ".main-content,.main-content.document-open{height:100dvh!important;max-height:none!important;width:100%!important;padding:0!important;margin:0!important;border:0!important;border-radius:0!important;background:#06101e!important;box-shadow:none!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}",
  "#documentView{display:flex!important;flex-direction:column!important;flex:1 1 auto!important;min-height:0!important;height:100%!important;margin:0!important;padding:0!important}",
  ".reader-toolbar{height:0!important;min-height:0!important;overflow:hidden!important;padding:0!important;margin:0!important;border:0!important;opacity:0!important;pointer-events:none!important}",
  ".reader-frame{flex:1 1 auto!important;height:100dvh!important;min-height:0!important;width:100%!important;background:radial-gradient(circle at 50% 30%,#0e223d 0%,#06101e 100%)!important;border:0!important;border-radius:0!important;padding:1.25rem!important;margin:0!important;overflow:auto!important;display:flex!important;justify-content:center!important;align-items:flex-start!important;outline:none!important}",
  ".pdf-page-canvas{box-shadow:0 20px 55px rgba(0,0,0,0.8),0 0 0 1px rgba(212,175,55,0.3)!important;border-radius:4px!important;background:#ffffff!important}",
  ".reader-placeholder,.status-card{background:#0a192f!important;color:#f3d37a!important;border:1px solid rgba(212,175,55,0.3)!important;border-radius:10px!important;padding:1rem 1.25rem!important;margin:2rem auto!important;max-width:420px!important;text-align:center!important}",
].join("");

const button =
  "inline-flex min-h-9 items-center justify-center rounded-lg border border-amber-200/30 bg-[#0d2038]/90 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-200/15 hover:border-amber-200/50 focus-visible:outline-2 focus-visible:outline-amber-200 transition";

const cadToolBtn =
  "inline-flex h-8 items-center justify-center rounded-md border border-amber-200/25 bg-[#071324] px-2.5 text-xs font-semibold text-slate-200 hover:bg-amber-200/15 hover:text-amber-100 hover:border-amber-200/45 disabled:opacity-40 disabled:pointer-events-none transition";

export default function TakeoffProjectReader({
  source,
  projectName,
  review,
  privacyNotice = true,
  badgeText,
  subtitle,
  onClose,
  onPrevProject,
  onNextProject,
}: Props) {
  const [reload, setReload] = useState(0);
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sheetIndexOpen, setSheetIndexOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [expired, setExpired] = useState(false);
  const [ready, setReady] = useState<string | null>(null);

  const frame = useRef<HTMLIFrameElement>(null);
  const visit = useRef<string | null>(null);
  const record = useReviewInteractions(review?.id);
  const selectedDocument = new URL(source, "http://tayco.local").searchParams.get("document");

  const publish = useCallback(
    (reader = true) => {
      const remaining = guestAnalyticsRemainingMs(review?.id);
      const enabled =
        reader && !expired && remaining > 0 && guestAnalyticsAllowed(review?.id);
      frame.current?.contentWindow?.postMessage(
        {
          type: "tayco-review-viewer-control",
          taxonomyVersion: 2,
          enabled,
          remainingMs: enabled ? Math.min(remaining, 10800000) : 0,
        },
        window.location.origin
      );
    },
    [review?.id, expired]
  );

  const syncFrameState = useCallback(() => {
    try {
      const doc = frame.current?.contentDocument;
      if (!doc) return;
      const pageInput = doc.querySelector("#pageNumber") as HTMLInputElement | null;
      if (pageInput) {
        const val = Number(pageInput.value);
        const max = Number(pageInput.max);
        if (Number.isFinite(val) && val > 0) setCurrentPage(val);
        if (Number.isFinite(max) && max > 0) setTotalPages(max);
      }
      const zoomInput = doc.querySelector(
        '.reader-toolbar input[type="range"]'
      ) as HTMLInputElement | null;
      if (zoomInput) {
        const z = Number(zoomInput.value);
        if (Number.isFinite(z) && z > 0) setZoomPct(z);
      }
      const infoPanel = doc.querySelector("#infoPanel");
      if (infoPanel) {
        setSheetIndexOpen(infoPanel.classList.contains("tayco-sheet-index-open"));
      }
    } catch {
      // ignore cross-frame or transient states
    }
  }, []);

  useEffect(() => {
    if (!opened || failed) return;
    const interval = setInterval(syncFrameState, 350);
    return () => clearInterval(interval);
  }, [opened, failed, syncFrameState]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen]);

  useEffect(() => {
    if (!review || expired) return;
    const timer = setTimeout(
      () => {
        publish(false);
        setExpired(true);
      },
      Math.max(0, review.expiresAt - Math.max(review.asOf, Date.now()))
    );
    return () => clearTimeout(timer);
  }, [review, publish, expired]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (expired) return;
      const input = readViewerInteraction(event, {
        origin: window.location.origin,
        source: frame.current?.contentWindow,
      });
      if (input) {
        const { elementId, ...metadata } = input;
        record(elementId, metadata);
      }
    };
    window.addEventListener("message", receive);
    const unsubscribe = subscribeGuestPrivacy(() => publish());
    return () => {
      window.removeEventListener("message", receive);
      unsubscribe();
      publish(false);
    };
  }, [record, publish, expired]);

  useEffect(() => {
    if (!ready) return;
    visit.current ||= crypto.randomUUID();
    record("review.visit", {}, visit.current);
  }, [ready, record]);

  const stepPage = (delta: -1 | 1) => {
    try {
      const doc = frame.current?.contentDocument;
      if (!doc) return;
      const buttons = doc.querySelectorAll(".page-control button");
      const btn = (delta < 0 ? buttons[0] : buttons[1]) as HTMLButtonElement | undefined;
      if (btn && !btn.disabled) {
        btn.click();
        setTimeout(syncFrameState, 60);
      }
    } catch {
      // ignore
    }
  };

  const adjustZoom = (nextZoom: number) => {
    try {
      const doc = frame.current?.contentDocument;
      if (!doc) return;
      const zoomInput = doc.querySelector(
        '.reader-toolbar input[type="range"]'
      ) as HTMLInputElement | null;
      const clamped = Math.max(50, Math.min(200, nextZoom));
      if (zoomInput) {
        zoomInput.value = String(clamped);
        zoomInput.dispatchEvent(new Event("input", { bubbles: true }));
        zoomInput.dispatchEvent(new Event("change", { bubbles: true }));
        setZoomPct(clamped);
      }
    } catch {
      // ignore
    }
  };

  const toggleSheetIndex = () => {
    try {
      const doc = frame.current?.contentDocument;
      if (!doc) return;
      const infoPanel = doc.querySelector("#infoPanel") as HTMLElement | null;
      if (!infoPanel) return;
      infoPanel.hidden = false;
      const nextState = !infoPanel.classList.contains("tayco-sheet-index-open");
      infoPanel.classList.toggle("tayco-sheet-index-open", nextState);
      setSheetIndexOpen(nextState);
    } catch {
      // ignore
    }
  };

  if (expired)
    return (
      <section
        role="alert"
        className="rounded-xl border border-amber-200/30 p-6 text-slate-100"
      >
        <h2 className="text-xl font-bold">Review access has ended</h2>
        <p className="mt-3">
          The private reader has been removed. Signing in or refreshing does not
          renew this review.
        </p>
        <a href="/account" className={button + " mt-4"}>
          Account and access
        </a>
      </section>
    );

  return (
    <section
      className={
        (fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-[#050d1a] "
          : "min-w-0 overflow-hidden rounded-2xl border border-amber-200/25 bg-[#071324] shadow-2xl ") +
        "select-none"
      }
      aria-label="Protected project reader"
      data-testid="takeoff-cad-workstation"
      onContextMenu={(e) => e.preventDefault()}
    >
      {review && privacyNotice && (
        <div className="px-4">
          <GuestPrivacyNotice onReady={setReady} />
        </div>
      )}

      {/* Unified Executive CAD Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/20 bg-gradient-to-r from-[#081629] via-[#0b1d36] to-[#081629] px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {badgeText && (
              <span className="inline-flex items-center rounded-md border border-amber-300/35 bg-amber-300/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-200">
                {badgeText}
              </span>
            )}
            <span className="inline-flex items-center rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-200">
              Read only · Download controls hidden
            </span>
          </div>
          <h2 className="mt-1 truncate text-base font-bold text-white">
            Project reader · {projectName}
          </h2>
          <p role="status" className="mt-0.5 text-xs leading-relaxed text-slate-400">
            {subtitle ? `${subtitle} · ` : ""}
            {failed
              ? "The reader window could not be opened. Retry or return to the workspace."
              : opened
              ? "Canvas reader opened. Available document pages are shown inside the reader."
              : "Opening the private canvas reader…"}
          </p>
        </div>

        {/* Interactive CAD Sheet, Zoom & View Mode Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {(onPrevProject || onNextProject) && (
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#050e1c] p-1">
              <button
                type="button"
                onClick={onPrevProject}
                disabled={!onPrevProject}
                className={cadToolBtn}
                title="Previous project plan set"
              >
                ◀ Prev Set
              </button>
              <button
                type="button"
                onClick={onNextProject}
                disabled={!onNextProject}
                className={cadToolBtn}
                title="Next project plan set"
              >
                Next Set ▶
              </button>
            </div>
          )}

          {/* Sheet Navigation */}
          <div
            className="flex items-center gap-1.5 rounded-lg border border-amber-200/20 bg-[#050e1c] p-1"
            data-testid="cad-sheet-nav-group"
          >
            <button
              type="button"
              data-testid="cad-prev-sheet"
              onClick={() => stepPage(-1)}
              disabled={!opened || currentPage <= 1}
              className={cadToolBtn}
              title="Previous drawing sheet"
            >
              ← Prev
            </button>
            <span
              data-testid="cad-sheet-counter"
              className="px-2 font-mono text-xs font-bold text-amber-200"
            >
              Sheet {currentPage}
              {totalPages ? ` / ${totalPages}` : ""}
            </span>
            <button
              type="button"
              data-testid="cad-next-sheet"
              onClick={() => stepPage(1)}
              disabled={!opened || (totalPages !== null && currentPage >= totalPages)}
              className={cadToolBtn}
              title="Next drawing sheet"
            >
              Next →
            </button>
          </div>

          {/* Zoom Controls */}
          <div
            className="flex items-center gap-1 rounded-lg border border-amber-200/20 bg-[#050e1c] p-1"
            data-testid="cad-zoom-group"
          >
            <button
              type="button"
              data-testid="cad-zoom-out"
              onClick={() => adjustZoom(zoomPct - 20)}
              disabled={!opened || zoomPct <= 50}
              className={cadToolBtn}
              title="Zoom out (-20%)"
            >
              −
            </button>
            <button
              type="button"
              data-testid="cad-zoom-reset"
              onClick={() => adjustZoom(100)}
              disabled={!opened}
              className="px-2 font-mono text-xs font-bold text-slate-200 hover:text-amber-200"
              title="Reset zoom to 100%"
            >
              {zoomPct}%
            </button>
            <button
              type="button"
              data-testid="cad-zoom-in"
              onClick={() => adjustZoom(zoomPct + 20)}
              disabled={!opened || zoomPct >= 200}
              className={cadToolBtn}
              title="Zoom in (+20%)"
            >
              +
            </button>
          </div>

          {/* Sheet Index Drawer Toggle */}
          <button
            type="button"
            data-testid="cad-toggle-index"
            onClick={toggleSheetIndex}
            disabled={!opened}
            className={
              button +
              (sheetIndexOpen
                ? " border-amber-300 bg-amber-300/20 text-amber-100"
                : "")
            }
          >
            {sheetIndexOpen ? "Hide index" : "Sheet index"}
          </button>

          {/* Workstation Actions */}
          <button
            className={button}
            type="button"
            data-testid="cad-expand-toggle"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Standard height" : "Expand reader"}
          </button>
          <button
            className={button}
            type="button"
            data-testid="cad-fullscreen-toggle"
            onClick={() => setFullscreen((v) => !v)}
          >
            {fullscreen ? "Exit fullscreen" : "Fullscreen"}
          </button>
          <button
            className={button}
            type="button"
            data-testid="cad-reload-btn"
            onClick={() => {
              if (selectedDocument)
                record("viewer.reload", { documentId: selectedDocument });
              publish(false);
              setOpened(false);
              setFailed(false);
              setReload((value) => value + 1);
            }}
          >
            Reload reader
          </button>
          {onClose && (
            <button
              type="button"
              data-testid="cad-close-viewer-btn"
              onClick={() => {
                setFullscreen(false);
                onClose();
              }}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-rose-400/35 bg-rose-500/15 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/25 transition"
            >
              Close plans ✕
            </button>
          )}
        </div>
      </div>

      {failed && (
        <div
          role="alert"
          className="m-4 rounded-xl border border-amber-200/25 bg-amber-200/5 p-5 text-sm leading-relaxed text-slate-200"
        >
          The private reader is unavailable or your document access changed.
          Reload the reader to try again, or return to the workspace. No
          alternative public document link is used.
        </div>
      )}

      <div className={fullscreen ? "relative flex-1 min-h-0" : "relative"}>
        <iframe
          ref={frame}
          key={reload}
          title={projectName + " · source document reader"}
          src={source}
          loading="eager"
          referrerPolicy="same-origin"
          className={
            (failed ? "hidden " : "block ") +
            (fullscreen
              ? "h-full min-h-[calc(100dvh-105px)] "
              : expanded
              ? "h-[88svh] min-h-[34rem] sm:min-h-[46rem] "
              : "h-[clamp(440px,76svh,680px)] ") +
            "w-full border-0 bg-[#06101e]"
          }
          onLoad={(event) => {
            try {
              const document = event.currentTarget.contentDocument;
              const isReader =
                document?.contentType === "text/html" &&
                Boolean(document.querySelector("#mainContent"));
              if (document?.head) {
                let style = document.querySelector(
                  "#tayco-no-dl"
                ) as HTMLStyleElement | null;
                if (!style) {
                  style = document.createElement("style");
                  style.id = "tayco-no-dl";
                  document.head.appendChild(style);
                }
                style.textContent = TAYCO_INLINE_CAD_CSS;
              }
              for (const el of document?.querySelectorAll(
                '.actions a.button.primary,a[href*="/assets/"],#openPdfLink'
              ) ?? []) {
                el.removeAttribute("href");
                (el as HTMLElement).style.display = "none";
              }
              setOpened(isReader);
              setFailed(!isReader);
              publish(isReader);
              setTimeout(syncFrameState, 150);
            } catch {
              setOpened(false);
              setFailed(true);
            }
          }}
          onError={() => {
            setFailed(true);
            setOpened(false);
          }}
        />
        {opened && !failed && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          >
            <span className="-rotate-12 select-none text-center text-lg font-bold tracking-[0.28em] text-slate-500/15 sm:text-2xl">
              TAYCO · PRIVATE REVIEW · READ ONLY
            </span>
          </div>
        )}
      </div>

      <p className="border-t border-amber-200/15 bg-[#06101e] px-4 py-2.5 text-xs leading-relaxed text-slate-400">
        Read-only canvas access. Download controls are hidden; this does not
        prevent saving displayed content. Each document request is authorized
        separately. Recorded requests and optional control events do not
        establish that a person read a page.
      </p>
    </section>
  );
}
