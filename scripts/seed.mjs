// Seeds a Supabase project with the starter content from src/data and the
// images in /public: converts photos to WebP, uploads them into the `media`
// bucket using the folder layout from the migration, and upserts the rows.
//
//   node scripts/seed.mjs            -> local stack (reads keys from `supabase status`)
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed.mjs   -> any project
//
// Safe to re-run: uploads overwrite, rows upsert on their natural keys.
import { execSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

import categories from '../src/data/categories.js';
import projects from '../src/data/projects.js';
import { about, team } from '../src/data/about.js';
import clientGroups from '../src/data/clients.js';
import site from '../src/data/site.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const BUCKET = 'media';

// Image size caps (px, longest side). The CMS applies the same limits on upload.
const THUMB_MAX = 1200;
const GALLERY_MAX = 2400;
const PHOTO_MAX = 1000;

function localCredentials() {
  const out = execSync('npx supabase status -o env', { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  const get = (k) => out.match(new RegExp(`^${k}="?([^"\\n]+)"?`, 'm'))?.[1];
  return { url: get('API_URL'), key: get('SERVICE_ROLE_KEY') };
}

const creds =
  process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? { url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY }
    : localCredentials();

if (!creds.url || !creds.key) {
  console.error('No Supabase credentials. Start the local stack (npx supabase start) or set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const db = createClient(creds.url, creds.key, { auth: { persistSession: false } });
console.log(`Seeding ${creds.url}`);

// ---------------------------------------------------------------------------
// Upload helpers
// ---------------------------------------------------------------------------
async function upload(storagePath, buffer, contentType) {
  const { error } = await db.storage.from(BUCKET).upload(storagePath, buffer, { contentType, upsert: true });
  if (error) throw new Error(`upload ${storagePath}: ${error.message}`);
  return storagePath;
}

// Converts a /public image to WebP (resized to fit `max`) and uploads it.
async function uploadWebp(publicPath, storagePath, max) {
  const src = await readFile(path.join(PUBLIC, publicPath));
  const buf = await sharp(src).rotate().resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  return upload(storagePath, buf, 'image/webp');
}

// Uploads a /public file as-is (logos keep their PNG transparency).
async function uploadRaw(publicPath, storagePath) {
  const buf = await readFile(path.join(PUBLIC, publicPath));
  const type = publicPath.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  return upload(storagePath, buf, type);
}

function must({ error }, what) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Categories (rows exist from the migration; attach landing images)
// ---------------------------------------------------------------------------
for (const c of categories) {
  const storagePath = await uploadWebp(c.image, `categories/${c.slug}.webp`, GALLERY_MAX);
  must(await db.from('categories').update({ image_path: storagePath, label: c.label, sort_order: c.sortOrder }).eq('slug', c.slug), `category ${c.slug}`);
  console.log(`  category   ${c.slug}`);
}

// ---------------------------------------------------------------------------
// Projects + gallery images
// ---------------------------------------------------------------------------
for (const p of projects) {
  const folder = `projects/${p.category}/${p.slug}`;
  const thumb = await uploadWebp(p.thumbnail, `${folder}/thumb.webp`, THUMB_MAX);

  const { data: row, error } = await db
    .from('projects')
    .upsert(
      {
        category_slug: p.category,
        slug: p.slug,
        name: p.name,
        location: p.location,
        area_sqft: p.areaSqft,
        description: p.description,
        thumbnail_path: thumb,
        published: p.published,
        sort_order: p.sortOrder,
      },
      { onConflict: 'category_slug,slug' }
    )
    .select('id')
    .single();
  if (error) throw new Error(`project ${p.slug}: ${error.message}`);

  must(await db.from('project_images').delete().eq('project_id', row.id), `clear images ${p.slug}`);
  const images = [];
  for (const [i, img] of p.images.entries()) {
    const name = String(i + 1).padStart(2, '0');
    images.push({ project_id: row.id, path: await uploadWebp(img, `${folder}/gallery/${name}.webp`, GALLERY_MAX), sort_order: i + 1 });
  }
  if (images.length) must(await db.from('project_images').insert(images), `images ${p.slug}`);
  console.log(`  project    ${p.category}/${p.slug} (${images.length} images)`);
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
for (const m of team) {
  const photo = await uploadWebp(m.image, `team/${m.id}.webp`, PHOTO_MAX);
  const { data: existing } = await db.from('team_members').select('id').eq('first_name', m.firstName).eq('last_name', m.lastName).maybeSingle();
  const row = {
    first_name: m.firstName,
    last_name: m.lastName,
    role_lines: m.role,
    photo_path: photo,
    bio: m.details.join('\n\n'),
    published: true,
    sort_order: m.sortOrder,
  };
  must(existing ? await db.from('team_members').update(row).eq('id', existing.id) : await db.from('team_members').insert(row), `team ${m.id}`);
  console.log(`  team       ${m.firstName} ${m.lastName}`);
}

// ---------------------------------------------------------------------------
// Clients (replace all rows: the seed is the source of truth for the starter set)
// ---------------------------------------------------------------------------
must(await db.from('clients').delete().neq('name', ''), 'clear clients');
for (const group of clientGroups) {
  let order = 0;
  for (const item of group.items) {
    if (!item) continue;
    order += 1;
    if (item.type === 'image') {
      const logo = await uploadRaw(`images/clients/${item.file}`, `clients/${group.category}/${item.file}`);
      must(await db.from('clients').insert({ category_slug: group.category, name: item.name, logo_path: logo, sort_order: order }), `client ${item.name}`);
    } else {
      const name = item.text.split('\n')[0].replace(/,$/, '');
      must(await db.from('clients').insert({ category_slug: group.category, name, text: item.text, sort_order: order }), `client ${name}`);
    }
  }
  console.log(`  clients    ${group.category} (${order})`);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
must(
  await db.from('site_settings').upsert([
    { key: 'about', value: about },
    { key: 'contact', value: site },
  ]),
  'site settings'
);
console.log('  settings   about, contact');

console.log('Done.');
