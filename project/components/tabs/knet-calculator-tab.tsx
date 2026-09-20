'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Calculator, Copy, Plus, Trash2, Check, RefreshCw, Sparkles, DollarSign, Wallet } from 'lucide-react';

interface CalcRow {
  id: string;
  deductedAmount: string;
  installmentAmount: string;
  orderNumber: string;
  existingWallet: string;
  installmentNumber: string;
  additionalNote: string;
}

export function KnetCalculatorTab() {
  const [rows, setRows] = useState<CalcRow[]>([
    {
      id: '1',
      deductedAmount: '256.361',
      installmentAmount: '249.500',
      orderNumber: '10293847',
      existingWallet: '0.000',
      installmentNumber: '1st',
      additionalNote: 'K-net Charges',
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        id: String(Date.now()),
        deductedAmount: '',
        installmentAmount: '',
        orderNumber: '',
        existingWallet: '0.000',
        installmentNumber: `${rows.length + 1}th`,
        additionalNote: 'K-net Charges',
      },
    ]);
  };

  const handleUpdateRow = (id: string, field: keyof CalcRow, value: string) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const handleDeleteRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const handleReset = () => {
    setRows([
      {
        id: '1',
        deductedAmount: '',
        installmentAmount: '',
        orderNumber: '',
        existingWallet: '0.000',
        installmentNumber: '1st',
        additionalNote: 'K-net Charges',
      },
    ]);
  };

  const computeRow = (row: CalcRow) => {
    const deducted = parseFloat(row.deductedAmount) || 0;
    const installment = parseFloat(row.installmentAmount) || 0;
    const existing = parseFloat(row.existingWallet) || 0;

    const diff = deducted > 0 && installment > 0 ? deducted - installment : 0;
    const totalWallet = diff + existing;

    const walletNote = row.deductedAmount
      ? `Extra Charge KNET ( ${row.orderNumber || 'N/A'} ) ${row.installmentNumber || ''} Installment`
      : '-';

    const customerBreakdown = row.installmentAmount && row.deductedAmount
      ? `(${row.installmentNumber || '1st'}) Installment → Original amount (${installment.toFixed(3)}) → Deducted amount (${deducted.toFixed(3)}) → Difference (${diff.toFixed(3)})`
      : '-';

    return { diff, totalWallet, walletNote, customerBreakdown };
  };

  const handleCopyText = (text: string, labelId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(labelId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const grandTotalDiff = rows.reduce((acc, r) => acc + computeRow(r).diff, 0);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Calculator className="h-6 w-6 text-emerald-500" /> KNET & Installments Over-Deduction Calculator
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Calculate KNET fee differences, wallet compensations, and generate official customer communication notes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="h-9 text-xs gap-1.5 border-slate-300 dark:border-slate-800">
            <RefreshCw className="h-3.5 w-3.5" /> Reset Calculator
          </Button>
          <Button size="sm" onClick={handleAddRow} className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            <Plus className="h-4 w-4" /> Add Installment Row
          </Button>
        </div>
      </div>

      {/* Summary KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-emerald-500/30 bg-emerald-500/5 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total Compensation Difference</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {grandTotalDiff.toFixed(3)} <span className="text-xs font-normal">KWD</span>
              </div>
            </div>
            <Wallet className="h-8 w-8 text-emerald-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border border-blue-500/30 bg-blue-500/5 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Active Installment Rows</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{rows.length}</div>
            </div>
            <Sparkles className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card className="border border-purple-500/30 bg-purple-500/5 dark:bg-slate-900">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Calculation Standard</div>
              <div className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-1">3 Decimal Precision (KWD)</div>
            </div>
            <DollarSign className="h-8 w-8 text-purple-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Interactive Table */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Calculator className="h-4 w-4 text-emerald-500" /> Interactive Installments Matrix
          </CardTitle>
          <CardDescription className="text-xs">
            Type values into the input columns to view automated calculations and copy notes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table className="text-xs min-w-[1100px]">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/80">
                  <TableHead className="w-28 font-bold">Deducted Amt</TableHead>
                  <TableHead className="w-28 font-bold">Installment Amt</TableHead>
                  <TableHead className="w-28 font-bold">Order No.</TableHead>
                  <TableHead className="w-24 font-bold">Inst #</TableHead>
                  <TableHead className="w-28 font-bold">Existing Wallet</TableHead>
                  <TableHead className="w-28 font-bold text-emerald-600 dark:text-emerald-400">Difference</TableHead>
                  <TableHead className="w-32 font-bold text-blue-600 dark:text-blue-400">Total Wallet</TableHead>
                  <TableHead className="font-bold">Wallet Note</TableHead>
                  <TableHead className="w-12 text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const computed = computeRow(row);
                  return (
                    <TableRow key={row.id} className="hover:bg-slate-500/5">
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="256.361"
                          value={row.deductedAmount}
                          onChange={(e) => handleUpdateRow(row.id, 'deductedAmount', e.target.value)}
                          className="h-8 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="249.500"
                          value={row.installmentAmount}
                          onChange={(e) => handleUpdateRow(row.id, 'installmentAmount', e.target.value)}
                          className="h-8 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="Order ID"
                          value={row.orderNumber}
                          onChange={(e) => handleUpdateRow(row.id, 'orderNumber', e.target.value)}
                          className="h-8 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          placeholder="1st"
                          value={row.installmentNumber}
                          onChange={(e) => handleUpdateRow(row.id, 'installmentNumber', e.target.value)}
                          className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0.000"
                          value={row.existingWallet}
                          onChange={(e) => handleUpdateRow(row.id, 'existingWallet', e.target.value)}
                          className="h-8 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                        />
                      </TableCell>
                      <TableCell className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {computed.diff.toFixed(3)}
                      </TableCell>
                      <TableCell className="font-mono font-black text-blue-600 dark:text-blue-400 text-sm">
                        {computed.totalWallet.toFixed(3)}
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[11px] truncate text-slate-700 dark:text-slate-300">
                            {computed.walletNote}
                          </span>
                          {computed.walletNote !== '-' && (
                            <button
                              onClick={() => handleCopyText(computed.walletNote, `wn-${row.id}`)}
                              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded shrink-0"
                              title="Copy Wallet Note"
                            >
                              {copiedId === `wn-${row.id}` ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                            </button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRow(row.id)}
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Formatted Customer Response Breakdown Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Copy className="h-4 w-4 text-emerald-500" /> Generated Customer Communication Snippets
        </h3>

        {rows.map((row, idx) => {
          const computed = computeRow(row);
          if (computed.customerBreakdown === '-') return null;

          return (
            <Card key={row.id} className="border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 shadow-2xs">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400">
                    Row #{idx + 1} Customer Breakdown Text:
                  </div>
                  <p className="font-mono text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {computed.customerBreakdown}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleCopyText(computed.customerBreakdown, `cb-${row.id}`)}
                  className="h-8 text-xs font-bold gap-1.5 shrink-0 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800"
                >
                  {copiedId === `cb-${row.id}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId === `cb-${row.id}` ? 'Copied!' : 'Copy Breakdown'}</span>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
