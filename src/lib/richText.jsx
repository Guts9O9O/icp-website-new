// The rendering half of the write-up format; the parsing half lives in
// richTextParse.js, which is plain JS so it can be imported and tested without
// a build step.
import { INLINE_RE, parseRichText } from './richTextParse.js';

export { parseRichText };

// **bold** and _italic_ inside a run of text. Bold carries `t-strong` rather
// than a weight: the brand face is Segoe UI Light, which has no bold cut, so a
// weight alone does nothing — the class swaps in the regular face.
export function Inline({ text }) {
  const parts = String(text ?? '').split(INLINE_RE);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="t-strong">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.length > 2 && part.startsWith('_') && part.endsWith('_')) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
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
              <Inline text={b.text} />
            </h3>
          );
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i} style={{ fontStyle: 'italic', color: strong, borderLeft: '2px solid var(--icp-red)', paddingLeft: '1em', margin: 0 }}>
              “<Inline text={b.text} />”
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
                  <span style={{ color: it.title ? muted : undefined }}>
                    <Inline text={it.text} />
                  </span>
                </li>
              ))}
            </Tag>
          );
        }
        return (
          // `em` keeps the smaller level on the same scale as everything
          // around it, so it still follows the artboard.
          <p key={i} style={{ margin: 0, ...paragraphStyle, ...(b.small ? { fontSize: '0.86em' } : null) }}>
            <Inline text={b.text} />
          </p>
        );
      })}
    </div>
  );
}
