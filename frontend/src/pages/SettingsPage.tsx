// src/pages/SettingsPage.tsx
import { useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import CyberInput from '@/components/ui/CyberInput';
import { Bell, Palette, Shield, Key, LogOut, Moon, Sun, Zap, Check } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// Toggle component
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <span className="text-white/60 text-sm font-inter">{label}</span>
    <button
      onClick={onChange}
      className={cn(
        'w-10 h-5.5 rounded-full border transition-all duration-300 relative flex-shrink-0',
        checked
          ? 'bg-neon-cyan/20 border-neon-cyan/50 shadow-[0_0_10px_rgba(0,245,255,0.3)]'
          : 'bg-white/5 border-white/15'
      )}
      style={{ height: '22px', width: '40px' }}
    >
      <div className={cn(
        'absolute top-[3px] w-4 h-4 rounded-full transition-all duration-300',
        checked ? 'left-[20px] bg-neon-cyan shadow-[0_0_8px_rgba(0,245,255,0.8)]' : 'left-[3px] bg-white/30'
      )} />
    </button>
  </div>
);

const ACCENTS = [
  { name: 'Cyan',    color: '#00F5FF' },
  { name: 'Violet',  color: '#9D00FF' },
  { name: 'Magenta', color: '#FF00AA' },
  { name: 'Green',   color: '#00FF88' },
];

const SettingsPage = () => {
  const { logout, user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const navigate         = useNavigate();

  const [notifications, setNotifications] = useState({
    testResults:   true,
    weeklyReport:  true,
    achievements:  false,
    reminders:     true,
  });
  const [apiKey, setApiKey] = useState('nxs_•••••••••••••••••••••••••••••');
  const [accent, setAccent] = useState('#00F5FF');
  const [saved,  setSaved]  = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections = [
    {
      id: 'appearance',
      icon: <Palette size={18} />,
      label: 'Appearance',
      color: 'cyan',
      content: (
        <div className="space-y-6">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-inter">Theme Preference</p>
            <div className="flex gap-3">
              {[
                { value: 'light', label: 'Light Mode', icon: <Sun size={16} /> },
                { value: 'dark', label: 'Dark Mode', icon: <Moon size={16} /> },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value as 'light' | 'dark')}
                  className={cn(
                    'flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300',
                    theme === t.value
                      ? 'border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan shadow-[0_0_15px_rgba(0,245,255,0.3)]'
                      : 'border-white/15 bg-white/5 text-white/40 hover:border-white/30 hover:bg-white/10'
                  )}
                >
                  {t.icon}
                  <span className="text-sm font-inter">{t.label}</span>
                  {theme === t.value && <Check size={13} />}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-3 font-inter">Accent Color</p>
            <div className="flex gap-3">
              {ACCENTS.map((a) => (
                <button
                  key={a.name}
                  onClick={() => setAccent(a.color)}
                  className="flex flex-col items-center gap-1.5"
                >
                  <div
                    className={cn('w-10 h-10 rounded-xl transition-all duration-200', accent === a.color && 'ring-2 ring-offset-2 ring-offset-cyber-black scale-110')}
                    style={{ background: a.color, boxShadow: `0 0 15px ${a.color}55` }}
                  />
                  {accent === a.color && <Check size={10} style={{ color: a.color }} />}
                  {accent !== a.color && <div className="h-[10px]" />}
                  <p className="text-white/30 text-[10px] font-inter">{a.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'notifications',
      icon: <Bell size={18} />,
      label: 'Notifications',
      color: 'violet',
      content: (
        <div>
          <Toggle checked={notifications.testResults}  onChange={() => setNotifications((n) => ({ ...n, testResults:  !n.testResults  }))} label="Test result alerts" />
          <Toggle checked={notifications.weeklyReport} onChange={() => setNotifications((n) => ({ ...n, weeklyReport: !n.weeklyReport }))} label="Weekly performance report" />
          <Toggle checked={notifications.achievements} onChange={() => setNotifications((n) => ({ ...n, achievements: !n.achievements }))} label="Achievement unlocks" />
          <Toggle checked={notifications.reminders}    onChange={() => setNotifications((n) => ({ ...n, reminders:    !n.reminders    }))} label="Study reminders" />
        </div>
      ),
    },
    {
      id: 'api',
      icon: <Key size={18} />,
      label: 'API Access',
      color: 'amber',
      content: (
        <div className="space-y-4">
          <p className="text-white/35 text-sm font-inter">Your API key for programmatic access to NEXUS data.</p>
          <CyberInput
            label="API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            icon={<Key size={14} />}
          />
          <HoloButton variant="ghost" size="sm" icon={<Zap size={14} />}>Regenerate Key</HoloButton>
        </div>
      ),
    },
    {
      id: 'security',
      icon: <Shield size={18} />,
      label: 'Security',
      color: 'magenta',
      content: (
        <div className="space-y-3">
          <p className="text-white/35 text-xs font-inter">Logged in as: <span className="text-neon-cyan">{user?.email}</span></p>
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <span className="text-white/60 text-sm font-inter">Two-factor authentication</span>
            <span className="text-neon-amber text-xs font-mono-code">COMING SOON</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-white/60 text-sm font-inter">Session management</span>
            <span className="text-neon-green text-xs font-mono-code">1 ACTIVE</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Configuration</p>
          <h1 className="font-orbitron text-2xl font-bold text-white">
            System <span className="gradient-text-cyan-violet">Settings</span>
          </h1>
        </div>
        <HoloButton variant="cyan" size="sm" loading={false} onClick={handleSave} icon={saved ? <Check size={14} /> : undefined}>
          {saved ? 'Saved!' : 'Save Changes'}
        </HoloButton>
      </div>

      <div className="space-y-4">
        {sections.map((s, i) => (
          <NeonCard
            key={s.id}
            variant={s.color as 'cyan' | 'violet' | 'amber' | 'magenta'}
            padding="p-5"
            className="animate-fade-up"
            style={{ animationDelay: `${i * 0.08}s` } as React.CSSProperties}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', `bg-neon-${s.color}/10 text-neon-${s.color}`)}>
                {s.icon}
              </div>
              <h2 className="font-inter font-semibold text-white">{s.label}</h2>
            </div>
            {s.content}
          </NeonCard>
        ))}

        {/* Danger zone */}
        <NeonCard variant="default" padding="p-5" className="border border-neon-red/15 animate-fade-up">
          <h2 className="font-inter font-semibold text-neon-red mb-3 flex items-center gap-2">
            <LogOut size={16} /> Session
          </h2>
          <p className="text-white/30 text-sm font-inter mb-4">End your current neural session and return to the login screen.</p>
          <HoloButton
            variant="danger"
            size="md"
            icon={<LogOut size={15} />}
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
          >
            Terminate Session
          </HoloButton>
        </NeonCard>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
