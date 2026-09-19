'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Star, Target, Settings2, TrendingUp, Inbox, BarChart2 } from 'lucide-react';

export function OverviewTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {} } = useMetrics() as any;
  const [selectedMetric, setSelectedMetric] = useState<{ label: string; teamKey: string; target: number }>({
    label: 'CSAT %',
    teamKey: 'CSAT adjusted with calls, %',
    target: 85,
  });

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

  const hasData = agentMetrics.length > 0 || Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Overall Performance View</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span>Click any KPI card below to update the benchmark comparison graph</span>
          </p>
        </div>
      </div>

      {!hasData && (
        <Card className="p-6 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Inbox className="h-5 w-5 text-amber-600 shrink-0" />
          <span>No operational data loaded yet. Upload your KSCAT Calc, PVF, and Metrics sheets under <strong>Data & Import</strong> to render live statistics.</span>
        </Card>
      )}

      {/* Grid Cards (Click-to-Compare Bindings) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card
          onClick={() => setSelectedMetric({ label: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', target: 85 })}
          className={`cursor-pointer transition-all hover:border-emerald-500 ${selectedMetric.label === 'CSAT %' ? 'border-emerald-500 border-2 bg-emerald-50/20' : ''}`}
        >
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">CSAT %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {getVal(teamMetrics, ['CSAT adjusted with calls, %', 'csatPercent'])}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 85%
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setSelectedMetric({ label: 'KSCAT %', teamKey: 'kscatPercent', target: 40 })}
          className={`cursor-pointer transition-all hover:border-blue-500 ${selectedMetric.label === 'KSCAT %' ? 'border-blue-500 border-2 bg-blue-50/20' : ''}`}
        >
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">KSCAT %</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {getVal(teamMetrics, ['kscatPercent', 'KSCAT %'])}
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setSelectedMetric({ label: 'Adherence %', teamKey: 'Adherence, %', target: 90 })}
          className={`cursor-pointer transition-all hover:border-purple-500 ${selectedMetric.label === 'Adherence %' ? 'border-purple-500 border-2 bg-purple-50/20' : ''}`}
        >
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Adherence %</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {getVal(teamMetrics, ['Adherence, %', 'adherencePercent'])}
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setSelectedMetric({ label: 'AHT', teamKey: 'Average handling time', target: 5 })}
          className={`cursor-pointer transition-all hover:border-emerald-500 ${selectedMetric.label === 'AHT' ? 'border-emerald-500 border-2 bg-emerald-50/20' : ''}`}
        >
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">AHT</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['Average handling time', 'aht'])}
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setSelectedMetric({ label: 'ABT', teamKey: 'Average basket time', target: 14 })}
          className={`cursor-pointer transition-all hover:border-emerald-500 ${selectedMetric.label === 'ABT' ? 'border-emerald-500 border-2 bg-emerald-50/20' : ''}`}
        >
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">ABT</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['Average basket time', 'abt'])}
            </div>
          </CardContent>
        </Card>

        <Card
          onClick={() => setSelectedMetric({ label: 'Productivity 8-hrs', teamKey: 'Productivity 8-hrs', target: 30 })}
          className={`cursor-pointer transition-all hover:border-emerald-500 ${selectedMetric.label === 'Productivity 8-hrs' ? 'border-emerald-500 border-2 bg-emerald-50/20' : ''}`}
        >
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Productivity 8-hrs</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['Productivity 8-hrs', 'productivity8hrs'])}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Score Comparison Graph */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-emerald-600" /> Metric Benchmark: {selectedMetric.label}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Comparing Team ({teamScore}) vs Floor Average ({floorScore}) vs Target ({selectedMetric.target})
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4 text-xs">
              {/* Team Score Bar */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Team Score</span>
                  <span className="text-emerald-600">{teamScore}</span>
                </div>
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(teamScore, 100)}%` }}></div>
                </div>
              </div>

              {/* Floor Average Bar */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Floor Average Benchmark</span>
                  <span className="text-blue-600">{floorScore}</span>
                </div>
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(floorScore, 100)}%` }}></div>
                </div>
              </div>

              {/* Target Score Bar */}
              <div>
                <div className="flex justify-between font-semibold mb-1">
                  <span>Operational Target</span>
                  <span className="text-amber-600">{selectedMetric.target}</span>
                </div>
                <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: `${Math.min(selectedMetric.target, 100)}%` }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Floor Averages Reference Box */}
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
                  <TableCell className="text-right text-emerald-600 font-bold">
                    {getVal(floorAverages, ['CSAT adjusted with calls, %', 'csat'])}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Basket Time</TableCell>
                  <TableCell className="text-right">
                    {getVal(floorAverages, ['Average basket time', 'abt'])}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Productivity 8-hrs</TableCell>
                  <TableCell className="text-right">
                    {getVal(floorAverages, ['Productivity 8-hrs', 'productivity8hrs'])}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Escalation Rate %</TableCell>
                  <TableCell className="text-right">
                    {getVal(floorAverages, ['Escalation rate %', 'escalationRate'])}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table (Preserving Full Email Identifiers) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Agent Performance Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent Identifier</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>KSCAT</TableHead>
                  <TableHead>DSAT</TableHead>
                  <TableHead>CSAT %</TableHead>
                  <TableHead>KSCAT %</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {agentMetrics.length > 0 ? (
                  agentMetrics.map((agent: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold">#{idx + 1}</TableCell>
                      <TableCell className="font-medium text-gray-900">{agent.agent_email}</TableCell>
                      <TableCell>{agent.csat}</TableCell>
                      <TableCell>{agent.kscat}</TableCell>
                      <TableCell className="text-red-500 font-bold">{agent.dsat}</TableCell>
                      <TableCell className="text-emerald-600 font-bold">{agent.csat_percent}%</TableCell>
                      <TableCell className="text-blue-600 font-semibold">{agent.kscat_percent}%</TableCell>
                      <TableCell className="text-purple-600 font-medium">{agent.variance}%</TableCell>
                    </TableRow>
                  ))
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
