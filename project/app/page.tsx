'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  AlertCircle, LayoutDashboard, BarChart3, Users2, Database, ShieldCheck,
  MessageSquarePlus, Megaphone, LogOut, Clock, KeyRound, Check,
  Eye, EyeOff, ArrowRight, HelpCircle, X, Send, CheckCircle2,
  Snowflake, Calculator, MessageSquare, Mail, Menu, Search, Calendar, Zap, UserCheck
} from 'lucide-react';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { MetricsTab } from '@/components/tabs/metrics-tab';
import { TeamTab } from '@/components/tabs/team-tab';
import { MyPerformanceTab } from '@/components/tabs/my-performance-tab';
import { KnetCalculatorTab } from '@/components/tabs/knet-calculator-tab';
import { ChatMacrosTab } from '@/components/tabs/chat-macros-tab';
import { EmailTemplatesTab } from '@/components/tabs/email-templates-tab';
import { AdminSettingsTab } from '@/components/tabs/admin-settings-tab';
import { AgentDataTab } from '@/components/tabs/agent-data-tab';
import { RequestsTab } from '@/components/tabs/requests-tab';
import { AnnouncementsTab } from '@/components/tabs/announcements-tab';
import { ScheduleTab } from '@/components/tabs/schedule-tab';
import { DayNightToggle } from '@/components/day-night-toggle';
import { supabase, useMetrics } from '@/lib/metrics-context';

const IDLE_MS = 100000; // inactivity time before the dashboard "freezes"

// Fixed values (not Math.random) so server and client render the same markup
const AURORA_PARTICLES = [
  { left: '8%',  top: '78%', size: 3, dur: 16, delay: 0 },
  { left: '17%', top: '40%', size: 2, dur: 20, delay: 3 },
  { left: '26%', top: '88%', size: 3, dur: 18, delay: 6 },
  { left: '34%', top: '22%', size: 2, dur: 22, delay: 1 },
  { left: '43%', top: '70%', size: 2, dur: 17, delay: 9 },
  { left: '57%', top: '85%', size: 3, dur: 19, delay: 4 },
  { left: '66%', top: '30%', size: 2, dur: 21, delay: 7 },
  { left: '74%', top: '64%', size: 3, dur: 16, delay: 2 },
  { left: '83%', top: '82%', size: 2, dur: 23, delay: 10 },
  { left: '91%', top: '45%', size: 3, dur: 18, delay: 5 },
  { left: '12%', top: '58%', size: 2, dur: 24, delay: 12 },
  { left: '48%', top: '12%', size: 2, dur: 20, delay: 8 },
  { left: '95%', top: '18%', size: 2, dur: 22, delay: 11 },
  { left: '3%',  top: '20%', size: 3, dur: 19, delay: 13 },
];

// Guess whether this browser is software-rendered / low power (Citrix, VDI, old PCs)
function detectLowPower(): boolean {
  try {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as any).deviceMemory || 8;
    if (cores <= 2 || mem <= 2) return true;
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = ext ? String(gl.getParameter((ext as any).UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|software|basic render|citrix|vmware|svga|parallels|virtualbox/i.test(renderer);
  } catch {
    return true;
  }
}

// Clock lives in its own component so the per-second update does NOT re-render the whole dashboard
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' • ' +
        now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      );
    };
    tick();
    const id = setInterval(() => {
      if (!document.hidden) tick();
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time || 'Syncing live clock...'}</span>;
}

// Aurora waves + floating particles (shared by login page and dashboard)
// lite = plain static gradient (no blur, no animation)
function Aurora({ lite }: { lite?: boolean }) {
  if (lite) {
    return <div className="lg-aurora lg-aurora-static" aria-hidden="true" />;
  }
  return (
    <>
      <div className="lg-aurora" aria-hidden="true">
        <span className="lg-wave lg-wave-3" />
        <span className="lg-wave lg-wave-5" />
        <svg className="lg-ribbons" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="lgG1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#34d399" stopOpacity="0" />
              <stop offset="0.45" stopColor="#34d399" stopOpacity="0.5" />
              <stop offset="1" stopColor="#0f766e" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="lgG2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2dd4bf" stopOpacity="0.55" />
              <stop offset="0.6" stopColor="#0d9488" stopOpacity="0.32" />
              <stop offset="1" stopColor="#064e3b" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="lgG3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="1" stopColor="#065f46" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="lgB1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#1d4ed8" stopOpacity="0.38" />
              <stop offset="1" stopColor="#1e3a8a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className="lg-rb lg-rb-4">
            <path fill="url(#lgB1)" d="M-200 -60 C 300 200, 700 40, 1100 150 S 1500 60, 1800 -40 L1800 -200 L-200 -200 Z" />
          </g>
          <g className="lg-rb lg-rb-1">
            <path fill="url(#lgG1)" d="M-250 330 C 150 110, 480 440, 880 270 S 1400 30, 1850 170 L1850 360 C 1420 230, 1120 500, 760 540 S 190 400, -250 560 Z" />
          </g>
          <g className="lg-rb lg-rb-2">
            <path fill="url(#lgG2)" d="M560 980 C 780 650, 1080 720, 1290 530 S 1660 290, 1850 350 L1850 980 Z" />
          </g>
          <g className="lg-rb lg-rb-3">
            <path fill="url(#lgG3)" d="M-250 780 C 80 600, 400 840, 800 710 S 1200 580, 1550 720 L1550 980 L-250 980 Z" />
          </g>
        </svg>
      </div>
      {AURORA_PARTICLES.map((p, i) => (
        <span
          key={i}
          className="lg-dot"
          aria-hidden="true"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </>
  );
}

export default function Home() {
  const { currentUser, setCurrentUser, refreshMetrics } = useMetrics() as any;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [liteMode, setLiteMode] = useState(false); // performance mode for Citrix / weak PCs

  // Sidebar Expanding Rail State (Desktop & Touch)
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Pending Requests Badge Counter
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);

  // Login button / success states
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showWelcomeMsg, setShowWelcomeMsg] = useState(false);
  const [shake, setShake] = useState(false);

  // Mobile Menu Drawer State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Tab Flip Transition State
  const [isFlipping, setIsFlipping] = useState(false);

  // Snow & Freeze Inactivity Timer State
  const [showSnow, setShowSnow] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [iceShattered, setIceShattered] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef(0);

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

  // Web Audio (welcome chime)
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

  // Dynamic Pending Requests Counter from Supabase
  useEffect(() => {
    async function fetchPendingCount() {
      try {
        const { count, error } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending');

        if (!error && count !== null) {
          setPendingRequestsCount(count);
        }
      } catch (err) {
        console.error('Error fetching pending requests count:', err);
      }
    }

    if (currentUser) {
      fetchPendingCount();
      const interval = setInterval(() => {
        if (!document.hidden) fetchPendingCount();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Lite mode: saved choice wins, otherwise auto-detect weak/software rendering
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem('tabby-lite'); } catch {}
    setLiteMode(saved !== null ? saved === '1' : detectLowPower());
  }, []);

  const toggleLite = () => {
    setLiteMode((v) => {
      const next = !v;
      try { localStorage.setItem('tabby-lite', next ? '1' : '0'); } catch {}
      return next;
    });
  };

  // Pointer Move Event for subtle 3D tilt of the login card
  const handlePointerMove = (e: React.PointerEvent) => {
    if (liteMode || !stageRef.current || !cardRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    cardRef.current.style.setProperty('--ry', `${(nx - 0.5) * 8}deg`);
    cardRef.current.style.setProperty('--rx', `${(0.5 - ny) * 5}deg`);
  };

  const handlePointerLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rx', '0deg');
    cardRef.current.style.setProperty('--ry', '0deg');
  };

  // Idle Timer for Freezing
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
    }, IDLE_MS);
  };

  useEffect(() => {
    // mousemove fires hundreds of times a second - only react once per second (or instantly when frozen)
    const handleActivity = () => {
      const now = Date.now();
      if (!isFrozen && now - lastActivityRef.current < 1000) return;
      lastActivityRef.current = now;
      resetIdleTimer();
    };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Login Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (loginBusy) return;

    // Unlock audio inside the click gesture (browsers block it after an await)
    getAudioCtx();

    const cleanEmail = email.trim().toLowerCase();

    let userToSet: any = null;

    if (cleanEmail === 'omar.allaa@tabby.ai' && (password === 'Boyka@1322' || password === '123')) {
      userToSet = {
        user_email: cleanEmail,
        username: 'omar.allaa',
        role: 'Admin' as const,
        team_name: 'Support Tier 1',
        floor_name: 'Floor 1',
        account_status: 'Active' as const,
        allowed_tabs: ['overview', 'metrics', 'team', 'my-performance', 'schedule', 'knet-calc', 'chat-macros', 'email-templates', 'requests', 'announcements', 'agent-data', 'admin'],
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
      setErrorMessage('Invalid email or password!');
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    // Success: button turns into "Welcome back ✓" with pulsing rings
    setLoginBusy(true);
    setLoginSuccess(true);
    setShowWelcomeMsg(true);
    welcomeChime();

    setTimeout(() => {
      setCurrentUser(userToSet);
      if (typeof refreshMetrics === 'function') refreshMetrics(userToSet);
    }, 1500);
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

    const { error } = await supabase
      .from('user_profiles')
      .update({ password_hash: newPassword, is_temporary_password: false })
      .eq('user_email', currentUser.user_email);

    if (error) {
      setProfileMsg(`Could not update password: ${error.message}`);
    } else {
      setProfileMsg('✓ Password updated successfully!');
      setNewPassword('');
    }
    setTimeout(() => setProfileMsg(''), 3000);
  };

  // ============================================================
  // LOGIN PAGE – aurora background + glass card
  // ============================================================
  if (!currentUser) {
    return (
      <div className={`lg-root font-sans ${liteMode ? 'lite' : ''}`}>
        <Aurora lite={liteMode} />

        <div
          ref={stageRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="lg-stage"
        >
          <div ref={cardRef} className={`lg-card ${shake ? 'lg-shake' : ''}`}>
            <div className="lg-sweep-clip" aria-hidden="true" />

            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-400 flex items-center justify-center font-semibold text-slate-900 text-base">
                  T
                </div>
                <div>
                  <h1 className="text-[13px] font-semibold text-white leading-tight">Tabby - Gabrino Team</h1>
                  <p className="text-[11px] text-slate-400 mt-0.5">Customer Service Performance Workspace</p>
                </div>
              </div>
              <div className="hidden sm:block text-[10px] text-slate-300/80">Official Portal</div>
            </div>

            <form onSubmit={handleLogin} className="relative space-y-4 text-xs">
              {errorMessage && (
                <div
                  role="alert"
                  className="p-2 bg-red-950/70 border border-red-500/40 text-red-300 rounded-lg text-[11px] font-medium flex items-center gap-2"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-[12px] text-slate-200">Email Address</label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="user@tabby.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginBusy}
                  className="h-10 text-[13px] bg-slate-950/45 border-white/10 text-white placeholder:text-slate-500 rounded-lg px-3 focus-visible:border-emerald-400/70 focus-visible:ring-1 focus-visible:ring-emerald-400/60"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-[12px] text-slate-200">Passcode</label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginBusy}
                    className="h-10 text-[13px] bg-slate-950/45 border-white/10 text-white placeholder:text-slate-500 rounded-lg pl-3 pr-10 focus-visible:border-emerald-400/70 focus-visible:ring-1 focus-visible:ring-emerald-400/60"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide passcode' : 'Show passcode'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors"
                  >
                    {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-4 text-[12px] text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="lg-check"
                    />
                    <span>Remember Session</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-slate-400 hover:text-emerald-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loginBusy}
                  className={`lg-btn self-end sm:self-auto ${loginSuccess ? 'is-success' : ''}`}
                >
                  <span className="lg-ring" aria-hidden="true" />
                  <span className="lg-ring lg-ring-2" aria-hidden="true" />
                  <span className="lg-btn-label">
                    Enter Dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="lg-btn-done" aria-live="polite">
                    Welcome back
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 12.5 L9.5 18 L20 6" />
                    </svg>
                  </span>
                </button>
              </div>
            </form>

            <div className={`lg-status ${showWelcomeMsg ? 'show' : ''}`}>
              Session started · loading workspace…
            </div>
          </div>
        </div>

        {/* Performance mode switch */}
        <button
          type="button"
          onClick={toggleLite}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-emerald-300 transition-colors"
          title="Turn on if the page feels slow (Citrix / remote desktop)"
        >
          <Zap className="h-3.5 w-3.5" /> Lite mode: {liteMode ? 'On' : 'Off'}
        </button>

        {/* FORGOT PASSWORD MODAL */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
            <Card className="w-full max-w-md border-white/10 bg-slate-900/90 text-slate-100 shadow-2xl rounded-2xl backdrop-blur-xl">
              <CardHeader className="border-b border-white/10 pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2 text-emerald-400">
                    <HelpCircle className="h-5 w-5" /> Request Password Reset from Admin
                  </span>
                  <button onClick={() => setShowForgotModal(false)} className="p-1 hover:bg-slate-800 rounded" aria-label="Close">
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

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
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

  // ============================================================
  // DASHBOARD
  // ============================================================
  const allowedTabs: string[] = currentUser.allowed_tabs || ['overview', 'metrics', 'team', 'my-performance', 'schedule', 'knet-calc', 'chat-macros', 'email-templates', 'requests', 'announcements', 'agent-data', 'admin'];
  const isTabAllowed = (tabKey: string) => allowedTabs.includes(tabKey) || currentUser.role === 'Admin';

  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'metrics', label: 'Performance Analytics', icon: BarChart3 },
    { key: 'team', label: 'Team & Floor Insights', icon: Users2 },
    { key: 'my-performance', label: 'My Performance', icon: UserCheck },
    { key: 'schedule', label: 'Schedule Roster', icon: Calendar },
    { key: 'knet-calc', label: 'KNET Calculator', icon: Calculator },
    { key: 'chat-macros', label: 'Chat Macros', icon: MessageSquare },
    { key: 'email-templates', label: 'Email Escalations', icon: Mail },
    { key: 'requests', label: 'Requests', icon: MessageSquarePlus, badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined },
    { key: 'announcements', label: 'Announcements', icon: Megaphone },
    { key: 'agent-data', label: 'Data & Backups', icon: Database },
    { key: 'admin', label: 'Admin Settings', icon: ShieldCheck },
  ];

  const filteredNavItems = navItems.filter((item) =>
    searchQuery.trim() === ''
      ? true
      : item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const snowflakes = [
    { left: '10%', size: 'h-4 w-4', color: 'text-cyan-200', delay: '0s' },
    { left: '25%', size: 'h-3 w-3', color: 'text-cyan-100', delay: '1.5s' },
    { left: '50%', size: 'h-5 w-5', color: 'text-sky-200', delay: '0.6s' },
    { left: '75%', size: 'h-4 w-4', color: 'text-cyan-300', delay: '2.4s' },
    { left: '90%', size: 'h-3 w-3', color: 'text-cyan-100', delay: '1s' },
  ];

  return (
    <div className={`${isDarkMode ? 'dark' : ''} ${liteMode ? 'lite' : ''}`}>
      <div className="min-h-screen flex flex-col md:flex-row font-sans relative overflow-hidden transition-colors duration-300 bg-slate-50 dark:bg-[#020208] text-slate-900 dark:text-slate-100">

        {/* BACKGROUND: aurora in dark mode, soft pastel in light mode */}
        {isDarkMode ? (
          <div className="dash-aurora"><Aurora lite={liteMode} /></div>
        ) : (
          <div className="dash-light-bg" aria-hidden="true" />
        )}

        {/* SNOW ACCENT ON INACTIVITY */}
        {showSnow && isDarkMode && !liteMode && (
          <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden opacity-50 animate-in fade-in">
            {snowflakes.map((s, i) => (
              <div
                key={i}
                className={`lg-snowflake ${s.color}`}
                style={{ left: s.left, animationDelay: s.delay }}
              >
                <Snowflake className={s.size} />
              </div>
            ))}
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
                <p className="text-xs text-sky-300/80 mt-1 font-medium">Inactive for over {Math.round(IDLE_MS / 1000)} seconds</p>
              </div>
              <div className="pt-2 text-[11px] font-bold text-cyan-300 uppercase tracking-widest bg-cyan-950/60 border border-cyan-400/30 rounded-full py-1.5 px-4 inline-block">
                ❄️ Move mouse to break ice
              </div>
            </div>
          </div>
        )}

        {/* EXPANDING RAIL SIDEBAR NAVIGATION (DESKTOP) */}
        <aside
          className={`hidden md:flex sidebar-rail flex-col justify-between shrink-0 p-4 border-r border-slate-200 dark:border-slate-800 backdrop-blur-xl z-20 bg-white/90 dark:bg-[#101a30]/90 shadow-2xl ${
            sidebarExpanded ? 'expanded' : ''
          }`}
        >
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            {/* Profile Row with Password Change Trigger */}
            <div
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800 cursor-pointer select-none"
            >
              <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-extrabold text-sm shadow-md">
                T
              </div>
              <div className="rail-details min-w-0 flex-1">
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">Tabby Gabrino</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{currentUser.role}</p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfile(!showProfile);
                }}
                className="rail-details p-1.5 hover:bg-emerald-500/10 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                title="Change Password"
              >
                <KeyRound className="h-4 w-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="rail-search relative flex items-center h-10 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-[#182238]/60">
              <Input
                type="text"
                placeholder="Search dashboard"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rail-search-input absolute inset-0 w-full h-full bg-transparent border-0 text-xs px-3 pr-9 placeholder:text-slate-500 focus-visible:ring-0 text-slate-900 dark:text-slate-100"
              />
              <Search className="h-4 w-4 text-slate-400 absolute right-3 pointer-events-none shrink-0" />
            </div>

            {/* Navigation Items with Expand Labels & Badges */}
            <nav className="space-y-1 text-xs font-medium flex-1 overflow-y-hidden">
              {filteredNavItems.map((item) => {
                if (!isTabAllowed(item.key)) return null;
                const Icon = item.icon;
                const isActive = activeTab === item.key;

                return (
                  <button
                    key={item.key}
                    onClick={() => handleTabChange(item.key)}
                    className={`relative w-full flex items-center gap-3.5 h-10 px-2.5 font-semibold rounded-xl transition-all duration-200 icon-reflection-container ${
                      isActive
                        ? 'icon-reflection-selected bg-emerald-500/15 text-emerald-400 border-l-4 border-emerald-500'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                    <span className="rail-label truncate text-xs">{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="absolute right-2 bg-emerald-500 text-slate-950 text-[10px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center animate-pulse">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions: Log Out */}
          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <button
              onClick={() => setCurrentUser(null)}
              className="w-full flex items-center gap-3.5 h-10 px-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span className="rail-action-text">Log Out</span>
            </button>
          </div>
        </aside>

        {/* MOBILE SLIDE-OUT MENU DRAWER */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
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
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowProfile(true);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10 rounded-lg"
                >
                  <KeyRound className="h-4 w-4" /> Change Password
                </button>
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

          {/* HEADER BAR WITH DAY/NIGHT TOGGLE */}
          <header className="h-16 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between backdrop-blur-md shrink-0 bg-white/80 dark:bg-[#080E1E]/80">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3.5 w-3.5 text-emerald-500" />
                <LiveClock />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLite}
                title="Turn on if the dashboard feels slow (Citrix / remote desktop)"
                className="h-8 text-xs gap-1.5 border-slate-500/40 text-slate-500 dark:text-slate-300 hover:bg-slate-500/10 font-bold rounded-lg"
              >
                <Zap className="h-3.5 w-3.5" /> Lite: {liteMode ? 'On' : 'Off'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfile(!showProfile)}
                className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold rounded-lg"
              >
                <KeyRound className="h-3.5 w-3.5" /> Change Password
              </Button>

              {/* Animated Day-Night Toggle Switch */}
              <DayNightToggle
                isDarkMode={isDarkMode}
                onToggle={() => setIsDarkMode(!isDarkMode)}
              />
            </div>
          </header>

          {/* PASSWORD UPDATE DRAWER */}
          {showProfile && (
            <div className="p-4 md:p-5 bg-emerald-500/10 border-b border-emerald-500/30 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
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
            {activeTab === 'my-performance' && isTabAllowed('my-performance') && <MyPerformanceTab />}
            {activeTab === 'schedule' && isTabAllowed('schedule') && <ScheduleTab />}
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
