// Sends an enquiry to the form backend (Google Apps Script web app).
//
// The endpoint comes from VITE_ENQUIRY_ENDPOINT. In local development it
// falls back to /api/enquiry, a mock served by vite.config.js that mirrors the
// real script's responses.
//
// The body is posted as text/plain: that keeps the request "simple" so the
// browser sends it without a CORS preflight, which Apps Script cannot answer.
const ENDPOINT = import.meta.env.VITE_ENQUIRY_ENDPOINT || '/api/enquiry';

export const SUBJECTS = {
  'Design Request': ['Hospitality', 'Builders & Developers', 'Commercial', 'Private Residence'],
  'Staff Recruitment': ['Interior Designer', '3D Developer', 'Graphics Designer'],
  Other: [],
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Client-side checks mirror the server's, so most mistakes are caught before sending.
export function validateEnquiry(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = 'Please enter your name.';
  if (!EMAIL.test(form.email.trim())) errors.email = 'Please enter a valid email address.';
  if (!form.requirement.trim()) errors.requirement = 'Please tell us a little about your requirement.';
  return errors;
}

export async function sendEnquiry(form) {
  const payload = {
    ...form,
    page: window.location.href,
    userAgent: navigator.userAgent,
  };
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Could not send your enquiry.');
  return data;
}
