// frontend/src/pages/admin/AdminSettingsPage.tsx
// Admin Settings — proctoring, test rules, platform config, maintenance

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import {
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  AdminToggle,
  AdminStatusBadge,
} from '@/components/admin/AdminUI';
import HoloButton from '@/components/ui/HoloButton';
import {
  Shield, Clock, Eye, Bell, Database, Sliders,
  Save, RotateCcw, CheckCircle2, AlertTriangle, Info,
  Lock, Zap, Users, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Settings shape ────────────────────────────────────────────
interface PlatformSettings {
  // Proctoring
  proctoringEnabled: boolean;
  faceDetectionRequired: boolean;
  tabSwitchWarnings: boolean;
  maxTabSwitches: number;
  fullscreenRequired: boolean;

  // Test rules
  defaultTimeLimit: number;
  defaultQuestionCount: number;
  maxAttemptsPerTest: number;
  showResultsImmediately: boolean;
  allowTestReview: boolean;
  shuffleQuestions: boolean;

  // Notifications
  notifyOnTestComplete: boolean;
  notifyOnNewStudent: boolean;
  emailNotifications: boolean;

  // Platform
  maintenanceMode: boolean;
  registrationOpen: boolean;
  demoModeEnabled: boolean;
  leaderboardPublic: boolean;
}

const DEFAULTS: PlatformSettings = {
  proctoringEnabled: true,
  faceDetectionRequired: false,
  tabSwitchWarnings: true,
  maxTabSwitches: 3,
  fullscreenRequired: true,

  defaultTimeLimit: 60,
  defaultQuestionCount: 20,
  maxAttemptsPerTest: 1,
  showResultsImmediately: true,
  allowTestReview: true,
  shuffleQuestions: true,

  notifyOnTestComplete: true,
  notifyOnNewStudent: false,
  emailNotifications: false,

  maintenanceMode: false,
  registrationOpen: true,
  demoModeEnabled: true,
  leaderboardPublic: true,
};

const STORAGE_KEY = 'aetherexam_admin_settings';

const loadSettings = (): PlatformSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULTS };
};

const saveSettings = (settings: PlatformSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

// ── Number input ──────────────────────────────────────────────
const NumberInput = ({
  label, description, value, min, max, step = 1, unit,
  onChange, tone = 'cyan',
}: {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  tone?: 'cyan' | 'violet' | 'amber' | 'green' | 'magenta';
}) => {
  const colorMap = {
    cyan: 'border-neon-cyan/30 focus:border-neon-cyan/60 text-neon-cyan',
    violet: 'border-neon-violet/30 focus:border-neon-violet/60 text-neon-violet',
    amber: 'border-neon-amber/30 focus:border-neon-amber/60 text-neon-amber',
    green: 'border-neon-green/30 focus:border-neon-green/60 text-neon-green',
    magenta: 'border-neon-magenta/30 focus:border-neon-magenta/60 text-neon-magenta',
  };

  return (
    <div className="admin-panel flex items-center justify-between gap-5 px-5 py-4">
      <div className="relative z-[1] space-y-1 flex-1">
        <p className="font-inter text-sm font-semibold text-white">{label}</p>
        {description && <p className="text-sm leading-6 text-white/40">{description}</p>}
      </div>
      <div className="relative z-[1] flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 rounded-xl border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center font-bold"
        >
          −
        </button>
        <div className={cn('w-20 text-center font-orbitron text-lg font-bold px-2 py-1 rounded-xl border bg-white/[0.03]', colorMap[tone])}>
          {value}{unit ? <span className="text-xs ml-0.5 opacity-60">{unit}</span> : null}
        </div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-8 h-8 rounded-xl border border-white/10 bg-white/[0.04] text-white/60 hover:text-white hover:border-white/20 transition-all flex items-center justify-center font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────
const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<PlatformSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  useEffect(() => {
    const stored = loadSettings();
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(stored));
  }, [settings]);

  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setHasChanges(false);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setSettings({ ...DEFAULTS });
    setSaved(false);
  };

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          eyebrow="System Configuration"
          title={<>Platform <span className="gradient-text-cyan-magenta">Settings</span></>}
          description="Control proctoring enforcement, test defaults, notification preferences, and platform-wide behaviour from one command panel."
          actions={
            <div className="flex items-center gap-3">
              {hasChanges && (
                <AdminStatusBadge tone="amber">Unsaved Changes</AdminStatusBadge>
              )}
              {saved && (
                <AdminStatusBadge tone="green">Saved</AdminStatusBadge>
              )}
              <HoloButton
                variant="ghost"
                size="md"
                icon={<RotateCcw size={15} />}
                onClick={handleReset}
              >
                Reset Defaults
              </HoloButton>
              <HoloButton
                variant="cyan"
                size="md"
                icon={saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
                onClick={handleSave}
              >
                {saved ? 'Saved!' : 'Save Settings'}
              </HoloButton>
            </div>
          }
        />

        {/* ── Info Banner ────────────────────────────────────── */}
        <div className="flex items-start gap-3 rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 px-5 py-4">
          <Info size={16} className="text-neon-cyan flex-shrink-0 mt-0.5" />
          <p className="text-sm text-white/55 font-inter leading-6">
            Settings are stored locally in your browser and applied to the admin session.
            For production deployments, connect these to a backend config API.
          </p>
        </div>

        {/* ── Proctoring Settings ────────────────────────────── */}
        <AdminPanel
          tone="amber"
          eyebrow="Exam Integrity"
          title="Proctoring & Anti-Cheat"
          description="Control how strictly the platform monitors students during live tests."
          actions={
            <AdminStatusBadge tone={settings.proctoringEnabled ? 'green' : 'red'}>
              {settings.proctoringEnabled ? 'Active' : 'Disabled'}
            </AdminStatusBadge>
          }
        >
          <div className="space-y-3">
            <AdminToggle
              checked={settings.proctoringEnabled}
              onChange={(v) => update('proctoringEnabled', v)}
              label="Enable Proctoring"
              description="Master switch — turns on all monitoring features for scheduled tests."
              tone="amber"
            />
            <AdminToggle
              checked={settings.faceDetectionRequired}
              onChange={(v) => update('faceDetectionRequired', v)}
              label="Face Detection Required"
              description="Students must keep their face visible via webcam throughout the test."
              tone="amber"
            />
            <AdminToggle
              checked={settings.tabSwitchWarnings}
              onChange={(v) => update('tabSwitchWarnings', v)}
              label="Tab Switch Warnings"
              description="Warn students when they switch browser tabs or windows during a test."
              tone="amber"
            />
            <AdminToggle
              checked={settings.fullscreenRequired}
              onChange={(v) => update('fullscreenRequired', v)}
              label="Fullscreen Required"
              description="Force fullscreen mode — exiting triggers a warning or auto-submit."
              tone="amber"
            />
            <NumberInput
              label="Max Tab Switches Allowed"
              description="Test auto-submits after this many tab switches."
              value={settings.maxTabSwitches}
              min={1}
              max={10}
              onChange={(v) => update('maxTabSwitches', v)}
              tone="amber"
            />
          </div>

          {settings.proctoringEnabled && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-neon-amber/20 bg-neon-amber/5 px-4 py-3">
              <AlertTriangle size={14} className="text-neon-amber flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/50 font-inter leading-5">
                Proctoring is active. Students will see a camera permission prompt before starting any scheduled test.
              </p>
            </div>
          )}
        </AdminPanel>

        {/* ── Test Rules ─────────────────────────────────────── */}
        <AdminPanel
          tone="violet"
          eyebrow="Test Configuration"
          title="Default Test Rules"
          description="These defaults apply when creating new tests. Individual tests can override them."
          actions={<Eye size={16} className="text-neon-violet" />}
        >
          <div className="space-y-3">
            <NumberInput
              label="Default Time Limit"
              description="Default duration for new tests in minutes."
              value={settings.defaultTimeLimit}
              min={5}
              max={300}
              step={5}
              unit="min"
              onChange={(v) => update('defaultTimeLimit', v)}
              tone="violet"
            />
            <NumberInput
              label="Default Question Count"
              description="Default number of questions per test session."
              value={settings.defaultQuestionCount}
              min={5}
              max={100}
              step={5}
              onChange={(v) => update('defaultQuestionCount', v)}
              tone="violet"
            />
            <NumberInput
              label="Max Attempts Per Test"
              description="How many times a student can attempt the same scheduled test."
              value={settings.maxAttemptsPerTest}
              min={1}
              max={10}
              onChange={(v) => update('maxAttemptsPerTest', v)}
              tone="violet"
            />
            <AdminToggle
              checked={settings.shuffleQuestions}
              onChange={(v) => update('shuffleQuestions', v)}
              label="Shuffle Questions"
              description="Randomize question order for each student to reduce copying."
              tone="violet"
            />
            <AdminToggle
              checked={settings.showResultsImmediately}
              onChange={(v) => update('showResultsImmediately', v)}
              label="Show Results Immediately"
              description="Students see their score and breakdown right after submitting."
              tone="violet"
            />
            <AdminToggle
              checked={settings.allowTestReview}
              onChange={(v) => update('allowTestReview', v)}
              label="Allow Solution Review"
              description="Students can review correct answers and explanations after the test."
              tone="violet"
            />
          </div>
        </AdminPanel>

        {/* ── Notifications ──────────────────────────────────── */}
        <AdminPanel
          tone="cyan"
          eyebrow="Alerts & Notifications"
          title="Notification Preferences"
          description="Control which events trigger admin notifications."
          actions={<Bell size={16} className="text-neon-cyan" />}
        >
          <div className="space-y-3">
            <AdminToggle
              checked={settings.notifyOnTestComplete}
              onChange={(v) => update('notifyOnTestComplete', v)}
              label="Notify on Test Completion"
              description="Receive an in-app notification when a student completes a scheduled test."
              tone="cyan"
            />
            <AdminToggle
              checked={settings.notifyOnNewStudent}
              onChange={(v) => update('notifyOnNewStudent', v)}
              label="Notify on New Registration"
              description="Get notified when a new student registers on the platform."
              tone="cyan"
            />
            <AdminToggle
              checked={settings.emailNotifications}
              onChange={(v) => update('emailNotifications', v)}
              label="Email Notifications"
              description="Send email alerts for critical events (requires email service configuration)."
              tone="cyan"
            />
          </div>
        </AdminPanel>

        {/* ── Platform Controls ──────────────────────────────── */}
        <AdminPanel
          tone="magenta"
          eyebrow="Platform Control"
          title="Access & Visibility"
          description="Control platform-wide access, registration, and public features."
        >
          <div className="space-y-3">
            <AdminToggle
              checked={settings.registrationOpen}
              onChange={(v) => update('registrationOpen', v)}
              label="Open Registration"
              description="Allow new students to create accounts. Disable to lock the platform."
              tone="magenta"
            />
            <AdminToggle
              checked={settings.leaderboardPublic}
              onChange={(v) => update('leaderboardPublic', v)}
              label="Public Leaderboard"
              description="Students can see the global leaderboard with all rankings."
              tone="magenta"
            />
            <AdminToggle
              checked={settings.demoModeEnabled}
              onChange={(v) => update('demoModeEnabled', v)}
              label="Demo Mode"
              description="Allow unauthenticated users to try a demo test from the landing page."
              tone="magenta"
            />
          </div>
        </AdminPanel>

        {/* ── Maintenance Mode ───────────────────────────────── */}
        <AdminPanel
          tone={settings.maintenanceMode ? 'red' : 'default'}
          eyebrow="System Status"
          title="Maintenance Mode"
          description="When enabled, students see a maintenance page and cannot access the platform."
          actions={
            <AdminStatusBadge tone={settings.maintenanceMode ? 'red' : 'green'}>
              {settings.maintenanceMode ? '⚠ Maintenance Active' : '● System Online'}
            </AdminStatusBadge>
          }
        >
          <AdminToggle
            checked={settings.maintenanceMode}
            onChange={(v) => update('maintenanceMode', v)}
            label="Enable Maintenance Mode"
            description="Immediately blocks all student access. Admins can still log in."
            tone="red"
          />
          {settings.maintenanceMode && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-neon-red/25 bg-neon-red/8 px-4 py-3">
              <AlertTriangle size={14} className="text-neon-red flex-shrink-0 mt-0.5" />
              <p className="text-xs text-neon-red/80 font-inter leading-5">
                Maintenance mode is ON. Students cannot access the platform right now.
                Remember to turn this off when maintenance is complete.
              </p>
            </div>
          )}
        </AdminPanel>

        {/* ── Current Config Summary ─────────────────────────── */}
        <AdminPanel
          tone="default"
          eyebrow="Configuration Summary"
          title="Active Settings Overview"
          description="A quick-glance summary of your current platform configuration."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Shield size={16} />,
                label: 'Proctoring',
                value: settings.proctoringEnabled ? 'Enabled' : 'Disabled',
                active: settings.proctoringEnabled,
                tone: 'amber',
              },
              {
                icon: <Clock size={16} />,
                label: 'Default Time',
                value: `${settings.defaultTimeLimit} min`,
                active: true,
                tone: 'violet',
              },
              {
                icon: <BookOpen size={16} />,
                label: 'Default Questions',
                value: `${settings.defaultQuestionCount} Q`,
                active: true,
                tone: 'cyan',
              },
              {
                icon: <Lock size={16} />,
                label: 'Max Attempts',
                value: `${settings.maxAttemptsPerTest}x`,
                active: true,
                tone: 'magenta',
              },
              {
                icon: <Users size={16} />,
                label: 'Registration',
                value: settings.registrationOpen ? 'Open' : 'Closed',
                active: settings.registrationOpen,
                tone: 'green',
              },
              {
                icon: <Eye size={16} />,
                label: 'Tab Switches',
                value: `Max ${settings.maxTabSwitches}`,
                active: settings.tabSwitchWarnings,
                tone: 'amber',
              },
              {
                icon: <Zap size={16} />,
                label: 'Demo Mode',
                value: settings.demoModeEnabled ? 'On' : 'Off',
                active: settings.demoModeEnabled,
                tone: 'cyan',
              },
              {
                icon: <Database size={16} />,
                label: 'System',
                value: settings.maintenanceMode ? 'Maintenance' : 'Online',
                active: !settings.maintenanceMode,
                tone: settings.maintenanceMode ? 'red' : 'green',
              },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  'rounded-2xl border px-4 py-4 flex items-center gap-3',
                  item.active
                    ? `border-neon-${item.tone}/20 bg-neon-${item.tone}/5`
                    : 'border-white/5 bg-white/[0.02]'
                )}
              >
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', `bg-neon-${item.tone}/10 text-neon-${item.tone}`)}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-widest font-inter">{item.label}</p>
                  <p className={cn('font-inter text-sm font-semibold mt-0.5', item.active ? `text-neon-${item.tone}` : 'text-white/40')}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AdminPanel>

        {/* ── Save Footer ────────────────────────────────────── */}
        <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-3">
            {hasChanges ? (
              <>
                <div className="h-2 w-2 rounded-full bg-neon-amber animate-pulse" />
                <p className="text-white/50 text-sm font-inter">You have unsaved changes.</p>
              </>
            ) : saved ? (
              <>
                <CheckCircle2 size={16} className="text-neon-green" />
                <p className="text-neon-green text-sm font-inter">All settings saved successfully.</p>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-neon-green" />
                <p className="text-white/30 text-sm font-inter">Settings are up to date.</p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <HoloButton variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={handleReset}>
              Reset
            </HoloButton>
            <HoloButton
              variant="cyan"
              size="sm"
              icon={saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
              onClick={handleSave}
            >
              {saved ? 'Saved!' : 'Save All'}
            </HoloButton>
          </div>
        </div>
      </AdminPage>
    </AdminLayout>
  );
};

export default AdminSettingsPage;
