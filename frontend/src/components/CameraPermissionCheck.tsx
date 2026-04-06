// frontend/src/components/CameraPermissionCheck.tsx
// Camera permission check with live preview
// Shows on PreScreen to verify camera is working before test starts

import { useState, useEffect, useRef } from 'react';
import { Camera, CameraOff, CheckCircle2, AlertCircle, AlertTriangle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import HoloButton from '@/components/ui/HoloButton';

interface CameraPermissionCheckProps {
  onCameraReady: (isReady: boolean) => void;
  onError?: (error: string) => void;
}

const CameraPermissionCheck = ({ onCameraReady, onError }: CameraPermissionCheckProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const healthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'checking' | 'ready' | 'error' | 'disconnected'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [streamHealth, setStreamHealth] = useState<'good' | 'degraded' | 'dead'>('good');

  // Check if video stream is actually rendering frames
  const checkStreamHealth = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx || canvas.width === 0 || canvas.height === 0) {
      setStreamHealth('degraded');
      return;
    }

    ctx.drawImage(videoRef.current, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check if all pixels are black (stream not rendering)
    let blackPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) {
        blackPixels++;
      }
    }
    
    const blackRatio = blackPixels / (data.length / 4);
    if (blackRatio > 0.95) {
      setStreamHealth('dead');
    } else {
      setStreamHealth('good');
    }
  };

  const requestCamera = async () => {
    setStatus('checking');
    setErrorMessage(null);

    try {
      // Request camera with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      // Set video element source and wait for it to load
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Video failed to load')), 5000);
          
          videoRef.current!.onloadedmetadata = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          videoRef.current!.onerror = () => {
            clearTimeout(timeout);
            reject(new Error('Video element error'));
          };
        });

        await videoRef.current.play();
      }

      // Start health checks
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
      healthCheckRef.current = setInterval(checkStreamHealth, 1000);

      // Wait a bit then check health
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (streamHealth !== 'good') {
        throw new Error('Camera is not rendering properly. Please check your camera connection and try again.');
      }

      setStatus('ready');
      onCameraReady(true);
    } catch (err) {
      const error = err as Error;
      let message = 'Unknown camera error';

      if (error.name === 'NotAllowedError') {
        message = '🔒 Camera permission denied. Please click "Allow" when your browser asks for camera access.';
      } else if (error.name === 'NotFoundError') {
        message = '📷 No camera found. Please connect a camera to your device and try again.';
      } else if (error.name === 'NotReadableError') {
        message = '⚠️ Camera is in use by another application. Please close other apps using the camera and try again.';
      } else if (error.message.includes('not rendering')) {
        message = '⚠️ Camera is connected but not rendering properly. Please try unplugging and reconnecting your camera.';
      } else {
        message = `Camera error: ${error.message}`;
      }

      setErrorMessage(message);
      setStatus('error');
      onCameraReady(false);
      onError?.(message);
    }
  };

  // Monitor for camera disconnection
  useEffect(() => {
    const handleStreamEnded = () => {
      setStatus('disconnected');
      setErrorMessage('Camera was disconnected. Please reconnect and try again.');
      onCameraReady(false);
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.addEventListener('ended', handleStreamEnded);
      });

      return () => {
        streamRef.current?.getTracks().forEach(track => {
          track.removeEventListener('ended', handleStreamEnded);
        });
      };
    }
  }, [status, onCameraReady]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (healthCheckRef.current) {
        clearInterval(healthCheckRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleRetry = () => {
    stopCamera();
    setTimeout(() => requestCamera(), 1000);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
    }
    setStatus('idle');
    setStreamHealth('good');
  };

  return (
    <div className="w-full max-w-md">
      {/* Status header */}
      <div className="flex items-center gap-2 mb-4">
        {status === 'idle' && <Camera size={18} className="text-white/40" />}
        {status === 'checking' && <Loader size={18} className="text-neon-cyan animate-spin" />}
        {status === 'ready' && <CheckCircle2 size={18} className="text-neon-green" />}
        {(status === 'error' || status === 'disconnected') && <AlertTriangle size={18} className="text-neon-red" />}
        
        <span className={cn(
          'text-sm font-inter font-medium',
          status === 'idle' && 'text-white/60',
          status === 'checking' && 'text-neon-cyan',
          status === 'ready' && 'text-neon-green',
          (status === 'error' || status === 'disconnected') && 'text-neon-red'
        )}>
          {status === 'idle' && 'Camera Required'}
          {status === 'checking' && 'Checking Camera...'}
          {status === 'ready' && 'Camera Ready ✓'}
          {status === 'error' && 'Camera Error'}
          {status === 'disconnected' && 'Camera Disconnected'}
        </span>
      </div>

      {/* Camera preview box */}
      <div className={cn(
        'relative rounded-2xl overflow-hidden border-2 mb-4 transition-all duration-300',
        'shadow-lg',
        status === 'ready'
          ? 'border-neon-green/60 shadow-[0_0_30px_rgba(0,255,136,0.3)] bg-black'
          : (status === 'error' || status === 'disconnected')
          ? 'border-neon-red/60 shadow-[0_0_30px_rgba(255,51,102,0.3)] bg-neon-red/5'
          : status === 'checking'
          ? 'border-neon-cyan/60 shadow-[0_0_30px_rgba(0,245,255,0.3)] bg-black/50'
          : 'border-white/20 bg-cyber-black/50'
      )} style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover',
            status !== 'ready' && 'opacity-50'
          )}
          style={{
            transform: 'scaleX(-1)',
            backgroundColor: '#000000',
            display: status === 'idle' ? 'none' : 'block',
          }}
        />

        {/* Loading state */}
        {status === 'checking' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-3 border-neon-cyan border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-neon-cyan font-inter">Initializing camera...</p>
          </div>
        )}

        {/* Ready state - success indicator */}
        {status === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-neon-green/20 border border-neon-green/60 flex items-center justify-center">
                <CheckCircle2 size={24} className="text-neon-green" />
              </div>
            </div>
          </div>
        )}

        {/* Error/disconnected state */}
        {(status === 'error' || status === 'disconnected') && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 p-4">
            <CameraOff size={32} className="text-neon-red" />
            <p className="text-center text-sm text-neon-red/80 font-inter">
              {status === 'error' ? 'Camera not accessible' : 'Camera disconnected'}
            </p>
          </div>
        )}

        {/* Idle state - hint */}
        {status === 'idle' && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-4">
            <Camera size={32} className="text-white/30" />
            <p className="text-center text-xs text-white/50 font-inter">Click "Check Camera" to start</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl border border-neon-red/40 bg-neon-red/10 flex gap-2">
          <AlertCircle size={16} className="text-neon-red flex-shrink-0 mt-0.5" />
          <p className="text-sm text-white/80 font-inter leading-relaxed">{errorMessage}</p>
        </div>
      )}

      {/* Info message for ready state */}
      {status === 'ready' && (
        <div className="mb-4 p-3 rounded-xl border border-neon-green/40 bg-neon-green/10 flex gap-2">
          <CheckCircle2 size={16} className="text-neon-green flex-shrink-0 mt-0.5" />
          <p className="text-sm text-white/80 font-inter">Camera is working correctly. You may proceed with the test.</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {status === 'idle' && (
          <HoloButton 
            fullWidth 
            onClick={requestCamera}
            className="bg-neon-cyan/20 text-neon-cyan border-neon-cyan/40"
          >
            🎥 Check Camera
          </HoloButton>
        )}

        {(status === 'error' || status === 'disconnected') && (
          <HoloButton 
            fullWidth 
            variant="danger"
            onClick={handleRetry}
          >
            🔄 Retry Camera
          </HoloButton>
        )}

        {status === 'ready' && (
          <button
            disabled
            className="w-full py-2 px-4 rounded-xl bg-neon-green/20 text-neon-green border border-neon-green/40 font-inter font-medium text-sm cursor-default opacity-70"
          >
            ✓ Camera Verified
          </button>
        )}
      </div>

      {/* FYI text */}
      <p className="text-xs text-white/40 font-inter mt-3 text-center leading-relaxed">
        Your camera is required for this proctored test. We need to verify it's working before you start.
      </p>
    </div>
  );
};

export default CameraPermissionCheck;
