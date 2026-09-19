'use client';

import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Inbox, LayoutDashboard, MessageSquare, Phone, Users, Globe, BarChart2 } from 'lucide-react';

export function OverviewTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {} } = useMetrics() as any;

  const formatVal = (val: any, isPct = false) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace('%', ''));
    if (isNaN(num)) return String(val);
    if (isPct) {
      return num <= 1 && num > 0 ? `${(num * 100).toFixed(2)}%` : `${num.toFixed(2)}%`;
    }
    return String(num);
  };

  const hasData = agentMetrics.length > 0 || Object.keys(teamMetrics).length > 0;

  // Calculate Overall Totals (Table 1 Total Row)
  const totalCsat = agentMetrics.reduce((s: number, a: any) => s + (a.csat || 0), 0);
  const totalKscat = agentMetrics.reduce((s: number, a: any) => s + (a.kscat || 0), 0);
  const totalDsat = agentMetrics.reduce((s: number, a: any) => s + (a.dsat || 0), 0);
  const totalCount = totalCsat + totalKscat + totalDsat;
  const totalWoKarma = totalCsat + totalDsat;
  const totalCsatPct = totalWoKarma > 0 ? (totalCsat / totalWoKarma) * 100 : 0;
  const totalKscatPct = totalCount > 0 ? (totalCsat / totalCount) * 100 : 0;
  const totalVariance = totalCsatPct - totalKscatPct;

  // Calculate Chat Totals (Table 4)
  const totalChatCsat = agentMetrics.reduce((s: number, a: any) => s + (a.chat_csat || a.chatCsat || 0), 0);
  const totalChatKscat = agentMetrics.reduce((s: number, a: any) => s + (a.chat_kscat || a.chatKscat || 0), 0);
  const totalChatDsat = agentMetrics.reduce((s: number, a: any) => s + (a.chat_dsat || a.chatDsat || 0), 0);
  const totalChatCount = totalChatCsat + totalChatKscat + totalChatDsat;
  const totalChatWoKarma = totalChatCsat + totalChatDsat;

  // Calculate Phone Totals (Table 5)
  const totalPhoneCsat = agentMetrics.reduce((s: number, a: any) => s + (a.phone_csat || a.phoneCsat || 0), 0);
  const totalPhoneKscat = agentMetrics.reduce((s: number, a: any) => s + (a.phone_kscat || a.phoneKscat || 0), 0);
  const totalPhoneDsat = agentMetrics.reduce((s: number, a: any) => s + (a.phone_dsat || a.phoneDsat || 0), 0);
  const totalPhoneCount = totalPhoneCsat + totalPhoneKscat + totalPhoneDsat;
  const totalPhoneWoKarma = totalPhoneCsat + totalPhoneDsat;

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-emerald-600" /> Operational Performance Dashboard
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Replicating all 5 tables from the Excel Dashboard Sheet with exact formula equations</p>
      </div>

      {!hasData && (
        <Card className="p-6 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Inbox className="h-5 w-5 text-amber-600 shrink-0" />
          <span>No CSV records loaded yet. Upload your <strong>KSCAT Calc</strong>, <strong>PVF</strong>, and <strong>Metrics</strong> files in Data & Import to populate figures.</span>
        </Card>
      )}

      {/* TABLE 2 & TABLE 3: TEAM PERFORMANCE & FLOOR AVERAGE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-700">
                <Users className="h-5 w-5" /> 2. Team Performance Table
              </span>
              <Badge className="bg-emerald-100 text-emerald-800">Team Aggregate</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Metric Name</TableHead>
                  <TableHead className="text-right">Team Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="font-semibold">CSAT</TableCell><TableCell className="text-right font-bold text-emerald-600">{totalCsat}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">KSCAT</TableCell><TableCell className="text-right font-bold text-blue-600">{totalKscat}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">DSAT</TableCell><TableCell className="text-right font-bold text-red-500">{totalDsat}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Total Count</TableCell><TableCell className="text-right font-bold">{totalCount}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Total w/o Karma</TableCell><TableCell className="text-right font-bold">{totalWoKarma}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">KSCAT %</TableCell><TableCell className="text-right font-bold text-blue-600">{totalKscatPct.toFixed(2)}%</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">CSAT %</TableCell><TableCell className="text-right font-bold text-emerald-600">{totalCsatPct.toFixed(2)}%</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Basket Time (ABT)</TableCell><TableCell className="text-right">{formatVal(teamMetrics['Average basket time'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Productivity 8-hrs</TableCell><TableCell className="text-right">{formatVal(teamMetrics['Productivity 8-hrs'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Productivity Online 8-hrs</TableCell><TableCell className="text-right">{formatVal(teamMetrics['Productivity Online 8-hrs'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Escalation Rate %</TableCell><TableCell className="text-right text-amber-600 font-bold">{formatVal(teamMetrics['Escalation rate %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Deescalation Rate %</TableCell><TableCell className="text-right text-emerald-600 font-bold">{formatVal(teamMetrics['Deescalation rate %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Adherence %</TableCell><TableCell className="text-right text-purple-600 font-bold">{formatVal(teamMetrics['Adherence, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Group Basket Time</TableCell><TableCell className="text-right">{formatVal(teamMetrics['Average group basket time'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Handling Time (AHT)</TableCell><TableCell className="text-right">{formatVal(teamMetrics['Average handling time'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Closed After Resolution %</TableCell><TableCell className="text-right">{formatVal(teamMetrics['Closed after resolution, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Closed Tickets %</TableCell><TableCell className="text-right">{formatVal(teamMetrics['Closed tickets, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">FCR %</TableCell><TableCell className="text-right">{formatVal(teamMetrics['FCR, %'], true)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2 text-blue-700">
                <BarChart2 className="h-5 w-5" /> 3. Floor Average Table
              </span>
              <Badge className="bg-blue-100 text-blue-800">Floor Benchmark</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Metric Name</TableHead>
                  <TableHead className="text-right">Floor Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell className="font-semibold">CSAT %</TableCell><TableCell className="text-right font-bold text-emerald-600">{formatVal(floorAverages['CSAT adjusted with calls, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Basket Time (ABT)</TableCell><TableCell className="text-right">{formatVal(floorAverages['Average basket time'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Productivity 8-hrs</TableCell><TableCell className="text-right">{formatVal(floorAverages['Productivity 8-hrs'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Productivity Online 8-hrs</TableCell><TableCell className="text-right">{formatVal(floorAverages['Productivity Online 8-hrs'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Escalation Rate %</TableCell><TableCell className="text-right text-amber-600 font-bold">{formatVal(floorAverages['Escalation rate %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Deescalation Rate %</TableCell><TableCell className="text-right text-emerald-600 font-bold">{formatVal(floorAverages['Deescalation rate %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Adherence %</TableCell><TableCell className="text-right text-purple-600 font-bold">{formatVal(floorAverages['Adherence, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Group Basket Time</TableCell><TableCell className="text-right">{formatVal(floorAverages['Average group basket time'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Handling Time (AHT)</TableCell><TableCell className="text-right">{formatVal(floorAverages['Average handling time'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Closed After Resolution %</TableCell><TableCell className="text-right">{formatVal(floorAverages['Closed after resolution, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Closed Tickets %</TableCell><TableCell className="text-right">{formatVal(floorAverages['Closed tickets, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">FCR %</TableCell><TableCell className="text-right">{formatVal(floorAverages['FCR, %'], true)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* TABLE 1: OVERALL PERFORMANCE TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-600" /> 1. Overall Performance Table
            </span>
            <Badge variant="outline">Rows 2–14 (All Channels Combined)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table className="text-xs min-w-[1600px]">
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
                  <>
                    {agentMetrics.map((agent: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-slate-500/5">
                        <TableCell className="font-bold">#{idx + 1}</TableCell>
                        <TableCell className="font-medium text-gray-900 dark:text-white">{agent.agent_email}</TableCell>
                        <TableCell>{agent.csat}</TableCell>
                        <TableCell>{agent.kscat}</TableCell>
                        <TableCell className="text-red-500 font-bold">{agent.dsat}</TableCell>
                        <TableCell>{agent.total_count}</TableCell>
                        <TableCell>{agent.total_wo_karma}</TableCell>
                        <TableCell className="text-blue-600 font-semibold">{agent.kscat_percent}%</TableCell>
                        <TableCell className="text-emerald-600 font-bold">{agent.csat_percent}%</TableCell>
                        <TableCell className="text-purple-600 font-medium">{agent.variance}%</TableCell>
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
                    ))}
                    <TableRow className="bg-slate-500/10 font-bold text-xs border-t-2 border-emerald-500">
                      <TableCell colSpan={2}>Total</TableCell>
                      <TableCell>{totalCsat}</TableCell>
                      <TableCell>{totalKscat}</TableCell>
                      <TableCell className="text-red-500">{totalDsat}</TableCell>
                      <TableCell>{totalCount}</TableCell>
                      <TableCell>{totalWoKarma}</TableCell>
                      <TableCell className="text-blue-600">{totalKscatPct.toFixed(2)}%</TableCell>
                      <TableCell className="text-emerald-600">{totalCsatPct.toFixed(2)}%</TableCell>
                      <TableCell className="text-purple-600">{totalVariance.toFixed(2)}%</TableCell>
                      <TableCell>{formatVal(teamMetrics['Average basket time'])}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Productivity 8-hrs'])}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Productivity Online 8-hrs'])}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Escalation rate %'], true)}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Deescalation rate %'], true)}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Adherence, %'], true)}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Average group basket time'])}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Average handling time'])}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Closed after resolution, %'], true)}</TableCell>
                      <TableCell>{formatVal(teamMetrics['Closed tickets, %'], true)}</TableCell>
                      <TableCell>{formatVal(teamMetrics['FCR, %'], true)}</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={23} className="text-center py-8 text-muted-foreground">
                      No agent records uploaded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* TABLE 4 & TABLE 5: CHAT & PHONE PERFORMANCE TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TABLE 4: CHAT PERFORMANCE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2 text-blue-600">
                <MessageSquare className="h-5 w-5" /> 4. Chat Performance Table
              </span>
              <Badge variant="outline">Rows 16–30 (Chat Filtered)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>CSAT</TableHead>
                    <TableHead>KSCAT</TableHead>
                    <TableHead>DSAT</TableHead>
                    <TableHead>Total Count</TableHead>
                    <TableHead>CSAT %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentMetrics.map((agent: any, idx: number) => {
                    const c = agent.chat_csat || agent.chatCsat || 0;
                    const k = agent.chat_kscat || agent.chatKscat || 0;
                    const d = agent.chat_dsat || agent.chatDsat || 0;
                    const t = c + k + d;
                    const cPct = c + d > 0 ? (c / (c + d)) * 100 : 0;

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{agent.agent_email}</TableCell>
                        <TableCell>{c}</TableCell>
                        <TableCell>{k}</TableCell>
                        <TableCell className="text-red-500 font-bold">{d}</TableCell>
                        <TableCell>{t}</TableCell>
                        <TableCell className="text-emerald-600 font-bold">{cPct.toFixed(2)}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-500/10 font-bold">
                    <TableCell>Total Chat</TableCell>
                    <TableCell>{totalChatCsat}</TableCell>
                    <TableCell>{totalChatKscat}</TableCell>
                    <TableCell className="text-red-500">{totalChatDsat}</TableCell>
                    <TableCell>{totalChatCount}</TableCell>
                    <TableCell className="text-emerald-600">
                      {totalChatWoKarma > 0 ? ((totalChatCsat / totalChatWoKarma) * 100).toFixed(2) : 0}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* TABLE 5: PHONE PERFORMANCE */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2 text-purple-600">
                <Phone className="h-5 w-5" /> 5. Phone Performance Table
              </span>
              <Badge variant="outline">Rows 32–46 (Phone Filtered)</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>CSAT</TableHead>
                    <TableHead>KSCAT</TableHead>
                    <TableHead>DSAT</TableHead>
                    <TableHead>Total Count</TableHead>
                    <TableHead>CSAT %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agentMetrics.map((agent: any, idx: number) => {
                    const c = agent.phone_csat || agent.phoneCsat || 0;
                    const k = agent.phone_kscat || agent.phoneKscat || 0;
                    const d = agent.phone_dsat || agent.phoneDsat || 0;
                    const t = c + k + d;
                    const cPct = c + d > 0 ? (c / (c + d)) * 100 : 0;

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{agent.agent_email}</TableCell>
                        <TableCell>{c}</TableCell>
                        <TableCell>{k}</TableCell>
                        <TableCell className="text-red-500 font-bold">{d}</TableCell>
                        <TableCell>{t}</TableCell>
                        <TableCell className="text-emerald-600 font-bold">{cPct.toFixed(2)}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-500/10 font-bold">
                    <TableCell>Total Phone</TableCell>
                    <TableCell>{totalPhoneCsat}</TableCell>
                    <TableCell>{totalPhoneKscat}</TableCell>
                    <TableCell className="text-red-500">{totalPhoneDsat}</TableCell>
                    <TableCell>{totalPhoneCount}</TableCell>
                    <TableCell className="text-emerald-600">
                      {totalPhoneWoKarma > 0 ? ((totalPhoneCsat / totalPhoneWoKarma) * 100).toFixed(2) : 0}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
