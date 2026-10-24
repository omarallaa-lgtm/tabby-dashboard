// ---------------------------------------------------------------------------
// Ticket Assistance library - data model
//
// Every customer scenario is written ONCE per language as:
//   ack   -> acknowledge / show understanding        (chat message 1)
//   body  -> explanation or resolution, short parts  (chat messages 2..n)
//   next  -> what the customer should do next        (last chat message)
//   close -> soft, scenario-specific closing line    (optional)
// The chat version shows these as separate numbered messages (copy 1 / 2 / 3 or all).
// The email version is built from the same text with a greeting and signature,
// so chat and email always say the same thing.
//
// Placeholders: {{agent_name}} and {{team_name}} are filled automatically.
// Anything else in {{double_braces}} shows a small input box in the tab.
// Never put customer names, amounts, dates or card digits in templates.
// ---------------------------------------------------------------------------

export type Channel = 'chat' | 'email';
export type Lang = 'en' | 'ar';

export interface LangBlock {
  ack: string;
  body: string[];
  next?: string;
  close?: string;
  /** email only: replaces the default closing line before the signature */
  emailClose?: string;
}

export interface Scenario {
  id: string;
  topic: string;
  title: string;
  /** when the agent should use it (internal, never sent) */
  when: string;
  /** extra search words, English and Arabic */
  keys?: string;
  /** internal handling note for the agent (never sent) */
  tip?: string;
  en: LangBlock;
  /** optional for internal emails (English only) */
  ar?: LangBlock;
  subject?: { en: string; ar: string };
  /** full email text override (used for internal / partner emails) */
  emailEn?: string;
  emailAr?: string;
  /** default: both channels */
  channels?: Channel[];
  /** internal or partner email: no customer greeting / signature wrapper */
  internal?: boolean;
  related?: string[];
}

export interface Topic {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  color: string;
  topics: Topic[];
}

export interface FlowStep {
  id: string; // scenario id
  step: number; // steps with the same number are alternative branches
  label: string;
}

export interface Flow {
  id: string;
  title: string;
  product: string;
  steps: FlowStep[];
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

// Email structure (Gs_Chat "new approach"):
// greeting → thanks → we understand your concern → findings → resolution / next step
// → closing line → signature
const EMAIL = {
  en: {
    hello: 'Dear Customer,',
    thanks: 'Thank you for contacting Tabby. We hope you are doing great!',
    close: 'Please let us know if you have any further questions or concerns.',
    bye: 'Kind regards,',
  },
  ar: {
    hello: 'مرحبًا،',
    thanks: 'شكرًا لتواصلك مع تابي، ونتمنى أن تكون أمورك على ما يرام.',
    close: 'يُرجى إبلاغنا إذا كانت لديك أي استفسارات أو ملاحظات أخرى.',
    bye: 'مع أطيب التحيات،',
  },
};

export const hasLang = (s: Scenario, lang: Lang) => lang === 'en' || !!s.ar || !!s.emailAr;

const blockOf = (s: Scenario, lang: Lang): LangBlock => (lang === 'ar' && s.ar ? s.ar : s.en);

/** chat messages, in order, ready to copy one by one */
export const chatMessages = (s: Scenario, lang: Lang): string[] => {
  const b = blockOf(s, lang);
  return [b.ack, ...b.body, b.next, b.close].filter((m): m is string => !!m && m.trim().length > 0);
};

/** full email body (greeting + text + closing + signature) */
export const emailBody = (s: Scenario, lang: Lang): string => {
  const override = lang === 'ar' ? s.emailAr || (s.ar ? undefined : s.emailEn) : s.emailEn;
  if (override) return override;
  const b = blockOf(s, lang);
  const w = EMAIL[lang];
  const parts = [b.ack, ...b.body, b.next].filter(Boolean);
  return [
    w.hello,
    '',
    w.thanks,
    '',
    parts.join('\n\n'),
    '',
    b.emailClose || w.close,
    '',
    w.bye,
    '{{agent_name}}',
    '{{team_name}}',
  ].join('\n');
};

export const emailSubject = (s: Scenario, lang: Lang): string => s.subject?.[lang] || s.subject?.en || '';

export const hasChannel = (s: Scenario, c: Channel) => (s.channels ? s.channels.includes(c) : true);

/** every {{placeholder}} used by a scenario (except the automatic ones) */
export const placeholdersOf = (texts: string[]): string[] => {
  const found = new Set<string>();
  texts.forEach((t) => {
    const re = /\{\{([a-z0-9_]+)\}\}/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(t))) found.add(m[1].toLowerCase());
  });
  ['agent_name', 'team_name'].forEach((k) => found.delete(k));
  return Array.from(found);
};

export const PLACEHOLDER_LABELS: Record<string, string> = {
  reference: 'Reference / RRN',
  amount: 'Amount (with currency)',
  date: 'Date',
  last4: 'Last 4 digits of the card',
  ticket_id: 'Ticket ID',
  reason: 'Reason',
  link: 'Link',
  issue: 'Issue (short)',
  proof: 'Proof needed',
  status: 'Status',
  action: 'Action / next step',
  detail: 'Detail updated',
  transfer_ref: 'Transfer reference',
  internal_id: 'Internal transfer ID',
  details: 'Details',
  actions_taken: 'Actions taken',
  open_point: 'Open point',
  merchant: 'Merchant',
  order_ref: 'Order / payment ID',
  category: 'Category',
  callback_time: 'Call-back time',
  update: 'Meaningful update (what you found)',
  info: 'Information needed',
  finding: 'What you found',
  result: 'What happens after',
  path: 'App path',
  option: 'Option to select',
  store: 'Store name',
};
