import { useEffect, useState } from 'react';
import * as api from '../api';
import { Button, Card, Field, Input, PageHeader, Spinner, Textarea, errorMessage, useToast } from '../components/ui';

const ABOUT_DEFAULT = { title: 'About iC+P', intro: '', teamIntro: '', hallmarks: [] };
const CONTACT_DEFAULT = {
  phone: '',
  email: '',
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
  const [saving, setSaving] = useState('');

  useEffect(() => {
    Promise.all([api.getSetting('about'), api.getSetting('contact')])
      .then(([a, c]) => {
        setAbout({ ...ABOUT_DEFAULT, ...(a ?? {}) });
        setContact({ ...CONTACT_DEFAULT, ...(c ?? {}), socials: CONTACT_DEFAULT.socials.map((d) => ({ ...d, ...((c?.socials ?? []).find((s) => s.name === d.name) ?? {}) })) });
      })
      .catch((e) => toast.error(errorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveAbout = async () => {
    setSaving('about');
    try {
      await api.setSetting('about', { ...about, hallmarks: about.hallmarks.map((h) => h.trim()).filter(Boolean) });
      toast.success('About text saved.');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving('');
    }
  };

  const saveContact = async () => {
    setSaving('contact');
    try {
      await api.setSetting('contact', {
        ...contact,
        phone: contact.phone.trim(),
        email: contact.email.trim(),
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

  if (!about || !contact) return <div className="flex justify-center py-16"><Spinner /></div>;

  return (
    <>
      <PageHeader title="Site text & contact" description="The studio write-up on the About Us page, and the details on the Enquiry page." />

      <Card className="mb-6 space-y-4 p-6">
        <h2 className="text-[16px] font-semibold">About Us — studio write-up</h2>
        <Field label="Heading"><Input value={about.title} onChange={(e) => setAbout({ ...about, title: e.target.value })} /></Field>
        <Field label="Introduction"><Textarea rows={6} value={about.intro} onChange={(e) => setAbout({ ...about, intro: e.target.value })} /></Field>
        <Field label="Design team paragraph"><Textarea rows={6} value={about.teamIntro} onChange={(e) => setAbout({ ...about, teamIntro: e.target.value })} /></Field>
        <Field label="Hallmarks" hint="One per line — shown as a bullet list.">
          <Textarea rows={6} value={about.hallmarks.join('\n')} onChange={(e) => setAbout({ ...about, hallmarks: e.target.value.split('\n') })} />
        </Field>
        <div className="flex justify-end">
          <Button variant="primary" onClick={saveAbout} disabled={saving === 'about'}>{saving === 'about' ? 'Saving…' : 'Save about text'}</Button>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-[16px] font-semibold">Enquiry page — contact details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone"><Input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} /></Field>
          <Field label="Email"><Input type="email" value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} /></Field>
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
