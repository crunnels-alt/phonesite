'use client';

import { useState, useEffect, useCallback } from 'react';
// import Navigation from '@/components/Navigation';
import PhoneNavigationMonitor from '@/components/PhoneStateMonitor';
import AdminPanel from '@/components/AdminPanel';
import HomeSection from '@/components/sections/HomeSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import PhotoSection from '@/components/sections/PhotoSection';
import WritingSection from '@/components/sections/WritingSection';
import ReadingNotesSection from '@/components/sections/ReadingNotesSection';
import ListeningSection from '@/components/sections/ListeningSection';
import { SECTIONS } from '@/components/SectionNavigation';

export default function Home() {
  const [currentSection, setCurrentSection] = useState('home');

  // Read hash from URL on mount and handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the #
      if (hash && SECTIONS.some(s => s.id === hash)) {
        setCurrentSection(hash);
      }
    };

    // Set initial section from URL hash
    handleHashChange();

    // Listen for hash changes (back/forward navigation)
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update URL hash when section changes
  const handleSectionChange = useCallback((section: string) => {
    setCurrentSection(section);
    // Update URL without triggering navigation
    const newHash = section === 'home' ? '' : `#${section}`;
    if (window.location.hash !== newHash) {
      window.history.pushState(null, '', newHash || '/');
    }
  }, []);

  // Keyboard shortcuts for section navigation (0-5 keys)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input or select
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement
    ) {
      return;
    }

    const key = e.key;
    if (key >= '0' && key <= '6') {
      const section = SECTIONS.find(s => s.key === key);
      if (section) {
        handleSectionChange(section.id);
      }
    }
  }, [handleSectionChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const renderSection = () => {
    switch (currentSection) {
      case 'home':
        return <HomeSection onSectionChange={handleSectionChange} />;
      case 'about':
        return <AboutSection onSectionChange={handleSectionChange} />;
      case 'projects':
        return <ProjectsSection onSectionChange={handleSectionChange} />;
      case 'photo':
        return <PhotoSection onSectionChange={handleSectionChange} />;
      case 'writing':
        return <WritingSection onSectionChange={handleSectionChange} />;
      case 'reading':
        return <ReadingNotesSection onSectionChange={handleSectionChange} />;
      case 'listening':
        return <ListeningSection onSectionChange={handleSectionChange} />;
      default:
        return <HomeSection onSectionChange={handleSectionChange} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Phone Navigation Monitor (Hidden, just for real-time updates) */}
      <PhoneNavigationMonitor onSectionChange={handleSectionChange} />

      {/* Main Content */}
      <main style={{ background: '#ffffff' }}>
        <div key={currentSection} className="section-transition">
          {renderSection()}
        </div>
      </main>

      {/* Admin Panel (Only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-t border-gray-200 bg-gray-50">
          <AdminPanel />
        </div>
      )}
    </div>
  );
}
