import { supabase } from './supabase';

export async function resolveAvatarUrl(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  const { data, error } = await supabase.storage.from('avatars').createSignedUrl(value, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}
