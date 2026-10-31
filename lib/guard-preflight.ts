import path from 'node:path';
import {guardMode} from './automation-guard';
import {challengeSiteKey} from './guard-verification';
export function assertGuardDeployment(production=process.env.NODE_ENV==='production'){
 if(!production)return;
 const configured=process.env.TAYCO_AUTOMATION_GUARD;
 if(configured!==undefined&&!['off','observe','enforce'].includes(configured))throw new Error('Invalid risk mode.');
 if(guardMode()==='off')return;
 if(process.env.TAYCO_GUARD_TOPOLOGY!=='single-instance'||!process.env.TAYCO_GUARD_DB_PATH||!path.isAbsolute(process.env.TAYCO_GUARD_DB_PATH))throw new Error('Risk state deployment contract is missing.');
 if(guardMode()==='enforce'&&(!challengeSiteKey()||/^[123]x000000/.test(process.env.TAYCO_TURNSTILE_SITE_KEY||'')||!process.env.TAYCO_TURNSTILE_SECRET_KEY||process.env.TAYCO_TURNSTILE_SECRET_KEY.trim().length<32||/^[123]x000000/.test(process.env.TAYCO_TURNSTILE_SECRET_KEY)))throw new Error('Human verification is not configured.');
}
