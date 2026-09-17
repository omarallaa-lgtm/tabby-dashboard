'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allowedUsers, setAllowedUsers] = useState<User[]>([
    { email: 'omar.allaa@tabby.ai', role: 'Admin' },
    { email: 'mohamed.gabry@tabby.ai', role: 'Team Leader' },
  ]);

  const [agentMetrics, setAgentMetrics] = useState<any[]>([]);
  const [teamMetrics, setTeamMetrics] = useState<Record<string, any>>({});
  const [floorAverages, setFloorAverages] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMetrics = async (user?: UserProfile) => {
    setLoading(true);
    const activeUser = user || currentUser;

    try {
      let query = supabase.from('agent_metrics').select('*');

      if (activeUser && activeUser.role === 'Agent') {
        query = query.eq('agent_email', activeUser.user_email);
      } else if (activeUser && activeUser.role === 'Team Leader') {
        query = query.eq('team_name', activeUser.team_name);
      }

      const { data: agentData } = await query;
      if (agentData) setAgentMetrics(agentData);

      const { data: aggData } = await supabase.from('level_aggregates').select('*');
      if (aggData) {
        const teamMap: Record<string, any> = {};
        const floorMap: Record<string, any> = {};

        aggData.forEach((item) => {
          if (item.level_type === 'Team Overall') {
            teamMap[item.metric_key] = item.metric_value;
          } else if (item.level_type === 'Floor Average') {
            floorMap[item.metric_key] = item.metric_value;
          }
        });

        setTeamMetrics(teamMap);
        setFloorAverages(floorMap);
      }
    } catch (e) {
      console.error('Error fetching dashboard context:', e);
    } finally {
      setLoading(false);
    }
  };

  const addAllowedEmail = (email: string, role: UserRole = 'Admin') => {
    setAllowedUsers((prev) => [...prev.filter((u) => u.email !== email), { email, role }]);
  };

  const removeAllowedEmail = (email: string) => {
    setAllowedUsers((prev) => prev.filter((u) => u.email !== email));
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
        allowedUsers,
        addAllowedEmail,
        removeAllowedEmail,
        agentMetrics,
        teamMetrics,
        floorAverages,
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
