import { EDGE_BAR, u } from '../../lib/units';

// Full-height side bars present on every page: red on the left, mist on the right.
export default function EdgeBars() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-y-0 left-0 z-40 bg-icp-red"
        style={{ width: u(EDGE_BAR) }}
      />
      <div
        className="pointer-events-none fixed inset-y-0 right-0 z-40 bg-icp-mist"
        style={{ width: u(EDGE_BAR) }}
      />
    </>
  );
}
