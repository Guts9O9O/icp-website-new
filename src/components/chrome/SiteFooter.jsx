import { useLocation } from 'react-router';
import { EDGE_BAR, FOOTER_H, u, v } from '../../lib/units';
import LottieMark, { SIGNATURE_RULE_STOP, artAspect } from './LottieMark';

// Artwork sizes from R3 (design px). LottieMark clips each animation to its
// own artwork, so these are the sizes of what is actually drawn.
const LOGO_H = 61; // the "iC+P" mark; hovering expands it to the full wordmark
const SIG_W = 330;
const GAP = 50; // R3: the mark sits 50px in from the corner
const LOGO_LIFT = 72; // clearance above the rule, so the mark never crowds it
const SIG_LIFT = 12; // the signature clears the rule rather than sitting on it

/**
 * Footer shared by every page (R3): a 1.5px rule 100 design px from the
 * bottom, the copyright line under it, the animated iC+P mark above it on the
 * left and the "design to live" signature crossing it on the right.
 *
 * `tone` picks the colour of the rule and the signature. The client asked for
 * mist on the pages that sit on photography — Home and Portfolio — and the
 * brand red everywhere else.
 */
export default function SiteFooter({ showLogo = true, tone = 'red' }) {
  // The home page stays mounted under the sliding overlay, so its footer is
  // never rebuilt. Keying the signature to the route makes it draw itself
  // again on arrival at every page, including a return to home.
  const { pathname } = useLocation();
  const mist = tone === 'mist';
  const signature = mist ? 'signatureMist' : 'signature';
  const logoWidth = LOGO_H * artAspect('shortLogo');
  const sigHeight = SIG_W / artAspect(signature);

  return (
    <footer
      className="pointer-events-none fixed bottom-0 z-30"
      style={{ left: u(EDGE_BAR), right: u(EDGE_BAR), height: v(FOOTER_H) }}
    >
      {/* Stops short of the signature: the "g" of "design" drops its tail
          across this line, and the client asked for the rule to end before it. */}
      <div
        className={`absolute left-0 top-0 ${mist ? 'bg-icp-mist' : 'bg-icp-red'}`}
        style={{
          height: `max(1px, ${u(1.5)})`,
          right: u(GAP + SIG_W * (1 - SIGNATURE_RULE_STOP)),
        }}
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
            // Both axes scale with `u` so the box keeps the artwork's own
            // aspect. Sizing the height with `v` made the box a different
            // shape on any screen that is not 16:10, and `meet` then shrank
            // the mark to fit — far enough that the roundel's lower bars fell
            // between pixels and vanished.
            height: u(LOGO_H),
            left: u(GAP),
            bottom: `calc(100% + ${v(LOGO_LIFT)})`, // sits clear above the rule
          }}
        />
      )}

      <LottieMark
        key={`${signature}-${pathname}`}
        mark={signature}
        mode="intro"
        style={{
          position: 'absolute',
          width: u(SIG_W),
          height: u(sigHeight), // same reason as the mark above
          right: u(GAP),
          bottom: `calc(100% + ${v(SIG_LIFT)})`, // rests just above the rule, not across it
        }}
      />
    </footer>
  );
}
