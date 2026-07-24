import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// For use in Server Components / Route Handlers. Cookie writes are best-effort:
// Server Components can't set cookies, so session refresh there relies on
// middleware having already refreshed the token on the request.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — ignore, middleware refreshes sessions.
          }
        },
      },
    },
  );
}
