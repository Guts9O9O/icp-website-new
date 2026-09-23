import { EDGE_BAR, FOOTER_H, u, v } from '../../lib/units';
import LottieMark, { MARKS } from './LottieMark';

// Visible artwork sizes from R3 (design px). Each Lottie canvas is larger than
// its artwork, so box sizes and offsets are derived from the measured bounds
// in MARKS — that way the drawn mark lands exactly where the design puts it.
const LOGO_ART_H = 45;
const LOGO_BOX = LOGO_ART_H / MARKS.shortLogo.art.h;
const SIG_ART_W = 330;
const SIG_BOX = SIG_ART_W / MARKS.signature.art.w;

/**
 * Footer shared by every page (R3): a 1.5px red rule 100 design px from the
 * bottom, the copyright line under it, the small animated iC+P mark above it
 * on the left and the "design to live" signature crossing it on the right.
 */
export default function SiteFooter({ showLogo = true }) {
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
          still
          className="absolute"
          style={{
            width: u(LOGO_BOX),
            height: u(LOGO_BOX * MARKS.shortLogo.ratio),
            left: u(50 - MARKS.shortLogo.art.x * LOGO_BOX),
            top: u(-(50 + (MARKS.shortLogo.art.y + MARKS.shortLogo.art.h) * LOGO_BOX * MARKS.shortLogo.ratio)),
          }}
        />
      )}

      <LottieMark
        mark="signature"
        loop={false}
        className="absolute"
        style={{
          width: u(SIG_BOX),
          height: u(SIG_BOX * MARKS.signature.ratio),
          right: u(30 - (1 - MARKS.signature.art.x - MARKS.signature.art.w) * SIG_BOX),
          top: u(-17 - (MARKS.signature.art.y + MARKS.signature.art.h / 2) * SIG_BOX * MARKS.signature.ratio),
        }}
      />
    </footer>
  );
}
