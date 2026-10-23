import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCIAL_STAGE_CODES,
  COMMERCIAL_STAGE_LABELS,
  CommercialStageError,
  recordCommercialStage,
  type CommercialStageCode,
} from "../lib/commercial-stages";

const at = "2026-10-23T15:00:00.000Z";
const actorId = "staff-fixture";
const source = "Synthetic company report; no customer records.";
const firstThree: CommercialStageCode[] = ["contacted", "meeting_scheduled", "estimate_provided"];
const waiting = () => recordCommercialStage(null, {
  currentStage: "awaiting_insurance_information", source,
  reportedCompletedStages: firstThree,
}, actorId, at);
function invalid(input: unknown, pattern: RegExp) {
  assert.throws(() => recordCommercialStage(null, input, actorId, at),
    (error: unknown) => error instanceof CommercialStageError && error.status === 400 && pattern.test(error.message));
}
function corrupt(previous: unknown, pattern: RegExp) {
  assert.throws(() => recordCommercialStage(previous, {currentStage: "contacted", source}, actorId, at),
    (error: unknown) => error instanceof CommercialStageError && error.status === 409 && pattern.test(error.message));
}

test("stable commercial codes have the requested English labels", () => {
  assert.deepEqual(COMMERCIAL_STAGE_CODES, [
    "contacted", "meeting_scheduled", "estimate_provided",
    "awaiting_insurance_information", "insurance_information_received",
  ]);
  assert.deepEqual(COMMERCIAL_STAGE_CODES.map(code => COMMERCIAL_STAGE_LABELS[code]), [
    "Contacted", "Meeting scheduled", "Estimate provided",
    "Awaiting insurance information", "Insurance information received",
  ]);
});

test("explicit company-reported initial waiting stage preserves three completed stages with unknown dates", () => {
  const result = waiting();
  assert.equal(result.currentStage, "awaiting_insurance_information");
  assert.deepEqual(result.reportedCompletedStages, firstThree);
  assert.equal(result.occurredOn, null);
  assert.equal(result.source, source);
  assert.equal(result.actorId, actorId);
  assert.equal(result.recordedAt, at);
  assert.equal(result.history.length, 1);
  const {history, ...entry} = result;
  assert.deepEqual(history, [entry]);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});

test("forward stage jumps do not infer prior completion or occurrence dates", () => {
  const result = recordCommercialStage(undefined, {
    currentStage: "awaiting_insurance_information", source,
  }, actorId, at);
  assert.deepEqual(result.reportedCompletedStages, []);
  assert.equal(result.occurredOn, null);
  assert.deepEqual(Object.keys(result).sort(), [
    "actorId", "currentStage", "history", "occurredOn", "recordedAt",
    "reportedCompletedStages", "source",
  ]);
});

test("normal progression records explicit prior completions and actual dates independently", () => {
  const contacted = recordCommercialStage(null, {
    currentStage: "contacted", source, occurredOn: "2026-10-01",
  }, actorId, "2026-10-01T16:00:00Z");
  const meeting = recordCommercialStage(contacted, {
    currentStage: "meeting_scheduled", source, occurredOn: "2026-10-02",
    reportedCompletedStages: ["contacted"],
  }, "other-staff-fixture", "2026-10-02T16:00:00.000Z");
  const estimate = recordCommercialStage(meeting, {
    currentStage: "estimate_provided", source,
    reportedCompletedStages: ["meeting_scheduled", "contacted"],
  }, actorId, at);
  assert.equal(estimate.occurredOn, null);
  assert.deepEqual(estimate.reportedCompletedStages, ["contacted", "meeting_scheduled"]);
  assert.equal(estimate.history.length, 3);
  assert.equal(estimate.history[0].occurredOn, "2026-10-01");
  assert.equal(estimate.history[1].actorId, "other-staff-fixture");
});

test("omitted completion list preserves explicit reports without adding the former current stage", () => {
  const result = recordCommercialStage(waiting(), {
    currentStage: "insurance_information_received", source,
  }, actorId, at);
  assert.deepEqual(result.reportedCompletedStages, firstThree);
  assert.equal(result.reportedCompletedStages.includes("awaiting_insurance_information"), false);
  assert.equal(result.occurredOn, null);
});

test("a backward revision prunes contradictory prior completion and requires attribution", () => {
  const result = recordCommercialStage(waiting(), {
    currentStage: "meeting_scheduled", source: "Synthetic correction of the reported commercial stage.",
  }, actorId, at);
  assert.deepEqual(result.reportedCompletedStages, ["contacted"]);
  assert.equal(result.history[0].currentStage, "awaiting_insurance_information");
  assert.deepEqual(result.history[0].reportedCompletedStages, firstThree);
  assert.throws(() => recordCommercialStage(waiting(), {
    currentStage: "contacted", source: "",
  }, actorId, at), /source/);
});

test("an explicit replacement can retract all completed reports", () => {
  const result = recordCommercialStage(waiting(), {
    currentStage: "awaiting_insurance_information", source: "Synthetic report correction.",
    reportedCompletedStages: [],
  }, actorId, at);
  assert.deepEqual(result.reportedCompletedStages, []);
  assert.deepEqual(result.history[0].reportedCompletedStages, firstThree);
});

test("source must contain 1–1000 characters and cannot hide control characters", () => {
  for (const bad of [undefined, null, 3, "", "  ", "x".repeat(1001), "\u0000bad"]) {
    invalid({currentStage: "contacted", source: bad}, /source/);
  }
  assert.equal(recordCommercialStage(null, {currentStage: "contacted", source: " x "}, actorId, at).source, "x");
  assert.equal(recordCommercialStage(null, {currentStage: "contacted", source: "x".repeat(1000)}, actorId, at).source.length, 1000);
});

test("only calendar occurrence dates on or before recordedAt are accepted", () => {
  for (const bad of ["2026-02-29", "2026-04-31", "2026-13-01", "2026-00-01", "0000-01-01",
    "2026-10-24", "10/01/2026", "2026-10-01T00:00:00Z", "", 1, undefined]) {
    invalid({currentStage: "contacted", source, occurredOn: bad}, /occurredOn/);
  }
  for (const good of ["2024-02-29", "2026-10-23", null]) {
    assert.equal(recordCommercialStage(null, {
      currentStage: "contacted", source, occurredOn: good,
    }, actorId, at).occurredOn, good);
  }
});

test("strict input excludes action metadata, actor spoofing and unrelated business facts", () => {
  for (const extra of [{actorId: "spoof"}, {recordedAt: at}, {history: []}, {proposalId: "fabricated"},
    {meetingDate: "2026-10-23"}, {accepted: true}, {amountUsd: 1}, {stage: "contacted"}]) {
    invalid({currentStage: "contacted", source, ...extra}, /unknown fields/);
  }
  for (const bad of [[], null, "contacted", 1, new Date(), Object.create({currentStage: "contacted"})]) {
    invalid(bad, /plain object/);
  }
  invalid({currentStage: "accepted", source}, /currentStage/);
});

test("completion reports reject duplicates, unknown, current and later stages", () => {
  for (const stages of [
    ["contacted", "contacted"], ["accepted"], ["awaiting_insurance_information"],
    ["insurance_information_received"], null, "contacted", undefined, Array(1),
  ]) invalid({currentStage: "awaiting_insurance_information", source, reportedCompletedStages: stages},
    /stage/i);
  invalid({currentStage: "contacted", source, reportedCompletedStages: ["contacted"]}, /before currentStage/);
});

test("server recording time and actor must be valid stable values", () => {
  for (const bad of ["", "staff name", " staff", "staff\n", "x".repeat(201)]) {
    assert.throws(() => recordCommercialStage(null, {currentStage: "contacted", source}, bad, at), /actor ID/);
  }
  for (const bad of ["", "2026-10-23", "2026-02-30T15:00:00.000Z", "2026-10-23T25:00:00Z",
    "2026-10-23T15:00:00+00:00", "0000-10-23T15:00:00Z"]) {
    assert.throws(() => recordCommercialStage(null, {currentStage: "contacted", source}, actorId, bad), /recordedAt/);
  }
});

test("corrupt previous records and history fail closed with conflict status", () => {
  const base = waiting();
  for (const bad of [
    {}, [], { ...base, history: [] }, { ...base, history: "lost" },
    { ...base, history: [{ ...base.history[0], unknown: true }] },
    { ...base, history: [{ ...base.history[0], actorId: "" }] },
    { ...base, history: [...Array(1), base.history[0]] },
    { ...base, history: [{ ...base.history[0], occurredOn: "2026-10-24" }] },
    { ...base, history: Array.from({length: 101}, () => base.history[0]) },
    { ...base, currentStage: "contacted" },
    { ...base, source: "Mismatched top source" },
    { ...base, unknown: true },
  ]) corrupt(bad, /Previous commercial-stage record is invalid/);
});

test("stale recording and reordered history fail closed", () => {
  assert.throws(() => recordCommercialStage(waiting(), {
    currentStage: "insurance_information_received", source,
  }, actorId, "2026-10-22T15:00:00.000Z"),
  (error: unknown) => error instanceof CommercialStageError && error.status === 409 && /older/.test(error.message));
  const base = waiting();
  corrupt({...base, history: [
    {...base.history[0], recordedAt: "2026-10-23T16:00:00.000Z"},
    base.history[0],
  ]}, /not ordered/);
});

test("history is bounded at 100 entries and preserves the latest report", () => {
  let current = waiting();
  for (let index = 0; index < 104; index++) current = recordCommercialStage(current, {
    currentStage: "awaiting_insurance_information", source: "Synthetic revision " + index,
  }, actorId, at);
  assert.equal(current.history.length, 100);
  assert.equal(current.history[0].source, "Synthetic revision 4");
  assert.equal(current.history[99].source, "Synthetic revision 103");
});

test("the helper is deterministic and leaves its inputs untouched without external effects", () => {
  const prior = waiting();
  const input = {currentStage: "insurance_information_received", source, occurredOn: null};
  const before = JSON.stringify({prior, input});
  const a = recordCommercialStage(prior, input, actorId, at);
  const b = recordCommercialStage(prior, input, actorId, at);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify({prior, input}), before);
  a.reportedCompletedStages.length = 0;
  a.history[0].reportedCompletedStages.length = 0;
  assert.equal(JSON.stringify({prior, input}), before);
  assert.deepEqual(b.reportedCompletedStages, firstThree);
});
