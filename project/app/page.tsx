'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { OverviewTab } from '@/components/tabs/overview-tab';
import { MetricsTab } from '@/components/tabs/metrics-tab';
import { TeamTab } from '@/components/tabs/team-tab';
import { AdminSettingsTab } from '@/components/tabs/admin-settings-tab';
import { useMetrics } from '@/lib/metrics-context';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const context = useMetrics() as any;
  const allowedUsers = context?.allowedUsers || [
    { email: 'omar.allaa@tabby.ai', role: 'Admin' },
    { email: 'admin@tabby.ai', role: 'Admin' }
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    const isAuthorizedEmail = allowedUsers.some(
      (u: any) => u.email.toLowerCase() === cleanEmail
    ) || cleanEmail.endsWith('@tabby.ai');

    // Accepts your password 'Boyka@1322' or 'admin' or any valid domain login
    if (isAuthorizedEmail && (password === 'Boyka@1322' || password.length >= 4)) {
      setIsAuthenticated(true);
    } else {
      setErrorMessage("😼 Not so fast, human! That login didn't quite match. Check your credentials and try again.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg border-gray-200">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl">
              T
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Welcome to Tabby.ai</CardTitle>
            <CardDescription>Enter your credentials to access the operational dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-md text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="omar.allaa@tabby.ai"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white gap-2 mt-2">
                Sign In to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xl">
            T
          </div>
          <div>
            <div className="font-bold text-gray-900">Tabby.ai</div>
            <div className="text-xs text-muted-foreground">Performance Hub</div>
          </div>
        </div>

        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'overview' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'metrics' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Metrics Sheet
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'team' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Team & Floor
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md ${
              activeTab === 'admin' ? 'bg-emerald-600 text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Admin Settings
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'metrics' && <MetricsTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'admin' && <AdminSettingsTab />}
      </div>
    </div>
  );
}
