'use client';

import { useState } from 'react';
import { FileDown, Plus, Trash2, Eraser, Minimize2, Maximize2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

// ---------------------------------------------------------------------------
// Cardholder Dispute Form generator
// Fills the editable PDF in /public/forms in the browser and downloads it,
// named after the cardholder. Nothing typed here is saved or sent anywhere.
// The PDF stays editable so the customer can tick the reason, add the dates,
// sign and send it back.
// ---------------------------------------------------------------------------
const FORM_URL = '/forms/cardholder-dispute-form.pdf';
const LIB_URL = '/vendor/pdf-lib.min.js';
const MAX_ROWS = 35;

const REASONS: { id: string; label: string }[] = [
  { id: '', label: 'Let the customer choose' },
  { id: 'reason_1', label: 'Not authorised – card stayed with the customer' },
  { id: 'reason_2', label: 'Card lost or stolen' },
  { id: 'reason_3', label: 'Goods / services not received' },
  { id: 'reason_4', label: 'Cancelled or returned – no refund received' },
  { id: 'reason_5', label: 'Subscription / booking cancelled – still charged' },
  { id: 'reason_6', label: 'Defective or damaged goods returned' },
  { id: 'reason_7', label: 'Refund expected – not received' },
  { id: 'reason_8', label: 'Charged an incorrect amount' },
  { id: 'reason_9', label: 'Charged in a different currency' },
  { id: 'reason_others', label: 'Other reason' },
];

const CURRENCIES = ['AED', 'KWD', 'USD', 'EUR', 'GBP', 'SAR'];

interface Txn {
  id: number;
  date: string; // as pasted / typed (from the CRM)
  merchant: string;
  amount: string;
  currency: string;
}

let txnCounter = 0;
const newTxn = (currency = 'AED'): Txn => ({ id: ++txnCounter, date: '', merchant: '', amount: '', currency });

// The form's built-in font only supports English / Latin letters
const latinOnly = (t: string) => !/[^\u0000-ÿ‘’“”–—]/.test(t);
const toLatin1 = (t: string) => t.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-');

// ---------------------------------------------------------------------------
// Dates pasted from the CRM -> dd/mm/yyyy
// Understands 2026-10-05, 2026-10-05T14:32, 05/10/2026, 5.10.26, 5 Oct 2026, Oct 5, 2026 14:32 ...
// Numbers with slashes are read day first (UAE / Kuwait style) unless that is impossible (e.g. 10/25/2026).
// ---------------------------------------------------------------------------
const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};
const pad = (n: number) => String(n).padStart(2, '0');
const validDate = (d: number, m: number, y: number) => {
  if (y < 100) y += 2000;
  if (m < 1 || m > 12 || d < 1 || y < 2000 || y > 2100) return null;
  const dt = new Date(y, m - 1, d);
  return dt.getMonth() === m - 1 ? `${pad(d)}/${pad(m)}/${y}` : null;
};
export const parseCrmDate = (raw: string): string | null => {
  const t = String(raw || '').trim().replace(/\s+/g, ' ');
  if (!t) return null;
  let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/.exec(t); // 2026-10-05
  if (m) return validDate(+m[3], +m[2], +m[1]);
  m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(t); // 05/10/2026
  if (m) {
    const a = +m[1];
    const b = +m[2];
    const y = +m[3];
    return a > 12 || b <= 12 ? validDate(a, b, y) : validDate(b, a, y);
  }
  const monthOf = (name: string) => MONTHS[name.slice(0, 3).toLowerCase()];
  m = /^(\d{1,2})(?:st|nd|rd|th)?[ -]([a-z]{3,9})\.?[ ,-]*(\d{2,4})/i.exec(t); // 5 Oct 2026 / 05-Oct-2026
  if (m && monthOf(m[2])) return validDate(+m[1], monthOf(m[2]), +m[3]);
  m = /^(?:[a-z]{3,9},? )?([a-z]{3,9})\.? (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})/i.exec(t); // Oct 5, 2026 / Mon, Oct 5 2026
  if (m && monthOf(m[1])) return validDate(+m[2], monthOf(m[1]), +m[3]);
  return null;
};

// amount pasted with or without a currency: "AED 1,250.00", "349.99 KWD", "12.500"
const parseAmount = (raw: string): { amount: string; currency?: string } | null => {
  const t = String(raw || '').trim().toUpperCase();
  const m = /^([A-Z]{3})?\s*(-?[\d,]*\.?\d+)\s*([A-Z]{3})?$/.exec(t);
  if (!m) return null;
  const cur = m[1] || m[3];
  let num = m[2];
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(num)) num = num.replace(/,/g, '');
  return { amount: num.replace(/^-/, ''), currency: cur && CURRENCIES.includes(cur) ? cur : undefined };
};

// a row of cells copied from the CRM: work out which cell is the date, the amount and the merchant
const rowFromCells = (cells: string[], fallbackCurrency: string) => {
  let date = '';
  let amount = '';
  let currency = fallbackCurrency;
  const rest: string[] = [];
  cells.forEach((c) => {
    const v = c.trim();
    if (!v) return;
    if (!date && parseCrmDate(v)) date = v;
    else if (!amount && parseAmount(v)) {
      const a = parseAmount(v)!;
      amount = a.amount;
      if (a.currency) currency = a.currency;
    } else rest.push(v);
  });
  return { date, merchant: rest[0] || '', amount, currency }; // extra columns (status etc.) are ignored
};

function loadPdfLib(): Promise<any> {
  const w = window as any;
  if (w.PDFLib) return Promise.resolve(w.PDFLib);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = LIB_URL;
    s.async = true;
    s.onload = () => (w.PDFLib ? resolve(w.PDFLib) : reject(new Error('PDF tool did not load')));
    s.onerror = () => reject(new Error('Could not load the PDF tool. Check your connection and try again.'));
    document.head.appendChild(s);
  });
}

function downloadBlob(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function DisputeFormGenerator({ minimized, onToggle }: { minimized: boolean; onToggle: () => void }) {
  const [name, setName] = useState('');
  const [first4, setFirst4] = useState('');
  const [last4, setLast4] = useState('');
  const [reason, setReason] = useState('');
  const [txns, setTxns] = useState<Txn[]>([newTxn()]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (id: number, field: keyof Txn, value: string) => setTxns((list) => list.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  const addTxn = () => setTxns((list) => (list.length >= MAX_ROWS ? list : [...list, newTxn(list[list.length - 1]?.currency || 'AED')]));
  const removeTxn = (id: number) => setTxns((list) => (list.length > 1 ? list.filter((t) => t.id !== id) : [newTxn(list[0]?.currency)]));
  const clearAll = () => {
    setName('');
    setFirst4('');
    setLast4('');
    setReason('');
    setTxns([newTxn()]);
    setMsg(null);
  };

  // Paste one value, or several rows copied from the CRM (one transaction per line, cells separated by tabs)
  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>, id: number, field: 'date' | 'merchant' | 'amount') => {
    const text = e.clipboardData.getData('text');
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const multi = lines.length > 1 || /\t/.test(text);
    if (!multi) {
      if (field === 'amount') {
        const a = parseAmount(text);
        if (a) {
          e.preventDefault();
          setTxns((list) => list.map((t) => (t.id === id ? { ...t, amount: a.amount, currency: a.currency || t.currency } : t)));
        }
      }
      return; // normal paste
    }
    e.preventDefault();
    setTxns((list) => {
      const at = Math.max(0, list.findIndex((t) => t.id === id));
      const cur = list[at]?.currency || 'AED';
      const pasted = lines.map((l) => ({ ...newTxn(cur), ...rowFromCells(l.split('\t'), cur) }));
      const next = [...list.slice(0, at), ...pasted, ...list.slice(at + 1)].slice(0, MAX_ROWS);
      return next.length ? next : [newTxn()];
    });
  };

  const filled = txns.filter((t) => t.date.trim() || t.merchant.trim() || t.amount.trim());

  const generate = async () => {
    setMsg(null);
    const cleanName = name.trim().replace(/\s+/g, ' ');
    if (!cleanName) return setMsg({ ok: false, text: 'Please enter the cardholder name.' });
    if (!/^\d{4}$/.test(first4) || !/^\d{4}$/.test(last4)) return setMsg({ ok: false, text: 'Please enter exactly 4 digits for the first and the last 4 card digits.' });
    const texts = [cleanName, ...filled.map((t) => t.merchant)];
    if (!texts.every(latinOnly)) return setMsg({ ok: false, text: 'Please type the name and merchant names in English letters (as printed on the card / statement).' });
    const badAmount = filled.find((t) => t.amount.trim() && !parseAmount(t.amount));
    if (badAmount) return setMsg({ ok: false, text: 'Amounts should be numbers only, for example 250.00' });
    const badDate = filled.findIndex((t) => t.date.trim() && !parseCrmDate(t.date));
    if (badDate >= 0)
      return setMsg({ ok: false, text: `Couldn’t read the date in row ${badDate + 1}. Paste it as shown in the CRM, for example 05/10/2026 or 5 Oct 2026.` });

    setBusy(true);
    try {
      const PDFLib = await loadPdfLib();
      const res = await fetch(FORM_URL);
      if (!res.ok) throw new Error('Could not open the dispute form file.');
      const doc = await PDFLib.PDFDocument.load(await res.arrayBuffer());
      const form = doc.getForm();
      const set = (field: string, value: string, center = false) => {
        const f = form.getTextField(field);
        if (center) f.setAlignment(PDFLib.TextAlignment.Center);
        f.setText(toLatin1(value));
      };

      set('cardholder_name', cleanName);
      first4.split('').forEach((d, i) => set(`card_digit_${i + 1}`, d, true));
      last4.split('').forEach((d, i) => set(`card_digit_${13 + i}`, d, true));
      filled.slice(0, MAX_ROWS).forEach((t, i) => {
        const n = i + 1;
        if (t.date.trim()) set(`txn_date_${n}`, parseCrmDate(t.date) || t.date.trim());
        if (t.merchant.trim()) set(`merchant_name_${n}`, t.merchant.trim());
        if (t.amount.trim()) set(`txn_amount_${n}`, `${t.currency} ${parseAmount(t.amount)?.amount || t.amount.trim()}`);
      });
      if (reason) form.getCheckBox(reason).check();

      // the form is NOT flattened, so the customer can still fill and sign it
      const bytes: Uint8Array = await doc.save();
      const safe = cleanName.replace(/[\\/:*?"<>|]+/g, '').trim() || 'Customer';
      const fileName = `${safe} - Cardholder Dispute Form.pdf`;
      downloadBlob(bytes, fileName);
      setMsg({ ok: true, text: `Downloaded “${fileName}”. Attach it to your email to the customer.` });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ? `Could not create the PDF: ${e.message}` : 'Could not create the PDF.' });
    } finally {
      setBusy(false);
    }
  };

  const input =
    'h-9 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500/40';

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      {/* header */}
      <div className={`px-6 ${minimized ? 'py-3' : 'pt-6 pb-3 border-b border-slate-100 dark:border-slate-800'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <FileDown className="h-5 w-5 text-violet-500 shrink-0" />
              <span className="truncate">Cardholder Dispute Form Generator</span>
            </h3>
            {!minimized && (
              <p className="text-xs text-muted-foreground mt-1">
                Fill the details and download the editable PDF named after the customer. The customer ticks the reason, signs and sends it back.
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!minimized && (
              <button
                type="button"
                onClick={clearAll}
                className="h-9 px-3 rounded-md text-xs font-medium border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
              >
                <Eraser className="h-3.5 w-3.5" /> Clear
              </button>
            )}
            <button
              type="button"
              onClick={onToggle}
              className="h-9 px-3 rounded-md text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
            >
              {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
              {minimized ? 'Expand' : 'Minimize'}
            </button>
          </div>
        </div>
      </div>

      {!minimized && (
        <div className="p-6 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Cardholder name (English, as on the card)</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. AHMED ALI" className={input} autoComplete="off" spellCheck={false} />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">First 4 digits</span>
              <input
                value={first4}
                onChange={(e) => setFirst4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                placeholder="0000"
                className={`${input} font-mono tracking-[0.3em]`}
                autoComplete="off"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Last 4 digits</span>
              <input
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                inputMode="numeric"
                placeholder="0000"
                className={`${input} font-mono tracking-[0.3em]`}
                autoComplete="off"
              />
            </label>
          </div>

          {/* transactions */}
          <div className="space-y-2">
            <div className="hidden md:grid md:grid-cols-[32px_170px_minmax(0,1fr)_110px_150px_40px] gap-2 px-1 text-[10px] font-bold uppercase text-slate-500">
              <div>#</div>
              <div>Transaction date</div>
              <div>Merchant name</div>
              <div>Currency</div>
              <div>Amount</div>
              <div />
            </div>
            {txns.map((t, idx) => (
              <div
                key={t.id}
                className="grid grid-cols-1 md:grid-cols-[32px_170px_minmax(0,1fr)_110px_150px_40px] gap-2 items-start p-2 md:p-0 rounded-xl border border-slate-200/70 dark:border-slate-800 md:border-0"
              >
                <div className="hidden md:block text-xs font-bold text-slate-400 text-center pt-2.5">{idx + 1}</div>
                <div className="min-w-0">
                  <input
                    value={t.date}
                    onChange={(e) => update(t.id, 'date', e.target.value)}
                    onPaste={(e) => onPaste(e, t.id, 'date')}
                    placeholder="Paste date from CRM"
                    className={`${input} ${t.date.trim() && !parseCrmDate(t.date) ? 'border-red-400 dark:border-red-500/60' : ''}`}
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {t.date.trim() && (
                    <div className={`text-[10px] mt-0.5 px-1 ${parseCrmDate(t.date) ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {parseCrmDate(t.date) ? `✓ ${parseCrmDate(t.date)}` : 'Date not recognised'}
                    </div>
                  )}
                </div>
                <input
                  value={t.merchant}
                  onChange={(e) => update(t.id, 'merchant', e.target.value)}
                  onPaste={(e) => onPaste(e, t.id, 'merchant')}
                  placeholder="Merchant name"
                  className={input}
                  spellCheck={false}
                />
                <select value={t.currency} onChange={(e) => update(t.id, 'currency', e.target.value)} className={input}>
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  value={t.amount}
                  onChange={(e) => update(t.id, 'amount', e.target.value.replace(/[^\d.,]/g, ''))}
                  onPaste={(e) => onPaste(e, t.id, 'amount')}
                  inputMode="decimal"
                  placeholder="0.00"
                  className={`${input} font-mono`}
                />
                <button
                  type="button"
                  onClick={() => removeTxn(t.id)}
                  title="Remove transaction"
                  className="h-9 w-9 mx-auto flex items-center justify-center rounded-md text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <p className="text-[11px] text-slate-500 px-1">
              Tip: copy several rows from the CRM (date, merchant, amount) and paste them into any date box – each line becomes a transaction.
            </p>
            <button
              type="button"
              onClick={addTxn}
              disabled={txns.length >= MAX_ROWS}
              className="h-8 px-3 rounded-md text-xs font-bold border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:border-violet-500 hover:text-violet-600 dark:hover:text-violet-300 disabled:opacity-40 flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Add transaction {txns.length >= MAX_ROWS ? `(max ${MAX_ROWS})` : ''}
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-3">
            <label className="space-y-1 md:w-96">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Tick a reason for the customer (optional)</span>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className={input}>
                {REASONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <span className="flex-1" />
            <button
              type="button"
              onClick={generate}
              disabled={busy}
              className="h-10 px-5 rounded-lg text-sm font-bold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <FileDown className="h-4 w-4" /> {busy ? 'Creating PDF…' : 'Generate PDF'}
            </button>
          </div>

          {msg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                msg.ok
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
              }`}
            >
              {msg.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>
                {msg.text}
                {msg.ok && (
                  <>
                    {' '}
                    Templates for the next steps are in <b>Ticket Assistance → Tabby Card → Dispute – unauthorised (Visa)</b>.
                  </>
                )}
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 flex items-start gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
            The PDF is created on this computer. Nothing you type here is saved or sent anywhere, and it is cleared when you leave this page.
          </p>
        </div>
      )}
    </div>
  );
}
