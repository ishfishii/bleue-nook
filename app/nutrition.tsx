// app/nutrition.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/theme';

export default function Nutrition() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text, fontFamily: fonts.medium }]}>
        Daily Nutrition Log
      </Text>
      <Text style={{ color: colors.muted }}>
        Meal logging dashboard coming next!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
  },
});