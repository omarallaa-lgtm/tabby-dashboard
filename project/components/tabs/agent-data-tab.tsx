'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMetrics } from '@/lib/metrics-context';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export function AgentDataTab() {
  const metricsContext = useMetrics() as any;
  const [saving, setSaving] = useState(false);
  const [parsedMap, setParsedMap] = useState<Record<string, any>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanNum = (val: any) => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val).replace(/[%$,]/g, '').trim();
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const getAgentKey = (raw: string) => {
    let cleaned = raw.toLowerCase().trim();
    if (cleaned.includes('@')) {
      cleaned = cleaned.split('@')[0];
    }
    return cleaned.replace(/[^a-z0-9]/g, '');
  };

  const formatAgentName = (raw: string) => {
    if (raw.includes('@')) {
      const part = raw.split('@')[0];
      return part.split('.').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    return raw;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rows.length === 0) {
        setStatusType('error');
        setStatusMessage(`File ${file.name} is empty.`);
        return;
      }

      const updatedMap = { ...parsedMap };

      // Case 1: KSCAT Calc.csv
      if (rows[0]['resolver'] !== undefined || rows[0]['csat'] !== undefined) {
        rows.forEach((row) => {
          const rawName = String(row['resolver'] || row['assignee'] || '').trim();
          if (!rawName || rawName.toLowerCase() === 'total') return;

          const key = getAgentKey(rawName);
          const csatVal = String(row['csat'] || '').toLowerCase();

          if (!updatedMap[key]) {
            updatedMap[key] = {
              id: `agent-${key}`,
              name: formatAgentName(rawName),
              csat: 0,
              kscat: 0,
              dsat: 0,
              total_count: 0,
              total_wo_karma: 0,
              kscat_percent: 0,
              csat_percent: 0,
              variance: 0,
              abt: 0,
              productivity_8hrs: 0,
              productivity_online_8hrs: 0,
              escalation_rate: 0,
              deescalation_rate: 0,
              adherence: 0,
              agbt: 0,
              aht: '0:00',
              closed_after_res_percent: 0,
              closed_tickets_percent: 0,
              fcr_percent: 0,
              tardy_minutes: 0,
              idle_time: 0,
              date: new Date().toISOString().split('T')[0],
            };
          }

          if (csatVal === 'good') {
            updatedMap[key].csat += 1;
            updatedMap[key].kscat += 1;
          } else if (csatVal === 'bad') {
            updatedMap[key].dsat += 1;
          }
          updatedMap[key].total_count = updatedMap[key].csat + updatedMap[key].dsat;
          updatedMap[key].kscat_percent = updatedMap[key].total_count > 0 
            ? Math.round((updatedMap[key].csat / updatedMap[key].total_count) * 1000) / 10 
            : 0;
        });
      }
      // Case 2: Metrics.csv
      else if (rows[0]['Agent'] !== undefined || rows[0]['Unnamed: 3'] !== undefined) {
        rows.forEach((row) => {
          const rawName = String(row['Agent'] || '').trim();
          if (!rawName || rawName.toLowerCase() === 'total') return;

          const key = getAgentKey(rawName);
          const metricName = String(row['Unnamed: 3'] || '').trim().toLowerCase();
          const valStr = row['1/9/2026'] || row[Object.keys(row)[4]] || '';

          if (!updatedMap[key]) {
            updatedMap[key] = {
              id: `agent-${key}`,
              name: formatAgentName(rawName),
              csat: 0, kscat: 0, dsat: 0, total_count: 0, total_wo_karma: 0,
              kscat_percent: 0, csat_percent: 0, variance: 0, abt: 0,
              productivity_8hrs: 0, productivity_online_8hrs: 0, escalation_rate: 0,
              deescalation_rate: 0, adherence: 0, agbt: 0, aht: '0:00',
              closed_after_res_percent: 0, closed_tickets_percent: 0, fcr_percent: 0,
              tardy_minutes: 0, idle_time: 0, date: new Date().toISOString().split('T')[0],
            };
          }

          const num = cleanNum(valStr);
          if (metricName.includes('average basket time')) updatedMap[key].abt = num;
          if (metricName.includes('productivity 8-hrs')) updatedMap[key].productivity_8hrs = num;
          if (metricName.includes('productivity online 8-hrs')) updatedMap[key].productivity_online_8hrs = num;
          if (metricName.includes('escalation rate')) updatedMap[key].escalation_rate = num;
          if (metricName.includes('deescalation rate')) updatedMap[key].deescalation_rate = num;
          if (metricName.includes('adherence')) updatedMap[key].adherence = num;
          if (metricName.includes('average group basket time')) updatedMap[key].agbt = num;
          if (metricName.includes('average handling time')) updatedMap[key].aht = String(valStr || '0:00');
          if (metricName.includes('csat adjusted - total scores')) updatedMap[key].total_wo_karma = num;
          if (metricName.includes('csat adjusted with calls')) updatedMap[key].csat_percent = num;
          if (metricName.includes('closed after resolution')) updatedMap[key].closed_after_res_percent = num;
          if (metricName.includes('closed tickets, %')) updatedMap[key].closed_tickets_percent = num;
          if (metricName.includes('fcr')) updatedMap[key].fcr_percent = num;
        });
      }
      // Case 3: PVF.csv
      else if (rows[0]['agent_email (clickable)'] !== undefined) {
        rows.forEach((row) => {
          const rawName = String(row['agent_email (clickable)'] || '').trim();
          if (!rawName) return;

          const key = getAgentKey(rawName);
          if (!updatedMap[key]) {
            updatedMap[key] = {
              id: `agent-${key}`,
              name: formatAgentName(rawName),
              csat: 0, kscat: 0, dsat: 0, total_count: 0, total_wo_karma: 0,
              kscat_percent: 0, csat_percent: 0, variance: 0, abt: 0,
              productivity_8hrs: 0, productivity_online_8hrs: 0, escalation_rate: 0,
              deescalation_rate: 0, adherence: 0, agbt: 0, aht: '0:00',
              closed_after_res_percent: 0, closed_tickets_percent: 0, fcr_percent: 0,
              tardy_minutes: 0, idle_time: 0, date: new Date().toISOString().split('T')[0],
            };
          }

          const notWorkingH = cleanNum(row['time_not_working_h']);
          const idleH = cleanNum(row['time_without_tickets_h']);
          updatedMap[key].tardy_minutes += Math.round(notWorkingH * 60);
          updatedMap[key].idle_time += Math.round(idleH * 10) / 10;
        });
      }

      // Compute variance for all agents
      Object.keys(updatedMap).forEach((k) => {
        const item = updatedMap[k];
        item.variance = Math.round((item.csat_percent - item.kscat_percent) * 100) / 100;
      });

      setParsedMap(updatedMap);
      const agentArray = Object.values(updatedMap);

      if (typeof metricsContext?.setAgents === 'function') {
        metricsContext.setAgents(agentArray);
      }

      setStatusType('success');
      setStatusMessage(`Successfully processed ${file.name}. Total active agents merged: ${agentArray.length}.`);
    } catch (err) {
      console.error(err);
      setStatusType('error');
      setStatusMessage(`Failed to process ${file.name}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveUnifiedBackup = async () => {
    const payload = Object.values(parsedMap);

    if (payload.length === 0) {
      setStatusType('error');
      setStatusMessage('No parsed data available. Please upload your CSV files first.');
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const { error } = await supabase.from('agent_metrics').upsert(payload);

      if (error) {
        console.error('Supabase error:', error);
        setStatusType('error');
        setStatusMessage(`Supabase insert error: ${error.message}`);
      } else {
        setStatusType('success');
        setStatusMessage(`Successfully saved ${payload.length} unique agent profiles to Supabase!`);
      }
    } catch (err: any) {
      console.error('Backup error:', err);
      setStatusType('error');
      setStatusMessage('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSelect} />

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Agent Data</h2>
        <p className="text-muted-foreground">Real-time contact center performance at a glance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Ingestion Settings</CardTitle>
          <CardDescription>Upload the 3 operational sheets to process all KPI calculations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-600 rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all cursor-pointer"
            >
              <UploadCloud className="h-8 w-8 text-emerald-600" />
              <span className="font-medium text-sm">1. Upload KSCAT Calc.csv</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-600 rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all cursor-pointer"
            >
              <UploadCloud className="h-8 w-8 text-emerald-600" />
              <span className="font-medium text-sm">2. Upload PVF.csv</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-600 rounded-lg p-6 flex flex-col items-center justify-center gap-2 bg-emerald-50/10 hover:bg-emerald-50/20 transition-all cursor-pointer"
            >
              <UploadCloud className="h-8 w-8 text-emerald-600" />
              <span className="font-medium text-sm">3. Upload Metrics.csv</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-4">
            {statusMessage ? (
              <div className={`flex items-center gap-2 text-sm font-medium ${statusType === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                {statusType === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{statusMessage}</span>
              </div>
            ) : <div />}

            <Button
              onClick={handleSaveUnifiedBackup}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 ml-auto"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              {saving ? 'Saving to Database...' : 'Save Unified Backup'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}