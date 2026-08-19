import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TypingEngineConfig, TypingEngineState, TypingStatus, Progress } from '../types';
import { useSoundEffects } from './useSoundEffects';

interface UseTypingEngineProps extends TypingEngineConfig {
  studentId?: string;
  assignmentId?: string;
}

export function useTypingEngine({
  drills = ['the quick brown fox jumps over the lazy dog'],
  targetReps = 3,
  timeLimitMinutes = 2,
  studentId = 'student-1',
  assignmentId = 'assignment-1',
  onRepComplete,
  onSessionComplete,
  onTimeExpired,
  audioFeedbackEnabled = true,
}: UseTypingEngineProps) {
  // Normalize drills to ensure we have at least one valid drill
  const normalizedDrills = useMemo(() => {
    const valid = drills.filter((d) => typeof d === 'string' && d.trim().length > 0);
    return valid.length > 0 ? valid : ['asdf jkl;'];
  }, [drills]);

  const [currentDrillIndex, setCurrentDrillIndex] = useState<number>(0);
  const currentDrillText = normalizedDrills[currentDrillIndex] || normalizedDrills[0];

  // Tokenize drill text into words (preserving punctuation if any)
  const drillWords = useMemo(() => {
    return currentDrillText.trim().split(/\s+/).filter(Boolean);
  }, [currentDrillText]);

  // Core Engine State
  const [currentRep, setCurrentRep] = useState<number>(1);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [currentCharIndex, setCurrentCharIndex] = useState<number>(0);
  const [inputBuffer, setInputBuffer] = useState<string>('');
  
  // Timing
  const initialTimeRemaining = timeLimitMinutes > 0 ? timeLimitMinutes * 60 : 0;
  const [timeRemaining, setTimeRemaining] = useState<number>(initialTimeRemaining);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [status, setStatus] = useState<TypingStatus>('idle');

  // Metrics
  const [totalCorrect, setTotalCorrect] = useState<number>(0);
  const [totalErrors, setTotalErrors] = useState<number>(0);

  // Screen Reader Live Announcements
  const [prompterMessage, setPrompterMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Sound effects
  const {
    playKeySound,
    playErrorSound,
    playWordCompleteSound,
    playRepCompleteSound,
    playGrandCompleteSound,
    playTimeExpiredSound,
  } = useSoundEffects(audioFeedbackEnabled);

  // Derive Current Word and Expected Character
  const currentWord = drillWords[currentWordIndex] || '';
  
  // Expected char is the character at currentCharIndex of currentWord, or Space if at the end of word
  const expectedChar = useMemo(() => {
    if (!currentWord) return '';
    if (currentCharIndex < currentWord.length) {
      return currentWord[currentCharIndex];
    }
    // At the end of word, if not the last word, expect space.
    // If it is the last word, space completes the rep.
    return ' ';
  }, [currentWord, currentCharIndex]);

  // Derived Live Metrics
  const accuracy = useMemo(() => {
    const total = totalCorrect + totalErrors;
    if (total === 0) return 100;
    return Math.max(0, Math.min(100, Math.round((totalCorrect / total) * 100)));
  }, [totalCorrect, totalErrors]);

  const wpm = useMemo(() => {
    if (timeElapsed <= 0 || totalCorrect === 0) return 0;
    const minutes = timeElapsed / 60;
    // Standard typing formula: (correct characters / 5) / minutes
    const words = totalCorrect / 5;
    return Math.max(0, Math.round(words / minutes));
  }, [timeElapsed, totalCorrect]);

  // Announce Prompter whenever currentWord changes
  useEffect(() => {
    if (status === 'running' && currentWord) {
      // Injects "Target: [word]" into ARIA live region
      setPrompterMessage(`Target: ${currentWord}`);
    }
  }, [currentWordIndex, currentWord, status]);

  // Countdown and Elapsed Timer Loop
  useEffect(() => {
    if (status === 'running') {
      timerIntervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);

        if (timeLimitMinutes > 0) {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              // Timer expired! Lock session
              clearInterval(timerIntervalRef.current!);
              setStatus('time_expired');
              setStatusMessage('Time expired. Session locked.');
              playTimeExpiredSound();
              
              if (onTimeExpired) {
                onTimeExpired({
                  studentId,
                  assignmentId,
                  completedReps: currentRep - 1,
                  targetReps,
                  timeSpent: timeElapsed + 1,
                  accuracy,
                  wpm,
                  totalErrors,
                  totalKeystrokes: totalCorrect + totalErrors,
                  completed: false,
                  timestamp: new Date().toISOString(),
                });
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [
    status,
    timeLimitMinutes,
    timeElapsed,
    currentRep,
    targetReps,
    accuracy,
    wpm,
    totalErrors,
    totalCorrect,
    studentId,
    assignmentId,
    onTimeExpired,
    playTimeExpiredSound,
  ]);

  // Reset / Reconfigure when props change
  const resetEngine = useCallback((newDrillIndex: number = 0) => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);

    setCurrentDrillIndex(newDrillIndex);
    setCurrentRep(1);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setInputBuffer('');
    setTimeRemaining(timeLimitMinutes > 0 ? timeLimitMinutes * 60 : 0);
    setTimeElapsed(0);
    setTotalCorrect(0);
    setTotalErrors(0);
    setStatus('idle');
    setPrompterMessage('');
    setErrorMessage('');
    setStatusMessage('Session reset. Ready to begin.');
  }, [timeLimitMinutes]);

  // Start Session
  const startSession = useCallback(() => {
    setStatus('running');
    startTimeRef.current = Date.now();
    const firstWord = drillWords[0] || '';
    setPrompterMessage(`Target: ${firstWord}`);
    setStatusMessage(`Practice started. Rep 1 of ${targetReps}. Type the target word.`);
  }, [drillWords, targetReps]);

  // Pause / Resume Session
  const togglePause = useCallback(() => {
    if (status === 'running') {
      setStatus('paused');
      setStatusMessage('Practice paused. Press Alt+P or space to resume.');
    } else if (status === 'paused') {
      setStatus('running');
      setStatusMessage('Practice resumed.');
      setPrompterMessage(`Target: ${currentWord}`);
    }
  }, [status, currentWord]);

  // Error Handler helper with 500ms auto-clear
  const triggerError = useCallback((_charTyped?: string) => {
    setTotalErrors((prev) => prev + 1);
    playErrorSound();

    // Set brief assertive error state
    setErrorMessage('Error');

    // Clear error message after 500ms
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage('');
    }, 500);
  }, [playErrorSound]);

  // Key Interception and Evaluation Handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // If session is not running, ignore or handle Alt shortcuts
    if (status !== 'running') {
      if (status === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        startSession();
      }
      return;
    }

    // 1. Instantly invoke e.preventDefault() for Backspace and Delete
    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      // Inform the user / screen reader
      triggerError(e.key);
      return;
    }

    // Ignore modifier keys, functional keys, tab, escape
    if (
      e.altKey ||
      e.ctrlKey ||
      e.metaKey ||
      e.key === 'Shift' ||
      e.key === 'CapsLock' ||
      e.key === 'Control' ||
      e.key === 'Alt' ||
      e.key === 'Meta' ||
      e.key === 'Tab' ||
      e.key === 'Escape' ||
      e.key.startsWith('Arrow') ||
      e.key.startsWith('F') && e.key.length > 1
    ) {
      return;
    }

    // Always prevent default typing into input box so we manage buffer explicitly
    e.preventDefault();

    const key = e.key;

    // Handle Spacebar
    if (key === ' ' || key === 'Spacebar') {
      // Spacebar is expected if the student finished typing the current word
      if (currentCharIndex >= currentWord.length) {
        // Correct space! Advance to next word
        playWordCompleteSound();
        setTotalCorrect((prev) => prev + 1);
        setInputBuffer('');

        const nextWordIndex = currentWordIndex + 1;

        if (nextWordIndex >= drillWords.length) {
          // Entire drill completed for this repetition!
          const nextRep = currentRep + 1;

          if (nextRep > targetReps) {
            // All target repetitions completed!
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setStatus('completed');
            playGrandCompleteSound();
            
            const finalStats: Progress = {
              studentId,
              assignmentId,
              completedReps: targetReps,
              targetReps,
              timeSpent: timeElapsed,
              accuracy,
              wpm,
              totalErrors,
              totalKeystrokes: totalCorrect + 1 + totalErrors,
              completed: true,
              timestamp: new Date().toISOString(),
            };

            setStatusMessage(`Congratulations! All ${targetReps} reps completed successfully in ${Math.floor(timeElapsed / 60)} minutes and ${timeElapsed % 60} seconds with ${accuracy}% accuracy!`);

            if (onSessionComplete) {
              onSessionComplete(finalStats);
            }
          } else {
            // Rep completed, start next rep
            setCurrentRep(nextRep);
            setCurrentWordIndex(0);
            setCurrentCharIndex(0);
            playRepCompleteSound();
            
            const repMsg = `Rep ${currentRep} complete. Starting rep ${nextRep} of ${targetReps}.`;
            setStatusMessage(repMsg);
            
            if (onRepComplete) {
              onRepComplete(currentRep, {
                completedReps: currentRep,
                timeSpent: timeElapsed,
                accuracy,
                wpm,
              });
            }
          }
        } else {
          // Advance to next word within same repetition
          setCurrentWordIndex(nextWordIndex);
          setCurrentCharIndex(0);
        }
      } else {
        // Spacebar pressed prematurely
        triggerError(' ');
      }
      return;
    }

    // Handle standard character input (length === 1)
    if (key.length === 1) {
      if (currentCharIndex < currentWord.length) {
        const expected = currentWord[currentCharIndex];
        
        if (key === expected) {
          // Success! Matched expected character
          playKeySound();
          setTotalCorrect((prev) => prev + 1);
          setInputBuffer((prev) => prev + key);
          setCurrentCharIndex((prev) => prev + 1);

          // If this was the last character of the word AND it's the last word of the drill,
          // check if we require space or can complete on word finish
          if (currentCharIndex + 1 >= currentWord.length && currentWordIndex === drillWords.length - 1) {
            // Screen reader hint: press space to finish rep
            // Let the expectedChar become ' ' so user presses spacebar to confirm rep completion
          }
        } else {
          // Mismatched character
          triggerError(key);
        }
      } else {
        // Current word is already full; expecting spacebar
        triggerError(key);
      }
    }
  }, [
    status,
    currentWord,
    currentCharIndex,
    currentWordIndex,
    drillWords,
    currentRep,
    targetReps,
    timeElapsed,
    accuracy,
    wpm,
    totalErrors,
    totalCorrect,
    studentId,
    assignmentId,
    startSession,
    triggerError,
    playKeySound,
    playWordCompleteSound,
    playRepCompleteSound,
    playGrandCompleteSound,
    onRepComplete,
    onSessionComplete,
  ]);

  const state: TypingEngineState = {
    currentRep,
    targetReps,
    timeRemaining,
    timeElapsed,
    timeLimitMinutes,
    status,
    currentDrillIndex,
    currentWordIndex,
    currentCharIndex,
    currentDrillText,
    drillWords,
    currentWord,
    expectedChar,
    inputBuffer,
    totalCorrect,
    totalErrors,
    wpm,
    accuracy,
    prompterMessage,
    errorMessage,
    statusMessage,
  };

  return {
    state,
    startSession,
    togglePause,
    resetEngine,
    handleKeyDown,
    setCurrentDrillIndex,
  };
}
