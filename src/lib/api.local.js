// Data-access layer backed by the local seed files in src/data. Used when no
// Supabase env vars are set (see api.js); also the source for scripts/seed.mjs.
import categories from '../data/categories';
import projects from '../data/projects';
import { about, team } from '../data/about';
import { DEFAULT_TEAM_PHOTO } from './teamPhoto';
import { FOOTER_DEFAULT } from '../data/site';
import clientGroups from '../data/clients';
import site from '../data/site';

const bySortOrder = (a, b) => a.sortOrder - b.sortOrder;

export async function getCategories() {
  return [...categories].sort(bySortOrder);
}

export async function getCategory(slug) {
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function getProjects(categorySlug) {
  return projects
    .filter((p) => p.published && p.category === categorySlug)
    .sort(bySortOrder);
}

export async function getProject(categorySlug, slug) {
  return (
    projects.find((p) => p.published && p.category === categorySlug && p.slug === slug) ?? null
  );
}

export async function getAbout() {
  return about;
}

export async function getFooter() {
  return FOOTER_DEFAULT;
}

export async function getTeamPhoto() {
  return DEFAULT_TEAM_PHOTO;
}

export async function getTeam() {
  return [...team].sort(bySortOrder);
}

export async function getClientGroups() {
  return clientGroups.map((group) => ({
    ...group,
    items: group.items.map((item) =>
      item?.type === 'image' ? { type: 'image', src: `/images/clients/${item.file}`, name: item.name } : item
    ),
  }));
}

export async function getTestimonials() {
  return [];
}

export async function getSite() {
  return site;
}
