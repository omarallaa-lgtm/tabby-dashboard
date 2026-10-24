// ---------------------------------------------------------------------------
// AI helper → Groq (free) or OpenAI (paid)
//
// The browser sends the task ("reply" or "update") and the already-masked text.
// The team rules are added here on the server, and the key never reaches the browser.
//
// Vercel → Project → Settings → Environment Variables (set ONE of the keys):
//   GROQ_API_KEY     free, no card: console.groq.com → API Keys. Default model openai/gpt-oss-120b
//   OPENAI_API_KEY   paid: platform.openai.com → API keys. Default model gpt-5-mini
//   AI_MODEL         (optional)  another model name for the chosen provider
//   AI_RATE_LIMIT    (optional)  requests per minute per user/IP, default 20
// If both keys are set, Groq is used.
// ---------------------------------------------------------------------------
import { rulesFor } from '@/lib/ai/prompt';
import type { AiTask } from '@/lib/ai/prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// keys pasted with spaces / quotes / line breaks fail, so clean them
const clean = (v?: string) => String(v || '').trim().replace(/^["']|["']$/g, '').trim();
const OPENAI_KEY = clean(process.env.OPENAI_API_KEY);
// a Groq key (gsk_…) saved under OPENAI_API_KEY by mistake still goes to Groq
const GROQ = clean(process.env.GROQ_API_KEY) || (OPENAI_KEY.startsWith('gsk_') ? OPENAI_KEY : '');
const PROVIDER = GROQ ? 'Groq' : 'OpenAI';
const KEY = GROQ || OPENAI_KEY;
const BASE = GROQ ? 'https://api.groq.com/openai/v1' : 'https://api.openai.com/v1';
const MODEL = clean(process.env.AI_MODEL) || (GROQ ? 'openai/gpt-oss-120b' : clean(process.env.OPENAI_MODEL) || 'gpt-5-mini');
const PER_MIN = Number(process.env.AI_RATE_LIMIT || 20) || 20;
const MAX_INPUT = 60_000; // characters

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// small in-memory limiter (per server instance) so a stuck button can't burn the budget
const hits = new Map<string, number[]>();
function limited(who: string) {
  const now = Date.now();
  const list = (hits.get(who) || []).filter((t) => now - t < 60_000);
  list.push(now);
  hits.set(who, list);
  if (hits.size > 500) hits.clear();
  return list.length > PER_MIN;
}

// only accept calls made from the dashboard itself
function sameOrigin(req: Request) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!origin || !host) return true; // same-origin fetches from some browsers omit Origin
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

const isReasoningModel = (m: string) => /^(gpt-5|o\d)|gpt-oss/i.test(m);

async function callOpenAI(task: AiTask, user: string, withEffort: boolean, effort: 'low' | 'medium' = 'low') {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 55_000);
  try {
    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: rulesFor(task) },
          { role: 'user', content: user },
        ],
        // Groq's free plan allows ~8,000 tokens a minute, so keep the answer budget small there
        // prompt (~4.8k tokens with the refund rules) + answer must stay under Groq's free 8,000 tokens a minute
        max_completion_tokens: GROQ ? (task === 'update' ? 3300 : effort === 'medium' ? 2800 : 2400) : task === 'update' ? 6000 : 3000,
        ...(withEffort && isReasoningModel(MODEL) ? { reasoning_effort: effort } : {}),
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  return json({ ok: true, configured: !!KEY, provider: KEY ? PROVIDER : null, model: MODEL });
}

export async function POST(req: Request) {
  if (!KEY) return json({ error: 'The built-in AI is not set up yet (add GROQ_API_KEY in Vercel). Use “Copy prompt for ChatGPT” for now.' }, 503);
  if (!sameOrigin(req)) return json({ error: 'Not allowed' }, 403);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Bad request' }, 400);
  }
  const task: AiTask = body?.task === 'update' ? 'update' : body?.task === 'case' ? 'case' : 'reply';
  // replies built on the agent's suggestion / feedback follow instructions better with a little more thinking
  const effort: 'low' | 'medium' = body?.effort === 'medium' ? 'medium' : 'low';
  const user = String(body?.prompt || '').trim();
  const who = String(body?.user || req.headers.get('x-forwarded-for') || 'anon').split(',')[0].trim().toLowerCase();
  if (!user) return json({ error: 'Nothing to send' }, 400);
  if (user.length > MAX_INPUT) return json({ error: 'The text is too long. Please shorten the conversation and try again.' }, 413);
  if (limited(who)) return json({ error: 'Too many requests in a minute. Please wait a moment and try again.' }, 429);

  try {
    let r = await callOpenAI(task, user, true, effort);
    // some models don't accept reasoning_effort: retry once without it
    if (!r.ok && /reasoning_effort/i.test(String(r.data?.error?.message || ''))) r = await callOpenAI(task, user, false);
    if (!r.ok) {
      const msg = String(r.data?.error?.message || `${PROVIDER} error ${r.status}`);
      console.error('AI helper error:', PROVIDER, r.status, msg);
      const hint =
        r.status === 401 ? `The ${PROVIDER} key is not valid. Check the key in Vercel.`
        : r.status === 429
          ? GROQ
            ? 'The free Groq limit was reached for now (per minute or per day). Wait a minute and try again, or use “Copy prompt for ChatGPT”.'
            : 'OpenAI limit or budget reached. Check billing / limits on platform.openai.com, or try again shortly.'
        : r.status === 404 ? `Model “${MODEL}” is not available on this key. Set AI_MODEL in Vercel.`
        : msg;
      return json({ error: hint }, 502);
    }
    const text = String(r.data?.choices?.[0]?.message?.content || '').trim();
    if (!text) return json({ error: 'The AI returned an empty answer. Please try again.' }, 502);
    return json({ text, model: r.data?.model || MODEL, usage: r.data?.usage || null });
  } catch (e: any) {
    const aborted = e?.name === 'AbortError';
    return json({ error: aborted ? 'The AI took too long to answer. Please try again.' : `Could not reach ${PROVIDER}. Please try again.` }, 504);
  }
}
