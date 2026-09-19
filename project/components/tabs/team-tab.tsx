'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Users2, BarChart3, LineChart, Inbox, Sparkles } from 'lucide-react';

export function TeamTab() {
  const { teamMetrics = {}, floorAverages = {}, kpiTargets = {}, dailyProgressData = [] } = useMetrics() as any;
  const [graphMetricKey, setGraphMetricKey] = useState('CSAT %');

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

  const comparisons = [
    { name: 'CSAT %', keys: ['CSAT adjusted with calls, %', 'CSAT %'], targetKey: 'csatPercent', defaultTarget: 85, isPct: true },
    { name: 'KSCAT %', keys: ['KSCAT %', 'kscatPercent'], targetKey: 'kscatPercent', defaultTarget: 35, isPct: true },
    { name: 'Adherence %', keys: ['Adherence, %', 'adherencePercent'], targetKey: 'adherencePercent', defaultTarget: 90, isPct: true },
    { name: 'AHT (Average Handling Time)', keys: ['Average handling time', 'aht'], targetKey: 'aht', defaultTarget: 5, isPct: false },
    { name: 'ABT (Average Basket Time)', keys: ['Average basket time', 'abt'], targetKey: 'abt', defaultTarget: 14, isPct: false },
    { name: 'Productivity 8-hrs', keys: ['Productivity 8-hrs', 'productivity8hrs'], targetKey: 'productivity8hrs', defaultTarget: 30, isPct: false },
    { name: 'Escalation Rate %', keys: ['Escalation rate %', 'escalationRate'], targetKey: 'escalationRate', defaultTarget: 4.5, isPct: true },
    { name: 'Deescalation Rate %', keys: ['Deescalation rate %', 'deescalationRate'], targetKey: 'deescalationRate', defaultTarget: 4.0, isPct: true },
    { name: 'FCR %', keys: ['FCR, %', 'fcrPercent'], targetKey: 'fcrPercent', defaultTarget: 70, isPct: true },
  ];

  const hasData = Object.keys(teamMetrics).length > 0;

  // Selected Metric for Dual Line Graph
  const currentMetricDef = comparisons.find((c) => c.name === graphMetricKey) || comparisons[0];

  // Helper to extract numeric values for SVG line path plotting
  const getNumVal = (mMap: Record<string, number>, keys: string[]) => {
    for (const k of keys) {
      if (mMap[k] !== undefined && mMap[k] !== null) {
        const v = Number(mMap[k]);
        return v <= 1 && v > 0 ? v * 100 : v;
      }
    }
    return 0;
  };

  // Build SVG Path Coordinates for Two Line Series (Blue = Team, Amber = Floor)
  const chartPoints = dailyProgressData.map((d: any, idx: number) => {
    const totalPoints = Math.max(dailyProgressData.length - 1, 1);
    const x = (idx / totalPoints) * 100;

    const teamNum = getNumVal(d.teamMetrics || {}, currentMetricDef.keys);
    const floorNum = getNumVal(d.floorMetrics || {}, currentMetricDef.keys);

    return {
      period: d.period,
      x,
      teamVal: teamNum,
      floorVal: floorNum,
      // Map y between 10% (max 100) and 90% (min 0) for SVG padding
      yTeam: 90 - Math.min(Math.max(teamNum, 0), 100) * 0.8,
      yFloor: 90 - Math.min(Math.max(floorNum, 0), 100) * 0.8,
    };
  });

  const teamLineD = chartPoints.length > 0
    ? chartPoints.reduce((acc: string, pt: any, i: number) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.yTeam}%`, '')
    : '';

  const floorLineD = chartPoints.length > 0
    ? chartPoints.reduce((acc: string, pt: any, i: number) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x}% ${pt.yFloor}%`, '')
    : '';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users2 className="h-6 w-6 text-emerald-500" /> Team vs. Floor Benchmark Overview
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Multi-series progress tracking comparing Team performance trajectory against Floor averages across daily backups</p>
      </div>

      {!hasData ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No team operational data available.</p>
          <p className="text-xs mt-1">Upload KSCAT Calc, PVF, and Metrics CSV files in Data & Backups to render live benchmarks.</p>
        </Card>
      ) : (
        <>
          {/* TWO-SERIES LINE GRAPH (TEAM VS FLOOR OVER ALL MONTH BACKUPS) */}
          <Card className="border-blue-500/30">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-blue-500" /> Everyday Progress Line Graph: {graphMetricKey}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Two-series line graph tracking Team progress (Blue Line) vs Floor Average progress (Amber Line) across all daily backups
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Metric Trajectory:</label>
                  <select
                    value={graphMetricKey}
                    onChange={(e) => setGraphMetricKey(e.target.value)}
                    className="h-8 rounded-md border text-xs px-2 bg-white dark:bg-slate-900 font-bold text-blue-600"
                  >
                    {comparisons.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Legend matching provided reference layout */}
              <div className="flex items-center justify-center gap-6 text-xs font-bold border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500 inline-block shadow-sm"></span>
                  <span className="text-blue-600">Team Score Trajectory</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
                  <span className="text-amber-600">Floor Average Trajectory</span>
                </div>
              </div>

              {/* Responsive Line Plotting Area */}
              <div className="h-64 w-full relative bg-slate-500/5 rounded-xl border p-4 flex flex-col justify-between">
                <svg className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1="0" y1="10%" x2="100%" y2="10%" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e2e8f0" strokeDasharray="3" />
                  <line x1="0" y1="90%" x2="100%" y2="90%" stroke="#e2e8f0" strokeDasharray="3" />

                  {/* Team Line (Blue) */}
                  {teamLineD && <path d={teamLineD} fill="none" stroke="#3b82f6" strokeWidth="3" className="transition-all duration-500" />}

                  {/* Floor Line (Amber) */}
                  {floorLineD && <path d={floorLineD} fill="none" stroke="#f59e0b" strokeWidth="3" className="transition-all duration-500" />}

                  {/* Data Points */}
                  {chartPoints.map((pt: any, i: number) => (
                    <g key={i}>
                      <circle cx={`${pt.x}%`} cy={`${pt.yTeam}%`} r="5" fill="#3b82f6" className="transition-all hover:scale-125" />
                      <circle cx={`${pt.x}%`} cy={`${pt.yFloor}%`} r="5" fill="#f59e0b" className="transition-all hover:scale-125" />
                    </g>
                  ))}
                </svg>

                {/* X-Axis Date Labels */}
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold pt-2 border-t">
                  {chartPoints.map((pt: any, i: number) => (
                    <span key={i}>{pt.period}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DYNAMIC METRIC COMPARISON TABLE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-500" /> Benchmark Scorecard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">Metric Name</TableHead>
                    <TableHead>Team Value</TableHead>
                    <TableHead>Floor Average</TableHead>
                    <TableHead>Configured Target</TableHead>
                    <TableHead className="text-right">Status vs Floor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisons.map((item) => {
                    const teamValStr = getVal(teamMetrics, item.keys);
                    const floorValStr = getVal(floorAverages, item.keys);

                    const teamNum = parseFloat((teamValStr || '0').replace('%', ''));
                    const floorNum = parseFloat((floorValStr || '0').replace('%', ''));
                    const isOutperforming = teamNum >= floorNum;
                    const targetVal = kpiTargets[item.targetKey] || item.defaultTarget;

                    return (
                      <TableRow key={item.name} className="hover:bg-slate-500/5">
                        <TableCell className="font-semibold">{item.name}</TableCell>
                        <TableCell className="font-bold text-emerald-500">{teamValStr}</TableCell>
                        <TableCell className="text-blue-500 font-semibold">{floorValStr}</TableCell>
                        <TableCell className="text-amber-500 font-bold">{targetVal}{item.isPct ? '%' : ''}</TableCell>
                        <TableCell className="text-right">
                          {teamValStr !== '-' && floorValStr !== '-' ? (
                            isOutperforming ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 font-semibold">
                                <TrendingUp className="h-3 w-3" /> Outperforming
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800 border-red-300 gap-1 font-semibold">
                                <TrendingDown className="h-3 w-3" /> Lagging Floor
                              </Badge>
                            )
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
