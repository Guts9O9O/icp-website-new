// Single data-access layer for the public site.
// Phase 1: reads local seed data. Phase 2 swaps the bodies for Supabase
// queries — the signatures stay the same so no component changes.
import categories from '../data/categories';
import projects from '../data/projects';
import { about, team } from '../data/about';
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

export async function getTeam() {
  return [...team].sort(bySortOrder);
}

export async function getClientGroups() {
  return clientGroups;
}

export async function getSite() {
  return site;
}
