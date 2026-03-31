// frontend/src/hooks/useFaceDetection.ts
// Camera stream hook with face detection simulation.
// Face-api.js integration is pre-wired via commented code blocks.
//
// To enable real ML face detection:
//   npm install face-api.js
//   Then uncomment the face-api.js sections below.

import { useState, useEffect, useRef, useCallback } from 'react';

// ── face-api.js integration (COMMENTED — uncomment to enable) ────
// import * as faceapi from 'face-api.js';
// const MODEL_PATH = '/models'; // place face-api models in /public/models/
// let modelsLoaded = false;
// async function loadModels() {
//   if (modelsLoaded) return;
//   await Promise.all([
//     faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_PATH),
//   ]);
//   modelsLoaded = true;
// }

interface UseFaceDetectionReturn {
  videoRef:        React.RefObject<HTMLVideoElement>;
  canvasRef:       React.RefObject<HTMLCanvasElement>;
  isFaceDetected:  boolean;
  isLoading:       boolean;
  cameraError:     string | null;
  startCamera:     () => Promise<boolean>;
  stopCamera:      () => void;
  isActive:        boolean;
}

const FACE_CHECK_INTERVAL = 1500; // ms between simulated face checks

const useFaceDetection = (enabled: boolean): UseFaceDetectionReturn => {
  const videoRef   = useRef<HTMLVideoElement>(null!);
  const canvasRef  = useRef<HTMLCanvasElement>(null!);
  const streamRef  = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isFaceDetected, setIsFaceDetected] = useState(true);
  const [isLoading,      setIsLoading]      = useState(false);
  const [cameraError,    setCameraError]    = useState<string | null>(null);
  const [isActive,       setIsActive]       = useState(false);

  // ── Simulated Face Detection ──────────────────────────────────
  // Simulates looking away (face absent) occasionally.
  // Replace this entire function with face-api.js detection for real ML.
  const runSimulatedDetection = useCallback(() => {
    // With face-api.js:
    // const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());
    // setIsFaceDetected(detections.length > 0);

    // Simulation: treat document hidden or window blur as "face not detected"
    const facePresent = !document.hidden && document.hasFocus();
    setIsFaceDetected(facePresent);
  }, []);

  const startCamera = useCallback(async (): Promise<boolean> => {
    if (!enabled) return false;
    setIsLoading(true);
    setCameraError(null);

    try {
      // ── face-api.js: Load models before starting camera ──────
      // await loadModels();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width:  { ideal: 320 },
          height: { ideal: 240 },
          facingMode: 'user',
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);

      // ── Start periodic face detection ─────────────────────
      faceCheckRef.current = setInterval(runSimulatedDetection, FACE_CHECK_INTERVAL);

      // ── face-api.js: Replace interval with requestAnimationFrame loop:
      // const detectLoop = async () => {
      //   if (!videoRef.current || !isActiveRef.current) return;
      //   const detections = await faceapi.detectAllFaces(
      //     videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
      //   );
      //   setIsFaceDetected(detections.length > 0);
      //   intervalRef.current = setTimeout(detectLoop, 800) as any;
      // };
      // detectLoop();

      return true;

    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access for proctored mode.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera for proctored mode.');
      } else {
        setCameraError('Camera failed to start: ' + error.message);
      }
      setIsActive(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [enabled, runSimulatedDetection]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (faceCheckRef.current) {
      clearInterval(faceCheckRef.current);
      faceCheckRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsActive(false);
    setIsFaceDetected(true);
    setCameraError(null);
  }, []);

  // ── Cleanup on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // ── Start/stop based on enabled prop ─────────────────────────
  useEffect(() => {
    if (!enabled) {
      stopCamera();
    }
  }, [enabled, stopCamera]);

  return {
    videoRef,
    canvasRef,
    isFaceDetected,
    isLoading,
    cameraError,
    startCamera,
    stopCamera,
    isActive,
  };
};

export default useFaceDetection;
