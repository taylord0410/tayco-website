import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ProfileAReview } from "../lib/profile-a-review";

// Node's markup probe omits stylesheet parsing, not production React components.
// This is scoped to this test worker. Next's actual CSS is checked by its build.
const require = createRequire(import.meta.url);
require.extensions[".css"] = () => undefined;
const loadConsole = () => import("../components/workspace/ProfileAReviewConsole");
type Document = ProfileAReview["rows"][number]["documents"][number];
const href = (id = "synthetic-document") => "/api/takeoff-viewer/viewer?embed=1&project=synthetic-context&document=" + id;
function fixture(): ProfileAReview {
  let index = 0;
  const rows: ProfileAReview["rows"] = Array.from({ length: 23 }, (_, i) => ({
    id: "reported-opportunity-" + (i + 1),
    name: i === 16 ? "SYNTHETIC Livewell pending metadata" : "SYNTHETIC opportunity " + (i + 1),
    location: null, contractor: null, section: i < 17 ? "dated" : i < 22 ? "undated" : "live",
    reportedDeadline: i < 17 ? "2026-10-09" : null,
    documents: Array.from({ length: i === 0 ? 2 : 1 }, () => {
      const n = index++;
      return { name: "SYNTHETIC source " + n + ".pdf", state: n < 17 ? "received" : "pending",
        viewerHref: n < 17 ? href("synthetic-doc-" + n) : null };
    }),
  }));
  return { period: "2026-10", sourceLabel: "SYNTHETIC reported records",
    opportunityCount: 23, reportedDatedCount: 17, undatedCount: 5, liveCount: 1,
    documentCount: 24, receivedDocumentCount: 17, linkedDocumentCount: 17, rows };
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object") { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
const received = (access?: Document["recipientAccess"], viewerHref: string | null = href()): Document =>
  ({ name: "SYNTHETIC.pdf", state: "received", viewerHref, ...(access ? { recipientAccess: access } : {}) });
const count = (text: string, needle: string) => text.split(needle).length - 1;

test("actual console renders 23 opportunities / 17 received / 7 metadata-pending, without size promotion", async () => {
  const { default: Console } = await loadConsole();
  const data = freeze(fixture()), before = JSON.stringify(data);
  const markup = renderToStaticMarkup(createElement(Console, { data }));
  assert.match(markup, /23 reported opportunities and 24 listed source documents/);
  assert.match(markup, /17 of 24 listed files are reported received; 7 remain pending in source metadata/);
  assert.match(markup, /17 received files have links/);
  assert.match(markup, /does not establish physical absence or recipient authorization/);
  assert.doesNotMatch(markup, /100%|0 listed files|24 verified|all.*connected|SHA-256 verified/);
  assert.equal(JSON.stringify(data), before);
});

test("actual production document component keeps every reported state and supplied name", async () => {
  const { ReviewSourceDocuments } = await loadConsole();
  const data = freeze(fixture()), before = JSON.stringify(data);
  const markup = data.rows.map(project => renderToStaticMarkup(createElement(ReviewSourceDocuments, {
    project, visibleDocumentUrl: null, onOpen: () => assert.fail("SSR must not open anything"),
  }))).join("");
  assert.equal(count(markup, "Source metadata: Received"), 17);
  assert.equal(count(markup, "Source metadata: Pending"), 7);
  assert.equal(count(markup, "Open protected document"), 17);
  assert.match(markup, /SYNTHETIC Livewell pending metadata/);
  for (const forbidden of ["doc_received_", "doc_mission_pe_", "Morgan Park", "Cresco Labs", "Harper College",
    "Midwest Regional", "General Contractor", "TAYCO Commercial Bidding", "2311 HWY", "Kroger Construction"]) {
    assert.ok(!markup.includes(forbidden), forbidden);
  }
  assert.equal(count(markup, "Not documented"), 23 * 2 + 6);
  assert.equal(JSON.stringify(data), before);
});

test("actual summary preserves distinct recipient coverage and its asOf snapshot", async () => {
  const { default: Console } = await loadConsole();
  const data = fixture();
  data.recipientCoverage = { asOf: "2026-10-24T11:12:13.000Z", availableDocumentCount: 5,
    notSelectedDocumentCount: 6, unavailableDocumentCount: 6, pendingSourceDocumentCount: 7 };
  const before = JSON.stringify(data);
  const markup = renderToStaticMarkup(createElement(Console, { data: freeze(data) }));
  assert.match(markup, /17 files are reported received\. 5 are available for this review; 6 are not selected; 6 have access currently unavailable/);
  assert.match(markup, /7 listed files remain pending in source metadata/);
  assert.match(markup, /Availability checked 2026-10-24T11:12:13\.000Z/);
  assert.equal(JSON.stringify(data), before);
});

for (const [access, label, opens] of [
  ["available", "Received · available for this review", true],
  ["not_selected", "Received · not selected for this review", false],
  ["authorization_unavailable", "Received · access currently unavailable", false],
  ["source_pending", "Pending at source", false],
] as const) {
  test("actual document markup preserves recipient access: " + access, async () => {
    const { ReviewSourceDocuments } = await loadConsole();
    const project = fixture().rows[0]; project.documents = [received(access)];
    const markup = renderToStaticMarkup(createElement(ReviewSourceDocuments, { project, visibleDocumentUrl: null, onOpen: () => undefined }));
    assert.ok(markup.includes(label));
    assert.match(markup, /Source metadata: Received/);
    assert.equal(markup.includes("Open protected document"), opens);
  });
}

test("source-pending document is never promoted by an available recipient flag or stale supplied href", async () => {
  const { ReviewSourceDocuments, reviewDocumentHref } = await loadConsole();
  const document: Document = { ...received("available"), state: "pending" };
  const project = fixture().rows[16]; project.documents = [document];
  assert.equal(reviewDocumentHref(document), null);
  const markup = renderToStaticMarkup(createElement(ReviewSourceDocuments, { project, visibleDocumentUrl: null, onOpen: () => undefined }));
  assert.match(markup, /Source metadata: Pending/);
  assert.doesNotMatch(markup, /Open protected document|Viewing protected document/);
});

test("null, generic, external, malformed and ambiguous links never render an open control", async () => {
  const { ReviewSourceDocuments, reviewDocumentHref } = await loadConsole();
  const invalid = [null, "/api/takeoff-viewer/viewer?embed=1", "/api/takeoff-viewer/viewer?project=p",
    "/api/takeoff-viewer/viewer?document=d", "/api/takeoff-viewer/viewer?project=p&document=",
    "https://example.test/api/takeoff-viewer/viewer?project=p&document=d",
    "//example.test/api/takeoff-viewer/viewer?project=p&document=d",
    "/api/takeoff-viewer/viewer?project=p&document=d&document=other",
    "/api/takeoff-viewer/viewer?project=p&project=other&document=d",
    "/api/takeoff-viewer/viewer?project=%2F&document=d", href() + "#changed"];
  for (const value of invalid) {
    const document = received(undefined, value);
    assert.equal(reviewDocumentHref(document), null, String(value));
    const project = fixture().rows[0]; project.documents = [document];
    const markup = renderToStaticMarkup(createElement(ReviewSourceDocuments, { project, visibleDocumentUrl: null, onOpen: () => undefined }));
    assert.doesNotMatch(markup, /Open protected document|Viewing protected document/, String(value));
  }
});

test("specific DTO link is retained verbatim without aliases or query rewriting", async () => {
  const { reviewDocumentHref, ReviewSourceDocuments } = await loadConsole();
  const exact = href("dto-specific-document") + "&page=3";
  const project = fixture().rows[0]; project.documents = [received("available", exact)];
  assert.equal(reviewDocumentHref(project.documents[0]), exact);
  const markup = renderToStaticMarkup(createElement(ReviewSourceDocuments, { project, visibleDocumentUrl: exact, onOpen: () => undefined }));
  assert.match(markup, /Viewing protected document/);
  assert.doesNotMatch(markup, /doc_received_|synthetic-context.*other/);
});

test("selected source withdraws on changed coverage, selection, removed href or revoked recipient state", async () => {
  const { selectedReviewDocumentUrl } = await loadConsole();
  const project = fixture().rows[0]; project.documents = [received("available")];
  const asOf = "2026-10-24T11:12:13.000Z";
  assert.equal(selectedReviewDocumentUrl(project, href(), asOf, asOf), href());
  assert.equal(selectedReviewDocumentUrl(project, href(), asOf, asOf + "changed"), null);
  assert.equal(selectedReviewDocumentUrl(project, href("another-document"), asOf, asOf), null);
  assert.equal(selectedReviewDocumentUrl(fixture().rows[16], href(), asOf, asOf), null);
  project.documents[0].recipientAccess = "not_selected";
  assert.equal(selectedReviewDocumentUrl(project, href(), asOf, asOf), null);
  project.documents[0] = received("available", null);
  assert.equal(selectedReviewDocumentUrl(project, href(), asOf, asOf), null);
  assert.equal(selectedReviewDocumentUrl(project, null, asOf, asOf), null);
});

test("administrative preview has no fabricated guest session, deadline, privacy acceptance or duration", async () => {
  const { default: Console } = await loadConsole();
  for (const size of [2, 19, 20, 23]) {
    const data = fixture(); data.rows = data.rows.slice(0, size);
    const markup = renderToStaticMarkup(createElement(Console, { data }));
    assert.match(markup, /Administrative preview · read only/);
    assert.doesNotMatch(markup, /Guest Access Active|Access ends|18:30:00|3h window|4h window|3-hour session policy|data-testid="guest-privacy"/);
  }
});

test("recipient render uses the supplied persisted deadline and retains the existing privacy component", async () => {
  const { default: Console } = await loadConsole();
  const review = freeze({ id: "synthetic-persisted-review", asOf: Date.parse("2026-10-24T11:00:00Z"), expiresAt: Date.parse("2026-10-24T14:17:23.456Z") });
  const props = freeze({ data: fixture(), review }), before = JSON.stringify(props);
  const markup = renderToStaticMarkup(createElement(Console, props));
  assert.match(markup, /Access ends 2026-10-24T14:17:23\.456Z UTC/);
  assert.match(markup, /Signing in or refreshing does not extend this review/);
  assert.match(markup, /data-testid="guest-privacy"/);
  assert.match(markup, /Reject optional analytics/);
  assert.doesNotMatch(markup, /2026-10-24T18:30:00|Guest Access Active|3h window|4h window/);
  assert.equal(JSON.stringify(props), before);
  // GuestPrivacyNotice content/consent logic is inherited, not rewritten by this fix.
});

test("unknown fields stay unknown while supplied location, contractor and reported date remain literal", async () => {
  const { ReviewSourceDocuments } = await loadConsole();
  const project = fixture().rows[0];
  project.location = "SYNTHETIC supplied location";
  project.contractor = "SYNTHETIC supplied contractor";
  const before = JSON.stringify(project);
  const markup = renderToStaticMarkup(createElement(ReviewSourceDocuments, { project: freeze(project), visibleDocumentUrl: null, onOpen: () => undefined }));
  assert.match(markup, /SYNTHETIC supplied location/); assert.match(markup, /SYNTHETIC supplied contractor/);
  assert.match(markup, /Oct 9, 2026/); assert.doesNotMatch(markup, /Overdue|awaiting company|insurance package|awarded|verified PDF/);
  assert.equal(JSON.stringify(project), before);
});
