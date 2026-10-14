'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Copy, Check, Search, Plus, Trash2, Upload, UserCheck, Globe, Sparkles, ExternalLink, AlertCircle, CheckCircle2, ShieldAlert, Headphones, Pencil } from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';
import Papa from 'papaparse';

type MacroType = 'FL' | 'Escalation';
type LangKey = 'male_ar' | 'female_ar' | 'english_en';
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

// Macros saved before this feature have no type, so they count as Escalation
const normalizeType = (value?: string | null): MacroType => {
  const v = String(value || '').trim().toLowerCase();
  if (v === 'fl' || v.includes('first') || v.includes('front')) return 'FL';
  return 'Escalation';
};

const DB_COLUMN_SQL =
  "alter table chat_macros add column if not exists macro_type text default 'Escalation';";

const LANG_OPTIONS: { key: LangKey; label: string; hint: string; placeholder: string; dir: 'rtl' | 'ltr' }[] = [
  { key: 'male_ar', label: 'Arabic (Male)', hint: 'AR (Male)', placeholder: 'مرحبًا أخي...', dir: 'rtl' },
  { key: 'female_ar', label: 'Arabic (Female)', hint: 'AR (Female)', placeholder: 'مرحبًا أختي...', dir: 'rtl' },
  { key: 'english_en', label: 'English', hint: 'EN', placeholder: 'Hello, thank you for reaching out...', dir: 'ltr' },
];

export function ChatMacrosTab() {
  const { currentUser } = useMetrics() as any;
  const [macros, setMacros] = useState<ChatMacro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLang, setSelectedLang] = useState<LangKey>('male_ar');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Add Macro Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [newType, setNewType] = useState<MacroType | ''>('');
  const [newCategory, setNewCategory] = useState('');
  const [newLangs, setNewLangs] = useState<Record<LangKey, boolean>>({ male_ar: true, female_ar: true, english_en: true });
  const [newMaleAR, setNewMaleAR] = useState('');
  const [newFemaleAR, setNewFemaleAR] = useState('');
  const [newEnglishEN, setNewEnglishEN] = useState('');
  const [newHelpTips, setNewHelpTips] = useState('');
  const [newLinks, setNewLinks] = useState('');

  // Status Messages
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const scriptValue: Record<LangKey, string> = { male_ar: newMaleAR, female_ar: newFemaleAR, english_en: newEnglishEN };
  const scriptSetter: Record<LangKey, (v: string) => void> = {
    male_ar: setNewMaleAR,
    female_ar: setNewFemaleAR,
    english_en: setNewEnglishEN,
  };

  const fetchMacros = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_macros')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setMacros(data);
      }
    } catch (err: any) {
      console.error('Error fetching chat macros:', err);
    }
  };

  useEffect(() => {
    fetchMacros();
  }, []);

  // Friendly message when the database column has not been created yet
  const explainDbError = (message: string, prefix: string) => {
    if (/macro_type/i.test(message)) {
      return `${prefix}: the database needs one new column. Run this once in Supabase → SQL Editor: ${DB_COLUMN_SQL}`;
    }
    return `${prefix}: ${message}`;
  };

  const resetAddForm = () => {
    setEditingId(null);
    setNewType('');
    setNewCategory('');
    setNewLangs({ male_ar: true, female_ar: true, english_en: true });
    setNewMaleAR('');
    setNewFemaleAR('');
    setNewEnglishEN('');
    setNewHelpTips('');
    setNewLinks('');
  };

  const scrollToForm = () => {
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  // "Add Macro" button: open an empty form (or close it if an empty one is already open)
  const handleAddButton = () => {
    if (showAddForm && !editingId) {
      resetAddForm();
      setShowAddForm(false);
      return;
    }
    resetAddForm();
    setShowAddForm(true);
    scrollToForm();
  };

  // Pencil button on a card: open the form filled with that macro
  const handleStartEdit = (macro: ChatMacro) => {
    if (!macro.id) return;
    const hasAny = !!(macro.male_ar || macro.female_ar || macro.english_en);
    setStatusMsg('');
    setEditingId(macro.id);
    setNewType(normalizeType(macro.macro_type));
    setNewCategory(macro.category || macro.topic || macro.category_name || '');
    setNewMaleAR(macro.male_ar || '');
    setNewFemaleAR(macro.female_ar || '');
    setNewEnglishEN(macro.english_en || '');
    setNewLangs({
      male_ar: hasAny ? !!macro.male_ar : true,
      female_ar: hasAny ? !!macro.female_ar : true,
      english_en: hasAny ? !!macro.english_en : true,
    });
    setNewHelpTips(macro.help_tips || '');
    setNewLinks(macro.links || '');
    setShowAddForm(true);
    scrollToForm();
  };

  // CSV Upload Handler for Chat Macros
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Rows without a type column use the filter you are viewing (FL / Escalation), otherwise Escalation
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
          const recordsToInsert = parsedRows.map((row) => {
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
          }).filter((r) => r.male_ar || r.english_en || r.female_ar);

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

  // Add Single Chat Macro Manually
  const handleAddMacro = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg('');
    setIsError(false);

    if (!newType) {
      setIsError(true);
      setStatusMsg('Please choose first whether this template is FL or Escalation.');
      return;
    }

    if (!newCategory.trim()) {
      setIsError(true);
      setStatusMsg('Please provide a Category / Topic name.');
      return;
    }

    const chosen = LANG_OPTIONS.filter((l) => newLangs[l.key]);
    if (chosen.length === 0) {
      setIsError(true);
      setStatusMsg('Please select at least one language (Arabic Male, Arabic Female or English).');
      return;
    }

    if (!chosen.some((l) => scriptValue[l.key].trim())) {
      setIsError(true);
      setStatusMsg('Please write the script for at least one of the selected languages.');
      return;
    }

    const categoryVal = newCategory.trim();

    const record = {
      category: categoryVal,
      topic: categoryVal,
      category_name: categoryVal,
      macro_type: newType,
      male_ar: newLangs.male_ar ? newMaleAR.trim() : '',
      female_ar: newLangs.female_ar ? newFemaleAR.trim() : '',
      english_en: newLangs.english_en ? newEnglishEN.trim() : '',
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
      // make sure the macro is visible under the current page filter
      if (typeFilter !== 'all' && typeFilter !== newType) setTypeFilter(newType);
      resetAddForm();
      setShowAddForm(false);
      fetchMacros();
      setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  // Delete Macro
  const handleDeleteMacro = async (id: string) => {
    if (confirm('Are you sure you want to delete this chat macro?')) {
      const { error } = await supabase.from('chat_macros').delete().eq('id', id);
      if (!error) {
        fetchMacros();
      } else {
        setIsError(true);
        setStatusMsg(`Delete Error: ${error.message}`);
      }
    }
  };

  // Copy with iframe Fallback
  const handleCopy = (text: string, idKey: string) => {
    if (!text) return;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
    setCopiedIndex(idKey);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const counts = {
    all: macros.length,
    Escalation: macros.filter((m) => normalizeType(m.macro_type) === 'Escalation').length,
    FL: macros.filter((m) => normalizeType(m.macro_type) === 'FL').length,
  };

  const filteredMacros = macros.filter((m) => {
    if (typeFilter !== 'all' && normalizeType(m.macro_type) !== typeFilter) return false;

    const cat = m.category || m.topic || m.category_name || '';
    const male = m.male_ar || '';
    const female = m.female_ar || '';
    const eng = m.english_en || '';
    const term = searchTerm.toLowerCase();

    return (
      cat.toLowerCase().includes(term) ||
      male.toLowerCase().includes(term) ||
      female.toLowerCase().includes(term) ||
      eng.toLowerCase().includes(term)
    );
  });

  const typeButtons: { key: TypeFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'Escalation', label: 'Escalation Only', count: counts.Escalation },
    { key: 'FL', label: 'FL Only', count: counts.FL },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <MessageSquare className="h-6 w-6 text-emerald-500" /> Chat Macros
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            FL and Escalation chat macros with Arabic (Male/Female) and English scripts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900 text-xs">
            <Button
              variant={selectedLang === 'male_ar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedLang('male_ar')}
              className="h-8 text-xs gap-1 rounded-lg"
            >
              <UserCheck className="h-3.5 w-3.5 text-emerald-500" /> AR (Male)
            </Button>
            <Button
              variant={selectedLang === 'female_ar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedLang('female_ar')}
              className="h-8 text-xs gap-1 rounded-lg"
            >
              <UserCheck className="h-3.5 w-3.5 text-purple-500" /> AR (Female)
            </Button>
            <Button
              variant={selectedLang === 'english_en' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedLang('english_en')}
              className="h-8 text-xs gap-1 rounded-lg"
            >
              <Globe className="h-3.5 w-3.5 text-blue-500" /> EN
            </Button>
          </div>

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
          <Button
            size="sm"
            onClick={handleAddButton}
            className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
          >
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

      {/* Add Macro Form */}
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
            <form onSubmit={handleAddMacro} className="space-y-4 text-xs">
              {/* STEP 1: FL or Escalation */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-600 dark:text-slate-300">
                  Step 1 – Is this template for FL or Escalation?
                </label>
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
                  {/* STEP 2: Category */}
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 dark:text-slate-300">Step 2 – Macro Category / Topic</label>
                    <Input
                      type="text"
                      placeholder="e.g. Greeting, KNET Explanation"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="h-9 text-xs bg-white dark:bg-slate-950"
                      required
                    />
                  </div>

                  {/* STEP 3: Languages */}
                  <div className="space-y-2">
                    <label className="font-semibold text-slate-600 dark:text-slate-300">
                      Step 3 – Choose the language(s) you want to add
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {LANG_OPTIONS.map((l) => {
                        const on = newLangs[l.key];
                        return (
                          <button
                            key={l.key}
                            type="button"
                            onClick={() => setNewLangs((prev) => ({ ...prev, [l.key]: !prev[l.key] }))}
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

                    {LANG_OPTIONS.some((l) => newLangs[l.key]) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        {LANG_OPTIONS.filter((l) => newLangs[l.key]).map((l) => (
                          <div key={l.key} className="space-y-1 md:col-span-1">
                            <label className="font-semibold text-slate-500">{l.label}</label>
                            <Textarea
                              dir={l.dir}
                              placeholder={l.placeholder}
                              value={scriptValue[l.key]}
                              onChange={(e) => scriptSetter[l.key](e.target.value)}
                              className="text-xs h-24 bg-white dark:bg-slate-950"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      type="text"
                      placeholder="Help Tips / Internal Notes (Optional)"
                      value={newHelpTips}
                      onChange={(e) => setNewHelpTips(e.target.value)}
                      className="h-8 text-xs bg-white dark:bg-slate-950"
                    />
                    <Input
                      type="text"
                      placeholder="External URL / Reference Link (Optional)"
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
                    resetAddForm();
                    setShowAddForm(false);
                  }}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newType}
                  className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  {editingId ? 'Save Changes' : 'Save Macro'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Type filter + Search */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-xl p-1 bg-white dark:bg-slate-900 text-xs shrink-0 self-start">
          {typeButtons.map((b) => (
            <Button
              key={b.key}
              variant={typeFilter === b.key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTypeFilter(b.key)}
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
            placeholder="Filter macros by category or script content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
          />
        </div>
      </div>

      {/* Macro Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMacros.length > 0 ? (
          filteredMacros.map((macro, idx) => {
            const categoryDisplay = macro.category || macro.topic || macro.category_name || 'General';
            const scriptText = macro[selectedLang] || macro.english_en || macro.male_ar || macro.female_ar || '';
            const keyId = `macro-${macro.id || idx}`;
            const mType = normalizeType(macro.macro_type);

            return (
              <Card key={macro.id || idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Sparkles className="h-4 w-4 text-emerald-500" /> {categoryDisplay}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${
                        mType === 'FL'
                          ? 'border-sky-500/50 text-sky-600 dark:text-sky-400 bg-sky-500/10'
                          : 'border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10'
                      }`}
                    >
                      {mType === 'FL' ? 'FL' : 'Escalation'}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedLang === 'male_ar' ? 'AR (ذكر)' : selectedLang === 'female_ar' ? 'AR (أنثى)' : 'EN'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
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
                <CardContent className="space-y-3 pt-2 text-xs">
                  <p className="font-sans text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 whitespace-pre-wrap leading-relaxed min-h-[60px]">
                    {scriptText || <span className="text-slate-500 italic">No script content available for this language option.</span>}
                  </p>

                  {macro.help_tips && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      <strong>Tip:</strong> {macro.help_tips}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    {macro.links ? (
                      <a href={macro.links} target="_blank" rel="noreferrer" className="text-[11px] text-blue-500 hover:underline flex items-center gap-1 font-semibold">
                        <ExternalLink className="h-3 w-3" /> External Link
                      </a>
                    ) : <span />}

                    <Button
                      size="sm"
                      disabled={!scriptText}
                      onClick={() => handleCopy(scriptText, keyId)}
                      className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
                    >
                      {copiedIndex === keyId ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedIndex === keyId ? 'Copied!' : 'Copy Script'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center text-muted-foreground md:col-span-2">
            <MessageSquare className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium">
              {typeFilter === 'all' ? 'No chat macros found.' : `No ${typeFilter} macros found.`}
            </p>
            <p className="text-xs mt-1">
              {macros.length > 0
                ? 'Try another filter or clear the search box.'
                : 'Upload a CSV file or add a new macro using the buttons above.'}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
