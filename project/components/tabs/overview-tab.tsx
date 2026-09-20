'use client';

import { useState, useMemo } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Inbox, MessageSquare, Phone, Users, Globe, BarChart2, Target, 
  Settings2, Sparkles, Check, Clock, TrendingUp, ShieldAlert, Zap, Percent, Activity
} from 'lucide-react';

export function OverviewTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {}, kpiTargets = {}, updateTarget } = useMetrics() as any;
  const [activeChannel, setActiveChannel] = useState<'overall' | 'chat' | 'phone'>('overall');

  // Roster Selection State (Gear Icon Toggle)
  const [showRosterGear, setShowRosterGear] = useState(false);
  const [selectedAgentEmails, setSelectedAgentEmails] = useState<string[]>([]);

  // Selected Metric for Live Comparison Chart
  const [selectedMetric, setSelectedMetric] = useState({
    label: 'CSAT %',
    teamKey: 'CSAT adjusted with calls, %',
    floorKey: 'CSAT adjusted with calls, %',
    targetKey: 'csatPercent',
    defaultTarget: 85,
    isPct: true,
  });

  // Target Modal State
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetMetricKey, setTargetMetricKey] = useState('csatPercent');
  const [tempTargetValue, setTempTargetValue] = useState('85');

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

  const getNumericVal = (source: Record<string, any>, key: string) => {
    const raw = source[key];
    if (raw === undefined || raw === null) return 0;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace('%', ''));
    if (isNaN(num)) return 0;
    return num <= 1 && num > 0 ? num * 100 : num;
  };

  // Comprehensive Metric Definitions
  const allMetricDefinitions = [
    { label: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', floorKey: 'CSAT adjusted with calls, %', targetKey: 'csatPercent', defaultTarget: 85, isPct: true, icon: Sparkles, color: 'text-emerald-500' },
    { label: 'KSCAT %', teamKey: 'KSCAT %', floorKey: 'KSCAT %', targetKey: 'kscatPercent', defaultTarget: 35, isPct: true, icon: Percent, color: 'text-blue-500' },
    { label: 'Adherence %', teamKey: 'Adherence, %', floorKey: 'Adherence, %', targetKey: 'adherencePercent', defaultTarget: 90, isPct: true, icon: Target, color: 'text-purple-500' },
    { label: 'Average Handling Time (AHT)', teamKey: 'Average handling time', floorKey: 'Average handling time', targetKey: 'aht', defaultTarget: 5, isPct: false, icon: Clock, color: 'text-amber-500' },
    { label: 'Average Basket Time (ABT)', teamKey: 'Average basket time', floorKey: 'Average basket time', targetKey: 'abt', defaultTarget: 14, isPct: false, icon: Zap, color: 'text-teal-500' },
    { label: 'Productivity 8-hrs', teamKey: 'Productivity 8-hrs', floorKey: 'Productivity 8-hrs', targetKey: 'productivity8hrs', defaultTarget: 30, isPct: false, icon: Activity, color: 'text-indigo-500' },
    { label: 'Productivity Online 8-hrs', teamKey: 'Productivity Online 8-hrs', floorKey: 'Productivity Online 8-hrs', targetKey: 'productivityOnline8hrs', defaultTarget: 40, isPct: false, icon: Activity, color: 'text-sky-500' },
    { label: 'Escalation Rate %', teamKey: 'Escalation rate %', floorKey: 'Escalation rate %', targetKey: 'escalationRate', defaultTarget: 4.5, isPct: true, icon: ShieldAlert, color: 'text-red-500' },
    { label: 'Deescalation Rate %', teamKey: 'Deescalation rate %', floorKey: 'Deescalation rate %', targetKey: 'deescalationRate', defaultTarget: 4.0, isPct: true, icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Average Group Basket Time', teamKey: 'Average group basket time', floorKey: 'Average group basket time', targetKey: 'agbt', defaultTarget: 25, isPct: false, icon: Zap, color: 'text-slate-500' },
    { label: 'Closed After Resolution %', teamKey: 'Closed after resolution, %', floorKey: 'Closed after resolution, %', targetKey: 'closedAfterRes', defaultTarget: 60, isPct: true, icon: Check, color: 'text-emerald-600' },
    { label: 'Closed Tickets %', teamKey: 'Closed tickets, %', floorKey: 'Closed tickets, %', targetKey: 'closedTickets', defaultTarget: 50, isPct: true, icon: Check, color: 'text-blue-600' },
    { label: 'FCR %', teamKey: 'FCR, %', floorKey: 'FCR, %', targetKey: 'fcrPercent', defaultTarget: 70, isPct: true, icon: Target, color: 'text-emerald-500' },
  ];

  // Deduplicate agent rows by agent_email
  const uniqueAgentMetrics = useMemo(() => {
    const map = new Map();
    agentMetrics.forEach((a: any) => {
      if (!map.has(a.agent_email)) {
        map.set(a.agent_email, a);
      }
    });
    return Array.from(map.values());
  }, [agentMetrics]);

  // All Unique Agent Emails
  const allAgentEmails = useMemo(() => {
    return uniqueAgentMetrics.map((a: any) => a.agent_email);
  }, [uniqueAgentMetrics]);

  // Active Filtered Roster
  const activeRosterEmails = useMemo(() => {
    if (selectedAgentEmails.length === 0) return allAgentEmails;
    return selectedAgentEmails;
  }, [selectedAgentEmails, allAgentEmails]);

  // Filtered Agent Subset for Dynamic Team Totals
  const filteredAgentMetrics = useMemo(() => {
    return uniqueAgentMetrics.filter((a: any) => activeRosterEmails.includes(a.agent_email));
  }, [uniqueAgentMetrics, activeRosterEmails]);

  // Dynamic Team Totals
  const teamTotalCsat = filteredAgentMetrics.reduce((s: number, a: any) => s + (a.csat || 0), 0);
  const teamTotalKscat = filteredAgentMetrics.reduce((s: number, a: any) => s + (a.kscat || 0), 0);
  const teamTotalDsat = filteredAgentMetrics.reduce((s: number, a: any) => s + (a.dsat || 0), 0);
  const teamTotalCount = teamTotalCsat + teamTotalKscat + teamTotalDsat;
  const teamTotalWoKarma = teamTotalCsat + teamTotalDsat;
  const teamTotalCsatPct = teamTotalWoKarma > 0 ? (teamTotalCsat / teamTotalWoKarma) * 100 : 0;
  const teamTotalKscatPct = teamTotalCount > 0 ? (teamTotalCsat / teamTotalCount) * 100 : 0;

  // Dynamic Metric Comparison Scores
  const teamScore = selectedMetric.label === 'CSAT %' ? teamTotalCsatPct : getNumericVal(teamMetrics, selectedMetric.teamKey);
  const floorScore = getNumericVal(floorAverages, selectedMetric.floorKey);
  const targetScore = kpiTargets[selectedMetric.targetKey] || selectedMetric.defaultTarget;

  const handleToggleAgent = (email: string) => {
    const current = selectedAgentEmails.length === 0 ? [...allAgentEmails] : [...selectedAgentEmails];
    if (current.includes(email)) {
      setSelectedAgentEmails(current.filter((e) => e !== email));
    } else {
      setSelectedAgentEmails([...current, email]);
    }
  };

  const handleSelectAllAgents = () => {
    setSelectedAgentEmails([...allAgentEmails]);
  };

  const handleSaveTarget = async () => {
    const val = parseFloat(tempTargetValue);
    if (!isNaN(val)) {
      await updateTarget(targetMetricKey, val);
      if (selectedMetric.targetKey === targetMetricKey) {
        setSelectedMetric({ ...selectedMetric, defaultTarget: val });
      }
      setShowTargetModal(false);
    }
  };

  // Channel Totals
  const totalChatCsat = uniqueAgentMetrics.reduce((s: number, a: any) => s + (a.chat_csat || a.chatCsat || 0), 0);
  const totalChatKscat = uniqueAgentMetrics.reduce((s: number, a: any) => s + (a.chat_kscat || a.chatKscat || 0), 0);
  const totalChatDsat = uniqueAgentMetrics.reduce((s: number, a: any) => s + (a.chat_dsat || a.chatDsat || 0), 0);
  const totalChatCount = totalChatCsat + totalChatKscat + totalChatDsat;
  const totalChatWoKarma = totalChatCsat + totalChatDsat;

  const totalPhoneCsat = uniqueAgentMetrics.reduce((s: number, a: any) => s + (a.phone_csat || a.phoneCsat || 0), 0);
  const totalPhoneKscat = uniqueAgentMetrics.reduce((s: number, a: any) => s + (a.phone_kscat || a.phoneKscat || 0), 0);
  const totalPhoneDsat = uniqueAgentMetrics.reduce((s: number, a: any) => s + (a.phone_dsat || a.phoneDsat || 0), 0);
  const totalPhoneCount = totalPhoneCsat + totalPhoneKscat + totalPhoneDsat;
  const totalPhoneWoKarma = totalPhoneCsat + totalPhoneDsat;

  const hasData = uniqueAgentMetrics.length > 0 || Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-emerald-500" /> Customer Service Executive Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Click any horizontal metric icon chip below to compare Team vs. Floor Average and Targets</p>
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

          <Button variant="outline" size="sm" onClick={() => setShowTargetModal(true)} className="gap-1 h-9 text-xs font-bold border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10">
            <Settings2 className="h-3.5 w-3.5" /> Configure Target
          </Button>
        </div>
      </div>

      {/* Target Setting Modal supporting ALL Metrics */}
      {showTargetModal && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs space-y-4 animate-fade-in-up">
          <div className="font-bold text-emerald-600 flex items-center gap-2 text-sm">
            <Target className="h-5 w-5" /> Configure Operational Target for Any Metric
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Select Metric</label>
              <select
                value={targetMetricKey}
                onChange={(e) => {
                  setTargetMetricKey(e.target.value);
                  const found = allMetricDefinitions.find((m) => m.targetKey === e.target.value);
                  setTempTargetValue(String(kpiTargets[e.target.value] || found?.defaultTarget || 85));
                }}
                className="w-full h-9 rounded-md border text-xs px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              >
                {allMetricDefinitions.map((m) => (
                  <option key={m.targetKey} value={m.targetKey}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700 dark:text-slate-300">Target Value</label>
              <Input
                type="number"
                value={tempTargetValue}
                onChange={(e) => setTempTargetValue(e.target.value)}
                className="h-9 text-xs bg-white text-gray-900"
              />
            </div>

            <div className="flex items-end">
              <Button size="sm" onClick={handleSaveTarget} className="h-9 w-full bg-emerald-600 text-white text-xs font-bold gap-1">
                <Check className="h-4 w-4" /> Save Target Value
              </Button>
            </div>
          </div>
        </div>
      )}

      {!hasData && (
        <Card className="p-6 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Inbox className="h-5 w-5 text-amber-600 shrink-0" />
          <span>No operational data loaded yet. Upload your KSCAT Calc, PVF, and Metrics sheets under <strong>Data & Import</strong> to render live statistics.</span>
        </Card>
      )}

      {/* Live Benchmark Comparison Chart */}
      <Card className="border-emerald-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600">
              <BarChart2 className="h-5 w-5" /> Live Comparison Chart: {selectedMetric.label}
            </span>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
              {activeRosterEmails.length} / {allAgentEmails.length} Roster Agents Filtered
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Comparing Selected Team Roster ({teamScore.toFixed(2)}) vs Floor Average ({floorScore.toFixed(2)}) vs Target ({targetScore})
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Team Score (Selected Roster)</span>
              <span className="text-emerald-600 font-bold">{teamScore.toFixed(2)}</span>
            </div>
            <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(teamScore, 100)}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Floor Average Benchmark</span>
              <span className="text-blue-600 font-bold">{floorScore.toFixed(2)}</span>
            </div>
            <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(floorScore, 100)}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Configured Operational Target</span>
              <span className="text-amber-600 font-bold">{targetScore}</span>
            </div>
            <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(targetScore, 100)}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HORIZONTAL VIEW: TABLE 2 - TEAM PERFORMANCE */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-700">
              <Users className="h-5 w-5" /> 2. Team Performance (Horizontal Icon View)
            </span>
            <button
              onClick={() => setShowRosterGear(!showRosterGear)}
              className="p-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 transition-all flex items-center gap-1 text-xs font-bold"
              title="Select Agents for Team CSAT Calculation"
            >
              <Settings2 className="h-4 w-4" /> Agent Filter Gear
            </button>
          </CardTitle>
          <CardDescription className="text-xs">
            CSAT/DSAT totals dynamically recalculate based on agents selected via the gear filter. Click any icon card to display its benchmark graph.
          </CardDescription>

          {/* Gear Icon Agent Selection Panel */}
          {showRosterGear && (
            <div className="p-3 mt-2 bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-lg space-y-2 text-xs animate-fade-in-up">
              <div className="flex justify-between items-center font-bold text-emerald-700 border-b pb-1">
                <span>Select Roster Agents for Team CSAT Calculation</span>
                <button onClick={handleSelectAllAgents} className="text-[10px] text-blue-600 hover:underline">Select All ({allAgentEmails.length})</button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1">
                {allAgentEmails.map((email: string) => {
                  const isChecked = activeRosterEmails.includes(email);
                  return (
                    <label key={email} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAgent(email)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="font-mono text-[11px]">{email}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-500/30 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>CSAT</span>
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">{teamTotalCsat}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-500/30 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>KSCAT</span>
                <Percent className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="text-xl font-extrabold text-blue-600 mt-1">{teamTotalKscat}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-red-500/30 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>DSAT</span>
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
              </div>
              <div className="text-xl font-extrabold text-red-500 mt-1">{teamTotalDsat}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>Total Count</span>
                <Globe className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="text-xl font-extrabold mt-1">{teamTotalCount}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>Total w/o Karma</span>
                <Globe className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="text-xl font-extrabold mt-1">{teamTotalWoKarma}</div>
            </div>

            <div
              onClick={() => setSelectedMetric(allMetricDefinitions[1])}
              className={`p-3 bg-white dark:bg-slate-800 rounded-xl border border-blue-500/30 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-105 ${selectedMetric.label === 'KSCAT %' ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>KSCAT %</span>
                <Percent className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="text-xl font-extrabold text-blue-600 mt-1">{teamTotalKscatPct.toFixed(2)}%</div>
            </div>

            <div
              onClick={() => setSelectedMetric(allMetricDefinitions[0])}
              className={`p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-500/30 shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-105 ${selectedMetric.label === 'CSAT %' ? 'ring-2 ring-emerald-500' : ''}`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>CSAT %</span>
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-extrabold text-emerald-600 mt-1">{teamTotalCsatPct.toFixed(2)}%</div>
            </div>

            {allMetricDefinitions.slice(2).map((m) => {
              const IconComp = m.icon;
              const val = teamMetrics[m.teamKey];
              const isSelected = selectedMetric.label === m.label;

              return (
                <div
                  key={m.label}
                  onClick={() => setSelectedMetric(m)}
                  className={`p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-105 ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span className="truncate">{m.label}</span>
                    <IconComp className={`h-3.5 w-3.5 shrink-0 ${m.color}`} />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                    {formatVal(val, m.isPct)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* HORIZONTAL VIEW: TABLE 3 - FLOOR AVERAGE */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-700">
              <BarChart2 className="h-5 w-5" /> 3. Floor Average (Horizontal Icon View)
            </span>
            <Badge className="bg-blue-100 text-blue-800">Floor Benchmark Reference</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Extracted directly from Metrics sheet K:L block (Rows 25–46). Click any metric card to load its floor benchmark into the chart.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {allMetricDefinitions.map((m) => {
              const IconComp = m.icon;
              const val = floorAverages[m.floorKey];
              const isSelected = selectedMetric.label === m.label;

              return (
                <div
                  key={m.label}
                  onClick={() => setSelectedMetric(m)}
                  className={`p-3 bg-white dark:bg-slate-800 rounded-xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all hover:scale-105 ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span className="truncate">{m.label}</span>
                    <IconComp className={`h-3.5 w-3.5 shrink-0 ${m.color}`} />
                  </div>
                  <div className="text-xl font-extrabold text-blue-600 mt-1">
                    {formatVal(val, m.isPct)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                {filteredAgentMetrics.length > 0 ? (
                  <>
                    {filteredAgentMetrics.map((agent: any, idx: number) => (
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
                    {/* TOTAL ROW */}
                    <TableRow className="bg-slate-500/10 font-bold text-xs border-t-2 border-emerald-500">
                      <TableCell colSpan={2}>Total (Selected Roster)</TableCell>
                      <TableCell>{teamTotalCsat}</TableCell>
                      <TableCell>{teamTotalKscat}</TableCell>
                      <TableCell className="text-red-500">{teamTotalDsat}</TableCell>
                      <TableCell>{teamTotalCount}</TableCell>
                      <TableCell>{teamTotalWoKarma}</TableCell>
                      <TableCell className="text-blue-600">{teamTotalKscatPct.toFixed(2)}%</TableCell>
                      <TableCell className="text-emerald-600">{teamTotalCsatPct.toFixed(2)}%</TableCell>
                      <TableCell className="text-purple-600">{(teamTotalCsatPct - teamTotalKscatPct).toFixed(2)}%</TableCell>
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

      {/* TABLES 4 & 5: CHAT & PHONE PERFORMANCE TABLES */}
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
                  {filteredAgentMetrics.map((agent: any, idx: number) => {
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
                  {filteredAgentMetrics.map((agent: any, idx: number) => {
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
