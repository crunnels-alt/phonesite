'use client';

import { useState, useEffect } from 'react';

const PHONE_NUMBER = '+1 415 680 9353';
const STORAGE_KEY = 'phone-prompt-seen';

export default function PhonePrompt() {
  const [isFirstVisit, setIsFirstVisit] = useState<boolean | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Check localStorage for first visit
    const hasSeenPrompt = localStorage.getItem(STORAGE_KEY);
    setIsFirstVisit(!hasSeenPrompt);

    if (!hasSeenPrompt) {
      // Mark as seen for next time
      localStorage.setItem(STORAGE_KEY, 'true');

      // Start fade after 10 seconds
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 10000);

      // Hide completely after fade animation
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 12000);

      // Also fade on scroll
      const handleScroll = () => {
        if (window.scrollY > 100) {
          setIsFading(true);
          setTimeout(() => setIsVisible(false), 2000);
        }
      };

      window.addEventListener('scroll', handleScroll);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Don't render until we know if it's first visit
  if (isFirstVisit === null) return null;

  // First-time visitor: ephemeral, prominent message
  if (isFirstVisit && isVisible) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 100,
          textAlign: 'center',
          pointerEvents: 'none',
          opacity: isFading ? 0 : 1,
          transition: 'opacity 2s ease-out',
        }}
      >
        <p
          className="type-serif"
          style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
            lineHeight: 1.5,
          }}
        >
          Call this number.
        </p>
        <p
          className="type-serif"
          style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            marginBottom: '0.5rem',
            lineHeight: 1.5,
          }}
        >
          Press digits to move.
        </p>
        <p
          className="type-serif-italic"
          style={{
            fontSize: '18px',
            color: 'var(--text-tertiary)',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
          }}
        >
          Leave with a collage of where you&apos;ve been.
        </p>
        <p
          className="type-sans"
          style={{
            fontSize: '14px',
            color: 'var(--foreground)',
            letterSpacing: '0.05em',
          }}
        >
          {PHONE_NUMBER}
        </p>
      </div>
    );
  }

  // Repeat visitor: permanent, subtle marginal note
  return (
    <div
      style={{
        position: 'fixed',
        top: '1.5rem',
        right: '1.5rem',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <span
        className="type-serif-italic"
        style={{
          fontSize: '13px',
          color: 'var(--text-tertiary)',
        }}
      >
        {PHONE_NUMBER}
      </span>
    </div>
  );
}
