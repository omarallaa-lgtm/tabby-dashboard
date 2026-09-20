'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Send, AlertCircle, CheckCircle2, Trash2, Calendar, User, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { supabase } from '@/lib/metrics-context';

export function AnnouncementsTab({ currentUser }: { currentUser: any }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [commentsMap, setCommentsMap] = useState<Record<string, any[]>>({});
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({});
  
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [posting, setPosting] = useState(false);

  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const fetchAnnouncements = async () => {
    // 1. Fetch announcements matching Supabase schema (author_email, likes, dislikes)
    const { data: annData, error: annErr } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!annErr && annData) {
      setAnnouncements(annData);
    }

    // 2. Fetch comments from announcement_comments table
    const { data: commData } = await supabase
      .from('announcement_comments')
      .select('*')
      .order('created_at', { ascending: true });

    if (commData) {
      const grouped: Record<string, any[]> = {};
      commData.forEach((c) => {
        if (!grouped[c.announcement_id]) grouped[c.announcement_id] = [];
        grouped[c.announcement_id].push(c);
      });
      setCommentsMap(grouped);
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

    const authorEmailClean = (currentUser?.user_email || 'omar.allaa@tabby.ai').trim().toLowerCase();

    // Payload matching exact Supabase column author_email
    const newAnnouncement = {
      title: title.trim(),
      content: content.trim(),
      author_email: authorEmailClean,
      likes: 0,
      dislikes: 0,
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

  const handleLike = async (id: string, currentLikes: number) => {
    await supabase.from('announcements').update({ likes: (currentLikes || 0) + 1 }).eq('id', id);
    fetchAnnouncements();
  };

  const handleDislike = async (id: string, currentDislikes: number) => {
    await supabase.from('announcements').update({ dislikes: (currentDislikes || 0) + 1 }).eq('id', id);
    fetchAnnouncements();
  };

  const handleAddComment = async (announcementId: string) => {
    const text = newCommentText[announcementId];
    if (!text || !text.trim()) return;

    const userEmailClean = (currentUser?.user_email || 'omar.allaa@tabby.ai').trim().toLowerCase();

    await supabase.from('announcement_comments').insert([
      {
        announcement_id: announcementId,
        user_email: userEmailClean,
        comment: text.trim(),
        created_at: new Date().toISOString(),
      },
    ]);

    setNewCommentText({ ...newCommentText, [announcementId]: '' });
    fetchAnnouncements();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (confirm('Delete this announcement broadcast?')) {
      await supabase.from('announcement_comments').delete().eq('announcement_id', id);
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
        <p className="text-xs text-muted-foreground mt-1">Official broadcast updates, shift announcements, and team feedback forum</p>
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
                  placeholder="e.g. September Operational Targets & Shift Updates"
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

      {/* ANNOUNCEMENT FEED LIST WITH LIKES & COMMENTS */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-emerald-500" /> Active Announcements ({announcements.length})
        </h3>

        {announcements.length > 0 ? (
          announcements.map((item) => {
            const comments = commentsMap[item.id] || [];

            return (
              <Card key={item.id} className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
                <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 font-semibold text-emerald-600"><User className="h-3 w-3" /> {item.author_email || 'Admin'}</span>
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

                <CardContent className="pt-2 space-y-4">
                  <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </p>

                  {/* Reaction Buttons (Likes & Dislikes) */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <button
                      onClick={() => handleLike(item.id, item.likes)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-all"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span>{item.likes || 0}</span>
                    </button>

                    <button
                      onClick={() => handleDislike(item.id, item.dislikes)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold transition-all"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                      <span>{item.dislikes || 0}</span>
                    </button>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                      <MessageSquare className="h-3.5 w-3.5" /> {comments.length} Comments
                    </span>
                  </div>

                  {/* Comment Thread */}
                  <div className="bg-slate-500/5 p-3 rounded-lg space-y-2 text-xs">
                    <div className="font-bold text-[11px] text-slate-600 dark:text-slate-400">Team Forum Comments:</div>

                    {comments.length > 0 ? (
                      comments.map((c: any) => (
                        <div key={c.id} className="p-2 bg-white dark:bg-slate-900 border rounded text-xs space-y-0.5">
                          <div className="flex justify-between font-bold text-emerald-600 text-[10px]">
                            <span>{c.user_email}</span>
                            <span className="text-slate-400 font-normal">{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300">{c.comment}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">No comments yet. Be the first to reply!</p>
                    )}

                    {/* Add Comment Input */}
                    <div className="flex gap-2 pt-1">
                      <Input
                        type="text"
                        placeholder="Write a reply or team comment..."
                        value={newCommentText[item.id] || ''}
                        onChange={(e) => setNewCommentText({ ...newCommentText, [item.id]: e.target.value })}
                        className="h-8 text-xs bg-white dark:bg-slate-900"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleAddComment(item.id)}
                        className="h-8 text-xs bg-emerald-600 text-white font-bold px-3"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
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
