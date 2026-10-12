import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../constants/theme';
import { checkServerHealth } from '../services/api';

// Sample data: replace with your real expenses and inventory
const categories = [
  { name: 'Groceries', pct: 38, color: colors.teal },
  { name: 'Bills', pct: 27, color: colors.sapphire },
  { name: 'Dining', pct: 20, color: colors.maya },
  { name: 'Other', pct: 15, color: colors.text },
];

const recent = [
  { name: 'Weekly groceries', when: 'Today', amount: '₱2,140', color: colors.teal },
  { name: 'Electricity', when: 'Oct 10', amount: '₱3,260', color: colors.sapphire },
  { name: 'Coffee', when: 'Oct 9', amount: '₱185', color: colors.maya },
  { name: 'Pharmacy', when: 'Oct 8', amount: '₱460', color: colors.text },
];

const lowStock = [
  { name: 'Dish soap', place: 'Kitchen', left: 1 },
  { name: 'Coffee beans', place: 'Pantry', left: 1 },
  { name: 'AA batteries', place: 'Drawer', left: 2 },
  { name: 'Printer paper', place: 'Office', left: 2 },
];

function StatCard({ label, value, note, noteColor, children }: {
  label: string;
  value: string;
  note: string;
  noteColor?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={[s.card, s.stat]}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.big}>{value}</Text>
      {children}
      <Text style={[s.small, noteColor ? { color: noteColor } : null]}>{note}</Text>
    </View>
  );
}

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing connection...');
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    async function testBackend() {
      const res = await checkServerHealth();
      if (res && res.ok) {
        setConnectionStatus('Connected 🚀');
      } else {
        setConnectionStatus('Connection failed ❌');
      }
    }
    testBackend();
  }, []);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Home</Text>
          <Text style={s.small}>{today} • {connectionStatus}</Text>
        </View>
        <Pressable style={s.add} onPress={() => { /* open add-expense sheet */ }}>
          <Ionicons name="add" size={18} color={colors.bg} />
          <Text style={s.addText}>Add</Text>
        </Pressable>
      </View>

      <View style={s.row}>
        <StatCard label="Spent this month" value="₱18,420" note="6% less than September" noteColor={colors.teal} />
        <StatCard label="Budget left" value="₱6,580" note="74% of ₱25,000 used">
          <View style={s.track}>
            <View style={[s.fill, { width: '74%' }]} />
          </View>
        </StatCard>
        <StatCard label="Items in stock" value="142" note="5 running low" noteColor={colors.sapphireText} />
      </View>

      <View style={s.card}>
        <Text style={s.h3}>Spending by category</Text>
        <View style={s.bar}>
          {categories.map((c) => (
            <View key={c.name} style={{ flex: c.pct, backgroundColor: c.color }} />
          ))}
        </View>
        <View style={s.legend}>
          {categories.map((c) => (
            <View key={c.name} style={s.legendItem}>
              <View style={[s.dot, { backgroundColor: c.color }]} />
              <Text style={s.small}>{c.name} {c.pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={s.row}>
        <View style={[s.card, s.half]}>
          <Text style={s.h3}>Recent expenses</Text>
          {recent.map((r, i) => (
            <View key={r.name} style={[s.item, i > 0 && s.divider]}>
              <View style={[s.dot, { backgroundColor: r.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.body}>{r.name}</Text>
                <Text style={s.small}>{r.when}</Text>
              </View>
              <Text style={s.body}>{r.amount}</Text>
            </View>
          ))}
        </View>

        <View style={[s.card, s.half]}>
          <Text style={s.h3}>Running low</Text>
          {lowStock.map((l, i) => (
            <View key={l.name} style={[s.item, i > 0 && s.divider]}>
              <View style={{ flex: 1 }}>
                <Text style={s.body}>{l.name}</Text>
                <Text style={s.small}>{l.place}</Text>
              </View>
              <View style={s.chip}>
                <Text style={s.chipText}>{l.left} left</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 22 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.teal,
    borderRadius: 99,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 16,
  },
  addText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 14 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  stat: { flexGrow: 1, flexBasis: 150 },
  half: { flexGrow: 1, flexBasis: 280 },
  label: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  big: { color: colors.text, fontFamily: fonts.medium, fontSize: 24, marginVertical: 4 },
  small: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  h3: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, marginBottom: 10 },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginVertical: 6 },
  fill: { height: 6, backgroundColor: colors.maya, borderRadius: 3 },
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  chip: { borderColor: colors.sapphire, borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 2 },
  chipText: { color: colors.sapphireText, fontFamily: fonts.regular, fontSize: 12 },
});