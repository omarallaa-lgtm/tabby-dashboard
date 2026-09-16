'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export type UserRole = 'Admin' | 'Manager' | 'Agent' | string;

export interface AgentMetric {
  id: string;
  name: string;
  csat: number;
  dsat: number;
  aht: string;
  ahtSeconds?: number;
  adherence: number;
  date?: string;
  team?: string;
  qaScore?: number;
  resolvedTickets?: number;
  csatPercent?: number;
  kscatPercent?: number;
  adherencePercent?: number;
  csatCount?: number;
  kscatCount?: number;
  totalTickets?: number;
  totalWOKarma?: number;
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
  role?: UserRole;
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
  addAllowedEmail?: (email: string, role?: string) => void;
  removeAllowedEmail?: (email: string) => void;
  setAgents: React.Dispatch<React.SetStateAction<AgentMetric[]>>;
  setAgentMetrics: React.Dispatch<React.SetStateAction<AgentMetric[]>>;
  refreshData: () => Promise<void>;
  [key: string]: any;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [agents, setAgents] = useState<AgentMetric[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([
    'omar.allaa@tabby.ai',
    'admin@tabby.ai',
  ]);
  const [currentUser, setCurrentUser] = useState<User | null>({
    id: 'admin-1',
    email: 'omar.allaa@tabby.ai',
    name: 'Omar Alaa',
    role: 'Admin',
  });

  const allowedUsers: User[] = allowedEmails.map((email, idx) => ({
    id: `user-${idx}`,
    email,
    name: email.split('@')[0],
    role: 'Admin',
  }));

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

  const addAllowedEmail = (email: string) => {
    if (email && !allowedEmails.includes(email)) {
      setAllowedEmails((prev) => [...prev, email]);
    }
  };

  const removeAllowedEmail = (email: string) => {
    setAllowedEmails((prev) => prev.filter((e) => e !== email));
  };

  const fetchAgentsFromSupabase = async () => {
    try {
      const { data, error } = await supabase.from('agent_metrics').select('*');

      if (error) {
        console.error('Error fetching metrics from Supabase:', error);
        return;
      }

      if (data && data.length > 0) {
        const mapped: AgentMetric[] = data.map((row: any) => {
          const csat = Number(row.csat) || 0;
          const dsat = Number(row.dsat) || 0;
          const adherence = Number(row.adherence) || 0;
          const totalTickets = csat + dsat;

          // Compute percentage safely
          const csatPercent = totalTickets > 0 ? (csat / totalTickets) * 100 : csat > 1 ? csat : csat * 100;
          const adherencePercent = adherence <= 1 && adherence > 0 ? adherence * 100 : adherence;

          return {
            id: String(row.id || `agent-${Math.random()}`),
            name: String(row.name || 'Unknown Agent'),
            csat,
            dsat,
            aht: String(row.aht || '0:00'),
            ahtSeconds: Number(row.aht_seconds) || 0,
            adherence: adherencePercent,
            date: String(row.date || ''),
            team: String(row.team || 'General'),
            qaScore: Number(row.qa_score) || 95,
            resolvedTickets: totalTickets || Number(row.resolved_tickets) || 120,
            csatPercent: Math.round(csatPercent * 100) / 100,
            kscatPercent: Math.round(csatPercent * 100) / 100,
            adherencePercent: Math.round(adherencePercent * 100) / 100,
            csatCount: csat,
            kscatCount: csat,
            totalTickets: totalTickets,
            totalWOKarma: 0,
          };
        });
        setAgents(mapped);
      }
    } catch (err) {
      console.error('Unexpected error loading metrics:', err);
    }
  };

  useEffect(() => {
    fetchAgentsFromSupabase();
  }, []);

  const totalCsatCount = agents.reduce((acc, curr) => acc + (curr.csatCount || curr.csat || 0), 0);
  const totalDsatCount = agents.reduce((acc, curr) => acc + (curr.dsat || 0), 0);
  const totalTicketsOverall = totalCsatCount + totalDsatCount;
  const overallCsatPercent = totalTicketsOverall > 0 ? (totalCsatCount / totalTicketsOverall) * 100 : 0;
  const overallAdherencePercent = agents.length > 0 ? agents.reduce((acc, curr) => acc + (curr.adherence || 0), 0) / agents.length : 0;

  const teamMetrics = [
    {
      name: 'Support Tier 1',
      agentsCount: agents.length,
      avgCsat: Math.round(overallCsatPercent * 10) / 10,
      avgAht: '4:15',
      csatPercent: Math.round(overallCsatPercent * 10) / 10,
      kscatPercent: Math.round(overallCsatPercent * 10) / 10,
      adherencePercent: Math.round(overallAdherencePercent * 10) / 10,
      csatCount: totalCsatCount,
      kscatCount: totalCsatCount,
      dsatCount: totalDsatCount,
      totalTickets: totalTicketsOverall,
    },
  ];

  const floorMetrics = [
    {
      name: 'Floor 1',
      agentsCount: agents.length,
      avgCsat: Math.round(overallCsatPercent * 10) / 10,
      csatPercent: Math.round(overallCsatPercent * 10) / 10,
    },
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