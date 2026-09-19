'use client';

import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Users2, BarChart3, Inbox } from 'lucide-react';

export function TeamTab() {
  const { teamMetrics = {}, floorAverages = {}, kpiTargets = {} } = useMetrics() as any;

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
    { name: 'CSAT %', keys: ['CSAT adjusted with calls, %', 'CSAT %'], target: kpiTargets.csatPercent || 85 },
    { name: 'KSCAT %', keys: ['KSCAT %', 'kscatPercent'], target: kpiTargets.kscatPercent || 35 },
    { name: 'Adherence %', keys: ['Adherence, %', 'adherencePercent'], target: kpiTargets.adherencePercent || 90 },
    { name: 'AHT (Average Handling Time)', keys: ['Average handling time', 'aht'], target: kpiTargets.aht || 5 },
    { name: 'ABT (Average Basket Time)', keys: ['Average basket time', 'abt'], target: kpiTargets.abt || 14 },
    { name: 'Escalation Rate %', keys: ['Escalation rate %', 'escalationRate'], target: 4.5 },
    { name: 'Deescalation Rate %', keys: ['Deescalation rate %', 'deescalationRate'], target: 4.0 },
    { name: 'FCR %', keys: ['FCR, %', 'fcrPercent'], target: kpiTargets.fcrPercent || 70 },
  ];

  const hasData = Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Users2 className="h-6 w-6 text-emerald-500" /> Team vs. Floor Benchmark Overview
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Comparative analytics evaluating team operational scores against floor benchmarks and targets</p>
      </div>

      {!hasData ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No team operational data available.</p>
          <p className="text-xs mt-1">Upload KSCAT Calc, PVF, and Metrics CSV files in Data & Backups to render live benchmarks.</p>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" /> Comparative Scorecard
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

                  return (
                    <TableRow key={item.name} className="hover:bg-slate-500/5">
                      <TableCell className="font-semibold">{item.name}</TableCell>
                      <TableCell className="font-bold text-emerald-500">{teamValStr}</TableCell>
                      <TableCell className="text-blue-500 font-semibold">{floorValStr}</TableCell>
                      <TableCell className="text-amber-500 font-bold">{item.target}%</TableCell>
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
      )}
    </div>
  );
}
