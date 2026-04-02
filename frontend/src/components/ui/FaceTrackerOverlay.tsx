// frontend/src/components/ui/FaceTrackerOverlay.tsx
// Floating camera preview + full-screen red holographic warning
// when face is not detected in proctored mode.

import { Camera, AlertTriangle, Eye, EyeOff, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaceTrackerOverlayProps {
  videoRef:       React.RefObject<HTMLVideoElement>;
  isFaceDetected: boolean;
  isActive:       boolean;
  cameraError:    string | null;
  isLoading:      boolean;
  tabSwitchCount: number;
  maxTabSwitches: number;
}

const FaceTrackerOverlay = ({
  videoRef,
  isFaceDetected,
  isActive,
  cameraError,
  isLoading,
  tabSwitchCount,
  maxTabSwitches,
}: FaceTrackerOverlayProps) => {
  const warningIntensity = !isFaceDetected && isActive;

  return (
    <>
      {/* ── Full-screen Face Warning Overlay ─────────────────── */}
      {warningIntensity && (
        <div
          className="fixed inset-0 z-[80] pointer-events-none"
          style={{
            animation: 'face-warning-pulse 1s ease-in-out infinite',
          }}
        >
          {/* Red pulsing border */}
          <div className="absolute inset-0 border-4 border-neon-red/80 rounded-none"
            style={{ boxShadow: 'inset 0 0 80px rgba(255,51,102,0.3), 0 0 80px rgba(255,51,102,0.3)' }} />

          {/* Scanlines overlay */}
          <div className="absolute inset-0"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,51,102,0.04) 2px, rgba(255,51,102,0.04) 4px)',
            }} />

          {/* Center warning message */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <div
              className="glass-strong border border-neon-red/50 rounded-2xl px-8 py-6"
              style={{ boxShadow: '0 0 60px rgba(255,51,102,0.4)' }}
            >
              <div className="flex items-center justify-center mb-3">
                <EyeOff size={36} className="text-neon-red" style={{ filter: 'drop-shadow(0 0 10px rgba(255,51,102,0.9))' }} />
              </div>
              <p className="font-orbitron text-2xl font-bold text-neon-red mb-1"
                style={{ textShadow: '0 0 20px rgba(255,51,102,0.9)' }}>
                FACE NOT DETECTED
              </p>
              <p className="font-inter text-sm text-white/60">
                Please look at the camera to continue
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Floating Camera Preview (bottom-right) ──────────── */}
      <div className="fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-2">

        {/* Tab switch counter */}
        {tabSwitchCount > 0 && (
          <div className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono-code font-bold',
            'border animate-neon-pulse',
            tabSwitchCount >= maxTabSwitches - 1
              ? 'bg-neon-red/20 border-neon-red/50 text-neon-red'
              : 'bg-neon-amber/20 border-neon-amber/50 text-neon-amber'
          )}>
            <AlertTriangle size={12} />
            {tabSwitchCount}/{maxTabSwitches} switches
          </div>
        )}

        {/* Camera box */}
        <div
          className={cn(
            'relative rounded-2xl overflow-hidden border-2 transition-all duration-300',
            'shadow-lg',
            isActive && isFaceDetected
              ? 'border-neon-green/60 shadow-[0_0_20px_rgba(0,255,136,0.3)]'
              : isActive && !isFaceDetected
              ? 'border-neon-red/60 shadow-[0_0_20px_rgba(255,51,102,0.4)] animate-neon-pulse'
              : 'border-white/15'
          )}
          style={{ width: 160, height: 120 }}
        >
          {/* Video feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{
              transform: 'scaleX(-1)',
              filter: isActive && !isFaceDetected ? 'hue-rotate(300deg) saturate(2)' : 'none',
              backgroundColor: '#000000',
            }}
          />

          {/* Overlay when loading */}
          {isLoading && (
            <div className="absolute inset-0 bg-cyber-black/90 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Overlay when camera error */}
          {cameraError && !isLoading && (
            <div className="absolute inset-0 bg-cyber-black/90 flex flex-col items-center justify-center gap-1 p-2">
              <WifiOff size={20} className="text-neon-red" />
              <p className="text-[9px] text-neon-red/80 text-center font-inter leading-tight">Camera unavailable</p>
            </div>
          )}

          {/* Overlay when inactive */}
          {!isActive && !isLoading && !cameraError && (
            <div className="absolute inset-0 bg-cyber-black/90 flex items-center justify-center">
              <Camera size={24} className="text-white/20" />
            </div>
          )}

          {/* Face detection indicator (top-left) */}
          {isActive && (
            <div className="absolute top-1.5 left-1.5 flex items-center gap-1">
              <div className={cn(
                'w-2 h-2 rounded-full',
                isFaceDetected ? 'bg-neon-green animate-neon-pulse' : 'bg-neon-red animate-neon-pulse'
              )} />
              <span className="text-[8px] font-mono-code text-white/60">
                {isFaceDetected ? 'FACE OK' : 'NO FACE'}
              </span>
            </div>
          )}

          {/* Corner scanning animation */}
          {isActive && isFaceDetected && (
            <>
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-neon-green/80" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-neon-green/80" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-neon-green/80" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-neon-green/80" />
            </>
          )}

          {/* PROCTORED label */}
          <div className="absolute bottom-1.5 right-1.5">
            <span className="text-[7px] font-orbitron text-neon-cyan/60 uppercase tracking-widest">
              PROCTORED
            </span>
          </div>
        </div>

        {/* Status label */}
        <div className="flex items-center gap-1.5">
          {isActive ? (
            isFaceDetected
              ? <Eye size={10} className="text-neon-green" />
              : <EyeOff size={10} className="text-neon-red" />
          ) : (
            <Camera size={10} className="text-white/20" />
          )}
          <span className={cn(
            'text-[9px] font-mono-code',
            isActive && isFaceDetected ? 'text-neon-green/70'
            : isActive ? 'text-neon-red/70'
            : 'text-white/20'
          )}>
            {isLoading ? 'INITIALIZING...'
              : cameraError ? 'CAM ERR'
              : isActive && isFaceDetected ? 'FACE DETECTED'
              : isActive ? 'FACE MISSING'
              : 'CAM OFFLINE'}
          </span>
        </div>
      </div>
    </>
  );
};

export default FaceTrackerOverlay;
