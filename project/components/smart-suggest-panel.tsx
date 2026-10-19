'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Copy, Check, Mail, MessageSquare, Minimize2, Maximize2, Eraser, Search, GraduationCap } from 'lucide-react';
import { buildIndex, search, groupByTopic, isArabicText } from '@/lib/smart-suggest';
import type { SuggestDoc, SuggestGroup, LearnEvent } from '@/lib/smart-suggest';
import { loadLearning, recordChoice } from '@/lib/suggest-learning';

type Lang = 'en' | 'arm' | 'arf';
type KindFilter = 'all' | 'email' | 'chat';

const LANGS: { key: Lang; label: string; copyLabel: string }[] = [
  { key: 'en', label: 'English', copyLabel: 'English' },
  { key: 'arm', label: 'Arabic ♂', copyLabel: 'Arabic (Male)' },
  { key: 'arf', label: 'Arabic ♀', copyLabel: 'Arabic (Female)' },
];

const normalizeType = (value?: string | null): 'FL' | 'Escalation' => {
  const v = String(value || '').trim().toLowerCase();
  return v === 'fl' || v.includes('first') || v.includes('front') ? 'FL' : 'Escalation';
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

const LEVEL_STYLE = {
  strong: { label: 'Strong match', cls: 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' },
  good: { label: 'Good match', cls: 'border-sky-500/50 text-sky-600 dark:text-sky-400 bg-sky-500/10' },
  weak: { label: 'Weak match', cls: 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10' },
} as const;

const textFor = (d: SuggestDoc, lang: Lang) => (lang === 'en' ? d.en : lang === 'arm' ? d.arM : d.arF) || '';

export function SmartSuggestPanel({
  macros,
  emails,
  defaultKind = 'all',
  fillEmail,
  onShowMacro,
  onShowEmail,
  userEmail,
  storageKey = 'default',
}: {
  macros: any[];
  emails: any[];
  defaultKind?: KindFilter;
  fillEmail?: (text: string, isArabic: boolean) => string; // fills {{customer_name}} etc. when an email is copied
  onShowMacro?: (title: string) => void;
  onShowEmail?: (title: string) => void;
  userEmail?: string;
  storageKey?: string;
}) {
  const [open, setOpen] = useState(true);
  const [hint, setHint] = useState('');
  const [query, setQuery] = useState('');
  const [lang, setLang] = useState<Lang>('en');
  const [kind, setKind] = useState<KindFilter>(defaultKind);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [events, setEvents] = useState<LearnEvent[]>([]);
  const [shared, setShared] = useState<boolean | null>(null);

  // remembered choices (language, which kinds to show) + what was learned before
  useEffect(() => {
    try {
      const l = localStorage.getItem(`tabby-suggest-lang-${storageKey}`) as Lang | null;
      if (l && LANGS.some((x) => x.key === l)) setLang(l);
      const k = localStorage.getItem(`tabby-suggest-kind-${storageKey}`) as KindFilter | null;
      if (k === 'all' || k === 'email' || k === 'chat') setKind(k);
    } catch {
      // ignore
    }
    loadLearning().then((r) => {
      setEvents(r.events);
      setShared(r.shared);
    });
  }, [storageKey]);

  const pickLang = (l: Lang) => {
    setLang(l);
    try {
      localStorage.setItem(`tabby-suggest-lang-${storageKey}`, l);
    } catch {
      // ignore
    }
  };
  const pickKind = (k: KindFilter) => {
    setKind(k);
    try {
      localStorage.setItem(`tabby-suggest-kind-${storageKey}`, k);
    } catch {
      // ignore
    }
  };

  // wait a moment after typing before searching
  useEffect(() => {
    const id = setTimeout(() => setQuery(hint), 300);
    return () => clearTimeout(id);
  }, [hint]);

  const docs: SuggestDoc[] = useMemo(
    () => [
      ...macros.map((m, i) => {
        const title = String(m.category || m.topic || m.category_name || 'General');
        return {
          id: `chat-${m.id || i}`,
          kind: 'chat' as const,
          title,
          topic: title,
          type: normalizeType(m.macro_type),
          en: m.english_en || '',
          arM: m.male_ar || '',
          arF: m.female_ar || '',
        };
      }),
      ...emails.map((e, i) => ({
        id: `email-${e.id || i}`,
        kind: 'email' as const,
        title: String(e.title || 'Email template'),
        topic: String(e.category || e.title || 'General'),
        type: normalizeType(e.macro_type),
        en: e.body_en || '',
        arM: e.body_ar || '',
        arF: e.body_ar_female || '',
        subject: e.subject || '',
      })),
    ],
    [macros, emails]
  );

  const index = useMemo(() => buildIndex(docs), [docs]);

  const { groups, hiddenByKind }: { groups: SuggestGroup[]; hiddenByKind: boolean } = useMemo(() => {
    if (!query.trim()) return { groups: [], hiddenByKind: false };
    const all = search(index, query, 80, events);
    const shown = kind === 'all' ? all : all.filter((h) => h.doc.kind === kind);
    return { groups: groupByTopic(shown, 3, 3), hiddenByKind: kind !== 'all' && shown.length === 0 && all.length > 0 };
  }, [index, query, kind, events]);

  const handleCopy = async (d: SuggestDoc, which: Lang | 'subject') => {
    const raw = which === 'subject' ? d.subject || '' : textFor(d, which);
    if (!raw) return;
    const isAr = which === 'arm' || which === 'arf';
    const text = d.kind === 'email' && fillEmail ? fillEmail(raw, isAr) : raw;
    const key = `${d.id}-${which}`;
    if (await copyToClipboard(text)) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 1800);
      if (which !== 'subject') {
        // remember: "for this hint, the agent used this reply"
        const r = await recordChoice({ hint: query || hint, docId: d.id, topic: d.topic, kind: d.kind, language: which, userEmail });
        if (r.event) setEvents((prev) => [r.event as LearnEvent, ...prev]);
        setShared(r.shared);
      }
    }
  };

  const hintIsArabic = isArabicText(query);

  return (
    <Card className="border border-emerald-500/40 bg-emerald-500/5 dark:bg-slate-900">
      <CardHeader className={open ? 'pb-2' : 'py-3'}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" /> Smart Suggest
            </CardTitle>
            {open && (
              <CardDescription className="text-xs mt-1">
                Describe the case in a few words (English or Arabic) and get the best matching replies. It learns from the replies you copy.
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {open && hint && (
              <Button variant="ghost" size="sm" onClick={() => { setHint(''); setQuery(''); }} className="h-7 px-2 text-xs gap-1">
                <Eraser className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} className="h-7 px-2 text-xs gap-1">
              {open ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              {open ? 'Minimize' : 'Open'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="space-y-3 text-xs">
          <Textarea
            dir="auto"
            value={hint}
            onChange={(e) => setHint(e.target.value)}
            placeholder="Describe the case, e.g.  customer was charged twice by KNET and wants the extra amount back"
            className="min-h-[72px] text-xs bg-white dark:bg-slate-950"
          />

          {/* one language choice for every result + which kinds to show */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Reply language:</span>
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-white dark:bg-slate-950">
                {LANGS.map((l) => (
                  <Button
                    key={l.key}
                    variant={lang === l.key ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => pickLang(l.key)}
                    className="h-7 px-2.5 text-[11px] rounded-md"
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-500">Show:</span>
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-white dark:bg-slate-950">
                {([['all', 'All'], ['email', 'Emails'], ['chat', 'Chat macros']] as [KindFilter, string][]).map(([k, label]) => (
                  <Button
                    key={k}
                    variant={kind === k ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => pickKind(k)}
                    className="h-7 px-2.5 text-[11px] rounded-md"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {!query.trim() && <p className="text-slate-500">Suggestions appear here as soon as you describe the case.</p>}

          {query.trim() && groups.length === 0 && (
            <p className="text-amber-600 dark:text-amber-400">
              {hiddenByKind ? (
                <>
                  No {kind === 'email' ? 'email template' : 'chat macro'} matches, but other results exist.{' '}
                  <button type="button" onClick={() => pickKind('all')} className="font-bold underline">Show all</button>
                </>
              ) : (
                'No macro or template matches these words. Try other words from the case.'
              )}
            </p>
          )}

          {groups.length > 0 && groups[0].best.level === 'weak' && (
            <p className="text-amber-600 dark:text-amber-400">Only weak matches found. Check them carefully, or try different words.</p>
          )}

          <div className="space-y-3">
            {groups.map((g, gi) => {
              const lv = LEVEL_STYLE[g.best.level];
              return (
                <div key={g.topic + gi} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/60 p-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {gi === 0 && <Badge className="bg-emerald-600 text-white text-[10px]">Best topic</Badge>}
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{g.topic}</span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${lv.cls}`}>{lv.label}</Badge>
                    <span className="text-[11px] text-slate-400">
                      {g.emailCount > 0 && `${g.emailCount} email`}
                      {g.emailCount > 0 && g.chatCount > 0 && ' · '}
                      {g.chatCount > 0 && `${g.chatCount} chat`}
                    </span>
                    {g.best.matched.length > 0 && <span className="text-[11px] text-slate-400">matched: {g.best.matched.slice(0, 4).join(', ')}</span>}
                  </div>

                  <div className="space-y-2">
                    {g.hits.map((h) => {
                      const d = h.doc;
                      const wanted = textFor(d, lang);
                      const preview = wanted || d.en || d.arM || d.arF || '';
                      const snippet = preview.length > 170 ? preview.slice(0, 170) + '…' : preview;
                      const wantedLabel = LANGS.find((l) => l.key === lang)!.copyLabel;
                      const others = LANGS.filter((l) => l.key !== lang && textFor(d, l.key));
                      // identical male + female Arabic: offer it once
                      const hideFemale = !!d.arM && d.arM === d.arF && lang === 'arm';
                      return (
                        <div key={d.id} className="flex flex-col gap-1.5 rounded-lg border border-slate-200/70 dark:border-slate-800 p-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {d.kind === 'chat' ? <MessageSquare className="h-3 w-3 text-slate-400" /> : <Mail className="h-3 w-3 text-slate-400" />}
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{d.title}</span>
                            <Badge
                              variant="outline"
                              className={`text-[10px] font-bold ${
                                d.type === 'FL'
                                  ? 'border-sky-500/50 text-sky-600 dark:text-sky-400 bg-sky-500/10'
                                  : 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                              }`}
                            >
                              {d.type === 'FL' ? 'FL' : 'Escalation'}
                            </Badge>
                            <span className="text-[10px] text-slate-400">{d.kind === 'chat' ? 'Chat macro' : 'Email template'}</span>
                            {h.learned && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-500">
                                <GraduationCap className="h-3 w-3" /> You chose this before for a similar case
                              </span>
                            )}
                          </div>

                          {snippet && (
                            <p dir="auto" className="text-slate-500 line-clamp-2 whitespace-pre-wrap">
                              {snippet}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-1.5">
                            {wanted ? (
                              <button
                                type="button"
                                onClick={() => handleCopy(d, lang)}
                                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1 text-[11px] font-bold text-white"
                              >
                                {copiedKey === `${d.id}-${lang}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copiedKey === `${d.id}-${lang}` ? 'Copied!' : `Copy ${wantedLabel}`}
                              </button>
                            ) : (
                              <span className="text-[11px] italic text-slate-400">No {wantedLabel} version yet</span>
                            )}
                            {others
                              .filter((l) => !(hideFemale && l.key === 'arf'))
                              .map((l) => (
                                <button
                                  key={l.key}
                                  type="button"
                                  onClick={() => handleCopy(d, l.key)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500/60 hover:text-emerald-500"
                                >
                                  {copiedKey === `${d.id}-${l.key}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                  {copiedKey === `${d.id}-${l.key}` ? 'Copied!' : l.copyLabel}
                                </button>
                              ))}
                            {d.kind === 'email' && d.subject && (
                              <button
                                type="button"
                                onClick={() => handleCopy(d, 'subject')}
                                className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500/60 hover:text-emerald-500"
                              >
                                {copiedKey === `${d.id}-subject` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                {copiedKey === `${d.id}-subject` ? 'Copied!' : 'Subject'}
                              </button>
                            )}
                            {d.kind === 'chat' && onShowMacro && (
                              <button type="button" onClick={() => onShowMacro(d.title)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline">
                                <Search className="h-3 w-3" /> Show full card
                              </button>
                            )}
                            {d.kind === 'email' && onShowEmail && (
                              <button type="button" onClick={() => onShowEmail(d.title)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline">
                                <Search className="h-3 w-3" /> Show full card
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {groups.some((g) => g.hits.some((h) => h.doc.kind === 'email')) && !fillEmail && (
            <p className="text-[11px] text-slate-400">
              Email templates copied from here keep their {'{{placeholders}}'}. Use the Email tab to fill in the customer name and ticket ID automatically.
            </p>
          )}
          {hintIsArabic && lang === 'en' && groups.length > 0 && (
            <p className="text-[11px] text-slate-400">Your description is in Arabic. Switch the reply language to Arabic if the customer writes in Arabic.</p>
          )}

          <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <GraduationCap className="h-3 w-3" />
            Learns from your choices: a reply you copy is ranked higher next time for a similar description.
            {shared === false && ' (Saved in this browser only. Ask the admin to create the suggest_feedback table to share it with the team.)'}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
