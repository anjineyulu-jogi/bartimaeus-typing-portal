import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { apiLogin, apiRegister } from '../../api/client';
import { UserCheck, Shield, KeyRound, AlertCircle, Sparkles } from 'lucide-react';

interface AuthModalProps {
  onLoginSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLoginSuccess }) => {
  const isInstructorPath =
    typeof window !== 'undefined' &&
    (window.location.pathname.includes('instructor') ||
      window.location.pathname.includes('teacher') ||
      window.location.pathname.includes('admin'));

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>(isInstructorPath ? 'Teacher' : 'Student');
  const [teacherPasscode, setTeacherPasscode] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const res = await apiRegister(name, password, role, notes, teacherPasscode);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setError(res.error || 'Registration failed. Please try again.');
        }
      } else {
        const res = await apiLogin(name, password);
        if (res.success && res.user) {
          onLoginSuccess(res.user);
        } else {
          setError(res.error || 'Login failed. Please check your name and password.');
        }
      }
    } catch {
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-backdrop auth-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-title"
    >
      <div className="modal-box auth-dialog-box">
        {/* Header Badge */}
        <div className="auth-header-section">
          <div className="brand-logo-badge auth-brand-logo" aria-hidden="true">
            B
          </div>
          <h1 id="auth-dialog-title" className="auth-main-title">
            Bartimaeus Resource Centre
          </h1>
          <p className="auth-subtitle">Accessible Touch-Typing Platform & Instructor Hub</p>
        </div>

        {/* Tab Switcher: Login vs First-Time Setup */}
        <div className="auth-tab-switch" role="tablist" aria-label="Account Access Mode">
          <button
            type="button"
            role="tab"
            aria-selected={!isRegistering}
            className={`auth-tab-btn ${!isRegistering ? 'active' : ''}`}
            onClick={() => {
              setIsRegistering(false);
              setError('');
            }}
          >
            <KeyRound size={16} aria-hidden="true" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={isRegistering}
            className={`auth-tab-btn ${isRegistering ? 'active' : ''}`}
            onClick={() => {
              setIsRegistering(true);
              setError('');
            }}
          >
            <Sparkles size={16} aria-hidden="true" />
            <span>First-Time Setup (Register)</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="auth-error-banner" role="alert" aria-live="assertive">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="auth-name-input">
              {isRegistering ? 'Full Name *' : 'Your Name *'}
            </label>
            <input
              id="auth-name-input"
              type="text"
              required
              autoFocus
              className="input-control"
              placeholder={isRegistering ? 'e.g. Aarav Sharma' : 'Enter your registered name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-password-input">
              Password * <span className="help-text">(At least 3 characters)</span>
            </label>
            <input
              id="auth-password-input"
              type="password"
              required
              className="input-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isRegistering ? 'new-password' : 'current-password'}
            />
          </div>

          {/* Registration-Only Fields */}
          {isRegistering && (
            <>
              <div className="form-group">
                <label htmlFor="auth-role-select">Account Role *</label>
                <select
                  id="auth-role-select"
                  className="select-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="Student">👤 Student (Accessible Practice Portal)</option>
                  <option value="Teacher">👨‍🏫 Teacher / Instructor (Full Management Portal)</option>
                </select>
              </div>

              {role === 'Teacher' && (
                <div className="form-group">
                  <label htmlFor="auth-teacher-passcode">
                    Teacher Access Passcode * <span className="help-text">(Security Passcode)</span>
                  </label>
                  <input
                    id="auth-teacher-passcode"
                    type="password"
                    required
                    className="input-control"
                    placeholder="Enter instructor passcode (e.g. admin)"
                    value={teacherPasscode}
                    onChange={(e) => setTeacherPasscode(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-notes-input">
                  Assistive Tech Notes <span className="help-text">(Optional)</span>
                </label>
                <input
                  id="auth-notes-input"
                  type="text"
                  className="input-control"
                  placeholder="e.g. NVDA User • Phase 1 Learner"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="modal-actions auth-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full btn-large"
              aria-label={isRegistering ? 'Complete setup and enter portal' : 'Sign in to typing portal'}
            >
              {role === 'Teacher' && isRegistering ? (
                <Shield size={20} aria-hidden="true" />
              ) : (
                <UserCheck size={20} aria-hidden="true" />
              )}
              <span>
                {loading
                  ? 'Authenticating...'
                  : isRegistering
                  ? 'Complete Setup & Start'
                  : 'Sign In to Portal'}
              </span>
            </button>
          </div>
        </form>

        <div className="auth-footer-help">
          <p className="help-text text-center">
            Designed for NVDA, JAWS, and VoiceOver screen readers.
          </p>
        </div>
      </div>
    </div>
  );
};
