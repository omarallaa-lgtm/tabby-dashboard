'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound, Check, Sparkles, Eye, EyeOff, Zap, Flame } from 'lucide-react';
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

  // Naruto vs Sasuke Interactive Battle States
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState<'none' | 'email' | 'password'>('none');
  const [battleState, setAnimState] = useState<'idle' | 'clash_error' | 'victory'>('idle');

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

    // Admin Credentials
    if (cleanEmail === 'omar.allaa@tabby.ai' && password === 'Boyka@1322') {
      setAnimState('victory');
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
      }, 1000);
      return;
    }

    try {
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_email', cleanEmail)
        .single();

      if (userProfile && userProfile.password_hash === password) {
        setAnimState('victory');
        setTimeout(() => {
          setCurrentUser(userProfile);
          if (typeof refreshMetrics === 'function') refreshMetrics(userProfile);
        }, 1000);
        return;
      }
    } catch (err) {
      console.error('Supabase auth error:', err);
    }

    // Trigger Rasengan vs Chidori Error Impact Clash
    setAnimState('clash_error');
    setErrorMessage("Chakra Disruption: Invalid email or password!");
    setTimeout(() => setAnimState('idle'), 2000);
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

  // Eye calculation for Naruto & Sasuke
  const calcNinjaEyes = (baseX: number, baseY: number) => {
    if (focusedField === 'password' || showPassword) return { x: 10, y: -10 }; // Looking away in Genjutsu / Smoke
    const dx = mousePos.x - baseX;
    const dy = mousePos.y - baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxOffset = 8;
    if (dist === 0) return { x: 0, y: 0 };
    return {
      x: (dx / dist) * Math.min(dist, maxOffset),
      y: (dy / dist) * Math.min(dist, maxOffset),
    };
  };

  // NARUTO VS SASUKE FULL-SCREEN BATTLE LOGIN SCREEN
  if (!currentUser) {
    const narutoEye = calcNinjaEyes(350, 450);
    const sasukeEye = calcNinjaEyes(550, 450);

    return (
      <div className="min-h-screen w-full flex bg-[#0B0F19] font-sans select-none overflow-hidden">
        {/* LEFT BATTLE PANEL: NARUTO VS SASUKE AT FINAL VALLEY */}
        <div className="w-full md:w-3/5 bg-gradient-to-b from-[#090D16] via-[#101726] to-[#0A0D18] p-8 flex flex-col justify-between relative overflow-hidden min-h-[400px] md:min-h-screen border-r border-amber-500/20">
          
          {/* Valley Waterfalls & Lightning Background Glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(249,115,22,0.15),transparent_50%)] pointer-events-none"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(124,58,237,0.18),transparent_50%)] pointer-events-none"></div>

          {/* Top Title Badge */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-purple-600 p-0.5 shadow-lg shadow-amber-500/20">
              <div className="h-full w-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center font-black text-amber-400 text-lg">
                渦
              </div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                VALLEY OF THE END <Flame className="h-4 w-4 text-orange-500 animate-pulse" />
              </h1>
              <p className="text-[11px] text-amber-500/80 font-bold tracking-widest uppercase">
                Tabby.ai Portal Showdown
              </p>
            </div>
          </div>

          {/* MAIN ANIMATED NINJA BATTLE CANVAS */}
          <div className="relative w-full max-w-xl mx-auto h-[420px] flex items-end justify-between px-4 z-10">
            
            {/* NARUTO (NINE-TAILS & RASENGAN) */}
            <div className={`relative flex flex-col items-center transition-all duration-300 ${
              battleState === 'clash_error' ? 'translate-x-12 scale-110' : ''
            } ${battleState === 'victory' ? '-translate-y-6 scale-105' : ''}`}>
              
              {/* Rasengan Sphere Charge */}
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-cyan-400/80 blur-md absolute -inset-2 animate-ping"></div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-cyan-300 via-sky-400 to-blue-500 border-2 border-white shadow-[0_0_30px_#38bdf8] flex items-center justify-center animate-spin">
                  <Zap className="h-6 w-6 text-white animate-pulse" />
                </div>
              </div>

              {/* Naruto Hair & Head */}
              <div className="w-32 h-44 bg-amber-400 rounded-t-3xl relative border-2 border-amber-300 shadow-2xl flex flex-col items-center pt-6 space-y-2">
                {/* Ninja Headband */}
                <div className="w-full h-7 bg-slate-900 border-y border-amber-500/50 flex items-center justify-center">
                  <div className="w-10 h-4 bg-slate-300 rounded border border-slate-400 flex items-center justify-center text-[8px] font-black text-slate-800">
                    木ノ葉
                  </div>
                </div>

                {/* Eyes & Whisker Marks */}
                <div className="flex gap-4 pt-1">
                  <div className="w-4 h-4 bg-white rounded-full relative flex items-center justify-center border border-amber-600">
                    <div className="w-2 h-2 bg-amber-600 rounded-full" style={{ transform: `translate(${narutoEye.x}px, ${narutoEye.y}px)` }} />
                  </div>
                  <div className="w-4 h-4 bg-white rounded-full relative flex items-center justify-center border border-amber-600">
                    <div className="w-2 h-2 bg-amber-600 rounded-full" style={{ transform: `translate(${narutoEye.x}px, ${narutoEye.y}px)` }} />
                  </div>
                </div>

                {/* Nine-Tails Whiskers */}
                <div className="w-20 flex justify-between px-2 text-amber-700 text-[10px] font-black opacity-80">
                  <span>///</span>
                  <span>\\\</span>
                </div>
              </div>
            </div>

            {/* CLASH IMPACT CENTER (SPARKS & CHAKRA COLLISION) */}
            <div className="relative flex flex-col items-center justify-center h-full">
              {battleState === 'clash_error' && (
                <div className="absolute z-30 animate-ping">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-r from-orange-500 via-yellow-300 to-purple-600 blur-lg"></div>
                </div>
              )}
              <div className="text-center space-y-1 bg-slate-900/80 border border-amber-500/30 px-3 py-1.5 rounded-full backdrop-blur-md shadow-xl">
                <span className="text-[10px] font-black tracking-widest text-amber-400 uppercase">
                  {battleState === 'clash_error' ? '💥 CHAKRA CLASH!' : battleState === 'victory' ? '⚡ BATTLE RESOLVED!' : 'VS'}
                </span>
              </div>
            </div>

            {/* SASUKE (RINNEGAN / SHARINGAN & CHIDORI) */}
            <div className={`relative flex flex-col items-center transition-all duration-300 ${
              battleState === 'clash_error' ? '-translate-x-12 scale-110' : ''
            } ${battleState === 'victory' ? '-translate-y-6 scale-105' : ''}`}>
              
              {/* Chidori Lightning Charge */}
              <div className="relative mb-2">
                <div className="w-16 h-16 rounded-full bg-purple-500/80 blur-md absolute -inset-2 animate-ping"></div>
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-300 border-2 border-white shadow-[0_0_30px_#a855f7] flex items-center justify-center animate-bounce">
                  <Zap className="h-6 w-6 text-cyan-200" />
                </div>
              </div>

              {/* Sasuke Hair & Head */}
              <div className="w-32 h-44 bg-slate-900 rounded-t-3xl relative border-2 border-purple-500 shadow-2xl flex flex-col items-center pt-6 space-y-2">
                {/* Uchiha Collar */}
                <div className="w-full h-7 bg-purple-950 border-y border-purple-500/50 flex items-center justify-center">
                  <div className="w-8 h-4 bg-red-600 rounded-t-full border border-white"></div>
                </div>

                {/* Sharingan / Rinnegan Eyes */}
                <div className="flex gap-4 pt-1">
                  {/* Left Sharingan */}
                  <div className="w-4 h-4 bg-red-600 rounded-full relative flex items-center justify-center border border-slate-950">
                    <div className="w-2 h-2 bg-black rounded-full" style={{ transform: `translate(${sasukeEye.x}px, ${sasukeEye.y}px)` }} />
                  </div>
                  {/* Right Rinnegan */}
                  <div className="w-4 h-4 bg-purple-600 rounded-full relative flex items-center justify-center border border-purple-300">
                    <div className="w-2 h-2 bg-black rounded-full" style={{ transform: `translate(${sasukeEye.x}px, ${sasukeEye.y}px)` }} />
                  </div>
                </div>

                <div className="text-[9px] font-black tracking-widest text-purple-400 uppercase pt-2">
                  うちは
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Lore Note */}
          <div className="relative z-10 text-[11px] text-slate-400 font-medium flex items-center justify-between border-t border-slate-800/80 pt-3">
            <span>Ninja Registration Portal</span>
            <span className="text-amber-400 font-bold">Shinobi Rank: Active Agent</span>
          </div>
        </div>

        {/* RIGHT PANEL: NATIVE TABBY LOGIN FORM */}
        <div className="w-full md:w-2/5 p-8 md:p-14 flex flex-col justify-center bg-white text-slate-900 min-h-screen relative">
          <div className="space-y-8 max-w-sm mx-auto w-full">
            
            <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Shinobi Authentication
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter your Tabby credentials to enter the hub
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 text-sm">
              {errorMessage && (
                <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 text-xs tracking-wide">Ninja Email Address</label>
                <Input
                  type="email"
                  placeholder="omar.allaa@tabby.ai"
                  value={email}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('none')}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 text-sm border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl font-medium px-4"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 text-xs tracking-wide">Chakra Passcode</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField('none')}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 text-sm border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-2xl pr-12 font-medium px-4"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 text-amber-500" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                  />
                  <span>Remember session</span>
                </label>
                <button type="button" className="font-bold text-slate-900 hover:underline">
                  Reset Passcode?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-purple-600 hover:from-amber-600 hover:to-purple-700 text-white font-extrabold h-12 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all mt-3"
              >
                Unleash Chakra & Enter Hub
              </Button>
            </form>

            <div className="text-center text-xs text-slate-500 pt-2 font-medium">
              Need assistance? Contact <span className="font-bold text-slate-900 underline cursor-pointer">Leadership Hokage</span>
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
    <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-[#0B0F19] text-slate-100' : 'bg-slate-50/80 text-slate-900'}`}>
      {/* Sidebar Navigation */}
      <div className={`w-64 border-r p-4 flex flex-col justify-between shrink-0 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'}`}>
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
        <header className={`h-16 border-b px-8 flex items-center justify-between backdrop-blur-md shrink-0 ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200/80'}`}>
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
