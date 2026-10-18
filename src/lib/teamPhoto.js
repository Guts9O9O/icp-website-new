// The About page's group photograph (R5, October 2026): one photo of the whole
// team, with each person standing in a strip of it. Hovering a strip opens
// that person's write-up, as the four separate cards used to.
//
// The strips are kept as `splits`: the boundaries between people, from the
// left of the first strip to the right of the last, as shares of the photo's
// width (so they move with the photo whatever size it is drawn at). They live
// with the photo in site settings (`team_photo`) and are set in the admin by
// dragging lines over the photo. The defaults are measured off R5 pages 2-5
// for the photograph supplied with it.

export const DEFAULT_TEAM_PHOTO = {
  path: '/images/team/group.webp',
  aspect: 1086 / 1448,
  // Prachi 1006-1273, Imran 1273-1540, Archna 1540-1826 design px, over a
  // photo drawn from 1025.5 to 1825.5.
  splits: [-0.024375, 0.309375, 0.643125, 1],
};

// Boundaries for `count` people: the saved ones when they still fit the team,
// otherwise an even division of the photo.
export function splitsFor(saved, count) {
  if (count < 1) return [];
  if (Array.isArray(saved) && saved.length === count + 1 && saved.every((s, i) => i === 0 || s > saved[i - 1])) return saved;
  return evenSplits(count);
}

export const evenSplits = (count) => Array.from({ length: count + 1 }, (_, i) => i / count);

// Geometry of the composition, in design px, measured off R5 page 1.
export const TEAM_LAYOUT = {
  aboutW: 275, // the "Design TEAM" strip, left of the first person
  photoTop: 266,
  photoH: 1066.7,
  bandTop: 1153,
  bandH: 72,
};

// Where each strip and the photo sit, in design px across a composition that
// is centred on the page: the Design TEAM strip first, then one per person.
export function teamGeometry({ aspect, splits }) {
  const w = TEAM_LAYOUT.photoH * aspect;
  const first = splits[0];
  const last = splits[splits.length - 1];
  const total = TEAM_LAYOUT.aboutW + (last - first) * w;
  const left = -total / 2; // from the page's centre line
  const peopleLeft = left + TEAM_LAYOUT.aboutW;
  return {
    total,
    about: { left, width: TEAM_LAYOUT.aboutW },
    people: splits.slice(0, -1).map((s, i) => ({ left: peopleLeft + (s - first) * w, width: (splits[i + 1] - s) * w })),
    photo: { left: peopleLeft - first * w, width: w },
  };
}
