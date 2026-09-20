import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import * as api from '../api';
import { Badge, Button, Card, EmptyState, PageHeader, Select, Spinner, Toggle, errorMessage, useConfirm, useToast } from '../components/ui';

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [projects, setProjects] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filter, setFilter] = useState('all');

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

  const label = useMemo(() => Object.fromEntries(categories.map((c) => [c.slug, c.label])), [categories]);
  const visible = (projects ?? []).filter((p) => filter === 'all' || p.category_slug === filter);

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

  return (
    <>
      <PageHeader
        title="Projects"
        description="Projects appear on the website's portfolio pages as soon as they are published."
        actions={
          <Button variant="primary" onClick={() => navigate('/admin/projects/new')}>
            + New project
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-[14px] text-icp-slate/70">Show</span>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="!h-10 w-auto">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.label}
            </option>
          ))}
        </Select>
      </div>

      {!projects ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Add your first project — it takes about a minute."
          action={<Button variant="primary" onClick={() => navigate('/admin/projects/new')}>+ New project</Button>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-icp-mist/50">
            {visible.map((p) => (
              <li key={p.id} className="flex items-center gap-4 px-4 py-3">
                <Link to={`/admin/projects/${p.id}`} className="h-16 w-20 shrink-0 overflow-hidden rounded bg-[#efece8]">
                  {p.thumbnail_path && <img src={api.mediaUrl(p.thumbnail_path, p.updated_at)} alt="" className="h-full w-full object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/admin/projects/${p.id}`} className="block truncate text-[15px] font-medium text-icp-slate hover:underline">
                    {p.name}
                  </Link>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-icp-slate/60">
                    <span>{label[p.category_slug] ?? p.category_slug}</span>
                    {p.location && <span>· {p.location}</span>}
                    <span>· {p.project_images?.length ?? 0} photos</span>
                  </p>
                </div>
                <div className="hidden items-center gap-1 sm:flex">
                  <Button size="sm" variant="ghost" onClick={() => move(p, -1)} title="Move up">↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => move(p, 1)} title="Move down">↓</Button>
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
