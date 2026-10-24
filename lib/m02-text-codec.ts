import {createHash} from 'node:crypto';

export type M02TextCorrection={path:string;beforeSha256:string;text:string};
const sha=(value:string)=>createHash('sha256').update(value).digest('hex');
export function decodeM02UTF8(value:Uint8Array){return new TextDecoder('utf-8',{fatal:true}).decode(value);}
const cp1252=new Map<string,number>();
for(let i=0;i<256;i++)if(![0x81,0x8d,0x8f,0x90,0x9d].includes(i))cp1252.set(new TextDecoder('windows-1252').decode(Uint8Array.of(i)),i);
/** Models the witnessed old pipe conversion only, never a general text repair heuristic. */
function legacyPipe(text:string){
 const bytes:number[]=[];for(const c of text){const byte=cp1252.get(c);if(byte===undefined)return null;bytes.push(byte);}
 return Buffer.from(bytes).toString('utf8');
}
function allowed(path:string){return /^\/boqLines\/(?:0|[1-9]\d{0,3})\/description$/.test(path)||/^\/measurements\/(?:0|[1-9]\d{0,3})\/assumptions\/(?:0|[1-9]\d{0,3})$/.test(path);}
export function m02TextCorrections(before:unknown,after:unknown){
 const changes:M02TextCorrection[]=[];
 function visit(a:unknown,b:unknown,p:string,depth:number){
  if(depth>32)throw Error('Text comparison bounds exceeded.');
  if(p==='/archiveState'){
   if(!['created_verified','existing_verified'].includes(String(a))||b!=='existing_verified')throw Error('Unverified archive state.');
   return;
  }
  if(a===b)return;
  if(typeof a==='string'&&typeof b==='string'&&allowed(p)&&a.length<=16384&&b.length<=16384&&legacyPipe(b)===a){changes.push({path:p,beforeSha256:sha(a),text:b});return;}
  if(Array.isArray(a)&&Array.isArray(b)&&a.length===b.length){for(let i=0;i<a.length;i++)visit(a[i],b[i],p+'/'+i,depth+1);return;}
  if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
   const x=a as Record<string,unknown>,y=b as Record<string,unknown>,keys=Object.keys(x).sort();
   if(JSON.stringify(keys)!==JSON.stringify(Object.keys(y).sort()))throw Error('Receipt structure differs.');
   for(const key of keys)visit(x[key],y[key],p+'/'+key,depth+1);return;
  }
  throw Error('A correction would change nonrecoverable receipt data.');
 }
 visit(before,after,'',0);changes.sort((a,b)=>a.path.localeCompare(b.path));
 if(changes.length>10000||Buffer.byteLength(JSON.stringify(changes))>1024*1024)throw Error('Text correction bounds exceeded.');
 return changes;
}
export function applyM02TextCorrections<T>(value:T,changes:M02TextCorrection[]):T{
 if(!Array.isArray(changes)||changes.length>10000||Buffer.byteLength(JSON.stringify(changes))>1024*1024)throw Error('Invalid text correction.');
 const result=structuredClone(value) as Record<string,unknown>,seen=new Set<string>();
 for(const item of changes){
  if(!item||Object.keys(item).sort().join(',')!=='beforeSha256,path,text'||typeof item.path!=='string'||!allowed(item.path)||seen.has(item.path)||!/^[a-f0-9]{64}$/.test(item.beforeSha256)||typeof item.text!=='string'||item.text.length>16384)throw Error('Invalid text correction.');
  seen.add(item.path);const parts=item.path.slice(1).split('/');let target:unknown=result;
  for(const key of parts.slice(0,-1)){if(!target||typeof target!=='object'||!Object.hasOwn(target,key))throw Error('Correction target unavailable.');target=(target as Record<string,unknown>)[key];}
  const key=parts.at(-1)!;if(!target||typeof target!=='object'||!Object.hasOwn(target,key))throw Error('Correction target unavailable.');
  const current=(target as Record<string,unknown>)[key];
  if(typeof current!=='string'||sha(current)!==item.beforeSha256||legacyPipe(item.text)!==current||current===item.text)throw Error('Correction no longer matches original text.');
  (target as Record<string,unknown>)[key]=item.text;
 }
 return result as T;
}
