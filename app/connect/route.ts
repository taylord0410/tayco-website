export const dynamic='force-dynamic';
function origin(value:string|undefined){
 if(!value)return undefined;
 try{const url=new URL(value);return url.protocol==='https:'&&url.origin===value&&!url.username&&!url.password?value:undefined;}catch{return undefined;}
}
export async function GET(){
 const fallback=origin(process.env.TAYCO_CONNECT_ORIGIN),preferred=origin(process.env.TAYCO_CONNECT_PUBLIC_ORIGIN);
 let target=fallback;
 if(preferred){
  try{
   const check=await fetch(preferred+'/healthz',{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(1500)});
   if(check.ok){await check.body?.cancel();target=preferred;}
  }catch{/* Keep the existing service usable while DNS/TLS is pending. */}
 }
 if(!target)return new Response('Connect is temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}});
 return new Response(null,{status:307,headers:{Location:target+'/', 'Cache-Control':'no-store', 'Referrer-Policy':'no-referrer'}});
}
