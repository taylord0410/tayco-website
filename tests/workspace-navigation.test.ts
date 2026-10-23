import { test } from "node:test";
import assert from "node:assert/strict";
import type { AuthRole } from "../lib/auth";
import { workspaceNavigation } from "../lib/workspace-navigation";
import { guestModuleDefinitions, guestSections, isGuestSection } from "../lib/guest-sections";

const adminIds = [
  "executive", "financial_dashboard", "project", "corporate_meetings", "followups",
  "document", "note", "change", "lead", "proposal", "vendor", "bid", "hours",
  "purchase_order", "team", "compliance", "finance", "invoice", "dossier",
  "estimate", "takeoff", "activity",
];
const clientIds = ["executive", "project", "document", "note", "change", "finance", "invoice", "dossier"];
const vendorIds = ["executive", "project", "document", "note", "vendor", "bid", "hours", "purchase_order", "finance", "invoice"];
const roles: AuthRole[] = ["admin", "staff", "client", "vendor", "guest"];

test("the complete administrator catalog preserves module order and staff navigation", () => {
  assert.deepEqual(workspaceNavigation("admin").map(item => item.id), adminIds);
  assert.deepEqual(workspaceNavigation("staff"), workspaceNavigation("admin"));
  assert.deepEqual(workspaceNavigation("guest"), workspaceNavigation("admin"));
});

test("guest menu preserves every administrator label and group without adopting authority", () => {
  const aliases: Record<string, string> = { executive: "summary", project: "projects", document: "plans", estimate: "estimates" };
  const guestById = new Map(guestModuleDefinitions.map(item => [item.id as string, item]));
  for (const item of workspaceNavigation("admin")) {
    const guest = guestById.get(aliases[item.id] || item.id);
    assert.ok(guest, item.id + " must remain visible to a guest");
    assert.equal(guest.label, item.label, item.id);
    assert.equal(guest.group, item.group, item.id);
    // The shared catalog describes navigation; permission and account data cannot ride along.
    assert.deepEqual(Object.keys(guest).sort(), ["group", "id", "label"]);
  }
  assert.equal(guestModuleDefinitions.length, adminIds.length + 1);
  assert.deepEqual(guestById.get("access"), { id: "access", label: "B2B access & invitations", group: "Connections" });
  assert.deepEqual(guestModuleDefinitions.map(item => item.id), [
    "summary", "financial_dashboard", "projects", "corporate_meetings", "followups",
    "plans", "note", "change", "lead", "proposal", "vendor", "bid", "hours",
    "purchase_order", "team", "compliance", "finance", "invoice", "dossier",
    "estimates", "takeoff", "activity", "access",
  ]);
});

test("client and provider navigation retain their existing scope and wording", () => {
  const client = workspaceNavigation("client"), vendor = workspaceNavigation("vendor");
  assert.deepEqual(client.map(item => item.id), clientIds);
  assert.deepEqual(vendor.map(item => item.id), vendorIds);
  assert.equal(vendor.find(item => item.id === "vendor")?.label, "My company");
  assert.equal(workspaceNavigation("admin").find(item => item.id === "vendor")?.label, "Trade partners");
  assert.ok(!vendor.some(item => ["change", "dossier", "team", "compliance", "access"].includes(item.id)));
  assert.ok(!client.some(item => ["vendor", "bid", "hours", "purchase_order", "access"].includes(item.id)));
  const adminById = new Map(workspaceNavigation("admin").map(item => [item.id, item]));
  for (const item of [...client, ...vendor.filter(item => item.id !== "vendor")]) {
    assert.deepEqual(item, adminById.get(item.id));
  }
});

test("all role catalogs and guest API sections have unique valid identifiers", () => {
  for (const role of roles) {
    const items = workspaceNavigation(role);
    assert.equal(new Set(items.map(item => item.id)).size, items.length, role);
    for (const item of items) {
      assert.match(item.id, /^[a-z][a-z0-9_]*$/, role);
      assert.ok(item.label.trim().length > 0);
      assert.ok(item.group.trim().length > 0);
      assert.deepEqual(Object.keys(item).sort(), ["group", "id", "label"]);
    }
  }
  const guestIds = guestModuleDefinitions.map(item => item.id);
  assert.equal(new Set(guestIds).size, guestIds.length);
  assert.equal(new Set(guestSections).size, guestSections.length);
  assert.deepEqual([...guestIds].sort(), [...guestSections].sort());
  for (const section of guestSections) {
    assert.match(section, /^[a-z][a-z0-9_]*$/);
    assert.equal(isGuestSection(section), true);
  }
});

test("guest section validation rejects administrative aliases and malformed values", () => {
  for (const value of [undefined, null, false, 0, {}, [], "executive", "project", "document", "estimate", "admin", "__proto__", "constructor", " summary", "summary ", "SUMMARY", "summary?role=admin"]) {
    assert.equal(isGuestSection(value), false, String(value));
  }
});
