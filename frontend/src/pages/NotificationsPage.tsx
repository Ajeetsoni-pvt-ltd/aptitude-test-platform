import { useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import { getMyNotificationsApi, markNotificationAsReadApi, markAllNotificationsAsReadApi } from '@/api/notificationApi';
import { startScheduledTestApi } from '@/api/testApi';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, Zap, Target, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await getMyNotificationsApi();
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
      }
    } catch { /* silent */ }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await markNotificationAsReadApi(id);
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsReadApi();
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch { /* silent */ }
  };

  const handleStartScheduled = async (notificationId: string, test: any) => {
    // Determine runtime status
    const now = Date.now();
    const start = new Date(test.startTime).getTime();
    const end = test.endTime
      ? new Date(test.endTime).getTime()
      : start + test.timeLimit * 60000;
    const status = now < start ? 'locked' : now < end ? 'live' : 'completed';

    if (status === 'locked' || startingTestId) return;
    
    setError(null);
    setStartingTestId(test._id);
    try {
      const res = await startScheduledTestApi(test._id);

      if (res.success && res.data) {
        // Mark as read when starting
        await handleMarkAsRead(notificationId);
        navigate('/test', {
          state: {
            attemptId: res.data.attemptId,
            questions: res.data.questions,
            title: res.data.title,
            totalQuestions: res.data.totalQuestions,
            totalTime: res.data.durationSeconds ?? test.timeLimit * 60,
            isProctored: true,
          },
        });
      } else {
        // Handle API errors (including "already attempted")
        const errorMessage = res.message || 'Failed to start test. Please try again.';
        setError(errorMessage);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start test. Please try again.';
      setError(errorMessage);
      console.error("Failed to start scheduled test", err);
    } finally {
      setStartingTestId(null);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AppLayout>
      <div className="flex items-start justify-between mb-8 animate-fade-up">
        <div>
          <p className="text-white/30 text-sm font-inter uppercase tracking-widest mb-1">Systems</p>
          <h1 className="font-orbitron text-3xl font-bold text-white tracking-wide flex items-center gap-3">
            <Bell size={28} className="text-neon-cyan" />
            Notification <span className="gradient-text-cyan-violet">Center</span>
          </h1>
        </div>
        
        {unreadCount > 0 && (
          <HoloButton 
            variant="cyan" 
            size="sm" 
            onClick={handleMarkAllRead}
            icon={<CheckSquare size={16} />}
          >
            Mark all read
          </HoloButton>
        )}
      </div>

      <NeonCard variant="default" padding="p-6" className="animate-fade-up">
        {isLoading ? (
          <div className="py-16 flex justify-center items-center">
            <LoadingSpinner size="md" label="Loading alerts..." />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
               <Bell size={28} className="text-white/20" />
             </div>
             <p className="text-white/40 font-inter text-sm max-w-sm">
               You don't have any notifications right now. Check back later for updates and test assignments.
             </p>
          </div>
        ) : (
          <div className="space-y-3 lg:space-y-4">
            {/* Error alert for test start failures */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-neon-red/8 border border-neon-red/25 animate-fade-in">
                <AlertCircle size={16} className="text-neon-red flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-neon-red text-sm font-inter leading-snug">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-neon-red/60 hover:text-neon-red transition-colors flex-shrink-0 ml-2"
                >
                  ✕
                </button>
              </div>
            )}

            {notifications.map(n => (
               <div 
                 key={n._id}
                 className={cn(
                   "p-4 rounded-xl border flex items-start gap-4 transition-all duration-300",
                   n.isRead ? "border-white/5 bg-white/[0.02]" : "border-neon-cyan/40 bg-neon-cyan/5 shadow-[0_0_15px_rgba(0,245,255,0.05)]"
                 )}
               >
                 <div className={cn(
                   "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                   n.isRead ? "bg-white/5 text-white/30" : "bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 border border-neon-cyan/30 text-neon-cyan"
                 )}>
                   {n.type === 'test_assigned' ? <Target size={18} /> : <Zap size={18} />}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start gap-2 mb-1">
                     <p className={cn("font-inter outline-none text-sm font-semibold", n.isRead ? "text-white/60" : "text-white")}>
                       {n.title}
                     </p>
                     <span className="text-white/30 text-[10px] uppercase font-mono-code tracking-wider flex-shrink-0">
                       {new Date(n.createdAt).toLocaleDateString()}
                     </span>
                   </div>
                   <p className={cn("text-xs font-inter leading-relaxed", n.isRead ? "text-white/40" : "text-white/70")}>
                     {n.message}
                   </p>
                   
                   {/* Scheduled Test Start Action */}
                   {n.type === 'test_assigned' && n.relatedEntity && (
                     <div className="mt-4 flex items-center gap-3">
                       {(() => {
                         const test = n.relatedEntity;
                         const now = Date.now();
                         const start = new Date(test.startTime).getTime();
                         const end = test.endTime
                           ? new Date(test.endTime).getTime()
                           : start + test.timeLimit * 60000;
                         const isLocked = now < start;
                         const isLive = now >= start && now < end;
                         
                         return (
                           <>
                             {isLocked ? (
                               <span className="flex items-center gap-1.5 text-xs text-neon-amber font-mono-code bg-neon-amber/10 px-2.5 py-1 rounded-md border border-neon-amber/20">
                                 <Lock size={12} /> Starts {new Date(test.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </span>
                             ) : isLive ? (
                               <HoloButton
                                 variant="cyan"
                                 size="sm"
                                 onClick={() => handleStartScheduled(n._id, test)}
                                 loading={startingTestId === test._id}
                                 icon={<Zap size={14} />}
                               >
                                 Start Test Now
                               </HoloButton>
                             ) : (
                               <span className="text-xs text-white/30 font-mono-code bg-white/5 border border-white/10 px-2.5 py-1 rounded-md">
                                 Test Session Ended
                               </span>
                             )}
                           </>
                         )
                       })()}
                     </div>
                   )}
                 </div>
                 
                 {!n.isRead && (
                   <button 
                     onClick={() => handleMarkAsRead(n._id)}
                     className="mt-1 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg border border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
                     title="Mark as read"
                   >
                     <CheckSquare size={14} />
                   </button>
                 )}
               </div>
            ))}
          </div>
        )}
      </NeonCard>
    </AppLayout>
  );
};

export default NotificationsPage;
