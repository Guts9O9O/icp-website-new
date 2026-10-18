import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { slugify } from '../../lib/slugify';
import * as api from '../api';
import { ACCEPT_PHOTOS, MAX_UPLOAD_MB, SIZES, extensionOf, prepareProjectPhoto, previewUrl, thumbnailFromUrl, toWebp } from '../images';
import ImageDrop from '../components/ImageDrop';
import SortableGallery from '../components/SortableGallery';
import RichTextEditor, { EDITOR_HINT } from '../components/RichTextEditor';
import { Button, Card, Field, Input, PageHeader, Select, Spinner, Toggle, errorMessage, useConfirm, useToast } from '../components/ui';

const EMPTY = { name: '', slug: '', category_slug: 'hospitality', location: '', client: '', typology: '', area_sqft: '', year: '', description: '', published: false };

// Back to the category the project belongs to, which is where the studio came from.
const listOf = (category) => (category ? `/admin/projects?category=${category}` : '/admin/projects');

export default function ProjectEditPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const toast = useToast();
  const confirm = useConfirm();

  const [categories, setCategories] = useState([]);
  const [project, setProject] = useState(null); // existing row
  // A new project starts in the category it was added from.
  const [form, setForm] = useState(() => ({ ...EMPTY, category_slug: params.get('category') || EMPTY.category_slug }));
  const [typologies, setTypologies] = useState([]); // earlier entries, offered as suggestions
  const [slugTouched, setSlugTouched] = useState(false);
  const [thumb, setThumb] = useState(null); // { path } | { file, preview } | { copyFrom, preview }
  const [gallery, setGallery] = useState([]); // [{ key, path?, file?, preview, pending }]
  const [removed, setRemoved] = useState([]); // storage paths to delete on save
  const [loading, setLoading] = useState(!isNew);
  const [preparing, setPreparing] = useState(0);
  const [saving, setSaving] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    api.listCategories().then(setCategories).catch((e) => toast.error(errorMessage(e)));
    api
      .listProjects()
      .then((rows) => setTypologies([...new Set(rows.map((r) => r.typology?.trim()).filter(Boolean))].sort()))
      .catch(() => {});
    if (isNew) return;
    api
      .getProject(id)
      .then((p) => {
        if (!p) {
          toast.error('Project not found.');
          navigate('/admin/projects', { replace: true });
          return;
        }
        setProject(p);
        setForm({
          name: p.name,
          slug: p.slug,
          category_slug: p.category_slug,
          location: p.location ?? '',
          client: p.client ?? '',
          typology: p.typology ?? '',
          year: p.year ?? '',
          area_sqft: p.area_sqft ?? '',
          description: p.description ?? '',
          published: p.published,
        });
        setSlugTouched(true);
        setThumb(p.thumbnail_path ? { path: p.thumbnail_path, preview: api.mediaUrl(p.thumbnail_path, p.updated_at) } : null);
        setGallery(
          [...p.project_images]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((img) => ({ key: img.id, path: img.path, preview: api.mediaUrl(img.path) }))
        );
        setLoading(false);
      })
      .catch((e) => toast.error(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return undefined;
    const onUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [dirty]);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setDirty(true);
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'name' && !slugTouched) next.slug = slugify(value);
      return next;
    });
  };

  const addPhotos = async (files) => {
    setDirty(true);
    setPreparing((n) => n + files.length);
    for (const file of files) {
      try {
        const photo = await prepareProjectPhoto(file);
        setGallery((g) => [...g, { key: api.shortId(), file: photo, preview: previewUrl(photo), pending: true }]);
      } catch (e) {
        toast.error(`Could not read ${file.name}: ${errorMessage(e)}`);
      } finally {
        setPreparing((n) => n - 1);
      }
    }
  };

  const setThumbFromFile = async (file) => {
    setDirty(true);
    try {
      const webp = await toWebp(file, SIZES.thumbnail);
      setThumb({ file: webp, preview: previewUrl(webp) });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const makeThumb = async (item) => {
    if (item.file) return setThumbFromFile(item.file);
    setDirty(true);
    setThumb({ copyFrom: item.path, preview: item.preview });
  };

  const removeImage = (item) => {
    setDirty(true);
    setGallery((g) => g.filter((i) => i.key !== item.key));
    if (item.path) setRemoved((r) => [...r, item.path]);
  };

  const thumbKey = useMemo(() => {
    if (!thumb) return null;
    if (thumb.copyFrom) return gallery.find((g) => g.path === thumb.copyFrom)?.key ?? null;
    return null;
  }, [thumb, gallery]);

  const validate = () => {
    if (!form.name.trim()) return 'Please enter the project name.';
    if (!form.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) return 'Link name can only contain lowercase letters, numbers and hyphens.';
    if (!form.category_slug) return 'Please choose a category.';
    if (form.area_sqft !== '' && !(Number(form.area_sqft) >= 0)) return 'Area must be a number.';
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) return toast.error(problem);
    if (preparing) return toast.error('Photos are still being prepared — one moment.');

    setSaving('Saving…');
    try {
      const fields = {
        name: form.name.trim(),
        slug: form.slug,
        category_slug: form.category_slug,
        location: form.location.trim() || null,
        client: form.client.trim() || null,
        typology: form.typology.trim() || null,
        area_sqft: form.area_sqft === '' ? null : Number(form.area_sqft),
        year: form.year.trim() || null,
        description: form.description.trim() || null,
        published: form.published,
      };
      const folder = api.projectFolder(fields.category_slug, fields.slug);

      // 1. The row (needed first for a new project's id)
      let row = project;
      if (isNew) {
        row = await api.createProject({ ...fields, sort_order: await api.nextProjectOrder(fields.category_slug) });
      }

      // 2. Folder changed (category or link name edited) -> move existing files
      let items = gallery;
      let thumbState = thumb;
      const oldFolder = project ? api.projectFolder(project.category_slug, project.slug) : folder;
      if (oldFolder !== folder) {
        setSaving('Moving photos…');
        items = await Promise.all(
          items.map(async (img) => (img.path ? { ...img, path: await api.moveMedia(img.path, img.path.replace(oldFolder, folder)) } : img))
        );
        if (thumbState?.path) thumbState = { ...thumbState, path: await api.moveMedia(thumbState.path, thumbState.path.replace(oldFolder, folder)) };
        if (thumbState?.copyFrom) thumbState = { ...thumbState, copyFrom: thumbState.copyFrom.replace(oldFolder, folder) };
      }

      // 3. New gallery photos
      const uploaded = [];
      for (const [i, img] of items.entries()) {
        if (img.file) {
          setSaving(`Uploading photo ${i + 1} of ${items.length}…`);
          uploaded.push({ ...img, path: await api.uploadMedia(`${folder}/gallery/${api.shortId()}.${extensionOf(img.file)}`, img.file), file: undefined, pending: false });
        } else {
          uploaded.push(img);
        }
      }

      // 4. Thumbnail (defaults to the first gallery photo)
      const thumbPath = `${folder}/thumb.webp`;
      let thumbnail_path = null;
      if (!thumbState && uploaded.length) thumbState = { copyFrom: uploaded[0].path };
      if (thumbState?.file) {
        setSaving('Uploading thumbnail…');
        thumbnail_path = await api.uploadMedia(thumbPath, thumbState.file);
      } else if (thumbState?.copyFrom) {
        // Made from the gallery photo rather than a copy of it: the photo is
        // the full-size original, and the listing only needs a preview.
        setSaving('Setting thumbnail…');
        thumbnail_path = await api.uploadMedia(thumbPath, await thumbnailFromUrl(api.mediaUrl(thumbState.copyFrom)));
      } else if (thumbState?.path) {
        thumbnail_path = thumbState.path;
      } else if (project?.thumbnail_path) {
        await api.removeMedia([project.thumbnail_path]).catch(() => {});
      }

      // 5. Deleted photos, then the rows
      if (removed.length) await api.removeMedia(removed);
      setSaving('Finishing…');
      await api.setProjectImages(row.id, uploaded.map((i) => ({ path: i.path })));
      await api.updateProject(row.id, { ...fields, thumbnail_path });

      setDirty(false);
      toast.success(fields.published ? 'Saved — the project is live on the website.' : 'Saved as a draft (not visible on the website yet).');
      navigate(listOf(fields.category_slug));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving('');
    }
  };

  const cancel = async () => {
    if (dirty && !(await confirm({ title: 'Discard changes?', message: 'Your unsaved edits will be lost.', confirmLabel: 'Discard', danger: true }))) return;
    setDirty(false);
    navigate(listOf(project?.category_slug ?? form.category_slug));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const siteUrl = `/portfolio/${form.category_slug}/${form.slug || '…'}`;
  const bespoke = form.category_slug === 'bespoke-elements';

  return (
    <>
      <PageHeader
        title={isNew ? 'New project' : form.name || 'Edit project'}
        description={isNew ? 'Fill in the details, add photos, then save.' : undefined}
        actions={
          <>
            <Button onClick={cancel} disabled={!!saving}>Cancel</Button>
            <Button variant="primary" onClick={save} disabled={!!saving || preparing > 0}>
              {saving || (preparing ? 'Preparing photos…' : 'Save')}
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card className="space-y-5 p-6">
          <Field label="Category *">
            <Select value={form.category_slug} onChange={set('category_slug')}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          {/* The project's details in the order the website reads them:
              name, location, client, typology, area, year. */}
          <Field label="Project name *">
            <Input value={form.name} onChange={set('name')} placeholder="e.g. Rivalli Park" autoFocus={isNew} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={set('location')} placeholder="e.g. Mumbai, Maharashtra" />
          </Field>
          <Field label="Client">
            <Input value={form.client} onChange={set('client')} placeholder="e.g. CCI Projects" />
          </Field>
          <Field label="Typology" hint="The kind of space, e.g. Sales gallery, Clubhouse, Restaurant.">
            <Input value={form.typology} onChange={set('typology')} list="typology-suggestions" placeholder="e.g. Clubhouse" />
            <datalist id="typology-suggestions">
              {typologies.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area (sq. ft)">
              <Input type="number" min="0" inputMode="numeric" value={form.area_sqft} onChange={set('area_sqft')} placeholder="e.g. 4500" />
            </Field>
            <Field label="Project year">
              <Input value={form.year} onChange={set('year')} placeholder="e.g. 2024" />
            </Field>
          </div>

          <Field as="div" label="Description" hint={`Shown in the red panel on the project page, under the details. ${EDITOR_HINT}`}>
            <RichTextEditor value={form.description} onChange={set('description')} minHeight={180} />
          </Field>

          <Field label="Link name" hint={`Website address: ${siteUrl}`}>
            <Input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug')(slugify(e.target.value).replace(/-$/, '') || e.target.value.toLowerCase());
              }}
              placeholder="auto-generated from the name"
            />
          </Field>

          <div className="rounded-md bg-[#f7f5f2] p-4">
            <Toggle checked={form.published} onChange={set('published')} label={form.published ? 'Published — visible on the website' : 'Draft — hidden from the website'} />
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-1 text-[16px] font-semibold">Thumbnail</h2>
            <p className="mb-4 text-[13px] text-icp-slate/60">The small image shown in the project list. If you skip this, the first gallery photo is used.</p>
            <div className="flex items-start gap-4">
              <div className="h-32 w-24 shrink-0 overflow-hidden rounded bg-[#efece8]">
                {thumb?.preview && <img src={thumb.preview} alt="" className="h-full w-full object-cover object-top" />}
              </div>
              <div className="flex-1 space-y-2">
                <ImageDrop multiple={false} accept={ACCEPT_PHOTOS} compact label="Choose a thumbnail" hint="Portrait photos work best" onFiles={([f]) => setThumbFromFile(f)} />
                {thumb && (
                  <Button size="sm" variant="ghost" onClick={() => { setDirty(true); setThumb(null); }}>
                    Remove thumbnail
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
<h2 className="mb-1 text-[16px] font-semibold">Gallery photos</h2>
            {bespoke && (
              // Bespoke Elements shows its photos three at a time (R5 p6).
              <div className="mb-4 flex items-start gap-4 rounded-md bg-[#f7f5f2] p-3">
                <div className="grid h-16 w-24 shrink-0 gap-px border border-icp-mist bg-icp-mist text-[10px] text-icp-slate/70" style={{ gridTemplateColumns: '43fr 57fr', gridTemplateRows: '1fr 1fr' }}>
                  <span className="flex items-center justify-center bg-white">1</span>
                  <span className="col-start-2 row-span-2 row-start-1 flex items-center justify-center bg-white">3</span>
                  <span className="flex items-center justify-center bg-white">2</span>
                </div>
                <p className="text-[13px] text-icp-slate/70">
                  Bespoke Elements shows photos <b>three at a time</b>: 1 top left, 2 bottom left, 3 tall on the right; then the next three. Each row below is one set.
                  Photos are never cropped, so they fill their place best at about <b>3:2 landscape</b> (1 and 2) and <b>square</b> (3).
                </p>
              </div>
            )}
            <ImageDrop accept={ACCEPT_PHOTOS} onFiles={addPhotos} hint="JPG, PNG or HEIC · several at once is fine" />
            {preparing > 0 && (
              <p className="mt-3 flex items-center gap-2 text-[13px] text-icp-slate/70">
                <Spinner /> Preparing {preparing} photo{preparing > 1 ? 's' : ''}…
              </p>
            )}
            {gallery.length > 0 && (
              <div className="mt-4">
                <SortableGallery
                  items={gallery}
                  onChange={(next) => { setDirty(true); setGallery(next); }}
                  onRemove={removeImage}
                  onMakeThumb={makeThumb}
                  thumbKey={thumbKey}
                  slots={bespoke ? ['Top left', 'Bottom left', 'Right'] : undefined}
                />
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button onClick={cancel} disabled={!!saving}>Cancel</Button>
        <Button variant="primary" size="lg" onClick={save} disabled={!!saving || preparing > 0}>
          {saving || 'Save'}
        </Button>
      </div>
    </>
  );
}
