'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, 
  MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound, Check, 
  Sparkles, Eye, EyeOff, Shield, ShieldAlert, ArrowRight, Zap 
} from 'lucide-react';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { MetricsTab } from '@/components/tabs/metrics-tab';
import { TeamTab } from '@/components/tabs/team-tab';
import { AdminSettingsTab } from '@/components/tabs/admin-settings-tab';
import { AgentDataTab } from '@/components/tabs/agent-data-tab';
import { RequestsTab } from '@/components/tabs/requests-tab';
import { AnnouncementsTab } from '@/components/tabs/announcements-tab';
import { supabase, useMetrics } from '@/lib/metrics-context';

// Video URLs for Reactive States
const BACKGROUND_VIDEOS = {
  idle: "https://assets.mixkit.co/videos/preview/mixkit-abstract-fast-lines-of-blue-light-41525-large.mp4",
  failMild: "https://assets.mixkit.co/videos/preview/mixkit-smoke-and-fire-particles-in-the-dark-41538-large.mp4",
  failSevere: "https://assets.mixkit.co/videos/preview/mixkit-red-abstract-motion-lines-41536-large.mp4",
  success: "https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-neon-lights-41551-large.mp4",
};

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

  // Password Settings Drawer State
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');

  // Dynamic Video Login States
  const [videoState, setVideoState] = useState<'idle' | 'failMild' | 'failSevere' | 'success'>('idle');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

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

  // Handle Video Transition
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = BACKGROUND_VIDEOS[videoState];
      videoRef.current.load();
      videoRef.current.play();
    }
  }, [videoState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setErrorMessage("System Locked: Maximum failed attempts exceeded!");
      return;
    }

    setErrorMessage('');
    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();

    setTimeout(async () => {
      // 1. Check Fallback Direct Admin Credentials
      if (cleanEmail === 'omar.allaa@tabby.ai' && password === 'Boyka@1322') {
        setVideoState('success');
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

      // 2. Query Supabase User Profiles
      try {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_email', cleanEmail)
          .single();

        if (userProfile && userProfile.password_hash === password) {
          setVideoState('success');
          setTimeout(() => {
            setCurrentUser(userProfile);
            if (typeof refreshMetrics === 'function') refreshMetrics(userProfile);
          }, 1200);
          return;
        }
      } catch (err) {
        console.error('Supabase auth error:', err);
      }

      // 3. Handle Failure Logic & State Video Reactions
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);

      if (newAttempts >= 3) {
        setIsLocked(true);
        setVideoState('failSevere');
        setErrorMessage("System Locked: Maximum attempts reached (3/3).");
      } else if (newAttempts === 1) {
        setVideoState('failMild');
        setErrorMessage(`Invalid credentials. Attempt ${newAttempts}/3.`);
      } else {
        setVideoState('failSevere');
        setErrorMessage(`Invalid credentials. Attempt ${newAttempts}/3.`);
      }

      setIsSubmitting(false);
    }, 800);
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

  // FULL DYNAMIC VIDEO LOGIN PAGE
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0B0F17] font-sans select-none overflow-hidden relative">
        
        {/* REACTIVE VIDEO BACKGROUND */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover transition-opacity duration-700 opacity-60 scale-105"
          >
            <source src={BACKGROUND_VIDEOS.idle} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F17] via-[#0B0F17]/60 to-[#0B0F17]/80"></div>
        </div>

        {/* SPLIT-SCREEN GLASSMORPHISM CONTAINER */}
        <div className={`w-full max-w-4xl min-h-[540px] relative z-10 flex flex-col md:flex-row rounded-[28px] overflow-hidden border border-white/10 bg-[#121826]/75 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
          isShaking ? 'animate-shake border-red-500/80 shadow-red-500/20' : ''
        }`}>
          
          {/* LEFT HERO BRAND PANEL */}
          <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/10 p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 text-white">
            <div className="space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/30">
                <Zap className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Tabby.ai Hub</h1>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-medium">
                  Dynamic state-reactive login experience with real-time video feedback.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300">
                <Shield className="h-4 w-4 text-indigo-400" />
                <span>Attempts: {attempts}/3</span>
              </div>
            </div>
          </div>

          {/* RIGHT LOGIN FORM PANEL */}
          <div className="w-full md:w-7/12 p-8 md:p-12 flex flex-col justify-center bg-black/30 text-white">
            <div className="space-y-6 max-w-sm mx-auto w-full">
              
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
                <p className="text-xs text-slate-400 mt-1">Please enter your credentials to log in.</p>
              </div>

              {/* Alert Feedback Banner */}
              {errorMessage && (
                <div className="p-3.5 bg-red-500/15 border border-red-500/40 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 text-[11px] tracking-wider uppercase">Email Address</label>
                  <Input
                    type="email"
                    placeholder="omar.allaa@tabby.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 text-xs bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-medium px-4"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-300 text-[11px] tracking-wider uppercase">Password</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 text-xs bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl pr-12 font-medium px-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3 text-slate-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-400">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/20 bg-slate-900 text-indigo-500 focus:ring-0 h-4 w-4"
                    />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="font-semibold text-indigo-400 hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isLocked}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold h-11 rounded-xl text-xs gap-2 shadow-lg shadow-indigo-500/25 transition-all mt-2"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
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
    <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-[#0B0F17] text-slate-100' : 'bg-slate-50/80 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r p-4 flex flex-col justify-between shrink-0 ${isDarkMode ? 'bg-[#121826] border-white/10' : 'bg-white border-slate-200/80 shadow-xs'}`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black text-xl shadow-md">
              T
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-sm">Tabby.ai</div>
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1">
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
                      ? 'bg-indigo-500/10 text-indigo-400 border-l-4 border-indigo-500 shadow-xs'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Left Profile Badge */}
        <div className="space-y-2 border-t border-white/10 pt-3">
          <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
            <div className="truncate">
              <div className="font-bold text-xs truncate text-indigo-400">{currentUser.user_email}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
            </div>

            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full text-xs font-bold text-indigo-400 hover:bg-indigo-500/10 bg-white/5 border border-indigo-500/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <KeyRound className="h-3.5 w-3.5 text-indigo-400" />
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
        <header className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md shrink-0 ${isDarkMode ? 'bg-[#121826]/80 border-white/10' : 'bg-white/80 border-slate-200/80'}`}>
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-400">
            <Clock className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
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
          <div className="p-5 bg-indigo-500/10 border-b border-indigo-500/30 text-xs space-y-3 animate-fade-in-up">
            <div className="font-bold flex items-center justify-between text-indigo-400">
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
              <Button type="submit" size="sm" className="h-8 bg-indigo-600 text-white text-xs gap-1 font-bold">
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </form>
            {profileMsg && <p className="text-indigo-400 font-bold">{profileMsg}</p>}
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
