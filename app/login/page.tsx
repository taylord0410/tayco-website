import type { Metadata } from 'next';
import { LoginAccess } from '@/components/AccountAccess';
export const metadata: Metadata = { title: 'Sign in | TAYCO Turnkey', robots: { index: false, follow: false } };
export default function LoginPage() { return <LoginAccess />; }
