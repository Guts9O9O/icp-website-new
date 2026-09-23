import { EDGE_BAR, FOOTER_H, u, v } from '../../lib/units';
import LottieMark, { artAspect } from './LottieMark';

// Artwork sizes from R3 (design px). LottieMark clips each animation to its
// own artwork, so these are the sizes of what is actually drawn.
const LOGO_H = 45; // the "iC+P" mark; hovering expands it to the full wordmark
const SIG_W = 330;
const GAP = 50; // R3: the mark sits 50px in from the corner

/**
 * Footer shared by every page (R3): a 1.5px red rule 100 design px from the
 * bottom, the copyright line under it, the animated iC+P mark above it on the
 * left and the "design to live" signature crossing it on the right.
 */
export default function SiteFooter({ showLogo = true }) {
  const logoWidth = LOGO_H * artAspect('shortLogo');
  const sigHeight = SIG_W / artAspect('signature');

  return (
    <footer
      className="pointer-events-none fixed bottom-0 z-30"
      style={{ left: u(EDGE_BAR), right: u(EDGE_BAR), height: v(FOOTER_H) }}
    >
      <div
        className="absolute left-0 right-0 top-0 bg-icp-red"
        style={{ height: `max(1px, ${u(1.5)})` }}
      />

      <p
        className="t-body absolute inset-x-0 text-center leading-none text-icp-mist"
        style={{ top: v(32) }}
      >
        Website designed by adiz Ⓒ 2026 iConcepts+Partners. All Rights Reserved
      </p>

      {showLogo && (
        <LottieMark
          mark="shortLogo"
          mode="hover"
          label="iConcepts + Partners"
          className="pointer-events-auto cursor-pointer outline-none"
          style={{
            position: 'absolute',
            width: u(logoWidth),
            height: v(LOGO_H),
            left: u(GAP),
            bottom: `calc(100% + ${v(GAP)})`, // sits above the rule
          }}
        />
      )}

      <LottieMark
        mark="signature"
        mode="intro"
        style={{
          position: 'absolute',
          width: u(SIG_W),
          height: v(sigHeight),
          right: u(GAP),
          bottom: `calc(100% - ${v(sigHeight * 0.42)})`, // crosses the rule
        }}
      />
    </footer>
  );
}
