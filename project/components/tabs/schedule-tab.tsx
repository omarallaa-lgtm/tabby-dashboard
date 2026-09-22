'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, Upload, X, Check, Filter, 
  UserCheck, AlertCircle, CheckCircle2, Clock, MapPin, Table, LayoutGrid, RefreshCw
} from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';
import * as XLSX from 'xlsx';

interface ScheduleEntry {
  id?: string;
  agent_email: string;
  agent_name?: string;
  shift_date: string;
  shift_start_at?: string;
  shift_end_at?: string;
  is_day_off: boolean;
  agent_team_name?: string;
  agent_location?: string;
  notes?: string;
}

export function ScheduleTab() {
  const { currentUser } = useMetrics() as any;
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);

  // Multi-User Filter States
  const [userInput, setUserInput] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [activeFilterUsers, setActiveFilterUsers] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  // Fetch ALL Schedules from Supabase using Pagination (bypass 1000 row limit)
  const fetchSchedules = async () => {
    setLoading(true);
    try {
      let allRecords: ScheduleEntry[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('schedules')
          .select('*')
          .order('shift_date', { ascending: true })
          .range(from, from + step - 1);

        if (error) {
          console.error('Supabase schedule fetch error:', error);
          hasMore = false;
        } else if (data && data.length > 0) {
          allRecords = [...allRecords, ...data];
          if (data.length < step) {
            hasMore = false;
          } else {
            from += step;
          }
        } else {
          hasMore = false;
        }
      }

      setSchedules(allRecords);
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Multi-User Tag Management
  const handleRemoveUserTag = (tagToRemove: string) => {
    const updated = selectedUsers.filter((u) => u !== tagToRemove);
    setSelectedUsers(updated);
    if (updated.length === 0) {
      setActiveFilterUsers([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (userInput.trim()) {
        const inputUsers = userInput
          .split(/[,;\s]+/)
          .map((u) => u.trim().toLowerCase())
          .filter(Boolean);

        const newSelected = Array.from(new Set([...selectedUsers, ...inputUsers]));
        setSelectedUsers(newSelected);
        setActiveFilterUsers(newSelected);
        setUserInput('');
      } else if (selectedUsers.length > 0) {
        setActiveFilterUsers([...selectedUsers]);
      }
    }
  };

  const handleApplyFilter = () => {
    if (userInput.trim()) {
      const inputUsers = userInput
        .split(/[,;\s]+/)
        .map((u) => u.trim().toLowerCase())
        .filter(Boolean);
      const newSelected = Array.from(new Set([...selectedUsers, ...inputUsers]));
      setSelectedUsers(newSelected);
      setActiveFilterUsers(newSelected);
      setUserInput('');
    } else {
      setActiveFilterUsers([...selectedUsers]);
    }
  };

  const handleClearFilter = () => {
    setSelectedUsers([]);
    setActiveFilterUsers([]);
    setUserInput('');
  };

  // Upload Excel or CSV Schedule File and Upsert to Supabase
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setIsError(false);
    setStatusMsg('Parsing Excel schedule...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const buffer = evt.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (rawData.length === 0) {
          setIsError(true);
          setStatusMsg('File is empty or formatted incorrectly.');
          setLoading(false);
          return;
        }

        const formattedEntries: ScheduleEntry[] = rawData.map((row) => ({
          agent_email: String(row.agent_email || row.Email || row['Agent Email'] || '').toLowerCase().trim(),
          agent_name: String(row.agent_name || row.Name || row['Agent Name'] || row.agent_email || '').trim(),
          shift_date: String(row.shift_date || row.Date || row['Shift Date'] || '').slice(0, 10),
          shift_start_at: String(row.shift_start_at || row.Start || row['Shift Start'] || ''),
          shift_end_at: String(row.shift_end_at || row.End || row['Shift End'] || ''),
          is_day_off: String(row.is_day_off).toLowerCase() === 'true' || row.is_day_off === true || row.status === 'OFF',
          agent_team_name: String(row.agent_team_name || row.Team || 'General'),
          agent_location: String(row.agent_location || row.Location || 'office'),
          notes: row.notes || '',
        })).filter((r) => r.agent_email && r.shift_date);

        setStatusMsg(`Saving ${formattedEntries.length} entries into Supabase...`);

        // Batch upload into Supabase in chunks of 500
        const chunkSize = 500;
        for (let i = 0; i < formattedEntries.length; i += chunkSize) {
          const chunk = formattedEntries.slice(i, i + chunkSize);
          const { error } = await supabase
            .from('schedules')
            .upsert(chunk, { onConflict: 'agent_email,shift_date' });

          if (error) {
            console.error('Upsert batch error:', error);
          }
        }

        setIsError(false);
        setStatusMsg(`✓ Uploaded ${formattedEntries.length} schedule entries! Reloading database...`);
        await fetchSchedules();
      } catch (err: any) {
        setIsError(true);
        setStatusMsg(`Upload Error: ${err.message}`);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  // Filtered schedules logic
  const displayedSchedules = schedules.filter((s) => {
    if (activeFilterUsers.length === 0) return true;
    const email = s.agent_email.toLowerCase();
    const name = (s.agent_name || '').toLowerCase();
    return activeFilterUsers.some((filter) => email.includes(filter) || name.includes(filter));
  });

  // Extract unique shift dates for the matrix columns
  const uniqueDates = Array.from(new Set(displayedSchedules.map((s) => s.shift_date))).sort();

  // Extract unique agents for the matrix rows
  const uniqueAgents = Array.from(
    new Set(displayedSchedules.map((s) => s.agent_email))
  ).map((email) => {
    const entry = displayedSchedules.find((s) => s.agent_email === email);
    return {
      email,
      name: entry?.agent_name || email.split('@')[0],
      team: entry?.agent_team_name || 'General',
    };
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CalendarIcon className="h-6 w-6 text-emerald-500" /> Team Shift Schedule Roster
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            View, multi-filter, and manage real-time work shifts ({schedules.length} loaded shifts)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchSchedules}
            disabled={loading}
            className="h-8 text-xs gap-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900">
            <Button
              variant={viewMode === 'matrix' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('matrix')}
              className="h-8 text-xs gap-1 rounded-lg"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Matrix
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 text-xs gap-1 rounded-lg"
            >
              <Table className="h-3.5 w-3.5" /> List
            </Button>
          </div>

          {/* Upload Button */}
          {isAdminOrTL && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold"
              >
                <Upload className="h-4 w-4" /> Upload Schedule (CSV / XLSX)
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status Notification */}
      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
          {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Multi-User Filter Search Bar */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Filter className="h-4 w-4 text-emerald-500" /> Filter Schedule by Users (Press Enter to apply)
          </div>

          <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
            {/* Selected User Tags */}
            {selectedUsers.map((user) => (
              <Badge
                key={user}
                variant="secondary"
                className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 gap-1.5 rounded-lg"
              >
                <span>{user}</span>
                <button
                  onClick={() => handleRemoveUserTag(user)}
                  className="hover:text-red-400 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}

            <input
              type="text"
              placeholder={selectedUsers.length === 0 ? "Type email/names (e.g. omar.allaa@tabby.ai, dalia.shaban) and press Enter..." : "Add more users..."}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 text-xs focus:outline-none placeholder:text-slate-500 text-slate-900 dark:text-slate-100 min-w-[200px]"
            />

            <div className="flex items-center gap-2 ml-auto">
              <Button
                size="sm"
                onClick={handleApplyFilter}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1 rounded-lg"
              >
                <Check className="h-3.5 w-3.5" /> Apply Filter
              </Button>

              {(selectedUsers.length > 0 || activeFilterUsers.length > 0) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilter}
                  className="h-8 text-xs text-slate-400 hover:text-slate-100"
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>

          {activeFilterUsers.length > 0 && (
            <div className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1.5">
              <UserCheck className="h-3.5 w-3.5" /> Showing schedules for {uniqueAgents.length} matching agent(s) across {uniqueDates.length} date(s).
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roster View Output */}
      {viewMode === 'matrix' ? (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 sticky left-0 bg-slate-100 dark:bg-slate-950 z-10 min-w-[200px]">Agent / User</th>
                  {uniqueDates.map((date) => (
                    <th key={date} className="p-3 text-center min-w-[120px] whitespace-nowrap">
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {uniqueAgents.length > 0 ? (
                  uniqueAgents.map((agent) => (
                    <tr key={agent.email} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-200 dark:border-slate-800">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{agent.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{agent.email}</div>
                      </td>

                      {uniqueDates.map((date) => {
                        const shift = displayedSchedules.find(
                          (s) => s.agent_email === agent.email && s.shift_date === date
                        );

                        if (!shift) {
                          return (
                            <td key={date} className="p-3 text-center text-slate-500 italic">
                              -
                            </td>
                          );
                        }

                        return (
                          <td key={date} className="p-2 text-center">
                            {shift.is_day_off ? (
                              <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/30 text-[10px] px-2 py-1 font-bold">
                                OFF DAY
                              </Badge>
                            ) : (
                              <div className="bg-emerald-500/10 border border-emerald-500/30 p-1.5 rounded-lg space-y-1">
                                <div className="font-bold text-emerald-400 text-[11px] flex items-center justify-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{shift.shift_start_at ? `${shift.shift_start_at.slice(0, 5)} - ${shift.shift_end_at?.slice(0, 5)}` : 'Shifted'}</span>
                                </div>
                                <div className="text-[9px] text-slate-400 uppercase flex items-center justify-center gap-1">
                                  <MapPin className="h-2.5 w-2.5 text-emerald-500" /> {shift.agent_location || 'Office'}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={Math.max(uniqueDates.length + 1, 2)} className="p-8 text-center text-slate-400">
                      No schedule entries found. Upload an Excel schedule file to sync all agents across devices.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* List Table View */
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Agent</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Shift Hours</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Team</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
                {displayedSchedules.length > 0 ? (
                  displayedSchedules.map((s, idx) => (
                    <tr key={s.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{s.agent_name || s.agent_email}</div>
                        <div className="text-[10px] text-slate-400">{s.agent_email}</div>
                      </td>
                      <td className="p-3 text-emerald-400 font-bold">{s.shift_date}</td>
                      <td className="p-3">
                        {s.is_day_off ? '-' : `${s.shift_start_at || '07:00'} - ${s.shift_end_at || '16:00'}`}
                      </td>
                      <td className="p-3">
                        {s.is_day_off ? (
                          <Badge variant="outline" className="text-slate-400 border-slate-500/30">Day Off</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Working</Badge>
                        )}
                      </td>
                      <td className="p-3 uppercase text-slate-400">{s.agent_location || 'Office'}</td>
                      <td className="p-3 text-slate-400">{s.agent_team_name || 'General'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No matching schedule rows found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
