'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { 
  ShieldCheck, Users, Key, Trash2, Check, RefreshCw, AlertCircle, 
  CheckCircle2, LayoutDashboard, BarChart3, Calculator, MessageSquare, 
  Mail, MessageSquarePlus, Megaphone, Database, Sliders, ChevronDown
} from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';

const ALL_SYSTEM_TABS = [
  { key: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
  { key: 'metrics', label: 'Performance Analytics', icon: BarChart3 },
  { key: 'team', label: 'Team & Floor Insights', icon: Users },
  { key: 'knet-calc', label: 'KNET Calculator', icon: Calculator },
  { key: 'chat-macros', label: 'Chat Macros', icon: MessageSquare },
  { key: 'email-templates', label: 'Email Escalations', icon: Mail },
  { key: 'requests', label: 'Requests', icon: MessageSquarePlus },
  { key: 'announcements', label: 'Announcements', icon: Megaphone },
  { key: 'agent-data', label: 'Data & Backups', icon: Database },
  { key: 'admin', label: 'Admin Settings', icon: ShieldCheck },
];

export function AdminSettingsTab() {
  const { refreshMetrics } = useMetrics() as any;
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // New Account Creation State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'Admin' | 'Team Leader' | 'Agent'>('Agent');
  const [newTeam, setNewRoleTeam] = useState('Support Tier 1');
  const [newFloor, setNewRoleFloor] = useState('Floor 1');

  const fetchUserProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    setLoading(false);

    if (!error && data) {
      setUsers(data);
      if (!selectedUserEmail && data.length > 0) {
        setSelectedUserEmail(data[0].user_email);
      }
    }
  };

  useEffect(() => {
    fetchUserProfiles();
  }, []);

  const selectedUser = users.find((u) => u.user_email === selectedUserEmail);

  // Toggle Tab Permission
  const handleToggleTabPermission = async (tabKey: string) => {
    if (!selectedUser) return;

    const currentAllowed: string[] = selectedUser.allowed_tabs || [];
    let updatedTabs: string[];

    if (currentAllowed.includes(tabKey)) {
      updatedTabs = currentAllowed.filter((k) => k !== tabKey);
    } else {
      updatedTabs = [...currentAllowed, tabKey];
    }

    // Optimistic UI Update
    setUsers(
      users.map((u) => (u.user_email === selectedUserEmail ? { ...u, allowed_tabs: updatedTabs } : u))
    );

    const { error } = await supabase
      .from('user_profiles')
      .update({ allowed_tabs: updatedTabs })
      .eq('user_email', selectedUserEmail);

    if (error) {
      setIsError(true);
      setStatusMsg(`Failed to update permissions: ${error.message}`);
      fetchUserProfiles(); // Revert
    } else {
      setIsError(false);
      setStatusMsg(`✓ Updated access permissions for ${selectedUserEmail}`);
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  // Toggle Select All / Unselect All
  const handleToggleAllTabs = async (selectAll: boolean) => {
    if (!selectedUser) return;

    const updatedTabs = selectAll ? ALL_SYSTEM_TABS.map((t) => t.key) : [];

    setUsers(
      users.map((u) => (u.user_email === selectedUserEmail ? { ...u, allowed_tabs: updatedTabs } : u))
    );

    await supabase.from('user_profiles').update({ allowed_tabs: updatedTabs }).eq('user_email', selectedUserEmail);
  };

  // Create User Account
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) return;

    const cleanEmail = newEmail.trim().toLowerCase();
    const defaultTabs = newRole === 'Admin' ? ALL_SYSTEM_TABS.map((t) => t.key) : ['overview', 'metrics', 'team', 'knet-calc', 'chat-macros', 'email-templates'];

    const newRecord = {
      user_email: cleanEmail,
      username: cleanEmail.split('@')[0],
      password_hash: newPassword,
      role: newRole,
      team_name: newTeam,
      floor_name: newFloor,
      account_status: 'Active',
      allowed_tabs: defaultTabs,
      is_temporary_password: true,
    };

    const { error } = await supabase.from('user_profiles').insert([newRecord]);

    if (error) {
      setIsError(true);
      setStatusMsg(`Error creating account: ${error.message}`);
    } else {
      setIsError(false);
      setStatusMsg(`✓ Account for ${cleanEmail} created successfully!`);
      setNewEmail('');
      setNewPassword('');
      fetchUserProfiles();
      setTimeout(() => setStatusMsg(''), 3000);
    }
  };

  // Delete User Account
  const handleDeleteUser = async (userEmail: string) => {
    if (userEmail === 'omar.allaa@tabby.ai') {
      alert('Master admin account cannot be deleted!');
      return;
    }

    if (confirm(`Are you sure you want to permanently delete credentials for ${userEmail}?`)) {
      await supabase.from('user_profiles').delete().eq('user_email', userEmail);
      if (selectedUserEmail === userEmail) {
        setSelectedUserEmail('');
      }
      fetchUserProfiles();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <ShieldCheck className="h-6 w-6 text-emerald-500" /> Admin Access & User Permissions
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage agent credentials, role assignments, and granular sidebar tab visibility
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchUserProfiles} disabled={loading} className="h-9 text-xs gap-1.5 border-slate-300 dark:border-slate-800">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Roster
        </Button>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
          {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{statusMsg}</span>
        </div>
      )}

      {/* DROPDOWN USER SELECT & TAB PERMISSION CHECKBOX MATRIX */}
      <Card className="border border-emerald-500/30 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Sliders className="h-5 w-5" /> Granular Tab Permission Controller
          </CardTitle>
          <CardDescription className="text-xs">
            Select a target user from the dropdown menu to configure which dashboard tabs appear on their sidebar
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-6">
          {/* Dropdown User Selector */}
          <div className="space-y-1.5 max-w-md">
            <label className="font-bold text-xs text-slate-700 dark:text-slate-300">Select User Account</label>
            <div className="relative">
              <select
                value={selectedUserEmail}
                onChange={(e) => setSelectedUserEmail(e.target.value)}
                className="w-full h-11 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 appearance-none focus:ring-2 focus:ring-emerald-500"
              >
                {users.map((u) => (
                  <option key={u.user_email} value={u.user_email}>
                    {u.user_email} ({u.role}) — {u.allowed_tabs?.length || 0} Tabs Active
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Checkbox Matrix for Selected User */}
          {selectedUser ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Active Tabs for <span className="font-mono text-emerald-500">{selectedUser.user_email}</span>
                  </span>
                  <Badge variant="outline" className="text-[10px]">{selectedUser.role}</Badge>
                </div>

                <div className="flex gap-2 text-xs">
                  <button onClick={() => handleToggleAllTabs(true)} className="text-[11px] font-semibold text-emerald-600 hover:underline">Select All</button>
                  <span className="text-slate-400">|</span>
                  <button onClick={() => handleToggleAllTabs(false)} className="text-[11px] font-semibold text-red-500 hover:underline">Unselect All</button>
                </div>
              </div>

              {/* Grid of Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {ALL_SYSTEM_TABS.map((tab) => {
                  const IconComp = tab.icon;
                  const isChecked = (selectedUser.allowed_tabs || []).includes(tab.key);

                  return (
                    <label
                      key={tab.key}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between select-none ${
                        isChecked
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-2xs'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <IconComp className={`h-4 w-4 ${isChecked ? 'text-emerald-500' : 'text-slate-400'}`} />
                        <span className="text-xs">{tab.label}</span>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleTabPermission(tab.key)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No user selected.</p>
          )}
        </CardContent>
      </Card>

      {/* CREATE NEW USER ACCOUNT FORM */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Users className="h-5 w-5 text-emerald-500" /> Create New User Account
          </CardTitle>
          <CardDescription className="text-xs">Provision credentials and assign default roles for new agents or team leaders</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">User Email</label>
                <Input
                  type="email"
                  placeholder="agent@tabby.ai"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Initial Password</label>
                <Input
                  type="text"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Role</label>
                <select
                  value={newRole}
                  onChange={(e: any) => setNewRole(e.target.value)}
                  className="w-full h-9 text-xs bg-slate-50 dark:bg-slate-950 border rounded-lg px-2"
                >
                  <option value="Agent">Agent</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Team / Floor</label>
                <Input
                  type="text"
                  value={newTeam}
                  onChange={(e) => setNewRoleTeam(e.target.value)}
                  className="h-9 text-xs bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>

            <Button type="submit" size="sm" className="h-9 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5">
              <Check className="h-4 w-4" /> Provision Account
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ALL USER ACCOUNTS TABLE */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
            Registered Account Directory ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/80">
                  <TableHead className="font-bold">Email</TableHead>
                  <TableHead className="font-bold">Role</TableHead>
                  <TableHead className="font-bold">Active Tabs Count</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_email} className="hover:bg-slate-500/5">
                    <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{u.user_email}</TableCell>
                    <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                    <TableCell className="font-bold">{u.allowed_tabs?.length || 0} Tabs</TableCell>
                    <TableCell><Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Active</Badge></TableCell>
                    <TableCell className="text-right">
                      {u.user_email !== 'omar.allaa@tabby.ai' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(u.user_email)}
                          className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
