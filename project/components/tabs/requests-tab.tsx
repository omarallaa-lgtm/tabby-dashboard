'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { MessageSquarePlus, Clock, CheckCircle2, XCircle, AlertCircle, Send, Filter, MessageSquare, Check, X } from 'lucide-react';
import { supabase } from '@/lib/metrics-context';

export function RequestsTab({ currentUser }: { currentUser: any }) {
  const [requestType, setRequestType] = useState('Score Review');
  const [ticketId, setTicketId] = useState('');
  const [details, setDetails] = useState('');

  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');

  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [submitting, setLoading] = useState(false);

  // Modal Review State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [leadershipComment, setLeadershipComment] = useState('');
  const [reviewing, setReviewing] = useState(false);

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
  }, [currentUser, statusFilter]);

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

  const handleOpenReviewModal = (req: any, action: 'Approved' | 'Rejected') => {
    setSelectedRequest(req);
    setReviewAction(action);
    setLeadershipComment('');
  };

  const handleConfirmReview = async () => {
    if (!selectedRequest) return;

    setReviewing(true);
    const targetId = selectedRequest.id || selectedRequest.request_id;

    const updatePayload = {
      status: reviewAction,
      leadership_comment: leadershipComment.trim() || (reviewAction === 'Approved' ? 'Approved by Team Leader' : 'Declined by Team Leader'),
      reviewed_by: currentUser?.user_email || 'TL',
      reviewed_at: new Date().toISOString(),
    };

    let { error } = await supabase
      .from('requests')
      .update(updatePayload)
      .eq('id', targetId);

    if (error && selectedRequest.request_id) {
      await supabase
        .from('requests')
        .update(updatePayload)
        .eq('request_id', selectedRequest.request_id);
    }

    setReviewing(false);
    setSelectedRequest(null);
    fetchRequests();
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <MessageSquarePlus className="h-6 w-6 text-emerald-500" /> Operational Requests & Discrepancies
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Submit score reviews, time adjustments, or dispute metrics for leadership approval</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SUBMIT REQUEST FORM */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-500" /> New Request Form
            </CardTitle>
            <CardDescription className="text-xs">Submit a dispute or request to team leaders</CardDescription>
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
                  <option value="Score Review">CSAT / DSAT Score Review</option>
                  <option value="Karma Exclusion">Karma / Exclusion Request</option>
                  <option value="Attendance / Tardy Adjustment">Tardy / Time Adjustment</option>
                  <option value="General Query">General Metric Query</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">CRM Ticket ID (Optional)</label>
                <Input
                  type="text"
                  placeholder="e.g. https://crm.tabby.ai/queue/ticket/..."
                  value={ticketId}
                  onChange={(e) => setTicketId(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Discrepancy Details & Justification</label>
                <Textarea
                  placeholder="Explain why this score or time record should be reviewed..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="text-xs min-h-[100px]"
                  required
                />
              </div>

              {statusMsg && (
                <div className={`p-2.5 rounded-md text-[11px] flex items-center gap-2 ${isError ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
                  {isError ? <AlertCircle className="h-4 w-4 text-red-600 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                  <span>{statusMsg}</span>
                </div>
              )}

              <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs gap-2">
                <Send className="h-3.5 w-3.5" /> Submit Discrepancy Request
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
                    myRequests.map((req, idx) => (
                      <TableRow key={req.id || req.request_id || idx} className="hover:bg-slate-500/5">
                        <TableCell className="font-mono text-[10px]">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="font-semibold">{req.request_type}</TableCell>
                        <TableCell className="font-mono text-[10px] max-w-[150px] truncate">{req.ticket_id}</TableCell>
                        <TableCell className="max-w-[180px] truncate text-slate-600 dark:text-slate-400">{req.details}</TableCell>
                        <TableCell className="max-w-[180px] text-emerald-600 font-medium">
                          {req.leadership_comment || req.reviewed_by ? `${req.leadership_comment || 'Reviewed'} (by ${req.reviewed_by || 'TL'})` : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge className={
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                            req.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                            'bg-amber-100 text-amber-800 border-amber-300'
                          }>
                            {req.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
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
                <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                  <Filter className="h-5 w-5" /> Team Leader Approval Management Queue
                </CardTitle>
                <CardDescription className="text-xs">Review and approve agent discrepancy submissions across all teams</CardDescription>
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
                    allRequests.map((req, idx) => (
                      <TableRow key={req.id || req.request_id || idx} className="hover:bg-slate-500/5">
                        <TableCell className="font-semibold text-emerald-600">{req.agent_email || req.user_email}</TableCell>
                        <TableCell>{req.request_type}</TableCell>
                        <TableCell className="font-mono text-[10px] max-w-[150px] truncate">{req.ticket_id}</TableCell>
                        <TableCell className="max-w-[200px] text-slate-600 dark:text-slate-400">{req.details}</TableCell>
                        <TableCell className="text-[10px]">{new Date(req.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-medium text-emerald-600">
                          {req.leadership_comment || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }>
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === 'Pending' ? (
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                onClick={() => handleOpenReviewModal(req, 'Approved')}
                                className="h-7 px-2.5 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                              >
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenReviewModal(req, 'Rejected')}
                                className="h-7 px-2.5 text-[10px] border-red-300 text-red-600 hover:bg-red-50 font-bold gap-1"
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">
                              Reviewed by {req.reviewed_by || 'TL'}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
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

      {/* MODAL: APPROVE / REJECT WITH LEADERSHIP COMMENT */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <Card className="w-full max-w-lg shadow-2xl border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-500" />
                  {reviewAction === 'Approved' ? 'Approve Agent Discrepancy' : 'Reject Agent Discrepancy'}
                </span>
                <button onClick={() => setSelectedRequest(null)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </CardTitle>
              <CardDescription className="text-xs">
                Request from <strong>{selectedRequest.agent_email || selectedRequest.user_email}</strong> ({selectedRequest.request_type})
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-1">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Agent's Submission Details:</div>
                <p className="text-slate-600 dark:text-slate-400 italic">"{selectedRequest.details}"</p>
                {selectedRequest.ticket_id && (
                  <div className="text-[10px] font-mono text-emerald-600 pt-1">Ticket: {selectedRequest.ticket_id}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Leadership Feedback / Review Comment (Optional)
                </label>
                <Textarea
                  placeholder={
                    reviewAction === 'Approved'
                      ? 'e.g. Approved. Score excluded from monthly CSAT matrix...'
                      : 'e.g. Declined. Ticket resolution confirmed accurate per QA guidelines...'
                  }
                  value={leadershipComment}
                  onChange={(e) => setLeadershipComment(e.target.value)}
                  className="text-xs min-h-[90px] bg-white dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedRequest(null)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={reviewing}
                  onClick={handleConfirmReview}
                  className={`h-8 text-xs font-bold gap-1 ${
                    reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  Confirm {reviewAction} Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
