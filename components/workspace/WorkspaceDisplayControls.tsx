"use client";
import { useMemo, useSyncExternalStore } from "react";

export type WorkspaceDisplay = { atmosphere: "calm" | "deep"; density: "comfortable" | "compact"; lightAngle: number };
const defaults: WorkspaceDisplay = { atmosphere: "deep", density: "comfortable", lightAngle: 45 };
const fallback = JSON.stringify(defaults), key = "tayco-workspace-display-v1", event = "tayco:workspace-display";
let memory = fallback;
function snapshot() { try { return window.localStorage.getItem(key) || memory; } catch { return memory; } }
function subscribe(listener: () => void) { window.addEventListener("storage", listener); window.addEventListener(event, listener); return () => { window.removeEventListener("storage", listener); window.removeEventListener(event, listener); }; }
function normalize(raw: string): WorkspaceDisplay { try { const value = JSON.parse(raw); return { atmosphere: value.atmosphere === "calm" ? "calm" : "deep", density: value.density === "compact" ? "compact" : "comfortable", lightAngle: typeof value.lightAngle === "number" && Number.isFinite(value.lightAngle) ? Math.max(15, Math.min(85, value.lightAngle)) : 45 }; } catch { return defaults; } }
export function useWorkspaceDisplay() {
 const raw = useSyncExternalStore(subscribe, snapshot, () => fallback);
 const value = useMemo(() => normalize(raw), [raw]);
 const change = (next: WorkspaceDisplay) => { memory = JSON.stringify(next); try { window.localStorage.setItem(key, memory); } catch { /* The current tab still keeps its selection. */ } window.dispatchEvent(new Event(event)); };
 return [value, change] as const;
}
export default function WorkspaceDisplayControls({ value, onChange }: { value: WorkspaceDisplay; onChange: (value: WorkspaceDisplay) => void }) {
 return <details className="workspace-display" data-testid="workspace-display-controls"><summary>Display & atmosphere <span aria-hidden="true">◐</span></summary><div className="workspace-display-options">
  <fieldset><legend>Atmosphere</legend><div className="workspace-segment">{(["calm", "deep"] as const).map(option => <button key={option} type="button" aria-pressed={value.atmosphere === option} onClick={() => onChange({ ...value, atmosphere: option })}>{option === "calm" ? "Calm" : "Deep"}</button>)}</div></fieldset>
  <fieldset><legend>Density</legend><div className="workspace-segment">{(["comfortable", "compact"] as const).map(option => <button key={option} type="button" aria-pressed={value.density === option} onClick={() => onChange({ ...value, density: option })}>{option === "comfortable" ? "Comfortable" : "Compact"}</button>)}</div></fieldset>
  <label className="workspace-light-control">Light direction <span>{value.lightAngle}°</span><input type="range" min={15} max={85} step={5} value={value.lightAngle} onChange={e => onChange({ ...value, lightAngle: Number(e.target.value) })} /></label>
  <p className="workspace-muted">Motion follows your device and the site’s motion preference. Display settings stay on this browser.</p>
 </div></details>;
}
