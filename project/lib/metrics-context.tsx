'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

export interface AgentMetricRow {
  agent_name: string;
  agent_email: string;
  team_name?: string;
  csat: number;
  kscat: number;
  dsat: number;
  total_count: number;
  total_wo_karma: number;
  csat_percent: number;
  kscat_percent: number;
  variance: number;
  adherence: number;
  productivity: number;
  productivity_online?: number;
  aht: number;
  abt: number;
  agbt: number;
  closed_rate?: number;
  closed_after_resolution: number;
  deescalation_rate: number;
  escalation_rate: number;
  fcr_percent?: number;
  tardy_minutes?: number;
  idle_time_avg?: number;
}

export interface TargetSettings {
  csatTarget: number;
  kscatTarget: number;
  adherenceTarget: number;
  ahtTarget: number;
  deescalationTarget: number;
}

const defaultTargets: TargetSettings = {
  csatTarget: 85.0,
  kscatTarget: 80.0,
  adherenceTarget: 90.0,
  ahtTarget: 5.0,
  deescalationTarget: 70.0,
};

const MetricsContext = createContext<any>(null);

export const MetricsProvider = ({ children }: { children: React.ReactNode }) => {
  const [agentMetrics, setAgentMetrics] = useState<AgentMetricRow[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<Record<string, any>>({
    csatPercent: '60.53%',
    kscatPercent: '40.35%',
    csatCount: 138,
    kscatCount: 138,
    dsatCount: 90,
    totalTickets: 342,
    totalWoKarma: 228,
    adherencePercent: '77.50%',
    aht: '6.1',
    abt: '14.5',
    productivity8hrs: '27.3',
    productivityOnline8hrs: '41.8',
    escalationRate: '4.10%',
    deescalationRate: '3.10%',
    agbt: '24.4',
    closedAfterRes: '59.20%',
    closedTickets: '51.30%',
    fcrPercent: '56.00%',
  });

  const [floorAverages, setFloorAverages] = useState<Record<string, any>>({
    csat: '60.00%',
    kscat: '40.00%',
    adherence: '81.70%',
    aht: '5.5',
    abt: '14.6',
    agbt: '24.4',
    productivity8hrs: '30.0',
    productivityOnline8hrs: '44.9',
    escalationRate: '4.70%',
    deescalationRate: '4.00%',
    closedAfterRes: '61.50%',
    closedTickets: '50.30%',
    fcrPercent: '53.50%',
  });

  const [targets, setTargets] = useState<TargetSettings>(defaultTargets);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('agent_metrics').select('*');
      if (!error && data && data.length > 0) {
        setAgentMetrics(data as AgentMetricRow[]);
      }
    } catch (e) {
      console.error('Error fetching Supabase metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <MetricsContext.Provider
      value={{
        agentMetrics,
        setAgentMetrics,
        teamMetrics,
        setTeamMetrics,
        floorAverages,
        setFloorAverages,
        targets,
        setTargets,
        refreshMetrics: fetchMetrics,
        totalAgents: agentMetrics.length,
        loading,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
};

export const useMetrics = () => useContext(MetricsContext);
