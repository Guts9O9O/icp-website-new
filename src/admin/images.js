import imageCompression from 'browser-image-compression';

// Size caps (px, longest side) — the same limits scripts/seed.mjs applies.
export const SIZES = {
  thumbnail: 1200,
  gallery: 2400,
  photo: 1000,
};

const KEEP_AS_IS = ['image/png', 'image/svg+xml', 'image/webp'];

// Converts an uploaded photo to WebP in the browser (resized, EXIF-rotated),
// so the server only ever stores optimised files.
export async function toWebp(file, max = SIZES.gallery) {
  const blob = await imageCompression(file, {
    maxWidthOrHeight: max,
    maxSizeMB: 4,
    initialQuality: 0.82,
    fileType: 'image/webp',
    useWebWorker: true,
  });
  const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
  return new File([blob], name, { type: 'image/webp' });
}

// Logos keep their format (transparency, vector); photos become WebP.
export async function prepareLogo(file, max = 800) {
  if (KEEP_AS_IS.includes(file.type)) return file;
  return toWebp(file, max);
}

export function previewUrl(file) {
  return URL.createObjectURL(file);
}

export const ACCEPT_PHOTOS = 'image/jpeg,image/png,image/webp,image/heic,image/heif';
export const ACCEPT_LOGOS = 'image/png,image/svg+xml,image/webp,image/jpeg';
