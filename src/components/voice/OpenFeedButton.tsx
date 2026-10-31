'use client';

import { OPEN_FEED_EVENT } from './LiveFeedPanel';

export function OpenFeedButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_FEED_EVENT))}
      className="text-ink underline underline-offset-4 hover:text-ink-2"
    >
      {children}
    </button>
  );
}
