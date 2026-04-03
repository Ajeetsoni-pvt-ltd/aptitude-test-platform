import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Eye,
  Filter,
  Image as ImageIcon,
  Plus,
  Search,
  SquarePen,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import QuestionPreview from '@/components/QuestionPreview';
import HoloButton from '@/components/ui/HoloButton';
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import {
  bulkDeleteQuestionsApi,
  deleteQuestionApi,
  getQuestionsAdminApi,
  updateQuestionApi,
  getAllTopicsApi,
  getSubtopicsForTopicApi,
} from '@/api/adminApi';
import { getAssetUrl, getOptionLetter } from '@/lib/question';
import type { Question } from '@/types';

type EditState = {
  _id: string;
  topic: string;
  subtopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  questionImage?: string;
  options: Array<{ text: string; image?: string }>;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
};

const DIFFICULTY_TONE: Record<Question['difficulty'], 'green' | 'amber' | 'red'> = {
  easy: 'green',
  medium: 'amber',
  hard: 'red',
};

const buildEditState = (question: Question): EditState => ({
  _id: question._id,
  topic: question.topic,
  subtopic: question.subtopic || '',
  difficulty: question.difficulty,
  questionText: question.questionText || '',
  questionImage: question.questionImage,
  options: question.options.map((option) => ({
    text: option.text || '',
    image: option.image,
  })),
  correctAnswer: question.correctAnswer || 'A',
  explanation: question.explanation || '',
});

const validateEdit = (state: EditState) => {
  const issues: string[] = [];
  if (!state.topic.trim()) issues.push('Topic is required.');
  if (!state.questionText.trim() && !state.questionImage) {
    issues.push('Question needs text or an image.');
  }
  state.options.forEach((option, index) => {
    if (!option.text.trim() && !option.image) {
      issues.push(`Option ${getOptionLetter(index)} needs text or an image.`);
    }
  });
  return issues;
};

const QuestionsPage = () => {
  const navigate = useNavigate();
  const observerTarget = useRef<HTMLDivElement>(null);

  // State management
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questionType, setQuestionType] = useState('');

  // Dynamic filter data
  const [topics, setTopics] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [pageSize] = useState(50);

  // UI state
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Load all topics on mount
  useEffect(() => {
    const loadTopics = async () => {
      setTopicsLoading(true);
      try {
        const response = await getAllTopicsApi();
        if (response.success && response.data?.topics) {
          setTopics(response.data.topics);
        }
      } catch (error) {
        console.error('Failed to load topics:', error);
      } finally {
        setTopicsLoading(false);
      }
    };

    loadTopics();
  }, []);

  // Load subtopics when topic changes
  useEffect(() => {
    const loadSubtopics = async () => {
      if (!topic) {
        setSubtopics([]);
        setSubtopic('');
        return;
      }

      try {
        const response = await getSubtopicsForTopicApi(topic);
        if (response.success && response.data?.subtopics) {
          setSubtopics(response.data.subtopics);
        }
      } catch (error) {
        console.error('Failed to load subtopics:', error);
        setSubtopics([]);
      }
    };

    loadSubtopics();
  }, [topic]);

  // Fetch questions with current filters
  const fetchQuestions = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const response = await getQuestionsAdminApi(
          page,
          pageSize,
          topic,
          difficulty,
          questionType
        );

        if (response.success && response.data) {
          const newQuestions = response.data.questions || [];

          if (page === 1) {
            setQuestions(newQuestions);
          } else {
            setQuestions((prev) => [...prev, ...newQuestions]);
          }

          setTotalPages(response.data.pagination.totalPages);
          setTotalQuestions(response.data.pagination.totalQuestions);
          setCurrentPage(page);
        }
      } catch (error) {
        setNotice({
          type: 'error',
          message: 'Question bank could not be loaded right now.',
        });
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    },
    [topic, difficulty, questionType, pageSize]
  );

  // Load questions when filters change
  useEffect(() => {
    setCurrentPage(1);
    setQuestions([]);
    fetchQuestions(1);
  }, [topic, difficulty, questionType]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoading &&
          currentPage < totalPages &&
          questions.length > 0
        ) {
          fetchQuestions(currentPage + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [isLoading, currentPage, totalPages, questions.length, fetchQuestions]);

  const filteredQuestions = useMemo(() => {
    if (!search.trim()) return questions;

    const keyword = search.trim().toLowerCase();
    return questions.filter((question) => {
      const haystack = [
        question.topic,
        question.subtopic,
        question.questionText,
        question.explanation,
        ...question.options.map((option) => option.text),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [questions, search]);

  const imageCount = useMemo(
    () =>
      filteredQuestions.filter(
        (question) =>
          Boolean(question.questionImage) ||
          question.options.some((option) => Boolean(option.image))
      ).length,
    [filteredQuestions]
  );

  const bulkDeleteScopeLabel = useMemo(() => {
    if (!topic) {
      return 'Select a topic first. You can optionally narrow the delete scope with subtopic and difficulty.';
    }

    const segments = [topic];
    if (subtopic) segments.push(subtopic);
    if (difficulty) segments.push(`${difficulty} difficulty`);
    return `This will target ${segments.join(' / ')} across the question bank.`;
  }, [difficulty, subtopic, topic]);

  const bulkDeleteLoadedCount = useMemo(
    () =>
      questions.filter((question) => {
        if (!topic || question.topic !== topic) return false;
        if (subtopic && question.subtopic !== subtopic) return false;
        return true;
      }).length,
    [questions, subtopic, topic]
  );

  const clearFilters = () => {
    setSearch('');
    setTopic('');
    setSubtopic('');
    setDifficulty('');
    setQuestionType('');
    setCurrentPage(1);
  };

  const handleDelete = async (questionId: string) => {
    if (!window.confirm('Delete this question from the bank?')) return;
    setBusyId(questionId);
    setNotice(null);
    try {
      await deleteQuestionApi(questionId);
      setQuestions((current) => current.filter((question) => question._id !== questionId));
      setNotice({ type: 'success', message: 'Question removed from the bank.' });
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.message || 'Question could not be deleted.',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!topic) {
      setNotice({ type: 'error', message: 'Select a topic before using bulk delete.' });
      return;
    }

    const scope = [topic, subtopic || null, difficulty ? `${difficulty} difficulty` : null]
      .filter(Boolean)
      .join(' / ');

    const confirmed = window.confirm(
      `Delete all questions in ${scope}? Questions already used in scheduled tests or past attempts will be protected. This action cannot be undone.`
    );

    if (!confirmed) return;

    setBulkDeleting(true);
    setNotice(null);

    try {
      const response = await bulkDeleteQuestionsApi({
        topic,
        ...(subtopic && { subtopic }),
        ...(difficulty && { difficulty }),
      });

      if (response.success) {
        setPreviewQuestion(null);
        setEditState(null);
        setNotice({ type: 'success', message: response.message });
        setCurrentPage(1);
        setQuestions([]);
        await fetchQuestions(1);
      } else {
        setNotice({
          type: 'error',
          message: response.message || 'Bulk delete could not be completed.',
        });
      }
    } catch (error: any) {
      setNotice({
        type: 'error',
        message: error?.response?.data?.message || 'Bulk delete could not be completed.',
      });
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editState) return;
    const issues = validateEdit(editState);
    if (issues.length > 0) {
      setEditError(issues.join(' '));
      return;
    }

    setSavingEdit(true);
    setEditError('');
    try {
      const response = await updateQuestionApi(editState._id, {
        topic: editState.topic.trim(),
        subtopic: editState.subtopic.trim() || undefined,
        difficulty: editState.difficulty,
        questionText: editState.questionText.trim() || undefined,
        questionImage: editState.questionImage,
        options: editState.options.map((option) => ({
          text: option.text.trim() || undefined,
          image: option.image,
        })),
        correctAnswer: editState.correctAnswer,
        explanation: editState.explanation.trim() || undefined,
      });

      if (response.success && response.data) {
        setQuestions((current) =>
          current.map((question) => (question._id === editState._id ? response.data : question))
        );
        setEditState(null);
        setNotice({ type: 'success', message: 'Question updated successfully.' });
      } else {
        setEditError(response.message || 'Question could not be updated.');
      }
    } catch (error: any) {
      setEditError(error?.response?.data?.message || 'Question could not be updated.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <AdminLayout>
      <AdminPage>
        {previewQuestion && (
          <QuestionPreview
            questions={[previewQuestion]}
            onClose={() => setPreviewQuestion(null)}
            title="Question Preview"
            subtitle="This is the exact student-facing presentation from the bank."
          />
        )}

        <AdminPageHeader
          eyebrow="Question Operations"
          title={
            <>
              Question <span className="gradient-text-cyan-violet">Bank</span>
            </>
          }
          description="Access all topics and subtopics, filter by question type, and manage the complete question database with advanced filtering and infinite scroll."
          actions={
            <>
              <HoloButton
                variant="ghost"
                size="md"
                icon={<Upload size={16} />}
                onClick={() => navigate('/admin/upload')}
              >
                Bulk Upload
              </HoloButton>
              <HoloButton
                variant="cyan"
                size="md"
                icon={<Plus size={16} />}
                onClick={() => navigate('/admin/upload')}
              >
                Create New
              </HoloButton>
            </>
          }
        />

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.7fr]">
          <AdminPanel tone="cyan" title="Search Deck" description="Scan question text, explanations, and option copy.">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/28" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="admin-input px-12 py-3.5 text-sm"
                placeholder="Search question text, topic, explanation, or options..."
              />
            </div>
          </AdminPanel>

          <AdminPanel tone="violet" title="Filters" description="Focus on topics, subtopics, difficulty, and question type.">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-1">
              <select
                value={topic}
                onChange={(event) => {
                  setTopic(event.target.value);
                  setSubtopic('');
                }}
                disabled={topicsLoading}
                className="admin-input admin-select px-4 py-3 text-sm disabled:opacity-50"
              >
                <option value="">All Topics ({topics.length})</option>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <select
                value={subtopic}
                onChange={(event) => setSubtopic(event.target.value)}
                disabled={!topic || subtopics.length === 0}
                className="admin-input admin-select px-4 py-3 text-sm disabled:opacity-50"
              >
                <option value="">All Subtopics ({subtopics.length})</option>
                {subtopics.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
                className="admin-input admin-select px-4 py-3 text-sm"
              >
                <option value="">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                value={questionType}
                onChange={(event) => setQuestionType(event.target.value)}
                className="admin-input admin-select px-4 py-3 text-sm md:col-span-3 xl:col-span-1"
              >
                <option value="">All Question Types</option>
                <option value="text-only">Text-Only</option>
                <option value="image-rich">Image-Rich</option>
              </select>
            </div>
          </AdminPanel>

          <AdminPanel tone="amber" title="Signal" description="Instant visibility into the filtered view.">
            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">Results</p>
                <p className="mt-2 font-orbitron text-3xl tracking-[0.08em] text-neon-amber">
                  {filteredQuestions.length}
                </p>
                <p className="mt-1 text-xs text-white/45">of {totalQuestions} total</p>
              </div>
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/30">Image Rich</p>
                <p className="mt-2 font-orbitron text-3xl tracking-[0.08em] text-neon-cyan">
                  {imageCount}
                </p>
              </div>
              <div className="rounded-[22px] border border-neon-red/18 bg-neon-red/7 px-4 py-4">
                <p className="text-[11px] uppercase tracking-[0.3em] text-neon-red/80">
                  Bulk Delete
                </p>
                <p className="mt-2 text-sm leading-6 text-white/62">{bulkDeleteScopeLabel}</p>
                <p className="mt-2 text-xs text-white/35">
                  {topic
                    ? `${bulkDeleteLoadedCount} total questions match this scope.`
                    : 'Choose a topic to unlock the delete action.'}
                </p>
                <p className="mt-2 text-xs text-white/35">
                  Protected questions already used in scheduled tests or past attempts will be skipped automatically.
                </p>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={!topic || bulkDeleting}
                  className="mt-4 w-full rounded-[18px] border border-neon-red/25 bg-neon-red/12 px-4 py-3 text-sm font-medium text-neon-red transition-all hover:shadow-[0_0_24px_rgba(255,51,102,0.18)] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {bulkDeleting ? 'Deleting Scoped Questions...' : 'Delete Topic/Subtopic Slice'}
                </button>
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition-all hover:border-white/18 hover:text-white"
              >
                Reset Filters
              </button>
            </div>
          </AdminPanel>
        </div>

        {notice ? (
          <div
            className={`rounded-[22px] border px-4 py-3 text-sm ${
              notice.type === 'success'
                ? 'border-neon-green/25 bg-neon-green/8 text-neon-green'
                : 'border-neon-red/25 bg-neon-red/8 text-neon-red'
            }`}
          >
            {notice.message}
          </div>
        ) : null}

        {isInitialLoad && isLoading ? (
          <AdminPanel tone="cyan" title="Loading Bank" description="Fetching all available questions and metadata.">
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-5">
              <div className="h-14 w-14 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
              <p className="font-orbitron text-xs uppercase tracking-[0.34em] text-neon-cyan/80">
                Parsing the question bank
              </p>
            </div>
          </AdminPanel>
        ) : filteredQuestions.length === 0 && questions.length === 0 ? (
          <AdminEmptyState
            title="No questions in the database"
            description="Start by uploading questions or creating new ones."
            icon={<Filter className="h-6 w-6" />}
            action={
              <HoloButton
                variant="cyan"
                size="md"
                icon={<Plus size={16} />}
                onClick={() => navigate('/admin/upload')}
              >
                Upload Questions
              </HoloButton>
            }
          />
        ) : filteredQuestions.length === 0 ? (
          <AdminEmptyState
            title="No questions match the current filters"
            description="Clear the active filters or create more questions."
            icon={<Filter className="h-6 w-6" />}
            action={
              <HoloButton
                variant="cyan"
                size="md"
                icon={<Plus size={16} />}
                onClick={clearFilters}
              >
                Clear Filters
              </HoloButton>
            }
          />
        ) : (
          <div>
            <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {filteredQuestions.map((question) => (
                <motion.article
                  key={question._id}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.24 }}
                  className="admin-panel p-5"
                >
                  <div className="relative z-[1] space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <AdminStatusBadge tone="cyan">{question.topic}</AdminStatusBadge>
                          {question.subtopic ? (
                            <AdminStatusBadge tone="default">{question.subtopic}</AdminStatusBadge>
                          ) : null}
                          <AdminStatusBadge tone={DIFFICULTY_TONE[question.difficulty]}>
                            {question.difficulty}
                          </AdminStatusBadge>
                        </div>
                        <p className="text-sm leading-7 text-white/88">
                          {question.questionText || 'Image-led question'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewQuestion(question)}
                          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/72 transition-all hover:border-neon-cyan/24 hover:text-neon-cyan"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditError('');
                            setEditState(buildEditState(question));
                          }}
                          className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/72 transition-all hover:border-neon-magenta/24 hover:text-neon-magenta"
                        >
                          <SquarePen className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(question._id)}
                          disabled={busyId === question._id}
                          className="grid h-11 w-11 place-items-center rounded-2xl border border-neon-red/20 bg-neon-red/10 text-neon-red transition-all hover:shadow-[0_0_24px_rgba(255,51,102,0.2)] disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {question.questionImage ? (
                      <img
                        src={getAssetUrl(question.questionImage)}
                        alt="Question"
                        className="h-44 w-full rounded-[22px] border border-white/8 object-contain"
                      />
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, index) => {
                        const optionLetter = getOptionLetter(index);
                        const isCorrect = optionLetter === question.correctAnswer;
                        return (
                          <div
                            key={`${question._id}-${optionLetter}`}
                            className={`rounded-[20px] border p-3 ${
                              isCorrect
                                ? 'border-neon-green/22 bg-neon-green/8'
                                : 'border-white/8 bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="font-orbitron text-xs tracking-[0.18em] text-white/40">
                                {optionLetter}
                              </span>
                              <div className="flex-1 space-y-2">
                                {option.text ? (
                                  <p className="text-sm leading-6 text-white/78">{option.text}</p>
                                ) : null}
                                {option.image ? (
                                  <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-black/15 p-2">
                                    <ImageIcon className="h-4 w-4 text-neon-cyan" />
                                    <img
                                      src={getAssetUrl(option.image)}
                                      alt={`Option ${optionLetter}`}
                                      className="h-16 max-w-[120px] rounded-xl object-contain"
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {question.explanation ? (
                      <div className="rounded-[20px] border border-neon-cyan/14 bg-neon-cyan/6 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-neon-cyan/75">
                          Explanation
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/56">{question.explanation}</p>
                      </div>
                    ) : null}
                  </div>
                </motion.article>
              ))}
            </div>

            {currentPage < totalPages && (
              <div className="mt-8 flex flex-col items-center gap-4">
                {isLoading && (
                  <>
                    <div className="h-10 w-10 rounded-full border-2 border-neon-cyan/30 border-t-neon-cyan animate-spin" />
                    <p className="font-orbitron text-xs uppercase tracking-[0.24em] text-neon-cyan/80">
                      Loading more questions
                    </p>
                  </>
                )}
              </div>
            )}

            <div ref={observerTarget} className="h-4" />
          </div>
        )}

        <AnimatePresence>
          {editState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#030611]/88 px-4 py-6 backdrop-blur-md"
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.98 }}
                transition={{ duration: 0.24 }}
                className="max-h-[92vh] w-full max-w-6xl overflow-hidden"
              >
                <AdminPanel
                  tone="magenta"
                  title="Edit Question"
                  description="Adjust text, metadata, explanations, and option copy while preserving the existing image assets."
                  actions={
                    <button
                      type="button"
                      onClick={() => setEditState(null)}
                      className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-white/70 transition-all hover:border-white/20 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  }
                  className="max-h-[92vh]"
                >
                  <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
                      <div className="grid gap-4 md:grid-cols-3">
                        <input
                          value={editState.topic}
                          onChange={(event) =>
                            setEditState((current) =>
                              current ? { ...current, topic: event.target.value } : current
                            )
                          }
                          className="admin-input px-4 py-3 text-sm"
                          placeholder="Topic"
                        />
                        <input
                          value={editState.subtopic}
                          onChange={(event) =>
                            setEditState((current) =>
                              current ? { ...current, subtopic: event.target.value } : current
                            )
                          }
                          className="admin-input px-4 py-3 text-sm"
                          placeholder="Subtopic"
                        />
                        <select
                          value={editState.difficulty}
                          onChange={(event) =>
                            setEditState((current) =>
                              current
                                ? {
                                    ...current,
                                    difficulty: event.target.value as EditState['difficulty'],
                                  }
                                : current
                            )
                          }
                          className="admin-input admin-select px-4 py-3 text-sm"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <textarea
                        value={editState.questionText}
                        onChange={(event) =>
                          setEditState((current) =>
                            current ? { ...current, questionText: event.target.value } : current
                          )
                        }
                        className="admin-input min-h-[160px] px-4 py-3 text-sm"
                        placeholder="Question text"
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        {editState.options.map((option, index) => (
                          <div
                            key={`${editState._id}-${index}`}
                            className="rounded-[22px] border border-white/8 bg-white/[0.035] p-4"
                          >
                            <p className="mb-3 font-orbitron text-xs tracking-[0.22em] text-white/60">
                              Option {getOptionLetter(index)}
                            </p>
                            <textarea
                              value={option.text}
                              onChange={(event) =>
                                setEditState((current) =>
                                  current
                                    ? {
                                        ...current,
                                        options: current.options.map((entry, entryIndex) =>
                                          entryIndex === index
                                            ? { ...entry, text: event.target.value }
                                            : entry
                                        ),
                                      }
                                    : current
                                )
                              }
                              className="admin-input min-h-[110px] px-4 py-3 text-sm"
                            />
                            {option.image ? (
                              <img
                                src={getAssetUrl(option.image)}
                                alt={`Option ${getOptionLetter(index)}`}
                                className="mt-3 h-24 w-full rounded-2xl border border-white/8 object-contain"
                              />
                            ) : null}
                          </div>
                        ))}
                      </div>

                      <div className="grid gap-4 md:grid-cols-[0.6fr_1.4fr]">
                        <select
                          value={editState.correctAnswer}
                          onChange={(event) =>
                            setEditState((current) =>
                              current
                                ? {
                                    ...current,
                                    correctAnswer: event.target.value as EditState['correctAnswer'],
                                  }
                                : current
                            )
                          }
                          className="admin-input admin-select px-4 py-3 text-sm"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                        <textarea
                          value={editState.explanation}
                          onChange={(event) =>
                            setEditState((current) =>
                              current ? { ...current, explanation: event.target.value } : current
                            )
                          }
                          className="admin-input min-h-[120px] px-4 py-3 text-sm"
                          placeholder="Explanation"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[26px] border border-white/8 bg-white/[0.035] p-5">
                        <div className="mb-4 flex items-center justify-between">
                          <p className="font-orbitron text-sm tracking-[0.16em] text-white">
                            Student Preview
                          </p>
                          <AdminStatusBadge tone={DIFFICULTY_TONE[editState.difficulty]}>
                            {editState.difficulty}
                          </AdminStatusBadge>
                        </div>
                        <div className="space-y-3">
                          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-white/32">
                              {editState.topic}
                              {editState.subtopic ? ` / ${editState.subtopic}` : ''}
                            </p>
                            {editState.questionText ? (
                              <p className="mt-3 text-sm leading-7 text-white/88">
                                {editState.questionText}
                              </p>
                            ) : null}
                            {editState.questionImage ? (
                              <img
                                src={getAssetUrl(editState.questionImage)}
                                alt="Question"
                                className="mt-4 max-h-56 w-full rounded-[20px] border border-white/8 object-contain"
                              />
                            ) : null}
                          </div>

                          {editState.options.map((option, index) => {
                            const optionLetter = getOptionLetter(index);
                            return (
                              <div
                                key={`${editState._id}-preview-${optionLetter}`}
                                className={`rounded-[20px] border p-4 ${
                                  optionLetter === editState.correctAnswer
                                    ? 'border-neon-green/25 bg-neon-green/8'
                                    : 'border-white/8 bg-white/[0.03]'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="font-orbitron text-xs tracking-[0.2em] text-white/45">
                                    {optionLetter}
                                  </span>
                                  <div className="flex-1 space-y-2">
                                    {option.text ? (
                                      <p className="text-sm leading-6 text-white/78">{option.text}</p>
                                    ) : null}
                                    {option.image ? (
                                      <img
                                        src={getAssetUrl(option.image)}
                                        alt={`Option ${optionLetter}`}
                                        className="max-h-24 rounded-2xl border border-white/8 object-contain"
                                      />
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {editError ? (
                        <div className="rounded-[22px] border border-neon-red/25 bg-neon-red/8 px-4 py-3 text-sm text-neon-red">
                          {editError}
                        </div>
                      ) : null}

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setEditState(null)}
                          className="flex-1 rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition-all hover:border-white/18 hover:text-white"
                        >
                          Close
                        </button>
                        <HoloButton
                          variant="magenta"
                          size="lg"
                          onClick={handleSaveEdit}
                          loading={savingEdit}
                          icon={<SquarePen size={16} />}
                          className="flex-1"
                        >
                          Save Update
                        </HoloButton>
                      </div>
                    </div>
                  </div>
                </AdminPanel>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AdminPage>
    </AdminLayout>
  );
};

export default QuestionsPage;
