/**
 * Bartimaeus Resource Centre - Accessible Typing Application
 * Production Express Backend API & Cloud Server (Render-Ready)
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Data directory paths for persistent file-based JSON database
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ASSIGNMENTS_FILE = path.join(DATA_DIR, 'assignments.json');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Global Security & Performance Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// -----------------------------------------------------------------------------
// Data Access Helper Functions
// -----------------------------------------------------------------------------

function readJSONFile(filePath, fallbackData = []) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallbackData, null, 2), 'utf8');
      return fallbackData;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallbackData;
  }
}

function writeJSONFile(filePath, data) {
  try {
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Initial Data Seeding
const INITIAL_USERS = [
  {
    id: 'teacher-admin',
    name: 'Bartimaeus Instructor',
    role: 'Teacher',
    password: 'admin',
    email: 'trainer@bartimaeus.org',
    notes: 'Senior Assistive Technology Specialist & Lead Typing Instructor',
    createdAt: '2026-08-19',
  },
  {
    id: 'student-demo',
    name: 'Aarav Sharma',
    role: 'Student',
    password: 'student',
    email: 'aarav@bartimaeus.student',
    notes: 'Grade 9 - NVDA Screen Reader User',
    createdAt: '2026-08-19',
  },
];

function getUsers() {
  return readJSONFile(USERS_FILE, INITIAL_USERS);
}

function saveUsers(users) {
  return writeJSONFile(USERS_FILE, users);
}

function getAssignments() {
  return readJSONFile(ASSIGNMENTS_FILE, []);
}

function saveAssignments(assignments) {
  return writeJSONFile(ASSIGNMENTS_FILE, assignments);
}

function getProgress() {
  return readJSONFile(PROGRESS_FILE, []);
}

function saveProgress(progress) {
  return writeJSONFile(PROGRESS_FILE, progress);
}

// -----------------------------------------------------------------------------
// REST API Endpoints
// -----------------------------------------------------------------------------

/**
 * Health check & platform metrics (used by Render health monitor)
 */
app.get('/api/health', (req, res) => {
  const users = getUsers();
  const assignments = getAssignments();
  res.json({
    status: 'healthy',
    institution: 'Bartimaeus Resource Centre',
    uptimeSeconds: Math.floor(process.uptime()),
    studentsCount: users.filter((u) => u.role === 'Student').length,
    assignmentsCount: assignments.length,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/**
 * Register New Student Account (First Launch Setup)
 */
app.post('/api/auth/register', (req, res) => {
  const { name, password, role = 'Student', notes, teacherPasscode } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' });
  }
  if (!password || password.trim().length < 3) {
    return res.status(400).json({ error: 'Password must be at least 3 characters' });
  }

  // Teacher role verification
  let assignedRole = 'Student';
  if (role === 'Teacher') {
    if (teacherPasscode !== 'bartimaeus2026' && teacherPasscode !== 'admin') {
      return res.status(403).json({ error: 'Invalid Teacher Access Passcode' });
    }
    assignedRole = 'Teacher';
  }

  const users = getUsers();
  const normalizedName = name.trim().toLowerCase();

  const existing = users.find((u) => u.name.trim().toLowerCase() === normalizedName);
  if (existing) {
    return res.status(400).json({ error: 'An account with this name already exists. Please log in.' });
  }

  const newUser = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    role: assignedRole,
    password: password.trim(),
    notes: notes?.trim() || `${assignedRole} registered on ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  // Return user without password
  const { password: _, ...safeUser } = newUser;
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    user: safeUser,
  });
});

/**
 * Login Student or Teacher
 */
app.post('/api/auth/login', (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Please enter both name and password' });
  }

  const users = getUsers();
  const normalizedName = name.trim().toLowerCase();

  const user = users.find(
    (u) => u.name.trim().toLowerCase() === normalizedName && u.password === password.trim()
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid name or password. Please check your credentials.' });
  }

  user.lastLogin = new Date().toISOString();
  saveUsers(users);

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    user: safeUser,
  });
});

/**
 * Get Curriculum / Assignments (Ordered sequentially)
 */
app.get('/api/curriculum', (req, res) => {
  const assignments = getAssignments();
  // Sort by orderIndex ascending
  const sorted = assignments.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  res.json({ assignments: sorted });
});

/**
 * Sync / Seed Curriculum (Teacher or Initial setup)
 */
app.post('/api/curriculum/sync', (req, res) => {
  const { assignments } = req.body;
  if (!Array.isArray(assignments)) {
    return res.status(400).json({ error: 'Expected array of assignments' });
  }
  saveAssignments(assignments);
  res.json({ success: true, count: assignments.length });
});

/**
 * Get Student Progress & Unlocked Status
 */
app.get('/api/progress/:studentId', (req, res) => {
  const { studentId } = req.params;
  const allProgress = getProgress();
  const studentRecords = allProgress.filter((p) => p.studentId === studentId);
  res.json({ progress: studentRecords });
});

/**
 * Record Exercise Attempt (Calculates Sequential Progression)
 */
app.post('/api/progress', (req, res) => {
  const record = req.body;

  if (!record.studentId || !record.assignmentId) {
    return res.status(400).json({ error: 'studentId and assignmentId are required' });
  }

  const allProgress = getProgress();
  const newRecord = {
    id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...record,
    timestamp: record.timestamp || new Date().toISOString(),
  };

  allProgress.unshift(newRecord);
  saveProgress(allProgress);

  res.status(201).json({ success: true, record: newRecord });
});

/**
 * Instructor API: Get All Enrolled Students & Summary Analytics
 */
app.get('/api/teacher/students', (req, res) => {
  const users = getUsers();
  const progressList = getProgress();
  const assignments = getAssignments();

  const students = users
    .filter((u) => u.role === 'Student')
    .map((s) => {
      const studentProgress = progressList.filter((p) => p.studentId === s.id);
      const completedRecords = studentProgress.filter((p) => p.completed);
      const avgAccuracy =
        studentProgress.length > 0
          ? Math.round(studentProgress.reduce((acc, c) => acc + c.accuracy, 0) / studentProgress.length)
          : 0;
      const maxWpm = studentProgress.length > 0 ? Math.max(...studentProgress.map((p) => p.wpm)) : 0;
      const totalTimeSecs = studentProgress.reduce((acc, c) => acc + c.timeSpent, 0);

      const { password: _, ...safeStudent } = s;
      return {
        ...safeStudent,
        totalAttempts: studentProgress.length,
        completedLessonsCount: completedRecords.length,
        avgAccuracy,
        maxWpm,
        totalTimeMinutes: Math.round(totalTimeSecs / 60),
      };
    });

  res.json({ students, assignmentsCount: assignments.length, totalProgressRecords: progressList.length });
});

/**
 * Instructor API: Reset Student Password
 */
app.post('/api/teacher/students/reset-password', (req, res) => {
  const { studentId, newPassword } = req.body;
  if (!studentId || !newPassword) {
    return res.status(400).json({ error: 'studentId and newPassword are required' });
  }

  const users = getUsers();
  const student = users.find((u) => u.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  student.password = newPassword.trim();
  saveUsers(users);

  res.json({ success: true, message: `Password reset successfully for ${student.name}` });
});

/**
 * Instructor API: Save or Update Assignment
 */
app.post('/api/teacher/assignments', (req, res) => {
  const assignment = req.body;
  if (!assignment.title || !assignment.drills || !assignment.drills.length) {
    return res.status(400).json({ error: 'Assignment title and drills are required' });
  }

  const assignments = getAssignments();
  const index = assignments.findIndex((a) => a.id === assignment.id);

  if (index >= 0) {
    assignments[index] = { ...assignments[index], ...assignment };
  } else {
    // Determine orderIndex if not provided
    const maxOrder = assignments.reduce((max, a) => Math.max(max, a.orderIndex || 0), 0);
    const newAssignment = {
      id: assignment.id || `drill-${Date.now()}`,
      orderIndex: assignment.orderIndex || maxOrder + 1,
      targetReps: assignment.targetReps || 10,
      timeLimitMinutes: assignment.timeLimitMinutes || 5,
      ...assignment,
      createdAt: new Date().toISOString().split('T')[0],
    };
    assignments.push(newAssignment);
  }

  saveAssignments(assignments);
  res.json({ success: true, assignments });
});

/**
 * Instructor API: Delete Assignment
 */
app.delete('/api/teacher/assignments/:id', (req, res) => {
  const { id } = req.params;
  let assignments = getAssignments();
  assignments = assignments.filter((a) => a.id !== id);
  saveAssignments(assignments);
  res.json({ success: true, assignments });
});

// -----------------------------------------------------------------------------
// Serve Production Frontend SPA
// -----------------------------------------------------------------------------
const DIST_DIR = path.join(__dirname, 'dist');

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=================================================================`);
    console.log(`  BARTIMAEUS ACCESSIBLE TYPING ENGINE SERVER`);
    console.log(`  Institution: Bartimaeus Resource Centre`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=================================================================`);
  });
}

export default app;
