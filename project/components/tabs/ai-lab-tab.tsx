'use client';

// ---------------------------------------------------------------------------
// AI Lab (Beta): the AI helper in its own tab while the team tests it.
// Uses the same templates as Ticket Assistance (built-in + templates edited / added
// in the dashboard). Admins see it automatically; give testers access from
// Admin Settings → tab permissions → "AI Lab (Beta)".
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, FlaskConical, Copy, X, AlertTriangle } from 'lucide-react';
import { useMetrics } from '@/lib/metrics-context';
import { AiHelper } from '@/components/ai-helper';
import { TicketTemplateEditor } from '@/components/ticket-template-editor';
import { loadTemplateRows, saveTemplateRow } from '@/lib/ticket-store';
import type { TemplateRow, SavedTemplate } from '@/lib/ticket-store';
import { PRODUCTS, ALL_SCENARIOS, chatMessages, emailBody, hasLang } from '@/lib/ticket-library';
import type { Scenario, Product, Lang } from '@/lib/ticket-library';
import { norm, tokensOf } from '@/lib/text-match';

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

const firstName = (raw: string) => {
  const p = String(raw || '').split('@')[0].split(/[._\-\s]+/).filter((x) => x && !/^\d+$/.test(x))[0] || '';
  return p ? p.charAt(0).toUpperCase() + p.slice(1) : '';
};

const panel = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#101a30]/90';

export function AiLabTab() {
  const { currentUser } = useMetrics();
  const email: string = String(currentUser?.user_email || 'guest').toLowerCase();
  const canEdit = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  // same name settings as Ticket Assistance
  const [sig, setSig] = useState({ agent: '', teamEn: 'Tabby Customer Support', teamAr: 'فريق دعم عملاء تابي' });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(`tabby-ta:${email}:sig`);
      if (raw) return setSig(JSON.parse(raw));
    } catch {
      /* storage unavailable */
    }
    setSig((s) => ({ ...s, agent: firstName(currentUser?.username || email) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  // ---- templates: built-in + the team's saved edits ----
  const [rows, setRows] = useState<TemplateRow[]>([]);
  const [storeReady, setStoreReady] = useState(true);
  const reloadRows = useCallback(async () => {
    const r = await loadTemplateRows();
    setRows(r.rows);
    setStoreReady(r.status === 'ready');
  }, []);
  useEffect(() => {
    reloadRows();
  }, [reloadRows]);

  const baseById = useMemo(() => Object.fromEntries(ALL_SCENARIOS.map((s) => [s.id, s])) as Record<string, Scenario>, []);
  const scenarios: Scenario[] = useMemo(() => {
    const rowById = Object.fromEntries(rows.map((r) => [r.id, r])) as Record<string, TemplateRow>;
    const out: Scenario[] = [];
    ALL_SCENARIOS.forEach((s) => {
      const r = rowById[s.id];
      if (r?.hidden) return;
      out.push(r ? ({ ...r.data, id: s.id } as Scenario) : s);
    });
    rows.forEach((r) => {
      if (!baseById[r.id] && !r.hidden && r.data) out.push({ ...r.data, id: r.id } as Scenario);
    });
    return out;
  }, [rows, baseById]);

  const products: Product[] = useMemo(() => {
    const list = PRODUCTS.map((p) => ({ ...p, topics: [...p.topics] }));
    const known = new Set(list.flatMap((p) => p.topics.map((t) => t.id)));
    scenarios.forEach((s) => {
      if (known.has(s.topic)) return;
      const d = s as SavedTemplate;
      const p = list.find((x) => x.id === d.productId) || list[0];
      p.topics.push({ id: s.topic, name: d.topicName || 'Other' });
      known.add(s.topic);
    });
    return list;
  }, [scenarios]);

  const byId = useMemo(() => Object.fromEntries(scenarios.map((s) => [s.id, s])) as Record<string, Scenario>, [scenarios]);
  const topicToProduct = useMemo(
    () => Object.fromEntries(products.flatMap((p) => p.topics.map((t) => [t.id, p]))) as Record<string, Product>,
    [products]
  );
  const topicName = useMemo(
    () => Object.fromEntries(products.flatMap((p) => p.topics.map((t) => [t.id, t.name]))) as Record<string, string>,
    [products]
  );

  const index = useMemo(
    () =>
      scenarios.map((s) => ({
        s,
        title: norm(s.title),
        keys: norm(`${s.keys || ''} ${topicName[s.topic] || ''} ${topicToProduct[s.topic]?.name || ''}`),
        when: norm(s.when),
        text: norm([...chatMessages(s, 'en'), ...(s.ar ? chatMessages(s, 'ar') : []), s.emailEn || '', s.subject?.en || ''].join(' ')),
      })),
    [scenarios, topicName, topicToProduct]
  );

  // closest templates for any text
  const rank = useCallback(
    (text: string, n: number): Scenario[] => {
      const toks = Array.from(new Set(tokensOf(text))).slice(0, 80);
      if (!toks.length) return [];
      return index
        .map((ix) => {
          let sc = 0;
          let hit = 0;
          for (const t of toks) {
            const v = ix.title.includes(t) ? 8 : ix.keys.includes(t) ? 6 : ix.when.includes(t) ? 3 : ix.text.includes(t) ? 1 : 0;
            if (v) hit++;
            sc += v;
          }
          return { s: ix.s, sc: hit >= 2 ? sc * Math.sqrt(hit) : 0 };
        })
        .filter((r) => r.sc > 0 && !r.s.internal)
        .sort((a, b) => b.sc - a.sc)
        .slice(0, n)
        .map((r) => r.s);
    },
    [index]
  );

  // ---- toast ----
  const [toast, setToast] = useState<{ text: string; warn?: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (text: string, warn?: boolean) => {
    setToast({ text, warn });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2600);
  };
  const copy = async (text: string, label: string) => {
    const ok = await copyText(text);
    flash(ok ? `${label} copied` : 'Could not copy – please select and copy manually', !ok);
  };

  // ---- template preview & editor ----
  const [preview, setPreview] = useState<string>('');
  const [previewLang, setPreviewLang] = useState<Lang>('en');
  const [editing, setEditing] = useState<{ base: Scenario; isNew: boolean } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const saveEdit = async (data: SavedTemplate) => {
    if (!storeReady) return 'Saving needs the one-time Ticket Assistance setup (Ticket Assistance → New template shows the SQL).';
    const err = await saveTemplateRow({ id: data.id, data, hidden: false }, email);
    if (err) return `Could not save: ${err}`;
    await reloadRows();
    setEditing(null);
    flash('Template saved – everyone sees it in Ticket Assistance now');
    return null;
  };

  const pv = preview ? byId[preview] : undefined;
  const pvLang: Lang = pv && hasLang(pv, previewLang) ? previewLang : 'en';
  const pvMsgs = pv ? chatMessages(pv, pvLang) : [];

  return (
    <div className="space-y-4" ref={topRef}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="h-6 w-6 text-emerald-500" /> AI Lab
            <span className="ml-1 h-6 px-2 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-700 dark:text-amber-300 border border-amber-400/40 flex items-center gap-1">
              <FlaskConical className="h-3.5 w-3.5" /> Beta
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Test area for the AI helper. Ticket Assistance stays exactly as it is while we try this out.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          Test version: the AI can be wrong. Always read and check the reply against the account before sending it, and tell your TL when an answer was wrong so the templates or updates can be fixed.
        </span>
      </div>

      {editing ? (
        <TicketTemplateEditor
          key={editing.base.id}
          initial={editing.base}
          isNew={editing.isNew}
          origin={editing.isNew ? 'custom' : baseById[editing.base.id] ? (rows.some((r) => r.id === editing.base.id) ? 'edited' : 'builtin') : 'custom'}
          products={products}
          topicName={topicName}
          onCancel={() => setEditing(null)}
          onSave={saveEdit}
        />
      ) : (
        <AiHelper
          scenarios={scenarios}
          byId={byId}
          rank={rank}
          topicLabel={(t) => `${topicToProduct[t]?.name || ''} › ${topicName[t] || t}`}
          topicIds={Object.keys(topicName)}
          canEdit={canEdit}
          email={email}
          agentName={sig.agent}
          teamEn={sig.teamEn}
          teamAr={sig.teamAr}
          onOpen={(id) => {
            setPreview(id);
            setPreviewLang('en');
          }}
          onSuggestEdit={(s, isNew) => {
            setEditing({ base: s, isNew });
            setTimeout(() => topRef.current?.scrollIntoView({ block: 'start' }), 30);
          }}
          copy={copy}
          flash={flash}
        />
      )}

      {/* template preview */}
      {pv && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-3" onClick={() => setPreview('')}>
          <div className={`${panel} w-full max-w-xl max-h-[80vh] overflow-y-auto p-4 space-y-3`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: topicToProduct[pv.topic]?.color }}>
                  {topicToProduct[pv.topic]?.name} · {topicName[pv.topic]}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{pv.title}</p>
                <p className="text-[11px] text-slate-500">{pv.when}</p>
              </div>
              {hasLang(pv, 'ar') && (
                <button
                  type="button"
                  onClick={() => setPreviewLang(pvLang === 'en' ? 'ar' : 'en')}
                  className="h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300"
                >
                  {pvLang === 'en' ? 'عربي' : 'EN'}
                </button>
              )}
              <button type="button" onClick={() => setPreview('')} className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>
            {pvMsgs.length ? (
              pvMsgs.map((m, i) => (
                <div key={i} className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700 p-2">
                  <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  <p className="flex-1 text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap" dir={pvLang === 'ar' ? 'rtl' : 'ltr'}>{m}</p>
                  <button type="button" onClick={() => copy(m, `Message ${i + 1}`)} className="h-7 w-7 rounded-lg text-slate-400 hover:text-emerald-600 flex items-center justify-center shrink-0">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <pre className="text-xs whitespace-pre-wrap text-slate-700 dark:text-slate-200 font-sans">{emailBody(pv, pvLang)}</pre>
            )}
            {pv.tip && <p className="text-[11px] text-amber-700 dark:text-amber-300"><b>Tip:</b> {pv.tip}</p>}
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs font-bold shadow-lg ${
            toast.warn ? 'bg-amber-500 text-amber-950' : 'bg-emerald-600 text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}
