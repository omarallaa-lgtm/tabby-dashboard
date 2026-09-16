'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Megaphone, Pin, Calendar, User, Bell, BookOpen, Settings, GraduationCap } from 'lucide-react';
import { announcements, type Announcement } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  Policy: { icon: Settings, color: 'text-chart-2', bg: 'bg-chart-2/10' },
  Event: { icon: Calendar, color: 'text-chart-3', bg: 'bg-chart-3/10' },
  Ops: { icon: Megaphone, color: 'text-chart-1', bg: 'bg-chart-1/10' },
  Training: { icon: GraduationCap, color: 'text-chart-4', bg: 'bg-chart-4/10' },
};

export function AnnouncementsTab() {
  const pinned = announcements.filter((a) => a.pinned);
  const unpinned = announcements.filter((a) => !a.pinned);

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/15 p-3">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{announcements.length} Active Announcements</h3>
            <p className="text-sm text-muted-foreground">{pinned.length} pinned · {unpinned.length} general</p>
          </div>
        </div>
      </Card>

      {pinned.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Pinned</h2>
          </div>
          {pinned.map((a, i) => (
            <AnnouncementCard key={a.id} announcement={a} delay={i * 80} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">All Announcements</h2>
        </div>
        {unpinned.map((a, i) => (
          <AnnouncementCard key={a.id} announcement={a} delay={i * 80} />
        ))}
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement, delay }: { announcement: Announcement; delay: number }) {
  const cfg = categoryConfig[announcement.category];
  const CatIcon = cfg.icon;

  return (
    <Card className="p-5 transition-all hover:shadow-md animate-fade-in-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start gap-4">
        <div className={cn('rounded-lg p-3 shrink-0', cfg.bg)}>
          <CatIcon className={cn('h-5 w-5', cfg.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">{announcement.title}</h3>
              {announcement.pinned && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  <Pin className="h-2.5 w-2.5" />
                  Pinned
                </Badge>
              )}
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {announcement.category}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{announcement.body}</p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {announcement.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {announcement.date}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
