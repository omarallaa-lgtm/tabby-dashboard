'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, MessageSquarePlus, Megaphone, LogOut, User } from 'lucide-react';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { MetricsTab } from '@/components/tabs/metrics-tab';
import { TeamTab } from '@/components/tabs/team-tab';
import { AdminSettingsTab } from '@/components/tabs/admin-settings-tab';
import { AgentDataTab } from '@/components/tabs/agent-data-tab';
import { RequestsTab } from '@/components/tabs/requests-tab';
import { AnnouncementsTab } from '@/components/tabs/announcements-tab';
import { useMetrics } from '@/lib/metrics-context';

export default function Home() {
  const { currentUser, setCurrentUser, refreshMetrics, logAuditAction } = useMetrics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    // Verification against password specification
    if (password !== 'Boyka@1322') {
      setErrorMessage("😼 Not so fast, human! That login didn't quite match. Check your credentials and try again.");
      return;
    }

    // Derive Role & Access
    let role = 'Agent';
    let allowedTabs = ['overview', 'my_performance', 'requests', 'announcements'];

    if (cleanEmail === 'omar.allaa@tabby.ai' || cleanEmail === 'admin@tabby.ai') {
      role = 'Admin';
      allowedTabs = ['overview', 'metrics', 'team', 'requests', 'announcements', 'agent-data', 'admin'];
    } else if (cleanEmail.includes('lead') || cleanEmail === 'mohamed.gabry@tabby.ai') {
      role = 'Team Leader';
      allowedTabs = ['overview', 'metrics', 'team', 'requests', 'announcements', 'agent-data'];
    }

    const userObj = {
      user_email: cleanEmail,
      username: cleanEmail.split('@')[0],
      role: role as any,
      team_name: 'Support Tier 1',
      floor_name: 'Floor 1',
      account_status: 'Active' as const,
      allowed_tabs: allowedTabs,
    };

    setCurrentUser(userObj);
    refreshMetrics(userObj);
    logAuditAction('USER_LOGIN', cleanEmail);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setEmail('');
    setPassword('');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-gray-200">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
              T
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome to Tabby.ai</CardTitle>
            <CardDescription>Enter your credentials to access the operational dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-md text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="omar.allaa@tabby.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white gap-2 mt-2">
                Sign In to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isTabAllowed = (tabKey: string) => currentUser.allowed_tabs.includes(tabKey);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
            <div>
              <div className="font-bold text-gray-900">Tabby.ai</div>
              <div className="text-[11px] text-emerald-700 font-semibold uppercase">{currentUser.role} View</div>
            </div>
          </div>

          <nav className="space-y-1 text-xs">
            {isTabAllowed('overview') && (
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" /> Overview
              </button>
            )}

            {isTabAllowed('metrics') && (
              <button
                onClick={() => setActiveTab('metrics')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'metrics' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" /> Performance Analytics
              </button>
            )}

            {isTabAllowed('team') && (
              <button
                onClick={() => setActiveTab('team')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'team' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users2 className="h-4 w-4" /> Team & Floor Insights
              </button>
            )}

            {isTabAllowed('my_performance') && (
              <button
                onClick={() => setActiveTab('my-performance')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'my-performance' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <User className="h-4 w-4" /> My Performance
              </button>
            )}

            {isTabAllowed('requests') && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'requests' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <MessageSquarePlus className="h-4 w-4" /> Requests
              </button>
            )}

            {isTabAllowed('announcements') && (
              <button
                onClick={() => setActiveTab('announcements')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'announcements' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Megaphone className="h-4 w-4" /> Announcements
              </button>
            )}

            {isTabAllowed('agent-data') && (
              <button
                onClick={() => setActiveTab('agent-data')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'agent-data' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Database className="h-4 w-4" /> Data & Import
              </button>
            )}

            {isTabAllowed('admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'admin' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> Admin Settings
              </button>
            )}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="p-2 bg-gray-50 rounded-md border text-xs">
            <div className="font-semibold truncate">{currentUser.user_email}</div>
            <div className="text-[10px] text-emerald-700 font-bold uppercase">{currentUser.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'overview' && isTabAllowed('overview') && <OverviewTab />}
        {activeTab === 'metrics' && isTabAllowed('metrics') && <MetricsTab />}
        {activeTab === 'team' && isTabAllowed('team') && <TeamTab />}
        {activeTab === 'my-performance' && isTabAllowed('my_performance') && <OverviewTab />}
        {activeTab === 'requests' && isTabAllowed('requests') && <RequestsTab currentUser={currentUser} />}
        {activeTab === 'announcements' && isTabAllowed('announcements') && <AnnouncementsTab currentUser={currentUser} />}
        {activeTab === 'agent-data' && isTabAllowed('agent-data') && <AgentDataTab />}
        {activeTab === 'admin' && isTabAllowed('admin') && <AdminSettingsTab />}
      </div>
    </div>
  );
}
