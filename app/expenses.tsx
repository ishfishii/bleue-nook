import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '../components/Chip';
import { ExpenseModal } from '../components/ExpenseModal';
import { colors, fonts } from '../constants/theme';
import { fetchExpenses, createExpense, updateExpense, fetchCategories, Expense as ApiExpense, Category as ApiCategory } from '../services/api';
import { fromISO, pad } from '../lib/date';

const BUDGET = 25000;

const now = new Date();
const peso = (n: number) => `₱${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

function dayLabel(iso: string) {
  const dateStr = iso.split('T')[0];
  return fromISO(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function ExpenseRow({ item, first, onPress }: { item: ApiExpense; first: boolean; onPress: () => void }) {
  const iconName = (item.categoryIcon as React.ComponentProps<typeof Ionicons>['name']) || 'pricetag-outline';
  const itemName = item.items?.[0]?.name || item.merchantName;

  return (
    <Pressable onPress={onPress} style={[s.row, !first && s.rowDivider]}>
      <View style={[s.icon, { backgroundColor: 'rgba(22,186,197,0.16)' }]}>
        <Ionicons name={iconName} size={18} color={colors.teal} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.body}>{itemName}</Text>
        <Text style={s.small}>{item.merchantName} · {item.categoryName}</Text>
      </View>
      <Text style={s.body}>{peso(item.totalAmount)}</Text>
    </Pressable>
  );
}

export default function Expenses() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [view, setView] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [filter, setFilter] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const [modal, setModal] = useState<{ open: boolean; expense?: ApiExpense }>({ open: false });

  const loadData = async () => {
    setLoading(true);
    const [expData, catData] = await Promise.all([fetchExpenses(), fetchCategories()]);
    setExpenses(expData);
    setCategories(catData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const isCurrent = view.y === now.getFullYear() && view.m === now.getMonth();
  const monthKey = `${view.y}-${pad(view.m + 1)}`;
  const monthLabel = new Date(view.y, view.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const shift = (delta: number) =>
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });

  const monthExpenses = useMemo(() => expenses.filter((e) => {
    const expenseDate = e.date ? e.date.split('T')[0] : e.createdAt.split('T')[0];
    return expenseDate.startsWith(monthKey);
  }), [expenses, monthKey]);

  const spent = monthExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const left = BUDGET - spent;
  const daysToGo = new Date(view.y, view.m + 1, 0).getDate() - now.getDate();

  const filterOptions = useMemo(() => {
    return ['All', ...categories.map((c) => c.name)];
  }, [categories]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = monthExpenses.filter(
      (e) => (filter === 'All' || e.categoryName === filter) && (!q || e.merchantName.toLowerCase().includes(q)),
    );
    const byDay = new Map<string, ApiExpense[]>();
    visible.forEach((e) => {
      const dateKey = e.date ? e.date.split('T')[0] : e.createdAt.split('T')[0];
      byDay.set(dateKey, [...(byDay.get(dateKey) ?? []), e]);
    });
    return [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [monthExpenses, filter, query]);

  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSave = async (values: any) => {
    if (modal.expense) {
      const result = await updateExpense(modal.expense.id, values);
      if (result) {
        loadData();
        setNotice(`Updated expense successfully!`);
      }
    } else {
      const result = await createExpense(values);
      if (result) {
        loadData();
        setView({ y: now.getFullYear(), m: now.getMonth() });
        setNotice(`Added expense successfully!`);
      }
    }
    closeModal();
  };

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={s.title}>Expenses</Text>
            <Pressable 
              hitSlop={8} 
              onPress={() => router.push('/categories')} 
              style={s.gearButton}
            >
              <Ionicons name="settings-outline" size={20} color={colors.muted} />
            </Pressable>
          </View>

          <Pressable style={s.add} onPress={() => setModal({ open: true })}>
            <Ionicons name="add" size={18} color={colors.bg} />
            <Text style={s.addText}>Add</Text>
          </Pressable>
        </View>

        {notice && (
          <View style={s.notice}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.teal} />
            <Text style={[s.body, { flex: 1 }]}>{notice}</Text>
            <Pressable hitSlop={8} onPress={() => router.push('/inventory')}>
              <Text style={s.link}>View Inventory</Text>
            </Pressable>
          </View>
        )}

        <View style={s.card}>
          <View style={s.monthRow}>
            <Pressable hitSlop={10} onPress={() => shift(-1)}>
              <Ionicons name="chevron-back" size={18} color={colors.muted} />
            </Pressable>
            <Text style={s.month}>{monthLabel}</Text>
            <Pressable hitSlop={10} disabled={isCurrent} onPress={() => shift(1)}>
              <Ionicons name="chevron-forward" size={18} color={isCurrent ? colors.border : colors.muted} />
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={s.big}>{peso(spent)}</Text>
            <Text style={s.small}>spent of {peso(BUDGET)}</Text>
          </View>
          <View style={s.track}>
            <View style={[s.fill, { width: `${Math.min(100, (spent / BUDGET) * 100)}%` }]} />
          </View>
          <Text style={s.small}>
            {left >= 0 ? `${peso(left)} left` : `${peso(-left)} over budget`}
            {isCurrent ? ` · ${daysToGo} days to go` : ''}
          </Text>
        </View>

        <View style={s.search}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search expenses by merchant"
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {filterOptions.map((c) => (
            <Chip key={c} label={c} active={filter === c} onPress={() => setFilter(c)} />
          ))}
        </ScrollView>

        {loading ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={s.body}>Loading database records...</Text>
          </View>
        ) : groups.length === 0 ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={s.body}>No expenses here yet</Text>
            <Text style={s.small}>Tap Add to log one to PostgreSQL.</Text>
          </View>
        ) : (
          groups.map(([date, items]) => (
            <View key={date}>
              <View style={s.dayHeader}>
                <Text style={s.small}>{dayLabel(date)}</Text>
                <Text style={s.small}>{peso(items.reduce((sum, e) => sum + e.totalAmount, 0))}</Text>
              </View>
              <View style={[s.card, { padding: 0 }]}>
                {items.map((e, i) => (
                  <ExpenseRow key={e.id} item={e} first={i === 0} onPress={() => setModal({ open: true, expense: e })} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <ExpenseModal visible={modal.open} expense={modal.expense} onClose={closeModal} onSave={handleSave} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 22 },
  gearButton: { padding: 4 },
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
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(22,186,197,0.14)',
    borderColor: colors.teal,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  link: { color: colors.teal, fontFamily: fonts.medium, fontSize: 13 },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14 },
  monthRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  month: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  big: { color: colors.text, fontFamily: fonts.medium, fontSize: 26 },
  small: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  track: { height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 10, marginBottom: 6 },
  fill: { height: 6, backgroundColor: colors.maya, borderRadius: 3 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, marginBottom: 6, paddingHorizontal: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  icon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});