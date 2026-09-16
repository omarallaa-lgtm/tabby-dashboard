'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useMetrics } from '@/lib/metrics-context';
import { ShieldCheck, UserPlus, Trash2, Mail, Lock } from 'lucide-react';

interface UserAccount {
  email: string;
  role: string;
  addedAt?: string;
  [key: string]: any;
}

export function AdminSettingsTab() {
  const context = useMetrics() as any;
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Admin');

  const allowedEmails: string[] = context?.allowedEmails || ['omar.allaa@tabby.ai', 'admin@tabby.ai'];
  
  // Explicitly type userAccounts map to prevent TS 'unknown' errors
  const userAccounts: Record<string, UserAccount> = allowedEmails.reduce((acc, email) => {
    acc[email] = {
      email,
      role: email === 'omar.allaa@tabby.ai' ? 'Admin' : 'Manager',
    };
    return acc;
  }, {} as Record<string, UserAccount>);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    if (typeof context?.addAllowedEmail === 'function') {
      context.addAllowedEmail(newEmail.trim(), newRole);
    }
    setNewEmail('');
  };

  const handleRemoveUser = (email: string) => {
    if (typeof context?.removeAllowedEmail === 'function') {
      context.removeAllowedEmail(email);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Settings</h2>
        <p className="text-muted-foreground">Manage authorized access and user permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              Add Allowed User
            </CardTitle>
            <CardDescription>Authorize team members to view or edit dashboard metrics.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="user@tabby.ai"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Agent">Agent</option>
                  </select>
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <UserPlus className="h-4 w-4" />
                Authorize User
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Authorized Access List
            </CardTitle>
            <CardDescription>Users currently permitted to log into the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y">
                  {Object.values(userAccounts).map((acc: UserAccount) => (
                    <TableRow key={acc.email} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-900">{acc.email}</TableCell>
                      <TableCell>
                        <Badge variant={acc.role === 'Admin' ? 'default' : 'outline'}>
                          {acc.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {acc.email !== 'omar.allaa@tabby.ai' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveUser(acc.email)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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