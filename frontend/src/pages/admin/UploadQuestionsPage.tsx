import { useMemo, useRef, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import QuestionPreview from '@/components/QuestionPreview';
import {
  confirmBulkQuestionsApi,
  createManualQuestionApi,
  downloadBulkTemplateApi,
  previewBulkQuestionsApi,
} from '@/api/adminApi';
import { cn } from '@/lib/utils';
import { getOptionLetter } from '@/lib/question';
import type { Question } from '@/types';
import type { BulkUploadResult } from '@/api/adminApi';
import { AlertTriangle, CheckCircle2, Download, Eye, FileSpreadsheet, Image as ImageIcon, Upload } from 'lucide-react';

type Tab = 'manual' | 'bulk';
type AnswerLetter = 'A' | 'B' | 'C' | 'D';
type OptionState = { text: string; imageFile: File | null; imagePreview: string };
type ManualState = {
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionImageFile: File | null;
  questionImagePreview: string;
  options: OptionState[];
  correctAnswer: AnswerLetter;
  explanation: string;
};

const emptyOption = (): OptionState => ({ text: '', imageFile: null, imagePreview: '' });
const initialManual = (): ManualState => ({
  topic: '',
  subtopic: '',
  difficulty: 'easy',
  questionText: '',
  questionImageFile: null,
  questionImagePreview: '',
  options: [emptyOption(), emptyOption(), emptyOption(), emptyOption()],
  correctAnswer: 'A',
  explanation: '',
});

const revokeUrl = (url?: string) => {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
};

const validateManual = (form: ManualState) => {
  const issues: string[] = [];
  if (!form.topic.trim()) issues.push('Topic is required.');
  if (!form.questionText.trim() && !form.questionImageFile) issues.push('Question must have text or image.');
  form.options.forEach((option, index) => {
    if (!option.text.trim() && !option.imageFile) issues.push(`Option ${getOptionLetter(index)} must have text or image.`);
  });
  return issues;
};

const buildManualPreview = (form: ManualState): Question => ({
  _id: 'manual-preview',
  topic: form.topic.trim(),
  subtopic: form.subtopic.trim(),
  difficulty: form.difficulty,
  questionText: form.questionText.trim() || undefined,
  questionImage: form.questionImagePreview || undefined,
  options: form.options.map((option) => ({
    text: option.text.trim() || undefined,
    image: option.imagePreview || undefined,
  })),
  correctAnswer: form.correctAnswer,
  explanation: form.explanation.trim() || undefined,
});

const buildManualFormData = (form: ManualState) => {
  const formData = new FormData();
  formData.append('topic', form.topic.trim());
  formData.append('subtopic', form.subtopic.trim());
  formData.append('difficulty', form.difficulty);
  formData.append('questionText', form.questionText.trim());
  formData.append('correctAnswer', form.correctAnswer);
  formData.append('explanation', form.explanation.trim());
  if (form.questionImageFile) formData.append('questionImage', form.questionImageFile);
  form.options.forEach((option, index) => {
    const letter = getOptionLetter(index);
    formData.append(`option${letter}_text`, option.text.trim());
    if (option.imageFile) formData.append(`option${letter}_image`, option.imageFile);
  });
  return formData;
};

const UploadQuestionsPage = () => {
  const [tab, setTab] = useState<Tab>('manual');
  const [manual, setManual] = useState<ManualState>(initialManual);
  const [manualError, setManualError] = useState('');
  const [manualSuccess, setManualSuccess] = useState('');
  const [savingManual, setSavingManual] = useState(false);
  const [showManualPreview, setShowManualPreview] = useState(false);
  const [workbook, setWorkbook] = useState<File | null>(null);
  const [imagesZip, setImagesZip] = useState<File | null>(null);
  const [bulkPreview, setBulkPreview] = useState<BulkUploadResult | null>(null);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [previewingBulk, setPreviewingBulk] = useState(false);
  const [confirmingBulk, setConfirmingBulk] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const workbookRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const manualIssues = useMemo(() => validateManual(manual), [manual]);
  const bulkQuestions = bulkPreview?.rows.filter((row) => row.question).map((row) => row.question as Question) || [];

  const setQuestionImage = (file: File | null) => {
    setManual((prev) => {
      revokeUrl(prev.questionImagePreview);
      return { ...prev, questionImageFile: file, questionImagePreview: file ? URL.createObjectURL(file) : '' };
    });
  };

  const setOptionImage = (index: number, file: File | null) => {
    setManual((prev) => {
      const options = [...prev.options];
      revokeUrl(options[index].imagePreview);
      options[index] = { ...options[index], imageFile: file, imagePreview: file ? URL.createObjectURL(file) : '' };
      return { ...prev, options };
    });
  };

  const resetManual = () => {
    revokeUrl(manual.questionImagePreview);
    manual.options.forEach((option) => revokeUrl(option.imagePreview));
    setManual(initialManual());
  };

  const saveManual = async () => {
    setSavingManual(true);
    setManualError('');
    try {
      const response = await createManualQuestionApi(buildManualFormData(manual));
      if (response.success) {
        setManualSuccess('Question saved successfully.');
        setShowManualPreview(false);
        resetManual();
      } else {
        setManualError(response.message || 'Failed to save question.');
      }
    } catch (error: any) {
      const issues = error?.response?.data?.data?.issues as string[] | undefined;
      setManualError(issues?.join(' ') || error?.response?.data?.message || 'Failed to save question.');
    } finally {
      setSavingManual(false);
    }
  };

  const previewBulk = async () => {
    if (!workbook) {
      setBulkError('Select a .xlsx or .csv workbook first.');
      return;
    }
    setPreviewingBulk(true);
    setBulkError('');
    try {
      const response = await previewBulkQuestionsApi(workbook, imagesZip);
      if (response.success && response.data) setBulkPreview(response.data);
    } catch (error: any) {
      setBulkError(error?.response?.data?.message || 'Failed to parse workbook.');
      if (error?.response?.data?.data) setBulkPreview(error.response.data.data);
    } finally {
      setPreviewingBulk(false);
    }
  };

  const confirmBulk = async () => {
    if (!workbook) return;
    setConfirmingBulk(true);
    setBulkError('');
    try {
      const response = await confirmBulkQuestionsApi(workbook, imagesZip);
      if (response.success && response.data) {
        setBulkPreview(response.data);
        setBulkSuccess(`${response.data.summary.savedRows} questions uploaded successfully.`);
        setShowBulkModal(false);
        setWorkbook(null);
        setImagesZip(null);
      }
    } catch (error: any) {
      setBulkError(error?.response?.data?.message || 'Upload failed.');
      if (error?.response?.data?.data) setBulkPreview(error.response.data.data);
    } finally {
      setConfirmingBulk(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const blob = await downloadBulkTemplateApi();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'question-bulk-upload-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setBulkError('Template download failed.');
    }
  };

  return (
    <AdminLayout>
      {showManualPreview && (
        <QuestionPreview
          questions={[buildManualPreview(manual)]}
          onClose={() => setShowManualPreview(false)}
          onConfirm={saveManual}
          isLoading={savingManual}
          title="Manual Question Preview"
          subtitle="Confirm the question before saving it."
          confirmLabel="Save Question"
        />
      )}
      {showBulkModal && bulkQuestions.length > 0 && (
        <QuestionPreview
          questions={bulkQuestions}
          onClose={() => setShowBulkModal(false)}
          onConfirm={bulkPreview?.summary.invalidRows === 0 ? confirmBulk : undefined}
          isLoading={confirmingBulk}
          title="Bulk Upload Preview"
          subtitle="Review the parsed questions before confirming the upload."
          confirmLabel="Confirm & Upload"
        />
      )}
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Admin</p>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">Question <span className="gradient-text-cyan-violet">Builder</span></h1>
          <p className="text-white/30 text-sm font-inter mt-1.5">Manual form for one question, or Excel bulk upload for many questions at once.</p>
        </div>
        <div className="flex gap-3">
          {(['manual', 'bulk'] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={cn('px-4 py-2.5 rounded-full border text-sm font-inter transition-colors', tab === item ? 'border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan' : 'border-white/10 text-white/50 hover:text-white/80')}
            >
              {item === 'manual' ? 'Manual Form' : 'Excel Bulk Upload'}
            </button>
          ))}
        </div>
        {tab === 'manual' && (
          <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-6">
            <NeonCard variant="cyan" padding="p-6">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <input value={manual.topic} onChange={(event) => setManual((prev) => ({ ...prev, topic: event.target.value }))} className="cyber-input w-full px-4 py-3 text-sm" placeholder="Topic *" />
                <input value={manual.subtopic} onChange={(event) => setManual((prev) => ({ ...prev, subtopic: event.target.value }))} className="cyber-input w-full px-4 py-3 text-sm" placeholder="Subtopic" />
                <select value={manual.difficulty} onChange={(event) => setManual((prev) => ({ ...prev, difficulty: event.target.value as ManualState['difficulty'] }))} className="cyber-input w-full px-4 py-3 text-sm appearance-none">
                  {['easy', 'medium', 'hard'].map((difficulty) => <option key={difficulty} value={difficulty} className="bg-cyber-black">{difficulty}</option>)}
                </select>
              </div>
              <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-4 mb-5">
                <textarea value={manual.questionText} onChange={(event) => setManual((prev) => ({ ...prev, questionText: event.target.value }))} className="cyber-input w-full min-h-[150px] px-4 py-3 text-sm resize-y" placeholder="Question text" />
                <label className="border border-dashed border-white/15 rounded-xl p-4 bg-white/[0.02] cursor-pointer block">
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => setQuestionImage(event.target.files?.[0] ?? null)} />
                  <div className="flex flex-col items-center gap-3 text-center">
                    {manual.questionImagePreview ? <img src={manual.questionImagePreview} alt="Question preview" className="max-h-36 rounded-lg object-contain" /> : <ImageIcon size={24} className="text-white/30" />}
                    <span className="text-white/45 text-xs font-inter">{manual.questionImageFile ? manual.questionImageFile.name : 'Upload question image'}</span>
                  </div>
                </label>
              </div>
              <div className="space-y-4 mb-5">
                {manual.options.map((option, index) => (
                  <div key={getOptionLetter(index)} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-4">
                      <input value={option.text} onChange={(event) => setManual((prev) => { const options = [...prev.options]; options[index] = { ...options[index], text: event.target.value }; return { ...prev, options }; })} className="cyber-input w-full px-4 py-3 text-sm" placeholder={`Option ${getOptionLetter(index)} text`} />
                      <label className="border border-dashed border-white/15 rounded-xl p-3 bg-white/[0.02] cursor-pointer block">
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => setOptionImage(index, event.target.files?.[0] ?? null)} />
                        <div className="flex items-center gap-3">
                          {option.imagePreview ? <img src={option.imagePreview} alt={`Option ${getOptionLetter(index)} preview`} className="w-16 h-16 rounded-lg object-contain" /> : <ImageIcon size={18} className="text-white/30" />}
                          <span className="text-white/45 text-xs font-inter">{option.imageFile ? option.imageFile.name : `Upload option ${getOptionLetter(index)} image`}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid md:grid-cols-[0.7fr_1.3fr] gap-4">
                <select value={manual.correctAnswer} onChange={(event) => setManual((prev) => ({ ...prev, correctAnswer: event.target.value as AnswerLetter }))} className="cyber-input w-full px-4 py-3 text-sm appearance-none">
                  {['A', 'B', 'C', 'D'].map((letter) => <option key={letter} value={letter} className="bg-cyber-black">{letter}</option>)}
                </select>
                <textarea value={manual.explanation} onChange={(event) => setManual((prev) => ({ ...prev, explanation: event.target.value }))} className="cyber-input w-full min-h-[110px] px-4 py-3 text-sm resize-y" placeholder="Explanation" />
              </div>
            </NeonCard>
            <NeonCard variant="default" padding="p-5">
              <h3 className="font-inter font-semibold text-white mb-4">Manual Validation</h3>
              <div className="space-y-2">
                {manualIssues.length === 0 ? <div className="flex items-center gap-2 text-neon-green text-sm font-inter"><CheckCircle2 size={16} />Ready for preview.</div> : manualIssues.map((issue) => <div key={issue} className="flex items-start gap-2 text-neon-amber text-sm font-inter"><AlertTriangle size={15} className="mt-0.5 flex-shrink-0" /><span>{issue}</span></div>)}
              </div>
              <div className="space-y-3 mt-5">
                <HoloButton variant="cyan" size="lg" fullWidth disabled={manualIssues.length > 0} onClick={() => { setManualError(''); setManualSuccess(''); setShowManualPreview(true); }} icon={<Eye size={16} />}>Preview Question</HoloButton>
                <button type="button" onClick={resetManual} className="w-full px-4 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-inter">Reset Form</button>
              </div>
              {manualError && <div className="mt-4 p-3 rounded-xl bg-neon-red/8 border border-neon-red/25 text-neon-red text-sm font-inter">{manualError}</div>}
              {manualSuccess && <div className="mt-4 p-3 rounded-xl bg-neon-green/8 border border-neon-green/25 text-neon-green text-sm font-inter">{manualSuccess}</div>}
            </NeonCard>
          </div>
        )}
        {tab === 'bulk' && (
          <div className="space-y-6">
            <NeonCard variant="cyan" padding="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <h2 className="font-inter font-semibold text-white">Excel Bulk Upload</h2>
                  <p className="text-white/35 text-sm font-inter mt-1">Upload a `.xlsx` or `.csv` workbook and an optional `.zip` of matching image files.</p>
                </div>
                <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan text-sm font-inter"><Download size={15} />Download Template</button>
              </div>
              <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
                <label className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center cursor-pointer block">
                  <input ref={workbookRef} type="file" accept=".xlsx,.csv" className="hidden" onChange={(event) => { setWorkbook(event.target.files?.[0] ?? null); setBulkPreview(null); setBulkSuccess(''); setBulkError(''); }} />
                  <div className="space-y-3" onClick={() => workbookRef.current?.click()}>
                    <FileSpreadsheet size={28} className="text-white/25 mx-auto" />
                    <p className="text-white/60 text-sm font-inter">{workbook ? workbook.name : 'Select workbook (.xlsx or .csv)'}</p>
                  </div>
                </label>
                <label className="border border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer block">
                  <input ref={zipRef} type="file" accept=".zip" className="hidden" onChange={(event) => { setImagesZip(event.target.files?.[0] ?? null); setBulkPreview(null); }} />
                  <div className="space-y-3" onClick={() => zipRef.current?.click()}>
                    <Upload size={24} className="text-white/25 mx-auto" />
                    <p className="text-white/60 text-sm font-inter">{imagesZip ? imagesZip.name : 'Optional images zip (.zip)'}</p>
                  </div>
                </label>
              </div>
              <div className="flex flex-wrap gap-3 mt-5">
                <HoloButton variant="cyan" size="lg" onClick={previewBulk} loading={previewingBulk} disabled={!workbook} icon={<Eye size={16} />}>Parse & Preview</HoloButton>
                <button type="button" disabled={!bulkPreview || bulkQuestions.length === 0} onClick={() => setShowBulkModal(true)} className="px-4 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-inter disabled:opacity-40">Review Student Preview</button>
                <button type="button" disabled={!bulkPreview || bulkPreview.summary.invalidRows > 0 || confirmingBulk} onClick={confirmBulk} className="px-4 py-3 rounded-xl border border-neon-green/20 bg-neon-green/10 text-neon-green text-sm font-inter disabled:opacity-40">Confirm & Upload</button>
              </div>
              {bulkError && <div className="mt-4 p-3 rounded-xl bg-neon-red/8 border border-neon-red/25 text-neon-red text-sm font-inter">{bulkError}</div>}
              {bulkSuccess && <div className="mt-4 p-3 rounded-xl bg-neon-green/8 border border-neon-green/25 text-neon-green text-sm font-inter">{bulkSuccess}</div>}
            </NeonCard>
            {bulkPreview && (
              <NeonCard variant="default" padding="p-6">
                <div className="flex gap-3 mb-4">
                  {[
                    { label: 'Rows', value: bulkPreview.summary.totalRows, color: 'text-neon-cyan' },
                    { label: 'Valid', value: bulkPreview.summary.validRows, color: 'text-neon-green' },
                    { label: 'Invalid', value: bulkPreview.summary.invalidRows, color: 'text-neon-red' },
                  ].map((item) => <div key={item.label} className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02]"><p className={cn('font-orbitron text-2xl font-bold', item.color)}>{item.value}</p><p className="text-white/25 text-xs font-inter">{item.label}</p></div>)}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-separate border-spacing-y-2">
                    <thead><tr className="text-left text-white/35 text-xs uppercase tracking-widest font-inter"><th>Row</th><th>Topic</th><th>Difficulty</th><th>Question</th><th>Status</th></tr></thead>
                    <tbody>
                      {bulkPreview.rows.map((row) => <tr key={row.rowNumber}><td className="px-4 py-3 rounded-l-xl bg-white/[0.02] border-y border-l border-white/8 text-white/60">{row.rowNumber}</td><td className="px-4 py-3 bg-white/[0.02] border-y border-white/8 text-white/75">{row.question?.topic || '—'}</td><td className="px-4 py-3 bg-white/[0.02] border-y border-white/8 text-white/75">{row.question?.difficulty || '—'}</td><td className="px-4 py-3 bg-white/[0.02] border-y border-white/8 text-white/70">{row.question?.questionText || (row.question?.questionImage ? 'Image-based question' : '—')}{row.issues.length > 0 && <div className="mt-2 space-y-1">{row.issues.map((issue) => <p key={issue} className="text-neon-red text-xs">{issue}</p>)}</div>}</td><td className="px-4 py-3 rounded-r-xl bg-white/[0.02] border-y border-r border-white/8"><span className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-inter border', row.status === 'valid' ? 'border-neon-green/20 bg-neon-green/10 text-neon-green' : 'border-neon-red/20 bg-neon-red/10 text-neon-red')}>{row.status === 'valid' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{row.status}</span></td></tr>)}
                    </tbody>
                  </table>
                </div>
              </NeonCard>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default UploadQuestionsPage;
