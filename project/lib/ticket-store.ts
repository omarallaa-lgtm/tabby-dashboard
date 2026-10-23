// ---------------------------------------------------------------------------
// Saved edits for Ticket Assistance (Supabase)
//
// ticket_templates: one row per template that was added or edited in the dashboard.
//   id      = the template id. Same id as a built-in template -> replaces it.
//   data    = the full template (title, messages, email, topic ...)
//   hidden  = true -> a built-in template is hidden for everyone
// important_links: the Links & emails section.
// ---------------------------------------------------------------------------
import { supabase } from '@/lib/metrics-context';
import type { Scenario } from '@/lib/ticket-library';

export const SETUP_SQL = `-- Ticket Assistance: run once in Supabase → SQL Editor
create table if not exists ticket_templates (
  id text primary key,
  data jsonb not null,
  hidden boolean not null default false,
  updated_by text,
  updated_at timestamptz default now()
);
alter table ticket_templates enable row level security;
drop policy if exists "dashboard access" on ticket_templates;
create policy "dashboard access" on ticket_templates for all using (true) with check (true);

create table if not exists important_links (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Other',
  title text not null,
  kind text not null default 'link',
  value text not null,
  cc text,
  notes text,
  sort_order int default 0,
  created_by text,
  created_at timestamptz default now()
);
alter table important_links enable row level security;
drop policy if exists "dashboard access" on important_links;
create policy "dashboard access" on important_links for all using (true) with check (true);`;

/** saved template: a normal scenario plus where it sits in the topic tree */
export interface SavedTemplate extends Scenario {
  productId?: string;
  topicName?: string;
}

export interface TemplateRow {
  id: string;
  data: SavedTemplate;
  hidden: boolean;
  updated_by?: string | null;
  updated_at?: string | null;
}

export const isMissingTable = (err: any) =>
  !!err && (err.code === '42P01' || err.code === 'PGRST205' || /does not exist|could not find the table/i.test(String(err.message || '')));

export async function loadTemplateRows(): Promise<{ rows: TemplateRow[]; status: 'ready' | 'no-table' | 'error'; message?: string }> {
  try {
    const { data, error } = await supabase.from('ticket_templates').select('*');
    if (error) return { rows: [], status: isMissingTable(error) ? 'no-table' : 'error', message: error.message };
    return { rows: (data || []) as TemplateRow[], status: 'ready' };
  } catch (e: any) {
    return { rows: [], status: 'error', message: String(e?.message || e) };
  }
}

export async function saveTemplateRow(row: TemplateRow, by: string) {
  const { error } = await supabase
    .from('ticket_templates')
    .upsert({ id: row.id, data: row.data, hidden: row.hidden, updated_by: by, updated_at: new Date().toISOString() });
  return error ? error.message : null;
}

export async function deleteTemplateRow(id: string) {
  const { error } = await supabase.from('ticket_templates').delete().eq('id', id);
  return error ? error.message : null;
}
