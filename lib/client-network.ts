import { isIP } from 'node:net';

export type RequestHeaders = Headers | Record<string, string | undefined> | null | undefined;
export const UNKNOWN_CLIENT_IP = 'unknown';

function header(headers: RequestHeaders, name: string): string {
  if (!headers) return '';
  if (typeof (headers as Headers).get === 'function') return (headers as Headers).get(name) || '';
  return Object.entries(headers).find(([key]) => key.toLowerCase() === name)?.[1] || '';
}
export function normalizedClientIp(value: string): string | undefined {
  if (!value || value.length > 64) return;
  const candidate = value.trim();
  if (!isIP(candidate)) return;
  const mapped = candidate.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return mapped && isIP(mapped[1]) === 4 ? mapped[1] : candidate.toLowerCase();
}
/**
 * Only an operator-confirmed Railway HTTP public-edge boundary may supply X-Real-IP.
 * This flag is an ingress contract, not proof carried by an HTTP header. Private/TCP
 * paths must be isolated before enabling it. Never infer trust from Host, XFF length,
 * X-Railway-Edge or RAILWAY_ENVIRONMENT, and never fall back to a loopback address.
 */
export function trustedClientIp(headers: RequestHeaders): string {
  if (process.env.TAYCO_TRUSTED_INGRESS !== 'railway-public-edge') return UNKNOWN_CLIENT_IP;
  return normalizedClientIp(header(headers, 'x-real-ip')) || UNKNOWN_CLIENT_IP;
}
export function developmentLoopback(ip: string, hostHeader: string): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  const normalized = normalizedClientIp(ip);
  if (!normalized || !(normalized === '::1' || /^127\./.test(normalized))) return false;
  try {
    const hostname = new URL('http://' + hostHeader).hostname;
    return ['localhost', '127.0.0.1', '[::1]'].includes(hostname);
  } catch { return false; }
}
