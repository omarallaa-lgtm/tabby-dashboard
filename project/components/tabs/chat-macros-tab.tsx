'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Copy, Check, Search, Plus, Trash2, Upload, UserCheck, Globe, Sparkles, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';
import Papa from 'papaparse';

interface ChatMacro {
  id?: string;
  category?: string;
  topic?: string;
  category_name?: string;
  male_ar?: string;
  female_ar?: string;
  english_en?: string;
  help_tips?: string;
  links?: string;
}

export function ChatMacrosTab() {
  const { currentUser } = useMetrics() as any;
  const [macros, setMacros] = useState<ChatMacro[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLang, setSelectedLang] = useState<'male_ar' | 'female_ar' | 'english_en'>('male_ar');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Add Macro Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
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

  // CSV Upload Handler for Chat Macros
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
            return {
              category: cat,
              topic: cat,
              category_name: cat,
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
            setStatusMsg('CSV Error: File is empty or headers must match category, male_ar, female_ar, english_en.');
            setUploading(false);
            return;
          }

          const { error } = await supabase.from('chat_macros').insert(recordsToInsert);

          if (error) {
            setIsError(true);
            setStatusMsg(`Upload Error: ${error.message}`);
          } else {
            setIsError(false);
            setStatusMsg(`✓ Imported ${recordsToInsert.length} chat macros successfully!`);
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

    if (!newCategory.trim()) {
      setIsError(true);
      setStatusMsg('Please provide a Category / Topic name.');
      return;
    }

    if (!newMaleAR.trim() && !newFemaleAR.trim() && !newEnglishEN.trim()) {
      setIsError(true);
      setStatusMsg('Please fill in at least one script field (Arabic Male/Female or English).');
      return;
    }

    const categoryVal = newCategory.trim();

    const newRecord = {
      category: categoryVal,
      topic: categoryVal,
      category_name: categoryVal,
      male_ar: newMaleAR.trim(),
      female_ar: newFemaleAR.trim(),
      english_en: newEnglishEN.trim(),
      help_tips: newHelpTips.trim() || null,
      links: newLinks.trim() || null,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('chat_macros').insert([newRecord]);

    if (error) {
      setIsError(true);
      setStatusMsg(`Save Error: ${error.message}`);
    } else {
      setIsError(false);
      setStatusMsg('✓ Chat Macro saved successfully!');
      setNewCategory('');
      setNewMaleAR('');
      setNewFemaleAR('');
      setNewEnglishEN('');
      setNewHelpTips('');
      setNewLinks('');
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

  const filteredMacros = macros.filter((m) => {
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

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <MessageSquare className="h-6 w-6 text-emerald-500" /> Chat Escalation Macros
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            CSV-driven chat macro repository with Arabic (Male/Female) and English scripts
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
              <Button
                size="sm"
                onClick={() => setShowAddForm(!showAddForm)}
                className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                <Plus className="h-4 w-4" /> Add Macro
              </Button>
            </>
          )}
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
          {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Add Macro Modal / Form */}
      {showAddForm && isAdminOrTL && (
        <Card className="border border-emerald-500/40 bg-emerald-500/5 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Plus className="h-4 w-4" /> Add New Chat Macro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddMacro} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Macro Category / Topic</label>
                <Input
                  type="text"
                  placeholder="e.g. Greeting, KNET Explanation"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="h-9 text-xs bg-white dark:bg-slate-950"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Arabic (Male)</label>
                  <Textarea
                    placeholder="مرحبًا أخي..."
                    value={newMaleAR}
                    onChange={(e) => setNewMaleAR(e.target.value)}
                    className="text-xs h-20 bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Arabic (Female)</label>
                  <Textarea
                    placeholder="مرحبًا أختي..."
                    value={newFemaleAR}
                    onChange={(e) => setNewFemaleAR(e.target.value)}
                    className="text-xs h-20 bg-white dark:bg-slate-950"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">English</label>
                  <Textarea
                    placeholder="Hello, thank you for reaching out..."
                    value={newEnglishEN}
                    onChange={(e) => setNewEnglishEN(e.target.value)}
                    className="text-xs h-20 bg-white dark:bg-slate-950"
                  />
                </div>
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

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                  Save Macro
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Filter macros by category or script content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
        />
      </div>

      {/* Macro Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMacros.length > 0 ? (
          filteredMacros.map((macro, idx) => {
            const categoryDisplay = macro.category || macro.topic || macro.category_name || 'General';
            const scriptText = macro[selectedLang] || macro.english_en || macro.male_ar || macro.female_ar || '';
            const keyId = `macro-${macro.id || idx}`;

            return (
              <Card key={macro.id || idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                      <Sparkles className="h-4 w-4 text-emerald-500" /> {categoryDisplay}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px]">
                      {selectedLang === 'male_ar' ? 'AR (ذكر)' : selectedLang === 'female_ar' ? 'AR (أنثى)' : 'EN'}
                    </Badge>
                  </div>

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
            <p className="text-sm font-medium">No chat macros found.</p>
            <p className="text-xs mt-1">Upload a CSV file or add a new macro using the buttons above.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
