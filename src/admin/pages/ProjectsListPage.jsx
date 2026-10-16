import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as api from '../api';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner, Toggle, errorMessage, useConfirm, useToast } from '../components/ui';

// One project in its category's list. The grip on the left picks it up —
// drag it up or down, or focus it and use Space and the arrow keys — and the
// rest of the row keeps working as links and buttons.
function ProjectRow({ project: p, position, first, last, locked, onMove, onToggle, onRemove }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: p.id, disabled: locked });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`relative flex items-center gap-4 bg-white px-4 py-3 ${isDragging ? 'z-10 shadow-lg ring-1 ring-icp-red/30' : ''}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        title="Drag to change the order"
        aria-label={`Move ${p.name}`}
        className="-ml-1 flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-[18px] leading-none text-icp-slate/40 hover:bg-[#f0edea] hover:text-icp-slate active:cursor-grabbing"
      >
        ⋮⋮
      </button>
      <span className="w-5 shrink-0 text-right text-[13px] tabular-nums text-icp-slate/50">{position}</span>
      <Link to={`/admin/projects/${p.id}`} className="h-16 w-20 shrink-0 overflow-hidden rounded bg-[#efece8]">
        {p.thumbnail_path && <img src={api.mediaUrl(p.thumbnail_path, p.updated_at)} alt="" className="h-full w-full object-cover" draggable={false} />}
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/admin/projects/${p.id}`} className="block truncate text-[15px] font-medium text-icp-slate hover:underline">
          {p.name}
        </Link>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-icp-slate/60">
          {[p.location, p.client, p.typology, p.year].filter(Boolean).map((t, j) => (
            <span key={j}>{t} ·</span>
          ))}
          <span>{p.project_images?.length ?? 0} photos</span>
        </p>
      </div>
      <div className="hidden items-center gap-1 sm:flex">
        <Button size="sm" variant="ghost" onClick={() => onMove(p, -1)} title="Move up one" disabled={first || locked}>↑</Button>
        <Button size="sm" variant="ghost" onClick={() => onMove(p, 1)} title="Move down one" disabled={last || locked}>↓</Button>
      </div>
      <div className="flex items-center gap-3">
        <Badge tone={p.published ? 'green' : 'amber'}>{p.published ? 'Live' : 'Draft'}</Badge>
        <Toggle checked={p.published} onChange={(v) => onToggle(p, v)} />
      </div>
      <Button size="sm" variant="ghost" onClick={() => onRemove(p)} className="text-red-700">
        Delete
      </Button>
    </li>
  );
}

/**
 * Projects are reached through their category: first the categories, each
 * with how many projects it holds, then that category's projects in the order
 * the website shows them. The category lives in the address
 * (?category=hospitality), so a project's Save and Cancel come back to it and
 * the browser's Back button steps out to the categories.
 */
export default function ProjectsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [projects, setProjects] = useState(null);
  const [categories, setCategories] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const load = () =>
    Promise.all([api.listProjects(), api.listCategories()])
      .then(([p, c]) => {
        setProjects(p);
        setCategories(c);
      })
      .catch((e) => toast.error(errorMessage(e)));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const category = (categories ?? []).find((c) => c.slug === params.get('category')) ?? null;
  const counts = useMemo(() => {
    const out = {};
    for (const p of projects ?? []) {
      out[p.category_slug] ??= { live: 0, draft: 0 };
      out[p.category_slug][p.published ? 'live' : 'draft'] += 1;
    }
    return out;
  }, [projects]);

  const togglePublished = async (project, published) => {
    try {
      await api.updateProject(project.id, { published });
      setProjects((list) => list.map((p) => (p.id === project.id ? { ...p, published } : p)));
      toast.success(published ? `"${project.name}" is now live on the website.` : `"${project.name}" hidden from the website.`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // A category's projects in a new order: shown at once, then saved as their
  // sort_order, which is the order the website lists them in.
  const saveOrder = async (ordered) => {
    const slug = ordered[0]?.category_slug;
    const renumbered = ordered.map((p, i) => ({ ...p, sort_order: i + 1 }));
    setProjects((all) => [...all.filter((p) => p.category_slug !== slug), ...renumbered]);
    setSavingOrder(true);
    try {
      await api.reorderProjects(renumbered.map((p) => p.id));
      toast.success('Order saved — the website now shows them in this order.');
    } catch (e) {
      toast.error(errorMessage(e));
      await load();
    } finally {
      setSavingOrder(false);
    }
  };

  const siblingsOf = (slug) => (projects ?? []).filter((p) => p.category_slug === slug);

  const move = (project, dir) => {
    const siblings = siblingsOf(project.category_slug);
    const i = siblings.findIndex((p) => p.id === project.id);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    saveOrder(arrayMove(siblings, i, j));
  };

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const siblings = siblingsOf(category.slug);
    saveOrder(arrayMove(siblings, siblings.findIndex((p) => p.id === active.id), siblings.findIndex((p) => p.id === over.id)));
  };

  const remove = async (project) => {
    const ok = await confirm({
      title: `Delete "${project.name}"?`,
      message: 'The project and all its photos will be permanently removed from the website. This cannot be undone.',
      confirmLabel: 'Delete project',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteProject(project);
      setProjects((list) => list.filter((p) => p.id !== project.id));
      toast.success('Project deleted.');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!projects || !categories) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  // --- step 1: the categories ------------------------------------------------
  if (!category) {
    return (
      <>
        <PageHeader title="Projects" description="Choose a category to see, add and arrange its projects." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const n = counts[c.slug] ?? { live: 0, draft: 0 };
            return (
              <button
                key={c.slug}
                type="button"
                onClick={() => setParams({ category: c.slug })}
                className="group flex items-center gap-4 rounded-lg border border-icp-mist/70 bg-white p-3 text-left transition hover:border-icp-red hover:shadow-sm"
              >
                <div className="h-24 w-16 shrink-0 overflow-hidden rounded bg-[#efece8]">
                  {c.image_path && <img src={api.mediaUrl(c.image_path)} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-medium text-icp-slate group-hover:text-icp-red">{c.label}</p>
                  <p className="mt-1 text-[13px] text-icp-slate/60">
                    {n.live} live{n.draft ? ` · ${n.draft} draft${n.draft > 1 ? 's' : ''}` : ''}
                  </p>
                </div>
                <span className="text-[20px] text-icp-slate/40 group-hover:text-icp-red" aria-hidden="true">›</span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  // --- step 2: one category's projects ---------------------------------------
  const visible = projects.filter((p) => p.category_slug === category.slug);
  const newProject = () => navigate(`/admin/projects/new?category=${category.slug}`);

  return (
    <>
      <button
        type="button"
        onClick={() => setParams({})}
        className="mb-3 text-[14px] text-icp-slate/70 hover:text-icp-red"
      >
        ← All categories
      </button>
      <PageHeader
        title={category.label}
        description="In the order the website shows them, five to a page; drafts are skipped. Drag the ⋮⋮ handle to change the order — it saves as soon as you let go."
        actions={
          <Button variant="primary" onClick={newProject}>
            + New project
          </Button>
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          title={`No ${category.label} projects yet`}
          description="Add the first one — it takes about a minute."
          action={<Button variant="primary" onClick={newProject}>+ New project</Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={visible.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <ul className="divide-y divide-icp-mist/50">
                {visible.map((p, i) => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    position={i + 1}
                    first={i === 0}
                    last={i === visible.length - 1}
                    locked={savingOrder}
                    onMove={move}
                    onToggle={togglePublished}
                    onRemove={remove}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </Card>
      )}
    </>
  );
}
