'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { FileText, Check, X, Clock, AlertCircle } from 'lucide-react';
import { requestItems, type RequestItem } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  Pending: { variant: 'outline', icon: Clock, className: 'text-amber-500 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800' },
  Approved: { variant: 'secondary', icon: Check, className: 'text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800' },
  Denied: { variant: 'destructive', icon: X, className: 'text-red-500' },
};

const priorityConfig: Record<string, string> = {
  High: 'text-red-500',
  Medium: 'text-amber-500',
  Low: 'text-muted-foreground',
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Time Off': Clock,
  'Shift Swap': AlertCircle,
  'Schedule Change': FileText,
  'Equipment': FileText,
};

type FilterType = 'all' | 'pending' | 'approved' | 'denied';

export function RequestsTab() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [items, setItems] = useState<RequestItem[]>(requestItems);

  const filtered = filter === 'all' ? items : items.filter((r) => r.status.toLowerCase() === filter);

  const counts = {
    all: items.length,
    pending: items.filter((r) => r.status === 'Pending').length,
    approved: items.filter((r) => r.status === 'Approved').length,
    denied: items.filter((r) => r.status === 'Denied').length,
  };

  const handleAction = (id: string, action: 'Approved' | 'Denied') => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status: action } : r)));
  };

  const filterButtons: { id: FilterType; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'approved', label: 'Approved', count: counts.approved },
    { id: 'denied', label: 'Denied', count: counts.denied },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {filterButtons.map((f, i) => {
          const isActive = filter === f.id;
          return (
            <Card
              key={f.id}
              className={cn(
                'cursor-pointer p-5 transition-all hover:shadow-md animate-fade-in-up',
                isActive && 'ring-2 ring-primary'
              )}
              style={{ animationDelay: `${i * 60}ms` }}
              onClick={() => setFilter(f.id)}
            >
              <p className="text-sm text-muted-foreground">{f.label}</p>
              <p className="mt-1 text-2xl font-bold">{f.count}</p>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Requests</CardTitle>
              <CardDescription>Time off, shift swaps, schedule changes, and equipment requests</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-center">Priority</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((req) => {
                  const cfg = statusConfig[req.status];
                  const StatusIcon = cfg.icon;
                  const TypeIcon = typeIcons[req.type] || FileText;
                  return (
                    <TableRow key={req.id}>
                      <TableCell>
                        <span className="font-mono text-xs text-muted-foreground">{req.id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-muted/60 p-1.5">
                            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium">{req.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{req.agent}</p>
                          <p className="text-xs text-muted-foreground">{req.team}</p>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground line-clamp-2">{req.details}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn('text-xs font-semibold', priorityConfig[req.priority])}>
                          {req.priority}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{req.submitted}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cfg.variant} className={cn('gap-1', cfg.className)}>
                          <StatusIcon className="h-3 w-3" />
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {req.status === 'Pending' ? (
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600 hover:bg-green-50 dark:hover:bg-green-950/30"
                              onClick={() => handleAction(req.id, 'Approved')}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                              onClick={() => handleAction(req.id, 'Denied')}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
