'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { 
  MessageSquarePlus, Clock, CheckCircle2, XCircle, AlertCircle, Send, Filter, 
  MessageSquare, Check, X, Copy, ExternalLink, Eye, ShieldAlert 
} from 'lucide-react';
import { supabase } from '@/lib/metrics-context';

export function RequestsTab({ currentUser }: { currentUser: any }) {
  const [requestType, setRequestType] = useState('Annual request');
  const [ticketId, setTicketId] = useState('');
  const [details, setDetails] = useState('');

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');

  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setLoading] = useState(false);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal Detailed View & Review State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [leadershipComment, setLeadershipComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

  // Portal mount check for SSR safety
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const fetchRequests = async () => {
    if (!currentUser?.user_email) return;

    const userEmailClean = currentUser.user_email.trim().toLowerCase();

    // 1. Fetch Personal Submissions
    const { data: myData } = await supabase
      .from('requests')
      .select('*')
      .or(`user_email.ilike.${userEmailClean},agent_email.ilike.${userEmailClean}`)
      .order('created_at', { ascending: false });

    if (myData) {
      setMyRequests(myData);
    }

    // 2. Fetch Queue for Admin / Team Leaders
    if (isAdminOrTL) {
      let query = supabase.from('requests').select('*').order('created_at', { ascending: false });
      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }
      const { data: allData } = await query;
      if (allData) {
        setAllRequests(allData);
      }
    }
  };

  useEffect(() => {
    fetchRequests();

    // Live Supabase Broadcast Listener: Updates requests instantly across all open browser sessions
    const channel = supabase
      .channel('public:requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, statusFilter]);

  // Copy Ticket ID / URL Handler
  const handleCopyTicket = (e: React.MouseEvent, ticketStr: string, idKey: string) => {
    e.stopPropagation();
    if (!ticketStr || ticketStr === 'N/A') return;
    navigator.clipboard.writeText(ticketStr);
    setCopiedId(idKey);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setLoading(true);
    setIsError(false);
    setStatusMsg('Submitting request...');

    const userEmailClean = (currentUser?.user_email || 'omar.allaa@tabby.ai').trim().toLowerCase();
    const generatedUUID = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());

    const newRequest = {
      request_id: generatedUUID,
      agent_email: userEmailClean,
      user_email: userEmailClean,
      request_type: requestType,
      ticket_id: ticketId.trim() || 'N/A',
      details: details.trim(),
      status: 'Pending',
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('requests').insert([newRequest]);

    setLoading(false);

    if (error) {
      setIsError(true);
      setStatusMsg(`Error submitting request: ${error.message}`);
    } else {
      setIsError(false);
      setStatusMsg('✓ Request submitted successfully!');
      setTicketId('');
      setDetails('');
      fetchRequests();
    }
  };

  const handleOpenModal = (req: any) => {
    setSelectedRequest(req);
    setLeadershipComment(req.leadership_comment || req.admin_comment || '');
  };

  const handleConfirmReview = async (action: 'Approved' | 'Rejected') => {
    if (!selectedRequest) return;

    setReviewing(true);

    const defaultComment = action === 'Approved' ? 'Approved by Team Leader' : 'Declined by Team Leader';
    const commentToSave = leadershipComment.trim() || defaultComment;

    const updatePayload = {
      status: action,
      leadership_comment: commentToSave,
      admin_comment: commentToSave,
      reviewed_by: currentUser?.user_email || 'TL',
      reviewed_at: new Date().toISOString(),
    };

    try {
      if (selectedRequest.id) {
        await supabase
          .from('requests')
          .update(updatePayload)
          .eq('id', selectedRequest.id);
      }

      if (selectedRequest.request_id) {
        await supabase
          .from('requests')
          .update(updatePayload)
          .eq('request_id', selectedRequest.request_id);
      }
    } catch (err) {
      console.error('Failed to update request:', err);
    } finally {
      setReviewing(false);
      setSelectedRequest(null);
      await fetchRequests();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquarePlus className="h-6 w-6 text-emerald-500" /> Operational Requests & Discrepancies
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Submit leave requests, activities, or Jira ticket queries for leadership approval</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SUBMIT REQUEST FORM */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-500" /> New Request Form
            </CardTitle>
            <CardDescription className="text-xs">Submit a request to team leaders</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Request Type</label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value)}
                  className="w-full h-9 rounded-md border text-xs px-2 bg-white dark:bg-slate-900"
                >
                  <option value="Annual request">Annual request</option>
                  <option value="Casual request">Casual request</option>
                  <option value="Sick leave">Sick leave</option>
                  <option value="Early leave">Early leave</option>
                  <option value="Activity">Activity</option>
                  <option value="General inquiry">General inquiry</option>
                  <option value="Jira">Jira</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">CRM / Jira Ticket Link or ID (Optional)</label>
                <Input
                  type="text"
                  placeholder="e.g. https://crm.tabby.ai/queue/ticket/..."
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Request Details & Justification</label>
                <Textarea
                  placeholder="Provide justification or details for this request..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="text-xs min-h-[100px]"
                  required
                />
              </div>

              {statusMsg && (
                <div className={`p-2.5 rounded-md text-[11px] flex items-center gap-2 ${isError ? 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'}`}>
                  {isError ? <AlertCircle className="h-4 w-4 text-red-600 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                  <span>{statusMsg}</span>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-2">
                <Send className="h-3.5 w-3.5" /> Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* AGENT REQUEST HISTORY */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-500" /> My Submitted Request History
              </span>
              <Badge variant="outline">{myRequests.length} Submissions</Badge>
            </CardTitle>
            <CardDescription className="text-xs">Live status & team leader feedback on your submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Leadership Comment</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.length > 0 ? (
                    myRequests.map((req, idx) => {
                      const reqKey = `my_${req.id || req.request_id || idx}`;
                      const isCopyable = req.ticket_id && req.ticket_id !== 'N/A';

                      return (
                        <TableRow 
                          key={reqKey} 
                          onClick={() => handleOpenModal(req)} 
                          className="hover:bg-slate-500/5 cursor-pointer transition-colors"
                        >
                          <TableCell className="font-mono text-[10px]">{req.created_at ? new Date(req.created_at).toLocaleDateString() : '-'}</TableCell>
                          <TableCell className="font-semibold">{req.request_type || req.type}</TableCell>
                          
                          {/* Ticket ID Cell with Copy Symbol */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 max-w-[150px]">
                              <span className="truncate font-mono text-[10px]" title={req.ticket_id}>
                                {req.ticket_id || 'N/A'}
                              </span>
                              {isCopyable && (
                                <button
                                  onClick={(e) => handleCopyTicket(e, req.ticket_id, reqKey)}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                                  title="Copy Ticket ID / URL"
                                >
                                  {copiedId === reqKey ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="max-w-[180px] truncate text-slate-600 dark:text-slate-400">{req.details || req.reason}</TableCell>
                          <TableCell className="max-w-[180px] text-emerald-600 dark:text-emerald-400 font-medium">
                            {req.leadership_comment || req.reviewed_by ? `${req.leadership_comment || 'Reviewed'} (by ${req.reviewed_by || 'TL'})` : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge className={
                              req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300' :
                              req.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300' :
                              'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                            }>
                              {req.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        You have not submitted any requests yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ADMIN & TEAM LEADER APPROVAL WORKFLOW QUEUE */}
      {isAdminOrTL && (
        <Card className="border-emerald-500/30">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Filter className="h-5 w-5" /> Team Leader Approval Management Queue
                </CardTitle>
                <CardDescription className="text-xs">Review and approve agent submissions across all teams</CardDescription>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <label className="font-semibold">Filter Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 rounded-md border text-xs px-2 bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending Only</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Submitted At</TableHead>
                    <TableHead>Leadership Comment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allRequests.length > 0 ? (
                    allRequests.map((req, idx) => {
                      const reqKey = `queue_${req.id || req.request_id || idx}`;
                      const isCopyable = req.ticket_id && req.ticket_id !== 'N/A';

                      return (
                        <TableRow 
                          key={reqKey} 
                          onClick={() => handleOpenModal(req)} 
                          className="hover:bg-slate-500/5 cursor-pointer transition-colors"
                        >
                          <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">{req.agent_email || req.user_email}</TableCell>
                          <TableCell>{req.request_type || req.type}</TableCell>
                          
                          {/* Ticket ID Cell with Copy Symbol */}
                          <TableCell>
                            <div className="flex items-center gap-1.5 max-w-[160px]">
                              <span className="truncate font-mono text-[10px]" title={req.ticket_id}>
                                {req.ticket_id || 'N/A'}
                              </span>
                              {isCopyable && (
                                <button
                                  onClick={(e) => handleCopyTicket(e, req.ticket_id, reqKey)}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                                  title="Copy Ticket ID / URL"
                                >
                                  {copiedId === reqKey ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="max-w-[200px] truncate text-slate-600 dark:text-slate-400">{req.details || req.reason}</TableCell>
                          <TableCell className="text-[10px]">{req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</TableCell>
                          <TableCell className="text-xs font-medium text-emerald-600 dark:text-emerald-400 max-w-[180px] truncate">
                            {req.leadership_comment || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              req.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                              'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-1 items-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenModal(req)}
                                className="h-7 px-2.5 text-[10px] font-bold gap-1 rounded-lg"
                              >
                                <Eye className="h-3 w-3" /> View Request
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No requests found matching status filter "{statusFilter}".
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* POPUP MODAL: VIEWPORT-STATIONARY OVERLAY (MOUNTED DIRECTLY TO DOCUMENT.BODY) */}
      {selectedRequest && isMounted && createPortal(
        <div className="fixed inset-0 z-[99999] h-screen w-screen flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-hidden pointer-events-auto">
          <Card className="w-full max-w-xl shadow-2xl border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 overflow-hidden my-auto animate-fade-in flex flex-col max-h-[90vh]">
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-emerald-500" /> Request Details & Review
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Submitted by <strong>{selectedRequest.agent_email || selectedRequest.user_email}</strong>
                </CardDescription>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)} 
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 text-xs overflow-y-auto grow">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Request Type</span>
                  <div className="font-bold text-slate-900 dark:text-slate-100">{selectedRequest.request_type || selectedRequest.type || 'General'}</div>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Current Status</span>
                  <div>
                    <Badge className={
                      selectedRequest.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      selectedRequest.status === 'Rejected' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }>
                      {selectedRequest.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Ticket ID & Link Row */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Ticket ID / CRM Link</span>
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate">
                    {selectedRequest.ticket_id || 'N/A'}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedRequest.ticket_id && selectedRequest.ticket_id.startsWith('http') && (
                      <a
                        href={selectedRequest.ticket_id}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Open Link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {selectedRequest.ticket_id && selectedRequest.ticket_id !== 'N/A' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleCopyTicket(e, selectedRequest.ticket_id, 'modal_ticket')}
                        className="h-6 px-2 text-[10px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1"
                      >
                        {copiedId === 'modal_ticket' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        {copiedId === 'modal_ticket' ? 'Copied' : 'Copy'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Submission Details */}
              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Request Justification & Details</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed pt-1 whitespace-pre-wrap">
                  {selectedRequest.details || selectedRequest.reason || 'No details provided.'}
                </p>
              </div>

              {/* Leadership Feedback Textarea */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Leadership Review Comment</span>
                  <span className="text-[10px] font-normal text-slate-500">Visible to submitting agent</span>
                </label>
                <Textarea
                  placeholder="Enter optional comments or justification for approval/rejection..."
                  value={leadershipComment}
                  onChange={(e) => setLeadershipComment(e.target.value)}
                  className="text-xs min-h-[80px] bg-white dark:bg-slate-950"
                  disabled={!isAdminOrTL}
                />
              </div>

              {selectedRequest.reviewed_by && (
                <div className="text-[11px] text-slate-500 italic">
                  Reviewed by: <strong>{selectedRequest.reviewed_by}</strong> {selectedRequest.reviewed_at ? `on ${new Date(selectedRequest.reviewed_at).toLocaleString()}` : ''}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)} className="h-8 text-xs">
                  Close
                </Button>

                {isAdminOrTL && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={reviewing}
                      onClick={() => handleConfirmReview('Rejected')}
                      className="h-8 text-xs font-bold gap-1 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Reject Request
                    </Button>
                    <Button
                      size="sm"
                      disabled={reviewing}
                      onClick={() => handleConfirmReview('Approved')}
                      className="h-8 text-xs font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve Request
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
}
