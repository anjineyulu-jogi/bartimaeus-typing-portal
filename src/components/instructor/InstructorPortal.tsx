import React, { useState, useMemo } from 'react';
import { Assignment, Progress, User, AssignmentCategory } from '../../types';
import {
  Plus,
  Edit3,
  Trash2,
  Download,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Search,
  BarChart3,
  KeyRound,
  RotateCcw,
  Shield,
  Crown,
  UserPlus,
  Database,
  UserCheck,
  UserX,
  Lock,
} from 'lucide-react';
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
  currentUser,
  users,
  assignments,
  progressList,
  onSaveAssignment,
  onDeleteAssignment,
  onAddUser,
}) => {
  const isSuperAdmin = currentUser.role === 'SuperAdmin';
  const [activeTab, setActiveTab] = useState<'assignments' | 'progress' | 'students' | 'instructors'>('assignments');

  // Assignment Form Modal State
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [editingAssignment, setEditingAssignment] = useState<Partial<Assignment> | null>(null);
  const [drillsInput, setDrillsInput] = useState<string>('');

  // New Student Modal State
  const [isNewStudentModalOpen, setIsNewStudentModalOpen] = useState<boolean>(false);
  const [newStudentName, setNewStudentName] = useState<string>('');
  const [newStudentPassword, setNewStudentPassword] = useState<string>('student');
  const [newStudentNotes, setNewStudentNotes] = useState<string>('');

  // New Staff Instructor Modal State (SuperAdmin only)
  const [isNewStaffModalOpen, setIsNewStaffModalOpen] = useState<boolean>(false);
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffPassword, setNewStaffPassword] = useState<string>('trainer123');
  const [newStaffEmail, setNewStaffEmail] = useState<string>('');
  const [newStaffNotes, setNewStaffNotes] = useState<string>('');

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState<string>('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string>('');

  // Progress Filters
  const [progressStudentFilter, setProgressStudentFilter] = useState<string>('all');
  const [progressSearch, setProgressSearch] = useState<string>('');

  const students = useMemo(() => users.filter((u) => u.role === 'Student'), [users]);
  const instructors = useMemo(() => users.filter((u) => u.role === 'Teacher' || u.role === 'SuperAdmin'), [users]);

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
        category: 'Category 1: Tactile Foundations & Home Row',
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
      category: (editingAssignment.category as AssignmentCategory) || 'Category 1: Tactile Foundations & Home Row',
      title: editingAssignment.title.trim(),
      description: editingAssignment.description?.trim() || '',
      drills: parsedDrills.length > 0 ? parsedDrills : ['asdf jkl; asdf jkl;'],
      targetReps: Math.max(1, Number(editingAssignment.targetReps) || 10),
      timeLimitMinutes: Number(editingAssignment.timeLimitMinutes) || 0,
      minAccuracy: Number(editingAssignment.minAccuracy) || 80,
      assignedTo: editingAssignment.assignedTo || ['all'],
      createdAt: editingAssignment.createdAt || new Date().toISOString().split('T')[0],
      createdBy: currentUser.name,
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
      isActive: true,
    };

    onAddUser(newStudent);
    setNewStudentName('');
    setNewStudentPassword('student');
    setNewStudentNotes('');
    setIsNewStudentModalOpen(false);
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    const newStaff: User = {
      id: `teacher-${Date.now()}`,
      name: newStaffName.trim(),
      role: 'Teacher',
      password: newStaffPassword.trim() || 'trainer123',
      email: newStaffEmail.trim() || 'staff@bartimaeus.org',
      notes: newStaffNotes.trim() || 'Staff Typing Instructor',
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    onAddUser(newStaff);
    setNewStaffName('');
    setNewStaffPassword('trainer123');
    setNewStaffEmail('');
    setNewStaffNotes('');
    setIsNewStaffModalOpen(false);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !resetNewPassword.trim()) return;

    resetModalUser.password = resetNewPassword.trim();
    setResetSuccessMessage(`Password updated successfully for ${resetModalUser.name}`);
    setTimeout(() => {
      setResetModalUser(null);
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
      'Timestamp',
      'Student Name',
      'Lesson Title',
      'Completed Reps',
      'Target Reps',
      'Accuracy (%)',
      'Speed (WPM)',
      'Time Spent (Seconds)',
      'Total Errors',
      'Passed (>= 80% & Reps Met)',
    ];

    const rows = progressList.map((p) => {
      const student = users.find((u) => u.id === p.studentId);
      const assign = assignments.find((a) => a.id === p.assignmentId);
      const passed = p.completed && (p.passed ?? p.accuracy >= 80) ? 'YES' : 'NO';

      return [
        `"${p.timestamp || ''}"`,
        `"${student?.name || p.studentId}"`,
        `"${assign?.title || p.assignmentId}"`,
        p.completedReps,
        p.targetReps,
        p.accuracy,
        p.wpm,
        p.timeSpent,
        p.totalErrors,
        passed,
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

  // SuperAdmin: Full System Database Backup JSON
  const handleExportDatabaseJSON = () => {
    const backupData = {
      institution: 'Bartimaeus Resource Centre',
      exportDate: new Date().toISOString(),
      exportedBy: currentUser.name,
      users,
      assignments,
      progressList,
    };

    const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute(
      'download',
      `Bartimaeus_Complete_Database_Backup_${new Date().toISOString().split('T')[0]}.json`
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
            <h1 className="instructor-title" style={{ margin: 0 }}>
              {isSuperAdmin ? 'SuperAdmin Master Administration Hub' : 'Instructor Management Portal'}
            </h1>
            {isSuperAdmin ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: '#ffd700',
                  color: '#000',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <Crown size={14} aria-hidden="true" /> Super Administrator
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  background: '#2563eb',
                  color: '#fff',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                <Shield size={14} aria-hidden="true" /> Staff Instructor
              </span>
            )}
          </div>
          <p className="instructor-subtitle">
            {isSuperAdmin
              ? 'Unrestricted System Authority • Staff Instructor Management • Curriculum Engine & Full Audit Logs'
              : 'Curriculum Configuration • 10-Repetition Sequential Pathways & Student Performance Analytics'}
          </p>
        </div>

        <div className="instructor-quick-actions">
          {isSuperAdmin && (
            <button
              onClick={handleExportDatabaseJSON}
              className="btn btn-secondary"
              aria-label="Backup full database as JSON"
              title="Download entire system database snapshot (Users, Curriculum, Progress)"
            >
              <Database size={18} aria-hidden="true" />
              <span>Backup Database</span>
            </button>
          )}

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

        {/* Tab 4: Staff Management (SuperAdmin Exclusive) */}
        {isSuperAdmin && (
          <button
            role="tab"
            aria-selected={activeTab === 'instructors'}
            className={`inst-tab-btn ${activeTab === 'instructors' ? 'active' : ''}`}
            onClick={() => setActiveTab('instructors')}
          >
            <Crown size={18} aria-hidden="true" />
            <span>Staff Instructors ({instructors.length})</span>
          </button>
        )}
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
                  if (
                    window.confirm(
                      'Sync and reload the complete 28-lesson official curriculum across all 7 categories?'
                    )
                  ) {
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
                {sortedAssignments.map((assign) => {
                  const isCore = assign.id.startsWith('assign-');
                  const canDelete = isSuperAdmin || !isCore;

                  return (
                    <tr key={assign.id}>
                      <td>
                        <div className="assign-order-cell">
                          <span className="order-pill">#{assign.orderIndex}</span>
                          <div>
                            <span className="assign-table-title">{assign.title}</span>
                            {assign.description && (
                              <p className="assign-table-desc">{assign.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-category">{assign.category}</span>
                      </td>
                      <td>
                        <span className="badge badge-reps">
                          <Target size={14} aria-hidden="true" /> {assign.targetReps} reps
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-time">
                          <Clock size={14} aria-hidden="true" />{' '}
                          {assign.timeLimitMinutes > 0 ? `${assign.timeLimitMinutes} min` : 'Untimed'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-drills">{assign.drills.length} lines</span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => handleOpenEditAssignment(assign)}
                            className="btn-icon btn-icon-edit"
                            aria-label={`Edit assignment ${assign.title}`}
                            title="Edit Assignment"
                          >
                            <Edit3 size={16} aria-hidden="true" />
                          </button>
                          {canDelete ? (
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${assign.title}"?`)) {
                                  onDeleteAssignment(assign.id);
                                }
                              }}
                              className="btn-icon btn-icon-danger"
                              aria-label={`Delete assignment ${assign.title}`}
                              title="Delete Assignment"
                            >
                              <Trash2 size={16} aria-hidden="true" />
                            </button>
                          ) : (
                            <button
                              disabled
                              style={{ opacity: 0.35, cursor: 'not-allowed' }}
                              className="btn-icon"
                              title="Core Official Lesson (SuperAdmin only)"
                              aria-label="Core lesson cannot be deleted by staff"
                            >
                              <Lock size={16} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

            <div className="filter-group filter-search">
              <label htmlFor="progress-search-input">Search Records:</label>
              <div className="search-input-box">
                <Search size={16} aria-hidden="true" />
                <input
                  id="progress-search-input"
                  type="text"
                  className="input-control"
                  placeholder="Search by student or lesson title..."
                  value={progressSearch}
                  onChange={(e) => setProgressSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="assignments-table-wrapper">
            <table className="inst-table" aria-label="Student progress records table">
              <thead>
                <tr>
                  <th scope="col">Date / Time</th>
                  <th scope="col">Student</th>
                  <th scope="col">Assignment</th>
                  <th scope="col">Reps Completed</th>
                  <th scope="col">Accuracy</th>
                  <th scope="col">Speed (WPM)</th>
                  <th scope="col">Time Spent</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredProgress.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-table-cell">
                      No practice records found matching the criteria.
                    </td>
                  </tr>
                ) : (
                  filteredProgress.map((prog, idx) => {
                    const studentObj = users.find((u) => u.id === prog.studentId);
                    const assignObj = assignments.find((a) => a.id === prog.assignmentId);
                    const isPassed = prog.completed && (prog.passed ?? prog.accuracy >= 80);

                    return (
                      <tr key={prog.id || idx}>
                        <td>
                          <span className="timestamp-text">
                            {prog.timestamp ? new Date(prog.timestamp).toLocaleString() : 'Recent'}
                          </span>
                        </td>
                        <td>
                          <span className="student-cell-name">{studentObj?.name || prog.studentId}</span>
                        </td>
                        <td>
                          <span className="assign-cell-title">{assignObj?.title || prog.assignmentId}</span>
                        </td>
                        <td>
                          <span className="badge badge-reps">
                            {prog.completedReps} / {prog.targetReps} reps
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              prog.accuracy >= 90
                                ? 'badge-high'
                                : prog.accuracy >= 80
                                ? 'badge-med'
                                : 'badge-low'
                            }`}
                          >
                            {prog.accuracy}%
                          </span>
                        </td>
                        <td>
                          <span className="badge badge-wpm">{prog.wpm} WPM</span>
                        </td>
                        <td>
                          <span className="badge badge-time">
                            {Math.floor(prog.timeSpent / 60)}m {prog.timeSpent % 60}s
                          </span>
                        </td>
                        <td>
                          {isPassed ? (
                            <span className="badge badge-success">
                              <CheckCircle2 size={14} aria-hidden="true" /> Passed (Unlocked Next)
                            </span>
                          ) : (
                            <span className="badge badge-pending">
                              <XCircle size={14} aria-hidden="true" /> Attempted ({prog.accuracy}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: Student Roster */}
      {activeTab === 'students' && (
        <section className="inst-tab-content" aria-labelledby="students-tab-heading">
          <div className="section-toolbar">
            <h2 id="students-tab-heading" className="section-title">
              Enrolled Student Roster ({students.length})
            </h2>
            <button
              onClick={() => setIsNewStudentModalOpen(true)}
              className="btn btn-primary btn-sm"
              aria-label="Add new student"
            >
              <Plus size={16} aria-hidden="true" /> Add Student
            </button>
          </div>

          <div className="students-grid">
            {students.map((student) => {
              const studentProgress = progressList.filter((p) => p.studentId === student.id);
              const completedCount = studentProgress.filter(
                (p) => p.completed && (p.passed ?? p.accuracy >= 80)
              ).length;
              const avgAccuracy =
                studentProgress.length > 0
                  ? Math.round(
                      studentProgress.reduce((acc, c) => acc + c.accuracy, 0) / studentProgress.length
                    )
                  : 0;
              const maxWpm =
                studentProgress.length > 0 ? Math.max(...studentProgress.map((p) => p.wpm)) : 0;

              return (
                <div key={student.id} className="student-profile-card">
                  <div className="student-card-header">
                    <div className="student-avatar" aria-hidden="true">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="student-card-name">{student.name}</h3>
                      <span className="student-card-email">{student.email || 'Bartimaeus Learner'}</span>
                    </div>
                  </div>

                  {student.notes && <p className="student-card-notes">{student.notes}</p>}

                  <div className="student-card-metrics">
                    <div className="student-metric-box">
                      <span className="metric-label">Passed Lessons</span>
                      <span className="metric-val">
                        {completedCount} / {sortedAssignments.length}
                      </span>
                    </div>
                    <div className="student-metric-box">
                      <span className="metric-label">Avg Accuracy</span>
                      <span className="metric-val">{avgAccuracy}%</span>
                    </div>
                    <div className="student-metric-box">
                      <span className="metric-label">Top Speed</span>
                      <span className="metric-val">{maxWpm} WPM</span>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setResetModalUser(student);
                        setResetNewPassword('');
                        setResetSuccessMessage('');
                      }}
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

      {/* TAB 4: Staff Instructor Management (SuperAdmin Exclusive) */}
      {isSuperAdmin && activeTab === 'instructors' && (
        <section className="inst-tab-content" aria-labelledby="instructors-tab-heading">
          <div className="section-toolbar">
            <h2 id="instructors-tab-heading" className="section-title">
              👑 Staff Instructor Team & Administrative Access Controls ({instructors.length})
            </h2>
            <button
              onClick={() => setIsNewStaffModalOpen(true)}
              className="btn btn-primary btn-sm"
              aria-label="Add new staff instructor"
            >
              <UserPlus size={16} aria-hidden="true" /> Add Staff Instructor
            </button>
          </div>

          <div className="assignments-table-wrapper">
            <table className="inst-table" aria-label="Staff Instructors Table">
              <thead>
                <tr>
                  <th scope="col">Instructor Name</th>
                  <th scope="col">Role & Access Level</th>
                  <th scope="col">Email</th>
                  <th scope="col">Notes</th>
                  <th scope="col">Registration Date</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {instructors.map((inst) => {
                  const isSelf = inst.id === currentUser.id;

                  return (
                    <tr key={inst.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: inst.role === 'SuperAdmin' ? '#ffd700' : '#2563eb',
                              color: inst.role === 'SuperAdmin' ? '#000' : '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                            }}
                          >
                            {inst.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.95rem' }}>{inst.name}</strong>
                            {isSelf && <span style={{ marginLeft: '0.4rem', color: '#ffd700', fontSize: '0.75rem' }}>(You)</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        {inst.role === 'SuperAdmin' ? (
                          <span className="badge" style={{ background: '#ffd700', color: '#000', fontWeight: 'bold' }}>
                            <Crown size={12} /> SuperAdmin (Master Authority)
                          </span>
                        ) : (
                          <span className="badge" style={{ background: '#2563eb', color: '#fff' }}>
                            <Shield size={12} /> Staff Instructor
                          </span>
                        )}
                      </td>
                      <td>
                        <span>{inst.email || 'staff@bartimaeus.org'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>{inst.notes || 'Instructor'}</span>
                      </td>
                      <td>
                        <span className="timestamp-text">
                          {inst.createdAt ? new Date(inst.createdAt).toLocaleDateString() : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            onClick={() => {
                              setResetModalUser(inst);
                              setResetNewPassword('');
                              setResetSuccessMessage('');
                            }}
                            className="btn btn-secondary btn-sm"
                            aria-label={`Reset password for instructor ${inst.name}`}
                            title="Reset Instructor Password"
                          >
                            <KeyRound size={14} aria-hidden="true" />
                            <span>Reset Password</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
                  placeholder="e.g. Lesson 29: Advanced Ergonomic Sentence Traversal"
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
                  <label htmlFor="assign-time-limit">Time Limit (Minutes)</label>
                  <input
                    id="assign-time-limit"
                    type="number"
                    min="0"
                    max="60"
                    className="input-control"
                    placeholder="0 = untimed"
                    value={editingAssignment.timeLimitMinutes || 0}
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
                <label htmlFor="assign-drills-textarea">
                  Typing Drills * <span className="help-text">(One phrase or sentence per line. Min 10 lines recommended)</span>
                </label>
                <textarea
                  id="assign-drills-textarea"
                  rows={8}
                  required
                  className="textarea-control"
                  placeholder="Type or paste drill lines here..."
                  value={drillsInput}
                  onChange={(e) => setDrillsInput(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="assign-desc-input">Description / Tactile Notes (Optional)</label>
                <input
                  id="assign-desc-input"
                  type="text"
                  className="input-control"
                  placeholder="e.g. Focus on keeping wrists elevated and index anchors aligned."
                  value={editingAssignment.description || ''}
                  onChange={(e) => setEditingAssignment({ ...editingAssignment, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsEditingModalOpen(false)} className="btn btn-secondary">
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

      {/* Add New Student Modal */}
      {isNewStudentModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-student-title">
          <div className="modal-box">
            <h2 id="add-student-title" className="modal-title">
              Enroll New Student
            </h2>

            <form onSubmit={handleAddStudentSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="student-name-input">Student Full Name *</label>
                <input
                  id="student-name-input"
                  type="text"
                  required
                  className="input-control"
                  placeholder="e.g. Priya Nair"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-pass-input">Initial Password *</label>
                <input
                  id="student-pass-input"
                  type="password"
                  required
                  className="input-control"
                  placeholder="Default password"
                  value={newStudentPassword}
                  onChange={(e) => setNewStudentPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="student-notes-input">Assistive Tech & Ergonomic Notes</label>
                <input
                  id="student-notes-input"
                  type="text"
                  className="input-control"
                  placeholder="e.g. JAWS Screen Reader User • Phase 1 Learner"
                  value={newStudentNotes}
                  onChange={(e) => setNewStudentNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsNewStudentModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Enroll Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Staff Instructor Modal (SuperAdmin Only) */}
      {isSuperAdmin && isNewStaffModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-staff-title">
          <div className="modal-box">
            <h2 id="add-staff-title" className="modal-title">
              👑 Add New Staff Instructor
            </h2>

            <form onSubmit={handleAddStaffSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="staff-name-input">Instructor Full Name *</label>
                <input
                  id="staff-name-input"
                  type="text"
                  required
                  className="input-control"
                  placeholder="e.g. Rajiv Menon"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="staff-email-input">Email Address</label>
                <input
                  id="staff-email-input"
                  type="email"
                  className="input-control"
                  placeholder="e.g. rajiv@bartimaeus.org"
                  value={newStaffEmail}
                  onChange={(e) => setNewStaffEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="staff-pass-input">Initial Login Password *</label>
                <input
                  id="staff-pass-input"
                  type="password"
                  required
                  className="input-control"
                  placeholder="Enter initial password"
                  value={newStaffPassword}
                  onChange={(e) => setNewStaffPassword(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="staff-notes-input">Role Notes / Department</label>
                <input
                  id="staff-notes-input"
                  type="text"
                  className="input-control"
                  placeholder="e.g. Primary Computer Typing Trainer"
                  value={newStaffNotes}
                  onChange={(e) => setNewStaffNotes(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setIsNewStaffModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Instructor Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal (User / Student / Instructor) */}
      {resetModalUser && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
          <div className="modal-box">
            <h2 id="reset-modal-title" className="modal-title">
              Reset Password for {resetModalUser.name}
            </h2>
            <p className="help-text">Role: {resetModalUser.role} ({resetModalUser.email || 'No email'})</p>

            {resetSuccessMessage ? (
              <div className="alert-box alert-success">
                <CheckCircle2 size={18} aria-hidden="true" />
                <span>{resetSuccessMessage}</span>
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit} className="modal-form">
                <div className="form-group">
                  <label htmlFor="reset-pass-input">New Password *</label>
                  <input
                    id="reset-pass-input"
                    type="password"
                    required
                    minLength={3}
                    className="input-control"
                    placeholder="Enter new password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setResetModalUser(null)} className="btn btn-secondary">
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
    </div>
  );
};
