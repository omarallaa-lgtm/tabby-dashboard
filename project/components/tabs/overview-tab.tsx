'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Star, Target, Settings2, BarChart2, Filter, Inbox } from 'lucide-react';
import { supabase } from '@/lib/metrics-context';

export function OverviewTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {} } = useMetrics() as any;
  const [channelFilter, setChannelFilter] = useState<'overall' | 'chat' | 'phone'>('overall');
  const [showTargetModal, setShowTargetModal] = useState(false);
  
  const [selectedMetric, setSelectedMetric] = useState({ label: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', target: 85 });
  const [customTarget, setCustomTarget] = useState('85');

  const getVal = (source: Record<string, any>, keys: string[]) => {
    for (const k of keys) {
      const val = source[k];
      if (val !== undefined && val !== null && val !== '') {
        if (typeof val === 'number') {
          return val <= 1 && val > 0 ? `${(val * 100).toFixed(2)}%` : String(val);
        }
        return String(val);
      }
    }
    return '-';
  };

  const getNumericVal = (source: Record<string, any>, keys: string[]) => {
    const valStr = getVal(source, keys);
    if (valStr === '-') return 0;
    return parseFloat(valStr.replace('%', '')) || 0;
  };

  const teamScore = getNumericVal(teamMetrics, [selectedMetric.teamKey, selectedMetric.label]);
  const floorScore = getNumericVal(floorAverages, [selectedMetric.teamKey, selectedMetric.label]);

  const handleSaveTarget = async () => {
    const targetVal = parseFloat(customTarget) || 85;
    await supabase.from('kpi_targets').upsert([
      { metric_key: 'csatPercent', target_value: targetVal, updated_by: 'omar.allaa@tabby.ai' }
    ]);
    setSelectedMetric({ ...selectedMetric, target: targetVal });
    setShowTargetModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Channel Filters and Target Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Overall Performance View</h2>
          <p className="text-xs text-muted-foreground mt-1">Direct operational metrics calculated live from uploaded CSV data</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex border rounded-lg p-1 bg-slate-500/10">
            <Button
              variant={channelFilter === 'overall' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChannelFilter('overall')}
              className="h-7 text-xs"
            >
              🌐 Overall
            </Button>
            <Button
              variant={channelFilter === 'chat' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChannelFilter('chat')}
              className="h-7 text-xs"
            >
              💬 Chat
            </Button>
            <Button
              variant={channelFilter === 'phone' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setChannelFilter('phone')}
              className="h-7 text-xs"
            >
              📞 Phone
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => setShowTargetModal(true)} className="gap-1 h-9 text-xs">
            <Settings2 className="h-3.5 w-3.5" /> Set Target
          </Button>
        </div>
      </div>

      {/* Target Configuration Modal */}
      {showTargetModal && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-3">
          <div className="font-bold text-emerald-600 flex items-center gap-1">
            <Target className="h-4 w-4" /> Configure KPI Target for {selectedMetric.label}
          </div>
          <div className="flex gap-2 max-w-xs">
            <Input
              type="number"
              value={customTarget}
              onChange={(e) => setCustomTarget(e.target.value)}
              className="h-8 text-xs bg-white text-gray-900"
            />
            <Button size="sm" onClick={handleSaveTarget} className="h-8 bg-emerald-600 text-white text-xs">Save Target</Button>
          </div>
        </div>
      )}

      {/* Grid Cards (20+ Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card
          onClick={() => setSelectedMetric({ label: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', target: parseFloat(customTarget) || 85 })}
          className={`cursor-pointer transition-all hover:scale-105 ${selectedMetric.label === 'CSAT %' ? 'border-emerald-500 border-2 bg-emerald-50/20' : ''}`}
        >
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-[10px] font-bold text-gray-500 uppercase">CSAT %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {getVal(teamMetrics, ['CSAT adjusted with calls, %', 'csatPercent'])}
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: {selectedMetric.target}%
            </div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'KSCAT %', teamKey: 'kscatPercent', target: 35 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">KSCAT %</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{getVal(teamMetrics, ['kscatPercent', 'KSCAT %'])}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'Adherence %', teamKey: 'Adherence, %', target: 90 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Adherence %</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{getVal(teamMetrics, ['Adherence, %', 'adherencePercent'])}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'AHT', teamKey: 'Average handling time', target: 5 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">AHT</div>
            <div className="text-2xl font-bold mt-1">{getVal(teamMetrics, ['Average handling time', 'aht'])}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'ABT', teamKey: 'Average basket time', target: 14 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">ABT</div>
            <div className="text-2xl font-bold mt-1">{getVal(teamMetrics, ['Average basket time', 'abt'])}</div>
          </CardContent>
        </Card>

        <Card onClick={() => setSelectedMetric({ label: 'Productivity 8-hrs', teamKey: 'Productivity 8-hrs', target: 30 })}>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase">Productivity 8-hrs</div>
            <div className="text-2xl font-bold mt-1">{getVal(teamMetrics, ['Productivity 8-hrs', 'productivity8hrs'])}</div>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Graph */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-emerald-600" /> Dynamic Benchmark Chart: {selectedMetric.label} ({channelFilter.toUpperCase()})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4 text-xs">
          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Team Score</span>
              <span className="text-emerald-600">{teamScore}</span>
            </div>
            <div className="h-4 w-full bg-slate-500/10 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(teamScore, 100)}%` }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-semibold mb-1">
              <span>Floor Average Benchmark</span>
              <span className="text-blue-600">{floorScore}</span>
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

      {/* Agent Leaderboard Table (Full Emails Preserved) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent Email</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>KSCAT</TableHead>
                  <TableHead>DSAT</TableHead>
                  <TableHead>CSAT %</TableHead>
                  <TableHead>KSCAT %</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentMetrics.length > 0 ? (
                  agentMetrics.map((agent: any, idx: number) => {
                    const csatCount = channelFilter === 'chat' ? agent.chatCsat : channelFilter === 'phone' ? agent.phoneCsat : agent.csat;
                    const kscatCount = channelFilter === 'chat' ? agent.chatKscat : channelFilter === 'phone' ? agent.phoneKscat : agent.kscat;
                    const dsatCount = channelFilter === 'chat' ? agent.chatDsat : channelFilter === 'phone' ? agent.phoneDsat : agent.dsat;

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-bold">#{idx + 1}</TableCell>
                        <TableCell className="font-medium">{agent.agent_email}</TableCell>
                        <TableCell>{csatCount}</TableCell>
                        <TableCell>{kscatCount}</TableCell>
                        <TableCell className="text-red-500 font-bold">{dsatCount}</TableCell>
                        <TableCell className="text-emerald-600 font-bold">{agent.csat_percent}%</TableCell>
                        <TableCell className="text-blue-600 font-semibold">{agent.kscat_percent}%</TableCell>
                        <TableCell className="text-purple-600 font-medium">{agent.variance}%</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
