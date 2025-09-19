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

export default function PhoneNavigationMonitor() {
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
      setWebsiteState(prevState => ({
        currentSection: data.currentSection,
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
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('website-navigation');
      pusher.disconnect();
    };
  }, []);

  const getStateDisplayName = (state: string): string => {
    const stateNames: Record<string, string> = {
      'about': 'About',
      'projects': 'Projects',
      'photo': 'Photo',
      'writing': 'Writing',
      'home': 'Home',
      'previous': 'Previous',
      'confirm': 'Confirmed',
      'unknown': 'Unknown State',
    };
    return stateNames[state] || state;
  };

  const getStateColor = (state: string): string => {
    const stateColors: Record<string, string> = {
      'about': 'bg-blue-100 text-blue-800',
      'projects': 'bg-green-100 text-green-800',
      'photo': 'bg-pink-100 text-pink-800',
      'writing': 'bg-purple-100 text-purple-800',
      'home': 'bg-indigo-100 text-indigo-800',
      'previous': 'bg-gray-100 text-gray-800',
      'confirm': 'bg-emerald-100 text-emerald-800',
      'unknown': 'bg-orange-100 text-orange-800',
    };
    return stateColors[state] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Website Phone Navigation
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected to real-time updates' : 'Disconnected'}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            Total navigations: <span className="font-semibold">{websiteState.totalNavigations}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Section</h2>
          <div className="text-center py-8">
            <div className={`inline-flex px-6 py-3 rounded-full text-lg font-medium ${getStateColor(websiteState.currentSection)}`}>
              {getStateDisplayName(websiteState.currentSection)}
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Last activity: {websiteState.lastActivity.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Navigation Guide */}
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Phone Navigation</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Press <span className="font-mono bg-gray-100 px-1 rounded">1</span></span>
              <span>About</span>
            </div>
            <div className="flex justify-between">
              <span>Press <span className="font-mono bg-gray-100 px-1 rounded">2</span></span>
              <span>Projects</span>
            </div>
            <div className="flex justify-between">
              <span>Press <span className="font-mono bg-gray-100 px-1 rounded">3</span></span>
              <span>Photo</span>
            </div>
            <div className="flex justify-between">
              <span>Press <span className="font-mono bg-gray-100 px-1 rounded">4</span></span>
              <span>Writing</span>
            </div>
            <div className="flex justify-between">
              <span>Press <span className="font-mono bg-gray-100 px-1 rounded">0</span></span>
              <span>Home</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {websiteState.recentEvents.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-md p-6 border">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Navigation Activity</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {websiteState.recentEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                <div className="flex items-center gap-3">
                  <span className="font-mono bg-white px-2 py-1 rounded text-xs">
                    {event.lastDigit}
                  </span>
                  <span>→ {getStateDisplayName(event.currentState)}</span>
                </div>
                <span className="text-gray-500">
                  {event.timestamp.toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {websiteState.totalNavigations === 0 && (
        <div className="mt-6 text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No phone navigation detected yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Waiting for phone calls to navigate the website...
          </p>
        </div>
      )}
    </div>
  );
}