// src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import CyberInput from '@/components/ui/CyberInput';
import { getUserProfileApi, getUserStatsApi, updateUserProfileApi, uploadProfilePictureApi } from '@/api/userApi';
import { User, Mail, Shield, Edit3, Save, X, Zap, Activity, Trophy, Clock, Upload, AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  profilePicture?: string;
  createdAt: string;
}

interface StatsData {
  totalTests: number;
  bestScore: number;
  averageScore: number;
  totalTime: number;
  rank: number;
  recentAttempts: any[];
}

const ProfilePage = () => {
  
  // Profile State
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Loading profile...');

  // Edit Mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Profile Picture Upload
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch profile and stats on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch profile
        setLoadingMessage('Fetching profile...');
        const profileRes = await getUserProfileApi();
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          setEditName(profileRes.data.name);
          setEditEmail(profileRes.data.email);
        }

        // Fetch stats
        setLoadingMessage('Calculating statistics...');
        const statsRes = await getUserStatsApi();
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to load profile. Please try again.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle profile picture selection
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must not exceed 5MB.');
      return;
    }

    setUploadError('');
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload profile picture
  const handleUploadPicture = async () => {
    if (!selectedFile) return;

    setUploadingPicture(true);
    setUploadError('');

    try {
      const res = await uploadProfilePictureApi(selectedFile);
      if (res.success && profile) {
        setProfile({ ...profile, profilePicture: res.data?.profilePicture });
        setPreviewImage(null);
        setSelectedFile(null);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to upload image. Please try again.';
      setUploadError(msg);
    } finally {
      setUploadingPicture(false);
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    setEditError('');
    setEditLoading(true);

    try {
      // Validate
      if (!editName.trim()) {
        setEditError('Name cannot be empty.');
        setEditLoading(false);
        return;
      }

      if (!editEmail.trim()) {
        setEditError('Email cannot be empty.');
        setEditLoading(false);
        return;
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(editEmail)) {
        setEditError('Please enter a valid email address.');
        setEditLoading(false);
        return;
      }

      const res = await updateUserProfileApi({
        name: editName,
        email: editEmail,
      });

      if (res.success && res.data) {
        setProfile({
          ...profile!,
          name: res.data.name,
          email: res.data.email,
        });
        setEditing(false);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile. Please try again.';
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-neon-cyan"></div>
          <p className="text-white/40 text-sm font-inter">{loadingMessage}</p>
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <NeonCard variant="default" padding="p-8" className="max-w-md">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="text-neon-red flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">Failed to Load Profile</h3>
                <p className="text-white/50 text-sm">{error}</p>
              </div>
            </div>
          </NeonCard>
        </div>
      </AppLayout>
    );
  }

  if (!profile) return null;

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
            
            {/* Profile Picture Section */}
            <div className="relative">
              <NeuralAvatar 
                name={profile.name} 
                role={profile.role} 
                size="xl"
                imageUrl={previewImage || profile.profilePicture}
              />
              {!editing && (
                <label className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-neon-cyan hover:bg-neon-cyan/80 border-2 border-cyber-black flex items-center justify-center cursor-pointer transition-all duration-200 shadow-lg hover:shadow-[0_0_20px_rgba(0,245,255,0.5)]">
                  <Upload size={16} className="text-cyber-black" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePictureChange}
                    disabled={uploadingPicture}
                  />
                </label>
              )}
            </div>

            {/* Profile Picture Preview & Upload */}
            {previewImage && (
              <div className="w-full p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/25 space-y-3">
                <p className="text-neon-cyan text-xs font-semibold">Preview</p>
                <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
                <div className="flex gap-2">
                  <HoloButton
                    variant="cyan"
                    size="sm"
                    fullWidth
                    loading={uploadingPicture}
                    onClick={handleUploadPicture}
                    icon={<Check size={14} />}
                  >
                    Use This
                  </HoloButton>
                  <HoloButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setPreviewImage(null);
                      setSelectedFile(null);
                    }}
                    icon={<X size={14} />}
                  >
                    Cancel
                  </HoloButton>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="w-full flex items-center gap-2 p-3 rounded-lg bg-neon-red/8 border border-neon-red/25">
                <AlertTriangle size={14} className="text-neon-red flex-shrink-0" />
                <p className="text-neon-red text-xs font-inter">{uploadError}</p>
              </div>
            )}

            {/* User Info */}
            <div className="w-full">
              {editing ? (
                <div className="space-y-3">
                  <CyberInput
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Full Name"
                    className="text-center"
                  />
                  <CyberInput
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="text-center"
                  />
                </div>
              ) : (
                <>
                  <h2 className="font-inter font-bold text-xl text-white">{profile.name}</h2>
                  <p className="text-white/30 text-sm font-inter mt-1 capitalize">{profile.role}</p>
                  <p className="text-white/20 text-xs font-mono-code mt-0.5">{profile.email}</p>
                </>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="text-xs px-2.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/25 text-neon-cyan font-inter">
                🎓 Student
              </span>
              {profile.role === 'admin' && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-neon-violet/10 border border-neon-violet/25 text-neon-violet font-inter">
                  <Shield size={10} className="inline mr-1" />Admin
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-neon-green/10 border border-neon-green/25 text-neon-green font-inter">
                ✓ Verified
              </span>
            </div>

            {/* Member since */}
            <p className="text-white/20 text-xs font-inter">Member since {formatDate(profile.createdAt)}</p>

            {/* Edit Error */}
            {editError && (
              <div className="w-full flex items-center gap-2 p-2 rounded-lg bg-neon-red/8 border border-neon-red/25">
                <AlertTriangle size={12} className="text-neon-red flex-shrink-0" />
                <p className="text-neon-red text-xs font-inter">{editError}</p>
              </div>
            )}

            {/* Edit actions */}
            <div className="flex gap-2 w-full">
              {editing ? (
                <>
                  <HoloButton
                    variant="cyan"
                    size="sm"
                    fullWidth
                    icon={<Save size={14} />}
                    onClick={handleSaveProfile}
                    loading={editLoading}
                  >
                    Save
                  </HoloButton>
                  <HoloButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    icon={<X size={14} />}
                    onClick={() => {
                      setEditing(false);
                      setEditName(profile.name);
                      setEditEmail(profile.email);
                      setEditError('');
                    }}
                  >
                    Cancel
                  </HoloButton>
                </>
              ) : (
                <HoloButton variant="ghost" size="sm" fullWidth icon={<Edit3 size={14} />} onClick={() => setEditing(true)}>
                  Edit Profile
                </HoloButton>
              )}
            </div>
          </div>
        </NeonCard>

        {/* ── Right side ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 animate-fade-up-delay">
            {[
              { label: 'Tests Taken', value: stats?.totalTests ?? '—', icon: <Activity size={16} />, color: 'cyan' as const },
              { label: 'Best Score', value: `${stats?.bestScore ?? '—'}%`, icon: <Trophy size={16} />, color: 'amber' as const },
              { label: 'Total Time', value: `${stats?.totalTime ?? '—'}m`, icon: <Clock size={16} />, color: 'violet' as const },
              { label: 'Rank', value: `#${stats?.rank ?? '—'}`, icon: <Zap size={16} />, color: 'magenta' as const },
            ].map((s) => (
              <NeonCard key={s.label} variant={s.color} padding="p-4">
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
                { label: 'Full Name', value: profile.name, icon: <User size={14} /> },
                { label: 'Email', value: profile.email, icon: <Mail size={14} /> },
                { label: 'Role', value: profile.role.toUpperCase(), icon: <Shield size={14} /> },
                { label: 'Member Since', value: formatDate(profile.createdAt), icon: <Activity size={14} /> },
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

          {/* Recent Tests */}
          {stats && stats.recentAttempts && stats.recentAttempts.length > 0 && (
            <NeonCard variant="default" padding="p-5" className="animate-fade-up">
              <h3 className="font-inter font-semibold text-white mb-4 flex items-center gap-2">
                <Activity size={16} className="text-neon-cyan" /> Recent Tests
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats.recentAttempts.slice(0, 5).map((attempt, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.025] border border-white/5">
                    <div>
                      <p className="text-white/70 text-sm font-inter">{attempt.title || 'Practice Test'}</p>
                      <p className="text-white/20 text-xs font-mono-code mt-0.5">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-neon-cyan font-orbitron font-bold">{attempt.score}%</p>
                      <p className="text-white/20 text-xs font-inter">
                        {attempt.correctCount}/{attempt.totalQuestions}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </NeonCard>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
