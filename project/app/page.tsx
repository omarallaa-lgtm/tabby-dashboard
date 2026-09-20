'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound, Check, Sparkles, Eye, EyeOff } from 'lucide-react';
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Password Settings State
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  // Cursor Tracking for Character Eyes
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTypingPassword, setIsTypingPassword] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
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

    setErrorMessage("Invalid credentials. Please verify your email or password.");
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

  // Helper calculation for eye pupil offset relative to mouse
  const calcPupilPos = (eyeX: number, eyeY: number) => {
    if (isTypingPassword) return { x: 0, y: -4 }; // Look away/up when entering password
    const dx = mousePos.x - eyeX;
    const dy = mousePos.y - eyeY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = 5;
    if (dist === 0) return { x: 0, y: 0 };
    return {
      x: (dx / dist) * Math.min(dist, maxOffset),
      y: (dy / dist) * Math.min(dist, maxOffset),
    };
  };

  // SPLIT-SCREEN ANIMATED CHARACTER LOGIN PAGE
  if (!currentUser) {
    const pEye = calcPupilPos(300, 300);

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#18181B] p-4 font-sans select-none">
        <div className="w-full max-w-4xl bg-white rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[520px]">
          {/* LEFT PANEL: ANIMATED EYE-TRACKING CHARACTERS */}
          <div className="w-full md:w-1/2 bg-[#E4E4E7] p-8 flex items-end justify-center relative overflow-hidden min-h-[260px] md:min-h-auto">
            <div className="relative w-full max-w-[320px] h-64 flex items-end justify-center">
              {/* Orange Dome Character */}
              <div className="absolute left-2 bottom-0 w-32 h-24 bg-[#F97316] rounded-t-full flex items-center justify-center gap-3 pt-2 shadow-md">
                <div className="w-3 h-3 bg-black rounded-full relative">
                  <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5" style={{ transform: `translate(${pEye.x * 0.5}px, ${pEye.y * 0.5}px)` }} />
                </div>
                <div className="w-3 h-3 bg-black rounded-full relative">
                  <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 left-0.5" style={{ transform: `translate(${pEye.x * 0.5}px, ${pEye.y * 0.5}px)` }} />
                </div>
              </div>

              {/* Purple Pillar Character */}
              <div className="absolute left-16 bottom-0 w-20 h-52 bg-[#7C3AED] rounded-t-2xl flex flex-col items-center pt-6 gap-2 shadow-lg z-10">
                <div className="flex gap-3">
                  <div className="w-3.5 h-3.5 bg-white rounded-full relative flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full" style={{ transform: `translate(${pEye.x}px, ${pEye.y}px)` }} />
                  </div>
                  <div className="w-3.5 h-3.5 bg-white rounded-full relative flex items-center justify-center">
                    <div className="w-2 h-2 bg-black rounded-full" style={{ transform: `translate(${pEye.x}px, ${pEye.y}px)` }} />
                  </div>
                </div>
              </div>

              {/* Black Tall Character */}
              <div className="absolute left-32 bottom-0 w-16 h-44 bg-[#18181B] rounded-t-xl flex flex-col items-center pt-4 gap-2 shadow-lg z-20">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 bg-white rounded-full relative flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-black rounded-full" style={{ transform: `translate(${pEye.x}px, ${pEye.y}px)` }} />
                  </div>
                  <div className="w-2.5 h-2.5 bg-white rounded-full relative flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-black rounded-full" style={{ transform: `translate(${pEye.x}px, ${pEye.y}px)` }} />
                  </div>
                </div>
              </div>

              {/* Yellow Pillar Character */}
              <div className="absolute right-4 bottom-0 w-16 h-36 bg-[#FACC15] rounded-t-xl flex flex-col items-center pt-5 gap-2 shadow-md z-30">
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 bg-black rounded-full relative">
                    <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" style={{ transform: `translate(${pEye.x * 0.4}px, ${pEye.y * 0.4}px)` }} />
                  </div>
                  <div className="w-2.5 h-2.5 bg-black rounded-full relative">
                    <div className="w-1 h-1 bg-white rounded-full absolute top-0.5 left-0.5" style={{ transform: `translate(${pEye.x * 0.4}px, ${pEye.y * 0.4}px)` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: LOGIN FORM */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white text-slate-900">
            <div className="space-y-6 max-w-sm mx-auto w-full">
              <div className="space-y-1 text-center md:text-left">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back!</h1>
                <p className="text-xs text-slate-500">Please enter your details</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                {errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-xs">Email</label>
                  <Input
                    type="email"
                    placeholder="anna@gmail.com"
                    value={email}
                    onFocus={() => setIsTypingPassword(false)}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 text-xs border-slate-200 focus:border-slate-900 focus:ring-0 rounded-xl font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 text-xs">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onFocus={() => setIsTypingPassword(true)}
                      onBlur={() => setIsTypingPassword(false)}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 text-xs border-slate-200 focus:border-slate-900 focus:ring-0 rounded-xl pr-10 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-slate-900 focus:ring-0 h-3.5 w-3.5"
                    />
                    <span>Remember for 30 days</span>
                  </label>
                  <button type="button" className="font-semibold text-slate-900 hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 rounded-xl text-xs shadow-md transition-all mt-2"
                >
                  Log in
                </Button>
              </form>

              <div className="text-center text-[11px] text-slate-500 pt-2">
                Don't have an account? <span className="font-bold text-slate-900 cursor-pointer hover:underline">Sign up</span>
              </div>
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
    <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-[#18181B] text-slate-100' : 'bg-slate-50/80 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r p-4 flex flex-col justify-between shrink-0 ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
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
        <div className="space-y-2 border-t border-slate-200 dark:border-zinc-800 pt-3">
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
            <div className="truncate">
              <div className="font-bold text-xs truncate text-emerald-600 dark:text-emerald-400">{currentUser.user_email}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
            </div>

            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 bg-white dark:bg-zinc-800 border border-emerald-500/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
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
        <header className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md shrink-0 ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white/80 border-slate-200/80'}`}>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Clock className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>{currentTime || 'Syncing live clock...'}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-500/10 transition-colors text-xs flex items-center gap-2 font-semibold"
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
                className="h-8 text-xs bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100"
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
