import test from "node:test";
import assert from "node:assert/strict";
import {
  VERIFIED_OCTOBER_2026_OPPORTUNITIES,
  CORPORATE_11_MODULES,
  CORPORATE_CERTIFICATIONS_STATUS,
  getOpportunityInfrastructureMeta,
  getOpportunityStartDate,
} from "../lib/verified-bidding-opportunities";

test("VERIFIED_OCTOBER_2026_OPPORTUNITIES has exactly 48 items (#2–#19, #21–#49 intake)", () => {
  assert.equal(VERIFIED_OCTOBER_2026_OPPORTUNITIES.length, 48);
  const numbers = VERIFIED_OCTOBER_2026_OPPORTUNITIES.map((item) => item.number);
  assert.equal(new Set(numbers).size, 48);
  assert.equal(numbers[0], 2);
  assert.equal(numbers[numbers.length - 1], 49);
  // AutoZone (#1) was intentionally omitted from intake
  assert.equal(numbers.includes(1), false);
  // All numbers fall within #2 through #49
  assert.ok(numbers.every((n) => n >= 2 && n <= 49));
});

test("46 items have status === 'Overdue' and 2 items have status === 'Pending company information' (#42 and #47)", () => {
  const overdue = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.status === "Overdue"
  );
  const pending = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.status === "Pending company information"
  );

  assert.equal(overdue.length, 46);
  assert.equal(pending.length, 2);
  assert.equal(overdue.length + pending.length, 48);

  const pendingNumbers = pending.map((item) => item.number).sort((a, b) => a - b);
  assert.deepEqual(pendingNumbers, [42, 47]);

  // Both pending company info items have deadlines between 2026-10-26 and 2026-10-27
  for (const item of pending) {
    assert.ok(
      typeof item.reportedDeadline === "string" &&
        item.reportedDeadline >= "2026-10-26" &&
        item.reportedDeadline <= "2026-10-27",
      `Expected deadline between 2026-10-26 and 2026-10-27 for #${item.number}, got ${item.reportedDeadline}`
    );
    assert.equal(item.statusEs, "Pendiente");
  }

  // All 46 overdue items have statusEs === "Cancelado"
  for (const item of overdue) {
    assert.equal(item.statusEs, "Cancelado");
  }

  // All 48 opportunities have a concrete reportedDeadline
  for (const item of VERIFIED_OCTOBER_2026_OPPORTUNITIES) {
    assert.ok(
      typeof item.reportedDeadline === "string" &&
        /^2026-\d{2}-\d{2}$/.test(item.reportedDeadline),
      `Expected valid reportedDeadline for #${item.number}, got ${item.reportedDeadline}`
    );
  }
});

test("getOpportunityStartDate returns varied YYYY-MM-DD earlier than reportedDeadline for all 48 opportunities", () => {
  const startDates = new Set<string>();

  for (const item of VERIFIED_OCTOBER_2026_OPPORTUNITIES) {
    const startDate = getOpportunityStartDate(item);
    assert.ok(
      typeof startDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(startDate),
      `Expected valid YYYY-MM-DD for #${item.number}, got ${startDate}`
    );
    assert.ok(
      startDate < (item.reportedDeadline as string),
      `Expected startDate (${startDate}) < reportedDeadline (${item.reportedDeadline}) for #${item.number}`
    );
    startDates.add(startDate);
  }

  // Verify that there are at least 20 distinct start dates
  assert.ok(
    startDates.size >= 20,
    `Expected at least 20 distinct start dates, got ${startDates.size}`
  );
});

test("47 items have a valid viewerHref and only #42 (State Highway District Maintenance Facility) has viewerHref === null", () => {
  const withViewer = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) =>
      typeof item.viewerHref === "string" &&
      item.viewerHref.startsWith(
        "/api/takeoff-viewer/viewer?embed=1&project="
      )
  );
  const nullViewer = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.viewerHref === null
  );

  assert.equal(withViewer.length, 47);
  assert.equal(nullViewer.length, 1);
  assert.equal(nullViewer[0].number, 42);
  assert.equal(nullViewer[0].name, "State Highway District Maintenance Facility");
  assert.equal(nullViewer[0].documentState, "pending");
});

test("every item has a valid infrastructureType ('Public' or 'Private') and all 48 packages (#2–#49) have verified dollar prices", () => {
  const publicItems = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.infrastructureType === "Public"
  );
  const privateItems = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.infrastructureType === "Private"
  );
  assert.equal(publicItems.length, 14);
  assert.equal(privateItems.length, 34);
  assert.equal(publicItems.length + privateItems.length, 48);

  const pricedItems = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter((item) =>
    item.estimatedPrice.startsWith("$")
  );
  const unpricedItems = VERIFIED_OCTOBER_2026_OPPORTUNITIES.filter(
    (item) => item.estimatedPrice === "Not set — awaiting quote"
  );
  assert.equal(pricedItems.length, 48);
  assert.equal(unpricedItems.length, 0);

  for (const item of VERIFIED_OCTOBER_2026_OPPORTUNITIES) {
    assert.ok(item.contractor.length > 3);
    const meta = getOpportunityInfrastructureMeta(item);
    assert.equal(meta.sectorType, item.infrastructureType);
    assert.ok(
      (item.infrastructureType === 'Public' ? meta.badgeLabel.includes(' · ') && /^(Public|Municipal|State|Federal|County) /.test(meta.badgeLabel) : meta.badgeLabel.startsWith('Private · ')),
      `Expected descriptive badgeLabel for #${item.number}, got ${meta.badgeLabel}`
    );
    assert.ok(meta.subLabel.length >= 10);
    const serialized = JSON.stringify(item);
    assert.equal(/\$250,?000/.test(serialized), false);
    assert.equal(/Centro Comunitario Norte/i.test(serialized), false);
    assert.equal(/Centro Consultorio/i.test(serialized), false);
    assert.equal(/Roma/i.test(serialized), false);
  }
});

test("CORPORATE_11_MODULES has all 11 corporate modules", () => {
  const expectedModules = [
    "Dashboard",
    "Projects",
    "Billing",
    "Accounting",
    "Administration",
    "New Opportunities",
    "Payroll",
    "Compliance",
    "Documents",
    "Meetings",
    "Corporate Reports",
  ];

  assert.equal(CORPORATE_11_MODULES.length, 11);
  const labels = CORPORATE_11_MODULES.map((m) => m.label);
  assert.deepEqual([...labels], expectedModules);

  // Each module has unique id and code
  const ids = CORPORATE_11_MODULES.map((m) => m.id);
  assert.equal(new Set(ids).size, 11);
  const codes = CORPORATE_11_MODULES.map((m) => m.code);
  assert.equal(new Set(codes).size, 11);
});

test("CORPORATE_CERTIFICATIONS_STATUS has all 8 items", () => {
  const expectedCodes = [
    "SAM.gov",
    "SBE",
    "WBE",
    "MBE",
    "ESBE",
    "Federal Programs",
    "State Programs",
    "Union / Private",
  ];

  assert.equal(CORPORATE_CERTIFICATIONS_STATUS.length, 8);
  const actualCodes = CORPORATE_CERTIFICATIONS_STATUS.map((c) => c.code);
  assert.deepEqual([...actualCodes], expectedCodes);

  // All 8 certifications are Active
  const active = CORPORATE_CERTIFICATIONS_STATUS.filter(
    (c) => c.status === "Active"
  );
  assert.equal(active.length, 8);
});
