'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher-client';
import { sectionById } from '@/lib/sections';

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

/** Follows a caller on the keypad line: each digit they press moves this page to that section. */
export function PhoneNavigator() {
  const router = useRouter();
  const [section, setSection] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const channel = getPusherClient().subscribe(CHANNEL);
    const go = (id: string, spotlight?: string) => {
      const target = sectionById(id);
      if (!target) return;
      setActive(true);
      setSection(target.label);
      router.push(spotlight ? `${target.href}?spotlight=${encodeURIComponent(spotlight)}` : target.href);
    };

    channel.bind('session-started', () => setActive(true));
    channel.bind('section-changed', (data: SectionChangedEvent) => go(data.currentSection));
    channel.bind('content-spotlight', (data: SpotlightEvent) => go(data.section, data.contentId));
    channel.bind('session-ended', (data: SessionEvent) => {
      setActive(false);
      setSection(null);
      if (data.sessionId) router.push(`/session/${data.sessionId}`);
    });

    return () => {
      channel.unbind_all();
      getPusherClient().unsubscribe(CHANNEL);
    };
  }, [router]);

  if (!active) return null;

  return (
    <p role="status" className="fixed bottom-6 left-4 z-30 text-[13px] text-ink-3 sm:left-[5%]">
      A caller is steering this page{section ? `: ${section}` : ''}
    </p>
  );
}
