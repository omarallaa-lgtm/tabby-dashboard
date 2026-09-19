'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Star, Target, BarChart2, Inbox, Globe, MessageSquare, Phone } from 'lucide-react';

export function OverviewTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {} } = useMetrics() as any;
  const [channelFilter, setChannelFilter] = useState<'overall' | 'chat' | 'phone'>('overall');
  const [selectedMetric, setSelectedMetric] = useState({ label: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', target: 85 });

  const formatVal = (val: any, isPct = false) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace('%', ''));
    if (isNaN(num)) return String(val);
    if (isPct) {
      return num <= 1 && num > 0 ? `${(num * 100).toFixed(2)}%` : `${num.toFixed(2)}%`;
    }
    return String(num);
  };

  const getNumericVal = (source: Record<string, any>, key: string) => {
    const raw = source[key];
    if (raw === undefined || raw === null) return 0;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace('%', ''));
    if (isNaN(num)) return 0;
    return num <= 1 && num > 0 ? num * 100 : num;
  };

  const teamScore = getNumericVal(teamMetrics, selectedMetric.teamKey);
  const floorScore = getNumericVal(floorAverages, selectedMetric.teamKey);

  const hasData = agentMetrics.length > 0 || Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header and Channel Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Overall Performance View</h2>
          <p className="text-xs text-muted-foreground mt-1">Exact Excel Dashboard Sheet calculations & Floor Average benchmarks</p>
        </div>

        <div className="flex border rounded-lg p-1 bg-slate-500/10 text-xs">
          <Button
            variant={channelFilter === 'overall' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChannelFilter('overall')}
            className="h-8 text-xs gap-1"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-500" /> Overall
          </Button>
          <Button
            variant={channelFilter === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChannelFilter('chat')}
            className="h-8 text-xs gap-1"
          >
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> Chat
          </Button>
          <Button
            variant={channelFilter === 'phone' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setChannelFilter('phone')}
            className="h-8 text-xs gap-1"
          >
            <Phone className="h-3.5 w-3.5 text-purple-500" /> Phone
          </Button>
        </div>
      </div>

      {!hasData && (
        <Card className="p-6 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Inbox className="h-5 w-5 text-amber-600 shrink-0" />
          <span>No raw CSV data loaded yet. Upload your <strong>KSCAT Calc</strong>, <strong>PVF</strong>, and <strong>Metrics</strong> files under Data & Import to calculate live figures.</span>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card
          onClick={() => setSelectedMetric({ label: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', target: 85 })}
          className={`cursor-pointer transition-all hover:scale-105 ${selectedMetric.label === 'CSAT %' ? 'border-emerald-500 border-2 bg-emerald-50/20' : ''}`}
        >
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-[10px] font-bold text-gray-500 uppercase">CSAT %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{formatVal(teamMetrics['CSAT adjusted with calls, %'] || teamMetrics['CSAT %'], true)}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 85%
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'KSCAT %', teamKey: 'KSCAT %', target: 35 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">KSCAT %</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{formatVal(teamMetrics['KSCAT %'], true)}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'Adherence %', teamKey: 'Adherence, %', target: 90 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Adherence %</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{formatVal(teamMetrics['Adherence, %'], true)}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'AHT', teamKey: 'Average handling time', target: 5 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">AHT</div>
            <div className="text-2xl font-bold mt-1">{formatVal(teamMetrics['Average handling time'])}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'ABT', teamKey: 'Average basket time', target: 14 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">ABT</div>
            <div className="text-2xl font-bold mt-1">{formatVal(teamMetrics['Average basket time'])}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'Productivity 8-hrs', teamKey: 'Productivity 8-hrs', target: 30 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Productivity 8-hrs</div>
            <div className="text-2xl font-bold mt-1">{formatVal(teamMetrics['Productivity 8-hrs'])}</div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Graph & Floor Averages Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-emerald-600" /> Metric Benchmark: {selectedMetric.label} ({channelFilter.toUpperCase()})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Team Score</span>
                <span className="text-emerald-600">{teamScore.toFixed(2)}</span>
              </div>
              <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(teamScore, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Floor Average Benchmark</span>
                <span className="text-blue-600">{floorScore.toFixed(2)}</span>
              </div>
              <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(floorScore, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Operational Target</span>
                <span className="text-amber-600">{selectedMetric.target}</span>
              </div>
              <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(selectedMetric.target, 100)}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floor Averages Table from Metrics Sheet K:L Block */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Floor Averages Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Metric</TableHead>
                  <TableHead className="text-xs text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                <TableRow>
                  <TableCell className="font-medium">CSAT %</TableCell>
                  <TableCell className="text-right text-emerald-600 font-bold">{formatVal(floorAverages['CSAT adjusted with calls, %'], true)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Basket Time</TableCell>
                  <TableCell className="text-right">{formatVal(floorAverages['Average basket time'])}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Productivity 8-hrs</TableCell>
                  <TableCell className="text-right">{formatVal(floorAverages['Productivity 8-hrs'])}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Escalation Rate %</TableCell>
                  <TableCell className="text-right">{formatVal(floorAverages['Escalation rate %'], true)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Adherence %</TableCell>
                  <TableCell className="text-right">{formatVal(floorAverages['Adherence, %'], true)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Handling Time</TableCell>
                  <TableCell className="text-right">{formatVal(floorAverages['Average handling time'])}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 22-Column Agent Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table className="text-xs min-w-[1500px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-56">Agent Identifier</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>KSCAT</TableHead>
                  <TableHead>DSAT</TableHead>
                  <TableHead>Total Count</TableHead>
                  <TableHead>Total w/o Karma</TableHead>
                  <TableHead>KSCAT %</TableHead>
                  <TableHead>CSAT %</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>ABT</TableHead>
                  <TableHead>Productivity 8-hrs</TableHead>
                  <TableHead>Productivity Online 8-hrs</TableHead>
                  <TableHead>Escalation Rate %</TableHead>
                  <TableHead>Deescalation Rate %</TableHead>
                  <TableHead>Adherence %</TableHead>
                  <TableHead>AGBT</TableHead>
                  <TableHead>AHT</TableHead>
                  <TableHead>Closed After Resolution %</TableHead>
                  <TableHead>Closed Tickets %</TableHead>
                  <TableHead>FCR %</TableHead>
                  <TableHead>Tardy/minute</TableHead>
                  <TableHead>Idle Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentMetrics.length > 0 ? (
                  agentMetrics.map((agent: any, idx: number) => {
                    const csat = channelFilter === 'chat' ? agent.chatCsat : channelFilter === 'phone' ? agent.phoneCsat : agent.csat;
                    const kscat = channelFilter === 'chat' ? agent.chatKscat : channelFilter === 'phone' ? agent.phoneKscat : agent.kscat;
                    const dsat = channelFilter === 'chat' ? agent.chatDsat : channelFilter === 'phone' ? agent.phoneDsat : agent.dsat;
                    const tCount = csat + kscat + dsat;
                    const tWoKarma = csat + dsat;
                    const cPct = tWoKarma > 0 ? (csat / tWoKarma) * 100 : 0;
                    const kPct = tCount > 0 ? (csat / tCount) * 100 : 0;

                    return (
                      <TableRow key={idx} className="hover:bg-slate-500/5">
                        <TableCell className="font-bold">#{idx + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white">{agent.agent_email}</TableCell>
                        <TableCell>{csat}</TableCell>
                        <TableCell>{kscat}</TableCell>
                        <TableCell className="text-red-500 font-bold">{dsat}</TableCell>
                        <TableCell>{tCount}</TableCell>
                        <TableCell>{tWoKarma}</TableCell>
                        <TableCell className="text-blue-600 font-semibold">{kPct.toFixed(2)}%</TableCell>
                        <TableCell className="text-emerald-600 font-bold">{cPct.toFixed(2)}%</TableCell>
                        <TableCell className="text-purple-600 font-medium">{(cPct - kPct).toFixed(2)}%</TableCell>
                        <TableCell>{agent.abt || '-'}</TableCell>
                        <TableCell>{agent.productivity_8hrs || '-'}</TableCell>
                        <TableCell>{agent.productivity_online_8hrs || '-'}</TableCell>
                        <TableCell>{formatVal(agent.escalation_rate, true)}</TableCell>
                        <TableCell>{formatVal(agent.deescalation_rate, true)}</TableCell>
                        <TableCell>{formatVal(agent.adherence, true)}</TableCell>
                        <TableCell>{agent.agbt || '-'}</TableCell>
                        <TableCell>{agent.aht || '-'}</TableCell>
                        <TableCell>{formatVal(agent.closed_after_resolution, true)}</TableCell>
                        <TableCell>{formatVal(agent.closed_tickets_pct, true)}</TableCell>
                        <TableCell>{formatVal(agent.fcr_percent, true)}</TableCell>
                        <TableCell>{agent.tardy_minutes || '0:00:00'}</TableCell>
                        <TableCell>{agent.idle_time_avg ? `${agent.idle_time_avg}h` : '-'}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={23} className="text-center py-8 text-muted-foreground">
                      No agent records uploaded for this period.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
