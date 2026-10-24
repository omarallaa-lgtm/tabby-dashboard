// ---------------------------------------------------------------------------
// AI helper: rules, privacy masking, prompt builders and answer parsers.
//
// Used in two ways:
//   1) Built-in AI  -> the dashboard sends the prompt to /api/ai/assist (Groq or OpenAI key in Vercel)
//   2) Copy prompt  -> the agent pastes the same prompt into ChatGPT, then pastes the answer back
// Both produce the same answer format, so one parser handles both.
// This file has no browser or server-only imports: the API route uses the rules from here too.
// ---------------------------------------------------------------------------
import type { Scenario, Lang } from '@/lib/ticket-library';
import { chatMessages } from '@/lib/ticket-library';

export type AiTask = 'reply' | 'update';

// ---------------------------------------------------------------------------
// Team rules (the "system prompt")
// ---------------------------------------------------------------------------
export const REPLY_RULES = `You are the writing assistant of Tabby's customer support team (UAE and Kuwait). Products: Pay Later (BNPL / split in 4), Tabby Card, Tabby Cash, Tabby Plus.
Your job: read the customer conversation, understand the real issue, and write the reply the agent will send.

Facts and policy
- Use ONLY the policy facts in the TEMPLATES and TEAM UPDATES you are given. TEAM UPDATES are newer: if they conflict with a template, follow the update.
- If the answer is not covered, do not invent policy, fees, timeframes or steps. Write the best safe reply, and say what is missing under NOTES FOR AGENT.
- Purchase approvals, Pay in Full, card limits and card status are automated: never promise approval, a manual review, a limit increase or a date.
- Only give "24–48 hours" when the template or update for that process says so.

How we write (new approach)
- Lead with a meaningful update: what was checked and what was found. Do not open with "please allow me some time".
- Chat: 2 to 5 short separate messages, 1–2 sentences each, in this order: acknowledge / update → explanation or resolution → next step → soft close or clarity check. Never one long paragraph.
- Email: greeting "Dear Customer," → "Thank you for contacting Tabby. We hope you are doing great!" → we understand the concern → findings → resolution / next steps → "Please let us know if you have any further questions or concerns." → "Kind regards," + {{agent_name}} + {{team_name}}.
- Warm, human, never robotic. Explain why when something is automated or moved to another team.
- Never mention the post-chat survey. Never ask the customer to keep notifications enabled.
- Arabic: clear Modern Standard Arabic that suits both male and female customers.
- Do not write the customer's name, card digits, amounts, dates or reference numbers. Where the agent must add a detail, write it in square brackets, e.g. [order date]. Keep masked tokens like [PHONE] or [CARD] out of the reply.

Answer in EXACTLY this format, with these headings, and nothing before ISSUE:
ISSUE: <one line: what the customer needs>
PRODUCT: <Pay Later | Tabby Card | Tabby Cash | Account | Other>
TEMPLATES: <ids of the templates you used, comma-separated, or none>
ASK CUSTOMER: <the one critical question to ask first if information is missing, or none>
MESSAGES:
1. <chat message>
2. <chat message>
EMAIL SUBJECT: <only for email>
EMAIL:
<full email, only for email>
CIA:
C: <customer's view, in their words>
I: <what should be checked / what was found>
A: <what's next>
NOTES FOR AGENT: <anything to verify, or none>`;

export const UPDATE_RULES = `You maintain the reply templates of Tabby's customer support team (UAE and Kuwait).
You get a TEAM UPDATE (a policy, process or wording change) and the CURRENT TEMPLATES that may be affected.
Decide which templates must change so they match the update, and rewrite only those.

Rules
- Change only what the update requires. Keep the same tone and structure: ack (first message), body (1–3 short messages), next (optional), close (optional).
- Each message is 1–2 sentences. No long paragraphs.
- Keep every {{placeholder}} exactly as written. Never add customer names, amounts, dates or card digits.
- Never mention the post-chat survey or ask customers to keep notifications enabled.
- Arabic: clear Modern Standard Arabic suitable for male and female customers. Update the Arabic too whenever the English changes.
- If the update needs a brand-new template, add it under "new" with a short title, "when" and a "topicId" taken from the topics of the templates shown.
- If nothing needs to change, return empty lists.

Answer with ONE json code block and nothing else, in this shape:
\`\`\`json
{
  "summary": "one line: what the update changes",
  "changes": [
    { "id": "existing-template-id", "reason": "why it changes",
      "en": { "ack": "...", "body": ["..."], "next": "...", "close": "..." },
      "ar": { "ack": "...", "body": ["..."], "next": "...", "close": "..." } }
  ],
  "new": [
    { "title": "...", "when": "...", "topicId": "...",
      "en": { "ack": "...", "body": ["..."], "next": "..." },
      "ar": { "ack": "...", "body": ["..."], "next": "..." } }
  ]
}
\`\`\``;

export const rulesFor = (task: AiTask) => (task === 'update' ? UPDATE_RULES : REPLY_RULES);

// ---------------------------------------------------------------------------
// Privacy masking: runs in the browser before anything leaves the dashboard
// ---------------------------------------------------------------------------
export interface MaskResult {
  text: string;
  counts: Record<string, number>;
}

const AR_DIGITS = /[٠-٩]/g;
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function maskPII(input: string, hideWords: string[] = []): MaskResult {
  const counts: Record<string, number> = {};
  const hit = (k: string) => (counts[k] = (counts[k] || 0) + 1);
  let t = String(input || '').replace(AR_DIGITS, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  // words the agent asked to hide (e.g. the customer's name)
  hideWords
    .map((w) => w.trim())
    .filter((w) => w.length >= 2)
    .forEach((w) => {
      t = t.replace(new RegExp(escapeRe(w), 'gi'), () => (hit('name'), '[NAME]'));
    });

  // "Name: ..." lines from chat transcripts
  t = t.replace(/^(\s*(?:customer\s*name|full\s*name|name|الاسم|اسم العميل)\s*[:：-]\s*)(.+)$/gim, (_, a) => (hit('name'), `${a}[NAME]`));

  t = t
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, () => (hit('email'), '[EMAIL]'))
    .replace(/\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]{4}){3,7}(?:[ ]?[A-Z0-9]{1,4})?\b/g, () => (hit('iban'), '[IBAN]'))
    .replace(/\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/g, () => (hit('id'), '[ID]'))
    .replace(/\b(?:\d[ -]?){12,18}\d\b/g, () => (hit('card'), '[CARD]'))
    .replace(/((?:ending|ends|last\s*(?:4|four)(?:\s*digits)?)\s*(?:in|with|:)?\s*)\d{4}\b/gi, (_, a) => (hit('card'), `${a}[LAST4]`))
    .replace(/(?:\+|00)?\d[\d\s-]{7,14}\d\b/g, (m) => (m.replace(/\D/g, '').length >= 8 ? (hit('phone'), '[PHONE]') : m));

  return { text: t, counts };
}

export const maskSummary = (counts: Record<string, number>) => {
  const label: Record<string, string> = { name: 'name', email: 'email', iban: 'IBAN', id: 'ID number', card: 'card number', phone: 'phone / long number' };
  const parts = Object.entries(counts).map(([k, n]) => `${n} ${label[k] || k}${n > 1 ? 's' : ''}`);
  return parts.length ? parts.join(', ') : 'nothing found';
};

// ---------------------------------------------------------------------------
// Context blocks
// ---------------------------------------------------------------------------
export interface AiExample {
  id?: string;
  issue?: string | null;
  product?: string | null;
  chat: string;
  reply: string;
  template_ids?: string[] | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface AiUpdate {
  id?: string;
  title?: string | null;
  body: string;
  active?: boolean;
  created_by?: string | null;
  created_at?: string | null;
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()} …` : s);

export const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

export function templateBlock(s: Scenario, topic: string, langs: Lang[]) {
  const lines = [`### [${s.id}] ${s.title}${topic ? ` (${topic})` : ''}`, `When: ${s.when}`];
  if (s.tip) lines.push(`Tip: ${s.tip}`);
  langs.forEach((l) => {
    if (l === 'ar' && !s.ar) return;
    const msgs = chatMessages(s, l);
    if (!msgs.length && s.emailEn) lines.push(`${l.toUpperCase()} email: ${cut(l === 'ar' ? s.emailAr || s.emailEn : s.emailEn, 900)}`);
    else lines.push(`${l.toUpperCase()}: ${msgs.map((m, i) => `(${i + 1}) ${m}`).join(' ')}`);
  });
  return lines.join('\n');
}

export function updatesBlock(updates: AiUpdate[]) {
  const list = updates.filter((u) => u.active !== false).slice(0, 15);
  if (!list.length) return 'TEAM UPDATES: none';
  return (
    'TEAM UPDATES (newest first, these override the templates):\n' +
    list.map((u) => `- ${u.created_at ? `[${u.created_at.slice(0, 10)}] ` : ''}${u.title ? `${u.title}: ` : ''}${cut(u.body.replace(/\s+/g, ' '), 900)}`).join('\n')
  );
}

export function examplesBlock(examples: AiExample[]) {
  if (!examples.length) return '';
  return (
    'APPROVED REPLIES FROM SIMILAR PAST CHATS (follow their style, not their details):\n' +
    examples
      .map((e, i) => `Example ${i + 1}${e.issue ? ` – ${e.issue}` : ''}\nCustomer chat: ${cut(e.chat.replace(/\s+/g, ' '), 700)}\nApproved reply: ${cut(e.reply, 900)}`)
      .join('\n\n')
  );
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
export interface ReplyInput {
  chat: string; // already masked
  context?: string; // already masked: what the agent found in the back office
  channel: 'chat' | 'email';
  lang: 'auto' | Lang;
  templates: { s: Scenario; topic: string }[];
  updates: AiUpdate[];
  examples: AiExample[];
}

export function buildReplyPrompt(p: ReplyInput) {
  const replyLang = p.lang === 'auto' ? (hasArabic(p.chat) ? 'Arabic' : 'English') : p.lang === 'ar' ? 'Arabic' : 'English';
  const langs: Lang[] = replyLang === 'Arabic' ? ['en', 'ar'] : ['en'];
  return [
    `CHANNEL: ${p.channel === 'email' ? 'Email' : 'Chat'}`,
    `REPLY LANGUAGE: ${replyLang}`,
    '',
    'CUSTOMER CONVERSATION (personal details masked):',
    '"""',
    p.chat.trim(),
    '"""',
    p.context?.trim() ? `\nWHAT THE AGENT FOUND ON THE ACCOUNT:\n${p.context.trim()}` : '',
    '',
    updatesBlock(p.updates),
    '',
    'TEMPLATES (closest matches from our library):',
    p.templates.length ? p.templates.map((t) => templateBlock(t.s, t.topic, langs)).join('\n\n') : 'none found',
    '',
    examplesBlock(p.examples),
  ]
    .filter((x) => x !== '')
    .join('\n');
}

/** the full text to paste into ChatGPT (rules + task in one message) */
export const chatGptPrompt = (task: AiTask, user: string) => `${rulesFor(task)}\n\n-----\n\n${user}`;

export interface UpdateInput {
  update: string;
  templates: { s: Scenario; topic: string; topicId: string }[];
}

export function buildUpdatePrompt(p: UpdateInput) {
  const items = p.templates.map(({ s, topic, topicId }) => ({
    id: s.id,
    title: s.title,
    topicId,
    topic,
    when: s.when,
    en: s.en,
    ar: s.ar,
  }));
  return ['TEAM UPDATE:', '"""', p.update.trim(), '"""', '', 'CURRENT TEMPLATES (json):', JSON.stringify(items, null, 1)].join('\n');
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------
export interface ReplyAnswer {
  issue: string;
  product: string;
  templateIds: string[];
  ask: string;
  messages: string[];
  emailSubject: string;
  email: string;
  cia: string;
  notes: string;
  raw: string;
}

const HEADS = ['ISSUE', 'PRODUCT', 'TEMPLATES', 'ASK CUSTOMER', 'MESSAGES', 'EMAIL SUBJECT', 'EMAIL', 'CIA', 'NOTES FOR AGENT'];
const isNone = (s: string) => !s || /^(none|n\/a|-|لا يوجد)\.?$/i.test(s.trim());

export function parseReply(raw: string): ReplyAnswer {
  const text = String(raw || '').replace(/\r/g, '').replace(/^```[a-z]*\n?|```$/gim, '');
  const re = new RegExp(`^\\s*(?:\\*\\*|#+\\s*)?(${HEADS.map((h) => h.replace(' ', '\\s+')).join('|')})(?:\\*\\*)?\\s*:?(?:\\*\\*)?\\s*`, 'gim');
  const marks: { key: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    // a heading must start a line
    const lineStart = text.lastIndexOf('\n', m.index - 1) + 1;
    if (text.slice(lineStart, m.index).trim()) continue;
    marks.push({ key: m[1].toUpperCase().replace(/\s+/g, ' '), start: m.index, end: re.lastIndex });
  }
  const sec: Record<string, string> = {};
  marks.forEach((mk, i) => {
    const stop = i + 1 < marks.length ? marks[i + 1].start : text.length;
    sec[mk.key] = text.slice(mk.end, stop).trim();
  });

  const msgBlock = sec['MESSAGES'] || '';
  let messages = msgBlock
    .split(/\n(?=\s*\d+[.)-]\s)/)
    .map((x) => x.replace(/^\s*\d+[.)-]\s*/, '').trim())
    .filter(Boolean);
  if (messages.length <= 1 && msgBlock.includes('\n\n')) messages = msgBlock.split(/\n\s*\n/).map((x) => x.replace(/^\s*\d+[.)-]\s*/, '').trim()).filter(Boolean);
  if (!marks.length && text.trim()) messages = text.trim().split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);

  return {
    issue: sec['ISSUE'] || '',
    product: sec['PRODUCT'] || '',
    templateIds: isNone(sec['TEMPLATES'] || '')
      ? []
      : (sec['TEMPLATES'] || '').split(/[,\s]+/).map((x) => x.replace(/[[\]`'"]/g, '').trim()).filter((x) => /^[a-z0-9-]{3,}$/i.test(x)),
    ask: isNone(sec['ASK CUSTOMER'] || '') ? '' : sec['ASK CUSTOMER'],
    messages: messages.filter((x) => !isNone(x)),
    emailSubject: isNone(sec['EMAIL SUBJECT'] || '') ? '' : sec['EMAIL SUBJECT'],
    email: isNone(sec['EMAIL'] || '') ? '' : sec['EMAIL'],
    cia: sec['CIA'] || '',
    notes: isNone(sec['NOTES FOR AGENT'] || '') ? '' : sec['NOTES FOR AGENT'],
    raw: text,
  };
}

export interface LangPatch {
  ack?: string;
  body?: string[];
  next?: string;
  close?: string;
}
export interface UpdateAnswer {
  summary: string;
  changes: { id: string; reason?: string; en?: LangPatch; ar?: LangPatch }[];
  added: { title: string; when?: string; topicId?: string; en?: LangPatch; ar?: LangPatch }[];
}

const cleanPatch = (p: any): LangPatch | undefined => {
  if (!p || typeof p !== 'object') return undefined;
  const str = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
  const body = Array.isArray(p.body) ? p.body.map((x: any) => String(x || '').trim()).filter(Boolean) : typeof p.body === 'string' ? [p.body.trim()] : undefined;
  const out: LangPatch = { ack: str(p.ack), body, next: str(p.next), close: str(p.close) };
  return out.ack || out.body?.length ? out : undefined;
};

export function parseUpdate(raw: string): UpdateAnswer | null {
  const text = String(raw || '');
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let body = fenced ? fenced[1] : text;
  const a = body.indexOf('{');
  const b = body.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  body = body.slice(a, b + 1);
  try {
    const j = JSON.parse(body);
    return {
      summary: String(j.summary || ''),
      changes: (Array.isArray(j.changes) ? j.changes : [])
        .filter((c: any) => c && typeof c.id === 'string')
        .map((c: any) => ({ id: c.id.trim(), reason: c.reason ? String(c.reason) : '', en: cleanPatch(c.en), ar: cleanPatch(c.ar) })),
      added: (Array.isArray(j.new) ? j.new : [])
        .filter((c: any) => c && typeof c.title === 'string')
        .map((c: any) => ({ title: c.title, when: c.when ? String(c.when) : '', topicId: c.topicId ? String(c.topicId) : '', en: cleanPatch(c.en), ar: cleanPatch(c.ar) })),
    };
  } catch {
    return null;
  }
}

/** apply a language patch on top of an existing block (missing fields keep the old text) */
export const applyPatch = (base: Scenario['en'] | undefined, p?: LangPatch): Scenario['en'] | undefined => {
  if (!p) return base;
  return {
    ...(base || { ack: '', body: [] }),
    ack: p.ack ?? base?.ack ?? '',
    body: p.body ?? base?.body ?? [],
    next: p.next ?? base?.next,
    close: p.close ?? base?.close,
  };
};

// ---------------------------------------------------------------------------
// Simple keyword similarity (for picking past examples)
// ---------------------------------------------------------------------------
const WORD_RE = /[\p{L}\p{N}]{3,}/gu;
export const wordsOf = (s: string) => new Set((String(s || '').toLowerCase().match(WORD_RE) || []).filter((w) => !/^\d+$/.test(w)));

export function pickExamples(chat: string, examples: AiExample[], n = 3) {
  const q = wordsOf(chat);
  if (!q.size) return [];
  return examples
    .map((e) => {
      const w = wordsOf(`${e.issue || ''} ${e.chat}`);
      let common = 0;
      q.forEach((x) => w.has(x) && common++);
      return { e, sc: common >= 2 ? common / Math.sqrt(q.size * Math.max(w.size, 1)) : 0 };
    })
    .filter((x) => x.sc >= 0.25)
    .sort((a, b) => b.sc - a.sc)
    .slice(0, n)
    .map((x) => x.e);
}
