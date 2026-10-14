// A tiny document format for content written by non-technical admins:
//   - a blank line starts a new paragraph
//   - a line entirely in CAPITALS on its own is a heading (the brand name
//     "iC+P" is allowed inside a heading)
//   - lines starting with "- ", "• " or "1. " are list items; inside an item,
//     "TITLE — text" (or "TITLE - text") makes TITLE bold
//   - a paragraph wrapped in quotes (“…” or "…") is a pull-quote
//   - a paragraph starting "~ " is set one step smaller
//   - inside any text, **bold** and _italic_
// Used for the About Us write-up, team bios and category introductions.
//
// The admin writes this through a Word-style editor rather than by hand, so
// the markers above are what that editor reads and writes. Sizes are named
// levels, never pixels: everything on the site is scaled off the 2560 artboard
// and a literal size would stop scaling with it.

const LIST_RE = /^(?:[-•]|\d+[.)])\s+/;
const SMALL_RE = /^~\s+/;
// Split on the marks rather than replacing them, so the surrounding text is
// kept verbatim — content the studio pastes in is never rewritten.
export const INLINE_RE = /(\*\*[^*\n]+\*\*|_[^_\n]+_)/g;
const QUOTE_RE = /^[“"](.+)[”"]$/s;
const TITLE_RE = /^([^—–-]{2,60}?)\s+[—–-]\s+(.+)$/s;

export function parseRichText(text) {
  const blocks = [];
  const paragraphs = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  for (const para of paragraphs) {
    const lines = para.split('\n').map((l) => l.trim()).filter(Boolean);
    const probe = lines[0].replace(/iC\+P/g, 'IC+P');
    const isHeading = lines.length === 1 && probe.length >= 3 && probe.length <= 80 && probe === probe.toUpperCase() && /[A-Z]/.test(probe);
    if (isHeading) {
      blocks.push({ type: 'heading', text: lines[0] });
      continue;
    }
    if (lines.every((l) => LIST_RE.test(l))) {
      blocks.push({
        type: 'list',
        ordered: /^\d/.test(lines[0]),
        items: lines.map((l) => {
          const body = l.replace(LIST_RE, '');
          const m = body.match(TITLE_RE);
          return m ? { title: m[1].trim(), text: m[2].trim() } : { text: body };
        }),
      });
      continue;
    }
    const quote = para.match(QUOTE_RE);
    if (quote) {
      blocks.push({ type: 'quote', text: quote[1].trim() });
      continue;
    }
    const body = lines.join(' ');
    if (SMALL_RE.test(body)) {
      blocks.push({ type: 'paragraph', small: true, text: body.replace(SMALL_RE, '') });
      continue;
    }
    blocks.push({ type: 'paragraph', text: body });
  }
  return blocks;
}
