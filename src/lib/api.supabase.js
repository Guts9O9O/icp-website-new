// Data-access layer backed by Supabase. Returns the same shapes as api.local.js
// so components never see the difference. Row-level security already hides
// unpublished rows from anonymous visitors; the explicit `published` filters
// keep admin previews out of the public site when an admin is signed in.
import { mediaUrl, supabase } from './supabase';

const bySortOrder = (a, b) => a.sort_order - b.sort_order;

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

const mapCategory = (c) => ({
  slug: c.slug,
  label: c.label,
  image: mediaUrl(c.image_path),
  sortOrder: c.sort_order,
});

const mapProject = (p) => ({
  id: p.id,
  slug: p.slug,
  category: p.category_slug,
  name: p.name,
  location: p.location,
  areaSqft: p.area_sqft,
  description: p.description,
  thumbnail: mediaUrl(p.thumbnail_path, p.updated_at),
  images: [...(p.project_images ?? [])].sort(bySortOrder).map((i) => mediaUrl(i.path)),
  published: p.published,
  sortOrder: p.sort_order,
});

const mapMember = (m) => ({
  id: m.id,
  firstName: m.first_name,
  lastName: m.last_name,
  role: m.role_lines ?? [],
  image: mediaUrl(m.photo_path, m.updated_at),
  details: (m.bio ?? '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
  sortOrder: m.sort_order,
});

export async function getCategories() {
  const rows = unwrap(await supabase.from('categories').select('*').order('sort_order'));
  return rows.map(mapCategory);
}

export async function getCategory(slug) {
  const row = unwrap(await supabase.from('categories').select('*').eq('slug', slug).maybeSingle());
  return row ? mapCategory(row) : null;
}

export async function getProjects(categorySlug) {
  const rows = unwrap(
    await supabase
      .from('projects')
      .select('*, project_images(*)')
      .eq('category_slug', categorySlug)
      .eq('published', true)
      .order('sort_order')
  );
  return rows.map(mapProject);
}

export async function getProject(categorySlug, slug) {
  const row = unwrap(
    await supabase
      .from('projects')
      .select('*, project_images(*)')
      .eq('category_slug', categorySlug)
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle()
  );
  return row ? mapProject(row) : null;
}

async function getSetting(key) {
  const row = unwrap(await supabase.from('site_settings').select('value').eq('key', key).maybeSingle());
  return row?.value ?? null;
}

export async function getAbout() {
  return getSetting('about');
}

export async function getTeam() {
  const rows = unwrap(
    await supabase.from('team_members').select('*').eq('published', true).order('sort_order')
  );
  return rows.map(mapMember);
}

export async function getClientGroups() {
  const [categories, clients] = await Promise.all([
    getCategories(),
    unwrap(await supabase.from('clients').select('*').eq('published', true).order('sort_order')),
  ]);
  return categories.map((category) => ({
    category: category.slug,
    label: category.label,
    items: clients
      .filter((c) => c.category_slug === category.slug)
      .map((c) =>
        c.logo_path
          ? { type: 'image', src: mediaUrl(c.logo_path), name: c.name }
          : { type: 'text', text: c.text ?? c.name }
      ),
  }));
}

export async function getTestimonials() {
  const rows = unwrap(
    await supabase.from('testimonials').select('*').eq('published', true).order('sort_order')
  );
  return rows.map((t) => ({ id: t.id, quote: t.quote, author: t.author, company: t.company }));
}

export async function getSite() {
  return getSetting('contact');
}
