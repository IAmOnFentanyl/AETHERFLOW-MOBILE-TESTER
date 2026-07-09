export const Colors = {
  bg: {
    deep: '#0A0F1A',
    primary: '#101827',
    secondary: '#1C2436',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#CBD5E1',
    muted: '#64748B',
    inverse: '#0F172A',
  },
  accent: {
    cyan: '#00D4FF',
    magenta: '#FF006E',
    blue: '#3B82F6',
    purple: '#A855F7',
    gold: '#F59E0B',
    cyanGlow: 'rgba(0, 212, 255, 0.1)',
  },
  status: {
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
  },
  glass: {
    white5: 'rgba(255,255,255,0.05)',
    white8: 'rgba(255,255,255,0.08)',
    white10: 'rgba(255,255,255,0.1)',
    white20: 'rgba(255,255,255,0.2)',
    border: 'rgba(255,255,255,0.1)',
  },
  track: {
    colors: ['#00D4FF', '#FF006E', '#F59E0B', '#22C55E', '#A855F3', '#EF4444', '#3B82F6', '#14B8A6'],
  },
};

export const Typography = {
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    display: 32,
  },
  fontWeights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
