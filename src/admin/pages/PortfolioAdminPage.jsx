import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as api from '../api';
import { ACCEPT_PHOTOS, extensionOf, prepareProjectPhoto, previewUrl } from '../images';
import ImageDrop from '../components/ImageDrop';
import RichTextEditor, { EDITOR_HINT } from '../components/RichTextEditor';
import { Button, Card, EmptyState, Field, Input, PageHeader, Spinner, errorMessage, useConfirm, useToast } from '../components/ui';
import { slugify } from '../../lib/slugify';

/**
 * The website's Portfolio page: one column per category, left to right in
 * this order, each with its name, its photo and the introduction that opens
 * on the category's own page. Projects live under Projects; this is where
 * the categories themselves are added, renamed, re-photographed and ordered.
 *
 * A category's link name (/portfolio/hospitality) is fixed once it exists:
 * project addresses and stored photos are filed under it.
 */

const PHOTO_HINT = 'A tall photo: each column is about 1 : 3, e.g. 570 × 1800 px. Shown whole height, trimmed at the sides on narrow screens.';

function CategoryForm({ initial, isNew, existingSlugs, onSave, onCancel, toast }) {
  const [label, setLabel] = useState(initial.label ?? '');
  const [description, setDescription] = useState(initial.description ?? '');
  const [photo, setPhoto] = useState(null); // { file, preview }
  const [busy, setBusy] = useState(false);
  const slug = isNew ? slugify(label) : initial.slug;

  const choose = async ([file]) => {
    try {
      const prepared = await prepareProjectPhoto(file);
      setPhoto({ file: prepared, preview: previewUrl(prepared) });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!label.trim()) return toast.error('Please enter the category name.');
    if (isNew && !slug) return toast.error('The name needs at least one letter or number.');
    if (isNew && existingSlugs.includes(slug)) return toast.error(`There is already a category at /portfolio/${slug}.`);
    setBusy(true);
    try {
      await onSave({ slug, label: label.trim(), description: description.trim() || null }, photo?.file);
    } finally {
      setBusy(false);
    }
  };

  const shown = photo?.preview ?? (initial.image_path ? api.mediaUrl(initial.image_path) : null);

  return (
    <form onSubmit={submit} className="space-y-5 border-t border-icp-mist/50 bg-[#faf9f7] p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name on the website *">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Architecture" autoFocus={isNew} />
        </Field>
        <Field label="Link" hint={isNew ? 'Made from the name; fixed once saved.' : 'Fixed: project addresses use it.'}>
          <Input value={`/portfolio/${slug || '…'}`} disabled />
        </Field>
      </div>

      <div className="flex items-start gap-4">
        <div className="h-48 w-16 shrink-0 overflow-hidden rounded bg-icp-taupe">
          {shown && <img src={shown} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="flex-1">
          <ImageDrop multiple={false} accept={ACCEPT_PHOTOS} compact label={shown ? 'Replace the column photo' : 'Choose the column photo'} hint={PHOTO_HINT} onFiles={choose} />
        </div>
      </div>

      <Field as="div" label="Introduction" hint={`Shown in the red panel on the category's page, beside its projects. ${EDITOR_HINT}`}>
        <RichTextEditor value={description} onChange={setDescription} minHeight={200} />
      </Field>

      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} disabled={busy}>Cancel</Button>
        <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Add category' : 'Save'}</Button>
      </div>
    </form>
  );
}

function CategoryRow({ category: c, position, counts, editing, onEdit, onRemove, children }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: c.slug });
  const n = counts[c.slug] ?? { projects: 0, clients: 0 };
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`relative bg-white ${isDragging ? 'z-10 shadow-lg ring-1 ring-icp-red/30' : ''}`}>
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          title="Drag to change the order"
          aria-label={`Move ${c.label}`}
          className="-ml-1 flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[18px] leading-none text-icp-slate/40 hover:bg-[#f0edea] hover:text-icp-slate active:cursor-grabbing"
        >
          ⋮⋮
        </button>
        <span className="w-5 shrink-0 text-right text-[13px] tabular-nums text-icp-slate/50">{position}</span>
        <div className="h-20 w-7 shrink-0 overflow-hidden rounded bg-icp-taupe">
          {c.image_path && <img src={api.mediaUrl(c.image_path)} alt="" className="h-full w-full object-cover" draggable={false} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium text-icp-slate">{c.label}</p>
          <p className="mt-0.5 text-[13px] text-icp-slate/60">
            /portfolio/{c.slug} · <Link to={`/admin/projects?category=${c.slug}`} className="hover:underline">{n.projects} project{n.projects === 1 ? '' : 's'}</Link>
            {!c.image_path && <span className="text-amber-700"> · no photo yet</span>}
          </p>
        </div>
        <Button size="sm" onClick={onEdit}>{editing ? 'Close' : 'Edit'}</Button>
        <Button size="sm" variant="ghost" className="text-red-700" onClick={onRemove}>Delete</Button>
      </div>
      {children}
    </li>
  );
}

export default function PortfolioAdminPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const [categories, setCategories] = useState(null);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [editing, setEditing] = useState(null); // 'new' | slug
  const [savingOrder, setSavingOrder] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = () =>
    Promise.all([api.listCategories(), api.listProjects(), api.listRows('clients')])
      .then(([c, p, cl]) => {
        setCategories(c);
        setProjects(p);
        setClients(cl);
      })
      .catch((e) => toast.error(errorMessage(e)));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const counts = useMemo(() => {
    const out = {};
    for (const p of projects) (out[p.category_slug] ??= { projects: 0, clients: 0 }).projects += 1;
    for (const c of clients) (out[c.category_slug] ??= { projects: 0, clients: 0 }).clients += 1;
    return out;
  }, [projects, clients]);

  // A new photo is filed under the category with a fresh name, so no browser
  // or CDN keeps showing the old one; the old file is then removed.
  const uploadPhoto = async (slug, file, oldPath) => {
    const path = await api.uploadMedia(`categories/${slug}-${api.shortId()}.${extensionOf(file)}`, file);
    await api.updateCategory(slug, { image_path: path });
    if (oldPath && oldPath !== path && !oldPath.startsWith('/')) await api.removeMedia([oldPath]).catch(() => {});
  };

  const save = async (fields, file, existing) => {
    try {
      if (existing) {
        await api.updateCategory(existing.slug, { label: fields.label, description: fields.description });
        if (file) await uploadPhoto(existing.slug, file, existing.image_path);
      } else {
        await api.createCategory({ ...fields, sort_order: (categories?.length ?? 0) + 1 });
        if (file) await uploadPhoto(fields.slug, file, null);
      }
      toast.success(existing ? 'Saved — the website shows it now.' : `"${fields.label}" added — it is on the Portfolio page now.`);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (c) => {
    const n = counts[c.slug] ?? { projects: 0, clients: 0 };
    if (n.projects || n.clients) {
      const parts = [n.projects && `${n.projects} project${n.projects === 1 ? '' : 's'}`, n.clients && `${n.clients} client${n.clients === 1 ? '' : 's'}`].filter(Boolean).join(' and ');
      toast.error(`"${c.label}" still has ${parts}. Move them to another category or delete them first.`);
      return;
    }
    const ok = await confirm({ title: `Delete "${c.label}"?`, message: 'Its column and photo are removed from the Portfolio page. This cannot be undone.', confirmLabel: 'Delete category', danger: true });
    if (!ok) return;
    try {
      await api.deleteCategory(c.slug);
      if (c.image_path && !c.image_path.startsWith('/')) await api.removeMedia([c.image_path]).catch(() => {});
      toast.success('Category deleted.');
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = categories.findIndex((c) => c.slug === active.id);
    const to = categories.findIndex((c) => c.slug === over.id);
    const ordered = arrayMove(categories, from, to).map((c, i) => ({ ...c, sort_order: i + 1 }));
    setCategories(ordered);
    setSavingOrder(true);
    try {
      await api.reorderCategories(ordered.map((c) => c.slug));
      toast.success('Order saved — the Portfolio page shows them in this order.');
    } catch (e) {
      toast.error(errorMessage(e));
      await load();
    } finally {
      setSavingOrder(false);
    }
  };

  if (!categories) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="The columns on the website's Portfolio page, left to right in this order: each one's name, photo and introduction. Drag the ⋮⋮ handle to reorder; it saves when you let go."
        actions={<Button variant="primary" onClick={() => setEditing('new')}>+ New category</Button>}
      />

      {editing === 'new' && (
        <Card className="mb-6 overflow-hidden">
          <p className="px-5 pt-4 text-[15px] font-medium">New category</p>
          <CategoryForm isNew initial={{}} existingSlugs={categories.map((c) => c.slug)} toast={toast} onSave={(f, file) => save(f, file, null)} onCancel={() => setEditing(null)} />
        </Card>
      )}

      {categories.length === 0 ? (
        <EmptyState title="No categories yet" action={<Button variant="primary" onClick={() => setEditing('new')}>+ New category</Button>} />
      ) : (
        <Card className="overflow-hidden">
          <DndContext sensors={savingOrder ? [] : sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={categories.map((c) => c.slug)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-icp-mist/50">
                {categories.map((c, i) => (
                  <CategoryRow
                    key={c.slug}
                    category={c}
                    position={i + 1}
                    counts={counts}
                    editing={editing === c.slug}
                    onEdit={() => setEditing(editing === c.slug ? null : c.slug)}
                    onRemove={() => remove(c)}
                  >
                    {editing === c.slug && (
                      <CategoryForm initial={c} existingSlugs={[]} toast={toast} onSave={(f, file) => save(f, file, c)} onCancel={() => setEditing(null)} />
                    )}
                  </CategoryRow>
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </Card>
      )}
    </>
  );
}
