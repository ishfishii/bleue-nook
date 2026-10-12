import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '../constants/theme';
import { checkServerHealth, fetchExpenses, fetchInventory, fetchCategories, Expense, InventoryItem, Category } from '../services/api';
import { pad } from '../lib/date';

const now = new Date();
const peso = (n: number) => `₱${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// Helper for GMT+8 date filtering and formatting
function getGMT8DateString(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const gmt8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return gmt8Date.toISOString().split('T')[0];
}

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing connection...');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const loadData = async () => {
    setLoading(true);
    const [healthRes, expData, invData, catData] = await Promise.all([
      checkServerHealth(),
      fetchExpenses(),
      fetchInventory(),
      fetchCategories(),
    ]);

    if (healthRes && healthRes.ok) {
      setConnectionStatus('Connected 🚀');
    } else {
      setConnectionStatus('Connection failed ❌');
    }

    setExpenses(expData);
    setInventory(invData);
    setCategories(catData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const monthKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  const monthExpenses = expenses.filter((e) => {
    const expenseDate = e.date ? getGMT8DateString(e.date) : getGMT8DateString(e.createdAt);
    return expenseDate.startsWith(monthKey);
  });

  const spent = monthExpenses.reduce((sum, e) => sum + e.totalAmount, 0);

  // Calculate live category percentages for the distribution bar
  const categoryTotals = categories.map((cat) => {
    const total = monthExpenses
      .filter((e) => e.categoryId === cat.id || e.categoryName === cat.name)
      .reduce((sum, e) => sum + e.totalAmount, 0);
    return { name: cat.name, total };
  });

  const totalSpentAllCats = categoryTotals.reduce((sum, c) => sum + c.total, 0) || 1;
  const categoryPcts = categoryTotals.map((c, index) => {
    const palette = [colors.teal, colors.sapphire, colors.maya, colors.text];
    return {
      name: c.name,
      pct: Math.round((c.total / totalSpentAllCats) * 100),
      color: palette[index % palette.length],
    };
  }).filter(c => c.pct > 0);

  // Recent 4 expenses
  const recentExpenses = [...monthExpenses]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  // For Restock: essential items with low stock (quantity <= 2) and not disposed
  const restockItems = inventory.filter((i) => i.isEssential && i.quantity <= 2 && i.status !== 'Disposed').slice(0, 4);

  // Expiring Soon or Expired: expiration date is within ~1 month (30 days) or already passed
  const todayDate = new Date();
  const oneMonthFromNow = new Date();
  oneMonthFromNow.setDate(todayDate.getDate() + 30);

  const expiringItems = inventory.filter((i) => {
    if (!i.expirationDate || i.status === 'Disposed') return false;
    const expDate = new Date(i.expirationDate);
    return expDate <= oneMonthFromNow;
  }).slice(0, 4);

  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>Home</Text>
          <Text style={s.small}>{today} • {connectionStatus}</Text>
        </View>
        <Pressable style={s.add} onPress={loadData}>
          <Ionicons name="refresh" size={16} color={colors.bg} />
          <Text style={s.addText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={s.row}>
        <View style={[s.card, s.stat]}>
          <Text style={s.label}>Spent this month</Text>
          <Text style={s.big}>{peso(spent)}</Text>
          <Text style={s.small}>Live from PostgreSQL</Text>
        </View>

        <View style={[s.card, s.stat]}>
          <Text style={s.label}>Inventory items</Text>
          <Text style={s.big}>{inventory.filter(i => i.status !== 'Disposed').length}</Text>
          <Text style={[s.small, { color: restockItems.length > 0 ? colors.sapphireText : colors.muted }]}>
            {restockItems.length} need restock
          </Text>
        </View>
      </View>

      {categoryPcts.length > 0 && (
        <View style={s.card}>
          <Text style={s.h3}>Spending by category</Text>
          <View style={s.bar}>
            {categoryPcts.map((c) => (
              <View key={c.name} style={{ flex: c.pct, backgroundColor: c.color }} />
            ))}
          </View>
          <View style={s.legend}>
            {categoryPcts.map((c) => (
              <View key={c.name} style={s.legendItem}>
                <View style={[s.dot, { backgroundColor: c.color }]} />
                <Text style={s.small}>{c.name} {c.pct}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={s.row}>
        {/* For Restock Card */}
        <View style={[s.card, s.half]}>
          <Text style={s.h3}>For Restock (Essential)</Text>
          {restockItems.length === 0 ? (
            <Text style={s.small}>All essential inventory items are well-stocked!</Text>
          ) : (
            restockItems.map((l, i) => (
              <View key={l.id} style={[s.item, i > 0 && s.divider]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.body}>{l.name}</Text>
                  <Text style={s.small}>{l.category || 'General'}</Text>
                </View>
                <View style={s.chip}>
                  <Text style={s.chipText}>{l.quantity} left</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Expiring Soon / Expired Card */}
        <View style={[s.card, s.half]}>
          <Text style={s.h3}>Expiring Soon / Expired</Text>
          {expiringItems.length === 0 ? (
            <Text style={s.small}>No items expiring within the next month.</Text>
          ) : (
            expiringItems.map((e, i) => {
              const expStr = e.expirationDate ? getGMT8DateString(e.expirationDate) : '';
              const todayStr = getGMT8DateString(new Date().toISOString());
              
              const expTime = new Date(expStr).getTime();
              const todayTime = new Date(todayStr).getTime();
              const diffDays = Math.round((expTime - todayTime) / (1000 * 60 * 60 * 24));

              let badgeText = '';
              let badgeColor = colors.teal;

              if (diffDays < 0) {
                badgeText = `Expired ${Math.abs(diffDays)}d ago`;
                badgeColor = '#ff6b6b';
              } else if (diffDays === 0) {
                badgeText = 'Expires today';
                badgeColor = '#ff6b6b';
              } else if (diffDays === 1) {
                badgeText = '1 day left';
              } else {
                badgeText = `${diffDays} days left`;
              }

              return (
                <View key={e.id} style={[s.item, i > 0 && s.divider]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.body}>{e.name}</Text>
                    <Text style={s.small}>Exp: {expStr || 'N/A'}</Text>
                  </View>
                  <View style={[s.chip, { borderColor: badgeColor }]}>
                    <Text style={[s.chipText, { color: badgeColor }]}>{badgeText}</Text>
                  </View>
                </View>
              );
            })
          )}
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
  bar: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  chip: { borderColor: colors.sapphire, borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 2 },
  chipText: { color: colors.sapphireText, fontFamily: fonts.regular, fontSize: 12 },
});