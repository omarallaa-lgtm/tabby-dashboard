'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Star, Target, BarChart2, Inbox, Globe, MessageSquare, Phone, Users, TrendingUp, Settings2, Sparkles, CheckCircle2 } from 'lucide-react';

export function OverviewTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {}, kpiTargets = {}, updateTarget, historicalTrends = [] } = useMetrics() as any;
  const [activeChannel, setActiveChannel] = useState<'overall' | 'chat' | 'phone'>('overall');
  const [selectedMetric, setSelectedMetric] = useState({ label: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', targetKey: 'csatPercent', defaultTarget: 85 });
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [tempTarget, setTempTarget] = useState('85');

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
  const targetScore = kpiTargets[selectedMetric.targetKey] || selectedMetric.defaultTarget;

  const handleSaveTarget = async () => {
    const val = parseFloat(tempTarget);
    if (!isNaN(val)) {
      await updateTarget(selectedMetric.targetKey, val);
      setShowTargetModal(false);
    }
  };

  // Channel Calculations
  const totalCsat = agentMetrics.reduce((s: number, a: any) => s + (a.csat || 0), 0);
  const totalKscat = agentMetrics.reduce((s: number, a: any) => s + (a.kscat || 0), 0);
  const totalDsat = agentMetrics.reduce((s: number, a: any) => s + (a.dsat || 0), 0);
  const totalCount = totalCsat + totalKscat + totalDsat;
  const totalWoKarma = totalCsat + totalDsat;
  const totalCsatPct = totalWoKarma > 0 ? (totalCsat / totalWoKarma) * 100 : 0;
  const totalKscatPct = totalCount > 0 ? (totalCsat / totalCount) * 100 : 0;

  const totalChatCsat = agentMetrics.reduce((s: number, a: any) => s + (a.chat_csat || a.chatCsat || 0), 0);
  const totalChatKscat = agentMetrics.reduce((s: number, a: any) => s + (a.chat_kscat || a.chatKscat || 0), 0);
  const totalChatDsat = agentMetrics.reduce((s: number, a: any) => s + (a.chat_dsat || a.chatDsat || 0), 0);

  const totalPhoneCsat = agentMetrics.reduce((s: number, a: any) => s + (a.phone_csat || a.phoneCsat || 0), 0);
  const totalPhoneKscat = agentMetrics.reduce((s: number, a: any) => s + (a.phone_kscat || a.phoneKscat || 0), 0);
  const totalPhoneDsat = agentMetrics.reduce((s: number, a: any) => s + (a.phone_dsat || a.phoneDsat || 0), 0);

  const hasData = agentMetrics.length > 0 || Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-500" /> Customer Service Executive Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Live contact center KPIs, multi-channel performance, and historical Supabase trend backups</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex border rounded-lg p-1 bg-slate-500/10">
            <Button variant={activeChannel === 'overall' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveChannel('overall')} className="h-7 text-xs gap-1">
              <Globe className="h-3.5 w-3.5 text-emerald-500" /> Overall
            </Button>
            <Button variant={activeChannel === 'chat' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveChannel('chat')} className="h-7 text-xs gap-1">
              <MessageSquare className="h-3.5 w-3.5 text-blue-500" /> Chat
            </Button>
            <Button variant={activeChannel === 'phone' ? 'default' : 'ghost'} size="sm" onClick={() => setActiveChannel('phone')} className="h-7 text-xs gap-1">
              <Phone className="h-3.5 w-3.5 text-purple-500" /> Phone
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowTargetModal(true)} className="gap-1 h-9 text-xs">
            <Settings2 className="h-3.5 w-3.5" /> Configure Target
          </Button>
        </div>
      </div>

      {/* Target Setting Modal */}
      {showTargetModal && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-3 animate-fade-in-up">
          <div className="font-bold text-emerald-500 flex items-center gap-2">
            <Target className="h-4 w-4" /> Configure Target for {selectedMetric.label}
          </div>
          <div className="flex gap-2 max-w-xs">
            <Input type="number" value={tempTarget} onChange={(e) => setTempTarget(e.target.value)} className="h-8 text-xs bg-white text-gray-900" />
            <Button size="sm" onClick={handleSaveTarget} className="h-8 bg-emerald-600 text-white text-xs">Save Target</Button>
          </div>
        </div>
      )}

      {/* Interactive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card
          onClick={() => setSelectedMetric({ label: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', targetKey: 'csatPercent', defaultTarget: 85 })}
          className={`cursor-pointer transition-all hover:scale-105 ${selectedMetric.label === 'CSAT %' ? 'border-emerald-500 border-2 bg-emerald-500/10' : ''}`}
        >
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-[10px] font-bold text-gray-500 uppercase">CSAT %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{formatVal(totalCsatPct, true)}</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: {kpiTargets.csatPercent || 85}%
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'KSCAT %', teamKey: 'KSCAT %', targetKey: 'kscatPercent', defaultTarget: 35 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">KSCAT %</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{formatVal(totalKscatPct, true)}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'Adherence %', teamKey: 'Adherence, %', targetKey: 'adherencePercent', defaultTarget: 90 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Adherence %</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{formatVal(teamMetrics['Adherence, %'], true)}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'AHT', teamKey: 'Average handling time', targetKey: 'aht', defaultTarget: 5 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">AHT</div>
            <div className="text-2xl font-bold mt-1">{formatVal(teamMetrics['Average handling time'])}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'ABT', teamKey: 'Average basket time', targetKey: 'abt', defaultTarget: 14 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">ABT</div>
            <div className="text-2xl font-bold mt-1">{formatVal(teamMetrics['Average basket time'])}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'FCR %', teamKey: 'FCR, %', targetKey: 'fcrPercent', defaultTarget: 70 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">FCR %</div>
            <div className="text-2xl font-bold mt-1">{formatVal(teamMetrics['FCR, %'], true)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Graph & Supabase Historical Backups Chart */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-500" /> Benchmark Comparison: {selectedMetric.label}
              </span>
              <Badge className="bg-emerald-100 text-emerald-800">Live Comparison</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Team Score</span>
                <span className="text-emerald-500 font-bold">{teamScore.toFixed(2)}</span>
              </div>
              <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(teamScore, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Floor Average Benchmark</span>
                <span className="text-blue-500 font-bold">{floorScore.toFixed(2)}</span>
              </div>
              <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(floorScore, 100)}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span>Configured Operational Target</span>
                <span className="text-amber-500 font-bold">{targetScore}</span>
              </div>
              <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(targetScore, 100)}%` }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historical Backup Trajectory (Sourced from Supabase Backups) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" /> Supabase Backup Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-xs">
            {historicalTrends.length > 0 ? (
              <div className="space-y-3">
                {historicalTrends.map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-2 rounded-lg bg-slate-500/5 border">
                    <div>
                      <div className="font-bold">{t.period}</div>
                      <div className="text-[10px] text-muted-foreground">{t.tickets} total tickets</div>
                    </div>
                    <div className="font-bold text-emerald-500">{t.csat}% CSAT</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground py-8 text-center">No historical period backups saved yet. Import CSV files under Data & Backups.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TABLES 2 & 3: TEAM PERFORMANCE & FLOOR AVERAGE (Side-by-Side) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
              <Users className="h-5 w-5" /> 2. Team Performance Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="text-xs">
              <TableHeader><TableRow><TableHead>Metric Name</TableHead><TableHead className="text-right">Team Value</TableHead></TableRow></TableHeader>
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
                <TableRow><TableCell className="font-semibold">Adherence %</TableCell><TableCell className="text-right text-purple-600 font-bold">{formatVal(teamMetrics['Adherence, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Handling Time (AHT)</TableCell><TableCell className="text-right">{formatVal(teamMetrics['Average handling time'])}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-600">
              <BarChart2 className="h-5 w-5" /> 3. Floor Average Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="text-xs">
              <TableHeader><TableRow><TableHead>Metric Name</TableHead><TableHead className="text-right">Floor Average</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell className="font-semibold">CSAT %</TableCell><TableCell className="text-right font-bold text-emerald-600">{formatVal(floorAverages['CSAT adjusted with calls, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Basket Time (ABT)</TableCell><TableCell className="text-right">{formatVal(floorAverages['Average basket time'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Productivity 8-hrs</TableCell><TableCell className="text-right">{formatVal(floorAverages['Productivity 8-hrs'])}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Escalation Rate %</TableCell><TableCell className="text-right text-amber-600 font-bold">{formatVal(floorAverages['Escalation rate %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Adherence %</TableCell><TableCell className="text-right text-purple-600 font-bold">{formatVal(floorAverages['Adherence, %'], true)}</TableCell></TableRow>
                <TableRow><TableCell className="font-semibold">Average Handling Time (AHT)</TableCell><TableCell className="text-right">{formatVal(floorAverages['Average handling time'])}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* TABLE 1: OVERALL PERFORMANCE TABLE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-5 w-5 text-emerald-500" /> 1. Overall Performance Table (All 22 Columns)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table className="text-xs min-w-[1600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="w-56">Agent Identifier</TableHead>
                  <TableHead>CSAT</TableHead><TableHead>KSCAT</TableHead><TableHead>DSAT</TableHead>
                  <TableHead>Total Count</TableHead><TableHead>Total w/o Karma</TableHead>
                  <TableHead>KSCAT %</TableHead><TableHead>CSAT %</TableHead><TableHead>Variance</TableHead>
                  <TableHead>ABT</TableHead><TableHead>Productivity 8-hrs</TableHead>
                  <TableHead>Productivity Online 8-hrs</TableHead><TableHead>Escalation Rate %</TableHead>
                  <TableHead>Deescalation Rate %</TableHead><TableHead>Adherence %</TableHead>
                  <TableHead>AGBT</TableHead><TableHead>AHT</TableHead>
                  <TableHead>Closed After Resolution %</TableHead><TableHead>Closed Tickets %</TableHead>
                  <TableHead>FCR %</TableHead><TableHead>Tardy/minute</TableHead><TableHead>Idle Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentMetrics.length > 0 ? (
                  agentMetrics.map((agent: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-slate-500/5">
                      <TableCell className="font-bold">#{idx + 1}</TableCell>
                      <TableCell className="font-medium">{agent.agent_email}</TableCell>
                      <TableCell>{agent.csat}</TableCell><TableCell>{agent.kscat}</TableCell><TableCell className="text-red-500 font-bold">{agent.dsat}</TableCell>
                      <TableCell>{agent.total_count}</TableCell><TableCell>{agent.total_wo_karma}</TableCell>
                      <TableCell className="text-blue-600 font-semibold">{agent.kscat_percent}%</TableCell>
                      <TableCell className="text-emerald-600 font-bold">{agent.csat_percent}%</TableCell>
                      <TableCell className="text-purple-600 font-medium">{agent.variance}%</TableCell>
                      <TableCell>{agent.abt || '-'}</TableCell><TableCell>{agent.productivity_8hrs || '-'}</TableCell>
                      <TableCell>{agent.productivity_online_8hrs || '-'}</TableCell>
                      <TableCell>{formatVal(agent.escalation_rate, true)}</TableCell>
                      <TableCell>{formatVal(agent.deescalation_rate, true)}</TableCell>
                      <TableCell>{formatVal(agent.adherence, true)}</TableCell>
                      <TableCell>{agent.agbt || '-'}</TableCell><TableCell>{agent.aht || '-'}</TableCell>
                      <TableCell>{formatVal(agent.closed_after_resolution, true)}</TableCell>
                      <TableCell>{formatVal(agent.closed_tickets_pct, true)}</TableCell>
                      <TableCell>{formatVal(agent.fcr_percent, true)}</TableCell>
                      <TableCell>{agent.tardy_minutes || '0:00:00'}</TableCell>
                      <TableCell>{agent.idle_time_avg ? `${agent.idle_time_avg}h` : '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={23} className="text-center py-8 text-muted-foreground">No records loaded.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* TABLES 4 & 5: CHAT & PHONE PERFORMANCE TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-500">
              <MessageSquare className="h-5 w-5" /> 4. Chat Performance Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table className="text-xs">
                <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>CSAT</TableHead><TableHead>KSCAT</TableHead><TableHead>DSAT</TableHead><TableHead>Total Count</TableHead><TableHead>CSAT %</TableHead></TableRow></TableHeader>
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
                        <TableCell>{c}</TableCell><TableCell>{k}</TableCell><TableCell className="text-red-500 font-bold">{d}</TableCell>
                        <TableCell>{t}</TableCell><TableCell className="text-emerald-500 font-bold">{cPct.toFixed(2)}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-500/10 font-bold">
                    <TableCell>Total Chat</TableCell><TableCell>{totalChatCsat}</TableCell><TableCell>{totalChatKscat}</TableCell><TableCell className="text-red-500">{totalChatDsat}</TableCell><TableCell>{totalChatCsat + totalChatKscat + totalChatDsat}</TableCell>
                    <TableCell className="text-emerald-500">{totalChatCsat + totalChatDsat > 0 ? ((totalChatCsat / (totalChatCsat + totalChatDsat)) * 100).toFixed(2) : 0}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-purple-500">
              <Phone className="h-5 w-5" /> 5. Phone Performance Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table className="text-xs">
                <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>CSAT</TableHead><TableHead>KSCAT</TableHead><TableHead>DSAT</TableHead><TableHead>Total Count</TableHead><TableHead>CSAT %</TableHead></TableRow></TableHeader>
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
                        <TableCell>{c}</TableCell><TableCell>{k}</TableCell><TableCell className="text-red-500 font-bold">{d}</TableCell>
                        <TableCell>{t}</TableCell><TableCell className="text-emerald-500 font-bold">{cPct.toFixed(2)}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-500/10 font-bold">
                    <TableCell>Total Phone</TableCell><TableCell>{totalPhoneCsat}</TableCell><TableCell>{totalPhoneKscat}</TableCell><TableCell className="text-red-500">{totalPhoneDsat}</TableCell><TableCell>{totalPhoneCsat + totalPhoneKscat + totalPhoneDsat}</TableCell>
                    <TableCell className="text-emerald-500">{totalPhoneCsat + totalPhoneDsat > 0 ? ((totalPhoneCsat / (totalPhoneCsat + totalPhoneDsat)) * 100).toFixed(2) : 0}%</TableCell>
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
