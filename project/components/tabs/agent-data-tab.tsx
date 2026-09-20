'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Save, FileSpreadsheet, CheckCircle2, Upload, AlertCircle, Trash2, History } from 'lucide-react';
import { processKSCATCalc, processMetricsFile, processPVFFile } from '@/lib/csv-parser';
import { supabase, useMetrics } from '@/lib/metrics-context';
import Papa from 'papaparse';

export function AgentDataTab() {
  const { refreshMetrics, currentUser } = useMetrics() as any;
  const [periodId, setPeriodId] = useState(() => new Date().toISOString().split('T')[0]); // Date format YYYY-MM-DD
  const [uploadLogs, setUploadLogs] = useState<any[]>([]);
  
  const [kscatFile, setKscatFile] = useState<File | null>(null);
  const [pvfFile, setPvfFile] = useState<File | null>(null);
  const [metricsFile, setMetricsFile] = useState<File | null>(null);
  
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const kscatRef = useRef<HTMLInputElement>(null);
  const pvfRef = useRef<HTMLInputElement>(null);
  const metricsRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    const { data } = await supabase.from('upload_history').select('*').order('created_at', { ascending: false });
    if (data) setUploadLogs(data);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve) => {
      Papa.parse(file, { header: true, skipEmptyLines: true, complete: (results) => resolve(results.data) });
    });
  };

  const handleProcessAndBackup = async () => {
    setIsError(false);
    if (!kscatFile || !pvfFile || !metricsFile) {
      setIsError(true);
      setStatusMsg('Validation Error: Upload all 3 CSV files (KSCAT Calc, PVF, Metrics).');
      return;
    }

    setLoading(true);
    setStatusMsg('Parsing uploaded operational sheets...');

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

      await supabase.from('upload_history').insert([
        {
          period_id: periodId,
          uploaded_by: currentUser?.user_email || 'admin',
          records_count: combinedRecords.length,
          files_uploaded: [kscatFile.name, pvfFile.name, metricsFile.name],
        },
      ]);

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
    await supabase.from('upload_history').delete().eq('id', historyId);

    fetchHistory();
    if (typeof refreshMetrics === 'function') refreshMetrics();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Import & Date Period Backups</h2>
        <p className="text-xs text-muted-foreground">Upload operational files named by day and manage historical backups in Supabase</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload & Date Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-64 space-y-1">
            <label className="text-xs font-medium">Reporting Period Date Identifier (YYYY-MM-DD)</label>
            <Input type="date" value={periodId} onChange={(e) => setPeriodId(e.target.value)} className="text-xs h-9" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="border-2 border-dashed rounded-lg p-5 text-center hover:border-emerald-500 flex flex-col items-center justify-between min-h-[160px]">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 mb-1" />
              <div className="text-xs font-semibold">1. KSCAT Calc.csv</div>
              <input type="file" ref={kscatRef} accept=".csv" onChange={(e) => setKscatFile(e.target.files?.[0] || null)} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => kscatRef.current?.click()} className="text-xs mt-2">Select File</Button>
              {kscatFile && <p className="text-[10px] text-emerald-600 mt-2 truncate max-w-[200px]">✓ {kscatFile.name}</p>}
            </div>

            <div className="border-2 border-dashed rounded-lg p-5 text-center hover:border-emerald-500 flex flex-col items-center justify-between min-h-[160px]">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 mb-1" />
              <div className="text-xs font-semibold">2. PVF.csv</div>
              <input type="file" ref={pvfRef} accept=".csv" onChange={(e) => setPvfFile(e.target.files?.[0] || null)} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => pvfRef.current?.click()} className="text-xs mt-2">Select File</Button>
              {pvfFile && <p className="text-[10px] text-emerald-600 mt-2 truncate max-w-[200px]">✓ {pvfFile.name}</p>}
            </div>

            <div className="border-2 border-dashed rounded-lg p-5 text-center hover:border-emerald-500 flex flex-col items-center justify-between min-h-[160px]">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 mb-1" />
              <div className="text-xs font-semibold">3. Metrics.csv</div>
              <input type="file" ref={metricsRef} accept=".csv" onChange={(e) => setMetricsFile(e.target.files?.[0] || null)} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => metricsRef.current?.click()} className="text-xs mt-2">Select File</Button>
              {metricsFile && <p className="text-[10px] text-emerald-600 mt-2 truncate max-w-[200px]">✓ {metricsFile.name}</p>}
            </div>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${isError ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'}`}>
              {isError ? <AlertCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleProcessAndBackup} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2">
              <Save className="h-4 w-4" /> Save & Backup Date Period Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5 text-emerald-600" /> Date Backup Log & Selective Purge
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead>Date Period</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploadLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-bold">{log.period_id}</TableCell>
                    <TableCell>{log.uploaded_by}</TableCell>
                    <TableCell>{log.records_count} rows</TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBackup(log.id, log.period_id)}
                        className="text-red-500 hover:text-red-700 h-6 px-2 text-[10px]"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Purge Backup
                      </Button>
                    </TableCell>
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
