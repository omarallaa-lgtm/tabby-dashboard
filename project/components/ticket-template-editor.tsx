'use client';

import { useMemo, useState } from 'react';
import { Plus, X, ArrowUp, ArrowDown, Save, RotateCcw, Trash2, EyeOff, MessageSquare, Mail, Info } from 'lucide-react';
import { PLACEHOLDER_LABELS } from '@/lib/ticket-library';
import type { Product, Scenario, LangBlock } from '@/lib/ticket-library';
import type { SavedTemplate } from '@/lib/ticket-store';

// ---------------------------------------------------------------------------
// Add / edit a Ticket Assistance template
// ---------------------------------------------------------------------------
export type Origin = 'builtin' | 'edited' | 'custom';

const flatten = (b?: LangBlock) => (b ? [b.ack, ...(b.body || []), b.next, b.close].filter((m): m is string => !!m && !!m.trim()) : []);

const slug = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'topic';

const PH_KEYS = ['agent_name', ...Object.keys(PLACEHOLDER_LABELS)];

const moveIn = (list: string[], i: number, d: -1 | 1) => {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

const box =
  'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/40';
const label = 'text-[11px] font-semibold text-slate-500 dark:text-slate-400';

const MessageList = ({ list, set, field, rtl }: { list: string[]; set: (l: string[]) => void; field: 'en' | 'ar'; rtl?: boolean }) => (
  <div className="space-y-2">
    {list.map((m, i) => (
      <div key={i} className="flex items-start gap-2">
        <span className="mt-2 h-5 w-5 shrink-0 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] font-extrabold text-slate-600 dark:text-slate-200 flex items-center justify-center">
          {i + 1}
        </span>
        <textarea
          value={m}
          data-field={field}
          data-index={i}
          dir={rtl ? 'rtl' : 'ltr'}
          rows={2}
          onChange={(e) => set(list.map((x, j) => (j === i ? e.target.value : x)))}
          placeholder={i === 0 ? (rtl ? 'الرسالة الأولى: تفهّم وتقدير' : 'Message 1: acknowledge the concern') : rtl ? 'الرسالة التالية' : 'Next message'}
          className={`${box} min-h-[52px] ${rtl ? 'text-right' : ''}`}
        />
        <div className="flex flex-col gap-0.5 pt-1">
          <button type="button" title="Move up" onClick={() => set(moveIn(list, i, -1))} className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button type="button" title="Move down" onClick={() => set(moveIn(list, i, 1))} className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white">
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button type="button" title="Remove" onClick={() => set(list.filter((_, j) => j !== i))} className="p-0.5 text-slate-400 hover:text-red-500">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    ))}
    <button
      type="button"
      onClick={() => set([...list, ''])}
      className="h-7 px-2.5 rounded-lg text-[11px] font-bold border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
    >
      <Plus className="h-3.5 w-3.5" /> Add message
    </button>
  </div>
);


export function TicketTemplateEditor({
  initial,
  origin,
  isNew,
  products,
  topicName,
  onSave,
  onCancel,
  onReset,
  onDelete,
  onHide,
}: {
  initial: Scenario;
  origin: Origin;
  isNew: boolean;
  products: Product[];
  topicName: Record<string, string>;
  onSave: (t: SavedTemplate) => Promise<string | null>;
  onCancel: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  onHide?: () => void;
}) {
  const startProduct = products.find((p) => p.topics.some((t) => t.id === initial.topic))?.id || products[0]?.id || 'general';

  const [productId, setProductId] = useState(startProduct);
  const [topicId, setTopicId] = useState(initial.topic || products.find((p) => p.id === startProduct)?.topics[0]?.id || '');
  const [newTopic, setNewTopic] = useState('');
  const [title, setTitle] = useState(initial.title || '');
  const [when, setWhen] = useState(initial.when || '');
  const [tip, setTip] = useState(initial.tip || '');
  const [keys, setKeys] = useState(initial.keys || '');
  const [chat, setChat] = useState(initial.channels ? initial.channels.includes('chat') : true);
  const [email, setEmail] = useState(initial.channels ? initial.channels.includes('email') : true);
  const [en, setEn] = useState<string[]>(() => {
    const m = flatten(initial.en);
    return initial.internal && initial.emailEn ? m.slice(0, 1) : m.length ? m : [''];
  });
  const [ar, setAr] = useState<string[]>(() => flatten(initial.ar));
  const [subjectEn, setSubjectEn] = useState(initial.subject?.en || '');
  const [subjectAr, setSubjectAr] = useState(initial.subject?.ar || '');
  const [customEmail, setCustomEmail] = useState(!!(initial.emailEn || initial.emailAr));
  const [emailEn, setEmailEn] = useState(initial.emailEn || '');
  const [emailAr, setEmailAr] = useState(initial.emailAr || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const product = products.find((p) => p.id === productId);
  const topics = product?.topics || [];

  // ---- placeholder chips insert at the cursor of the focused box ----
  const setters: Record<string, (v: string, i?: number) => void> = {
    en: (v, i = 0) => setEn((l) => l.map((x, j) => (j === i ? v : x))),
    ar: (v, i = 0) => setAr((l) => l.map((x, j) => (j === i ? v : x))),
    emailEn: (v) => setEmailEn(v),
    emailAr: (v) => setEmailAr(v),
    subjectEn: (v) => setSubjectEn(v),
    subjectAr: (v) => setSubjectAr(v),
  };
  const insert = (key: string) => {
    const el = document.activeElement as HTMLTextAreaElement | HTMLInputElement | null;
    const field = el?.dataset?.field;
    if (!el || !field || !setters[field]) {
      setError('Click inside a message box first, then click the blank you want to add.');
      return;
    }
    setError('');
    const token = `{{${key}}}`;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const value = el.value.slice(0, start) + token + el.value.slice(end);
    setters[field](value, Number(el.dataset.index || 0));
    requestAnimationFrame(() => {
      try {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      } catch {}
    });
  };

  const preview = useMemo(() => en.filter((m) => m.trim()).length, [en]);

  const save = async () => {
    setError('');
    const enList = en.map((m) => m.trim()).filter(Boolean);
    const arList = ar.map((m) => m.trim()).filter(Boolean);
    if (!title.trim()) return setError('Please add a title.');
    if (!chat && !email) return setError('Choose at least one: Chat or Email.');
    if (!enList.length && !(customEmail && emailEn.trim())) return setError('Please write at least one English message.');
    if (productId && topicId === '__new' && !newTopic.trim()) return setError('Please name the new topic.');

    const topic = topicId === '__new' ? `custom-topic-${slug(newTopic)}` : topicId;
    const tName = topicId === '__new' ? newTopic.trim() : topicName[topicId] || '';

    const enBlock: LangBlock = { ...initial.en, ack: enList[0] || title.trim(), body: enList.slice(1) };
    delete enBlock.next;
    delete enBlock.close;
    let arBlock: LangBlock | undefined;
    if (arList.length) {
      arBlock = { ...(initial.ar || { ack: '', body: [] }), ack: arList[0], body: arList.slice(1) };
      delete arBlock.next;
      delete arBlock.close;
    }

    const data: SavedTemplate = {
      ...initial,
      topic,
      productId,
      topicName: tName,
      title: title.trim(),
      when: when.trim() || 'Use when it fits the customer’s question.',
      tip: tip.trim() || undefined,
      keys: keys.trim() || undefined,
      en: enBlock,
      ar: arBlock,
      channels: chat && email ? undefined : chat ? ['chat'] : ['email'],
      subject: subjectEn.trim() || subjectAr.trim() ? { en: subjectEn.trim() || subjectAr.trim(), ar: subjectAr.trim() || subjectEn.trim() } : undefined,
      emailEn: customEmail && emailEn.trim() ? emailEn.trim() : undefined,
      emailAr: customEmail && emailAr.trim() ? emailAr.trim() : undefined,
    };
    // keep the database row clean
    (Object.keys(data) as (keyof SavedTemplate)[]).forEach((k) => data[k] === undefined && delete data[k]);

    setSaving(true);
    const err = await onSave(data);
    setSaving(false);
    if (err) setError(err);
  };

  return (
    <div className="rounded-2xl border border-emerald-500/40 bg-white/95 dark:bg-[#101a30]/90 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {isNew ? 'New template' : origin === 'builtin' ? 'Edit built-in template' : 'Edit template'}
          </p>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight">{title || 'Untitled template'}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onHide && (
            <button type="button" onClick={onHide} className="h-8 px-3 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-amber-500 flex items-center gap-1.5">
              <EyeOff className="h-3.5 w-3.5" /> Hide for everyone
            </button>
          )}
          {onReset && (
            <button type="button" onClick={onReset} className="h-8 px-3 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-sky-500 flex items-center gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Reset to original
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} className="h-8 px-3 rounded-lg text-xs font-bold border border-red-500/40 text-red-500 hover:bg-red-500/10 flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 p-2.5 text-[11px] text-sky-800 dark:text-sky-200 flex gap-2">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Keep each message short: acknowledge → explain → next step. Don’t type customer names, amounts, card digits or dates – add a blank instead (buttons below), and the agent fills it before sending. Don’t mention the survey or ask customers to keep notifications on.
        </span>
      </div>

      {/* where it lives */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="space-y-1">
          <span className={label}>Product</span>
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value);
              setTopicId(products.find((p) => p.id === e.target.value)?.topics[0]?.id || '__new');
            }}
            className={`${box} h-9`}
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className={label}>Topic</span>
          <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={`${box} h-9`}>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
            <option value="__new">+ New topic…</option>
          </select>
        </label>
        {topicId === '__new' ? (
          <label className="space-y-1">
            <span className={label}>New topic name</span>
            <input value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="e.g. Cashback offers" className={`${box} h-9`} />
          </label>
        ) : (
          <div className="space-y-1">
            <span className={label}>Send by</span>
            <div className="flex gap-2">
              {[
                { on: chat, set: setChat, l: 'Chat', I: MessageSquare },
                { on: email, set: setEmail, l: 'Email', I: Mail },
              ].map(({ on, set, l, I }) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => set(!on)}
                  className={`h-9 flex-1 rounded-lg text-xs font-bold border flex items-center justify-center gap-1.5 ${
                    on ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}
                >
                  <I className="h-3.5 w-3.5" /> {l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {topicId === '__new' && (
        <div className="flex gap-2">
          {[
            { on: chat, set: setChat, l: 'Chat', I: MessageSquare },
            { on: email, set: setEmail, l: 'Email', I: Mail },
          ].map(({ on, set, l, I }) => (
            <button
              key={l}
              type="button"
              onClick={() => set(!on)}
              className={`h-8 px-3 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${
                on ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <I className="h-3.5 w-3.5" /> {l}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="space-y-1">
          <span className={label}>Title (what agents search for)</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Refund not received after 7 days" className={`${box} h-9`} />
        </label>
        <label className="space-y-1">
          <span className={label}>When to use (internal)</span>
          <input value={when} onChange={(e) => setWhen(e.target.value)} placeholder="e.g. Customer says the refund didn’t reach the bank" className={`${box} h-9`} />
        </label>
        <label className="space-y-1">
          <span className={label}>Internal tip (optional, never sent)</span>
          <input value={tip} onChange={(e) => setTip(e.target.value)} placeholder="e.g. Ask for a bank statement before escalating" className={`${box} h-9`} />
        </label>
        <label className="space-y-1">
          <span className={label}>Extra search words (optional, English and Arabic)</span>
          <input value={keys} onChange={(e) => setKeys(e.target.value)} placeholder="e.g. refund bank missing استرداد" className={`${box} h-9`} />
        </label>
      </div>

      {/* blanks */}
      <div className="space-y-1">
        <span className={label}>Add a blank where the cursor is:</span>
        <div className="flex flex-wrap gap-1.5">
          {PH_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(k)}
              className="h-6 px-2 rounded-md text-[10.5px] font-semibold bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200 hover:bg-amber-200 dark:hover:bg-amber-500/30"
            >
              {k === 'agent_name' ? 'Your name' : PLACEHOLDER_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      {/* messages */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">English messages <span className="font-normal text-slate-400">({preview})</span></p>
          <MessageList list={en} set={setEn} field="en" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
            Arabic messages <span className="font-normal text-slate-400">(optional – one version for male and female)</span>
          </p>
          <MessageList list={ar} set={setAr} field="ar" rtl />
        </div>
      </div>

      {/* email */}
      {email && (
        <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className={label}>Email subject – English</span>
              <input value={subjectEn} data-field="subjectEn" onChange={(e) => setSubjectEn(e.target.value)} className={`${box} h-9`} />
            </label>
            <label className="space-y-1">
              <span className={label}>Email subject – Arabic</span>
              <input value={subjectAr} data-field="subjectAr" dir="rtl" onChange={(e) => setSubjectAr(e.target.value)} className={`${box} h-9 text-right`} />
            </label>
          </div>
          <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input type="checkbox" checked={customEmail} onChange={(e) => setCustomEmail(e.target.checked)} />
            Write the email myself (otherwise it is built from the messages with “Dear Customer” and your signature)
          </label>
          {customEmail && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <textarea
                value={emailEn}
                data-field="emailEn"
                onChange={(e) => setEmailEn(e.target.value)}
                rows={9}
                placeholder={'Dear Customer,\n\n…\n\nBest regards,\n{{agent_name}}\n{{team_name}}'}
                className={box}
              />
              <textarea
                value={emailAr}
                data-field="emailAr"
                dir="rtl"
                onChange={(e) => setEmailAr(e.target.value)}
                rows={9}
                placeholder={'مرحبًا،\n\n…\n\nمع أطيب التحيات،\n{{agent_name}}\n{{team_name}}'}
                className={`${box} text-right`}
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs font-semibold text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="h-9 px-4 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-9 px-4 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center gap-1.5"
        >
          <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save template'}
        </button>
      </div>
    </div>
  );
}
