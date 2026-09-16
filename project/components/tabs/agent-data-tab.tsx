'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMetrics } from '@/lib/metrics-context';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export function AgentDataTab() {
  const metricsContext = useMetrics() as any;
  const [saving, setSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const headerKeys = Object.keys(rows[0]);
      const findKey = (candidates: string[]): string | undefined => {
        return headerKeys.find((k) =>
          candidates.some((c) => k.toLowerCase().replace(/[\s_]/g, '').includes(c.toLowerCase().replace(/[\s_]/g, '')))
        );
      };

      const nameKey = findKey(['Agent Name', 'AgentName', 'Name', 'Agent']);
      const csatKey = findKey(['CSAT']);
      const dsatKey = findKey(['DSAT']);
      const ahtKey = findKey(['AHT', 'AverageHandleTime', 'HandleTime']);
      const adherenceKey = findKey(['Adherence']);
      const dateKey = findKey(['Date']);

      const parsed = rows
        .map((row, i) => {
          const name = nameKey ? String(row[nameKey] || '').trim() : `Agent ${i + 1}`;
          const csat = csatKey ? parseFloat(String(row[csatKey])) || 0 : 0;
          const dsat = dsatKey ? parseInt(String(row[dsatKey]), 10) || 0 : 0;
          const aht = ahtKey ? String(row[ahtKey] || '0:00') : '0:00';
          const adherence = adherenceKey ? parseFloat(String(row[adherenceKey])) || 0 : 0;
          const date = dateKey ? String(row[dateKey] || '').trim() : new Date().toISOString().split('T')[0];

          return {
            id: `agent-${Date.now()}-${i}`,
            name,
            csat,
            dsat,
            aht,
            aht_seconds: 0,
            adherence,
            date,
          };
        })
        .filter((r) => r.name.length > 0);

      setParsedData((prev) => [...prev, ...parsed]);

      if (typeof metricsContext?.setAgents === 'function') {
        metricsContext.setAgents((prev: any[]) => [...(prev || []), ...parsed]);
      }

      setStatusType('success');
      setStatusMessage(`Parsed ${parsed.length} rows from ${file.name}. Ready to save.`);
    } catch (err) {
      console.error(err);
      setStatusType('error');
      setStatusMessage(`Failed to process ${file.name}`);
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveUnifiedBackup = async () => {
    const dataToSave = parsedData.length > 0 ? parsedData : metricsContext?.agents || [];

    if (!dataToSave || dataToSave.length === 0) {
      setStatusType('error');
      setStatusMessage('No agent data found. Click an upload slot above to pick your CSV file first.');
      return;
    }

    setSaving(true);
    setStatusMessage(null);

    try {
      const dbPayload = dataToSave.map((agent: any, index: number) => ({
        id: String(agent.id || `agent-${Date.now()}-${index}`),
        name: String(agent.name || 'Unknown Agent'),
        csat: Number(agent.csat) || 0,
        dsat: Number(agent.dsat) || 0,
        aht: String(agent.aht || '0:00'),
        aht_seconds: Number(agent.aht_seconds || agent.ahtSeconds) || 0,
        adherence: Number(agent.adherence) || 0,
        date: String(agent.date || new Date().toISOString().split('T')[0]),
      }));

      if (!supabase) {
        setStatusType('success');
        setStatusMessage(`Saved ${dbPayload.length} records locally in memory. Configure Supabase to persist them.`);
        return;
      }

      const { error } = await supabase.from('agent_metrics').upsert(dbPayload);

      if (error) {
        console.error('Supabase error:', error);
        setStatusType('error');
        setStatusMessage(`Supabase error: ${error.message}`);
      } else {
        setStatusType('success');
        setStatusMessage(`Successfully saved ${dbPayload.length} records to Supabase!`);
      }
    } catch (err: any) {
      console.error('Backup error:', err);
      setStatusType('error');
      setStatusMessage('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileSelect}
      />

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