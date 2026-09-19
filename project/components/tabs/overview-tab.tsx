'use client';

import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Star, Target, Settings2, TrendingUp, Inbox } from 'lucide-react';

export function OverviewTab() {
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {} } = useMetrics() as any;

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

  const hasData = agentMetrics.length > 0 || Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Overall Performance View</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span>✓ = Meets Target</span> | <span>★ = Beats Floor Average</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Settings2 className="h-4 w-4" /> Set Targets
          </Button>
        </div>
      </div>

      {!hasData && (
        <Card className="p-6 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
          <Inbox className="h-5 w-5 text-amber-600 shrink-0" />
          <span>No operational data loaded yet. Upload your KSCAT Calc, PVF, and Metrics sheets under <strong>Data & Import</strong> to render live statistics.</span>
        </Card>
      )}

      {/* Grid Cards (Bound ONLY to uploaded teamMetrics) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="border-emerald-500 border-2 bg-emerald-50/20">
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">CSAT %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {getVal(teamMetrics, ['CSAT adjusted with calls, %', 'csatPercent'])}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 85
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">KSCAT %</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {getVal(teamMetrics, ['kscatPercent', 'KSCAT %'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">CSAT Count</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['csatCount', 'CSAT Count'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">KSCAT Count</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['kscatCount', 'KSCAT Count'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">DSAT Count</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {getVal(teamMetrics, ['dsatCount', 'DSAT Count'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Total Tickets</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['totalTickets', 'Total Count'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Adherence %</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {getVal(teamMetrics, ['Adherence, %', 'adherencePercent'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">AHT</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['Average handling time', 'aht'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">ABT</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['Average basket time', 'abt'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Productivity (8-hrs)</div>
            <div className="text-2xl font-bold mt-1">
              {getVal(teamMetrics, ['Productivity 8-hrs', 'productivity8hrs'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Escalation Rate %</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {getVal(teamMetrics, ['Escalation rate %', 'escalationRate'])}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Deescalation Rate %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {getVal(teamMetrics, ['Deescalation rate %', 'deescalationRate'])}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Monthly Trend: CSAT %
              <Badge className="bg-emerald-100 text-emerald-800">
                <TrendingUp className="h-3 w-3 mr-1" /> ACTIVE PERIOD
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40 w-full border-t border-b py-4 relative flex items-end">
              <svg className="w-full h-full overflow-visible">
                <line x1="0" y1="10%" x2="100%" y2="10%" stroke="#f59e0b" strokeDasharray="4" strokeWidth="1.5" />
                <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#3b82f6" strokeWidth="2" />
                <path d="M0,85 Q50,75 100,60" fill="none" stroke="#10b981" strokeWidth="3" />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
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
                  <TableHead>Agent</TableHead>
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
                      <TableCell className="font-medium">{agent.agent_name || agent.agent_email}</TableCell>
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
