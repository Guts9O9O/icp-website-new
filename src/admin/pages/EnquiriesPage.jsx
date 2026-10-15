import { useEffect, useMemo, useState } from 'react';
import * as api from '../api';
import { Badge, Button, Card, EmptyState, PageHeader, Select, Spinner, Textarea, errorMessage, useConfirm, useToast } from '../components/ui';

const STATUS = {
  new: { label: 'New', tone: 'amber' },
  contacted: { label: 'Contacted', tone: 'green' },
  closed: { label: 'Closed', tone: 'neutral' },
};

const COPY = {
  lead: {
    title: 'Leads',
    description: 'Design requests and general enquiries from the website form. Each one is also emailed — design requests to the design email, the rest to the studio email (Site text & contact) — and saved in the “Website Leads” Google Sheet.',
    empty: 'No leads yet',
    emptyHint: 'Enquiries sent from the website’s enquiry page will appear here.',
    detailLabel: 'Category',
    messageLabel: 'Requirement',
  },
  recruitment: {
    title: 'Recruitment',
    description: 'Job applications from the website form. Each one is also emailed and saved in the “Website Recruitment” Google Sheet.',
    empty: 'No applications yet',
    emptyHint: 'Applications sent via “Staff Recruitment” on the enquiry page will appear here.',
    detailLabel: 'Position',
    messageLabel: 'Message',
  },
};

function when(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Row({ item, copy, onStatus, onNotes, onDelete }) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? '');
  const st = STATUS[item.status] ?? STATUS.new;

  return (
    <li className={item.status === 'new' ? 'bg-amber-50/40' : ''}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-[#f7f5f2]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-medium text-icp-slate">
            {item.name}
            {item.company && <span className="font-normal text-icp-slate/60"> · {item.company}</span>}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-icp-slate/60">
            {item.detail || item.subject} · {item.email} · {when(item.created_at)}
          </p>
        </div>
        <Badge tone={st.tone}>{st.label}</Badge>
        <span className="text-icp-slate/50">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-icp-mist/50 bg-[#faf9f7] px-5 py-4">
          <dl className="grid gap-x-6 gap-y-2 text-[14px] sm:grid-cols-[140px_1fr]">
            <dt className="text-icp-slate/60">Subject</dt><dd>{item.subject}{item.detail ? ` / ${item.detail}` : ''}</dd>
            <dt className="text-icp-slate/60">Email</dt><dd><a href={`mailto:${item.email}`} className="text-icp-red hover:underline">{item.email}</a></dd>
            {item.zip && <><dt className="text-icp-slate/60">Zip code</dt><dd>{item.zip}</dd></>}
            {item.address && <><dt className="text-icp-slate/60">Address</dt><dd>{item.address}</dd></>}
            <dt className="text-icp-slate/60">{copy.messageLabel}</dt><dd className="whitespace-pre-wrap">{item.requirement}</dd>
            <dt className="text-icp-slate/60">Received</dt><dd>{when(item.created_at)}</dd>
          </dl>

          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-medium text-icp-slate">Status</span>
              <Select value={item.status} onChange={(e) => onStatus(item, e.target.value)} className="!h-10 w-44">
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </label>
            <a href={`mailto:${item.email}?subject=${encodeURIComponent('Re: your enquiry to iConcepts + Partners')}`} className="inline-flex h-10 items-center rounded-md border border-icp-mist bg-white px-4 text-[14px] hover:bg-[#f5f3f0]">
              Reply by email
            </a>
            <Button variant="ghost" className="text-red-700" onClick={() => onDelete(item)}>Delete</Button>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-icp-slate">Internal notes</span>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call scheduled, quote sent, …" />
          </label>
          {notes !== (item.notes ?? '') && (
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => onNotes(item, notes)}>Save notes</Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function EnquiriesPage({ kind }) {
  const copy = COPY[kind];
  const toast = useToast();
  const confirm = useConfirm();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('open');

  const load = () => api.listEnquiries(kind).then(setRows).catch((e) => toast.error(errorMessage(e)));
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const visible = useMemo(() => {
    const list = rows ?? [];
    if (filter === 'open') return list.filter((r) => r.status !== 'closed');
    if (filter === 'all') return list;
    return list.filter((r) => r.status === filter);
  }, [rows, filter]);

  const setStatus = async (item, status) => {
    try {
      await api.updateRow('enquiries', item.id, { status });
      setRows((list) => list.map((r) => (r.id === item.id ? { ...r, status } : r)));
      window.dispatchEvent(new Event('icp:enquiries-changed'));
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const setNotes = async (item, notes) => {
    try {
      await api.updateRow('enquiries', item.id, { notes: notes.trim() || null });
      setRows((list) => list.map((r) => (r.id === item.id ? { ...r, notes: notes.trim() || null } : r)));
      toast.success('Notes saved.');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (item) => {
    if (!(await confirm({ title: `Delete the enquiry from ${item.name}?`, message: 'It stays in the Google Sheet; only the copy in this admin is removed.', confirmLabel: 'Delete', danger: true }))) return;
    try {
      await api.deleteRow('enquiries', item.id);
      setRows((list) => list.filter((r) => r.id !== item.id));
      window.dispatchEvent(new Event('icp:enquiries-changed'));
      toast.success('Deleted.');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-[14px] text-icp-slate/70">Show</span>
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="!h-10 !w-52">
          <option value="open">New & contacted</option>
          <option value="new">New only</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </Select>
        {rows && <span className="whitespace-nowrap text-[13px] text-icp-slate/60">{visible.length} of {rows.length}</span>}
      </div>

      {!rows ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : visible.length === 0 ? (
        <EmptyState title={rows.length ? 'Nothing matches this filter' : copy.empty} description={rows.length ? undefined : copy.emptyHint} />
      ) : (
        <Card>
          <ul className="divide-y divide-icp-mist/50">
            {visible.map((item) => (
              <Row key={item.id} item={item} copy={copy} onStatus={setStatus} onNotes={setNotes} onDelete={remove} />
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
