'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import {
  Calculator, Copy, Plus, Trash2, Check, RefreshCw, Sparkles, DollarSign, Wallet, FileText,
  Link2, ExternalLink, Minimize2, Maximize2, ClipboardPaste, Eraser, Zap, ChevronsDownUp, ChevronsUpDown, FileDown,
} from 'lucide-react';
import { DisputeFormGenerator } from '@/components/dispute-form-generator';

interface CalcRow {
  id: string;
  deductedAmount: string;
  installmentAmount: string;
  orderNumber: string;
  existingWallet: string;
  installmentNumber: string; // 1st, 2nd, 3rd, 4th
  additionalNote: string;
}

interface BoRow {
  id: string;
  customerId: string;
  purchaseId: string;
}

// ---------- Back Office link helpers ----------
const BO_BASE = 'https://backoffice.tabby.ai/customers/';
const BO_STORAGE_KEY = 'tabby-bo-rows'; // sessionStorage: cleared when the browser tab is closed
const CALC_MIN_KEY = 'tabby-calc-minimized'; // localStorage: remembers the minimized state (older key)
const MIN_KEY = 'tabby-shortcuts-minimized'; // localStorage: which Shortcuts sections are minimized
type SectionKey = 'calc' | 'bo' | 'dispute';

let boCounter = 0;
const newBoRow = (customerId = '', purchaseId = ''): BoRow => {
  boCounter += 1;
  return { id: `bo-${Date.now()}-${boCounter}`, customerId, purchaseId };
};

// Same result as the Google Sheets formula:
// =IF(OR(A="",B=""),"",HYPERLINK("https://backoffice.tabby.ai/customers/"&A&"?tab=product."&B, ...))
const buildBoLink = (customerId: string, purchaseId: string) => {
  const c = customerId.trim();
  const p = purchaseId.trim();
  if (!c || !p) return '';
  return `${BO_BASE}${encodeURIComponent(c)}?tab=product.${encodeURIComponent(p)}`;
};

// Understands text copied from Google Sheets (tab separated) or typed with commas/spaces, one pair per line
const parsePairs = (text: string): [string, string][] =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const t = l.split(/[\t,;\s]+/).filter(Boolean);
      return [t[0] || '', t[1] || ''] as [string, string];
    });

// Always keep one empty row at the bottom, ready for the next order
const withTrailingBlank = (rows: BoRow[]): BoRow[] => {
  const last = rows[rows.length - 1];
  if (!last || last.customerId.trim() || last.purchaseId.trim()) return [...rows, newBoRow()];
  return rows;
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function KnetCalculatorTab() {
  // ---------- Calculator state ----------
  const [rows, setRows] = useState<CalcRow[]>([
    {
      id: '1',
      deductedAmount: '0.000',
      installmentAmount: '0.000',
      orderNumber: '',
      existingWallet: '0.000',
      installmentNumber: '1st',
      additionalNote: 'K-net Charges',
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [minimized, setMinimized] = useState<Record<SectionKey, boolean>>({ calc: false, bo: false, dispute: false });
  const calcMinimized = minimized.calc;

  // ---------- Back Office generator state ----------
  const [boRows, setBoRows] = useState<BoRow[]>([newBoRow(), newBoRow(), newBoRow()]);
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Restore saved state (tabs unmount when you switch away, so this keeps your work)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(BO_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length) {
          setBoRows(
            withTrailingBlank(
              parsed.map((r: any) => newBoRow(String(r?.customerId ?? ''), String(r?.purchaseId ?? '')))
            )
          );
        }
      }
      const savedMin = JSON.parse(localStorage.getItem(MIN_KEY) || 'null');
      if (savedMin && typeof savedMin === 'object') setMinimized((m) => ({ ...m, ...savedMin }));
      else if (localStorage.getItem(CALC_MIN_KEY) === '1') setMinimized((m) => ({ ...m, calc: true }));
    } catch {
      // storage not available – start fresh
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(
        BO_STORAGE_KEY,
        JSON.stringify(boRows.map((r) => ({ customerId: r.customerId, purchaseId: r.purchaseId })))
      );
    } catch {
      // ignore
    }
  }, [boRows, hydrated]);

  const saveMinimized = (next: Record<SectionKey, boolean>) => {
    try {
      localStorage.setItem(MIN_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
    return next;
  };
  const toggleSection = (key: SectionKey) => setMinimized((m) => saveMinimized({ ...m, [key]: !m[key] }));
  const setAllSections = (value: boolean) => setMinimized(saveMinimized({ calc: value, bo: value, dispute: value }));
  const toggleCalcMinimized = () => toggleSection('calc');
  const allMinimized = minimized.calc && minimized.bo && minimized.dispute;

  const jumpTo = (key: SectionKey) => {
    if (minimized[key]) toggleSection(key);
    setTimeout(() => document.getElementById(`shortcut-${key}`)?.scrollIntoView({ block: 'start' }), 30);
  };

  // ---------- Calculator logic (unchanged) ----------
  const handleAddRow = () => {
    const instIndex = Math.min(rows.length, 3);
    const instLabels = ['1st', '2nd', '3rd', '4th'];

    setRows([
      ...rows,
      {
        id: String(Date.now()),
        deductedAmount: '0.000',
        installmentAmount: '0.000',
        orderNumber: rows[0]?.orderNumber || '',
        existingWallet: '0.000',
        installmentNumber: instLabels[instIndex] || '1st',
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
        deductedAmount: '0.000',
        installmentAmount: '0.000',
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

    const walletNote = `Extra Charge KNET ( ${row.orderNumber || '0'} ) ${row.installmentNumber} Installment`;

    const customerBreakdown = `(${row.installmentNumber}) Installment → Original amount (${installment.toFixed(3)}) → Deducted amount (${deducted.toFixed(3)}) → Difference (${diff.toFixed(3)})`;

    const combinedText = `Row Note: ${walletNote}\nBreakdown: ${customerBreakdown}`;

    return { diff, totalWallet, walletNote, customerBreakdown, combinedText };
  };

  const flashCopied = (labelId: string) => {
    setCopiedId(labelId);
    setTimeout(() => setCopiedId((cur) => (cur === labelId ? null : cur)), 2000);
  };

  const handleCopyText = async (text: string, labelId: string) => {
    if (await copyToClipboard(text)) flashCopied(labelId);
  };

  // Copy ALL Rows in a single action
  const handleCopyAllRows = async () => {
    const allText = rows
      .map((row, idx) => {
        const comp = computeRow(row);
        return `[Installment #${idx + 1} - ${row.installmentNumber}]\nWallet Note: ${comp.walletNote}\nCustomer Breakdown: ${comp.customerBreakdown}`;
      })
      .join('\n\n---\n\n');

    if (await copyToClipboard(allText)) flashCopied('copy-all-batch');
  };

  const grandTotalDiff = rows.reduce((acc, r) => acc + computeRow(r).diff, 0);

  // ---------- Back Office generator logic ----------
  const updateBoRow = (id: string, field: 'customerId' | 'purchaseId', value: string) => {
    setBoRows((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, [field]: value } : r));
      const last = next[next.length - 1];
      // add a fresh empty row once the last one has both IDs
      return last.customerId.trim() && last.purchaseId.trim() ? [...next, newBoRow()] : next;
    });
  };

  const deleteBoRow = (id: string) => {
    setBoRows((prev) => {
      const next = prev.filter((r) => r.id !== id);
      return withTrailingBlank(next.length ? next : [newBoRow()]);
    });
  };

  const addBoRow = () => setBoRows((prev) => [...prev, newBoRow()]);

  const clearBoRows = () => setBoRows([newBoRow(), newBoRow(), newBoRow()]);

  // Pasting several lines / two columns from Google Sheets into any field fills many rows at once
  const handleBoPaste = (e: React.ClipboardEvent<HTMLInputElement>, rowId: string) => {
    const text = e.clipboardData.getData('text');
    const trimmed = text.trim();
    const looksMulti = /[\t\r\n,;]/.test(trimmed) || trimmed.split(/\s+/).length > 1;
    if (!looksMulti) return; // a single value – normal paste
    const pairs = parsePairs(text);
    if (!pairs.length) return;
    e.preventDefault();
    setBoRows((prev) => {
      const idx = prev.findIndex((r) => r.id === rowId);
      const at = idx === -1 ? prev.length : idx;
      return withTrailingBlank([
        ...prev.slice(0, at),
        ...pairs.map(([c, p]) => newBoRow(c, p)),
        ...prev.slice(at + 1),
      ]);
    });
  };

  const handleBulkGenerate = () => {
    const pairs = parsePairs(bulkText);
    if (!pairs.length) return;
    setBoRows((prev) =>
      withTrailingBlank([
        ...prev.filter((r) => r.customerId.trim() || r.purchaseId.trim()),
        ...pairs.map(([c, p]) => newBoRow(c, p)),
      ])
    );
    setBulkText('');
    setShowBulk(false);
  };

  const boLinks = boRows.map((r) => buildBoLink(r.customerId, r.purchaseId));
  const validLinks = boLinks.filter(Boolean);

  const handleCopyAllLinks = async () => {
    if (!validLinks.length) return;
    if (await copyToClipboard(validLinks.join('\n'))) flashCopied('bo-copy-all');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Page header: jump to a tool, or minimize / expand all of them */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Zap className="h-6 w-6 text-emerald-500" /> Shortcuts
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Quick tools for daily tickets. Minimize what you don’t need – your choice is remembered.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['calc', 'KNET calculator', Calculator],
              ['bo', 'Back Office links', Link2],
              ['dispute', 'Dispute form', FileDown],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => jumpTo(key)}
              className="h-8 px-3 rounded-full text-[11px] font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5"
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAllSections(!allMinimized)}
            className="h-8 text-xs gap-1.5 font-bold border-slate-300 dark:border-slate-700"
          >
            {allMinimized ? <ChevronsUpDown className="h-3.5 w-3.5" /> : <ChevronsDownUp className="h-3.5 w-3.5" />}
            {allMinimized ? 'Expand all' : 'Minimize all'}
          </Button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* SECTION 1: KNET CALCULATOR (can be minimized)           */}
      {/* ===================================================== */}
      <Card id="shortcut-calc" className="scroll-mt-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className={calcMinimized ? 'py-3' : 'pb-3 border-b border-slate-100 dark:border-slate-800'}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Calculator className="h-5 w-5 text-emerald-500 shrink-0" />
                <span className="truncate">KNET & Installments Over-Deduction Calculator</span>
              </CardTitle>
              {!calcMinimized && (
                <CardDescription className="text-xs mt-1">
                  Calculate KNET fee differences, wallet compensations, and generate combined customer communication notes
                </CardDescription>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {calcMinimized ? (
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Difference: {grandTotalDiff.toFixed(3)} KWD
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
                    {rows.length} row{rows.length === 1 ? '' : 's'}
                  </span>
                </div>
              ) : (
                <>
                  {rows.length > 1 && (
                    <Button
                      size="sm"
                      onClick={handleCopyAllRows}
                      className="h-9 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                    >
                      {copiedId === 'copy-all-batch' ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                      <span>{copiedId === 'copy-all-batch' ? 'All Rows Copied!' : 'Copy All Notes & Breakdowns'}</span>
                    </Button>
                  )}

                  <Button variant="outline" size="sm" onClick={handleReset} className="h-9 text-xs gap-1.5 border-slate-300 dark:border-slate-800">
                    <RefreshCw className="h-3.5 w-3.5" /> Reset
                  </Button>

                  <Button size="sm" onClick={handleAddRow} className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                    <Plus className="h-4 w-4" /> Add Installment Row
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={toggleCalcMinimized}
                title={calcMinimized ? 'Show the calculator' : 'Minimize the calculator'}
                className="h-9 text-xs gap-1.5 font-bold border-slate-300 dark:border-slate-700"
              >
                {calcMinimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                {calcMinimized ? 'Expand' : 'Minimize'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {!calcMinimized && (
          <CardContent className="pt-5 space-y-6">
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

            {/* Interactive Installments Table */}
            <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-500" /> Interactive Installments Matrix
                </CardTitle>
                <CardDescription className="text-xs">
                  Enter installment numbers (1 to 4) and amounts to calculate differences
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <Table className="text-xs min-w-[1000px]">
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/80">
                        <TableHead className="w-32 font-bold">Deducted Amt</TableHead>
                        <TableHead className="w-32 font-bold">Installment Amt</TableHead>
                        <TableHead className="w-32 font-bold">Order No.</TableHead>
                        <TableHead className="w-28 font-bold">Inst #</TableHead>
                        <TableHead className="w-28 font-bold">Existing Wallet</TableHead>
                        <TableHead className="w-28 font-bold text-emerald-600 dark:text-emerald-400">Difference</TableHead>
                        <TableHead className="w-32 font-bold text-blue-600 dark:text-blue-400">Total Wallet</TableHead>
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
                                placeholder="0.000"
                                value={row.deductedAmount}
                                onChange={(e) => handleUpdateRow(row.id, 'deductedAmount', e.target.value)}
                                className="h-8 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.001"
                                placeholder="0.000"
                                value={row.installmentAmount}
                                onChange={(e) => handleUpdateRow(row.id, 'installmentAmount', e.target.value)}
                                className="h-8 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                placeholder="0"
                                value={row.orderNumber}
                                onChange={(e) => handleUpdateRow(row.id, 'orderNumber', e.target.value)}
                                className="h-8 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                              />
                            </TableCell>

                            {/* DROPDOWN MENU FOR INSTALLMENT NUMBER (1st, 2nd, 3rd, 4th) */}
                            <TableCell>
                              <select
                                value={row.installmentNumber}
                                onChange={(e) => handleUpdateRow(row.id, 'installmentNumber', e.target.value)}
                                className="h-8 w-full text-xs font-bold bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 text-emerald-600 dark:text-emerald-400"
                              >
                                <option value="1st">1st</option>
                                <option value="2nd">2nd</option>
                                <option value="3rd">3rd</option>
                                <option value="4th">4th</option>
                              </select>
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

            {/* COMBINED WALLET NOTE & CUSTOMER BREAKDOWN CARDS */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-500" /> Generated Wallet Notes & Customer Breakdowns
              </h3>

              {rows.map((row, idx) => {
                const computed = computeRow(row);

                return (
                  <Card key={row.id} className="border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 shadow-sm">
                    <CardContent className="p-4 space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5" /> Row #{idx + 1} ({row.installmentNumber} Installment)
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleCopyText(computed.combinedText, `combined-${row.id}`)}
                          className="h-7 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                        >
                          {copiedId === `combined-${row.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedId === `combined-${row.id}` ? 'Copied Both!' : 'Copy Row Note & Breakdown'}</span>
                        </Button>
                      </div>

                      {/* Combined Display in the Same Box */}
                      <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-slate-800 dark:text-slate-200">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">1. Wallet Note:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{computed.walletNote}</span>
                        </div>

                        <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase text-slate-500 block">2. Customer Breakdown Text:</span>
                          <span>{computed.customerBreakdown}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* ===================================================== */}
      {/* SECTION 2: BACK OFFICE LINK GENERATOR                   */}
      {/* ===================================================== */}
      <Card id="shortcut-bo" className="scroll-mt-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <CardHeader className={minimized.bo ? 'py-3' : 'pb-3 border-b border-slate-100 dark:border-slate-800'}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Link2 className="h-5 w-5 text-sky-500" /> Back Office Link Generator
              </CardTitle>
              {!minimized.bo && (
                <CardDescription className="text-xs mt-1">
                  Enter the Customer ID and Purchase ID and the Back Office link is created automatically. Paste two columns
                  from Google Sheets to fill many orders at once.
                </CardDescription>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {minimized.bo ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400">
                  {validLinks.length} link{validLinks.length === 1 ? '' : 's'} ready
                </span>
              ) : (
              <>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400">
                {validLinks.length} link{validLinks.length === 1 ? '' : 's'} ready
              </span>

              <Button
                size="sm"
                onClick={handleCopyAllLinks}
                disabled={!validLinks.length}
                className="h-9 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                {copiedId === 'bo-copy-all' ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                <span>{copiedId === 'bo-copy-all' ? 'All Links Copied!' : 'Copy All Links'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulk((v) => !v)}
                className="h-9 text-xs gap-1.5 border-slate-300 dark:border-slate-800"
              >
                <ClipboardPaste className="h-3.5 w-3.5" /> Bulk Paste
              </Button>

              <Button variant="outline" size="sm" onClick={clearBoRows} className="h-9 text-xs gap-1.5 border-slate-300 dark:border-slate-800">
                <Eraser className="h-3.5 w-3.5" /> Clear
              </Button>

              <Button size="sm" onClick={addBoRow} className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                <Plus className="h-4 w-4" /> Add Row
              </Button>
              </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSection('bo')}
                className="h-9 text-xs gap-1.5 font-bold border-slate-300 dark:border-slate-700"
              >
                {minimized.bo ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
                {minimized.bo ? 'Expand' : 'Minimize'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {!minimized.bo && (
        <CardContent className="pt-4 space-y-4">
          {showBulk && (
            <div className="space-y-2 p-3 rounded-xl border border-sky-500/30 bg-sky-500/5">
              <div className="text-xs font-bold text-sky-600 dark:text-sky-400">
                Paste one order per line: Customer ID, then Purchase ID (separated by Tab, comma or space)
              </div>
              <Textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={'customer-id-1  purchase-id-1\ncustomer-id-2  purchase-id-2'}
                rows={5}
                className="text-xs font-mono bg-slate-50 dark:bg-slate-950"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setShowBulk(false); setBulkText(''); }} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkGenerate}
                  disabled={!bulkText.trim()}
                  className="h-8 text-xs gap-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold"
                >
                  <Link2 className="h-3.5 w-3.5" /> Generate Links
                </Button>
              </div>
            </div>
          )}

          {/* Column headers (desktop) */}
          <div className="hidden md:grid md:grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_96px] gap-2 px-1 text-[10px] font-bold uppercase text-slate-500">
            <div>#</div>
            <div>Customer ID</div>
            <div>Purchase ID</div>
            <div>Back Office Link</div>
            <div className="text-right">Actions</div>
          </div>

          <div className="space-y-2">
            {boRows.map((row, idx) => {
              const link = boLinks[idx];
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-[32px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_96px] gap-2 items-center p-2 md:p-1 rounded-xl border border-slate-200/70 dark:border-slate-800 md:border-transparent md:dark:border-transparent"
                >
                  <div className="hidden md:block text-xs font-bold text-slate-400 text-center">{idx + 1}</div>

                  <Input
                    type="text"
                    placeholder="Customer ID"
                    value={row.customerId}
                    onChange={(e) => updateBoRow(row.id, 'customerId', e.target.value)}
                    onPaste={(e) => handleBoPaste(e, row.id)}
                    spellCheck={false}
                    className="h-9 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                  />

                  <Input
                    type="text"
                    placeholder="Purchase ID"
                    value={row.purchaseId}
                    onChange={(e) => updateBoRow(row.id, 'purchaseId', e.target.value)}
                    onPaste={(e) => handleBoPaste(e, row.id)}
                    spellCheck={false}
                    className="h-9 text-xs font-mono bg-slate-50 dark:bg-slate-950"
                  />

                  <div className="min-w-0 px-1">
                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={link}
                        className="block truncate font-mono text-[11px] text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        {link}
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Fill both IDs to generate the link</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="sm"
                      disabled={!link}
                      onClick={() => handleCopyText(link, `bo-${row.id}`)}
                      title="Copy link"
                      className="h-8 w-8 p-0 bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      {copiedId === `bo-${row.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>

                    {link ? (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Back Office"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-sky-500 hover:border-sky-500/60"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-600">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBoRow(row.id)}
                      title="Remove row"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500">
            Tip: a new empty row is added automatically when you fill the last one. Your list is kept while this browser tab is open,
            even if you switch to another dashboard tab.
          </p>
        </CardContent>
        )}
      </Card>

      {/* ===================================================== */}
      {/* SECTION 3: CARDHOLDER DISPUTE FORM (editable PDF)       */}
      {/* ===================================================== */}
      <div id="shortcut-dispute" className="scroll-mt-4">
        <DisputeFormGenerator minimized={minimized.dispute} onToggle={() => toggleSection('dispute')} />
      </div>
    </div>
  );
}
