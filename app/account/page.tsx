import type { Metadata } from 'next';
import { AccountSettings } from '@/components/AccountAccess';
export const metadata: Metadata = { title: 'Your account | TAYCO Turnkey', robots: { index: false, follow: false } };
export default function AccountPage() { return <AccountSettings />; }
