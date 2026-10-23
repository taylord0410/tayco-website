"use client";
import type { ReactNode } from "react";
import type { Data, Entry } from "@/lib/erp";
import { CONTRACT_TYPE_OPTIONS, FUNDING_TYPE_OPTIONS, LABOR_REGIME_OPTIONS, readProjectClassification } from "@/lib/project-classification";
import type { WorkspaceField, WorkspaceForm } from "./ProjectOverview";

type Option = { readonly value: string; readonly label: string };
export type ProjectClassificationFilter = { contractType: string; laborRegime: string };
const label = (options: readonly Option[], value: string) => options.find(option => option.value === value)?.label || "Unknown / not reviewed";
const control = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-amber-200/25 bg-[#09182f] px-3 text-sm text-white focus-visible:outline-2 focus-visible:outline-amber-200";
const button = "inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200/35 px-4 py-2 text-xs font-semibold text-amber-100 hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-amber-200";

export function projectClassificationFields(data?: Data): WorkspaceField[] {
  const classification = readProjectClassification(data?.classification);
  return [
    { name: "contractType", label: "Project type", type: "select", value: classification.contractType, options: [...CONTRACT_TYPE_OPTIONS] },
    { name: "fundingType", label: "Funding type", type: "select", value: classification.fundingType, options: [...FUNDING_TYPE_OPTIONS] },
    { name: "laborRegime", label: "Labor arrangement", type: "select", value: classification.laborRegime, options: [...LABOR_REGIME_OPTIONS] },
    { name: "jurisdiction", label: "Classification jurisdiction", required: false, value: classification.jurisdiction },
    { name: "classificationSource", label: "Classification source (required for a known classification)", type: "textarea", required: false, value: classification.source },
  ];
}
export function matchesProjectClassification(entry: Entry, filter: ProjectClassificationFilter) {
  const classification = readProjectClassification(entry.data.classification);
  return (filter.contractType === "all" || classification.contractType === filter.contractType) && (filter.laborRegime === "all" || classification.laborRegime === filter.laborRegime);
}
export function ProjectClassificationFilters({ projects, value, onChange }: { projects: Entry[]; value: ProjectClassificationFilter; onChange: (value: ProjectClassificationFilter) => void }) {
  const matched = projects.filter(entry => matchesProjectClassification(entry, value)).length;
  const count = (axis: "contractType" | "laborRegime", option: string) => projects.filter(entry => readProjectClassification(entry.data.classification)[axis] === option).length;
  return <section data-testid="project-classification-filters" className="mt-5 min-w-0 space-y-3 rounded-xl border border-amber-200/20 bg-[#0c1c33] p-4" aria-label="Project classification filters">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold text-amber-100">Find projects by classification</h3><p className="mt-1 text-xs text-slate-400">Type and labor are separate filters. Counts apply to the projects in your current selection.</p></div><button type="button" className={button} onClick={() => onChange({ contractType: "all", laborRegime: "all" })}>Clear classification filters</button></div>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2"><label className="min-w-0 text-xs font-semibold text-amber-100">Project type<select aria-label="Filter projects by type" className={control} value={value.contractType} onChange={event => onChange({ ...value, contractType: event.target.value })}><option value="all">All types ({projects.length})</option>{CONTRACT_TYPE_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label} ({count("contractType", option.value)})</option>)}</select></label><label className="min-w-0 text-xs font-semibold text-amber-100">Labor arrangement<select aria-label="Filter projects by labor arrangement" className={control} value={value.laborRegime} onChange={event => onChange({ ...value, laborRegime: event.target.value })}><option value="all">All labor arrangements ({projects.length})</option>{LABOR_REGIME_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label} ({count("laborRegime", option.value)})</option>)}</select></label></div>
    <p role="status" data-testid="project-classification-match-count" className="text-xs text-slate-300">{matched} of {projects.length} projects match the type and labor filters.</p>
    {projects.length > 0 && matched === 0 && <p data-testid="project-classification-empty" className="rounded-lg border border-dashed border-slate-600 p-3 text-sm text-slate-300">No projects match these classifications. Clear the filters or choose another project selection.</p>}
  </section>;
}
export default function ProjectClassification({ entry, team, renderForm, onOpenRequirements }: { entry: Entry; team: boolean; renderForm: (form: WorkspaceForm) => ReactNode; onOpenRequirements: () => void }) {
  const classification = readProjectClassification(entry.data.classification);
  return <section data-testid={"project-classification-" + entry.id} className="min-w-0 space-y-4 rounded-xl border border-amber-200/20 bg-[#0b1c32] p-4" aria-label="Recorded project classification">
    <header><p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-amber-200">Project classification</p><p className="mt-2 text-xs leading-relaxed text-slate-400">Project type, funding and labor are independent declarations. Unknown values remain unclassified until reviewed.</p></header>
    <dl className="grid min-w-0 gap-3 text-xs sm:grid-cols-3"><div><dt className="text-slate-400">Project type</dt><dd data-testid="classification-contract-type" className="mt-1 break-words font-semibold text-white">{label(CONTRACT_TYPE_OPTIONS, classification.contractType)}</dd></div><div><dt className="text-slate-400">Funding type</dt><dd data-testid="classification-funding-type" className="mt-1 break-words font-semibold text-white">{label(FUNDING_TYPE_OPTIONS, classification.fundingType)}</dd></div><div><dt className="text-slate-400">Labor arrangement</dt><dd data-testid="classification-labor-regime" className="mt-1 break-words font-semibold text-white">{label(LABOR_REGIME_OPTIONS, classification.laborRegime)}</dd></div></dl>
    <p className="break-words text-xs text-slate-300"><span className="text-slate-400">Jurisdiction: </span>{classification.jurisdiction || "Not recorded"}</p>
    {team && <>
      <div data-testid="classification-private-source" className="space-y-2 border-t border-slate-600/50 pt-3 text-xs text-slate-300"><p className="whitespace-pre-wrap break-words"><span className="text-slate-400">Classification source: </span>{classification.source || "No classification source recorded"}</p><p className="break-all text-[11px] text-slate-400">{classification.reviewedAt ? "Review recorded " + classification.reviewedAt + (classification.reviewedBy ? " · account " + classification.reviewedBy : "") : "No classification review recorded"}</p></div>
      {renderForm({ title: "Edit project classification", action: "update_project_classification", fixed: { id: entry.id, version: entry.version }, fields: projectClassificationFields(entry.data) })}
      <button type="button" className={button + " w-full"} onClick={onOpenRequirements}>Open project requirements &amp; certifications</button>
      <p className="text-xs leading-relaxed text-slate-400">Use the requirements register to record the applicable authority, source and manual review. A classification does not certify compliance.</p>
      <details data-testid="classification-private-history" className="min-w-0 border-t border-slate-600/50 text-xs text-slate-400"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-amber-100">Classification history · {classification.history.length} reviews</summary>{classification.history.length ? <ol className="space-y-3 pb-3">{classification.history.slice().reverse().map((item, index) => <li key={item.reviewedAt + index} className="min-w-0 rounded-lg border border-slate-700 p-3"><p className="break-all font-mono text-[10px]">{item.reviewedAt} · account {item.reviewedBy}</p><p className="mt-2 break-words text-slate-300">{label(CONTRACT_TYPE_OPTIONS, item.contractType)} · {label(FUNDING_TYPE_OPTIONS, item.fundingType)} funding · {label(LABOR_REGIME_OPTIONS, item.laborRegime)}</p>{item.jurisdiction && <p className="mt-1 break-words">{item.jurisdiction}</p>}<p className="mt-2 whitespace-pre-wrap break-words text-slate-300">{item.source || "Unknown classification recorded"}</p></li>)}</ol> : <p className="pb-3">No classification reviews have been recorded.</p>}</details>
    </>}
  </section>;
}
