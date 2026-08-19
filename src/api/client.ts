import { Assignment, Progress, User } from '../types';
import {
  loadAssignments,
  loadProgress,
  loadUsers,
  saveAssignments,
  saveProgressRecord,
  saveUsers,
  saveSingleAssignment,
  deleteAssignment as deleteLocalAssignment,
} from '../data/storage';

const API_BASE = '/api';

/**
 * Universal API Client with automatic offline/localStorage fallback.
 * Guarantees zero downtime whether hosted on Render or run locally.
 */

// Helper to check if server API is reachable
async function isServerOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', credentials: 'omit' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiRegister(
  name: string,
  password: string,
  role: 'Student' | 'Teacher' = 'Student',
  notes?: string,
  teacherPasscode?: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    if (await isServerOnline()) {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password, role, notes, teacherPasscode }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      return { success: true, user: data.user };
    }
  } catch {
    // Fall back to local storage
  }

  // Local Storage Fallback
  const users = loadUsers();
  const existing = users.find((u) => u.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (existing) {
    return { success: false, error: 'An account with this name already exists. Please log in.' };
  }

  if (role === 'Teacher' && teacherPasscode !== 'bartimaeus2026' && teacherPasscode !== 'admin') {
    return { success: false, error: 'Invalid Teacher Access Passcode' };
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    name: name.trim(),
    role,
    password: password.trim(),
    notes: notes?.trim() || `${role} account`,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };

  users.push(newUser);
  saveUsers(users);

  return { success: true, user: newUser };
}

export async function apiLogin(
  name: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    if (await isServerOnline()) {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      return { success: true, user: data.user };
    }
  } catch {
    // Fall back to local storage
  }

  // Local Storage Fallback
  const users = loadUsers();
  const user = users.find(
    (u) => u.name.trim().toLowerCase() === name.trim().toLowerCase() && u.password === password.trim()
  );

  if (!user) {
    return { success: false, error: 'Invalid name or password. Please try again.' };
  }

  return { success: true, user };
}

export async function apiFetchCurriculum(): Promise<Assignment[]> {
  try {
    if (await isServerOnline()) {
      const res = await fetch(`${API_BASE}/curriculum`);
      if (res.ok) {
        const data = await res.json();
        if (data.assignments && data.assignments.length >= 28) {
          saveAssignments(data.assignments);
          return data.assignments;
        } else if (data.assignments && data.assignments.length > 0) {
          // If server has old curriculum, sync the full 28 default assignments to the server
          const localUpdated = loadAssignments();
          fetch(`${API_BASE}/curriculum/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assignments: localUpdated }),
          }).catch(() => {});
          return localUpdated;
        }
      }
    }
  } catch {
    // Fall back
  }
  return loadAssignments();
}

export async function apiFetchProgress(studentId: string): Promise<Progress[]> {
  try {
    if (await isServerOnline()) {
      const res = await fetch(`${API_BASE}/progress/${studentId}`);
      if (res.ok) {
        const data = await res.json();
        return data.progress || [];
      }
    }
  } catch {
    // Fall back
  }
  return loadProgress().filter((p) => p.studentId === studentId);
}

export async function apiSaveProgress(record: Progress): Promise<Progress[]> {
  try {
    if (await isServerOnline()) {
      await fetch(`${API_BASE}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
    }
  } catch {
    // Save locally
  }
  return saveProgressRecord(record);
}

export async function apiSaveAssignment(assignment: Assignment): Promise<Assignment[]> {
  try {
    if (await isServerOnline()) {
      const res = await fetch(`${API_BASE}/teacher/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignment),
      });
      if (res.ok) {
        const data = await res.json();
        saveAssignments(data.assignments);
        return data.assignments;
      }
    }
  } catch {
    // Save locally
  }
  return saveSingleAssignment(assignment);
}

export async function apiDeleteAssignment(id: string): Promise<Assignment[]> {
  try {
    if (await isServerOnline()) {
      const res = await fetch(`${API_BASE}/teacher/assignments/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        saveAssignments(data.assignments);
        return data.assignments;
      }
    }
  } catch {
    // Save locally
  }
  return deleteLocalAssignment(id);
}
