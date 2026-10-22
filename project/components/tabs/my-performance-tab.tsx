'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase, useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  UserCheck, Inbox, TrendingUp, TrendingDown, Target as TargetIcon, AlertTriangle, MessageSquare, Phone,
  Lightbulb, Trophy, Calculator, Search, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { TrendChart, CsatChannelChart, COLORS, CSAT_COLORS, surveyPct, resolveTarget, isPlausibleTarget, fmt, fmtTick } from '@/components/tabs/team-tab';
import type { ChartPoint } from '@/components/tabs/team-tab';

// Set to true if people with the role "Agent" must only ever see their own data (the name picker is then hidden)
const LOCK_AGENTS_TO_SELF = false;

// ---------------------------------------------------------------------------
// Metric definitions (field = column in the agent_metrics table)
// ---------------------------------------------------------------------------
interface AgentMetric {
  label: string;
  short: string;
  field: string;
  floorKeys: string[];
  targetKey: string;
  defaultTarget: number;
  isPct: boolean;
  rawPct?: boolean; // already stored as a percentage (never multiply by 100)
  countBased?: boolean; // only valid when the agent has survey responses
  zeroIsData?: boolean; // 0 is a real result, not "missing"
  lowerIsBetter?: boolean;
  channel?: 'chat' | 'phone'; // Chat / Phone CSAT %: calculated from that channel's survey counts
  tip: string;
}

const METRICS: AgentMetric[] = [
  // CSAT %, Chat CSAT % and Phone CSAT % = CSAT / (CSAT + DSAT), exactly like the Overview tables.
  // The floor files have no survey counts, so these three have no floor comparison.
  { label: 'CSAT %', short: 'CSAT', field: 'csat_percent', floorKeys: [], targetKey: 'csatPercent', defaultTarget: 85, isPct: true, rawPct: true, countBased: true,
    tip: 'Read your DSAT conversations, find the repeated reason, and finish every chat with a clear summary and next step.' },
  { label: 'Chat CSAT %', short: 'Chat CSAT', field: 'chat_csat', floorKeys: [], targetKey: 'csatPercent', defaultTarget: 85, isPct: true, channel: 'chat',
    tip: 'Review your chat DSATs: confirm the solution and end with a clear summary and next step.' },
  { label: 'Phone CSAT %', short: 'Phone CSAT', field: 'phone_csat', floorKeys: [], targetKey: 'csatPercent', defaultTarget: 85, isPct: true, channel: 'phone',
    tip: 'On calls, recap the solution before hanging up and check the customer has no other question.' },
  { label: 'KSCAT %', short: 'KSCAT', field: 'kscat_percent', floorKeys: ['KSCAT %'], targetKey: 'kscatPercent', defaultTarget: 35, isPct: true, rawPct: true, countBased: true,
    tip: 'Ask your team leader which of your karma-survey conversations scored best and repeat that approach.' },
  { label: 'Adherence %', short: 'Adherence', field: 'adherence', floorKeys: ['Adherence, %'], targetKey: 'adherencePercent', defaultTarget: 90, isPct: true,
    tip: 'Follow your schedule: log in on time and take breaks and lunch at the planned times.' },
  { label: 'AHT', short: 'AHT', field: 'aht', floorKeys: ['Average handling time'], targetKey: 'aht', defaultTarget: 5, isPct: false, lowerIsBetter: true,
    tip: 'Use your macros and ask all clarifying questions in one message instead of several.' },
  { label: 'ABT', short: 'ABT', field: 'abt', floorKeys: ['Average basket time'], targetKey: 'abt', defaultTarget: 14, isPct: false, lowerIsBetter: true,
    tip: 'Do not leave tickets waiting in your basket. Update or close them in the same session when you can.' },
  { label: 'AGBT', short: 'AGBT', field: 'agbt', floorKeys: ['Average group basket time'], targetKey: 'agbt', defaultTarget: 25, isPct: false, lowerIsBetter: true,
    tip: 'Check group-basket tickets first when you are free so they do not age.' },
  { label: 'Productivity 8-hrs', short: 'Productivity', field: 'productivity_8hrs', floorKeys: ['Productivity 8-hrs'], targetKey: 'productivity8hrs', defaultTarget: 30, isPct: false,
    tip: 'Keep your status accurate and pick up the next conversation straight after you close one.' },
  { label: 'Productivity Online 8-hrs', short: 'Prod. Online', field: 'productivity_online_8hrs', floorKeys: ['Productivity Online 8-hrs'], targetKey: 'productivityOnline8hrs', defaultTarget: 40, isPct: false,
    tip: 'Reduce idle time while you are online: keep the queue open and respond quickly.' },
  { label: 'Escalation Rate %', short: 'Escalation', field: 'escalation_rate', floorKeys: ['Escalation rate %'], targetKey: 'escalationRate', defaultTarget: 4.5, isPct: true, zeroIsData: true, lowerIsBetter: true,
    tip: 'Check the knowledge base and ask your team leader before escalating, and escalate only when it is really needed.' },
  { label: 'Deescalation Rate %', short: 'Deescalation', field: 'deescalation_rate', floorKeys: ['Deescalation rate %'], targetKey: 'deescalationRate', defaultTarget: 4.0, isPct: true, zeroIsData: true,
    tip: 'Stay calm, acknowledge the customer’s frustration first, then explain the next step clearly.' },
  { label: 'Closed After Resolution %', short: 'Closed after res.', field: 'closed_after_resolution', floorKeys: ['Closed after resolution, %'], targetKey: 'closedAfterRes', defaultTarget: 60, isPct: true,
    tip: 'Confirm the issue is solved, then close the ticket with a short final message.' },
  { label: 'Closed Tickets %', short: 'Closed tickets', field: 'closed_tickets_pct', floorKeys: ['Closed tickets, %'], targetKey: 'closedTickets', defaultTarget: 50, isPct: true,
    tip: 'Follow up on pending tickets daily so they are not left open.' },
  { label: 'FCR %', short: 'FCR', field: 'fcr_percent', floorKeys: ['FCR, %'], targetKey: 'fcrPercent', defaultTarget: 70, isPct: true,
    tip: 'Solve the whole issue in one contact: confirm everything is covered before you close.' },
];

const HERO_METRICS = ['CSAT %', 'KSCAT %', 'FCR %', 'Adherence %'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const agentValue = (row: any, m: AgentMetric): number | null => {
  if (!row) return null;
  if (m.channel) return surveyPct([row], m.channel);
  const raw = row[m.field];
  if (raw === undefined || raw === null || raw === '') return null;
  let n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace('%', ''));
  if (isNaN(n)) return null;
  if (m.countBased) {
    const total = Number(row.total_count) || (Number(row.csat) || 0) + (Number(row.kscat) || 0) + (Number(row.dsat) || 0);
    return total > 0 ? n : null;
  }
  if (n === 0 && !m.zeroIsData) return null;
  if (m.isPct && !m.rawPct && n > 0 && n <= 1) n *= 100;
  return n;
};

const floorValue = (src: Record<string, any> | undefined, m: AgentMetric): number | null => {
  if (!src) return null;
  for (const k of m.floorKeys) {
    const raw = src[k];
    if (raw === undefined || raw === null || raw === '') continue;
    let n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace('%', ''));
    if (isNaN(n)) continue;
    if (m.isPct && n > 0 && n <= 1) n *= 100;
    return n;
  }
  return null;
};

const periodOf = (row: any) => String(row?.period_id || String(row?.created_at || '').slice(0, 10) || 'Latest');

const signed = (n: number, isPct: boolean) => `${n > 0 ? '+' : ''}${Number(n.toFixed(2))}${isPct ? ' pts' : ''}`;

const isGood = (gap: number, lowerIsBetter?: boolean) => (lowerIsBetter ? gap <= 0 : gap >= 0);

function Delta({ now, before, isPct, lowerIsBetter }: { now: number | null; before: number | null; isPct: boolean; lowerIsBetter?: boolean }) {
  if (now == null || before == null) return <span className="text-[11px] text-slate-400">No previous upload</span>;
  const d = now - before;
  if (Math.abs(d) < 0.005)
    return (
      <span className="text-[11px] text-slate-400 flex items-center gap-1">
        <Minus className="h-3 w-3" /> No change
      </span>
    );
  const up = d > 0;
  const good = lowerIsBetter ? !up : up;
  return (
    <span className={`text-[11px] font-semibold flex items-center gap-1 ${good ? 'text-emerald-500' : 'text-red-500'}`}>
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {signed(d, isPct)} vs previous
    </span>
  );
}

// ---------------------------------------------------------------------------
// Everything shown for ONE agent
// ---------------------------------------------------------------------------
export function AgentView({
  row,
  history,
  floorAverages,
  kpiTargets,
  dailyProgressData,
}: {
  row: any;
  history: any[];
  floorAverages: Record<string, any>;
  kpiTargets: Record<string, any>;
  dailyProgressData: any[];
}) {
  const [chartLabel, setChartLabel] = useState('CSAT %');
  const [goalInput, setGoalInput] = useState('');

  const chartMetric = METRICS.find((m) => m.label === chartLabel) || METRICS[0];
  const isCsatView = chartMetric.label === 'CSAT %' || !!chartMetric.channel;
  const metricOf = (label: string) => METRICS.find((m) => m.label === label)!;

  const floorByPeriod = useMemo(() => {
    const map = new Map<string, Record<string, any>>();
    (dailyProgressData || []).forEach((d: any) => map.set(String(d.period), d.floorMetrics || {}));
    return map;
  }, [dailyProgressData]);

  const rows = history.length ? history : [row];
  const prevRow = rows.length > 1 ? rows[rows.length - 2] : null;

  // ----- scorecard (latest upload) -----
  const scorecard = METRICS.map((m) => {
    const you = agentValue(row, m);
    const floor = floorValue(floorAverages, m);
    const target = resolveTarget(kpiTargets[m.targetKey], m.defaultTarget);
    const targetOk = isPlausibleTarget(target, you ?? floor);
    const gap = you != null && floor != null ? you - floor : null;
    const aheadOfFloor = gap == null ? null : isGood(gap, m.lowerIsBetter);
    const meets = you == null || !targetOk ? null : m.lowerIsBetter ? you <= target : you >= target;
    const relative = gap != null && floor ? (m.lowerIsBetter ? -gap : gap) / Math.abs(floor) : null;
    return { m, you, floor, target, targetOk, gap, aheadOfFloor, meets, relative, before: agentValue(prevRow, m) };
  });

  const anyBadTarget = scorecard.some((s) => !s.targetOk);

  // ----- chart -----
  const points: ChartPoint[] = rows.map((r, i) => {
    const period = rows === history ? periodOf(r) : 'Latest';
    let floor = floorValue(floorByPeriod.get(period), chartMetric);
    if (floor == null && i === rows.length - 1) floor = floorValue(floorAverages, chartMetric);
    return { period, team: agentValue(r, chartMetric), floor };
  });
  const sel = scorecard.find((s) => s.m.label === chartMetric.label)!;
  const csatSel = scorecard.find((s) => s.m.label === 'CSAT %')!;
  const csatSeries = (label: string) => rows.map((r) => agentValue(r, metricOf(label)));
  const chatNow = scorecard.find((s) => s.m.label === 'Chat CSAT %')!;
  const phoneNow = scorecard.find((s) => s.m.label === 'Phone CSAT %')!;

  // ----- focus / strengths -----
  const ranked = scorecard.filter((s) => s.relative != null).sort((a, b) => (a.relative as number) - (b.relative as number));
  const focus = ranked.filter((s) => (s.relative as number) < 0).slice(0, 3);
  const strengths = [...ranked].reverse().filter((s) => (s.relative as number) > 0).slice(0, 3);

  // ----- survey breakdown -----
  const c = Number(row.csat) || 0;
  const k = Number(row.kscat) || 0;
  const d = Number(row.dsat) || 0;
  const total = c + k + d;
  const chat = { c: Number(row.chat_csat) || 0, k: Number(row.chat_kscat) || 0, d: Number(row.chat_dsat) || 0 };
  const phone = { c: Number(row.phone_csat) || 0, k: Number(row.phone_kscat) || 0, d: Number(row.phone_dsat) || 0 };
  const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);

  // ----- CSAT goal helper (same formula as the Overview tab: CSAT / (CSAT + DSAT)) -----
  const csatDef = METRICS[0];
  const csatTarget = resolveTarget(kpiTargets[csatDef.targetKey], csatDef.defaultTarget);
  const csatNow = pct(c, c + d);
  const csatTargetOk = isPlausibleTarget(csatTarget, c + d > 0 ? csatNow : null);
  const goalDefault = csatTargetOk ? csatTarget : 85;
  const goal = parseFloat(goalInput) > 0 ? parseFloat(goalInput) : goalDefault;
  const needMore = goal < 100 && c + d > 0 ? Math.max(0, Math.ceil((goal * (c + d) - 100 * c) / (100 - goal))) : null;
  const canAfford = goal > 0 && c > 0 ? Math.max(0, Math.floor((100 * c) / goal - (c + d))) : 0;

  const heroes = HERO_METRICS.map((l) => scorecard.find((s) => s.m.label === l)!).filter(Boolean);
  const historyRows = [...(history.length ? history : [])].reverse().slice(0, 12);

  return (
    <div className="space-y-6">
      {anyBadTarget && (
        <div className="p-3 rounded-xl text-xs flex items-start gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Some targets have not been set correctly yet, so “Meeting / Missing” is hidden for them. Your numbers and the comparison with the floor are not affected.
          </span>
        </div>
      )}

      {/* HERO CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {heroes.map((s) => (
          <Card key={s.m.label} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardContent className="p-4 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-500">My {s.m.short}</div>
              <div className="text-3xl font-black" style={{ color: COLORS.team }}>{fmt(s.you, s.m.isPct)}</div>
              <Delta now={s.you} before={s.before} isPct={s.m.isPct} lowerIsBetter={s.m.lowerIsBetter} />
              {s.m.label === 'CSAT %' ? (
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm" style={{ background: CSAT_COLORS.chat }} /> Chat{' '}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{fmt(chatNow.you, true)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm" style={{ background: CSAT_COLORS.phone }} /> Phone{' '}
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{fmt(phoneNow.you, true)}</span>
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 pt-1">
                  Floor {fmt(s.floor, s.m.isPct)}
                  {s.gap != null && (
                    <span className={`ml-1.5 font-semibold ${s.aheadOfFloor ? 'text-emerald-500' : 'text-red-500'}`}>
                      ({signed(s.gap, s.m.isPct)})
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TREND CHART */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-slate-700 dark:text-slate-200">
            {isCsatView ? 'CSAT % – Overall, Chat & Phone' : chartMetric.label} – My Progress
          </CardTitle>
          <CardDescription className="text-xs">
            {isCsatView
              ? 'My CSAT ÷ (CSAT + DSAT) for each upload, calculated like the Overview tables'
              : `My result for each upload compared with the floor average${chartMetric.lowerIsBetter ? ' · lower is better for this metric' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2 space-y-4">
          <div className="flex flex-wrap gap-2">
            {METRICS.filter((m) => !m.channel).map((m) => {
              const active = m.label === 'CSAT %' ? isCsatView : m.label === chartMetric.label;
              return (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => setChartLabel(m.label)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-emerald-500/60'
                  }`}
                >
                  {m.label === 'CSAT %' ? 'CSAT · Chat · Phone' : m.short}
                </button>
              );
            })}
          </div>

          {points.length < 2 && (
            <div className="text-[11px] text-slate-400">
              Only one upload is available for you so far, so there is no trend line yet. It will grow with every new data upload.
            </div>
          )}

          {isCsatView ? (
            <CsatChannelChart
              periods={points.map((p) => p.period)}
              overall={csatSeries('CSAT %')}
              chat={csatSeries('Chat CSAT %')}
              phone={csatSeries('Phone CSAT %')}
              target={csatSel.targetOk ? csatSel.target : null}
              overallLabel="My Overall CSAT"
            />
          ) : (
            <TrendChart
              points={points}
              target={sel.targetOk ? sel.target : null}
              isPct={chartMetric.isPct}
              lowerIsBetter={!!chartMetric.lowerIsBetter}
              teamLabel="Me"
              floorLabel="Floor Average"
            />
          )}
        </CardContent>
      </Card>

      {/* FOCUS + STRENGTHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border border-amber-500/30 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-5 w-5" /> What to focus on
            </CardTitle>
            <CardDescription className="text-xs">Where you are furthest behind the floor average</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {focus.length === 0 ? (
              <p className="text-slate-500">Nothing to fix: you are level with or ahead of the floor on every metric that has data.</p>
            ) : (
              focus.map((s) => (
                <div key={s.m.label} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{s.m.label}</span>
                    <span className="text-red-500 font-semibold">{signed(s.gap as number, s.m.isPct)} vs floor</span>
                  </div>
                  <div className="text-slate-500">
                    You {fmt(s.you, s.m.isPct)} · Floor {fmt(s.floor, s.m.isPct)}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">💡 {s.m.tip}</div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-emerald-500/30 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Trophy className="h-5 w-5" /> My strengths
            </CardTitle>
            <CardDescription className="text-xs">Where you are furthest ahead of the floor average</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            {strengths.length === 0 ? (
              <p className="text-slate-500">No metric is ahead of the floor yet. Pick one focus area and improve it step by step.</p>
            ) : (
              strengths.map((s) => (
                <div key={s.m.label} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{s.m.label}</span>
                    <span className="text-emerald-500 font-semibold">{signed(s.gap as number, s.m.isPct)} vs floor</span>
                  </div>
                  <div className="text-slate-500">
                    You {fmt(s.you, s.m.isPct)} · Floor {fmt(s.floor, s.m.isPct)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* SCORECARD */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TargetIcon className="h-5 w-5 text-emerald-500" /> My Scorecard
          </CardTitle>
          <CardDescription className="text-xs">Click a row to show it in the chart above</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="text-xs min-w-[780px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[230px]">Metric</TableHead>
                  <TableHead>Me</TableHead>
                  <TableHead>Floor Average</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Vs Target</TableHead>
                  <TableHead className="text-right">Vs Floor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scorecard.map((s) => (
                  <TableRow
                    key={s.m.label}
                    onClick={() => setChartLabel(s.m.label)}
                    className={`cursor-pointer hover:bg-slate-500/5 ${
                      s.m.label === chartMetric.label || (isCsatView && (s.m.label === 'CSAT %' || s.m.channel)) ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <TableCell className={`font-semibold ${s.m.channel ? 'pl-6' : ''}`}>
                      {s.m.channel && (
                        <span className="inline-block h-2 w-2 rounded-sm mr-1.5" style={{ background: CSAT_COLORS[s.m.channel] }} />
                      )}
                      {s.m.label}
                      {s.m.lowerIsBetter && <span className="ml-1.5 text-[10px] font-normal text-slate-400">(lower is better)</span>}
                    </TableCell>
                    <TableCell className="font-bold text-emerald-500">{fmt(s.you, s.m.isPct)}</TableCell>
                    <TableCell className="text-blue-500 font-semibold">{fmt(s.floor, s.m.isPct)}</TableCell>
                    <TableCell className={`font-semibold ${s.gap == null ? 'text-slate-400' : s.aheadOfFloor ? 'text-emerald-500' : 'text-red-500'}`}>
                      {s.gap == null ? '-' : signed(s.gap, s.m.isPct)}
                    </TableCell>
                    <TableCell className="text-amber-500 font-bold">{s.targetOk ? fmtTick(s.target, s.m.isPct) : '-'}</TableCell>
                    <TableCell>
                      {s.meets == null ? (
                        <span className="text-muted-foreground">-</span>
                      ) : s.meets ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-semibold">Meeting</Badge>
                      ) : (
                        <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 font-semibold">Missing</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.aheadOfFloor == null ? (
                        <span className="text-muted-foreground">-</span>
                      ) : s.aheadOfFloor ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 gap-1 font-semibold">
                          <TrendingUp className="h-3 w-3" /> Ahead
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 gap-1 font-semibold">
                          <TrendingDown className="h-3 w-3" /> Behind
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SURVEYS + CSAT GOAL HELPER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-sky-500" /> My Survey Results
            </CardTitle>
            <CardDescription className="text-xs">How my customers rated me</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { l: 'CSAT', v: c, cls: 'text-emerald-500' },
                { l: 'KSCAT', v: k, cls: 'text-blue-500' },
                { l: 'DSAT', v: d, cls: 'text-red-500' },
                { l: 'Total', v: total, cls: 'text-slate-700 dark:text-slate-200' },
              ].map((x) => (
                <div key={x.l} className="p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] font-bold uppercase text-slate-500">{x.l}</div>
                  <div className={`text-xl font-black ${x.cls}`}>{x.v}</div>
                </div>
              ))}
            </div>

            {total > 0 && (
              <div className="space-y-1">
                <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-200/40 dark:bg-slate-800">
                  <div style={{ width: `${pct(c, total)}%`, background: '#10b981' }} />
                  <div style={{ width: `${pct(k, total)}%`, background: '#60a5fa' }} />
                  <div style={{ width: `${pct(d, total)}%`, background: '#ef4444' }} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>CSAT {pct(c, total).toFixed(0)}%</span>
                  <span>KSCAT {pct(k, total).toFixed(0)}%</span>
                  <span>DSAT {pct(d, total).toFixed(0)}%</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Chat', icon: MessageSquare, v: chat },
                { name: 'Phone', icon: Phone, v: phone },
              ].map((ch) => {
                const Icon = ch.icon;
                const t = ch.v.c + ch.v.k + ch.v.d;
                return (
                  <div key={ch.name} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200">
                      <Icon className="h-3.5 w-3.5 text-slate-400" /> {ch.name}
                    </div>
                    <div className="text-slate-500">
                      {ch.v.c} CSAT · {ch.v.k} KSCAT · {ch.v.d} DSAT
                    </div>
                    <div className="font-black text-emerald-500">
                      {t > 0 && ch.v.c + ch.v.d > 0 ? `${pct(ch.v.c, ch.v.c + ch.v.d).toFixed(2)}%` : '-'}
                      <span className="text-[10px] font-normal text-slate-400 ml-1">CSAT</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-5 w-5 text-emerald-500" /> CSAT Goal Helper
            </CardTitle>
            <CardDescription className="text-xs">See what it takes to reach a CSAT % goal (CSAT ÷ (CSAT + DSAT))</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <label className="font-semibold text-slate-500 shrink-0">My goal %</label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="99.9"
                value={goalInput}
                placeholder={String(goalDefault)}
                onChange={(e) => setGoalInput(e.target.value)}
                className="h-9 w-28 text-sm font-bold bg-slate-50 dark:bg-slate-950"
              />
              <span className="text-slate-400">current: {c + d > 0 ? `${csatNow.toFixed(2)}%` : '-'}</span>
            </div>

            {c + d === 0 ? (
              <p className="text-slate-500">No CSAT / DSAT responses yet, so the helper has nothing to work with.</p>
            ) : goal >= 100 ? (
              <p className="text-slate-500">Choose a goal below 100%.</p>
            ) : csatNow >= goal ? (
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold">
                  You are already above {goal}% 🎉
                </div>
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  {canAfford > 0 ? (
                    <>
                      You can receive about <span className="font-black text-amber-500">{canAfford}</span> more DSAT (with no new CSAT) before dropping below {goal}%.
                    </>
                  ) : (
                    <>You are right at the limit: one more DSAT (with no new CSAT) would take you below {goal}%.</>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10">
                You need about <span className="font-black text-amber-500 text-base">{needMore}</span> more CSAT responses in a row, with no new DSAT, to reach {goal}%.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* HISTORY */}
      {historyRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My History</CardTitle>
            <CardDescription className="text-xs">My results from each data upload (newest first)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="text-xs min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>CSAT</TableHead>
                    <TableHead>KSCAT</TableHead>
                    <TableHead>DSAT</TableHead>
                    <TableHead>CSAT %</TableHead>
                    <TableHead>KSCAT %</TableHead>
                    <TableHead>AHT</TableHead>
                    <TableHead>ABT</TableHead>
                    <TableHead>FCR %</TableHead>
                    <TableHead>Adherence %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRows.map((r, i) => {
                    const by = (label: string) => {
                      const m = METRICS.find((x) => x.label === label)!;
                      return fmt(agentValue(r, m), m.isPct);
                    };
                    return (
                      <TableRow key={i} className="hover:bg-slate-500/5">
                        <TableCell className="font-semibold">{periodOf(r)}</TableCell>
                        <TableCell>{r.csat ?? '-'}</TableCell>
                        <TableCell>{r.kscat ?? '-'}</TableCell>
                        <TableCell className="text-red-500 font-semibold">{r.dsat ?? '-'}</TableCell>
                        <TableCell className="text-emerald-500 font-bold">{by('CSAT %')}</TableCell>
                        <TableCell className="text-blue-500 font-bold">{by('KSCAT %')}</TableCell>
                        <TableCell>{by('AHT')}</TableCell>
                        <TableCell>{by('ABT')}</TableCell>
                        <TableCell>{by('FCR %')}</TableCell>
                        <TableCell>{by('Adherence %')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: pick the agent, load that agent's history, show AgentView
// ---------------------------------------------------------------------------
export function MyPerformanceTab() {
  const { agentMetrics = [], floorAverages = {}, kpiTargets = {}, dailyProgressData = [], currentUser } = useMetrics() as any;

  const [selectedEmail, setSelectedEmail] = useState('');
  const [filterText, setFilterText] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [histError, setHistError] = useState('');

  const myEmail = String(currentUser?.user_email || '').toLowerCase();
  const locked = LOCK_AGENTS_TO_SELF && currentUser?.role === 'Agent';

  const agents = useMemo(() => {
    const map = new Map<string, any>();
    agentMetrics.forEach((a: any) => {
      if (!map.has(a.agent_email)) map.set(a.agent_email, a);
    });
    let list = Array.from(map.values());
    if (locked) list = list.filter((a) => String(a.agent_email).toLowerCase() === myEmail);
    return list.sort((a, b) => String(a.agent_name || a.agent_email).localeCompare(String(b.agent_name || b.agent_email)));
  }, [agentMetrics, locked, myEmail]);

  // default to the logged-in user when they are an agent, otherwise the first agent
  useEffect(() => {
    if (!agents.length) return;
    if (selectedEmail && agents.some((a) => a.agent_email === selectedEmail)) return;
    const mine = agents.find((a) => String(a.agent_email).toLowerCase() === myEmail);
    setSelectedEmail((mine || agents[0]).agent_email);
  }, [agents, myEmail, selectedEmail]);

  // load every upload of the selected agent (only that agent's rows)
  useEffect(() => {
    if (!selectedEmail) {
      setHistory([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setHistLoading(true);
      setHistError('');
      try {
        const { data, error } = await supabase
          .from('agent_metrics')
          .select('*')
          .eq('agent_email', selectedEmail)
          .order('created_at', { ascending: true });
        if (cancelled) return;
        if (error) throw error;
        setHistory(data || []);
      } catch (e: any) {
        if (!cancelled) {
          setHistError(e?.message || 'Could not load your history');
          setHistory([]);
        }
      } finally {
        if (!cancelled) setHistLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedEmail, agentMetrics]);

  const latestFromContext = agents.find((a) => a.agent_email === selectedEmail);
  const row = history.length ? history[history.length - 1] : latestFromContext;

  const shownAgents = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return agents;
    const hits = agents.filter((a) => String(a.agent_name || a.agent_email).toLowerCase().includes(q));
    return hits.length ? hits : agents;
  }, [agents, filterText]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <UserCheck className="h-6 w-6 text-emerald-500" /> My Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Choose your name to see your own results compared with the floor average and your targets
          </p>
        </div>

        {agents.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {!locked && (
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Find my name..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-8 h-9 w-full sm:w-44 text-xs bg-white dark:bg-slate-900"
                />
              </div>
            )}
            <select
              value={selectedEmail}
              onChange={(e) => setSelectedEmail(e.target.value)}
              disabled={locked}
              className="h-9 rounded-md border text-xs px-2 bg-white dark:bg-slate-900 font-semibold text-slate-700 dark:text-slate-200 min-w-[220px]"
            >
              {shownAgents.map((a) => (
                <option key={a.agent_email} value={a.agent_email}>
                  {a.agent_name || a.agent_email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {agents.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">{locked ? 'Your account is not linked to any agent data yet.' : 'No agent data available yet.'}</p>
          <p className="text-xs mt-1">
            {locked ? 'Ask your team leader to check that your login email matches your agent email.' : 'Upload the KSCAT Calc, PVF and Metrics files under Data & Backups.'}
          </p>
        </Card>
      ) : !row ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p className="text-sm font-medium">{histLoading ? 'Loading your results…' : 'No results found for this agent.'}</p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <Badge variant="outline" className="font-mono">{row.agent_email}</Badge>
            <span>Latest data: <span className="font-semibold">{periodOf(row)}</span></span>
            {histLoading && <span className="text-slate-400">· updating…</span>}
            {histError && <span className="text-amber-500">· history unavailable ({histError}) – showing the latest upload only</span>}
          </div>

          <AgentView
            key={row.agent_email}
            row={row}
            history={history}
            floorAverages={floorAverages}
            kpiTargets={kpiTargets}
            dailyProgressData={dailyProgressData}
          />
        </>
      )}
    </div>
  );
}
