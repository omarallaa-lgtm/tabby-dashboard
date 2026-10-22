'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase, useMetrics } from '@/lib/metrics-context';
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
  keys: string[]; // floor / team keys in the saved Team & Floor figures
  targetKey: string;
  defaultTarget: number;
  isPct: boolean;
  lowerIsBetter?: boolean;
  survey?: SurveyKind; // team value is calculated from the agents' survey counts (like the Overview tables)
}

// ---------------------------------------------------------------------------
// Survey-based percentages, exactly like the Overview tables:
//   CSAT %       = CSAT / (CSAT + DSAT)                 (all channels, "1. Overall Performance Table")
//   Chat CSAT %  = chat CSAT / (chat CSAT + chat DSAT)  ("4. Chat Performance Table")
//   Phone CSAT % = phone CSAT / (phone CSAT + phone DSAT) ("5. Phone Performance Table")
//   KSCAT %      = CSAT / (CSAT + KSCAT + DSAT)
// ---------------------------------------------------------------------------
export type SurveyKind = 'csat' | 'chat' | 'phone' | 'kscat';

export const CSAT_COLORS = { overall: '#10b981', chat: '#38bdf8', phone: '#a78bfa' };

export const surveyPct = (rows: any[], kind: SurveyKind): number | null => {
  let c = 0;
  let k = 0;
  let d = 0;
  const prefix = kind === 'chat' ? 'chat_' : kind === 'phone' ? 'phone_' : '';
  rows.forEach((r) => {
    if (!r) return;
    c += Number(r[`${prefix}csat`]) || 0;
    k += Number(r[`${prefix}kscat`]) || 0;
    d += Number(r[`${prefix}dsat`]) || 0;
  });
  if (kind === 'kscat') return c + k + d > 0 ? (c / (c + k + d)) * 100 : null;
  return c + d > 0 ? (c / (c + d)) * 100 : null;
};

// The roster selected in the Overview tab (gear icon). Empty / invalid roster = all agents.
export const rosterEmails = (agentMetrics: any[], kpiTargets: Record<string, any>, teamMetrics: Record<string, any>): Set<string> => {
  const allEmails = Array.from(new Set(agentMetrics.map((a: any) => a.agent_email)));
  const globalRoster = kpiTargets.active_roster_emails || teamMetrics.active_roster_emails;
  if (Array.isArray(globalRoster) && globalRoster.length > 0) {
    const valid = globalRoster.filter((e: string) => allEmails.includes(e));
    if (valid.length > 0) return new Set(valid);
  }
  return new Set(allEmails);
};

const METRICS: MetricDef[] = [
  // CSAT % and KSCAT % are calculated from the survey counts of every upload (selected roster),
  // exactly like the Overview tables, so old and new points always use the same formula.
  { name: 'CSAT %', short: 'CSAT', keys: [], targetKey: 'csatPercent', defaultTarget: 85, isPct: true, survey: 'csat' },
  { name: 'KSCAT %', short: 'KSCAT', keys: ['KSCAT %', 'kscatPercent'], targetKey: 'kscatPercent', defaultTarget: 35, isPct: true, survey: 'kscat' },
  { name: 'Adherence %', short: 'Adherence', keys: ['Adherence, %', 'adherencePercent'], targetKey: 'adherencePercent', defaultTarget: 90, isPct: true },
  { name: 'AHT (Average Handling Time)', short: 'AHT', keys: ['Average handling time', 'aht'], targetKey: 'aht', defaultTarget: 5, isPct: false, lowerIsBetter: true },
  { name: 'ABT (Average Basket Time)', short: 'ABT', keys: ['Average basket time', 'abt'], targetKey: 'abt', defaultTarget: 14, isPct: false, lowerIsBetter: true },
  { name: 'Productivity 8-hrs', short: 'Productivity', keys: ['Productivity 8-hrs', 'productivity8hrs'], targetKey: 'productivity8hrs', defaultTarget: 30, isPct: false },
  { name: 'Escalation Rate %', short: 'Escalation', keys: ['Escalation rate %', 'escalationRate'], targetKey: 'escalationRate', defaultTarget: 4.5, isPct: true, lowerIsBetter: true },
  { name: 'Deescalation Rate %', short: 'Deescalation', keys: ['Deescalation rate %', 'deescalationRate'], targetKey: 'deescalationRate', defaultTarget: 4.0, isPct: true },
  { name: 'FCR %', short: 'FCR', keys: ['FCR, %', 'fcrPercent'], targetKey: 'fcrPercent', defaultTarget: 70, isPct: true },
];

// Extra scorecard rows shown under CSAT % (clicking them opens the CSAT channel chart)
const CHANNEL_ROWS: MetricDef[] = [
  { name: 'Chat CSAT %', short: 'Chat CSAT', keys: [], targetKey: 'csatPercent', defaultTarget: 85, isPct: true, survey: 'chat' },
  { name: 'Phone CSAT %', short: 'Phone CSAT', keys: [], targetKey: 'csatPercent', defaultTarget: 85, isPct: true, survey: 'phone' },
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

export interface ChartSeries {
  key: string;
  label: string; // legend text
  short?: string; // tooltip text (defaults to label)
  color: string;
  values: (number | null)[]; // one value per period (null = no data that day)
  area?: boolean; // soft gradient under the line
  width?: number; // line width
}

// ---------------------------------------------------------------------------
// Interactive trend chart: any number of lines (responsive, hover tooltip, clickable legend)
// ---------------------------------------------------------------------------
export function MultiTrendChart({
  periods,
  series,
  target,
  isPct,
  lowerIsBetter,
  gapPair,
  emptyText = 'No data for this metric in the daily backups yet',
}: {
  periods: string[];
  series: ChartSeries[];
  target: number | null;
  isPct: boolean;
  lowerIsBetter: boolean;
  gapPair?: [string, string]; // show "Gap vs <second>" in the tooltip
  emptyText?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hover, setHover] = useState<number | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const visible = (key: string) => !hidden[key];

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
  const n = periods.length;

  // ----- y domain from the visible series only -----
  const vals: number[] = [];
  series.forEach((s) => {
    if (visible(s.key)) s.values.forEach((v) => v != null && vals.push(v));
  });
  if (visible('target') && target != null) vals.push(target);

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

  const buildRuns = (values: (number | null)[]) => {
    const runs: { x: number; y: number }[][] = [];
    let cur: { x: number; y: number }[] = [];
    values.forEach((v, i) => {
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

  const drawn = series.map((s) => {
    const runs = buildRuns(s.values);
    return {
      s,
      path: runs.map(monotonePath).join(' '),
      area: s.area
        ? runs
            .filter((r) => r.length > 1)
            .map((r) => `${monotonePath(r)} L ${r[r.length - 1].x.toFixed(1)} ${baseY} L ${r[0].x.toFixed(1)} ${baseY} Z`)
            .join(' ')
        : '',
    };
  });
  // first series is drawn last so it sits on top
  const drawOrder = [...drawn].reverse();

  const maxLabels = Math.max(2, Math.floor(plotW / 64));
  const every = Math.max(1, Math.ceil(n / maxLabels));
  const dotR = n > 24 ? 2 : 3.5;

  const hasAnyData = series.some((s) => s.values.some((v) => v != null));

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let idx = n === 1 ? 0 : Math.round(((px - padL) / plotW) * (n - 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHover(idx);
  };

  const hx = hover != null ? xOf(hover) : 0;
  const tipLeft = Math.max(4, hx > width * 0.6 ? hx - 196 : hx + 14);
  const valueAt = (key: string, i: number) => series.find((s) => s.key === key)?.values[i] ?? null;
  let gap: number | null = null;
  if (hover != null && gapPair) {
    const a = valueAt(gapPair[0], hover);
    const b = valueAt(gapPair[1], hover);
    gap = a != null && b != null ? a - b : null;
  }
  const gapGood = gap == null ? null : lowerIsBetter ? gap <= 0 : gap >= 0;
  const gapName = gapPair ? (series.find((s) => s.key === gapPair[1])?.short || gapPair[1]).toLowerCase() : '';

  const legendBtn = (key: string, label: string, color: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setHidden((h) => ({ ...h, [key]: !h[key] }))}
      title="Click to show / hide"
      className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-opacity ${
        visible(key) ? 'border-slate-300 dark:border-slate-700 opacity-100' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-40'
      }`}
    >
      <span className="h-2.5 w-2.5 rounded-sm inline-block shrink-0" style={{ background: color }} />
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {series.map((s) => legendBtn(s.key, s.label, s.color))}
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
          aria-label="Trend chart"
        >
          <defs>
            {series
              .filter((s) => s.area)
              .map((s) => (
                <linearGradient key={s.key} id={`tt-area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={s.color} stopOpacity="0.28" />
                  <stop offset="1" stopColor={s.color} stopOpacity="0" />
                </linearGradient>
              ))}
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
          {periods.map((p, i) =>
            i % every === 0 ? (
              <text key={i} x={xOf(i)} y={H - 12} textAnchor="middle" fill="currentColor" fillOpacity="0.75" fontSize="10.5" fontFamily="sans-serif">
                {fmtPeriod(p)}
              </text>
            ) : null
          )}

          {/* target */}
          {visible('target') && target != null && (
            <g>
              <line x1={padL} y1={yOf(target)} x2={width - padR} y2={yOf(target)} stroke={COLORS.target} strokeWidth="1.5" strokeDasharray="5 4" />
              <text x={width - padR} y={yOf(target) - 5} textAnchor="end" fill={COLORS.target} fontSize="10.5" fontWeight="600" fontFamily="sans-serif">
                Target {fmtTick(target, isPct)}
              </text>
            </g>
          )}

          {/* areas, lines, dots */}
          {drawOrder.map(({ s, area }) => (visible(s.key) && area ? <path key={`a${s.key}`} d={area} fill={`url(#tt-area-${s.key})`} /> : null))}
          {drawOrder.map(({ s, path }) =>
            visible(s.key) && path ? (
              <path key={`l${s.key}`} d={path} fill="none" stroke={s.color} strokeWidth={s.width ?? 2.5} strokeLinecap="round" strokeLinejoin="round" />
            ) : null
          )}
          {drawOrder.map(({ s }) =>
            visible(s.key)
              ? s.values.map((v, i) => (v != null ? <circle key={`d${s.key}${i}`} cx={xOf(i)} cy={yOf(v)} r={dotR} fill={s.color} /> : null))
              : null
          )}

          {/* hover crosshair */}
          {hover != null && (
            <g pointerEvents="none">
              <line x1={hx} y1={padT} x2={hx} y2={baseY} stroke="currentColor" strokeOpacity="0.35" strokeDasharray="3 3" />
              {drawOrder.map(({ s }) => {
                const v = s.values[hover];
                return visible(s.key) && v != null ? (
                  <circle key={`h${s.key}`} cx={hx} cy={yOf(v)} r="5.5" fill={s.color} stroke="#fff" strokeWidth="2" />
                ) : null;
              })}
            </g>
          )}

          {!hasAnyData && (
            <text x={width / 2} y={H / 2} textAnchor="middle" fill="currentColor" fillOpacity="0.7" fontSize="13" fontFamily="sans-serif">
              {emptyText}
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

        {hover != null && (
          <div
            className="pointer-events-none absolute z-10 w-[182px] rounded-lg border border-white/15 p-2.5 text-xs text-slate-100 shadow-lg"
            style={{ left: tipLeft, top: padT, background: 'rgba(11, 18, 32, 0.96)' }}
          >
            <div className="font-bold mb-1.5">{periods[hover]}</div>
            <div className="space-y-1">
              {series.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                    {s.short || s.label}
                  </span>
                  <span className="font-bold">{fmt(s.values[hover], isPct)}</span>
                </div>
              ))}
              {target != null && (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: COLORS.target }} />Target</span>
                  <span className="font-bold">{fmtTick(target, isPct)}</span>
                </div>
              )}
              {gap != null && (
                <div className="flex items-center justify-between gap-2 pt-1 mt-1 border-t border-white/10">
                  <span>Gap vs {gapName}</span>
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

// Two-line version (team / me vs floor), used for every metric except the CSAT channel view
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
  return (
    <MultiTrendChart
      periods={points.map((p) => p.period)}
      series={[
        { key: 'team', label: teamLabel, short: teamLabel === 'Team Score' ? 'Team' : teamLabel, color: COLORS.team, values: points.map((p) => p.team), area: true, width: 3 },
        { key: 'floor', label: floorLabel, short: floorLabel === 'Floor Average' ? 'Floor' : floorLabel, color: COLORS.floor, values: points.map((p) => p.floor), width: 2.5 },
      ]}
      target={target}
      isPct={isPct}
      lowerIsBetter={lowerIsBetter}
      gapPair={['team', 'floor']}
    />
  );
}

// Overall / Chat / Phone CSAT % lines (same formula as the Overview tables: CSAT ÷ (CSAT + DSAT))
export function CsatChannelChart({
  periods,
  overall,
  chat,
  phone,
  target,
  overallLabel = 'Overall CSAT',
}: {
  periods: string[];
  overall: (number | null)[];
  chat: (number | null)[];
  phone: (number | null)[];
  target: number | null;
  overallLabel?: string;
}) {
  return (
    <MultiTrendChart
      periods={periods}
      series={[
        { key: 'overall', label: overallLabel, short: 'Overall', color: CSAT_COLORS.overall, values: overall, area: true, width: 3 },
        { key: 'chat', label: 'Chat CSAT', short: 'Chat', color: CSAT_COLORS.chat, values: chat, width: 2.5 },
        { key: 'phone', label: 'Phone CSAT', short: 'Phone', color: CSAT_COLORS.phone, values: phone, width: 2.5 },
      ]}
      target={target}
      isPct
      lowerIsBetter={false}
      emptyText="No survey data in the daily backups yet"
    />
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

  // Survey counts of every agent for every upload (to rebuild CSAT / Chat / Phone / KSCAT history)
  const [surveyRows, setSurveyRows] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all: any[] = [];
        for (let from = 0; from < 50000; from += 1000) {
          const { data, error } = await supabase
            .from('agent_metrics')
            .select('period_id, created_at, agent_email, csat, kscat, dsat, chat_csat, chat_kscat, chat_dsat, phone_csat, phone_kscat, phone_dsat')
            .range(from, from + 999);
          if (error) throw error;
          all.push(...(data || []));
          if (!data || data.length < 1000) break;
        }
        if (!cancelled) setSurveyRows(all);
      } catch (e) {
        console.error('Could not load survey history:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agentMetrics]);

  const hasData = Object.keys(teamMetrics).length > 0 || agentMetrics.length > 0;
  const metric = METRICS.find((c) => c.name === graphMetricKey) || METRICS[0];
  const isCsatView = metric.survey === 'csat';

  // ----- survey history: selected roster, grouped by upload date -----
  const roster = rosterEmails(agentMetrics, kpiTargets, teamMetrics);
  const rowsByPeriod = new Map<string, any[]>();
  surveyRows.forEach((r: any) => {
    if (!roster.has(r.agent_email)) return;
    const period = String(r.period_id || String(r.created_at || '').slice(0, 10));
    if (!period) return;
    if (!rowsByPeriod.has(period)) rowsByPeriod.set(period, []);
    rowsByPeriod.get(period)!.push(r);
  });
  const surveyPeriods = Array.from(rowsByPeriod.keys()).sort((a, b) => a.localeCompare(b));
  const surveySeries = (kind: SurveyKind) => surveyPeriods.map((p) => surveyPct(rowsByPeriod.get(p) || [], kind));

  // fallback while the history loads: the latest row of each agent (same as the Overview tab)
  const latestRosterRows = (() => {
    const unique = new Map<string, any>();
    agentMetrics.forEach((a: any) => {
      if (!unique.has(a.agent_email)) unique.set(a.agent_email, a);
    });
    return Array.from(unique.values()).filter((a: any) => roster.has(a.agent_email));
  })();

  const lastNonNull = (vals: (number | null)[]) => {
    for (let i = vals.length - 1; i >= 0; i--) if (vals[i] != null) return i;
    return -1;
  };
  const latestAndPrevious = (vals: (number | null)[]) => {
    const i = lastNonNull(vals);
    let before: number | null = null;
    for (let j = i - 1; j >= 0; j--)
      if (vals[j] != null) {
        before = vals[j];
        break;
      }
    return { now: i < 0 ? null : vals[i], before };
  };

  const surveyNow = (kind: SurveyKind) => {
    const { now } = latestAndPrevious(surveySeries(kind));
    return now ?? surveyPct(latestRosterRows, kind);
  };

  const teamCurrent = (m: MetricDef): number | null => (m.survey ? surveyNow(m.survey) : getNum(teamMetrics, m.keys, m.isPct));

  // ----- chart series for the selected metric (oldest -> newest) -----
  const floorByPeriod = new Map<string, Record<string, any>>();
  const teamByPeriod = new Map<string, Record<string, any>>();
  (dailyProgressData as any[]).forEach((d: any) => {
    floorByPeriod.set(String(d.period), d.floorMetrics || {});
    teamByPeriod.set(String(d.period), d.teamMetrics || {});
  });
  const allPeriods = Array.from(new Set([...Array.from(floorByPeriod.keys()), ...(metric.survey ? surveyPeriods : [])])).sort((a, b) =>
    a.localeCompare(b)
  );
  const points: ChartPoint[] = allPeriods.map((period) => ({
    period,
    team: metric.survey
      ? rowsByPeriod.has(period)
        ? surveyPct(rowsByPeriod.get(period) || [], metric.survey)
        : null
      : getNum(teamByPeriod.get(period), metric.keys, metric.isPct),
    floor: getNum(floorByPeriod.get(period), metric.keys, metric.isPct),
  }));

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

  // ----- CSAT channel view -----
  const csatChannels = [
    { kind: 'csat' as SurveyKind, label: 'Overall CSAT', color: CSAT_COLORS.overall, values: surveySeries('csat') },
    { kind: 'chat' as SurveyKind, label: 'Chat CSAT', color: CSAT_COLORS.chat, values: surveySeries('chat') },
    { kind: 'phone' as SurveyKind, label: 'Phone CSAT', color: CSAT_COLORS.phone, values: surveySeries('phone') },
  ].map((c) => {
    const { now, before } = latestAndPrevious(c.values);
    return { ...c, now: now ?? surveyPct(latestRosterRows, c.kind), before };
  });
  const overallNow = csatChannels[0].now;
  const csatTargetOk = isPlausibleTarget(targetValue, overallNow);
  const csatMeeting = overallNow == null || !csatTargetOk ? null : overallNow >= targetValue;

  // scorecard rows: CSAT %, then Chat / Phone CSAT %, then the rest
  const scorecardRows: MetricDef[] = [METRICS[0], ...CHANNEL_ROWS, ...METRICS.slice(1)];

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
                  {m.survey === 'csat' ? 'CSAT · Chat · Phone' : m.short}
                </button>
              );
            })}
          </div>

          {/* KPI SUMMARY */}
          {isCsatView ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {csatChannels.map((c) => (
                <Card key={c.kind} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <CardContent className="p-4 space-y-1">
                    <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-sm" style={{ background: c.color }} /> {c.label} (latest)
                    </div>
                    <div className="text-2xl font-black" style={{ color: c.color }}>{fmt(c.now, true)}</div>
                    <Delta now={c.now} before={c.before} isPct lowerIsBetter={false} />
                  </CardContent>
                </Card>
              ))}

              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardContent className="p-4 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <TargetIcon className="h-3 w-3" style={{ color: COLORS.target }} /> Target {csatTargetOk ? fmtTick(targetValue, true) : ''}
                  </div>
                  <div
                    className={`text-xl font-black ${
                      !csatTargetOk ? 'text-amber-500' : csatMeeting == null ? 'text-slate-400' : csatMeeting ? 'text-emerald-500' : 'text-red-500'
                    }`}
                  >
                    {!csatTargetOk ? 'Check target' : csatMeeting == null ? '-' : csatMeeting ? 'Meeting target' : 'Missing target'}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {!csatTargetOk
                      ? `Saved target is ${fmtTick(targetValue, true)}, which looks wrong`
                      : overallNow == null
                      ? 'Not enough data'
                      : `Overall is ${Number(Math.abs(overallNow - targetValue).toFixed(2))} pts ${overallNow >= targetValue ? 'above' : 'below'} target`}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardContent className="p-4 space-y-1">
                  <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: COLORS.team }} /> Team (latest)
                  </div>
                  <div className="text-2xl font-black" style={{ color: COLORS.team }}>{fmt(teamNow, metric.isPct)}</div>
                  <Delta now={latestOf('team')} before={previousOf('team')} isPct={metric.isPct} lowerIsBetter={!!metric.lowerIsBetter} />
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
          )}

          {/* TREND CHART */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-700 dark:text-slate-200">
                {isCsatView ? 'CSAT % – Overall, Chat & Phone Progress' : `${metric.name} – Progress Trajectory`}
              </CardTitle>
              <CardDescription className="text-xs">
                {isCsatView
                  ? 'Team CSAT ÷ (CSAT + DSAT) for each daily upload, calculated like the Overview tables (selected roster)'
                  : `Team vs floor average for each daily backup${metric.lowerIsBetter ? ' · lower is better for this metric' : ''}${
                      metric.survey ? ' · Team value calculated from the survey counts (selected roster), like the Overview tab' : ''
                    }`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              {isCsatView ? (
                <CsatChannelChart
                  periods={surveyPeriods}
                  overall={csatChannels[0].values}
                  chat={csatChannels[1].values}
                  phone={csatChannels[2].values}
                  target={csatTargetOk ? targetValue : null}
                />
              ) : (
                <TrendChart
                  points={points}
                  target={targetOk ? targetValue : null}
                  isPct={metric.isPct}
                  lowerIsBetter={!!metric.lowerIsBetter}
                />
              )}
            </CardContent>
          </Card>

          {/* SCORECARD */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" /> Benchmark Scorecard
              </CardTitle>
              <CardDescription className="text-xs">
                Click a row to show it in the chart above · CSAT, Chat and Phone CSAT come from the survey counts, so the floor has no matching figure
              </CardDescription>
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
                    {scorecardRows.map((item) => {
                      const t = teamCurrent(item);
                      const f = getNum(floorAverages, item.keys, item.isPct);
                      const target = resolveTarget(kpiTargets[item.targetKey], item.defaultTarget);
                      const okTarget = isPlausibleTarget(target, t ?? f);
                      const gap = t != null && f != null ? t - f : null;
                      const better = gap == null ? null : item.lowerIsBetter ? gap <= 0 : gap >= 0;
                      const meets = t == null || !okTarget ? null : item.lowerIsBetter ? t <= target : t >= target;
                      const isChannelRow = item.survey === 'chat' || item.survey === 'phone';
                      const goTo = isChannelRow ? 'CSAT %' : item.name;
                      const active = goTo === metric.name;

                      return (
                        <TableRow
                          key={item.name}
                          onClick={() => setGraphMetricKey(goTo)}
                          className={`cursor-pointer hover:bg-slate-500/5 ${active ? 'bg-emerald-500/5' : ''}`}
                        >
                          <TableCell className={`font-semibold ${isChannelRow ? 'pl-6' : ''}`}>
                            {isChannelRow && (
                              <span
                                className="inline-block h-2 w-2 rounded-sm mr-1.5"
                                style={{ background: item.survey === 'chat' ? CSAT_COLORS.chat : CSAT_COLORS.phone }}
                              />
                            )}
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
