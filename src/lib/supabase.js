import { createClient } from '@supabase/supabase-js';

// Null when the env vars are absent, in which case the site falls back to the
// local seed data (see api.js). Values come from .env.local (never committed).
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In the second after signing in, Supabase now and then refuses the brand-new
// token with "JWT issued at future": the server that issued it reads its
// clock a hair ahead of the one checking it. The same token is accepted a
// moment later, so such a request is sent again once, after a short wait,
// instead of reaching the studio as an error. Nothing else is retried.
async function fetchPastClockSkew(input, init) {
  const res = await fetch(input, init);
  if (res.status !== 401 && res.status !== 403) return res;
  const body = await res.clone().text().catch(() => '');
  if (!/issued at future/i.test(body)) return res;
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return fetch(input, init);
}

export const supabase = url && anonKey ? createClient(url, anonKey, { global: { fetch: fetchPastClockSkew } }) : null;

// Public URL for a file in the `media` bucket. Absolute URLs and local
// /public paths are passed through untouched. `version` (e.g. a row's
// updated_at) is appended so replaced files with a fixed name — thumb.webp,
// team photos — are not served stale from browser or CDN caches.
export function mediaUrl(path, version) {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  const base = `${url}/storage/v1/object/public/media/${path}`;
  return version ? `${base}?v=${encodeURIComponent(String(version))}` : base;
}
