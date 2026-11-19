import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export async function authorizeAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user?.email) return null;

  const { data: isAdmin, error: adminError } = await supabase.rpc('is_site_admin');
  if (adminError || !isAdmin) return null;
  return user;
}
