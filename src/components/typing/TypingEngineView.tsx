import React, { useRef, useEffect } from 'react';
import { Assignment, Progress, User } from '../../types';
import { useTypingEngine } from '../../hooks/useTypingEngine';
import { AccessibleInputTrap, AccessibleInputTrapHandle } from './AccessibleInputTrap';
import { AriaLiveAnnouncer } from '../common/AriaLiveAnnouncer';
import { Play, Pause, RotateCcw, Award, AlertTriangle, ArrowLeft, Volume2, VolumeX, Keyboard, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TypingEngineViewProps {
  assignment: Assignment;
  allAssignments?: Assignment[];
  currentUser: User;
  onBackToAssignments: () => void;
  onSelectNextAssignment?: (nextAssignment: Assignment) => void;
  onSaveProgress: (record: Progress) => void;
  audioFeedbackEnabled: boolean;
  onToggleAudio: () => void;
  onOpenShortcuts: () => void;
}

export const TypingEngineView: React.FC<TypingEngineViewProps> = ({
  assignment,
  allAssignments = [],
  currentUser,
  onBackToAssignments,
  onSelectNextAssignment,
  onSaveProgress,
  audioFeedbackEnabled,
  onToggleAudio,
  onOpenShortcuts,
}) => {
  const inputTrapRef = useRef<AccessibleInputTrapHandle>(null);

  // Find next sequential assignment
  const nextAssignment = allAssignments
    .filter((a) => (a.orderIndex || 0) > (assignment.orderIndex || 0))
    .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))[0];

  const handleSessionComplete = (finalStats: Progress) => {
    const isPassed = finalStats.accuracy >= 80;
    const enrichedStats: Progress = {
      ...finalStats,
      passed: isPassed,
    };

    onSaveProgress(enrichedStats);

    if (isPassed) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignore canvas error
      }
    }
  };

  const handleRepComplete = (_rep: number, _stats: Partial<Progress>) => {
    // Intermediate logging
  };

  const handleTimeExpired = (stats: Partial<Progress>) => {
    onSaveProgress({
      studentId: currentUser.id,
      assignmentId: assignment.id,
      completedReps: stats.completedReps || 0,
      targetReps: assignment.targetReps,
      timeSpent: stats.timeSpent || assignment.timeLimitMinutes * 60,
      accuracy: stats.accuracy || 0,
      wpm: stats.wpm || 0,
      totalErrors: stats.totalErrors || 0,
      totalKeystrokes: (stats.totalErrors || 0) + (stats.wpm || 0) * 5,
      completed: false,
      passed: false,
      timestamp: new Date().toISOString(),
    });
  };

  const {
    state,
    startSession,
    togglePause,
    resetEngine,
    handleKeyDown,
  } = useTypingEngine({
    drills: assignment.drills,
    targetReps: assignment.targetReps,
    timeLimitMinutes: assignment.timeLimitMinutes,
    studentId: currentUser.id,
    assignmentId: assignment.id,
    onRepComplete: handleRepComplete,
    onSessionComplete: handleSessionComplete,
    onTimeExpired: handleTimeExpired,
    audioFeedbackEnabled,
  });

  const {
    currentRep,
    targetReps,
    timeRemaining,
    timeElapsed,
    timeLimitMinutes,
    status,
    currentDrillIndex,
    currentWordIndex,
    currentCharIndex,
    drillWords,
    currentWord,
    expectedChar,
    inputBuffer,
    totalErrors,
    wpm,
    accuracy,
    prompterMessage,
    errorMessage,
    statusMessage,
  } = state;

  // Global Keyboard Shortcuts (Alt+S, Alt+P, Alt+R, Alt+M, Alt+H, Alt+B, Alt+N)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          if (status === 'idle') startSession();
          else if (status === 'paused') togglePause();
        } else if (e.key.toLowerCase() === 'p') {
          e.preventDefault();
          if (status === 'running' || status === 'paused') togglePause();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          resetEngine(currentDrillIndex);
        } else if (e.key.toLowerCase() === 'm') {
          e.preventDefault();
          onToggleAudio();
        } else if (e.key.toLowerCase() === 'h') {
          e.preventDefault();
          onOpenShortcuts();
        } else if (e.key.toLowerCase() === 'b') {
          e.preventDefault();
          onBackToAssignments();
        } else if (e.key.toLowerCase() === 'n' && nextAssignment && status === 'completed') {
          e.preventDefault();
          if (onSelectNextAssignment) {
            onSelectNextAssignment(nextAssignment);
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    status,
    currentDrillIndex,
    startSession,
    togglePause,
    resetEngine,
    onToggleAudio,
    onOpenShortcuts,
    onBackToAssignments,
    nextAssignment,
    onSelectNextAssignment,
  ]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="typing-practice-container" role="main" aria-label="Typing Practice Arena">
      {/* Screen Reader ARIA Live Regions */}
      <AriaLiveAnnouncer
        prompterMessage={prompterMessage}
        errorMessage={errorMessage}
        statusMessage={statusMessage}
      />

      {/* Accessible Hidden Input Trap */}
      <AccessibleInputTrap
        ref={inputTrapRef}
        status={status}
        inputBuffer={inputBuffer}
        onKeyDown={handleKeyDown}
        expectedChar={expectedChar}
        currentWord={currentWord}
      />

      {/* Header / Assignment Info Bar */}
      <div className="practice-header">
        <div className="header-left">
          <button
            onClick={onBackToAssignments}
            className="btn btn-secondary"
            aria-label="Back to curriculum dashboard (Alt+B)"
            title="Back to curriculum (Alt+B)"
          >
            <ArrowLeft size={20} aria-hidden="true" />
            <span>Curriculum</span>
          </button>
          <div className="assignment-meta">
            <div className="badge-row">
              <span className="badge badge-accent">Lesson {assignment.orderIndex}</span>
              <span className="badge badge-subtle">{assignment.category}</span>
            </div>
            <h1 className="assignment-title">{assignment.title}</h1>
            <p className="assignment-desc">
              {assignment.description || 'Targeted 10-repetition touch-typing mastery drill.'}
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            onClick={onToggleAudio}
            className={`btn ${audioFeedbackEnabled ? 'btn-active' : 'btn-secondary'}`}
            aria-label={`Toggle audio cues, currently ${audioFeedbackEnabled ? 'On' : 'Off'} (Alt+M)`}
            title="Toggle Audio Cues (Alt+M)"
          >
            {audioFeedbackEnabled ? <Volume2 size={20} aria-hidden="true" /> : <VolumeX size={20} aria-hidden="true" />}
            <span>{audioFeedbackEnabled ? 'Audio On' : 'Audio Muted'}</span>
          </button>

          <button
            onClick={onOpenShortcuts}
            className="btn btn-secondary"
            aria-label="Keyboard Shortcuts and Help (Alt+H)"
            title="Shortcuts Help (Alt+H)"
          >
            <Keyboard size={20} aria-hidden="true" />
            <span>Shortcuts</span>
          </button>
        </div>
      </div>

      {/* Multiple Drill Tabs (if assignment has > 1 drill line) */}
      {assignment.drills.length > 1 && (
        <div className="drill-tabs" role="tablist" aria-label="Assignment drill lines">
          {assignment.drills.map((_drill, idx) => (
            <button
              key={idx}
              role="tab"
              aria-selected={idx === currentDrillIndex}
              aria-controls={`drill-panel-${idx}`}
              id={`drill-tab-${idx}`}
              className={`drill-tab-btn ${idx === currentDrillIndex ? 'active' : ''}`}
              onClick={() => resetEngine(idx)}
              disabled={status === 'running'}
              aria-label={`Drill pattern ${idx + 1} of ${assignment.drills.length}`}
            >
              Drill {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* HUD Metrics Dashboard */}
      <section className="hud-metrics-bar" aria-label="Practice Statistics Bar">
        <div className="hud-card rep-card" aria-live="polite">
          <span className="hud-label">Repetitions</span>
          <span className="hud-value" aria-label={`Repetition ${currentRep} of ${targetReps}`}>
            {currentRep} <span className="hud-sub">/ {targetReps}</span>
          </span>
        </div>

        <div className="hud-card timer-card" aria-live="polite">
          <span className="hud-label">
            {timeLimitMinutes > 0 ? 'Time Remaining' : 'Time Elapsed'}
          </span>
          <span
            className="hud-value timer-digits"
            aria-label={
              timeLimitMinutes > 0
                ? `${formatTime(timeRemaining)} remaining`
                : `${formatTime(timeElapsed)} elapsed`
            }
          >
            {timeLimitMinutes > 0 ? formatTime(timeRemaining) : formatTime(timeElapsed)}
          </span>
        </div>

        <div className="hud-card accuracy-card">
          <span className="hud-label">Accuracy (Min 80%)</span>
          <span className={`hud-value ${accuracy >= 80 ? 'text-success' : 'text-warning'}`}>
            {accuracy}%
          </span>
        </div>

        <div className="hud-card wpm-card">
          <span className="hud-label">Speed (WPM)</span>
          <span className="hud-value">{wpm}</span>
        </div>

        <div className="hud-card error-card">
          <span className="hud-label">Total Errors</span>
          <span className="hud-value error-digits">{totalErrors}</span>
        </div>
      </section>

      {/* Main Practice Arena */}
      <section
        className={`practice-arena ${status === 'running' ? 'arena-active' : ''}`}
        onClick={() => inputTrapRef.current?.focus()}
        tabIndex={-1}
        aria-label="Typing practice arena. Click or press any key to focus hidden input."
      >
        {status === 'idle' && (
          <div className="status-banner banner-idle" role="region" aria-label="Start prompt">
            <p className="banner-instruction">
              Ready to begin! Press <kbd>Space</kbd> or click <strong>Start Practice</strong> below to type all {targetReps} reps.
            </p>
          </div>
        )}

        {status === 'paused' && (
          <div className="status-banner banner-paused" role="region" aria-label="Paused alert">
            <p className="banner-instruction">
              Session is Paused. Press <kbd>Alt+P</kbd> or click <strong>Resume</strong> to continue.
            </p>
          </div>
        )}

        {/* Large Focused Target Word Display */}
        <div className="target-focus-container" aria-hidden="true">
          <div className="target-focus-label">CURRENT TARGET WORD:</div>
          <div className="target-word-card">
            {currentWord ? (
              <div className="character-token-list">
                {currentWord.split('').map((char, charIdx) => {
                  let charStatus = 'pending';
                  if (charIdx < currentCharIndex) {
                    charStatus = 'typed-correct';
                  } else if (charIdx === currentCharIndex) {
                    charStatus = 'active-cursor';
                  }
                  return (
                    <span
                      key={charIdx}
                      className={`char-token char-${charStatus}`}
                    >
                      {char}
                    </span>
                  );
                })}
                {/* Space indicator at end of word */}
                <span
                  className={`char-token char-space ${
                    currentCharIndex >= currentWord.length ? 'active-cursor' : 'pending'
                  }`}
                  title="Spacebar to submit word"
                >
                  ␣
                </span>
              </div>
            ) : (
              <div className="character-token-list">
                <span className="char-token char-typed-correct">✓ Drill Ready</span>
              </div>
            )}
          </div>
          <div className="target-next-key">
            Next Key: <strong>{expectedChar === ' ' ? '␣ [SPACEBAR]' : `[ ${expectedChar} ]`}</strong>
          </div>
        </div>

        {/* Full Drill Context Line */}
        <div className="drill-context-stream" aria-label="Full drill text line">
          <span className="drill-stream-label sr-only">Full sentence text:</span>
          {drillWords.map((word, wordIdx) => {
            let wordState = 'pending';
            if (wordIdx < currentWordIndex) {
              wordState = 'completed';
            } else if (wordIdx === currentWordIndex) {
              wordState = 'active';
            }

            return (
              <span
                key={wordIdx}
                className={`drill-stream-word word-${wordState}`}
              >
                {word}
              </span>
            );
          })}
        </div>
      </section>

      {/* Control Action Toolbar */}
      <div className="practice-controls" role="toolbar" aria-label="Practice session controls">
        {status === 'idle' && (
          <button
            onClick={startSession}
            className="btn btn-primary btn-large"
            aria-label="Start Practice Session (Press Space or Alt+S)"
          >
            <Play size={22} aria-hidden="true" />
            <span>Start Practice (Alt+S)</span>
          </button>
        )}

        {status === 'running' && (
          <button
            onClick={togglePause}
            className="btn btn-secondary btn-large"
            aria-label="Pause Practice Session (Alt+P)"
          >
            <Pause size={22} aria-hidden="true" />
            <span>Pause (Alt+P)</span>
          </button>
        )}

        {status === 'paused' && (
          <button
            onClick={togglePause}
            className="btn btn-primary btn-large"
            aria-label="Resume Practice Session (Alt+P)"
          >
            <Play size={22} aria-hidden="true" />
            <span>Resume (Alt+P)</span>
          </button>
        )}

        <button
          onClick={() => resetEngine(currentDrillIndex)}
          className="btn btn-secondary"
          aria-label="Reset Practice Drill (Alt+R)"
          title="Reset Drill (Alt+R)"
        >
          <RotateCcw size={18} aria-hidden="true" />
          <span>Reset (Alt+R)</span>
        </button>
      </div>

      {/* Completion Modal / Summary Card */}
      {status === 'completed' && (
        <div className="session-result-overlay" role="dialog" aria-modal="true" aria-labelledby="completion-title">
          <div className="session-result-modal modal-success">
            <div className="modal-icon-badge success">
              <Award size={48} aria-hidden="true" />
            </div>
            <h2 id="completion-title" className="modal-title">
              {accuracy >= 80 ? 'Lesson Completed & Passed!' : 'Drill Finished (Needs 80%+ Accuracy)'}
            </h2>
            <p className="modal-subtitle">
              {accuracy >= 80
                ? `Fantastic job, ${currentUser.name}! You finished all ${targetReps} reps with ${accuracy}% accuracy. The next lesson is now unlocked!`
                : `You finished all ${targetReps} reps, but accuracy was ${accuracy}%. You need at least 80% accuracy to unlock the next lesson. Give it another try!`}
            </p>

            <div className="result-stats-grid">
              <div className="stat-box">
                <span className="stat-title">Final Speed</span>
                <span className="stat-num">{wpm} WPM</span>
              </div>
              <div className="stat-box">
                <span className="stat-title">Accuracy</span>
                <span className={`stat-num ${accuracy >= 80 ? 'text-success' : 'text-warning'}`}>
                  {accuracy}%
                </span>
              </div>
              <div className="stat-box">
                <span className="stat-title">Time Spent</span>
                <span className="stat-num">{formatTime(timeElapsed)}</span>
              </div>
              <div className="stat-box">
                <span className="stat-title">Reps Done</span>
                <span className="stat-num">{targetReps} / {targetReps}</span>
              </div>
              <div className="stat-box">
                <span className="stat-title">Errors</span>
                <span className="stat-num">{totalErrors}</span>
              </div>
            </div>

            <div className="modal-actions">
              {accuracy >= 80 && nextAssignment && onSelectNextAssignment && (
                <button
                  onClick={() => onSelectNextAssignment(nextAssignment)}
                  className="btn btn-primary btn-large btn-full"
                  autoFocus
                  aria-label={`Continue to Next Lesson: Lesson ${nextAssignment.orderIndex}, ${nextAssignment.title}. Press Enter.`}
                >
                  <span>Continue to Next Lesson ({nextAssignment.orderIndex})</span>
                  <ArrowRight size={20} aria-hidden="true" />
                </button>
              )}

              <button
                onClick={() => resetEngine(currentDrillIndex)}
                className="btn btn-secondary"
                aria-label="Practice this lesson again to improve speed"
              >
                <RotateCcw size={18} aria-hidden="true" />
                <span>Practice Again</span>
              </button>

              <button
                onClick={onBackToAssignments}
                className="btn btn-secondary"
                aria-label="Return to curriculum pathway"
              >
                <span>Curriculum Pathway</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Expired Modal */}
      {status === 'time_expired' && (
        <div className="session-result-overlay" role="dialog" aria-modal="true" aria-labelledby="expired-title">
          <div className="session-result-modal modal-warning">
            <div className="modal-icon-badge warning">
              <AlertTriangle size={48} aria-hidden="true" />
            </div>
            <h2 id="expired-title" className="modal-title">Time Limit Expired!</h2>
            <p className="modal-subtitle">
              The {timeLimitMinutes}-minute time limit was reached. {currentRep - 1} of {targetReps} repetitions completed.
            </p>

            <div className="result-stats-grid">
              <div className="stat-box">
                <span className="stat-title">Completed Reps</span>
                <span className="stat-num">{currentRep - 1} / {targetReps}</span>
              </div>
              <div className="stat-box">
                <span className="stat-title">Speed</span>
                <span className="stat-num">{wpm} WPM</span>
              </div>
              <div className="stat-box">
                <span className="stat-title">Accuracy</span>
                <span className="stat-num">{accuracy}%</span>
              </div>
              <div className="stat-box">
                <span className="stat-title">Errors</span>
                <span className="stat-num">{totalErrors}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={() => resetEngine(currentDrillIndex)}
                className="btn btn-primary"
                autoFocus
                aria-label="Try this lesson again"
              >
                <RotateCcw size={18} aria-hidden="true" />
                <span>Try Again</span>
              </button>
              <button
                onClick={onBackToAssignments}
                className="btn btn-secondary"
                aria-label="Return to curriculum"
              >
                <span>Curriculum</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
