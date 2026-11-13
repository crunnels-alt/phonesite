'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { getPusherClient } from '@/lib/pusher-client';
import { PHONE_NUMBER, sectionById } from '@/lib/sections';

interface SectionChangedEvent {
  sessionId?: string;
  currentSection: string;
}

interface SpotlightEvent {
  sessionId?: string;
  section: string;
  contentId: string;
}

interface SessionEvent {
  sessionId: string;
}

const CHANNEL = 'website-navigation';
const STORAGE_KEY = 'keypad-steering';

const readSteering = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'on';
  } catch {
    return false;
  }
};

const storeSteering = (on: boolean) => {
  try {
    if (on) sessionStorage.setItem(STORAGE_KEY, 'on');
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
};

/**
 * The keypad line's number, with a switch that lets a call to it move this page.
 * Steering is off until the visitor turns it on, and turns itself off when the call ends.
 */
export function PhoneNavigator() {
  const router = useRouter();
  const [steering, setSteering] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [section, setSection] = useState<string | null>(null);

  // A reload keeps the visitor's choice for this tab.
  useEffect(() => {
    if (readSteering()) setSteering(true);
  }, []);

  useEffect(() => {
    if (!steering) return;

    const channel = getPusherClient().subscribe(CHANNEL);
    const go = (id: string, spotlight?: string) => {
      const target = sectionById(id);
      if (!target) return;
      setCallActive(true);
      setSection(target.label);
      router.push(spotlight ? `${target.href}?spotlight=${encodeURIComponent(spotlight)}` : target.href);
    };

    channel.bind('session-started', () => setCallActive(true));
    channel.bind('section-changed', (data: SectionChangedEvent) => go(data.currentSection));
    channel.bind('content-spotlight', (data: SpotlightEvent) => go(data.section, data.contentId));
    channel.bind('session-ended', (data: SessionEvent) => {
      storeSteering(false);
      setSteering(false);
      if (data.sessionId) router.push(`/session/${data.sessionId}`);
    });

    return () => {
      channel.unbind_all();
      getPusherClient().unsubscribe(CHANNEL);
      setCallActive(false);
      setSection(null);
    };
  }, [steering, router]);

  const toggle = () => {
    storeSteering(!steering);
    setSteering(!steering);
  };

  return (
    <span className="flex items-baseline gap-x-5 text-[13px]">
      <button
        type="button"
        aria-pressed={steering}
        title="Let a call to this number move this page"
        onClick={toggle}
        className={cn('cursor-pointer hover:text-ink', steering && 'text-ink')}
      >
        {steering ? 'Steering on' : 'Steer by phone'}
      </button>
      <a href={`tel:${PHONE_NUMBER.replace(/\s/g, '')}`} className="hover:text-ink">
        {PHONE_NUMBER}
      </a>
      {steering && (
        <span role="status" className="fixed bottom-6 left-4 z-30 text-ink-3 sm:left-[5%]">
          {callActive
            ? `A caller is steering this page${section ? `: ${section}` : ''}`
            : `Call ${PHONE_NUMBER} and press 0 to 6 to move this page`}
        </span>
      )}
    </span>
  );
}
