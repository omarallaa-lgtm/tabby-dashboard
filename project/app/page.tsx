'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound, Check, Sparkles } from 'lucide-react';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { MetricsTab } from '@/components/tabs/metrics-tab';
import { TeamTab } from '@/components/tabs/team-tab';
import { AdminSettingsTab } from '@/components/tabs/admin-settings-tab';
import { AgentDataTab } from '@/components/tabs/agent-data-tab';
import { RequestsTab } from '@/components/tabs/requests-tab';
import { AnnouncementsTab } from '@/components/tabs/announcements-tab';
import { supabase, useMetrics } from '@/lib/metrics-context';

export default function Home() {
  const { currentUser, setCurrentUser, refreshMetrics } = useMetrics() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Password Settings State
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' • ' +
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanEmail = email.trim().toLowerCase();

    // Direct Admin Fallback Check
    if (cleanEmail === 'omar.allaa@tabby.ai' && password === 'Boyka@1322') {
      const adminUser = {
        user_email: cleanEmail,
        username: 'omar.allaa',
        role: 'Admin' as const,
        team_name: 'Support Tier 1',
        floor_name: 'Floor 1',
        account_status: 'Active' as const,
        allowed_tabs: ['overview', 'metrics', 'team', 'requests', 'announcements', 'agent-data', 'admin'],
      };
      setCurrentUser(adminUser);
      if (typeof refreshMetrics === 'function') refreshMetrics(adminUser);
      return;
    }

    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_email', cleanEmail)
        .single();

      if (userProfile && userProfile.password_hash === password) {
        setCurrentUser(userProfile);
        if (typeof refreshMetrics === 'function') refreshMetrics(userProfile);
        return;
      }
    } catch (err) {
      console.error('Supabase auth error:', err);
    }

    setErrorMessage("😼 Invalid credentials. Check your email or password.");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    await supabase
      .from('user_profiles')
      .update({ password_hash: newPassword, is_temporary_password: false })
      .eq('user_email', currentUser.user_email);

    setProfileMsg('✓ Password updated successfully!');
    setNewPassword('');
    setTimeout(() => setProfileMsg(''), 3000);
  };

  // ANIMATED STYLED LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0F17] p-4 relative overflow-hidden font-sans select-none">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>

        {/* Floating Glassmorphic Login Card */}
        <Card className="w-full max-w-md shadow-[0_0_50px_rgba(16,185,129,0.1)] border border-slate-800/80 bg-slate-900/60 text-slate-100 backdrop-blur-2xl relative z-10 transition-all duration-300 hover:border-emerald-500/30 rounded-3xl p-2">
          <CardHeader className="text-center space-y-3 pb-2 pt-6">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl shadow-emerald-500/20 group cursor-pointer transition-transform duration-300 hover:scale-105">
              <div className="h-full w-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center">
                <span className="font-black text-2xl text-transparent bg-clip-text bg-gradient-to-tr from-emerald-400 to-teal-300">T</span>
              </div>
            </div>
            <div>
              <CardTitle className="text-2xl font-black tracking-tight text-white">Tabby.ai Hub</CardTitle>
              <CardDescription className="text-slate-400 text-xs mt-1">Sign in to access your operational workspace</CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 text-xs font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 text-[11px] tracking-wide uppercase">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    type="email"
                    placeholder="omar.allaa@tabby.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-950/80 border-slate-800/80 text-slate-100 placeholder:text-slate-600 h-10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 text-[11px] tracking-wide uppercase">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-950/80 border-slate-800/80 text-slate-100 placeholder:text-slate-600 h-10 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black h-10 rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 gap-2 mt-2"
              >
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

  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'metrics', label: 'Performance Analytics', icon: BarChart3 },
    { key: 'team', label: 'Team & Floor Insights', icon: Users2 },
    { key: 'requests', label: 'Requests', icon: MessageSquarePlus },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'agent-data', label: 'Data & Backups', icon: Database },
    { key: 'admin', label: 'Admin Settings', icon: ShieldCheck },
  ];

  return (
    <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50/80 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r p-4 flex flex-col justify-between backdrop-blur-xl shrink-0 ${isDarkMode ? 'bg-slate-900/90 border-slate-800/80' : 'bg-white/90 border-slate-200/80 shadow-xs'}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-md shadow-emerald-500/20">
              T
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-sm">Tabby.ai</div>
              <div className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5" /> {currentUser.role}
              </div>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-medium">
            {navItems.map((item) => {
              if (!isTabAllowed(item.key)) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-500/10 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Left Profile Badge */}
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
            <div className="truncate">
              <div className="font-bold text-xs truncate text-emerald-600 dark:text-emerald-400">{currentUser.user_email}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
            </div>

            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 bg-white dark:bg-slate-800 border border-emerald-500/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <KeyRound className="h-3.5 w-3.5 text-emerald-500" />
              <span>Update Password</span>
            </button>
          </div>

          <button
            onClick={() => setCurrentUser(null)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Bar */}
        <header className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md shrink-0 ${isDarkMode ? 'bg-slate-900/80 border-slate-800/80' : 'bg-white/80 border-slate-200/80'}`}>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Clock className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>{currentTime || 'Syncing live clock...'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-500/10 transition-colors text-xs flex items-center gap-2 font-semibold"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        {/* Password Update Drawer */}
        {showProfile && (
          <div className="p-5 bg-emerald-500/10 border-b border-emerald-500/30 text-xs space-y-3 animate-fade-in-up">
            <div className="font-bold flex items-center justify-between text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Update Permanent Password for {currentUser.user_email}</span>
              <button onClick={() => setShowProfile(false)} className="text-slate-500 text-xs font-bold hover:underline">Close</button>
            </div>
            <form onSubmit={handleUpdatePassword} className="flex gap-2 max-w-md">
              <Input
                type="password"
                placeholder="Enter new permanent password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                required
              />
              <Button type="submit" size="sm" className="h-8 bg-emerald-600 text-white text-xs gap-1 font-bold">
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </form>
            {profileMsg && <p className="text-emerald-600 font-bold">{profileMsg}</p>}
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
