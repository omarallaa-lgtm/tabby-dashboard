'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell, BellRing, CheckCircle2, XCircle, MessageSquarePlus, BarChart3, Megaphone, X, Volume2, VolumeX, CheckCheck, RefreshCw, Send,
} from 'lucide-react';
import { supabase } from '@/lib/metrics-context';

// ---------------------------------------------------------------------------
// Notification Center
//  - checks Supabase every POLL_MS (and instantly on realtime events when enabled)
//  - in-app pop-up (toast) + Windows / browser pop-up when the dashboard tab is in the background
//  - bell with unread count, list of the latest notifications, "(2)" in the tab title + red dot on the tab icon
// What creates a notification:
//  - Agent: own request approved / rejected (type, ticket, reviewer name and role, comment)
//  - Team Leader / Admin: a request raised by someone else (name, type, ticket, details)
//  - Everyone: new metrics upload (date, who uploaded, number of agents) -> data refreshes automatically
//  - Everyone: new announcement
// ---------------------------------------------------------------------------

const POLL_MS = 20000;
const MAX_ITEMS = 40;
const TOAST_MS = 9000;
const PREFS_KEY = 'tabby-notify-prefs';
const ASK_KEY = 'tabby-notify-asked';

type Kind = 'request-new' | 'request-approved' | 'request-rejected' | 'request-updated' | 'metrics' | 'announcement';

interface NotifItem {
  id: string;
  kind: Kind;
  title: string;
  body: string;
  at: number;
  read: boolean;
  tab?: string;
}

interface Known {
  req: Record<string, string>; // request id -> last seen status
  up: string[]; // upload keys
  ann: string[]; // announcement ids
}

interface Stored {
  v: 1;
  known: Known | null; // null = first run on this browser: learn silently, notify nothing
  items: NotifItem[];
}

const KIND_STYLE: Record<Kind, { Icon: any; color: string }> = {
  'request-new': { Icon: MessageSquarePlus, color: '#38bdf8' },
  'request-approved': { Icon: CheckCircle2, color: '#10b981' },
  'request-rejected': { Icon: XCircle, color: '#ef4444' },
  'request-updated': { Icon: RefreshCw, color: '#f59e0b' },
  metrics: { Icon: BarChart3, color: '#a78bfa' },
  announcement: { Icon: Megaphone, color: '#f59e0b' },
};

const storeKey = (email: string) => `tabby-notify:${email}`;

const loadStored = (email: string): Stored => {
  try {
    const raw = localStorage.getItem(storeKey(email));
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1) return { v: 1, known: s.known ?? null, items: Array.isArray(s.items) ? s.items : [] };
    }
  } catch {}
  return { v: 1, known: null, items: [] };
};

const saveStored = (email: string, s: Stored) => {
  try {
    localStorage.setItem(storeKey(email), JSON.stringify({ ...s, items: s.items.slice(0, MAX_ITEMS) }));
  } catch {}
};

// "omar.allaa@tabby.ai" -> "Omar Allaa"
const prettyName = (email: string) =>
  String(email || '')
    .split('@')[0]
    .split(/[._-]+/)
    .filter((p) => p && !/^\d+$/.test(p))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ') || String(email || 'Someone');

const timeAgo = (t: number) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d > 1 ? 's' : ''} ago`;
};

const fmtDate = (p: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(p));
  if (!m) return String(p);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const clip = (t: string, n = 140) => {
  const s = String(t || '').replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
};

const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window;

export function NotificationCenter({
  currentUser,
  onNavigate,
  onMetricsUpdated,
  citrixMode,
}: {
  currentUser: any;
  onNavigate: (tab: string) => void;
  onMetricsUpdated?: () => void;
  citrixMode?: boolean;
}) {
  const email = String(currentUser?.user_email || '').trim().toLowerCase();
  const isLead = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const [items, setItems] = useState<NotifItem[]>([]);
  const [toasts, setToasts] = useState<(NotifItem & { left: number })[]>([]);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<string>('unsupported');
  const [sound, setSound] = useState(true);
  const [askBanner, setAskBanner] = useState(false);
  const [testState, setTestState] = useState<'idle' | 'waiting' | 'sent'>('idle');
  const [, setTick] = useState(0); // re-render "x min ago"

  const storedRef = useRef<Stored>({ v: 1, known: null, items: [] });
  const profilesRef = useRef<{ at: number; map: Record<string, { name: string; role: string }> }>({ at: 0, map: {} });
  const busyRef = useRef(false);
  const audioRef = useRef<AudioContext | null>(null);
  const navRef = useRef(onNavigate);
  const metricsRef = useRef(onMetricsUpdated);
  const soundRef = useRef(sound);
  const bellRef = useRef<HTMLButtonElement>(null);
  const baseTitleRef = useRef('');
  const swRef = useRef<ServiceWorkerRegistration | null>(null);
  const flashRef = useRef<{ timer: any; text: string }>({ timer: null, text: '' });
  const unreadRef = useRef(0);
  navRef.current = onNavigate;
  metricsRef.current = onMetricsUpdated;
  soundRef.current = sound;

  const unread = items.filter((i) => !i.read).length;
  unreadRef.current = unread;

  const baseTitle = () => baseTitleRef.current || document.title.replace(/^(\(\d+\+?\)|🔔)\s*/, '');
  const unreadTitle = () => {
    const u = unreadRef.current;
    return u > 0 ? `(${u > 9 ? '9+' : u}) ${baseTitle()}` : baseTitle();
  };

  // Flash the tab title while the dashboard is in the background.
  // This works even when Windows / Citrix hides browser pop-ups.
  const stopFlash = () => {
    if (flashRef.current.timer) clearInterval(flashRef.current.timer);
    flashRef.current.timer = null;
    if (typeof document !== 'undefined') document.title = unreadTitle();
  };
  const startFlash = (text: string) => {
    if (!document.hidden && document.hasFocus()) return;
    flashRef.current.text = text;
    if (flashRef.current.timer) return;
    let on = false;
    flashRef.current.timer = setInterval(() => {
      if (!document.hidden && document.hasFocus()) return stopFlash();
      on = !on;
      document.title = on ? `🔔 ${clip(flashRef.current.text, 40)}` : unreadTitle();
    }, 1200);
  };

  // ---------- setup ----------
  useEffect(() => {
    setMounted(true);
    if (notifySupported()) setPermission(Notification.permission);
    try {
      const prefs = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
      if (typeof prefs.sound === 'boolean') setSound(prefs.sound);
      if (notifySupported() && Notification.permission === 'default' && !localStorage.getItem(ASK_KEY)) setAskBanner(true);
    } catch {}
    baseTitleRef.current = document.title.replace(/^\(\d+\+?\)\s*/, '');
    const id = setInterval(() => setTick((t) => t + 1), 60000);

    // unlock sound on the first click (browsers block audio until the user interacts)
    const unlock = () => {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (Ctx && !audioRef.current) audioRef.current = new Ctx();
        audioRef.current?.resume();
      } catch {}
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    // Desktop pop-ups go through a small service worker when possible (more reliable on Windows / Citrix)
    const onSwMessage = (e: MessageEvent) => {
      const d = e.data || {};
      if (d.type !== 'tabby-notification-click') return;
      const item = storedRef.current.items.find((i) => i.id === d.id);
      if (item) openItem(item);
      else if (d.tab) navRef.current(d.tab);
    };
    try {
      if ('serviceWorker' in navigator && window.isSecureContext) {
        navigator.serviceWorker
          .register('/notify-sw.js')
          .then((reg) => (swRef.current = reg))
          .catch(() => {});
        navigator.serviceWorker.addEventListener('message', onSwMessage);
      }
    } catch {}

    const onBack = () => {
      if (!document.hidden) stopFlash();
    };
    document.addEventListener('visibilitychange', onBack);
    window.addEventListener('focus', onBack);
    return () => {
      clearInterval(id);
      stopFlash();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', onBack);
      window.removeEventListener('focus', onBack);
      try {
        navigator.serviceWorker?.removeEventListener('message', onSwMessage);
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- unread count in the tab title + red dot on the tab icon ----------
  useEffect(() => {
    if (!mounted) return;
    if (!flashRef.current.timer) document.title = unreadTitle();
    document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((l) => {
      if (!l.dataset.orig) {
        l.dataset.orig = l.href;
        l.dataset.origType = l.type || '';
      }
      if (unread > 0) {
        l.href = '/favicon-alert.png';
        l.type = 'image/png';
      } else {
        l.href = l.dataset.orig;
        l.type = l.dataset.origType || '';
      }
    });
  }, [unread, mounted]);

  useEffect(
    () => () => {
      // restore on logout / unmount
      if (baseTitleRef.current) document.title = baseTitleRef.current;
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((l) => {
        if (l.dataset.orig) {
          l.href = l.dataset.orig;
          l.type = l.dataset.origType || '';
        }
      });
    },
    []
  );

  // ---------- toast timers (only count down while the tab is visible) ----------
  useEffect(() => {
    if (!toasts.length) return;
    const id = setInterval(() => {
      if (document.hidden) return;
      setToasts((ts) => ts.map((t) => ({ ...t, left: t.left - 1000 })).filter((t) => t.left > 0));
    }, 1000);
    return () => clearInterval(id);
  }, [toasts.length]);

  const persist = (next: NotifItem[]) => {
    storedRef.current = { ...storedRef.current, items: next.slice(0, MAX_ITEMS) };
    saveStored(email, storedRef.current);
    setItems(storedRef.current.items);
  };

  const chime = () => {
    if (!soundRef.current) return;
    try {
      const ctx = audioRef.current;
      if (!ctx || ctx.state !== 'running') return;
      const t0 = ctx.currentTime;
      [
        [880, 0],
        [1174.7, 0.12],
      ].forEach(([f, d]) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, t0 + d);
        g.gain.linearRampToValueAtTime(0.08, t0 + d + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.35);
        o.connect(g).connect(ctx.destination);
        o.start(t0 + d);
        o.stop(t0 + d + 0.4);
      });
    } catch {}
  };

  const openItem = (n: NotifItem) => {
    persist(storedRef.current.items.map((i) => (i.id === n.id ? { ...i, read: true } : i)));
    setToasts((ts) => ts.filter((t) => t.id !== n.id));
    setOpen(false);
    if (n.tab) navRef.current(n.tab);
  };

  const systemPopup = (n: NotifItem, count: number) => {
    if (!notifySupported() || Notification.permission !== 'granted') return;
    const title = count > 1 ? `${count} new updates · Tabby Dashboard` : n.title;
    const options = {
      body: count > 1 ? `${n.title}\n${n.body}` : n.body,
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      // a new tag every time, so a new pop-up always shows instead of silently replacing the last one
      tag: `${n.id}-${count}`,
      requireInteraction: true, // stays on screen until you click or close it
      data: { id: n.id, tab: n.tab },
    } as NotificationOptions;
    const fallback = () => {
      try {
        const sn = new Notification(title, options);
        sn.onclick = () => {
          window.focus();
          openItem(n);
          sn.close();
        };
      } catch {}
    };
    const reg = swRef.current;
    if (reg && reg.active) reg.showNotification(title, options).catch(fallback);
    else fallback();
  };

  const deliver = (fresh: NotifItem[]) => {
    if (!fresh.length) return;
    persist([...fresh, ...storedRef.current.items]);
    setToasts((ts) => [...fresh.slice(0, 3).map((n) => ({ ...n, left: TOAST_MS })), ...ts].slice(0, 4));
    if (document.hidden || !document.hasFocus()) {
      systemPopup(fresh[0], fresh.length);
      startFlash(fresh.length > 1 ? `${fresh.length} new updates` : fresh[0].title);
    }
    chime();
  };

  // Test: fires in 5 seconds so you can switch to another tab and check what you see
  const sendTest = () => {
    setTestState('waiting');
    setTimeout(() => {
      const n: NotifItem = {
        id: `test-${Date.now()}`,
        kind: 'announcement',
        title: 'Test notification',
        body: 'If you can see this pop-up, desktop notifications are working.',
        at: Date.now(),
        read: true,
      };
      setToasts((ts) => [{ ...n, left: TOAST_MS }, ...ts].slice(0, 4));
      systemPopup(n, 1);
      startFlash('Test notification');
      chime();
      setTestState('sent');
    }, 5000);
  };

  // ---------- names of people ----------
  const loadProfiles = async () => {
    if (Date.now() - profilesRef.current.at < 10 * 60 * 1000) return profilesRef.current.map;
    try {
      const { data } = await supabase.from('user_profiles').select('user_email, username, role');
      const map: Record<string, { name: string; role: string }> = {};
      (data || []).forEach((u: any) => {
        const e = String(u.user_email || '').toLowerCase();
        const raw = String(u.username || '').trim();
        map[e] = { name: raw && !raw.includes('@') ? prettyName(raw) : prettyName(e), role: u.role || '' };
      });
      profilesRef.current = { at: Date.now(), map };
    } catch {}
    return profilesRef.current.map;
  };
  const nameOf = (e: string) => profilesRef.current.map[String(e || '').toLowerCase()]?.name || prettyName(e);
  const roleOf = (e: string) => profilesRef.current.map[String(e || '').toLowerCase()]?.role || '';

  // ---------- one check ----------
  const poll = async () => {
    if (!email || busyRef.current) return;
    busyRef.current = true;
    try {
      // another dashboard tab may have recorded these already
      const latest = loadStored(email);
      storedRef.current = latest;
      const firstRun = latest.known === null;
      const known: Known = latest.known ?? { req: {}, up: [], ann: [] };
      const next: Known = { req: { ...known.req }, up: [...known.up], ann: [...known.ann] };
      const fresh: NotifItem[] = [];

      await loadProfiles();

      // --- requests ---
      const reqLists: any[][] = [];
      const own = await supabase
        .from('requests')
        .select('*')
        .or(`user_email.ilike.${email},agent_email.ilike.${email}`)
        .order('created_at', { ascending: false })
        .limit(100);
      if (!own.error) reqLists.push(own.data || []);
      if (isLead) {
        const queue = await supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(60);
        if (!queue.error) reqLists.push(queue.data || []);
      }
      const seen = new Set<string>();
      reqLists.flat().forEach((r: any) => {
        const id = String(r.id ?? r.request_id ?? '');
        if (!id || seen.has(id)) return;
        seen.add(id);
        const status = String(r.status || 'Pending');
        const prev = known.req[id];
        const requester = String(r.agent_email || r.user_email || '').toLowerCase();
        const mine = requester === email;
        const type = r.request_type || 'Request';
        const ticket = r.ticket_id && r.ticket_id !== 'N/A' ? r.ticket_id : '';
        next.req[id] = status;
        if (firstRun) return;

        if (prev === undefined && !mine && isLead) {
          fresh.push({
            id: `req-new-${id}-${Date.now()}`,
            kind: 'request-new',
            title: `${nameOf(requester)} raised ${/^[aeiou]/i.test(type) ? 'an' : 'a'} ${type} request`,
            body: [ticket ? `Ticket ${ticket}` : '', clip(r.details)].filter(Boolean).join(' · ') || 'Open Requests to review it.',
            at: Date.now(),
            read: false,
            tab: 'requests',
          });
        } else if (prev !== undefined && prev !== status && mine && status !== 'Pending') {
          const reviewer = r.reviewed_by ? nameOf(r.reviewed_by) : 'your Team Leader';
          const role = r.reviewed_by ? roleOf(r.reviewed_by) : '';
          const comment = String(r.leadership_comment || '').trim();
          const isDefault = /^(approved|declined) by team leader$/i.test(comment);
          const verb = status === 'Approved' ? 'approved' : status === 'Rejected' ? 'rejected' : `updated to ${status}`;
          fresh.push({
            id: `req-${status}-${id}-${Date.now()}`,
            kind: status === 'Approved' ? 'request-approved' : status === 'Rejected' ? 'request-rejected' : 'request-updated',
            title: `Your ${type} request was ${verb}`,
            body: [`By ${reviewer}${role ? ` (${role})` : ''}`, ticket ? `Ticket ${ticket}` : '', comment && !isDefault ? `“${clip(comment, 100)}”` : '']
              .filter(Boolean)
              .join(' · '),
            at: Date.now(),
            read: false,
            tab: 'requests',
          });
        }
      });

      // --- metrics uploads ---
      const ups = await supabase.from('upload_history').select('*').order('created_at', { ascending: false }).limit(15);
      let metricsChanged = false;
      if (!ups.error) {
        const keys: string[] = [];
        (ups.data || []).forEach((u: any) => {
          const key = [u.period_id, u.created_at, u.records_count, JSON.stringify(u.files_uploaded || '')].join('|');
          keys.push(key);
          if (firstRun || known.up.includes(key)) return;
          metricsChanged = true;
          const by = String(u.uploaded_by || '').toLowerCase();
          if (by === email) return; // you uploaded it yourself
          fresh.push({
            id: `up-${key}`,
            kind: 'metrics',
            title: 'Metrics updated',
            body: `New data for ${fmtDate(u.period_id)}${by ? ` uploaded by ${nameOf(by)}` : ''}${
              u.records_count ? ` · ${u.records_count} agents` : ''
            }. Your dashboard numbers are refreshed.`,
            at: Date.now(),
            read: false,
            tab: 'my-performance',
          });
        });
        next.up = keys;
      }

      // --- announcements ---
      const anns = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(15);
      if (!anns.error) {
        const ids: string[] = [];
        (anns.data || []).forEach((a: any) => {
          const id = String(a.id ?? a.created_at ?? '');
          if (!id) return;
          ids.push(id);
          if (firstRun || known.ann.includes(id)) return;
          if (String(a.author_email || '').toLowerCase() === email) return;
          fresh.push({
            id: `ann-${id}`,
            kind: 'announcement',
            title: `New announcement: ${clip(a.title, 70)}`,
            body: `${a.author_email ? `By ${nameOf(a.author_email)} · ` : ''}${clip(a.content, 110)}`,
            at: Date.now(),
            read: false,
            tab: 'announcements',
          });
        });
        next.ann = ids;
      }

      storedRef.current = { ...storedRef.current, known: next };
      saveStored(email, storedRef.current);
      setItems(storedRef.current.items);
      if (fresh.length) deliver(fresh.slice(0, 10));
      if (metricsChanged && metricsRef.current) metricsRef.current();
    } catch (e) {
      console.error('Notification check failed:', e);
    } finally {
      busyRef.current = false;
    }
  };

  // ---------- start checking (polling + realtime when it is enabled in Supabase) ----------
  useEffect(() => {
    if (!email) return;
    storedRef.current = loadStored(email);
    setItems(storedRef.current.items);
    poll();
    const id = setInterval(poll, POLL_MS);
    let debounce: any = null;
    const soon = () => {
      clearTimeout(debounce);
      debounce = setTimeout(poll, 1500);
    };
    const channel = supabase
      .channel(`notify-${email}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, soon)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upload_history' }, soon)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'announcements' }, soon)
      .subscribe();
    const onVisible = () => !document.hidden && poll();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      clearTimeout(debounce);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, isLead]);

  // ---------- actions ----------
  const askPermission = async () => {
    try {
      localStorage.setItem(ASK_KEY, '1');
    } catch {}
    setAskBanner(false);
    if (!notifySupported()) return;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      if (res === 'granted') {
        new Notification('Desktop pop-ups are on', {
          body: 'You will see Tabby Dashboard updates here while you work in other tabs.',
          icon: '/notification-icon.png',
          tag: 'tabby-enabled',
        } as NotificationOptions);
      }
    } catch {}
  };

  const dismissAsk = () => {
    try {
      localStorage.setItem(ASK_KEY, '1');
    } catch {}
    setAskBanner(false);
  };

  const toggleSound = () => {
    const nextSound = !sound;
    setSound(nextSound);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ sound: nextSound }));
    } catch {}
  };

  const markAllRead = () => persist(storedRef.current.items.map((i) => ({ ...i, read: true })));
  const clearAll = () => persist([]);

  // ---------- UI ----------
  const panelPos = (() => {
    if (!open || !bellRef.current) return { top: 64, right: 16 };
    const r = bellRef.current.getBoundingClientRect();
    return { top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right - 8) };
  })();

  const row = (n: NotifItem, compact?: boolean) => {
    const { Icon, color } = KIND_STYLE[n.kind] || KIND_STYLE.metrics;
    return (
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center" style={{ background: `${color}22`, color }}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-bold text-slate-100 leading-snug">{n.title}</div>
          {n.body && <div className={`text-[11.5px] text-slate-400 mt-0.5 leading-snug ${compact ? 'line-clamp-2' : ''}`}>{n.body}</div>}
          <div className="text-[10.5px] text-slate-500 mt-1">{timeAgo(n.at)}</div>
        </div>
      </div>
    );
  };

  // colours are inline styles on purpose: globals.css restyles slate background classes in dark mode
  const surface = { background: 'rgba(11, 18, 32, 0.97)', borderColor: 'rgba(255,255,255,0.12)' };

  return (
    <>
      <button
        ref={bellRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        title="Notifications"
        className="relative h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
      >
        {unread > 0 ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
        {unread > 0 && (
          <span
            className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center ${
              citrixMode ? '' : 'animate-pulse'
            }`}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {mounted &&
        createPortal(
          <>
            {/* dropdown panel */}
            {open && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} />
                <div
                  className="fixed z-[91] w-[min(380px,calc(100vw-16px))] rounded-2xl border shadow-2xl text-slate-100 overflow-hidden notif-in"
                  style={{ ...surface, top: panelPos.top, right: panelPos.right }}
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: surface.borderColor }}>
                    <div className="font-bold text-sm flex items-center gap-2">
                      <Bell className="h-4 w-4 text-emerald-400" /> Notifications
                      {unread > 0 && <span className="text-[10px] font-black bg-red-500 text-white rounded-full px-1.5 py-0.5">{unread} new</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={toggleSound}
                        title={sound ? 'Sound on' : 'Sound off'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-white/5"
                      >
                        {sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={markAllRead}
                        title="Mark all as read"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-white/5"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => setOpen(false)} title="Close" className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {permission !== 'unsupported' && permission !== 'granted' && (
                    <div className="px-4 py-2.5 text-[11.5px] border-b bg-emerald-500/10" style={{ borderColor: surface.borderColor }}>
                      {permission === 'denied' ? (
                        <span className="text-amber-300">
                          Desktop pop-ups are blocked for this site. Click the lock icon next to the web address → Notifications → Allow.
                        </span>
                      ) : (
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-300">Get pop-ups while you work in other tabs</span>
                          <button
                            type="button"
                            onClick={askPermission}
                            className="shrink-0 rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-emerald-950 hover:bg-emerald-400"
                          >
                            Turn on
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="px-4 py-2.5 border-b text-[11.5px] space-y-1.5" style={{ borderColor: surface.borderColor }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-400">
                        Desktop pop-ups:{' '}
                        <b className={permission === 'granted' ? 'text-emerald-300' : 'text-amber-300'}>
                          {permission === 'granted' ? 'allowed' : permission === 'denied' ? 'blocked' : permission === 'unsupported' ? 'not supported' : 'not turned on'}
                        </b>
                      </span>
                      <button
                        type="button"
                        onClick={sendTest}
                        disabled={testState === 'waiting'}
                        className="shrink-0 rounded-lg border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50 flex items-center gap-1"
                      >
                        <Send className="h-3 w-3" /> {testState === 'waiting' ? 'Switch tab now…' : 'Send test'}
                      </button>
                    </div>
                    {testState === 'waiting' && <div className="text-slate-400">A test arrives in 5 seconds – switch to another tab to check.</div>}
                    {testState === 'sent' && (
                      <div className="text-slate-400 leading-snug">
                        No Windows pop-up? On Citrix, Windows often hides browser pop-ups. You still get the flashing{' '}
                        <b className="text-slate-200">🔔 tab title</b>, the red dot on the tab icon and a sound. To get the pop-up, open{' '}
                        <b className="text-slate-200">chrome://flags/#enable-system-notifications</b> (Edge: <b className="text-slate-200">edge://flags</b>), set it to{' '}
                        <b className="text-slate-200">Disabled</b> and restart the browser, or ask IT to turn on notifications for the browser and turn off Focus assist.
                      </div>
                    )}
                  </div>

                  <div className="max-h-[min(440px,65vh)] overflow-y-auto">
                    {items.length === 0 ? (
                      <div className="px-4 py-10 text-center text-xs text-slate-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        No notifications yet.
                        <div className="mt-1 text-slate-500">
                          {isLead
                            ? 'New requests from agents, metric uploads and announcements will show up here.'
                            : 'Request approvals, metric uploads and announcements will show up here.'}
                        </div>
                      </div>
                    ) : (
                      items.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => openItem(n)}
                          className={`w-full text-left px-4 py-3 border-b hover:bg-white/5 transition-colors relative ${n.read ? 'opacity-70' : ''}`}
                          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
                        >
                          {!n.read && <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                          {row(n)}
                        </button>
                      ))
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="px-4 py-2 text-right border-t" style={{ borderColor: surface.borderColor }}>
                      <button type="button" onClick={clearAll} className="text-[11px] text-slate-400 hover:text-red-300">
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* pop-ups */}
            <div className="fixed z-[95] top-20 right-4 w-[min(360px,calc(100vw-32px))] space-y-2 pointer-events-none">
              {askBanner && (
                <div className="pointer-events-auto rounded-xl border p-3 shadow-2xl notif-in" style={surface}>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 h-8 w-8 shrink-0 rounded-full flex items-center justify-center bg-emerald-500/15 text-emerald-400">
                      <BellRing className="h-4 w-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-bold text-slate-100">Turn on desktop pop-ups?</div>
                      <div className="text-[11.5px] text-slate-400 mt-0.5">
                        {isLead
                          ? 'Get a pop-up when an agent raises a request or new metrics are uploaded, even while you work in another tab.'
                          : 'Get a pop-up when your request is approved or new metrics are uploaded, even while you work in another tab.'}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={askPermission}
                          className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-emerald-950 hover:bg-emerald-400"
                        >
                          Turn on
                        </button>
                        <button type="button" onClick={dismissAsk} className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-400 hover:text-white">
                          Not now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {toasts.map((t) => (
                <div
                  key={t.id}
                  className="pointer-events-auto rounded-xl border shadow-2xl notif-in overflow-hidden"
                  style={{ ...surface, borderLeft: `3px solid ${(KIND_STYLE[t.kind] || KIND_STYLE.metrics).color}` }}
                >
                  <div className="flex items-start gap-2 p-3">
                    <button type="button" onClick={() => openItem(t)} className="flex-1 min-w-0 text-left">
                      {row(t, true)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
                      aria-label="Dismiss"
                      className="p-1 rounded text-slate-500 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
