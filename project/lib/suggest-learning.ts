import { supabase } from '@/lib/metrics-context';
import { redactHint } from '@/lib/smart-suggest';
import type { LearnEvent } from '@/lib/smart-suggest';

// Remembers which reply an agent used for which hint, so Smart Suggest can rank it higher next time.
// No AI is involved: it only stores (hint -> reply) pairs. Customer details are removed from the hint first.
//
// Shared with the whole team when this table exists in Supabase, otherwise kept in this browser only:
export const SUGGEST_FEEDBACK_SQL =
  'create table if not exists suggest_feedback (' +
  'id uuid primary key default gen_random_uuid(), ' +
  'hint text not null, doc_id text not null, doc_kind text, doc_topic text, language text, user_email text, ' +
  'created_at timestamptz default now());';


const LOCAL_KEY = 'tabby-suggest-learning';
const LOCAL_CAP = 300;

const readLocal = (): LearnEvent[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((e) => e && e.hint && e.docId) : [];
  } catch {
    return [];
  }
};

const writeLocal = (events: LearnEvent[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(events.slice(-LOCAL_CAP)));
  } catch {
    // storage unavailable: learning still works for this session
  }
};

export async function loadLearning(): Promise<{ events: LearnEvent[]; shared: boolean }> {
  const local = readLocal();
  try {
    const { data, error } = await supabase
      .from('suggest_feedback')
      .select('hint, doc_id, doc_topic')
      .order('created_at', { ascending: false })
      .limit(600);
    if (!error && Array.isArray(data)) {
      const remote: LearnEvent[] = data.map((r: any) => ({ hint: String(r.hint || ''), docId: String(r.doc_id || ''), topic: String(r.doc_topic || '') }));
      const seen = new Set(remote.map((e) => `${e.docId}|${e.hint}`));
      return { events: [...remote, ...local.filter((e) => !seen.has(`${e.docId}|${e.hint}`))], shared: true };
    }
  } catch {
    // table not created yet
  }
  return { events: local, shared: false };
}

export async function recordChoice(choice: {
  hint: string;
  docId: string;
  topic: string;
  kind: string;
  language: string;
  userEmail?: string;
}): Promise<{ event: LearnEvent | null; shared: boolean }> {
  const hint = redactHint(choice.hint);
  if (!hint) return { event: null, shared: false };
  const event: LearnEvent = { hint, docId: choice.docId, topic: choice.topic };

  const local = readLocal();
  const last = local[local.length - 1];
  if (!(last && last.hint === hint && last.docId === choice.docId)) writeLocal([...local, event]);

  try {
    const { error } = await supabase.from('suggest_feedback').insert([
      {
        hint,
        doc_id: choice.docId,
        doc_kind: choice.kind,
        doc_topic: choice.topic,
        language: choice.language,
        user_email: choice.userEmail || null,
      },
    ]);
    return { event, shared: !error };
  } catch {
    return { event, shared: false };
  }
}
