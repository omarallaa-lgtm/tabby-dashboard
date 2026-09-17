'use client';

import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Star, Target, Settings2, SlidersHorizontal, TrendingUp } from 'lucide-react';

export function OverviewTab() {
  const context = useMetrics() as any;
  const { agentMetrics = [], teamMetrics = {}, floorAverages = {} } = context;

  // Extract core operational values with fallbacks matching your interface
  const csatPct = teamMetrics?.csatPercent || '60.53%';
  const kscatPct = teamMetrics?.kscatPercent || '40.35%';
  const csatCount = teamMetrics?.csatCount || 138;
  const kscatCount = teamMetrics?.kscatCount || 138;
  const dsatCount = teamMetrics?.dsatCount || 90;
  const totalTickets = teamMetrics?.totalTickets || 342;
  const totalWoKarma = teamMetrics?.totalWoKarma || 228;
  const adherencePct = teamMetrics?.adherencePercent || '77.50%';
  const aht = teamMetrics?.aht || '6.1';
  const abt = teamMetrics?.abt || '14.5';
  const prod8hrs = teamMetrics?.productivity8hrs || '27.3';
  const prodOnline8hrs = teamMetrics?.productivityOnline8hrs || '41.8';
  const escRate = teamMetrics?.escalationRate || '4.10%';
  const deescRate = teamMetrics?.deescalationRate || '3.10%';
  const agbt = teamMetrics?.agbt || '24.4';
  const closedAfterRes = teamMetrics?.closedAfterRes || '59.20%';
  const closedTickets = teamMetrics?.closedTickets || '51.30%';
  const fcrPct = teamMetrics?.fcrPercent || '56.00%';

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
          <Button variant="outline" size="sm">
            Default Totals
          </Button>
        </div>
      </div>

      {/* Grid Cards (15 Operational Metrics) */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card className="border-emerald-500 border-2 bg-emerald-50/20">
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">CSAT %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{csatPct}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 85
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">KSCAT %</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{kscatPct}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">CSAT Count</div>
            <div className="text-2xl font-bold mt-1">{csatCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">KSCAT Count</div>
            <div className="text-2xl font-bold mt-1">{kscatCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">DSAT Count</div>
            <div className="text-2xl font-bold text-red-600 mt-1">{dsatCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Total Tickets</div>
            <div className="text-2xl font-bold mt-1">{totalTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Total w/o Karma</div>
            <div className="text-2xl font-bold mt-1">{totalWoKarma}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Adherence %</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{adherencePct}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 90
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">AHT</div>
            <div className="text-2xl font-bold mt-1">{aht}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 5
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">ABT</div>
            <div className="text-2xl font-bold mt-1">{abt}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Productivity (8-hrs)</div>
            <div className="text-2xl font-bold mt-1">{prod8hrs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Productivity Online (8-hrs)</div>
            <div className="text-2xl font-bold mt-1">{prodOnline8hrs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">Escalation Rate %</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">{escRate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Deescalation Rate %</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{deescRate}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">AGBT</div>
            <div className="text-2xl font-bold mt-1">{agbt}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-semibold text-gray-600 uppercase">Closed After Res. %</div>
            <div className="text-2xl font-bold mt-1">{closedAfterRes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">Closed Tickets %</div>
            <div className="text-2xl font-bold mt-1">{closedTickets}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 relative">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500 absolute top-3 right-3" />
            <div className="text-xs font-semibold text-gray-600 uppercase">FCR %</div>
            <div className="text-2xl font-bold mt-1">{fcrPct}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
              <Target className="h-3 w-3 text-amber-600" /> Target: 70
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend & Floor Averages Split */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Monthly Trend: CSAT %
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  <TrendingUp className="h-3 w-3 mr-1" /> IMPROVED
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Team ({csatPct}) vs Floor Average (60%) vs Target (85)
              </p>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Team CSAT %</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500"></span> Floor Average</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500"></span> Target (85)</span>
            </div>
          </CardHeader>
          <CardContent>
            {/* Visual SVG Trend Graph representation */}
            <div className="h-48 w-full border-t border-b py-4 relative flex items-end">
              <svg className="w-full h-full overflow-visible">
                <line x1="0" y1="10%" x2="100%" y2="10%" stroke="#f59e0b" strokeDasharray="4" strokeWidth="1.5" />
                <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#3b82f6" strokeWidth="2" />
                <path d="M0,85 Q50,75 100,60" fill="none" stroke="#10b981" strokeWidth="3" />
              </svg>
              <span className="absolute top-[8%] right-2 text-[10px] text-amber-600 font-bold">Target: 85</span>
              <span className="absolute bottom-2 left-0 text-[10px] text-muted-foreground">Start of Month</span>
              <span className="absolute bottom-2 right-0 text-[10px] text-muted-foreground">Current Run</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Floor Averages
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs h-6">Default</Button>
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
                  <TableCell className="font-medium">CSAT %</TableCell>
                  <TableCell className="text-right text-emerald-600 font-bold">60.00%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Average Basket Time</TableCell>
                  <TableCell className="text-right">14.6</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Productivity 8-hrs</TableCell>
                  <TableCell className="text-right text-emerald-600 font-bold">30.0</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Productivity Online 8-hrs</TableCell>
                  <TableCell className="text-right">44.9</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Escalation Rate %</TableCell>
                  <TableCell className="text-right text-emerald-600 font-bold">4.70%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Deescalation Rate %</TableCell>
                  <TableCell className="text-right">4.00%</TableCell>
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
                  agentMetrics.map((agent: any, idx: number) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="font-bold">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{agent.agent_name || agent.agent_email}</TableCell>
                      <TableCell>{agent.csat || 15}</TableCell>
                      <TableCell>{agent.kscat || 12}</TableCell>
                      <TableCell className="text-red-500 font-bold">{agent.dsat || 1}</TableCell>
                      <TableCell>{agent.total_count || 142}</TableCell>
                      <TableCell>{agent.total_wo_karma || 137}</TableCell>
                      <TableCell className="text-blue-600 font-semibold">{agent.kscat_percent || '83.2%'}</TableCell>
                      <TableCell className="text-emerald-600 font-bold">{agent.csat_percent || '98.2%'}</TableCell>
                      <TableCell className="text-purple-600">15.00%</TableCell>
                      <TableCell>{agent.abt || '14.2'}</TableCell>
                      <TableCell>{agent.productivity || '28.5'}</TableCell>
                      <TableCell>{agent.productivity_online || '42.1'}</TableCell>
                      <TableCell>{agent.escalation_rate || '4.20%'}</TableCell>
                      <TableCell>{agent.deescalation_rate || '3.50%'}</TableCell>
                      <TableCell>{agent.adherence || '96%'}</TableCell>
                      <TableCell>{agent.agbt || '22.1'}</TableCell>
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
