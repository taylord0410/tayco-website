"use client";

import { useState } from "react";
import Link from "next/link";
import ProtectedImage from "@/components/ProtectedImage";
import { TaycoModalOverlay } from "@/components/ui/TaycoDesignSystem";

export interface HomeGalleryFrame {
  src: string;
  title: string;
  eyebrow: string;
  description?: string;
  details?: string[];
}

export interface HomeGallerySelection {
  title: string;
  frames: HomeGalleryFrame[];
  index: number;
}

export function HomeEditorialCard({
  number, eyebrow, title, description, image, frames, actionLabel, onOpen, href,
}: {
  number?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  image: HomeGalleryFrame;
  frames?: HomeGalleryFrame[];
  actionLabel: string;
  onOpen: () => void;
  href?: string;
}) {
  return (
    <article className="home-editorial-card">
      <button type="button" className="home-editorial-photo" onClick={onOpen}
        aria-label={`Open gallery: ${title}`} aria-haspopup="dialog">
        <ProtectedImage src={image.src} alt={image.title} loading="lazy"
          className="h-full w-full object-cover" />
      </button>
      {frames && frames.length > 1 && (
        <div className="grid grid-cols-3 gap-1.5 px-3 pt-2 bg-[#070E1A]">
          {frames.slice(0, 3).map((f, idx) => (
            <button
              key={`${f.src}-${idx}`}
              type="button"
              onClick={onOpen}
              className="relative h-14 rounded-lg overflow-hidden border border-white/15 hover:border-[#F3D37A] transition-all cursor-pointer"
              aria-label={f.title}
            >
              <ProtectedImage
                src={f.src}
                auditIgnore={idx === 0}
                alt={f.title}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
      <div className="home-editorial-panel">
        <h3 className="home-editorial-title">{title}</h3>
        {href ? (
          <Link href={href} className="home-editorial-action">
            <span>{actionLabel}</span><span aria-hidden="true">→</span>
          </Link>
        ) : (
          <button type="button" onClick={onOpen} className="home-editorial-action" aria-haspopup="dialog">
            <span>{actionLabel}</span><span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </article>
  );
}

/** Uses the same portal, scroll lock, Escape/arrows and swipe as the other studios. */
export function HomeEditorialGallery({ selection, onClose }: {
  selection: HomeGallerySelection;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(selection.index);
  const frame = selection.frames[index];
  const step = (delta: number) => setIndex((current) =>
    (current + delta + selection.frames.length) % selection.frames.length);

  return (
    <TaycoModalOverlay isOpen onClose={onClose} ariaLabel={`${selection.title} gallery`}
      onStepPrev={() => step(-1)} onStepNext={() => step(1)} enableStageWheelStep={true} enableStageSwipe={true}
      backdropClassName="bg-[#040913] backdrop-blur-xl">
      {({ stageGestureHandlers }) => (
        <div
          className="home-editorial-gallery relative w-full max-w-[1280px] rounded-[26px] border overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.95)] h-[94dvh] min-h-[94dvh] max-h-[94dvh] flex flex-col bg-[#050A14]"
          style={{
            borderColor: "rgba(201, 168, 76, 0.38)",
            boxShadow:
              "0 40px 120px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not([disabled]), a[href], [tabindex="0"]'));
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault(); last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault(); first?.focus();
            }
          }}
        >
          <header
            className="home-gallery-header px-4 sm:px-6 py-2.5 border-b flex items-center justify-between gap-3 shrink-0"
            style={{
              background: "#060C18",
              borderColor: "rgba(255, 255, 255, 0.08)",
            }}
          >
            <span className="home-gallery-counter text-xs font-mono font-bold text-[#F3D37A]">
              {index + 1} / {selection.frames.length}
            </span>
            <button
              type="button"
              autoFocus
              data-magnetic
              className="home-gallery-control inline-flex items-center justify-center min-h-[44px] min-w-[44px] w-11 h-11 rounded-full text-sm font-sans font-semibold bg-white/5 text-slate-200 border border-white/15 cursor-pointer hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300"
              onClick={onClose}
              aria-label="Close gallery"
            >
              ✕
            </button>
          </header>
          <div className="home-gallery-stage relative flex-1 min-h-0 w-full overflow-hidden select-none bg-[#03060D] cursor-grab active:cursor-grabbing" {...stageGestureHandlers}>
            <ProtectedImage src={frame.src} alt="" auditIgnore loading="eager"
              className="home-gallery-backdrop" />
            <ProtectedImage src={frame.src} alt={frame.title} loading="eager"
              className="home-gallery-main-image h-full w-full object-contain" />
            {selection.frames.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous photograph"
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#050A14] border border-white/25 text-white hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300 cursor-pointer flex items-center justify-center shadow-2xl z-20"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photograph"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#050A14] border border-white/25 text-white hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300 cursor-pointer flex items-center justify-center shadow-2xl z-20"
                >
                  ›
                </button>
              </>
            )}
          </div>
          <footer className="home-gallery-footer px-4 sm:px-6 py-3 bg-[#050A14] border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 shrink-0">
            <h3 className="tayco-card-title text-sm sm:text-lg text-white tracking-tight truncate text-center sm:text-left">
              {frame.title}
            </h3>
            <Link
              href="/estimate"
              data-magnetic
              className="tayco-atelier-btn-gold !min-h-[42px] !px-4 !py-2 text-xs font-bold whitespace-nowrap shrink-0 text-center justify-center"
            >
              Request Estimate
            </Link>
          </footer>
        </div>
      )}
    </TaycoModalOverlay>
  );
}
