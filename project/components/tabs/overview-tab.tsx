'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trophy, Building2, Users, TrendingUp, TrendingDown, Minus, Target, Settings2, X, Check, Star } from 'lucide-react';
import { agentLeaderboard as mockLeaderboard } from '@/lib/mock-data';
import { useMetrics } from '@/lib/metrics-context';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const defaultFloorMetrics = [
  { metricName: 'CSAT %', value: '60.00%' },
  { metricName: 'Average Basket Time', value: '14.6' },
  { metricName: 'Productivity 8-hrs', value: '30.0' },
  { metricName: 'Productivity Online 8-hrs', value: '44.9' },
  { metricName: 'Escalation Rate %', value: '4.70%' },
  { metricName: 'Deescalation Rate %', value: '4.00%' },
  { metricName: 'Adherence %', value: '81.70%' },
  { metricName: 'Average Group Basket Time', value: '24.4' },
  { metricName: 'Average Handling Time', value: '5.5' },
  { metricName: 'Closed After Resolution %', value: '61.50%' },
  { metricName: 'Closed Tickets %', value: '50.30%' },
  { metricName: 'FCR %', value: '53.50%' },
];

const metricNameMapping: Record<string, string[]> = {
  'CSAT %': ['csat %', 'csat adjusted with calls'],
  'KSCAT %': ['kscat %'],
  'CSAT Count': ['csat count', 'csat adjusted - total scores'],
  'KSCAT Count': ['kscat count'],
  'DSAT Count': ['dsat count', 'dsat'],
  'Total Tickets': ['total tickets', 'basket touched tickets'],
  'Total w/o Karma': ['total w/o karma'],
  'Adherence %': ['adherence %', 'adherence'],
  'AHT': ['average handling time', 'aht'],
  'ABT': ['average basket time', 'abt'],
  'Productivity (8-hrs)': ['productivity 8-hrs'],
  'Productivity Online (8-hrs)': ['productivity online 8-hrs'],
  'Escalation Rate %': ['escalation rate %', 'escalation rate'],
  'Deescalation Rate %': ['deescalation rate %', 'deescalation rate'],
  'AGBT': ['average group basket time', 'agbt'],
  'Closed After Res. %': ['closed after resolution %', 'closed after resolution'],
  'Closed Tickets %': ['closed tickets %', 'closed tickets'],
  'FCR %': ['fcr %', 'fcr'],
};

export function OverviewTab() {
  const { agentMetrics, teamMetrics, backups } = useMetrics();
  const [selectedMetric, setSelectedMetric] = useState<string>('CSAT %');
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targets, setTargets] = useState<Record<string, number>>({
    'CSAT %': 85,
    'Adherence %': 90,
    'AHT': 5.0,
    'FCR %': 70,
  });

  const hasUploadedData = Boolean(teamMetrics || (agentMetrics && agentMetrics.length > 0));
  const totalAgents = agentMetrics?.length || 0;

  const floorMetrics = teamMetrics?.floorMetrics || defaultFloorMetrics;

  const csatPctStr = teamMetrics?.csatPercent || '60.53%';
  const kscatPctStr = teamMetrics?.kscatPercent || '40.35%';
  const totalDsatVal = (teamMetrics as any)?.dsatCount ?? 90;
  const adherenceStr = teamMetrics?.adherencePercent || '77.50%';
  const ahtStr = teamMetrics?.aht || '6.1';

  const getFloorValForMetric = (label: string): number => {
    const keywords = metricNameMapping[label] || [label.toLowerCase()];
    const found = floorMetrics.find((fm) => {
      const name = fm.metricName.toLowerCase();
      return keywords.some((kw) => name.includes(kw) || kw.includes(name));
    });
    if (!found) return 0;
    const cleanStr = found.value.replace('%', '').trim();
    return parseFloat(cleanStr) || 0;
  };

  const teamMetricCards = [
    { label: 'CSAT %', val: csatPctStr, color: 'text-emerald-600' },
    { label: 'KSCAT %', val: kscatPctStr, color: 'text-blue-600' },
    { label: 'CSAT Count', val: String(teamMetrics?.csatCount ?? 138), color: 'text-foreground' },
    { label: 'KSCAT Count', val: String(teamMetrics?.kscatCount ?? 138), color: 'text-foreground' },
    { label: 'DSAT Count', val: String(totalDsatVal), color: 'text-red-600' },
    { label: 'Total Tickets', val: String(teamMetrics?.totalTickets ?? 342), color: 'text-foreground' },
    { label: 'Total w/o Karma', val: String(teamMetrics?.totalWOKarma ?? 228), color: 'text-foreground' },
    { label: 'Adherence %', val: adherenceStr, color: 'text-purple-600' },
    { label: 'AHT', val: ahtStr, color: 'text-foreground' },
    { label: 'ABT', val: '14.5', color: 'text-foreground' },
    { label: 'Productivity (8-hrs)', val: '27.3', color: 'text-foreground' },
    { label: 'Productivity Online (8-hrs)', val: '41.8', color: 'text-foreground' },
    { label: 'Escalation Rate %', val: '4.10%', color: 'text-amber-600' },
    { label: 'Deescalation Rate %', val: '3.10%', color: 'text-emerald-600' },
    { label: 'AGBT', val: '24.4', color: 'text-foreground' },
    { label: 'Closed After Res. %', val: '59.20%', color: 'text-foreground' },
    { label: 'Closed Tickets %', val: '51.30%', color: 'text-foreground' },
    { label: 'FCR %', val: '56.00%', color: 'text-foreground' },
  ];

  const activeCardObj = teamMetricCards.find((c) => c.label === selectedMetric);
  const currentTeamNum = activeCardObj
    ? parseFloat(activeCardObj.val.replace('%', '').trim()) || 0
    : 0;
  const currentFloorNum = getFloorValForMetric(selectedMetric);
  const currentTargetNum = targets[selectedMetric] ?? 0;

  let finalChartData: Array<{ timestamp: string; teamVal: number; floorVal: number }> = [];
  if (backups && backups.length > 0) {
    finalChartData = backups.map((b) => {
      const item = b.metricsMap?.[selectedMetric] || { teamVal: currentTeamNum, floorVal: currentFloorNum };
      return {
        timestamp: b.timestamp,
        teamVal: item.teamVal,
        floorVal: item.floorVal,
      };
    });
  } else {
    finalChartData = [
      { timestamp: 'Start of Month', teamVal: currentTeamNum * 0.9, floorVal: currentFloorNum },
      { timestamp: 'Current Run', teamVal: currentTeamNum, floorVal: currentFloorNum },
    ];
  }

  const allValues = finalChartData.flatMap((d) => [d.teamVal, d.floorVal, currentTargetNum]).filter((v) => v > 0);
  const minVal = allValues.length > 0 ? Math.floor(Math.min(...allValues)) : 0;
  const maxVal = allValues.length > 0 ? Math.ceil(Math.max(...allValues)) : 100;
  const yDomainMin = Math.max(0, minVal - 2);
  const yDomainMax = maxVal + 2;

  const firstPoint = finalChartData[0]?.teamVal || 0;
  const lastPoint = finalChartData[finalChartData.length - 1]?.teamVal || 0;
  const diff = lastPoint - firstPoint;
  const isLowerBetter = selectedMetric.includes('AHT') || selectedMetric.includes('ABT') || selectedMetric.includes('DSAT') || selectedMetric.includes('Escalation');

  let status = 'neutral';
  if (diff !== 0) {
    status = isLowerBetter ? (diff < 0 ? 'improved' : 'worsened') : (diff > 0 ? 'improved' : 'worsened');
  }

  const handleTargetChange = (label: string, val: string) => {
    const num = parseFloat(val);
    setTargets((prev) => ({
      ...prev,
      [label]: isNaN(num) ? 0 : num,
    }));
  };

  const leaderboardList: any[] = [];
  if (agentMetrics && agentMetrics.length > 0) {
    const sorted = [...agentMetrics].sort(
      (a, b) => (parseFloat((b as any).csatPercent) || 0) - (parseFloat((a as any).csatPercent) || 0)
    );
    for (let i = 0; i < sorted.length; i += 1) {
      const agent = sorted[i] as any;
      const csatNum = parseFloat(agent.csatPercent) || 0;
      const kscatNum = parseFloat(agent.kscatPercent) || 0;
      const emailParts = (agent.agentEmail || '').split('@')[0].split('.');
      const initials = emailParts.map((n: string) => n[0]?.toUpperCase()).join('');

      leaderboardList.push({
        rank: i + 1,
        avatar: initials || 'AG',
        name: agent.agentEmail || 'Agent',
        team: 'Customer Care',
        csatCount: agent.csatCount || 0,
        kscatCount: agent.kscatCount || 0,
        dsat: agent.dsatCount || agent.dsat || 0,
        totalTickets: agent.totalTickets || 0,
        totalWOKarma: agent.totalWOKarma || 0,
        kscatPercent: agent.kscatPercent || '0%',
        csatPercent: agent.csatPercent || '0%',
        variance: `${(csatNum - kscatNum).toFixed(2)}%`,
        abt: agent.abt || '0',
        productivity8h: agent.productivity8h || '0',
        productivityOnline8h: agent.productivityOnline8h || '0',
        escalationRate: agent.escalationRate || '0%',
        deescalationRate: agent.deescalationRate || '0%',
        adherence: agent.adherencePercent || '0%',
        agbt: agent.agbt || '0',
        aht: agent.aht || '0',
        closedAfterResolution: agent.closedAfterResolution || '0%',
        closedTicketsPercent: agent.closedTicketsPercent || '0%',
        fcrPercent: agent.fcrPercent || '0%',
        tardyMinutes: agent.tardyMinutes || '0:00:00',
        idleTime: agent.idleTime || '0',
      });
    }
  } else {
    for (let i = 0; i < mockLeaderboard.length; i += 1) {
      const a = mockLeaderboard[i];
      leaderboardList.push({
        rank: a.rank,
        avatar: a.avatar,
        name: a.name,
        team: a.team,
        csatCount: 15,
        kscatCount: 12,
        dsat: a.dsat,
        totalTickets: a.calls,
        totalWOKarma: a.calls - 5,
        kscatPercent: `${a.csat - 15}%`,
        csatPercent: `${a.csat}%`,
        variance: '15.00%',
        abt: '14.2',
        productivity8h: '28.5',
        productivityOnline8h: '42.1',
        escalationRate: '4.20%',
        deescalationRate: '3.50%',
        adherence: `${a.adherence}%`,
        agbt: '22.1',
        aht: a.aht,
        closedAfterResolution: '55.00%',
        closedTicketsPercent: '50.00%',
        fcrPercent: '60.00%',
        tardyMinutes: '0:15:00',
        idleTime: '0.45',
      });
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Team Overall Performance View</CardTitle>
                <CardDescription>
                  ✓ = Meets Target | ★ = Beats Floor Average
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTargetModalOpen(true)}
                className="text-xs flex items-center gap-1.5 font-semibold"
              >
                <Settings2 className="h-3.5 w-3.5 text-emerald-600" />
                Set Targets
              </Button>
              <Badge variant={hasUploadedData ? 'default' : 'secondary'}>
                {hasUploadedData ? 'Live CSV Data' : 'Default Totals'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {teamMetricCards.map((m, i) => {
              const isSelected = selectedMetric === m.label;
              const teamNum = parseFloat(m.val.replace('%', '').trim()) || 0;
              const floorNum = getFloorValForMetric(m.label);
              const targetVal = targets[m.label];

              const lowerBetter = m.label.includes('AHT') || m.label.includes('ABT') || m.label.includes('DSAT') || m.label.includes('Escalation');

              const meetsTarget = targetVal !== undefined && targetVal > 0
                ? (lowerBetter ? teamNum <= targetVal : teamNum >= targetVal)
                : false;

              const beatsFloor = floorNum > 0
                ? (lowerBetter ? teamNum <= floorNum : teamNum >= floorNum)
                : false;

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedMetric(m.label)}
                  className={`text-left rounded-lg border p-3 space-y-1 transition-all relative ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-muted-foreground truncate">{m.label}</p>
                    {beatsFloor && (
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 inline" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <p className={`text-lg font-bold ${m.color}`}>{m.val}</p>
                    {meetsTarget && (
                      <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                    )}
                  </div>
                  {targetVal !== undefined && targetVal > 0 && (
                    <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                      <Target className="h-2.5 w-2.5" /> Target: {targetVal}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 p-6">
          <CardHeader className="px-0 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle>Monthly Trend: {selectedMetric}</CardTitle>
                  <Badge
                    className={
                      status === 'improved'
                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100'
                        : status === 'worsened'
                        ? 'bg-red-100 text-red-800 hover:bg-red-100'
                        : 'bg-gray-100 text-gray-800'
                    }
                  >
                    {status === 'improved' && <TrendingUp className="h-3 w-3 mr-1 inline" />}
                    {status === 'worsened' && <TrendingDown className="h-3 w-3 mr-1 inline" />}
                    {status === 'neutral' && <Minus className="h-3 w-3 mr-1 inline" />}
                    {status.toUpperCase()}
                  </Badge>
                </div>
                <CardDescription>
                  Team ({currentTeamNum}) vs Floor Average ({currentFloorNum})
                  {currentTargetNum > 0 ? ` vs Target (${currentTargetNum})` : ''}
                </CardDescription>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Team {selectedMetric}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Floor Average
                </span>
                {currentTargetNum > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Target ({currentTargetNum})
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={finalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="teamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="timestamp" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis domain={[yDomainMin, yDomainMax]} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(var(--popover-foreground))',
                  }}
                  formatter={(val: any) => [val, '']}
                />
                {currentTargetNum > 0 && (
                  <ReferenceLine
                    y={currentTargetNum}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: `Target: ${currentTargetNum}`, fill: '#f59e0b', fontSize: 11, position: 'top' }}
                  />
                )}
                <Area type="monotone" dataKey="teamVal" stroke="#10b981" strokeWidth={2.5} fill="url(#teamGrad)" name={`Team ${selectedMetric}`} />
                <Area type="monotone" dataKey="floorVal" stroke="#3b82f6" strokeWidth={2.5} fill="url(#floorGrad)" name={`Floor Average`} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="p-6">
          <CardHeader className="px-0 pt-0 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base">Floor Averages</CardTitle>
              </div>
              <Badge variant={hasUploadedData ? 'default' : 'secondary'} className="text-[10px]">
                {hasUploadedData ? 'Live CSV' : 'Default'}
              </Badge>
            </div>
            <CardDescription className="text-xs">Metrics sheet (K24:L44)</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="max-h-[250px] overflow-y-auto scrollbar-thin border rounded-lg">
              <Table>
                <TableHeader className="bg-gray-50 sticky top-0">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-gray-700 py-2">Metric</TableHead>
                    <TableHead className="text-right text-xs font-bold text-gray-700 py-2">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {floorMetrics.map((m, idx) => {
                    const isMatched = metricNameMapping[selectedMetric]?.some((kw) =>
                      m.metricName.toLowerCase().includes(kw)
                    );
                    return (
                      <TableRow
                        key={idx}
                        className={isMatched ? 'bg-emerald-50/70 font-semibold' : 'hover:bg-gray-50'}
                      >
                        <TableCell className="text-xs font-medium text-gray-900 py-2 truncate max-w-[140px]">
                          {m.metricName}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold text-emerald-600 py-2">
                          {m.value}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <div>
              <CardTitle>Agent Performance Leaderboard</CardTitle>
              <CardDescription>
                Complete metric breakdown for {totalAgents > 0 ? totalAgents : 7} active agents
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto border rounded-xl">
            <Table className="text-xs whitespace-nowrap">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">CSAT</TableHead>
                  <TableHead className="text-right">KSCAT</TableHead>
                  <TableHead className="text-right">DSAT</TableHead>
                  <TableHead className="text-right">Total Count</TableHead>
                  <TableHead className="text-right">Total w/o Karma</TableHead>
                  <TableHead className="text-right">KSCAT %</TableHead>
                  <TableHead className="text-right">CSAT %</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">ABT</TableHead>
                  <TableHead className="text-right">Productivity 8-hrs</TableHead>
                  <TableHead className="text-right">Productivity Online 8-hrs</TableHead>
                  <TableHead className="text-right">Escalation Rate %</TableHead>
                  <TableHead className="text-right">Deescalation Rate %</TableHead>
                  <TableHead className="text-right">Adherence %</TableHead>
                  <TableHead className="text-right">AGBT</TableHead>
                  <TableHead className="text-right">AHT</TableHead>
                  <TableHead className="text-right">Closed After Res. %</TableHead>
                  <TableHead className="text-right">Closed Tickets %</TableHead>
                  <TableHead className="text-right">FCR %</TableHead>
                  <TableHead className="text-right">Tardy/minute</TableHead>
                  <TableHead className="text-right">Idle Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {leaderboardList.map((agent) => (
                  <TableRow key={agent.rank} className="hover:bg-gray-50">
                    <TableCell>
                      <div
                        className={
                          agent.rank <= 3
                            ? 'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white'
                            : 'flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground'
                        }
                        style={
                          agent.rank === 1
                            ? { backgroundColor: '#facc15' }
                            : agent.rank === 2
                            ? { backgroundColor: '#cbd5e1' }
                            : agent.rank === 3
                            ? { backgroundColor: '#d97706' }
                            : undefined
                        }
                      >
                        {agent.rank}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                            {agent.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-gray-900">{agent.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{agent.csatCount}</TableCell>
                    <TableCell className="text-right font-medium">{agent.kscatCount}</TableCell>
                    <TableCell className="text-right font-medium text-red-600">{agent.dsat}</TableCell>
                    <TableCell className="text-right">{agent.totalTickets}</TableCell>
                    <TableCell className="text-right">{agent.totalWOKarma}</TableCell>
                    <TableCell className="text-right font-semibold text-blue-600">{agent.kscatPercent}</TableCell>
                    <TableCell className="text-right font-semibold text-emerald-600">{agent.csatPercent}</TableCell>
                    <TableCell className="text-right font-medium text-purple-600">{agent.variance}</TableCell>
                    <TableCell className="text-right">{agent.abt}</TableCell>
                    <TableCell className="text-right">{agent.productivity8h}</TableCell>
                    <TableCell className="text-right">{agent.productivityOnline8h}</TableCell>
                    <TableCell className="text-right">{agent.escalationRate}</TableCell>
                    <TableCell className="text-right">{agent.deescalationRate}</TableCell>
                    <TableCell className="text-right font-medium">{agent.adherence}</TableCell>
                    <TableCell className="text-right">{agent.agbt}</TableCell>
                    <TableCell className="text-right">{agent.aht}</TableCell>
                    <TableCell className="text-right">{agent.closedAfterResolution}</TableCell>
                    <TableCell className="text-right">{agent.closedTicketsPercent}</TableCell>
                    <TableCell className="text-right">{agent.fcrPercent}</TableCell>
                    <TableCell className="text-right text-amber-600">{agent.tardyMinutes}</TableCell>
                    <TableCell className="text-right">{agent.idleTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-bold text-gray-900">Set Operational Targets</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Enter target numbers for your team. Setting a target displays a baseline reference line on the comparison trend graph.
            </p>

            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 border rounded-lg p-3 bg-slate-50">
              {teamMetricCards.map((m) => (
                <div key={m.label} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-gray-700 w-1/2">{m.label}</span>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 85"
                    value={targets[m.label] ?? ''}
                    onChange={(e) => handleTargetChange(m.label, e.target.value)}
                    className="h-8 text-xs w-28 bg-white"
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsTargetModalOpen(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
              >
                Save & Apply Targets
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}