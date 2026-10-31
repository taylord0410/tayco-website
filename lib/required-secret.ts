export const SUBMISSION_SECRET_NAMES = ['TAYCO_DATA_ENCRYPTION_KEY', 'TAYCO_SESSION_SECRET', 'SESSION_SECRET'] as const;
export const SECURITY_LOG_SECRET_NAMES = ['TAYCO_SUBMISSIONS_KEY', 'TAYCO_SESSION_SECRET'] as const;

export class SecurityConfigurationError extends Error {
  readonly status = 503;
  readonly code = 'SECURITY_CONFIGURATION';
  constructor() { super('Secure storage is not configured.'); this.name = 'SecurityConfigurationError'; }
}
/** Preserve existing key bytes and precedence. Invalid explicit overrides never fall back. */
export function requiredSecret(names: readonly string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value === undefined) continue;
    if (value.trim().length < 32) throw new SecurityConfigurationError();
    return value;
  }
  throw new SecurityConfigurationError();
}
