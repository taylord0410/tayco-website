import type { ComponentPropsWithoutRef, ReactNode, Ref } from "react";
import "./portal-shell.css";

/** Visual frame only. The caller owns navigation, permissions and module behavior. */
export default function PortalShell({ sidebar, header, children, sidebarRef, ...mainProps }: ComponentPropsWithoutRef<"main"> & {
  sidebar: ReactNode;
  header: ReactNode;
  sidebarRef?: Ref<HTMLElement>;
}) {
  return <main {...mainProps}>
    <div className="mx-auto grid max-w-[1640px] grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)] xl:grid-cols-[268px_minmax(0,1fr)]">
      <aside ref={sidebarRef} id="tayco-command-sidebar" className="min-w-0 border-b border-amber-200/20 bg-gradient-to-b from-[#112748] to-[#09172b] p-3.5 sm:p-5 lg:sticky lg:top-0 lg:max-h-dvh lg:overflow-y-auto lg:self-start lg:border-b-0 lg:border-r">{sidebar}</aside>
      <div className="workspace-content min-w-0 px-3 pb-16 pt-5 sm:px-5 sm:pt-6 lg:px-6 xl:px-7">
        <div className="workspace-page-header flex flex-wrap items-start justify-between gap-5">{header}</div>
        {children}
      </div>
    </div>
  </main>;
}
