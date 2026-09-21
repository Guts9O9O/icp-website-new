// Admin data access. Every call runs with the signed-in admin's session, which
// is what the row-level security policies require for writes.
import { mediaUrl, supabase } from '../lib/supabase';

const BUCKET = 'media';

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export const shortId = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

export const projectFolder = (category, slug) => `projects/${category}/${slug}`;

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------
export async function uploadMedia(path, file) {
  unwrap(await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true }));
  return path;
}

export async function copyMedia(from, to) {
  unwrap(await supabase.storage.from(BUCKET).copy(from, to));
  return to;
}

export async function moveMedia(from, to) {
  if (from === to) return to;
  unwrap(await supabase.storage.from(BUCKET).move(from, to));
  return to;
}

export async function removeMedia(paths) {
  const list = paths.filter(Boolean);
  if (list.length) unwrap(await supabase.storage.from(BUCKET).remove(list));
}

// Recursively lists every file under a prefix (Supabase lists one level at a time).
export async function listFolder(prefix) {
  const entries = unwrap(await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 }));
  const files = [];
  for (const e of entries) {
    const full = `${prefix}/${e.name}`;
    if (e.id) files.push(full);
    else files.push(...(await listFolder(full)));
  }
  return files;
}

export async function removeFolder(prefix) {
  await removeMedia(await listFolder(prefix));
}

export { mediaUrl };

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function listCategories() {
  return unwrap(await supabase.from('categories').select('*').order('sort_order'));
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export async function listProjects() {
  return unwrap(
    await supabase
      .from('projects')
      .select('*, project_images(id)')
      .order('category_slug')
      .order('sort_order')
      .order('created_at', { ascending: false })
  );
}

export async function getProject(id) {
  return unwrap(
    await supabase.from('projects').select('*, project_images(*)').eq('id', id).maybeSingle()
  );
}

export async function createProject(fields) {
  return unwrap(await supabase.from('projects').insert(fields).select('*').single());
}

export async function updateProject(id, fields) {
  return unwrap(await supabase.from('projects').update(fields).eq('id', id).select('*').single());
}

// Replaces the gallery rows with `images` ([{ path }] in display order).
export async function setProjectImages(projectId, images) {
  unwrap(await supabase.from('project_images').delete().eq('project_id', projectId));
  if (images.length) {
    unwrap(
      await supabase
        .from('project_images')
        .insert(images.map((img, i) => ({ project_id: projectId, path: img.path, sort_order: i + 1 })))
    );
  }
}

export async function deleteProject(project) {
  await removeFolder(projectFolder(project.category_slug, project.slug));
  unwrap(await supabase.from('projects').delete().eq('id', project.id));
}

// Next sort position within a category (new projects go last).
export async function nextProjectOrder(category) {
  const rows = unwrap(
    await supabase.from('projects').select('sort_order').eq('category_slug', category).order('sort_order', { ascending: false }).limit(1)
  );
  return (rows[0]?.sort_order ?? 0) + 1;
}

export async function reorderProjects(ids) {
  await Promise.all(ids.map(async (id, i) => unwrap(await supabase.from('projects').update({ sort_order: i + 1 }).eq('id', id))));
}

// ---------------------------------------------------------------------------
// Generic simple tables: team_members, clients, testimonials
// ---------------------------------------------------------------------------
export async function listRows(table, order = 'sort_order') {
  return unwrap(await supabase.from(table).select('*').order(order));
}

export async function insertRow(table, row) {
  return unwrap(await supabase.from(table).insert(row).select('*').single());
}

export async function updateRow(table, id, row) {
  return unwrap(await supabase.from(table).update(row).eq('id', id).select('*').single());
}

export async function deleteRow(table, id) {
  unwrap(await supabase.from(table).delete().eq('id', id));
}

export async function reorderRows(table, ids) {
  await Promise.all(ids.map(async (id, i) => unwrap(await supabase.from(table).update({ sort_order: i + 1 }).eq('id', id))));
}

// ---------------------------------------------------------------------------
// Enquiries (leads / recruitment) — written by the form backend, worked here
// ---------------------------------------------------------------------------
export async function listEnquiries(kind) {
  return unwrap(await supabase.from('enquiries').select('*').eq('kind', kind).order('created_at', { ascending: false }));
}

export async function countNewEnquiries() {
  const rows = unwrap(await supabase.from('enquiries').select('kind').eq('status', 'new'));
  return rows.reduce((acc, r) => ({ ...acc, [r.kind]: (acc[r.kind] ?? 0) + 1 }), { lead: 0, recruitment: 0 });
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
export async function getSetting(key) {
  const row = unwrap(await supabase.from('site_settings').select('value').eq('key', key).maybeSingle());
  return row?.value ?? null;
}

export async function setSetting(key, value) {
  unwrap(await supabase.from('site_settings').upsert({ key, value }));
}
