'use client';

import { useState } from 'react';
// import Navigation from '@/components/Navigation';
import PhoneNavigationMonitor from '@/components/PhoneStateMonitor';
import AdminPanel from '@/components/AdminPanel';
import AboutSection from '@/components/sections/AboutSection';
import ProjectsSection from '@/components/sections/ProjectsSection';
import PhotoSection from '@/components/sections/PhotoSection';
import WritingSection from '@/components/sections/WritingSection';

export default function Home() {
  const [currentSection, setCurrentSection] = useState('about');

  const renderSection = () => {
    switch (currentSection) {
      case 'about':
        return <AboutSection onSectionChange={handleSectionChange} />;
      case 'projects':
        return <ProjectsSection onSectionChange={handleSectionChange} />;
      case 'photo':
        return <PhotoSection onSectionChange={handleSectionChange} />;
      case 'writing':
        return <WritingSection onSectionChange={handleSectionChange} />;
      default:
        return <AboutSection onSectionChange={handleSectionChange} />;
    }
  };

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
  };

  return (
    <div className="min-h-screen">
      {/* Phone Navigation Monitor (Hidden, just for real-time updates) */}
      <PhoneNavigationMonitor onSectionChange={handleSectionChange} />

      {/* Main Content */}
      <main>
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
