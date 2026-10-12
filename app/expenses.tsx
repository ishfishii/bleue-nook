import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Chip } from '../components/Chip';
import { ExpenseModal } from '../components/ExpenseModal';
import { colors, fonts } from '../constants/theme';
import { fetchExpenses, fetchCategories, fetchMerchants, createExpense, updateExpense, Expense as ApiExpense, Category, Merchant } from '../services/api';
import { API_BASE_URL } from '../constants/config';
import { fromISO } from '../lib/date';

const peso = (n: number) => `₱${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

// Helper for GMT+8 date formatting
const shortDate = (iso: string) => {
  if (!iso) return '';
  const date = new Date(iso);
  const gmt8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const dateStr = gmt8Date.toISOString().split('T')[0];
  return fromISO(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

function ExpenseRow({
  expense,
  first,
  categoryIcon,
  onPress,
}: {
  expense: ApiExpense;
  first: boolean;
  categoryIcon?: string;
  onPress: () => void;
}) {
  const iconName = (categoryIcon as React.ComponentProps<typeof Ionicons>['name']) || 'pricetag-outline';
  const paymentMethod = expense.paymentMethod || 'Cash';
  const isPending = expense.status === 'Pending';
  const isIncome = expense.totalAmount < 0;

  return (
    <Pressable onPress={onPress} style={[s.row, !first && s.rowDivider]}>
      <View style={[s.icon, isIncome && { backgroundColor: 'rgba(46, 204, 113, 0.16)' }]}>
        <Ionicons 
          name={isIncome ? 'wallet-outline' : iconName} 
          size={18} 
          color={isIncome ? '#2ecc71' : colors.teal} 
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.body}>{expense.items?.[0]?.name || expense.merchantName || 'Expense'}</Text>
        <Text style={s.small}>
          {expense.merchantName || 'Unknown Merchant'} · {shortDate(expense.date || expense.createdAt)}
          {expense.orderReference ? ` · ${expense.orderReference}` : ''}
        </Text>
      </View>

      {/* Status Badge */}
      <View style={[s.statusBadge, isPending ? s.statusPending : s.statusPaid]}>
        <Text style={[s.statusText, isPending ? s.statusTextPending : s.statusTextPaid]}>
          {expense.status || 'Paid'}
        </Text>
      </View>

      <View style={s.pmChip}>
        <Text style={s.pmChipText}>{paymentMethod}</Text>
      </View>

      <Text style={[s.amount, isIncome && { color: '#2ecc71' }]}>
        {isIncome ? `+${peso(Math.abs(expense.totalAmount))}` : peso(expense.totalAmount)}
      </Text>
    </Pressable>
  );
}

export default function Expenses() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<ApiExpense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [query, setQuery] = useState('');

  // Modal State
  const [modal, setModal] = useState<{ open: boolean; expense?: ApiExpense }>({ open: false });

  // Month navigation state: defaults to current year and month
  const today = new Date(new Date().getTime() + 8 * 60 * 60 * 1000);
  const [selectedYear, setSelectedYear] = useState<number>(today.getUTCFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getUTCMonth()); // 0-11

  // "Load more" state: tracks how many days into the month are shown
  const todayDateNum = today.getUTCDate();
  const [visibleUntilDay, setVisibleUntilDay] = useState<number>(todayDateNum);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Sync recurring bills and income streams for the selected month first
      await fetch(`${API_BASE_URL}/recurring/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedYear,
          month: selectedMonth + 1, // Convert 0-indexed to 1-12
        }),
      });

      // 2. Fetch updated records
      const [expData, catData, merData] = await Promise.all([
        fetchExpenses(),
        fetchCategories(),
        fetchMerchants(),
      ]);
      setExpenses(expData);
      setCategories(catData);
      setMerchants(merData);
    } catch (err) {
      console.error('Failed to load expense data:', err);
    }
    setLoading(false);
  };

  // Trigger data load & sync whenever selected month or year changes
  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
    setVisibleUntilDay(31); 
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
    setVisibleUntilDay(31);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const formattedMonthLabel = `${monthNames[selectedMonth]} ${selectedYear}`;

  const categoryMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const filteredExpenses = useMemo(() => {
    const q = query.trim().toLowerCase();
    
    const pad = (n: number) => String(n).padStart(2, '0');
    const monthStr = pad(selectedMonth + 1);
    const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const maxDay = Math.min(visibleUntilDay, lastDayOfMonth);

    const rangeStart = `${selectedYear}-${monthStr}-01`;
    const rangeEnd = `${selectedYear}-${monthStr}-${pad(maxDay)}`;

    return expenses.filter((e) => {
      const expDate = e.date ? e.date.substring(0, 10) : '';
      const inDateRange = expDate >= rangeStart && expDate <= rangeEnd;
      
      const matchesCategory = selectedCategory === 'All' || e.categoryId === selectedCategory || e.categoryName === selectedCategory;
      const itemName = e.items?.[0]?.name || '';
      const merchantName = e.merchantName || '';
      const matchesQuery = !q || itemName.toLowerCase().includes(q) || merchantName.toLowerCase().includes(q);
      
      return inDateRange && matchesCategory && matchesQuery;
    });
  }, [expenses, selectedCategory, query, selectedYear, selectedMonth, visibleUntilDay]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.totalAmount, 0);
  
  const lastDayOfSelectedMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const canLoadMore = visibleUntilDay < lastDayOfSelectedMonth;

  const handleSaveModal = async (values: any) => {
    if (modal.expense?.id) {
      await updateExpense(modal.expense.id, values);
    } else {
      await createExpense(values);
    }
    setModal({ open: false });
    loadData();
  };

  const filterOptions = ['All', ...categories.map((c) => c.name)];

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.headerRow}>
          <View style={s.titleGroup}>
            <Text style={s.title}>Expenses</Text>
            <Pressable 
              style={s.gearBtn} 
              hitSlop={8} 
              onPress={() => router.push('/expense-categories')}
            >
              <Ionicons name="settings-outline" size={18} color={colors.muted} />
            </Pressable>
          </View>

          <Pressable style={s.addBtn} onPress={() => setModal({ open: true, expense: undefined })}>
            <Ionicons name="add" size={16} color={colors.bg} />
            <Text style={s.addBtnText}>Add expense</Text>
          </Pressable>
        </View>

        {/* Month Selector Bar */}
        <View style={[s.card, s.monthSelectorCard]}>
          <Pressable style={s.monthNavBtn} onPress={handlePrevMonth} hitSlop={8}>
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={s.monthTitle}>{formattedMonthLabel}</Text>
          <Pressable style={s.monthNavBtn} onPress={handleNextMonth} hitSlop={8}>
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={[s.card, s.summary]}>
          <Text style={s.small}>Total Balance / Spent ({formattedMonthLabel})</Text>
          <Text style={s.big}>{peso(totalSpent)}</Text>
        </View>

        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search expenses or merchants"
            placeholderTextColor={colors.muted}
            style={s.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {filterOptions.map((f) => (
            <Chip
              key={f}
              label={f}
              active={selectedCategory === f || (selectedCategory === 'All' && f === 'All')}
              onPress={() => setSelectedCategory(f)}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={s.body}>Loading expenses...</Text>
          </View>
        ) : filteredExpenses.length === 0 ? (
          <View style={[s.card, { alignItems: 'center', paddingVertical: 28 }]}>
            <Text style={s.body}>No expenses found</Text>
            <Text style={s.small}>Try changing your filter or month selection.</Text>
          </View>
        ) : (
          <View style={[s.card, { padding: 0 }]}>
            {filteredExpenses.map((expense, i) => {
              const cat = categoryMap.get(expense.categoryId);
              return (
                <ExpenseRow
                  key={expense.id}
                  expense={expense}
                  first={i === 0}
                  categoryIcon={cat?.icon}
                  onPress={() => setModal({ open: true, expense })}
                />
              );
            })}
          </View>
        )}

        {/* Load More Button at the Bottom */}
        {canLoadMore && !loading && (
          <Pressable style={s.loadMoreBtn} onPress={() => setVisibleUntilDay(lastDayOfSelectedMonth)}>
            <Text style={s.loadMoreText}>Load earlier this month</Text>
          </Pressable>
        )}
      </ScrollView>

      <ExpenseModal
        visible={modal.open}
        expense={modal.expense}
        onClose={() => setModal({ open: false })}
        onSave={handleSaveModal}
      />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 22, gap: 12, width: '100%', maxWidth: 760, alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { color: colors.text, fontFamily: fonts.medium, fontSize: 22 },
  gearBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.teal,
    borderRadius: 99,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addBtnText: { color: colors.bg, fontFamily: fonts.medium, fontSize: 13 },
  monthSelectorCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  monthNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    color: colors.text,
    fontFamily: fonts.medium,
    fontSize: 16,
  },
  card: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14 },
  summary: { alignItems: 'flex-start' },
  big: { color: colors.text, fontFamily: fonts.medium, fontSize: 24, marginTop: 2 },
  small: { color: colors.muted, fontFamily: fonts.regular, fontSize: 12 },
  body: { color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 14,
    height: 40,
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(22,186,197,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  statusPending: {
    backgroundColor: 'rgba(241, 196, 15, 0.12)',
    borderColor: 'rgba(241, 196, 15, 0.4)',
  },
  statusPaid: {
    backgroundColor: 'rgba(46, 204, 113, 0.12)',
    borderColor: 'rgba(46, 204, 113, 0.4)',
  },
  statusText: {
    fontFamily: fonts.regular,
    fontSize: 11,
  },
  statusTextPending: {
    color: '#f1c40f',
  },
  statusTextPaid: {
    color: '#2ecc71',
  },
  pmChip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.bg,
  },
  pmChipText: { color: colors.muted, fontFamily: fonts.regular, fontSize: 11 },
  amount: { color: colors.text, fontFamily: fonts.medium, fontSize: 14, minWidth: 70, textAlign: 'right' },
  loadMoreBtn: {
    alignSelf: 'center',
    borderColor: colors.teal,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(22,186,197,0.1)',
    marginTop: 4,
    marginBottom: 20,
  },
  loadMoreText: {
    color: colors.teal,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
});