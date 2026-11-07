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
  getTransformationPairsForSiteDivision,
  getMarqueeTracksForSiteDivision,
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
  WALKTHROUGH_ROOMS_BY_PROJECT_ID,
} from "../components/PropertyWalkthroughStudio";
import {
  getResidentialTradesByDivision,
  getResidentialRestorationByDivision,
  resolveResidentialDivisionSlug,
} from "../components/division/ResidentialDivisionContent";

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

test("Division content (residential and commercial) includes curated triptychs, transformation studio, and verified images", () => {
  for (const relPath of ["components/division/CommercialDivisionContent.tsx", "components/division/ResidentialDivisionContent.tsx"]) {
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
    "components/division/CommercialDivisionContent.tsx",
    "components/division/ResidentialDivisionContent.tsx",
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

test("Image-to-title concordance: residential division content excludes commercial-only photos and commercial trades match visual audit", () => {
  const resContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/division/ResidentialDivisionContent.tsx"),
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
      `components/division/ResidentialDivisionContent.tsx must not reference commercial-only image "${bad}"`
    );
  }

  const comContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/division/CommercialDivisionContent.tsx"),
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
    comContent.includes('"/curated/commercial/com-cfs-stud-framing-3story.jpg", "label": "Multi-Story Cold-Formed Steel Stud Framing"'),
    "Commercial Framing card must use the verified people-free cold-formed steel stud photo (cx_x3.jpg is a finished high bay, 2026-11-07 audit)"
  );
  assert.ok(
    comContent.includes('"/curated/commercial/com-slab-stem-walls.jpg", "label": "Poured Commercial Slab & Stem Walls"'),
    "Commercial Concrete card must use the verified people-free slab photo (div02_02_antes.jpg is a wood-frame house, 2026-11-07 audit)"
  );
  // Each division page is its market view (its projects open the walkthrough studio) plus its division content.
  const divisionPage = fs.readFileSync(path.resolve(process.cwd(), "components/division/DivisionPage.tsx"), "utf-8");
  assert.ok(
    divisionPage.includes("<PropertyCategoryPageView activeCategory={meta}>") &&
      divisionPage.includes("<CommercialDivisionContent />") &&
      divisionPage.includes("<ResidentialDivisionContent />"),
    "components/division/DivisionPage.tsx must render the market view with the division content"
  );

  // Verify zero emojis in walkthrough studio, category showcase, and division pages
  const forbiddenEmojis = ["🌅", "☀️", "🌇", "🌙", "🪵", "🪨", "🏠", "✨", "⏱️", "📐", "🔥", "💧"];
  for (const rel of [
    "components/PropertyWalkthroughStudio.tsx",
    "components/PropertyCategoryShowcase.tsx",
    "components/division/ResidentialDivisionContent.tsx",
    "components/division/CommercialDivisionContent.tsx",
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
    ["single-family", "multifamily", "townhomes", "commercial"]
  );
  assert.deepEqual(
    PROPERTY_CATEGORIES.map((c) => c.label),
    ["Single-Family Homes", "Multifamily", "Townhomes", "Commercial"]
  );

  // Canonical slugs, plus the pre-November slugs that old links still use
  assert.equal(getPropertyCategoryBySlug("multifamily")?.slug, "multifamily");
  assert.equal(getPropertyCategoryBySlug("townhomes")?.slug, "townhomes");
  assert.equal(getPropertyCategoryBySlug("duplexes")?.slug, "multifamily");
  assert.equal(getPropertyCategoryBySlug("townhouses")?.slug, "townhomes");
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
  // Markets lead directly into the existing editorial transition.
  const marketsIdx = pageContent.indexOf("<LandingPropertyCategoriesSection />");
  const tickerIdx = pageContent.indexOf('className="tayco-editorial-ticker"');
  assert.ok(
    marketsIdx > 0 && marketsIdx < tickerIdx,
    "The four markets must lead into the editorial ticker"
  );
  assert.ok(
    !pageContent.includes("COMMERCIAL_HERO_SCENES") &&
      !pageContent.includes("RESIDENTIAL_HERO_SCENES"),
    "Home must not load the retired split hero scenes"
  );
  for (const slug of ["single-family", "multifamily", "townhomes", "commercial"]) {
    assert.ok(
      PROPERTY_CATEGORIES.some((category) => category.slug === slug),
      `The market navigation must retain ${slug}`
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
      homeContent.includes('className="home-editorial-grid"') &&
      walkthroughContent.includes("items-stretch"),
    "Showcase and Studio use symmetric flex layouts; Home uses the responsive editorial grid"
  );
});

test("V46 Unified Design System (Astralis + Umbra), Soft-Rounded Geometry, Elevated Navbar, Balanced Card Equilibrium & Gallery Scroll/Event Isolation", () => {
  const dsContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/ui/TaycoDesignSystem.tsx"),
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
  const navbarContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/Navbar.tsx"),
    "utf-8"
  );
  const footerContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/Footer.tsx"),
    "utf-8"
  );
  const contractingContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/ContractingOpportunities.tsx"),
    "utf-8"
  );
  const studioContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/PropertyWalkthroughStudio.tsx"),
    "utf-8"
  );
  const showcaseContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/PropertyCategoryShowcase.tsx"),
    "utf-8"
  );
  const tradeGalleryContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/TradeGallery.tsx"),
    "utf-8"
  );
  const livingShowcaseContent = fs.readFileSync(
    path.resolve(process.cwd(), "components/LandingLivingShowcase.tsx"),
    "utf-8"
  );
  const homeContent = fs.readFileSync(
    path.resolve(process.cwd(), "app/page.tsx"),
    "utf-8"
  );

  // 1. Canonical V46 Design System primitives & hooks
  for (const sym of [
    "TAYCO_DESIGN_SYSTEM_V46",
    "export function useTaycoGalleryLock",
    "export function TaycoModalOverlay",
    "export function TaycoSectionHeader",
    "export function TaycoPillDock",
    "export function TaycoCardMetaBar",
    "export function TaycoSpecGrid",
    "export function TaycoDeliverableGrid",
    "export function TaycoCardFooterBar",
  ]) {
    assert.ok(
      dsContent.includes(sym),
      `components/ui/TaycoDesignSystem.tsx must define "${sym}"`
    );
  }

  // 2. CSS Tokens, Navbar Typography Restoration (zero Arial), and Global Modal Lock
  assert.ok(
    globalsContent.includes("--tayco-r-lg") &&
      globalsContent.includes("--tayco-r-pill") &&
      globalsContent.includes("--tayco-scrollbar-comp") &&
      globalsContent.includes(".tayco-nav-pill-dock") &&
      globalsContent.includes(".tayco-scrollbar-sleek") &&
      globalsContent.includes('body[data-modal-open="true"]'),
    "app/globals.css must define V46 soft-radius tokens, .tayco-nav-pill-dock, .tayco-scrollbar-sleek, and modal scroll lock"
  );
  assert.ok(
    !globalsContent.includes("Arial, Helvetica"),
    "app/globals.css must not hardcode Arial, Helvetica in navigation or UI controls"
  );
  assert.ok(
    navbarContent.includes("tayco-nav-pill-dock") &&
      navbarContent.includes("useTaycoGalleryLock"),
    "components/Navbar.tsx must use the 3-zone .tayco-nav-pill-dock command bar and useTaycoGalleryLock for mobile drawer isolation"
  );
  assert.ok(
    !footerContent.includes("🔒"),
    "components/Footer.tsx must use a vector SVG lock icon instead of raw lock emoji"
  );

  // 3. Strict Gallery/Lightbox Scroll Lock & Background Event Isolation (Umbra Ownership)
  assert.ok(
    engineContent.includes('document.body.dataset.modalOpen === "true"'),
    "EditorialLivingEngine.tsx must freeze background 3D tilt tracking when a modal/gallery is open"
  );
  for (const [label, src] of [
    ["PropertyWalkthroughStudio.tsx", studioContent],
    ["TradeGallery.tsx", tradeGalleryContent],
    ["LandingLivingShowcase.tsx", livingShowcaseContent],
    ["app/page.tsx", homeContent],
  ] as const) {
    assert.ok(
      src.includes("TaycoModalOverlay"),
      `${label} must render its interactive gallery/lightbox inside TaycoModalOverlay for 100% scroll & event isolation`
    );
  }

  // 4. Independent Laptop (100dvh) Stage vs. Right Sidebar Scrolling in Walkthrough Studio
  assert.ok(
    studioContent.includes("lg:overflow-hidden") &&
      studioContent.includes("lg:overflow-y-auto") &&
      studioContent.includes("94dvh"),
    "PropertyWalkthroughStudio.tsx must isolate Left Stage and Right Atelier Sidebar scrolling within 94dvh so top solar controls never clip"
  );

  // 5. Balanced Space-Utilizing Card Interiors + Pill Dock Equilibrium
  assert.ok(
    showcaseContent.includes("TaycoPillDock") &&
      showcaseContent.includes("TaycoCardMetaBar") &&
      showcaseContent.includes("TaycoDeliverableGrid") &&
      showcaseContent.includes("TaycoCardFooterBar"),
    "PropertyCategoryShowcase.tsx must combine centered macro PillDocks/grids with space-utilizing TaycoCardMetaBar, TaycoDeliverableGrid, and TaycoCardFooterBar"
  );

  // 6. Zero Sharp / Pointed Corners Across Refactored Public Components
  const sharpCornerPattern =
    /(?:^|[\s"'`])(?:rounded|rounded-none|rounded-xs|rounded-sm)(?=$|[\s"'`])/;
  const softGeometryTargets = [
    "components/Navbar.tsx",
    "components/Footer.tsx",
    "components/ContractingOpportunities.tsx",
    "components/ProtectedImage.tsx",
    "components/PropertyWalkthroughStudio.tsx",
    "components/TradeGallery.tsx",
    "components/PropertyCategoryShowcase.tsx",
    "components/LandingLivingShowcase.tsx",
    "app/page.tsx",
    "components/division/CommercialDivisionContent.tsx",
    "components/division/ResidentialDivisionContent.tsx",
    "app/investor/page.tsx",
    "app/estimate/page.tsx",
    "app/vendor-application/page.tsx",
    "app/privacy/page.tsx",
    "components/SiteFrame.tsx",
    "components/PublicCookieBanner.tsx",
  ];
  for (const rel of softGeometryTargets) {
    const src = fs.readFileSync(path.resolve(process.cwd(), rel), "utf-8");
    const lines = src.split("\n");
    lines.forEach((line, idx) => {
      // Only inspect className / template strings, ignoring comments
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
      assert.ok(
        !sharpCornerPattern.test(line),
        `${rel}:${idx + 1} contains sharp corner class ("rounded" / "rounded-sm" / "rounded-xs" / "rounded-none"): ${trimmed}`
      );
    });
  }
  assert.ok(
    !contractingContent.includes("border-l-2"),
    "ContractingOpportunities.tsx must replace sharp border-l-2 rule with soft-rounded milestone bento cards"
  );
});

test("Code 2, 3, and 4: Project-specific walkthrough rooms, division-specific residential trade triptychs, and division-filtered Before/After & Marquee", () => {
  // Code 2: WALKTHROUGH_ROOMS_BY_PROJECT_ID maps all 24 projects and preserves project overrides
  assert.equal(Object.keys(WALKTHROUGH_ROOMS_BY_PROJECT_ID).length, 24);
  for (const prop of PROPERTY_LISTINGS) {
    assert.ok(
      WALKTHROUGH_ROOMS_BY_PROJECT_ID[prop.id],
      `Missing walkthrough rooms entry for ${prop.id}`
    );
    const stops = buildCoherentWalkthrough(prop);
    assert.equal(stops.length, 5);
    assert.equal(stops[0].src, prop.triptych[0].src);
    if (prop.id === "sfh-101") {
      assert.equal(stops[2].src, "/curated/hero/res-navy-kitchen.jpg");
    }
    if (prop.id === "sfh-104") {
      assert.equal(stops[2].src, "/curated/residential/div01_08_despues.jpg");
    }
    if (prop.category === "commercial") {
      assert.equal(stops[2].src, prop.triptych[1].src);
      assert.equal(stops[3].src, prop.triptych[2].src);
    }
  }

  // Code 3: Residential division trade cards and restoration cards differ across single-family, multifamily, and townhomes
  assert.equal(resolveResidentialDivisionSlug("/single-family"), "single-family");
  assert.equal(resolveResidentialDivisionSlug("/multifamily"), "multifamily");
  assert.equal(resolveResidentialDivisionSlug("/townhomes"), "townhomes");

  const sfTrades = getResidentialTradesByDivision("single-family");
  const mfTrades = getResidentialTradesByDivision("multifamily");
  const twnTrades = getResidentialTradesByDivision("townhomes");
  assert.equal(sfTrades.length, 8);
  assert.equal(mfTrades.length, 8);
  assert.equal(twnTrades.length, 8);

  for (let i = 0; i < 8; i++) {
    assert.notDeepEqual(
      sfTrades[i].triptych.map((f) => f.src),
      mfTrades[i].triptych.map((f) => f.src),
      `Trade ${sfTrades[i].csiCode} must not use identical triptych photos between single-family and multifamily`
    );
    assert.notDeepEqual(
      sfTrades[i].triptych.map((f) => f.src),
      twnTrades[i].triptych.map((f) => f.src),
      `Trade ${sfTrades[i].csiCode} must not use identical triptych photos between single-family and townhomes`
    );
    assert.notDeepEqual(
      mfTrades[i].triptych.map((f) => f.src),
      twnTrades[i].triptych.map((f) => f.src),
      `Trade ${sfTrades[i].csiCode} must not use identical triptych photos between multifamily and townhomes`
    );
  }

  const sfRest = getResidentialRestorationByDivision("single-family");
  const mfRest = getResidentialRestorationByDivision("multifamily");
  const twnRest = getResidentialRestorationByDivision("townhomes");
  assert.notDeepEqual(sfRest.fire, mfRest.fire);
  assert.notDeepEqual(sfRest.fire, twnRest.fire);
  assert.notDeepEqual(sfRest.water, mfRest.water);
  assert.notDeepEqual(sfRest.water, twnRest.water);

  // Code 4: Before/After pairs and Marquee tracks filter by division while keeping full sets for landing ("all")
  assert.equal(getTransformationPairsForSiteDivision("all").length, 12);
  for (const div of ["single-family", "multifamily", "townhomes", "commercial"] as const) {
    const pairs = getTransformationPairsForSiteDivision(div);
    assert.ok(
      pairs.length >= 2 && pairs.length < 12,
      `Division ${div} must receive a filtered subset of transformation pairs (got ${pairs.length})`
    );
    for (const pair of pairs) {
      if (div === "commercial") {
        assert.equal(pair.siteDivision, "commercial");
      } else {
        assert.notEqual(pair.siteDivision, "commercial");
      }
    }

    const tracks = getMarqueeTracksForSiteDivision(div);
    assert.ok(tracks.topTrack.length >= 3);
    assert.ok(tracks.bottomTrack.length >= 3);
    for (const shot of tracks.allShots) {
      assertPublicImageExists(shot.image, `Marquee (${div}) ${shot.id}`);
    }
  }
});



