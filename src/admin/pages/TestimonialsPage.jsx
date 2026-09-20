import { useEffect, useState } from 'react';
import * as api from '../api';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, Textarea, Toggle, errorMessage, useConfirm, useToast } from '../components/ui';

const TABLE = 'testimonials';
const EMPTY = { quote: '', author: '', company: '', published: true };

function TestimonialForm({ initial, onSave, onCancel, toast }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.quote.trim() || !form.author.trim()) return toast.error('Please enter the quote and who said it.');
    setBusy(true);
    try {
      await onSave(form);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 border-t border-icp-mist/50 bg-[#faf9f7] p-5">
      <Field label="Quote *"><Textarea rows={4} value={form.quote} onChange={set('quote')} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *"><Input value={form.author} onChange={set('author')} placeholder="e.g. Rahul Mehta" /></Field>
        <Field label="Company / role"><Input value={form.company} onChange={set('company')} placeholder="e.g. Director, Sahara Star" /></Field>
      </div>
      <Toggle checked={form.published} onChange={set('published')} label={form.published ? 'Shown on the website' : 'Hidden'} />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default function TestimonialsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = () => api.listRows(TABLE).then(setRows).catch((e) => toast.error(errorMessage(e)));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (form, existing) => {
    const row = { quote: form.quote.trim(), author: form.author.trim(), company: form.company.trim() || null, published: form.published };
    try {
      if (existing) await api.updateRow(TABLE, existing.id, row);
      else await api.insertRow(TABLE, { ...row, sort_order: (rows?.length ?? 0) + 1 });
      toast.success('Saved.');
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (row) => {
    if (!(await confirm({ title: 'Remove this testimonial?', confirmLabel: 'Remove', danger: true }))) return;
    try {
      await api.deleteRow(TABLE, row.id);
      toast.success('Removed.');
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const move = async (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    try {
      await api.reorderRows(TABLE, next.map((r) => r.id));
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title="Testimonials" description="Client quotes for the testimonials section." actions={<Button variant="primary" onClick={() => setEditing('new')}>+ Add testimonial</Button>} />
      {editing === 'new' && (
        <Card className="mb-6 overflow-hidden">
          <p className="px-5 pt-4 text-[15px] font-medium">New testimonial</p>
          <TestimonialForm initial={EMPTY} toast={toast} onSave={(f) => save(f, null)} onCancel={() => setEditing(null)} />
        </Card>
      )}
      {!rows ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : rows.length === 0 ? (
        <EmptyState title="No testimonials yet" description="Add a quote from a happy client." action={<Button variant="primary" onClick={() => setEditing('new')}>+ Add testimonial</Button>} />
      ) : (
        <Card>
          <ul className="divide-y divide-icp-mist/50">
            {rows.map((r, i) => (
              <li key={r.id}>
                <div className="flex items-start gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] leading-relaxed text-icp-slate">“{r.quote}”</p>
                    <p className="mt-1 text-[13px] text-icp-slate/60">— {r.author}{r.company ? `, ${r.company}` : ''}</p>
                  </div>
                  <Badge tone={r.published ? 'green' : 'amber'}>{r.published ? 'Shown' : 'Hidden'}</Badge>
                  <div className="hidden gap-1 sm:flex">
                    <Button size="sm" variant="ghost" onClick={() => move(i, -1)}>↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => move(i, 1)}>↓</Button>
                  </div>
                  <Button size="sm" onClick={() => setEditing(editing === r.id ? null : r.id)}>{editing === r.id ? 'Close' : 'Edit'}</Button>
                  <Button size="sm" variant="ghost" className="text-red-700" onClick={() => remove(r)}>Remove</Button>
                </div>
                {editing === r.id && <TestimonialForm initial={{ quote: r.quote, author: r.author, company: r.company ?? '', published: r.published }} toast={toast} onSave={(f) => save(f, r)} onCancel={() => setEditing(null)} />}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
