import { useMemo } from 'react';
import { getClientGroups } from '../lib/api';
import { useData } from '../lib/useData';
import { EDGE_BAR, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';

// Grid geometry from R3 (design px): 8 columns, red header row, 5 logo rows.
const GRID_TOP = 253.57;
const HEADER_H = 70;
const ROW_H = 181.26;
const ROWS = 5;

function Cell({ item }) {
  const border = 'border-r border-b border-icp-slate';
  if (!item) return <div className={border} style={{ height: v(ROW_H) }} />;

  if (item.type === 'image') {
    return (
      <div className={`flex items-center justify-center ${border}`} style={{ height: v(ROW_H), padding: u(30) }}>
        <img src={`/images/clients/${item.file}`} alt={item.name} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center text-center text-icp-mist ${border}`}
      style={{ height: v(ROW_H), padding: u(20), fontSize: fs(14, 11), lineHeight: 1.6 }}
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

export default function ClientsPage() {
  const { data } = useData(getClientGroups);
  const groups = useMemo(() => data ?? [], [data]);

  return (
    <div className="relative min-h-screen bg-icp-taupe font-brand text-icp-mist">
      <EdgeBars />
      <SiteNav title="clients" />

      <main className="absolute" style={{ top: v(GRID_TOP), left: u(EDGE_BAR), right: u(EDGE_BAR) }}>
        <div className="grid grid-cols-8 border-l border-t border-icp-slate">
          {groups.map((group) => (
            <div
              key={group.category}
              className="col-span-2 flex items-center justify-center border-r border-icp-red bg-icp-red text-center text-icp-mist"
              style={{ height: v(HEADER_H), fontSize: fs(24, 14) }}
            >
              {group.label}
            </div>
          ))}

          {Array.from({ length: ROWS }).flatMap((_, row) =>
            groups.flatMap((group) =>
              [0, 1].map((col) => {
                const index = row * 2 + col;
                return <Cell key={`${group.category}-${row}-${col}`} item={group.items[index] ?? null} />;
              })
            )
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
