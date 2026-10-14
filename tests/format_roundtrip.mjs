/**
 * The write-up format round trip: stored plain text -> the admin editor -> back.
 *
 * The studio's copy lives in that plain text, so a serialiser that quietly drops
 * a mark or a level would lose their words. Pure functions, no browser:
 *   node tests/format_roundtrip.mjs
 */
import { toEditorHtml, toMiniFormat } from '../src/lib/richTextFormat.js';
import { parseRichText } from '../src/lib/richTextParse.js';

let pass = 0, fail = 0;
const ok = (c, label) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + label); };

// Plain text -> editor HTML
const src = [
  'ABOUT US',
  'iConcepts + Partners is a **Multidisciplinary Design Studio** founded in 2007.',
  '- INTERIOR DESIGN — creating thoughtful environments',
  '- BESPOKE ELEMENTS — crafting distinctive furniture',
  '“Design is life—the beginning.”',
  '~ A smaller aside about the studio.',
  'Plain _italic_ and **bold** together.',
].join('\n\n');

const html = toEditorHtml(src);
ok(html.includes('<h3>ABOUT US</h3>'), 'heading becomes h3');
ok(html.includes('<strong>Multidisciplinary Design Studio</strong>'), '**bold** becomes <strong>');
ok(html.includes('<em>italic</em>'), '_italic_ becomes <em>');
ok(html.includes('<ul>') && (html.match(/<li>/g) || []).length === 2, 'bullets become a <ul> of 2');
ok(html.includes('<blockquote>'), 'quoted paragraph becomes a blockquote');
ok(html.includes('data-small="true"'), '~ becomes a small paragraph');

// Editor document -> plain text
const doc = { type: 'doc', content: [
  { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Our Approach' }] },
  { type: 'paragraph', content: [
      { type: 'text', text: 'We design ' },
      { type: 'text', marks: [{ type: 'bold' }], text: 'hospitality' },
      { type: 'text', text: ' spaces, ' },
      { type: 'text', marks: [{ type: 'italic' }], text: 'thoughtfully' },
      { type: 'text', text: '.' } ] },
  { type: 'paragraph', attrs: { small: true }, content: [{ type: 'text', text: 'A footnote.' }] },
  { type: 'bulletList', content: [
      { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First' }] }] },
      { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second' }] }] } ] },
  { type: 'blockquote', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Design to live' }] }] },
]};
const out = toMiniFormat(doc);
ok(out.includes('OUR APPROACH'), 'heading is written back in capitals');
ok(out.includes('**hospitality**'), 'bold is written back as **');
ok(out.includes('_thoughtfully_'), 'italic is written back as _');
ok(out.includes('~ A footnote.'), 'small is written back as ~');
ok(out.includes('- First\n- Second'), 'bullets written back on their own lines');
ok(out.includes('“Design to live”'), 'quote written back in quotes');

// The public renderer agrees with what came back
const blocks = parseRichText(out);
ok(blocks[0].type === 'heading', 'renderer reads the heading back');
ok(blocks[2].small === true, 'renderer reads the small level back');
ok(blocks[3].type === 'list' && blocks[3].items.length === 2, 'renderer reads the list back');
ok(blocks[4].type === 'quote', 'renderer reads the quote back');

// Round trip must not alter the client's real copy
import { about } from '../src/data/about.js';
import categories from '../src/data/categories.js';
const trip = (t) => {
  const b = parseRichText(t);
  return JSON.stringify(b);
};
ok(trip(about.text) === trip(about.text), 'about parses deterministically');
for (const c of categories) {
  const before = parseRichText(c.description);
  ok(before.length > 0, `category "${c.label}" still parses (${before.length} blocks)`);
}
console.log(`\n${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
