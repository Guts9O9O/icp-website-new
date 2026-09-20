import { useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../auth';
import { Button, Field, Input } from '../components/ui';

export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={location.state?.from ?? '/admin/projects'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await signIn(email.trim(), password);
    setBusy(false);
    if (err) setError(err.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : err.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5f2] px-4 font-sans">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg border border-icp-mist/70 bg-white p-8 shadow-sm">
        <p className="text-[13px] uppercase tracking-[0.2em] text-icp-slate/60">iConcepts + Partners</p>
        <h1 className="mt-1 text-[22px] font-semibold text-icp-slate">Website admin</h1>

        <div className="mt-6 space-y-4">
          <Field label="Email">
            <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </Field>
          <Field label="Password" error={error}>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
        </div>

        <Button type="submit" variant="primary" size="lg" className="mt-6 w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
}
