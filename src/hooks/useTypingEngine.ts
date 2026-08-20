import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { TypingEngineConfig, TypingEngineState, TypingStatus, Progress } from '../types';
import { useSoundEffects } from './useSoundEffects';

/**
 * Phonetic / Accessible Character Name Mapper for Screen Readers (NVDA / JAWS / VoiceOver).
 * Translates symbols, punctuation, whitespace, and capital letters into clear spoken names.
 */
export function getAccessibleCharName(char: string): string {
  if (!char) return '';
  if (char === ' ') return 'space';

  const symbolMap: Record<string, string> = {
    ';': 'semicolon',
    ':': 'colon',
    ',': 'comma',
    '.': 'period',
    '?': 'question mark',
    '!': 'exclamation mark',
    "'": 'apostrophe',
    '"': 'quote',
    '/': 'slash',
    '\\': 'backslash',
    '-': 'hyphen',
    '_': 'underscore',
    '+': 'plus',
    '=': 'equals',
    '<': 'less than',
    '>': 'greater than',
    '@': 'at sign',
    '#': 'hash',
    '$': 'dollar sign',
    '%': 'percent',
    '^': 'caret',
    '&': 'ampersand',
    '*': 'asterisk',
    '(': 'open parenthesis',
    ')': 'close parenthesis',
    '[': 'open bracket',
    ']': 'close bracket',
    '{': 'open brace',
    '}': 'close brace',
    '|': 'vertical bar',
    '~': 'tilde',
    '`': 'backtick',
  };

  if (symbolMap[char]) {
    return symbolMap[char];
  }

  if (char.length === 1) {
    if (char >= 'A' && char <= 'Z') {
      return `capital ${char.toLowerCase()}`;
    }
    return char.toLowerCase();
  }

  return char;
}

/**
 * Formats a target word for clear screen reader pronunciation.
 * Non-dictionary letter clusters (e.g. "asdf", "jkl;", "fdsa", "aaa") are formatted with spaces/names
 * so screen readers pronounce each individual letter rather than slurring.
 */
export function formatWordForSpeech(word: string): string {
  if (!word) return '';

  const hasSymbol = /[^a-zA-Z0-9]/.test(word);
  const isAllSameChar = word.length > 1 && /^([a-zA-Z0-9])\1+$/.test(word);
  const isAnchorSequence = /^(asdf|jkl|fdsa|lkj|fjdk|sl;a|a;sldkfj|qwer|tyui|op|zxcv|bnm|;;;|,,,|\.\.\.)/i.test(word);

  const commonWords = new Set([
    'a', 'ad', 'ah', 'all', 'as', 'ask', 'dad', 'dash', 'fad', 'fall', 'flag', 'flash', 'flask',
    'glad', 'had', 'half', 'hall', 'has', 'hash', 'lad', 'lag', 'lash', 'sad', 'salad', 'shall',
    'slag', 'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'and', 'in', 'to', 'for',
    'it', 'is', 'on', 'at', 'be', 'by', 'we', 'he', 'she', 'they', 'you', 'me', 'my', 'her', 'his',
  ]);

  if (hasSymbol || isAllSameChar || isAnchorSequence || (!commonWords.has(word.toLowerCase()) && !/^[a-z]{3,7}$/i.test(word))) {
    return word.split('').map(getAccessibleCharName).join(' ');
  }

  return word;
}

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

  // Tokenize drill text into words
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

  // Screen Reader Live Announcements (ARIA live polite & assertive)
  const [prompterMessage, setPrompterMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Sound effects (Audio synthesized beeps/ticks/chimes)
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

  const expectedChar = useMemo(() => {
    if (!currentWord) return '';
    if (currentCharIndex < currentWord.length) {
      return currentWord[currentCharIndex];
    }
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
    const words = totalCorrect / 5;
    return Math.max(0, Math.round(words / minutes));
  }, [timeElapsed, totalCorrect]);

  // Announce Prompter whenever currentWord changes
  useEffect(() => {
    if (status === 'running' && currentWord) {
      const formattedWord = formatWordForSpeech(currentWord);
      const nextCharName = getAccessibleCharName(currentWord[0] || expectedChar);
      setPrompterMessage(`Target: ${formattedWord}. Next: ${nextCharName}`);
    }
  }, [currentWordIndex, currentWord, status, expectedChar]);

  // Timer Loop (Silent for Screen Readers - Only locks on time expiry)
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
  const resetEngine = useCallback(
    (newDrillIndex: number = 0) => {
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
    },
    [timeLimitMinutes]
  );

  // Start Session
  const startSession = useCallback(() => {
    setStatus('running');
    startTimeRef.current = Date.now();
    const firstWord = drillWords[0] || '';
    const formattedWord = formatWordForSpeech(firstWord);
    const firstKey = firstWord[0] ? getAccessibleCharName(firstWord[0]) : '';
    setPrompterMessage(`Target: ${formattedWord}. Next: ${firstKey}`);
    setStatusMessage(`Practice started. Rep 1 of ${targetReps}.`);
  }, [drillWords, targetReps]);

  // Pause / Resume Session
  const togglePause = useCallback(() => {
    if (status === 'running') {
      setStatus('paused');
      setStatusMessage('Practice paused. Press Alt+P or space to resume.');
    } else if (status === 'paused') {
      setStatus('running');
      setStatusMessage('Practice resumed.');
      const formattedWord = formatWordForSpeech(currentWord);
      const nextCharName = getAccessibleCharName(expectedChar);
      setPrompterMessage(`Target: ${formattedWord}. Next: ${nextCharName}`);
    }
  }, [status, currentWord, expectedChar]);

  // Immediate In-Place Error Correction Handler
  const triggerError = useCallback(
    (_charTyped?: string) => {
      setTotalErrors((prev) => prev + 1);
      playErrorSound();

      const expectedName = getAccessibleCharName(expectedChar);
      const errorText = `Wrong. Expected: ${expectedName}`;

      setErrorMessage(errorText);

      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      errorTimeoutRef.current = setTimeout(() => {
        setErrorMessage('');
      }, 1000);
    },
    [expectedChar, playErrorSound]
  );

  // Key Interception and Evaluation Handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (status !== 'running') {
        if (status === 'idle' && (e.key === ' ' || e.key === 'Enter')) {
          e.preventDefault();
          startSession();
        }
        return;
      }

      // Backspace & Delete disabled in non-visual typing pedagogy
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        triggerError(e.key);
        return;
      }

      // Allow Alt shortcuts (Alt+H, Alt+S, Alt+P, Alt+R, Alt+M, Alt+B) to bubble to window listener
      if (e.altKey) {
        return;
      }

      // Ignore other modifier keys, tab, escape, function keys
      if (
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
        (e.key.startsWith('F') && e.key.length > 1)
      ) {
        return;
      }

      e.preventDefault();

      const key = e.key;

      // Handle Spacebar
      if (key === ' ' || key === 'Spacebar') {
        if (currentCharIndex >= currentWord.length) {
          playWordCompleteSound();
          setTotalCorrect((prev) => prev + 1);
          setInputBuffer('');

          const nextWordIndex = currentWordIndex + 1;

          if (nextWordIndex >= drillWords.length) {
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

              setStatusMessage(`Congratulations! All ${targetReps} reps completed with ${accuracy}% accuracy!`);

              if (onSessionComplete) {
                onSessionComplete(finalStats);
              }
            } else {
              // Rep completed, start next rep
              setCurrentRep(nextRep);
              setCurrentWordIndex(0);
              setCurrentCharIndex(0);
              playRepCompleteSound();

              setStatusMessage(`Rep ${currentRep} complete. Starting rep ${nextRep} of ${targetReps}.`);

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
            playKeySound();
            setTotalCorrect((prev) => prev + 1);
            setInputBuffer((prev) => prev + key);
            setCurrentCharIndex((prev) => prev + 1);
          } else {
            triggerError(key);
          }
        } else {
          triggerError(key);
        }
      }
    },
    [
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
    ]
  );

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
