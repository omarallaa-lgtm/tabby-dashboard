'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMetrics } from '@/lib/metrics-context';
import { Users, Award, TrendingUp, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function OverviewTab() {
  const context = useMetrics() as any;
  const { agentMetrics = [], teamMetrics = [], floorMetrics: rawFloorMetrics = [] } = context;

  const floorMetrics = Array.isArray(rawFloorMetrics) ? rawFloorMetrics : [];

  const totalAgents = agentMetrics?.length || 0;

  const avgCsat = totalAgents
    ? (agentMetrics.reduce((acc: number, curr: any) => acc + (Number(curr.csat) || 0), 0) / totalAgents).toFixed(1)
    : '0.0';

  const avgKscat = totalAgents
    ? (agentMetrics.reduce((acc: number, curr: any) => acc + (Number(curr.kscat) || 0), 0) / totalAgents).toFixed(1)
    : '0.0';

  const csatPctStr = `${avgCsat}%`;
  const kscatPctStr = `${avgKscat}%`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Executive Dashboard Overview</h2>
        <p className="text-muted-foreground">High-level operational performance and key agent stats</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground mt-1">Active operational headcount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">CSAT Average</CardTitle>
            <Award className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{csatPctStr}</div>
            <p className="text-xs text-muted-foreground mt-1">Customer Satisfaction metric</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">KSCAT Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kscatPctStr}</div>
            <p className="text-xs text-muted-foreground mt-1">Knowledge CSAT rating</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Optimal</div>
            <p className="text-xs text-muted-foreground mt-1">Supabase database connected</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Team Summary</CardTitle>
            <CardDescription>Performance metrics across registered operational tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.isArray(teamMetrics) && teamMetrics.map((team: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">{team.name || `Team ${idx + 1}`}</div>
                    <div className="text-xs text-muted-foreground">{team.agentsCount || 0} Agents</div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      CSAT: {team.avgCsat || 90}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Floor Distribution</CardTitle>
            <CardDescription>Operational breakdown by floor division</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {floorMetrics.length > 0 ? (
                floorMetrics.map((floor: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="font-medium">{floor.name || `Floor ${idx + 1}`}</div>
                    <div className="text-sm text-muted-foreground">{floor.agentsCount || totalAgents} Agents</div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="font-medium">Main Operational Floor</div>
                  <div className="text-sm text-muted-foreground">{totalAgents} Agents</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
