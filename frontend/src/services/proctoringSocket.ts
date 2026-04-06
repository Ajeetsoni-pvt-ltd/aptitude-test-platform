// frontend/src/services/proctoringSocket.ts
// Socket.IO client for real-time live proctoring

import { io, Socket } from 'socket.io-client';

class ProctoringSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverUrl = import.meta.env.VITE_API_BASE_URL
        ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
        : 'http://localhost:5000';

      try {
        this.socket = io(`${serverUrl}/proctoring`, {
          auth: { token },
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          console.log('[Proctoring] Connected to server');
          this.emit('connected');
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('[Proctoring] Disconnected from server');
          this.emit('disconnected');
        });

        this.socket.on('error', (error) => {
          console.error('[Proctoring] Socket error:', error);
          this.emit('error', error);
          reject(error);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Proctoring] Connection error:', error);
          reject(error);
        });
      } catch (error) {
        console.error('[Proctoring] Failed to connect:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // ── Student event methods ──────────────────────────────────
  studentJoin(attemptId: string, testName: string, userName: string, userEmail: string) {
    this.emit('student:join', { attemptId, testName, userName, userEmail });
  }

  logViolation(attemptId: string, type: string, details?: string) {
    this.emit('student:violation', { attemptId, type, details });
  }

  sendCameraFrame(frameData: string, faceDetected: boolean) {
    if (this.socket) {
      this.socket.emit('student:camera-frame', { frameData, faceDetected });
    }
  }

  reportTabSwitch(attemptId: string) {
    this.emit('student:tab-switch', { attemptId });
  }

  // ── Admin event methods ────────────────────────────────────
  subscribeToMonitoring() {
    this.emit('admin:subscribe');
  }

  watchStudent(studentId: string) {
    this.emit('admin:watch-student', { studentId });
  }

  // ── Event listeners ────────────────────────────────────────
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);

      // Set up socket listener for this event
      if (this.socket) {
        this.socket.on(event, (data) => {
          const callbacks = this.listeners.get(event) || [];
          callbacks.forEach(cb => cb(data));
        });
      }
    }

    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    } else {
      console.warn(`[Proctoring] Socket not connected, cannot emit ${event}`);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const proctoringSocket = new ProctoringSocketService();
