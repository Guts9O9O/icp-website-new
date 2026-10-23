import { useEffect, useState } from 'react';
import * as api from '../api';
import { ACCEPT_LOGOS, extensionOf, prepareLogo, previewUrl } from '../images';
import ImageDrop from '../components/ImageDrop';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, Textarea, Toggle, errorMessage, useConfirm, useToast } from '../components/ui';

const TABLE = 'testimonials';
const EMPTY = { quote: '', author: '', company: '', published: true };

function TestimonialForm({ initial, onSave, onCancel, toast }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  // { file, preview } for a new signature; `removed` when the saved one goes.
  const [signature, setSignature] = useState(null);
  const [removed, setRemoved] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  // Trimmed of any empty transparent margin, like the client logos, so every
  // signature sits at the same size under the name.
  const chooseSignature = async ([file]) => {
    try {
      const prepared = await prepareLogo(file);
      setSignature({ file: prepared, preview: previewUrl(prepared) });
      setRemoved(false);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const shownSignature = signature?.preview ?? (!removed && initial.signature_path ? api.mediaUrl(initial.signature_path) : null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.quote.trim() || !form.author.trim()) return toast.error('Please enter the quote and who said it.');
    setBusy(true);
    try {
      await onSave(form, { file: signature?.file, removed });
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
      <Field as="div" label="Signature" hint="Optional. Shown under the name on the website, on the taupe of the Testimonials page (as in the preview). A transparent PNG — just the signature, no background — in white or a light ink reads best.">
        <div className="flex items-start gap-4">
          {/* On the page's own brown, as visitors will see it. */}
          <div className="flex h-24 w-56 shrink-0 items-center justify-center rounded bg-icp-taupe p-2">
            {shownSignature ? <img src={shownSignature} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-[12px] text-icp-mist/70">No signature</span>}
          </div>
          <div className="flex-1 space-y-2">
            <ImageDrop multiple={false} accept={ACCEPT_LOGOS} compact label={shownSignature ? 'Replace the signature' : 'Choose a signature'} hint="PNG with a transparent background" onFiles={chooseSignature} />
            {shownSignature && (
              <Button size="sm" variant="ghost" onClick={() => { setSignature(null); setRemoved(true); }}>
                Remove the signature
              </Button>
            )}
          </div>
        </div>
      </Field>
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

  const save = async (form, sig, existing) => {
    const row = { quote: form.quote.trim(), author: form.author.trim(), company: form.company.trim() || null, published: form.published };
    try {
      const saved = existing ? await api.updateRow(TABLE, existing.id, row) : await api.insertRow(TABLE, { ...row, sort_order: (rows?.length ?? 0) + 1 });
      const old = existing?.signature_path ?? null;
      if (sig.file) {
        // A fresh name each time, so no browser keeps showing the old one.
        const path = await api.uploadMedia(`testimonials/${saved.id}-${api.shortId()}.${extensionOf(sig.file)}`, sig.file);
        await api.updateRow(TABLE, saved.id, { signature_path: path });
        if (old) await api.removeMedia([old]).catch(() => {});
      } else if (sig.removed && old) {
        await api.updateRow(TABLE, saved.id, { signature_path: null });
        await api.removeMedia([old]).catch(() => {});
      }
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
      if (row.signature_path) await api.removeMedia([row.signature_path]).catch(() => {});
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
      <PageHeader title="Testimonials" description="Client quotes for the Testimonials page, each with an optional signature." actions={<Button variant="primary" onClick={() => setEditing('new')}>+ Add testimonial</Button>} />
      {editing === 'new' && (
        <Card className="mb-6 overflow-hidden">
          <p className="px-5 pt-4 text-[15px] font-medium">New testimonial</p>
          <TestimonialForm initial={EMPTY} toast={toast} onSave={(f, sig) => save(f, sig, null)} onCancel={() => setEditing(null)} />
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
                  {r.signature_path && (
                    <div className="flex h-10 w-24 shrink-0 items-center justify-center rounded bg-icp-taupe p-1" title="Signature">
                      <img src={api.mediaUrl(r.signature_path)} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <Badge tone={r.published ? 'green' : 'amber'}>{r.published ? 'Shown' : 'Hidden'}</Badge>
                  <div className="hidden gap-1 sm:flex">
                    <Button size="sm" variant="ghost" onClick={() => move(i, -1)}>↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => move(i, 1)}>↓</Button>
                  </div>
                  <Button size="sm" onClick={() => setEditing(editing === r.id ? null : r.id)}>{editing === r.id ? 'Close' : 'Edit'}</Button>
                  <Button size="sm" variant="ghost" className="text-red-700" onClick={() => remove(r)}>Remove</Button>
                </div>
                {editing === r.id && <TestimonialForm initial={{ quote: r.quote, author: r.author, company: r.company ?? '', published: r.published, signature_path: r.signature_path }} toast={toast} onSave={(f, sig) => save(f, sig, r)} onCancel={() => setEditing(null)} />}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
