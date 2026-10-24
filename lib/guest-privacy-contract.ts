export const GUEST_PRIVACY_VERSION = '2026-10-24-v1';
export type GuestPrivacy = {
  version: string; optionalAnalytics: boolean | null; reviewId: string;
  expiresAt: number; asOf: number;
};
