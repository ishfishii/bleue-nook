export const darkColors = {
  bg: '#171d1c', // carbon black
  sidebar: '#1c2423',
  card: '#1f2827',
  border: '#2a3433',
  text: '#efe9f4', // lavender mist
  muted: '#9aa8a6',
  teal: '#16bac5', // tropical teal (primary)
  maya: '#5fbff9', // maya blue (secondary)
  sapphire: '#5863f8', // electric sapphire (warnings, bills)
  sapphireText: '#9aa1ff', // lighter tint so sapphire text is readable on dark
};

export const lightColors = {
  bg: '#F3F6F5',
  sidebar: '#FFFFFF',
  card: '#FFFFFF',
  border: '#D2DDD9',
  text: '#171D1C',
  muted: '#5A6E6A',
  teal: '#0D9488',
  maya: '#0284C7',
  sapphire: '#4F46E5',
  sapphireText: '#4338CA',
};

// Default export fallback
export const colors = darkColors;

// Keys must match the names passed to useFonts in app/_layout.tsx
export const fonts = {
  regular: 'GoogleSans',
  medium: 'GoogleSansMedium',
};