'use client';

// ---------------------------------------------------------------------------
// Edit your own quick-copy buttons: pick templates, rename, reorder, remove,
// or add your own text. Used by Ticket Assistance and AI Helper.
// ---------------------------------------------------------------------------
import { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, X, Plus, Search, RotateCcw, Check, Pencil, Copy, Database } from 'lucide-react';
import type { Scenario } from '@/lib/ticket-library';
import { norm } from '@/lib/text-match';
import { QUICK_SQL, isOwn, newOwnId } from '@/lib/quick-copy';
import type { QuickItem } from '@/lib/quick-copy';

const inputCls =
  'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50';
const btn = 'h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-40';

export function QuickCopyEditor({
  title,
  items,
  defaults,
  scenarios,
  topicLabel,
  synced,
  missingTable,
  onSave,
  onClose,
  onCopySql,
}: {
  title: string;
  items: QuickItem[];
  defaults: QuickItem[];
  scenarios: Scenario[];
  topicLabel?: (topicId: string) => string;
  synced: boolean;
  missingTable: boolean;
  onSave: (items: QuickItem[]) => Promise<void> | void;
  onClose: () => void;
  onCopySql?: (sql: string) => void;
}) {
  const [list, setList] = useState<QuickItem[]>(items.map((x) => ({ ...x })));
  const [q, setQ] = useState('');
  const [openOwn, setOpenOwn] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const byId = useMemo(() => Object.fromEntries(scenarios.map((s) => [s.id, s])) as Record<string, Scenario>, [scenarios]);

  const results = useMemo(() => {
    const t = norm(q);
    if (!t) return [] as Scenario[];
    const parts = t.split(' ').filter(Boolean);
    return scenarios
      .filter((s) => !s.internal && !list.some((x) => x.id === s.id))
      .filter((s) => {
        const hay = norm(`${s.title} ${s.keys || ''}`);
        return parts.every((p) => hay.includes(p));
      })
      .slice(0, 8);
  }, [q, scenarios, list]);

  const move = (i: number, d: number) =>
    setList((l) => {
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      const n = [...l];
      [n[i], n[j]] = [n[j], n[i]];
      return n;
    });
  const patch = (i: number, v: Partial<QuickItem>) => setList((l) => l.map((x, k) => (k === i ? { ...x, ...v } : x)));

  const addOwn = () => {
    const id = newOwnId();
    setList((l) => [...l, { id, label: 'My text', text: '' }]);
    setOpenOwn(id);
  };

  const save = async () => {
    setSaving(true);
    await onSave(list.filter((x) => x.label.trim() && (!isOwn(x) || (x.text || x.textAr || '').trim())).map((x) => ({ ...x, label: x.label.trim() })));
    setSaving(false);
  };

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-white/95 dark:bg-[#101a30]/95 p-4 space-y-3 shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <Pencil className="h-4 w-4 text-emerald-500" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{title}</span>
        <span className="text-[10px] text-slate-500">only for you – other agents keep their own buttons</span>
        <span className="flex-1" />
        <button type="button" onClick={onClose} className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center" title="Close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {missingTable && (
        <div className="rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-2 text-[11px] text-amber-800 dark:text-amber-200 space-y-1.5">
          <p className="flex items-start gap-1.5">
            <Database className="h-3.5 w-3.5 shrink-0 mt-px" />
            Your buttons are saved in this browser only. To keep them on every computer and Citrix session, an Admin runs this once in Supabase → SQL Editor:
          </p>
          <div className="relative">
            <pre className="text-[10px] leading-relaxed p-2 rounded bg-slate-900 text-emerald-200 overflow-auto max-h-28 whitespace-pre">{QUICK_SQL}</pre>
            {onCopySql && (
              <button
                type="button"
                onClick={() => onCopySql(QUICK_SQL)}
                className="absolute top-1.5 right-1.5 h-6 px-2 rounded text-[10px] font-bold bg-white/10 text-white hover:bg-white/20 flex items-center gap-1"
              >
                <Copy className="h-3 w-3" /> Copy SQL
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {list.length === 0 && <p className="text-[11px] text-slate-500">No buttons. Add a template or your own text below.</p>}
        {list.map((it, i) => {
          const s = byId[it.id];
          const own = isOwn(it);
          return (
            <div key={it.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="h-4 w-5 text-slate-400 hover:text-slate-700 disabled:opacity-30" title="Move up">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="h-4 w-5 text-slate-400 hover:text-slate-700 disabled:opacity-30" title="Move down">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input value={it.label} onChange={(e) => patch(i, { label: e.target.value })} placeholder="Button name" className={`${inputCls} h-8 px-2 max-w-[200px]`} />
                <span className="text-[11px] text-slate-500 truncate flex-1 min-w-0">
                  {own ? (
                    <button type="button" onClick={() => setOpenOwn(openOwn === it.id ? '' : it.id)} className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
                      Your own text {openOwn === it.id ? '▲' : '▼'}
                    </button>
                  ) : s ? (
                    <>
                      {s.title}
                      {topicLabel ? <span className="text-slate-400"> · {topicLabel(s.topic)}</span> : null}
                    </>
                  ) : (
                    <span className="text-amber-600">Template not found (it may have been hidden or deleted)</span>
                  )}
                </span>
                <button type="button" onClick={() => setList((l) => l.filter((_, k) => k !== i))} className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 flex items-center justify-center" title="Remove">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              {own && openOwn === it.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <textarea value={it.text || ''} onChange={(e) => patch(i, { text: e.target.value })} rows={3} placeholder="English text" className={`${inputCls} p-2`} />
                  <textarea value={it.textAr || ''} onChange={(e) => patch(i, { textAr: e.target.value })} rows={3} dir="rtl" placeholder="النص بالعربية (اختياري)" className={`${inputCls} p-2`} />
                  <p className="text-[10px] text-slate-500 md:col-span-2">You can use {'{{agent_name}}'} and {'{{team_name}}'} – they are filled in when you copy.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-start gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add a template – search by name…" className={`${inputCls} h-9 pl-8 pr-2`} />
          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg overflow-hidden">
              {results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setList((l) => [...l, { id: s.id, label: s.title.split(' – ')[0].slice(0, 28) }]);
                    setQ('');
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-[11px] hover:bg-emerald-500/10 text-slate-700 dark:text-slate-200"
                >
                  <span className="font-semibold">{s.title}</span>
                  {topicLabel ? <span className="text-slate-400"> · {topicLabel(s.topic)}</span> : null}
                </button>
              ))}
            </div>
          )}
        </div>
        <button type="button" onClick={addOwn} className={`${btn} border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500`}>
          <Plus className="h-3.5 w-3.5" /> My own text
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={save} disabled={saving} className={`${btn} bg-emerald-600 hover:bg-emerald-500 text-white mt-2`}>
          <Check className="h-3.5 w-3.5" /> Save my buttons
        </button>
        <button
          type="button"
          onClick={() => setList(defaults.map((x) => ({ ...x })))}
          className={`${btn} border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 mt-2`}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Back to default
        </button>
        <span className="text-[10px] text-slate-500 mt-2">{synced ? 'Saved to your account – works on any computer.' : 'Saved in this browser.'}</span>
      </div>
    </div>
  );
}
