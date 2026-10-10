import { fs, u } from '../../lib/units';

// Sizes measured off R3 pages 9 and 10 (design px). The chevrons stand about
// twice the height of the labels, and the current item is marked by a red ring
// drawn around its dot rather than by filling the dot in.
const CHEV_W = 10;
const CHEV_H = 21;
const DOT = 7;
const RING = 17;

function Chevron({ back }) {
  return (
    <svg
      viewBox="0 0 10 21"
      aria-hidden="true"
      className="shrink-0 text-icp-red"
      style={{ width: u(CHEV_W), height: u(CHEV_H), minWidth: 6 }}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points={back ? '8.6,1.4 1.4,10.5 8.6,19.6' : '1.4,1.4 8.6,10.5 1.4,19.6'} />
    </svg>
  );
}

/**
 * "‹ Previous (o) o Next ›" — shared by the category listing, a project's
 * images and the testimonials, which all draw the same control in R3.
 *
 * `onLight` switches the labels and dots from mist to taupe for the pages that
 * sit on the pale background; the chevrons stay red either way.
 * `endsDisabled` is for paging, where there is a first and last page to stop
 * at; the image carousels wrap around instead.
 */
export default function CarouselControls({
  count,
  index,
  onSelect,
  onPrev,
  onNext,
  label = 'Items',
  itemLabel = (i) => `Item ${i + 1}`,
  onLight = false,
  endsDisabled = false,
}) {
  const ink = onLight ? 'text-icp-taupe' : 'text-icp-mist';
  const dot = onLight ? 'bg-icp-taupe' : 'bg-icp-mist';

  return (
    <nav className={`flex items-center justify-center ${ink}`} style={{ fontSize: fs(13, 11) }} aria-label={label}>
      <button
        type="button"
        onClick={onPrev}
        disabled={endsDisabled && index === 0}
        className="flex items-center transition-opacity hover:opacity-70 disabled:opacity-30"
        style={{ gap: u(8) }}
      >
        <Chevron back />
        <span>Previous</span>
      </button>

      <div className="flex items-center" style={{ gap: u(8), marginLeft: u(18), marginRight: u(18) }}>
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            aria-label={itemLabel(i)}
            aria-current={i === index}
            className="relative flex shrink-0 items-center justify-center"
            style={{ width: u(RING), height: u(RING), minWidth: 12, minHeight: 12 }}
          >
            {i === index && (
              <span
                className="absolute inset-0 rounded-full border-icp-red"
                style={{ borderWidth: `max(1px, ${u(1.6)})`, borderStyle: 'solid' }}
              />
            )}
            <span
              className={`rounded-full ${dot}`}
              style={{ width: u(DOT), height: u(DOT), minWidth: 5, minHeight: 5 }}
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={endsDisabled && index >= count - 1}
        className="flex items-center transition-opacity hover:opacity-70 disabled:opacity-30"
        style={{ gap: u(8) }}
      >
        <span>Next</span>
        <Chevron />
      </button>
    </nav>
  );
}
