'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, 
  MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound, Check, 
  Sparkles, Eye, EyeOff, ArrowRight, Key, HelpCircle, X, Send, CheckCircle2
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

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotDetails, setForgotDetails] = useState('');
  const [forgotStatusMsg, setForgotStatusMsg] = useState('');
  const [forgotIsError, setForgotIsError] = useState(false);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);

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
    setErrorMessage("Invalid email or password!");
  };

  const handleRaiseForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotSubmitting(true);
    setForgotStatusMsg('Submitting request to Admin...');
    setForgotIsError(false);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    const generatedUUID = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    const requestPayload = {
      request_id: generatedUUID,
      agent_email: cleanEmail,
      user_email: cleanEmail,
      request_type: 'Password Reset',
      ticket_id: 'PASSWORD-RESET',
      details: forgotDetails.trim() || 'User requested password reset from login page.',
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('requests').insert([requestPayload]);

    setForgotSubmitting(false);

    if (error) {
      setForgotIsError(true);
      setForgotStatusMsg(`Error sending request: ${error.message}`);
    } else {
      setForgotIsError(false);
      setForgotStatusMsg('✓ Password reset request submitted! An Admin will review it on their dashboard queue.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotEmail('');
        setForgotDetails('');
        setForgotStatusMsg('');
      }, 2500);
    }
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

  // FULL-SCREEN BLACK HOLE VIDEO LOGIN PAGE (COMPACT CENTERED HORIZONTAL CARD)
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#020208] font-sans select-none overflow-hidden relative p-4">
        
        {/* FULLSCREEN YOUTUBE BACKGROUND VIDEO */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none scale-125">
          <iframe
            src="https://www.youtube.com/embed/0Z_u1HPfy-8?autoplay=1&mute=1&controls=0&loop=1&playlist=0Z_u1HPfy-8&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1&disablekb=1"
            title="Black Hole Background Video"
            allow="autoplay; encrypted-media"
            className="w-full h-full min-w-[100vw] min-h-[100vh] object-cover pointer-events-none opacity-90 filter brightness-100 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020208]/90 via-[#020208]/20 to-transparent pointer-events-none"></div>
        </div>

        {/* HORIZONTAL COMPACT CENTERED LOGIN CONTAINER */}
        <div className="w-full max-w-2xl relative z-10 px-2">
          <div className="bg-slate-950/75 border border-white/15 backdrop-blur-md rounded-2xl p-5 shadow-2xl text-white">
            
            {/* Compact Header Title */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-base">
                  T
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    Tabby.ai Hub <Sparkles className="h-3 w-3 text-emerald-400" />
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium">Customer Service Performance Workspace</p>
                </div>
              </div>

              <div className="hidden sm:block text-[10px] text-slate-400">
                Official Portal
              </div>
            </div>

            {/* Horizontal Form Layout */}
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              {errorMessage && (
                <div className="p-2 bg-red-950/80 border border-red-500/50 text-red-300 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Email Field */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 text-[10px]">Email Address</label>
                  <Input
                    type="email"
                    placeholder="user@tabby.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-600 rounded-xl focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium px-3"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 text-[10px]">Passcode</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-xs bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-600 rounded-xl pr-9 font-medium px-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5 text-emerald-400" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions & Submit Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 h-3 w-3"
                    />
                    <span>Remember Session</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Key className="h-3 w-3" /> Forgot Password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 rounded-xl text-xs gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                >
                  <span>{isSubmitting ? 'Authenticating...' : 'Enter Dashboard'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* MODAL: FORGOT PASSWORD REQUEST POPUP */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <Card className="w-full max-w-md border-slate-800 bg-slate-900 text-slate-100 shadow-2xl rounded-2xl">
              <CardHeader className="border-b border-slate-800 pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2 text-emerald-400">
                    <HelpCircle className="h-5 w-5" /> Request Password Reset from Admin
                  </span>
                  <button onClick={() => setShowForgotModal(false)} className="p-1 hover:bg-slate-800 rounded">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Submit a request to Admin Support to reset your account credentials
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-xs">
                <form onSubmit={handleRaiseForgotPasswordRequest} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Your Tabby Email Address</label>
                    <Input
                      type="email"
                      placeholder="user@tabby.ai"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="h-10 text-xs bg-slate-950 border-slate-800 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-300">Additional Details / Notes (Optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g. Forgot password / temporary password expired"
                      value={forgotDetails}
                      onChange={(e) => setForgotDetails(e.target.value)}
                      className="h-10 text-xs bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  {forgotStatusMsg && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${forgotIsError ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
                      {forgotIsError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
                      <span>{forgotStatusMsg}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowForgotModal(false)} className="h-9 text-xs">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={forgotSubmitting} size="sm" className="h-9 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5">
                      <Send className="h-3.5 w-3.5" /> Raise Password Reset Request
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-md">
              T
            </div>
            <div>
              <div className="font-extrabold tracking-tight text-sm">Tabby.ai</div>
              <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
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
                      ? 'bg-emerald-500/10 text-emerald-400 border-l-4 border-emerald-500 shadow-xs'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower Left Profile Badge */}
        <div className="space-y-2 border-t border-white/10 pt-3">
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
            <div className="truncate">
              <div className="font-bold text-xs truncate text-emerald-400">{currentUser.user_email}</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
            </div>

            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-full text-xs font-bold text-emerald-400 hover:bg-emerald-500/10 bg-white/5 border border-emerald-500/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
            >
              <KeyRound className="h-3.5 w-3.5 text-emerald-400" />
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
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-400">
            <Clock className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
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
          <div className="p-5 bg-emerald-500/10 border-b border-emerald-500/30 text-xs space-y-3 animate-fade-in-up">
            <div className="font-bold flex items-center justify-between text-emerald-400">
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
              <Button type="submit" size="sm" className="h-8 bg-emerald-600 text-white text-xs gap-1 font-bold">
                <Check className="h-3.5 w-3.5" /> Save
              </Button>
            </form>
            {profileMsg && <p className="text-emerald-400 font-bold">{profileMsg}</p>}
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
