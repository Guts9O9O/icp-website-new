import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import * as api from '../api';
import { Badge, Button, Card, EmptyState, PageHeader, Spinner, Toggle, errorMessage, useConfirm, useToast } from '../components/ui';

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

  const move = async (project, dir) => {
    const siblings = (projects ?? []).filter((p) => p.category_slug === project.category_slug);
    const i = siblings.findIndex((p) => p.id === project.id);
    const j = i + dir;
    if (j < 0 || j >= siblings.length) return;
    const reordered = [...siblings];
    [reordered[i], reordered[j]] = [reordered[j], reordered[i]];
    try {
      await api.reorderProjects(reordered.map((p) => p.id));
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
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
        description="In the order they appear on the website. Projects go live as soon as they are published."
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
        <Card>
          <ul className="divide-y divide-icp-mist/50">
            {visible.map((p, i) => (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3">
                <Link to={`/admin/projects/${p.id}`} className="h-16 w-20 shrink-0 overflow-hidden rounded bg-[#efece8]">
                  {p.thumbnail_path && <img src={api.mediaUrl(p.thumbnail_path, p.updated_at)} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/projects/${p.id}`} className="block truncate text-[15px] font-medium text-icp-slate hover:underline">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13px] text-icp-slate/60">
                    {[p.location, p.client, p.typology].filter(Boolean).map((t, j) => (
                      <span key={j}>{t} ·</span>
                    ))}
                    <span>{p.project_images?.length ?? 0} photos</span>
                  </p>
                </div>
                <div className="hidden items-center gap-1 sm:flex">
                  <Button size="sm" variant="ghost" onClick={() => move(p, -1)} title="Move up" disabled={i === 0}>↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => move(p, 1)} title="Move down" disabled={i === visible.length - 1}>↓</Button>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={p.published ? 'green' : 'amber'}>{p.published ? 'Live' : 'Draft'}</Badge>
                  <Toggle checked={p.published} onChange={(v) => togglePublished(p, v)} />
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(p)} className="text-red-700">
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
