'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export type UserRole = 'Admin' | 'Manager' | 'Agent' | string;

export interface AgentMetric {
  id: string;
  name?: string;
  agentEmail?: string;
  csat: number;
  dsat: number;
  aht: string;
  ahtSeconds?: number;
  adherence: number;
  date?: string;
  team?: string;
  qaScore?: number;
  resolvedTickets?: number;
  csatPercent?: string;
  kscatPercent?: string;
  adherencePercent?: string;
  csatCount?: number;
  kscatCount?: number;
  totalTickets?: number;
  totalWOKarma?: number;
  abt?: string;
  productivity8h?: string;
  productivityOnline8h?: string;
  escalationRate?: string;
  deescalationRate?: string;
  agbt?: string;
  closedAfterResolution?: string;
  closedTicketsPercent?: string;
  fcrPercent?: string;
  tardyMinutes?: string;
  idleTime?: string;
  [key: string]: any;
}

export interface FloorMetricRow {
  metricName: string;
  value: string;
}

export interface TeamMetrics {
  floorMetrics: FloorMetricRow[];
  csatPercent: string;
  kscatPercent: string;
  dsatCount: number;
  adherencePercent: string;
  aht: string;
  csatCount: number;
  kscatCount: number;
  totalTickets: number;
  totalWOKarma: number;
  [key: string]: any;
}

export interface BackupRecord {
  id: string;
  timestamp: string;
  recordsCount: number;
  name?: string;
  metricsMap?: Record<string, { teamVal: number; floorVal: number }>;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  [key: string]: any;
}

export interface UserAccount {
  email: string;
  role: UserRole;
  password?: string;
}

export interface MetricsContextType {
  agents: AgentMetric[];
  agentMetrics: AgentMetric[];
  teamMetrics: TeamMetrics | null;
  userAccounts: Record<string, UserAccount>;
  backups: BackupRecord[];
  loading: boolean;
  currentUser: User | null;
  login: (email?: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  addUserAccount: (email: string, role: UserRole, password?: string) => void;
  removeUserAccount: (email: string) => void;
  setAgents: React.Dispatch<React.SetStateAction<AgentMetric[]>>;
  setAgentMetrics: React.Dispatch<React.SetStateAction<AgentMetric[]>>;
  refreshData: () => Promise<void>;
  [key: string]: any;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

const initialUserAccounts: Record<string, UserAccount> = {
  'omar.allaa@tabby.ai': { email: 'omar.allaa@tabby.ai', role: 'Admin', password: 'Boyka@1322' },
  'admin@tabby.ai': { email: 'admin@tabby.ai', role: 'Admin', password: 'admin' },
  'manager@tabby.ai': { email: 'manager@tabby.ai', role: 'Manager', password: 'manager' },
  'agent@tabby.ai': { email: 'agent@tabby.ai', role: 'Agent', password: 'agent' },
};

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<AgentMetric[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [userAccounts, setUserAccounts] = useState<Record<string, UserAccount>>(initialUserAccounts);
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'admin-1',
    email: 'omar.allaa@tabby.ai',
    name: 'Omar Alaa',
    role: 'Admin',
  });

  const buildTeamMetrics = (rows: AgentMetric[]): TeamMetrics => {
    const totalTickets = rows.reduce((sum, row) => sum + (row.totalTickets ?? 0), 0);
    const avgCsat = rows.length > 0 ? rows.reduce((sum, row) => sum + (Number(row.csatPercent?.replace('%', '') ?? row.csat ?? 0)), 0) / rows.length : 0;
    const avgKscat = rows.length > 0 ? rows.reduce((sum, row) => sum + (Number(row.kscatPercent?.replace('%', '') ?? 0)), 0) / rows.length : 0;
    const avgAdherence = rows.length > 0 ? rows.reduce((sum, row) => sum + (Number(row.adherencePercent?.replace('%', '') ?? row.adherence ?? 0)), 0) / rows.length : 0;

    return {
      floorMetrics: [
        { metricName: 'CSAT %', value: '60.00%' },
        { metricName: 'KSCAT %', value: '40.00%' },
        { metricName: 'Adherence %', value: '81.70%' },
        { metricName: 'Average Handling Time', value: '5.5' },
      ],
      csatPercent: `${avgCsat.toFixed(2)}%`,
      kscatPercent: `${avgKscat.toFixed(2)}%`,
      dsatCount: rows.reduce((sum, row) => sum + (row.dsat ?? 0), 0),
      adherencePercent: `${avgAdherence.toFixed(2)}%`,
      aht: rows.length > 0 ? `${(rows.reduce((sum, row) => sum + Number.parseFloat((row.aht || '0').split(':')[0] || '0'), 0) / rows.length).toFixed(1)} min` : '0.0 min',
      csatCount: rows.length,
      kscatCount: rows.length,
      totalTickets,
      totalWOKarma: rows.reduce((sum, row) => sum + (row.totalWOKarma ?? 0), 0),
    };
  };

  const login = (email?: string, password?: string) => {
    if (!email) {
      return { success: false, error: 'Email is required' };
    }
    const user = {
      id: `user-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: 'Admin',
    };
    setCurrentUser(user);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const addUserAccount = (email: string, role: UserRole, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const updated = {
      ...userAccounts,
      [cleanEmail]: { email: cleanEmail, role, password: password || '123456' },
    };
    setUserAccounts(updated);
  };

  const removeUserAccount = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const updated = { ...userAccounts };
    delete updated[cleanEmail];
    setUserAccounts(updated);
  };

  const setAgentsWithMetrics: React.Dispatch<React.SetStateAction<AgentMetric[]>> = (value) => {
    setAgents((current) => {
      const next = typeof value === 'function' ? value(current) : value;
      setTeamMetrics(buildTeamMetrics(next));
      return next;
    });
  };

  const fetchAgentsFromSupabase = async () => {
    if (!supabase) {
      console.warn('Supabase is not configured. Skipping remote metrics fetch.');
      return;
    }

    try {
      const { data, error } = await supabase.from('agent_metrics').select('*');

      if (error) {
        console.error('Error fetching metrics from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const mapped: AgentMetric[] = data.map((row: any) => {
          const csatValue = Number(row.csat ?? 0);
          const kscatValue = Number(row.kscat ?? row.csat ?? 0);
          const adherenceValue = Number(row.adherence ?? 0);
          const ahtValue = String(row.aht || '0:00');

          return {
            id: String(row.id || `agent-${Math.random()}`),
            name: String(row.name || 'Unknown Agent'),
            agentEmail: String(row.agent_email || row.name || 'unknown@agent.com'),
            csat: csatValue,
            dsat: Number(row.dsat) || 0,
            aht: ahtValue,
            ahtSeconds: Number(row.aht_seconds) || 0,
            adherence: adherenceValue,
            date: String(row.date || ''),
            team: String(row.team || 'General'),
            qaScore: Number(row.qa_score) || 95,
            resolvedTickets: Number(row.resolved_tickets) || 120,
            csatPercent: `${csatValue}%`,
            kscatPercent: `${kscatValue}%`,
            adherencePercent: `${adherenceValue}%`,
            csatCount: csatValue,
            kscatCount: kscatValue,
            totalTickets: Number(row.total_tickets ?? row.dsat ?? 0),
            totalWOKarma: Number(row.total_w_o_karma ?? 0),
          };
        });
        setAgents(mapped);
        setTeamMetrics(buildTeamMetrics(mapped));
      }
    } catch (err) {
      console.error('Unexpected error loading metrics:', err);
    }
  };

  useEffect(() => {
    fetchAgentsFromSupabase();
  }, []);

  return (
    <MetricsContext.Provider
      value={{
        agents,
        agentMetrics: agents,
        teamMetrics,
        userAccounts,
        backups,
        loading: false,
        currentUser,
        login,
        logout,
        addUserAccount,
        removeUserAccount,
        setAgents: setAgentsWithMetrics,
        setAgentMetrics: setAgentsWithMetrics,
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