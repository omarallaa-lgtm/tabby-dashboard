'use client';

import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Inbox } from 'lucide-react';

export function TeamTab() {
  const { teamMetrics = {}, floorAverages = {} } = useMetrics() as any;

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
    return null;
  };

  const comparisons = [
    { name: 'CSAT %', keys: ['CSAT adjusted with calls, %', 'csatPercent'] },
    { name: 'KSCAT %', keys: ['kscatPercent', 'KSCAT %'] },
    { name: 'Adherence %', keys: ['Adherence, %', 'adherencePercent'] },
    { name: 'AHT (Average Handling Time)', keys: ['Average handling time', 'aht'] },
    { name: 'ABT (Average Basket Time)', keys: ['Average basket time', 'abt'] },
    { name: 'Escalation Rate %', keys: ['Escalation rate %', 'escalationRate'] },
    { name: 'Deescalation Rate %', keys: ['Deescalation rate %', 'deescalationRate'] },
    { name: 'FCR %', keys: ['FCR, %', 'fcrPercent'] },
  ];

  const hasData = Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Team vs. Floor Benchmark Overview</h2>
        <p className="text-xs text-muted-foreground mt-1">Direct operational comparison between team totals and overall contact center floor averages</p>
      </div>

      {!hasData ? (
        <Card className="p-8 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mx-auto mb-2 text-gray-400" />
          <p className="text-sm font-medium">No team operational data available.</p>
          <p className="text-xs mt-1">Upload KSCAT Calc, PVF, and Metrics CSV files in the Data & Import tab to populate benchmark metrics.</p>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="w-[300px]">Metric Name</TableHead>
                  <TableHead>Team Value</TableHead>
                  <TableHead>Floor Average</TableHead>
                  <TableHead>Status vs Floor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {comparisons.map((item) => {
                  const teamValStr = getVal(teamMetrics, item.keys);
                  const floorValStr = getVal(floorAverages, item.keys);

                  if (!teamValStr && !floorValStr) return null;

                  const teamNum = parseFloat((teamValStr || '0').replace('%', ''));
                  const floorNum = parseFloat((floorValStr || '0').replace('%', ''));
                  const isOutperforming = teamNum >= floorNum;

                  return (
                    <TableRow key={item.name}>
                      <TableCell className="font-semibold">{item.name}</TableCell>
                      <TableCell className="font-bold text-emerald-600">{teamValStr || '-'}</TableCell>
                      <TableCell className="text-blue-600">{floorValStr || '-'}</TableCell>
                      <TableCell>
                        {teamValStr && floorValStr ? (
                          isOutperforming ? (
                            <Badge className="bg-emerald-100 text-emerald-800 gap-1 font-normal">
                              <TrendingUp className="h-3 w-3" /> Outperforming
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 gap-1 font-normal">
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
