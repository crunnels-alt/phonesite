'use client';

interface SectionNavigationProps {
  currentSection: string;
  onSectionChange?: (section: string) => void;
}

// Single source of truth for all sections
export const SECTIONS = [
  { id: 'home', label: 'Home', key: '0' },
  { id: 'about', label: 'About', key: '1' },
  { id: 'projects', label: 'Projects', key: '2' },
  { id: 'photo', label: 'Photo', key: '3' },
  { id: 'writing', label: 'Writing', key: '4' },
  { id: 'reading', label: 'Reading', key: '5' },
] as const;

export default function SectionNavigation({
  currentSection,
  onSectionChange,
}: SectionNavigationProps) {
  return (
    <nav className="type-sans" style={{
      position: 'sticky',
      top: 0,
      display: 'flex',
      gap: '2.5rem',
      justifyContent: 'center',
      padding: '1.5rem 0',
      marginBottom: '2rem',
      zIndex: 100,
    }}>
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionChange?.(section.id)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--foreground)',
            fontSize: '13px',
            fontWeight: section.id === currentSection ? 500 : 400,
            opacity: section.id === currentSection ? 1 : 0.5,
            transition: 'opacity 0.2s ease',
            padding: 0,
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = section.id === currentSection ? '1' : '0.5';
          }}
        >
          {section.label}
        </button>
      ))}
    </nav>
  );
}
