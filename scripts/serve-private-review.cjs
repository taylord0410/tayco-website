/* eslint @typescript-eslint/no-require-imports: "off" -- Local Next CLI bootstrap. */
/* Local authenticated review only. Private real data must never use test fixtures. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),file=process.env.TAYCO_REVIEW_CONFIG;
if(!file)throw Error('Provide the private local review configuration.');
const absolute=path.resolve(file),relative=path.relative(path.join(root,'.data'),absolute);
if(relative.startsWith('..')||path.isAbsolute(relative)||!relative.split(path.sep)[0].startsWith('review-'))throw Error('Review configuration must be in a private .data/review-* directory.');
const config=JSON.parse(fs.readFileSync(absolute,'utf8')),origin=new URL(config.baseUrl);
if(origin.protocol!=='http:'||!['localhost','127.0.0.1'].includes(origin.hostname)||!origin.port||origin.username||origin.password)throw Error('Review server requires an explicit local HTTP port.');
for(const file of [config.authDb,config.erpDb]){const rel=path.relative(path.dirname(absolute),path.resolve(file));if(!rel||rel.startsWith('..')||path.isAbsolute(rel))throw Error('Review databases must stay in their private review directory.');}
Object.assign(process.env,{TAYCO_SESSION_SECRET:config.sessionSecret,TAYCO_AUTH_DB_PATH:config.authDb,TAYCO_ERP_DB_PATH:config.erpDb,TAYCO_APP_URL:origin.origin,RESEND_API_KEY:'',BLOB_READ_WRITE_TOKEN:'',TAYCO_NOTIFY_EMAIL:'',TAYCO_EMAIL_FROM:'',NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1'});
process.argv=[process.argv[0],require.resolve('next/dist/bin/next'),'start','-p',origin.port,'-H','127.0.0.1'];
require('next/dist/bin/next');
