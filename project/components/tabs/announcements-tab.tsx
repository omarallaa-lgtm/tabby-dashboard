'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThumbsUp, ThumbsDown, MessageSquare, Megaphone, Send } from 'lucide-react';
import { supabase, UserRole } from '@/lib/metrics-context';

export function AnnouncementsTab({ currentUser }: { currentUser: { email: string; role: UserRole } }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    if (data) setAnnouncements(data);
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    await supabase.from('announcements').insert([
      { title, content, author_email: currentUser.email }
    ]);

    setTitle('');
    setContent('');
    fetchAnnouncements();
  };

  const handleReaction = async (id: string, type: 'like' | 'dislike', currentVal: number) => {
    const updateObj = type === 'like' ? { likes: currentVal + 1 } : { dislikes: currentVal + 1 };
    await supabase.from('announcements').update(updateObj).eq('id', id);
    fetchAnnouncements();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Announcements & Team Forum</h2>
        <p className="text-xs text-muted-foreground">Team communications, operational updates, and community feedback</p>
      </div>

      {/* Broadcast Form for Admins & Team Leads */}
      {currentUser.role !== 'Agent' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-emerald-600" /> Post Official Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <Input
                placeholder="Announcement Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9"
                required
              />
              <textarea
                placeholder="Write operational announcement details..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full rounded-md border p-2 text-xs h-20"
                required
              />
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Broadcast Announcement
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Announcements Stream */}
      <div className="space-y-4">
        {announcements.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{item.title}</CardTitle>
                <span className="text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <CardDescription className="text-xs">Posted by {item.author_email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-gray-800">{item.content}</p>

              <div className="flex items-center gap-4 pt-2 border-t text-muted-foreground">
                <button
                  onClick={() => handleReaction(item.id, 'like', item.likes || 0)}
                  className="flex items-center gap-1 hover:text-emerald-600"
                >
                  <ThumbsUp className="h-4 w-4" /> <span>{item.likes || 0}</span>
                </button>
                <button
                  onClick={() => handleReaction(item.id, 'dislike', item.dislikes || 0)}
                  className="flex items-center gap-1 hover:text-red-600"
                >
                  <ThumbsDown className="h-4 w-4" /> <span>{item.dislikes || 0}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
