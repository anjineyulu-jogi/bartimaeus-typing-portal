import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { TypingStatus } from '../../types';

interface AccessibleInputTrapProps {
  status: TypingStatus;
  inputBuffer: string;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  expectedChar: string;
  currentWord: string;
}

export interface AccessibleInputTrapHandle {
  focus: () => void;
  blur: () => void;
  getInputElement: () => HTMLInputElement | null;
}

/**
 * The Accessible Hidden Input Trap
 * 
 * Requirements:
 * 1. Render a native <input type="text" />
 * 2. Hide it visually using `opacity: 0` and `position: absolute` (NEVER display: none or visibility: hidden)
 * 3. Force browser focus to remain on this input during active practice
 * 4. Pass down onKeyDown for character interception & evaluation
 */
export const AccessibleInputTrap = forwardRef<AccessibleInputTrapHandle, AccessibleInputTrapProps>(
  ({ status, inputBuffer, onKeyDown, expectedChar, currentWord }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      },
      blur: () => {
        if (inputRef.current) {
          inputRef.current.blur();
        }
      },
      getInputElement: () => inputRef.current,
    }));

    // Auto-focus and maintain focus trap during active practice
    useEffect(() => {
      if (status === 'running' && inputRef.current) {
        inputRef.current.focus({ preventScroll: true });

        const handleWindowBlur = () => {
          // If practice is running, maintain focus unless user explicitly clicked another interactive control
          if (status === 'running' && inputRef.current) {
            setTimeout(() => {
              if (document.activeElement?.tagName !== 'BUTTON' && 
                  document.activeElement?.tagName !== 'SELECT' && 
                  document.activeElement?.tagName !== 'A') {
                inputRef.current?.focus({ preventScroll: true });
              }
            }, 50);
          }
        };

        const handleGlobalClick = (e: MouseEvent) => {
          const target = e.target as HTMLElement;
          // If clicking anywhere outside specific modal buttons, return focus to typing trap
          if (status === 'running' && inputRef.current) {
            if (!target.closest('button, select, input:not(.hidden-typing-trap), a, textarea')) {
              inputRef.current.focus({ preventScroll: true });
            }
          }
        };

        window.addEventListener('blur', handleWindowBlur);
        document.addEventListener('click', handleGlobalClick);

        return () => {
          window.removeEventListener('blur', handleWindowBlur);
          document.removeEventListener('click', handleGlobalClick);
        };
      }
    }, [status]);

    return (
      <div className="input-trap-wrapper" style={{ position: 'relative', width: 0, height: 0 }}>
        <label htmlFor="bartimaeus-typing-trap" className="sr-only">
          Typing practice area. Target word is {currentWord || 'ready'}. Next expected character is {expectedChar === ' ' ? 'Space' : expectedChar}.
        </label>
        <input
          ref={inputRef}
          id="bartimaeus-typing-trap"
          type="text"
          className="hidden-typing-trap"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            opacity: 0,
            width: '1px',
            height: '1px',
            padding: 0,
            margin: 0,
            border: 'none',
            outline: 'none',
            zIndex: 1,
            pointerEvents: 'auto',
          }}
          value={inputBuffer}
          onChange={() => {
            // Evaluated explicitly in onKeyDown to prevent IME / uncontrolled mutations
          }}
          onKeyDown={onKeyDown}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          aria-autocomplete="none"
          aria-multiline="false"
          aria-label={`Typing input. Target: ${currentWord}. Expected: ${expectedChar === ' ' ? 'Spacebar' : expectedChar}`}
          disabled={status === 'completed' || status === 'time_expired'}
        />
      </div>
    );
  }
);

AccessibleInputTrap.displayName = 'AccessibleInputTrap';
