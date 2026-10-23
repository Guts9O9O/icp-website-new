// Runs the pure parts of Code.gs (validate, parseBody, escapeHtml) in Node so
// the rules can be checked without deploying to Google.  node apps-script/test.mjs
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const src = await readFile(new URL('./Code.gs', import.meta.url), 'utf8');
const sandbox = {};
new Function('ContentService', 'CacheService', 'PropertiesService', 'SpreadsheetApp', 'MailApp', 'Session', 'Utilities', 'console',
  src + '\nthis.validate = validate; this.parseBody = parseBody; this.escapeHtml = escapeHtml; this.SUBJECTS = SUBJECTS; this.kindOf = kindOf; this.pickRecipient = pickRecipient;'
).call(sandbox, {}, {}, {}, {}, {}, {}, {}, console);

const { validate, parseBody, escapeHtml, kindOf, pickRecipient } = sandbox;
const good = { subject: 'Design Request', detail: 'Hospitality', name: ' Asha ', company: 'X', email: 'Asha@Example.com', zip: '400068', address1: 'Line 1', address2: 'Line 2', requirement: 'Need a lobby redesign.' };

let n = 0;
const t = (label, fn) => { fn(); n++; console.log('ok  ', label); };

t('valid entry is accepted and normalised', () => {
  const r = validate(good);
  assert.equal(r.ok, true);
  assert.equal(r.entry.kind, 'lead');
  assert.equal(r.entry.name, 'Asha');
  assert.equal(r.entry.email, 'asha@example.com');
  assert.equal(r.entry.address, 'Line 1, Line 2');
});
t('kind: Staff Recruitment -> recruitment, everything else -> lead', () => {
  assert.equal(kindOf('Staff Recruitment'), 'recruitment');
  assert.equal(kindOf('Design Request'), 'lead');
  assert.equal(kindOf('Other'), 'lead');
  assert.equal(validate({ ...good, subject: 'Staff Recruitment', detail: '3D Developer' }).entry.kind, 'recruitment');
});
t('unknown subject rejected', () => assert.equal(validate({ ...good, subject: 'Hack' }).ok, false));
t('detail must belong to the subject', () => assert.equal(validate({ ...good, subject: 'Staff Recruitment', detail: 'Hospitality' }).ok, false));
t('"Collaboration" is a lead with no detail', () => {
  const r = validate({ ...good, subject: 'Collaboration', detail: 'anything' });
  assert.equal(r.ok, true); assert.equal(r.entry.detail, ''); assert.equal(r.entry.kind, 'lead');
});
t('"Other" needs no detail and clears it', () => {
  const r = validate({ ...good, subject: 'Other', detail: 'anything' });
  assert.equal(r.ok, true); assert.equal(r.entry.detail, '');
});
t('missing name rejected', () => assert.match(validate({ ...good, name: '  ' }).error, /name/i));
t('bad email rejected', () => assert.match(validate({ ...good, email: 'not-an-email' }).error, /email/i));
t('missing requirement rejected', () => assert.match(validate({ ...good, requirement: '' }).error, /requirement/i));
t('over-long fields are truncated, not rejected', () => {
  const r = validate({ ...good, requirement: 'x'.repeat(5000) });
  assert.equal(r.ok, true); assert.equal(r.entry.requirement.length, 4000);
});
t('control characters stripped', () => assert.equal(validate({ ...good, name: 'A\u0000b\u0007c' }).entry.name, 'Abc'));
t('parseBody prefers JSON body, falls back to form params', () => {
  assert.deepEqual(parseBody({ postData: { contents: '{"a":1}' } }), { a: 1 });
  assert.deepEqual(parseBody({ postData: { contents: 'not json' }, parameter: { b: 2 } }), { b: 2 });
  assert.deepEqual(parseBody(undefined), {});
});
t('design requests go to the design inbox, everything else to the studio', () => {
  const contact = { email: 'studio@icp.firm.in', designEmail: 'imran@icp.firm.in' };
  assert.equal(pickRecipient('Design Request', contact), 'imran@icp.firm.in');
  assert.equal(pickRecipient('Staff Recruitment', contact), 'studio@icp.firm.in');
  assert.equal(pickRecipient('Other', contact), 'studio@icp.firm.in');
});
t('no usable design address falls back to the studio, nothing usable to the properties', () => {
  assert.equal(pickRecipient('Design Request', { email: 'studio@icp.firm.in' }), 'studio@icp.firm.in');
  assert.equal(pickRecipient('Design Request', { email: 'studio@icp.firm.in', designEmail: 'not an email' }), 'studio@icp.firm.in');
  assert.equal(pickRecipient('Design Request', { designEmail: ' imran@icp.firm.in ' }), 'imran@icp.firm.in');
  assert.equal(pickRecipient('Staff Recruitment', { designEmail: 'imran@icp.firm.in' }), '');
  assert.equal(pickRecipient('Design Request', null), '');
});
t('escapeHtml neutralises markup', () => assert.equal(escapeHtml('<b>"x" & \'y\'</b>'), '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;'));

console.log(`\n${n} checks passed`);
