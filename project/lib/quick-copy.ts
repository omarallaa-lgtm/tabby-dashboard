// ---------------------------------------------------------------------------
// Personal quick-copy buttons (per user)
//   ta : the Quick copy bar in Ticket Assistance
//   ai : the "After sending · close" row in AI Lab
// Each button is a template (by id) or the user's own text.
// Saved in Supabase (user_quick_copy, one row per user) so it follows the user to
// any computer / Citrix session, with a copy in the browser as a backup.
// ---------------------------------------------------------------------------
import { supabase } from '@/lib/metrics-context';
import { isMissingTable } from '@/lib/ticket-store';

export interface QuickItem {
  /** template id, or "own:<random>" for the user's own text */
  id: string;
  label: string;
  /** own text only */
  text?: string;
  textAr?: string;
}

export type QuickSet = 'ta' | 'ai';
export type QuickPrefs = Partial<Record<QuickSet, QuickItem[]>>;

export const QUICK_DEFAULTS: Record<QuickSet, QuickItem[]> = {
  ta: [
    { id: 'gen-greet', label: 'Greeting' },
    { id: 'gen-esc-received', label: 'Escalation received' },
    { id: 'gen-hold', label: 'Hold' },
    { id: 'gen-back', label: 'Back from hold' },
    { id: 'gen-still-there', label: 'Still there?' },
    { id: 'gen-close-anything', label: 'Clarity check' },
    { id: 'gen-close-unresponsive', label: 'No reply – close' },
    { id: 'gen-close-resolved-unresponsive', label: 'Resolved – close' },
    { id: 'gen-close-final', label: 'Final closing' },
  ],
  ai: [
    { id: 'gen-close-anything', label: 'Clarity check' },
    { id: 'gen-still-there', label: 'Still there?' },
    { id: 'gen-close-unresponsive', label: 'No reply – close' },
    { id: 'gen-close-resolved-unresponsive', label: 'Resolved – close' },
    { id: 'gen-close-final', label: 'Final closing' },
  ],
};

export const QUICK_SQL = `-- Personal quick-copy buttons: run once in Supabase → SQL Editor
create table if not exists user_quick_copy (
  user_email text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table user_quick_copy enable row level security;
drop policy if exists "dashboard access" on user_quick_copy;
create policy "dashboard access" on user_quick_copy for all using (true) with check (true);`;

export const isOwn = (q: QuickItem) => q.id.startsWith('own:');
export const newOwnId = () => `own:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const lsKey = (email: string) => `tabby-quick-copy:${email}`;

const readLocal = (email: string): QuickPrefs => {
  try {
    const raw = localStorage.getItem(lsKey(email));
    return raw ? (JSON.parse(raw) as QuickPrefs) : {};
  } catch {
    return {};
  }
};

const writeLocal = (email: string, prefs: QuickPrefs) => {
  try {
    localStorage.setItem(lsKey(email), JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
};

/** the user's buttons, with "synced" = saved in Supabase (false = only in this browser) */
export async function loadQuickPrefs(email: string): Promise<{ prefs: QuickPrefs; synced: boolean; missingTable: boolean }> {
  const local = readLocal(email);
  try {
    const { data, error } = await supabase.from('user_quick_copy').select('data').eq('user_email', email).maybeSingle();
    if (error) return { prefs: local, synced: false, missingTable: isMissingTable(error) };
    const remote = ((data as any)?.data || {}) as QuickPrefs;
    const prefs = { ...local, ...remote };
    writeLocal(email, prefs);
    return { prefs, synced: true, missingTable: false };
  } catch {
    return { prefs: local, synced: false, missingTable: false };
  }
}

export async function saveQuickPrefs(email: string, prefs: QuickPrefs): Promise<{ synced: boolean; missingTable: boolean; error?: string }> {
  writeLocal(email, prefs);
  try {
    const { error } = await supabase.from('user_quick_copy').upsert({ user_email: email, data: prefs, updated_at: new Date().toISOString() });
    if (error) return { synced: false, missingTable: isMissingTable(error), error: error.message };
    return { synced: true, missingTable: false };
  } catch (e: any) {
    return { synced: false, missingTable: false, error: String(e?.message || e) };
  }
}

/** the buttons to show: the user's own list, or the defaults */
export const quickItemsFor = (prefs: QuickPrefs, set: QuickSet) => prefs[set] || QUICK_DEFAULTS[set];
