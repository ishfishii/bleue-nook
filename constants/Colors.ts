// constants/Colors.ts
const tintColorLight = '#0284C7'; // Cerulean Blue
const tintColorDark = '#38BDF8';  // Light Sky Blue

export default {
  light: {
    text: '#1E293B',          // Deep Slate
    background: '#F0F9FF',    // Soft Ice Blue
    tint: tintColorLight,
    icon: '#64748B',          // Muted Slate
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',    // Dark Slate
    tint: tintColorDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
  },
};