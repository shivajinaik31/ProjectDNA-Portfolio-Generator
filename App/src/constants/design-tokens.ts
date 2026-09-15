/**
 * ProjectDNA Design System Tokens
 *
 * Dark technical / Cyber-SaaS aesthetic
 * - Cyan primary accent (#00c3e4)
 * - Indigo secondary accents
 * - Thin structural borders
 * - Inter for UI text, JetBrains Mono for technical/metric labels
 */

import { Platform } from 'react-native';

// ─── Color Palette ──────────────────────────────────────────

export const DN = {
  // Backgrounds
  bg: '#070c18',
  bgCard: '#0b1426',
  bgElevated: '#0f1d36',
  bgInput: '#0f1d36',
  bgHover: '#122240',

  // Borders
  border: '#172640',
  borderLight: '#1d2f4d',
  borderFocus: '#19395e',

  // Primary (Cyan)
  cyan: '#00c3e4',
  cyanMuted: '#0f2742',
  cyanDark: '#0a1e38',

  // Indigo / Secondary
  indigo: '#6366f1',
  indigoMuted: '#1e1b4b',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#8ba1be',
  textMuted: '#657b9c',
  textLabel: '#7e94b4',
  textPlaceholder: '#475873',

  // Semantic
  success: '#52c41a',
  successBg: '#122619',
  successBorder: '#1d4d29',
  successText: '#73d13d',

  error: '#ff4d4f',
  errorBg: '#2a1215',
  errorBorder: '#5c1d24',
  errorText: '#ff7875',

  warning: '#faad14',
  warningBg: '#2b2111',
  warningBorder: '#594a1e',

  // Misc
  overlay: 'rgba(7, 12, 24, 0.85)',
} as const;

// ─── Typography ─────────────────────────────────────────────

export const FontFamily = {
  // Inter — UI body text, headings, buttons
  regular: Platform.select({
    ios: 'Inter-Regular',
    android: 'Inter-Regular',
    web: 'Inter, system-ui, -apple-system, sans-serif',
  }) as string,
  medium: Platform.select({
    ios: 'Inter-Medium',
    android: 'Inter-Medium',
    web: 'Inter, system-ui, -apple-system, sans-serif',
  }) as string,
  semiBold: Platform.select({
    ios: 'Inter-SemiBold',
    android: 'Inter-SemiBold',
    web: 'Inter, system-ui, -apple-system, sans-serif',
  }) as string,
  bold: Platform.select({
    ios: 'Inter-Bold',
    android: 'Inter-Bold',
    web: 'Inter, system-ui, -apple-system, sans-serif',
  }) as string,
  extraBold: Platform.select({
    ios: 'Inter-ExtraBold',
    android: 'Inter-ExtraBold',
    web: 'Inter, system-ui, -apple-system, sans-serif',
  }) as string,

  // JetBrains Mono — technical labels, metrics, code
  mono: Platform.select({
    ios: 'JetBrainsMono-Regular',
    android: 'JetBrainsMono-Regular',
    web: "'JetBrains Mono', ui-monospace, monospace",
  }) as string,
  monoMedium: Platform.select({
    ios: 'JetBrainsMono-Medium',
    android: 'JetBrainsMono-Medium',
    web: "'JetBrains Mono', ui-monospace, monospace",
  }) as string,
  monoBold: Platform.select({
    ios: 'JetBrainsMono-Bold',
    android: 'JetBrainsMono-Bold',
    web: "'JetBrains Mono', ui-monospace, monospace",
  }) as string,
};

// ─── Font Sizes ─────────────────────────────────────────────

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

// ─── Spacing Scale ──────────────────────────────────────────

export const Space = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// ─── Border Radius ──────────────────────────────────────────

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 999,
} as const;

// ─── Shadows (minimal, structural) ─────────────────────────

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    shadowColor: '#00c3e4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
} as const;
