// Single data-access layer for the public site. Uses Supabase when
// VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set, otherwise the local seed
// data — so the site always runs, with or without a backend.
import * as local from './api.local';
import * as remote from './api.supabase';
import { supabase } from './supabase';

const backend = supabase ? remote : local;

export const {
  getCategories,
  getCategory,
  getProjects,
  getProject,
  getAbout,
  getTeam,
  getTeamPhoto,
  getFooter,
  getHome,
  getClientGroups,
  getTestimonials,
  getSite,
} = backend;
