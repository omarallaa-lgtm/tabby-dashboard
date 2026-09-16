'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AgentMetric {
  id: string;
  name: string;
  csat: number;
  dsat: number;
  aht: string;
  ahtSeconds: number;
  adherence: number;
  date?: string;
}

interface MetricsContextType {
  agents: AgentMetric[];
  setAgents: React.Dispatch<React.SetStateAction<AgentMetric[]>>;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<AgentMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgentsFromSupabase = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('agent_metrics').select('*');
      
      if (error) {
        console.error('Error fetching agent metrics from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const mapped: AgentMetric[] = data.map((row: any) => ({
          id: row.id || `agent-${Math.random()}`,
          name: row.name || 'Unknown Agent',
          csat: Number(row.csat) || 0,
          dsat: Number(row.dsat) || 0,
          aht: row.aht || '0:00',
          ahtSeconds: Number(row.aht_seconds) || 0,
          adherence: Number(row.adherence) || 0,
          date: row.date || '',
        }));
        setAgents(mapped);
      }
    } catch (err) {
      console.error('Unexpected error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsFromSupabase();
  }, []);

  return (
    <MetricsContext.Provider
      value={{
        agents,
        setAgents,
        loading,
        refreshData: fetchAgentsFromSupabase,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics() {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
}