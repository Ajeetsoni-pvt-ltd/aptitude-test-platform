// src/pages/HistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyResultsApi } from '@/api/testApi';
import type { TestAttempt } from '@/types';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Clock, Search, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts]   = useState<TestAttempt[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [search,   setSearch]     = useState('');
  const [page,     setPage]       = useState(1);
  const [total,    setTotal]      = useState(0);
  const perPage = 10;

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await getMyResultsApi(page, perPage);
        if (res.success && res.data) {
          setAttempts(res.data.attempts);
          setTotal(res.data.pagination.totalAttempts);
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    fetch();
  }, [page]);

  const filtered = attempts.filter((a) =>
    !search || a.title.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-neon-green' : s >= 60 ? 'text-neon-cyan' : s >= 40 ? 'text-neon-amber' : 'text-neon-red';
  const scoreBg = (s: number) =>
    s >= 80 ? 'bg-neon-green/10 border-neon-green/25' : s >= 60 ? 'bg-neon-cyan/10 border-neon-cyan/25' : s >= 40 ? 'bg-neon-amber/10 border-neon-amber/25' : 'bg-neon-red/10 border-neon-red/25';

  const totalPages = Math.ceil(total / perPage);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Records</p>
          <h1 className="font-orbitron text-2xl font-bold text-white">
            Test <span className="gradient-text-cyan-violet">History</span>
          </h1>
        </div>
        <HoloButton variant="cyan" size="sm" onClick={() => navigate('/test-setup')} icon={<Plus size={14} />}>
          New Test
        </HoloButton>
      </div>

      <NeonCard variant="default" padding="p-5" className="animate-fade-up">
        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by test title..."
            className="cyber-input w-full h-10 pl-10 text-sm"
          />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" label="Loading history..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 flex flex-col items-center gap-3 text-center">
            <Clock size={32} className="text-white/15" />
            <p className="text-white/25 font-inter text-sm">No test history found.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2 mb-2">
              {['#', 'Test Title', 'Date', '✓', '✗', '↷', 'Score'].map((h, i) => (
                <p key={h} className={cn('text-white/20 text-xs font-inter uppercase tracking-wider',
                  i === 0 && 'col-span-1', i === 1 && 'col-span-4', i === 2 && 'col-span-2',
                  i === 3 && 'col-span-1 text-center', i === 4 && 'col-span-1 text-center',
                  i === 5 && 'col-span-1 text-center', i === 6 && 'col-span-2 text-right'
                )}>{h}</p>
              ))}
            </div>

            <div className="space-y-2">
              {filtered.map((a, i) => (
                <div
                  key={a._id}
                  className={cn(
                    'grid grid-cols-2 sm:grid-cols-12 gap-4 items-center',
                    'px-4 py-3.5 rounded-xl border border-white/5 bg-white/[0.02]',
                    'hover:border-neon-cyan/20 hover:bg-neon-cyan/[0.03] transition-all duration-300',
                    'animate-fade-up'
                  )}
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <span className="text-white/20 font-mono-code text-xs col-span-1">
                    #{(page - 1) * perPage + i + 1}
                  </span>
                  <div className="col-span-1 sm:col-span-4 min-w-0">
                    <p className="font-inter text-sm text-white/80 truncate">{a.title}</p>
                  </div>
                  <p className="col-span-1 sm:col-span-2 text-white/30 text-xs font-mono-code">
                    {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <span className="hidden sm:block col-span-1 text-center text-neon-green text-sm font-mono-code">{a.correctCount}</span>
                  <span className="hidden sm:block col-span-1 text-center text-neon-red text-sm font-mono-code">{a.incorrectCount}</span>
                  <span className="hidden sm:block col-span-1 text-center text-white/25 text-sm font-mono-code">{a.skippedCount}</span>
                  <div className="col-span-1 sm:col-span-2 flex justify-end">
                    <span className={cn('px-2.5 py-1 rounded-full border text-xs font-orbitron font-bold', scoreColor(a.score), scoreBg(a.score))}>
                      {a.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <HoloButton variant="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)} icon={<ChevronLeft size={14} />}>
                  Prev
                </HoloButton>
                <span className="text-white/30 text-sm font-mono-code">{page} / {totalPages}</span>
                <HoloButton variant="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} icon={<ChevronRight size={14} />}>
                  Next
                </HoloButton>
              </div>
            )}
          </>
        )}
      </NeonCard>
    </AppLayout>
  );
};

export default HistoryPage;
