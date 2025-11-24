'use client';

import SectionNavigation from '@/components/SectionNavigation';

interface AboutSectionProps {
  onSectionChange?: (section: string) => void;
}

export default function AboutSection({ onSectionChange }: AboutSectionProps) {
  return (
    <div style={{ minHeight: '100vh', padding: '0 2rem' }}>
      <SectionNavigation
        currentSection="about"
        onSectionChange={onSectionChange}
      />

      <div style={{
        maxWidth: '540px',
        margin: '6rem auto',
        textAlign: 'center'
      }}>
        {/* Name */}
        <h1 style={{
          fontSize: '42px',
          fontWeight: 400,
          marginBottom: '1.5rem',
          letterSpacing: '-0.01em'
        }}>
          Connor Runnels
        </h1>

        {/* Subtitle */}
        <p className="type-serif-italic" style={{
          fontSize: '20px',
          marginBottom: '3rem',
          color: 'var(--text-secondary)'
        }}>
          Digital practitioner working across media
        </p>

        {/* Bio */}
        <p style={{
          fontSize: '18px',
          lineHeight: '1.7',
          marginBottom: '3rem',
          color: 'var(--text-secondary)'
        }}>
          Based in San Francisco. Currently exploring the intersections of
          technology, art, and human experience. Call the number below to
          navigate this site by phone.
        </p>

        {/* Divider */}
        <div style={{
          width: '40px',
          height: '1px',
          background: 'var(--border-light)',
          margin: '3rem auto'
        }} />

        {/* Phone */}
        <div className="type-sans" style={{
          fontSize: '15px',
          marginBottom: '2rem',
          letterSpacing: '0.05em',
          color: 'var(--text-secondary)'
        }}>
          (415) 680-9353
        </div>

        {/* Contact Links */}
        <div className="type-sans" style={{
          fontSize: '13px',
          lineHeight: '2.2',
          color: 'var(--text-tertiary)'
        }}>
          <div>
            <a href="mailto:connorrunnels@gmail.com" style={{ transition: 'opacity 0.2s' }}>
              connorrunnels@gmail.com
            </a>
          </div>
          <div>
            <a href="https://instagram.com/crunnels_" target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          </div>
          <div>
            <a href="https://github.com/crunnels-alt" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
