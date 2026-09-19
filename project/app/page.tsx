'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound } from 'lucide-react';
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

  // Profile Modal State
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' - ' + now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanEmail = email.trim().toLowerCase();

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_email', cleanEmail)
      .single();

    if (userProfile && userProfile.password_hash === password) {
      setCurrentUser(userProfile);
      refreshMetrics(userProfile);
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
      setErrorMessage("😼 Invalid credentials. Check your email or password.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    await supabase
      .from('user_profiles')
      .update({ password_hash: newPassword, is_temporary_password: false })
      .eq('user_email', currentUser.user_email);

    setProfileMsg('✓ Password updated successfully! Reflecting on Admin Panel.');
    setNewPassword('');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/40 via-slate-900 to-emerald-900/30"></div>
        <Card className="w-full max-w-md shadow-2xl border-slate-800 bg-slate-800/90 text-slate-100 backdrop-blur-md relative z-10 animate-fade-in-up">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-extrabold text-3xl shadow-lg shadow-emerald-500/20">
              T
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Tabby.ai Performance Hub</CardTitle>
            <CardDescription className="text-slate-400 text-xs">Enter your official Tabby.ai credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="omar.allaa@tabby.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 h-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 h-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 mt-2 h-9">
                Sign In to Performance Hub <ArrowRight className="h-4 w-4" />
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
    <div className={`min-h-screen flex ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r p-4 flex flex-col justify-between ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-extrabold text-xl shadow-md">
              T
            </div>
            <div>
              <div className="font-bold tracking-tight">Tabby.ai</div>
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">{currentUser.role} View</div>
            </div>
          </div>

          <nav className="space-y-1 text-xs">
            {isTabAllowed('overview') && (
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-all ${
                  activeTab === 'overview' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'hover:bg-slate-500/10'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" /> Overview
              </button>
            )}

            {isTabAllowed('metrics') && (
              <button
                onClick={() => setActiveTab('metrics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-all ${
                  activeTab === 'metrics' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'hover:bg-slate-500/10'
                }`}
              >
                <BarChart3 className="h-4 w-4" /> Performance Analytics
              </button>
            )}

            {isTabAllowed('team') && (
              <button
                onClick={() => setActiveTab('team')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-all ${
                  activeTab === 'team' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'hover:bg-slate-500/10'
                }`}
              >
                <Users2 className="h-4 w-4" /> Team & Floor Insights
              </button>
            )}

            {isTabAllowed('requests') && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-all ${
                  activeTab === 'requests' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'hover:bg-slate-500/10'
                }`}
              >
                <MessageSquarePlus className="h-4 w-4" /> Requests
              </button>
            )}

            {isTabAllowed('announcements') && (
              <button
                onClick={() => setActiveTab('announcements')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-all ${
                  activeTab === 'announcements' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'hover:bg-slate-500/10'
                }`}
              >
                <Megaphone className="h-4 w-4" /> Announcements
              </button>
            )}

            {isTabAllowed('agent-data') && (
              <button
                onClick={() => setActiveTab('agent-data')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-all ${
                  activeTab === 'agent-data' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'hover:bg-slate-500/10'
                }`}
              >
                <Database className="h-4 w-4" /> Data & Backups
              </button>
            )}

            {isTabAllowed('admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-lg transition-all ${
                  activeTab === 'admin' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'hover:bg-slate-500/10'
                }`}
              >
                <ShieldCheck className="h-4 w-4" /> Admin Settings
              </button>
            )}
          </nav>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-full text-left p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors flex items-center justify-between"
          >
            <div className="truncate">
              <div className="font-bold text-xs truncate">{currentUser.user_email}</div>
              <div className="text-[10px] text-emerald-500 font-bold uppercase">{currentUser.role}</div>
            </div>
            <KeyRound className="h-4 w-4 text-emerald-500 shrink-0" />
          </button>

          <button
            onClick={() => setCurrentUser(null)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-500 animate-pulse">
            <Clock className="h-3.5 w-3.5" />
            <span>{currentTime || 'Syncing live clock...'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg border hover:bg-slate-500/10 transition-colors text-xs flex items-center gap-2 font-medium"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </header>

        {/* Profile Password Modal */}
        {showProfile && (
          <div className="p-6 bg-emerald-500/10 border-b border-emerald-500/30 text-xs space-y-3 animate-fade-in-up">
            <div className="font-bold flex items-center gap-2 text-emerald-600">
              <KeyRound className="h-4 w-4" /> Security & Profile Settings for {currentUser.user_email}
            </div>
            <form onSubmit={handleUpdatePassword} className="flex gap-2 max-w-md">
              <Input
                type="password"
                placeholder="Enter new permanent password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 text-xs bg-white text-gray-900"
                required
              />
              <Button type="submit" size="sm" className="h-8 bg-emerald-600 text-white text-xs">Update Password</Button>
            </form>
            {profileMsg && <p className="text-emerald-600 font-medium">{profileMsg}</p>}
          </div>
        )}

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
