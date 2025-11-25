'use client';

import SearchInput from './SearchInput';
import styles from './SectionNavigation.module.css';

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
  { id: 'listening', label: 'Listening', key: '6' },
] as const;

export default function SectionNavigation({
  currentSection,
  onSectionChange,
}: SectionNavigationProps) {
  return (
    <nav className={`type-sans mobile-nav ${styles.nav}`}>
      {SECTIONS.map((section) => (
        <button
          key={section.id}
          onClick={() => onSectionChange?.(section.id)}
          className={`${styles.navButton} ${section.id === currentSection ? styles.navButtonActive : ''}`}
        >
          {section.label}
        </button>
      ))}

      {/* Search */}
      <SearchInput onNavigate={onSectionChange} />
    </nav>
  );
}
