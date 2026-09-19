'use client';

import React, { createContext, useContext, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'Admin' | 'Team Leader' | 'Agent';

export interface User {
  email: string;
  role: UserRole;
  addedAt?: string;
}

export interface UserProfile {
  id?: string;
  user_email: string;
  username: string;
  role: UserRole;
  team_name: string;
  floor_name: string;
  account_status: 'Active' | 'Disabled';
  allowed_tabs: string[];
}

const MetricsContext = createContext<any>(null);

export const MetricsProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [agentMetrics, setAgentMetrics] = useState<any[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<Record<string, any>>({});
  const [floorAverages, setFloorAverages] = useState<Record<string, any>>({});
  const [kpiTargets, setKpiTargets] = useState<Record<string, number>>({
    csatPercent: 85,
    kscatPercent: 35,
    adherencePercent: 90,
    aht: 5,
    abt: 14,
    fcrPercent: 70,
  });
  const [historicalTrends, setHistoricalTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async (user?: any) => {
    setLoading(true);
    const activeUser = user || currentUser;

    try {
      // 1. Order by created_at descending so the newest upload comes first
      let query = supabase
        .from('agent_metrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeUser && activeUser.role === 'Agent') {
        query = query.eq('agent_email', activeUser.user_email);
      } else if (activeUser && activeUser.role === 'Team Leader') {
        query = query.eq('team_name', activeUser.team_name);
      }

      const { data: agentData } = await query;

      if (agentData) {
        // Filter out duplicate agent rows across multiple backup uploads (keep newest record)
        const uniqueAgentsMap = new Map();
        agentData.forEach((row) => {
          if (!uniqueAgentsMap.has(row.agent_email)) {
            uniqueAgentsMap.set(row.agent_email, row);
          }
        });

        const deduplicatedAgentMetrics = Array.from(uniqueAgentsMap.values());
        setAgentMetrics(deduplicatedAgentMetrics);
      }

      // 2. Fetch Level Aggregates (Team & Floor)
      const { data: aggData } = await supabase
        .from('level_aggregates')
        .select('*')
        .order('created_at', { ascending: false });

      if (aggData) {
        const teamMap: Record<string, any> = {};
        const floorMap: Record<string, any> = {};

        aggData.forEach((item) => {
          if (item.level_type === 'Team Overall' && !teamMap[item.metric_key]) {
            teamMap[item.metric_key] = item.metric_value;
          } else if (item.level_type === 'Floor Average' && !floorMap[item.metric_key]) {
            floorMap[item.metric_key] = item.metric_value;
          }
        });

        setTeamMetrics(teamMap);
        setFloorAverages(floorMap);
      }

      // 3. Fetch KPI Targets
      const { data: targetData } = await supabase.from('kpi_targets').select('*');
      if (targetData && targetData.length > 0) {
        const tMap: Record<string, number> = {};
        targetData.forEach((t) => { tMap[t.metric_key] = Number(t.target_value); });
        setKpiTargets((prev) => ({ ...prev, ...tMap }));
      }

      // 4. Fetch Multi-Period Historical Backups for Progress Graphs
      const { data: historyData } = await supabase
        .from('agent_metrics')
        .select('period_id, csat_percent, kscat_percent, total_count')
        .order('created_at', { ascending: true });

      if (historyData) {
        const grouped: Record<string, { period_id: string; csatSum: number; count: number; tickets: number }> = {};
        historyData.forEach((row) => {
          if (!grouped[row.period_id]) {
            grouped[row.period_id] = { period_id: row.period_id, csatSum: 0, count: 0, tickets: 0 };
          }
          grouped[row.period_id].csatSum += Number(row.csat_percent || 0);
          grouped[row.period_id].tickets += Number(row.total_count || 0);
          grouped[row.period_id].count += 1;
        });

        const trendArray = Object.values(grouped).map((g) => ({
          period: g.period_id,
          csat: g.count > 0 ? Number((g.csatSum / g.count).toFixed(2)) : 0,
          tickets: g.tickets,
        }));
        setHistoricalTrends(trendArray);
      }
    } catch (e) {
      console.error('Error fetching dashboard context:', e);
    } finally {
      setLoading(false);
    }
  };

  const updateTarget = async (key: string, value: number) => {
    setKpiTargets((prev) => ({ ...prev, [key]: value }));
    await supabase.from('kpi_targets').upsert([
      { metric_key: key, target_value: value, updated_by: currentUser?.user_email || 'admin' }
    ]);
  };

  const logAuditAction = async (action: string, target: string, prevVal?: any, newVal?: any) => {
    if (!currentUser) return;
    await supabase.from('audit_logs').insert([
      {
        actor_email: currentUser.user_email,
        action,
        target_entity: target,
        previous_value: prevVal || null,
        new_value: newVal || null,
      },
    ]);
  };

  return (
    <MetricsContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        agentMetrics,
        teamMetrics,
        floorAverages,
        kpiTargets,
        updateTarget,
        historicalTrends,
        refreshMetrics: fetchMetrics,
        logAuditAction,
        loading,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => useContext(MetricsContext);
