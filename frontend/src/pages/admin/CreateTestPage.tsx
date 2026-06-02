import { useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import DateTimePickerPopup from '@/components/ui/DateTimePickerPopup';
import SectionStudentPicker from '@/components/ui/SectionStudentPicker';
import { downloadBulkTemplateApi, getAllUsersApi, type BulkUploadResult } from '@/api/adminApi';
import { createFullLengthTestApi, getAllScheduledTestsApi } from '@/api/scheduledApi';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import {
  AlertTriangle,
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Image as ImageIcon,
  Lock,
  Search,
  Send,
  Shield,
  Users,
  X,
} from 'lucide-react';

interface StudentOption {
  id: string;
  name: string;
  email: string;
  avatar: string;
  branch?: string;
  section?: string;
}

interface ScheduledTestCard {
  id: string;
  title: string;
  students: number;
  questionCount: number;
  startTime: Date;
  endTime: Date;
  status: TestStatus;
}

type TestStatus = 'locked' | 'live' | 'completed';

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getStatus = (startTime: Date | string, endTime: Date | string): TestStatus => {
  const now = Date.now();
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (now < start) return 'locked';
  if (now < end) return 'live';
  return 'completed';
};

const CreateTestPage = () => {
  const [title, setTitle] = useState('');
  const [timeLimit, setTimeLimit] = useState(180);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startDateTime, setStartDateTime] = useState<Date | null>(null);
  const [endDateTime, setEndDateTime] = useState<Date | null>(null);
  const [workbook, setWorkbook] = useState<File | null>(null);
  const [imagesZip, setImagesZip] = useState<File | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [scheduledTests, setScheduledTests] = useState<ScheduledTestCard[]>([]);
  const [uploadResult, setUploadResult] = useState<BulkUploadResult | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [studentLoadError, setStudentLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const workbookRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (startDate && startTime) {
      const d = new Date(`${startDate}T${startTime}`);
      if (!Number.isNaN(d.getTime())) setStartDateTime(d);
    } else {
      setStartDateTime(null);
    }
  }, [startDate, startTime]);

  useEffect(() => {
    if (endDate && endTime) {
      const d = new Date(`${endDate}T${endTime}`);
      if (!Number.isNaN(d.getTime())) setEndDateTime(d);
    } else {
      setEndDateTime(null);
    }
  }, [endDate, endTime]);

  const handleStartPickerChange = (d: Date) => {
    setStartDateTime(d);
    setStartDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    setStartTime(d.toTimeString().substring(0, 5));
  };

  const handleEndPickerChange = (d: Date) => {
    setEndDateTime(d);
    setEndDate(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
    setEndTime(d.toTimeString().substring(0, 5));
  };

  useEffect(() => {
    const load = async () => {
      setLoadingUsers(true);
      setStudentLoadError('');

      const [usersResult, testsResult] = await Promise.allSettled([
        getAllUsersApi(1, 1000),
        getAllScheduledTestsApi(),
      ]);

      if (usersResult.status === 'fulfilled') {
        const usersRes = usersResult.value;
        if (usersRes.success && usersRes.data) {
          const availableUsers = Array.isArray(usersRes.data.users) ? usersRes.data.users : [];
          setStudents(
            (availableUsers as User[])
              .filter((user) => String(user.role ?? '').trim().toLowerCase() === 'student')
              .map((user) => {
                const displayName = user.name?.trim() || user.email || 'Student';
                return {
                  id: user._id,
                  name: displayName,
                  email: user.email || 'No email available',
                  avatar: getInitials(displayName),
                  branch: user.branch,
                  section: user.section,
                };
              })
              .sort((a, b) => a.name.localeCompare(b.name))
          );
        } else {
          setStudents([]);
          setStudentLoadError(usersRes.message || 'Failed to load students.');
        }
      } else {
        console.error('Failed to load students for create-test', usersResult.reason);
        setStudents([]);
        setStudentLoadError('Failed to load students. Please refresh and try again.');
      }

      if (testsResult.status === 'fulfilled') {
        const testsRes = testsResult.value;
        if (testsRes.success && testsRes.data) {
          const scheduledTestItems = Array.isArray(testsRes.data) ? testsRes.data : [];
          setScheduledTests(
            scheduledTestItems.map((test: any) => ({
              id: test._id,
              title: test.title,
              students: Array.isArray(test.assignedStudents) ? test.assignedStudents.length : 0,
              questionCount: test.questionCount,
              startTime: new Date(test.startTime),
              endTime: new Date(test.endTime),
              status: test.status,
            }))
          );
        } else {
          setScheduledTests([]);
        }
      } else {
        console.error('Failed to load scheduled tests for create-test', testsResult.reason);
        setScheduledTests([]);
      }

      setLoadingUsers(false);
    };

    load();
  }, []);

  const invalidRows = useMemo(
    () => uploadResult?.rows.filter((row) => row.status === 'invalid') || [],
    [uploadResult]
  );

  const windowRange = useMemo(() => {
    if (!startDateTime || !endDateTime) return null;
    return { start: startDateTime, end: endDateTime };
  }, [startDateTime, endDateTime]);

  const setWorkbookFile = (file: File | null) => {
    if (!file) {
      setWorkbook(null);
      setUploadResult(null);
      return;
    }
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError('Upload a valid workbook in .xlsx or .csv format.');
      return;
    }
    setWorkbook(file);
    setUploadResult(null);
    setError('');
    setSuccess('');
  };

  const setZipFile = (file: File | null) => {
    if (!file) {
      setImagesZip(null);
      return;
    }
    if (!/\.zip$/i.test(file.name)) {
      setError('Image bundle must be a .zip file.');
      return;
    }
    setImagesZip(file);
    setError('');
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
      setError('Template download failed.');
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) return setError('Test title is required.');
    if (!windowRange) return setError('Please set valid start and end date/time values.');
    if (windowRange.end <= windowRange.start) return setError('End time must be after the start time.');
    if (timeLimit * 60_000 > windowRange.end.getTime() - windowRange.start.getTime()) {
      return setError('Duration cannot be longer than the scheduled access window.');
    }
    if (!workbook) return setError('Upload a workbook before creating the test.');
    if (selectedStudents.length === 0) return setError('Please select at least one student.');

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('timeLimit', String(timeLimit));
      formData.append('startTime', windowRange.start.toISOString());
      formData.append('endTime', windowRange.end.toISOString());
      formData.append('assignedStudents', JSON.stringify(selectedStudents));
      formData.append('maxAttempts', String(maxAttempts));
      formData.append('file', workbook);
      if (imagesZip) formData.append('imagesZip', imagesZip);

      const response = await createFullLengthTestApi(formData);
      if (!response.success || !response.data) {
        setError(response.message || 'Failed to create test.');
        return;
      }

      const createdUploadResult = response.data.uploadResult as BulkUploadResult;
      const test = response.data.test;
      setUploadResult(createdUploadResult);
      setScheduledTests((prev) => [
        {
          id: test._id,
          title: test.title,
          students: test.assignedStudents.length,
          questionCount: test.questionCount,
          startTime: new Date(test.startTime),
          endTime: new Date(test.endTime),
          status: getStatus(test.startTime, test.endTime),
        },
        ...prev,
      ]);
      setSuccess(
        `${createdUploadResult.summary.savedRows} questions uploaded and assigned to ${selectedStudents.length} student${selectedStudents.length === 1 ? '' : 's'}.`
      );
      setTitle('');
      setTimeLimit(180);
      setMaxAttempts(1);
      setStartDate('');
      setStartTime('');
      setEndDate('');
      setEndTime('');
      setStartDateTime(null);
      setEndDateTime(null);
      setWorkbook(null);
      setImagesZip(null);
      setSelectedStudents([]);
    } catch (submitError: any) {
      const responseData = submitError?.response?.data;
      const failedUploadResult = responseData?.data?.uploadResult as BulkUploadResult | undefined;
      if (failedUploadResult) setUploadResult(failedUploadResult);
      setError(responseData?.message || submitError.message || 'Error occurred while creating the test.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
            Create <span className="gradient-text-cyan-violet">Test</span>
          </h1>
          <p className="text-white/30 text-sm font-inter mt-1.5">
            Upload questions, assign students, and schedule the test in one flow.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <NeonCard variant="cyan" padding="p-6">
              <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                <FileSpreadsheet size={17} className="text-neon-cyan" />
                Step 1 - Test Setup
              </h2>
              <div className="space-y-4">
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    setError('');
                  }}
                  placeholder="Test title"
                  className="cyber-input w-full px-4 py-3 text-sm"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={timeLimit}
                    onChange={(event) => setTimeLimit(Math.max(1, Number(event.target.value)))}
                    className="cyber-input w-full px-4 py-3 text-sm"
                    placeholder="Duration in minutes"
                  />
                  <input
                    type="number"
                    min={1}
                    max={999}
                    value={maxAttempts}
                    onChange={(event) => setMaxAttempts(Math.max(1, Number(event.target.value)))}
                    className="cyber-input w-full px-4 py-3 text-sm"
                    placeholder="Max attempts per student"
                  />
                </div>
                <div className="rounded-xl border border-neon-cyan/20 bg-neon-cyan/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-neon-cyan text-sm font-semibold">Upload Excel File (.xlsx / .csv)</p>
                      <p className="text-white/35 text-xs mt-1">
                        Optional image bundle support is available for image-based questions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-cyan/20 bg-neon-cyan/10 text-neon-cyan text-xs font-inter"
                    >
                      <Download size={14} />
                      Template
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-5 text-center cursor-pointer block hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-colors group">
                      <input
                        ref={workbookRef}
                        type="file"
                        accept=".xlsx,.csv"
                        className="hidden"
                        onChange={(event) => setWorkbookFile(event.target.files?.[0] ?? null)}
                      />
                      <div onClick={() => !workbook && workbookRef.current?.click()} className="h-full flex flex-col justify-center">
                        <FileSpreadsheet size={24} className={cn("mx-auto mb-3 transition-colors", workbook ? "text-neon-cyan" : "text-white/25 group-hover:text-neon-cyan/50")} />
                        <p className={cn("text-sm", workbook ? "text-white" : "text-white/70")}>{workbook ? workbook.name : 'Select workbook'}</p>
                      </div>
                      {workbook && (
                        <button onClick={(e) => { e.stopPropagation(); setWorkbookFile(null); if (workbookRef.current) workbookRef.current.value = ''; }} className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 text-white/50 hover:text-white">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <div className="relative border border-dashed border-white/10 rounded-2xl p-5 text-center cursor-pointer block hover:border-neon-magenta/50 hover:bg-neon-magenta/5 transition-colors group">
                      <input
                        ref={zipRef}
                        type="file"
                        accept=".zip"
                        className="hidden"
                        onChange={(event) => setZipFile(event.target.files?.[0] ?? null)}
                      />
                      <div onClick={() => !imagesZip && zipRef.current?.click()} className="h-full flex flex-col justify-center">
                        <ImageIcon size={22} className={cn("mx-auto mb-3 transition-colors", imagesZip ? "text-neon-magenta" : "text-white/25 group-hover:text-neon-magenta/50")} />
                        <p className={cn("text-sm", imagesZip ? "text-white" : "text-white/70")}>{imagesZip ? imagesZip.name : 'Optional images .zip'}</p>
                      </div>
                      {imagesZip && (
                        <button onClick={(e) => { e.stopPropagation(); setZipFile(null); if (zipRef.current) zipRef.current.value = ''; }} className="absolute top-2 right-2 p-1 rounded hover:bg-white/10 text-white/50 hover:text-white">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  {uploadResult && (
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[
                        { label: 'Rows', value: uploadResult.summary.totalRows, color: 'text-neon-cyan' },
                        { label: 'Valid', value: uploadResult.summary.validRows, color: 'text-neon-green' },
                        { label: 'Invalid', value: uploadResult.summary.invalidRows, color: 'text-neon-red' },
                      ].map((item) => (
                        <div key={item.label} className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
                          <p className={cn('font-orbitron text-2xl font-bold', item.color)}>{item.value}</p>
                          <p className="text-white/25 text-xs">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {invalidRows.length > 0 && (
                    <div className="mt-4 space-y-2 rounded-xl border border-neon-red/20 bg-neon-red/8 p-4">
                      {invalidRows.slice(0, 6).map((row) => (
                        <p key={row.rowNumber} className="text-neon-red text-xs">
                          Row {row.rowNumber}: {row.issues[0]}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </NeonCard>

            <NeonCard variant="violet" padding="p-6" className="!overflow-visible z-10">
              <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={17} className="text-neon-violet" />
                Step 2 - Schedule Window
              </h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-white/70">Start Date & Time</label>
                      <DateTimePickerPopup
                        value={startDateTime}
                        onChange={handleStartPickerChange}
                        accentColor="violet"
                        trigger={
                          <button type="button" className="flex items-center gap-1.5 text-[10px] text-neon-violet hover:text-white transition-colors bg-neon-violet/10 px-2 py-1 rounded border border-neon-violet/30">
                            <Calendar size={12} />
                            <span>Quick Pick</span>
                          </button>
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="cyber-input w-full px-3 py-2 text-sm" />
                      <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="cyber-input w-full px-3 py-2 text-sm" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-medium text-white/70">End Date & Time</label>
                      <DateTimePickerPopup
                        value={endDateTime}
                        onChange={handleEndPickerChange}
                        minDate={startDateTime || new Date()}
                        accentColor="violet"
                        trigger={
                          <button type="button" className="flex items-center gap-1.5 text-[10px] text-neon-violet hover:text-white transition-colors bg-neon-violet/10 px-2 py-1 rounded border border-neon-violet/30">
                            <Calendar size={12} />
                            <span>Quick Pick</span>
                          </button>
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="cyber-input w-full px-3 py-2 text-sm" />
                      <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="cyber-input w-full px-3 py-2 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
              {windowRange && (
                <div className="mt-4 rounded-xl border border-neon-amber/20 bg-neon-amber/5 p-4 text-xs font-inter text-white/60">
                  Students can start only between{' '}
                  <span className="text-neon-amber font-medium">{windowRange.start.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  {' '}and{' '}
                  <span className="text-neon-amber font-medium">{windowRange.end.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>.
                </div>
              )}
            </NeonCard>

            <NeonCard variant="magenta" padding="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-inter font-semibold text-white flex items-center gap-2">
                  <Users size={17} className="text-neon-magenta" />
                  Step 3 - Assign Students
                </h2>
              </div>
              {loadingUsers ? (
                <div className="py-8 text-center text-white/30 text-sm">Loading students...</div>
              ) : studentLoadError ? (
                <div className="rounded-xl border border-neon-red/20 bg-neon-red/5 px-4 py-6 text-center">
                  <p className="text-neon-red text-sm">{studentLoadError}</p>
                </div>
              ) : students.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
                  <p className="text-white/65 text-sm">No student accounts are available yet.</p>
                  <p className="text-white/30 text-xs mt-1">Create or restore student users to assign this test.</p>
                </div>
              ) : (
                <SectionStudentPicker 
                  students={students}
                  selectedIds={selectedStudents}
                  onChange={setSelectedStudents}
                />
              )}
            </NeonCard>

            {error && (
              <div className="flex items-center gap-2 p-4 rounded-xl bg-neon-red/8 border border-neon-red/25">
                <AlertTriangle size={16} className="text-neon-red flex-shrink-0" />
                <p className="text-neon-red text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-green/8 border border-neon-green/25">
                <CheckCircle2 size={20} className="text-neon-green" />
                <p className="text-neon-green font-semibold">{success}</p>
              </div>
            )}
            <HoloButton variant="cyan" size="xl" fullWidth loading={submitting} onClick={handleCreate} icon={<Send size={18} />}>
              CREATE TEST
            </HoloButton>
          </div>

          <div className="space-y-5">
            <NeonCard variant="default" padding="p-5">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Rules</p>
              <div className="space-y-3 text-xs font-inter">
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 text-white/80 font-semibold"><Lock size={13} className="text-neon-amber" />Attempt Limit Control</div>
                  <p className="text-white/35 mt-1">Set the maximum number of attempts allowed per student. Default is 1 attempt.</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 text-white/80 font-semibold"><Bell size={13} className="text-neon-cyan" />In-app notification</div>
                  <p className="text-white/35 mt-1">Selected students are notified automatically when the test is created.</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <div className="flex items-center gap-2 text-white/80 font-semibold"><Shield size={13} className="text-neon-violet" />Timed access</div>
                  <p className="text-white/35 mt-1">Start Test is available only inside the scheduled window.</p>
                </div>
              </div>
            </NeonCard>

            <NeonCard variant="default" padding="p-5">
              <p className="text-white/30 text-xs uppercase tracking-widest mb-4">Summary</p>
              <div className="space-y-3">
                {[
                  ['Title', title || '-'],
                  ['Workbook', workbook?.name || 'Not selected'],
                  ['Duration', `${timeLimit} min`],
                  ['Max Attempts', `${maxAttempts} per student`],
                  ['Students', `${selectedStudents.length} assigned`],
                  ['Questions', uploadResult ? `${uploadResult.summary.validRows} ready` : 'Parsed on create'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5 gap-3">
                    <span className="text-white/25 text-xs">{label}</span>
                    <span className="text-white/70 text-xs text-right break-all">{value}</span>
                  </div>
                ))}
              </div>
            </NeonCard>

            <NeonCard variant="default" padding="p-5">
              <h3 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                <Clock size={15} className="text-neon-cyan" />
                Scheduled Tests
              </h3>
              <div className="space-y-3">
                {scheduledTests.map((test) => (
                  <div key={test.id} className="p-3.5 rounded-xl border border-white/8 bg-white/[0.02]">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-white/80 text-xs font-medium leading-snug flex-1">{test.title}</p>
                      <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px]', test.status === 'locked' ? 'border-neon-amber/40 bg-neon-amber/10 text-neon-amber' : test.status === 'live' ? 'border-neon-green/40 bg-neon-green/10 text-neon-green' : 'border-white/15 bg-white/5 text-white/40')}>
                        {test.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-white/35 font-inter">
                      {test.questionCount} questions · {test.students} students
                    </div>
                    <div className="mt-2 text-[10px] text-white/35 font-mono-code">
                      {test.startTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      {'  '}to{'  '}
                      {test.endTime.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                ))}
                {scheduledTests.length === 0 && <p className="text-white/30 text-sm">Tests you create here will appear in this list.</p>}
              </div>
            </NeonCard>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateTestPage;
