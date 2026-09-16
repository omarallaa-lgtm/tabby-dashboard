'use client';

import React, { useState } from 'react';
import { Sidebar, TabId } from '@/components/sidebar';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { MetricsTab } from '@/components/tabs/metrics-tab';
import { TeamTab } from '@/components/tabs/team-tab';
import { RequestsTab } from '@/components/tabs/requests-tab';
import { AnnouncementsTab } from '@/components/tabs/announcements-tab';
import { AgentDataTab } from '@/components/tabs/agent-data-tab';
import { AdminSettingsTab } from '@/components/tabs/admin-settings-tab';
import { useMetrics } from '@/lib/metrics-context';
import { Search, Bell, Mail, Lock, ArrowRight, HomeIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const { currentUser, login } = useMetrics();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = login(loginEmail, loginPassword);
    if (!res.success) {
      if (res.error === 'Unauthorized Email') {
        setErrorMessage('unauthorized');
      } else {
        setErrorMessage('Incorrect password. Please try again.');
      }
    }
  };

  if (!currentUser) {
    if (errorMessage === 'unauthorized') {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-100 p-4">
          <div className="bg-white rounded-2xl shadow-xl border p-8 max-w-md w-full text-center space-y-5">
            <div className="text-6xl animate-bounce">🙈</div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-gray-900">You are not in the right place!</h2>
              <p className="text-xs text-gray-500">
                Your email address ({loginEmail}) is not authorized to access this dashboard.
              </p>
            </div>
            <Button
              onClick={() => {
                setErrorMessage('');
                setLoginEmail('');
                setLoginPassword('');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl w-full flex items-center justify-center gap-2"
            >
              <HomeIcon className="h-4 w-4" />
              Go back home
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl border p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
              T
            </div>
            <h1 className="text-2xl font-black text-gray-900">Welcome to Tabby.ai</h1>
            <p className="text-xs text-gray-500">
              Enter your credentials to access the operational dashboard
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Omar.allaa@tabby.ai"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="pl-10 h-11 text-xs bg-slate-50 border-gray-200"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="pl-10 h-11 text-xs bg-slate-50 border-gray-200"
                  required
                />
              </div>
            </div>

            {errorMessage && errorMessage !== 'unauthorized' && (
              <p className="text-xs font-semibold text-red-600 text-center">{errorMessage}</p>
            )}

            <Button
              type="submit"
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm"
            >
              Sign In to Dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="text-center pt-2 border-t">
            <p className="text-[11px] text-gray-400">
              Admin Login: <span className="font-semibold text-gray-600">Omar.allaa@tabby.ai</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const role = currentUser.role;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 px-6 backdrop-blur-md">
          <div>
            <h1 className="text-lg font-bold text-gray-900 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-xs text-gray-500">
              Real-time contact center performance at a glance
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search agents, teams..."
                className="pl-9 bg-muted/40 border-none h-9 text-xs"
              />
            </div>

            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
            </Button>

            <div className="h-4 w-px bg-border mx-1" />

            <div className="flex items-center gap-2.5">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                  {currentUser.email.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold leading-none">{currentUser.email.split('@')[0]}</p>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                    {role}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'metrics' && <MetricsTab />}
          {activeTab === 'team' && <TeamTab />}
          {activeTab === 'requests' && <RequestsTab />}
          {activeTab === 'announcements' && <AnnouncementsTab />}
          {activeTab === 'agent-data' && <AgentDataTab />}
          {activeTab === 'admin-settings' && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
}