import React, { useState, useMemo } from 'react';
import { Assignment, Progress, User, AssignmentCategory } from '../../types';
import { Play, CheckCircle2, Clock, RotateCcw, Target, Zap, Lock, Unlock, ArrowRight } from 'lucide-react';

interface StudentPortalProps {
  currentUser: User;
  assignments: Assignment[];
  progressList: Progress[];
  onSelectAssignment: (assignment: Assignment) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  assignments,
  progressList,
  onSelectAssignment,
}) => {
  // Filter progress for current student
  const studentProgress = useMemo(() => {
    return progressList.filter((p) => p.studentId === currentUser.id);
  }, [progressList, currentUser.id]);

  // Set of completed assignment IDs with passing accuracy (>= 80%)
  const passedAssignmentIds = useMemo(() => {
    const passed = new Set<string>();
    studentProgress.forEach((p) => {
      if (p.completed && (p.passed ?? p.accuracy >= 80)) {
        passed.add(p.assignmentId);
      }
    });
    return passed;
  }, [studentProgress]);

  // Sort assignments strictly by orderIndex
  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [assignments]);

  // Determine unlocked status for each assignment
  // Rule: Lesson 1 is always unlocked. Lesson N is unlocked if Lesson N-1 is passed.
  const assignmentStatusMap = useMemo(() => {
    const map = new Map<string, { isUnlocked: boolean; isCompleted: boolean; isNextUp: boolean }>();
    let nextUpFound = false;

    sortedAssignments.forEach((assign, index) => {
      const isCompleted = passedAssignmentIds.has(assign.id);
      let isUnlocked = false;

      if (index === 0) {
        isUnlocked = true;
      } else {
        const prevAssign = sortedAssignments[index - 1];
        isUnlocked = passedAssignmentIds.has(prevAssign.id);
      }

      const isNextUp = isUnlocked && !isCompleted && !nextUpFound;
      if (isNextUp) {
        nextUpFound = true;
      }

      map.set(assign.id, { isUnlocked, isCompleted, isNextUp });
    });

    return map;
  }, [sortedAssignments, passedAssignmentIds]);

  // Find the next upcoming assignment to practice
  const nextUpAssignment = useMemo(() => {
    return sortedAssignments.find((a) => assignmentStatusMap.get(a.id)?.isNextUp) || sortedAssignments[0];
  }, [sortedAssignments, assignmentStatusMap]);

  // Extract unique categories in order
  const categories = useMemo(() => {
    const cats: AssignmentCategory[] = [];
    sortedAssignments.forEach((a) => {
      if (!cats.includes(a.category)) {
        cats.push(a.category);
      }
    });
    return cats;
  }, [sortedAssignments]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filtered assignments based on category selection
  const filteredAssignments = useMemo(() => {
    if (selectedCategory === 'All') return sortedAssignments;
    return sortedAssignments.filter((a) => a.category === selectedCategory);
  }, [sortedAssignments, selectedCategory]);

  // Aggregate Metrics
  const stats = useMemo(() => {
    const totalCompleted = passedAssignmentIds.size;
    const avgAccuracy =
      studentProgress.length > 0
        ? Math.round(
            studentProgress.reduce((acc, curr) => acc + curr.accuracy, 0) / studentProgress.length
          )
        : 0;
    const maxWpm =
      studentProgress.length > 0 ? Math.max(...studentProgress.map((p) => p.wpm)) : 0;
    const totalTimeSecs = studentProgress.reduce((acc, curr) => acc + curr.timeSpent, 0);
    const totalMinutes = Math.round(totalTimeSecs / 60);

    return { totalCompleted, avgAccuracy, maxWpm, totalMinutes };
  }, [passedAssignmentIds, studentProgress]);

  return (
    <div className="student-portal-container" role="region" aria-label="Student Practice Portal">
      {/* Welcome Banner */}
      <section className="student-welcome-banner" aria-labelledby="welcome-heading">
        <div className="banner-text">
          <h1 id="welcome-heading" className="welcome-title">
            Welcome, {currentUser.name}
          </h1>
          <p className="welcome-desc">
            Bartimaeus Resource Centre • Sequential Non-Visual Touch Typing Pathway
          </p>
        </div>

        {/* Aggregate Quick Stats */}
        <div className="student-stats-strip" aria-label="Your overall typing achievements">
          <div className="stat-pill">
            <CheckCircle2 size={18} className="icon-success" aria-hidden="true" />
            <span className="stat-pill-text">
              <strong>{stats.totalCompleted}</strong> / {sortedAssignments.length} Lessons Passed
            </span>
          </div>
          <div className="stat-pill">
            <Target size={18} className="icon-accent" aria-hidden="true" />
            <span className="stat-pill-text">
              <strong>{stats.avgAccuracy}%</strong> Avg Accuracy
            </span>
          </div>
          <div className="stat-pill">
            <Zap size={18} className="icon-highlight" aria-hidden="true" />
            <span className="stat-pill-text">
              <strong>{stats.maxWpm}</strong> Top WPM
            </span>
          </div>
          <div className="stat-pill">
            <Clock size={18} className="icon-neutral" aria-hidden="true" />
            <span className="stat-pill-text">
              <strong>{stats.totalMinutes}</strong> Mins Practiced
            </span>
          </div>
        </div>
      </section>

      {/* Up Next Focus Card */}
      {nextUpAssignment && (
        <section className="next-up-hero-card" aria-labelledby="next-up-heading">
          <div className="next-up-content">
            <div className="next-up-badge">
              <SparkleIcon />
              <span>CURRENT REQUIRED LESSON</span>
            </div>
            <h2 id="next-up-heading" className="next-up-title">
              {nextUpAssignment.title}
            </h2>
            <p className="next-up-desc">
              {nextUpAssignment.description || 'Targeted 10-repetition touch-typing mastery drill.'}
            </p>
            <div className="next-up-meta">
              <span>
                <Target size={16} aria-hidden="true" /> <strong>{nextUpAssignment.targetReps} Repetitions Required</strong>
              </span>
              <span>
                <Clock size={16} aria-hidden="true" /> <strong>{nextUpAssignment.timeLimitMinutes > 0 ? `${nextUpAssignment.timeLimitMinutes} min limit` : 'Untimed'}</strong>
              </span>
              <span>
                <CheckCircle2 size={16} aria-hidden="true" /> <strong>Min 80% accuracy to unlock next</strong>
              </span>
            </div>
          </div>
          <div className="next-up-action">
            <button
              onClick={() => onSelectAssignment(nextUpAssignment)}
              className="btn btn-primary btn-large btn-pulse"
              aria-label={`Start current required lesson: ${nextUpAssignment.title}. Press Enter to begin practice.`}
              autoFocus
            >
              <Play size={24} aria-hidden="true" />
              <span>Continue Practice (Start Lesson)</span>
              <ArrowRight size={20} aria-hidden="true" />
            </button>
          </div>
        </section>
      )}

      {/* Category Progression Filter Tabs */}
      <div className="portal-filter-bar" role="navigation" aria-label="Curriculum Categories Navigation">
        <span className="filter-label">Curriculum Phases:</span>
        <div className="category-tabs" role="tablist" aria-label="Filter by lesson category">
          <button
            role="tab"
            aria-selected={selectedCategory === 'All'}
            className={`category-tab-btn ${selectedCategory === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('All')}
          >
            All Lessons ({sortedAssignments.length})
          </button>
          {categories.map((cat, idx) => {
            const catAssignments = sortedAssignments.filter((a) => a.category === cat);
            const isCatUnlocked = catAssignments.some((a) => assignmentStatusMap.get(a.id)?.isUnlocked);
            const isCatComplete = catAssignments.every((a) => assignmentStatusMap.get(a.id)?.isCompleted);

            return (
              <button
                key={cat}
                role="tab"
                aria-selected={selectedCategory === cat}
                className={`category-tab-btn ${selectedCategory === cat ? 'active' : ''} ${!isCatUnlocked ? 'tab-locked' : ''}`}
                onClick={() => setSelectedCategory(cat)}
                aria-label={`Phase ${idx + 1}: ${cat}. ${isCatComplete ? 'Completed' : isCatUnlocked ? 'In Progress' : 'Locked'}`}
              >
                {isCatComplete ? (
                  <CheckCircle2 size={14} className="icon-success" aria-hidden="true" />
                ) : isCatUnlocked ? (
                  <Unlock size={14} aria-hidden="true" />
                ) : (
                  <Lock size={14} aria-hidden="true" />
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sequential Lessons Grid */}
      <section className="assignments-section" aria-labelledby="all-lessons-heading">
        <h2 id="all-lessons-heading" className="section-title">
          Curriculum Pathway ({filteredAssignments.length} Lessons)
        </h2>

        <div className="assignments-grid">
          {filteredAssignments.map((assignment) => {
            const status = assignmentStatusMap.get(assignment.id) || {
              isUnlocked: false,
              isCompleted: false,
              isNextUp: false,
            };
            const bestAttempt = studentProgress
              .filter((p) => p.assignmentId === assignment.id)
              .sort((a, b) => b.accuracy - a.accuracy || b.wpm - a.wpm)[0];

            return (
              <article
                key={assignment.id}
                className={`assignment-card ${
                  status.isCompleted
                    ? 'card-completed'
                    : status.isNextUp
                    ? 'card-next-up'
                    : !status.isUnlocked
                    ? 'card-locked'
                    : ''
                }`}
                aria-labelledby={`assign-title-${assignment.id}`}
              >
                <div className="card-top">
                  <span className="card-badge category-badge">
                    Phase {assignment.categoryIndex || 1} • Lesson {assignment.orderIndex}
                  </span>

                  {status.isCompleted ? (
                    <span className="card-badge completed-badge" aria-label="Lesson completed">
                      <CheckCircle2 size={14} aria-hidden="true" /> Passed (80%+)
                    </span>
                  ) : status.isNextUp ? (
                    <span className="card-badge target-badge" aria-label="Current lesson up next">
                      <SparkleIcon /> Up Next
                    </span>
                  ) : (
                    <span className="card-badge locked-badge" aria-label="Locked until previous lesson completed">
                      <Lock size={14} aria-hidden="true" /> Locked
                    </span>
                  )}
                </div>

                <h3 id={`assign-title-${assignment.id}`} className="card-title">
                  {assignment.title}
                </h3>

                <p className="card-desc">
                  {assignment.description || 'Comprehensive 10-drill touch typing repetition exercise.'}
                </p>

                <div className="card-sample-preview" aria-label="Sample drill string">
                  <code>{assignment.drills[0]}</code>
                </div>

                <div className="card-specs">
                  <span className="spec-item">
                    <Target size={14} aria-hidden="true" /> <strong>{assignment.targetReps} reps</strong>
                  </span>
                  <span className="spec-item">
                    <Clock size={14} aria-hidden="true" /> <strong>{assignment.timeLimitMinutes > 0 ? `${assignment.timeLimitMinutes} min` : 'Untimed'}</strong>
                  </span>
                  <span className="spec-item">
                    <RotateCcw size={14} aria-hidden="true" /> <strong>{assignment.drills.length} drills</strong>
                  </span>
                </div>

                {bestAttempt && (
                  <div
                    className="card-best-record"
                    aria-label={`Your best record: ${bestAttempt.accuracy}% accuracy, ${bestAttempt.wpm} WPM`}
                  >
                    <span>
                      Best: <strong>{bestAttempt.wpm} WPM</strong> ({bestAttempt.accuracy}% acc)
                    </span>
                  </div>
                )}

                <div className="card-footer">
                  {status.isUnlocked ? (
                    <button
                      onClick={() => onSelectAssignment(assignment)}
                      className={`btn ${
                        status.isNextUp
                          ? 'btn-primary'
                          : status.isCompleted
                          ? 'btn-secondary'
                          : 'btn-primary'
                      } btn-full`}
                      aria-label={`Practice ${assignment.title}. Requires ${assignment.targetReps} repetitions.`}
                    >
                      <Play size={18} aria-hidden="true" />
                      <span>{status.isCompleted ? 'Practice Again' : 'Start Lesson'}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="btn btn-locked btn-full"
                      aria-label={`Locked. Complete Lesson ${assignment.orderIndex - 1} first to unlock.`}
                    >
                      <Lock size={18} aria-hidden="true" />
                      <span>Locked (Complete Prior Lesson)</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

function SparkleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
    </svg>
  );
}
