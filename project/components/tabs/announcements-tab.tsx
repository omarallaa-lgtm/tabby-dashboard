'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Send, AlertCircle, CheckCircle2, Pin, Trash2, Calendar, User } from 'lucide-react';
import { supabase } from '@/lib/metrics-context';

export function AnnouncementsTab({ currentUser }: { currentUser: any }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [posting, setPosting] = useState(false);

  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPosting(true);
    setIsError(false);
    setStatusMsg('Broadcasting announcement...');

    const newAnnouncement = {
      title: title.trim(),
      content: content.trim(),
      posted_by: currentUser?.user_email || 'Omar Alaa (Admin)',
      is_pinned: true,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('announcements').insert([newAnnouncement]);

    setPosting(false);

    if (error) {
      setIsError(true);
      setStatusMsg(`Error publishing: ${error.message}`);
    } else {
      setIsError(false);
      setStatusMsg('✓ Announcement published live successfully!');
      setTitle('');
      setContent('');
      fetchAnnouncements();
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('Delete this announcement broadcast?')) {
      await supabase.from('announcements').delete().eq('id', id);
      fetchAnnouncements();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-emerald-500" /> Operational Announcements & Team Forum
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Official broadcast updates, shift announcements, and leadership communications</p>
      </div>

      {/* POST ANNOUNCEMENT FORM (ADMIN & TEAM LEADERS ONLY) */}
      {isAdminOrTL && (
        <Card className="border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-emerald-500" /> Post Official Broadcast Announcement
            </CardTitle>
            <CardDescription className="text-xs">Broadcast operational updates to all active team agents</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePostAnnouncement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Announcement Title</label>
                <Input
                  type="text"
                  placeholder="e.g. Schedule Updates - September Operational Targets"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Broadcast Content & Message Body</label>
                <Textarea
                  placeholder="Write operational announcement details, guidelines, or team updates..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="text-xs min-h-[110px]"
                  required
                />
              </div>

              {statusMsg && (
                <div className={`p-2.5 rounded-md text-[11px] flex items-center gap-2 ${isError ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  {isError ? <AlertCircle className="h-4 w-4 text-red-600 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                  <span>{statusMsg}</span>
                </div>
              )}

              <Button type="submit" disabled={posting} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-2">
                <Send className="h-3.5 w-3.5" /> Broadcast Announcement
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ANNOUNCEMENT FEED LIST */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Pin className="h-4 w-4 text-emerald-500" /> Active Announcements ({announcements.length})
        </h3>

        {announcements.length > 0 ? (
          announcements.map((item) => (
            <Card key={item.id} className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                    {item.is_pinned && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">Pinned</Badge>}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><User className="h-3 w-3 text-emerald-500" /> {item.posted_by}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> {new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {isAdminOrTL && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAnnouncement(item.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                    title="Delete Broadcast"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-medium">No active broadcasts published.</p>
            <p className="text-xs mt-1">Operational announcements posted by team leadership will appear here live.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
