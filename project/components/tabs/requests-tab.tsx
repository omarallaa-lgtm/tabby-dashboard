'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { PlusCircle, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { supabase, UserRole } from '@/lib/metrics-context';

export function RequestsTab({ currentUser }: { currentUser: { email: string; role: UserRole } }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [requestType, setRequestType] = useState('Shift Swap');
  const [ticketLink, setTicketLink] = useState('');
  const [details, setDetails] = useState('');
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  const fetchRequests = async () => {
    let query = supabase.from('requests').select('*').order('created_at', { ascending: false });
    if (currentUser.role === 'Agent') {
      query = query.eq('agent_email', currentUser.email);
    }
    const { data } = await query;
    if (data) setRequests(data);
  };

  useEffect(() => {
    fetchRequests();
  }, [currentUser]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    const newReqId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    await supabase.from('requests').insert([
      {
        request_id: newReqId,
        agent_email: currentUser.email,
        request_type: requestType,
        ticket_link: ticketLink,
        details,
        status: 'pending',
      },
    ]);

    setDetails('');
    setTicketLink('');
    fetchRequests();
  };

  const handleAction = async (id: string, newStatus: 'approved' | 'declined') => {
    const comment = commentMap[id] || '';
    await supabase
      .from('requests')
      .update({
        status: newStatus,
        approver_email: currentUser.email,
        approver_comment: comment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Requests & Discrepancy Module</h2>
        <p className="text-xs text-muted-foreground">Submit, review, and track operational requests with audit logs</p>
      </div>

      {/* Agent Submit Request Form */}
      {currentUser.role === 'Agent' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-600" /> Create New Request
            </CardTitle>
            <CardDescription className="text-xs">Submit shift swaps, time-off requests, or metric recalculation disputes</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Request Type</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="w-full h-9 rounded-md border text-xs px-3"
                  >
                    <option value="Shift Swap">Shift Swap</option>
                    <option value="Time Off">Time Off</option>
                    <option value="CSAT Dispute">CSAT Dispute</option>
                    <option value="Overtime Approval">Overtime Approval</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">CRM Ticket Link (Optional)</label>
                  <Input
                    placeholder="https://crm.tabby.ai/object/ticket/..."
                    value={ticketLink}
                    onChange={(e) => setTicketLink(e.target.value)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Request Details</label>
                <textarea
                  placeholder="Provide specific details..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="w-full rounded-md border p-2 text-xs h-20"
                  required
                />
              </div>

              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                Submit Operational Request
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Request Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Request History & Audit Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Agent</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approver / Timestamp</TableHead>
                  {currentUser.role !== 'Agent' && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-bold">{req.request_id}</TableCell>
                    <TableCell>{req.agent_email}</TableCell>
                    <TableCell><Badge variant="outline">{req.request_type}</Badge></TableCell>
                    <TableCell className="max-w-xs truncate">{req.details}</TableCell>
                    <TableCell>
                      {req.status === 'pending' && <Badge className="bg-amber-100 text-amber-800">Pending</Badge>}
                      {req.status === 'approved' && <Badge className="bg-emerald-100 text-emerald-800">Approved</Badge>}
                      {req.status === 'declined' && <Badge className="bg-red-100 text-red-800">Declined</Badge>}
                    </TableCell>
                    <TableCell>
                      {req.approver_email ? (
                        <div>
                          <div className="font-medium">{req.approver_email}</div>
                          <div className="text-[10px] text-muted-foreground">{new Date(req.updated_at).toLocaleString()}</div>
                          {req.approver_comment && <div className="italic text-[10px]">"{req.approver_comment}"</div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    {currentUser.role !== 'Agent' && (
                      <TableCell className="text-right space-y-1">
                        {req.status === 'pending' && (
                          <div className="flex flex-col items-end gap-1">
                            <Input
                              placeholder="Review comment..."
                              value={commentMap[req.id] || ''}
                              onChange={(e) => setCommentMap({ ...commentMap, [req.id]: e.target.value })}
                              className="text-[10px] h-6 w-32"
                            />
                            <div className="flex gap-1">
                              <Button size="sm" onClick={() => handleAction(req.id, 'approved')} className="h-6 px-2 bg-emerald-600 text-white text-[10px]">Approve</Button>
                              <Button size="sm" onClick={() => handleAction(req.id, 'declined')} className="h-6 px-2 bg-red-600 text-white text-[10px]">Decline</Button>
                            </div>
                          </div>
                        )}
                      </TableCell>
                    )}
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
