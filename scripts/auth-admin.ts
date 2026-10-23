import { provisionAdmin, resetPasswordPrivately, revokeUserSessionsPrivately } from '../lib/auth';

// Secrets belong in the operator's private environment, never command-line arguments.
async function main() {
  const command = process.argv[2];
  if (command === 'bootstrap-admin') {
    if (!process.env.TAYCO_BOOTSTRAP_EMAIL || !process.env.TAYCO_BOOTSTRAP_PASSWORD) throw new Error('Set TAYCO_BOOTSTRAP_EMAIL and TAYCO_BOOTSTRAP_PASSWORD in your private environment.');
    await provisionAdmin(process.env.TAYCO_BOOTSTRAP_EMAIL, process.env.TAYCO_BOOTSTRAP_PASSWORD, process.env.TAYCO_BOOTSTRAP_TENANT || 'tayco_llc');
    console.log('Administrator created. No credentials were written to this output.');
  } else if (command === 'reset-password') {
    if (!process.env.TAYCO_RESET_EMAIL || !process.env.TAYCO_RESET_PASSWORD) throw new Error('Set TAYCO_RESET_EMAIL and TAYCO_RESET_PASSWORD in your private environment.');
    await resetPasswordPrivately(process.env.TAYCO_RESET_EMAIL, process.env.TAYCO_RESET_PASSWORD);
    console.log('Password replaced and all sessions revoked. Deliver the temporary password through a verified private channel.');
  } else if (command === 'revoke-sessions' || command === 'disable-account' || command === 'enable-account') {
    if (!process.env.TAYCO_RESET_EMAIL) throw new Error('Set TAYCO_RESET_EMAIL in your private environment.');
    revokeUserSessionsPrivately(process.env.TAYCO_RESET_EMAIL, command === 'disable-account' ? true : command === 'enable-account' ? false : undefined);
    console.log('Account sessions revoked.');
  } else { throw new Error('Usage: node --import tsx scripts/auth-admin.ts bootstrap-admin|reset-password|revoke-sessions|disable-account|enable-account'); }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Account administration failed.'); process.exitCode = 1; });
