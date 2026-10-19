'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Mail, Copy, Check, Search, FileText, Plus, Trash2, Upload, User, AlertCircle, CheckCircle2, Pencil, Star,
  ShieldAlert, Headphones, Link2, ChevronDown, ChevronUp, MessageSquare, AlertTriangle,
} from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';
import { anyTopicMatch } from '@/lib/topic-links';
import { SmartSuggestPanel } from '@/components/smart-suggest-panel';
import Papa from 'papaparse';

type MacroType = 'FL' | 'Escalation';
type TypeFilter = 'all' | MacroType;

interface EmailTemplate {
  id?: string;
  title: string;
  category: string;
  macro_type?: string | null;
  subject?: string | null;
  body_en: string;
  body_ar?: string | null;
  body_ar_female?: string | null;
}

interface ChatMacroLite {
  id?: string;
  category?: string;
  topic?: string;
  category_name?: string;
  macro_type?: string | null;
  male_ar?: string;
  female_ar?: string;
  english_en?: string;
}

// Templates saved before the FL / Escalation option existed count as Escalation
const normalizeType = (value?: string | null): MacroType => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'fl' || v.includes('first') || v.includes('front')) return 'FL';
  return 'Escalation';
};

const DB_COLUMNS_SQL =
  "alter table email_templates add column if not exists macro_type text default 'Escalation'; " +
  'alter table email_templates add column if not exists subject text; ' +
  'alter table email_templates add column if not exists body_ar_female text;';

const FAV_KEY = 'tabby-fav-email-templates';

// Placeholders agents can write inside a template: {{customer_name}} {{ticket_id}} {{amount}} {{agent_name}}
const PLACEHOLDER_TAGS = [
  { tag: '{{customer_name}}', label: 'Customer name' },
  { tag: '{{ticket_id}}', label: 'Ticket / Ref ID' },
  { tag: '{{amount}}', label: 'Amount' },
  { tag: '{{agent_name}}', label: 'My name' },
];

const PLACEHOLDER_REGEX = /\{\{\s*([a-z_]+)\s*\}\}/gi;

const placeholderKind = (name: string): 'name' | 'ref' | 'amount' | 'agent' | null => {
  const n = name.toLowerCase();
  if (['customer_name', 'customer', 'name'].includes(n)) return 'name';
  if (['ticket_id', 'ref_id', 'ref', 'ticket'].includes(n)) return 'ref';
  if (n === 'amount') return 'amount';
  if (['agent_name', 'agent', 'my_name'].includes(n)) return 'agent';
  return null;
};

const prettyName = (raw: string) =>
  raw
    .split(/[._\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

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

export function EmailTemplatesTab() {
  const { currentUser } = useMetrics() as any;
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [chatMacros, setChatMacros] = useState<ChatMacroLite[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [favOnly, setFavOnly] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [openRelated, setOpenRelated] = useState<Record<string, boolean>>({});

  // Auto-fill variables
  const [customerName, setCustomerName] = useState('');
  const [ticketRef, setTicketRef] = useState('');
  const [amountVal, setAmountVal] = useState('');
  const [agentName, setAgentName] = useState('');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Add / edit form
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingHadSubject, setEditingHadSubject] = useState(false);
  const [newType, setNewType] = useState<MacroType | ''>('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newLangs, setNewLangs] = useState({ en: true, ar: true, arf: true });
  const [newBodyEN, setNewBodyEN] = useState('');
  const [newBodyAR, setNewBodyAR] = useState('');
  const [newBodyARF, setNewBodyARF] = useState('');
  const [editingHadFemale, setEditingHadFemale] = useState(false);

  // Status messages
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const fetchTemplates = async () => {
    const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: false });
    if (!error && data) setTemplates(data);
  };

  const fetchChatMacros = async () => {
    try {
      const { data, error } = await supabase.from('chat_macros').select('*');
      if (!error && data) setChatMacros(data);
    } catch (err) {
      console.error('Error fetching chat macros for linking:', err);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchChatMacros();
    try {
      const saved = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
      if (Array.isArray(saved)) setFavorites(new Set(saved.map(String)));
    } catch {
      // ignore
    }
  }, []);

  // signature name defaults to the logged-in user
  useEffect(() => {
    if (agentName) return;
    const base = currentUser?.username || String(currentUser?.user_email || '').split('@')[0];
    if (base) setAgentName(prettyName(String(base)));
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFavorite = (id?: string) => {
    if (!id) return;
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const explainDbError = (message: string, prefix: string) => {
    if (/macro_type|subject|body_ar_female/i.test(message)) {
      return `${prefix}: the database needs new columns. Run this once in Supabase → SQL Editor: ${DB_COLUMNS_SQL}`;
    }
    return `${prefix}: ${message}`;
  };

  const resetForm = () => {
    setEditingId(null);
    setEditingHadSubject(false);
    setNewType('');
    setNewTitle('');
    setNewCategory('');
    setNewSubject('');
    setNewLangs({ en: true, ar: true, arf: true });
    setNewBodyEN('');
    setNewBodyAR('');
    setNewBodyARF('');
    setEditingHadFemale(false);
  };

  const scrollToForm = () => setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);

  const handleAddButton = () => {
    if (showAddForm && !editingId) {
      resetForm();
      setShowAddForm(false);
      return;
    }
    resetForm();
    setShowAddForm(true);
    scrollToForm();
  };

  // from Smart Suggest: jump to that template in the list below
  const showEmailInList = (title: string) => {
    setTypeFilter('all');
    setCategoryFilter('all');
    setFavOnly(false);
    setSearchTerm(title);
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleStartEdit = (t: EmailTemplate) => {
    if (!t.id) return;
    const hasAny = !!(t.body_en || t.body_ar || t.body_ar_female);
    setStatusMsg('');
    setEditingId(t.id);
    setEditingHadSubject(!!t.subject);
    setNewType(normalizeType(t.macro_type));
    setNewTitle(t.title || '');
    setNewCategory(t.category || '');
    setNewSubject(t.subject || '');
    setNewBodyEN(t.body_en || '');
    setNewBodyAR(t.body_ar || '');
    setNewBodyARF(t.body_ar_female || '');
    setEditingHadFemale(!!t.body_ar_female);
    setNewLangs({ en: hasAny ? !!t.body_en : true, ar: hasAny ? !!t.body_ar : true, arf: hasAny ? !!t.body_ar_female : true });
    setShowAddForm(true);
    scrollToForm();
  };

  const appendTag = (field: 'en' | 'ar' | 'arf', tag: string) => {
    const add = (prev: string) => `${prev}${prev && !/\s$/.test(prev) ? ' ' : ''}${tag}`;
    if (field === 'en') setNewBodyEN(add);
    else if (field === 'ar') setNewBodyAR(add);
    else setNewBodyARF(add);
  };

  // CSV upload (Admin / Team Leader)
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fallbackType: MacroType = typeFilter === 'FL' ? 'FL' : 'Escalation';

    setUploading(true);
    setIsError(false);
    setStatusMsg('Parsing and uploading CSV templates...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedRows: any[] = results.data;
          const recordsToInsert = parsedRows
            .map((row) => {
              const rawType = row.type || row.Type || row.macro_type || row['Macro Type'] || '';
              const subject = row.subject || row.Subject || '';
              const record: any = {
                title: row.title || row.Title || 'Untitled Template',
                category: row.category || row.Category || 'General',
                macro_type: rawType ? normalizeType(rawType) : fallbackType,
                body_en: row.body_en || row.bodyEN || row.Body || row['English Body'] || '',
                body_ar: row.body_ar || row.bodyAR || row['Arabic Body'] || row['Arabic Male Body'] || null,
              };
              const arFemale = row.body_ar_female || row.bodyARFemale || row['Arabic Female Body'] || '';
              if (subject) record.subject = subject;
              if (arFemale) record.body_ar_female = arFemale;
              return record;
            })
            .filter((r) => [r.body_en, r.body_ar, r.body_ar_female].some((x) => String(x || '').trim().length > 0));

          if (recordsToInsert.length === 0) {
            setIsError(true);
            setStatusMsg('CSV Error: Could not find valid template rows. Headers: title, category, body_en, body_ar (optional: type = FL or Escalation, subject, body_ar_female).');
            setUploading(false);
            return;
          }

          const { error } = await supabase.from('email_templates').insert(recordsToInsert);

          if (error) {
            setIsError(true);
            setStatusMsg(explainDbError(error.message, 'Upload Error'));
          } else {
            setIsError(false);
            setStatusMsg(`✓ Success! Imported ${recordsToInsert.length} email templates. (rows without a "type" column were saved as ${fallbackType})`);
            fetchTemplates();
          }
        } catch (err: any) {
          setIsError(true);
          setStatusMsg(`Parsing Error: ${err.message}`);
        } finally {
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
    });
  };

  // Add or update one template (all agents)
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setIsError(false);

    if (!newType) {
      setIsError(true);
      setStatusMsg('Please choose first whether this template is FL or Escalation.');
      return;
    }
    if (!newTitle.trim()) {
      setIsError(true);
      setStatusMsg('Please write a template title.');
      return;
    }
    if (!newLangs.en && !newLangs.ar && !newLangs.arf) {
      setIsError(true);
      setStatusMsg('Please select at least one language (English, Arabic Male or Arabic Female).');
      return;
    }
    const en = newLangs.en ? newBodyEN.trim() : '';
    const ar = newLangs.ar ? newBodyAR.trim() : '';
    const arf = newLangs.arf ? newBodyARF.trim() : '';
    if (!en && !ar && !arf) {
      setIsError(true);
      setStatusMsg('Please write the response text for at least one of the selected languages.');
      return;
    }

    const record: any = {
      title: newTitle.trim(),
      category: newCategory.trim() || 'General Escalation',
      macro_type: newType,
      body_en: en,
      body_ar: ar || null,
    };
    // only touch the subject column when it is used, so older databases keep working
    if (newSubject.trim() || (editingId && editingHadSubject)) record.subject = newSubject.trim() || null;
    // same for the Arabic (Female) text: only sent when used, so older databases keep working
    if (arf || (editingId && editingHadFemale)) record.body_ar_female = arf || null;

    const wasEditing = !!editingId;
    const { error } = editingId
      ? await supabase.from('email_templates').update(record).eq('id', editingId)
      : await supabase.from('email_templates').insert([record]);

    if (error) {
      setIsError(true);
      setStatusMsg(explainDbError(error.message, wasEditing ? 'Update Error' : 'Save Error'));
    } else {
      setIsError(false);
      setStatusMsg(`✓ ${newType} template ${wasEditing ? 'updated' : 'saved'} successfully!`);
      if (typeFilter !== 'all' && typeFilter !== newType) setTypeFilter(newType);
      resetForm();
      setShowAddForm(false);
      fetchTemplates();
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this email template?')) {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) {
        setIsError(true);
        setStatusMsg(`Delete Error: ${error.message}`);
      } else {
        fetchTemplates();
      }
    }
  };

  // ----- placeholder filling -----
  const fillText = (raw: string, isArabic: boolean) => {
    const values = { name: customerName.trim(), ref: ticketRef.trim(), amount: amountVal.trim(), agent: agentName.trim() };
    let t = raw || '';

    // explicit {{placeholders}} (kept visible when the value is empty so nothing is sent by mistake)
    t = t.replace(PLACEHOLDER_REGEX, (match, name) => {
      const kind = placeholderKind(name);
      return kind && values[kind] ? values[kind] : match;
    });

    const used = (kind: string) => {
      const re = new RegExp(PLACEHOLDER_REGEX.source, 'gi');
      let m: RegExpExecArray | null;
      while ((m = re.exec(raw || '')) !== null) {
        if (placeholderKind(m[1]) === kind) return true;
      }
      return false;
    };

    // older templates without placeholders keep working
    if (values.name && !used('name')) {
      t = isArabic
        ? t.replace(/عزيزي العميل/g, `عزيزي ${values.name}`).replace(/عزيزتي العميلة/g, `عزيزتي ${values.name}`)
        : t.replace(/Dear Customer|Dear Valued Customer|Dear XXXXX/g, `Dear ${values.name}`);
    }
    if (values.ref && !used('ref')) {
      t = t.replace(/Reference ID|Ref ID/, `Ref ID: ${values.ref}`);
    }
    if (values.amount && !used('amount')) {
      t = t.replace(/\b(transfer|payment)\b/, `$1 of ${values.amount} KWD`);
    }
    return t;
  };

  const missingPlaceholders = (text: string) => {
    const found = new Set<string>();
    let m: RegExpExecArray | null;
    const re = new RegExp(PLACEHOLDER_REGEX.source, 'gi');
    while ((m = re.exec(text)) !== null) {
      const kind = placeholderKind(m[1]);
      found.add(kind === 'name' ? 'customer name' : kind === 'ref' ? 'ticket / ref ID' : kind === 'amount' ? 'amount' : kind === 'agent' ? 'your name' : m[1]);
    }
    return Array.from(found);
  };

  const handleCopy = async (text: string, key: string) => {
    if (!text) return;
    if (await copyToClipboard(text)) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 2000);
    }
  };

  // ----- filtering -----
  const typeCounts = {
    all: templates.length,
    Escalation: templates.filter((t) => normalizeType(t.macro_type) === 'Escalation').length,
    FL: templates.filter((t) => normalizeType(t.macro_type) === 'FL').length,
  };

  const categoryList = useMemo(() => {
    const counts = new Map<string, number>();
    templates
      .filter((t) => typeFilter === 'all' || normalizeType(t.macro_type) === typeFilter)
      .forEach((t) => {
        const c = (t.category || 'General').trim();
        counts.set(c, (counts.get(c) || 0) + 1);
      });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [templates, typeFilter]);

  // existing topic names (emails + chat macros) offered while typing a category so the names stay consistent and linked
  const knownTopics = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => t.category && set.add(t.category.trim()));
    chatMacros.forEach((m) => {
      const c = m.category || m.topic || m.category_name;
      if (c) set.add(c.trim());
    });
    return Array.from(set).sort();
  }, [templates, chatMacros]);

  const filteredTemplates = templates
    .filter((t) => {
      if (typeFilter !== 'all' && normalizeType(t.macro_type) !== typeFilter) return false;
      if (categoryFilter !== 'all' && (t.category || 'General').trim() !== categoryFilter) return false;
      if (favOnly && !(t.id && favorites.has(t.id))) return false;
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return [t.title, t.category, t.subject, t.body_en, t.body_ar, t.body_ar_female].some((x) => String(x || '').toLowerCase().includes(term));
    })
    .sort((a, b) => Number(!!(b.id && favorites.has(b.id))) - Number(!!(a.id && favorites.has(a.id))));

  const typeButtons: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: typeCounts.all },
    { key: 'Escalation', label: 'Escalation Only', count: typeCounts.Escalation },
    { key: 'FL', label: 'FL Only', count: typeCounts.FL },
  ];

  const typeBadge = (t?: string | null) =>
    normalizeType(t) === 'FL' ? (
      <Badge variant="outline" className="text-[10px] font-bold border-sky-500/50 text-sky-600 dark:text-sky-400 bg-sky-500/10">FL</Badge>
    ) : (
      <Badge variant="outline" className="text-[10px] font-bold border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10">Escalation</Badge>
    );

  const smallCopyBtn = (label: string, text: string, key: string) => (
    <button
      key={key}
      type="button"
      onClick={() => handleCopy(text, key)}
      className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500/60 hover:text-emerald-500"
    >
      {copiedKey === key ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
      {copiedKey === key ? 'Copied!' : label}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Mail className="h-6 w-6 text-emerald-500" /> Email Response Templates
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            FL and Escalation email templates with auto-fill, and the chat macros that share the same topic
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdminOrTL && (
            <>
              <input type="file" ref={fileInputRef} accept=".csv" onChange={handleCSVUpload} className="hidden" />
              <Button
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="h-9 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold"
              >
                <Upload className="h-4 w-4" /> Upload CSV Templates
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleAddButton} className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            <Plus className="h-4 w-4" /> Add Template
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
          {isError ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
          <span className="break-words min-w-0">{statusMsg}</span>
        </div>
      )}

      {/* Smart Suggest: describe the case, get the best email templates (and chat macros) */}
      <SmartSuggestPanel
        macros={chatMacros}
        emails={templates}
        defaultKind="email"
        storageKey="email"
        fillEmail={fillText}
        onShowEmail={showEmailInList}
        userEmail={currentUser?.user_email}
      />

      {/* Add / Edit form */}
      {showAddForm && (
        <div ref={formRef} className="scroll-mt-4">
          <Card className="border border-emerald-500/40 bg-emerald-500/5 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'Edit Email Template' : 'Create New Email Template'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
                {/* STEP 1 */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-600 dark:text-slate-300">Step 1 – Is this template for FL or Escalation?</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNewType('Escalation')}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        newType === 'Escalation'
                          ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-amber-500/60'
                      }`}
                    >
                      <ShieldAlert className="h-5 w-5 shrink-0" />
                      <span>
                        <span className="block text-sm font-bold">Escalation</span>
                        <span className="block text-[11px] opacity-80">Used when a case is escalated</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('FL')}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        newType === 'FL'
                          ? 'border-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400'
                          : 'border-slate-300 dark:border-slate-700 text-slate-500 hover:border-sky-500/60'
                      }`}
                    >
                      <Headphones className="h-5 w-5 shrink-0" />
                      <span>
                        <span className="block text-sm font-bold">FL</span>
                        <span className="block text-[11px] opacity-80">First line support template</span>
                      </span>
                    </button>
                  </div>
                </div>

                {newType && (
                  <>
                    {/* STEP 2 */}
                    <div className="space-y-2">
                      <label className="font-semibold text-slate-600 dark:text-slate-300">Step 2 – Title, topic and subject</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          type="text"
                          placeholder="Template title, e.g. Tabby Card Dispute Guidance"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          className="h-9 text-xs bg-white dark:bg-slate-950"
                          required
                        />
                        <div>
                          <Input
                            type="text"
                            list="email-topic-list"
                            placeholder="Topic / category, e.g. Card Dispute"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="h-9 text-xs bg-white dark:bg-slate-950"
                          />
                          <datalist id="email-topic-list">
                            {knownTopics.map((t) => (
                              <option key={t} value={t} />
                            ))}
                          </datalist>
                        </div>
                      </div>
                      <Input
                        type="text"
                        placeholder="Email subject line (optional)"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950"
                      />
                      <p className="text-[11px] text-slate-500">
                        Tip: use the same topic name as the matching chat macro, so they appear together automatically.
                      </p>
                    </div>

                    {/* STEP 3 */}
                    <div className="space-y-2">
                      <label className="font-semibold text-slate-600 dark:text-slate-300">Step 3 – Choose the language(s) and write the response</label>
                      <div className="flex flex-wrap gap-2">
                        {([
                          { k: 'en', label: 'English' },
                          { k: 'ar', label: 'Arabic (Male)' },
                          { k: 'arf', label: 'Arabic (Female)' },
                        ] as const).map((l) => {
                          const on = newLangs[l.k];
                          return (
                            <button
                              key={l.k}
                              type="button"
                              onClick={() => setNewLangs((prev) => ({ ...prev, [l.k]: !prev[l.k] }))}
                              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                                on
                                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'border-slate-300 dark:border-slate-700 text-slate-500'
                              }`}
                            >
                              {on ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />} {l.label}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">Insert placeholder:</span>
                        {PLACEHOLDER_TAGS.map((p) => (
                          <span key={p.tag} className="inline-flex items-center gap-1">
                            {newLangs.en && (
                              <button type="button" onClick={() => appendTag('en', p.tag)} title={`Add ${p.tag} to the English text`} className="rounded-md border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 hover:border-emerald-500/60 hover:text-emerald-500">
                                EN {p.tag}
                              </button>
                            )}
                            {newLangs.ar && (
                              <button type="button" onClick={() => appendTag('ar', p.tag)} title={`Add ${p.tag} to the Arabic (Male) text`} className="rounded-md border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 hover:border-emerald-500/60 hover:text-emerald-500">
                                AR♂ {p.tag}
                              </button>
                            )}
                            {newLangs.arf && (
                              <button type="button" onClick={() => appendTag('arf', p.tag)} title={`Add ${p.tag} to the Arabic (Female) text`} className="rounded-md border border-slate-300 dark:border-slate-700 px-1.5 py-0.5 text-[10px] font-mono text-slate-500 hover:border-emerald-500/60 hover:text-emerald-500">
                                AR♀ {p.tag}
                              </button>
                            )}
                          </span>
                        ))}
                      </div>

                      <div className={`grid grid-cols-1 ${[newLangs.en, newLangs.ar, newLangs.arf].filter(Boolean).length >= 2 ? 'md:grid-cols-2' : ''} ${[newLangs.en, newLangs.ar, newLangs.arf].filter(Boolean).length === 3 ? 'xl:grid-cols-3' : ''} gap-3`}>
                        {newLangs.en && (
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-500">English Response Body</label>
                            <Textarea
                              placeholder="Dear {{customer_name}}, Thank you for reaching out..."
                              value={newBodyEN}
                              onChange={(e) => setNewBodyEN(e.target.value)}
                              className="text-xs min-h-[120px] bg-white dark:bg-slate-950"
                            />
                          </div>
                        )}
                        {newLangs.arf && (
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-500">Arabic (Female) Response Body</label>
                            <Textarea
                              dir="rtl"
                              placeholder="عزيزتي {{customer_name}}، نشكر تواصلكِ مع تابي..."
                              value={newBodyARF}
                              onChange={(e) => setNewBodyARF(e.target.value)}
                              className="text-xs min-h-[120px] bg-white dark:bg-slate-950"
                            />
                          </div>
                        )}
                        {newLangs.ar && (
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-500">Arabic (Male) Response Body</label>
                            <Textarea
                              dir="rtl"
                              placeholder="عزيزي {{customer_name}}، نشكر تواصلك مع تابي..."
                              value={newBodyAR}
                              onChange={(e) => setNewBodyAR(e.target.value)}
                              className="text-xs min-h-[120px] bg-white dark:bg-slate-950"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!newType} className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                    {editingId ? 'Save Changes' : 'Save Template'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Auto-Fill Variable Controls */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-4 space-y-3">
          <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <User className="h-4 w-4" /> Live Auto-Fill Placeholders
            <span className="font-normal text-slate-400">(fills {'{{customer_name}}'} {'{{ticket_id}}'} {'{{amount}}'} {'{{agent_name}}'} in every template below)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Customer Name</label>
              <Input type="text" placeholder="e.g. Mohamed Al-Mansoor" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="h-8 text-xs bg-slate-50 dark:bg-slate-950 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Ticket / Ref ID</label>
              <Input type="text" placeholder="e.g. TAB-908123" value={ticketRef} onChange={(e) => setTicketRef(e.target.value)} className="h-8 text-xs bg-slate-50 dark:bg-slate-950 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Amount (Optional)</label>
              <Input type="text" placeholder="e.g. 250.000" value={amountVal} onChange={(e) => setAmountVal(e.target.value)} className="h-8 text-xs bg-slate-50 dark:bg-slate-950 mt-1" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">My Name (signature)</label>
              <Input type="text" placeholder="e.g. Omar Allaa" value={agentName} onChange={(e) => setAgentName(e.target.value)} className="h-8 text-xs bg-slate-50 dark:bg-slate-950 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Type filter + Favorites + Search */}
      <div ref={listRef} className="space-y-3 scroll-mt-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900 text-xs shrink-0 self-start">
            {typeButtons.map((b) => (
              <Button
                key={b.key}
                variant={typeFilter === b.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setTypeFilter(b.key);
                  setCategoryFilter('all');
                }}
                className="h-8 text-xs gap-1.5 rounded-lg"
              >
                {b.label}
                <span className="text-[10px] font-black opacity-70">{b.count}</span>
              </Button>
            ))}
          </div>

          <Button
            variant={favOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFavOnly((v) => !v)}
            className="h-10 text-xs gap-1.5 rounded-xl self-start"
            title="Show only the templates you starred"
          >
            <Star className={`h-3.5 w-3.5 ${favOnly ? 'fill-current' : ''}`} /> My Favorites
            <span className="text-[10px] font-black opacity-70">{favorites.size}</span>
          </Button>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search templates by title, topic, subject or text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
        </div>

        {categoryList.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Topic:</span>
            {[['all', templates.filter((t) => typeFilter === 'all' || normalizeType(t.macro_type) === typeFilter).length] as [string, number], ...categoryList].map(([name, count]) => {
              const active = categoryFilter === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategoryFilter(name)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                    active
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-emerald-500/60'
                  }`}
                >
                  {name === 'all' ? 'All topics' : name} <span className="opacity-60">{count}</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="text-[11px] text-slate-400">
          Showing {filteredTemplates.length} of {templates.length} templates
        </div>
      </div>

      {/* Template cards */}
      <div className="space-y-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template, idx) => {
            const cardKey = template.id || String(idx);
            const filledEN = template.body_en ? fillText(template.body_en, false) : '';
            const filledAR = template.body_ar ? fillText(template.body_ar, true) : '';
            const filledARF = template.body_ar_female ? fillText(template.body_ar_female, true) : '';
            const filledSubject = template.subject ? fillText(template.subject, false) : '';
            const missing = missingPlaceholders(`${filledSubject}\n${filledEN}\n${filledAR}\n${filledARF}`);
            const isFav = !!(template.id && favorites.has(template.id));

            // everything that shares this template's topic
            const topicLabels = [template.category, template.title];
            const relatedMacros = chatMacros.filter((m) => anyTopicMatch(topicLabels, [m.category, m.topic, m.category_name]));
            const relatedEmails = templates.filter((o) => o !== template && anyTopicMatch(topicLabels, [o.category, o.title]));
            const relatedCount = relatedMacros.length + relatedEmails.length;
            const relatedOpen = !!openRelated[cardKey];

            return (
              <Card key={cardKey} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-500" /> {template.title}
                    </CardTitle>
                    {typeBadge(template.macro_type)}
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px]">
                      {template.category}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    {template.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(template.id)}
                        className={`h-8 px-2 ${isFav ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}
                        title={isFav ? 'Remove from my favorites' : 'Add to my favorites'}
                      >
                        <Star className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                      </Button>
                    )}
                    {template.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(template)}
                        className="text-sky-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 h-8 px-2"
                        title="Edit Template"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {isAdminOrTL && template.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id!)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-2 space-y-3 text-xs">
                  {filledSubject && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold uppercase text-slate-500 mr-2">Subject</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 break-words">{filledSubject}</span>
                      </div>
                      {smallCopyBtn('Copy Subject', filledSubject, `sub-${cardKey}`)}
                    </div>
                  )}

                  {filledEN && (
                    <div>
                      <div className="font-bold text-slate-500 text-[11px] mb-1">English Version:</div>
                      <p className="font-sans text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                        {filledEN}
                      </p>
                      <div className="flex justify-end pt-1">
                        <Button size="sm" onClick={() => handleCopy(filledEN, `en-${cardKey}`)} className="h-7 text-[11px] font-bold gap-1 bg-slate-900 dark:bg-slate-800 text-white">
                          {copiedKey === `en-${cardKey}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedKey === `en-${cardKey}` ? 'Copied!' : 'Copy English'}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {filledAR && (
                    <div>
                      <div className="font-bold text-slate-500 text-[11px] mb-1">Arabic Version – Male (النسخة العربية):</div>
                      <p dir="rtl" className="font-sans text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                        {filledAR}
                      </p>
                      <div className="flex justify-end pt-1">
                        <Button size="sm" onClick={() => handleCopy(filledAR, `ar-${cardKey}`)} className="h-7 text-[11px] font-bold gap-1 bg-slate-900 dark:bg-slate-800 text-white">
                          {copiedKey === `ar-${cardKey}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedKey === `ar-${cardKey}` ? 'Copied!' : 'Copy Arabic (Male)'}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {filledARF && (
                    <div>
                      <div className="font-bold text-slate-500 text-[11px] mb-1">Arabic Version – Female (النسخة العربية للمؤنث):</div>
                      <p dir="rtl" className="font-sans text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                        {filledARF}
                      </p>
                      <div className="flex justify-end pt-1">
                        <Button size="sm" onClick={() => handleCopy(filledARF, `arf-${cardKey}`)} className="h-7 text-[11px] font-bold gap-1 bg-slate-900 dark:bg-slate-800 text-white">
                          {copiedKey === `arf-${cardKey}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedKey === `arf-${cardKey}` ? 'Copied!' : 'Copy Arabic (Female)'}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {missing.length > 0 && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-start gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>Fill in the {missing.join(', ')} above before copying, the placeholder is still in the text.</span>
                    </div>
                  )}

                  {/* Same-topic items */}
                  {relatedCount > 0 && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setOpenRelated((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Same topic: {relatedMacros.length} chat macro{relatedMacros.length === 1 ? '' : 's'}
                        {relatedEmails.length > 0 && ` · ${relatedEmails.length} other email${relatedEmails.length === 1 ? '' : 's'}`}
                        {relatedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>

                      {relatedOpen && (
                        <div className="mt-2 space-y-3 p-3 rounded-xl border border-sky-500/30 bg-sky-500/5">
                          {relatedMacros.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                                <MessageSquare className="h-3 w-3" /> Chat macros on this topic
                              </div>
                              {relatedMacros.map((m, i) => {
                                const mKey = `${cardKey}-m-${m.id || i}`;
                                const preview = m.english_en || m.male_ar || m.female_ar || '';
                                return (
                                  <div key={mKey} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-800 dark:text-slate-100">{m.category || m.topic || m.category_name}</span>
                                      {typeBadge(m.macro_type)}
                                    </div>
                                    <p className="text-slate-500 line-clamp-2 whitespace-pre-wrap">{preview}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {m.male_ar && smallCopyBtn('AR (Male)', m.male_ar, `${mKey}-male`)}
                                      {m.female_ar && smallCopyBtn('AR (Female)', m.female_ar, `${mKey}-female`)}
                                      {m.english_en && smallCopyBtn('EN', m.english_en, `${mKey}-en`)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {relatedEmails.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                                <Mail className="h-3 w-3" /> Other email templates on this topic
                              </div>
                              {relatedEmails.map((o, i) => {
                                const oKey = `${cardKey}-e-${o.id || i}`;
                                return (
                                  <div key={oKey} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-bold text-slate-800 dark:text-slate-100">{o.title}</span>
                                      {typeBadge(o.macro_type)}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {o.subject && smallCopyBtn('Subject', fillText(o.subject, false), `${oKey}-sub`)}
                                      {o.body_en && smallCopyBtn('English', fillText(o.body_en, false), `${oKey}-en`)}
                                      {o.body_ar && smallCopyBtn('Arabic (Male)', fillText(o.body_ar, true), `${oKey}-ar`)}
                                      {o.body_ar_female && smallCopyBtn('Arabic (Female)', fillText(o.body_ar_female, true), `${oKey}-arf`)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium">
              {templates.length === 0 ? 'No email templates found.' : 'No templates match these filters.'}
            </p>
            <p className="text-xs mt-1">
              {templates.length === 0
                ? 'Add a template with the button above, or upload a .csv file (Admin / Team Leader).'
                : 'Try another type, topic or search word, or turn off My Favorites.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
