'use client';

import { useEffect, useState } from 'react';
import Pusher from 'pusher-js';

interface NavigationUpdate {
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

interface PhoneNavigationMonitorProps {
  onSectionChange?: (section: string) => void;
}

export default function PhoneNavigationMonitor({ onSectionChange }: PhoneNavigationMonitorProps) {
  const [websiteState, setWebsiteState] = useState<WebsiteState>({
    currentSection: 'home',
    lastActivity: new Date(),
    totalNavigations: 0,
    recentEvents: []
  });
  const [isConnected, setIsConnected] = useState(false);

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

    channel.bind('section-changed', (data: NavigationUpdate) => {
      const newSection = data.currentSection;

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
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('website-navigation');
      pusher.disconnect();
    };
  }, [onSectionChange]);

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
      {/* Floating status indicator - top right */}
      <div
        style={{
          position: 'fixed',
          top: 'var(--grid-gutter)',
          right: 'var(--grid-gutter)',
          zIndex: 1000,
          pointerEvents: 'none'
        }}
      >
        <div
          className="type-mono text-xs"
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            opacity: 0.6,
            lineHeight: '1.8'
          }}
        >
          <div style={{ color: isConnected ? 'var(--accent-red)' : 'var(--accent-gray)' }}>
            {isConnected ? '● LIVE' : '○ OFFLINE'}
          </div>
          <div style={{ opacity: 0.8 }}>
            NAV: {String(websiteState.totalNavigations).padStart(3, '0')}
          </div>
        </div>
      </div>

      {/* Floating session selector - minimal */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--grid-gutter)',
          left: 'var(--grid-gutter)',
          zIndex: 1000,
          pointerEvents: 'auto'
        }}
      >
        <div
          className="type-mono text-xs hover-glitch"
          style={{
            padding: '0.5rem',
            border: '1px solid transparent',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            opacity: 0.4
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.borderColor = 'var(--accent-red)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.4';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          <div style={{ marginBottom: '0.5rem', opacity: 0.6 }}>
            PHONE_NAVIGATION
          </div>
          <div style={{ color: 'var(--accent-red)', marginBottom: '0.25rem' }}>
            ● AUTONOMOUS BROWSING
          </div>
          <div style={{ opacity: 0.5, fontSize: '10px' }}>
            LAST: {getStateDisplayName(websiteState.currentSection).toUpperCase()}
          </div>
          {websiteState.recentEvents.length > 0 && (
            <div style={{ opacity: 0.3, fontSize: '10px' }}>
              {Math.floor((new Date().getTime() - websiteState.lastActivity.getTime()) / 1000)}S AGO
            </div>
          )}
        </div>
      </div>

      {/* Activity feed - minimal bottom-right */}
      {websiteState.recentEvents.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 'var(--grid-gutter)',
            right: 'var(--grid-gutter)',
            zIndex: 999,
            pointerEvents: 'none',
            maxWidth: '200px'
          }}
        >
          <div
            className="type-mono text-xs"
            style={{
              opacity: 0.2,
              lineHeight: '1.4'
            }}
          >
            {websiteState.recentEvents.slice(0, 3).map((event, index) => (
              <div
                key={event.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '0.25rem',
                  opacity: 1 - (index * 0.3)
                }}
              >
                <span style={{ color: 'var(--accent-red)' }}>
                  {event.lastDigit}
                </span>
                <span>
                  {getStateDisplayName(event.currentState).substring(0, 4).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection status line - top edge */}
      <div
        style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          height: '1px',
          background: isConnected ? 'var(--accent-red)' : 'var(--accent-gray)',
          opacity: isConnected ? 0.8 : 0.3,
          zIndex: 1001,
          pointerEvents: 'none'
        }}
      />
    </>
  );
}