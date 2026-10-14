import { useEffect, useState } from 'react';
import * as api from '../api';
import { Button, Card, Field, Input, PageHeader, Spinner, Textarea, errorMessage, useToast } from '../components/ui';
import RichTextEditor from '../components/RichTextEditor';
import { EMAIL } from '../../lib/enquiry';

const ABOUT_DEFAULT = { title: 'About iC+P', text: '' };
const FORMAT_HINT = 'Use the buttons above, or Ctrl+B and Ctrl+I. Headings are set in capitals to match the rest of the site. Sizes are Heading / Normal / Small rather than a number, so the text keeps scaling correctly on every screen.';
const CONTACT_DEFAULT = {
  phone: '',
  email: '',
  designEmail: '',
  addressLines: ['', ''],
  socials: [
    { name: 'Instagram', href: '', icon: '/images/icons/Insta.png', iconHover: '/images/icons/Insta_C.png' },
    { name: 'LinkedIn', href: '', icon: '/images/icons/LinkedIN.png', iconHover: '/images/icons/LinkedIN_C.png' },
    { name: 'Pinterest', href: '', icon: '/images/icons/Pinterest.png', iconHover: '/images/icons/Pinterest_C.png' },
  ],
};

export default function SettingsPage() {
  const toast = useToast();
  const [about, setAbout] = useState(null);
  const [contact, setContact] = useState(null);
  const [categories, setCategories] = useState(null);
  const [saving, setSaving] = useState('');

  useEffect(() => {
    Promise.all([api.getSetting('about'), api.getSetting('contact'), api.listCategories()])
      .then(([a, c, cats]) => {
        setCategories(cats);
        setAbout({ ...ABOUT_DEFAULT, ...(a ?? {}) });
        setContact({ ...CONTACT_DEFAULT, ...(c ?? {}), socials: CONTACT_DEFAULT.socials.map((d) => ({ ...d, ...((c?.socials ?? []).find((s) => s.name === d.name) ?? {}) })) });
      })
      .catch((e) => toast.error(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAbout = async () => {
    setSaving('about');
    try {
      await api.setSetting('about', { title: about.title.trim() || 'About iC+P', text: about.text.trim() });
      toast.success('About text saved.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving('');
    }
  };

  const saveCategories = async () => {
    setSaving('categories');
    try {
      await Promise.all(categories.map((c) => api.updateCategory(c.slug, { description: (c.description ?? '').trim() || null })));
      toast.success('Category introductions saved.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving('');
    }
  };

  const saveContact = async () => {
    // These two addresses decide where enquiries are emailed, so a typo would
    // lose them; the studio address is required, the design one optional.
    const email = contact.email.trim();
    const designEmail = contact.designEmail.trim();
    if (!EMAIL.test(email) || (designEmail && !EMAIL.test(designEmail))) {
      toast.error('Please check the email addresses — enquiries are sent to them.');
      return;
    }
    setSaving('contact');
    try {
      await api.setSetting('contact', {
        ...contact,
        phone: contact.phone.trim(),
        email,
        designEmail,
        addressLines: contact.addressLines.map((l) => l.trim()).filter(Boolean),
        socials: contact.socials.map((s) => ({ ...s, href: s.href.trim() || '#' })),
      });
      toast.success('Contact details saved.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving('');
    }
  };

  if (!about || !contact || !categories) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <>
      <PageHeader title="Site text & contact" description="The About Us write-up, the introduction on each portfolio category page, and the details on the Enquiry page." />

      <Card className="mb-6 space-y-4 p-6">
        <h2 className="text-[16px] font-semibold">About Us — studio write-up</h2>
        <p className="text-[13px] text-icp-slate/60">Shown in the panel that slides out when a visitor hovers the “about iC+P” column.</p>
        <Field label="Write-up" hint={FORMAT_HINT}>
          <RichTextEditor value={about.text} onChange={(text) => setAbout({ ...about, text })} minHeight={420} />
        </Field>
        <div className="flex justify-end">
          <Button variant="primary" onClick={saveAbout} disabled={saving === 'about'}>{saving === 'about' ? 'Saving…' : 'Save about text'}</Button>
        </div>
      </Card>

      <Card className="mb-6 space-y-4 p-6">
        <h2 className="text-[16px] font-semibold">Portfolio — category introductions</h2>
        <p className="text-[13px] text-icp-slate/60">Shown in the red panel on each category page, when a visitor hovers one of its projects.</p>
        {categories.map((c, i) => (
          <Field key={c.slug} label={c.label}>
            <RichTextEditor
              value={c.description ?? ''}
              onChange={(text) => setCategories(categories.map((x, j) => (j === i ? { ...x, description: text } : x)))}
              minHeight={150}
            />
          </Field>
        ))}
        <div className="flex justify-end">
          <Button variant="primary" onClick={saveCategories} disabled={saving === 'categories'}>{saving === 'categories' ? 'Saving…' : 'Save introductions'}</Button>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-[16px] font-semibold">Enquiry page — contact details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone"><Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></Field>
          <div className="hidden sm:block" />
          <Field label="Studio email" hint="Receives staff recruitment and other enquiries, and is shown on the Enquiry page for those subjects.">
            <Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
          </Field>
          <Field label="Design request email" hint="Receives design requests, and is shown on the Enquiry page when a visitor picks Design Request. Leave empty to use the studio email.">
            <Input type="email" value={contact.designEmail} onChange={(e) => setContact({ ...contact, designEmail: e.target.value })} />
          </Field>
        </div>
        <Field label="Address line 1"><Input value={contact.addressLines[0] ?? ''} onChange={(e) => setContact({ ...contact, addressLines: [e.target.value, contact.addressLines[1] ?? ''] })} /></Field>
        <Field label="Address line 2"><Input value={contact.addressLines[1] ?? ''} onChange={(e) => setContact({ ...contact, addressLines: [contact.addressLines[0] ?? '', e.target.value] })} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          {contact.socials.map((s, i) => (
            <Field key={s.name} label={`${s.name} link`}>
              <Input
                placeholder="https://…"
                value={s.href === '#' ? '' : s.href}
                onChange={(e) => setContact({ ...contact, socials: contact.socials.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)) })}
              />
            </Field>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={saveContact} disabled={saving === 'contact'}>{saving === 'contact' ? 'Saving…' : 'Save contact details'}</Button>
        </div>
      </Card>
    </>
  );
}
