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
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {}, kpiTargets = {}, updateTarget, currentUser } = useMetrics() as any;

  // Roster Selection State
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

  // Role Restriction Check: Only Admin or Team Leader can access Target Config & Roster Gear
  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

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

  const uniqueAgentMetrics = useMemo(() => {
    const map = new Map();
    agentMetrics.forEach((a: any) => {
      if (!map.has(a.agent_email)) {
        map.set(a.agent_email, a);
      }
    });
    return Array.from(map.values());
  }, [agentMetrics]);

  const allAgentEmails = useMemo(() => uniqueAgentMetrics.map((a: any) => a.agent_email), [uniqueAgentMetrics]);
  const activeRosterEmails = useMemo(() => selectedAgentEmails.length === 0 ? allAgentEmails : selectedAgentEmails, [selectedAgentEmails, allAgentEmails]);
  const filteredAgentMetrics = useMemo(() => uniqueAgentMetrics.filter((a: any) => activeRosterEmails.includes(a.agent_email)), [uniqueAgentMetrics, activeRosterEmails]);

  const teamTotalCsat = filteredAgentMetrics.reduce((s: number, a: any) => s + (a.csat || 0), 0);
  const teamTotalKscat = filteredAgentMetrics.reduce((s: number, a: any) => s + (a.kscat || 0), 0);
  const teamTotalDsat = filteredAgentMetrics.reduce((s: number, a: any) => s + (a.dsat || 0), 0);
  const teamTotalCount = teamTotalCsat + teamTotalKscat + teamTotalDsat;
  const teamTotalWoKarma = teamTotalCsat + teamTotalDsat;
  const teamTotalCsatPct = teamTotalWoKarma > 0 ? (teamTotalCsat / teamTotalWoKarma) * 100 : 0;
  const teamTotalKscatPct = teamTotalCount > 0 ? (teamTotalCsat / teamTotalCount) * 100 : 0;

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

  const handleSelectAllAgents = () => setSelectedAgentEmails([...allAgentEmails]);

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
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Sparkles className="h-6 w-6 text-emerald-500" /> Customer Service Executive Overview
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Select any horizontal metric chip below to benchmark performance against floor averages</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* RESTRICTED: Configure Target Button for Admin / Team Leader only */}
          {isAdminOrTL && (
            <Button variant="outline" size="sm" onClick={() => setShowTargetModal(true)} className="gap-1.5 h-9 text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded-xl icon-reflection-container">
              <Settings2 className="h-3.5 w-3.5" /> Configure Target
            </Button>
          )}
        </div>
      </div>

      {/* Target Setting Modal */}
      {showTargetModal && isAdminOrTL && (
        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs space-y-4 animate-fade-in-up">
          <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-sm">
            <Target className="h-5 w-5" /> Configure Operational Target Value
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
                className="w-full h-9 rounded-lg border text-xs px-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
                className="h-9 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-lg"
              />
            </div>

            <div className="flex items-end">
              <Button size="sm" onClick={handleSaveTarget} className="h-9 w-full bg-emerald-600 text-white text-xs font-bold gap-1 rounded-lg icon-reflection-container">
                <Check className="h-4 w-4" /> Save Target Value
              </Button>
            </div>
          </div>
        </div>
      )}

      {!hasData && (
        <Card className="p-6 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-3 rounded-2xl">
          <Inbox className="h-5 w-5 text-amber-600 shrink-0" />
          <span>No operational data loaded yet. Upload your KSCAT Calc, PVF, and Metrics sheets under <strong>Data & Backups</strong> to render live statistics.</span>
        </Card>
      )}

      {/* Live Benchmark Comparison Chart */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <BarChart2 className="h-5 w-5" /> Benchmark Comparison: {selectedMetric.label}
            </span>
            <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 rounded-lg font-mono">
              {activeRosterEmails.length} / {allAgentEmails.length} Roster Active
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Comparing Selected Team ({teamScore.toFixed(2)}) vs Floor Average ({floorScore.toFixed(2)}) vs Target ({targetScore})
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Team Score (Selected Roster)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{teamScore.toFixed(2)}</span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(teamScore, 100)}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Floor Average Benchmark</span>
              <span className="text-blue-600 dark:text-blue-400 font-extrabold">{floorScore.toFixed(2)}</span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(floorScore, 100)}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Configured Operational Target</span>
              <span className="text-amber-600 dark:text-amber-400 font-extrabold">{targetScore}</span>
            </div>
            <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500" style={{ width: `${Math.min(targetScore, 100)}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HORIZONTAL VIEW: TABLE 2 - TEAM PERFORMANCE WITH REFLECTION CHIPS */}
      <Card className="border border-emerald-500/30 bg-emerald-500/5 dark:bg-slate-900 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold">
              <Users className="h-5 w-5 text-emerald-500" /> 2. Team Performance (Horizontal View)
            </span>
            
            {/* RESTRICTED: Agent Filter Gear button for Admin / Team Leader only */}
            {isAdminOrTL && (
              <button
                onClick={() => setShowRosterGear(!showRosterGear)}
                className="p-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 transition-all flex items-center gap-1.5 text-xs font-bold shadow-2xs icon-reflection-container"
                title="Select Agents for Team CSAT Calculation"
              >
                <Settings2 className="h-4 w-4" /> Agent Filter Gear
              </button>
            )}
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            CSAT/DSAT totals dynamically recalculate based on active roster selections
          </CardDescription>

          {showRosterGear && isAdminOrTL && (
            <div className="p-3 mt-2 bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-xl space-y-2 text-xs animate-fade-in-up">
              <div className="flex justify-between items-center font-bold text-emerald-700 dark:text-emerald-400 border-b pb-1 border-slate-200 dark:border-slate-800">
                <span>Select Roster Agents for Team Matrix</span>
                <button onClick={handleSelectAllAgents} className="text-[10px] text-blue-600 hover:underline">Select All ({allAgentEmails.length})</button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1">
                {allAgentEmails.map((email: string) => {
                  const isChecked = activeRosterEmails.includes(email);
                  return (
                    <label key={email} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-lg">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleAgent(email)}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{email}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-emerald-500/30 shadow-2xs flex flex-col justify-between icon-reflection-container">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>CSAT</span>
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{teamTotalCsat}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-blue-500/30 shadow-2xs flex flex-col justify-between icon-reflection-container">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>KSCAT</span>
                <Percent className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{teamTotalKscat}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-red-500/30 shadow-2xs flex flex-col justify-between icon-reflection-container">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>DSAT</span>
                <ShieldAlert className="h-3.5 w-3.5 text-red-500" />
              </div>
              <div className="text-xl font-black text-red-500 mt-1">{teamTotalDsat}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between icon-reflection-container">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>Total Count</span>
                <Globe className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{teamTotalCount}</div>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between icon-reflection-container">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>w/o Karma</span>
                <Globe className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">{teamTotalWoKarma}</div>
            </div>

            <div
              onClick={() => setSelectedMetric(allMetricDefinitions[1])}
              className={`p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-blue-500/30 shadow-2xs flex flex-col justify-between cursor-pointer icon-reflection-container ${selectedMetric.label === 'KSCAT %' ? 'icon-reflection-selected ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>KSCAT %</span>
                <Percent className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{teamTotalKscatPct.toFixed(2)}%</div>
            </div>

            <div
              onClick={() => setSelectedMetric(allMetricDefinitions[0])}
              className={`p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-emerald-500/30 shadow-2xs flex flex-col justify-between cursor-pointer icon-reflection-container ${selectedMetric.label === 'CSAT %' ? 'icon-reflection-selected ring-2 ring-emerald-500' : ''}`}
            >
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                <span>CSAT %</span>
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{teamTotalCsatPct.toFixed(2)}%</div>
            </div>

            {allMetricDefinitions.slice(2).map((m) => {
              const IconComp = m.icon;
              const val = teamMetrics[m.teamKey];
              const isSelected = selectedMetric.label === m.label;

              return (
                <div
                  key={m.label}
                  onClick={() => setSelectedMetric(m)}
                  className={`p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between cursor-pointer icon-reflection-container ${isSelected ? 'icon-reflection-selected ring-2 ring-emerald-500 bg-emerald-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span className="truncate">{m.label}</span>
                    <IconComp className={`h-3.5 w-3.5 shrink-0 ${m.color}`} />
                  </div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    {formatVal(val, m.isPct)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* HORIZONTAL VIEW: TABLE 3 - FLOOR AVERAGE */}
      <Card className="border border-blue-500/30 bg-blue-500/5 dark:bg-slate-900 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-extrabold">
              <BarChart2 className="h-5 w-5 text-blue-500" /> 3. Floor Average (Horizontal View)
            </span>
            <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 rounded-lg">Floor Benchmark</Badge>
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
            Metrics sheet K:L block (Rows 25–46)
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
                  className={`p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between cursor-pointer icon-reflection-container ${isSelected ? 'icon-reflection-selected ring-2 ring-blue-500 bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span className="truncate">{m.label}</span>
                    <IconComp className={`h-3.5 w-3.5 shrink-0 ${m.color}`} />
                  </div>
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">
                    {formatVal(val, m.isPct)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* TABLE 1: OVERALL PERFORMANCE TABLE WITH PURE DARK-MODE STYLING */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-extrabold">
              <Globe className="h-5 w-5 text-emerald-500" /> 1. Overall Performance Table
            </span>
            <Badge variant="outline" className="rounded-lg">Rows 2–14 (All Channels)</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <Table className="text-xs min-w-[1600px]">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="w-12 font-bold text-slate-700 dark:text-slate-300">#</TableHead>
                  <TableHead className="w-56 font-bold text-slate-700 dark:text-slate-300">Agent Identifier</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">CSAT</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">KSCAT</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">DSAT</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Total Count</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Total w/o Karma</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">KSCAT %</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">CSAT %</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Variance</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">ABT</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Productivity 8-hrs</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Productivity Online</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Escalation %</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Deescalation %</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Adherence %</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">AGBT</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">AHT</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Closed Res %</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Closed Tickets %</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">FCR %</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Tardy/minute</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-300">Idle Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAgentMetrics.length > 0 ? (
                  <>
                    {filteredAgentMetrics.map((agent: any, idx: number) => (
                      <TableRow key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50 transition-colors">
                        <TableCell className="font-bold text-slate-700 dark:text-slate-300">#{idx + 1}</TableCell>
                        <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">{agent.agent_email}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.csat}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.kscat}</TableCell>
                        <TableCell className="text-red-500 font-bold">{agent.dsat}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.total_count}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.total_wo_karma}</TableCell>
                        <TableCell className="text-blue-600 dark:text-blue-400 font-bold">{agent.kscat_percent}%</TableCell>
                        <TableCell className="text-emerald-600 dark:text-emerald-400 font-black">{agent.csat_percent}%</TableCell>
                        <TableCell className="text-purple-600 dark:text-purple-400 font-semibold">{agent.variance}%</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.abt || '-'}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.productivity_8hrs || '-'}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.productivity_online_8hrs || '-'}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{formatVal(agent.escalation_rate, true)}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{formatVal(agent.deescalation_rate, true)}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{formatVal(agent.adherence, true)}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.agbt || '-'}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.aht || '-'}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{formatVal(agent.closed_after_resolution, true)}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{formatVal(agent.closed_tickets_pct, true)}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{formatVal(agent.fcr_percent, true)}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.tardy_minutes || '0:00:00'}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{agent.idle_time_avg ? `${agent.idle_time_avg}h` : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {/* TOTAL ROW */}
                    <TableRow className="bg-emerald-500/10 font-bold text-xs border-t-2 border-emerald-500 text-slate-900 dark:text-slate-100">
                      <TableCell colSpan={2}>Total (Selected Roster)</TableCell>
                      <TableCell>{teamTotalCsat}</TableCell>
                      <TableCell>{teamTotalKscat}</TableCell>
                      <TableCell className="text-red-500">{teamTotalDsat}</TableCell>
                      <TableCell>{teamTotalCount}</TableCell>
                      <TableCell>{teamTotalWoKarma}</TableCell>
                      <TableCell className="text-blue-600 dark:text-blue-400">{teamTotalKscatPct.toFixed(2)}%</TableCell>
                      <TableCell className="text-emerald-600 dark:text-emerald-400">{teamTotalCsatPct.toFixed(2)}%</TableCell>
                      <TableCell className="text-purple-600 dark:text-purple-400">{(teamTotalCsatPct - teamTotalKscatPct).toFixed(2)}%</TableCell>
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
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold">
                <MessageSquare className="h-5 w-5" /> 4. Chat Performance Table
              </span>
              <Badge variant="outline" className="rounded-lg">Rows 16–30</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/80">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Agent</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">CSAT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">KSCAT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">DSAT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Total</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">CSAT %</TableHead>
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
                      <TableRow key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-800/50">
                        <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">{agent.agent_email}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{c}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{k}</TableCell>
                        <TableCell className="text-red-500 font-bold">{d}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{t}</TableCell>
                        <TableCell className="text-emerald-600 dark:text-emerald-400 font-black">{cPct.toFixed(2)}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-blue-500/10 font-bold text-slate-900 dark:text-slate-100">
                    <TableCell>Total Chat</TableCell>
                    <TableCell>{totalChatCsat}</TableCell>
                    <TableCell>{totalChatKscat}</TableCell>
                    <TableCell className="text-red-500">{totalChatDsat}</TableCell>
                    <TableCell>{totalChatCount}</TableCell>
                    <TableCell className="text-emerald-600 dark:text-emerald-400">
                      {totalChatWoKarma > 0 ? ((totalChatCsat / totalChatWoKarma) * 100).toFixed(2) : 0}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* TABLE 5: PHONE PERFORMANCE */}
        <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold">
                <Phone className="h-5 w-5" /> 5. Phone Performance Table
              </span>
              <Badge variant="outline" className="rounded-lg">Rows 32–46</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-slate-800/80">
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Agent</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">CSAT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">KSCAT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">DSAT</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">Total</TableHead>
                    <TableHead className="font-bold text-slate-700 dark:text-slate-300">CSAT %</TableHead>
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
                      <TableRow key={idx} className="hover:bg-slate-100 dark:hover:bg-slate-800/50">
                        <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">{agent.agent_email}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{c}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{k}</TableCell>
                        <TableCell className="text-red-500 font-bold">{d}</TableCell>
                        <TableCell className="text-slate-800 dark:text-slate-200">{t}</TableCell>
                        <TableCell className="text-emerald-600 dark:text-emerald-400 font-black">{cPct.toFixed(2)}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-purple-500/10 font-bold text-slate-900 dark:text-slate-100">
                    <TableCell>Total Phone</TableCell>
                    <TableCell>{totalPhoneCsat}</TableCell>
                    <TableCell>{totalPhoneKscat}</TableCell>
                    <TableCell className="text-red-500">{totalPhoneDsat}</TableCell>
                    <TableCell>{totalPhoneCount}</TableCell>
                    <TableCell className="text-emerald-600 dark:text-emerald-400">
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