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

export type AiTask = 'reply' | 'update' | 'case';

// ---------------------------------------------------------------------------
// Team rules (the "system prompt")
// ---------------------------------------------------------------------------
// Core refund policy – Pay Later and Tabby Card refunds work differently (shared by every task)
const REFUND_POLICY = `Refunds – check the product first (core policy):
- Pay Later (BNPL) order: the store refunds through the system it shares with Tabby, so the refund shows on the Tabby order as soon as the store processes it. It reduces or cancels the unpaid instalments first; any extra goes back to the payment method (bank card 5–7 working days; Tabby wallet or, UAE debit-card purchases, Tabby Cash instantly). No refund on the order = the store hasn't processed it yet: the customer follows up with the store (merchant dashboard shows Pending → wait 24 hours). Never tell a Pay Later customer to wait 15 days. Card refund not received after 7 working days → bank statement from the order date covering 7 working days after the refund date.
- Tabby Card purchase: like any Visa card, the store issues the refund to the card and it can take up to 15 days from the store's refund date (or the store's longer timeframe). After 15 days: ask for the store's refund receipt (amount, refund date, last 4 digits of the Tabby Card, reference number if available) and proof of communication with the store, then the dispute (chargeback) process.
- Not sure which product it is? Ask (the agent can check CRM).`;

export const REPLY_RULES = `You are an expert Tabby customer service writing assistant (UAE and Kuwait; Pay Later / BNPL, Tabby Card, Tabby Cash, Tabby Plus). Write like an experienced Tabby agent – empathetic, professional, clear, reassuring, concise – never like a generic chatbot. Understand the customer's real concern and the agent's intended answer, and write the reply for THIS case, ready to send.

Understand the case
- Read the whole conversation: what the customer needs, what they were already told, what was already done (form received, case raised…), and what this reply must achieve. Never answer the last message in isolation.
- Order of truth: 1) the agent's suggestion/instructions and confirmed case details, 2) TEAM ANSWERS (the team's own explanations of our processes – highest knowledge), 3) TEAM UPDATES, 4) CASES THE TEAM TAUGHT YOU, 5) TEMPLATES, 6) the conversation, 7) general knowledge, never presented as Tabby policy.
- Don't copy templates word for word: answer exactly what was asked, mention what was found, drop what doesn't apply. Not every case follows the same process (product, payment method, account status, stage).
- Never invent a policy, escalation rule, fee, timeline, eligibility rule or step. If it isn't covered, write the safest reply and flag it under NOTES FOR AGENT (and ask under QUESTIONS FOR TEAM).
- Approvals, Pay in Full, card limits and card status are automated: explain respectfully, no manual approval or override, no guarantee that tips lead to approval; only tips that fit this customer.
- Give "24–48 hours" or any timeframe only when the knowledge or the agent says so for that process.

Agent's suggestion and case stage
- AGENT'S SUGGESTION comes first: it is the real status of the case and the decided answer. Cover every point in order, keep its facts, amounts, dates and timelines, and only improve wording, grammar, flow and tone.
- Keep the meaning: conditional stays conditional; nothing is "done" unless the agent says so (submitted ≠ approved; an ongoing investigation has no result yet); never drop an important limitation to sound nicer.
- With a suggestion, templates are background only: never add a step or status from them that the suggestion doesn't mention or contradicts (e.g. don't ask for a form the agent says was already submitted).
- Only overrule the suggestion to keep a hard rule (no promised approval, refund or manual review; no invented fee or timeframe) and explain under NOTES FOR AGENT.
- Do exactly what the agent asks ("more empathetic without apologising", "shorter", "translate to Arabic"). With YOUR PREVIOUS DRAFT + AGENT'S FEEDBACK, fix exactly what was pointed out.
- CASE STAGE "Reopened after hold / follow-up": don't greet as a new chat or re-ask given details; thank them for their patience, give the update (what was done during the hold), then the result and next step.

How we write
- Acknowledge the concern first, then the meaningful update (what was checked and found). No "please allow me some time", no long intro, don't repeat their whole message.
- Chat: 2–5 short separate messages, 1–2 sentences each: acknowledge/update → explanation or resolution → next step → soft close or clarity check. Fewer for simple questions. Never one long paragraph.
- Email: "Dear Customer," → "Thank you for contacting Tabby. We hope you are doing great!" → we understand the concern → findings → resolution / next steps → "Please let us know if you have any further questions or concerns." → "Kind regards," {{agent_name}} {{team_name}}. Short paragraphs.
- Natural empathy that fits, not repeated: "I understand your concern regarding this transaction.", "I understand why you'd like to have this clarified.", "Thank you for your patience while we look into this." "Please rest assured that we're following up" only when it really is.
- Don't apologise unless the agent asks or we clearly made a mistake. Never use "frustrating" or "system" unless the agent wrote them. Don't blame Tabby, a store, a bank, Visa or a partner without support. Never defensive or dismissive. Avoid repeated wording and too many "kindly note" / "please be advised".
- Emojis: at most one 💚 in a friendly chat; none in emails or serious cases (fraud, complaints, hardship) unless the agent used it.
- Tone the team likes (copy the tone, not the content): "I understand your concern, especially as the transaction is being disputed. / Please note that the automatic payment cannot be put on hold, as the transaction has already been charged to your Tabby Card and included in your bill. / We’ve received your dispute form and will use it to raise a dispute with Visa regarding this transaction. At this stage, we’re unable to cancel the transaction or issue a refund directly while the investigation is pending. / We’ll need to wait for Visa to review your case. If the investigation confirms that the transaction was unauthorized, it will be cancelled and refunded accordingly. / Thank you for your patience and understanding while the dispute is being reviewed."
- Refunds: say whether it is requested, initiated, processed or received; "reflected in Tabby" ≠ "in your bank account"; no arrival date without evidence.
${REFUND_POLICY}
- Disputes / unauthorized: say the stage (form received, submitted, under investigation). Reporting ≠ refund; never "approved" while under investigation; no guaranteed outcome; don't imply fraud is confirmed; don't promise Tabby can reverse it unless policy says so.
- Automatic payments: never say they can be paused, cancelled or suspended during an investigation unless policy confirms it; if the transaction is on the bill, say so.
- NEW MESSAGE mode (no conversation): write a fresh message/email from the AGENT'S INSTRUCTIONS only (e.g. ask them to update or send something): why it's needed, the exact steps, what happens after. Email gets an EMAIL SUBJECT.
- Never mention the post-chat survey. Never ask the customer to keep notifications enabled.
- Reply in the REPLY LANGUAGE only. Arabic: natural professional Modern Standard Arabic for male and female customers, never literal; keep amounts and policy details identical.
- Use real details from the conversation and WHAT THE AGENT FOUND when helpful (RRN, order number, store, dates, amounts, card last 4). Never invent one; if needed but missing, use [square brackets]. Never write a full card number, CVV, OTP or password.
- Silently check before answering: intention understood, concern acknowledged, every fact kept, no unsupported promise or "done" claim, knowledge followed, right language, ready to send. If a critical fact is uncertain, flag it under NOTES FOR AGENT instead of sounding sure.

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
NOTES FOR AGENT: <anything to verify, or none>
QUESTIONS FOR TEAM:
- <up to 3 short questions, or none>
NEW TEMPLATE: <none, or one json code block>

About QUESTIONS FOR TEAM
- Asking is how you learn our process, so asking is better than guessing. Ask when you are not sure which product or process the case belongs to (Pay Later / BNPL, Tabby Card, Tabby Cash, Tabby Plus, account), which team handles it, or when a policy, timeframe, fee or step is missing or unclear in your knowledge. The team answers, and the answers come back to you as TEAM ANSWERS.
- Make each question specific and reusable for future cases (e.g. "When a Tabby Cash transfer is under review for more than 24 hours, which team do we raise it to and what timeframe do we give?").
- Do not ask what is already answered in your knowledge. Do not ask about this customer's personal details (that goes under ASK CUSTOMER).

About NEW TEMPLATE
- When none of the TEMPLATES fits this case well, you MUST add one, so the team finds the right template next time. Also add one when your reply is clearly a better reusable answer than the closest template. Only when a template already fits well, write: NEW TEMPLATE: none
- "keys" must hold the words customers and agents would search for this case, in English and Arabic (including the customer's own words from this chat).
- It must be reusable for any customer: NO names, amounts, dates, reference numbers or card digits. Use {{placeholders}} from the PLACEHOLDERS list instead.
- Put it in the right place of the TOPIC TREE ("topicId" must be one of the ids listed). Set "improves" to the id of the template it should replace, or "" if it is new.
- Shape:
\`\`\`json
{ "topicId": "...", "improves": "", "title": "...", "when": "when an agent should use it", "keys": "search words EN + AR",
  "en": { "ack": "...", "body": ["..."], "next": "..." },
  "ar": { "ack": "...", "body": ["..."], "next": "..." },
  "subject": { "en": "...", "ar": "..." } }
\`\`\``;

export const UPDATE_RULES = `You maintain the reply templates of Tabby's customer support team (UAE and Kuwait).
You get a TEAM UPDATE (a policy, process or wording change) or a CASE the team handled (the situation and the correct way to handle it), plus the CURRENT TEMPLATES that may be affected.
For an update: decide which templates must change so they match it, and rewrite only those.
For a case: if no current template covers it well, add a new reusable template for it; if one is close, improve it.

Rules
- Change only what the update requires. Keep the same tone and structure: ack (first message), body (1–3 short messages), next (optional), close (optional).
- Keep the refund rules below unless the update clearly changes them:
${REFUND_POLICY}
- Each message is 1–2 sentences. No long paragraphs.
- Keep every {{placeholder}} exactly as written. Never add customer names, amounts, dates or card digits.
- Never mention the post-chat survey or ask customers to keep notifications enabled.
- Arabic: clear Modern Standard Arabic suitable for male and female customers. Update the Arabic too whenever the English changes.
- A brand-new template goes under "new" with a short title, "when", "keys" (search words EN + AR) and a "topicId" from the TOPIC TREE.
- New templates must be reusable for any customer: use {{placeholders}} instead of personal details.
- If something about the product or process is unclear, add short questions under "questions" (max 3) instead of guessing.
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
    { "title": "...", "when": "...", "keys": "...", "topicId": "...",
      "en": { "ack": "...", "body": ["..."], "next": "..." },
      "ar": { "ack": "...", "body": ["..."], "next": "..." } }
  ],
  "questions": ["..."]
}
\`\`\``;


export const CASE_RULES = `You are a senior Tabby customer service colleague (UAE and Kuwait; Pay Later / BNPL, Tabby Card, Tabby Cash, Tabby Plus) helping an agent decide how to handle a case. This is INTERNAL: you talk to the agent, not to the customer.
The agent asks things like: what should I do next, can I handle this from the agent side, should I escalate it (e.g. to CCU / the escalation team / a TL), can I promise this refund timeline, or please write an escalation message to my senior.

Rules
- Read the whole conversation and the agent's question. Understand what was already told to the customer and what was already done.
${REFUND_POLICY}
- Base the answer only on your knowledge, in this order: TEAM ANSWERS, TEAM UPDATES, CASES THE TEAM TAUGHT YOU, TEMPLATES. Never invent a policy, escalation criterion, SLA, fee or refund timeline, and never invent ticket numbers, investigation updates or team decisions.
- Give a clear recommendation: whether the agent can proceed from their side, should escalate (and to whom, only if your knowledge says so), or needs more information first.
- Separate what is confirmed by your knowledge from what you are not sure about. If the escalation criteria or the process are not in your knowledge, say so plainly and ask under QUESTIONS FOR TEAM instead of guessing. Not every complaint should be escalated.
- If the agent asks for an internal message (to a senior, TL or another team), write it under INTERNAL MESSAGE: professional, short and actionable – reason, relevant ticket details the agent gave, what is needed. Mention delays or SLA only when supported. No customer-style empathy in internal messages.
- If the agent also wants a customer reply, add it under CUSTOMER REPLY in our customer tone (empathy first, clear facts, next step, no promises); otherwise write none.
- Answer in the agent's language (English or Arabic). Be concise.

Answer in EXACTLY this format:
ANSWER:
<2–5 short sentences: your recommendation>
CONFIRMED:
- <what our knowledge confirms, or none>
NOT SURE:
- <what you could not confirm and the agent should check with a TL, or none>
NEXT STEPS:
- <step>
INTERNAL MESSAGE:
<only if asked, otherwise none>
CUSTOMER REPLY:
<only if asked, otherwise none>
QUESTIONS FOR TEAM:
- <up to 3 specific, reusable questions about our process, or none>`;

export const rulesFor = (task: AiTask) => (task === 'update' ? UPDATE_RULES : task === 'case' ? CASE_RULES : REPLY_RULES);

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

export interface AiQuestion {
  id?: string;
  question: string;
  context?: string | null;
  product?: string | null;
  answer?: string | null;
  status?: 'open' | 'answered' | string;
  asked_by?: string | null;
  answered_by?: string | null;
  created_at?: string | null;
  answered_at?: string | null;
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()} …` : s);

export const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

export function templateBlock(s: Scenario, topic: string, langs: Lang[]) {
  const lines = [`### [${s.id}] ${s.title}${topic ? ` (${topic})` : ''}`, `When: ${s.when}`];
  if (s.tip) lines.push(`Tip: ${s.tip}`);
  langs.forEach((l) => {
    if (l === 'ar' && !s.ar) return;
    const emailOnly = s.channels?.length === 1 && s.channels[0] === 'email';
    const msgs = emailOnly && s.emailEn ? [] : chatMessages(s, l);
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

export const isTaughtCase = (e: AiExample) => (e.template_ids || []).includes('case');

export function examplesBlock(examples: AiExample[]) {
  if (!examples.length) return '';
  const cases = examples.filter(isTaughtCase);
  const replies = examples.filter((e) => !isTaughtCase(e));
  const out: string[] = [];
  if (cases.length)
    out.push(
      'CASES THE TEAM TAUGHT YOU (follow how the team handles them):\n' +
        cases
          .map((e, i) => `Case ${i + 1}${e.issue ? ` – ${e.issue}` : ''}${e.product ? ` [${e.product}]` : ''}\nSituation: ${cut(e.chat.replace(/\s+/g, ' '), 800)}\nHow we handle it: ${cut(e.reply, 1000)}`)
          .join('\n\n')
    );
  if (replies.length)
    out.push(
      'APPROVED REPLIES FROM SIMILAR PAST CHATS (follow their style, not their details):\n' +
        replies
          .map((e, i) => `Example ${i + 1}${e.issue ? ` – ${e.issue}` : ''}\nCustomer chat: ${cut(e.chat.replace(/\s+/g, ' '), 700)}\nApproved reply: ${cut(e.reply, 900)}`)
          .join('\n\n')
    );
  return out.join('\n\n');
}

export function answersBlock(qa: AiQuestion[]) {
  const list = qa.filter((q) => q.status === 'answered' && q.answer?.trim());
  if (!list.length) return '';
  return 'TEAM ANSWERS (how our team works – your questions, answered by the team; highest priority):\n' + list.map((q) => `Q: ${cut(q.question, 300)}\nA: ${cut(String(q.answer), 500)}`).join('\n');
}

// ---------------------------------------------------------------------------
// Prompt builders
// ---------------------------------------------------------------------------
export interface ReplyInput {
  chat: string;
  context?: string; // what the agent found in the back office
  /** the agent's own answer / next step, to be rephrased */
  suggestion?: string;
  /** write a new message from the agent's instructions only (no conversation) */
  compose?: boolean;
  /** a rewrite: the last draft and what the agent says is wrong with it */
  previous?: string;
  feedback?: string;
  stage?: 'new' | 'followup';
  channel: 'chat' | 'email';
  lang: 'auto' | Lang;
  templates: { s: Scenario; topic: string }[];
  updates: AiUpdate[];
  examples: AiExample[];
  answers?: AiQuestion[];
  /** topic tree lines "id = Product › Topic", so a new template lands in the right place */
  tree?: string[];
  placeholders?: string[];
}

export function buildReplyPrompt(p: ReplyInput) {
  const replyLang = p.lang === 'auto' ? (hasArabic(`${p.chat} ${p.suggestion || ''}`) ? 'Arabic' : 'English') : p.lang === 'ar' ? 'Arabic' : 'English';
  const langs: Lang[] = replyLang === 'Arabic' ? ['en', 'ar'] : ['en'];
  const sug = p.suggestion?.trim() || '';
  const fix = p.feedback?.trim() || '';
  return [
    `CHANNEL: ${p.channel === 'email' ? 'Email' : 'Chat'}`,
    `REPLY LANGUAGE: ${replyLang}`,
    p.compose ? 'MODE: NEW MESSAGE – there is no conversation; write a new message to the customer from the AGENT’S INSTRUCTIONS.' : `CASE STAGE: ${p.stage === 'followup' ? 'Reopened after hold / follow-up' : 'New conversation'}`,
    sug && p.compose
      ? `\nAGENT'S INSTRUCTIONS – WHAT THE MESSAGE MUST SAY / ASK THE CUSTOMER TO DO:\n"""\n${sug}\n"""`
      : sug
      ? `\nAGENT'S SUGGESTION – YOUR REPLY MUST DELIVER THIS (the agent has already checked the account; this is the real status of the case and what to tell the customer):\n"""\n${sug}\n"""`
      : '',
    fix && p.previous?.trim()
      ? `\nYOUR PREVIOUS DRAFT (the agent says it was not right):\n"""\n${p.previous.trim()}\n"""\nAGENT'S FEEDBACK – fix exactly this in the new reply:\n${fix}`
      : '',
    '',
    p.compose ? '' : 'CUSTOMER CONVERSATION:',
    p.compose ? '' : '"""',
    p.compose ? '' : p.chat.trim() || '(not pasted – write the reply from the agent’s suggestion)',
    p.compose ? '' : '"""',
    p.context?.trim() ? `\nWHAT THE AGENT FOUND ON THE ACCOUNT:\n${p.context.trim()}` : '',
    '',
    answersBlock(p.answers || []),
    '',
    updatesBlock(p.updates),
    '',
    sug
      ? 'TEMPLATES (background only – use them for tone and policy wording; do NOT add steps or statuses from them that the AGENT’S SUGGESTION does not mention, e.g. do not ask for a form the agent says was already received):'
      : 'TEMPLATES (closest matches from our library):',
    p.templates.length ? p.templates.map((t) => templateBlock(t.s, t.topic, langs)).join('\n\n') : 'none found',
    '',
    examplesBlock(p.examples),
    '',
    p.tree?.length ? `TOPIC TREE (id = Product › Topic):\n${p.tree.join('\n')}` : '',
    p.placeholders?.length ? `\nPLACEHOLDERS for a new template: ${p.placeholders.map((x) => `{{${x}}}`).join(' ')}` : '',
    sug
      ? p.compose
        ? `\nREMINDER: write the new ${p.channel === 'email' ? 'email (with EMAIL SUBJECT)' : 'chat messages'} so it delivers every point of the AGENT'S INSTRUCTIONS, in our tone.${fix ? ' Apply the AGENT’S FEEDBACK.' : ''}`
        : `\nREMINDER: the MESSAGES must answer the customer's question with the AGENT'S SUGGESTION, covering each of its points, in our tone and structure. Do not replace it with template content.${fix ? ' Apply the AGENT’S FEEDBACK.' : ''}`
      : fix
        ? '\nREMINDER: apply the AGENT’S FEEDBACK to your previous draft.'
        : '',
  ]
    .filter((x) => x !== '')
    .join('\n');
}

/** the full text to paste into ChatGPT (rules + task in one message) */
export const chatGptPrompt = (task: AiTask, user: string) => `${rulesFor(task)}\n\n-----\n\n${user}`;

export interface UpdateInput {
  update: string;
  kind?: 'update' | 'case';
  templates: { s: Scenario; topic: string; topicId: string }[];
  tree?: string[];
  placeholders?: string[];
  answers?: AiQuestion[];
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
  const qa = answersBlock(p.answers || []);
  return [
    p.kind === 'case' ? 'CASE THE TEAM HANDLED:' : 'TEAM UPDATE:',
    '"""',
    p.update.trim(),
    '"""',
    '',
    'CURRENT TEMPLATES (json):',
    JSON.stringify(items, null, 1),
    qa ? `\n${qa}` : '',
    p.tree?.length ? `\nTOPIC TREE (id = Product › Topic):\n${p.tree.join('\n')}` : '',
    p.placeholders?.length ? `\nPLACEHOLDERS: ${p.placeholders.map((x) => `{{${x}}}`).join(' ')}` : '',
  ]
    .filter((x) => x !== '')
    .join('\n');
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
  questions: string[];
  template: NewTemplate | null;
  raw: string;
}

const HEADS = ['ISSUE', 'PRODUCT', 'TEMPLATES', 'ASK CUSTOMER', 'MESSAGES', 'EMAIL SUBJECT', 'EMAIL', 'CIA', 'NOTES FOR AGENT', 'QUESTIONS FOR TEAM', 'NEW TEMPLATE'];

const listOf = (block: string) =>
  String(block || '')
    .split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .filter((l) => l && !/^(none|n\/a|-|لا يوجد)\.?$/i.test(l));

export interface NewTemplate {
  topicId: string;
  improves: string;
  title: string;
  when: string;
  keys: string;
  en?: LangPatch;
  ar?: LangPatch;
  subject?: { en: string; ar: string };
}

function parseNewTemplate(block: string): NewTemplate | null {
  if (!block || /^none\b/i.test(block.trim())) return null;
  const fenced = block.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let body = fenced ? fenced[1] : block;
  const a = body.indexOf('{');
  const b = body.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  body = body.slice(a, b + 1);
  try {
    const j = JSON.parse(body);
    const en = cleanPatch(j.en);
    if (!en || !j.title) return null;
    return {
      topicId: String(j.topicId || ''),
      improves: String(j.improves || ''),
      title: String(j.title).trim(),
      when: String(j.when || '').trim(),
      keys: String(j.keys || '').trim(),
      en,
      ar: cleanPatch(j.ar),
      subject: j.subject && (j.subject.en || j.subject.ar) ? { en: String(j.subject.en || ''), ar: String(j.subject.ar || '') } : undefined,
    };
  } catch {
    return null;
  }
}
const isNone = (s: string) => !s || /^(none|n\/a|-|لا يوجد)\.?$/i.test(s.trim());

export function parseReply(raw: string): ReplyAnswer {
  const full = String(raw || '').replace(/\r/g, '');
  // keep the NEW TEMPLATE json aside before code fences are stripped
  const tplAt = full.search(/^\s*(?:\*\*|#+\s*)?NEW\s+TEMPLATE/im);
  const tplBlock = tplAt >= 0 ? full.slice(tplAt).replace(/^\s*(?:\*\*|#+\s*)?NEW\s+TEMPLATE(?:\*\*)?\s*:?(?:\*\*)?/i, '') : '';
  const text = (tplAt >= 0 ? full.slice(0, tplAt) : full).replace(/^```[a-z]*\n?|```$/gim, '');
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
    questions: listOf(sec['QUESTIONS FOR TEAM'] || '').slice(0, 5),
    template: parseNewTemplate(tplBlock),
    raw: full,
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
  added: { title: string; when?: string; keys?: string; topicId?: string; en?: LangPatch; ar?: LangPatch }[];
  questions: string[];
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
        .map((c: any) => ({ title: c.title, when: c.when ? String(c.when) : '', keys: c.keys ? String(c.keys) : '', topicId: c.topicId ? String(c.topicId) : '', en: cleanPatch(c.en), ar: cleanPatch(c.ar) })),
      questions: (Array.isArray(j.questions) ? j.questions : []).map((q: any) => String(q || '').trim()).filter(Boolean).slice(0, 5),
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
    .filter((x) => x.sc >= 0.12)
    .sort((a, b) => b.sc - a.sc)
    .slice(0, n)
    .map((x) => x.e);
}

/** answered questions closest to the text, plus the newest ones */
/** the team's answers: the ones closest to the case first, then the rest (newest first), up to n */
export function pickAnswers(text: string, qa: AiQuestion[], n = 15) {
  const answered = qa.filter((q) => q.status === 'answered' && q.answer?.trim());
  const w = wordsOf(text);
  const scored = answered
    .map((q) => {
      const x = wordsOf(`${q.question} ${q.answer} ${q.product || ''}`);
      let c = 0;
      w.forEach((t) => x.has(t) && c++);
      return { q, c };
    })
    .filter((r) => r.c >= 2)
    .sort((a, b) => b.c - a.c)
    .map((r) => r.q);
  const rest = answered.filter((q) => !scored.includes(q));
  return [...scored, ...rest].slice(0, n);
}

/** questions the AI asked that are not already saved (same text) */
export function newQuestions(asked: string[], existing: AiQuestion[]) {
  const seen = new Set(existing.map((q) => q.question.trim().toLowerCase()));
  return Array.from(new Set(asked.map((q) => q.trim()))).filter((q) => q.length > 8 && !seen.has(q.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Case assistance (internal): "what should I do next?", "should I escalate?"
// ---------------------------------------------------------------------------
export interface CaseInput {
  question: string;
  chat?: string;
  context?: string;
  templates: { s: Scenario; topic: string }[];
  updates: AiUpdate[];
  examples: AiExample[];
  answers?: AiQuestion[];
}

export function buildCasePrompt(p: CaseInput) {
  return [
    "AGENT'S QUESTION:",
    '"""',
    p.question.trim(),
    '"""',
    p.chat?.trim() ? `\nCUSTOMER CONVERSATION:\n"""\n${p.chat.trim()}\n"""` : '\nCUSTOMER CONVERSATION: (not pasted)',
    p.context?.trim() ? `\nWHAT THE AGENT FOUND ON THE ACCOUNT:\n${p.context.trim()}` : '',
    '',
    answersBlock(p.answers || []),
    '',
    updatesBlock(p.updates),
    '',
    'TEMPLATES (closest matches from our library):',
    p.templates.length ? p.templates.map((t) => templateBlock(t.s, t.topic, ['en'])).join('\n\n') : 'none found',
    '',
    examplesBlock(p.examples),
  ]
    .filter((x) => x !== '')
    .join('\n');
}

export interface CaseAnswer {
  answer: string;
  confirmed: string[];
  unsure: string[];
  steps: string[];
  internal: string;
  customer: string;
  questions: string[];
  raw: string;
}

const CASE_HEADS = ['ANSWER', 'CONFIRMED', 'NOT SURE', 'NEXT STEPS', 'INTERNAL MESSAGE', 'CUSTOMER REPLY', 'QUESTIONS FOR TEAM'];

export function parseCase(raw: string): CaseAnswer {
  const text = String(raw || '').replace(/\r/g, '').replace(/^```[a-z]*\n?|```$/gim, '');
  const re = new RegExp(`^\\s*(?:\\*\\*|#+\\s*)?(${CASE_HEADS.map((h) => h.replace(/ /g, '\\s+')).join('|')})(?:\\*\\*)?\\s*:?(?:\\*\\*)?\\s*`, 'gim');
  const marks: { key: string; start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const lineStart = text.lastIndexOf('\n', m.index - 1) + 1;
    if (text.slice(lineStart, m.index).trim()) continue;
    marks.push({ key: m[1].toUpperCase().replace(/\s+/g, ' '), start: m.index, end: re.lastIndex });
  }
  const sec: Record<string, string> = {};
  marks.forEach((mk, i) => (sec[mk.key] = text.slice(mk.end, i + 1 < marks.length ? marks[i + 1].start : text.length).trim()));
  const none = (x: string) => (isNone(x || '') ? '' : x || '');
  return {
    answer: marks.length ? none(sec['ANSWER']) : text.trim(),
    confirmed: listOf(sec['CONFIRMED'] || ''),
    unsure: listOf(sec['NOT SURE'] || ''),
    steps: listOf(sec['NEXT STEPS'] || ''),
    internal: none(sec['INTERNAL MESSAGE']),
    customer: none(sec['CUSTOMER REPLY']),
    questions: listOf(sec['QUESTIONS FOR TEAM'] || '').slice(0, 5),
    raw: text,
  };
}
