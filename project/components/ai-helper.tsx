'use client';

// ---------------------------------------------------------------------------
// AI helper (Ticket Assistance → AI helper)
//  • Reply helper: paste the conversation → masked → matched with our templates,
//    team updates and approved past replies → AI (built-in) or ChatGPT (copy prompt)
//  • Teach updates: save policy / process updates the AI must follow, and let it
//    propose template changes that an Admin / TL reviews in the template editor
//  • Learned replies: approved answers the AI uses as style examples
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles, ClipboardPaste, Copy, Check, ThumbsUp, Trash2, RefreshCw, ShieldCheck, Megaphone, BookOpen, Database,
  AlertTriangle, Pencil, Plus, X, ChevronDown, Send, Lightbulb, MessageSquare, Mail,
} from 'lucide-react';
import type { Scenario } from '@/lib/ticket-library';
import {
  maskPII, maskSummary, buildReplyPrompt, buildUpdatePrompt, chatGptPrompt, parseReply, parseUpdate, applyPatch, pickExamples,
} from '@/lib/ai/prompt';
import type { AiExample, AiUpdate, AiTask, ReplyAnswer, UpdateAnswer } from '@/lib/ai/prompt';
import {
  AI_SQL, loadAiData, saveExample, deleteExample, saveUpdate, setUpdateActive, deleteUpdate, recentAnnouncements,
} from '@/lib/ai/store';
import type { StoreStatus } from '@/lib/ai/store';

interface Props {
  scenarios: Scenario[];
  byId: Record<string, Scenario>;
  rank: (text: string, n: number) => Scenario[];
  topicLabel: (topicId: string) => string;
  topicIds: string[];
  canEdit: boolean;
  email: string;
  agentName: string;
  teamEn: string;
  teamAr: string;
  onOpen: (id: string) => void;
  onSuggestEdit: (s: Scenario, isNew: boolean) => void;
  copy: (text: string, label: string) => void;
  flash: (text: string, warn?: boolean) => void;
}

type Section = 'reply' | 'updates' | 'examples';

const panel = 'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#101a30]/90';
const input =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50';
const chip = 'h-7 px-2.5 rounded-lg text-[11px] font-semibold border flex items-center gap-1.5';
const btn = 'h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed';
const btnPrimary = `${btn} bg-emerald-600 hover:bg-emerald-500 text-white`;
const btnGhost = `${btn} border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-emerald-500`;

const Seg = <T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: React.ReactNode }[] }) => (
  <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`h-7 px-2.5 rounded-md text-[11px] font-bold flex items-center gap-1 ${
          value === o.value ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        {o.label}
      </button>
    ))}
  </div>
);

const fillNames = (t: string, agent: string, team: string) =>
  t.replace(/\{\{agent_name\}\}/g, agent || '[your name]').replace(/\{\{team_name\}\}/g, team || 'Tabby Customer Support');

async function askAI(task: AiTask, prompt: string, user: string): Promise<{ text?: string; error?: string }> {
  try {
    const res = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task, prompt, user }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data?.error || `The AI could not answer (${res.status}).` };
    return { text: data.text };
  } catch {
    return { error: 'Could not reach the AI. Check your connection and try again.' };
  }
}

// ---------------------------------------------------------------------------
export function AiHelper(p: Props) {
  const [section, setSection] = useState<Section>('reply');
  const [ai, setAi] = useState<{ configured: boolean; model?: string } | null>(null);
  const [store, setStore] = useState<{ examples: AiExample[]; updates: AiUpdate[]; status: StoreStatus; message?: string }>({
    examples: [],
    updates: [],
    status: 'loading',
  });
  const [showSetup, setShowSetup] = useState(false);

  const reload = async () => setStore(await loadAiData());

  useEffect(() => {
    fetch('/api/ai/assist')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAi(d ? { configured: !!d.configured, model: d.model } : { configured: false }))
      .catch(() => setAi({ configured: false }));
    reload();
  }, []);

  const activeUpdates = store.updates.filter((u) => u.active !== false);

  return (
    <div className="space-y-3">
      {/* status bar */}
      <div className={`${panel} px-3 py-2 flex flex-wrap items-center gap-2`}>
        <Sparkles className="h-4 w-4 text-emerald-500" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">AI helper</span>
        <span
          className={`${chip} ${
            ai?.configured
              ? 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : 'border-amber-400/50 text-amber-700 dark:text-amber-300'
          }`}
          title={ai?.configured ? `Model: ${ai.model}` : 'Add OPENAI_API_KEY in Vercel to switch it on'}
        >
          {ai === null ? 'Checking…' : ai.configured ? 'Built-in AI on' : 'Built-in AI off · Copy prompt works'}
        </span>
        <span className={`${chip} border-slate-200 dark:border-slate-700 text-slate-500`}>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Personal details are masked before sending
        </span>
        <span className={`${chip} border-slate-200 dark:border-slate-700 text-slate-500`}>
          {activeUpdates.length} update{activeUpdates.length === 1 ? '' : 's'} · {store.examples.length} learned repl{store.examples.length === 1 ? 'y' : 'ies'}
        </span>
        <span className="flex-1" />
        <Seg
          value={section}
          onChange={setSection}
          options={[
            { value: 'reply', label: <><MessageSquare className="h-3.5 w-3.5" /> Reply helper</> },
            { value: 'updates', label: <><Megaphone className="h-3.5 w-3.5" /> Teach updates</> },
            { value: 'examples', label: <><BookOpen className="h-3.5 w-3.5" /> Learned replies</> },
          ]}
        />
        {p.canEdit && (
          <button type="button" onClick={() => setShowSetup((v) => !v)} className={btnGhost} title="Setup">
            <Database className="h-3.5 w-3.5" /> Setup
          </button>
        )}
      </div>

      {(showSetup || (p.canEdit && store.status === 'no-table')) && (
        <SetupPanel ai={ai} status={store.status} message={store.message} copy={p.copy} onClose={() => setShowSetup(false)} />
      )}

      {section === 'reply' && <ReplyHelper {...p} ai={ai} store={store} reload={reload} />}
      {section === 'updates' && <UpdatesPanel {...p} ai={ai} store={store} reload={reload} />}
      {section === 'examples' && <ExamplesPanel {...p} ai={ai} store={store} reload={reload} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup (Admin / TL)
// ---------------------------------------------------------------------------
function SetupPanel({
  ai,
  status,
  message,
  copy,
  onClose,
}: {
  ai: { configured: boolean; model?: string } | null;
  status: StoreStatus;
  message?: string;
  copy: Props['copy'];
  onClose: () => void;
}) {
  const Row = ({ ok, title, children }: { ok: boolean; title: string; children: React.ReactNode }) => (
    <div className="flex gap-2">
      <span className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-600 text-white' : 'bg-amber-400 text-amber-950'}`}>
        {ok ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
      </span>
      <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 min-w-0">
        <p className="font-bold text-slate-800 dark:text-slate-100">{title}</p>
        {children}
      </div>
    </div>
  );
  return (
    <div className={`${panel} p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-emerald-500" />
        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">AI helper setup</span>
        <span className="flex-1" />
        <button type="button" onClick={onClose} className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
      </div>
      <Row ok={status === 'ready'} title={status === 'ready' ? 'Saved updates & learned replies: ready' : '1 · Supabase tables (one time)'}>
        {status === 'ready' ? (
          <p>Updates and learned replies are saved for the whole team.</p>
        ) : (
          <>
            <p>{status === 'error' ? `Could not reach the tables: ${message}` : 'Run this in Supabase → SQL Editor, then refresh the page.'}</p>
            <div className="relative">
              <pre className="text-[11px] leading-relaxed p-3 rounded-lg bg-slate-900 text-emerald-200 overflow-auto max-h-44 whitespace-pre">{AI_SQL}</pre>
              <button
                type="button"
                onClick={() => copy(AI_SQL, 'SQL')}
                className="absolute top-2 right-2 h-7 px-2 rounded-md text-[11px] font-bold bg-white/10 text-white hover:bg-white/20 flex items-center gap-1"
              >
                <Copy className="h-3.5 w-3.5" /> Copy SQL
              </button>
            </div>
          </>
        )}
      </Row>
      <Row ok={!!ai?.configured} title={ai?.configured ? `Built-in AI: on (${ai.model})` : '2 · Built-in AI (optional)'}>
        {ai?.configured ? (
          <p>Agents get answers inside the dashboard. Change the model any time with OPENAI_MODEL in Vercel.</p>
        ) : (
          <>
            <p>“Copy prompt for ChatGPT” already works with your ChatGPT subscription. To get answers inside the dashboard too:</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Create an API key at platform.openai.com → API keys (API usage is billed separately from ChatGPT Plus).</li>
              <li>Set a monthly budget at platform.openai.com → Settings → Limits.</li>
              <li>Vercel → Project → Settings → Environment Variables → add <b>OPENAI_API_KEY</b> (optional: <b>OPENAI_MODEL</b>, default gpt-5-mini).</li>
              <li>Redeploy, then refresh this page.</li>
            </ol>
            <p className="text-amber-700 dark:text-amber-300">Paste the key only in Vercel, never in a chat or in the code.</p>
          </>
        )}
      </Row>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reply helper
// ---------------------------------------------------------------------------
type Shared = Props & {
  ai: { configured: boolean; model?: string } | null;
  store: { examples: AiExample[]; updates: AiUpdate[]; status: StoreStatus };
  reload: () => Promise<void>;
};

function ReplyHelper(p: Shared) {
  const [chat, setChat] = useState('');
  const [context, setContext] = useState('');
  const [hide, setHide] = useState('');
  const [channel, setChannel] = useState<'chat' | 'email'>('chat');
  const [lang, setLang] = useState<'auto' | 'en' | 'ar'>('auto');
  const [showSent, setShowSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState<ReplyAnswer | null>(null);
  const [msgs, setMsgs] = useState<string[]>([]);
  const [emailText, setEmailText] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [saved, setSaved] = useState(false);

  const hideWords = useMemo(() => hide.split(/[,\n]/).map((w) => w.trim()).filter(Boolean), [hide]);
  const masked = useMemo(() => maskPII(chat, hideWords), [chat, hideWords]);
  const maskedCtx = useMemo(() => maskPII(context, hideWords), [context, hideWords]);
  const matched = useMemo(() => (masked.text.trim() ? p.rank(`${masked.text} ${maskedCtx.text}`, 6) : []), [masked.text, maskedCtx.text, p.rank]);
  const examples = useMemo(() => pickExamples(masked.text, p.store.examples, 3), [masked.text, p.store.examples]);
  const prompt = useMemo(
    () =>
      buildReplyPrompt({
        chat: masked.text,
        context: maskedCtx.text,
        channel,
        lang,
        templates: matched.map((s) => ({ s, topic: p.topicLabel(s.topic) })),
        updates: p.store.updates,
        examples,
      }),
    [masked.text, maskedCtx.text, channel, lang, matched, p.store.updates, examples, p.topicLabel]
  );

  const replyIsAr = lang === 'ar' || (lang === 'auto' && /[؀-ۿ]/.test(masked.text));
  const team = replyIsAr ? p.teamAr : p.teamEn;

  const show = (raw: string) => {
    const a = parseReply(raw);
    if (!a.messages.length && !a.email) {
      setError('Could not read the answer. Make sure you pasted ChatGPT’s full reply.');
      return;
    }
    setAnswer(a);
    setMsgs(a.messages.map((m) => fillNames(m, p.agentName, team)));
    setEmailText(fillNames(a.email, p.agentName, team));
    setSaved(false);
    setError('');
  };

  const run = async () => {
    if (!masked.text.trim()) return;
    setBusy(true);
    setError('');
    const r = await askAI('reply', prompt, p.email);
    setBusy(false);
    if (r.error) return setError(r.error);
    show(r.text || '');
  };

  const copyPrompt = () => {
    if (!masked.text.trim()) return;
    p.copy(chatGptPrompt('reply', prompt), 'Prompt for ChatGPT');
    setPasteOpen(true);
  };

  const reset = () => {
    setChat('');
    setContext('');
    setAnswer(null);
    setMsgs([]);
    setEmailText('');
    setPasted('');
    setPasteOpen(false);
    setError('');
  };

  const saveGood = async () => {
    if (!answer) return;
    if (p.store.status !== 'ready') return p.flash('Saving needs the one-time setup (Setup → Supabase tables).', true);
    const reply = channel === 'email' && emailText ? emailText : msgs.map((m, i) => `${i + 1}. ${m}`).join('\n');
    const err = await saveExample(
      {
        issue: answer.issue || null,
        product: answer.product || null,
        chat: masked.text.slice(0, 4000),
        reply: maskPII(reply, hideWords).text.slice(0, 4000),
        template_ids: answer.templateIds.filter((id) => p.byId[id]),
      },
      p.email
    );
    if (err) return p.flash(`Could not save: ${err}`, true);
    setSaved(true);
    p.flash('Saved – the AI will learn from this reply');
    p.reload();
  };

  const maskCounts = useMemo(() => {
    const all: Record<string, number> = { ...masked.counts };
    Object.entries(maskedCtx.counts).forEach(([k, v]) => (all[k] = (all[k] || 0) + v));
    return all;
  }, [masked.counts, maskedCtx.counts]);
  const totalMasked = Object.values(maskCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
      {/* ---------- input ---------- */}
      <div className={`${panel} p-4 space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">1 · Paste the conversation</p>
          <span className="flex-1" />
          <Seg
            value={channel}
            onChange={setChannel}
            options={[
              { value: 'chat', label: <><MessageSquare className="h-3.5 w-3.5" /> Chat</> },
              { value: 'email', label: <><Mail className="h-3.5 w-3.5" /> Email</> },
            ]}
          />
          <Seg
            value={lang}
            onChange={setLang}
            options={[
              { value: 'auto', label: 'Auto' },
              { value: 'en', label: 'EN' },
              { value: 'ar', label: 'عربي' },
            ]}
          />
        </div>
        <textarea
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          rows={9}
          placeholder="Paste the customer’s messages (and your replies so far) here…"
          className={`${input} p-3 resize-y min-h-[160px]`}
        />
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          rows={2}
          placeholder="Optional – what you found on the account (e.g. order refunded by the store, 2 failed payment attempts)…"
          className={`${input} p-3 resize-y`}
        />
        <input
          value={hide}
          onChange={(e) => setHide(e.target.value)}
          placeholder="Optional – words to hide, e.g. the customer’s name (comma-separated)"
          className={`${input} h-9 px-3`}
        />

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
          <span>Masked before sending: {totalMasked ? maskSummary(maskCounts) : 'nothing found yet'}</span>
          {chat.trim() && (
            <button type="button" onClick={() => setShowSent((v) => !v)} className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
              {showSent ? 'Hide' : 'See'} what will be sent
            </button>
          )}
        </div>
        {showSent && chat.trim() && (
          <pre className="text-[11px] leading-relaxed p-3 rounded-lg bg-slate-900 text-slate-200 overflow-auto max-h-56 whitespace-pre-wrap">{masked.text}</pre>
        )}

        {matched.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Templates the AI will use</p>
            <div className="flex flex-wrap gap-1.5">
              {matched.map((s) => (
                <button key={s.id} type="button" onClick={() => p.onOpen(s.id)} className={`${chip} border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500`}>
                  {s.title}
                </button>
              ))}
            </div>
            {examples.length > 0 && <p className="text-[11px] text-slate-500">+ {examples.length} similar approved repl{examples.length === 1 ? 'y' : 'ies'} from past chats</p>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button type="button" onClick={run} disabled={!chat.trim() || busy || !p.ai?.configured} className={btnPrimary} title={p.ai?.configured ? '' : 'Built-in AI is not set up yet – use Copy prompt'}>
            {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {busy ? 'Thinking…' : 'Suggest reply'}
          </button>
          <button type="button" onClick={copyPrompt} disabled={!chat.trim()} className={btnGhost}>
            <Copy className="h-3.5 w-3.5" /> Copy prompt for ChatGPT
          </button>
          <button type="button" onClick={() => setPasteOpen((v) => !v)} className={btnGhost}>
            <ClipboardPaste className="h-3.5 w-3.5" /> Paste ChatGPT answer
          </button>
          <span className="flex-1" />
          {(chat || answer) && (
            <button type="button" onClick={reset} className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              Clear
            </button>
          )}
        </div>

        {pasteOpen && (
          <div className="space-y-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
            <p className="text-[11px] text-slate-500">
              Open ChatGPT, paste the prompt (Ctrl+V) and send. Then copy ChatGPT’s whole answer and paste it here.
            </p>
            <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={5} placeholder="Paste ChatGPT’s answer…" className={`${input} p-3`} />
            <button type="button" onClick={() => show(pasted)} disabled={!pasted.trim()} className={btnPrimary}>
              <Send className="h-3.5 w-3.5" /> Use this answer
            </button>
          </div>
        )}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
      </div>

      {/* ---------- answer ---------- */}
      <div className={`${panel} p-4 space-y-3`}>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">2 · Suggested reply</p>
        {!answer ? (
          <div className="text-[11px] text-slate-500 space-y-2">
            <p>The AI reads the conversation, finds the matching templates and the latest team updates, and writes the reply in our structure: update first → short messages → next step → clarity check.</p>
            <p className="flex items-start gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-px" />
              Always read the reply before sending. Add what you found on the account in the second box for a better answer.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {answer.product && <span className={`${chip} border-slate-200 dark:border-slate-700 text-slate-500`}>{answer.product}</span>}
              {answer.issue && <span className="text-slate-700 dark:text-slate-200 font-semibold">{answer.issue}</span>}
            </div>

            {answer.ask && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Ask first</p>
                  <p className="text-xs text-amber-900 dark:text-amber-100">{answer.ask}</p>
                </div>
                <button type="button" onClick={() => p.copy(answer.ask, 'Question')} className="h-7 w-7 rounded-lg text-amber-700 hover:bg-amber-500/10 flex items-center justify-center">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {msgs.length > 0 && (channel === 'chat' || !emailText) && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">{msgs.length} messages · edit before copying if needed</span>
                  <span className="flex-1" />
                  <button type="button" onClick={() => p.copy(msgs.join('\n\n'), 'All messages')} className={btnPrimary}>
                    <Copy className="h-3.5 w-3.5" /> Copy all
                  </button>
                </div>
                {msgs.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-xl border border-slate-200 dark:border-slate-700 p-2">
                    <span className="h-5 w-5 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-1.5">{i + 1}</span>
                    <textarea
                      value={m}
                      dir={/[؀-ۿ]/.test(m) ? 'rtl' : 'ltr'}
                      onChange={(e) => setMsgs((list) => list.map((x, j) => (j === i ? e.target.value : x)))}
                      rows={Math.min(6, Math.max(2, Math.ceil(m.length / 70)))}
                      className="flex-1 min-w-0 bg-transparent text-sm text-slate-800 dark:text-slate-100 resize-y focus:outline-none"
                    />
                    <button type="button" onClick={() => p.copy(m, `Message ${i + 1}`)} className="h-7 w-7 rounded-lg text-slate-400 hover:text-emerald-600 flex items-center justify-center shrink-0">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {channel === 'email' && emailText && (
              <div className="space-y-2">
                {answer.emailSubject && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subject</span>
                    <span className="text-sm text-slate-800 dark:text-slate-100 flex-1 min-w-0">{answer.emailSubject}</span>
                    <button type="button" onClick={() => p.copy(answer.emailSubject, 'Subject')} className="h-7 w-7 rounded-lg text-slate-400 hover:text-emerald-600 flex items-center justify-center">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <textarea
                  value={emailText}
                  dir={/[؀-ۿ]/.test(emailText) ? 'rtl' : 'ltr'}
                  onChange={(e) => setEmailText(e.target.value)}
                  rows={12}
                  className={`${input} p-3`}
                />
                <button type="button" onClick={() => p.copy(emailText, 'Email body')} className={btnPrimary}>
                  <Copy className="h-3.5 w-3.5" /> Copy email
                </button>
              </div>
            )}

            {answer.cia && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ticket note · #CIA</span>
                  <span className="flex-1" />
                  <button type="button" onClick={() => p.copy(`${answer.cia}\n\n#CIA`, 'CIA note')} className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
                    Copy note
                  </button>
                </div>
                <pre className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap font-sans">{answer.cia}</pre>
              </div>
            )}

            {answer.notes && (
              <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-px" />
                <span><b>Check:</b> {answer.notes}</span>
              </p>
            )}

            {answer.templateIds.some((id) => p.byId[id]) && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Based on</span>
                {answer.templateIds
                  .filter((id) => p.byId[id])
                  .map((id) => (
                    <button key={id} type="button" onClick={() => p.onOpen(id)} className={`${chip} border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500`}>
                      {p.byId[id].title}
                    </button>
                  ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button type="button" onClick={saveGood} disabled={saved} className={`${btnGhost} mt-2`}>
                {saved ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <ThumbsUp className="h-3.5 w-3.5" />} {saved ? 'Saved as a good example' : 'Good reply – learn from it'}
              </button>
              {p.ai?.configured && (
                <button type="button" onClick={run} disabled={busy} className={`${btnGhost} mt-2`}>
                  <RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> Try again
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Teach updates (+ template suggestions)
// ---------------------------------------------------------------------------
function UpdatesPanel(p: Shared) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [news, setNews] = useState<{ id: string; title: string; content: string; created_at?: string }[] | null>(null);
  const [working, setWorking] = useState<string>(''); // update id being analysed
  const [result, setResult] = useState<{ forId: string; data: UpdateAnswer } | null>(null);
  const [pasteFor, setPasteFor] = useState<string>('');
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState('');

  const add = async () => {
    if (!body.trim()) return;
    if (p.store.status !== 'ready') return p.flash('Saving needs the one-time setup (Setup → Supabase tables).', true);
    setSaving(true);
    const err = await saveUpdate({ title: title.trim(), body: body.trim() }, p.email);
    setSaving(false);
    if (err) return p.flash(`Could not save: ${err}`, true);
    setTitle('');
    setBody('');
    p.flash('Update saved – the AI follows it from now on');
    p.reload();
  };

  const promptFor = (u: AiUpdate) => {
    const text = `${u.title || ''}\n${u.body}`;
    const candidates = p.rank(text, 8);
    return buildUpdatePrompt({
      update: text,
      templates: candidates.map((s) => ({ s, topic: p.topicLabel(s.topic), topicId: s.topic })),
    });
  };

  const analyse = async (u: AiUpdate) => {
    setError('');
    setResult(null);
    setWorking(u.id || 'x');
    const r = await askAI('update', promptFor(u), p.email);
    setWorking('');
    if (r.error) return setError(r.error);
    const data = parseUpdate(r.text || '');
    if (!data) return setError('Could not read the AI’s answer. Please try again.');
    setResult({ forId: u.id || '', data });
  };

  const copyUpdatePrompt = (u: AiUpdate) => {
    p.copy(chatGptPrompt('update', promptFor(u)), 'Prompt for ChatGPT');
    setPasteFor(u.id || '');
    setPasted('');
  };

  const usePasted = () => {
    const data = parseUpdate(pasted);
    if (!data) return setError('Could not read that answer. Paste ChatGPT’s full reply, including the json block.');
    setError('');
    setResult({ forId: pasteFor, data });
    setPasteFor('');
  };

  const review = (c: UpdateAnswer['changes'][number]) => {
    const base = p.byId[c.id];
    if (!base) return p.flash('That template is not in the library any more.', true);
    p.onSuggestEdit({ ...base, en: applyPatch(base.en, c.en) || base.en, ar: base.ar || c.ar ? applyPatch(base.ar, c.ar) : undefined }, false);
  };

  const reviewNew = (n: UpdateAnswer['added'][number]) => {
    p.onSuggestEdit(
      {
        id: `custom-${Date.now().toString(36)}`,
        topic: n.topicId && p.topicIds.includes(n.topicId) ? n.topicId : 'gen-follow',
        title: n.title,
        when: n.when || '',
        en: applyPatch(undefined, n.en) || { ack: '', body: [] },
        ar: n.ar ? applyPatch(undefined, n.ar) : undefined,
      },
      true
    );
  };

  const loadNews = async () => setNews(await recentAnnouncements(6));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
      <div className={`${panel} p-4 space-y-3`}>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Teach the AI an update</p>
        <p className="text-[11px] text-slate-500">
          Saved updates are added to every AI reply and override older templates. Admin / TL can then ask the AI which templates need to change.
        </p>
        {p.canEdit ? (
          <>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title, e.g. New refund timeline" className={`${input} h-9 px-3`} />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Paste the update exactly as you received it (policy, process, wording, timeframe…)"
              className={`${input} p-3`}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={add} disabled={!body.trim() || saving} className={btnPrimary}>
                <Plus className="h-3.5 w-3.5" /> Save update
              </button>
              <button type="button" onClick={loadNews} className={btnGhost}>
                <Megaphone className="h-3.5 w-3.5" /> From Announcements
              </button>
            </div>
            {news && (
              <div className="space-y-1.5">
                {news.length === 0 && <p className="text-[11px] text-slate-500">No announcements found.</p>}
                {news.map((n) => (
                  <div key={n.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate">{n.title}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{n.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setTitle(n.title.slice(0, 80));
                        setBody(n.content);
                      }}
                      className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
                    >
                      Use
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-[11px] text-slate-500">Only Admin / Team Leaders can add updates. Ask your TL to add anything new you hear about.</p>
        )}
      </div>

      <div className={`${panel} p-4 space-y-3`}>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Updates the AI follows</p>
        {p.store.status !== 'ready' && <p className="text-[11px] text-amber-700 dark:text-amber-300">The updates table isn’t set up yet (Setup → Supabase tables).</p>}
        {p.store.updates.length === 0 && p.store.status === 'ready' && <p className="text-[11px] text-slate-500">No updates yet.</p>}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        {p.store.updates.map((u) => (
          <div key={u.id} className={`rounded-xl border p-3 space-y-2 ${u.active === false ? 'border-slate-200 dark:border-slate-800 opacity-60' : 'border-slate-200 dark:border-slate-700'}`}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{u.title || 'Update'}</p>
                <p className="text-[10px] text-slate-400">
                  {u.created_at?.slice(0, 10)} · {String(u.created_by || '').split('@')[0]} {u.active === false ? '· paused' : ''}
                </p>
              </div>
              {p.canEdit && (
                <>
                  <button
                    type="button"
                    onClick={async () => {
                      const err = await setUpdateActive(u.id!, u.active === false);
                      if (err) p.flash(`Could not change: ${err}`, true);
                      p.reload();
                    }}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    {u.active === false ? 'Turn on' : 'Pause'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Delete this update? The AI will stop following it.')) return;
                      const err = await deleteUpdate(u.id!);
                      if (err) p.flash(`Could not delete: ${err}`, true);
                      p.reload();
                    }}
                    className="h-6 w-6 rounded-md text-slate-400 hover:text-red-600 flex items-center justify-center"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-5">{u.body}</p>
            {p.canEdit && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => analyse(u)} disabled={!p.ai?.configured || !!working} className={btnGhost} title={p.ai?.configured ? '' : 'Built-in AI is off – use Copy prompt'}>
                  {working === u.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Find templates to change
                </button>
                <button type="button" onClick={() => copyUpdatePrompt(u)} className={btnGhost}>
                  <Copy className="h-3.5 w-3.5" /> Copy prompt for ChatGPT
                </button>
              </div>
            )}
            {pasteFor === u.id && (
              <div className="space-y-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
                <p className="text-[11px] text-slate-500">Paste the prompt into ChatGPT, then paste its whole answer here.</p>
                <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={4} placeholder="Paste ChatGPT’s answer…" className={`${input} p-3`} />
                <button type="button" onClick={usePasted} disabled={!pasted.trim()} className={btnPrimary}>
                  <Send className="h-3.5 w-3.5" /> Use this answer
                </button>
              </div>
            )}
            {result && result.forId === u.id && (
              <div className="space-y-2 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/30 p-3">
                {result.data.summary && <p className="text-[11px] text-slate-700 dark:text-slate-200">{result.data.summary}</p>}
                {!result.data.changes.length && !result.data.added.length && <p className="text-[11px] text-slate-500">No template needs to change for this update.</p>}
                {result.data.changes.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-2 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex-1 min-w-0 truncate">{p.byId[c.id]?.title || c.id}</span>
                      <button type="button" onClick={() => review(c)} disabled={!p.byId[c.id]} className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1">
                        <Pencil className="h-3 w-3" /> Review in editor
                      </button>
                    </div>
                    {c.reason && <p className="text-[11px] text-slate-500">{c.reason}</p>}
                    {c.en?.ack && <p className="text-[11px] text-slate-600 dark:text-slate-300">→ {c.en.ack}</p>}
                  </div>
                ))}
                {result.data.added.map((n, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-2 flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-600">New</span>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex-1 min-w-0 truncate">{n.title}</span>
                    <button type="button" onClick={() => reviewNew(n)} className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1">
                      <Pencil className="h-3 w-3" /> Review in editor
                    </button>
                  </div>
                ))}
                <p className="text-[10px] text-slate-500">Nothing changes until you press Save in the editor.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Learned replies
// ---------------------------------------------------------------------------
function ExamplesPanel(p: Shared) {
  const [open, setOpen] = useState<string>('');
  return (
    <div className={`${panel} p-4 space-y-3`}>
      <div className="flex items-center gap-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Learned replies</p>
        <span className="text-[11px] text-slate-500">
          Replies the team marked as good. The AI picks the closest ones as style examples for each new chat.
        </span>
      </div>
      {p.store.status !== 'ready' && <p className="text-[11px] text-amber-700 dark:text-amber-300">The learned replies table isn’t set up yet (Setup → Supabase tables).</p>}
      {p.store.status === 'ready' && !p.store.examples.length && (
        <p className="text-[11px] text-slate-500">Nothing yet. After a good AI reply, press “Good reply – learn from it”.</p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {p.store.examples.map((e) => {
          const mine = String(e.created_by || '').toLowerCase() === p.email;
          const isOpen = open === e.id;
          return (
            <div key={e.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => setOpen(isOpen ? '' : e.id || '')} className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{e.issue || 'Reply'}</p>
                  <p className="text-[10px] text-slate-400">
                    {e.product ? `${e.product} · ` : ''}
                    {e.created_at?.slice(0, 10)} · {String(e.created_by || '').split('@')[0]}
                  </p>
                </button>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                {(mine || p.canEdit) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Remove this learned reply?')) return;
                      const err = await deleteExample(e.id!);
                      if (err) p.flash(`Could not delete: ${err}`, true);
                      p.reload();
                    }}
                    className="h-6 w-6 rounded-md text-slate-400 hover:text-red-600 flex items-center justify-center"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className={`text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap ${isOpen ? '' : 'line-clamp-3'}`}>{e.reply}</p>
              {isOpen && (
                <div className="rounded-lg bg-slate-50 dark:bg-slate-950 p-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Customer chat (masked)</p>
                  <p className="text-[11px] text-slate-500 whitespace-pre-wrap">{e.chat}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
