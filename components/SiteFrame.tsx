"use client";

import { useEffect, type ReactNode, type MouseEvent, type DragEvent } from "react";
import { usePathname } from "next/navigation";

const publicPages = new Set(["/", "/commercial", "/residential", "/investor", "/estimate", "/privacy", "/vendor-application"]);

function isProtectedVisualTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (
    target.tagName === "IMG" ||
    target.tagName === "PICTURE" ||
    target.tagName === "SVG" ||
    target.tagName === "CANVAS"
  ) {
    return true;
  }
  return Boolean(
    target.closest(
      "img, picture, .tayco-filmstrip-card, #tayco-transformation-studio, #tayco-light-studio, #tayco-operations-showcase"
    )
  );
}

/** Only known marketing pages own public chrome; workspace and error routes stay focused. */
export default function SiteFrame({ children, publicHeader, publicFooter }: { children: ReactNode; publicHeader: ReactNode; publicFooter: ReactNode }) {
  const pathname = usePathname();
  // The server can render a missing URL as /_not-found; a public allowlist also keeps its SSR chrome correct.
  const publicSurface = publicPages.has(pathname.replace(/\/+$/, "") || "/");

  useEffect(() => {
    if (!publicSurface) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [publicSurface]);

  const handleContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    if (publicSurface && isProtectedVisualTarget(event.target)) {
      event.preventDefault();
    }
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    if (publicSurface && isProtectedVisualTarget(event.target)) {
      event.preventDefault();
    }
  };

  return (
    <div
      data-site-surface={publicSurface ? "public" : "workspace"}
      data-image-shield={publicSurface ? "enforced" : undefined}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      className="relative min-h-svh bg-[#070E1A] text-white selection:bg-[#C9A84C]/30 selection:text-[#F3D37A]"
    >
      {publicSurface ? publicHeader : <a className="tayco-skip-link" href="#main-content">Skip to content</a>}
      <div id="main-content" tabIndex={-1} className="relative outline-none">{children}</div>
      {publicSurface && publicFooter}
    </div>
  );
}
