/**
 * Tabby.ai Performance Dashboard — Calculation Engine
 *
 * This module is the SINGLE source of truth for all KPI math (see spec §36).
 * Every formula below was verified against the live workbook
 * ("Performance Dashboard - 26") row-by-row and reconciles exactly with the
 * "Overall Performance", "Chat Performance", "Phone Performance",
 * "Team Performance", and "Floor Average" panels on the Dashboard tab.
 *
 * DO NOT alter the filtering logic in this file without re-verifying against
 * the source spreadsheet. See the two "gotchas" called out inline — these are
 * the two things that were silently producing wrong totals before.
 */

// ---------------------------------------------------------------------------
// Types matching the three raw source sheets
// ---------------------------------------------------------------------------

/** One row of the "KSCAT Calc" sheet */
export interface KscatRow {
  resolver: string;      // Column A — who actually closed the ticket
  resolvedGroup: string; // Column B
  assignee: string;      // Column C — the agent the ticket was assigned to
  agentGroup: string;    // Column D
  resolvedDate: string;  // Column E
  ticketId: string;      // Column F
  crmLink: string;       // Column G
  ticketChannel: 'chat' | 'phone' | 'email' | string; // Column H
  csat: 'good' | 'bad' | string;                       // Column I
}

/** One row of the "PVF" sheet */
export interface PvfRow {
  agentEmail: string;         // Column A
  timeNotWorkingAdjustedH: number; // Column L (decimal hours) — "Idle Time" source
  /**
   * Column AJ has NO header in the source file — it is a raw Excel time
   * value (fraction of a day, e.g. 1:33:00 -> 0.0649...). Read it as a
   * day-fraction, not as a plain number.
   */
  tardyDayFraction: number;
}

/** One row of the "Metrics" sheet, agent-level block (columns C/D/E) */
export interface MetricsRow {
  agentEmail: string;  // Column C
  metricName: string;  // Column D
  metricValue: number; // Column E (percentages stored as fractions, e.g. 0.046 = 4.6%)
}

/** One row of the K:L "Team Overall" or "Floor Average" block */
export interface NamedMetric {
  name: string;
  value: number | null;
}

// ---------------------------------------------------------------------------
// Section 1 — Per-agent KSCAT Calc metrics (spec §10)
// ---------------------------------------------------------------------------

export interface KscatResult {
  csat: number;
  kscat: number;
  dsat: number;
  totalCount: number;
  totalWithoutKarma: number;
  kscatPct: number; // CSAT / Total Count
  csatPct: number;  // CSAT / Total w/o Karma
  variance: number; // csatPct - kscatPct
}

/**
 * Reproduces:
 *   CSAT   = COUNTIFS(assignee=agent, csat="good")
 *   KSCAT  = COUNTIFS(assignee=agent, csat="bad", resolver<>agent)
 *   DSAT   = COUNTIFS(assignee=agent, csat="bad", resolver=agent)
 *
 * `channel` optionally restricts to a single ticket_channel, which is how the
 * "Chat Performance" and "Phone Performance" panels are derived from the
 * exact same rows — never re-implement those as separate logic.
 */
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

/**
 * ⚠️ GOTCHA #1 — Team/Floor-wide KSCAT totals.
 *
 * The "Team Performance" panel's CSAT/KSCAT/DSAT numbers are NOT the sum of
 * the individually-displayed agent rows. They are raw COUNTIFS over the
 * ENTIRE KSCAT Calc sheet for the period, with no agent filter whatsoever.
 *
 * Concretely: the source file has an assignee ("abdullah.mohamed@tabby.ai")
 * who never appears as his own row in "Overall Performance" (he has no
 * matching PVF/Metrics record) but DOES have 1 ticket in KSCAT Calc — and
 * that ticket IS counted in the Team totals. If you build team totals by
 * summing `calcAgentKscat()` over only your "known" agent roster, you will
 * silently undercount whenever a marginal/partial agent exists in the raw
 * ticket data. Always compute team/floor totals directly from the raw rows
 * for the relevant period — never as Σ(per-agent results).
 */
export function calcTeamKscat(rows: KscatRow[], channel?: 'chat' | 'phone'): KscatResult {
  let csat = 0, kscat = 0, dsat = 0;

  for (const row of rows) {
    if (channel && row.ticketChannel !== channel) continue;
    if (row.csat === 'good') {
      csat++;
    } else if (row.csat === 'bad') {
      // For the team aggregate, "resolver !== assignee" is the KSCAT test —
      // still per-row, just not filtered to a single agent.
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

// ---------------------------------------------------------------------------
// Section 2 — PVF metrics (spec §12)
// ---------------------------------------------------------------------------

/**
 * ⚠️ GOTCHA #2 — PVF team totals ARE roster-scoped (opposite of KSCAT Calc).
 *
 * The PVF sheet contains at least one agent ("mohamed.yasser@tabby.ai") who
 * is not part of this team/floor's displayed roster at all. The correct
 * "Total" row for Tardy/Minute sums ONLY the agents in the explicit
 * Floor -> Team -> Agent roster (spec §45) — not every distinct agent_email
 * found in the PVF sheet. Always pass the roster in explicitly; never derive
 * it from "whoever appears in this sheet".
 */
export interface PvfResult {
  /** Day-fraction total (0..n). Format with formatDayFractionAsClock() for display. */
  tardyDayFraction: number;
  idleTimeAvgHours: number;
}

export function calcAgentPvf(rows: PvfRow[], agentEmail: string): PvfResult {
  const agentRows = rows.filter(r => r.agentEmail === agentEmail);

  // Tardy/minute: SUMIFS(AJ, A=agent, AJ>0)
  const tardyDayFraction = agentRows
    .map(r => r.tardyDayFraction)
    .filter(v => v > 0)
    .reduce((a, b) => a + b, 0);

  // Idle Time: AVERAGEIFS(L, A=agent)
  const idleValues = agentRows.map(r => r.timeNotWorkingAdjustedH);
  const idleTimeAvgHours = idleValues.length
    ? idleValues.reduce((a, b) => a + b, 0) / idleValues.length
    : 0;

  return { tardyDayFraction, idleTimeAvgHours };
}

/** Team/roster-level Tardy total — MUST be called with an explicit roster list. */
export function calcTeamTardy(rows: PvfRow[], rosterEmails: string[]): number {
  const rosterSet = new Set(rosterEmails);
  return rows
    .filter(r => rosterSet.has(r.agentEmail) && r.tardyDayFraction > 0)
    .reduce((sum, r) => sum + r.tardyDayFraction, 0);
}

/** Formats a day-fraction (Excel time serial) as H:MM:SS, matching the sheet's display. */
export function formatDayFractionAsClock(dayFraction: number): string {
  const totalSeconds = Math.round(dayFraction * 86400);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Section 3 — Metrics sheet, agent-level KPI lookups (spec §13)
// ---------------------------------------------------------------------------

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

/**
 * =IFERROR(SUMIFS(E:E, C:C, agent, D:D, "<metric name>"), "")
 * Preserves the sheet's IFERROR(...,"") behavior: returns null (not 0) when
 * the metric is genuinely missing for that agent — do not coerce to 0
 * (spec §47).
 */
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

// ---------------------------------------------------------------------------
// Section 4 — Team Overall / Floor Average named-metric blocks (spec §15-16)
// ---------------------------------------------------------------------------

/**
 * Reads the K:L block (Team Overall = rows 1-22, Floor Average = rows 25-46)
 * as-is. These values (incl. "CSAT adjusted with calls, %") come straight
 * from the sheet and must NEVER be recomputed from agent-level data —
 * see spec §15, §16, §39.
 */
export function getNamedMetric(block: NamedMetric[], name: string): number | null {
  const match = block.find(m => m.name === name);
  return match ? match.value : null;
}

// ---------------------------------------------------------------------------
// Formatting helpers (spec §33, §47)
// ---------------------------------------------------------------------------

/** Metrics sheet stores percentages as fractions (0.046). Multiply only at display time. */
export function formatPct(fraction: number | null, decimals = 2): string {
  if (fraction === null) return '';
  return `${(fraction * 100).toFixed(decimals)}%`;
}
