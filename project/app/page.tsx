'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, 
  MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound, Check, 
  Sparkles, Eye, EyeOff, Orbit, ArrowRight 
} from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password Settings Drawer State
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
    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();

    // 1. Direct Admin Fallback Check
    if (cleanEmail === 'omar.allaa@tabby.ai' && password === 'Boyka@1322') {
      setTimeout(() => {
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
      }, 800);
      return;
    }

    // 2. Supabase Query
    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_email', cleanEmail)
        .single();

      if (userProfile && userProfile.password_hash === password) {
        setTimeout(() => {
          setCurrentUser(userProfile);
          if (typeof refreshMetrics === 'function') refreshMetrics(userProfile);
        }, 800);
        return;
      }
    } catch (err) {
      console.error('Supabase auth error:', err);
    }

    setIsSubmitting(false);
    setErrorMessage("Gravitational Anomaly: Invalid email or passcode!");
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

  // FULL-SCREEN BLACK HOLE VIDEO LOGIN PAGE
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#020208] font-sans select-none overflow-hidden relative">
        
        {/* BLACK HOLE YOUTUBE BACKGROUND VIDEO (0Z_u1HPfy-8) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none scale-125">
          <iframe
            src="https://www.youtube.com/embed/0Z_u1HPfy-8?autoplay=1&mute=1&controls=0&loop=1&playlist=0Z_u1HPfy-8&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1&disablekb=1"
            title="Black Hole Background Video"
            allow="autoplay; encrypted-media"
            className="w-full h-full min-w-[100vw] min-h-[100vh] object-cover pointer-events-none opacity-80 filter brightness-95 contrast-110"
          />
          {/* Cosmic Dark Vignette Gradients */}
          <div className="absolute inset-0 bg-radial from-transparent via-[#020208]/40 to-[#020208]/90"></div>
        </div>

        {/* COSMIC BLACK HOLE GLASSMORPHIC LOGIN CARD */}
        <div className="w-full max-w-md relative z-10 px-4">
          
          {/* Glowing Accretion Disk Ring Effect */}
          <div className="absolute -inset-1.5 rounded-[32px] bg-gradient-to-r from-amber-500/20 via-purple-600/30 to-blue-500/20 blur-xl opacity-80 animate-pulse pointer-events-none"></div>

          <div className="relative bg-[#050814]/80 border border-amber-500/30 backdrop-blur-3xl rounded-[28px] p-8 shadow-[0_0_100px_rgba(0,0,0,0.95)]">
            
            {/* Black Hole Emblem & Title */}
            <div className="text-center space-y-3 pb-6 border-b border-white/10">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-900 p-0.5 shadow-2xl shadow-amber-500/20">
                <div className="h-full w-full bg-[#03050E] rounded-full flex items-center justify-center text-amber-400">
                  <Orbit className="h-8 w-8 animate-spin" style={{ animationDuration: '12s' }} />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-wider text-white flex items-center justify-center gap-2 uppercase">
                  Tabby.ai Portal <Sparkles className="h-4 w-4 text-amber-400" />
                </h1>
                <p className="text-[11px] text-amber-400/80 font-bold uppercase tracking-widest mt-1">
                  Event Horizon Performance Hub
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5 pt-6 text-xs">
              {errorMessage && (
                <div className="p-3.5 bg-red-950/80 border border-red-500/50 text-red-300 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 text-[11px] tracking-wider uppercase">Email Address</label>
                <Input
                  type="email"
                  placeholder="user@tabby.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-xs bg-[#03050F]/90 border-white/10 text-white placeholder:text-slate-600 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium px-4 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 text-[11px] tracking-wider uppercase">Passcode</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-xs bg-[#03050F]/90 border-white/10 text-white placeholder:text-slate-600 rounded-2xl pr-12 font-medium px-4 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-amber-400 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-amber-400" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/10 bg-slate-900 text-amber-500 focus:ring-amber-500 h-4 w-4"
                  />
                  <span>Remember Session</span>
                </label>
                <button type="button" className="font-bold text-amber-400 hover:underline">
                  Forgot Password?
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold h-12 rounded-2xl text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] transition-all duration-300 gap-2 mt-2"
              >
                <span>{isSubmitting ? 'Authenticating...' : 'Enter Dashboard'}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="text-center text-[11px] text-slate-500 pt-4 border-t border-white/10 mt-4 font-medium">
              Having trouble logging in? Contact <span className="font-bold text-amber-400 underline cursor-pointer">Admin Support</span>
            </div>
          </div>
        </div>
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
    <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-[#020208] text-slate-100' : 'bg-slate-50/80 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r p-4 flex flex-col justify-between shrink-0 ${isDarkMode ? 'bg-[#050814] border-white/10' : 'bg-white border-slate-200/80 shadow-xs'}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              T
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-sm">Tabby.ai</div>
              <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1">
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
                      ? 'bg-amber-500/10 text-amber-400 border-l-4 border-amber-500 shadow-xs'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Left Profile Badge */}
        <div className="space-y-2 border-t border-white/10 pt-3">
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
            <div className="truncate">
              <div className="font-bold text-xs truncate text-amber-400">{currentUser.user_email}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
            </div>

            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full text-xs font-bold text-amber-400 hover:bg-amber-500/10 bg-white/5 border border-amber-500/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <KeyRound className="h-3.5 w-3.5 text-amber-500" />
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
        <header className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md shrink-0 ${isDarkMode ? 'bg-[#050814]/80 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-400">
            <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>{currentTime || 'Syncing live clock...'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-colors text-xs flex items-center gap-2 font-semibold"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        {/* Password Update Drawer */}
        {showProfile && (
          <div className="p-5 bg-amber-500/10 border-b border-amber-500/30 text-xs space-y-3 animate-fade-in-up">
            <div className="font-bold flex items-center justify-between text-amber-400">
              <span className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Update Permanent Password for {currentUser.user_email}</span>
              <button onClick={() => setShowProfile(false)} className="text-slate-500 text-xs font-bold hover:underline">Close</button>
            </div>
            <form onSubmit={handleUpdatePassword} className="flex gap-2 max-w-md">
              <Input
                type="password"
                placeholder="Enter new permanent password..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-8 text-xs bg-slate-900 text-white"
                required
              />
              <Button type="submit" size="sm" className="h-8 bg-amber-600 text-white text-xs gap-1 font-bold">
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </form>
            {profileMsg && <p className="text-amber-400 font-bold">{profileMsg}</p>}
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
