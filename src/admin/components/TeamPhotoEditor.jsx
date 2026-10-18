import { useEffect, useMemo, useRef, useState } from 'react';
import * as api from '../api';
import { ACCEPT_PHOTOS, extensionOf, prepareProjectPhoto, previewUrl } from '../images';
import ImageDrop from './ImageDrop';
import { Button, Card, Spinner, errorMessage } from './ui';
import { DEFAULT_TEAM_PHOTO, TEAM_LAYOUT, evenSplits, splitsFor } from '../../lib/teamPhoto';

const KEY = 'team_photo';
const PREVIEW_H = 420; // px
const MARGIN = 0.1; // a strip may start or end this far outside the photo, as a share of its width
const MIN_STRIP = 0.06;

/**
 * The About page's group photograph, and which part of it belongs to whom.
 *
 * The photo is shown at the shape the website draws it, with the red band
 * across it where the website puts it, and a line between each person. The
 * studio drags the lines until everyone stands in their own strip; that strip
 * is what lights up on the website when a visitor points at them. People are
 * matched to strips left to right in the order of the team list below.
 */
export default function TeamPhotoEditor({ members, toast }) {
  const [saved, setSaved] = useState(undefined); // undefined while loading, null when never saved
  const [photo, setPhoto] = useState(null); // { src, aspect, path?, file? }
  const [splits, setSplits] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    api
      .getSetting(KEY)
      .then((value) => {
        setSaved(value ?? null);
        const base = value?.path ? value : DEFAULT_TEAM_PHOTO;
        setPhoto({ src: api.mediaUrl(base.path, value?.updatedAt), aspect: base.aspect ?? DEFAULT_TEAM_PHOTO.aspect, path: base.path });
        setSplits(value?.splits ?? (value?.path ? null : DEFAULT_TEAM_PHOTO.splits));
      })
      .catch((e) => toast.error(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const count = members.length;
  const lines = useMemo(() => splitsFor(splits, count), [splits, count]);
  const mismatch = splits && splits.length !== count + 1;

  const choosePhoto = async ([file]) => {
    try {
      const prepared = await prepareProjectPhoto(file);
      const src = previewUrl(prepared);
      const aspect = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img.naturalWidth / img.naturalHeight);
        img.onerror = reject;
        img.src = src;
      });
      setPhoto({ src, aspect, file: prepared });
      setSplits(evenSplits(count));
      setDirty(true);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // Dragging a line: its position as a share of the photo's width, kept clear
  // of the lines either side.
  const onPointerDown = (i) => (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = i;
  };
  const onPointerMove = (e) => {
    if (drag.current === null || !boxRef.current) return;
    const i = drag.current;
    const rect = boxRef.current.getBoundingClientRect();
    const photoW = rect.width / (1 + 2 * MARGIN);
    let s = (e.clientX - rect.left) / photoW - MARGIN;
    const lo = i === 0 ? -MARGIN : lines[i - 1] + MIN_STRIP;
    const hi = i === lines.length - 1 ? 1 + MARGIN : lines[i + 1] - MIN_STRIP;
    s = Math.round(Math.min(hi, Math.max(lo, s)) * 1000) / 1000;
    setSplits(lines.map((x, j) => (j === i ? s : x)));
    setDirty(true);
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const save = async () => {
    setBusy(true);
    try {
      let path = photo.path;
      if (photo.file) path = await api.uploadMedia(`team/group-${api.shortId()}.${extensionOf(photo.file)}`, photo.file);
      await api.setSetting(KEY, { path, aspect: photo.aspect, splits: lines, updatedAt: new Date().toISOString() });
      // The photo it replaced, if it was one the studio had uploaded.
      if (saved?.path && saved.path !== path && !saved.path.startsWith('/')) await api.removeMedia([saved.path]).catch(() => {});
      setSaved({ path, aspect: photo.aspect, splits: lines });
      setPhoto((p) => ({ ...p, path, file: undefined }));
      setDirty(false);
      toast.success('Saved — the About page now uses this photo and these strips.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (saved === undefined || !photo) {
    return (
      <Card className="mb-6 flex justify-center p-10">
        <Spinner />
      </Card>
    );
  }

  const photoW = PREVIEW_H * photo.aspect;
  const boxW = photoW * (1 + 2 * MARGIN);
  const xOf = (s) => (MARGIN + s) * photoW; // px from the box's left
  const bandTop = ((TEAM_LAYOUT.bandTop - TEAM_LAYOUT.photoTop) / TEAM_LAYOUT.photoH) * PREVIEW_H;
  const bandH = (TEAM_LAYOUT.bandH / TEAM_LAYOUT.photoH) * PREVIEW_H;

  return (
    <Card className="mb-6 space-y-4 p-6">
      <div>
        <h2 className="text-[16px] font-semibold">Group photo on the About page</h2>
        <p className="mt-1 text-[13px] text-icp-slate/60">
          One photo of the whole team. Drag the lines so each person stands in their own strip — that strip lights up and opens their write-up when a visitor points at them.
          People are matched to strips left to right in the order of the list below, so keep the list in the order they stand in the photo.
        </p>
      </div>

      {count === 0 ? (
        <p className="text-[13px] text-icp-slate/70">Add a team member (shown on the website) to place them on the photo.</p>
      ) : (
        <div className="overflow-x-auto rounded-md bg-icp-paper py-4">
          <div
            ref={boxRef}
            className="relative mx-auto touch-none select-none"
            style={{ width: boxW, height: PREVIEW_H }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <img src={photo.src} alt="" className="pointer-events-none absolute top-0" style={{ left: xOf(0), width: photoW, height: PREVIEW_H }} draggable={false} />
            <div className="pointer-events-none absolute inset-x-0 bg-icp-red/75" style={{ top: bandTop, height: bandH }} />
            {members.map((m, i) => (
              <div
                key={m.id}
                className="pointer-events-none absolute flex items-center justify-center overflow-hidden px-1 text-center text-[11px] leading-tight text-white"
                style={{ left: xOf(lines[i]), width: xOf(lines[i + 1]) - xOf(lines[i]), top: bandTop, height: bandH }}
              >
                <span>
                  {m.first_name} <span className="font-semibold uppercase">{m.last_name}</span>
                </span>
              </div>
            ))}
            {lines.map((s, i) => (
              <div
                key={i}
                role="slider"
                tabIndex={0}
                aria-label={i === 0 ? `Left edge of ${members[0]?.first_name}` : i === count ? `Right edge of ${members[count - 1]?.first_name}` : `Between ${members[i - 1]?.first_name} and ${members[i]?.first_name}`}
                aria-valuenow={Math.round(s * 100)}
                onPointerDown={onPointerDown(i)}
                onKeyDown={(e) => {
                  if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
                  e.preventDefault();
                  const step = e.key === 'ArrowLeft' ? -0.005 : 0.005;
                  const lo = i === 0 ? -MARGIN : lines[i - 1] + MIN_STRIP;
                  const hi = i === lines.length - 1 ? 1 + MARGIN : lines[i + 1] - MIN_STRIP;
                  setSplits(lines.map((x, j) => (j === i ? Math.min(hi, Math.max(lo, x + step)) : x)));
                  setDirty(true);
                }}
                title="Drag to move this line"
                className="group absolute top-0 z-10 flex h-full w-4 -translate-x-1/2 cursor-ew-resize justify-center outline-none"
                style={{ left: xOf(s) }}
              >
                <span className="h-full w-0.5 bg-icp-red group-hover:w-1 group-focus-visible:w-1" />
                <span className="absolute top-2 h-6 w-3 rounded-sm border border-white bg-icp-red shadow" />
              </div>
            ))}
          </div>
        </div>
      )}

      {mismatch && (
        <p className="rounded bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
          The team has changed since the strips were set, so they have been spread evenly. Drag the lines into place and save.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-72">
          <ImageDrop multiple={false} accept={ACCEPT_PHOTOS} compact label="Replace the photo" hint="A cut-out PNG on a transparent background sits best" onFiles={choosePhoto} />
        </div>
        <Button onClick={() => { setSplits(evenSplits(count)); setDirty(true); }} disabled={!count}>Spread the strips evenly</Button>
        <div className="flex-1" />
        <Button variant="primary" onClick={save} disabled={!dirty || busy || !count}>
          {busy ? 'Saving…' : 'Save photo & strips'}
        </Button>
      </div>
    </Card>
  );
}
