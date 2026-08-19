import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTypingEngine } from '../hooks/useTypingEngine';

// Mock Web Audio API
class AudioContextMock {
  state = 'running';
  currentTime = 0;
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }
  resume = vi.fn();
}

(window as any).AudioContext = AudioContextMock;

describe('useTypingEngine Accessibility & Typing Core', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('1. Initializes with configurable properties (targetReps, timeLimitMinutes, drills)', () => {
    const { result } = renderHook(() =>
      useTypingEngine({
        drills: ['apple banana'],
        targetReps: 3,
        timeLimitMinutes: 2,
        audioFeedbackEnabled: false,
      })
    );

    expect(result.current.state.currentRep).toBe(1);
    expect(result.current.state.targetReps).toBe(3);
    expect(result.current.state.timeLimitMinutes).toBe(2);
    expect(result.current.state.timeRemaining).toBe(120);
    expect(result.current.state.status).toBe('idle');
    expect(result.current.state.currentWord).toBe('apple');
    expect(result.current.state.expectedChar).toBe('a');
  });

  it('2. Starts session and updates prompter message with Target: [word]', () => {
    const { result } = renderHook(() =>
      useTypingEngine({
        drills: ['hello world'],
        targetReps: 2,
        timeLimitMinutes: 3,
        audioFeedbackEnabled: false,
      })
    );

    act(() => {
      result.current.startSession();
    });

    expect(result.current.state.status).toBe('running');
    expect(result.current.state.prompterMessage).toBe('Target: hello');
    expect(result.current.state.statusMessage).toContain('Practice started. Rep 1 of 2.');
  });

  it('3. Intercepts Backspace and Delete, calls preventDefault, and triggers Error state', () => {
    const { result } = renderHook(() =>
      useTypingEngine({
        drills: ['test drill'],
        targetReps: 1,
        timeLimitMinutes: 1,
        audioFeedbackEnabled: false,
      })
    );

    act(() => {
      result.current.startSession();
    });

    const preventDefaultMock = vi.fn();
    const backspaceEvent = {
      key: 'Backspace',
      preventDefault: preventDefaultMock,
    } as unknown as React.KeyboardEvent<HTMLInputElement>;

    act(() => {
      result.current.handleKeyDown(backspaceEvent);
    });

    // Must call e.preventDefault()
    expect(preventDefaultMock).toHaveBeenCalled();
    // Must record error
    expect(result.current.state.totalErrors).toBe(1);
    // Must set assertive error message
    expect(result.current.state.errorMessage).toBe('Error');

    // After 500ms, error message must clear automatically
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.state.errorMessage).toBe('');
  });

  it('4. Evaluates typed keys against expectedChar and advances indices', () => {
    const { result } = renderHook(() =>
      useTypingEngine({
        drills: ['cat dog'],
        targetReps: 2,
        timeLimitMinutes: 2,
        audioFeedbackEnabled: false,
      })
    );

    act(() => {
      result.current.startSession();
    });

    expect(result.current.state.expectedChar).toBe('c');

    // Type 'c'
    act(() => {
      result.current.handleKeyDown({ key: 'c', preventDefault: vi.fn() } as any);
    });
    expect(result.current.state.currentCharIndex).toBe(1);
    expect(result.current.state.expectedChar).toBe('a');
    expect(result.current.state.inputBuffer).toBe('c');

    // Type 'a'
    act(() => {
      result.current.handleKeyDown({ key: 'a', preventDefault: vi.fn() } as any);
    });
    expect(result.current.state.currentCharIndex).toBe(2);
    expect(result.current.state.expectedChar).toBe('t');
    expect(result.current.state.inputBuffer).toBe('ca');

    // Type 't'
    act(() => {
      result.current.handleKeyDown({ key: 't', preventDefault: vi.fn() } as any);
    });
    expect(result.current.state.currentCharIndex).toBe(3);
    // Word is full, expected key is space
    expect(result.current.state.expectedChar).toBe(' ');

    // Type spacebar to complete word
    act(() => {
      result.current.handleKeyDown({ key: ' ', preventDefault: vi.fn() } as any);
    });

    // Advances to next word 'dog', clears input buffer
    expect(result.current.state.currentWordIndex).toBe(1);
    expect(result.current.state.currentWord).toBe('dog');
    expect(result.current.state.currentCharIndex).toBe(0);
    expect(result.current.state.inputBuffer).toBe('');
    expect(result.current.state.expectedChar).toBe('d');
    expect(result.current.state.prompterMessage).toBe('Target: dog');
  });

  it('5. Completes repetition and announces Rep 1 complete. Starting rep 2.', () => {
    const onRepCompleteMock = vi.fn();
    const onSessionCompleteMock = vi.fn();

    const { result } = renderHook(() =>
      useTypingEngine({
        drills: ['go'],
        targetReps: 2,
        timeLimitMinutes: 2,
        onRepComplete: onRepCompleteMock,
        onSessionComplete: onSessionCompleteMock,
        audioFeedbackEnabled: false,
      })
    );

    act(() => {
      result.current.startSession();
    });

    // Type 'g'
    act(() => {
      result.current.handleKeyDown({ key: 'g', preventDefault: vi.fn() } as any);
    });
    // Type 'o'
    act(() => {
      result.current.handleKeyDown({ key: 'o', preventDefault: vi.fn() } as any);
    });
    // Type space to finish rep 1
    act(() => {
      result.current.handleKeyDown({ key: ' ', preventDefault: vi.fn() } as any);
    });

    expect(result.current.state.currentRep).toBe(2);
    expect(result.current.state.statusMessage).toBe('Rep 1 complete. Starting rep 2 of 2.');
    expect(onRepCompleteMock).toHaveBeenCalledWith(1, expect.anything());

    // Complete Rep 2
    act(() => {
      result.current.handleKeyDown({ key: 'g', preventDefault: vi.fn() } as any);
    });
    act(() => {
      result.current.handleKeyDown({ key: 'o', preventDefault: vi.fn() } as any);
    });
    act(() => {
      result.current.handleKeyDown({ key: ' ', preventDefault: vi.fn() } as any);
    });

    expect(result.current.state.status).toBe('completed');
    expect(result.current.state.statusMessage).toContain('Congratulations! All 2 reps completed');
    expect(onSessionCompleteMock).toHaveBeenCalled();
  });

  it('6. Locks session and triggers status when timeLimit expires', () => {
    const onTimeExpiredMock = vi.fn();

    const { result } = renderHook(() =>
      useTypingEngine({
        drills: ['practice touch typing'],
        targetReps: 5,
        timeLimitMinutes: 1, // 60 seconds
        onTimeExpired: onTimeExpiredMock,
        audioFeedbackEnabled: false,
      })
    );

    act(() => {
      result.current.startSession();
    });

    expect(result.current.state.timeRemaining).toBe(60);

    // Advance 60 seconds
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    expect(result.current.state.status).toBe('time_expired');
    expect(result.current.state.statusMessage).toBe('Time expired. Session locked.');
    expect(onTimeExpiredMock).toHaveBeenCalled();
  });
});
