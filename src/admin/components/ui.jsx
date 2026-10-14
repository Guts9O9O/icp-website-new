import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
const buttonStyles = {
  primary: 'bg-icp-red text-white hover:bg-[#5e1614] disabled:bg-icp-red/50',
  secondary: 'border border-icp-mist bg-white text-icp-slate hover:bg-[#f5f3f0] disabled:text-icp-slate/40',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:text-red-300',
  ghost: 'text-icp-slate hover:bg-[#f0edea] disabled:text-icp-slate/40',
};

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', ...props }) {
  const sizes = { sm: 'h-8 px-3 text-[13px]', md: 'h-10 px-4 text-[14px]', lg: 'h-12 px-6 text-[15px]' };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed ${sizes[size]} ${buttonStyles[variant]} ${className}`}
      {...props}
    />
  );
}

// ---------------------------------------------------------------------------
// Form fields
// ---------------------------------------------------------------------------
export function Field({ label, hint, error, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1.5 block text-[13px] font-medium text-icp-slate">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-[12px] text-icp-slate/60">{hint}</span>}
      {error && <span className="mt-1 block text-[12px] text-red-700">{error}</span>}
    </label>
  );
}

const inputClass =
  'block w-full rounded-md border border-icp-mist bg-white px-3 text-[15px] text-icp-slate outline-none placeholder:text-icp-slate/40 focus:border-icp-red focus:ring-2 focus:ring-icp-red/15 disabled:bg-[#f5f3f0]';

export function Input({ className = '', ...props }) {
  return <input className={`${inputClass} h-11 ${className}`} {...props} />;
}

// Forwards its ref: the bold control needs the element to read the selection.
export const Textarea = forwardRef(function Textarea({ className = '', rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={`${inputClass} py-2.5 leading-relaxed ${className}`} {...props} />;
});

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${inputClass} h-11 ${className}`} {...props}>
      {children}
    </select>
  );
}

// On/off switch with a visible label (clearer than a checkbox for "published").
export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 text-[14px] text-icp-slate disabled:opacity-50"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-icp-mist'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Layout bits
// ---------------------------------------------------------------------------
export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[24px] font-semibold text-icp-slate">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-icp-slate/70">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className = '', children }) {
  return <div className={`rounded-lg border border-icp-mist/70 bg-white ${className}`}>{children}</div>;
}

export function Badge({ tone = 'neutral', children }) {
  const tones = {
    neutral: 'bg-[#efece8] text-icp-slate',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-800',
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium ${tones[tone]}`}>{children}</span>;
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-icp-mist p-10 text-center">
      <p className="text-[16px] font-medium text-icp-slate">{title}</p>
      {description && <p className="mt-1 text-[14px] text-icp-slate/70">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-icp-mist border-t-icp-red ${className}`}
      aria-label="Loading"
    />
  );
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 3500);
  }, []);
  const api = useMemo(() => ({ success: (m) => push(m, 'success'), error: (m) => push(m, 'error') }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-md px-4 py-3 text-[14px] text-white shadow-lg ${t.tone === 'error' ? 'bg-red-700' : 'bg-emerald-700'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ---------------------------------------------------------------------------
// Confirm dialog (promise-based): const ok = await confirm({ title, message })
// ---------------------------------------------------------------------------
const ConfirmContext = createContext(() => Promise.resolve(false));

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setState({ ...opts, resolve })),
    []
  );

  const close = (result) => {
    state?.resolve(result);
    setState(null);
  };

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (e) => e.key === 'Escape' && close(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4" onClick={() => close(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[18px] font-semibold text-icp-slate">{state.title}</h2>
            {state.message && <p className="mt-2 text-[14px] leading-relaxed text-icp-slate/80">{state.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button onClick={() => close(false)}>{state.cancelLabel ?? 'Cancel'}</Button>
              <Button variant={state.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
                {state.confirmLabel ?? 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}

// Human-readable error text for toasts.
export function errorMessage(err) {
  const msg = err?.message ?? String(err);
  if (/projects_category_slug_slug_key|duplicate key/.test(msg)) return 'A project with this link name already exists in that category. Change the link name.';
  if (/projects_slug_format/.test(msg)) return 'Link name can only contain lowercase letters, numbers and hyphens.';
  if (/row-level security/.test(msg)) return 'Not allowed — please sign in again.';
  if (/Failed to fetch|NetworkError/.test(msg)) return 'Cannot reach the server. Check your connection and try again.';
  return msg;
}
