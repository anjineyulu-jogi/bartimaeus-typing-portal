/**
 * Core Data Models & Type Definitions for Bartimaeus Accessible Typing System
 */

export type UserRole = 'Teacher' | 'Student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string; // Stored securely in database
  email?: string;
  notes?: string;
  createdAt?: string;
  lastLogin?: string;
}

export type AssignmentCategory =
  | 'Category 1: Tactile Foundations & Home Row'
  | 'Category 2: Upper & Lower Row Reach Mastery'
  | 'Category 3: Indian Govt Basic Course (GCC-TBC 30 WPM)'
  | 'Category 4: Numbers, Punctuation & Tactile Symbols'
  | 'Category 5: Accuracy Mastery & Double-Letter Drills'
  | 'Category 6: Professional Sentence Formatting (SLBC)'
  | 'Category 7: Screen Reader Commands & Speed Endurance'
  | 'Phase 1: Home Row Fundamentals'
  | 'Phase 1: Top Row & Vowels'
  | 'Phase 1: Bottom Row & Shifts'
  | 'Phase 2: Numbers & Symbols'
  | 'Phase 2: Screen Reader Vocabulary'
  | 'Phase 3: Cloud Gateway & Workspace'
  | 'Phase 4: High-Speed Stamina'
  | 'Custom Drills'
  | string;

export interface Assignment {
  id: string;
  orderIndex: number; // 1, 2, 3... Determines strict sequential progression
  categoryIndex: number; // 1, 2, 3, 4, 5, 6, 7
  category: AssignmentCategory;
  title: string;
  description?: string;
  drills: string[]; // Minimum 10 drills / lines
  targetReps: number; // Minimum 10 reps (e.g. 10)
  timeLimitMinutes: number; // e.g. 3, 5, 10 min (0 for untimed)
  minAccuracy?: number; // Passing threshold (e.g. 80%)
  prerequisiteId?: string; // Previous assignment ID required to unlock
  assignedTo?: string[]; // Array of student IDs or ['all']
  createdAt?: string;
  createdBy?: string;
}

export interface Progress {
  id?: string;
  studentId: string;
  assignmentId: string;
  completedReps: number;
  targetReps: number;
  timeSpent: number; // in seconds
  accuracy: number; // percentage (0 - 100)
  wpm: number; // words per minute
  totalErrors: number;
  totalKeystrokes: number;
  completed: boolean;
  passed?: boolean; // accuracy >= 80% and completedReps >= targetReps
  timestamp: string;
}

export interface CategoryStatus {
  categoryIndex: number;
  categoryName: AssignmentCategory;
  totalLessons: number;
  completedLessons: number;
  isUnlocked: boolean;
}

export interface StudentCurriculumStatus {
  studentId: string;
  highestUnlockedOrderIndex: number;
  completedAssignmentIds: string[];
  activeAssignment: Assignment;
  categories: CategoryStatus[];
}

export type TypingStatus = 'idle' | 'running' | 'paused' | 'rep_completed' | 'completed' | 'time_expired';

export interface TypingEngineConfig {
  drills: string[];
  targetReps: number;
  timeLimitMinutes: number;
  onRepComplete?: (repNumber: number, stats: Partial<Progress>) => void;
  onSessionComplete?: (finalStats: Progress) => void;
  onTimeExpired?: (stats: Partial<Progress>) => void;
  audioFeedbackEnabled?: boolean;
}

export interface TypingEngineState {
  currentRep: number;
  targetReps: number;
  timeRemaining: number;
  timeElapsed: number;
  timeLimitMinutes: number;
  status: TypingStatus;
  
  // Drill navigation
  currentDrillIndex: number;
  currentWordIndex: number;
  currentCharIndex: number;
  
  // Text state
  currentDrillText: string;
  drillWords: string[];
  currentWord: string;
  expectedChar: string;
  inputBuffer: string;
  
  // Metrics
  totalCorrect: number;
  totalErrors: number;
  wpm: number;
  accuracy: number;
  
  // Screen Reader ARIA messages
  prompterMessage: string;
  errorMessage: string;
  statusMessage: string;
}

export type ThemeMode =
  | 'high-contrast-yellow'
  | 'high-contrast-cyan'
  | 'high-contrast-dark'
  | 'high-contrast-light'
  | 'standard-dark';

export type FontSizeOption = 'normal' | 'large' | 'extra-large' | 'colossal';
