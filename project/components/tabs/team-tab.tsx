'use client';

import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function TeamTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Team vs. Floor Benchmark Overview</h2>
        <p className="text-xs text-muted-foreground mt-1">Direct operational comparison between your team totals and overall contact center floor averages</p>
      </div>

      {/* Main Benchmark Comparison Table */}
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
              <TableRow>
                <TableCell className="font-semibold">CSAT %</TableCell>
                <TableCell className="font-bold text-emerald-600">60.53%</TableCell>
                <TableCell className="text-blue-600">60.00%</TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 font-normal">
                    <TrendingUp className="h-3 w-3" /> Outperforming
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">KSCAT %</TableCell>
                <TableCell className="font-bold text-emerald-600">40.35%</TableCell>
                <TableCell className="text-blue-600">40.00%</TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 font-normal">
                    <TrendingUp className="h-3 w-3" /> Outperforming
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">Adherence %</TableCell>
                <TableCell className="font-bold text-purple-600">77.50%</TableCell>
                <TableCell className="text-blue-600">81.70%</TableCell>
                <TableCell>
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1 font-normal">
                    <TrendingDown className="h-3 w-3" /> Lagging Floor
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">AHT (Average Handling Time)</TableCell>
                <TableCell className="font-bold">6.1</TableCell>
                <TableCell className="text-blue-600">5.5</TableCell>
                <TableCell>
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1 font-normal">
                    <TrendingDown className="h-3 w-3" /> Lagging Floor
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">ABT (Average Basket Time)</TableCell>
                <TableCell className="font-bold">14.5</TableCell>
                <TableCell className="text-blue-600">14.6</TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 font-normal">
                    <TrendingUp className="h-3 w-3" /> Outperforming
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">DSAT Count</TableCell>
                <TableCell className="font-bold text-red-600">90</TableCell>
                <TableCell className="text-blue-600">100</TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 font-normal">
                    <TrendingUp className="h-3 w-3" /> Outperforming
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">Escalation Rate %</TableCell>
                <TableCell className="font-bold text-amber-600">4.10%</TableCell>
                <TableCell className="text-blue-600">4.70%</TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 font-normal">
                    <TrendingUp className="h-3 w-3" /> Outperforming
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">Deescalation Rate %</TableCell>
                <TableCell className="font-bold text-emerald-600">3.10%</TableCell>
                <TableCell className="text-blue-600">4.00%</TableCell>
                <TableCell>
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 gap-1 font-normal">
                    <TrendingDown className="h-3 w-3" /> Lagging Floor
                  </Badge>
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-semibold">FCR %</TableCell>
                <TableCell className="font-bold">56.00%</TableCell>
                <TableCell className="text-blue-600">53.50%</TableCell>
                <TableCell>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 gap-1 font-normal">
                    <TrendingUp className="h-3 w-3" /> Outperforming
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Complete Floor Metrics Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Complete Floor Metrics Reference</CardTitle>
          <CardDescription className="text-xs">Extracted floor metrics values</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">CSAT %</div>
                <div className="text-xl font-bold text-blue-600 mt-1">60.00%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Average Basket Time</div>
                <div className="text-xl font-bold text-blue-600 mt-1">14.6</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Productivity 8-hrs</div>
                <div className="text-xl font-bold text-blue-600 mt-1">30.0</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Productivity Online 8-hrs</div>
                <div className="text-xl font-bold text-blue-600 mt-1">44.9</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Escalation Rate %</div>
                <div className="text-xl font-bold text-blue-600 mt-1">4.70%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Deescalation Rate %</div>
                <div className="text-xl font-bold text-blue-600 mt-1">4.00%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Adherence %</div>
                <div className="text-xl font-bold text-blue-600 mt-1">81.70%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Average Group Basket Time</div>
                <div className="text-xl font-bold text-blue-600 mt-1">24.4</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Average Handling Time</div>
                <div className="text-xl font-bold text-blue-600 mt-1">5.5</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Closed After Resolution %</div>
                <div className="text-xl font-bold text-blue-600 mt-1">61.50%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">Closed Tickets %</div>
                <div className="text-xl font-bold text-blue-600 mt-1">50.30%</div>
              </CardContent>
            </Card>

            <Card className="bg-gray-50/50">
              <CardContent className="p-3">
                <div className="text-[11px] font-medium text-gray-500 uppercase">FCR %</div>
                <div className="text-xl font-bold text-blue-600 mt-1">53.50%</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
