'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound, Check, Sparkles, Eye, EyeOff, Zap, Flame, ShieldAlert } from 'lucide-react';
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

  // Password Settings State
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  // Anime Sequence & Input Focus States
  const [entrancePhase, setEntrancePhase] = useState<'fireball' | 'revealed'>('fireball');
  const [focusedField, setFocusedField] = useState<'none' | 'email' | 'password'>('none');
  const [jutsuState, setJutsuState] = useState<'idle' | 'genjutsu_error' | 'rasengan_burst'>('idle');

  // Entrance Fireball Timer (1.8s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setEntrancePhase('revealed');
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

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

    // Admin Fallback Check
    if (cleanEmail === 'omar.allaa@tabby.ai' && password === 'Boyka@1322') {
      setJutsuState('rasengan_burst');
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
      }, 1200);
      return;
    }

    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_email', cleanEmail)
        .single();

      if (userProfile && userProfile.password_hash === password) {
        setJutsuState('rasengan_burst');
        setTimeout(() => {
          setCurrentUser(userProfile);
          if (typeof refreshMetrics === 'function') refreshMetrics(userProfile);
        }, 1200);
        return;
      }
    } catch (err) {
      console.error('Supabase auth error:', err);
    }

    setJutsuState('genjutsu_error');
    setErrorMessage("Chakra Disruption: Invalid email or password!");
    setTimeout(() => setJutsuState('idle'), 2200);
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

  // FULL-SCREEN VIDEO BACKGROUND LOGIN PAGE
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#03060E] font-sans select-none overflow-hidden relative">
        
        {/* 1. BACKGROUND VIDEO LAYER (NARUTO VS SASUKE BATTLE LOOP) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-50 scale-105"
          >
            <source
              src="https://youtu.be/flxZd7EFhSo?si=sduv-_EF3m6045ZH"
              type="video/mp4"
            />
          </video>
          {/* Overlay Dark Gradients for Content Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#03060E] via-[#03060E]/60 to-[#03060E]/90"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-purple-600/20"></div>
        </div>

        {/* 2. FIREBALL JUTSU ENTRANCE ANIMATION (KATON: GŌKAKYŪ NO JUTSU) */}
        {entrancePhase === 'fireball' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#03060E] pointer-events-none">
            <div className="relative flex items-center justify-center">
              <div className="w-56 h-56 rounded-full bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 blur-2xl animate-ping"></div>
              <div className="w-72 h-72 rounded-full bg-gradient-to-tr from-yellow-400 via-orange-500 to-red-600 shadow-[0_0_140px_#f97316] flex items-center justify-center animate-spin">
                <Flame className="h-36 w-36 text-amber-200 animate-pulse" />
              </div>
              <div className="absolute font-black text-amber-300 text-3xl tracking-widest uppercase animate-pulse">
                火遁・豪火球の術
              </div>
            </div>
          </div>
        )}

        {/* 3. GLASSMORPHIC LOGIN CARD */}
        <div className={`w-full max-w-md relative z-20 transition-all duration-1000 ${
          entrancePhase === 'revealed' ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`}>
          
          {/* Error Flash Overlay */}
          {jutsuState === 'genjutsu_error' && (
            <div className="absolute -inset-10 z-30 bg-red-600/30 rounded-3xl blur-2xl animate-pulse pointer-events-none"></div>
          )}

          {/* Victory Burst Overlay */}
          {jutsuState === 'rasengan_burst' && (
            <div className="absolute -inset-10 z-30 bg-cyan-500/40 rounded-3xl blur-3xl animate-ping pointer-events-none"></div>
          )}

          <div className={`relative bg-[#080D1A]/85 border-2 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_0_90px_rgba(0,0,0,0.9)] transition-all duration-300 ${
            focusedField === 'email' ? 'border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.4)]' :
            focusedField === 'password' ? 'border-purple-500/80 shadow-[0_0_50px_rgba(168,85,247,0.4)]' :
            'border-slate-800'
          }`}>
            
            {/* Top Emblem & Title */}
            <div className="text-center space-y-3 pb-6 border-b border-slate-800/80">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 p-0.5 shadow-xl shadow-amber-500/20">
                <div className="h-full w-full bg-[#080D1A] rounded-[14px] flex items-center justify-center font-black text-amber-400 text-2xl">
                  木
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-wider text-white flex items-center justify-center gap-2 uppercase">
                  SHINOBI PORTAL <Sparkles className="h-4 w-4 text-amber-400" />
                </h1>
                <p className="text-xs text-amber-500/80 font-bold uppercase tracking-widest mt-1">
                  Tabby.ai Shippuden Execution Workspace
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleLogin} className="space-y-5 pt-6 text-xs">
              {errorMessage && (
                <div className="p-3.5 bg-red-950/80 border border-red-500/50 text-red-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-shake">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-300 text-[11px] tracking-wider uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-amber-500" /> Shinobi Identification</span>
                  {focusedField === 'email' && <span className="text-[10px] text-amber-400 font-mono">Rasengan Aura Active</span>}
                </label>
                <Input
                  type="email"
                  placeholder="omar.allaa@tabby.ai"
                  value={email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('none')}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-xs bg-[#040711]/90 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-2xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-semibold px-4 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-300 text-[11px] tracking-wider uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-purple-400" /> Secret Chakra Passcode</span>
                  {focusedField === 'password' && <span className="text-[10px] text-purple-400 font-mono">Chidori Spark Active</span>}
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('none')}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-xs bg-[#040711]/90 border-slate-800 text-slate-100 placeholder:text-slate-600 rounded-2xl pr-12 font-semibold px-4 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
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
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-800 text-amber-500 focus:ring-amber-500 h-4 w-4 bg-slate-900"
                  />
                  <span>Persist Shinobi Session</span>
                </label>
                <button type="button" className="font-bold text-amber-400 hover:underline">
                  Reset Passcode?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-slate-950 font-black h-12 rounded-2xl text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] transition-all duration-300 mt-2"
              >
                Unleash Chakra & Enter Hub
              </Button>
            </form>

            <div className="text-center text-[11px] text-slate-500 pt-4 border-t border-slate-800/80 mt-4">
              Need access? Contact <span className="font-bold text-amber-400 underline cursor-pointer">Hokage Leadership</span>
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
    <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-[#03060E] text-slate-100' : 'bg-slate-50/80 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r p-4 flex flex-col justify-between shrink-0 ${isDarkMode ? 'bg-[#080D1A] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md">
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
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-l-4 border-amber-500 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-500/10 hover:text-slate-900 dark:hover:text-slate-100'
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
        <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-2">
            <div className="truncate">
              <div className="font-bold text-xs truncate text-amber-600 dark:text-amber-400">{currentUser.user_email}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
            </div>

            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 bg-white dark:bg-slate-800 border border-amber-500/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
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
        <header className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md shrink-0 ${isDarkMode ? 'bg-[#080D1A]/80 border-slate-800' : 'bg-white/80 border-slate-200/80'}`}>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400">
            <Clock className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
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
          <div className="p-5 bg-amber-500/10 border-b border-amber-500/30 text-xs space-y-3 animate-fade-in-up">
            <div className="font-bold flex items-center justify-between text-amber-600 dark:text-amber-400">
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
              <Button type="submit" size="sm" className="h-8 bg-amber-600 text-white text-xs gap-1 font-bold">
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </form>
            {profileMsg && <p className="text-amber-600 font-bold">{profileMsg}</p>}
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
