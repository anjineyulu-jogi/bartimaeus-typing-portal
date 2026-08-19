import React, { useState, useEffect, useCallback } from 'react';
import { Assignment, FontSizeOption, Progress, ThemeMode, User } from './types';
import {
  loadActiveUser,
  loadAudioEnabled,
  loadFontSize,
  loadTheme,
  saveActiveUser,
  saveAudioEnabled,
  saveFontSize,
  saveTheme,
} from './data/storage';
import {
  apiFetchCurriculum,
  apiFetchProgress,
  apiSaveProgress,
  apiSaveAssignment,
  apiDeleteAssignment,
} from './api/client';
import { Navbar } from './components/layout/Navbar';
import { StudentPortal } from './components/student/StudentPortal';
import { InstructorPortal } from './components/instructor/InstructorPortal';
import { TypingEngineView } from './components/typing/TypingEngineView';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { AuthModal } from './components/auth/AuthModal';
import { loadUsers, saveUsers } from './data/storage';

export const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const active = loadActiveUser();
      // If user has no password or is default unauthenticated state, return null on fresh launch
      const raw = localStorage.getItem('bartimaeus_typing_active_user');
      return raw ? active : null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>(loadUsers);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progressList, setProgressList] = useState<Progress[]>([]);

  // Navigation Views
  const [activeView, setActiveView] = useState<'student' | 'instructor' | 'practice'>('student');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Accessibility Settings
  const [theme, setTheme] = useState<ThemeMode>(loadTheme);
  const [fontSize, setFontSize] = useState<FontSizeOption>(loadFontSize);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(loadAudioEnabled);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  // Sync Curriculum & Progress on Boot / Login
  const refreshData = useCallback(async (userId?: string) => {
    const cur = await apiFetchCurriculum();
    setAssignments(cur);

    if (userId) {
      const prog = await apiFetchProgress(userId);
      setProgressList(prog);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      refreshData(currentUser.id);
    }
  }, [currentUser, refreshData]);

  // Apply Theme & Font Size to DOM Root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-font-size', fontSize);
    saveFontSize(fontSize);
  }, [fontSize]);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    saveActiveUser(user);
    const allUsers = loadUsers();
    if (!allUsers.some((u) => u.id === user.id)) {
      const updated = [...allUsers, user];
      setUsers(updated);
      saveUsers(updated);
    }
    if (user.role === 'Teacher') {
      setActiveView('instructor');
    } else {
      setActiveView('student');
    }
    refreshData(user.id);
  };

  const handleSignOut = () => {
    localStorage.removeItem('bartimaeus_typing_active_user');
    setCurrentUser(null);
    setSelectedAssignment(null);
    setActiveView('student');
  };

  // View Navigation
  const handleNavigateView = (view: 'student' | 'instructor') => {
    // Prevent students from accessing instructor view
    if (currentUser?.role === 'Student' && view === 'instructor') {
      return;
    }
    setActiveView(view);
    if (view === 'student') {
      setSelectedAssignment(null);
    }
  };

  // Select Assignment to Practice
  const handleSelectAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setActiveView('practice');
  };

  // Select Next Sequential Assignment
  const handleSelectNextAssignment = (nextAssignment: Assignment) => {
    setSelectedAssignment(nextAssignment);
    setActiveView('practice');
  };

  // Return to Student Assignment List
  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setActiveView('student');
    if (currentUser) {
      refreshData(currentUser.id);
    }
  };

  // Save Progress Attempt
  const handleSaveProgress = async (record: Progress) => {
    const updated = await apiSaveProgress(record);
    setProgressList(updated);
  };

  // Instructor Handlers
  const handleSaveAssignment = async (assignment: Assignment) => {
    const updated = await apiSaveAssignment(assignment);
    setAssignments(updated);
  };

  const handleDeleteAssignment = async (id: string) => {
    const updated = await apiDeleteAssignment(id);
    setAssignments(updated);
  };

  const handleAddUser = (user: User) => {
    const updated = [...users, user];
    setUsers(updated);
    saveUsers(updated);
  };

  // Audio Toggle
  const handleToggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    saveAudioEnabled(next);
  };

  // If Not Authenticated, Render Accessible Auth Screen
  if (!currentUser) {
    return (
      <div className="app-wrapper">
        <AuthModal onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Universal Accessible Navbar with Role Isolation */}
      <Navbar
        currentUser={currentUser}
        onSignOut={handleSignOut}
        activeView={activeView}
        onNavigateView={handleNavigateView}
        theme={theme}
        onSelectTheme={setTheme}
        fontSize={fontSize}
        onSelectFontSize={setFontSize}
        audioFeedbackEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Content Arena */}
      <main className="main-content">
        {activeView === 'practice' && selectedAssignment ? (
          <TypingEngineView
            assignment={selectedAssignment}
            allAssignments={assignments}
            currentUser={currentUser}
            onBackToAssignments={handleBackToAssignments}
            onSelectNextAssignment={handleSelectNextAssignment}
            onSaveProgress={handleSaveProgress}
            audioFeedbackEnabled={audioEnabled}
            onToggleAudio={handleToggleAudio}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
          />
        ) : activeView === 'instructor' && currentUser.role === 'Teacher' ? (
          <InstructorPortal
            currentUser={currentUser}
            users={users}
            assignments={assignments}
            progressList={progressList}
            onSaveAssignment={handleSaveAssignment}
            onDeleteAssignment={handleDeleteAssignment}
            onAddUser={handleAddUser}
          />
        ) : (
          <StudentPortal
            currentUser={currentUser}
            assignments={assignments}
            progressList={progressList}
            onSelectAssignment={handleSelectAssignment}
          />
        )}
      </main>

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default App;
