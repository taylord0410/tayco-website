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
  getPropertyCategoryBySlug,
  getMarketSpecialtiesByCategory,
} from "../lib/property-catalog";
import {
  buildCoherentWalkthrough,
  resolveNightImageSrc,
} from "../components/PropertyWalkthroughStudio";

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

test("4 Primary Markets (Single-Family Homes, Multifamily, Townhomes, Commercial) have 8 specialties each + verified Day/Night images", () => {
  assert.equal(PROPERTY_CATEGORIES.length, 4);
  assert.deepEqual(
    PROPERTY_CATEGORIES.map((c) => c.slug),
    ["single-family", "duplexes", "townhouses", "commercial"]
  );
  assert.deepEqual(
    PROPERTY_CATEGORIES.map((c) => c.label),
    ["Single-Family Homes", "Multifamily", "Townhomes", "Commercial"]
  );

  // Verify slug aliases for /properties/multifamily and /properties/townhomes
  assert.equal(getPropertyCategoryBySlug("multifamily")?.slug, "duplexes");
  assert.equal(getPropertyCategoryBySlug("townhomes")?.slug, "townhouses");
  assert.equal(getPropertiesByCategory("multifamily").length, 6);
  assert.equal(getPropertiesByCategory("townhomes").length, 6);
  assert.equal(getMarketSpecialtiesByCategory("multifamily").length, 8);
  assert.equal(getMarketSpecialtiesByCategory("townhomes").length, 8);

  for (const cat of PROPERTY_CATEGORIES) {
    assertPublicImageExists(cat.heroImage, `Market Hero (${cat.slug})`);
    assertPublicImageExists(
      resolveNightImageSrc(cat.heroImage),
      `Market Hero Night (${cat.slug})`
    );
    for (const sec of cat.secondaryImages) {
      assertPublicImageExists(sec, `Market Secondary (${cat.slug})`);
      assertPublicImageExists(
        resolveNightImageSrc(sec),
        `Market Secondary Night (${cat.slug})`
      );
    }

    // Verify 8 Market-Specific Specialties (Roofing, Siding, Framing, Drywall, Flooring, Concrete, Stone, Carpentry/TI)
    const specialties = getMarketSpecialtiesByCategory(cat.slug);
    assert.equal(
      specialties.length,
      8,
      `Market "${cat.label}" (${cat.slug}) must have 8 specialty services`
    );
    assert.deepEqual(
      specialties.map((s) => s.specialtyId),
      [
        "roofing",
        "siding",
        "framing",
        "drywall",
        "flooring",
        "concrete",
        "stone",
        "carpentry",
      ]
    );
    const marketSeenImages = new Set<string>();
    for (const spec of specialties) {
      assert.equal(spec.triptych.length, 3);
      for (const frame of spec.triptych) {
        assert.ok(
          !marketSeenImages.has(frame.src),
          `Duplicate image "${frame.src}" within market "${cat.label}" at ${spec.code}`
        );
        marketSeenImages.add(frame.src);
        assertPublicImageExists(
          frame.src,
          `Specialty Day ${spec.code} (${cat.label})`
        );
        const nightSrc = resolveNightImageSrc(frame.src);
        assertPublicImageExists(
          nightSrc,
          `Specialty Night ${spec.code} (${cat.label})`
        );
      }
    }
    assert.equal(
      marketSeenImages.size,
      24,
      `Market "${cat.label}" must have 24 distinct images across its 8 specialty 3-step panels`
    );

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
  // Verify the 4 markets section appears FIRST in <main> before the split hero
  const marketsIdx = pageContent.indexOf("<LandingPropertyCategoriesSection />");
  const splitHeroIdx = pageContent.indexOf("SPLIT HERO 50/50");
  assert.ok(
    marketsIdx > 0 && marketsIdx < splitHeroIdx,
    "LandingPropertyCategoriesSection must appear FIRST in <main> before the construction services hero"
  );
  for (const slug of ["single-family", "duplexes", "townhouses", "commercial"]) {
    assert.ok(
      pageContent.includes(`/properties/${slug}`),
      `app/page.tsx must include direct link to /properties/${slug}`
    );
  }

  // Verify all 96 specialty panel photos across all 4 markets are 100% globally unique (0 cross-market duplicates)
  const globalSpecialtyImages = new Set<string>();
  for (const cat of PROPERTY_CATEGORIES) {
    for (const spec of getMarketSpecialtiesByCategory(cat.slug)) {
      for (const frame of spec.triptych) {
        assert.ok(
          !globalSpecialtyImages.has(frame.src),
          `Cross-market duplicate specialty image "${frame.src}" found in ${spec.code}`
        );
        globalSpecialtyImages.add(frame.src);
      }
    }
  }
  assert.equal(
    globalSpecialtyImages.size,
    96,
    "All 96 specialty photo slots (4 markets × 8 specialties × 3 steps) must use 96 globally unique Day/Night image pairs"
  );

  const protectedImageContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/ProtectedImage.tsx"),
    "utf-8"
  );
  assert.ok(
    protectedImageContent.includes("v=pf20261029"),
    "ProtectedImage.tsx must include cache-busting version query parameter v=pf20261029"
  );
  assert.ok(
    protectedImageContent.includes("export function VisualAssetIntegrityHud") &&
      protectedImageContent.includes("export function computeVisualAssetId") &&
      protectedImageContent.includes("export function computeVisualByteFingerprint"),
    "ProtectedImage.tsx must export VisualAssetIntegrityHud, computeVisualAssetId, and computeVisualByteFingerprint"
  );

  // Verify 96/96 unique binary SHA256 hashes across all 96 specialty Day and Night files
  const crypto = require("node:crypto");
  const globalSpecialtyDayHashes = new Set<string>();
  const globalSpecialtyNightHashes = new Set<string>();
  for (const cat of PROPERTY_CATEGORIES) {
    for (const spec of getMarketSpecialtiesByCategory(cat.slug)) {
      for (const frame of spec.triptych) {
        const dayDisk = path.resolve(
          process.cwd(),
          "public",
          frame.src.replace(/^\//, "")
        );
        const nightUrl = resolveNightImageSrc(frame.src);
        const nightDisk = path.resolve(
          process.cwd(),
          "public",
          nightUrl.replace(/^\//, "")
        );
        const daySha = crypto
          .createHash("sha256")
          .update(fs.readFileSync(dayDisk))
          .digest("hex");
        const nightSha = crypto
          .createHash("sha256")
          .update(fs.readFileSync(nightDisk))
          .digest("hex");
        assert.ok(
          !globalSpecialtyDayHashes.has(daySha),
          `Binary SHA256 collision on Specialty Day image ${frame.src} (${spec.code})`
        );
        assert.ok(
          !globalSpecialtyNightHashes.has(nightSha),
          `Binary SHA256 collision on Specialty Night image ${nightUrl} (${spec.code})`
        );
        globalSpecialtyDayHashes.add(daySha);
        globalSpecialtyNightHashes.add(nightSha);
      }
    }
  }
  assert.equal(globalSpecialtyDayHashes.size, 96);
  assert.equal(globalSpecialtyNightHashes.size, 96);

  // Verify 24/24 unique exterior SHA256 hashes across PROPERTY_LISTINGS
  const propertyExteriorHashes = new Set<string>();
  for (const prop of PROPERTY_LISTINGS) {
    const extDisk = path.resolve(
      process.cwd(),
      "public",
      prop.triptych[0].src.replace(/^\//, "")
    );
    const extSha = crypto
      .createHash("sha256")
      .update(fs.readFileSync(extDisk))
      .digest("hex");
    assert.ok(
      !propertyExteriorHashes.has(extSha),
      `Binary SHA256 collision on Property Exterior ${prop.id} (${prop.triptych[0].src})`
    );
    propertyExteriorHashes.add(extSha);
  }
  assert.equal(propertyExteriorHashes.size, 24);

  // Verify PropertyCategoryShowcase.tsx mounts VisualAssetIntegrityHud, Experience Mode Switcher, and Specialty Studio triggers
  const showcaseComponentContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/PropertyCategoryShowcase.tsx"),
    "utf-8"
  );
  assert.ok(
    showcaseComponentContent.includes("<VisualAssetIntegrityHud"),
    "PropertyCategoryShowcase.tsx must mount VisualAssetIntegrityHud"
  );
  assert.ok(
    showcaseComponentContent.includes('data-testid="market-experience-mode-switcher"'),
    "PropertyCategoryShowcase.tsx must include the unified market experience mode switcher"
  );
  assert.ok(
    showcaseComponentContent.includes("data-specialty-studio-trigger="),
    "MarketSpecialtyInteractiveCard must include a trigger button to expand the full-screen Specialty Studio"
  );
  assert.ok(
    walkthroughStudioContent.includes("export function buildSpecialtyWalkthroughStops") &&
      walkthroughStudioContent.includes("initialSpecialtyId"),
    "PropertyWalkthroughStudio.tsx must support full-screen Specialty Studio inspection and 8-specialty switching"
  );
});

test("V45 Architectural Atelier Typography, 60fps 3D Tilt Living Surfaces, Centered Capsules, and Zero-Hole Symmetric Grids", () => {
  const layoutContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/layout.tsx"),
    "utf-8"
  );
  const globalsContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/globals.css"),
    "utf-8"
  );
  const engineContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/EditorialLivingEngine.tsx"),
    "utf-8"
  );
  const showcaseContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/PropertyCategoryShowcase.tsx"),
    "utf-8"
  );
  const homeContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/page.tsx"),
    "utf-8"
  );
  const walkthroughContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/PropertyWalkthroughStudio.tsx"),
    "utf-8"
  );

  // 1. Luxury Editorial Typography Triad
  assert.ok(
    layoutContent.includes("Cormorant_Garamond") &&
      layoutContent.includes("Plus_Jakarta_Sans") &&
      layoutContent.includes("JetBrains_Mono"),
    "app/layout.tsx must load Cormorant Garamond, Plus Jakarta Sans, and JetBrains Mono"
  );
  assert.ok(
    globalsContent.includes(".tayco-display-title") &&
      globalsContent.includes(".tayco-card-title") &&
      globalsContent.includes(".tayco-atelier-btn-gold") &&
      globalsContent.includes(".tayco-atelier-btn-obsidian") &&
      globalsContent.includes(".tayco-atelier-pill"),
    "app/globals.css must define V45 Architectural Atelier typography and centered button/pill classes"
  );

  // 2. 60fps 3D Tilt & Magnetic Living Surfaces wired across all modules
  assert.ok(
    engineContent.includes("--response-lift") &&
      showcaseContent.includes('data-response-kind="surface"') &&
      showcaseContent.includes("data-magnetic") &&
      homeContent.includes('data-response-kind="surface"') &&
      homeContent.includes("data-magnetic"),
    "All Market, Specialty, Property, and Home cards/buttons must wire into EditorialLivingEngine 3D tilt & magnetic surfaces"
  );

  // 3. Centered Layout, Removed Redundant PHOTO 01..03 Strip, and Zero-Hole Symmetric Grids
  assert.ok(
    !showcaseContent.includes("PHOTO 0{idx + 1}"),
    "MarketSpecialtyInteractiveCard must not render the redundant truncated PHOTO 01..03 caption box row"
  );
  assert.ok(
    showcaseContent.includes("flex flex-wrap justify-center gap-7") &&
      homeContent.includes("flex flex-wrap justify-center gap-6") &&
      homeContent.includes("items-stretch") &&
      walkthroughContent.includes("items-stretch"),
    "Showcase, Home, and Studio Modal grids must use centered symmetric flex-wrap and items-stretch to eliminate column/bottom holes"
  );
});

