import { useEffect, useState } from 'react';
import * as api from '../api';
import { ACCEPT_PHOTOS, SIZES, previewUrl, toWebp } from '../images';
import ImageDrop from '../components/ImageDrop';
import { Badge, Button, Card, EmptyState, Field, Input, PageHeader, Spinner, Textarea, Toggle, errorMessage, useConfirm, useToast } from '../components/ui';
import RichTextEditor, { EDITOR_HINT } from '../components/RichTextEditor';

const TABLE = 'team_members';
const EMPTY = { first_name: '', last_name: '', role_text: '', bio: '', published: true };

function MemberForm({ initial, onSave, onCancel, toast }) {
  const [form, setForm] = useState(initial);
  const [photo, setPhoto] = useState(null); // { file, preview }
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e?.target ? e.target.value : e }));

  const choosePhoto = async ([file]) => {
    try {
      const webp = await toWebp(file, SIZES.photo);
      setPhoto({ file: webp, preview: previewUrl(webp) });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return toast.error('Please enter first and last name.');
    setBusy(true);
    try {
      await onSave(form, photo?.file);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 border-t border-icp-mist/50 bg-[#faf9f7] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name *"><Input value={form.first_name} onChange={set('first_name')} /></Field>
        <Field label="Last name *"><Input value={form.last_name} onChange={set('last_name')} /></Field>
      </div>
      <Field label="Role" hint="One line per row, e.g. Founder / & / Design Director — shown under the photo exactly as typed.">
        <Textarea rows={3} value={form.role_text} onChange={set('role_text')} placeholder={'Founder\n&\nDesign Director'} />
      </Field>
      <Field as="div" label="Write-up" hint={`Shown in the slide-out panel when a visitor hovers the photo. ${EDITOR_HINT}`}>
        <RichTextEditor value={form.bio} onChange={(bio) => setForm((f) => ({ ...f, bio }))} minHeight={260} />
      </Field>
      <div className="flex items-start gap-4">
        <div className="h-28 w-20 shrink-0 overflow-hidden rounded bg-[#efece8]">
          {(photo?.preview || initial.photo_path) && <img src={photo?.preview ?? api.mediaUrl(initial.photo_path, initial.updated_at)} alt="" className="h-full w-full object-cover object-top" />}
        </div>
        <div className="flex-1">
          <ImageDrop multiple={false} accept={ACCEPT_PHOTOS} compact label="Choose a photo" hint="Portrait, black & white matches the site" onFiles={choosePhoto} />
        </div>
      </div>
      <Toggle checked={form.published} onChange={set('published')} label={form.published ? 'Shown on the website' : 'Hidden'} />
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
      </div>
    </form>
  );
}

export default function TeamPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [editing, setEditing] = useState(null); // 'new' | id

  const load = () => api.listRows(TABLE).then(setRows).catch((e) => toast.error(errorMessage(e)));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toRow = (form) => ({
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    role_lines: form.role_text.split('\n').map((s) => s.trim()).filter(Boolean),
    bio: form.bio.trim() || null,
    published: form.published,
  });

  const save = async (form, file, existing) => {
    try {
      let row = existing;
      if (!row) row = await api.insertRow(TABLE, { ...toRow(form), sort_order: (rows?.length ?? 0) + 1 });
      else row = await api.updateRow(TABLE, row.id, toRow(form));
      if (file) {
        const path = await api.uploadMedia(`team/${row.id}.webp`, file);
        await api.updateRow(TABLE, row.id, { photo_path: `${path}` });
      }
      toast.success('Saved.');
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (row) => {
    if (!(await confirm({ title: `Remove ${row.first_name} ${row.last_name}?`, confirmLabel: 'Remove', danger: true }))) return;
    try {
      if (row.photo_path) await api.removeMedia([row.photo_path]);
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

  const formFor = (row) => (row ? { first_name: row.first_name, last_name: row.last_name, role_text: (row.role_lines ?? []).join('\n'), bio: row.bio ?? '', published: row.published, photo_path: row.photo_path, updated_at: row.updated_at } : EMPTY);

  return (
    <>
      <PageHeader title="Team" description="The people shown on the About Us page, in this order." actions={<Button variant="primary" onClick={() => setEditing('new')}>+ Add member</Button>} />
      {editing === 'new' && (
        <Card className="mb-6 overflow-hidden">
          <p className="px-5 pt-4 text-[15px] font-medium">New team member</p>
          <MemberForm initial={EMPTY} toast={toast} onSave={(f, file) => save(f, file, null)} onCancel={() => setEditing(null)} />
        </Card>
      )}
      {!rows ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : rows.length === 0 ? (
        <EmptyState title="No team members yet" action={<Button variant="primary" onClick={() => setEditing('new')}>+ Add member</Button>} />
      ) : (
        <Card>
          <ul className="divide-y divide-icp-mist/50">
            {rows.map((r, i) => (
              <li key={r.id}>
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded bg-[#efece8]">
                    {r.photo_path && <img src={api.mediaUrl(r.photo_path, r.updated_at)} alt="" className="h-full w-full object-cover object-top" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-medium">{r.first_name} <span className="uppercase">{r.last_name}</span></p>
                    <p className="text-[13px] text-icp-slate/60">{(r.role_lines ?? []).join(' ')}</p>
                  </div>
                  <Badge tone={r.published ? 'green' : 'amber'}>{r.published ? 'Shown' : 'Hidden'}</Badge>
                  <div className="hidden gap-1 sm:flex">
                    <Button size="sm" variant="ghost" onClick={() => move(i, -1)}>↑</Button>
                    <Button size="sm" variant="ghost" onClick={() => move(i, 1)}>↓</Button>
                  </div>
                  <Button size="sm" onClick={() => setEditing(editing === r.id ? null : r.id)}>{editing === r.id ? 'Close' : 'Edit'}</Button>
                  <Button size="sm" variant="ghost" className="text-red-700" onClick={() => remove(r)}>Remove</Button>
                </div>
                {editing === r.id && <MemberForm initial={formFor(r)} toast={toast} onSave={(f, file) => save(f, file, r)} onCancel={() => setEditing(null)} />}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
