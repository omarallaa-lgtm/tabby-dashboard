// ---------------------------------------------------------------------------
// Light text matching shared by Ticket Assistance search and the AI Lab
// ---------------------------------------------------------------------------

/** lower-case, strip Arabic diacritics, unify letter forms, drop punctuation */
export const norm = (s: string) =>
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

export const STOP = new Set(
  'the a an i im my me to is are am was dont didnt cant wont isnt doesnt and or of for in on it its this that with you your can could would please hi hello dear team tabby we our be have has not no do did does why how what when there just so but any from at as by will want need still also يا انا انت في من على الى عن ما لا هل هذا هذه تم مع او و ان كان كيف ليش لماذا عندي ابي ابغى اريد تابي مرحبا'.split(' ')
);

/** light English stemming so "refunds", "refunded", "refunding" all match "refund" */
export const stem = (t: string) => {
  if (/^[a-z]+$/.test(t)) return t.length > 5 ? t.replace(/(ing|ed|es|s)$/, '') : t;
  // Arabic: drop the article and possessive endings (المسترد -> مسترد, بطاقتي -> بطاقه)
  let a = t.length > 4 ? t.replace(/^(وال|بال|لل|ال)/, '') : t;
  if (a.length > 3) a = a.replace(/(كم|ها|ي|ك)$/, '');
  return a.length > 3 ? a.replace(/ت$/, 'ه') : a;
};

export const tokensOf = (q: string) =>
  norm(q)
    .split(' ')
    .filter((t) => t.length >= 2 && !STOP.has(t))
    .map(stem);
