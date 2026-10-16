import { EDGE_BAR, u } from '../../lib/units';

// Full-height side bars present on every page: red on the left, and mist on
// the right — except on the portfolio's listing and project pages, where the
// client asked for the right one red as well (`right="red"`).
export default function EdgeBars({ right = 'mist' }) {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-y-0 left-0 z-40 bg-icp-red"
        style={{ width: u(EDGE_BAR) }}
      />
      <div
        className={`pointer-events-none fixed inset-y-0 right-0 z-40 ${right === 'red' ? 'bg-icp-red' : 'bg-icp-mist'}`}
        style={{ width: u(EDGE_BAR) }}
      />
    </>
  );
}
