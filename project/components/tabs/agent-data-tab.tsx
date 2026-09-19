'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, FileSpreadsheet, CheckCircle2, Upload, AlertCircle } from 'lucide-react';
import { processKSCATCalc, processMetricsFile, processPVFFile } from '@/lib/csv-parser';
import { supabase, useMetrics } from '@/lib/metrics-context';
import Papa from 'papaparse';

export function AgentDataTab() {
  const { refreshMetrics, logAuditAction } = useMetrics() as any;
  const [periodId, setPeriodId] = useState('2026-W37');
  
  const [kscatFile, setKscatFile] = useState<File | null>(null);
  const [pvfFile, setPvfFile] = useState<File | null>(null);
  const [metricsFile, setMetricsFile] = useState<File | null>(null);
  
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const kscatRef = useRef<HTMLInputElement>(null);
  const pvfRef = useRef<HTMLInputElement>(null);
  const metricsRef = useRef<HTMLInputElement>(null);

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => resolve(results.data),
      });
    });
  };

  const handleProcessAndBackup = async () => {
    setIsError(false);
    if (!kscatFile || !pvfFile || !metricsFile) {
      setIsError(true);
      setStatusMsg('Validation Error: Please upload all 3 CSV files (KSCAT Calc, PVF, and Metrics).');
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

      const allEmails = Array.from(
        new Set([
          ...Object.keys(kscatData),
          ...Object.keys(agentMetrics),
          ...Object.keys(pvfData),
        ])
      );

      const combinedRecords = allEmails.map((email) => {
        const k = kscatData[email] || {};
        const m = agentMetrics[email] || {};
        const p = pvfData[email] || {};

        return {
          period_id: periodId,
          agent_email: email,
          agent_name: email, // Preserves full user email (e.g. omar.allaa@tabby.ai)
          csat: k.csat || 0,
          kscat: k.kscat || 0,
          dsat: k.dsat || 0,
          total_count: k.totalCount || 0,
          total_wo_karma: k.totalWoKarma || 0,
          kscat_percent: k.kscatPercent || 0,
          csat_percent: k.csatPercent || 0,
          variance: k.variance || 0,
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

      const { error: agentErr } = await supabase.from('agent_metrics').upsert(combinedRecords, {
        onConflict: 'period_id,agent_email',
      });
      if (agentErr) throw agentErr;

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

      await supabase.from('level_aggregates').upsert(aggRecords, {
        onConflict: 'period_id,level_type,team_or_floor_name,metric_key',
      });

      if (typeof logAuditAction === 'function') {
        logAuditAction('DATA_IMPORT', `Period: ${periodId}, Records: ${combinedRecords.length}`);
      }

      setIsError(false);
      setStatusMsg(`✓ Success! Imported and saved ${combinedRecords.length} agent metrics for period ${periodId}.`);
      if (typeof refreshMetrics === 'function') refreshMetrics();
    } catch (e: any) {
      console.error(e);
      setIsError(true);
      setStatusMsg(`Error importing data: ${e.message || 'Check CSV structure'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Data Import & Period Retention</h2>
        <p className="text-xs text-muted-foreground">Upload operational sheets for performance calculations and period backups</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target Period Selection</CardTitle>
          <CardDescription className="text-xs">Historical reporting periods are retained and never deleted.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-64 space-y-1">
            <label className="text-xs font-medium">Reporting Period Identifier</label>
            <Input
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              placeholder="e.g. 2026-W37"
              className="text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="border-2 border-dashed rounded-lg p-5 text-center hover:border-emerald-500 transition-colors flex flex-col items-center justify-between min-h-[160px]">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 mb-1" />
              <div className="text-xs font-semibold">1. Upload KSCAT Calc.csv</div>
              <input type="file" ref={kscatRef} accept=".csv" onChange={(e) => setKscatFile(e.target.files?.[0] || null)} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => kscatRef.current?.click()} className="text-xs gap-1 mt-2">
                <Upload className="h-3 w-3" /> Select File
              </Button>
              {kscatFile && <p className="text-[10px] text-emerald-600 font-medium mt-2 truncate max-w-[200px]">✓ {kscatFile.name}</p>}
            </div>

            <div className="border-2 border-dashed rounded-lg p-5 text-center hover:border-emerald-500 transition-colors flex flex-col items-center justify-between min-h-[160px]">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 mb-1" />
              <div className="text-xs font-semibold">2. Upload PVF.csv</div>
              <input type="file" ref={pvfRef} accept=".csv" onChange={(e) => setPvfFile(e.target.files?.[0] || null)} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => pvfRef.current?.click()} className="text-xs gap-1 mt-2">
                <Upload className="h-3 w-3" /> Select File
              </Button>
              {pvfFile && <p className="text-[10px] text-emerald-600 font-medium mt-2 truncate max-w-[200px]">✓ {pvfFile.name}</p>}
            </div>

            <div className="border-2 border-dashed rounded-lg p-5 text-center hover:border-emerald-500 transition-colors flex flex-col items-center justify-between min-h-[160px]">
              <FileSpreadsheet className="h-8 w-8 text-emerald-600 mb-1" />
              <div className="text-xs font-semibold">3. Upload Metrics.csv</div>
              <input type="file" ref={metricsRef} accept=".csv" onChange={(e) => setMetricsFile(e.target.files?.[0] || null)} className="hidden" />
              <Button type="button" variant="outline" size="sm" onClick={() => metricsRef.current?.click()} className="text-xs gap-1 mt-2">
                <Upload className="h-3 w-3" /> Select File
              </Button>
              {metricsFile && <p className="text-[10px] text-emerald-600 font-medium mt-2 truncate max-w-[200px]">✓ {metricsFile.name}</p>}
            </div>
          </div>

          {statusMsg && (
            <div className={`p-3 rounded-md text-xs flex items-center gap-2 ${
              isError ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            }`}>
              {isError ? <AlertCircle className="h-4 w-4 text-red-600 shrink-0" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={handleProcessAndBackup} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs">
              <Save className="h-4 w-4" /> Save & Backup Period Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
