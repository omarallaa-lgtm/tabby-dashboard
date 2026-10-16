// Shared helpers that decide whether an email template and a chat macro are about the SAME topic.
// Used by the Email Templates tab and the Chat Macros tab to show "related" items next to each other.

const STOP_WORDS = new Set([
  'general', 'escalation', 'escalations', 'template', 'templates', 'macro', 'macros', 'email', 'emails',
  'chat', 'tabby', 'script', 'scripts', 'the', 'and', 'for', 'with', 'from', 'your', 'our',
]);

// lower-case, remove punctuation, keep English + Arabic letters and numbers
export const normalizeTopic = (value?: string | null): string =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Arabic "the" prefix (ال) is removed so "التحويل" and "تحويل" are the same word
const stripArticle = (t: string) => (t.startsWith('ال') && t.length > 4 ? t.slice(2) : t);

const significantTokens = (value: string): string[] =>
  normalizeTopic(value)
    .split(' ')
    .map(stripArticle)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));

// "Tabby Card Dispute" ~ "Card Dispute"  ✓   "Refund" ~ "Refund delay"  ✓   "Wallet Top Up" ~ "Wallet Balance"  ✗   "General" ~ "General"  ✗ (too generic)
export const isSameTopic = (a?: string | null, b?: string | null): boolean => {
  const na = normalizeTopic(a);
  const nb = normalizeTopic(b);
  if (!na || !nb) return false;

  const ta = significantTokens(na);
  const tb = significantTokens(nb);
  if (!ta.length || !tb.length) return false; // only generic words, do not link

  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) return true;

  // every word of the shorter topic appears in the longer one, or at least two words are shared
  const setB = new Set(tb);
  const shared = ta.filter((t) => setB.has(t)).length;
  const shorter = Math.min(ta.length, tb.length);
  return shared > 0 && (shared === shorter || (shared >= 2 && shared / shorter >= 0.67));
};

export const anyTopicMatch = (
  labelsA: (string | null | undefined)[],
  labelsB: (string | null | undefined)[]
): boolean => labelsA.some((a) => labelsB.some((b) => isSameTopic(a, b)));
