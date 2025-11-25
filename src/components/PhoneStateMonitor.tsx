'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Pusher from 'pusher-js';

interface NavigationUpdate {
  sessionId?: string;
  currentSection: string;
  pressedDigit: string;
  timestamp: string;
  totalNavigations: number;
  recentEvent: {
    id: string;
    phoneNumber: string;
    currentState: string;
    lastDigit: string;
    timestamp: string;
  };
}

interface SessionStartedEvent {
  sessionId: string;
  timestamp: string;
}

interface SessionEndedEvent {
  sessionId: string;
  timestamp: string;
}

interface ContentSpotlightEvent {
  sessionId?: string;
  section: string;
  contentId: string;
  contentType: string;
  timestamp: string;
}

interface NavigationEvent {
  id: string;
  phoneNumber: string;
  currentState: string;
  lastDigit: string;
  timestamp: Date;
}

interface WebsiteState {
  currentSection: string;
  lastActivity: Date;
  totalNavigations: number;
  recentEvents: NavigationEvent[];
}

interface VisibleContent {
  contentType: string;
  contentIds: string[];
}

interface SpotlightData {
  section: string;
  contentId: string;
  contentType: string;
}

interface PhoneNavigationMonitorProps {
  onSectionChange?: (section: string) => void;
  onSpotlight?: (spotlight: SpotlightData) => void;
  getVisibleContent?: (section: string) => VisibleContent | null;
}

export default function PhoneNavigationMonitor({ onSectionChange, onSpotlight, getVisibleContent }: PhoneNavigationMonitorProps) {
  const router = useRouter();
  const [websiteState, setWebsiteState] = useState<WebsiteState>({
    currentSection: 'home',
    lastActivity: new Date(),
    totalNavigations: 0,
    recentEvents: []
  });
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Report visible content to the server
  const reportVisibleContent = useCallback(async (section: string, sid: string) => {
    if (!sid || !getVisibleContent) return;

    const visibleContent = getVisibleContent(section);
    if (!visibleContent) return;

    try {
      await fetch('/api/session/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          section,
          contentType: visibleContent.contentType,
          contentIds: visibleContent.contentIds,
        }),
      });
    } catch (error) {
      console.error('Failed to report visible content:', error);
    }
  }, [getVisibleContent]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('website-navigation');

    pusher.connection.bind('connected', () => {
      setIsConnected(true);
    });

    pusher.connection.bind('disconnected', () => {
      setIsConnected(false);
    });

    // Handle new session started
    channel.bind('session-started', (data: SessionStartedEvent) => {
      console.log('Session started:', data.sessionId);
      setSessionId(data.sessionId);
      sessionIdRef.current = data.sessionId;

      // Report the initial home section
      reportVisibleContent('home', data.sessionId);
    });

    // Handle session ended - redirect to artifact page
    channel.bind('session-ended', (data: SessionEndedEvent) => {
      console.log('Session ended:', data.sessionId);
      if (data.sessionId) {
        router.push(`/session/${data.sessionId}`);
      }
      setSessionId(null);
      sessionIdRef.current = null;
    });

    channel.bind('section-changed', (data: NavigationUpdate) => {
      const newSection = data.currentSection;

      // Update sessionId if provided in the event
      if (data.sessionId && !sessionIdRef.current) {
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
      }

      setWebsiteState(prevState => ({
        currentSection: newSection,
        lastActivity: new Date(data.timestamp),
        totalNavigations: data.totalNavigations,
        recentEvents: [
          {
            ...data.recentEvent,
            timestamp: new Date(data.recentEvent.timestamp)
          },
          ...prevState.recentEvents.slice(0, 9)
        ]
      }));

      // Notify parent component about section change
      if (onSectionChange) {
        onSectionChange(newSection);
      }

      // Report visible content for this section
      const currentSid = data.sessionId || sessionIdRef.current;
      if (currentSid) {
        reportVisibleContent(newSection, currentSid);
      }
    });

    // Handle content spotlight - show specific content item
    channel.bind('content-spotlight', (data: ContentSpotlightEvent) => {
      console.log('Content spotlight:', data);

      // Update sessionId if provided
      if (data.sessionId && !sessionIdRef.current) {
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
      }

      // Notify parent about spotlight
      if (onSpotlight) {
        onSpotlight({
          section: data.section,
          contentId: data.contentId,
          contentType: data.contentType,
        });
      }

      // Also update section if needed
      if (onSectionChange && data.section) {
        onSectionChange(data.section);
      }

      setWebsiteState(prevState => ({
        ...prevState,
        currentSection: data.section,
        lastActivity: new Date(data.timestamp),
      }));
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('website-navigation');
      pusher.disconnect();
    };
  }, [onSectionChange, onSpotlight, reportVisibleContent, router]);

  const getStateDisplayName = (state: string): string => {
    const stateNames: Record<string, string> = {
      'about': 'About',
      'projects': 'Projects',
      'photo': 'Photo',
      'writing': 'Writing',
      'reading': 'Reading Notes',
      'home': 'Home',
      'previous': 'Previous',
      'confirm': 'Confirmed',
      'unknown': 'Unknown State',
    };
    return stateNames[state] || state;
  };

  // const getStateColor = (state: string): string => {
  //   const stateColors: Record<string, string> = {
  //     'about': 'bg-blue-100 text-blue-800',
  //     'projects': 'bg-green-100 text-green-800',
  //     'photo': 'bg-pink-100 text-pink-800',
  //     'writing': 'bg-purple-100 text-purple-800',
  //     'home': 'bg-indigo-100 text-indigo-800',
  //     'previous': 'bg-gray-100 text-gray-800',
  //     'confirm': 'bg-emerald-100 text-emerald-800',
  //     'unknown': 'bg-orange-100 text-orange-800',
  //   };
  //   return stateColors[state] || 'bg-gray-100 text-gray-800';
  // };

  return (
    <>
      {/* Minimal phone navigation indicator - bottom center */}
      <div
        style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}
      >
        <div
          className="type-sans"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid var(--border-light)',
            borderRadius: '2px',
            transition: 'all 0.2s ease',
            cursor: 'default',
            opacity: isConnected ? 1 : 0.5,
            fontSize: '12px',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >
          {/* Connection status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: sessionId ? '#22c55e' : isConnected ? '#fbbf24' : '#d1d5db'
              }}
            />
            <span>{sessionId ? 'Session active' : isConnected ? 'Phone connected' : 'Waiting for call'}</span>
          </div>

          {/* Divider */}
          {websiteState.totalNavigations > 0 && (
            <>
              <div style={{ width: '1px', height: '12px', background: 'var(--border-light)' }} />

              {/* Navigation count */}
              <span style={{ color: 'var(--text-secondary)' }}>
                {websiteState.totalNavigations} navigation{websiteState.totalNavigations !== 1 ? 's' : ''}
              </span>
            </>
          )}

          {/* Current section */}
          {websiteState.recentEvents.length > 0 && (
            <>
              <div style={{ width: '1px', height: '12px', background: 'var(--border-light)' }} />
              <span className="type-serif-italic" style={{ color: 'var(--foreground)' }}>
                {getStateDisplayName(websiteState.currentSection)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Recent activity toast - appears briefly after navigation */}
      {websiteState.recentEvents.length > 0 &&
       (new Date().getTime() - websiteState.lastActivity.getTime()) < 5000 && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1001,
            pointerEvents: 'none',
            animation: 'fadeOut 5s ease-in-out forwards'
          }}
        >
          <div
            className="type-serif-italic"
            style={{
              fontSize: '48px',
              color: 'var(--foreground)',
              opacity: 0.1
            }}
          >
            {getStateDisplayName(websiteState.currentSection)}
          </div>
        </div>
      )}
    </>
  );
}