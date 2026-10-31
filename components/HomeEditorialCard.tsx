"use client";

import { ImageReferenceButton } from "@/components/EstimateReferences";
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
  number, eyebrow, title, description, image, actionLabel, onOpen, href,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  image: HomeGalleryFrame;
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
        <span className="home-editorial-number" aria-hidden="true">{number}</span>
        <span className="home-editorial-photo-hint" aria-hidden="true">View gallery ↗</span>
      </button>
      <div className="home-editorial-panel">
        <p className="home-editorial-eyebrow">{eyebrow}</p>
        <h3 className="home-editorial-title">{title}</h3>
        <p className="home-editorial-description">{description}</p>
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
      onStepPrev={() => step(-1)} onStepNext={() => step(1)} enableStageWheelStep={false}>
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
            <div><p className="home-editorial-eyebrow">Gallery</p><h2>{selection.title}</h2></div>
            <button type="button" autoFocus className="home-gallery-control" onClick={onClose} aria-label="Close gallery">✕</button>
          </header>
          <div className="home-gallery-stage" {...stageGestureHandlers}>
            <ProtectedImage src={frame.src} alt={frame.title} auditIgnore
              className="h-full w-full object-contain" />
          </div>
          <div className="home-gallery-copy" data-tayco-scroll-zone="true" tabIndex={0} aria-label="Photograph details">
            <ImageReferenceButton src={frame.src} />
            <div className="space-y-2" aria-live="polite" aria-atomic="true">
            <p className="home-editorial-eyebrow">{frame.eyebrow}</p>
            <h3 className="home-editorial-title">{frame.title}</h3>
            {frame.description && <p className="home-editorial-description">{frame.description}</p>}
            {frame.details && <ul>{frame.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}
            </div>
          </div>
          <footer className="home-gallery-footer">
            <button type="button" className="home-gallery-control" disabled={selection.frames.length < 2} onClick={() => step(-1)} aria-label="Previous photograph">←</button>
            <span className="home-gallery-counter">{index + 1} / {selection.frames.length}</span>
            <button type="button" className="home-gallery-control" disabled={selection.frames.length < 2} onClick={() => step(1)} aria-label="Next photograph">→</button>
          </footer>
        </div>
      )}
    </TaycoModalOverlay>
  );
}
