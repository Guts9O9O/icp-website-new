import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Tracks the Supabase Auth session. Anyone with an account is an admin
// (self-signup is disabled; accounts are created by the developer).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still loading

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => active && setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      loading: session === undefined,
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

// Redirects to the login page (remembering where the admin was going).
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  return children;
}
