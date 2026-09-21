'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Save, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, History, RefreshCw, Database } from 'lucide-react';
import { processKSCATCalc, processMetricsFile, processPVFFile } from '@/lib/csv-parser';
import { supabase, useMetrics } from '@/lib/metrics-context';
import Papa from 'papaparse';

export function AgentDataTab() {
  const { refreshMetrics, currentUser } = useMetrics() as any;
  const [periodId, setPeriodId] = useState(() => new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [uploadLogs, setUploadLogs] = useState<any[]>([]);
  
  // File state tracking
  const [kscatFile, setKscatFile] = useState<File | null>(null);
  const [pvfFile, setPvfFile] = useState<File | null>(null);
  const [metricsFile, setMetricsFile] = useState<File | null>(null);

  const [fileReadStats, setFileReadStats] = useState<{ [key: string]: { name: string; sizeMb: string } }>({
    kscat: { name: '', sizeMb: '' },
    pvf: { name: '', sizeMb: '' },
    metrics: { name: '', sizeMb: '' },
  });

  // Upload Animation States
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'idle' | 'active' | 'done' }>({
    kscat: 'idle',
    pvf: 'idle',
    metrics: 'idle',
  });

  const [fillWidths, setFillWidths] = useState<{ [key: string]: number }>({
    kscat: 0,
    pvf: 0,
    metrics: 0,
  });

  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const kscatRef = useRef<HTMLInputElement>(null);
  const pvfRef = useRef<HTMLInputElement>(null);
  const metricsRef = useRef<HTMLInputElement>(null);

  // Web Audio Context Synthesizer for Chimes
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = () => {
    if (!audioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtxRef.current = new AudioCtxClass();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq: number, t0: number, dur: number, peak: number) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch (e) {
      console.error(e);
    }
  };

  const playUploadChime = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(880, now, 0.45, 0.16);
    playTone(1318.5, now + 0.07, 0.45, 0.16);
  };

  const playSaveChime = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    playTone(659.3, now, 0.3, 0.15);
    playTone(880, now + 0.09, 0.3, 0.15);
    playTone(1318.5, now + 0.18, 0.55, 0.17);
  };

  const fetchHistory = async () => {
    const { data: histData } = await supabase.from('upload_history').select('*').order('created_at', { ascending: false });
    
    if (histData && histData.length > 0) {
      setUploadLogs(histData);
    } else {
      const { data: metricsData } = await supabase.from('agent_metrics').select('period_id, created_at').order('created_at', { ascending: false });
      if (metricsData) {
        const periodMap = new Map();
        metricsData.forEach((row) => {
          if (!periodMap.has(row.period_id)) {
            periodMap.set(row.period_id, {
              id: row.period_id,
              period_id: row.period_id,
              uploaded_by: 'Admin',
              records_count: 1,
              created_at: row.created_at,
            });
          }
        });
        setUploadLogs(Array.from(periodMap.values()));
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve) => {
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: (results) => resolve(results.data) });
    });
  };

  // Handle File Selection with Progress Animation
  const handleFileChange = async (key: 'kscat' | 'pvf' | 'metrics', e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (key === 'kscat') setKscatFile(selectedFile);
    if (key === 'pvf') setPvfFile(selectedFile);
    if (key === 'metrics') setMetricsFile(selectedFile);

    const sizeInMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
    setFileReadStats((prev) => ({ ...prev, [key]: { name: selectedFile.name, sizeMb: sizeInMb } }));

    // Start Fill Animation
    setUploadStatus((prev) => ({ ...prev, [key]: 'active' }));
    setFillWidths((prev) => ({ ...prev, [key]: 0 }));

    const duration = 850 + Math.random() * 300;
    const startTime = performance.now();

    await new Promise<void>((resolve) => {
      const step = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / duration);
        setFillWidths((prev) => ({ ...prev, [key]: Number((progress * 64).toFixed(1)) }));

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });

    setUploadStatus((prev) => ({ ...prev, [key]: 'done' }));
    playUploadChime();
  };

  // Full CSV Processing and Backup Execution
  const handleProcessAndBackup = async () => {
    setIsError(false);
    if (!kscatFile || !pvfFile || !metricsFile) {
      setIsError(true);
      setStatusMsg('Validation Error: Upload all 3 CSV files (KSCAT Calc, PVF, Metrics).');
      return;
    }

    setLoading(true);
    setStatusMsg('Parsing uploaded operational sheets and updating database...');

    try {
      const kscatRows = await parseCSV(kscatFile);
      const pvfRows = await parseCSV(pvfFile);
      const metricsRows = await parseCSV(metricsFile);

      const { agentResults: kscatData, teamKscatTotals } = processKSCATCalc(kscatRows);
      const pvfData = processPVFFile(pvfRows);
      const { agentMetrics, teamAverages, floorAverages } = processMetricsFile(metricsRows);

      const allEmails = Array.from(new Set([...Object.keys(kscatData), ...Object.keys(agentMetrics), ...Object.keys(pvfData)]));

      const combinedRecords = allEmails.map((email) => {
        const k = kscatData[email] || {};
        const m = agentMetrics[email] || {};
        const p = pvfData[email] || {};

        return {
          period_id: periodId,
          agent_email: email,
          agent_name: email,
          csat: k.csat || 0,
          kscat: k.kscat || 0,
          dsat: k.dsat || 0,
          total_count: k.totalCount || 0,
          total_wo_karma: k.totalWoKarma || 0,
          kscat_percent: k.kscatPercent || 0,
          csat_percent: k.csatPercent || 0,
          variance: k.variance || 0,
          chat_csat: k.chatCsat || 0,
          chat_kscat: k.chatKscat || 0,
          chat_dsat: k.chatDsat || 0,
          phone_csat: k.phoneCsat || 0,
          phone_kscat: k.phoneKscat || 0,
          phone_dsat: k.phoneDsat || 0,
          tardy_minutes: p.tardyMinutes || 0,
          idle_time_avg: p.idleTimeAvg || 0,
          abt: m['Average basket time'] || 0,
          productivity_8hrs: m['Productivity 8-hrs'] || 0,
          productivity_online_8hrs: m['Productivity Online 8-hrs'] || 0,
          escalation_rate: m['Escalation rate %'] || 0,
          deescalation_rate: m['Deescalation rate %'] || 0,
          adherence: m['Adherence, %'] || 0,
          agbt: m['Average group basket time'] || 0,
          aht: m['Average handling time'] || 0,
          closed_after_resolution: m['Closed after resolution, %'] || 0,
          closed_tickets_pct: m['Closed tickets, %'] || 0,
          fcr_percent: m['FCR, %'] || 0,
        };
      });

      await supabase.from('agent_metrics').upsert(combinedRecords, { onConflict: 'period_id,agent_email' });

      // Save Team & Floor Aggregates
      const aggRecords: any[] = [];
      const combinedTeam: Record<string, any> = { ...teamAverages, ...teamKscatTotals };

      Object.keys(combinedTeam).forEach((key) => {
        aggRecords.push({
          period_id: periodId,
          level_type: 'Team Overall',
          team_or_floor_name: 'Support Tier 1',
          metric_key: key,
          metric_value: combinedTeam[key],
        });
      });

      Object.keys(floorAverages).forEach((key) => {
        aggRecords.push({
          period_id: periodId,
          level_type: 'Floor Average',
          team_or_floor_name: 'Floor 1',
          metric_key: key,
          metric_value: (floorAverages as Record<string, any>)[key],
        });
      });

      await supabase.from('level_aggregates').upsert(aggRecords, { onConflict: 'period_id,level_type,team_or_floor_name,metric_key' });

      await supabase.from('upload_history').upsert([
        {
          period_id: periodId,
          uploaded_by: currentUser?.user_email || 'admin',
          records_count: combinedRecords.length,
          files_uploaded: [kscatFile.name, pvfFile.name, metricsFile.name],
        },
      ], { onConflict: 'period_id' });

      playSaveChime();
      setIsError(false);
      setStatusMsg(`✓ Success! Saved ${combinedRecords.length} records for date period ${periodId}.`);
      fetchHistory();
      if (typeof refreshMetrics === 'function') refreshMetrics();
    } catch (e: any) {
      console.error(e);
      setIsError(true);
      setStatusMsg(`Error importing data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (historyId: string, targetPeriod: string) => {
    await supabase.from('agent_metrics').delete().eq('period_id', targetPeriod);
    await supabase.from('level_aggregates').delete().eq('period_id', targetPeriod);
    await supabase.from('upload_history').delete().filter('period_id', 'eq', targetPeriod);

    fetchHistory();
    if (typeof refreshMetrics === 'function') refreshMetrics();
  };

  const allFilesUploaded = uploadStatus.kscat === 'done' && uploadStatus.pvf === 'done' && uploadStatus.metrics === 'done';

  return (
    <div className="space-y-6 animate-fade-in-up max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
          <Database className="h-6 w-6 text-emerald-500" /> Upload Data & Backups
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Upload daily KSCAT Calc, PVF, and Metrics CSV files to refresh operational performance calculations
        </p>
      </div>

      {/* Date Selector Card */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080E1E] shadow-sm rounded-2xl">
        <CardContent className="pt-5 space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Reporting Period Date Identifier (YYYY-MM-DD)
          </label>
          <div className="relative">
            <Input
              type="date"
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              className="h-12 bg-slate-50 dark:bg-[#020208] border border-slate-200 dark:border-slate-800 rounded-xl px-4 font-mono font-bold text-slate-900 dark:text-emerald-400 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3 Interactive Animated Upload Cards */}
      <div className="space-y-4">
        {/* CARD 1: KSCAT Calc.csv */}
        <UploadCardItem
          id="1"
          defaultTitle="1. KSCAT Calc.csv"
          fileRef={kscatRef}
          status={uploadStatus.kscat}
          fillWidth={fillWidths.kscat}
          readStat={fileReadStats.kscat}
          onSelectClick={() => kscatRef.current?.click()}
          onFileChange={(e) => handleFileChange('kscat', e)}
        />

        {/* CARD 2: PVF.csv */}
        <UploadCardItem
          id="2"
          defaultTitle="2. PVF.csv"
          fileRef={pvfRef}
          status={uploadStatus.pvf}
          fillWidth={fillWidths.pvf}
          readStat={fileReadStats.pvf}
          onSelectClick={() => pvfRef.current?.click()}
          onFileChange={(e) => handleFileChange('pvf', e)}
        />

        {/* CARD 3: Metrics.csv */}
        <UploadCardItem
          id="3"
          defaultTitle="3. Metrics.csv"
          fileRef={metricsRef}
          status={uploadStatus.metrics}
          fillWidth={fillWidths.metrics}
          readStat={fileReadStats.metrics}
          onSelectClick={() => metricsRef.current?.click()}
          onFileChange={(e) => handleFileChange('metrics', e)}
        />
      </div>

      {/* Save Action & Status Message */}
      <div className="space-y-3 pt-2">
        <Button
          onClick={handleProcessAndBackup}
          disabled={!allFilesUploaded || loading}
          className={`w-full h-14 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
            allFilesUploaded && !loading
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-98'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed opacity-60'
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" /> Processing CSVs & Backing Up...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Save className="h-5 w-5" /> Save & Backup Date Period Data
            </span>
          )}
        </Button>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              isError
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {/* Backup Log Table */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080E1E] shadow-sm rounded-2xl mt-8">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <History className="h-4 w-4 text-emerald-500" /> Date Backup Log & Selective Purge
          </CardTitle>
          <CardDescription className="text-xs">History of uploaded performance backup datasets in Supabase</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 p-0">
          <div className="overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                  <TableHead className="font-bold">Date Period</TableHead>
                  <TableHead className="font-bold">Uploaded By</TableHead>
                  <TableHead className="font-bold">Records</TableHead>
                  <TableHead className="font-bold">Timestamp</TableHead>
                  <TableHead className="text-right font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadLogs.length > 0 ? (
                  uploadLogs.map((log) => (
                    <TableRow key={log.id || log.period_id} className="hover:bg-slate-500/5 border-b border-slate-100 dark:border-slate-800/50">
                      <TableCell className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{log.period_id}</TableCell>
                      <TableCell>{log.uploaded_by || 'Admin'}</TableCell>
                      <TableCell className="font-bold">{log.records_count ? `${log.records_count} rows` : 'Active Period'}</TableCell>
                      <TableCell>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteBackup(log.id, log.period_id)}
                          className="h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Purge
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-slate-400">
                      No backups found. Upload operational files above to create period snapshots.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Subcomponent: Animated Upload Card Item
function UploadCardItem({
  id,
  defaultTitle,
  fileRef,
  status,
  fillWidth,
  readStat,
  onSelectClick,
  onFileChange,
}: {
  id: string;
  defaultTitle: string;
  fileRef: React.RefObject<HTMLInputElement>;
  status: 'idle' | 'active' | 'done';
  fillWidth: number;
  readStat: { name: string; sizeMb: string };
  onSelectClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const isDone = status === 'done';
  const isActive = status === 'active';

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-300 p-6 text-center ${
        isDone
          ? 'border-solid border-slate-200 dark:border-slate-800 bg-emerald-500/5'
          : 'border-dashed border-emerald-500/40 bg-white/40 dark:bg-slate-900/20 hover:border-emerald-500/70'
      }`}
    >
      <input type="file" ref={fileRef} onChange={onFileChange} accept=".csv" className="hidden" />

      {/* File Icon */}
      <div className="mx-auto mb-3.5 w-9 h-9 flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h9l5 5v15H6z" />
          <path d="M15 2v5h5" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
      </div>

      <div className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">{defaultTitle}</div>

      {/* Upload Pill Control */}
      <button
        type="button"
        onClick={onSelectClick}
        className={`relative h-11 mx-auto rounded-xl border-none cursor-pointer bg-[#060a16] overflow-hidden p-0 transition-all duration-500 ease-out ${
          isActive || isDone ? 'w-52' : 'w-36'
        }`}
      >
        {/* Idle State Label */}
        <span
          className={`absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-100 transition-opacity duration-200 ${
            isActive || isDone ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          Select File
        </span>

        {/* Filling Green Bar */}
        <div
          className="absolute inset-0 bg-emerald-400 flex items-center pl-4 transition-all duration-100 ease-linear"
          style={{ width: `${fillWidth}%` }}
        >
          <span
            className={`text-[#06120c] font-black text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] transition-all duration-300 ${
              isDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
            }`}
          >
            {readStat.name || defaultTitle.split('. ')[1]}
          </span>
        </div>

        {/* Checkmark Panel */}
        <div className="absolute top-0 right-0 bottom-0 w-[36%] bg-emerald-500/20 flex items-center justify-center">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              d="M4 12.5 L9.5 18 L20 6"
              fill="none"
              stroke="#3ee6a8"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 28,
                strokeDashoffset: isDone ? 0 : 28,
                transition: 'stroke-dashoffset 0.35s cubic-bezier(0.65,0,0.35,1) 0.05s',
              }}
            />
          </svg>
        </div>
      </button>

      {/* Read Caption */}
      <div className={`text-xs text-slate-400 mt-2.5 h-4 transition-opacity duration-300 ${isDone ? 'opacity-100' : 'opacity-0'}`}>
        {readStat.sizeMb ? `${readStat.sizeMb} MB read` : ''}
      </div>
    </div>
  );
}
