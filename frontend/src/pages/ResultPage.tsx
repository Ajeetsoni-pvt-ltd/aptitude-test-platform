// frontend/src/pages/ResultPage.tsx
// Test submit ke baad result dikhao — score, breakdown, topic performance

import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as {
    result: {
      score: number;
      totalQuestions: number;
      correctCount: number;
      incorrectCount: number;
      skippedCount: number;
      topicPerformance: Record<string, { correct: number; total: number }>;
    };
    title: string;
    isAutoSubmit?: boolean;
  } | null;

  if (!state?.result) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const { result, title, isAutoSubmit } = state;
  const { score, totalQuestions, correctCount, incorrectCount, skippedCount, topicPerformance } = result;

  const getScoreColor = () => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreEmoji = () => {
    if (score >= 80) return '🏆';
    if (score >= 60) return '👍';
    if (score >= 40) return '📈';
    return '💪';
  };

  const getGrade = () => {
    if (score >= 80) return 'Excellent!';
    if (score >= 60) return 'Good Job!';
    if (score >= 40) return 'Average';
    return 'Keep Practicing!';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Auto-submit warning */}
        {isAutoSubmit && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
            <p className="text-orange-700 font-medium">
              ⏱️ Time khatam! Test auto-submit ho gaya.
            </p>
          </div>
        )}

        {/* Score Card */}
        <Card className="border-0 shadow-xl mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
            <div className="text-6xl mb-2">{getScoreEmoji()}</div>
            <h1 className="text-2xl font-bold mb-1">{title}</h1>
            <p className="text-indigo-200 text-sm">Test Complete! 🎉</p>
          </div>

          <CardContent className="p-6 text-center">
            <p className={`text-7xl font-black mb-2 ${getScoreColor()}`}>{score}%</p>
            <Badge className="text-base px-4 py-1 mb-6">{getGrade()}</Badge>

            {/* Breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-green-600">{correctCount}</p>
                <p className="text-xs text-gray-500 mt-1">✅ Correct</p>
              </div>
              <div className="bg-red-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-red-500">{incorrectCount}</p>
                <p className="text-xs text-gray-500 mt-1">❌ Wrong</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-3xl font-bold text-gray-500">{skippedCount}</p>
                <p className="text-xs text-gray-500 mt-1">⏭️ Skipped</p>
              </div>
            </div>

            {/* Topic Performance */}
            {Object.keys(topicPerformance).length > 0 && (
              <div className="text-left mb-6">
                <h3 className="font-bold text-gray-700 mb-3">📊 Topic-wise Performance</h3>
                {Object.entries(topicPerformance).map(([topic, perf]) => {
                  const percent = Math.round((perf.correct / perf.total) * 100);
                  return (
                    <div key={topic} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{topic}</span>
                        <span className="font-semibold">{perf.correct}/{perf.total} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all
                            ${percent >= 70 ? 'bg-green-500' : percent >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Motivational Message */}
            <div className="bg-indigo-50 rounded-xl p-4 mb-6">
              <p className="text-indigo-700 font-medium">
                {score >= 80
                  ? '🌟 Shandaar! Tum exam ke liye bilkul ready ho!'
                  : score >= 60
                  ? '👍 Achha result! Thodi aur practice karo!'
                  : score >= 40
                  ? '📈 Average result hai, consistent practice karo!'
                  : '💪 Haar mat mano! Baar baar practice karo, zaroor improve hoga!'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => navigate('/test-setup')}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                🔄 Dobara Test Do
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="flex-1"
              >
                🏠 Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultPage;