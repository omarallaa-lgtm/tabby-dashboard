'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { useMetrics, parseAhtString, type UploadedAgentRow } from '@/lib/metrics-context';

export function UploadButton() {
  const fileRef = useRef<HTMLInputElement>(null);
  const { setAgents } = useMetrics();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleFile = async (file: File) => {
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

      const parsed: UploadedAgentRow[] = rows.map((row, i) => {
        const name = String(row[nameKey] || '').trim();
        const csat = parseFloat(String(row[csatKey])) || 0;
        const dsat = parseInt(String(row[dsatKey])) || 0;
        const ahtRaw = String(row[ahtKey] || '0');
        const { minutes, seconds, totalSeconds } = parseAhtString(ahtRaw);
        const adherence = parseFloat(String(row[adherenceKey])) || 0;
        const date = dateKey ? String(row[dateKey] || '').trim() : '';

        return {
          id: `upload-${i}`,
          name,
          csat,
          dsat,
          aht: `${minutes}:${seconds.toString().padStart(2, '0')}`,
          ahtSeconds: totalSeconds,
          adherence,
          date,
        };
      }).filter((r) => r.name.length > 0);

      if (parsed.length === 0) {
        setStatus('error');
        setMessage('No valid agent rows found after parsing.');
        return;
      }

      setAgents(parsed);
      setStatus('success');
      setMessage(`Parsed ${parsed.length} agent rows. KPIs recalculated.`);
    } catch {
      setStatus('error');
      setMessage('Could not read this file. Please upload a valid CSV or Excel file.');
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
        onClick={() => fileRef.current?.click()}
        className="gap-1.5"
      >
        <UploadCloud className="h-4 w-4" />
        <span className="hidden sm:inline">Upload Data</span>
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
