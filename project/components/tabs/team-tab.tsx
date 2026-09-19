'use client';

import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function TeamTab() {
  // Invokes useMetrics() dynamically
  const { teamMetrics = {}, floorAverages = {} } = useMetrics() as any;

  const getVal = (source: Record<string, any>, key: string, fallback: string) => {
    const val = source[key];
    if (val === undefined || val === null) return fallback;
    return typeof val === 'number' && val <= 1 && val > 0 ? `${(val * 100).toFixed(2)}%` : String(val);
  };

  const comparisons = [
    { name: 'CSAT %', teamKey: 'CSAT adjusted with calls, %', fallbackTeam: '60.53%', fallbackFloor: '60.00%' },
    { name: 'KSCAT %', teamKey: 'kscatPercent', fallbackTeam: '40.35%', fallbackFloor: '40.00%' },
    { name: 'Adherence %', teamKey: 'Adherence, %', fallbackTeam: '77.50%', fallbackFloor: '81.70%' },
    { name: 'AHT (Average Handling Time)', teamKey: 'Average handling time', fallbackTeam: '6.1', fallbackFloor: '5.5' },
    { name: 'ABT (Average Basket Time)', teamKey: 'Average basket time', fallbackTeam: '14.5', fallbackFloor: '14.6' },
    { name: 'Escalation Rate %', teamKey: 'Escalation rate %', fallbackTeam: '4.10%', fallbackFloor: '4.70%' },
    { name: 'Deescalation Rate %', teamKey: 'Deescalation rate %', fallbackTeam: '3.10%', fallbackFloor: '4.00%' },
    { name: 'FCR %', teamKey: 'FCR, %', fallbackTeam: '56.00%', fallbackFloor: '53.50%' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Team vs. Floor Benchmark Overview</h2>
        <p className="text-xs text-muted-foreground mt-1">Direct operational comparison between team totals and overall contact center floor averages</p>
      </div>

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
                const teamValStr = getVal(teamMetrics, item.teamKey, item.fallbackTeam);
                const floorValStr = getVal(floorAverages, item.teamKey, item.fallbackFloor);

                const teamNum = parseFloat(teamValStr.replace('%', ''));
                const floorNum = parseFloat(floorValStr.replace('%', ''));
                const isOutperforming = teamNum >= floorNum;

                return (
                  <TableRow key={item.name}>
                    <TableCell className="font-semibold">{item.name}</TableCell>
                    <TableCell className="font-bold text-emerald-600">{teamValStr}</TableCell>
                    <TableCell className="text-blue-600">{floorValStr}</TableCell>
                    <TableCell>
                      {isOutperforming ? (
                        <Badge className="bg-emerald-100 text-emerald-800 gap-1 font-normal">
                          <TrendingUp className="h-3 w-3" /> Outperforming
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 gap-1 font-normal">
                          <TrendingDown className="h-3 w-3" /> Lagging Floor
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
