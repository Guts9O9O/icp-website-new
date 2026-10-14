import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import site from './src/data/site.js';

// Dev-only stand-in for the Google Apps Script enquiry endpoint. It applies
// the same rules as apps-script/Code.gs, logs the enquiry to the terminal,
// mirrors it into the local Supabase `enquiries` table (when the service key
// is in .env.local) and answers with the same JSON shape — so the whole flow
// can be tested without deploying to Google. Not part of the production build.
function enquiryMock(env) {
  const SUBJECTS = {
    'Design Request': ['Hospitality', 'Builders & Developers', 'Commercial', 'Private Residence'],
    'Staff Recruitment': ['Interior Designer', '3D Developer', 'Graphics Designer'],
    Other: [],
  };
  const kindOf = (subject) => (subject === 'Staff Recruitment' ? 'recruitment' : 'lead');

  async function mirrorToCms(p, kind) {
    const url = env.VITE_SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return 'skipped (no SUPABASE_SERVICE_ROLE_KEY in .env.local)';
    const res = await fetch(`${url}/rest/v1/enquiries`, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({
        kind,
        subject: p.subject,
        detail: p.detail || null,
        name: p.name,
        company: p.company || null,
        email: String(p.email).toLowerCase(),
        zip: p.zip || null,
        address: [p.address1, p.address2].filter(Boolean).join(', ') || null,
        requirement: p.requirement,
        page: p.page || null,
        user_agent: p.userAgent || null,
      }),
    });
    return res.ok ? 'saved to CMS' : `CMS insert failed: ${res.status}`;
  }

  // The inbox the real script would email, from the same contact settings.
  async function recipientFor(subject) {
    const url = env.VITE_SUPABASE_URL;
    const key = env.VITE_SUPABASE_ANON_KEY;
    let contact = site;
    if (url && key) {
      const res = await fetch(`${url}/rest/v1/site_settings?select=value&key=eq.contact`, { headers: { apikey: key, Authorization: `Bearer ${key}` } });
      if (res.ok) contact = (await res.json())[0]?.value ?? site;
    }
    return (subject === 'Design Request' && contact.designEmail) || contact.email;
  }

  return {
    name: 'icp-enquiry-mock',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/enquiry', (req, res) => {
        const reply = (obj) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };
        if (req.method !== 'POST') return reply({ ok: true, service: 'icp-enquiry (dev mock)' });
        let raw = '';
        req.on('data', (c) => (raw += c));
        req.on('end', async () => {
          let p;
          try {
            p = JSON.parse(raw);
          } catch {
            return reply({ ok: false, error: 'Bad request.' });
          }
          if (p.website) return reply({ ok: true }); // honeypot
          if (!SUBJECTS[p.subject]) return reply({ ok: false, error: 'Please choose a subject.' });
          if (SUBJECTS[p.subject].length && !SUBJECTS[p.subject].includes(p.detail)) return reply({ ok: false, error: 'Please choose an option for the subject.' });
          if (!String(p.name || '').trim()) return reply({ ok: false, error: 'Please enter your name.' });
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(p.email || ''))) return reply({ ok: false, error: 'Please enter a valid email address.' });
          if (!String(p.requirement || '').trim()) return reply({ ok: false, error: 'Please tell us a little about your requirement.' });
          if (/^fail@/.test(p.email)) return reply({ ok: false, error: 'Something went wrong on our side. Please email us directly.' });
          const kind = kindOf(p.subject);
          const mirrored = await mirrorToCms(p, kind).catch((e) => `CMS insert error: ${e.message}`);
          const to = await recipientFor(p.subject).catch((e) => `(lookup failed: ${e.message})`);
          console.log(`\n[enquiry mock] ${kind}: ${p.subject}${p.detail ? ' / ' + p.detail : ''} from ${p.name} <${p.email}> — would email ${to}; ${mirrored}`);
          reply({ ok: true, kind });
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), enquiryMock(env)],
  };
});
