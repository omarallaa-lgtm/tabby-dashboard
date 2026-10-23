// ---------------------------------------------------------------------------
// Slack → Announcements
//
// Slack sends every new message in the updates channel to this address
// (https://<your-site>/api/slack/events). Each message is saved in the Supabase
// "announcements" table, so it appears on the Announcements tab (and as a
// notification) a moment later. Edited messages are updated, deleted ones removed.
//
// Vercel → Project → Settings → Environment Variables:
//   SLACK_SIGNING_SECRET  (required)  Slack app → Basic Information → Signing Secret
//   SLACK_BOT_TOKEN       (recommended) Slack app → OAuth & Permissions → Bot User OAuth Token (xoxb-…)
//                         used to show the author's name and a link back to the message
//   SLACK_CHANNEL_ID      (required)  the channel ID, e.g. C0123ABCD (comma-separate several)
//   SUPABASE_SERVICE_ROLE_KEY (optional) used instead of the public key when set
// ---------------------------------------------------------------------------
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET || '';
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN || '';
const CHANNELS = (process.env.SLACK_CHANNEL_ID || '')
  .split(',')
  .map((c) => c.trim())
  .filter(Boolean);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// ---- security: only accept requests really signed by Slack ----
function verifySlack(raw: string, ts: string | null, sig: string | null) {
  if (!SIGNING_SECRET || !ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 60 * 5) return false; // replay protection
  const mine = 'v0=' + crypto.createHmac('sha256', SIGNING_SECRET).update(`v0:${ts}:${raw}`).digest('hex');
  const a = Buffer.from(mine);
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- Slack Web API helpers (only when a bot token is set) ----
async function slackApi(method: string, params: Record<string, string>) {
  if (!BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://slack.com/api/${method}?${new URLSearchParams(params)}`, {
      headers: { authorization: `Bearer ${BOT_TOKEN}` },
      cache: 'no-store',
    });
    const data = await res.json();
    return data && data.ok ? data : null;
  } catch {
    return null;
  }
}

const userCache = new Map<string, { name: string; email: string }>();
async function slackUser(id?: string) {
  if (!id) return null;
  if (userCache.has(id)) return userCache.get(id)!;
  const data = await slackApi('users.info', { user: id });
  const u = data?.user;
  if (!u) return null;
  const info = {
    name: u.profile?.real_name || u.profile?.display_name || u.real_name || u.name || 'Slack',
    email: String(u.profile?.email || '').toLowerCase(),
  };
  userCache.set(id, info);
  return info;
}

// ---- Slack formatting → readable text ----
async function toPlainText(text: string) {
  let t = String(text || '');
  // user mentions <@U123> / <@U123|name>
  const ids = Array.from(new Set(Array.from(t.matchAll(/<@([A-Z0-9]+)(?:\|[^>]+)?>/g)).map((m) => m[1]))).slice(0, 10);
  const names: Record<string, string> = {};
  await Promise.all(ids.map(async (id) => (names[id] = (await slackUser(id))?.name || 'someone')));
  t = t
    .replace(/<@([A-Z0-9]+)\|([^>]+)>/g, (_, _id, n) => `@${n}`)
    .replace(/<@([A-Z0-9]+)>/g, (_, id) => `@${names[id] || 'someone'}`)
    .replace(/<#[A-Z0-9]+\|([^>]+)>/g, '#$1')
    .replace(/<!(here|channel|everyone)[^>]*>/g, '@$1')
    .replace(/<!subteam\^[A-Z0-9]+\|([^>]+)>/g, '$1')
    .replace(/<((?:https?|mailto):[^|>]+)\|([^>]+)>/g, '$2 ($1)')
    .replace(/<((?:https?|mailto):[^>]+)>/g, '$1')
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,!?:;])/g, '$1$2') // *bold*
    .replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,!?:;])/g, '$1$2') // _italic_
    .replace(/(^|\s)~([^~\n]+)~(?=\s|$|[.,!?:;])/g, '$1$2') // ~strike~
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  return t.trim();
}

const titleFrom = (text: string) => {
  const first = text.split('\n').map((l) => l.trim()).find(Boolean) || '';
  const clean = first.replace(/^[#>*\-•\s]+/, '').trim();
  if (!clean) return 'Update from Slack';
  return clean.length > 90 ? `${clean.slice(0, 88).trimEnd()}…` : clean;
};

const attachmentsNote = (files: any[] | undefined) =>
  Array.isArray(files) && files.length
    ? '\n\n' + files.map((f) => `📎 ${f?.name || f?.title || 'Attachment'} (open in Slack)`).join('\n')
    : '';

// ---------------------------------------------------------------------------
export async function GET() {
  // quick health check for the admin (no secrets shown)
  return json({
    ok: true,
    receiver: 'Slack → Announcements',
    configured: { signingSecret: !!SIGNING_SECRET, botToken: !!BOT_TOKEN, channels: CHANNELS.length, supabaseKey: !!SUPABASE_KEY },
  });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!SIGNING_SECRET) return json({ error: 'SLACK_SIGNING_SECRET is not set in Vercel' }, 500);
  if (!verifySlack(raw, req.headers.get('x-slack-request-timestamp'), req.headers.get('x-slack-signature'))) {
    return json({ error: 'invalid signature' }, 401);
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'bad request' }, 400);
  }

  // Slack checks the address once when you save it in the app settings
  if (body.type === 'url_verification') return json({ challenge: body.challenge });
  if (body.type !== 'event_callback') return json({ ok: true });

  const ev = body.event || {};
  if (ev.type !== 'message') return json({ ok: true });
  if (CHANNELS.length && !CHANNELS.includes(ev.channel)) return json({ ok: true, skipped: 'other channel' });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

  // ---- deleted in Slack → remove from the dashboard ----
  if (ev.subtype === 'message_deleted') {
    const ts = ev.deleted_ts || ev.previous_message?.ts;
    if (ts) {
      const { data } = await supabase.from('announcements').select('id').eq('slack_ts', ts);
      const ids = (data || []).map((r: any) => r.id);
      if (ids.length) {
        await supabase.from('announcement_comments').delete().in('announcement_id', ids);
        await supabase.from('announcements').delete().in('id', ids);
      }
    }
    return json({ ok: true });
  }

  // ---- edited in Slack → update the dashboard copy ----
  if (ev.subtype === 'message_changed') {
    const m = ev.message || {};
    if (!m.ts || (m.thread_ts && m.thread_ts !== m.ts)) return json({ ok: true });
    const text = (await toPlainText(m.text)) + attachmentsNote(m.files);
    await supabase.from('announcements').update({ title: titleFrom(text), content: text || 'Update from Slack' }).eq('slack_ts', m.ts);
    return json({ ok: true });
  }

  // ---- new message ----
  // skip thread replies, joins/leaves, topic changes and other system messages
  const allowed = !ev.subtype || ev.subtype === 'bot_message' || ev.subtype === 'file_share' || ev.subtype === 'thread_broadcast';
  if (!allowed) return json({ ok: true, skipped: ev.subtype });
  if (ev.thread_ts && ev.thread_ts !== ev.ts && ev.subtype !== 'thread_broadcast') return json({ ok: true, skipped: 'thread reply' });

  const [text, author, link] = await Promise.all([
    toPlainText(ev.text || ''),
    ev.user ? slackUser(ev.user) : Promise.resolve(null),
    slackApi('chat.getPermalink', { channel: ev.channel, message_ts: ev.ts }),
  ]);
  const content = (text + attachmentsNote(ev.files)).trim() || 'New update posted in Slack.';
  const authorName = author?.name || ev.username || ev.bot_profile?.name || 'Slack';

  const row = {
    title: titleFrom(content),
    content,
    author_email: author?.email || `${authorName} (Slack)`,
    likes: 0,
    dislikes: 0,
    created_at: new Date(Number(ev.ts) * 1000 || Date.now()).toISOString(),
    source: 'slack',
    slack_ts: ev.ts,
    slack_channel: ev.channel,
    slack_user: authorName,
    slack_permalink: link?.permalink || null,
  };

  // slack_ts is unique: Slack retries the same message if we are slow, so ignore duplicates
  const { error } = await supabase.from('announcements').upsert(row, { onConflict: 'slack_ts', ignoreDuplicates: true });
  if (error) {
    console.error('Slack → announcements insert failed:', error.message);
    // 200 so Slack does not keep retrying a message that cannot be saved; the error is in the Vercel logs
    return json({ ok: false, error: error.message });
  }
  return json({ ok: true });
}
