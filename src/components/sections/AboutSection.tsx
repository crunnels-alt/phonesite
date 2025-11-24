'use client';

import SectionNavigation from '@/components/SectionNavigation';

interface AboutSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function AboutSection({ onSectionChange }: AboutSectionProps) {
  return (
    <div style={{ minHeight: '100vh', padding: '0 4rem' }}>
      <SectionNavigation
        currentSection="about"
        onSectionChange={onSectionChange}
      />

      <div style={{
        maxWidth: '600px',
        margin: '8rem auto',
        textAlign: 'center'
      }}>
        {/* Name */}
        <h1 className="type-display" style={{
          fontSize: 'clamp(2rem, 6vw, 4rem)',
          marginBottom: '2rem',
          fontWeight: 900,
          letterSpacing: '-0.02em'
        }}>
          CRUNNELS
        </h1>

        {/* Bio */}
        <p className="type-body" style={{
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '3rem',
          opacity: 0.8
        }}>
          Digital practitioner working across media. Call to navigate.
        </p>

        {/* Phone */}
        <div className="type-mono" style={{
          fontSize: '14px',
          marginBottom: '2rem',
          opacity: 0.6
        }}>
          (415) 680-9353
        </div>

        {/* Contact */}
        <div className="type-mono" style={{
          fontSize: '12px',
          lineHeight: '2',
          opacity: 0.5
        }}>
          <div>EMAIL@EXAMPLE.COM</div>
          <div>@USERNAME</div>
          <div>GITHUB.COM/USERNAME</div>
        </div>
      </div>
    </div>
  );
}