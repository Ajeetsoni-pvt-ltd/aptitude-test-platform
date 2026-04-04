import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { cn } from '@/lib/utils';
import { getAllScheduledTestsApi } from '@/api/scheduledApi';
import {
  Plus,
  Trash2,
  Eye,
  Edit2,
  Clock,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Lock,
  TrendingUp,
} from 'lucide-react';

interface ScheduledTest {
  _id: string;
  title: string;
  testCode?: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  timeLimit: number;
  maxAttempts?: number;
  startTime: string;
  endTime?: string;
  status: 'locked' | 'live' | 'completed';
  assignedStudents: string[];
  customQuestions?: string[];
  createdAt: string;
  updatedAt: string;
}

type SortKey = 'title' | 'startTime' | 'status' | 'assignedStudents';

const getStatusBadge = (status: string) => {
  const configs: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
    locked: {
      label: 'Locked',
      icon: <Lock className="w-3 h-3" />,
      cls: 'border-neon-amber/40 bg-neon-amber/10 text-neon-amber',
    },
    live: {
      label: 'Live',
      icon: <Zap className="w-3 h-3" />,
      cls: 'border-neon-green/40 bg-neon-green/10 text-neon-green',
    },
    completed: {
      label: 'Completed',
      icon: <CheckCircle2 className="w-3 h-3" />,
      cls: 'border-white/15 bg-white/5 text-white/40',
    },
  };

  const config = configs[status] || configs.locked;

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-medium', config.cls)}>
      {config.icon}
      {config.label}
    </span>
  );
};

const ManageTestsPage = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<ScheduledTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('startTime');
  const [filterStatus, setFilterStatus] = useState<'all' | 'locked' | 'live' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch tests
  useEffect(() => {
    const fetchTests = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await getAllScheduledTestsApi();
        if (response.success && response.data) {
          setTests(response.data);
        } else {
          setError('Failed to load tests');
        }
      } catch (err) {
        setError(`Error loading tests: ${(err as Error).message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  // Filter and sort tests
  const filteredTests = tests
    .filter(test => {
      const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.testCode?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || test.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'startTime':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'assignedStudents':
          return b.assignedStudents.length - a.assignedStudents.length;
        default:
          return 0;
      }
    });

  // Handle delete
  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    setDeletingId(testId);
    try {
      // Note: deleteScheduledTestApi needs to be imported/created if it doesn't exist
      // For now, we'll show a message
      setError('Delete functionality coming soon');
    } catch (err) {
      setError(`Error deleting test: ${(err as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    total: tests.length,
    live: tests.filter(t => t.status === 'live').length,
    locked: tests.filter(t => t.status === 'locked').length,
    completed: tests.filter(t => t.status === 'completed').length,
    totalStudents: tests.reduce((sum, t) => sum + t.assignedStudents.length, 0),
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-void via-void-dark to-black relative overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-magenta/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-mono bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-violet bg-clip-text text-transparent mb-2">
                Manage Tests
              </h1>
              <p className="text-white/50 font-inter text-sm md:text-base">
                Create and manage full-length scheduled tests
              </p>
            </div>

            <HoloButton
              onClick={() => navigate('/admin/create-test')}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Create Test
            </HoloButton>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
                ✕
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-neon-green text-sm">{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="text-neon-green hover:text-neon-green/70">
                ✕
              </button>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Tests', value: stats.total, color: 'neon-cyan', icon: TrendingUp },
              { label: 'Live Now', value: stats.live, color: 'neon-green', icon: Zap },
              { label: 'Locked', value: stats.locked, color: 'neon-amber', icon: Lock },
              { label: 'Completed', value: stats.completed, color: 'white', icon: CheckCircle2 },
              { label: 'Students', value: stats.totalStudents, color: 'neon-magenta', icon: Users },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <NeonCard key={i} className="p-4">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 text-${stat.color}`} />
                    <div>
                      <p className="text-white/60 text-xs">{stat.label}</p>
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                    </div>
                  </div>
                </NeonCard>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div className="mb-8 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title or test code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-neon-cyan/50 transition-all"
              />
            </div>

            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
            >
              <option value="all">All Status</option>
              <option value="locked">Locked</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortKey)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
            >
              <option value="startTime">Sort by Start Time</option>
              <option value="title">Sort by Title</option>
              <option value="status">Sort by Status</option>
              <option value="assignedStudents">Sort by Student Count</option>
            </select>
          </div>

          {/* Tests List */}
          {isLoading ? (
            <NeonCard className="p-12 text-center">
              <p className="text-white/50">Loading tests...</p>
            </NeonCard>
          ) : filteredTests.length === 0 ? (
            <NeonCard className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/50 mb-6">No tests found</p>
              <p className="text-white/30 text-sm mb-6">Create your first full-length test to get started</p>
              <HoloButton onClick={() => navigate('/admin/create-test')}>
                <Plus className="w-4 h-4" />
                Create Test
              </HoloButton>
            </NeonCard>
          ) : (
            <div className="space-y-4">
              {filteredTests.map(test => (
                <NeonCard key={test._id} className="p-6 hover:border-neon-cyan/50 transition-colors group cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{test.title}</h3>
                        {getStatusBadge(test.status)}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        {test.testCode && (
                          <div>
                            <p className="text-white/40 text-xs">Test Code</p>
                            <p className="text-white/80 font-mono">{test.testCode}</p>
                          </div>
                        )}

                        <div>
                          <p className="text-white/40 text-xs">Questions</p>
                          <p className="text-white/80 font-bold">{test.questionCount}</p>
                        </div>

                        <div>
                          <p className="text-white/40 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Duration
                          </p>
                          <p className="text-white/80">{test.timeLimit} mins</p>
                        </div>

                        <div>
                          <p className="text-white/40 text-xs">Max Attempts</p>
                          <p className="text-white/80 font-bold">{test.maxAttempts || 1}</p>
                        </div>

                        <div>
                          <p className="text-white/40 text-xs flex items-center gap-1">
                            <Users className="w-3 h-3" /> Students
                          </p>
                          <p className="text-white/80 font-bold">{test.assignedStudents.length}</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs text-white/50">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(test.startTime).toLocaleString('en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </div>
                        {test.endTime && (
                          <div className="flex items-center gap-1">
                            to{' '}
                            {new Date(test.endTime).toLocaleString('en-US', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {}}
                        className="p-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-neon-cyan" />
                      </button>

                      <button
                        onClick={() => {}}
                        className="p-2 bg-neon-violet/10 hover:bg-neon-violet/20 border border-neon-violet/20 rounded-lg transition-colors"
                        title="Edit Test"
                      >
                        <Edit2 className="w-4 h-4 text-neon-violet" />
                      </button>

                      <button
                        onClick={() => handleDelete(test._id)}
                        disabled={deletingId === test._id}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete Test"
                      >
                        <Trash2 className={cn('w-4 h-4 text-red-400', deletingId === test._id && 'animate-spin')} />
                      </button>
                    </div>
                  </div>
                </NeonCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ManageTestsPage;
