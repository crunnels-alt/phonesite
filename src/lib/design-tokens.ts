/**
 * Design Tokens - Centralized design system values
 *
 * Use these tokens throughout the application for consistent styling.
 * Import with: import { colors, spacing, typography, sizes } from '@/lib/design-tokens'
 */

// Colors
export const colors = {
  // Base
  background: '#ffffff',
  foreground: '#1a1a1a',

  // Text hierarchy
  textPrimary: '#1a1a1a',
  textSecondary: 'rgba(26, 26, 26, 0.6)',
  textTertiary: 'rgba(26, 26, 26, 0.4)',

  // Borders
  borderLight: 'rgba(26, 26, 26, 0.1)',
  borderMedium: 'rgba(26, 26, 26, 0.2)',

  // States
  hover: 'rgba(0, 0, 0, 0.02)',
  selection: {
    background: '#1a1a1a',
    text: '#ffffff',
  },
} as const;

// Spacing scale (in rem)
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

// Typography
export const typography = {
  // Font families
  fontSerif: "'Crimson Text', Georgia, serif",
  fontSans: "'Inter', -apple-system, sans-serif",

  // Font sizes
  sizes: {
    xs: '12px',
    sm: '13px',
    base: '16px',
    md: '18px',
    lg: '20px',
    xl: '22px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '36px',
    '5xl': '42px',
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.6,
    relaxed: 1.7,
  },

  // Font weights
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },

  // Letter spacing
  tracking: {
    tight: '-0.01em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
  },
} as const;

// Component sizes
export const sizes = {
  // Card sizes
  card: {
    small: { width: '260px', minHeight: '180px' },
    medium: { width: '340px', minHeight: '240px' },
    large: { width: '420px', minHeight: '300px' },
  },

  // Image card sizes
  imageCard: {
    small: { width: '220px', height: '300px' },
    medium: { width: '320px', height: '420px' },
    large: { width: '420px', height: '560px' },
  },

  // Navigation
  nav: {
    gap: '2.5rem',
    padding: '1.5rem',
  },

  // Max widths
  maxWidth: {
    content: '900px',
    wide: '1000px',
    full: '100%',
  },
} as const;

// Transitions
export const transitions = {
  fast: '0.15s ease',
  normal: '0.2s ease',
  slow: '0.3s ease-out',
} as const;

// Z-index layers
export const zIndex = {
  base: 1,
  card: 10,
  nav: 100,
  modal: 1000,
  toast: 1100,
} as const;

// Breakpoints
export const breakpoints = {
  sm: '480px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const;

// CSS Variable names (for use in inline styles with var())
export const cssVars = {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  textSecondary: 'var(--text-secondary)',
  textTertiary: 'var(--text-tertiary)',
  borderLight: 'var(--border-light)',
} as const;
