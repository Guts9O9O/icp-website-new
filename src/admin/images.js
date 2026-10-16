import imageCompression from 'browser-image-compression';

// Size caps (px, longest side) for the small previews made from photos.
export const SIZES = {
  thumbnail: 1600,
  photo: 1000,
};

const KEEP_AS_IS = ['image/png', 'image/svg+xml', 'image/webp'];

// Converts an uploaded photo to WebP in the browser (resized, EXIF-rotated).
// Used for previews — a project's listing thumbnail, a team photo — never for
// the photographs a project page shows.
export async function toWebp(file, max = SIZES.thumbnail, quality = 0.9) {
  const blob = await imageCompression(file, {
    maxWidthOrHeight: max,
    maxSizeMB: 4,
    initialQuality: quality,
    fileType: 'image/webp',
    useWebWorker: true,
  });
  const name = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], name, { type: 'image/webp' });
}

// A project's photographs are stored exactly as uploaded: the same pixels,
// size, format and quality, so nothing is cut down or recompressed. They used
// to be shrunk to 2400px and squeezed under 4 MB, which on a detailed render
// cost visible quality. Only a file the website cannot hold is converted, at
// full size and high quality: a HEIC from an iPhone (browsers cannot show it,
// and only Safari can read it to convert), or one over the 15 MB the storage
// accepts per file.
export const MAX_UPLOAD_MB = 15;
const WEB_FORMATS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function prepareProjectPhoto(file) {
  if (WEB_FORMATS[file.type] && file.size <= MAX_UPLOAD_MB * 1024 * 1024) return file;
  const blob = await imageCompression(file, {
    maxSizeMB: MAX_UPLOAD_MB - 1,
    initialQuality: 0.92,
    fileType: 'image/jpeg',
    useWebWorker: true,
  });
  const name = (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg';
  return new File([blob], name, { type: 'image/jpeg' });
}

// The file extension a photo is stored under, from what it really is.
export const extensionOf = (file) => WEB_FORMATS[file.type] ?? 'jpg';

// A listing thumbnail made from a photo already in storage: fetched, then
// reduced like any other thumbnail. (Copying the original instead would put a
// full-size photograph behind every small column on the listing page.)
export async function thumbnailFromUrl(url) {
  const blob = await (await fetch(url)).blob();
  return toWebp(new File([blob], 'thumb', { type: blob.type }), SIZES.thumbnail);
}

// Logos keep their format (transparency, vector); photos become WebP.
// Transparent PNG and WebP logos are cropped to their artwork first: the
// Clients page sizes every logo from its file's proportions, so an empty
// margin left in a file would shrink the logo drawn inside it.
export async function prepareLogo(file, max = 800) {
  if (file.type === 'image/png' || file.type === 'image/webp') return trimTransparent(file);
  if (KEEP_AS_IS.includes(file.type)) return file;
  return toWebp(file, max);
}

async function trimTransparent(file) {
  const bitmap = await createImageBitmap(file);
  const { width: w, height: h } = bitmap;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);

  // Faint alpha (anti-aliasing haze, a stray shadow) does not count as artwork.
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  const empty = x1 < 0;
  const tight = x0 === 0 && y0 === 0 && x1 === w - 1 && y1 === h - 1;
  if (empty || tight) return file;

  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(canvas, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  const blob = await new Promise((resolve) => out.toBlob(resolve, 'image/png'));
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.png', { type: 'image/png' });
}

export function previewUrl(file) {
  return URL.createObjectURL(file);
}

export const ACCEPT_PHOTOS = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
export const ACCEPT_LOGOS = 'image/png,image/svg+xml,image/webp,image/jpeg';
