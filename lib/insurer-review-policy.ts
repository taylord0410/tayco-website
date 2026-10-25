import {createHash} from 'node:crypto';
import {closeSync,existsSync,fstatSync,lstatSync,openSync,readSync} from 'node:fs';
import path from 'node:path';
import type {Actor} from './auth';
import {parseProfileAReviewSource,type ProfileAReview} from './profile-a-review';
export class InsurerReviewError extends Error{constructor(public status:number,message='This recipient review is unavailable.'){super(message);}}
export type InsurerDocument={projectId:string;erpDocumentId:string;viewerDocumentId:string;contextKey:string;sourceSha256:string;assetIds:string[]};
export type InsurerPolicy={schemaVersion:'tayco-insurer-review-policy/v1';tenantId:string;period:string;sourceSha256:string;bundleId:string;manifestSha256:string;relationsId:string;opportunityIds:string[];documents:InsurerDocument[]};
const sha=/^[a-f0-9]{64}$/,id=/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;
const fail=()=>new InsurerReviewError(503);
function obj(value:unknown,keys:string[]):Record<string,unknown>{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||Object.keys(value).some(k=>!keys.includes(k)))throw fail();
 return value as Record<string,unknown>;
}
function ids(value:unknown,max:number):string[]{
 if(!Array.isArray(value)||value.length>max||value.some(v=>typeof v!=='string'||!id.test(v))||new Set(value).size!==value.length)throw fail();return value;
}
/** Fixed operator paths only. A hash-bound file can revoke availability by disappearing; it cannot widen an issued review. */
export function readInsurerFile(filename:string|undefined):Buffer{
 if(!filename)throw fail();let fd:number|undefined;
 try{
  if(lstatSync(filename).isSymbolicLink())throw fail();fd=openSync(filename,'r');const stat=fstatSync(fd);
  if(!stat.isFile()||stat.size<1||stat.size>1048576)throw fail();
  const bytes=Buffer.alloc(stat.size+1);let offset=0;
  while(offset<bytes.length){const n=readSync(fd,bytes,offset,bytes.length-offset,offset);if(!n)break;offset+=n;}
  const after=fstatSync(fd);if(offset!==stat.size||after.size!==stat.size||after.mtimeMs!==stat.mtimeMs)throw fail();return bytes.subarray(0,offset);
 }catch{throw fail();}finally{if(fd!==undefined)closeSync(fd);}
}
export function parseInsurerPolicy(bytes:Buffer,expectedSha256:string,tenantId:string,period:string):InsurerPolicy{
 if(!sha.test(expectedSha256)||createHash('sha256').update(bytes).digest('hex')!==expectedSha256)throw fail();
 let decoded:unknown;try{decoded=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw fail();}
 const x=obj(decoded,['schemaVersion','tenantId','period','sourceSha256','bundleId','manifestSha256','relationsId','opportunityIds','documents']);
 if(x.schemaVersion!=='tayco-insurer-review-policy/v1'||x.tenantId!==tenantId||x.period!==period||!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)||
  typeof x.sourceSha256!=='string'||!sha.test(x.sourceSha256)||typeof x.bundleId!=='string'||!id.test(x.bundleId)||
  typeof x.manifestSha256!=='string'||!sha.test(x.manifestSha256)||typeof x.relationsId!=='string'||!/^relations-[a-f0-9]{64}$/.test(x.relationsId))throw fail();
 const opportunityIds=ids(x.opportunityIds,128);if(!opportunityIds.length)throw fail();
 if(!Array.isArray(x.documents)||x.documents.length>256)throw fail();
 const seen=new Set<string>(),erpSeen=new Set<string>();
 const documents=x.documents.map(value=>{
  const d=obj(value,['projectId','erpDocumentId','viewerDocumentId','contextKey','sourceSha256','assetIds']);
  for(const k of ['projectId','erpDocumentId','viewerDocumentId','contextKey'])if(typeof d[k]!=='string'||!id.test(d[k] as string))throw fail();
  if(typeof d.sourceSha256!=='string'||!sha.test(d.sourceSha256)||seen.has(String(d.viewerDocumentId))||erpSeen.has(String(d.erpDocumentId)))throw fail();
  const assets=ids(d.assetIds,4);if(!assets.length)throw fail();
  seen.add(String(d.viewerDocumentId));erpSeen.add(String(d.erpDocumentId));return d as InsurerDocument;
 });
 return {...x,opportunityIds,documents} as InsurerPolicy;
}
function safeRecipientText(data:ProfileAReview){
 // Closed labels still contain source text: reject obvious private transport addresses, money and excluded brand anywhere.
 const labels=data.rows.flatMap(r=>[r.id,r.name,r.location,r.contractor,...r.documents.map(d=>d.name)]).filter((x):x is string=>x!==null);
 if(labels.some(s=>/(?:https?:|file:|[A-Za-z]:[\\/]|\S+@\S+|[$€£]|\b(?:USD|EUR|GBP)\b)/i.test(s)||s.toLowerCase().replace(/[^a-z0-9]/g,'').includes('autozone')))throw fail();
}
export function readInsurerSource(policy:InsurerPolicy){
 const defaultSource=path.join(process.cwd(),'lib','viewer-bundle-meta','profile-a-source-42.json');
 const bytes=readInsurerFile(process.env.TAYCO_PROFILE_A_REVIEW_SOURCE||(existsSync(defaultSource)?defaultSource:undefined));
 let data:ProfileAReview;
 try{data=parseProfileAReviewSource(policy.tenantId,bytes,policy.sourceSha256);}catch{throw fail();}
 if(data.period!==policy.period)throw fail();safeRecipientText(data);
 const rows=new Map(data.rows.map(r=>[r.id,r]));if(policy.opportunityIds.some(id=>!rows.has(id)))throw fail();
 // Only source records explicitly selected in this policy are visible.
 const selected={...data,rows:policy.opportunityIds.map(id=>rows.get(id)!)};
 const source=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)) as {rows:{id:string;documents:{state:string;sha256:string|null}[]}[]};
 const selectedHashes=new Set(source.rows.filter(r=>policy.opportunityIds.includes(r.id)).flatMap(r=>r.documents.filter(d=>d.state==='received').map(d=>d.sha256)));
 if(policy.documents.some(d=>!selectedHashes.has(d.sourceSha256)))throw fail();
 return {bytes,selected};
}
export function insurerPolicy(actor:Actor,now=Date.now()){
 const recipient=actor.review?.recipient;
 if(actor.role!=='guest'||!actor.review||recipient?.kind!=='insurer-a'||actor.review.expiresAt<=now||actor.review.detailPeriod!==new Date(now).toISOString().slice(0,7))throw new InsurerReviewError(403);
 const defaultPolicy=path.join(process.cwd(),'lib','viewer-bundle-meta','insurer-policy-42.json');
 const policy=parseInsurerPolicy(readInsurerFile(process.env.TAYCO_INSURER_REVIEW_POLICY||(existsSync(defaultPolicy)?defaultPolicy:undefined)),recipient.policySha256,actor.tenantId,actor.review.detailPeriod);
 readInsurerSource(policy);return policy;
}
export function insurerRouteAllowed(actor:Actor,request:Request){
 if(!actor.review?.recipient)return true;
 const path=new URL(request.url).pathname,method=request.method;
 if(path==='/api/auth/session'&&method==='GET')return true;
 if(path==='/api/auth/change-password'&&method==='POST')return true;
 if(path==='/api/guest-privacy'&&['GET','POST'].includes(method))return true;
 if(path==='/api/guest-activity'&&method==='POST')return true;
 if(path==='/api/insurer-review'&&method==='GET')return true;
 if(path.startsWith('/api/takeoff-viewer/')&&['GET','HEAD'].includes(method))return true;
 if(/^\/api\/documents\/[A-Za-z0-9_-]+$/.test(path)&&['GET','HEAD'].includes(method))return true;
 return false;
}
