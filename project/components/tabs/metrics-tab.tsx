'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useMetrics } from '@/lib/metrics-context';
import { agentLeaderboard } from '@/lib/mock-data';
import { Star, Check, Search, AlertTriangle, Target, Users, MessageSquare, Layers } from 'lucide-react';

type MetricGroup = 'csat' | 'chat' | 'others';

export function MetricsTab() {
  const { agentMetrics, teamMetrics } = useMetrics();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'star' | 'below-floor' | 'target-met'>('all');
  const [selectedGroup, setSelectedGroup] = useState<MetricGroup>('csat');

  const floorMetrics = teamMetrics?.floorMetrics || [];

  const getFloorVal = (metricName: string, fallback: number = 60.0): number => {
    const found = floorMetrics.find((f) => f.metricName.toLowerCase().includes(metricName.toLowerCase()));
    if (!found) return fallback;
    return parseFloat(found.value.replace('%', '').trim()) || fallback;
  };

  const csatFloor = getFloorVal('CSAT', 60.0);

  const agents = (agentMetrics && agentMetrics.length > 0)
    ? agentMetrics.map((a, i) => {
        const csat = Number.parseFloat(String(a.csatPercent ?? '0')) || 0;
        const kscat = Number.parseFloat(String(a.kscatPercent ?? '0')) || 0;
        const beatsFloor = csat >= csatFloor;
        const meetsTarget = csat >= 85;

        return {
          rank: i + 1,
          email: a.agentEmail || a.name || 'Unknown Agent',
          // CSAT Group
          csat: a.csatPercent ?? '0%',
          csatNum: csat,
          kscat: a.kscatPercent ?? '0%',
          dsat: a.dsat,
          totalCount: a.totalTickets ?? 0,
          totalWOKarma: a.totalWOKarma ?? 0,
          variance: `${(csat - kscat).toFixed(2)}%`,
          // Chat Metrics Group
          abt: a.abt || '14.5',
          productivity8h: a.productivity8h || '27.3',
          productivityOnline8h: a.productivityOnline8h || '41.8',
          agbt: a.agbt || '24.4',
          aht: a.aht || '6.1',
          closedAfterRes: a.closedAfterResolution || '59.20%',
          closedTicketsPct: a.closedTicketsPercent || '51.30%',
          // Others Group
          escalationRate: a.escalationRate || '4.10%',
          deescalationRate: a.deescalationRate || '3.10%',
          adherence: a.adherencePercent || '77.50%',
          fcr: a.fcrPercent || '56.00%',
          tardyMinutes: a.tardyMinutes || '0:00:00',
          idleTime: a.idleTime || '0.00',
          beatsFloor,
          meetsTarget,
        };
      })
    : agentLeaderboard.map((a) => {
        const beatsFloor = a.csat >= csatFloor;
        const meetsTarget = a.csat >= 85;
        return {
          rank: a.rank,
          email: a.name,
          // CSAT Group
          csat: `${a.csat}%`,
          csatNum: a.csat,
          kscat: `${a.csat - 10}%`,
          dsat: a.dsat,
          totalCount: a.calls,
          totalWOKarma: a.calls - 5,
          variance: '10.00%',
          // Chat Metrics Group
          abt: '14.5',
          productivity8h: '27.3',
          productivityOnline8h: '41.8',
          agbt: '24.4',
          aht: a.aht,
          closedAfterRes: '59.20%',
          closedTicketsPct: '51.30%',
          // Others Group
          escalationRate: '4.10%',
          deescalationRate: '3.10%',
          adherence: `${a.adherence}%`,
          fcr: '56.00%',
          tardyMinutes: '0:15:00',
          idleTime: '0.45',
          beatsFloor,
          meetsTarget,
        };
      });

  const totalAgentsCount = agents.length;
  const beatingFloorCount = agents.filter((a) => a.beatsFloor).length;
  const belowFloorCount = totalAgentsCount - beatingFloorCount;
  const meetingTargetCount = agents.filter((a) => a.meetsTarget).length;

  const filteredAgents = agents.filter((a) => {
    const matchesSearch = a.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filterType === 'star') return a.beatsFloor;
    if (filterType === 'below-floor') return !a.beatsFloor;
    if (filterType === 'target-met') return a.meetsTarget;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Beating Floor Avg (★)</p>
              <h3 className="text-2xl font-bold text-emerald-600">{beatingFloorCount} / {totalAgentsCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalAgentsCount > 0 ? ((beatingFloorCount / totalAgentsCount) * 100).toFixed(0) : 0}% of team
              </p>
            </div>
            <Star className="h-8 w-8 text-amber-400 fill-amber-400 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Below Floor Avg</p>
              <h3 className="text-2xl font-bold text-red-600">{belowFloorCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Needs coaching</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Target Compliant (✓)</p>
              <h3 className="text-2xl font-bold text-blue-600">{meetingTargetCount}</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Hitting 85%+ CSAT target</p>
            </div>
            <Target className="h-8 w-8 text-blue-500 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Floor CSAT Benchmark</p>
              <h3 className="text-2xl font-bold text-purple-600">{csatFloor.toFixed(1)}%</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Floor reference point</p>
            </div>
            <Users className="h-8 w-8 text-purple-500 opacity-80" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <CardHeader className="px-0 pt-0 mb-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <CardTitle>Detailed Agent Metrics Breakdown</CardTitle>
                <CardDescription>
                  Select a metric category below to inspect outcome tables
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Filter agent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs bg-slate-50"
                  />
                </div>

                <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-2.5 py-1 rounded-md transition-all ${filterType === 'all' ? 'bg-white shadow-xs text-foreground' : 'text-muted-foreground'}`}
                  >
                    All ({totalAgentsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('star')}
                    className={`px-2.5 py-1 rounded-md transition-all ${filterType === 'star' ? 'bg-white shadow-xs text-emerald-600' : 'text-muted-foreground'}`}
                  >
                    ★ Floor Beat ({beatingFloorCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('below-floor')}
                    className={`px-2.5 py-1 rounded-md transition-all ${filterType === 'below-floor' ? 'bg-white shadow-xs text-red-600' : 'text-muted-foreground'}`}
                  >
                    Below Floor ({belowFloorCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('target-met')}
                    className={`px-2.5 py-1 rounded-md transition-all ${filterType === 'target-met' ? 'bg-white shadow-xs text-blue-600' : 'text-muted-foreground'}`}
                  >
                    ✓ Target Met ({meetingTargetCount})
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700">Metric Groups:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedGroup('csat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGroup === 'csat'
                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Star className="h-3.5 w-3.5" />
                  1. CSAT Metrics
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGroup('chat')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGroup === 'chat'
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  2. Chat Metrics
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedGroup('others')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedGroup === 'others'
                      ? 'bg-purple-600 text-white shadow-sm ring-2 ring-purple-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  3. Others
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="overflow-x-auto border rounded-xl">
            <Table className="text-xs whitespace-nowrap">
              <TableHeader className="bg-gray-50">
                {selectedGroup === 'csat' && (
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Agent Email</TableHead>
                    <TableHead className="text-right">CSAT</TableHead>
                    <TableHead className="text-right">KSCAT</TableHead>
                    <TableHead className="text-right">DSAT</TableHead>
                    <TableHead className="text-right">Total Count</TableHead>
                    <TableHead className="text-right">Total w/o Karma</TableHead>
                    <TableHead className="text-right">KSCAT %</TableHead>
                    <TableHead className="text-right">CSAT %</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                )}

                {selectedGroup === 'chat' && (
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Agent Email</TableHead>
                    <TableHead className="text-right">ABT</TableHead>
                    <TableHead className="text-right">Productivity 8-hrs</TableHead>
                    <TableHead className="text-right">Productivity Online 8-hrs</TableHead>
                    <TableHead className="text-right">AGBT</TableHead>
                    <TableHead className="text-right">AHT</TableHead>
                    <TableHead className="text-right">Closed After Res. %</TableHead>
                    <TableHead className="text-right">Closed Tickets %</TableHead>
                  </TableRow>
                )}

                {selectedGroup === 'others' && (
                  <TableRow>
                    <TableHead className="w-12">Rank</TableHead>
                    <TableHead>Agent Email</TableHead>
                    <TableHead className="text-right">Escalation Rate %</TableHead>
                    <TableHead className="text-right">Deescalation Rate %</TableHead>
                    <TableHead className="text-right">Adherence %</TableHead>
                    <TableHead className="text-right">FCR %</TableHead>
                    <TableHead className="text-right">Tardy/minute</TableHead>
                    <TableHead className="text-right">Idle Time</TableHead>
                  </TableRow>
                )}
              </TableHeader>

              <TableBody className="divide-y">
                {filteredAgents.map((agent) => (
                  <TableRow key={agent.email} className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-muted-foreground">#{agent.rank}</TableCell>
                    <TableCell className="font-medium text-gray-900">{agent.email}</TableCell>

                    {selectedGroup === 'csat' && (
                      <>
                        <TableCell className="text-right font-medium">{agent.csatNum}</TableCell>
                        <TableCell className="text-right font-medium">{agent.kscat.replace('%', '')}</TableCell>
                        <TableCell className="text-right font-medium text-red-600">{agent.dsat}</TableCell>
                        <TableCell className="text-right">{agent.totalCount}</TableCell>
                        <TableCell className="text-right">{agent.totalWOKarma}</TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">{agent.kscat}</TableCell>
                        <TableCell className="text-right font-semibold text-emerald-600">{agent.csat}</TableCell>
                        <TableCell className="text-right font-medium text-purple-600">{agent.variance}</TableCell>
                      </>
                    )}

                    {selectedGroup === 'chat' && (
                      <>
                        <TableCell className="text-right font-medium">{agent.abt}</TableCell>
                        <TableCell className="text-right font-medium">{agent.productivity8h}</TableCell>
                        <TableCell className="text-right font-medium">{agent.productivityOnline8h}</TableCell>
                        <TableCell className="text-right">{agent.agbt}</TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">{agent.aht}</TableCell>
                        <TableCell className="text-right font-medium">{agent.closedAfterRes}</TableCell>
                        <TableCell className="text-right font-medium">{agent.closedTicketsPct}</TableCell>
                      </>
                    )}

                    {selectedGroup === 'others' && (
                      <>
                        <TableCell className="text-right text-amber-600 font-medium">{agent.escalationRate}</TableCell>
                        <TableCell className="text-right text-emerald-600 font-medium">{agent.deescalationRate}</TableCell>
                        <TableCell className="text-right font-bold text-purple-600">{agent.adherence}</TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">{agent.fcr}</TableCell>
                        <TableCell className="text-right text-amber-600 font-medium">{agent.tardyMinutes}</TableCell>
                        <TableCell className="text-right font-medium">{agent.idleTime}</TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}