import { useMemo } from 'react';
import { getClientGroups } from '../lib/api';
import { useData } from '../lib/useData';
import { useMediaQuery } from '../lib/useMediaQuery';
import { EDGE_BAR, PORTRAIT_QUERY, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';

// Grid geometry from R3 (design px): red header row, then logo rows of two
// columns per category. Landscape shows the four categories side by side;
// portrait tablets stack them two by two with shorter rows. Rows have a
// minimum height so long text entries can never spill out of their cell.
const GRID_TOP = 253.57;
const HEADER_H = 70;
const ROW_H = 181.26;
const ROW_H_PORTRAIT = 120;

// R3 draws these as a pale rule over the taupe — not the darker slate we had,
// which read as a shadow rather than a line.
const RULE = 'border-white/20';

function Cell({ item, rowH }) {
  const border = `border-l border-b ${RULE}`;
  if (!item) return <div className={border} style={{ minHeight: v(rowH) }} />;

  if (item.type === 'image') {
    return (
      <div className={`flex items-center justify-center ${border}`} style={{ height: v(rowH), minHeight: v(rowH), padding: u(30) }}>
        {/* Client feedback: the logos were sitting too large in their cells.
            Capping them well inside the padding keeps every logo to the same
            visual weight whatever its own aspect ratio. */}
        <img
          src={item.src}
          alt={item.name}
          className="object-contain"
          style={{ maxWidth: '84%', maxHeight: '74%' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center text-center text-icp-mist ${border}`}
      style={{ minHeight: v(rowH), padding: u(20), fontSize: fs(14, 11), lineHeight: 1.5 }}
    >
      <p>
        {item.text.split('\n').map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>
    </div>
  );
}

function CategoryBlock({ group, rows, rowH, last }) {
  return (
    <section>
      <h2
        // R3 keeps the red bar unbroken around the headings: no rule above
        // them, none below (the red meets the taupe directly), and no outer
        // edge — only the three dividers between the four categories.
        className={`flex items-center justify-center bg-icp-red text-center text-white ${last ? '' : `border-r ${RULE}`}`}
        style={{ height: v(HEADER_H), fontSize: fs(24, 14) }}
      >
        {group.label}
      </h2>
      <div className={`grid grid-cols-2 ${last ? `border-r ${RULE}` : ''}`}>
        {Array.from({ length: rows * 2 }).map((_, i) => (
          <Cell key={i} item={group.items[i] ?? null} rowH={rowH} />
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
        // Follows the number of categories rather than assuming four, which is
        // what dropped Bespoke Elements onto a row of its own.
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
