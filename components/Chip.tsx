import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts } from '../constants/theme';

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, active && s.chipOn]}>
      <Text style={[s.text, active && s.textOn]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: { borderColor: colors.border, borderWidth: 1, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6 },
  chipOn: { backgroundColor: 'rgba(22,186,197,0.14)', borderColor: colors.teal },
  text: { color: colors.muted, fontFamily: fonts.regular, fontSize: 13 },
  textOn: { color: colors.teal },
});
