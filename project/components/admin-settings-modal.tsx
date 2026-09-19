'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { ShieldCheck, UserPlus, Trash2, Mail, Lock, CheckCircle2 } from 'lucide-react';
import { supabase, UserRole } from '@/lib/metrics-context';

export function AdminSettingsTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('Temp@2026');
  const [newRole, setNewRole] = useState<UserRole>('Agent');
  const [statusMsg, setStatusMsg] = useState('');

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

    setStatusMsg(`✓ User ${cleanEmail} added with temporary password: ${tempPassword}`);
    setNewEmail('');
    fetchUsers();
  };

  const handleRemoveUser = async (email: string) => {
    await supabase.from('user_profiles').delete().eq('user_email', email);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin User & Security Settings</h2>
        <p className="text-xs text-muted-foreground">Manage allowed Tabby.ai accounts, roles, temporary passwords, and access permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" /> Provision New User
            </CardTitle>
            <CardDescription className="text-xs">Set email and temporary login credentials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium">User Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="user@tabby.ai"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-9 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Temporary Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="pl-9 h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium">Role Assignment</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full h-9 rounded-md border text-xs px-3"
                >
                  <option value="Admin">Admin</option>
                  <option value="Team Leader">Team Leader</option>
                  <option value="Agent">Agent</option>
                </select>
              </div>

              {statusMsg && (
                <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-[11px] flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{statusMsg}</span>
                </div>
              )}

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Provision Account
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" /> Active Account Roster
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Password Type</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.user_email}</TableCell>
                      <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                      <TableCell>
                        {u.is_temporary_password ? (
                          <Badge className="bg-amber-100 text-amber-800">Temporary</Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-800">User Custom</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.user_email !== 'omar.allaa@tabby.ai' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(u.user_email)}
                            className="text-red-500 hover:text-red-700 h-6 px-2 text-[10px]"
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
    </div>
  );
}
