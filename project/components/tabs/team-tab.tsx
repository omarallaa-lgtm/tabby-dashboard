'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Users2, BarChart3, LineChart, Inbox } from 'lucide-react';

export function TeamTab() {
  const { teamMetrics = {}, floorAverages = {}, kpiTargets = {}, dailyProgressData = [] } = useMetrics() as any;
  const [graphMetricKey, setGraphMetricKey] = useState('CSAT %');

  const formatVal = (val: any, isPct = false) => {
    if (val === undefined || val === null || val === '') return '-';
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace('%', ''));
    if (isNaN(num)) return String(val);
    if (isPct) {
      return num <= 1 && num > 0 ? `${(num * 100).toFixed(2)}%` : `${num.toFixed(2)}%`;
    }
    return String(num);
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

  // Robust Number Parser for Graph Scaling
  const getRawNum = (sourceMap: Record<string, any>, keys: string[], isPct: boolean) => {
    if (!sourceMap) return 0;
    for (const k of keys) {
      const raw = sourceMap[k];
      if (raw !== undefined && raw !== null && raw !== '') {
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace('%', ''));
        if (isNaN(num)) continue;
        if (isPct && num <= 1 && num > 0) return num * 100;
        return num;
      }
    }
    return 0;
  };

  // SVG Graph Layout Parameters
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 260;
  const PADDING_LEFT = 60;
  const PADDING_RIGHT = 40;
  const PADDING_TOP = 40;
  const PADDING_BOTTOM = 40;

  const DRAW_WIDTH = SVG_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const DRAW_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  // Extract Numerical Values Across Daily Backups
  const targetVal = kpiTargets[currentMetricDef.targetKey] || currentMetricDef.defaultTarget;
  const dataPointsRaw = dailyProgressData.map((d: any) => ({
    period: d.period,
    teamNum: getRawNum(d.teamMetrics, currentMetricDef.keys, currentMetricDef.isPct),
    floorNum: getRawNum(d.floorMetrics, currentMetricDef.keys, currentMetricDef.isPct),
  }));

  const allNums = dataPointsRaw.flatMap((d: any) => [d.teamNum, d.floorNum]).filter((v: number) => v > 0);
  allNums.push(targetVal);

  const minVal = allNums.length > 0 ? Math.max(0, Math.min(...allNums) * 0.8) : 0;
  const maxVal = allNums.length > 0 ? Math.max(...allNums) * 1.2 : 100;
  const range = maxVal - minVal > 0 ? maxVal - minVal : 1;

  // Map Coordinates (y = 0 is TOP, so higher values have smaller y values)
  const chartPoints = dataPointsRaw.map((d: any, idx: number) => {
    const totalPoints = Math.max(dataPointsRaw.length - 1, 1);
    const x = PADDING_LEFT + (idx / totalPoints) * DRAW_WIDTH;

    const yTeam = PADDING_TOP + (1 - (d.teamNum - minVal) / range) * DRAW_HEIGHT;
    const yFloor = PADDING_TOP + (1 - (d.floorNum - minVal) / range) * DRAW_HEIGHT;

    return {
      period: d.period,
      x,
      teamVal: d.teamNum,
      floorVal: d.floorNum,
      yTeam: isNaN(yTeam) ? PADDING_TOP + DRAW_HEIGHT / 2 : yTeam,
      yFloor: isNaN(yFloor) ? PADDING_TOP + DRAW_HEIGHT / 2 : yFloor,
    };
  });

  const yTarget = PADDING_TOP + (1 - (targetVal - minVal) / range) * DRAW_HEIGHT;

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
        <p className="text-xs text-muted-foreground mt-1">Everyday trajectory progress analysis comparing Team Score against Floor Average across daily backups</p>
      </div>

      {!hasData ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No team operational data available.</p>
          <p className="text-xs mt-1">Upload KSCAT Calc, PVF, and Metrics CSV files under Data & Backups to render live benchmarks.</p>
        </Card>
      ) : (
        <>
          {/* TWO-SERIES PROGRESS LINE GRAPH */}
          <Card className="border-emerald-500/30">
            <CardHeader className="pb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-emerald-600" /> Progress Analysis Graph: {graphMetricKey}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Multi-series progress tracking Team Score (Blue Line) vs Floor Average (Amber Line) across daily backups
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
              {/* Legend matching provided reference */}
              <div className="flex items-center justify-center gap-6 text-xs font-bold border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500 inline-block shadow-sm"></span>
                  <span className="text-blue-600">Team Score Trajectory</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
                  <span className="text-amber-600">Floor Average Trajectory</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
                  <span className="text-emerald-600">Target Benchmark ({targetVal}{currentMetricDef.isPct ? '%' : ''})</span>
                </div>
              </div>

              {/* Scaled Responsive Graph Area */}
              <div className="h-80 w-full relative bg-slate-500/5 rounded-xl border p-2">
                <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full overflow-visible">
                  {/* Grid Lines */}
                  <line x1={PADDING_LEFT} y1={PADDING_TOP} x2={SVG_WIDTH - PADDING_RIGHT} y2={PADDING_TOP} stroke="#cbd5e1" strokeDasharray="3" strokeWidth="1" />
                  <line x1={PADDING_LEFT} y1={PADDING_TOP + DRAW_HEIGHT / 2} x2={SVG_WIDTH - PADDING_RIGHT} y2={PADDING_TOP + DRAW_HEIGHT / 2} stroke="#cbd5e1" strokeDasharray="3" strokeWidth="1" />
                  <line x1={PADDING_LEFT} y1={SVG_HEIGHT - PADDING_BOTTOM} x2={SVG_WIDTH - PADDING_RIGHT} y2={SVG_HEIGHT - PADDING_BOTTOM} stroke="#cbd5e1" strokeDasharray="3" strokeWidth="1" />

                  {/* Target Benchmark Dashed Line */}
                  {!isNaN(yTarget) && yTarget >= PADDING_TOP && yTarget <= SVG_HEIGHT - PADDING_BOTTOM && (
                    <g>
                      <line x1={PADDING_LEFT} y1={yTarget} x2={SVG_WIDTH - PADDING_RIGHT} y2={yTarget} stroke="#10b981" strokeDasharray="4 4" strokeWidth="2" />
                      <text x={SVG_WIDTH - PADDING_RIGHT + 5} y={yTarget + 4} fill="#059669" fontSize="10" fontWeight="bold">
                        Target ({targetVal}{currentMetricDef.isPct ? '%' : ''})
                      </text>
                    </g>
                  )}

                  {/* Team Line (Blue) */}
                  {teamLineD && <path d={teamLineD} fill="none" stroke="#3b82f6" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Floor Line (Amber) */}
                  {floorLineD && <path d={floorLineD} fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />}

                  {/* Data Points and Value Annotations */}
                  {chartPoints.map((pt: any, i: number) => (
                    <g key={i}>
                      {/* Team Circle & Tag */}
                      <circle cx={pt.x} cy={pt.yTeam} r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
                      <text x={pt.x} y={pt.yTeam - 9} textAnchor="middle" fill="#1d4ed8" fontSize="10" fontWeight="bold">
                        {pt.teamVal.toFixed(1)}{currentMetricDef.isPct ? '%' : ''}
                      </text>

                      {/* Floor Circle & Tag */}
                      <circle cx={pt.x} cy={pt.yFloor} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
                      <text x={pt.x} y={pt.yFloor + 16} textAnchor="middle" fill="#b45309" fontSize="10" fontWeight="bold">
                        {pt.floorVal.toFixed(1)}{currentMetricDef.isPct ? '%' : ''}
                      </text>

                      {/* X-Axis Period Label */}
                      <text x={pt.x} y={SVG_HEIGHT - PADDING_BOTTOM + 20} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="bold">
                        {pt.period}
                      </text>
                    </g>
                  ))}
                </svg>
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
                    const teamValStr = formatVal(teamMetrics[item.keys[0]] || teamMetrics[item.keys[1]], item.isPct);
                    const floorValStr = formatVal(floorAverages[item.keys[0]] || floorAverages[item.keys[1]], item.isPct);

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
