"use client";

import { useState } from "react";

type Props = { source: string; projectName: string };
const button = "inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200";
export default function TakeoffProjectReader({ source, projectName }: Props) {
  const [reload, setReload] = useState(0);
  const [opened, setOpened] = useState(false);
  const [failed, setFailed] = useState(false);
  return <section className="min-w-0 overflow-hidden rounded-2xl border border-amber-200/20 bg-[#0b192e]" aria-label="Protected project reader">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/15 p-4"><div className="min-w-0"><h2 className="font-bold text-white">Project reader</h2><p role="status" className="mt-1 text-xs leading-relaxed text-slate-400">{failed ? "The reader window could not be opened. Retry or return to the workspace." : opened ? "Reader window opened. Document loading and available content are shown inside the reader." : "Opening the private reader…"}</p></div><div className="flex flex-wrap gap-2"><button className={button} type="button" onClick={() => { setOpened(false); setFailed(false); setReload(value => value + 1); }}>Reload reader</button><a className={button} href={source} target="_blank" rel="noopener noreferrer">Open reader in a new tab ↗</a></div></div>
    {failed && <div role="alert" className="m-4 rounded-xl border border-amber-200/25 bg-amber-200/5 p-5 text-sm leading-relaxed text-slate-200">The private reader is unavailable or your document access changed. Reload the reader to try again, or return to the workspace. No alternative public document link is used.</div>}
    <iframe key={reload} title={projectName + " · approved project plans"} src={source} loading="eager" referrerPolicy="same-origin" className={(failed ? "hidden" : "block") + " h-[78svh] min-h-[32rem] w-full border-0 bg-[#0b192e] sm:h-[82svh]"} onLoad={event => {
      try {
        const document = event.currentTarget.contentDocument;
        const isReader = document?.contentType === "text/html" && Boolean(document.querySelector("#mainContent"));
        setOpened(isReader); setFailed(!isReader);
      } catch { setOpened(false); setFailed(true); }
    }} onError={() => { setFailed(true); setOpened(false); }} />
    <p className="border-t border-amber-200/15 px-4 py-3 text-xs leading-relaxed text-slate-400">Read-only access. Each document request is authorized separately. Source availability, OCR, calibration and quantities are reported by the reader; opening this window does not certify that processing is complete.</p>
  </section>;
}
