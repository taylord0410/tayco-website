import { resolveReferenceImages } from '@/lib/reference-images';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ErpError, submitWebsite } from '@/lib/erp';
export async function readJson(request:Request):Promise<Record<string,unknown>> {
 if(!request.headers.get('content-type')?.startsWith('application/json'))throw new ErpError(415,'Send this request as JSON.');
 if(Number(request.headers.get('content-length')||0)>20_000)throw new ErpError(413,'Request is too large.');
 const reader=request.body?.getReader();let length=0;const chunks:Uint8Array[]=[];
 if(!reader)throw new ErpError(400,'Request body is required.');
 while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>20_000){await reader.cancel();throw new ErpError(413,'Request is too large.');}chunks.push(value);}
 let value:unknown;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new ErpError(400,'Check the request format.');}
 if(!value||Array.isArray(value)||typeof value!=='object')throw new ErpError(400,'Check the request format.');
 return value as Record<string,unknown>;
}
function originAllowed(request:Request) {
 const origin=request.headers.get('origin');if(!origin)return false;
 const allowed=[process.env.TAYCO_APP_URL,'https://tayco.llc','https://www.tayco.llc','https://tayroofing.org','https://www.tayroofing.org','https://taycoturnkey.com','https://www.taycoturnkey.com',...(process.env.TAYCO_EXTRA_ORIGINS||'').split(','),...(process.env.ALLOWED_ORIGINS||'').split(',')].map(s=>s?.trim()).filter(Boolean);
 if(allowed.includes(origin))return true;
 if(process.env.NODE_ENV!=='production'){try{const url=new URL(origin);return ['localhost','127.0.0.1'].includes(url.hostname)&&url.origin===new URL(request.url).origin;}catch{return false;}}
 return false;
}
function validate(input:Record<string,unknown>,kind:string) {
 if(input.website)throw new ErpError(422,'Unable to submit this request. Please contact TAYCO directly.');
 if(input.w9Path||input.insurancePath)throw new ErpError(422,'Please submit without attachments. Documents can be uploaded securely after account access is provided.');
 const out:Record<string,unknown>={};
  const common=['fullName','phone','email','company','notes'];
  const fields=kind==='vendor'?['businessName','contactName','phone','email','stateServed','citiesServed','trades','crewSize','yearsInBusiness','insured','notes','docsPending','licenseNumber']:kind==='estimate'?[...common,'projectType','projectLocation','projectDetails','sqft','budgetIllustrationUsd','referenceImageIds']:[...common,'states','portfolioSize','propertyType','workNeeded','timeline','budget','investmentRange','preferredContact','properties','activeProjects'];
 for(const [key,value] of Object.entries(input)){
  if(key.startsWith('_')||key==='website')continue;
    if(!fields.includes(key))throw new ErpError(422,'This form changed. Please reload and review the fields.');
  if(typeof value==='string')out[key]=value.trim().slice(0,5000);
  else if(typeof value==='number'&&Number.isFinite(value))out[key]=value;
  else if(typeof value==='boolean')out[key]=value;
  else if(Array.isArray(value)&&value.length<=50&&value.every(v=>typeof v==='string'))out[key]=value.map(v=>v.trim().slice(0,200));
  else throw new ErpError(422,'Check the submitted fields.');
 }
 if (kind === 'estimate') {
    try {
      const references = resolveReferenceImages(out.referenceImageIds);
      out.referenceImageIds = references.map(image => image.id);
      out.referenceImages = references;
    } catch (error) { throw new ErpError(422, error instanceof Error ? error.message : 'Review your reference images.'); }
  }
  for(const key of (kind==='vendor'?['businessName','contactName','phone','email']:['fullName','phone','email']))if(typeof out[key]!=='string'||!(out[key] as string).trim())throw new ErpError(422,'Please complete '+key.replace(/([A-Z])/g,' $1').toLowerCase()+'.');
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(out.email))||String(out.email).length>254)throw new ErpError(422,'Check your email address.');
 return out;
}
export async function receive(request:NextRequest,kind:'estimate'|'investor'|'vendor') {
 try {
  if(!originAllowed(request))throw new ErpError(403,'This request must be sent from the TAYCO website.');
  const payload=validate(await readJson(request),kind);
  const entry=submitWebsite(kind,payload,request.headers.get('Idempotency-Key')||randomUUID(),Date.now());
  return NextResponse.json({success:true,referenceId:entry.id,notificationStatus:'pending'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(error){if(error instanceof ErpError)return NextResponse.json({success:false,error:error.message},{status:error.status});console.error('TAYCO submission failed',{type:error instanceof Error?error.name:'unknown'});return NextResponse.json({success:false,error:'Your request could not be saved. Please retry or contact TAYCO directly.'},{status:503});}
}
