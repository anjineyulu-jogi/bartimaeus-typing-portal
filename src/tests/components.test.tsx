import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AriaLiveAnnouncer } from '../components/common/AriaLiveAnnouncer';
import { AccessibleInputTrap } from '../components/typing/AccessibleInputTrap';
import { StudentPortal } from '../components/student/StudentPortal';
import { InstructorPortal } from '../components/instructor/InstructorPortal';
import { AuthModal } from '../components/auth/AuthModal';
import { DEFAULT_ASSIGNMENTS, DEFAULT_USERS } from '../data/defaultCurriculum';
import { User, Progress } from '../types';

describe('Accessibility Components, Auth & Sequential Locking', () => {
  it('1. AriaLiveAnnouncer correctly renders polite prompter, assertive error, and polite status', () => {
    render(
      <AriaLiveAnnouncer
        prompterMessage="Target: keyboard"
        errorMessage="Error"
        statusMessage="Rep 1 complete. Starting rep 2."
      />
    );

    const prompter = screen.getByText('Target: keyboard');
    expect(prompter).toBeDefined();
    expect(prompter.getAttribute('aria-live')).toBe('polite');
    expect(prompter.getAttribute('aria-atomic')).toBe('true');

    const errorAlert = screen.getByText('Error');
    expect(errorAlert).toBeDefined();
    expect(errorAlert.getAttribute('aria-live')).toBe('assertive');

    const statusAnnouncer = screen.getByText('Rep 1 complete. Starting rep 2.');
    expect(statusAnnouncer).toBeDefined();
    expect(statusAnnouncer.getAttribute('aria-live')).toBe('polite');
  });

  it('2. AccessibleInputTrap renders visually hidden input with opacity: 0 and position: absolute', () => {
    const handleKeyDown = vi.fn();
    render(
      <AccessibleInputTrap
        status="running"
        inputBuffer="test"
        onKeyDown={handleKeyDown}
        expectedChar="a"
        currentWord="apple"
      />
    );

    const input = screen.getByLabelText(/Typing input. Target: apple/i) as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.style.opacity).toBe('0');
    expect(input.style.position).toBe('absolute');
    expect(input.style.display).not.toBe('none');
    expect(input.style.visibility).not.toBe('hidden');
  });

  it('3. StudentPortal strictly unlocks Lesson 1 and locks Lesson 2 until Lesson 1 is completed', () => {
    const onSelectMock = vi.fn();
    const studentUser: User = DEFAULT_USERS.find((u) => u.role === 'Student') || DEFAULT_USERS[2]; // Aarav Sharma

    // No progress yet
    const { rerender } = render(
      <StudentPortal
        currentUser={studentUser}
        assignments={DEFAULT_ASSIGNMENTS}
        progressList={[]}
        onSelectAssignment={onSelectMock}
      />
    );

    expect(screen.getByText(/Welcome, Aarav Sharma/i)).toBeDefined();
    expect(screen.getByText(/CURRENT REQUIRED LESSON/i)).toBeDefined();

    // Lesson 1 should be unlocked
    const lesson1StartBtn = screen.getByRole('button', { name: /Practice Lesson 01: Home Row Anchor Keys/i });
    expect(lesson1StartBtn).toBeDefined();
    expect(lesson1StartBtn.hasAttribute('disabled')).toBe(false);

    // Lesson 2 should be locked
    const lesson2LockedBtn = screen.getByRole('button', { name: /Locked. Complete Lesson 1 first to unlock./i });
    expect(lesson2LockedBtn).toBeDefined();
    expect(lesson2LockedBtn.hasAttribute('disabled')).toBe(true);

    // Now simulate Lesson 1 completed with 95% accuracy
    const passedProgress: Progress[] = [
      {
        studentId: studentUser.id,
        assignmentId: DEFAULT_ASSIGNMENTS[0].id,
        completedReps: 10,
        targetReps: 10,
        timeSpent: 120,
        accuracy: 95,
        wpm: 35,
        totalErrors: 2,
        totalKeystrokes: 200,
        completed: true,
        passed: true,
        timestamp: new Date().toISOString(),
      },
    ];

    rerender(
      <StudentPortal
        currentUser={studentUser}
        assignments={DEFAULT_ASSIGNMENTS}
        progressList={passedProgress}
        onSelectAssignment={onSelectMock}
      />
    );

    // Now Lesson 2 should be unlocked!
    const lesson2UnlockedBtn = screen.getByRole('button', { name: /Practice Lesson 02: Home Row Word Construction/i });
    expect(lesson2UnlockedBtn).toBeDefined();
    expect(lesson2UnlockedBtn.hasAttribute('disabled')).toBe(false);
  });

  it('4. Curriculum verification: Every lesson has at least 10 drills and 10 target reps', () => {
    DEFAULT_ASSIGNMENTS.forEach((assignment) => {
      expect(assignment.targetReps).toBeGreaterThanOrEqual(10);
      expect(assignment.drills.length).toBeGreaterThanOrEqual(10);
      expect(assignment.orderIndex).toBeGreaterThanOrEqual(1);
    });
  });

  it('5. AuthModal handles registration and role validation', async () => {
    const onLoginSuccessMock = vi.fn();
    render(<AuthModal onLoginSuccess={onLoginSuccessMock} />);

    expect(screen.getByText(/Bartimaeus Resource Centre/i)).toBeDefined();
    expect(screen.getByRole('tab', { name: /Sign In/i })).toBeDefined();

    // Switch to Register Tab
    const registerTab = screen.getByRole('tab', { name: /First-Time Setup/i });
    fireEvent.click(registerTab);

    expect(screen.getByLabelText(/Full Name/i)).toBeDefined();
    expect(screen.getByLabelText(/Account Role/i)).toBeDefined();

    // Fill registration form
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Kavya Student' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Complete setup and enter portal/i }));

    await waitFor(() => {
      expect(onLoginSuccessMock).toHaveBeenCalled();
    });
  });

  it('6. InstructorPortal renders curriculum and manages students and staff', () => {
    const onSaveAssignmentMock = vi.fn();
    const onDeleteAssignmentMock = vi.fn();
    const onAddUserMock = vi.fn();
    const superAdminUser: User = DEFAULT_USERS[0];

    const { rerender } = render(
      <InstructorPortal
        currentUser={superAdminUser}
        users={DEFAULT_USERS}
        assignments={DEFAULT_ASSIGNMENTS}
        progressList={[]}
        onSaveAssignment={onSaveAssignmentMock}
        onDeleteAssignment={onDeleteAssignmentMock}
        onAddUser={onAddUserMock}
      />
    );

    expect(screen.getByText(/SuperAdmin Master Administration Hub/i)).toBeDefined();
    expect(screen.getByText(/Sequential Curriculum/i)).toBeDefined();
    expect(screen.getByRole('tab', { name: /Staff Instructors/i })).toBeDefined();

    // Verify Teacher role does not see Staff Instructors tab
    const staffTeacherUser: User = DEFAULT_USERS[1];
    rerender(
      <InstructorPortal
        currentUser={staffTeacherUser}
        users={DEFAULT_USERS}
        assignments={DEFAULT_ASSIGNMENTS}
        progressList={[]}
        onSaveAssignment={onSaveAssignmentMock}
        onDeleteAssignment={onDeleteAssignmentMock}
        onAddUser={onAddUserMock}
      />
    );
    expect(screen.queryByRole('tab', { name: /Staff Instructors/i })).toBeNull();

    // Click Create Lesson
    const createBtn = screen.getByRole('button', { name: /Create New Typing Assignment/i });
    fireEvent.click(createBtn);

    expect(screen.getByText(/Create New Lesson/i)).toBeDefined();
    expect(screen.getByLabelText(/Lesson Title/i)).toBeDefined();
    expect(screen.getByLabelText(/Sequential Order Index/i)).toBeDefined();
    expect(screen.getByLabelText(/Target Reps/i)).toBeDefined();
  });
});
