'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, Copy, Check, Search, Plus, Trash2, Upload, Sparkles, ExternalLink, AlertCircle, CheckCircle2,
  ShieldAlert, Headphones, Pencil, Link2, ChevronDown, ChevronUp, Mail,
} from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';
import { anyTopicMatch } from '@/lib/topic-links';
import { topicFamily } from '@/lib/smart-suggest';
import { SmartSuggestPanel } from '@/components/smart-suggest-panel';
import Papa from 'papaparse';

type MacroType = 'FL' | 'Escalation';
type TypeFilter = 'all' | MacroType;

interface ChatMacro {
  id?: string;
  category?: string;
  topic?: string;
  category_name?: string;
  macro_type?: string | null;
  male_ar?: string;
  female_ar?: string;
  english_en?: string;
  help_tips?: string;
  links?: string;
}

// Macros saved before the FL / Escalation option existed count as Escalation
const normalizeType = (value?: string | null): MacroType => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'fl' || v.includes('first') || v.includes('front')) return 'FL';
  return 'Escalation';
};

const DB_COLUMN_SQL = "alter table chat_macros add column if not exists macro_type text default 'Escalation';";

const nat = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });

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

// one block per language that has text; identical male + female Arabic is shown once
const buildBlocks = (m: ChatMacro) => {
  const blocks: { key: string; label: string; dir: 'ltr' | 'rtl'; text: string; dot: string }[] = [];
  const en = (m.english_en || '').trim();
  const male = (m.male_ar || '').trim();
  const female = (m.female_ar || '').trim();
  if (en) blocks.push({ key: 'en', label: 'English', dir: 'ltr', text: en, dot: '#60a5fa' });
  if (male && female && male === female) {
    blocks.push({ key: 'ar', label: 'Arabic · Male & Female', dir: 'rtl', text: male, dot: '#10b981' });
  } else {
    if (male) blocks.push({ key: 'arm', label: 'Arabic · Male', dir: 'rtl', text: male, dot: '#10b981' });
    if (female) blocks.push({ key: 'arf', label: 'Arabic · Female', dir: 'rtl', text: female, dot: '#c084fc' });
  }
  return blocks;
};

const GRID_COLS: Record<number, string> = { 1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' };

export function ChatMacrosTab() {
  const { currentUser } = useMetrics() as any;
  const [macros, setMacros] = useState<ChatMacro[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);

  // filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [openRelated, setOpenRelated] = useState<Record<string, boolean>>({});

  // add / edit form
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newType, setNewType] = useState<MacroType | ''>('');
  const [newCategory, setNewCategory] = useState('');
  const [newEnglishEN, setNewEnglishEN] = useState('');
  const [newMaleAR, setNewMaleAR] = useState('');
  const [newFemaleAR, setNewFemaleAR] = useState('');
  const [sameArabic, setSameArabic] = useState(false);
  const [newHelpTips, setNewHelpTips] = useState('');
  const [newLinks, setNewLinks] = useState('');

  // status
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const fetchMacros = async () => {
    try {
      const { data, error } = await supabase.from('chat_macros').select('*').order('created_at', { ascending: false });
      if (!error && data) setMacros(data);
    } catch (err: any) {
      console.error('Error fetching chat macros:', err);
    }
  };

  // email templates are loaded too: for the "same topic" links and for Smart Suggest
  const fetchEmailTemplates = async () => {
    try {
      const { data, error } = await supabase.from('email_templates').select('*');
      if (!error && data) setEmailTemplates(data);
    } catch (err) {
      console.error('Error fetching email templates:', err);
    }
  };

  useEffect(() => {
    fetchMacros();
    fetchEmailTemplates();
  }, []);

  const explainDbError = (message: string, prefix: string) =>
    /macro_type/i.test(message)
      ? `${prefix}: the database needs one new column. Run this once in Supabase → SQL Editor: ${DB_COLUMN_SQL}`
      : `${prefix}: ${message}`;

  const resetForm = () => {
    setEditingId(null);
    setNewType('');
    setNewCategory('');
    setNewEnglishEN('');
    setNewMaleAR('');
    setNewFemaleAR('');
    setSameArabic(false);
    setNewHelpTips('');
    setNewLinks('');
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement>) => setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);

  const handleAddButton = () => {
    if (showAddForm && !editingId) {
      resetForm();
      setShowAddForm(false);
      return;
    }
    resetForm();
    setShowAddForm(true);
    scrollTo(formRef);
  };

  const handleStartEdit = (m: ChatMacro) => {
    if (!m.id) return;
    setStatusMsg('');
    setEditingId(m.id);
    setNewType(normalizeType(m.macro_type));
    setNewCategory(m.category || m.topic || m.category_name || '');
    setNewEnglishEN(m.english_en || '');
    setNewMaleAR(m.male_ar || '');
    setNewFemaleAR(m.female_ar || '');
    setSameArabic(!!m.male_ar && m.male_ar === m.female_ar);
    setNewHelpTips(m.help_tips || '');
    setNewLinks(m.links || '');
    setShowAddForm(true);
    scrollTo(formRef);
  };

  // CSV upload (Admin / Team Leader)
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fallbackType: MacroType = typeFilter === 'FL' ? 'FL' : 'Escalation';

    setUploading(true);
    setIsError(false);
    setStatusMsg('Parsing and uploading CSV chat macros...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedRows: any[] = results.data;
          const recordsToInsert = parsedRows
            .map((row) => {
              const cat = row.category || row.Category || row.topic || row.Topic || 'General';
              const rawType = row.type || row.Type || row.macro_type || row['Macro Type'] || '';
              return {
                category: cat,
                topic: cat,
                category_name: cat,
                macro_type: rawType ? normalizeType(rawType) : fallbackType,
                male_ar: row.male_ar || row.maleAR || row['Male AR'] || '',
                female_ar: row.female_ar || row.femaleAR || row['Female AR'] || '',
                english_en: row.english_en || row.englishEN || row['English EN'] || '',
                help_tips: row.help_tips || row['Help Tips'] || null,
                links: row.links || row.Links || null,
                created_at: new Date().toISOString(),
              };
            })
            .filter((r) => r.male_ar || r.english_en || r.female_ar);

          if (recordsToInsert.length === 0) {
            setIsError(true);
            setStatusMsg('CSV Error: File is empty or headers must match category, male_ar, female_ar, english_en (optional: type = FL or Escalation).');
            setUploading(false);
            return;
          }

          const { error } = await supabase.from('chat_macros').insert(recordsToInsert);

          if (error) {
            setIsError(true);
            setStatusMsg(explainDbError(error.message, 'Upload Error'));
          } else {
            setIsError(false);
            setStatusMsg(`✓ Imported ${recordsToInsert.length} chat macros successfully! (rows without a "type" column were saved as ${fallbackType})`);
            fetchMacros();
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

  // add or update one macro (all agents)
  const handleSaveMacro = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setIsError(false);

    if (!newType) {
      setIsError(true);
      setStatusMsg('Please choose first whether this macro is FL or Escalation.');
      return;
    }
    if (!newCategory.trim()) {
      setIsError(true);
      setStatusMsg('Please write the topic / title of the macro.');
      return;
    }
    const en = newEnglishEN.trim();
    const male = newMaleAR.trim();
    const female = sameArabic ? male : newFemaleAR.trim();
    if (!en && !male && !female) {
      setIsError(true);
      setStatusMsg('Please write the reply in at least one language.');
      return;
    }

    const categoryVal = newCategory.trim();
    const record = {
      category: categoryVal,
      topic: categoryVal,
      category_name: categoryVal,
      macro_type: newType,
      male_ar: male,
      female_ar: female,
      english_en: en,
      help_tips: newHelpTips.trim() || null,
      links: newLinks.trim() || null,
    };

    const wasEditing = !!editingId;
    const { error } = editingId
      ? await supabase.from('chat_macros').update(record).eq('id', editingId)
      : await supabase.from('chat_macros').insert([{ ...record, created_at: new Date().toISOString() }]);

    if (error) {
      setIsError(true);
      setStatusMsg(explainDbError(error.message, wasEditing ? 'Update Error' : 'Save Error'));
    } else {
      setIsError(false);
      setStatusMsg(`✓ ${newType} macro ${wasEditing ? 'updated' : 'saved'} successfully!`);
      if (typeFilter !== 'all' && typeFilter !== newType) setTypeFilter(newType);
      resetForm();
      setShowAddForm(false);
      fetchMacros();
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  const handleDeleteMacro = async (id: string) => {
    if (confirm('Are you sure you want to delete this chat macro?')) {
      const { error } = await supabase.from('chat_macros').delete().eq('id', id);
      if (!error) fetchMacros();
      else {
        setIsError(true);
        setStatusMsg(`Delete Error: ${error.message}`);
      }
    }
  };

  const handleCopy = async (text: string, key: string) => {
    if (!text) return;
    if (await copyToClipboard(text)) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((cur) => (cur === key ? null : cur)), 2000);
    }
  };

  // from Smart Suggest: jump to that macro in the list
  const showMacroInList = (category: string) => {
    setTypeFilter('all');
    setTopicFilter('all');
    setSearchTerm(category);
    scrollTo(listRef);
  };

  // ----- filtering / grouping -----
  const categoryOf = (m: ChatMacro) => m.category || m.topic || m.category_name || 'General';

  const typeCounts = {
    all: macros.length,
    Escalation: macros.filter((m) => normalizeType(m.macro_type) === 'Escalation').length,
    FL: macros.filter((m) => normalizeType(m.macro_type) === 'FL').length,
  };

  const topicList = useMemo(() => {
    const counts = new Map<string, number>();
    macros
      .filter((m) => typeFilter === 'all' || normalizeType(m.macro_type) === typeFilter)
      .forEach((m) => {
        const t = topicFamily(categoryOf(m)) || 'General';
        counts.set(t, (counts.get(t) || 0) + 1);
      });
    return Array.from(counts.entries()).sort((a, b) => nat(a[0], b[0]));
  }, [macros, typeFilter]);

  // existing topic names (chat + email) offered while typing so names stay consistent and linked
  const knownTopics = useMemo(() => {
    const set = new Set<string>();
    macros.forEach((m) => set.add(categoryOf(m).trim()));
    emailTemplates.forEach((t) => t.category && set.add(String(t.category).trim()));
    return Array.from(set).sort(nat);
  }, [macros, emailTemplates]);

  const filteredMacros = macros
    .filter((m) => {
      if (typeFilter !== 'all' && normalizeType(m.macro_type) !== typeFilter) return false;
      if (topicFilter !== 'all' && (topicFamily(categoryOf(m)) || 'General') !== topicFilter) return false;
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return [categoryOf(m), m.english_en, m.male_ar, m.female_ar, m.help_tips].some((x) => String(x || '').toLowerCase().includes(term));
    })
    .sort((a, b) => nat(topicFamily(categoryOf(a)), topicFamily(categoryOf(b))) || nat(categoryOf(a), categoryOf(b)));

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

  let lastTopic = '';

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <MessageSquare className="h-6 w-6 text-emerald-500" /> Chat Macros
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Every reply with its English, Arabic (Male) and Arabic (Female) versions together
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
                <Upload className="h-4 w-4" /> Upload CSV
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleAddButton} className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            <Plus className="h-4 w-4" /> Add Macro
          </Button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
          {isError ? <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
          <span className="break-words min-w-0">{statusMsg}</span>
        </div>
      )}

      {/* Smart Suggest */}
      <SmartSuggestPanel
        macros={macros}
        emails={emailTemplates}
        defaultKind="all"
        storageKey="chat"
        onShowMacro={showMacroInList}
        userEmail={currentUser?.user_email}
      />

      {/* Add / edit form */}
      {showAddForm && (
        <div ref={formRef} className="scroll-mt-4">
          <Card className="border border-emerald-500/40 bg-emerald-500/5 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? 'Edit Chat Macro' : 'Add New Chat Macro'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveMacro} className="space-y-4 text-xs">
                {/* STEP 1 */}
                <div className="space-y-2">
                  <label className="font-semibold text-slate-600 dark:text-slate-300">Step 1 – Is this macro for FL or Escalation?</label>
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
                        <span className="block text-[11px] opacity-80">First line support macro</span>
                      </span>
                    </button>
                  </div>
                </div>

                {newType && (
                  <>
                    {/* STEP 2 */}
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600 dark:text-slate-300">Step 2 – Topic / title</label>
                      <Input
                        type="text"
                        list="chat-topic-list"
                        placeholder="e.g. KNET - Understand the inconvenience"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="h-9 text-xs bg-white dark:bg-slate-950"
                        required
                      />
                      <datalist id="chat-topic-list">
                        {knownTopics.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                      <p className="text-[11px] text-slate-500">
                        Start the title with the topic name (for example “KNET - …”). Replies and emails with the same topic are linked automatically.
                      </p>
                    </div>

                    {/* STEP 3 */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="font-semibold text-slate-600 dark:text-slate-300">Step 3 – Write the reply (fill the languages you have)</label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                          <input
                            type="checkbox"
                            checked={sameArabic}
                            onChange={(e) => setSameArabic(e.target.checked)}
                            className="h-3.5 w-3.5 rounded accent-emerald-600"
                          />
                          Same Arabic text for male and female
                        </label>
                      </div>

                      <div className={`grid grid-cols-1 gap-3 ${sameArabic ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-500 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: '#60a5fa' }} /> English
                          </label>
                          <Textarea
                            placeholder="Hello, thank you for reaching out..."
                            value={newEnglishEN}
                            onChange={(e) => setNewEnglishEN(e.target.value)}
                            className="text-xs h-28 bg-white dark:bg-slate-950"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-500 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full" style={{ background: '#10b981' }} /> {sameArabic ? 'Arabic (Male & Female)' : 'Arabic (Male)'}
                          </label>
                          <Textarea
                            dir="rtl"
                            placeholder="مرحبًا أخي..."
                            value={newMaleAR}
                            onChange={(e) => setNewMaleAR(e.target.value)}
                            className="text-xs h-28 bg-white dark:bg-slate-950"
                          />
                        </div>
                        {!sameArabic && (
                          <div className="space-y-1">
                            <label className="font-semibold text-slate-500 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full" style={{ background: '#c084fc' }} /> Arabic (Female)
                            </label>
                            <Textarea
                              dir="rtl"
                              placeholder="مرحبًا أختي..."
                              value={newFemaleAR}
                              onChange={(e) => setNewFemaleAR(e.target.value)}
                              className="text-xs h-28 bg-white dark:bg-slate-950"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="text"
                        placeholder="Help tips / internal notes (optional)"
                        value={newHelpTips}
                        onChange={(e) => setNewHelpTips(e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-slate-950"
                      />
                      <Input
                        type="text"
                        placeholder="Link (optional)"
                        value={newLinks}
                        onChange={(e) => setNewLinks(e.target.value)}
                        className="h-8 text-xs bg-white dark:bg-slate-950"
                      />
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
                    {editingId ? 'Save Changes' : 'Save Macro'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
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
                  setTopicFilter('all');
                }}
                className="h-8 text-xs gap-1.5 rounded-lg"
              >
                {b.label}
                <span className="text-[10px] font-black opacity-70">{b.count}</span>
              </Button>
            ))}
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Filter macros by topic or script content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
        </div>

        {topicList.length > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500">Topic:</span>
            {([['all', macros.filter((m) => typeFilter === 'all' || normalizeType(m.macro_type) === typeFilter).length] as [string, number], ...topicList]).map(([name, count]) => {
              const active = topicFilter === name;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => setTopicFilter(name)}
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
          Showing {filteredMacros.length} of {macros.length} macros
        </div>
      </div>

      {/* Macro cards, grouped by topic */}
      <div className="space-y-4">
        {filteredMacros.length > 0 ? (
          filteredMacros.map((macro, idx) => {
            const category = categoryOf(macro);
            const family = topicFamily(category) || 'General';
            const showHeader = family !== lastTopic;
            lastTopic = family;
            const cardKey = macro.id || String(idx);
            const blocks = buildBlocks(macro);
            const labels = [macro.category, macro.topic, macro.category_name];
            const relatedEmails = emailTemplates.filter((t) => anyTopicMatch(labels, [t.category, t.title]));
            const relatedOpen = !!openRelated[cardKey];

            return (
              <div key={cardKey} className="space-y-3">
                {showHeader && (
                  <div className="flex items-center gap-2 pt-2">
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">{family}</h3>
                    <span className="text-[11px] text-slate-400">
                      {filteredMacros.filter((m) => (topicFamily(categoryOf(m)) || 'General') === family).length} replies
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>
                )}

                <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" /> {category}
                      </CardTitle>
                      {typeBadge(macro.macro_type)}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {macro.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(macro)}
                          className="text-sky-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40 h-7 px-2 text-xs"
                          title="Edit Macro"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {isAdminOrTL && macro.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMacro(macro.id!)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 h-7 px-2 text-xs"
                          title="Delete Macro"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-1 text-xs">
                    {blocks.length > 0 ? (
                      <div className={`grid grid-cols-1 ${GRID_COLS[blocks.length] || 'lg:grid-cols-3'} gap-3`}>
                        {blocks.map((b) => {
                          const k = `${cardKey}-${b.key}`;
                          return (
                            <div key={b.key} className="flex flex-col gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
                                  <span className="h-2 w-2 rounded-full" style={{ background: b.dot }} /> {b.label}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => handleCopy(b.text, k)}
                                  className="h-7 text-[11px] font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                                >
                                  {copiedKey === k ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                  <span>{copiedKey === k ? 'Copied!' : 'Copy'}</span>
                                </Button>
                              </div>
                              <p
                                dir={b.dir}
                                className={`font-sans text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed ${b.dir === 'rtl' ? 'text-right' : ''}`}
                              >
                                {b.text}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-500 italic">No script text for this macro.</p>
                    )}

                    {macro.help_tips && (
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                        <strong>Tip:</strong> {macro.help_tips}
                      </div>
                    )}

                    {macro.links && (
                      <a href={macro.links} target="_blank" rel="noreferrer" className="inline-flex text-[11px] text-blue-500 hover:underline items-center gap-1 font-semibold break-all">
                        <ExternalLink className="h-3 w-3 shrink-0" /> {macro.links}
                      </a>
                    )}

                    {relatedEmails.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setOpenRelated((prev) => ({ ...prev, [cardKey]: !prev[cardKey] }))}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          <Link2 className="h-3.5 w-3.5" />
                          Same topic: {relatedEmails.length} email template{relatedEmails.length === 1 ? '' : 's'}
                          {relatedOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>

                        {relatedOpen && (
                          <div className="mt-2 space-y-2 p-3 rounded-xl border border-sky-500/30 bg-sky-500/5">
                            {relatedEmails.map((t, i) => {
                              const eKey = `${cardKey}-email-${t.id || i}`;
                              const tType = normalizeType(t.macro_type);
                              const btn = (label: string, text: string, k: string) => (
                                <button
                                  key={k}
                                  type="button"
                                  onClick={() => handleCopy(text, k)}
                                  className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500/60 hover:text-emerald-500"
                                >
                                  {copiedKey === k ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                  {copiedKey === k ? 'Copied!' : label}
                                </button>
                              );
                              return (
                                <div key={eKey} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 space-y-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Mail className="h-3 w-3 text-slate-400" />
                                    <span className="font-bold text-slate-800 dark:text-slate-100">{t.title}</span>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] font-bold ${
                                        tType === 'FL'
                                          ? 'border-sky-500/50 text-sky-600 dark:text-sky-400 bg-sky-500/10'
                                          : 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                                      }`}
                                    >
                                      {tType === 'FL' ? 'FL' : 'Escalation'}
                                    </Badge>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {t.subject && btn('Subject', t.subject, `${eKey}-sub`)}
                                    {t.body_en && btn('English email', t.body_en, `${eKey}-en`)}
                                    {t.body_ar && btn('Arabic email (Male)', t.body_ar, `${eKey}-ar`)}
                                    {t.body_ar_female && btn('Arabic email (Female)', t.body_ar_female, `${eKey}-arf`)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium">{typeFilter === 'all' ? 'No chat macros found.' : `No ${typeFilter} macros found.`}</p>
            <p className="text-xs mt-1">
              {macros.length > 0 ? 'Try another filter or clear the search box.' : 'Upload a CSV file or add a new macro using the buttons above.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
