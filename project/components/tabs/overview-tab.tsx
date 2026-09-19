'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Star, Target, BarChart2, Inbox, Phone, MessageSquare, Globe, History } from 'lucide-react';

export function OverviewTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {} } = useMetrics() as any;
  const [activeView, setActiveTab] = useState<'overall' | 'chat' | 'phone' | 'previous'>('overall');

  // Format Helper
  const formatVal = (val: any, isPct = false) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace('%', ''));
    if (isNaN(num)) return String(val);
    if (isPct) {
      return num <= 1 && num > 0 ? `${(num * 100).toFixed(2)}%` : `${num.toFixed(2)}%`;
    }
    return String(num);
  };

  const csatCount = teamMetrics['CSAT'] || teamMetrics['csatCount'] || 0;
  const kscatCount = teamMetrics['KSCAT'] || teamMetrics['kscatCount'] || 0;
  const dsatCount = teamMetrics['DSAT'] || teamMetrics['dsatCount'] || 0;
  const totalCount = teamMetrics['Total Count'] || teamMetrics['totalTickets'] || (csatCount + kscatCount + dsatCount);
  const totalWoKarma = teamMetrics['Total w/o Karma'] || teamMetrics['totalWoKarma'] || (csatCount + dsatCount);
  const csatPct = totalWoKarma > 0 ? (csatCount / totalWoKarma) * 100 : 0;
  const kscatPct = totalCount > 0 ? (csatCount / totalCount) * 100 : 0;
  const variance = csatPct - kscatPct;

  const hasData = agentMetrics.length > 0 || Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* View & Channel Selector Toggles matching Excel Sections */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-1">Replicating Dashboard Sheet calculations, overall totals, and channel breakdowns</p>
        </div>

        <div className="flex border rounded-lg p-1 bg-slate-500/10 text-xs">
          <Button
            variant={activeView === 'overall' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overall')}
            className="h-8 text-xs gap-1"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-500" /> Overall Performance
          </Button>
          <Button
            variant={activeView === 'chat' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('chat')}
            className="h-8 text-xs gap-1"
          >
            <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> Chat Performance
          </Button>
          <Button
            variant={activeView === 'phone' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('phone')}
            className="h-8 text-xs gap-1"
          >
            <Phone className="h-3.5 w-3.5 text-purple-500" /> Phone Performance
          </Button>
          <Button
            variant={activeView === 'previous' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('previous')}
            className="h-8 text-xs gap-1"
          >
            <History className="h-3.5 w-3.5 text-amber-500" /> Previous Month
          </Button>
        </div>
      </div>

      {!hasData && (
        <Card className="p-6 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Inbox className="h-5 w-5 text-amber-600 shrink-0" />
          <span>No raw CSV data loaded yet. Upload your <strong>KSCAT Calc</strong>, <strong>PVF</strong>, and <strong>Metrics</strong> files under Data & Import to calculate live figures.</span>
        </Card>
      )}

      {/* SECTION 1: Team Performance Summary Panel (Columns L & M, Rows 22-40) */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-emerald-600" /> Team Performance Panel ({activeView.toUpperCase()})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">CSAT %</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{formatVal(csatPct, true)}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">KSCAT %</div>
              <div className="text-xl font-bold text-blue-600 mt-1">{formatVal(kscatPct, true)}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Variance</div>
              <div className="text-xl font-bold text-purple-600 mt-1">{formatVal(variance, true)}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">CSAT Count</div>
              <div className="text-xl font-bold mt-1">{csatCount}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">KSCAT Count</div>
              <div className="text-xl font-bold mt-1">{kscatCount}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">DSAT Count</div>
              <div className="text-xl font-bold text-red-500 mt-1">{dsatCount}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Average Basket Time (ABT)</div>
              <div className="text-lg font-bold mt-1">{formatVal(teamMetrics['Average basket time'])}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Productivity 8-hrs</div>
              <div className="text-lg font-bold mt-1">{formatVal(teamMetrics['Productivity 8-hrs'])}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Escalation Rate %</div>
              <div className="text-lg font-bold text-amber-600 mt-1">{formatVal(teamMetrics['Escalation rate %'], true)}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Deescalation Rate %</div>
              <div className="text-lg font-bold text-emerald-600 mt-1">{formatVal(teamMetrics['Deescalation rate %'], true)}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Adherence %</div>
              <div className="text-lg font-bold text-purple-600 mt-1">{formatVal(teamMetrics['Adherence, %'], true)}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border shadow-xs">
              <div className="text-[10px] text-gray-500 font-bold uppercase">Average Handling Time (AHT)</div>
              <div className="text-lg font-bold mt-1">{formatVal(teamMetrics['Average handling time'])}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Exact Full Agent Breakdown Sheet Table (Columns A-V) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Agent Breakdown Table ({activeView.toUpperCase()})</span>
            <Badge variant="outline" className="text-xs">Full 22-Column Sheet Alignment</Badge>
          </CardTitle>
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
                    const csat = activeView === 'chat' ? agent.chatCsat : activeView === 'phone' ? agent.phoneCsat : agent.csat;
                    const kscat = activeView === 'chat' ? agent.chatKscat : activeView === 'phone' ? agent.phoneKscat : agent.kscat;
                    const dsat = activeView === 'chat' ? agent.chatDsat : activeView === 'phone' ? agent.phoneDsat : agent.dsat;
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
                      No agent records uploaded for this view.
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
