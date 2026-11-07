import type { Metadata } from 'next';
import { connection } from 'next/server';
import { LoginAccess } from '@/components/AccountAccess';

function connectSignInUrl(value: string | undefined): string | undefined {
  if (!value || !value.startsWith('https://') || /[?#\\\s]/u.test(value)) return;

  try {
    const url = new URL(value);
    if (url.username || url.password || url.port || !url.hostname.includes('.') ||
        !/[a-z]$/iu.test(url.hostname) || url.hostname.endsWith('.localhost')) return;
    return url.href;
  } catch {
    return;
  }
}
export const metadata: Metadata = { title: 'Sign in | TAYCO Turnkey', robots: { index: false, follow: false } };
export default async function LoginPage() {
  await connection();
  const connectUrl = connectSignInUrl(process.env.TAYCO_CONNECT_SIGN_IN_URL);
  return <LoginAccess connectUrl={connectUrl} />;
}
