'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Copy, Check, Search, Star, Clock, ChevronRight, ChevronDown, MessageSquare, Mail, Lightbulb, Info, GitBranch,
  ArrowLeft, ArrowRight, X, Keyboard, BookOpen, Pencil, Zap, Settings2, ListTree, LifeBuoy, AlertTriangle, Link2, Plus, EyeOff, Database, Home,
} from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';
import { TicketLinks } from '@/components/ticket-links';
import { TicketTemplateEditor } from '@/components/ticket-template-editor';
import type { Origin } from '@/components/ticket-template-editor';
import { SETUP_SQL, loadTemplateRows, saveTemplateRow, deleteTemplateRow } from '@/lib/ticket-store';
import type { TemplateRow, SavedTemplate } from '@/lib/ticket-store';
import {
  PRODUCTS, ALL_SCENARIOS, FLOWS, chatMessages, emailBody, emailSubject, hasChannel, hasLang, placeholdersOf,
  PLACEHOLDER_LABELS,
} from '@/lib/ticket-library';
import type { Scenario, Channel, Lang, Product, Flow } from '@/lib/ticket-library';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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

const readLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeLS = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

const firstName = (raw: string) => {
  const p = String(raw || '').split('@')[0].split(/[._\-\s]+/).filter((x) => x && !/^\d+$/.test(x))[0] || '';
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : '';
};

/** lower-case, strip Arabic diacritics, unify letter forms, drop punctuation */
const norm = (s: string) =>
  String(s || '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[’'`]/g, '')
    .replace(/z/g, 's') // recognize = recognise, authorized = authorised
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const STOP = new Set(
  'the a an i im my me to is are am was dont didnt cant wont isnt doesnt and or of for in on it its this that with you your can could would please hi hello dear team tabby we our be have has not no do did does why how what when there just so but any from at as by will want need still also يا انا انت في من على الى عن ما لا هل هذا هذه تم مع او و ان كان كيف ليش لماذا عندي ابي ابغى اريد تابي مرحبا'.split(' ')
);

/** light English stemming so "refunds", "refunded", "refunding" all match "refund" */
const stem = (t: string) => {
  if (/^[a-z]+$/.test(t)) return t.length > 5 ? t.replace(/(ing|ed|es|s)$/, '') : t;
  // Arabic: drop the article and possessive endings (المسترد -> مسترد, بطاقتي -> بطاقه)
  let a = t.length > 4 ? t.replace(/^(وال|بال|لل|ال)/, '') : t;
  if (a.length > 3) a = a.replace(/(كم|ها|ي|ك)$/, '');
  return a.length > 3 ? a.replace(/ت$/, 'ه') : a;
};

const tokensOf = (q: string) =>
  norm(q)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOP.has(t))
    .map(stem);

const PH_RE = /(\{\{[a-z0-9_]+\}\})/gi;

// ---------------------------------------------------------------------------
// Team library (Supabase chat_macros / email_templates) -> scenarios
// ---------------------------------------------------------------------------
const splitParts = (t?: string | null) =>
  String(t || '')
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean);

interface TeamExtra {
  femaleChat?: string[];
  femaleEmail?: string;
}

function buildTeam(macros: any[], emails: any[]) {
  const scenarios: Scenario[] = [];
  const extra: Record<string, TeamExtra> = {};
  const topics = new Map<string, string>();

  macros.forEach((m) => {
    const title = String(m.category || m.topic || 'Team macro').trim();
    const group = String(m.topic || title.split(' - ')[0] || 'General').trim() || 'General';
    const topicId = `team-c:${group.toLowerCase()}`;
    topics.set(topicId, `Chat · ${group}`);
    const en = splitParts(m.english_en);
    const ar = splitParts(m.male_ar || m.female_ar);
    const base = en.length ? en : ar;
    if (!base.length) return;
    const id = `team-chat-${m.id ?? title}`;
    scenarios.push({
      id,
      topic: topicId,
      title,
      when: `Team chat macro${m.macro_type ? ` (${m.macro_type})` : ''}.`,
      keys: [m.category_name, m.topic].filter(Boolean).join(' '),
      tip: m.help_tips || undefined,
      channels: ['chat'],
      en: { ack: base[0], body: base.slice(1) },
      ar: ar.length ? { ack: ar[0], body: ar.slice(1) } : undefined,
    });
    const female = splitParts(m.female_ar);
    if (female.length && m.male_ar) extra[id] = { femaleChat: female };
  });

  emails.forEach((e) => {
    const title = String(e.title || e.subject || 'Team email').trim();
    const group = String(e.category || 'General').trim() || 'General';
    const topicId = `team-e:${group.toLowerCase()}`;
    topics.set(topicId, `Email · ${group}`);
    if (!e.body_en && !e.body_ar) return;
    const id = `team-mail-${e.id ?? title}`;
    scenarios.push({
      id,
      topic: topicId,
      title,
      when: `Team email template${e.macro_type ? ` (${e.macro_type})` : ''}.`,
      keys: [e.category, e.subject].filter(Boolean).join(' '),
      channels: ['email'],
      internal: true,
      en: { ack: title, body: [] },
      subject: e.subject ? { en: e.subject, ar: e.subject } : undefined,
      emailEn: e.body_en || e.body_ar,
      emailAr: e.body_ar || undefined,
    });
    if (e.body_ar_female && e.body_ar) extra[id] = { ...(extra[id] || {}), femaleEmail: e.body_ar_female };
  });

  const product: Product = {
    id: 'team',
    name: 'Team library',
    nameAr: 'مكتبة الفريق',
    color: '#34d399',
    topics: Array.from(topics.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  return { scenarios, extra, product };
}

// ---------------------------------------------------------------------------
// Small UI pieces
// ---------------------------------------------------------------------------
const Kbd = ({ children }: { children: ReactNode }) => (
  <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 leading-none">
    {children}
  </kbd>
);

/** renders text and highlights unfilled {{placeholders}} */
const Rich = ({ text }: { text: string }) => (
  <>
    {text.split(PH_RE).map((part, i) =>
      /^\{\{[a-z0-9_]+\}\}$/i.test(part) ? (
        <mark key={i} className="rounded px-1 bg-amber-200 text-amber-900 dark:bg-amber-500/25 dark:text-amber-200 font-semibold">
          {PLACEHOLDER_LABELS[part.slice(2, -2).toLowerCase()] || part.slice(2, -2)}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    )}
  </>
);

const Seg = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode; disabled?: boolean; title?: string }[];
  onChange: (v: T) => void;
}) => (
  <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        disabled={o.disabled}
        title={o.title}
        onClick={() => onChange(o.value)}
        className={`h-7 px-2.5 rounded-md text-[11px] font-bold flex items-center gap-1.5 ${
          value === o.value
            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        } disabled:opacity-35 disabled:cursor-not-allowed`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const QUICK: { id: string; label: string }[] = [
  { id: 'gen-greet', label: 'Greeting' },
  { id: 'gen-esc-received', label: 'Escalation received' },
  { id: 'gen-hold', label: 'Hold' },
  { id: 'gen-back', label: 'Back from hold' },
  { id: 'gen-still-there', label: 'Still there?' },
  { id: 'gen-close-anything', label: 'Anything else?' },
  { id: 'gen-close-final', label: 'Final closing' },
];

// ---------------------------------------------------------------------------
// Main tab
// ---------------------------------------------------------------------------
export function TicketAssistanceTab() {
  const { currentUser } = useMetrics();
  const email: string = String(currentUser?.user_email || 'guest').toLowerCase();
  const P = `tabby-ta:${email}:`;

  const [view, setView] = useState<'assist' | 'links'>('assist');
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  // templates added / edited in the dashboard (Supabase ticket_templates)
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [storeStatus, setStoreStatus] = useState<'loading' | 'ready' | 'no-table' | 'error'>('loading');
  const [storeMsg, setStoreMsg] = useState('');
  const [editing, setEditing] = useState<{ base: Scenario; isNew: boolean } | null>(null);
  const [showHidden, setShowHidden] = useState(false);

  // team library
  const [team, setTeam] = useState<{ scenarios: Scenario[]; extra: Record<string, TeamExtra>; product: Product | null }>({
    scenarios: [],
    extra: {},
    product: null,
  });

  // selection + preferences
  const [selectedId, setSelectedId] = useState<string>('');
  const [channelPref, setChannelPref] = useState<Channel>('chat');
  const [langPref, setLangPref] = useState<Lang>('en');
  const [female, setFemale] = useState(false);
  const [productFilter, setProductFilter] = useState<string>('all');
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [hi, setHi] = useState(0);
  const [favs, setFavs] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [sig, setSig] = useState({ agent: '', teamEn: 'Tabby Customer Support', teamAr: 'فريق دعم عملاء تابي' });
  const [showSig, setShowSig] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [activeFlowId, setActiveFlowId] = useState<string>('');
  const [copied, setCopied] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ text: string; warn?: boolean } | null>(null);
  const [ready, setReady] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- load saved state ----
  useEffect(() => {
    setFavs(readLS<string[]>(P + 'fav', []));
    setRecent(readLS<string[]>(P + 'recent', []));
    const s = readLS(P + 'sig', null as null | typeof sig);
    setSig(s || { agent: firstName(currentUser?.username || email), teamEn: 'Tabby Customer Support', teamAr: 'فريق دعم عملاء تابي' });
    const prefs = readLS(P + 'prefs', {} as { channel?: Channel; lang?: Lang; female?: boolean; last?: string });
    if (prefs.channel) setChannelPref(prefs.channel);
    if (prefs.lang) setLangPref(prefs.lang);
    if (prefs.female) setFemale(true);
    if (prefs.last) setSelectedId(prefs.last);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    if (!ready) return;
    writeLS(P + 'prefs', { channel: channelPref, lang: langPref, female, last: selectedId });
  }, [ready, P, channelPref, langPref, female, selectedId]);

  // ---- load team templates (best effort) ----
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [m, e] = await Promise.all([
          supabase.from('chat_macros').select('*'),
          supabase.from('email_templates').select('*'),
        ]);
        if (!alive) return;
        const built = buildTeam(m.data || [], e.data || []);
        setTeam({ ...built, product: built.scenarios.length ? built.product : null });
      } catch {
        /* team library is optional */
      }
    })();
    return () => {
      alive = false;
    };
  }, [view]);

  // ---- load saved templates (and refresh live when a colleague saves one) ----
  const reloadRows = useCallback(async () => {
    const res = await loadTemplateRows();
    setRows(res.rows);
    setStoreStatus(res.status);
    setStoreMsg(res.message || '');
  }, []);
  useEffect(() => {
    reloadRows();
    const channel = supabase
      .channel('ticket-templates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_templates' }, () => reloadRows())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [reloadRows]);

  // ---- data: built-in + team library, then saved edits on top ----
  const baseScenarios: Scenario[] = useMemo(() => [...ALL_SCENARIOS, ...team.scenarios], [team.scenarios]);
  const baseById = useMemo(() => Object.fromEntries(baseScenarios.map((s) => [s.id, s])) as Record<string, Scenario>, [baseScenarios]);
  const rowById = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, r])) as Record<string, TemplateRow>, [rows]);
  const scenarios: Scenario[] = useMemo(() => {
    const out: Scenario[] = [];
    baseScenarios.forEach((s) => {
      const r = rowById[s.id];
      if (r?.hidden) return;
      out.push(r ? ({ ...r.data, id: s.id } as Scenario) : s);
    });
    rows.forEach((r) => {
      if (!baseById[r.id] && !r.hidden && r.data) out.push({ ...r.data, id: r.id } as Scenario);
    });
    return out;
  }, [baseScenarios, baseById, rows, rowById]);
  const products: Product[] = useMemo(() => {
    const list = (team.product ? [...PRODUCTS, team.product] : PRODUCTS).map((p) => ({ ...p, topics: [...p.topics] }));
    const known = new Set(list.flatMap((p) => p.topics.map((t) => t.id)));
    scenarios.forEach((s) => {
      if (known.has(s.topic)) return;
      const d = s as SavedTemplate;
      const p = list.find((x) => x.id === d.productId) || list[0];
      p.topics.push({ id: s.topic, name: d.topicName || 'Other' });
      known.add(s.topic);
    });
    return list;
  }, [team.product, scenarios]);
  const originOf = (id: string): Origin => (baseById[id] ? (rowById[id] ? 'edited' : 'builtin') : 'custom');
  const hiddenRows = rows.filter((r) => r.hidden && baseById[r.id]);
  const byId = useMemo(() => Object.fromEntries(scenarios.map((s) => [s.id, s])) as Record<string, Scenario>, [scenarios]);
  const flows: Flow[] = useMemo(
    () => FLOWS.map((f) => ({ ...f, steps: f.steps.filter((st) => byId[st.id]) })).filter((f) => f.steps.length > 0),
    [byId]
  );
  const topicToProduct = useMemo(
    () => Object.fromEntries(products.flatMap((p) => p.topics.map((t) => [t.id, p]))) as Record<string, Product>,
    [products]
  );
  const topicName = useMemo(
    () => Object.fromEntries(products.flatMap((p) => p.topics.map((t) => [t.id, t.name]))) as Record<string, string>,
    [products]
  );
  const byTopic = useMemo(() => {
    const map: Record<string, Scenario[]> = {};
    scenarios.forEach((s) => (map[s.topic] = map[s.topic] || []).push(s));
    return map;
  }, [scenarios]);

  // search index
  const index = useMemo(
    () =>
      scenarios.map((s) => ({
        s,
        title: norm(s.title),
        keys: norm(`${s.keys || ''} ${topicName[s.topic] || ''} ${topicToProduct[s.topic]?.name || ''}`),
        when: norm(s.when),
        text: norm(
          [
            ...chatMessages(s, 'en'),
            ...(s.ar ? chatMessages(s, 'ar') : []),
            s.emailEn || '',
            s.emailAr || '',
            s.subject?.en || '',
          ].join(' ')
        ),
      })),
    [scenarios, topicName, topicToProduct]
  );

  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return [] as Scenario[];
    const toks = tokensOf(query);
    const list = toks.length ? toks : [q];
    return index
      .map((ix) => {
        if (productFilter !== 'all' && topicToProduct[ix.s.topic]?.id !== productFilter) return { s: ix.s, sc: 0 };
        let sc = ix.title.includes(q) ? 40 : 0;
        let hit = 0;
        for (const t of list) {
          const v = ix.title.includes(t) ? 8 : ix.keys.includes(t) ? 6 : ix.when.includes(t) ? 3 : ix.text.includes(t) ? 1 : 0;
          if (v) hit++;
          sc += v;
        }
        if (!hit) return { s: ix.s, sc: 0 };
        return { s: ix.s, sc: sc * (hit / list.length) + (favs.includes(ix.s.id) ? 2 : 0) };
      })
      .filter((r) => r.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, 40)
      .map((r) => r.s);
  }, [query, index, productFilter, topicToProduct, favs]);

  useEffect(() => setHi(0), [query, productFilter]);

  const sel: Scenario | undefined = selectedId ? byId[selectedId] : undefined;
  const selProduct = sel ? topicToProduct[sel.topic] : undefined;
  const selExtra = sel ? team.extra[sel.id] : undefined;

  const channel: Channel = sel ? (hasChannel(sel, channelPref) ? channelPref : hasChannel(sel, 'chat') ? 'chat' : 'email') : channelPref;
  const lang: Lang = sel ? (hasLang(sel, langPref) ? langPref : 'en') : langPref;
  const useFemale = lang === 'ar' && female && !!(channel === 'chat' ? selExtra?.femaleChat : selExtra?.femaleEmail);

  // raw (unfilled) texts for the current view
  const rawMessages: string[] = useMemo(() => {
    if (!sel) return [];
    if (channel === 'chat') return useFemale && selExtra?.femaleChat ? selExtra.femaleChat : chatMessages(sel, lang);
    return [];
  }, [sel, channel, lang, useFemale, selExtra]);
  const rawSubject = sel && channel === 'email' ? emailSubject(sel, lang) : '';
  const rawEmail = sel && channel === 'email' ? (useFemale && selExtra?.femaleEmail ? selExtra.femaleEmail : emailBody(sel, lang)) : '';

  const placeholders = useMemo(
    () => placeholdersOf([...rawMessages, rawSubject, rawEmail]),
    [rawMessages, rawSubject, rawEmail]
  );

  const fill = useCallback(
    (t: string) =>
      t.replace(/\{\{([a-z0-9_]+)\}\}/gi, (m, k: string) => {
        const key = k.toLowerCase();
        if (key === 'agent_name') return sig.agent.trim() || m;
        if (key === 'team_name') return (lang === 'ar' ? sig.teamAr : sig.teamEn).trim() || m;
        const v = (values[key] || '').trim();
        return v || m;
      }),
    [sig, values, lang]
  );

  const messages = rawMessages.map(fill);
  const subject = fill(rawSubject);
  const emailText = fill(rawEmail);

  // flows for the selected scenario
  const selFlows: Flow[] = useMemo(() => (sel ? flows.filter((f) => f.steps.some((st) => st.id === sel.id)) : []), [sel, flows]);
  const flow: Flow | undefined = selFlows.find((f) => f.id === activeFlowId) || selFlows[0];

  // ---- actions ----
  const flash = (text: string, warn?: boolean) => {
    setToast({ text, warn });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1700);
  };

  const doCopy = useCallback(async (text: string, label: string, mark?: string) => {
    const ok = await copyText(text);
    if (!ok) return flash('Copy failed – select the text and press Ctrl+C', true);
    const blanks = (text.match(/\{\{[a-z0-9_]+\}\}/gi) || []).length;
    if (mark) setCopied((prev) => new Set(prev).add(mark));
    flash(blanks ? `${label} copied – ${blanks} blank${blanks > 1 ? 's' : ''} still to fill` : `${label} copied`, !!blanks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = useCallback(
    (id: string, opts?: { flowId?: string; keepQuery?: boolean }) => {
      if (!byId[id]) return;
      setSelectedId(id);
      setCopied(new Set());
      if (opts?.flowId) setActiveFlowId(opts.flowId);
      setOpenTopics((prev) => new Set(prev).add(byId[id].topic));
      setRecent((prev) => {
        const next = [id, ...prev.filter((x) => x !== id)].slice(0, 8);
        writeLS(P + 'recent', next);
        return next;
      });
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setTimeout(() => viewerRef.current?.scrollIntoView({ block: 'start' }), 30);
      }
    },
    [byId, P]
  );

  const toggleFav = (id: string) =>
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      writeLS(P + 'fav', next);
      return next;
    });

  const flowMove = (dir: 1 | -1) => {
    if (!flow || !sel) return;
    const cur = flow.steps.find((s) => s.id === sel.id)?.step ?? 0;
    const cand = flow.steps.filter((s) => (dir === 1 ? s.step > cur : s.step < cur));
    if (!cand.length) return;
    const target = dir === 1 ? Math.min(...cand.map((c) => c.step)) : Math.max(...cand.map((c) => c.step));
    const first = cand.find((c) => c.step === target);
    if (first) select(first.id, { flowId: flow.id });
  };

  const copyAll = () => {
    if (!sel) return;
    if (channel === 'chat') doCopy(messages.join('\n\n'), 'All messages', 'all');
    else doCopy(emailText, 'Email body', 'body');
  };

  const quickCopy = (id: string) => {
    const s = byId[id];
    if (!s) return;
    const l: Lang = hasLang(s, langPref) ? langPref : 'en';
    doCopy(chatMessages(s, l).map(fill).join('\n\n'), s.title.split(' – ')[0]);
  };

  // ---- add / edit templates ----
  const needSetup = () => {
    if (storeStatus === 'ready') return null;
    return storeStatus === 'no-table'
      ? 'Saving needs a one-time setup: copy the SQL in the yellow box above and run it in Supabase → SQL Editor, then refresh.'
      : `Could not reach the saved templates (${storeMsg || 'unknown error'}).`;
  };

  const startNew = () => {
    setView('assist');
    setEditing({
      base: {
        id: `custom-${Date.now().toString(36)}`,
        topic: sel?.topic || 'gen-follow',
        title: '',
        when: '',
        en: { ack: '', body: [] },
      },
      isNew: true,
    });
    setTimeout(() => viewerRef.current?.scrollIntoView({ block: 'start' }), 30);
  };

  const saveEdit = async (data: SavedTemplate) => {
    const blocked = needSetup();
    if (blocked) return blocked;
    const err = await saveTemplateRow({ id: data.id, data, hidden: false }, email);
    if (err) return `Could not save: ${err}`;
    await reloadRows();
    setEditing(null);
    setSelectedId(data.id);
    setCopied(new Set());
    flash('Template saved – everyone sees it now');
    return null;
  };

  const resetEdit = async (id: string) => {
    if (!window.confirm('Go back to the original version of this template? Your team’s changes will be removed.')) return;
    const err = await deleteTemplateRow(id);
    if (err) return flash(`Could not reset: ${err}`, true);
    await reloadRows();
    setEditing(null);
    flash('Back to the original version');
  };

  const deleteCustom = async (id: string) => {
    if (!window.confirm('Delete this template for everyone? This can’t be undone.')) return;
    const err = await deleteTemplateRow(id);
    if (err) return flash(`Could not delete: ${err}`, true);
    await reloadRows();
    setEditing(null);
    setSelectedId('');
    flash('Template deleted');
  };

  const hideTemplate = async (s: Scenario) => {
    const blocked = needSetup();
    if (blocked) return flash(blocked, true);
    if (!window.confirm('Hide this template for everyone? You can show it again from “Hidden templates” at the bottom of the topic list.')) return;
    const existing = rowById[s.id];
    const err = await saveTemplateRow({ id: s.id, data: (existing?.data || baseById[s.id] || s) as SavedTemplate, hidden: true }, email);
    if (err) return flash(`Could not hide: ${err}`, true);
    await reloadRows();
    setEditing(null);
    setSelectedId('');
    flash('Template hidden');
  };

  const restoreTemplate = async (r: TemplateRow) => {
    const original = baseById[r.id];
    const unchanged = original && JSON.stringify(r.data) === JSON.stringify(original);
    const err = unchanged ? await deleteTemplateRow(r.id) : await saveTemplateRow({ ...r, hidden: false }, email);
    if (err) return flash(`Could not restore: ${err}`, true);
    await reloadRows();
    flash('Template is visible again');
  };

  const SetupBox = () => (
    <div className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2">
      <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
        <Database className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          {storeStatus === 'error'
            ? `Could not reach the saved templates: ${storeMsg}`
            : 'One-time setup so templates and links you add are saved for the whole team: copy this, run it in Supabase → SQL Editor, then refresh the page.'}
        </span>
      </p>
      {storeStatus !== 'error' && (
        <div className="relative">
          <pre className="text-[11px] leading-relaxed p-3 rounded-lg bg-slate-900 text-emerald-200 overflow-auto max-h-48 whitespace-pre">{SETUP_SQL}</pre>
          <button
            type="button"
            onClick={() => doCopy(SETUP_SQL, 'SQL')}
            className="absolute top-2 right-2 h-7 px-2 rounded-md text-[11px] font-bold bg-white/10 text-white hover:bg-white/20 flex items-center gap-1"
          >
            <Copy className="h-3.5 w-3.5" /> Copy SQL
          </button>
        </div>
      )}
    </div>
  );

  // ---- Home: close any open template / editor and go back to the start screen ----
  const goHome = () => {
    if (editing && !window.confirm('Leave the editor? Changes you haven’t saved will be lost.')) return;
    setEditing(null);
    setView('assist');
    setSelectedId('');
    setQuery('');
    setCopied(new Set());
    setShowKeys(false);
    setShowSig(false);
    setTimeout(() => viewerRef.current?.closest('main')?.scrollTo({ top: 0 }), 0);
  };

  // ---- keyboard ----
  const keyRef = useRef<(e: KeyboardEvent) => void>(() => {});
  keyRef.current = (e: KeyboardEvent) => {
    if (view !== 'assist' || editing || e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target as HTMLElement | null;
    const typing = !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
    if (typing) return;
    const k = e.key.toLowerCase();
    if (k === '/') {
      e.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
      return;
    }
    if (k === '?') return setShowKeys((v) => !v);
    if (k === 'h' || k === 'escape') return goHome();
    if (!sel) return;
    if (/^[1-9]$/.test(k)) {
      const i = Number(k) - 1;
      if (channel === 'chat' && messages[i]) {
        e.preventDefault();
        doCopy(messages[i], `Message ${i + 1}`, `m${i}`);
      } else if (channel === 'email') {
        if (i === 0 && subject) doCopy(subject, 'Subject', 'subject');
        if ((i === 1 || (i === 0 && !subject)) && emailText) doCopy(emailText, 'Email body', 'body');
      }
      return;
    }
    if (k === ' ' && channel === 'chat') {
      e.preventDefault();
      const i = messages.findIndex((_, idx) => !copied.has(`m${idx}`));
      if (i >= 0) doCopy(messages[i], `Message ${i + 1}`, `m${i}`);
      else flash('All messages already copied');
      return;
    }
    if (k === 'a') return copyAll();
    if (k === 'c' && hasChannel(sel, 'chat')) return setChannelPref('chat');
    if (k === 'e' && hasChannel(sel, 'email')) return setChannelPref('email');
    if (k === 'l' && hasLang(sel, 'ar')) return setLangPref(lang === 'en' ? 'ar' : 'en');
    if (k === 'f') return toggleFav(sel.id);
    if (k === 'n' || k === 'arrowright') return flowMove(1);
    if (k === 'p' || k === 'arrowleft') return flowMove(-1);
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyRef.current(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHi((h) => Math.min(h + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && results[hi]) {
      e.preventDefault();
      select(results[hi].id);
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      if (query) setQuery('');
      else (e.target as HTMLInputElement).blur();
    }
  };

  // keep the highlighted search result visible
  useEffect(() => {
    document.getElementById(`ta-res-${hi}`)?.scrollIntoView({ block: 'nearest' });
  }, [hi]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const panel = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#101a30]/90';

  const ScenarioRow = ({ s, active, id, compact }: { s: Scenario; active?: boolean; id?: string; compact?: boolean }) => {
    const p = topicToProduct[s.topic];
    return (
      <button
        id={id}
        type="button"
        onClick={() => select(s.id)}
        className={`w-full text-left flex items-start gap-2 rounded-lg px-2 py-1.5 text-xs ${
          s.id === selectedId
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold'
            : active
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
        }`}
      >
        <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: p?.color || '#94a3b8' }} />
        <span className="min-w-0 flex-1">
          <span className="block leading-snug">{s.title}</span>
          {!compact && <span className="block text-[10px] text-slate-400 truncate">{topicName[s.topic]}</span>}
        </span>
        {s.channels?.length === 1 && (
          <span className="shrink-0 mt-0.5 text-slate-400">
            {s.channels[0] === 'chat' ? <MessageSquare className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <LifeBuoy className="h-6 w-6 text-emerald-500" /> Ticket Assistance
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Find the case, copy message by message (chat) or the full email. Press <Kbd>/</Kbd> to search, <Kbd>?</Kbd> for shortcuts.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goHome}
            title="Home – close the open template (H)"
            className="h-8 px-3 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1.5"
          >
            <Home className="h-3.5 w-3.5" /> Home
          </button>
          <Seg
            value={view}
            onChange={setView}
            options={[
              { value: 'assist', label: <><Zap className="h-3.5 w-3.5" /> Assistant</> },
              { value: 'links', label: <><Link2 className="h-3.5 w-3.5" /> Links & emails</> },
            ]}
          />
          {canEdit && view === 'assist' && (
            <button
              type="button"
              onClick={startNew}
              className="h-8 px-3 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> New template
            </button>
          )}
        </div>
      </div>

      {view === 'links' ? (
        <TicketLinks onCopied={flash} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-4 items-start">
          {/* ================= LEFT: finder ================= */}
          <aside className={`${panel} p-3 space-y-3 lg:sticky lg:top-0 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                placeholder="Type or paste the customer message…"
                className="w-full h-10 pl-9 pr-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {query ? (
                  <button type="button" onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white" title="Clear (Esc)">
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <Kbd>/</Kbd>
                )}
              </span>
            </div>

            {/* product chips */}
            <div className="flex flex-wrap gap-1.5">
              {[{ id: 'all', name: 'All', color: '#64748b' } as Pick<Product, 'id' | 'name' | 'color'>, ...products].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProductFilter(p.id)}
                  className={`h-7 px-2.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                    productFilter === p.id
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {p.id !== 'all' && <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />}
                  {p.name}
                </button>
              ))}
            </div>

            {query ? (
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  {results.length ? `${results.length} match${results.length > 1 ? 'es' : ''} · ↑ ↓ Enter` : 'No match – try other words'}
                </p>
                {results.map((s, i) => (
                  <ScenarioRow key={s.id} s={s} active={i === hi} id={`ta-res-${i}`} />
                ))}
              </div>
            ) : (
              <>
                {favs.filter((id) => byId[id]).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Favourites
                    </p>
                    {favs
                      .filter((id) => byId[id])
                      .slice(0, 10)
                      .map((id) => (
                        <ScenarioRow key={id} s={byId[id]} compact />
                      ))}
                  </div>
                )}
                {recent.filter((id) => byId[id]).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Recent
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {recent
                        .filter((id) => byId[id])
                        .map((id) => (
                          <button
                            key={id}
                            type="button"
                            onClick={() => select(id)}
                            className={`max-w-full truncate h-6 px-2 rounded-md text-[11px] border ${
                              id === selectedId
                                ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            {byId[id].title}
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* guided flows */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1 flex items-center gap-1">
                    <GitBranch className="h-3 w-3" /> Step-by-step cases
                  </p>
                  <div className="grid grid-cols-1 gap-0.5">
                    {flows.filter((f) => productFilter === 'all' || f.product === productFilter).map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => select(f.steps[0].id, { flowId: f.id })}
                        className={`text-left flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                          flow?.id === f.id ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: products.find((p) => p.id === f.product)?.color }} />
                        <span className="flex-1">{f.title}</span>
                        <span className="text-[10px] text-slate-400">{new Set(f.steps.map((s) => s.step)).size} steps</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* topic tree */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1 flex items-center gap-1">
                    <ListTree className="h-3 w-3" /> All topics
                  </p>
                  {products
                    .filter((p) => productFilter === 'all' || p.id === productFilter)
                    .map((p) => (
                      <div key={p.id} className="mb-2">
                        <p className="px-1 py-1 text-[11px] font-extrabold flex items-center gap-1.5 text-slate-800 dark:text-slate-100">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
                          {p.name}
                        </p>
                        {p.topics.map((t) => {
                          const list = byTopic[t.id] || [];
                          if (!list.length) return null;
                          const open = openTopics.has(t.id) || (productFilter === p.id && p.topics.length <= 3);
                          return (
                            <div key={t.id}>
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenTopics((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(t.id)) next.delete(t.id);
                                    else next.add(t.id);
                                    return next;
                                  })
                                }
                                className="w-full flex items-center gap-1.5 px-1.5 py-1 rounded-md text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                              >
                                {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                                <span className="flex-1 text-left font-semibold">{t.name}</span>
                                <span className="text-[10px] text-slate-400">{list.length}</span>
                              </button>
                              {open && (
                                <div className="ml-3 pl-2 border-l border-slate-200 dark:border-slate-700">
                                  {list.map((s) => (
                                    <ScenarioRow key={s.id} s={s} compact />
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                </div>

                {canEdit && hiddenRows.length > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowHidden((v) => !v)}
                      className="w-full flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <EyeOff className="h-3 w-3" /> Hidden templates ({hiddenRows.length})
                    </button>
                    {showHidden && (
                      <div className="mt-1 space-y-0.5">
                        {hiddenRows.map((r) => (
                          <div key={r.id} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
                            <span className="flex-1 truncate">{baseById[r.id]?.title || r.data?.title}</span>
                            <button type="button" onClick={() => restoreTemplate(r)} className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                              Show again
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </aside>

          {/* ================= RIGHT: viewer ================= */}
          <section ref={viewerRef} className="space-y-3 min-w-0 scroll-mt-4">
            {/* quick send */}
            <div className={`${panel} px-3 py-2 flex flex-wrap items-center gap-1.5`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Quick copy
              </span>
              {QUICK.filter((q) => byId[q.id]).map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={(e) => (e.shiftKey ? select(q.id) : quickCopy(q.id))}
                  title="Click to copy · Shift+click to open"
                  className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
                >
                  {q.label}
                </button>
              ))}
              <span className="flex-1" />
              <button
                type="button"
                onClick={() => setShowSig((v) => !v)}
                className="h-7 px-2.5 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                title="Your name and team name used in templates"
              >
                <Settings2 className="h-3.5 w-3.5" /> {sig.agent || 'Set your name'}
              </button>
              <button
                type="button"
                onClick={() => setShowKeys((v) => !v)}
                className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center"
                title="Keyboard shortcuts (?)"
              >
                <Keyboard className="h-3.5 w-3.5" />
              </button>
            </div>

            {showSig && (
              <div className={`${panel} p-3 grid grid-cols-1 sm:grid-cols-3 gap-2`}>
                {(
                  [
                    ['agent', 'Your name (shown to the customer)'],
                    ['teamEn', 'Team name – English'],
                    ['teamAr', 'Team name – Arabic'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="text-[11px] font-semibold text-slate-500 space-y-1">
                    <span>{label}</span>
                    <input
                      value={sig[k]}
                      dir={k === 'teamAr' ? 'rtl' : 'ltr'}
                      onChange={(e) => {
                        const next = { ...sig, [k]: e.target.value };
                        setSig(next);
                        writeLS(P + 'sig', next);
                      }}
                      className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </label>
                ))}
              </div>
            )}

            {showKeys && (
              <div className={`${panel} p-3 text-[11px] text-slate-600 dark:text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5`}>
                <span><Kbd>/</Kbd> search</span>
                <span><Kbd>↑</Kbd><Kbd>↓</Kbd> <Kbd>Enter</Kbd> pick result</span>
                <span><Kbd>1</Kbd>–<Kbd>9</Kbd> copy message</span>
                <span><Kbd>Space</Kbd> copy next message</span>
                <span><Kbd>A</Kbd> copy all / email body</span>
                <span><Kbd>C</Kbd> chat · <Kbd>E</Kbd> email</span>
                <span><Kbd>L</Kbd> English / Arabic</span>
                <span><Kbd>N</Kbd> <Kbd>P</Kbd> next / previous step</span>
                <span><Kbd>F</Kbd> favourite</span>
                <span><Kbd>Esc</Kbd> clear search</span>
                <span><Kbd>H</Kbd> Home</span>
              </div>
            )}

            {editing && canEdit && storeStatus !== 'ready' && <SetupBox />}

            {editing ? (
              <TicketTemplateEditor
                key={editing.base.id}
                initial={editing.base}
                isNew={editing.isNew}
                origin={editing.isNew ? 'custom' : originOf(editing.base.id)}
                products={products}
                topicName={topicName}
                onCancel={() => setEditing(null)}
                onSave={saveEdit}
                onReset={!editing.isNew && originOf(editing.base.id) === 'edited' ? () => resetEdit(editing.base.id) : undefined}
                onDelete={!editing.isNew && originOf(editing.base.id) === 'custom' ? () => deleteCustom(editing.base.id) : undefined}
                onHide={!editing.isNew && originOf(editing.base.id) !== 'custom' ? () => hideTemplate(editing.base) : undefined}
              />
            ) : !sel ? (
              <div className={`${panel} p-6 space-y-4`}>
                <div className="flex items-start gap-3">
                  <BookOpen className="h-8 w-8 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Pick a case to start</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Paste the customer’s message into the search box, or open a topic on the left. Each reply is split into short messages:
                      acknowledge → explain → next step → soft close, so you never send one big paragraph.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {flows.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => select(f.steps[0].id, { flowId: f.id })}
                      className="text-left rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:border-emerald-500"
                    >
                      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: products.find((p) => p.id === f.product)?.color }}>
                        <GitBranch className="h-3 w-3" /> {products.find((p) => p.id === f.product)?.name}
                      </span>
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">{f.title}</span>
                      <span className="block text-[11px] text-slate-500 mt-0.5 truncate">
                        {Array.from(new Set(f.steps.map((s) => s.label))).slice(0, 4).join(' → ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* flow stepper */}
                {flow && (
                  <div className={`${panel} p-3 space-y-2`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <GitBranch className="h-4 w-4 text-emerald-500" />
                      {selFlows.length > 1 ? (
                        <Seg
                          value={flow.id}
                          onChange={setActiveFlowId}
                          options={selFlows.map((f) => ({ value: f.id, label: f.title }))}
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{flow.title}</span>
                      )}
                      <span className="flex-1" />
                      <button type="button" onClick={() => flowMove(-1)} className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1">
                        <ArrowLeft className="h-3.5 w-3.5" /> Prev <Kbd>P</Kbd>
                      </button>
                      <button type="button" onClick={() => flowMove(1)} className="h-7 px-2 rounded-lg border border-emerald-500/50 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1">
                        Next <ArrowRight className="h-3.5 w-3.5" /> <Kbd>N</Kbd>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
                      {Array.from(new Set(flow.steps.map((s) => s.step)))
                        .sort((a, b) => a - b)
                        .map((n, gi, arr) => {
                          const branch = flow.steps.filter((s) => s.step === n);
                          return (
                            <div key={n} className="flex items-center gap-1 shrink-0">
                              <div className="flex flex-col gap-1">
                                {branch.map((st) => {
                                  const on = st.id === sel.id;
                                  return (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() => select(st.id, { flowId: flow.id })}
                                      className={`h-7 px-2 rounded-lg text-[11px] font-semibold border whitespace-nowrap flex items-center gap-1.5 ${
                                        on
                                          ? 'bg-emerald-600 border-emerald-600 text-white'
                                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500'
                                      }`}
                                    >
                                      <span className={`text-[10px] font-extrabold ${on ? 'text-white/80' : 'text-slate-400'}`}>{gi + 1}{branch.length > 1 ? String.fromCharCode(97 + branch.indexOf(st)) : ''}</span>
                                      {st.label}
                                    </button>
                                  );
                                })}
                              </div>
                              {gi < arr.length - 1 && <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* scenario card */}
                <div className={`${panel} p-4 space-y-3`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: selProduct?.color }}>
                        {selProduct?.name} <ChevronRight className="h-3 w-3" /> {topicName[sel.topic]}
                      </p>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight mt-0.5 flex items-center gap-2">
                        {sel.title}
                        <button type="button" onClick={() => toggleFav(sel.id)} title="Favourite (F)" className="shrink-0">
                          <Star className={`h-4 w-4 ${favs.includes(sel.id) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600 hover:text-amber-400'}`} />
                        </button>
                        {originOf(sel.id) !== 'builtin' && (
                          <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                            {originOf(sel.id) === 'edited' ? 'Edited by team' : 'Added by team'}
                          </span>
                        )}
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => setEditing({ base: sel, isNew: false })}
                            className="shrink-0 h-7 px-2 rounded-lg text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        )}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Seg
                        value={channel}
                        onChange={setChannelPref}
                        options={[
                          { value: 'chat', label: <><MessageSquare className="h-3.5 w-3.5" /> Chat <Kbd>C</Kbd></>, disabled: !hasChannel(sel, 'chat'), title: hasChannel(sel, 'chat') ? '' : 'Email only' },
                          { value: 'email', label: <><Mail className="h-3.5 w-3.5" /> Email <Kbd>E</Kbd></>, disabled: !hasChannel(sel, 'email'), title: hasChannel(sel, 'email') ? '' : 'Chat only' },
                        ]}
                      />
                      <Seg
                        value={lang}
                        onChange={setLangPref}
                        options={[
                          { value: 'en', label: 'EN' },
                          { value: 'ar', label: 'عربي', disabled: !hasLang(sel, 'ar'), title: hasLang(sel, 'ar') ? 'L' : 'English only' },
                        ]}
                      />
                      {lang === 'ar' && (selExtra?.femaleChat || selExtra?.femaleEmail) && (
                        <Seg
                          value={female ? 'f' : 'm'}
                          onChange={(v) => setFemale(v === 'f')}
                          options={[
                            { value: 'm', label: 'Male' },
                            { value: 'f', label: 'Female' },
                          ]}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-600 dark:text-slate-300 flex gap-2">
                      <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
                      <span><b className="text-slate-800 dark:text-slate-100">When to use:</b> {sel.when}</span>
                    </div>
                    {sel.tip && (
                      <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-2.5 text-xs text-amber-800 dark:text-amber-200 flex gap-2">
                        <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                        <span><b>Internal tip:</b> {sel.tip}</span>
                      </div>
                    )}
                  </div>

                  {selProduct?.id === 'internal' && (
                    <div className="rounded-xl bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30 p-2 text-[11px] font-semibold text-pink-700 dark:text-pink-200 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" /> Internal – for colleagues and partners, not for the customer.
                    </div>
                  )}

                  {/* placeholders */}
                  {placeholders.length > 0 && (
                    <div className="rounded-xl border border-dashed border-amber-300 dark:border-amber-500/40 p-2.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Fill in before sending</p>
                        <button type="button" onClick={() => setValues({})} className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                          Clear all
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                        {placeholders.map((k) => (
                          <label key={k} className="text-[11px] text-slate-500 space-y-0.5">
                            <span>{PLACEHOLDER_LABELS[k] || k}</span>
                            <input
                              value={values[k] || ''}
                              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value }))}
                              className="w-full h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* output */}
                  {channel === 'chat' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] text-slate-500">
                          {messages.length} message{messages.length > 1 ? 's' : ''} · send in order · <Kbd>Space</Kbd> copies the next one
                        </p>
                        <button
                          type="button"
                          onClick={copyAll}
                          className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                            copied.has('all') ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {copied.has('all') ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy all <Kbd>A</Kbd>
                        </button>
                      </div>
                      {messages.map((m, i) => {
                        const done = copied.has(`m${i}`);
                        return (
                          <div
                            key={i}
                            className={`group flex items-start gap-2 rounded-xl border p-2.5 ${
                              done ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60'
                            }`}
                          >
                            <span className={`mt-0.5 h-5 w-5 shrink-0 rounded-md text-[10px] font-extrabold flex items-center justify-center ${done ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200'}`}>
                              {done ? <Check className="h-3 w-3" /> : i + 1}
                            </span>
                            <p dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`flex-1 min-w-0 text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-100 ${lang === 'ar' ? 'text-right' : ''}`}>
                              <Rich text={m} />
                            </p>
                            <button
                              type="button"
                              onClick={() => doCopy(m, `Message ${i + 1}`, `m${i}`)}
                              title={i < 9 ? `Copy (${i + 1})` : 'Copy'}
                              className="shrink-0 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                            >
                              <Copy className="h-3.5 w-3.5" /> {i < 9 && <Kbd>{i + 1}</Kbd>}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subject && (
                        <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-2.5">
                          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Subject</span>
                          <p dir={lang === 'ar' ? 'rtl' : 'ltr'} className="flex-1 min-w-0 text-sm font-semibold text-slate-800 dark:text-slate-100">
                            <Rich text={subject} />
                          </p>
                          <button
                            type="button"
                            onClick={() => doCopy(subject, 'Subject', 'subject')}
                            className="shrink-0 h-8 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 flex items-center gap-1"
                          >
                            {copied.has('subject') ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />} <Kbd>1</Kbd>
                          </button>
                        </div>
                      )}
                      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-400">Email body</span>
                          <button
                            type="button"
                            onClick={() => doCopy(emailText, 'Email body', 'body')}
                            className={`h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                              copied.has('body') ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            }`}
                          >
                            {copied.has('body') ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy email <Kbd>{subject ? '2' : 'A'}</Kbd>
                          </button>
                        </div>
                        <p dir={lang === 'ar' ? 'rtl' : 'ltr'} className={`p-3 text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-100 ${lang === 'ar' ? 'text-right' : ''}`}>
                          <Rich text={emailText} />
                        </p>
                      </div>
                    </div>
                  )}

                  {/* related */}
                  {(() => {
                    const rel = [
                      ...(sel.related || []),
                      ...(byTopic[sel.topic] || []).map((s) => s.id),
                    ].filter((id, i, a) => id !== sel.id && byId[id] && a.indexOf(id) === i).slice(0, 8);
                    if (!rel.length) return null;
                    return (
                      <div className="pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Related in this topic</p>
                        <div className="flex flex-wrap gap-1.5">
                          {rel.map((id) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => select(id)}
                              className="h-7 px-2.5 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300"
                            >
                              {byId[id].title}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 ${
            toast.warn ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.warn ? <AlertTriangle className="h-4 w-4" /> : <Check className="h-4 w-4" />} {toast.text}
        </div>
      )}
    </div>
  );
}
