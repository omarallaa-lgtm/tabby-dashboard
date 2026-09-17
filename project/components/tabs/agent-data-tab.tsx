'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(false);

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
    if (!kscatFile || !pvfFile || !metricsFile) {
      setStatusMsg('Validation Error: All 3 CSV files (KSCAT Calc, PVF, and Metrics) are required.');
      return;
    }

    setLoading(true);
    setStatusMsg('Parsing uploaded operational sheets...');

    try {
      const kscatRows = await parseCSV(kscatFile);
      const pvfRows = await parseCSV(pvfFile);
      const metricsRows = await parseCSV(metricsFile);

      // Execute Section 10-16 Official Formulas
      const kscatData = processKSCATCalc(kscatRows);
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
          agent_name: email.split('@')[0].replace('.', ' '),
          team_name: 'Support Tier 1',
          floor_name: 'Floor 1',
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

      // Upsert Agent Level Data
      const { error: agentErr } = await supabase.from('agent_metrics').upsert(combinedRecords, {
        onConflict: 'period_id,agent_email',
      });
      if (agentErr) throw agentErr;

      // Upsert Team & Floor Level Aggregates (L1:L22 and L25:L46)
      const aggRecords: any[] = [];
      Object.keys(teamAverages).forEach((key) => {
        aggRecords.push({
          period_id: periodId,
          level_type: 'Team Overall',
          team_or_floor_name: 'Support Tier 1',
          metric_key: key,
          metric_value: teamAverages[key],
        });
      });

      Object.keys(floorAverages).forEach((key) => {
        aggRecords.push({
          period_id: periodId,
          level_type: 'Floor Average',
          team_or_floor_name: 'Floor 1',
          metric_key: key,
          metric_value: floorAverages[key],
        });
      });

      await supabase.from('level_aggregates').upsert(aggRecords, {
        onConflict: 'period_id,level_type,team_or_floor_name,metric_key',
      });

      // Audit Log Record
      logAuditAction('DATA_IMPORT', `Period: ${periodId}, Records: ${combinedRecords.length}`);

      setStatusMsg(`✓ Success! Imported and calculated ${combinedRecords.length} agent metrics for period ${periodId}.`);
      if (typeof refreshMetrics === 'function') refreshMetrics();
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`Error importing data: ${e.message || 'Check CSV column structure'}`);
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
        <CardContent className="space-y-4">
          <div className="w-64 space-y-1">
            <label className="text-xs font-medium">Reporting Period Identifier</label>
            <Input
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              placeholder="e.g. 2026-W37 or Sep-2026"
              className="text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-emerald-500 transition-colors">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-xs font-semibold mb-1">1. Upload KSCAT Calc.csv</div>
              <input type="file" accept=".csv" onChange={(e) => setKscatFile(e.target.files?.[0] || null)} className="text-xs w-full" />
              {kscatFile && <p className="text-[10px] text-emerald-600 font-medium mt-1">✓ {kscatFile.name}</p>}
            </div>

            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-emerald-500 transition-colors">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-xs font-semibold mb-1">2. Upload PVF.csv</div>
              <input type="file" accept=".csv" onChange={(e) => setPvfFile(e.target.files?.[0] || null)} className="text-xs w-full" />
              {pvfFile && <p className="text-[10px] text-emerald-600 font-medium mt-1">✓ {pvfFile.name}</p>}
            </div>

            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-emerald-500 transition-colors">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
              <div className="text-xs font-semibold mb-1">3. Upload Metrics.csv</div>
              <input type="file" accept=".csv" onChange={(e) => setMetricsFile(e.target.files?.[0] || null)} className="text-xs w-full" />
              {metricsFile && <p className="text-[10px] text-emerald-600 font-medium mt-1">✓ {metricsFile.name}</p>}
            </div>
          </div>

          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
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
