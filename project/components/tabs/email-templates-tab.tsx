'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Copy, Check, Search, FileText, Plus, Trash2, Upload, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase, useMetrics } from '@/lib/metrics-context';
import Papa from 'papaparse';

interface EmailTemplate {
  id?: string;
  title: string;
  category: string;
  body_en: string;
  body_ar?: string;
}

export function EmailTemplatesTab() {
  const { currentUser } = useMetrics() as any;
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Auto-Fill Variables
  const [customerName, setCustomerName] = useState('');
  const [ticketRef, setTicketRef] = useState('');
  const [amountVal, setAmountVal] = useState('');
  
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Add New Template Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General Escalation');
  const [newBodyEN, setNewBodyEN] = useState('');
  const [newBodyAR, setNewBodyAR] = useState('');
  
  // Status Messages
  const [statusMsg, setStatusMsg] = useState('');
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isAdminOrTL = currentUser?.role === 'Admin' || currentUser?.role === 'Team Leader';

  const fetchTemplates = async () => {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTemplates(data);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Handle CSV File Upload for Bulk Templates Import
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setIsError(false);
    setStatusMsg('Parsing and uploading CSV templates...');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedRows: any[] = results.data;
          const recordsToInsert = parsedRows.map((row) => ({
            title: row.title || row.Title || 'Untitled Template',
            category: row.category || row.Category || 'General',
            body_en: row.body_en || row.bodyEN || row.Body || row['English Body'] || '',
            body_ar: row.body_ar || row.bodyAR || row['Arabic Body'] || null,
          })).filter((r) => r.body_en.trim().length > 0);

          if (recordsToInsert.length === 0) {
            setIsError(true);
            setStatusMsg('CSV Error: Could not find valid template rows. Ensure headers are "title", "category", "body_en", "body_ar".');
            setUploading(false);
            return;
          }

          const { error } = await supabase.from('email_templates').insert(recordsToInsert);

          if (error) {
            setIsError(true);
            setStatusMsg(`Upload Error: ${error.message}`);
          } else {
            setIsError(false);
            setStatusMsg(`✓ Success! Bulk imported ${recordsToInsert.length} email templates.`);
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

  // Add Single Template
  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBodyEN.trim()) return;

    const newRecord = {
      title: newTitle.trim(),
      category: newCategory.trim() || 'General Escalation',
      body_en: newBodyEN.trim(),
      body_ar: newBodyAR.trim() || null,
    };

    const { error } = await supabase.from('email_templates').insert([newRecord]);

    if (!error) {
      setNewTitle('');
      setNewBodyEN('');
      setNewBodyAR('');
      setShowAddForm(false);
      fetchTemplates();
    }
  };

  // Delete Template
  const handleDeleteTemplate = async (id: string) => {
    if (confirm('Are you sure you want to delete this email template?')) {
      await supabase.from('email_templates').delete().eq('id', id);
      fetchTemplates();
    }
  };

  const getFormattedBody = (template: EmailTemplate, isArabic = false) => {
    let raw = isArabic && template.body_ar ? template.body_ar : template.body_en;
    if (customerName) {
      raw = raw.replace(/Dear Customer|Dear Valued Customer|Dear XXXXX|عزيزي العميل|عزيزتي العميلة/g, `Dear ${customerName}`);
    }
    if (ticketRef) {
      raw = raw.replace(/Reference ID|Ref ID/g, `Ref ID: ${ticketRef}`);
    }
    if (amountVal) {
      raw = raw.replace(/transfer|payment/g, `transfer of ${amountVal} KWD`);
    }
    return raw;
  };

  const handleCopyText = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.body_en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Mail className="h-6 w-6 text-emerald-500" /> Dynamic Email Response Templates
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Manage, upload CSV batch templates, or copy auto-filled escalation response scripts
          </p>
        </div>

        {isAdminOrTL && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-9 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 font-bold"
            >
              <Upload className="h-4 w-4" /> Upload CSV Templates
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              <Plus className="h-4 w-4" /> Add Single Template
            </Button>
          </div>
        )}
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}`}>
          {isError ? <AlertCircle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Add New Template Modal/Form */}
      {showAddForm && isAdminOrTL && (
        <Card className="border border-emerald-500/40 bg-emerald-500/5 dark:bg-slate-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <Plus className="h-4 w-4" /> Create New Email Template
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTemplate} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold">Template Title</label>
                  <Input
                    type="text"
                    placeholder="e.g. Tabby Card Dispute Guidance"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-950"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold">Category</label>
                  <Input
                    type="text"
                    placeholder="e.g. Tabby Card Dispute"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="h-9 text-xs bg-white dark:bg-slate-950"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold">English Response Body</label>
                <Textarea
                  placeholder="Dear Customer, Thank you for reaching out..."
                  value={newBodyEN}
                  onChange={(e) => setNewBodyEN(e.target.value)}
                  className="text-xs min-h-[90px] bg-white dark:bg-slate-950"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold">Arabic Response Body (Optional)</label>
                <Textarea
                  placeholder="عزيزي العميل، نشكر تواصلك مع تابي..."
                  value={newBodyAR}
                  onChange={(e) => setNewBodyAR(e.target.value)}
                  className="text-xs min-h-[90px] bg-white dark:bg-slate-950"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="h-8 text-xs">
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                  Save Template
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Auto-Fill Variable Controls */}
      <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <CardContent className="p-4 space-y-3">
          <div className="font-bold text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <User className="h-4 w-4" /> Live Auto-Fill Placeholders
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Customer Name</label>
              <Input
                type="text"
                placeholder="e.g. Mohamed Al-Mansoor"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-8 text-xs bg-slate-50 dark:bg-slate-950 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Ticket / Ref ID</label>
              <Input
                type="text"
                placeholder="e.g. TAB-908123"
                value={ticketRef}
                onChange={(e) => setTicketRef(e.target.value)}
                className="h-8 text-xs bg-slate-50 dark:bg-slate-950 mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Amount (Optional)</label>
              <Input
                type="text"
                placeholder="e.g. 250.000"
                value={amountVal}
                onChange={(e) => setAmountVal(e.target.value)}
                className="h-8 text-xs bg-slate-50 dark:bg-slate-950 mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search templates by title, category, or body text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
        />
      </div>

      {/* Dynamic Template Feed Cards */}
      <div className="space-y-4">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template, idx) => {
            const bodyEN = getFormattedBody(template, false);
            const bodyAR = template.body_ar ? getFormattedBody(template, true) : null;

            return (
              <Card key={template.id || idx} className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
                <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-emerald-500" /> {template.title}
                    </CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px]">
                      {template.category}
                    </Badge>
                  </div>

                  {isAdminOrTL && template.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id!)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-2 text-xs"
                      title="Delete Template"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardHeader>

                <CardContent className="pt-2 space-y-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-500 text-[11px] mb-1">English Version:</div>
                    <p className="font-sans text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                      {bodyEN}
                    </p>
                    <div className="flex justify-end pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleCopyText(bodyEN, `en-${template.id || idx}`)}
                        className="h-7 text-[11px] font-bold gap-1 bg-slate-900 dark:bg-slate-800 text-white"
                      >
                        {copiedKey === `en-${template.id || idx}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedKey === `en-${template.id || idx}` ? 'Copied!' : 'Copy English'}</span>
                      </Button>
                    </div>
                  </div>

                  {bodyAR && (
                    <div>
                      <div className="font-bold text-slate-500 text-[11px] mb-1">Arabic Version (النسخة العربية):</div>
                      <p className="font-sans text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed">
                        {bodyAR}
                      </p>
                      <div className="flex justify-end pt-1">
                        <Button
                          size="sm"
                          onClick={() => handleCopyText(bodyAR, `ar-${template.id || idx}`)}
                          className="h-7 text-[11px] font-bold gap-1 bg-slate-900 dark:bg-slate-800 text-white"
                        >
                          {copiedKey === `ar-${template.id || idx}` ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedKey === `ar-${template.id || idx}` ? 'Copied!' : 'Copy Arabic'}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <Mail className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium">No email templates found.</p>
            <p className="text-xs mt-1">Upload a `.csv` file using the button above or add a single template.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
