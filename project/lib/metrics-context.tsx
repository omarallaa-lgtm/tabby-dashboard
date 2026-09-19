'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'Admin' | 'Team Leader' | 'Agent';

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
    const activeUser = user || currentUser;

    try {
      // 1. Fetch Current Agent Metrics
      let query = supabase
        .from('agent_metrics')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeUser && activeUser.role === 'Agent') {
        query = query.eq('agent_email', activeUser.user_email);
      }

      const { data: agentData } = await query;
      if (agentData) {
        const uniqueMap = new Map();
        agentData.forEach((r) => { if (!uniqueMap.has(r.agent_email)) uniqueMap.set(r.agent_email, r); });
        setAgentMetrics(Array.from(uniqueMap.values()));
      }

      // 2. Fetch Aggregates & Build Daily Progress Timeline for Team vs Floor
      const { data: aggData } = await supabase
        .from('level_aggregates')
        .select('*')
        .order('created_at', { ascending: true });

      if (aggData) {
        const teamMap: Record<string, any> = {};
        const floorMap: Record<string, any> = {};

        // Group by period_id/date for the Progress Graph
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
        loading,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => useContext(MetricsContext);
