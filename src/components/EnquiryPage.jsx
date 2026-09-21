import { useState } from 'react';
import { getSite } from '../lib/api';
import { useData } from '../lib/useData';
import { useMediaQuery } from '../lib/useMediaQuery';
import { PORTRAIT_QUERY, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';

// Second dropdown depends on the subject (client spec).
const SUBJECTS = {
  'Design Request': ['Hospitality', 'Builders & Developers', 'Commercial', 'Private Residence'],
  'Staff Recruitment': ['Interior Designer', '3D Developer', 'Graphics Designer'],
  Other: [],
};

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

const fieldStyle = (m) => ({ height: v(m.fieldH), paddingLeft: u(16), paddingRight: u(16), fontSize: fs(18, 13) });

function Row({ label, children, align = 'center', gap }) {
  return (
    <div className={`flex ${align === 'start' ? 'items-start' : 'items-center'}`} style={{ marginBottom: v(gap) }}>
      <label className="shrink-0 text-icp-taupe" style={{ width: u(LABEL_W), fontSize: fs(18, 13) }}>
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
        className={`${fieldClass} appearance-none`}
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

function ContactIcon({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="shrink-0 object-contain"
      style={{ width: u(45), height: u(45), minWidth: 26, minHeight: 26 }}
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
      style={{ width: u(45), height: u(45), minWidth: 26, minHeight: 26 }}
    >
      <img src={social.icon} alt="" className="absolute inset-0 h-full w-full object-contain group-hover:opacity-0" />
      <img
        src={social.iconHover}
        alt=""
        className="absolute inset-0 h-full w-full object-contain opacity-0 group-hover:opacity-100"
      />
    </a>
  );
}

export default function EnquiryPage() {
  const { data: site } = useData(getSite);
  const portrait = useMediaQuery(PORTRAIT_QUERY);
  const m = portrait ? PORTRAIT : LANDSCAPE;
  const field = fieldStyle(m);
  const [form, setForm] = useState(EMPTY);
  const detailOptions = SUBJECTS[form.subject] ?? [];

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setSubject = (e) => {
    const subject = e.target.value;
    setForm((f) => ({ ...f, subject, detail: SUBJECTS[subject][0] ?? '' }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    // Submission (Google Sheet + email) is wired in Phase 6.
  };

  return (
    <div className="relative min-h-screen bg-white font-brand">
      <EdgeBars />
      <SiteNav rightTitle="enquiry" />

      <main className="absolute left-0 right-0 tall:flex tall:flex-col" style={{ top: v(m.formTop), paddingLeft: u(FORM_LEFT) }}>
        <form onSubmit={onSubmit} className="absolute tall:static" style={{ left: u(FORM_LEFT) }} noValidate>
          <Row label="Subject" gap={m.rowGap}>
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

          <Row label="Your Name" gap={m.rowGap}>
            <input className={fieldClass} style={field} value={form.name} onChange={set('name')} autoComplete="name" />
          </Row>

          <Row label="Company Name" gap={m.rowGap}>
            <input className={fieldClass} style={field} value={form.company} onChange={set('company')} autoComplete="organization" />
          </Row>

          <Row label="Email Address" gap={m.rowGap}>
            <input className={fieldClass} style={field} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          </Row>

          <Row
            gap={m.rowGap}
            label={
              <span className="flex" style={{ gap: u(48) }}>
                <span>Address</span>
                <span>Zip Code</span>
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

          <Row label="" gap={m.rowGap}>
            <input
              className={`${fieldClass} text-center`}
              style={field}
              placeholder="Address"
              value={form.address2}
              onChange={set('address2')}
              autoComplete="address-line2"
            />
          </Row>

          <Row label="Requirement" align="start" gap={m.rowGap}>
            <textarea
              className={`${fieldClass} resize-none`}
              style={{ ...field, height: v(m.textareaH), paddingTop: v(12) }}
              value={form.requirement}
              onChange={set('requirement')}
            />
          </Row>

          <div className="flex justify-end" style={{ width: u(LABEL_W + FIELD_W) }}>
            <button
              type="submit"
              className="font-semibold text-icp-red transition-opacity hover:opacity-70"
              style={{ fontSize: fs(18, 13) }}
            >
              Submit
            </button>
          </div>
        </form>

        {site && (
          <div
            className="absolute text-icp-taupe tall:static tall:mt-[calc(40*var(--v))] tall:grid tall:grid-cols-2 tall:gap-x-[calc(40*var(--u))]"
            style={{ left: u(1525), top: v(187), fontSize: fs(18, 13), lineHeight: 1.5, width: portrait ? u(LABEL_W + FIELD_W) : undefined }}
          >
            <div className="flex items-center" style={{ gap: u(42), marginBottom: v(portrait ? 20 : 34) }}>
              <ContactIcon src="/images/icons/Mobile.png" alt="" />
              <a href={`tel:${site.phone.replace(/\s+/g, '')}`} className="hover:text-icp-red">
                {site.phone}
              </a>
            </div>
            <div className="flex items-center" style={{ gap: u(42), marginBottom: v(portrait ? 20 : 34) }}>
              <ContactIcon src="/images/icons/Email.png" alt="" />
              <a href={`mailto:${site.email}`} className="hover:text-icp-red">
                {site.email}
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
