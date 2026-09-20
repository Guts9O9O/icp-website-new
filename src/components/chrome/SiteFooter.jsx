import { EDGE_BAR, FOOTER_H, u, v } from '../../lib/units';
import LottieMark, { SHORT_LOGO_ART, SIGNATURE_ART } from './LottieMark';

// Visible artwork sizes from R3 (design px); the Lottie canvases are larger
// than their artwork, so box sizes/offsets are derived from the measured art bounds.
const LOGO_ART_H = 45;
const LOGO_BOX = LOGO_ART_H / SHORT_LOGO_ART.h;
const SIG_ART_W = 330;
const SIG_BOX = SIG_ART_W / SIGNATURE_ART.w;

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
          src="/animations/short-logo-icp.json"
          assetsPath="/animations/images/"
          still
          className="absolute"
          style={{
            width: u(LOGO_BOX),
            height: u(LOGO_BOX),
            left: u(50 - SHORT_LOGO_ART.x * LOGO_BOX),
            top: u(-(50 + (SHORT_LOGO_ART.y + SHORT_LOGO_ART.h) * LOGO_BOX)),
          }}
        />
      )}

      <LottieMark
        src="/animations/signature.json"
        hideImages // the "to" raster (images/img_0.png) has not been supplied yet
        loop={false}
        className="absolute"
        style={{
          width: u(SIG_BOX),
          height: u(SIG_BOX),
          right: u(30 - (1 - SIGNATURE_ART.x - SIGNATURE_ART.w) * SIG_BOX),
          top: u(-17 - (SIGNATURE_ART.y + SIGNATURE_ART.h / 2) * SIG_BOX),
        }}
      />
    </footer>
  );
}
