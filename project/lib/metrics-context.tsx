'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Admin' | 'Manager' | 'Agent';

export interface UserAccount {
  email: string;
  role: UserRole;
  password?: string;
}

export interface User {
  email: string;
  role: UserRole;
}

export interface AgentMetric {
  agentEmail: string;
  totalTickets: number;
  totalWOKarma: number;
  csatCount: number;
  kscatCount: number;
  dsat: number;
  csatPercent: string;
  kscatPercent: string;
  adherencePercent: string;
  abt: string;
  productivity8h: string;
  productivityOnline8h: string;
  escalationRate: string;
  deescalationRate: string;
  agbt: string;
  aht: string;
  closedAfterResolution: string;
  closedTicketsPercent: string;
  fcrPercent: string;
  tardyMinutes: string;
  idleTime: string;
}

export interface FloorMetricRow {
  metricName: string;
  value: string;
}

export interface TeamTotalMetrics {
  csatCount: number;
  kscatCount: number;
  dsatCount: number;
  totalTickets: number;
  totalWOKarma: number;
  csatPercent: string;
  kscatPercent: string;
  adherencePercent: string;
  aht: string;
  floorMetrics: FloorMetricRow[];
}

export interface MonthlyBackup {
  id: string;
  name: string;
  timestamp: string;
  agentMetrics: AgentMetric[];
  teamMetrics: TeamTotalMetrics;
  metricsMap: Record<string, { teamVal: number; floorVal: number }>;
}

interface MetricsContextType {
  currentUser: User | null;
  userAccounts: Record<string, UserAccount>;
  login: (email: string, pass: string) => { success: boolean; error?: string };
  logout: () => void;
  addUserAccount: (email: string, role: UserRole, password?: string) => void;
  removeUserAccount: (email: string) => void;
  agentMetrics: AgentMetric[];
  teamMetrics: TeamTotalMetrics | null;
  backups: MonthlyBackup[];
  saveUnifiedBackup: (agents: AgentMetric[], team: TeamTotalMetrics) => void;
  deleteBackup: (id: string) => void;
  resetMonthlyBackups: () => void;
}

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

const initialUserAccounts: Record<string, UserAccount> = {
  'omar.allaa@tabby.ai': { email: 'omar.allaa@tabby.ai', role: 'Admin', password: 'Boyka@1322' },
  'admin@tabby.ai': { email: 'admin@tabby.ai', role: 'Admin', password: 'admin' },
  'manager@tabby.ai': { email: 'manager@tabby.ai', role: 'Manager', password: 'manager' },
  'agent@tabby.ai': { email: 'agent@tabby.ai', role: 'Agent', password: 'agent' },
};

export function MetricsProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userAccounts, setUserAccounts] = useState<Record<string, UserAccount>>(initialUserAccounts);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetric[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<TeamTotalMetrics | null>(null);
  const [backups, setBackups] = useState<MonthlyBackup[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('tabby_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('tabby_current_user');
      }
    }

    const savedAccounts = localStorage.getItem('tabby_user_accounts');
    if (savedAccounts) {
      try {
        setUserAccounts(JSON.parse(savedAccounts));
      } catch (e) {
        localStorage.removeItem('tabby_user_accounts');
      }
    }
  }, []);

  const login = (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const account = userAccounts[cleanEmail];

    if (!account) {
      return { success: false, error: 'Unauthorized Email' };
    }

    if (account.password && account.password !== pass) {
      return { success: false, error: 'Incorrect Password' };
    }

    const user: User = { email: cleanEmail, role: account.role };
    setCurrentUser(user);
    localStorage.setItem('tabby_current_user', JSON.stringify(user));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tabby_current_user');
  };

  const addUserAccount = (email: string, role: UserRole, password?: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const updated = {
      ...userAccounts,
      [cleanEmail]: { email: cleanEmail, role, password: password || '123456' },
    };
    setUserAccounts(updated);
    localStorage.setItem('tabby_user_accounts', JSON.stringify(updated));
  };

  const removeUserAccount = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const updated = { ...userAccounts };
    delete updated[cleanEmail];
    setUserAccounts(updated);
    localStorage.setItem('tabby_user_accounts', JSON.stringify(updated));
  };

  const saveUnifiedBackup = (agents: AgentMetric[], team: TeamTotalMetrics) => {
    const newBackup: MonthlyBackup = {
      id: Date.now().toString(),
      name: `Run ${backups.length + 1} - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: new Date().toLocaleDateString(),
      agentMetrics: agents,
      teamMetrics: team,
      metricsMap: {},
    };

    setAgentMetrics(agents);
    setTeamMetrics(team);
    setBackups((prev) => [...prev, newBackup]);
  };

  const deleteBackup = (id: string) => {
    setBackups((prev) => prev.filter((b) => b.id !== id));
  };

  const resetMonthlyBackups = () => {
    setBackups([]);
    setAgentMetrics([]);
    setTeamMetrics(null);
  };

  return (
    <MetricsContext.Provider
      value={{
        currentUser,
        userAccounts,
        login,
        logout,
        addUserAccount,
        removeUserAccount,
        agentMetrics,
        teamMetrics,
        backups,
        saveUnifiedBackup,
        deleteBackup,
        resetMonthlyBackups,
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