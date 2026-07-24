'use client';

import { useEffect } from 'react';

// Supabase password-reset / magic-link emails sometimes land the user on "/"
// with the auth tokens in the URL hash instead of /auth/callback. Forward them.
export default function HashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('type=magiclink'))) {
      window.location.replace('/auth/callback' + hash);
    }
  }, []);

  return null;
}
