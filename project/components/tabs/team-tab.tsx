'use client';

import { useState, useEffect, useRef } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  TrendingUp, TrendingDown, Users2, BarChart3, Inbox, ArrowUpRight, ArrowDownRight, Minus,
  Target as TargetIcon, AlertTriangle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Metric definitions
// lowerIsBetter: for these metrics a SMALLER number is the good result
// ---------------------------------------------------------------------------
interface MetricDef {
  name: string;
  short: string;
  keys: string[];
  targetKey: string;
  defaultTarget: number;
  isPct: boolean;
  lowerIsBetter?: boolean;
}

const METRICS: MetricDef[] = [
  { name: 'CSAT %', short: 'CSAT', keys: ['CSAT adjusted with calls, %', 'CSAT %'], targetKey: 'csatPercent', defaultTarget: 85, isPct: true },
  { name: 'KSCAT %', short: 'KSCAT', keys: ['KSCAT %', 'kscatPercent'], targetKey: 'kscatPercent', defaultTarget: 35, isPct: true },
  { name: 'Adherence %', short: 'Adherence', keys: ['Adherence, %', 'adherencePercent'], targetKey: 'adherencePercent', defaultTarget: 90, isPct: true },
  { name: 'AHT (Average Handling Time)', short: 'AHT', keys: ['Average handling time', 'aht'], targetKey: 'aht', defaultTarget: 5, isPct: false, lowerIsBetter: true },
  { name: 'ABT (Average Basket Time)', short: 'ABT', keys: ['Average basket time', 'abt'], targetKey: 'abt', defaultTarget: 14, isPct: false, lowerIsBetter: true },
  { name: 'Productivity 8-hrs', short: 'Productivity', keys: ['Productivity 8-hrs', 'productivity8hrs'], targetKey: 'productivity8hrs', defaultTarget: 30, isPct: false },
  { name: 'Escalation Rate %', short: 'Escalation', keys: ['Escalation rate %', 'escalationRate'], targetKey: 'escalationRate', defaultTarget: 4.5, isPct: true, lowerIsBetter: true },
  { name: 'Deescalation Rate %', short: 'Deescalation', keys: ['Deescalation rate %', 'deescalationRate'], targetKey: 'deescalationRate', defaultTarget: 4.0, isPct: true },
  { name: 'FCR %', short: 'FCR', keys: ['FCR, %', 'fcrPercent'], targetKey: 'fcrPercent', defaultTarget: 70, isPct: true },
];

export const COLORS = { team: '#10b981', floor: '#60a5fa', target: '#f59e0b' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const getNum = (src: Record<string, any> | undefined, keys: string[], isPct: boolean): number | null => {
  if (!src) return null;
  for (const k of keys) {
    const raw = src[k];
    if (raw === undefined || raw === null || raw === '') continue;
    let num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace('%', ''));
    if (isNaN(num)) continue;
    if (isPct && num > 0 && num <= 1) num *= 100; // 0.85 -> 85
    return num;
  }
  return null;
};

// Targets may arrive as numbers, "85", or arrays like [85, 90]
export const resolveTarget = (raw: any, fallback: number): number => {
  let v: any = raw;
  if (Array.isArray(v)) v = v.find((x) => Number.isFinite(parseFloat(String(x))));
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? '').replace('%', ''));
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

// A target far away from the real data (for example 1% when the team is at 66%) is almost certainly a data entry mistake
export const isPlausibleTarget = (target: number, ref: number | null) =>
  ref == null || ref <= 0 || (target >= ref * 0.3 && target <= ref * 3);

// Same calculation as the Overview tab: Team CSAT % and KSCAT % are worked out from the agent rows
// of the selected (active) roster, not read from the saved Team Overall figures.
const computeOverviewTeam = (agentMetrics: any[], kpiTargets: Record<string, any>, teamMetrics: Record<string, any>) => {
  const unique = new Map<string, any>();
  agentMetrics.forEach((a: any) => {
    if (!unique.has(a.agent_email)) unique.set(a.agent_email, a);
  });
  const agents = Array.from(unique.values());
  const allEmails = agents.map((a: any) => a.agent_email);

  const globalRoster = kpiTargets.active_roster_emails || teamMetrics.active_roster_emails;
  let activeEmails: string[] = allEmails;
  if (Array.isArray(globalRoster) && globalRoster.length > 0) {
    const valid = globalRoster.filter((e: string) => allEmails.includes(e));
    if (valid.length > 0) activeEmails = valid;
  }

  const filtered = agents.filter((a: any) => activeEmails.includes(a.agent_email));
  const csat = filtered.reduce((sum: number, a: any) => sum + (a.csat || 0), 0);
  const kscat = filtered.reduce((sum: number, a: any) => sum + (a.kscat || 0), 0);
  const dsat = filtered.reduce((sum: number, a: any) => sum + (a.dsat || 0), 0);
  const total = csat + kscat + dsat;
  const woKarma = csat + dsat;

  return {
    hasAgents: filtered.length > 0 && total > 0,
    csatPct: woKarma > 0 ? (csat / woKarma) * 100 : 0,
    kscatPct: total > 0 ? (csat / total) * 100 : 0,
  };
};

export const fmt = (n: number | null | undefined, isPct: boolean) => {
  if (n == null || isNaN(n)) return '-';
  return isPct ? `${n.toFixed(2)}%` : String(Number(n.toFixed(2)));
};

export const fmtTick = (n: number, isPct: boolean) => `${Number(n.toFixed(2))}${isPct ? '%' : ''}`;

const fmtPeriod = (p: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(p));
  if (!m) return String(p);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const niceStep = (raw: number) => {
  if (!(raw > 0)) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const f = raw / pow;
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nf * pow;
};

// Smooth line that never overshoots the data (monotone cubic interpolation)
const monotonePath = (pts: { x: number; y: number }[]) => {
  const n = pts.length;
  if (n === 0) return '';
  const p = (v: number) => v.toFixed(1);
  if (n === 1) return `M ${p(pts[0].x)} ${p(pts[0].y)}`;
  if (n === 2) return `M ${p(pts[0].x)} ${p(pts[0].y)} L ${p(pts[1].x)} ${p(pts[1].y)}`;

  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(pts[i + 1].x - pts[i].x);
    m.push((pts[i + 1].y - pts[i].y) / (dx[i] || 1));
  }
  const t: number[] = new Array(n).fill(0);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) t[i] = 0;
    else t[i] = (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
  }

  let d = `M ${p(pts[0].x)} ${p(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const c1x = pts[i].x + dx[i] / 3;
    const c1y = pts[i].y + (t[i] * dx[i]) / 3;
    const c2x = pts[i + 1].x - dx[i] / 3;
    const c2y = pts[i + 1].y - (t[i + 1] * dx[i]) / 3;
    d += ` C ${p(c1x)} ${p(c1y)} ${p(c2x)} ${p(c2y)} ${p(pts[i + 1].x)} ${p(pts[i + 1].y)}`;
  }
  return d;
};

export interface ChartPoint {
  period: string;
  team: number | null;
  floor: number | null;
}

// ---------------------------------------------------------------------------
// Interactive trend chart (responsive, hover tooltip, clickable legend)
// ---------------------------------------------------------------------------
export function TrendChart({
  points,
  target,
  isPct,
  lowerIsBetter,
  teamLabel = 'Team Score',
  floorLabel = 'Floor Average',
}: {
  points: ChartPoint[];
  target: number | null;
  isPct: boolean;
  lowerIsBetter: boolean;
  teamLabel?: string;
  floorLabel?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hover, setHover] = useState<number | null>(null);
  const [show, setShow] = useState({ team: true, floor: true, target: true });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.floor(el.clientWidth);
      if (w > 0) setWidth(w);
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = width < 520 ? 260 : 330;
  const padL = 50;
  const padR = 18;
  const padT = 18;
  const padB = 34;
  const plotW = Math.max(width - padL - padR, 10);
  const plotH = H - padT - padB;
  const n = points.length;

  // ----- y domain from the visible series only -----
  const vals: number[] = [];
  points.forEach((p) => {
    if (show.team && p.team != null) vals.push(p.team);
    if (show.floor && p.floor != null) vals.push(p.floor);
  });
  if (show.target && target != null) vals.push(target);

  let lo = 0;
  let hi = 100;
  if (vals.length) {
    const mn = Math.min(...vals);
    const mx = Math.max(...vals);
    const span = mx - mn;
    const pad = span > 0 ? span * 0.18 : Math.max(Math.abs(mx) * 0.1, 1);
    lo = Math.max(0, mn - pad);
    hi = mx + pad;
    if (isPct && mx <= 100) hi = Math.min(hi, 100);
  }
  const step = niceStep((hi - lo) / 4 || 1);
  const d0 = Math.floor(lo / step) * step;
  let d1 = Math.ceil(hi / step) * step;
  if (d1 <= d0) d1 = d0 + step;
  const ticks: number[] = [];
  for (let v = d0; v <= d1 + step / 2; v += step) ticks.push(Number(v.toFixed(6)));

  const yOf = (v: number) => padT + (1 - (v - d0) / (d1 - d0)) * plotH;
  const xOf = (i: number) => (n === 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const baseY = padT + plotH;

  const buildRuns = (key: 'team' | 'floor') => {
    const runs: { x: number; y: number }[][] = [];
    let cur: { x: number; y: number }[] = [];
    points.forEach((p, i) => {
      const v = p[key];
      if (v == null) {
        if (cur.length) runs.push(cur);
        cur = [];
      } else {
        cur.push({ x: xOf(i), y: yOf(v) });
      }
    });
    if (cur.length) runs.push(cur);
    return runs;
  };

  const teamRuns = buildRuns('team');
  const floorRuns = buildRuns('floor');
  const teamPath = teamRuns.map(monotonePath).join(' ');
  const floorPath = floorRuns.map(monotonePath).join(' ');
  const teamArea = teamRuns
    .filter((r) => r.length > 1)
    .map((r) => `${monotonePath(r)} L ${r[r.length - 1].x.toFixed(1)} ${baseY} L ${r[0].x.toFixed(1)} ${baseY} Z`)
    .join(' ');

  const maxLabels = Math.max(2, Math.floor(plotW / 64));
  const every = Math.max(1, Math.ceil(n / maxLabels));
  const dotR = n > 24 ? 2 : 3.5;

  const hasAnyData = points.some((p) => p.team != null || p.floor != null);

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let idx = n === 1 ? 0 : Math.round(((px - padL) / plotW) * (n - 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHover(idx);
  };

  const hp = hover != null ? points[hover] : null;
  const hx = hover != null ? xOf(hover) : 0;
  const tipLeft = Math.max(4, hx > width * 0.6 ? hx - 196 : hx + 14);
  const gap = hp && hp.team != null && hp.floor != null ? hp.team - hp.floor : null;
  const gapGood = gap == null ? null : lowerIsBetter ? gap <= 0 : gap >= 0;

  const legendBtn = (key: 'team' | 'floor' | 'target', label: string, color: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))}
      title="Click to show / hide"
      className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-opacity ${
        show[key] ? 'border-slate-300 dark:border-slate-700 opacity-100' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-40'
      }`}
    >
      <span className="h-2.5 w-2.5 rounded-sm inline-block shrink-0" style={{ background: color }} />
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {legendBtn('team', teamLabel, COLORS.team)}
        {legendBtn('floor', floorLabel, COLORS.floor)}
        {target != null && legendBtn('target', `Target ${fmtTick(target, isPct)}`, COLORS.target)}
        <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">Hover the chart for details · click a label to hide it</span>
      </div>

      <div ref={wrapRef} className="relative w-full select-none">
        <svg
          width={width}
          height={H}
          viewBox={`0 0 ${width} ${H}`}
          className="block text-slate-500 dark:text-slate-400"
          role="img"
          aria-label="Team versus floor trend chart"
        >
          <defs>
            <linearGradient id="tt-area-team" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={COLORS.team} stopOpacity="0.28" />
              <stop offset="1" stopColor={COLORS.team} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid + y labels */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={padL} y1={yOf(t)} x2={width - padR} y2={yOf(t)} stroke="currentColor" strokeOpacity={i === 0 ? 0.3 : 0.12} strokeWidth="1" />
              <text x={padL - 8} y={yOf(t) + 3} textAnchor="end" fill="currentColor" fillOpacity="0.75" fontSize="10.5" fontFamily="sans-serif">
                {fmtTick(t, isPct)}
              </text>
            </g>
          ))}

          {/* x labels */}
          {points.map((p, i) =>
            i % every === 0 ? (
              <text key={i} x={xOf(i)} y={H - 12} textAnchor="middle" fill="currentColor" fillOpacity="0.75" fontSize="10.5" fontFamily="sans-serif">
                {fmtPeriod(p.period)}
              </text>
            ) : null
          )}

          {/* target */}
          {show.target && target != null && (
            <g>
              <line x1={padL} y1={yOf(target)} x2={width - padR} y2={yOf(target)} stroke={COLORS.target} strokeWidth="1.5" strokeDasharray="5 4" />
              <text x={width - padR} y={yOf(target) - 5} textAnchor="end" fill={COLORS.target} fontSize="10.5" fontWeight="600" fontFamily="sans-serif">
                Target {fmtTick(target, isPct)}
              </text>
            </g>
          )}

          {/* team area + lines */}
          {show.team && teamArea && <path d={teamArea} fill="url(#tt-area-team)" />}
          {show.floor && floorPath && (
            <path d={floorPath} fill="none" stroke={COLORS.floor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {show.team && teamPath && (
            <path d={teamPath} fill="none" stroke={COLORS.team} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* dots */}
          {show.floor &&
            points.map((p, i) =>
              p.floor != null ? <circle key={`f${i}`} cx={xOf(i)} cy={yOf(p.floor)} r={dotR} fill={COLORS.floor} /> : null
            )}
          {show.team &&
            points.map((p, i) =>
              p.team != null ? <circle key={`t${i}`} cx={xOf(i)} cy={yOf(p.team)} r={dotR} fill={COLORS.team} /> : null
            )}

          {/* hover crosshair */}
          {hp && (
            <g pointerEvents="none">
              <line x1={hx} y1={padT} x2={hx} y2={baseY} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="3 3" />
              {show.floor && hp.floor != null && (
                <circle cx={hx} cy={yOf(hp.floor)} r="5.5" fill={COLORS.floor} stroke="#fff" strokeWidth="2" />
              )}
              {show.team && hp.team != null && (
                <circle cx={hx} cy={yOf(hp.team)} r="5.5" fill={COLORS.team} stroke="#fff" strokeWidth="2" />
              )}
            </g>
          )}

          {!hasAnyData && (
            <text x={width / 2} y={H / 2} textAnchor="middle" fill="currentColor" fillOpacity="0.7" fontSize="13" fontFamily="sans-serif">
              No data for this metric in the daily backups yet
            </text>
          )}

          {/* mouse / touch capture area */}
          <rect
            x={padL}
            y={padT}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={onMove}
            onPointerDown={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hp && (
          <div
            className="pointer-events-none absolute z-10 w-[182px] rounded-lg border border-white/15 p-2.5 text-xs text-slate-100 shadow-lg"
            style={{ left: tipLeft, top: padT, background: 'rgba(11, 18, 32, 0.96)' }}
          >
            <div className="font-bold mb-1.5">{hp.period}</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: COLORS.team }} />{teamLabel === 'Team Score' ? 'Team' : teamLabel}</span>
                <span className="font-bold">{fmt(hp.team, isPct)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: COLORS.floor }} />{floorLabel === 'Floor Average' ? 'Floor' : floorLabel}</span>
                <span className="font-bold">{fmt(hp.floor, isPct)}</span>
              </div>
              {target != null && (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: COLORS.target }} />Target</span>
                  <span className="font-bold">{fmtTick(target, isPct)}</span>
                </div>
              )}
              {gap != null && (
                <div className="flex items-center justify-between gap-2 pt-1 mt-1 border-t border-white/10">
                  <span>Gap vs floor</span>
                  <span className={`font-bold ${gapGood ? 'text-emerald-400' : 'text-red-400'}`}>
                    {gap > 0 ? '+' : ''}
                    {Number(gap.toFixed(2))}
                    {isPct ? ' pts' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small "change vs previous period" indicator
// ---------------------------------------------------------------------------
function Delta({ now, before, isPct, lowerIsBetter }: { now: number | null; before: number | null; isPct: boolean; lowerIsBetter: boolean }) {
  if (now == null || before == null) return <span className="text-[11px] text-slate-400">No previous period</span>;
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
      {up ? '+' : ''}
      {Number(d.toFixed(2))}
      {isPct ? ' pts' : ''} vs previous
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------
export function TeamTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {}, kpiTargets = {}, dailyProgressData = [] } = useMetrics() as any;
  const [graphMetricKey, setGraphMetricKey] = useState('CSAT %');

  const hasData = Object.keys(teamMetrics).length > 0 || agentMetrics.length > 0;
  const metric = METRICS.find((c) => c.name === graphMetricKey) || METRICS[0];

  // CSAT % and KSCAT % use the Overview calculation (selected roster); every other metric reads the Team Overall figure
  const overview = computeOverviewTeam(agentMetrics, kpiTargets, teamMetrics);
  const teamOverride = (m: MetricDef): number | null => {
    if (!overview.hasAgents) return null;
    if (m.name === 'CSAT %') return overview.csatPct;
    if (m.name === 'KSCAT %') return overview.kscatPct;
    return null;
  };
  const teamCurrent = (m: MetricDef): number | null => teamOverride(m) ?? getNum(teamMetrics, m.keys, m.isPct);

  // chart series for the selected metric (oldest -> newest)
  const basePoints: ChartPoint[] = [...dailyProgressData]
    .sort((a: any, b: any) => String(a.period).localeCompare(String(b.period)))
    .map((d: any) => ({
      period: String(d.period),
      team: getNum(d.teamMetrics, metric.keys, metric.isPct),
      floor: getNum(d.floorMetrics, metric.keys, metric.isPct),
    }));

  // the newest point shows the same Team number as the Overview tab; older days come from the saved daily backups
  const liveTeam = teamOverride(metric);
  const points: ChartPoint[] =
    liveTeam != null && basePoints.length
      ? basePoints.map((p, i) => (i === basePoints.length - 1 ? { ...p, team: liveTeam } : p))
      : basePoints;

  const lastIdx = (key: 'team' | 'floor') => {
    for (let i = points.length - 1; i >= 0; i--) if (points[i][key] != null) return i;
    return -1;
  };
  const latestOf = (key: 'team' | 'floor'): number | null => {
    const i = lastIdx(key);
    return i < 0 ? null : (points[i][key] as number);
  };
  const previousOf = (key: 'team' | 'floor'): number | null => {
    const i = lastIdx(key);
    for (let j = i - 1; j >= 0; j--) if (points[j][key] != null) return points[j][key] as number;
    return null;
  };

  const currentTeam = teamCurrent(metric);
  const currentFloor = getNum(floorAverages, metric.keys, metric.isPct);
  const teamNow = latestOf('team') ?? currentTeam;
  const floorNow = latestOf('floor') ?? currentFloor;

  const targetValue = resolveTarget(kpiTargets[metric.targetKey], metric.defaultTarget);
  const targetOk = isPlausibleTarget(targetValue, teamNow ?? floorNow);

  const gapNow = teamNow != null && floorNow != null ? teamNow - floorNow : null;
  const gapGood = gapNow == null ? null : metric.lowerIsBetter ? gapNow <= 0 : gapNow >= 0;
  const meetingTarget =
    teamNow == null || !targetOk ? null : metric.lowerIsBetter ? teamNow <= targetValue : teamNow >= targetValue;

  const anyBadTarget = METRICS.some((m) => {
    const t = resolveTarget(kpiTargets[m.targetKey], m.defaultTarget);
    const ref = teamCurrent(m) ?? getNum(floorAverages, m.keys, m.isPct);
    return !isPlausibleTarget(t, ref);
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users2 className="h-6 w-6 text-emerald-500" /> Team vs. Floor Benchmark Overview
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Multi-series progress tracking comparing Team performance trajectory against Floor averages across daily backups
        </p>
      </div>

      {!hasData ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No team operational data available.</p>
          <p className="text-xs mt-1">Upload KSCAT Calc, PVF, and Metrics CSV files under Data & Backups to render live benchmarks.</p>
        </Card>
      ) : (
        <>
          {anyBadTarget && (
            <div className="p-3 rounded-xl text-xs flex items-start gap-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Some configured targets look far from the real values (for example a target of 1 for a metric that is around 60). Those targets are
                hidden from the chart and not used for the status. Please review the targets in the Overview tab.
              </span>
            </div>
          )}

          {/* METRIC PICKER */}
          <div className="flex flex-wrap gap-2">
            {METRICS.map((m) => {
              const active = m.name === metric.name;
              return (
                <button
                  key={m.name}
                  type="button"
                  onClick={() => setGraphMetricKey(m.name)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-emerald-500/60'
                  }`}
                >
                  {m.short}
                </button>
              );
            })}
          </div>

          {/* KPI SUMMARY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COLORS.team }} /> Team (latest)
                </div>
                <div className="text-2xl font-black" style={{ color: COLORS.team }}>{fmt(teamNow, metric.isPct)}</div>
                {liveTeam != null ? (
                  <span className="text-[11px] text-slate-400">Same value as the Overview tab</span>
                ) : (
                  <Delta now={latestOf('team')} before={previousOf('team')} isPct={metric.isPct} lowerIsBetter={!!metric.lowerIsBetter} />
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COLORS.floor }} /> Floor average (latest)
                </div>
                <div className="text-2xl font-black" style={{ color: COLORS.floor }}>{fmt(floorNow, metric.isPct)}</div>
                <Delta now={latestOf('floor')} before={previousOf('floor')} isPct={metric.isPct} lowerIsBetter={!!metric.lowerIsBetter} />
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-500">Gap vs floor</div>
                <div className={`text-2xl font-black ${gapGood == null ? 'text-slate-400' : gapGood ? 'text-emerald-500' : 'text-red-500'}`}>
                  {gapNow == null ? '-' : `${gapNow > 0 ? '+' : ''}${Number(gapNow.toFixed(2))}${metric.isPct ? ' pts' : ''}`}
                </div>
                <div className="text-[11px] text-slate-400">
                  {gapGood == null ? 'Not enough data' : gapGood ? 'Team is ahead of the floor' : 'Team is behind the floor'}
                  {metric.lowerIsBetter ? ' (lower is better)' : ''}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardContent className="p-4 space-y-1">
                <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                  <TargetIcon className="h-3 w-3" style={{ color: COLORS.target }} /> Target {targetOk ? fmtTick(targetValue, metric.isPct) : ''}
                </div>
                <div
                  className={`text-xl font-black ${
                    !targetOk ? 'text-amber-500' : meetingTarget == null ? 'text-slate-400' : meetingTarget ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {!targetOk ? 'Check target' : meetingTarget == null ? '-' : meetingTarget ? 'Meeting target' : 'Missing target'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {!targetOk
                    ? `Saved target is ${fmtTick(targetValue, metric.isPct)}, which looks wrong`
                    : teamNow == null
                    ? 'Not enough data'
                    : `${Number(Math.abs(teamNow - targetValue).toFixed(2))}${metric.isPct ? ' pts' : ''} ${
                        (teamNow - targetValue >= 0) === !metric.lowerIsBetter ? 'better than' : 'worse than'
                      } target`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* TREND CHART */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {metric.name} – Progress Trajectory
              </CardTitle>
              <CardDescription className="text-xs">
                Team vs floor average for each daily backup{metric.lowerIsBetter ? ' · lower is better for this metric' : ''}
                {liveTeam != null ? ' · the latest Team value matches the Overview tab (selected roster)' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <TrendChart
                points={points}
                target={targetOk ? targetValue : null}
                isPct={metric.isPct}
                lowerIsBetter={!!metric.lowerIsBetter}
              />
            </CardContent>
          </Card>

          {/* SCORECARD */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" /> Benchmark Scorecard
              </CardTitle>
              <CardDescription className="text-xs">Click a row to show it in the chart above</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table className="text-xs min-w-[820px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Metric Name</TableHead>
                      <TableHead>Team Value</TableHead>
                      <TableHead>Floor Average</TableHead>
                      <TableHead>Gap</TableHead>
                      <TableHead>Configured Target</TableHead>
                      <TableHead>Vs Target</TableHead>
                      <TableHead className="text-right">Status vs Floor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {METRICS.map((item) => {
                      const t = teamCurrent(item);
                      const f = getNum(floorAverages, item.keys, item.isPct);
                      const target = resolveTarget(kpiTargets[item.targetKey], item.defaultTarget);
                      const okTarget = isPlausibleTarget(target, t ?? f);
                      const gap = t != null && f != null ? t - f : null;
                      const better = gap == null ? null : item.lowerIsBetter ? gap <= 0 : gap >= 0;
                      const meets = t == null || !okTarget ? null : item.lowerIsBetter ? t <= target : t >= target;
                      const active = item.name === metric.name;

                      return (
                        <TableRow
                          key={item.name}
                          onClick={() => setGraphMetricKey(item.name)}
                          className={`cursor-pointer hover:bg-slate-500/5 ${active ? 'bg-emerald-500/5' : ''}`}
                        >
                          <TableCell className="font-semibold">
                            {item.name}
                            {item.lowerIsBetter && <span className="ml-1.5 text-[10px] font-normal text-slate-400">(lower is better)</span>}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-500">{fmt(t, item.isPct)}</TableCell>
                          <TableCell className="text-blue-500 font-semibold">{fmt(f, item.isPct)}</TableCell>
                          <TableCell className={`font-semibold ${better == null ? 'text-slate-400' : better ? 'text-emerald-500' : 'text-red-500'}`}>
                            {gap == null ? '-' : `${gap > 0 ? '+' : ''}${Number(gap.toFixed(2))}${item.isPct ? ' pts' : ''}`}
                          </TableCell>
                          <TableCell className={`font-bold ${okTarget ? 'text-amber-500' : 'text-amber-500/70'}`}>
                            {fmtTick(target, item.isPct)}
                          </TableCell>
                          <TableCell>
                            {!okTarget ? (
                              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40 gap-1 font-semibold">
                                <AlertTriangle className="h-3 w-3" /> Check target
                              </Badge>
                            ) : meets == null ? (
                              <span className="text-muted-foreground">-</span>
                            ) : meets ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-semibold">Meeting</Badge>
                            ) : (
                              <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 font-semibold">Missing</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {better == null ? (
                              <span className="text-muted-foreground">-</span>
                            ) : better ? (
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 gap-1 font-semibold">
                                <TrendingUp className="h-3 w-3" /> Outperforming
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40 gap-1 font-semibold">
                                <TrendingDown className="h-3 w-3" /> Lagging Floor
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
