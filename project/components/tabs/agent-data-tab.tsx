'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Users2, BarChart3, LineChart, Inbox, Target } from 'lucide-react';

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
  const currentMetricDef = comparisons.find((c) => c.name === graphMetricKey) || comparisons[0];

  const getNumVal = (mMap: Record<string, number>, keys: string[]) => {
    if (!mMap) return 0;
    for (const k of keys) {
      if (mMap[k] !== undefined && mMap[k] !== null) {
        const v = Number(mMap[k]);
        return v <= 1 && v > 0 ? v * 100 : v;
      }
    }
    return 0;
  };

  // Fixed ViewBox Dimensions
  const SVG_WIDTH = 600;
  const SVG_HEIGHT = 220;
  const PADDING_X = 40;
  const PADDING_Y = 30;
  const USABLE_WIDTH = SVG_WIDTH - PADDING_X * 2;
  const USABLE_HEIGHT = SVG_HEIGHT - PADDING_Y * 2;

  // Compute Minimum and Maximum for Auto-Scaling Y-Axis
  const allValues: number[] = [];
  dailyProgressData.forEach((d: any) => {
    const tVal = getNumVal(d.teamMetrics || {}, currentMetricDef.keys);
    const fVal = getNumVal(d.floorMetrics || {}, currentMetricDef.keys);
    if (tVal > 0) allValues.push(tVal);
    if (fVal > 0) allValues.push(fVal);
  });

  const targetVal = kpiTargets[currentMetricDef.targetKey] || currentMetricDef.defaultTarget;
  allValues.push(targetVal);

  const minVal = allValues.length > 0 ? Math.max(0, Math.min(...allValues) * 0.85) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) * 1.15 : 100;
  const range = maxVal - minVal > 0 ? maxVal - minVal : 1;

  // Coordinates Mapping
  const chartPoints = dailyProgressData.map((d: any, idx: number) => {
    const totalPoints = Math.max(dailyProgressData.length - 1, 1);
    const x = PADDING_X + (idx / totalPoints) * USABLE_WIDTH;

    const teamNum = getNumVal(d.teamMetrics || {}, currentMetricDef.keys);
    const floorNum = getNumVal(d.floorMetrics || {}, currentMetricDef.keys);

    const yTeam = SVG_HEIGHT - PADDING_Y - ((teamNum - minVal) / range) * USABLE_HEIGHT;
    const yFloor = SVG_HEIGHT - PADDING_Y - ((floorNum - minVal) / range) * USABLE_HEIGHT;

    return {
      period: d.period,
      x,
      teamVal: teamNum,
      floorVal: floorNum,
      yTeam: isNaN(yTeam) ? SVG_HEIGHT - PADDING_Y : yTeam,
      yFloor: isNaN(yFloor) ? SVG_HEIGHT - PADDING_Y : yFloor,
    };
  });

  const yTarget = SVG_HEIGHT - PADDING_Y - ((targetVal - minVal) / range) * USABLE_HEIGHT;

  const teamLineD = chartPoints.length > 0
    ? chartPoints.reduce((acc: string, pt: any, i: number) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.yTeam.toFixed(1)}`, '')
    : '';

  const floorLineD = chartPoints.length > 0
    ? chartPoints.reduce((acc: string, pt: any, i: number) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.yFloor.toFixed(1)}`, '')
    : '';

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users2 className="h-6 w-6 text-emerald-500" /> Team vs. Floor Benchmark Overview
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Multi-series trajectory tracking comparing Team score progress against Floor averages across daily backups</p>
      </div>

      {!hasData ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No team operational data available.</p>
          <p className="text-xs mt-1">Upload KSCAT Calc, PVF, and Metrics CSV files under Data & Backups to render live benchmarks.</p>
        </Card>
      ) : (
        <>
          {/* TWO-SERIES LINE GRAPH (TEAM VS FLOOR OVER ALL MONTH BACKUPS) */}
          <Card className="border-emerald-500/30">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-emerald-600" /> Progress Trajectory Graph: {graphMetricKey}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-series progress comparing Team Score (Green Line) vs Floor Average (Blue Line) across daily backup dates
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Metric Trajectory:</label>
                  <select
                    value={graphMetricKey}
                    onChange={(e) => setGraphMetricKey(e.target.value)}
                    className="h-8 rounded-md border text-xs px-2 bg-white dark:bg-slate-900 font-bold text-emerald-600"
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
                  <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                  <span className="text-emerald-600">Team Score Trajectory</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500 inline-block shadow-sm"></span>
                  <span className="text-blue-600">Floor Average Trajectory</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
                  <span className="text-amber-600">Target Benchmark ({targetVal}{currentMetricDef.isPct ? '%' : ''})</span>
                </div>
              </div>

              {/* Responsive Line Plotting Area */}
              <div className="h-72 w-full relative bg-slate-500/5 rounded-xl border p-4 flex flex-col justify-between">
                <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1={PADDING_X} y1={PADDING_Y} x2={SVG_WIDTH - PADDING_X} y2={PADDING_Y} stroke="#e2e8f0" strokeDasharray="3" strokeWidth="1" />
                  <line x1={PADDING_X} y1={SVG_HEIGHT / 2} x2={SVG_WIDTH - PADDING_X} y2={SVG_HEIGHT / 2} stroke="#e2e8f0" strokeDasharray="3" strokeWidth="1" />
                  <line x1={PADDING_X} y1={SVG_HEIGHT - PADDING_Y} x2={SVG_WIDTH - PADDING_X} y2={SVG_HEIGHT - PADDING_Y} stroke="#e2e8f0" strokeDasharray="3" strokeWidth="1" />

                  {/* Target Benchmark Line (Amber Dashed) */}
                  {!isNaN(yTarget) && (
                    <line x1={PADDING_X} y1={yTarget} x2={SVG_WIDTH - PADDING_X} y2={yTarget} stroke="#f59e0b" strokeDasharray="5 5" strokeWidth="2" />
                  )}

                  {/* Connecting Lines */}
                  {teamLineD && <path d={teamLineD} fill="none" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}
                  {floorLineD && <path d={floorLineD} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Data Point Circles */}
                  {chartPoints.map((pt: any, i: number) => (
                    <g key={i}>
                      {/* Team Circle */}
                      <circle cx={pt.x} cy={pt.yTeam} r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                      <text x={pt.x} y={pt.yTeam - 8} textAnchor="middle" fill="#047857" fontSize="9" fontWeight="bold">
                        {pt.teamVal.toFixed(1)}{currentMetricDef.isPct ? '%' : ''}
                      </text>

                      {/* Floor Circle */}
                      <circle cx={pt.x} cy={pt.yFloor} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                      <text x={pt.x} y={pt.yFloor + 15} textAnchor="middle" fill="#1d4ed8" fontSize="9" fontWeight="bold">
                        {pt.floorVal.toFixed(1)}{currentMetricDef.isPct ? '%' : ''}
                      </text>
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
