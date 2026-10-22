import { useEffect, useState } from 'react';
import * as api from '../api';
import { ACCEPT_PHOTOS, extensionOf, prepareProjectPhoto, previewUrl } from '../images';
import ImageDrop from './ImageDrop';
import { Button, Card, Spinner, errorMessage, useConfirm } from './ui';
import { HOME_DEFAULT } from '../../data/site';

const KEY = 'home';

/**
 * The photograph behind the home page (and the notice phones get). Saved as
 * the `home` setting; stored exactly as uploaded, under a fresh name so no
 * browser or CDN keeps showing the old one. The preview carries the same dark
 * wash the home page lays over it, so the studio sees it as visitors will.
 */
export default function HomePhotoCard({ toast }) {
  const confirm = useConfirm();
  const [saved, setSaved] = useState(undefined); // undefined while loading
  const [chosen, setChosen] = useState(null); // { file, preview }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getSetting(KEY)
      .then((value) => setSaved(value ?? null))
      .catch((e) => toast.error(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const custom = saved?.imagePath ?? null;
  const current = custom ? api.mediaUrl(custom, saved.updatedAt) : HOME_DEFAULT.image;
  const shown = chosen?.preview ?? current;

  const choose = async ([file]) => {
    try {
      const prepared = await prepareProjectPhoto(file);
      setChosen({ file: prepared, preview: previewUrl(prepared) });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const store = async (imagePath) => {
    const value = { imagePath, updatedAt: new Date().toISOString() };
    await api.setSetting(KEY, value);
    // The photo it replaced, if it was one the studio had uploaded.
    if (custom && custom !== imagePath) await api.removeMedia([custom]).catch(() => {});
    setSaved(value);
    setChosen(null);
  };

  const save = async () => {
    setBusy(true);
    try {
      const path = await api.uploadMedia(`home/cover-${api.shortId()}.${extensionOf(chosen.file)}`, chosen.file);
      await store(path);
      toast.success('Saved — the home page shows the new photo now.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!(await confirm({ title: 'Go back to the original photo?', message: 'The photo you uploaded is removed and the home page shows the original again.', confirmLabel: 'Use the original' }))) return;
    setBusy(true);
    try {
      await store(null);
      toast.success('The home page shows the original photo again.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (saved === undefined) {
    return (
      <Card className="mb-6 flex justify-center p-10">
        <Spinner />
      </Card>
    );
  }

  return (
    <Card className="mb-6 space-y-4 p-6">
      <div>
        <h2 className="text-[16px] font-semibold">Home page photo</h2>
        <p className="mt-1 text-[13px] text-icp-slate/60">
          The full-screen photograph behind the home page{custom ? '' : ' (currently the original)'}. It sits under a dark wash so the menu and the iC+P logo stay readable, as in the preview.
        </p>
      </div>

      <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-md bg-icp-slate">
        <img src={shown} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-icp-slate/55" />
        {chosen && <span className="absolute left-3 top-3 rounded bg-amber-500 px-2 py-0.5 text-[12px] text-white">Not saved yet</span>}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-80">
          <ImageDrop multiple={false} accept={ACCEPT_PHOTOS} compact label="Replace the home page photo" hint="Landscape, at least 1920 × 1080 px (2560 × 1440 is ideal)" onFiles={choose} />
        </div>
        {chosen && <Button onClick={() => setChosen(null)} disabled={busy}>Cancel</Button>}
        {custom && !chosen && <Button onClick={restore} disabled={busy}>Use the original photo</Button>}
        <div className="flex-1" />
        <Button variant="primary" onClick={save} disabled={!chosen || busy}>{busy ? 'Saving…' : 'Save photo'}</Button>
      </div>
    </Card>
  );
}
