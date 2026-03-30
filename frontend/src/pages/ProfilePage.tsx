// src/pages/ProfilePage.tsx
import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import CyberInput from '@/components/ui/CyberInput';
import { User, Mail, Shield, Edit3, Save, X, Zap, Activity, Trophy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProfilePage = () => {
  const { user } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');

  const joinDate = 'Mar 2025'; // placeholder
  const stats = [
    { label: 'Tests Taken',  value: '—',   icon: <Activity size={16} />,  color: 'cyan' },
    { label: 'Best Score',   value: '—%',  icon: <Trophy size={16} />,    color: 'amber' },
    { label: 'Total Time',   value: '—m',  icon: <Clock size={16} />,     color: 'violet' },
    { label: 'Rank',         value: '#—',  icon: <Zap size={16} />,       color: 'magenta' },
  ];

  // Activity heatmap (mock)
  const heatRows = 4;
  const heatCols = 12;
  const cells = Array.from({ length: heatRows * heatCols }, (_, i) => ({
    id: i,
    intensity: Math.random() > 0.6 ? Math.floor(Math.random() * 4) + 1 : 0,
  }));
  const heatColors = ['', 'rgba(0,245,255,0.15)', 'rgba(0,245,255,0.35)', 'rgba(0,245,255,0.6)', 'rgba(0,245,255,0.9)'];

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Identity</p>
        <h1 className="font-orbitron text-2xl font-bold text-white">
          Neural <span className="gradient-text-cyan-violet">Profile</span>
        </h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Profile card ─────────────────────────────── */}
        <NeonCard variant="cyan" padding="p-6" className="lg:col-span-1 animate-fade-up">
          <div className="flex flex-col items-center text-center gap-4">
            <NeuralAvatar name={user?.name ?? 'User'} role={user?.role} size="xl" />
            <div>
              {editing ? (
                <CyberInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-center mb-2"
                />
              ) : (
                <h2 className="font-inter font-bold text-xl text-white">{user?.name}</h2>
              )}
              <p className="text-white/30 text-sm font-inter mt-1 capitalize">{user?.role ?? 'Student'}</p>
              <p className="text-white/20 text-xs font-mono-code mt-0.5">{user?.email}</p>
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="text-xs px-2.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/25 text-neon-cyan font-inter">
                🎓 Student
              </span>
              {user?.role === 'admin' && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-neon-violet/10 border border-neon-violet/25 text-neon-violet font-inter">
                  <Shield size={10} className="inline mr-1" />Admin
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-neon-green/10 border border-neon-green/25 text-neon-green font-inter">
                ✓ Verified
              </span>
            </div>

            {/* Member since */}
            <p className="text-white/20 text-xs font-inter">Member since {joinDate}</p>

            {/* Edit actions */}
            <div className="flex gap-2 w-full">
              {editing ? (
                <>
                  <HoloButton variant="cyan" size="sm" fullWidth icon={<Save size={14} />} onClick={() => setEditing(false)}>Save</HoloButton>
                  <HoloButton variant="ghost" size="sm" fullWidth icon={<X size={14} />} onClick={() => { setEditing(false); setName(user?.name ?? ''); }}>Cancel</HoloButton>
                </>
              ) : (
                <HoloButton variant="ghost" size="sm" fullWidth icon={<Edit3 size={14} />} onClick={() => setEditing(true)}>Edit Profile</HoloButton>
              )}
            </div>
          </div>
        </NeonCard>

        {/* ── Right side ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 animate-fade-up-delay">
            {stats.map((s) => (
              <NeonCard key={s.label} variant={s.color as 'cyan' | 'amber' | 'violet' | 'magenta'} padding="p-4">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', `bg-neon-${s.color}/10 text-neon-${s.color}`)}>
                  {s.icon}
                </div>
                <p className={cn('font-orbitron text-2xl font-bold', `text-neon-${s.color}`)}>{s.value}</p>
                <p className="text-white/30 text-xs font-inter mt-0.5">{s.label}</p>
              </NeonCard>
            ))}
          </div>

          {/* Account info */}
          <NeonCard variant="default" padding="p-5" className="animate-fade-up">
            <h3 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-neon-cyan" /> Account Details
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Full Name',  value: user?.name  ?? '—', icon: <User size={14} /> },
                { label: 'Email',      value: user?.email ?? '—', icon: <Mail size={14} /> },
                { label: 'Role',       value: user?.role  ?? '—', icon: <Shield size={14} /> },
              ].map((field) => (
                <div key={field.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.025] border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-neon-cyan/8 border border-neon-cyan/15 flex items-center justify-center text-neon-cyan flex-shrink-0">
                    {field.icon}
                  </div>
                  <div>
                    <p className="text-white/25 text-xs font-inter">{field.label}</p>
                    <p className="text-white/70 text-sm font-inter capitalize">{field.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </NeonCard>

          {/* Activity heatmap */}
          <NeonCard variant="default" padding="p-5" className="animate-fade-up">
            <h3 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
              <Activity size={16} className="text-neon-cyan" /> Activity Heatmap
            </h3>
            <div className="overflow-x-auto">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${heatCols}, 1fr)`, gridTemplateRows: `repeat(${heatRows}, 1fr)` }}>
                {cells.map((c) => (
                  <div
                    key={c.id}
                    className="w-5 h-5 rounded-sm transition-all duration-300 hover:scale-110"
                    style={{
                      background: heatColors[c.intensity] || 'rgba(255,255,255,0.04)',
                      boxShadow: c.intensity >= 3 ? '0 0 6px rgba(0,245,255,0.5)' : 'none',
                    }}
                    title={`${c.intensity} tests`}
                  />
                ))}
              </div>
            </div>
            <p className="text-white/15 text-xs font-inter mt-3">Activity over the last 3 months</p>
          </NeonCard>
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
