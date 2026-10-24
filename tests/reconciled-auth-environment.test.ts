import test from "node:test";
import assert from "node:assert/strict";
import { assertSameOrigin,AuthError,sessionCookie } from "../lib/auth";

const keys=["TAYCO_APP_URL","TAYCO_EXTRA_ORIGINS","TAYCO_COOKIE_INSECURE","NODE_ENV"] as const;
function settings(run:()=>void) {
  const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  try {
    Object.assign(process.env,{NODE_ENV:"production",TAYCO_APP_URL:"https://primary.synthetic.test"});
    delete process.env.TAYCO_EXTRA_ORIGINS;delete process.env.TAYCO_COOKIE_INSECURE;
    run();
  } finally {
    for(const [key,value] of Object.entries(previous)) {
      if(value===undefined)delete process.env[key];else process.env[key]=value;
    }
  }
}
const request=(origin?:string,site="same-origin")=>new Request("https://primary.synthetic.test/api/synthetic",{
  method:"POST",headers:{"sec-fetch-site":site,...(origin===undefined?{}:{origin})},
});
const forbidden=(run:()=>void,status=403)=>assert.throws(run,error=>error instanceof AuthError&&error.status===status);

test("committed peer origin support keeps the canonical origin required by default",()=>settings(()=>{
  assert.doesNotThrow(()=>assertSameOrigin(request("https://primary.synthetic.test")));
  forbidden(()=>assertSameOrigin(request("https://extra.synthetic.test")));
  forbidden(()=>assertSameOrigin(request()));
}));
test("committed peer explicit extra origins accept only their exact configured origins and ports",()=>settings(()=>{
  process.env.TAYCO_EXTRA_ORIGINS=" , https://extra.synthetic.test:444 ,https://alternate.synthetic.test, ";
  for(const origin of ["https://extra.synthetic.test:444","https://alternate.synthetic.test"])
    assert.doesNotThrow(()=>assertSameOrigin(request(origin)));
  for(const origin of ["https://extra.synthetic.test","https://extra.synthetic.test:445",
    "http://extra.synthetic.test:444","https://extra.synthetic.test:444.evil.test","null","https://not-listed.synthetic.test"])
    forbidden(()=>assertSameOrigin(request(origin)));
}));
test("committed extra origin list is not a wildcard or suffix grant",()=>settings(()=>{
  process.env.TAYCO_EXTRA_ORIGINS="https://*.synthetic.test,https://extra.synthetic.test";
  forbidden(()=>assertSameOrigin(request("https://child.synthetic.test")));
  forbidden(()=>assertSameOrigin(request("https://extra.synthetic.test.evil.test")));
}));
test("cross-site metadata still rejects a canonical or explicit extra origin",()=>settings(()=>{
  process.env.TAYCO_EXTRA_ORIGINS="https://extra.synthetic.test";
  for(const origin of ["https://primary.synthetic.test","https://extra.synthetic.test"])
    forbidden(()=>assertSameOrigin(request(origin,"cross-site")));
}));
test("production missing canonical configuration fails before accepting an extra origin",()=>settings(()=>{
  process.env.TAYCO_APP_URL="";process.env.TAYCO_EXTRA_ORIGINS="https://extra.synthetic.test";
  forbidden(()=>assertSameOrigin(request("https://extra.synthetic.test")),503);
}));
test("committed cookie opt-out is exercised only synthetically; default Secure and supplied deadline remain bounded",()=>settings(()=>{
  const deadline=Date.now()+63000;
  const secured=sessionCookie("SYNTHETIC-NOT-A-SESSION",false,deadline);
  assert.match(secured,/; Secure$/);assert.match(secured,/HttpOnly; SameSite=Lax/);
  assert.ok(Number(secured.match(/Max-Age=(\d+)/)![1])<=63);
  assert.ok(secured.includes("Expires="+new Date(deadline).toUTCString()));
  process.env.TAYCO_COOKIE_INSECURE="0";assert.match(sessionCookie("SYNTHETIC",false,deadline),/; Secure$/);
  process.env.TAYCO_COOKIE_INSECURE="1";
  const insecure=sessionCookie("SYNTHETIC",false,deadline);
  assert.doesNotMatch(insecure,/; Secure/);assert.ok(Number(insecure.match(/Max-Age=(\d+)/)![1])<=63);
  assert.ok(insecure.includes("Expires="+new Date(deadline).toUTCString()));
  const cleared=sessionCookie("SYNTHETIC",true,deadline);assert.match(cleared,/Max-Age=0/);
}));
