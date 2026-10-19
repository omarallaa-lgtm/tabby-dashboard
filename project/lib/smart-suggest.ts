// Smart Suggest: finds the chat macros and email templates that best fit a customer's message.
// It is plain keyword matching (no AI service, no key, nothing leaves the browser).
// It understands English and Arabic, and a small list of bilingual keyword groups (refund = استرجاع ...).

export type SuggestKind = 'chat' | 'email';

export interface SuggestDoc {
  id: string;
  kind: SuggestKind;
  title: string; // card title / template title
  topic: string; // category
  type: 'FL' | 'Escalation';
  en?: string;
  arM?: string;
  arF?: string;
  subject?: string;
}

// one remembered choice: "for this hint, the agent used this reply"
export interface LearnEvent {
  hint: string;
  docId: string;
  topic: string;
}

export interface SuggestHit {
  doc: SuggestDoc;
  learned?: boolean; // true when the agent picked this reply before for a similar hint
  score: number;
  relevance: number; // 0-100, relative to the best hit
  level: 'strong' | 'good' | 'weak'; // how well the words really match
  matched: string[];
}

// ------------------------------------------------------------------ text normalisation
const AR_MARKS = /[\u064B-\u065F\u0670\u0640]/g;

export const normalizeText = (value?: string | null): string => {
  let t = String(value || '').toLowerCase();
  t = t
    .replace(AR_MARKS, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي');
  // spellings that must become one word
  t = t
    .replace(/كي\s*نت|كينت|k\s*-?\s*net|knet/g, ' knet ')
    .replace(/charge\s*-?\s*back/g, ' chargeback ')
    .replace(/top\s*-?\s*up/g, ' topup ')
    .replace(/e\s*-?\s*mail/g, ' email ');
  return t.replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').trim();
};

const EN_STOP = new Set(
  ('a an the and or but if of to in on at for with from by as is are was were be been am i you he she it we they my your our me us ' +
    'this that these those not no do does did have has had can could will would should may might please just so then than there their ' +
    'what when where which who how why about into out up down over under again also very too any some all more most its im ive dont cant ' +
    'tabby hi').split(' ')
);
const AR_STOP = new Set(
  ('في من علي الي عن مع هذا هذه ذلك التي الذي انا انت هو هي لا ما نعم ان اني او ثم لقد قد كان كانت يكون عند لدي لديك هل كيف لماذا متي اين ' +
    'اي كل بعد قبل حتي ولا لم لن بس يا اخي اختي ابي ابغي عندي لو اذا الا انه انها كذا هنا هناك الان وين اللي ايش شو ليش هذي').split(' ')
);

const stemEnglish = (w: string): string => {
  if (!/^[a-z]+$/.test(w) || w.length < 5) return w;
  for (const suf of ['ions', 'ion', 'ings', 'ing', 'ed', 'es', 's', 'e']) {
    if (w.endsWith(suf) && w.length - suf.length >= 3) return w.slice(0, -suf.length);
  }
  return w;
};

const stemArabic = (w: string): string => {
  if (!/[\u0600-\u06ff]/.test(w)) return w;
  let t = w;
  if (t.startsWith('وال') && t.length > 5) t = t.slice(3);
  else if (t.startsWith('بال') && t.length > 5) t = t.slice(3);
  else if (t.startsWith('ال') && t.length > 4) t = t.slice(2);
  // light suffix removal: my / your / our / plural endings (بطاقتي = بطاقة)
  for (const group of [['ها', 'هم', 'هن', 'نا', 'كم', 'ني', 'ون', 'ات', 'ين'], ['ي', 'ك', 'ه', 'ت', 'ا']]) {
    const suf = group.find((x) => t.endsWith(x) && t.length - x.length >= 3);
    if (suf) t = t.slice(0, -suf.length);
  }
  return t;
};

export const tokenize = (value?: string | null): string[] =>
  normalizeText(value)
    .split(' ')
    .filter((w) => w.length > 1 && !EN_STOP.has(w) && !AR_STOP.has(w))
    .map((w) => stemArabic(stemEnglish(w)))
    .filter((w) => w.length > 1);

// ------------------------------------------------------------------ bilingual keyword groups
// words in the same group count as "the same idea" (English <-> Arabic, plus common synonyms)
const ALIAS_WORDS: string[][] = [
  ['refund', 'reimburse', 'return', 'استرجاع', 'استرداد', 'استرد', 'استردي', 'ارجاع', 'مرتجع', 'رجوع'],
  ['deduct', 'extra', 'additional', 'twice', 'double', 'debit', 'خصم', 'خصمت', 'انخصم', 'انسحب', 'اقتطاع', 'اقتطعت', 'زياده', 'زايد', 'مرتين', 'مضاعف'],
  ['fail', 'declined', 'rejected', 'error', 'فشل', 'فشلت', 'مرفوض', 'رفضت', 'خطا', 'ما تمت'],
  ['card', 'visa', 'mastercard', 'بطاقه', 'كارد', 'كارت', 'فيزا'],
  ['call', 'phone', 'speak', 'اتصال', 'اتصل', 'اتصلوا', 'مكالمه', 'كلمني', 'هاتف', 'هاتفيا', 'جوال'],
  ['survey', 'rate', 'rating', 'feedback', 'تقييم', 'استبيان', 'قيم'],
  ['nafath', 'نفاذ'],
  ['wallet', 'محفظه', 'محفظتي'],
  ['transfer', 'withdraw', 'withdrawal', 'bank', 'تحويل', 'سحب', 'بنك', 'حواله', 'حساب'],
  ['chargeback', 'dispute', 'unauthorized', 'fraud', 'scam', 'نزاع', 'اعتراض', 'احتيال', 'نصب', 'غير مصرح'],
  ['thank', 'thanks', 'bye', 'goodbye', 'closure', 'closing', 'شكرا', 'مشكور', 'يعطيك', 'تسلم', 'وداعا'],
  ['hello', 'hey', 'greeting', 'greet', 'morning', 'evening', 'afternoon', 'مرحبا', 'السلام', 'اهلا', 'هلا', 'صباح', 'مساء'],
  ['ticket', 'complaint', 'case', 'escalation', 'status', 'progress', 'update', 'شكوي', 'شكاوي', 'تذكره', 'بلاغ', 'حاله'],
  ['wait', 'delay', 'late', 'تاخير', 'تاخر', 'انتظار', 'متاخر'],
  ['notification', 'push', 'اشعار', 'اشعارات', 'تنبيه'],
  ['clearance', 'letter', 'certificate', 'مخالصه', 'خطاب'],
  ['identity', 'national', 'هويه', 'اقامه'],
  ['fee', 'commission', 'surcharge', 'رسوم', 'عموله'],
  ['receipt', 'proof', 'screenshot', 'ايصال', 'اثبات', 'صوره', 'لقطه'],
  ['money', 'amount', 'funds', 'cash', 'مبلغ', 'فلوس', 'فلوسي', 'مال'],
  ['loan', 'microloan', 'قرض', 'تمويل'],
  ['use', 'used', 'استخدام', 'استخدمت', 'استخدم', 'مستخدم'],
  ['receive', 'arrive', 'arrived', 'وصل', 'يصل', 'وصلت', 'استلام', 'استلمت', 'استلم'],
];

const ALIAS_GROUPS: string[][] = ALIAS_WORDS.map((g) => Array.from(new Set(g.flatMap((w) => tokenize(w)))));

// ------------------------------------------------------------------ index + search
interface IndexedDoc {
  doc: SuggestDoc;
  titleTokens: Set<string>;
  bodyTf: Map<string, number>;
  len: number;
}

export interface SuggestIndex {
  docs: IndexedDoc[];
  df: Map<string, number>;
  avgLen: number;
}

export const buildIndex = (docs: SuggestDoc[]): SuggestIndex => {
  const df = new Map<string, number>();
  let total = 0;
  const indexed: IndexedDoc[] = docs.map((doc) => {
    const titleTokens = new Set(tokenize(`${doc.title} ${doc.topic}`));
    const bodyTokens = tokenize([doc.en, doc.arM, doc.arF, doc.subject].filter(Boolean).join(' '));
    const bodyTf = new Map<string, number>();
    bodyTokens.forEach((t) => bodyTf.set(t, (bodyTf.get(t) || 0) + 1));
    new Set([...Array.from(titleTokens), ...Array.from(bodyTf.keys())]).forEach((t) => df.set(t, (df.get(t) || 0) + 1));
    total += bodyTokens.length;
    return { doc, titleTokens, bodyTf, len: bodyTokens.length };
  });
  return { docs: indexed, df, avgLen: Math.max(1, total / Math.max(1, docs.length)) };
};

export const isArabicText = (value?: string | null): boolean => {
  const t = String(value || '').replace(/\s/g, '');
  if (!t) return false;
  return (t.match(/[\u0600-\u06ff]/g) || []).length / t.length > 0.4;
};

export const search = (index: SuggestIndex, query: string, limit = 6, learned: LearnEvent[] = []): SuggestHit[] => {
  const direct = Array.from(new Set(tokenize(query)));
  if (direct.length === 0 || index.docs.length === 0) return [];

  // query words (weight 1) + words from the same keyword group (weight 0.7)
  const weights = new Map<string, number>();
  direct.forEach((t) => weights.set(t, 1));
  ALIAS_GROUPS.forEach((group) => {
    if (direct.some((t) => group.includes(t))) group.forEach((t) => !weights.has(t) && weights.set(t, 0.7));
  });

  const N = index.docs.length;
  const idf = (t: string) => {
    const n = index.df.get(t) || 0;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  };

  let maxPossible = 0;
  direct.forEach((t) => (maxPossible += idf(t) * (3 + 2.4)));
  maxPossible = Math.max(maxPossible, 0.0001);

  // earlier choices for similar hints give a small boost (the reply itself, and a smaller one for its topic)
  const boostFor = new Map<string, number>();
  const querySet = new Set(direct);
  learned.forEach((ev) => {
    const evTokens = new Set(tokenize(ev.hint));
    if (!evTokens.size) return;
    let inter = 0;
    querySet.forEach((t) => evTokens.has(t) && inter++);
    const sim = inter / Math.min(querySet.size, evTokens.size);
    if (inter < 1 || sim < 0.5) return;
    boostFor.set(ev.docId, (boostFor.get(ev.docId) || 0) + sim);
    const fam = 'fam:' + normalizeText(topicFamily(ev.topic));
    boostFor.set(fam, (boostFor.get(fam) || 0) + sim * 0.5);
  });

  const hits: SuggestHit[] = [];
  index.docs.forEach((d) => {
    let score = 0;
    const matched = new Set<string>();
    weights.forEach((w, t) => {
      const i = idf(t);
      let hit = false;
      if (d.titleTokens.has(t)) {
        score += 3 * w * i;
        hit = true;
      }
      const tf = d.bodyTf.get(t) || 0;
      if (tf > 0) {
        score += w * i * ((tf * 2.4) / (tf + 1.4 * (0.5 + 0.5 * (d.len / index.avgLen))));
        hit = true;
      }
      if (hit && direct.includes(t)) matched.add(t);
    });
    const idBoost = boostFor.get(d.doc.id) || 0;
    const famBoost = boostFor.get('fam:' + normalizeText(topicFamily(d.doc.topic || d.doc.title))) || 0;
    const boost = Math.min(1, idBoost) + Math.min(0.5, famBoost); // capped separately: the chosen reply always stays ahead of its topic siblings
    if (score <= 0 && boost <= 0) return;
    const coverage = matched.size / direct.length;
    const raw = score * (0.6 + 0.8 * coverage);
    hits.push({ doc: d.doc, score: raw + maxPossible * 0.22 * boost, raw, learned: idBoost > 0, relevance: 0, level: 'weak', matched: Array.from(matched) } as SuggestHit & { raw: number });
  });

  hits.sort((a, b) => b.score - a.score);
  const top = hits[0]?.score || 1;
  // what is worth showing depends on the words only, so past choices never hide the other options
  const topRaw = Math.max(0.0001, ...hits.map((h) => (h as SuggestHit & { raw: number }).raw ?? h.score));
  return hits
    .map((h) => {
      const ratio = ((h as SuggestHit & { raw: number }).raw ?? h.score) / maxPossible; // strength is judged on the words only, not on past choices
      return { ...h, relevance: Math.round((h.score / top) * 100), level: ratio >= 0.3 ? 'strong' : ratio >= 0.14 ? 'good' : 'weak' } as SuggestHit;
    })
    .filter((h, i) => i === 0 || ((h as SuggestHit & { raw: number }).raw ?? h.score) / topRaw >= 0.35)
    .slice(0, limit);
};

// ------------------------------------------------------------------ group by topic
// "KNET - Understand the inconvenience", "KNET Extra Deduction 3 - ..." and the email category "KNET"
// all belong to one topic family, so one topic takes one slot instead of filling the whole list.
export const topicFamily = (topic: string): string =>
  String(topic || '')
    .split(' - ')[0]
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s+\d+(\.\d+)?$/, '')
    .replace(/\s+/g, ' ')
    .trim();

export interface SuggestGroup {
  topic: string;
  best: SuggestHit; // strongest member by score (used for the strength label)
  score: number; // score of the strongest member, used to order the groups
  hits: SuggestHit[]; // members: replies you picked before come first, then strongest first
  chatCount: number;
  emailCount: number;
}

export const groupByTopic = (hits: SuggestHit[], maxGroups = 3, perGroup = 3): SuggestGroup[] => {
  const map = new Map<string, SuggestHit[]>();
  hits.forEach((h) => {
    const key = normalizeText(topicFamily(h.doc.topic || h.doc.title)) || h.doc.id;
    map.set(key, [...(map.get(key) || []), h]);
  });
  return Array.from(map.values())
    .map((members) => {
      const byScore = [...members].sort((a, b) => b.score - a.score);
      const ordered = [...members].sort((a, b) => Number(!!b.learned) - Number(!!a.learned) || b.score - a.score);
      return {
        topic: topicFamily(byScore[0].doc.topic || byScore[0].doc.title),
        best: byScore[0],
        score: byScore[0].score,
        hits: ordered.slice(0, perGroup),
        chatCount: members.filter((m) => m.doc.kind === 'chat').length,
        emailCount: members.filter((m) => m.doc.kind === 'email').length,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxGroups);
};

// remove things that should never be stored: e-mail addresses and long numbers (phones, IDs, card numbers)
export const redactHint = (value: string): string =>
  String(value || '')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .replace(/\d[\d\s-]{5,}\d/g, '[number]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300);
