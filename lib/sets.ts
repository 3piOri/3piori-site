import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

export type MusicSet = {
  id: string;
  title: string;
  subtitle: string;
  published_at: string;
  duration_label: string;
  genre: string;
  cover_url: string;
  audio_url: string;
  cover_path?: string | null;
  audio_key?: string | null;
  featured?: boolean;
  published?: boolean;
};

export type SiteSettings = {
  bio: string;
  artist_image_url: string;
  artist_image_path: string;
  contact_email: string;
  instagram_url: string;
  soundcloud_url: string;
  mixcloud_url: string;
};

export const defaultSettings: SiteSettings = {
  bio: '3π Ori is an ongoing collection of electronic music journeys. A listening space inspired by the geometry of sound and the constellation of Orion.',
  artist_image_url: '',
  artist_image_path: '',
  contact_email: 'booking@3piori.com',
  instagram_url: '',
  soundcloud_url: '',
  mixcloud_url: '',
};

const demoSet: MusicSet = {
  id: '001',
  title: 'ORION / 001',
  subtitle: 'A journey through deep space',
  published_at: '2026-11-19',
  duration_label: '01:00:00',
  genre: 'Electronic mix',
  cover_url: '/covers/orion-001.svg',
  audio_url: '',
  featured: true,
};

export async function getSets(): Promise<MusicSet[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [demoSet];
  try {
    const supabase = createClient<Database>(url, key);
    const { data, error } = await supabase
      .from('sets')
      .select('id,title,subtitle,published_at,duration_label,genre,cover_url,audio_url,cover_path,audio_key,featured')
      .eq('published', true)
      .order('published_at', { ascending: false });
    if (error) return [demoSet];
    if (!data) return [];
    return data as MusicSet[];
  } catch {
    return [demoSet];
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return defaultSettings;
  try {
    const supabase = createClient<Database>(url, key);
    const { data, error } = await supabase
      .from('site_settings')
      .select('bio,artist_image_url,artist_image_path,contact_email,instagram_url,soundcloud_url,mixcloud_url')
      .eq('id', true)
      .maybeSingle();
    if (error || !data) return defaultSettings;
    return { ...defaultSettings, ...data } as SiteSettings;
  } catch {
    return defaultSettings;
  }
}
