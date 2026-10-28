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
import {
  PROPERTY_CATEGORIES,
  PROPERTY_LISTINGS,
  getPropertiesByCategory,
} from "../lib/property-catalog";
import { buildCoherentWalkthrough } from "../components/PropertyWalkthroughStudio";

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
    comContent.includes('"/curated/commercial/cx_x3.jpg", "label": "Multi-Story Cold-Formed Steel Stud Framing"'),
    "Commercial Framing card must use verified people-free steel framing photo cx_x3.jpg"
  );
  assert.ok(
    comContent.includes('"/curated/pairs/div02_02_antes.jpg", "label": "Poured Commercial Slab & Stem Walls"'),
    "Commercial Concrete card must use verified people-free concrete slab photo div02_02_antes.jpg"
  );
  assert.ok(
    resContent.includes('<DivisionInteractivePropertyAtelier division="residential" />'),
    "app/residential/page.tsx must render DivisionInteractivePropertyAtelier"
  );
  assert.ok(
    comContent.includes('<DivisionInteractivePropertyAtelier division="commercial" />'),
    "app/commercial/page.tsx must render DivisionInteractivePropertyAtelier"
  );

  // Verify zero emojis in walkthrough studio, category showcase, and division pages
  const forbiddenEmojis = ["🌅", "☀️", "🌇", "🌙", "🪵", "🪨", "🏠", "✨", "⏱️", "📐", "🔥", "💧"];
  for (const rel of [
    "components/PropertyWalkthroughStudio.tsx",
    "components/PropertyCategoryShowcase.tsx",
    "app/residential/page.tsx",
    "app/commercial/page.tsx",
  ]) {
    const src = fs.readFileSync(path.resolve(process.cwd(), rel), "utf-8");
    for (const emoji of forbiddenEmojis) {
      assert.ok(
        !src.includes(emoji),
        `${rel} must use vector SVG icons instead of emoji "${emoji}"`
      );
    }
  }
});

test("4-Category Property Catalog (Single-Family Homes, Duplexes, Townhouses, Commercial Properties) has verified images and dedicated routes", () => {
  assert.equal(PROPERTY_CATEGORIES.length, 4);
  assert.deepEqual(
    PROPERTY_CATEGORIES.map((c) => c.slug),
    ["single-family", "duplexes", "townhouses", "commercial"]
  );
  assert.deepEqual(
    PROPERTY_CATEGORIES.map((c) => c.label),
    ["Single-Family Homes", "Duplexes", "Townhouses", "Commercial Properties"]
  );

  for (const cat of PROPERTY_CATEGORIES) {
    assertPublicImageExists(cat.heroImage, `Category Hero (${cat.slug})`);
    for (const sec of cat.secondaryImages) {
      assertPublicImageExists(sec, `Category Secondary (${cat.slug})`);
    }
    const items = getPropertiesByCategory(cat.slug);
    assert.equal(
      items.length,
      6,
      `Category "${cat.slug}" must have 6 curated properties`
    );
    for (const prop of items) {
      assert.equal(prop.triptych.length, 3);
      for (const frame of prop.triptych) {
        assertPublicImageExists(
          frame.src,
          `Property ${prop.code} (${cat.slug})`
        );
      }

      const walkthroughStops = buildCoherentWalkthrough(prop);
      assert.equal(walkthroughStops.length, 5);
      for (const stop of walkthroughStops) {
        assertPublicImageExists(
          stop.src,
          `Walkthrough Day ${prop.code} Step ${stop.stepNumber}`
        );
        assertPublicImageExists(
          stop.nightSrc,
          `Walkthrough Night ${prop.code} Step ${stop.stepNumber}`
        );
        assert.ok(
          stop.nightSrc.endsWith("-night.jpg"),
          `Walkthrough Night image for ${prop.code} Step ${stop.stepNumber} must end with -night.jpg, got ${stop.nightSrc}`
        );
      }
    }
  }

  assert.equal(PROPERTY_LISTINGS.length, 24);

  const walkthroughStudioContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/PropertyWalkthroughStudio.tsx"),
    "utf-8"
  );
  const studioImgMatches =
    walkthroughStudioContent.match(/\/curated\/properties\/[a-z0-9-]+\.jpg/gi) ??
    [];
  assert.ok(
    studioImgMatches.length >= 8,
    "PropertyWalkthroughStudio.tsx must reference coherent interior/exterior property photos"
  );
  for (const imgPath of studioImgMatches) {
    assertPublicImageExists(imgPath, "PropertyWalkthroughStudio.tsx");
  }

  const pageContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/page.tsx"),
    "utf-8"
  );
  assert.ok(
    pageContent.includes("LandingPropertyCategoriesSection"),
    "app/page.tsx must render LandingPropertyCategoriesSection"
  );
  for (const slug of ["single-family", "duplexes", "townhouses", "commercial"]) {
    assert.ok(
      pageContent.includes(`/properties/${slug}`),
      `app/page.tsx must include direct link to /properties/${slug}`
    );
  }

  const protectedImageContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/ProtectedImage.tsx"),
    "utf-8"
  );
  assert.ok(
    protectedImageContent.includes("v=pf20261028"),
    "ProtectedImage.tsx must include cache-busting version query parameter v=pf20261028"
  );
});
