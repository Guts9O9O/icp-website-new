// The rendering half of the write-up format; the parsing half lives in
// richTextParse.js, which is plain JS so it can be imported and tested without
// a build step.
import { INLINE_RE, isHtml, parseRichText, richTextPlain } from './richTextParse.js';

export { parseRichText, richTextPlain };

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

function colours(tone) {
  return {
    muted: tone === 'dark' ? 'rgba(255,255,255,0.72)' : 'var(--icp-taupe)',
    strong: tone === 'dark' ? '#fff' : 'var(--icp-slate)',
  };
}

const headingBase = { fontWeight: 600, letterSpacing: '0.12em', margin: 0 };
const listBase = { paddingLeft: '1.4em', margin: 0, display: 'grid', gap: '0.45em' };
const quoteBase = { fontStyle: 'italic', borderLeft: '2px solid var(--icp-red)', paddingLeft: '1em', margin: 0 };
const SIZES = { small: '0.86em', large: '1.15em' };

// ---------------------------------------------------------------------------
// Write-ups saved by the editor are HTML. It is never handed to the browser as
// markup: each element is rebuilt as a React element from a fixed list of what
// the editor can produce, with only the attributes it uses, so whatever ends
// up in the field — pasted from Word, typed into the database — can only ever
// come out as text in the site's own type styles.

const ALIGN = new Set(['left', 'center', 'right', 'justify']);
const DROP = new Set(['script', 'style', 'iframe', 'object', 'embed', 'img', 'svg', 'video', 'audio', 'form', 'input', 'button', 'select', 'textarea', 'link', 'meta']);

function alignOf(el) {
  const a = el.style?.textAlign;
  return ALIGN.has(a) ? a : undefined;
}

function safeHref(href) {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.origin);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function renderNodes(nodes, ctx) {
  return [...nodes].map((n, i) => renderNode(n, i, ctx));
}

function renderNode(node, key, ctx) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1) return null;
  const tag = node.tagName.toLowerCase();
  if (DROP.has(tag)) return null;
  const kids = renderNodes(node.childNodes, ctx);
  const textAlign = alignOf(node);
  const { paragraphStyle, headingStyle, c } = ctx;

  switch (tag) {
    case 'p': {
      const size = SIZES[node.getAttribute('data-size')] ?? (node.getAttribute('data-small') === 'true' ? SIZES.small : undefined);
      return (
        <p key={key} style={{ margin: 0, ...paragraphStyle, textAlign, ...(size ? { fontSize: size } : null) }}>
          {kids}
        </p>
      );
    }
    case 'h1':
    case 'h2':
    case 'h3':
      // Headings are set in capitals across the site; the editor lets them be
      // typed in any case and the page sets them.
      return (
        <h3 key={key} style={{ ...headingBase, marginTop: key ? '0.6em' : 0, textTransform: 'uppercase', color: c.strong, textAlign, ...headingStyle }}>
          {kids}
        </h3>
      );
    case 'h4':
    case 'h5':
    case 'h6':
      return (
        <h4 key={key} className="t-strong" style={{ margin: 0, color: c.strong, textAlign }}>
          {kids}
        </h4>
      );
    case 'strong':
    case 'b':
      return (
        <strong key={key} className="t-strong">
          {kids}
        </strong>
      );
    case 'em':
    case 'i':
      return <em key={key}>{kids}</em>;
    case 'u':
      return <u key={key}>{kids}</u>;
    case 's':
    case 'del':
    case 'strike':
      return <s key={key}>{kids}</s>;
    case 'br':
      return <br key={key} />;
    case 'a': {
      const href = safeHref(node.getAttribute('href'));
      if (!href) return <span key={key}>{kids}</span>;
      const external = !href.startsWith(window.location.origin);
      return (
        <a key={key} href={href} className="underline" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}>
          {kids}
        </a>
      );
    }
    case 'ul':
      return (
        <ul key={key} style={{ ...listBase, listStyle: 'disc' }}>
          {kids}
        </ul>
      );
    case 'ol':
      return (
        <ol key={key} style={{ ...listBase, listStyle: 'decimal' }}>
          {kids}
        </ol>
      );
    case 'li':
      return (
        <li key={key} style={paragraphStyle}>
          {kids}
        </li>
      );
    case 'blockquote':
      return (
        <blockquote key={key} style={{ ...quoteBase, color: c.strong, display: 'grid', gap: '0.6em' }}>
          {kids}
        </blockquote>
      );
    case 'hr':
      return <hr key={key} style={{ border: 0, borderTop: '1px solid currentColor', opacity: 0.35, margin: '0.3em 0' }} />;
    case 'span':
      return node.getAttribute('data-tone') === 'muted' ? (
        <span key={key} style={{ color: c.muted }}>
          {kids}
        </span>
      ) : (
        <span key={key}>{kids}</span>
      );
    default:
      // An element the editor does not make (a stray div from a paste, say)
      // keeps its words and loses its wrapper.
      return <span key={key}>{kids}</span>;
  }
}

function HtmlBlocks({ html, ctx }) {
  if (typeof DOMParser === 'undefined') return <p style={{ margin: 0 }}>{richTextPlain(html)}</p>;
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  const blocks = [...body.childNodes].filter((n) => n.nodeType === 1 || n.textContent.trim());
  return blocks.map((n, i) => renderNode(n, i, ctx));
}

// ---------------------------------------------------------------------------

// Renders a write-up. `tone` picks colours for dark (red panel) or light backgrounds.
export default function RichText({ text, tone = 'dark', headingStyle, paragraphStyle, gap = '0.9em' }) {
  const c = colours(tone);

  if (isHtml(text)) {
    return (
      <div style={{ display: 'grid', gap }}>
        <HtmlBlocks html={text} ctx={{ c, headingStyle, paragraphStyle }} />
      </div>
    );
  }

  const blocks = parseRichText(text);
  return (
    <div style={{ display: 'grid', gap }}>
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          return (
            <h3 key={i} style={{ ...headingBase, marginTop: i === 0 ? 0 : '0.6em', color: c.strong, ...headingStyle }}>
              <Inline text={b.text} />
            </h3>
          );
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i} style={{ ...quoteBase, color: c.strong }}>
              “<Inline text={b.text} />”
            </blockquote>
          );
        }
        if (b.type === 'list') {
          const Tag = b.ordered ? 'ol' : 'ul';
          return (
            <Tag key={i} style={{ ...listBase, listStyle: b.ordered ? 'decimal' : 'disc' }}>
              {b.items.map((it, j) => (
                <li key={j} style={paragraphStyle}>
                  {it.title && <span style={{ fontWeight: 600, color: c.strong }}>{it.title} — </span>}
                  <span style={{ color: it.title ? c.muted : undefined }}>
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
          <p key={i} style={{ margin: 0, ...paragraphStyle, ...(b.small ? { fontSize: SIZES.small } : null) }}>
            <Inline text={b.text} />
          </p>
        );
      })}
    </div>
  );
}
