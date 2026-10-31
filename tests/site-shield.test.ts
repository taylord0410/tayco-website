import { test } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateSiteShield,
  resetShieldStateForTests,
  buildAiExecutiveSummaryText,
  scrambleVisualBytes,
} from "../lib/site-shield";

const HUMAN_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

test("blocks direct image downloads, hotlinking, and all raw /curated/* and /work/* requests (enforcing encrypted canvas stream)", () => {
  resetShieldStateForTests();

  // 1. Opening image directly in a browser tab (Sec-Fetch-Dest: document) -> 403
  const directTab = evaluateSiteShield({
    method: "GET",
    pathname: "/curated/magazine/revista_fr_metal_04.jpg",
    clientIp: "174.192.68.31",
    userAgent: HUMAN_UA,
    host: "www.tayroofing.org",
    referer: null,
    secFetchDest: "document",
    secFetchMode: "navigate",
    secFetchSite: "none",
    accept: "text/html,application/xhtml+xml,image/webp,*/*;q=0.8",
  });
  assert.equal(directTab.action, "block");
  if (directTab.action === "block") {
    assert.equal(directTab.status, 403);
    assert.equal(directTab.reason, "image_direct_navigation");
  }

  // 2. Cross-site hotlinking -> 403
  const hotlink = evaluateSiteShield({
    method: "GET",
    pathname: "/curated/before_after/tr_01_after.png",
    clientIp: "174.192.68.31",
    userAgent: HUMAN_UA,
    host: "www.taycoturnkey.com",
    referer: "https://competitor-site.example/",
    secFetchDest: "image",
    secFetchMode: "no-cors",
    secFetchSite: "cross-site",
    accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  });
  assert.equal(hotlink.action, "block");
  if (hotlink.action === "block") {
    assert.equal(hotlink.status, 403);
    assert.equal(hotlink.reason, "image_cross_site_hotlink");
  }

  // 3. Even same-origin <img src="/curated/..."> or /work/... is blocked (403 raw_portfolio_asset_disabled)
  // so portfolio files never appear in DevTools Sources -> Page
  const rawPortfolioImg = evaluateSiteShield({
    method: "GET",
    pathname: "/curated/magazine/revista_fr_metal_04.jpg",
    clientIp: "174.192.68.31",
    userAgent: HUMAN_UA,
    host: "www.tayroofing.org",
    referer: "https://www.tayroofing.org/",
    secFetchDest: "image",
    secFetchMode: "no-cors",
    secFetchSite: "same-origin",
    accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  });
  assert.equal(rawPortfolioImg.action, "block");
  if (rawPortfolioImg.action === "block") {
    assert.equal(rawPortfolioImg.status, 403);
    assert.equal(rawPortfolioImg.reason, "raw_portfolio_asset_disabled");
  }

  // 4. Spoofed browser UA script fetching /logo.png without Sec-Fetch-Dest: image or TAYCO Referer -> 403
  const spoofedScript = evaluateSiteShield({
    method: "GET",
    pathname: "/logo.png",
    clientIp: "174.192.68.31",
    userAgent: HUMAN_UA,
    host: "www.taycoturnkey.com",
    referer: null,
    secFetchDest: null,
    secFetchMode: null,
    secFetchSite: null,
    accept: "*/*",
  });
  assert.equal(spoofedScript.action, "block");
  if (spoofedScript.action === "block") {
    assert.equal(spoofedScript.status, 403);
    assert.equal(spoofedScript.reason, "image_unverified_origin");
  }

  // 5. XOR binary stream cipher scrambles JPEG header bytes so Network response cannot be saved as an image
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46]);
  const scrambled = scrambleVisualBytes(jpegHeader);
  assert.notEqual(scrambled[0], 0xff);
  assert.notEqual(scrambled[1], 0xd8);
  const unscrambled = scrambleVisualBytes(scrambled);
  assert.deepEqual(Array.from(unscrambled), Array.from(jpegHeader));
});

test("blocks manual scrapers, trap paths (.env, .git, .svn), and penalizes hostile IPs", () => {
  resetShieldStateForTests();

  // 1. Manual CLI / scraper User-Agent -> 403
  for (const botUa of [
    "curl/8.5.0",
    "python-requests/2.31.0",
    "Wget/1.21.4",
    "Mozilla/5.0 ModatScanner/1.2 (+https://modat.io/)",
    "HTTrack 3.49",
  ]) {
    const res = evaluateSiteShield({
      method: "GET",
      pathname: "/",
      clientIp: "85.217.149.20",
      userAgent: botUa,
      host: "taycoturnkey.com",
      referer: null,
      secFetchDest: "document",
      secFetchMode: "navigate",
      secFetchSite: "none",
      accept: "*/*",
    });
    assert.equal(res.action, "block");
    if (res.action === "block") {
      assert.equal(res.status, 403);
      assert.equal(res.reason, "manual_bot_ua");
    }
  }

  // 2. Hitting a honeypot trap path (/.env) immediately penalizes the IP for 30 minutes
  const scannerIp = "213.209.159.133";
  const trapHit = evaluateSiteShield({
    method: "GET",
    pathname: "/.env",
    clientIp: scannerIp,
    userAgent: HUMAN_UA,
    host: "www.tayco.llc",
    referer: null,
    secFetchDest: "document",
    secFetchMode: "navigate",
    secFetchSite: "none",
    accept: "*/*",
    now: 1_000_000,
  });
  assert.equal(trapHit.action, "block");
  if (trapHit.action === "block") {
    assert.equal(trapHit.reason, "trap_path");
  }

  // Subsequent request to "/" from the penalized scanner IP is blocked
  const afterTrap = evaluateSiteShield({
    method: "GET",
    pathname: "/",
    clientIp: scannerIp,
    userAgent: HUMAN_UA,
    host: "www.tayco.llc",
    referer: null,
    secFetchDest: "document",
    secFetchMode: "navigate",
    secFetchSite: "none",
    accept: "text/html",
    now: 1_005_000,
  });
  assert.equal(afterTrap.action, "block");
  if (afterTrap.action === "block") {
    assert.equal(afterTrap.reason, "ip_penalized");
  }
});

test("intercepts AI bots (ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot) with a concise executive summary and blocks them from images and /login", () => {
  resetShieldStateForTests();

  const claudeUa =
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)";
  const gptUa =
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.4; +https://openai.com/gptbot)";

  // 1. AI Bot visiting /commercial receives 200 OK executive summary (no image gallery scraping)
  const aiPage = evaluateSiteShield({
    method: "GET",
    pathname: "/commercial",
    clientIp: "216.73.216.198",
    userAgent: claudeUa,
    host: "tayco.llc",
    referer: null,
    secFetchDest: "document",
    secFetchMode: "navigate",
    secFetchSite: "none",
    accept: "text/html,application/xhtml+xml",
  });
  assert.equal(aiPage.action, "ai_summary");
  if (aiPage.action === "ai_summary") {
    assert.equal(aiPage.status, 200);
    assert.ok(aiPage.body.includes("TAYCO LLC — Official Executive Summary"));
    assert.ok(aiPage.body.includes("Commercial Construction Division"));
    assert.equal(aiPage.body.includes("<img"), false);
  }

  // 2. AI Bot attempting to crawl /login or /img_v16_web/* is blocked with 403
  for (const restrictedPath of ["/login", "/portal", "/img_v16_web/commercial/com_01_steel.png"]) {
    const blockedAi = evaluateSiteShield({
      method: "GET",
      pathname: restrictedPath,
      clientIp: "74.7.241.28",
      userAgent: gptUa,
      host: "taycoturnkey.com",
      referer: null,
      secFetchDest: "document",
      secFetchMode: "navigate",
      secFetchSite: "none",
      accept: "*/*",
    });
    assert.equal(blockedAi.action, "block");
    if (blockedAi.action === "block") {
      assert.equal(blockedAi.status, 403);
      assert.equal(blockedAi.reason, "ai_bot_restricted_asset");
    }
  }

  // 3. Executive summary text includes core services, privacy notice, and contact channels
  const summaryText = buildAiExecutiveSummaryText("/privacy");
  assert.ok(summaryText.includes("TAYCO LLC"));
  assert.ok(summaryText.includes("Wisconsin & Illinois"));
  assert.ok(summaryText.includes("architectural recreations based on real TAYCO projects"));
});
