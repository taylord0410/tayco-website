/** Read-only restored-console checks against disposable local module fixtures. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {createRequire} from "node:module";
const {chromium}=createRequire(import.meta.url)(process.env.TAYCO_PLAYWRIGHT_MODULE||"playwright");
if(!process.env.TAYCO_TEST_CONFIG)throw Error("A private certification config is required.");
const config=JSON.parse(fs.readFileSync(process.env.TAYCO_TEST_CONFIG,"utf8")),base=config.baseUrl;
assert.match(base,/^http:\/\/(localhost|127\.0\.0\.1):3010$/);
const evidence=process.env.TAYCO_EVIDENCE_DIR;
if(evidence)fs.mkdirSync(evidence,{recursive:true});
const browser=await chromium.launch({headless:true}),contexts=[],writes=[],results=[];
try {
 for(const role of ["admin","staff","client","other","vendor"]){
  const context=await browser.newContext({reducedMotion:"reduce",viewport:{width:1440,height:900}});contexts.push(context);
  await context.route("**/api/**",route=>{if(!["GET","HEAD","OPTIONS"].includes(route.request().method())){writes.push(route.request().method()+" "+new URL(route.request().url()).pathname);return route.abort();}return route.continue();});
  await context.addCookies([{name:"tayco_session",value:encodeURIComponent(config.accounts[role].cookie),url:base,httpOnly:true,secure:true,sameSite:"Lax"}]);
  const page=await context.newPage();await page.goto(base+"/portal",{waitUntil:"domcontentloaded"});
  await page.getByTestId("executive-console").waitFor();
  const nav=page.getByRole("navigation",{name:"Command Center Navigation",exact:true});
  for(const name of ["Projects","Documents","Updates","Financial overview","Invoices"])assert.equal(await nav.getByRole("button").filter({has:page.locator("span").filter({hasText:new RegExp("^"+name+"$")})}).count(),1);
  assert.equal(await nav.getByRole("button").filter({has:page.locator("span").filter({hasText:/^Tax & TERO$/})}).count(),["admin","staff"].includes(role)?1:0);
  assert.equal(await nav.getByRole("button").filter({has:page.locator("span").filter({hasText:/^Bid leveling$/})}).count(),role==="client"||role==="other"?0:1);
  assert.equal(await page.getByTestId("module-access").count(),role==="admin"?1:0);
  if(role==="admin"){
   for(const [width,height]of [[360,740],[390,844],[768,1024],[1024,768],[1200,800],[1440,900],[844,390],[720,450]]){
    await page.setViewportSize({width,height});
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert.ok(overflow<=1,"Console overflow at "+width);
    if(width<1024){
     const toggle=page.getByRole("button",{name:"Open modules",exact:true});await toggle.click();assert.equal(await nav.isVisible(),true);
     await nav.getByRole("button").filter({has:page.locator("span").filter({hasText:/^Projects$/})}).click();
     await page.waitForFunction(()=>document.activeElement?.getAttribute("role")==="region"&&document.activeElement?.getAttribute("aria-label")==="Projects");
     assert.equal(await nav.isVisible(),false);
     await page.getByRole("button",{name:"Open modules",exact:true}).click();await page.keyboard.press("Escape");assert.equal(await nav.isVisible(),false);
     assert.equal(await page.getByRole("button",{name:"Open modules",exact:true}).evaluate(el=>el===document.activeElement),true);
     await page.getByRole("button",{name:"Open modules",exact:true}).click();
    }
    await nav.getByRole("button",{name:"Executive overview",exact:true}).click();await page.getByTestId("executive-console").waitFor();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)<=1);
    if(evidence&&[390,844,1440].includes(width))await page.screenshot({path:path.join(evidence,"console-"+width+"x"+height+".png"),fullPage:true});
    results.push({width,height,overflow:0,navigationFocus:true});
   }
  }
 }
 assert.deepEqual(writes,[]);
 console.log(JSON.stringify({passed:true,roles:5,viewportCases:results,apiWritesAttempted:writes.length},null,2));
} finally {for(const context of contexts)await context.close();await browser.close();}
