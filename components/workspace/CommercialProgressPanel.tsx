"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  COMMERCIAL_STAGE_CODES, COMMERCIAL_STAGE_LABELS,
  type CommercialStageCode, type CommercialStageEntry,
  type CommercialStageInput, type CommercialStageRecord,
} from "../../lib/commercial-stages";

export type CommercialProgressPanelProps = {
  project: { id: string; version: number; data: Record<string, unknown> };
  pending: boolean;
  /** The caller retains command identity/body across retries and resolves after a confirmed receipt. */
  onRecord: (input: CommercialStageInput) => Promise<void>;
  /** Only terminal outcomes for this panel\'s retained command may be delivered. */
  subscribeRecovery?: (listener: (outcome: { version?: number; error?: string }) => void) => () => void;
};

const field = "mt-2 min-h-11 w-full min-w-0 rounded-lg border border-amber-200/30 bg-[#09182f] px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:opacity-60";
const action = "workspace-button inline-flex min-h-11 items-center justify-center rounded-lg border border-amber-200/40 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-200/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed disabled:opacity-50";
const displayTime = new Intl.DateTimeFormat("en-US", {
  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  hour12: false, timeZone: "UTC",
});

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isStage(value: unknown): value is CommercialStageCode {
  return typeof value === "string" && (COMMERCIAL_STAGE_CODES as readonly string[]).includes(value);
}
function isCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function isEntry(value: unknown): value is CommercialStageEntry {
  return object(value) && isStage(value.currentStage) && typeof value.source === "string"
    && value.source.trim().length > 0 && value.source.length <= 1000
    && typeof value.actorId === "string" && value.actorId.length > 0 && value.actorId.length <= 200
    && typeof value.recordedAt === "string" && value.recordedAt.length <= 40 && Number.isFinite(Date.parse(value.recordedAt))
    && (value.occurredOn === null || isCalendarDate(value.occurredOn))
    && Array.isArray(value.reportedCompletedStages) && value.reportedCompletedStages.length <= 4
    && new Set(value.reportedCompletedStages).size === value.reportedCompletedStages.length
    && value.reportedCompletedStages.every(code => isStage(code)
      && COMMERCIAL_STAGE_CODES.indexOf(code) < COMMERCIAL_STAGE_CODES.indexOf(value.currentStage as CommercialStageCode));
}
function isProgress(value: unknown): value is CommercialStageRecord {
  return isEntry(value) && object(value) && Array.isArray(value.history)
    && value.history.length > 0 && value.history.length <= 100 && value.history.every(isEntry);
}
function actorLabel(value: string) {
  return "Account " + (value.length > 18 ? value.slice(0, 9) + "…" + value.slice(-6) : value);
}
function recordedTime(value: string) {
  return displayTime.format(new Date(value)) + " UTC";
}

/** A version change mounts a fresh draft from the accepted project snapshot. */
export default function CommercialProgressPanel(props: CommercialProgressPanelProps) {
  return <CommercialProgressEditor key={props.project.id + ":" + props.project.version} {...props} />;
}

function CommercialProgressEditor({ project, pending, onRecord, subscribeRecovery }: CommercialProgressPanelProps) {
  const id = useId();
  const raw = project.data.commercialProgress;
  const progress = isProgress(raw) ? raw : null;
  const invalidProgress = raw !== null && raw !== undefined && !progress;
  const [currentStage, setCurrentStage] = useState<CommercialStageCode | "">(progress?.currentStage ?? "");
  const [completed, setCompleted] = useState<CommercialStageCode[]>([...(progress?.reportedCompletedStages ?? [])]);
  const [source, setSource] = useState("");
  const [occurredOn, setOccurredOn] = useState("");
  const [saving, setSaving] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [submitted, setSubmitted] = useState<CommercialStageInput | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const sending = useRef(false);
  const locked = pending || saving || uncertain || invalidProgress;
  const priorStages = currentStage ? COMMERCIAL_STAGE_CODES.slice(0, COMMERCIAL_STAGE_CODES.indexOf(currentStage)) : [];

  useEffect(() => {
    if (!subscribeRecovery) return;
    return subscribeRecovery(outcome => {
      sending.current = false;
      setSaving(false);
      setSubmitted(null);
      setUncertain(false);
      if (outcome.error !== undefined) {
        setNotice("");
        setError(outcome.error || "The commercial report was not recorded.");
      } else {
        setSource("");
        setOccurredOn("");
        setError("");
        setNotice("Commercial progress recorded.");
      }
    });
  }, [subscribeRecovery]);

  function chooseStage(value: string) {
    if (value !== "" && !isStage(value)) return;
    setCurrentStage(value);
    setCompleted(previous => previous.filter(code => value !== ""
      && COMMERCIAL_STAGE_CODES.indexOf(code) < COMMERCIAL_STAGE_CODES.indexOf(value)));
    setOccurredOn("");
    setError("");
    setNotice("");
  }

  async function send(input: CommercialStageInput) {
    if (sending.current || pending) return;
    sending.current = true;
    setSaving(true);
    setError("");
    setNotice("");
    setSubmitted(input);
    try {
      await onRecord(input);
      setUncertain(false);
      setSubmitted(null);
      setSource("");
      setOccurredOn("");
      setNotice("Commercial progress recorded.");
    } catch (failure) {
      const status = object(failure) && typeof failure.status === "number" ? failure.status : 0;
      const definitive = status >= 400 && status < 500 && ![408, 423, 429].includes(status);
      setUncertain(!definitive);
      if (definitive) setSubmitted(null);
      setError(failure instanceof Error ? failure.message : "The commercial report could not be recorded.");
    } finally {
      sending.current = false;
      setSaving(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;
    setError("");
    if (!isStage(currentStage)) { setError("Choose a commercial stage."); return; }
    if (!source.trim() || source.trim().length > 1000) { setError("Provide a source containing 1–1000 characters."); return; }
    if (occurredOn && !isCalendarDate(occurredOn)) { setError("Enter a valid event date, or leave it unknown."); return; }
    const input: CommercialStageInput = {
      currentStage, source: source.trim(), occurredOn: occurredOn || null,
      reportedCompletedStages: priorStages.filter(code => completed.includes(code)),
    };
    void send(input);
  }

  return <section aria-labelledby={id + "-heading"} className="workspace-surface min-w-0 space-y-5 rounded-2xl border border-amber-200/25 bg-gradient-to-br from-[#153154] via-[#0f2341] to-[#09172b] p-4 text-[#f5f0e7] sm:p-5">
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">Project workflow</p>
      <h3 id={id + "-heading"} className="text-lg font-semibold">Commercial progress</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">Company-reported stages. Execution status and proposal decisions are managed separately.</p>
    </div>

    {invalidProgress && <p role="alert" className="rounded-xl border border-red-300/30 bg-red-950/30 p-3 text-sm text-red-100">
      Saved commercial progress could not be read. Refresh the project before recording another report.
    </p>}

    <ol aria-label="Saved commercial stages" className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {COMMERCIAL_STAGE_CODES.map((code, index) => {
        const current = progress?.currentStage === code;
        const done = progress?.reportedCompletedStages.includes(code) ?? false;
        return <li key={code} aria-current={current ? "step" : undefined} className={"min-w-0 rounded-xl border p-3 " + (current ? "border-amber-200/60 bg-amber-200/10" : "border-white/10 bg-[#09182f]/40")}>
          <span className={"mb-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold " + (current ? "bg-amber-200 text-[#112640]" : "bg-white/10 text-slate-200")}>{index + 1}</span>
          <p className="break-words text-sm font-medium">{COMMERCIAL_STAGE_LABELS[code]}</p>
          <p className={"mt-1 text-xs leading-relaxed " + (current || done ? "text-amber-100" : "text-slate-400")}>
            {current ? "Current reported stage" : done ? "Reported completed" : "No completion reported"}
          </p>
        </li>;
      })}
    </ol>

    {progress ? <div className="min-w-0 space-y-2 rounded-xl border border-white/10 bg-[#09182f]/40 p-3 text-sm">
      <p><span className="text-slate-400">Event date:</span> {progress.occurredOn ?? "Unknown"}</p>
      <p className="text-xs leading-relaxed text-slate-300">Recorded <time dateTime={progress.recordedAt}>{recordedTime(progress.recordedAt)}</time> · {actorLabel(progress.actorId)}</p>
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">Latest report source</p>
      <p className="whitespace-pre-wrap break-words leading-relaxed text-slate-200">{progress.source}</p>
    </div> : !invalidProgress && <p className="rounded-xl border border-dashed border-white/20 p-3 text-sm text-slate-300">
      No commercial progress has been recorded for this project.
    </p>}

    <form onSubmit={submit} className="min-w-0 space-y-4 border-t border-white/10 pt-4">
      <fieldset disabled={locked} className="min-w-0 space-y-4">
        <legend className="mb-3 text-sm font-semibold">Record a company report</legend>
        <p className="text-xs leading-relaxed text-slate-300">A stage report does not create a meeting, send an estimate, accept a proposal or verify insurance.</p>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label htmlFor={id + "-stage"} className="min-w-0 text-sm text-slate-200">Current commercial stage
            <select id={id + "-stage"} className={field} value={currentStage} required onChange={event => chooseStage(event.target.value)}>
              <option value="">Choose a stage</option>
              {COMMERCIAL_STAGE_CODES.map(code => <option key={code} value={code}>{COMMERCIAL_STAGE_LABELS[code]}</option>)}
            </select>
          </label>
          <label htmlFor={id + "-date"} className="min-w-0 text-sm text-slate-200">Actual event date <span className="text-slate-400">(optional)</span>
            <input id={id + "-date"} type="date" className={field} value={occurredOn} onChange={event => setOccurredOn(event.target.value)} aria-describedby={id + "-date-help"} />
          </label>
        </div>
        <p id={id + "-date-help"} className="text-xs leading-relaxed text-slate-300">Use the actual occurrence date only if known. Leave blank for unknown; recording time is saved separately.</p>
        <fieldset className="min-w-0">
          <legend className="text-sm text-slate-200">Earlier stages explicitly reported completed</legend>
          <p className="mt-1 text-xs leading-relaxed text-slate-300">Mark only stages the company has reported complete. Choosing a later stage does not complete earlier stages automatically.</p>
          <div className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
            {priorStages.map(code => <label key={code} className="flex min-h-11 min-w-0 cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-[#09182f]/40 px-3 py-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#e3bb7b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
                checked={completed.includes(code)} onChange={event => setCompleted(previous => event.target.checked ? [...previous, code] : previous.filter(item => item !== code))} />
              <span className="min-w-0 break-words">{COMMERCIAL_STAGE_LABELS[code]}</span>
            </label>)}
          </div>
          {priorStages.length === 0 && <p className="mt-2 text-xs leading-relaxed text-slate-400">{currentStage ? "This is the first stage; there are no earlier stages to report." : "Choose the current stage to review its earlier stages."}</p>}
        </fieldset>
        <label htmlFor={id + "-source"} className="block min-w-0 text-sm text-slate-200">Report source <span className="text-amber-200">(required)</span>
          <textarea id={id + "-source"} className={field + " resize-y"} rows={3} required maxLength={1000} value={source}
            onChange={event => setSource(event.target.value)} aria-describedby={id + "-source-help"} />
        </label>
        <p id={id + "-source-help"} className="text-xs leading-relaxed text-slate-300">Identify the company report or evidence supporting this update, including any correction. Maximum 1,000 characters.</p>
      </fieldset>

      {error && <div role="alert" className="min-w-0 space-y-2 rounded-xl border border-red-300/30 bg-red-950/30 p-3 text-sm text-red-100">
        <p className="break-words">{error}</p>
        {uncertain && <p className="leading-relaxed">The outcome is uncertain. This report is kept unchanged. Retry the same report to recover its result before editing.</p>}
      </div>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200/30 bg-emerald-950/30 p-3 text-sm text-emerald-100">{notice}</p>}
      <div className="flex min-w-0 flex-wrap gap-3">
        {uncertain && submitted ? <button type="button" className={action} disabled={pending || saving} onClick={() => void send(submitted)}>
          {saving ? "Recovering report…" : "Retry same report"}
        </button> : <button type="submit" className={action} disabled={locked || !currentStage || !source.trim()}>
          {saving || pending ? "Recording…" : "Record commercial progress"}
        </button>}
      </div>
    </form>

    {progress && <details className="min-w-0 rounded-xl border border-white/15 bg-[#09182f]/30">
      <summary className="min-h-11 cursor-pointer rounded-xl px-3 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200">
        Report history · {progress.history.length}
      </summary>
      <div className="min-w-0 border-t border-white/10 p-3">
        <p className="mb-3 text-xs text-slate-400">Latest reports first. Up to 100 reports are retained.</p>
        <ol className="max-h-[28rem] min-w-0 space-y-3 overflow-y-auto overscroll-contain">
          {[...progress.history].reverse().map((entry, index) => <li key={entry.recordedAt + ":" + index} className="min-w-0 rounded-lg border border-white/10 p-3 text-sm">
            <p className="break-words font-semibold text-amber-100">{COMMERCIAL_STAGE_LABELS[entry.currentStage]}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">Recorded <time dateTime={entry.recordedAt}>{recordedTime(entry.recordedAt)}</time> · {actorLabel(entry.actorId)}</p>
            <p className="mt-2 text-xs text-slate-300">Actual event date: {entry.occurredOn ?? "Unknown"}</p>
            <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed text-slate-200">{entry.source}</p>
            <p className="mt-2 break-words text-xs leading-relaxed text-slate-300">Reported completed: {entry.reportedCompletedStages.length ? entry.reportedCompletedStages.map(code => COMMERCIAL_STAGE_LABELS[code]).join("; ") : "None reported"}</p>
          </li>)}
        </ol>
      </div>
    </details>}
  </section>;
}
