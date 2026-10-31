"use client";

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ProtectedImage from '@/components/ProtectedImage';
import { TaycoModalOverlay } from '@/components/ui/TaycoDesignSystem';
import { MAX_REFERENCE_IMAGES, REFERENCE_STORAGE_KEY, referenceForSource, restoreReferenceDraft,
  referencesFromPayload, type ReferenceImage } from '@/lib/reference-images';

const CHANGE_EVENT = 'tayco-reference-selection';
let memoryDraft = '[]';
function draftSnapshot() {
  try { return localStorage.getItem(REFERENCE_STORAGE_KEY) || memoryDraft; } catch { return memoryDraft; }
}
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener(CHANGE_EVENT, callback); window.removeEventListener('storage', callback); };
}
function writeSelection(images: ReferenceImage[]) {
  memoryDraft = JSON.stringify(images.map(image => image.id));
  try { localStorage.setItem(REFERENCE_STORAGE_KEY, memoryDraft); } catch { /* Keep the draft during this visit if browser storage is unavailable. */ }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
export function removeSubmittedReferences(ids: string[]) {
  writeSelection(restoreReferenceDraft(draftSnapshot()).filter(image => !ids.includes(image.id)));
}
export function useEstimateReferences() {
  const raw = useSyncExternalStore(subscribe, draftSnapshot, () => '[]');
  return restoreReferenceDraft(raw);
}

export function ImageReferenceButton({ src, label = 'Add reference' }: { src: string; label?: string }) {
  const images = useEstimateReferences();
  const [notice, setNotice] = useState<{ src: string; text: string } | null>(null);
  const image = referenceForSource(src);
  if (!image) return null;
  const selected = images.some(item => item.id === image.id);
  return <div className="min-w-0">
    <button type="button" aria-pressed={selected} onClick={() => {
      const current = restoreReferenceDraft(draftSnapshot());
      if (current.some(item => item.id === image.id)) { writeSelection(current.filter(item => item.id !== image.id)); setNotice({ src, text: 'Reference removed.' }); }
      else if (current.length >= MAX_REFERENCE_IMAGES) setNotice({ src, text: `Your request can include up to ${MAX_REFERENCE_IMAGES} images. Remove one in the estimate form to add another.` });
      else { writeSelection([...current, image]); setNotice({ src, text: 'Added to your estimate request.' }); }
    }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-300/40 bg-[#0b172a] px-3 text-xs font-semibold text-amber-100 cursor-pointer focus-visible:outline-2 focus-visible:outline-amber-200">
      <span aria-hidden="true">{selected ? '✓' : '+'}</span>{selected ? 'Reference saved' : label}
    </button>
    <p role="status" className="mt-1 max-w-xs text-xs leading-relaxed text-slate-300">{notice?.src === src ? notice.text : ''}</p>
  </div>;
}

export function EstimateReferenceTray() {
  const images = useEstimateReferences();
  const pathname = usePathname();
  if (!images.length || pathname === '/estimate') return null;
  return <><div aria-hidden="true" className="estimate-reference-tray-spacer h-28 sm:h-24" /><aside aria-label="Your project references" className="estimate-reference-tray fixed bottom-[max(12px,env(safe-area-inset-bottom))] left-14 right-3 z-30 rounded-2xl border border-amber-300/40 bg-[#081120]/95 px-3 py-2 shadow-xl sm:bottom-4 sm:left-3 sm:right-auto sm:max-w-[calc(100vw-24px)] sm:px-4 sm:py-3">
    <Link href="/estimate#estimate-references" className="flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-amber-100 sm:text-sm">
      <span>{images.length} reference{images.length === 1 ? '' : 's'} saved</span><span>Review request →</span>
    </Link>
  </aside></>;
}

function ReferenceGrid({ images, removable = false }: { images: ReferenceImage[]; removable?: boolean }) {
  const [expanded, setExpanded] = useState<ReferenceImage | null>(null);
  return <>
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map(image => <figure key={image.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-600/40 bg-[#0b172a] text-white">
        <button type="button" onClick={() => setExpanded(image)} aria-label={`Preview reference ${image.id}`} aria-haspopup="dialog" className="block aspect-[4/3] w-full cursor-pointer">
          <ProtectedImage src={image.src} alt={image.title} auditIgnore className="h-full w-full object-cover" />
        </button>
        <figcaption className="space-y-2 p-3">
          <p className="break-all font-mono text-[10px] text-amber-200">{image.id}</p>
          <p className="text-xs leading-relaxed text-slate-200">{image.title}</p>
          {removable && <button type="button" className="min-h-11 text-xs text-amber-100 underline cursor-pointer" aria-label={`Remove reference ${image.id}`}
            onClick={() => removeSubmittedReferences([image.id])}>Remove</button>}
        </figcaption>
      </figure>)}
    </div>
    {expanded && <TaycoModalOverlay isOpen onClose={() => setExpanded(null)} ariaLabel={`Reference ${expanded.id}`}>
      <div onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex="0"]'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }} className="flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-amber-200/40 bg-[#081120] p-3 text-white">
        <div className="flex shrink-0 items-center justify-between gap-3 p-2">
          <p className="break-all font-mono text-xs text-amber-200">{expanded.id}</p>
          <button autoFocus type="button" onClick={() => setExpanded(null)} className="min-h-11 rounded-lg border border-amber-200/30 px-3 text-sm cursor-pointer" aria-label="Close reference preview">Close ✕</button>
        </div>
        <div className="h-[60dvh] min-h-0"><ProtectedImage src={expanded.src} alt={expanded.title} auditIgnore className="h-full w-full object-contain" /></div>
        <p tabIndex={0} aria-label="Reference description" className="max-h-[18dvh] shrink-0 overflow-y-auto overscroll-contain p-3 text-sm focus-visible:outline-2 focus-visible:outline-amber-200">{expanded.title}</p>
      </div>
    </TaycoModalOverlay>}
  </>;
}

export function EstimateReferencePanel() {
  const images = useEstimateReferences();
  return <section id="estimate-references" aria-labelledby="estimate-references-title" className="scroll-mt-24 rounded-2xl border border-slate-300 bg-slate-50 p-4 sm:p-5">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h3 id="estimate-references-title" className="font-semibold text-[#0f2040]">Your references <span className="text-sm font-normal">({images.length}/{MAX_REFERENCE_IMAGES})</span></h3>
      <Link href="/#tayco-operations-showcase" className="inline-flex min-h-11 items-center text-xs font-semibold text-[#0f2040] underline">Browse images →</Link>
    </div>
    <p className="mb-4 text-sm leading-relaxed text-slate-600">Choose the spaces, materials or finishes you like. Their image IDs will accompany this request so our team can review your ideas.</p>
    {images.length ? <ReferenceGrid images={images} removable /> : <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">No references selected. You can still submit your request, or add images from our galleries.</p>}
  </section>;
}

export function AdminReferenceImages({ payload }: { payload: Record<string, unknown> }) {
  const images = referencesFromPayload(payload);
  if (!images.length) return null;
  return <section className="mt-4 rounded-2xl border border-amber-200/25 bg-[#071326] p-4" aria-label="Client image references">
    <h4 className="mb-1 text-sm font-bold text-amber-100">Client image references · {images.length}</h4>
    <p className="mb-4 text-xs text-slate-300">Selected with the estimate request. Open an image to review its reference ID.</p>
    <ReferenceGrid images={images} />
  </section>;
}
