'use client';

import { useState } from 'react';
// import Navigation from '@/components/Navigation';
import PhoneNavigationMonitor from '@/components/PhoneStateMonitor';
import AdminPanel from '@/components/AdminPanel';
import HomeSection from '@/components/sections/HomeSection';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import PhotoSection from '@/components/sections/PhotoSection';
import WritingSection from '@/components/sections/WritingSection';
import ReadingNotesSection from '@/components/sections/ReadingNotesSection';

export default function Home() {
  const [currentSection, setCurrentSection] = useState('home');

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
      default:
        return <HomeSection onSectionChange={handleSectionChange} />;
    }
  };

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
  };

  return (
    <div className="min-h-screen" style={{ background: '#ffffff' }}>
      {/* Phone Navigation Monitor (Hidden, just for real-time updates) */}
      <PhoneNavigationMonitor onSectionChange={handleSectionChange} />

      {/* Main Content */}
      <main style={{ background: '#ffffff' }}>
        {renderSection()}
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
