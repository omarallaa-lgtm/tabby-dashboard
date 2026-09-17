'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMetrics } from '@/lib/metrics-context';
import { Activity, Award, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

type MetricGroup = 'csat' | 'kscat' | 'productivity' | 'adherence';

export function MetricsTab() {
  const context = useMetrics() as any;
  const { agentMetrics = [], teamMetrics = [], floorMetrics: rawFloorMetrics = [] } = context;

  const [selectedGroup, setSelectedGroup] = useState<MetricGroup>('csat');

  const floorMetrics = Array.isArray(rawFloorMetrics) ? rawFloorMetrics : [];

  const getFloorVal = (metricName: string, fallback: number = 60.0): number => {
    const found = floorMetrics.find((f: any) =>
      String(f?.metricName || '').toLowerCase().includes(metricName.toLowerCase())
    );
    return found?.val ? Number(found.val) : fallback;
  };

  const avgCsat = agentMetrics.length
    ? (agentMetrics.reduce((acc: number, curr: any) => acc + (Number(curr.csat) || 0), 0) / agentMetrics.length).toFixed(1)
    : '0.0';

  const avgKscat = agentMetrics.length
    ? (agentMetrics.reduce((acc: number, curr: any) => acc + (Number(curr.kscat) || 0), 0) / agentMetrics.length).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Performance Metrics</h2>
        <p className="text-muted-foreground">Comprehensive overview of floor operations and team level KPIs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Floor Avg CSAT</CardTitle>
            <Award className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCsat}%</div>
            <p className="text-xs text-muted-foreground mt-1">Overall team satisfaction</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Floor Avg KSCAT</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgKscat}%</div>
            <p className="text-xs text-muted-foreground mt-1">Knowledge satisfaction metric</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentMetrics.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Tracked operational profiles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Target Variance</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2.4%</div>
            <p className="text-xs text-muted-foreground mt-1">Exceeding standard SLA</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Performance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamMetrics.map((team: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div>
                  <div className="font-semibold">{team.name || `Team ${idx + 1}`}</div>
                  <div className="text-sm text-muted-foreground">{team.agentsCount || 0} Agents assigned</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">CSAT: {team.avgCsat || 90}%</div>
                  <div className="text-xs text-muted-foreground">AHT: {team.avgAht || '4:00'}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
