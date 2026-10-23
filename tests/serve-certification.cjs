/* eslint @typescript-eslint/no-require-imports: "off" -- Next CLI bootstrap is intentionally CommonJS. */
/* Synthetic local server only; private fixture configuration never goes to logs. */
const fs=require('node:fs'),path=require('node:path');
const file=process.env.TAYCO_CERT_CONFIG;
if(!file||!path.resolve(file).includes(path.sep+'certification-'))throw new Error('Isolated private fixture config is required.');
const c=JSON.parse(fs.readFileSync(file,'utf8'));
Object.assign(process.env,{TAYCO_SESSION_SECRET:c.sessionSecret,TAYCO_AUTH_DB_PATH:c.authDb,TAYCO_ERP_DB_PATH:c.erpDb,TAYCO_APP_URL:c.baseUrl,RESEND_API_KEY:'',BLOB_READ_WRITE_TOKEN:'',TAYCO_NOTIFY_EMAIL:'',TAYCO_EMAIL_FROM:'',NODE_ENV:'production',NEXT_TELEMETRY_DISABLED:'1'});
process.argv=[process.argv[0],require.resolve('next/dist/bin/next'),'start','-p',String(new URL(c.baseUrl).port),'-H','127.0.0.1'];
require('next/dist/bin/next');
