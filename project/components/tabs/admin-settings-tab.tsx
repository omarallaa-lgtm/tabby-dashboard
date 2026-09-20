'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ShieldCheck, UserPlus, Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase, UserRole } from '@/lib/metrics-context';

export function AdminSettingsTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('Temp@2026');
  const [newRole, setNewRole] = useState<UserRole>('Agent');
  const [statusMsg, setStatusMsg] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const fetchUsers = async () => {
    const { data } = await supabase.from('user_profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const cleanEmail = newEmail.trim().toLowerCase();
    const username = cleanEmail.split('@')[0];
    const allowedTabs = newRole === 'Admin' 
      ? ['overview', 'metrics', 'team', 'requests', 'announcements', 'agent-data', 'admin']
      : ['overview', 'requests', 'announcements'];

    await supabase.from('user_profiles').insert([
      {
        user_email: cleanEmail,
        username,
        password_hash: tempPassword,
        is_temporary_password: true,
        role: newRole,
        team_name: 'Support Tier 1',
        floor_name: 'Floor 1',
        allowed_tabs: allowedTabs,
      },
    ]);

    setStatusMsg(`✓ Provisioned user ${cleanEmail}`);
    setNewEmail('');
    fetchUsers();
  };

  const handleToggleTabPermission = async (userEmail: string, currentTabs: string[], tabKey: string) => {
    const updatedTabs = currentTabs.includes(tabKey)
      ? currentTabs.filter((t) => t !== tabKey)
      : [...currentTabs, tabKey];

    await supabase.from('user_profiles').update({ allowed_tabs: updatedTabs }).eq('user_email', userEmail);
    fetchUsers();
  };

  const handleDeleteUser = async (userEmail: string) => {
    if (confirm(`Are you sure you want to revoke and delete credentials for ${userEmail}?`)) {
      await supabase.from('user_profiles').delete().eq('user_email', userEmail);
      fetchUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin User Control & Tab Permissions</h2>
        <p className="text-xs text-muted-foreground">Provision accounts, inspect user custom passwords, manage access, or revoke user credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" /> Provision Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium">User Email Address</label>
                <Input type="email" placeholder="user@tabby.ai" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="h-9 text-xs" required />
              </div>

              <div className="space-y-1">
                <label className="font-medium">Temporary Password</label>
                <Input type="text" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} className="h-9 text-xs" required />
              </div>

              <div className="space-y-1">
                <label className="font-medium">Role Assignment</label>
                <select value={newRole} onChange={(e) => setNewRole(e.target.value as UserRole)} className="w-full h-9 rounded border text-xs px-2">
                  <option value="Admin">Admin</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>

              {statusMsg && <div className="p-2 bg-emerald-50 text-emerald-800 rounded text-[11px]">{statusMsg}</div>}

              <Button type="submit" className="w-full bg-emerald-600 text-white text-xs">Authorize User</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Roster & Granular Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Password Reflection</TableHead>
                    <TableHead>Allowed Tabs</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id || u.user_email}>
                      <TableCell className="font-medium">{u.user_email}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-mono">
                          <span>{visiblePasswords[u.user_email] ? u.password_hash : '••••••••'}</span>
                          <button onClick={() => setVisiblePasswords({ ...visiblePasswords, [u.user_email]: !visiblePasswords[u.user_email] })}>
                            {visiblePasswords[u.user_email] ? <EyeOff className="h-3.5 w-3.5 text-gray-500" /> : <Eye className="h-3.5 w-3.5 text-gray-500" />}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {['overview', 'metrics', 'team', 'requests', 'announcements', 'agent-data'].map((tab) => {
                            const isAllowed = (u.allowed_tabs || []).includes(tab);
                            return (
                              <button
                                key={tab}
                                onClick={() => handleToggleTabPermission(u.user_email, u.allowed_tabs || [], tab)}
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  isAllowed ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-400 border-gray-200'
                                }`}
                              >
                                {tab}
                              </button>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(u.user_email)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                          title="Revoke Credentials"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
