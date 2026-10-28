import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  COMMERCIAL_HERO_SCENES,
  RESIDENTIAL_HERO_SCENES,
  TRANSFORMATION_PAIRS,
  MARQUEE_TRACK_TOP,
  MARQUEE_TRACK_BOTTOM,
  REGIONAL_STATE_HUBS,
} from "../components/LandingLivingShowcase";

const publicDir = path.resolve(process.cwd(), "public");

function assertPublicImageExists(webPath: string, contextLabel: string) {
  assert.ok(
    webPath.startsWith("/"),
    `${contextLabel}: image path "${webPath}" must start with "/"`
  );
  const absPath = path.join(publicDir, webPath.replace(/^\/+/, ""));
  assert.ok(
    fs.existsSync(absPath),
    `${contextLabel}: missing physical image file at "${absPath}"`
  );
  const stat = fs.statSync(absPath);
  assert.ok(
    stat.size > 15_000,
    `${contextLabel}: image "${webPath}" is unexpectedly small (${stat.size} bytes)`
  );
  assert.ok(
    stat.size < 450_000,
    `${contextLabel}: image "${webPath}" exceeds web-optimized budget (${stat.size} bytes)`
  );
}

test("All curated Hero, Before/After, Marquee, and Regional images exist and meet web budget", () => {
  assert.equal(COMMERCIAL_HERO_SCENES.length, 6);
  for (const s of COMMERCIAL_HERO_SCENES) {
    assertPublicImageExists(s.image, `Commercial Hero (${s.id})`);
  }

  assert.equal(RESIDENTIAL_HERO_SCENES.length, 6);
  for (const s of RESIDENTIAL_HERO_SCENES) {
    assertPublicImageExists(s.image, `Residential Hero (${s.id})`);
  }

  assert.equal(TRANSFORMATION_PAIRS.length, 12);
  for (const p of TRANSFORMATION_PAIRS) {
    assertPublicImageExists(p.beforeImg, `Before Pair (${p.id})`);
    assertPublicImageExists(p.afterImg, `After Pair (${p.id})`);
  }

  assert.equal(MARQUEE_TRACK_TOP.length, 8);
  for (const m of MARQUEE_TRACK_TOP) {
    assertPublicImageExists(m.image, `Marquee Top (${m.id})`);
  }

  assert.equal(MARQUEE_TRACK_BOTTOM.length, 8);
  for (const m of MARQUEE_TRACK_BOTTOM) {
    assertPublicImageExists(m.image, `Marquee Bottom (${m.id})`);
  }

  assert.equal(REGIONAL_STATE_HUBS.length, 8);
  for (const r of REGIONAL_STATE_HUBS) {
    assertPublicImageExists(r.sampleImage, `Regional Hub (${r.state})`);
  }
});

test("app/page.tsx references only existing curated/work images and excludes flagged artifacts", () => {
  const pageContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/page.tsx"),
    "utf-8"
  );

  // Extract all "/curated/..." and "/work/..." paths in app/page.tsx
  const matches = pageContent.match(/\/(?:curated|work)\/[a-zA-Z0-9_./-]+\.jpg/g) ?? [];
  assert.ok(
    matches.length >= 25,
    `Expected at least 25 curated/work image paths in app/page.tsx, found ${matches.length}`
  );

  for (const webPath of new Set(matches)) {
    assertPublicImageExists(webPath, `app/page.tsx reference`);
  }

  const forbidden = ["cx_h1", "com_01_2", "general-carpentry_03", "cx_x2"];
  for (const bad of forbidden) {
    assert.ok(
      !pageContent.includes(bad),
      `app/page.tsx must not reference flagged image "${bad}"`
    );
  }
});

test("app/commercial/page.tsx and app/residential/page.tsx include curated triptychs, transformation studio, and verified images", () => {
  for (const relPath of ["app/commercial/page.tsx", "app/residential/page.tsx"]) {
    const content = fs.readFileSync(path.resolve(process.cwd(), relPath), "utf-8");
    assert.ok(content.includes("ServiceCardTriptych"), `${relPath} must use ServiceCardTriptych`);
    assert.ok(content.includes("TransformationBeforeAfterStudio"), `${relPath} must use TransformationBeforeAfterStudio`);
    assert.ok(content.includes("DualTrackArchitecturalMarquee"), `${relPath} must use DualTrackArchitecturalMarquee`);
    assert.ok(!content.includes("ILLUSTRATIVE TRADE REFERENCE"), `${relPath} must not show ILLUSTRATIVE TRADE REFERENCE disclaimer`);

    const matches = content.match(/\/(?:curated|work)\/[a-zA-Z0-9_./-]+\.jpg/g) ?? [];
    assert.ok(
      matches.length >= 30,
      `Expected at least 30 image references in ${relPath}, found ${matches.length}`
    );
    for (const webPath of new Set(matches)) {
      assertPublicImageExists(webPath, `${relPath} reference`);
    }
  }
});

test("Privacy page contains client photography recreation notice and public pages have no disclaimer noise", () => {
  const privacyContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/privacy/page.tsx"),
    "utf-8"
  );
  assert.ok(
    privacyContent.includes("id=\"project-photography-privacy\""),
    "app/privacy/page.tsx must include #project-photography-privacy section"
  );
  assert.ok(
    privacyContent.includes("id=\"cookies-and-security\"") &&
      privacyContent.includes("id=\"form-encryption\"") &&
      privacyContent.includes("id=\"guest-review-privacy\"") &&
      privacyContent.includes("id=\"state-privacy-rights\""),
    "app/privacy/page.tsx must include all executive privacy and cookie governance sections"
  );
  const siteFrameContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/SiteFrame.tsx"),
    "utf-8"
  );
  assert.ok(
    siteFrameContent.includes("PublicCookieBanner"),
    "components/SiteFrame.tsx must render PublicCookieBanner on public pages"
  );
  assert.ok(
    privacyContent.includes("curated architectural recreations based on") &&
      privacyContent.includes("real projects, field conditions and scopes of work"),
    "app/privacy/page.tsx must disclose architectural recreations for client privacy"
  );

  for (const relPath of [
    "app/page.tsx",
    "app/commercial/page.tsx",
    "app/residential/page.tsx",
    "components/TradeGallery.tsx",
  ]) {
    const content = fs.readFileSync(path.resolve(process.cwd(), relPath), "utf-8");
    assert.ok(
      !content.includes("ILLUSTRATIVE TRADE REFERENCE") &&
        !content.includes("Illustrative trade &amp; material catalog"),
      `${relPath} must not contain repetitive illustrative disclaimer labels`
    );
  }
});

test("Image-to-title concordance: residential page excludes commercial-only photos and commercial trades match visual audit", () => {
  const resContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/residential/page.tsx"),
    "utf-8"
  );
  const commercialMisfiledInRes = [
    "/curated/residential/c2.jpg",
    "/curated/residential/c5.jpg",
    "/curated/residential/i1.jpg",
    "/curated/residential/i3.jpg",
    "/curated/residential/i4.jpg",
    "/curated/residential/i5.jpg",
    "/curated/residential/i6.jpg",
    "/curated/residential/r2.jpg",
    "/curated/residential/r5.jpg",
    "/curated/residential/s2.jpg",
    "/curated/residential/s4.jpg",
    "/curated/residential/s5.jpg",
    "/curated/commercial/",
  ];
  for (const bad of commercialMisfiledInRes) {
    assert.ok(
      !resContent.includes(bad),
      `app/residential/page.tsx must not reference commercial-only image "${bad}"`
    );
  }

  const comContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/commercial/page.tsx"),
    "utf-8"
  );
  // Verify visual audit alignment in Commercial page
  assert.ok(
    comContent.includes('"/curated/commercial/com_04_2.jpg", "label": "White TPO Flat Roof & Rooftop HVAC Curbs"'),
    "Commercial Roofing card must use verified TPO roof photo com_04_2.jpg"
  );
  assert.ok(
    comContent.includes('"/curated/commercial/cx_o3.jpg", "label": "2-Story Curtain-Wall & Metal Panel Envelope"'),
    "Commercial Exterior card must use verified exterior curtain-wall photo cx_o3.jpg"
  );
  assert.ok(
    comContent.includes('"/curated/commercial/cx_f1.jpg", "label": "Multi-Story Cold-Formed Steel Stud Framing"'),
    "Commercial Framing card must use verified steel stud framing photo cx_f1.jpg"
  );
  assert.ok(
    comContent.includes('"/curated/commercial/cx_f3.jpg", "label": "Poured Commercial Slab & Stem Walls"'),
    "Commercial Concrete card must use verified concrete slab photo cx_f3.jpg"
  );
});
