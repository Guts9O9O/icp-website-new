import { useLocation } from 'react-router';
import { EDGE_BAR, FOOTER_H, FOOTER_MARK_H as LOGO_H, FOOTER_MARK_LIFT as LOGO_LIFT, u, v } from '../../lib/units';
import LottieMark, { SIGNATURE_RULE_STOP, artAspect } from './LottieMark';
import { getFooter } from '../../lib/api';
import { useData } from '../../lib/useData';
import { FOOTER_DEFAULT } from '../../data/site';

// Artwork sizes from R3 (design px). LottieMark clips each animation to its
// own artwork, so these are the sizes of what is actually drawn.
// LOGO_H (units.js FOOTER_MARK_H): the "iC+P" mark; hovering expands it to the full wordmark
const SIG_W = 340; // R3 drew it 430 wide; the client asked for a smaller signature
const GAP = 50; // R3: the mark sits 50px in from the corner
// Measured off R3's own reference line, which runs through the centre of the
// mark and the centre of the carousel controls at y 1428.9. The mark's foot
// sits 51 design px above the rule; the signature hangs below it by 40% of its
// own height, crossing the line as the designer drew it. Taking the drop as a
// proportion rather than a fixed 57px keeps that crossing looking the same
// whatever width the signature is set to. LOGO_LIFT is units.js FOOTER_MARK_LIFT,
// shared so pages can keep their own text clear of the mark.
const SIG_DROP_RATIO = 0.4;

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
  const { data: footer } = useData(getFooter);
  const mist = tone === 'mist';
  const signature = mist ? 'signatureMist' : 'signature';
  const logoWidth = LOGO_H * artAspect('shortLogo');
  const sigHeight = SIG_W / artAspect(signature);
  const sigDrop = sigHeight * SIG_DROP_RATIO;

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

      {/* Kept clear of the signature, which hangs across this line on the
          right (and, mirrored, of the sound toggle on the left). The studio
          sets this text in the admin; a longer line on a portrait tablet ran
          under the signature, so it wraps instead. Only there is the line
          narrow enough to wrap, so only there does it get room between lines,
          taken back from `top` so the first line stays put. */}
      <p
        className="t-body absolute text-center leading-none text-icp-mist tall:leading-[1.25] tall:[--wrap-lift:0.125em]"
        style={{ top: `calc(${v(32)} - var(--wrap-lift, 0em))`, left: u(GAP + SIG_W), right: u(GAP + SIG_W), textWrap: 'balance' }}
      >
        {/* Set in the admin (Site text & contact → Footer). */}
        {(footer ?? FOOTER_DEFAULT).copyright}
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
            bottom: `calc(100% + ${v(LOGO_LIFT)})`, // its centre lands on R3's reference line
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
          bottom: `calc(100% - ${v(sigDrop)})`, // hangs across the rule, as R3 draws it
        }}
      />
    </footer>
  );
}
