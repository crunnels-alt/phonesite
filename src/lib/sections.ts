export interface Section {
  id: string;
  label: string;
  digit: string;
  href: string;
}

// Digit 4 belonged to Writing, which is retired; it stays unused so the other digits don't move.
export const SECTIONS: Section[] = [
  { id: 'home', label: 'Home', digit: '0', href: '/' },
  { id: 'about', label: 'About', digit: '1', href: '/about' },
  { id: 'resume', label: 'Resume', digit: '2', href: '/resume' },
  { id: 'photo', label: 'Photo', digit: '3', href: '/photo' },
  { id: 'reading', label: 'Reading', digit: '5', href: '/reading' },
  { id: 'listening', label: 'Listening', digit: '6', href: '/listening' },
];

export const PHONE_NUMBER = '+1 415 680 9353';
/** The AI agent's line, separate from the keypad navigation number. */
export const AGENT_PHONE_NUMBER = '+1 646 941 7945';

export const sectionByDigit = (digit: string) => SECTIONS.find((section) => section.digit === digit);
export const sectionById = (id: string) => SECTIONS.find((section) => section.id === id);
