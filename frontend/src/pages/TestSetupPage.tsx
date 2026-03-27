// frontend/src/pages/TestSetupPage.tsx
// ─────────────────────────────────────────────────────────────
// Test Setup Page — Topic, Difficulty, Count choose karo
// Start button → API call → TestPage mein navigate
// Data React Router state se pass hoga [web:196]
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { startTestApi } from '@/api/testApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

// ─── Topic Options ─────────────────────────────────────────────
const TOPICS = [
  { value: 'Quantitative Aptitude', label: '🔢 Quantitative Aptitude', color: 'bg-blue-50 border-blue-200' },
  { value: 'Verbal Ability',        label: '📖 Verbal Ability',        color: 'bg-green-50 border-green-200' },
  { value: 'Logical Reasoning',     label: '🧠 Logical Reasoning',     color: 'bg-purple-50 border-purple-200' },
];

const DIFFICULTIES = [
  { value: 'easy',   label: '🟢 Easy',   desc: 'Beginners ke liye' },
  { value: 'medium', label: '🟡 Medium', desc: 'Intermediate level' },
  { value: 'hard',   label: '🔴 Hard',   desc: 'Advanced / Competitive' },
];

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

const TestSetupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // ─── Form State ────────────────────────────────────────────
  const [selectedTopic,      setSelectedTopic]      = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [questionCount,      setQuestionCount]      = useState(10);
  const [isLoading,          setIsLoading]          = useState(false);
  const [error,              setError]              = useState('');

  // ─── Time calculate karo (2 min per question) ─────────────
  const totalTimeSeconds = questionCount * 2 * 60;
  const totalTimeMin     = questionCount * 2;

  // ─── Start Test Handler ────────────────────────────────────
  const handleStartTest = async () => {
    if (!selectedTopic) {
      setError('Pehle topic choose karo!');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await startTestApi({
        topic:      selectedTopic,
        difficulty: selectedDifficulty || undefined,
        count:      questionCount,
        title:      `${selectedTopic} - ${selectedDifficulty || 'Mixed'} (${questionCount}Q)`,
      });

      if (response.success && response.data) {
        // Data state se pass karo → TestPage mein milega [web:196]
        navigate('/test', {
          state: {
            attemptId:      response.data.attemptId,
            questions:      response.data.questions,
            title:          response.data.title,
            totalQuestions: response.data.totalQuestions,
            totalTime:      totalTimeSeconds,
          },
        });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Test start nahi ho saka. Dobara try karo.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">

      {/* ─── Navbar ──────────────────────────────────────── */}
      <nav className="bg-white border-b shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <span className="font-bold text-gray-800">Aptitude Test Platform</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <Badge variant="outline" className="text-indigo-600 border-indigo-300 text-xs">
            🎓 Student
          </Badge>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </Button>
        </div>
      </nav>

      {/* ─── Main Content ──────────────────────────────────── */}
      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Test Configure Karo 🎯</h1>
          <p className="text-gray-500 mt-2">
            Topic aur difficulty choose karo — phir full focus mode mein practice karo!
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-xl text-gray-800">📋 Test Settings</CardTitle>
            <CardDescription>Apne level ke hisaab se customize karo</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* ─── Topic Select ──────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📚 Topic Choose Karo *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {TOPICS.map((topic) => (
                  <button
                    key={topic.value}
                    onClick={() => { setSelectedTopic(topic.value); setError(''); }}
                    className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all
                      ${selectedTopic === topic.value
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md scale-[1.01]'
                        : `${topic.color} text-gray-700 hover:border-indigo-300`
                      }`}
                  >
                    {topic.label}
                    {selectedTopic === topic.value && (
                      <span className="float-right text-indigo-500">✓ Selected</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Difficulty Select ─────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💪 Difficulty (Optional)
              </label>
              <Select onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="🎲 Mixed (All difficulties)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🎲 Mixed (All difficulties)</SelectItem>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label} — {d.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* ─── Question Count ────────────────────────── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🔢 Questions Kitne Chahiye?
              </label>
              <div className="flex flex-wrap gap-2">
                {QUESTION_COUNTS.map((count) => (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className={`px-5 py-2 rounded-lg font-semibold border-2 transition-all
                      ${questionCount === count
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                      }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Test Summary Card ─────────────────────── */}
            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
              <h3 className="font-semibold text-indigo-800 mb-2">📊 Test Summary</h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-indigo-600">{questionCount}</p>
                  <p className="text-xs text-gray-500">Questions</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-600">{totalTimeMin}m</p>
                  <p className="text-xs text-gray-500">Time Limit</p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedDifficulty || 'Mix'}
                  </p>
                  <p className="text-xs text-gray-500">Difficulty</p>
                </div>
              </div>
            </div>

            {/* ─── Instructions ──────────────────────────── */}
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-sm space-y-1">
              <p className="font-semibold text-amber-800">⚠️ Test Rules — Dhyan Se Padho:</p>
              <ul className="text-amber-700 space-y-1 list-none">
                <li>🖥️ Test fullscreen mode mein shuru hoga</li>
                <li>🚫 Tab switch karna allowed nahi hai</li>
                <li>📋 Copy/Paste block rahega</li>
                <li>⏱️ Time khatam hote hi auto-submit ho jaayega</li>
                <li>🔄 Ek baar submit karne ke baad dobara attempt nahi ho sakta</li>
              </ul>
            </div>

            {/* ─── Error Message ─────────────────────────── */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* ─── Start Button ──────────────────────────── */}
            <Button
              onClick={handleStartTest}
              disabled={isLoading || !selectedTopic}
              className="w-full h-13 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 text-white py-4"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="animate-spin">⏳</span>
                  Questions load ho rahe hain...
                </span>
              ) : (
                '🚀 Test Shuru Karo!'
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TestSetupPage;
