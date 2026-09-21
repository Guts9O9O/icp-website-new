import { Navigate, Route, Routes } from 'react-router';
import { supabase } from '../lib/supabase';
import { useSeo } from '../lib/seo';
import { AuthProvider, RequireAuth } from './auth';
import AdminLayout from './components/AdminLayout';
import { ConfirmProvider, ToastProvider } from './components/ui';
import ClientsPage from './pages/ClientsPage';
import EnquiriesPage from './pages/EnquiriesPage';
import LoginPage from './pages/LoginPage';
import ProjectEditPage from './pages/ProjectEditPage';
import ProjectsListPage from './pages/ProjectsListPage';
import SettingsPage from './pages/SettingsPage';
import TeamPage from './pages/TeamPage';
import TestimonialsPage from './pages/TestimonialsPage';

// The admin panel, mounted at /admin/*. Plain layout, no page transitions.
export default function AdminApp() {
  useSeo({ title: 'Admin', noindex: true });
  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5f2] p-6 font-sans text-icp-slate">
        <p className="max-w-md text-center text-[15px]">
          The admin panel needs the database connection configured (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY).
        </p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="login" element={<LoginPage />} />
            <Route
              element={
                <RequireAuth>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="projects" replace />} />
              <Route path="projects" element={<ProjectsListPage />} />
              <Route path="projects/:id" element={<ProjectEditPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="testimonials" element={<TestimonialsPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="leads" element={<EnquiriesPage kind="lead" />} />
              <Route path="recruitment" element={<EnquiriesPage kind="recruitment" />} />
              <Route path="*" element={<Navigate to="projects" replace />} />
            </Route>
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
