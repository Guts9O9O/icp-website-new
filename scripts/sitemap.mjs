// Writes public/sitemap.xml before each build: the fixed pages plus every
// published project. Reads the database when VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY are set (Cloudflare Pages passes them at build
// time), otherwise falls back to the local seed data.
//   SITE_URL=https://www.icp.firm.in node scripts/sitemap.mjs
import { writeFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import categories from '../src/data/categories.js';
import seedProjects from '../src/data/projects.js';

const SITE = (process.env.SITE_URL || 'https://www.icp.firm.in').replace(/\/$/, '');
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

let projects = seedProjects.filter((p) => p.published).map((p) => ({ category: p.category, slug: p.slug, updated: null }));
if (url && key) {
  try {
    const db = createClient(url, key);
    const { data, error } = await db.from('projects').select('category_slug, slug, updated_at').eq('published', true);
    if (error) throw error;
    projects = data.map((p) => ({ category: p.category_slug, slug: p.slug, updated: p.updated_at }));
  } catch (e) {
    console.warn(`sitemap: could not read projects from Supabase (${e.message}); using seed data`);
  }
}

const entry = (path, priority, lastmod) =>
  `  <url><loc>${SITE}${path}</loc>${lastmod ? `<lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}<priority>${priority}</priority></url>`;

const lines = [
  entry('/', '1.0'),
  entry('/about', '0.8'),
  entry('/portfolio', '0.9'),
  ...categories.map((c) => entry(`/portfolio/${c.slug}`, '0.8')),
  ...projects.map((p) => entry(`/portfolio/${p.category}/${p.slug}`, '0.7', p.updated)),
  entry('/clients', '0.6'),
  entry('/testimonials', '0.5'),
  entry('/enquiry', '0.6'),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>\n`;
await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`sitemap: ${lines.length} URLs (${projects.length} projects) -> public/sitemap.xml`);
