import {DatabaseSync} from 'node:sqlite';
import {SESSION_COOKIE} from '../lib/auth';
import {commitSourceExtension,type SourceExtensionInput} from '../lib/takeoff-source-extension';
process.once('message',async (v:{mode:string;cookie?:string;input?:SourceExtensionInput;planHash?:string})=>{
 try{
  if(v.mode==='lock-revoke'){
   const db=new DatabaseSync(process.env.TAYCO_ERP_DB_PATH!);db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE');
   process.send?.({kind:'locked'});
   await new Promise(r=>setTimeout(r,900));
   const a=new DatabaseSync(process.env.TAYCO_AUTH_DB_PATH!);a.exec('DELETE FROM auth_sessions');a.close();
   db.exec('COMMIT');db.close();
  }else{
   const request=new Request('https://tayco.test/operator',{headers:{cookie:SESSION_COOKIE+'='+encodeURIComponent(v.cookie!)}});
   const result=await commitSourceExtension(request,v.input,v.planHash!);process.send?.({kind:'result',result});
  }
  process.disconnect?.();
 }catch(e){process.send?.({kind:'error',message:e instanceof Error?e.message:'error'});process.disconnect?.();process.exitCode=1;}
});
