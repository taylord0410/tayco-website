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
      onStepPrev={() => step(-1)} onStepNext={() => step(1)} enableStageWheelStep={true} enableStageSwipe={true}>
      {({ stageGestureHandlers }) => (
        <div className="home-editorial-gallery" onKeyDown={(event) => {
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
        }}>
          <header className="home-gallery-header">
            <span className="home-gallery-counter">{index + 1} / {selection.frames.length}</span>
            <button type="button" autoFocus className="home-gallery-control" onClick={onClose} aria-label="Close gallery">✕</button>
          </header>
          <div className="home-gallery-stage" {...stageGestureHandlers}>
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
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#050A14]/75 backdrop-blur-xl border border-white/25 text-white hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300 cursor-pointer flex items-center justify-center shadow-2xl z-20"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next photograph"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#050A14]/75 backdrop-blur-xl border border-white/25 text-white hover:bg-[#C9A84C] hover:text-[#050A14] hover:border-[#C9A84C] transition-all duration-300 cursor-pointer flex items-center justify-center shadow-2xl z-20"
                >
                  ›
                </button>
              </>
            )}
          </div>
          <footer className="home-gallery-footer">
            <h3 className="home-editorial-title text-base sm:text-lg truncate">{frame.title}</h3>
            <Link
              href="/estimate"
              data-magnetic
              className="tayco-atelier-btn-gold !min-h-[40px] !px-4 !py-2 text-xs font-bold whitespace-nowrap shrink-0"
            >
              Request Estimate
            </Link>
          </footer>
        </div>
      )}
    </TaycoModalOverlay>
  );
}
