import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {signIn,signOut,SESSION_COOKIE} from '../lib/auth';
import {planM02TextCorrection,applyM02TextCorrection} from '../lib/m02-intake';
export async function correctM02Text(args=process.argv.slice(2)){
 const keys=new Map<string,string>();let apply=false;
 for(const arg of args){const match=/^--(receipt|package|plan-sha256)=(.+)$/.exec(arg);if(match){if(keys.has(match[1]))throw Error('Duplicate option.');keys.set(match[1],match[2]);}else if(arg==='--apply'&&!apply)apply=true;else throw Error('Unsupported option.');}
 const receipt=keys.get('receipt'),file=keys.get('package');
 if(!receipt||!file||!path.isAbsolute(file)||apply&&!keys.get('plan-sha256'))throw Error('Select an exact receipt, package and reviewed plan.');
 const session=await signIn(process.env.TAYCO_M02_ADMIN_EMAIL,process.env.TAYCO_M02_ADMIN_PASSWORD);
 const request=new Request('http://tayco.local/api/measurements',{headers:{cookie:SESSION_COOKIE+'='+encodeURIComponent(session.cookie)}});
 try{const result=apply?await applyM02TextCorrection(request,receipt,file,keys.get('plan-sha256')!):await planM02TextCorrection(request,receipt,file);console.log(JSON.stringify(result));return result;}
 finally{await signOut(request);}
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url))correctM02Text().catch(()=>{console.error('Text correction was not confirmed. Original receipt retained; inspect status before retrying.');process.exitCode=1;});
