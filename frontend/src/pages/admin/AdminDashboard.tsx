// frontend/src/pages/admin/AdminDashboard.tsx
// Redesigned Admin Dashboard — fully aligned with cyber-neon design system

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { getAdminStatsApi } from '@/api/adminApi';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  Users, BookOpen, FileText, TrendingUp, Upload,
  Shield, Zap, Activity, CalendarPlus, ChevronRight,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Custom Tooltip ────────────────────────────────────────────────
const CyberTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong border border-neon-cyan/20 rounded-xl px-3 py-2">
      <p className="text-white/40 text-xs font-inter mb-0.5">{label}</p>
      <p className="text-neon-cyan font-orbitron text-sm font-bold">{payload[0].value}</p>
    </div>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────
interface AdminStatCardProps {
  icon:    React.ReactNode;
  label:   string;
  value:   string | number;
  color:   'cyan' | 'violet' | 'green' | 'amber' | 'magenta';
  sub?:    string;
  delay?:  number;
}

const AdminStatCard = ({ icon, label, value, color, sub, delay = 0 }: AdminStatCardProps) => {
  const colorMap = {
    cyan:    { text: 'text-neon-cyan',    bg: 'bg-neon-cyan/10',    border: 'border-neon-cyan/20',    glow: 'shadow-[0_0_20px_rgba(0,245,255,0.1)]'    },
    violet:  { text: 'text-neon-violet',  bg: 'bg-neon-violet/10',  border: 'border-neon-violet/20',  glow: 'shadow-[0_0_20px_rgba(157,0,255,0.1)]'   },
    green:   { text: 'text-neon-green',   bg: 'bg-neon-green/10',   border: 'border-neon-green/20',   glow: 'shadow-[0_0_20px_rgba(0,255,136,0.1)]'   },
    amber:   { text: 'text-neon-amber',   bg: 'bg-neon-amber/10',   border: 'border-neon-amber/20',   glow: 'shadow-[0_0_15px_rgba(255,183,0,0.1)]'   },
    magenta: { text: 'text-neon-magenta', bg: 'bg-neon-magenta/10', border: 'border-neon-magenta/20', glow: 'shadow-[0_0_20px_rgba(255,0,170,0.1)]'   },
  };
  const c = colorMap[color];

  return (
    <div
      className={cn('neon-card p-5 animate-fade-up group hover:scale-[1.02] transition-transform duration-300', c.glow)}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', c.bg, c.text)}>
          {icon}
        </div>
        <div className="w-1.5 h-1.5 rounded-full animate-neon-pulse" style={{
          background: color === 'cyan' ? '#00F5FF' : color === 'violet' ? '#9D00FF' : color === 'green' ? '#00FF88' : color === 'amber' ? '#FFB700' : '#FF00AA'
        }} />
      </div>
      <p className={cn('font-orbitron text-3xl font-bold mt-1', c.text)}>
        {value}
      </p>
      <p className="text-white/40 text-xs font-inter mt-1 uppercase tracking-widest">{label}</p>
      {sub && <p className="text-white/20 text-[10px] font-inter mt-0.5">{sub}</p>}
    </div>
  );
};

// ── Diff colors ───────────────────────────────────────────────────
const DIFF_COLORS: Record<string, string> = {
  easy:   '#00FF88',
  medium: '#FFB700',
  hard:   '#FF3366',
};

// ── Main Component ────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats,     setStats]    = useState<Record<string, unknown> | null>(null);
  const [isLoading, setLoading]  = useState(true);

  useEffect(() => {
    getAdminStatsApi()
      .then((r) => setStats(r.data as Record<string, unknown>))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const s = stats as {
    users?: { total?: number; students?: number; admins?: number };
    questions?: { total?: number; byTopic?: Array<{ _id: string; count: number }>; byDifficulty?: Array<{ _id: string; count: number }> };
    tests?: { total?: number; last7Days?: number; avgScore?: number };
  } | null;

  return (
    <AdminLayout>
      <div className="min-h-screen" style={{ background: '#080810' }}>

        {/* Cyber grid */}
        <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />

        {/* Scanline */}
        <div
          className="fixed left-0 right-0 h-px pointer-events-none opacity-10"
          style={{
            background: 'linear-gradient(90deg, transparent, #00F5FF, transparent)',
            animation: 'scanline 4s linear infinite',
          }}
        />

        <div className="relative z-10 max-w-6xl mx-auto p-6">

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
              <div className="w-16 h-16 border-2 border-transparent border-t-neon-cyan border-r-neon-magenta rounded-full animate-spin"
                style={{ boxShadow: '0 0 20px rgba(0,245,255,0.3)' }} />
              <p className="font-orbitron text-xs text-neon-cyan tracking-widest uppercase animate-neon-pulse">
                Loading System Data...
              </p>
            </div>
          ) : (
            <>
              {/* ── Header ───────────────────────────────────────── */}
              <div className="flex items-start justify-between mb-8 animate-fade-up">
                <div>
                  <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-neon-green animate-neon-pulse mr-2" />
                    System Online
                  </p>
                  <h1 className="font-orbitron text-3xl font-bold tracking-wide"
                    style={{
                      background: 'linear-gradient(90deg, #00F5FF, #FF00AA, #00F5FF)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'shimmer-sweep 3s linear infinite',
                    }}>
                    Admin Dashboard
                  </h1>
                  <p className="text-white/30 text-sm font-inter mt-1.5 flex items-center gap-2">
                    <Activity size={13} className="text-neon-cyan" />
                    Platform control interface · v2.0
                  </p>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="font-orbitron text-xs text-neon-cyan/40 tracking-widest">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                  </p>
                  <p className="font-orbitron text-xs text-white/20 mt-1">CTRL PANEL v2.4</p>
                </div>
              </div>

              {/* ── Stat Grid ────────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                <AdminStatCard icon={<Users size={20} />}   label="Total Users"    value={s?.users?.total ?? 0}     color="cyan"    delay={0.05} sub="All accounts" />
                <AdminStatCard icon={<Shield size={20} />}  label="Students"       value={s?.users?.students ?? 0}  color="violet"  delay={0.1}  sub="Active learners" />
                <AdminStatCard icon={<BookOpen size={20} />} label="Questions"      value={s?.questions?.total ?? 0} color="green"   delay={0.15} sub="Question bank" />
                <AdminStatCard icon={<FileText size={20} />} label="Tests Taken"    value={s?.tests?.total ?? 0}     color="amber"   delay={0.2}  sub="All attempts" />
                <AdminStatCard icon={<Zap size={20} />}     label="Last 7 Days"    value={s?.tests?.last7Days ?? 0}  color="magenta" delay={0.25} sub="Recent tests" />
                <AdminStatCard icon={<TrendingUp size={20} />} label="Avg Score"    value={`${s?.tests?.avgScore ?? 0}%`} color="cyan"  delay={0.3}  sub="Platform average" />
                <AdminStatCard icon={<Activity size={20} />} label="Admins"         value={s?.users?.admins ?? 0}    color="violet"  delay={0.35} sub="Admin accounts" />
                <AdminStatCard icon={<BarChart3 size={20} />} label="Active Today"   value="—"                        color="green"   delay={0.4}  sub="Real-time" />
              </div>

              {/* ── Charts ───────────────────────────────────────── */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <NeonCard variant="cyan" padding="p-5" className="animate-fade-up">
                  <h3 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-neon-cyan to-neon-violet rounded-full" />
                    Questions by Topic
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(s?.questions?.byTopic as Array<{ _id: string; count: number }>|undefined) || []} barCategoryGap="30%">
                      <XAxis
                        dataKey="_id"
                        tick={{ fill: 'rgba(0,245,255,0.5)', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(0,245,255,0.15)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(0,245,255,0.4)', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip content={<CyberTooltip />} cursor={{ fill: 'rgba(0,245,255,0.05)' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        <defs>
                          <linearGradient id="topicGrad2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#00F5FF" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#9D00FF" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        {((s?.questions?.byTopic as Array<{ _id: string; count: number }>|undefined) || []).map((_, i) => (
                          <Cell key={i} fill="url(#topicGrad2)" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </NeonCard>

                <NeonCard variant="violet" padding="p-5" className="animate-fade-up">
                  <h3 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                    <div className="w-0.5 h-4 bg-gradient-to-b from-neon-violet to-neon-magenta rounded-full" />
                    Questions by Difficulty
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={(s?.questions?.byDifficulty as Array<{ _id: string; count: number }>|undefined) || []} barCategoryGap="40%">
                      <XAxis
                        dataKey="_id"
                        tick={{ fill: 'rgba(0,245,255,0.5)', fontSize: 11 }}
                        axisLine={{ stroke: 'rgba(0,245,255,0.15)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(0,245,255,0.4)', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip content={<CyberTooltip />} cursor={{ fill: 'rgba(0,245,255,0.05)' }} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {((s?.questions?.byDifficulty as Array<{ _id: string; count: number }>|undefined) || []).map((entry) => (
                          <Cell key={entry._id} fill={DIFF_COLORS[entry._id] || '#6366f1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </NeonCard>
              </div>

              {/* ── Quick Actions ─────────────────────────────────── */}
              <NeonCard
                variant="default"
                padding="p-6"
                className="animate-fade-up"
                style={{ background: 'linear-gradient(135deg, rgba(157,0,255,0.08), rgba(0,245,255,0.05))' }}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-orbitron text-lg font-bold text-white flex items-center gap-2">
                      <Zap size={18} className="text-neon-cyan" />
                      Quick Actions
                    </h2>
                    <p className="text-white/30 text-xs font-inter mt-1 uppercase tracking-widest">Platform Control Interface</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <HoloButton variant="cyan" size="sm" onClick={() => navigate('/admin/create-test')} icon={<CalendarPlus size={14} />}>
                      Create Test
                    </HoloButton>
                    <HoloButton variant="violet" size="sm" onClick={() => navigate('/admin/upload')} icon={<Upload size={14} />}>
                      Upload Questions
                    </HoloButton>
                    <HoloButton variant="ghost" size="sm" onClick={() => navigate('/admin/questions')} icon={<ChevronRight size={14} />}>
                      View Questions
                    </HoloButton>
                    <HoloButton variant="ghost" size="sm" onClick={() => navigate('/admin/users')} icon={<Users size={14} />}>
                      Manage Users
                    </HoloButton>
                  </div>
                </div>
              </NeonCard>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;