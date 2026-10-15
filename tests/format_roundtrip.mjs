/**
 * The write-up formats, without a browser:
 *   node tests/format_roundtrip.mjs
 *
 * The admin's editor saves HTML (since October 2026); write-ups saved before
 * that, and the seed copy in src/data, are the older plain-text format. These
 * checks cover the two places the formats meet: an old write-up opening in the
 * editor without losing a mark or a level, and the plain words of either kind
 * (used for meta descriptions) coming out without any markup.
 *
 * What the site draws from the HTML needs a browser (it rebuilds the elements
 * through the DOM), so it is not covered here.
 */
import { isHtml, toEditorHtml } from '../src/lib/richTextFormat.js';
import { parseRichText, richTextPlain } from '../src/lib/richTextParse.js';

let pass = 0, fail = 0;
const ok = (c, label) => { c ? pass++ : fail++; console.log((c ? 'OK   ' : 'FAIL ') + label); };

// An old plain-text write-up opening in the editor
const src = [
  'ABOUT US',
  'iConcepts + Partners is a **Multidisciplinary Design Studio** founded in 2007.',
  '- INTERIOR DESIGN — creating thoughtful environments',
  '- BESPOKE ELEMENTS — crafting distinctive furniture',
  '“Design is life—the beginning.”',
  '~ A smaller aside about the studio.',
  'Plain _italic_ and **bold** together, & <angle> brackets.',
].join('\n\n');

const html = toEditorHtml(src);
ok(html.includes('<h3>ABOUT US</h3>'), 'heading becomes h3');
ok(html.includes('<strong>Multidisciplinary Design Studio</strong>'), '**bold** becomes <strong>');
ok(html.includes('<em>italic</em>'), '_italic_ becomes <em>');
ok(html.includes('<ul>') && (html.match(/<li>/g) || []).length === 2, 'bullets become a <ul> of 2');
ok(html.includes('<strong>INTERIOR DESIGN</strong> — creating'), 'a list item\'s title opens bold, as the site drew it');
ok(html.includes('<blockquote>'), 'quoted paragraph becomes a blockquote');
ok(html.includes('<p data-size="small">'), '~ becomes a small paragraph');
ok(html.includes('&amp; &lt;angle&gt;'), 'text is escaped, never read as markup');

// HTML the editor saved goes back into it untouched
const saved = '<p style="text-align: center">Centred <u>words</u></p>';
ok(isHtml(saved) && !isHtml(src), 'HTML and the old format are told apart');
ok(toEditorHtml(saved) === saved, 'saved HTML opens in the editor as it is');
ok(toEditorHtml('') === '<p></p>', 'an empty field opens as one empty paragraph');

// Plain words, for meta descriptions
const plainOld = richTextPlain(src);
ok(!/\*\*|_italic_/.test(plainOld) && plainOld.includes('Multidisciplinary Design Studio'), 'old format: marks stripped, words kept');
ok(plainOld.split(/\n\s*\n/)[0] === 'ABOUT US', 'old format: paragraphs stay separated');
const plainNew = richTextPlain('<h3>The craft</h3><p style="text-align: justify">One &amp; <strong>two</strong>.</p><ul><li><p>A</p></li><li><p>B</p></li></ul><p>Last<br>line</p>');
ok(!/[<>]/.test(plainNew), 'HTML: no tags left');
ok(plainNew.split(/\n\s*\n/)[0] === 'The craft', 'HTML: first block on its own');
ok(plainNew.includes('One & two.'), 'HTML: entities decoded, inline tags dropped');
ok(plainNew.includes('A\nB'), 'HTML: list items one per line');
ok(plainNew.endsWith('Last line'), 'HTML: a line break reads as a space');
ok(richTextPlain(null) === '' && richTextPlain('') === '', 'empty in, empty out');

// The client's real copy in the seed still parses
const { about } = await import('../src/data/about.js');
const { default: categories } = await import('../src/data/categories.js');
ok(parseRichText(about.text).length > 0, 'about copy parses');
for (const c of categories) {
  ok(parseRichText(c.description).length > 0, `category "${c.label}" still parses`);
}
console.log(`\n${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
