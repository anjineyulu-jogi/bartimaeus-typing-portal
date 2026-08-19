import React, { useEffect } from 'react';
import { X, Keyboard, Volume2, ShieldAlert } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-dialog-title"
    >
      <div className="modal-box shortcuts-dialog-box">
        <div className="dialog-header">
          <div className="dialog-title-group">
            <Keyboard size={24} aria-hidden="true" />
            <h2 id="shortcuts-dialog-title" className="modal-title">
              Keyboard Shortcuts & Screen Reader Guide
            </h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close shortcuts guide (Escape)"
            autoFocus
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="shortcuts-dialog-content">
          <div className="shortcuts-section">
            <h3 className="shortcuts-section-title">⚡ Practice Session Controls</h3>
            <table className="shortcuts-table" aria-label="Table of practice keyboard shortcuts">
              <thead>
                <tr>
                  <th scope="col">Shortcut</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><kbd>Alt</kbd> + <kbd>S</kbd> / <kbd>Space</kbd></td>
                  <td>Start or Resume Practice Session</td>
                </tr>
                <tr>
                  <td><kbd>Alt</kbd> + <kbd>P</kbd></td>
                  <td>Pause / Resume Practice</td>
                </tr>
                <tr>
                  <td><kbd>Alt</kbd> + <kbd>R</kbd></td>
                  <td>Reset Drill from Beginning</td>
                </tr>
                <tr>
                  <td><kbd>Alt</kbd> + <kbd>B</kbd></td>
                  <td>Back to Assignments List</td>
                </tr>
                <tr>
                  <td><kbd>Alt</kbd> + <kbd>M</kbd></td>
                  <td>Toggle Audio Cues On / Off</td>
                </tr>
                <tr>
                  <td><kbd>Alt</kbd> + <kbd>H</kbd></td>
                  <td>Open / Close this Shortcuts Guide</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="shortcuts-section">
            <h3 className="shortcuts-section-title">
              <ShieldAlert size={18} aria-hidden="true" /> Ergonomic Typing Rules
            </h3>
            <ul className="shortcuts-guide-list">
              <li>
                <strong>Backspace & Delete are Disabled:</strong> In non-visual touch-typing pedagogy, backspacing creates hesitation loops. If you make an error, the screen reader and sound synthesizers will alert you immediately. Simply type the correct expected character to advance.
              </li>
              <li>
                <strong>Target Word Prompter:</strong> At the start of every word, NVDA/JAWS screen readers will announce <code>Target: [word]</code> via polite ARIA live regions.
              </li>
              <li>
                <strong>Word Completion:</strong> When you finish typing a word, press <kbd>Spacebar</kbd> to submit the word and advance to the next target word.
              </li>
              <li>
                <strong>Repetition Loops:</strong> When you finish the last word of a drill, the engine will automatically announce your completed repetition and cycle to the next repetition until your target reps are achieved.
              </li>
            </ul>
          </div>

          <div className="shortcuts-section">
            <h3 className="shortcuts-section-title">
              <Volume2 size={18} aria-hidden="true" /> Auditory Feedback Reference
            </h3>
            <ul className="shortcuts-guide-list">
              <li><strong>Soft Click:</strong> Correct character entered.</li>
              <li><strong>Low Buzz:</strong> Incorrect character or premature spacebar.</li>
              <li><strong>Two-tone Chime:</strong> Word successfully completed.</li>
              <li><strong>Ascending Arpeggio:</strong> Repetition completed.</li>
              <li><strong>Celebration Fanfare:</strong> All target repetitions completed!</li>
              <li><strong>Warning Buzzer:</strong> Time limit expired.</li>
            </ul>
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-primary btn-full">
            Got it, Close Guide (Escape)
          </button>
        </div>
      </div>
    </div>
  );
};
