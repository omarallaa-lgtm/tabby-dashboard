'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'Admin' | 'Manager' | 'Agent';

export interface AgentMetric {
  id: string;
  name: string;
  csat: number;
  kscat: number;
  dsat: number;
  total_count: number;
  total_wo_karma: number;
  kscat_percent: number;
  csat_percent: number;
  variance: number;
  abt: number;
  productivity_8hrs: number;
  productivity_online_8hrs: number;
  escalation_rate: number;
  deescalation_rate: number;
  adherence: number;
  agbt: number;
  aht: string;
  closed_after_res_percent: number;
  closed_tickets_percent: number;
  fcr_percent: number;
  tardy_minutes: number;
  idle_time: number;
  date?: string;
  [key: string]: any;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  recordsCount: number;
  name?: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  [key: string]: any;
}

export interface MetricsContextType {
  agents: AgentMetric[];
  agentMetrics: AgentMetric[];
  teamMetrics: any[];
  floorMetrics: any[];
  backups: BackupRecord[];
  loading: boolean;
  currentUser: User | null;
  allowedEmails: string[];
  allowedUsers: User[];
  login: (email?: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  addAllowedEmail: (email: string, role?: UserRole) => void;
  removeAllowedEmail: (email: string) => void;
  setAgents: React.Dispatch<React.SetStateAction<AgentMetric[]>>;
  setAgentMetrics: React.Dispatch<React.SetStateAction<AgentMetric[]>>;
  refreshData: () => Promise<void>;
  [key: string]: any;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<AgentMetric[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [allowedUsers, setAllowedUsers] = useState<User[]>([
    { id: 'u-1', email: 'omar.allaa@tabby.ai', name: 'Omar Alaa', role: 'Admin' },
    { id: 'u-2', email: 'admin@tabby.ai', name: 'Admin', role: 'Manager' },
  ]);

  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'u-1',
    email: 'omar.allaa@tabby.ai',
    name: 'Omar Alaa',
    role: 'Admin',
  });

  const allowedEmails = allowedUsers.map((u) => u.email);

  const login = (email?: string, password?: string) => {
    if (!email) {
      return { success: false, error: 'Email is required' };
    }
    const matchedUser = allowedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!matchedUser) {
      return { success: false, error: 'Unauthorized Email' };
    }
    setCurrentUser(matchedUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addAllowedEmail = (email: string, role: UserRole = 'Admin') => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail && !allowedUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      const newUser: User = {
        id: `u-${Date.now()}`,
        email: cleanEmail,
        name: cleanEmail.split('@')[0],
        role,
      };
      setAllowedUsers((prev) => [...prev, newUser]);
    }
  };

  const removeAllowedEmail = (email: string) => {
    setAllowedUsers((prev) => prev.filter((u) => u.email.toLowerCase() !== email.toLowerCase()));
  };

  const fetchAgentsFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('agent_metrics').select('*');

      if (error) {
        console.error('Error fetching metrics from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const mapped: AgentMetric[] = data.map((row: any) => ({
          id: String(row.id || `agent-${Math.random()}`),
          name: String(row.name || 'Unknown Agent'),
          csat: Number(row.csat) || 0,
          kscat: Number(row.kscat) || 0,
          dsat: Number(row.dsat) || 0,
          total_count: Number(row.total_count) || 0,
          total_wo_karma: Number(row.total_wo_karma) || 0,
          kscat_percent: Number(row.kscat_percent) || 0,
          csat_percent: Number(row.csat_percent) || 0,
          variance: Number(row.variance) || 0,
          abt: Number(row.abt) || 0,
          productivity_8hrs: Number(row.productivity_8hrs) || 0,
          productivity_online_8hrs: Number(row.productivity_online_8hrs) || 0,
          escalation_rate: Number(row.escalation_rate) || 0,
          deescalation_rate: Number(row.deescalation_rate) || 0,
          adherence: Number(row.adherence) || 0,
          agbt: Number(row.agbt) || 0,
          aht: String(row.aht || '0:00'),
          closed_after_res_percent: Number(row.closed_after_res_percent) || 0,
          closed_tickets_percent: Number(row.closed_tickets_percent) || 0,
          fcr_percent: Number(row.fcr_percent) || 0,
          tardy_minutes: Number(row.tardy_minutes) || 0,
          idle_time: Number(row.idle_time) || 0,
          date: String(row.date || ''),
        }));
        setAgents(mapped);
      }
    } catch (err) {
      console.error('Unexpected error loading metrics:', err);
    }
  };

  useEffect(() => {
    fetchAgentsFromSupabase();
  }, []);

  const teamMetrics = [
    { name: 'Support Tier 1', agentsCount: agents.length, avgCsat: 92, avgAht: '4:15' },
    { name: 'Escalations', agentsCount: 5, avgCsat: 88, avgAht: '8:30' },
  ];

  const floorMetrics = [
    { name: 'Floor 1', agentsCount: agents.length, avgCsat: 90 },
  ];

  return (
    <MetricsContext.Provider
      value={{
        agents,
        agentMetrics: agents,
        teamMetrics,
        floorMetrics,
        backups,
        loading: false,
        currentUser,
        allowedEmails,
        allowedUsers,
        login,
        logout,
        addAllowedEmail,
        removeAllowedEmail,
        setAgents,
        setAgentMetrics: setAgents,
        refreshData: fetchAgentsFromSupabase,
      }}
    >
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetrics(): MetricsContextType {
  const context = useContext(MetricsContext);
  if (!context) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  return context;
}