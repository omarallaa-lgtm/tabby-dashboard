'use client';

import React, { createContext, useContext, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'Admin' | 'Team Leader' | 'Agent';

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
  const [dailyProgressData, setDailyProgressData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async (user?: any) => {
    setLoading(true);

    try {
      // 1. Always fetch all agent metrics across team so totals match for all roles
      const { data: agentData } = await supabase
        .from('agent_metrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (agentData) {
        const uniqueMap = new Map();
        agentData.forEach((row) => {
          if (!uniqueMap.has(row.agent_email)) {
            uniqueMap.set(row.agent_email, row);
          }
        });
        setAgentMetrics(Array.from(uniqueMap.values()));
      }

      // 2. Fetch Level Aggregates (Team & Floor)
      const { data: aggData } = await supabase
        .from('level_aggregates')
        .select('*')
        .order('created_at', { ascending: true });

      if (aggData) {
        const teamMap: Record<string, any> = {};
        const floorMap: Record<string, any> = {};
        const periodGrouped: Record<string, { period: string; teamMetrics: Record<string, number>; floorMetrics: Record<string, number> }> = {};

        aggData.forEach((item) => {
          const p = item.period_id;
          if (!periodGrouped[p]) {
            periodGrouped[p] = { period: p, teamMetrics: {}, floorMetrics: {} };
          }

          if (item.level_type === 'Team Overall') {
            teamMap[item.metric_key] = item.metric_value;
            periodGrouped[p].teamMetrics[item.metric_key] = Number(item.metric_value);
          } else if (item.level_type === 'Floor Average') {
            floorMap[item.metric_key] = item.metric_value;
            periodGrouped[p].floorMetrics[item.metric_key] = Number(item.metric_value);
          }
        });

        setTeamMetrics(teamMap);
        setFloorAverages(floorMap);
        setDailyProgressData(Object.values(periodGrouped));
      }

      // 3. Fetch KPI Targets
      const { data: targetData } = await supabase.from('kpi_targets').select('*');
      if (targetData && targetData.length > 0) {
        const tMap: Record<string, number> = {};
        targetData.forEach((t) => { tMap[t.metric_key] = Number(t.target_value); });
        setKpiTargets((prev) => ({ ...prev, ...tMap }));
      }
    } catch (e) {
      console.error('Error fetching metrics context:', e);
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
        dailyProgressData,
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
