'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Megaphone, Send, AlertCircle, CheckCircle2, Trash2, Calendar, User, ThumbsUp, ThumbsDown, MessageSquare, ExternalLink, Copy, Check, ChevronDown, ChevronUp, Hash, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/metrics-context';

// One-time database setup for the Slack feed (run in Supabase → SQL Editor)
const SLACK_SQL = `-- Slack → Announcements: run once in Supabase → SQL Editor
alter table announcements add column if not exists source text;
alter table announcements add column if not exists slack_ts text;
alter table announcements add column if not exists slack_channel text;
alter table announcements add column if not exists slack_user text;
alter table announcements add column if not exists slack_permalink text;
create unique index if not exists announcements_slack_ts_key on announcements (slack_ts);
-- live updates on the Announcements tab
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'announcements') then
    alter publication supabase_realtime add table announcements;
  end if;
end $$;`;

const SlackMark = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path fill="#E01E5A" d="M5.04 15.17a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52Zm1.27 0a2.52 2.52 0 0 1 5.04 0v6.31a2.52 2.52 0 1 1-5.04 0v-6.31Z" />
    <path fill="#36C5F0" d="M8.83 5.04a2.52 2.52 0 1 1 2.52-2.52v2.52H8.83Zm0 1.27a2.52 2.52 0 0 1 0 5.04H2.52a2.52 2.52 0 1 1 0-5.04h6.31Z" />
    <path fill="#2EB67D" d="M18.96 8.83a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.83Zm-1.27 0a2.52 2.52 0 0 1-5.04 0V2.52a2.52 2.52 0 1 1 5.04 0v6.31Z" />
    <path fill="#ECB22E" d="M15.17 18.96a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52Zm0-1.27a2.52 2.52 0 0 1 0-5.04h6.31a2.52 2.52 0 1 1 0 5.04h-6.31Z" />
  </svg>
);

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
  const isAdmin = currentUser?.role === 'Admin';

  // Slack feed
  const [sourceFilter, setSourceFilter] = useState<'all' | 'slack' | 'dashboard'>('all');
  const [showSlackSetup, setShowSlackSetup] = useState(false);
  const [slackStatus, setSlackStatus] = useState<any>(null);
  const [copiedKey, setCopiedKey] = useState('');
  const receiverUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/slack/events` : '/api/slack/events';
  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1600);
  };
  const checkSlack = async () => {
    try {
      const res = await fetch('/api/slack/events', { cache: 'no-store' });
      setSlackStatus(res.ok ? await res.json() : { error: `HTTP ${res.status}` });
    } catch (e: any) {
      setSlackStatus({ error: e?.message || 'not reachable' });
    }
  };

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

  // Live: new announcements (including Slack messages) appear without refreshing the page
  useEffect(() => {
    fetchAnnouncements();
    const channel = supabase
      .channel('announcements-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => fetchAnnouncements())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcement_comments' }, () => fetchAnnouncements())
      .subscribe();
    const poll = setInterval(() => {
      if (!document.hidden) fetchAnnouncements();
    }, 30000); // backup in case realtime is not enabled for the table
    const onVisible = () => !document.hidden && fetchAnnouncements();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAdmin && showSlackSetup) checkSlack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, showSlackSetup]);

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

      {/* SLACK FEED SETUP (ADMIN ONLY) */}
      {isAdmin && (
        <Card className="border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setShowSlackSetup((v) => !v)}
            className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left"
          >
            <span className="flex items-center gap-2.5 text-sm font-bold text-slate-800 dark:text-slate-100">
              <SlackMark className="h-5 w-5" /> Slack updates feed
              <span className="text-[11px] font-normal text-slate-500">Messages posted in the Slack updates channel appear here automatically</span>
            </span>
            {showSlackSetup ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showSlackSetup && (
            <CardContent className="space-y-4 text-xs pt-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Connection:</span>
                {!slackStatus ? (
                  <span className="text-slate-400">checking…</span>
                ) : slackStatus.error ? (
                  <Badge className="bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/40">Receiver not reachable ({slackStatus.error})</Badge>
                ) : (
                  <>
                    {[
                      ['Signing secret', slackStatus.configured?.signingSecret],
                      ['Bot token', slackStatus.configured?.botToken],
                      ['Channel ID', slackStatus.configured?.channels > 0],
                    ].map(([label, ok]) => (
                      <Badge
                        key={String(label)}
                        className={ok ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40'}
                      >
                        {ok ? <Check className="h-3 w-3 mr-1" /> : null}
                        {String(label)} {ok ? 'set' : 'missing'}
                      </Badge>
                    ))}
                  </>
                )}
                <button type="button" onClick={checkSlack} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600">
                  <RefreshCw className="h-3 w-3" /> Check again
                </button>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-slate-600 dark:text-slate-300">Request URL to paste in Slack (Event Subscriptions)</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 truncate rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono text-[11px]">{receiverUrl}</code>
                  <Button type="button" size="sm" variant="outline" onClick={() => copy(receiverUrl, 'url')} className="h-8 text-xs gap-1.5">
                    {copiedKey === 'url' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
                  </Button>
                </div>
              </div>

              <ol className="list-decimal pl-5 space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
                <li>Run the SQL below once in <b>Supabase → SQL Editor</b>.</li>
                <li>
                  At <b>api.slack.com/apps</b> create an app (From scratch) in the Tabby workspace. Under <b>OAuth &amp; Permissions</b> add the bot scopes{' '}
                  <code>channels:history</code>, <code>users:read</code>, <code>users:read.email</code> (and <code>groups:history</code> if the channel is private), then install it.
                </li>
                <li>
                  In <b>Vercel → Settings → Environment Variables</b> add <code>SLACK_SIGNING_SECRET</code>, <code>SLACK_BOT_TOKEN</code> and <code>SLACK_CHANNEL_ID</code>, then redeploy.
                </li>
                <li>
                  In the Slack app open <b>Event Subscriptions</b>, turn it on, paste the Request URL above, and subscribe to the bot events <code>message.channels</code>{' '}
                  (or <code>message.groups</code> for a private channel). Save.
                </li>
                <li>
                  In the updates channel type <code>/invite @your-app-name</code>. New messages now appear here within seconds.
                </li>
              </ol>

              <div className="relative">
                <pre className="text-[11px] leading-relaxed p-3 rounded-lg bg-slate-900 text-emerald-200 overflow-x-auto whitespace-pre">{SLACK_SQL}</pre>
                <button
                  type="button"
                  onClick={() => copy(SLACK_SQL, 'sql')}
                  className="absolute top-2 right-2 h-7 px-2 rounded-md text-[11px] font-bold bg-white/10 text-white hover:bg-white/20 flex items-center gap-1"
                >
                  {copiedKey === 'sql' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy SQL
                </button>
              </div>
            </CardContent>
          )}
        </Card>
      )}

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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-emerald-500" /> Active Announcements ({announcements.length})
          </h3>
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 p-0.5 text-[11px] font-bold">
            {(
              [
                ['all', 'All'],
                ['slack', 'From Slack'],
                ['dashboard', 'Posted here'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSourceFilter(key)}
                className={`h-7 px-2.5 rounded-md flex items-center gap-1.5 ${
                  sourceFilter === key ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {key === 'slack' && <SlackMark className="h-3 w-3" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        {announcements.filter((a) => sourceFilter === 'all' || (sourceFilter === 'slack' ? a.source === 'slack' : a.source !== 'slack')).length > 0 ? (
          announcements
            .filter((a) => sourceFilter === 'all' || (sourceFilter === 'slack' ? a.source === 'slack' : a.source !== 'slack'))
            .map((item) => {
            const comments = commentsMap[item.id] || [];
            const fromSlack = item.source === 'slack';

            return (
              <Card key={item.id} className={`border-l-4 ${fromSlack ? 'border-l-[#6d8196]' : 'border-l-emerald-500'} shadow-sm hover:shadow-md transition-all`}>
                <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground mt-1">
                      {fromSlack && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-slate-700 px-2 py-0.5 font-bold text-slate-600 dark:text-slate-300">
                          <SlackMark className="h-3 w-3" /> Slack
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-emerald-600">
                        <User className="h-3 w-3" /> {fromSlack ? item.slack_user || item.author_email || 'Slack' : item.author_email || 'Admin'}
                      </span>
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-slate-400" /> {new Date(item.created_at).toLocaleString()}</span>
                      {fromSlack && item.slack_permalink && (
                        <a
                          href={item.slack_permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          <Hash className="h-3 w-3" /> Open in Slack <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
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
