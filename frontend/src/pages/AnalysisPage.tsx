// src/pages/AnalysisPage.tsx
// Deep-dive analytics: full history, filters, charts, AI insights

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyResultsApi } from '@/api/testApi';
import type { TestAttempt } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ProgressRing from '@/components/ui/ProgressRing';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  BarChart3, Brain, TrendingUp, Target, Zap, ArrowRight,
  Filter, X, ChevronLeft, ChevronRight, ExternalLink, Clock,
  CheckCircle2, XCircle, MinusCircle, Search, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Topics list ──────────────────────────────────────────────
const TOPICS = [
  'All Topics',
  'Quantitative Aptitude',
  'Logical Reasoning',
  'Verbal Ability',
  'Data Interpretation',
  'General Awareness',
];

// ── Custom Tooltip ────────────────────────────────────────────
const NeonTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong border border-neon-cyan/20 rounded-xl px-4 py-2.5 shadow-[0_0_20px_rgba(0,245,255,0.1)]">
      <p className="text-white/40 text-xs font-inter mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-orbitron text-sm font-bold" style={{ color: p.color || '#00F5FF' }}>
          {Math.round(p.value)}{p.name === 'score' ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

// ── Score color helper ────────────────────────────────────────
const scoreColor = (s: number) =>
  s >= 70 ? '#00FF88' : s >= 40 ? '#FFB700' : '#FF3366';

// ── Format duration ──────────────────────────────────────────
const fmtTime = (secs: number) => {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
};

// ── Heatmap Grid (12-week) ────────────────────────────────────
const ContributionHeatmap = ({ attempts }: { attempts: TestAttempt[] }) => {
  const weeks = 12;
  const days = 7;
  const today = new Date();

  // Build date → score map
  const dateScoreMap: Record<string, number[]> = {};
  attempts.forEach((a) => {
    const d = new Date(a.createdAt).toISOString().split('T')[0];
    if (!dateScoreMap[d]) dateScoreMap[d] = [];
    dateScoreMap[d].push(a.score);
  });

  const cells: { date: string; score: number; count: number }[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    for (let d = days - 1; d >= 0; d--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - (w * 7 + d));
      const key = dt.toISOString().split('T')[0];
      const scores = dateScoreMap[key] || [];
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      cells.push({ date: key, score: avg, count: scores.length });
    }
  }

  return (
    <div>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}>
        {Array.from({ length: weeks }, (_, wi) =>
          cells.slice(wi * 7, (wi + 1) * 7).map((cell, di) => (
            <div
              key={`${wi}-${di}`}
              title={`${cell.date}: ${cell.count} test(s) • avg ${cell.score}%`}
              className="rounded-sm aspect-square cursor-default transition-transform hover:scale-125"
              style={{
                background: cell.count === 0
                  ? 'rgba(255,255,255,0.04)'
                  : cell.score >= 70 ? `rgba(0,255,136,${0.2 + cell.count * 0.15})`
                  : cell.score >= 40 ? `rgba(255,183,0,${0.2 + cell.count * 0.15})`
                  : `rgba(255,51,102,${0.2 + cell.count * 0.15})`,
              }}
            />
          ))
        )}
      </div>
      <div className="flex items-center gap-3 mt-2 justify-end">
        <span className="text-white/20 text-[10px] font-inter">Less</span>
        {[0, 40, 70, 90].map((v) => (
          <div
            key={v}
            className="w-3 h-3 rounded-sm"
            style={{ background: v === 0 ? 'rgba(255,255,255,0.04)' : v >= 70 ? 'rgba(0,255,136,0.5)' : v >= 40 ? 'rgba(255,183,0,0.5)' : 'rgba(255,51,102,0.5)' }}
          />
        ))}
        <span className="text-white/20 text-[10px] font-inter">More</span>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const AnalysisPage = () => {
  const navigate = useNavigate();

  // Data state
  const [attempts,  setAttempts]  = useState<TestAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalAttempts: 0 });

  // Filter state
  const [filters, setFilters] = useState({
    topic: '',
    dateFrom: '',
    dateTo: '',
    minScore: '',
    maxScore: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'overview' | 'history'>('overview');

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const activeFilters = {
        topic:    filters.topic    || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo:   filters.dateTo   || undefined,
        minScore: filters.minScore ? Number(filters.minScore) : undefined,
        maxScore: filters.maxScore ? Number(filters.maxScore) : undefined,
      };
      const res = await getMyResultsApi(page, 50, activeFilters);
      if (res.success && res.data) {
        setAttempts(res.data.attempts);
        setPagination(res.data.pagination);
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Stats ─────────────────────────────────────────────────
  const avgScore   = attempts.length ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length) : 0;
  const bestScore  = attempts.length ? Math.max(...attempts.map((a) => a.score)) : 0;

  const totalTime  = attempts.reduce((s, a) => s + (a.totalTime || 0), 0);

  // Chart data
  const trendData = [...attempts].reverse().slice(-20).map((a, i) => ({
    name:  `T${i + 1}`,
    score: a.score,
    date:  new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  // Moving avg
  const movingAvgData = trendData.map((d, i) => {
    const window = trendData.slice(Math.max(0, i - 2), i + 3);
    return { ...d, avg: Math.round(window.reduce((s, w) => s + w.score, 0) / window.length) };
  });

  // Score distribution
  const distData = [
    { range: '0–20',   count: attempts.filter((a) => a.score < 20).length },
    { range: '20–40',  count: attempts.filter((a) => a.score >= 20 && a.score < 40).length },
    { range: '40–60',  count: attempts.filter((a) => a.score >= 40 && a.score < 60).length },
    { range: '60–80',  count: attempts.filter((a) => a.score >= 60 && a.score < 80).length },
    { range: '80–100', count: attempts.filter((a) => a.score >= 80).length },
  ];

  // Topic performance
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
  })).sort((a, b) => a.score - b.score);

  // Radar
  const radarData = [
    { subject: 'Quant',    value: topicData.find((t) => t.topic.includes('Quant'))?.score   ?? 0 },
    { subject: 'Verbal',   value: topicData.find((t) => t.topic.includes('Verbal'))?.score  ?? 0 },
    { subject: 'Logical',  value: topicData.find((t) => t.topic.includes('Logic'))?.score   ?? 0 },
    { subject: 'Speed',    value: Math.min(avgScore + 10, 100) },
    { subject: 'Accuracy', value: bestScore },
  ];

  // AI insight
  const aiInsight = (() => {
    if (!attempts.length) return 'Complete at least one test to receive AI-powered insights.';
    const recentTrend = trendData.length >= 3
      ? trendData.slice(-3).reduce((s, d) => s + d.score, 0) / 3
      : avgScore;
    const weakTopic = topicData[0]; // lowest score
    const strongTopic = topicData[topicData.length - 1];
    let insight = '';
    if (recentTrend > avgScore + 5)  insight = `📈 Your recent trend (${Math.round(recentTrend)}%) is above your average (${avgScore}%). Great momentum!`;
    else if (recentTrend < avgScore - 5) insight = `⚠️ Recent scores (${Math.round(recentTrend)}%) are below your average (${avgScore}%). Revisit fundamentals.`;
    else insight = `🎯 Consistent around ${avgScore}%. Push harder with difficult problems.`;
    if (weakTopic) insight += ` Focus on: ${weakTopic.topic} (${weakTopic.score}% accuracy).`;
    if (strongTopic && strongTopic !== weakTopic) insight += ` Strong in: ${strongTopic.topic} (${strongTopic.score}%).`;
    return insight;
  })();

  // Export CSV
  const exportCSV = () => {
    const header = ['Date', 'Title', 'Score', 'Correct', 'Incorrect', 'Skipped', 'Time (s)'];
    const rows = attempts.map((a) => [
      new Date(a.createdAt).toLocaleDateString('en-IN'),
      (a.title || '').replace(/,/g, ' '),
      a.score,
      a.correctCount,
      a.incorrectCount,
      a.skippedCount,
      a.totalTime || 0,
    ]);
    const csv = [header, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'test_history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyFilters = () => {
    setPage(1);
    fetchData();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ topic: '', dateFrom: '', dateTo: '', minScore: '', maxScore: '' });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner size="lg" label="Analyzing neural data..." />
        </div>
      </AppLayout>
    );
  }

  if (!attempts.length && !hasActiveFilters) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-80 text-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-center">
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
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6 animate-fade-up">
        <div>
          <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Neural Intelligence</p>
          <h1 className="font-orbitron text-2xl font-bold text-white tracking-wide">
            Performance <span className="gradient-text-cyan-violet">Analysis</span>
          </h1>
          <p className="text-white/30 text-xs font-inter mt-1">
            {pagination.totalAttempts} total tests analyzed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 transition-all text-xs font-inter"
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-inter transition-all',
              hasActiveFilters
                ? 'border-neon-cyan/40 text-neon-cyan bg-neon-cyan/5'
                : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
            )}
          >
            <Filter size={13} />
            Filters
            {hasActiveFilters && (
              <span className="w-4 h-4 rounded-full bg-neon-cyan text-cyber-black text-[9px] font-bold flex items-center justify-center">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
          <HoloButton variant="ghost" size="sm" onClick={() => navigate('/test-setup')} icon={<ArrowRight size={14} />}>
            New Test
          </HoloButton>
        </div>
      </div>

      {/* ── Filter Panel ─────────────────────────────────────────── */}
      {showFilters && (
        <div className="glass-card rounded-2xl border border-white/8 p-4 mb-6 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-white/60 text-sm font-inter font-medium flex items-center gap-2">
              <Filter size={14} className="text-neon-cyan" /> Filter Results
            </p>
            <button onClick={() => setShowFilters(false)} className="text-white/30 hover:text-white/60">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-white/30 text-xs font-inter mb-1 block">Topic</label>
              <select
                value={filters.topic}
                onChange={(e) => setFilters({ ...filters, topic: e.target.value === 'All Topics' ? '' : e.target.value })}
                className="cyber-input w-full h-9 text-xs px-3"
              >
                {TOPICS.map((t) => <option key={t} value={t === 'All Topics' ? '' : t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/30 text-xs font-inter mb-1 block">From Date</label>
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="cyber-input w-full h-9 text-xs px-3" />
            </div>
            <div>
              <label className="text-white/30 text-xs font-inter mb-1 block">To Date</label>
              <input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="cyber-input w-full h-9 text-xs px-3" />
            </div>
            <div>
              <label className="text-white/30 text-xs font-inter mb-1 block">Min Score %</label>
              <input type="number" min="0" max="100" value={filters.minScore} onChange={(e) => setFilters({ ...filters, minScore: e.target.value })}
                className="cyber-input w-full h-9 text-xs px-3" placeholder="0" />
            </div>
            <div>
              <label className="text-white/30 text-xs font-inter mb-1 block">Max Score %</label>
              <input type="number" min="0" max="100" value={filters.maxScore} onChange={(e) => setFilters({ ...filters, maxScore: e.target.value })}
                className="cyber-input w-full h-9 text-xs px-3" placeholder="100" />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <HoloButton variant="cyan" size="sm" onClick={applyFilters} icon={<Search size={13} />}>Apply</HoloButton>
            <HoloButton variant="ghost" size="sm" onClick={clearFilters}>Clear All</HoloButton>
          </div>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        {(['overview', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-inter transition-all capitalize',
              tab === t
                ? 'bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            {t === 'overview' ? '📊 Overview' : '📋 History'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* ── KPI Row ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Tests Taken',  value: pagination.totalAttempts, color: 'cyan',   ring: 100 },
              { label: 'Average Score',value: `${avgScore}%`,           color: 'violet', ring: avgScore },
              { label: 'Best Score',   value: `${bestScore}%`,          color: 'green',  ring: bestScore },
              { label: 'Total Time',   value: fmtTime(totalTime),       color: 'amber',  ring: Math.min(totalTime / 600, 100) },
            ].map((k, i) => (
              <NeonCard key={k.label} variant={k.color as 'cyan' | 'violet' | 'green' | 'amber'} padding="p-5"
                className="flex flex-col items-center gap-3 text-center animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` } as React.CSSProperties}>
                <ProgressRing value={typeof k.ring === 'number' ? k.ring : 100} size={70} strokeWidth={5}
                  color={k.color as 'cyan' | 'violet' | 'green' | 'amber'} showLabel={false}>
                  <span className={cn('font-orbitron text-sm font-bold', `text-neon-${k.color}`)}>{k.value}</span>
                </ProgressRing>
                <p className="text-white/35 text-xs font-inter uppercase tracking-widest">{k.label}</p>
              </NeonCard>
            ))}
          </div>

          {/* ── Score Trend + Distribution ────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            <NeonCard variant="cyan" padding="p-5" className="animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-inter font-semibold text-white">Score Trajectory</h2>
                <TrendingUp size={16} className="text-neon-cyan" />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={movingAvgData}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00F5FF" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
                  <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<NeonTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#00F5FF" strokeWidth={2.5}
                    dot={{ fill: '#00F5FF', r: 3, strokeWidth: 2, stroke: '#080810' }} name="score" />
                  <Line type="monotone" dataKey="avg" stroke="#9D00FF" strokeWidth={1.5}
                    dot={false} strokeDasharray="4 4" name="avg" />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-neon-cyan" />
                  <span className="text-white/30 text-[10px] font-inter">Score</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-neon-violet opacity-70 border-dashed" style={{ borderTop: '1.5px dashed #9D00FF', background: 'transparent' }} />
                  <span className="text-white/30 text-[10px] font-inter">Moving Avg</span>
                </div>
              </div>
            </NeonCard>

            <NeonCard variant="violet" padding="p-5" className="animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-inter font-semibold text-white">Score Distribution</h2>
                <Target size={16} className="text-neon-violet" />
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={distData} barSize={28}>
                  <XAxis dataKey="range" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(157,0,255,0.05)' }}
                    contentStyle={{ background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(157,0,255,0.3)', borderRadius: 8 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    itemStyle={{ color: '#9D00FF' }}
                  />
                  <Bar dataKey="count" radius={4}>
                    {distData.map((_, i) => (
                      <Cell key={i} fill={i >= 3 ? '#00F5FF' : i === 2 ? '#9D00FF' : '#FF3366'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </NeonCard>
          </div>

          {/* ── Topic + Radar ─────────────────────────────────── */}
          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <NeonCard variant="default" padding="p-5" className="lg:col-span-2 animate-fade-up">
              <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 size={16} className="text-neon-cyan" /> Topic Mastery
              </h2>
              {topicData.length > 0 ? (
                <div className="space-y-4">
                  {topicData.map((t) => {
                    const color = scoreColor(t.score);
                    return (
                      <div key={t.topic}>
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-white/70 text-sm font-inter">{t.topic}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-white/25 text-xs font-mono-code">{t.correct}/{t.total}</span>
                            <span className="font-orbitron text-sm font-bold" style={{ color }}>{t.score}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${t.score}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-white/20 text-sm font-inter">No topic data yet.</p>
              )}
            </NeonCard>

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

          {/* ── Activity Heatmap ──────────────────────────────── */}
          <NeonCard variant="default" padding="p-5" className="animate-fade-up mb-6">
            <h2 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
              <Target size={16} className="text-neon-green" /> Activity Heatmap (12 weeks)
            </h2>
            <ContributionHeatmap attempts={attempts} />
          </NeonCard>

          {/* ── AI Insights ───────────────────────────────────── */}
          <NeonCard variant="violet" padding="p-6" className="animate-fade-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-neon-violet/15 border border-neon-violet/30 flex items-center justify-center flex-shrink-0 animate-float">
                <Brain size={22} className="text-neon-violet" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-orbitron text-sm font-bold text-neon-violet">AI NEURAL INSIGHTS</p>
                  <span className="text-[10px] px-1.5 py-0.5 bg-neon-violet/20 border border-neon-violet/30 rounded-full text-neon-violet font-mono-code animate-neon-pulse">LIVE</span>
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
                    🎯 {pagination.totalAttempts} sessions analyzed
                  </span>
                </div>
              </div>
              <Zap size={16} className="text-neon-violet/40 flex-shrink-0 animate-neon-pulse" />
            </div>
          </NeonCard>
        </>
      )}

      {/* ── History Tab ──────────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="animate-fade-up">
          {attempts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/30 font-inter">No tests match your filters.</p>
              <button onClick={clearFilters} className="mt-4 text-neon-cyan text-sm font-inter hover:underline">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6">
                {attempts.map((attempt, i) => (
                  <div
                    key={attempt._id}
                    className="glass-card rounded-xl border border-white/8 p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-white/15 transition-all duration-200 animate-fade-up"
                    style={{ animationDelay: `${i * 0.03}s` } as React.CSSProperties}
                  >
                    {/* Score Ring */}
                    <div className="flex-shrink-0">
                      <div className="w-14 h-14 rounded-full border-2 flex items-center justify-center"
                        style={{ borderColor: scoreColor(attempt.score), boxShadow: `0 0 12px ${scoreColor(attempt.score)}40` }}>
                        <span className="font-orbitron text-sm font-bold" style={{ color: scoreColor(attempt.score) }}>
                          {attempt.score}%
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-inter font-semibold text-white/85 truncate">{attempt.title || 'Practice Test'}</p>
                      <p className="text-white/30 text-xs font-inter mt-0.5">
                        {new Date(attempt.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {attempt.totalTime ? ` • ${fmtTime(attempt.totalTime)}` : ''}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs font-inter">
                      <div className="flex items-center gap-1.5 text-neon-green">
                        <CheckCircle2 size={13} />
                        <span>{attempt.correctCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neon-red">
                        <XCircle size={13} />
                        <span>{attempt.incorrectCount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/30">
                        <MinusCircle size={13} />
                        <span>{attempt.skippedCount}</span>
                      </div>
                      {attempt.totalTime ? (
                        <div className="flex items-center gap-1.5 text-white/30">
                          <Clock size={13} />
                          <span>{fmtTime(attempt.totalTime)}</span>
                        </div>
                      ) : null}
                    </div>

                    {/* Action */}
                    <HoloButton variant="ghost" size="sm"
                      onClick={() => navigate(`/result/${attempt._id}`)}
                      icon={<ExternalLink size={13} />}>
                      Review
                    </HoloButton>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:border-white/20 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-inter"
                  >
                    <ChevronLeft size={15} /> Prev
                  </button>
                  <span className="font-orbitron text-xs text-white/30">
                    {pagination.currentPage} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-white/40 hover:border-white/20 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-sm font-inter"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </AppLayout>
  );
};

export default AnalysisPage;