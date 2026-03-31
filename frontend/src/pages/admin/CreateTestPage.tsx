// src/pages/admin/CreateTestPage.tsx
// Admin: Create & schedule a full-length test with student assignment and time lock

import { useState, useMemo, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { cn } from '@/lib/utils';
import {
  Upload, Users, Calendar, Lock, CheckCircle2,
  Search, X, Clock, AlertTriangle, Zap, Send,
  FileText, Shield,
} from 'lucide-react';

import { getAllUsersApi, uploadQuestionsApi } from '@/api/adminApi';
import { createScheduledTestApi, getAllScheduledTestsApi } from '@/api/scheduledApi';
import type { User } from '@/types';

// Utility to generate avatars from names
const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

interface StudentOption {
  id: string;
  name: string;
  email: string;
  avatar: string;
  batch: string;
}



type TestStatus = 'locked' | 'live' | 'completed';

const getStatus = (startTime: Date | string): TestStatus => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  if (now < start)             return 'locked';
  if (now < start + 7200_000)  return 'live';
  return 'completed';
};

const StatusBadge = ({ status }: { status: TestStatus }) => {
  const configs: Record<TestStatus, { label: string; cls: string; icon: React.ReactNode }> = {
    locked:    { label: '🔒 Locked',    cls: 'border-neon-amber/40 bg-neon-amber/10 text-neon-amber',   icon: <Lock size={11} /> },
    live:      { label: '🟢 Live',      cls: 'border-neon-green/40 bg-neon-green/10 text-neon-green animate-neon-pulse', icon: <div className="w-2 h-2 rounded-full bg-neon-green animate-neon-pulse" /> },
    completed: { label: '✅ Completed', cls: 'border-white/15 bg-white/5 text-white/40',                icon: <CheckCircle2 size={11} /> },
  };
  const c = configs[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-inter font-medium', c.cls)}>
      {c.label}
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────
const CreateTestPage = () => {

  // Form state
  const [testTitle,      setTestTitle]      = useState('');
  const [testTopic,      setTestTopic]      = useState('Quantitative Aptitude');
  const [testDifficulty, setTestDifficulty] = useState('all');
  const [questionCount,  setQuestionCount]  = useState(30);
  const [timeLimit,      setTimeLimit]      = useState(60); // minutes
  const [startDate,      setStartDate]      = useState('');
  const [startTime,      setStartTime]      = useState('');
  const [selectedStu,    setSelectedStu]    = useState<string[]>([]);
  const [stuSearch,      setStuSearch]      = useState('');
  const [uploadFile,     setUploadFile]     = useState<File | null>(null);
  const [uploadedQuestionIds, setUploadedQuestionIds] = useState<string[]>([]);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [success,        setSuccess]        = useState(false);
  const [error,          setError]          = useState('');

  // Students state
  const [allStudents,    setAllStudents]    = useState<StudentOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch actual users on load
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        // Fetch up to 1000 users for the test scheduling assign feature
        const res = await getAllUsersApi(1, 1000);
        if (res.success && res.data) {
           const studentsOnly = res.data.users
            .filter((u: User) => u.role === 'student')
            .map((u: User) => ({
              id: u._id,
              name: u.name,
              email: u.email,
              avatar: getInitials(u.name || 'User'),
              batch: 'Standard Batch' // Or map to actual batch if available in DB
            }));
           setAllStudents(studentsOnly);
        }
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    
    // Fetch all admin scheduled tests
    const fetchScheduled = async () => {
      try {
        const res = await getAllScheduledTestsApi();
        if (res.success) {
          setScheduledTests(res.data.map((t: any) => ({
            id: t._id,
            title: t.title,
            students: t.assignedStudents.length,
            startTime: new Date(t.startTime),
            status: t.status,
          })));
        }
      } catch (err) {
        console.error("Failed to load scheduled tests");
      }
    };

    fetchUsers();
    fetchScheduled();
  }, []);

  // Use local state for scheduled table rendering
  const [scheduledTests, setScheduledTests] = useState<any[]>([]);

  const filteredStudents = useMemo(() =>
    allStudents.filter(s =>
      s.name.toLowerCase().includes(stuSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(stuSearch.toLowerCase()) ||
      s.batch.toLowerCase().includes(stuSearch.toLowerCase())
    ), [stuSearch, allStudents]
  );

  const toggleStudent = (id: string) => {
    setSelectedStu(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedStu(filteredStudents.map(s => s.id));
  const clearAll  = () => setSelectedStu([]);

  const handleCreate = async () => {
    if (!testTitle.trim()) { setError('Test title is required.'); return; }
    if (!startDate || !startTime) { setError('Please set a start date and time.'); return; }
    if (selectedStu.length === 0) { setError('Please select at least one student.'); return; }

    setError('');
    setIsSubmitting(true);

    try {
      let questionIds: string[] = [];

      // Step 1: Upload file if selected and extract question IDs
      if (uploadFile) {
        try {
          const uploadRes = await uploadQuestionsApi(uploadFile);
          if (uploadRes.success && uploadRes.data?.questionIds) {
            questionIds = uploadRes.data.questionIds;
            setUploadedQuestionIds(questionIds);
          } else {
            setError('Questions uploaded but could not extract IDs. Please try again.');
            setIsSubmitting(false);
            return;
          }
        } catch (uploadErr: any) {
          const msg = uploadErr?.response?.data?.message || 'Failed to upload file';
          setError(msg);
          setIsSubmitting(false);
          return;
        }
      }

      // Step 2: Create scheduled test with or without uploaded questions
      const scheduled = new Date(`${startDate}T${startTime}`);
      
      const payload: any = {
        title: testTitle,
        topic: testTopic,
        difficulty: testDifficulty,
        questionCount: questionIds.length > 0 ? questionIds.length : questionCount,
        timeLimit,
        startTime: scheduled.toISOString(),
        assignedStudents: selectedStu,
      };

      // Include custom questions if they were uploaded
      if (questionIds.length > 0) {
        payload.customQuestions = questionIds;
      }

      const res = await createScheduledTestApi(payload);

      if (res.success) {
        setScheduledTests(prev => [{
          id: res.data._id || `st-${Date.now()}`,
          title: testTitle,
          students: selectedStu.length,
          startTime: scheduled,
          status: getStatus(scheduled),
        }, ...prev]);

        setSuccess(true);
        setTestTitle('');
        setSelectedStu([]);
        setStartDate('');
        setStartTime('');
        setUploadFile(null);
        setUploadedQuestionIds([]);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        setError(res.message || 'Failed to schedule test');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const now = new Date();

  return (
    <AdminLayout>
      <div className="min-h-screen" style={{ background: '#080810' }}>
        <div className="max-w-6xl mx-auto p-6">

          {/* Header */}
          <div className="mb-8 animate-fade-up">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border border-neon-cyan/30 flex items-center justify-center">
                <Zap size={20} className="text-neon-cyan" />
              </div>
              <div>
                <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
                  Create <span className="gradient-text-cyan-violet">Full-Length Test</span>
                </h1>
                <p className="text-white/30 text-sm font-inter mt-0.5">Schedule and assign tests to specific students</p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Left col (2/3): Form ─────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Step 1: Test Details */}
              <NeonCard variant="cyan" padding="p-6">
                <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={17} className="text-neon-cyan" />
                  Step 1 — Test Details
                </h2>

                {/* Title */}
                <div className="mb-4">
                  <label className="text-white/40 text-xs uppercase tracking-widest font-inter block mb-2">Test Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Quantitative Aptitude — Final Mock 2026"
                    value={testTitle}
                    onChange={e => { setTestTitle(e.target.value); setError(''); }}
                    className="cyber-input w-full px-4 py-3 text-sm"
                  />
                </div>

                {/* Topic + Difficulty row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest font-inter block mb-2">Topic</label>
                    <select
                      value={testTopic}
                      onChange={e => setTestTopic(e.target.value)}
                      className="cyber-input w-full px-4 py-3 text-sm appearance-none"
                    >
                      {['Quantitative Aptitude', 'Verbal Ability', 'Logical Reasoning'].map(t => (
                        <option key={t} value={t} className="bg-cyber-black">{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest font-inter block mb-2">Difficulty</label>
                    <select
                      value={testDifficulty}
                      onChange={e => setTestDifficulty(e.target.value)}
                      className="cyber-input w-full px-4 py-3 text-sm appearance-none"
                    >
                      {[['all', 'Mixed'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([v, l]) => (
                        <option key={v} value={v} className="bg-cyber-black">{l}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Questions + Time row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest font-inter block mb-2 flex items-center gap-2">
                      {uploadedQuestionIds.length > 0 ? (
                        <>
                          Questions <span className="text-neon-green">(Uploaded: {uploadedQuestionIds.length})</span>
                        </>
                      ) : (
                        <>Questions ({questionCount})</>
                      )}
                    </label>
                    {uploadedQuestionIds.length > 0 ? (
                      <div className="w-full p-3 rounded-lg bg-neon-green/10 border border-neon-green/30">
                        <p className="text-neon-green text-sm font-inter font-semibold">{uploadedQuestionIds.length} Questions</p>
                        <p className="text-neon-green/60 text-xs font-inter mt-1">All uploaded questions will be used</p>
                      </div>
                    ) : (
                      <>
                        <input
                          type="range" min={5} max={100} value={questionCount}
                          onChange={e => setQuestionCount(Number(e.target.value))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-white/20 font-mono-code mt-1">
                          <span>5</span><span className="text-neon-cyan font-bold">{questionCount}</span><span>100</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest font-inter block mb-2">
                      Time Limit ({timeLimit} min)
                    </label>
                    <input
                      type="range" min={10} max={180} step={5} value={timeLimit}
                      onChange={e => setTimeLimit(Number(e.target.value))}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-white/20 font-mono-code mt-1">
                      <span>10m</span><span className="text-neon-amber font-bold">{timeLimit}m</span><span>180m</span>
                    </div>
                  </div>
                </div>

                {/* File upload (optional) */}
                <div>
                  <label className="text-white/40 text-xs uppercase tracking-widest font-inter block mb-2 flex items-center gap-2">
                    <Upload size={11} /> Upload Custom Questions (optional)
                  </label>
                  <div
                    onClick={() => document.getElementById('admin-file-input')?.click()}
                    className={cn(
                      'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-300',
                      uploadFile
                        ? 'border-neon-green/40 bg-neon-green/5'
                        : 'border-white/10 hover:border-neon-cyan/30 hover:bg-neon-cyan/[0.03]'
                    )}
                  >
                    {uploadFile ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-center gap-3">
                          <CheckCircle2 size={20} className="text-neon-green" />
                          <span className="text-neon-green text-sm font-inter">{uploadFile.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); setUploadFile(null); setUploadedQuestionIds([]); }} className="text-white/30 hover:text-neon-red">
                            <X size={16} />
                          </button>
                        </div>
                        <p className="text-neon-green/70 text-xs font-inter">Selected: {uploadFile.name} · Ready to upload on test creation</p>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} className="text-white/20 mx-auto mb-2" />
                        <p className="text-white/30 text-sm font-inter">JSON / CSV / DOCX format</p>
                        <p className="text-white/15 text-xs font-inter mt-1">Or leave blank to pull from question bank</p>
                      </>
                    )}
                    <input
                      id="admin-file-input"
                      type="file"
                      accept=".json,.csv,.docx"
                      className="hidden"
                      onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  {uploadedQuestionIds.length > 0 && (
                    <div className="mt-3 p-3 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                      <p className="text-neon-cyan text-xs font-inter font-semibold">✅ Uploaded: {uploadedQuestionIds.length} questions ready</p>
                    </div>
                  )}
                </div>
              </NeonCard>

              {/* Step 2: Schedule */}
              <NeonCard variant="violet" padding="p-6">
                <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar size={17} className="text-neon-violet" />
                  Step 2 — Schedule Start Time
                </h2>
                <p className="text-white/30 text-xs font-inter mb-4">
                  Test will be locked for all assigned students until this exact date & time.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest font-inter block mb-2">Start Date *</label>
                    <input
                      type="date"
                      min={now.toISOString().split('T')[0]}
                      value={startDate}
                      onChange={e => { setStartDate(e.target.value); setError(''); }}
                      className="cyber-input w-full px-4 py-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-white/40 text-xs uppercase tracking-widest font-inter block mb-2">Start Time *</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => { setStartTime(e.target.value); setError(''); }}
                      className="cyber-input w-full px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                {startDate && startTime && (
                  <div className="mt-4 holo-lock p-4 rounded-xl animate-fade-in">
                    <div className="flex items-center gap-3">
                      <Lock size={18} className="text-neon-amber flex-shrink-0" />
                      <div>
                        <p className="text-neon-amber text-sm font-inter font-semibold">
                          Students will see:
                        </p>
                        <p className="text-white/50 text-xs font-mono-code mt-0.5">
                          "Test will unlock at {new Date(`${startDate}T${startTime}`).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </NeonCard>

              {/* Step 3: Student Selection */}
              <NeonCard variant="magenta" padding="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-inter font-semibold text-white flex items-center gap-2">
                    <Users size={17} className="text-neon-magenta" />
                    Step 3 — Assign Students
                  </h2>
                  <div className="flex items-center gap-2">
                    <button onClick={selectAll} className="text-xs text-neon-cyan hover:text-neon-cyan/80 font-inter transition-colors">Select All</button>
                    <span className="text-white/20">·</span>
                    <button onClick={clearAll} className="text-xs text-white/30 hover:text-white/50 font-inter transition-colors">Clear</button>
                    <span className="ml-2 px-2.5 py-1 rounded-full bg-neon-magenta/20 border border-neon-magenta/30 text-neon-magenta text-xs font-orbitron font-bold">
                      {selectedStu.length}
                    </span>
                  </div>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
                  <input
                    type="text"
                    placeholder="Search students by name, email, or batch..."
                    value={stuSearch}
                    onChange={e => setStuSearch(e.target.value)}
                    className="cyber-input w-full pl-9 pr-4 py-2.5 text-sm"
                  />
                  {stuSearch && (
                    <button onClick={() => setStuSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50">
                      <X size={14} />
                    </button>
                  )}
                </div>

                {isLoadingUsers && (
                  <div className="flex justify-center items-center py-8">
                     <div className="w-5 h-5 rounded-full border-2 border-neon-magenta border-t-transparent animate-spin" />
                  </div>
                )}
                
                {!isLoadingUsers && filteredStudents.length === 0 && (
                   <div className="py-8 text-center text-white/30 text-sm font-inter">
                     No students found.
                   </div>
                )}

                {/* Student list */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredStudents.map((s) => {
                    const isSelected = selectedStu.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleStudent(s.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200',
                          isSelected
                            ? 'border-neon-magenta/50 bg-neon-magenta/10'
                            : 'border-white/5 hover:border-white/15 bg-white/[0.015]'
                        )}
                      >
                        {/* Avatar */}
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-inter flex-shrink-0',
                          isSelected
                            ? 'bg-neon-magenta/30 text-neon-magenta border border-neon-magenta/40'
                            : 'bg-white/10 text-white/50 border border-white/10'
                        )}>
                          {s.avatar}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-inter font-medium', isSelected ? 'text-neon-magenta' : 'text-white/70')}>
                            {s.name}
                          </p>
                          <p className="text-white/25 text-[11px] font-inter truncate">
                            {s.email} · {s.batch}
                          </p>
                        </div>

                        {/* Checkbox */}
                        <div className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all',
                          isSelected
                            ? 'bg-neon-magenta border-neon-magenta'
                            : 'border-white/15'
                        )}>
                          {isSelected && <CheckCircle2 size={12} className="text-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </NeonCard>

              {/* Error/Success */}
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-neon-red/8 border border-neon-red/25 animate-fade-in">
                  <AlertTriangle size={16} className="text-neon-red flex-shrink-0" />
                  <p className="text-neon-red text-sm font-inter">{error}</p>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-green/8 border border-neon-green/25 animate-fade-in">
                  <CheckCircle2 size={20} className="text-neon-green" />
                  <p className="text-neon-green font-inter font-semibold">Test scheduled successfully! Students have been notified.</p>
                </div>
              )}

              {/* Create button */}
              <HoloButton
                variant="cyan"
                size="xl"
                fullWidth
                loading={isSubmitting}
                onClick={handleCreate}
                icon={<Send size={18} />}
                className="font-orbitron tracking-widest"
              >
                CREATE &amp; SCHEDULE TEST
              </HoloButton>
            </div>

            {/* ── Right col (1/3): Summary + Scheduled list ──── */}
            <div className="space-y-5">

              {/* Config summary */}
              <NeonCard variant="default" padding="p-5" className="animate-fade-up-delay">
                <p className="text-white/30 text-xs uppercase tracking-widest font-inter mb-4">Configuration Summary</p>
                <div className="space-y-3">
                  {[
                    { label: 'Title',      value: testTitle || '—',   color: 'text-white/60' },
                    { label: 'Topic',      value: testTopic,           color: 'text-neon-cyan' },
                    { label: 'Questions',  value: `${questionCount}Q`, color: 'text-neon-green' },
                    { label: 'Time',       value: `${timeLimit} min`,  color: 'text-neon-amber' },
                    { label: 'Students',   value: `${selectedStu.length} assigned`, color: 'text-neon-magenta' },
                    { label: 'Difficulty', value: testDifficulty === 'all' ? 'Mixed' : testDifficulty, color: 'text-neon-violet' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <span className="text-white/25 text-xs font-inter">{item.label}</span>
                      <span className={cn('text-xs font-mono-code font-semibold truncate max-w-[120px]', item.color)}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </NeonCard>

              {/* Scheduled Tests list */}
              <NeonCard variant="default" padding="p-5" className="animate-fade-up-delay">
                <h3 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                  <Clock size={15} className="text-neon-cyan" />
                  Scheduled Tests
                </h3>
                <div className="space-y-3">
                  {scheduledTests.map(test => {
                    const status = test.status as TestStatus || getStatus(test.startTime);
                    return (
                      <div key={test.id} className={cn(
                        'p-3.5 rounded-xl border',
                        status === 'locked'    ? 'border-neon-amber/20 bg-neon-amber/5'
                        : status === 'live'    ? 'border-neon-green/20 bg-neon-green/5'
                        : 'border-white/8 bg-white/[0.02]'
                      )}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-white/80 text-xs font-inter font-medium leading-snug flex-1">{test.title}</p>
                          <StatusBadge status={status} />
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-white/30 font-inter">
                          <span className="flex items-center gap-1">
                            <Users size={10} /> {test.students} students
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            {test.startTime.toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        {status === 'locked' && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-neon-amber/60 font-mono-code">
                            <Lock size={9} />
                            Unlocks: {test.startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </NeonCard>

              {/* Info card */}
              <div className="p-4 rounded-xl border border-neon-violet/15 bg-neon-violet/5">
                <div className="flex items-start gap-3">
                  <Shield size={16} className="text-neon-violet flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-neon-violet text-xs font-inter font-semibold mb-1">Student View</p>
                    <p className="text-white/30 text-[11px] font-inter leading-relaxed">
                      Before the start time, students see a holographic "Test will unlock at [time]" message on their dashboard. The test becomes available at exactly the scheduled time.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateTestPage;
