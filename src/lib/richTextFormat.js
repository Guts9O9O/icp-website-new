// Opening the older plain-text write-ups in the admin's editor. Since October
// 2026 the editor saves HTML; a write-up saved before that is converted here
// as it opens, and stays in the old format until someone edits it.
// Pure functions, no React and no editor, so it can be tested on its own.
import { isHtml, parseRichText } from './richTextParse.js';

export { isHtml };

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// **bold** / _italic_ -> tags. The text itself is escaped first, so content is
// never interpreted as markup.
function inlineToHtml(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>');
}

export function toEditorHtml(text) {
  if (isHtml(text)) return text;
  const blocks = parseRichText(text);
  if (!blocks.length) return '<p></p>';
  return blocks
    .map((b) => {
      if (b.type === 'heading') return `<h3>${inlineToHtml(b.text)}</h3>`;
      if (b.type === 'quote') return `<blockquote><p>${inlineToHtml(b.text)}</p></blockquote>`;
      if (b.type === 'list') {
        const tag = b.ordered ? 'ol' : 'ul';
        const items = b.items
          // A list item written "TITLE — text" was drawn with the title bold,
          // so it opens that way.
          .map((it) => `<li><p>${it.title ? `<strong>${inlineToHtml(it.title)}</strong> — ` : ''}${inlineToHtml(it.text)}</p></li>`)
          .join('');
        return `<${tag}>${items}</${tag}>`;
      }
      return b.small ? `<p data-size="small">${inlineToHtml(b.text)}</p>` : `<p>${inlineToHtml(b.text)}</p>`;
    })
    .join('');
}
