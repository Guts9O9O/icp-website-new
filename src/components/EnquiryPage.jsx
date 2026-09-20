import { useState } from 'react';
import { getSite } from '../lib/api';
import { useData } from '../lib/useData';
import { fs, u, v } from '../lib/units';
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
const fieldStyle = { height: v(FIELD_H), paddingLeft: u(16), paddingRight: u(16), fontSize: fs(18, 13) };

function Row({ label, children, align = 'center' }) {
  return (
    <div className={`flex ${align === 'start' ? 'items-start' : 'items-center'}`} style={{ marginBottom: v(ROW_GAP) }}>
      <label className="shrink-0 text-icp-taupe" style={{ width: u(LABEL_W), fontSize: fs(18, 13) }}>
        {label}
      </label>
      <div className="flex" style={{ width: u(FIELD_W), gap: u(10) }}>
        {children}
      </div>
    </div>
  );
}

function Select({ value, onChange, options, style }) {
  return (
    <div className="relative" style={style}>
      <select
        value={value}
        onChange={onChange}
        className={`${fieldClass} appearance-none`}
        style={{ ...fieldStyle, paddingRight: u(70) }}
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

      <main className="absolute left-0 right-0" style={{ top: v(FORM_TOP) }}>
        <form onSubmit={onSubmit} className="absolute" style={{ left: u(FORM_LEFT) }} noValidate>
          <Row label="Subject">
            <Select
              value={form.subject}
              onChange={setSubject}
              options={Object.keys(SUBJECTS)}
              style={{ width: detailOptions.length ? u(459) : '100%' }}
            />
            {detailOptions.length > 0 && (
              <Select value={form.detail} onChange={set('detail')} options={detailOptions} style={{ flex: 1 }} />
            )}
          </Row>

          <Row label="Your Name">
            <input className={fieldClass} style={fieldStyle} value={form.name} onChange={set('name')} autoComplete="name" />
          </Row>

          <Row label="Company Name">
            <input className={fieldClass} style={fieldStyle} value={form.company} onChange={set('company')} autoComplete="organization" />
          </Row>

          <Row label="Email Address">
            <input className={fieldClass} style={fieldStyle} type="email" value={form.email} onChange={set('email')} autoComplete="email" />
          </Row>

          <Row
            label={
              <span className="flex" style={{ gap: u(48) }}>
                <span>Address</span>
                <span>Zip Code</span>
              </span>
            }
          >
            <input
              className={`${fieldClass} text-center`}
              style={{ ...fieldStyle, width: u(221), flex: 'none' }}
              placeholder="Zip Code"
              value={form.zip}
              onChange={set('zip')}
              autoComplete="postal-code"
            />
            <input
              className={`${fieldClass} text-center`}
              style={{ ...fieldStyle, flex: 1 }}
              placeholder="Address"
              value={form.address1}
              onChange={set('address1')}
              autoComplete="address-line1"
            />
          </Row>

          <Row label="">
            <input
              className={`${fieldClass} text-center`}
              style={fieldStyle}
              placeholder="Address"
              value={form.address2}
              onChange={set('address2')}
              autoComplete="address-line2"
            />
          </Row>

          <Row label="Requirement" align="start">
            <textarea
              className={`${fieldClass} resize-none`}
              style={{ ...fieldStyle, height: v(158), paddingTop: v(12) }}
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
            className="absolute text-icp-taupe"
            style={{ left: u(1525), top: v(187), fontSize: fs(18, 13), lineHeight: 1.5 }}
          >
            <div className="flex items-center" style={{ gap: u(42), marginBottom: v(34) }}>
              <ContactIcon src="/images/icons/Mobile.png" alt="" />
              <a href={`tel:${site.phone.replace(/\s+/g, '')}`} className="hover:text-icp-red">
                {site.phone}
              </a>
            </div>
            <div className="flex items-center" style={{ gap: u(42), marginBottom: v(34) }}>
              <ContactIcon src="/images/icons/Email.png" alt="" />
              <a href={`mailto:${site.email}`} className="hover:text-icp-red">
                {site.email}
              </a>
            </div>
            <div className="flex items-center" style={{ gap: u(42), marginBottom: v(60) }}>
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
