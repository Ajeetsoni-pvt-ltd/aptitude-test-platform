// src/pages/AnalysisPage.tsx
// Deep-dive analytics with charts, heatmaps, AI insights

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyResultsApi } from '@/api/testApi';
import type { TestAttempt } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressRing from '@/components/ui/ProgressRing';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import {
  BarChart3, Brain, TrendingUp, Target, Zap, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom tooltip
const NeonTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string}>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong border border-neon-cyan/20 rounded-xl px-4 py-2.5 shadow-[0_0_20px_rgba(0,245,255,0.1)]">
      <p className="text-white/40 text-xs font-inter mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-neon-cyan font-orbitron text-sm font-bold">{p.value}%</p>
      ))}
    </div>
  );
};

const AnalysisPage = () => {
  const navigate = useNavigate();
  const [attempts,  setAttempts]  = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setIsLoading(true);
        const res = await getMyResultsApi(1, 20);
        if (res.success && res.data) setAttempts(res.data.attempts);
      } catch { /* silent */ }
      finally { setIsLoading(false); }
    };
    fetch();
  }, []);

  const avgScore   = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const bestScore  = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0;
  const worstScore = attempts.length ? Math.min(...attempts.map((a) => a.score)) : 0;

  // Chart data
  const trendData = [...attempts].reverse().slice(-10).map((a, i) => ({
    name:  `T${i + 1}`,
    score: a.score,
    date:  new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  // Score distribution
  const distData = [
    { range: '0–20',  count: attempts.filter((a) => a.score < 20).length  },
    { range: '20–40', count: attempts.filter((a) => a.score >= 20 && a.score < 40).length },
    { range: '40–60', count: attempts.filter((a) => a.score >= 40 && a.score < 60).length },
    { range: '60–80', count: attempts.filter((a) => a.score >= 60 && a.score < 80).length },
    { range: '80–100',count: attempts.filter((a) => a.score >= 80).length },
  ];

  // Topic performance aggregated
  const topicMap: Record<string, { correct: number; total: number }> = {};
  attempts.forEach((a) => {
    if (a.topicPerformance) {
      Object.entries(a.topicPerformance).forEach(([topic, perf]) => {
        if (!topicMap[topic]) topicMap[topic] = { correct: 0, total: 0 };
        topicMap[topic].correct += perf.correct;
        topicMap[topic].total   += perf.total;
      });
    }
  });
  const topicData = Object.entries(topicMap).map(([topic, perf]) => ({
    topic:   topic.replace(' Aptitude', '').replace(' Ability', ''),
    score:   Math.round((perf.correct / (perf.total || 1)) * 100),
    correct: perf.correct,
    total:   perf.total,
  }));

  // Radar data
  const radarData = [
    { subject: 'Quant',   value: topicData.find((t) => t.topic.includes('Quant'))?.score   ?? 0 },
    { subject: 'Verbal',  value: topicData.find((t) => t.topic.includes('Verbal'))?.score  ?? 0 },
    { subject: 'Logical', value: topicData.find((t) => t.topic.includes('Logic'))?.score   ?? 0 },
    { subject: 'Speed',   value: Math.min(avgScore + 10, 100) },
    { subject: 'Accuracy',value: bestScore },
  ];

  // AI insight
  const aiInsight = (() => {
    if (!attempts.length) return 'Complete at least one test to receive AI-powered insights.';
    const recentTrend = trendData.length >= 3
      ? trendData.slice(-3).reduce((s, d) => s + d.score, 0) / 3
      : avgScore;
    if (recentTrend > avgScore + 5) return `📈 Your recent trend (${Math.round(recentTrend)}%) is above your average (${avgScore}%). You're improving — keep the momentum!`;
    if (recentTrend < avgScore - 5) return `⚠️ Recent scores (${Math.round(recentTrend)}%) are below your average (${avgScore}%). Consider revisiting fundamentals.`;
    return `🎯 You're consistently scoring around ${avgScore}%. Focus on harder problems to break through your ceiling.`;
  })();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" label="Analyzing neural data..." />
        </div>
      </AppLayout>
    );
  }

  if (!attempts.length) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-80 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center">
            <BarChart3 size={28} className="text-white/20" />
          </div>
          <p className="text-white/30 font-inter">No test data available yet.</p>
          <HoloButton variant="cyan" size="md" onClick={() => navigate('/test-setup')}>
            Take Your First Test
          </HoloButton>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Neural Intelligence</p>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
            Performance <span className="gradient-text-cyan-violet">Analysis</span>
          </h1>
        </div>
        <HoloButton variant="ghost" size="sm" onClick={() => navigate('/test-setup')} icon={<ArrowRight size={14} />}>
          New Test
        </HoloButton>
      </div>

      {/* ── KPI Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tests Taken',  value: attempts.length, color: 'cyan',    ring: 100 },
          { label: 'Average Score',value: `${avgScore}%`,  color: 'violet',  ring: avgScore },
          { label: 'Best Score',   value: `${bestScore}%`, color: 'green',   ring: bestScore },
          { label: 'Lowest Score', value: `${worstScore}%`,color: 'amber',   ring: worstScore },
        ].map((k, i) => (
          <NeonCard
            key={k.label}
            variant={k.color as 'cyan' | 'violet' | 'green' | 'amber'}
            padding="p-5"
            className="flex flex-col items-center gap-3 text-center animate-fade-up"
            style={{ animationDelay: `${i * 0.08}s` } as React.CSSProperties}
          >
            <ProgressRing
              value={typeof k.ring === 'number' ? k.ring : 100}
              size={70}
              strokeWidth={5}
              color={k.color as 'cyan' | 'violet' | 'green' | 'amber'}
              showLabel={false}
            >
              <span className={cn('font-orbitron text-sm font-bold', `text-neon-${k.color}`)}>
                {k.value}
              </span>
            </ProgressRing>
            <p className="text-white/35 text-xs font-inter uppercase tracking-widest">{k.label}</p>
          </NeonCard>
        ))}
      </div>

      {/* ── Charts row ────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">

        {/* Score trend */}
        <NeonCard variant="cyan" padding="p-5" className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-inter font-semibold text-white">Score Trajectory</h2>
            <TrendingUp size={16} className="text-neon-cyan" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#00F5FF" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<NeonTooltip />} />
              <Area type="monotone" dataKey="score" stroke="#00F5FF" strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ fill: '#00F5FF', r: 4, strokeWidth: 2, stroke: '#080810' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </NeonCard>

        {/* Score distribution */}
        <NeonCard variant="violet" padding="p-5" className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-inter font-semibold text-white">Score Distribution</h2>
            <Target size={16} className="text-neon-violet" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={distData} barSize={28}>
              <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(157,0,255,0.05)' }}
                contentStyle={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(157,0,255,0.3)', borderRadius: 8 }}
                labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                itemStyle={{ color: '#9D00FF' }}
              />
              <Bar dataKey="count" radius={4}>
                {distData.map((_, i) => (
                  <Cell key={i} fill={i >= 3 ? '#00F5FF' : i === 2 ? '#9D00FF' : '#FF3366'} style={{ filter: 'drop-shadow(0 0 4px currentColor)' }} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </NeonCard>
      </div>

      {/* ── Topic + Radar ─────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Topic bars */}
        <NeonCard variant="default" padding="p-5" className="lg:col-span-2 animate-fade-up">
          <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={16} className="text-neon-cyan" />
            Topic Mastery
          </h2>
          {topicData.length > 0 ? (
            <div className="space-y-5">
              {topicData.map((t) => {
                const color = t.score >= 70 ? '#00FF88' : t.score >= 40 ? '#FFB700' : '#FF3366';
                return (
                  <div key={t.topic}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/70 text-sm font-inter">{t.topic}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white/25 text-xs font-mono-code">{t.correct}/{t.total}</span>
                        <span className="font-orbitron text-sm font-bold" style={{ color }}>{t.score}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${t.score}%`, background: color, boxShadow: `0 0 8px ${color}` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/20 text-sm font-inter">No topic data available yet.</p>
          )}
        </NeonCard>

        {/* Radar */}
        <NeonCard variant="magenta" padding="p-5" className="animate-fade-up">
          <h2 className="font-inter font-semibold text-white mb-4">Skills Radar</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <Radar name="Score" dataKey="value" stroke="#FF00AA" fill="#FF00AA" fillOpacity={0.15}
                strokeWidth={2} style={{ filter: 'drop-shadow(0 0 4px rgba(255,0,170,0.6))' }} />
            </RadarChart>
          </ResponsiveContainer>
        </NeonCard>
      </div>

      {/* ── AI Insights ────────────────────────────────────── */}
      <NeonCard variant="violet" padding="p-6" className="animate-fade-up">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-neon-violet/15 border border-neon-violet/30 flex items-center justify-center flex-shrink-0 animate-float">
            <Brain size={22} className="text-neon-violet" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="font-orbitron text-sm font-bold text-neon-violet">AI NEURAL INSIGHTS</p>
              <span className="text-[10px] px-1.5 py-0.5 bg-neon-violet/20 border border-neon-violet/30 rounded-full text-neon-violet font-mono-code animate-neon-pulse">
                LIVE
              </span>
            </div>
            <p className="text-white/60 text-sm font-inter leading-relaxed mb-3">{aiInsight}</p>
            <div className="flex gap-2 flex-wrap">
              {avgScore < 60 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/25 text-neon-cyan font-inter">
                  💡 Practice daily basics
                </span>
              )}
              {bestScore < 80 && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-neon-amber/10 border border-neon-amber/25 text-neon-amber font-inter">
                  ⚡ Attempt harder tests
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-neon-violet/10 border border-neon-violet/25 text-neon-violet font-inter">
                🎯 {attempts.length} sessions analyzed
              </span>
            </div>
          </div>
          <Zap size={16} className="text-neon-violet/40 flex-shrink-0 animate-neon-pulse" />
        </div>
      </NeonCard>
    </AppLayout>
  );
};

export default AnalysisPage;