/**
 * Company-reported commercial progress only. This module creates no contacts,
 * meetings, proposals, insurance verification, execution status or financial facts.
 */
export const COMMERCIAL_STAGE_CODES = Object.freeze([
  "contacted",
  "meeting_scheduled",
  "estimate_provided",
  "awaiting_insurance_information",
  "insurance_information_received",
] as const);

export type CommercialStageCode = (typeof COMMERCIAL_STAGE_CODES)[number];

export const COMMERCIAL_STAGE_LABELS: Readonly<Record<CommercialStageCode, string>> = Object.freeze({
  contacted: "Contacted",
  meeting_scheduled: "Meeting scheduled",
  estimate_provided: "Estimate provided",
  awaiting_insurance_information: "Awaiting insurance information",
  insurance_information_received: "Insurance information received",
});

export interface CommercialStageEntry {
  currentStage: CommercialStageCode;
  source: string;
  /** Actual occurrence date supplied by the company, or unknown. */
  occurredOn: string | null;
  /** Explicit company reports, never inferred from the current stage. */
  reportedCompletedStages: CommercialStageCode[];
  actorId: string;
  /** Server supplied recording time, separate from occurredOn. */
  recordedAt: string;
}

export interface CommercialStageRecord extends CommercialStageEntry {
  history: CommercialStageEntry[];
}

export interface CommercialStageInput {
  currentStage: CommercialStageCode;
  source: string;
  occurredOn?: string | null;
  /** An explicit replacement; omission preserves only coherent prior reports. */
  reportedCompletedStages?: CommercialStageCode[];
}

export class CommercialStageError extends Error {
  constructor(message: string, public readonly status: 400 | 409 = 400) {
    super(message);
    this.name = "CommercialStageError";
  }
}

const ENTRY_KEYS = [
  "currentStage", "source", "occurredOn", "reportedCompletedStages", "actorId", "recordedAt",
];
const INPUT_KEYS = ["currentStage", "source", "occurredOn", "reportedCompletedStages"];
const MAX_HISTORY = 100;

function fail(message: string): never {
  throw new CommercialStageError(message);
}

function object(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)
    || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) {
    fail(`${label} must be a plain object.`);
  }
  if (Reflect.ownKeys(value).some(key => typeof key !== "string" || !keys.includes(key))) {
    fail(`${label} contains unknown fields.`);
  }
  return value as Record<string, unknown>;
}

function stage(value: unknown): CommercialStageCode {
  if (typeof value !== "string" || !(COMMERCIAL_STAGE_CODES as readonly string[]).includes(value)) {
    fail("A valid commercial currentStage is required.");
  }
  return value as CommercialStageCode;
}

function sourceText(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > 1000
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) {
    fail("Commercial-stage source must contain 1–1000 characters.");
  }
  return value.trim();
}

function actor(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:@-]{0,199}$/.test(value)) {
    fail("A stable commercial-stage actor ID is required.");
  }
  return value;
}

function timestamp(value: unknown): string {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    fail("Commercial-stage recordedAt must be a valid UTC timestamp.");
  }
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())
    || parsed.toISOString() !== (value.includes(".") ? value : value.replace("Z", ".000Z"))) {
    fail("Commercial-stage recordedAt must be a valid UTC timestamp.");
  }
  return value;
}

function occurrence(value: unknown, recordedAt: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(value)) {
    fail("Commercial-stage occurredOn must be a calendar date or null.");
  }
  const parsed = new Date(value + "T00:00:00.000Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    fail("Commercial-stage occurredOn must be a valid calendar date.");
  }
  if (value > recordedAt.slice(0, 10)) fail("Commercial-stage occurredOn cannot be in the future.");
  return value;
}

function completed(value: unknown, currentStage: CommercialStageCode): CommercialStageCode[] {
  if (!Array.isArray(value) || value.length >= COMMERCIAL_STAGE_CODES.length) {
    fail("reportedCompletedStages must be an array of distinct prior stages.");
  }
  const parsed = Array.from(value, stage);
  if (new Set(parsed).size !== parsed.length) fail("reportedCompletedStages cannot contain duplicates.");
  const currentIndex = COMMERCIAL_STAGE_CODES.indexOf(currentStage);
  if (parsed.some(item => COMMERCIAL_STAGE_CODES.indexOf(item) >= currentIndex)) {
    fail("reportedCompletedStages can contain only stages before currentStage.");
  }
  return [...parsed].sort((a, b) => COMMERCIAL_STAGE_CODES.indexOf(a) - COMMERCIAL_STAGE_CODES.indexOf(b));
}

function parseEntry(value: unknown, top = false): CommercialStageEntry {
  const row = object(value, top ? [...ENTRY_KEYS, "history"] : ENTRY_KEYS, "Commercial-stage entry");
  const currentStage = stage(row.currentStage);
  const recordedAt = timestamp(row.recordedAt);
  return {
    currentStage,
    source: sourceText(row.source),
    occurredOn: occurrence(row.occurredOn, recordedAt),
    reportedCompletedStages: completed(row.reportedCompletedStages, currentStage),
    actorId: actor(row.actorId),
    recordedAt,
  };
}

function parsePrevious(value: unknown): CommercialStageRecord | null {
  if (value === null || value === undefined) return null;
  try {
    const row = object(value, [...ENTRY_KEYS, "history"], "Previous commercial-stage record");
    const entry = parseEntry(row, true);
    if (!Array.isArray(row.history) || row.history.length < 1 || row.history.length > MAX_HISTORY) {
      fail("Commercial-stage history must contain 1–100 entries.");
    }
    const history = Array.from(row.history, item => parseEntry(item));
    for (let index = 1; index < history.length; index++) {
      if (Date.parse(history[index].recordedAt) < Date.parse(history[index - 1].recordedAt)) {
        fail("Commercial-stage history is not ordered by recordedAt.");
      }
    }
    if (JSON.stringify(entry) !== JSON.stringify(history[history.length - 1])) {
      fail("Commercial-stage history does not match the current record.");
    }
    return { ...entry, history };
  } catch (error) {
    if (error instanceof CommercialStageError) {
      throw new CommercialStageError("Previous commercial-stage record is invalid: " + error.message, 409);
    }
    throw error;
  }
}

/**
 * Pure explicit write, with no clock, storage, authentication or provider access.
 * Input accepts only currentStage, source, occurredOn?, reportedCompletedStages?.
 * A missing occurrence date is unknown for this report, even on a same-stage write.
 * Omitted completed stages preserve prior explicit reports that precede the new
 * stage; an explicit array replaces them. Forward jumps infer no completions.
 * Backward corrections require the same nonempty source as every other write.
 */
export function recordCommercialStage(
  previous: unknown,
  input: unknown,
  actorId: string,
  recordedAt: string,
): CommercialStageRecord {
  const prior = parsePrevious(previous);
  const row = object(input, INPUT_KEYS, "Commercial-stage input");
  const currentStage = stage(row.currentStage);
  const at = timestamp(recordedAt);
  const by = actor(actorId);
  if (prior && Date.parse(at) < Date.parse(prior.recordedAt)) {
    throw new CommercialStageError("Commercial-stage recordedAt is older than the current record.", 409);
  }
  const entry: CommercialStageEntry = {
    currentStage,
    source: sourceText(row.source),
    occurredOn: occurrence(Object.hasOwn(row, "occurredOn") ? row.occurredOn : null, at),
    reportedCompletedStages: Object.hasOwn(row, "reportedCompletedStages")
      ? completed(row.reportedCompletedStages, currentStage)
      : (prior?.reportedCompletedStages ?? []).filter(item =>
        COMMERCIAL_STAGE_CODES.indexOf(item) < COMMERCIAL_STAGE_CODES.indexOf(currentStage)),
    actorId: by,
    recordedAt: at,
  };
  return { ...entry, history: [...(prior?.history ?? []), {
    ...entry, reportedCompletedStages: [...entry.reportedCompletedStages],
  }].slice(-MAX_HISTORY) };
}
