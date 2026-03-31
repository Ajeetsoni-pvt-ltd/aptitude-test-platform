// frontend/src/pages/admin/UploadQuestionsPage.tsx
// Redesigned Upload Questions — cyber-neon design system

import { useState, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import apiClient from '@/api/axios';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { cn } from '@/lib/utils';
import {
  Upload, CheckCircle2, AlertTriangle, FileText,
  X, Zap, Code,
} from 'lucide-react';

interface UploadResult {
  savedCount:   number;
  totalParsed:  number;
  parseErrors?: string[];
}

const ACCEPT_FORMATS = '.docx,.json,.csv';

const UploadQuestionsPage = () => {
  const [file,        setFile]       = useState<File | null>(null);
  const [isUploading, setUploading]  = useState(false);
  const [result,      setResult]     = useState<UploadResult | null>(null);
  const [error,       setError]      = useState('');
  const [isDragging,  setIsDragging] = useState(false);
  const fileInputRef                 = useRef<HTMLInputElement>(null);

  const ALLOWED = ['.docx', '.json', '.csv'];
  const isAllowed = (name: string) => ALLOWED.some(ext => name.toLowerCase().endsWith(ext));

  const handleFileSelect = (selected: File | null | undefined) => {
    if (!selected) return;
    if (!isAllowed(selected.name)) {
      setError('Only .docx, .json, .csv files are allowed!');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }
    setFile(selected);
    setError('');
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) { setError('Please select a file first.'); return; }
    setUploading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/upload/questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data.data);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const ext = file?.name.split('.').pop()?.toLowerCase();
  const extColor = ext === 'docx' ? 'text-neon-cyan' : ext === 'json' ? 'text-neon-green' : 'text-neon-amber';

  return (
    <AdminLayout>
      <div className="min-h-screen" style={{ background: '#080810' }}>
        <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto p-6">

          {/* Header */}
          <div className="mb-8 animate-fade-up">
            <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Admin</p>
            <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
              Upload <span className="gradient-text-cyan-violet">Questions</span>
            </h1>
            <p className="text-white/30 text-sm font-inter mt-1.5">
              Parse and import questions from .docx, .json, or .csv files
            </p>
          </div>

          <div className="space-y-5">

            {/* Upload Card */}
            <NeonCard variant="cyan" padding="p-6" className="animate-fade-up">
              <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                <Upload size={17} className="text-neon-cyan" />
                File Upload
              </h2>

              {/* Drop Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFileSelect(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  'border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300',
                  isDragging && 'border-neon-cyan/60 bg-neon-cyan/[0.04] scale-[1.01]',
                  file && !isDragging && 'border-neon-green/50 bg-neon-green/[0.04]',
                  !file && !isDragging && 'border-white/10 hover:border-neon-cyan/30 hover:bg-neon-cyan/[0.03]'
                )}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-neon-green/10 border border-neon-green/25 flex items-center justify-center">
                      <CheckCircle2 size={32} className="text-neon-green" />
                    </div>
                    <div>
                      <p className={cn('font-inter font-semibold', extColor)}>{file.name}</p>
                      <p className="text-white/30 text-sm font-inter mt-1">
                        {(file.size / 1024).toFixed(1)} KB · {ext?.toUpperCase()} Format
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); setError(''); }}
                      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-neon-red transition-colors"
                    >
                      <X size={13} /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                      'w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-300',
                      isDragging
                        ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan'
                        : 'bg-white/5 border-white/10 text-white/25'
                    )}>
                      <Upload size={28} />
                    </div>
                    <div>
                      <p className="text-white/60 text-sm font-inter font-medium">
                        {isDragging ? 'Drop it here!' : 'Click to browse or drag & drop'}
                      </p>
                      <p className="text-white/20 text-xs font-inter mt-1">
                        Supported formats: .docx · .json · .csv (max 5MB)
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_FORMATS}
                  onChange={e => handleFileSelect(e.target.files?.[0])}
                  className="hidden"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-neon-red/8 border border-neon-red/25 animate-fade-in">
                  <AlertTriangle size={14} className="text-neon-red flex-shrink-0" />
                  <p className="text-neon-red text-sm font-inter">{error}</p>
                </div>
              )}

              <div className="mt-5">
                <HoloButton
                  variant="cyan"
                  size="lg"
                  fullWidth
                  loading={isUploading}
                  disabled={!file || isUploading}
                  onClick={handleUpload}
                  icon={<Zap size={16} />}
                  className="font-orbitron tracking-widest"
                >
                  {isUploading ? 'PARSING & UPLOADING...' : 'UPLOAD & PARSE'}
                </HoloButton>
              </div>
            </NeonCard>

            {/* Result */}
            {result && (
              <NeonCard variant="green" padding="p-6" className="animate-fade-in">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-neon-green/20 border border-neon-green/30 flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-neon-green" />
                  </div>
                  <div>
                    <h3 className="font-inter font-bold text-neon-green">Upload Successful!</h3>
                    <p className="text-white/30 text-xs font-inter mt-0.5">Questions imported into the database</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {[
                    { label: 'Questions Saved', value: result.savedCount,  color: 'text-neon-green',  bg: 'bg-neon-green/10',  border: 'border-neon-green/20' },
                    { label: 'Total Parsed',    value: result.totalParsed, color: 'text-neon-cyan',   bg: 'bg-neon-cyan/10',   border: 'border-neon-cyan/20'  },
                  ].map(s => (
                    <div key={s.label} className={cn('text-center p-4 rounded-xl border', s.bg, s.border)}>
                      <p className={cn('font-orbitron text-4xl font-bold', s.color)}>{s.value}</p>
                      <p className="text-white/30 text-xs font-inter mt-1 uppercase tracking-wider">{s.label}</p>
                    </div>
                  ))}
                </div>

                {result.parseErrors && result.parseErrors.length > 0 && (
                  <div className="p-4 rounded-xl bg-neon-amber/5 border border-neon-amber/20">
                    <p className="text-neon-amber text-xs font-semibold mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> {result.parseErrors.length} Parse Warning(s)
                    </p>
                    <div className="space-y-1">
                      {result.parseErrors.map((e, i) => (
                        <p key={i} className="text-white/40 text-xs font-inter">• {e}</p>
                      ))}
                    </div>
                  </div>
                )}
              </NeonCard>
            )}

            {/* Format Guide */}
            <NeonCard variant="default" padding="p-6" className="animate-fade-up">
              <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                <Code size={17} className="text-neon-violet" />
                Format Guide
              </h2>

              <div className="space-y-4">
                {/* .docx format */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neon-cyan/15 border border-neon-cyan/25 text-neon-cyan font-mono-code">.docx</span>
                    <span className="text-white/30 text-xs font-inter">Word document format</span>
                  </div>
                  <pre className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-xs font-mono-code text-neon-green/80 overflow-x-auto leading-relaxed">
{`TOPIC: Quantitative Aptitude
SUBTOPIC: Percentage
DIFFICULTY: easy

Q1. Question text here?
A) Option 1
B) Option 2
C) Option 3
D) Option 4
ANSWER: B
EXPLANATION: Explanation here`}</pre>
                </div>

                {/* JSON format */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-neon-green/15 border border-neon-green/25 text-neon-green font-mono-code">.json</span>
                    <span className="text-white/30 text-xs font-inter">JSON array format</span>
                  </div>
                  <pre className="bg-white/[0.03] border border-white/8 rounded-xl p-4 text-xs font-mono-code text-neon-cyan/80 overflow-x-auto leading-relaxed">
{`[
  {
    "questionText": "What is 15% of 200?",
    "options": ["25", "30", "35", "40"],
    "correctAnswer": "30",
    "topic": "Quantitative Aptitude",
    "difficulty": "easy",
    "explanation": "15% × 200 = 30"
  }
]`}</pre>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                  {[
                    'Exactly 4 options (A, B, C, D)',
                    'ANSWER must be a letter only',
                    'Max file size: 5MB',
                    'UTF-8 encoding required',
                  ].map(rule => (
                    <div key={rule} className="flex items-start gap-1.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                      <FileText size={11} className="text-neon-cyan flex-shrink-0 mt-0.5" />
                      <span className="text-white/35 text-[11px] font-inter leading-tight">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </NeonCard>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UploadQuestionsPage;