import { supabase } from './supabase/client';

export async function logout() {
  await supabase.auth.signOut();
  window.location.replace('/auth/login');
}
