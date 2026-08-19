import React from 'react';

interface AriaLiveAnnouncerProps {
  prompterMessage: string;
  errorMessage: string;
  statusMessage: string;
}

/**
 * Dedicated Screen Reader ARIA Live Regions.
 * Kept visually hidden (offscreen / 1x1 clip) so visual styling never interferes with accessibility tree.
 * 
 * 1. Prompter: Announces current target word to NVDA / JAWS / VoiceOver politely.
 * 2. Error Handler: Emits assertive immediate alert on incorrect keystroke.
 * 3. Status Announcer: Announces rep completions, timer expirations, and state shifts.
 */
export const AriaLiveAnnouncer: React.FC<AriaLiveAnnouncerProps> = ({
  prompterMessage,
  errorMessage,
  statusMessage,
}) => {
  return (
    <div className="sr-only-container" aria-hidden="false">
      {/* 1. Prompter (Polite, Atomic) */}
      <div
        id="sr-prompter"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {prompterMessage}
      </div>

      {/* 2. Error Handler (Assertive) */}
      <div
        id="sr-error"
        role="alert"
        aria-live="assertive"
        className="sr-only"
      >
        {errorMessage}
      </div>

      {/* 3. Status Announcer (Polite) */}
      <div
        id="sr-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
    </div>
  );
};
