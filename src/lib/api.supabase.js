// Data-access layer backed by Supabase. Returns the same shapes as api.local.js
// so components never see the difference. Row-level security already hides
// unpublished rows from anonymous visitors; the explicit `published` filters
// keep admin previews out of the public site when an admin is signed in.
import { mediaUrl, supabase } from './supabase';
import { DEFAULT_TEAM_PHOTO } from './teamPhoto';
import { FOOTER_DEFAULT, HOME_DEFAULT } from '../data/site';
import { NOT_CLIENT_CATEGORIES } from '../data/clients';

const bySortOrder = (a, b) => a.sort_order - b.sort_order;

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

const mapCategory = (c) => ({
  slug: c.slug,
  label: c.label,
  image: mediaUrl(c.image_path),
  description: c.description ?? '',
  sortOrder: c.sort_order,
});

const mapProject = (p) => ({
  id: p.id,
  slug: p.slug,
  category: p.category_slug,
  name: p.name,
  // Typed in the admin as "Mumbai,Maharashtra"; shown with a space after each comma.
  location: p.location?.replace(/\s*,\s*/g, ', ').trim(),
  client: p.client,
  typology: p.typology,
  areaSqft: p.area_sqft,
  year: p.year,
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
  bio: m.bio ?? '',
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

// The About page's group photograph and its strips. Until the studio uploads
// one of their own, the photograph supplied with R5 (shipped with the site).
export async function getTeamPhoto() {
  const saved = await getSetting('team_photo');
  if (!saved?.path) return DEFAULT_TEAM_PHOTO;
  return { path: mediaUrl(saved.path, saved.updatedAt), aspect: saved.aspect ?? DEFAULT_TEAM_PHOTO.aspect, splits: saved.splits ?? null };
}

// The footer's line, set in the admin. Every page has a footer (the home page
// two at once), so it is fetched once per visit and shared; a failed fetch
// falls back to the default rather than leaving the footer empty.
let footerRequest = null;
export function getFooter() {
  footerRequest ??= getSetting('footer')
    .then((f) => ({ ...FOOTER_DEFAULT, ...(f ?? {}) }))
    .catch(() => {
      footerRequest = null;
      return FOOTER_DEFAULT;
    });
  return footerRequest;
}

// The home page photo, set in the admin; the original until one is uploaded.
// Cached like the footer: the home page stays mounted under every other page.
let homeRequest = null;
export function getHome() {
  homeRequest ??= getSetting('home')
    .then((h) => (h?.imagePath ? { image: mediaUrl(h.imagePath, h.updatedAt) } : HOME_DEFAULT))
    .catch(() => {
      homeRequest = null;
      return HOME_DEFAULT;
    });
  return homeRequest;
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
  // A category takes a column only once it has a client to show: a portfolio
  // category the studio adds does not turn up on Our Clients as an empty
  // column (as Bespoke Elements once did) until a client is filed under it.
  return categories
    .filter((c) => !NOT_CLIENT_CATEGORIES.includes(c.slug))
    .map((category) => ({
      category: category.slug,
      label: category.label,
      items: clients
        .filter((c) => c.category_slug === category.slug)
        .map((c) =>
          c.logo_path
            ? { type: 'image', src: mediaUrl(c.logo_path), name: c.name }
            : { type: 'text', text: c.text ?? c.name }
        ),
    }))
    .filter((group) => group.items.length > 0);
}

export async function getTestimonials() {
  const rows = unwrap(
    await supabase.from('testimonials').select('*').eq('published', true).order('sort_order')
  );
  return rows.map((t) => ({ id: t.id, quote: t.quote, author: t.author, company: t.company, signature: mediaUrl(t.signature_path) }));
}

export async function getSite() {
  return getSetting('contact');
}
