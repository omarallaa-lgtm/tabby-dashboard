'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Copy, Check, Search, Plus, Pencil, Trash2, ExternalLink, Mail, Link2, Phone, StickyNote, X, Database, AlertTriangle,
} from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';

// ---------------------------------------------------------------------------
// Important links & emails (Supabase table: important_links)
// Admin / Team Leader can add, edit and delete. Everyone can search and copy.
// ---------------------------------------------------------------------------
type Kind = 'email' | 'link' | 'phone' | 'note';

export interface LinkItem {
  id?: string;
  category: string;
  title: string;
  kind: Kind;
  value: string;
  cc?: string | null;
  notes?: string | null;
  sort_order?: number | null;
}

export const LINKS_TABLE_SQL = `create table if not exists important_links (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Other',
  title text not null,
  kind text not null default 'link',
  value text not null,
  cc text,
  notes text,
  sort_order int default 0,
  created_by text,
  created_at timestamptz default now()
);
alter table important_links enable row level security;
drop policy if exists "dashboard access" on important_links;
create policy "dashboard access" on important_links for all using (true) with check (true);`;

// Starter list, taken from the team sheets. Saved to the database with one click.
export const STARTER_LINKS: LinkItem[] = [
  // Acquirers & gateways
  { category: 'Banks & gateways – ARN requests', title: 'Mashreq', kind: 'email', value: 'mbmerchant@mashreq.com' },
  { category: 'Banks & gateways – ARN requests', title: 'Network International (NI)', kind: 'email', value: 'merchanthd@network.ae' },
  { category: 'Banks & gateways – ARN requests', title: 'SABB', kind: 'email', value: 'glcm.ma.clientsupport@sabb.com' },
  {
    category: 'Banks & gateways – ARN requests',
    title: 'Al Rajhi (MPGS)',
    kind: 'email',
    value: 'alsufiannaa@alrajhibank.com.sa; al-gafariam@alrajhibank.com.sa; alassafak@alrajhibank.com.sa',
  },
  { category: 'Banks & gateways – ARN requests', title: 'ARB (Neoleap)', kind: 'email', value: 'dalvir.c@alrajhibank.com.sa; agupta@neoleap.com.sa' },
  { category: 'Banks & gateways – ARN requests', title: 'Amazon / Payfort', kind: 'email', value: 'dawamleh@amazon.com', cc: 'keyaccount@payfort.com' },
  { category: 'Banks & gateways – ARN requests', title: 'Noon Payments', kind: 'email', value: 'support@noonpayments.com' },
  { category: 'Banks & gateways – ARN requests', title: 'Checkout.com', kind: 'email', value: 'support@checkout.com' },
  {
    category: 'Banks & gateways – ARN requests',
    title: 'Tabby CC on ARN requests',
    kind: 'email',
    value: 'ashesh.arun@tabby.ai',
    notes: 'Listed as CC under the ARN request addresses in the sheet.',
  },
  // Customer-facing contact
  { category: 'Tabby contact (for customers)', title: 'Customer support email', kind: 'email', value: 'help@tabby.ai' },
  { category: 'Tabby contact (for customers)', title: 'UAE phone', kind: 'phone', value: '800 82229', notes: '9 AM – 10 PM Dubai time' },
  { category: 'Tabby contact (for customers)', title: 'Kuwait phone', kind: 'phone', value: '+965 2227 0163' },
  // Internal tools
  { category: 'Internal tools', title: 'Knowledge base', kind: 'link', value: 'https://knowledge.tabby.ai/' },
  { category: 'Internal tools', title: 'Ops Loop (merchant side tickets)', kind: 'link', value: 'https://ops-loop.tabby.ai/' },
  { category: 'Internal tools', title: 'WFM', kind: 'link', value: 'https://wfm.tabby.ai/' },
  { category: 'Internal tools', title: 'Genesys Cloud login', kind: 'link', value: 'https://login.mypurecloud.de/#/authenticate-adv/org/tabbytechnologyltd-bcp' },
  { category: 'Internal tools', title: 'Jira service desk – request form', kind: 'link', value: 'https://tabby.atlassian.net/servicedesk/customer/portal/4/create/333' },
  // Public pages
  { category: 'Policies & public pages', title: 'Pay Later terms & conditions (UAE)', kind: 'link', value: 'https://tabby.ai/en-AE/legal/terms-and-conditions-bnpl/latest' },
  { category: 'Policies & public pages', title: 'Tabby Card page (UAE)', kind: 'link', value: 'https://tabby.ai/en-AE/card' },
].map((x, i) => ({ ...x, kind: x.kind as Kind, sort_order: i }));

const KIND_ICON = { email: Mail, link: Link2, phone: Phone, note: StickyNote } as const;
const KIND_LABEL: Record<Kind, string> = { email: 'Email', link: 'Link', phone: 'Phone', note: 'Note' };

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const tidyEmails = (v: string) =>
  v
    .split(/[;,\s]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .join('; ');

const isMissingTable = (err: any) =>
  !!err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|could not find the table/i.test(String(err.message || '')));

const empty: LinkItem = { category: '', title: '', kind: 'email', value: '', cc: '', notes: '' };

export function TicketLinks({ onCopied }: { onCopied?: (text: string, warn?: boolean) => void }) {
  const { currentUser } = useMetrics();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const [items, setItems] = useState<LinkItem[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'no-table' | 'empty' | 'error'>('loading');
  const [errMsg, setErrMsg] = useState('');
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [copiedKey, setCopiedKey] = useState('');
  const [form, setForm] = useState<LinkItem | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.from('important_links').select('*').order('sort_order', { ascending: true });
    if (error) {
      if (isMissingTable(error)) {
        setStatus('no-table');
      } else {
        setStatus('error');
        setErrMsg(error.message);
      }
      setItems(STARTER_LINKS);
      return;
    }
    if (!data || data.length === 0) {
      setStatus('empty');
      setItems(STARTER_LINKS);
      return;
    }
    setStatus('ready');
    setItems(data as LinkItem[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (msg: string, warn?: boolean) => onCopied?.(msg, warn);

  const copy = async (text: string, key: string, label: string) => {
    const ok = await copyText(text);
    if (!ok) return flash('Copy failed – select the text and press Ctrl+C', true);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((k) => (k === key ? '' : k)), 1500);
    flash(`${label} copied`);
  };

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category || 'Other'))), [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (cat === 'all' || (i.category || 'Other') === cat) &&
        (!q || [i.title, i.value, i.cc, i.notes, i.category].join(' ').toLowerCase().includes(q))
    );
  }, [items, query, cat]);

  const grouped = useMemo(() => {
    const map = new Map<string, LinkItem[]>();
    shown.forEach((i) => {
      const c = i.category || 'Other';
      map.set(c, [...(map.get(c) || []), i]);
    });
    return Array.from(map.entries());
  }, [shown]);

  const saveStarter = async () => {
    setSaving(true);
    const rows = STARTER_LINKS.map(({ id, ...r }) => ({ ...r, created_by: currentUser?.user_email || null }));
    const { error } = await supabase.from('important_links').insert(rows);
    setSaving(false);
    if (error) return flash(`Could not save: ${error.message}`, true);
    flash('Starter list saved – you can now edit it');
    load();
  };

  const saveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const row = {
      category: form.category.trim() || 'Other',
      title: form.title.trim(),
      kind: form.kind,
      value: form.kind === 'email' ? tidyEmails(form.value) : form.value.trim(),
      cc: form.cc ? tidyEmails(form.cc) : null,
      notes: (form.notes || '').trim() || null,
      sort_order: form.sort_order ?? items.length,
    };
    if (!row.title || !row.value) return flash('Please fill the name and the email / link', true);
    setSaving(true);
    const { error } = form.id
      ? await supabase.from('important_links').update(row).eq('id', form.id)
      : await supabase.from('important_links').insert({ ...row, created_by: currentUser?.user_email || null });
    setSaving(false);
    if (error) return flash(`Could not save: ${error.message}`, true);
    flash(form.id ? 'Updated' : 'Added');
    setForm(null);
    load();
  };

  const remove = async (item: LinkItem) => {
    if (!item.id || !window.confirm(`Delete “${item.title}”?`)) return;
    const { error } = await supabase.from('important_links').delete().eq('id', item.id);
    if (error) return flash(`Could not delete: ${error.message}`, true);
    flash('Deleted');
    load();
  };

  const panel = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#101a30]/90';
  const input =
    'w-full h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100';
  const editable = canEdit && status === 'ready';

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className={`${panel} p-3 flex flex-col md:flex-row md:items-center gap-2`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a bank, gateway, tool or email…"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => setForm({ ...empty, category: cat !== 'all' ? cat : '' })}
            className="h-10 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 justify-center"
          >
            <Plus className="h-4 w-4" /> Add link / email
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {['all', ...categories].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            className={`h-7 px-2.5 rounded-full text-[11px] font-bold border ${
              cat === c
                ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      {/* setup / status messages */}
      {status === 'no-table' && (
        <div className={`${panel} p-3 space-y-2 border-amber-300 dark:border-amber-500/40`}>
          <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <Database className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Showing the starter list. To let Admins and Team Leaders add and edit links here, run this once in
              <b> Supabase → SQL Editor</b>, then refresh the page.
            </span>
          </p>
          {canEdit && (
            <details>
              <summary className="cursor-pointer text-[11px] font-bold text-amber-700 dark:text-amber-300">Show setup SQL</summary>
            <div className="relative mt-2">
              <pre className="text-[11px] leading-relaxed p-3 rounded-lg bg-slate-900 text-emerald-200 overflow-x-auto whitespace-pre">{LINKS_TABLE_SQL}</pre>
              <button
                type="button"
                onClick={() => copy(LINKS_TABLE_SQL, 'sql', 'SQL')}
                className="absolute top-2 right-2 h-7 px-2 rounded-md text-[11px] font-bold bg-white/10 text-white hover:bg-white/20 flex items-center gap-1"
              >
                {copiedKey === 'sql' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy SQL
              </button>
            </div>
            </details>
          )}
        </div>
      )}
      {status === 'empty' && canEdit && (
        <div className={`${panel} p-3 flex flex-wrap items-center justify-between gap-2`}>
          <p className="text-xs text-slate-600 dark:text-slate-300">The table is ready. Save the starter list so you can edit it, or start adding your own.</p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={saveStarter}
              className="h-8 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
            >
              Save starter list
            </button>
            <button
              type="button"
              onClick={() => {
                setItems([]);
                setStatus('ready');
              }}
              className="h-8 px-3 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              Start empty
            </button>
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className={`${panel} p-3 text-xs text-red-600 dark:text-red-400 flex items-center gap-2`}>
          <AlertTriangle className="h-4 w-4" /> Could not load saved links ({errMsg}). Showing the starter list.
        </div>
      )}

      {/* add / edit form */}
      {form && (
        <form onSubmit={saveForm} className={`${panel} p-3 space-y-2 border-emerald-500/40`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{form.id ? 'Edit' : 'Add'} link / email</p>
            <button type="button" onClick={() => setForm(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <label className="text-[11px] text-slate-500 space-y-0.5">
              <span>Section</span>
              <input list="ta-link-cats" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Banks & gateways" className={input} />
              <datalist id="ta-link-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="text-[11px] text-slate-500 space-y-0.5">
              <span>Name</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Emirates NBD – disputes" className={input} required />
            </label>
            <label className="text-[11px] text-slate-500 space-y-0.5">
              <span>Type</span>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as Kind })} className={input}>
                {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-slate-500 space-y-0.5">
              <span>{form.kind === 'email' ? 'Email(s) – separate with ;' : form.kind === 'link' ? 'Link (https://…)' : form.kind === 'phone' ? 'Phone number' : 'Text'}</span>
              <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={input} required />
            </label>
            {form.kind === 'email' && (
              <label className="text-[11px] text-slate-500 space-y-0.5 sm:col-span-2">
                <span>CC (optional)</span>
                <input value={form.cc || ''} onChange={(e) => setForm({ ...form, cc: e.target.value })} className={input} />
              </label>
            )}
            <label className={`text-[11px] text-slate-500 space-y-0.5 ${form.kind === 'email' ? 'sm:col-span-2' : 'sm:col-span-2 lg:col-span-4'}`}>
              <span>Note (optional – when to use it)</span>
              <input value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={input} />
            </label>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="h-8 px-4 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* list */}
      {status === 'loading' ? (
        <p className="text-xs text-slate-400 px-1">Loading…</p>
      ) : grouped.length === 0 ? (
        <div className={`${panel} p-6 text-center text-xs text-slate-500`}>{query ? 'No match.' : 'Nothing here yet.'}</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
          {grouped.map(([c, list]) => (
            <div key={c} className={`${panel} p-3`}>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-2">{c}</p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {list.map((item, idx) => {
                  const Icon = KIND_ICON[item.kind] || Link2;
                  const key = `${item.id || item.title}-${idx}`;
                  const isUrl = item.kind === 'link' && /^https?:\/\//i.test(item.value);
                  return (
                    <div key={key} className="py-2 px-1 flex items-start gap-2.5">
                      <Icon className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 break-all select-all">{item.value}</p>
                        {item.cc && (
                          <p className="text-[11px] text-slate-500 break-all">
                            <span className="font-bold">CC:</span> <span className="select-all">{item.cc}</span>
                          </p>
                        )}
                        {item.notes && <p className="text-[11px] text-slate-400 mt-0.5">{item.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => copy(item.value, key, item.kind === 'link' ? 'Link' : item.kind === 'phone' ? 'Number' : item.kind === 'email' ? 'Email' : 'Text')}
                          title="Copy"
                          className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                        >
                          {copiedKey === key ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                        {item.cc && (
                          <button
                            type="button"
                            onClick={() => copy(item.cc || '', key + '-cc', 'CC')}
                            title="Copy CC"
                            className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-extrabold text-slate-500 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
                          >
                            {copiedKey === key + '-cc' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : 'CC'}
                          </button>
                        )}
                        {isUrl && (
                          <a
                            href={item.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open"
                            className="h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {editable && item.id && (
                          <>
                            <button type="button" onClick={() => setForm({ ...item, cc: item.cc || '', notes: item.notes || '' })} title="Edit" className="h-8 px-1.5 text-slate-400 hover:text-sky-500">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button type="button" onClick={() => remove(item)} title="Delete" className="h-8 px-1.5 text-slate-400 hover:text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
