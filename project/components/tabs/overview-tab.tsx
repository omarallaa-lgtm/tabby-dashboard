'use client';

import { useMetrics } from '@/lib/metrics-context';
import { formatPercent, formatNumber } from '@/lib/csv-parser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Star, Target, Settings2, TrendingUp } from 'lucide-react';

/**
 * Every value below reads from `teamMetrics` / `floorAverages`, which are
 * populated in lib/metrics-context.tsx directly from the `level_aggregates`
 * table using the SAME canonical keys that lib/csv-parser.ts + the Data
 * Import tab write (csat, kscat, dsat, totalCount, totalWoKarma,
 * kscatPercent, csatPercent, abt, productivity8hrs, ... — see
 * METRIC_NAME_TO_KEY in lib/csv-parser.ts).
 *
 * Previously this file read camelCase keys (csatPercent, kscatCount,
 * adherencePercent...) that nothing ever wrote, so every card silently fell
 * back to a hardcoded mock number regardless of what was imported. Those
 * fallbacks are removed: a genuinely-missing value now shows "—" per spec
 * §47 (never display a fake number for missing data).
 */
export function OverviewTab() {
  const context = useMetrics() as any;
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {} } = context;

  const hasTeamData = Object.keys(teamMetrics).length > 0;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
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

      {!hasTeamData && (
        <div className="p-3 rounded-md text-xs bg-amber-50 border border-amber-200 text-amber-800">
          No Team Overall data found for the current period. Upload KSCAT Calc, PVF, and Metrics files in the Data tab.
        </div>
      )}

      {/* Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="border-emerald-500 border-2 bg-emerald-50/20">
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">CSAT %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{formatPercent(teamMetrics.csatPercent)}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 85%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">KSCAT %</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{formatPercent(teamMetrics.kscatPercent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">CSAT Count</div>
            <div className="text-2xl font-bold mt-1">{teamMetrics.csat ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">KSCAT Count</div>
            <div className="text-2xl font-bold mt-1">{teamMetrics.kscat ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">DSAT Count</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{teamMetrics.dsat ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Total Count</div>
            <div className="text-2xl font-bold mt-1">{teamMetrics.totalCount ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Total w/o Karma</div>
            <div className="text-2xl font-bold mt-1">{teamMetrics.totalWoKarma ?? '—'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Adherence %</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{formatPercent(teamMetrics.adherence)}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 90%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">AHT</div>
            <div className="text-2xl font-bold mt-1">{formatNumber(teamMetrics.aht)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">ABT</div>
            <div className="text-2xl font-bold mt-1">{formatNumber(teamMetrics.abt)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Productivity (8-hrs)</div>
            <div className="text-2xl font-bold mt-1">{formatNumber(teamMetrics.productivity8hrs)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Productivity Online (8-hrs)</div>
            <div className="text-2xl font-bold mt-1">{formatNumber(teamMetrics.productivityOnline8hrs)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">
            <div className="text-xs font-semibold text-gray-600 uppercase">Escalation Rate %</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{formatPercent(teamMetrics.escalationRate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Deescalation Rate %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{formatPercent(teamMetrics.deescalationRate)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Closed After Resolution %</div>
            <div className="text-2xl font-bold mt-1">{formatPercent(teamMetrics.closedAfterResolution)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Closed Tickets %</div>
            <div className="text-2xl font-bold mt-1">{formatPercent(teamMetrics.closedTickets)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">
            <div className="text-xs font-semibold text-gray-600 uppercase">FCR %</div>
            <div className="text-2xl font-bold mt-1">{formatPercent(teamMetrics.fcr)}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 70%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor Averages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Team vs Floor: CSAT %
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  <TrendingUp className="h-3 w-3 mr-1" /> Live
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Team ({formatPercent(teamMetrics.csatPercent)}) vs Floor Average ({formatPercent(floorAverages.csatAdjusted)})
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Historical trend charting requires more than one imported period. Once a second period is
              imported, this panel will plot Team CSAT % over time against the Floor Average and target.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Floor Averages</CardTitle>
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
                <TableRow className="bg-emerald-50/50">
                  <TableCell className="font-medium">CSAT % (adjusted with calls)</TableCell>
                  <TableCell className="text-right text-emerald-600 font-bold">{formatPercent(floorAverages.csatAdjusted)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Basket Time</TableCell>
                  <TableCell className="text-right">{formatNumber(floorAverages.abt)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Productivity 8-hrs</TableCell>
                  <TableCell className="text-right">{formatNumber(floorAverages.productivity8hrs)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Productivity Online 8-hrs</TableCell>
                  <TableCell className="text-right">{formatNumber(floorAverages.productivityOnline8hrs)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Escalation Rate %</TableCell>
                  <TableCell className="text-right">{formatPercent(floorAverages.escalationRate)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Deescalation Rate %</TableCell>
                  <TableCell className="text-right">{formatPercent(floorAverages.deescalationRate)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Agent Performance Leaderboard Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🏆 Agent Performance Leaderboard
          </CardTitle>
          <p className="text-xs text-muted-foreground">Complete metric breakdown for active agents</p>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[1200px]">
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>KSCAT</TableHead>
                  <TableHead>DSAT</TableHead>
                  <TableHead>Total Count</TableHead>
                  <TableHead>Total w/o Karma</TableHead>
                  <TableHead>KSCAT %</TableHead>
                  <TableHead>CSAT %</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>ABT</TableHead>
                  <TableHead>Productivity 8-hrs</TableHead>
                  <TableHead>Productivity Online 8-hrs</TableHead>
                  <TableHead>Escalation Rate %</TableHead>
                  <TableHead>Deescalation Rate %</TableHead>
                  <TableHead>Adherence %</TableHead>
                  <TableHead>AGBT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {agentMetrics.length > 0 ? (
                  [...agentMetrics]
                    .sort((a: any, b: any) => (b.csat_percent ?? 0) - (a.csat_percent ?? 0))
                    .map((agent: any, idx: number) => (
                      <TableRow key={agent.agent_email ?? idx} className="hover:bg-gray-50">
                        <TableCell className="font-bold">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{agent.agent_name || agent.agent_email}</TableCell>
                        <TableCell>{agent.csat ?? '—'}</TableCell>
                        <TableCell>{agent.kscat ?? '—'}</TableCell>
                        <TableCell className="text-red-500 font-bold">{agent.dsat ?? '—'}</TableCell>
                        <TableCell>{agent.total_count ?? '—'}</TableCell>
                        <TableCell>{agent.total_wo_karma ?? '—'}</TableCell>
                        <TableCell className="text-blue-600 font-semibold">{formatPercent(agent.kscat_percent)}</TableCell>
                        <TableCell className="text-emerald-600 font-bold">{formatPercent(agent.csat_percent)}</TableCell>
                        <TableCell className="text-purple-600">{formatPercent(agent.variance)}</TableCell>
                        <TableCell>{formatNumber(agent.abt)}</TableCell>
                        <TableCell>{formatNumber(agent.productivity_8hrs)}</TableCell>
                        <TableCell>{formatNumber(agent.productivity_online_8hrs)}</TableCell>
                        <TableCell>{formatPercent(agent.escalation_rate)}</TableCell>
                        <TableCell>{formatPercent(agent.deescalation_rate)}</TableCell>
                        <TableCell>{formatPercent(agent.adherence)}</TableCell>
                        <TableCell>{formatNumber(agent.agbt)}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={17} className="text-center py-6 text-muted-foreground">
                      No agent leaderboard records found. Sync your CSV data in the Agent Data tab.
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
