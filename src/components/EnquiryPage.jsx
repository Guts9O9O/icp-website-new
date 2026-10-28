import { useEffect, useRef, useState } from 'react';
import { getSite } from '../lib/api';
import { SUBJECTS, sendEnquiry, validateEnquiry } from '../lib/enquiry';
import { useData } from '../lib/useData';
import { useMediaQuery } from '../lib/useMediaQuery';
import { EDGE_BAR, PORTRAIT_QUERY, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';

const EMPTY = {
  subject: 'Design Request',
  detail: 'Hospitality',
  name: '',
  company: '',
  email: '',
  zip: '',
  address1: '',
  address2: '',
  requirement: '',
};

// Geometry from R3 (design px).
const FORM_TOP = 408;
const FORM_LEFT = 251;
const LABEL_W = 317;
const FIELD_W = 715;
const FIELD_H = 54;
const ROW_GAP = 46;

const fieldClass =
  'w-full border border-icp-mist bg-white text-icp-slate outline-none placeholder:text-icp-mist focus:border-icp-taupe';
// Portrait tablets: the contact block moves under the form, so the form is
// packed tighter to leave room for it above the footer.
const PORTRAIT = { formTop: 300, fieldH: 46, rowGap: 22, textareaH: 110 };
const LANDSCAPE = { formTop: FORM_TOP, fieldH: FIELD_H, rowGap: ROW_GAP, textareaH: 158 };

// Fields never stand shorter than FIELD_MIN CSS px. At R3's proportions a
// short screen drew them 15-18px tall — on a tablet, too small to tap, and the
// dropdowns cut off the foot of their own text. Each row keeps R3's pitch
// (field + gap), so what a field gains comes out of the gap below it and the
// form is no taller; screens with room keep R3's sizes exactly.
const FIELD_MIN = 28;
const TEXTAREA_MIN = 56;
const fieldH = (m) => `max(${v(m.fieldH)}, ${FIELD_MIN}px)`;
const rowGap = (m) => `max(calc(${v(m.fieldH + m.rowGap)} - ${fieldH(m)}), 8px)`;
const fieldStyle = (m) => ({ height: fieldH(m), paddingLeft: u(16), paddingRight: u(16), fontSize: fs(18, 13) });

function Row({ label, children, align = 'center', gap }) {
  return (
    <div className={`flex ${align === 'start' ? 'items-start' : 'items-center'}`} style={{ marginBottom: gap }}>
      <label className="t-strong shrink-0 text-icp-taupe" style={{ width: u(LABEL_W), fontSize: fs(18, 13) }}>
        {label}
      </label>
      <div className="flex" style={{ width: u(FIELD_W), gap: u(10) }}>
        {children}
      </div>
    </div>
  );
}

function Select({ value, onChange, options, style, field }) {
  return (
    <div className="relative" style={style}>
      <select
        value={value}
        onChange={onChange}
        // `block`: inline, the select sat on a text line taller than itself,
        // and the arrow box (sized to the wrapper) hung below the field.
        className={`${fieldClass} block appearance-none`}
        style={{ ...field, paddingRight: u(70) }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center border-l border-icp-mist"
        style={{ width: u(50) }}
      >
        <span
          className="block border-x-transparent border-b-transparent border-t-icp-red"
          style={{ borderWidth: `${u(10)} ${u(8)} 0 ${u(8)}`, borderStyle: 'solid' }}
        />
      </span>
    </div>
  );
}

const ICON_W = 45; // the round contact icons
const ICON_GAP = 42; // icon to its text

// The studio's own Google Maps listing, "iConcepts+Partners", from the link the
// client sent. A /maps/place link cannot be framed, so the embed searches the
// listing's name around its coordinates, which pins the listing itself, named.
// Searching the street address pinned nothing at the studio.
const MAP_EMBED =
  'https://www.google.com/maps?q=iConcepts%2BPartners&ll=19.2563256,72.8716291&z=17&output=embed';

function ContactIcon({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="shrink-0 object-contain"
      style={{ width: u(ICON_W), height: u(ICON_W), minWidth: 26, minHeight: 26 }}
    />
  );
}

function SocialLink({ social }) {
  return (
    <a
      href={social.href}
      target="_blank"
      rel="noreferrer"
      aria-label={social.name}
      className="group relative block shrink-0"
      style={{ width: u(ICON_W), height: u(ICON_W), minWidth: 26, minHeight: 26 }}
    >
      {/* One image: the supplied artwork is a single red disc per network, so
          there is nothing to cross-fade to. Hovering lifts it instead. */}
      <img
        src={social.icon}
        alt=""
        className="absolute inset-0 h-full w-full object-contain transition-opacity duration-200 group-hover:opacity-70"
      />
    </a>
  );
}

export default function EnquiryPage() {
  useSeo({ title: 'Enquiry', description: 'Get in touch with iConcepts + Partners for design requests or career opportunities. Studio in Dahisar East, Mumbai.' });
  const { data: site } = useData(getSite);
  const portrait = useMediaQuery(PORTRAIT_QUERY);
  const m = portrait ? PORTRAIT : LANDSCAPE;
  const field = fieldStyle(m);
  const gap = rowGap(m);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle' }); // idle | sending | sent | error
  const [website, setWebsite] = useState(''); // honeypot: humans never see or fill this
  const openedAt = useRef(0);
  useEffect(() => {
    openedAt.current = Date.now();
  }, []);
  const detailOptions = SUBJECTS[form.subject] ?? [];
  // Always the studio's own address, whatever the subject. Design requests
  // are still emailed to the design inbox (apps-script/Code.gs routes them),
  // but the client wants only the studio address shown on the page.
  const email = site?.email ?? '';

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };
  const setSubject = (e) => {
    const subject = e.target.value;
    setForm((f) => ({ ...f, subject, detail: SUBJECTS[subject][0] ?? '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (status.state === 'sending') return;
    const problems = validateEnquiry(form);
    setErrors(problems);
    if (Object.keys(problems).length) return;
    // A form completed in under two seconds is a bot: treat like the honeypot.
    if (website || Date.now() - openedAt.current < 2000) {
      setStatus({ state: 'sent' });
      return;
    }
    setStatus({ state: 'sending' });
    try {
      await sendEnquiry({ ...form, website });
      setStatus({ state: 'sent' });
      setForm(EMPTY);
    } catch (err) {
      setStatus({ state: 'error', message: err.message });
    }
  };

  const errorText = (key) =>
    errors[key] ? (
      <span className="absolute left-0 top-full text-icp-red" style={{ fontSize: fs(14, 11), marginTop: v(4) }}>
        {errors[key]}
      </span>
    ) : null;

  return (
    <div className="relative min-h-page bg-icp-paper font-brand">
      <EdgeBars />
      <SiteNav rightTitle="Enquiry" tone="light" />

      <main className="absolute left-0 right-0 tall:flex tall:flex-col" style={{ top: v(m.formTop), paddingLeft: u(FORM_LEFT) }}>
        <form onSubmit={onSubmit} className="absolute tall:static" style={{ left: u(FORM_LEFT) }} noValidate>
          <Row label="Subject" gap={gap}>
            <Select
              value={form.subject}
              onChange={setSubject}
              options={Object.keys(SUBJECTS)}
              style={{ width: detailOptions.length ? u(459) : '100%' }}
              field={field}
            />
            {detailOptions.length > 0 && (
              <Select value={form.detail} onChange={set('detail')} options={detailOptions} style={{ flex: 1 }} field={field} />
            )}
          </Row>

          <Row label="Your Name" gap={gap}>
            <span className="relative flex-1">
              <input className={`${fieldClass} ${errors.name ? '!border-icp-red' : ''}`} style={field} value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
              {errorText('name')}
            </span>
          </Row>

          <Row label="Company Name" gap={gap}>
            <input className={fieldClass} style={field} value={form.company} onChange={set('company')} autoComplete="organization" />
          </Row>

          <Row label="Email Address" gap={gap}>
            <span className="relative flex-1">
              <input className={`${fieldClass} ${errors.email ? '!border-icp-red' : ''}`} style={field} type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
              {errorText('email')}
            </span>
          </Row>

          <Row
            gap={gap}
            label={
              <span className="flex" style={{ gap: u(48) }}>
                <span>Zip Code</span>
                <span>Address</span>
              </span>
            }
          >
            <input
              className={`${fieldClass} text-center`}
              style={{ ...field, width: u(221), flex: 'none' }}
              placeholder="Zip Code"
              value={form.zip}
              onChange={set('zip')}
              autoComplete="postal-code"
            />
            <input
              className={`${fieldClass} text-center`}
              style={{ ...field, flex: 1 }}
              placeholder="Address"
              value={form.address1}
              onChange={set('address1')}
              autoComplete="address-line1"
            />
          </Row>

          <Row label="" gap={gap}>
            <input
              className={`${fieldClass} text-center`}
              style={field}
              placeholder="Address"
              value={form.address2}
              onChange={set('address2')}
              autoComplete="address-line2"
            />
          </Row>

          <Row label="Requirement" align="start" gap={gap}>
            <span className="relative flex-1">
              <textarea
                className={`${fieldClass} resize-none ${errors.requirement ? '!border-icp-red' : ''}`}
                style={{ ...field, height: `max(${v(m.textareaH)}, ${TEXTAREA_MIN}px)`, paddingTop: v(12) }}
                value={form.requirement}
                onChange={set('requirement')}
                aria-invalid={!!errors.requirement}
              />
              {errorText('requirement')}
            </span>
          </Row>

          {/* Honeypot: off-screen, not focusable; bots that fill every field reveal themselves. */}
          <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </label>
          </div>

          <div className="flex items-center justify-end" style={{ width: u(LABEL_W + FIELD_W), gap: u(30) }}>
            {status.state === 'sent' && (
              <p className="text-icp-taupe" style={{ fontSize: fs(16, 12) }} role="status">
                Thank you — your enquiry has been sent. We will get back to you shortly.
              </p>
            )}
            {status.state === 'error' && (
              <p className="text-icp-red" style={{ fontSize: fs(16, 12) }} role="alert">
                {status.message} {email && <>You can also email us at <a href={`mailto:${email}`} className="underline">{email}</a>.</>}
              </p>
            )}
            <button
              type="submit"
              disabled={status.state === 'sending'}
              className="t-strong text-icp-red transition-opacity hover:opacity-70 disabled:opacity-50"
              style={{ fontSize: fs(18, 13) }}
            >
              {status.state === 'sending' ? 'Sending…' : 'SUBMIT'}
            </button>
          </div>
        </form>

        {site && (
          <div
            className="t-strong absolute text-icp-taupe tall:static tall:mt-[calc(40*var(--v))] tall:grid tall:grid-cols-2 tall:gap-x-[calc(40*var(--u))]"
            // `right` keeps a long address line off the right edge bar: with
            // only `left` set, the block was free to run to the screen edge.
            style={{
              left: u(1525),
              right: portrait ? undefined : u(EDGE_BAR + 60),
              top: v(187),
              fontSize: fs(18, 13),
              lineHeight: 1.5,
              width: portrait ? u(LABEL_W + FIELD_W) : undefined,
            }}
          >
            <div className="flex items-center" style={{ gap: u(42), marginBottom: v(portrait ? 20 : 34) }}>
              <ContactIcon src="/images/icons/Mobile.png" alt="" />
              <a href={`tel:${site.phone.replace(/\s+/g, '')}`} className="hover:text-icp-red">
                {site.phone}
              </a>
            </div>
            <div className="flex items-center" style={{ gap: u(42), marginBottom: v(portrait ? 20 : 34) }}>
              <ContactIcon src="/images/icons/Email.png" alt="" />
              <a href={`mailto:${email}`} className="hover:text-icp-red">
                {email}
              </a>
            </div>
            <div className="flex items-center" style={{ gap: u(42), marginBottom: v(portrait ? 20 : 60) }}>
              <ContactIcon src="/images/icons/Location.png" alt="" />
              <p>
                {site.addressLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
            {/* "Add GPS location" (R3): a Google map of the studio, lined up
                with the address text rather than the icon column. The plain
                embed needs no API key, and loading it lazily keeps it off the
                critical path. */}
            <iframe
              title="iC+P studio location on Google Maps"
              src={MAP_EMBED}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              // Last on a portrait tablet, where the block is two columns: the
              // social links then share the address's row instead of taking
              // one of their own, which on a narrow tablet ran them down onto
              // the footer's iC+P mark.
              className="tall:order-last tall:col-span-2"
              style={{
                marginLeft: u(ICON_W + ICON_GAP),
                width: u(710),
                height: v(157),
                border: 0,
                marginBottom: v(portrait ? 20 : 48),
              }}
            />

            <div className="flex items-center" style={{ gap: u(42) }}>
              <ContactIcon src="/images/icons/Internet.png" alt="" />
              <span>follow us on:</span>
              <div className="flex items-center" style={{ gap: u(24), marginLeft: u(20) }}>
                {site.socials.map((s, i) => (
                  <div key={s.name} className="flex items-center" style={{ gap: u(24) }}>
                    {i > 0 && <span className="bg-icp-mist" style={{ width: 1, height: u(45), minHeight: 26 }} />}
                    <SocialLink social={s} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
