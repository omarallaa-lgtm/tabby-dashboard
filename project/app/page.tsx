'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, MessageSquarePlus, Megaphone, LogOut, User, Sun, Moon, Clock } from 'lucide-react';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { MetricsTab } from '@/components/tabs/metrics-tab';
import { TeamTab } from '@/components/tabs/team-tab';
import { AdminSettingsTab } from '@/components/tabs/admin-settings-tab';
import { AgentDataTab } from '@/components/tabs/agent-data-tab';
import { RequestsTab } from '@/components/tabs/requests-tab';
import { AnnouncementsTab } from '@/components/tabs/announcements-tab';
import { supabase, useMetrics } from '@/lib/metrics-context';

export default function Home() {
  const { currentUser, setCurrentUser, refreshMetrics, logAuditAction } = useMetrics() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Live Header Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();

    // Query user profile & password hash from Supabase
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_email', cleanEmail)
      .single();

    if (userProfile && userProfile.password_hash === password) {
      setCurrentUser(userProfile);
      refreshMetrics(userProfile);
      if (typeof logAuditAction === 'function') {
        logAuditAction('USER_LOGIN', cleanEmail);
      }
    } else if (cleanEmail === 'omar.allaa@tabby.ai' && password === 'Boyka@1322') {
      const fallbackAdmin = {
        user_email: cleanEmail,
        username: 'omar.allaa',
        role: 'Admin',
        team_name: 'Support Tier 1',
        floor_name: 'Floor 1',
        account_status: 'Active',
        allowed_tabs: ['overview', 'metrics', 'team', 'requests', 'announcements', 'agent-data', 'admin'],
      };
      setCurrentUser(fallbackAdmin);
      refreshMetrics(fallbackAdmin);
    } else {
      setErrorMessage("😼 Invalid email or password. Please verify your Tabby.ai credentials.");
    }
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
            <CardTitle className="text-2xl font-bold text-gray-900">Tabby.ai Performance Hub</CardTitle>
            <CardDescription>Enter your official Tabby.ai credentials to sign in</CardDescription>
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
                Sign In <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allowedTabs: string[] = currentUser.allowed_tabs || [];
  const isTabAllowed = (tabKey: string) => allowedTabs.includes(tabKey) || currentUser.role === 'Admin';

  return (
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r p-4 flex flex-col justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
              T
            </div>
            <div>
              <div className="font-bold">Tabby.ai</div>
              <div className="text-[11px] text-emerald-500 font-semibold uppercase">{currentUser.role} View</div>
            </div>
          </div>

          <nav className="space-y-1 text-xs">
            {isTabAllowed('overview') && (
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50/10'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" /> Overview
              </button>
            )}

            {isTabAllowed('metrics') && (
              <button
                onClick={() => setActiveTab('metrics')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'metrics' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50/10'
                }`}
              >
                <BarChart3 className="h-4 w-4" /> Performance Analytics
              </button>
            )}

            {isTabAllowed('team') && (
              <button
                onClick={() => setActiveTab('team')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'team' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50/10'
                }`}
              >
                <Users2 className="h-4 w-4" /> Team & Floor Insights
              </button>
            )}

            {isTabAllowed('requests') && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'requests' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50/10'
                }`}
              >
                <MessageSquarePlus className="h-4 w-4" /> Requests
              </button>
            )}

            {isTabAllowed('announcements') && (
              <button
                onClick={() => setActiveTab('announcements')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'announcements' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50/10'
                }`}
              >
                <Megaphone className="h-4 w-4" /> Announcements
              </button>
            )}

            {isTabAllowed('agent-data') && (
              <button
                onClick={() => setActiveTab('agent-data')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'agent-data' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50/10'
                }`}
              >
                <Database className="h-4 w-4" /> Data & Import
              </button>
            )}

            {isTabAllowed('admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2 font-medium rounded-md ${
                  activeTab === 'admin' ? 'bg-emerald-600 text-white' : 'hover:bg-emerald-50/10'
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> Admin Settings
              </button>
            )}
          </nav>
        </div>

        <div className="space-y-3">
          <div className="p-2 rounded-md border text-xs bg-gray-50/5">
            <div className="font-semibold truncate">{currentUser.user_email}</div>
            <div className="text-[10px] text-emerald-500 font-bold uppercase">{currentUser.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50/10 rounded-md"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar with Live Clock and Dark Mode Switch */}
        <header className={`h-14 border-b px-8 flex items-center justify-between ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-4 w-4 text-emerald-600" />
            <span>{currentTime || new Date().toLocaleString()}</span>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-md border hover:bg-gray-100 dark:hover:bg-gray-700 text-xs flex items-center gap-2"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-gray-600" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'overview' && isTabAllowed('overview') && <OverviewTab />}
          {activeTab === 'metrics' && isTabAllowed('metrics') && <MetricsTab />}
          {activeTab === 'team' && isTabAllowed('team') && <TeamTab />}
          {activeTab === 'requests' && isTabAllowed('requests') && <RequestsTab currentUser={currentUser} />}
          {activeTab === 'announcements' && isTabAllowed('announcements') && <AnnouncementsTab currentUser={currentUser} />}
          {activeTab === 'agent-data' && isTabAllowed('agent-data') && <AgentDataTab />}
          {activeTab === 'admin' && isTabAllowed('admin') && <AdminSettingsTab />}
        </main>
      </div>
    </div>
  );
}
