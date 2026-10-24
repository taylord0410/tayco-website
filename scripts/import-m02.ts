import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {signIn,signOut,SESSION_COOKIE} from '../lib/auth';
import {receiveM02,planM02} from '../lib/m02-intake';
export async function importM02(args=process.argv.slice(2)){
 const packageFile=args.find(a=>a.startsWith('--package='))?.slice(10);
 if(!packageFile||!path.isAbsolute(packageFile)||args.some(a=>!a.startsWith('--package=')&&!a.startsWith('--supersedes=')&&!a.startsWith('--plan-sha256=')&&a!=='--apply'))throw new Error('Provide one private absolute --package= path and optional --supersedes= receipt.');
 const session=await signIn(process.env.TAYCO_M02_ADMIN_EMAIL,process.env.TAYCO_M02_ADMIN_PASSWORD);
 const request=new Request('http://tayco.local/api/measurements',{headers:{cookie:SESSION_COOKIE+'='+encodeURIComponent(session.cookie)}});
 try{
  const parent=args.find(a=>a.startsWith('--supersedes='))?.slice(13);
  console.log(JSON.stringify(args.includes('--apply')?await receiveM02(request,packageFile,args.find(a=>a.startsWith('--plan-sha256='))?.slice(14)??'',parent):await planM02(request,packageFile,parent)));
 }
 finally{await signOut(request);}
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url))importM02().catch(()=>{console.error('Measurement reception failed. No new receipt is confirmed; verify status before retrying.');process.exitCode=1;});
