import { useEffect, useState } from 'react';
import * as api from '../api';
import { NOT_CLIENT_CATEGORIES } from '../../data/clients';
import { ACCEPT_LOGOS, prepareLogo, previewUrl } from '../images';
import ImageDrop from '../components/ImageDrop';
import { Badge, Button, Card, Field, Input, PageHeader, Select, Spinner, Textarea, Toggle, errorMessage, useConfirm, useToast } from '../components/ui';

const TABLE = 'clients';

function ClientForm({ initial, categories, onSave, onCancel, toast }) {
  const [form, setForm] = useState(initial);
  const [logo, setLogo] = useState(null); // { file, preview }
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const chooseLogo = async ([file]) => {
    try {
      const prepared = await prepareLogo(file);
      setLogo({ file: prepared, preview: previewUrl(prepared) });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Please enter the client name.');
    if (form.kind === 'text' && !form.text.trim()) return toast.error('Please enter the text to show.');
    setBusy(true);
    try {
      await onSave(form, logo?.file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 border-t border-icp-mist/50 bg-[#faf9f7] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client name *"><Input value={form.name} onChange={set('name')} /></Field>
        <Field label="Category *">
          <Select value={form.category_slug} onChange={set('category_slug')}>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.label}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Show as">
        <Select value={form.kind} onChange={set('kind')}>
          <option value="logo">Logo</option>
          <option value="text">Text (for private clients without a logo)</option>
        </Select>
      </Field>
      {form.kind === 'logo' ? (
        <div className="flex items-start gap-4">
          <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded bg-icp-taupe p-2">
            {(logo?.preview || initial.logo_path) && <img src={logo?.preview ?? api.mediaUrl(initial.logo_path)} alt="" className="max-h-full max-w-full object-contain" />}
          </div>
          <div className="flex-1">
            <ImageDrop multiple={false} accept={ACCEPT_LOGOS} compact label="Choose a logo" hint="PNG or SVG with transparent background, light colour (shown on brown)" onFiles={chooseLogo} />
          </div>
        </div>
      ) : (
        <Field label="Text *" hint="One line per row, e.g. Hegde House, / Belgavi Karnataka">
          <Textarea rows={3} value={form.text} onChange={set('text')} />
        </Field>
      )}
      <Toggle checked={form.published} onChange={set('published')} label={form.published ? 'Shown on the website' : 'Hidden'} />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default function ClientsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () =>
    Promise.all([api.listRows(TABLE), api.listCategories()])
      .then(([r, c]) => { setRows(r); setCategories(c.filter((cat) => !NOT_CLIENT_CATEGORIES.includes(cat.slug))); })
      .catch((e) => toast.error(errorMessage(e)));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formFor = (row, category) =>
    row
      ? { name: row.name, category_slug: row.category_slug, kind: row.logo_path ? 'logo' : 'text', text: row.text ?? '', published: row.published, logo_path: row.logo_path }
      : { name: '', category_slug: category ?? 'hospitality', kind: category === 'private-residences' ? 'text' : 'logo', text: '', published: true };

  const save = async (form, file, existing) => {
    try {
      const inCategory = (rows ?? []).filter((r) => r.category_slug === form.category_slug);
      const base = { name: form.name.trim(), category_slug: form.category_slug, published: form.published, text: form.kind === 'text' ? form.text.trim() : null };
      let row = existing
        ? await api.updateRow(TABLE, existing.id, base)
        : await api.insertRow(TABLE, { ...base, sort_order: inCategory.length + 1 });
      if (form.kind === 'logo' && file) {
        const ext = file.type === 'image/svg+xml' ? 'svg' : file.type === 'image/png' ? 'png' : 'webp';
        const path = await api.uploadMedia(`clients/${form.category_slug}/${row.id}-${api.shortId()}.${ext}`, file);
        await api.updateRow(TABLE, row.id, { logo_path: path });
        if (existing?.logo_path && existing.logo_path !== path) await api.removeMedia([existing.logo_path]).catch(() => {});
      } else if (form.kind === 'logo' && existing?.logo_path && existing.category_slug !== form.category_slug) {
        // Category changed: keep the folder hierarchy accurate.
        const moved = await api.moveMedia(existing.logo_path, existing.logo_path.replace(`clients/${existing.category_slug}/`, `clients/${form.category_slug}/`));
        await api.updateRow(TABLE, row.id, { logo_path: moved });
      } else if (form.kind === 'text' && existing?.logo_path) {
        await api.removeMedia([existing.logo_path]);
        await api.updateRow(TABLE, row.id, { logo_path: null });
      }
      toast.success('Saved.');
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (row) => {
    if (!(await confirm({ title: `Remove ${row.name}?`, confirmLabel: 'Remove', danger: true }))) return;
    try {
      if (row.logo_path) await api.removeMedia([row.logo_path]);
      await api.deleteRow(TABLE, row.id);
      toast.success('Removed.');
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const move = async (group, i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= group.length) return;
    const next = [...group];
    [next[i], next[j]] = [next[j], next[i]];
    try {
      await api.reorderRows(TABLE, next.map((r) => r.id));
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!rows) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <>
      <PageHeader title="Clients" description="Logos shown on the Clients page, grouped by category (two columns each, in this order)." />
      <div className="space-y-6">
        {categories.map((c) => {
          const group = rows.filter((r) => r.category_slug === c.slug);
          const newKey = `new:${c.slug}`;
          return (
            <Card key={c.slug}>
              <div className="flex items-center justify-between px-5 py-3">
                <h2 className="text-[16px] font-semibold">{c.label} <span className="text-[13px] font-normal text-icp-slate/60">({group.length})</span></h2>
                <Button size="sm" onClick={() => setEditing(editing === newKey ? null : newKey)}>+ Add</Button>
              </div>
              {editing === newKey && <ClientForm initial={formFor(null, c.slug)} categories={categories} toast={toast} onSave={(f, file) => save(f, file, null)} onCancel={() => setEditing(null)} />}
              <ul className="divide-y divide-icp-mist/50 border-t border-icp-mist/50">
                {group.map((r, i) => (
                  <li key={r.id}>
                    <div className="flex items-center gap-4 px-4 py-2.5">
                      <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded bg-icp-taupe p-1.5">
                        {r.logo_path ? <img src={api.mediaUrl(r.logo_path)} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-[11px] text-icp-mist">text</span>}
                      </div>
                      <p className="min-w-0 flex-1 truncate text-[14px]">{r.name}</p>
                      <Badge tone={r.published ? 'green' : 'amber'}>{r.published ? 'Shown' : 'Hidden'}</Badge>
                      <div className="hidden gap-1 sm:flex">
                        <Button size="sm" variant="ghost" onClick={() => move(group, i, -1)}>↑</Button>
                        <Button size="sm" variant="ghost" onClick={() => move(group, i, 1)}>↓</Button>
                      </div>
                      <Button size="sm" onClick={() => setEditing(editing === r.id ? null : r.id)}>{editing === r.id ? 'Close' : 'Edit'}</Button>
                      <Button size="sm" variant="ghost" className="text-red-700" onClick={() => remove(r)}>Remove</Button>
                    </div>
                    {editing === r.id && <ClientForm initial={formFor(r)} categories={categories} toast={toast} onSave={(f, file) => save(f, file, r)} onCancel={() => setEditing(null)} />}
                  </li>
                ))}
                {group.length === 0 && <li className="px-5 py-4 text-[13px] text-icp-slate/60">No clients in this category yet.</li>}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
