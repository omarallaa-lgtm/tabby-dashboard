'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { useMetrics, UserRole } from '@/lib/metrics-context';
import { ShieldCheck, UserPlus, Trash2, Mail, Lock } from 'lucide-react';

export function AdminSettingsTab() {
  const { userAccounts, addUserAccount, removeUserAccount, currentUser } = useMetrics();
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('Agent');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) return;
    addUserAccount(newEmail, selectedRole, newPassword || '123456');
    setNewEmail('');
    setNewPassword('');
  };

  const isAuthorized = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  if (!isAuthorized) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 font-bold">You do not have permission to view Admin Settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <div>
              <CardTitle>User Credentials & Role Management</CardTitle>
              <CardDescription>
                Add allowed agent emails, set login passwords, and assign role permissions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-center gap-3 mb-6 bg-slate-50 p-4 rounded-xl border">
            <div className="relative flex-1 w-full">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="agent@tabby.ai"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="pl-9 bg-white text-xs h-10"
                required
              />
            </div>

            <div className="relative flex-1 w-full">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Set password (default: 123456)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9 bg-white text-xs h-10"
              />
            </div>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="h-10 px-3 py-2 bg-white border rounded-md text-xs font-semibold text-gray-700 w-full sm:w-36 focus:outline-hidden"
            >
              <option value="Agent">Agent</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>

            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-10 px-5 w-full sm:w-auto flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" />
              Add User
            </Button>
          </form>

          <div className="border rounded-xl overflow-hidden">
            <Table className="text-xs">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold text-gray-700">User Email</TableHead>
                  <TableHead className="font-bold text-gray-700">Assigned Role</TableHead>
                  <TableHead className="font-bold text-gray-700">Password</TableHead>
                  <TableHead className="text-right font-bold text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y">
                {Object.values(userAccounts).map((acc) => (
                  <TableRow key={acc.email} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-900">{acc.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant={acc.role === 'Admin' ? 'default' : acc.role === 'Manager' ? 'secondary' : 'outline'}
                        className={
                          acc.role === 'Admin'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : acc.role === 'Manager'
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }
                      >
                        {acc.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-gray-600">
                      {acc.password || '••••••'}
                    </TableCell>
                    <TableCell className="text-right">
                      {acc.email !== currentUser?.email && (
                        <button
                          type="button"
                          onClick={() => removeUserAccount(acc.email)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Revoke Access"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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