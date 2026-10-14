// Converting between the plain-text format the write-ups are stored in and the
// HTML/JSON the admin's editor works with. Pure functions, no React and no
// editor: the round trip is the part worth testing on its own.
import { parseRichText } from './richTextParse.js';

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
  const blocks = parseRichText(text);
  if (!blocks.length) return '<p></p>';
  return blocks
    .map((b) => {
      if (b.type === 'heading') return `<h3>${inlineToHtml(b.text)}</h3>`;
      if (b.type === 'quote') return `<blockquote><p>${inlineToHtml(b.text)}</p></blockquote>`;
      if (b.type === 'list') {
        const tag = b.ordered ? 'ol' : 'ul';
        const items = b.items
          // A list item written "TITLE — text" is drawn with the title bold;
          // it stays as plain text here so it survives the round trip.
          .map((it) => `<li><p>${inlineToHtml(it.title ? `${it.title} — ${it.text}` : it.text)}</p></li>`)
          .join('');
        return `<${tag}>${items}</${tag}>`;
      }
      return b.small
        ? `<p data-small="true">${inlineToHtml(b.text)}</p>`
        : `<p>${inlineToHtml(b.text)}</p>`;
    })
    .join('');
}

function inlineFromNode(node) {
  return (node.content ?? [])
    .map((child) => {
      if (child.type === 'hardBreak') return ' ';
      if (child.type !== 'text') return '';
      let out = child.text ?? '';
      const marks = (child.marks ?? []).map((m) => m.type);
      // Italic inside bold rather than the other way round, so the markers
      // nest the same way every time and re-parse cleanly.
      if (marks.includes('italic')) out = `_${out}_`;
      if (marks.includes('bold')) out = `**${out}**`;
      return out;
    })
    .join('');
}

export function toMiniFormat(doc) {
  const blocks = [];
  for (const node of doc?.content ?? []) {
    if (node.type === 'heading') {
      // Headings are set in capitals across the site, and the stored format
      // recognises them by that, so the editor commits to it.
      const text = inlineFromNode(node).trim();
      if (text) blocks.push(text.toUpperCase());
      continue;
    }
    if (node.type === 'blockquote') {
      const text = (node.content ?? []).map(inlineFromNode).join(' ').trim();
      if (text) blocks.push(`“${text}”`);
      continue;
    }
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      const ordered = node.type === 'orderedList';
      const items = (node.content ?? [])
        .map((li, i) => {
          const text = (li.content ?? []).map(inlineFromNode).join(' ').trim();
          return text ? `${ordered ? `${i + 1}.` : '-'} ${text}` : '';
        })
        .filter(Boolean);
      if (items.length) blocks.push(items.join('\n'));
      continue;
    }
    const text = inlineFromNode(node).trim();
    if (text) blocks.push(node.attrs?.small ? `~ ${text}` : text);
  }
  return blocks.join('\n\n');
}
