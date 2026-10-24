// ---------------------------------------------------------------------------
// AI helper storage (Supabase)
//   ai_examples : replies the team approved ("Save as good example"), used to learn the style
//   ai_updates  : updates the team taught the AI (policy / process / wording changes)
//   ai_questions: questions the AI asked about products / processes, and the team's answers
// Approved replies are saved without personal details. Cases taught by the team are
// saved in ai_examples too (template_ids contains 'case').
// ---------------------------------------------------------------------------
import { supabase } from '@/lib/metrics-context';
import { isMissingTable } from '@/lib/ticket-store';
import type { AiExample, AiUpdate, AiQuestion } from '@/lib/ai/prompt';

export const AI_SQL = `-- AI helper: run once in Supabase → SQL Editor
create table if not exists ai_examples (
  id uuid primary key default gen_random_uuid(),
  issue text,
  product text,
  chat text not null,
  reply text not null,
  template_ids text[],
  created_by text,
  created_at timestamptz default now()
);
alter table ai_examples enable row level security;
drop policy if exists "dashboard access" on ai_examples;
create policy "dashboard access" on ai_examples for all using (true) with check (true);

create table if not exists ai_updates (
  id uuid primary key default gen_random_uuid(),
  title text,
  body text not null,
  active boolean not null default true,
  created_by text,
  created_at timestamptz default now()
);
alter table ai_updates enable row level security;
drop policy if exists "dashboard access" on ai_updates;
create policy "dashboard access" on ai_updates for all using (true) with check (true);

create table if not exists ai_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  context text,
  product text,
  answer text,
  status text not null default 'open',
  asked_by text,
  answered_by text,
  created_at timestamptz default now(),
  answered_at timestamptz
);
alter table ai_questions enable row level security;
drop policy if exists "dashboard access" on ai_questions;
create policy "dashboard access" on ai_questions for all using (true) with check (true);`;

export type StoreStatus = 'loading' | 'ready' | 'no-table' | 'error';

export interface AiData {
  examples: AiExample[];
  updates: AiUpdate[];
  questions: AiQuestion[];
  status: StoreStatus;
  /** the questions table was added later: it can be missing while the others exist */
  questionsReady: boolean;
  message?: string;
}

export async function loadAiData(): Promise<AiData> {
  try {
    const [ex, up, qs] = await Promise.all([
      supabase.from('ai_examples').select('*').order('created_at', { ascending: false }).limit(400),
      supabase.from('ai_updates').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('ai_questions').select('*').order('created_at', { ascending: false }).limit(300),
    ]);
    const err = ex.error || up.error;
    if (err) return { examples: [], updates: [], questions: [], questionsReady: false, status: isMissingTable(err) ? 'no-table' : 'error', message: err.message };
    return {
      examples: (ex.data || []) as AiExample[],
      updates: (up.data || []) as AiUpdate[],
      questions: qs.error ? [] : ((qs.data || []) as AiQuestion[]),
      questionsReady: !qs.error,
      status: 'ready',
    };
  } catch (e: any) {
    return { examples: [], updates: [], questions: [], questionsReady: false, status: 'error', message: String(e?.message || e) };
  }
}

export async function saveQuestions(list: string[], extra: { context?: string; product?: string }, by: string) {
  if (!list.length) return null;
  const rows = list.map((question) => ({ question, context: extra.context || null, product: extra.product || null, status: 'open', asked_by: by }));
  const { error } = await supabase.from('ai_questions').insert(rows);
  return error ? error.message : null;
}

export async function answerQuestion(id: string, answer: string, by: string) {
  const { error } = await supabase
    .from('ai_questions')
    .update({ answer, status: answer.trim() ? 'answered' : 'open', answered_by: by, answered_at: new Date().toISOString() })
    .eq('id', id);
  return error ? error.message : null;
}

export async function deleteQuestion(id: string) {
  const { error } = await supabase.from('ai_questions').delete().eq('id', id);
  return error ? error.message : null;
}

export async function saveExample(e: AiExample, by: string) {
  const { error } = await supabase.from('ai_examples').insert([{ ...e, created_by: by }]);
  return error ? error.message : null;
}

export async function deleteExample(id: string) {
  const { error } = await supabase.from('ai_examples').delete().eq('id', id);
  return error ? error.message : null;
}

export async function saveUpdate(u: AiUpdate, by: string) {
  const { error } = await supabase.from('ai_updates').insert([{ title: u.title || null, body: u.body, active: true, created_by: by }]);
  return error ? error.message : null;
}

export async function setUpdateActive(id: string, active: boolean) {
  const { error } = await supabase.from('ai_updates').update({ active }).eq('id', id);
  return error ? error.message : null;
}

export async function deleteUpdate(id: string) {
  const { error } = await supabase.from('ai_updates').delete().eq('id', id);
  return error ? error.message : null;
}

export async function recentAnnouncements(limit = 6): Promise<{ id: string; title: string; content: string; created_at?: string }[]> {
  try {
    const { data } = await supabase.from('announcements').select('id,title,content,created_at').order('created_at', { ascending: false }).limit(limit);
    return (data || []) as any[];
  } catch {
    return [];
  }
}
