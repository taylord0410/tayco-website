"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

const publicPages = new Set(["/", "/commercial", "/residential", "/investor", "/estimate", "/privacy", "/vendor-application"]);

/** Only known marketing pages own public chrome; workspace and error routes stay focused. */
export default function SiteFrame({ children, publicHeader, publicFooter }: { children: ReactNode; publicHeader: ReactNode; publicFooter: ReactNode }) {
  const pathname = usePathname();
  // The server can render a missing URL as /_not-found; a public allowlist also keeps its SSR chrome correct.
  const publicSurface = publicPages.has(pathname.replace(/\/+$/, "") || "/");
  return (
    <div
      data-site-surface={publicSurface ? "public" : "workspace"}
      className="relative min-h-svh bg-[#070E1A] text-white selection:bg-[#C9A84C]/30 selection:text-[#F3D37A]"
    >
      {publicSurface ? publicHeader : <a className="tayco-skip-link" href="#main-content">Skip to content</a>}
      <div id="main-content" tabIndex={-1} className="relative outline-none">{children}</div>
      {publicSurface && publicFooter}
    </div>
  );
}
