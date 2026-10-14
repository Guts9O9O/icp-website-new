import { useMemo, useState } from 'react';
import { getClientGroups } from '../lib/api';
import { useData } from '../lib/useData';
import { useMediaQuery } from '../lib/useMediaQuery';
import { EDGE_BAR, PORTRAIT_QUERY, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';
import { Inline } from '../lib/richText';

// Grid geometry from R3 (design px): red header row, then logo rows of two
// columns per category. Landscape shows the four categories side by side;
// portrait tablets stack them two by two with shorter rows. Rows have a
// minimum height so long text entries can never spill out of their cell.
const GRID_TOP = 253.57;
const HEADER_H = 70;
const ROW_H = 181.26;
const ROW_H_PORTRAIT = 120;

// R4 draws this grid in two weights, measured off its page 7, and the
// difference is most of what makes it read as a grid rather than a mesh:
//
//   the three rules between the categories   #C2BDB4  mist
//   everything inside a category             #46423D  slate
//
// The mist ones also run higher and lower than the rest: they start at the top
// of the heading, so they cross the red band beside it, and they close the
// foot of the grid. We had drawn every line in one washed white, which over
// red came out a pale pink, and left the category boundaries no stronger than
// the cells inside them.
// Written per side. `border-icp-slate` and `border-icp-mist` each set the
// colour of all four sides, so a cell carrying both took whichever the
// stylesheet happened to put last rather than one colour per edge.
const INNER_V = 'border-l border-l-icp-slate';
const ROW_RULE = 'border-b border-b-icp-slate';
const FOOT_RULE = 'border-b border-b-icp-mist';
const CATEGORY_RULE = 'border-r border-r-icp-mist';

// Every logo is fitted to one box inside the cell's padding, 84% of its width
// by 111% of its height — it may run into the padding below and above. The
// height was 74% until the studio marked up the page (14 Oct 2026) asking half
// as much again for every square and round logo: Hilton, Aamby Valley, both
// Sankams, Travel Food Services, CFE, Merint. Raising the box is exactly that,
// and leaves a long wordmark untouched, since it meets the width first. So a
// 2:1 file reads right by default whether it is a wordmark or an emblem.
const LOGO_BOX_W = 84; // cqw
const LOGO_BOX_H = 111; // cqh
// The rest of that markup, as factors on the fit above. AVI, PSP and Dark
// Temptations were asked +25% and Nixon +10%. CCI was left as it was, and
// Wadhwa, Ozone and Ashwin Sheth asked only +10%, so the taller box is taken
// back off them. Keyed by client name; any other logo takes the plain fit.
const LOGO_SCALE = {
  'AVI Worldwide Pvt Ltd': 1.25,
  'PSP Laser Tech Pvt. Ltd': 1.25,
  'Dark Temptations': 1.25,
  Nixon: 1.1,
  'CCI Projects': 0.88,
  'The Wadhwa Group': 0.79,
  'Ozone Group': 0.79,
  'Ashwin Sheth': 0.65,
};

function Logo({ src, name }) {
  // Its proportions are only known once loaded, so it stays invisible until
  // then rather than flashing at the file's own size. 0 means the file has no
  // intrinsic size (an SVG without one), which falls back to a plain fit.
  const [ratio, setRatio] = useState(null);
  const onLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    setRatio(w && h ? w / h : 0);
  };
  const scale = LOGO_SCALE[name] ?? 1;
  const style = ratio
    ? { height: `calc(${scale} * min(${LOGO_BOX_H}cqh, ${LOGO_BOX_W / ratio}cqw))`, width: 'auto' }
    : { maxWidth: `${LOGO_BOX_W}cqw`, maxHeight: '74cqh', visibility: ratio === null ? 'hidden' : 'visible' };
  // `shrink-0`: a logo wider than the padded box must not be squeezed by flex.
  return <img src={src} alt={name} onLoad={onLoad} className="max-w-none shrink-0 object-contain" style={style} />;
}

function Cell({ item, rowH, col, lastRow }) {
  // Only the second column carries a left rule: one divider inside a category,
  // as R4 has it, and no rule down the outer edges of the grid.
  const border = `${col === 1 ? INNER_V : ''} ${lastRow ? FOOT_RULE : ROW_RULE}`;
  if (!item) return <div className={border} style={{ minHeight: v(rowH) }} />;

  if (item.type === 'image') {
    return (
      <div
        className={`flex items-center justify-center [container-type:size] ${border}`}
        style={{ height: v(rowH), minHeight: v(rowH), padding: u(30) }}
      >
        <Logo src={item.src} name={item.name} />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center text-center text-icp-mist ${border}`}
      style={{ minHeight: v(rowH), padding: u(20), fontSize: fs(14, 11), lineHeight: 1.5 }}
    >
      <p>
        {/* One line per row, as the studio types it, each able to carry
            **bold** — the client asked for the names set apart from the town
            below them, and which lines those are is theirs to decide. */}
        {item.text.split('\n').map((line, i) => (
          <span key={i} className="block">
            <Inline text={line} />
          </span>
        ))}
      </p>
    </div>
  );
}

function CategoryBlock({ group, rows, rowH, last }) {
  return (
    // The rule sits on the section, not on the heading, so it is one line from
    // the top of the heading to the foot of the grid rather than stopping where
    // the red band ends and starting again in a different colour below it.
    <section className={last ? '' : CATEGORY_RULE}>
      <h2
        // R3 keeps the red bar unbroken around the headings: no rule above
        // them and none below, the red meeting the taupe directly.
        className="flex items-center justify-center bg-icp-red text-center text-white"
        style={{ height: v(HEADER_H), fontSize: fs(24, 14) }}
      >
        {group.label}
      </h2>
      <div className="grid grid-cols-2">
        {Array.from({ length: rows * 2 }).map((_, i) => (
          <Cell
            key={i}
            item={group.items[i] ?? null}
            rowH={rowH}
            col={i % 2}
            lastRow={i >= (rows - 1) * 2}
          />
        ))}
      </div>
    </section>
  );
}

export default function ClientsPage() {
  useSeo({ title: 'Clients', description: 'Hospitality, developer, commercial and private clients of iConcepts + Partners, Mumbai.' });
  const { data } = useData(getClientGroups);
  const groups = useMemo(() => data ?? [], [data]);
  const portrait = useMediaQuery(PORTRAIT_QUERY);

  // Landscape: every block has the same number of rows so the grid lines run
  // straight across. Portrait: each pair of blocks shares its row count.
  const rowsFor = (index) => {
    const pool = portrait ? groups.slice(index - (index % 2), index - (index % 2) + 2) : groups;
    return Math.max(1, ...pool.map((g) => Math.ceil(g.items.length / 2)));
  };
  const rowH = portrait ? ROW_H_PORTRAIT : ROW_H;

  return (
    <div className="relative min-h-screen bg-icp-taupe font-brand text-icp-mist">
      <div
        className="absolute top-0 bg-icp-red"
        style={{ left: u(EDGE_BAR), right: u(EDGE_BAR), height: v(GRID_TOP + HEADER_H) }}
      />

      <EdgeBars />
      <SiteNav title="Clients" tone="red" />

      <main
        // Follows the number of client categories rather than hard-coding four,
        // so a category added in the admin never drops onto a row of its own.
        className="absolute grid tall:!grid-cols-2"
        style={{
          top: v(GRID_TOP),
          left: u(EDGE_BAR),
          right: u(EDGE_BAR),
          gridTemplateColumns: `repeat(${Math.max(1, groups.length)}, minmax(0, 1fr))`,
        }}
      >
        {groups.map((group, i) => (
          <CategoryBlock
            key={group.category}
            group={group}
            rows={rowsFor(i)}
            rowH={rowH}
            last={portrait ? i % 2 === 1 || i === groups.length - 1 : i === groups.length - 1}
          />
        ))}
      </main>

      <SiteFooter />
    </div>
  );
}
