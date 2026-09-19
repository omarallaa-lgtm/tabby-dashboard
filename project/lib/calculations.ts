/**
 * Tabby.ai Performance Dashboard — Calculation Engine
 * SINGLE source of truth for all KPI math (see spec §36).
 */

export interface KscatRow {
  resolver: string;
  resolvedGroup: string;
  assignee: string;
  agentGroup: string;
  resolvedDate: string;
  ticketId: string;
  crmLink: string;
  ticketChannel: 'chat' | 'phone' | 'email' | string;
  csat: 'good' | 'bad' | string;
}

export interface PvfRow {
  agentEmail: string;
  timeNotWorkingAdjustedH: number;
  tardyDayFraction: number;
}

export interface MetricsRow {
  agentEmail: string;
  metricName: string;
  metricValue: number;
}

export interface NamedMetric {
  name: string;
  value: number | null;
}

export interface KscatResult {
  csat: number;
  kscat: number;
  dsat: number;
  totalCount: number;
  totalWithoutKarma: number;
  kscatPct: number;
  csatPct: number;
  variance: number;
}

export function calcAgentKscat(
  rows: KscatRow[],
  agentEmail: string,
  channel?: 'chat' | 'phone'
): KscatResult {
  let csat = 0, kscat = 0, dsat = 0;

  for (const row of rows) {
    if (row.assignee !== agentEmail) continue;
    if (channel && row.ticketChannel !== channel) continue;

    if (row.csat === 'good') {
      csat++;
    } else if (row.csat === 'bad') {
      if (row.resolver !== agentEmail) kscat++;
      else dsat++;
    }
  }

  return buildKscatResult(csat, kscat, dsat);
}

export function calcTeamKscat(rows: KscatRow[], channel?: 'chat' | 'phone'): KscatResult {
  let csat = 0, kscat = 0, dsat = 0;

  for (const row of rows) {
    if (channel && row.ticketChannel !== channel) continue;
    if (row.csat === 'good') {
      csat++;
    } else if (row.csat === 'bad') {
      if (row.resolver !== row.assignee) kscat++;
      else dsat++;
    }
  }

  return buildKscatResult(csat, kscat, dsat);
}

function buildKscatResult(csat: number, kscat: number, dsat: number): KscatResult {
  const totalCount = csat + kscat + dsat;
  const totalWithoutKarma = csat + dsat;
  const kscatPct = totalCount > 0 ? csat / totalCount : 0;
  const csatPct = totalWithoutKarma > 0 ? csat / totalWithoutKarma : 0;
  return {
    csat,
    kscat,
    dsat,
    totalCount,
    totalWithoutKarma,
    kscatPct,
    csatPct,
    variance: csatPct - kscatPct,
  };
}

export interface PvfResult {
  tardyDayFraction: number;
  idleTimeAvgHours: number;
}

export function calcAgentPvf(rows: PvfRow[], agentEmail: string): PvfResult {
  const agentRows = rows.filter(r => r.agentEmail === agentEmail);

  const tardyDayFraction = agentRows
    .map(r => r.tardyDayFraction)
    .filter(v => v > 0)
    .reduce((a, b) => a + b, 0);

  const idleValues = agentRows.map(r => r.timeNotWorkingAdjustedH);
  const idleTimeAvgHours = idleValues.length
    ? idleValues.reduce((a, b) => a + b, 0) / idleValues.length
    : 0;

  return { tardyDayFraction, idleTimeAvgHours };
}

export function calcTeamTardy(rows: PvfRow[], rosterEmails: string[]): number {
  const rosterSet = new Set(rosterEmails);
  return rows
    .filter(r => rosterSet.has(r.agentEmail) && r.tardyDayFraction > 0)
    .reduce((sum, r) => sum + r.tardyDayFraction, 0);
}

export function formatDayFractionAsClock(dayFraction: number): string {
  const totalSeconds = Math.round(dayFraction * 86400);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const METRIC_NAME_MAP = {
  abt: 'Average basket time',
  productivity8hrs: 'Productivity 8-hrs',
  productivityOnline8hrs: 'Productivity Online 8-hrs',
  escalationRate: 'Escalation rate %',
  deescalationRate: 'Deescalation rate %',
  adherence: 'Adherence, %',
  agbt: 'Average group basket time',
  aht: 'Average handling time',
  closedAfterResolution: 'Closed after resolution, %',
  closedTickets: 'Closed tickets, %',
  fcr: 'FCR, %',
} as const;

export type MetricKey = keyof typeof METRIC_NAME_MAP;

export function getAgentMetric(rows: MetricsRow[], agentEmail: string, key: MetricKey): number | null {
  const metricName = METRIC_NAME_MAP[key];
  const matches = rows.filter(r => r.agentEmail === agentEmail && r.metricName === metricName);
  if (matches.length === 0) return null;
  return matches.reduce((sum, r) => sum + r.metricValue, 0);
}

export function getAllAgentMetrics(rows: MetricsRow[], agentEmail: string): Record<MetricKey, number | null> {
  const result = {} as Record<MetricKey, number | null>;
  for (const key of Object.keys(METRIC_NAME_MAP) as MetricKey[]) {
    result[key] = getAgentMetric(rows, agentEmail, key);
  }
  return result;
}

export function getNamedMetric(block: NamedMetric[], name: string): number | null {
  const match = block.find(m => m.name === name);
  return match ? match.value : null;
}

export function formatPct(fraction: number | null, decimals = 2): string {
  if (fraction === null || fraction === undefined) return '';
  const normalized = Math.abs(fraction) <= 1.0 && fraction !== 0 ? fraction * 100 : fraction;
  return `${normalized.toFixed(decimals)}%`;
}
