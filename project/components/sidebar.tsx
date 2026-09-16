'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useMetrics } from '@/lib/metrics-context';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  GitPullRequest,
  Megaphone,
  Database,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export type TabId =
  | 'overview'
  | 'metrics'
  | 'team'
  | 'requests'
  | 'announcements'
  | 'agent-data'
  | 'admin-settings';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { currentUser, logout } = useMetrics();
  const role = currentUser?.role || 'Agent';

  const navItems: Array<{ id: TabId; label: string; description: string; icon: any }> = [
    { id: 'overview', label: 'Overview', description: 'KPIs & weekly trends', icon: LayoutDashboard },
    { id: 'metrics', label: 'Metrics Sheet', description: 'Detailed metric breakdown', icon: BarChart3 },
    { id: 'team', label: 'Team & Floor', description: 'Agent & floor overview', icon: Users },
    { id: 'requests', label: 'Requests', description: 'Time off & shift swaps', icon: GitPullRequest },
    { id: 'announcements', label: 'Announcements', description: 'Team communications', icon: Megaphone },
    { id: 'agent-data', label: 'Agent Data', description: 'Uploaded raw data table', icon: Database },
  ];

  if (role === 'Admin' || role === 'Manager') {
    navItems.push({
      id: 'admin-settings',
      label: 'Admin Settings',
      description: 'Manage allowed emails & roles',
      icon: ShieldCheck,
    });
  }

  return (
    <aside className="w-64 border-r bg-background flex flex-col justify-between p-4 h-full">
      <div className="space-y-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            T
          </div>
          <div>
            <h2 className="text-sm font-bold leading-none text-gray-900">Tabby.ai</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">Performance Hub</p>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left',
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground')} />
                <div>
                  <p className="leading-none">{item.label}</p>
                  <p className={cn('text-[10px] mt-1', isActive ? 'text-emerald-100' : 'text-muted-foreground')}>
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;