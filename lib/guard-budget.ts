import { createHash } from 'node:crypto';
import { trustedClientIp } from './client-network';
import { GuardError, readGuardCookie } from './automation-guard';
// Capacity protection per process, not a substitute for deployment-wide edge quotas.
const buckets = new Map<string,{count:number;until:number}>();
export function admitGuardRequest(request: Request, now=Date.now()) {
  for (const [key,b] of buckets) if (b.until<=now) buckets.delete(key);
  const ip=trustedClientIp(request.headers), visitor=readGuardCookie(request,'visitor');
  const identity=ip!=='unknown' ? ip : visitor;
  const key=identity ? createHash('sha256').update(identity).digest('hex') : 'capacity';
  const b=buckets.get(key) || {count:0,until:now+60_000};
  if (!buckets.has(key) && buckets.size>=2048) throw new GuardError('Verification is busy. Please try again shortly.',503);
  if (++b.count>(identity?60:300)) throw new GuardError('Please wait a minute before trying again.',identity?429:503);
  buckets.set(key,b);
}
