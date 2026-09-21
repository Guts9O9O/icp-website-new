import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth';
import { countNewEnquiries } from '../api';

const links = [
  { to: '/admin/leads', label: 'Leads', badge: 'lead' },
  { to: '/admin/recruitment', label: 'Recruitment', badge: 'recruitment' },
  { to: '/admin/projects', label: 'Projects' },
  { to: '/admin/team', label: 'Team' },
  { to: '/admin/clients', label: 'Clients' },
  { to: '/admin/testimonials', label: 'Testimonials' },
  { to: '/admin/settings', label: 'Site text & contact' },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [counts, setCounts] = useState({ lead: 0, recruitment: 0 });

  // Unread counts for the sidebar; refreshed on navigation and when an
  // enquiry's status changes.
  useEffect(() => {
    let active = true;
    const refresh = () => countNewEnquiries().then((c) => active && setCounts(c)).catch(() => {});
    refresh();
    window.addEventListener('icp:enquiries-changed', refresh);
    return () => {
      active = false;
      window.removeEventListener('icp:enquiries-changed', refresh);
    };
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#f7f5f2] font-sans text-icp-slate md:flex">
      <aside className="border-b border-icp-mist/60 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center gap-3 px-5 py-4">
          <img src="/images/icons/Internet.png" alt="" className="hidden h-6 w-6 md:block" />
          <div>
            <p className="text-[15px] font-semibold leading-tight">iC+P Admin</p>
            <p className="text-[12px] text-icp-slate/60">Website content</p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center justify-between gap-3 whitespace-nowrap rounded-md px-3 py-2 text-[14px] transition-colors ${
                  isActive ? 'bg-icp-red text-white' : 'text-icp-slate hover:bg-[#f0edea]'
                }`
              }
            >
              <span>{l.label}</span>
              {l.badge && counts[l.badge] > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-semibold text-white">{counts[l.badge]}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-icp-mist/60 px-5 py-4 text-[13px] md:block">
          <a href="/" target="_blank" rel="noreferrer" className="block text-icp-red hover:underline">
            View website ↗
          </a>
          <p className="mt-3 truncate text-icp-slate/60" title={user?.email}>
            {user?.email}
          </p>
          <button type="button" onClick={signOut} className="mt-1 text-icp-slate hover:underline">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-10 md:py-8">
        <div className="mx-auto max-w-5xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
