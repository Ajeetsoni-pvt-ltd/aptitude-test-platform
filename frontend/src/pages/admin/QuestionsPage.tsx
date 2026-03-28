// frontend/src/pages/admin/QuestionsPage.tsx
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getQuestionsAdminApi, deleteQuestionApi } from '@/api/adminApi';
import { Button } from '@/components/ui/button';
import { Badge }  from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const TOPICS = ['', 'Quantitative Aptitude', 'Verbal Ability', 'Logical Reasoning'];
const DIFFICULTIES = ['', 'easy', 'medium', 'hard'];

const QuestionsPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setLoading]   = useState(true);
  const [page, setPage]           = useState(1);
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [topic, setTopic]         = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [deleting, setDeleting]   = useState<string | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const r = await getQuestionsAdminApi(page, 10, topic, difficulty);
      if (r.success && r.data) {
        setQuestions(r.data.questions);
        setTotal(r.data.pagination?.totalQuestions || 0);
        setTotalPages(r.data.pagination?.totalPages || 1);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchQuestions(); }, [page, topic, difficulty]);

  const handleDelete = async (id: string) => {
    if (!confirm('Yeh question delete karna chahte ho?')) return;
    setDeleting(id);
    try {
      await deleteQuestionApi(id);
      fetchQuestions();
    } catch (e) { console.error(e); }
    finally { setDeleting(null); }
  };

  const diffColor: Record<string, string> = {
    easy: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">❓ Questions Manager</h1>
            <p className="text-gray-500">Total: {total} questions</p>
          </div>
          <Button
            onClick={() => navigate('/admin/upload')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            📤 Upload More
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Topics</option>
            {TOPICS.filter(Boolean).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(e) => { setDifficulty(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">All Difficulties</option>
            {DIFFICULTIES.filter(Boolean).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Questions List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <span className="text-4xl animate-spin">⏳</span>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-10 text-center">
                  <p className="text-5xl mb-3">📭</p>
                  <p className="text-gray-500">Koi question nahi mila!</p>
                </CardContent>
              </Card>
            ) : questions.map((q, idx) => (
              <Card key={q._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-gray-400 text-xs font-mono">
                          #{(page - 1) * 10 + idx + 1}
                        </span>
                        <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                          {q.topic}
                        </Badge>
                        {q.subtopic && (
                          <Badge variant="outline" className="text-xs">
                            {q.subtopic}
                          </Badge>
                        )}
                        <Badge className={`text-xs ${diffColor[q.difficulty] || ''}`}>
                          {q.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-800 font-medium text-sm leading-relaxed">
                        {q.questionText}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {q.options.map((opt: string, i: number) => (
                          <span
                            key={i}
                            className={`text-xs px-2 py-0.5 rounded-full
                              ${opt === q.correctAnswer
                                ? 'bg-green-100 text-green-700 font-semibold'
                                : 'bg-gray-100 text-gray-600'
                              }`}
                          >
                            {['A','B','C','D'][i]}) {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(q._id)}
                      disabled={deleting === q._id}
                      className="text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0"
                    >
                      {deleting === q._id ? '⏳' : '🗑️'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Prev
            </Button>
            <span className="text-sm text-gray-600">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline" size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next →
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default QuestionsPage;