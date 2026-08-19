import React, { useState, useMemo } from 'react';
import { Assignment, Progress, User, AssignmentCategory } from '../../types';
import { Plus, Edit3, Trash2, Download, Users, FileText, CheckCircle2, XCircle, Clock, Target, Search, BarChart3, KeyRound, RotateCcw } from 'lucide-react';
import { DEFAULT_ASSIGNMENTS } from '../../data/defaultCurriculum';

interface InstructorPortalProps {
  currentUser: User;
  users: User[];
  assignments: Assignment[];
  progressList: Progress[];
  onSaveAssignment: (assignment: Assignment) => void;
  onDeleteAssignment: (id: string) => void;
  onAddUser: (user: User) => void;
}

export const InstructorPortal: React.FC<InstructorPortalProps> = ({
  users,
  assignments,
  progressList,
  onSaveAssignment,
  onDeleteAssignment,
  onAddUser,
}) => {
  const [activeTab, setActiveTab] = useState<'assignments' | 'progress' | 'students'>('assignments');

  // Assignment Form Modal State
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<Partial<Assignment> | null>(null);
  const [drillsInput, setDrillsInput] = useState<string>('');

  // New Student Modal State
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentPassword, setNewStudentPassword] = useState<string>('student');
  const [newStudentNotes, setNewStudentNotes] = useState<string>('');

  // Password Reset Modal State
  const [resetModalStudent, setResetModalStudent] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string>('');

  // Progress Filters
  const [progressStudentFilter, setProgressStudentFilter] = useState<string>('all');
  const [progressSearch, setProgressSearch] = useState<string>('');

  const students = useMemo(() => users.filter((u) => u.role === 'Student'), [users]);

  // Sort assignments strictly by orderIndex
  const sortedAssignments = useMemo(() => {
    return [...assignments].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }, [assignments]);

  // Open editor for new or existing assignment
  const handleOpenEditAssignment = (assign?: Assignment) => {
    if (assign) {
      setEditingAssignment(assign);
      setDrillsInput(assign.drills.join('\n'));
    } else {
      const nextOrder = sortedAssignments.length + 1;
      setEditingAssignment({
        id: `drill-${Date.now()}`,
        orderIndex: nextOrder,
        categoryIndex: 1,
        category: 'Phase 1: Home Row Fundamentals',
        title: `Lesson ${String(nextOrder).padStart(2, '0')}: Custom Touch-Typing Drill`,
        description: '',
        drills: [],
        targetReps: 10,
        timeLimitMinutes: 5,
        minAccuracy: 80,
        assignedTo: ['all'],
        createdAt: new Date().toISOString().split('T')[0],
      });
      setDrillsInput('');
    }
    setIsEditingModalOpen(true);
  };

  const handleSaveAssignmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment || !editingAssignment.title?.trim()) return;

    const parsedDrills = drillsInput
      .split('\n')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const finalAssignment: Assignment = {
      id: editingAssignment.id || `drill-${Date.now()}`,
      orderIndex: Number(editingAssignment.orderIndex) || sortedAssignments.length + 1,
      categoryIndex: Number(editingAssignment.categoryIndex) || 1,
      category: (editingAssignment.category as AssignmentCategory) || 'Phase 1: Home Row Fundamentals',
      title: editingAssignment.title.trim(),
      description: editingAssignment.description?.trim() || '',
      drills: parsedDrills.length > 0 ? parsedDrills : ['asdf jkl; asdf jkl;'],
      targetReps: Math.max(1, Number(editingAssignment.targetReps) || 10),
      timeLimitMinutes: Number(editingAssignment.timeLimitMinutes) || 0,
      minAccuracy: Number(editingAssignment.minAccuracy) || 80,
      assignedTo: editingAssignment.assignedTo || ['all'],
      createdAt: editingAssignment.createdAt || new Date().toISOString().split('T')[0],
      createdBy: 'Bartimaeus Instructor',
    };

    onSaveAssignment(finalAssignment);
    setIsEditingModalOpen(false);
    setEditingAssignment(null);
  };

  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const newStudent: User = {
      id: `student-${Date.now()}`,
      name: newStudentName.trim(),
      role: 'Student',
      password: newStudentPassword.trim() || 'student',
      notes: newStudentNotes.trim() || 'Bartimaeus Student',
      createdAt: new Date().toISOString(),
    };

    onAddUser(newStudent);
    setNewStudentName('');
    setNewStudentPassword('student');
    setNewStudentNotes('');
    setIsNewStudentModalOpen(false);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalStudent || !resetNewPassword.trim()) return;

    resetModalStudent.password = resetNewPassword.trim();
    setResetSuccessMessage(`Password updated successfully for ${resetModalStudent.name}`);
    setTimeout(() => {
      setResetModalStudent(null);
      setResetNewPassword('');
      setResetSuccessMessage('');
    }, 1200);
  };

  // Filtered Progress Data
  const filteredProgress = useMemo(() => {
    return progressList.filter((p) => {
      const matchStudent = progressStudentFilter === 'all' || p.studentId === progressStudentFilter;
      const studentObj = users.find((u) => u.id === p.studentId);
      const assignObj = assignments.find((a) => a.id === p.assignmentId);
      const studentName = studentObj ? studentObj.name.toLowerCase() : '';
      const assignTitle = assignObj ? assignObj.title.toLowerCase() : '';
      const query = progressSearch.toLowerCase();
      const matchSearch = !query || studentName.includes(query) || assignTitle.includes(query);

      return matchStudent && matchSearch;
    });
  }, [progressList, progressStudentFilter, progressSearch, users, assignments]);

  // Export Progress CSV
  const handleExportCSV = () => {
    if (progressList.length === 0) {
      alert('No student progress records to export.');
      return;
    }

    const headers = [
      'Student Name',
      'Lesson Title',
      'Completed Reps',
      'Target Reps',
      'Accuracy (%)',
      'Speed (WPM)',
      'Time Spent (s)',
      'Total Errors',
      'Result Status',
      'Date & Time',
    ];
    const rows = progressList.map((p) => {
      const student = users.find((u) => u.id === p.studentId);
      const assign = assignments.find((a) => a.id === p.assignmentId);
      return [
        `"${student?.name || 'Unknown Student'}"`,
        `"${assign?.title || p.assignmentId}"`,
        p.completedReps,
        p.targetReps,
        p.accuracy,
        p.wpm,
        p.timeSpent,
        p.totalErrors,
        p.completed && (p.passed ?? p.accuracy >= 80) ? 'PASSED (80%+)' : 'INCOMPLETE/FAILED',
        `"${new Date(p.timestamp).toLocaleString()}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Bartimaeus_Typing_Curriculum_Progress_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="instructor-portal-container" role="region" aria-label="Instructor Management Portal">
      {/* Top Banner */}
      <section className="instructor-header-banner">
        <div>
          <h1 className="instructor-title">Instructor Administration Portal</h1>
          <p className="instructor-subtitle">
            Curriculum Configuration, 10-Repetition Sequential Pathways & Student Performance Analytics
          </p>
        </div>

        <div className="instructor-quick-actions">
          <button
            onClick={() => handleOpenEditAssignment()}
            className="btn btn-primary"
            aria-label="Create New Typing Assignment"
          >
            <Plus size={18} aria-hidden="true" />
            <span>Create Lesson</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn btn-secondary"
            aria-label="Export all progress records to CSV"
          >
            <Download size={18} aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="instructor-tabs" role="tablist" aria-label="Instructor Portal Sections">
        <button
          role="tab"
          aria-selected={activeTab === 'assignments'}
          className={`inst-tab-btn ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FileText size={18} aria-hidden="true" />
          <span>Sequential Curriculum ({sortedAssignments.length} Lessons)</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'progress'}
          className={`inst-tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}
        >
          <BarChart3 size={18} aria-hidden="true" />
          <span>Student Practice Submissions ({progressList.length})</span>
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'students'}
          className={`inst-tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          <Users size={18} aria-hidden="true" />
          <span>Student Roster ({students.length})</span>
        </button>
      </div>

      {/* TAB 1: Assignments Management */}
      {activeTab === 'assignments' && (
        <section className="inst-tab-content" aria-labelledby="assignments-tab-heading">
          <div className="section-toolbar">
            <h2 id="assignments-tab-heading" className="section-title">
              Configured Sequential Typing Curriculum
            </h2>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => {
                  if (window.confirm('Sync and reload the complete 28-lesson official curriculum across all 7 categories?')) {
                    DEFAULT_ASSIGNMENTS.forEach((assign) => onSaveAssignment(assign));
                    alert('Official 28-Lesson Curriculum Synced Successfully!');
                  }
                }}
                className="btn btn-secondary btn-sm"
                aria-label="Sync full official 28-lesson curriculum"
                title="Reload the 28 comprehensive lessons across all 7 categories"
              >
                <RotateCcw size={16} aria-hidden="true" /> Sync Official Curriculum (28 Lessons)
              </button>
              <button
                onClick={() => handleOpenEditAssignment()}
                className="btn btn-primary btn-sm"
                aria-label="Add new drill assignment"
              >
                <Plus size={16} aria-hidden="true" /> Add Lesson
              </button>
            </div>
          </div>

          <div className="assignments-table-wrapper">
            <table className="inst-table" aria-label="Table of assignments and repetition parameters">
              <thead>
                <tr>
                  <th scope="col">Order & Title</th>
                  <th scope="col">Category Phase</th>
                  <th scope="col">Target Reps</th>
                  <th scope="col">Time Limit</th>
                  <th scope="col">Drill Count</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAssignments.map((assign) => (
                  <tr key={assign.id}>
                    <td>
                      <div className="table-cell-title">
                        <span className="badge badge-accent">#{assign.orderIndex}</span>
                        <strong>{assign.title}</strong>
                      </div>
                      <small className="table-cell-desc">{assign.description}</small>
                    </td>
                    <td>
                      <span className="badge badge-subtle">{assign.category}</span>
                    </td>
                    <td>
                      <span className="badge badge-accent">
                        <Target size={12} aria-hidden="true" /> {assign.targetReps} reps
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        <Clock size={12} aria-hidden="true" /> {assign.timeLimitMinutes > 0 ? `${assign.timeLimitMinutes} min` : 'Untimed'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {assign.drills.length} lines
                      </span>
                    </td>
                    <td>
                      <div className="table-action-btns">
                        <button
                          onClick={() => handleOpenEditAssignment(assign)}
                          className="btn-icon"
                          aria-label={`Edit assignment ${assign.title}`}
                          title="Edit Assignment"
                        >
                          <Edit3 size={16} aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete lesson "${assign.title}"?`)) {
                              onDeleteAssignment(assign.id);
                            }
                          }}
                          className="btn-icon btn-icon-danger"
                          aria-label={`Delete assignment ${assign.title}`}
                          title="Delete Assignment"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: Student Progress Log */}
      {activeTab === 'progress' && (
        <section className="inst-tab-content" aria-labelledby="progress-tab-heading">
          <div className="section-toolbar">
            <h2 id="progress-tab-heading" className="section-title">
              Live Student Practice Submissions
            </h2>
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary btn-sm"
              aria-label="Download CSV report"
            >
              <Download size={16} aria-hidden="true" /> Download CSV
            </button>
          </div>

          {/* Filters */}
          <div className="progress-filters-bar">
            <div className="filter-group">
              <label htmlFor="filter-student-select">Filter by Student:</label>
              <select
                id="filter-student-select"
                className="select-control"
                value={progressStudentFilter}
                onChange={(e) => setProgressStudentFilter(e.target.value)}
              >
                <option value="all">All Students ({students.length})</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group flex-1">
              <label htmlFor="filter-progress-search">Search:</label>
              <div className="search-input-wrap">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  id="filter-progress-search"
                  type="text"
                  className="input-control"
                  placeholder="Search by student or lesson title..."
                  value={progressSearch}
                  onChange={(e) => setProgressSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredProgress.length === 0 ? (
            <div className="empty-state-card">
              <p>No student progress records found. When students practice, their records will appear here.</p>
            </div>
          ) : (
            <div className="assignments-table-wrapper">
              <table className="inst-table" aria-label="Student typing performance logs">
                <thead>
                  <tr>
                    <th scope="col">Student</th>
                    <th scope="col">Lesson Title</th>
                    <th scope="col">Reps Done</th>
                    <th scope="col">Speed (WPM)</th>
                    <th scope="col">Accuracy</th>
                    <th scope="col">Errors</th>
                    <th scope="col">Time</th>
                    <th scope="col">Status</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProgress.map((record, index) => {
                    const student = users.find((u) => u.id === record.studentId);
                    const assign = assignments.find((a) => a.id === record.assignmentId);
                    const isPassed = record.completed && (record.passed ?? record.accuracy >= 80);

                    return (
                      <tr key={record.id || index}>
                        <td>
                          <strong>{student?.name || 'Unknown Student'}</strong>
                        </td>
                        <td>{assign?.title || record.assignmentId}</td>
                        <td>
                          <span className="badge badge-accent">
                            {record.completedReps} / {record.targetReps}
                          </span>
                        </td>
                        <td>
                          <strong>{record.wpm}</strong> WPM
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              record.accuracy >= 95
                                ? 'badge-success'
                                : record.accuracy >= 80
                                ? 'badge-warning'
                                : 'badge-danger'
                            }`}
                          >
                            {record.accuracy}%
                          </span>
                        </td>
                        <td>{record.totalErrors}</td>
                        <td>
                          {Math.floor(record.timeSpent / 60)}m {record.timeSpent % 60}s
                        </td>
                        <td>
                          {isPassed ? (
                            <span className="status-pill status-success">
                              <CheckCircle2 size={14} aria-hidden="true" /> Passed (80%+)
                            </span>
                          ) : (
                            <span className="status-pill status-partial">
                              <XCircle size={14} aria-hidden="true" /> Under 80% / Partial
                            </span>
                          )}
                        </td>
                        <td>
                          <small>{new Date(record.timestamp).toLocaleDateString()}</small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: Student Roster & Account Management */}
      {activeTab === 'students' && (
        <section className="inst-tab-content" aria-labelledby="students-tab-heading">
          <div className="section-toolbar">
            <h2 id="students-tab-heading" className="section-title">
              Bartimaeus Student Profiles & Credentials
            </h2>
            <button
              onClick={() => setIsNewStudentModalOpen(true)}
              className="btn btn-primary btn-sm"
              aria-label="Enroll new student"
            >
              <Plus size={16} aria-hidden="true" /> Add Student
            </button>
          </div>

          <div className="roster-grid">
            {students.map((student) => {
              const studentRecords = progressList.filter((p) => p.studentId === student.id);
              const passedCount = studentRecords.filter((p) => p.completed && (p.passed ?? p.accuracy >= 80)).length;
              const maxWpm = studentRecords.length > 0 ? Math.max(...studentRecords.map((p) => p.wpm)) : 0;
              const avgAcc =
                studentRecords.length > 0
                  ? Math.round(studentRecords.reduce((acc, c) => acc + c.accuracy, 0) / studentRecords.length)
                  : 0;

              return (
                <div key={student.id} className="roster-card">
                  <div className="roster-card-header">
                    <div className="roster-avatar">{student.name.charAt(0)}</div>
                    <div className="flex-1">
                      <h3 className="roster-name">{student.name}</h3>
                      <span className="badge badge-subtle">{student.notes || 'Student'}</span>
                    </div>
                  </div>

                  <div className="roster-stats-mini">
                    <div className="mini-stat">
                      <span className="mini-label">Lessons Passed</span>
                      <span className="mini-val text-success">
                        {passedCount} / {sortedAssignments.length}
                      </span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-label">Top Speed</span>
                      <span className="mini-val">{maxWpm} WPM</span>
                    </div>
                    <div className="mini-stat">
                      <span className="mini-label">Avg Accuracy</span>
                      <span className="mini-val">{avgAcc}%</span>
                    </div>
                  </div>

                  <div className="roster-card-actions">
                    <button
                      onClick={() => setResetModalStudent(student)}
                      className="btn btn-secondary btn-sm btn-full"
                      aria-label={`Reset password for student ${student.name}`}
                    >
                      <KeyRound size={14} aria-hidden="true" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Edit / Create Assignment Modal */}
      {isEditingModalOpen && editingAssignment && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-modal-title">
          <div className="modal-box">
            <h2 id="edit-modal-title" className="modal-title">
              {editingAssignment.id?.startsWith('drill-') && assignments.some((a) => a.id === editingAssignment.id)
                ? 'Edit Lesson'
                : 'Create New Lesson'}
            </h2>

            <form onSubmit={handleSaveAssignmentSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="assign-title-input">Lesson Title *</label>
                <input
                  id="assign-title-input"
                  type="text"
                  required
                  className="input-control"
                  placeholder="e.g. Lesson 12: Advanced Ergonomic Sentence Traversal"
                  value={editingAssignment.title || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="assign-order-input">Sequential Order Index *</label>
                  <input
                    id="assign-order-input"
                    type="number"
                    min="1"
                    required
                    className="input-control"
                    value={editingAssignment.orderIndex || 1}
                    onChange={(e) =>
                      setEditingAssignment({
                        ...editingAssignment,
                        orderIndex: parseInt(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="assign-category-select">Curriculum Phase</label>
                  <select
                    id="assign-category-select"
                    className="select-control"
                    value={editingAssignment.category || 'Category 1: Tactile Foundations & Home Row'}
                    onChange={(e) =>
                      setEditingAssignment({
                        ...editingAssignment,
                        category: e.target.value as AssignmentCategory,
                      })
                    }
                  >
                    <option value="Category 1: Tactile Foundations & Home Row">Category 1: Tactile Foundations & Home Row</option>
                    <option value="Category 2: Upper & Lower Row Reach Mastery">Category 2: Upper & Lower Row Reach Mastery</option>
                    <option value="Category 3: Indian Govt Basic Course (GCC-TBC 30 WPM)">Category 3: Indian Govt Basic Course (GCC-TBC 30 WPM)</option>
                    <option value="Category 4: Numbers, Punctuation & Tactile Symbols">Category 4: Numbers, Punctuation & Tactile Symbols</option>
                    <option value="Category 5: Accuracy Mastery & Double-Letter Drills">Category 5: Accuracy Mastery & Double-Letter Drills</option>
                    <option value="Category 6: Professional Sentence Formatting (SLBC)">Category 6: Professional Sentence Formatting (SLBC)</option>
                    <option value="Category 7: Screen Reader Commands & Speed Endurance">Category 7: Screen Reader Commands & Speed Endurance</option>
                    <option value="Custom Drills">Custom Drills</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="assign-target-reps">
                    Target Reps * <span className="help-text">(Min 10 Reps Recommended)</span>
                  </label>
                  <input
                    id="assign-target-reps"
                    type="number"
                    min="1"
                    max="50"
                    required
                    className="input-control"
                    value={editingAssignment.targetReps || 10}
                    onChange={(e) =>
                      setEditingAssignment({
                        ...editingAssignment,
                        targetReps: parseInt(e.target.value) || 10,
                      })
                    }
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="assign-time-limit">
                    Time Limit (Minutes) <span className="help-text">(0 for untimed)</span>
                  </label>
                  <input
                    id="assign-time-limit"
                    type="number"
                    min="0"
                    max="60"
                    className="input-control"
                    value={editingAssignment.timeLimitMinutes || 5}
                    onChange={(e) =>
                      setEditingAssignment({
                        ...editingAssignment,
                        timeLimitMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="assign-description-input">Description / Learning Objective</label>
                <input
                  id="assign-description-input"
                  type="text"
                  className="input-control"
                  placeholder="e.g. Master finger positioning for right-hand pinky key"
                  value={editingAssignment.description || ''}
                  onChange={(e) =>
                    setEditingAssignment({ ...editingAssignment, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="assign-drills-textarea">
                  Drill Strings / Sentences * <span className="help-text">(1 drill per row; min 10 lines)</span>
                </label>
                <textarea
                  id="assign-drills-textarea"
                  rows={6}
                  required
                  className="textarea-control"
                  placeholder="asdf jkl; asdf jkl;&#10;dad sad fad lad ask fall alas salad&#10;..."
                  value={drillsInput}
                  onChange={(e) => setDrillsInput(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Lesson
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalStudent && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
          <div className="modal-box">
            <h2 id="reset-modal-title" className="modal-title">
              Reset Password for {resetModalStudent.name}
            </h2>

            {resetSuccessMessage ? (
              <div className="status-banner banner-idle text-success">
                {resetSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="reset-new-password">New Student Password *</label>
                  <input
                    id="reset-new-password"
                    type="password"
                    required
                    autoFocus
                    className="input-control"
                    placeholder="Enter new password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setResetModalStudent(null)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Password
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isNewStudentModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="student-modal-title">
          <div className="modal-box">
            <h2 id="student-modal-title" className="modal-title">
              Enroll New Student
            </h2>

            <form onSubmit={handleAddStudentSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="new-student-name">Student Full Name *</label>
                <input
                  id="new-student-name"
                  type="text"
                  required
                  className="input-control"
                  placeholder="e.g. Kavya Mohan"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-student-password">Initial Password *</label>
                <input
                  id="new-student-password"
                  type="password"
                  required
                  className="input-control"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-student-notes">Screen Reader / Assistive Tech Notes</label>
                <input
                  id="new-student-notes"
                  type="text"
                  className="input-control"
                  placeholder="e.g. NVDA User • Phase 1 Touch Typing Learner"
                  value={newStudentNotes}
                  onChange={(e) => setNewStudentNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsNewStudentModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
