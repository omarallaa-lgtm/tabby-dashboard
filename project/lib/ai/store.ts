// ---------------------------------------------------------------------------
// AI helper storage (Supabase)
//   ai_examples : replies the team approved ("Save as good example"), used to learn the style
//   ai_updates  : updates the team taught the AI (policy / process / wording changes)
// Only masked text is ever saved here.
// ---------------------------------------------------------------------------
import { supabase } from '@/lib/metrics-context';
import { isMissingTable } from '@/lib/ticket-store';
import type { AiExample, AiUpdate } from '@/lib/ai/prompt';

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
create policy "dashboard access" on ai_updates for all using (true) with check (true);`;

export type StoreStatus = 'loading' | 'ready' | 'no-table' | 'error';

export async function loadAiData(): Promise<{ examples: AiExample[]; updates: AiUpdate[]; status: StoreStatus; message?: string }> {
  try {
    const [ex, up] = await Promise.all([
      supabase.from('ai_examples').select('*').order('created_at', { ascending: false }).limit(300),
      supabase.from('ai_updates').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    const err = ex.error || up.error;
    if (err) return { examples: [], updates: [], status: isMissingTable(err) ? 'no-table' : 'error', message: err.message };
    return { examples: (ex.data || []) as AiExample[], updates: (up.data || []) as AiUpdate[], status: 'ready' };
  } catch (e: any) {
    return { examples: [], updates: [], status: 'error', message: String(e?.message || e) };
  }
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
