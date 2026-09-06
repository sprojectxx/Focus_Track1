import { TextStyle } from 'react-native';
import { colors } from './colors';

/**
 * FocusTrack Mobile Typography Scale & Styles
 */
export const typography: Record<string, TextStyle> = {
  h1: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.25,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.15,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  bodySecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textMuted,
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
    letterSpacing: 0.5,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};
