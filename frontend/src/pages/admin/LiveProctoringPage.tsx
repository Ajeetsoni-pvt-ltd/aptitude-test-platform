// frontend/src/pages/admin/LiveProctoringPage.tsx
// Real-time live proctoring dashboard with WebSocket support
// Monitors students during tests in real-time

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import AdminLayout from '@/components/AdminLayout';
import { proctoringSocket } from '@/services/proctoringSocket';
import { cn } from '@/lib/utils';
import apiClient from '@/api/axios';
import {
  AlertTriangle, Shield, Clock, User, Monitor, 
  CheckCircle2, Camera, CameraOff,
  X, Search, AlertCircle, Activity,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface ActiveStudent {
  socketId: string;
  userId: string;
  name: string;
  email: string;
  attemptId: string;
  testName: string;
  status: 'active' | 'suspicious' | 'disconnected';
  joinedAt: Date;
  violationCount: number;
  lastViolation?: string;
  cameraActive: boolean;
  frameData?: string;
  faceDetected: boolean;
  tabSwitchCount: number;
}

// ── Student Card Component ─────────────────────────────────────
const StudentCard = ({ student, onSelect }: {
  student: ActiveStudent;
  onSelect: (student: ActiveStudent) => void;
}) => {
  const isSuspicious = student.status === 'suspicious';
  const isDisconnected = student.status === 'disconnected';
  const timeSpent = Math.floor((Date.now() - new Date(student.joinedAt).getTime()) / 60000);

  return (
    <div
      className={cn(
        'rounded-2xl border overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer group',
        isSuspicious && 'border-neon-red/40 bg-neon-red/5 shadow-[0_0_20px_rgba(255,0,50,0.2)]',
        !isSuspicious && !isDisconnected && 'border-neon-cyan/20 bg-neon-cyan/5',
        isDisconnected && 'border-white/10 bg-white/5 opacity-60'
      )}
      onClick={() => onSelect(student)}
    >
      {/* Camera area */}
      <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden">
        {student.frameData && student.cameraActive ? (
          <img
            src={student.frameData}
            alt={student.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-white/20">
            <div className={cn(
              'w-16 h-16 rounded-full border-2 flex items-center justify-center',
              student.cameraActive ? 'border-white/20 bg-white/5' : 'border-white/10 bg-white/3'
            )}>
              <User size={28} className="text-white/30" />
            </div>
            <p className="text-xs font-inter text-white/30">{student.name.split(' ')[0]}</p>
          </div>
        )}

        {/* Status indicators */}
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-inter">
          <div className={cn(
            'w-2 h-2 rounded-full animate-pulse',
            isSuspicious ? 'bg-neon-red' : 'bg-neon-green'
          )} />
          <span className="text-white">{isSuspicious ? 'ALERT' : 'LIVE'}</span>
        </div>

        {/* Violation count */}
        {student.violationCount > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full bg-neon-red/90 text-white text-[10px] font-bold animate-pulse">
            <AlertTriangle size={10} />
            {student.violationCount}
          </div>
        )}

        {/* Camera status */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] px-2 py-1 rounded-full bg-black/60 text-white font-inter">
          {student.faceDetected ? (
            <>
              <div className="w-1 h-1 rounded-full bg-neon-green" />
              Face OK
            </>
          ) : (
            <>
              <div className="w-1 h-1 rounded-full bg-neon-amber" />
              No Face
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-inter font-semibold text-white/85 text-sm truncate">{student.name}</p>
        <p className="text-white/30 text-xs font-inter truncate">{student.testName}</p>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/30 text-[10px] font-inter flex items-center gap-1">
            <Clock size={10} />
            {timeSpent}m
          </span>
          <span className={cn(
            'text-[10px] font-bold font-inter px-2 py-1 rounded-full',
            student.violationCount === 0 ? 'text-neon-green bg-neon-green/10' : 
            student.violationCount <= 2 ? 'text-neon-amber bg-neon-amber/10' : 
            'text-neon-red bg-neon-red/10'
          )}>
            {student.violationCount === 0 ? '✓ Safe' : `${student.violationCount} alerts`}
          </span>
        </div>
      </div>
    </div>
  );
};

// ── Detail Modal ───────────────────────────────────────────────
const StudentDetail = ({ student, onClose }: {
  student: ActiveStudent | null;
  onClose: () => void;
}) => {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-end" onClick={onClose}>
      <div
        className="glass-strong rounded-t-2xl border border-neon-violet/20 w-full max-w-2xl max-h-[80vh] overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <User size={20} className="text-white/40" />
            </div>
            <div>
              <p className="font-inter font-semibold text-white">{student.name}</p>
              <p className="text-white/30 text-xs font-inter">{student.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5">
            <X size={18} className="text-white/40" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 flex-1">
          {/* Test Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-white/40 text-xs font-inter uppercase tracking-widest mb-2">Test</p>
              <p className="font-inter font-semibold text-white">{student.testName}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-white/40 text-xs font-inter uppercase tracking-widest mb-2">Status</p>
              <p className={cn(
                'font-inter font-semibold',
                student.status === 'active' && 'text-neon-green',
                student.status === 'suspicious' && 'text-neon-red',
                student.status === 'disconnected' && 'text-white/30'
              )}>
                {student.status.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Violation Details */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-white/40 text-xs font-inter uppercase tracking-widest mb-3">Violations ({student.violationCount})</p>
            {student.violationCount === 0 ? (
              <div className="flex items-center gap-2 text-neon-green text-sm">
                <CheckCircle2 size={16} />
                <span className="font-inter">No violations</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-inter">
                  <span className="text-white/30">Total Violations</span>
                  <span className="text-neon-red font-semibold">{student.violationCount}</span>
                </div>
                <div className="flex justify-between text-xs font-inter">
                  <span className="text-white/30">Tab Switches</span>
                  <span className="text-neon-amber">{student.tabSwitchCount}</span>
                </div>
                {student.lastViolation && (
                  <div className="flex justify-between text-xs font-inter">
                    <span className="text-white/30">Last Violation</span>
                    <span className="text-neon-amber">{student.lastViolation}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Camera Feed */}
          {student.frameData && (
            <div className="rounded-xl overflow-hidden border border-white/5">
              <img
                src={student.frameData}
                alt="Camera feed"
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Camera Status */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            {student.cameraActive ? (
              <>
                <Camera size={18} className="text-neon-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-inter font-semibold text-white">Camera Active</p>
                  <p className="text-white/30 text-xs font-inter mt-1">
                    {student.faceDetected 
                      ? '✓ Face detected in frame' 
                      : '⚠️ No face detected - potential issue'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <CameraOff size={18} className="text-white/30 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-inter font-semibold text-white">Camera Inactive</p>
                  <p className="text-white/30 text-xs font-inter mt-1">Camera feed is not available</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────
const LiveProctoringPage = () => {
  const { user, isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<ActiveStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ActiveStudent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ActiveStudent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspicious'>('all');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLoadingOldData, setIsLoadingOldData] = useState(true);

  // Fallback HTTP polling
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    const fetchActiveTests = async () => {
      try {
        const res = await apiClient.get('/proctoring/active');
        if (res.data.success && res.data.data.activeTests) {
          const tests = res.data.data.activeTests;
          // Convert old format to new format
          const converted = tests.map((t: any) => ({
            socketId: t._id,
            userId: t.user._id,
            name: t.user.name,
            email: t.user.email,
            attemptId: t._id,
            testName: t.title,
            status: t.violations.length >= 2 ? 'suspicious' : 'active',
            joinedAt: t.createdAt,
            violationCount: t.violations.length,
            cameraActive: true,
            faceDetected: true,
            tabSwitchCount: 0,
          }));
          setStudents(converted);
          setLastUpdate(new Date());
        }
      } catch (error) {
        console.error('[Proctoring] Fetch failed:', error);
      } finally {
        setIsLoadingOldData(false);
      }
    };

    fetchActiveTests();
    const interval = setInterval(fetchActiveTests, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.role]);

  // Socket.IO connection
  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') return;

    const connectSocket = async () => {
      try {
        const token = localStorage.getItem('apt_token');
        if (!token) return;

        await proctoringSocket.connect(token);
        setIsConnected(true);

        proctoringSocket.subscribeToMonitoring();

        proctoringSocket.on('admin:students:list', (data: any) => {
          setStudents(data.students || []);
          setLastUpdate(new Date());
        });

        proctoringSocket.on('admin:student:joined', (data: any) => {
          setStudents((prev) => [...prev, data.student]);
          setLastUpdate(new Date());
        });

        proctoringSocket.on('admin:violation:logged', (data: any) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.userId === data.studentId ? { ...s, ...data.student } : s
            )
          );
      setLastUpdate(new Date());
        });
      } catch (error) {
        console.error('[Proctoring] Socket failed:', error);
      }
    };

    connectSocket();
    return () => proctoringSocket.disconnect();
  }, [isAuthenticated, user?.role]);

  // Filter students
  useEffect(() => {
    let filtered = students;

    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.testName.toLowerCase().includes(query)
      );
    }

    setFilteredStudents(filtered);
  }, [students, searchQuery, statusFilter]);

  const stats = {
    total: students.length,
    active: students.filter((s) => s.status === 'active').length,
    suspicious: students.filter((s) => s.status === 'suspicious').length,
    totalViolations: students.reduce((sum, s) => sum + s.violationCount, 0),
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto text-center py-20">
          <AlertCircle size={32} className="text-neon-red mx-auto mb-3" />
          <p className="text-white/30 font-inter">Access denied. Admin only.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <AdminLayout>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-white/30 text-xs font-inter uppercase tracking-widest mb-1">Admin Dashboard</p>
              <h1 className="font-orbitron text-2xl font-bold text-white">
                Live <span className="gradient-text-cyan-violet">Proctoring</span>
              </h1>
              <p className="text-white/30 text-xs font-inter mt-2 flex items-center gap-2">
                <span className={cn(
                  'w-2 h-2 rounded-full inline-block',
                  isConnected ? 'bg-neon-green animate-pulse' : 'bg-neon-amber'
                )} />
                {isConnected ? 'Real-time (WebSocket)' : 'Polling (HTTP)'}
                {lastUpdate && ` • ${lastUpdate.toLocaleTimeString()}`}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Students', value: stats.total, color: 'cyan', icon: <Monitor size={16} className="text-neon-cyan" /> },
              { label: 'Active', value: stats.active, color: 'green', icon: <Activity size={16} className="text-neon-green" /> },
              { label: 'Alerts', value: stats.suspicious, color: 'red', icon: <AlertTriangle size={16} className="text-neon-red" /> },
              { label: 'Violations', value: stats.totalViolations, color: 'amber', icon: <Shield size={16} className="text-neon-amber" /> },
            ].map((s) => (
              <div
                key={s.label}
                className={cn(
                  'neon-card p-4 flex items-center gap-2',
                  s.color
                )}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', `bg-neon-${s.color}/10 border border-neon-${s.color}/20`)}>
                  {s.icon}
                </div>
                <div>
                  <p className={cn('font-orbitron text-lg font-bold', `text-neon-${s.color}`)}>{s.value}</p>
                  <p className="text-white/30 text-[10px] font-inter">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Search by name, email, or test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-cyan/40 text-sm font-inter"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm font-inter focus:outline-none focus:border-neon-cyan/40"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspicious">Suspicious</option>
            </select>
          </div>

          {/* Student Grid */}
          {isLoadingOldData ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-white/5 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-white/[0.03]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-white/5 rounded w-3/4" />
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-20">
              <Camera size={32} className="text-white/10 mx-auto mb-3" />
              <p className="text-white/30 font-inter">
                {students.length === 0 ? 'No active tests' : 'No students match filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredStudents.map((student) => (
                <StudentCard
                  key={student.userId}
                  student={student}
                  onSelect={setSelectedStudent}
                />
              ))}
            </div>
          )}
        </div>
      </AdminLayout>

      {/* Detail Modal */}
      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </>
  );
};

export default LiveProctoringPage;
