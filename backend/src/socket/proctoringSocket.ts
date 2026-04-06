// backend/src/socket/proctoringSocket.ts
// Socket.IO event handlers for live proctoring
// Manages real-time communication between students and admin dashboard

import { Server, Socket } from 'socket.io';
import TestAttempt from '../models/TestAttempt';
import User from '../models/User';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userEmail?: string;
}

export interface ProctoringEventData {
  attemptId: string;
  type: 'tab_switch' | 'face_missing' | 'multiple_faces' | 'fullscreen_exit' | 'screen_capture' | 'copy_paste' | 'camera_feed' | 'other';
  timestamp: Date;
  details?: string;
  frameData?: string; // Base64 image data for camera feed
}

export interface ActiveStudent {
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

// Store active students in memory (in production, use Redis)
const activeStudents = new Map<string, ActiveStudent>();

export const initializeProctoringSocket = (io: Server) => {
  // Create namespaced connection for proctoring
  const proctoringNamespace = io.of('/proctoring');

  // ── Authentication Middleware ──────────────────────────────
  proctoringNamespace.use((socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // ── Connection Handler ─────────────────────────────────────
  proctoringNamespace.on('connection', async (socket: AuthenticatedSocket) => {
    console.log(`[Proctoring] Student connected: ${socket.userId}`);

    // ── Student joins live proctoring ──────────────────────
    socket.on('student:join', async (data: {
      attemptId: string;
      testName: string;
      userName: string;
      userEmail: string;
    }) => {
      try {
        const { attemptId, testName, userName, userEmail } = data;

        // Create/update student entry
        const studentEntry: ActiveStudent = {
          socketId: socket.id,
          userId: socket.userId!,
          name: userName,
          email: userEmail,
          attemptId,
          testName,
          status: 'active',
          joinedAt: new Date(),
          violationCount: 0,
          cameraActive: false,
          faceDetected: false,
          tabSwitchCount: 0,
        };

        activeStudents.set(socket.userId!, studentEntry);
        socket.join(`attempt-${attemptId}`);

        console.log(`[Proctoring] Student ${userName} joined test: ${testName}`);

        // Notify admins of new student
        proctoringNamespace.emit('admin:student:joined', {
          studentId: socket.userId,
          student: studentEntry,
          activeCount: activeStudents.size,
        });

        // Send confirmation
        socket.emit('student:confirmed', { message: 'Joined live proctoring' });
      } catch (error) {
        console.error('[Proctoring] Error in student:join:', error);
        socket.emit('error', 'Failed to join proctoring');
      }
    });

    // ── Receive violation event ────────────────────────────
    socket.on('student:violation', async (data: {
      attemptId: string;
      type: string;
      details?: string;
    }) => {
      try {
        const { attemptId, type, details } = data;
        const student = activeStudents.get(socket.userId!);

        if (!student) {
          return socket.emit('error', 'Student session not found');
        }

        // Update database
        const attempt = await TestAttempt.findById(attemptId);
        if (attempt) {
          attempt.violations.push({
            type: type as any,
            timestamp: new Date(),
            details,
          });
          await attempt.save();
        }

        // Update student status
        student.violationCount++;
        student.lastViolation = type;
        
        // Mark as suspicious after 2+ violations
        if (student.violationCount >= 2) {
          student.status = 'suspicious';
        }

        activeStudents.set(socket.userId!, student);

        // Notify admin dashboard
        proctoringNamespace.emit('admin:violation:logged', {
          studentId: socket.userId,
          student,
          violation: {
            type,
            timestamp: new Date(),
            details,
          },
        });

        console.log(`[Proctoring] Violation logged for ${student.name}: ${type}`);
      } catch (error) {
        console.error('[Proctoring] Error logging violation:', error);
      }
    });

    // ── Receive camera frame from student ──────────────────
    socket.on('student:camera-frame', (data: {
      frameData: string;
      faceDetected: boolean;
    }) => {
      try {
        const student = activeStudents.get(socket.userId!);
        if (student) {
          student.frameData = data.frameData;
          student.faceDetected = data.faceDetected;
          student.cameraActive = true;

          // Stream frame to admins viewing this student
          proctoringNamespace
            .in(`attempt-${student.attemptId}`)
            .emit('admin:camera-frame', {
              studentId: socket.userId,
              frameData: data.frameData,
              faceDetected: data.faceDetected,
            });
        }
      } catch (error) {
        console.error('[Proctoring] Error processing camera frame:', error);
      }
    });

    // ── Tab switch event ───────────────────────────────────
    socket.on('student:tab-switch', (data: { attemptId: string }) => {
      const student = activeStudents.get(socket.userId!);
      if (student) {
        student.tabSwitchCount++;
        activeStudents.set(socket.userId!, student);

        proctoringNamespace.emit('admin:alert', {
          type: 'tab_switch',
          studentId: socket.userId,
          studentName: student.name,
          timestamp: new Date(),
        });
      }
    });

    // ── Admin subscribes to live monitoring ─────────────────
    socket.on('admin:subscribe', () => {
      socket.join('admin');
      
      // Send current active students list
      socket.emit('admin:students:list', {
        students: Array.from(activeStudents.values()),
        count: activeStudents.size,
      });

      console.log(`[Proctoring] Admin connected for monitoring`);
    });

    // ── Admin requests specific student feed ────────────────
    socket.on('admin:watch-student', (data: { studentId: string }) => {
      socket.join(`watching-${data.studentId}`);
      const student = activeStudents.get(data.studentId);
      if (student) {
        socket.emit('admin:student-data', {
          student,
          violations: [], // Would populate from DB
        });
      }
    });

    // ── Disconnect Handler ─────────────────────────────────
    socket.on('disconnect', () => {
      const student = activeStudents.get(socket.userId!);
      if (student) {
        student.status = 'disconnected';
        activeStudents.set(socket.userId!, student);

        proctoringNamespace.emit('admin:student:disconnected', {
          studentId: socket.userId,
          student,
          activeCount: activeStudents.size,
        });

        console.log(`[Proctoring] Student disconnected: ${socket.userId}`);
      }
    });
  });

  return proctoringNamespace;
};

// Helper function to get active students
export const getActiveStudents = (): ActiveStudent[] => {
  return Array.from(activeStudents.values()).filter(s => s.status !== 'disconnected');
};

// Helper function to get student by ID
export const getStudentById = (studentId: string): ActiveStudent | undefined => {
  return activeStudents.get(studentId);
};
