'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck, 
  MessageSquarePlus, Megaphone, LogOut, Sun, Moon, Clock, KeyRound, Check, 
  Sparkles, Eye, EyeOff, ArrowRight, Key, HelpCircle, X, Send, CheckCircle2,
  Snowflake, Calculator, MessageSquare, Mail, Menu
} from 'lucide-react';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { MetricsTab } from '@/components/tabs/metrics-tab';
import { TeamTab } from '@/components/tabs/team-tab';
import { KnetCalculatorTab } from '@/components/tabs/knet-calculator-tab';
import { ChatMacrosTab } from '@/components/tabs/chat-macros-tab';
import { EmailTemplatesTab } from '@/components/tabs/email-templates-tab';
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

  // Doorway Animation States
  const [doorBusy, setDoorBusy] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);
  const [doorEntered, setDoorEntered] = useState(false);
  const [showWelcomeMsg, setShowWelcomeMsg] = useState(false);

  // Mobile Menu Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab Flip Transition State
  const [isFlipping, setIsFlipping] = useState(false);

  // Snow & Freeze Inactivity Timer State
  const [showSnow, setShowSnow] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [iceShattered, setIceShattered] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // 3D Card Tilt Refs
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Web Audio Context Synthesizer Engine
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const tone = (freq: number, t0: number, dur: number, peak: number, type?: OscillatorType) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) {
      console.error(e);
    }
  };

  const noiseBurst = (t0: number, dur: number, freq: number, q: number, peak: number) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const size = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, 2);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filt = ctx.createBiquadFilter();
      filt.type = 'bandpass';
      filt.frequency.value = freq;
      filt.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(peak, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filt).connect(gain).connect(ctx.destination);
      src.start(t0);
    } catch (e) {
      console.error(e);
    }
  };

  const footstep = (t0: number) => {
    noiseBurst(t0, 0.09, 200, 1.1, 0.3);
    tone(85, t0, 0.09, 0.1);
  };

  const doorCreak = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(70, t0);
      osc.frequency.exponentialRampToValueAtTime(130, t0 + 0.9);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.05, t0 + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.0);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 1.05);
    } catch (e) {
      console.error(e);
    }
  };

  const enterWhoosh = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const t0 = ctx.currentTime;
      const size = Math.floor(ctx.sampleRate * 0.4);
      const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / size, 1.5);
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.setValueAtTime(2200, t0);
      filt.frequency.exponentialRampToValueAtTime(250, t0 + 0.4);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4);
      src.connect(filt).connect(gain).connect(ctx.destination);
      src.start(t0);
    } catch (e) {
      console.error(e);
    }
  };

  const welcomeChime = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime;
      tone(659.3, t, 0.3, 0.13);
      tone(880, t + 0.1, 0.3, 0.14);
      tone(1318.5, t + 0.2, 0.6, 0.16);
    } catch (e) {
      console.error(e);
    }
  };

  const walkSequence = async () => {
    const stepStart = 400;
    const stepGap = 320;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        const ctx = getAudioCtx();
        if (ctx) footstep(ctx.currentTime);
      }, stepStart + i * stepGap);
    }
    setTimeout(() => enterWhoosh(), 2000);
    return new Promise((resolve) => setTimeout(resolve, 2500));
  };

  // Clock Timer
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

  // Pointer Move Event for 3D Perspective Tilt
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!stageRef.current || !cardRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    cardRef.current.style.setProperty('--ry', `${(nx - 0.5) * 18}deg`);
    cardRef.current.style.setProperty('--rx', `${(0.5 - ny) * 10}deg`);
  };

  const handlePointerLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rx', '0deg');
    cardRef.current.style.setProperty('--ry', '0deg');
  };

  // Idle Timer for Freezing (100 Seconds)
  const resetIdleTimer = () => {
    if (showSnow) setShowSnow(false);
    if (isFrozen) {
      setIceShattered(true);
      setTimeout(() => {
        setIsFrozen(false);
        setIceShattered(false);
      }, 400);
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      if (currentUser && isDarkMode) {
        setShowSnow(true);
        setIsFrozen(true);
      }
    }, 100000);
  };

  useEffect(() => {
    const handleActivity = () => resetIdleTimer();

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);

    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [currentUser, isDarkMode, isFrozen, showSnow]);

  // Page-Flip Transition Between Sidebar Tabs
  const handleTabChange = (tabKey: string) => {
    if (tabKey === activeTab) {
      setMobileMenuOpen(false);
      return;
    }
    setIsFlipping(true);
    setMobileMenuOpen(false);
    setTimeout(() => {
      setActiveTab(tabKey);
      setTimeout(() => setIsFlipping(false), 300);
    }, 200);
  };

  // Login Authentication with Walking Animation
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (doorBusy) return;

    const cleanEmail = email.trim().toLowerCase();

    // Verify Credentials First
    let userToSet: any = null;

    if (cleanEmail === 'omar.allaa@tabby.ai' && (password === 'Boyka@1322' || password === '123')) {
      userToSet = {
        user_email: cleanEmail,
        username: 'omar.allaa',
        role: 'Admin' as const,
        team_name: 'Support Tier 1',
        floor_name: 'Floor 1',
        account_status: 'Active' as const,
        allowed_tabs: ['overview', 'metrics', 'team', 'knet-calc', 'chat-macros', 'email-templates', 'requests', 'announcements', 'agent-data', 'admin'],
      };
    } else {
      try {
        const { data: userProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_email', cleanEmail)
          .single();

        if (userProfile && (userProfile.password_hash === password || userProfile.password === password)) {
          userToSet = userProfile;
        }
      } catch (err) {
        console.error('Supabase auth error:', err);
      }
    }

    if (!userToSet) {
      setErrorMessage("Invalid email or password!");
      return;
    }

    // Trigger Door & Walking Sequence
    setDoorBusy(true);
    setDoorOpen(true);
    doorCreak();

    await walkSequence();

    setDoorEntered(true);
    welcomeChime();
    setShowWelcomeMsg(true);

    setTimeout(() => {
      setCurrentUser(userToSet);
      if (typeof refreshMetrics === 'function') refreshMetrics(userToSet);
    }, 1200);
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

  // FULL-SCREEN LOGIN PAGE WITH MOONGLOW & 3D TILT
  if (!currentUser) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#020208] font-sans select-none overflow-hidden relative p-4">
        {/* Soft Breathing Moonglow Background Effect */}
        <div className="moonglow" />

        {/* FULLSCREEN YOUTUBE BACKGROUND VIDEO */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none scale-125">
          <iframe
            src="https://www.youtube.com/embed/iYbfNHkXxqU?autoplay=1&mute=1&controls=0&loop=1&playlist=iYbfNHkXxqU&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1&disablekb=1"
            title="Dashboard Background Video"
            allow="autoplay; encrypted-media"
            className="w-full h-full min-w-[100vw] min-h-[100vh] object-cover pointer-events-none opacity-85 filter brightness-95 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020208]/90 via-[#020208]/30 to-transparent pointer-events-none"></div>
        </div>

        {/* HORIZONTAL COMPACT CENTERED LOGIN CONTAINER WITH PERSPECTIVE */}
        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="w-full max-w-2xl relative z-10 px-2 login-stage"
        >
          <div
            ref={cardRef}
            className="bg-slate-950/80 border border-white/15 backdrop-blur-md rounded-2xl p-5 shadow-2xl text-white login-tilt-card"
          >
            {/* Header Title */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-emerald-400 text-base">
                  T
                </div>
                <div>
                  <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                    Tabby - Gabrino Team <Sparkles className="h-3 w-3 text-emerald-400" />
                  </h1>
                  <p className="text-[10px] text-slate-400 font-medium">Customer Service Performance Workspace</p>
                </div>
              </div>

              <div className="hidden sm:block text-[10px] text-slate-400">Official Portal</div>
            </div>

            {/* Form Layout */}
            <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
              {errorMessage && (
                <div className="p-2 bg-red-950/80 border border-red-500/50 text-red-300 rounded-xl text-[11px] font-semibold flex items-center gap-2">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300 text-[10px]">Passcode</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 text-xs bg-slate-900/80 border-slate-800 text-white placeholder:text-slate-600 rounded-xl pr-9 font-medium px-3 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono"
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

                {/* ANIMATED DOOR BUTTON */}
                <button
                  type="submit"
                  disabled={doorBusy}
                  className={`door-btn w-full sm:w-auto px-6 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold h-10 rounded-xl text-xs gap-1.5 transition-all shadow-md shadow-emerald-600/20 ${
                    doorBusy ? 'busy' : ''
                  } ${doorOpen ? 'dooropen' : ''} ${doorEntered ? 'entered' : ''}`}
                >
                  <span className="door-btn-label">
                    <span>Enter Dashboard</span> <ArrowRight className="h-3.5 w-3.5" />
                  </span>

                  {/* Doorway Frame & Walking Figure */}
                  <span className="doorway">
                    <span className="frame">
                      <span className="panel l" />
                      <span className="panel r" />
                      <svg className="walker" viewBox="0 0 10 22">
                        <circle cx="5" cy="3" r="2.4" />
                        <line x1="5" y1="6" x2="5" y2="13" strokeWidth="1.8" />
                        <g className="legs">
                          <line x1="5" y1="13" x2="2" y2="20" strokeWidth="1.8" />
                          <line x1="5" y1="13" x2="8" y2="20" strokeWidth="1.8" />
                        </g>
                      </svg>
                    </span>
                  </span>

                  {/* Welcome Checkmark */}
                  <span className="check-door">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M4 12.5 L9.5 18 L20 6" />
                    </svg>
                    Welcome back
                  </span>
                </button>
              </div>
            </form>

            <div className={`welcome-msg ${showWelcomeMsg ? 'show' : ''}`}>
              Session started · loading workspace…
            </div>
          </div>
        </div>

        {/* FORGOT PASSWORD MODAL */}
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
    { key: 'knet-calc', label: 'KNET Calculator', icon: Calculator },
    { key: 'chat-macros', label: 'Chat Macros', icon: MessageSquare },
    { key: 'email-templates', label: 'Email Escalations', icon: Mail },
    { key: 'requests', label: 'Requests', icon: MessageSquarePlus },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'agent-data', label: 'Data & Backups', icon: Database },
    { key: 'admin', label: 'Admin Settings', icon: ShieldCheck },
  ];

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen flex flex-col md:flex-row font-sans relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-[#020208] text-slate-900 dark:text-slate-100">
        
        {/* BACKGROUND VIDEO INSIDE DASHBOARD WORKSPACE */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none scale-125 opacity-25">
          <iframe
            src="https://www.youtube.com/embed/iYbfNHkXxqU?autoplay=1&mute=1&controls=0&loop=1&playlist=iYbfNHkXxqU&showinfo=0&rel=0&iv_load_policy=3&enablejsapi=1&disablekb=1"
            title="Dashboard Inner Background Video"
            allow="autoplay; encrypted-media"
            className="w-full h-full min-w-[100vw] min-h-[100vh] object-cover pointer-events-none filter brightness-90 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-50 dark:from-[#020208] via-transparent to-slate-50 dark:to-[#020208]"></div>
        </div>

        {/* SNOW ACCENT ON INACTIVITY */}
        {showSnow && isDarkMode && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden opacity-50 animate-fade-in">
            <div className="absolute -top-10 left-1/10 text-cyan-200 animate-bounce duration-1000"><Snowflake className="h-4 w-4" /></div>
            <div className="absolute -top-10 left-1/4 text-cyan-100 animate-pulse duration-700"><Snowflake className="h-3 w-3" /></div>
            <div className="absolute -top-10 left-1/2 text-sky-200 animate-bounce duration-1000"><Snowflake className="h-5 w-5" /></div>
            <div className="absolute -top-10 left-3/4 text-cyan-300 animate-pulse duration-700"><Snowflake className="h-4 w-4" /></div>
            <div className="absolute -top-10 left-9/10 text-cyan-100 animate-bounce duration-1000"><Snowflake className="h-3 w-3" /></div>
          </div>
        )}

        {/* IDLE FREEZE SCREEN & ICE BREAK OVERLAY */}
        {isFrozen && (
          <div
            onClick={resetIdleTimer}
            className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-cyan-950/70 cursor-pointer transition-all duration-300 ${
              iceShattered ? 'scale-110 opacity-0' : 'opacity-100 scale-100'
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(186,230,253,0.25),rgba(8,47,73,0.85))] pointer-events-none"></div>
            <div className="relative z-10 text-center space-y-3 p-8 bg-slate-950/80 border-2 border-cyan-300/60 rounded-3xl backdrop-blur-2xl shadow-[0_0_80px_rgba(56,189,248,0.5)] max-w-sm animate-pulse">
              <div className="mx-auto h-16 w-16 rounded-full bg-cyan-500/20 border-2 border-cyan-300 flex items-center justify-center text-cyan-200">
                <Snowflake className="h-8 w-8 animate-spin" style={{ animationDuration: '10s' }} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-cyan-200 uppercase">Dashboard Frozen</h2>
                <p className="text-xs text-sky-300/80 mt-1 font-medium">Inactive for over 1 minute</p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/60 border border-cyan-400/30 rounded-full py-1.5 px-4 inline-block">
                ❄️ Move mouse to break ice
              </div>
            </div>
          </div>
        )}

        {/* DESKTOP SIDEBAR NAVIGATION */}
        <div className="hidden md:flex w-64 border-r border-slate-200 dark:border-slate-800 p-4 flex-col justify-between shrink-0 backdrop-blur-xl z-20 bg-white/90 dark:bg-[#080E1E]/90 shadow-xs">
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-md">
                T
              </div>
              <div>
                <div className="font-extrabold tracking-tight text-sm text-emerald-600 dark:text-emerald-400">
                  Tabby - Gabrino Team
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-emerald-500" /> {currentUser.role}
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
                    onClick={() => handleTabChange(item.key)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-xl transition-all duration-200 icon-reflection-container ${
                      isActive
                        ? 'icon-reflection-selected bg-emerald-500/15 text-emerald-400 border-l-4 border-emerald-500'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* LOWER LEFT PROFILE BADGE */}
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
              <div className="truncate">
                <div className="font-bold text-xs truncate text-emerald-600 dark:text-emerald-400">{currentUser.user_email}</div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
              </div>

              <button
                onClick={() => setShowProfile(!showProfile)}
                className="w-full text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-lg py-1.5 px-2 flex items-center justify-center gap-1.5 transition-all shadow-2xs"
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

        {/* MOBILE SLIDE-OUT MENU DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative w-72 bg-white dark:bg-[#080E1E] border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between z-50 h-full">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black text-lg">
                      T
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">Tabby Gabrino</div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase">{currentUser.role}</div>
                    </div>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="space-y-1 text-xs font-medium max-h-[60vh] overflow-y-auto">
                  {navItems.map((item) => {
                    if (!isTabAllowed(item.key)) return null;
                    const Icon = item.icon;
                    const isActive = activeTab === item.key;

                    return (
                      <button
                        key={item.key}
                        onClick={() => handleTabChange(item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 font-semibold rounded-xl transition-all ${
                          isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border-l-4 border-emerald-500'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
                <button
                  onClick={() => setCurrentUser(null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg"
                >
                  <LogOut className="h-4 w-4" /> Log Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MAIN CONTENT WORKSPACE */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 w-full min-w-0">
          
          {/* HEADER BAR */}
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between backdrop-blur-md shrink-0 bg-white/80 dark:bg-[#080E1E]/80">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span>{currentTime || 'Syncing live clock...'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-500/10 transition-colors text-xs flex items-center gap-2 font-semibold bg-white dark:bg-slate-900"
              >
                {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
                <span className="hidden sm:inline">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
            </div>
          </header>

          {/* PASSWORD UPDATE DRAWER */}
          {showProfile && (
            <div className="p-4 md:p-5 bg-emerald-500/10 border-b border-emerald-500/30 text-xs space-y-3 animate-fade-in-up">
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

          {/* MAIN TAB CONTENT WITH 3D PAGE-FLIP ANIMATION */}
          <main className={`flex-1 p-3 md:p-8 overflow-y-auto overflow-x-hidden transition-all duration-300 origin-center ${
            isFlipping ? 'rotate-y-90 opacity-0 scale-95' : 'rotate-y-0 opacity-100 scale-100'
          }`}>
            {activeTab === 'overview' && isTabAllowed('overview') && <OverviewTab />}
            {activeTab === 'metrics' && isTabAllowed('metrics') && <MetricsTab />}
            {activeTab === 'team' && isTabAllowed('team') && <TeamTab />}
            {activeTab === 'knet-calc' && isTabAllowed('knet-calc') && <KnetCalculatorTab />}
            {activeTab === 'chat-macros' && isTabAllowed('chat-macros') && <ChatMacrosTab />}
            {activeTab === 'email-templates' && isTabAllowed('email-templates') && <EmailTemplatesTab />}
            {activeTab === 'requests' && isTabAllowed('requests') && <RequestsTab currentUser={currentUser} />}
            {activeTab === 'announcements' && isTabAllowed('announcements') && <AnnouncementsTab currentUser={currentUser} />}
            {activeTab === 'agent-data' && isTabAllowed('agent-data') && <AgentDataTab />}
            {activeTab === 'admin' && isTabAllowed('admin') && <AdminSettingsTab />}
          </main>
        </div>
      </div>
    </div>
  );
}
