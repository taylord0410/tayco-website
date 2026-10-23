// Private synthetic fixture only. Never run against an operational database.
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
import {provisionAdmin,createSession,createInvitation,acceptInvitation,type Actor} from '../lib/auth';
import {execute,submitWebsite} from '../lib/erp';
async function main(){
 const file=process.env.TAYCO_CERT_CONFIG;
 if(!file||!path.resolve(file).includes(path.sep+'certification-'))throw new Error('An isolated certification config is required.');
 const config=JSON.parse(readFileSync(file,'utf8'));
 process.env.TAYCO_AUTH_DB_PATH=config.authDb;process.env.TAYCO_ERP_DB_PATH=config.erpDb;process.env.TAYCO_SESSION_SECRET=config.sessionSecret;
 if(!config.authDb.startsWith(path.dirname(file))||!config.erpDb.startsWith(path.dirname(file)))throw new Error('Fixture paths must remain within the private test directory.');
 const id=await provisionAdmin('admin@example.test',config.password);
 const actor={id,email:'admin@example.test',role:'admin',tenantId:'tayco_llc',projectIds:[]} as Actor;
 const a=execute(actor,randomUUID(),{action:'create_project',name:'Synthetic north project',location:'Fixture only',clientName:'Synthetic client A',budgetUsd:0});
 const b=execute(actor,randomUUID(),{action:'create_project',name:'Synthetic south project',location:'Fixture only',clientName:'Synthetic client B',budgetUsd:100});
 const vendor=submitWebsite('vendor',{businessName:'Synthetic supplier',contactName:'Test provider',email:'vendor@example.test',phone:'555-test',trades:'Synthetic'},randomUUID());
 const accounts:Record<string,unknown>={admin:{id,email:actor.email,cookie:await createSession(id),projects:[a.id,b.id]}};
 for(const [name,role,projects] of [['client','client',[a.id]],['other','client',[b.id]],['vendor','vendor',[a.id]],['staff','staff',[]]] as const){
  const email=name+'@example.test',invite=createInvitation(actor,{email,role,tenantId:actor.tenantId,projectIds:[...projects],...(role==='vendor'?{vendorId:vendor.id}:{})});
  const result=await acceptInvitation(invite.token,email,config.password);accounts[name]={email,cookie:result.cookie,projects};
 }
 writeFileSync(file,JSON.stringify({...config,accounts,projects:[a.id,b.id],vendorId:vendor.id},null,2),{mode:0o600});
 console.log('Five synthetic accounts and two projects provisioned in isolated private certification databases. Credentials not printed.');
}
main().catch(()=>{console.error('Synthetic fixture provisioning failed. Inspect the private configuration locally.');process.exitCode=1;});
