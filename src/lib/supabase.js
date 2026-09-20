import { createClient } from '@supabase/supabase-js';

// Null when the env vars are absent, in which case the site falls back to the
// local seed data (see api.js). Values come from .env.local (never committed).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

// Public URL for a file in the `media` bucket. Absolute URLs and local
// /public paths are passed through untouched.
export function mediaUrl(path) {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `${url}/storage/v1/object/public/media/${path}`;
}
