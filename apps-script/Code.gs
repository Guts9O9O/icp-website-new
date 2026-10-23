/**
 * iConcepts + Partners — enquiry form backend.
 *
 * A Google Apps Script web app running in the studio's own Google account.
 * The website posts each form submission here. Depending on the subject the
 * enquiry is a LEAD (Design Request, Collaboration) or a RECRUITMENT application
 * (Staff Recruitment), and each kind has its own Google Sheet, its own
 * notification address and its own page in the website's admin panel.
 *
 * For every submission the script:
 *   1. validates it (required fields, email format, honeypot, rate limit),
 *   2. appends a row to that kind's Google Sheet,
 *   3. emails the studio (reply-to = the sender): design requests to the
 *      design address, everything else to the studio address, both set in the
 *      website admin (see recipientFor),
 *   4. emails the sender a short acknowledgement,
 *   5. mirrors it into the website CMS (Supabase) so it shows in the admin.
 *
 * One-time setup: run `setup()` from the editor (creates the two sheets and
 * stores their IDs), then `sendTestEnquiry()`. See SETUP.md.
 *
 * Script properties (Project Settings → Script properties):
 *   NOTIFY_TO_LEADS        fallback for leads when the website database cannot be read
 *   NOTIFY_TO_RECRUITMENT  fallback for job applications (defaults to NOTIFY_TO_LEADS)
 *   FROM_NAME              sender name on emails (default: iConcepts + Partners)
 *   STUDIO_PHONE           shown in the acknowledgement email (optional)
 *   LEADS_SHEET_ID / RECRUITMENT_SHEET_ID   set automatically by setup()
 *   SUPABASE_URL / SUPABASE_SERVICE_KEY     website database (optional; enables the CMS mirror)
 */

var LIMITS = {
  perEmailPerHour: 5,
  perDay: 200,
  maxLen: { name: 120, company: 160, email: 200, zip: 20, address: 400, requirement: 4000, subject: 60, detail: 60 },
};

var SUBJECTS = {
  'Design Request': ['Hospitality', 'Builders & Developers', 'Commercial', 'Private Residence'],
  'Staff Recruitment': ['Interior Designer', '3D Developer', 'Graphics Designer'],
  Collaboration: [], // the website's "Other" became "Collaboration" in October 2026
  Other: [], // still accepted, for any page or sheet that sends the old name
};

var KINDS = {
  lead: {
    title: 'Website Leads',
    sheetProp: 'LEADS_SHEET_ID',
    notifyProp: 'NOTIFY_TO_LEADS',
    detailHeader: 'Category',
    headers: ['Received', 'Subject', 'Category', 'Name', 'Company', 'Email', 'Zip code', 'Address', 'Requirement', 'Status', 'Page', 'User agent'],
  },
  recruitment: {
    title: 'Website Recruitment',
    sheetProp: 'RECRUITMENT_SHEET_ID',
    notifyProp: 'NOTIFY_TO_RECRUITMENT',
    detailHeader: 'Position',
    headers: ['Received', 'Subject', 'Position', 'Name', 'Company', 'Email', 'Zip code', 'Address', 'Message', 'Status', 'Page', 'User agent'],
  },
};

// Which kind an enquiry is, from its subject.
function kindOf(subject) {
  return subject === 'Staff Recruitment' ? 'recruitment' : 'lead';
}

// ---------------------------------------------------------------------------
// Web app entry points
// ---------------------------------------------------------------------------
function doGet() {
  return respond({ ok: true, service: 'icp-enquiry' });
}

function doPost(e) {
  try {
    var payload = parseBody(e);
    var check = validate(payload);
    if (!check.ok) return respond({ ok: false, error: check.error });

    // Honeypot filled in → a bot. Pretend success, do nothing.
    if (payload.website) return respond({ ok: true });

    var entry = check.entry;
    var limited = rateLimited(entry.email);
    if (limited) return respond({ ok: false, error: limited });

    appendRow(entry);
    notifyStudio(entry);
    acknowledgeSender(entry);
    mirrorToCms(entry); // best-effort; failures are logged, never shown to the visitor
    return respond({ ok: true, kind: entry.kind });
  } catch (err) {
    console.error(err);
    return respond({ ok: false, error: 'Something went wrong on our side. Please email us directly.' });
  }
}

// ---------------------------------------------------------------------------
// Validation (pure — no Google services; covered by apps-script/test.mjs)
// ---------------------------------------------------------------------------
function validate(p) {
  p = p || {};
  var entry = {
    subject: clean(p.subject, LIMITS.maxLen.subject),
    detail: clean(p.detail, LIMITS.maxLen.detail),
    name: clean(p.name, LIMITS.maxLen.name),
    company: clean(p.company, LIMITS.maxLen.company),
    email: clean(p.email, LIMITS.maxLen.email).toLowerCase(),
    zip: clean(p.zip, LIMITS.maxLen.zip),
    address: clean([p.address1, p.address2].filter(Boolean).join(', '), LIMITS.maxLen.address),
    requirement: clean(p.requirement, LIMITS.maxLen.requirement),
    page: clean(p.page, 300),
    userAgent: clean(p.userAgent, 300),
  };

  if (!SUBJECTS.hasOwnProperty(entry.subject)) return { ok: false, error: 'Please choose a subject.' };
  var details = SUBJECTS[entry.subject];
  if (details.length && details.indexOf(entry.detail) === -1) return { ok: false, error: 'Please choose an option for the subject.' };
  if (!details.length) entry.detail = '';
  if (!entry.name) return { ok: false, error: 'Please enter your name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(entry.email)) return { ok: false, error: 'Please enter a valid email address.' };
  if (!entry.requirement) return { ok: false, error: 'Please tell us a little about your requirement.' };

  entry.kind = kindOf(entry.subject);
  return { ok: true, entry: entry };
}

function clean(value, max) {
  if (value === undefined || value === null) return '';
  var s = String(value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();
  return s.length > max ? s.slice(0, max) : s;
}

function parseBody(e) {
  var raw = e && e.postData && e.postData.contents;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (err) {
      // fall through to form parameters
    }
  }
  return (e && e.parameter) || {};
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------
function props() {
  return PropertiesService.getScriptProperties();
}

function settings(kind) {
  var p = props();
  var leads = p.getProperty('NOTIFY_TO_LEADS') || Session.getEffectiveUser().getEmail();
  return {
    notifyTo: (kind === 'recruitment' && p.getProperty('NOTIFY_TO_RECRUITMENT')) || leads,
    fromName: p.getProperty('FROM_NAME') || 'iConcepts + Partners',
    phone: p.getProperty('STUDIO_PHONE') || '',
  };
}

// Who an enquiry is emailed to. The website's admin holds the addresses (Site
// text & contact): design requests go to `designEmail`, everything else to the
// studio `email` (the only one the Enquiry page shows). The address is never
// taken from the form itself, or anyone could aim the form at any inbox.
// If the website database cannot be reached, the NOTIFY_TO_… properties still
// deliver it.
function recipientFor(entry) {
  return pickRecipient(entry.subject, siteContact()) || settings(entry.kind).notifyTo;
}

// Pure, so apps-script/test.mjs can check it.
function pickRecipient(subject, contact) {
  contact = contact || {};
  var candidates = subject === 'Design Request' ? [contact.designEmail, contact.email] : [contact.email];
  for (var i = 0; i < candidates.length; i++) {
    var to = String(candidates[i] || '').trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return to;
  }
  return '';
}

// The contact settings, read fresh for each enquiry so a change in the admin
// applies to the very next one. Enquiries are few; the lookup is cheap.
function siteContact() {
  var url = props().getProperty('SUPABASE_URL');
  var key = props().getProperty('SUPABASE_SERVICE_KEY');
  if (!url || !key) return null;
  try {
    var res = UrlFetchApp.fetch(url.replace(/\/$/, '') + '/rest/v1/site_settings?select=value&key=eq.contact', {
      headers: { apikey: key, Authorization: 'Bearer ' + key },
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() >= 300) {
      console.error('Contact lookup failed: ' + res.getResponseCode() + ' ' + res.getContentText());
      return null;
    }
    var rows = JSON.parse(res.getContentText());
    return rows.length ? rows[0].value : null;
  } catch (err) {
    console.error('Contact lookup failed: ' + err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Rate limiting (CacheService: per-email/hour; PropertiesService: per-day)
// ---------------------------------------------------------------------------
function rateLimited(email) {
  var cache = CacheService.getScriptCache();
  var key = 'e:' + Utilities.base64EncodeWebSafe(email);
  var count = Number(cache.get(key) || 0);
  if (count >= LIMITS.perEmailPerHour) return 'You have sent several enquiries recently — please try again in an hour, or email us directly.';
  cache.put(key, String(count + 1), 3600);

  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var dayKey = 'day:' + today;
  var dayCount = Number(props().getProperty(dayKey) || 0);
  if (dayCount >= LIMITS.perDay) return 'We are receiving a lot of enquiries right now — please email us directly.';
  props().setProperty(dayKey, String(dayCount + 1));
  return null;
}

// ---------------------------------------------------------------------------
// Sheets — one spreadsheet per kind, created by setup()
// ---------------------------------------------------------------------------
function ensureSpreadsheet(kind) {
  var cfg = KINDS[kind];
  var id = props().getProperty(cfg.sheetProp);
  var ss = null;
  if (id) {
    try {
      ss = SpreadsheetApp.openById(id);
    } catch (err) {
      ss = null; // deleted or moved — recreate below
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(cfg.title);
    props().setProperty(cfg.sheetProp, ss.getId());
  }
  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.setName(cfg.title);
    sheet.appendRow(cfg.headers);
    sheet.getRange(1, 1, 1, cfg.headers.length).setFontWeight('bold').setBackground('#781f1c').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(9, 400);
  }
  return ss;
}

function getSheet(kind) {
  return ensureSpreadsheet(kind).getSheets()[0];
}

function appendRow(entry) {
  getSheet(entry.kind).appendRow([
    new Date(),
    entry.subject,
    entry.detail,
    entry.name,
    entry.company,
    entry.email,
    entry.zip,
    entry.address,
    entry.requirement,
    'New',
    entry.page,
    entry.userAgent,
  ]);
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------
function notifyStudio(entry) {
  var s = settings(entry.kind);
  var isJob = entry.kind === 'recruitment';
  var subject = isJob
    ? '[Website application] ' + entry.detail + ' — ' + entry.name
    : '[Website lead] ' + entry.subject + (entry.detail ? ' · ' + entry.detail : '') + ' — ' + entry.name;
  var rows = [
    ['Subject', entry.subject + (entry.detail ? ' / ' + entry.detail : '')],
    ['Name', entry.name],
    ['Company', entry.company || '—'],
    ['Email', entry.email],
    ['Zip code', entry.zip || '—'],
    ['Address', entry.address || '—'],
    [isJob ? 'Message' : 'Requirement', entry.requirement],
  ];
  var html =
    '<div style="font-family:Segoe UI,Arial,sans-serif;font-size:14px;color:#47433e">' +
    '<p style="margin:0 0 16px">' + (isJob ? 'New job application from the website.' : 'New enquiry from the website.') + '</p>' +
    '<table cellpadding="6" style="border-collapse:collapse">' +
    rows
      .map(function (r) {
        return (
          '<tr><td style="color:#66594d;vertical-align:top;white-space:nowrap"><b>' + escapeHtml(r[0]) + '</b></td>' +
          '<td style="border-left:2px solid #781f1c;white-space:pre-wrap">' + escapeHtml(r[1]) + '</td></tr>'
        );
      })
      .join('') +
    '</table>' +
    '<p style="margin:20px 0 0;color:#66594d;font-size:12px">Reply to this email to answer ' + escapeHtml(entry.name) +
    ' directly. A copy is saved in the “' + KINDS[entry.kind].title + '” sheet and in the website admin.</p></div>';

  MailApp.sendEmail({
    to: recipientFor(entry),
    replyTo: entry.email,
    name: s.fromName + ' website',
    subject: subject,
    htmlBody: html,
    body: rows.map(function (r) { return r[0] + ': ' + r[1]; }).join('\n'),
  });
}

function acknowledgeSender(entry) {
  var s = settings(entry.kind);
  var isJob = entry.kind === 'recruitment';
  var body =
    'Dear ' + entry.name + ',\n\n' +
    (isJob
      ? 'Thank you for your interest in joining iConcepts + Partners. We have received your application for the ' + entry.detail + ' position and will be in touch if there is a suitable opening.'
      : 'Thank you for getting in touch with iConcepts + Partners. We have received your enquiry' +
        (entry.subject === 'Design Request' ? ' regarding a ' + entry.detail.toLowerCase() + ' project' : '') +
        ' and will get back to you shortly.') +
    '\n\n' +
    (s.phone && !isJob ? 'For anything urgent, call us on ' + s.phone + '.\n\n' : '') +
    'Warm regards,\nTeam iC+P\ndesign to live';
  MailApp.sendEmail({
    to: entry.email,
    name: s.fromName,
    subject: isJob ? 'Your application — iConcepts + Partners' : 'Thank you for your enquiry — iConcepts + Partners',
    body: body,
    noReply: true,
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

// ---------------------------------------------------------------------------
// CMS mirror (Supabase `enquiries` table) — optional, best-effort
// ---------------------------------------------------------------------------
function mirrorToCms(entry) {
  var url = props().getProperty('SUPABASE_URL');
  var key = props().getProperty('SUPABASE_SERVICE_KEY');
  if (!url || !key) return;
  var res = UrlFetchApp.fetch(url.replace(/\/$/, '') + '/rest/v1/enquiries', {
    method: 'post',
    contentType: 'application/json',
    headers: { apikey: key, Authorization: 'Bearer ' + key, Prefer: 'return=minimal' },
    payload: JSON.stringify({
      kind: entry.kind,
      subject: entry.subject,
      detail: entry.detail || null,
      name: entry.name,
      company: entry.company || null,
      email: entry.email,
      zip: entry.zip || null,
      address: entry.address || null,
      requirement: entry.requirement,
      page: entry.page || null,
      user_agent: entry.userAgent || null,
    }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() >= 300) console.error('CMS mirror failed: ' + res.getResponseCode() + ' ' + res.getContentText());
}

// ---------------------------------------------------------------------------
// One-time setup and manual test — run these from the Apps Script editor
// ---------------------------------------------------------------------------
function setup() {
  var leads = ensureSpreadsheet('lead');
  var jobs = ensureSpreadsheet('recruitment');
  var p = props();
  if (!p.getProperty('FROM_NAME')) p.setProperty('FROM_NAME', 'iConcepts + Partners');
  if (!p.getProperty('NOTIFY_TO_LEADS')) p.setProperty('NOTIFY_TO_LEADS', Session.getEffectiveUser().getEmail());
  Logger.log('Leads sheet:       ' + leads.getUrl());
  Logger.log('Recruitment sheet: ' + jobs.getUrl());
  Object.keys(SUBJECTS).forEach(function (subject) {
    Logger.log(subject + ' enquiries go to: ' + recipientFor({ subject: subject, kind: kindOf(subject) }));
  });
}

function sendTestEnquiry() {
  var me = Session.getEffectiveUser().getEmail();
  ['Design Request', 'Staff Recruitment'].forEach(function (subject) {
    var out = doPost({
      postData: {
        contents: JSON.stringify({
          subject: subject,
          detail: subject === 'Design Request' ? 'Hospitality' : '3D Developer',
          name: 'Test Person',
          company: 'Test Co',
          email: me,
          zip: '400068',
          address1: 'Dahisar East',
          requirement: 'This is a test ' + (subject === 'Design Request' ? 'enquiry' : 'application') + ' sent from the Apps Script editor.',
          page: 'manual-test',
        }),
      },
    }).getContent();
    Logger.log(subject + ' -> ' + out);
  });
}
