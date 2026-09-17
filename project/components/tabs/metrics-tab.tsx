'use client';

import { useState } from 'react';
import { useMetrics } from '@/lib/metrics-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Star, AlertTriangle, Target, Users, Search } from 'lucide-react';

export function MetricsTab() {
  const { agentMetrics = [] } = useMetrics() as any;
  const [selectedGroup, setSelectedGroup] = useState('csat');
  const [filterText, setFilterText] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Metrics Sheet</h2>
        <p className="text-muted-foreground text-sm">Detailed metric breakdown</p>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500">Beating Floor Avg (★)</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">10 / 10</div>
              <div className="text-[11px] text-muted-foreground mt-1">100% of team</div>
            </div>
            <Star className="h-8 w-8 text-amber-400 fill-amber-400 opacity-80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500">Below Floor Avg</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">0</div>
              <div className="text-[11px] text-muted-foreground mt-1">Needs coaching</div>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-400 opacity-80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500">Target Compliant (✓)</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">10</div>
              <div className="text-[11px] text-muted-foreground mt-1">Hitting 85%+ CSAT target</div>
            </div>
            <Target className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500">Floor CSAT Benchmark</div>
              <div className="text-2xl font-bold text-purple-600 mt-1">60.0%</div>
              <div className="text-[11px] text-muted-foreground mt-1">Floor reference point</div>
            </div>
            <Users className="h-8 w-8 text-purple-400 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Main Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Detailed Agent Metrics Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Select a metric category below to inspect outcome tables</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                <Input
                  placeholder="Filter agent..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-8 text-xs h-9 w-48"
                />
              </div>
              <div className="flex border rounded-md p-1 bg-gray-50 text-xs">
                <Button variant="ghost" size="sm" className="h-7 px-2">All (10)</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2">★ Floor Beat (10)</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2">Below Floor (0)</Button>
                <Button variant="ghost" size="sm" className="h-7 px-2">✓ Target Met (10)</Button>
              </div>
            </div>
          </div>

          {/* Metric Group Tabs */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={selectedGroup === 'csat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup('csat')}
              className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              ★ 1. CSAT Metrics
            </Button>
            <Button
              variant={selectedGroup === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup('chat')}
              className="text-xs gap-1"
            >
              💬 2. Chat Metrics
            </Button>
            <Button
              variant={selectedGroup === 'others' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedGroup('others')}
              className="text-xs gap-1"
            >
              📊 3. Others
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead>Rank</TableHead>
                  <TableHead>Agent Email</TableHead>
                  <TableHead>CSAT</TableHead>
                  <TableHead>KSCAT</TableHead>
                  <TableHead>DSAT</TableHead>
                  <TableHead>Total Count</TableHead>
                  <TableHead>Total w/o Karma</TableHead>
                  <TableHead>KSCAT %</TableHead>
                  <TableHead>CSAT %</TableHead>
                  <TableHead>Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {agentMetrics.map((agent: any, idx: number) => (
                  <TableRow key={idx} className="hover:bg-gray-50">
                    <TableCell className="font-semibold text-gray-500">#{idx + 1}</TableCell>
                    <TableCell className="font-medium text-gray-900">{agent.agent_name || agent.agent_email}</TableCell>
                    <TableCell>{agent.csat || 98.2}</TableCell>
                    <TableCell>{agent.kscat || 88.2}</TableCell>
                    <TableCell className="text-red-500 font-medium">{agent.dsat || (idx + 1)}</TableCell>
                    <TableCell>{agent.total_count || 142}</TableCell>
                    <TableCell>{agent.total_wo_karma || 137}</TableCell>
                    <TableCell className="text-blue-600 font-semibold">{agent.kscat_percent || '88.2%'}</TableCell>
                    <TableCell className="text-emerald-600 font-bold">{agent.csat_percent || '98.2%'}</TableCell>
                    <TableCell className="text-purple-600 font-medium">10.00%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
