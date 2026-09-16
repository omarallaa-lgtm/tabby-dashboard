'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useMetrics } from '@/lib/metrics-context';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykmolxjrvhdrnocktxcw.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export interface UploadedAgentRow {
  id: string;
  name: string;
  csat: number;
  dsat: number;
  aht: string;
  ahtSeconds: number;
  adherence: number;
  date: string;
}

function parseAhtString(ahtRaw: string): { minutes: number; seconds: number; totalSeconds: number } {
  if (!ahtRaw) return { minutes: 0, seconds: 0, totalSeconds: 0 };
  const str = String(ahtRaw).trim();
  if (str.includes(':')) {
    const parts = str.split(':').map((p) => parseInt(p, 10) || 0);
    if (parts.length === 3) {
      const totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      return { minutes: Math.floor(totalSeconds / 60), seconds: totalSeconds % 60, totalSeconds };
    }
    const totalSeconds = parts[0] * 60 + parts[1];
    return { minutes: parts[0], seconds: parts[1], totalSeconds };
  }
  const val = parseFloat(str) || 0;
  const minutes = Math.floor(val);
  const seconds = Math.round((val - minutes) * 60);
  return { minutes, seconds, totalSeconds: Math.round(val * 60) };
}

export function UploadButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const metricsContext = useMetrics() as any;
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFile = async (file: File) => {
    setStatus('uploading');
    setMessage('Parsing file and saving to database...');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (rows.length === 0) {
        setStatus('error');
        setMessage('File is empty or could not be parsed.');
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

      if (!nameKey || !csatKey || !dsatKey || !ahtKey || !adherenceKey) {
        setStatus('error');
        setMessage('Missing required columns. Expected: Agent Name, CSAT, DSAT, AHT, Adherence, Date.');
        return;
      }

      const parsed: UploadedAgentRow[] = rows
        .map((row, i) => {
          const name = String(row[nameKey] || '').trim();
          const csat = parseFloat(String(row[csatKey])) || 0;
          const dsat = parseInt(String(row[dsatKey])) || 0;
          const ahtRaw = String(row[ahtKey] || '0');
          const { minutes, seconds, totalSeconds } = parseAhtString(ahtRaw);
          const adherence = parseFloat(String(row[adherenceKey])) || 0;
          const date = dateKey ? String(row[dateKey] || '').trim() : '';

          return {
            id: `upload-${Date.now()}-${i}`,
            name,
            csat,
            dsat,
            aht: `${minutes}:${seconds.toString().padStart(2, '0')}`,
            ahtSeconds: totalSeconds,
            adherence,
            date,
          };
        })
        .filter((r) => r.name.length > 0);

      if (parsed.length === 0) {
        setStatus('error');
        setMessage('No valid agent rows found after parsing.');
        return;
      }

      // 1. Save rows to Supabase database
      if (supabase) {
        const dbPayload = parsed.map((item) => ({
          id: item.id,
          name: item.name,
          csat: item.csat,
          dsat: item.dsat,
          aht: item.aht,
          aht_seconds: item.ahtSeconds,
          adherence: item.adherence,
          date: item.date,
        }));

        const { error } = await supabase.from('agent_metrics').upsert(dbPayload);

        if (error) {
          console.error('Supabase save error:', error);
        }
      }

      // 2. Update active local UI state
      if (typeof metricsContext.setAgents === 'function') {
        metricsContext.setAgents(parsed);
      } else if (typeof metricsContext.setAgentMetrics === 'function') {
        metricsContext.setAgentMetrics(parsed);
      }

      setStatus('success');
      setMessage(`Saved ${parsed.length} agent rows to Cloud Database.`);
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMessage('Could not process file. Please upload a valid CSV or Excel file.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      <Button
        variant="outline"
        size="sm"
        disabled={status === 'uploading'}
        onClick={() => fileRef.current?.click()}
        className="gap-1.5"
      >
        {status === 'uploading' ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UploadCloud className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {status === 'uploading' ? 'Saving to Cloud...' : 'Upload Data'}
        </span>
      </Button>
      {status === 'success' && (
        <div className="flex items-center gap-1 text-xs font-medium text-green-600 animate-fade-in-up">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">{message}</span>
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-1 text-xs font-medium text-red-500 animate-fade-in-up">
          <AlertCircle className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">{message}</span>
        </div>
      )}
    </div>
  );
}