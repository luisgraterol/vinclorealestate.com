import type { Metadata } from 'next';
import CallbackHandler from '@/components/auth/CallbackHandler';

export const metadata: Metadata = {
  title: 'Owner Portal — Vinclo Real Estate',
  robots: { index: false, follow: false },
};

export default function CallbackPage() {
  return <CallbackHandler />;
}
