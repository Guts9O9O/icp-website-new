// A tiny document format for content written by non-technical admins:
//   - a blank line starts a new paragraph
//   - a line entirely in CAPITALS on its own is a heading (the brand name
//     "iC+P" is allowed inside a heading)
//   - lines starting with "- ", "• " or "1. " are list items; inside an item,
//     "TITLE — text" (or "TITLE - text") makes TITLE bold
//   - a paragraph wrapped in quotes (“…” or "…") is a pull-quote
// Used for the About Us write-up, team bios and category introductions.

const LIST_RE = /^(?:[-•*]|\d+[.)])\s+/;
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
    blocks.push({ type: 'paragraph', text: lines.join(' ') });
  }
  return blocks;
}

// Renders parsed blocks. `tone` picks colours for dark (red panel) or light backgrounds.
export default function RichText({ text, tone = 'dark', headingStyle, paragraphStyle, gap = '0.9em' }) {
  const blocks = parseRichText(text);
  const muted = tone === 'dark' ? 'rgba(255,255,255,0.72)' : 'var(--icp-taupe)';
  const strong = tone === 'dark' ? '#fff' : 'var(--icp-slate)';

  return (
    <div style={{ display: 'grid', gap }}>
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return (
            <h3 key={i} style={{ fontWeight: 600, letterSpacing: '0.12em', marginTop: i === 0 ? 0 : '0.6em', color: strong, ...headingStyle }}>
              {b.text}
            </h3>
          );
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i} style={{ fontStyle: 'italic', color: strong, borderLeft: '2px solid var(--icp-red)', paddingLeft: '1em', margin: 0 }}>
              “{b.text}”
            </blockquote>
          );
        }
        if (b.type === 'list') {
          const Tag = b.ordered ? 'ol' : 'ul';
          return (
            <Tag key={i} style={{ paddingLeft: '1.4em', margin: 0, display: 'grid', gap: '0.45em', listStyle: b.ordered ? 'decimal' : 'disc' }}>
              {b.items.map((it, j) => (
                <li key={j} style={paragraphStyle}>
                  {it.title && <span style={{ fontWeight: 600, color: strong }}>{it.title} — </span>}
                  <span style={{ color: it.title ? muted : undefined }}>{it.text}</span>
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i} style={{ margin: 0, ...paragraphStyle }}>
            {b.text}
          </p>
        );
      })}
    </div>
  );
}
