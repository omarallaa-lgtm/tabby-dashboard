'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useMetrics } from '@/lib/metrics-context';
import { Building2, TrendingUp, TrendingDown, Minus, Trophy, Users } from 'lucide-react';

export function TeamTab() {
  const { teamMetrics } = useMetrics();

  const csatPctStr = teamMetrics?.csatPercent || '60.53%';
  const kscatPctStr = teamMetrics?.kscatPercent || '40.35%';
  const totalDsatVal = teamMetrics?.dsatCount ?? 90;
  const adherenceStr = teamMetrics?.adherencePercent || '77.50%';
  const ahtStr = teamMetrics?.aht || '6.1';

  const defaultFloorMetrics = [
    { metricName: 'CSAT %', value: '60.00%' },
    { metricName: 'Average Basket Time', value: '14.6' },
    { metricName: 'Productivity 8-hrs', value: '30.0' },
    { metricName: 'Productivity Online 8-hrs', value: '44.9' },
    { metricName: 'Escalation Rate %', value: '4.70%' },
    { metricName: 'Deescalation Rate %', value: '4.00%' },
    { metricName: 'Adherence %', value: '81.70%' },
    { metricName: 'Average Group Basket Time', value: '24.4' },
    { metricName: 'Average Handling Time', value: '5.5' },
    { metricName: 'Closed After Resolution %', value: '61.50%' },
    { metricName: 'Closed Tickets %', value: '50.30%' },
    { metricName: 'FCR %', value: '53.50%' },
  ];

  const floorMetrics = teamMetrics?.floorMetrics || defaultFloorMetrics;

  const comparisonTable = [
    { name: 'CSAT %', team: csatPctStr, floor: '60.00%', isLowerBetter: false },
    { name: 'KSCAT %', team: kscatPctStr, floor: '40.00%', isLowerBetter: false },
    { name: 'Adherence %', team: adherenceStr, floor: '81.70%', isLowerBetter: false },
    { name: 'AHT (Average Handling Time)', team: ahtStr, floor: '5.5', isLowerBetter: true },
    { name: 'ABT (Average Basket Time)', team: '14.5', floor: '14.6', isLowerBetter: true },
    { name: 'DSAT Count', team: String(totalDsatVal), floor: '100', isLowerBetter: true },
    { name: 'Escalation Rate %', team: '4.10%', floor: '4.70%', isLowerBetter: true },
    { name: 'Deescalation Rate %', team: '3.10%', floor: '4.00%', isLowerBetter: false },
    { name: 'FCR %', team: '56.00%', floor: '53.50%', isLowerBetter: false },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            <div>
              <CardTitle>Team vs. Floor Benchmark Overview</CardTitle>
              <CardDescription>
                Direct operational comparison between your team totals and overall contact center floor averages
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0">
          <div className="border rounded-xl overflow-hidden">
            <Table className="text-xs">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">Metric Name</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Team Value</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Floor Average</TableHead>
                  <TableHead className="text-center font-bold text-gray-700">Status vs Floor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {comparisonTable.map((row) => {
                  const teamNum = parseFloat(row.team.replace('%', '').trim()) || 0;
                  const floorNum = parseFloat(row.floor.replace('%', '').trim()) || 0;

                  const isBetter = row.isLowerBetter ? teamNum <= floorNum : teamNum >= floorNum;
                  const isSame = teamNum === floorNum;

                  return (
                    <TableRow key={row.name} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{row.name}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{row.team}</TableCell>
                      <TableCell className="text-right font-semibold text-blue-600">{row.floor}</TableCell>
                      <TableCell className="text-center">
                        {isSame ? (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-[10px]">
                            <Minus className="h-3 w-3 mr-1 inline" /> Equal to Floor
                          </Badge>
                        ) : isBetter ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                            <TrendingUp className="h-3 w-3 mr-1 inline" /> Outperforming
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px]">
                            <TrendingDown className="h-3 w-3 mr-1 inline" /> Lagging Floor
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="p-6">
        <CardHeader className="px-0 pt-0 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-base">Complete Floor Metrics Reference</CardTitle>
              <CardDescription className="text-xs">Extracted floor metrics values</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {floorMetrics.map((fm, i) => (
              <div key={i} className="p-3 border rounded-lg bg-slate-50 space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground truncate">{fm.metricName}</p>
                <p className="text-base font-bold text-blue-600">{fm.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}