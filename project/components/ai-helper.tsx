'use client';

// ---------------------------------------------------------------------------
// AI helper (AI Lab tab)
//  • Reply helper: paste the conversation → matched with our templates, team updates,
//    taught cases, team answers and approved replies → AI (built-in) or ChatGPT (copy prompt)
//  • Teach the AI: updates (policy / process changes) and cases (situation + how we handle it);
//    the AI can turn them into new or better templates in the right place of the tree
//  • Questions: what the AI asked about products / processes; the team's answers become knowledge
//  • What it learned: approved replies and taught cases
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';
import {
  Sparkles, ClipboardPaste, Copy, Check, ThumbsUp, Trash2, RefreshCw, ShieldCheck, Megaphone, BookOpen, Database,
  AlertTriangle, Pencil, Plus, X, ChevronDown, Send, Lightbulb, MessageSquare, Mail, HelpCircle, User,
} from 'lucide-react';
import type { Scenario } from '@/lib/ticket-library';
import {
  maskPII, buildReplyPrompt, buildUpdatePrompt, chatGptPrompt, parseReply, parseUpdate, applyPatch, pickExamples, pickAnswers,
  newQuestions, isTaughtCase,
} from '@/lib/ai/prompt';
import { PLACEHOLDER_LABELS } from '@/lib/ticket-library';
import type { SavedTemplate } from '@/lib/ticket-store';
import type { AiExample, AiQuestion, AiTask, ReplyAnswer, UpdateAnswer } from '@/lib/ai/prompt';
import {
  AI_SQL, loadAiData, saveExample, deleteExample, saveUpdate, setUpdateActive, deleteUpdate, recentAnnouncements, saveQuestions,
  answerQuestion, deleteQuestion,
} from '@/lib/ai/store';
import type { StoreStatus, AiData } from '@/lib/ai/store';

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
  /** change the name used in replies and on templates the AI creates */
  onNameChange: (next: { agent: string; teamEn: string; teamAr: string }) => void;
  onOpen: (id: string) => void;
  onSuggestEdit: (s: Scenario, isNew: boolean) => void;
  /** save straight into the team templates (Supabase ticket_templates); returns an error or null */
  onSaveTemplate: (t: SavedTemplate) => Promise<string | null>;
  productOfTopic: (topicId: string) => { id: string; name: string } | undefined;
  copy: (text: string, label: string) => void;
  flash: (text: string, warn?: boolean) => void;
}

type Section = 'reply' | 'teach' | 'questions' | 'examples';

const PRODUCT_OPTIONS = ['Not sure', 'Pay Later (BNPL)', 'Tabby Card', 'Tabby Cash', 'Tabby Plus', 'Account & security', 'Other'];

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
  const [ai, setAi] = useState<{ configured: boolean; model?: string; provider?: string | null } | null>(null);
  const [store, setStore] = useState<AiData>({ examples: [], updates: [], questions: [], questionsReady: false, status: 'loading' });
  const [showSetup, setShowSetup] = useState(false);
  const [showName, setShowName] = useState(false);

  const reload = async () => setStore(await loadAiData());

  useEffect(() => {
    fetch('/api/ai/assist')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setAi(d ? { configured: !!d.configured, model: d.model, provider: d.provider } : { configured: false }))
      .catch(() => setAi({ configured: false }));
    reload();
  }, []);

  const activeUpdates = store.updates.filter((u) => u.active !== false);
  const openQs = store.questions.filter((q) => q.status !== 'answered').length;
  const needSetup = store.status === 'no-table' || (store.status === 'ready' && !store.questionsReady);

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
          title={ai?.configured ? `Model: ${ai.model}` : 'Add GROQ_API_KEY (free) in Vercel to switch it on'}
        >
          {ai === null ? 'Checking…' : ai.configured ? 'Built-in AI on' : 'Built-in AI off · Copy prompt works'}
        </span>
        <span className={`${chip} border-slate-200 dark:border-slate-700 text-slate-500`}>
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Learned replies are saved without personal details
        </span>
        <span className={`${chip} border-slate-200 dark:border-slate-700 text-slate-500`}>
          {(() => {
            const n = (k: number, w: string) => `${k} ${w}${k === 1 ? '' : 's'}`;
            return [n(p.scenarios.length, 'template'), n(activeUpdates.length, 'update'), n(store.examples.filter(isTaughtCase).length, 'case'), n(store.questions.length - openQs, 'answer')].join(' · ');
          })()}
        </span>
        <button
          type="button"
          onClick={() => setShowName((v) => !v)}
          className={`${chip} border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500`}
          title="The name used in replies and on templates the AI creates"
        >
          <User className="h-3.5 w-3.5" /> {p.agentName || 'Set your name'}
        </button>
        <span className="flex-1" />
        <Seg
          value={section}
          onChange={setSection}
          options={[
            { value: 'reply', label: <><MessageSquare className="h-3.5 w-3.5" /> Reply helper</> },
            { value: 'teach', label: <><Megaphone className="h-3.5 w-3.5" /> Teach the AI</> },
            {
              value: 'questions',
              label: (
                <>
                  <HelpCircle className="h-3.5 w-3.5" /> Questions
                  {openQs > 0 && <span className="ml-0.5 min-w-[16px] h-4 px-1 rounded-full bg-amber-500 text-amber-950 text-[10px] font-extrabold flex items-center justify-center">{openQs}</span>}
                </>
              ),
            },
            { value: 'examples', label: <><BookOpen className="h-3.5 w-3.5" /> What it learned</> },
          ]}
        />
        {p.canEdit && (
          <button type="button" onClick={() => setShowSetup((v) => !v)} className={btnGhost} title="Setup">
            <Database className="h-3.5 w-3.5" /> Setup
          </button>
        )}
      </div>

      {showName && (
        <div className={`${panel} p-3 grid grid-cols-1 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] gap-2 items-end`}>
          {(
            [
              ['agent', 'Your name (shown to customers and on templates you create)', p.agentName],
              ['teamEn', 'Team name – English', p.teamEn],
              ['teamAr', 'Team name – Arabic', p.teamAr],
            ] as const
          ).map(([k, label, v]) => (
            <label key={k} className="text-[11px] font-semibold text-slate-500 space-y-1">
              <span>{label}</span>
              <input
                value={v}
                dir={k === 'teamAr' ? 'rtl' : 'ltr'}
                onChange={(e) => p.onNameChange({ agent: p.agentName, teamEn: p.teamEn, teamAr: p.teamAr, [k]: e.target.value })}
                className={`${input} h-8 px-2 text-xs`}
              />
            </label>
          ))}
          <button type="button" onClick={() => setShowName(false)} className={btnGhost}>
            <Check className="h-3.5 w-3.5" /> Done
          </button>
        </div>
      )}

      {(showSetup || (p.canEdit && needSetup)) && (
        <SetupPanel ai={ai} status={store.status} questionsReady={store.questionsReady} message={store.message} copy={p.copy} onClose={() => setShowSetup(false)} />
      )}

      {section === 'reply' && <ReplyHelper {...p} ai={ai} store={store} reload={reload} goTo={setSection} />}
      {section === 'teach' && <TeachPanel {...p} ai={ai} store={store} reload={reload} goTo={setSection} />}
      {section === 'questions' && <QuestionsPanel {...p} ai={ai} store={store} reload={reload} goTo={setSection} />}
      {section === 'examples' && <ExamplesPanel {...p} ai={ai} store={store} reload={reload} goTo={setSection} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup (Admin / TL)
// ---------------------------------------------------------------------------
function SetupPanel({
  ai,
  status,
  questionsReady,
  message,
  copy,
  onClose,
}: {
  ai: { configured: boolean; model?: string; provider?: string | null } | null;
  status: StoreStatus;
  questionsReady: boolean;
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
      <Row ok={status === 'ready' && questionsReady} title={status === 'ready' && questionsReady ? 'Saved knowledge: ready' : '1 · Supabase tables'}>
        {status === 'ready' && questionsReady ? (
          <p>Updates, cases, questions and learned replies are saved for the whole team.</p>
        ) : (
          <>
            <p>
              {status === 'error'
                ? `Could not reach the tables: ${message}`
                : status === 'ready'
                  ? 'One more table is needed for the AI’s questions. Run this in Supabase → SQL Editor (safe to run again), then refresh the page.'
                  : 'Run this in Supabase → SQL Editor, then refresh the page.'}
            </p>
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
          <p>Agents get answers inside the dashboard{ai.provider ? ` (via ${ai.provider})` : ''}. Change the model any time with AI_MODEL in Vercel.</p>
        ) : (
          <>
            <p>“Copy prompt for ChatGPT” already works with your ChatGPT subscription. To get answers inside the dashboard too (free):</p>
            <ol className="list-decimal pl-4 space-y-0.5">
              <li>Sign up free at console.groq.com (no card needed) → API Keys → Create API Key.</li>
              <li>Vercel → Project → Settings → Environment Variables → add <b>GROQ_API_KEY</b> with that key (Production).</li>
              <li>Redeploy, then refresh this page.</li>
            </ol>
            <p>The free plan has daily limits (roughly 50–60 replies a day for the whole team). Paid OpenAI also works: use <b>OPENAI_API_KEY</b> instead.</p>
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
  ai: { configured: boolean; model?: string; provider?: string | null } | null;
  store: AiData;
  reload: () => Promise<void>;
  goTo: (s: Section) => void;
};

/** topic tree for new templates (our product topics, not the old team library or internal emails) */
const treeOf = (p: Props) => p.topicIds.filter((t) => !t.startsWith('team-') && !t.startsWith('int-')).map((t) => `${t} = ${p.topicLabel(t)}`);
const PLACEHOLDERS = ['agent_name', ...Object.keys(PLACEHOLDER_LABELS)];
const signTip = (name: string) => `Created in AI Lab${name ? ` by ${name}` : ''} – review it before using.`;

/** a brand-new template from the AI, placed in the tree */
function newTemplateFrom(
  p: Props,
  n: { title: string; when?: string; keys?: string; topicId?: string; en?: any; ar?: any; subject?: { en: string; ar: string } },
  fallbackTopic: string
): SavedTemplate {
  const topic = n.topicId && p.topicIds.includes(n.topicId) ? n.topicId : fallbackTopic;
  return {
    id: `custom-ai-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    topic,
    title: n.title,
    when: n.when || 'Created in AI Lab from a real case.',
    keys: n.keys || '',
    tip: signTip(p.agentName),
    en: applyPatch(undefined, n.en) || { ack: '', body: [] },
    ar: n.ar ? applyPatch(undefined, n.ar) : undefined,
    subject: n.subject,
    productId: p.productOfTopic(topic)?.id,
    topicName: p.topicLabel(topic).split(' › ').pop(),
  };
}

/** save the AI's questions that aren't already in the list */
async function keepQuestions(p: Shared, asked: string[], extra: { context?: string; product?: string }) {
  if (!asked.length || !p.store.questionsReady) return 0;
  const fresh = newQuestions(asked, p.store.questions);
  if (!fresh.length) return 0;
  const err = await saveQuestions(fresh, extra, p.email);
  if (err) {
    p.flash(`Could not save the AI’s questions: ${err}`, true);
    return 0;
  }
  await p.reload();
  return fresh.length;
}

/** answer box for one question (used in the reply view and the Questions tab) */
function AnswerBox({ p, q, compact }: { p: Shared; q: AiQuestion; compact?: boolean }) {
  const [text, setText] = useState(q.answer || '');
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const err = await answerQuestion(q.id!, text.trim(), p.email);
    setBusy(false);
    if (err) return p.flash(`Could not save: ${err}`, true);
    p.flash(text.trim() ? 'Answer saved – the AI uses it from now on' : 'Answer cleared');
    p.reload();
  };
  return (
    <div className="flex items-start gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={compact ? 1 : 2}
        dir={/[\u0600-\u06FF]/.test(text) ? 'rtl' : 'ltr'}
        placeholder="Type the answer (product, process, steps, timeframe…)"
        className={`${input} p-2 text-xs flex-1`}
      />
      <button type="button" onClick={save} disabled={busy || text.trim() === (q.answer || '').trim()} className={btnPrimary}>
        <Check className="h-3.5 w-3.5" /> Save
      </button>
    </div>
  );
}

function ReplyHelper(p: Shared) {
  const [chat, setChat] = useState('');
  const [context, setContext] = useState('');
  const [channel, setChannel] = useState<'chat' | 'email'>('chat');
  const [lang, setLang] = useState<'auto' | 'en' | 'ar'>('auto');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [answer, setAnswer] = useState<ReplyAnswer | null>(null);
  const [msgs, setMsgs] = useState<string[]>([]);
  const [emailText, setEmailText] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState('');
  const [saved, setSaved] = useState(false);
  const [tplState, setTplState] = useState<'' | 'saving' | 'saved'>('');

  const matched = useMemo(() => (chat.trim() ? p.rank(`${chat} ${context}`, 6) : []), [chat, context, p.rank]);
  const examples = useMemo(() => pickExamples(chat, p.store.examples, 3), [chat, p.store.examples]);
  const tree = useMemo(() => treeOf(p), [p.topicIds, p.topicLabel]);
  const answers = useMemo(() => pickAnswers(`${chat} ${context}`, p.store.questions), [chat, context, p.store.questions]);
  const prompt = useMemo(
    () =>
      buildReplyPrompt({
        chat,
        context,
        channel,
        lang,
        templates: matched.map((s) => ({ s, topic: p.topicLabel(s.topic) })),
        updates: p.store.updates,
        examples,
        answers,
        tree,
        placeholders: PLACEHOLDERS,
      }),
    [chat, context, channel, lang, matched, p.store.updates, examples, answers, p.topicLabel, tree]
  );

  const replyIsAr = lang === 'ar' || (lang === 'auto' && /[؀-ۿ]/.test(chat));
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
    setTplState('');
    setError('');
    keepQuestions(p, a.questions, { context: `${a.issue ? `${a.issue}\n` : ''}${chat.slice(0, 600)}`, product: a.product });
  };

  const run = async () => {
    if (!chat.trim()) return;
    setBusy(true);
    setError('');
    const r = await askAI('reply', prompt, p.email);
    setBusy(false);
    if (r.error) return setError(r.error);
    show(r.text || '');
  };

  const copyPrompt = () => {
    if (!chat.trim()) return;
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
        // learned replies are shared with the whole team: keep the style, drop personal details
        chat: maskPII(chat).text.slice(0, 4000),
        reply: maskPII(reply).text.slice(0, 4000),
        template_ids: answer.templateIds.filter((id) => p.byId[id]),
      },
      p.email
    );
    if (err) return p.flash(`Could not save: ${err}`, true);
    setSaved(true);
    p.flash('Saved – the AI will learn from this reply');
    p.reload();
  };

  // ---- the AI's suggested reusable template ----
  const tpl = answer?.template || null;
  const tplTopic = tpl ? (p.topicIds.includes(tpl.topicId) ? tpl.topicId : matched[0]?.topic || 'gen-follow') : '';
  const tplImproves = tpl && tpl.improves && p.byId[tpl.improves] ? p.byId[tpl.improves] : undefined;

  const tplScenario = (asNew: boolean): SavedTemplate | null => {
    if (!tpl) return null;
    if (!asNew && tplImproves) {
      const en = applyPatch(undefined, tpl.en) || tplImproves.en;
      const ar = tpl.ar ? applyPatch(undefined, tpl.ar) : tplImproves.ar;
      return { ...(tplImproves as SavedTemplate), en, ar, subject: tpl.subject || tplImproves.subject };
    }
    return newTemplateFrom(p, tpl, tplTopic);
  };

  const addTemplate = async (asNew: boolean) => {
    const t = tplScenario(asNew);
    if (!t) return;
    setTplState('saving');
    const err = await p.onSaveTemplate(t);
    if (err) {
      setTplState('');
      return p.flash(err, true);
    }
    setTplState('saved');
    p.flash(asNew || !tplImproves ? `Template added under ${p.topicLabel(t.topic)}` : `“${t.title}” updated for everyone`);
  };

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
        {matched.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Policy the AI will check (it writes its own wording)</p>
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

            {answer.questions.length > 0 && (
              <div className="rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/[0.07] p-3 space-y-2">
                <p className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4" /> The AI has {answer.questions.length === 1 ? 'a question' : 'questions'} for the team
                </p>
                {answer.questions.map((qt) => {
                  const q = p.store.questions.find((x) => x.question.trim().toLowerCase() === qt.trim().toLowerCase());
                  return (
                    <div key={qt} className="space-y-1">
                      <p className="text-[11px] text-slate-700 dark:text-slate-200">• {qt}</p>
                      {q?.status === 'answered' ? (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 pl-3">Answered: {q.answer}</p>
                      ) : q && p.canEdit ? (
                        <div className="pl-3">
                          <AnswerBox p={p} q={q} compact />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                <p className="text-[10px] text-slate-500">
                  {p.store.questionsReady
                    ? p.canEdit
                      ? 'Answer here or in the Questions tab. Then press “Try again” so the AI uses your answer.'
                      : 'Saved to the Questions tab for your Admin / TL to answer.'
                    : 'Run the SQL in Setup once to save questions and answers.'}
                </p>
              </div>
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

            {tpl && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/[0.05] p-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {tplImproves ? 'Better version of a saved template' : 'New template suggested'}
                  </span>
                  <span className={`${chip} border-slate-200 dark:border-slate-700 text-slate-500`}>{p.topicLabel(tplTopic)}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {tplImproves ? (
                    <>
                      Replaces: <button type="button" onClick={() => p.onOpen(tplImproves.id)} className="underline">{tplImproves.title}</button>
                    </>
                  ) : (
                    tpl.title
                  )}
                </p>
                {tpl.when && <p className="text-[11px] text-slate-500">When: {tpl.when}</p>}
                <ol className="space-y-1">
                  {[tpl.en?.ack, ...(tpl.en?.body || []), tpl.en?.next].filter(Boolean).map((m, i) => (
                    <li key={i} className="text-[11px] text-slate-700 dark:text-slate-200 flex gap-1.5">
                      <span className="font-bold text-emerald-600">{i + 1}.</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ol>
                {tpl.ar && <p className="text-[10px] text-slate-500">Arabic version included.</p>}
                {p.canEdit ? (
                  tplState === 'saved' ? (
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" /> Saved – it’s in Ticket Assistance for everyone now.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tplImproves ? (
                        <>
                          <button type="button" onClick={() => addTemplate(false)} disabled={tplState === 'saving'} className={btnPrimary}>
                            <Check className="h-3.5 w-3.5" /> Replace saved template
                          </button>
                          <button type="button" onClick={() => addTemplate(true)} disabled={tplState === 'saving'} className={btnGhost}>
                            <Plus className="h-3.5 w-3.5" /> Add as a new one
                          </button>
                        </>
                      ) : (
                        <button type="button" onClick={() => addTemplate(true)} disabled={tplState === 'saving'} className={btnPrimary}>
                          <Plus className="h-3.5 w-3.5" /> Add to templates
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const t = tplScenario(!tplImproves);
                          if (t) p.onSuggestEdit(t, !tplImproves);
                        }}
                        className={btnGhost}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Review in editor first
                      </button>
                    </div>
                  )
                ) : (
                  <p className="text-[11px] text-slate-500">Only Admin / Team Leaders can add templates. If this one is useful, let your TL know.</p>
                )}
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
// Teach the AI: updates and cases (+ template suggestions in the right place of the tree)
// ---------------------------------------------------------------------------
interface TeachItem {
  key: string;
  kind: 'update' | 'case';
  id: string;
  title: string;
  text: string; // what is sent to the AI
  body: string; // what is shown
  by: string;
  date: string;
  active: boolean;
  product?: string | null;
}

function TeachPanel(p: Shared) {
  const [mode, setMode] = useState<'update' | 'case'>('case');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [situation, setSituation] = useState('');
  const [handling, setHandling] = useState('');
  const [product, setProduct] = useState(PRODUCT_OPTIONS[0]);
  const [saving, setSaving] = useState(false);
  const [news, setNews] = useState<{ id: string; title: string; content: string; created_at?: string }[] | null>(null);
  const [working, setWorking] = useState<string>('');
  const [result, setResult] = useState<{ forKey: string; data: UpdateAnswer; fallbackTopic: string } | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [pasteFor, setPasteFor] = useState<string>('');
  const [pasted, setPasted] = useState('');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'update' | 'case'>('all');

  const items: TeachItem[] = useMemo(() => {
    const ups: TeachItem[] = p.store.updates.map((u) => ({
      key: `u:${u.id}`,
      kind: 'update',
      id: u.id || '',
      title: u.title || 'Update',
      text: `${u.title || ''}\n${u.body}`,
      body: u.body,
      by: String(u.created_by || ''),
      date: u.created_at || '',
      active: u.active !== false,
    }));
    const cases: TeachItem[] = p.store.examples.filter(isTaughtCase).map((e) => ({
      key: `c:${e.id}`,
      kind: 'case',
      id: e.id || '',
      title: e.issue || 'Case',
      text: `${e.issue || ''}${e.product ? ` (product: ${e.product})` : ''}\nSituation: ${e.chat}\nHow we handle it: ${e.reply}`,
      body: `Situation: ${e.chat}\n\nHow we handle it: ${e.reply}`,
      by: String(e.created_by || ''),
      date: e.created_at || '',
      active: true,
      product: e.product,
    }));
    return [...ups, ...cases].sort((a, b) => b.date.localeCompare(a.date)).filter((i) => filter === 'all' || i.kind === filter);
  }, [p.store.updates, p.store.examples, filter]);

  const needTables = () => {
    if (p.store.status === 'ready') return false;
    p.flash('Saving needs the one-time setup (Setup → Supabase tables).', true);
    return true;
  };

  const addUpdate = async () => {
    if (!body.trim() || needTables()) return;
    setSaving(true);
    const err = await saveUpdate({ title: title.trim(), body: body.trim() }, p.email);
    setSaving(false);
    if (err) return p.flash(`Could not save: ${err}`, true);
    setTitle('');
    setBody('');
    p.flash('Update saved – the AI follows it from now on');
    p.reload();
  };

  const addCase = async () => {
    if (!situation.trim() || !handling.trim() || needTables()) return;
    setSaving(true);
    const err = await saveExample(
      {
        issue: title.trim() || situation.trim().slice(0, 80),
        product: product === PRODUCT_OPTIONS[0] ? null : product,
        chat: situation.trim(),
        reply: handling.trim(),
        template_ids: ['case'],
      },
      p.email
    );
    setSaving(false);
    if (err) return p.flash(`Could not save: ${err}`, true);
    setTitle('');
    setSituation('');
    setHandling('');
    setProduct(PRODUCT_OPTIONS[0]);
    p.flash('Case saved – the AI uses it for similar chats. Press “Create / update templates” on it to add it to Ticket Assistance.');
    p.reload();
  };

  const promptFor = (it: TeachItem) => {
    const candidates = p.rank(it.text, 8);
    return {
      prompt: buildUpdatePrompt({
        update: it.text,
        kind: it.kind,
        templates: candidates.map((s) => ({ s, topic: p.topicLabel(s.topic), topicId: s.topic })),
        tree: treeOf(p),
        placeholders: PLACEHOLDERS,
        answers: pickAnswers(it.text, p.store.questions),
      }),
      fallbackTopic: candidates[0]?.topic || 'gen-follow',
    };
  };

  const show = async (it: TeachItem, data: UpdateAnswer, fallbackTopic: string) => {
    setResult({ forKey: it.key, data, fallbackTopic });
    setDone(new Set());
    const n = await keepQuestions(p, data.questions, { context: it.text.slice(0, 600), product: it.product || undefined });
    if (n) p.flash(`The AI asked ${n} question${n > 1 ? 's' : ''} – see the Questions tab`);
  };

  const analyse = async (it: TeachItem) => {
    setError('');
    setResult(null);
    setWorking(it.key);
    const { prompt, fallbackTopic } = promptFor(it);
    const r = await askAI('update', prompt, p.email);
    setWorking('');
    if (r.error) return setError(r.error);
    const data = parseUpdate(r.text || '');
    if (!data) return setError('Could not read the AI’s answer. Please try again.');
    show(it, data, fallbackTopic);
  };

  const copyPrompt = (it: TeachItem) => {
    p.copy(chatGptPrompt('update', promptFor(it).prompt), 'Prompt for ChatGPT');
    setPasteFor(it.key);
    setPasted('');
  };

  const usePasted = (it: TeachItem) => {
    const data = parseUpdate(pasted);
    if (!data) return setError('Could not read that answer. Paste ChatGPT’s full reply, including the json block.');
    setError('');
    setPasteFor('');
    show(it, data, promptFor(it).fallbackTopic);
  };

  const changed = (c: UpdateAnswer['changes'][number]): SavedTemplate | null => {
    const base = p.byId[c.id];
    if (!base) return null;
    return { ...(base as SavedTemplate), en: applyPatch(base.en, c.en) || base.en, ar: base.ar || c.ar ? applyPatch(base.ar, c.ar) : undefined };
  };

  const saveNow = async (key: string, t: SavedTemplate | null, label: string) => {
    if (!t) return p.flash('That template is not in the library any more.', true);
    const err = await p.onSaveTemplate(t);
    if (err) return p.flash(err, true);
    setDone((d) => new Set(d).add(key));
    p.flash(label);
  };

  const loadNews = async () => setNews(await recentAnnouncements(6));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 items-start">
      <div className={`${panel} p-4 space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Teach the AI</p>
          <span className="flex-1" />
          <Seg
            value={mode}
            onChange={setMode}
            options={[
              { value: 'case', label: 'A case' },
              { value: 'update', label: 'An update' },
            ]}
          />
        </div>
        <p className="text-[11px] text-slate-500">
          {mode === 'case'
            ? 'Share a case the templates don’t cover and how the team handles it. The AI uses it for similar chats, and can turn it into a template in the right place of Ticket Assistance.'
            : 'Policy, process or wording changes. Every AI reply follows them, even where an older template says otherwise.'}
        </p>
        {!p.canEdit ? (
          <p className="text-[11px] text-slate-500">Only Admin / Team Leaders can teach the AI. Share new cases or updates with your TL.</p>
        ) : mode === 'case' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_180px] gap-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title, e.g. Refund to a closed bank card" className={`${input} h-9 px-3`} />
              <select value={product} onChange={(e) => setProduct(e.target.value)} className={`${input} h-9 px-2`} title="Product (optional)">
                {PRODUCT_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </div>
            <textarea value={situation} onChange={(e) => setSituation(e.target.value)} rows={4} placeholder="The situation – what the customer asked or what happened…" className={`${input} p-3`} />
            <textarea
              value={handling}
              onChange={(e) => setHandling(e.target.value)}
              rows={5}
              placeholder="How we handle it – the correct answer, the steps, who to raise it to, timeframes…"
              className={`${input} p-3`}
            />
            <button type="button" onClick={addCase} disabled={!situation.trim() || !handling.trim() || saving} className={btnPrimary}>
              <Plus className="h-3.5 w-3.5" /> Save case
            </button>
          </>
        ) : (
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
              <button type="button" onClick={addUpdate} disabled={!body.trim() || saving} className={btnPrimary}>
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
        )}
      </div>

      <div className={`${panel} p-4 space-y-3`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">What the AI follows</p>
          <span className="flex-1" />
          <Seg
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'case', label: 'Cases' },
              { value: 'update', label: 'Updates' },
            ]}
          />
        </div>
        {p.store.status !== 'ready' && <p className="text-[11px] text-amber-700 dark:text-amber-300">The tables aren’t set up yet (Setup → Supabase tables).</p>}
        {p.store.status === 'ready' && !items.length && <p className="text-[11px] text-slate-500">Nothing here yet.</p>}
        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 flex items-start gap-1.5">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
        {items.map((it) => (
          <div key={it.key} className={`rounded-xl border p-3 space-y-2 ${it.active ? 'border-slate-200 dark:border-slate-700' : 'border-slate-200 dark:border-slate-800 opacity-60'}`}>
            <div className="flex items-start gap-2">
              <span
                className={`h-5 px-1.5 rounded-md text-[10px] font-extrabold uppercase flex items-center shrink-0 ${
                  it.kind === 'case' ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300' : 'bg-violet-500/15 text-violet-700 dark:text-violet-300'
                }`}
              >
                {it.kind}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{it.title}</p>
                <p className="text-[10px] text-slate-400">
                  {it.product ? `${it.product} · ` : ''}
                  {it.date.slice(0, 10)} · {it.by.split('@')[0]} {it.active ? '' : '· paused'}
                </p>
              </div>
              {p.canEdit && it.kind === 'update' && (
                <button
                  type="button"
                  onClick={async () => {
                    const err = await setUpdateActive(it.id, !it.active);
                    if (err) p.flash(`Could not change: ${err}`, true);
                    p.reload();
                  }}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  {it.active ? 'Pause' : 'Turn on'}
                </button>
              )}
              {p.canEdit && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Delete this ${it.kind}? The AI will stop using it.`)) return;
                    const err = it.kind === 'update' ? await deleteUpdate(it.id) : await deleteExample(it.id);
                    if (err) p.flash(`Could not delete: ${err}`, true);
                    p.reload();
                  }}
                  className="h-6 w-6 rounded-md text-slate-400 hover:text-red-600 flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 whitespace-pre-wrap line-clamp-6">{it.body}</p>
            {p.canEdit && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => analyse(it)}
                  disabled={!p.ai?.configured || !!working}
                  className={btnGhost}
                  title={p.ai?.configured ? '' : 'Built-in AI is off – use Copy prompt'}
                >
                  {working === it.key ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Create / update templates
                </button>
                <button type="button" onClick={() => copyPrompt(it)} className={btnGhost}>
                  <Copy className="h-3.5 w-3.5" /> Copy prompt for ChatGPT
                </button>
              </div>
            )}
            {pasteFor === it.key && (
              <div className="space-y-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
                <p className="text-[11px] text-slate-500">Paste the prompt into ChatGPT, then paste its whole answer here.</p>
                <textarea value={pasted} onChange={(e) => setPasted(e.target.value)} rows={4} placeholder="Paste ChatGPT’s answer…" className={`${input} p-3`} />
                <button type="button" onClick={() => usePasted(it)} disabled={!pasted.trim()} className={btnPrimary}>
                  <Send className="h-3.5 w-3.5" /> Use this answer
                </button>
              </div>
            )}
            {result && result.forKey === it.key && (
              <div className="space-y-2 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/30 p-3">
                {result.data.summary && <p className="text-[11px] text-slate-700 dark:text-slate-200">{result.data.summary}</p>}
                {!result.data.changes.length && !result.data.added.length && (
                  <p className="text-[11px] text-slate-500">No template needs to change – the AI already covers this.</p>
                )}
                {result.data.changes.map((c) => {
                  const k = `chg:${c.id}`;
                  return (
                    <div key={k} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-2 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-violet-600">Update</span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex-1 min-w-0 truncate">{p.byId[c.id]?.title || c.id}</span>
                        <span className="text-[10px] text-slate-400">{p.byId[c.id] ? p.topicLabel(p.byId[c.id].topic) : ''}</span>
                      </div>
                      {c.reason && <p className="text-[11px] text-slate-500">{c.reason}</p>}
                      {c.en?.ack && <p className="text-[11px] text-slate-600 dark:text-slate-300">→ {c.en.ack}</p>}
                      {done.has(k) ? (
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Saved for everyone</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => saveNow(k, changed(c), 'Template updated for everyone')} disabled={!p.byId[c.id]} className={btnPrimary}>
                            <Check className="h-3.5 w-3.5" /> Apply now
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const t = changed(c);
                              if (t) p.onSuggestEdit(t, false);
                            }}
                            disabled={!p.byId[c.id]}
                            className={btnGhost}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Review in editor
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {result.data.added.map((n, i) => {
                  const k = `new:${i}`;
                  const t = newTemplateFrom(p, n, result.fallbackTopic);
                  return (
                    <div key={k} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-2 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-emerald-600">New</span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100 flex-1 min-w-0 truncate">{n.title}</span>
                        <span className="text-[10px] text-slate-400">{p.topicLabel(t.topic)}</span>
                      </div>
                      {n.en?.ack && <p className="text-[11px] text-slate-600 dark:text-slate-300">→ {n.en.ack}</p>}
                      {done.has(k) ? (
                        <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Added to Ticket Assistance</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => saveNow(k, t, `Template added under ${p.topicLabel(t.topic)}`)} className={btnPrimary}>
                            <Plus className="h-3.5 w-3.5" /> Add to templates
                          </button>
                          <button type="button" onClick={() => p.onSuggestEdit(t, true)} className={btnGhost}>
                            <Pencil className="h-3.5 w-3.5" /> Review in editor
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {result.data.questions.length > 0 && (
                  <div className="rounded-lg border border-amber-300 dark:border-amber-500/40 p-2 space-y-1">
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" /> Questions from the AI
                    </p>
                    {result.data.questions.map((q) => (
                      <p key={q} className="text-[11px] text-slate-700 dark:text-slate-200">• {q}</p>
                    ))}
                    <button type="button" onClick={() => p.goTo('questions')} className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:underline">
                      Answer them in the Questions tab
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Questions the AI asked (the team's answers become knowledge)
// ---------------------------------------------------------------------------
function QuestionsPanel(p: Shared) {
  const [view, setView] = useState<'open' | 'answered'>('open');
  const list = p.store.questions.filter((q) => (view === 'open' ? q.status !== 'answered' : q.status === 'answered'));
  return (
    <div className={`${panel} p-4 space-y-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Questions from the AI</p>
        <span className="text-[11px] text-slate-500">When the AI isn’t sure about a product or a process, it asks here. Your answers are used in every reply after that.</span>
        <span className="flex-1" />
        <Seg
          value={view}
          onChange={setView}
          options={[
            { value: 'open', label: `Waiting (${p.store.questions.filter((q) => q.status !== 'answered').length})` },
            { value: 'answered', label: `Answered (${p.store.questions.filter((q) => q.status === 'answered').length})` },
          ]}
        />
      </div>
      {!p.store.questionsReady && <p className="text-[11px] text-amber-700 dark:text-amber-300">The questions table isn’t set up yet (Setup → run the SQL once).</p>}
      {p.store.questionsReady && !list.length && (
        <p className="text-[11px] text-slate-500">{view === 'open' ? 'No open questions. 🎉' : 'No answers yet.'}</p>
      )}
      <div className="space-y-2">
        {list.map((q) => (
          <div key={q.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <HelpCircle className={`h-4 w-4 shrink-0 mt-0.5 ${q.status === 'answered' ? 'text-emerald-500' : 'text-amber-500'}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{q.question}</p>
                <p className="text-[10px] text-slate-400">
                  {q.product ? `${q.product} · ` : ''}
                  {q.created_at?.slice(0, 10)}
                  {q.asked_by ? ` · from ${String(q.asked_by).split('@')[0]}’s chat` : ''}
                  {q.answered_by ? ` · answered by ${String(q.answered_by).split('@')[0]}` : ''}
                </p>
              </div>
              {p.canEdit && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Delete this question?')) return;
                    const err = await deleteQuestion(q.id!);
                    if (err) p.flash(`Could not delete: ${err}`, true);
                    p.reload();
                  }}
                  className="h-6 w-6 rounded-md text-slate-400 hover:text-red-600 flex items-center justify-center"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {q.context && (
              <details className="text-[11px] text-slate-500">
                <summary className="cursor-pointer select-none">Where it came from</summary>
                <p className="whitespace-pre-wrap mt-1">{q.context}</p>
              </details>
            )}
            {p.canEdit ? (
              <AnswerBox p={p} q={q} />
            ) : q.answer ? (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">{q.answer}</p>
            ) : (
              <p className="text-[11px] text-slate-400">Waiting for an Admin / TL to answer.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// What the AI learned: approved replies + taught cases
// ---------------------------------------------------------------------------
function ExamplesPanel(p: Shared) {
  const [open, setOpen] = useState<string>('');
  return (
    <div className={`${panel} p-4 space-y-3`}>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-bold text-slate-800 dark:text-slate-100">What the AI learned</p>
        <span className="text-[11px] text-slate-500">
          Cases the team taught it and replies marked as good. For each new chat it picks the closest ones. It also reads the {p.scenarios.length} templates in Ticket Assistance.
        </span>
      </div>
      {p.store.status !== 'ready' && <p className="text-[11px] text-amber-700 dark:text-amber-300">The tables aren’t set up yet (Setup → Supabase tables).</p>}
      {p.store.status === 'ready' && !p.store.examples.length && (
        <p className="text-[11px] text-slate-500">Nothing yet. Teach it a case, or press “Good reply – learn from it” after a good AI reply.</p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {p.store.examples.map((e) => {
          const mine = String(e.created_by || '').toLowerCase() === p.email;
          const isOpen = open === e.id;
          const isCase = isTaughtCase(e);
          return (
            <div key={e.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 space-y-1.5">
              <div className="flex items-start gap-2">
                <span
                  className={`h-5 px-1.5 rounded-md text-[10px] font-extrabold uppercase flex items-center shrink-0 ${
                    isCase ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {isCase ? 'case' : 'reply'}
                </span>
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
                      if (!window.confirm(isCase ? 'Remove this case?' : 'Remove this learned reply?')) return;
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{isCase ? 'Situation' : 'Customer chat (personal details removed)'}</p>
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
