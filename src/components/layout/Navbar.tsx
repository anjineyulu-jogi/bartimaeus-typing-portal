import React from 'react';
import { User, ThemeMode, FontSizeOption } from '../../types';
import { Volume2, VolumeX, Sun, Moon, Keyboard, Shield, UserCheck, Type, LogOut } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onSignOut: () => void;
  activeView: 'student' | 'instructor' | 'practice';
  onNavigateView: (view: 'student' | 'instructor') => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  fontSize: FontSizeOption;
  onSelectFontSize: (size: FontSizeOption) => void;
  audioFeedbackEnabled: boolean;
  onToggleAudio: () => void;
  onOpenShortcuts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSignOut,
  activeView,
  onNavigateView,
  theme,
  onSelectTheme,
  fontSize,
  onSelectFontSize,
  audioFeedbackEnabled,
  onToggleAudio,
  onOpenShortcuts,
}) => {
  const isTeacherOrAdmin = currentUser.role === 'Teacher' || currentUser.role === 'SuperAdmin';
  const isSuperAdmin = currentUser.role === 'SuperAdmin';

  return (
    <header className="app-navbar" role="banner">
      {/* Brand */}
      <div className="navbar-brand-section">
        <div className="brand-logo-badge" aria-hidden="true">
          B
        </div>
        <div className="brand-text">
          <span className="brand-title">Bartimaeus</span>
          <span className="brand-subtitle">
            {isSuperAdmin ? 'SuperAdmin Console' : isTeacherOrAdmin ? 'Instructor Hub' : 'Accessible Typing'}
          </span>
        </div>
      </div>

      {/* Role-Protected Navigation Links */}
      <nav className="navbar-nav" role="navigation" aria-label="Main Navigation">
        <button
          className={`nav-btn ${activeView === 'student' || activeView === 'practice' ? 'active' : ''}`}
          onClick={() => onNavigateView('student')}
          aria-current={activeView === 'student' || activeView === 'practice' ? 'page' : undefined}
          aria-label="Student Practice Portal"
        >
          <UserCheck size={18} aria-hidden="true" />
          <span>{isTeacherOrAdmin ? 'Student Practice Preview' : 'My Practice Pathway'}</span>
        </button>

        {/* Teacher or SuperAdmin can access Management Hub */}
        {isTeacherOrAdmin && (
          <button
            className={`nav-btn ${activeView === 'instructor' ? 'active' : ''}`}
            onClick={() => onNavigateView('instructor')}
            aria-current={activeView === 'instructor' ? 'page' : undefined}
            aria-label={isSuperAdmin ? 'SuperAdmin Management Hub' : 'Instructor Administration Hub'}
          >
            <Shield size={18} aria-hidden="true" />
            <span>{isSuperAdmin ? 'SuperAdmin Hub' : 'Instructor Hub'}</span>
          </button>
        )}
      </nav>

      {/* Global Accessibility & User Settings Controls */}
      <div className="navbar-controls-section" role="toolbar" aria-label="Accessibility and user controls">
        {/* Authenticated User Badge */}
        <div className="user-profile-badge" aria-label={`Logged in as ${currentUser.name} (${currentUser.role})`}>
          <span className="user-avatar-mini" aria-hidden="true">
            {isSuperAdmin ? '👑' : isTeacherOrAdmin ? '👨‍🏫' : '👤'}
          </span>
          <span className="user-name-text">
            <strong>{currentUser.name}</strong>
            <small className="user-role-label">{currentUser.role}</small>
          </span>
        </div>

        {/* Font Size Selector */}
        <div className="control-group">
          <label htmlFor="font-size-select" className="sr-only">
            Visual Text Size
          </label>
          <div className="select-with-icon">
            <Type size={16} aria-hidden="true" />
            <select
              id="font-size-select"
              className="navbar-select"
              value={fontSize}
              onChange={(e) => onSelectFontSize(e.target.value as FontSizeOption)}
              aria-label={`Text size currently ${fontSize}. Choose size.`}
            >
              <option value="normal">Normal Text</option>
              <option value="large">Large Text</option>
              <option value="extra-large">Extra Large</option>
              <option value="colossal">Colossal Text</option>
            </select>
          </div>
        </div>

        {/* High-Contrast Theme Selector */}
        <div className="control-group">
          <label htmlFor="theme-select" className="sr-only">
            High Contrast Color Theme
          </label>
          <div className="select-with-icon">
            {theme.includes('light') ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            <select
              id="theme-select"
              className="navbar-select"
              value={theme}
              onChange={(e) => onSelectTheme(e.target.value as ThemeMode)}
              aria-label={`Color contrast theme currently ${theme}. Choose theme.`}
            >
              <option value="high-contrast-yellow">⚡ Yellow on Black (NVDA Recommended)</option>
              <option value="high-contrast-cyan">💎 Cyan on Black</option>
              <option value="high-contrast-dark">🌙 High-Contrast Dark</option>
              <option value="high-contrast-light">☀️ High-Contrast Light</option>
              <option value="standard-dark">🖤 Obsidian Minimal</option>
            </select>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={onToggleAudio}
          className={`navbar-icon-btn ${audioFeedbackEnabled ? 'active' : ''}`}
          aria-label={`Sound cues ${audioFeedbackEnabled ? 'enabled' : 'disabled'}. Click to toggle.`}
          title="Toggle Audio Feedback"
        >
          {audioFeedbackEnabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
        </button>

        {/* Shortcuts / Help */}
        <button
          onClick={onOpenShortcuts}
          className="navbar-icon-btn"
          aria-label="View keyboard shortcuts and screen reader user guide (Alt+H)"
          title="Keyboard Shortcuts (Alt+H)"
        >
          <Keyboard size={18} aria-hidden="true" />
        </button>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          className="btn btn-secondary btn-sm"
          aria-label="Sign out of typing portal"
          title="Sign Out"
        >
          <LogOut size={16} aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
};
